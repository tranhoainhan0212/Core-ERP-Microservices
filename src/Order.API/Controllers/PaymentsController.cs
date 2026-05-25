using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Order.API.DTOs;
using Order.API.Repositories;
using Order.API.Services;

namespace Order.API.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly IOrderRepository _orderRepository;
    private readonly IConfiguration _configuration;

    public PaymentsController(IPaymentService paymentService, IOrderRepository orderRepository, IConfiguration configuration)
    {
        _paymentService = paymentService;
        _orderRepository = orderRepository;
        _configuration = configuration;
    }

    [HttpPost("create")]
    [Authorize]
    public async Task<ActionResult<PaymentResultDto>> CreatePayment([FromBody] PaymentRequestDto request)
    {
        var order = await _orderRepository.GetByIdAsync(request.OrderId);
        if (order is null)
        {
            return NotFound(new { message = "Order not found." });
        }

        var userEmail = User.FindFirst("email")?.Value;
        var role = User.FindFirst("role")?.Value;
        if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(userEmail, order.CustomerEmail, StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        if (!_paymentService.IsSupportedMethod(request.PaymentMethod))
        {
            return BadRequest(new { message = "Unsupported payment method. Allowed: MOMO, VNPAY, COD." });
        }

        var result = await _paymentService.CreatePaymentAsync(request, order.TotalAmount);
        order.Status = result.Provider == "COD" ? "Confirmed" : "PendingPayment";
        await _orderRepository.UpdateAsync(order);

        return Ok(result);
    }

    [HttpGet("callback/{provider}")]
    [AllowAnonymous]
    public async Task<IActionResult> PaymentCallback([FromRoute] string provider)
    {
        var query = Request.Query.ToDictionary(x => x.Key, x => x.Value.ToString());
        var callback = await _paymentService.HandleCallbackAsync(provider, query);
        var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";
        if (!callback.Success || callback.OrderId is null)
        {
            return Redirect($"{frontendUrl}/payment-result?vnp_ResponseCode=99");
        }

        var order = await _orderRepository.GetByIdAsync(callback.OrderId.Value);
        if (order is null)
        {
            return Redirect($"{frontendUrl}/payment-result?vnp_ResponseCode=99");
        }

        order.Status = callback.Status == "Success" ? "Confirmed" : "PaymentFailed";
        await _orderRepository.UpdateAsync(order);

        var code = callback.Status == "Success" ? "00" : "99";
        return Redirect($"{frontendUrl}/payment-result?vnp_ResponseCode={code}&orderId={order.Id}");
    }
}
