import React, { Fragment, useState } from 'react';
import './BreakdownPanel.css';
import {
  DRIVERS,
  SCENARIOS,
  TABLE_DEFS,
  computeBucketValue,
  fmtUSD,
  fmtPct,
  riskLevel,
  RISK_LABEL,
  emptyAgg,
  addRow,
  groupBy,
  selState,
  toggleGroup,
  withSelectionOrder,
  driverShare,
  heatmapColorFor,
  heatmapInkFor,
} from './breakdownData';

function SegmentedControl({ options, value, onChange, labelFn, small }) {
  return (
    <div className={`segmented${small ? ' small' : ''}`}>
      {options.map((opt) => (
        <button key={opt} type="button" className={opt === value ? 'active' : ''} onClick={() => onChange(opt)}>
          {labelFn ? labelFn(opt) : opt}
        </button>
      ))}
    </div>
  );
}

function SelectAllButton({ labels, filterSet, itemsForFn, onChange }) {
  if (labels.length === 0) return null;
  const allSelected = labels.every((l) => selState(filterSet, itemsForFn(l)) === 'full');
  return (
    <button
      type="button"
      className={`select-all-btn${allSelected ? ' all-selected' : ''}`}
      onClick={() => {
        const next = new Set(filterSet);
        if (allSelected) labels.forEach((l) => itemsForFn(l).forEach((x) => next.delete(x)));
        else labels.forEach((l) => itemsForFn(l).forEach((x) => next.add(x)));
        onChange(next);
      }}
    >
      {allSelected ? 'Deselect all' : 'Select all'}
    </button>
  );
}

function SearchContinueBar({ value, placeholder, onChange, continueBtn }) {
  return (
    <div className="filter-search-row">
      <div className="filter-search-input-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          type="text"
          className="filter-search-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {continueBtn && (
        <button type="button" className="pending-continue-btn" disabled={!continueBtn.enabled} onClick={continueBtn.onClick}>
          {continueBtn.label}
        </button>
      )}
    </div>
  );
}

