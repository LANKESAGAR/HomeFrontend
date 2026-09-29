import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, Sector, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { getDashboardSummary } from "../api/dashboard";
import { getCategories, createCategory } from "../api/categories";
import { createExpense } from "../api/expenses";
import SummaryCard from "../components/SummaryCard";
import ExpenseFormModal from "../components/ExpenseFormModal";
import { formatMonthLabel } from "../utils/format";
import { buildCategoryColorMap } from "../utils/categoryColors";
import { useCurrency } from "../context/CurrencyContext";
import { fundingSourceLabel, fundingSourceColor } from "../utils/fundingSources";
import ProgressBar from "../components/ProgressBar";

const HELP_BANNER_KEY = "hasSeenHelpBanner";

// Muted neutral used for "folded" / non-real slices (the category donut's
// "Other" bucket and the funding donut's "Unspecified" slice). This is the
// same sand-500 step already used elsewhere as the fallback color for an
// unspecified funding source (see fundingSourceColor) - reused rather than
// inventing a second gray.
const NEUTRAL_SLICE_COLOR = "#ab9670";
const MAX_CATEGORY_SLICES = 6;
const PERCENT_LABEL_THRESHOLD = 0.08;
const RADIAN = Math.PI / 180;

// Direct percentage label for slices large enough to read. Positioned just
// outside the ring (labelLine={false}, so no connector clutter).
function renderPercentLabel(props) {
  const { percent, cx, cy, midAngle, outerRadius } = props;
  if (!percent || percent < PERCENT_LABEL_THRESHOLD) return null;
  const radius = outerRadius + 14;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      textAnchor={x > cx + 1 ? "start" : x < cx - 1 ? "end" : "middle"}
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
      fill="#52463a"
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
}

// Recharts (v3, installed here) auto-tracks which slice is hovered internally
// and drives activeShape/inactiveShape from that - no local activeIndex state
// needed. The active slice pops out slightly; the rest dim, a common "focus"
// interaction pattern.
function renderActiveSlice(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6}
      startAngle={startAngle} endAngle={endAngle} fill={fill}
      stroke="#fcfcfb" strokeWidth={2}
    />
  );
}

function renderInactiveSlice(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius}
      startAngle={startAngle} endAngle={endAngle} fill={fill}
      stroke="#fcfcfb" strokeWidth={2} opacity={0.45}
    />
  );
}

