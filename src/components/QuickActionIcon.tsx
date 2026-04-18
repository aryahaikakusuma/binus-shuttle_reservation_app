import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  gradient?: string;
}

export function QuickActionIcon({ icon: Icon, label, onClick, gradient = 'from-accent to-primary/10' }: Props) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5">
      <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-card`}>
        <Icon className="w-6 h-6 text-accent-foreground" />
      </div>
      <span className="text-caption text-ink-light">{label}</span>
    </button>
  );
}
