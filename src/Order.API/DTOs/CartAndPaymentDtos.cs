namespace Order.API.DTOs;

public record CartItemDto(int ProductId, int Quantity);

public record UpsertCartItemDto(int ProductId, int Quantity);

public record CartSummaryItemDto(int ProductId, string ProductName, decimal UnitPrice, int Quantity, decimal SubTotal);

public record CartSummaryDto(List<CartSummaryItemDto> Items, decimal TotalAmount);

public record PaymentRequestDto(int OrderId, string PaymentMethod, string? ReturnUrl);

public record PaymentResultDto(string Provider, string TransactionId, string Status, string PaymentUrl, DateTime CreatedAt);
