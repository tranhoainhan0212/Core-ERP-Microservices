using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Product.API.Data;
using Product.API.Repositories;
using Product.API.Entities;

namespace CoreERP.UnitTests.ProductAPI;

public class ProductRepositoryTests
{
    private readonly DbContextOptions<ProductDbContext> _options;

    public ProductRepositoryTests()
    {
        // Use an entirely fresh in-memory database for each test to avoid cross-test contamination
        _options = new DbContextOptionsBuilder<ProductDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnActiveProducts()
    {
        // Arrange
        await using var context = new ProductDbContext(_options);
        context.Products.Add(new Product.API.Entities.Product { Name = "Active Product", SKU = "A1", Price = 10m, IsActive = true });
        context.Products.Add(new Product.API.Entities.Product { Name = "Inactive Product", SKU = "I1", Price = 10m, IsActive = false });
        await context.SaveChangesAsync();

        var repository = new ProductRepository(context);

        // Act
        var result = await repository.GetAllAsync();

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(1);
        result.First().Name.Should().Be("Active Product");
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnProduct_WhenProductExistsAndIsActive()
    {
        // Arrange
        await using var context = new ProductDbContext(_options);
        var product = new Product.API.Entities.Product { Name = "Test Product", SKU = "T1", Price = 100m, IsActive = true };
        context.Products.Add(product);
        await context.SaveChangesAsync();

        var repository = new ProductRepository(context);

        // Act
        var result = await repository.GetByIdAsync(product.Id);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("Test Product");
    }

    [Fact]
    public async Task UpdateAsync_ShouldUpdateProductDetails()
    {
        // Arrange
        await using var context = new ProductDbContext(_options);
        var product = new Product.API.Entities.Product { Name = "Old Name", SKU = "U1", Price = 10m, IsActive = true };
        context.Products.Add(product);
        await context.SaveChangesAsync();

        var repository = new ProductRepository(context);

        // Act
        product.Name = "New Name";
        product.Price = 99m;
        await repository.UpdateAsync(product);
        
        var updatedProduct = await context.Products.FindAsync(product.Id);

        // Assert
        updatedProduct.Should().NotBeNull();
        updatedProduct!.Name.Should().Be("New Name");
        updatedProduct.Price.Should().Be(99m);
        updatedProduct.UpdatedAt.Should().NotBeNull();
    }
}
