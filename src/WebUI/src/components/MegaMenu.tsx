import { ChevronRight, AlertCircle, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

export type MegaMenuCategory = 'Smartphones' | 'Tablets';

const MEGA_MENU: Record<
  MegaMenuCategory,
  {
    title: string;
    subtitle: string;
    groups: Array<{ title: string; items: string[] }>;
  }
> = {
  Smartphones: {
    title: 'Galaxy Smartphones',
    subtitle: 'Flagship camera, premium design, and AI-driven performance.',
    groups: [
      { title: 'Galaxy S', items: ['Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24'] },
      { title: 'Galaxy Z', items: ['Galaxy Z Fold', 'Galaxy Z Flip'] },
      { title: 'Galaxy A', items: ['Galaxy A55', 'Galaxy A35', 'Galaxy A25'] },
    ],
  },
  Tablets: {
    title: 'Galaxy Tablets',
    subtitle: 'Portable productivity with cinematic displays.',
    groups: [
      { title: 'Galaxy Tab S', items: ['Galaxy Tab S10 Ultra', 'Galaxy Tab S10+', 'Galaxy Tab S9 FE'] },
      { title: 'Galaxy Tab A', items: ['Galaxy Tab A9+', 'Galaxy Tab A9'] },
      { title: 'Accessories', items: ['Book Cover Keyboard', 'S Pen', 'Smart Cases'] },
    ],
  },
};

interface MegaMenuProps {
  category: MegaMenuCategory;
  onClose?: () => void;
}

export default function MegaMenu({ category, onClose }: MegaMenuProps) {
  const section = MEGA_MENU[category];
  const navigate = useNavigate();
  const { products, addToast } = useAppContext();
  const [tooltipItem, setTooltipItem] = useState<string | null>(null);

  const handleProductClick = (itemName: string) => {
    const matched = products.find(
      (p) => p.name.toLowerCase() === itemName.toLowerCase() ||
             p.name.toLowerCase().includes(itemName.toLowerCase()) ||
             itemName.toLowerCase().includes(p.name.toLowerCase())
    );

    if (!matched) {
      addToast(`Sản phẩm "${itemName}" chưa có trong hệ thống.`, 'info');
      setTooltipItem(itemName);
      setTimeout(() => setTooltipItem(null), 2500);
      return;
    }

    if (!matched.isActive) {
      addToast(`Sản phẩm "${matched.name}" hiện không khả dụng.`, 'info');
      setTooltipItem(itemName);
      setTimeout(() => setTooltipItem(null), 2500);
      return;
    }

    if (matched.stockQuantity <= 0) {
      addToast(`Sản phẩm "${matched.name}" đã hết hàng.`, 'info');
    }

    onClose?.();
    navigate(`/product/${matched.id}`);
  };

  const getProductStatus = (itemName: string): 'available' | 'out-of-stock' | 'not-found' => {
    const matched = products.find(
      (p) => p.name.toLowerCase() === itemName.toLowerCase() ||
             p.name.toLowerCase().includes(itemName.toLowerCase()) ||
             itemName.toLowerCase().includes(p.name.toLowerCase())
    );
    if (!matched || !matched.isActive) return 'not-found';
    if (matched.stockQuantity <= 0) return 'out-of-stock';
    return 'available';
  };

  return (
    <div
      className="absolute left-1/2 top-full z-50 w-[min(92vw,920px)] -translate-x-1/2 pt-4"
      onMouseLeave={onClose}
    >
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c1222]/95 p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl"
           style={{ animation: 'slideDown 0.25s ease-out' }}>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_2fr]">
          {/* Featured card */}
          <div className="rounded-2xl bg-gradient-to-br from-purple-950 to-violet-950 p-6 text-white">
            <p className="text-[10px] uppercase tracking-[0.25em] text-purple-300/60">Featured</p>
            <h3 className="mt-3 text-xl font-bold leading-tight">{section.title}</h3>
            <p className="mt-3 text-sm text-purple-200/60">{section.subtitle}</p>
            <button type="button" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-purple-300 transition hover:text-white">
              Khám phá
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Product links */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {section.groups.map((group) => (
              <div key={group.title} className="space-y-2.5">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{group.title}</h4>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const status = getProductStatus(item);
                    const isUnavailable = status === 'not-found';
                    const isOutOfStock = status === 'out-of-stock';
                    const showTooltip = tooltipItem === item;

                    return (
                      <li key={item} className="relative">
                        <button
                          type="button"
                          onClick={() => handleProductClick(item)}
                          className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-all ${
                            isUnavailable
                              ? 'text-slate-600 hover:bg-white/[0.03] hover:text-slate-500'
                              : isOutOfStock
                              ? 'text-slate-500 hover:bg-amber-500/5 hover:text-amber-400'
                              : 'text-slate-300 hover:bg-purple-500/10 hover:text-purple-300'
                          }`}
                        >
                          <span className="flex-1">{item}</span>
                          {isUnavailable && (
                            <span className="text-[10px] font-medium text-slate-600">Chưa có</span>
                          )}
                          {isOutOfStock && (
                            <span className="text-[10px] font-medium text-amber-500/60">Hết hàng</span>
                          )}
                          {status === 'available' && (
                            <ExternalLink size={12} className="text-slate-600 opacity-0 transition group-hover:opacity-100" />
                          )}
                        </button>

                        {showTooltip && (
                          <div className="absolute left-0 top-full z-10 mt-1 flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs text-white shadow-lg"
                               style={{ animation: 'fadeInUp 0.2s ease-out', whiteSpace: 'nowrap' }}>
                            <AlertCircle size={12} className="shrink-0 text-amber-400" />
                            {isUnavailable ? 'Sản phẩm chưa có trong hệ thống' : 'Sản phẩm đã hết hàng'}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
