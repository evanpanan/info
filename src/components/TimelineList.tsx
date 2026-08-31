import type { PostInteractionAction, TimelinePost } from '../types/irpr';
import type { Post, User, PostComment } from '../types/irpr';
import FeedCard from './FeedCard';
import { BookmarkX } from 'lucide-react';

interface Props {
  posts: TimelinePost[];
  likedIds: Set<string>;
  bookmarkedIds: Set<string>;
  repostedIds: Set<string>;
  likesCounts: Record<string, number>;
  commentsCounts: Record<string, number>;
  repostsCounts: Record<string, number>;
  commentsMap?: Record<string, PostComment[]>;
  isIRPRAdmin: boolean;
  currentUserId: string;
  onAction: (action: PostInteractionAction) => void;
  onSearchKeyword?: (keyword: string) => void;
  onCopyText?: (text: string, label?: string) => void;
  emptyHint?: { kind: 'search' | 'bookmarks' | 'mine' | 'default'; text: string };
}

export default function TimelineList({
  posts,
  likedIds,
  bookmarkedIds,
  repostedIds,
  likesCounts,
  commentsCounts,
  repostsCounts,
  commentsMap,
  isIRPRAdmin,
  currentUserId,
  onAction,
  onSearchKeyword,
  onCopyText,
  emptyHint,
}: Props) {
  if (posts.length === 0) {
    const hint =
      emptyHint ??
      { kind: 'default' as const, text: '当前还没有动态，可以点击上方「发布动态」按钮展开编辑器后开始第一条分享。' };
    const icon =
      hint.kind === 'bookmarks' ? (
        <BookmarkX size={28} strokeWidth={1.5} className="text-slate-400" />
      ) : (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" className="text-slate-300" />
          <path d="M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-slate-400" />
        </svg>
      );
    return (
      <div className="bg-white border border-dashed border-slate-200 rounded-2xl px-6 py-14 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
          {icon}
        </div>
        <div className="text-sm font-medium text-slate-800 mb-1">
          {hint.kind === 'search' && '没有匹配的动态'}
          {hint.kind === 'bookmarks' && '暂未收藏任何动态'}
          {hint.kind === 'mine' && '还没有发布过内容'}
          {hint.kind === 'default' && '还没有任何动态'}
        </div>
        <div className="text-xs text-slate-500 max-w-sm leading-relaxed">{hint.text}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((item) => {
        const post: Post = {
          ...item,
          author: item.author as User,
          isPinned: item.pinned,
        };
        return (
          <FeedCard
            key={item.id}
            post={post}
            liked={likedIds.has(item.id)}
            bookmarked={bookmarkedIds.has(item.id)}
            reposted={repostedIds.has(item.id)}
            isIRPRAdmin={isIRPRAdmin}
            currentUserId={currentUserId}
            likesCount={likesCounts[item.id] ?? item.metrics?.likes ?? 0}
            commentsCount={commentsCounts[item.id] ?? item.metrics?.comments ?? 0}
            repostsCount={repostsCounts[item.id] ?? item.metrics?.reposts ?? 0}
            comments={commentsMap?.[item.id] ?? item.comments ?? []}
            onAction={onAction}
            onSearchKeyword={onSearchKeyword}
            onCopyText={onCopyText}
          />
        );
      })}
    </div>
  );
}
