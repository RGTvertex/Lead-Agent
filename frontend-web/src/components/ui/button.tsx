import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

const variants: Record<string, string> = {
  primary:  'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-sm border border-brand-500',
  secondary:'bg-teal-500 text-white hover:bg-teal-600 active:bg-teal-700 shadow-sm border border-teal-500',
  outline:  'bg-transparent border-2 border-brand-500 text-brand-500 hover:bg-brand-50 active:bg-brand-100 font-semibold',
  ghost:    'bg-transparent hover:bg-surface-1 text-ink hover:text-brand-500',
  danger:   'bg-danger text-white hover:bg-red-600 shadow-sm border border-danger',
  success:  'bg-success text-white hover:bg-teal-600 shadow-sm border border-success',
};

const sizes: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs font-semibold rounded',
  md: 'px-5 py-2.5 text-sm font-semibold rounded-lg min-h-[44px]',
  lg: 'px-7 py-3.5 text-base font-bold rounded-lg min-h-[48px]',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all duration-base ease-hubspot',
        'disabled:opacity-40 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);

Button.displayName = 'Button';
export default Button;
