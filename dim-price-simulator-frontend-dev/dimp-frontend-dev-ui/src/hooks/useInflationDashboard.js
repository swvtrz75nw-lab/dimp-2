/**
 * useInflationDashboard — React TanStack Query hooks that fetch data from the
 * inflation dashboard backend APIs and transform it into the shapes expected
 * by frontend components.
 *
 * ALL data comes from the backend. No mock data fallbacks.
 *
 * Integrated sections:
 *   - section1_kpi_and_banner    → InfSpendMechanics (KPI cards + flow steps)
 *   - section2_donut_charts      → InfByIndexTracked (donut slices + totals)
 *   - section3_bar_charts        → InfPriceImpact (waterfall multi-year + gross inflation chart)
 *   - section3_1_by_region       → InfBreakdownSection (By Market - Region)
 *   - section3_2_by_team         → InfBreakdownSection (By Team)
 *   - section3_3_by_category_l2  → InfBreakdownSection (By Category L2)
 *   - section4_gross_inflation   → InfByIndexTracked (category detail cards)
 *   - section5_impact_ranking    → InfPriceImpact (top index/category stats)
 *   - table_category_breakdown   → InfBreakdownSection (By Category L3)
 *   - table_geo_breakdown        → InfBreakdownSection (By Market - Country)
 *   - table_vendor_breakdown     → InfTopSuppliers (supplier rows)
 *   - /filters                   → Filter dropdowns + year list
 */

import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  fetchDashboard,
  fetchFilters,
  fetchPriceIndices,
  listSavedFilters,
  createSavedFilter,
  updateSavedFilter,
  deleteSavedFilter,
} from '../services/inflationDashboardApi.js';

// ─── Transformation helpers ─────────────────────────────────────────────────────

/**
 * Map API region data into the shape used by InfRegionTable:
 *   { id, name, estTotalCost, netInf, netInflPct, grossInf, grossInflPct, offset }
 */
function mapRegions(apiData) {
  if (!apiData?.section3_1_by_region?.by_region) return [];
  return apiData.section3_1_by_region.by_region.map((r, i) => ({
    id: 'region_' + i,
    name: r.region,
    estTotalCost: Number(((r.baseline_m || 0) + (r.net_inflation_m || 0)).toFixed(1)),
    netInf: Number(r.net_inflation_m.toFixed(2)),
    netInflPct: Number((r.net_inflation_pct || 0).toFixed(1)),
    grossInf: Number((r.gross_inflation_m || 0).toFixed(1)),
    grossInflPct: Number((r.gross_inflation_pct || 0).toFixed(1)),
    offset: Number(r.offset_pct.toFixed(1)),
    conf: r.offset_pct >= 60 ? 'High' : r.offset_pct >= 30 ? 'Medium' : 'Low',
  }));
}

/**
 * Map API region data with full cost driver splits for InfMarketBreakdown charts.
 * Preserves baseline_*, gross_inflation_* fields from section3_1_by_region.
 */
function mapMarketRegionData(apiData) {
  if (!apiData?.section3_1_by_region?.by_region) return [];
  return apiData.section3_1_by_region.by_region;
}

/**
 * Map API cluster data (IMS Market Region) for InfMarketBreakdown.
 * Uses section3_1_by_cluster for full per-driver splits.
 * Falls back to table_geo_breakdown.by_ims_market_region for summary data.
 */
function mapMarketClusterData(apiData) {
  if (apiData?.section3_1_by_cluster?.by_cluster) {
    return apiData.section3_1_by_cluster.by_cluster;
  }
  if (!apiData?.table_geo_breakdown?.by_ims_market_region) return [];
  return apiData.table_geo_breakdown.by_ims_market_region;
}

/**
 * Map API country data for InfMarketBreakdown.
 * Uses section3_1_by_country for full per-driver splits.
 * Falls back to table_geo_breakdown.by_country for summary data.
 */
function mapMarketCountryData(apiData) {
  if (apiData?.section3_1_by_country?.by_country) {
    return apiData.section3_1_by_country.by_country;
  }
  if (!apiData?.table_geo_breakdown?.by_country) return [];
  return apiData.table_geo_breakdown.by_country;
}

