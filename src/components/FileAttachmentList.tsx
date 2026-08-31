import type { LucideIcon } from 'lucide-react';
import { Download, FileText, Table, Presentation, ExternalLink, FileArchive } from 'lucide-react';
import type { FileAttachment } from '../types/irpr';

const fileIconMap: Record<FileAttachment['type'], LucideIcon> = {
  pdf: FileText,
  doc: FileText,
  xlsx: Table,
  ppt: Presentation,
  zip: FileArchive,
};

const fileColorMap: Record<FileAttachment['type'], string> = {
  pdf: 'text-rose-500 bg-rose-50',
  doc: 'text-sky-600 bg-sky-50',
  xlsx: 'text-emerald-600 bg-emerald-50',
  ppt: 'text-orange-500 bg-orange-50',
  zip: 'text-amber-600 bg-amber-50',
};

const getDownloadFilename = (file: FileAttachment): string => {
  const extMap: Record<FileAttachment['type'], string> = {
    pdf: '.pdf',
    doc: '.doc',
    xlsx: '.xlsx',
    ppt: '.pptx',
    zip: '.zip',
  };
  const cleanName = file.name.replace(/\.[^.]+$/, '');
  return cleanName + (file.name.match(/\.[^.]+$/)?.[0] ?? extMap[file.type] ?? '');
};

