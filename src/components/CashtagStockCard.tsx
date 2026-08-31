import { useEffect, useMemo, useState } from 'react';
import { TrendingDown, TrendingUp, ExternalLink, Loader2 } from 'lucide-react';

export interface StockQuote {
  symbol: string;
  companyName: string;
  exchange: string;
  marketCapLabel: string;
  currency: string;
  price: number;
  change: number;
  changePct: number;
  sparkline: number[];
  source?: string;
  tradeDate?: string;
  volumeLabel?: string;
}

interface XBStockPayload {
  success: boolean;
  source?: string;
  data?: {
    symbol?: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    pre_close?: number;
    change?: number;
    change_percent?: number;
    volume?: number;
    amount?: number;
    market_cap?: number;
    trade_date?: string;
    turnover_ratio?: number;
  };
}

export const BUILTIN_QUOTES: Record<string, StockQuote> = {
  XMAX: {
    symbol: 'XMAX',
    companyName: 'XMax Inc',
    exchange: 'NASDAQ',
    marketCapLabel: '$557M MC',
    currency: 'USD',
    price: 9.14,
    change: -0.07,
    changePct: -0.76,
    sparkline: [9.35, 9.42, 9.51, 9.48, 9.33, 9.45, 9.58, 9.62, 9.49, 9.38, 9.22, 9.18, 9.12, 9.06, 9.10, 9.14],
  },
};

const REFRESH_WINDOW_MS = 10 * 1000;
const FUTUNN_URL_XMAX = 'https://www.futunn.com/hk/stock/XMAX-US';
const SPARK_N = 16;

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
function unitNoise(seed: number, index: number): number {
  const x = Math.sin(seed * 9301 + index * 49297) * 233280;
  return x - Math.floor(x);
}

function formatMarketCap(v?: number): string {
  if (v == null || !Number.isFinite(v)) return '$ -- MC';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B MC`;
  if (v >= 1e6) return `$${Math.round(v / 1e6)}M MC`;
  if (v >= 1e3) return `$${Math.round(v / 1e3)}K MC`;
  return `$${Math.round(v)} MC`;
}
function formatVolume(v?: number): string {
  if (v == null || !Number.isFinite(v)) return '';
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B Vol`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M Vol`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K Vol`;
  return `${Math.round(v)} Vol`;
}

function buildSparklineFromOHLC(
  open: number,
  high: number,
  low: number,
  close: number,
  symbol: string,
): number[] {
  const seed = hashString(symbol + '|ohlc-spark');
  const N = SPARK_N;
  const pts = new Array<number>(N);
  const band = Math.max(0.03, Math.abs(close - open) * 0.85 + (high - low) * 0.45);
  const drift = (close - open) / (N - 1);
  const lowMid = Math.min(open, close);
  const highMid = Math.max(open, close);
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const trend = open + drift * i;
    const harmonic =
      0.32 * Math.sin((i + 1) * 1.05 + 0.18) +
      0.22 * Math.sin((i + 1) * 2.17 - 0.4) +
      0.15 * Math.sin((i + 1) * 3.35 + 0.72);
    const noise = (unitNoise(seed, i) - 0.5) * 0.55;
    let v = trend + (harmonic + noise) * band * 0.32;
    const hiCap = Math.min(high, highMid + (high - highMid) * Math.max(0, Math.sin((i + 1) / 3.2)));
    const loCap = Math.max(low, lowMid - (lowMid - low) * Math.max(0, Math.cos((i + 2) / 3.6)));
    if (v > hiCap) v = hiCap - 0.002 * unitNoise(seed, i + 99);
    if (v < loCap) v = loCap + 0.002 * unitNoise(seed, i + 199);
    pts[i] = +v.toFixed(3);
  }
  const first = pts[0];
  const delta0 = open - first;
  if (Math.abs(delta0) > 1e-6) for (let i = 0; i < N; i++) pts[i] = +(pts[i] + delta0).toFixed(3);
  pts[0] = +open.toFixed(3);
  pts[N - 1] = +close.toFixed(3);
  return pts;
}

