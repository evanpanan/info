import { useEffect, useRef, useState } from 'react';
import { Smile } from 'lucide-react';

const EMOJI_CATEGORIES: { label: string; items: string[] }[] = [
  {
    label: '常用',
    items: [
      '😀', '😂', '🥰', '😍', '🤔', '👍', '👏', '🎉',
      '🔥', '🚀', '✨', '💯', '📈', '💰', '💼', '📊',
      '✅', '❤️', '🙏', '🏆', '👀', '💡', '🌍', '⚡',
    ],
  },
  {
    label: '表情',
    items: [
      '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆',
      '😉', '😊', '😋', '😎', '😍', '🥰', '😘', '🥳',
      '🤩', '🤔', '🤨', '😐', '🙂', '🙃', '😇', '🤗',
    ],
  },
  {
    label: '手势',
    items: [
      '👋', '🤚', '✋', '🖐️', '✌️', '🤞', '🤟', '🤘',
      '🤙', '👌', '🤌', '🤏', '👍', '👎', '👊', '✊',
      '👏', '🙌', '🤲', '🤝', '🙏', '💪', '🦾', '🫱',
    ],
  },
  {
    label: '商务',
    items: [
      '📈', '📉', '📊', '📋', '📑', '🧾', '💼', '👔',
      '🏢', '🏛️', '🏦', '💰', '💵', '💴', '💶', '💷',
      '💎', '🏆', '🥇', '🎯', '🚀', '📣', '📰', '🔔',
    ],
  },
];

export default function EmojiPicker({
  onPick,
}: {
  onPick: (emoji: string, caretHint?: { selectionStart: number; selectionEnd: number } | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (
        rootRef.current?.contains(e.target as Node) ||
        triggerRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="插入表情"
        className={`p-2.5 rounded-xl transition ${
          open
            ? 'bg-sky-50 text-sky-600'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
        }`}
      >
        <Smile size={17} strokeWidth={1.5} />
      </button>

      {open && (
        <div
          ref={rootRef}
          className="absolute left-0 bottom-full mb-2 z-30 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl p-3"
        >
          <div className="flex items-center gap-1 mb-3 border-b border-slate-100 pb-2 overflow-x-auto">
            {EMOJI_CATEGORIES.map((c, i) => (
              <button
                key={c.label}
                type="button"
                onClick={() => setCategory(i)}
                className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  i === category
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
            {EMOJI_CATEGORIES[category].items.map((e, i) => (
              <button
                key={`${e}-${i}`}
                type="button"
                onClick={() => {
                  onPick(e);
                  setOpen(false);
                }}
                className="w-8 h-8 rounded-lg text-lg hover:bg-slate-100 active:scale-95 transition flex items-center justify-center"
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { EMOJI_CATEGORIES };
