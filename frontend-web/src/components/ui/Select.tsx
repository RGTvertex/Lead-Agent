import { type SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, id, options, ...props }, ref) => (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={id}
          className={cn(
            'block w-full appearance-none rounded-lg border border-ink-faint bg-canvas pl-3 pr-10 py-2.5 text-sm text-ink',
            'focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none',
            className
          )}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
      </div>
    </div>
  )
);

Select.displayName = 'Select';
export default Select;
