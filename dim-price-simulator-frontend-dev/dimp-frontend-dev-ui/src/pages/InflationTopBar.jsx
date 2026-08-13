// pages/InflationTopBar.jsx — the Inflation top bar: View selector, sub-tab buttons,
// and filter pills. All data comes from the backend API via props.
import React, { useState } from 'react';
import { Icon } from '../components/Icon.jsx';

// capitalize the first letter of the first word
export function infCapFirst(s) { return (s || '').replace(/^(\s*)([a-z])/, (m, a, b) => a + b.toUpperCase()); }

// ---- small glass dropdown used by the filter + view menu ----
function InfPopover({ onClose, children, className = '', align = 'left', top = 'calc(100% + 8px)' }) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 39 }} onClick={onClose} />
      <div className={'inf-pop ' + className} style={{ [align]: 0, top }}>{children}</div>
    </>
  );
}

// ============================================================
// View selector
// ============================================================
function ViewSelector({ views, activeViewId, onPick, onEdit, onDelete, onAdd, isActiveTab }) {
  const [open, setOpen] = useState(false);
  const active = views.find((v) => v.id === activeViewId) || views[0];

  return (
    <div className="inf-view-wrap">
      <button
        className={'inf-view-btn' + (isActiveTab ? ' active' : '')}
        onClick={() => { onPick(active.id); setOpen((v) => !v); }}
      >
        <span className="ivb-name">{active.name}</span>
        <Icon name="chevronDown" size={15} className="ivb-chev" />
      </button>

      {open && (
        <InfPopover onClose={() => setOpen(false)} className="inf-view-menu">
          <div className="ivm-label">Your views</div>
          {views.map((v) => (
            <div key={v.id} className={'ivm-row' + (v.id === activeViewId ? ' sel' : '')}
              onClick={() => { onPick(v.id); setOpen(false); }}>
              <span className="ivm-check">{v.id === activeViewId && <Icon name="check" size={15} />}</span>
              <div className="ivm-main">
                <div className="ivm-name">{v.name}</div>
                <div className="ivm-meta">{v.cats?.length || 0} categories</div>
              </div>
              <div className="ivm-actions">
                <button className="ivm-iconbtn" title="Edit view"
                  onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(v); }}>
                  <Icon name="pencil" size={14} />
                </button>
                <button className="ivm-iconbtn danger" title="Delete view"
                  onClick={(e) => { e.stopPropagation(); onDelete(v.id); }}>
                  <Icon name="trash" size={14} />
                </button>
              </div>
            </div>
          ))}
          <button className="ivm-add" onClick={() => { setOpen(false); onAdd(); }}>
            <span className="ivm-add-ic"><Icon name="plus" size={15} /></span>
            Add view
          </button>
        </InfPopover>
      )}
    </div>
  );
}

