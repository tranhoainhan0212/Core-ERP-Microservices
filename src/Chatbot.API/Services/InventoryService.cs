// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  Chatbot.API — Services/InventoryService.cs                                ║
// ║  Bản giả lập (Mock) — Dữ liệu đồng bộ với Product.API Seed Data.         ║
// ║                                                                            ║
// ║  🔄 PRODUCTION UPGRADE PATH:                                               ║
// ║  Thay thế _catalog bằng HttpClient gọi sang Product.API:                  ║
// ║  GET http://product-api:8080/api/products?search={productName}            ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

using Chatbot.API.DTOs;

namespace Chatbot.API.Services;

public sealed class InventoryService : IInventoryService
{
    private readonly ILogger<InventoryService> _logger;

    // ───────────────────────────────────────────────────────────────────
    //  📦 Catalog giả lập — ĐỒNG BỘ với Product.API seed data
    //  Mỗi entry map với bảng dbo.Products trong ProductDb
    // ───────────────────────────────────────────────────────────────────
    private static readonly List<ProductStatusDto> _catalog =
    [
        new()
        {
            ProductName = "Samsung Galaxy Z Fold 5",
            SKU = "SAMSUNG-Z-FOLD5",
            CurrentPrice = 40_990_000m,
            StockQuantity = 15,
            StockStatus = "Còn hàng",
            Description = "Màn hình gập 7.6 inch Dynamic AMOLED 2X, Snapdragon 8 Gen 2, Camera 50MP, 256GB",
            ImageUrl = "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf"
        },
        new()
        {
            ProductName = "Samsung Galaxy S24 Ultra",
            SKU = "SAMSUNG-S24U",
            CurrentPrice = 33_990_000m,
            StockQuantity = 49,
            StockStatus = "Còn hàng",
            Description = "Camera 200MP, Snapdragon 8 Gen 3, Tích hợp Galaxy AI, S-Pen, 256GB",
            ImageUrl = "https://images.unsplash.com/photo-1678286742832-26543bb49959"
        },
        new()
        {
            ProductName = "Samsung Galaxy Z Flip 5",
            SKU = "SAMSUNG-Z-FLIP5",
            CurrentPrice = 25_990_000m,
            StockQuantity = 30,
            StockStatus = "Còn hàng",
            Description = "Thiết kế gập vỏ sò, màn hình ngoài 3.4 inch, Snapdragon 8 Gen 2, 256GB",
            ImageUrl = "https://images.unsplash.com/photo-1610945264803-c22b6272af74"
        },
        new()
        {
            ProductName = "Samsung Galaxy A54 5G",
            SKU = "SAMSUNG-A54",
            CurrentPrice = 10_490_000m,
            StockQuantity = 100,
            StockStatus = "Còn hàng",
            Description = "Tầm trung cao cấp, Super AMOLED 120Hz, Exynos 1380, Camera 50MP OIS",
            ImageUrl = "https://images.unsplash.com/photo-1678286743126-77884a4b12aa"
        },
        new()
        {
            ProductName = "Laptop Dell XPS 15",
            SKU = "DELL-XPS15-2024",
            CurrentPrice = 35_000_000m,
            StockQuantity = 49,
            StockStatus = "Còn hàng",
            Description = "Intel Core i7-13700H, 16GB RAM, 512GB SSD, Màn OLED 3.5K 15.6 inch",
            ImageUrl = "https://images.unsplash.com/photo-1517336714739-489689fd1ca8"
        },
        new()
        {
            ProductName = "Chuột Logitech MX Master 3",
            SKU = "LOG-MX3-BLK",
            CurrentPrice = 2_500_000m,
            StockQuantity = 120,
            StockStatus = "Còn hàng",
            Description = "Chuột không dây cao cấp, sạc USB-C, cuộn MagSpeed, kết nối 3 thiết bị",
            ImageUrl = "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46"
        },
        new()
        {
            ProductName = "Điện Thoại Samsung Z Fold",
            SKU = "SSZ-DTH32-2025",
            CurrentPrice = 20_000_000m,
            StockQuantity = 119,
            StockStatus = "Còn hàng",
            Description = "Samsung Z Fold thế hệ mới, đa nhiệm vượt trội"
        },
        new()
        {
            ProductName = "Apple MacBook Pro 14 M4",
            SKU = "APPLE-MBP14-M4",
            CurrentPrice = 49_990_000m,
            StockQuantity = 25,
            StockStatus = "Còn hàng",
            Description = "Chip Apple M4 Pro, 18GB RAM, 512GB SSD, màn Liquid Retina XDR 14.2 inch"
        },
        new()
        {
            ProductName = "Apple iPhone 16 Pro Max",
            SKU = "APPLE-IP16PM",
            CurrentPrice = 34_990_000m,
            StockQuantity = 40,
            StockStatus = "Còn hàng",
            Description = "A18 Pro chip, Camera 48MP chính + 12MP ultrawide, Titanium, 256GB"
        },
        new()
        {
            ProductName = "Sony WH-1000XM5",
            SKU = "SONY-WH1000XM5",
            CurrentPrice = 8_490_000m,
            StockQuantity = 60,
            StockStatus = "Còn hàng",
            Description = "Tai nghe chống ồn cao cấp, 30 giờ pin, Bluetooth 5.3, LDAC"
        }
    ];

    public InventoryService(ILogger<InventoryService> logger)
    {
        _logger = logger;
    }

    /// <inheritdoc />
    public Task<ProductStatusDto?> GetProductStatusAsync(string productName)
    {
        _logger.LogInformation("🔍 [InventoryService] Tra cứu sản phẩm: \"{ProductName}\"", productName);

        // Tìm kiếm fuzzy — so sánh không phân biệt hoa/thường, hỗ trợ từ khóa
        var keyword = productName.Trim().ToLowerInvariant();

        var product = _catalog.FirstOrDefault(p =>
            p.ProductName.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
            p.SKU.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
            keyword.Contains(p.ProductName.ToLowerInvariant()) ||
            // Hỗ trợ tìm kiếm bằng từ khóa ngắn như "Z Fold", "S24", "XPS"
            keyword.Split(' ').All(word =>
                p.ProductName.Contains(word, StringComparison.OrdinalIgnoreCase)));

        if (product is not null)
        {
            _logger.LogInformation(
                "✅ Tìm thấy: {Name} | Giá: {Price:N0}đ | Tồn kho: {Stock}",
                product.ProductName, product.CurrentPrice, product.StockQuantity);
        }
        else
        {
            _logger.LogWarning("⚠️ Không tìm thấy sản phẩm: \"{ProductName}\"", productName);
        }

        return Task.FromResult(product);
    }

    /// <inheritdoc />
    public async Task<List<ProductStatusDto>> GetMultipleProductsAsync(IEnumerable<string> productNames)
    {
        var results = new List<ProductStatusDto>();

        foreach (var name in productNames)
        {
            var product = await GetProductStatusAsync(name);
            if (product is not null)
                results.Add(product);
        }

        return results;
    }
}
