using Identity.API.Data;
using Identity.API.DTOs;
using Identity.API.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Identity.API.Services;

public interface IUserAccountService
{
    Task<(bool Success, string? Error, AppUser? User)> RegisterAsync(RegisterRequest request);
    Task<AppUser?> ValidateCredentialsAsync(string email, string password);
    Task<AppUser?> GetByEmailAsync(string email);
    Task<AppUser> UpsertExternalUserAsync(string provider, string externalId, string email, string fullName);
    Task<string> CreateRefreshTokenAsync(int userId);
    Task<(bool Success, AppUser? User, string? NewRefreshToken, string? Error)> RotateRefreshTokenAsync(string refreshToken);
    Task RevokeRefreshTokenAsync(string refreshToken);
    Task SeedDefaultUsersAsync();
    Task<bool> ResetPasswordAsync(string email, string newPassword);
}

public class UserAccountService : IUserAccountService
{
    private readonly IdentityDbContext _db;
    private readonly PasswordHasher<AppUser> _passwordHasher = new();
    private readonly IConfiguration _configuration;

    public UserAccountService(IdentityDbContext db, IConfiguration configuration)
    {
        _db = db;
        _configuration = configuration;
    }

    public async Task<(bool Success, string? Error, AppUser? User)> RegisterAsync(RegisterRequest request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(x => x.Email == normalizedEmail))
        {
            return (false, "Email already exists.", null);
        }

        var user = new AppUser
        {
            FullName = request.FullName.Trim(),
            Email = normalizedEmail,
            Role = "Customer"
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return (true, null, user);
    }

    public async Task<AppUser?> ValidateCredentialsAsync(string email, string password)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == normalizedEmail);
        if (user is null)
        {
            return null;
        }

        var verification = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
        return verification == PasswordVerificationResult.Failed ? null : user;
    }

    public Task<AppUser?> GetByEmailAsync(string email)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        return _db.Users.FirstOrDefaultAsync(x => x.Email == normalizedEmail);
    }

    public async Task<AppUser> UpsertExternalUserAsync(string provider, string externalId, string email, string fullName)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == normalizedEmail);

        if (user is null)
        {
            user = new AppUser
            {
                FullName = fullName.Trim(),
                Email = normalizedEmail,
                Role = "Customer",
                ExternalProvider = provider,
                ExternalId = externalId,
                PasswordHash = _passwordHasher.HashPassword(new AppUser(), Guid.NewGuid().ToString("N"))
            };
            _db.Users.Add(user);
        }
        else
        {
            user.FullName = fullName.Trim();
            user.ExternalProvider = provider;
            user.ExternalId = externalId;
            user.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return user;
    }

    public async Task<string> CreateRefreshTokenAsync(int userId)
    {
        var days = int.TryParse(_configuration["Jwt:RefreshTokenDays"], out var value) ? value : 14;
        var refreshToken = Convert.ToBase64String(Guid.NewGuid().ToByteArray()) + Convert.ToBase64String(Guid.NewGuid().ToByteArray());

        _db.RefreshTokens.Add(new RefreshToken
        {
            AppUserId = userId,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(days)
        });

        await _db.SaveChangesAsync();
        return refreshToken;
    }

    public async Task<(bool Success, AppUser? User, string? NewRefreshToken, string? Error)> RotateRefreshTokenAsync(string refreshToken)
    {
        var token = await _db.RefreshTokens
            .Include(x => x.AppUser)
            .FirstOrDefaultAsync(x => x.Token == refreshToken);

        if (token is null)
        {
            return (false, null, null, "Refresh token not found.");
        }

        if (!token.IsActive)
        {
            return (false, null, null, "Refresh token expired or revoked.");
        }

        token.RevokedAt = DateTime.UtcNow;
        var days = int.TryParse(_configuration["Jwt:RefreshTokenDays"], out var value) ? value : 14;
        var newToken = Convert.ToBase64String(Guid.NewGuid().ToByteArray()) + Convert.ToBase64String(Guid.NewGuid().ToByteArray());
        _db.RefreshTokens.Add(new RefreshToken
        {
            AppUserId = token.AppUserId,
            Token = newToken,
            ExpiresAt = DateTime.UtcNow.AddDays(days)
        });

        await _db.SaveChangesAsync();
        return (true, token.AppUser, newToken, null);
    }

    public async Task RevokeRefreshTokenAsync(string refreshToken)
    {
        var token = await _db.RefreshTokens.FirstOrDefaultAsync(x => x.Token == refreshToken);
        if (token is null)
        {
            return;
        }

        token.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task SeedDefaultUsersAsync()
    {
        // Always ensure admin account exists
        var adminEmail = "admin@coreerp.local";
        var existingAdmin = await _db.Users.FirstOrDefaultAsync(x => x.Email == adminEmail);
        if (existingAdmin is null)
        {
            var admin = new AppUser
            {
                FullName = "Admin CoreERP",
                Email = adminEmail,
                Role = "Admin"
            };
            admin.PasswordHash = _passwordHasher.HashPassword(admin, "Admin@123");
            _db.Users.Add(admin);
        }

        var customerEmail = "customer@coreerp.local";
        if (!await _db.Users.AnyAsync(x => x.Email == customerEmail))
        {
            var customer = new AppUser
            {
                FullName = "Demo Customer",
                Email = customerEmail,
                Role = "Customer"
            };
            customer.PasswordHash = _passwordHasher.HashPassword(customer, "Customer@123");
            _db.Users.Add(customer);
        }

        await _db.SaveChangesAsync();
    }

    public async Task<bool> ResetPasswordAsync(string email, string newPassword)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == normalizedEmail);
        if (user is null) return false;

        user.PasswordHash = _passwordHasher.HashPassword(user, newPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }
}
