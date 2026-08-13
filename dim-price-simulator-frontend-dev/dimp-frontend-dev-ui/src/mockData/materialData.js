// mockData/materialData.js — mock data for the Material Price (DIM) tab.
// Figures are fixed to the June 2026 cycle shown in the brief; the top-bar
// timeframe filter relabels the period and applies a light deterministic
// jitter so the tab still reacts like the Inflation tab does.

// ---- price-effect decomposition (the vertical bar chart) ----
// ---- decomposition palette: harmonised with the Inflation index colours ----
export const MAT_DECOMP = [
  { id: 'index',      label: 'Index',      amt: 58, color: '#0a84ff', grad: ['#3a9bff', '#0a6fe0'] },
  { id: 'fx',         label: 'FX',         amt: 41, color: '#bf5af2', grad: ['#cf7af5', '#a93fe0'] },
  { id: 'volume',     label: 'Volume',     amt: 22, color: '#32ade6', grad: ['#54c6f0', '#2a9fd0'] },
  { id: 'commercial', label: 'Commercial', amt: 12, color: '#ff9f0a', grad: ['#ffc14d', '#f0a020'] },
];
export const MAT_DECOMP_NOTE = 'Commercial impacts (transport, added value, negotiations) are captured separately in natural language and rolled into the category total.';

// ---- categories (drives the decomposition-by-category bars, breakdown table, right rail) ----
// donut/legend palette runs light-cyan → deep-blue, matching the brief.
// rangeLo/rangeHi = the model's next-period % forecast band; conf tracks sign-off status.
export const MAT_CATEGORIES = [
  { id: 'shipping',  name: 'Shipping Cases', effect: 39.9, color: '#46c6ea',
    granularity: 'Item level',     impactors: 'Paper · Fuel',        model: 'v3.2',  status: 'Signed off',  nextPdca: 'Jul 2026',
    keyImpactor: 'Paper prices',   vsMonth: 3.1,  vsYear: 7.8,  rangeLo: 2.4, rangeHi: 4.0, conf: 'High',   highlight: true },
  { id: 'acetate',   name: 'Acetate Tow',    effect: 30.6, color: '#2fd1b6',
    granularity: 'Supplier level', impactors: 'VAM · FX',            model: 'v2.1',  status: 'Signed off',  nextPdca: 'Jul 2026',
    keyImpactor: 'VAM index',      vsMonth: 5.2,  vsYear: 12.4, rangeLo: 4.0, rangeHi: 6.6, conf: 'High',   highlight: true },
  { id: 'finepaper', name: 'Fine Paper',     effect: 23.9, color: '#2f9bd0',
    granularity: 'Item level',     impactors: 'Pulp (BHKP)',         model: 'v1.8',  status: 'Pending',     nextPdca: 'Jun 2026',
    keyImpactor: 'Pulp index',     vsMonth: 2.0,  vsYear: 4.6,  rangeLo: 1.0, rangeHi: 3.2, conf: 'Medium', highlight: false },
  { id: 'adhesives', name: 'Adhesives',      effect: 20.0, color: '#2a72b0',
    granularity: 'Supplier level', impactors: 'VAM · Acetic · FX',   model: 'v2.0',  status: 'Signed off',  nextPdca: 'Jul 2026',
    keyImpactor: 'FX (EUR/USD)',   vsMonth: -1.4, vsYear: 3.2,  rangeLo: -2.4, rangeHi: 0.4, conf: 'High',   highlight: false },
  { id: 'susceptors',name: 'Susceptors',     effect: 18.6, color: '#225f96',
    granularity: 'Supplier level', impactors: 'Steel · Aluminium',   model: 'draft', status: 'In progress', nextPdca: 'Jun 2026',
    keyImpactor: 'Steel',          vsMonth: 4.4,  vsYear: 9.1,  rangeLo: 2.6, rangeHi: 6.4, conf: 'Low',    highlight: false },
];

