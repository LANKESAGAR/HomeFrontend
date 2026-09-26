const TONE_STYLES = {
  neutral: "bg-white border-sand-200 text-clay-900",
  good: "bg-leaf-50 border-leaf-100 text-leaf-600",
  warning: "bg-terracotta-50 border-terracotta-200 text-terracotta-700",
  danger: "bg-red-50 border-red-200 text-red-700",
};

export default function SummaryCard({ label, value, tone = "neutral", sublabel, secondaryValue }) {
  return (
    <div className={`rounded-xl border p-5 shadow-sm ${TONE_STYLES[tone]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="mt-1.5 text-2xl md:text-3xl font-semibold tabular-nums break-words">{value}</p>
      {secondaryValue && <p className="mt-0.5 text-xs opacity-60 tabular-nums">{secondaryValue}</p>}
      {sublabel && <p className="mt-1 text-xs opacity-70">{sublabel}</p>}
    </div>
  );
}
