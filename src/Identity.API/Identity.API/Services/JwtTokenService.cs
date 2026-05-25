using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Identity.API.DTOs;
using Identity.API.Entities;
using Microsoft.IdentityModel.Tokens;

namespace Identity.API.Services;

public interface IJwtTokenService
{
    AuthResponse CreateToken(AppUser user, string refreshToken);
}

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public AuthResponse CreateToken(AppUser user, string refreshToken)
    {
        var issuer = _configuration["Jwt:Issuer"] ?? "CoreERP.Identity";
        var audience = _configuration["Jwt:Audience"] ?? "CoreERP.Client";
        var secret = _configuration["Jwt:Secret"] ?? "CHANGE_ME_TO_A_LONG_RANDOM_SECRET_32_CHARS";
        var expiresInMinutes = int.TryParse(_configuration["Jwt:AccessTokenMinutes"], out var v) ? v : 120;

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new("name", user.FullName),
            new(ClaimTypes.Role, user.Role),
            new("role", user.Role)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(expiresInMinutes);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expires,
            signingCredentials: creds);

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return new AuthResponse(
            tokenString,
            refreshToken,
            "Bearer",
            expiresInMinutes * 60,
            new UserProfile(user.Id.ToString(), user.FullName, user.Email, user.Role));
    }
}