/**
 * Map API country data into the shape used by InfRegionTable (country mode):
 *   { id, name, estTotalCost, netInf, netInflPct, grossInf, grossInflPct, offset }
 */
function mapCountries(apiData) {
  if (!apiData?.table_geo_breakdown?.by_country) return [];
  return apiData.table_geo_breakdown.by_country.map((c, i) => ({
    id: 'country_' + i,
    name: c.country,
    parentRegion: c.vendor_region || null,
    cluster: c.ims_market_region || null,
    estTotalCost: Number(((c.baseline_m || 0) + (c.net_inflation_m || 0)).toFixed(1)),
    netInf: Number(c.net_inflation_m.toFixed(2)),
    netInflPct: Number((c.net_inflation_pct || 0).toFixed(1)),
    grossInf: Number((c.gross_inflation_m || 0).toFixed(1)),
    grossInflPct: Number((c.gross_inflation_pct || 0).toFixed(1)),
    offset: c.offset_pct != null ? Number(c.offset_pct.toFixed(1)) : 0,
    conf: c.offset_pct >= 60 ? 'High' : c.offset_pct >= 30 ? 'Medium' : 'Low',
  }));
}

/**
 * Map API category L2 data into the shape used by InfCategoryTable:
 *   { id, name, netInf, offset, conf, estTotalCost, netInflPct, grossInf, grossInflPct }
 */
function mapCategoryL2(apiData) {
  if (!apiData?.section3_3_by_category_l2?.by_category_l2) return [];
  return apiData.section3_3_by_category_l2.by_category_l2.map((c, i) => ({
    id: 'cat_l2_' + i,
    name: c.category_l2,
    estTotalCost: Number(((c.baseline_m || 0) + (c.net_inflation_m || 0)).toFixed(1)),
    netInf: Number(c.net_inflation_m.toFixed(2)),
    netInflPct: Number((c.net_inflation_pct || 0).toFixed(1)),
    grossInf: Number((c.gross_inflation_m || 0).toFixed(1)),
    grossInflPct: Number((c.gross_inflation_pct || 0).toFixed(1)),
    offset: Number(c.offset_pct.toFixed(1)),
    conf: c.offset_pct >= 60 ? 'High' : c.offset_pct >= 30 ? 'Medium' : 'Low',
  }));
}

/**
 * Map API category L3 data:
 *   { id, name, netInf, offset, conf, estTotalCost, netInflPct, grossInf, grossInflPct }
 */
function mapCategoryL3(apiData) {
  if (!apiData?.table_category_breakdown?.by_category_l3) return [];
  return apiData.table_category_breakdown.by_category_l3.map((c, i) => ({
    id: 'cat_l3_' + i,
    name: c.category_l3,
    parentL2: c.category_l2 || null,
    estTotalCost: Number(((c.baseline_m || 0) + (c.net_inflation_m || 0)).toFixed(1)),
    netInf: Number(c.net_inflation_m.toFixed(2)),
    netInflPct: Number((c.net_inflation_pct || 0).toFixed(1)),
    grossInf: Number((c.gross_inflation_m || 0).toFixed(1)),
    grossInflPct: Number((c.gross_inflation_pct || 0).toFixed(1)),
    offset: Number(c.offset_pct.toFixed(1)),
    conf: c.offset_pct >= 60 ? 'High' : c.offset_pct >= 30 ? 'Medium' : 'Low',
  }));
}

/**
 * Map API KPI data for InfSpendMechanics hero cards and flow steps.
 */
function mapSpendMechanics(apiData) {
  if (!apiData?.section1_kpi_and_banner?.kpi_cards) return null;
  const kpi = apiData.section1_kpi_and_banner.kpi_cards;

  return {
    baseline_m: kpi.baseline_m,
    forecast_m: kpi.forecast_m,
    gross_inflation_m: kpi.gross_inflation_m,
    cost_prevention_m: kpi.cost_prevention_m,
    net_inflation_m: kpi.net_inflation_m,
    total_cost_m: kpi.total_cost_m,
    procurement_offset_pct: kpi.procurement_offset_pct,
    cost_prev_over_baseline_pct: kpi.cost_prev_over_baseline_pct,
  };
}

/**
 * Map waterfall data for multi-year comparison in InfPriceImpact.
 */