// Shared expressive donut used for both "Spend by Category" and "Spend by
// Funding Source": ring style, center total, direct % labels, hover pop/dim,
// and click-to-filter (slice or legend entry) via onSliceClick.
function DonutChart({ data, formatDual, centerCaption, onSliceClick, height = 300 }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const totalDual = formatDual(total);
  // The default Recharts tooltip follows the cursor, which on a compact donut
  // means it renders right over the center-total overlay while hovering a
  // slice. Fading the overlay out during hover avoids the two fighting for
  // the same space, rather than fighting Recharts' cursor-following default.
  const [hovering, setHovering] = useState(false);

  function fire(entry) {
    if (!entry || entry.clickable === false) return;
    onSliceClick?.(entry);
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={2}
            label={renderPercentLabel}
            labelLine={false}
            activeShape={renderActiveSlice}
            inactiveShape={renderInactiveSlice}
            onClick={(d) => fire(d?.payload)}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
          >
            {data.map((entry) => (
              <Cell
                key={entry.key}
                fill={entry.color}
                stroke="#fcfcfb"
                strokeWidth={2}
                cursor={entry.clickable === false ? "default" : "pointer"}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => `${formatDual(value).primary} (${formatDual(value).secondary})`}
            wrapperStyle={{ zIndex: 20 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, cursor: "pointer" }}
            onClick={(legendEntry) => fire(legendEntry?.payload)}
          />
        </PieChart>
      </ResponsiveContainer>
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none transition-opacity duration-150 ${hovering ? "opacity-0" : "opacity-100"}`}
        style={{ paddingBottom: 28 }}
      >
        <span className="text-[10px] uppercase tracking-wide text-clay-400">{centerCaption}</span>
        <span className="text-xl font-bold text-clay-900 leading-tight">{totalDual.primary}</span>
        <span className="text-xs text-clay-400">{totalDual.secondary}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { formatDual } = useCurrency();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [showHelpBanner, setShowHelpBanner] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(HELP_BANNER_KEY)) {
        setShowHelpBanner(true);
      }
    } catch {
      // localStorage unavailable; just skip the banner
    }
  }, []);

  function dismissHelpBanner() {
    setShowHelpBanner(false);
    try {
      localStorage.setItem(HELP_BANNER_KEY, "true");
    } catch {
      // ignore
    }
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryData, categoriesData] = await Promise.all([
        getDashboardSummary(),
        getCategories(),
      ]);
      setSummary(summaryData);
      setCategories(categoriesData);
    } catch (err) {
      setError("Could not load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddExpense(payload) {
    await createExpense(payload);
    setModalOpen(false);
    load();
  }

  async function handleCreateCategory(name) {
    const cat = await createCategory({ name, allocatedBudget: null });
    const categoriesData = await getCategories();
    setCategories(categoriesData);
    return cat;
  }

  if (loading) {
    return <div className="text-center py-20 text-clay-500">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600">{error}</p>
        <button onClick={load} className="mt-3 text-sm underline text-terracotta-600">Retry</button>
      </div>
    );
  }

  const colorMap = buildCategoryColorMap(summary?.categoryBreakdown ?? []);
  const remainingPct = summary?.totalContributed > 0 ? (summary.remaining / summary.totalContributed) * 100 : 0;
  let remainingTone = "good";
  if (remainingPct < 10) remainingTone = "danger";
  else if (remainingPct < 25) remainingTone = "warning";

  const rawCategoryData = (summary?.categoryBreakdown ?? [])
    .filter((c) => c.spent > 0)
    .map((c) => ({
      key: c.categoryId,
      name: c.categoryName,
      value: c.spent,
      categoryId: c.categoryId,
      color: colorMap[c.categoryId],
      clickable: true,
    }));

  // Cap to top 6 + "Other" once there are more than 7 nonzero categories, so
  // the ring never has to lean on a 9th+ generated hue.
  let pieData = rawCategoryData;
  if (rawCategoryData.length > 7) {
    const sorted = [...rawCategoryData].sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, MAX_CATEGORY_SLICES);
    const rest = sorted.slice(MAX_CATEGORY_SLICES);
    const otherTotal = rest.reduce((sum, c) => sum + c.value, 0);
    pieData = [
      ...top,
      { key: "__other__", name: "Other", value: otherTotal, color: NEUTRAL_SLICE_COLOR, clickable: false },
    ];
  }

  const fundingPieData = (summary?.fundingBreakdown ?? [])
    .filter((f) => f.spent > 0)
    .map((f) => ({
      key: f.source,
      name: fundingSourceLabel(f.source),
      value: f.spent,
      source: f.source,
      color: fundingSourceColor(f.source),
      clickable: true,
    }));
  if (summary?.totalUnspecifiedSpend > 0) {
    fundingPieData.push({
      key: "__unspecified__",
      name: "Unspecified",
      value: summary.totalUnspecifiedSpend,
      color: NEUTRAL_SLICE_COLOR,
      clickable: false,
    });
  }

  function handleCategorySliceClick(entry) {
    if (!entry?.categoryId) return;
    navigate(`/expenses?categoryId=${entry.categoryId}`);
  }

  function handleFundingSliceClick(entry) {
    if (!entry?.source) return;
    navigate(`/expenses?fundingSource=${entry.source}`);
  }

  const monthlyData = (summary?.monthlySpend ?? []).map((m) => ({
    month: formatMonthLabel(m.month),
    amount: m.amount,
  }));

  return (
    <div className="space-y-6">
      {showHelpBanner && (
        <div className="flex items-start sm:items-center justify-between gap-3 rounded-xl border border-terracotta-200 bg-terracotta-50 px-4 py-3 text-sm text-clay-800">
          <p className="min-w-0">
            New here?{" "}
            <Link to="/help" onClick={dismissHelpBanner} className="font-medium text-terracotta-700 underline hover:text-terracotta-800">
              Visit the Help page
            </Link>{" "}
            to learn how everything works.
          </p>
          <button
            onClick={dismissHelpBanner}
            aria-label="Dismiss"
            className="shrink-0 text-clay-500 hover:text-clay-700 text-lg leading-none px-1"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-clay-900">Dashboard</h1>
          <p className="text-sm text-clay-500 mt-0.5">Overview of the house construction budget</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-terracotta-600 hover:bg-terracotta-700 text-white text-sm font-medium px-4 py-2.5 transition-colors shadow-sm"
        >
          <span className="text-lg leading-none">+</span> Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Total Funds Available"
          value={formatDual(summary?.totalContributed).primary}
          secondaryValue={formatDual(summary?.totalContributed).secondary}
          tone="neutral"
          sublabel="Bank Loan + Personal Funds contributed so far"
        />
        <SummaryCard
          label="Total Spent"
          value={formatDual(summary?.totalSpent).primary}
          secondaryValue={formatDual(summary?.totalSpent).secondary}
          tone="neutral"
        />
        <SummaryCard
          label="Remaining"
          value={formatDual(summary?.remaining).primary}
          secondaryValue={formatDual(summary?.remaining).secondary}
          tone={remainingTone}
          sublabel={`${remainingPct.toFixed(0)}% of funds left`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-sand-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-clay-800 mb-3">Spend by Category</h2>
          {pieData.length === 0 ? (
            <EmptyChartState message="No expenses logged yet." />
          ) : (
            <DonutChart
              data={pieData}
              formatDual={formatDual}
              centerCaption="Total Spent"
              onSliceClick={handleCategorySliceClick}
              height={300}
            />
          )}
        </div>

        <div className="bg-white rounded-xl border border-sand-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-clay-800 mb-3">Monthly Spend Trend</h2>
          {monthlyData.length === 0 ? (
            <EmptyChartState message="No monthly data yet." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#898781" }} axisLine={{ stroke: "#c3c2b7" }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#898781" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatDual(v).primary}
                  width={70}
                />
                <Tooltip formatter={(value) => `${formatDual(value).primary} (${formatDual(value).secondary})`} />
                <Bar dataKey="amount" fill="#2a78d6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {(summary?.fundingBreakdown?.length > 0 || summary?.totalUnspecifiedSpend > 0) && (
        <div className="bg-white rounded-xl border border-sand-200 p-5 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <h2 className="text-sm font-semibold text-clay-800">Funding Sources</h2>
            <Link to="/funding" className="text-xs font-medium text-terracotta-600 hover:underline">
              Manage funding →
            </Link>
          </div>

          <div className="mb-4 max-w-md">
            <h3 className="text-xs font-semibold text-clay-600 mb-2">Spend by Funding Source</h3>
            {fundingPieData.length === 0 ? (
              <EmptyChartState message="No funded expenses logged yet." />
            ) : (
              <DonutChart
                data={fundingPieData}
                formatDual={formatDual}
                centerCaption="Total Spent"
                onSliceClick={handleFundingSliceClick}
                height={280}
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(summary.fundingBreakdown ?? []).map((f) => {
              const contributed = formatDual(f.contributed);
              const spent = formatDual(f.spent);
              const remaining = formatDual(f.remaining);
              return (
                <div key={f.source} className="rounded-lg border border-sand-200 p-4 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: fundingSourceColor(f.source) }}
                    />
                    <h3 className="text-sm font-semibold text-clay-900 truncate">{fundingSourceLabel(f.source)}</h3>
                  </div>
                  <div className="mt-3 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-clay-500">
                    <span className="truncate">Spent: <span className="font-medium text-clay-800">{spent.primary}</span></span>
                    <span className="truncate">Contributed: <span className="font-medium text-clay-800">{contributed.primary}</span></span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar spent={f.spent} allocated={f.contributed} />
                  </div>
                  <p className={`mt-2 text-xs font-medium ${f.remaining < 0 ? "text-red-600" : "text-clay-500"}`}>
                    {f.remaining < 0
                      ? `${formatDual(Math.abs(f.remaining)).primary} over-drawn`
                      : `${remaining.primary} remaining`}
                    <span className="text-clay-400 font-normal"> ({remaining.secondary})</span>
                  </p>
                </div>
              );
            })}
          </div>
          {summary.totalUnspecifiedSpend > 0 && (
            <p className="mt-3 text-xs text-clay-400">
              {formatDual(summary.totalUnspecifiedSpend).primary} spent on expenses without a funding source tagged (older data).
            </p>
          )}
        </div>
      )}

      <ExpenseFormModal
        open={modalOpen}
        categories={categories}
        initialData={null}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddExpense}
        onCreateCategory={handleCreateCategory}
      />
    </div>
  );
}

function EmptyChartState({ message }) {
  return (
    <div className="h-[280px] flex items-center justify-center text-sm text-clay-400">
      {message}
    </div>
  );
}
