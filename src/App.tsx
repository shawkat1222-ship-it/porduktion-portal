import { useState, useCallback } from 'react';
import { CircleDot, ArrowRight, ListChecks, Download, Mail, RotateCcw, Info, CheckCircle, AlertTriangle, Save, Pencil, Check } from 'lucide-react';
import Sidebar, { type TabKey } from './components/Sidebar';
import MobileNav from './components/MobileNav';
import FormSection from './components/FormSection';
import StoerungsPanel, { type Stoerung } from './components/StoerungsPanel';
import { FieldGroup, FieldLabel, TextInput, SelectInput, DateInput, TextArea, Hint } from './components/FormFields';

function today() { return new Date().toISOString().slice(0, 10); }

const INITIAL = {
  reportDate: today(), shift: '', shiftLead: '',
  plannedPallets: '0', producedPallets: '0', employeeCount: '1', staffing: '', productionNote: '',
  remainingGoods: '0', filmRolls: '0', cartons: '0', materialCheck: '', remainingNote: '',
  nokTypes: [] as string[], nokCount: '0', nokLocation: '', nokNote: '',
};

type FormData = typeof INITIAL;
type MessageType = 'success' | 'error' | 'info' | null;

export default function App() {
  const [tab, setTab] = useState<TabKey>('incidents');
  const [form, setForm] = useState<FormData>({ ...INITIAL });
  const [stoerungen, setStoerungen] = useState<Stoerung[]>([]);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState<{ type: MessageType; text: string }>({ type: null, text: '' });
  const [showReset, setShowReset] = useState(false);
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const set = useCallback((field: keyof FormData, value: string) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: false }));
  }, []);

  const toggleNok = useCallback((v: string) => {
    setForm(p => ({ ...p, nokTypes: p.nokTypes.includes(v) ? p.nokTypes.filter(x => x !== v) : [...p.nokTypes, v] }));
  }, []);

  const tabIndex = ['incidents', 'production', 'remaining', 'pallet-status', 'save-send'].indexOf(tab) + 1;
  const progress = tabIndex * 20;

  const globalRequired: (keyof FormData)[] = ['reportDate', 'shift', 'shiftLead'];

  const requiredFields: Record<string, (keyof FormData)[]> = {
    production: ['plannedPallets', 'producedPallets', 'employeeCount', 'staffing'],
    remaining: ['remainingGoods', 'filmRolls', 'cartons', 'materialCheck'],
    'pallet-status': ['nokCount'],
  };

  const validateSection = (section: string) => {
    const fields = requiredFields[section] || [];
    const newErrors: Record<string, boolean> = {};
    let valid = true;
    for (const f of fields) {
      const val = typeof form[f] === 'string' ? (form[f] as string).trim() : '';
      if (!val) { newErrors[f] = true; valid = false; }
    }
    setErrors(p => ({ ...p, ...newErrors }));
    return valid;
  };

  const validateAll = () => {
    let allValid = true;
    const allErrors: Record<string, boolean> = {};
    for (const f of globalRequired) {
      const val = typeof form[f] === 'string' ? (form[f] as string).trim() : '';
      if (!val) { allErrors[f] = true; allValid = false; }
    }
    for (const [section, fields] of Object.entries(requiredFields)) {
      for (const f of fields) {
        const val = typeof form[f] === 'string' ? (form[f] as string).trim() : '';
        if (!val) { allErrors[f] = true; allValid = false; }
      }
    }
    setErrors(allErrors);
    if (!allValid) {
      setMsg({ type: 'error', text: 'Bitte prüfen Sie die markierten Pflichtfelder, bevor Sie fortfahren.' });
      // Navigate to first section with error
      for (const section of Object.keys(requiredFields)) {
        for (const f of requiredFields[section]) {
          if (allErrors[f]) { setTab(section as TabKey); return false; }
        }
      }
    } else {
      setMsg({ type: 'success', text: 'Der Schichtbericht ist vollständig und zur weiteren Verarbeitung bereit.' });
    }
    return allValid;
  };

  const nextTab = (from: string, to: TabKey) => {
    if (validateSection(from)) setTab(to);
    else setMsg({ type: 'error', text: 'Bitte ergänzen Sie die markierten Pflichtfelder dieses Abschnitts.' });
  };

  const handleSave = () => {
    if (!validateAll()) return;
    const data = { berichtErstelltAm: new Date().toISOString(), schichtbericht: { ...form } };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Schichtbericht_${form.reportDate || 'NORDFROST'}.json`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    setMsg({ type: 'success', text: 'Der Schichtbericht wurde als JSON-Datei für Ihre Unterlagen gespeichert.' });
  };

  const handleEmail = () => {
    if (!validateAll()) return;
    const types = form.nokTypes.length ? form.nokTypes.join(', ') : 'Keine NOK-Ursache angegeben';
    const body = [
      'Guten Tag,', '', 'anbei die Zusammenfassung des Schichtberichts.', '',
      `Datum: ${form.reportDate}`, `Schicht: ${form.shift}`,
      `Maschinenführer: ${form.shiftLead}`, `Produzierte Paletten: ${form.producedPallets}`,
      `Mitarbeitende: ${form.employeeCount}`, `NOK-Paletten: ${form.nokCount}`, `NOK-Status: ${types}`,
      '', 'Freundliche Grüße',
    ].join('\n');
    window.open(`mailto:?subject=${encodeURIComponent(`Schichtbericht ${form.reportDate} – ${form.shift}`)}&body=${encodeURIComponent(body)}`, '_blank');
    setMsg({ type: 'info', text: 'Ein E-Mail-Entwurf wurde vorbereitet. Bitte wählen Sie Empfänger und Versandzeitpunkt in Ihrem E-Mail-Programm.' });
  };

  const handleReset = () => {
    setForm({ ...INITIAL, reportDate: today() });
    setStoerungen([]);
    setErrors({});
    setShowReset(false);
    setSaved({});
    setTab('incidents');
    setMsg({ type: 'info', text: 'Das Formular wurde zurückgesetzt. Bitte erfassen Sie den neuen Schichtbericht.' });
  };

  const nokOptions = ['Unvollständig', 'Ohne LT', 'Fehlende Zusatzetiketten', 'MHD-Druck verschmiert oder unlesbar'];

  const toggleSaved = (section: string) => setSaved(p => ({ ...p, [section]: !p[section] }));

  const isSaved = saved[tab] ?? false;

  const SectionActions = ({ label, from, to }: { label: string; from: string; to: TabKey }) => (
    <div className="flex justify-end gap-2.5 mt-[22px]">
      <button type="button" onClick={() => toggleSaved(from)}
        className={`inline-flex items-center gap-2 min-h-[42px] px-4 rounded-[10px] text-[.83rem] font-bold transition-all hover:-translate-y-px
          ${saved[from]
            ? 'bg-[hsl(209,100%,33%)] text-white border border-[hsl(209,100%,33%)] hover:bg-[hsl(209,100%,22%)]'
            : 'bg-[#15803d] text-white border border-[#15803d] hover:bg-[#166534]'}`}>
        {saved[from] ? <><Pencil size={15} /> Bearbeiten</> : <><Save size={15} /> Speichern</>}
      </button>
      <button onClick={() => nextTab(from, to)}
        className="inline-flex items-center gap-2 min-h-[42px] px-4 rounded-[10px] text-[.83rem] font-bold bg-[hsl(209,100%,33%)] text-white border border-[hsl(209,100%,33%)] hover:bg-[hsl(209,100%,22%)] hover:-translate-y-px transition-all">
        <ArrowRight size={16} />{label}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen p-3 sm:p-[22px]" style={{ background: 'radial-gradient(circle at 0 0, #d6eefd 0, transparent 30%), linear-gradient(135deg, #f7fbfd, #e9f0f5)' }}>
      <div className="max-w-[1360px] mx-auto min-h-[calc(100vh-44px)] grid md:grid-cols-[320px_minmax(0,1fr)] overflow-hidden border border-[#ccdae4] rounded-3xl bg-white shadow-[0_24px_60px_rgba(0,58,102,.14)]">
        <Sidebar active={tab} onSelect={setTab} />
        <MobileNav active={tab} onSelect={setTab} />

        <main className="min-w-0 p-6 sm:p-[38px] bg-[#fbfdff] overflow-x-hidden">
          <div className="max-w-[900px] mx-auto">
            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between gap-4 items-start mb-[22px]">
              <div>
                <p className="m-0 text-[.73rem] font-bold tracking-[.13em] uppercase text-[hsl(209,100%,33%)]">Schichtdokumentation</p>
                <h1 className="mt-[7px] m-0 text-[clamp(1.75rem,4vw,2.4rem)] leading-[1.1] tracking-tight font-bold text-[#102a43]">Produktions-Schichtübergabe</h1>
                <p className="max-w-[650px] mt-[11px] m-0 text-[#5d7182] leading-relaxed">Erfassen Sie alle relevanten Produktionsdaten strukturiert und bereiten Sie den Bericht für die Übergabe oder den E-Mail-Versand vor.</p>
              </div>
              {isSaved ? (
                <span className="inline-flex items-center gap-[7px] px-2.5 py-2 border border-[#b6dfc7] rounded-full bg-[#f1fcf5] text-[#15803d] text-[.75rem] font-bold whitespace-nowrap">
                  <Check size={14} /> Gespeichert
                </span>
              ) : (
                <span className="inline-flex items-center gap-[7px] px-2.5 py-2 border border-[#cfe2ef] rounded-full bg-[#eff8ff] text-[#07518b] text-[.75rem] font-bold whitespace-nowrap">
                  <CircleDot size={14} /> Entwurf wird bearbeitet
                </span>
              )}
            </header>

            {/* Global fields – visible on all tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-[17px] mb-5 p-[18px] border border-[#dce7ed] rounded-[15px] bg-white shadow-[0_4px_12px_rgba(0,58,102,.05)]">
              <FieldGroup error={errors.reportDate ? 'Bitte Datum angeben.' : undefined}>
                <FieldLabel htmlFor="reportDate" required>Datum</FieldLabel>
                <DateInput id="reportDate" value={form.reportDate} onChange={v => set('reportDate', v)} error={errors.reportDate} />
              </FieldGroup>
              <FieldGroup error={errors.shift ? 'Bitte Schicht wählen.' : undefined}>
                <FieldLabel htmlFor="shift" required>Schicht</FieldLabel>
                <SelectInput id="shift" name="shift" value={form.shift} onChange={v => set('shift', v)} options={['Schicht A', 'Schicht B', 'Schicht C']} error={errors.shift} />
              </FieldGroup>
              <FieldGroup error={errors.shiftLead ? 'Bitte Maschinenführer angeben.' : undefined}>
                <FieldLabel htmlFor="shiftLead" required>Maschinenführer</FieldLabel>
                <TextInput id="shiftLead" name="shiftLead" placeholder="Name" value={form.shiftLead} onChange={v => set('shiftLead', v)} error={errors.shiftLead} />
              </FieldGroup>
            </div>

            {/* Progress */}
            <div className="p-[15px_17px] mb-5 border border-[hsl(207,30%,82%)] rounded-[15px] bg-white">
              <div className="flex justify-between gap-3 mb-2 text-[#566d7d] text-[.78rem] font-semibold">
                <span>Bearbeitungsfortschritt</span>
                <span>{tabIndex} von 5 Abschnitten</span>
              </div>
              <div className="h-[7px] overflow-hidden rounded-full bg-[#e5edf2]">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, hsl(209 100% 33%), hsl(200 72% 55%))' }} />
              </div>
            </div>

            {/* Section 1 – Störungsprotokoll */}
            <FormSection number="01" title="Störungsprotokoll" description="Störungen, Stillstände und eingeleitete Maßnahmen erfassen." visible={tab === 'incidents'}>
              <StoerungsPanel entries={stoerungen} onChange={setStoerungen} />
              <SectionActions label="Weiter zu Palettenmenge & Mitarbeiter" from="incidents" to="production" />
            </FormSection>

            {/* Section 2 – Palettenmenge & Mitarbeiter */}
            <FormSection number="02" title="Palettenmenge & Mitarbeiter" description="Dokumentieren Sie die Leistung der Schicht und die verfügbare Personalbesetzung." visible={tab === 'production'}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[17px]">
                <FieldGroup error={errors.plannedPallets ? 'Bitte geben Sie die geplante Palettenmenge an.' : undefined}>
                  <FieldLabel htmlFor="plannedPallets" required>Geplante Palettenmenge</FieldLabel>
                  <TextInput id="plannedPallets" name="plannedPallets" type="number" value={form.plannedPallets} onChange={v => set('plannedPallets', v)} error={errors.plannedPallets} />
                </FieldGroup>
                <FieldGroup error={errors.producedPallets ? 'Bitte geben Sie die produzierte Palettenmenge an.' : undefined}>
                  <FieldLabel htmlFor="producedPallets" required>Produzierte Paletten</FieldLabel>
                  <TextInput id="producedPallets" name="producedPallets" type="number" value={form.producedPallets} onChange={v => set('producedPallets', v)} error={errors.producedPallets} />
                </FieldGroup>
                <FieldGroup error={errors.employeeCount ? 'Bitte geben Sie mindestens eine anwesende Person an.' : undefined}>
                  <FieldLabel htmlFor="employeeCount" required>Anwesende Mitarbeitende</FieldLabel>
                  <TextInput id="employeeCount" name="employeeCount" type="number" value={form.employeeCount} onChange={v => set('employeeCount', v)} error={errors.employeeCount} />
                </FieldGroup>
                <FieldGroup error={errors.staffing ? 'Bitte bewerten Sie die Personalbesetzung.' : undefined}>
                  <FieldLabel htmlFor="staffing" required>Personalbesetzung</FieldLabel>
                  <SelectInput id="staffing" name="staffing" value={form.staffing} onChange={v => set('staffing', v)} options={['Planbesetzung', 'Unterbesetzung', 'Überbesetzung']} error={errors.staffing} />
                </FieldGroup>
                <FieldGroup wide>
                  <FieldLabel htmlFor="productionNote">Hinweis zur Produktion</FieldLabel>
                  <TextArea id="productionNote" name="productionNote" placeholder="Optional: Besonderheiten zur Leistung, Umrüstung oder Personalplanung" value={form.productionNote} onChange={v => set('productionNote', v)} />
                </FieldGroup>
              </div>
              <SectionActions label="Weiter zur Restmengenzählung" from="production" to="remaining" />
            </FormSection>

            {/* Section 3 – Restmengenzählung */}
            <FormSection number="03" title="Restmengenzählung" description="Zählen Sie die verbliebenen Materialien am Schichtende und bestätigen Sie den Prüfstatus." visible={tab === 'remaining'}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[17px]">
                <FieldGroup error={errors.remainingGoods ? 'Bitte tragen Sie die Restmenge ein.' : undefined}>
                  <FieldLabel htmlFor="remainingGoods" required>Restmenge Ware (Einheiten)</FieldLabel>
                  <TextInput id="remainingGoods" name="remainingGoods" type="number" value={form.remainingGoods} onChange={v => set('remainingGoods', v)} error={errors.remainingGoods} />
                </FieldGroup>
                <FieldGroup error={errors.filmRolls ? 'Bitte tragen Sie die Anzahl Folienrollen ein.' : undefined}>
                  <FieldLabel htmlFor="filmRolls" required>Folienrollen (Stück)</FieldLabel>
                  <TextInput id="filmRolls" name="filmRolls" type="number" value={form.filmRolls} onChange={v => set('filmRolls', v)} error={errors.filmRolls} />
                </FieldGroup>
                <FieldGroup error={errors.cartons ? 'Bitte tragen Sie die Anzahl Kartonagen ein.' : undefined}>
                  <FieldLabel htmlFor="cartons" required>Kartonagen (Stück)</FieldLabel>
                  <TextInput id="cartons" name="cartons" type="number" value={form.cartons} onChange={v => set('cartons', v)} error={errors.cartons} />
                </FieldGroup>
                <FieldGroup error={errors.materialCheck ? 'Bitte bestätigen Sie den Materialstatus.' : undefined}>
                  <FieldLabel htmlFor="materialCheck" required>Prüfstatus Material</FieldLabel>
                  <SelectInput id="materialCheck" name="materialCheck" value={form.materialCheck} onChange={v => set('materialCheck', v)} options={['Gezählt und geprüft', 'Nachzählung erforderlich', 'Abweichung festgestellt']} error={errors.materialCheck} />
                </FieldGroup>
                <FieldGroup wide>
                  <FieldLabel htmlFor="remainingNote">Hinweis zu Restmengen</FieldLabel>
                  <TextArea id="remainingNote" name="remainingNote" placeholder="Optional: Chargen, Lagerort oder auffällige Bestände dokumentieren" value={form.remainingNote} onChange={v => set('remainingNote', v)} />
                </FieldGroup>
              </div>
              <SectionActions label="Weiter zum Palettenstatus" from="remaining" to="pallet-status" />
            </FormSection>

            {/* Section 4 – Palettenstatus */}
            <FormSection number="04" title="Palettenstatus" description="NOK-Paletten erfassen, kategorisieren und den aktuellen Ablageort dokumentieren." visible={tab === 'pallet-status'}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[17px]">
                <fieldset className="col-span-full border-0 p-0 m-0">
                  <legend className="block mb-[7px] text-[.82rem] font-bold text-[#1d3445]">NOK-Gründe auswählen</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {nokOptions.map(opt => (
                      <label key={opt} className="flex items-center gap-[9px] min-h-[44px] p-2.5 border border-[#d3e0e8] rounded-[10px] bg-[#fbfdff] text-[.81rem] cursor-pointer hover:border-[hsl(209,100%,33%)]/30 transition-colors">
                        <input type="checkbox" checked={form.nokTypes.includes(opt)} onChange={() => toggleNok(opt)}
                          className="w-[17px] h-[17px] accent-[hsl(209,100%,33%)]" />
                        <span className="text-[#1d3445] font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>
                  <Hint>Mehrere Ursachen können gleichzeitig ausgewählt werden.</Hint>
                </fieldset>
                <FieldGroup error={errors.nokCount ? 'Bitte geben Sie die Anzahl NOK-Paletten an.' : undefined}>
                  <FieldLabel htmlFor="nokCount" required>Anzahl NOK-Paletten</FieldLabel>
                  <TextInput id="nokCount" name="nokCount" type="number" value={form.nokCount} onChange={v => set('nokCount', v)} error={errors.nokCount} />
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel htmlFor="nokLocation">Ablageort / Sperrlager</FieldLabel>
                  <TextInput id="nokLocation" name="nokLocation" placeholder="z. B. Sperrlager Zone B" value={form.nokLocation} onChange={v => set('nokLocation', v)} />
                </FieldGroup>
                <FieldGroup wide>
                  <FieldLabel htmlFor="nokNote">Hinweis zu NOK-Paletten</FieldLabel>
                  <TextArea id="nokNote" name="nokNote" placeholder="NOK-Paletten, Kennzeichnung und erforderliche Nacharbeit beschreiben" value={form.nokNote} onChange={v => set('nokNote', v)} />
                </FieldGroup>
              </div>
              <SectionActions label="Weiter zum Speichern" from="pallet-status" to="save-send" />
            </FormSection>

            {/* Section 5 – Speichern & Senden */}
            <FormSection number="05" title="Speichern & E-Mail senden" description="Prüfen Sie den Bericht, speichern Sie ihn als Datei oder bereiten Sie einen E-Mail-Entwurf vor." visible={tab === 'save-send'}>
              <div className="p-[18px] border border-[#d7e6ee] rounded-[14px] bg-[#f5faff]">
                <p className="m-0 font-bold text-[#102a43] text-sm">Abschlussprüfung</p>
                <p className="mt-1 m-0 text-[.8rem] text-[#607786] leading-[1.45]">Der Bericht wird erst nach erfolgreicher Prüfung exportiert oder als E-Mail-Entwurf vorbereitet. Ein tatsächlicher E-Mail-Versand erfolgt nicht automatisch.</p>
              </div>

              <div className="grid sm:grid-cols-[1fr_auto] gap-[18px] items-center p-5 mt-[17px] border border-[#d7e6ee] rounded-[14px]" style={{ background: 'linear-gradient(135deg, #f1f9ff, #fff)' }}>
                <div>
                  <p className="m-0 font-bold text-[#102a43]">Bericht abschließen</p>
                  <p className="mt-1 m-0 text-[.8rem] text-[#617684] leading-[1.45]">Nutzen Sie den Export für Ihre Dokumentation oder erstellen Sie eine E-Mail-Zusammenfassung für die Übergabe.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ActionBtn icon={<ListChecks size={16} />} label="Bericht prüfen" variant="outline" onClick={validateAll} />
                  <ActionBtn icon={<Download size={16} />} label="Bericht speichern" variant="primary" onClick={handleSave} />
                  <ActionBtn icon={<Mail size={16} />} label="E-Mail-Entwurf vorbereiten" variant="outline" onClick={handleEmail} />
                  <ActionBtn icon={<RotateCcw size={16} />} label="Formular zurücksetzen" variant="danger" onClick={() => setShowReset(true)} />
                </div>
              </div>

              {showReset && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-[15px] p-[13px] border border-[#f0d0cb] rounded-[11px] bg-[#fff9f8]">
                  <p className="m-0 text-[.8rem] font-semibold text-[#81352d]">Möchten Sie wirklich alle Angaben zurücksetzen?</p>
                  <div className="flex gap-2">
                    <ActionBtn label="Abbrechen" variant="outline" onClick={() => setShowReset(false)} />
                    <ActionBtn label="Jetzt zurücksetzen" variant="danger" onClick={handleReset} />
                  </div>
                </div>
              )}

              {msg.type && (
                <div className={`flex items-start gap-[9px] mt-[15px] p-[13px] rounded-[11px] text-[.82rem] font-semibold leading-[1.4]
                  ${msg.type === 'success' ? 'border border-[#b6dfc7] bg-[#f1fcf5] text-[#087443]' : ''}
                  ${msg.type === 'error' ? 'border border-[#efc3be] bg-[#fff8f7] text-[#b42318]' : ''}
                  ${msg.type === 'info' ? 'border border-[#bddded] bg-[#f2faff] text-[#075b91]' : ''}`}>
                  {msg.type === 'success' ? <CheckCircle size={18} className="flex-none mt-0.5" /> :
                   msg.type === 'error' ? <AlertTriangle size={18} className="flex-none mt-0.5" /> :
                   <Info size={18} className="flex-none mt-0.5" />}
                  <span>{msg.text}</span>
                </div>
              )}
            </FormSection>
          </div>
        </main>
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, variant, onClick }: { icon?: React.ReactNode; label: string; variant: 'primary' | 'outline' | 'danger'; onClick: () => void }) {
  const base = "inline-flex items-center justify-center gap-2 min-h-[44px] px-[15px] rounded-[10px] text-[.83rem] font-bold transition-all hover:-translate-y-px";
  const styles = {
    primary: 'border border-[hsl(209,100%,33%)] bg-[hsl(209,100%,33%)] text-white hover:bg-[hsl(209,100%,22%)]',
    outline: 'border border-[#bdcddb] bg-white text-[#25445a]',
    danger: 'border border-[#efc9c5] bg-[#fffafa] text-[#a63930]',
  };
  return <button type="button" onClick={onClick} className={`${base} ${styles[variant]}`}>{icon}{label}</button>;
}
