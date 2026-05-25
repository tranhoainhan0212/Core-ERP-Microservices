<<<<<<< HEAD
# 🚀 Core ERP Microservices

![.NET Core](https://img.shields.io/badge/.NET%208-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)
![SQL Server](https://img.shields.io/badge/SQL_Server-CC2927?style=for-the-badge&logo=microsoft-sql-server&logoColor=white)

Dự án Hệ thống quản lý lõi thông tin doanh nghiệp (ERP) thu nhỏ, được xây dựng theo kiến trúc **Microservices** để thể hiện kỹ năng xử lý phân tán, tối ưu hóa CSDL và khả năng mở rộng.

## ✨ Điểm nổi bật (Highlights)

- ✅ **Kiến trúc Microservices**: Chia nhỏ 2 domains (Catalog/Product & Order).
- ✅ **Identity.API**: JWT Auth, đăng ký/đăng nhập, role `Admin/Customer`, endpoint OAuth2 chuẩn hóa để tích hợp Google.
- ✅ **API Gateway**: Sử dụng **YARP** (.NET 8) làm Single Entry Point cho toàn bộ hệ thống.
- ✅ **Ecommerce Features**: Giỏ hàng theo user, checkout từ cart, thanh toán `MoMo/VNPay/COD`, quản lý đơn hàng.
- ✅ **Distributed Transaction**: Triển khai pattern **Saga-lite (Compensating Transaction)** tại `Order.API` để xử lý Rollback tồn kho nếu tạo đơn hàng thất bại. 
- ✅ **High Availability**: Sử dụng `IHttpClientFactory` kết hợp **Polly** Retry Policy. 
- ✅ **Optimistic Concurrency**: Xử lý Race Condition (Nhiều người mua cùng lúc) an toàn bằng raw SQL tại `Product.API`.
- ✅ **Validation & Observability**: Tích hợp `FluentValidation` và **Serilog** Structured Logging.

### Tài khoản demo nhanh
- `admin@coreerp.local` / `Admin@123` (Role: Admin)
- `customer@coreerp.local` / `Customer@123` (Role: Customer)

### Cấu hình OAuth2 + Payment thật
- `Identity.API`:
  - `OAuth2:Google:ClientId`
  - `OAuth2:Google:ClientSecret`
  - `OAuth2:Google:RedirectUri`
- `Order.API`:
  - `Payment:VNPay:TmnCode`
  - `Payment:VNPay:HashSecret`
  - `Payment:MoMo:PartnerCode`
  - `Payment:MoMo:AccessKey`
  - `Payment:MoMo:SecretKey`

---

## 🏗 Kiến Trúc Hệ Thống (Architecture)

```mermaid
graph TB
    subgraph Client
        A["🖥️ Postman / Swagger UI / Web App"]
    end

    subgraph "🐳 Docker Network (erp-network)"
        subgraph "ApiGateway :5000"
            GW["YARP Reverse Proxy"]
        end

        subgraph "Product.API :5001"
            B["ProductController"]
            B --> C["IProductRepository"]
            C --> D["ProductDbContext"]
        end

        subgraph "Order.API :5002"
            E["OrderController"]
            E --> F["IOrderRepository"]
            F --> G["OrderDbContext"]
            E --> H>["Polly Http Client"]
        end

        subgraph "SQL Server :1433"
            I[("ProductDb")]
            J[("OrderDb")]
        end
    end

    A -->|"HTTP GET/POST /api/* :5000"| GW
    GW -->|"/api/products/*"| B
    GW -->|"/api/orders/*"| E
    H -->|"HTTP GET/PUT /api/products :8080"| B
    
    D --> I
    G --> J

    style A fill:#1e293b,stroke:#38bdf8,color:#f8fafc
    style GW fill:#b91c1c,stroke:#ef4444,color:#fef2f2
    style B fill:#0f766e,stroke:#2dd4bf,color:#f0fdfa
    style E fill:#7e22ce,stroke:#c084fc,color:#faf5ff
    style I fill:#0c4a6e,stroke:#38bdf8,color:#e0f2fe
    style J fill:#581c87,stroke:#a855f7,color:#f3e8ff
```

---

## 🚀 Hướng Dẫn Chạy Dự Án Bằng Docker

Bạn không cần cài đặt SQL Server hay cấu hình thủ công. Mọi thứ đã được containerize bằng Docker Compose.

### Bước 1: Yêu cầu hệ thống
- Cài đặt **Docker Desktop** (Đảm bảo đang chạy).
- **.NET 8 SDK** (Chỉ cần nếu muốn build code ở ngoài Docker).

### Bước 2: Build & Spin up toàn bộ hệ thống
Mở Terminal / PowerShell tại thư mục thư mục gốc (nơi chứa file `docker-compose.yml`) và chạy lệnh:

```bash
docker-compose up -d --build
```

**Quá trình này sẽ:**
1. Tải SQL Server 2022 Image về.
2. Build Image cho `product-api`, `order-api`, và `api-gateway`.
3. Khởi động CSDL và tự động **Run Migrations** tạo bảng & Seed Data (Dữ liệu mẫu 5 sản phẩm).
4. Khởi động API.

> 🛠 **Kiểm tra trạng thái**: Chạy `docker ps` để đảm bảo 4 container (sqlserver, product-api, order-api, api-gateway) đang hiển thị ở trạng thái `Up`.

### Bước 3: Cách xem Logs (Kiểm tra hệ thống)

Bạn có thể xem các Structured Log xịn xò của **Serilog** bằng lệnh:

```bash
docker logs erp-order-api -f
docker logs erp-product-api -f
docker logs erp-api-gateway -f
```

*(Nhấn `Ctrl + C` để thoát chế độ xem log).*

### Bước 4: Tắt hệ thống

Nếu không dùng nữa, tắt cẩn thận bằng lệnh (để tránh lỗi treo port/network cứng):

```bash
docker-compose down
```

---

## 🎮 Hướng Dẫn Demo & Sử Dụng (Dành cho Postman / Swagger)

Tất cả request bên ngoài sẽ tương tác với **API Gateway** qua cổng `:5000`. Cổng 5001 và 5002 được mở chỉ để tiện dụng cho việc xem giao diện Swagger độc lập nếu muốn. Ở Demo này, chúng ta gọi xuyên qua Gateway (:5000).

### 1. Xem danh sách Sản Phẩm (Product.API)
Mở Postman hoặc Browser gõ vào địa chỉ:
```http
GET http://localhost:5000/api/products
```
> Kết quả: Bạn sẽ thấy danh sách 5 mặt hàng được Seed sẵn (VD: iPhone 15 Pro Max có Quantity = 50).

### 2. Kiểm tra tồn kho trước khi đặt hàng (Product.API)
Giả sử muốn kiểm tra tồn kho của `ProductId = 1`:
```http
GET http://localhost:5000/api/products/1/stock
```

### 3. Tạo đơn hàng thành công (Order.API -> Gọi ngầm Product.API)
Gửi 1 request POST đến `http://localhost:5000/api/orders`:

```json
{
  "customerName": "John Doe",
  "customerEmail": "john@doe.com",
  "items": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 2,
      "quantity": 1
    }
  ]
}
```
**Chuyện gì xảy ra phía dưới?**
- Request bay vào Gateway -> Route sang Order.API.
- Khởi động Mini Saga: `Order.API` liên hệ `Product.API` kiểm kho và tiến hành trừ kho. 
- `Product.API` dùng Optimistic Concurrency chặn Race Condition.
- Nếu trừ thành công, `Order.API` mới insert vào CSDL và trả về `201 Created`. Hãy gõ lại lệnh GET products ở Bước 1, bạn sẽ thấy kho bị trừ khớp với số lượng. 

### 4. Demo tính năng Data Validation (Fluent Validation)
Cố tình tạo đơn với số lượng âm `: -5` để test bảo mật:

```json
{
  "customerName": "John Hacker",
  "customerEmail": "hacker@evil.com",
  "items": [
    {
      "productId": 1,
      "quantity": -5
    }
  ]
}
```
> Kết quả: Bạn sẽ ăn ngay `400 Bad Request` với format Problem Details từ FluentValidation ở Gateway trả về, không làm crash backend.

### 5. Demo tính năng "Hoàn Kho" (Compensating Transaction) khi Hết hàng
Giả sử tồn kho Product 2 chỉ còn `5` món. Gửi đơn hàng yêu cầu `500` món:

```json
{
  "items": [
    { "productId": 1, "quantity": 1 },
    { "productId": 2, "quantity": 500 }
  ]
}
```
> Kết quả: Product 1 trừ thành công, nhưng Product 2 hết hàng -> Lỗi. Hệ thống sẽ tự động gọi HTTP PUT hoàn kho bù lại cho Product 1 (Rollback). Dữ liệu vẫn chuẩn xác 100% 
=======
# ERP-MICROSERVICE
>>>>>>> acd9299e2b4bd146807f7ccb0a72c3bf76aca50c
