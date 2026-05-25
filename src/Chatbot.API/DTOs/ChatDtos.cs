// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  Chatbot.API — DTOs/ChatDtos.cs                                            ║
// ║  Data Transfer Objects cho API request/response                            ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

namespace Chatbot.API.DTOs;

/// <summary>
/// Request body từ client gửi lên endpoint POST /api/chatbot/ask
/// </summary>
public sealed record ChatRequest
{
    /// <summary>Tin nhắn của người dùng</summary>
    public required string UserMessage { get; init; }

    /// <summary>
    /// (Tùy chọn) Conversation ID để duy trì ngữ cảnh hội thoại.
    /// Nếu null, hệ thống sẽ tạo conversation mới.
    /// </summary>
    public string? ConversationId { get; init; }
}

/// <summary>
/// Response trả về cho client
/// </summary>
public sealed record ChatResponse
{
    /// <summary>Câu trả lời tự nhiên từ AI</summary>
    public required string Reply { get; init; }

    /// <summary>ID cuộc hội thoại để client gửi lại ở lượt tiếp theo</summary>
    public required string ConversationId { get; init; }

    /// <summary>Danh sách sản phẩm AI đã tra cứu (để UI có thể hiển thị card)</summary>
    public List<ProductStatusDto> ReferencedProducts { get; init; } = [];
}

/// <summary>
/// DTO chứa thông tin sản phẩm trả về từ IInventoryService.
/// Đây cũng là dữ liệu được serialize thành JSON gửi ngược lại cho AI
/// sau khi Function Calling được thực thi.
/// </summary>
public sealed record ProductStatusDto
{
    public string ProductName { get; init; } = string.Empty;
    public string SKU { get; init; } = string.Empty;
    public decimal CurrentPrice { get; init; }
    public int StockQuantity { get; init; }
    public string StockStatus { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? ImageUrl { get; init; }
}
