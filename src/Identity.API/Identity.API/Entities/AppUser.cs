using System.ComponentModel.DataAnnotations;

namespace Identity.API.Entities;

public class AppUser
{
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(30)]
    public string Role { get; set; } = "Customer";

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? ExternalProvider { get; set; }

    [MaxLength(200)]
    public string? ExternalId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public List<RefreshToken> RefreshTokens { get; set; } = new();
}
