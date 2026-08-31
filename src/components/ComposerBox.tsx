import { useEffect, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, Paperclip, Send, X, Link as LinkIcon, Sparkles, Clapperboard, Play, ExternalLink, TrendingUp } from 'lucide-react';
import type { FileAttachment, PostType, TimelinePost, WebpagePreview } from '../types/irpr';
import WebpagePreviewCard from './WebpagePreviewCard';
import EmojiPicker from './EmojiPicker';
import { extractFirstUrl, fakePreviewFromUrl, pickDomainGradient } from './Linkify';

interface ComposerBoxProps {
  onPublish?: (
    post: Omit<TimelinePost, 'id' | 'author' | 'publishedAt' | 'tags'> & { tags?: string[] }
  ) => void;
  onAISummarize?: (payload: {
    images: Array<{ name: string; sizeBytes?: number; type?: string; objectUrl: string }>;
    files: Array<{ name: string; sizeBytes?: number; type: FileAttachment['type'] }>;
  }) => Promise<string | null> | string | null;
}

function sanitizeInput(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/\r\n?/g, '\n');
}

function stripTrailingPunctuation(url: string): string {
  let cleaned = url;
  while (cleaned.length > 8 && /[.,;:!?)\]}】」』）]$/.test(cleaned)) {
    cleaned = cleaned.slice(0, -1);
  }
  return cleaned;
}

