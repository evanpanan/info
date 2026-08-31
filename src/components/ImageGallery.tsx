import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, Heart, MessageCircle, Repeat2, Bookmark, BadgeCheck } from 'lucide-react';
import type { PostComment, TimelinePost } from '../types/irpr';
import Linkify, { extractAndStripUrls } from './Linkify';

export default function ImageGallery({
  images,
  context,
}: {
  images: string[];
  context?: {
    post: TimelinePost;
    comments?: PostComment[];
  };
}) {
  const count = images.length;
  const [lightbox, setLightbox] = useState<number | null>(null);
  const strippedContent = useMemo(() => {
    if (!context?.post.content) return '';
    return extractAndStripUrls(context.post.content, null).strippedContent;
  }, [context]);

  useEffect(() => {
    if (lightbox == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      else if (e.key === 'ArrowRight') setLightbox((i) => (i == null ? 0 : (i + 1) % count));
      else if (e.key === 'ArrowLeft') setLightbox((i) => (i == null ? 0 : (i - 1 + count) % count));
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightbox, count]);

  const open = (idx: number) => setLightbox(idx);

  const showCount = count > 9 ? 9 : count;
  const isTwoCol = count === 2 || count === 4;
  const gridClass = isTwoCol
    ? 'inline-grid grid-cols-2 max-w-[228px] sm:max-w-[260px] md:max-w-[292px]'
    : 'inline-grid grid-cols-3 max-w-[300px] sm:max-w-[342px] md:max-w-[384px]';

  if (count === 1) {
    return (
      <>
        <div className="mt-2 group">
          <button
            type="button"
            onClick={() => open(0)}
            className="relative inline-block text-left rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-w-[300px] sm:max-w-[340px] align-top"
            aria-label="查看大图"
          >
            <img
              src={images[0]}
              alt=""
              className="w-auto max-h-60 sm:max-h-64 max-w-full object-contain bg-slate-100 hover:scale-[1.02] transition-transform duration-500"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-slate-900/55 text-white backdrop-blur-sm inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <ZoomIn size={13} strokeWidth={1.75} />
            </span>
          </button>
        </div>
        {lightbox != null && (
          <Lightbox
            images={images}
            index={lightbox}
            context={context ? { post: context.post, strippedContent, comments: context.comments } : undefined}
            onClose={() => setLightbox(null)}
            onPrev={() => setLightbox((i) => (i == null ? 0 : (i - 1 + count) % count))}
            onNext={() => setLightbox((i) => (i == null ? 0 : (i + 1) % count))}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        className={`mt-2 grid ${gridClass} gap-[2px] sm:gap-1 rounded-2xl overflow-hidden border border-slate-200 group/gal bg-slate-100/70 align-top`}
      >
        {images.slice(0, showCount).map((src, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => open(idx)}
            className="relative w-full aspect-square bg-slate-200 overflow-hidden text-left"
            aria-label={`查看第 ${idx + 1} 张图片`}
          >
            <img
              src={src}
              alt=""
              className="w-full h-full object-cover hover:scale-[1.04] transition-transform duration-500"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.opacity = '0.1';
              }}
            />
            {idx === showCount - 1 && count > showCount ? (
              <>
                <div className="absolute inset-0 bg-slate-900/55 backdrop-blur-[1px] flex items-center justify-center">
                  <span className="text-white text-lg sm:text-xl font-semibold tabular-nums tracking-tight">
                    +{count - showCount}
                  </span>
                </div>
                <span className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-slate-900/70 text-white backdrop-blur-sm inline-flex items-center justify-center">
                  <ZoomIn size={13} strokeWidth={1.75} />
                </span>
              </>
            ) : (
              <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-slate-900/40 text-white backdrop-blur-sm inline-flex items-center justify-center opacity-0 group-hover/gal:opacity-100 transition">
                <ZoomIn size={12} strokeWidth={1.75} />
              </span>
            )}
          </button>
        ))}
      </div>
      {lightbox != null && (
        <Lightbox
          images={images}
          index={lightbox}
          context={context ? { post: context.post, strippedContent, comments: context.comments } : undefined}
          onClose={() => setLightbox(null)}
          onPrev={() => setLightbox((i) => (i == null ? 0 : (i - 1 + count) % count))}
          onNext={() => setLightbox((i) => (i == null ? 0 : (i + 1) % count))}
        />
      )}
    </>
  );
}

function Lightbox({
  images,
  index,
  context,
  onClose,
  onPrev,
  onNext,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  context?: {
    post: TimelinePost;
    strippedContent: string;
    comments?: PostComment[];
  };
}) {
  const total = images.length;
  const hasContext = !!context;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-stretch sm:items-center justify-center sm:p-4 sm:py-8"
      onClick={(e) => {
        const t = e.target as HTMLElement;
        if (t.dataset?.role === 'lightbox-backdrop' || t.closest?.('[data-role="lightbox-backdrop"]')) {
          onClose();
        }
      }}
    >
      <div data-role="lightbox-backdrop" className="absolute inset-0" />
      <button
        type="button"
        onClick={onClose}
        aria-label="关闭预览"
        className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-5 md:right-5 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/95 hover:bg-white text-slate-900 ring-2 ring-white/60 shadow-xl shadow-black/50 flex items-center justify-center transition"
      >
        <X size={22} strokeWidth={2.4} />
      </button>
      <div className="relative z-10 w-full h-full md:h-[min(98vh,1200px)] md:max-w-[1800px] md:rounded-3xl md:overflow-hidden flex flex-col md:flex-row bg-slate-950 text-white">
        <div className="relative flex-1 min-h-0 flex items-center justify-center bg-black overflow-hidden px-0 sm:px-0 md:px-2 py-0 sm:py-0 md:py-2">
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={onPrev}
                aria-label="上一张"
                className="absolute left-1.5 sm:left-2 md:left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 ring-1 ring-white/25 text-white backdrop-blur-md flex items-center justify-center transition shadow-xl shadow-black/40"
              >
                <ChevronLeft size={26} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={onNext}
                aria-label="下一张"
                className="absolute right-1.5 sm:right-2 md:right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 ring-1 ring-white/25 text-white backdrop-blur-md flex items-center justify-center transition shadow-xl shadow-black/40"
              >
                <ChevronRight size={26} strokeWidth={2.5} />
              </button>
            </>
          )}
          <div className="relative inline-block max-w-full max-h-full w-full h-full flex items-center justify-center shrink-0 px-14 sm:px-16 md:px-20 py-2 sm:py-3 md:py-4">
            <img
              key={images[index]}
              src={images[index]}
              alt=""
              className="max-w-full max-h-[75vh] md:max-h-[96vh] w-auto h-auto object-contain select-none rounded-md md:rounded-lg ring-1 ring-white/10"
              draggable={false}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.opacity = '0.3';
              }}
            />
            {total > 1 && (
              <div className="absolute -bottom-0 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-black/55 backdrop-blur-sm text-white text-[12.5px] tabular-nums">
                <span>
                  {index + 1} / {total}
                </span>
              </div>
            )}
          </div>
        </div>
        {hasContext && context && (
          <aside className="w-full md:w-[420px] lg:w-[440px] shrink-0 h-[45vh] md:h-full flex flex-col bg-white text-slate-900 border-0 md:border-l border-white/10">
            <header className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-slate-200/80">
              <div className="flex items-start gap-2.5">
                <img
                  src={context.post.author.avatar}
                  alt={context.post.author.name}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44"><circle cx="22" cy="22" r="22" fill="%23e2e8f0"/><path d="M22 19a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm-11 16c1.5-5 6-8 11-8s9.5 3 11 8" fill="%2394a3b8"/></svg>';
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="font-semibold text-[14px] sm:text-[14.5px] truncate">
                      {context.post.author.name}
                    </span>
                    {context.post.author.official && (
                      <BadgeCheck size={15} className="text-sky-500 shrink-0" strokeWidth={2} />
                    )}
                  </div>
                  <div className="text-[12px] text-slate-500 truncate">
                    {context.post.author.role} · {context.post.publishedAt}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-[14.5px] leading-[1.6] text-slate-800 whitespace-pre-wrap break-words">
                {context.strippedContent ? (
                  <Linkify text={context.strippedContent} />
                ) : (
                  <span className="text-slate-400">（无正文内容）</span>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between text-slate-500 text-[12.5px] select-none">
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle size={14} strokeWidth={1.75} />
                  {context.post.metrics?.comments ?? context.comments?.length ?? 0}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Repeat2 size={14} strokeWidth={1.75} />
                  {context.post.metrics?.reposts ?? 0}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Heart size={14} strokeWidth={1.75} />
                  {context.post.metrics?.likes ?? 0}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Bookmark size={14} strokeWidth={1.75} />
                  收藏
                </span>
              </div>
            </header>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {(!context.comments || context.comments.length === 0) ? (
                <div className="px-4 sm:px-5 py-8 sm:py-10 text-center text-slate-400 text-[13px]">
                  暂无评论
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {context.comments.map((c) => (
                    <li key={c.id} className="px-4 sm:px-5 py-3 sm:py-3.5">
                      <div className="flex items-start gap-2.5">
                        <img
                          src={c.author.avatar}
                          alt={c.author.name}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44"><circle cx="22" cy="22" r="22" fill="%23e2e8f0"/><path d="M22 19a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm-11 16c1.5-5 6-8 11-8s9.5 3 11 8" fill="%2394a3b8"/></svg>';
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="font-semibold text-[13px] truncate">{c.author.name}</span>
                            {c.author.official && (
                              <BadgeCheck size={12.5} className="text-sky-500 shrink-0" strokeWidth={2} />
                            )}
                            <span className="text-[11.5px] text-slate-400 ml-auto shrink-0">
                              {c.publishedAt}
                            </span>
                          </div>
                          <div className="mt-1 text-[13.5px] leading-[1.55] text-slate-800 whitespace-pre-wrap break-words">
                            {c.content}
                          </div>
                          {c.officialReply && (
                            <div className="mt-2 rounded-2xl rounded-tl-sm border border-sky-100 bg-sky-50/80 px-3 py-2">
                              <div className="flex items-center gap-1 mb-0.5">
                                <BadgeCheck size={12} className="text-sky-600" strokeWidth={2} />
                                <span className="text-[11.5px] font-semibold text-sky-700">官方回复</span>
                              </div>
                              <div className="text-[12.5px] leading-[1.55] text-slate-800 whitespace-pre-wrap break-words">
                                {typeof c.officialReply === 'string'
                                  ? c.officialReply
                                  : c.officialReply.content}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
