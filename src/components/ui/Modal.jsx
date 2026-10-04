import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg', footer = null }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape key press
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />
      <div className={`relative w-full ${maxWidth} max-h-[94vh] sm:max-h-[90vh] flex flex-col bg-white dark:bg-[#0E1422] rounded-2xl shadow-2xl animate-slide-up border border-slate-100 dark:border-white/15 backdrop-blur-2xl overflow-hidden`}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-white/10 flex-shrink-0">
          <h2 className="text-sm sm:text-base font-semibold text-navy-900 dark:text-white truncate pr-2">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-500 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 py-3.5 sm:py-4 min-h-0">{children}</div>
        {footer && (
          <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-[#0B0F19]/90 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
