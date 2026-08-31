import { useEffect, useMemo, useRef, useState } from 'react';
import type { IRPRCalendarEvent, CalendarTagDef } from '../types/irpr';
import type { CalendarTagTone } from '../types/irpr';
import {
  CalendarDays,
  CalendarPlus,
  MapPin,
  Timer,
  ExternalLink,
  Building2,
  Plus,
  X,
  MoreHorizontal,
  PencilLine,
  Trash2,
  CheckCircle2,
  Tags,
  Star,
  ChevronDown,
  ChevronUp,
  ArchiveRestore,
} from 'lucide-react';

interface Props {
  events: IRPRCalendarEvent[];
  tags: CalendarTagDef[];
  isIRPRAdmin?: boolean;
  onAdd?: (event: Omit<IRPRCalendarEvent, 'id'>) => void;
  onUpdate?: (event: IRPRCalendarEvent) => void;
  onDelete?: (eventId: string) => void;
  onToggleImportant?: (eventId: string) => void;
  onAddTag?: (tag: Omit<CalendarTagDef, 'id'>) => void;
  onUpdateTag?: (tag: CalendarTagDef) => void;
  onDeleteTag?: (tagId: string) => void;
}

const TONE_PRESETS: Array<{
  tone: CalendarTagTone;
  name: string;
  pill: string;
  badge: string;
  swatch: string;
}> = [
  {
    tone: 'rose',
    name: '玫红',
    pill: 'bg-rose-50 text-rose-700 border-rose-100',
    badge: 'bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-sm shadow-rose-200/50',
    swatch: 'bg-gradient-to-br from-rose-500 to-pink-500',
  },
  {
    tone: 'indigo',
    name: '靛蓝',
    pill: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    badge: 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-200/50',
    swatch: 'bg-gradient-to-br from-indigo-500 to-violet-500',
  },
  {
    tone: 'emerald',
    name: '翠绿',
    pill: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    badge: 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm shadow-emerald-200/50',
    swatch: 'bg-gradient-to-br from-emerald-500 to-teal-500',
  },
  {
    tone: 'amber',
    name: '琥珀',
    pill: 'bg-amber-50 text-amber-700 border-amber-100',
    badge: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-200/50',
    swatch: 'bg-gradient-to-br from-amber-500 to-orange-500',
  },
  {
    tone: 'slate',
    name: '石板灰',
    pill: 'bg-slate-50 text-slate-700 border-slate-200',
    badge: 'bg-gradient-to-br from-slate-500 to-slate-600 text-white shadow-sm shadow-slate-200/50',
    swatch: 'bg-gradient-to-br from-slate-500 to-slate-600',
  },
  {
    tone: 'sky',
    name: '天蓝',
    pill: 'bg-sky-50 text-sky-700 border-sky-100',
    badge: 'bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-sm shadow-sky-200/50',
    swatch: 'bg-gradient-to-br from-sky-500 to-cyan-500',
  },
  {
    tone: 'violet',
    name: '紫罗兰',
    pill: 'bg-violet-50 text-violet-700 border-violet-100',
    badge: 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm shadow-violet-200/50',
    swatch: 'bg-gradient-to-br from-violet-500 to-purple-600',
  },
  {
    tone: 'teal',
    name: '青绿',
    pill: 'bg-teal-50 text-teal-700 border-teal-100',
    badge: 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-sm shadow-teal-200/50',
    swatch: 'bg-gradient-to-br from-teal-500 to-emerald-600',
  },
];

function getToneStyles(tone?: CalendarTagTone) {
  const found = TONE_PRESETS.find((t) => t.tone === tone);
  if (found) return found;
  return TONE_PRESETS[4];
}

