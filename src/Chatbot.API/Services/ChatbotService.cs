// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  Chatbot.API — Services/ChatbotService.cs                                  ║
// ║  Logic lõi: Giao tiếp Google Gemini via Microsoft Semantic Kernel          ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

using System.Text.Json;
using System.ComponentModel;
using System.Threading;
using Chatbot.API.DTOs;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;

namespace Chatbot.API.Services;

public sealed class ChatbotService : IChatbotService
{
    private readonly Kernel _kernel;
    private readonly IChatCompletionService _chatCompletionService;
    private readonly IInventoryService _inventoryService;
    private readonly ILogger<ChatbotService> _logger;

    // Quản lý state hội thoại đơn giản
    private static readonly Dictionary<string, ChatHistory> _conversations = new();

    private const string SystemPrompt = @"Bạn là CoreERP AI Specialist - Chuyên gia tư vấn sản phẩm công nghệ cao cấp của hệ thống CoreERP.

Quy trình tư vấn bắt buộc (4 bước):
1. Định vị nhu cầu: Hiểu rõ người dùng đang cần gì (làm việc, giải trí, quà tặng,...).
2. Điểm mạnh cốt lõi: Nêu bật tính năng nổi trội nhất của sản phẩm.
3. So sánh thông số & Giá thực tế: CHỈ sử dụng dữ liệu từ công cụ tra cứu.
4. Chốt lời khuyên: Đưa ra nhận định rõ ràng, khách quan.

Ràng buộc nghiêm ngặt:
- TUYỆT ĐỐI KHÔNG tự bịa đặt thông số, giá cả, hoặc tồn kho.
- NẾU người dùng hỏi về sản phẩm cụ thể, bạn PHẢI gọi hàm `get_product_status` để lấy dữ liệu.
- Trả lời bằng tiếng Việt, giọng điệu chuyên nghiệp, tự tin nhưng gần gũi.
- Trình bày rõ ràng, sử dụng markdown để nhấn mạnh các ý chính.";

    public ChatbotService(
        Kernel kernel,
        IInventoryService inventoryService,
        ILogger<ChatbotService> logger)
    {
        _kernel = kernel;
        _chatCompletionService = kernel.GetRequiredService<IChatCompletionService>();
        _inventoryService = inventoryService;
        _logger = logger;
        
        // Đăng ký Plugin vào Kernel để Auto Function Calling tự hoạt động
        _kernel.Plugins.AddFromObject(new InventoryPlugin(_inventoryService, _logger), "InventoryPlugin");
    }

    public async Task<ChatResponse> AskAsync(ChatRequest request)
    {
        var conversationId = request.ConversationId ?? Guid.NewGuid().ToString();

        // 1. Lấy hoặc khởi tạo lịch sử hội thoại
        if (!_conversations.TryGetValue(conversationId, out var chatHistory))
        {
            chatHistory = new ChatHistory(SystemPrompt);
            _conversations[conversationId] = chatHistory;
        }

        // 2. Thêm tin nhắn của User
        chatHistory.AddUserMessage(request.UserMessage);

        // 3. Cấu hình Semantic Kernel để tự động thực thi Function (Tool Use)
        var executionSettings = new PromptExecutionSettings 
        {
            FunctionChoiceBehavior = FunctionChoiceBehavior.Auto()
        };

        _logger.LogInformation("🚀 Gửi yêu cầu tới Groq via Semantic Kernel...");
        
        // Cập nhật context cho plugin để lấy products
        InventoryPlugin.ClearCache();

        // 4. Semantic Kernel sẽ tự gọi Groq -> Nhận Tool Call -> Tự chạy hàm -> Gửi kết quả lại cho Groq
        var responseMessage = await _chatCompletionService.GetChatMessageContentAsync(
            chatHistory,
            executionSettings,
            _kernel);

        // 5. Lưu phản hồi vào lịch sử
        chatHistory.Add(responseMessage);
        _logger.LogInformation("💬 Trả lời từ AI hoàn tất.");

        return new ChatResponse
        {
            Reply = responseMessage.Content ?? "",
            ConversationId = conversationId,
            ReferencedProducts = InventoryPlugin.GetLastSearchedProducts()
        };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 🧩 Plugin dành cho Semantic Kernel (Đại diện cho Tool/Function Calling)
// ─────────────────────────────────────────────────────────────────────────────
public class InventoryPlugin
{
    private readonly IInventoryService _inventoryService;
    private readonly ILogger _logger;
    
    // Lưu tạm các sản phẩm đã tra cứu trong phiên làm việc hiện tại để trả về UI
    private static readonly ThreadLocal<List<ProductStatusDto>> _lastSearched = new(() => new());

    public InventoryPlugin(IInventoryService inventoryService, ILogger logger)
    {
        _inventoryService = inventoryService;
        _logger = logger;
    }

    public static void ClearCache()
    {
        _lastSearched.Value!.Clear();
    }

    public static List<ProductStatusDto> GetLastSearchedProducts()
    {
        return new List<ProductStatusDto>(_lastSearched.Value!);
    }

    [KernelFunction("get_product_status")]
    [Description("Lấy thông tin chi tiết về sản phẩm (giá, tồn kho, mô tả) từ hệ thống kho CoreERP. Bắt buộc gọi hàm này khi người dùng nhắc đến một sản phẩm.")]
    public async Task<string> GetProductStatusAsync([Description("Tên sản phẩm hoặc từ khóa cần tra cứu (VD: Samsung Galaxy S24, iPhone 15)")] string productName)
    {
        _logger.LogInformation("🔧 Semantic Kernel đang thực thi Tool: get_product_status('{ProductName}')", productName);
        
        var productInfo = await _inventoryService.GetProductStatusAsync(productName);
        if (productInfo != null)
        {
            _lastSearched.Value!.Add(productInfo);
            return JsonSerializer.Serialize(productInfo);
        }
        return JsonSerializer.Serialize(new { error = "Sản phẩm không tồn tại trong hệ thống hoặc đã ngừng kinh doanh." });
    }
}
