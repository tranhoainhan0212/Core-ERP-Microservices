using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Order.API.Entities;

public class Order
{
    public int Id { get; set; }

    [Required, MaxLength(20)]
    public string OrderNumber { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string CustomerName { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string CustomerEmail { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    [Required, MaxLength(20)]
    public string Status { get; set; } = "Pending";  // Pending | Confirmed | Cancelled

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public List<OrderItem> Items { get; set; } = new();
}
