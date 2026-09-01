import { useMemo, useState } from 'react';
import {
  FileText,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Download,
  Copy,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Megaphone,
  Clock3,
  ScanLine,
  Users,
  Building2,
} from 'lucide-react';
import type { SECFilingSummary, SECFormType, SECFilingStatus } from '../types/irpr';

const FORM_TONE: Record<
  SECFormType,
  { label: string; badge: string; ring: string; iconBg: string; iconText: string }
> = {
  '8-K': {
    label: '8-K',
    badge:
      'bg-rose-50 text-rose-700 border border-rose-100',
    ring: 'ring-rose-100',
    iconBg: 'from-rose-500 to-rose-600',
    iconText: '8-K',
  },
  '10-Q': {
    label: '10-Q',
    badge: 'bg-sky-50 text-sky-700 border border-sky-100',
    ring: 'ring-sky-100',
    iconBg: 'from-sky-500 to-blue-600',
    iconText: '10-Q',
  },
  '10-K': {
    label: '10-K',
    badge: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
    ring: 'ring-indigo-100',
    iconBg: 'from-indigo-500 to-indigo-600',
    iconText: '10-K',
  },
  '13G': {
    label: '13G',
    badge: 'bg-violet-50 text-violet-700 border border-violet-100',
    ring: 'ring-violet-100',
    iconBg: 'from-violet-500 to-violet-600',
    iconText: '13G',
  },
  '424B5': {
    label: '424B5',
    badge: 'bg-amber-50 text-amber-700 border border-amber-100',
    ring: 'ring-amber-100',
    iconBg: 'from-amber-500 to-orange-600',
    iconText: '424B5',
  },
  FORM3: {
    label: 'FORM 3',
    badge: 'bg-teal-50 text-teal-700 border border-teal-100',
    ring: 'ring-teal-100',
    iconBg: 'from-teal-500 to-emerald-600',
    iconText: 'F3',
  },
  FORM4: {
    label: 'FORM 4',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    ring: 'ring-emerald-100',
    iconBg: 'from-emerald-500 to-emerald-600',
    iconText: 'F4',
  },
  CORRESP: {
    label: 'CORRESP',
    badge: 'bg-slate-100 text-slate-700 border border-slate-200',
    ring: 'ring-slate-200',
    iconBg: 'from-slate-500 to-slate-600',
    iconText: 'CR',
  },
  OTHER: {
    label: '其他',
    badge: 'bg-slate-50 text-slate-600 border border-slate-200',
    ring: 'ring-slate-100',
    iconBg: 'from-slate-500 to-slate-600',
    iconText: 'OT',
  },
};

const STATUS_META: Record<
  SECFilingStatus,
  { label: string; className: string; icon: typeof Sparkles }
> = {
  summarizing: {
    label: 'AI 总结中',
    className:
      'inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 text-[11px] font-medium',
    icon: Loader2,
  },
  ready: {
    label: '已就绪',
    className:
      'inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 text-[11px] font-medium',
    icon: CheckCircle2,
  },
  need_review: {
    label: '需人工复核',
    className:
      'inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 text-[11px] font-medium',
    icon: AlertTriangle,
  },
  published: {
    label: '已发布动态',
    className:
      'inline-flex items-center gap-1 rounded-full bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 text-[11px] font-medium',
    icon: Megaphone,
  },
};

