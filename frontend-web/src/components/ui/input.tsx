import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'block w-full rounded-lg border border-ink-faint bg-canvas px-3 py-2.5 text-sm text-ink',
          'placeholder:text-ink-light',
          'focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none',
          'disabled:opacity-50 disabled:bg-surface-1',
          error && 'border-danger focus:border-danger focus:ring-danger',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger font-medium">{error}</p>}
    </div>
  )
);

Input.displayName = 'Input';
export default Input;