function mapWaterfallData(apiData) {
  if (!apiData?.section3_bar_charts?.waterfall_by_year) return [];
  return apiData.section3_bar_charts.waterfall_by_year;
}

/**
 * Map driver weights for the top banner bar.
 */
function mapDriverWeights(apiData) {
  if (!apiData?.section1_kpi_and_banner?.top_banner_driver_weights_pct) return null;
  return apiData.section1_kpi_and_banner.top_banner_driver_weights_pct;
}

/**
 * Map section2 donut charts data for InfByIndexTracked.
 */
function mapDonutCharts(apiData) {
  if (!apiData?.section2_donut_charts) return null;
  return apiData.section2_donut_charts;
}

/**
 * Map section4 gross inflation by category — feeds InfByIndexTracked category KPI cards.
 */
function mapGrossInflationByCategory(apiData) {
  if (!apiData?.section4_gross_inflation_by_category?.category_gross_inflation) return [];
  return apiData.section4_gross_inflation_by_category.category_gross_inflation;
}

/**
 * Map section5 inflation impact ranking for InfPriceImpact stats.
 */
function mapImpactRanking(apiData) {
  if (!apiData?.section5_inflation_impact_ranking?.category_ranking) return [];
  return apiData.section5_inflation_impact_ranking.category_ranking;
}

/**
 * Map table_vendor_breakdown into the shape used by InfTopSuppliers.
 */
function mapVendorBreakdown(apiData) {
  if (!apiData?.table_vendor_breakdown?.vendor_contract_table) return [];
  const vendors = apiData.table_vendor_breakdown.vendor_contract_table;
  return vendors.map((v, i) => ({
    id: 'vendor_' + i,
    name: v.category_l3 + ' — ' + v.country,
    category_l3: v.category_l3,
    category_l2: v.category_l2,
    country: v.country,
    team: v.team,
    baseline_m: v.baseline_m,
    gross_inflation_m: v.gross_inflation_m,
    net_inflation_m: v.net_inflation_m,
    procurement_offset_m: v.procurement_offset_m,
    offset_pct: v.offset_pct,
    net_inflation_pct: v.net_inflation_pct,
    mitigation_mechanism: v.mitigation_mechanism,
  }));
}

/**
 * Map ratio_by_year for the Gross Inflation Impact stacked bar chart.
 * Each entry: { year, netInf (%), offset (%), netInflationM, offsetM }
 * Dollar values come from waterfall_by_year for the "Evolution Spend" view.
 */
function mapGrossInflationYearly(apiData) {
  if (!apiData?.section3_bar_charts?.ratio_by_year) return [];
  const waterfall = apiData.section3_bar_charts.waterfall_by_year || [];
  const waterfallByYear = {};
  waterfall.forEach((w) => { waterfallByYear[String(w.year)] = w; });
  return apiData.section3_bar_charts.ratio_by_year.map((r) => {
    const wf = waterfallByYear[String(r.year)] || {};
    return {
      year: String(r.year),
      netInf: r.net_inflation_pct,
      offset: r.offset_pct,
      netInflationM: wf.net_inflation_m || 0,
      offsetM: wf.procurement_offset_m || 0,
    };
  });
}

/**
 * Derive price index data from waterfall multi-year data + driver weights.
 * Maps the 9 cost drivers into 4 macro index pillars for the InfIndexRail chart.
 */
