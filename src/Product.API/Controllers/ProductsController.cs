using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Product.API.DTOs;
using Product.API.Entities;
using Product.API.Repositories;

namespace Product.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ProductsController : ControllerBase
{
    private readonly IProductRepository _repository;
    private readonly IMapper _mapper;
    private readonly ILogger<ProductsController> _logger;
    private readonly Product.API.Services.IImageUploadService _imageUploadService;

    public ProductsController(
        IProductRepository repository,
        IMapper mapper,
        ILogger<ProductsController> logger,
        Product.API.Services.IImageUploadService imageUploadService)
    {
        _repository = repository;
        _mapper = mapper;
        _logger = logger;
        _imageUploadService = imageUploadService;
    }

    /// <summary>Lấy danh sách tất cả sản phẩm đang active</summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<ProductDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts()
    {
        var products = await _repository.GetAllAsync();
        var dtos = _mapper.Map<IEnumerable<ProductDto>>(products);
        return Ok(dtos);
    }

    /// <summary>Lấy chi tiết một sản phẩm theo ID</summary>
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductDto>> GetProduct(int id)
    {
        var product = await _repository.GetByIdAsync(id);
        if (product is null)
        {
            _logger.LogWarning("Product {ProductId} not found", id);
            return NotFound(new { message = $"Product with ID {id} not found." });
        }

        return Ok(_mapper.Map<ProductDto>(product));
    }

    /// <summary>Kiểm tra tồn kho của sản phẩm — được gọi bởi Order.API</summary>
    [HttpGet("{id:int}/stock")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ProductStockDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductStockDto>> GetStock(int id)
    {
        var product = await _repository.GetByIdAsync(id);
        if (product is null)
            return NotFound(new { message = $"Product with ID {id} not found." });

        return Ok(_mapper.Map<ProductStockDto>(product));
    }

    /// <summary>Tạo sản phẩm mới</summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateProductDto request)
    {
        // Validate price & stock
        if (request.Price <= 0)
            return BadRequest(new { message = "Price must be greater than 0." });
        if (request.StockQuantity < 0)
            return BadRequest(new { message = "Stock quantity cannot be negative." });

        // Kiểm tra SKU trùng
        var existing = await _repository.GetBySkuAsync(request.SKU);
        if (existing is not null)
            return Conflict(new { message = $"SKU '{request.SKU}' already exists." });

        var product = _mapper.Map<Entities.Product>(request);
        var created = await _repository.CreateAsync(product);

        _logger.LogInformation("✅ Product created: {SKU} - {Name}", created.SKU, created.Name);

        return CreatedAtAction(
            nameof(GetProduct),
            new { id = created.Id },
            _mapper.Map<ProductDto>(created));
    }

    /// <summary>Cập nhật thông tin sản phẩm (không cập nhật SKU và stock)</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProductDto>> UpdateProduct(int id, [FromBody] UpdateProductDto request)
    {
        if (request.Price <= 0)
            return BadRequest(new { message = "Price must be greater than 0." });

        var product = await _repository.GetByIdAsync(id);
        if (product is null)
            return NotFound(new { message = $"Product with ID {id} not found." });

        product.Name = request.Name;
        product.Price = request.Price;
        product.Description = request.Description;
        product.ImageUrl = request.ImageUrl;

        await _repository.UpdateAsync(product);

        _logger.LogInformation("✏️ Product {ProductId} updated", id);

        return Ok(_mapper.Map<ProductDto>(product));
    }

    /// <summary>
    /// Trừ tồn kho — được gọi bởi Order.API khi đặt hàng thành công.
    /// Atomic operation: chỉ trừ nếu StockQuantity >= quantity.
    /// </summary>
    [HttpPut("{id:int}/reduce-stock")]
    [Authorize(Policy = "InternalServiceOrAdmin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReduceStock(int id, [FromBody] StockOperationDto request)
    {
        if (request.Quantity <= 0)
            return BadRequest(new { message = "Quantity must be greater than 0." });

        var product = await _repository.GetByIdAsync(id);
        if (product is null)
            return NotFound(new { message = $"Product with ID {id} not found." });

        var success = await _repository.ReduceStockAsync(id, request.Quantity);
        if (!success)
        {
            _logger.LogWarning(
                "❌ Insufficient stock for Product {ProductId}. Requested: {Qty}, Available: {Stock}",
                id, request.Quantity, product.StockQuantity);

            return BadRequest(new
            {
                message = $"Insufficient stock. Available: {product.StockQuantity}, Requested: {request.Quantity}"
            });
        }

        _logger.LogInformation("📦 Stock reduced for Product {ProductId} by {Qty}", id, request.Quantity);
        return Ok(new { message = "Stock reduced successfully." });
    }

    /// <summary>
    /// Hoàn tồn kho — được gọi bởi Order.API khi huỷ đơn hàng.
    /// </summary>
    [HttpPut("{id:int}/restore-stock")]
    [Authorize(Policy = "InternalServiceOrAdmin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RestoreStock(int id, [FromBody] StockOperationDto request)
    {
        if (request.Quantity <= 0)
            return BadRequest(new { message = "Quantity must be greater than 0." });

        var product = await _repository.GetByIdAsync(id);
        if (product is null)
            return NotFound(new { message = $"Product with ID {id} not found." });

        await _repository.RestoreStockAsync(id, request.Quantity);

        _logger.LogInformation("🔄 Stock restored for Product {ProductId} by {Qty}", id, request.Quantity);
        return Ok(new { message = "Stock restored successfully." });
    }

    /// <summary>Soft-delete sản phẩm (không xoá khỏi DB)</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var success = await _repository.SoftDeleteAsync(id);
        if (!success)
            return NotFound(new { message = $"Product with ID {id} not found." });

        _logger.LogInformation("🗑️ Product {ProductId} soft-deleted", id);
        return NoContent();
    }

    /// <summary>Upload hình ảnh lên Cloudinary</summary>
    [HttpPost("upload-image")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded." });

        _logger.LogInformation("Uploading image: {FileName}", file.FileName);
        var url = await _imageUploadService.UploadImageAsync(file);

        if (string.IsNullOrEmpty(url))
            return BadRequest(new { message = "Image upload failed." });

        return Ok(new { imageUrl = url });
    }
}
