// InfEvolution.jsx — "Inflation evolution" horizontal timeline bar chart
// Reference design: year rows with 2 horizontal bars (net + offset),
// single metrics line below, line chart on the right.
import React, { useState } from 'react';
import './infEvolution.css';

function fmtM(v) {
  if (v == null) return '—';
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  return `${sign}$${abs.toFixed(1)}M`;
}

function fmtRange(min, max) {
  if (min == null || max == null) return '';
  return `Min $${Math.abs(min).toFixed(1)}M – Max $${Math.abs(max).toFixed(1)}M`;
}

export default function InfEvolution({ waterfallData, spendMechanics, timeValue, driverWeights }) {
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Net', 'Offset', 'Gross'];

  if (!waterfallData || waterfallData.length === 0) return null;

  const selYear = (timeValue || '').match(/\d{4}/)?.[0] || '2026';
  const selYearNum = Number(selYear);

  const rows = waterfallData.map((w) => ({
    year: String(w.year),
    when: w.year < selYearNum ? 'PAST' : w.year === selYearNum ? 'THIS YEAR' : 'FORECAST',
    netInflation: w.net_inflation_m,
    offset: w.procurement_offset_m || 0,
    gross: w.gross_inflation_m || (w.net_inflation_m + (w.procurement_offset_m || 0)),
    estimatedTotal: w.total_cost_m || null,
    netMin: w.net_inflation_best_m != null ? w.net_inflation_best_m : w.net_inflation_m * 0.85,
    netMax: w.net_inflation_worst_m != null ? w.net_inflation_worst_m : w.net_inflation_m * 1.15,
    offsetMin: w.procurement_offset_best_m != null ? w.procurement_offset_best_m : (w.procurement_offset_m || 0) * 0.85,
    offsetMax: w.procurement_offset_worst_m != null ? w.procurement_offset_worst_m : (w.procurement_offset_m || 0) * 1.15,
    grossMin: w.gross_inflation_best_m != null ? w.gross_inflation_best_m : (w.gross_inflation_m || (w.net_inflation_m + (w.procurement_offset_m || 0))) * 0.85,
    grossMax: w.gross_inflation_worst_m != null ? w.gross_inflation_worst_m : (w.gross_inflation_m || (w.net_inflation_m + (w.procurement_offset_m || 0))) * 1.15,
    isSelected: String(w.year) === selYear,
  }));

  // Use gross as the max reference for bar widths
  const maxGross = Math.max(...rows.map((r) => Math.abs(r.gross)), 1);

  const totalCostPoints = rows
    .filter((r) => r.estimatedTotal != null)
    .map((r) => ({ year: r.year, val: r.estimatedTotal }));

  const chartPoints = totalCostPoints.length > 0 ? totalCostPoints : (spendMechanics?.total_cost_m ? rows.map((r, i) => {
    const cumulativeGross = rows.slice(0, i + 1).reduce((s, x) => s + x.gross, 0);
    return { year: r.year, val: spendMechanics.total_cost_m + cumulativeGross };
  }) : []);

  const lineVals = chartPoints.map((p) => p.val);
  const rawMin = Math.min(...lineVals);
  const rawMax = Math.max(...lineVals);
  const rawRange = rawMax - rawMin || 1;
  const lineMin = rawMin - rawRange * 0.2;
  const lineMax = rawMax + rawRange * 0.2;
  const lineRange = lineMax - lineMin || 1;

  return (
    <div className="inf-evo-card">
      <div className="inf-evo-header">
        <h3 className="inf-evo-title">Inflation evolution</h3>
        <div className="inf-evo-filters">
          {filters.map((f) => (
            <button
              key={f}
              className={'inf-evo-filter-btn' + (filter === f ? ' active' : '')}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <p className="inf-evo-desc">
        Net inflation plus the offset that mitigates it reconciles exactly to gross inflation each year. Click a value below (or the toggle above) to
        preview one complement at a time; each figure's Min–Max scenario range is shown underneath it.
      </p>

      <div className="inf-evo-legend">
        <span className="inf-evo-legend-item"><span className="inf-evo-legend-dot net" /> Net inflation</span>
        <span className="inf-evo-legend-item"><span className="inf-evo-legend-dot offset" /> Offset</span>
        <span className="inf-evo-legend-item"><span className="inf-evo-legend-dot total" /> Estimated total cost</span>
      </div>

      <div className="inf-evo-content">
        {/* Left: year rows */}
        <div className="inf-evo-rows">
          {rows.map((row) => {
            const isZero = Math.abs(row.gross) < 0.01;
            // Net bar width proportional to gross (net is part of gross)
            const netBarW = isZero ? 0 : Math.max(4, (Math.abs(row.netInflation) / maxGross) * 100);
            // Offset bar width proportional to gross
            const offsetBarW = isZero ? 0 : Math.max(4, (Math.abs(row.offset) / maxGross) * 100);

            return (
              <div key={row.year} className={'inf-evo-row' + (row.isSelected ? ' selected' : '')}>
                {/* Row 1: year + two bars (net bar on top, offset bar below) */}
                <div className="inf-evo-row-top">
                  <div className="inf-evo-year-col">
                    <span className="inf-evo-year">{row.year}</span>
                    <span className="inf-evo-when">{row.when}</span>
                  </div>
                  {!isZero ? (
                    <div className="inf-evo-bars-wrap">
                      <div className="inf-evo-bar-row">
                        <div className="inf-evo-bar net" style={{ width: netBarW + '%' }} />
                        <div className="inf-evo-bar offset" style={{ width: offsetBarW + '%' }} />
                      </div>
                      {/* Gross min-max range line — full width, aligned across all rows */}
                      <div className="inf-evo-range-line">
                        <div className="inf-evo-range-track">
                          {/* Smooth gradient segment at the marker position */}
                          {(() => {
                            const pct = Math.min(92, Math.max(8, ((row.gross - row.grossMin) / ((row.grossMax - row.grossMin) || 1)) * 100));
                            return (
                              <>
                                <div className="inf-evo-range-gradient" style={{ left: (pct - 8) + '%' }} />
                                <div className="inf-evo-range-marker-line" style={{ left: pct + '%' }} />
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="inf-evo-zero-state">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" stroke="#22c55e" strokeWidth="1.5" opacity="0.6" />
                        <path d="M5 8l2 2 4-4" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="inf-evo-zero-text">No inflation exposure</span>
                    </div>
                  )}
                </div>
                {/* Row 2: Net $X + Offset $Y = Gross $Z with tooltip icons — hidden when zero */}
                {!isZero && (
                <div className="inf-evo-metrics">
                  <div className={'inf-evo-metric' + (filter === 'Net' ? ' highlighted net' : '')}>
                    <span className="inf-evo-metric-value"><strong>Net</strong> {fmtM(row.netInflation)} <span className="inf-evo-tooltip-wrap"><span className="inf-evo-tooltip-icon">ⓘ</span><span className="inf-evo-tooltip-popup"><span className="inf-evo-tooltip-title">Scenario Range</span>{fmtRange(row.netMin, row.netMax)}</span></span></span>
                  </div>
                  <span className="inf-evo-metric-op">+</span>
                  <div className={'inf-evo-metric' + (filter === 'Offset' ? ' highlighted offset' : '')}>
                    <span className="inf-evo-metric-value"><strong>Offset</strong> {fmtM(row.offset)} <span className="inf-evo-tooltip-wrap"><span className="inf-evo-tooltip-icon">ⓘ</span><span className="inf-evo-tooltip-popup"><span className="inf-evo-tooltip-title">Scenario Range</span>{fmtRange(row.offsetMin, row.offsetMax)}</span></span></span>
                  </div>
                  <span className="inf-evo-metric-op">=</span>
                  <div className={'inf-evo-metric' + (filter === 'Gross' ? ' highlighted gross' : '')}>
                    <span className="inf-evo-metric-value"><strong>Gross</strong> {fmtM(row.gross)} <span className="inf-evo-tooltip-wrap"><span className="inf-evo-tooltip-icon">ⓘ</span><span className="inf-evo-tooltip-popup"><span className="inf-evo-tooltip-title">Scenario Range</span>{fmtRange(row.grossMin, row.grossMax)}</span></span></span>
                  </div>
                </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Estimated Total Cost Evolution line chart */}
        {chartPoints.length > 0 && (
          <div className="inf-evo-linechart">
            <div className="inf-evo-linechart-head">
              <span className="inf-evo-linechart-title">Estimated Total Cost Evolution</span>
              <span className="inf-evo-linechart-sub">($M / $B)</span>
            </div>
            <svg className="inf-evo-linechart-svg" viewBox="0 0 220 150" preserveAspectRatio="xMidYMid meet">
              {[0.25, 0.5, 0.75].map((f) => (
                <line key={f} x1="10" x2="210" y1={25 + f * 80} y2={25 + f * 80} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
              ))}
              <path
                d={chartPoints.map((pt, i) => {
                  const x = chartPoints.length === 1 ? 110 : 30 + (i / (chartPoints.length - 1)) * 160;
                  const y = 30 + (1 - (pt.val - lineMin) / lineRange) * 75;
                  return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
                }).join(' ')}
                fill="none"
                stroke="#a78bfa"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {chartPoints.map((pt, i) => {
                const x = chartPoints.length === 1 ? 110 : 30 + (i / (chartPoints.length - 1)) * 160;
                const y = 30 + (1 - (pt.val - lineMin) / lineRange) * 75;
                const label = pt.val >= 1000 ? `$${(pt.val / 1000).toFixed(2)}B` : `$${pt.val.toFixed(0)}M`;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="5" fill="#a78bfa" stroke="#1a1a2e" strokeWidth="2.5" />
                    <text x={x} y={y - 12} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">{label}</text>
                    <text x={x} y={130} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10">{pt.year}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
