using System.Net;
using Order.API.DTOs;

namespace Order.API.HttpClients;

public class ProductApiClient : IProductApiClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ProductApiClient> _logger;
    private readonly string _internalApiKey;

    public ProductApiClient(HttpClient httpClient, ILogger<ProductApiClient> logger, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _logger = logger;
        _internalApiKey = configuration["Security:InternalApiKey"] ?? "INTERNAL_PRODUCT_ORDER_KEY";
    }

    public async Task<ProductStockDto?> GetStockAsync(int productId)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/products/{productId}/stock");

            if (response.StatusCode == HttpStatusCode.NotFound)
                return null;

            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<ProductStockDto>();
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Failed to check stock for Product {ProductId}", productId);
            throw new Exception("Product service unavailable", ex);
        }
    }

    public async Task<ProductInfoDto?> GetProductAsync(int productId)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/products/{productId}");

            if (response.StatusCode == HttpStatusCode.NotFound)
                return null;

            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<ProductInfoDto>();
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Failed to get Product {ProductId}", productId);
            throw new Exception("Product service unavailable", ex);
        }
    }

    public async Task<bool> ReduceStockAsync(int productId, int quantity)
    {
        try
        {
            var payload = new { quantity };
            using var request = new HttpRequestMessage(HttpMethod.Put, $"/api/products/{productId}/reduce-stock")
            {
                Content = JsonContent.Create(payload)
            };
            request.Headers.Add("X-Internal-ApiKey", _internalApiKey);
            var response = await _httpClient.SendAsync(request);

            if (response.StatusCode == HttpStatusCode.BadRequest)
                return false; // Insufficient stock

            response.EnsureSuccessStatusCode();
            return true;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex,
                "Failed to reduce stock for Product {ProductId}, Qty: {Qty}",
                productId, quantity);
            throw new Exception("Product service unavailable", ex);
        }
    }

    public async Task<bool> RestoreStockAsync(int productId, int quantity)
    {
        try
        {
            var payload = new { quantity };
            using var request = new HttpRequestMessage(HttpMethod.Put, $"/api/products/{productId}/restore-stock")
            {
                Content = JsonContent.Create(payload)
            };
            request.Headers.Add("X-Internal-ApiKey", _internalApiKey);
            var response = await _httpClient.SendAsync(request);

            response.EnsureSuccessStatusCode();
            return true;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex,
                "Failed to restore stock for Product {ProductId}", productId);
            return false; // Log and handle later — don't crash the cancel flow
        }
    }
}
