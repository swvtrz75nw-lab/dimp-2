// Pure data/aggregation helpers - no React, no DOM. A "row" is one line item:
// { team, l2, l3, region, cluster, country, vendorCountry, year,
//   spend, baseline_Best/Base/Worst, gross_*, prevention_*, netimpact_*,
//   final_*, drivers: { <DRIVERS[].key>: number } }

export const SCENARIOS = ['Best', 'Base', 'Worst'];

// `v` is the CSS variable each bar segment/swatch is painted with - defined
// in BreakdownPanel.css (theme-aware, so segments stay legible in dark mode).
export const DRIVERS = [
  { key: 'WhiteCollar', label: 'White collar (labour / CPI)', v: '--bp-s1' },
  { key: 'BlueCollar', label: 'Blue collar', v: '--bp-s2' },
  { key: 'ElecGas', label: 'Electricity / gas', v: '--bp-s3' },
  { key: 'Fuel', label: 'Fuel', v: '--bp-s4' },
  { key: 'Materials', label: 'Materials', v: '--bp-s5' },
  { key: 'Technology', label: 'Technology / R&D / assets', v: '--bp-s6' },
  { key: 'Overheads', label: 'Overheads', v: '--bp-s7' },
  { key: 'Margin', label: 'Margin', v: '--bp-s8' },
  { key: 'Other', label: 'Other', v: '--bp-other-fill' },
];

// Table A/B/C: alternate views of the same detail table, regrouping the 9
// drivers into fewer columns. Ported as-is from the prototype - Table A/C
// were validated against reference screenshots; Table B is this app's own
// grouping (not sourced data) - confirm both before relying on them.
export const TABLE_DEFS = {
  A: {
    tabLabel: 'Table A: IM&S Summary',
    groups: [
      { label: 'White Collar', keys: ['WhiteCollar'] },
      { label: 'Blue Collar', keys: ['BlueCollar'] },
      { label: 'Elec/Gas', keys: ['ElecGas'] },
      { label: 'Fuel', keys: ['Fuel'] },
      { label: 'Materials', keys: ['Materials'] },
      { label: 'Tech/R&D', keys: ['Technology'] },
      { label: 'Overheads', keys: ['Overheads'] },
      { label: 'Margin', keys: ['Margin'] },
      { label: 'Other', keys: ['Other'] },
    ],
    note: "Net impact allocated across the 9 cost drivers, weighted by each row's Base-scenario baseline mix. Figures in $M.",
  },
  B: {
    tabLabel: 'Table B: Inflation Type',
    groups: [
      { label: 'Labor', keys: ['WhiteCollar', 'BlueCollar'] },
      { label: 'Commodity', keys: ['Materials', 'Fuel', 'ElecGas'] },
      { label: 'Structural', keys: ['Overheads', 'Technology', 'Other'] },
      { label: 'Contractual', keys: ['Margin'] },
    ],
    note: 'Our own grouping of the 9 drivers into broad inflation types (not a field from the source data) - confirm this categorization before relying on it. Figures in $M.',
  },
  C: {
    tabLabel: 'Table C: Indices',
    groups: [
      { label: 'Labour', keys: ['WhiteCollar', 'BlueCollar'] },
      { label: 'CPI', keys: ['Materials', 'Technology', 'Overheads', 'Other'] },
      { label: 'Elec/Gas', keys: ['ElecGas'] },
      { label: 'Fuel', keys: ['Fuel'] },
    ],
    note: "Net impact mapped to the 4 macro indices that drive it. Margin is excluded (it's contractual, not index-linked), so these 4 columns won't always add up to Total. Figures in $M.",
  },
};

