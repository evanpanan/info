import type { JSX } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Link2 } from 'lucide-react';
import type { WebpagePreview } from '../types/irpr';
import {
  buildThumbnailFallbackChain,
  duckduckgoFaviconUrl,
  faviconUrlForDomain,
  proxyImageUrl,
  resolveAbsoluteUrl,
} from './Linkify';

const BRAND_THUMB: Record<string, JSX.Element> = {
  'notion.com': (
    <svg viewBox="0 0 120 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="notionBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#111827" />
          <stop offset="55%" stopColor="#4338ca" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#notionBg)" />
      <g transform="translate(30 32)">
        <path
          d="M32 2 L56 2 C57 2 58 3 58 4 L58 54 C58 55 57 56 56 56 L10 56 C9 56 8 55 8 54 L8 12 C8 11 9 10 10 10 Z"
          fill="white"
          fillOpacity="0.92"
        />
        <path
          d="M18 20 L48 20 L48 48 L18 48 Z"
          fill="none"
          stroke="#4338ca"
          strokeWidth="3"
        />
        <path
          d="M22 28 L44 28 M22 34 L44 34 M22 40 L38 40"
          stroke="#312e81"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  ),
  'app.notion.com': (
    <svg viewBox="0 0 120 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="notionBgApp" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="55%" stopColor="#3730a3" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#notionBgApp)" />
      <g transform="translate(30 32)">
        <path
          d="M32 2 L56 2 C57 2 58 3 58 4 L58 54 C58 55 57 56 56 56 L10 56 C9 56 8 55 8 54 L8 12 C8 11 9 10 10 10 Z"
          fill="white"
          fillOpacity="0.92"
        />
        <path
          d="M18 20 L48 20 L48 48 L18 48 Z"
          fill="none"
          stroke="#a78bfa"
          strokeWidth="3"
        />
        <path
          d="M22 28 L44 28 M22 34 L44 34 M22 40 L38 40"
          stroke="#c4b5fd"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  ),
  'notion.so': (
    <svg viewBox="0 0 120 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="notionBgSo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0b1220" />
          <stop offset="60%" stopColor="#4338ca" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#notionBgSo)" />
      <g transform="translate(30 32)">
        <path
          d="M32 2 L56 2 C57 2 58 3 58 4 L58 54 C58 55 57 56 56 56 L10 56 C9 56 8 55 8 54 L8 12 C8 11 9 10 10 10 Z"
          fill="white"
          fillOpacity="0.92"
        />
        <path
          d="M18 20 L48 20 L48 48 L18 48 Z"
          fill="none"
          stroke="#c4b5fd"
          strokeWidth="3"
        />
        <path
          d="M22 28 L44 28 M22 34 L44 34 M22 40 L38 40"
          stroke="#e9d5ff"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  ),
  'bloomberg.com': (
    <svg viewBox="0 0 120 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="bbgBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c2d12" />
          <stop offset="55%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#bbgBg)" />
      <g transform="translate(22 28)" fill="white" fillOpacity="0.95">
        <rect x="0" y="0" width="16" height="14" rx="2" />
        <rect x="0" y="18" width="24" height="14" rx="2" />
        <rect x="0" y="36" width="34" height="14" rx="2" />
        <rect x="30" y="0" width="14" height="32" rx="2" />
        <rect x="48" y="0" width="14" height="50" rx="2" />
        <rect x="0" y="54" width="62" height="4" rx="2" opacity="0.7" />
      </g>
      <text
        x="60"
        y="108"
        textAnchor="middle"
        fontFamily="system-ui,'SF Pro Display',sans-serif"
        fontSize="11"
        fontWeight="700"
        fill="white"
        opacity="0.85"
        letterSpacing="2"
      >
        BLOOMBERG
      </text>
    </svg>
  ),
  'xbelievers.com': (
    <svg viewBox="0 0 120 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="xbBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#022c22" />
          <stop offset="45%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <radialGradient id="xbGlow" cx="0.25" cy="0.4" r="0.6">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#059669" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#022c22" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="120" height="120" fill="url(#xbBg)" />
      <rect width="120" height="120" fill="url(#xbGlow)" />
      <g transform="translate(16 20)" fill="white" fillOpacity="0.95">
        <path
          d="M18 4 L30 4 L30 22 L46 22 L46 34 L30 34 L30 56 L18 56 L18 34 L2 34 L2 22 L18 22 Z"
          fill="#10b981"
          fillOpacity="0.95"
        />
        <path
          d="M21 8 L27 8 L27 24 L43 24 L43 30 L27 30 L27 52 L21 52 L21 30 L5 30 L5 24 L21 24 Z"
          fill="white"
          fillOpacity="0.95"
        />
      </g>
      <g transform="translate(58 16)" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="0" y="0" width="46" height="28" rx="3" fill="#022c22" fillOpacity="0.55" stroke="#065f46" strokeOpacity="0.7" />
        <rect x="4" y="6" width="18" height="3" rx="1" fill="#10b981" fillOpacity="0.7" />
        <rect x="24" y="6" width="16" height="3" rx="1" fill="#34d399" fillOpacity="0.45" />
        <rect x="4" y="13" width="30" height="2" rx="1" fill="#a7f3d0" fillOpacity="0.35" />
        <rect x="4" y="18" width="24" height="2" rx="1" fill="#a7f3d0" fillOpacity="0.25" />
      </g>
      <g transform="translate(58 54)" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="0" y="0" width="46" height="44" rx="3" fill="#022c22" fillOpacity="0.55" stroke="#065f46" strokeOpacity="0.7" />
        <polyline
          points="4,30 12,20 20,24 28,10 36,18 42,6"
          fill="none"
          stroke="#34d399"
          strokeWidth="2.4"
        />
        <polyline
          points="4,30 12,20 20,24 28,10 36,18 42,6 42,40 4,40 Z"
          fill="#10b981"
          fillOpacity="0.18"
          stroke="none"
        />
      </g>
      <text
        x="60"
        y="108"
        textAnchor="middle"
        fontFamily="system-ui,'SF Pro Display',sans-serif"
        fontSize="10"
        fontWeight="700"
        fill="#a7f3d0"
        opacity="0.85"
        letterSpacing="2.4"
      >
        X · BELIEVERS
      </text>
    </svg>
  ),
  'xmax.com': (
    <svg viewBox="0 0 120 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="xmaxBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0c4a6e" />
          <stop offset="50%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <radialGradient id="xmaxGlow" cx="0.75" cy="0.3" r="0.7">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
          <stop offset="70%" stopColor="#6366f1" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="120" height="120" fill="url(#xmaxBg)" />
      <rect width="120" height="120" fill="url(#xmaxGlow)" />
      <g transform="translate(22 26)" fill="white" fillOpacity="0.95">
        <circle cx="18" cy="18" r="22" fill="none" stroke="white" strokeOpacity="0.25" strokeWidth="2" />
        <circle cx="18" cy="18" r="14" fill="none" stroke="#bae6fd" strokeOpacity="0.4" strokeWidth="1.5" />
        <text
          x="18"
          y="24"
          textAnchor="middle"
          fontFamily="system-ui,'SF Pro Display',sans-serif"
          fontSize="16"
          fontWeight="800"
          fill="white"
          letterSpacing="0.5"
        >
          XM
        </text>
      </g>
      <g transform="translate(62 22)" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="0" y="0" width="38" height="30" rx="3" fill="#0b1f3a" fillOpacity="0.5" stroke="#1d4ed8" strokeOpacity="0.6" />
        <rect x="4" y="5" width="14" height="3" rx="1" fill="#38bdf8" fillOpacity="0.65" />
        <rect x="20" y="5" width="14" height="3" rx="1" fill="#67e8f9" fillOpacity="0.4" />
        <rect x="4" y="12" width="22" height="2" rx="1" fill="#e0f2fe" fillOpacity="0.4" />
        <rect x="4" y="17" width="26" height="2" rx="1" fill="#bae6fd" fillOpacity="0.3" />
        <rect x="4" y="22" width="14" height="2" rx="1" fill="#bae6fd" fillOpacity="0.25" />
      </g>
      <g transform="translate(62 60)" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon
          points="2,26 14,14 22,20 30,6 36,14"
          fill="#a78bfa"
          fillOpacity="0.22"
          stroke="#c4b5fd"
          strokeWidth="2.2"
        />
        <rect x="0" y="28" width="38" height="2" rx="1" fill="#c4b5fd" fillOpacity="0.35" />
      </g>
      <text
        x="60"
        y="108"
        textAnchor="middle"
        fontFamily="system-ui,'SF Pro Display',sans-serif"
        fontSize="10"
        fontWeight="700"
        fill="#e0e7ff"
        opacity="0.85"
        letterSpacing="3"
      >
        XMAX · NASDAQ
      </text>
    </svg>
  ),
  'ai.xmax.com': (
    <svg viewBox="0 0 120 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="xmaxAIBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#082f49" />
          <stop offset="50%" stopColor="#0891b2" />
          <stop offset="100%" stopColor="#4338ca" />
        </linearGradient>
        <radialGradient id="xmaxAIGlow" cx="0.3" cy="0.7" r="0.6">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.55" />
          <stop offset="70%" stopColor="#0891b2" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#082f49" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="120" height="120" fill="url(#xmaxAIBg)" />
      <rect width="120" height="120" fill="url(#xmaxAIGlow)" />
      <g transform="translate(30 28)" fill="none" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="52" height="40" rx="6" fill="#0c4a6e" fillOpacity="0.55" stroke="#06b6d4" strokeOpacity="0.75" />
        <circle cx="30" cy="24" r="7" fill="#22d3ee" fillOpacity="0.3" stroke="#a5f3fc" strokeWidth="1.6" />
        <circle cx="30" cy="24" r="3" fill="#ecfeff" fillOpacity="0.9" />
        <rect x="12" y="36" width="36" height="3" rx="1" fill="#a5f3fc" fillOpacity="0.4" />
      </g>
      <g transform="translate(22 80)" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 10 L10 2 L18 8 L26 2 L34 10" stroke="#67e8f9" strokeWidth="2.2" />
        <path d="M42 10 L50 2 L58 8 L66 2 L74 10" stroke="#67e8f9" strokeWidth="2.2" />
      </g>
      <text
        x="60"
        y="108"
        textAnchor="middle"
        fontFamily="system-ui,'SF Pro Display',sans-serif"
        fontSize="10"
        fontWeight="700"
        fill="#cffafe"
        opacity="0.85"
        letterSpacing="2.6"
      >
        XMAX · AI
      </text>
    </svg>
  ),
  'x.com': (
    <svg viewBox="0 0 120 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="xBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#020617" />
          <stop offset="50%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
        <radialGradient id="xGlow" cx="0.78" cy="0.25" r="0.65">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#0284c7" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="120" height="120" fill="url(#xBg)" />
      <rect width="120" height="120" fill="url(#xGlow)" />
      <g transform="translate(18 26)" fill="white" fillOpacity="0.96">
        <path
          d="M27.8 4 L32.9 4 L23.4 15.3 L35.1 29.2 L29.4 29.2 L24.7 23.1 L19.2 29.2 L13.9 29.2 L24.4 17.2 L13.1 4 L18.4 4 L23.4 10.3 Z"
          fill="white"
          fillOpacity="0.96"
        />
      </g>
      <g transform="translate(58 18)" fill="none" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="0" y="0" width="46" height="28" rx="3" fill="#0c1830" fillOpacity="0.55" stroke="#0369a1" strokeOpacity="0.7" />
        <rect x="4" y="6" width="18" height="3" rx="1" fill="#38bdf8" fillOpacity="0.72" />
        <rect x="24" y="6" width="16" height="3" rx="1" fill="#bae6fd" fillOpacity="0.4" />
        <rect x="4" y="13" width="28" height="2" rx="1" fill="#e0f2fe" fillOpacity="0.35" />
        <rect x="4" y="18" width="22" height="2" rx="1" fill="#e0f2fe" fillOpacity="0.25" />
      </g>
      <g transform="translate(58 56)" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="0" y="0" width="46" height="42" rx="3" fill="#0c1830" fillOpacity="0.55" stroke="#0369a1" strokeOpacity="0.7" />
        <polyline points="4,30 12,18 20,24 28,10 36,18 42,8" stroke="#7dd3fc" strokeWidth="2.2" />
        <polyline points="4,30 12,18 20,24 28,10 36,18 42,8 42,36 4,36 Z" fill="#0ea5e9" fillOpacity="0.18" stroke="none" />
      </g>
      <text
        x="60"
        y="108"
        textAnchor="middle"
        fontFamily="system-ui,'SF Pro Display',sans-serif"
        fontSize="10"
        fontWeight="700"
        fill="#e0f2fe"
        opacity="0.88"
        letterSpacing="2.6"
      >
        X / TWITTER
      </text>
    </svg>
  ),
  'twitter.com': (
    <svg viewBox="0 0 120 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="twBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#020617" />
          <stop offset="50%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
        <radialGradient id="twGlow" cx="0.78" cy="0.25" r="0.65">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#0284c7" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="120" height="120" fill="url(#twBg)" />
      <rect width="120" height="120" fill="url(#twGlow)" />
      <g transform="translate(18 26)" fill="white" fillOpacity="0.96">
        <path
          d="M27.8 4 L32.9 4 L23.4 15.3 L35.1 29.2 L29.4 29.2 L24.7 23.1 L19.2 29.2 L13.9 29.2 L24.4 17.2 L13.1 4 L18.4 4 L23.4 10.3 Z"
          fill="white"
          fillOpacity="0.96"
        />
      </g>
      <g transform="translate(58 18)" fill="none" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="0" y="0" width="46" height="28" rx="3" fill="#0c1830" fillOpacity="0.55" stroke="#0369a1" strokeOpacity="0.7" />
        <rect x="4" y="6" width="18" height="3" rx="1" fill="#38bdf8" fillOpacity="0.72" />
        <rect x="24" y="6" width="16" height="3" rx="1" fill="#bae6fd" fillOpacity="0.4" />
        <rect x="4" y="13" width="28" height="2" rx="1" fill="#e0f2fe" fillOpacity="0.35" />
        <rect x="4" y="18" width="22" height="2" rx="1" fill="#e0f2fe" fillOpacity="0.25" />
      </g>
      <g transform="translate(58 56)" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="0" y="0" width="46" height="42" rx="3" fill="#0c1830" fillOpacity="0.55" stroke="#0369a1" strokeOpacity="0.7" />
        <polyline points="4,30 12,18 20,24 28,10 36,18 42,8" stroke="#7dd3fc" strokeWidth="2.2" />
        <polyline points="4,30 12,18 20,24 28,10 36,18 42,8 42,36 4,36 Z" fill="#0ea5e9" fillOpacity="0.18" stroke="none" />
      </g>
      <text
        x="60"
        y="108"
        textAnchor="middle"
        fontFamily="system-ui,'SF Pro Display',sans-serif"
        fontSize="10"
        fontWeight="700"
        fill="#e0f2fe"
        opacity="0.88"
        letterSpacing="2.6"
      >
        X / TWITTER
      </text>
    </svg>
  ),
  'reddit.com': (
    <svg viewBox="0 0 120 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="rdBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c2d12" />
          <stop offset="50%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#be123c" />
        </linearGradient>
        <radialGradient id="rdGlow" cx="0.2" cy="0.75" r="0.65">
          <stop offset="0%" stopColor="#fb923c" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#f97316" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#7c2d12" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="120" height="120" fill="url(#rdBg)" />
      <rect width="120" height="120" fill="url(#rdGlow)" />
      <g transform="translate(18 20)" fill="white" fillOpacity="0.96">
        <circle cx="18" cy="20" r="18" fill="none" stroke="white" strokeOpacity="0.28" strokeWidth="2" />
        <circle cx="18" cy="20" r="12" fill="white" fillOpacity="0.96" />
        <circle cx="13.5" cy="18.5" r="2" fill="#c2410c" />
        <circle cx="22.5" cy="18.5" r="2" fill="#c2410c" />
        <path d="M13 24 Q18 27 23 24" fill="none" stroke="#c2410c" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="37" cy="4" r="2.5" fill="white" fillOpacity="0.96" />
        <path d="M33.5 10 Q30 7 31 4" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g transform="translate(58 20)" fill="none" stroke="#fed7aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="0" y="0" width="46" height="28" rx="3" fill="#431407" fillOpacity="0.55" stroke="#c2410c" strokeOpacity="0.7" />
        <rect x="4" y="6" width="16" height="3" rx="1" fill="#fb923c" fillOpacity="0.75" />
        <rect x="22" y="6" width="20" height="3" rx="1" fill="#ffedd5" fillOpacity="0.4" />
        <rect x="4" y="13" width="30" height="2" rx="1" fill="#fff7ed" fillOpacity="0.35" />
        <rect x="4" y="18" width="24" height="2" rx="1" fill="#fff7ed" fillOpacity="0.25" />
      </g>
      <g transform="translate(58 58)" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="0" y="0" width="46" height="40" rx="3" fill="#431407" fillOpacity="0.55" stroke="#c2410c" strokeOpacity="0.7" />
        <polyline points="4,28 12,18 20,22 28,12 36,20 42,10" stroke="#fdba74" strokeWidth="2.2" />
        <polyline points="4,28 12,18 20,22 28,12 36,20 42,10 42,34 4,34 Z" fill="#f97316" fillOpacity="0.22" stroke="none" />
      </g>
      <text
        x="60"
        y="108"
        textAnchor="middle"
        fontFamily="system-ui,'SF Pro Display',sans-serif"
        fontSize="10"
        fontWeight="700"
        fill="#ffedd5"
        opacity="0.88"
        letterSpacing="2.2"
      >
        REDDIT
      </text>
    </svg>
  ),
  'youtube.com': (
    <svg viewBox="0 0 120 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="ytBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#450a0a" />
          <stop offset="50%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
        <radialGradient id="ytGlow" cx="0.82" cy="0.35" r="0.65">
          <stop offset="0%" stopColor="#fb7185" stopOpacity="0.48" />
          <stop offset="60%" stopColor="#ef4444" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#450a0a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="120" height="120" fill="url(#ytBg)" />
      <rect width="120" height="120" fill="url(#ytGlow)" />
      <g transform="translate(16 24)" fill="white" fillOpacity="0.96">
        <rect x="0" y="6" width="40" height="28" rx="6" fill="white" fillOpacity="0.96" />
        <rect x="2" y="8" width="36" height="24" rx="4" fill="#dc2626" fillOpacity="0.9" />
        <path d="M16 14 L30 20 L16 26 Z" fill="white" fillOpacity="0.96" />
      </g>
      <g transform="translate(58 18)" fill="none" stroke="#fecaca" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="0" y="0" width="46" height="28" rx="3" fill="#3f1d1d" fillOpacity="0.55" stroke="#b91c1c" strokeOpacity="0.7" />
        <rect x="4" y="6" width="14" height="3" rx="1" fill="#f87171" fillOpacity="0.75" />
        <rect x="20" y="6" width="22" height="3" rx="1" fill="#fee2e2" fillOpacity="0.42" />
        <rect x="4" y="13" width="32" height="2" rx="1" fill="#fef2f2" fillOpacity="0.35" />
        <rect x="4" y="18" width="22" height="2" rx="1" fill="#fef2f2" fillOpacity="0.25" />
      </g>
      <g transform="translate(58 58)" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="0" y="0" width="46" height="40" rx="3" fill="#3f1d1d" fillOpacity="0.55" stroke="#b91c1c" strokeOpacity="0.7" />
        <polyline points="4,28 12,20 20,24 28,12 36,20 42,10" stroke="#fecaca" strokeWidth="2.2" />
        <polyline points="4,28 12,20 20,24 28,12 36,20 42,10 42,34 4,34 Z" fill="#ef4444" fillOpacity="0.2" stroke="none" />
      </g>
      <text
        x="60"
        y="108"
        textAnchor="middle"
        fontFamily="system-ui,'SF Pro Display',sans-serif"
        fontSize="10"
        fontWeight="700"
        fill="#fee2e2"
        opacity="0.88"
        letterSpacing="2.2"
      >
        YOU · TUBE
      </text>
    </svg>
  ),
  'q.futunn.com': (
    <svg viewBox="0 0 120 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="ftBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#064e3b" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
        <radialGradient id="ftGlow" cx="0.3" cy="0.3" r="0.7">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#10b981" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#064e3b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="120" height="120" fill="url(#ftBg)" />
      <rect width="120" height="120" fill="url(#ftGlow)" />
      <g transform="translate(26 22)" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="34" cy="38" r="34" fill="#ffffff" fillOpacity="0.08" stroke="#a7f3d0" strokeOpacity="0.65" />
        <circle cx="34" cy="38" r="24" fill="none" stroke="#6ee7b7" strokeOpacity="0.7" />
        <circle cx="34" cy="38" r="14" fill="#064e3b" fillOpacity="0.55" stroke="#34d399" strokeOpacity="0.85" />
        <path d="M34 14 L34 62 M10 38 L58 38" stroke="#10b981" strokeOpacity="0.5" strokeWidth="1.6" />
        <path
          d="M18 48 L26 40 L32 44 L40 28 L50 34 L58 22"
          stroke="#a7f3d0"
          strokeWidth="2.6"
          fill="none"
        />
        <path
          d="M18 48 L26 40 L32 44 L40 28 L50 34 L58 22 L58 62 L18 62 Z"
          fill="#34d399"
          fillOpacity="0.2"
          stroke="none"
        />
      </g>
      <text
        x="60"
        y="108"
        textAnchor="middle"
        fontFamily="system-ui,'SF Pro Display',sans-serif"
        fontSize="10"
        fontWeight="700"
        fill="#a7f3d0"
        opacity="0.9"
        letterSpacing="3"
      >
        富途牛牛
      </text>
    </svg>
  ),
  'laohu8.com': (
    <svg viewBox="0 0 120 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="lhBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#78350f" />
          <stop offset="50%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <radialGradient id="lhGlow" cx="0.7" cy="0.3" r="0.7">
          <stop offset="0%" stopColor="#fdba74" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#f97316" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#78350f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="120" height="120" fill="url(#lhBg)" />
      <rect width="120" height="120" fill="url(#lhGlow)" />
      <g transform="translate(28 20)" fill="white" fillOpacity="0.95">
        <path d="M28 2 L36 2 L36 30 L52 30 L52 38 L36 38 L36 66 L28 66 L28 38 L12 38 L12 30 L28 30 Z" fill="#fcd34d" fillOpacity="0.92" />
        <path d="M30 6 L34 6 L34 32 L48 32 L48 36 L34 36 L34 62 L30 62 L30 36 L16 36 L16 32 L30 32 Z" fill="white" fillOpacity="0.95" />
      </g>
      <text
        x="60"
        y="108"
        textAnchor="middle"
        fontFamily="system-ui,'SF Pro Display',sans-serif"
        fontSize="10"
        fontWeight="700"
        fill="#ffedd5"
        opacity="0.9"
        letterSpacing="3"
      >
        老虎证券
      </text>
    </svg>
  ),
  'hstong.com': (
    <svg viewBox="0 0 120 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="hsBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0c4a6e" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#3730a3" />
        </linearGradient>
        <radialGradient id="hsGlow" cx="0.75" cy="0.7" r="0.7">
          <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="120" height="120" fill="url(#hsBg)" />
      <rect width="120" height="120" fill="url(#hsGlow)" />
      <g transform="translate(26 26)" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="60" height="24" rx="4" fill="#ffffff" fillOpacity="0.08" stroke="#bfdbfe" strokeOpacity="0.7" />
        <path d="M10 18 L24 12 L32 22 L42 10 L58 20" stroke="#93c5fd" strokeWidth="2.6" fill="none" />
        <path d="M10 18 L24 12 L32 22 L42 10 L58 20 L58 30 L10 30 Z" fill="#60a5fa" fillOpacity="0.22" stroke="none" />
        <rect x="2" y="42" width="60" height="18" rx="3" fill="#ffffff" fillOpacity="0.06" stroke="#bfdbfe" strokeOpacity="0.5" />
        <rect x="8" y="48" width="12" height="3" rx="1" fill="#60a5fa" fillOpacity="0.7" />
        <rect x="24" y="48" width="30" height="3" rx="1" fill="#dbeafe" fillOpacity="0.35" />
      </g>
      <text
        x="60"
        y="108"
        textAnchor="middle"
        fontFamily="system-ui,'SF Pro Display',sans-serif"
        fontSize="10"
        fontWeight="700"
        fill="#bfdbfe"
        opacity="0.9"
        letterSpacing="3"
      >
        华盛通
      </text>
    </svg>
  ),
  'linkedin.com': (
    <svg viewBox="0 0 120 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="liBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0c4a6e" />
          <stop offset="50%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#3730a3" />
        </linearGradient>
        <radialGradient id="liGlow" cx="0.2" cy="0.2" r="0.65">
          <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#2563eb" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="120" height="120" fill="url(#liBg)" />
      <rect width="120" height="120" fill="url(#liGlow)" />
      <g transform="translate(18 22)" fill="white" fillOpacity="0.96">
        <rect x="0" y="4" width="36" height="40" rx="3" fill="white" fillOpacity="0.96" />
        <rect x="3" y="7" width="30" height="34" rx="2" fill="#2563eb" fillOpacity="0.92" />
        <circle cx="9.5" cy="14.5" r="2.4" fill="white" fillOpacity="0.96" />
        <rect x="7" y="20" width="5" height="18" fill="white" fillOpacity="0.96" />
        <rect x="16" y="20" width="5" height="8" fill="white" fillOpacity="0.96" />
        <rect x="24" y="20" width="6" height="18" fill="white" fillOpacity="0.96" />
      </g>
      <g transform="translate(58 20)" fill="none" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="0" y="0" width="46" height="28" rx="3" fill="#0b1f3a" fillOpacity="0.55" stroke="#1d4ed8" strokeOpacity="0.7" />
        <rect x="4" y="6" width="16" height="3" rx="1" fill="#60a5fa" fillOpacity="0.75" />
        <rect x="22" y="6" width="20" height="3" rx="1" fill="#dbeafe" fillOpacity="0.4" />
        <rect x="4" y="13" width="32" height="2" rx="1" fill="#eff6ff" fillOpacity="0.35" />
        <rect x="4" y="18" width="22" height="2" rx="1" fill="#eff6ff" fillOpacity="0.25" />
      </g>
      <g transform="translate(58 58)" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="0" y="0" width="46" height="40" rx="3" fill="#0b1f3a" fillOpacity="0.55" stroke="#1d4ed8" strokeOpacity="0.7" />
        <polyline points="4,28 12,18 20,22 28,12 36,20 42,10" stroke="#bfdbfe" strokeWidth="2.2" />
        <polyline points="4,28 12,18 20,22 28,12 36,20 42,10 42,34 4,34 Z" fill="#3b82f6" fillOpacity="0.22" stroke="none" />
      </g>
      <text
        x="60"
        y="108"
        textAnchor="middle"
        fontFamily="system-ui,'SF Pro Display',sans-serif"
        fontSize="10"
        fontWeight="700"
        fill="#dbeafe"
        opacity="0.88"
        letterSpacing="2.2"
      >
        LINKED · IN
      </text>
    </svg>
  ),
};

