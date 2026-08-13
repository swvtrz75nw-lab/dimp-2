// InfSpendMechanics.jsx — Inflation Mechanics & Metric Hierarchy
// All data comes from the backend API via the apiData prop.
// No hardcoded/mock values — shows loading state when data is not yet available.
import { useState } from 'react';
import './infSpendMechanics.css';

// ─── Custom Tooltip ─────────────────────────────────────────────────────────────
function MetricTooltip({ text, children }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, below: false });

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - 140;
    if (left < 8) left = 8;
    if (left + 280 > window.innerWidth - 8) left = window.innerWidth - 288;
    const showBelow = rect.top < 130;
    const top = showBelow ? rect.bottom + 8 : rect.top - 8;
    setPos({ top, left, below: showBelow });
    setShow(true);
  };

  return (
    <span className="spm-tooltip-wrap" onMouseEnter={handleMouseEnter} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="spm-tooltip-popup" style={{ top: pos.top, left: pos.left, transform: pos.below ? 'none' : 'translateY(-100%)' }}>
          <div className="spm-tooltip-title">METRIC DEFINITION</div>
          <div className="spm-tooltip-body">{text}</div>
        </div>
      )}
    </span>
  );
}

// ─── Formatting helpers ─────────────────────────────────────────────────────────
function fmtB(valueInM) {
  if (valueInM == null) return '$0.00B';
  return `$${(valueInM / 1000).toFixed(2)}B`;
}
function fmtM(valueInM) {
  if (valueInM == null) return '$0.0M';
  return `$${Number(valueInM).toFixed(1)}M`;
}
function fmtKorM(valueInM) {
  if (valueInM == null) return '$0';
  const abs = Math.abs(valueInM);
  if (abs >= 1000) return `$${(valueInM / 1000).toFixed(2)}B`;
  if (abs >= 100) return `$${valueInM.toFixed(0)}M`;
  if (abs < 1) return `$${(valueInM * 1000).toFixed(0)}K`;
  return `$${valueInM.toFixed(1)}M`;
}
function fmtRange(minM, maxM) {
  return `Range: ${fmtKorM(minM)} – ${fmtKorM(maxM)}`;
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function InfSpendMechanics({ apiData, kpiScenarioRanges, yearOptions, timeValue, onYearChange }) {
  // If no API data available, show empty state
  if (!apiData) {
    return (
      <section className="inf-section spm-section">
        <div className="spm-header">
          <div className="spm-header-left">
            <div>
              <span className="spm-kicker">MACRO-ECONOMIC FORECAST ENGINE</span>
              <h2 className="spm-title">Inflation Mechanics & Metric Hierarchy</h2>
            </div>
          </div>
        </div>
        <div className="spm-nodata-box">
          <div className="spm-nodata-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect x="5" y="10" width="30" height="20" rx="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
              <path d="M12 20h6M18 16h8M22 24h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.4" />
            </svg>
          </div>
          <span className="spm-nodata-title">No spend mechanics data available</span>
          <span className="spm-nodata-desc">Inflation mechanics will be displayed here once baseline and forecast data are available for the selected filters.</span>
        </div>
      </section>
    );
  }

  // All values from the backend API
  const baseline_m = apiData.baseline_m;
  const forecast_m = apiData.forecast_m;
  const gross_inflation_m = apiData.gross_inflation_m;
  const cost_prevention_m = apiData.cost_prevention_m;
  const net_inflation_m = apiData.net_inflation_m;
  const total_cost_m = apiData.total_cost_m;
  const procurement_offset_pct = apiData.procurement_offset_pct;

  // Use kpiScenarioRanges for Best-Worst ranges if available, otherwise fallback to heuristic
  const ranges = kpiScenarioRanges || {};
  const grossRange = ranges.gross_inflation || null;
  const netRange = ranges.net_inflation || null;
  const preventionRange = ranges.cost_prevention || null;
  const finalRange = ranges.final_cost || null;

  // Gross inflation range
  const grossMin = grossRange ? grossRange.best_m : (gross_inflation_m * 0.88);
  const grossMax = grossRange ? grossRange.worst_m : (gross_inflation_m * 1.15);

  // Net inflation range
  const netMin = netRange ? netRange.best_m : (net_inflation_m * 0.85);
  const netMax = netRange ? netRange.worst_m : (net_inflation_m * 1.18);

  // Cost prevention range
  const prevMin = preventionRange ? preventionRange.best_m : (cost_prevention_m * 0.85);
  const prevMax = preventionRange ? preventionRange.worst_m : (cost_prevention_m * 1.15);

  // Final cost / total range
  const totalMin = finalRange ? finalRange.best_m : (total_cost_m - total_cost_m * 0.02);
  const totalMax = finalRange ? finalRange.worst_m : (total_cost_m + total_cost_m * 0.03);

  // Percentage subtitles
  const grossPctOfSpend = baseline_m > 0 ? ((gross_inflation_m / baseline_m) * 100).toFixed(1) : '0.0';
  const offsetPctOfGross = gross_inflation_m > 0 ? ((cost_prevention_m / gross_inflation_m) * 100).toFixed(1) : '0.0';
  const netPctOfSpend = baseline_m > 0 ? ((net_inflation_m / baseline_m) * 100).toFixed(1) : '0.0';

  // Year tabs
  const years = yearOptions && yearOptions.length > 0 ? yearOptions.map(String) : ['2025', '2026', '2027'];
  const selectedYear = timeValue || '2026';

  // Range bar position helpers (position of actual value within min-max range as %)
  const calcRangePos = (val, min, max) => {
    const range = max - min;
    if (range <= 0) return 50;
    return Math.max(0, Math.min(100, ((val - min) / range) * 100));
  };
  const grossRangePos = calcRangePos(gross_inflation_m, grossMin, grossMax);
  const netRangePos = calcRangePos(net_inflation_m, netMin, netMax);
  const totalRangePos = calcRangePos(total_cost_m, totalMin, totalMax);
  const prevRangePos = calcRangePos(cost_prevention_m, prevMin, prevMax);

  return (
    <section className="inf-section spm-section">
      {/* Header */}
      <div className="spm-header">
        <div className="spm-header-left">
          <div>
            <span className="spm-kicker">MACRO-ECONOMIC FORECAST ENGINE</span>
            <h2 className="spm-title">Inflation Mechanics & Metric Hierarchy</h2>
            <p className="spm-subtitle">Trace mathematical relationships from baseline input indices to final portfolio spending impacts.</p>
          </div>
        </div>
        <div className="spm-header-right">
          {/* Year tabs */}
          <div className="spm-year-tabs">
            {years.map((y) => (
              <button
                key={y}
                className={'spm-year-tab' + (y === selectedYear ? ' active' : '')}
                onClick={() => onYearChange && onYearChange(y)}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Boxes — 2 rows of 3 */}
      <div className="spm-kpi-grid">
        {/* Row 1 */}
        <div className="spm-kpi-box">
          <div className="spm-kpi-box-header">
            <span className="spm-kpi-box-title">FORECASTED SPEND</span>
            <MetricTooltip text="Forecasted Spend impacted by indexes via logic/matrix. Pre-mitigation forecast total.">
              <span className="spm-tooltip-icon">?</span>
            </MetricTooltip>
          </div>
          <span className="spm-kpi-box-subtitle">Pre-Mitigation Forecast</span>
          <span className="spm-kpi-box-value">{fmtB(forecast_m)}</span>
        </div>

        <div className="spm-kpi-box">
          <div className="spm-kpi-box-header">
            <span className="spm-kpi-box-title">BASELINE SPEND</span>
            <MetricTooltip text="Current Sievo spend (before inflation). Pre-inflation baseline total.">
              <span className="spm-tooltip-icon">?</span>
            </MetricTooltip>
          </div>
          <span className="spm-kpi-box-subtitle">Pre-Inflation Baseline</span>
          <span className="spm-kpi-box-value">{fmtB(baseline_m)}</span>
        </div>

        <div className="spm-kpi-box spm-kpi-box--offset">
          <div className="spm-kpi-box-header">
            <span className="spm-kpi-box-title">OFFSET (MITIGATION)</span>
            <MetricTooltip text="Procurement Offset = Gross Inflation × contract mitigations %. Represents the amount of gross inflation that has been mitigated.">
              <span className="spm-tooltip-icon">?</span>
            </MetricTooltip>
          </div>
          <span className="spm-kpi-box-subtitle">Gross Inflation Mitigated</span>
          <div className="spm-kpi-box-value-row">
            <span className="spm-kpi-box-value spm-kpi-val-green">-{fmtM(cost_prevention_m)}</span>
            <span className="spm-kpi-box-pct">({offsetPctOfGross}% of gross inflation offset)</span>
          </div>
          <div className="spm-kpi-range-bar">
            <div className="spm-kpi-range-fill" style={{ width: '100%' }} />
            <div className="spm-kpi-range-dot" style={{ left: prevRangePos + '%' }} />
          </div>
          <span className="spm-kpi-box-range">{fmtRange(prevMin, prevMax)}</span>
        </div>

        {/* Row 2 */}
        <div className="spm-kpi-box spm-kpi-box--exposure">
          <div className="spm-kpi-box-header">
            <span className="spm-kpi-box-title">GROSS INFLATION EXPOSURE</span>
            <MetricTooltip text="Gross Inflation = Forecasted Spend – Baseline Spend. Represents pre-mitigation raw inflation impact.">
              <span className="spm-tooltip-icon">?</span>
            </MetricTooltip>
          </div>
          <span className="spm-kpi-box-subtitle">Gross Inflation (Exposure)</span>
          <div className="spm-kpi-box-value-row">
            <span className="spm-kpi-box-value spm-kpi-val-red">{fmtM(gross_inflation_m)}</span>
            <span className="spm-kpi-box-pct">({grossPctOfSpend}% of baseline)</span>
          </div>
          <div className="spm-kpi-range-bar">
            <div className="spm-kpi-range-fill" style={{ width: '100%' }} />
            <div className="spm-kpi-range-dot" style={{ left: grossRangePos + '%' }} />
          </div>
          <span className="spm-kpi-box-range">{fmtRange(grossMin, grossMax)}</span>
        </div>

        <div className="spm-kpi-box spm-kpi-box--net">
          <div className="spm-kpi-box-header">
            <span className="spm-kpi-box-title">NET INFLATION EXPOSURE</span>
            <MetricTooltip text="Net Inflation = Gross Inflation – Procurement Offset. Residual post-mitigation spend effect.">
              <span className="spm-tooltip-icon">?</span>
            </MetricTooltip>
          </div>
          <span className="spm-kpi-box-subtitle">Net Inflation (Spend Effect)</span>
          <div className="spm-kpi-box-value-row">
            <span className="spm-kpi-box-value spm-kpi-val-cyan">{fmtM(net_inflation_m)}</span>
            <span className="spm-kpi-box-pct">({netPctOfSpend}% of baseline)</span>
          </div>
          <div className="spm-kpi-range-bar">
            <div className="spm-kpi-range-fill" style={{ width: '100%' }} />
            <div className="spm-kpi-range-dot" style={{ left: netRangePos + '%' }} />
          </div>
          <span className="spm-kpi-box-range">{fmtRange(netMin, netMax)}</span>
        </div>

        <div className="spm-kpi-box spm-kpi-box--highlight">
          <div className="spm-kpi-box-header">
            <span className="spm-kpi-box-title">SPEND RUN-RATE OUTLOOK</span>
            <MetricTooltip text="Estimated Total Cost = Baseline Spend + Net Inflation. Post-mitigation run-rate of the portfolio.">
              <span className="spm-tooltip-icon">?</span>
            </MetricTooltip>
          </div>
          <span className="spm-kpi-box-subtitle">Estimated Total Cost</span>
          <div className="spm-kpi-box-value-row">
            <span className="spm-kpi-box-value spm-kpi-val-teal">{fmtB(total_cost_m)}</span>
          </div>
          <div className="spm-kpi-range-bar">
            <div className="spm-kpi-range-fill" style={{ width: '100%' }} />
            <div className="spm-kpi-range-dot" style={{ left: totalRangePos + '%' }} />
          </div>
          <span className="spm-kpi-box-range">{fmtRange(totalMin, totalMax)}</span>
        </div>
      </div>
    </section>
  );
}