// null means "this driver bucket has zero baseline presence here" (renders
// as "-"), distinct from a genuine value that happens to round near zero.
export function computeBucketValue(agg, keys) {
  const bucketBaseline = keys.reduce((s, k) => s + (agg.drivers[k] || 0), 0);
  if (bucketBaseline === 0) return null;
  const totalBaseline = DRIVERS.reduce((s, d) => s + agg.drivers[d.key], 0);
  if (totalBaseline === 0) return null;
  return agg.netimpact.Base * (bucketBaseline / totalBaseline);
}

export function fmtUSD(n) {
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  if (a >= 1e9) return sign + '$' + (a / 1e9).toFixed(2) + 'B';
  if (a >= 1e6) return sign + '$' + (a / 1e6).toFixed(1) + 'M';
  if (a >= 1e3) return sign + '$' + (a / 1e3).toFixed(0) + 'K';
  return sign + '$' + a.toFixed(0);
}
export function fmtPct(n, d) {
  return n.toFixed(d == null ? 1 : d) + '%';
}

export function riskLevel(pct) {
  if (pct >= 10) return 'critical';
  if (pct >= 6) return 'serious';
  if (pct >= 3) return 'warning';
  return 'good';
}
export const RISK_LABEL = { good: 'Low', warning: 'Moderate', serious: 'Elevated', critical: 'High' };

function emptyTriple() {
  return { Best: 0, Base: 0, Worst: 0 };
}
export function emptyAgg() {
  const drivers = {};
  DRIVERS.forEach((d) => (drivers[d.key] = 0));
  return { spend: 0, baseline: emptyTriple(), gross: emptyTriple(), prevention: emptyTriple(), netimpact: emptyTriple(), final: emptyTriple(), drivers };
}
export function addRow(agg, r) {
  agg.spend += r.spend;
  SCENARIOS.forEach((S) => {
    agg.baseline[S] += r['baseline_' + S] || 0;
    agg.gross[S] += r['gross_' + S] || 0;
    agg.prevention[S] += r['prevention_' + S] || 0;
    agg.netimpact[S] += r['netimpact_' + S] || 0;
    agg.final[S] += r['final_' + S] || 0;
  });
  DRIVERS.forEach((d) => (agg.drivers[d.key] += (r.drivers && r.drivers[d.key]) || 0));
}
export function groupBy(rows, keyFn) {
  const map = new Map();
  rows.forEach((r) => {
    const k = keyFn(r);
    if (!map.has(k)) map.set(k, emptyAgg());
    addRow(map.get(k), r);
  });
  return map;
}
export function sumRows(rows) {
  const agg = emptyAgg();
  rows.forEach((r) => addRow(agg, r));
  return agg;
}

// Every hierarchy filter (Category, PMI Market, Sievo Vendor) is a Set of
// selected LEAF names - selState/toggleGroup are the same contract used by
// FiltersDrawer.jsx's checkbox trees, just re-exported here so the bar
// list/heatmap/table can share the exact same full/partial/none semantics.
export function selState(set, items) {
  if (!items.length) return 'none';
  const n = items.filter((x) => set.has(x)).length;
  if (n === 0) return 'none';
  if (n === items.length) return 'full';
  return 'partial';
}
export function toggleGroup(set, items) {
  const next = new Set(set);
  const allIn = items.length > 0 && items.every((x) => next.has(x));
  if (allIn) items.forEach((x) => next.delete(x));
  else items.forEach((x) => next.add(x));
  return next;
}

// Selected rows float to the top (grouped by parent when there's more than
// one), everything else falls back to magnitude - shared ordering for bars,
// heatmap rows, and the table so the same items line up across all three.
export function withSelectionOrder(entries, selStateFn, parentFn) {
  return entries.slice().sort((a, b) => {
    const selA = selStateFn(a.label) !== 'none';
    const selB = selStateFn(b.label) !== 'none';
    if (selA !== selB) return selA ? -1 : 1;
    if (selA && selB && parentFn) {
      const pa = parentFn(a.label) || '';
      const pb = parentFn(b.label) || '';
      if (pa !== pb) return pa.localeCompare(pb);
    }
    return b.total - a.total;
  });
}

