// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  Chatbot.API — Controllers/ChatbotController.cs                            ║
// ║  API Endpoint nhận request từ WebUI                                        ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

using Chatbot.API.DTOs;
using Chatbot.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace Chatbot.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatbotController : ControllerBase
{
    private readonly IChatbotService _chatbotService;
    private readonly ILogger<ChatbotController> _logger;

    public ChatbotController(IChatbotService chatbotService, ILogger<ChatbotController> logger)
    {
        _chatbotService = chatbotService;
        _logger = logger;
    }

    /// <summary>
    /// Gửi tin nhắn tới AI Specialist.
    /// POST: /api/chatbot/ask
    /// </summary>
    [HttpPost("ask")]
    public async Task<ActionResult<ChatResponse>> AskAsync([FromBody] ChatRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserMessage))
        {
            return BadRequest(new { error = "Nội dung tin nhắn không được để trống." });
        }

        try
        {
            _logger.LogInformation("Nhận yêu cầu tư vấn: '{Message}'", request.UserMessage);
            var response = await _chatbotService.AskAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi xử lý hội thoại AI.");
            return StatusCode(500, new 
            { 
                error = "Đã xảy ra lỗi khi kết nối với AI Specialist.", 
                details = ex.Message 
            });
        }
    }
}
