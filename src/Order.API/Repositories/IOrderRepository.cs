using Order.API.DTOs;

namespace Order.API.Repositories;

using OrderEntity = Entities.Order;

public interface IOrderRepository
{
    Task<IEnumerable<OrderEntity>> GetAllAsync();
    Task<OrderEntity?> GetByIdAsync(int id);
    Task<IEnumerable<OrderEntity>> GetByCustomerEmailAsync(string email);
    Task<OrderEntity> CreateAsync(OrderEntity order);
    Task UpdateAsync(OrderEntity order);
    Task DeleteAsync(int id);
}
