import { useEffect, useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Home,
  FileBarChart,
  Bot,
  Sparkles,
  Youtube,
  Linkedin,
  ExternalLink,
  Globe,
  Pencil,
  Trash2,
  Plus,
  X,
  Check,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';

function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function RedditLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm7.87 12.133c.013.09.02.18.02.273 0 3.253-3.793 5.887-8.47 5.887-4.677 0-8.47-2.634-8.47-5.887 0-.09.008-.18.02-.272a2.373 2.373 0 0 1-.553-1.66c0-1.307 1.06-2.367 2.366-2.367.71 0 1.345.313 1.784.812 1.798-1.266 4.24-2.07 6.933-2.16l1.527-6.96a.464.464 0 0 1 .56-.346l4.853 1.026a1.68 1.68 0 1 1-.246.787L19.2 2.873l-1.36 6.193c2.637.14 4.997.917 6.74 2.143.433-.486 1.06-.79 1.76-.79 1.308 0 2.368 1.06 2.368 2.368 0 .628-.245 1.2-.64 1.618zM7.67 11.896a1.68 1.68 0 1 0 3.36 0 1.68 1.68 0 0 0-3.36 0zm8.913 0a1.68 1.68 0 1 0-3.36 0 1.68 1.68 0 0 0 3.36 0zm-8.754 4.27c.153.506.633.87 1.2.87h6.02c.566 0 1.046-.364 1.2-.87a.33.33 0 0 0-.106-.342.326.326 0 0 0-.348-.028c-.843.555-2.04.862-3.406.862-1.366 0-2.562-.307-3.406-.863a.327.327 0 0 0-.454.37z" />
    </svg>
  );
}

function FutuLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 24V8h4.5L16 16.5 21.5 8H26v16h-4v-8l-3.5 5L16 16l-2.5 5L10 16v8z" />
    </svg>
  );
}

function LaohuLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 2C7.58 2 4 4.69 4 8c0 1.88 1.06 3.56 2.7 4.68-.17.6-.45 1.2-.84 1.76l-.03.04C3.7 16.4 2 19 2 22h20c0-3-1.7-5.6-3.83-7.52-.39-.56-.67-1.16-.84-1.76C18.94 11.56 20 9.88 20 8c0-3.31-3.58-6-8-6zm-2.3 6.5c.8 0 1.5.6 1.5 1.4 0 .7-.5 1.3-1.2 1.4l1.2 3h-1.6l-1-2.6h-.5V15H9v-5h.7zm5 0h1.8c.9 0 1.5.5 1.5 1.3 0 .5-.2.9-.6 1.1l.8 1.9h-1.7l-.6-1.5h-.7V15h-1.4v-5h.9zm-.9 2.2h.8c.4 0 .6-.2.6-.5 0-.3-.2-.5-.6-.5h-.8z" />
    </svg>
  );
}

function HSTLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V4h4v7h8V4h4v16h-4v-7H8v7z" />
    </svg>
  );
}

function XBelieversLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.5 6.5H21l-5.5 4.2 2 6.8L12 15.8 6.5 19.5l2-6.8L3 8.5h6.5z" />
    </svg>
  );
}

function NotionLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 0-.28-.28-.327L17.902.249c-.187-.094-.327-.046-.608.047L4.18 2.01c-.42.047-.56.327-.28.42-.374 0 1.12 1.776.56 1.778zm15.34 1.073L6.585 6.073c-.747.047-.887.374-.42 1.027l7.193 9.644c.374.467.608.374.747 0l4.386-10.96c.093-.28 0-.42-.327-.467-.28-.467.607-.141.607-.141zm-8.875.98c1.867-.14 2.054.047 2.755 1.026l9.153 13.495c.374.467.28.7.374 1.026v.514c-.84.28-1.866.513-2.892.746-1.68-2.613-3.547-5.234-5.233-7.754-.28 0-1.12.7-1.493 1.073v6.918c-.467.093-.747 0-1.214.093l-.42.047V10.83c0-.654.42-.84 1.027-.934l-.234-.047-.98-1.45c-.094.095-.654.095-.654.095v8.032c0 .42 0 .42-.467.467l-1.913.14V7.803c-.187.047-.654.047-.654.047V19.77l-.467.094c-1.073.234-1.96.374-2.054.094V4.82c0-.374.093-.467.373-.467l10.727-.7z" />
    </svg>
  );
}

export interface ExternalLink {
  id: string;
  name: string;
  description?: string;
  Icon?: LucideIcon;
  CustomLogo?: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconSrc?: string;
  url: string;
  badge?: string;
  section: 'official' | 'social';
}