function formatFiledAt(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

interface Props {
  filing: SECFilingSummary;
  isIRPRAdmin?: boolean;
  compact?: boolean;
  listItem?: boolean;
  selected?: boolean;
  showOneLiner?: boolean;
  expandedSummary?: boolean;
  onClick?: () => void;
  onPublishAsPost?: (filing: SECFilingSummary) => void;
  onCopyText?: (text: string, toast: string) => void;
  onDownloadFile?: (file: { name: string; url: string }) => void;
  onViewPublishedPost?: (postId: string) => void;
  onChangeExpandedSummary?: (next: boolean) => void;
}

export default function SECFilingCard({
  filing,
  isIRPRAdmin = true,
  compact = false,
  listItem = false,
  selected = false,
  showOneLiner = true,
  expandedSummary = false,
  onClick,
  onPublishAsPost,
  onCopyText,
  onDownloadFile,
  onViewPublishedPost,
  onChangeExpandedSummary,
}: Props) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded = onChangeExpandedSummary ? expandedSummary : internalExpanded;
  const setExpanded = (updater: boolean | ((v: boolean) => boolean)) => {
    const next = typeof updater === 'function' ? updater(expanded) : updater;
    if (onChangeExpandedSummary) onChangeExpandedSummary(next);
    else setInternalExpanded(next);
  };
  const tone = useMemo(() => FORM_TONE[filing.formType] ?? FORM_TONE.OTHER, [filing.formType]);
  const status = STATUS_META[filing.status];
  const StatusIcon = status.icon;

  const aiRiskBadge =
    filing.aiRisk === 'high' ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 text-[11px] font-medium">
        <AlertTriangle size={11} />
        高风险提示
      </span>
    ) : filing.aiRisk === 'medium' ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 text-[11px] font-medium">
        <AlertTriangle size={11} />
        中风险复核
      </span>
    ) : null;

  const oneLiner =
    (filing.keyPoints && filing.keyPoints[0]) ||
    filing.summary
      .replace(/^【[^】]+】/, '')
      .replace(/——[\s\S]*$/, '')
      .trim() ||
    filing.subject;

  if (listItem) {
    const Wrapper: any = onClick ? 'button' : 'div';
    const wrapperProps: any = onClick
      ? { type: 'button', onClick }
      : {};
    return (
      <Wrapper
        {...wrapperProps}
        className={[
          'w-full text-left group rounded-2xl bg-white border transition overflow-hidden px-3 sm:px-3.5 py-2.5 sm:py-3 flex items-start gap-3 hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)] border-slate-200/80 hover:border-slate-300',
        ].join(' ')}
      >
        <div
          className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${tone.iconBg} text-white shadow-[0_4px_12px_-4px_rgba(15,23,42,0.25)] flex items-center justify-center font-black tracking-tight text-[10.5px] sm:text-[11px]`}
        >
          {tone.iconText}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] sm:text-[10.5px] font-bold ${tone.badge}`}>
              {tone.label}
            </span>
            <span className="inline-flex items-center gap-1 text-[10.5px] sm:text-[11px] text-slate-500 tabular-nums shrink-0">
              <CalendarDays size={10} />
              {formatFiledAt(filing.filedAt)}
            </span>
            <span className={status.className.replace('text-[11px]', 'text-[10px]').replace('px-2 py-0.5', 'px-1.5 py-[1px]')}>
              <StatusIcon
                size={9.5}
                className={filing.status === 'summarizing' ? 'animate-spin' : ''}
              />
              {status.label}
            </span>
          </div>
          <div className="mt-1 text-[12px] sm:text-[12.5px] font-semibold text-slate-900 leading-snug line-clamp-1 group-hover:text-indigo-700 transition">
            {filing.subject}
          </div>
          {showOneLiner && (
            <div className="mt-0.5 text-[11px] sm:text-[11.5px] text-slate-500 leading-snug line-clamp-2">
              {oneLiner}
            </div>
          )}
          {filing.rawFile?.size && (
            <div className="mt-1 inline-flex items-center gap-1 text-[10px] sm:text-[10.5px] text-slate-400 tabular-nums">
              <FileText size={9.5} /> {filing.issuer} · {filing.rawFile.size}
            </div>
          )}
        </div>
      </Wrapper>
    );
  }

  if (compact) {
    return (
      <article className="group rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-[0_16px_48px_-24px_rgba(15,23,42,0.15)] transition overflow-hidden flex items-center gap-3 px-3 sm:px-3.5 py-3 sm:py-3.5 min-h-[56px] sm:min-h-[64px]">
        <div
          className={`shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${tone.iconBg} text-white shadow-[0_6px_16px_-4px_rgba(15,23,42,0.25)] flex items-center justify-center font-bold tracking-tight text-[11px]`}
        >
          {tone.iconText}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10.5px] font-bold ${tone.badge}`}>
              {tone.label}
            </span>
            <span className="inline-flex items-center gap-1 text-[11.5px] text-slate-500">
              <CalendarDays size={11} />
              {formatFiledAt(filing.filedAt)}
            </span>
            {filing.status !== 'ready' && (
              <span className={status.className}>
                <StatusIcon size={10.5} className={filing.status === 'summarizing' ? 'animate-spin' : ''} />
                {status.label}
              </span>
            )}
          </div>
          <h4 className="text-[13px] sm:text-[13.5px] font-semibold text-slate-800 leading-snug mt-0.5 line-clamp-2 group-hover:text-slate-900 transition">
            {filing.subject}
          </h4>
          {showOneLiner && (
            <div className="mt-0.5 text-[11.5px] text-slate-500 leading-snug line-clamp-2">
              {oneLiner}
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <article
      className={`rounded-3xl border border-slate-200/80 bg-white hover:border-slate-300 shadow-[0_1px_0_rgba(15,23,42,0.04)] hover:shadow-[0_18px_56px_-28px_rgba(15,23,42,0.22)] transition-all duration-200 overflow-hidden`}
    >
      <div className="px-4 sm:px-5 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-2 w-full sm:w-[88px] shrink-0">
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${tone.iconBg} text-white shadow-[0_8px_24px_-8px_rgba(15,23,42,0.35)] flex items-center justify-center font-black tracking-tight text-[13px] sm:text-[14px]`}
          >
            {tone.iconText}
          </div>
          <div className="sm:mt-1 flex sm:flex-col gap-1.5 items-start sm:items-center">
            <div
              className={`inline-flex items-center px-2 py-0.5 rounded-xl text-[11px] sm:text-[11.5px] font-bold ${tone.badge}`}
            >
              <FileText size={10.5} className="mr-1" />
              {tone.label}
            </div>
            <div className="inline-flex items-center gap-1 text-[11.5px] text-slate-500">
              <CalendarDays size={11} />
              <span className="tabular-nums">{formatFiledAt(filing.filedAt)}</span>
            </div>
            <div className="inline-flex items-center gap-1 text-[11.5px] text-slate-500">
              <Clock3 size={11} />
              <span className="tabular-nums">
                {new Date(filing.ingestedAt).toLocaleDateString('zh-CN', {
                  month: '2-digit',
                  day: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
            <span className={status.className}>
              <StatusIcon size={10.5} className={filing.status === 'summarizing' ? 'animate-spin' : ''} />
              {status.label}
            </span>
            {aiRiskBadge}
            {filing.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full bg-slate-50 text-slate-600 border border-slate-200/80 px-2 py-0.5 text-[11px] hover:bg-slate-100 transition cursor-help"
              >
                #{t}
              </span>
            ))}
            {filing.tags.length > 4 && (
              <span className="inline-flex items-center rounded-full text-[11px] text-slate-400">
                +{filing.tags.length - 4}
              </span>
            )}
          </div>

          <h3 className="text-[15.5px] sm:text-[16.5px] font-bold text-slate-900 leading-tight tracking-tight">
            {filing.subject}
          </h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Building2 size={11.5} />
              {filing.issuer}
            </span>
            {filing.counterparty && (
              <span className="inline-flex items-center gap-1">
                <Users size={11.5} />
                <span className="text-slate-600 font-medium">{filing.counterparty}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <ScanLine size={11.5} />
              PDF 原文 {filing.rawFile.size}
            </span>
          </div>

          {filing.keyFigures?.length > 0 && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
              {filing.keyFigures.slice(0, 4).map((kf, i) => {
                const toneClass =
                  kf.tone === 'positive'
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700 ring-emerald-50'
                    : kf.tone === 'negative'
                      ? 'bg-rose-50 border-rose-100 text-rose-700 ring-rose-50'
                      : 'bg-slate-50 border-slate-200 text-slate-700 ring-slate-100';
                const valTone =
                  kf.tone === 'positive'
                    ? 'text-emerald-700'
                    : kf.tone === 'negative'
                      ? 'text-rose-700'
                      : 'text-slate-900';
                return (
                  <div
                    key={i}
                    className={`rounded-2xl border ${toneClass} px-2.5 sm:px-3 py-2 sm:py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]`}
                  >
                    <div className="text-[10.5px] sm:text-[11px] font-medium opacity-80 leading-none mb-1.5 sm:mb-2 line-clamp-1">
                      {kf.label}
                    </div>
                    <div className={`text-[13px] sm:text-[14px] font-bold leading-none ${valTone} break-all tabular-nums line-clamp-2`}>
                      {kf.value}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div
            className={`mt-3 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-white to-white border border-indigo-100/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] px-3.5 sm:px-4 py-3 sm:py-3.5 overflow-hidden`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-xl bg-indigo-500/90 text-white shadow">
                <Sparkles size={12.5} />
              </span>
              <span className="text-[12px] sm:text-[12.5px] font-semibold text-indigo-800 tracking-tight">
                AI 结构化摘要（占位 · 待接入 LLM 自动抽取）
              </span>
            </div>
            <div className="text-[12.5px] sm:text-[13px] leading-relaxed text-slate-700 whitespace-pre-wrap">
              {expanded ? filing.summary : filing.summary.split('\n').slice(0, 3).join('\n')}
            </div>
            {(expanded || filing.summary.split('\n').length > 3) && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-2.5 inline-flex items-center gap-1 text-[12px] text-indigo-600 hover:text-indigo-700 font-semibold px-2 py-1 -mx-2 rounded-xl hover:bg-indigo-50 transition"
              >
                {expanded ? (
                  <>
                    收起 <ChevronUp size={13} />
                  </>
                ) : (
                  <>
                    展开完整摘要与要点 <ChevronDown size={13} />
                  </>
                )}
              </button>
            )}
          </div>

          <div className="mt-3.5 sm:mt-4 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 pt-3.5 border-t border-slate-100/80">
            <div className="flex flex-wrap items-center gap-2 min-h-[40px] sm:min-h-[44px]">
              {filing.status === 'ready' && onPublishAsPost && isIRPRAdmin && (
                <button
                  type="button"
                  onClick={() => onPublishAsPost(filing)}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[40px] sm:min-h-[44px] px-3 sm:px-3.5 rounded-xl text-[12.5px] sm:text-[13px] font-semibold bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-[0_10px_24px_-10px_rgba(99,102,241,0.65)] hover:shadow-[0_10px_28px_-8px_rgba(99,102,241,0.8)] hover:brightness-[1.03] active:brightness-[0.98] transition-all duration-150"
                >
                  <Megaphone size={14} />
                  一键发布为投资者关系动态
                </button>
              )}
              {filing.status === 'published' && filing.publishedPostId && onViewPublishedPost && (
                <button
                  type="button"
                  onClick={() => onViewPublishedPost(filing.publishedPostId!)}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[40px] sm:min-h-[44px] px-3 sm:px-3.5 rounded-xl text-[12.5px] sm:text-[13px] font-semibold text-sky-700 bg-sky-50 border border-sky-100 hover:bg-sky-100 hover:border-sky-200 transition"
                >
                  <Megaphone size={14} />
                  查看已发布动态
                </button>
              )}
              {filing.status === 'need_review' && isIRPRAdmin && (
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-1.5 min-h-[40px] sm:min-h-[44px] px-3 sm:px-3.5 rounded-xl text-[12.5px] sm:text-[13px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 hover:bg-amber-100 hover:border-amber-200 transition"
                >
                  <AlertTriangle size={14} />
                  打开人工复核
                </button>
              )}
              {filing.status === 'summarizing' && (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center gap-1.5 min-h-[40px] sm:min-h-[44px] px-3 sm:px-3.5 rounded-xl text-[12.5px] sm:text-[13px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 cursor-wait"
                >
                  <Loader2 size={14} className="animate-spin" />
                  AI 正在解析 PDF…
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto sm:justify-end">
              <button
                type="button"
                onClick={() => onCopyText?.(filing.summary, 'AI 摘要已复制')}
                className="inline-flex items-center justify-center gap-1 min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3 rounded-xl text-[12px] sm:text-[12.5px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-white hover:border-slate-300 hover:text-slate-800 transition shadow-sm"
              >
                <Copy size={13} />
                <span className="hidden sm:inline">复制摘要</span>
                <span className="sm:hidden">复制</span>
              </button>
              <button
                type="button"
                onClick={() => onDownloadFile?.({ name: filing.rawFile.name, url: filing.rawFile.url })}
                className="inline-flex items-center justify-center gap-1 min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3 rounded-xl text-[12px] sm:text-[12.5px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition shadow-sm"
                title={`下载原文：${filing.rawFile.name}`}
              >
                <Download size={13} />
                <span className="hidden sm:inline">下载 PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
