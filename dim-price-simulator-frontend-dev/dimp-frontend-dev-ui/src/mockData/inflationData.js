// mockData/inflationData.js — mock data + derive logic for the Inflation tab.
// Everything on the inflation screens is computed from (view, timeframe, timeValue)
// through deriveView / deriveSupplier so the whole tab reacts to the top-bar state.

// build a smooth-ish series (length n) trending by `drift` with noise `vol`, normalised 0..1
function infBuildSeries(seed, n, drift, vol) {
  const raw = []; let v = 0;
  for (let i = 0; i < n; i++) { v += drift / n + infJitter(seed + '#' + i, vol); raw.push(v); }
  const lo = Math.min(...raw), hi = Math.max(...raw), span = (hi - lo) || 1;
  return raw.map((x) => (x - lo) / span);
}

// ---- Price indices tracked (right rail = S&P-futures-style mini charts) ----
export const INF_INDICES = [
  { id: 'cpi',   short: 'CPI',       name: 'Consumer Price Index', value: '314.2', valNum: 314.2, unit: 'pts',  change: 3.1, abs: '+9.5 pts',    color: '#0a84ff', desc: 'All-items, EU harmonised', series: infBuildSeries('cpi', 40, 1.1, 0.10),
    yearly: [{ year: '2025', val: 4.20, min: 1.50, max: 7.00 }, { year: '2026', val: 6.26, min: 3.00, max: 9.50 }, { year: '2027', val: 5.01, min: 2.00, max: 8.20 }, { year: '2028', val: 4.32, min: 1.20, max: 7.50 }] },
  { id: 'crude', short: 'Labour',     name: 'Labour',               value: '$86.40', valNum: 86.4, unit: '/bbl', change: 9.2, abs: '+$7.28',     color: '#ff9f0a', desc: 'Labour cost index, EU average', series: infBuildSeries('crude', 40, 1.9, 0.22),
    yearly: [{ year: '2025', val: 5.45, min: 2.00, max: 8.80 }, { year: '2026', val: 7.23, min: 3.50, max: 11.00 }, { year: '2027', val: 5.67, min: 2.20, max: 9.10 }, { year: '2028', val: 4.51, min: 1.50, max: 7.80 }] },
  { id: 'elec',  short: 'Elec & Gas', name: 'Electricity & Gas',    value: '€0.28',  valNum: 0.28, unit: '/kWh', change: 5.8, abs: '+€0.015',   color: '#30d158', desc: 'EU wholesale electricity & gas', series: infBuildSeries('elec', 40, 1.3, 0.15),
    yearly: [{ year: '2025', val: 4.15, min: 1.00, max: 7.30 }, { year: '2026', val: 7.27, min: 3.50, max: 11.00 }, { year: '2027', val: 2.23, min: -1.50, max: 5.80 }, { year: '2028', val: 3.43, min: 0.00, max: 6.80 }] },
  { id: 'fuel',  short: 'Fuel',       name: 'Fuel',                  value: '$1.62',  valNum: 1.62, unit: '/L',   change: 7.4, abs: '+$0.11',    color: '#bf5af2', desc: 'Diesel & petrol, EU average', series: infBuildSeries('fuel', 40, 1.6, 0.18),
    yearly: [{ year: '2025', val: 2.21, min: -1.50, max: 5.90 }, { year: '2026', val: 8.32, min: 4.00, max: 12.50 }, { year: '2027', val: -4.36, min: -8.50, max: -0.50 }, { year: '2028', val: 1.80, min: -2.00, max: 5.50 }] },
];

