// InfCategoryBreakdown.jsx — Category Breakdown tab (New UI)
// Two sections:
// 1. "Spend & cost-driver mix" horizontal stacked bars + "Net impact trend" table
// 2. "Categories (L2)" table with Overview / Table A / Table B / Table C tabs
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

// Footnote text is rendered inline in the component below

// ─── Category Data (from sourcing matrix) ───────────────────────────────────────
const CATEGORY_DATA = [
  { id: 1, name: 'Commercial Deployment', spend: 1966, grossInflation: 124.5, costPrevention: 31.7, netImpact: 92.8, netImpactPct: 4.7, finalCost: 2108, risk: 'Moderate', whiteCollar: 280, blueCollar: 180, elecGas: 0, fuel: 30, materials: 200, techRnD: 120, overheads: 140, margin: 80, other: 144, netTrend: { 2025: 2.7, 2026: 4.7, 2027: 3.1 } },
  { id: 2, name: 'Technology', spend: 1208, grossInflation: 39.2, costPrevention: 16.4, netImpact: 22.8, netImpactPct: 1.9, finalCost: 1248, risk: 'Low', whiteCollar: 170, blueCollar: 0, elecGas: 0, fuel: 0, materials: 70, techRnD: 350, overheads: 180, margin: 80, other: 109, netTrend: { 2025: 0.8, 2026: 1.9, 2027: 1.4 } },
  { id: 3, name: 'Logistics', spend: 1038, grossInflation: 104.2, costPrevention: 51.3, netImpact: 52.9, netImpactPct: 5.1, finalCost: 1098, risk: 'Moderate', whiteCollar: 50, blueCollar: 80, elecGas: 0, fuel: 100, materials: 150, techRnD: 60, overheads: 100, margin: 74, other: 80, netTrend: { 2025: 1.4, 2026: 5.1, 2027: 0.9 } },
  { id: 4, name: 'Facility Services & Supplies', spend: 712.8, grossInflation: 68.1, costPrevention: 35.6, netImpact: 32.5, netImpactPct: 4.6, finalCost: 755.1, risk: 'Moderate', whiteCollar: 60, blueCollar: 310, elecGas: 130, fuel: 25, materials: 240, techRnD: 110, overheads: 80, margin: 18, other: 70, netTrend: { 2025: 1.4, 2026: 4.6, 2027: 2.7 } },
  { id: 5, name: 'Commercial Development', spend: 508.8, grossInflation: 24.9, costPrevention: 2.0, netImpact: 22.8, netImpactPct: 4.5, finalCost: 552.2, risk: 'Moderate', whiteCollar: 120, blueCollar: 0, elecGas: 0, fuel: 0, materials: 60, techRnD: 80, overheads: 60, margin: 50, other: 51, netTrend: { 2025: 4.0, 2026: 4.5, 2027: 4.2 } },
  { id: 6, name: 'Corporate Communication', spend: 488.0, grossInflation: 23.6, costPrevention: 0, netImpact: 23.6, netImpactPct: 4.8, finalCost: 533.9, risk: 'Moderate', whiteCollar: 80, blueCollar: 0, elecGas: 0, fuel: 0, materials: 40, techRnD: 90, overheads: 60, margin: 40, other: 50, netTrend: { 2025: 4.6, 2026: 4.8, 2027: 4.6 } },
  { id: 7, name: 'Business Professional Services', spend: 317.4, grossInflation: 14.5, costPrevention: 5.5, netImpact: 9.0, netImpactPct: 2.8, finalCost: 334.4, risk: 'Low', whiteCollar: 100, blueCollar: 0, elecGas: 0, fuel: 0, materials: 30, techRnD: 50, overheads: 40, margin: 30, other: 36, netTrend: { 2025: 2.2, 2026: 2.8, 2027: 2.6 } },
  { id: 8, name: 'Total Rewards', spend: 231.7, grossInflation: 15.0, costPrevention: 1.0, netImpact: 14.0, netImpactPct: 6.0, finalCost: 250.9, risk: 'Elevated', whiteCollar: 40, blueCollar: 20, elecGas: 0, fuel: 0, materials: 30, techRnD: 60, overheads: 40, margin: 30, other: 39, netTrend: { 2025: 0.9, 2026: 6.0, 2027: 2.7 } },
  { id: 9, name: 'Agency Temps', spend: 221.8, grossInflation: 11.5, costPrevention: 9.3, netImpact: 2.2, netImpactPct: 1.0, finalCost: 225.9, risk: 'Low', whiteCollar: 30, blueCollar: 50, elecGas: 0, fuel: 0, materials: 20, techRnD: 30, overheads: 20, margin: 10, other: 18, netTrend: { 2025: 0.9, 2026: 1.1, 2027: 1.0 } },
  { id: 10, name: 'Fleet', spend: 190.4, grossInflation: 15.1, costPrevention: 13.1, netImpact: 2.1, netImpactPct: 1.1, finalCost: 194.1, risk: 'Low', whiteCollar: 20, blueCollar: 10, elecGas: 0, fuel: 50, materials: 40, techRnD: 30, overheads: 30, margin: 18, other: 20, netTrend: { 2025: 0.9, 2026: 1.1, 2027: 1.0 } },
  { id: 11, name: 'Travel & Internal Events', spend: 155.5, grossInflation: 11.6, costPrevention: 8.4, netImpact: 3.2, netImpactPct: 2.0, finalCost: 161.6, risk: 'Low', whiteCollar: 60, blueCollar: 30, elecGas: 0, fuel: 10, materials: 50, techRnD: 70, overheads: 40, margin: 30, other: 49, netTrend: { 2025: 1.9, 2026: 2.0, 2027: 1.0 } },
  { id: 12, name: 'Real Estate', spend: 152.0, grossInflation: 7.1, costPrevention: 7.1, netImpact: 0, netImpactPct: 0.0, finalCost: 152.0, risk: 'Moderate', whiteCollar: 15, blueCollar: 0, elecGas: 0, fuel: 0, materials: 5, techRnD: 20, overheads: 10, margin: 8, other: 11, netTrend: { 2025: 0.0, 2026: 0.0, 2027: 0.0 } },
  { id: 13, name: 'Talent', spend: 152.0, grossInflation: 7.1, costPrevention: 7.1, netImpact: 0, netImpactPct: 4.1, finalCost: 152.0, risk: 'Moderate', whiteCollar: 15, blueCollar: 0, elecGas: 0, fuel: 0, materials: 5, techRnD: 20, overheads: 10, margin: 8, other: 11, netTrend: { 2025: 3.8, 2026: 4.1, 2027: 3.8 } },
  { id: 14, name: 'LESS', spend: 0, grossInflation: 0, costPrevention: 0, netImpact: 0, netImpactPct: 0.0, finalCost: 0, risk: 'Low', whiteCollar: 0, blueCollar: 0, elecGas: 0, fuel: 0, materials: 0, techRnD: 0, overheads: 0, margin: 0, other: 0, netTrend: { 2025: 0.0, 2026: 0.0, 2027: 0.0 } },
];

