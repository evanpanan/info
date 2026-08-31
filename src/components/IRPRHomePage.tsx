import { useCallback, useEffect, useMemo, useState } from 'react';
import FeedPublisher from './FeedPublisher';
import TimelineList from './TimelineList';
import OfficialMatrix from './OfficialMatrix';
import IRPRCalendarCard from './IRPRCalendarCard';
import SearchAndTabs from './SearchAndTabs';
import PushNoticeModal, { findNextUnreadPushedNotice } from './PushNoticeModal';
import type { FeedFilterOption, FeedSortOption } from './SearchAndTabs';
import type {
  TimelinePost,
  PostInteractionAction,
  User,
  PostComment,
  IRPRCalendarEvent,
  CalendarTagDef,
} from '../types/irpr';
import { mockPosts, mockCalendarEvents, DEFAULT_CALENDAR_TAGS } from '../data/mockData';
import { CheckCheck, X, PenSquare, ChevronDown, ChevronUp } from 'lucide-react';

/*
  账号体系接入说明（预留）：
  - 下面 CURRENT_AUTHOR 目前是演示期硬编码 admin，未来接入 MuskZoom 登录时替换为
    const session = useSession(); const CURRENT_AUTHOR = session.user;
  - FeedPublisher 显示权限：FeedPublisher 支持 `canPublish` prop，当当前登录用户
    属于「发布者名单」(roles: ['irpr:publisher'] 或白名单) 时传 `canPublish={true}`，
    FeedPublisher 内部守卫是 `canPublish || isIRPRAdmin`，因此也可以仅靠
    canPublish 精确控制发布框显示（不必是全局 IRPR 管理员）。
  - isIRPRAdmin 仍然控制：置顶/删除/添加外链 等管理操作；canPublish 仅控制"是否显示发布框"。
*/
const CURRENT_AUTHOR: User & { roles?: string[]; canPublish?: boolean } = {
  id: 'me',
  name: '潘海祥',
  role: '投资者关系团队',
  avatar: 'https://i.pravatar.cc/80?img=32',
  official: true,
  roles: ['irpr:admin', 'irpr:publisher'],
  canPublish: true,
};

