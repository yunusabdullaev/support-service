// Product badge with unique colors per product name
const PRODUCT_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  ERP: { bg: 'bg-violet-500/15', text: 'text-violet-300', border: 'border-violet-500/30', dot: 'bg-violet-400' },
  EDI: { bg: 'bg-cyan-500/15',   text: 'text-cyan-300',   border: 'border-cyan-500/30',   dot: 'bg-cyan-400'   },
  EDO: { bg: 'bg-amber-500/15',  text: 'text-amber-300',  border: 'border-amber-500/30',  dot: 'bg-amber-400'  },
};

const DEFAULT_PRODUCT_COLOR = { bg: 'bg-slate-700/50', text: 'text-slate-300', border: 'border-slate-600/50', dot: 'bg-slate-400' };

export function ProductBadge({ name, size = 'sm' }: { name: string; size?: 'xs' | 'sm' }) {
  const c = PRODUCT_COLORS[name.toUpperCase()] || DEFAULT_PRODUCT_COLOR;
  const textSize  = size === 'xs' ? 'text-[10px]' : 'text-xs';
  const padding   = size === 'xs' ? 'px-1.5 py-0.5' : 'px-2 py-0.5';
  const dotSize   = size === 'xs' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <span className={`inline-flex items-center gap-1 ${textSize} font-semibold ${padding} rounded-md border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`${dotSize} rounded-full ${c.dot} opacity-80`} />
      {name}
    </span>
  );
}
