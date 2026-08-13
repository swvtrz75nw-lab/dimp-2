// InfBreakdownDashboard.jsx — Full "Indirect Spend Inflation Module" page
// Shown when user clicks "View Breakdown" from the main Inflation dashboard.
// Includes: back link, title, view toggle, filters, 5 KPI cards, filter pills, sub-tabs.
import { useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import InfCategoryBreakdown from './InfCategoryBreakdown.jsx';
import InfMarketBreakdown from './InfMarketBreakdown.jsx';
import './infBreakdownDashboard.css';

// ─── Formatting helpers ─────────────────────────────────────────────────────────
function fmtB(v) {
  if (v == null || v === 0) return '$0';
  return `$${(v / 1000).toFixed(2)}B`;
}
function fmtM(v) {
  if (v == null) return '$0';
  return `$${Number(v).toFixed(1)}M`;
}
function fmtPct(v) {
  if (v == null) return '0%';
  return `${Number(v).toFixed(1)}%`;
}

// ─── KPI Card ───────────────────────────────────────────────────────────────────
function BdKpiCard({ label, value, subtitle, subtitleColor, rangeText, highlight, icon, iconColor }) {
  return (
    <div className={'bd-kpi-card' + (highlight ? ' bd-kpi-highlight' : '')}>
      <div className="bd-kpi-label">
        {label} <span className="bd-kpi-info">ⓘ</span>
        {icon && <span className="bd-kpi-icon" style={{ color: iconColor || '#888' }}>{icon}</span>}
      </div>
      <div className={'bd-kpi-value' + (highlight ? ' bd-kpi-value-highlight' : '')}>
        {value}
      </div>
      {subtitle && <div className="bd-kpi-subtitle" style={subtitleColor ? { color: subtitleColor } : {}}>{subtitle}</div>}
      {rangeText && <div className="bd-kpi-range">{rangeText}</div>}
    </div>
  );
}

// ─── Filter Pill ────────────────────────────────────────────────────────────────
function FilterPill({ label, value }) {
  return (
    <span className="bd-filter-pill">
      <span className="bd-filter-pill-label">{label}:</span> {value}
    </span>
  );
}

// ─── Year Button ────────────────────────────────────────────────────────────────
function YearButton({ year, active, onClick }) {
  return (
    <button
      className={'bd-year-btn' + (active ? ' active' : '')}
      onClick={() => onClick(year)}
    >
      {year}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════
export default function InfBreakdownDashboard({
  onBack,
  spendMechanics,
  kpiScenarioRanges,
  categoryL2,
  grossInflationByCategory,
  grossInflationByCategoryL3,
  regions,
  marketRegionData,
  marketClusterData,
  marketCountryData,
  yearOptions,
  timeValue,
  onYearChange,
  appliedFilters,
  onFollowUpPick,
}) {
  const [activeView, setActiveView] = useState('standard'); // 'standard' | 'variance'
  const [activeSubTab, setActiveSubTab] = useState('category'); // 'category' | 'market'
  const [selectedYear, setSelectedYear] = useState(timeValue || '2026');

  const years = yearOptions && yearOptions.length > 0 ? yearOptions.map(String) : ['2025', '2026', '2027'];

  // KPI values from spendMechanics
  const baseline_m = spendMechanics?.baseline_m || 0;
  const gross_inflation_m = spendMechanics?.gross_inflation_m || 0;
  const cost_prevention_m = spendMechanics?.cost_prevention_m || 0;
  const net_inflation_m = spendMechanics?.net_inflation_m || 0;
  const total_cost_m = spendMechanics?.total_cost_m || 0;
  const procurement_offset_pct = spendMechanics?.procurement_offset_pct || 0;

  // Ranges from kpiScenarioRanges (Best-Worst) or fallback to ±15% heuristic
  const ranges = kpiScenarioRanges || {};
  const grossRange = ranges.gross_inflation;
  const netRange = ranges.net_inflation;
  const prevRange = ranges.cost_prevention;
  const finalRange = ranges.final_cost;

  const grossMin = grossRange ? grossRange.best_m : (gross_inflation_m * 0.88);
  const grossMax = grossRange ? grossRange.worst_m : (gross_inflation_m * 1.15);
  const netMin = netRange ? netRange.best_m : (net_inflation_m * 0.85);
  const netMax = netRange ? netRange.worst_m : (net_inflation_m * 1.18);
  const prevMin = prevRange ? prevRange.best_m : (cost_prevention_m * 0.88);
  const prevMax = prevRange ? prevRange.worst_m : (cost_prevention_m * 1.12);
  const totalMin = finalRange ? (finalRange.best_m / 1000) : ((total_cost_m - total_cost_m * 0.02) / 1000);
  const totalMax = finalRange ? (finalRange.worst_m / 1000) : ((total_cost_m + total_cost_m * 0.03) / 1000);

  function handleYearClick(y) {
    setSelectedYear(y);
    if (onYearChange) onYearChange(y);
  }

  return (
    <div className="bd-page">
      {/* Title section */}
      <div className="bd-title-section">
        <h1 className="bd-title">Indirect Spend Inflation Module</h1>
        <p className="bd-description">
          Clickable prototype — indirect Materials & Services cost inflation forecast, drill down by category or market.
          Figures are USD, FY2025 baseline actuals with FY2026-27 cascading scenario forecasts.
        </p>
      </div>

      {/* Dashboard View toggle */}
      <div className="bd-view-row">
        <span className="bd-view-label">DASHBOARD VIEW</span>
        <div className="bd-view-toggle">
          <button
            className={'bd-view-btn' + (activeView === 'standard' ? ' active' : '')}
            onClick={() => setActiveView('standard')}
          >
            Standard View
          </button>
          <button
            className={'bd-view-btn' + (activeView === 'variance' ? ' active' : '')}
            onClick={() => setActiveView('variance')}
          >
            Variance Methodology
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bd-filter-bar">
        <div className="bd-filter-group">
          <span className="bd-filter-group-label">YEAR</span>
          <div className="bd-year-group">
            {years.map((y) => (
              <YearButton key={y} year={y} active={y === selectedYear} onClick={handleYearClick} />
            ))}
          </div>
        </div>
        <div className="bd-filter-group">
          <span className="bd-filter-group-label">TEAM</span>
          <button className="bd-filter-dropdown">
            All teams <Icon name="chevronDown" size={12} />
          </button>
        </div>
        <div className="bd-filter-group">
          <span className="bd-filter-group-label">VENDOR</span>
          <button className="bd-filter-dropdown">
            All vendors <Icon name="chevronDown" size={12} />
          </button>
        </div>
        <div className="bd-filter-group bd-filter-saved">
          <span className="bd-filter-group-label">SAVED FILTERS</span>
          <button className="bd-filter-dropdown">
            Saved filters <Icon name="chevronDown" size={12} />
          </button>
        </div>
        <button className="bd-save-filter-btn">+ Save filter</button>
        <button className="bd-filters-btn">
          <Icon name="sliders" size={14} /> Filters
        </button>
        <button className="bd-reset-btn">Reset all filters</button>
      </div>

      {/* KPI Cards */}
      <div className="bd-kpi-row">
        <BdKpiCard
          label="BASELINE SPEND"
          value={fmtB(baseline_m)}
          subtitle={`${selectedYear} cost base`}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
          iconColor="#10b981"
        />
        <BdKpiCard
          label="GROSS INFLATION"
          value={fmtM(gross_inflation_m)}
          subtitle={`${((gross_inflation_m / baseline_m) * 100).toFixed(1)}% of spend, before mitigation`}
          subtitleColor="#ef4444"
          rangeText={`Range: $${Number(grossMin).toFixed(1)}M – $${Number(grossMax).toFixed(1)}M`}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 17 6-6 4 4 8-8" /><path d="M17 7h4v4" /></svg>}
          iconColor="#ef4444"
        />
        <BdKpiCard
          label="COST PREVENTION"
          value={fmtM(cost_prevention_m)}
          subtitle={`${procurement_offset_pct}% of gross inflation offset`}
          rangeText={`Range: $${Number(prevMin).toFixed(1)}M – $${Number(prevMax).toFixed(1)}M`}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 5 5 19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></svg>}
          iconColor="#f59e0b"
        />
        <BdKpiCard
          label="NET IMPACT"
          value={fmtM(net_inflation_m)}
          subtitle={`${((net_inflation_m / baseline_m) * 100).toFixed(1)}% of spend`}
          subtitleColor="#06b6d4"
          highlight
          rangeText={`Range: $${Number(netMin).toFixed(1)}M – $${Number(netMax).toFixed(1)}M`}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 17 6-6 4 4 8-8" /><path d="M17 7h4v4" /></svg>}
          iconColor="#06b6d4"
        />
        <BdKpiCard
          label="FINAL COST"
          value={fmtB(total_cost_m)}
          subtitle={`Base, ${selectedYear}`}
          rangeText={`Range: $${Number(totalMin).toFixed(2)}B – $${Number(totalMax).toFixed(2)}B`}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>}
          iconColor="#10b981"
        />
      </div>

      {/* Active filter pills */}
      <div className="bd-pills-row">
        <span className="bd-pills-label">Viewing:</span>
        <FilterPill label="Category" value={appliedFilters?.categoryL2?.length ? appliedFilters.categoryL2.join(', ') : 'All'} />
        <FilterPill label="Market" value={appliedFilters?.countries?.length ? appliedFilters.countries.join(', ') : 'All'} />
        <FilterPill label="Vendor" value="All" />
        <FilterPill label="Team" value={appliedFilters?.teams?.length ? appliedFilters.teams.join(', ') : 'All teams'} />
        <span className="bd-pills-year">{selectedYear} - Base scenarios (Best-Worst shown alongside)</span>
      </div>

      {/* Sub-tabs: Category breakdown / Market breakdown */}
      <div className="bd-subtab-row">
        <button
          className={'bd-subtab' + (activeSubTab === 'category' ? ' active' : '')}
          onClick={() => setActiveSubTab('category')}
        >
          Category breakdown
        </button>
        <button
          className={'bd-subtab' + (activeSubTab === 'market' ? ' active' : '')}
          onClick={() => setActiveSubTab('market')}
        >
          Market breakdown
        </button>
      </div>

      {/* Content */}
      <div className="bd-content">
        {activeSubTab === 'category' ? (
          <InfCategoryBreakdown
            spendMechanics={spendMechanics}
            categoryL2={categoryL2}
            grossInflationByCategory={grossInflationByCategory}
            grossInflationByCategoryL3={grossInflationByCategoryL3}
            onFollowUpPick={onFollowUpPick}
            appliedFilters={appliedFilters}
          />
        ) : (
          <InfMarketBreakdown
            spendMechanics={spendMechanics}
            regions={regions}
            onFollowUpPick={onFollowUpPick}
            appliedFilters={appliedFilters}
            marketRegionData={marketRegionData}
            marketClusterData={marketClusterData}
            marketCountryData={marketCountryData}
          />
        )}
      </div>
    </div>
  );
}
