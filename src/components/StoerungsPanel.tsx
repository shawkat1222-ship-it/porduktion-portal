import { useState, useEffect, useCallback } from 'react';
import { Plus, CheckCircle, Pencil, Trash2, X } from 'lucide-react';
import EditableSelect from './EditableSelect';
import { FieldLabel } from './FormFields';

export interface Stoerung {
  id: number;
  linie: string;
  bauteil: string;
  beschreibung: string;
  startTime: string; // HH:mm
  resolved: boolean;
  minutes: number | null;
  techniker: string;
  resolvedTime: string | null; // HH:mm
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function elapsedMinutes(startTime: string): number {
  const [h, m] = startTime.split(':').map(Number);
  const now = new Date();
  const start = new Date(); start.setHours(h, m, 0, 0);
  return Math.max(0, Math.round((now.getTime() - start.getTime()) / 60000));
}

interface ResolveModalProps {
  stoerung: Stoerung;
  onConfirm: (minutes: number, techniker: string) => void;
  onCancel: () => void;
}

function ResolveModal({ stoerung, onConfirm, onCancel }: ResolveModalProps) {
  const defaultMin = elapsedMinutes(stoerung.startTime);
  const [minutes, setMinutes] = useState(Math.min(defaultMin || 1, 120));
  const [addTech, setAddTech] = useState(false);
  const [tech, setTech] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!minutes || minutes < 1) { setError('Bitte Minuten eingeben.'); return; }
    if (addTech && !tech.trim()) { setError('Bitte Techniker-Name eingeben.'); return; }
    onConfirm(minutes, addTech ? tech.trim() : '-');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4" onClick={onCancel}>
      <div className="w-full max-w-[420px] bg-white rounded-[16px] border border-[#ccdae4] shadow-[0_24px_60px_rgba(0,58,102,.18)] p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-[1rem] font-bold text-[#102a43] mb-1">Störung auflösen</h3>
        <p className="text-[.8rem] text-[#637786] mb-5">#{stoerung.id} — {stoerung.beschreibung}</p>

        <FieldLabel>Minuten</FieldLabel>
        <div className="flex items-center gap-3 mb-1">
          <input type="number" min={1} max={120} value={minutes} onChange={e => setMinutes(Math.max(1, Math.min(120, Number(e.target.value))))}
            className="w-20 min-h-[40px] px-3 py-2 border border-[#bdcddb] rounded-[10px] bg-white text-[#173044] text-[.84rem] focus:outline-none focus:border-[hsl(209,100%,33%)] focus:ring-[3px] focus:ring-[hsl(209,100%,33%)]/[.13]" />
          <input type="range" min={1} max={120} value={minutes} onChange={e => setMinutes(Number(e.target.value))}
            className="flex-1 accent-[hsl(209,100%,33%)] h-2" />
          <span className="text-[.75rem] text-[#7a94a6] w-8 text-right">{minutes}'</span>
        </div>

        <label className="flex items-center gap-2.5 mt-5 mb-2 cursor-pointer select-none">
          <input type="checkbox" checked={addTech} onChange={e => setAddTech(e.target.checked)}
            className="w-[17px] h-[17px] accent-[hsl(209,100%,33%)]" />
          <span className="text-[.84rem] font-semibold text-[#1d3445]">Techniker hinzufügen</span>
        </label>
        {addTech && (
          <input type="text" placeholder="Name des Technikers" value={tech} onChange={e => setTech(e.target.value)}
            className="w-full min-h-[40px] px-3 py-2 border border-[#bdcddb] rounded-[10px] bg-white text-[#173044] text-[.84rem] mb-2 focus:outline-none focus:border-[hsl(209,100%,33%)] focus:ring-[3px] focus:ring-[hsl(209,100%,33%)]/[.13]" />
        )}

