import React, { useState, useEffect, useRef } from 'react';
import './FilterToolbar.css';
import { TreeSection, describeSelection } from './FiltersDrawer';

export function SegmentedControl({ options, value, onChange, labelFn }) {
  return (
    <div className="segmented primary">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={opt === value ? 'active' : ''}
          onClick={() => onChange(opt)}
        >
          {labelFn ? labelFn(opt) : opt}
        </button>
      ))}
    </div>
  );
}

export function TeamSelect({ teams, value, onChange, teamLabels = {} }) {
  return (
    <select className="team-select" value={value} onChange={(e) => onChange(e.target.value)}>
      {teams.map((t) => (
        <option key={t} value={t}>
          {teamLabels[t] || t}
        </option>
      ))}
    </select>
  );
}

// Closes an open dropdown on outside click / Escape. `active` is the
// currently-open dropdown's name (or null); pass the wrapper ref so a click
// inside the trigger/panel doesn't immediately close itself.
function useDismiss(wrapRef, active, onDismiss) {
  useEffect(() => {
    if (!active) return;
    function handleClick(e) {
      if (!wrapRef.current || !wrapRef.current.contains(e.target)) onDismiss();
    }
    function handleKey(e) {
      if (e.key === 'Escape') onDismiss();
    }
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [active, onDismiss, wrapRef]);
}

export function VendorDropdown({ isOpen, onToggle, onClose, vendorTree, vendorFilter, onVendorFilterChange, vendorFlat }) {
  const wrapRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState(new Set());
  useDismiss(wrapRef, isOpen, onClose);

  const desc = describeSelection(vendorFilter, vendorFlat, 'vendor countries');

  const toggleExpand = (label) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  return (
    <div className="dropdown-wrap" ref={wrapRef}>
      <button type="button" className={`dropdown-trigger${isOpen ? ' open' : ''}`} onClick={onToggle}>
        <span className="truncate">{desc || 'All vendors'}</span>
        <span className="caret">▾</span>
      </button>
      <div className={`dropdown-panel${isOpen ? ' open' : ''}`}>
        {isOpen && (
          <>
            <div className="filters-panel-note">Same selection as the Sievo Vendor Country filter in the drawer.</div>
            <TreeSection
              tree={vendorTree}
              selectedSet={vendorFilter}
              onChange={onVendorFilterChange}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              expanded={expanded}
              onToggleExpand={toggleExpand}
              leafNoun="vendor countries"
            />
          </>
        )}
      </div>
    </div>
  );
}

export function useSavedViews(storageKey) {
  const [savedViews, setSavedViews] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey));
      return Array.isArray(raw) ? raw : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(savedViews));
    } catch (e) {
      /* storage unavailable - views stay session-only */
    }
  }, [savedViews, storageKey]);

  const saveView = (name, snapshot) => {
    const id = 'v' + Date.now() + Math.random().toString(36).slice(2, 7);
    setSavedViews((prev) => [...prev, { id, name, state: snapshot }]);
    return id;
  };
  const renameView = (id, name) => setSavedViews((prev) => prev.map((v) => (v.id === id ? { ...v, name } : v)));
  const deleteView = (id) => setSavedViews((prev) => prev.filter((v) => v.id !== id));

  return { savedViews, saveView, renameView, deleteView };
}

