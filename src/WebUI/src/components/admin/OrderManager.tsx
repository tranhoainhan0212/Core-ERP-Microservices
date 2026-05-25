import { useState } from 'react';
import type { Order } from '../../types/app';
import { ShoppingCart, Search, Eye, X, Clock, CheckCircle, XCircle, Truck, ChevronDown } from 'lucide-react';

interface OrderManagerProps {
  orders: Order[];
  onUpdateStatus: (orderId: number, newStatus: string) => void;
}

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
  Pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 ring-amber-200' },
  Confirmed: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50 ring-blue-200' },
  Processing: { icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50 ring-indigo-200' },
  Shipped: { icon: Truck, color: 'text-violet-600', bg: 'bg-violet-50 ring-violet-200' },
  Delivered: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 ring-emerald-200' },
  Cancelled: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 ring-red-200' },
};

export default function OrderManager({ orders, onUpdateStatus }: OrderManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / perPage));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * perPage, currentPage * perPage);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getStatusDisplay = (status: string) => {
    const cfg = statusConfig[status] || statusConfig.Pending;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${cfg.bg} ${cfg.color}`}>
        <Icon size={12} />
        {status}
      </span>
    );
  };

  // Order stats by status
  const statusCounts = STATUS_OPTIONS.map((s) => ({
    status: s,
    count: orders.filter((o) => o.status === s).length,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 shadow-lg shadow-orange-500/20">
          <ShoppingCart size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản lý đơn hàng</h2>
          <p className="text-xs text-slate-400">{orders.length} đơn hàng</p>
        </div>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Tất cả ({orders.length})
        </button>
        {statusCounts.map(({ status, count }) => (
          <button
            key={status}
            type="button"
            onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === status
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {status} ({count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          placeholder="Tìm theo mã đơn, tên, email khách hàng..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Mã đơn</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Khách hàng</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Tổng tiền</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Trạng thái</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Ngày tạo</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    Không tìm thấy đơn hàng nào
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr key={order.id} className="group border-b border-slate-50 transition-colors hover:bg-blue-50/30">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-blue-600">
                      #{order.orderNumber || order.id}
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-semibold text-slate-900">{order.customerName}</p>
                        <p className="text-xs text-slate-400">{order.customerEmail}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-900">
                      {order.totalAmount?.toLocaleString()} ₫
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {getStatusDisplay(order.status || 'Pending')}
                    </td>
                    <td className="px-5 py-3.5 text-center text-xs text-slate-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                          title="Xem chi tiết"
                        >
                          <Eye size={15} />
                        </button>
                        {/* Inline status change */}
                        <div className="relative">
                          <select
                            value={order.status || 'Pending'}
                            onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                            className="appearance-none rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-2 pr-6 text-xs font-medium text-slate-600 outline-none transition focus:border-blue-400"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-400">
              Hiển thị {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filteredOrders.length)} / {filteredOrders.length}
            </p>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 w-8 rounded-lg text-xs font-medium transition-all ${
                    currentPage === page
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white shadow-2xl" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                Chi tiết đơn #{selectedOrder.orderNumber || selectedOrder.id}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-400">Khách hàng</p>
                  <p className="mt-1 font-semibold text-slate-900">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Email</p>
                  <p className="mt-1 text-sm text-slate-700">{selectedOrder.customerEmail}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Tổng tiền</p>
                  <p className="mt-1 text-lg font-extrabold text-slate-900">{selectedOrder.totalAmount?.toLocaleString()} ₫</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Trạng thái</p>
                  <div className="mt-1">{getStatusDisplay(selectedOrder.status || 'Pending')}</div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Ngày tạo</p>
                  <p className="mt-1 text-sm text-slate-700">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Mã đơn</p>
                  <p className="mt-1 font-mono text-sm text-blue-600">#{selectedOrder.orderNumber || selectedOrder.id}</p>
                </div>
              </div>

              {/* Quick status update */}
              <div className="border-t border-slate-100 pt-4">
                <p className="mb-2 text-xs font-semibold text-slate-500">Cập nhật trạng thái</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        onUpdateStatus(selectedOrder.id, s);
                        setSelectedOrder({ ...selectedOrder, status: s });
                      }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        selectedOrder.status === s
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
