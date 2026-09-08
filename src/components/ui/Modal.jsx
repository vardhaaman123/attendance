import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className={`relative w-full ${maxWidth} bg-white dark:bg-navy-800 rounded-2xl shadow-2xl animate-slide-up border border-slate-100 dark:border-navy-700`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-navy-700">
          <h2 className="text-base font-semibold text-navy-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
