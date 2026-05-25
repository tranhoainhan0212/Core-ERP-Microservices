using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Order.API.Data;
using Order.API.DTOs;
using Order.API.Entities;

namespace Order.API.Services;

public interface IPaymentService
{
    Task<PaymentResultDto> CreatePaymentAsync(PaymentRequestDto request, decimal amount);
    bool IsSupportedMethod(string method);
    Task<(bool Success, int? OrderId, string Status, string Message)> HandleCallbackAsync(string provider, Dictionary<string, string> query);
}

public class GatewayPaymentService : IPaymentService
{
    private readonly IConfiguration _configuration;
    private readonly OrderDbContext _db;
    private readonly HttpClient _httpClient;

    private static readonly HashSet<string> Supported = new(StringComparer.OrdinalIgnoreCase) { "MOMO", "VNPAY", "COD" };

    public GatewayPaymentService(IConfiguration configuration, OrderDbContext db, IHttpClientFactory httpClientFactory)
    {
        _configuration = configuration;
        _db = db;
        _httpClient = httpClientFactory.CreateClient();
    }

    public bool IsSupportedMethod(string method) => Supported.Contains(method);

    public async Task<PaymentResultDto> CreatePaymentAsync(PaymentRequestDto request, decimal amount)
    {
        var provider = request.PaymentMethod.Trim().ToUpperInvariant();
        var transactionId = $"{provider}-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..8]}";

        string paymentUrl = string.Empty;
        string status;

        if (provider == "COD")
        {
            status = "PendingCOD";
        }
        else if (provider == "VNPAY")
        {
            paymentUrl = BuildVnpayUrl(request.OrderId, transactionId, amount, request.ReturnUrl);
            status = "PendingGateway";
        }
        else
        {
            var momo = await BuildMomoUrlAsync(request.OrderId, transactionId, amount, request.ReturnUrl);
            paymentUrl = momo.PaymentUrl;
            status = momo.Status;
        }

        _db.PaymentTransactions.Add(new PaymentTransaction
        {
            OrderId = request.OrderId,
            Provider = provider,
            TransactionId = transactionId,
            Status = status,
            PaymentUrl = paymentUrl,
            RawRequest = $"amount={amount.ToString(CultureInfo.InvariantCulture)}"
        });

        await _db.SaveChangesAsync();

        return new PaymentResultDto(provider, transactionId, status, paymentUrl, DateTime.UtcNow);
    }

    public async Task<(bool Success, int? OrderId, string Status, string Message)> HandleCallbackAsync(string provider, Dictionary<string, string> query)
    {
        var normalizedProvider = provider.Trim().ToUpperInvariant();

        if (normalizedProvider == "VNPAY")
        {
            return await HandleVnpayCallbackAsync(query);
        }

        if (normalizedProvider == "MOMO")
        {
            return await HandleMomoCallbackAsync(query);
        }

        return (false, null, "Unknown", "Unsupported payment provider callback.");
    }

    private string BuildVnpayUrl(int orderId, string transactionId, decimal amount, string? returnUrl)
    {
        var baseUrl = _configuration["Payment:VNPay:BaseUrl"] ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
        var tmnCode = _configuration["Payment:VNPay:TmnCode"] ?? "DEMO_TMNCODE";
        var hashSecret = _configuration["Payment:VNPay:HashSecret"] ?? "DEMO_HASH_SECRET";
        var finalReturnUrl = string.IsNullOrWhiteSpace(returnUrl)
            ? _configuration["Payment:VNPay:ReturnUrl"] ?? "http://localhost:3000/cart"
            : returnUrl;

        var data = new SortedDictionary<string, string>
        {
            ["vnp_Version"] = "2.1.0",
            ["vnp_Command"] = "pay",
            ["vnp_TmnCode"] = tmnCode,
            ["vnp_Amount"] = ((long)(amount * 100)).ToString(),
            ["vnp_CreateDate"] = DateTime.UtcNow.ToString("yyyyMMddHHmmss"),
            ["vnp_CurrCode"] = "VND",
            ["vnp_IpAddr"] = "127.0.0.1",
            ["vnp_Locale"] = "vn",
            ["vnp_OrderInfo"] = $"Thanh toan don hang {orderId}",
            ["vnp_OrderType"] = "other",
            ["vnp_ReturnUrl"] = finalReturnUrl,
            ["vnp_TxnRef"] = transactionId
        };

        var queryString = string.Join("&", data.Select(kvp => $"{kvp.Key}={System.Net.WebUtility.UrlEncode(kvp.Value)}"));
        var secureHash = ComputeHmacSha512(hashSecret, queryString);
        return $"{baseUrl}?{queryString}&vnp_SecureHash={secureHash}";
    }

