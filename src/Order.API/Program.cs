using System.Net.Http.Headers;
using System.Text;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Order.API.Data;
using Order.API.HttpClients;
using Order.API.Mappings;
using Order.API.Middleware;
using Order.API.Repositories;
using Order.API.Services;
using Polly;
using Polly.Extensions.Http;
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

    builder.Services.AddDbContext<OrderDbContext>(options =>
        options.UseSqlServer(
            builder.Configuration.GetConnectionString("DefaultConnection"),
            sqlOptions => sqlOptions.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null)));

    builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
    builder.Services.AddProblemDetails();
    builder.Services.AddScoped<IOrderRepository, OrderRepository>();
    builder.Services.AddAutoMapper(typeof(OrderProfile).Assembly);

    var productApiUrl = builder.Configuration["ServiceUrls:ProductAPI"] ?? "http://localhost:5001";
    builder.Services.AddHttpClient<IProductApiClient, ProductApiClient>(client =>
    {
        client.BaseAddress = new Uri(productApiUrl);
        client.Timeout = TimeSpan.FromSeconds(10);
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    })
    .AddPolicyHandler(GetRetryPolicy());

    builder.Services.AddScoped<ICartService, DbCartService>();
    builder.Services.AddScoped<IPaymentService, GatewayPaymentService>();
    builder.Services.AddHttpClient();

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
            Title = "Order.API",
            Version = "v1",
            Description = "Order, cart and checkout service"
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
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtIssuer,
                ValidAudience = jwtAudience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                ClockSkew = TimeSpan.FromMinutes(1)
            };
        });

    builder.Services.AddAuthorization();

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
        var db = scope.ServiceProvider.GetRequiredService<OrderDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        try
        {
            logger.LogInformation("Applying database migrations for OrderDb...");
            await db.Database.MigrateAsync();
            await db.Database.ExecuteSqlRawAsync(@"
IF OBJECT_ID(N'dbo.CartItems', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CartItems (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        UserId NVARCHAR(100) NOT NULL,
        ProductId INT NOT NULL,
        Quantity INT NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT(GETUTCDATE()),
        UpdatedAt DATETIME2 NOT NULL DEFAULT(GETUTCDATE())
    );
    CREATE UNIQUE INDEX IX_CartItems_UserId_ProductId ON dbo.CartItems(UserId, ProductId);
END
");
            await db.Database.ExecuteSqlRawAsync(@"
IF OBJECT_ID(N'dbo.PaymentTransactions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PaymentTransactions (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        OrderId INT NOT NULL,
        Provider NVARCHAR(20) NOT NULL,
        TransactionId NVARCHAR(100) NOT NULL,
        Status NVARCHAR(30) NOT NULL,
        PaymentUrl NVARCHAR(1000) NULL,
        RawRequest NVARCHAR(2000) NULL,
        RawCallback NVARCHAR(2000) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT(GETUTCDATE()),
        UpdatedAt DATETIME2 NULL
    );
    CREATE UNIQUE INDEX IX_PaymentTransactions_TransactionId ON dbo.PaymentTransactions(TransactionId);
END
");
            logger.LogInformation("Database migrations applied for OrderDb.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while migrating OrderDb.");
            throw;
        }
    }

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "Order.API v1");
            c.RoutePrefix = string.Empty;
            c.DocumentTitle = "Order.API";
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

static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy()
{
    return HttpPolicyExtensions
        .HandleTransientHttpError()
        .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)));
}
