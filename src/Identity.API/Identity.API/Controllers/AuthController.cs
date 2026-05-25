using Identity.API.DTOs;
using Identity.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Identity.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IUserAccountService _userService;
    private readonly IJwtTokenService _tokenService;
    private readonly IGoogleOAuth2Service _googleOAuth2Service;

    public AuthController(
        IUserAccountService userService,
        IJwtTokenService tokenService,
        IGoogleOAuth2Service googleOAuth2Service)
    {
        _userService = userService;
        _tokenService = tokenService;
        _googleOAuth2Service = googleOAuth2Service;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "FullName, Email and Password are required." });
        }

        if (request.Password.Length < 8)
        {
            return BadRequest(new { message = "Password must be at least 8 characters." });
        }

        var result = await _userService.RegisterAsync(request);
        if (!result.Success || result.User is null)
        {
            return Conflict(new { message = result.Error ?? "Unable to register." });
        }

        var refreshToken = await _userService.CreateRefreshTokenAsync(result.User.Id);
        return Ok(_tokenService.CreateToken(result.User, refreshToken));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await _userService.ValidateCredentialsAsync(request.Email, request.Password);
        if (user is null)
        {
            return Unauthorized(new { message = "Invalid credentials." });
        }

        var refreshToken = await _userService.CreateRefreshTokenAsync(user.Id);
        return Ok(_tokenService.CreateToken(user, refreshToken));
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.NewPassword))
            return BadRequest(new { message = "Email and NewPassword are required." });

        if (request.NewPassword.Length < 8)
            return BadRequest(new { message = "Password must be at least 8 characters." });

        var success = await _userService.ResetPasswordAsync(request.Email, request.NewPassword);
        if (!success)
            return NotFound(new { message = "We could not find an account with that email." });

        return Ok(new { message = "Password has been successfully updated." });
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Refresh([FromBody] RefreshTokenRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return BadRequest(new { message = "Refresh token is required." });
        }

        var result = await _userService.RotateRefreshTokenAsync(request.RefreshToken);
        if (!result.Success || result.User is null || string.IsNullOrWhiteSpace(result.NewRefreshToken))
        {
            return Unauthorized(new { message = result.Error ?? "Invalid refresh token." });
        }

        return Ok(_tokenService.CreateToken(result.User, result.NewRefreshToken));
    }

    [HttpPost("revoke")]
    [Authorize]
    public async Task<IActionResult> Revoke([FromBody] RevokeTokenRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return BadRequest(new { message = "Refresh token is required." });
        }

        await _userService.RevokeRefreshTokenAsync(request.RefreshToken);
        return Ok(new { message = "Token revoked." });
    }

    [HttpGet("me")]
    [Authorize]
    public ActionResult<UserProfile> Me()
    {
        var userId = User.FindFirst("sub")?.Value;
        var email = User.FindFirst("email")?.Value;
        var name = User.FindFirst("name")?.Value;
        var role = User.FindFirst("role")?.Value ?? "Customer";

        if (userId is null || email is null || name is null)
        {
            return Unauthorized();
        }

        return Ok(new UserProfile(userId, name, email, role));
    }

    [HttpGet("oauth2/google/authorize")]
    [AllowAnonymous]
    public ActionResult<OAuth2AuthorizeResponse> GetGoogleAuthorizeUrl()
    {
        try
        {
            var result = _googleOAuth2Service.BuildAuthorizeUrl();
            return Ok(new OAuth2AuthorizeResponse("google", result.Url, result.State));
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("oauth2/google/callback")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> GoogleCallback([FromQuery] string code, [FromQuery] string state)
    {
        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(state))
        {
            return BadRequest(new { message = "code and state are required." });
        }

        var exchange = await _googleOAuth2Service.ExchangeCodeAsync(code, state);
        if (!exchange.Success || exchange.User is null)
        {
            return BadRequest(new { message = exchange.Error ?? "Google OAuth2 failed." });
        }

        var user = await _userService.UpsertExternalUserAsync("google", exchange.User.ExternalId, exchange.User.Email, exchange.User.FullName);
        var refreshToken = await _userService.CreateRefreshTokenAsync(user.Id);

        return Ok(_tokenService.CreateToken(user, refreshToken));
    }

    [HttpGet("seed-users")]
    [AllowAnonymous]
    public IActionResult SeedUsers()
    {
        return Ok(new
        {
            admin = new { email = "admin@coreerp.local", password = "Admin@123", role = "Admin" },
            customer = new { email = "customer@coreerp.local", password = "Customer@123", role = "Customer" }
        });
    }
}
