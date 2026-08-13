// InfByIndexTracked.jsx — By Index Traced section matching reference design
// Donut chart + legend bars + total metrics + impacted category cards
import { useState, useRef, useEffect } from 'react';
import './infByIndexTracked.css';

// ─── Derive indexes from driver weights ──────────────────────────────────────────
function buildIndexesFromDriverWeights(driverWeights) {
  if (!driverWeights) return [];
  const labourWeight = (driverWeights['White Collar'] || 0) + (driverWeights['Blue Collar'] || 0);
  const cpiWeight = (driverWeights['Materials'] || 0) + (driverWeights['Technology'] || 0) + (driverWeights['Overheads'] || 0) + (driverWeights['Other'] || 0);
  const fuelWeight = driverWeights['Fuel'] || 0;
  const elecGasWeight = driverWeights['Electricity/Gas'] || 0;
  const marginWeight = driverWeights['Margin'] || 0;

  return [
    { id: 'labour', name: 'Labour', weight: Math.round(labourWeight), color: '#ff6b8a' },
    { id: 'cpi', name: 'CPI', weight: Math.round(cpiWeight), color: '#64d2ff' },
    { id: 'fuel', name: 'Fuel', weight: Math.round(fuelWeight), color: '#ffb340' },
    { id: 'elec_gas', name: 'Electricity + Gas', weight: Math.round(elecGasWeight), color: '#34d399' },
    { id: 'margins', name: 'Margins', weight: Math.round(marginWeight), color: '#c084fc' },
  ].filter((idx) => idx.weight > 0);
}

// ─── Derive categories from API gross inflation by category data ─────────────────
function buildCategoriesFromApi(selectedIndex, apiCategories, driverWeights) {
  if (!apiCategories || !apiCategories.length) return [];

  const driverMap = {
    labour: ['gross_inflation_White Collar', 'gross_inflation_Blue Collar'],
    cpi: ['gross_inflation_Materials', 'gross_inflation_Technology', 'gross_inflation_Overheads', 'gross_inflation_Other'],
    fuel: ['gross_inflation_Fuel'],
    elec_gas: ['gross_inflation_Electricity/Gas'],
    margins: ['gross_inflation_Margin'],
  };

  const driverKeys = driverMap[selectedIndex] || [];
  if (!driverKeys.length) return [];

  const mapped = apiCategories
    .map((cat) => {
      const driverTotal = driverKeys.reduce((sum, key) => sum + (cat[key] || 0), 0);
      if (Math.abs(driverTotal) < 0.001) return null;
      const totalGross = cat.gross_inflation_total_m || 1;
      return {
        id: cat.category_l2.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        name: cat.category_l2,
        splitPct: Math.round((Math.abs(driverTotal) / Math.abs(totalGross)) * 100),
        netInf: Math.round(driverTotal * 10) / 10,
        netInfMin: Math.round(driverTotal * 0.85 * 10) / 10,
        netInfMax: Math.round(driverTotal * 1.15 * 10) / 10,
        grossInf: Math.round(totalGross * 10) / 10,
        grossInfMin: Math.round(totalGross * 0.9 * 10) / 10,
        grossInfMax: Math.round(totalGross * 1.1 * 10) / 10,
        offset: cat.pct_of_total || 0,
        offsetMin: Math.round((cat.pct_of_total || 0) * 0.9),
        offsetMax: Math.round((cat.pct_of_total || 0) * 1.1),
        costPrev: Math.round(driverTotal * 0.5 * 10) / 10,
        costPrevMin: Math.round(driverTotal * 0.4 * 10) / 10,
        costPrevMax: Math.round(driverTotal * 0.6 * 10) / 10,
      };
    })
    .filter(Boolean)
    .sort((a, b) => Math.abs(b.netInf) - Math.abs(a.netInf))
    .slice(0, 12);

  return mapped;
}

// Category colors for donut outer ring
function generatePillarShades(hexColor, count) {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const shades = [];
  for (let i = 0; i < count; i++) {
    const factor = 0.4 + (i / Math.max(count - 1, 1)) * 0.7;
    const sr = Math.min(255, Math.round(r * factor + (1 - factor) * 60));
    const sg = Math.min(255, Math.round(g * factor + (1 - factor) * 60));
    const sb = Math.min(255, Math.round(b * factor + (1 - factor) * 60));
    shades.push(`rgb(${sr}, ${sg}, ${sb})`);
  }
  return shades;
}

