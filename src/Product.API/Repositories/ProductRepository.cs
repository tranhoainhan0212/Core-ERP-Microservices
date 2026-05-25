using Microsoft.EntityFrameworkCore;
using Product.API.Data;

namespace Product.API.Repositories;

using ProductEntity = Entities.Product;

public class ProductRepository : IProductRepository
{
    private readonly ProductDbContext _context;

    public ProductRepository(ProductDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ProductEntity>> GetAllAsync()
    {
        return await _context.Products
            .Where(p => p.IsActive)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<ProductEntity?> GetByIdAsync(int id)
    {
        return await _context.Products
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive);
    }

    public async Task<ProductEntity?> GetBySkuAsync(string sku)
    {
        return await _context.Products
            .FirstOrDefaultAsync(p => p.SKU == sku && p.IsActive);
    }

    public async Task<ProductEntity> CreateAsync(ProductEntity product)
    {
        _context.Products.Add(product);
        await _context.SaveChangesAsync();
        return product;
    }

    public async Task UpdateAsync(ProductEntity product)
    {
        product.UpdatedAt = DateTime.UtcNow;
        _context.Products.Update(product);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> SoftDeleteAsync(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product is null || !product.IsActive)
            return false;

        product.IsActive = false;
        product.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// Trừ kho an toàn bằng Optimistic Concurrency —
    /// chỉ trừ nếu StockQuantity >= quantity (tránh race condition).
    /// Dùng raw SQL để đảm bảo atomicity ở database level.
    /// </summary>
    public async Task<bool> ReduceStockAsync(int productId, int quantity)
    {
        var affected = await _context.Database.ExecuteSqlInterpolatedAsync(
            $@"UPDATE Products
               SET StockQuantity = StockQuantity - {quantity},
                   UpdatedAt = GETUTCDATE()
               WHERE Id = {productId}
                 AND StockQuantity >= {quantity}
                 AND IsActive = 1");

        return affected > 0;
    }

    public async Task<bool> RestoreStockAsync(int productId, int quantity)
    {
        var affected = await _context.Database.ExecuteSqlInterpolatedAsync(
            $@"UPDATE Products
               SET StockQuantity = StockQuantity + {quantity},
                   UpdatedAt = GETUTCDATE()
               WHERE Id = {productId}
                 AND IsActive = 1");

        return affected > 0;
    }
}
