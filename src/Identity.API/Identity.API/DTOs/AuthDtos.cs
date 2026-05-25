namespace Identity.API.DTOs;

public record RegisterRequest(string FullName, string Email, string Password);

public record LoginRequest(string Email, string Password);

public record ResetPasswordRequest(string Email, string NewPassword);

public record RefreshTokenRequest(string RefreshToken);

public record RevokeTokenRequest(string RefreshToken);

public record OAuth2GoogleCallbackRequest(string Code, string State);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    string TokenType,
    int ExpiresInSeconds,
    UserProfile User);

public record UserProfile(string Id, string FullName, string Email, string Role);

public record OAuth2AuthorizeResponse(string Provider, string AuthorizeUrl, string State);
