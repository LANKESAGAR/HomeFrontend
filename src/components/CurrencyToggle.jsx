import { useCurrency } from "../context/CurrencyContext";

// A small "₹ / $" switch controlling which currency is shown as the primary
// (larger) amount app-wide. `compact` renders a single cycling button
// (used in the tight mobile top bar); otherwise a two-segment switch is
// rendered (used in the roomier desktop sidebar).
export default function CurrencyToggle({ compact = false, className = "" }) {
  const { isUsdPrimary, toggleDisplay } = useCurrency();

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleDisplay}
        aria-label={`Currently showing ${isUsdPrimary ? "dollars" : "rupees"} first. Tap to switch.`}
        title="Switch primary currency"
        className={`inline-flex items-center justify-center min-h-[40px] min-w-[40px] rounded-md px-3 py-2.5 text-sm font-semibold bg-white/10 hover:bg-white/20 transition-colors ${className}`}
      >
        {isUsdPrimary ? "$" : "₹"}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Primary currency"
      className={`inline-flex items-center rounded-full border border-white/15 bg-white/10 p-0.5 ${className}`}
    >
      <button
        type="button"
        onClick={() => !isUsdPrimary || toggleDisplay()}
        aria-pressed={!isUsdPrimary}
        className={`min-h-[36px] rounded-full px-3 text-xs font-semibold transition-colors ${
          !isUsdPrimary ? "bg-terracotta-600 text-white" : "text-sand-300 hover:text-white"
        }`}
      >
        ₹
      </button>
      <button
        type="button"
        onClick={() => isUsdPrimary || toggleDisplay()}
        aria-pressed={isUsdPrimary}
        className={`min-h-[36px] rounded-full px-3 text-xs font-semibold transition-colors ${
          isUsdPrimary ? "bg-terracotta-600 text-white" : "text-sand-300 hover:text-white"
        }`}
      >
        $
      </button>
    </div>
  );
}
