namespace Order.API.DTOs;

public record OrderDto(
    int Id,
    string OrderNumber,
    string CustomerName,
    string CustomerEmail,
    decimal TotalAmount,
    string Status,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record OrderDetailDto(
    int Id,
    string OrderNumber,
    string CustomerName,
    string CustomerEmail,
    decimal TotalAmount,
    string Status,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    List<OrderItemDto> Items
);

public record OrderItemDto(
    int ProductId,
    string ProductName,
    decimal UnitPrice,
    int Quantity,
    decimal SubTotal
);

public record CreateOrderDto(
    string? CustomerName,
    string? CustomerEmail,
    string PaymentMethod,
    List<CreateOrderItemDto> Items
);

public record CreateOrderItemDto(
    int ProductId,
    int Quantity
);

// DTOs for Product.API integration
public record ProductStockDto(
    int ProductId,
    string Name,
    int StockQuantity,
    bool InStock
);

public record ProductInfoDto(
    int Id,
    string Name,
    decimal Price,
    bool IsActive
);

public record CheckoutFromCartDto(string PaymentMethod);

public record CheckoutResponseDto(
    int OrderId,
    string OrderNumber,
    string Status,
    decimal TotalAmount,
    string PaymentMethod,
    string? PaymentUrl
);
