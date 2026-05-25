using System.Text;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Product.API.Data;
using Product.API.Middleware;
using Product.API.Repositories;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] [{SourceContext}] {Message:lj}{NewLine}{Exception}"));

    builder.Services.AddDbContext<ProductDbContext>(options =>
        options.UseSqlServer(
            builder.Configuration.GetConnectionString("DefaultConnection"),
            sqlOptions => sqlOptions.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null)));

    builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
    builder.Services.AddProblemDetails();
    builder.Services.AddScoped<IProductRepository, ProductRepository>();
    builder.Services.AddScoped<Product.API.Services.IImageUploadService, Product.API.Services.CloudinaryImageUploadService>();
    builder.Services.AddAutoMapper(typeof(Program).Assembly);

    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        });

    builder.Services.AddFluentValidationAutoValidation();
    builder.Services.AddValidatorsFromAssemblyContaining<Program>();

    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new()
        {
            Title = "Product.API",
            Version = "v1",
            Description = "Product catalog and inventory service"
        });
    });

    var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "CORE_ERP_SUPER_SECRET_KEY_CHANGE_IN_PROD_2026";
    var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "CoreERP.Identity";
    var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "CoreERP.Client";

    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.MapInboundClaims = false;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateIssuerSigningKey = true,
                ValidateLifetime = true,
                ValidIssuer = jwtIssuer,
                ValidAudience = jwtAudience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                ClockSkew = TimeSpan.FromMinutes(1)
            };
        });

    var internalKey = builder.Configuration["Security:InternalApiKey"] ?? "INTERNAL_PRODUCT_ORDER_KEY";
    builder.Services.AddAuthorization(options =>
    {
        options.AddPolicy("InternalServiceOrAdmin", policy =>
        {
            policy.RequireAssertion(context =>
            {
                if (context.User.IsInRole("Admin"))
                {
                    return true;
                }

                var httpContext = context.Resource as HttpContext
                    ?? (context.Resource as Microsoft.AspNetCore.Mvc.Filters.AuthorizationFilterContext)?.HttpContext;
                var providedKey = httpContext?.Request.Headers["X-Internal-ApiKey"].FirstOrDefault();
                return !string.IsNullOrWhiteSpace(providedKey) && providedKey == internalKey;
            });
        });
    });

    builder.Services.AddHealthChecks().AddSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")!,
        name: "sqlserver",
        tags: ["db", "sql"]);

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAll", policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
    });

    var app = builder.Build();

    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<ProductDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

        try
        {
            logger.LogInformation("Applying database migrations for ProductDb...");
            await db.Database.MigrateAsync();
            await db.Database.ExecuteSqlRawAsync(@"
IF COL_LENGTH('dbo.Products', 'ImageUrl') IS NULL
BEGIN
    ALTER TABLE dbo.Products ADD ImageUrl NVARCHAR(1000) NULL;
END
");
            await db.Database.ExecuteSqlRawAsync(@"
UPDATE dbo.Products
SET ImageUrl = CASE
    WHEN SKU = 'APPLE-MBP14-M4' THEN 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1400&q=80'
    WHEN SKU = 'APPLE-IP16PM' THEN 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1400&q=80'
    WHEN SKU = 'APPLE-AIRPODS-PRO2' THEN 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=1400&q=80'
    WHEN SKU = 'APPLE-STUDIO-DISPLAY' THEN 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1400&q=80'
    WHEN SKU = 'APPLE-MAGIC-KEYBOARD' THEN 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=1400&q=80'
    WHEN SKU = 'DELL-XPS15-2024' THEN 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1400&q=80'
    WHEN SKU = 'LOG-MX3-BLK' THEN 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1400&q=80'
    WHEN SKU = 'KEYCHRON-K2-V2' THEN 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=1400&q=80'
    WHEN SKU = 'LG-27UK850-B' THEN 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1400&q=80'
    WHEN SKU = 'SONY-WH1000XM5' THEN 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1400&q=80'
    ELSE ImageUrl
END
WHERE ImageUrl IS NULL OR ImageUrl = '';
");
            await db.Database.ExecuteSqlRawAsync(@"
IF NOT EXISTS (SELECT 1 FROM dbo.Products WHERE SKU = 'SAMSUNG-Z-FOLD5')
BEGIN
    INSERT INTO dbo.Products (Name, SKU, Price, StockQuantity, Description, ImageUrl, IsActive, CreatedAt)
    VALUES 
    ('Điện thoại Samsung Galaxy Z Fold 5', 'SAMSUNG-Z-FOLD5', 40990000, 15, 'Màn hình gập cực đỉnh, đa nhiệm mượt mà', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1400&q=80', 1, GETUTCDATE()),
    ('Điện thoại Samsung Galaxy S24 Ultra', 'SAMSUNG-S24U', 33990000, 50, 'Camera 200MP, Tích hợp Galaxy AI thông minh', 'https://images.unsplash.com/photo-1678286742832-26543bb49959?auto=format&fit=crop&w=1400&q=80', 1, GETUTCDATE()),
    ('Điện thoại Samsung Galaxy Z Flip 5', 'SAMSUNG-Z-FLIP5', 25990000, 30, 'Thiết kế gập vỏ sò thời trang', 'https://images.unsplash.com/photo-1610945264803-c22b6272af74?auto=format&fit=crop&w=1400&q=80', 1, GETUTCDATE()),
    ('Điện thoại Samsung Galaxy A54 5G', 'SAMSUNG-A54', 10490000, 100, 'Tầm trung cao cấp, màn hình Super AMOLED 120Hz', 'https://images.unsplash.com/photo-1678286743126-77884a4b12aa?auto=format&fit=crop&w=1400&q=80', 1, GETUTCDATE());
END
");
            logger.LogInformation("Database migrations applied for ProductDb.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed while migrating ProductDb.");
            throw;
        }
    }

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "Product.API v1");
            c.RoutePrefix = string.Empty;
            c.DocumentTitle = "Product.API";
        });
    }

    app.UseExceptionHandler();
    app.UseCors("AllowAll");
    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();
    app.MapHealthChecks("/health");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
