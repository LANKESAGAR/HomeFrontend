// Format a number as Indian Rupees with Indian digit grouping, e.g. 1234567 -> ₹12,34,567
export function formatInr(amount) {
  const value = Number(amount) || 0;
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
  return `₹${formatted}`;
}

// Standard USD formatting, e.g. 1487.4213 -> "$1,487.42"
export function formatUsd(amount) {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatInrPrecise(amount) {
  const value = Number(amount) || 0;
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `₹${formatted}`;
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// "2026-01" -> "Jan 2026"
export function formatMonthLabel(monthKey) {
  if (!monthKey) return "";
  const [year, month] = monthKey.split("-");
  const idx = Number(month) - 1;
  return `${MONTH_LABELS[idx] ?? month} ${year}`;
}

// Human-readable file size, e.g. 2400000 -> "2.4 MB"
export function formatFileSize(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  const units = ["KB", "MB", "GB"];
  let size = value / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PAYMENT_MODE_LABELS = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  UPI: "UPI",
  CHEQUE: "Cheque",
  OTHER: "Other",
};

// "BANK_TRANSFER" -> "Bank Transfer" (the backend enum's raw constant name)
export function formatPaymentMode(mode) {
  return PAYMENT_MODE_LABELS[mode] ?? mode ?? "";
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
