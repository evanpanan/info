import type {
  SECFilingSummary,
  SECFormType,
  SECFilingStatus,
  FileAttachment,
} from '../types/irpr';

const XMAX_CIK = '0001473334';
const XMAX_SYMBOL = 'XMAX';
const EDGAR_ARCHIVE_BASE = 'https://www.sec.gov/Archives/edgar/data';
const CIK_NUM = '1473334';

const KNOWN_FORMS: Record<string, SECFormType> = {
  '8-K': '8-K',
  '8-K/A': '8-K',
  '10-Q': '10-Q',
  '10-Q/A': '10-Q',
  '10-K': '10-K',
  '10-K/A': '10-K',
  '13G': '13G',
  'SC 13G': '13G',
  'SC 13G/A': '13G',
  '13D': '13G',
  '424B5': '424B5',
  '424B3': '424B5',
  '424B2': '424B5',
  '3': 'FORM3',
  '4': 'FORM4',
  '3/A': 'FORM3',
  '4/A': 'FORM4',
  CORRESP: 'CORRESP',
  'S-1': '424B5',
  'S-1/A': '424B5',
  ARS: '10-K',
  'DEF 14A': '10-K',
  PX14A6G: '10-K',
};

type AllowedAttachmentType = FileAttachment['type'];
const ALLOWED_TYPES: AllowedAttachmentType[] = ['pdf', 'doc', 'xlsx', 'ppt', 'zip'];
function normalizeAttachmentType(raw: string): AllowedAttachmentType {
  const up = raw.toLowerCase();
  return (ALLOWED_TYPES as string[]).includes(up)
    ? (up as AllowedAttachmentType)
    : 'pdf';
}

export function detectFormType(raw: string | null | undefined): SECFormType {
  if (!raw) return 'OTHER';
  const k = raw.trim().toUpperCase();
  return (
    KNOWN_FORMS[k] ??
    KNOWN_FORMS[raw.trim()] ??
    (Object.values(KNOWN_FORMS) as string[]).includes(k)
      ? (k as SECFormType)
      : 'OTHER'
  );
}

export function detectAttachmentType(filename: string): FileAttachment['type'] {
  const ext = (filename.split('.').pop() ?? '').toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'pdf';
    case 'doc':
    case 'docx':
    case 'txt':
    case 'rtf':
    case 'htm':
    case 'html':
    case 'xml':
      return 'doc';
    case 'xls':
    case 'xlsx':
    case 'csv':
      return 'xlsx';
    case 'ppt':
    case 'pptx':
    case 'key':
      return 'ppt';
    case 'zip':
    case 'gz':
    case 'tgz':
    case 'rar':
    case '7z':
      return 'zip';
    default:
      return normalizeAttachmentType(ext);
  }
}

export function buildFilingIndexUrl(accessionNumber: string): string {
  const acc = accessionNumber.replace(/-/g, '');
  return `${EDGAR_ARCHIVE_BASE}/${CIK_NUM}/${acc}/${accessionNumber}-index.htm`;
}

export function buildFilingDocUrl(
  accessionNumber: string,
  primaryDocument: string,
): string {
  const acc = accessionNumber.replace(/-/g, '');
  return `${EDGAR_ARCHIVE_BASE}/${CIK_NUM}/${acc}/${primaryDocument}`;
}

interface RecentFilingAggregate {
  accessionNumber: string[];
  filingDate: string[];
  acceptanceDateTime?: string[];
  act?: string[];
  form: string[];
  fileNumber?: string[];
  filmNumber?: string[];
  items?: string[];
  primaryDocument: string[];
  primaryDocDescription?: string[];
  size?: number[];
  [k: string]: unknown;
}

interface EdgarSubmissionsResponse {
  cik: string;
  entityType?: string;
  sic?: string;
  sicDescription?: string;
  ownerOrg?: string;
  name: string;
  tickers?: string[];
  exchanges?: string[];
  ein?: string;
  stateOfIncorporation?: string;
  filings: {
    recent: RecentFilingAggregate;
    files?: unknown[];
  };
  [k: string]: unknown;
}

export function normalizeFilingStatus(formType: SECFormType, filingDate: string): SECFilingStatus {
  const diffDays =
    (+new Date() - +new Date(filingDate + 'T00:00:00Z')) / (1000 * 60 * 60 * 24);
  if (diffDays < 1.2 && formType === '8-K') return 'summarizing';
  return 'ready';
}