// ---- Procurement categories (master list) ----
// sens = how strongly each index drives this category's price (weights ~sum to 1)
export const INF_CATEGORIES = [
  { id: 'acetate',  name: 'Facility Services & Supplies',     icon: 'product',    impact: 8.4, rangeLo: 6.2, rangeHi: 11.0, conf: 'High',   spend: 12.2, sens: { cpi: 0.15, crude: 0.35, elec: 0.25, fuel: 0.25 } },
  { id: 'tipping',  name: 'Technology',      icon: 'article',    impact: 4.9, rangeLo: 3.1, rangeHi: 6.4,  conf: 'High',   spend: 6.6,  sens: { cpi: 0.25, crude: 0.30, elec: 0.25, fuel: 0.20 } },
  { id: 'cigpaper', name: 'Commercial Development', icon: 'news', impact: 3.4, rangeLo: 2.0, rangeHi: 4.8,  conf: 'Medium', spend: 5.9,  sens: { cpi: 0.25, crude: 0.30, elec: 0.30, fuel: 0.15 } },
  { id: 'adhesive', name: 'Corporate Communication',icon: 'waterdrop',  impact: 6.1, rangeLo: 4.0, rangeHi: 8.3,  conf: 'Medium', spend: 2.1,  sens: { cpi: 0.15, crude: 0.30, elec: 0.20, fuel: 0.35 } },
  { id: 'shipping', name: 'Logistics',       icon: 'directions', impact: 7.2, rangeLo: 4.5, rangeHi: 10.1, conf: 'Medium', spend: 4.8, sens: { cpi: 0.20, crude: 0.20, elec: 0.15, fuel: 0.45 } },
  { id: 'packaging',name: 'Travel & Internal Events', icon: 'basket', impact: 4.2, rangeLo: 2.8, rangeHi: 5.7,  conf: 'High',   spend: 3.6,  sens: { cpi: 0.20, crude: 0.25, elec: 0.30, fuel: 0.25 } },
  { id: 'energy',   name: 'Commercial Deployment', icon: 'flame', impact: 9.6, rangeLo: 6.0, rangeHi: 13.2, conf: 'Low',    spend: 5.4,  sens: { cpi: 0.10, crude: 0.15, elec: 0.45, fuel: 0.30 } },
  { id: 'plugwrap', name: 'Technology',      icon: 'globe',      impact: 5.3, rangeLo: 3.4, rangeHi: 7.1,  conf: 'Medium', spend: 5.3,  sens: { cpi: 0.20, crude: 0.25, elec: 0.20, fuel: 0.35 } },
];

export const infCatById = (id) => INF_CATEGORIES.find((c) => c.id === id);

// ---- Views (the View selector). priceEffect is computed live, not stored. ----
export const INF_VIEWS_SEED = [
  { id: 'all',   name: 'All Categories', cats: INF_CATEGORIES.map((c) => c.id),
    priorities: 'Flag when crude swings start to flow through to landed cost, and surface any category drifting outside its expected range.', custom: false },
  { id: 'crude', name: 'Crude-Sensitive', cats: ['acetate', 'adhesive', 'shipping', 'energy', 'plugwrap'],
    priorities: 'Tell me how Brent moves are impacting these categories specifically, and when it is time to switch a supplier to cut fuel exposure.', custom: false },
  { id: 'paper', name: 'Paper & Board', cats: ['tipping', 'cigpaper', 'packaging'],
    priorities: 'Watch PPI pass-through on pulp and board, and warn me before a tender commitment window closes.', custom: false },
];

// ---- Suppliers with rising spend ----
export const INF_SUPPLIERS = [
  { id: 'cerulean', name: 'Accenture', region: 'Germany', cats: ['acetate'], spend: 11.8,
    rec: 'Labour drives 35% of cost on this supplier — the largest single index exposure at $4.1M. CPI adds $1.8M (15%), while Elec & Gas and Fuel each contribute $2.9M (25%). Renegotiate the staffing rate card before Q3 renewal to cap labour-linked increases.' },
  { id: 'atlas', name: 'IBM', region: 'Sweden', cats: ['tipping', 'cigpaper'], spend: 9.2,
    rec: 'Labour accounts for 30% of the index impact ($2.8M) with CPI at 25% ($2.3M) and Elec & Gas at 28% ($2.5M). Propose a fixed-fee engagement model to decouple from volatile Labour and energy indices — reduces forecast variance significantly.' },
  { id: 'helios', name: 'MSC Mediterranean Shipping', region: 'Italy', cats: ['energy'], spend: 5.1,
    rec: 'Elec & Gas is the dominant driver at 45% ($2.3M) followed by Fuel at 30% ($1.5M). Lock a 12-month fixed energy tariff to neutralise the largest exposure — current spot pricing adds unmitigated risk each quarter.' },
  { id: 'meridian', name: 'Manpower Group', region: 'Netherlands', cats: ['shipping'], spend: 4.6,
    rec: 'Fuel drives 45% of the cost impact ($2.1M) — the highest single-index concentration across all suppliers. CPI and Labour each add 20% ($0.9M). Consolidate to a managed logistics model with fuel surcharge caps to limit exposure.' },
  { id: 'bondwell', name: 'Dentsu', region: 'Belgium', cats: ['adhesive', 'plugwrap'], spend: 4.9,
    rec: 'Fuel exposure is 35% ($1.7M) with Labour at 28% ($1.4M) — together they drive 63% of the spend delta. Rebid creative services scope with output-based pricing that eliminates fuel pass-through and caps labour escalation at CPI.' },
];

