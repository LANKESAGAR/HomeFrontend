import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { getExpenses, createExpense, updateExpense, deleteExpense, exportExpensesCsv } from "../api/expenses";
import { getCategories, createCategory } from "../api/categories";
import ExpenseFormModal from "../components/ExpenseFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { formatInr, formatDate } from "../utils/format";
import { useCurrency } from "../context/CurrencyContext";
import { FUNDING_SOURCES, fundingSourceLabel, fundingSourceColor } from "../utils/fundingSources";

const MONTHS = [
  { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
  { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
  { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
  { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" },
];

function currentYearRange() {
  const y = new Date().getFullYear();
  const years = [];
  for (let i = y + 1; i >= y - 5; i--) years.push(i);
  return years;
}

export default function Expenses() {
  const { formatDual } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Seed filters from the URL on first render so links like
  // /expenses?categoryId=... or /expenses?fundingSource=... (e.g. from the
  // Dashboard's chart click-to-filter) land pre-filtered.
  const [filters, setFilters] = useState({
    categoryId: searchParams.get("categoryId") || "",
    year: searchParams.get("year") || "",
    month: searchParams.get("month") || "",
    fundingSource: searchParams.get("fundingSource") || "",
  });

  // Keep the URL in sync (without adding history entries) as filters change,
  // so the pre-filtered link stays shareable/bookmarkable.
  useEffect(() => {
    const next = {};
    if (filters.categoryId) next.categoryId = filters.categoryId;
    if (filters.year) next.year = filters.year;
    if (filters.month) next.month = filters.month;
    if (filters.fundingSource) next.fundingSource = filters.fundingSource;
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [exporting, setExporting] = useState(false);

  const years = useMemo(() => currentYearRange(), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [expensesData, categoriesData] = await Promise.all([
        getExpenses(filters),
        getCategories(),
      ]);
      const sorted = [...expensesData].sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(sorted);
      setCategories(categoriesData);
    } catch (err) {
      setError("Could not load expenses. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const reloadCategories = useCallback(async () => {
    const categoriesData = await getCategories();
    setCategories(categoriesData);
    return categoriesData;
  }, []);

  async function handleCreateCategory(name) {
    const cat = await createCategory({ name, allocatedBudget: null });
    await reloadCategories();
    return cat;
  }

  function openAddModal() {
    setEditingExpense(null);
    setModalOpen(true);
  }

  function openEditModal(expense) {
    setEditingExpense(expense);
    setModalOpen(true);
  }

  async function handleSubmit(payload) {
    if (editingExpense) {
      await updateExpense(editingExpense.id, payload);
    } else {
      await createExpense(payload);
    }
    setModalOpen(false);
    setEditingExpense(null);
    load();
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteExpense(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setDeleteTarget(null);
      setError("Could not delete expense. Please try again.");
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportExpensesCsv();
    } catch (err) {
      setError("Could not export CSV. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-clay-900">Expenses</h1>
          <p className="text-sm text-clay-500 mt-0.5">All logged construction expenses</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sand-300 bg-white hover:bg-sand-100 text-clay-700 text-sm font-medium px-4 py-2.5 transition-colors disabled:opacity-60"
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-terracotta-600 hover:bg-terracotta-700 text-white text-sm font-medium px-4 py-2.5 transition-colors shadow-sm"
          >
            <span className="text-lg leading-none">+</span> Add Expense
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-sand-200 p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-clay-600 mb-1">Category</label>
          <select
            value={filters.categoryId}
            onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value }))}
            className="rounded-lg border border-sand-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-clay-600 mb-1">Year</label>
          <select
            value={filters.year}
            onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}
            className="rounded-lg border border-sand-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
          >
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-clay-600 mb-1">Month</label>
          <select
            value={filters.month}
            onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value }))}
            className="rounded-lg border border-sand-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
          >
            <option value="">All months</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-clay-600 mb-1">Funded By</label>
          <select
            value={filters.fundingSource}
            onChange={(e) => setFilters((f) => ({ ...f, fundingSource: e.target.value }))}
            className="rounded-lg border border-sand-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
          >
            <option value="">All sources</option>
            {FUNDING_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        {(filters.categoryId || filters.year || filters.month || filters.fundingSource) && (
          <button
            onClick={() => setFilters({ categoryId: "", year: "", month: "", fundingSource: "" })}
            className="text-sm text-terracotta-600 hover:underline pb-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Expense list */}
      <div className="bg-white rounded-xl border border-sand-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-clay-500">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-16 text-clay-400 text-sm">No expenses match these filters.</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-[960px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-clay-500 uppercase tracking-wide bg-sand-100">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                    <th className="px-4 py-3 font-medium">Funded By</th>
                    <th className="px-4 py-3 font-medium">Paid By</th>
                    <th className="px-4 py-3 font-medium">Mode</th>
                    <th className="px-4 py-3 font-medium">Note</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {expenses.map((exp) => {
                    const dual = formatDual(exp.amount);
                    return (
                      <tr key={exp.id} className="hover:bg-sand-50">
                        <td className="px-4 py-3 whitespace-nowrap tabular-nums text-clay-700">{formatDate(exp.date)}</td>
                        <td className="px-4 py-3 text-clay-700">{exp.categoryName}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-clay-900 whitespace-nowrap">
                          {dual.primary}
                          <div className="text-[11px] font-normal text-clay-400">{dual.secondary}</div>
                        </td>
                        <td className="px-4 py-3">
                          <FundingBadges splits={exp.fundingSplits} amount={exp.amount} formatDual={formatDual} />
                        </td>
                        <td className="px-4 py-3 text-clay-700">{exp.paidBy}</td>
                        <td className="px-4 py-3 text-clay-700">{exp.paymentMode}</td>
                        <td className="px-4 py-3 text-clay-500 max-w-[180px] truncate" title={exp.note}>{exp.note || "No note"}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button onClick={() => openEditModal(exp)} className="text-terracotta-600 hover:underline text-xs font-medium mr-3">Edit</button>
                          <button onClick={() => setDeleteTarget(exp)} className="text-red-600 hover:underline text-xs font-medium">Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile/tablet cards */}
            <div className="lg:hidden divide-y divide-sand-100">
              {expenses.map((exp) => {
                const dual = formatDual(exp.amount);
                return (
                  <div key={exp.id} className="p-4">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-clay-900 truncate">{exp.categoryName}</p>
                        <p className="text-xs text-clay-500 mt-0.5">{formatDate(exp.date)} · {exp.paymentMode}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold tabular-nums text-clay-900">{dual.primary}</p>
                        <p className="text-[11px] text-clay-400 tabular-nums">{dual.secondary}</p>
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      <p className="text-xs text-clay-500 truncate">Paid by {exp.paidBy}</p>
                      <FundingBadges splits={exp.fundingSplits} amount={exp.amount} formatDual={formatDual} />
                    </div>
                    {exp.note && <p className="text-xs text-clay-400 mt-1 break-words">{exp.note}</p>}
                    <div className="mt-2 flex gap-4">
                      <button onClick={() => openEditModal(exp)} className="text-terracotta-600 text-xs font-medium min-h-[32px] py-1.5">Edit</button>
                      <button onClick={() => setDeleteTarget(exp)} className="text-red-600 text-xs font-medium min-h-[32px] py-1.5">Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <ExpenseFormModal
        open={modalOpen}
        categories={categories}
        initialData={editingExpense}
        onClose={() => { setModalOpen(false); setEditingExpense(null); }}
        onSubmit={handleSubmit}
        onCreateCategory={handleCreateCategory}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this expense?"
        message={deleteTarget ? `This will permanently remove the ${formatInr(deleteTarget.amount)} expense on ${formatDate(deleteTarget.date)}.` : ""}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function FundingBadge({ source, amount, showAmount, formatDual }) {
  if (!source) {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-sand-200 text-clay-600">
        Unspecified
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white"
      style={{ backgroundColor: fundingSourceColor(source) }}
    >
      {fundingSourceLabel(source)}
      {showAmount && ` · ${formatDual(amount).primary}`}
    </span>
  );
}

// Renders one badge per funding split. When an expense has no splits (funding
// not specified), falls back to the existing "Unspecified" badge treatment.
function FundingBadges({ splits, amount, formatDual }) {
  if (!splits || splits.length === 0) {
    return <FundingBadge source={null} />;
  }
  const showAmount = splits.length > 1 || splits[0]?.amount !== amount;
  return (
    <div className="flex flex-wrap gap-1">
      {splits.map((s, i) => (
        <FundingBadge
          key={`${s.source}-${i}`}
          source={s.source}
          amount={s.amount}
          showAmount={showAmount}
          formatDual={formatDual}
        />
      ))}
    </div>
  );
}
