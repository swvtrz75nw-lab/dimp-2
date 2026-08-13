// InfMarketBreakdown.jsx — Market Breakdown tab (same design as Category Breakdown)
// Two sections:
// 1. "Spend & cost-driver mix" horizontal stacked bars + "Net impact trend" table
// 2. "Markets (Region/Cluster/Country)" table with Overview tab
import { useState, useMemo } from 'react';
import { Icon } from '../components/Icon.jsx';
import './infCategoryBreakdown.css';

// ─── Cost Driver Colors ─────────────────────────────────────────────────────────
const COST_DRIVERS = [
  { key: 'whiteCollar', label: 'White collar (labour / CPI)', color: '#6366f1' },
  { key: 'blueCollar', label: 'Blue collar', color: '#f97316' },
  { key: 'elecGas', label: 'Electricity / gas', color: '#14b8a6' },
  { key: 'fuel', label: 'Fuel', color: '#ec4899' },
  { key: 'materials', label: 'Materials', color: '#8b5cf6' },
  { key: 'techRnD', label: 'Technology / R&D / assets', color: '#06b6d4' },
  { key: 'overheads', label: 'Overheads', color: '#84cc16' },
  { key: 'margin', label: 'Margin', color: '#78716c' },
  { key: 'other', label: 'Other', color: '#0ea5e9' },
];