        {error && <p className="text-[.75rem] text-[#b42318] font-semibold mb-2">{error}</p>}

        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={onCancel}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-[10px] text-[.83rem] font-bold border border-[#efc9c5] bg-[#fffafa] text-[#a63930] hover:-translate-y-px transition-all">
            <X size={15} /> Abbrechen
          </button>
          <button type="button" onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-[10px] text-[.83rem] font-bold border border-[#15803d] bg-[#15803d] text-white hover:bg-[#166534] hover:-translate-y-px transition-all">
            <CheckCircle size={15} /> Bestätigen
          </button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  entries: Stoerung[];
  onChange: (entries: Stoerung[]) => void;
}

export default function StoerungsPanel({ entries, onChange }: Props) {
  const [linie1, setLinie1] = useState(false);
  const [linie2, setLinie2] = useState(false);
  const [bauteilOptions, setBauteilOptions] = useState(['Meurer', 'Econopak', 'MHD-Drucker', 'ZUN-Etikettendrucker']);
  const [bauteil, setBauteil] = useState('');
  const [time, setTime] = useState(nowTime);
  const [beschreibungOptions, setBeschreibungOptions] = useState(['Bandstillstand', 'Sensorausfall', 'Materialstau', 'Druckfehler']);
  const [beschreibung, setBeschreibung] = useState('');
  const [addError, setAddError] = useState('');
  const [resolving, setResolving] = useState<Stoerung | null>(null);
  const [nextId, setNextId] = useState(1);

  // Live elapsed minutes update
  const [, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(iv);
  }, []);

  const linienStr = [linie1 && 'Linie 1', linie2 && 'Linie 2'].filter(Boolean).join(', ');

  const handleAdd = useCallback(() => {
    if (!linie1 && !linie2) { setAddError('Bitte mindestens eine Linie auswählen.'); return; }
    if (!bauteil.trim()) { setAddError('Bitte Bauteil auswählen.'); return; }
    if (!beschreibung.trim()) { setAddError('Bitte Beschreibung eingeben.'); return; }
    if (!time) { setAddError('Bitte Uhrzeit auswählen.'); return; }
    setAddError('');
    const entry: Stoerung = {
      id: nextId, linie: linienStr, bauteil: bauteil.trim(), beschreibung: beschreibung.trim(),
      startTime: time, resolved: false, minutes: null, techniker: '-', resolvedTime: null,
    };
    onChange([...entries, entry]);
    setNextId(n => n + 1);
    setBeschreibung(''); setTime(nowTime());
  }, [linie1, linie2, bauteil, beschreibung, time, entries, nextId, linienStr, onChange]);

  const handleResolve = (stoerung: Stoerung, minutes: number, techniker: string) => {
    const [h, m] = stoerung.startTime.split(':').map(Number);
    const resolved = new Date(); resolved.setHours(h, m + minutes, 0, 0);
    const resolvedTime = `${String(resolved.getHours()).padStart(2, '0')}:${String(resolved.getMinutes()).padStart(2, '0')}`;
    onChange(entries.map(e => e.id === stoerung.id ? { ...e, resolved: true, minutes, techniker, resolvedTime } : e));
    setResolving(null);
  };

  const handleUnresolve = (id: number) => {
    onChange(entries.map(e => e.id === id ? { ...e, resolved: false, minutes: null, techniker: '-', resolvedTime: null } : e));
  };

  const handleDelete = (id: number) => {
    onChange(entries.filter(e => e.id !== id));
  };

  return (
    <div>
      {/* Row 1: Linie checkboxes + Bauteil */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <FieldLabel>Linie</FieldLabel>
          <div className="flex gap-2">
            {[{ label: 'Linie 1', checked: linie1, set: setLinie1 }, { label: 'Linie 2', checked: linie2, set: setLinie2 }].map(l => (
              <label key={l.label} className="flex items-center gap-2 min-h-[45px] px-3 border border-[#d3e0e8] rounded-[10px] bg-[#fbfdff] text-[.84rem] cursor-pointer hover:border-[hsl(209,100%,33%)]/30 transition-colors select-none">
                <input type="checkbox" checked={l.checked} onChange={e => l.set(e.target.checked)}
                  className="w-[17px] h-[17px] accent-[hsl(209,100%,33%)]" />
                <span className="text-[#1d3445] font-medium">{l.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-[180px]">
          <FieldLabel>Bauteil</FieldLabel>
          <EditableSelect value={bauteil} onChange={setBauteil} options={bauteilOptions} onOptionsChange={setBauteilOptions} placeholder="Bauteil wählen" />
        </div>
      </div>

      {/* Row 2: Time + Beschreibung + Add button */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="w-[110px]">
          <FieldLabel>Uhrzeit</FieldLabel>
          <input type="time" value={time} onChange={e => setTime(e.target.value)}
            className="w-full min-h-[45px] px-3 py-2.5 border border-[#bdcddb] rounded-[10px] bg-white text-[#173044] text-[.84rem] focus:outline-none focus:border-[hsl(209,100%,33%)] focus:ring-[3px] focus:ring-[hsl(209,100%,33%)]/[.13]" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <FieldLabel>Beschreibung</FieldLabel>
          <EditableSelect value={beschreibung} onChange={setBeschreibung} options={beschreibungOptions} onOptionsChange={setBeschreibungOptions} placeholder="Beschreibung eingeben" allowText />
        </div>
        <button type="button" onClick={handleAdd}
          className="inline-flex items-center gap-1.5 min-h-[45px] px-4 rounded-[10px] text-[.83rem] font-bold bg-[hsl(209,100%,33%)] text-white border border-[hsl(209,100%,33%)] hover:bg-[hsl(209,100%,22%)] hover:-translate-y-px transition-all">
          <Plus size={16} /> Hinzufügen
        </button>
      </div>

      {addError && <p className="text-[.75rem] text-[#b42318] font-semibold mb-3">{addError}</p>}

      {/* Table */}
      {entries.length > 0 && (
        <div className="border border-[#dce7ed] rounded-[12px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[.82rem]">
              <thead>
                <tr className="bg-[#f0f6fa] text-[#3d5a6e] text-left">
                  <th className="px-3 py-2.5 font-bold w-12">Nr.</th>
                  <th className="px-3 py-2.5 font-bold">Linie</th>
                  <th className="px-3 py-2.5 font-bold">Beschreibung</th>
                  <th className="px-3 py-2.5 font-bold w-20">Minuten</th>
                  <th className="px-3 py-2.5 font-bold">Techniker</th>
                  <th className="px-3 py-2.5 font-bold w-24 text-center">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={e.id} className={`border-t border-[#e5edf2] ${i % 2 === 0 ? 'bg-white' : 'bg-[#fafcfe]'} ${e.resolved ? 'opacity-80' : ''}`}>
                    <td className="px-3 py-2.5 font-semibold text-[#5d7182]">{e.id}</td>
                    <td className="px-3 py-2.5">{e.linie}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium">{e.beschreibung}</div>
                      <div className="text-[.72rem] text-[#7a94a6]">{e.bauteil} · {e.startTime}{e.resolvedTime ? ` → ${e.resolvedTime}` : ''}</div>
                    </td>
                    <td className="px-3 py-2.5 font-semibold">
                      {e.resolved ? (
                        <span className="text-[#15803d]">{e.minutes}'</span>
                      ) : (
                        <span className="text-[#b45309]">{elapsedMinutes(e.startTime)}'</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">{e.techniker}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        {e.resolved ? (
                          <button type="button" onClick={() => handleUnresolve(e.id)} title="Bearbeiten"
                            className="p-1.5 rounded-lg text-[hsl(209,100%,33%)] hover:bg-[#eaf4fb] transition-colors">
                            <Pencil size={15} />
                          </button>
                        ) : (
                          <button type="button" onClick={() => setResolving(e)} title="Auflösen"
                            className="p-1.5 rounded-lg text-[#15803d] hover:bg-[#f1fcf5] transition-colors">
                            <CheckCircle size={15} />
                          </button>
                        )}
                        <button type="button" onClick={() => handleDelete(e.id)} title="Löschen"
                          className="p-1.5 rounded-lg text-[#b42318] hover:bg-[#fff8f7] transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-8 text-[.84rem] text-[#7a94a6] border border-dashed border-[#d3e0e8] rounded-[12px]">
          Keine Störungen erfasst. Verwenden Sie das Formular oben, um Einträge hinzuzufügen.
        </div>
      )}

      {resolving && (
        <ResolveModal stoerung={resolving} onCancel={() => setResolving(null)}
          onConfirm={(min, tech) => handleResolve(resolving, min, tech)} />
      )}
    </div>
  );
}
