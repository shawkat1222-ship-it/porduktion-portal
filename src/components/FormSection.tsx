import { ReactNode } from 'react';

export default function FormSection({ number, title, description, children, visible }: {
  number: string; title: string; description: string; children: ReactNode; visible: boolean;
}) {
  if (!visible) return null;
  return (
    <section className="p-[27px] border border-[#dce7ed] rounded-[19px] bg-white shadow-[0_12px_28px_rgba(24,64,92,.06)] animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex gap-[13px] items-start mb-[22px]">
        <span className="w-[31px] h-[31px] grid place-items-center flex-none rounded-[9px] bg-[#e5f3fc] text-[hsl(209,100%,33%)] text-[.78rem] font-bold">{number}</span>
        <div>
          <h2 className="m-0 text-[1.18rem] leading-tight font-bold text-[#102a43]">{title}</h2>
          <p className="mt-1 m-0 text-[.84rem] leading-[1.45] text-[#637786]">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
