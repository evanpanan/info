import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MessageCircle,
  Heart,
  Repeat2,
  Bookmark,
  Share2,
  Copy,
  FileText,
  ExternalLink,
  MoreHorizontal,
  Pin,
  PinOff,
  BadgeCheck,
  Image as ImageIcon,
  Paperclip,
  Sparkles,
  X,
  Send,
  CornerUpRight,
  Trash2,
  PencilLine,
  Play,
  Clapperboard,
  MapPin,
  CalendarDays,
  Download,
  Megaphone,
} from 'lucide-react';
import type { FileAttachment, PostComment, PostInteractionAction, TimelinePost } from '../types/irpr';
import WebpagePreviewCard from './WebpagePreviewCard';
import FileAttachmentList from './FileAttachmentList';
import ImageGallery from './ImageGallery';
import Linkify, { extractAndStripUrls } from './Linkify';
import CashtagStockCard from './CashtagStockCard';
import EmojiPicker from './EmojiPicker';

const CASHTAG_EXTRACT = /\$([A-Za-z]{1,8}(?:\.[A-Za-z]{1,4})?)/g;

interface CommentImageAttach {
  id: string;
  name: string;
  sizeBytes?: number;
  type?: string;
  objectUrl: string;
}

interface CommentFileAttach {
  id: string;
  name: string;
  sizeBytes: number;
  type: FileAttachment['type'];
  objectUrl: string;
}

function formatCommentBytes(bytes?: number): string {
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function inferCommentFileType(name: string): FileAttachment['type'] {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (/\.(xls|xlsx|csv)$/.test(lower)) return 'xlsx';
  if (/\.(ppt|pptx|key)$/.test(lower)) return 'ppt';
  if (/\.(doc|docx|rtf|md|txt)$/.test(lower)) return 'doc';
  return 'pdf';
}

function parseCommentYoutubeId(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = url.pathname.replace(/^\//, '').split('/')[0];
      return id?.length === 11 ? id : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      const v = url.searchParams.get('v');
      if (v && v.length === 11) return v;
      const embed = url.pathname.match(/\/embed\/([A-Za-z0-9_-]{11})/);
      if (embed) return embed[1];
      const short = url.pathname.match(/\/shorts\/([A-Za-z0-9_-]{11})/);
      if (short) return short[1];
    }
  } catch {
    /* ignore */
  }
  return null;
}

function CommentVideoEmbedCard({
  embed,
  onRemove,
}: {
  embed: NonNullable<TimelinePost['videoEmbed']>;
  onRemove?: () => void;
}) {
  return (
    <div className="mt-2 rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 text-[11px] text-slate-700 min-w-0">
          <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <Play size={11} strokeWidth={1.75} />
          </span>
          <span className="truncate">
            {embed.provider === 'youtube' ? `YouTube · ${embed.videoId ?? embed.url}` : embed.url}
          </span>
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition shrink-0"
            title="移除视频"
          >
            <X size={12} strokeWidth={2} />
          </button>
        )}
      </div>
      <div className="relative w-full aspect-video bg-black flex items-center justify-center text-white text-[10.5px]">
        {embed.provider === 'youtube' && embed.videoId ? (
          <iframe
            title="评论视频预览"
            src={`https://www.youtube.com/embed/${embed.videoId}`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <a
            href={embed.url}
            target="_blank"
            rel="noreferrer noopener"
            className="underline text-xs"
          >
            点击打开视频：{embed.url}
          </a>
        )}
      </div>
    </div>
  );
}

interface PostCardProps {
  post: TimelinePost;
  liked: boolean;
  bookmarked: boolean;
  reposted: boolean;
  isAdmin?: boolean;
  isIRPRAdmin: boolean;
  currentUserId: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  comments?: PostComment[];
  onAction: (action: PostInteractionAction) => void;
  isQuote?: boolean;
  onSearchKeyword?: (keyword: string) => void;
  onCopyText?: (text: string, label?: string) => void;
}

const WHATSAPP_BIZ = 'https://api.whatsapp.com/send?text=';

function buildWechatUrl(raw: string): string {
  try {
    const key = encodeURIComponent(raw);
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${key}`;
  } catch {
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(raw)}`;
  }
}

function getPrimaryShareTarget(post: TimelinePost): { label: string; url: string } {
  if (post.type === 'webpage' || post.type === 'news') {
    const w = post.type === 'webpage' ? post.webpage : post.news?.webpage;
    if (w?.url) return { label: `网页 ${w.domain ?? ''}`.trim(), url: w.url };
  }
  if (post.images && post.images.length > 0) return { label: '配图', url: post.images[0] };
  if (post.files && post.files.length > 0) return { label: post.files[0].name, url: post.files[0].url };
  return { label: '动态内容', url: typeof window !== 'undefined' ? window.location.href : '' };
}

function buildPostPlainText(post: TimelinePost): string {
  const { strippedContent } = extractAndStripUrls(post.content, null);
  const lines: string[] = [];
  if (strippedContent) lines.push(strippedContent);
  if (post.type === 'webpage' && post.webpage) lines.push(`${post.webpage.title}\n${post.webpage.url}`);
  if (post.type === 'news' && post.news?.webpage) lines.push(`${post.news.webpage.title}\n${post.news.webpage.url}`);
  if (post.images && post.images.length > 0) lines.push(...post.images);
  if (post.files && post.files.length > 0) post.files.forEach((f) => lines.push(`${f.name} ${f.url}`));
  return lines.join('\n').trim();
}

