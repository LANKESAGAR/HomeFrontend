// Progress bar that shifts color as spend approaches/exceeds the allocated budget.
export default function ProgressBar({ spent, allocated }) {
  if (allocated == null) {
    return (
      <div>
        <div className="h-2.5 w-full rounded-full bg-sand-100 border border-dashed border-sand-300" />
        <p className="mt-1 text-xs text-clay-400 italic">No budget set</p>
      </div>
    );
  }

  const pct = allocated > 0 ? (spent / allocated) * 100 : 0;
  const clamped = Math.min(pct, 100);

  let barColor = "bg-leaf-500";
  if (pct >= 100) barColor = "bg-red-600";
  else if (pct >= 80) barColor = "bg-terracotta-400";

  return (
    <div>
      <div className="h-2.5 w-full rounded-full bg-sand-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-clay-500 tabular-nums">{pct.toFixed(0)}% used</p>
    </div>
  );
}
