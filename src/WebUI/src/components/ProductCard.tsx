import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, Eye, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '../types/app';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80';
const FALLBACK_ALT =
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80';

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: number) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const isOutOfStock = product.stockQuantity === 0;
  const isNew = product.id % 3 === 0; // Simulate "NEW" badge

  const primaryImg = product.imageUrl || FALLBACK_IMAGE;
  const secondaryImg = FALLBACK_ALT;

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <article className="card-hover relative overflow-hidden rounded-2xl border border-white/[0.05] bg-[#0a0f1e]/90 backdrop-blur-md">
        {/* ─── Image area with dual-image hover swap ─── */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-purple-950/30 to-slate-900">
          {/* Primary image */}
          <motion.img
            src={primaryImg}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover"
            animate={{ opacity: isHovered ? 0 : 1, scale: isHovered ? 1.08 : 1 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          />
          {/* Secondary image on hover */}
          <motion.img
            src={secondaryImg}
            alt={`${product.name} alt view`}
            className="absolute inset-0 h-full w-full object-cover"
            animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 1.08 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          />

          {/* Top gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-transparent to-transparent opacity-70" />

          {/* Quick view */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <span className="glass-strong flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white">
                  <Eye size={14} />
                  Xem chi tiết
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Badges ─── */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {isNew && (
              <motion.span
                className="badge-bounce flex items-center gap-1 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-purple-500/30"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <Sparkles size={10} />
                NEW
              </motion.span>
            )}
            {isOutOfStock && (
              <span className="rounded-lg bg-red-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                Hết hàng
              </span>
            )}
            {isLowStock && !isOutOfStock && (
              <span className="rounded-lg bg-amber-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                Sắp hết
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 backdrop-blur-md">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            <span className="text-[11px] font-semibold text-white">4.{(product.id % 5) + 5}</span>
          </div>
        </div>

        {/* ─── Content ─── */}
        <div className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-purple-400/60">
            {product.sku}
          </p>
          <h3 className="mt-1.5 min-h-[40px] text-sm font-semibold leading-snug text-slate-200 transition-colors group-hover:text-purple-300">
            {product.name}
          </h3>

          <div className="mt-3 flex items-end justify-between gap-2">
            <div>
              <p className="text-lg font-bold text-white">{money.format(product.price)}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Còn {product.stockQuantity} sản phẩm
              </p>
            </div>

            <motion.button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                if (!isOutOfStock) onAddToCart(product.id);
              }}
              disabled={isOutOfStock}
              className={`cta-pulse inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                isOutOfStock
                  ? 'cursor-not-allowed bg-white/5 text-slate-600'
                  : 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/20'
              }`}
              whileTap={isOutOfStock ? {} : { scale: 0.92 }}
            >
              <ShoppingBag size={13} />
              {isOutOfStock ? 'Hết' : 'Thêm'}
            </motion.button>
          </div>
        </div>

        {/* Bottom neon glow */}
        <motion.div
          className="absolute bottom-0 left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-purple-500 to-transparent"
          animate={{ width: isHovered ? '70%' : '0%', opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.35 }}
        />
      </article>
    </Link>
  );
}