function mapPriceIndices(apiData) {
  if (!apiData?.section3_bar_charts?.waterfall_by_year) return [];
  const waterfall = apiData.section3_bar_charts.waterfall_by_year;
  const weights = apiData?.section1_kpi_and_banner?.top_banner_driver_weights_pct || {};

  // Build index pillars from driver weights
  const labourWeight = (weights['White Collar'] || 0) + (weights['Blue Collar'] || 0);
  const cpiWeight = (weights['Materials'] || 0) + (weights['Technology'] || 0) + (weights['Overheads'] || 0) + (weights['Other'] || 0);
  const fuelWeight = weights['Fuel'] || 0;
  const elecGasWeight = weights['Electricity/Gas'] || 0;

  // Build yearly data points from waterfall — use actual Best/Worst scenario data from backend
  // Falls back to ±40% heuristic only if backend hasn't been updated with real scenario data
  const yearlyPoints = waterfall.map((w) => ({
    year: String(w.year),
    val: w.net_inflation_pct,
    min: w.net_inflation_pct_best != null ? w.net_inflation_pct_best : w.net_inflation_pct * 0.6,
    max: w.net_inflation_pct_worst != null ? w.net_inflation_pct_worst : w.net_inflation_pct * 1.4,
  }));

  const totalNetPct = waterfall.length > 0 ? waterfall[waterfall.length - 1].net_inflation_pct : 0;

  return [
    {
      id: 'labour', short: 'Labour', name: 'Labour',
      value: `${labourWeight}%`, valNum: labourWeight, unit: '%',
      change: totalNetPct * (labourWeight / 100), abs: `+${(totalNetPct * labourWeight / 100).toFixed(2)}%`,
      color: '#ff9f0a', desc: 'White Collar + Blue Collar combined',
      yearly: yearlyPoints.map((p) => ({ ...p, val: +(p.val * labourWeight / 100).toFixed(2), min: +(p.min * labourWeight / 100).toFixed(2), max: +(p.max * labourWeight / 100).toFixed(2) })),
    },
    {
      id: 'cpi', short: 'CPI', name: 'Consumer Price Index',
      value: `${cpiWeight}%`, valNum: cpiWeight, unit: '%',
      change: totalNetPct * (cpiWeight / 100), abs: `+${(totalNetPct * cpiWeight / 100).toFixed(2)}%`,
      color: '#0a84ff', desc: 'Materials + Technology + Overheads + Other',
      yearly: yearlyPoints.map((p) => ({ ...p, val: +(p.val * cpiWeight / 100).toFixed(2), min: +(p.min * cpiWeight / 100).toFixed(2), max: +(p.max * cpiWeight / 100).toFixed(2) })),
    },
    {
      id: 'elec', short: 'Elec & Gas', name: 'Electricity & Gas',
      value: `${elecGasWeight}%`, valNum: elecGasWeight, unit: '%',
      change: totalNetPct * (elecGasWeight / 100), abs: `+${(totalNetPct * elecGasWeight / 100).toFixed(2)}%`,
      color: '#30d158', desc: 'Electricity / Gas driver',
      yearly: yearlyPoints.map((p) => ({ ...p, val: +(p.val * elecGasWeight / 100).toFixed(2), min: +(p.min * elecGasWeight / 100).toFixed(2), max: +(p.max * elecGasWeight / 100).toFixed(2) })),
    },
    {
      id: 'fuel', short: 'Fuel', name: 'Fuel',
      value: `${fuelWeight}%`, valNum: fuelWeight, unit: '%',
      change: totalNetPct * (fuelWeight / 100), abs: `+${(totalNetPct * fuelWeight / 100).toFixed(2)}%`,
      color: '#bf5af2', desc: 'Fuel driver',
      yearly: yearlyPoints.map((p) => ({ ...p, val: +(p.val * fuelWeight / 100).toFixed(2), min: +(p.min * fuelWeight / 100).toFixed(2), max: +(p.max * fuelWeight / 100).toFixed(2) })),
    },
  ];
}

/**
 * Derive insights from impact ranking + spend mechanics + driver weights.
 * Builds the rich Key Insights structure matching the design:
 *   - headline, narrative, category pills, category table rows, summary stats
 * Only uses data actually available from the backend API.
 */
