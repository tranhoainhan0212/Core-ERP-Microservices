using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Order.API.DTOs;
using Order.API.HttpClients;
using Order.API.Services;

namespace Order.API.Controllers;

[ApiController]
[Route("api/cart")]
[Authorize]
public class CartController : ControllerBase
{
    private readonly ICartService _cartService;
    private readonly IProductApiClient _productApiClient;

    public CartController(ICartService cartService, IProductApiClient productApiClient)
    {
        _cartService = cartService;
        _productApiClient = productApiClient;
    }

    [HttpGet]
    public async Task<ActionResult<CartSummaryDto>> GetMyCart()
    {
        var userId = GetUserId();
        var items = await _cartService.GetItemsAsync(userId);
        var summaryItems = new List<CartSummaryItemDto>();

        foreach (var item in items)
        {
            var product = await _productApiClient.GetProductAsync(item.ProductId);
            if (product is null)
            {
                continue;
            }

            summaryItems.Add(new CartSummaryItemDto(
                item.ProductId,
                product.Name,
                product.Price,
                item.Quantity,
                product.Price * item.Quantity));
        }

        var total = summaryItems.Sum(x => x.SubTotal);
        return Ok(new CartSummaryDto(summaryItems, total));
    }

    [HttpPost("items")]
    public async Task<IActionResult> UpsertCartItem([FromBody] UpsertCartItemDto request)
    {
        if (request.ProductId <= 0)
        {
            return BadRequest(new { message = "ProductId must be > 0." });
        }

        var userId = GetUserId();
        await _cartService.UpsertItemAsync(userId, request);
        return Ok(new { message = "Cart updated." });
    }

    [HttpDelete("items/{productId:int}")]
    public async Task<IActionResult> RemoveCartItem(int productId)
    {
        var userId = GetUserId();
        await _cartService.RemoveItemAsync(userId, productId);
        return Ok(new { message = "Item removed from cart." });
    }

    [HttpDelete]
    public async Task<IActionResult> ClearCart()
    {
        var userId = GetUserId();
        await _cartService.ClearAsync(userId);
        return Ok(new { message = "Cart cleared." });
    }

    private string GetUserId()
    {
        return User.FindFirst("sub")?.Value
            ?? User.FindFirst("email")?.Value
            ?? throw new UnauthorizedAccessException("Invalid token");
    }
}
