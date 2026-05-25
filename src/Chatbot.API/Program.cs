// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  Chatbot.API — Program.cs                                                  ║
// ║  Cấu hình Dependency Injection, Semantic Kernel và Groq API                ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

using Chatbot.API.Services;
using Microsoft.SemanticKernel;
using OpenAI;
using System.ClientModel;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// 1. Cấu hình Logging (Serilog)
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] [{SourceContext}] {Message:lj}{NewLine}{Exception}"));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 2. Lấy cấu hình Groq API
var groqApiKey = builder.Configuration["OpenAI:ApiKey"] 
    ?? throw new InvalidOperationException("Missing ApiKey in configuration.");
var groqModel = builder.Configuration["OpenAI:Model"] ?? "llama-3.3-70b-versatile";
var groqEndpoint = builder.Configuration["OpenAI:Endpoint"] ?? "https://api.groq.com/openai/v1/";

// 3. Đăng ký Semantic Kernel với Groq thông qua OpenAI Connector
var kernelBuilder = builder.Services.AddKernel();
var openAIOptions = new OpenAIClientOptions { Endpoint = new Uri(groqEndpoint) };
var openAIClient = new OpenAIClient(new ApiKeyCredential(groqApiKey), openAIOptions);
kernelBuilder.AddOpenAIChatCompletion(modelId: groqModel, openAIClient: openAIClient);

// 4. Đăng ký Business Services
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<IChatbotService, ChatbotService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

try
{
    Log.Information("🚀 Khởi động Chatbot.API (Semantic Kernel + Groq API) thành công.");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Chatbot.API crash trong lúc khởi động.");
}
finally
{
    Log.CloseAndFlush();
}
