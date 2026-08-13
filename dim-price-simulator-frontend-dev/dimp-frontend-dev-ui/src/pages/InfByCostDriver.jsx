// InfByCostDriver.jsx — "Inflation by cost driver" horizontal stacked bar
// Shows how inflation splits across the underlying cost drivers,
// proportional to each driver's baseline spend share.
// Toggle between Gross Inflation (before mitigation) and Net Inflation (after mitigation).
import React, { useState } from 'react';
import './infByCostDriver.css';

const COST_DRIVERS = [
  { key: 'White Collar', label: 'White collar (labour / CPI)', color: '#6366f1' },
  { key: 'Blue Collar', label: 'Blue collar', color: '#f97316' },
  { key: 'Margin', label: 'Margin', color: '#ef4444' },
  { key: 'Overheads', label: 'Overheads', color: '#14b8a6' },
  { key: 'Materials', label: 'Materials', color: '#3b82f6' },
  { key: 'Technology', label: 'Technology / R&D / assets', color: '#a855f7' },
  { key: 'Fuel', label: 'Fuel', color: '#eab308' },
  { key: 'Other', label: 'Other', color: '#64748b' },
  { key: 'Electricity/Gas', label: 'Electricity / gas', color: '#10b981' },
];

function fmtM(v) {
  if (v == null || isNaN(v)) return '$0.0M';
  return '$' + Math.abs(v).toFixed(1) + 'M';
}

export default function InfByCostDriver({ driverWeights, spendMechanics }) {
  const [mode, setMode] = useState('gross'); // 'gross' | 'net'

  if (!driverWeights || !spendMechanics) return null;

  const totalM = mode === 'gross'
    ? (spendMechanics.gross_inflation_m || 0)
    : (spendMechanics.net_inflation_m || 0);

  // Compute each driver's $ amount and % share
  const drivers = COST_DRIVERS
    .map((d) => {
      const pct = driverWeights[d.key] || 0;
      const amt = (pct / 100) * totalM;
      return { ...d, pct, amt };
    })
    .filter((d) => d.pct > 0);

  const totalPct = drivers.reduce((s, d) => s + d.pct, 0);

  return (
    <div className="inf-bcd-card">
      <div className="inf-bcd-header">
        <h3 className="inf-bcd-title">Inflation by cost driver</h3>
        <div className="inf-bcd-toggle">
          <button
            className={'inf-bcd-toggle-btn' + (mode === 'gross' ? ' active' : '')}
            onClick={() => setMode('gross')}
          >Gross Inflation</button>
          <button
            className={'inf-bcd-toggle-btn' + (mode === 'net' ? ' active' : '')}
            onClick={() => setMode('net')}
          >Net Inflation</button>
        </div>
      </div>

      <p className="inf-bcd-desc">
        How inflation splits across the underlying cost drivers, proportional to each driver's baseline spend share.
        Toggle between Gross Inflation (before mitigation) and Net Inflation (after mitigation).
      </p>

      {/* Stacked horizontal bar */}
      <div className="inf-bcd-bar-wrap">
        <div className="inf-bcd-bar">
          {drivers.map((d) => (
            <div
              key={d.key}
              className="inf-bcd-seg"
              style={{ width: (d.pct / totalPct) * 100 + '%', background: d.color }}
              title={`${d.label}: ${fmtM(d.amt)} (${d.pct.toFixed(1)}%)`}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="inf-bcd-legend">
        {drivers.map((d) => (
          <span key={d.key} className="inf-bcd-legend-item">
            <span className="inf-bcd-legend-dot" style={{ background: d.color }} />
            <span className="inf-bcd-legend-label">{d.label}</span>
            <span className="inf-bcd-legend-val">{fmtM(d.amt)}</span>
            <span className="inf-bcd-legend-pct">({d.pct.toFixed(1)}%)</span>
          </span>
        ))}
      </div>
    </div>
  );
}
