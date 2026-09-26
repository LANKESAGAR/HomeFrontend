import { useEffect, useState, useCallback, useMemo } from "react";
import { getFunding, createFunding, updateFunding, deleteFunding } from "../api/funding";
import { getSettings, updateSettings, refreshExchangeRate } from "../api/settings";
import { getDashboardSummary } from "../api/dashboard";
import { useCurrency } from "../context/CurrencyContext";
import ProgressBar from "../components/ProgressBar";
import ConfirmDialog from "../components/ConfirmDialog";
import { formatDate } from "../utils/format";
import { FUNDING_SOURCES, fundingSourceLabel, fundingSourceColor } from "../utils/fundingSources";

const emptyForm = {
  source: FUNDING_SOURCES[0].value,
  enteredAmount: "",
  date: new Date().toISOString().slice(0, 10),
  note: "",
};

// Bank Loan is taken in India and stays in rupees. Personal Funds leave the
// son's US account in dollars, so that one is entered and tracked in USD and
// converted to INR (using the current exchange rate) for the shared totals.
function sourceFraming(source) {
  if (source === "PERSONAL") {
    return {
      amountLabel: "Amount Sent ($)",
      amountPlaceholder: "This is what I sent, in US dollars",
      noteLabel: "Note (optional)",
      notePlaceholder: "e.g. Wire transfer for foundation work",
    };
  }
  return {
    amountLabel: "Amount Drawn (₹)",
    amountPlaceholder: "This is what we took from the bank, in rupees",
    noteLabel: "Note (optional)",
    notePlaceholder: "e.g. Second disbursement",
  };
}