// rail range bar scale (handles the small negative band on Adhesives)
export const MAT_RANGE_MIN = -3, MAT_RANGE_MAX = 14;
export const matRangePos = (v) => Math.max(0, Math.min(100, (v - MAT_RANGE_MIN) / (MAT_RANGE_MAX - MAT_RANGE_MIN) * 100));

// order used by the Official Result table (matches the brief exactly)
export const MAT_OFFICIAL_ORDER = ['shipping', 'acetate', 'adhesives', 'finepaper', 'susceptors'];

export const MAT_TOTAL = MAT_CATEGORIES.reduce((s, c) => s + c.effect, 0); // 133.0

// ---- headline KPIs ----
export const MAT_HEADLINE = {
  total: 133,
  vsMonth: 4.1,
  vsYear: 7.4,
  categoriesLive: 5,
  categoriesUniverse: '50+',
  costAvoided: 77,   // M$ prevented through procurement actions
  signedOff: 3,
};

// ---- Key insights (accordion — mirrors the Inflation tab; recommendation folded in) ----
// Each card spans one or more categories; the price-effect pill is computed live.
export const MAT_KEY_INSIGHTS = [
  { id: 'index', tone: 'risk', catIds: ['shipping', 'finepaper', 'acetate'],
    headline: 'Index moves are the dominant driver — paper and VAM lead the rise',
    body: 'The index component contributes 58 M$ of the 133 M$ effect, concentrated in paper and VAM. Shipping Cases is the single largest contributor at 39.9 M$, tracking paper and fuel indices.',
    rec: 'Lock supplier allocation on Shipping Cases while paper indices remain elevated — protects an estimated 3 M$.',
    metricLabel: 'Index share', metricVal: '44%' },
  { id: 'acetate', tone: 'risk', catIds: ['acetate'],
    headline: 'Acetate Tow shows the steepest category increase on VAM strength',
    body: 'Acetate Tow is up 5.2% month-on-month and 12.4% year-on-year, driven by the VAM index. At 30.6 M$ it is the second-largest absolute contributor and is already signed off.',
    rec: 'Hold the signed-off allocation; revisit VAM hedge coverage into Q3 before the next index reset.',
    metricLabel: 'MoM move', metricVal: '▲ 5.2%' },
  { id: 'fx', tone: 'watch', catIds: ['adhesives'],
    headline: 'FX provides a partial tailwind as EUR/USD softens',
    body: 'FX adds 41 M$ to the effect. A softer EUR/USD partly offsets index pressure on FX-linked lines such as Adhesives, where the net month-on-month move is −1.4%.',
    rec: 'Capture the negotiated added value on Adhesives (−0.6 M$) before period close so the official net reflects it.',
    metricLabel: 'FX contribution', metricVal: '41 M$' },
  { id: 'pending', tone: 'flag', catIds: ['finepaper', 'susceptors'],
    headline: 'Two categories remain pending sign-off ahead of cycle close',
    body: 'Fine Paper and Susceptors are not yet signed off. Pulp has stabilised, leaving low re-open risk on Fine Paper; Susceptors is still in draft pending the steel-weight Model Card.',
    rec: 'Prioritise Fine Paper sign-off this week and finalise the Susceptors Model Card (steel weight) to move it out of draft.',
    metricLabel: 'Pending', metricVal: '2 of 5' },
];

// ---- Official-result cross-category summary ----
export const MAT_OFFICIAL_SUMMARY = [
  { t: 'Total DIM price effect for June 2026 is ' }, { hl: '133 M$' },
  { t: ', up 4.1% versus the prior period and 7.4% year-on-year. The increase is concentrated in the ' }, { b: 'index' },
  { t: ' driver (+58 M$), led by paper and VAM strength, while a softer EUR/USD provides a partial FX tailwind. Procurement actions prevented an estimated ' }, { b: '77 M$' },
  { t: ' of additional cost through negotiated added value and supplier allocation. ' }, { b: 'Acetate Tow' },
  { t: ' posts the steepest category move (▲ 5.2% MoM, ▲ 12.4% YoY) on VAM; ' }, { b: 'Shipping Cases' },
  { t: ' remains the largest absolute contributor at 39.9 M$. Three of five categories are signed off — ' }, { b: 'Fine Paper' },
  { t: ' and ' }, { b: 'Susceptors' },
  { t: ' remain pending ahead of cycle close on 30 Jun. Forward risk is skewed to the upside on steel and paper; no category is currently flagged for downside revision.' },
];

