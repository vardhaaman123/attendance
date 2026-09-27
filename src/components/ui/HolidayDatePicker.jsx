import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Sparkles, AlertCircle } from 'lucide-react';
import { getIndianHoliday, isSchoolOffDay } from '../../utils/indianHolidays';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function HolidayDatePicker({ value, onChange, maxDate }) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);
  const modalRef = useRef(null);

  // Current viewed month and year in calendar
  const initialDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  // Close popup when clicking outside (desktop) or backdrop (mobile)
  useEffect(() => {
    function handleClickOutside(e) {
      if (modalRef.current && modalRef.current.contains(e.target)) {
        return;
      }
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Lock body scroll on mobile to avoid background scrolling
      const prevOverflow = document.body.style.overflow;
      if (window.innerWidth < 640) {
        document.body.style.overflow = 'hidden';
      }
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Sync view when value changes from external navigation
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  const prevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const selectDate = (year, month, day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (maxDate && dateStr > maxDate) return;
    onChange(dateStr);
    setIsOpen(false);
  };

  // Calendar cells generation
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const cells = [];
  // Days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, isCurrentMonth: false });
  }
  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const holiday = getIndianHoliday(dateStr);
    const dayOfWeek = new Date(viewYear, viewMonth, d).getDay();
    const isSunday = dayOfWeek === 0;
    const isSelected = value === dateStr;
    const isToday = new Date().toISOString().split('T')[0] === dateStr;
    const isFuture = maxDate ? dateStr > maxDate : false;

    cells.push({
      day: d,
      dateStr,
      isCurrentMonth: true,
      holiday,
      isSunday,
      isSelected,
      isToday,
      isFuture,
    });
  }

  // Monthly holiday list
  const monthHolidays = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const holiday = getIndianHoliday(dateStr);
    if (holiday) {
      monthHolidays.push({ day: d, ...holiday });
    }
  }

  const currentHoliday = getIndianHoliday(value);
  const formattedDisplay = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : 'Select date';

  const renderCalendarBody = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-1">
          <span className="font-bold text-sm text-slate-900 dark:text-white">
            {MONTHS[viewMonth]} {viewYear}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              const t = new Date();
              setViewYear(t.getFullYear());
              setViewMonth(t.getMonth());
            }}
            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline px-1.5 cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Next Month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
        {DAYS.map((d, i) => (
          <div
            key={d}
            className={`text-[11px] font-bold py-1 ${
              i === 0 ? 'text-rose-500' : 'text-slate-400 dark:text-slate-400'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Day Grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (!cell.isCurrentMonth) {
            return (
              <div
                key={`prev-${idx}`}
                className="h-9 flex items-center justify-center text-slate-300 dark:text-slate-600 text-xs"
              >
                {cell.day}
              </div>
            );
          }

          const isSelected = cell.isSelected;
          const isHoliday = !!cell.holiday;
          const isSunday = cell.isSunday;

          let cellStyle = 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 cursor-pointer';

          if (cell.isFuture) {
            cellStyle = 'opacity-30 cursor-not-allowed text-slate-400';
          } else if (isSelected) {
            cellStyle = 'bg-blue-600 text-white font-bold shadow-[0_0_12px_rgba(59,130,246,0.4)] cursor-pointer';
          } else if (isHoliday) {
            cellStyle = 'bg-amber-100 dark:bg-amber-500/15 text-amber-900 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-500/30 hover:bg-amber-200 dark:hover:bg-amber-500/25 cursor-pointer';
          } else if (isSunday) {
            cellStyle = 'bg-rose-50/70 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium hover:bg-rose-100 dark:hover:bg-rose-500/20 cursor-pointer';
          }

          return (
            <button
              key={cell.dateStr}
              type="button"
              disabled={cell.isFuture}
              onClick={() => selectDate(viewYear, viewMonth, cell.day)}
              title={
                cell.holiday
                  ? `${cell.holiday.icon} ${cell.holiday.name} (Official Holiday)`
                  : isSunday
                  ? 'Sunday (School Holiday)'
                  : ''
              }
              className={`h-8 sm:h-9 rounded-xl flex flex-col items-center justify-center relative text-xs transition-all ${cellStyle}`}
            >
              <span className="leading-none">{cell.day}</span>
              {isHoliday && !isSelected && (
                <span className="text-[10px] leading-none -mt-0.5" title={cell.holiday.name}>
                  {cell.holiday.icon}
                </span>
              )}
              {cell.isToday && !isSelected && !isHoliday && (
                <span className="w-1 h-1 rounded-full bg-blue-500 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Monthly Festivals & Holidays Section */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles size={12} className="text-amber-500" />
            Indian Holidays in {MONTHS[viewMonth]}
          </span>
          <span className="text-[10px] bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 font-bold px-1.5 py-0.5 rounded">
            {monthHolidays.length} Holidays
          </span>
        </div>

        {monthHolidays.length === 0 ? (
          <p className="text-[11px] text-slate-400 italic py-1">No major official festival holidays this month.</p>
        ) : (
          <div className="max-h-24 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {monthHolidays.map((h) => (
              <button
                key={h.day}
                type="button"
                onClick={() => selectDate(viewYear, viewMonth, h.day)}
                className="w-full text-left flex items-center justify-between p-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors text-[11px] cursor-pointer"
              >
                <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <span>{h.icon}</span>
                  <span>{h.name}</span>
                </span>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  {h.day} {MONTHS[viewMonth].slice(0, 3)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Holiday</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          <span>Sunday</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Selected</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Date trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm active:scale-95 ${
          currentHoliday
            ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-300 hover:border-amber-400'
            : 'bg-white dark:bg-[#111726] border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:border-blue-500 dark:hover:border-white/25'
        }`}
      >
        <CalendarIcon size={14} className={currentHoliday ? 'text-amber-500' : 'text-blue-500 dark:text-blue-400'} />
        <span>{formattedDisplay}</span>
        {currentHoliday && (
          <span className="flex items-center gap-1 text-[10px] bg-amber-200/80 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded-full font-bold ml-0.5">
            <span>{currentHoliday.icon}</span>
            <span className="hidden sm:inline truncate max-w-[120px]">{currentHoliday.name}</span>
          </span>
        )}
      </button>

      {/* Popover Calendar with Indian Holidays */}
      {isOpen && (
        <>
          {/* Mobile Centered Overlay via Portal to escape parent backdrop-filter containing block */}
          {typeof document !== 'undefined' && createPortal(
            <div
              className="sm:hidden fixed inset-0 z-[99999] flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-fade-in"
              onClick={() => setIsOpen(false)}
            >
              <div
                ref={modalRef}
                className="w-[min(calc(100vw-24px),340px)] max-h-[85vh] overflow-y-auto bg-white dark:bg-[#0E1422] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/15 p-3.5 sm:p-4 backdrop-blur-2xl animate-modal-pop custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-white/10">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <CalendarIcon size={14} /> Select Date
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                    title="Close Calendar"
                  >
                    <X size={16} />
                  </button>
                </div>
                {renderCalendarBody()}
              </div>
            </div>,
            document.body
          )}

          {/* Desktop Popover with Smooth Dropdown Animation */}
          <div
            className="hidden sm:block absolute top-full right-0 mt-2 z-50 w-96 bg-white dark:bg-[#0E1422] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/15 p-4 backdrop-blur-2xl animate-popover-in"
            onClick={(e) => e.stopPropagation()}
          >
            {renderCalendarBody()}
          </div>
        </>
      )}
    </div>
  );
}
