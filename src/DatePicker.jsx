import {useEffect, useMemo, useRef, useState} from 'react';
import {CalendarDays, ChevronLeft, ChevronRight} from 'lucide-react';

const formatDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateValue = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const formatDisplayDate = (value) => {
  const date = parseDateValue(value);
  return date ? date.toLocaleDateString('en-GB') : 'Select date';
};

export default function DatePicker({label, value, onChange}) {
  const [isOpen, setIsOpen] = useState(false);
  const initialDate = parseDateValue(value) || new Date();
  const [visibleMonth, setVisibleMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!pickerRef.current?.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
    const previousMonthDays = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 0).getDate();
    const days = [];

    for (let index = startOffset - 1; index >= 0; index -= 1) {
      days.push({date: new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, previousMonthDays - index), muted: true});
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      days.push({date: new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day), muted: false});
    }
    for (let day = 1; days.length < 42; day += 1) {
      days.push({date: new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, day), muted: true});
    }
    return days;
  }, [visibleMonth]);

  const selectedValue = value || '';
  const todayValue = formatDateValue(new Date());
  const monthLabel = visibleMonth.toLocaleDateString('en-US', {month: 'long', year: 'numeric'});

  const selectDate = (date) => {
    onChange(formatDateValue(date));
    setIsOpen(false);
  };

  const moveMonth = (amount) => {
    setVisibleMonth((currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + amount, 1));
  };

  const showToday = () => {
    const today = new Date();
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    onChange(todayValue);
    setIsOpen(false);
  };

  return (
    <div ref={pickerRef} className="relative flex items-center gap-2 bg-white/80 px-3 py-2 rounded-lg border border-blue-200 flex-1 sm:flex-initial">
      <label className="text-[10px] sm:text-[11px] font-extrabold text-[#002B66] uppercase tracking-wider whitespace-nowrap">{label}</label>
      <button type="button" onClick={() => setIsOpen((open) => !open)} className="flex items-center gap-2 bg-blue-50/70 text-[#002B66] text-xs font-mono font-bold rounded-md px-2 py-1 border border-blue-100 hover:border-[#002B66] focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors cursor-pointer">
        <span>{formatDisplayDate(value)}</span>
        <CalendarDays size={14} className="shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 z-50 w-[286px] rounded-xl border border-blue-200 bg-white p-3 shadow-xl ring-1 ring-[#002B66]/10">
          <div className="flex items-center justify-between border-b border-blue-100 pb-3">
            <button type="button" onClick={() => moveMonth(-1)} className="rounded-lg p-1.5 text-[#002B66] hover:bg-blue-50 cursor-pointer" aria-label="Previous month"><ChevronLeft size={17} /></button>
            <span className="text-xs font-black uppercase tracking-wider text-[#002B66]">{monthLabel}</span>
            <button type="button" onClick={() => moveMonth(1)} className="rounded-lg p-1.5 text-[#002B66] hover:bg-blue-50 cursor-pointer" aria-label="Next month"><ChevronRight size={17} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 pt-3 text-center text-[10px] font-black uppercase text-blue-400">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((dayName) => <span key={dayName}>{dayName}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1 pt-2">
            {calendarDays.map(({date, muted}) => {
              const dateValue = formatDateValue(date);
              const isSelected = dateValue === selectedValue;
              const isToday = dateValue === todayValue;
              return (
                <button key={dateValue} type="button" onClick={() => selectDate(date)} className={`h-8 rounded-md text-xs font-semibold transition-colors cursor-pointer ${muted ? 'text-slate-300 hover:text-blue-500' : 'text-slate-700 hover:bg-blue-100'} ${isToday ? 'ring-1 ring-blue-300' : ''} ${isSelected ? 'bg-[#002B66] text-white hover:bg-blue-900' : ''}`}>
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-blue-100 pt-3">
            <button type="button" onClick={() => { onChange(''); setIsOpen(false); }} className="text-xs font-bold text-blue-600 hover:text-[#002B66] cursor-pointer">Clear</button>
            <button type="button" onClick={showToday} className="text-xs font-bold text-blue-600 hover:text-[#002B66] cursor-pointer">Today</button>
          </div>
        </div>
      )}
    </div>
  );
}
