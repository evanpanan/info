import { useEffect, useState } from 'react';
import type { TimelinePost } from '../types/irpr';
import { X, Info, Eye, MessageCircle, Heart, Repeat2, Megaphone, ArrowRight } from 'lucide-react';

const READ_KEY = 'irpr_pushed_notice_read_ids';

function loadReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveReadId(postId: string): void {
  const set = loadReadIds();
  set.add(postId);
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* ignore */
  }
}

export function findNextUnreadPushedNotice(
  posts: TimelinePost[],
  overrideReadSet?: Set<string>,
): TimelinePost | null {
  const readSet = overrideReadSet ?? loadReadIds();
  const pushed = posts
    .filter((p) => p.pushedNotice?.pushedAt)
    .sort((a, b) => new Date(b.pushedNotice!.pushedAt).getTime() - new Date(a.pushedNotice!.pushedAt).getTime());
  return pushed.find((p) => !readSet.has(p.id)) ?? null;
}

export function getPushedNoticeCount(posts: TimelinePost[]): number {
  return posts.filter((p) => p.pushedNotice?.pushedAt).length;
}

export function formatRelativeDays(dateStr: string): string {
  const t = new Date(dateStr).getTime();
  if (!isFinite(t)) return dateStr;
  const now = Date.now();
  const diffDays = Math.floor((now - t) / 86400000);
  if (diffDays <= 0) return '今天';
  if (diffDays === 1) return '1 天前';
  if (diffDays < 30) return `${diffDays} 天前`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} 个月前`;
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} 年前`;
}

export function formatPushedFull(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const Y = d.getFullYear();
    const M = `${d.getMonth() + 1}`.padStart(2, '0');
    const D = `${d.getDate()}`.padStart(2, '0');
    const h = `${d.getHours()}`.padStart(2, '0');
    const m = `${d.getMinutes()}`.padStart(2, '0');
    return `${Y}/${M}/${D} ${h}:${m}`;
  } catch {
    return dateStr;
  }
}

interface Props {
  post: TimelinePost;
  onClose: () => void;
  onMarkReadAndClose: () => void;
  onViewPost?: (post: TimelinePost) => void;
}