    private async Task<(string PaymentUrl, string Status)> BuildMomoUrlAsync(int orderId, string transactionId, decimal amount, string? returnUrl)
    {
        var endpoint = _configuration["Payment:MoMo:Endpoint"] ?? "https://test-payment.momo.vn/v2/gateway/api/create";
        var partnerCode = _configuration["Payment:MoMo:PartnerCode"] ?? "MOMO_DEMO";
        var accessKey = _configuration["Payment:MoMo:AccessKey"] ?? "MOMO_ACCESS_KEY";
        var secretKey = _configuration["Payment:MoMo:SecretKey"] ?? "MOMO_SECRET_KEY";
        var redirectUrl = string.IsNullOrWhiteSpace(returnUrl)
            ? _configuration["Payment:MoMo:ReturnUrl"] ?? "http://localhost:3000/cart"
            : returnUrl;
        var ipnUrl = _configuration["Payment:MoMo:IpnUrl"] ?? "http://localhost:5000/api/payments/callback/momo";

        var rawSignature = $"accessKey={accessKey}&amount={(long)amount}&extraData=&ipnUrl={ipnUrl}&orderId={orderId}&orderInfo=Thanh toan don hang {orderId}&partnerCode={partnerCode}&redirectUrl={redirectUrl}&requestId={transactionId}&requestType=captureWallet";
        var signature = ComputeHmacSha256(secretKey, rawSignature);

        var payload = new
        {
            partnerCode,
            requestId = transactionId,
            amount = ((long)amount).ToString(),
            orderId = orderId.ToString(),
            orderInfo = $"Thanh toan don hang {orderId}",
            redirectUrl,
            ipnUrl,
            lang = "vi",
            requestType = "captureWallet",
            autoCapture = true,
            extraData = string.Empty,
            signature
        };

        try
        {
            var response = await _httpClient.PostAsJsonAsync(endpoint, payload);
            if (!response.IsSuccessStatusCode)
            {
                return ($"https://test-payment.momo.vn/pay?orderId={orderId}&transactionId={transactionId}", "PendingGateway");
            }

            var json = await response.Content.ReadFromJsonAsync<MoMoCreateResponse>();
            if (json is null || string.IsNullOrWhiteSpace(json.PayUrl))
            {
                return ($"https://test-payment.momo.vn/pay?orderId={orderId}&transactionId={transactionId}", "PendingGateway");
            }

            return (json.PayUrl, "PendingGateway");
        }
        catch
        {
            return ($"https://test-payment.momo.vn/pay?orderId={orderId}&transactionId={transactionId}", "PendingGateway");
        }
    }

