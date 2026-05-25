using Microsoft.EntityFrameworkCore;
using ProductEntity = Product.API.Entities.Product;

namespace Product.API.Data;

public class ProductDbContext : DbContext
{
    public ProductDbContext(DbContextOptions<ProductDbContext> options) : base(options) { }

    public DbSet<ProductEntity> Products => Set<ProductEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ProductEntity>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Name).IsRequired().HasMaxLength(200);
            entity.Property(p => p.SKU).IsRequired().HasMaxLength(50);
            entity.HasIndex(p => p.SKU).IsUnique();
            entity.Property(p => p.Price).HasColumnType("decimal(18,2)");
            entity.Property(p => p.StockQuantity).HasDefaultValue(0);
            entity.Property(p => p.ImageUrl).HasMaxLength(1000);
            entity.Property(p => p.IsActive).HasDefaultValue(true);
            entity.Property(p => p.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<ProductEntity>().HasData(
            new ProductEntity
            {
                Id = 1,
                Name = "MacBook Pro 14 M4",
                SKU = "APPLE-MBP14-M4",
                Price = 52_000_000m,
                StockQuantity = 24,
                Description = "Powerful laptop for creators and developers.",
                ImageUrl = "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1400&q=80",
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new ProductEntity
            {
                Id = 2,
                Name = "iPhone 16 Pro Max",
                SKU = "APPLE-IP16PM",
                Price = 39_900_000m,
                StockQuantity = 40,
                Description = "Flagship phone with pro camera and A-series chip.",
                ImageUrl = "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1400&q=80",
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new ProductEntity
            {
                Id = 3,
                Name = "AirPods Pro 2",
                SKU = "APPLE-AIRPODS-PRO2",
                Price = 6_500_000m,
                StockQuantity = 66,
                Description = "Premium noise-cancelling true wireless earbuds.",
                ImageUrl = "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=1400&q=80",
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new ProductEntity
            {
                Id = 4,
                Name = "Studio Display 5K",
                SKU = "APPLE-STUDIO-DISPLAY",
                Price = 41_500_000m,
                StockQuantity = 12,
                Description = "5K monitor with excellent color and speakers.",
                ImageUrl = "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1400&q=80",
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new ProductEntity
            {
                Id = 5,
                Name = "Magic Keyboard",
                SKU = "APPLE-MAGIC-KEYBOARD",
                Price = 3_400_000m,
                StockQuantity = 0,
                Description = "Slim keyboard with responsive scissor mechanism.",
                ImageUrl = "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=1400&q=80",
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );
    }
}