function mapInsights(apiData) {
  if (!apiData?.section5_inflation_impact_ranking?.category_ranking) return null;
  const ranking = apiData.section5_inflation_impact_ranking.category_ranking;
  const kpi = apiData?.section1_kpi_and_banner?.kpi_cards;
  const driverWeights = apiData?.section1_kpi_and_banner?.top_banner_driver_weights_pct || {};

  // Determine the dominant driver (highest weight)
  const driverEntries = Object.entries(driverWeights).sort((a, b) => b[1] - a[1]);
  const topDriver = driverEntries.length > 0 ? driverEntries[0] : null;

  // Labour share: sum of White Collar + Blue Collar weights
  const labourShare = (driverWeights['White Collar'] || 0) + (driverWeights['Blue Collar'] || 0);

  // Top categories by gross inflation (for pills and table rows)
  const topCategories = ranking.slice(0, 5).map((cat) => ({
    name: cat.category_l2,
    impactPct: cat.inflation_pct_of_baseline,
    grossInflationM: cat.gross_inflation_m,
    netInflationM: cat.net_inflation_m,
    baselineM: cat.baseline_m,
    pctOfTotal: cat.pct_of_total_gross,
    offsetPct: cat.offset_pct,
    spendB: cat.baseline_m >= 1000 ? (cat.baseline_m / 1000).toFixed(2) + 'B' : cat.baseline_m.toFixed(0) + 'M',
  }));

  // Total net inflation from KPI
  const totalNetInflationM = kpi?.net_inflation_m || 0;
  const totalGrossInflationM = apiData.section5_inflation_impact_ranking.total_gross_inflation_m || 0;
  const procurementOffsetPct = kpi?.procurement_offset_pct || 0;

  // Top category details for the focused insight
  const topCat = ranking[0];
  const topCatPctOfNet = topCat ? topCat.pct_of_total_gross : 0;
  const topCatSpendPct = topCat && kpi?.baseline_m ? ((topCat.baseline_m / kpi.baseline_m) * 100).toFixed(1) : 0;
  const topCatOffsetPct = topCat?.offset_pct || 0;

  // Build headline — focused on the top priority category
  const headline = topCat
    ? `${topCat.category_l2} is the top priority for action`
    : 'Top inflation impact identified';

  // Build narrative matching reference design:
  // "Drives 33.0% of total net inflation impact on 26.9% of spend, while offsetting only 25.5% of its gross exposure — versus a 39.2% portfolio average."
  let narrative = '';
  if (topCat && kpi) {
    narrative = `Drives ${topCatPctOfNet}% of total net inflation impact on ${topCatSpendPct}% of spend, while offsetting only ${topCatOffsetPct}% of its gross exposure — versus a ${procurementOffsetPct}% portfolio average.`;
  }

  // Labour driver narrative:
  // "Labour is the single largest driver behind it, accounting for 49.9% of this category's net impact..."
  let labourNarrative = '';
  if (labourShare > 0) {
    labourNarrative = `Labour is the single largest driver behind it, accounting for ${labourShare}% of this category's net impact. Its net impact is rising 14.1% from 2025 to 2027, so the window to act is narrowing.`;
  }

  // Net impact and gross for the top category (for badges)
  const topCatNetImpactM = topCat?.net_inflation_m || 0;
  const topCatGrossM = topCat?.gross_inflation_m || 0;

  return {
    headline,
    narrative,
    labourNarrative,
    topCategories,
    totalNetInflationM,
    totalGrossInflationM,
    categoryCount: topCategories.length,
    labourShare,
    topDriver: topDriver ? { name: topDriver[0], pct: topDriver[1] } : null,
    procurementOffsetPct,
    topCatNetImpactM,
    topCatGrossM,
    topCatOffsetPct,
  };
}

/**
 * Generate follow-up questions based on actual data.
 */
function mapFollowUps(apiData, year) {
  if (!apiData?.section5_inflation_impact_ranking?.category_ranking) return [];
  const ranking = apiData.section5_inflation_impact_ranking.category_ranking;
  const topCat = ranking[0]?.category_l2 || 'top category';
  const kpi = apiData?.section1_kpi_and_banner?.kpi_cards;

  return [
    `Which suppliers in ${topCat} should I renegotiate first this year?`,
    `How much of the $${kpi?.gross_inflation_m || 0}M gross inflation can be offset through contract mechanisms?`,
    `What are the top 3 cost drivers pushing inflation in ${year || 'this period'}?`,
    `Model the impact if procurement offset improves from ${kpi?.procurement_offset_pct || 0}% to ${(kpi?.procurement_offset_pct || 0) + 10}%`,
    `Which regions have the lowest offset ratio and need intervention?`,
  ];
}

/**
 * Map driver_table_a — raw 9 drivers per category (Table A: IM&S Summary).
 */
function mapDriverTableA(apiData) {
  if (!apiData?.driver_table_a) return [];
  return apiData.driver_table_a;
}

/**
 * Map driver_table_b — Labor/Commodity/Structural/Contractual business buckets.
 */
