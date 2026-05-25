export type Role = 'Admin' | 'Customer';
export type MenuCategory = 'All' | 'Smartphones' | 'Tablets' | 'Watches' | 'Buds' | 'Accessories';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: UserProfile;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
}

export interface CartItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  subTotal: number;
}

export interface CartSummary {
  items: CartItem[];
  totalAmount: number;
}

export interface CheckoutResponse {
  orderId: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  paymentUrl?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info';
}
