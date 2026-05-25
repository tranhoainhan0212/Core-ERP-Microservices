using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Order.API.Controllers;
using Order.API.DTOs;
using Order.API.HttpClients;
using Order.API.Repositories;
using AutoMapper;
using Order.API.Mappings;

namespace CoreERP.UnitTests.OrderAPI;

public class OrdersControllerTests
{
    private readonly Mock<IOrderRepository> _mockOrderRepo;
    private readonly Mock<IProductApiClient> _mockProductClient;
    private readonly Mock<ILogger<OrdersController>> _mockLogger;
    private readonly OrdersController _controller;
    private readonly IMapper _mapper;

    public OrdersControllerTests()
    {
        _mockOrderRepo = new Mock<IOrderRepository>();
        _mockProductClient = new Mock<IProductApiClient>();
        _mockLogger = new Mock<ILogger<OrdersController>>();

        var config = new MapperConfiguration(cfg => cfg.AddProfile<OrderProfile>());
        _mapper = config.CreateMapper();

        _controller = new OrdersController(_mockOrderRepo.Object, _mockProductClient.Object, _mapper, _mockLogger.Object);
    }

    [Fact]
    public async Task CreateOrder_ShouldReturnBadRequest_WhenProductNotFound()
    {
        // Arrange
        var request = new CreateOrderDto("Test", "test@test.com", new List<CreateOrderItemDto>
        {
            new CreateOrderItemDto(1, 2)
        });

        _mockProductClient.Setup(x => x.GetProductAsync(1)).ReturnsAsync((ProductInfoDto?)null);

        // Act
        var result = await _controller.CreateOrder(request);

        // Assert
        var badRequestResult = result.Result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.Value!.ToString().Should().Contain("Product 1 not found or inactive");
    }

    [Fact]
    public async Task CreateOrder_ShouldReturnBadRequest_WhenInsufficientStock()
    {
        // Arrange
        var request = new CreateOrderDto("Test", "test@test.com", new List<CreateOrderItemDto>
        {
            new CreateOrderItemDto(1, 5)
        });

        _mockProductClient.Setup(x => x.GetProductAsync(1))
            .ReturnsAsync(new ProductInfoDto(1, "Product ABC", 100m, true));
            
        _mockProductClient.Setup(x => x.GetStockAsync(1))
            .ReturnsAsync(new ProductStockDto(1, "Product ABC", 2, true)); // Only 2 in stock

        // Act
        var result = await _controller.CreateOrder(request);

        // Assert
        var badRequestResult = result.Result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.Value.ToString().Should().Contain("Insufficient stock");
    }

    [Fact]
    public async Task CreateOrder_ShouldRollbackAndReturnBadRequest_WhenReduceStockFails()
    {
        // Arrange
        var request = new CreateOrderDto("Test", "test@test.com", new List<CreateOrderItemDto>
        {
            new CreateOrderItemDto(1, 2),
            new CreateOrderItemDto(2, 3)
        });

        // Setup both products to exist and have enough stock
        _mockProductClient.Setup(x => x.GetProductAsync(It.IsAny<int>()))
            .ReturnsAsync((int id) => new ProductInfoDto(id, $"Product {id}", 100m, true));
            
        _mockProductClient.Setup(x => x.GetStockAsync(It.IsAny<int>()))
            .ReturnsAsync((int id) => new ProductStockDto(id, $"Product {id}", 10, true));

        // Let Product 1 reduce stock successfully
        _mockProductClient.Setup(x => x.ReduceStockAsync(1, 2)).ReturnsAsync(true);
        // Let Product 2 fail to reduce stock (e.g. concurrent race condition)
        _mockProductClient.Setup(x => x.ReduceStockAsync(2, 3)).ReturnsAsync(false);

        // Act
        var result = await _controller.CreateOrder(request);

        // Assert
        var badRequestResult = result.Result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.Value.ToString().Should().Contain("Failed to reserve stock");

        // Verify Compensating Transaction (Rollback) was called for Product 1
        _mockProductClient.Verify(x => x.RestoreStockAsync(1, 2), Times.Once);
        // Ensure order wasn't saved
        _mockOrderRepo.Verify(x => x.CreateAsync(It.IsAny<Order.API.Entities.Order>()), Times.Never);
    }
}
