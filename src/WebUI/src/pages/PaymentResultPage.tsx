import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight, ShoppingBag, ClipboardList } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast, clearCart } = useAppContext();

  const responseCode = searchParams.get('vnp_ResponseCode');
  const orderId = searchParams.get('orderId');

  const isSuccess = responseCode === '00';

  useEffect(() => {
    if (isSuccess) {
      addToast('Thanh toán đơn hàng thành công!', 'success');
      void clearCart();
    } else {
      addToast('Giao dịch thanh toán không thành công.', 'error');
    }
  }, [isSuccess, addToast, clearCart]);

  return (
    <div className="relative min-h-[80vh] w-full flex items-center justify-center p-4 overflow-hidden bg-[#030712]">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      
      {/* Main glassmorphism card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2rem] p-8 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.4)] text-center"
      >
        {/* Animated Icon Header */}
        <div className="flex justify-center mb-6">
          {isSuccess ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{ type: "spring", stiffness: 100, damping: 10, delay: 0.1 }}
              className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20"
            >
              <CheckCircle2 className="w-16 h-16 text-emerald-400" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 10, delay: 0.1 }}
              className="p-3 bg-rose-500/10 rounded-full border border-rose-500/20"
            >
              <XCircle className="w-16 h-16 text-rose-400" />
            </motion.div>
          )}
        </div>

        {/* Dynamic Title */}
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 tracking-tight mb-3">
          {isSuccess ? 'Thanh toán thành công' : 'Thanh toán thất bại'}
        </h2>
        
        {/* Description */}
        <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-sm mx-auto mb-8">
          {isSuccess 
            ? 'Cảm ơn bạn đã tin tưởng mua sắm! Giao dịch của bạn đã được VNPAY xác thực thành công. Chúng tôi đang chuẩn bị đơn hàng.'
            : 'Đã xảy ra lỗi trong quá trình xử lý giao dịch hoặc bạn đã hủy thanh toán. Đừng lo lắng, các sản phẩm vẫn được giữ nguyên trong giỏ hàng.'
          }
        </p>

        {/* Info Grid */}
        <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-5 mb-8 text-left space-y-3">
          {orderId && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Mã đơn hàng:</span>
              <span className="font-semibold text-slate-200">#{orderId}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Phương thức thanh toán:</span>
            <span className="font-semibold text-purple-400">VNPAY Cổng thanh toán</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Trạng thái giao dịch:</span>
            <span className={`font-semibold ${isSuccess ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isSuccess ? 'Giao dịch thành công' : 'Giao dịch bị từ chối/hủy'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isSuccess ? (
            <>
              <button
                onClick={() => navigate('/cart')}
                className="flex items-center justify-center gap-2 py-3.5 px-6 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all duration-300 border border-slate-700"
              >
                <ShoppingBag className="w-5 h-5" />
                Về giỏ hàng
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all duration-300"
              >
                <ClipboardList className="w-5 h-5" />
                Xem Đơn hàng
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center gap-2 py-3.5 px-6 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all duration-300 border border-slate-700 w-full sm:w-auto"
              >
                Trang chủ
              </button>
              <button
                onClick={() => navigate('/cart')}
                className="flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all duration-300 w-full sm:w-auto"
              >
                Quay lại Giỏ hàng
                <ArrowRight className="w-4 h-4 animate-pulse" />
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
