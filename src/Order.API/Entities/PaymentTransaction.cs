using System.ComponentModel.DataAnnotations;

namespace Order.API.Entities;

public class PaymentTransaction
{
    public int Id { get; set; }

    public int OrderId { get; set; }

    [Required, MaxLength(20)]
    public string Provider { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string TransactionId { get; set; } = string.Empty;

    [Required, MaxLength(30)]
    public string Status { get; set; } = "Pending";

    [MaxLength(1000)]
    public string? PaymentUrl { get; set; }

    [MaxLength(2000)]
    public string? RawRequest { get; set; }

    [MaxLength(2000)]
    public string? RawCallback { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