// ---- Insight cards (accordion). Each can span multiple categories. Price-effect computed live. ----
export const INF_INSIGHTS = [
  { id: 'crude', catIds: ['acetate', 'adhesive', 'plugwrap'], tag: 'Labour inflation', tone: 'risk',
    headline: 'Labour inflation is the dominant driver across IT Services and Facility Management', body: 'White Collar Services and Blue Collar Staffing together account for 38% of the total net inflation at 23.3 M$. Labour index is rising at 7.23% in 2026 — the steepest of all tracked indices. Renegotiate rate cards with top staffing suppliers before Q3 commitment window to cap escalation.', metricLabel: 'labour share', metricVal: '47%' },
  { id: 'energy', catIds: ['energy'], tag: 'Energy & Utilities', tone: 'risk',
    headline: 'Electricity & Gas volatility creates the widest forecast uncertainty across Commercial Deployment', body: 'Elec & Gas index swings from 4.15% to 7.27% YoY, driving unpredictable cost exposure in facility-heavy categories. Lock fixed energy tariffs for 12 months to collapse the forecast range and remove spot-price risk from the budget.', metricLabel: 'forecast range', metricVal: '±3.1pp' },
  { id: 'paper', catIds: ['tipping', 'cigpaper'], tag: 'CPI pass-through', tone: 'watch',
    headline: 'CPI-linked contracts in Technology and Commercial Development reset within 6 weeks', body: 'CPI at 6.26% in 2026 feeds into 49% of category spend. Contractual pass-through resets are approaching — rebid now with fixed-fee or output-based models to decouple from volatile macro indices before the renewal window closes.', metricLabel: 'resets in', metricVal: '6 wks' },
  { id: 'shipping', catIds: ['shipping'], tag: 'Fuel & Logistics', tone: 'watch',
    headline: 'Fuel index at 8.32% is driving the entire Logistics cost increase — base rates are flat', body: 'Fuel accounts for 45% of Logistics category sensitivity. The underlying freight rates have not moved; the entire increase traces to fuel surcharges. Switch EU lanes to LNG-fleet carriers or negotiate fuel surcharge caps to cut exposure by a third.', metricLabel: 'fuel-linked', metricVal: '45%' },
  { id: 'packaging', catIds: ['packaging'], tag: 'Travel & Events', tone: 'good',
    headline: 'Travel & Internal Events category is tracking within expected range with high confidence', body: 'Blended index exposure is moderate and well-hedged. No intervention needed this period — maintain current supplier contracts through the next review cycle. Offset performance at 56% is on target.', metricLabel: 'confidence', metricVal: 'High' },
];

// ---- Suggested follow-up questions (partly view-aware) ----
export function INF_FOLLOWUPS(view, period) {
  const p = (period || 'month').toLowerCase();
  return [
    `Which suppliers in “${view.name}” should I renegotiate first this ${p}?`,
    `How much of the ${view.name} increase is crude versus PPI?`,
    `Model a hedge plan for acetate tow over the next two quarters.`,
    `What happens to ${view.name} landed cost if Brent rises another 10%?`,
    `When is the best time to switch the plug-wrap supplier?`,
  ];
}

// ============================================================
// Derive logic — turns (view, timeframe, timeValue) into figures
// ============================================================
export const INF_PERIOD_FACTOR = { Monthly: 1, Quarterly: 3, Yearly: 12 };
export const INF_PERIOD_NOUN = { Monthly: 'month', Quarterly: 'quarter', Yearly: 'year' };
export const INF_TIMEFRAMES = ['Monthly', 'Quarterly', 'Yearly'];
export const INF_TIME_OPTIONS = {
  Monthly: ['March 2026', 'April 2026', 'May 2026', 'June 2026'],
  Quarterly: ['Q3 2025', 'Q4 2025', 'Q1 2026', 'Q2 2026'],
  Yearly: ['2023', '2024', '2025', '2026'],
};
export const INF_TIME_DEFAULT = { Monthly: 'June 2026', Quarterly: 'Q2 2026', Yearly: '2026' };