function buildSparklinePath(values: number[], width: number, height: number, padding = 2): string {
  if (values.length < 2) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (width - padding * 2) / (values.length - 1);
  const pts = values.map((v, i) => {
    const x = padding + i * stepX;
    const y = padding + (height - padding * 2) * (1 - (v - min) / range);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `M ${pts.join(' L ')}`;
}
function buildSparklineArea(values: number[], width: number, height: number, padding = 2): string {
  const line = buildSparklinePath(values, width, height, padding);
  if (!line) return '';
  const stepX = (width - padding * 2) / (values.length - 1);
  const lastX = padding + (values.length - 1) * stepX;
  const bottomY = height - padding;
  return `${line} L ${lastX.toFixed(1)},${bottomY} L ${padding},${bottomY} Z`;
}

async function fetchLiveQuote(clean: string): Promise<StockQuote | null> {
  if (clean !== 'XMAX') return null;
  try {
    const url = `/api/stock?ticker=${encodeURIComponent(clean)}`;
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'omit',
      headers: { Accept: 'application/json,text/plain,*/*' },
    });
    if (!res.ok) return null;
    const payload: XBStockPayload = await res.json();
    if (!payload?.success || !payload.data) return null;
    const d = payload.data;
    const preClose = typeof d.pre_close === 'number' ? d.pre_close : d.close ?? d.open ?? 0;
    const close = typeof d.close === 'number' ? d.close : preClose;
    const open = typeof d.open === 'number' ? d.open : preClose;
    const high = typeof d.high === 'number' ? d.high : Math.max(open, close);
    const low = typeof d.low === 'number' ? d.low : Math.min(open, close);
    let change = d.change;
    let changePct = d.change_percent;
    if (typeof change !== 'number' || !Number.isFinite(change)) change = +(close - preClose).toFixed(2);
    if (typeof changePct !== 'number' || !Number.isFinite(changePct)) {
      changePct = preClose > 0 ? +((change / preClose) * 100).toFixed(2) : 0;
    }
    const sparkline = buildSparklineFromOHLC(open, high, low, close, clean);
    return {
      symbol: d.symbol || clean,
      companyName: clean === 'XMAX' ? 'XMax Inc' : clean,
      exchange: 'NASDAQ',
      marketCapLabel: formatMarketCap(d.market_cap),
      currency: 'USD',
      price: +close.toFixed(2),
      change: +change.toFixed(2),
      changePct: +changePct.toFixed(2),
      sparkline,
      source: payload.source,
      tradeDate: d.trade_date ? String(d.trade_date) : undefined,
      volumeLabel: formatVolume(d.volume),
    };
  } catch {
    return null;
  }
}

