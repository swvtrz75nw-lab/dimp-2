// pages/InflationPage.jsx — the Inflation tab.
// ALL data comes from the backend API. No mock data imports.
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Icon } from '../components/Icon.jsx';
import { InflationTopBar, ViewConfigModal } from './InflationTopBar.jsx';
import InflationIsland from './InflationIsland.jsx';
import InfByIndexTracked from './InfByIndexTracked.jsx';
import InfByCostDriver from './InfByCostDriver.jsx';
import InfSpendMechanics from './InfSpendMechanics.jsx';
import InfEvolution from './InfEvolution.jsx';
import InfCategoryBreakdown from './InfCategoryBreakdown.jsx';
import InfMarketBreakdown from './InfMarketBreakdown.jsx';
import InfBreakdownDashboard from './InfBreakdownDashboard.jsx';
import BreakdownPage from './BreakdownPage.jsx';
import UnifiedPortfolioFilters from './UnifiedPortfolioFilters.jsx';
import { useInflationDashboard } from '../hooks/useInflationDashboard.js';
import './inflation.css';

const INF_CONF_COLOR = { High: 'var(--c-green)', Medium: 'var(--c-orange)', Low: 'var(--c-red)' };

// ---------- helpers ----------
function infFmtM(v) { return '$' + Number(v).toFixed(1) + 'M'; }
function infFmtPct(v) { return (v > 0 ? '+' : '') + Number(v).toFixed(1) + '%'; }

// ---------- shared section header ----------
function InfSectionHead({ title, tag, deepDive, onDeepDive }) {
  return (
    <div className="inf-section-head">
      <div className="inf-sh-left">
        <h2 className="inf-h2">{title}</h2>
        {tag && <span className="inf-section-tag">{tag}</span>}
      </div>
      {deepDive && (
        <button className="inf-deepdive" onClick={onDeepDive}>
          Deep dive on {deepDive}<Icon name="arrowRight" size={14} />
        </button>
      )}
    </div>
  );
}

// ---------- horizontal bar ----------
function InfBar({ label, amt, max, share, color }) {
  return (
    <div className="inf-decomp-row">
      <span className="idr-label"><span className="idr-label-t">{label}</span></span>
      <div className="idr-track"><span className="idr-fill" style={{ width: Math.max(3, (amt / max) * 100) + '%', background: color }} /></div>
      <span className="idr-val">{infFmtM(amt)}<span className="idr-share">{Math.round(share * 100)}%</span></span>
    </div>
  );
}

