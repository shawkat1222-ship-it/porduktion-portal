import type { TabKey } from './Sidebar';
import { tabs } from './Sidebar';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function MobileNav({ active, onSelect }: { active: TabKey; onSelect: (k: TabKey) => void }) {
  const [open, setOpen] = useState(false);
  const activeTab = tabs.find(t => t.key === active);

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between p-4 text-white" style={{ background: 'hsl(209 100% 33%)' }}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">NORDFROST</span>
          <span className="text-xs opacity-80">{activeTab?.title}</span>
        </div>
        <button onClick={() => setOpen(!open)} className="p-1 rounded-lg bg-white/10">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="p-3 grid gap-1" style={{ background: 'hsl(209 100% 22%)' }}>
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => { onSelect(t.key); setOpen(false); }}
                className={`flex items-center gap-2.5 p-3 rounded-xl text-left text-sm transition-all ${active === t.key ? 'bg-white text-[#002d54] font-bold' : 'text-[#dceefd] hover:bg-white/10'}`}
              >
                <Icon size={16} />
                <span>{t.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
