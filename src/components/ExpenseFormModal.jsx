import { useEffect, useState } from "react";
import { FUNDING_SOURCES } from "../utils/fundingSources";
import { formatInr } from "../utils/format";

// `value` must match the backend's PaymentMode enum constant names exactly
// (Jackson enum deserialization is case-sensitive and doesn't map spaces to
// underscores) - `label` is what the user sees.
const PAYMENT_MODES = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "UPI", label: "UPI" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OTHER", label: "Other" },
];

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  amount: "",
  categoryId: "",
  paidBy: "",
  paymentMode: "UPI",
  note: "",
};

function splitsFromInitial(initialData) {
  const splits = initialData?.fundingSplits;
  if (Array.isArray(splits) && splits.length > 0) {
    return splits.map((s) => ({ source: s.source, amount: s.amount ?? "" }));
  }
  return [];
}

export default function ExpenseFormModal({ open, categories, initialData, onClose, onSubmit, onCreateCategory }) {
  const [form, setForm] = useState(emptyForm);
  const [fundingRows, setFundingRows] = useState([{ source: "", amount: "" }]);
  const [fundingUndecided, setFundingUndecided] = useState(false);
  const [autoSyncAmount, setAutoSyncAmount] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          date: initialData.date?.slice(0, 10) ?? emptyForm.date,
          amount: initialData.amount ?? "",
          categoryId: initialData.categoryId ?? "",
          paidBy: initialData.paidBy ?? "",
          paymentMode: initialData.paymentMode ?? "UPI",
          note: initialData.note ?? "",
        });
        const initialSplits = splitsFromInitial(initialData);
        if (initialSplits.length > 0) {
          setFundingRows(initialSplits);
          setFundingUndecided(false);
        } else {
          setFundingRows([{ source: "", amount: "" }]);
          setFundingUndecided(true);
        }
        setAutoSyncAmount(initialSplits.length <= 1);
      } else {
        setForm({
          ...emptyForm,
          categoryId: categories[0]?.id ?? "",
        });
        setFundingRows([{ source: "", amount: "" }]);
        setFundingUndecided(false);
        setAutoSyncAmount(true);
      }
      setAddingCategory(false);
      setNewCategoryName("");
      setError("");
    }
  }, [open, initialData, categories]);

  if (!open) return null;

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "amount" && autoSyncAmount && fundingRows.length === 1) {
      setFundingRows((prev) => [{ ...prev[0], amount: value }]);
    }
  }

  function handleCategorySelect(value) {
    if (value === "__new__") {
      setAddingCategory(true);
      return;
    }
    handleChange("categoryId", value);
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    setError("");
    try {
      const cat = await onCreateCategory(newCategoryName.trim());
      if (cat?.id != null) {
        handleChange("categoryId", cat.id);
      }
      setAddingCategory(false);
      setNewCategoryName("");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not create category. Please try again.");
    } finally {
      setCreatingCategory(false);
    }
  }

  function usedSources(excludeIndex) {
    return fundingRows
      .filter((_, i) => i !== excludeIndex)
      .map((r) => r.source)
      .filter(Boolean);
  }

  function updateRow(index, field, value) {
    setFundingRows((prev) => {
      const next = prev.map((row, i) => (i === index ? { ...row, [field]: value } : row));
      return next;
    });
    if (field === "amount" && fundingRows.length === 1) {
      // User manually edited the single row's amount; stop auto-sync unless it still matches.
      setAutoSyncAmount(value === form.amount);
    }
  }

  function addRow() {
    if (fundingRows.length >= FUNDING_SOURCES.length) return;
    setFundingRows((prev) => [...prev, { source: "", amount: "" }]);
    setAutoSyncAmount(false);
  }

  function removeRow(index) {
    setFundingRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleUndecidedToggle(checked) {
    setFundingUndecided(checked);
    if (!checked && fundingRows.length === 0) {
      setFundingRows([{ source: "", amount: "" }]);
    }
  }

  const splitTotal = fundingRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const remainingToAllocate = (Number(form.amount) || 0) - splitTotal;
  const splitsBalanced = Math.abs(remainingToAllocate) <= 0.01;
  const allRowsHaveSource = fundingRows.every((r) => r.source);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.date || !form.amount || !form.categoryId || !form.paidBy) {
      setError("Please fill in date, amount, category, and paid by.");
      return;
    }
    if (Number(form.amount) <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    let fundingSplits = [];
    if (!fundingUndecided) {
      if (!allRowsHaveSource) {
        setError("Please select a funding source for each row, or mark funding as not decided yet.");
        return;
      }
      if (!splitsBalanced) {
        setError("Funding splits must add up to the total expense amount.");
        return;
      }
      fundingSplits = fundingRows.map((r) => ({ source: r.source, amount: Number(r.amount) }));
    }

    setSaving(true);
    setError("");
    try {
      await onSubmit({
        date: form.date,
        amount: Number(form.amount),
        categoryId: Number(form.categoryId),
        paidBy: form.paidBy.trim(),
        paymentMode: form.paymentMode,
        fundingSplits,
        note: form.note.trim(),
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 my-auto max-h-[90vh] overflow-y-auto">
        <h3 className="text-base font-semibold text-clay-900">
          {initialData ? "Edit Expense" : "Add Expense"}
        </h3>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-clay-600 mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => handleChange("date", e.target.value)}
                className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-clay-600 mb-1">Amount (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-clay-600 mb-1">Category</label>
            <select
              value={addingCategory ? "__new__" : form.categoryId}
              onChange={(e) => handleCategorySelect(e.target.value)}
              className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
            >
              <option value="" disabled>Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              <option value="__new__">+ Add new category</option>
            </select>
            {addingCategory && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category name"
                  className="flex-1 rounded-lg border border-sand-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={creatingCategory || !newCategoryName.trim()}
                  className="px-3 py-2 text-sm font-medium rounded-lg bg-terracotta-600 text-white hover:bg-terracotta-700 disabled:opacity-60"
                >
                  {creatingCategory ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => { setAddingCategory(false); setNewCategoryName(""); }}
                  className="px-2 text-sm text-clay-600 hover:underline"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-clay-600 mb-1">Paid By</label>
              <input
                type="text"
                value={form.paidBy}
                onChange={(e) => handleChange("paidBy", e.target.value)}
                placeholder="e.g. Dad"
                className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-clay-600 mb-1">Payment Mode</label>
              <select
                value={form.paymentMode}
                onChange={(e) => handleChange("paymentMode", e.target.value)}
                className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
              >
                {PAYMENT_MODES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-clay-600">Funded By</label>
              <label className="flex items-center gap-1.5 text-xs text-clay-500">
                <input
                  type="checkbox"
                  checked={fundingUndecided}
                  onChange={(e) => handleUndecidedToggle(e.target.checked)}
                  className="rounded border-sand-300"
                />
                Funding source not decided yet
              </label>
            </div>

            {!fundingUndecided && (
              <div className="space-y-2">
                {fundingRows.map((row, index) => {
                  const excluded = usedSources(index);
                  const options = FUNDING_SOURCES.filter((s) => !excluded.includes(s.value));
                  return (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        value={row.source}
                        onChange={(e) => updateRow(index, "source", e.target.value)}
                        className="flex-1 rounded-lg border border-sand-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
                      >
                        <option value="" disabled>Select funding source</option>
                        {options.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.amount}
                        onChange={(e) => updateRow(index, "amount", e.target.value)}
                        placeholder="Amount"
                        className="w-28 rounded-lg border border-sand-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
                      />
                      {fundingRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          aria-label="Remove funding source"
                          className="text-clay-500 hover:text-red-600 text-lg leading-none px-1"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}

                {fundingRows.length < FUNDING_SOURCES.length && (
                  <button
                    type="button"
                    onClick={addRow}
                    className="text-xs font-medium text-terracotta-600 hover:underline"
                  >
                    + Add another source
                  </button>
                )}

                {!splitsBalanced && (
                  <p className="text-xs text-clay-500">
                    Remaining to allocate: {formatInr(remainingToAllocate)}
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-clay-600 mb-1">Note (optional)</label>
            <textarea
              value={form.note}
              onChange={(e) => handleChange("note", e.target.value)}
              rows={2}
              placeholder="e.g. Cement - 20 bags"
              className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium rounded-lg text-clay-700 hover:bg-sand-100 w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 text-sm font-medium rounded-lg bg-terracotta-600 text-white hover:bg-terracotta-700 disabled:opacity-60 w-full sm:w-auto"
            >
              {saving ? "Saving..." : initialData ? "Save Changes" : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
