import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../api/categories";
import { getDashboardSummary } from "../api/dashboard";
import ProgressBar from "../components/ProgressBar";
import CategoryFormModal from "../components/CategoryFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { formatInr } from "../utils/format";
import { buildCategoryColorMap } from "../utils/categoryColors";
import { useCurrency } from "../context/CurrencyContext";

export default function Budget() {
  const { formatDual } = useCurrency();
  const [breakdown, setBreakdown] = useState([]);
  const [totalContributed, setTotalContributed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const summary = await getDashboardSummary();
      setBreakdown(summary.categoryBreakdown ?? []);
      setTotalContributed(summary.totalContributed ?? 0);
    } catch (err) {
      setError("Could not load budget data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openAddModal() {
    setEditingCategory(null);
    setModalOpen(true);
  }

  function openEditModal(cat) {
    setEditingCategory({ id: cat.categoryId, name: cat.categoryName, allocatedBudget: cat.allocated });
    setModalOpen(true);
  }

  async function handleSubmit(payload) {
    if (editingCategory) {
      await updateCategory(editingCategory.id, payload);
    } else {
      await createCategory(payload);
    }
    setModalOpen(false);
    setEditingCategory(null);
    load();
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.categoryId);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setDeleteTarget(null);
      setError("Could not delete category. It may still have expenses linked to it.");
    }
  }

  const colorMap = buildCategoryColorMap(breakdown);
  const allocatedSum = breakdown.reduce((sum, c) => sum + (c.allocated || 0), 0);

  if (loading) {
    return <div className="text-center py-20 text-clay-500">Loading budget...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-clay-900">Budget</h1>
          <p className="text-sm text-clay-500 mt-0.5">Category allocations and spend tracking</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 rounded-lg bg-terracotta-600 hover:bg-terracotta-700 text-white text-sm font-medium px-4 py-2.5 transition-colors shadow-sm"
        >
          <span className="text-lg leading-none">+</span> Add Category
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Total funds available (from Bank Loan + Personal contributions logged on the Funding page) */}
      <div className="bg-white rounded-xl border border-sand-200 p-5 shadow-sm">
        <p className="text-sm font-medium text-clay-600">Total Funds Available</p>
        <div className="mt-1">
          <p className="text-2xl font-semibold text-clay-900 tabular-nums">{formatDual(totalContributed).primary}</p>
          <p className="text-xs text-clay-400 tabular-nums">{formatDual(totalContributed).secondary}</p>
        </div>
        <p className="mt-2 text-xs text-clay-500">
          From Bank Loan + Personal Funds contributed so far. Log new contributions on the{" "}
          <Link to="/funding" className="text-terracotta-600 hover:underline">Funding page</Link> whenever more comes in.
        </p>
        {allocatedSum > 0 && (
          <p className="mt-3 text-xs text-clay-500">
            {formatInr(allocatedSum)} allocated across {breakdown.length} categor{breakdown.length === 1 ? "y" : "ies"}
            {allocatedSum > totalContributed && (
              <span className="text-red-600 font-medium">, which exceeds total funds available</span>
            )}
          </p>
        )}
      </div>

      {/* Category list */}
      {breakdown.length === 0 ? (
        <div className="bg-white rounded-xl border border-sand-200 p-10 text-center text-clay-400 text-sm">
          No categories yet. Add one to start tracking budgets.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {breakdown.map((cat) => (
            <div key={cat.categoryId} className="bg-white rounded-xl border border-sand-200 p-5 shadow-sm min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: colorMap[cat.categoryId] }}
                  />
                  <h3 className="text-sm font-semibold text-clay-900 truncate">{cat.categoryName}</h3>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button onClick={() => openEditModal(cat)} className="text-xs font-medium text-terracotta-600 hover:underline py-1">Edit</button>
                  <button onClick={() => setDeleteTarget(cat)} className="text-xs font-medium text-red-600 hover:underline py-1">Delete</button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-clay-500">
                <span className="truncate">
                  Spent: <span className="font-medium text-clay-800">{formatDual(cat.spent).primary}</span>
                  <span className="text-clay-400"> ({formatDual(cat.spent).secondary})</span>
                </span>
                <span className="truncate">
                  Budget:{" "}
                  {cat.allocated == null ? (
                    <span className="font-medium text-clay-400 italic">Not set</span>
                  ) : (
                    <>
                      <span className="font-medium text-clay-800">{formatDual(cat.allocated).primary}</span>
                      <span className="text-clay-400"> ({formatDual(cat.allocated).secondary})</span>
                    </>
                  )}
                </span>
              </div>

              <div className="mt-2">
                <ProgressBar spent={cat.spent} allocated={cat.allocated} />
              </div>

              {cat.allocated == null ? (
                <p className="mt-2 text-xs text-clay-400">
                  No budget set — tap Edit to add one.
                </p>
              ) : (
                <p className={`mt-2 text-xs font-medium ${cat.remaining < 0 ? "text-red-600" : "text-clay-500"}`}>
                  {cat.remaining < 0
                    ? `${formatDual(Math.abs(cat.remaining)).primary} over budget`
                    : `${formatDual(cat.remaining).primary} remaining`}
                  <span className="text-clay-400 font-normal">
                    {" "}({cat.remaining < 0 ? formatDual(Math.abs(cat.remaining)).secondary : formatDual(cat.remaining).secondary})
                  </span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <CategoryFormModal
        open={modalOpen}
        initialData={editingCategory}
        onClose={() => { setModalOpen(false); setEditingCategory(null); }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this category?"
        message={deleteTarget ? `This will remove "${deleteTarget.categoryName}". Existing expenses in this category may be affected.` : ""}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