function DriverLegend({ enabledDrivers, onChange }) {
  return (
    <div className="driver-filter">
      <div className="driver-filter-head">
        <span className="driver-filter-label">Cost drivers</span>
        <div className="driver-filter-actions">
          <button type="button" className="driver-filter-action all" onClick={() => onChange(new Set(DRIVERS.map((d) => d.key)))}>
            All
          </button>
          <span className="driver-filter-sep">|</span>
          <button type="button" className="driver-filter-action none" onClick={() => onChange(new Set())}>
            None
          </button>
        </div>
      </div>
      <div className="driver-filter-box" style={{ gridTemplateColumns: `repeat(${Math.ceil(DRIVERS.length / 2)}, max-content)` }}>
        {DRIVERS.map((d) => {
          const on = enabledDrivers.has(d.key);
          return (
            <label key={d.key} className={`driver-filter-item${on ? '' : ' off'}`}>
              <input
                type="checkbox"
                className="driver-filter-checkbox"
                checked={on}
                onChange={() => {
                  const next = new Set(enabledDrivers);
                  if (on) next.delete(d.key);
                  else next.add(d.key);
                  onChange(next);
                }}
              />
              <span className="driver-filter-swatch" style={{ background: `var(${d.v})` }} />
              <span>{d.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// Bar length only counts drivers currently enabled - deselecting a driver
// shrinks every bar (and the scale they're all judged against), not just
// the color of its own segment.
function BarList({ map, onToggle, selStateFn, subLabelFn, parentFn, enabledDrivers }) {
  const rawEntries = Array.from(map.entries()).map(([label, agg]) => ({
    label,
    agg,
    total: DRIVERS.reduce((s, d) => (enabledDrivers.has(d.key) ? s + agg.drivers[d.key] : s), 0),
  }));
  const entries = withSelectionOrder(rawEntries, selStateFn, parentFn);
  const maxTotal = Math.max(1, ...entries.map((e) => e.total));

  if (entries.length === 0) {
    return (
      <div className="bar-list">
        <div className="card-note" style={{ padding: '12px 0' }}>
          No rows match the current filters.
        </div>
      </div>
    );
  }

  return (
    <div className="bar-list">
      {entries.map((e) => {
        const sel = selStateFn(e.label);
        const share = driverShare(e.agg, enabledDrivers);
        const val = e.agg.netimpact.Base * share;
        const pct = e.agg.spend > 0 ? ((e.agg.netimpact.Base * share) / e.agg.spend) * 100 : 0;
        const sub = subLabelFn ? subLabelFn(e.label) : null;
        const widthPct = (e.total / maxTotal) * 100;
        return (
          <div
            key={e.label}
            className={`bar-row${sel === 'full' ? ' selected' : sel === 'partial' ? ' partial' : ''}`}
            role="checkbox"
            aria-checked={sel !== 'none'}
            tabIndex={0}
            onClick={() => onToggle(e.label)}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                onToggle(e.label);
              }
            }}
          >
            <div className="bar-label-wrap">
              <div className="bar-label" title={e.label}>
                {e.label}
              </div>
              {sub && <div className="bar-sublabel">{sub}</div>}
            </div>
            <div className="bar-track">
              {DRIVERS.filter((d) => enabledDrivers.has(d.key) && e.agg.drivers[d.key] > 0).map((d) => (
                <div
                  key={d.key}
                  className="bar-seg"
                  style={{ width: `${(e.agg.drivers[d.key] / maxTotal) * 100}%`, background: `var(${d.v})` }}
                  title={`${d.label}: ${fmtUSD(e.agg.drivers[d.key])}`}
                />
              ))}
              <div style={{ width: `${100 - widthPct}%` }} />
            </div>
            <div
              className="bar-meta"
              title={`Net impact (Base): ${fmtUSD(val)} (${fmtPct(pct, 2)} of spend) · Best ${fmtUSD(e.agg.netimpact.Best * share)} · Worst ${fmtUSD(e.agg.netimpact.Worst * share)}${share < 1 ? ` (${fmtPct(share * 100, 0)} of driver baseline selected)` : ''}`}
            >
              <b>{fmtUSD(val)}</b> &nbsp;·&nbsp; {fmtPct(pct)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function buildByLabelYear(rows, dimKey) {
  const byLabelYear = new Map();
  rows.forEach((r) => {
    const label = dimKey(r);
    if (!byLabelYear.has(label)) byLabelYear.set(label, {});
    if (!byLabelYear.get(label)[r.year]) byLabelYear.get(label)[r.year] = emptyAgg();
    addRow(byLabelYear.get(label)[r.year], r);
  });
  return byLabelYear;
}

function YearTrendGrid({ byLabelYear, labels, years, selStateFn }) {
  let maxPct = 0.0001;
  labels.forEach((l) =>
    years.forEach((y) => {
      const agg = byLabelYear.get(l)[y];
      if (agg && agg.spend > 0) maxPct = Math.max(maxPct, (agg.netimpact.Base / agg.spend) * 100);
    })
  );
  maxPct = Math.min(Math.max(maxPct, 5), 25);

  return (
    <div className="heatmap" style={{ gridTemplateColumns: `148px repeat(${years.length}, minmax(64px,1fr))` }}>
      <div />
      {years.map((y) => (
        <div key={y} className="hm-collabel">
          {y}
        </div>
      ))}
      {labels.map((label) => {
        const sel = selStateFn(label);
        return (
          <Fragment key={label}>
            <div className={`hm-rowlabel${sel === 'full' ? ' selected' : sel === 'partial' ? ' partial' : ''}`} title={label}>
              {label}
            </div>
            {years.map((y) => {
              const agg = byLabelYear.get(label)[y];
              if (agg && agg.spend > 0) {
                const pct = (agg.netimpact.Base / agg.spend) * 100;
                const varName = heatmapColorFor(pct, maxPct);
                return (
                  <div
                    key={y}
                    className="hm-cell"
                    style={{ background: `var(${varName})`, color: heatmapInkFor(varName) }}
                    title={`${label} · ${y}: ${fmtPct(pct, 2)} of spend (Base)`}
                  >
                    {fmtPct(pct, 1)}
                  </div>
                );
              }
              return (
                <div key={y} className="hm-cell" style={{ background: 'var(--bp-gridline)', color: 'var(--bp-text-secondary)' }}>
                  —
                </div>
              );
            })}
          </Fragment>
        );
      })}
    </div>
  );
}

function ScenarioHeatmapGrid({ byLabelYear, labels, year, selStateFn }) {
  let maxPct = 0.0001;
  labels.forEach((l) => {
    const agg = byLabelYear.get(l)[year];
    if (agg && agg.spend > 0)
      SCENARIOS.forEach((S) => {
        maxPct = Math.max(maxPct, (agg.netimpact[S] / agg.spend) * 100);
      });
  });
  maxPct = Math.min(Math.max(maxPct, 5), 25);

  return (
    <div className="heatmap" style={{ gridTemplateColumns: `148px repeat(${SCENARIOS.length}, minmax(64px,1fr))` }}>
      <div />
      {SCENARIOS.map((S) => (
        <div key={S} className={`hm-collabel${S === 'Base' ? ' base-col' : ''}`} title={S === 'Base' ? 'Base scenario - the primary value' : `${S} scenario`}>
          {S}
        </div>
      ))}
      {labels.map((label) => {
        const sel = selStateFn(label);
        const agg = byLabelYear.get(label)[year];
        return (
          <Fragment key={label}>
            <div className={`hm-rowlabel${sel === 'full' ? ' selected' : sel === 'partial' ? ' partial' : ''}`} title={label}>
              {label}
            </div>
            {SCENARIOS.map((S) => {
              if (agg && agg.spend > 0) {
                const pct = (agg.netimpact[S] / agg.spend) * 100;
                const varName = heatmapColorFor(pct, maxPct);
                return (
                  <div
                    key={S}
                    className={`hm-cell${S === 'Base' ? ' base-col' : ''}`}
                    style={{ background: `var(${varName})`, color: heatmapInkFor(varName) }}
                    title={`${label} · ${S} (${year}): ${fmtPct(pct, 2)} of spend`}
                  >
                    {fmtPct(pct, 1)}
                  </div>
                );
              }
              return (
                <div key={S} className={`hm-cell${S === 'Base' ? ' base-col' : ''}`} style={{ background: 'var(--bp-gridline)', color: 'var(--bp-text-secondary)' }}>
                  —
                </div>
              );
            })}
          </Fragment>
        );
      })}
    </div>
  );
}

// Shared scale across all rows, sorted by Base magnitude (largest first),
// with a tick marking exactly where Base sits inside the Best-Worst bar.
function SpreadRangesList({ byLabelYear, labels, year, selStateFn }) {
  const withVals = labels
    .map((label) => {
      const agg = byLabelYear.get(label)[year];
      if (!agg || agg.spend <= 0) return null;
      return { label, best: agg.netimpact.Best, base: agg.netimpact.Base, worst: agg.netimpact.Worst };
    })
    .filter(Boolean)
    .sort((a, b) => Math.abs(b.base) - Math.abs(a.base));

  if (withVals.length === 0) {
    return (
      <div className="card-note" style={{ padding: '12px 0' }}>
        No rows match the current filters.
      </div>
    );
  }

  const axisLo = Math.min(0, ...withVals.map((r) => Math.min(r.best, r.worst)));
  const axisHi = Math.max(...withVals.map((r) => Math.max(r.best, r.worst))) * 1.05 || 1;
  const span = axisHi - axisLo || 1;
  const pctOf = (v) => Math.max(0, Math.min(100, ((v - axisLo) / span) * 100));

  return (
    <div className="spread-list">
      {withVals.map((r) => {
        const sel = selStateFn(r.label);
        const lo = Math.min(r.best, r.worst);
        const hi = Math.max(r.best, r.worst);
        const loPct = pctOf(lo);
        const hiPct = pctOf(hi);
        const basePct = pctOf(r.base);
        return (
          <div key={r.label} className="spread-row">
            <div className={`spread-label${sel === 'full' ? ' selected' : sel === 'partial' ? ' partial' : ''}`} title={r.label}>
              {r.label}
            </div>
            <div className="spread-track" title={`${r.label} · ${year}: Best ${fmtUSD(r.best)} · Base ${fmtUSD(r.base)} · Worst ${fmtUSD(r.worst)}`}>
              <div className="spread-fill" style={{ left: `${loPct}%`, width: `${Math.max(1.5, hiPct - loPct)}%` }} />
              <div className="spread-base-tick" style={{ left: `${basePct}%` }} />
            </div>
            <div className="spread-value">
              <b>{fmtUSD(r.base)}</b> <span className="lohi">({fmtUSD(r.best)}–{fmtUSD(r.worst)})</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Same card in every state: Year Trend shows the 3 forecast years; Ranges
// re-uses the identical heatmap look for Best/Base/Worst of the current
// Year, or (Spread Ranges) one floating bar per row on a shared scale.
function NetImpactCard({ ownRowsAllYears, years, year, dimKey, labelOrder, selStateFn, mode, onModeChange, rangesView, onRangesViewChange }) {
  const byLabelYear = buildByLabelYear(ownRowsAllYears, dimKey);
  const labels = labelOrder.filter((l) => byLabelYear.has(l));

  let title = 'Net impact trend, % of spend';
  let note = 'All three forecast years, current view level (independent of the Year filter above).';
  let showScale = true;
  let showSpreadLegend = false;
  if (mode === 'ranges') {
    title = 'Net impact by scenario, % of spend';
    if (rangesView === 'heatmap') {
      note = `Best, Base, and Worst scenario values for ${year}, current view level - the Base column is outlined as the primary value.`;
    } else {
      note = `Base value and Best–Worst range for ${year}, current view level — sorted by Base, largest first.`;
      showScale = false;
      showSpreadLegend = true;
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">{title}</div>
          <div className="card-note">{note}</div>
        </div>
        <div className="card-head-actions">
          <SegmentedControl options={['trend', 'ranges']} value={mode} onChange={onModeChange} labelFn={(m) => (m === 'trend' ? 'Year Trend' : 'Ranges')} small />
        </div>
      </div>
      {mode === 'ranges' && (
        <div className="hm-subtabs">
          <SegmentedControl
            options={['heatmap', 'spread']}
            value={rangesView}
            onChange={onRangesViewChange}
            labelFn={(v) => (v === 'heatmap' ? 'Heat Map' : 'Spread Ranges')}
            small
          />
        </div>
      )}
      <div className="heatmap-wrap">
        {mode === 'trend' ? (
          <YearTrendGrid byLabelYear={byLabelYear} labels={labels} years={years} selStateFn={selStateFn} />
        ) : rangesView === 'heatmap' ? (
          <ScenarioHeatmapGrid byLabelYear={byLabelYear} labels={labels} year={year} selStateFn={selStateFn} />
        ) : (
          <SpreadRangesList byLabelYear={byLabelYear} labels={labels} year={year} selStateFn={selStateFn} />
        )}
      </div>
      {showScale && (
        <div className="hm-scale">
          <span>Lower impact</span>
          <div className="hm-scale-track" />
          <span>Higher impact</span>
        </div>
      )}
      {showSpreadLegend && (
        <div className="legend">
          <div className="legend-item">
            <span className="legend-swatch" style={{ background: 'color-mix(in srgb, var(--bp-accent) 60%, var(--bp-seq-400))', width: 14, borderRadius: 3 }} />
            Best–Worst range
          </div>
          <div className="legend-item">
            <span className="legend-swatch" style={{ background: 'var(--bp-text-primary)', width: 3, height: 12, borderRadius: 1 }} />
            Base
          </div>
        </div>
      )}
    </div>
  );
}

const TABLE_COLS = [
  { key: 'label', label: 'Name' },
  { key: 'spend', label: 'Spend' },
  { key: 'gross', label: 'Gross inflation' },
  { key: 'prevention', label: 'Cost prevention' },
  { key: 'netimpact', label: 'Net impact' },
  { key: 'netpct', label: 'Net impact %' },
  { key: 'final', label: 'Final cost' },
  { key: 'risk', label: 'Risk' },
];

// Table stays single-value (Base) per cell - Best/Worst ranges live in the
// KPI row and the heatmap card's Ranges view instead, to keep this grid
// readable.
function OverviewTable({ map, sortState, onSort, selStateFn, parentFn }) {
  const rows = Array.from(map.entries()).map(([label, agg]) => {
    const netpct = agg.spend > 0 ? (agg.netimpact.Base / agg.spend) * 100 : 0;
    return {
      label,
      sel: selStateFn(label),
      netpct,
      spend: agg.spend,
      baseline: agg.baseline.Base,
      gross: agg.gross.Base,
      prevention: agg.prevention.Base,
      netimpact: agg.netimpact.Base,
      final: agg.final.Base,
    };
  });
  rows.sort((a, b) => {
    const selA = a.sel !== 'none';
    const selB = b.sel !== 'none';
    if (selA !== selB) return selA ? -1 : 1;
    if (selA && selB && parentFn) {
      const pa = parentFn(a.label) || '';
      const pb = parentFn(b.label) || '';
      if (pa !== pb) return pa.localeCompare(pb);
    }
    const k = sortState.key;
    const av = k === 'label' ? a.label : k === 'risk' ? a.netpct : a[k];
    const bv = k === 'label' ? b.label : k === 'risk' ? b.netpct : b[k];
    if (typeof av === 'string') return av.localeCompare(bv) * sortState.dir;
    return (av - bv) * sortState.dir;
  });

  return (
    <table className="data-table">
      <thead>
        <tr>
          {TABLE_COLS.map((c) => (
            <th key={c.key} className={sortState.key === c.key ? 'sorted' : ''} onClick={() => onSort(c.key)}>
              {c.label}
              {sortState.key === c.key ? (sortState.dir === 1 ? ' ▲' : ' ▼') : ''}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const level = riskLevel(r.netpct);
          return (
            <tr key={r.label} className={r.sel === 'full' ? 'selected' : r.sel === 'partial' ? 'partial' : ''}>
              <td>{r.label}</td>
              <td>{fmtUSD(r.spend)}</td>
              <td>{fmtUSD(r.gross)}</td>
              <td>{fmtUSD(r.prevention)}</td>
              <td>{fmtUSD(r.netimpact)}</td>
              <td>{fmtPct(r.netpct)}</td>
              <td>{fmtUSD(r.final)}</td>
              <td>
                <span className={`pill pill-${level}`}>{RISK_LABEL[level]}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function fmtBucket(v) {
  if (v === null) return '—';
  return (v === 0 ? 0 : v).toFixed(1);
}

function BucketTable({ map, tableKey, selStateFn, parentFn }) {
  const def = TABLE_DEFS[tableKey];
  const rows = withSelectionOrder(
    Array.from(map.entries()).map(([label, agg]) => ({ label, agg, total: DRIVERS.reduce((s, d) => s + agg.drivers[d.key], 0) })),
    selStateFn,
    parentFn
  );
  const groupTotals = def.groups.map(() => 0);
  let grandNetImpact = 0;
  const bodyRows = rows.map((r, i) => {
    const sel = selStateFn(r.label);
    const cells = def.groups.map((g, gi) => {
      const val = computeBucketValue(r.agg, g.keys);
      if (val !== null) groupTotals[gi] += val;
      return val;
    });
    grandNetImpact += r.agg.netimpact.Base;
    return { i, label: r.label, sel, cells, net: r.agg.netimpact.Base };
  });

  return (
    <table className="data-table bucket-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          {def.groups.map((g) => (
            <th key={g.label}>{g.label}</th>
          ))}
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {bodyRows.map((r) => (
          <tr key={r.label} className={r.sel === 'full' ? 'selected' : r.sel === 'partial' ? 'partial' : ''}>
            <td>{r.i + 1}</td>
            <td>{r.label}</td>
            {r.cells.map((v, ci) => (
              <td key={ci}>{fmtBucket(v)}</td>
            ))}
            <td>{fmtUSD(r.net)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td>Σ</td>
          <td>Grand total</td>
          {groupTotals.map((v, i) => (
            <td key={i}>{fmtBucket(v)}</td>
          ))}
          <td>{fmtUSD(grandNetImpact)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

const TABLE_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'A', label: 'Table A: IM&S Summary' },
  { key: 'B', label: 'Table B: Inflation Type' },
  { key: 'C', label: 'Table C: Indices' },
];

function DetailTableCard({ title, map, tableTab, onTableTabChange, sortState, onSort, selStateFn, parentFn }) {
  const note = tableTab === 'overview' ? 'Click a column to sort' : TABLE_DEFS[tableTab].note;
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">{title}</div>
          <div className="card-note">{note}</div>
        </div>
        <div className="table-tabs">
          {TABLE_TABS.map((t) => (
            <button key={t.key} type="button" className={tableTab === t.key ? 'active' : ''} onClick={() => onTableTabChange(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="table-wrap">
        {tableTab === 'overview' ? (
          <OverviewTable map={map} sortState={sortState} onSort={onSort} selStateFn={selStateFn} parentFn={parentFn} />
        ) : (
          <BucketTable map={map} tableKey={tableTab} selStateFn={selStateFn} parentFn={parentFn} />
        )}
      </div>
    </div>
  );
}

// `getOwnRows(allYears)` must return rows already filtered by Year/Team/
// Market/Vendor but NOT Category (the panel applies its own L2 scope on
// top) - this mirrors catOwnRows() in the original, just handed in instead
// of read off a global store.
export function CategoryBreakdownPanel({
  catFilter,
  onCatFilterChange,
  l2ToL3s,
  l3ToL2,
  getOwnRows,
  years,
  year,
  enabledDrivers,
  onEnabledDriversChange,
}) {
  const [viewLevel, setViewLevel] = useState('L2');
  const [scopeL2, setScopeL2] = useState(new Set());
  const [search, setSearch] = useState({ L2: '', L3: '' });
  const [sort, setSort] = useState({ key: 'baseline', dir: -1 });
  const [heatmapMode, setHeatmapMode] = useState('trend');
  const [rangesView, setRangesView] = useState('heatmap');
  const [tableTab, setTableTab] = useState('overview');

  const atL3 = viewLevel === 'L3';
  const dimKey = (r) => (atL3 ? r.l3 : r.l2);
  const itemsForLabel = (label) => (atL3 ? [label] : l2ToL3s[label] || []);
  const selFn = (label) => selState(catFilter, itemsForLabel(label));
  const subLabelFn = (label) => (atL3 && scopeL2.size === 0 ? l3ToL2[label] : null);
  const parentFn = subLabelFn;

  // Wrap onCatFilterChange so that when the filter is fully cleared at L3
  // level, the scopeL2 is also cleared — showing ALL L3 categories instead
  // of staying scoped to the previously drilled-into L2s.
  const handleCatFilterChange = (nextSet) => {
    if (atL3 && nextSet.size === 0) {
      setScopeL2(new Set());
    }
    onCatFilterChange(nextSet);
  };

  const ownRows = getOwnRows(false);
  const scopedRows = atL3 && scopeL2.size > 0 ? ownRows.filter((r) => scopeL2.has(r.l2)) : ownRows;
  const map = groupBy(scopedRows, dimKey);

  const ownRowsAllYears = getOwnRows(true);
  const scopedRowsAllYears = atL3 && scopeL2.size > 0 ? ownRowsAllYears.filter((r) => scopeL2.has(r.l2)) : ownRowsAllYears;

  const term = search[viewLevel].trim().toLowerCase();
  const filteredMap = term ? new Map(Array.from(map.entries()).filter(([label]) => label.toLowerCase().includes(term))) : map;

  const orderedLabels = withSelectionOrder(
    Array.from(map.entries()).map(([label, agg]) => ({ label, total: DRIVERS.reduce((s, d) => s + agg.drivers[d.key], 0) })),
    selFn,
    parentFn
  ).map((e) => e.label);

  const selectedLabelsAtLevel = Array.from(map.keys()).filter((l) => selFn(l) !== 'none');

  const scopeLabel = atL3
    ? scopeL2.size > 0
      ? `Showing L3 sub-categories within: ${Array.from(scopeL2).join(', ')}.`
      : 'Showing all L3 sub-categories, across every L2 (parent shown under each name).'
    : '';

  const tableTitle = !atL3 ? 'Categories (L2)' : scopeL2.size > 0 ? `Sub-categories in ${Array.from(scopeL2).join(', ')}` : 'All sub-categories (L3)';

  function onSort(key) {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir * -1 } : { key, dir: -1 }));
  }

  return (
    <div>
      <div className="panel-grid">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Spend &amp; cost-driver mix</div>
              <div className="card-note">
                Bar length = baseline spend, split by cost driver. Right: net inflation impact (Base). Click a bar to select it — it narrows the market
                breakdown too.
              </div>
            </div>
            <div className="card-head-actions">
              <SegmentedControl
                options={['L2', 'L3']}
                value={viewLevel}
                onChange={(lvl) => {
                  setViewLevel(lvl);
                  setScopeL2(new Set());
                }}
                small
              />
              <SelectAllButton labels={Array.from(filteredMap.keys())} filterSet={catFilter} itemsForFn={itemsForLabel} onChange={handleCatFilterChange} />
            </div>
          </div>
          <div className="scope-label">{scopeLabel}</div>
          <SearchContinueBar
            value={search[viewLevel]}
            placeholder={atL3 ? 'Search L3 sub-categories…' : 'Search L2 categories…'}
            onChange={(v) => setSearch((prev) => ({ ...prev, [viewLevel]: v }))}
            continueBtn={
              atL3
                ? null
                : {
                    label: 'Continue to L3 →',
                    enabled: selectedLabelsAtLevel.length > 0,
                    onClick: () => {
                      setScopeL2(new Set(selectedLabelsAtLevel));
                      setViewLevel('L3');
                    },
                  }
            }
          />
          <BarList
            map={filteredMap}
            onToggle={(label) => handleCatFilterChange(toggleGroup(catFilter, itemsForLabel(label)))}
            selStateFn={selFn}
            subLabelFn={subLabelFn}
            parentFn={parentFn}
            enabledDrivers={enabledDrivers}
          />
          <DriverLegend enabledDrivers={enabledDrivers} onChange={onEnabledDriversChange} />
        </div>
        <NetImpactCard
          ownRowsAllYears={scopedRowsAllYears}
          years={years}
          year={year}
          dimKey={dimKey}
          labelOrder={orderedLabels}
          selStateFn={selFn}
          mode={heatmapMode}
          onModeChange={setHeatmapMode}
          rangesView={rangesView}
          onRangesViewChange={setRangesView}
        />
      </div>
      <DetailTableCard
        title={tableTitle}
        map={map}
        tableTab={tableTab}
        onTableTabChange={setTableTab}
        sortState={sort}
        onSort={onSort}
        selStateFn={selFn}
        parentFn={parentFn}
      />
    </div>
  );
}

export function MarketBreakdownPanel({
  mktFilter,
  onMktFilterChange,
  marketLookups,
  getOwnRows,
  years,
  year,
  enabledDrivers,
  onEnabledDriversChange,
}) {
  const { REGION_TO_COUNTRIES, CLUSTER_TO_COUNTRIES, CLUSTER_TO_REGION, COUNTRY_TO_CLUSTER } = marketLookups;
  const [viewLevel, setViewLevel] = useState('region');
  const [scope, setScope] = useState({ region: new Set(), cluster: new Set() });
  const [search, setSearch] = useState({ region: '', cluster: '', country: '' });
  const [sort, setSort] = useState({ key: 'baseline', dir: -1 });
  const [heatmapMode, setHeatmapMode] = useState('trend');
  const [rangesView, setRangesView] = useState('heatmap');
  const [tableTab, setTableTab] = useState('overview');

  const atCountry = viewLevel === 'country';
  const dimKey = (r) => (atCountry ? r.country : viewLevel === 'cluster' ? r.cluster : r.region);
  const itemsForLabel = (label) => {
    if (viewLevel === 'region') return REGION_TO_COUNTRIES[label] || [];
    if (viewLevel === 'cluster') return CLUSTER_TO_COUNTRIES[label] || [];
    return [label];
  };
  const selFn = (label) => {
    const items = atCountry ? [label] : viewLevel === 'cluster' ? CLUSTER_TO_COUNTRIES[label] || [] : REGION_TO_COUNTRIES[label] || [];
    return selState(mktFilter, items);
  };
  const subLabelFn = (label) => {
    if (viewLevel === 'cluster' && scope.region.size === 0) return CLUSTER_TO_REGION[label];
    if (atCountry && scope.cluster.size === 0) return COUNTRY_TO_CLUSTER[label];
    return null;
  };
  const parentFn = subLabelFn;

  let ownRows = getOwnRows(false);
  if (viewLevel !== 'region' && scope.region.size > 0) ownRows = ownRows.filter((r) => scope.region.has(r.region));
  if (atCountry && scope.cluster.size > 0) ownRows = ownRows.filter((r) => scope.cluster.has(r.cluster));
  const map = groupBy(ownRows, dimKey);

  let ownRowsAllYears = getOwnRows(true);
  if (viewLevel !== 'region' && scope.region.size > 0) ownRowsAllYears = ownRowsAllYears.filter((r) => scope.region.has(r.region));
  if (atCountry && scope.cluster.size > 0) ownRowsAllYears = ownRowsAllYears.filter((r) => scope.cluster.has(r.cluster));

  const term = search[viewLevel].trim().toLowerCase();
  const filteredMap = term ? new Map(Array.from(map.entries()).filter(([label]) => label.toLowerCase().includes(term))) : map;

  const orderedLabels = withSelectionOrder(
    Array.from(map.entries()).map(([label, agg]) => ({ label, total: DRIVERS.reduce((s, d) => s + agg.drivers[d.key], 0) })),
    selFn,
    parentFn
  ).map((e) => e.label);

  const selectedAtLevel = Array.from(map.keys()).filter((l) => selFn(l) !== 'none');

  const scopeLabel =
    viewLevel === 'region'
      ? ''
      : viewLevel === 'cluster'
      ? scope.region.size > 0
        ? `Showing clusters within: ${Array.from(scope.region).join(', ')}.`
        : 'Showing all clusters, across every region (parent region shown under each name).'
      : scope.cluster.size > 0
      ? `Showing countries within: ${Array.from(scope.cluster).join(', ')}.`
      : 'Showing all countries, across every cluster (parent cluster shown under each name).';

  const levelLabel = atCountry ? 'Countries' : viewLevel === 'cluster' ? 'Clusters' : 'Regions';

  function onSort(key) {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir * -1 } : { key, dir: -1 }));
  }

  return (
    <div>
      <div className="panel-grid">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Spend &amp; cost-driver mix</div>
              <div className="card-note">
                Bar length = baseline spend, split by cost driver. Right: net inflation impact (Base). Click a bar to select it — it narrows the category
                breakdown too.
              </div>
            </div>
            <div className="card-head-actions">
              <SegmentedControl
                options={['region', 'cluster', 'country']}
                value={viewLevel}
                onChange={(lvl) => {
                  setViewLevel(lvl);
                  setScope({ region: new Set(), cluster: new Set() });
                }}
                labelFn={(lvl) => (lvl === 'region' ? 'Region' : lvl === 'cluster' ? 'Cluster' : 'Country')}
                small
              />
              <SelectAllButton labels={Array.from(filteredMap.keys())} filterSet={mktFilter} itemsForFn={itemsForLabel} onChange={onMktFilterChange} />
            </div>
          </div>
          <div className="scope-label">{scopeLabel}</div>
          <SearchContinueBar
            value={search[viewLevel]}
            placeholder={viewLevel === 'region' ? 'Search regions…' : viewLevel === 'cluster' ? 'Search clusters…' : 'Search countries…'}
            onChange={(v) => setSearch((prev) => ({ ...prev, [viewLevel]: v }))}
            continueBtn={
              viewLevel === 'region'
                ? {
                    label: 'Continue to clusters →',
                    enabled: selectedAtLevel.length > 0,
                    onClick: () => {
                      setScope({ region: new Set(selectedAtLevel), cluster: new Set() });
                      setViewLevel('cluster');
                    },
                  }
                : viewLevel === 'cluster'
                ? {
                    label: 'Continue to countries →',
                    enabled: selectedAtLevel.length > 0,
                    onClick: () => {
                      setScope((prev) => ({ ...prev, cluster: new Set(selectedAtLevel) }));
                      setViewLevel('country');
                    },
                  }
                : null
            }
          />
          <BarList
            map={filteredMap}
            onToggle={(label) => onMktFilterChange(toggleGroup(mktFilter, itemsForLabel(label)))}
            selStateFn={selFn}
            subLabelFn={subLabelFn}
            parentFn={parentFn}
            enabledDrivers={enabledDrivers}
          />
          <DriverLegend enabledDrivers={enabledDrivers} onChange={onEnabledDriversChange} />
        </div>
        <NetImpactCard
          ownRowsAllYears={ownRowsAllYears}
          years={years}
          year={year}
          dimKey={dimKey}
          labelOrder={orderedLabels}
          selStateFn={selFn}
          mode={heatmapMode}
          onModeChange={setHeatmapMode}
          rangesView={rangesView}
          onRangesViewChange={setRangesView}
        />
      </div>
      <DetailTableCard
        title={`${levelLabel} detail`}
        map={map}
        tableTab={tableTab}
        onTableTabChange={setTableTab}
        sortState={sort}
        onSort={onSort}
        selStateFn={selFn}
        parentFn={parentFn}
      />
    </div>
  );
}