// ─── Horizontal Stacked Bar (Spend & cost-driver mix) ───────────────────────────
function SpendBar({ cat, maxSpend, activeDrivers }) {
  const total = COST_DRIVERS
    .filter((d) => activeDrivers.includes(d.key))
    .reduce((sum, d) => sum + Math.max(0, cat[d.key] || 0), 0);
  const barWidth = maxSpend > 0 ? (total / maxSpend) * 100 : 0;

  return (
    <div className="cb-hbar-row">
      <span className="cb-hbar-name" title={cat.name}>
        {cat.name.length > 20 ? cat.name.slice(0, 18) + '...' : cat.name}
      </span>
      <div className="cb-hbar-track">
        <div className="cb-hbar-fill" style={{ width: `${barWidth}%` }}>
          {COST_DRIVERS
            .filter((d) => activeDrivers.includes(d.key) && (cat[d.key] || 0) > 0)
            .map((d) => (
              <span
                key={d.key}
                className="cb-hbar-seg"
                style={{
                  width: `${total > 0 ? ((cat[d.key] || 0) / total) * 100 : 0}%`,
                  background: d.color,
                }}
                title={`${d.label}: $${(cat[d.key] || 0).toFixed(0)}M`}
              />
            ))}
        </div>
      </div>
      <span className="cb-hbar-value">{fmtM(cat.netImpact)}</span>
      <span className="cb-hbar-pct">{fmtPct(cat.netImpactPct)}</span>
    </div>
  );
}