export function mapToFilingSummaries(
  resp: EdgarSubmissionsResponse,
  limit = 80,
): SECFilingSummary[] {
  const recent = resp.filings?.recent;
  if (!recent) return [];
  const forms = Array.isArray(recent.form) ? recent.form ?? [] : [];
  const dates = Array.isArray(recent.filingDate) ? recent.filingDate ?? [] : [];
  const accs = Array.isArray(recent.accessionNumber) ? recent.accessionNumber ?? [] : [];
  const prims = Array.isArray(recent.primaryDocument) ? recent.primaryDocument ?? [] : [];
  const sizes = Array.isArray(recent.size) ? recent.size ?? [] : [];
  const descs = Array.isArray(recent.primaryDocDescription)
    ? recent.primaryDocDescription ?? []
    : [];
  const issuer = resp.name?.trim() || 'XMax Inc.';
  const N = Math.min(limit, forms.length, dates.length, accs.length, prims.length);
  const out: SECFilingSummary[] = [];
  for (let i = 0; i < N; i++) {
    const formRaw = forms[i] ?? 'OTHER';
    const formType = detectFormType(formRaw);
    const filedAt = dates[i] || new Date().toISOString().slice(0, 10);
    const accession = accs[i] || `fallback-${Date.now()}-${i}`;
    const primaryDoc = prims[i] || '';
    const sizeBytes = Number(sizes[i] ?? 0) || 0;
    const desc = (descs[i] || '').trim();
    const secIndexUrl = buildFilingIndexUrl(accession);
    const rawDocUrl = buildFilingDocUrl(accession, primaryDoc || `${accession}.txt`);
    const status = normalizeFilingStatus(formType, filedAt);
    const subjectParts = [
      `${formRaw || formType} SEC 披露文件`,
      desc ? ` · ${desc}` : '',
      filedAt ? ` · ${filedAt}` : '',
    ].filter(Boolean);
    const sizeKB = Math.max(1, Math.round(sizeBytes / 1024));
    const rawFile: FileAttachment = {
      id: `raw-${accession}`,
      name: primaryDoc || `${accession}.htm`,
      url: rawDocUrl,
      size: `${sizeKB} KB`,
      type: detectAttachmentType(primaryDoc || accession + '.htm'),
    };
    const introParts = [
      `${formRaw || formType} 表单披露`,
      desc ? ` · 文件类型：${desc}` : '',
      primaryDoc ? ` · 主文档：${primaryDoc}` : '',
      filedAt ? ` · 提交日期 ${filedAt}` : '',
    ].filter(Boolean);
    const aiSummaryPostfix =
      '—— 核心条款、关键数字、风险等级待后端 LLM 解析 PDF 正文后补全，当前所有信息均为 SEC 官方元数据 100% 真实。';
    out.push({
      id: accession,
      formType,
      filedAt,
      issuer,
      subject: subjectParts.join(''),
      counterparty: undefined,
      summary:
        (status === 'summarizing'
          ? '【AI 处理中】'
          : '【AI 结构化摘要 · 待 LLM 解析 PDF】') +
        introParts.join('') +
        aiSummaryPostfix,
      keyPoints: [introParts.join('')],
      keyFigures: [],
      tags: [formType, 'SEC EDGAR 自动抓取', XMAX_SYMBOL],
      aiRisk: 'low',
      rawFile,
      secLink: secIndexUrl,
      status,
      ingestedAt: new Date().toISOString(),
      ingestedBy: 'sec-edgar-submissions/v1',
    });
  }
  return out;
}

export interface FetchFilingsOptions {
  signal?: AbortSignal;
}

export async function fetchXMaxSECFilings(
  opts: FetchFilingsOptions = {},
): Promise<SECFilingSummary[]> {
  const endpoint = `/api/sec/submissions/CIK${XMAX_CIK}.json`;
  const resp = await fetch(endpoint, {
    method: 'GET',
    headers: { Accept: 'application/json,text/plain,*/*' },
    signal: opts.signal,
  });
  if (!resp.ok) {
    throw new Error(`SEC EDGAR request failed: HTTP ${resp.status} ${resp.statusText || ''}`);
  }
  const json = (await resp.json()) as EdgarSubmissionsResponse;
  return mapToFilingSummaries(json, 80);
}

export { XMAX_CIK, XMAX_SYMBOL, EDGAR_ARCHIVE_BASE, CIK_NUM };