export const DEFAULT_LINKS: ExternalLink[] = [
  {
    id: 'ws-xmax',
    name: 'XMax 官网',
    description: '集团品牌与产品总入口',
    Icon: Home,
    iconBg: 'bg-sky-600 text-white',
    url: 'https://www.xmax.com',
    badge: '官方站点',
    section: 'official',
  },
  {
    id: 'ws-ir',
    name: 'XMax 投资者关系官网',
    description: '投资者关系专属站点（筹备中）',
    Icon: FileBarChart,
    iconBg: 'bg-indigo-600 text-white',
    url: '',
    badge: '待填写',
    section: 'official',
  },
  {
    id: 'ws-ai',
    name: 'XMax AI 官网',
    description: 'AI 基础设施能力介绍',
    Icon: Bot,
    iconBg: 'bg-violet-600 text-white',
    url: 'https://ai.xmax.com',
    badge: '官方站点',
    section: 'official',
  },
  {
    id: 'ws-token',
    name: 'XMax AI 产品',
    description: 'Token 产品与 API 控制台',
    Icon: Sparkles,
    iconBg: 'bg-indigo-600 text-white',
    url: 'https://token.xmax.com/en',
    badge: '官方站点',
    section: 'official',
  },
  {
    id: 'sm-x',
    name: 'Twitter / X',
    description: '@XmaxGlobal · 全球官方发布主阵地',
    CustomLogo: XLogo,
    iconBg: 'bg-slate-950 text-white',
    url: 'https://x.com/XmaxGlobal',
    section: 'social',
  },
  {
    id: 'sm-reddit',
    name: 'Reddit',
    description: 'r/XmaxGlobal · 社区讨论与公告同步',
    CustomLogo: RedditLogo,
    iconBg: 'bg-[#FF4500] text-white',
    url: 'https://www.reddit.com/r/XmaxGlobal/',
    section: 'social',
  },
  {
    id: 'sm-yt',
    name: 'YouTube',
    description: '财报电话会与路演回放（筹备中）',
    Icon: Youtube,
    iconBg: 'bg-[#FF0000] text-white',
    url: '',
    badge: '待填写',
    section: 'social',
  },
  {
    id: 'sm-li',
    name: 'LinkedIn',
    description: 'XMax Inc 官方主页（筹备中）',
    Icon: Linkedin,
    iconBg: 'bg-[#0A66C2] text-white',
    url: '',
    badge: '待填写',
    section: 'social',
  },
  {
    id: 'sm-futu',
    name: '富途牛牛',
    description: '港股投资者社区',
    CustomLogo: FutuLogo,
    iconBg: 'bg-[#00C269] text-white',
    url: 'https://q.futunn.com/profile/40001621?chain_id=3pAtQ5-OeAjgb0.1l90anj&global_content=%7B%22promote_id%22%3A13766,%22sub_promote_id%22%3A36,%22invite%22%3A%2240001621%22,%22promote_content%22%3A%22nn%3Afeed%3A117109981511684%22,%22f%22%3A%22q.futunn.com%2Fhk%2Ffeed%2F117109981511684%22%7D',
    section: 'social',
  },
  {
    id: 'sm-laohu',
    name: '老虎证券',
    description: '老虎社区投资者讨论',
    CustomLogo: LaohuLogo,
    iconBg: 'bg-[#F5A623] text-white',
    url: 'https://www.laohu8.com/personal/4249532127229230/',
    section: 'social',
  },
  {
    id: 'sm-hst',
    name: '华盛通',
    description: '华盛社区投资者动态',
    CustomLogo: HSTLogo,
    iconBg: 'bg-[#E60012] text-white',
    url: 'https://www.hstong.com/sns/user/3001269890?lang=zh_CN',
    section: 'social',
  },
  {
    id: 'sm-xb',
    name: 'XBelievers',
    description: 'MuskZoom 关联社区',
    CustomLogo: XBelieversLogo,
    iconBg: 'bg-[#1E40AF] text-white',
    url: 'https://www.xbelievers.com',
    section: 'social',
  },
  {
    id: 'sm-notion',
    name: '社区资料包',
    description: 'XMax (Nasdaq) Notion 资料库 · 一站式入口',
    CustomLogo: NotionLogo,
    iconBg: 'bg-slate-900 text-white',
    url: 'https://app.notion.com/p/XMAX-Nasdaq-XMAX-26fb24b697c3817f8642c51edb0b3c13?source=copy_link',
    badge: '社区资料',
    section: 'social',
  },
];