// ─── Net Impact Trend Table (right side) ────────────────────────────────────────
function NetImpactTrend({ data, trendTab, years }) {
  const displayYears = years || [2025, 2026, 2027];
  return (
    <div className="cb-trend-table">
      <div className="cb-trend-thead">
        <span className="cb-trend-th-name"></span>
        {displayYears.map((y) => (
          <span key={y} className="cb-trend-th">{y}</span>
        ))}
      </div>
      {data.map((cat) => (
        <div key={cat.id} className="cb-trend-row">
          <span className="cb-trend-name">{cat.name}</span>
          {displayYears.map((y) => {
            const val = cat.netTrend?.[y] ?? 0;
            // Color logic matching reference:
            // >=4%: solid bright blue bg with white text
            // 2-3.9%: medium blue bg with white text
            // 0.1-1.9%: subtle dark bg with light text
            // 0%: no bg, dim text
            // negative: red tint
            let bg = 'transparent';
            let color = 'rgba(255,255,255,0.5)';
            if (val >= 4) { bg = '#1d4ed8'; color = '#fff'; }
            else if (val >= 2) { bg = '#2563eb'; color = '#fff'; }
            else if (val > 0) { bg = '#1e3a5f'; color = '#93c5fd'; }
            if (val < 0) { bg = '#3b1520'; color = '#fca5a5'; }
            return (
              <span key={y} className="cb-trend-val" style={{ background: bg, color }}>
                {val < 0 ? '' : ''}{val.toFixed(1)}%
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
    <span className="cb-risk-badge" style={{ background: c.bg, color: c.text }}>
      {risk}
    </span>
  );
}

// ─── Overview Table (Image 2) ───────────────────────────────────────────────────
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
      {data.map((cat) => (
        <div key={cat.id} className="cb-ov-row">
          <span className="cb-ov-td cb-ov-name">{cat.name}</span>
          <span className="cb-ov-td cb-ov-val">{fmtM(cat.spend)}</span>
          <span className="cb-ov-td cb-ov-val">{fmtM(cat.grossInflation)}</span>
          <span className="cb-ov-td cb-ov-val">{fmtM(cat.costPrevention)}</span>
          <span className="cb-ov-td cb-ov-val">{fmtM(cat.netImpact)}</span>
          <span className="cb-ov-td cb-ov-val">{fmtPct(cat.netImpactPct)}</span>
          <span className="cb-ov-td cb-ov-val">{fmtM(cat.finalCost)}</span>
          <span className="cb-ov-td cb-ov-val"><RiskBadge risk={cat.risk} /></span>
        </div>
      ))}
    </div>
  );
}

// ─── Table A: IM&S Summary ──────────────────────────────────────────────────────
const TABLE_A_DATA = [
  { id: 1, name: 'Commercial Deployment', baseline: 1348, forecast: 1183, estCost: 1361, gross: 25, netInf: 13, offset: 22, offsetPct: 63, costPrev: 1.9, conf: 'High' },
  { id: 2, name: 'Facility Services & Supplies', baseline: 1837, forecast: 1866, estCost: 1856, gross: 22, netInf: 19, offset: 4, offsetPct: 17, costPrev: 0.48, conf: 'Medium' },
  { id: 3, name: 'Technology', baseline: 967, forecast: 967, estCost: 952, gross: 20, netInf: 5, offset: 15, offsetPct: 75, costPrev: 1.48, conf: 'High' },
  { id: 4, name: 'Logistics', baseline: 697, forecast: 691, estCost: 696, gross: -5, netInf: -1, offset: -3, offsetPct: 83, costPrev: -3.7, conf: 'Medium' },
  { id: 5, name: 'Commercial Development', baseline: 688, forecast: 671, estCost: 618, gross: 13, netInf: 7, offset: 13, offsetPct: 85, costPrev: 7.7, conf: 'High' },
  { id: 6, name: 'Corporate Communication', baseline: 348, forecast: 359, estCost: 369, gross: 11, netInf: 1, offset: 10, offsetPct: 91, costPrev: 2.98, conf: 'High' },
  { id: 7, name: 'Travel & Internal Events', baseline: 336, forecast: 543, estCost: 330, gross: 7, netInf: 3, offset: 4, offsetPct: 57, costPrev: 1.28, conf: 'Medium' },
  { id: 8, name: 'Total Rewards', baseline: 258, forecast: 259, estCost: 250, gross: 1, netInf: 9, offset: 1, offsetPct: 100, costPrev: 0.48, conf: 'High' },
  { id: 9, name: 'Fleet', baseline: 236, forecast: 217, estCost: 215, gross: 1, netInf: -1, offset: -2, offsetPct: 200, costPrev: 0.9, conf: 'High' },
  { id: 10, name: 'Business Professional Services', baseline: 264, forecast: 218, estCost: 269, gross: 6, netInf: 5, offset: 1, offsetPct: 17, costPrev: 4.03, conf: 'Low' },
  { id: 11, name: 'Contractors', baseline: 177, forecast: 183, estCost: 182, gross: 6, netInf: 9, offset: 1, offsetPct: 17, costPrev: 8.65, conf: 'Medium' },
  { id: 12, name: 'Talent', baseline: 68, forecast: 69, estCost: 78, gross: 1, netInf: 7, offset: -1, offsetPct: -100, costPrev: -1.58, conf: 'Low' },
];

function TableAIMSSummary({ data }) {
  const rows = data || TABLE_A_DATA;
  return (
    <div className="cb-overview-table">
      <div className="cb-ov-thead cb-ov-thead-a">
        <span className="cb-ov-th cb-ov-name">NAME</span>
        <span className="cb-ov-th cb-ov-val">BASELINE</span>
        <span className="cb-ov-th cb-ov-val">FORECAST</span>
        <span className="cb-ov-th cb-ov-val">EST. COST</span>
        <span className="cb-ov-th cb-ov-val">GROSS</span>
        <span className="cb-ov-th cb-ov-val">NET INF.</span>
        <span className="cb-ov-th cb-ov-val">OFFSET</span>
        <span className="cb-ov-th cb-ov-val">OFFSET %</span>
        <span className="cb-ov-th cb-ov-val">COST PREV.</span>
        <span className="cb-ov-th cb-ov-val">CONF.</span>
      </div>
      {rows.map((row, idx) => {
        const id = row.id || idx;
        const name = row.name || row.category_l2 || '';
        const baseline = row.baseline || row.baseline_m || 0;
        const forecast = row.forecast || row.forecast_m || 0;
        const estCost = row.estCost || row.total_cost_m || 0;
        const gross = row.gross || row.gross_inflation_m || 0;
        const netInf = row.netInf || row.net_inflation_m || 0;
        const offset = row.offset || row.procurement_offset_m || 0;
        const offsetPct = row.offsetPct || row.offset_pct || 0;
        const costPrev = row.costPrev || row.cost_prevention_pct || 0;
        const conf = row.conf || row.confidence || 'Medium';
        const confColor = conf === 'High' ? '#22c55e' : conf === 'Medium' ? '#f97316' : '#ef4444';
        return (
          <div key={id} className="cb-ov-row cb-ov-row-a">
            <span className="cb-ov-td cb-ov-name">{name}</span>
            <span className="cb-ov-td cb-ov-val">{fmtM(baseline)}</span>
            <span className="cb-ov-td cb-ov-val">{fmtM(forecast)}</span>
            <span className="cb-ov-td cb-ov-val">{fmtM(estCost)}</span>
            <span className="cb-ov-td cb-ov-val">{fmtM(gross)}</span>
            <span className="cb-ov-td cb-ov-val">{fmtM(netInf)}</span>
            <span className="cb-ov-td cb-ov-val">{fmtM(offset)}</span>
            <span className="cb-ov-td cb-ov-val">{offsetPct}%</span>
            <span className="cb-ov-td cb-ov-val">{costPrev}</span>
            <span className="cb-ov-td cb-ov-val" style={{ color: confColor }}>{conf}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Table B: Inflation Type ────────────────────────────────────────────────────
const TABLE_B_DATA = [
  { id: 1, name: 'Commercial Deployment', whiteCollar: 5.6, blueCollar: 1.3, elecGas: null, fuel: 0.3, materials: 1.9, techRnD: 1.2, overheads: 1.2, margin: null, other: 1.5, total: 13 },
  { id: 2, name: 'Facility Services & Supplies', whiteCollar: 0.7, blueCollar: 5.7, elecGas: 2.5, fuel: 0.4, materials: 4.5, techRnD: 2.1, overheads: 1.4, margin: 0.2, other: 1.4, total: 19 },
  { id: 3, name: 'Technology', whiteCollar: 1.7, blueCollar: null, elecGas: null, fuel: null, materials: 0.3, techRnD: 0.8, overheads: 0.9, margin: null, other: 1.1, total: 5 },
  { id: 4, name: 'Logistics', whiteCollar: -0.1, blueCollar: -0.3, elecGas: null, fuel: -0.1, materials: null, techRnD: -0.1, overheads: null, margin: -0.2, other: -0.1, total: -1 },
  { id: 5, name: 'Commercial Development', whiteCollar: 1.2, blueCollar: null, elecGas: null, fuel: null, materials: null, techRnD: null, overheads: 0.4, margin: null, other: 0.3, total: 2 },
  { id: 6, name: 'Corporate Communication', whiteCollar: 0.7, blueCollar: null, elecGas: null, fuel: null, materials: null, techRnD: null, overheads: 0.1, margin: null, other: 0.2, total: 1 },
  { id: 7, name: 'Travel & Internal Events', whiteCollar: 0.9, blueCollar: 0.4, elecGas: null, fuel: 0.1, materials: 0.4, techRnD: 0.5, overheads: 0.2, margin: null, other: 0.5, total: 3 },
  { id: 8, name: 'Total Rewards', whiteCollar: null, blueCollar: null, elecGas: null, fuel: null, materials: null, techRnD: null, overheads: null, margin: null, other: null, total: null },
  { id: 9, name: 'Fleet', whiteCollar: null, blueCollar: null, elecGas: null, fuel: -0.1, materials: -0.5, techRnD: -0.4, overheads: -0.1, margin: -0.1, other: -0.1, total: -1 },
  { id: 10, name: 'Business Professional Services', whiteCollar: 3.6, blueCollar: null, elecGas: null, fuel: null, materials: null, techRnD: null, overheads: 0.5, margin: null, other: 0.8, total: 5 },
  { id: 11, name: 'Contractors', whiteCollar: 0.8, blueCollar: 3.2, elecGas: null, fuel: null, materials: null, techRnD: null, overheads: 0.4, margin: null, other: 0.2, total: 5 },
  { id: 12, name: 'Talent', whiteCollar: 1.2, blueCollar: null, elecGas: null, fuel: null, materials: null, techRnD: null, overheads: 0.2, margin: null, other: 0.2, total: 2 },
];

function TableBInflationType({ data }) {
  const rows = data || TABLE_B_DATA;
  function Cell({ val }) {
    if (val == null) return <span className="cb-ov-td cb-ov-val cb-cell-null">—</span>;
    const color = val < 0 ? '#22c55e' : val > 3 ? '#ef4444' : 'var(--label-primary)';
    return <span className="cb-ov-td cb-ov-val" style={{ color }}>{val.toFixed(1)}</span>;
  }
  return (
    <div className="cb-overview-table">
      <div className="cb-ov-thead cb-ov-thead-b">
        <span className="cb-ov-th cb-ov-name">NAME</span>
        <span className="cb-ov-th cb-ov-val">WHITE COLLAR</span>
        <span className="cb-ov-th cb-ov-val">BLUE COLLAR</span>
        <span className="cb-ov-th cb-ov-val">ELEC/GAS</span>
        <span className="cb-ov-th cb-ov-val">FUEL</span>
        <span className="cb-ov-th cb-ov-val">MATERIALS</span>
        <span className="cb-ov-th cb-ov-val">TECH/R&D</span>
        <span className="cb-ov-th cb-ov-val">OVERHEADS</span>
        <span className="cb-ov-th cb-ov-val">MARGIN</span>
        <span className="cb-ov-th cb-ov-val">OTHER</span>
        <span className="cb-ov-th cb-ov-val">TOTAL</span>
      </div>
      {rows.map((row, idx) => {
        const name = row.name || row.category_l2 || '';
        return (
          <div key={row.id || idx} className="cb-ov-row cb-ov-row-b">
            <span className="cb-ov-td cb-ov-name">{name}</span>
            <Cell val={row.whiteCollar ?? row.white_collar_m} />
            <Cell val={row.blueCollar ?? row.blue_collar_m} />
            <Cell val={row.elecGas ?? row.elec_gas_m} />
            <Cell val={row.fuel ?? row.fuel_m} />
            <Cell val={row.materials ?? row.materials_m} />
            <Cell val={row.techRnD ?? row.technology_m} />
            <Cell val={row.overheads ?? row.overheads_m} />
            <Cell val={row.margin ?? row.margin_m} />
            <Cell val={row.other ?? row.other_m} />
            <Cell val={row.total ?? row.total_m} />
          </div>
        );
      })}
    </div>
  );
}

// ─── Table C: Indices ───────────────────────────────────────────────────────────
const TABLE_C_DATA = [
  { id: 1, name: 'Commercial Deployment', labour: 6.9, cpi: 5.8, elecGas: null, fuel: 0.3, total: 13 },
  { id: 2, name: 'Facility Services & Supplies', labour: 6.6, cpi: 9.4, elecGas: 2.5, fuel: 0.4, total: 19 },
  { id: 3, name: 'Technology', labour: 1.7, cpi: 3.2, elecGas: null, fuel: null, total: 5 },
  { id: 4, name: 'Logistics', labour: -0.6, cpi: -0.2, elecGas: null, fuel: -0.1, total: -1 },
  { id: 5, name: 'Commercial Development', labour: 1.2, cpi: 0.7, elecGas: null, fuel: null, total: 2 },
  { id: 6, name: 'Corporate Communication', labour: 0.7, cpi: 0.3, elecGas: null, fuel: null, total: 1 },
  { id: 7, name: 'Travel & Internal Events', labour: 0.9, cpi: 1.7, elecGas: null, fuel: 0.1, total: 3 },
  { id: 8, name: 'Total Rewards', labour: null, cpi: null, elecGas: null, fuel: null, total: null },
  { id: 9, name: 'Fleet', labour: null, cpi: -0.7, elecGas: null, fuel: -0.1, total: -1 },
  { id: 10, name: 'Business Professional Services', labour: 3.6, cpi: 1.3, elecGas: null, fuel: null, total: 5 },
  { id: 11, name: 'Contractors', labour: 4.0, cpi: 0.6, elecGas: null, fuel: null, total: 5 },
  { id: 12, name: 'Talent', labour: 1.2, cpi: 0.4, elecGas: null, fuel: null, total: 2 },
];

function TableCIndices({ data }) {
  const rows = data || TABLE_C_DATA;
  function Cell({ val }) {
    if (val == null) return <span className="cb-ov-td cb-ov-val cb-cell-null">—</span>;
    const color = val < 0 ? '#22c55e' : val > 3 ? '#ef4444' : 'var(--label-primary)';
    return <span className="cb-ov-td cb-ov-val" style={{ color }}>{val.toFixed(1)}</span>;
  }
  return (
    <div className="cb-overview-table">
      <div className="cb-ov-thead cb-ov-thead-c">
        <span className="cb-ov-th cb-ov-name">NAME</span>
        <span className="cb-ov-th cb-ov-val">LABOUR</span>
        <span className="cb-ov-th cb-ov-val">CPI</span>
        <span className="cb-ov-th cb-ov-val">ELEC/GAS</span>
        <span className="cb-ov-th cb-ov-val">FUEL</span>
        <span className="cb-ov-th cb-ov-val">TOTAL</span>
      </div>
      {rows.map((row, idx) => {
        const name = row.name || row.category_l2 || '';
        return (
          <div key={row.id || idx} className="cb-ov-row cb-ov-row-c">
            <span className="cb-ov-td cb-ov-name">{name}</span>
            <Cell val={row.labour ?? row.labour_m} />
            <Cell val={row.cpi ?? row.cpi_m} />
            <Cell val={row.elecGas ?? row.elec_gas_m} />
            <Cell val={row.fuel ?? row.fuel_m} />
            <Cell val={row.total ?? row.total_m} />
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function InfCategoryBreakdown({ spendMechanics, categoryL2, grossInflationByCategory, grossInflationByCategoryL3, driverTableA, driverTableB, driverTableC, yearTrendByCategoryL2, onFollowUpPick, appliedFilters }) {
  const [activeDrivers, setActiveDrivers] = useState(COST_DRIVERS.map((d) => d.key));
  const [spendLevel, setSpendLevel] = useState('L2');
  const [trendTab, setTrendTab] = useState('Year Trend');
  const [tableTab, setTableTab] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Toggle a cost driver filter
  const toggleDriver = (key) => {
    setActiveDrivers((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };
  const selectAll = () => setActiveDrivers(COST_DRIVERS.map((d) => d.key));
  const selectNone = () => setActiveDrivers([]);

  // Build category data from API (grossInflationByCategory from section4) or fallback to mock
  const categoryData = useMemo(() => {
    if (grossInflationByCategory && grossInflationByCategory.length > 0) {
      return grossInflationByCategory.map((cat, i) => {
        const spend = cat.baseline_total_m || cat.baseline_m || 0;
        const grossInflation = cat.gross_inflation_total_m || cat.gross_inflation_m || 0;
        const costPrevention = cat.cost_prevention_total_m || cat.cost_prevention_m || cat.procurement_offset_m || 0;
        const netImpact = cat.net_inflation_total_m || cat.net_inflation_m || 0;
        const netImpactPct = spend > 0 ? (netImpact / spend) * 100 : 0;
        const finalCost = spend + netImpact;
        const risk = netImpactPct >= 10 ? 'High' : netImpactPct >= 6 ? 'Elevated' : netImpactPct >= 3 ? 'Moderate' : 'Low';

        // Map driver splits from API fields
        const whiteCollar = cat['baseline_White Collar_m'] || cat.driver_white_collar_m || 0;
        const blueCollar = cat['baseline_Blue Collar_m'] || cat.driver_blue_collar_m || 0;
        const elecGas = cat['baseline_Electricity/Gas_m'] || cat.driver_elec_gas_m || 0;
        const fuel = cat['baseline_Fuel_m'] || cat.driver_fuel_m || 0;
        const materials = cat['baseline_Materials_m'] || cat.driver_materials_m || 0;
        const techRnD = cat['baseline_Technology_m'] || cat.driver_technology_m || 0;
        const overheads = cat['baseline_Overheads_m'] || cat.driver_overheads_m || 0;
        const margin = cat['baseline_Margin_m'] || cat.driver_margin_m || 0;
        const other = cat['baseline_Other_m'] || cat.driver_other_m || 0;

        // Year trend — use yearTrendByCategoryL2 if available
        let netTrend = { 2025: 0, 2026: 0, 2027: 0 };
        if (yearTrendByCategoryL2 && yearTrendByCategoryL2.rows) {
          const trendRow = yearTrendByCategoryL2.rows.find(
            (r) => r.category_l2 === cat.category_l2
          );
          if (trendRow && trendRow.years) {
            const years = yearTrendByCategoryL2.years || Object.keys(trendRow.years).map(Number);
            years.forEach((y) => {
              if (trendRow.years[y] != null) netTrend[y] = trendRow.years[y];
            });
          }
        } else {
          // Estimate from current data
          netTrend = {
            2025: Number((netImpactPct * 0.7).toFixed(1)),
            2026: Number(netImpactPct.toFixed(1)),
            2027: Number((netImpactPct * 0.85).toFixed(1)),
          };
        }

        return {
          id: i + 1,
          name: cat.category_l2 || cat.name || `Category ${i + 1}`,
          spend,
          grossInflation,
          costPrevention,
          netImpact,
          netImpactPct: Number(netImpactPct.toFixed(1)),
          finalCost,
          risk,
          whiteCollar,
          blueCollar,
          elecGas,
          fuel,
          materials,
          techRnD,
          overheads,
          margin,
          other,
          netTrend,
        };
      }).sort((a, b) => b.spend - a.spend);
    }
    return CATEGORY_DATA;
  }, [grossInflationByCategory, yearTrendByCategoryL2]);

  // Build Table A data from API
  const tableAData = useMemo(() => {
    if (driverTableA && driverTableA.length > 0) return driverTableA;
    return TABLE_A_DATA;
  }, [driverTableA]);

  // Build Table B data from API
  const tableBData = useMemo(() => {
    if (driverTableB && driverTableB.length > 0) return driverTableB;
    return TABLE_B_DATA;
  }, [driverTableB]);

  // Build Table C data from API
  const tableCData = useMemo(() => {
    if (driverTableC && driverTableC.length > 0) return driverTableC;
    return TABLE_C_DATA;
  }, [driverTableC]);

  // Dynamic years from yearTrendByCategoryL2 or default
  const trendYears = useMemo(() => {
    if (yearTrendByCategoryL2?.years) return yearTrendByCategoryL2.years;
    return [2025, 2026, 2027];
  }, [yearTrendByCategoryL2]);

  // Filter categories by search
  const filteredData = categoryData.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Max spend for bar scaling
  const maxSpend = Math.max(...filteredData.map((c) => {
    return COST_DRIVERS
      .filter((d) => activeDrivers.includes(d.key))
      .reduce((sum, d) => sum + Math.max(0, c[d.key] || 0), 0);
  }), 1);

  return (
    <div className="cb-container">
      {/* Section 1: Two side-by-side panels */}
      <div className="cb-spend-mix-section">
        <div className="cb-spend-mix-grid">
          {/* LEFT PANEL: Spend & cost-driver mix */}
          <div className="cb-spend-mix-left-panel">
            <div className="cb-panel-header">
              <div>
                <h3 className="cb-panel-title">Spend & cost-driver mix</h3>
                <p className="cb-panel-desc">
                  Bar length = baseline spend, split by cost driver. Right: net inflation impact (lass). Click a bar to select it — it narrows the market breakdown too.
                </p>
              </div>
              <div className="cb-panel-controls">
                <div className="cb-level-btns">
                  {['L2', 'L3'].map((l) => (
                    <button
                      key={l}
                      className={'cb-level-btn' + (l === spendLevel ? ' active' : '')}
                      onClick={() => setSpendLevel(l)}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <button className="cb-select-all-btn" onClick={selectAll}>Select all</button>
              </div>
            </div>

            {/* Search + Continue to L3 row */}
            <div className="cb-search-row">
              <div className="cb-search-wrap">
                <Icon name="search" size={14} className="cb-search-icon" />
                <input
                  className="cb-search-input"
                  placeholder={`Search ${spendLevel} categories...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                className={'cb-continue-btn' + (spendLevel === 'L3' ? ' disabled' : '')}
                onClick={() => setSpendLevel('L3')}
                disabled={spendLevel === 'L3'}
              >
                Continue to L3 →
              </button>
            </div>

            {/* Horizontal bars */}
            <div className="cb-spend-mix-bars">
              {filteredData.map((cat) => (
                <SpendBar key={cat.id} cat={cat} maxSpend={maxSpend} activeDrivers={activeDrivers} />
              ))}
            </div>

            {/* Cost driver legend at bottom */}
            <div className="cb-driver-legend">
              <span className="cb-driver-legend-label">Cost drivers</span>
              <span className="cb-driver-legend-actions">
                <button className="cb-driver-legend-action" onClick={selectAll}>All</button>
                <span className="cb-driver-legend-sep">|</span>
                <button className="cb-driver-legend-action cb-driver-legend-none" onClick={selectNone}>None</button>
              </span>
              <div className="cb-driver-legend-items">
                {COST_DRIVERS.map((d) => {
                  const isActive = activeDrivers.includes(d.key);
                  return (
                    <label key={d.key} className={'cb-driver-legend-item' + (isActive ? '' : ' dimmed')} onClick={() => toggleDriver(d.key)}>
                      <span className="cb-driver-legend-swatch" style={{ background: d.color }} />
                      <span className="cb-driver-legend-text">{d.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Net impact trend */}
          <div className="cb-spend-mix-right-panel">
            <div className="cb-panel-header">
              <div>
                <h3 className="cb-panel-title">Net impact trend, % of spend</h3>
                <p className="cb-panel-desc">All three forecast years, current view level (independent of the Year filter above).</p>
              </div>
              <div className="cb-trend-tabs">
                {['Year Trend', 'Ranges'].map((t) => (
                  <button
                    key={t}
                    className={'cb-trend-tab' + (t === trendTab ? ' active' : '')}
                    onClick={() => setTrendTab(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <NetImpactTrend data={filteredData} trendTab={trendTab} years={trendYears} />
            {/* Lower Impact → Higher Impact gradient bar */}
            <div className="cb-trend-gradient">
              <span className="cb-trend-gradient-label">Lower Impact</span>
              <div className="cb-trend-gradient-bar" />
              <span className="cb-trend-gradient-label">Higher Impact</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Categories (L2) table with tabs */}
      <div className="cb-categories-section">
        {/* Table header with tabs */}
        <div className="cb-table-header">
          <div className="cb-table-header-left">
            <h3 className="cb-table-title">Categories (L2)</h3>
            <p className="cb-table-subtitle">Click a column to sort</p>
          </div>
          <div className="cb-table-tabs">
            {['Overview', 'Table A: IM&S Summary', 'Table B: Inflation Type', 'Table C: Indices'].map((t) => (
              <button
                key={t}
                className={'cb-table-tab' + (t === tableTab ? ' active' : '')}
                onClick={() => setTableTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Table content based on active tab */}
        <div className="cb-table-content">
          {tableTab === 'Overview' && <OverviewTable data={filteredData} />}
          {tableTab === 'Table A: IM&S Summary' && <TableAIMSSummary data={tableAData} />}
          {tableTab === 'Table B: Inflation Type' && <TableBInflationType data={tableBData} />}
          {tableTab === 'Table C: Indices' && <TableCIndices data={tableCData} />}
        </div>
      </div>

      {/* Footnote */}
      <div className="cb-footnote">
        <p className="cb-footnote-text">
          Prototype data note: figures are aggregated from the pipeline export (Indirect Materials & Services, ~72.7k line items) into one line-item table keyed by Team / Category L2 / Category L3 / Region / Cluster / Country / Sievo vendor country / Year. The "Viewing" banner above always states the full current scope; the KPI row and both breakdowns share it, so a selection in either the bar charts or the Filters panel narrows everything else at once. Selected rows are also highlighted (and grouped near the top) in the trend heatmap and detail table, to make it easier to match items across sections. Cost-driver mix reflects the <strong>Base</strong> scenario baseline split; Best/Worst figures shown alongside Base throughout are the same three scenarios, always shown together now rather than toggled by a filter. "Risk" pills are an illustrative threshold (net impact as % of spend: &lt;3% low, 3–6% moderate, 6–10% elevated, ≥10% high) — confirm the right cut-offs before this goes further. Saved views are stored in this browser only (localStorage) — they won't follow you to another device or browser.
        </p>
      </div>
    </div>
  );
}
