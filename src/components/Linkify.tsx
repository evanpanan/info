import type { JSX } from 'react';
import type { WebpagePreview } from '../types/irpr';

export const URL_REGEX =
  /https?:\/\/[^\s<>)\]}"'`，。；！？、）】』」]+(?:\([^\s<>)\]}"'`]*\)[^\s<>)\]}"'`，。；！？、）】』」]*)*[^\s<>)\]}"'`，。；！？、）】』」,.;:!?)]/gi;

const LINK_RE = new RegExp(URL_REGEX.source, URL_REGEX.flags);
const CASHTAG_RE = /\$[A-Za-z]{1,8}/g;
const HASHTAG_RE = /(?<![\w#])#[\p{L}\p{N}_]+/gu;
const COMBINED_RE = new RegExp(
  `${URL_REGEX.source}|${CASHTAG_RE.source}|${HASHTAG_RE.source}`,
  'gi'
);

export function resolveAbsoluteUrl(pageUrl: string, candidate: string | undefined | null): string | null {
  if (!candidate || typeof candidate !== 'string') return null;
  const raw = candidate.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('//')) {
    try { return 'https:' + raw; } catch { return null; }
  }
  if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw;
  try {
    const base = new URL(pageUrl);
    const resolved = new URL(raw, base);
    return resolved.toString();
  } catch {
    return null;
  }
}

export function proxyImageUrl(remote: string): string {
  if (!remote) return '';
  try {
    const u = new URL(remote);
    if (u.hostname === 'www.google.com' || u.hostname === 'icons.duckduckgo.com') {
      return remote;
    }
    const encoded = encodeURIComponent(remote);
    return `/api/proxy-image?url=${encoded}`;
  } catch {
    return remote;
  }
}

const DOMAIN_BG: Record<string, string> = {
  'x.com': 'from-slate-900 via-slate-800 to-sky-900',
  'notion.com': 'from-slate-900 via-indigo-900 to-violet-900',
  'notion.so': 'from-slate-900 via-indigo-900 to-violet-900',
  'app.notion.com': 'from-slate-900 via-violet-900 to-fuchsia-900',
  'bloomberg.com': 'from-orange-700 via-rose-600 to-amber-700',
  'reddit.com': 'from-orange-500 via-rose-500 to-red-600',
  'youtube.com': 'from-rose-600 via-red-600 to-red-700',
  'linkedin.com': 'from-sky-700 via-blue-700 to-indigo-800',
  'futunn.com': 'from-emerald-600 via-green-600 to-teal-700',
  'q.futunn.com': 'from-emerald-600 via-green-600 to-teal-700',
  'laohu8.com': 'from-amber-500 via-orange-600 to-red-700',
  'hstong.com': 'from-sky-600 via-blue-600 to-indigo-700',
  'xbelievers.com': 'from-emerald-800 via-teal-800 to-slate-900',
  'xmax.com': 'from-sky-600 via-indigo-600 to-violet-700',
  'ai.xmax.com': 'from-sky-500 via-cyan-600 to-indigo-700',
  'token.xmax.com': 'from-indigo-600 via-violet-600 to-fuchsia-700',
};

const THUMB_FALLBACKS: readonly string[] = [];

export interface BrandMetaOverride {
  brandKey?: string;
  title: string;
  description: string;
  gradient: string;
  officialPathPatterns?: string[];
  ogImage?: string;
  twitterImage?: string;
  firstContentImage?: string;
}

function normalizePath(path: string): string {
  return path.replace(/\/+$/, '') || '/';
}

function pathMatches(u: URL, patterns: string[] | undefined): boolean {
  if (!patterns || patterns.length === 0) return false;
  const path = normalizePath(u.pathname);
  for (const p of patterns) {
    const np = normalizePath(p);
    if (path === np) return true;
    if (np.endsWith('*') && path.startsWith(np.slice(0, -1))) return true;
  }
  return false;
}

function decodeSegment(seg: string | null | undefined): string | null {
  if (!seg) return null;
  try {
    return decodeURIComponent(seg).trim();
  } catch {
    return seg.trim();
  }
}

export const BRAND_META: Record<string, BrandMetaOverride> = {
  'xbelievers.com': {
    title: 'XBelievers | XMAX 实时市场情报中心',
    description:
      '一屏聚合 XMAX 行情/K线、SEC 公告、马斯克系新闻与全球机构持股。为 4K 挂墙大屏优化，自动更新，长期稳定展示。',
    gradient: 'from-emerald-600 via-teal-700 to-slate-900',
  },
  'xmax.com': {
    title: 'XMax 官方网站｜下一代 AI 计算基础设施',
    description:
      'XMax 官网：AI 集群、Token 经济、产品矩阵与合作伙伴一站式入口，了解 XMax Inc（NASDAQ: XMAX）最新业务进展。',
    gradient: 'from-sky-600 via-indigo-600 to-violet-700',
  },
  'ai.xmax.com': {
    title: 'XMax AI｜面向开发者的 AI 计算平台',
    description:
      'XMax AI 开放平台：GPU 集群调度、大模型推理 API 与 Agent 工具链，让开发者以更低成本构建可扩展的 AI 应用。',
    gradient: 'from-sky-500 via-cyan-600 to-indigo-700',
  },
  'token.xmax.com': {
    title: 'XMax Token｜XMAX 产品与生态中心',
    description:
      'XMax Token 产品页：XMAX 代币应用场景、生态伙伴与持有者权益说明，查看代币经济模型与最新公告。',
    gradient: 'from-indigo-600 via-violet-600 to-fuchsia-700',
  },
  'notion.so': {
    title: 'XMax (NASDAQ: XMAX) · 官方资料中心',
    description:
      '投资者关系一站式入口：定期报告、财报日历、公司介绍、路演回放、常见问题 FAQ 与合规披露文档集中管理。',
    gradient: 'from-slate-900 via-indigo-900 to-violet-900',
  },
  'app.notion.com': {
    title: 'XMax (NASDAQ: XMAX) · 官方资料中心',
    description:
      '投资者关系一站式入口：定期报告、财报日历、公司介绍、路演回放、常见问题 FAQ 与合规披露文档集中管理。',
    gradient: 'from-slate-900 via-indigo-900 to-violet-900',
  },
  'bloomberg.com': {
    title: 'Bloomberg｜XMAX 最新行情与公司新闻',
    description:
      '来自 Bloomberg 的 XMax Inc (NASDAQ: XMAX) 实时报价、新闻深度、分析师评级与全球资本市场相关报道。',
    gradient: 'from-orange-600 to-amber-800',
  },
  'x.com': {
    title: 'X / Twitter @XmaxGlobal · 全球官方发布主阵地',
    description:
      '关注 XMax 官方 X 账号，第一时间获取公司公告、AI 技术动态、投资者关系事件与马斯克系生态联动。',
    gradient: 'from-slate-900 via-slate-800 to-sky-700',
    officialPathPatterns: ['/XmaxGlobal', '/XmaxGlobal/*'],
  },
  'reddit.com': {
    title: 'Reddit · r/XmaxGlobal 社区讨论',
    description:
      'Reddit XmaxGlobal 社区：与全球投资者和爱好者交流 XMAX 行情观点、生态进展与长期价值讨论。',
    gradient: 'from-orange-500 via-rose-500 to-red-600',
    officialPathPatterns: ['/r/XmaxGlobal', '/r/XmaxGlobal/*'],
  },
  'youtube.com': {
    title: 'XMax YouTube｜路演与产品演示视频',
    description: 'XMax 官方 YouTube 频道：路演回放、产品 Demo、AI 技术分享与管理层采访视频一站观看。',
    gradient: 'from-rose-600 via-red-600 to-red-700',
  },
  'linkedin.com': {
    title: 'XMax LinkedIn 官方主页',
    description: '在 LinkedIn 关注 XMax，了解团队招聘、企业文化、企业合作与最新职业机会。',
    gradient: 'from-sky-700 via-blue-700 to-indigo-800',
    officialPathPatterns: ['/company/*xmax*', '/in/xmax'],
  },
  'q.futunn.com': {
    title: '富途牛牛 · XMax 官方社区主页',
    description: '富途牛牛 XMax 官方账号：中文投资者社区，获取财报解读、互动问答与最新动态。',
    gradient: 'from-emerald-500 via-green-600 to-teal-700',
  },
  'laohu8.com': {
    title: '老虎证券 · XMax 官方个人主页',
    description: '老虎证券 XMax 官方号：面向华语投资者的动态发布、交流互动与交易相关内容。',
    gradient: 'from-amber-500 via-orange-600 to-red-700',
  },
  'hstong.com': {
    title: '华盛通 · XMax 官方社区主页',
    description: '华盛通 XMax 官方社区：港美股投资者交流、行情解读与官方动态聚合。',
    gradient: 'from-sky-600 via-blue-600 to-indigo-700',
  },
  'news.qq.com': {
    title: '腾讯新闻 · 要闻资讯',
    description: '腾讯新闻（news.qq.com）：实时要闻、财经资讯、科技热点与深度报道一站式阅读。',
    gradient: 'from-sky-600 via-blue-600 to-slate-800',
  },
  'qq.com': {
    title: '腾讯网 · 综合资讯门户',
    description: '腾讯网旗下频道：新闻资讯、财经行情、体育娱乐与科技数码综合内容聚合。',
    gradient: 'from-sky-600 via-blue-700 to-slate-900',
  },
  'sina.com.cn': {
    title: '新浪财经/新浪新闻 · 综合资讯',
    description: '新浪旗下财经、新闻频道：上市公司公告、宏观经济、市场行情与行业报道。',
    gradient: 'from-rose-600 via-red-600 to-amber-700',
  },
  'finance.sina.com.cn': {
    title: '新浪财经 · A股 / 港美股行情资讯',
    description: '新浪财经：股票行情、公司公告、财报解读、宏观经济与券商研报一站式阅读。',
    gradient: 'from-rose-600 via-red-600 to-orange-700',
  },
  '36kr.com': {
    title: '36 氪 · 新商业与科技媒体',
    description: '36 氪：科技创业、新消费、AI 与产业互联网趋势报道、公司情报与创投观察。',
    gradient: 'from-blue-600 via-indigo-600 to-violet-700',
  },
  'wallstreetcn.com': {
    title: '华尔街见闻 · 全球财经资讯',
    description: '华尔街见闻：全球宏观经济、资本市场、大宗商品与外汇行情实时资讯。',
    gradient: 'from-slate-800 via-slate-700 to-amber-700',
  },
  'cls.cn': {
    title: '财联社 · 电报与财经快讯',
    description: '财联社：7x24 财经电报、公司公告解读、A股/港美股行情与政策快讯。',
    gradient: 'from-rose-700 via-red-700 to-slate-800',
  },
  'caixin.com': {
    title: '财新网 · 财经与政经深度报道',
    description: '财新传媒：经济金融、商业产业、公共政策与社会议题深度调查与独家报道。',
    gradient: 'from-slate-900 via-slate-800 to-emerald-800',
  },
  'yicai.com': {
    title: '第一财经 · 财经媒体资讯',
    description: '第一财经：公司、市场、宏观、科技与消费领域的财经新闻与视频报道。',
    gradient: 'from-rose-700 via-orange-600 to-amber-600',
  },
  'bilibili.com': {
    title: '哔哩哔哩 · 视频与社区',
    description: '哔哩哔哩 B 站：UP 主原创视频、番剧、动画、科技评测与生活内容社区。',
    gradient: 'from-sky-500 via-pink-500 to-indigo-500',
  },
  'weibo.com': {
    title: '微博 · 社交与热点话题',
    description: '微博：实时热点、明星动态、新闻话题与用户讨论社交平台。',
    gradient: 'from-rose-500 via-red-500 to-orange-600',
  },
  'zhihu.com': {
    title: '知乎 · 问答与知识社区',
    description: '知乎：高质量问答、专栏文章与行业经验分享的中文知识社区。',
    gradient: 'from-sky-600 via-blue-700 to-indigo-800',
  },
  'baidu.com': {
    title: '百度 · 搜索与资讯',
    description: '百度搜索与百度资讯：中文网页搜索、热点新闻与信息聚合入口。',
    gradient: 'from-sky-500 via-blue-600 to-slate-800',
  },
  'baidu.baidu.com': {
    title: '百家号 · 百度内容创作平台',
    description: '百家号创作者文章与百度资讯流内容分发阅读。',
    gradient: 'from-sky-500 via-blue-600 to-indigo-700',
  },
  'xueqiu.com': {
    title: '雪球 · 投资者社区',
    description: '雪球：A股、港美股投资者社区，个股讨论、策略分享与行情追踪。',
    gradient: 'from-sky-600 via-indigo-600 to-violet-700',
  },
  'eastmoney.com': {
    title: '东方财富 · 财经门户与行情',
    description: '东方财富网：股票行情、基金理财、股吧社区与财经资讯一站式平台。',
    gradient: 'from-rose-600 via-red-600 to-amber-700',
  },
  'sohu.com': {
    title: '搜狐 · 综合门户资讯',
    description: '搜狐：新闻、财经、体育、娱乐与科技资讯综合内容门户。',
    gradient: 'from-rose-600 via-orange-600 to-amber-600',
  },
  '163.com': {
    title: '网易 · 综合新闻与财经',
    description: '网易旗下新闻、财经、科技等综合频道内容聚合。',
    gradient: 'from-rose-600 via-red-700 to-slate-800',
  },
  'thepaper.cn': {
    title: '澎湃新闻 · 时事与财经报道',
    description: '澎湃新闻：时事政治、财经商业、文化思想与国际要闻深度报道。',
    gradient: 'from-slate-800 via-slate-700 to-sky-800',
  },
  'jiemian.com': {
    title: '界面新闻 · 商业财经媒体',
    description: '界面新闻：商业、财经、科技、地产与消费行业原创报道与深度调查。',
    gradient: 'from-sky-700 via-blue-800 to-indigo-900',
  },
  'chinanews.com': {
    title: '中新网 · 综合新闻报道',
    description: '中国新闻网：国内外时事、社会、财经、港澳台侨与文化综合资讯。',
    gradient: 'from-rose-700 via-red-700 to-slate-800',
  },
  'people.com.cn': {
    title: '人民网 · 权威新闻资讯',
    description: '人民网：人民日报旗下权威新闻媒体，时政、财经、社会与理论报道。',
    gradient: 'from-rose-700 via-red-700 to-amber-700',
  },
  'xinhuanet.com': {
    title: '新华网 · 国家通讯社新闻',
    description: '新华社主办新华网：国内外时政、财经、社会与科技权威报道。',
    gradient: 'from-rose-700 via-red-700 to-indigo-900',
  },
  'cnbc.com': {
    title: 'CNBC · Business News & Market',
    description: 'CNBC: Latest business, stock market, financial news and global economy updates.',
    gradient: 'from-sky-600 via-blue-700 to-slate-900',
  },
  'reuters.com': {
    title: 'Reuters · World News & Finance',
    description: 'Reuters: Breaking world news, business, finance, politics and market coverage.',
    gradient: 'from-slate-800 via-slate-700 to-orange-700',
  },
  'nasdaq.com': {
    title: 'Nasdaq · Stock Market & Quotes',
    description: 'Nasdaq official: Stock quotes, market news, IPOs, index performance and investor tools.',
    gradient: 'from-sky-600 via-blue-700 to-indigo-800',
  },
  'yahoo.com': {
    title: 'Yahoo · News, Finance & Mail',
    description: 'Yahoo home: Daily news, Yahoo Finance stock quotes, sports and entertainment.',
    gradient: 'from-fuchsia-600 via-purple-700 to-indigo-800',
  },
  'finance.yahoo.com': {
    title: 'Yahoo Finance · Stock Quotes & News',
    description: 'Yahoo Finance: Free stock quotes, portfolio, crypto, market news and personal finance.',
    gradient: 'from-fuchsia-600 via-violet-700 to-indigo-800',
  },
  'wsj.com': {
    title: 'The Wall Street Journal · Business & Finance',
    description: 'WSJ: Breaking news, business analysis, financial markets, tech and opinion.',
    gradient: 'from-slate-900 via-slate-800 to-amber-800',
  },
  'ft.com': {
    title: 'Financial Times · Global Business News',
    description: 'Financial Times: World economy, markets, business, banking and technology news.',
    gradient: 'from-rose-700 via-orange-600 to-amber-600',
  },
  'techcrunch.com': {
    title: 'TechCrunch · Startup & Tech News',
    description: 'TechCrunch: Startup news, technology reviews, venture capital and product launches.',
    gradient: 'from-emerald-600 via-green-700 to-teal-800',
  },
  'theverge.com': {
    title: 'The Verge · Tech & Science',
    description: 'The Verge: Tech reviews, science news, AI, gadgets and culture coverage.',
    gradient: 'from-fuchsia-600 via-violet-600 to-indigo-700',
  },
  'wired.com': {
    title: 'Wired · Tech, Science & Culture',
    description: 'Wired: Deep dives on AI, technology, science, business and cultural shifts.',
    gradient: 'from-slate-900 via-rose-700 to-amber-600',
  },
  'arxiv.org': {
    title: 'arXiv · Open Access Papers',
    description: 'arXiv.org: Open-access preprints in physics, math, CS, biology, finance and AI.',
    gradient: 'from-slate-800 via-slate-700 to-sky-900',
  },
  'github.com': {
    title: 'GitHub · Where the world builds software',
    description: 'GitHub: Code hosting, collaboration, open source repositories and developer tools.',
    gradient: 'from-slate-900 via-slate-800 to-slate-700',
  },
  'medium.com': {
    title: 'Medium · Stories & Ideas',
    description: 'Medium: Long-form articles, technology essays and expert opinions from creators.',
    gradient: 'from-slate-800 via-emerald-700 to-teal-800',
  },
};

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

export function extractFirstUrl(text: string): string | null {
  const clean = sanitizeInput(text);
  const matches = clean.match(URL_REGEX);
  if (!matches || matches.length === 0) return null;
  return stripTrailingPunctuation(matches[0]);
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

function stablePick<T>(arr: readonly T[], seed: string): T {
  if (arr.length === 0) throw new Error('empty array');
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[hash % arr.length];
}

export function pickDomainGradient(domain: string): string {
  const exact = BRAND_META[domain]?.gradient;
  if (exact) return exact;
  const key = Object.keys(DOMAIN_BG).find((k) => domain.includes(k));
  return key ? DOMAIN_BG[key] : 'from-slate-800 via-slate-700 to-slate-900';
}

export function faviconUrlForDomain(domain: string, size = 512): string {
  const host = (domain || '').replace(/^www\./, '').trim();
  if (!host || host === 'external.site') {
    return `https://www.google.com/s2/favicons?sz=${size}&domain=example.com`;
  }
  const sz = Math.max(16, size | 0);
  return `https://www.google.com/s2/favicons?sz=${sz}&domain=${encodeURIComponent(host)}`;
}

export function duckduckgoFaviconUrl(domain: string): string {
  const host = (domain || '').replace(/^www\./, '').trim();
  if (!host || host === 'external.site') return '';
  return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(host)}.ico`;
}

export interface ThumbnailFallbackChain {
  candidates: Array<{ url: string; label: string }>;
  googleFavicon: string;
  duckFavicon: string;
}

const FAVICON_URL_PAT = /google\.com\/s2\/favicons|duckduckgo\.com\/ip3\//i;

export function buildThumbnailFallbackChain(preview: WebpagePreview): ThumbnailFallbackChain {
  const pageUrl = preview.url || '';
  const domain = (preview.domain || '').trim();
  const out: Array<{ url: string; label: string }> = [];
  const push = (label: string, v: string | null | undefined) => {
    if (!v) return;
    const u = resolveAbsoluteUrl(pageUrl, v);
    if (!u) return;
    if (label === 'thumbnail' && FAVICON_URL_PAT.test(u)) return;
    out.push({ label, url: u });
  };
  push('thumbnail', preview.thumbnail);
  push('og:image', preview.ogImage);
  push('twitter:image', preview.twitterImage);
  push('firstContentImage', preview.firstContentImage);
  const googleFav = faviconUrlForDomain(domain, 512);
  const duckFav = duckduckgoFaviconUrl(domain);
  return {
    candidates: out,
    googleFavicon: googleFav,
    duckFavicon: duckFav,
  };
}

export function extractHostname(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '').trim();
    if (host && host !== 'www') return host;
  } catch {
    /* ignore */
  }
  const m = url.match(/^https?:\/\/(?:www\.)?([^/?#]+)/i);
  return (m?.[1] ?? 'external.site').trim() || 'external.site';
}

export function findBrandMeta(domain: string): BrandMetaOverride | null {
  if (BRAND_META[domain]) return BRAND_META[domain];
  const keys = Object.keys(BRAND_META);
  const exactSuffix = keys.find((k) => domain.endsWith(`.${k}`) || k.endsWith(`.${domain}`));
  if (exactSuffix) return BRAND_META[exactSuffix];
  const fuzzy = keys.find((k) => domain.includes(k) || k.includes(domain));
  return fuzzy ? BRAND_META[fuzzy] : null;
}

function deriveSocialPreview(
  u: URL,
  domain: string,
  brand: BrandMetaOverride
): { title: string; description: string } {
  const parts = u.pathname.replace(/^\/+/, '').split('/');
  const segs = parts.filter(Boolean);

  if (domain === 'x.com' || domain === 'twitter.com') {
    const user = decodeSegment(segs[0]);
    const statusId = decodeSegment(segs[2]) || decodeSegment(segs[1]);
    if (user) {
      if (segs[1] && /^status(es)?$/i.test(segs[1]) && statusId) {
        return {
          title: safeText(`@${user} 发布的一条推文 · X / Twitter`, `X 推文 · ${user}`, 120),
          description: safeText(
            `来自 @${user} 在 X（Twitter）上发布的一条帖子，点击跳转查看完整内容与互动讨论。`,
            `在 X / Twitter 查看 @${user} 发布的内容。`,
            220
          ),
        };
      }
      return {
        title: safeText(`${user} (@${user}) · X / Twitter 主页`, `X 账号主页 · @${user}`, 120),
        description: safeText(
          `点击前往 X / Twitter 查看 @${user} 的个人主页、最新推文与动态，关注互动。`,
          `在 X / Twitter 关注 @${user} 的最新动态。`,
          220
        ),
      };
    }
  }

  if (domain === 'reddit.com' || domain.endsWith('.reddit.com')) {
    const subreddit = decodeSegment(segs[0] === 'r' ? segs[1] : null);
    const user = decodeSegment(segs[0] === 'u' || segs[0] === 'user' ? segs[1] : null);
    if (subreddit) {
      return {
        title: safeText(`Reddit · r/${subreddit} 社区讨论`, `Reddit 社区 · r/${subreddit}`, 120),
        description: safeText(
          `在 Reddit 加入 r/${subreddit} 社区，与全球爱好者交流行情观点、生态进展与讨论。`,
          `访问 Reddit 社区 r/${subreddit} 查看热门讨论。`,
          220
        ),
      };
    }
    if (user) {
      return {
        title: safeText(`Reddit · u/${user} 个人主页`, `Reddit 用户 · u/${user}`, 120),
        description: safeText(
          `在 Reddit 查看 u/${user} 的个人主页、发帖历史与 karma 数据。`,
          `访问 Reddit 用户 u/${user} 主页。`,
          220
        ),
      };
    }
  }

  if (domain === 'youtube.com' || domain === 'm.youtube.com' || domain === 'www.youtube.com') {
    if (segs[0] === 'channel' || segs[0] === '@') {
      const name = decodeSegment(segs[0] === 'channel' ? segs[1] : segs.slice(1).join('/'));
      if (name) {
        return {
          title: safeText(
            `YouTube · ${segs[0] === 'channel' ? '频道' : '创作者'} ${name}`,
            `YouTube 频道 · ${name}`,
            120
          ),
          description: safeText(
            `在 YouTube 访问 ${name} 的视频频道，观看路演、产品演示与分享内容。`,
            `访问 YouTube 频道 ${name} 观看视频。`,
            220
          ),
        };
      }
    }
    const v =
      decodeSegment(
        (u.hash ? u.hash.slice(1) : '')
          .split('&')
          .find((x) => x.startsWith('v='))
          ?.slice(2)
      ) || decodeSegment(u.searchParams.get('v'));
    if (v) {
      return {
        title: safeText(`YouTube · 视频播放`, `YouTube 视频`, 120),
        description: safeText(
          `在 YouTube 观看该视频，点击跳转播放页查看完整内容与互动。`,
          `前往 YouTube 查看视频。`,
          220
        ),
      };
    }
  }

  if (domain === 'linkedin.com' || domain.endsWith('.linkedin.com')) {
    const handle = decodeSegment(segs[0] === 'in' ? segs[1] : null);
    const company = decodeSegment(segs[0] === 'company' ? segs[1] : null);
    if (handle) {
      return {
        title: safeText(`LinkedIn · ${handle} 个人主页`, `LinkedIn 个人档案 · ${handle}`, 120),
        description: safeText(
          `在 LinkedIn 查看 ${handle} 的职业档案、经历与联系方式。`,
          `访问 LinkedIn 查看该职业档案。`,
          220
        ),
      };
    }
    if (company) {
      return {
        title: safeText(`LinkedIn · ${company} 公司主页`, `LinkedIn 企业页 · ${company}`, 120),
        description: safeText(
          `在 LinkedIn 关注 ${company} 公司主页，了解招聘、企业文化与最新资讯。`,
          `访问 LinkedIn 查看该公司主页。`,
          220
        ),
      };
    }
  }

  return {
    title: safeText(brand.title, `${domain} 官方链接`, 140),
    description: safeText(brand.description, '', 240),
  };
}

export function fakePreviewFromUrl(url: string): WebpagePreview {
  try {
    const u = new URL(url);
    const domain = extractHostname(url);
    const brand = findBrandMeta(domain);
    if (brand) {
      const hasPathGuard = Array.isArray(brand.officialPathPatterns) && brand.officialPathPatterns.length > 0;
      const useOfficialTitles = !hasPathGuard || pathMatches(u, brand.officialPathPatterns);
      const derived = !useOfficialTitles ? deriveSocialPreview(u, domain, brand) : null;
      const title = useOfficialTitles ? brand.title : (derived?.title ?? brand.title);
      const description = useOfficialTitles ? brand.description : (derived?.description ?? brand.description);
      const pageUrl = safeText(u.toString(), url);
      const googleFav = faviconUrlForDomain(domain, 512);
      const fallbackDebug: WebpagePreview['__debug'] = {
        usedFallback: brand.brandKey || domain,
      };
      return {
        url: pageUrl,
        title: safeText(title, `${domain} 官方链接`, 140),
        description: safeText(description, '', 240),
        domain,
        ogImage: resolveAbsoluteUrl(pageUrl, brand.ogImage || null) || undefined,
        twitterImage: resolveAbsoluteUrl(pageUrl, brand.twitterImage || null) || undefined,
        firstContentImage: resolveAbsoluteUrl(pageUrl, brand.firstContentImage || null) || undefined,
        thumbnail: googleFav,
        __placeholderGradient: brand.gradient,
        __debug: fallbackDebug,
      };
    }
    const pathRaw = u.pathname.slice(1).replace(/[-_./]+/g, ' ').trim();
    const title = safeText(
      pathRaw ? `${domain} · ${pathRaw}` : `${domain} 官方链接`,
      `分享来自 ${domain} 的链接`,
      120
    );
    const searchPart = u.search
      ? u.search.replace(/[?&=]/g, ' ').replace(/\s+/g, ' ').trim()
      : '';
    const description = safeText(
      searchPart
        ? `${u.pathname} · ${searchPart}`
        : ``,
      ``,
      220
    );
    const pageUrl = safeText(u.toString(), url);
    const googleFav = faviconUrlForDomain(domain, 512);
    return {
      url: pageUrl,
      title,
      description,
      domain,
      thumbnail: googleFav,
      __placeholderGradient: pickDomainGradient(domain),
      __debug: { usedFallback: 'domain-fallback', failedUrls: [] },
    };
  } catch (err) {
    console.warn('[IRPR] 链接解析失败（仍做兜底渲染）：', url, err);
    const fallbackDomain = extractHostname(url);
    const fallbackBrand = findBrandMeta(fallbackDomain);
    const googleFav = faviconUrlForDomain(fallbackDomain, 512);
    return {
      url: safeText(url, 'about:blank'),
      title: fallbackBrand
        ? safeText(fallbackBrand.title, '分享外部链接', 120)
        : safeText(url, '分享外部链接', 80),
      description: fallbackBrand
        ? safeText(fallbackBrand.description, '无法解析该链接的元信息，点击仍可跳转到原始地址。', 220)
        : '无法解析该链接的元信息，点击仍可跳转到原始地址。',
      domain: fallbackDomain,
      thumbnail: googleFav,
      __placeholderGradient: fallbackBrand?.gradient ?? pickDomainGradient(fallbackDomain),
      __debug: { usedFallback: 'parse-error', failedUrls: [] },
    };
  }
}

function normalizeUrlForCompare(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/+$/, '');
    return `${u.hostname.toLowerCase()}${path}${u.search}`;
  } catch {
    return url.trim().replace(/\/+$/, '').toLowerCase();
  }
}

function stripUrlFromText(text: string, urlToStrip: string | null): string {
  if (!urlToStrip) return sanitizeInput(text);
  let raw = sanitizeInput(text);
  const targetNorm = normalizeUrlForCompare(urlToStrip);
  const escaped = urlToStrip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  raw = raw.replace(new RegExp(escaped, 'g'), ' ');
  LINK_RE.lastIndex = 0;
  raw = raw.replace(LINK_RE, (match) => {
    const cleaned = stripTrailingPunctuation(match);
    if (cleaned === urlToStrip) return ' ';
    if (normalizeUrlForCompare(cleaned) === targetNorm) return ' ';
    return match;
  });
  raw = raw.replace(/[ \t\u00A0]+\n/g, '\n');
  raw = raw.replace(/\n[ \t\u00A0]+/g, '\n');
  raw = raw.replace(/[ \t\u00A0]{2,}/g, ' ');
  raw = raw.replace(/\n{3,}/g, '\n\n');
  return raw.trim();
}

function stripAllUrls(text: string): string {
  let raw = sanitizeInput(text);
  LINK_RE.lastIndex = 0;
  raw = raw.replace(LINK_RE, () => ' ');
  raw = raw.replace(/[ \t\u00A0]+\n/g, '\n');
  raw = raw.replace(/\n[ \t\u00A0]+/g, '\n');
  raw = raw.replace(/[ \t\u00A0]{2,}/g, ' ');
  raw = raw.replace(/\n{3,}/g, '\n\n');
  return raw.trim();
}

export function extractAndStripUrls(
  content: string | null | undefined,
  existingWebpage: WebpagePreview | null | undefined,
  options?: { stripAll?: boolean }
): { strippedContent: string; derivedWebpage: WebpagePreview | null } {
  const text = sanitizeInput(content);
  const existingUrl = existingWebpage?.url ?? null;
  const fallbackUrl = extractFirstUrl(text);
  const derived = existingWebpage
    ? (existingWebpage as WebpagePreview)
    : fallbackUrl
      ? fakePreviewFromUrl(fallbackUrl)
      : null;
  const shouldStripAll = options?.stripAll !== false;
  const strippedContent = shouldStripAll ? stripAllUrls(text) : stripUrlFromText(text, existingUrl ?? fallbackUrl ?? derived?.url ?? null);
  return { strippedContent, derivedWebpage: derived };
}

export default function Linkify({
  text,
  onClickCashtag,
  onClickHashtag,
}: {
  text: string;
  onClickCashtag?: (tag: string) => void;
  onClickHashtag?: (tag: string) => void;
}) {
  if (!text) return null;
  const parts: Array<{ type: 'text' | 'link' | 'cashtag' | 'hashtag'; value: string }> = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  COMBINED_RE.lastIndex = 0;
  while ((m = COMBINED_RE.exec(text)) !== null) {
    if (m.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, m.index) });
    }
    const token = m[0];
    if (CASHTAG_RE.test(token)) {
      CASHTAG_RE.lastIndex = 0;
      const tag = token.slice(1).toUpperCase();
      parts.push({
        type: 'cashtag',
        value: `$${tag}`,
      });
    } else if (HASHTAG_RE.test(token)) {
      HASHTAG_RE.lastIndex = 0;
      parts.push({ type: 'hashtag', value: token });
    } else {
      const rawLink = stripTrailingPunctuation(token);
      try {
        const u = new URL(rawLink);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
          parts.push({ type: 'text', value: rawLink });
        } else {
          parts.push({ type: 'link', value: rawLink });
        }
      } catch {
        parts.push({ type: 'text', value: rawLink });
      }
    }
    lastIndex = m.index + token.length;
  }
  if (lastIndex < text.length) parts.push({ type: 'text', value: text.slice(lastIndex) });

  return (
    <span className="whitespace-pre-wrap break-words text-[14.5px] leading-relaxed text-slate-800">
      {parts.map((p, idx) => {
        if (p.type === 'text') {
          return <span key={idx}>{p.value}</span>;
        }
        if (p.type === 'cashtag') {
          return (
            <a
              key={idx}
              href={`https://x.com/search?q=${encodeURIComponent(p.value)}&src=cashtag_click`}
              target="_blank"
              rel="noreferrer noopener"
              onClick={(e) => {
                if (onClickCashtag) {
                  e.preventDefault();
                  onClickCashtag(p.value);
                }
              }}
              className="font-bold text-sky-600 hover:text-sky-700 underline-offset-2 hover:underline"
            >
              {p.value}
            </a>
          );
        }
        if (p.type === 'hashtag') {
          return (
            <a
              key={idx}
              href={`https://x.com/hashtag/${encodeURIComponent(p.value.slice(1))}?src=hashtag_click`}
              target="_blank"
              rel="noreferrer noopener"
              onClick={(e) => {
                if (onClickHashtag) {
                  e.preventDefault();
                  onClickHashtag(p.value);
                }
              }}
              className="font-medium text-sky-600 hover:text-sky-700 underline-offset-2 hover:underline"
            >
              {p.value}
            </a>
          );
        }
        return (
          <a
            key={idx}
            href={p.value}
            target="_blank"
            rel="noreferrer noopener"
            className="text-sky-600 hover:text-sky-700 underline underline-offset-2 break-all"
          >
            {p.value}
          </a>
        );
      })}
    </span>
  );
}

export { CASHTAG_RE, HASHTAG_RE };
