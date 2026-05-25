using AutoMapper;
using Product.API.DTOs;

namespace Product.API.Mappings;

using ProductEntity = Entities.Product;

public class ProductProfile : Profile
{
    public ProductProfile()
    {
        // Entity → DTO
        CreateMap<ProductEntity, ProductDto>();

        CreateMap<ProductEntity, ProductStockDto>()
            .ForCtorParam("ProductId", opt => opt.MapFrom(src => src.Id))
            .ForCtorParam("InStock", opt => opt.MapFrom(src => src.StockQuantity > 0));

        // DTO → Entity
        CreateMap<CreateProductDto, ProductEntity>()
            .ForMember(dest => dest.IsActive, opt => opt.MapFrom(_ => true))
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow));
    }
}
