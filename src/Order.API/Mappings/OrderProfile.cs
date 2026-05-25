using AutoMapper;
using Order.API.DTOs;
using OrderEntity = Order.API.Entities.Order;
using OrderItemEntity = Order.API.Entities.OrderItem;

namespace Order.API.Mappings;

public class OrderProfile : Profile
{
    public OrderProfile()
    {
        CreateMap<OrderEntity, OrderDto>();
        CreateMap<OrderEntity, OrderDetailDto>();
        CreateMap<OrderItemEntity, OrderItemDto>();
    }
}
