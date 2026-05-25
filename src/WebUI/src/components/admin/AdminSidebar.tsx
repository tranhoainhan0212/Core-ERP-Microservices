import {
  BarChart3,
  Box,
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Home,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export type AdminTab = 'dashboard' | 'products' | 'orders' | 'revenue';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
  userName: string;
}

const menuItems: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'products', label: 'Sản phẩm', icon: Box },
  { id: 'orders', label: 'Đơn hàng', icon: ShoppingCart },
  { id: 'revenue', label: 'Doanh thu', icon: TrendingUp },
];

export default function AdminSidebar({ activeTab, onTabChange, onLogout, userName }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-200/60 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 ease-in-out ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
      style={{ minHeight: '100vh' }}
    >
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-7 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-md transition hover:bg-slate-100"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/25">
          <BarChart3 size={20} />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h2 className="text-base font-bold tracking-tight">CoreERP</h2>
            <p className="text-[11px] text-slate-400">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-4 flex-1 space-y-1 px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              title={item.label}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600/90 to-violet-600/80 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={20} className={`shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Back to Home */}
      <div className="px-3 mb-2">
        <button
          type="button"
          onClick={() => navigate('/')}
          title="Về trang chủ"
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-emerald-500/10 hover:text-emerald-400"
        >
          <Home size={20} className="shrink-0 transition-transform duration-200 group-hover:scale-105" />
          {!collapsed && <span>Về trang chủ</span>}
        </button>
      </div>

      {/* User / Logout */}
      <div className="border-t border-white/10 px-3 py-4">
        {!collapsed && (
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-xs font-bold uppercase text-white">
              {userName?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{userName || 'Admin'}</p>
              <p className="text-[11px] text-slate-400">Administrator</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onLogout}
          title="Đăng xuất"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}
