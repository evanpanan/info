export type PostType = 'news' | 'webpage' | 'file' | 'image';

export interface Author {
  id: string;
  name: string;
  role: string;
  avatar: string;
  official?: boolean;
}

export interface WebpagePreview {
  url: string;
  title: string;
  description: string;
  thumbnail?: string;
  ogImage?: string;
  twitterImage?: string;
  firstContentImage?: string;
  domain: string;
  __placeholderGradient?: string;
  __debug?: {
    usedFallback: string;
    failedUrls?: string[];
  };
}

export interface FileAttachment {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'doc' | 'xlsx' | 'ppt' | 'zip';
  url: string;
}

export interface PostComment {
  id: string;
  author: Author;
  publishedAt: string;
  content: string;
  images?: string[];
  files?: FileAttachment[];
  videoEmbed?: {
    provider: 'youtube' | 'bilibili' | 'generic';
    url: string;
    videoId?: string;
    title?: string;
  } | null;
  officialReply?: {
    id: string;
    author: Author;
    publishedAt: string;
    content: string;
  } | null;
}

export interface TimelinePost {
  id: string;
  author: Author;
  publishedAt: string;
  type: PostType;
  tags: string[];
  content: string;
  webpage?: WebpagePreview;
  files?: FileAttachment[];
  images?: string[];
  news?: { headline?: string; source?: string; webpage: WebpagePreview };
  metrics?: { likes?: number; comments?: number; reposts?: number };
  pinned?: boolean;
  quotePost?: TimelinePost | null;
  repostOf?: string | null;
  comments?: PostComment[];
  videoEmbed?: {
    provider: 'youtube' | 'bilibili' | 'generic';
    url: string;
    videoId?: string;
    title?: string;
  } | null;
  location?: {
    name: string;
    latitude: number;
    longitude: number;
    zoom?: number;
  } | null;
  scheduleAt?: {
    iso: string;
    label?: string;
    timezone?: string;
  } | null;
  adminReply?: {
    id: string;
    author: Author;
    publishedAt: string;
    content: string;
  } | null;
  pushedNotice?: {
    pushedAt: string;
    level?: 'info' | 'urgent';
  } | null;
}

export interface PostInteractionState {
  liked: boolean;
  bookmarked: boolean;
  commentsCount: number;
  likesCount: number;
}

export type PostInteractionAction =
  | { type: 'like'; postId: string; actorId?: string }
  | { type: 'edit'; postId: string; actorId?: string }
  | {
      type: 'comment';
      postId: string;
      actorId?: string;
      text?: string;
      images?: string[];
      files?: FileAttachment[];
      videoEmbed?: {
        provider: 'youtube' | 'bilibili' | 'generic';
        url: string;
        videoId?: string;
        title?: string;
      } | null;
    }
  | { type: 'bookmark'; postId: string; actorId?: string }
  | { type: 'share'; postId: string; channel?: string; primaryUrl?: string }
  | { type: 'pin'; postId: string; actorId?: string; pinned: boolean }
  | { type: 'repost'; postId: string; actorId?: string; quoteContent?: string }
  | { type: 'delete'; postId: string; actorId?: string }
  | { type: 'push-notice'; postId: string; actorId?: string; pushed: boolean; level?: 'info' | 'urgent' };

export interface OfficialChannel {
  id: string;
  name: string;
  icon: 'twitter' | 'reddit' | 'futu' | 'moomoo' | 'ibkr' | 'wechat' | 'weibo' | 'custom';
  url: string;
  followers: string;
  status: 'active' | 'pending' | 'inactive';
  customIconName?: string;
}

export interface NewChannelInput {
  name: string;
  icon: string;
  url: string;
}

export interface User {
  id: string;
  name: string;
  role: string;
  avatar: string;
  official?: boolean;
}

export type Post = TimelinePost & {
  author: User;
  isPinned?: boolean;
};

export type ChannelItemSection = 'official' | 'social';

export interface ChannelItem {
  id: string;
  name: string;
  description?: string;
  iconBg: string;
  iconSrc?: string;
  url: string;
  badge?: string;
  section: ChannelItemSection;
}

export type CalendarTagTone = 'rose' | 'indigo' | 'emerald' | 'amber' | 'slate' | 'sky' | 'violet' | 'teal';

export interface CalendarTagDef {
  id: string;
  label: string;
  tone: CalendarTagTone;
}

export interface IRPRCalendarEvent {
  id: string;
  title: string;
  startAt: string;
  timeLabel?: string;
  timezone?: string;
  location?: string;
  tag?: string;
  joinLink?: string;
  organizer?: string;
  important?: boolean;
}

export type SECFormType =
  | '8-K'
  | '10-Q'
  | '10-K'
  | '13G'
  | '424B5'
  | 'FORM3'
  | 'FORM4'
  | 'CORRESP'
  | 'OTHER';

export interface SECFilingKeyFigure {
  label: string;
  value: string;
  tone: 'positive' | 'negative' | 'neutral';
}

export type SECFilingStatus = 'summarizing' | 'ready' | 'need_review' | 'published';

export interface SECFilingSummary {
  id: string;
  formType: SECFormType;
  filedAt: string;
  issuer: string;
  subject: string;
  counterparty?: string;
  summary: string;
  keyPoints: string[];
  keyFigures: SECFilingKeyFigure[];
  tags: string[];
  aiRisk: 'low' | 'medium' | 'high';
  rawFile: FileAttachment;
  secLink?: string;
  status: SECFilingStatus;
  publishedPostId?: string;
  ingestedAt: string;
  ingestedBy?: string;
}
