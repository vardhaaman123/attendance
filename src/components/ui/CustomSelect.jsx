import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({
  value,
  onChange,
  options,
  children,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  icon: LeftIcon,
}) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const containerRef = useRef(null);

  // Parse options either from options prop or from <option> children
  const parsedOptions = useMemo(() => {
    if (options && options.length > 0) {
      return options.map((opt) =>
        typeof opt === 'object' && opt !== null
          ? { value: String(opt.value), label: opt.label ?? opt.value }
          : { value: String(opt), label: String(opt) }
      );
    }

    if (children) {
      const list = [];
      React.Children.forEach(children, (child) => {
        if (child && child.props) {
          list.push({
            value: child.props.value !== undefined ? String(child.props.value) : String(child.props.children),
            label: child.props.children,
            disabled: Boolean(child.props.disabled),
          });
        }
      });
      return list;
    }

    return [];
  }, [options, children]);

  // Current selected label
  const selectedOption = parsedOptions.find((opt) => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  // Detect whether dropdown should open upward
  const handleOpen = () => {
    if (disabled) return;
    if (!open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 260);
    }
    setOpen((prev) => !prev);
  };

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [open]);

  // Keyboard navigation (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const handleSelect = (val) => {
    if (disabled) return;
    if (onChange) {
      onChange({ target: { value: val } });
    }
    setOpen(false);
  };

  const isAutoWidth = className.includes('w-auto');

  return (
    <div
      ref={containerRef}
      className={`relative ${isAutoWidth ? 'inline-block w-auto min-w-[130px]' : 'w-full'} ${open ? 'z-50' : 'z-10'}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={`flex items-center justify-between gap-2 text-left cursor-pointer transition-all duration-200 select-none ${
          className
            ? className
            : 'w-full px-4 py-2.5 bg-white/80 dark:bg-[#0B0F1A]/80 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white rounded-xl sm:rounded-2xl text-sm backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(0,0,0,0.04),0_1px_0_rgba(255,255,255,0.06)]'
        } ${
          open
            ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
            : 'hover:border-slate-300 dark:hover:border-white/20'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {LeftIcon && <LeftIcon size={16} className="text-blue-500 dark:text-blue-400 flex-shrink-0" />}
          <span className={`truncate text-sm ${selectedOption ? 'text-inherit font-medium' : 'text-slate-400'}`}>
            {displayLabel}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180 text-blue-500 dark:text-blue-400' : ''
          }`}
        />
      </button>

      {/* Solid Opaque Dropdown Menu (No bleed-through, zero ghosting) */}
      {open && (
        <>
          {/* Dismiss overlay */}
          <div
            className="fixed inset-0 z-[90] cursor-default"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Opaque Dropdown Container */}
          <div
            className={`absolute left-0 z-[100] w-full min-w-[170px] bg-[#0E1424] border border-white/20 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.1)] py-1.5 overflow-hidden animate-popover-in ${
              dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            }`}
            style={{ minWidth: '100%' }}
          >
            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5 space-y-1 bg-[#0E1424]">
              {parsedOptions.length === 0 ? (
                <div className="px-3.5 py-2 text-xs text-slate-400 text-center">No options available</div>
              ) : (
                parsedOptions.map((opt) => {
                  const isSelected = String(opt.value) === String(value);
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      disabled={opt.disabled}
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-150 text-left ${
                        isSelected
                          ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/25'
                          : 'text-slate-200 hover:bg-white/[0.08] hover:text-white'
                      } ${opt.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <Check size={15} className="text-white flex-shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