export function SavedFiltersDropdown({
  isOpen,
  onToggle,
  onClose,
  savedViews,
  activeSavedViewId,
  onApply,
  onRename,
  onDelete,
}) {
  const wrapRef = useRef(null);
  const [renamingId, setRenamingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  useDismiss(wrapRef, isOpen, onClose);

  useEffect(() => {
    if (!isOpen) {
      setRenamingId(null);
      setDeletingId(null);
    }
  }, [isOpen]);

  const activeView = savedViews.find((v) => v.id === activeSavedViewId) || null;

  return (
    <div className="dropdown-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`dropdown-trigger${isOpen ? ' open' : ''}${activeView ? ' accent-outline' : ''}`}
        title={activeView ? `Applied: "${activeView.name}"` : ''}
        onClick={onToggle}
      >
        <span className="truncate">
          {activeView ? `✓ ${activeView.name}` : `Saved filters${savedViews.length ? ` (${savedViews.length})` : ''}`}
        </span>
        <span className="caret">▾</span>
      </button>
      <div className={`dropdown-panel wide${isOpen ? ' open' : ''}`}>
        {isOpen && savedViews.length === 0 && (
          <div className="saved-views-empty">No saved filters yet. Use "+ Save filter" to create one from your current setup.</div>
        )}
        {isOpen && savedViews.length > 0 && (
          <div className="saved-views-list">
            {savedViews.map((v) => {
              if (renamingId === v.id) {
                return (
                  <div className="saved-view-row" key={v.id}>
                    <input
                      autoFocus
                      className="saved-view-rename-input"
                      defaultValue={v.name}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const name = e.target.value.trim();
                          if (name) onRename(v.id, name);
                          setRenamingId(null);
                        }
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                    />
                  </div>
                );
              }
              if (deletingId === v.id) {
                return (
                  <div className="saved-view-row" key={v.id}>
                    <span className="saved-view-name delete-confirm">Delete "{v.name}"?</span>
                    <div className="saved-view-actions" style={{ display: 'flex' }}>
                      <button
                        type="button"
                        className="delete-confirm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(v.id);
                          setDeletingId(null);
                        }}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={v.id}
                  className={`saved-view-row${v.id === activeSavedViewId ? ' active' : ''}`}
                  title={v.id === activeSavedViewId ? `Currently applied: "${v.name}"` : `Apply "${v.name}"`}
                  onClick={() => onApply(v)}
                >
                  <span className="saved-view-name">
                    {v.id === activeSavedViewId ? '✓ ' : ''}
                    {v.name}
                  </span>
                  <div className="saved-view-actions">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingId(v.id);
                      }}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(v.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function SaveFilterDropdown({ isOpen, onToggle, onClose, onSave }) {
  const wrapRef = useRef(null);
  const [name, setName] = useState('');
  useDismiss(wrapRef, isOpen, onClose);

  useEffect(() => {
    if (!isOpen) setName('');
  }, [isOpen]);

  const commit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    onClose();
  };

  return (
    <div className="dropdown-wrap" ref={wrapRef}>
      <button type="button" className="dropdown-trigger accent-outline" onClick={onToggle}>
        + Save filter
      </button>
      <div className={`dropdown-panel${isOpen ? ' open' : ''}`}>
        {isOpen && (
          <div className="save-view-form">
            <input
              autoFocus
              type="text"
              placeholder="Name this filter setup…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') onClose();
              }}
            />
            <div className="save-view-form-actions">
              <button type="button" className="primary" onClick={commit}>
                Save
              </button>
              <button type="button" className="secondary" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Drop-in match for the toolbar row: Year | Team | Vendor | Saved filters |
// + Save filter | Filters | Reset all filters. Fully controlled - lift
// year/team/vendorFilter/savedViews state into your app, same as the other
// filters, since the KPIs/charts need to read the same state.
export default function FilterToolbar({
  years,
  year,
  onYearChange,
  teams,
  team,
  onTeamChange,
  teamLabels,
  vendorTree,
  vendorFlat,
  vendorFilter,
  onVendorFilterChange,
  savedViews,
  activeSavedViewId,
  onApplySavedView,
  onRenameSavedView,
  onDeleteSavedView,
  onSaveFilter,
  isFiltersDrawerOpen,
  onToggleFiltersDrawer,
  onResetAll,
}) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const toggle = (name) => setOpenDropdown((prev) => (prev === name ? null : name));
  const close = () => setOpenDropdown(null);

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label>Year</label>
        <SegmentedControl options={years} value={year} onChange={onYearChange} />
      </div>
      <div className="filter-group">
        <label>Team</label>
        <TeamSelect teams={teams} value={team} onChange={onTeamChange} teamLabels={teamLabels} />
      </div>
      <div className="filter-group">
        <label>Vendor</label>
        <VendorDropdown
          isOpen={openDropdown === 'vendor'}
          onToggle={() => toggle('vendor')}
          onClose={close}
          vendorTree={vendorTree}
          vendorFlat={vendorFlat}
          vendorFilter={vendorFilter}
          onVendorFilterChange={onVendorFilterChange}
        />
      </div>
      <div className="filter-group">
        <label>Saved filters</label>
        <SavedFiltersDropdown
          isOpen={openDropdown === 'savedFilters'}
          onToggle={() => toggle('savedFilters')}
          onClose={close}
          savedViews={savedViews}
          activeSavedViewId={activeSavedViewId}
          onApply={(v) => {
            close();
            onApplySavedView(v);
          }}
          onRename={onRenameSavedView}
          onDelete={onDeleteSavedView}
        />
      </div>
      <div className="filter-group">
        <label>&nbsp;</label>
        <SaveFilterDropdown
          isOpen={openDropdown === 'saveFilter'}
          onToggle={() => toggle('saveFilter')}
          onClose={close}
          onSave={onSaveFilter}
        />
      </div>
      <div className="filter-group">
        <label>&nbsp;</label>
        <button
          type="button"
          className={`filters-toggle-btn${isFiltersDrawerOpen ? ' open' : ''}`}
          onClick={onToggleFiltersDrawer}
        >
          Filters
        </button>
      </div>
      <button type="button" className="reset-link" onClick={onResetAll}>
        Reset all filters
      </button>
    </div>
  );
}