export type EditLinkDraft = Partial<
  Pick<ExternalLink, 'name' | 'url' | 'description' | 'badge' | 'section' | 'iconBg' | 'iconSrc'>
> & {
  IconName?: string;
};

interface CardEditorState {
  mode: 'add' | 'edit';
  section: ExternalLink['section'];
  targetId?: string;
}

function SectionHeader({
  title,
  subtitle,
  addLabel,
  isAdmin,
  onAdd,
}: {
  title: string;
  subtitle?: string;
  addLabel: string;
  isAdmin: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-1 mt-4 mb-2.5">
      <div className="min-w-0">
        <div className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </div>
        {subtitle && (
          <div className="mt-0.5 text-[11.5px] text-slate-400">{subtitle}</div>
        )}
      </div>
      {isAdmin && (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 transition flex-shrink-0"
        >
          <Plus size={12.5} strokeWidth={2} />
          {addLabel}
        </button>
      )}
    </div>
  );
}

function RowItem({
  item,
  isAdmin,
  onEdit,
  onDelete,
}: {
  item: ExternalLink;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = item.Icon;
  const Logo = item.CustomLogo;
  const isPending = !item.url || item.badge === '待填写';
  const isCommunityBadge = item.badge === '社区资料';
  return (
    <div className="group relative px-2 sm:px-2.5 py-3 sm:py-3.5 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50/60 transition">
      <a
        href={item.url || undefined}
        target={isPending ? undefined : '_blank'}
        rel={isPending ? undefined : 'noreferrer noopener'}
        aria-disabled={isPending}
        onClick={
          isPending
            ? (e) => {
                e.preventDefault();
                e.stopPropagation();
              }
            : undefined
        }
        className={`flex items-start gap-3 ${isPending ? 'cursor-not-allowed' : ''}`}
      >
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            item.iconSrc
              ? 'bg-white border border-slate-100 p-0.5'
              : `${item.iconBg} shadow-[0_1px_2px_rgba(15,23,42,0.06)]`
          }`}
        >
          {item.iconSrc ? (
            <img
              src={item.iconSrc}
              alt={`${item.name} LOGO`}
              className="w-full h-full object-contain rounded-xl"
              draggable={false}
            />
          ) : Logo ? (
            <Logo className="w-[18px] h-[18px]" />
          ) : Icon ? (
            <Icon size={18} strokeWidth={1.75} />
          ) : null}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className={`text-[14px] sm:text-[14.5px] font-semibold truncate ${
                isPending ? 'text-slate-500' : 'text-slate-900 group-hover:text-slate-800 transition'
              }`}
            >
              {item.name}
            </div>
            {item.badge && (
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-md font-medium whitespace-nowrap ${
                  isPending
                    ? 'text-amber-700 bg-amber-50 border border-amber-200'
                    : isCommunityBadge
                    ? 'text-violet-700 bg-violet-50 border border-violet-200'
                    : 'text-slate-500 bg-slate-100 border border-slate-200/60'
                }`}
              >
                {item.badge}
              </span>
            )}
          </div>
          {item.description && (
            <div className="mt-0.5 text-[12px] text-slate-500 leading-relaxed line-clamp-2">
              {item.description}
            </div>
          )}
        </div>
        <div className="flex-shrink-0 pt-1">
          <ExternalLink
            size={15}
            strokeWidth={1.75}
            className={`transition ${
              isPending ? 'text-slate-200' : 'text-slate-300 group-hover:text-slate-500'
            }`}
          />
        </div>
      </a>

      {isAdmin && (
        <div className="absolute top-3 right-2 opacity-0 group-hover:opacity-100 transition pointer-events-none group-hover:pointer-events-auto">
          <div className="inline-flex items-center gap-1 bg-white border border-slate-200 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)] rounded-xl p-1">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11.5px] font-medium text-slate-600 hover:bg-sky-50 hover:text-sky-700 transition"
              title="编辑渠道"
            >
              <Pencil size={12} strokeWidth={1.75} />
              编辑
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11.5px] font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
              title="删除渠道"
            >
              <Trash2 size={12} strokeWidth={1.75} />
              删除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExternalLinksCard({
  initialItems,
  isAdmin = false,
}: {
  initialItems?: ExternalLink[];
  isAdmin?: boolean;
}) {
  const [items, setItems] = useState<ExternalLink[]>(initialItems ?? DEFAULT_LINKS);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editor, setEditor] = useState<CardEditorState>({
    mode: 'add',
    section: 'official',
  });
  const [draft, setDraft] = useState<EditLinkDraft>({ name: '', url: '', description: '', section: 'official' });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const iconFileInputRef = useRef<HTMLInputElement>(null);

  const official = useMemo(() => items.filter((i) => i.section === 'official'), [items]);
  const social = useMemo(() => items.filter((i) => i.section === 'social'), [items]);

  useEffect(() => {
    if (!editorOpen && confirmDelete == null) return;
    function onClick(e: MouseEvent) {
      if ((e.target as HTMLElement).dataset?.role === 'irpr-links-backdrop') {
        setEditorOpen(false);
        setConfirmDelete(null);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [editorOpen, confirmDelete]);

  const openAdd = (section: ExternalLink['section']) => {
    setEditor({ mode: 'add', section });
    setDraft({
      name: '',
      url: '',
      description: '',
      badge: '',
      iconSrc: '',
      iconBg: section === 'official' ? 'bg-sky-600 text-white' : 'bg-slate-700 text-white',
      section,
    });
    setEditorOpen(true);
  };

  const openEdit = (id: string) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;
    setEditor({ mode: 'edit', section: target.section, targetId: id });
    setDraft({
      name: target.name,
      url: target.url,
      description: target.description ?? '',
      badge: target.badge ?? '',
      section: target.section,
      iconSrc: target.iconSrc ?? '',
      iconBg: target.iconBg,
    });
    setEditorOpen(true);
  };

  const handlePickIconFile = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setDraft((d) => ({ ...d, iconSrc: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const commitDraft = () => {
    const cleanName = (draft.name ?? '').trim();
    if (!cleanName) return;
    if (editor.mode === 'add') {
      const next: ExternalLink = {
        id: `link-${Date.now()}`,
        name: cleanName,
        url: (draft.url ?? '').trim(),
        description: (draft.description ?? '').trim() || undefined,
        badge: (draft.badge ?? '').trim() || undefined,
        section: draft.section ?? editor.section,
        Icon: draft.section === 'official' ? Home : Globe,
        iconBg: draft.iconBg ?? (draft.section === 'official' ? 'bg-sky-600 text-white' : 'bg-slate-700 text-white'),
        iconSrc: draft.iconSrc?.trim() || undefined,
      };
      setItems((prev) => [...prev, next]);
    } else if (editor.targetId) {
      setItems((prev) =>
        prev.map((i) => {
          if (i.id !== editor.targetId) return i;
          const cleanIconSrc = (draft.iconSrc ?? '').trim() || undefined;
          return {
            ...i,
            name: cleanName,
            url: (draft.url ?? i.url).trim(),
            description: (draft.description ?? i.description ?? '').trim() || undefined,
            badge: (draft.badge ?? i.badge ?? '').trim() || undefined,
            section: draft.section ?? i.section,
            iconBg: draft.iconBg ?? i.iconBg,
            iconSrc: cleanIconSrc,
          };
        })
      );
    }
    setEditorOpen(false);
  };

  const doDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setConfirmDelete(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-start justify-between gap-3 mb-4 sm:mb-5">
        <div className="min-w-0">
          <h3 className="text-[15.5px] font-semibold text-slate-900">官方矩阵与外链导航</h3>
          <p className="mt-1 text-[12px] text-slate-500 leading-relaxed">
            直达 XMax 官网、投资者关系站点，及全球官方社媒 / 券商阵地
          </p>
        </div>
        <a
          href="https://www.xmax.com"
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition flex-shrink-0 shadow-[0_1px_2px_rgba(15,23,42,0.1)]"
        >
          <ExternalLink size={12} strokeWidth={1.75} />
          XMax 官网
        </a>
      </div>

      <div className="-mx-2 sm:-mx-2.5 space-y-0.5">
        <SectionHeader
          title="官方网站"
          subtitle={`${official.length} 个入口 · 品牌 · 投资者关系 · AI · 产品线`}
          addLabel="添加官网"
          isAdmin={isAdmin}
          onAdd={() => openAdd('official')}
        />
        <div className="space-y-0.5">
          {official.map((i) => (
            <RowItem
              key={i.id}
              item={i}
              isAdmin={isAdmin}
              onEdit={() => openEdit(i.id)}
              onDelete={() => setConfirmDelete(i.id)}
            />
          ))}
        </div>

        <SectionHeader
          title="官方社媒 / 券商矩阵"
          subtitle={`${social.length} 条渠道 · 社区 · 视频 · 券商`}
          addLabel="添加渠道"
          isAdmin={isAdmin}
          onAdd={() => openAdd('social')}
        />
        <div className="space-y-0.5">
          {social.map((i) => (
            <RowItem
              key={i.id}
              item={i}
              isAdmin={isAdmin}
              onEdit={() => openEdit(i.id)}
              onDelete={() => setConfirmDelete(i.id)}
            />
          ))}
        </div>
      </div>

      {editorOpen && (
        <div
          ref={backdropRef}
          data-role="irpr-links-backdrop"
          className="fixed inset-0 z-[88] flex items-start sm:items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="px-5 pt-4.5 pb-3.5 flex items-center justify-between border-b border-slate-100">
              <div>
                <div className="text-[15px] font-semibold text-slate-900">
                  {editor.mode === 'add' ? '新增外链' : '编辑外链'}
                </div>
                <div className="text-[11.5px] text-slate-400 mt-0.5">
                  {editor.section === 'official' ? '添加到「官方网站」分组' : '添加到「官方社媒 / 券商矩阵」分组'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                title="关闭"
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3.5 max-h-[64vh] overflow-y-auto">
              <div>
                <label className="block text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  名称
                </label>
                <input
                  value={draft.name ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="如：XMax 投资者关系官网"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-300 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  URL
                </label>
                <input
                  value={draft.url ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
                  placeholder="https://……（留空则显示「待填写」）"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-300 focus:bg-white transition font-mono"
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  描述
                </label>
                <input
                  value={draft.description ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  placeholder="一句话说明（选填）"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-300 focus:bg-white transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    右侧徽章
                  </label>
                  <input
                    value={draft.badge ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, badge: e.target.value }))}
                    placeholder="官方站点 / 待填写 / 187.4K 关注"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-[12.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-300 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    所属分组
                  </label>
                  <select
                    value={draft.section ?? editor.section}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, section: e.target.value as ExternalLink['section'] }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-[13px] text-slate-800 focus:outline-none focus:border-sky-300 focus:bg-white transition"
                  >
                    <option value="official">官方网站</option>
                    <option value="social">官方社媒 / 券商矩阵</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  LOGO 上传
                  <span className="ml-1 text-[10.5px] font-normal tracking-normal text-slate-400">
                    仅 PNG/JPG/SVG，建议正方形透明图，上传后将优先于默认品牌 LOGO
                  </span>
                </label>
                <div className="flex items-start gap-3">
                  <div
                    className={`w-14 h-14 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden flex-shrink-0 ${
                      draft.iconSrc ? 'border-sky-200 bg-sky-50' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    {draft.iconSrc ? (
                      <img
                        src={draft.iconSrc}
                        alt="当前 LOGO"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <ImageIcon
                        size={20}
                        strokeWidth={1.5}
                        className="text-slate-300"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <input
                      ref={iconFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={(e) => handlePickIconFile(e.target.files?.[0])}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => iconFileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition"
                      >
                        <Upload size={13} strokeWidth={1.75} />
                        选择本地图片
                      </button>
                      {draft.iconSrc && (
                        <button
                          type="button"
                          onClick={() => {
                            if (iconFileInputRef.current) iconFileInputRef.current.value = '';
                            setDraft((d) => ({ ...d, iconSrc: '' }));
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-[12px] font-medium text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 hover:text-rose-700 transition"
                        >
                          <X size={12} strokeWidth={1.75} />
                          移除已上传
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      · 图片以 base64 保存在页面状态内，仅管理员可见上传入口
                      <br />· 移除后回退使用系统默认品牌 LOGO / 配置
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="text-[11.5px] text-slate-400">
                {isAdmin ? '管理员修改将立即生效' : '仅管理员可修改'}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-[13px] font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:text-slate-800 transition"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={commitDraft}
                  disabled={!(draft.name ?? '').trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-[0_1px_2px_rgba(15,23,42,0.1)]"
                >
                  <Check size={13} strokeWidth={2} />
                  {editor.mode === 'add' ? '添加' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDelete != null && (
        <div
          data-role="irpr-links-backdrop"
          className="fixed inset-0 z-[90] flex items-start sm:items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <div className="text-[15px] font-semibold text-slate-900">确认删除该外链？</div>
              <div className="mt-1 text-[12.5px] text-slate-500">
                「{items.find((i) => i.id === confirmDelete)?.name}」
                <br />
                删除后无法恢复，但可以通过「新增外链」重新录入。
              </div>
            </div>
            <div className="px-5 pb-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-3.5 py-2 rounded-xl text-[13px] font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:text-slate-800 transition"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => doDelete(confirmDelete)}
                className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-rose-600 hover:bg-rose-700 transition shadow-[0_1px_2px_rgba(244,63,94,0.2)]"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
