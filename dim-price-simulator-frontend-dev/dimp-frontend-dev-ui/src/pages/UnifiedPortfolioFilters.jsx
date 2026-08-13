// UnifiedPortfolioFilters.jsx — Slide-in filter panel for the Inflation page
// Matches the dark glass "UNIFIED PORTFOLIO FILTERS" design from the screenshots.
import { useState, useMemo } from 'react';
import { Icon } from '../components/Icon.jsx';
import './unifiedPortfolioFilters.css';

// ─── Constants ──────────────────────────────────────────────────────────────────

const TEAMS = ['MKT&PS', 'OPS&WX', 'IT&PC'];
const CONFIDENCE_LEVELS = ['High', 'Medium', 'Low'];
const COST_DRIVERS = [
  'White Collar', 'Blue Collar', 'Electricity & Gas', 'Fuel',
  'Materials', 'Tech & R&D', 'Overheads', 'Margin', 'Other Drivers',
];

// Default saved views/presets
const DEFAULT_PRESETS = [
  { id: 'standard', name: 'Standard View', isDefault: true },
  { id: 'itpc', name: 'IT & PC Priority', isDefault: false },
  { id: 'highconf', name: 'High Confidence Para...', isDefault: false },
];

// Cluster definitions for grouping vendor regions
const CLUSTERS = [
  'Western Europe', 'Eastern Europe', 'SSEA Core Markets',
  'CIS & Middle East Africa', 'East Asia Developed',
  'Oceania & Duty Free', 'USA National Markets',
  'Mexico & Central America', 'South America',
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

function groupCountriesByRegion(countries, regions) {
  // Build a map: region -> countries list
  // If regions are available, use them as group headers
  if (!regions || !regions.length) {
    return [{ region: 'All Countries', countries: countries || [] }];
  }
  // Simple: just list regions with associated countries
  // In real implementation this would come from API hierarchy
  return regions.map((r) => ({
    region: r,
    countries: (countries || []).filter(() => true), // simplified — real version would map
  }));
}

// ─── Sub-Components ─────────────────────────────────────────────────────────────

function FilterStatusBar({ teams, confidence, drivers }) {
  return (
    <div className="upf-status-bar">
      <span className="upf-status-label">STATUS:</span>
      <span className="upf-status-pill teams">Teams: {teams}</span>
      <span className="upf-status-pill confidence">Confidence: {confidence}</span>
      <span className="upf-status-pill drivers">Drivers: {drivers}</span>
    </div>
  );
}

function SavedPresets({ presets, activePreset, onSelect, onSave }) {
  return (
    <div className="upf-section">
      <div className="upf-section-header">
        <span className="upf-section-icon">🔖</span>
        <span className="upf-section-title">SAVED VIEWS & PRESETS</span>
        <button className="upf-save-btn" onClick={onSave}>+ Save Current</button>
      </div>
      <div className="upf-presets-row">
        {presets.map((p) => (
          <button
            key={p.id}
            className={'upf-preset-chip' + (p.id === activePreset ? ' active' : '')}
            onClick={() => onSelect(p.id)}
          >
            {p.name}
            {p.isDefault && <span className="upf-dflt-badge">DFLT</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function TeamToggle({ teams, selectedTeams, onToggle }) {
  return (
    <div className="upf-section">
      <div className="upf-section-header">
        <span className="upf-section-icon">👥</span>
        <span className="upf-section-title">PROCUREMENT TEAM</span>
      </div>
      <div className="upf-toggle-row">
        {(teams || TEAMS).map((t) => (
          <button
            key={t}
            className={'upf-toggle-btn' + (selectedTeams.includes(t) ? ' active' : '')}
            onClick={() => onToggle(t)}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

function ConfidenceToggle({ selected, onToggle }) {
  return (
    <div className="upf-section">
      <div className="upf-section-header">
        <span className="upf-section-icon">◐</span>
        <span className="upf-section-title">CONFIDENCE LEVEL</span>
      </div>
      <div className="upf-toggle-row">
        {CONFIDENCE_LEVELS.map((lvl) => (
          <button
            key={lvl}
            className={'upf-toggle-btn conf' + (selected.includes(lvl) ? ' active' : '') + ' ' + lvl.toLowerCase()}
            onClick={() => onToggle(lvl)}
          >
            {lvl}
          </button>
        ))}
      </div>
    </div>
  );
}

function MarketCountryTree({ vendorRegions, vendorCountries, selectedCountries, onToggleCountry, searchTerm, onSearch }) {
  // Group countries by region
  const grouped = useMemo(() => {
    if (!vendorRegions || !vendorRegions.length) {
      return [{ region: 'All', countries: vendorCountries || [], expanded: true }];
    }
    // Simple grouping - in production this would use actual region-country mapping from API
    return vendorRegions.map((region) => ({
      region,
      countries: (vendorCountries || []).filter((c) =>
        !searchTerm || c.toLowerCase().includes(searchTerm.toLowerCase())
      ),
      expanded: true,
    }));
  }, [vendorRegions, vendorCountries, searchTerm]);

  const [expandedRegions, setExpandedRegions] = useState(new Set(vendorRegions || []));

  const toggleRegion = (region) => {
    setExpandedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(region)) next.delete(region);
      else next.add(region);
      return next;
    });
  };

  const filteredCountries = useMemo(() => {
    if (!searchTerm) return vendorCountries || [];
    return (vendorCountries || []).filter((c) =>
      c.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vendorCountries, searchTerm]);

  return (
    <div className="upf-section">
      <div className="upf-section-header">
        <span className="upf-section-icon">⊕</span>
        <span className="upf-section-title">MARKETS & VENDOR COUNTRIES</span>
      </div>
      <input
        className="upf-search-input"
        placeholder="Search regions..."
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
      />
      <div className="upf-tree-list">
        {vendorRegions && vendorRegions.length > 0 ? (
          vendorRegions.map((region) => {
            const regionCountries = filteredCountries; // simplified
            const isExpanded = expandedRegions.has(region);
            return (
              <div key={region} className="upf-tree-group">
                <button className="upf-tree-region" onClick={() => toggleRegion(region)}>
                  <Icon name="chevronDown" size={12} className={'upf-tree-chev' + (isExpanded ? '' : ' collapsed')} />
                  <input
                    type="checkbox"
                    className="upf-checkbox"
                    checked={regionCountries.every((c) => selectedCountries.includes(c))}
                    readOnly
                  />
                  <span className="upf-tree-region-name">{region}</span>
                  <span className="upf-tree-count">{regionCountries.length} countries</span>
                </button>
                {isExpanded && (
                  <div className="upf-tree-children">
                    {regionCountries.slice(0, 8).map((country) => (
                      <label key={country} className="upf-tree-item">
                        <input
                          type="checkbox"
                          className="upf-checkbox"
                          checked={selectedCountries.includes(country)}
                          onChange={() => onToggleCountry(country)}
                        />
                        <span className="upf-tree-item-name">{country}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="upf-tree-children">
            {filteredCountries.slice(0, 10).map((country) => (
              <label key={country} className="upf-tree-item">
                <input
                  type="checkbox"
                  className="upf-checkbox"
                  checked={selectedCountries.includes(country)}
                  onChange={() => onToggleCountry(country)}
                />
                <span className="upf-tree-item-name">{country}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DirectCountrySelection({ countries, selectedCountries, searchTerm, onSearch, onToggle }) {
  const filtered = useMemo(() => {
    if (!searchTerm) return countries || [];
    return (countries || []).filter((c) =>
      c.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [countries, searchTerm]);

  return (
    <div className="upf-section">
      <div className="upf-section-header">
        <span className="upf-section-icon">⊕</span>
        <span className="upf-section-title">DIRECT COUNTRY SELECTION</span>
      </div>
      <input
        className="upf-search-input"
        placeholder="Search countries directly..."
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
      />
      <div className="upf-chips-wrap">
        {(filtered.length > 0 ? filtered : countries || []).slice(0, 20).map((c) => (
          <button
            key={c}
            className={'upf-chip' + (selectedCountries.includes(c) ? ' active' : '')}
            onClick={() => onToggle(c)}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

function ClusterSelection({ clusters, selectedClusters, searchTerm, onSearch, onToggle }) {
  const filtered = useMemo(() => {
    if (!searchTerm) return clusters || CLUSTERS;
    return (clusters || CLUSTERS).filter((c) =>
      c.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clusters, searchTerm]);

  return (
    <div className="upf-section">
      <div className="upf-section-header">
        <span className="upf-section-icon">⊕</span>
        <span className="upf-section-title">CLUSTER SELECTION</span>
      </div>
      <input
        className="upf-search-input"
        placeholder="Search clusters..."
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
      />
      <div className="upf-chips-wrap">
        {filtered.map((c) => (
          <button
            key={c}
            className={'upf-chip' + (selectedClusters.includes(c) ? ' active' : '')}
            onClick={() => onToggle(c)}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

function CategoryHierarchy({ categoryL2, categoryL3, l3ToL2, selectedL2, selectedL3, onToggleL2, onToggleL3, searchL2, searchL3, onSearchL2, onSearchL3 }) {
  const [expandedL2, setExpandedL2] = useState(new Set());

  const filteredL2 = useMemo(() => {
    if (!searchL2) return categoryL2 || [];
    return (categoryL2 || []).filter((c) =>
      c.toLowerCase().includes(searchL2.toLowerCase())
    );
  }, [categoryL2, searchL2]);

  // Build L2 → L3 mapping from l3ToL2 dict
  const l2ToL3s = useMemo(() => {
    const map = {};
    (categoryL2 || []).forEach((l2) => { map[l2] = []; });
    Object.entries(l3ToL2 || {}).forEach(([l3, l2]) => {
      if (map[l2]) map[l2].push(l3);
    });
    return map;
  }, [categoryL2, l3ToL2]);

  const toggleExpand = (cat) => {
    setExpandedL2((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="upf-section">
      <div className="upf-section-header">
        <span className="upf-section-icon">⚙️</span>
        <span className="upf-section-title">CATEGORY L2 & L3 HIERARCHY</span>
      </div>
      <div className="upf-dual-search">
        <input
          className="upf-search-input half"
          placeholder="Search L2s..."
          value={searchL2}
          onChange={(e) => onSearchL2(e.target.value)}
        />
        <input
          className="upf-search-input half"
          placeholder="Search L3s..."
          value={searchL3}
          onChange={(e) => onSearchL3(e.target.value)}
        />
      </div>
      <div className="upf-tree-list">
        {filteredL2.map((l2) => {
          const isExpanded = expandedL2.has(l2);
          const l3Items = (l2ToL3s[l2] || []).filter((l3) =>
            !searchL3 || l3.toLowerCase().includes(searchL3.toLowerCase())
          );
          return (
            <div key={l2} className="upf-tree-group">
              <button className="upf-tree-region" onClick={() => toggleExpand(l2)}>
                <Icon name="chevronDown" size={12} className={'upf-tree-chev' + (isExpanded ? '' : ' collapsed')} />
                <input
                  type="checkbox"
                  className="upf-checkbox"
                  checked={selectedL2.includes(l2)}
                  onChange={() => onToggleL2(l2)}
                />
                <span className="upf-tree-region-name">{l2}</span>
                <span className="upf-tree-count">{l3Items.length > 9 ? '9+' : l3Items.length} L3s</span>
              </button>
              {isExpanded && (
                <div className="upf-tree-children">
                  {l3Items.map((l3) => (
                    <label key={l3} className="upf-tree-item">
                      <input
                        type="checkbox"
                        className="upf-checkbox"
                        checked={selectedL3.includes(l3)}
                        onChange={() => onToggleL3(l3)}
                      />
                      <span className="upf-tree-item-name">{l3}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CostDriversToggle({ selected, onToggle }) {
  return (
    <div className="upf-section">
      <div className="upf-section-header">
        <span className="upf-section-icon">$</span>
        <span className="upf-section-title">INTERACTIVE COST DRIVERS</span>
      </div>
      <div className="upf-drivers-grid">
        {COST_DRIVERS.map((d) => (
          <button
            key={d}
            className={'upf-driver-btn' + (selected.includes(d) ? ' active' : '')}
            onClick={() => onToggle(d)}
          >
            <span className="upf-driver-label">{d}</span>
            {selected.includes(d) && <Icon name="check" size={14} className="upf-driver-check" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Panel Component ───────────────────────────────────────────────────────

export default function UnifiedPortfolioFilters({ isOpen, onClose, filterOptions, onApply, currentFilters }) {
  // Local filter state
  const [selectedTeams, setSelectedTeams] = useState(currentFilters?.teams || []);
  const [selectedConfidence, setSelectedConfidence] = useState(currentFilters?.confidence || []);
  const [selectedCountries, setSelectedCountries] = useState(currentFilters?.countries || []);
  const [selectedClusters, setSelectedClusters] = useState(currentFilters?.clusters || []);
  const [selectedL2, setSelectedL2] = useState(currentFilters?.categoryL2 || []);
  const [selectedL3, setSelectedL3] = useState(currentFilters?.categoryL3 || []);
  const [selectedDrivers, setSelectedDrivers] = useState(currentFilters?.drivers || [...COST_DRIVERS]);
  const [activePreset, setActivePreset] = useState('standard');

  // Search states
  const [marketSearch, setMarketSearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [clusterSearch, setClusterSearch] = useState('');
  const [searchL2, setSearchL2] = useState('');
  const [searchL3, setSearchL3] = useState('');

  // Toggle helpers
  const toggle = (list, setList, item) => {
    setList((prev) => prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]);
  };

  // Reset all filters
  const handleReset = () => {
    setSelectedTeams([]);
    setSelectedConfidence([]);
    setSelectedCountries([]);
    setSelectedClusters([]);
    setSelectedL2([]);
    setSelectedL3([]);
    setSelectedDrivers([...COST_DRIVERS]);
    setActivePreset('standard');
    setMarketSearch('');
    setCountrySearch('');
    setClusterSearch('');
    setSearchL2('');
    setSearchL3('');
  };

  // Apply filters
  const handleApply = () => {
    onApply({
      teams: selectedTeams,
      confidence: selectedConfidence,
      countries: selectedCountries,
      clusters: selectedClusters,
      categoryL2: selectedL2,
      categoryL3: selectedL3,
      drivers: selectedDrivers,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="upf-backdrop" onClick={onClose} />
      <div className="upf-panel">
        {/* Header */}
        <div className="upf-header">
          <div className="upf-header-left">
            <Icon name="sliders" size={16} className="upf-header-icon" />
            <h2 className="upf-header-title">UNIFIED PORTFOLIO FILTERS</h2>
          </div>
          <div className="upf-header-right">
            <button className="upf-reset-btn" onClick={handleReset}>
              <Icon name="refresh" size={14} /> RESET
            </button>
            <button className="upf-close-btn" onClick={onClose}>
              <Icon name="x" size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="upf-body">
          <FilterStatusBar
            teams={selectedTeams.length}
            confidence={selectedConfidence.length}
            drivers={selectedDrivers.length}
          />

          <SavedPresets
            presets={DEFAULT_PRESETS}
            activePreset={activePreset}
            onSelect={setActivePreset}
            onSave={() => {}}
          />

          <TeamToggle
            teams={filterOptions?.team || TEAMS}
            selectedTeams={selectedTeams}
            onToggle={(t) => toggle(selectedTeams, setSelectedTeams, t)}
          />

          <ConfidenceToggle
            selected={selectedConfidence}
            onToggle={(c) => toggle(selectedConfidence, setSelectedConfidence, c)}
          />

          <MarketCountryTree
            vendorRegions={filterOptions?.vendor_region || []}
            vendorCountries={filterOptions?.vendor_country || []}
            selectedCountries={selectedCountries}
            onToggleCountry={(c) => toggle(selectedCountries, setSelectedCountries, c)}
            searchTerm={marketSearch}
            onSearch={setMarketSearch}
          />

          <DirectCountrySelection
            countries={filterOptions?.vendor_country || []}
            selectedCountries={selectedCountries}
            searchTerm={countrySearch}
            onSearch={setCountrySearch}
            onToggle={(c) => toggle(selectedCountries, setSelectedCountries, c)}
          />

          <ClusterSelection
            clusters={filterOptions?.ims_market_region || CLUSTERS}
            selectedClusters={selectedClusters}
            searchTerm={clusterSearch}
            onSearch={setClusterSearch}
            onToggle={(c) => toggle(selectedClusters, setSelectedClusters, c)}
          />

          <CategoryHierarchy
            categoryL2={filterOptions?.category_l2 || []}
            categoryL3={filterOptions?.category_l3 || []}
            l3ToL2={filterOptions?.l3_to_l2 || {}}
            selectedL2={selectedL2}
            selectedL3={selectedL3}
            onToggleL2={(c) => toggle(selectedL2, setSelectedL2, c)}
            onToggleL3={(c) => toggle(selectedL3, setSelectedL3, c)}
            searchL2={searchL2}
            searchL3={searchL3}
            onSearchL2={setSearchL2}
            onSearchL3={setSearchL3}
          />

          <CostDriversToggle
            selected={selectedDrivers}
            onToggle={(d) => toggle(selectedDrivers, setSelectedDrivers, d)}
          />
        </div>

        {/* Footer */}
        <div className="upf-footer">
          <span className="upf-footer-note">Cross-filtering active on both views.</span>
          <button className="upf-apply-btn" onClick={handleApply}>
            APPLY FILTERS
          </button>
        </div>
      </div>
    </>
  );
}
