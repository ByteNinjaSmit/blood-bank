// Editable 12-hour AM/PM time picker. `value` and onChange communicate as a
// Date (only the time-of-day portion is meaningful to the caller); date part
// defaults to "now" and is left untouched by this component.
import { useMemo } from 'react';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export default function TimePicker12h({ value, onChange, className = '' }) {
  const date = useMemo(
    () => (value instanceof Date && !isNaN(value.getTime()) ? value : new Date()),
    [value],
  );

  const { hour12, minute, meridiem } = useMemo(() => {
    const h24 = date.getHours();
    const m = date.getMinutes();
    const mer = h24 >= 12 ? 'PM' : 'AM';
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    return { hour12: h12, minute: m, meridiem: mer };
  }, [date]);

  const emit = (nextHour12, nextMinute, nextMeridiem) => {
    const next = new Date(date);
    let h24 = nextHour12 % 12;
    if (nextMeridiem === 'PM') h24 += 12;
    next.setHours(h24, nextMinute, 0, 0);
    onChange(next);
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <select
        aria-label="Hour"
        className="px-2 py-1.5 border rounded-lg text-sm"
        value={hour12}
        onChange={(e) => emit(Number(e.target.value), minute, meridiem)}
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
        ))}
      </select>
      <span className="text-gray-500">:</span>
      <select
        aria-label="Minute"
        className="px-2 py-1.5 border rounded-lg text-sm"
        value={minute}
        onChange={(e) => emit(hour12, Number(e.target.value), meridiem)}
      >
        {MINUTES.map((m) => (
          <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
        ))}
      </select>
      <select
        aria-label="AM/PM"
        className="px-2 py-1.5 border rounded-lg text-sm font-semibold"
        value={meridiem}
        onChange={(e) => emit(hour12, minute, e.target.value)}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
