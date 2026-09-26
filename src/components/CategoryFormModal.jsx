import { useEffect, useState } from "react";

export default function CategoryFormModal({ open, initialData, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [allocatedBudget, setAllocatedBudget] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? "");
      setAllocatedBudget(initialData?.allocatedBudget ?? "");
      setError("");
    }
  }, [open, initialData]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a category name.");
      return;
    }
    if (allocatedBudget !== "" && Number(allocatedBudget) < 0) {
      setError("Budget cannot be negative.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        name: name.trim(),
        allocatedBudget: allocatedBudget === "" ? null : Number(allocatedBudget),
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 my-auto max-h-[90vh] overflow-y-auto">
        <h3 className="text-base font-semibold text-clay-900">
          {initialData ? "Edit Category" : "Add Category"}
        </h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-clay-600 mb-1">Category Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cement & Steel"
              className="w-full rounded-lg border border-sand-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-clay-600 mb-1">Allocated Budget (₹) — optional</label>
            <input
              type="number"
              min="0"
              step="1"
              value={allocatedBudget}
              onChange={(e) => setAllocatedBudget(e.target.value)}
              placeholder="Leave blank if you haven't decided yet"
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
              {saving ? "Saving..." : initialData ? "Save Changes" : "Add Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
