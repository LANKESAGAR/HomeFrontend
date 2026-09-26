// Validated categorical palette (colorblind-safe, fixed order - do not reorder or cycle).
// The same category always maps to the same slot so colors stay consistent
// across the pie chart, bar/line chart, and progress bars.
export const CATEGORY_PALETTE = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
];

/**
 * Build a stable id/name -> color map given an ordered list of categories.
 * Categories keep the same color across renders as long as their relative
 * order (or ids) don't change; falls back to cycling the palette past 8.
 */
export function buildCategoryColorMap(categories = []) {
  const map = {};
  categories.forEach((cat, idx) => {
    const key = cat.categoryId ?? cat.id;
    map[key] = CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length];
  });
  return map;
}

export function colorForIndex(idx) {
  return CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length];
}
