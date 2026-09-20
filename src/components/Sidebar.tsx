import { useState } from 'react';
import { TriangleAlert, Boxes, PackageSearch, BadgeAlert, Send, Snowflake } from 'lucide-react';

const tabs = [
  { key: 'incidents', icon: TriangleAlert, title: 'Störungsprotokoll', desc: 'Erfassung aller Störungen, Stillstände & Ursachen pro Schicht' },
  { key: 'production', icon: Boxes, title: 'Palettenmenge & Mitarbeiter', desc: 'Übersicht produzierter Paletten und Personal pro Schicht' },
  { key: 'remaining', icon: PackageSearch, title: 'Restmengenzählung', desc: 'Zählung Restmengen, Folien & Kartonagen am Schichtende' },
  { key: 'pallet-status', icon: BadgeAlert, title: 'Palettenstatus', desc: 'Paletten unvollständig, ohne LT, fehlende Zusatzetiketten, MHD-Druck verschmiert / unlesbar' },
  { key: 'save-send', icon: Send, title: 'Speichern & E-Mail senden', desc: 'Schichtbericht speichern und per E-Mail versenden' },
] as const;

export type TabKey = typeof tabs[number]['key'];

export default function Sidebar({ active, onSelect }: { active: TabKey; onSelect: (k: TabKey) => void }) {
  return (
    <aside className="hidden md:flex flex-col min-w-[280px] w-[320px] p-[30px_18px] text-white" style={{ background: 'linear-gradient(165deg, hsl(209 100% 33%), hsl(209 100% 22%) 70%, hsl(209 100% 16%))' }}>
      <div className="flex items-center gap-3 px-2.5 pb-5 border-b border-white/[.18]">
        <div className="w-[43px] h-[43px] grid place-items-center rounded-[11px] bg-white text-[hsl(209,100%,33%)]">
          <Snowflake size={22} />
        </div>
        <div>
          <p className="m-0 text-[11px] font-bold tracking-[.12em] uppercase" style={{ color: '#bedfff' }}>NORDFROST GmbH</p>
          <h2 className="mt-0.5 text-[1.16rem] font-bold text-white">Produktion portal</h2>
        </div>
      </div>

      <p className="mx-2.5 mt-7 mb-2.5 text-[11px] font-bold tracking-[.12em] uppercase" style={{ color: '#c5e3fa' }}>Schichtbericht</p>

      <nav className="grid gap-[7px]">
        {tabs.map(t => {
          const selected = active === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => onSelect(t.key)}
              className={`w-full grid grid-cols-[30px_minmax(0,1fr)] gap-2.5 items-start p-[13px_11px] rounded-[13px] text-left transition-all duration-150
                ${selected
                  ? 'bg-white text-[#002d54] border border-white shadow-[0_8px_18px_rgba(0,33,68,.2)]'
                  : 'bg-transparent text-[#dceefd] border border-transparent hover:bg-white/[.11] hover:text-white'}`}
            >
              <span className={`w-[29px] h-[29px] grid place-items-center rounded-lg ${selected ? 'bg-[#dceffc] text-[hsl(209,100%,33%)]' : 'bg-white/[.13] text-[#d8f0ff]'}`}>
                <Icon size={16} />
              </span>
              <span>
                <span className={`block text-[.84rem] leading-tight ${selected ? 'font-bold text-[#001a33]' : 'font-bold'}`}>{t.title}</span>
                <span className={`block mt-0.5 text-[.7rem] leading-snug ${selected ? 'text-[#001a33] font-bold opacity-80' : 'opacity-80'}`}>{t.desc}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-3.5 border border-white/[.18] rounded-[13px] bg-white/[.09]">
        <p className="m-0 text-[.8rem] font-bold text-white">Sorgfältig dokumentiert</p>
        <p className="mt-1 m-0 text-[.74rem] leading-[1.45]" style={{ color: '#dceefd' }}>Pflichtfelder sind mit einem Sternchen markiert. Prüfen Sie den Bericht vor dem Export.</p>
      </div>
    </aside>
  );
}

export { tabs };
