import { useMemo, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, ArrowLeft, CreditCard, Truck, Shield, Trash2, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../contexts/AppContext';
import ScrollReveal from '../components/ScrollReveal';
import ProductCard from '../components/ProductCard';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1200&q=80';

/* ── Animated counter for smooth price transitions ── */
function AnimatedPrice({ value, formatter }: { value: number; formatter: Intl.NumberFormat }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevRef = useRef(value);
  const animFrame = useRef<number>(0);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    const duration = 500; // ms
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(start + (end - start) * eased);

      if (progress < 1) {
        animFrame.current = requestAnimationFrame(animate);
      } else {
        prevRef.current = end;
      }
    };

    animFrame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame.current);
  }, [value]);

  return <span className="price-transition">{formatter.format(displayValue)}</span>;
}

export default function CartPage() {
  const [paymentMethod, setPaymentMethod] = useState<'MOMO' | 'VNPAY' | 'COD'>('COD');
  const { cart, checkout, checkoutResult, products, updateCartQuantity, addToCart } = useAppContext();

  const money = useMemo(() => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }), []);

  const productImageMap = useMemo(() => {
    const map = new Map<number, string>();
    products.forEach((product) => map.set(product.id, product.imageUrl || FALLBACK_IMAGE));
    return map;
  }, [products]);

  // Cross-sell: pick products NOT in cart
  const crossSellProducts = useMemo(() => {
    const cartIds = new Set(cart.items.map((i) => i.productId));
    return products.filter((p) => !cartIds.has(p.id) && p.stockQuantity > 0).slice(0, 3);
  }, [products, cart.items]);

  if (cart.items.length === 0) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <motion.div
          className="flex flex-col items-center rounded-3xl border border-white/[0.05] bg-[#0a0f1e]/80 p-16 text-center backdrop-blur-md"
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-500/10">
            <ShoppingBag size={36} className="text-purple-400" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-white">Giỏ hàng trống</h1>
          <p className="mt-2 text-sm text-slate-500">Thêm sản phẩm từ trang chủ để bắt đầu mua sắm.</p>
          <Link
            to="/"
            className="cta-pulse mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20"
          >
            <ArrowLeft size={16} />
            Khám phá sản phẩm
          </Link>
        </motion.div>
      </section>
    );
  }

  const paymentOptions = [
    { value: 'COD' as const, label: 'Thanh toán khi nhận hàng', icon: Truck, desc: 'Thanh toán bằng tiền mặt' },
    { value: 'MOMO' as const, label: 'Ví MOMO', icon: CreditCard, desc: 'Thanh toán qua ví điện tử' },
    { value: 'VNPAY' as const, label: 'VNPAY', icon: CreditCard, desc: 'ATM / Visa / MasterCard' },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ScrollReveal>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-400 transition hover:text-purple-300">
          <ArrowLeft size={14} />
          Tiếp tục mua sắm
        </Link>

        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold text-white">Giỏ hàng</h1>
          <p className="mt-1 text-sm text-slate-500">{cart.items.length} sản phẩm trong giỏ</p>
        </div>
      </ScrollReveal>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr]">
        {/* ─── Cart Items ─── */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {cart.items.map((item, index) => (
              <motion.article
                key={item.productId}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                exit={{ opacity: 0, x: -100, transition: { duration: 0.3 } }}
                className="group grid items-center gap-4 rounded-2xl border border-white/[0.05] bg-[#0a0f1e]/80 p-4 backdrop-blur-md transition-all hover:border-purple-500/15 sm:grid-cols-[88px_1fr_auto]"
              >
                <Link to={`/product/${item.productId}`}>
                  <img
                    src={productImageMap.get(item.productId) || FALLBACK_IMAGE}
                    alt={item.productName}
                    className="h-20 w-20 rounded-xl border border-white/[0.05] object-cover transition-transform hover:scale-105"
                  />
                </Link>

                <div>
                  <Link to={`/product/${item.productId}`} className="font-semibold text-white transition hover:text-purple-300">
                    {item.productName}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">{money.format(item.unitPrice)} / sản phẩm</p>

                  <div className="mt-3 flex items-center gap-2">
                    <div className="inline-flex items-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
                      <button
                        type="button"
                        onClick={() => void updateCartQuantity(item.productId, Math.max(1, item.quantity - 1))}
                        className="rounded-l-xl p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        <Minus size={14} />
                      </button>
                      <motion.span
                        key={item.quantity}
                        className="min-w-8 text-center text-sm font-semibold text-white"
                        initial={{ y: -8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.quantity}
                      </motion.span>
                      <button
                        type="button"
                        onClick={() => void updateCartQuantity(item.productId, item.quantity + 1)}
                        className="rounded-r-xl p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => void updateCartQuantity(item.productId, 0)}
                      className="rounded-xl p-2 text-slate-600 transition hover:bg-red-500/10 hover:text-red-400"
                      title="Xóa sản phẩm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <p className="text-right text-base font-bold text-white">
                  <AnimatedPrice value={item.subTotal} formatter={money} />
                </p>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>

        {/* ─── Order Summary (Glassmorphism) ─── */}
        <ScrollReveal direction="right" delay={0.15}>
          <aside className="glass-strong h-fit rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white">Tổng đơn hàng</h2>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span>Tạm tính ({cart.items.length} sản phẩm)</span>
                <span className="text-white">
                  <AnimatedPrice value={cart.totalAmount} formatter={money} />
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Phí vận chuyển</span>
                <span className="font-medium text-emerald-400">Miễn phí</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 text-lg font-bold text-white">
                <span>Tổng cộng</span>
                <span className="gradient-text-bright text-xl">
                  <AnimatedPrice value={cart.totalAmount} formatter={money} />
                </span>
              </div>
            </div>

            {/* Payment method */}
            <div className="mt-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-400/50">Phương thức thanh toán</p>
              <div className="mt-3 space-y-2">
                {paymentOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isActive = paymentMethod === opt.value;
                  return (
                    <motion.button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentMethod(opt.value)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all ${
                        isActive
                          ? 'border-purple-500/30 bg-purple-500/[0.08] text-white shadow-[0_0_20px_rgba(168,85,247,0.1)]'
                          : 'border-white/[0.05] bg-white/[0.02] text-slate-400 hover:border-white/[0.08] hover:text-slate-300'
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isActive ? 'bg-purple-500/20' : 'bg-white/[0.04]'}`}>
                        <Icon size={16} className={isActive ? 'text-purple-400' : 'text-slate-500'} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-[11px] text-slate-500">{opt.desc}</p>
                      </div>
                      {isActive && (
                        <motion.div
                          className="h-2.5 w-2.5 rounded-full bg-purple-400 shadow-lg shadow-purple-500/50"
                          layoutId="payment-indicator"
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Security */}
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/[0.03] bg-white/[0.02] px-3 py-2.5">
              <Shield size={14} className="text-emerald-400" />
              <p className="text-[11px] text-slate-500">Thanh toán được bảo mật bởi SSL 256-bit</p>
            </div>

            <motion.button
              type="button"
              onClick={() => void checkout(paymentMethod)}
              className="cta-pulse mt-5 w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-3.5 text-sm font-semibold text-white shadow-xl shadow-purple-500/25 transition-all hover:shadow-purple-500/40"
              whileTap={{ scale: 0.97 }}
            >
              Đặt hàng • <AnimatedPrice value={cart.totalAmount} formatter={money} />
            </motion.button>

            {checkoutResult && (
              <motion.div
                className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs text-emerald-400"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                ✓ Đơn hàng <span className="font-bold">{checkoutResult.orderNumber}</span> đã được tạo thành công.
              </motion.div>
            )}
          </aside>
        </ScrollReveal>
      </div>

      {/* ═══════ CROSS-SELL / UPSELL SECTION ═══════ */}
      {crossSellProducts.length > 0 && (
        <ScrollReveal delay={0.3}>
          <div className="mt-16">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-purple-400" />
                <h3 className="text-xl font-bold text-white">Có thể bạn cũng thích</h3>
              </div>
              <Link to="/" className="flex items-center gap-1 text-sm font-medium text-purple-400 transition hover:text-purple-300">
                Xem tất cả <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {crossSellProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={(productId) => void addToCart(productId, 1)}
                />
              ))}
            </div>
          </div>
        </ScrollReveal>
      )}
    </section>
  );
}
