import { cn } from '@/lib/utils';

interface CardProps { children: React.ReactNode; className?: string; padding?: boolean; hover?: boolean; }

export default function Card({ children, className, padding = true, hover }: CardProps) {
  return (
    <div className={cn(
      'bg-canvas rounded-xl border border-ink-faint shadow-card',
      padding && 'p-5',
      hover && 'hover:shadow-card-hover transition-shadow duration-base ease-hubspot',
      className
    )}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center justify-between mb-3', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-sm font-bold text-ink uppercase tracking-wider', className)}>{children}</h3>;
}