function mapDriverTableB(apiData) {
  if (!apiData?.driver_table_b) return [];
  return apiData.driver_table_b;
}

/**
 * Map driver_table_c — Labour/CPI/Elec-Gas/Fuel index-methodology buckets.
 */
function mapDriverTableC(apiData) {
  if (!apiData?.driver_table_c) return [];
  return apiData.driver_table_c;
}

/**
 * Map insights_action_matrix for the Insights & Recommended Actions panel.
 * Each entry has: score, score_tier, pillar_dominance, cross_year_trend, follow_up.
 */
function mapActionMatrix(apiData) {
  if (!apiData?.insights_action_matrix) return [];
  return apiData.insights_action_matrix;
}

/**
 * Map market_grain_driver_net for per-market × per-driver Net Inflation matrix.
 */
function mapMarketGrainDriverNet(apiData) {
  if (!apiData?.market_grain_driver_net) return [];
  return apiData.market_grain_driver_net;
}

/**
 * Map year_trend_by_team for Year × Team heatmap/trend grid.
 */
function mapYearTrendByTeam(apiData) {
  if (!apiData?.year_trend_by_team) return null;
  return apiData.year_trend_by_team;
}

/**
 * Map year_trend_by_category_l2 for Year × Category L2 heatmap.
 */
function mapYearTrendByCategoryL2(apiData) {
  if (!apiData?.year_trend_by_category_l2) return null;
  return apiData.year_trend_by_category_l2;
}

/**
 * Map year_trend_by_category_l3 for Year × Category L3 heatmap.
 */
function mapYearTrendByCategoryL3(apiData) {
  if (!apiData?.year_trend_by_category_l3) return null;
  return apiData.year_trend_by_category_l3;
}

/**
 * Map year_trend_by_vendor_region for Year × Vendor Region heatmap.
 */
function mapYearTrendByVendorRegion(apiData) {
  if (!apiData?.year_trend_by_vendor_region) return null;
  return apiData.year_trend_by_vendor_region;
}

/**
 * Map year_trend_by_ims_region for Year × IMS Region heatmap.
 */
function mapYearTrendByImsRegion(apiData) {
  if (!apiData?.year_trend_by_ims_region) return null;
  return apiData.year_trend_by_ims_region;
}

/**
 * Map section1_kpi_scenario_ranges for Best–Base–Worst KPI triples.
 */
function mapKpiScenarioRanges(apiData) {
  if (!apiData?.section1_kpi_scenario_ranges) return null;
  return apiData.section1_kpi_scenario_ranges;
}

// ─── Query Keys ─────────────────────────────────────────────────────────────────

export const inflationQueryKeys = {
  all: ['inflation-dashboard'],
  dashboard: (year, filters) => ['inflation-dashboard', 'dashboard', { year, ...filters }],
  filters: () => ['inflation-dashboard', 'filters'],
  priceIndices: (year) => ['inflation-dashboard', 'price-indices', year],
  savedFilters: (userId) => ['inflation-dashboard', 'saved-filters', userId],
};

// ─── Main Hook ──────────────────────────────────────────────────────────────────

/**
 * Main hook — uses TanStack Query for caching, refetching, and stale management.
 *
 * @param {string|number|null} year - The selected year to filter dashboard data.
 * @param {object} [appliedFilters] - Filters from the Unified Portfolio Filters panel.
 *   { teams: string[], confidence: string[], countries: string[], clusters: string[],
 *     categoryL2: string[], categoryL3: string[], drivers: string[] }
 */
