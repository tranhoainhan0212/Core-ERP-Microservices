import { Search, Layers, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MenuCategory, Product } from '../types/app';
import ScrollReveal from './ScrollReveal';

interface SidebarProps {
  categories: MenuCategory[];
  activeCategory: MenuCategory;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onCategoryChange: (category: MenuCategory) => void;
  products: Product[];
  resolveCategory: (product: Product) => MenuCategory;
}

const categoryIcons: Record<string, string> = {
  All: '🌐',
  Smartphones: '📱',
  Tablets: '📲',
  Watches: '⌚',
  Buds: '🎧',
  Accessories: '🔌',
};

export default function Sidebar({
  categories,
  activeCategory,
  searchTerm,
  onSearchTermChange,
  onCategoryChange,
  products,
  resolveCategory,
}: SidebarProps) {
  // Compute category counts
  const categoryCounts: Record<string, number> = { All: products.length };
  for (const p of products) {
    const cat = resolveCategory(p);
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  return (
    <ScrollReveal direction="left" delay={0.1}>
      <aside className="glass-strong h-fit space-y-6 rounded-2xl p-5">
        {/* Search */}
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-400/60">
            <Search size={12} />
            Tìm kiếm
          </div>
          <div className="relative mt-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              placeholder="Tên sản phẩm hoặc SKU..."
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-purple-500/40 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.1)]"
            />
          </div>
        </div>

        {/* Categories with counts */}
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-400/60">
            <Layers size={12} />
            Danh mục
          </div>
          <div className="mt-3 space-y-1">
            {categories.map((category) => {
              const count = categoryCounts[category] || 0;
              const isActive = activeCategory === category;

              return (
                <motion.button
                  key={category}
                  type="button"
                  onClick={() => onCategoryChange(category)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600/20 to-fuchsia-600/10 text-purple-300 shadow-sm shadow-purple-500/10'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                  }`}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="text-base">{categoryIcons[category] || '📦'}</span>
                  <span className="flex-1">{category === 'All' ? 'Tất cả' : category}</span>
                  <span
                    className={`min-w-[28px] rounded-lg px-1.5 py-0.5 text-center text-[10px] font-bold ${
                      isActive
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'bg-white/[0.04] text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Promo card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-950/80 to-fuchsia-950/60 p-5 text-center">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-purple-500/10 blur-2xl" />
          <Flame size={20} className="mx-auto text-purple-400" />
          <p className="mt-2 text-xs font-bold uppercase tracking-wider text-purple-400">Flash Sale</p>
          <p className="mt-1 text-xl font-bold text-white">Giảm đến 30%</p>
          <p className="mt-1 text-[11px] text-slate-400">Cho đơn hàng đầu tiên</p>
          <button
            type="button"
            className="mt-3 rounded-lg bg-purple-600/30 px-4 py-1.5 text-xs font-semibold text-purple-300 transition hover:bg-purple-600/50"
          >
            Xem ngay →
          </button>
        </div>
      </aside>
    </ScrollReveal>
  );
}
