import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Pencil, Trash2, Check, X } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  onOptionsChange: (opts: string[]) => void;
  placeholder?: string;
  error?: boolean;
  allowText?: boolean;
}

const inputClass = "w-full min-h-[45px] px-3 py-2.5 border border-[#bdcddb] rounded-[10px] bg-white text-[#173044] transition-all focus:outline-none focus:border-[hsl(209,100%,33%)] focus:ring-[3px] focus:ring-[hsl(209,100%,33%)]/[.13] text-[.84rem]";

export default function EditableSelect({ value, onChange, options, onOptionsChange, placeholder = 'Bitte auswählen', error, allowText }: Props) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setAdding(false); setEditingIdx(null); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addOption = () => {
    const t = draft.trim();
    if (t && !options.includes(t)) { onOptionsChange([...options, t]); onChange(t); }
    setDraft(''); setAdding(false);
  };

  const saveEdit = (idx: number) => {
    const t = draft.trim();
    if (t) {
      const old = options[idx];
      const next = [...options]; next[idx] = t; onOptionsChange(next);
      if (value === old) onChange(t);
    }
    setDraft(''); setEditingIdx(null);
  };

  const deleteOption = (idx: number) => {
    const old = options[idx];
    onOptionsChange(options.filter((_, i) => i !== idx));
    if (value === old) onChange('');
  };

  return (
    <div ref={ref} className="relative">
      {allowText ? (
        <div className="relative">
          <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className={`${inputClass} pr-9 ${error ? 'border-[#d54c41] bg-[#fffafa]' : ''}`}
            onFocus={() => setOpen(true)} />
          <button type="button" onClick={() => setOpen(!open)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a94a6]">
            <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(!open)}
          className={`${inputClass} flex items-center justify-between gap-2 text-left ${error ? 'border-[#d54c41] bg-[#fffafa]' : ''} ${open ? 'border-[hsl(209,100%,33%)] ring-[3px] ring-[hsl(209,100%,33%)]/[.13]' : ''}`}>
          <span className={value ? 'text-[#173044]' : 'text-[#94a7b5]'}>{value || placeholder}</span>
          <ChevronDown size={16} className={`text-[#7a94a6] transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      )}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 border border-[#ccdae4] rounded-[10px] bg-white shadow-[0_12px_28px_rgba(24,64,92,.12)] max-h-[260px] overflow-y-auto">
          <div className="py-1">
            {options.map((o, i) => (
              editingIdx === i ? (
                <div key={i} className="flex items-center gap-1 px-2 py-1.5">
                  <input autoFocus value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveEdit(i)}
                    className="flex-1 min-h-[34px] px-2 py-1 border border-[#bdcddb] rounded-lg text-[.84rem] focus:outline-none focus:border-[hsl(209,100%,33%)]" />
                  <button type="button" onClick={() => saveEdit(i)} className="p-1.5 rounded-lg text-[#15803d] hover:bg-[#f1fcf5]"><Check size={14} /></button>
                  <button type="button" onClick={() => { setEditingIdx(null); setDraft(''); }} className="p-1.5 rounded-lg text-[#7a94a6] hover:bg-[#f5f7f9]"><X size={14} /></button>
                </div>
              ) : (
                <div key={i} className={`group flex items-center gap-1 px-3 py-2.5 text-[.84rem] transition-colors hover:bg-[#eaf4fb] cursor-pointer ${value === o ? 'bg-[#e5f3fc] text-[hsl(209,100%,33%)] font-semibold' : 'text-[#173044]'}`}>
                  <span className="flex-1" onClick={() => { onChange(o); setOpen(false); }}>{o}</span>
                  <button type="button" onClick={e => { e.stopPropagation(); setEditingIdx(i); setDraft(o); }} className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#7a94a6] hover:text-[hsl(209,100%,33%)]"><Pencil size={12} /></button>
                  <button type="button" onClick={e => { e.stopPropagation(); deleteOption(i); }} className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#7a94a6] hover:text-[#b42318]"><Trash2 size={12} /></button>
                </div>
              )
            ))}
          </div>
          <div className="border-t border-[#e5edf2]">
            {adding ? (
              <div className="flex items-center gap-1 px-2 py-2">
                <input autoFocus value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && addOption()}
                  placeholder="Neue Option…"
                  className="flex-1 min-h-[34px] px-2 py-1 border border-[#bdcddb] rounded-lg text-[.84rem] focus:outline-none focus:border-[hsl(209,100%,33%)]" />
                <button type="button" onClick={addOption} className="p-1.5 rounded-lg text-[#15803d] hover:bg-[#f1fcf5]"><Check size={14} /></button>
                <button type="button" onClick={() => { setAdding(false); setDraft(''); }} className="p-1.5 rounded-lg text-[#7a94a6] hover:bg-[#f5f7f9]"><X size={14} /></button>
              </div>
            ) : (
              <button type="button" onClick={() => { setAdding(true); setDraft(''); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-[.84rem] text-[hsl(209,100%,33%)] font-semibold hover:bg-[#eaf4fb] transition-colors">
                <Plus size={14} /> Hinzufügen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
