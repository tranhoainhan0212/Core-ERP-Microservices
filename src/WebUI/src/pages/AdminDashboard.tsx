import { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import {
  ShoppingCart,
  Package,
  TrendingUp,
  Users,
  BarChart3,
  Calendar,
  ArrowUpRight,
  AlertTriangle,
} from 'lucide-react';
import type { Product } from '../types/app';
import AdminSidebar from '../components/admin/AdminSidebar';
import type { AdminTab } from '../components/admin/AdminSidebar';
import StatCard from '../components/admin/StatCard';
import RevenueChart from '../components/admin/RevenueChart';
import ProductManager from '../components/admin/ProductManager';
import OrderManager from '../components/admin/OrderManager';

export default function AdminDashboard() {
  const {
    adminOrders,
    products,
    user,
    isAdmin,
    setProducts,
    setAdminOrders,
    addToast,
    apiFetch,
    logout,
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // ------ Product CRUD ------
  const buildProductBody = (product: Omit<Product, 'id'> | Product, imageFile?: File): BodyInit => {
    if (imageFile) {
      const formData = new FormData();
      formData.append('name', product.name);
      formData.append('sku', product.sku);
      formData.append('price', String(product.price));
      formData.append('stockQuantity', String(product.stockQuantity));
      formData.append('description', product.description || '');
      formData.append('isActive', String(product.isActive));
      formData.append('image', imageFile);
      return formData;
    }
    return JSON.stringify(product);
  };

  const handleAddProduct = useCallback(async (product: Omit<Product, 'id'>, imageFile?: File) => {
    try {
      const body = buildProductBody(product, imageFile);
      const created = await apiFetch<Product>('/products', {
        method: 'POST',
        body,
      });
      setProducts([...products, created]);
      addToast('Đã thêm sản phẩm thành công!', 'success');
    } catch (err) {
      addToast((err as Error).message || 'Lỗi khi thêm sản phẩm.', 'error');
    }
  }, [apiFetch, products, setProducts, addToast]);

  const handleEditProduct = useCallback(async (product: Product, imageFile?: File) => {
    try {
      const body = buildProductBody(product, imageFile);
      await apiFetch<Product>(`/products/${product.id}`, {
        method: 'PUT',
        body,
      });
      setProducts(products.map((p) => (p.id === product.id ? product : p)));
      addToast('Đã cập nhật sản phẩm!', 'success');
    } catch (err) {
      addToast((err as Error).message || 'Lỗi khi cập nhật sản phẩm.', 'error');
    }
  }, [apiFetch, products, setProducts, addToast]);

  const handleDeleteProduct = useCallback(async (id: number) => {
    try {
      await apiFetch(`/products/${id}`, { method: 'DELETE' });
      setProducts(products.filter((p) => p.id !== id));
      addToast('Đã xóa sản phẩm.', 'success');
    } catch (err) {
      addToast((err as Error).message || 'Lỗi khi xóa sản phẩm.', 'error');
    }
  }, [apiFetch, products, setProducts, addToast]);

  // ------ Order Status Update ------
  const handleUpdateOrderStatus = useCallback(async (orderId: number, newStatus: string) => {
    try {
      await apiFetch(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setAdminOrders(
        adminOrders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      addToast(`Đã cập nhật trạng thái đơn hàng #${orderId}`, 'success');
    } catch (err) {
      addToast((err as Error).message || 'Lỗi khi cập nhật trạng thái.', 'error');
    }
  }, [apiFetch, adminOrders, setAdminOrders, addToast]);

  // ------ Computed stats ------
  const stats = useMemo(() => {
    const totalRevenue = adminOrders?.reduce((s, o) => s + (o.totalAmount || 0), 0) || 0;
    const uniqueCustomers = new Set(adminOrders?.map((o) => o.customerEmail)).size;

    // Month-over-month change (simple estimate)
    const now = new Date();
    const thisMonth = adminOrders?.filter((o) => {
      const d = new Date(o.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }) || [];
    const lastMonth = adminOrders?.filter((o) => {
      const d = new Date(o.createdAt);
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    }) || [];

    const thisRevenue = thisMonth.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const lastRevenue = lastMonth.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const revenueTrend = lastRevenue > 0 ? ((thisRevenue - lastRevenue) / lastRevenue) * 100 : 0;
    const orderTrend = lastMonth.length > 0 ? ((thisMonth.length - lastMonth.length) / lastMonth.length) * 100 : 0;

    return { totalRevenue, uniqueCustomers, revenueTrend, orderTrend, thisMonth };
  }, [adminOrders]);

  // Recent orders for overview
  const recentOrders = useMemo(() => {
    return [...(adminOrders || [])]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [adminOrders]);

  // Low stock products
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.stockQuantity <= 5 && p.isActive);
  }, [products]);

  // Access denied
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="mx-4 max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-lg">
          <AlertTriangle size={48} className="mx-auto mb-4 text-amber-500" />
          <h2 className="text-xl font-bold text-slate-900">Truy cập bị từ chối</h2>
          <p className="mt-2 text-slate-600">Bạn không có quyền truy cập Admin Dashboard</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={logout}
        userName={user?.fullName || 'Admin'}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/60 bg-white/80 px-8 py-4 backdrop-blur-lg">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {activeTab === 'dashboard' && 'Tổng quan'}
              {activeTab === 'products' && 'Quản lý sản phẩm'}
              {activeTab === 'orders' && 'Quản lý đơn hàng'}
              {activeTab === 'revenue' && 'Phân tích doanh thu'}
            </h1>
            <p className="mt-0.5 text-sm text-slate-400">
              {new Date().toLocaleDateString('vi-VN', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-bold text-white shadow-lg shadow-emerald-500/20">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* ===== DASHBOARD TAB ===== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
              {/* Welcome */}
              <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 p-6 text-white shadow-xl shadow-blue-600/15">
                <h2 className="text-2xl font-bold">Chào mừng trở lại, {user?.fullName}! 👋</h2>
                <p className="mt-1 text-blue-100">
                  Quản lý hệ thống CoreERP Galaxy — đơn hàng, sản phẩm và doanh thu.
                </p>
              </div>

              {/* Stat Cards */}
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Tổng đơn hàng"
                  value={adminOrders?.length || 0}
                  icon={ShoppingCart}
                  gradient="from-blue-500 to-blue-600"
                  trend={stats.orderTrend}
                  subtitle="Tất cả đơn hàng"
                />
                <StatCard
                  label="Sản phẩm"
                  value={products?.length || 0}
                  icon={Package}
                  gradient="from-violet-500 to-purple-600"
                  subtitle={`${lowStockProducts.length} sắp hết hàng`}
                />
                <StatCard
                  label="Tổng doanh thu"
                  value={`${stats.totalRevenue.toLocaleString()} ₫`}
                  icon={TrendingUp}
                  gradient="from-emerald-500 to-teal-600"
                  trend={stats.revenueTrend}
                />
                <StatCard
                  label="Khách hàng"
                  value={stats.uniqueCustomers}
                  icon={Users}
                  gradient="from-orange-500 to-rose-600"
                  subtitle="Khách hàng duy nhất"
                />
              </div>

              {/* Chart + Activity */}
              <div className="grid gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2">
                  <RevenueChart orders={adminOrders || []} />
                </div>

                {/* Recent Activity */}
                <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm">
                  <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                    <Calendar size={18} className="text-blue-500" />
                    <h3 className="text-sm font-bold text-slate-900">Hoạt động gần đây</h3>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {recentOrders.length === 0 ? (
                      <div className="px-5 py-8 text-center text-sm text-slate-400">
                        Chưa có hoạt động nào
                      </div>
                    ) : (
                      recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50/50">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                            <ShoppingCart size={14} className="text-blue-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900">{order.customerName}</p>
                            <p className="text-xs text-slate-400">{formatDate(order.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-slate-900">{order.totalAmount?.toLocaleString()} ₫</p>
                            <div className="flex items-center justify-end gap-1">
                              <ArrowUpRight size={10} className="text-emerald-500" />
                              <span className="text-[10px] font-medium text-emerald-600">{order.status || 'Pending'}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Low Stock Alert */}
              {lowStockProducts.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-600" />
                    <h3 className="text-sm font-bold text-amber-800">Cảnh báo tồn kho thấp</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {lowStockProducts.slice(0, 6).map((p) => (
                      <div key={p.id} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                          <Package size={16} className="text-amber-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">{p.name}</p>
                          <p className="text-xs text-red-600 font-semibold">Còn {p.stockQuantity} sản phẩm</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick actions */}
              <div className="grid gap-4 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20 transition-transform group-hover:scale-110">
                    <Package size={22} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900">Quản lý sản phẩm</p>
                    <p className="text-xs text-slate-400">Thêm, sửa, xóa sản phẩm</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 shadow-lg shadow-orange-500/20 transition-transform group-hover:scale-110">
                    <ShoppingCart size={22} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900">Quản lý đơn hàng</p>
                    <p className="text-xs text-slate-400">Xử lý & theo dõi đơn hàng</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('revenue')}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 transition-transform group-hover:scale-110">
                    <BarChart3 size={22} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900">Phân tích doanh thu</p>
                    <p className="text-xs text-slate-400">Biểu đồ & thống kê</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ===== PRODUCTS TAB ===== */}
          {activeTab === 'products' && (
            <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
              <ProductManager
                products={products}
                onAddProduct={handleAddProduct}
                onEditProduct={handleEditProduct}
                onDeleteProduct={handleDeleteProduct}
              />
            </div>
          )}

          {/* ===== ORDERS TAB ===== */}
          {activeTab === 'orders' && (
            <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
              <OrderManager
                orders={adminOrders || []}
                onUpdateStatus={handleUpdateOrderStatus}
              />
            </div>
          )}

          {/* ===== REVENUE TAB ===== */}
          {activeTab === 'revenue' && (
            <div className="space-y-6" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
              {/* Revenue stat cards */}
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Doanh thu tháng này"
                  value={`${stats.thisMonth.reduce((s, o) => s + (o.totalAmount || 0), 0).toLocaleString()} ₫`}
                  icon={TrendingUp}
                  gradient="from-emerald-500 to-teal-600"
                  trend={stats.revenueTrend}
                />
                <StatCard
                  label="Đơn hàng tháng này"
                  value={stats.thisMonth.length}
                  icon={ShoppingCart}
                  gradient="from-blue-500 to-blue-600"
                  trend={stats.orderTrend}
                />
                <StatCard
                  label="Giá trị trung bình/đơn"
                  value={`${(stats.thisMonth.length > 0 ? stats.thisMonth.reduce((s, o) => s + (o.totalAmount || 0), 0) / stats.thisMonth.length : 0).toLocaleString()} ₫`}
                  icon={BarChart3}
                  gradient="from-violet-500 to-purple-600"
                />
                <StatCard
                  label="Tổng doanh thu"
                  value={`${stats.totalRevenue.toLocaleString()} ₫`}
                  icon={TrendingUp}
                  gradient="from-orange-500 to-rose-600"
                />
              </div>

              {/* Full chart */}
              <RevenueChart orders={adminOrders || []} />

              {/* Top orders table */}
              <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
                  <ShoppingCart size={18} className="text-blue-500" />
                  <h3 className="text-sm font-bold text-slate-900">Đơn hàng có giá trị cao nhất</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80">
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">#</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Khách hàng</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Tổng tiền</th>
                        <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Ngày</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...(adminOrders || [])]
                        .sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0))
                        .slice(0, 5)
                        .map((order, idx) => (
                          <tr key={order.id} className="border-b border-slate-50 hover:bg-blue-50/30">
                            <td className="px-5 py-3 font-bold text-slate-400">{idx + 1}</td>
                            <td className="px-5 py-3">
                              <p className="font-semibold text-slate-900">{order.customerName}</p>
                              <p className="text-xs text-slate-400">{order.customerEmail}</p>
                            </td>
                            <td className="px-5 py-3 text-right font-bold text-emerald-600">
                              {order.totalAmount?.toLocaleString()} ₫
                            </td>
                            <td className="px-5 py-3 text-center text-xs text-slate-500">
                              {formatDate(order.createdAt)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
