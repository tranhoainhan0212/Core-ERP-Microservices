import React, { useState, useEffect } from 'react';
import Spline from '@splinetool/react-spline';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export default function SplineLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hasWebGL, setHasWebGL] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const support = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
      setHasWebGL(support);
    } catch (e) {
      setHasWebGL(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Giả lập xử lý đăng nhập thành công
    navigate('/shop');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Khối Spline 3D lấp đầy màn hình - Tương tác được hoặc Fallback cực đẹp */}
      <div className="absolute inset-0 z-0">
        {hasWebGL ? (
          <Spline 
            scene="https://prod.spline.design/wOss701A0-w5lkkt/scene.splinecode" 
            className="w-full h-full"
          />
        ) : (
          /* Premium Fallback Background */
          <div className="relative w-full h-full overflow-hidden bg-slate-950">
            {/* Animated glowing blobs */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] animate-[pulse_6s_infinite]"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] animate-[pulse_10s_infinite]"></div>
            
            {/* Ambient overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black via-slate-950 to-purple-950/20"></div>
            
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          </div>
        )}
      </div>

      {/* Overlay Form Đăng Nhập Đẹp Mắt */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-4 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] pointer-events-auto"
        >
          <div className="text-center mb-10">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 tracking-tight mb-2">
                Welcome Back
              </h1>
              <p className="text-white/60">Enter your credentials to continue</p>
            </motion.div>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-purple-400">
                  <Mail className="h-5 w-5 text-white/40 group-focus-within:text-purple-400 transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent focus:bg-white/10 transition-all duration-300"
                  placeholder="hello@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-medium text-white/80">Password</label>
                <a href="#" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">Forgot Password?</a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-purple-400">
                  <Lock className="h-5 w-5 text-white/40 group-focus-within:text-purple-400 transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent focus:bg-white/10 transition-all duration-300"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl text-white font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all duration-300 overflow-hidden mt-8"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <span className="relative flex items-center gap-2">
                Sign In <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-white/50 text-sm">
              Don't have an account?{' '}
              <a href="#" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">Sign up now</a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