function hashString(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function toICalLocal(date: Date) {
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

function buildICS(event: IRPRCalendarEvent): string {
  const start = new Date(event.startAt);
  const end = new Date(start.getTime() + 60 * 60 * 1000 * 2);
  const uid = `${hashString(event.id + event.startAt)}@xmax-irpr`;
  const descriptionParts: string[] = [];
  if (event.organizer) descriptionParts.push(`主办：${event.organizer}`);
  if (event.timeLabel) descriptionParts.push(`时间：${event.timeLabel}`);
  if (event.joinLink) descriptionParts.push(`线上接入：${event.joinLink}`);
  const description = descriptionParts.join('\\n').replace(/,/g, '\\,');
  const location = (event.location ?? '').replace(/,/g, '\\,');
  const summary = event.title.replace(/,/g, '\\,');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//XMax IRPR Calendar//MuskZoom//CN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toICalLocal(new Date())}`,
    `DTSTART:${toICalLocal(start)}`,
    `DTEND:${toICalLocal(end)}`,
    `SUMMARY:${summary}`,
    location ? `LOCATION:${location}` : '',
    description ? `DESCRIPTION:${description}` : '',
    event.joinLink ? `URL:${event.joinLink}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

function formatDateBadge(iso: string) {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return { month: `${month}月`, day: `${day}` };
}

function isoToLocalInput(iso: string) {
  const d = new Date(iso);
  const tzOffset = d.getTimezoneOffset();
  const shifted = new Date(d.getTime() - tzOffset * 60 * 1000);
  return shifted.toISOString().slice(0, 16);
}

function localInputToIso(value: string) {
  if (!value) return '';
  const d = new Date(value.replace('T', ' '));
  if (isNaN(d.getTime())) return '';
  return d.toISOString();
}

const EMPTY_FORM: Omit<IRPRCalendarEvent, 'id'> = {
  title: '',
  startAt: '',
  timeLabel: '',
  timezone: 'Asia/Shanghai',
  location: '',
  tag: 'general',
  joinLink: '',
  organizer: '',
};

interface TagFormState {
  label: string;
  tone: CalendarTagTone;
}

const EMPTY_TAG_FORM: TagFormState = {
  label: '',
  tone: 'indigo',
};

export default function IRPRCalendarCard({
  events,
  tags,
  isIRPRAdmin,
  onAdd,
  onUpdate,
  onDelete,
  onToggleImportant,
  onAddTag,
  onUpdateTag,
  onDeleteTag,
}: Props) {
  const tagMap = useMemo(() => {
    const map = new Map<string, CalendarTagDef>();
    tags.forEach((t) => map.set(t.id, t));
    return map;
  }, [tags]);

  const defaultTagId = tags[0]?.id ?? 'general';

  const list = useMemo(() => {
    const now = Date.now();
    return [...events]
      .filter((e) => new Date(e.startAt).getTime() + 60 * 60 * 1000 * 24 >= now)
      .sort((a, b) => {
        const aW = a.important ? 0 : 1;
        const bW = b.important ? 0 : 1;
        if (aW !== bW) return aW - bW;
        return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
      });
  }, [events]);

  const pastList = useMemo(() => {
    const now = Date.now();
    return [...events]
      .filter((e) => new Date(e.startAt).getTime() + 60 * 60 * 1000 * 24 < now)
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }, [events]);

  type PeriodTab = 'upcoming' | 'past';
  const [periodTab, setPeriodTab] = useState<PeriodTab>('upcoming');
  const activeList = periodTab === 'upcoming' ? list : pastList;
  const tabCountUpcoming = list.length;
  const tabCountPast = pastList.length;

  const DEFAULT_VISIBLE_COUNT = 3;
  const [expanded, setExpanded] = useState(false);
  const visibleList = expanded ? activeList : activeList.slice(0, DEFAULT_VISIBLE_COUNT);
  const showToggle = activeList.length > DEFAULT_VISIBLE_COUNT;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IRPRCalendarEvent | null>(null);
  const [form, setForm] = useState<Omit<IRPRCalendarEvent, 'id'>>(EMPTY_FORM);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagEditing, setTagEditing] = useState<CalendarTagDef | null>(null);
  const [tagForm, setTagForm] = useState<TagFormState>(EMPTY_TAG_FORM);
  const [openTagMenuId, setOpenTagMenuId] = useState<string | null>(null);
  const tagMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openMenuId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenuId]);

  useEffect(() => {
    if (!openTagMenuId) return;
    const handler = (e: MouseEvent) => {
      if (tagMenuRef.current && !tagMenuRef.current.contains(e.target as Node)) setOpenTagMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openTagMenuId]);

  const openAdd = () => {
    if (!isIRPRAdmin) return;
    setEditing(null);
    setForm({ ...EMPTY_FORM, tag: defaultTagId });
    setModalOpen(true);
  };

  const openEdit = (event: IRPRCalendarEvent) => {
    if (!isIRPRAdmin) return;
    setEditing(event);
    setForm({
      title: event.title,
      startAt: event.startAt,
      timeLabel: event.timeLabel ?? '',
      timezone: event.timezone ?? 'Asia/Shanghai',
      location: event.location ?? '',
      tag: event.tag ?? defaultTagId,
      joinLink: event.joinLink ?? '',
      organizer: event.organizer ?? '',
    });
    setModalOpen(true);
    setOpenMenuId(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm({ ...EMPTY_FORM, tag: defaultTagId });
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    const startAt = form.startAt ? localInputToIso(form.startAt) : '';
    if (!title || !startAt) return;
    const finalTag = form.tag && tagMap.has(form.tag) ? form.tag : defaultTagId;
    const payload: Omit<IRPRCalendarEvent, 'id'> = {
      title,
      startAt,
      timeLabel: (form.timeLabel ?? '').trim() || undefined,
      timezone: (form.timezone ?? '').trim() || undefined,
      location: (form.location ?? '').trim() || undefined,
      tag: finalTag,
      joinLink: (form.joinLink ?? '').trim() || undefined,
      organizer: (form.organizer ?? '').trim() || undefined,
    };
    if (editing) {
      onUpdate?.({ ...editing, ...payload });
    } else {
      onAdd?.(payload);
    }
    closeModal();
  };

  const confirmDelete = (event: IRPRCalendarEvent) => {
    if (!isIRPRAdmin) return;
    setOpenMenuId(null);
    onDelete?.(event.id);
  };

  const addToCalendar = (event: IRPRCalendarEvent) => {
    try {
      const ics = buildICS(event);
      const href = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
      const a = document.createElement('a');
      a.href = href;
      a.download = `xmax-${event.id}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      const notify = (window as any).__irprShowToast;
      if (typeof notify === 'function') notify('已生成日历文件，正在下载…', 'success');
    } catch {
      window.open(
        `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  };

  const openTagManager = () => {
    if (!isIRPRAdmin) return;
    setTagEditing(null);
    setTagForm(EMPTY_TAG_FORM);
    setTagModalOpen(true);
  };

  const openAddTag = () => {
    if (!isIRPRAdmin) return;
    setTagEditing(null);
    setTagForm(EMPTY_TAG_FORM);
  };

  const openEditTag = (tag: CalendarTagDef) => {
    if (!isIRPRAdmin) return;
    setTagEditing(tag);
    setTagForm({
      label: tag.label,
      tone: tag.tone,
    });
    setOpenTagMenuId(null);
  };

  const submitTagForm = (e: React.FormEvent) => {
    e.preventDefault();
    const label = tagForm.label.trim();
    if (!label) return;
    const payload = { label, tone: tagForm.tone };
    if (tagEditing) {
      onUpdateTag?.({ ...tagEditing, ...payload });
    } else {
      onAddTag?.(payload);
    }
    setTagEditing(null);
    setTagForm(EMPTY_TAG_FORM);
  };

  const cancelEditTag = () => {
    setTagEditing(null);
    setTagForm(EMPTY_TAG_FORM);
  };

  const closeTagModal = () => {
    setTagModalOpen(false);
    setTagEditing(null);
    setTagForm(EMPTY_TAG_FORM);
    setOpenTagMenuId(null);
  };

  const resolveTagVisual = (tagId?: string) => {
    const tag = tagId ? tagMap.get(tagId) : undefined;
    if (tag) {
      const style = getToneStyles(tag.tone);
      return { label: tag.label, pill: style.pill, badge: style.badge, tone: tag.tone };
    }
    const fallback = getToneStyles('slate');
    return { label: '未分类', pill: fallback.pill, badge: fallback.badge, tone: 'slate' as const };
  };

  return (
    <>
      <section className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-100/60 overflow-hidden">
        <div className="px-4 sm:px-5 pt-4 sm:pt-4.5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
              <CalendarDays size={18} strokeWidth={1.9} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[14.5px] font-bold text-slate-900 tracking-tight">日程</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                  重要日程
                </span>
              </div>
            </div>
          </div>
          {isIRPRAdmin && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={openTagManager}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11.5px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-700 transition-colors"
                title="管理活动分类"
              >
                <Tags size={12.5} strokeWidth={2} />
                <span className="hidden sm:inline">管理分类</span>
                <span className="sm:hidden">分类</span>
              </button>
              <button
                type="button"
                onClick={openAdd}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold text-white bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-sm shadow-indigo-200/50 transition-colors"
              >
                <Plus size={13} strokeWidth={2.1} />
                发布日程
              </button>
            </div>
          )}
        </div>

        <div className="px-4 sm:px-5 pb-4 sm:pb-4.5 mt-2 border-b border-slate-100">
          <div className="flex flex-row items-stretch gap-1 p-1 rounded-xl bg-slate-100/70 border border-slate-200/80 w-full">
            <button
              type="button"
              onClick={() => { setPeriodTab('upcoming'); setExpanded(false); }}
              className={`flex-1 inline-flex flex-row items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold transition-colors whitespace-nowrap min-w-0 ${
                periodTab === 'upcoming' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <CalendarDays size={12} strokeWidth={1.9} className="shrink-0" />
              <span className="shrink-0 truncate">即将开始</span>
              <span className={`ml-0.5 inline-flex items-center justify-center px-1.5 h-4 rounded-md text-[10px] font-black leading-none shrink-0 ${
                periodTab === 'upcoming' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200/70 text-slate-500'
              }`}>{tabCountUpcoming}</span>
            </button>
            <button
              type="button"
              onClick={() => { setPeriodTab('past'); setExpanded(false); }}
              className={`flex-1 inline-flex flex-row items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold transition-colors whitespace-nowrap min-w-0 ${
                periodTab === 'past' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <ArchiveRestore size={12} strokeWidth={1.9} className="shrink-0" />
              <span className="shrink-0 truncate">已结束</span>
              <span className={`ml-0.5 inline-flex items-center justify-center px-1.5 h-4 rounded-md text-[10px] font-black leading-none shrink-0 ${
                periodTab === 'past' ? 'bg-slate-700/80 text-white' : 'bg-slate-200/70 text-slate-500'
              }`}>{tabCountPast}</span>
            </button>
          </div>
        </div>

        {activeList.length === 0 ? (
          <div className="px-4 sm:px-5 py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <CalendarDays size={20} strokeWidth={1.8} />
            </div>
            <div className="text-[13px] font-medium text-slate-700 mb-1">
              {periodTab === 'upcoming' ? '暂无即将到来的重要日程' : '暂无已结束的历史日程'}
            </div>
            <div className="text-[11.5px] text-slate-400 mb-3">
              {periodTab === 'upcoming'
                ? isIRPRAdmin
                  ? '点击右上角「发布日程」按钮新建第一条重要时间节点。'
                  : '重要时间节点确认后会在这里公布，敬请留意。'
                : '日程结束后会自动归档到这里，方便查阅历史回放与资料。'}
            </div>
            {periodTab === 'upcoming' && isIRPRAdmin && (
              <button
                type="button"
                onClick={openAdd}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11.5px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors"
              >
                <Plus size={12} strokeWidth={2.1} />
                添加第一条日程
              </button>
            )}
            {periodTab === 'past' && (
              <button
                type="button"
                onClick={() => setPeriodTab('upcoming')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11.5px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                <CalendarDays size={12} strokeWidth={2} />
                查看即将开始的日程
              </button>
            )}
          </div>
        ) : (
          <div>
            <ul className="divide-y divide-slate-100">
              {visibleList.map((event) => {
                const visual = resolveTagVisual(event.tag);
                const { month, day } = formatDateBadge(event.startAt);
                const menuOpen = openMenuId === event.id;
                const isPast = periodTab === 'past';
                return (
                  <li
                    key={event.id}
                    className={`px-4 sm:px-5 py-3.5 sm:py-4 transition-colors relative ${
                      isPast
                        ? 'bg-slate-50/30 hover:bg-slate-50/50'
                        : event.important
                        ? 'bg-rose-50/40 hover:bg-rose-50/60'
                        : 'hover:bg-slate-50/70'
                    } ${isPast ? 'opacity-70' : ''}`}
                  >
                    {!isPast && event.important && (
                      <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-sm shadow-rose-200/70">
                        <Star size={9} strokeWidth={2.4} className="fill-white" />
                        <span className="text-[9.5px] font-black leading-none tracking-wider">重要</span>
                      </div>
                    )}
                    {isPast && (
                      <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                        <CheckCircle2 size={9} strokeWidth={2.2} />
                        <span className="text-[9.5px] font-black leading-none tracking-wider">已结束</span>
                      </div>
                    )}
                    <div className="flex items-start gap-3 sm:gap-3.5">
                      <div
                        className={`w-14 h-14 sm:w-14 sm:h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${
                          isPast
                            ? 'bg-slate-100 text-slate-400 border border-slate-200/70'
                            : event.important
                            ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-200/70 ring-2 ring-white'
                            : visual.badge
                        } ring-1 ring-white/20`}
                      >
                        <div className="text-[10.5px] font-semibold uppercase tracking-wider opacity-90 leading-none mb-0.5">
                          {month}
                        </div>
                        <div className="text-[20px] font-black leading-none tabular-nums">{day}</div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${visual.pill}`}
                              >
                                {visual.label}
                              </span>
                              {event.timeLabel && (
                                <span className="inline-flex items-center gap-1 text-[10.5px] text-slate-500">
                                  <Timer size={11} strokeWidth={1.8} />
                                  {event.timeLabel}
                                </span>
                              )}
                            </div>
                            <h3 className="text-[13.5px] font-semibold text-slate-900 leading-snug mb-1.5 line-clamp-2">
                              {event.title}
                            </h3>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-slate-500">
                              {event.location && (
                                <span className="inline-flex items-center gap-1 min-w-0">
                                  <MapPin size={11} strokeWidth={1.8} className="flex-shrink-0 text-slate-400" />
                                  <span className="truncate max-w-[220px]">{event.location}</span>
                                </span>
                              )}
                              {event.organizer && (
                                <span className="inline-flex items-center gap-1 min-w-0">
                                  <Building2 size={11} strokeWidth={1.8} className="flex-shrink-0 text-slate-400" />
                                  <span className="truncate max-w-[180px]">{event.organizer}</span>
                                </span>
                              )}
                              {event.joinLink && (
                                <a
                                  href={event.joinLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 font-medium transition"
                                >
                                  <ExternalLink size={11} strokeWidth={1.8} />
                                  日程链接
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => addToCalendar(event)}
                                className="inline-flex items-center justify-center gap-1.5 min-h-[36px] sm:min-h-[40px] px-2.5 sm:px-3 rounded-xl text-[11.5px] sm:text-[12px] font-semibold text-sky-700 bg-sky-50 border border-sky-100 hover:bg-sky-100 hover:border-sky-200 hover:text-sky-800 transition-colors shadow-sm"
                                title="添加到日历（下载 ICS 文件，或打开 Google Calendar）"
                              >
                                <CalendarPlus size={14} strokeWidth={1.9} />
                                <span className="hidden sm:inline">添加到日历</span>
                                <span className="sm:hidden">日历</span>
                              </button>
                              {isIRPRAdmin && (
                                <div className="relative" ref={menuOpen ? menuRef : undefined}>
                                  <button
                                    type="button"
                                    onClick={() => setOpenMenuId(menuOpen ? null : event.id)}
                                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl inline-flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                    aria-label="日程管理"
                                  >
                                    <MoreHorizontal size={16} strokeWidth={2} />
                                  </button>
                                  {menuOpen && (
                                    <div className="absolute right-0 top-10 z-50 w-44 sm:w-48 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70 py-1.5">
                                      {onToggleImportant && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              onToggleImportant(event.id);
                                              setOpenMenuId(null);
                                            }}
                                            className={`w-full px-3 py-2 flex items-center gap-2 text-[12.5px] hover:bg-slate-50 ${
                                              event.important ? 'text-slate-700' : 'text-rose-600'
                                            }`}
                                          >
                                            <span
                                              className={`w-6 h-6 rounded-lg inline-flex items-center justify-center ${
                                                event.important
                                                  ? 'bg-slate-50 text-slate-500'
                                                  : 'bg-rose-50 text-rose-600'
                                              }`}
                                            >
                                              <Star
                                                size={12.5}
                                                strokeWidth={1.9}
                                                className={event.important ? '' : 'fill-rose-200'}
                                              />
                                            </span>
                                            {event.important ? '取消重要标记' : '标记为重要'}
                                          </button>
                                          <div className="border-t border-slate-100 my-1" />
                                        </>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => openEdit(event)}
                                        className="w-full px-3 py-2 flex items-center gap-2 text-[12.5px] text-slate-700 hover:bg-slate-50"
                                      >
                                        <span className="w-6 h-6 rounded-lg bg-sky-50 text-sky-600 inline-flex items-center justify-center">
                                          <PencilLine size={12.5} strokeWidth={1.9} />
                                        </span>
                                        编辑日程
                                      </button>
                                      <div className="border-t border-slate-100 my-1" />
                                      <button
                                        type="button"
                                        onClick={() => confirmDelete(event)}
                                        className="w-full px-3 py-2 flex items-center gap-2 text-[12.5px] text-rose-600 hover:bg-rose-50"
                                      >
                                        <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 inline-flex items-center justify-center">
                                          <Trash2 size={12.5} strokeWidth={1.9} />
                                        </span>
                                        删除日程
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            {showToggle && (
              <div className="px-4 sm:px-5 py-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-700 hover:border-slate-300 transition-colors"
                >
                  {expanded ? (
                    <>
                      <ChevronUp size={14} strokeWidth={2.1} />
                      收起日程 · 隐藏 {activeList.length - DEFAULT_VISIBLE_COUNT} 条
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} strokeWidth={2.1} />
                      展开全部{periodTab === 'past' ? '历史' : ''}日程 · 还有 {activeList.length - DEFAULT_VISIBLE_COUNT} 条
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center px-4 sm:px-6">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={closeModal}
            aria-hidden="true"
          />
          <form
            onSubmit={submitForm}
            className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 overflow-hidden"
          >
            <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-b from-slate-50/80 to-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  {editing ? <PencilLine size={15} strokeWidth={2} /> : <Plus size={15} strokeWidth={2.2} />}
                </div>
                <div className="min-w-0">
                  <h3 className="text-[14.5px] font-bold text-slate-900 tracking-tight">
                    {editing ? '编辑日程' : '发布日程'}
                  </h3>
                  <p className="text-[11.5px] text-slate-500 mt-0.5">
                    {editing ? '修改活动标题、时间或地点，保存后立即生效。' : '添加财报、路演或行业峰会等重要时间节点，团队与投资者可一键添加到日历。'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-9 h-9 rounded-xl inline-flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <div className="px-5 sm:px-6 py-4 sm:py-5 space-y-4 max-h-[72vh] overflow-y-auto">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">日程标题 *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="例如：XMax 2026 Q4 财报发布电话会"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">开始时间 *</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.startAt ? isoToLocalInput(form.startAt) : ''}
                    onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-900 focus:outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100 transition"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[12px] font-semibold text-slate-700">活动分类</label>
                    {isIRPRAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          closeModal();
                          openTagManager();
                        }}
                        className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                      >
                        <Tags size={11} strokeWidth={2} />
                        管理
                      </button>
                    )}
                  </div>
                  <select
                    value={form.tag ?? defaultTagId}
                    onChange={(e) => setForm({ ...form, tag: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-900 focus:outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100 transition"
                  >
                    {tags.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                  展示时间说明 <span className="text-slate-400 font-normal">（可选）</span>
                </label>
                <input
                  type="text"
                  value={form.timeLabel ?? ''}
                  onChange={(e) => setForm({ ...form, timeLabel: e.target.value })}
                  placeholder="例如：盘前 08:00（北京时间）、下午 13:30 – 17:00"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100 transition"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                  地点 / 会场 <span className="text-slate-400 font-normal">（可选）</span>
                </label>
                <div className="relative">
                  <MapPin
                    size={14}
                    strokeWidth={1.8}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={form.location ?? ''}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="线上接入 · Zoom Webinar 或 香港 · 中环四季酒店宴会厅 III"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                  主办方 <span className="text-slate-400 font-normal">（可选）</span>
                </label>
                <div className="relative">
                  <Building2
                    size={14}
                    strokeWidth={1.8}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={form.organizer ?? ''}
                    onChange={(e) => setForm({ ...form, organizer: e.target.value })}
                    placeholder="投资者关系团队 或 中金公司 CICC · 联合主办"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                  日程链接 / 报名链接 <span className="text-slate-400 font-normal">（可选）</span>
                </label>
                <div className="relative">
                  <ExternalLink
                    size={14}
                    strokeWidth={1.8}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="url"
                    value={form.joinLink ?? ''}
                    onChange={(e) => setForm({ ...form, joinLink: e.target.value })}
                    placeholder="https://zoom.us/j/... 或 活动报名页面"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100 transition"
                  />
                </div>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/60">
              <div className="text-[11.5px] text-slate-400 leading-relaxed max-w-[260px] hidden sm:block">
                标记为 * 的字段必填。保存后所有访问者会看到并可一键加入日历。
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-semibold text-white bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-sm shadow-indigo-200/60 transition-colors"
                >
                  <CheckCircle2 size={13} strokeWidth={2} />
                  {editing ? '保存修改' : '发布日程'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {tagModalOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center px-4 sm:px-6">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={closeTagModal}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 overflow-hidden">
            <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-b from-slate-50/80 to-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Tags size={15} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[14.5px] font-bold text-slate-900 tracking-tight">管理活动分类</h3>
                  <p className="text-[11.5px] text-slate-500 mt-0.5">
                    自定义日程分类，用于在列表中快速区分活动类型。
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeTagModal}
                className="w-9 h-9 rounded-xl inline-flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <div className="px-5 sm:px-6 py-4 sm:py-5 space-y-4 max-h-[72vh] overflow-y-auto">
              <form onSubmit={submitTagForm} className="space-y-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="text-[12px] font-semibold text-slate-700">
                    {tagEditing ? '编辑分类' : '新增分类'}
                  </div>
                  {tagEditing && (
                    <button
                      type="button"
                      onClick={cancelEditTag}
                      className="text-[11px] font-medium text-slate-500 hover:text-slate-700"
                    >
                      取消编辑
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-slate-600 mb-1">分类名称 *</label>
                  <input
                    type="text"
                    required
                    value={tagForm.label}
                    onChange={(e) => setTagForm({ ...tagForm, label: e.target.value })}
                    placeholder="例如：产品发布会"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-300 focus:ring-3 focus:ring-indigo-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-slate-600 mb-1.5">主题配色</label>
                  <div className="grid grid-cols-4 gap-2">
                    {TONE_PRESETS.map((preset) => {
                      const active = tagForm.tone === preset.tone;
                      return (
                        <button
                          key={preset.tone}
                          type="button"
                          onClick={() => setTagForm({ ...tagForm, tone: preset.tone })}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                            active
                              ? 'border-indigo-400 bg-white ring-2 ring-indigo-100 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-lg ${preset.swatch} ring-1 ring-white/30`}
                          />
                          <span className="text-[10.5px] font-medium text-slate-600">{preset.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-sm shadow-indigo-200/60 transition-colors"
                  >
                    {tagEditing ? (
                      <>
                        <CheckCircle2 size={12} strokeWidth={2} />
                        保存修改
                      </>
                    ) : (
                      <>
                        <Plus size={12} strokeWidth={2.1} />
                        添加分类
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="text-[12px] font-semibold text-slate-700">已有分类 · 共 {tags.length} 个</div>
                </div>
                <div className="space-y-2">
                  {tags.map((tag) => {
                    const visual = resolveTagVisual(tag.id);
                    const menuOpen = openTagMenuId === tag.id;
                    return (
                      <div
                        key={tag.id}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10.5px] font-bold ${visual.badge} ring-1 ring-white/30 flex-shrink-0`}
                          >
                            {visual.label.slice(0, 1)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[12.5px] font-semibold text-slate-800 truncate">
                              {visual.label}
                            </div>
                            <span
                              className={`mt-0.5 inline-flex items-center px-1.5 py-px rounded-md text-[10px] font-semibold border ${visual.pill}`}
                            >
                              {visual.label}
                            </span>
                          </div>
                        </div>
                        {isIRPRAdmin && (
                          <div className="relative" ref={menuOpen ? tagMenuRef : undefined}>
                            <button
                              type="button"
                              onClick={() => setOpenTagMenuId(menuOpen ? null : tag.id)}
                              className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
                              aria-label="分类管理"
                            >
                              <MoreHorizontal size={14} strokeWidth={2} />
                            </button>
                            {menuOpen && (
                              <div className="absolute right-0 top-9 z-50 w-40 rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70 py-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditTag(tag)}
                                  className="w-full px-3 py-1.5 flex items-center gap-2 text-[12px] text-slate-700 hover:bg-slate-50"
                                >
                                  <span className="w-5 h-5 rounded-md bg-sky-50 text-sky-600 inline-flex items-center justify-center">
                                    <PencilLine size={11} strokeWidth={1.9} />
                                  </span>
                                  编辑分类
                                </button>
                                <div className="border-t border-slate-100 my-1" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteTag?.(tag.id);
                                    setOpenTagMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 flex items-center gap-2 text-[12px] text-rose-600 hover:bg-rose-50"
                                >
                                  <span className="w-5 h-5 rounded-md bg-rose-50 text-rose-600 inline-flex items-center justify-center">
                                    <Trash2 size={11} strokeWidth={1.9} />
                                  </span>
                                  删除分类
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/60">
              <button
                type="button"
                onClick={closeTagModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
