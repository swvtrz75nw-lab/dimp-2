import { useMemo, useState, useEffect, useRef } from 'react';
import './BreakdownPage.css';
import FilterToolbar, { useSavedViews } from '../components/FilterToolbar';
import FiltersDrawer, { flattenTree, describeSelection } from '../components/FiltersDrawer';
import { CategoryBreakdownPanel, MarketBreakdownPanel } from './BreakdownPanel';
import { DRIVERS, filteredRows, sumRows, fmtUSD, fmtPct, buildCategoryLookups, buildMarketLookups } from './breakdownData';

function KpiRow({ agg }) {
  const netPct = agg.spend > 0 ? (agg.netimpact.Base / agg.spend) * 100 : 0;
  const preventedShare = agg.gross.Base > 0 ? (agg.prevention.Base / agg.gross.Base) * 100 : 0;
  const rangeOf = (t) => `Range: ${fmtUSD(t.Best)} – ${fmtUSD(t.Worst)}`;

  const tiles = [
    { label: 'Baseline spend', value: fmtUSD(agg.baseline.Base), sub: 'cost base', info: 'Actual baseline spend, cascaded forward.' },
    {
      label: 'Gross inflation',
      value: fmtUSD(agg.gross.Base),
      range: rangeOf(agg.gross),
      sub: `${fmtPct(agg.spend > 0 ? (agg.gross.Base / agg.spend) * 100 : 0)} of spend, before mitigation`,
      tone: 'critical',
      info: 'Forecast cost increase before any mitigation is applied. Base scenario is the headline; Best/Worst is the scenario range.',
    },
    {
      label: 'Cost prevention',
      value: fmtUSD(agg.prevention.Base),
      range: rangeOf(agg.prevention),
      sub: `${fmtPct(preventedShare)} of gross inflation offset`,
      tone: 'good',
      info: 'Portion of gross inflation offset by contract mechanisms and other mitigation.',
    },
    {
      label: 'Net impact',
      value: fmtUSD(agg.netimpact.Base),
      range: rangeOf(agg.netimpact),
      sub: `${fmtPct(netPct)} of spend`,
      emphasis: true,
      tone: 'accent',
      info: 'Gross inflation minus cost prevention - the actual bottom-line impact.',
    },
    { label: 'Final cost', value: fmtUSD(agg.final.Base), range: rangeOf(agg.final), sub: 'Base', info: 'Baseline spend plus the net impact.' },
  ];

  return (
    <div className="kpi-row">
      {tiles.map((t) => (
        <div key={t.label} className={`kpi-tile${t.emphasis ? ' emphasis' : ''}`}>
          <div className="kpi-label-row">
            <span className="kpi-label">{t.label}</span>
            <span className="kpi-info" title={t.info}>
              ?
            </span>
          </div>
          <div className={`kpi-value${t.tone ? ' tone-' + t.tone : ''}`}>{t.value}</div>
          <div className="kpi-sub">{t.sub}</div>
          {t.range && <div className="kpi-range">{t.range}</div>}
        </div>
      ))}
    </div>
  );
}

function ContextBanner({ catFilter, onCatFilterChange, catFlat, mktFilter, onMktFilterChange, mktFlat, vendorFilter, onVendorFilterChange, vendorFlat, team, teamLabels, onTeamChange, year }) {
  function Chip({ text, isActive, onClear }) {
    return (
      <button type="button" className={`chip${isActive ? ' active' : ''}`} disabled={!isActive} onClick={isActive ? onClear : undefined}>
        {text}
        {isActive && <span className="x">✕</span>}
      </button>
    );
  }

  const catDesc = describeSelection(catFilter, catFlat, 'categories');
  const mktDesc = describeSelection(mktFilter, mktFlat, 'markets');
  const vendorDesc = describeSelection(vendorFilter, vendorFlat, 'vendor countries');

  return (
    <div className="context-banner">
      <span className="ctx-label">Viewing:</span>
      <Chip text={`Category: ${catDesc || 'All'}`} isActive={!!catDesc} onClear={() => onCatFilterChange(new Set())} />
      <Chip text={`Market: ${mktDesc || 'All'}`} isActive={!!mktDesc} onClear={() => onMktFilterChange(new Set())} />
      <Chip text={`Vendor: ${vendorDesc || 'All'}`} isActive={!!vendorDesc} onClear={() => onVendorFilterChange(new Set())} />
      <Chip text={`Team: ${teamLabels[team] || team}`} isActive={team !== 'All'} onClear={() => onTeamChange('All')} />
      <Chip text={`${year} · Base scenario (Best–Worst shown alongside)`} isActive={false} />
    </div>
  );
}

