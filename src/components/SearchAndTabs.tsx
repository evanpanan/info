import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, SlidersHorizontal, Filter, Check, ChevronDown } from 'lucide-react';

export type FeedFilterOption = 'all' | 'pinned' | 'file' | 'webpage' | 'image' | 'video';
export type FeedSortOption = 'latest' | 'oldest' | 'hot';

interface Props {
  value: string;
  onChange: (v: string) => void;
  tab: 'all' | 'mine' | 'saved';
  onTab: (t: 'all' | 'mine' | 'saved') => void;
  savedCount: number;
  mineCount: number;
  totalCount: number;
  filterBy: FeedFilterOption;
  onFilterChange: (filter: FeedFilterOption) => void;
  sortBy: FeedSortOption;
  onSortChange: (sort: FeedSortOption) => void;
}

const TABS: { key: Props['tab']; label: string }[] = [
  { key: 'all', label: '全部动态' },
  { key: 'mine', label: '我的发布' },
  { key: 'saved', label: '我的收藏' },
];

const FILTER_OPTIONS: Array<{ key: FeedFilterOption; label: string; description: string }> = [
  { key: 'all', label: '全部内容', description: '显示所有动态内容' },
  { key: 'pinned', label: '仅看置顶', description: '只显示置顶公告和重点内容' },
  { key: 'file', label: '文档附件', description: '只显示含文档附件的动态' },
  { key: 'webpage', label: '链接分享', description: '只显示网页链接和新闻卡片' },
  { key: 'image', label: '图片动态', description: '只显示带图片的动态' },
  { key: 'video', label: '视频动态', description: '只显示包含视频嵌入的动态' },
];

const SORT_OPTIONS: Array<{ key: FeedSortOption; label: string; description: string }> = [
  { key: 'latest', label: '最新优先', description: '按发布时间从新到旧排列' },
  { key: 'oldest', label: '最早优先', description: '按发布时间从旧到新排列' },
  { key: 'hot', label: '互动优先', description: '按点赞、评论、转发热度排列' },
];

export default function SearchAndTabs({
  value,
  onChange,
  tab,
  onTab,
  savedCount,
  mineCount,
  totalCount,
  filterBy,
  onFilterChange,
  sortBy,
  onSortChange,
}: Props) {
  const counts = useMemo(
    () => ({ all: totalCount, mine: mineCount, saved: savedCount }),
    [totalCount, mineCount, savedCount]
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement | null>(null);
  const sortRef = useRef<HTMLDivElement | null>(null);
  const filterLabel = useMemo(
    () => FILTER_OPTIONS.find((item) => item.key === filterBy)?.label ?? '全部内容',
    [filterBy]
  );
  const sortLabel = useMemo(
    () => SORT_OPTIONS.find((item) => item.key === sortBy)?.label ?? '最新优先',
    [sortBy]
  );

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (filterRef.current && !filterRef.current.contains(target)) {
        setFilterOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(target)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="relative group">
            <Search
              size={15}
              strokeWidth={1.75}
              className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition"
            />
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="搜索作者、正文、标签或域名……"
              className="w-full h-10 sm:h-11 rounded-2xl border border-slate-200 bg-white pl-9 sm:pl-10 pr-14 sm:pr-10 text-[13.5px] sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 transition"
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11.5px] sm:text-xs text-slate-400 hover:text-slate-700 transition"
              >
                清除
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 justify-between sm:justify-end">
          <div ref={filterRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setFilterOpen((v) => !v);
                setSortOpen(false);
              }}
              className={`inline-flex items-center gap-1.5 h-10 sm:h-11 px-3.5 sm:px-4 rounded-2xl border bg-white text-[12px] sm:text-xs font-medium transition ${
                filterOpen || filterBy !== 'all'
                  ? 'text-sky-700 border-sky-200 bg-sky-50/80'
                  : 'text-slate-600 border-slate-200 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Filter size={13.5} strokeWidth={1.75} />
              <span className="hidden sm:inline">筛选</span>
              <span className="hidden lg:inline text-slate-400">·</span>
              <span className="hidden lg:inline">{filterLabel}</span>
              <ChevronDown size={13} strokeWidth={1.9} className={`transition ${filterOpen ? 'rotate-180' : ''}`} />
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-64 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 p-1.5">
                {FILTER_OPTIONS.map((option) => {
                  const active = option.key === filterBy;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        onFilterChange(option.key);
                        setFilterOpen(false);
                      }}
                      className={`w-full flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                        active ? 'bg-sky-50 text-sky-700' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-4 h-4 mt-0.5 flex items-center justify-center">
                        {active && <Check size={14} strokeWidth={2.25} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-medium">{option.label}</span>
                        <span className="block text-[11.5px] text-slate-400 mt-0.5">{option.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div ref={sortRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setSortOpen((v) => !v);
                setFilterOpen(false);
              }}
              className={`inline-flex items-center gap-1.5 h-10 sm:h-11 px-3.5 sm:px-4 rounded-2xl border bg-white text-[12px] sm:text-xs font-medium transition ${
                sortOpen || sortBy !== 'latest'
                  ? 'text-sky-700 border-sky-200 bg-sky-50/80'
                  : 'text-slate-600 border-slate-200 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <SlidersHorizontal size={13.5} strokeWidth={1.75} />
              <span className="hidden sm:inline">排序</span>
              <span className="hidden lg:inline text-slate-400">·</span>
              <span className="hidden lg:inline">{sortLabel}</span>
              <ChevronDown size={13} strokeWidth={1.9} className={`transition ${sortOpen ? 'rotate-180' : ''}`} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-64 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 p-1.5">
                {SORT_OPTIONS.map((option) => {
                  const active = option.key === sortBy;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        onSortChange(option.key);
                        setSortOpen(false);
                      }}
                      className={`w-full flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                        active ? 'bg-sky-50 text-sky-700' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-4 h-4 mt-0.5 flex items-center justify-center">
                        {active && <Check size={14} strokeWidth={2.25} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-medium">{option.label}</span>
                        <span className="block text-[11.5px] text-slate-400 mt-0.5">{option.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 sm:gap-4 border-b border-slate-200 overflow-hidden">
        <div className="flex items-center gap-0.5 sm:gap-1 min-w-0 overflow-x-auto -mx-4 px-4 sm:-mx-0 sm:px-0 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
          {TABS.map((t) => {
            const active = t.key === tab;
            const count = counts[t.key];
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => onTab(t.key)}
                className={`relative px-3 sm:px-4 h-9 sm:h-10 inline-flex items-center gap-1.5 sm:gap-2 text-[13.5px] sm:text-sm font-medium transition whitespace-nowrap ${
                  active ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`text-[10.5px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full font-medium ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
                {active && (
                  <span className="absolute left-2 sm:left-3 right-2 sm:right-3 -bottom-px h-0.5 rounded-full bg-slate-900" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