// ============================================================
// Price Index Cards (S&P-futures style) — data from backend
// ============================================================
function InfIndexCard({ ix, activeYear }) {
  const up = ix.change >= 0;
  const tone = up ? 'var(--c-red)' : 'var(--c-green)';
  const pts = [...(ix.yearly || [])].sort((a, b) => Number(a.year) - Number(b.year));
  if (!pts.length) return null;
  const allVals = pts.flatMap((p) => [p.val, ...(p.min != null ? [p.min] : []), ...(p.max != null ? [p.max] : [])]);
  const maxV = Math.max(...allVals, 1);
  const minV = Math.min(...allVals, 0);
  const range = maxV - minV || 1;
  const W = 400, H = 140, padX = 30, padY = 28;
  const X = (i) => padX + (i / (pts.length - 1)) * (W - 2 * padX);
  const Y = (v) => padY + (1 - (v - minV) / range) * (H - 2 * padY);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.val).toFixed(1)).join(' ');
  const hasMinMax = pts.every((p) => p.min != null && p.max != null);
  const bandPath = hasMinMax
    ? pts.map((p, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.max).toFixed(1)).join(' ')
      + pts.slice().reverse().map((p, i) => 'L' + X(pts.length - 1 - i).toFixed(1) + ' ' + Y(p.min).toFixed(1)).join(' ') + ' Z'
    : '';
  const highlightYear = activeYear || String(new Date().getFullYear());
  return (
    <div className="inf-ixcard">
      <div className="ixc-top">
        <span className="ixc-name">{ix.name}</span>
        <span className="ixc-chg" style={{ color: tone }}>
          <Icon name={up ? 'arrowUp' : 'chevronDown'} size={13} />{Math.abs(ix.change).toFixed(2)} %
        </span>
      </div>
      <div className="ixc-chartwrap ixc-yearly" style={{ color: ix.color }}>
        <svg className="inf-chart inf-chart-yearly" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: H }}>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={padX} x2={W - padX} y1={padY + f * (H - 2 * padY)} y2={padY + f * (H - 2 * padY)} stroke="currentColor" strokeOpacity="0.15" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
          ))}
          {bandPath && <path d={bandPath} fill={ix.color} fillOpacity="0.15" stroke={ix.color} strokeOpacity="0.3" strokeWidth="0.5" strokeDasharray="3 2" />}
          <path d={line} fill="none" stroke={ix.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {pts.map((p, i) => {
            const isActive = p.year === highlightYear;
            const valY = Y(p.val);
            const minGap = 12; // minimum px gap between labels

            // Position value label above the point
            let valLabelY = valY - 10;

            // Only show max/min if they differ meaningfully from val
            const showMax = p.max != null && Math.abs(p.max - p.val) > 0.01;
            const showMin = p.min != null && Math.abs(p.min - p.val) > 0.01;

            // Calculate max label position (above max point)
            let maxLabelY = showMax ? Y(p.max) - 6 : 0;
            // Calculate min label position (below min point)
            let minLabelY = showMin ? Y(p.min) + 12 : 0;

            // Prevent max label from overlapping with value label
            if (showMax && Math.abs(maxLabelY - valLabelY) < minGap) {
              maxLabelY = valLabelY - minGap;
            }
            // Prevent min label from overlapping with value label
            if (showMin && Math.abs(minLabelY - valLabelY) < minGap) {
              minLabelY = valLabelY + minGap;
            }
            // Prevent min label from overlapping with year label
            if (showMin && minLabelY > H - 16) {
              minLabelY = H - 16;
            }
            // Clamp max label so it doesn't go above the chart
            if (showMax && maxLabelY < 6) {
              maxLabelY = 6;
            }

            return (
              <g key={i}>
                {isActive && <circle cx={X(i)} cy={valY} r="9" fill={ix.color} fillOpacity="0.2" />}
                <circle cx={X(i)} cy={valY} r={isActive ? 5.5 : 3.5} fill={ix.color} stroke={isActive ? '#fff' : 'none'} strokeWidth={isActive ? 1.5 : 0} />
                <text x={X(i)} y={valLabelY} textAnchor="middle" fill={isActive ? '#fff' : ix.color} fontSize={isActive ? '10' : '9'} fontWeight="700">{p.val}%</text>
                {showMax && <text x={X(i)} y={maxLabelY} textAnchor="middle" fill="var(--label-tertiary, #888)" fontSize="7.5" fontWeight="600">Max: {p.max}%</text>}
                {showMin && <text x={X(i)} y={minLabelY} textAnchor="middle" fill="var(--label-tertiary, #888)" fontSize="7.5" fontWeight="600">Min: {p.min}%</text>}
                <text x={X(i)} y={H - 4} textAnchor="middle" fill={isActive ? '#fff' : 'var(--label-tertiary, #888)'} fontSize={isActive ? '9.5' : '8.5'} fontWeight={isActive ? '700' : '600'}>{p.year}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function InfIndexRail({ timeValue, priceIndices }) {
  const yearMatch = (timeValue || '').match(/\d{4}/);
  const activeYear = yearMatch ? yearMatch[0] : String(new Date().getFullYear());
  if (!priceIndices || !priceIndices.length) {
    return (
      <div className="inf-railsec">
        <div className="inf-railsec-head"><span>Price indices</span></div>
        <div className="inf-nodata-box">
          <div className="inf-nodata-icon">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M6 26l7-10 5 5 12-14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" /><circle cx="6" cy="26" r="2" fill="currentColor" opacity="0.4" /><circle cx="13" cy="16" r="2" fill="currentColor" opacity="0.4" /><circle cx="18" cy="21" r="2" fill="currentColor" opacity="0.4" /><circle cx="30" cy="7" r="2" fill="currentColor" opacity="0.4" /></svg>
          </div>
          <span className="inf-nodata-title">No price index data</span>
          <span className="inf-nodata-desc">Price indices will appear once tracking data is available.</span>
        </div>
      </div>
    );
  }
  return (
    <div className="inf-railsec">
      <div className="inf-railsec-head"><span>Price indices</span></div>
      <div className="inf-ixcard-list">
        {priceIndices.map((ix) => <InfIndexCard key={ix.id} ix={ix} activeYear={activeYear} />)}
      </div>
      <div className="inf-railsec-foot">Tracked live · as of {timeValue}</div>
    </div>
  );
}

// ============================================================
// Price impact estimate — uses waterfall API data
// ============================================================
function InfPriceImpact({ timeValue, onDeepDive, waterfallData, spendMechanics, impactRanking, grossInflationYearly }) {
  const selYear = (timeValue || '').match(/\d{4}/)?.[0] || '2026';
  const selYearNum = Number(selYear);

  // Waterfall rows from API — show net inflation per year
  const rows = (waterfallData || []).map((w) => ({
    label: String(w.year),
    when: w.year < selYearNum ? 'past' : w.year === selYearNum ? 'this year' : 'forecast',
    netInflation: w.net_inflation_m,
    offset: Math.round(w.offset_pct) + '%',
    conf: w.offset_pct >= 60 ? 'High' : w.offset_pct >= 30 ? 'Med' : 'Low',
    isSelected: String(w.year) === selYear,
  }));

  const topCategory = impactRanking && impactRanking[0];

  return (
    <section className="inf-section">
      <div className="inf-impact-card">
        <InfSectionHead title="Price impact estimate" tag={`Year ${selYear}`} />
        <div className="iic-headrow">
          <div className="iic-compare">
            <div className="iic-cmp-title">Spend &amp; price effect over time</div>
            <div className="iic-cmp-headers">
              <span className="cmp-col-head">Year</span>
              <span className="cmp-col-head">Net inflation</span>
              <span className="cmp-col-head"></span>
              <span className="cmp-col-head">Offset</span>
              <span className="cmp-col-head">Confidence</span>
            </div>
            {rows.length > 0 ? rows.map((r, i) => (
              <div key={i} className={'iic-cmp-row' + (r.isSelected ? ' cur' : '')}>
                <div className="cmp-when"><span className="cmp-label">{r.label}</span><span className="cmp-tag">{r.when}</span></div>
                <div className={'cmp-bar' + (r.isSelected ? ' highlighted' : '')}><span style={{ width: Math.max(4, (Math.abs(r.netInflation) / Math.max(...rows.map((x) => Math.abs(x.netInflation)), 1)) * 100) + '%' }} /></div>
                <span className="cmp-spend">{infFmtM(r.netInflation)}</span>
                <span className="cmp-added">{r.offset}</span>
                <span className="cmp-added" style={{ color: r.conf === 'High' ? 'var(--c-green)' : r.conf === 'Med' ? 'var(--c-orange)' : 'var(--label-tertiary)' }}>{r.conf}</span>
              </div>
            )) : (
              <div className="inf-nodata-box inf-nodata-box--inline">
                <div className="inf-nodata-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="4" y="6" width="24" height="20" rx="3" stroke="currentColor" strokeWidth="1.3" strokeDasharray="3 2" opacity="0.5" /><path d="M9 14h14M9 18h10M9 22h6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.4" /></svg>
                </div>
                <span className="inf-nodata-title">No waterfall data</span>
              </div>
            )}
          </div>
        </div>

        <div className="iic-stats">
          <div className="iic-stat">
            <span className="iic-stat-k">Most exposed category</span>
            <span className="iic-stat-v">{topCategory ? topCategory.category_l2 : '—'}</span>
            <span className="iic-stat-x">{topCategory ? `$${topCategory.gross_inflation_m}M gross (${topCategory.pct_of_total_gross}%)` : ''}</span>
          </div>
          <div className="iic-stat">
            <span className="iic-stat-k">Total categories tracked</span>
            <span className="iic-stat-v">L2 {impactRanking ? impactRanking.length : '—'}</span>
            <span className="iic-stat-x">{spendMechanics ? `$${spendMechanics.baseline_m}M spend base` : ''}</span>
          </div>
          <div className="iic-stat">
            <span className="iic-stat-k">Procurement offset</span>
            <span className="iic-stat-v">{spendMechanics ? `${spendMechanics.procurement_offset_pct}%` : '—'}</span>
            <span className="iic-stat-x">{spendMechanics ? `$${spendMechanics.cost_prevention_m}M prevented` : ''}</span>
          </div>
        </div>

        {/* Gross Inflation Impact stacked bar chart */}
        <GrossInflationImpact grossInflationYearly={grossInflationYearly} timeValue={timeValue} />
      </div>
    </section>
  );
}

// ============================================================
// Gross Inflation Impact — stacked bar chart from API ratio_by_year
// ============================================================
function GrossInflationImpact({ grossInflationYearly, timeValue }) {
  const [viewMode, setViewMode] = useState('grossInflation'); // 'grossInflation' | 'evolutionSpend'
  if (!grossInflationYearly || !grossInflationYearly.length) return null;

  const isSpendMode = viewMode === 'evolutionSpend';

  // For percentage mode, use netInf + offset; for spend mode, use netInflationM + offsetM
  const dataValues = grossInflationYearly.map((d) => isSpendMode ? (d.netInflationM + d.offsetM) : (d.netInf + d.offset));
  const maxTotal = Math.max(...dataValues, 0.01);
  const chartHeight = 160;
  const selYear = (timeValue || '').match(/\d{4}/)?.[0] || '2026';

  // Calculate a sensible step based on the magnitude of values
  let step;
  if (isSpendMode) {
    if (maxTotal <= 10) step = 2;
    else if (maxTotal <= 50) step = 10;
    else if (maxTotal <= 200) step = 50;
    else if (maxTotal <= 500) step = 100;
    else step = 200;
  } else {
    if (maxTotal <= 2) step = 0.5;
    else if (maxTotal <= 5) step = 1;
    else if (maxTotal <= 20) step = 5;
    else if (maxTotal <= 50) step = 10;
    else step = 20;
  }

  const yCeil = Math.ceil(maxTotal / step) * step;
  const yTicks = [];
  for (let v = 0; v <= yCeil; v += step) yTicks.push(Math.round(v * 100) / 100);
  if (yTicks[yTicks.length - 1] < yCeil) yTicks.push(yCeil);
  const yMax = yTicks[yTicks.length - 1];

  const formatLabel = (val) => isSpendMode ? `$${val.toFixed(0)}M` : `${val.toFixed(2)}%`;
  const formatYLabel = (t) => isSpendMode ? `$${Number.isInteger(t) ? t.toFixed(0) : t.toFixed(1)}M` : `${Number.isInteger(t) ? t.toFixed(0) : t.toFixed(1)}%`;

  return (
    <div className="gii-section">
      <div className="gii-toggle-switch gii-toggle-above">
        <button
          className={'gii-toggle-btn' + (viewMode === 'evolutionSpend' ? ' active' : '')}
          onClick={() => setViewMode('evolutionSpend')}
        >Evolution Spend</button>
        <button
          className={'gii-toggle-btn' + (viewMode === 'grossInflation' ? ' active' : '')}
          onClick={() => setViewMode('grossInflation')}
        >Gross Inflation</button>
      </div>
      <div className="gii-head">
        <span className="gii-title">{isSpendMode ? 'Evolution Spend' : 'Gross Inflation Impact'}</span>
        <div className="gii-head-right">
          <span className="gii-legend-item"><span className="gii-legend-dot net" />Net Inflation {isSpendMode ? '$' : '%'}</span>
          <span className="gii-legend-item"><span className="gii-legend-dot offset" />Offset {isSpendMode ? '$' : '%'}</span>
        </div>
      </div>
      <div className="gii-chart-area" style={{ height: chartHeight }}>
        <div className="gii-y-axis">
          {[...yTicks].reverse().map((t, i) => (
            <span key={i} className="gii-y-label">{formatYLabel(t)}</span>
          ))}
        </div>
        <div className="gii-bars-container">
          <div className="gii-grid-lines">
            {yTicks.slice(1).map((t, i) => (
              <div key={i} className="gii-grid-line" style={{ bottom: (t / yMax) * 100 + '%' }} />
            ))}
          </div>
          {grossInflationYearly.map((row) => {
            const netVal = isSpendMode ? row.netInflationM : row.netInf;
            const offsetVal = isSpendMode ? row.offsetM : row.offset;
            const total = netVal + offsetVal;
            const barH = (total / yMax) * 100;
            const netH = total > 0 ? (netVal / total) * 100 : 50;
            const offsetH = total > 0 ? (offsetVal / total) * 100 : 50;
            const isSelected = row.year === selYear;
            return (
              <div className={'gii-col' + (isSelected ? ' selected' : '')} key={row.year}>
                <span className="gii-total-label">{formatLabel(total)}</span>
                <div className="gii-stacked-bar" style={{ height: barH + '%' }}>
                  <div className="gii-seg offset" style={{ height: offsetH + '%' }}>
                    <span className="gii-seg-label">{formatLabel(offsetVal)}</span>
                  </div>
                  <div className="gii-seg net" style={{ height: netH + '%' }}>
                    <span className="gii-seg-label">{formatLabel(netVal)}</span>
                  </div>
                </div>
                <span className="gii-year-label">{row.year}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="gii-footnote">Not affected by filtering years</div>
    </div>
  );
}

// ============================================================
// Breakdown tables — Region & Category
// ============================================================
function InfConfDots({ conf }) {
  const color = conf === 'High' ? 'var(--c-green)' : conf === 'Medium' ? 'var(--c-orange)' : 'var(--c-red)';
  const label = conf === 'Medium' ? 'Med' : conf;
  return <span className="inf-conf-label" style={{ color }}>{label}</span>;
}

// Helper: returns one of 3 discrete colors based on value's position in the range
// green (low third) → yellow (middle third) → red (top third)
function infHeatColor(value, min, max) {
  if (max === min) return 'rgba(76, 175, 80, 0.4)';
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  if (t <= 0.33) return 'rgba(76, 175, 80, 0.4)';    // green
  if (t <= 0.66) return 'rgba(220, 180, 0, 0.4)';    // yellow
  return 'rgba(183, 28, 28, 0.45)';                   // red
}

// Inverted: red (low third) → yellow (middle third) → green (top third)
function infHeatColorInverted(value, min, max) {
  if (max === min) return 'rgba(76, 175, 80, 0.4)';
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  if (t <= 0.33) return 'rgba(183, 28, 28, 0.45)';   // red
  if (t <= 0.66) return 'rgba(220, 180, 0, 0.4)';    // yellow
  return 'rgba(76, 175, 80, 0.4)';                    // green
}

function InfRegionTable({ regions, countries, clusters }) {
  const [mode, setMode] = useState('Region');
  const rawData = mode === 'Region' ? (regions || []) : mode === 'Cluster' ? (clusters || []) : (countries || []);
  // For cluster data coming from the API, normalize the shape to match regions/countries
  const data = rawData.map((r, i) => {
    if (r.id) return r; // already mapped (regions/countries)
    // Raw cluster data from API (by_ims_market_region)
    return {
      id: r.ims_market_region || ('cluster_' + i),
      name: r.ims_market_region || r.region || r.name || 'Unknown',
      estTotalCost: r.baseline_m || 0,
      netInf: r.net_inflation_m || 0,
      netInflPct: r.net_inflation_pct || (r.baseline_m ? (r.net_inflation_m / r.baseline_m * 100) : 0),
      grossInf: r.gross_inflation_m || 0,
      grossInflPct: r.gross_inflation_pct || (r.baseline_m ? (r.gross_inflation_m / r.baseline_m * 100) : 0),
      offset: r.offset_pct || 0,
    };
  });
  // Sort by gross inflation descending (matching reference)
  const sortedData = [...data].sort((a, b) => (b.grossInf || 0) - (a.grossInf || 0));

  // Compute min/max for net inflation % and gross inflation % across rows
  const netPcts = sortedData.map((r) => r.netInflPct || 0);
  const grossPcts = sortedData.map((r) => r.grossInflPct || 0);
  const offsetPcts = sortedData.map((r) => r.offset || 0);
  const netMin = Math.min(...netPcts);
  const netMax = Math.max(...netPcts);
  const grossMin = Math.min(...grossPcts);
  const grossMax = Math.max(...grossPcts);
  const offsetMin = Math.min(...offsetPcts);
  const offsetMax = Math.max(...offsetPcts);

  return (
    <div className="inf-breakdown-card">
      <div className="inf-bk-head">
        <span className="inf-bk-title">By Market</span>
        <div className="inf-bk-toggle">
          {['Region', 'Cluster', 'Country'].map((m) => (
            <button key={m} className={'inf-bk-btn' + (mode === m ? ' active' : '')} onClick={() => setMode(m)}>{m}</button>
          ))}
        </div>
      </div>
      {sortedData.length > 0 ? (
        <div className="inf-bk-table">
          <div className="inf-bk-thead inf-bk-thead-7col">
            <span>NAME</span>
            <span>EST. TOTAL COST</span>
            <span>NET INFLATION</span>
            <span className="inf-bk-th-bold">GROSS INFLATION</span>
            <span>NET INFLATION %</span>
            <span>GROSS INFLATION %</span>
            <span>OFFSET %</span>
          </div>
          {sortedData.map((r) => (
            <div key={r.id} className="inf-bk-row inf-bk-row-7col">
              <span className="inf-bk-name">{r.name}</span>
              <span className="inf-bk-val-neutral">${(r.estTotalCost || 0) >= 1000 ? ((r.estTotalCost || 0) / 1000).toFixed(2) + 'B' : (r.estTotalCost || 0).toFixed(1) + 'M'}</span>
              <span className="inf-bk-val-neutral">${(r.netInf || 0).toFixed(1)}M</span>
              <span className="inf-bk-val-neutral">${(r.grossInf || 0).toFixed(1)}M</span>
              <span className="inf-bk-val-colored" style={{ background: infHeatColor(r.netInflPct || 0, netMin, netMax) }}>{(r.netInflPct || 0).toFixed(1)}%</span>
              <span className="inf-bk-val-colored" style={{ background: infHeatColor(r.grossInflPct || 0, grossMin, grossMax) }}>{(r.grossInflPct || 0).toFixed(1)}%</span>
              <span className="inf-bk-val-colored" style={{ background: infHeatColorInverted(r.offset || 0, offsetMin, offsetMax) }}>{(r.offset || 0).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="inf-nodata-box">
          <div className="inf-nodata-icon">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M8 12h20M8 18h14M8 24h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" /><circle cx="28" cy="24" r="5" stroke="currentColor" strokeWidth="1.5" opacity="0.5" /><path d="M26.5 22.5l3 3M29.5 22.5l-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" /></svg>
          </div>
          <span className="inf-nodata-title">No {mode.toLowerCase()} data</span>
          <span className="inf-nodata-desc">Market data will appear once available for your selection.</span>
        </div>
      )}
    </div>
  );
}

function InfCategoryTable({ categoryL2, categoryL3 }) {
  const [level, setLevel] = useState('L2');
  const rawData = level === 'L2' ? (categoryL2 || []) : (categoryL3 || []);
  // Sort by offset descending (highest offset first, matching reference)
  const data = [...rawData].sort((a, b) => (b.offset || 0) - (a.offset || 0));

  // Compute min/max for net inflation % and gross inflation % across rows
  const netPcts = data.map((r) => r.netInflPct || 0);
  const grossPcts = data.map((r) => r.grossInflPct || 0);
  const offsetPcts = data.map((r) => r.offset || 0);
  const netMin = Math.min(...netPcts);
  const netMax = Math.max(...netPcts);
  const grossMin = Math.min(...grossPcts);
  const grossMax = Math.max(...grossPcts);
  const offsetMin = Math.min(...offsetPcts);
  const offsetMax = Math.max(...offsetPcts);

  return (
    <div className="inf-breakdown-card">
      <div className="inf-bk-head">
        <span className="inf-bk-title">By Category</span>
        <div className="inf-bk-toggle">
          {['L2', 'L3'].map((m) => (
            <button key={m} className={'inf-bk-btn' + (level === m ? ' active' : '')} onClick={() => setLevel(m)}>{m}</button>
          ))}
        </div>
      </div>
      {data.length > 0 ? (
        <div className="inf-bk-table">
          <div className="inf-bk-thead inf-bk-thead-7col">
            <span>NAME</span>
            <span>EST. TOTAL COST</span>
            <span>NET INFLATION</span>
            <span>GROSS INFLATION</span>
            <span>NET INFLATION %</span>
            <span>GROSS INFLATION %</span>
            <span className="inf-bk-th-bold">OFFSET %</span>
          </div>
          {data.map((r) => (
            <div key={r.id} className="inf-bk-row inf-bk-row-7col">
              <span className="inf-bk-name">{r.name}</span>
              <span className="inf-bk-val-neutral">${(r.estTotalCost || 0).toFixed(1)}M</span>
              <span className="inf-bk-val-neutral">${(r.netInf || 0).toFixed(1)}M</span>
              <span className="inf-bk-val-neutral">${(r.grossInf || 0).toFixed(1)}M</span>
              <span className="inf-bk-val-colored" style={{ background: infHeatColor(r.netInflPct || 0, netMin, netMax) }}>{(r.netInflPct || 0).toFixed(1)}%</span>
              <span className="inf-bk-val-colored" style={{ background: infHeatColor(r.grossInflPct || 0, grossMin, grossMax) }}>{(r.grossInflPct || 0).toFixed(1)}%</span>
              <span className="inf-bk-val-colored" style={{ background: infHeatColorInverted(r.offset || 0, offsetMin, offsetMax) }}>{(r.offset || 0).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="inf-nodata-box">
          <div className="inf-nodata-icon">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><rect x="6" y="8" width="24" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.5" /><path d="M12 16h12M12 20h8M12 24h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" /></svg>
          </div>
          <span className="inf-nodata-title">No category data</span>
          <span className="inf-nodata-desc">Category breakdown will appear once available for your selection.</span>
        </div>
      )}
    </div>
  );
}

function InfBreakdownSection({ regions, countries, clusters, categoryL2, categoryL3 }) {
  return (
    <section className="inf-section">
      <div className="inf-breakdown-section-header">
        <h2 className="inf-breakdown-section-title">By Market &amp; By Category</h2>
        <span className="inf-breakdown-section-hint">Click a row to open it in Breakdown</span>
      </div>
      <div className="inf-breakdown-grid">
        <InfRegionTable regions={regions} countries={countries} clusters={clusters} />
        <InfCategoryTable categoryL2={categoryL2} categoryL3={categoryL3} />
      </div>
    </section>
  );
}

// ============================================================
// Top suppliers — API vendor rows
// ============================================================
// InfApiSupRow renders a single expandable row in the "Top suppliers by rising spend" table.
// Each row displays: supplier avatar (initials), category chip, top cost driver,
// inflation impact %, and a spend comparison (baseline → projected).
// Clicking a row expands it to show an impact-by-index bar breakdown and a recommendation.
function InfApiSupRow({ vendor }) {
  // Toggle state for the expandable detail panel
  const [open, setOpen] = useState(false);
  const v = vendor;

  // Calculate projected spend = baseline + net inflation amount
  const projected = v.baseline_m + v.net_inflation_m;

  // Inflation impact percentage (used for both display and severity dots)
  const impact = v.net_inflation_pct;

  // Severity level (1–4) determines how many red dots are filled in the row.
  // Thresholds: >8% = critical(4), >6% = high(3), >4% = medium(2), else low(1)
  const sev = impact > 8 ? 4 : impact > 6 ? 3 : impact > 4 ? 2 : 1;

  // Color-coding per team/driver for the avatar ring and driver dot
  const driverColors = { 'IT&PC': '#3b82f6', 'MKT&PS': '#f97316', 'OPS&WX': '#10b981', 'HR': '#a855f7' };
  const ringColor = driverColors[v.team] || 'var(--pmi-blue)';

  // Per-driver breakdown not available from backend — show placeholders
  // These would ideally come from the API with actual cost-driver-level inflation splits
  const byIndex = [
    { label: 'CPI', amt: 0, color: '#3b82f6' },
    { label: 'Labour', amt: 0, color: '#f59e0b' },
    { label: 'Elec & Gas', amt: 0, color: '#10b981' },
    { label: 'Fuel', amt: 0, color: '#a855f7' },
  ];
  const maxIdx = Math.max(...byIndex.map((b) => b.amt), 0.01); // max value for bar scale
  const totalAdded = byIndex.reduce((s, b) => s + b.amt, 0);   // sum for share calculation

  return (
    <div className={'inf-trow-wrap' + (open ? ' open' : '')}>
      {/* Clickable row — toggles the expanded detail panel */}
      <button className="inf-trow" onClick={() => setOpen((o) => !o)}>
        {/* Supplier column: circular avatar with initials + supplier name */}
        <div className="tr-supplier">
          <span className="tr-av" style={{ '--ring': ringColor }}>{v.category_l3.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
          <div className="tr-id"><div className="tr-name">{v.category_l3}</div></div>
        </div>
        {/* Categories column: displays the L2 category as a chip/badge */}
        <div className="tr-col tr-cats"><span className="tr-chip">{v.category_l2}</span></div>
        {/* Top Driver column: colored dot + team label (IT&PC, OPS&WX, etc.) */}
        <div className="tr-col tr-driver"><span className="tr-dot" style={{ background: ringColor }} />{v.team}</div>
        {/* Impact column: net inflation percentage */}
        <div className="tr-col tr-impact"><span className="tr-impact-v">+{impact}%</span></div>
        {/* Spend this year column: baseline → projected with severity indicator dots */}
        <div className="tr-col tr-spend">
          <div className="tr-spend-line"><span className="tr-from">${v.baseline_m}M</span><Icon name="arrowRight" size={12} className="tr-arrow" /><span className="tr-to">${projected.toFixed(1)}M</span></div>
          <div className="tr-sev">{[0, 1, 2, 3].map((i) => <span key={i} className={'tr-sevdot' + (i < sev ? ' on' : '')} />)}</div>
        </div>
        {/* Chevron icon indicating expandable state */}
        <Icon name="chevronDown" size={16} className={'tr-chev' + (open ? ' open' : '')} />
      </button>

      {/* Expanded detail panel — shows breakdown bars and AI recommendation */}
      {open && (
        <div className="inf-trow-body">
          <div className="trb-grid">
            {/* Left: per-index impact bar chart (placeholder until API provides driver-level data) */}
            <div className="trb-bars">
              <div className="trb-label">Impact by index</div>
              {byIndex.map((b) => <InfBar key={b.label} label={b.label} amt={b.amt} max={maxIdx} share={totalAdded ? b.amt / totalAdded : 0} color={b.color} />)}
              <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--label-tertiary)' }}>Per-driver breakdown not available from API</div>
            </div>
            {/* Right: contextual recommendation based on inflation severity */}
            <div className="trb-rec">
              <div className="trb-rec-title"><Icon name="bulb" size={14} /> Recommendation</div>
              <div className="trb-rec-body">
                {v.net_inflation_m > 0
                  ? `Net inflation of $${v.net_inflation_m}M (${v.net_inflation_pct}%) with ${v.offset_pct}% offset coverage. Review contract terms to improve mitigation.`
                  : 'No significant inflation impact detected for this supplier.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// InfTopSuppliers — "Top suppliers by rising spend" section
// ============================================================
// Renders the full suppliers table section on the Inflation Dashboard.
// Shows a ranked list of suppliers sorted by rising spend impact.
// Columns: Supplier (avatar + name), Categories (L2 chip), Top Driver (team),
//          Impact (net inflation %), Spend this year (baseline → projected + severity dots).
// Includes an empty state with a placeholder icon when no vendor data is available.
// Props:
//   - vendors: array of vendor objects from the API (sorted by spend impact)
//   - onDeepDive: callback for the "Deep dive on Spend Impact" button in the header
function InfTopSuppliers({ vendors, onDeepDive }) {
  // Empty state: shown when no vendor data is available for the selected filters/period
  if (!vendors || !vendors.length) {
    return (
      <section className="inf-section">
        <div className="inf-table" style={{ padding: '24px' }}>
          <div className="inf-section-head" style={{ marginBottom: '0' }}>
            <div className="inf-sh-left"><h2 className="inf-h2">Top suppliers by rising spend</h2></div>
          </div>
          <div className="inf-nodata-box">
            <div className="inf-nodata-icon">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><rect x="4" y="8" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.5" /><path d="M10 16h16M10 20h12M10 24h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" /></svg>
            </div>
            <span className="inf-nodata-title">No supplier data</span>
            <span className="inf-nodata-desc">Supplier impact data will appear once available for the selected period.</span>
          </div>
        </div>
      </section>
    );
  }

  // Normal state: render the full supplier table with header and rows
  return (
    <section className="inf-section">
      <div className="inf-table">
        {/* Section header with title, supplier count tag, and "Deep dive" button */}
        <InfSectionHead title="Top suppliers by rising spend" tag={`${vendors.length} suppliers`} deepDive="Spend Impact" onDeepDive={onDeepDive} />
        {/* Table column headers */}
        <div className="inf-thead">
          <div className="tr-supplier">Supplier</div>
          <div className="tr-col tr-cats">Categories</div>
          <div className="tr-col tr-driver">Top driver</div>
          <div className="tr-col tr-impact">Impact</div>
          <div className="tr-col tr-spend">Spend this year</div>
          <span className="tr-chev-sp" />
        </div>
        {/* Table body: one expandable row per vendor, sorted by spend impact */}
        <div className="inf-tbody">
          {vendors.map((v) => <InfApiSupRow key={v.id} vendor={v} />)}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Key Insights — reference design matching the mockup exactly
// Layout: headline with icon → narrative → Labour paragraph →
// pill badges (Net impact, Gross, Offset, Labour) → category
// spend cards → Inflation Action Matrix table.
// ============================================================
function InfInsights({ insights, spendMechanics, impactRanking }) {
  if (!insights) return null;

  const {
    headline,
    narrative,
    labourNarrative,
    topCategories,
    totalNetInflationM,
    totalGrossInflationM,
    categoryCount,
    labourShare,
    topDriver,
    procurementOffsetPct,
    topCatNetImpactM,
    topCatGrossM,
    topCatOffsetPct,
  } = insights;

  // Determine priority for action matrix
  function getPriority(cat) {
    if (cat.offsetPct != null && cat.offsetPct < 20 && cat.baselineM >= 80) return 'Critical';
    if (cat.pctOfTotal >= 20) return 'Critical';
    if (cat.offsetPct != null && cat.offsetPct >= 40) return 'Controlled';
    return 'Watch';
  }
  function getOffsetLabel(cat) {
    if (cat.offsetPct != null && cat.offsetPct >= 40) return 'Good';
    if (cat.offsetPct != null && cat.offsetPct > 0) return 'Low';
    return 'None';
  }
  function getSpendLabel(cat) {
    if (cat.baselineM >= 80) return 'High';
    if (cat.baselineM >= 30) return 'Medium';
    return 'Low';
  }

  return (
    <section className="inf-section">
      <div className="inf-glass-card inf-insights-ref">
        {/* Header */}
        <div className="inf-insights-header">
          <span className="inf-insights-header-icon"><Icon name="sparkles" size={16} /></span>
          <span className="inf-insights-header-title">Key insights</span>
        </div>

        <div className="inf-insights-body">
          {/* Headline with bullet icon */}
          <div className="inf-insights-headline-row">
            <span className="inf-insights-bullet">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="3" y="3" width="10" height="10" rx="2" transform="rotate(45 8 1.17)" fill="#30d158" />
              </svg>
            </span>
            <h4 className="inf-insights-headline">{headline}</h4>
          </div>

          {/* Narrative paragraph with bold numbers */}
          {narrative && <p className="inf-insights-narrative">{narrative}</p>}

          {/* Labour driver paragraph */}
          {labourNarrative && (
            <p className="inf-insights-labour-text">
              <strong>Labour</strong> {labourNarrative.replace('Labour ', '')}
            </p>
          )}

          {/* Pill badges row 1: Net impact + Gross */}
          <div className="inf-insights-pills">
            <span className="inf-insights-pill">Net impact ${topCatNetImpactM}M</span>
            <span className="inf-insights-pill">Gross ${topCatGrossM}M</span>
          </div>

          {/* Pill badges row 2: Offset (colored) + Labour */}
          <div className="inf-insights-pills">
            <span className="inf-insights-pill pill-offset">Offset {topCatOffsetPct}%</span>
            <span className="inf-insights-pill">Labour {labourShare}%</span>
          </div>

          {/* Separator */}
          <div className="inf-insights-divider" />

          {/* Category spend cards (Logistics, Corporate Communication, etc.) */}
          {topCategories.slice(1, 3).map((cat) => (
            <div key={cat.name} className="inf-insights-cat-card">
              <div className="inf-insights-cat-name">{cat.name}</div>
              <div className="inf-insights-cat-detail">
                Spend ${cat.spendB}&nbsp;&nbsp;<strong>${cat.netInflationM}M net</strong>&nbsp;&nbsp;{cat.offsetPct != null ? cat.offsetPct.toFixed(1) : '0.0'}% offset
              </div>
            </div>
          ))}

          {/* Separator before matrix */}
          <div className="inf-insights-divider" />

          {/* Inflation Action Matrix */}
          {topCategories.length > 0 && (
            <div className="inf-insights-matrix">
              <div className="inf-insights-matrix-head">Inflation Action Matrix</div>
              <div className="inf-insights-matrix-cols">
                <span>Category</span>
                <span>Spend</span>
                <span>Offset</span>
                <span>Priority</span>
              </div>
              {topCategories.slice(0, 5).map((cat) => {
                const priority = getPriority(cat);
                const spend = getSpendLabel(cat);
                const offset = getOffsetLabel(cat);
                return (
                  <div key={cat.name} className="inf-insights-matrix-row">
                    <span className="inf-insights-mx-name">{cat.name.length > 18 ? cat.name.slice(0, 18) + '…' : cat.name}</span>
                    <span className="inf-insights-mx-spend">{spend}</span>
                    <span className={'inf-insights-mx-offset ' + (offset === 'Good' ? 'good' : offset === 'Low' ? 'low' : 'none')}>{offset}</span>
                    <span className={'inf-insights-mx-priority ' + (priority === 'Critical' ? 'critical' : priority === 'Controlled' ? 'controlled' : 'watch')}>
                      <span className="inf-insights-mx-dot" /> {priority}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Inflation Action Matrix — right rail component (reference design)
// ============================================================
function InfActionMatrix({ impactRanking, spendMechanics }) {
  if (!impactRanking || !impactRanking.length) return null;

  function getPriority(cat) {
    if (cat.offset_pct != null && cat.offset_pct < 20 && cat.baseline_m >= 80) return 'Critical';
    if (cat.pct_of_total_gross >= 20) return 'Critical';
    if (cat.offset_pct != null && cat.offset_pct >= 40) return 'Controlled';
    return 'Watch';
  }
  function getOffsetLabel(cat) {
    if (cat.offset_pct != null && cat.offset_pct >= 40) return 'Good';
    if (cat.offset_pct != null && cat.offset_pct > 0) return 'Low';
    return 'None';
  }
  function getSpendLabel(cat) {
    if (cat.baseline_m >= 80) return 'High';
    if (cat.baseline_m >= 30) return 'Medium';
    return 'Low';
  }

  return (
    <div className="inf-action-matrix">
      <div className="inf-am-header">INFLATION ACTION MATRIX</div>
      <div className="inf-am-cols">
        <span>CATEGORY</span>
        <span>SPEND</span>
        <span>OFFSET</span>
        <span>PRIORITY</span>
      </div>
      {impactRanking.slice(0, 5).map((cat) => {
        const priority = getPriority(cat);
        const spend = getSpendLabel(cat);
        const offset = getOffsetLabel(cat);
        return (
          <div key={cat.category_l2} className="inf-am-row">
            <span className="inf-am-name">{cat.category_l2.length > 16 ? cat.category_l2.slice(0, 16) + '…' : cat.category_l2}</span>
            <span className="inf-am-spend">{spend}</span>
            <span className={'inf-am-offset ' + (offset === 'Good' ? 'good' : offset === 'Low' ? 'low' : 'none')}>{offset}</span>
            <span className={'inf-am-priority ' + (priority === 'Critical' ? 'critical' : priority === 'Controlled' ? 'controlled' : 'watch')}>
              <span className="inf-am-dot" /> {priority}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Follow-ups — derived from backend (interactive card)
// ============================================================
function InfFollowUps({ followUps, onPick }) {
  if (!followUps || !followUps.length) return null;
  return (
    <section className="inf-section">
      <div className="inf-followups-card">
        <div className="inf-followups-header">
          <h3 className="inf-followups-title">Suggested Follow-Ups</h3>
          <p className="inf-followups-subtitle">Tap to write a query into the assistant</p>
        </div>
        <div className="inf-followups">
          {followUps.map((q, i) => (
            <button key={i} className="inf-followup" onClick={() => onPick(q)}>
              <span className="ifu-ic-wrap"><Icon name="search" size={14} className="ifu-ic" /></span>
              <span className="ifu-text">{q}</span>
              <Icon name="arrowRight" size={14} className="ifu-go" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Stub tabs
// ============================================================
function InfStubTab({ tab }) {
  const meta = {
    spend: { ic: 'barChart', title: 'Category Breakdown', desc: '' },
    deepdive: { ic: 'cube', title: 'Market Breakdown', desc: '' },
  }[tab];
  return (
    <div className="inf-stub">
      <div className="inf-stub-ic"><Icon name={meta.ic} size={26} /></div>
      <div className="inf-stub-title">{meta.title}</div>
      <div className="inf-stub-desc">{meta.desc}</div>
    </div>
  );
}

// ============================================================
// PAGE — Main component
// ============================================================
export default function InflationPage({ onNavigate, islandVariant = 'spring' }) {
  const [activeTab, setActiveTab] = useState('view');
  const [timeframe, setTimeframe] = useState('Yearly');
  const [timeValue, setTimeValue] = useState('2026');
  const [islandValue, setIslandValue] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  const scrollRef = useRef(null);

  // All data from the backend
  const {
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
    filterOptions,
    loading,
    error,
    isEmpty,
    isFetching,
    driverTableA,
    driverTableB,
    driverTableC,
    actionMatrix,
    yearTrendByTeam,
    yearTrendByCategoryL2,
    yearTrendByVendorRegion,
    yearTrendByImsRegion,
    kpiScenarioRanges,
  } = useInflationDashboard(timeValue, appliedFilters);

  const yearOptions = filterOptions?.years || [];
  const noSelection = !timeframe || timeValue === null || timeValue === undefined || timeValue === '';

  // ─── Derive BreakdownPage props from dashboard API data ───────────────────
  const breakdownRows = useMemo(() => {
    if (!vendors || !vendors.length) return [];

    // Compute Best/Worst scenario ratios from kpiScenarioRanges
    // These let us spread per-vendor rows into proper scenario bands
    const scenRatios = { grossBest: 1, grossWorst: 1, netBest: 1, netWorst: 1, prevBest: 1, prevWorst: 1 };
    if (kpiScenarioRanges) {
      const gr = kpiScenarioRanges.gross_inflation;
      const nr = kpiScenarioRanges.net_inflation;
      const pr = kpiScenarioRanges.cost_prevention;
      if (gr && gr.base_m > 0) {
        scenRatios.grossBest = gr.best_m / gr.base_m;
        scenRatios.grossWorst = gr.worst_m / gr.base_m;
      }
      if (nr && nr.base_m > 0) {
        scenRatios.netBest = nr.best_m / nr.base_m;
        scenRatios.netWorst = nr.worst_m / nr.base_m;
      }
      if (pr && pr.base_m > 0) {
        scenRatios.prevBest = pr.best_m / pr.base_m;
        scenRatios.prevWorst = pr.worst_m / pr.base_m;
      }
    }

    // Build a lookup of per-L2 driver baselines from grossInflationByCategory
    const l2DriverMap = {};
    if (grossInflationByCategory && grossInflationByCategory.length) {
      grossInflationByCategory.forEach((cat) => {
        const l2 = cat.category_l2;
        l2DriverMap[l2] = {
          WhiteCollar: cat['baseline_White Collar_m'] || 0,
          BlueCollar: cat['baseline_Blue Collar_m'] || 0,
          ElecGas: cat['baseline_Electricity/Gas_m'] || 0,
          Fuel: cat['baseline_Fuel_m'] || 0,
          Materials: cat['baseline_Materials_m'] || 0,
          Technology: cat['baseline_Technology_m'] || 0,
          Overheads: cat['baseline_Overheads_m'] || 0,
          Margin: cat['baseline_Margin_m'] || 0,
          Other: cat['baseline_Other_m'] || 0,
        };
      });
    }

    // Build country → region and country → cluster lookups from the countries data
    const countryToRegion = {};
    const countryToCluster = {};
    if (countries && countries.length) {
      countries.forEach((c) => {
        if (c.name && c.parentRegion) countryToRegion[c.name] = c.parentRegion;
        if (c.name && c.cluster) countryToCluster[c.name] = c.cluster;
      });
    }

    // Build region-level net inflation lookup from marketRegionData (section3_1_by_region)
    // Used to proportion net inflation to vendor rows when vendor-level values are 0
    const regionNetMap = {};
    if (marketRegionData && marketRegionData.length) {
      marketRegionData.forEach((r) => {
        const name = r.region || '';
        regionNetMap[name] = {
          net_inflation_m: r.net_inflation_m || 0,
          gross_inflation_m: r.gross_inflation_m || 0,
          baseline_m: r.baseline_m || 0,
        };
      });
    }

    // Check if vendor-level net_inflation_m values are all zero/missing
    const vendorNetTotal = vendors.reduce((s, v) => s + (v.net_inflation_m || 0), 0);
    const needsRegionProportioning = vendorNetTotal === 0 && Object.keys(regionNetMap).length > 0;

    // If vendor-level net inflation is missing, compute per-region baseline totals
    // so we can proportion region-level net inflation across vendors by baseline share
    let regionBaselineTotals = {};
    if (needsRegionProportioning) {
      vendors.forEach((v) => {
        const region = countryToRegion[v.country] || '';
        regionBaselineTotals[region] = (regionBaselineTotals[region] || 0) + (v.baseline_m || 0);
      });
    }

    // Build year trend lookups for multi-year row generation
    // Maps: (category_l2, year) → { net_inflation_pct, net_inflation_m }
    const catYearCells = {};
    if (yearTrendByCategoryL2?.rows) {
      yearTrendByCategoryL2.rows.forEach((row) => {
        const l2 = row.category_l2;
        if (row.cells) {
          Object.entries(row.cells).forEach(([yr, cell]) => {
            catYearCells[`${l2}__${yr}`] = cell;
          });
        }
      });
    }
    // Maps: (region, year) → { net_inflation_pct, net_inflation_m }
    const regionYearCells = {};
    if (yearTrendByVendorRegion?.rows) {
      yearTrendByVendorRegion.rows.forEach((row) => {
        const region = row.vendor_region || row.region || '';
        if (row.cells) {
          Object.entries(row.cells).forEach(([yr, cell]) => {
            regionYearCells[`${region}__${yr}`] = cell;
          });
        }
      });
    }

    // Determine available years from trend data
    const trendYears = yearTrendByCategoryL2?.years || yearTrendByVendorRegion?.years || [];
    const selectedYear = timeValue || '2026';
    // All years: the selected year plus any others from the trend data
    const allYears = trendYears.length > 0
      ? trendYears.map(String)
      : [selectedYear];

    // Build base-year rows first
    const baseRows = vendors.map((v) => {
      const catDrivers = l2DriverMap[v.category_l2] || {};
      const catTotal = Object.values(catDrivers).reduce((s, x) => s + x, 0);
      const drivers = {};
      if (catTotal > 0 && v.baseline_m > 0) {
        Object.entries(catDrivers).forEach(([key, val]) => {
          drivers[key] = (val / catTotal) * v.baseline_m;
        });
      }

      let netInflationM = v.net_inflation_m || 0;
      let grossInflationM = v.gross_inflation_m || 0;
      let preventionM = v.procurement_offset_m || 0;

      if (needsRegionProportioning && v.baseline_m > 0) {
        const region = countryToRegion[v.country] || '';
        const regionData = regionNetMap[region];
        const regionBaseline = regionBaselineTotals[region] || 1;
        const share = v.baseline_m / regionBaseline;
        if (regionData) {
          netInflationM = regionData.net_inflation_m * share;
          grossInflationM = regionData.gross_inflation_m * share;
          preventionM = grossInflationM - netInflationM;
        }
      }

      return {
        team: v.team || '',
        l2: v.category_l2 || '',
        l3: v.category_l3 || '',
        region: countryToRegion[v.country] || '',
        cluster: countryToCluster[v.country] || '',
        country: v.country || '',
        vendorCountry: v.country || '',
        year: selectedYear,
        spend: (v.baseline_m || 0) * 1e6,
        baseline_Best: (v.baseline_m || 0) * 1e6,
        baseline_Base: (v.baseline_m || 0) * 1e6,
        baseline_Worst: (v.baseline_m || 0) * 1e6,
        gross_Best: grossInflationM * scenRatios.grossBest * 1e6,
        gross_Base: grossInflationM * 1e6,
        gross_Worst: grossInflationM * scenRatios.grossWorst * 1e6,
        prevention_Best: preventionM * scenRatios.prevBest * 1e6,
        prevention_Base: preventionM * 1e6,
        prevention_Worst: preventionM * scenRatios.prevWorst * 1e6,
        netimpact_Best: netInflationM * scenRatios.netBest * 1e6,
        netimpact_Base: netInflationM * 1e6,
        netimpact_Worst: netInflationM * scenRatios.netWorst * 1e6,
        final_Best: ((v.baseline_m || 0) + netInflationM * scenRatios.netBest) * 1e6,
        final_Base: ((v.baseline_m || 0) + netInflationM) * 1e6,
        final_Worst: ((v.baseline_m || 0) + netInflationM * scenRatios.netWorst) * 1e6,
        drivers: Object.fromEntries(Object.entries(drivers).map(([k, val]) => [k, val * 1e6])),
      };
    });

    // Generate rows for other years using year trend data
    // Scale net inflation by the ratio from the trend cells
    if (allYears.length <= 1) return baseRows;

    const result = [...baseRows];
    const otherYears = allYears.filter((y) => y !== selectedYear);

    for (const yr of otherYears) {
      for (const baseRow of baseRows) {
        // Look up year-trend cell for this row's L2 category in the target year
        const catCell = catYearCells[`${baseRow.l2}__${yr}`];
        const catCellBase = catYearCells[`${baseRow.l2}__${selectedYear}`];
        // Also look up by region
        const regCell = regionYearCells[`${baseRow.region}__${yr}`];
        const regCellBase = regionYearCells[`${baseRow.region}__${selectedYear}`];

        // Compute a scaling ratio: target year pct / base year pct
        let ratio = 1;
        if (catCell && catCellBase && catCellBase.net_inflation_pct) {
          ratio = catCell.net_inflation_pct / catCellBase.net_inflation_pct;
        } else if (regCell && regCellBase && regCellBase.net_inflation_pct) {
          ratio = regCell.net_inflation_pct / regCellBase.net_inflation_pct;
        } else if (catCell && baseRow.spend > 0) {
          // If no base year cell, use the absolute pct from the trend cell
          const baseNetPct = baseRow.spend > 0 ? (baseRow.netimpact_Base / baseRow.spend) * 100 : 0;
          ratio = baseNetPct > 0 ? catCell.net_inflation_pct / baseNetPct : 1;
        } else if (regCell && baseRow.spend > 0) {
          const baseNetPct = baseRow.spend > 0 ? (baseRow.netimpact_Base / baseRow.spend) * 100 : 0;
          ratio = baseNetPct > 0 ? regCell.net_inflation_pct / baseNetPct : 1;
        }

        // Handle edge case: if ratio is NaN or Infinity, default to 1
        if (!isFinite(ratio)) ratio = 1;

        const scaledNet = baseRow.netimpact_Base * ratio;
        const scaledGross = baseRow.gross_Base * ratio;
        const scaledPrevention = scaledGross - scaledNet;

        result.push({
          ...baseRow,
          year: yr,
          netimpact_Best: scaledNet * scenRatios.netBest,
          netimpact_Base: scaledNet,
          netimpact_Worst: scaledNet * scenRatios.netWorst,
          gross_Best: scaledGross * scenRatios.grossBest,
          gross_Base: scaledGross,
          gross_Worst: scaledGross * scenRatios.grossWorst,
          prevention_Best: scaledPrevention * scenRatios.prevBest,
          prevention_Base: scaledPrevention,
          prevention_Worst: scaledPrevention * scenRatios.prevWorst,
          final_Best: baseRow.spend + scaledNet * scenRatios.netBest,
          final_Base: baseRow.spend + scaledNet,
          final_Worst: baseRow.spend + scaledNet * scenRatios.netWorst,
        });
      }
    }

    return result;
  }, [vendors, timeValue, grossInflationByCategory, countries, marketRegionData, yearTrendByCategoryL2, yearTrendByVendorRegion, kpiScenarioRanges]);

  // Store the full unfiltered category/market/vendor data on first load.
  // This ensures the filter sidebar always shows ALL options regardless of
  // what filters are currently applied (API returns filtered subsets).
  const [fullCategoryL2, setFullCategoryL2] = useState(null);
  const [fullCategoryL3, setFullCategoryL3] = useState(null);
  const [fullRegions, setFullRegions] = useState(null);
  const [fullCountries, setFullCountries] = useState(null);
  const [fullVendors, setFullVendors] = useState(null);

  // Capture initial full data once loaded (only when no filters are applied)
  useEffect(() => {
    if (categoryL2 && categoryL2.length > 0 && !fullCategoryL2) setFullCategoryL2(categoryL2);
  }, [categoryL2]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (categoryL3 && categoryL3.length > 0 && !fullCategoryL3) setFullCategoryL3(categoryL3);
  }, [categoryL3]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (regions && regions.length > 0 && !fullRegions) setFullRegions(regions);
  }, [regions]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (countries && countries.length > 0 && !fullCountries) setFullCountries(countries);
  }, [countries]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (vendors && vendors.length > 0 && !fullVendors) setFullVendors(vendors);
  }, [vendors]); // eslint-disable-line react-hooks/exhaustive-deps

  const categoryTree = useMemo(() => {
    const l2Data = fullCategoryL2 || categoryL2;
    const l3Data = fullCategoryL3 || categoryL3;
    if (!l2Data || !l3Data) return [];
    return l2Data.map((l2) => ({
      label: l2.name,
      children: l3Data
        .filter((l3) => l3.parentL2 === l2.name)
        .map((l3) => ({ label: l3.name })),
    }));
  }, [fullCategoryL2, fullCategoryL3, categoryL2, categoryL3]);

  const marketTree = useMemo(() => {
    const regData = fullRegions || regions;
    const cntData = fullCountries || countries;
    if (!regData || !cntData) return [];
    return regData.map((r) => ({
      label: r.name,
      children: cntData
        .filter((c) => c.parentRegion === r.name)
        .map((c) => ({ label: c.name })),
    }));
  }, [fullRegions, fullCountries, regions, countries]);

  const vendorTree = useMemo(() => {
    const vData = fullVendors || vendors;
    if (!vData || !vData.length) return [];
    const countrySet = [...new Set(vData.map((v) => v.country).filter(Boolean))];
    return countrySet.map((c) => ({ label: c }));
  }, [fullVendors, vendors]);

  // Count active filters for badge
  const activeFilterCount = (appliedFilters.teams?.length || 0)
    + (appliedFilters.confidence?.length || 0)
    + (appliedFilters.countries?.length || 0)
    + (appliedFilters.clusters?.length || 0)
    + (appliedFilters.categoryL2?.length || 0)
    + (appliedFilters.categoryL3?.length || 0);

  function onFilter({ timeframe: tf, timeValue: tv }) {
    setTimeframe(tf);
    if (tf && tv === null && timeframe !== tf) setTimeValue(null);
    else setTimeValue(tv);
  }

  const goTab = (t) => { setActiveTab(t); if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' }); };
  function pickFollowUp(q) {
    setIslandValue(q);
    // Scroll to bottom so the island prompt box is visible
    setTimeout(() => {
      const island = document.querySelector('.inf-island-dock');
      if (island) island.scrollIntoView({ behavior: 'smooth', block: 'end' });
      const input = document.querySelector('.iie-input');
      if (input) input.focus();
    }, 100);
  }
  function sendIsland(q) { onNavigate && onNavigate({ page: 'chat', prefill: q }); }

  return (
    <div className={'inf-page' + (noSelection ? ' is-locked' : '')}>
      {/* Back to Dashboard (when on mechanics view) / View Breakdown (when on main view) */}
      <div className="inf-topbar-slim">
        {activeTab === 'mechanics' ? (
          <button className="inf-back-to-dashboard-btn" onClick={() => setActiveTab('view')}>
            <Icon name="chevronLeft" size={14} /> Back to Dashboard
          </button>
        ) : (
          <button className="inf-view-breakdown-btn" onClick={() => setActiveTab('mechanics')}>
            View Breakdown <Icon name="arrowRight" size={13} />
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '16px', color: 'var(--c-red)', background: 'rgba(239,68,68,0.1)', margin: '8px 16px', borderRadius: '8px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Subtle refetching indicator — shown when data is refreshing after initial load */}
      {isFetching && !loading && (
        <div className="inf-refetching-bar">
          <div className="inf-refetching-bar-inner" />
        </div>
      )}

      <div className="inf-scroll" ref={scrollRef}>
        <div className="inf-layout">
          <div className="inf-main">
            {activeTab === 'view' ? (
              loading ? (
                <div className="inf-loading-box">
                  <div className="inf-loading-spinner" />
                  <span className="inf-loading-title">Loading dashboard data…</span>
                  <span className="inf-loading-desc">Fetching inflation metrics for {timeValue || 'selected period'}.</span>
                </div>
              ) : (
                <>
                  <InfSpendMechanics apiData={spendMechanics} kpiScenarioRanges={kpiScenarioRanges} yearOptions={yearOptions} timeValue={timeValue} onYearChange={(y) => onFilter({ timeframe: 'Yearly', timeValue: y })} />
                  {/* Full two-column layout: main content left, rail right */}
                  <div className="inf-ref-layout">
                    <div className="inf-ref-main">
                      {/* Inflation evolution */}
                      <InfEvolution waterfallData={waterfallData} spendMechanics={spendMechanics} timeValue={timeValue} driverWeights={driverWeights} />
                      {/* Inflation by cost driver */}
                      <InfByCostDriver driverWeights={driverWeights} spendMechanics={spendMechanics} />
                      {/* By Index Traced */}
                      <InfByIndexTracked apiDriverWeights={driverWeights} apiDonutCharts={donutCharts} apiGrossInflationByCategory={grossInflationByCategory} apiSpendMechanics={spendMechanics} />
                      {/* Breakdown tables */}
                      <InfBreakdownSection regions={regions} countries={countries} clusters={marketClusterData} categoryL2={categoryL2} categoryL3={categoryL3} />
                    </div>
                    <div className="inf-ref-rail">
                      <InfInsights insights={insights} spendMechanics={spendMechanics} impactRanking={impactRanking} />
                      <InfIndexRail timeValue={timeValue} priceIndices={priceIndices} />
                      <InfFollowUps followUps={followUps} onPick={pickFollowUp} />
                    </div>
                  </div>
                </>
              )
            ) : activeTab === 'mechanics' ? (
              loading ? (
                <div className="inf-loading-box">
                  <div className="inf-loading-spinner" />
                  <span className="inf-loading-title">Loading breakdown data…</span>
                  <span className="inf-loading-desc">Fetching breakdown metrics for {timeValue || 'selected period'}.</span>
                </div>
              ) : (
              <BreakdownPage
                rows={breakdownRows}
                categoryTree={categoryTree}
                marketTree={marketTree}
                vendorTree={vendorTree}
                years={yearOptions.length > 0 ? yearOptions.map(String) : ['2025', '2026', '2027']}
                teams={filterOptions?.team ? ['All', ...filterOptions.team] : ['All', 'IT&PC', 'Marketing & Sales']}
                teamLabels={{ 'IT&PC': 'IT & PC' }}
                onBack={() => setActiveTab('view')}
                onFilterChange={(filters) => {
                  // Propagate BreakdownPage filter changes to the parent state
                  // which triggers useInflationDashboard to re-fetch from API.
                  // NOTE: Category L2/L3 and Market filters are NOT propagated
                  // to the API because BreakdownPage handles them locally
                  // (via catFilter + skipCat, mktFilter + skipMkt). Sending
                  // them to the API would reduce the rows returned, removing
                  // unselected items from the bar lists entirely instead of
                  // just highlighting the selected ones. Additionally, mktFilter
                  // stores leaf-level country names, not region names, which
                  // would be the wrong values for the ims_market_region param.
                  if (filters.year && String(filters.year) !== timeValue) {
                    setTimeValue(String(filters.year));
                  }
                  setAppliedFilters((prev) => ({
                    ...prev,
                    teams: filters.team || [],
                  }));
                }}
              />
              )
            ) : activeTab === 'spend' ? (
              loading ? (
                <div className="inf-loading-box">
                  <div className="inf-loading-spinner" />
                  <span className="inf-loading-title">Loading category breakdown…</span>
                  <span className="inf-loading-desc">Fetching category data for {timeValue || 'selected period'}.</span>
                </div>
              ) : (
              <InfCategoryBreakdown spendMechanics={spendMechanics} categoryL2={categoryL2} grossInflationByCategory={grossInflationByCategory} grossInflationByCategoryL3={grossInflationByCategoryL3} driverTableA={driverTableA} driverTableB={driverTableB} driverTableC={driverTableC} yearTrendByCategoryL2={yearTrendByCategoryL2} onFollowUpPick={pickFollowUp} appliedFilters={appliedFilters} />
              )
            ) : activeTab === 'deepdive' ? (
              loading ? (
                <div className="inf-loading-box">
                  <div className="inf-loading-spinner" />
                  <span className="inf-loading-title">Loading market breakdown…</span>
                  <span className="inf-loading-desc">Fetching market data for {timeValue || 'selected period'}.</span>
                </div>
              ) : (
              <InfMarketBreakdown spendMechanics={spendMechanics} regions={regions} onFollowUpPick={pickFollowUp} appliedFilters={appliedFilters} marketRegionData={marketRegionData} marketClusterData={marketClusterData} marketCountryData={marketCountryData} yearTrendByImsRegion={yearTrendByImsRegion} yearTrendByVendorRegion={yearTrendByVendorRegion} />
              )
            ) : (
              <InfStubTab tab={activeTab} />
            )}
          </div>
        </div>
      </div>

      <InflationIsland
        value={islandValue} onChange={setIslandValue} onSend={sendIsland}
        islandVariant={islandVariant}
        placeholder={`Ask about inflation this year…`}
      />

      {noSelection && (
        <div className="inf-lock-overlay">
          <div className="inf-lock-card">
            <span className="inf-lock-ic"><Icon name="calendar" size={22} /></span>
            <div className="inf-lock-title">Select a timeframe</div>
            <div className="inf-lock-sub">Choose a year above to load your price impact analysis.</div>
          </div>
        </div>
      )}

      <UnifiedPortfolioFilters
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filterOptions={filterOptions}
        currentFilters={appliedFilters}
        onApply={(filters) => setAppliedFilters(filters)}
      />
    </div>
  );
}
