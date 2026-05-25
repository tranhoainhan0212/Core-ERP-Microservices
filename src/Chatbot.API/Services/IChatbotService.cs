// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  Chatbot.API — Services/IChatbotService.cs                                 ║
// ║  Interface cho Chatbot Service để tuân thủ Dependency Injection            ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

using Chatbot.API.DTOs;

namespace Chatbot.API.Services;

public interface IChatbotService
{
    /// <summary>
    /// Xử lý tin nhắn của người dùng, gọi OpenAI và thực thi Function Calling nếu cần.
    /// </summary>
    Task<ChatResponse> AskAsync(ChatRequest request);
}
