namespace Product.API.Repositories;

using ProductEntity = Entities.Product;

public interface IProductRepository
{
    Task<IEnumerable<ProductEntity>> GetAllAsync();
    Task<ProductEntity?> GetByIdAsync(int id);
    Task<ProductEntity?> GetBySkuAsync(string sku);
    Task<ProductEntity> CreateAsync(ProductEntity product);
    Task UpdateAsync(ProductEntity product);
    Task<bool> SoftDeleteAsync(int id);
    Task<bool> ReduceStockAsync(int productId, int quantity);
    Task<bool> RestoreStockAsync(int productId, int quantity);
}