function infHash(s) { let h = 0; for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
// deterministic ±amp jitter keyed on a seed string, so each (cat,timeValue) is stable but distinct
function infJitter(seed, amp) { return (((infHash(seed) % 1000) / 1000) - 0.5) * 2 * amp; }

export function infFmtM(v) { return '$' + v.toFixed(1) + 'M'; }
export function infFmtPct(v, sign = true) { return (sign && v > 0 ? '+' : '') + v.toFixed(1) + '%'; }
export function infFmtPctRange(lo, hi) { return '+' + lo.toFixed(1) + '% to +' + hi.toFixed(1) + '%'; }

export function deriveCategory(cat, timeframe, timeValue) {
  const f = INF_PERIOD_FACTOR[timeframe] || 1;
  const j = infJitter(cat.id + '|' + timeValue, 0.4);
  const impact = Math.max(0.4, cat.impact + j);
  const lo = Math.max(0.2, cat.rangeLo + j * 0.8);
  const hi = cat.rangeHi + j * 0.8;
  const spend = cat.spend * f;
  const added = spend * impact / 100;
  // per-index contribution to this category's added spend (€M)
  const byIndex = {};
  INF_INDICES.forEach((idx) => { byIndex[idx.id] = added * (cat.sens[idx.id] || 0); });
  return { cat, impact, lo, hi, conf: cat.conf, spend, added, byIndex };
}

export function deriveView(view, timeframe, timeValue) {
  const cats = view.cats.map((id) => deriveCategory(infCatById(id), timeframe, timeValue));
  const totalSpend = cats.reduce((s, c) => s + c.spend, 0);
  const totalAdded = cats.reduce((s, c) => s + c.added, 0);
  const overallPct = totalSpend ? (totalAdded / totalSpend) * 100 : 0;
  const byIndex = INF_INDICES.map((idx) => {
    const amt = cats.reduce((s, c) => s + c.byIndex[idx.id], 0);
    return { idx, amt, share: totalAdded ? amt / totalAdded : 0 };
  });
  const byCategory = cats
    .map((c) => ({ cat: c.cat, added: c.added, impact: c.impact, share: totalAdded ? c.added / totalAdded : 0 }))
    .sort((a, b) => b.added - a.added);
  // projected-cost trend over the period (for the hero area chart)
  const trend = infBuildSeries('view:' + (view.id || view.cats.join(',')) + '|' + timeValue, 28, 1.0 + overallPct / 8, 0.09);
  return { cats, totalSpend, totalAdded, overallPct, byIndex, byCategory, trend, period: INF_PERIOD_NOUN[timeframe] };
}

export function deriveSupplier(sup, timeframe, timeValue) {
  const f = INF_PERIOD_FACTOR[timeframe] || 1;
  const derived = sup.cats.map((id) => deriveCategory(infCatById(id), timeframe, timeValue));
  // spend-weighted blended impact across the supplier's categories
  const wsum = derived.reduce((s, d) => s + d.cat.spend, 0);
  const impact = derived.reduce((s, d) => s + d.impact * d.cat.spend, 0) / (wsum || 1);
  const base = sup.spend * f;
  const projected = base * (1 + impact / 100);
  const added = projected - base;
  // blended index sensitivity → split the added spend by index
  const blendSens = {};
  INF_INDICES.forEach((idx) => { blendSens[idx.id] = 0; });
  derived.forEach((d) => { INF_INDICES.forEach((idx) => { blendSens[idx.id] += (d.cat.sens[idx.id] || 0) * d.cat.spend; }); });
  INF_INDICES.forEach((idx) => { blendSens[idx.id] /= (wsum || 1); });
  const byIndex = INF_INDICES.map((idx) => ({ idx, amt: added * blendSens[idx.id] }));
  return { sup, base, projected, added, impact, byIndex, catNames: sup.cats.map((id) => infCatById(id).name) };
}

// confidence → numeric for bars / sorting
export const INF_CONF_PCT = { High: 86, Medium: 64, Low: 41 };

// ---- Net inflation by region ----
export const INF_REGIONS = [
  { id: 'eaa',           name: 'EAA & Duty Free',   netInf: 8,  offset: 11, conf: 'Low' },
  { id: 'europe',        name: 'Europe',            netInf: 17, offset: 60, conf: 'High' },
  { id: 'interregional', name: 'Interregional',     netInf: 6,  offset: 68, conf: 'High' },
  { id: 'lac',           name: 'LA&C',              netInf: 7,  offset: 22, conf: 'Low' },
  { id: 'ssea',          name: 'SSEA, CIS & MEA',   netInf: 13, offset: 59, conf: 'Medium' },
  { id: 'usa',           name: 'USA',               netInf: 2,  offset: 60, conf: 'Medium' },
];

export const INF_COUNTRIES = [
  { id: 'albania',    name: 'Albania',               netInf: 0,  offset: null, conf: 'Low' },
  { id: 'algeria',    name: 'Algeria',               netInf: 0,  offset: null, conf: 'Low' },
  { id: 'argentina',  name: 'Argentina',             netInf: 0,  offset: null, conf: 'Low' },
  { id: 'armenia',    name: 'Armenia',               netInf: 0,  offset: 100, conf: 'High' },
  { id: 'australia',  name: 'Australia',             netInf: 0,  offset: null, conf: 'Low' },
  { id: 'austria',    name: 'Austria',               netInf: 1,  offset: null, conf: 'Low' },
  { id: 'bangladesh', name: 'Bangladesh',            netInf: 0,  offset: 100, conf: 'High' },
  { id: 'belgium',    name: 'Belgium',               netInf: 0,  offset: null, conf: 'Low' },
  { id: 'bosnia',     name: 'Bosnia and Herzegovina',netInf: 0,  offset: null, conf: 'Low' },
  { id: 'brasil',     name: 'Brasil',                netInf: 0,  offset: null, conf: 'Low' },
  { id: 'bulgaria',   name: 'Bulgaria',              netInf: 0,  offset: 100, conf: 'High' },
  { id: 'canada',     name: 'Canada',                netInf: 1,  offset: 50,  conf: 'Medium' },
  { id: 'chile',      name: 'Chile',                 netInf: 0,  offset: null, conf: 'Low' },
  { id: 'china',      name: 'China',                 netInf: 0,  offset: null, conf: 'Low' },
  { id: 'colombia',   name: 'Colombia',              netInf: 1,  offset: 50,  conf: 'Medium' },
  { id: 'costarica',  name: 'Costa Rica',            netInf: 0,  offset: null, conf: 'Low' },
  { id: 'croatia',    name: 'Croatia',               netInf: 1,  offset: 0,   conf: 'Low' },
  { id: 'cyprus',     name: 'Cyprus',                netInf: 0,  offset: null, conf: 'Low' },
];

// ---- Net inflation by category (L2 / L3) ----
export const INF_CAT_L3 = [
  { id: 'commercial_deploy', name: 'Commercial Deployment',        netInf: 13, offset: 63,   conf: 'High' },
  { id: 'facility',          name: 'Facility Services & Supplies', netInf: 19, offset: 17,   conf: 'Low' },
  { id: 'technology',        name: 'Technology',                   netInf: 5,  offset: 75,   conf: 'High' },
  { id: 'logistics',         name: 'Logistics',                    netInf: -1, offset: 83,   conf: 'High' },
  { id: 'commercial_dev',    name: 'Commercial Development',       netInf: 2,  offset: 85,   conf: 'High' },
  { id: 'corporate_comm',    name: 'Corporate Communication',      netInf: 1,  offset: 91,   conf: 'High' },
  { id: 'travel',            name: 'Travel & Internal Events',     netInf: 3,  offset: 57,   conf: 'Medium' },
  { id: 'total_rewards',     name: 'Total Rewards',                netInf: 0,  offset: 100,  conf: 'High' },
  { id: 'fleet',             name: 'Fleet',                        netInf: -1, offset: 200,  conf: 'High' },
  { id: 'bps',               name: 'Business Professional Services', netInf: 5, offset: 17,  conf: 'Low' },
  { id: 'contractors',       name: 'Contractors',                  netInf: 5,  offset: 1,    conf: 'Low' },
  { id: 'talent',            name: 'Talent',                       netInf: 2,  offset: -100, conf: 'Low' },
];

export const INF_CAT_L4 = [
  { id: '4pl',              name: '4PL Services',                      netInf: 0,  offset: null, conf: 'Low' },
  { id: 'accommodation',    name: 'Accommodation',                     netInf: 1,  offset: 0,    conf: 'Low' },
  { id: 'airfare',          name: 'Airfare',                           netInf: -1, offset: null, conf: 'Low' },
  { id: 'airfreight',       name: 'Airfreight',                        netInf: 0,  offset: 100,  conf: 'High' },
  { id: 'automation',       name: 'Automation',                        netInf: 0,  offset: null, conf: 'Low' },
  { id: 'building_equip',   name: 'Building Equipment',                netInf: 0,  offset: 100,  conf: 'High' },
  { id: 'cc_packaging',     name: 'CC Packaging Design',               netInf: 0,  offset: null, conf: 'Low' },
  { id: 'construction',     name: 'Construction',                      netInf: 0,  offset: 100,  conf: 'High' },
  { id: 'consultants',      name: 'Consultants',                       netInf: 3,  offset: 0,    conf: 'Low' },
  { id: 'consumer_engage',  name: 'Consumer and Customer Engagement',  netInf: 0,  offset: 100,  conf: 'High' },
  { id: 'creative_agency',  name: 'Creative Agency Fees & Expenses',   netInf: 0,  offset: 100,  conf: 'High' },
  { id: 'creative_master',  name: 'Creative Master Production',        netInf: 0,  offset: 100,  conf: 'High' },
  { id: 'custom_brokerage', name: 'Custom Brokerage Fees',             netInf: 0,  offset: null, conf: 'Low' },
];

// ---- period comparison: this period vs last period vs a year ago ----
const INF_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function infShiftLabel(timeframe, timeValue, dPeriods, dYears) {
  if (!timeValue) return '';
  if (timeframe === 'Monthly') {
    const parts = timeValue.split(' '); let mi = INF_MONTHS.indexOf(parts[0]); let yr = parseInt(parts[1], 10);
    mi -= dPeriods; yr -= dYears; while (mi < 0) { mi += 12; yr -= 1; }
    return INF_MONTHS[mi] + ' ' + yr;
  }
  if (timeframe === 'Quarterly') {
    const parts = timeValue.split(' '); let qi = parseInt(parts[0].slice(1), 10); let yr = parseInt(parts[1], 10);
    qi -= dPeriods; yr -= dYears; while (qi < 1) { qi += 4; yr -= 1; }
    return 'Q' + qi + ' ' + yr;
  }
  return String(parseInt(timeValue || '2026', 10) - dPeriods - dYears);
}

export function deriveCompare(view, timeframe, timeValue) {
  const d = deriveView(view, timeframe, timeValue);
  const base = d.totalSpend;
  const noun = INF_PERIOD_NOUN[timeframe];
  let labels;
  if (timeframe === 'Yearly') {
    const y = parseInt(timeValue || '2026', 10);
    labels = { cur: String(y), prev: String(y - 1), yago: String(y - 2) };
  } else {
    labels = { cur: timeValue || '', prev: infShiftLabel(timeframe, timeValue, 1, 0), yago: infShiftLabel(timeframe, timeValue, 0, 1) };
  }
  const curPct = d.overallPct;
  const prevPct = Math.max(0.2, curPct * (0.74 + infJitter('prev|' + (view.id || '') + timeValue, 0.06)));
  const yagoPct = Math.max(0.1, curPct * (0.45 + infJitter('yago|' + (view.id || '') + timeValue, 0.06)));
  const mk = (pct, label, when) => ({ label: label || ('This ' + noun), when, pct, added: base * pct / 100, spend: base + base * pct / 100 });
  return {
    base, noun,
    cur:  mk(curPct,  labels.cur,  'this ' + noun),
    prev: mk(prevPct, labels.prev, 'last ' + noun),
    yago: mk(yagoPct, labels.yago, 'a year ago'),
  };
}
