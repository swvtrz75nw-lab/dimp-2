import React, { useState } from 'react';
import './IndexLibraryPage.css';

const indicators = [
  { name: 'Brent Crude (Fuel)', type: 'Commodity', source: 'S&P Global', feed: 'auto', prevYear: '$77.4', latest: '$82.4', deltaMoM: '▲ 6.4%', deltaUp: true, nextMonth: '$83.1', nextYear: '$85.0', usedBy: ['dim', 'ims'] },
  { name: 'CPI — Germany', type: 'Macro', source: 'Eurostat', feed: 'auto', prevYear: '2.7%', latest: '3.1%', deltaMoM: '▲ 0.2pp', deltaUp: true, nextMonth: '3.2%', nextYear: '3.4%', usedBy: ['ims'] },
  { name: 'EUR / USD', type: 'FX', source: 'ECB', feed: 'auto', prevYear: '1.093', latest: '1.084', deltaMoM: '▼ 0.8%', deltaUp: false, nextMonth: '1.082', nextYear: '1.078', usedBy: ['dim', 'ims'] },
  { name: 'VAM (Vinyl Acetate)', type: 'Material', source: 'ICIS', feed: 'manual', prevYear: '$1,090', latest: '$1,180', deltaMoM: '▲ 4.1%', deltaUp: true, nextMonth: '$1,205', nextYear: '$1,250', usedBy: ['dim'] },
  { name: 'Pulp (BHKP)', type: 'Material', source: 'RISI', feed: 'manual', prevYear: '$690', latest: '$720', deltaMoM: '▲ 1.9%', deltaUp: true, nextMonth: '$724', nextYear: '$735', usedBy: ['dim'] },
  { name: 'Steel (HRC EU)', type: 'Material', source: 'S&P Global', feed: 'manual', prevYear: '$612', latest: '$668', deltaMoM: '▲ 3.7%', deltaUp: true, nextMonth: '$675', nextYear: '$690', usedBy: ['dim'] },
  { name: 'TTF Gas (EU)', type: 'Commodity', source: 'ICE', feed: 'auto', prevYear: '$31.8', latest: '$34.2', deltaMoM: '▲ 6.4%', deltaUp: true, nextMonth: '$34.9', nextYear: '$33.5', usedBy: ['ims'] },
];

export default function IndexLibraryPage() {
  const [filter, setFilter] = useState('all');
  const filters = ['All', 'DIM', 'IM&S'];

  const filtered = filter === 'all' ? indicators : indicators.filter(i => i.usedBy.includes(filter === 'dim' ? 'dim' : 'ims'));

  return (
    <div className="idxlib-pg">
      <div className="idxlib-inner">
        {/* Header */}
        <div className="idxlib-head">
          <div>
            <div className="idxlib-kicker">DATA LAYER</div>
            <h1 className="idxlib-title">Index Library</h1>
            <p className="idxlib-sub">One catalogue of every external indicator — entered once, used across all areas. No index re-keyed into dozens of Excel files.</p>
          </div>
          <div className="idxlib-filters">
            <span className="idxlib-filter-label">USED BY</span>
            <div className="idxlib-chips">
              {filters.map(f => (
                <button
                  key={f}
                  className={`idxlib-chip ${filter === f.toLowerCase().replace('&', '') ? 'active' : ''}`}
                  onClick={() => setFilter(f === 'All' ? 'all' : f === 'DIM' ? 'dim' : 'ims')}
                >
                  {f !== 'All' && <span className={`idxlib-chip-dot ${f === 'DIM' ? 'dim' : 'ims'}`} />}
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="idxlib-stats">
          <div className="idxlib-stat">
            <span className="idxlib-stat-label">INDICATORS IN CATALOGUE</span>
            <span className="idxlib-stat-value">147</span>
            <span className="idxlib-stat-sub">CPI · PPI · FX · commodities</span>
          </div>
          <div className="idxlib-stat">
            <span className="idxlib-stat-label">SOURCES</span>
            <span className="idxlib-stat-value">14</span>
            <span className="idxlib-stat-sub">S&P Global, ECB, ICIS…</span>
          </div>
          <div className="idxlib-stat highlight">
            <span className="idxlib-stat-label">AUTO-FED</span>
            <span className="idxlib-stat-value">62<small>%</small></span>
            <span className="idxlib-stat-sub">where licensing permits</span>
          </div>
        </div>

        {/* Table */}
        <div className="idxlib-table-section">
          <div className="idxlib-table-head">
            <h2>Indicator catalogue</h2>
            <span className="idxlib-table-note">prev-yr / latest / forecast · trend = 2026 by month</span>
          </div>
          <table className="idxlib-table">
            <thead>
              <tr>
                <th>INDICATOR</th>
                <th>TYPE</th>
                <th>SOURCE</th>
                <th>FEED</th>
                <th>PREV YR</th>
                <th>LATEST</th>
                <th>Δ MOM</th>
                <th>NEXT MO*</th>
                <th>NEXT YR*</th>
                <th>TREND</th>
                <th>USED BY</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ind, i) => (
                <tr key={i}>
                  <td className="idxlib-td-name">{ind.name}</td>
                  <td><span className={`idxlib-type ${ind.type.toLowerCase()}`}>{ind.type}</span></td>
                  <td>{ind.source}</td>
                  <td><span className={`idxlib-feed ${ind.feed}`}>● {ind.feed === 'auto' ? 'Auto' : 'Manual'}</span></td>
                  <td>{ind.prevYear}</td>
                  <td className="idxlib-td-bold">{ind.latest}</td>
                  <td className={ind.deltaUp ? 'idxlib-up' : 'idxlib-down'}>{ind.deltaMoM}</td>
                  <td>{ind.nextMonth}</td>
                  <td>{ind.nextYear}</td>
                  <td><span className="idxlib-trend">〰</span></td>
                  <td>
                    {ind.usedBy.map(u => (
                      <span key={u} className={`idxlib-used ${u}`}>●</span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="idxlib-footnote">*Forecast values. Trend shows the current-year monthly path (Jan–Dec).</p>
        </div>
      </div>
    </div>
  );
}
