using Order.API.DTOs;

namespace Order.API.HttpClients;

public interface IProductApiClient
{
    Task<ProductStockDto?> GetStockAsync(int productId);
    Task<ProductInfoDto?> GetProductAsync(int productId);
    Task<bool> ReduceStockAsync(int productId, int quantity);
    Task<bool> RestoreStockAsync(int productId, int quantity);
}