export default function IRPRHomePage() {
  const [posts, setPosts] = useState<TimelinePost[]>(mockPosts);
  const [calendarEvents, setCalendarEvents] = useState<IRPRCalendarEvent[]>(mockCalendarEvents);
  const [calendarTags, setCalendarTags] = useState<CalendarTagDef[]>(DEFAULT_CALENDAR_TAGS);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'mine' | 'saved'>('all');
  const [filterBy, setFilterBy] = useState<FeedFilterOption>('all');
  const [sortBy, setSortBy] = useState<FeedSortOption>('latest');
  const [publisherOpen, setPublisherOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const [pushedNoticePost, setPushedNoticePost] = useState<TimelinePost | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const nxt = findNextUnreadPushedNotice(posts);
      if (nxt) setPushedNoticePost(nxt);
    }, 350);
    return () => clearTimeout(t);
  }, [posts]);

  const handleMarkPushedRead = useCallback(() => {
    setPushedNoticePost(null);
  }, []);

  const handleViewPost = useCallback((post: TimelinePost) => {
    setTimeout(() => {
      const target = document.querySelector<HTMLElement>(`article[data-post-id="${post.id}"]`);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      const prevOutline = target.style.outline;
      const prevBoxShadow = target.style.boxShadow;
      const prevTransition = target.style.transition;
      target.style.transition = 'box-shadow 220ms ease, outline 220ms ease';
      target.style.outline = '2px solid rgb(99 102 241 / 0.6)';
      target.style.boxShadow =
        '0 0 0 4px rgba(99,102,241,0.12), 0 16px 48px -12px rgba(79,70,229,0.35)';
      const flashes = 2;
      let i = 0;
      const tick = () => {
        if (i >= flashes) {
          target.style.outline = prevOutline;
          target.style.boxShadow = prevBoxShadow;
          target.style.transition = prevTransition;
          return;
        }
        setTimeout(() => {
          target.style.outline = i % 2 === 0 ? '2px solid rgb(236 72 153 / 0.5)' : '2px solid rgb(99 102 241 / 0.6)';
          target.style.boxShadow =
            i % 2 === 0
              ? '0 0 0 4px rgba(236,72,153,0.12), 0 16px 48px -12px rgba(219,39,119,0.35)'
              : '0 0 0 4px rgba(99,102,241,0.12), 0 16px 48px -12px rgba(79,70,229,0.35)';
          i += 1;
          tick();
        }, 420);
      };
      tick();
    }, 120);
  }, []);

  const handlePushNoticeNext = useCallback(() => {
    setPushedNoticePost(findNextUnreadPushedNotice(posts));
  }, [posts]);

  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [repostedIds, setRepostedIds] = useState<Set<string>>(new Set());
  const [likesCounts, setLikesCounts] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const p of mockPosts) {
      if (p.metrics?.likes != null) init[p.id] = p.metrics.likes;
    }
    return init;
  });
  const [commentsCounts, setCommentsCounts] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const p of mockPosts) {
      if (p.metrics?.comments != null) init[p.id] = p.metrics.comments;
    }
    return init;
  });
  const [repostsCounts, setRepostsCounts] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const p of mockPosts) {
      if (p.metrics?.reposts != null) init[p.id] = p.metrics.reposts;
    }
    return init;
  });
  const [recentShareActions, setRecentShareActions] = useState<Array<{ id: string; channel?: string; ts: number }>>([]);
  const [commentsMap, setCommentsMap] = useState<Record<string, PostComment[]>>(() => {
    const init: Record<string, PostComment[]> = {};
    for (const p of mockPosts) {
      if (p.comments && p.comments.length > 0) init[p.id] = p.comments;
      else if (p.adminReply) {
        init[p.id] = [
          {
            id: `seed-comment-${p.id}-1`,
            author: { id: 'seed-asker', name: '李浩然', role: '投资者关系', avatar: 'https://i.pravatar.cc/80?img=12' },
            publishedAt: p.adminReply.publishedAt.replace(/\d\d:/, (m) =>
              (Number(m.slice(0, 2)) - 1).toString().padStart(2, '0') + ':'
            ),
            content: '请问这份资料包有英文版本吗？另外 Q3 财报日是否已经确定？',
            officialReply: p.adminReply,
          },
        ];
      }
    }
    return init;
  });
  const [toast, setToast] = useState<{ id: number; text: string; tone?: 'success' | 'info' } | null>(null);
  const showToast = useCallback((text: string, tone: 'success' | 'info' = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToast({ id, text, tone });
    window.setTimeout(() => {
      setToast((prev) => (prev && prev.id === id ? null : prev));
    }, 2200);
  }, []);
  (window as any).__irprShowToast = showToast;

  const isIRPRAdmin = true;
  const canPublish = !!(isIRPRAdmin || CURRENT_AUTHOR.canPublish);

  const handleSearchKeyword = useCallback((keyword: string) => {
    setSearch(keyword);
  }, []);

  const handleCopyText = useCallback((text: string, label?: string) => {
    const copyFallback = (str: string) => {
      try {
        const ta = document.createElement('textarea');
        ta.value = str;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return true;
      } catch {
        return false;
      }
    };
    const doCopy = async () => {
      let ok = false;
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          ok = true;
        }
      } catch {
        ok = false;
      }
      if (!ok) ok = copyFallback(text);
      showToast(label ? `已复制「${label}」` : '内容已复制到剪贴板', ok ? 'success' : 'info');
    };
    void doCopy();
  }, [showToast]);

  const handleAddCalendarEvent = useCallback((event: Omit<IRPRCalendarEvent, 'id'>) => {
    const newEvent: IRPRCalendarEvent = {
      ...event,
      id: `cal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    setCalendarEvents((prev) => [...prev, newEvent]);
    showToast('日程已发布', 'success');
  }, [showToast]);

  const handleUpdateCalendarEvent = useCallback((event: IRPRCalendarEvent) => {
    setCalendarEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, ...event } : e)));
    showToast('日程已更新', 'success');
  }, [showToast]);

  const handleDeleteCalendarEvent = useCallback((eventId: string) => {
    setCalendarEvents((prev) => prev.filter((e) => e.id !== eventId));
    showToast('日程已删除', 'info');
  }, [showToast]);

  const handleToggleCalendarEventImportant = useCallback((eventId: string) => {
    setCalendarEvents((prev) => {
      const target = prev.find((e) => e.id === eventId);
      if (!target) return prev;
      const nextVal = !target.important;
      showToast(nextVal ? '已标记为重要日程' : '已取消重要标记', 'success');
      return prev.map((e) => (e.id === eventId ? { ...e, important: nextVal } : e));
    });
  }, [showToast]);

  const handleAddCalendarTag = useCallback(
    (tag: Omit<CalendarTagDef, 'id'>) => {
      const newTag: CalendarTagDef = {
        ...tag,
        id: `tag-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      };
      setCalendarTags((prev) => [...prev, newTag]);
      showToast('分类已添加', 'success');
    },
    [showToast]
  );

  const handleUpdateCalendarTag = useCallback(
    (tag: CalendarTagDef) => {
      setCalendarTags((prev) => prev.map((t) => (t.id === tag.id ? { ...t, ...tag } : t)));
      showToast('分类已更新', 'success');
    },
    [showToast]
  );

  const handleDeleteCalendarTag = useCallback(
    (tagId: string) => {
      const inUse = calendarEvents.some((e) => e.tag === tagId);
      if (inUse) {
        showToast('该分类下仍有日程，无法删除。请先调整相关日程分类。', 'info');
        return;
      }
      setCalendarTags((prev) => {
        if (prev.length <= 1) {
          showToast('至少保留一个分类', 'info');
          return prev;
        }
        showToast('分类已删除', 'info');
        return prev.filter((t) => t.id !== tagId);
      });
    },
    [calendarEvents, showToast]
  );

  const handlePublish = (
    payload: Omit<TimelinePost, 'id' | 'author' | 'publishedAt' | 'tags'> & { tags?: string[] }
  ) => {
    const newPost: TimelinePost = {
      id: `new-${Date.now()}`,
      author: CURRENT_AUTHOR,
      publishedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      tags: payload.tags ?? ['#最新发布'],
      pinned: false,
      quotePost: null,
      repostOf: null,
      adminReply: null,
      ...payload,
    };
    setPosts((prev) => [newPost, ...prev]);
    setLikesCounts((prev) => ({ ...prev, [newPost.id]: newPost.metrics?.likes ?? 0 }));
    setCommentsCounts((prev) => ({ ...prev, [newPost.id]: newPost.metrics?.comments ?? 0 }));
    setRepostsCounts((prev) => ({ ...prev, [newPost.id]: newPost.metrics?.reposts ?? 0 }));
  };

  const editingPost = useMemo(
    () => (editingPostId ? posts.find((post) => post.id === editingPostId) ?? null : null),
    [posts, editingPostId]
  );

  const closeEditModal = useCallback(() => {
    setEditingPostId(null);
    setEditDraft('');
  }, []);

  const saveEditedPost = useCallback(() => {
    if (!editingPost) return;
    const nextContent = editDraft.trim();
    if (!nextContent || nextContent === editingPost.content) {
      closeEditModal();
      return;
    }
    let updatedPostRef: TimelinePost | null = null;
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === editingPost.id) {
          const updated = { ...post, content: nextContent };
          updatedPostRef = updated;
          return updated;
        }
        return post;
      }).map((post) => {
        if (!updatedPostRef) return post;
        if (post.quotePost?.id === updatedPostRef.id) {
          return { ...post, quotePost: updatedPostRef };
        }
        return post;
      })
    );
    showToast('动态已更新', 'success');
    closeEditModal();
  }, [editingPost, editDraft, closeEditModal, showToast]);

  const onAction = useCallback((action: PostInteractionAction) => {
    switch (action.type) {
      case 'edit': {
        const target = posts.find((p) => p.id === action.postId);
        if (!target) break;
        setEditingPostId(target.id);
        setEditDraft(target.content);
        break;
      }
      case 'like': {
        setLikedIds((prev) => {
          const next = new Set(prev);
          const has = next.has(action.postId);
          if (has) next.delete(action.postId);
          else next.add(action.postId);
          setLikesCounts((pc) => ({
            ...pc,
            [action.postId]: Math.max(
              0,
              (pc[action.postId] ?? 0) + (has ? -1 : 1)
            ),
          }));
          return next;
        });
        break;
      }
      case 'bookmark': {
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          if (next.has(action.postId)) next.delete(action.postId);
          else next.add(action.postId);
          return next;
        });
        break;
      }
      case 'comment': {
        const body = (action.text ?? '').trim();
        const hasImg = Array.isArray(action.images) && action.images.length > 0;
        const hasFile = Array.isArray(action.files) && action.files.length > 0;
        const hasVideo = !!action.videoEmbed;
        if (!body && !hasImg && !hasFile && !hasVideo) break;
        const newC: PostComment = {
          id: `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          author: CURRENT_AUTHOR,
          publishedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          content: body,
          images: hasImg ? action.images : undefined,
          files: hasFile ? action.files : undefined,
          videoEmbed: hasVideo ? action.videoEmbed : null,
          officialReply: null,
        };
        setCommentsMap((prev) => ({
          ...prev,
          [action.postId]: [...(prev[action.postId] ?? []), newC],
        }));
        setCommentsCounts((prev) => ({
          ...prev,
          [action.postId]: (prev[action.postId] ?? 0) + 1,
        }));
        break;
      }
      case 'share': {
        setRecentShareActions((prev) =>
          [
            { id: action.postId, channel: action.channel, ts: Date.now() },
            ...prev,
          ].slice(0, 10)
        );
        if (action.channel === 'copy' || action.channel === 'copy-text') {
          showToast(action.channel === 'copy-text' ? '动态内容已复制' : '已复制到剪贴板', 'success');
        }
        break;
      }
      case 'pin': {
        setPosts((prev) =>
          prev.map((p) => (p.id === action.postId ? { ...p, pinned: action.pinned } : p))
        );
        break;
      }
      case 'delete': {
        setPosts((prev) => prev.filter((p) => p.id !== action.postId && p.repostOf !== action.postId));
        setLikedIds((prev) => {
          const next = new Set(prev);
          next.delete(action.postId);
          return next;
        });
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          next.delete(action.postId);
          return next;
        });
        setRepostedIds((prev) => {
          const next = new Set(prev);
          next.delete(action.postId);
          return next;
        });
        setLikesCounts((prev) => {
          const next = { ...prev };
          delete next[action.postId];
          return next;
        });
        setCommentsCounts((prev) => {
          const next = { ...prev };
          delete next[action.postId];
          return next;
        });
        setRepostsCounts((prev) => {
          const next = { ...prev };
          delete next[action.postId];
          return next;
        });
        setCommentsMap((prev) => {
          const next = { ...prev };
          delete next[action.postId];
          return next;
        });
        showToast('动态已删除', 'info');
        break;
      }
      case 'push-notice': {
        const level = action.level ?? 'info';
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id !== action.postId) return p;
            if (!action.pushed) return { ...p, pushedNotice: null };
            const pushedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
            return { ...p, pushedNotice: { pushedAt, level } };
          }),
        );
        showToast(action.pushed ? '公告推送已发布，用户下次进入页面时将收到弹窗' : '已取消公告推送', 'success');
        if (action.pushed) {
          const pushedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
          setTimeout(() => {
            setPushedNoticePost((cur) => {
              if (cur) return cur;
              const fresh = posts.find((p) => p.id === action.postId);
              if (!fresh) return null;
              return { ...fresh, pushedNotice: { pushedAt, level } };
            });
          }, 150);
        }
        break;
      }
      case 'repost': {
        const orig = posts.find((p) => p.id === action.postId);
        if (!orig) break;
        const undo = (action as PostInteractionAction & { _undo?: boolean })._undo;
        if (undo) {
          setPosts((pprev) => {
            const toDelete = new Set<string>();
            let foundFirst = false;
            for (const p of pprev) {
              if (
                !foundFirst &&
                p.repostOf === action.postId &&
                p.author.id === CURRENT_AUTHOR.id
              ) {
                toDelete.add(p.id);
                foundFirst = true;
              }
            }
            const deletedCount = toDelete.size;
            if (deletedCount > 0) {
              setRepostsCounts((rc) => ({
                ...rc,
                [action.postId]: Math.max(0, (rc[action.postId] ?? 0) - deletedCount),
              }));
              const remain = pprev.filter((p) => !toDelete.has(p.id));
              const hasMoreMine = remain.some(
                (p) => p.repostOf === action.postId && p.author.id === CURRENT_AUTHOR.id
              );
              if (!hasMoreMine) {
                setRepostedIds((prev) => {
                  const next = new Set(prev);
                  next.delete(action.postId);
                  return next;
                });
              }
              return remain;
            }
            return pprev;
          });
        } else {
          const repostPost: TimelinePost = {
            id: `repost-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            author: CURRENT_AUTHOR,
            publishedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            type: orig.type,
            tags: orig.tags,
            content: action.quoteContent ?? '',
            quotePost: orig,
            repostOf: orig.id,
            adminReply: null,
            pinned: false,
            webpage: orig.webpage,
            files: orig.files,
            images: orig.images,
            news: orig.news,
            metrics: { likes: 0, comments: 0, reposts: 0 },
          };
          setPosts((pprev) => [repostPost, ...pprev]);
          setLikesCounts((pc) => ({ ...pc, [repostPost.id]: 0 }));
          setCommentsCounts((cc) => ({ ...cc, [repostPost.id]: 0 }));
          setRepostsCounts((rc) => ({
            ...rc,
            [repostPost.id]: 0,
            [action.postId]: (rc[action.postId] ?? 0) + 1,
          }));
          setRepostedIds((prev) => {
            const next = new Set(prev);
            next.add(action.postId);
            return next;
          });
        }
        break;
      }
      default:
        break;
    }
  }, [posts]);

  const visiblePosts = useMemo(() => {
    const kw = search.trim().toLowerCase();
    let list = posts;
    if (tab === 'saved') list = list.filter((p) => bookmarkedIds.has(p.id));
    else if (tab === 'mine') list = list.filter((p) => p.author.id === CURRENT_AUTHOR.id);
    if (kw) {
      list = list.filter((p) => {
        if (p.content && p.content.toLowerCase().includes(kw)) return true;
        if (p.author?.name?.toLowerCase().includes(kw)) return true;
        if ((p.tags || []).some((t) => t.toLowerCase().includes(kw))) return true;
        if (p.type === 'webpage' && p.webpage?.domain?.toLowerCase().includes(kw)) return true;
        if (p.type === 'news' && p.news?.webpage?.domain?.toLowerCase().includes(kw)) return true;
        if (p.quotePost?.content?.toLowerCase().includes(kw)) return true;
        if (p.adminReply?.content?.toLowerCase().includes(kw)) return true;
        return false;
      });
    }
    if (filterBy !== 'all') {
      list = list.filter((p) => {
        if (filterBy === 'pinned') return !!p.pinned;
        if (filterBy === 'file') return p.type === 'file' || !!p.files?.length;
        if (filterBy === 'webpage') return p.type === 'webpage' || p.type === 'news' || !!p.webpage || !!p.news?.webpage;
        if (filterBy === 'image') return p.type === 'image' || !!p.images?.length;
        if (filterBy === 'video') return !!p.videoEmbed;
        return true;
      });
    }

    const toTimestamp = (publishedAt?: string) => {
      if (!publishedAt) return 0;
      return Date.parse(publishedAt.replace(' ', 'T'));
    };
    const getHeat = (post: TimelinePost) =>
      (likesCounts[post.id] ?? post.metrics?.likes ?? 0) +
      (commentsCounts[post.id] ?? post.metrics?.comments ?? 0) * 2 +
      (repostsCounts[post.id] ?? post.metrics?.reposts ?? 0) * 3;
    const comparePosts = (a: TimelinePost, b: TimelinePost) => {
      if (sortBy === 'oldest') return toTimestamp(a.publishedAt) - toTimestamp(b.publishedAt);
      if (sortBy === 'hot') {
        const heatDiff = getHeat(b) - getHeat(a);
        if (heatDiff !== 0) return heatDiff;
      }
      return toTimestamp(b.publishedAt) - toTimestamp(a.publishedAt);
    };
    const pinnedPosts = list.filter((item) => item.pinned).sort(comparePosts);
    const normalPosts = list.filter((item) => !item.pinned).sort(comparePosts);
    return [...pinnedPosts, ...normalPosts];
  }, [posts, search, tab, bookmarkedIds, filterBy, sortBy, likesCounts, commentsCounts, repostsCounts]);

  const savedCount = useMemo(
    () => posts.filter((p) => bookmarkedIds.has(p.id)).length,
    [posts, bookmarkedIds]
  );
  const mineCount = useMemo(
    () => posts.filter((p) => p.author.id === CURRENT_AUTHOR.id).length,
    [posts]
  );

  const emptyHint = useMemo(() => {
    if (tab === 'saved' && savedCount === 0) {
      return {
        kind: 'bookmarks' as const,
        text: '可以从时间线里点击卡片底部的「收藏」按钮，把重要的动态集中保存到这里。',
      };
    }
    if (tab === 'saved') {
      return {
        kind: 'bookmarks' as const,
        text: '当前搜索关键词在已收藏的动态中没有匹配项，试试换个关键词或清空搜索。',
      };
    }
    if (tab === 'mine' && mineCount === 0) {
      return {
        kind: 'mine' as const,
        text: '你还没有发布任何动态，可以点击上方「发布动态」按钮展开编辑器试试。',
      };
    }
    if (tab === 'mine') {
      return {
        kind: 'mine' as const,
        text: '当前搜索关键词在你的发布内容里没有匹配项，试试换个关键词或清空搜索。',
      };
    }
    return {
      kind: 'search' as const,
      text: '没有匹配的动态，试试别的关键词（支持搜索作者、标签、域名、正文、Cashtag 或管理员评论）。',
    };
  }, [tab, savedCount, mineCount]);

  return (
    <div className="flex-1 min-w-0">
      <div className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 pb-3 sm:pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">首页</h1>
      </div>

      <main className="px-4 sm:px-6 lg:px-8 pb-10">
        <div className="grid grid-cols-12 gap-4 sm:gap-6">
          <section className="col-span-12 lg:col-span-8 space-y-4 sm:space-y-5 min-w-0">
            <SearchAndTabs
              value={search}
              onChange={setSearch}
              tab={tab}
              onTab={setTab}
              savedCount={savedCount}
              mineCount={mineCount}
              totalCount={posts.length}
              filterBy={filterBy}
              onFilterChange={setFilterBy}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
            {canPublish && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setPublisherOpen((v) => !v)}
                  className={`w-full rounded-2xl border px-4 sm:px-5 py-4 text-left transition ${
                    publisherOpen
                      ? 'border-sky-200 bg-sky-50/70 shadow-sm shadow-sky-100/60'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          publisherOpen ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <PenSquare size={18} strokeWidth={1.9} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[15px] font-semibold text-slate-900">发布动态</div>
                        <div className="text-[12.5px] text-slate-500 mt-0.5">
                          仅少数发布者需要使用，点击后展开编辑器；浏览和互动不受影响。
                        </div>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-600 flex-shrink-0">
                      {publisherOpen ? '收起' : '展开'}
                      {publisherOpen ? <ChevronUp size={15} strokeWidth={2} /> : <ChevronDown size={15} strokeWidth={2} />}
                    </div>
                  </div>
                </button>
                {publisherOpen && (
                  <FeedPublisher
                    isIRPRAdmin={isIRPRAdmin}
                    canPublish={CURRENT_AUTHOR.canPublish}
                    currentAvatar={CURRENT_AUTHOR.avatar}
                    onPublish={handlePublish}
                  />
                )}
              </div>
            )}
            <TimelineList
              posts={visiblePosts}
              likedIds={likedIds}
              bookmarkedIds={bookmarkedIds}
              repostedIds={repostedIds}
              likesCounts={likesCounts}
              commentsCounts={commentsCounts}
              repostsCounts={repostsCounts}
              commentsMap={commentsMap}
              isIRPRAdmin={isIRPRAdmin}
              currentUserId={CURRENT_AUTHOR.id}
              onAction={onAction}
              onSearchKeyword={handleSearchKeyword}
              onCopyText={handleCopyText}
              emptyHint={emptyHint}
            />
            <span className="hidden">{recentShareActions.length}</span>
          </section>
          <aside className="col-span-12 lg:col-span-4 min-w-0 space-y-4 sm:space-y-5">
            <IRPRCalendarCard
              events={calendarEvents}
              tags={calendarTags}
              isIRPRAdmin={isIRPRAdmin}
              onAdd={handleAddCalendarEvent}
              onUpdate={handleUpdateCalendarEvent}
              onDelete={handleDeleteCalendarEvent}
              onToggleImportant={handleToggleCalendarEventImportant}
              onAddTag={handleAddCalendarTag}
              onUpdateTag={handleUpdateCalendarTag}
              onDeleteTag={handleDeleteCalendarTag}
            />
            <OfficialMatrix isIRPRAdmin={isIRPRAdmin} />
          </aside>
        </div>
      </main>

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 top-5 z-[9999] pointer-events-none">
          <div
            className={`pointer-events-auto shadow-xl rounded-full pl-3 pr-2 py-1.5 flex items-center gap-2 border backdrop-blur-md ${
              toast.tone === 'info'
                ? 'bg-slate-900/90 text-white border-slate-700'
                : 'bg-slate-900/90 text-white border-slate-700'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                toast.tone === 'info' ? 'bg-sky-500/20 text-sky-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              <CheckCheck size={14} strokeWidth={2} />
            </span>
            <span className="text-[13px] font-medium pr-1">{toast.text}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition"
              aria-label="关闭提示"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {editingPost && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <div className="text-[17px] font-semibold text-slate-900">编辑动态</div>
                <div className="mt-1 text-[12.5px] text-slate-500">
                  修改正文内容后保存，原动态会直接更新。
                </div>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex items-center justify-center"
                aria-label="关闭编辑"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>
            <div className="px-5 sm:px-6 py-5">
              <div className="flex items-center gap-2.5 mb-4">
                <img
                  src={editingPost.author.avatar}
                  alt={editingPost.author.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-100"
                />
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-slate-900">{editingPost.author.name}</div>
                  <div className="text-[12px] text-slate-500">{editingPost.publishedAt}</div>
                </div>
              </div>
              <textarea
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    saveEditedPost();
                  }
                }}
                rows={10}
                placeholder="请输入动态正文"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] leading-[1.7] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/15 focus:bg-white transition resize-none"
              />
              <div className="mt-2 text-[11.5px] text-slate-400">
                支持 `Cmd/Ctrl + Enter` 快速保存
              </div>
            </div>
            <div className="px-5 sm:px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={closeEditModal}
                className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:text-slate-800 hover:border-slate-300 hover:bg-slate-50 transition"
              >
                取消
              </button>
              <button
                type="button"
                onClick={saveEditedPost}
                disabled={!editDraft.trim() || editDraft.trim() === editingPost.content}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[13px] font-medium hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}
      {pushedNoticePost && (
        <PushNoticeModal
          post={pushedNoticePost}
          onClose={() => {
            handleMarkPushedRead();
            handlePushNoticeNext();
          }}
          onMarkReadAndClose={handleMarkPushedRead}
          onViewPost={(post) => {
            handleViewPost(post);
            setTimeout(handlePushNoticeNext, 200);
          }}
        />
      )}
    </div>
  );
}
