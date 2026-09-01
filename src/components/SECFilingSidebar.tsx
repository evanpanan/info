import { useMemo } from 'react';
import {
  FileText,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  FileText as FileIcon,
  Circle,
} from 'lucide-react';
import type { SECFilingSummary, SECFormType } from '../types/irpr';

interface Props {
  className?: string;
  filings: SECFilingSummary[];
  loading?: boolean;
  errorMsg?: string | null;
  onRetry?: () => void;
  isIRPRAdmin?: boolean;
  onOpenAll: () => void;
  onOpenFiling?: (filing: SECFilingSummary) => void;
}

const FORM_TONE: Record<SECFormType, { chip: string; text: string; dot: string }> = {
  '8-K': { chip: 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-[0_6px_18px_-6px_rgba(244,63,94,0.55)]', text: 'text-rose-700', dot: 'bg-rose-500' },
  '10-Q': { chip: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-[0_6px_18px_-6px_rgba(59,130,246,0.55)]', text: 'text-sky-700', dot: 'bg-sky-500' },
  '10-K': { chip: 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-[0_6px_18px_-6px_rgba(99,102,241,0.55)]', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  '13G': { chip: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-[0_6px_18px_-6px_rgba(16,185,129,0.55)]', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  '424B5': { chip: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-[0_6px_18px_-6px_rgba(245,158,11,0.55)]', text: 'text-amber-700', dot: 'bg-amber-500' },
  'FORM3': { chip: 'bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white shadow-[0_6px_18px_-6px_rgba(217,70,239,0.55)]', text: 'text-fuchsia-700', dot: 'bg-fuchsia-500' },
  'FORM4': { chip: 'bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-[0_6px_18px_-6px_rgba(236,72,153,0.55)]', text: 'text-pink-700', dot: 'bg-pink-500' },
  'CORRESP': { chip: 'bg-gradient-to-br from-slate-600 to-slate-700 text-white shadow-[0_6px_18px_-6px_rgba(71,85,105,0.55)]', text: 'text-slate-700', dot: 'bg-slate-500' },
  'OTHER': { chip: 'bg-gradient-to-br from-slate-500 to-slate-600 text-white shadow-[0_6px_18px_-6px_rgba(100,116,139,0.55)]', text: 'text-slate-700', dot: 'bg-slate-400' },
};

function toneFor(form: SECFormType) {
  return FORM_TONE[form] ?? FORM_TONE.OTHER;
}

export default function SECFilingSidebar({
  className,
  filings,
  loading,
  errorMsg,
  onRetry,
  isIRPRAdmin,
  onOpenAll,
  onOpenFiling,
}: Props) {
  void isIRPRAdmin;
  const latest = useMemo(
    () =>
      filings.length > 0
        ? filings
            .slice()
            .sort((a, b) => +new Date(b.filedAt) - +new Date(a.filedAt))[0]
        : null,
    [filings],
  );
  const byStatus = useMemo(() => {
    let need = 0;
    let sum = 0;
    for (const f of filings) {
      if (f.status === 'need_review') need += 1;
      if (f.status === 'summarizing') sum += 1;
    }
    return { need, sum };
  }, [filings]);

  const tone = latest ? toneFor(latest.formType) : null;

  return (
    <aside
      className={[
        'rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-[0_1px_0_rgba(15,23,42,0.04)]',
        'flex flex-col',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100/80 flex items-center justify-between gap-3 bg-gradient-to-b from-indigo-50/60 via-white to-white shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-[0_8px_20px_-8px_rgba(139,92,246,0.65)] shrink-0">
            <Sparkles size={14} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-[13.5px] sm:text-[14px] font-bold tracking-tight text-slate-900 leading-none">
                最新 SEC 公告
              </h3>
              <span className="inline-flex items-center justify-center h-[18px] px-1.5 rounded-lg bg-slate-900 text-white text-[10.5px] font-bold tabular-nums">
                {filings.length}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 leading-none">
              <span className="inline-flex items-center gap-1">
                <FileText size={10.5} />
                AI 自动抓取 &amp; 汇总
              </span>
              {byStatus.need > 0 && (
                <span className="inline-flex items-center gap-1 text-amber-700">
                  <AlertTriangle size={10.5} />
                  {byStatus.need} 条待复核
                </span>
              )}
              {byStatus.sum > 0 && (
                <span className="inline-flex items-center gap-1 text-indigo-700">
                  <Loader2 size={10.5} className="animate-spin" />
                  {byStatus.sum} 条处理中
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenAll}
          title="打开公告汇总专区"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl inline-flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition shrink-0"
        >
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="p-3 sm:p-3.5 flex-1 min-h-0 overflow-hidden">
        {loading && filings.length === 0 ? (
          <div className="h-full min-h-[80px] rounded-2xl border border-dashed border-slate-200/90 flex items-center justify-center px-3 py-4 flex-col gap-2 text-center bg-gradient-to-b from-slate-50/60 to-white">
            <div className="flex items-center gap-2 text-[12px] text-indigo-600 font-semibold">
              <Loader2 size={14} className="animate-spin" /> SEC EDGAR 正在抓取 XMax 最新公告…
            </div>
          </div>
        ) : errorMsg && filings.length === 0 ? (
          <div className="h-full min-h-[80px] rounded-2xl border border-dashed border-rose-200/80 flex items-center justify-center px-3 py-4 flex-col gap-2 text-center bg-gradient-to-b from-rose-50/50 to-white">
            <div className="flex items-center gap-1.5 text-[12px] text-rose-600 font-semibold">
              <AlertCircle size={14} /> SEC 抓取失败
            </div>
            <div className="text-[11px] text-slate-500 max-w-[260px] break-all leading-snug">
              {String(errorMsg).slice(0, 140)}
              {String(errorMsg).length > 140 ? '…' : ''}
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-0.5 inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[32px] rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-[11px] font-semibold hover:bg-rose-100 transition"
              >
                <RefreshCw size={11} /> 立即重试
              </button>
            )}
          </div>
        ) : !latest ? (
          <div className="h-full min-h-[80px] rounded-2xl border border-dashed border-slate-200/90 flex items-center justify-center text-[11.5px] text-slate-400 font-medium bg-gradient-to-b from-slate-50/60 to-white">
            暂无 SEC 公告
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (onOpenFiling) onOpenFiling(latest);
              else onOpenAll();
            }}
            className="w-full h-full rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/60 hover:border-indigo-200 hover:shadow-[0_14px_40px_-18px_rgba(99,102,241,0.35)] transition text-left p-3 sm:p-3.5 flex items-start gap-3 group"
          >
            <div className="shrink-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white text-[12px] sm:text-[12.5px] font-black tracking-wide shadow-md leading-none">
                {tone ? (
                  <span
                    className={[
                      'w-full h-full rounded-2xl flex items-center justify-center',
                      tone.chip,
                    ].join(' ')}
                  >
                    {latest.formType === 'OTHER' ? 'OT' : latest.formType.replace(/^FORM/, 'F').slice(0, 3)}
                  </span>
                ) : (
                  <span className="w-full h-full rounded-2xl flex items-center justify-center bg-slate-500">
                    OT
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider ${tone ? tone.text : 'text-slate-600'}`}>
                  <Circle size={8} className={tone ? `fill-current ${tone.dot}` : 'fill-current bg-slate-400'} strokeWidth={0} />
                  {latest.formType}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 tabular-nums shrink-0">
                  <FileIcon size={10.5} /> {latest.filedAt}
                </span>
                <span className="inline-flex items-center gap-1 text-[10.5px] text-slate-400 tabular-nums shrink-0">
                  {latest.status === 'summarizing' ? (
                    <>
                      <Loader2 size={10} className="animate-spin text-indigo-500" /> AI 总结中
                    </>
                  ) : latest.status === 'need_review' ? (
                    <>
                      <AlertTriangle size={10} className="text-amber-500" /> 待复核
                    </>
                  ) : (
                    <>
                      <ExternalLink size={10} className="opacity-70" /> AI 就绪
                    </>
                  )}
                </span>
              </div>
              <div className="text-[12.5px] sm:text-[13px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-indigo-700 transition">
                {latest.subject}
              </div>
              <div className="text-[11.5px] text-slate-500 leading-snug line-clamp-2">
                {(latest.keyPoints && latest.keyPoints[0]) || latest.summary}
              </div>
              {latest.issuer && (
                <div className="mt-0.5 inline-flex items-center gap-1.5 text-[10.5px] sm:text-[11px] text-slate-400 shrink-0">
                  <FileText size={10} /> {latest.issuer}
                  {latest.rawFile?.size ? <span className="tabular-nums">· {latest.rawFile.size}</span> : null}
                </div>
              )}
            </div>
          </button>
        )}
      </div>

      <div className="px-3 sm:px-3.5 pb-3 sm:pb-3.5 shrink-0">
        <button
          type="button"
          onClick={onOpenAll}
          className="w-full inline-flex items-center justify-center gap-1.5 min-h-[40px] sm:min-h-[42px] px-3 rounded-2xl text-[12.5px] sm:text-[13px] font-semibold text-white bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[0_10px_24px_-10px_rgba(99,102,241,0.65)] hover:brightness-[1.03] active:brightness-[0.98] transition"
        >
          <ExternalLink size={13} />
          去公告专区查看全部
        </button>
      </div>
    </aside>
  );
}
