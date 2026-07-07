import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean; onClose: () => void; title: string;
  children: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const sizes: Record<string, string> = {
    sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh]">
      <div className="fixed inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative w-full bg-canvas rounded-xl shadow-elevated border border-ink-faint overflow-hidden',
        sizes[size]
      )}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-faint">
          <h2 className="text-base font-bold text-ink">{title}</h2>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-1 text-ink-muted hover:text-ink transition-colors duration-fast min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-4 max-h-[65vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
