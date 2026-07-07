import { cn } from '@/lib/utils';

interface BadgeProps { children: React.ReactNode; variant?: string; className?: string; }

const badgeStyles: Record<string, string> = {
  new:             'bg-blue-100 text-blue-700 border border-blue-200',
  contacted:       'bg-violet-100 text-violet-700 border border-violet-200',
  qualified:       'bg-indigo-100 text-indigo-700 border border-indigo-200',
  proposal_sent:   'bg-amber-100 text-amber-700 border border-amber-200',
  negotiation:     'bg-yellow-100 text-yellow-700 border border-yellow-200',
  won:             'bg-emerald-100 text-emerald-700 border border-emerald-200',
  lost:            'bg-red-100 text-red-700 border border-red-200',
  active:          'bg-emerald-50 text-emerald-700 border border-emerald-200',
  inactive:        'bg-gray-100 text-ink-muted border border-ink-faint',
  lead:            'bg-brand-50 text-brand-500 border border-brand-100',
  high:            'bg-red-50 text-danger border border-red-100',
  medium:          'bg-amber-50 text-amber-700 border border-amber-100',
  low:             'bg-gray-50 text-ink-muted border border-ink-faint',
  pending:         'bg-gray-100 text-ink-muted',
  in_progress:     'bg-brand-50 text-brand-500',
  completed:       'bg-emerald-50 text-emerald-700',
  call:            'bg-blue-50 text-blue-700',
  meeting:         'bg-violet-50 text-violet-700',
  email:           'bg-teal-50 text-teal-600',
  follow_up:       'bg-amber-50 text-amber-700',
  admin:           'bg-red-50 text-danger',
  sales_manager:   'bg-amber-50 text-amber-700',
  sales_executive: 'bg-brand-50 text-brand-500',
};

export default function Badge({ children, variant = 'new', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-pill px-2.5 py-0.5 text-[11px] font-semibold tracking-wide leading-tight',
      badgeStyles[variant] || 'bg-surface-1 text-ink-muted',
      className
    )}>
      {children}
    </span>
  );
}