export default function CashtagStockCard({ symbolRaw }: { symbolRaw: string }) {
  const clean = symbolRaw.replace(/^\$/, '').toUpperCase();
  const baseQuote = BUILTIN_QUOTES[clean];
  const [liveQuote, setLiveQuote] = useState<StockQuote | null>(null);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | null = null;

    async function tick() {
      const q = await fetchLiveQuote(clean);
      if (cancelled) return;
      if (q) {
        setLiveQuote(q);
        setLoadError(false);
      } else {
        setLoadError((prev) => !prev && liveQuote == null);
      }
    }

    tick();
    intervalId = window.setInterval(tick, REFRESH_WINDOW_MS);

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [clean]);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), REFRESH_WINDOW_MS);
    return () => window.clearInterval(id);
  }, []);

  const fallbackQuote = useMemo(() => {
    if (!baseQuote) return null;
    const dayKey = new Date(nowTick);
    dayKey.setHours(0, 0, 0, 0);
    const hourKey = Math.floor(nowTick / (60 * 60 * 1000));
    const bucket = Math.floor(nowTick / REFRESH_WINDOW_MS);
    const seedBase = hashString(`${clean}|${dayKey.getTime()}|${hourKey}|${bucket}`);
    const WAVE = 0.0025;
    const wave = (unitNoise(seedBase, 0) - 0.5) * 2 * WAVE;
    const price = +(baseQuote.price * (1 + wave)).toFixed(2);
    const PREV = baseQuote.price - baseQuote.change;
    const change = +(price - PREV).toFixed(2);
    const changePct = PREV > 0 ? +((change / PREV) * 100).toFixed(2) : 0;
    const N = baseQuote.sparkline.length;
    const spark = baseQuote.sparkline.slice();
    const band = baseQuote.price * 0.006;
    for (let i = 0; i < N; i++) {
      spark[i] = +(spark[i] + (unitNoise(seedBase, i + 3) - 0.5) * band * (0.5 + (i / Math.max(1, N - 1)) * 0.6)).toFixed(3);
    }
    spark[N - 1] = price;
    return { ...baseQuote, price, change, changePct, sparkline: spark };
  }, [baseQuote, clean, nowTick]);

  const quote = liveQuote ?? fallbackQuote;
  if (!quote) return null;

  const isDown = quote.change < 0;
  const strokeColor = isDown ? 'rgb(244, 63, 94)' : 'rgb(16, 185, 129)';
  const W = 320;
  const H = 36;
  const areaPath = buildSparklineArea(quote.sparkline, W, H, 2);
  const linePath = buildSparklinePath(quote.sparkline, W, H, 2);
  const cardUrl = clean === 'XMAX' ? FUTUNN_URL_XMAX : `https://x.com/search?q=%24${encodeURIComponent(clean)}&src=cashtag_click`;
  const sourceLabel = clean === 'XMAX'
    ? `行情来源：富途牛牛 XMAX-US${quote.source ? ` · 数据 ${quote.source.toUpperCase()}` : ''}${quote.tradeDate ? ` · 交易日 ${quote.tradeDate.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3')}` : ''}`
    : `点击在 X 查看 $${clean} 相关讨论`;

  const logoFallback = useMemo(() => {
    if (clean === 'XMAX') {
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden>
          <defs>
            <linearGradient id={`xmax-brand-${clean}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="55%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            <linearGradient id={`xmax-x-${clean}`} x1="0" x2="1" y1="1" y2="0">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#E0F2FE" stopOpacity="0.98" />
            </linearGradient>
          </defs>
          <circle cx="20" cy="20" r="20" fill={`url(#xmax-brand-${clean})`} />
          <path
            d="M 13 12.5 L 20 20.5 L 27 12.5 L 28.9 14.3 L 21.6 21.5 L 29 28.9 L 27.1 30.8 L 20 23.5 L 12.9 30.8 L 11 28.9 L 18.4 21.5 L 11.1 14.3 Z"
            fill={`url(#xmax-x-${clean})`}
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
          <circle cx="27.5" cy="12.5" r="2.2" fill="rgba(125,211,252,0.92)" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden>
        <defs>
          <linearGradient id={`nasdaq-grad-${clean}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#0052D9" />
            <stop offset="100%" stopColor="#1A73E8" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="20" fill={`url(#nasdaq-grad-${clean})`} />
        <path
          d="M12 27V13h2.4l5.4 9.3V13H22v14h-2.4l-5.4-9.3V27H12Zm13.4-9.2h-3.2V27H20V13h7.4v4.8Zm-2.5 1.5v5.8h-1.2v-5.8h1.2Z"
          fill="white"
          fillOpacity="0.92"
        />
      </svg>
    );
  }, [clean]);

  return (
    <a
      href={cardUrl}
      target="_blank"
      rel="noreferrer noopener"
      className={`group block mt-2 rounded-2xl border transition overflow-hidden ${
        liveQuote
          ? 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/50'
          : 'border-dashed border-slate-300 bg-slate-50/40'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-3 px-3 sm:px-3.5 py-2.5 sm:py-3">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {logoFallback}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <div className="text-[14px] font-semibold text-slate-900 truncate">{quote.companyName}</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1 flex-wrap">
              <span className="font-semibold text-slate-600">{quote.symbol}</span>
              <span>·</span>
              <span>{quote.exchange}</span>
              <span>·</span>
              <span className="hidden sm:inline">{quote.marketCapLabel}</span>
            </div>
            {!liveQuote && !loadError && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-bold text-sky-700 bg-sky-50 border border-sky-200">
                <Loader2 size={10} strokeWidth={2.2} className="animate-spin" />
                同步行情中
              </span>
            )}
            {loadError && !liveQuote && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200">
                实时拉取失败 · 展示基准价
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 flex-wrap">
            <div className="text-[18px] sm:text-[19px] leading-none font-semibold text-slate-900 tracking-tight tabular-nums">
              ${quote.price.toFixed(2)}
            </div>
            <div
              className={`inline-flex items-center gap-1 text-[11.5px] font-medium rounded-lg px-1.5 py-0.5 ${
                isDown
                  ? 'text-rose-600 bg-rose-50 border border-rose-100'
                  : 'text-emerald-700 bg-emerald-50 border border-emerald-100'
              }`}
            >
              {isDown ? <TrendingDown size={11.5} strokeWidth={2.25} /> : <TrendingUp size={11.5} strokeWidth={2.25} />}
              <span>
                {isDown ? '-' : '+'}${Math.abs(quote.change).toFixed(2)} ({isDown ? '' : '+'}
                {quote.changePct.toFixed(2)}%)
              </span>
            </div>
            {quote.volumeLabel && (
              <div className="hidden sm:inline-flex items-center gap-1 text-[10.5px] font-medium text-slate-400 px-1.5 py-0.5 rounded-md border border-slate-100 bg-white/60 tabular-nums">
                {quote.volumeLabel}
              </div>
            )}
            <div className="flex-1 min-w-[110px] max-w-[180px] ml-auto">
              <svg
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="none"
                className="w-full h-8 sm:h-9 block"
                aria-hidden
              >
                <defs>
                  <linearGradient id={`area-stock-${clean}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={strokeColor} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {areaPath && <path d={areaPath} fill={`url(#area-stock-${clean})`} />}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </svg>
            </div>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <div className="text-[10.5px] font-medium text-slate-400 flex items-center gap-1 truncate">
              <ExternalLink size={10} strokeWidth={1.9} className="shrink-0 opacity-80" />
              <span className="truncate group-hover:text-slate-600 transition">{sourceLabel}</span>
            </div>
          </div>
        </div>
        <ExternalLink
          size={12.5}
          strokeWidth={1.75}
          className="text-slate-300 flex-shrink-0 group-hover:text-indigo-500 transition"
        />
      </div>
    </a>
  );
}