function CollapsibleText({
  text,
  onSearchKeyword,
}: {
  text: string;
  onSearchKeyword?: (kw: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const charLimit = 300;
  const lineLimit = 5;
  const lineCount = useMemo(() => text.split(/\n/).length, [text]);
  const shouldCollapse = text.length > charLimit || lineCount > lineLimit;
  const display = shouldCollapse && !expanded
    ? (() => {
        let snippet = text.slice(0, charLimit);
        const nl = snippet.split(/\n/);
        if (nl.length > lineLimit) {
          snippet = nl.slice(0, lineLimit).join('\n');
        }
        return snippet.trimEnd() + '…';
      })()
    : text;
  return (
    <div className="min-w-0">
      <div className="text-[14.5px] sm:text-[15px] leading-[1.65] text-slate-800 break-words whitespace-pre-wrap">
        <Linkify
          text={display}
          onClickCashtag={onSearchKeyword}
          onClickHashtag={onSearchKeyword}
        />
      </div>
      {shouldCollapse && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-medium text-sky-600 hover:text-sky-700 transition"
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
      )}
    </div>
  );
}

function PostBody({
  post,
  comments,
  onSearchKeyword,
}: {
  post: TimelinePost;
  comments: PostComment[];
  onSearchKeyword?: (kw: string) => void;
}) {
  const { strippedContent, derivedWebpage } = useMemo(
    () => extractAndStripUrls(post.content, post.news?.webpage ?? post.webpage ?? null),
    [post.content, post.news, post.webpage]
  );
  const newsWebpage = post.news?.webpage ?? null;
  const finalWebpage = newsWebpage ?? derivedWebpage;
  return (
    <div className="space-y-3 min-w-0">
      {strippedContent && <CollapsibleText text={strippedContent} onSearchKeyword={onSearchKeyword} />}
      {post.videoEmbed && post.videoEmbed.provider === 'youtube' && post.videoEmbed.videoId && (
        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-white text-xs text-slate-700">
            <span className="w-7 h-7 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Play size={13} strokeWidth={1.75} />
            </span>
            <span className="truncate">YouTube · {post.videoEmbed.title ?? post.videoEmbed.videoId}</span>
          </div>
          <div className="relative w-full aspect-video bg-black">
            <iframe
              title={`YouTube ${post.videoEmbed.videoId}`}
              src={`https://www.youtube.com/embed/${post.videoEmbed.videoId}?rel=0`}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      )}
      {post.videoEmbed && (!post.videoEmbed.provider || post.videoEmbed.provider === 'generic') && (
        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-white text-xs text-slate-700">
            <span className="w-7 h-7 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Play size={13} strokeWidth={1.75} />
            </span>
            <a href={post.videoEmbed.url} target="_blank" rel="noreferrer noopener" className="truncate text-sky-600 hover:text-sky-700 underline">
              {post.videoEmbed.title ?? post.videoEmbed.url}
            </a>
          </div>
        </div>
      )}
      {post.location && (
        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-white text-xs text-slate-700">
            <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <MapPin size={13} strokeWidth={1.75} />
            </span>
            <span className="truncate">
              📍 {post.location.name} · {post.location.latitude.toFixed(4)}, {post.location.longitude.toFixed(4)}
            </span>
            <a
              href={`https://www.openstreetmap.org/?mlat=${post.location.latitude}&mlon=${post.location.longitude}#map=${post.location.zoom ?? 14}/${post.location.latitude}/${post.location.longitude}`}
              target="_blank"
              rel="noreferrer noopener"
              className="ml-auto text-sky-600 hover:text-sky-700 underline shrink-0"
            >
              打开地图
            </a>
          </div>
          <div className="w-full aspect-video overflow-hidden bg-white">
            <iframe
              title={`地图 ${post.location.name}`}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${post.location.longitude - 0.008}%2C${post.location.latitude - 0.006}%2C${post.location.longitude + 0.008}%2C${post.location.latitude + 0.006}&layer=mapnik&marker=${post.location.latitude}%2C${post.location.longitude}`}
              className="w-full h-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      )}
      {post.scheduleAt && (
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50">
          <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <CalendarDays size={15} strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-indigo-900 truncate">
              {post.scheduleAt.label ?? '投资者活动时间'}
            </div>
            <div className="text-[11.5px] text-indigo-700/80 truncate">
              {new Date(post.scheduleAt.iso).toLocaleString('zh-CN', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', weekday: 'short',
              })}
              {post.scheduleAt.timezone ? ` · ${post.scheduleAt.timezone}` : ''}
            </div>
          </div>
        </div>
      )}
      {newsWebpage && <WebpagePreviewCard webpage={newsWebpage} badge="新闻稿" />}
      {!newsWebpage && finalWebpage && <WebpagePreviewCard webpage={finalWebpage} />}
      {post.type === 'file' && post.files && post.files.length > 0 && (
        <FileAttachmentList files={post.files} />
      )}
      {post.images && post.images.length > 0 && (
        <ImageGallery
          images={post.images}
          context={{
            post,
            comments,
          }}
        />
      )}
    </div>
  );
}

function QuoteCard({ post }: { post: TimelinePost }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition overflow-hidden">
      <div className="px-3.5 sm:px-4 pt-3.5 sm:pt-4 pb-3 sm:pb-3.5">
        <div className="flex items-start gap-2.5 mb-2">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-100 flex-shrink-0"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44"><circle cx="22" cy="22" r="22" fill="%23e2e8f0"/><path d="M22 19a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm-11 16c1.5-5 6-8 11-8s9.5 3 11 8" fill="%2394a3b8"/></svg>';
            }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="text-[13.5px] font-semibold text-slate-900 truncate">{post.author.name}</div>
              <BadgeCheck size={14} strokeWidth={2} className="text-sky-500 fill-sky-50 shrink-0" />
              <div className="text-[11.5px] text-slate-400 px-1.5 py-0.5 rounded-md bg-sky-50 border border-sky-100 shrink-0">
                {post.author.role}
              </div>
              <div className="inline-flex items-center gap-1.5 text-[13px] sm:text-[13.5px] font-bold tabular-nums text-slate-900 shrink-0 px-2.5 py-1 rounded-xl bg-sky-50 border border-sky-200 shadow-sm shadow-sky-100/50">
                <span className="w-2 h-2 rounded-full bg-sky-500 ring-2 ring-sky-200/80" />
                {post.publishedAt}
              </div>
            </div>
          </div>
        </div>
        <PostBody post={post} comments={[]} />
      </div>
    </div>
  );
}

export default function PostCard({
  post,
  liked,
  bookmarked,
  reposted,
  isAdmin,
  isIRPRAdmin,
  currentUserId,
  likesCount,
  commentsCount,
  repostsCount,
  comments = [],
  onAction,
  isQuote = false,
  onSearchKeyword,
  onCopyText,
}: PostCardProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [wechatOpen, setWechatOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteText, setQuoteText] = useState('');
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentAttachedImages, setCommentAttachedImages] = useState<CommentImageAttach[]>([]);
  const [commentAttachedFiles, setCommentAttachedFiles] = useState<CommentFileAttach[]>([]);
  const [commentVideoEmbed, setCommentVideoEmbed] = useState<NonNullable<TimelinePost['videoEmbed']> | null>(null);
  const commentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const commentImageInputRef = useRef<HTMLInputElement | null>(null);
  const commentFileInputRef = useRef<HTMLInputElement | null>(null);
  const shareRootRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const moreRootRef = useRef<HTMLDivElement>(null);
  const quoteSubmitRef = useRef<() => void>(() => {});

  const adminFlag = Boolean(isIRPRAdmin ?? isAdmin);
  const pinned = Boolean(post.pinned);
  const canEdit = adminFlag || post.author.id === currentUserId;

  const shareTarget = useMemo(() => getPrimaryShareTarget(post), [post]);

  const firstCashtag = useMemo(() => {
    const haystack = [post.content, post.quotePost?.content, post.adminReply?.content]
      .filter(Boolean)
      .join('\n');
    CASHTAG_EXTRACT.lastIndex = 0;
    const m = CASHTAG_EXTRACT.exec(haystack);
    return m ? m[1] : null;
  }, [post]);

  useEffect(() => {
    if (!shareOpen && !moreOpen) return;
    function onClick(e: MouseEvent) {
      const inShare =
        shareRootRef.current?.contains(e.target as Node) ||
        menuBtnRef.current?.contains(e.target as Node);
      const inMore =
        moreRootRef.current?.contains(e.target as Node) ||
        moreBtnRef.current?.contains(e.target as Node);
      if (!inShare) setShareOpen(false);
      if (!inMore) setMoreOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [shareOpen, moreOpen]);

  useEffect(() => {
    if (!wechatOpen && !quoteOpen) return;
    function onClick(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (
        t.id === 'irpr-wechat-backdrop' ||
        t.closest?.('[data-role="irpr-wechat-close"]')
      ) {
        setWechatOpen(false);
      }
      if (
        t.id === 'irpr-quote-backdrop' ||
        t.closest?.('[data-role="irpr-quote-close"]')
      ) {
        setQuoteOpen(false);
        setQuoteText('');
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [wechatOpen, quoteOpen]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareTarget.url);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = shareTarget.url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        /* ignore */
      }
    }
    onAction({ type: 'share', postId: post.id, channel: 'copy', primaryUrl: shareTarget.url });
    setShareOpen(false);
    try {
      const g = window as any;
      if (typeof g.__irprShowToast === 'function') g.__irprShowToast('已复制到剪贴板', 'success');
    } catch {
      /* ignore */
    }
  };

  const copyPostText = async () => {
    const payload = buildPostPlainText(post);
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = payload;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        /* ignore */
      }
    }
    onAction({ type: 'share', postId: post.id, channel: 'copy-text', primaryUrl: shareTarget.url });
    setShareOpen(false);
    try {
      const g = window as any;
      if (typeof g.__irprShowToast === 'function') g.__irprShowToast('动态内容已复制', 'success');
    } catch {
      /* ignore */
    }
  };

  const openWhatsApp = () => {
    const text = encodeURIComponent(`${shareTarget.label}\n${shareTarget.url}`);
    window.open(`${WHATSAPP_BIZ}${text}`, '_blank', 'noopener,noreferrer');
    onAction({ type: 'share', postId: post.id, channel: 'whatsapp', primaryUrl: shareTarget.url });
    setShareOpen(false);
  };
  const openWechat = () => {
    setWechatOpen(true);
    onAction({ type: 'share', postId: post.id, channel: 'wechat', primaryUrl: shareTarget.url });
    setShareOpen(false);
  };
  const openExternal = () => {
    onAction({ type: 'share', postId: post.id, channel: 'open', primaryUrl: shareTarget.url });
    setShareOpen(false);
  };

  const togglePin = () => {
    onAction({ type: 'pin', postId: post.id, pinned: !pinned });
    setMoreOpen(false);
  };

  const isPushed = Boolean(post.pushedNotice?.pushedAt);
  const togglePushNotice = () => {
    onAction({
      type: 'push-notice',
      postId: post.id,
      pushed: !isPushed,
      level: post.pushedNotice?.level ?? 'info',
    });
    setMoreOpen(false);
  };

  const deletePost = () => {
    onAction({ type: 'delete', postId: post.id });
    setMoreOpen(false);
  };

  const editPost = () => {
    onAction({ type: 'edit', postId: post.id });
    setMoreOpen(false);
  };

  const downloadAllFiles = () => {
    if (!post.files || post.files.length === 0) return;
    const extMap: Record<string, string> = { pdf: '.pdf', doc: '.doc', xlsx: '.xlsx', ppt: '.pptx' };
    post.files.forEach((file, idx) => {
      const rawUrl = (file.url || '').trim();
      const isUsable = /^https?:\/\//i.test(rawUrl) || rawUrl.startsWith('blob:') || rawUrl.startsWith('data:');
      if (!isUsable) return;
      window.setTimeout(() => {
        const a = document.createElement('a');
        a.href = rawUrl;
        const base = file.name.replace(/\.[^.]+$/, '');
        a.download = base + (file.name.match(/\.[^.]+$/)?.[0] ?? extMap[file.type] ?? '');
        document.body.appendChild(a);
        a.click();
        window.setTimeout(() => a.remove(), 0);
        onCopyText?.(rawUrl, file.name);
      }, idx * 220);
    });
  };

  const openQuote = () => {
    setQuoteText('');
    setQuoteOpen(true);
  };

  const submitQuote = () => {
    onAction({ type: 'repost', postId: post.id, quoteContent: quoteText.trim() || undefined });
    setQuoteOpen(false);
    setQuoteText('');
  };

  const insertCommentAtCursor = (text: string) => {
    const el = commentTextareaRef.current;
    const start = el
      ? typeof el.selectionStart === 'number'
        ? el.selectionStart
        : commentDraft.length
      : commentDraft.length;
    const end = el
      ? typeof el.selectionEnd === 'number'
        ? el.selectionEnd
        : commentDraft.length
      : commentDraft.length;
    const before = commentDraft.slice(0, start);
    const after = commentDraft.slice(end);
    const next = `${before}${text}${after}`;
    setCommentDraft(next);
    const caret = start + text.length;
    requestAnimationFrame(() => {
      const node = commentTextareaRef.current;
      if (!node) return;
      try {
        node.focus({ preventScroll: true } as FocusOptions);
      } catch {
        node.focus();
      }
      try {
        node.setSelectionRange(caret, caret);
      } catch {
        /* ignore */
      }
    });
  };

  const triggerCommentImagePicker = () => {
    if (!commentImageInputRef.current) return;
    commentImageInputRef.current.value = '';
    commentImageInputRef.current.click();
  };
  const triggerCommentFilePicker = () => {
    if (!commentFileInputRef.current) return;
    commentFileInputRef.current.value = '';
    commentFileInputRef.current.click();
  };

  const handleCommentImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;
    const attached: CommentImageAttach[] = await Promise.all(
      files.map(
        (f) =>
          new Promise<CommentImageAttach>((resolve) => {
            const objectUrl = URL.createObjectURL(f);
            resolve({
              id: `cimg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              name: f.name || 'image',
              sizeBytes: f.size,
              type: f.type || undefined,
              objectUrl,
            });
          })
      )
    );
    setCommentAttachedImages((prev) => [...prev, ...attached]);
  };

  const handleCommentFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length === 0) return;
    const attached: CommentFileAttach[] = picked.map((f) => ({
      id: `cfile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: f.name || 'document',
      sizeBytes: f.size,
      type: inferCommentFileType(f.name),
      objectUrl: URL.createObjectURL(f),
    }));
    setCommentAttachedFiles((prev) => [...prev, ...attached]);
  };

  const removeCommentImage = (id: string) => {
    setCommentAttachedImages((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) {
        try {
          URL.revokeObjectURL(target.objectUrl);
        } catch {
          /* ignore */
        }
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const removeCommentFile = (id: string) => {
    setCommentAttachedFiles((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) {
        try {
          URL.revokeObjectURL(target.objectUrl);
        } catch {
          /* ignore */
        }
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const insertCommentVideo = () => {
    const raw = window.prompt('请粘贴视频链接');
    if (!raw) return;
    const url = raw.trim();
    if (!url) return;
    const videoId = parseCommentYoutubeId(url);
    if (videoId) {
      setCommentVideoEmbed({ provider: 'youtube', url, videoId });
    } else {
      setCommentVideoEmbed({ provider: 'generic', url });
    }
  };

  const submitComment = () => {
    const body = commentDraft.trim();
    const hasImg = commentAttachedImages.length > 0;
    const hasFile = commentAttachedFiles.length > 0;
    const hasVideo = !!commentVideoEmbed;
    if (!body && !hasImg && !hasFile && !hasVideo) return;
    onAction({
      type: 'comment',
      postId: post.id,
      text: body || undefined,
      images: hasImg ? commentAttachedImages.map((i) => i.objectUrl) : undefined,
      files: hasFile
        ? commentAttachedFiles.map((f) => ({
            id: f.id,
            name: f.name,
            size: formatCommentBytes(f.sizeBytes),
            type: f.type,
            url: f.objectUrl,
          }))
        : undefined,
      videoEmbed: hasVideo ? commentVideoEmbed : null,
    });
    setCommentDraft('');
    setCommentAttachedImages(() => []);
    setCommentAttachedFiles(() => []);
    setCommentVideoEmbed(null);
    setCommentsOpen(true);
  };

  quoteSubmitRef.current = submitQuote;

  return (
    <article
      className={[
        'relative bg-white rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-visible transition',
        pinned
          ? 'border border-amber-300/80 bg-gradient-to-br from-amber-50/80 via-white to-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_0_0_1px_rgba(251,191,36,0.08),0_16px_40px_-18px_rgba(217,119,6,0.35)]'
          : 'border border-slate-100',
      ].join(' ')}
    >
      {pinned && (
        <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-amber-400 via-orange-400 to-rose-400 shadow-[0_0_12px_rgba(251,191,36,0.45)] pointer-events-none" aria-hidden="true" />
      )}
      <header className="relative px-4 sm:px-5 pt-4 sm:pt-5 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover ring-2 ring-white border border-slate-100 flex-shrink-0"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44"><circle cx="22" cy="22" r="22" fill="%23e2e8f0"/><path d="M22 19a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm-11 16c1.5-5 6-8 11-8s9.5 3 11 8" fill="%2394a3b8"/></svg>';
            }}
          />
          <div className="min-w-0 flex-1">
            {pinned && (
              <div className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-gradient-to-r from-amber-100 via-orange-100 to-rose-100 border border-amber-300/70 px-2 py-0.5 rounded-full mb-1.5 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset]">
                <Pin size={11} strokeWidth={2.25} className="text-amber-700" />
                已置顶 · 重要公告
              </div>
            )}
            {post.repostOf && !pinned && (
              <div className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mb-1.5">
                <Repeat2 size={11} strokeWidth={2} />
                已转发
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <div className="text-[14.5px] sm:text-[15px] font-semibold text-slate-900 truncate">{post.author.name}</div>
              <BadgeCheck size={14} strokeWidth={2} className="text-sky-500 fill-sky-50 shrink-0" />
              <div className="text-[11.5px] sm:text-[12px] text-slate-500 px-2 py-0.5 rounded-full bg-sky-50 border border-sky-100 flex-shrink-0">
                {post.author.role}
              </div>
              <div className="inline-flex items-center gap-1.5 text-[13px] sm:text-[13.5px] font-bold tabular-nums text-slate-900 shrink-0 px-2.5 py-1 rounded-xl bg-sky-50 border border-sky-200 shadow-sm shadow-sky-100/50">
                <span className="w-2 h-2 rounded-full bg-sky-500 ring-2 ring-sky-200/80" />
                {post.publishedAt}
              </div>
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[11.5px] sm:text-[12px] text-slate-400 overflow-hidden">
              <div className="flex items-center gap-1.5 flex-wrap">
                {(post.tags || []).map((t) => {
                  const cleanTag = `#${t.replace(/^#/, '')}`;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onSearchKeyword?.(cleanTag)}
                      className="inline-flex items-center gap-0.5 text-slate-500 hover:text-sky-600 transition"
                    >
                      {cleanTag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div ref={moreRootRef} className="relative flex-shrink-0">
          <button
            ref={moreBtnRef}
            type="button"
            title="更多"
            onClick={() => setMoreOpen((v) => !v)}
            className="p-2 -mr-1 -mt-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition"
          >
            <MoreHorizontal size={16} strokeWidth={1.75} />
          </button>
          {moreOpen && (
            <div className="absolute z-[75] right-0 sm:right-0 top-full mt-1.5 w-[min(13rem,calc(100vw-2.5rem))] rounded-2xl border border-slate-200 bg-white shadow-[0_20px_48px_-12px_rgba(15,23,42,0.22)] py-1.5 overflow-hidden">
              {canEdit && (
                <button
                  type="button"
                  onClick={editPost}
                  className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-[13px] text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition"
                >
                  <span className="w-7 h-7 rounded-xl flex items-center justify-center bg-sky-50 text-sky-700">
                    <PencilLine size={13.5} strokeWidth={1.75} />
                  </span>
                  编辑动态
                </button>
              )}
              {adminFlag && (
                <button
                  type="button"
                  onClick={togglePin}
                  className={`w-full px-3.5 py-2.5 flex items-center gap-2.5 text-[13px] ${
                    pinned ? 'text-amber-700 hover:bg-amber-50' : 'text-slate-700 hover:bg-slate-50'
                  } transition`}
                >
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                    pinned ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {pinned ? <PinOff size={13.5} strokeWidth={1.75} /> : <Pin size={13.5} strokeWidth={1.75} />}
                  </span>
                  {pinned ? '取消置顶' : '置顶到顶部'}
                </button>
              )}
              {adminFlag && (
                <button
                  type="button"
                  onClick={togglePushNotice}
                  className={`w-full px-3.5 py-2.5 flex items-center gap-2.5 text-[13px] ${
                    isPushed
                      ? 'text-indigo-700 hover:bg-indigo-50'
                      : 'text-slate-700 hover:bg-slate-50'
                  } transition`}
                >
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                    isPushed
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Megaphone size={13.5} strokeWidth={1.8} />
                  </span>
                  <span className="flex-1 text-left flex items-center justify-between gap-2">
                    <span>{isPushed ? '取消公告推送' : '作为公告推送'}</span>
                    {isPushed && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9.5px] font-black bg-indigo-600 text-white">
                        已推送
                      </span>
                    )}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={copyLink}
                className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-[13px] text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition"
              >
                <span className="w-7 h-7 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Copy size={13.5} strokeWidth={1.75} />
                </span>
                复制动态链接
              </button>
              {adminFlag && (
                <div className="my-1 border-t border-slate-100"></div>
              )}
              {adminFlag && (
                <button
                  type="button"
                  onClick={deletePost}
                  className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-[13px] text-rose-600 hover:bg-rose-50 transition"
                >
                  <span className="w-7 h-7 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600">
                    <Trash2 size={13.5} strokeWidth={1.75} />
                  </span>
                  删除动态
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="px-4 sm:px-5 pb-3 sm:pb-4">
        <PostBody post={post} comments={comments} onSearchKeyword={onSearchKeyword} />
        {firstCashtag && !isQuote && <CashtagStockCard symbolRaw={firstCashtag} />}
        {post.quotePost && (
          <div className="mt-3">
            <QuoteCard post={post.quotePost} />
          </div>
        )}
        {post.adminReply && (
          <div className="mt-3.5 relative pl-5">
            <div className="absolute left-1.5 top-0 bottom-0 w-px bg-sky-200" />
            <div className="rounded-2xl border border-sky-100 bg-sky-50/40 px-3.5 sm:px-4 py-3 sm:py-3.5">
              <div className="flex items-start gap-2.5 mb-1.5">
                <img
                  src={post.adminReply.author.avatar}
                  alt={post.adminReply.author.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-sky-100 flex-shrink-0"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="text-[13px] font-semibold text-slate-900 truncate">
                      {post.adminReply.author.name}
                    </div>
                    <BadgeCheck size={13} strokeWidth={2} className="text-sky-500 fill-sky-50 shrink-0" />
                    <div className="text-[11px] text-sky-700 px-1.5 py-0.5 rounded-md bg-sky-100 border border-sky-200 shrink-0 font-medium">
                      官方管理员回复
                    </div>
                    <div className="text-[11px] text-slate-400">· {post.adminReply.publishedAt}</div>
                  </div>
                </div>
              </div>
              <div className="text-[13.5px] leading-[1.6] text-slate-700 whitespace-pre-wrap break-words pl-10">
                <Linkify
                  text={post.adminReply.content}
                  onClickCashtag={onSearchKeyword}
                  onClickHashtag={onSearchKeyword}
                />
              </div>
            </div>
          </div>
        )}
        {post.files && post.files.length > 0 && (
          <div className="mt-2.5 rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50/80 to-white px-3 py-2.5 sm:px-3.5 sm:py-3">
            <div className="flex items-center justify-end gap-2 flex-wrap">
              <button
                type="button"
                onClick={copyPostText}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11.5px] sm:text-[12px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 transition"
              >
                <FileText size={12.5} strokeWidth={1.8} />
                复制文本
              </button>
              <button
                type="button"
                onClick={downloadAllFiles}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11.5px] sm:text-[12px] font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-500 border border-sky-400/70 shadow-[0_1px_2px_rgba(14,165,233,0.25),0_0_0_1px_rgba(255,255,255,0.12)_inset] hover:from-sky-600 hover:to-indigo-600 transition"
              >
                <Download size={12.5} strokeWidth={1.9} />
                一键下载（{post.files.length}）
              </button>
            </div>
          </div>
        )}
      </div>

      {!isQuote && (
        <>
          <footer className="px-1 sm:px-1.5 py-1 border-t border-slate-100 flex items-center justify-between">
          <FooterBtn
            icon={<MessageCircle size={16} strokeWidth={1.6} />}
            count={commentsCount}
            hoverClass={
              commentsOpen
                ? 'bg-sky-50 text-sky-600'
                : 'group-hover:bg-sky-50 group-hover:text-sky-600'
            }
            label="评论"
            onClick={() => setCommentsOpen((v) => !v)}
          />
          <button
            type="button"
            onClick={() => onAction({ type: 'like', postId: post.id })}
            className="group flex-1 min-w-0 flex items-center justify-center gap-1.5 py-3 rounded-xl text-slate-500 transition"
            title={liked ? '取消点赞' : '点赞'}
          >
            <span
              className={`p-2 rounded-full transition ${
                liked ? 'bg-rose-50 text-rose-600' : 'group-hover:bg-rose-50 group-hover:text-rose-600'
              }`}
            >
              <Heart size={16} strokeWidth={1.6} fill={liked ? 'currentColor' : 'none'} />
            </span>
            <span
              className={`text-[12.5px] sm:text-[13px] min-w-[2.5ch] tabular-nums transition ${
                liked ? 'text-rose-600' : 'group-hover:text-rose-600'
              }`}
            >
              {likesCount}
            </span>
          </button>
          <button
            type="button"
            onClick={openQuote}
            className="group flex-1 min-w-0 flex items-center justify-center gap-1.5 py-3 rounded-xl text-slate-500 transition"
            title={reposted ? '再次引用转发' : '引用转发'}
          >
            <span
              className={`p-2 rounded-full transition ${
                reposted
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'group-hover:bg-emerald-50 group-hover:text-emerald-600'
              }`}
            >
              <Repeat2 size={16} strokeWidth={1.6} />
            </span>
            <span
              className={`text-[12.5px] sm:text-[13px] min-w-[2.5ch] tabular-nums transition ${
                reposted ? 'text-emerald-600' : 'group-hover:text-emerald-600'
              }`}
            >
              {repostsCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onAction({ type: 'bookmark', postId: post.id })}
            className="group flex-1 min-w-0 flex items-center justify-center gap-1.5 py-3 rounded-xl text-slate-500 transition"
            title={bookmarked ? '取消收藏' : '收藏'}
          >
            <span
              className={`p-2 rounded-full transition ${
                bookmarked ? 'bg-amber-50 text-amber-600' : 'group-hover:bg-amber-50 group-hover:text-amber-600'
              }`}
            >
              <Bookmark size={16} strokeWidth={1.6} fill={bookmarked ? 'currentColor' : 'none'} />
            </span>
          </button>
          <div ref={shareRootRef} className="relative flex-1 min-w-0 flex items-center justify-center">
            <button
              ref={menuBtnRef}
              type="button"
              onClick={() => setShareOpen((v) => !v)}
              className="group flex w-full items-center justify-center gap-1.5 py-3 rounded-xl text-slate-500 transition"
              title="分享原始链接"
            >
              <span className="p-2 rounded-full transition group-hover:bg-sky-50 group-hover:text-sky-600">
                <Share2 size={16} strokeWidth={1.6} />
              </span>
            </button>
            {shareOpen && (
              <div
                className="absolute z-[70] right-0 sm:right-1 bottom-full mb-2 w-56 sm:w-60 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-[0_20px_48px_-12px_rgba(15,23,42,0.22)] py-2 overflow-hidden"
                style={{ transformOrigin: 'bottom right' }}
              >
                <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-50">
                  分享「{shareTarget.label}」原始链接
                </div>
                <button
                  type="button"
                  onClick={openWhatsApp}
                  className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-[13px] sm:text-[13.5px] text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
                >
                  <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px]">
                    W
                  </span>
                  分享到 WhatsApp
                </button>
                <button
                  type="button"
                  onClick={openWechat}
                  className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-[13px] sm:text-[13.5px] text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
                >
                  <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px]">
                    微
                  </span>
                  分享到微信（二维码）
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={copyPostText}
                  className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-[13px] sm:text-[13.5px] text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                >
                  <span className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <FileText size={13.5} strokeWidth={1.75} />
                  </span>
                  复制动态内容
                </button>
                <button
                  type="button"
                  onClick={copyLink}
                  className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-[13px] sm:text-[13.5px] text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition"
                >
                  <span className="w-7 h-7 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                    <Copy size={13.5} strokeWidth={1.75} />
                  </span>
                  复制原始链接
                  </button>
                </div>
            )}
          </div>
        </footer>

        {commentsOpen && (
          <div className="border-t border-slate-100 bg-slate-50/60 px-3 sm:px-4 py-3 sm:py-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img
                  src={post.author.avatar}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.opacity = '0';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <input
                  ref={commentImageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  data-role="comment-image-input"
                  onChange={handleCommentImageSelected}
                />
                <input
                  ref={commentFileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.md,.rtf,.key"
                  className="hidden"
                  data-role="comment-file-input"
                  onChange={handleCommentFileSelected}
                />
                <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden focus-within:border-sky-300 focus-within:ring-2 focus-within:ring-sky-100 transition">
                  <textarea
                    ref={commentTextareaRef}
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        submitComment();
                      }
                    }}
                    rows={2}
                    placeholder="写下你的评论… 支持 $XMAX / #话题 / 链接自动识别"
                    className="w-full resize-none bg-transparent px-3.5 pt-2.5 pb-1.5 text-[13.5px] leading-[1.6] text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  />
                  {commentVideoEmbed && (
                    <div className="px-2">
                      <CommentVideoEmbedCard
                        embed={commentVideoEmbed}
                        onRemove={() => setCommentVideoEmbed(null)}
                      />
                    </div>
                  )}
                  {commentAttachedImages.length > 0 && (
                    <div className="px-2 pb-1 pt-1">
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                        {commentAttachedImages.map((img) => (
                          <div
                            key={img.id}
                            className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group"
                          >
                            <img
                              src={img.objectUrl}
                              alt={img.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <button
                              type="button"
                              onClick={() => removeCommentImage(img.id)}
                              className="absolute top-1 right-1 p-0.5 rounded-full bg-slate-900/70 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition"
                              title="移除图片"
                            >
                              <X size={11} strokeWidth={2} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {commentAttachedFiles.length > 0 && (
                    <div className="px-2 pb-1 pt-1 space-y-1.5">
                      {commentAttachedFiles.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-slate-200"
                        >
                          <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-semibold uppercase shrink-0">
                            {f.type}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11.5px] font-medium text-slate-800 truncate">{f.name}</div>
                            <div className="text-[10.5px] text-slate-400">{formatCommentBytes(f.sizeBytes)}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCommentFile(f.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition shrink-0"
                            title="移除附件"
                          >
                            <X size={13} strokeWidth={2} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="px-2 pb-2 flex items-center justify-between">
                    <div className="flex items-center gap-0.5 text-slate-400">
                      <EmojiPicker onPick={(emoji) => insertCommentAtCursor(emoji)} />
                      <button
                        type="button"
                        onClick={triggerCommentImagePicker}
                        title="从本地选择图片（支持多选）"
                        className={`p-1.5 rounded-lg hover:bg-slate-100 transition ${commentAttachedImages.length > 0 ? 'bg-sky-50 text-sky-600' : ''}`}
                      >
                        <ImageIcon size={14} strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        onClick={triggerCommentFilePicker}
                        title="从本地选择附件（PDF/Office 等，支持多选）"
                        className={`p-1.5 rounded-lg hover:bg-slate-100 transition ${commentAttachedFiles.length > 0 ? 'bg-sky-50 text-sky-600' : ''}`}
                      >
                        <Paperclip size={14} strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        onClick={insertCommentVideo}
                        title="插入视频链接"
                        className={`p-1.5 rounded-lg hover:bg-slate-100 transition ${commentVideoEmbed ? 'bg-rose-50 text-rose-600' : ''}`}
                      >
                        <Clapperboard size={14} strokeWidth={1.75} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={submitComment}
                      disabled={!commentDraft.trim() && commentAttachedImages.length === 0 && commentAttachedFiles.length === 0 && !commentVideoEmbed}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <Send size={13} strokeWidth={1.75} />
                      发布
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {comments.length > 0 && (
              <div className="space-y-2.5 pt-1 border-t border-slate-200/70">
                {comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2.5">
                    <img
                      src={c.author.avatar}
                      alt={c.author.name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-1 ring-slate-100"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44"><circle cx="22" cy="22" r="22" fill="%23e2e8f0"/><path d="M22 19a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm-11 16c1.5-5 6-8 11-8s9.5 3 11 8" fill="%2394a3b8"/></svg>';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="rounded-2xl bg-white border border-slate-200 px-3 py-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[13px] font-semibold text-slate-900">{c.author.name}</span>
                          <span className="text-[10.5px] text-slate-500 px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-medium">
                            {c.author.role}
                          </span>
                          <span className="text-[11.5px] text-slate-400 tabular-nums">· {c.publishedAt}</span>
                        </div>
                        {c.content && (
                          <div className="mt-1 text-[13px] leading-[1.6] text-slate-700 whitespace-pre-wrap break-words">
                            <Linkify text={c.content} />
                          </div>
                        )}
                        {c.videoEmbed && (
                          <div className="mt-2">
                            <CommentVideoEmbedCard embed={c.videoEmbed} />
                          </div>
                        )}
                        {c.images && c.images.length > 0 && (
                          <div className="mt-2">
                            <ImageGallery images={c.images} />
                          </div>
                        )}
                        {c.files && c.files.length > 0 && (
                          <div className="mt-2">
                            <FileAttachmentList files={c.files} />
                          </div>
                        )}
                      </div>
                      {c.officialReply && (
                        <div className="mt-2 ml-6 border-l-2 border-sky-200 pl-2.5">
                          <div className="rounded-2xl bg-sky-50/80 border border-sky-200 px-3 py-2.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[12.5px] font-semibold text-sky-900 inline-flex items-center gap-1">
                                {c.officialReply.author.name}
                                <span className="w-4 h-4 rounded-full bg-sky-600 text-white inline-flex items-center justify-center">
                                  <BadgeCheck size={10} strokeWidth={2.5} />
                                </span>
                              </span>
                              <span className="text-[10.5px] text-sky-800 px-1.5 py-0.5 rounded-md bg-sky-100 border border-sky-200 font-medium">
                                官方管理员回复
                              </span>
                              <span className="text-[11.5px] text-sky-600/80 tabular-nums">
                                · {c.officialReply.publishedAt}
                              </span>
                            </div>
                            <div className="mt-1 text-[12.5px] leading-[1.6] text-sky-900/90 whitespace-pre-wrap break-words inline-flex items-start gap-1.5">
                              <CornerUpRight size={12} strokeWidth={1.75} className="text-sky-500 mt-0.5 flex-shrink-0" />
                              <span><Linkify text={c.officialReply.content} /></span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </>
      )}

      {wechatOpen && (
        <div
          id="irpr-wechat-backdrop"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
        >
          <div
            id="irpr-wechat-modal"
            className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden"
          >
            <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-[15px] font-semibold text-slate-900">用微信扫码分享</div>
                <div className="mt-1 text-[12.5px] text-slate-500 break-all line-clamp-2">{shareTarget.url}</div>
              </div>
              <button
                type="button"
                data-role="irpr-wechat-close"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                title="关闭"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1.4 1.4l11.2 11.2M12.6 1.4L1.4 12.6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="px-5 pb-5 flex flex-col items-center">
              <div className="w-[240px] h-[240px] p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                <img
                  src={buildWechatUrl(shareTarget.url)}
                  alt="微信分享二维码"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.opacity = '0.25';
                  }}
                />
              </div>
              <div className="mt-3 text-[12px] text-slate-500 text-center">
                打开微信扫一扫，将「{shareTarget.label}」发送给好友
              </div>
            </div>
          </div>
        </div>
      )}

      {quoteOpen && (
        <div
          id="irpr-quote-backdrop"
          className="fixed inset-0 z-[85] flex items-start justify-center bg-slate-900/45 backdrop-blur-sm p-4 sm:items-center"
        >
          <div
            id="irpr-quote-modal"
            className="w-full max-w-[560px] rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          >
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                  <Repeat2 size={15} strokeWidth={1.75} />
                </div>
                <div>
                  <div className="text-[14.5px] font-semibold text-slate-900">引用转发</div>
                  <div className="text-[11px] text-slate-400">
                    {reposted ? '你已转发过此帖，将发布一条新的引用' : '发布一条新动态，引用下方原帖'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                data-role="irpr-quote-close"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                title="关闭"
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="px-5 pt-4 pb-2">
                <textarea
                  value={quoteText}
                  onChange={(e) => setQuoteText(e.target.value)}
                  placeholder="写下你的评论……支持 $XMAX Cashtag、链接自动识别、表情符号"
                  rows={4}
                  className="w-full resize-none text-[14.5px] leading-[1.6] text-slate-800 placeholder:text-slate-400 focus:outline-none rounded-xl border border-transparent focus:border-sky-200 focus:bg-sky-50/30 bg-transparent px-2 py-1.5 -mx-2 -my-1.5 transition"
                />
              </div>
              <div className="px-5 py-3 border-t border-slate-100">
                <QuoteCard post={post} />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  className="p-2 rounded-xl text-slate-400 hover:bg-white hover:text-sky-600 transition"
                  title="插入图片（暂未开放）"
                  disabled
                >
                  <ImageIcon size={16} strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  className="p-2 rounded-xl text-slate-400 hover:bg-white hover:text-sky-600 transition"
                  title="插入附件（暂未开放）"
                  disabled
                >
                  <Paperclip size={16} strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  className="p-2 rounded-xl text-slate-400 hover:bg-white hover:text-violet-600 transition"
                  title="AI 整理原帖观点（暂未开放）"
                  disabled
                >
                  <Sparkles size={16} strokeWidth={1.75} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                {reposted && (
                  <button
                    type="button"
                    onClick={() => {
                      onAction({ type: 'repost', postId: post.id, quoteContent: quoteText.trim() || undefined, _undo: true } as PostInteractionAction & { _undo?: boolean });
                      setQuoteOpen(false);
                      setQuoteText('');
                    }}
                    className="px-3.5 py-2 rounded-xl text-[13px] font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:text-slate-800 transition"
                  >
                    取消转发
                  </button>
                )}
                <button
                  type="button"
                  onClick={submitQuote}
                  className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  发布
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function FooterBtn({
  icon,
  count,
  hoverClass,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  count?: number;
  hoverClass: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="group flex-1 min-w-0 flex items-center justify-center gap-1.5 py-3 rounded-xl text-slate-500 transition"
    >
      <span className={`p-2 rounded-full transition ${hoverClass}`}>
        {icon}
      </span>
      {typeof count === 'number' && (
        <span className="text-[12.5px] sm:text-[13px] min-w-[1.5ch] tabular-nums text-slate-500 group-hover:text-inherit transition">
          {count}
        </span>
      )}
    </button>
  );
}