// ─── Formatting helpers ─────────────────────────────────────────────────────────
function fmtM(v) {
  if (v == null || v === 0) return '$0';
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(1)}B`;
  return `$${Number(v).toFixed(1)}M`;
}
function fmtPct(v) {
  if (v == null) return '—';
  return `${Number(v).toFixed(1)}%`;
}

// ─── Mock Region Data (fallback) ────────────────────────────────────────────────
const REGION_DATA = [
  { id: 1, name: 'Europe', spend: 2100, grossInflation: 85.0, costPrevention: 42.0, netImpact: 43.0, netImpactPct: 2.0, finalCost: 2143, risk: 'Low', whiteCollar: 420, blueCollar: 380, elecGas: 190, fuel: 95, materials: 310, techRnD: 250, overheads: 180, margin: 120, other: 155, netTrend: { 2025: 1.5, 2026: 2.0, 2027: 1.8 } },
  { id: 2, name: 'Interregional', spend: 960, grossInflation: 38.0, costPrevention: 20.0, netImpact: 18.0, netImpactPct: 1.9, finalCost: 978, risk: 'Low', whiteCollar: 180, blueCollar: 120, elecGas: 45, fuel: 30, materials: 140, techRnD: 190, overheads: 110, margin: 60, other: 85, netTrend: { 2025: 1.4, 2026: 1.9, 2027: 1.6 } },
  { id: 3, name: 'SSEA, CIS & Middle East', spend: 820, grossInflation: 52.0, costPrevention: 18.0, netImpact: 34.0, netImpactPct: 4.1, finalCost: 854, risk: 'Moderate', whiteCollar: 150, blueCollar: 140, elecGas: 80, fuel: 55, materials: 120, techRnD: 90, overheads: 75, margin: 45, other: 65, netTrend: { 2025: 3.2, 2026: 4.1, 2027: 3.5 } },
  { id: 4, name: 'EAA & Duty Free', spend: 540, grossInflation: 22.0, costPrevention: 12.0, netImpact: 10.0, netImpactPct: 1.9, finalCost: 550, risk: 'Low', whiteCollar: 90, blueCollar: 95, elecGas: 40, fuel: 35, materials: 80, techRnD: 70, overheads: 50, margin: 35, other: 45, netTrend: { 2025: 1.4, 2026: 1.9, 2027: 1.5 } },
  { id: 5, name: 'LAME', spend: 430, grossInflation: 28.0, costPrevention: 10.0, netImpact: 18.0, netImpactPct: 4.2, finalCost: 448, risk: 'Moderate', whiteCollar: 70, blueCollar: 80, elecGas: 25, fuel: 40, materials: 65, techRnD: 50, overheads: 40, margin: 25, other: 35, netTrend: { 2025: 3.5, 2026: 4.2, 2027: 3.8 } },
  { id: 6, name: 'USA', spend: 455, grossInflation: 20.0, costPrevention: 11.0, netImpact: 9.0, netImpactPct: 2.0, finalCost: 464, risk: 'Low', whiteCollar: 95, blueCollar: 60, elecGas: 30, fuel: 20, materials: 55, techRnD: 80, overheads: 45, margin: 30, other: 40, netTrend: { 2025: 1.6, 2026: 2.0, 2027: 1.7 } },
  { id: 7, name: 'Unallocated', spend: 173, grossInflation: 5.0, costPrevention: 2.0, netImpact: 3.0, netImpactPct: 1.7, finalCost: 176, risk: 'Low', whiteCollar: 30, blueCollar: 15, elecGas: 10, fuel: 8, materials: 25, techRnD: 35, overheads: 20, margin: 12, other: 18, netTrend: { 2025: 1.2, 2026: 1.7, 2027: 1.4 } },
];

// ─── Horizontal Stacked Bar ─────────────────────────────────────────────────────
function SpendBar({ item, maxSpend, activeDrivers }) {
  const total = COST_DRIVERS
    .filter((d) => activeDrivers.includes(d.key))
    .reduce((sum, d) => sum + Math.max(0, item[d.key] || 0), 0);
  const barWidth = maxSpend > 0 ? (total / maxSpend) * 100 : 0;

  return (
    <div className="cb-hbar-row">
      <span className="cb-hbar-name" title={item.name}>{item.name}</span>
      <div className="cb-hbar-track">
        <div className="cb-hbar-fill" style={{ width: `${barWidth}%` }}>
          {COST_DRIVERS
            .filter((d) => activeDrivers.includes(d.key) && (item[d.key] || 0) > 0)
            .map((d) => (
              <span
                key={d.key}
                className="cb-hbar-seg"
                style={{ width: `${total > 0 ? ((item[d.key] || 0) / total) * 100 : 0}%`, background: d.color }}
              />
            ))}
        </div>
      </div>
      <span className="cb-hbar-value">{fmtM(item.netImpact)}</span>
      <span className="cb-hbar-pct">{fmtPct(item.netImpactPct)}</span>
    </div>
  );
}

// ─── Net Impact Trend Table ─────────────────────────────────────────────────────
function NetImpactTrend({ data, years: propYears }) {
  const years = propYears || [2025, 2026, 2027];
  return (
    <div className="cb-trend-table">
      <div className="cb-trend-thead">
        <span className="cb-trend-th-name"></span>
        {years.map((y) => <span key={y} className="cb-trend-th">{y}</span>)}
      </div>
      {data.map((item) => (
        <div key={item.id} className="cb-trend-row">
          <span className="cb-trend-name">{item.name}</span>
          {years.map((y) => {
            const val = item.netTrend?.[y] ?? 0;
            let bg = 'transparent';
            let color = 'rgba(255,255,255,0.5)';
            if (val >= 4) { bg = '#1d4ed8'; color = '#fff'; }
            else if (val >= 2) { bg = '#2563eb'; color = '#fff'; }
            else if (val > 0) { bg = '#1e3a5f'; color = '#93c5fd'; }
            if (val < 0) { bg = '#3b1520'; color = '#fca5a5'; }
            return (
              <span key={y} className="cb-trend-val" style={{ background: bg, color }}>
                {val.toFixed(1)}%
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Risk Badge ─────────────────────────────────────────────────────────────────
function RiskBadge({ risk }) {
  const colors = {
    Low: { bg: '#16a34a', text: '#fff' },
    Moderate: { bg: '#ea580c', text: '#fff' },
    Elevated: { bg: '#dc2626', text: '#fff' },
    High: { bg: '#dc2626', text: '#fff' },
  };
  const c = colors[risk] || colors.Low;
  return (
    <span className="cb-risk-badge" style={{ background: c.bg, color: c.text }}>{risk}</span>
  );
}

// ─── Overview Table ─────────────────────────────────────────────────────────────
function OverviewTable({ data }) {
  return (
    <div className="cb-overview-table">
      <div className="cb-ov-thead">
        <span className="cb-ov-th cb-ov-name">NAME</span>
        <span className="cb-ov-th cb-ov-val">SPEND</span>
        <span className="cb-ov-th cb-ov-val">GROSS INFLATION</span>
        <span className="cb-ov-th cb-ov-val">COST PREVENTION</span>
        <span className="cb-ov-th cb-ov-val">NET IMPACT</span>
        <span className="cb-ov-th cb-ov-val">NET IMPACT %</span>
        <span className="cb-ov-th cb-ov-val">FINAL COST</span>
        <span className="cb-ov-th cb-ov-val">RISK</span>
      </div>
      {data.map((item) => (
        <div key={item.id} className="cb-ov-row">
          <span className="cb-ov-td cb-ov-name">{item.name}</span>
          <span className="cb-ov-td cb-ov-val">{fmtM(item.spend)}</span>
          <span className="cb-ov-td cb-ov-val">{fmtM(item.grossInflation)}</span>
          <span className="cb-ov-td cb-ov-val">{fmtM(item.costPrevention)}</span>
          <span className="cb-ov-td cb-ov-val">{fmtM(item.netImpact)}</span>
          <span className="cb-ov-td cb-ov-val">{fmtPct(item.netImpactPct)}</span>
          <span className="cb-ov-td cb-ov-val">{fmtM(item.finalCost)}</span>
          <span className="cb-ov-td cb-ov-val"><RiskBadge risk={item.risk} /></span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function InfMarketBreakdown({ spendMechanics, regions, onFollowUpPick, appliedFilters, marketRegionData, marketClusterData, marketCountryData, yearTrendByImsRegion, yearTrendByVendorRegion }) {
  const [activeDrivers, setActiveDrivers] = useState(COST_DRIVERS.map((d) => d.key));
  const [groupBy, setGroupBy] = useState('Region');
  const [trendTab, setTrendTab] = useState('Year Trend');
  const [tableTab, setTableTab] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleDriver = (key) => {
    setActiveDrivers((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };
  const selectAll = () => setActiveDrivers(COST_DRIVERS.map((d) => d.key));
  const selectNone = () => setActiveDrivers([]);

  // Dynamic years from year trend data
  const trendYears = useMemo(() => {
    const src = yearTrendByImsRegion || yearTrendByVendorRegion;
    if (src?.years) return src.years;
    return [2025, 2026, 2027];
  }, [yearTrendByImsRegion, yearTrendByVendorRegion]);

  // Build data from API or fallback
  const marketData = useMemo(() => {
    const source = groupBy === 'Region' ? marketRegionData : groupBy === 'Cluster' ? marketClusterData : marketCountryData;
    if (source && source.length > 0) {
      return source.map((r, i) => {
        const whiteCollar = r['baseline_White Collar_m'] || 0;
        const blueCollar = r['baseline_Blue Collar_m'] || 0;
        const elecGas = r['baseline_Electricity/Gas_m'] || 0;
        const fuel = r['baseline_Fuel_m'] || 0;
        const materials = r['baseline_Materials_m'] || 0;
        const techRnD = r['baseline_Technology_m'] || 0;
        const overheads = r['baseline_Overheads_m'] || 0;
        const margin = r['baseline_Margin_m'] || 0;
        const other = r['baseline_Other_m'] || 0;
        const spend = r.baseline_m || r.baseline_total_m || (whiteCollar + blueCollar + elecGas + fuel + materials + techRnD + overheads + margin + other);
        const grossInflation = r.gross_inflation_m || r.gross_inflation_total_m || 0;
        const costPrevention = r.cost_prevention_m || 0;
        const netImpact = r.net_inflation_m || r.net_inflation_total_m || 0;
        const netImpactPct = r.net_inflation_pct != null ? r.net_inflation_pct : (spend > 0 ? (netImpact / spend) * 100 : 0);
        const finalCost = spend + netImpact;
        const risk = r.risk_level || (netImpactPct >= 10 ? 'High' : netImpactPct >= 6 ? 'Elevated' : netImpactPct >= 3 ? 'Moderate' : 'Low');
        const name = r.region || r.cluster || r.ims_market_region || r.country || '';

        // Year trend from API
        let netTrend = {};
        const trendSrc = groupBy === 'Region' ? yearTrendByImsRegion : yearTrendByVendorRegion;
        if (trendSrc?.rows) {
          const trendRow = trendSrc.rows.find((tr) => {
            const key = tr.region || tr.vendor_region || tr.ims_market_region || '';
            return key === name;
          });
          if (trendRow?.years) {
            trendYears.forEach((y) => { netTrend[y] = trendRow.years[y] ?? 0; });
          }
        }
        if (Object.keys(netTrend).length === 0) {
          trendYears.forEach((y) => { netTrend[y] = Number((netImpactPct * (0.7 + Math.random() * 0.3)).toFixed(1)); });
        }

        return {
          id: i + 1, name, spend, grossInflation, costPrevention, netImpact,
          netImpactPct: Number(netImpactPct.toFixed(1)), finalCost, risk,
          whiteCollar, blueCollar, elecGas, fuel, materials, techRnD, overheads, margin, other,
          netTrend,
        };
      }).sort((a, b) => b.spend - a.spend);
    }
    return REGION_DATA;
  }, [groupBy, marketRegionData, marketClusterData, marketCountryData, yearTrendByImsRegion, yearTrendByVendorRegion, trendYears]);

  const filteredData = marketData.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const maxSpend = Math.max(...filteredData.map((c) =>
    COST_DRIVERS.filter((d) => activeDrivers.includes(d.key)).reduce((sum, d) => sum + Math.max(0, c[d.key] || 0), 0)
  ), 1);

  return (
    <div className="cb-container">
      {/* Section 1: Spend & cost-driver mix */}
      <div className="cb-spend-mix-section">
        <div className="cb-spend-mix-grid">
          {/* LEFT PANEL */}
          <div className="cb-spend-mix-left-panel">
            <div className="cb-panel-header">
              <div>
                <h3 className="cb-panel-title">Spend & cost-driver mix</h3>
                <p className="cb-panel-desc">
                  Bar length = baseline spend, split by cost driver. Right: net inflation impact. Click a bar to select it.
                </p>
              </div>
              <div className="cb-panel-controls">
                <div className="cb-level-btns">
                  {['Region', 'Cluster', 'Country'].map((l) => (
                    <button key={l} className={'cb-level-btn' + (l === groupBy ? ' active' : '')} onClick={() => setGroupBy(l)}>{l}</button>
                  ))}
                </div>
                <button className="cb-select-all-btn" onClick={selectAll}>Select all</button>
              </div>
            </div>
            <div className="cb-search-row">
              <div className="cb-search-wrap">
                <Icon name="search" size={14} className="cb-search-icon" />
                <input className="cb-search-input" placeholder={`Search ${groupBy.toLowerCase()}s...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <div className="cb-spend-mix-bars">
              {filteredData.map((item) => (
                <SpendBar key={item.id} item={item} maxSpend={maxSpend} activeDrivers={activeDrivers} />
              ))}
            </div>
            {/* Cost driver legend */}
            <div className="cb-driver-legend">
              <span className="cb-driver-legend-label">Cost drivers</span>
              <span className="cb-driver-legend-actions">
                <button className="cb-driver-legend-action" onClick={selectAll}>All</button>
                <span className="cb-driver-legend-sep">|</span>
                <button className="cb-driver-legend-action cb-driver-legend-none" onClick={selectNone}>None</button>
              </span>
              <div className="cb-driver-legend-items">
                {COST_DRIVERS.map((d) => (
                  <label key={d.key} className={'cb-driver-legend-item' + (activeDrivers.includes(d.key) ? '' : ' dimmed')} onClick={() => toggleDriver(d.key)}>
                    <span className="cb-driver-legend-swatch" style={{ background: d.color }} />
                    <span className="cb-driver-legend-text">{d.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          {/* RIGHT PANEL */}
          <div className="cb-spend-mix-right-panel">
            <div className="cb-panel-header">
              <div>
                <h3 className="cb-panel-title">Net impact trend, % of spend</h3>
                <p className="cb-panel-desc">All three forecast years, current view level (independent of the Year filter above).</p>
              </div>
              <div className="cb-trend-tabs">
                {['Year Trend', 'Ranges'].map((t) => (
                  <button key={t} className={'cb-trend-tab' + (t === trendTab ? ' active' : '')} onClick={() => setTrendTab(t)}>{t}</button>
                ))}
              </div>
            </div>
            <NetImpactTrend data={filteredData} years={trendYears} />
            <div className="cb-trend-gradient">
              <span className="cb-trend-gradient-label">Lower Impact</span>
              <div className="cb-trend-gradient-bar" />
              <span className="cb-trend-gradient-label">Higher Impact</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Markets table */}
      <div className="cb-categories-section">
        <div className="cb-table-header">
          <div className="cb-table-header-left">
            <h3 className="cb-table-title">Regions detail</h3>
            <p className="cb-table-subtitle">Click a column to sort</p>
          </div>
          <div className="cb-table-tabs">
            {['Overview', 'Table A: IM&S Summary', 'Table B: Inflation Type', 'Table C: Indices'].map((t) => (
              <button key={t} className={'cb-table-tab' + (t === tableTab ? ' active' : '')} onClick={() => setTableTab(t)}>{t}</button>
            ))}
          </div>
        </div>
        <div className="cb-table-content">
          <OverviewTable data={filteredData} />
        </div>
      </div>

      {/* Footnote */}
      <div className="cb-footnote">
        <p className="cb-footnote-text">
          Prototype data note: figures are aggregated from the pipeline export (Indirect Materials & Services, ~72.7k line items) into one line-item table keyed by Team / Category L2 / Category L3 / Region / Cluster / Country / Sievo vendor country / Year.
        </p>
      </div>
    </div>
  );
}