export function PushNoticeModal({ post, onClose, onMarkReadAndClose, onViewPost }: Props) {
  const [isRead, setIsRead] = useState(false);
  const level = post.pushedNotice?.level ?? 'info';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    saveReadId(post.id);
    onMarkReadAndClose();
    onClose();
  };

  const contentTeaser = post.content.replace(/\n+/g, ' ').slice(0, 120);
  const relative = post.pushedNotice?.pushedAt ? formatRelativeDays(post.pushedNotice.pushedAt) : '';
  const full = post.pushedNotice?.pushedAt ? formatPushedFull(post.pushedNotice.pushedAt) : '';

  const headerBg =
    level === 'urgent'
      ? 'bg-gradient-to-br from-rose-50 via-red-50 to-orange-50'
      : 'bg-gradient-to-br from-sky-50 via-indigo-50 to-violet-50';
  const iconBg =
    level === 'urgent'
      ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-200/60'
      : 'bg-gradient-to-br from-sky-500 to-indigo-600 shadow-indigo-200/60';
  const accentLink = level === 'urgent' ? 'text-rose-600' : 'text-indigo-600';

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4 sm:px-6">
      <div
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-[720px] rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-900/25 overflow-hidden">
        {/* Header */}
        <div className={`px-6 sm:px-7 py-5 sm:py-6 ${headerBg}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              <div
                className={`w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-2xl text-white flex items-center justify-center flex-shrink-0 shadow-lg`}
                style={{ background: level === 'urgent' ? undefined : undefined }}
              >
                <div className={`w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-2xl ${iconBg} flex items-center justify-center`}>
                  <Info size={22} strokeWidth={2.1} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
                      level === 'urgent'
                        ? 'bg-rose-50 text-rose-700 border-rose-100'
                        : 'bg-sky-50 text-sky-700 border-sky-100'
                    }`}
                  >
                    <Megaphone size={9} strokeWidth={2.4} />
                    {level === 'urgent' ? '紧急公告' : '公告'}
                  </span>
                </div>
                <h2 className="text-[20px] sm:text-[22px] font-black tracking-tight text-slate-900 leading-tight mb-2">
                  {post.tags?.[0] === '#置顶公告' ? '【官方公告】投资者关系入口与官方渠道导航' : '重要动态推送'}
                </h2>
                <div className="flex items-center gap-3 text-[12.5px] text-slate-500 flex-wrap">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="opacity-60">⏱</span>
                    {relative} · {full}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 ${
                      isRead ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    <Eye size={12} strokeWidth={2} />
                    {isRead ? '已读' : '未读'}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-10 h-10 rounded-2xl inline-flex items-center justify-center text-slate-500 bg-white/70 backdrop-blur hover:bg-white hover:text-slate-700 border border-slate-200/70 shadow-sm transition-colors flex-shrink-0"
              aria-label="关闭公告"
            >
              <X size={17} strokeWidth={2.1} />
            </button>
          </div>
        </div>

        {/* Divider line under header */}
        <div className="border-t border-slate-100" />

        {/* Body */}
        <div className="px-6 sm:px-7 py-5 sm:py-6 max-h-[50vh] overflow-y-auto">
          <div
            className="relative pl-4 sm:pl-5 py-4 text-[14px] sm:text-[14.5px] leading-7 sm:leading-[1.85] text-slate-700 bg-slate-50/60 rounded-2xl border-l-[3px] border-indigo-500/70"
          >
            <div className="whitespace-pre-wrap break-words">{post.content}</div>
            {post.webpage && (
              <a
                href={post.webpage.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold ${accentLink} hover:underline`}
              >
                {post.webpage.domain}
                <span className="opacity-70">·</span>
                <span className="text-slate-600">{post.webpage.title}</span>
                <span aria-hidden="true">↗</span>
              </a>
            )}
            {contentTeaser.length < post.content.length && post.content.length > 180 && null}
          </div>

          {/* Meta metrics row */}
          <div className="mt-4 flex items-center gap-3 sm:gap-4 text-[12px] text-slate-500 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Heart size={12.5} strokeWidth={1.9} className="text-rose-400" />
              {post.metrics?.likes ?? 0}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle size={12.5} strokeWidth={1.9} className="text-sky-400" />
              {post.metrics?.comments ?? 0}
            </span>
            <span className="inline-flex items-center gap-1">
              <Repeat2 size={12.5} strokeWidth={1.9} className="text-emerald-400" />
              {post.metrics?.reposts ?? 0}
            </span>
            <span className="ml-auto inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200/70">
              <Eye size={11} strokeWidth={1.9} />
              点击下方「关闭」将标记为已读，不再重复弹出
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-7 py-4 sm:py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-[12.5px] text-slate-500 inline-flex items-center gap-1.5">
            <Info size={13} strokeWidth={2} className="text-slate-400" />
            您已阅读此公告
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3">
            {onViewPost && (
              <button
                type="button"
                onClick={() => {
                  setIsRead(true);
                  saveReadId(post.id);
                  onMarkReadAndClose();
                  onViewPost(post);
                  setTimeout(onClose, 60);
                }}
                className="inline-flex items-center justify-center gap-1.5 px-5 sm:px-6 py-2.5 rounded-2xl text-[13.5px] font-bold text-white bg-gradient-to-br from-indigo-500 via-sky-500 to-indigo-600 border border-white/30 shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/50 hover:brightness-105 active:scale-[0.99] transition-all"
              >
                查看动态
                <ArrowRight size={15} strokeWidth={2.1} />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsRead(true);
                setTimeout(handleClose, 180);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-2xl text-[13.5px] font-bold text-slate-700 bg-white border-2 border-slate-200 hover:border-indigo-500/60 hover:text-indigo-700 hover:shadow-lg hover:shadow-indigo-200/40 active:scale-[0.99] transition-all"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PushNoticeModal;
