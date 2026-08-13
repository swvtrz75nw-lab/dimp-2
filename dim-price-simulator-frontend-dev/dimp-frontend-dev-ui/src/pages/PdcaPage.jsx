import React, { useState } from 'react';
import './PdcaPage.css';

const actualResults = [
  { category: 'Shipping Cases', priceEffect: '39.9 M$', vsPriorMonth: 3.1, vsYear: 7.8, impactor: 'Paper prices', status: 'Signed off', statusType: 'signed' },
  { category: 'Acetate Tow', priceEffect: '30.6 M$', vsPriorMonth: 5.2, vsYear: 12.4, impactor: 'VAM index', status: 'Signed off', statusType: 'signed' },
  { category: 'Adhesives', priceEffect: '20.0 M$', vsPriorMonth: -1.4, vsYear: 3.2, impactor: 'FX (EUR/USD)', status: 'Signed off', statusType: 'signed' },
  { category: 'Fine Paper', priceEffect: '23.9 M$', vsPriorMonth: 2.0, vsYear: 4.6, impactor: 'Pulp index', status: 'Pending', statusType: 'pending' },
  { category: 'Susceptors', priceEffect: '18.6 M$', vsPriorMonth: 4.4, vsYear: 9.1, impactor: 'Steel', status: 'In progress', statusType: 'progress' },
];

const historicalArchive = {
  'Mar 2026': {
    impact: '127',
    summary: 'Consolidated Net Price effect for <strong>Mar 2026</strong> sits at <span class="pdca-highlight-value">126.8 M$</span>. Paper Price fluctuations continue to act as the primary key impactor. In-house hedge coverage and index agreements are successfully offsetting up to 52% of the gross exposure.',
    results: [
      { category: 'Shipping Cases', priceEffect: '38.0 M$', vsPriorMonth: 1.9, vsYear: 6.0, impactor: 'Paper prices', status: 'Signed off', statusType: 'signed' },
      { category: 'Acetate Tow', priceEffect: '28.7 M$', vsPriorMonth: 3.4, vsYear: 9.8, impactor: 'VAM index', status: 'Signed off', statusType: 'signed' },
      { category: 'Adhesives', priceEffect: '21.0 M$', vsPriorMonth: 0.2, vsYear: 5.1, impactor: 'FX (EUR/USD)', status: 'Signed off', statusType: 'signed' },
      { category: 'Fine Paper', priceEffect: '22.0 M$', vsPriorMonth: 1.1, vsYear: 3.8, impactor: 'Pulp index', status: 'Signed off', statusType: 'signed' },
      { category: 'Susceptors', priceEffect: '17.1 M$', vsPriorMonth: -0.8, vsYear: 7.0, impactor: 'Steel', status: 'Signed off', statusType: 'signed' },
    ],
  },
  'Apr 2026': {
    impact: '129',
    summary: 'Consolidated Net Price effect for <strong>Apr 2026</strong> sits at <span class="pdca-highlight-value">129.2 M$</span>. Acetate Tow drove the largest sequential increase. Hedge effectiveness remained stable across all covered categories.',
    results: [
      { category: 'Shipping Cases', priceEffect: '38.4 M$', vsPriorMonth: 1.1, vsYear: 6.4, impactor: 'Paper prices', status: 'Signed off', statusType: 'signed' },
      { category: 'Acetate Tow', priceEffect: '29.5 M$', vsPriorMonth: 2.8, vsYear: 10.2, impactor: 'VAM index', status: 'Signed off', statusType: 'signed' },
      { category: 'Adhesives', priceEffect: '20.6 M$', vsPriorMonth: -0.4, vsYear: 4.3, impactor: 'FX (EUR/USD)', status: 'Signed off', statusType: 'signed' },
      { category: 'Fine Paper', priceEffect: '22.8 M$', vsPriorMonth: 3.6, vsYear: 4.1, impactor: 'Pulp index', status: 'Signed off', statusType: 'signed' },
      { category: 'Susceptors', priceEffect: '17.9 M$', vsPriorMonth: 4.7, vsYear: 8.2, impactor: 'Steel', status: 'Signed off', statusType: 'signed' },
    ],
  },
  'May 2026': {
    impact: '131',
    summary: 'Consolidated Net Price effect for <strong>May 2026</strong> sits at <span class="pdca-highlight-value">130.5 M$</span>. Fine Paper showed the largest monthly swing driven by pulp contract resets. All categories approved on schedule.',
    results: [
      { category: 'Shipping Cases', priceEffect: '39.1 M$', vsPriorMonth: 1.8, vsYear: 7.1, impactor: 'Paper prices', status: 'Signed off', statusType: 'signed' },
      { category: 'Acetate Tow', priceEffect: '30.0 M$', vsPriorMonth: 1.7, vsYear: 11.0, impactor: 'VAM index', status: 'Signed off', statusType: 'signed' },
      { category: 'Adhesives', priceEffect: '20.4 M$', vsPriorMonth: -1.0, vsYear: 3.8, impactor: 'FX (EUR/USD)', status: 'Signed off', statusType: 'signed' },
      { category: 'Fine Paper', priceEffect: '23.4 M$', vsPriorMonth: 2.6, vsYear: 4.4, impactor: 'Pulp index', status: 'Signed off', statusType: 'signed' },
      { category: 'Susceptors', priceEffect: '17.6 M$', vsPriorMonth: -1.7, vsYear: 7.5, impactor: 'Steel', status: 'Signed off', statusType: 'signed' },
    ],
  },
};