function safeText(text: unknown, fallback: string, max = 200): string {
  if (typeof text !== 'string') return fallback;
  const t = text
    .replace(/\0/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!t) return fallback;
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

interface ImageAttach {
  id: string;
  name: string;
  sizeBytes?: number;
  type?: string;
  objectUrl: string;
}

interface FileAttach {
  id: string;
  name: string;
  sizeBytes: number;
  type: FileAttachment['type'];
  objectUrl: string;
}

function formatBytes(bytes?: number): string {
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function inferFileType(name: string): FileAttachment['type'] {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (/\.(xls|xlsx|csv)$/.test(lower)) return 'xlsx';
  if (/\.(doc|docx|txt|md|rtf)$/.test(lower)) return 'doc';
  if (/\.(ppt|pptx|key)$/.test(lower)) return 'ppt';
  return 'pdf';
}

function buildPlaceholderAISummary(params: {
  images: ImageAttach[];
  files: FileAttach[];
}): string {
  const { images, files } = params;
  const parts: string[] = [];
  if (images.length > 0) {
    const names = images.map((i) => i.name).join('、');
    const totalKb = images
      .map((i) => (i.sizeBytes ? Math.round(i.sizeBytes / 1024) : 0))
      .reduce((a, b) => a + b, 0);
    parts.push(
      `【AI 图像摘要·占位·待接入 LLM】\n已上传 ${images.length} 张图片：${names}（总计 ${totalKb} KB）。\n建议要点：① 核对图中关键结论/数据图表是否与正文一致；② 如含财报截图，自动识别并提取「营收/利润/毛利率」3 项核心指标；③ 如为产品图片，补充规格与发布背景。接入 MuskZoom 账号体系后将替换为真实视觉模型识别结果。`
    );
  }
  if (files.length > 0) {
    const names = files.map((f) => `${f.name}(${formatBytes(f.sizeBytes)})`).join('、');
    parts.push(
      `【AI 文档摘要·占位·待接入 LLM】\n已上传 ${files.length} 份文件：${names}。\n建议要点：① 自动提取标题、日期、作者/机构署名；② 生成 3-5 条核心结论的要点列表（TL;DR）；③ 标注关键数字（金额/比例/时间）并给出原文上下文页码；④ 敏感信息（未公开的财报数据）自动打标并提示二次审核。接入 MuskZoom 账号体系后将替换为真实 OCR + LLM 文档理解结果。`
    );
  }
  return parts.join('\n\n');
}

function parseYoutubeId(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = url.pathname.replace(/^\//, '').split('/')[0];
      if (id && id.length >= 10) return id;
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

export default function ComposerBox({ onPublish, onAISummarize }: ComposerBoxProps) {
  const [content, setContent] = useState('');
  const [attachedImages, setAttachedImages] = useState<ImageAttach[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<FileAttach[]>([]);
  const [pasteTick, setPasteTick] = useState(0);
  const [aiGenerating, setAIGenerating] = useState(false);
  const [aiBanner, setAIBanner] = useState<{ visible: boolean; source: 'images' | 'files' | 'both'; msg?: string }>({
    visible: false,
    source: 'both',
  });
  const [videoEmbed, setVideoEmbed] = useState<NonNullable<TimelinePost['videoEmbed']> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const detectedUrl = useMemo(
    () => extractFirstUrl(content),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [content, pasteTick]
  );
  const detectedPreview = useMemo<WebpagePreview | null>(
    () => (detectedUrl ? fakePreviewFromUrl(detectedUrl) : null),
    [detectedUrl]
  );

  useEffect(() => {
    if (!detectedPreview) return;
    if (detectedPreview.title && detectedPreview.description && detectedPreview.domain) return;
    console.warn('[IRPR] 预览字段存在空值，已在生成阶段兜底填充，请检查：', detectedPreview);
  }, [detectedPreview]);

  const setContentSanitized = (next: string | number | null | undefined | ((prev: string) => string | number | null | undefined)) => {
    let value = '';
    if (typeof next === 'function') {
      value = sanitizeInput((next as (prev: string) => unknown)(content));
    } else {
      value = sanitizeInput(next);
    }
    setContent(value);
    if (textareaRef.current) textareaRef.current.value = value;
  };

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    const start = el
      ? typeof el.selectionStart === 'number'
        ? el.selectionStart
        : content.length
      : content.length;
    const end = el
      ? typeof el.selectionEnd === 'number'
        ? el.selectionEnd
        : content.length
      : content.length;
    const before = content.slice(0, start);
    const after = content.slice(end);
    const next = `${before}${text}${after}`;
    setContentSanitized(next);
    const caret = start + text.length;
    requestAnimationFrame(() => {
      const node = textareaRef.current;
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

  const CASHTAG_XMAX_RE = /(^|\s)\$XMAX\b/gi;

  const hasXmaxTag = useMemo(() => CASHTAG_XMAX_RE.test(' ' + content + ' '), [content]);

  const [stockFlash, setStockFlash] = useState<{ visible: boolean; mode: 'insert' | 'remove' }>({
    visible: false,
    mode: 'insert',
  });

  const toggleXmaxStock = () => {
    const reg = new RegExp(CASHTAG_XMAX_RE.source, 'gi');
    if (hasXmaxTag) {
      const cleaned = sanitizeInput(content.replace(reg, '$1').replace(/[ \t\u00A0]{2,}/g, ' ').trim());
      setContentSanitized(cleaned);
      setStockFlash({ visible: true, mode: 'remove' });
      window.setTimeout(() => setStockFlash((f) => ({ ...f, visible: false })), 1200);
      return;
    }
    insertAtCursor(' $XMAX ');
    setStockFlash({ visible: true, mode: 'insert' });
    window.setTimeout(() => setStockFlash((f) => ({ ...f, visible: false })), 1200);
  };

  const clearDetectedLink = () => {
    if (!detectedUrl) return;
    const removed = sanitizeInput(content.replace(detectedUrl, '')).replace(/\s{3,}/g, '  ').trim();
    setContentSanitized(removed);
    setPasteTick((t) => t + 1);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    let plain: string | null = null;
    try {
      plain = e.clipboardData?.getData('text/plain') ?? null;
    } catch {
      plain = null;
    }
    if (plain == null) {
      setPasteTick((t) => t + 1);
      return;
    }
    e.preventDefault();
    const target = e.currentTarget;
    const start = typeof target.selectionStart === 'number' ? target.selectionStart : content.length;
    const end = typeof target.selectionEnd === 'number' ? target.selectionEnd : content.length;
    const before = content.slice(0, start);
    const after = content.slice(end);
    const next = `${before}${plain}${after}`;
    setContentSanitized(next);
    setPasteTick((t) => t + 1);
    const caret = start + plain.length;
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      try {
        el.focus({ preventScroll: true });
      } catch {
        el.focus();
      }
      try {
        el.setSelectionRange(caret, caret);
      } catch {
        /* ignore */
      }
    });
  };

  const triggerImagePicker = () => {
    if (!imageInputRef.current) return;
    imageInputRef.current.value = '';
    imageInputRef.current.click();
  };
  const triggerFilePicker = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.value = '';
    fileInputRef.current.click();
  };

  const runAISummary = async (next: { images: ImageAttach[]; files: FileAttach[] }) => {
    const { images, files } = next;
    if (images.length === 0 && files.length === 0) return;
    const source: 'images' | 'files' | 'both' =
      images.length > 0 && files.length > 0 ? 'both' : images.length > 0 ? 'images' : 'files';
    try {
      setAIGenerating(true);
      setAIBanner({ visible: true, source });
      let summary: string | null = null;
      if (typeof onAISummarize === 'function') {
        try {
          summary = await onAISummarize({
            images: images.map(({ id: _id, ...rest }) => rest),
            files: files.map(({ id: _id, objectUrl: _o, ...rest }) => rest),
          });
        } catch (err) {
          console.warn('[IRPR] onAISummarize 执行失败，回退占位摘要：', err);
          summary = null;
        }
      }
      const finalSummary = summary || buildPlaceholderAISummary({ images, files });
      setContentSanitized((cur) => {
        const base = sanitizeInput(cur);
        if (!base) return finalSummary;
        if (base.includes('【AI 图像摘要') || base.includes('【AI 文档摘要')) return base;
        return `${base}\n\n${finalSummary}`.trim();
      });
      setAIBanner({ visible: true, source, msg: typeof onAISummarize === 'function' ? 'AI 整理完成' : '未配置 LLM，已展示结构化占位摘要' });
    } finally {
      setAIGenerating(false);
    }
  };

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;
    const attached: ImageAttach[] = await Promise.all(
      files.map(
        (f) =>
          new Promise<ImageAttach>((resolve) => {
            const objectUrl = URL.createObjectURL(f);
            resolve({
              id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              name: f.name || 'image',
              sizeBytes: f.size,
              type: f.type || undefined,
              objectUrl,
            });
          })
      )
    );
    setAttachedImages((prev) => {
      const next = [...prev, ...attached];
      void runAISummary({ images: next, files: attachedFiles });
      return next;
    });
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length === 0) return;
    const attached: FileAttach[] = picked.map((f) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: f.name || 'document',
      sizeBytes: f.size,
      type: inferFileType(f.name),
      objectUrl: URL.createObjectURL(f),
    }));
    setAttachedFiles((prev) => {
      const next = [...prev, ...attached];
      void runAISummary({ images: attachedImages, files: next });
      return next;
    });
  };

  const removeImage = (id: string) => {
    setAttachedImages((prev) => {
      const next = prev.filter((p) => p.id !== id);
      const target = prev.find((p) => p.id === id);
      if (target) {
        try {
          URL.revokeObjectURL(target.objectUrl);
        } catch {
          /* ignore */
        }
      }
      return next;
    });
  };

  const removeFile = (id: string) => {
    setAttachedFiles((prev) => {
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

  const insertVideo = () => {
    const raw = window.prompt('请粘贴视频链接');
    if (!raw) return;
    const url = raw.trim();
    if (!url) return;
    const videoId = parseYoutubeId(url);
    if (videoId) {
      setVideoEmbed({ provider: 'youtube', url, videoId });
    } else {
      setVideoEmbed({ provider: 'generic', url });
    }
  };

  useEffect(() => {
    return () => {
      [...attachedImages, ...attachedFiles].forEach((a) => {
        try {
          URL.revokeObjectURL(a.objectUrl);
        } catch {
          /* ignore */
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePublish = () => {
    const textTrimmed = sanitizeInput(content).trim();
    const hasImages = attachedImages.length > 0;
    const hasFiles = attachedFiles.length > 0;
    const hasVideo = !!videoEmbed;
    if (!textTrimmed && !hasImages && !hasFiles && !hasVideo) return;

    let type: PostType = 'news';
    let webpage: WebpagePreview | undefined = undefined;
    if (detectedPreview) {
      type = 'webpage';
      webpage = detectedPreview;
    } else if (hasImages) {
      type = 'image';
    } else if (hasFiles) {
      type = 'file';
    }

    const finalFiles: FileAttachment[] | undefined = hasFiles
      ? attachedFiles.map((f) => ({
          id: f.id,
          name: f.name,
          size: formatBytes(f.sizeBytes),
          type: f.type,
          url: f.objectUrl,
        }))
      : undefined;

    const finalImages: string[] | undefined = hasImages
      ? attachedImages.map((i) => i.objectUrl)
      : undefined;

    const baseTags: string[] = detectedPreview
      ? ['#链接分享']
      : hasVideo
      ? ['#视频']
      : hasImages && hasFiles
      ? ['#图片', '#文档']
      : hasImages
      ? ['#图片']
      : hasFiles
      ? ['#文档']
      : ['#最新发布'];
    if (aiBanner.visible) baseTags.push('#AI整理');

    onPublish?.({
      type,
      content: textTrimmed,
      webpage,
      images: finalImages,
      files: finalFiles,
      videoEmbed: hasVideo ? videoEmbed : null,
      tags: baseTags,
    });

    setContentSanitized('');
    setVideoEmbed(null);
    setAttachedImages((prev) => {
      prev.forEach((i) => {
        try {
          URL.revokeObjectURL(i.objectUrl);
        } catch {
          /* ignore */
        }
      });
      return [];
    });
    setAttachedFiles((prev) => {
      prev.forEach((f) => {
        try {
          URL.revokeObjectURL(f.objectUrl);
        } catch {
          /* ignore */
        }
      });
      return [];
    });
    setAIBanner({ visible: false, source: 'both' });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleImageSelected}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.md,.rtf,.key"
        className="hidden"
        onChange={handleFileSelected}
      />
      <div className="flex gap-3">
        <img
          src="https://i.pravatar.cc/80?img=32"
          alt="avatar"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex-shrink-0 ring-2 ring-white border border-slate-100 object-cover"
        />
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContentSanitized(e.target.value)}
            onPaste={handlePaste}
            placeholder="分享最新动态，粘贴链接可自动生成网页预览……"
            rows={2}
            className="w-full resize-none bg-slate-50 rounded-2xl border-0 px-3 sm:px-4 py-2.5 sm:py-3.5 text-[13.5px] sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:bg-white transition min-h-[80px]"
          />

          {aiBanner.visible && (
            <div className="mt-3 flex items-start justify-between gap-3 rounded-2xl border border-violet-100 bg-violet-50/60 px-3 sm:px-4 py-2.5">
              <div className="flex items-start gap-2 min-w-0">
                <div className="mt-0.5 w-7 h-7 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={14} strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] sm:text-[12.5px] font-medium text-violet-900">
                    {aiGenerating
                      ? 'AI 正在整理上传内容…'
                      : typeof onAISummarize === 'function'
                      ? 'AI 整理完成'
                      : 'AI 内容整理（占位）'}
                  </div>
                  <div className="mt-0.5 text-[11.5px] sm:text-[12px] text-violet-700/80 leading-relaxed">
                    {aiBanner.msg ??
                      (typeof onAISummarize === 'function'
                        ? `${aiBanner.source === 'images' ? '图片' : aiBanner.source === 'files' ? '文档' : '图片+文档'}已由 LLM 解析并插入正文，可编辑后发布。`
                        : `未配置 LLM，当前为结构化占位模板，接入 MuskZoom 账号体系与 LLM 后将替换为真实 ${
                            aiBanner.source === 'images' ? '图像识别 / OCR' : aiBanner.source === 'files' ? '文档摘要' : '图文联合摘要'
                          }。`)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAIBanner({ visible: false, source: 'both' })}
                className="p-1 rounded-lg text-violet-500 hover:text-violet-700 hover:bg-violet-100 transition flex-shrink-0"
                title="收起 AI 提示"
              >
                <X size={12} strokeWidth={2} />
              </button>
            </div>
          )}

          {detectedPreview && (
            <div className="mt-3">
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-sky-600 bg-sky-50 rounded-lg">
                  <LinkIcon size={12} strokeWidth={2} />
                  <span className="truncate max-w-[220px] sm:max-w-sm">
                    已识别链接：<span className="font-medium">{detectedPreview.domain}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={clearDetectedLink}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X size={12} strokeWidth={2} />
                  移除识别
                </button>
              </div>
              <WebpagePreviewCard webpage={detectedPreview} />
            </div>
          )}

          {attachedImages.length > 0 && (
            <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
              {attachedImages.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                  <img src={img.objectUrl} alt={img.name} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute left-1.5 bottom-1.5 right-1.5 text-[10px] font-medium text-white bg-slate-900/60 backdrop-blur rounded-md px-1.5 py-0.5 truncate">
                    {img.name}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/70 text-white opacity-0 group-hover:opacity-100 transition"
                    title="移除图片"
                  >
                    <X size={12} strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {attachedFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachedFiles.map((f) => (
                <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-semibold uppercase">
                    {f.type}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-800 truncate">{f.name}</div>
                    <div className="text-[11px] text-slate-400">{formatBytes(f.sizeBytes)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(f.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition"
                    title="移除附件"
                  >
                    <X size={14} strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {videoEmbed && (
            <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
              <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-2 text-[11px] text-slate-700 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <Play size={11} strokeWidth={1.75} />
                  </span>
                  <span className="truncate">
                    {videoEmbed.provider === 'youtube'
                      ? `YouTube · ${videoEmbed.videoId ?? videoEmbed.url}`
                      : videoEmbed.url}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setVideoEmbed(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition shrink-0"
                  title="移除视频"
                >
                  <X size={12} strokeWidth={2} />
                </button>
              </div>
              <div className="relative w-full aspect-video bg-black flex items-center justify-center text-white text-[10.5px]">
                {videoEmbed.provider === 'youtube' && videoEmbed.videoId ? (
                  <iframe
                    title="视频预览"
                    src={`https://www.youtube.com/embed/${videoEmbed.videoId}`}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <a
                    href={videoEmbed.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 backdrop-blur hover:bg-white/15 transition"
                  >
                    <ExternalLink size={12} strokeWidth={1.5} />
                    <span className="max-w-[200px] truncate">{videoEmbed.url}</span>
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-3 sm:mt-4">
            <div className="flex items-center gap-0.5 sm:gap-1">
              <EmojiPicker onPick={(emoji) => insertAtCursor(emoji)} />
              <button
                type="button"
                onClick={triggerImagePicker}
                title="从本地选择图片（支持多选）"
                className={`p-2 sm:p-2.5 rounded-xl transition ${
                  attachedImages.length > 0
                    ? 'bg-sky-50 text-sky-600'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ImageIcon size={16} strokeWidth={1.6} />
              </button>
              <button
                type="button"
                onClick={triggerFilePicker}
                title="从本地选择附件（PDF/Office 等，支持多选）"
                className={`p-2 sm:p-2.5 rounded-xl transition ${
                  attachedFiles.length > 0
                    ? 'bg-sky-50 text-sky-600'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Paperclip size={16} strokeWidth={1.6} />
              </button>
              <button
                type="button"
                onClick={insertVideo}
                title="插入视频链接"
                className={`p-2 sm:p-2.5 rounded-xl transition ${
                  videoEmbed ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Clapperboard size={16} strokeWidth={1.6} />
              </button>
              <button
                type="button"
                onClick={toggleXmaxStock}
                title={hasXmaxTag ? '移除 XMAX 股价卡片' : '插入 XMAX 股价卡片（行情来源：富途牛牛）'}
                className={`p-2 sm:p-2.5 rounded-xl transition relative ${
                  hasXmaxTag
                    ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <TrendingUp size={16} strokeWidth={1.75} />
                {stockFlash.visible && (
                  <span
                    className={`pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg px-2 py-0.5 text-[10.5px] font-semibold shadow-md shadow-slate-200/70 ${
                      stockFlash.mode === 'insert'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-white'
                    }`}
                  >
                    {stockFlash.mode === 'insert' ? '已插入 XMAX 股价' : '已移除 XMAX 股价'}
                  </span>
                )}
              </button>
              {aiGenerating && (
                <span className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 text-[11px] text-violet-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                  整理中
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handlePublish}
              disabled={
                !sanitizeInput(content).trim() &&
                attachedImages.length === 0 &&
                attachedFiles.length === 0
              }
              className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <Send size={14} strokeWidth={1.75} />
              发布
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