export default function WebpagePreviewCard({ webpage, badge }: { webpage: WebpagePreview; badge?: string }) {
  const chain = useMemo(() => buildThumbnailFallbackChain(webpage), [webpage]);
  const brandThumb = useMemo<React.ReactNode>(() => {
    const d = (webpage.domain || '').trim().replace(/^www\./, '');
    if (!d) return null;
    if (BRAND_THUMB[d]) return BRAND_THUMB[d];
    const keys = Object.keys(BRAND_THUMB);
    const suf = keys.find((k) => d.endsWith(`.${k}`) || k.endsWith(`.${d}`));
    if (suf) return BRAND_THUMB[suf];
    const fz = keys.find((k) => d.includes(k) || k.includes(d));
    return fz ? BRAND_THUMB[fz] : null;
  }, [webpage.domain]);
  const hasPrimaryImageCandidates = chain.candidates.length > 0;
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const [duckFavUsed, setDuckFavUsed] = useState(false);
  const [allFailed, setAllFailed] = useState(false);
  const debugInfo = useMemo(() => {
    const totalSteps = chain.candidates.length + 2;
    return { hasPrimaryImageCandidates, totalSteps };
  }, [chain, hasPrimaryImageCandidates]);

  useEffect(() => {
    setCandidateIndex(0);
    setImgLoaded(false);
    setFaviconError(false);
    setFailedUrls([]);
    setDuckFavUsed(false);
    setAllFailed(false);
  }, [webpage.url, webpage.domain, webpage.thumbnail, webpage.ogImage, webpage.twitterImage, webpage.firstContentImage]);

  const gradient =
    webpage.__placeholderGradient && webpage.__placeholderGradient.includes('from-')
      ? `bg-gradient-to-br ${webpage.__placeholderGradient}`
      : 'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900';

  const dom = (webpage.domain || '').trim();
  const googleFav64 = faviconUrlForDomain(dom, 64);
  const duckFav48 = duckduckgoFaviconUrl(dom);

  const currentSrc = useMemo((): string | null => {
    if (allFailed) return null;
    if (candidateIndex < chain.candidates.length) {
      const c = chain.candidates[candidateIndex];
      return c ? resolveAbsoluteUrl(webpage.url || '', c.url) || c.url : null;
    }
    if (candidateIndex === chain.candidates.length) {
      return chain.googleFavicon || null;
    }
    if (candidateIndex === chain.candidates.length + 1) {
      return chain.duckFavicon || null;
    }
    return null;
  }, [candidateIndex, chain, allFailed, webpage.url]);

  const showImg = !!currentSrc && !allFailed;
  const useFaviconLayout = hasPrimaryImageCandidates
    ? candidateIndex >= chain.candidates.length
    : true;
  const wrapperBg = useFaviconLayout ? 'bg-white group-hover:bg-slate-50' : 'bg-slate-100';

  const handleImgError = () => {
    const failedUrl = currentSrc;
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn('[WebpagePreviewCard] 缩略图加载失败：', {
        url: webpage.url,
        domain: dom,
        failedUrl,
        candidateIndex,
        chainLabels: chain.candidates.map((c) => c.label),
        totalSteps: debugInfo.totalSteps,
      });
    }
    if (failedUrl) {
      setFailedUrls((prev) =>
        prev.includes(failedUrl) ? prev : prev.concat(failedUrl)
      );
    }
    setImgLoaded(false);
    const nextIdx = candidateIndex + 1;
    const maxIdx = chain.candidates.length + 2;
    if (nextIdx < maxIdx) {
      setCandidateIndex(nextIdx);
    } else {
      setAllFailed(true);
    }
  };

  const renderPlaceholder = () => (
    <div className={`w-full h-full flex flex-col items-center justify-center gap-2 text-white/80 p-3 ${gradient}`}>
      <img
        src={!faviconError && googleFav64 ? googleFav64 : (duckFav48 || undefined)}
        alt=""
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-contain opacity-95 drop-shadow"
        referrerPolicy="no-referrer"
        onError={(e) => {
          const img = e.currentTarget as HTMLImageElement;
          if (!faviconError && googleFav64 && duckFav48) {
            setFaviconError(true);
            img.src = duckFav48;
            return;
          }
          img.style.display = 'none';
        }}
      />
      <span className="text-[11px] font-semibold tracking-wide truncate max-w-full opacity-90">
        {dom.replace(/^www\./, '') || 'external.site'}
      </span>
      <Link2 size={18} strokeWidth={1.5} className="opacity-50" />
      <span className="sr-only">{dom || 'external.site'} 网页占位图</span>
    </div>
  );

  return (
    <a
      href={webpage.url}
      target="_blank"
      rel="noreferrer noopener"
      className="block rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-sm transition group bg-white"
    >
      <div className="flex min-h-[104px] sm:min-h-[112px]">
        <div className="w-24 sm:w-28 flex-shrink-0 bg-white overflow-hidden border-r border-slate-100">
          {brandThumb ? (
            <div className="w-full h-full bg-white">{brandThumb}</div>
          ) : showImg ? (
            useFaviconLayout ? (
              <div className={`relative w-full h-full flex items-center justify-center p-1.5 sm:p-2 ${wrapperBg}`}>
                {!imgLoaded && <div className={`absolute inset-0 ${gradient} opacity-40`} />}
                <img
                  key={`${candidateIndex}-${currentSrc}`}
                  src={currentSrc || ''}
                  alt={webpage.title}
                  onLoad={() => setImgLoaded(true)}
                  onError={handleImgError}
                  className={`max-w-[74%] max-h-[74%] object-contain select-none transition-all duration-500 group-hover:scale-[1.06] ${
                    imgLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
                  }`}
                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  decoding="async"
                />
              </div>
            ) : (
              <div className={`relative w-full h-full ${wrapperBg}`}>
                {!imgLoaded && <div className={`absolute inset-0 ${gradient} opacity-40`} />}
                <img
                  key={`${candidateIndex}-${currentSrc}`}
                  src={currentSrc || ''}
                  alt={webpage.title}
                  onLoad={() => setImgLoaded(true)}
                  onError={handleImgError}
                  className={`w-full h-full object-cover select-none transition-all duration-500 group-hover:scale-[1.03] ${
                    imgLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
                  }`}
                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  decoding="async"
                />
              </div>
            )
          ) : (
            renderPlaceholder()
          )}
        </div>
        <div className="flex-1 px-3.5 py-3 min-w-0 flex flex-col">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1.5 flex-wrap">
            <span className="truncate font-medium">{webpage.domain || 'external.site'}</span>
            <ExternalLink size={10.5} strokeWidth={1.5} className="flex-shrink-0" />
            {badge && (
              <>
                <span className="mx-0.5 text-slate-300">·</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10.5px] font-medium border border-amber-100">
                  {badge}
                </span>
              </>
            )}
          </div>
          <h4 className="text-[13px] font-semibold text-slate-800 line-clamp-2 mb-1 group-hover:text-sky-600 transition leading-snug">
            {webpage.title || '未命名链接'}
          </h4>
          <p className="text-[11.5px] text-slate-500 line-clamp-3 leading-relaxed">
            {webpage.description || '点击访问原始网页查看完整内容。'}
          </p>
        </div>
      </div>
    </a>
  );
}
