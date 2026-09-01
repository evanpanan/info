import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Filter,
  SortAsc,
  AlertTriangle,
  Sparkles,
  FileText,
  X,
  CheckCircle2,
  ArrowRightLeft,
  CalendarDays,
  Users,
  Building2,
  FileText as FileIcon,
  Download,
  Copy,
  Megaphone,
  Loader2,
  ExternalLink,
  ScanLine,
  AlertCircle,
  Circle,
  Tag,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import SECFilingCard from './SECFilingCard';
import type {
  SECFilingSummary,
  SECFormType,
  SECFilingStatus,
} from '../types/irpr';

type FilingFilterFormType = 'ALL' | SECFormType;
type FilingFilterStatus = 'ALL' | SECFilingStatus | 'review_or_summarizing';
type FilingSort = 'latest_filed' | 'earliest_filed' | 'latest_ingested';

interface Props {
  className?: string;
  filings: SECFilingSummary[];
  filteredFilings: SECFilingSummary[];
  filingStats: {
    total: number;
    byForm: Record<string, number>;
    readyCount: number;
    reviewCount: number;
    sumCount: number;
  };
  selectedFiling: SECFilingSummary | null;
  onSelectFiling: (nextId: string) => void;
  summaryExpanded: boolean;
  onChangeSummaryExpanded: (next: boolean) => void;
  formFilter: FilingFilterFormType;
  onFormFilterChange: (next: FilingFilterFormType) => void;
  statusFilter: FilingFilterStatus;
  onStatusFilterChange: (next: FilingFilterStatus) => void;
  sort: FilingSort;
  onSortChange: (next: FilingSort) => void;
  search: string;
  onSearchChange: (next: string) => void;
  isIRPRAdmin?: boolean;
  onPublishAsPost?: (filing: SECFilingSummary) => void;
  onCopyText?: (text: string, toast: string) => void;
  onDownloadFile?: (file: { name: string; url: string }) => void;
  onViewPublishedPost?: (postId: string) => void;
}

const FORM_TABS: { id: FilingFilterFormType; label: string; short: string }[] = [
  { id: 'ALL', label: '全部表单', short: '全部' },
  { id: '8-K', label: '8-K 重大事件', short: '8-K' },
  { id: '10-Q', label: '10-Q 季度报告', short: '10-Q' },
  { id: '10-K', label: '10-K 年度报告', short: '10-K' },
  { id: '424B5', label: '424B5 增发/招股', short: '424B5' },
  { id: '13G', label: '13G 机构持仓', short: '13G' },
  { id: 'FORM3', label: 'FORM 3/4 持股变动', short: 'FORM 3/4' },
  { id: 'CORRESP', label: 'CORRESP 往来函件', short: 'CORRESP' },
];

const STATUS_TABS: { id: FilingFilterStatus; label: string }[] = [
  { id: 'ALL', label: '全部状态' },
  { id: 'ready', label: '已就绪' },
  { id: 'review_or_summarizing', label: '处理中/需复核' },
  { id: 'need_review', label: '需人工复核' },
  { id: 'summarizing', label: 'AI 总结中' },
  { id: 'published', label: '已发布动态' },
];

const FORM_TONE: Record<
  SECFormType,
  { label: string; badge: string; ring: string; iconBg: string; iconText: string; text: string; dot: string }