// Share (0-1) of a row's driver baseline currently enabled - prorates the
// bar list's displayed $/% so deselecting a driver shrinks the number, not
// just the segment color. Falls back to 1 for rows with no driver baseline.
export function driverShare(agg, enabledDrivers) {
  const totalBaseline = DRIVERS.reduce((s, d) => s + agg.drivers[d.key], 0);
  if (totalBaseline === 0) return 1;
  const enabledBaseline = DRIVERS.reduce((s, d) => (enabledDrivers.has(d.key) ? s + agg.drivers[d.key] : s), 0);
  return enabledBaseline / totalBaseline;
}

const SEQ_STEPS = ['--bp-seq-100', '--bp-seq-250', '--bp-seq-400', '--bp-seq-550', '--bp-seq-700'];
export function heatmapColorFor(pct, maxPct) {
  const t = Math.max(0, Math.min(1, pct / maxPct));
  const idx = Math.min(SEQ_STEPS.length - 1, Math.floor(t * SEQ_STEPS.length));
  return SEQ_STEPS[idx];
}
// Each sequential step is the same hex in both themes, so text ink is picked
// from the cell's own lightness rather than the page theme (a theme-flipped
// ink would read white-on-pale-blue for the lightest steps in dark mode).
export function heatmapInkFor(varName) {
  return varName === '--bp-seq-550' || varName === '--bp-seq-700' ? '#ffffff' : '#0b0f19';
}

function computeLeaves(node) {
  if (!node.children || node.children.length === 0) return [node.label];
  return node.children.flatMap(computeLeaves);
}

export function buildCategoryLookups(categoryTree) {
  const L2_TO_L3S = {};
  const L3_TO_L2 = {};
  categoryTree.forEach((n) => {
    L2_TO_L3S[n.label] = (n.children || []).map((c) => c.label);
    (n.children || []).forEach((c) => {
      L3_TO_L2[c.label] = n.label;
    });
  });
  return { L2_TO_L3S, L3_TO_L2 };
}

export function buildMarketLookups(marketTree) {
  const REGION_TO_COUNTRIES = {};
  const CLUSTER_TO_COUNTRIES = {};
  const CLUSTER_TO_REGION = {};
  const COUNTRY_TO_CLUSTER = {};
  marketTree.forEach((region) => {
    REGION_TO_COUNTRIES[region.label] = computeLeaves(region);
    (region.children || []).forEach((cluster) => {
      CLUSTER_TO_COUNTRIES[cluster.label] = (cluster.children || []).map((c) => c.label);
      CLUSTER_TO_REGION[cluster.label] = region.label;
      (cluster.children || []).forEach((country) => {
        COUNTRY_TO_CLUSTER[country.label] = cluster.label;
      });
    });
  });
  return { REGION_TO_COUNTRIES, CLUSTER_TO_COUNTRIES, CLUSTER_TO_REGION, COUNTRY_TO_CLUSTER };
}

// Same Year/Team/Category/Market/Vendor scoping the KPI row and both
// breakdowns share. `skipCat`/`skipMkt`/`skipVendor` let a panel compute its
// OWN bar list/heatmap ignoring its own filter (so a Category selection
// never hides its own siblings - only the Market panel and the KPI row need
// to actually narrow down from it, and vice versa).
export function filteredRows(rows, { year, allYears, team, catFilter, mktFilter, vendorFilter, skipCat, skipMkt, skipVendor }) {
  return rows.filter(
    (r) =>
      (allYears || r.year === year) &&
      (team === 'All' || r.team === team) &&
      (skipCat || catFilter.size === 0 || catFilter.has(r.l3)) &&
      (skipMkt || mktFilter.size === 0 || mktFilter.has(r.country)) &&
      (skipVendor || vendorFilter.size === 0 || vendorFilter.has(r.vendorCountry))
  );
}
