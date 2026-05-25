import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Kiểu dữ liệu map với ChatResponse từ Backend
interface ProductStatusDto {
  productName: string;
  sku: string;
  currentPrice: number;
  stockQuantity: number;
  stockStatus: string;
  description?: string;
  imageUrl?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  products?: ProductStatusDto[];
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const moneyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

  useEffect(() => {
    // Tự động cuộn xuống cuối khi có tin nhắn mới
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Welcome message khi mở lần đầu
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: 'Xin chào! Tôi là CoreERP AI Specialist. Tôi có thể tư vấn chi tiết về cấu hình, so sánh giá hoặc kiểm tra tồn kho các sản phẩm công nghệ cho bạn. Bạn đang quan tâm đến sản phẩm nào?'
        }
      ]);
    }
  }, [isOpen, messages.length]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message to UI
    const newUserMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: userMessage };
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      // Gọi API Gateway -> Chatbot.API
      const response = await fetch('http://localhost:5000/api/chatbot/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: userMessage,
          conversationId: conversationId
        })
      });

      if (!response.ok) {
        throw new Error('API Error');
      }

      const data = await response.json();
      
      // Lưu lại Context ID cho lượt chat sau
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.reply,
        products: data.referencedProducts
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'ai',
        text: 'Xin lỗi, tôi đang gặp sự cố kết nối tới hệ thống máy chủ. Vui lòng thử lại sau.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper render markdown-like text (đơn giản hóa in đậm)
  const formatText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-purple-300 font-semibold">{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <>
      {/* Nút mở Widget */}
      <motion.button
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all hover:scale-110 hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]"
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: isOpen ? 0 : 1, y: isOpen ? 50 : 0, pointerEvents: isOpen ? 'none' : 'auto' }}
      >
        <Sparkles size={24} />
      </motion.button>

      {/* Cửa sổ Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[380px] flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-[#050914]/90 shadow-2xl backdrop-blur-xl sm:h-[650px] sm:w-[420px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] bg-gradient-to-r from-purple-900/40 to-fuchsia-900/20 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 neon-border">
                  <Bot size={20} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">CoreERP AI Specialist</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" style={{ animation: 'pulseGlow 2s infinite' }}></span>
                    <p className="text-[10px] text-emerald-400">Online • Tích hợp ERP Data</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-white/[0.1] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-purple-600 text-white rounded-br-sm' 
                      : 'bg-white/[0.05] text-slate-200 rounded-bl-sm border border-white/[0.05]'
                  }`}>
                    {msg.sender === 'ai' && <Bot size={14} className="mb-1.5 text-purple-400 opacity-70" />}
                    <div className="whitespace-pre-wrap break-words">{formatText(msg.text)}</div>
                  </div>

                  {/* Render Product Cards if AI referenced any via Function Calling */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-2 w-full max-w-[85%] space-y-2">
                      {msg.products.map(product => (
                        <div key={product.sku} className="flex gap-3 rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 backdrop-blur-md">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-black/50">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.productName} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[10px] text-slate-500">No Img</div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-[11px] font-bold text-white line-clamp-1">{product.productName}</p>
                            <p className="mt-1 text-xs font-semibold text-purple-400">{moneyFormatter.format(product.currentPrice)}</p>
                            <div className="mt-1.5 flex items-center gap-2">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded ${product.stockQuantity > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                {product.stockQuantity > 0 ? `Tồn kho: ${product.stockQuantity}` : 'Hết hàng'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start">
                  <div className="rounded-2xl rounded-bl-sm border border-white/[0.05] bg-white/[0.05] px-4 py-3">
                    <Loader2 size={16} className="animate-spin text-purple-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-white/[0.08] bg-[#0a0f1e]/80 p-4">
              <div className="relative flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Hỏi AI về tính năng, so sánh, giá cả..."
                  className="max-h-32 min-h-12 w-full resize-none rounded-xl border border-white/[0.1] bg-white/[0.03] py-3 pl-4 pr-12 text-sm text-white placeholder-slate-500 outline-none transition focus:border-purple-500/50 focus:bg-white/[0.06] custom-scrollbar"
                  rows={1}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white transition hover:bg-purple-500 disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] text-slate-500">
                AI có thể mắc lỗi. Vui lòng kiểm tra lại thông tin quan trọng.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
