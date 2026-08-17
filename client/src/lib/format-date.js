const TIME_ZONE = 'Asia/Kolkata';
const IST_OFFSET_MINUTES = 330; // +05:30, no DST — safe to hardcode

// Converts a stored UTC instant into the "YYYY-MM-DDTHH:mm" wall-clock value
// an <input type="datetime-local"> expects, showing IST regardless of the
// browser's or server's own timezone.
export function toISTDatetimeLocal(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const ist = new Date(d.getTime() + IST_OFFSET_MINUTES * 60000);
  return ist.toISOString().slice(0, 16);
}

// Converts a "YYYY-MM-DDTHH:mm" value out of a datetime-local input — always
// meant as IST wall-clock time — into a proper UTC ISO string to send to the
// API. Explicit offset means this is correct no matter what timezone the
// server process itself runs in.
export function fromISTDatetimeLocal(value) {
  if (!value) return '';
  const d = new Date(`${value}:00+05:30`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString();
}

export function formatDate(value, opts = {}) {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { timeZone: TIME_ZONE, day: '2-digit', month: 'short', year: 'numeric', ...opts });
}

export function formatDateTime(value, opts = {}) {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...opts,
  });
}
