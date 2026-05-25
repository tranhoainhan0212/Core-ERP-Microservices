using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace Product.API.Services;

public interface IImageUploadService
{
    Task<string?> UploadImageAsync(IFormFile file);
}

public class CloudinaryImageUploadService : IImageUploadService
{
    private readonly Cloudinary _cloudinary;
    private readonly ILogger<CloudinaryImageUploadService> _logger;

    public CloudinaryImageUploadService(IConfiguration config, ILogger<CloudinaryImageUploadService> logger)
    {
        _logger = logger;
        var acc = new Account(
            config["Cloudinary:CloudName"],
            config["Cloudinary:ApiKey"],
            config["Cloudinary:ApiSecret"]
        );
        _cloudinary = new Cloudinary(acc);
        _cloudinary.Api.Secure = true;
    }

    public async Task<string?> UploadImageAsync(IFormFile file)
    {
        if (file.Length > 0)
        {
            await using var stream = file.OpenReadStream();
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Transformation = new Transformation().Height(1000).Width(1000).Crop("limit").Quality("auto:good")
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);

            if (uploadResult.Error != null)
            {
                _logger.LogError("Cloudinary Upload Error: {Error}", uploadResult.Error.Message);
                return null;
            }

            return uploadResult.SecureUrl.ToString();
        }

        return null;
    }
}
