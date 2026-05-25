import { Suspense, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Star, Shield, Truck, RotateCcw, Check, Package, RotateCw, Minus, Plus } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox, Float, MeshDistortMaterial } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../contexts/AppContext';
import ScrollReveal from '../components/ScrollReveal';
import { useRef } from 'react';
import type { Mesh } from 'three';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1200&q=80';

/* ── 3D Product model (abstract phone representation) ── */
function ProductModel() {
  const ref = useRef<Mesh>(null!);
  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * 0.3;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <group ref={ref}>
        {/* Phone body */}
        <RoundedBox args={[1.8, 3.4, 0.15]} radius={0.12} smoothness={4}>
          <MeshDistortMaterial
            color="#1e1b4b"
            emissive="#7c3aed"
            emissiveIntensity={0.15}
            roughness={0.1}
            metalness={0.95}
            distort={0.02}
            speed={2}
          />
        </RoundedBox>
        {/* Screen */}
        <RoundedBox args={[1.6, 3.1, 0.01]} radius={0.08} smoothness={4} position={[0, 0, 0.08]}>
          <meshStandardMaterial color="#0f0a2a" emissive="#a855f7" emissiveIntensity={0.05} roughness={0.2} metalness={0.8} />
        </RoundedBox>
        {/* Camera module */}
        <mesh position={[-0.5, 1.2, -0.09]}>
          <cylinderGeometry args={[0.12, 0.12, 0.05, 32]} />
          <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[-0.15, 1.2, -0.09]}>
          <cylinderGeometry args={[0.1, 0.1, 0.05, 32]} />
          <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
    </Float>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const productId = Number(id);
  const [viewMode, setViewMode] = useState<'image' | '3d'>('image');
  const [quantity, setQuantity] = useState(1);

  const { products, addToCart } = useAppContext();
  const product = products.find((item) => item.id === productId) ?? null;

  const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

  const handleAddToCart = useCallback(() => {
    if (product && product.stockQuantity > 0) {
      void addToCart(product.id, quantity);
    }
  }, [product, quantity, addToCart]);

  if (!product) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center rounded-3xl border border-white/[0.05] bg-[#0a0f1e]/80 p-16 text-center backdrop-blur-md">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10">
            <Package size={36} className="text-red-400" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-white">Sản phẩm không tồn tại</h1>
          <p className="mt-2 text-sm text-slate-500">Sản phẩm này có thể đã bị gỡ hoặc không khả dụng.</p>
          <Link
            to="/"
            className="cta-pulse mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20"
          >
            <ArrowLeft size={16} />
            Về trang chủ
          </Link>
        </div>
      </section>
    );
  }

  const isOutOfStock = product.stockQuantity === 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <ScrollReveal>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-400 transition hover:text-purple-300">
          <ArrowLeft size={14} />
          Về trang sản phẩm
        </Link>
      </ScrollReveal>

      <div className="mt-6 grid gap-8 md:grid-cols-[1.15fr_1fr]">
        {/* ─── Image / 3D Viewer ─── */}
        <ScrollReveal direction="left" delay={0.1}>
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.05] bg-[#0a0f1e]/80 neon-border">
            {/* View mode toggle */}
            <div className="absolute left-4 top-4 z-20 flex gap-1 rounded-xl bg-black/50 p-1 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setViewMode('image')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  viewMode === 'image' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Ảnh
              </button>
              <button
                type="button"
                onClick={() => setViewMode('3d')}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  viewMode === '3d' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <RotateCw size={12} />
                360°
              </button>
            </div>

            <AnimatePresence mode="wait">
              {viewMode === 'image' ? (
                <motion.div
                  key="image"
                  className="aspect-square p-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <img
                    src={product.imageUrl || FALLBACK_IMAGE}
                    alt={product.name}
                    className="h-full w-full rounded-2xl object-cover"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="3d"
                  className="aspect-square"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center">
                        <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-500/20 border-t-purple-500" />
                      </div>
                    }
                  >
                    <Canvas camera={{ position: [0, 0, 6], fov: 40 }} gl={{ antialias: true, alpha: true }} style={{ background: 'transparent' }}>
                      <ambientLight intensity={0.4} />
                      <directionalLight position={[5, 5, 5]} intensity={1} color="#e9d5ff" />
                      <pointLight position={[-3, 2, 4]} intensity={2} color="#a855f7" distance={12} />
                      <ProductModel />
                      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={2} />
                    </Canvas>
                  </Suspense>
                  <p className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-black/50 px-3 py-1 text-[11px] text-slate-400 backdrop-blur-md">
                    Kéo để xoay 360° • Mô hình tương tác
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stock badges */}
            {isOutOfStock && (
              <div className="absolute right-4 top-4 z-20 rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-bold uppercase text-white backdrop-blur-sm">
                Hết hàng
              </div>
            )}
            {isLowStock && !isOutOfStock && (
              <div className="absolute right-4 top-4 z-20 rounded-lg bg-amber-500/90 px-3 py-1.5 text-xs font-bold uppercase text-white backdrop-blur-sm">
                Chỉ còn {product.stockQuantity}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* ─── Product Info ─── */}
        <ScrollReveal direction="right" delay={0.2}>
          <div className="flex flex-col justify-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-purple-400/50">{product.sku}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white lg:text-4xl">{product.name}</h1>

            {/* Rating */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className={i < 4 ? 'fill-amber-400 text-amber-400' : 'fill-slate-700 text-slate-700'} />
                ))}
              </div>
              <span className="text-xs text-slate-500">4.8 (128 đánh giá)</span>
            </div>

            {/* Price */}
            <div className="mt-5">
              <p className="text-3xl font-bold gradient-text-bright">{money.format(product.price)}</p>
            </div>

            {/* Stock status */}
            <div className="mt-3">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-400">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  Hết hàng
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" style={{ animation: 'pulseGlow 2s infinite' }} />
                  Còn hàng ({product.stockQuantity} sản phẩm)
                </span>
              )}
            </div>

            {/* Description */}
            <p className="mt-5 text-sm leading-7 text-slate-400">
              {product.description || 'Thiết bị Galaxy cao cấp với thiết kế hiện đại, hiệu năng đáng tin cậy và tích hợp hệ sinh thái liền mạch. Trải nghiệm công nghệ thế hệ mới.'}
            </p>

            {/* Quantity selector */}
            <div className="mt-6 flex items-center gap-3">
              <span className="text-sm font-medium text-slate-400">Số lượng:</span>
              <div className="flex items-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
                <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 text-slate-400 transition hover:text-white">
                  <Minus size={14} />
                </button>
                <span className="min-w-[40px] text-center text-sm font-semibold text-white">{quantity}</span>
                <button type="button" onClick={() => setQuantity(quantity + 1)} className="px-3 py-2 text-slate-400 transition hover:text-white">
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Add to cart */}
            <motion.button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`cta-pulse mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all ${
                isOutOfStock
                  ? 'cursor-not-allowed bg-white/5 text-slate-600'
                  : 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40'
              }`}
              whileTap={isOutOfStock ? {} : { scale: 0.96 }}
            >
              <ShoppingBag size={18} />
              {isOutOfStock ? 'Sản phẩm hết hàng' : `Thêm vào giỏ hàng • ${money.format(product.price * quantity)}`}
            </motion.button>

            {/* Features */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                { icon: Shield, label: 'Bảo hành 24 tháng' },
                { icon: Truck, label: 'Giao hàng miễn phí' },
                { icon: RotateCcw, label: 'Đổi trả 30 ngày' },
                { icon: Check, label: 'Hàng chính hãng 100%' },
              ].map((feat) => (
                <div key={feat.label} className="glass-light flex items-center gap-2.5 rounded-xl px-3 py-2.5">
                  <feat.icon size={15} className="shrink-0 text-purple-400" />
                  <span className="text-xs font-medium text-slate-400">{feat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