const historicalMonths = ['May 2026', 'Apr 2026', 'Mar 2026'];

// Full Year CY 2026 data — monthly projections per category
const fullYearData = [
  { category: 'Shipping Cases', py2025: 38.2, months: [38.5, 38.8, 39.1, 39.4, 39.7, 39.9, 40.2, 40.5, 40.8, 41.0, 41.2, 41.5], yoyPct: 4 },
  { category: 'Acetate Tow', py2025: 29.5, months: [29.8, 30.0, 30.2, 30.3, 30.5, 30.6, 30.8, 31.0, 31.1, 31.2, 31.4, 31.5], yoyPct: 3 },
  { category: 'Adhesives', py2025: 21.2, months: [20.8, 20.6, 20.4, 20.2, 20.1, 20.0, 19.9, 19.8, 19.7, 19.6, 19.5, 19.4], yoyPct: -5 },
  { category: 'Fine Paper', py2025: 23.0, months: [23.2, 23.3, 23.5, 23.6, 23.8, 23.9, 24.1, 24.2, 24.4, 24.5, 24.7, 24.8], yoyPct: 3 },
  { category: 'Susceptors', py2025: 18.0, months: [18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8, 18.9, 19.0, 19.1, 19.2], yoyPct: 3 },
];

const FY_MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const ACTIVE_MONTH_IDX = 5; // June is the active month (0-indexed)

