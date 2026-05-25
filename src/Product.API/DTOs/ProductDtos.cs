namespace Product.API.DTOs;

public record ProductDto(
    int Id,
    string Name,
    string SKU,
    decimal Price,
    int StockQuantity,
    string? Description,
    string? ImageUrl,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record ProductStockDto(
    int ProductId,
    string Name,
    int StockQuantity,
    bool InStock
);

public record CreateProductDto(
    string Name,
    string SKU,
    decimal Price,
    int StockQuantity,
    string? Description,
    string? ImageUrl
);

public record UpdateProductDto(
    string Name,
    decimal Price,
    string? Description,
    string? ImageUrl
);

public record StockOperationDto(int Quantity);
