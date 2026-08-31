import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { OfficialChannel, NewChannelInput } from '../types/irpr';
import ChannelRow from './ChannelRow';

interface Props {
  channels: OfficialChannel[];
  onAddChannel?: (input: NewChannelInput) => void;
}

export default function OfficialMatrixCard({ channels, onAddChannel }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewChannelInput>({ name: '', icon: 'twitter', url: '' });

  const handleSubmit = () => {
    if (!form.name.trim() || !form.url.trim()) return;
    onAddChannel?.(form);
    setForm({ name: '', icon: 'twitter', url: '' });
    setOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">官方媒体与券商阵地</h3>
          <p className="text-xs text-slate-400 mt-0.5">统一管理投资者关系官方渠道</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition"
        >
          <Plus size={13} strokeWidth={2} />
          添加新渠道
        </button>
      </div>

      <div className="-mx-2">
        {channels.map((ch) => (
        <div key={ch.id} className="px-2">
          <ChannelRow channel={ch} />
        </div>
      ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-base font-semibold text-slate-800">添加新渠道</h4>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">渠道名称</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例如：LinkedIn Official"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">图标类型</label>
                <select
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition bg-white"
                >
                  <option value="twitter">Twitter / X</option>
                  <option value="reddit">Reddit</option>
                  <option value="futu">富途</option>
                  <option value="moomoo">老虎 / Moomoo</option>
                  <option value="ibkr">Interactive Brokers</option>
                  <option value="wechat">微信公众号</option>
                  <option value="weibo">微博</option>
                  <option value="custom">自定义</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">跳转链接</label>
                <input
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.name.trim() || !form.url.trim()}
                className="px-5 py-2 rounded-xl text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