export default function PdcaPage() {
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('actual');
  const [selectedMonth, setSelectedMonth] = useState('Mar 2026');

  const toggleStatus = (idx) => {
    // placeholder for sign-off toggle functionality
  };

  const isHistorical = activeTab === 'historical';
  const isFullYear = activeTab === 'fullyear';
  const histData = historicalArchive[selectedMonth];
  const tableData = isHistorical ? histData.results : actualResults;
  const periodLabel = isHistorical ? selectedMonth.toUpperCase() : 'JUNE 2026';

  return (
    <div className="pdca-pg">
      <div className="pdca-pg-inner">
        {/* Header */}
        <div className="pdca-pg-head">
          <div>
            <div className="pdca-pg-kicker">GOVERNANCE &amp; SIGNOFF</div>
            <h1 className="pdca-pg-title">PDCA Reporting</h1>
            <p className="pdca-pg-sub">Official signed-off results, scenario locking and consolidated cross-category view — replacing manual Excel submissions.</p>
          </div>
          <div className="pdca-head-actions">
            {activeTab === 'actual' && <button className="pdca-signoff-btn pdca-btn-primary">✓ Sign off period</button>}
            <div className="pdca-tab-group">
              <button className={`pdca-tab${activeTab === 'actual' ? ' active' : ''}`} onClick={() => setActiveTab('actual')}>Actual (Jun)</button>
              <button className={`pdca-tab${activeTab === 'historical' ? ' active' : ''}`} onClick={() => setActiveTab('historical')}>Historical</button>
              <button className={`pdca-tab${activeTab === 'fullyear' ? ' active' : ''}`} onClick={() => setActiveTab('fullyear')}>Full Year</button>
            </div>
          </div>
        </div>

        {/* Summary Accordion */}
        <div className="pdca-accordion">
          <button className="pdca-accordion-head" onClick={() => setSummaryOpen(o => !o)}>
            <span className="pdca-accordion-badge">✦ AUTO-GENERATED · CROSS-CATEGORY SUMMARY</span>
            <span className={`pdca-accordion-chev ${summaryOpen ? 'open' : ''}`} />
          </button>
          {summaryOpen && (
            <div className="pdca-accordion-body">
              {isHistorical ? (
                <p dangerouslySetInnerHTML={{ __html: histData.summary }} />
              ) : isFullYear ? (
                <p>
                  Consolidated Net Price effect for <strong>Rolling 12-Month</strong> sits at <span className="pdca-highlight-value">131.0 M$ (Avg)</span>. Paper Price fluctuations continue to act as the primary key impactor. In-house hedge coverage and index agreements are successfully offsetting up to 52% of the gross exposure.
                </p>
              ) : (
                <p>
                  Consolidated Net Price effect for <strong>June 2026</strong> sits at <span className="pdca-highlight-value">133.0 M$</span>. Paper Price fluctuations continue to act as the primary key impactor. In-house hedge coverage and index agreements are successfully offsetting up to 52% of the gross exposure.
                </p>
              )}
              <div className="pdca-hedge-rec">
                <span className="pdca-hedge-label">HEDGE RECOMMENDATION</span>
                <span className="pdca-hedge-dot">■</span>
                <span className="pdca-hedge-text">SECURE REMAINING FINE PAPER CONTRACT CLAUSES IMMEDIATELY BEFORE CLOSE</span>
              </div>
            </div>
          )}
        </div>

        {/* === ACTUAL & HISTORICAL: KPI Cards + Table === */}
        {!isFullYear && (
          <>
            {/* KPI Cards */}
            <div className="pdca-kpis">
              <div className="pdca-kpi">
                <span className="pdca-kpi-label">CONSOLIDATED DIM IMPACT</span>
                <span className="pdca-kpi-value">{isHistorical ? histData.impact : '133'} <small>M$</small></span>
                <span className="pdca-kpi-sub">5 categories · {isHistorical ? selectedMonth : 'June 2026'}</span>
              </div>
              <div className="pdca-kpi">
                <span className="pdca-kpi-label">SIGNED OFF</span>
                <span className="pdca-kpi-value">{isHistorical ? '5' : '3'} <small>/ 5</small></span>
                <span className="pdca-kpi-sub">{isHistorical ? 'all divisions approved' : 'on track for cycle close'}</span>
              </div>
              <div className="pdca-kpi pdca-kpi-highlight">
                <span className="pdca-kpi-label">PERIOD STATUS</span>
                {isHistorical ? (
                  <span className="pdca-kpi-value pdca-kpi-closed">Closed <span className="pdca-closed-dot" /></span>
                ) : (
                  <span className="pdca-kpi-value pdca-kpi-open">Open <span className="pdca-open-dot" /></span>
                )}
                <span className="pdca-kpi-sub">{isHistorical ? 'resolved cycle record' : 'closes 30 Jun 2026'}</span>
              </div>
            </div>

            {/* Historical Archive Selector */}
            {isHistorical && (
              <div className="pdca-archive-selector">
                <div className="pdca-archive-label">⏱ Historical Record Archive selector</div>
                <div className="pdca-archive-months">
                  {historicalMonths.map((m) => (
                    <button
                      key={m}
                      className={`pdca-archive-btn${selectedMonth === m ? ' active' : ''}`}
                      onClick={() => setSelectedMonth(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results Table */}
            <div className="pdca-table-section">
              <div className="pdca-table-head">
                <div>
                  <h2>MONTHLY OFFICIAL RESULTS — {periodLabel}</h2>
                  <p className="pdca-table-instruction">Click individual statuses to toggle signoffs dynamically before period lock</p>
                </div>
                <span className="pdca-table-note">scenario locked once signed</span>
              </div>
              <table className="pdca-table">
                <thead>
                  <tr>
                    <th>CATEGORY</th>
                    <th>PRICE EFFECT</th>
                    <th>VS PRIOR MONTH</th>
                    <th>VS PRIOR YEAR</th>
                    <th>KEY IMPACTOR</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((r, i) => (
                    <tr key={i}>
                      <td className="pdca-td-name">{r.category}</td>
                      <td className="pdca-td-mono">{r.priceEffect}</td>
                      <td className={r.vsPriorMonth >= 0 ? 'pdca-up' : 'pdca-down'}>
                        {r.vsPriorMonth >= 0 ? '▲' : '▼'} {Math.abs(r.vsPriorMonth).toFixed(1)}%
                      </td>
                      <td className="pdca-up">▲ {r.vsYear.toFixed(1)}%</td>
                      <td className="pdca-td-impactor">{r.impactor}</td>
                      <td>
                        <button className={`pdca-status-badge pdca-status-${r.statusType}`} onClick={() => toggleStatus(i)}>
                          <span className="pdca-status-dot" />
                          {r.status}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* === FULL YEAR: Matrix Table === */}
        {isFullYear && (
          <div className="pdca-fy-section">
            <div className="pdca-fy-header">
              <div>
                <h2 className="pdca-fy-title">FULL-YEAR CATEGORY DIMENSION PICTURE · CY 2026</h2>
                <p className="pdca-fy-sub">Consolidated rolling projection with Active Month Jun highlighted</p>
              </div>
              <span className="pdca-fy-note">all values in M$</span>
            </div>

            <div className="pdca-fy-table-wrap">
              <table className="pdca-fy-table">
                <thead>
                  <tr>
                    <th className="pdca-fy-dim-header" colSpan="2">DIMENSIONS</th>
                    <th className="pdca-fy-proj-header" colSpan="13">PROFITABILITY INDEX CY 2026 PROJECTIONS</th>
                  </tr>
                  <tr>
                    <th className="pdca-fy-th-cat">CATEGORY</th>
                    <th className="pdca-fy-th-py">PY 2025</th>
                    {FY_MONTHS.map((m, i) => (
                      <th key={m} className={`pdca-fy-th-month${i === ACTIVE_MONTH_IDX ? ' pdca-fy-active-col' : ''}`}>{m}</th>
                    ))}
                    <th className="pdca-fy-th-yoy">% Δ<br />(3)</th>
                  </tr>
                </thead>
                <tbody>
                  {fullYearData.map((row, ri) => (
                    <tr key={ri}>
                      <td className="pdca-fy-td-cat">{row.category}</td>
                      <td className="pdca-fy-td-py">{row.py2025.toFixed(1)}</td>
                      {row.months.map((val, mi) => (
                        <td key={mi} className={`pdca-fy-td-val${mi === ACTIVE_MONTH_IDX ? ' pdca-fy-active-cell' : ''}`}>
                          {val.toFixed(1)}
                        </td>
                      ))}
                      <td className={`pdca-fy-td-yoy${row.yoyPct >= 0 ? ' pdca-fy-pos' : ' pdca-fy-neg'}`}>
                        {row.yoyPct > 0 ? '+' : ''}{row.yoyPct}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Scenario Locking footer */}
        <div className="pdca-locking-section">
          <div className="pdca-locking-left">
            <div className="pdca-locking-title">🔒 SCENARIO LOCKING MECHANISM ENFORCED</div>
            <p className="pdca-locking-desc">
              When a reporting cycle locks, manual edits are greyed out, ensuring absolute consensus audit trails. Double checking prior actual cycles is supported in real-time, matching standard corporate compliance frameworks.
            </p>
          </div>
          <div className="pdca-locking-right">
            <span className="pdca-compliance-badge">DIM COMPLIANCE VERSION 2.45</span>
            <span className="pdca-audit-text">Audit Ledger: OK</span>
          </div>
        </div>
      </div>
    </div>
  );
}