export default function FileAttachmentList({ files }: { files: FileAttachment[] }) {
  const showToast = (text: string, tone?: 'success' | 'error' | 'info') => {
    if ((window as any).__irprShowToast) {
      (window as any).__irprShowToast(text, tone ?? 'success');
    }
  };
  const isSafariBrowser = () => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    return /Safari/i.test(ua) && !/(Chrome|Chromium|CriOS|Edg|OPR|FxiOS|Firefox)/i.test(ua);
  };
  const blobToDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
          return;
        }
        reject(new Error('read_blob_failed'));
      };
      reader.onerror = () => reject(reader.error ?? new Error('read_blob_failed'));
      reader.readAsDataURL(blob);
    });
  // #region debug-point A:reporter
  const reportDebug = (hypothesisId: string, location: string, msg: string, data: Record<string, unknown>) => {
    fetch('http://127.0.0.1:7777/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'file-open-download-fail',
        runId: 'post-fix',
        hypothesisId,
        location,
        msg: `[DEBUG] ${msg}`,
        data,
        ts: Date.now(),
      }),
    }).catch(() => {});
  };
  // #endregion
  const openInNewTab = (url: string) => {
    // #region debug-point B:window-open
    reportDebug('B', 'FileAttachmentList.tsx:openInNewTab:before', 'calling window.open', {
      url,
      isBlobUrl: url.startsWith('blob:'),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    });
    // #endregion
    try {
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      // #region debug-point B:window-open-result
      reportDebug('B', 'FileAttachmentList.tsx:openInNewTab:after', 'window.open returned', {
        url,
        isBlobUrl: url.startsWith('blob:'),
        returnedNull: !opened,
        returnedClosed: opened ? opened.closed : null,
      });
      // #endregion
      return !!opened && !opened.closed;
    } catch {
      // #region debug-point B:window-open-error
      reportDebug('B', 'FileAttachmentList.tsx:openInNewTab:catch', 'window.open threw', {
        url,
        isBlobUrl: url.startsWith('blob:'),
      });
      // #endregion
      return false;
    }
  };
  const triggerAnchorClick = (url: string, filename: string, openBlank: boolean, cleanup?: () => void) => {
    try {
      const a = document.createElement('a');
      a.href = url;
      if (filename) a.download = filename;
      a.rel = 'noopener noreferrer';
      if (openBlank) a.target = '_blank';
      // #region debug-point C:anchor-click
      reportDebug('C', 'FileAttachmentList.tsx:triggerAnchorClick:before', 'about to click anchor', {
        url,
        filename,
        openBlank,
        downloadAttr: a.download,
        target: a.target,
      });
      // #endregion
      document.body.appendChild(a);
      a.click();
      window.setTimeout(() => {
        a.remove();
        cleanup?.();
      }, 0);
      // #region debug-point C:anchor-click-after
      reportDebug('C', 'FileAttachmentList.tsx:triggerAnchorClick:after', 'anchor click finished', {
        url,
        filename,
        openBlank,
      });
      // #endregion
      return true;
    } catch {
      // #region debug-point C:anchor-click-error
      reportDebug('C', 'FileAttachmentList.tsx:triggerAnchorClick:catch', 'anchor click threw', {
        url,
        filename,
        openBlank,
      });
      // #endregion
      return false;
    }
  };
  return (
    <div className="space-y-2">
      {files.map((file) => {
        const Icon = fileIconMap[file.type];
        const colorClass = fileColorMap[file.type];
        const rawUrl = (file.url || '').trim();
        const isHttp = /^https?:\/\//i.test(rawUrl);
        const isBlob = rawUrl.startsWith('blob:') || rawUrl.startsWith('data:');
        const isUsable = isHttp || isBlob || (rawUrl && rawUrl !== '#');
        const dlName = getDownloadFilename(file);
        const prepareBlobDownload = async () => {
          try {
            // Rehydrate the attachment before downloading so Safari does not navigate into the stored blob URL.
            const response = await fetch(rawUrl);
            const blob = await response.blob();
            const safari = isSafariBrowser();
            if (safari) {
              const dataUrl = await blobToDataUrl(blob);
              // #region debug-point F:prepare-blob-download-safari
              reportDebug('F', 'FileAttachmentList.tsx:prepareBlobDownload', 'prepared safari data url download', {
                fileName: file.name,
                rawUrl,
                blobSize: blob.size,
                blobType: blob.type,
                mode: 'data-url',
              });
              // #endregion
              return {
                url: dataUrl,
                cleanup: undefined,
              };
            }
            const tempUrl = URL.createObjectURL(blob);
            // #region debug-point F:prepare-blob-download-object-url
            reportDebug('F', 'FileAttachmentList.tsx:prepareBlobDownload', 'prepared fresh object url download', {
              fileName: file.name,
              rawUrl,
              blobSize: blob.size,
              blobType: blob.type,
              mode: 'object-url',
            });
            // #endregion
            return {
              url: tempUrl,
              cleanup: () => window.setTimeout(() => URL.revokeObjectURL(tempUrl), 1500),
            };
          } catch (error) {
            // #region debug-point F:prepare-blob-download-error
            reportDebug('F', 'FileAttachmentList.tsx:prepareBlobDownload:catch', 'failed to prepare blob download', {
              fileName: file.name,
              rawUrl,
              error: error instanceof Error ? error.message : String(error),
            });
            // #endregion
            return null;
          }
        };

        const prepareBlobPreview = async () => {
          try {
            const response = await fetch(rawUrl);
            const blob = await response.blob();
            const tempUrl = URL.createObjectURL(blob);
            // #region debug-point G:prepare-blob-preview
            reportDebug('G', 'FileAttachmentList.tsx:prepareBlobPreview', 'prepared fresh object url preview', {
              fileName: file.name,
              rawUrl,
              blobSize: blob.size,
              blobType: blob.type,
            });
            // #endregion
            return {
              url: tempUrl,
              cleanup: () => window.setTimeout(() => URL.revokeObjectURL(tempUrl), 30000),
            };
          } catch (error) {
            // #region debug-point G:prepare-blob-preview-error
            reportDebug('G', 'FileAttachmentList.tsx:prepareBlobPreview:catch', 'failed to prepare blob preview', {
              fileName: file.name,
              rawUrl,
              error: error instanceof Error ? error.message : String(error),
            });
            // #endregion
            return null;
          }
        };

        const startDownload = async () => {
          if (isBlob) {
            const prepared = await prepareBlobDownload();
            if (!prepared) return false;
            return triggerAnchorClick(prepared.url, dlName, false, prepared.cleanup);
          }
          return triggerAnchorClick(rawUrl, dlName, true);
        };

        const startPreview = async () => {
          if (isBlob) {
            const prepared = await prepareBlobPreview();
            if (!prepared) return false;
            const opened = openInNewTab(prepared.url);
            if (!opened) prepared.cleanup();
            return opened;
          }
          return openInNewTab(rawUrl);
        };

        const handleOpen = async (e: React.MouseEvent<HTMLElement>) => {
          e.preventDefault();
          // #region debug-point A:handle-open
          reportDebug('A', 'FileAttachmentList.tsx:handleOpen', 'open clicked', {
            fileName: file.name,
            rawUrl,
            isHttp,
            isBlob,
            isUsable,
            eventType: e.type,
          });
          // #endregion
          if (!isUsable) {
            showToast(`附件「${file.name}」链接无效，请联系管理员`, 'error');
            return;
          }
          const ok = await startPreview();
          showToast(ok ? `正在打开 ${file.name}` : `浏览器拦截了新窗口，请允许本站弹窗后重试`, ok ? 'info' : 'error');
        };

        const handleDownload = async (e: React.MouseEvent<HTMLElement>) => {
          e.preventDefault();
          e.stopPropagation();
          // #region debug-point D:handle-download
          reportDebug('D', 'FileAttachmentList.tsx:handleDownload', 'download clicked', {
            fileName: file.name,
            rawUrl,
            isHttp,
            isBlob,
            isUsable,
            eventType: e.type,
          });
          // #endregion
          if (!isUsable) {
            showToast(`附件「${file.name}」链接无效，请联系管理员`, 'error');
            return;
          }
          if (typeof window !== 'undefined') {
            // eslint-disable-next-line no-console
            console.info('[FileAttachment] 触发下载：', {
              name: file.name,
              url: rawUrl.slice(0, 120),
              isBlob,
              isHttp,
            });
          }
          if (isBlob) {
            const ok = await startDownload();
            showToast(ok ? `开始下载 ${file.name}` : `附件「${file.name}」下载失败，请重试`, ok ? 'success' : 'error');
            return;
          }
          showToast(`开始下载 ${file.name}`);
          // 远程 URL 双保险：先尝试 a[download]（同域直接保存），再同步 window.open 打开预览（防止 CORS/popup 拦截）
          const clicked = await startDownload();
          if (!clicked) {
            showToast(`附件「${file.name}」下载失败，请重试`, 'error');
            return;
          }
          setTimeout(() => {
            // #region debug-point E:timeout-open
            reportDebug('E', 'FileAttachmentList.tsx:handleDownload:setTimeout', 'timeout fallback open start', {
              fileName: file.name,
              rawUrl,
            });
            // #endregion
            const ok = openInNewTab(rawUrl);
            // #region debug-point E:timeout-open-result
            reportDebug('E', 'FileAttachmentList.tsx:handleDownload:setTimeout:after', 'timeout fallback open finished', {
              fileName: file.name,
              rawUrl,
              ok,
            });
            // #endregion
            if (!ok) {
              showToast(`浏览器拦截了新窗口，请允许本站弹窗后重试，或右键卡片 → 另存为`, 'error');
            }
          }, 0);
        };

        return (
          <div
            key={file.id}
            onClick={isUsable ? handleOpen : undefined}
            className={`flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition group ${isUsable ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass} flex-shrink-0`}>
              <Icon size={18} strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-800 truncate group-hover:text-slate-900">{file.name}</div>
              <div className="text-xs text-slate-400 mt-0.5">{file.size}</div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isUsable && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpen(e);
                  }}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                  title="在新窗口打开预览"
                >
                  <ExternalLink size={13} strokeWidth={1.75} />
                </button>
              )}
              <button
                type="button"
                onClick={handleDownload}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition text-[12px] font-semibold border ${
                  isUsable
                    ? 'text-slate-600 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 border-transparent hover:border-slate-200'
                    : 'text-slate-300 bg-slate-50 border-slate-200 cursor-not-allowed'
                }`}
                title={isUsable ? `下载 ${file.name}` : `附件「${file.name}」链接无效`}
                disabled={!isUsable}
              >
                <Download size={14} strokeWidth={1.8} />
                下载
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