export default function Funding() {
  const { formatDual, exchangeRateInrPerUsd, setExchangeRateInrPerUsd } = useCurrency();

  const [entries, setEntries] = useState([]);
  const [fundingBreakdown, setFundingBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [rateInput, setRateInput] = useState("");
  const [editingRate, setEditingRate] = useState(false);
  const [savingRate, setSavingRate] = useState(false);
  const [rateMessage, setRateMessage] = useState("");
  const [rateError, setRateError] = useState("");
  const [fetchingRate, setFetchingRate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [entriesData, settings, summary] = await Promise.all([
        getFunding(),
        getSettings(),
        getDashboardSummary(),
      ]);
      const sorted = [...entriesData].sort((a, b) => new Date(b.date) - new Date(a.date));
      setEntries(sorted);
      setFundingBreakdown(summary?.fundingBreakdown ?? []);
      if (settings?.exchangeRateInrPerUsd) {
        setExchangeRateInrPerUsd(settings.exchangeRateInrPerUsd);
        setRateInput(String(settings.exchangeRateInrPerUsd));
      }
    } catch (err) {
      setError("Could not load funding data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [setExchangeRateInrPerUsd]);

  useEffect(() => {
    load();
  }, [load]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function openAdd() {
    setEditingEntry(null);
    setForm(emptyForm);
    setFormError("");
  }

  function openEdit(entry) {
    setEditingEntry(entry);
    setForm({
      source: entry.source,
      enteredAmount: entry.enteredAmount,
      date: entry.date?.slice(0, 10) ?? emptyForm.date,
      note: entry.note ?? "",
    });
    setFormError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.source || !form.enteredAmount || !form.date) {
      setFormError("Please fill in source, amount, and date.");
      return;
    }
    if (Number(form.enteredAmount) <= 0) {
      setFormError("Amount must be greater than zero.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        source: form.source,
        enteredAmount: Number(form.enteredAmount),
        date: form.date,
        note: form.note.trim(),
      };
      if (editingEntry) {
        await updateFunding(editingEntry.id, payload);
      } else {
        await createFunding(payload);
      }
      setForm(emptyForm);
      setEditingEntry(null);
      load();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteFunding(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setDeleteTarget(null);
      setError("Could not delete this contribution. Please try again.");
    }
  }

  async function handleSaveRate() {
    const value = Number(rateInput);
    if (Number.isNaN(value) || value <= 0) {
      setRateError("Exchange rate must be a positive number.");
      return;
    }
    setSavingRate(true);
    setRateError("");
    setRateMessage("");
    try {
      const updated = await updateSettings({ exchangeRateInrPerUsd: value });
      setExchangeRateInrPerUsd(updated?.exchangeRateInrPerUsd ?? value);
      setEditingRate(false);
      setRateMessage("Exchange rate updated.");
    } catch (err) {
      setRateError("Could not update the exchange rate. Please try again.");
    } finally {
      setSavingRate(false);
    }
  }

  async function handleFetchRate() {
    setFetchingRate(true);
    setRateError("");
    setRateMessage("");
    try {
      const updated = await refreshExchangeRate();
      if (updated?.exchangeRateInrPerUsd) {
        setExchangeRateInrPerUsd(updated.exchangeRateInrPerUsd);
        setRateInput(String(updated.exchangeRateInrPerUsd));
        setRateMessage("Exchange rate refreshed from live source.");
      }
    } catch (err) {
      setRateError(
        err?.response?.data?.message || "Could not fetch the current exchange rate. Please try again later."
      );
    } finally {
      setFetchingRate(false);
    }
  }

  const countBySource = useMemo(() => {
    const counts = { BANK_LOAN: 0, PERSONAL: 0 };
    entries.forEach((e) => {
      if (counts[e.source] !== undefined) counts[e.source] += 1;
    });
    return counts;
  }, [entries]);

  const breakdownBySource = useMemo(() => {
    const map = {};
    fundingBreakdown.forEach((f) => { map[f.source] = f; });
    return map;
  }, [fundingBreakdown]);

  const totals = useMemo(
    () =>
      fundingBreakdown.reduce(
        (acc, f) => ({
          contributed: acc.contributed + (f.contributed || 0),
          spent: acc.spent + (f.spent || 0),
          remaining: acc.remaining + (f.remaining || 0),
        }),
        { contributed: 0, spent: 0, remaining: 0 }
      ),
    [fundingBreakdown]
  );

  const framing = sourceFraming(form.source);

  if (loading) {
    return <div className="text-center py-20 text-clay-500">Loading funding data...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-clay-900">Funding</h1>
        <p className="text-sm text-clay-500 mt-0.5">
          Money coming in from the bank loan and from Sagar, and how it's being spent
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Per-source summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FundingSummaryCard
          source="BANK_LOAN"
          data={breakdownBySource.BANK_LOAN}
          count={countBySource.BANK_LOAN}
          formatDual={formatDual}
        />
        <FundingSummaryCard
          source="PERSONAL"
          data={breakdownBySource.PERSONAL}
          count={countBySource.PERSONAL}
          formatDual={formatDual}
        />
      </div>

      {/* Overall combined summary */}
      <OverallSummary totals={totals} formatDual={formatDual} />

      {/* Exchange rate control */}
      <div className="bg-white rounded-xl border border-sand-200 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-clay-800">Exchange Rate</h2>
        <p className="mt-1 text-xs text-clay-500">
          Used to show dollar-equivalent amounts everywhere in the app.
        </p>
        <div className="mt-3 flex items-center flex-wrap gap-3">
          {editingRate ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-clay-600">1 USD =</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  className="rounded-lg border border-sand-300 px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-terracotta-400"
                />
                <span className="text-sm text-clay-600">INR</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveRate}
                  disabled={savingRate}
                  className="text-sm font-medium rounded-lg bg-terracotta-600 text-white px-3 py-2 hover:bg-terracotta-700 disabled:opacity-60"
                >
                  {savingRate ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => { setEditingRate(false); setRateInput(String(exchangeRateInrPerUsd)); setRateError(""); }}
                  className="text-sm font-medium rounded-lg px-3 py-2 text-clay-600 hover:bg-sand-100"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-clay-900 tabular-nums">
                1 USD = ₹{Number(exchangeRateInrPerUsd).toFixed(2)}
              </p>
              <button
                onClick={() => { setEditingRate(true); setRateInput(String(exchangeRateInrPerUsd)); }}
                className="text-sm font-medium text-terracotta-600 hover:underline"
              >
                Edit manually
              </button>
              <button
                onClick={handleFetchRate}
                disabled={fetchingRate}
                className="inline-flex items-center gap-1.5 text-sm font-medium rounded-lg border border-sand-300 bg-white hover:bg-sand-100 text-clay-700 px-3 py-2 transition-colors disabled:opacity-60"
              >
                {fetchingRate ? "Fetching..." : "Fetch current rate"}
              </button>
            </>
          )}
        </div>
        {rateError && <p className="mt-2 text-sm text-red-600">{rateError}</p>}
        {rateMessage && !rateError && <p className="mt-2 text-sm text-leaf-600">{rateMessage}</p>}
      </div>

      {/* Add / edit contribution form */}
      <div className="bg-white rounded-xl border border-sand-200 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-clay-900">
          {editingEntry ? "Edit Contribution" : "Add a Contribution"}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-clay-600 mb-1">Source</label>
              <select
                value={form.source}
                onChange={(e) => handleChange("source", e.target.value)}
                className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
              >
                {FUNDING_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-clay-600 mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => handleChange("date", e.target.value)}
                className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-clay-600 mb-1">{framing.amountLabel}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.enteredAmount}
              onChange={(e) => handleChange("enteredAmount", e.target.value)}
              placeholder={framing.amountPlaceholder}
              className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-clay-600 mb-1">{framing.noteLabel}</label>
            <textarea
              value={form.note}
              onChange={(e) => handleChange("note", e.target.value)}
              rows={2}
              placeholder={framing.notePlaceholder}
              className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
            />
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
            {editingEntry && (
              <button
                type="button"
                onClick={openAdd}
                className="px-4 py-2.5 text-sm font-medium rounded-lg text-clay-700 hover:bg-sand-100 w-full sm:w-auto"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 text-sm font-medium rounded-lg bg-terracotta-600 text-white hover:bg-terracotta-700 disabled:opacity-60 w-full sm:w-auto"
            >
              {saving ? "Saving..." : editingEntry ? "Save Changes" : "Add Contribution"}
            </button>
          </div>
        </form>
      </div>

      {/* Contribution list */}
      <div className="bg-white rounded-xl border border-sand-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-sand-100">
          <h2 className="text-sm font-semibold text-clay-900">Past Contributions</h2>
        </div>
        {entries.length === 0 ? (
          <div className="text-center py-16 text-clay-400 text-sm">No contributions logged yet.</div>
        ) : (
          <div className="divide-y divide-sand-100">
            {entries.map((entry) => {
              const dual = formatDual(entry.amountInr);
              const isPersonal = entry.source === "PERSONAL";
              return (
                <div key={entry.id} className="p-4 flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white"
                        style={{ backgroundColor: fundingSourceColor(entry.source) }}
                      >
                        {fundingSourceLabel(entry.source)}
                      </span>
                      <p className="text-xs text-clay-500">{formatDate(entry.date)}</p>
                    </div>
                    {isPersonal && entry.exchangeRateApplied && (
                      <p className="text-[11px] text-clay-400 mt-1">
                        Sent as ${Number(entry.enteredAmount).toFixed(2)} at ₹{Number(entry.exchangeRateApplied).toFixed(2)}/$1
                      </p>
                    )}
                    {entry.note && <p className="text-xs text-clay-400 mt-1.5 break-words">{entry.note}</p>}
                    <div className="mt-2 flex gap-4">
                      <button onClick={() => openEdit(entry)} className="text-terracotta-600 text-xs font-medium min-h-[32px] py-1.5">Edit</button>
                      <button onClick={() => setDeleteTarget(entry)} className="text-red-600 text-xs font-medium min-h-[32px] py-1.5">Delete</button>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold tabular-nums text-clay-900">{dual.primary}</p>
                    <p className="text-[11px] text-clay-400 tabular-nums">{dual.secondary}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this contribution?"
        message={deleteTarget ? `This will permanently remove the ${fundingSourceLabel(deleteTarget.source)} contribution from ${formatDate(deleteTarget.date)}.` : ""}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function FundingSummaryCard({ source, data, count, formatDual }) {
  const contributed = data?.contributed || 0;
  const spent = data?.spent || 0;
  const remaining = data?.remaining ?? contributed - spent;
  const contributedDual = formatDual(contributed);
  const spentDual = formatDual(spent);
  const remainingDual = formatDual(Math.abs(remaining));

  return (
    <div className="bg-white rounded-xl border border-sand-200 p-5 shadow-sm min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: fundingSourceColor(source) }} />
        <h3 className="text-sm font-semibold text-clay-900 truncate">{fundingSourceLabel(source)}</h3>
      </div>

      <div className="mt-3 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-clay-500">
        <span className="truncate">Contributed: <span className="font-medium text-clay-800">{contributedDual.primary}</span></span>
        <span className="truncate">Spent: <span className="font-medium text-clay-800">{spentDual.primary}</span></span>
      </div>

      <div className="mt-2">
        <ProgressBar spent={spent} allocated={contributed} />
      </div>

      <p className={`mt-2 text-xs font-medium ${remaining < 0 ? "text-red-600" : "text-clay-500"}`}>
        {remaining < 0 ? `${remainingDual.primary} over-drawn` : `${remainingDual.primary} remaining`}
        <span className="text-clay-400 font-normal"> ({formatDual(Math.abs(remaining)).secondary})</span>
      </p>

      <p className="mt-2 text-xs text-clay-400">{count} contribution{count === 1 ? "" : "s"} logged</p>
    </div>
  );
}

function OverallSummary({ totals, formatDual }) {
  const contributed = formatDual(totals.contributed);
  const spent = formatDual(totals.spent);
  const remaining = formatDual(totals.remaining);
  return (
    <div className="bg-white rounded-xl border border-sand-200 p-4 shadow-sm">
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-clay-600">
        <p>
          Total Contributed: <span className="font-semibold text-clay-900">{contributed.primary}</span>{" "}
          <span className="text-xs text-clay-400">({contributed.secondary})</span>
        </p>
        <p>
          Total Spent: <span className="font-semibold text-clay-900">{spent.primary}</span>{" "}
          <span className="text-xs text-clay-400">({spent.secondary})</span>
        </p>
        <p>
          Total Remaining: <span className="font-semibold text-clay-900">{remaining.primary}</span>{" "}
          <span className="text-xs text-clay-400">({remaining.secondary})</span>
        </p>
      </div>
    </div>
  );
}
