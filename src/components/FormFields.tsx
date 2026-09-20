import { ReactNode, useState, useRef, useEffect } from 'react';
import { format, parse, isValid, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

export function FieldGroup({ wide, error, children }: { wide?: boolean; error?: string; children: ReactNode }) {
  return (
    <div className={`${wide ? 'col-span-full' : ''}`}>
      {children}
      {error && <p className="mt-1.5 text-[.75rem] font-semibold text-[hsl(5,72%,40%)]">{error}</p>}
    </div>
  );
}

export function FieldLabel({ htmlFor, required, children }: { htmlFor?: string; required?: boolean; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block mb-[7px] text-[.82rem] font-bold text-[#1d3445]">
      {children}{required && <span className="text-[hsl(5,72%,40%)]"> *</span>}
    </label>
  );
}

const inputClass = "w-full min-h-[45px] px-3 py-2.5 border border-[#bdcddb] rounded-[10px] bg-white text-[#173044] transition-all focus:outline-none focus:border-[hsl(209,100%,33%)] focus:ring-[3px] focus:ring-[hsl(209,100%,33%)]/[.13] text-[.84rem]";

export function TextInput({ id, name, type = 'text', placeholder, value, onChange, error }: {
  id: string; name: string; type?: string; placeholder?: string; value: string; onChange: (v: string) => void; error?: boolean;
}) {
  return (
    <input
      id={id} name={name} type={type} placeholder={placeholder} value={value}
      onChange={e => onChange(e.target.value)}
      className={`${inputClass} ${error ? 'border-[#d54c41] bg-[#fffafa]' : ''}`}
    />
  );
}

export function SelectInput({ id, name, value, onChange, options, error }: {
  id: string; name: string; value: string; onChange: (v: string) => void; options: string[]; error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className={`${inputClass} flex items-center justify-between gap-2 text-left ${error ? 'border-[#d54c41] bg-[#fffafa]' : ''} ${open ? 'border-[hsl(209,100%,33%)] ring-[3px] ring-[hsl(209,100%,33%)]/[.13]' : ''}`}>
        <span className={value ? 'text-[#173044]' : 'text-[#94a7b5]'}>{value || 'Bitte auswählen'}</span>
        <ChevronDown size={16} className={`text-[#7a94a6] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 py-1 border border-[#ccdae4] rounded-[10px] bg-white shadow-[0_12px_28px_rgba(24,64,92,.12)] max-h-[220px] overflow-y-auto">
          {options.map(o => (
            <button key={o} type="button" onClick={() => { onChange(o); setOpen(false); }}
              className={`w-full text-left px-3 py-2.5 text-[.84rem] transition-colors hover:bg-[#eaf4fb] ${value === o ? 'bg-[#e5f3fc] text-[hsl(209,100%,33%)] font-semibold' : 'text-[#173044]'}`}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Date picker that displays dd.MM.yyyy */
export function DateInput({ id, value, onChange, error }: {
  id: string; value: string; onChange: (v: string) => void; error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // value is ISO yyyy-MM-dd
  const parsed = value ? parse(value, 'yyyy-MM-dd', new Date()) : null;
  const display = parsed && isValid(parsed) ? format(parsed, 'dd.MM.yyyy') : '';
  const [viewMonth, setViewMonth] = useState(() => parsed && isValid(parsed) ? parsed : new Date());

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = (getDay(monthStart) + 6) % 7; // Monday = 0

  const selectDay = (d: Date) => {
    onChange(format(d, 'yyyy-MM-dd'));
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className={`${inputClass} flex items-center justify-between gap-2 text-left ${error ? 'border-[#d54c41] bg-[#fffafa]' : ''} ${open ? 'border-[hsl(209,100%,33%)] ring-[3px] ring-[hsl(209,100%,33%)]/[.13]' : ''}`}>
        <span className={display ? 'text-[#173044]' : 'text-[#94a7b5]'}>{display || 'TT.MM.JJJJ'}</span>
        <CalendarDays size={16} className="text-[#7a94a6]" />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 p-3 border border-[#ccdae4] rounded-[12px] bg-white shadow-[0_12px_28px_rgba(24,64,92,.12)] w-[280px]">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => setViewMonth(subMonths(viewMonth, 1))} className="p-1.5 rounded-lg hover:bg-[#eaf4fb] text-[#5d7182]"><ChevronLeft size={16} /></button>
            <span className="text-[.84rem] font-bold text-[#102a43]">{format(viewMonth, 'MMMM yyyy', { locale: de })}</span>
            <button type="button" onClick={() => setViewMonth(addMonths(viewMonth, 1))} className="p-1.5 rounded-lg hover:bg-[#eaf4fb] text-[#5d7182]"><ChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-7 text-center text-[.7rem] font-semibold text-[#7a94a6] mb-1">
            {['Mo','Di','Mi','Do','Fr','Sa','So'].map(d => <span key={d} className="py-1">{d}</span>)}
          </div>
          <div className="grid grid-cols-7 text-center">
            {Array.from({ length: startDay }).map((_, i) => <span key={`e${i}`} />)}
            {days.map(d => {
              const isSelected = value === format(d, 'yyyy-MM-dd');
              const isToday = format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              return (
                <button key={d.toISOString()} type="button" onClick={() => selectDay(d)}
                  className={`py-1.5 rounded-lg text-[.8rem] transition-colors
                    ${isSelected ? 'bg-[hsl(209,100%,33%)] text-white font-bold' : isToday ? 'bg-[#e5f3fc] text-[hsl(209,100%,33%)] font-semibold' : 'text-[#173044] hover:bg-[#eaf4fb]'}`}>
                  {format(d, 'd')}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function TextArea({ id, name, placeholder, value, onChange }: {
  id: string; name: string; placeholder?: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <textarea id={id} name={name} placeholder={placeholder} value={value}
      onChange={e => onChange(e.target.value)}
      className={`${inputClass} min-h-[104px] resize-y`}
    />
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-[.75rem] leading-[1.4] text-[#728491]">{children}</p>;
}
