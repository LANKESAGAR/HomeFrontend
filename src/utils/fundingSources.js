// The two pools of money that fund the house build.
export const FUNDING_SOURCES = [
  { value: "BANK_LOAN", label: "Bank Loan", shortLabel: "Bank Loan" },
  { value: "PERSONAL", label: "Personal Funds - Sagar", shortLabel: "Personal Funds" },
];

export function fundingSourceLabel(value) {
  if (!value) return "Unspecified";
  return FUNDING_SOURCES.find((s) => s.value === value)?.label ?? value;
}

// Reuses the first two hues from the app's fixed categorical palette so the
// funding badges/cards stay visually consistent with categories/plans.
export const FUNDING_SOURCE_COLORS = {
  BANK_LOAN: "#2a78d6",
  PERSONAL: "#eb6834",
};

export function fundingSourceColor(value) {
  return FUNDING_SOURCE_COLORS[value] || "#ab9670"; // sand-500 for unspecified/unknown
}
