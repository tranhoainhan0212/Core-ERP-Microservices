using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;

namespace Identity.API.Services;

public interface IGoogleOAuth2Service
{
    (string Url, string State) BuildAuthorizeUrl();
    Task<(bool Success, string? Error, GoogleUserInfo? User)> ExchangeCodeAsync(string code, string state);
}

public record GoogleUserInfo(string ExternalId, string Email, string FullName);

public class GoogleOAuth2Service : IGoogleOAuth2Service
{
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IMemoryCache _memoryCache;

    public GoogleOAuth2Service(IConfiguration configuration, IHttpClientFactory httpClientFactory, IMemoryCache memoryCache)
    {
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _memoryCache = memoryCache;
    }

    public (string Url, string State) BuildAuthorizeUrl()
    {
        var clientId = _configuration["OAuth2:Google:ClientId"];
        var redirectUri = _configuration["OAuth2:Google:RedirectUri"];

        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(redirectUri))
        {
            throw new InvalidOperationException("Google OAuth2 is not configured. Set OAuth2:Google:ClientId and RedirectUri.");
        }

        var state = Guid.NewGuid().ToString("N");
        _memoryCache.Set($"oauth_state_{state}", true, TimeSpan.FromMinutes(10));

        var url = "https://accounts.google.com/o/oauth2/v2/auth"
            + $"?response_type=code&client_id={Uri.EscapeDataString(clientId)}"
            + $"&redirect_uri={Uri.EscapeDataString(redirectUri)}"
            + "&scope=openid%20email%20profile"
            + $"&state={state}";

        return (url, state);
    }

    public async Task<(bool Success, string? Error, GoogleUserInfo? User)> ExchangeCodeAsync(string code, string state)
    {
        if (!_memoryCache.TryGetValue($"oauth_state_{state}", out _))
        {
            return (false, "Invalid or expired state.", null);
        }

        _memoryCache.Remove($"oauth_state_{state}");

        var clientId = _configuration["OAuth2:Google:ClientId"];
        var clientSecret = _configuration["OAuth2:Google:ClientSecret"];
        var redirectUri = _configuration["OAuth2:Google:RedirectUri"];

        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret) || string.IsNullOrWhiteSpace(redirectUri))
        {
            return (false, "Google OAuth2 is not fully configured. Require ClientId, ClientSecret, RedirectUri.", null);
        }

        var http = _httpClientFactory.CreateClient();

        using var tokenRequest = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["code"] = code,
            ["client_id"] = clientId,
            ["client_secret"] = clientSecret,
            ["redirect_uri"] = redirectUri,
            ["grant_type"] = "authorization_code"
        });

        var tokenResponse = await http.PostAsync("https://oauth2.googleapis.com/token", tokenRequest);
        if (!tokenResponse.IsSuccessStatusCode)
        {
            var details = await tokenResponse.Content.ReadAsStringAsync();
            return (false, $"Google token exchange failed: {details}", null);
        }

        var tokenData = await tokenResponse.Content.ReadFromJsonAsync<GoogleTokenResponse>();
        if (tokenData is null || string.IsNullOrWhiteSpace(tokenData.AccessToken))
        {
            return (false, "Google token exchange returned empty token.", null);
        }

        var userInfoResponse = await http.GetAsync($"https://www.googleapis.com/oauth2/v2/userinfo?access_token={Uri.EscapeDataString(tokenData.AccessToken)}");
        if (!userInfoResponse.IsSuccessStatusCode)
        {
            var details = await userInfoResponse.Content.ReadAsStringAsync();
            return (false, $"Google userinfo failed: {details}", null);
        }

        var userInfo = await userInfoResponse.Content.ReadFromJsonAsync<GoogleUserInfoResponse>();
        if (userInfo is null || string.IsNullOrWhiteSpace(userInfo.Id) || string.IsNullOrWhiteSpace(userInfo.Email))
        {
            return (false, "Google userinfo response invalid.", null);
        }

        return (true, null, new GoogleUserInfo(userInfo.Id, userInfo.Email, userInfo.Name ?? userInfo.Email));
    }

    private sealed class GoogleTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; } = string.Empty;
    }

    private sealed class GoogleUserInfoResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string? Name { get; set; }
    }
}