// ---- views (the View selector — “All Categories” is the default) ----
export const MAT_VIEWS_SEED = [
  { id: 'all',     name: 'All Categories',  cats: MAT_CATEGORIES.map((c) => c.id), custom: false },
  { id: 'signed',  name: 'Signed-off only', cats: ['shipping', 'acetate', 'adhesives'], custom: false },
  { id: 'pending', name: 'Pending sign-off', cats: ['finepaper', 'susceptors'], custom: false },
];

// capitalize the first letter of the first word
export function matCapFirst(s) { return (s || '').replace(/^(\s*)([a-z])/, (m, a, b) => a + b.toUpperCase()); }

export const matCatById = (id) => MAT_CATEGORIES.find((c) => c.id === id);

// turn a view (list of category ids) into the live dashboard figures.
// the brief's full decomposition (58/41/22/12, total 133) is scaled by the
// share of effect the selected categories represent.
export function matDeriveView(view) {
  const cats = view.cats.map(matCatById).filter(Boolean);
  const total = cats.reduce((s, c) => s + c.effect, 0);
  const scale = MAT_TOTAL ? total / MAT_TOTAL : 0;
  const decomp = MAT_DECOMP.map((d) => ({ ...d, amt: Math.round(d.amt * scale) }));
  // spend-weighted average % moves; the full portfolio uses the official headline figures
  const wsum = cats.reduce((s, c) => s + c.effect, 0) || 1;
  const isAll = MAT_CATEGORIES.every((c) => view.cats.includes(c.id)) && cats.length === MAT_CATEGORIES.length;
  const vsMonth = isAll ? MAT_HEADLINE.vsMonth : cats.reduce((s, c) => s + c.vsMonth * c.effect, 0) / wsum;
  const vsYear = isAll ? MAT_HEADLINE.vsYear : cats.reduce((s, c) => s + c.vsYear * c.effect, 0) / wsum;
  const signedOff = cats.filter((c) => c.status === 'Signed off').length;
  return { cats, total, decomp, vsMonth, vsYear, signedOff };
}

// ---- timeframe filter (mirrors the Inflation tab) ----
export const MAT_TIMEFRAMES = ['Monthly', 'Quarterly', 'Yearly'];
export const MAT_TIME_OPTIONS = {
  Monthly: ['March 2026', 'April 2026', 'May 2026', 'June 2026'],
  Quarterly: ['Q3 2025', 'Q4 2025', 'Q1 2026', 'Q2 2026'],
  Yearly: ['2024', '2025', '2026'],
};
export const MAT_TIME_DEFAULT = { Monthly: 'June 2026', Quarterly: 'Q2 2026', Yearly: '2026' };
export const MAT_PERIOD_NOUN = { Monthly: 'month', Quarterly: 'quarter', Yearly: 'year' };

// ---- formatting helpers ----
export function matFmtM(v) { return (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, '') + ' M$'; }
export function matFmtMShort(v) { return (Math.round(v * 10) / 10) + ' M$'; }
export function matFmtPct(v) { const s = v >= 0 ? '▲' : '▼'; return s + ' ' + Math.abs(v).toFixed(1) + '%'; }

// ---- confidence colour (matches the Inflation rail) ----
export const MAT_CONF_COLOR = { High: 'var(--c-green)', Medium: 'var(--c-orange)', Low: 'var(--c-red)' };

// ---- suggested follow-up questions (partly view-aware) ----
export function MAT_FOLLOWUPS(view) {
  return [
    `Run the Fine Paper price model using the latest available volume scenario.`,
    `What pricing categories do you support?`,
    `Adhesive WB pricing for LA region, December 2025.`,
    `Let’s start with Fine Paper. Run the price model.`,
    `Perform a what-if analysis assuming a 5% increase in all pulp indexes for 2026 year.`,
  ];
}
