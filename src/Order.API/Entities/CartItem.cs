using System.ComponentModel.DataAnnotations;

namespace Order.API.Entities;

public class CartItem
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string UserId { get; set; } = string.Empty;

    [Required]
    public int ProductId { get; set; }

    public int Quantity { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
