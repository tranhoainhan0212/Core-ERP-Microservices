import { Link } from 'react-router-dom';
import { Globe, MessageCircle, Briefcase, Mail, ArrowUpRight, Heart } from 'lucide-react';

const footerLinks = [
  {
    title: 'Sản phẩm',
    links: [
      { label: 'Smartphones', to: '/' },
      { label: 'Tablets', to: '/' },
      { label: 'Watches', to: '/' },
      { label: 'Accessories', to: '/' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { label: 'Trung tâm hỗ trợ', to: '/' },
      { label: 'Chính sách bảo hành', to: '/' },
      { label: 'Hướng dẫn mua hàng', to: '/' },
      { label: 'FAQ', to: '/' },
    ],
  },
  {
    title: 'Công ty',
    links: [
      { label: 'Giới thiệu', to: '/' },
      { label: 'Liên hệ', to: '/' },
      { label: 'Tuyển dụng', to: '/' },
      { label: 'Blog', to: '/' },
    ],
  },
];

const socialLinks = [
  { icon: Globe, href: '#', label: 'Website' },
  { icon: MessageCircle, href: '#', label: 'Chat' },
  { icon: Briefcase, href: '#', label: 'Career' },
  { icon: Mail, href: '#', label: 'Email' },
];

export default function Footer() {
  return (
    <footer className="relative mt-0 border-t border-white/[0.06] bg-[#030712]">
      {/* Top gradient line */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        <div className="mb-16 flex flex-col items-center gap-6 rounded-3xl border border-white/[0.06] bg-gradient-to-br from-purple-950/50 via-[#0c1222] to-violet-950/30 px-8 py-12 text-center backdrop-blur-sm">
          <h3 className="text-2xl font-bold text-white">
            Nhận thông tin <span className="gradient-text">ưu đãi mới nhất</span>
          </h3>
          <p className="max-w-md text-sm text-slate-400">
            Đăng ký nhận bản tin để không bỏ lỡ các sản phẩm công nghệ mới và ưu đãi độc quyền.
          </p>
          <div className="flex w-full max-w-md gap-2">
            <input
              type="email"
              placeholder="Nhập email của bạn..."
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
            />
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:shadow-purple-500/30"
            >
              Đăng ký
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* Links grid */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link to="/" className="group flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 text-xs font-black text-white">
                C
              </div>
              <span className="text-lg font-bold text-white">
                Core<span className="gradient-text">ERP</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Nền tảng thương mại điện tử công nghệ cao, được xây dựng với kiến trúc Microservices hiện đại.
            </p>
            {/* Social */}
            <div className="mt-6 flex gap-2">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    title={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-slate-500 transition-all hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-400"
                  >
                    <Icon size={15} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                {group.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-slate-500 transition-colors hover:text-purple-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/[0.04] pt-8 md:flex-row">
          <p className="flex items-center gap-1 text-xs text-slate-600">
            © 2026 CoreERP Galaxy. Made with <Heart size={12} className="text-red-500" /> by Tran Hoai Nhan
          </p>
          <div className="flex gap-6 text-xs text-slate-600">
            <span className="cursor-pointer transition hover:text-slate-400">Điều khoản</span>
            <span className="cursor-pointer transition hover:text-slate-400">Bảo mật</span>
            <span className="cursor-pointer transition hover:text-slate-400">Cookies</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
