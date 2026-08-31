import type { LucideIcon } from 'lucide-react';
import {
  Twitter,
  MessageCircle,
  Globe,
  BarChart2,
  TrendingUp,
  MessageSquare,
  Hexagon,
  Sparkles,
} from 'lucide-react';
import type { OfficialChannel } from '../types/irpr';

const iconMap: Record<OfficialChannel['icon'], LucideIcon> = {
  twitter: Twitter,
  reddit: MessageCircle,
  futu: BarChart2,
  moomoo: TrendingUp,
  ibkr: Globe,
  wechat: MessageSquare,
  weibo: Sparkles,
  custom: Hexagon,
};

const colorMap: Record<OfficialChannel['icon'], string> = {
  twitter: 'bg-slate-900 text-white',
  reddit: 'bg-orange-500 text-white',
  futu: 'bg-green-600 text-white',
  moomoo: 'bg-sky-500 text-white',
  ibkr: 'bg-indigo-600 text-white',
  wechat: 'bg-emerald-500 text-white',
  weibo: 'bg-rose-500 text-white',
  custom: 'bg-slate-500 text-white',
};

const statusDotMap: Record<OfficialChannel['status'], string> = {
  active: 'bg-emerald-500',
  pending: 'bg-amber-400',
  inactive: 'bg-slate-300',
};

interface Props {
  channel: OfficialChannel;
}

export default function ChannelRow({ channel }: Props) {
  const Icon = iconMap[channel.icon];
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 border-b border-slate-100 last:border-b-0">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorMap[channel.icon]} flex-shrink-0`}
      >
        <Icon size={16} strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-slate-800 truncate">{channel.name}</span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${statusDotMap[channel.status]} flex-shrink-0`}
            title={channel.status}
          />
        </div>
        <div className="text-xs text-slate-400 mt-0.5">{channel.followers} 关注</div>
      </div>
      <a
        href={channel.url}
        target="_blank"
        rel="noreferrer noopener"
        className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 transition"
      >
        访问
      </a>
    </div>
  );
}