    private async Task<(bool Success, int? OrderId, string Status, string Message)> HandleVnpayCallbackAsync(Dictionary<string, string> query)
    {
        if (!query.TryGetValue("vnp_TxnRef", out var txnRef) || !query.TryGetValue("vnp_ResponseCode", out var responseCode))
        {
            return (false, null, "Failed", "Missing VNPay callback parameters.");
        }

        var providedHash = query.TryGetValue("vnp_SecureHash", out var hash) ? hash : string.Empty;
        var hashSecret = _configuration["Payment:VNPay:HashSecret"] ?? "DEMO_HASH_SECRET";
        var data = query
            .Where(x => x.Key.StartsWith("vnp_", StringComparison.OrdinalIgnoreCase) && x.Key != "vnp_SecureHash" && x.Key != "vnp_SecureHashType")
            .OrderBy(x => x.Key)
            .Select(x => $"{x.Key}={System.Net.WebUtility.UrlEncode(x.Value)}");

        var check = ComputeHmacSha512(hashSecret, string.Join("&", data));
        if (!string.Equals(check, providedHash, StringComparison.OrdinalIgnoreCase))
        {
            return (false, null, "Failed", "Invalid VNPay signature.");
        }

        var tx = await _db.PaymentTransactions.FirstOrDefaultAsync(x => x.TransactionId == txnRef);
        if (tx is null)
        {
            return (false, null, "Failed", "Transaction not found.");
        }

        tx.Status = responseCode == "00" ? "Success" : "Failed";
        tx.RawCallback = string.Join("&", query.Select(x => $"{x.Key}={x.Value}"));
        tx.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return (true, tx.OrderId, tx.Status, "VNPay callback processed.");
    }

    private async Task<(bool Success, int? OrderId, string Status, string Message)> HandleMomoCallbackAsync(Dictionary<string, string> query)
    {
        if (!query.TryGetValue("requestId", out var requestId) || !query.TryGetValue("resultCode", out var resultCode))
        {
            return (false, null, "Failed", "Missing MoMo callback parameters.");
        }

        var secretKey = _configuration["Payment:MoMo:SecretKey"] ?? "MOMO_SECRET_KEY";
        var partnerCode = query.GetValueOrDefault("partnerCode", "");
        var orderId = query.GetValueOrDefault("orderId", "");
        var amount = query.GetValueOrDefault("amount", "");
        var orderInfo = query.GetValueOrDefault("orderInfo", "");
        var orderType = query.GetValueOrDefault("orderType", "");
        var transId = query.GetValueOrDefault("transId", "");
        var message = query.GetValueOrDefault("message", "");
        var responseTime = query.GetValueOrDefault("responseTime", "");
        var extraData = query.GetValueOrDefault("extraData", "");
        var providedSignature = query.GetValueOrDefault("signature", "");

        var rawSignature = $"accessKey={_configuration["Payment:MoMo:AccessKey"]}&amount={amount}&extraData={extraData}&message={message}&orderId={orderId}&orderInfo={orderInfo}&orderType={orderType}&partnerCode={partnerCode}&payType={query.GetValueOrDefault("payType", "")}&requestId={requestId}&responseTime={responseTime}&resultCode={resultCode}&transId={transId}";
        var expectedSignature = ComputeHmacSha256(secretKey, rawSignature);

        if (!string.IsNullOrWhiteSpace(providedSignature)
            && !string.Equals(providedSignature, expectedSignature, StringComparison.OrdinalIgnoreCase))
        {
            return (false, null, "Failed", "Invalid MoMo signature.");
        }

        var tx = await _db.PaymentTransactions.FirstOrDefaultAsync(x => x.TransactionId == requestId);
        if (tx is null)
        {
            return (false, null, "Failed", "Transaction not found.");
        }

        tx.Status = resultCode == "0" ? "Success" : "Failed";
        tx.RawCallback = string.Join("&", query.Select(x => $"{x.Key}={x.Value}"));
        tx.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return (true, tx.OrderId, tx.Status, "MoMo callback processed.");
    }

    private static string ComputeHmacSha256(string key, string rawData)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(rawData));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static string ComputeHmacSha512(string key, string rawData)
    {
        using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(key));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(rawData));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private sealed class MoMoCreateResponse
    {
        public string? PayUrl { get; set; }
    }
}
