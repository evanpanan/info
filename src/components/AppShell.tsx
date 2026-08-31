import {
  Megaphone,
  LayoutDashboard,
  History,
  Receipt,
  BookCheck,
  Radio,
  Users,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const navItems = [
  { label: '首页', Icon: Megaphone, href: '#' },
  { label: '业务日汇总看板', Icon: LayoutDashboard, href: '#' },
  { label: '历史评分记录', Icon: History, href: '#' },
  { label: '费用报销', Icon: Receipt, href: '#' },
  { label: '公司汇总报销', Icon: BookCheck, href: '#' },
  { label: '渠道管理', Icon: Radio, href: '#' },
  { label: '客户数据', Icon: Users, href: '#' },
];

const activeLabel = '首页';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen w-full" style={{ backgroundColor: '#F8FAFC' }}>
      <aside className="hidden lg:flex w-60 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen">
        <div className="h-16 px-6 flex items-center border-b border-slate-100">
          <span className="text-lg font-bold tracking-tight text-slate-800">MuskZoom</span>
        </div>

        <div className="px-4 pt-4 pb-3">
          <div className="p-3 rounded-2xl border border-slate-200">
            <div className="text-sm font-semibold text-slate-800">潘海祥</div>
            <div className="text-xs text-slate-400 mt-0.5">管理员 · 全部团队</div>
            <div className="mt-2 px-2 py-1 rounded-md bg-sky-50 text-[11px] font-medium text-sky-600 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              后端数据库已连接
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ label, Icon, href }) => {
            const active = label === activeLabel;
            return (
              <a
                key={label}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  active
                    ? 'bg-sky-50 text-sky-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon size={17} strokeWidth={1.75} />
                <span>{label}</span>
                {active && <ChevronRight size={14} strokeWidth={2} className="ml-auto" />}
              </a>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-slate-100 space-y-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-50 w-full transition">
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path
                fill="#000"
                d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
              />
            </svg>
            <span className="text-xs">XBelievers</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-50 w-full transition border border-slate-200">
            <LogOut size={15} strokeWidth={1.75} />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[82%] bg-white border-r border-slate-200 flex flex-col shadow-2xl">
            <div className="h-14 px-5 flex items-center justify-between border-b border-slate-100">
              <span className="text-lg font-bold tracking-tight text-slate-800">MuskZoom</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition"
                aria-label="关闭导航"
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>
            <div className="px-4 pt-4 pb-3">
              <div className="p-3 rounded-2xl border border-slate-200">
                <div className="text-sm font-semibold text-slate-800">潘海祥</div>
                <div className="text-xs text-slate-400 mt-0.5">管理员 · 全部团队</div>
                <div className="mt-2 px-2 py-1 rounded-md bg-sky-50 text-[11px] font-medium text-sky-600 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  后端数据库已连接
                </div>
              </div>
            </div>
            <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
              {navItems.map(({ label, Icon, href }) => {
                const active = label === activeLabel;
                return (
                  <a
                    key={label}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      active
                        ? 'bg-sky-50 text-sky-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <Icon size={17} strokeWidth={1.75} />
                    <span>{label}</span>
                    {active && <ChevronRight size={14} strokeWidth={2} className="ml-auto" />}
                  </a>
                );
              })}
            </nav>
            <div className="px-3 py-3 border-t border-slate-100 space-y-2">
              <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-50 w-full transition">
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path
                    fill="#000"
                    d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                  />
                </svg>
                <span className="text-xs">XBelievers</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-50 w-full transition border border-slate-200">
                <LogOut size={15} strokeWidth={1.75} />
                <span>退出登录</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 h-14 flex items-center justify-between">
          <span className="text-[15px] font-semibold tracking-tight text-slate-800">MuskZoom · 首页</span>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition"
            aria-label="打开导航"
          >
            <Menu size={18} strokeWidth={1.75} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
