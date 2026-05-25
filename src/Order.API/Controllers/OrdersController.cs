using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Order.API.DTOs;
using Order.API.HttpClients;
using Order.API.Repositories;
using Order.API.Services;
using OrderEntity = Order.API.Entities.Order;
using OrderItemEntity = Order.API.Entities.OrderItem;

namespace Order.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IOrderRepository _orderRepo;
    private readonly IProductApiClient _productClient;
    private readonly IMapper _mapper;
    private readonly ILogger<OrdersController> _logger;
    private readonly IPaymentService _paymentService;
    private readonly ICartService _cartService;

    public OrdersController(
        IOrderRepository orderRepo,
        IProductApiClient productClient,
        IMapper mapper,
        ILogger<OrdersController> logger,
        IPaymentService paymentService,
        ICartService cartService)
    {
        _orderRepo = orderRepo;
        _productClient = productClient;
        _mapper = mapper;
        _logger = logger;
        _paymentService = paymentService;
        _cartService = cartService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(IEnumerable<OrderDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetOrders()
    {
        var orders = await _orderRepo.GetAllAsync();
        return Ok(_mapper.Map<IEnumerable<OrderDto>>(orders));
    }

    [HttpGet("mine")]
    [ProducesResponseType(typeof(IEnumerable<OrderDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetMyOrders()
    {
        var (_, email, _, _) = GetCurrentUser();
        var orders = await _orderRepo.GetByCustomerEmailAsync(email);
        return Ok(_mapper.Map<IEnumerable<OrderDto>>(orders));
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(OrderDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OrderDetailDto>> GetOrder(int id)
    {
        var order = await _orderRepo.GetByIdAsync(id);
        if (order is null)
        {
            return NotFound(new { message = $"Order with ID {id} not found." });
        }

        var (_, email, _, role) = GetCurrentUser();
        if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(order.CustomerEmail, email, StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        return Ok(_mapper.Map<OrderDetailDto>(order));
    }

    [HttpPost]
    [ProducesResponseType(typeof(CheckoutResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CheckoutResponseDto>> CreateOrder([FromBody] CreateOrderDto request)
    {
        if (request.Items is null || request.Items.Count == 0)
        {
            return BadRequest(new { message = "Order must contain at least one item." });
        }

        var (nameFromToken, emailFromToken, _, _) = GetCurrentUser();
        var customerName = string.IsNullOrWhiteSpace(request.CustomerName) ? nameFromToken : request.CustomerName.Trim();
        var customerEmail = string.IsNullOrWhiteSpace(request.CustomerEmail) ? emailFromToken : request.CustomerEmail.Trim();

        var response = await BuildAndPersistOrderAsync(customerName, customerEmail, request.PaymentMethod, request.Items);
        return CreatedAtAction(nameof(GetOrder), new { id = response.OrderId }, response);
    }

    [HttpPost("checkout-from-cart")]
    [ProducesResponseType(typeof(CheckoutResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CheckoutResponseDto>> CheckoutFromCart([FromBody] CheckoutFromCartDto request)
    {
        var (name, email, userId, _) = GetCurrentUser();
        var cartItems = await _cartService.GetItemsAsync(userId);
        if (cartItems.Count == 0)
        {
            return BadRequest(new { message = "Cart is empty." });
        }

        var createItems = cartItems.Select(x => new CreateOrderItemDto(x.ProductId, x.Quantity)).ToList();
        var response = await BuildAndPersistOrderAsync(name, email, request.PaymentMethod, createItems);

        if (request.PaymentMethod.Equals("COD", StringComparison.OrdinalIgnoreCase))
        {
            await _cartService.ClearAsync(userId);
        }
        
        return CreatedAtAction(nameof(GetOrder), new { id = response.OrderId }, response);
    }

    [HttpPut("{id:int}/cancel")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelOrder(int id)
    {
        var order = await _orderRepo.GetByIdAsync(id);
        if (order is null)
        {
            return NotFound(new { message = $"Order with ID {id} not found." });
        }

        var (_, email, _, role) = GetCurrentUser();
        if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(order.CustomerEmail, email, StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        if (order.Status == "Cancelled")
        {
            return BadRequest(new { message = "Order is already cancelled." });
        }

        foreach (var item in order.Items)
        {
            await _productClient.RestoreStockAsync(item.ProductId, item.Quantity);
        }

        order.Status = "Cancelled";
        await _orderRepo.UpdateAsync(order);

        _logger.LogInformation("Order {OrderNumber} cancelled. Stock restored.", order.OrderNumber);
        return Ok(new { message = "Order cancelled successfully." });
    }

    private async Task<CheckoutResponseDto> BuildAndPersistOrderAsync(
        string customerName,
        string customerEmail,
        string paymentMethod,
        List<CreateOrderItemDto> requestItems)
    {
        var normalizedPaymentMethod = paymentMethod.Trim().ToUpperInvariant();
        if (!_paymentService.IsSupportedMethod(normalizedPaymentMethod))
        {
            throw new BadHttpRequestException("Unsupported payment method. Allowed: MOMO, VNPAY, COD.");
        }

        var orderItems = new List<OrderItemEntity>();
        foreach (var item in requestItems)
        {
            if (item.Quantity <= 0)
            {
                throw new BadHttpRequestException($"Quantity for Product {item.ProductId} must be > 0.");
            }

            var product = await _productClient.GetProductAsync(item.ProductId);
            if (product is null || !product.IsActive)
            {
                throw new BadHttpRequestException($"Product {item.ProductId} not found or inactive.");
            }

            var stock = await _productClient.GetStockAsync(item.ProductId);
            if (stock is null || stock.StockQuantity < item.Quantity)
            {
                var available = stock?.StockQuantity ?? 0;
                throw new BadHttpRequestException($"Insufficient stock for '{product.Name}'. Available: {available}, Requested: {item.Quantity}");
            }

            orderItems.Add(new OrderItemEntity
            {
                ProductId = item.ProductId,
                ProductName = product.Name,
                UnitPrice = product.Price,
                Quantity = item.Quantity
            });
        }

        var reducedProducts = new List<(int ProductId, int Quantity)>();
        foreach (var item in orderItems)
        {
            var success = await _productClient.ReduceStockAsync(item.ProductId, item.Quantity);
            if (!success)
            {
                foreach (var reduced in reducedProducts)
                {
                    await _productClient.RestoreStockAsync(reduced.ProductId, reduced.Quantity);
                }

                throw new BadHttpRequestException($"Failed to reserve stock for '{item.ProductName}'. Order cancelled.");
            }

            reducedProducts.Add((item.ProductId, item.Quantity));
        }

        var order = new OrderEntity
        {
            OrderNumber = $"ORD-{DateTime.UtcNow:yyMMdd}-{Guid.NewGuid().ToString()[..8].ToUpperInvariant()}",
            CustomerName = customerName,
            CustomerEmail = customerEmail,
            Status = normalizedPaymentMethod == "COD" ? "Confirmed" : "PendingPayment",
            TotalAmount = orderItems.Sum(i => i.SubTotal),
            Items = orderItems
        };

        try
        {
            await _orderRepo.CreateAsync(order);
        }
        catch
        {
            foreach (var reduced in reducedProducts)
            {
                await _productClient.RestoreStockAsync(reduced.ProductId, reduced.Quantity);
            }

            throw;
        }

        string? paymentUrl = null;
        if (normalizedPaymentMethod is "MOMO" or "VNPAY")
        {
            var payment = await _paymentService.CreatePaymentAsync(new PaymentRequestDto(order.Id, normalizedPaymentMethod, null), order.TotalAmount);
            paymentUrl = payment.PaymentUrl;
        }

        return new CheckoutResponseDto(
            order.Id,
            order.OrderNumber,
            order.Status,
            order.TotalAmount,
            normalizedPaymentMethod,
            paymentUrl);
    }

    [HttpPut("{id:int}/status")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusDto request)
    {
        var order = await _orderRepo.GetByIdAsync(id);
        if (order is null) return NotFound(new { message = $"Order with ID {id} not found." });

        order.Status = request.Status;
        await _orderRepo.UpdateAsync(order);
        _logger.LogInformation("Order {OrderId} status updated to {Status}", id, request.Status);
        
        return Ok(new { message = "Status updated successfully" });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteOrder(int id)
    {
        var order = await _orderRepo.GetByIdAsync(id);
        if (order is null) return NotFound(new { message = $"Order with ID {id} not found." });

        await _orderRepo.DeleteAsync(id);
        _logger.LogInformation("Order {OrderId} deleted by Admin", id);
        
        return Ok(new { message = "Order deleted successfully" });
    }

    private (string Name, string Email, string UserId, string Role) GetCurrentUser()
    {
        var name = User.FindFirst("name")?.Value ?? "Customer";
        var email = User.FindFirst("email")?.Value ?? string.Empty;
        var userId = User.FindFirst("sub")?.Value ?? email;
        var role = User.FindFirst("role")?.Value ?? "Customer";

        if (string.IsNullOrWhiteSpace(email))
        {
            throw new UnauthorizedAccessException("Invalid user token.");
        }

        return (name, email, userId, role);
    }
}