// Top-level "View Breakdown" screen. Owns the cross-cutting state (year,
// team, the 3 hierarchy filters, which drivers are enabled) since the KPI
// row, context banner, and BOTH breakdown panels all read it; each panel
// keeps its own drill level/scope/search/sort/heatmap-mode locally since
// nothing outside that panel needs it.
export default function BreakdownPage({ rows, categoryTree, marketTree, vendorTree, years, teams, teamLabels = {}, title, description, onBack, onFilterChange }) {
  const [year, setYear] = useState(years[Math.min(1, years.length - 1)]);
  const [team, setTeam] = useState('All');
  const [tab, setTab] = useState('category');
  const [catFilter, setCatFilter] = useState(new Set());
  const [mktFilter, setMktFilter] = useState(new Set());
  const [vendorFilter, setVendorFilter] = useState(new Set());
  const [enabledDrivers, setEnabledDrivers] = useState(new Set(DRIVERS.map((d) => d.key)));
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false);
  const [activeSavedViewId, setActiveSavedViewId] = useState(null);
  const [resetKey, setResetKey] = useState(0);
  const { savedViews, saveView, renameView, deleteView } = useSavedViews('inflationModule.savedViews.v1');

  // Debounced propagation of year/team changes to the parent (triggers API call).
  // Category, market, and vendor filters are handled locally by BreakdownPage
  // (via skipCat/skipMkt/skipVendor) and are NOT sent to the API — sending
  // leaf-level items (L3 names, country names) as API params would either
  // use the wrong field or remove siblings from the bar list.
  const debounceRef = useRef(null);
  useEffect(() => {
    if (!onFilterChange) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onFilterChange({
        year,
        team: team !== 'All' ? [team] : [],
      });
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [year, team]); // eslint-disable-line react-hooks/exhaustive-deps

  const catFlat = useMemo(() => flattenTree(categoryTree), [categoryTree]);
  const mktFlat = useMemo(() => flattenTree(marketTree), [marketTree]);
  const vendorFlat = useMemo(() => flattenTree(vendorTree), [vendorTree]);
  const { L2_TO_L3S, L3_TO_L2 } = useMemo(() => buildCategoryLookups(categoryTree), [categoryTree]);
  const marketLookups = useMemo(() => buildMarketLookups(marketTree), [marketTree]);

  const getFilteredRows = (allYears) => filteredRows(rows, { year, allYears, team, catFilter, mktFilter, vendorFilter });
  const getCatOwnRows = (allYears) => filteredRows(rows, { year, allYears, team, catFilter, mktFilter, vendorFilter, skipCat: true });
  const getMktOwnRows = (allYears) => filteredRows(rows, { year, allYears, team, catFilter, mktFilter, vendorFilter, skipMkt: true });

  const kpiAgg = sumRows(getFilteredRows(false));

  function handleResetAll() {
    setYear(years[Math.min(1, years.length - 1)]);
    setTeam('All');
    setCatFilter(new Set());
    setMktFilter(new Set());
    setVendorFilter(new Set());
    setActiveSavedViewId(null);
    setResetKey((k) => k + 1); // remounts both panels, clearing their local level/scope/search/sort state too
  }

  function captureSnapshot() {
    return { year, team, catFilter: Array.from(catFilter), mktFilter: Array.from(mktFilter), vendorFilter: Array.from(vendorFilter) };
  }
  function applySnapshot(v) {
    setYear(v.state.year);
    setTeam(v.state.team);
    setCatFilter(new Set(v.state.catFilter));
    setMktFilter(new Set(v.state.mktFilter));
    setVendorFilter(new Set(v.state.vendorFilter));
    setActiveSavedViewId(v.id);
    setResetKey((k) => k + 1);
  }

  return (
    <div className="breakdown-page">
      <div className="page-header">
        <h1>{title || 'Indirect Spend Inflation Module'}</h1>
        <p>{description || 'Category and market breakdown of indirect spend inflation, with drill-down by category or market.'}</p>
      </div>

      <FilterToolbar
        years={years}
        year={year}
        onYearChange={setYear}
        teams={teams}
        team={team}
        onTeamChange={(t) => {
          setTeam(t);
          setCatFilter(new Set());
          setMktFilter(new Set());
          setVendorFilter(new Set());
          setActiveSavedViewId(null);
          setResetKey((k) => k + 1);
        }}
        teamLabels={teamLabels}
        vendorTree={vendorTree}
        vendorFlat={vendorFlat}
        vendorFilter={vendorFilter}
        onVendorFilterChange={setVendorFilter}
        savedViews={savedViews}
        activeSavedViewId={activeSavedViewId}
        onApplySavedView={applySnapshot}
        onRenameSavedView={renameView}
        onDeleteSavedView={(id) => {
          deleteView(id);
          if (id === activeSavedViewId) setActiveSavedViewId(null);
        }}
        onSaveFilter={(name) => saveView(name, captureSnapshot())}
        isFiltersDrawerOpen={isFiltersDrawerOpen}
        onToggleFiltersDrawer={() => setIsFiltersDrawerOpen((v) => !v)}
        onResetAll={handleResetAll}
      />

      <FiltersDrawer
        isOpen={isFiltersDrawerOpen}
        onClose={() => setIsFiltersDrawerOpen(false)}
        categoryTree={categoryTree}
        marketTree={marketTree}
        vendorTree={vendorTree}
        catFilter={catFilter}
        onCatFilterChange={setCatFilter}
        mktFilter={mktFilter}
        onMktFilterChange={setMktFilter}
        vendorFilter={vendorFilter}
        onVendorFilterChange={setVendorFilter}
      />

      <KpiRow agg={kpiAgg} />

      <ContextBanner
        catFilter={catFilter}
        onCatFilterChange={setCatFilter}
        catFlat={catFlat}
        mktFilter={mktFilter}
        onMktFilterChange={setMktFilter}
        mktFlat={mktFlat}
        vendorFilter={vendorFilter}
        onVendorFilterChange={setVendorFilter}
        vendorFlat={vendorFlat}
        team={team}
        teamLabels={teamLabels}
        onTeamChange={setTeam}
        year={year}
      />

      <div className="tabs">
        <button type="button" className={tab === 'category' ? 'active' : ''} onClick={() => setTab('category')}>
          Category breakdown
        </button>
        <button type="button" className={tab === 'market' ? 'active' : ''} onClick={() => setTab('market')}>
          Market breakdown
        </button>
      </div>

      <div className="panel" style={{ display: tab === 'category' ? 'block' : 'none' }}>
        <CategoryBreakdownPanel
          key={`cat-${resetKey}`}
          catFilter={catFilter}
          onCatFilterChange={setCatFilter}
          l2ToL3s={L2_TO_L3S}
          l3ToL2={L3_TO_L2}
          getOwnRows={getCatOwnRows}
          years={years}
          year={year}
          enabledDrivers={enabledDrivers}
          onEnabledDriversChange={setEnabledDrivers}
        />
      </div>
      <div className="panel" style={{ display: tab === 'market' ? 'block' : 'none' }}>
        <MarketBreakdownPanel
          key={`mkt-${resetKey}`}
          mktFilter={mktFilter}
          onMktFilterChange={setMktFilter}
          marketLookups={marketLookups}
          getOwnRows={getMktOwnRows}
          years={years}
          year={year}
          enabledDrivers={enabledDrivers}
          onEnabledDriversChange={setEnabledDrivers}
        />
      </div>
    </div>
  );
}