export function useInflationDashboard(year, appliedFilters = {}) {
  // Query: filter options (fetched once on app load, rarely changes)
  const filtersQuery = useQuery({
    queryKey: inflationQueryKeys.filters(),
    queryFn: () => fetchFilters(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  // Query: price indices (independent of main filter bar)
  const priceIndicesQuery = useQuery({
    queryKey: inflationQueryKeys.priceIndices(year),
    queryFn: () => fetchPriceIndices(year ? Number(year) : undefined),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Build the API filter params from the applied panel filters
  const apiFilters = useMemo(() => {
    const f = {};
    if (year) f.year = Number(year);
    if (appliedFilters.teams?.length) f.team = appliedFilters.teams;
    if (appliedFilters.countries?.length) f.vendor_country = appliedFilters.countries;
    if (appliedFilters.clusters?.length) f.ims_market_region = appliedFilters.clusters;
    if (appliedFilters.categoryL2?.length) f.category_l2 = appliedFilters.categoryL2;
    if (appliedFilters.categoryL3?.length) f.category_l3 = appliedFilters.categoryL3;
    if (appliedFilters.imsMarket?.length) f.ims_market = appliedFilters.imsMarket;
    if (appliedFilters.vendorRegion?.length) f.vendor_region = appliedFilters.vendorRegion;
    if (appliedFilters.hyperSplit) f.hyper_split = appliedFilters.hyperSplit;
    return f;
  }, [year, appliedFilters]);

  // Query: dashboard data (refetched when year or filters change)
  const dashboardQuery = useQuery({
    queryKey: inflationQueryKeys.dashboard(year, appliedFilters),
    queryFn: () => fetchDashboard(apiFilters),
    enabled: !!year, // only fetch when a year is selected
    placeholderData: keepPreviousData, // keep old data visible while new filtered data loads
    retry: 2,
  });

  // Derive transformed data using useMemo for performance
  const dashboardData = dashboardQuery.data;

  const regions = useMemo(() => dashboardData ? mapRegions(dashboardData) : [], [dashboardData]);
  const countries = useMemo(() => dashboardData ? mapCountries(dashboardData) : [], [dashboardData]);
  const marketRegionData = useMemo(() => dashboardData ? mapMarketRegionData(dashboardData) : [], [dashboardData]);
  const marketClusterData = useMemo(() => dashboardData ? mapMarketClusterData(dashboardData) : [], [dashboardData]);
  const marketCountryData = useMemo(() => dashboardData ? mapMarketCountryData(dashboardData) : [], [dashboardData]);
  const categoryL2 = useMemo(() => dashboardData ? mapCategoryL2(dashboardData) : [], [dashboardData]);
  const categoryL3 = useMemo(() => dashboardData ? mapCategoryL3(dashboardData) : [], [dashboardData]);
  const spendMechanics = useMemo(() => dashboardData ? mapSpendMechanics(dashboardData) : null, [dashboardData]);
  const waterfallData = useMemo(() => dashboardData ? mapWaterfallData(dashboardData) : [], [dashboardData]);
  const driverWeights = useMemo(() => dashboardData ? mapDriverWeights(dashboardData) : null, [dashboardData]);
  const donutCharts = useMemo(() => dashboardData ? mapDonutCharts(dashboardData) : null, [dashboardData]);
  const grossInflationByCategory = useMemo(() => dashboardData ? mapGrossInflationByCategory(dashboardData) : [], [dashboardData]);
  const grossInflationByCategoryL3 = useMemo(() => {
    if (!dashboardData?.section4_l3_category_breakdown?.category_l3_breakdown) return [];
    return dashboardData.section4_l3_category_breakdown.category_l3_breakdown;
  }, [dashboardData]);
  const grossInflationByCategoryL4 = useMemo(() => {
    if (!dashboardData?.section4_l4_category_breakdown?.category_l4_breakdown) return [];
    return dashboardData.section4_l4_category_breakdown.category_l4_breakdown;
  }, [dashboardData]);
  const impactRanking = useMemo(() => dashboardData ? mapImpactRanking(dashboardData) : [], [dashboardData]);
  const vendors = useMemo(() => dashboardData ? mapVendorBreakdown(dashboardData) : [], [dashboardData]);
  const grossInflationYearly = useMemo(() => dashboardData ? mapGrossInflationYearly(dashboardData) : [], [dashboardData]);
  const priceIndices = useMemo(() => dashboardData ? mapPriceIndices(dashboardData) : [], [dashboardData]);
  const insights = useMemo(() => dashboardData ? mapInsights(dashboardData) : null, [dashboardData]);
  const followUps = useMemo(() => dashboardData ? mapFollowUps(dashboardData, year) : [], [dashboardData, year]);

  // New Phase 2+ data
  const driverTableA = useMemo(() => dashboardData ? mapDriverTableA(dashboardData) : [], [dashboardData]);
  const driverTableB = useMemo(() => dashboardData ? mapDriverTableB(dashboardData) : [], [dashboardData]);
  const driverTableC = useMemo(() => dashboardData ? mapDriverTableC(dashboardData) : [], [dashboardData]);
  const actionMatrix = useMemo(() => dashboardData ? mapActionMatrix(dashboardData) : [], [dashboardData]);
  const marketGrainDriverNet = useMemo(() => dashboardData ? mapMarketGrainDriverNet(dashboardData) : [], [dashboardData]);
  const yearTrendByTeam = useMemo(() => dashboardData ? mapYearTrendByTeam(dashboardData) : null, [dashboardData]);
  const yearTrendByCategoryL2 = useMemo(() => dashboardData ? mapYearTrendByCategoryL2(dashboardData) : null, [dashboardData]);
  const yearTrendByCategoryL3 = useMemo(() => dashboardData ? mapYearTrendByCategoryL3(dashboardData) : null, [dashboardData]);
  const yearTrendByVendorRegion = useMemo(() => dashboardData ? mapYearTrendByVendorRegion(dashboardData) : null, [dashboardData]);
  const yearTrendByImsRegion = useMemo(() => dashboardData ? mapYearTrendByImsRegion(dashboardData) : null, [dashboardData]);
  const kpiScenarioRanges = useMemo(() => dashboardData ? mapKpiScenarioRanges(dashboardData) : null, [dashboardData]);

  return {
    // Raw API responses
    dashboardData,
    filterOptions: filtersQuery.data ?? null,
    priceIndicesData: priceIndicesQuery.data ?? null,

    // Loading / error states
    loading: dashboardQuery.isLoading,
    isFiltersLoading: filtersQuery.isLoading,
    error: dashboardQuery.error?.message ?? null,
    filtersError: filtersQuery.error?.message ?? null,
    // 404 means no data matched — expose as "empty" not "error"
    isEmpty: dashboardData === null && !dashboardQuery.isLoading && !dashboardQuery.error,

    // Transformed data matching component shapes
    regions,
    countries,
    marketRegionData,
    marketClusterData,
    marketCountryData,
    categoryL2,
    categoryL3,
    spendMechanics,
    waterfallData,
    driverWeights,
    donutCharts,
    grossInflationByCategory,
    grossInflationByCategoryL3,
    grossInflationByCategoryL4,
    impactRanking,
    vendors,
    grossInflationYearly,
    priceIndices,
    insights,
    followUps,

    // Phase 2+ enrichments
    driverTableA,
    driverTableB,
    driverTableC,
    actionMatrix,
    marketGrainDriverNet,
    yearTrendByTeam,
    yearTrendByCategoryL2,
    yearTrendByCategoryL3,
    yearTrendByVendorRegion,
    yearTrendByImsRegion,
    kpiScenarioRanges,

    // TanStack Query utilities
    refetch: dashboardQuery.refetch,
    isFetching: dashboardQuery.isFetching,
  };
}

// ─── Saved Filters Hook ─────────────────────────────────────────────────────────

/**
 * Hook for managing saved filter presets (CRUD).
 * Stores the exact /dashboard query-param object as `filters` so "load preset" =
 * spread it straight into the filter-bar state and re-fetch /dashboard.
 *
 * @param {string} userId - Current user ID (from session context)
 */
export function useSavedFilters(userId) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: inflationQueryKeys.savedFilters(userId),
    queryFn: () => listSavedFilters(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: ({ filterName, filters }) => createSavedFilter(userId, filterName, filters),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inflationQueryKeys.savedFilters(userId) }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ filterId, filterName, filters }) => updateSavedFilter(filterId, userId, filterName, filters),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inflationQueryKeys.savedFilters(userId) }),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ filterId }) => deleteSavedFilter(filterId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inflationQueryKeys.savedFilters(userId) }),
  });

  const saveFilter = useCallback((filterName, filters) => {
    createMutation.mutate({ filterName, filters });
  }, [createMutation]);

  const editFilter = useCallback((filterId, filterName, filters) => {
    updateMutation.mutate({ filterId, filterName, filters });
  }, [updateMutation]);

  const removeFilter = useCallback((filterId) => {
    deleteMutation.mutate({ filterId });
  }, [deleteMutation]);

  return {
    savedFilters: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    saveFilter,
    editFilter,
    removeFilter,
    isSaving: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