// ============================================================
// View config modal (create / edit)
// ============================================================
export function ViewConfigModal({ initial, onClose, onSave, categoryOptions }) {
  const [name, setName] = useState(initial ? initial.name : '');
  const [cats, setCats] = useState(initial ? initial.cats.slice() : []);
  const [priorities, setPriorities] = useState(initial ? initial.priorities : '');
  const editing = !!initial;

  const toggleCat = (id) => setCats((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const canSave = name.trim() && cats.length > 0;

  function save() {
    if (!canSave) return;
    onSave({
      id: initial ? initial.id : 'v' + Date.now(),
      name: infCapFirst(name.trim()),
      cats, priorities, custom: true,
    });
  }

  return (
    <div className="scrim" onClick={onClose}>
      <div className="inf-cfg" onClick={(e) => e.stopPropagation()}>
        <div className="inf-cfg-head">
          <div>
            <div className="inf-cfg-kicker"><Icon name="sliders" size={13} /> {editing ? 'Edit view' : 'New view'}</div>
            <h3>{editing ? 'Edit your view' : 'Configure a view'}</h3>
          </div>
          <button className="gbtn icon-only" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>

        <div className="inf-cfg-body">
          <label className="inf-cfg-flabel">View name</label>
          <input className="inf-cfg-input" placeholder="e.g. High-exposure categories" value={name}
            onChange={(e) => setName(infCapFirst(e.target.value))} autoFocus />
          <div className="inf-cfg-hint">The first word is capitalised automatically.</div>

          <label className="inf-cfg-flabel" style={{ marginTop: 18 }}>Procurement categories (L2)</label>
          <div className="inf-cfg-cats">
            {(categoryOptions || []).map((c) => {
              const on = cats.includes(c);
              return (
                <button key={c} className={'inf-cfg-cat' + (on ? ' on' : '')} onClick={() => toggleCat(c)}>
                  {c}
                  {on && <span className="cfg-cat-x"><Icon name="check" size={13} /></span>}
                </button>
              );
            })}
          </div>

          <label className="inf-cfg-flabel" style={{ marginTop: 18 }}>Priority insights</label>
          <textarea className="inf-cfg-textarea" rows={3} value={priorities}
            placeholder="What summaries should land first? e.g. which categories have highest inflation exposure…"
            onChange={(e) => setPriorities(e.target.value)} />
        </div>

        <div className="inf-cfg-foot">
          <div className="inf-cfg-preview">
            {cats.length > 0
              ? <>{cats.length} categories selected</>
              : <span style={{ color: 'var(--label-tertiary)' }}>Select at least one category</span>}
          </div>
          <div className="row gap-8">
            <button className="gbtn" onClick={onClose}>Cancel</button>
            <button className={'gbtn primary' + (canSave ? '' : ' disabled')} disabled={!canSave} onClick={save}>
              {editing ? 'Save changes' : 'Create view'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Netflix-style filter — year selector from API filter options
// ============================================================
function NetflixFilter({ timeframe, timeValue, onChange, yearOptions }) {
  const [open, setOpen] = useState(false);
  const years = yearOptions && yearOptions.length > 0 ? yearOptions.map(String) : ['2025', '2026', '2027', '2028'];
  const selected = timeValue || years[years.length - 1] || '2026';

  return (
    <div className="inf-filter">
      <div className="inf-fpill-wrap" style={{ position: 'relative' }}>
        <button className={'inf-fpill set'} onClick={() => setOpen((v) => !v)}>
          <span className="ifp-label">Year</span>
          <span className="ifp-value">{selected}</span>
          <Icon name="chevronDown" size={13} />
        </button>
        {open && (
          <InfPopover onClose={() => setOpen(false)} className="inf-filter-menu" align="right">
            {years.map((y) => (
              <button key={y} className={'inf-filter-opt' + (y === selected ? ' selected' : '')} onClick={() => { onChange({ timeframe: 'Yearly', timeValue: y }); setOpen(false); }}>
                {y}
              </button>
            ))}
          </InfPopover>
        )}
      </div>
    </div>
  );
}

// ============================================================
// The whole top bar
// ============================================================
const INF_TABS = [
  { id: 'view', label: 'View' },
  { id: 'spend', label: 'Category Breakdown' },
  { id: 'deepdive', label: 'Market Breakdown' },
];

export function InflationTopBar(props) {
  const { views, activeViewId, activeTab, onTab, onPickView, onEditView, onDeleteView, onAddView,
    timeframe, timeValue, onFilter, yearOptions, onOpenFilters, activeFilterCount } = props;
  return (
    <div className="inf-topbar">
      <div className="inf-topbar-left">
        {activeTab === 'view' && (
          <button className="inf-view-breakdown-btn" onClick={() => onTab('mechanics')}>
            View Breakdown <Icon name="arrowRight" size={13} />
          </button>
        )}
        <button
          className={'inf-tab' + (activeTab === 'view' ? ' active' : '')}
          onClick={() => onTab('view')}
        >
          Inflation Dashboard
        </button>
        <span className="inf-tab-sep" />
        {INF_TABS.slice(1).map((t) => (
          <button key={t.id} className={'inf-tab' + (activeTab === t.id ? ' active' : '')} onClick={() => onTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="inf-topbar-right">
        <button className={'inf-filters-trigger' + (activeFilterCount > 0 ? ' has-filters' : '')} onClick={onOpenFilters}>
          <Icon name="sliders" size={15} />
          <span>Filters</span>
          {activeFilterCount > 0 && <span className="inf-filters-badge">{activeFilterCount}</span>}
        </button>
        <NetflixFilter timeframe={timeframe} timeValue={timeValue} onChange={onFilter} yearOptions={yearOptions} />
      </div>
    </div>
  );
}
