using Microsoft.EntityFrameworkCore;
using Order.API.Data;
using Order.API.DTOs;
using Order.API.Entities;

namespace Order.API.Services;

public interface ICartService
{
    Task<IReadOnlyList<CartItemDto>> GetItemsAsync(string userId);
    Task UpsertItemAsync(string userId, UpsertCartItemDto item);
    Task RemoveItemAsync(string userId, int productId);
    Task ClearAsync(string userId);
}

public class DbCartService : ICartService
{
    private readonly OrderDbContext _db;

    public DbCartService(OrderDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<CartItemDto>> GetItemsAsync(string userId)
    {
        return await _db.CartItems
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.UpdatedAt)
            .Select(x => new CartItemDto(x.ProductId, x.Quantity))
            .ToListAsync();
    }

    public async Task UpsertItemAsync(string userId, UpsertCartItemDto item)
    {
        var existing = await _db.CartItems
            .FirstOrDefaultAsync(x => x.UserId == userId && x.ProductId == item.ProductId);

        if (item.Quantity <= 0)
        {
            if (existing is not null)
            {
                _db.CartItems.Remove(existing);
                await _db.SaveChangesAsync();
            }
            return;
        }

        if (existing is null)
        {
            _db.CartItems.Add(new CartItem
            {
                UserId = userId,
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }
        else
        {
            existing.Quantity = item.Quantity;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
    }

    public async Task RemoveItemAsync(string userId, int productId)
    {
        var existing = await _db.CartItems
            .FirstOrDefaultAsync(x => x.UserId == userId && x.ProductId == productId);

        if (existing is null)
        {
            return;
        }

        _db.CartItems.Remove(existing);
        await _db.SaveChangesAsync();
    }

    public async Task ClearAsync(string userId)
    {
        var items = await _db.CartItems.Where(x => x.UserId == userId).ToListAsync();
        if (items.Count == 0)
        {
            return;
        }

        _db.CartItems.RemoveRange(items);
        await _db.SaveChangesAsync();
    }
}
