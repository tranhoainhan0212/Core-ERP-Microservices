import { LogOut, Settings, ShoppingBag, Heart } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

interface UserDropdownProps {
  onClose?: () => void;
}

export default function UserDropdown({ onClose }: UserDropdownProps) {
  const { user, logout } = useAppContext();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    onClose?.();
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-72 bg-white/95 backdrop-blur-xl border border-white/40 rounded-2xl shadow-2xl overflow-hidden animate-slideDown">
      {/* Header with user info */}
      <div className="bg-gradient-to-r from-samsung-blue/15 via-samsung-blue/5 to-transparent p-6 border-b border-gray-100/40">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-samsung-blue to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {user.fullName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 truncate">{user.fullName}</h3>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
            <span className="inline-block text-xs font-semibold text-samsung-blue bg-samsung-blue/15 px-2.5 py-1 rounded-full mt-1.5">
              {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="p-3 space-y-1">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-samsung-blue/10 transition-colors duration-150 text-gray-700 hover:text-samsung-blue font-medium text-sm group">
          <ShoppingBag size={18} className="group-hover:scale-110 transition-transform" />
          Đơn hàng của tôi
        </button>

        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-samsung-blue/10 transition-colors duration-150 text-gray-700 hover:text-samsung-blue font-medium text-sm group">
          <Heart size={18} className="group-hover:scale-110 transition-transform" />
          Danh mục yêu thích
        </button>

        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-samsung-blue/10 transition-colors duration-150 text-gray-700 hover:text-samsung-blue font-medium text-sm group">
          <Settings size={18} className="group-hover:scale-110 transition-transform" />
          Cài đặt tài khoản
        </button>
      </div>

      {/* Divider with gradient */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-2"></div>

      {/* Logout button */}
      <div className="p-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 transition-all duration-200 text-red-600 hover:text-red-700 font-semibold text-sm border border-red-100 hover:border-red-200 group"
        >
          <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
