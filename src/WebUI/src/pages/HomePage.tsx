import { Suspense, useMemo, useState, lazy } from 'react';
import ProductCard from '../components/ProductCard';
import Sidebar from '../components/Sidebar';
import type { MenuCategory, Product } from '../types/app';
import { useAppContext } from '../contexts/AppContext';
import { ArrowRight, Zap, Shield, Truck, Sparkles } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import { StaggerContainer, StaggerItem } from '../components/ScrollReveal';
import { motion } from 'framer-motion';

const Hero3DScene = lazy(() => import('../components/Hero3DScene'));

const categories: MenuCategory[] = ['All', 'Smartphones', 'Tablets', 'Watches', 'Buds', 'Accessories'];

function resolveCategory(product: Product): MenuCategory {
  const value = `${product.name} ${product.sku}`.toUpperCase();
  if (value.includes('TAB')) return 'Tablets';
  if (value.includes('WATCH') || value.includes('FIT')) return 'Watches';
  if (value.includes('BUD')) return 'Buds';
  if (value.includes('CASE') || value.includes('PEN') || value.includes('CHARG')) return 'Accessories';
  return 'Smartphones';
}

const features = [
  { icon: Zap, title: 'Hiệu năng vượt trội', desc: 'Chip xử lý thế hệ mới nhất', color: 'text-yellow-400' },
  { icon: Shield, title: 'Bảo hành chính hãng', desc: '24 tháng bảo hành toàn diện', color: 'text-emerald-400' },
  { icon: Truck, title: 'Giao hàng nhanh', desc: 'Miễn phí cho đơn từ 500K', color: 'text-blue-400' },
  { icon: Sparkles, title: 'Ưu đãi độc quyền', desc: 'Giảm giá lên đến 30%', color: 'text-purple-400' },
];

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const { products, isProductsLoading, addToCart } = useAppContext();

  const filteredProducts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      const byCategory = activeCategory === 'All' || resolveCategory(product) === activeCategory;
      const byKeyword =
        !keyword ||
        product.name.toLowerCase().includes(keyword) ||
        product.sku.toLowerCase().includes(keyword) ||
        (product.description ?? '').toLowerCase().includes(keyword);
      return byCategory && byKeyword;
    });
  }, [activeCategory, products, searchTerm]);

  return (
    <div className="pb-0">
      {/* ═══════ HERO SECTION WITH 3D ═══════ */}
      <section className="relative min-h-[92vh] overflow-hidden">
        {/* Ambient glow orbs */}
        <div className="absolute left-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[150px]" />
        <div className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-fuchsia-600/8 blur-[120px]" />
        <div className="absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-violet-600/6 blur-[100px]" />

        {/* 3D Canvas */}
        <Suspense fallback={null}>
          <Hero3DScene />
        </Suspense>

        {/* Hero content overlay */}
        <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-7xl items-center px-6 lg:px-8">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-1.5 backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-purple-400" style={{ animation: 'pulseGlow 2s infinite' }} />
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-purple-300">Galaxy 2026</span>
              </div>
            </motion.div>

            <motion.h1
              className="mt-7 text-5xl font-extrabold leading-[1.08] tracking-tight text-white md:text-6xl lg:text-7xl"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              Công nghệ{' '}
              <span className="gradient-text">thế hệ mới</span>
            </motion.h1>

            <motion.p
              className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 md:text-lg"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Khám phá bộ sưu tập thiết bị cao cấp mới nhất — từ smartphone flagship đến wearables thông minh, được thiết kế cho tương lai.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-wrap gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <a
                href="#products"
                className="cta-pulse inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-purple-500/25 transition-all hover:shadow-purple-500/40"
              >
                Khám phá ngay
                <ArrowRight size={16} />
              </a>
              <a
                href="#products"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-7 py-3.5 text-sm font-semibold text-slate-300 backdrop-blur-sm transition-all hover:border-purple-500/30 hover:bg-white/[0.06] hover:text-white"
              >
                Xem sản phẩm
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="mt-12 flex gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
            >
              {[
                { label: 'Sản phẩm', value: '200+' },
                { label: 'Khách hàng', value: '15K+' },
                { label: 'Đánh giá', value: '4.9★' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex h-8 w-5 items-start justify-center rounded-full border border-white/20 p-1">
            <div className="h-2 w-1 rounded-full bg-purple-400" />
          </div>
        </motion.div>
      </section>

      {/* ═══════ FEATURE STRIP ═══════ */}
      <ScrollReveal>
        <section className="border-y border-white/[0.04] bg-[#060b19]">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-0 px-4 lg:grid-cols-4">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  className={`flex items-center gap-3.5 px-5 py-6 ${
                    i < features.length - 1 ? 'border-r border-white/[0.04]' : ''
                  }`}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 neon-border">
                    <Icon size={18} className={feat.color} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{feat.title}</p>
                    <p className="text-[11px] text-slate-500">{feat.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </ScrollReveal>

      {/* ═══════ PRODUCTS SECTION ═══════ */}
      <section id="products" className="mx-auto mt-14 max-w-7xl scroll-mt-20 px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <Sidebar
            categories={categories}
            activeCategory={activeCategory}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onCategoryChange={setActiveCategory}
            products={products}
            resolveCategory={resolveCategory}
          />

          <div>
            <ScrollReveal>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-purple-400/50">
                    Sản phẩm
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-white">
                    {activeCategory === 'All' ? 'Tất cả sản phẩm' : activeCategory}
                  </h2>
                </div>
                <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-1.5 text-xs font-semibold text-slate-400">
                  {filteredProducts.length} sản phẩm
                </span>
              </div>
            </ScrollReveal>

            {isProductsLoading ? (
              <div className="flex items-center justify-center rounded-2xl border border-white/[0.04] bg-[#0a0f1e]/60 p-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-500/20 border-t-purple-500" />
                  <p className="text-sm text-slate-500">Đang tải sản phẩm...</p>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.04] bg-[#0a0f1e]/60 p-20 text-center">
                <p className="text-5xl">🔍</p>
                <p className="mt-4 text-sm font-medium text-slate-400">Không tìm thấy sản phẩm phù hợp</p>
                <p className="mt-1 text-xs text-slate-600">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              </div>
            ) : (
              <StaggerContainer className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <StaggerItem key={product.id}>
                    <ProductCard product={product} onAddToCart={(productId) => void addToCart(productId, 1)} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}