// ─── Donut Chart ────────────────────────────────────────────────────────────────
function DonutChart({ selectedIndex, allCategoriesByIndex, onSelectIndex, indexes }) {
  const [hovered, setHovered] = useState(null);
  const size = 220;
  const cx = size / 2, cy = size / 2;
  const outerR = 100, midR = 72, innerR = 48;

  if (!indexes || !indexes.length) return <div className="ibt-donut-wrap" style={{ opacity: 0.3 }}>No data</div>;

  const donutIndexes = indexes.filter((idx) => {
    const cats = allCategoriesByIndex[idx.id];
    return cats && cats.length > 0;
  });

  if (!donutIndexes.length) return <div className="ibt-donut-wrap" style={{ opacity: 0.3 }}>No data</div>;

  const total = donutIndexes.reduce((s, idx) => s + idx.weight, 0);
  const selectedIdx = donutIndexes.find((i) => i.id === selectedIndex) || indexes.find((i) => i.id === selectedIndex);

  let startAngle = -90;
  const innerSegments = donutIndexes.map((idx) => {
    const sweep = (idx.weight / total) * 360;
    const seg = { ...idx, startAngle, sweep };
    startAngle += sweep;
    return seg;
  });

  let allOuterSegments = [];
  innerSegments.forEach((seg) => {
    const cats = allCategoriesByIndex[seg.id] || [];
    let catStart = seg.startAngle;
    if (cats.length > 0) {
      const totalSplit = cats.reduce((s, c) => s + c.splitPct, 0) || 1;
      const shades = generatePillarShades(seg.color, cats.length);
      cats.forEach((cat, ci) => {
        const sweep = (cat.splitPct / totalSplit) * seg.sweep;
        allOuterSegments.push({
          ...cat,
          indexId: seg.id,
          indexColor: seg.color,
          startAngle: catStart,
          sweep,
          color: shades[ci],
        });
        catStart += sweep;
      });
    }
  });

  function arcPath(start, sweep, r1, r2) {
    const toRad = (d) => (d * Math.PI) / 180;
    const x1 = cx + r1 * Math.cos(toRad(start));
    const y1 = cy + r1 * Math.sin(toRad(start));
    const x2 = cx + r1 * Math.cos(toRad(start + sweep));
    const y2 = cy + r1 * Math.sin(toRad(start + sweep));
    const x3 = cx + r2 * Math.cos(toRad(start + sweep));
    const y3 = cy + r2 * Math.sin(toRad(start + sweep));
    const x4 = cx + r2 * Math.cos(toRad(start));
    const y4 = cy + r2 * Math.sin(toRad(start));
    const large = sweep > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r1} ${r1} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r2} ${r2} 0 ${large} 0 ${x4} ${y4} Z`;
  }

  return (
    <div className="ibt-donut-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} className="ibt-donut-svg">
        {innerSegments.map((seg) => (
          <path
            key={seg.id}
            d={arcPath(seg.startAngle, seg.sweep, midR, innerR)}
            fill={seg.color}
            opacity={seg.id === selectedIndex ? 1 : 0.3}
            style={{ transition: 'opacity 0.3s ease', cursor: 'pointer' }}
            onClick={() => onSelectIndex && onSelectIndex(seg.id)}
            onMouseEnter={() => setHovered({ name: seg.name, pct: seg.weight, color: seg.color })}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
        {allOuterSegments.map((seg, i) => {
          const isSelected = seg.indexId === selectedIndex;
          return (
            <path
              key={seg.id + '_' + i}
              d={arcPath(seg.startAngle, Math.max(seg.sweep - 0.8, 0.1), outerR, midR + 3)}
              fill={seg.color}
              opacity={isSelected ? 0.95 : 0.35}
              style={{ transition: 'opacity 0.3s ease', cursor: 'pointer' }}
              onClick={() => onSelectIndex && onSelectIndex(seg.indexId)}
            />
          );
        })}
      </svg>
      <div className="ibt-donut-center">
        <span className="ibt-center-pct" style={{ color: hovered ? hovered.color : selectedIdx?.color }}>
          {hovered ? hovered.pct : selectedIdx?.weight}%
        </span>
        <span className="ibt-center-sub">
          {hovered ? hovered.name.toUpperCase() : (selectedIdx?.name.toUpperCase() + ' PILLAR')}
        </span>
      </div>
    </div>
  );
}

// ─── Legend Bars (to the right of donut) ────────────────────────────────────────
function LegendBars({ indexes, selectedIndex, apiCategories, driverWeights }) {
  if (!indexes || !indexes.length) return null;

  // Calculate amounts per index
  const driverMap = {
    labour: ['gross_inflation_White Collar', 'gross_inflation_Blue Collar'],
    cpi: ['gross_inflation_Materials', 'gross_inflation_Technology', 'gross_inflation_Overheads', 'gross_inflation_Other'],
    fuel: ['gross_inflation_Fuel'],
    elec_gas: ['gross_inflation_Electricity/Gas'],
    margins: ['gross_inflation_Margin'],
  };

  const indexAmounts = indexes.map((idx) => {
    const keys = driverMap[idx.id] || [];
    let total = 0;
    (apiCategories || []).forEach((cat) => {
      keys.forEach((k) => { total += cat[k] || 0; });
    });
    return { ...idx, amount: Math.round(Math.abs(total) * 10) / 10 };
  });

  const maxAmt = Math.max(...indexAmounts.map((i) => i.amount), 1);
  const totalAmt = indexAmounts.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="ibt-legend-bars">
      {indexAmounts.map((idx) => (
        <div key={idx.id} className={'ibt-legend-row' + (idx.id === selectedIndex ? ' active' : '')}>
          <span className="ibt-legend-dot" style={{ background: idx.color }} />
          <span className="ibt-legend-name">{idx.name}</span>
          <div className="ibt-legend-track">
            <span className="ibt-legend-fill" style={{ width: Math.max(4, (idx.amount / maxAmt) * 100) + '%', background: idx.color }} />
          </div>
          <span className="ibt-legend-amt">${idx.amount}M</span>
          <span className="ibt-legend-pct">{totalAmt > 0 ? ((idx.amount / totalAmt) * 100).toFixed(1) : 0}%</span>
        </div>
      ))}
    </div>
  );
}

// ─── Total Metrics (right of donut area) ────────────────────────────────────────
function TotalMetrics({ selectedIndex, indexes, apiCategories, driverWeights, apiSpendMechanics }) {
  const idx = indexes.find((i) => i.id === selectedIndex);
  if (!idx) return null;

  const driverMap = {
    labour: ['gross_inflation_White Collar', 'gross_inflation_Blue Collar'],
    cpi: ['gross_inflation_Materials', 'gross_inflation_Technology', 'gross_inflation_Overheads', 'gross_inflation_Other'],
    fuel: ['gross_inflation_Fuel'],
    elec_gas: ['gross_inflation_Electricity/Gas'],
    margins: ['gross_inflation_Margin'],
  };

  const keys = driverMap[selectedIndex] || [];
  let totalNet = 0;
  let totalGross = 0;
  (apiCategories || []).forEach((cat) => {
    keys.forEach((k) => { totalNet += cat[k] || 0; });
    totalGross += cat.gross_inflation_total_m || 0;
  });

  const netAmt = Math.round(Math.abs(totalNet) * 10) / 10;
  const grossAmt = Math.round(Math.abs(totalGross) * 10) / 10;
  const netMin = Math.round(netAmt * 0.85 * 10) / 10;
  const netMax = Math.round(netAmt * 1.15 * 10) / 10;
  const grossMin = Math.round(grossAmt * 0.85 * 10) / 10;
  const grossMax = Math.round(grossAmt * 1.15 * 10) / 10;

  // Calculate % of baseline
  const baselineM = apiSpendMechanics?.baseline_m || 0;
  const netPctOfBaseline = baselineM > 0 ? ((netAmt / baselineM) * 100).toFixed(1) : '0.0';
  const grossPctOfBaseline = baselineM > 0 ? ((grossAmt / baselineM) * 100).toFixed(1) : '0.0';

  // Offset ratio: (gross - net) / gross * 100
  const offsetRatio = grossAmt > 0 ? (((grossAmt - netAmt) / grossAmt) * 100).toFixed(1) : '0.0';
  const offsetMin = (offsetRatio * 0.9).toFixed(1);
  const offsetMax = (offsetRatio * 1.1).toFixed(1);

  return (
    <div className="ibt-total-metrics">
      <div className="ibt-tm-block">
        <span className="ibt-tm-label">TOTAL NET INFLATION - {idx.name.toUpperCase()}</span>
        <span className="ibt-tm-value cyan">${netAmt}M</span>
        <span className="ibt-tm-baseline">({netPctOfBaseline}% of baseline)</span>
        <div className="ibt-tm-range-bar">
          <div className="ibt-tm-range-indicator" />
        </div>
        <span className="ibt-tm-range">Range: ${netMin}M – ${netMax}M</span>
      </div>
      <div className="ibt-tm-block">
        <span className="ibt-tm-label">TOTAL GROSS INFLATION - {idx.name.toUpperCase()}</span>
        <span className="ibt-tm-value red">${grossAmt}M</span>
        <span className="ibt-tm-baseline">({grossPctOfBaseline}% of baseline)</span>
        <div className="ibt-tm-range-bar">
          <div className="ibt-tm-range-indicator" />
        </div>
        <span className="ibt-tm-range">Range: ${grossMin}M – ${grossMax}M</span>
      </div>
      <div className="ibt-tm-block">
        <span className="ibt-tm-label">OFFSET RATIO - {idx.name.toUpperCase()}</span>
        <span className="ibt-tm-value green">{offsetRatio}%</span>
        <div className="ibt-tm-range-bar">
          <div className="ibt-tm-range-indicator" />
        </div>
        <span className="ibt-tm-range">Range: {offsetMin}% – {offsetMax}%</span>
      </div>
    </div>
  );
}

// ─── Category Impact Card ───────────────────────────────────────────────────────
function CategoryCard({ cat, indexName, indexColor, totalNetInf }) {
  const marginImpact = totalNetInf > 0 ? ((Math.abs(cat.netInf) / totalNetInf) * 100).toFixed(1) : '0.0';
  return (
    <div className="ibt-cat-card">
      <div className="ibt-cat-head">
        <h3 className="ibt-cat-name">{cat.name}</h3>
        <span className="ibt-cat-badge">{indexName} mapped</span>
      </div>
      <div className="ibt-cat-metrics">
        <div className="ibt-cat-metric">
          <span className="ibt-cat-metric-label">NET INFLATION IMPACT</span>
          <span className="ibt-cat-metric-value">${Math.abs(cat.netInf)}M</span>
          <span className="ibt-cat-metric-range">Min ${cat.netInfMin}M · Max ${cat.netInfMax}M</span>
        </div>
        <div className="ibt-cat-metric">
          <span className="ibt-cat-metric-label">GROSS INFLATION</span>
          <span className="ibt-cat-metric-value">${cat.grossInf}M</span>
          <span className="ibt-cat-metric-range">Min ${cat.grossInfMin}M · Max ${cat.grossInfMax}M</span>
        </div>
        <div className="ibt-cat-metric">
          <span className="ibt-cat-metric-label">OFFSET RATIO</span>
          <span className="ibt-cat-metric-value green">{cat.offset}%</span>
          <span className="ibt-cat-metric-range">Min {cat.offsetMin}% · Max {cat.offsetMax}%</span>
        </div>
        <div className="ibt-cat-metric">
          <span className="ibt-cat-metric-label">COST PREVENTION</span>
          <span className="ibt-cat-metric-value">${Math.abs(cat.costPrev)}M</span>
          <span className="ibt-cat-metric-range">Min ${cat.costPrevMin}M · Max ${cat.costPrevMax}M</span>
        </div>
      </div>
      <div className="ibt-cat-footer">
        <div className="ibt-cat-bar">
          <div className="ibt-cat-bar-fill" style={{ width: `${Math.min(cat.splitPct, 100)}%`, background: indexColor }} />
        </div>
        <span className="ibt-cat-impact">{marginImpact}% of {indexName} impact</span>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function InfByIndexTracked({ apiDriverWeights, apiDonutCharts, apiGrossInflationByCategory, apiSpendMechanics }) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  // Build indexes from backend driver weights
  const indexes = buildIndexesFromDriverWeights(apiDriverWeights);
  const activeIndex = selectedIndex && indexes.find((i) => i.id === selectedIndex) ? selectedIndex : (indexes[0]?.id || 'labour');
  const selectedIdx = indexes.find((i) => i.id === activeIndex);

  // Build categories for selected index
  const categories = buildCategoriesFromApi(activeIndex, apiGrossInflationByCategory, apiDriverWeights);

  // Build categories for ALL indexes (for donut outer ring)
  const allCategoriesByIndex = {};
  indexes.forEach((idx) => {
    allCategoriesByIndex[idx.id] = buildCategoriesFromApi(idx.id, apiGrossInflationByCategory, apiDriverWeights);
  });

  // Calculate total net inflation for selected index
  const driverMap = {
    labour: ['gross_inflation_White Collar', 'gross_inflation_Blue Collar'],
    cpi: ['gross_inflation_Materials', 'gross_inflation_Technology', 'gross_inflation_Overheads', 'gross_inflation_Other'],
    fuel: ['gross_inflation_Fuel'],
    elec_gas: ['gross_inflation_Electricity/Gas'],
    margins: ['gross_inflation_Margin'],
  };
  const keys = driverMap[activeIndex] || [];
  let totalNetInf = 0;
  (apiGrossInflationByCategory || []).forEach((cat) => {
    keys.forEach((k) => { totalNetInf += Math.abs(cat[k] || 0); });
  });

  // Empty state
  if (!apiDriverWeights || !indexes.length) {
    return (
      <section className="inf-section ibt-section">
        <div className="ibt-header">
          <h2 className="ibt-title">By index traced</h2>
        </div>
        <div className="ibt-nodata-box">
          <div className="ibt-nodata-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
              <path d="M14 24a8 8 0 0 1 12 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
              <circle cx="15" cy="17" r="1.5" fill="currentColor" opacity="0.4" />
              <circle cx="25" cy="17" r="1.5" fill="currentColor" opacity="0.4" />
            </svg>
          </div>
          <span className="ibt-nodata-title">No index data available</span>
          <span className="ibt-nodata-desc">Index tracking data will appear here once inflation drivers are configured for the selected period.</span>
        </div>
      </section>
    );
  }

  return (
    <section className="inf-section ibt-section">
      {/* Header */}
      <div className="ibt-header">
        <h2 className="ibt-title">By index traced</h2>
        <span className="ibt-header-badge">Hierarchical impact mapping</span>
      </div>

      <p className="ibt-intro">
        How net inflation flows from the macro index pillars into cost drivers, and which categories carry each pillar's exposure. Inner ring = pillar share of net inflation; outer ring = category breakdown within that pillar. Select a pillar to filter the cards below.
      </p>

      {/* Pillar Tabs */}
      <div className="ibt-tabs">
        {indexes.map((idx) => (
          <button
            key={idx.id}
            className={'ibt-tab' + (activeIndex === idx.id ? ' active' : '')}
            onClick={() => setSelectedIndex(idx.id)}
          >
            {idx.name}
          </button>
        ))}
      </div>

      {/* Main area: Donut + Legend + Metrics */}
      <div className="ibt-main-area">
        <div className="ibt-donut-col">
          <DonutChart
            selectedIndex={activeIndex}
            allCategoriesByIndex={allCategoriesByIndex}
            onSelectIndex={setSelectedIndex}
            indexes={indexes}
          />
        </div>
        <div className="ibt-legend-col">
          <LegendBars
            indexes={indexes}
            selectedIndex={activeIndex}
            apiCategories={apiGrossInflationByCategory}
            driverWeights={apiDriverWeights}
          />
        </div>
        <div className="ibt-metrics-col">
          <TotalMetrics
            selectedIndex={activeIndex}
            indexes={indexes}
            apiCategories={apiGrossInflationByCategory}
            driverWeights={apiDriverWeights}
            apiSpendMechanics={apiSpendMechanics}
          />
        </div>
      </div>

      {/* Impacted Categories Section */}
      <div className="ibt-categories-header">
        <div className="ibt-categories-title">Impacted categories &amp; KPI data ranges</div>
        <span className="ibt-categories-count">{categories.length} categories mapped to {selectedIdx?.name}</span>
      </div>

      <div className="ibt-categories-list">
        {categories.length > 0 ? categories.map((cat) => (
          <CategoryCard key={cat.id} cat={cat} indexName={selectedIdx?.name || ''} indexColor={selectedIdx?.color} totalNetInf={totalNetInf} />
        )) : (
          <div className="ibt-nodata-box" style={{ marginTop: 0 }}>
            <span className="ibt-nodata-title">No category data available for this index.</span>
          </div>
        )}
      </div>
    </section>
  );
}
