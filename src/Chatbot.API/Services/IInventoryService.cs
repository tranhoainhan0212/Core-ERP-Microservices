// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  Chatbot.API — Services/IInventoryService.cs                               ║
// ║  Interface cho service tra cứu tồn kho / giá sản phẩm.                    ║
// ║  Tuân thủ Interface Segregation Principle (ISP).                            ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

using Chatbot.API.DTOs;

namespace Chatbot.API.Services;

/// <summary>
/// Abstraction cho việc tra cứu sản phẩm.
/// Trong production, service này sẽ gọi sang Product.API qua HTTP/gRPC.
/// Hiện tại dùng bản giả lập (mock) với dữ liệu cứng.
/// </summary>
public interface IInventoryService
{
    /// <summary>
    /// Tra cứu thông tin sản phẩm theo tên.
    /// AI sẽ gọi function này thông qua Function Calling.
    /// </summary>
    /// <param name="productName">Tên sản phẩm (hoặc từ khóa) từ AI gửi xuống</param>
    /// <returns>DTO chứa tên, giá, tồn kho; hoặc null nếu không tìm thấy</returns>
    Task<ProductStatusDto?> GetProductStatusAsync(string productName);

    /// <summary>
    /// Tra cứu nhiều sản phẩm cùng lúc (batch lookup).
    /// Dùng khi AI so sánh 2-3 sản phẩm.
    /// </summary>
    Task<List<ProductStatusDto>> GetMultipleProductsAsync(IEnumerable<string> productNames);
}