> = {
  '8-K': { label: '8-K', badge: 'bg-rose-50 text-rose-700 border border-rose-100', ring: 'ring-rose-100', iconBg: 'from-rose-500 to-rose-600', iconText: '8-K', text: 'text-rose-700', dot: 'bg-rose-500' },
  '10-Q': { label: '10-Q', badge: 'bg-sky-50 text-sky-700 border border-sky-100', ring: 'ring-sky-100', iconBg: 'from-sky-500 to-blue-600', iconText: '10-Q', text: 'text-sky-700', dot: 'bg-sky-500' },
  '10-K': { label: '10-K', badge: 'bg-indigo-50 text-indigo-700 border border-indigo-100', ring: 'ring-indigo-100', iconBg: 'from-indigo-500 to-indigo-600', iconText: '10-K', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  '13G': { label: '13G', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-100', ring: 'ring-emerald-100', iconBg: 'from-emerald-500 to-teal-600', iconText: '13G', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  '424B5': { label: '424B5', badge: 'bg-amber-50 text-amber-700 border border-amber-100', ring: 'ring-amber-100', iconBg: 'from-amber-500 to-orange-600', iconText: '424B5', text: 'text-amber-700', dot: 'bg-amber-500' },
  FORM3: { label: 'FORM 3', badge: 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100', ring: 'ring-fuchsia-100', iconBg: 'from-fuchsia-500 to-pink-600', iconText: 'F3', text: 'text-fuchsia-700', dot: 'bg-fuchsia-500' },
  FORM4: { label: 'FORM 4', badge: 'bg-teal-50 text-teal-700 border border-teal-100', ring: 'ring-teal-100', iconBg: 'from-teal-500 to-emerald-600', iconText: 'F4', text: 'text-teal-700', dot: 'bg-teal-500' },
  CORRESP: { label: 'CORRESP', badge: 'bg-slate-100 text-slate-700 border border-slate-200', ring: 'ring-slate-200', iconBg: 'from-slate-500 to-slate-600', iconText: 'CR', text: 'text-slate-700', dot: 'bg-slate-500' },
  OTHER: { label: '其他', badge: 'bg-slate-50 text-slate-600 border border-slate-200', ring: 'ring-slate-100', iconBg: 'from-slate-500 to-slate-600', iconText: 'OT', text: 'text-slate-600', dot: 'bg-slate-400' },
};

const STATUS_META: Record<
  SECFilingStatus,
  { label: string; className: string; chipBg: string; icon: typeof Sparkles }
> = {
  summarizing: { label: 'AI 总结中', className: 'text-indigo-700 bg-indigo-50/80 border border-indigo-100', chipBg: 'bg-indigo-500', icon: Loader2 },
  ready: { label: '已就绪', className: 'text-emerald-700 bg-emerald-50/80 border border-emerald-100', chipBg: 'bg-emerald-500', icon: CheckCircle2 },
  need_review: { label: '需人工复核', className: 'text-amber-700 bg-amber-50/80 border border-amber-100', chipBg: 'bg-amber-500', icon: AlertTriangle },
  published: { label: '已发布动态', className: 'text-sky-700 bg-sky-50/80 border border-sky-100', chipBg: 'bg-sky-500', icon: Megaphone },
};

function toneFor(form: SECFormType) {
  return FORM_TONE[form] ?? FORM_TONE.OTHER;
}

function formatFiledAt(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function SECFilingTimeline({
  className,
  filings,
  filteredFilings,
  filingStats,
  selectedFiling,
  onSelectFiling,
  summaryExpanded,
  onChangeSummaryExpanded,
  formFilter,
  onFormFilterChange,
  statusFilter,
  onStatusFilterChange,
  sort,
  onSortChange,
  search,
  onSearchChange,
  isIRPRAdmin = true,
  onPublishAsPost,
  onCopyText,
  onDownloadFile,
  onViewPublishedPost,
}: Props) {
  const selected = selectedFiling;
  const filtered = filteredFilings;
  const stats = filingStats;
  const selTone = selected ? toneFor(selected.formType) : null;
  const selStatus = selected ? STATUS_META[selected.status] : null;
  const SelStatusIcon = selStatus?.icon ?? Loader2;

  return (
    <section className={["flex flex-col gap-4 sm:gap-5 w-full", className ?? ''].filter(Boolean).join(' ')}>
      <div className="rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-[0_1px_0_rgba(15,23,42,0.04)] flex flex-col">
        <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border-b border-slate-100/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-[0_10px_24px_-10px_rgba(139,92,246,0.65)] shrink-0">
              <Sparkles size={17} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[16.5px] sm:text-[18px] font-bold tracking-tight text-slate-900 leading-tight flex items-center gap-2">
                上市公司公告 · AI 智能汇总专区
                <span className="inline-flex items-center gap-1 text-[10.5px] sm:text-[11px] font-semibold text-indigo-600 bg-indigo-50/70 border border-indigo-100/80 px-2 py-0.5 rounded-full">
                  <ArrowRightLeft size={10} /> 左详情 · 右列表
                </span>
              </h2>
              <p className="text-[12px] sm:text-[12.5px] text-slate-500 mt-0.5 leading-relaxed">
                自动抓取 SEC 8-K / 10-Q / 424B5 / 13G 等公告，AI 自动抽取要点与关键数字。点击右侧任意公告即可切换左侧详情。
              </p>
            </div>
          </div>
          <div className="relative flex-1 sm:flex-initial min-w-0 sm:min-w-[320px] sm:ml-auto max-w-full">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索事由 / 主文档名 / 表单类型 / Tag（如 8-K、10-Q）"
              className="w-full pl-9 pr-8 h-10 sm:h-11 rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-white focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none text-[12.5px] sm:text-[13px] text-slate-700 placeholder:text-slate-400 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                aria-label="清空搜索"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3.5 sm:py-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 border-b border-slate-100/80 bg-gradient-to-b from-slate-50/70 to-white">
          <div className="rounded-2xl bg-white border border-slate-200/80 px-3 sm:px-3.5 py-2.5 sm:py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-[11.5px] text-slate-500 font-medium">
              <FileText size={11.5} /> 累计收录
            </div>
            <div className="mt-1.5 text-[18px] sm:text-[20px] font-black tracking-tight text-slate-900 tabular-nums leading-none">
              {stats.total}
              <span className="ml-1 text-[11px] text-slate-400 font-semibold">份</span>
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 px-3 sm:px-3.5 py-2.5 sm:py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-[11.5px] text-emerald-700 font-medium">
              <CheckCircle2 size={11.5} /> AI 已就绪
            </div>
            <div className="mt-1.5 text-[18px] sm:text-[20px] font-black tracking-tight text-emerald-700 tabular-nums leading-none">
              {stats.readyCount}
              <span className="ml-1 text-[11px] text-emerald-600/70 font-semibold">份</span>
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 px-3 sm:px-3.5 py-2.5 sm:py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-[11.5px] text-amber-700 font-medium">
              <AlertTriangle size={11.5} /> 需人工复核
            </div>
            <div className="mt-1.5 text-[18px] sm:text-[20px] font-black tracking-tight text-amber-700 tabular-nums leading-none">
              {stats.reviewCount}
              <span className="ml-1 text-[11px] text-amber-600/70 font-semibold">条</span>
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-white border border-violet-100 px-3 sm:px-3.5 py-2.5 sm:py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-[11.5px] text-violet-700 font-medium">
              <Sparkles size={11.5} /> AI 处理中
            </div>
            <div className="mt-1.5 text-[18px] sm:text-[20px] font-black tracking-tight text-violet-700 tabular-nums leading-none">
              {stats.sumCount}
              <span className="ml-1 text-[11px] text-violet-600/70 font-semibold">条</span>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-b border-slate-100/80 space-y-2 sm:space-y-2.5">
          <div className="flex items-center gap-2 -mx-4 sm:-mx-0 overflow-x-auto px-4 sm:px-0 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
            {FORM_TABS.map((t) => {
              const active = formFilter === t.id;
              const count = t.id === 'ALL' ? stats.total : stats.byForm[t.id] ?? 0;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onFormFilterChange(t.id)}
                  className={`shrink-0 inline-flex items-center gap-1.5 min-h-[34px] sm:min-h-[36px] px-2.5 sm:px-3 rounded-xl text-[11.5px] sm:text-[12px] font-semibold border transition whitespace-nowrap ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900 shadow-[0_6px_16px_-6px_rgba(15,23,42,0.45)]'
                      : 'bg-white text-slate-600 border-slate-200 hover:text-slate-800 hover:border-slate-300'
                  }`}
                  title={t.label}
                >
                  <Filter size={11} />
                  <span className="sm:hidden">{t.short}</span>
                  <span className="hidden sm:inline">{t.label}</span>
                  <span
                    className={`inline-flex items-center justify-center rounded-lg px-1.5 h-[16px] text-[10.5px] font-bold tabular-nums ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {STATUS_TABS.map((t) => {
                const active = statusFilter === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onStatusFilterChange(t.id)}
                    className={`inline-flex items-center min-h-[32px] px-2.5 rounded-xl text-[11.5px] font-semibold transition ${
                      active
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 ring-2 ring-indigo-100'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11.5px] text-slate-500">
                <SortAsc size={11.5} /> 排序
              </span>
              <select
                value={sort}
                onChange={(e) => onSortChange(e.target.value as FilingSort)}
                className="h-9 rounded-xl border border-slate-200 bg-white text-[11.5px] sm:text-[12px] font-semibold text-slate-700 px-2.5 pr-7 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none"
              >
                <option value="latest_filed">最新提交优先</option>
                <option value="earliest_filed">最早提交优先</option>
                <option value="latest_ingested">最新上传优先</option>
              </select>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 sm:px-6 py-4 sm:py-5">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 sm:px-6 py-10 sm:py-12 text-center">
              <div className="mx-auto w-11 h-11 rounded-2xl bg-white text-slate-400 flex items-center justify-center border border-slate-200 mb-3 shadow-sm">
                <FileText size={18} />
              </div>
              <div className="text-[13.5px] sm:text-[14px] font-semibold text-slate-700 mb-1">
                没有匹配的公告
              </div>
              <div className="text-[12px] text-slate-500 leading-relaxed max-w-sm mx-auto">
                试试切换上方表单分类、状态筛选项，或清空搜索关键词。
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 sm:px-6 py-4 sm:py-5 flex-1 min-h-0 items-start">
            <div className="w-full min-w-0 space-y-4 sm:space-y-5">
              {!selected ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-4 sm:px-6 py-10 sm:py-12 text-center">
                  <div className="mx-auto w-11 h-11 rounded-2xl bg-white text-slate-400 flex items-center justify-center border border-slate-200 mb-3 shadow-sm">
                    <FileText size={18} />
                  </div>
                  <div className="text-[13.5px] sm:text-[14px] font-semibold text-slate-700 mb-1">
                    从右侧选择一条公告查看详情
                  </div>
                </div>
              ) : (
                <article
                  id={`sec-filing-${selected.id}`}
                  className={`rounded-3xl border ${selTone ? `ring-1 ${selTone.ring} border-slate-200/80` : 'border-slate-200/80'} bg-white shadow-[0_2px_0_rgba(15,23,42,0.03),0_22px_60px_-30px_rgba(15,23,42,0.2)] overflow-hidden`}
                >
                  <div
                    className={`h-1.5 sm:h-2 w-full bg-gradient-to-r ${selTone?.iconBg ?? 'from-slate-400 to-slate-500'}`}
                  />
                  <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col lg:flex-row lg:items-start gap-4 sm:gap-5 border-b border-slate-100/80">
                    <div className="flex lg:flex-col items-start lg:items-center gap-3 lg:gap-2 w-full lg:w-[96px] shrink-0">
                      <div
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${selTone?.iconBg ?? 'from-slate-500 to-slate-600'} text-white shadow-[0_10px_26px_-10px_rgba(15,23,42,0.4)] flex items-center justify-center font-black tracking-tight text-[13px] sm:text-[15px]`}
                      >
                        {selTone?.iconText ?? 'OT'}
                      </div>
                      <div className="lg:mt-1 flex lg:flex-col gap-1.5 items-start lg:items-center">
                        <div
                          className={`inline-flex items-center px-2 py-0.5 rounded-xl text-[11px] sm:text-[11.5px] font-bold ${selTone?.badge ?? 'bg-slate-50 text-slate-700 border border-slate-200'}`}
                        >
                          <FileText size={10.5} className="mr-1" />
                          {selTone?.label ?? '其他'}
                        </div>
                        <div className="inline-flex items-center gap-1 text-[11.5px] text-slate-500 tabular-nums">
                          <CalendarDays size={11} />
                          {formatFiledAt(selected.filedAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] sm:text-[11.5px] font-semibold ${selStatus?.className ?? 'text-slate-700 bg-slate-50 border border-slate-200'}`}>
                          <SelStatusIcon
                            size={11}
                            className={selected.status === 'summarizing' ? 'animate-spin' : ''}
                          />
                          {selStatus?.label ?? '未知状态'}
                        </span>
                        {selected.aiRisk === 'high' ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                            <ShieldAlert size={10.5} /> 高风险提示
                          </span>
                        ) : selected.aiRisk === 'medium' ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                            <AlertTriangle size={10.5} /> 中风险复核
                          </span>
                        ) : null}
                        {selected.tags.slice(0, 5).map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200/80 px-2 py-0.5 text-[11px] font-medium"
                          >
                            <Tag size={9.5} /> {t}
                          </span>
                        ))}
                        {selected.tags.length > 5 && (
                          <span className="inline-flex items-center rounded-full text-[11px] text-slate-400 font-medium">
                            +{selected.tags.length - 5}
                          </span>
                        )}
                      </div>
                      <h3 className="text-[16px] sm:text-[17.5px] font-black tracking-tight text-slate-900 leading-tight">
                        {selected.subject}
                      </h3>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 text-[11.5px] sm:text-[12px]">
                        <div className="inline-flex items-center gap-1.5 text-slate-600 bg-slate-50/70 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                          <Building2 size={11} />
                          <span className="text-slate-500 mr-0.5">发行人</span>
                          <span className="font-semibold text-slate-800 truncate">{selected.issuer}</span>
                        </div>
                        {selected.counterparty ? (
                          <div className="inline-flex items-center gap-1.5 text-slate-600 bg-slate-50/70 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                            <Users size={11} />
                            <span className="text-slate-500 mr-0.5">对方</span>
                            <span className="font-semibold text-slate-800 truncate">{selected.counterparty}</span>
                          </div>
                        ) : null}
                        <div className="inline-flex items-center gap-1.5 text-slate-600 bg-slate-50/70 border border-slate-200/80 rounded-xl px-2.5 py-1.5 tabular-nums">
                          <ScanLine size={11} />
                          <span className="text-slate-500 mr-0.5">原文</span>
                          <span className="font-semibold text-slate-800 truncate">
                            {selected.rawFile.name || '—'}
                            {selected.rawFile.size ? ` · ${selected.rawFile.size}` : ''}
                          </span>
                        </div>
                        <div className="inline-flex items-center gap-1.5 text-slate-600 bg-slate-50/70 border border-slate-200/80 rounded-xl px-2.5 py-1.5 sm:col-span-2 lg:col-span-1 tabular-nums">
                          <Circle
                            size={8}
                            className={`${selTone?.dot ?? 'bg-slate-400'} fill-current`}
                            strokeWidth={0}
                          />
                          <span className="text-slate-500 mr-0.5">接入号</span>
                          <span className="font-mono font-semibold text-slate-800 truncate">{selected.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selected.keyPoints?.length > 0 && (
                    <div className="px-4 sm:px-6 py-4 sm:py-4.5 border-b border-slate-100/80 bg-gradient-to-b from-slate-50/40 via-white to-white">
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-xl bg-emerald-500/90 text-white shadow">
                          <TrendingUp size={12} />
                        </span>
                        <div className="text-[12px] sm:text-[12.5px] font-semibold text-emerald-800 tracking-tight">
                          一句话简介 · 明确这份公告是什么
                        </div>
                      </div>
                      <ul className="space-y-1.5">
                        {selected.keyPoints.slice(0, 5).map((kp, i) => (
                          <li
                            key={i}
                            className="text-[12.5px] sm:text-[13px] leading-relaxed text-slate-700 pl-4 relative before:content-[''] before:absolute before:left-[6px] before:top-[0.6em] before:w-1.5 before:h-1.5 before:rounded-full before:bg-emerald-400"
                          >
                            {kp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="px-4 sm:px-6 py-4 sm:py-4.5 border-b border-slate-100/80">
                    <div className="rounded-2xl bg-gradient-to-br from-indigo-50/60 via-white to-white border border-indigo-100/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] px-3.5 sm:px-4 py-3 sm:py-3.5 overflow-hidden">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-xl bg-indigo-500/90 text-white shadow">
                            <Sparkles size={12.5} />
                          </span>
                          <span className="text-[12px] sm:text-[12.5px] font-semibold text-indigo-800 tracking-tight">
                            {selected.status === 'summarizing' ? 'AI 正在解析 PDF 生成结构化摘要' : 'AI 结构化摘要（占位 · 待接入 LLM 自动抽取 PDF 正文）'}
                          </span>
                        </div>
                        {(selected.summary.split('\n').length > 3 || selected.summary.length > 260) && (
                          <button
                            type="button"
                            onClick={() => onChangeSummaryExpanded(!summaryExpanded)}
                            className="shrink-0 inline-flex items-center gap-1 text-[11px] sm:text-[11.5px] text-indigo-600 hover:text-indigo-700 font-semibold px-2 py-1 rounded-xl hover:bg-indigo-50 transition"
                          >
                            {summaryExpanded ? '收起' : '展开全文'}
                          </button>
                        )}
                      </div>
                      <div className={`text-[12.5px] sm:text-[13px] leading-relaxed text-slate-700 whitespace-pre-wrap ${summaryExpanded ? '' : 'line-clamp-4'}`}>
                        {selected.summary}
                      </div>
                    </div>
                  </div>

                  {selected.keyFigures?.length > 0 && (
                    <div className="px-4 sm:px-6 py-4 sm:py-4.5 border-b border-slate-100/80">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                        {selected.keyFigures.slice(0, 4).map((kf, i) => {
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
                    </div>
                  )}

                  <div className="px-4 sm:px-6 py-4 sm:py-4.5 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex flex-wrap items-center gap-2 min-h-[40px] sm:min-h-[44px]">
                      {selected.status === 'ready' && onPublishAsPost && isIRPRAdmin && (
                        <button
                          type="button"
                          onClick={() => onPublishAsPost(selected)}
                          className="inline-flex items-center justify-center gap-1.5 min-h-[40px] sm:min-h-[44px] px-3 sm:px-3.5 rounded-xl text-[12.5px] sm:text-[13px] font-semibold bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-[0_10px_24px_-10px_rgba(99,102,241,0.65)] hover:shadow-[0_10px_28px_-8px_rgba(99,102,241,0.8)] hover:brightness-[1.03] active:brightness-[0.98] transition-all duration-150"
                        >
                          <Megaphone size={14} />
                          一键发布为投资者关系动态
                        </button>
                      )}
                      {selected.status === 'published' && selected.publishedPostId && onViewPublishedPost && (
                        <button
                          type="button"
                          onClick={() => onViewPublishedPost(selected.publishedPostId!)}
                          className="inline-flex items-center justify-center gap-1.5 min-h-[40px] sm:min-h-[44px] px-3 sm:px-3.5 rounded-xl text-[12.5px] sm:text-[13px] font-semibold text-sky-700 bg-sky-50 border border-sky-100 hover:bg-sky-100 hover:border-sky-200 transition"
                        >
                          <Megaphone size={14} />
                          查看已发布动态
                        </button>
                      )}
                      {selected.status === 'need_review' && isIRPRAdmin && (
                        <div className="inline-flex items-center gap-1.5 min-h-[40px] sm:min-h-[44px] px-3 sm:px-3.5 rounded-xl text-[12.5px] sm:text-[13px] font-semibold text-amber-700 bg-amber-50 border border-amber-100">
                          <AlertCircle size={14} />
                          需后端 LLM 解析 PDF 后生成结构化内容
                        </div>
                      )}
                      {selected.status === 'summarizing' && (
                        <div className="inline-flex items-center gap-1.5 min-h-[40px] sm:min-h-[44px] px-3 sm:px-3.5 rounded-xl text-[12.5px] sm:text-[13px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100">
                          <Loader2 size={14} className="animate-spin" />
                          AI 正在解析 PDF 原文…预计 30–120 秒
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto sm:justify-end">
                      {selected.secLink && (
                        <a
                          href={selected.secLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1 min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3 rounded-xl text-[12px] sm:text-[12.5px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition shadow-sm"
                          title={`在 SEC EDGAR 查看：${selected.id}`}
                        >
                          <ExternalLink size={13} />
                          <span className="hidden sm:inline">查看 SEC 原文页</span>
                          <span className="sm:hidden">SEC 原文</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => onCopyText?.(
                          [
                            `【${selected.formType}】${selected.subject}`,
                            `提交日期：${formatFiledAt(selected.filedAt)}`,
                            selected.keyPoints?.[0] ? `简介：${selected.keyPoints[0]}` : '',
                            `摘要：${selected.summary}`,
                            selected.secLink ? `SEC 链接：${selected.secLink}` : '',
                          ].filter(Boolean).join('\n'),
                          '公告详情已复制',
                        )}
                        className="inline-flex items-center justify-center gap-1 min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3 rounded-xl text-[12px] sm:text-[12.5px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-white hover:border-slate-300 hover:text-slate-800 transition shadow-sm"
                      >
                        <Copy size={13} />
                        <span className="hidden sm:inline">复制全文</span>
                        <span className="sm:hidden">复制</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDownloadFile?.({ name: selected.rawFile.name, url: selected.rawFile.url })}
                        className="inline-flex items-center justify-center gap-1 min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3 rounded-xl text-[12px] sm:text-[12.5px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition shadow-sm"
                        title={`下载原文：${selected.rawFile.name}`}
                      >
                        <Download size={13} />
                        <span className="hidden sm:inline">下载 PDF 原文</span>
                        <span className="sm:hidden">下载</span>
                        {selected.rawFile?.size ? <span className="text-[10.5px] text-slate-400 ml-0.5 tabular-nums">{selected.rawFile.size}</span> : null}
                      </button>
                    </div>
                  </div>
                </article>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ========== 右侧 4 栏公告列表组件 ==========
interface ListPanelProps {
  className?: string;
  filteredFilings: SECFilingSummary[];
  selectedFiling: SECFilingSummary | null;
  onSelectFiling: (nextId: string) => void;
  onChangeSummaryExpanded?: (next: boolean) => void;
  isIRPRAdmin?: boolean;
}

export function SECFilingListPanel({
  className,
  filteredFilings,
  selectedFiling,
  onSelectFiling,
  onChangeSummaryExpanded,
  isIRPRAdmin = true,
}: ListPanelProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const selected = selectedFiling;
  const filtered = filteredFilings;
  return (
    <div
      className={[
        'rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/60 via-white to-white overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] w-full',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-100/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-900 text-white shadow shrink-0">
            <FileIcon size={13} />
          </span>
          <div className="min-w-0">
            <div className="text-[12px] sm:text-[12.5px] font-bold text-slate-900 leading-none">
              公告列表
              <span className="ml-1.5 text-[10.5px] sm:text-[11px] font-semibold text-slate-400 tabular-nums">
                {filtered.length} 条
              </span>
            </div>
            <div className="mt-1 text-[10.5px] sm:text-[11px] text-slate-500 leading-none">
              点击任意一条，左侧显示详细内容
            </div>
          </div>
        </div>
        {selected && (
          <div className="shrink-0 inline-flex items-center gap-1 text-[10.5px] sm:text-[11px] font-semibold text-indigo-600 bg-indigo-50/80 border border-indigo-100 px-2 py-1 rounded-full">
            <Circle size={8} className="fill-current bg-indigo-500" strokeWidth={0} />
            {selected.formType} · {formatFiledAt(selected.filedAt)}
          </div>
        )}
      </div>
      <div
        ref={listRef}
        className="max-h-[calc(100vh-320px)] overflow-y-auto px-2.5 sm:px-3 py-2.5 sm:py-3 space-y-2 sm:space-y-2.5"
      >
        {filtered.map((f) => (
          <SECFilingCard
            key={f.id}
            filing={f}
            listItem
            selected={selected?.id === f.id}
            onClick={() => {
              onSelectFiling(f.id);
              onChangeSummaryExpanded?.(false);
              const el = document.getElementById(`sec-filing-${f.id}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            isIRPRAdmin={isIRPRAdmin}
          />
        ))}
        {filtered.length === 0 && (
          <div className="px-3 py-8 text-center">
            <div className="text-[12px] text-slate-400">当前筛选项下没有公告</div>
          </div>
        )}
      </div>
    </div>
  );
}
