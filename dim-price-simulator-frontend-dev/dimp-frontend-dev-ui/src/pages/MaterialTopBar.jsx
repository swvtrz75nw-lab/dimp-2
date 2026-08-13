// pages/MaterialTopBar.jsx — Material Price top bar: a View selector with create /
// edit / delete (default "All Categories"), the Categories / Spend Analysis tabs,
// and the timeframe filter. Mirrors the Inflation tab.
import React, { useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import {
  MAT_CATEGORIES, MAT_TIMEFRAMES, MAT_TIME_OPTIONS,
  matDeriveView, matFmtM, matFmtMShort, matCapFirst,
} from '../mockData/materialData.js';

// small glass dropdown
function MatPopover({ onClose, children, className = '', align = 'left', top = 'calc(100% + 8px)' }) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 39 }} onClick={onClose} />
      <div className={'inf-pop ' + className} style={{ [align]: 0, top }}>{children}</div>
    </>
  );
}

// ---- View selector (clicking opens the All-Categories dashboard view) ----
function MatViewSelector({ views, activeViewId, isActiveTab, onPick, onEdit, onDelete, onAdd }) {
  const [open, setOpen] = useState(false);
  const active = views.find((v) => v.id === activeViewId) || views[0];
  return (
    <div className="inf-view-wrap">
      <button
        className={'inf-view-btn' + (isActiveTab ? ' active' : '')}
        onClick={() => { onPick(active.id); setOpen((v) => !v); }}
      >
        <span className="ivb-dot" />
        <span className="ivb-name">{active.name}</span>
        <Icon name="chevronDown" size={15} className="ivb-chev" />
      </button>
      {open && (
        <MatPopover onClose={() => setOpen(false)} className="inf-view-menu">
          <div className="ivm-label">Your views</div>
          {views.map((v) => {
            const eff = matDeriveView(v);
            return (
              <div key={v.id} className={'ivm-row' + (v.id === activeViewId ? ' sel' : '')}
                onClick={() => { onPick(v.id); setOpen(false); }}>
                <span className="ivm-check">{v.id === activeViewId && <Icon name="check" size={15} />}</span>
                <div className="ivm-main">
                  <div className="ivm-name">{v.name}</div>
                  <div className="ivm-meta">{v.cats.length} categories</div>
                </div>
                <span className="ivm-pill" title="Total price effect in this view">{matFmtMShort(eff.total)}</span>
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
            );
          })}
          <button className="ivm-add" onClick={() => { setOpen(false); onAdd(); }}>
            <span className="ivm-add-ic"><Icon name="plus" size={15} /></span>
            Add view
          </button>
        </MatPopover>
      )}
    </div>
  );
}

// ---- View config modal (create / edit) ----
export function MatViewConfigModal({ initial, onClose, onSave }) {
  const [name, setName] = useState(initial ? initial.name : '');
  const [cats, setCats] = useState(initial ? initial.cats.slice() : []);
  const [priorities, setPriorities] = useState(initial ? (initial.priorities || '') : '');
  const editing = !!initial;
  const toggleCat = (id) => setCats((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const canSave = name.trim() && cats.length > 0;
  const preview = cats.length ? matDeriveView({ cats }) : null;

  function save() {
    if (!canSave) return;
    onSave({ id: initial ? initial.id : 'mv' + Date.now(), name: matCapFirst(name.trim()), cats, priorities, custom: true });
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
          <input className="inf-cfg-input" placeholder="e.g. Paper-linked lines" value={name}
            onChange={(e) => setName(matCapFirst(e.target.value))} autoFocus />
          <div className="inf-cfg-hint">The first word is capitalised automatically.</div>

          <label className="inf-cfg-flabel" style={{ marginTop: 18 }}>DIM categories</label>
          <div className="inf-cfg-cats">
            {MAT_CATEGORIES.map((c) => {
              const on = cats.includes(c.id);
              return (
                <button key={c.id} className={'inf-cfg-cat' + (on ? ' on' : '')} onClick={() => toggleCat(c.id)}>
                  {c.name}
                  {on && <span className="cfg-cat-x"><Icon name="check" size={13} /></span>}
                </button>
              );
            })}
          </div>

          <label className="inf-cfg-flabel" style={{ marginTop: 18 }}>Priority insights</label>
          <textarea className="inf-cfg-textarea" rows={3} value={priorities}
            placeholder="What should land first? e.g. flag categories drifting outside their model range, or pending sign-offs before cycle close…"
            onChange={(e) => setPriorities(e.target.value)} />
        </div>
        <div className="inf-cfg-foot">
          <div className="inf-cfg-preview">
            {preview
              ? <>Price effect · <b>{matFmtM(preview.total)}</b> · {cats.length} categories</>
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

// ---- timeframe filter pills ----
function MatFilterPill({ label, value, options, onSelect, onClear, placeholder }) {
  const [open, setOpen] = useState(false);
  if (value) {
    return (
      <span className="inf-fpill set">
        <span className="ifp-label">{label}</span>
        <span className="ifp-value">{value}</span>
        <button className="ifp-x" onClick={onClear} aria-label={'Clear ' + label}><Icon name="x" size={12} /></button>
      </span>
    );
  }
  return (
    <div className="inf-fpill-wrap">
      <button className={'inf-fpill ghost' + (open ? ' open' : '')} onClick={() => setOpen((v) => !v)}>
        <Icon name="plus" size={13} className="ifp-plus" />
        <span>{placeholder}</span>
        <Icon name="chevronDown" size={13} />
      </button>
      {open && (
        <MatPopover onClose={() => setOpen(false)} className="inf-filter-menu">
          {options.map((o) => (
            <button key={o} className="inf-filter-opt" onClick={() => { onSelect(o); setOpen(false); }}>{o}</button>
          ))}
        </MatPopover>
      )}
    </div>
  );
}

function MatNetflixFilter({ timeframe, timeValue, onChange }) {
  return (
    <div className="inf-filter">
      <Icon name="filter" size={15} className="inf-filter-ic" />
      {/* <MatFilterPill
        label="Time-frame" value={timeframe} placeholder="Time-frame"
        options={MAT_TIMEFRAMES}
        onSelect={(tf) => onChange({ timeframe: tf, timeValue: null })}
        onClear={() => onChange({ timeframe: null, timeValue: null })}
      /> */}
      {timeframe && (
        <MatFilterPill
          // label={timeframe === 'Yearly' ? 'Year' : timeframe === 'Quarterly' ? 'Quarter' : 'Month'}
          label="Cycle"
          value={timeValue}
          placeholder={timeframe === 'Yearly' ? 'Select year' : timeframe === 'Quarterly' ? 'Select quarter' : 'Select month'}
          options={MAT_TIME_OPTIONS[timeframe]}
          onSelect={(tv) => onChange({ timeframe, timeValue: tv })}
          onClear={() => onChange({ timeframe, timeValue: null })}
        />
      )}
    </div>
  );
}

const MAT_TABS = [
  { id: 'categories', label: 'Categories Details' },
  // { id: 'spend', label: 'Spend Analysis' },
];

export function MaterialTopBar(props) {
  const { views, activeViewId, activeTab, onTab, onPickView, onEditView, onDeleteView, onAddView,
    timeframe, timeValue, onFilter } = props;
  return (
    <div className="inf-topbar">
      <div className="inf-topbar-left">
        <MatViewSelector
          views={views} activeViewId={activeViewId}
          isActiveTab={activeTab === 'view'}
          onPick={(id) => { onPickView(id); onTab('view'); }}
          onEdit={onEditView} onDelete={onDeleteView} onAdd={onAddView}
        />
        <span className="inf-tab-sep" />
        {MAT_TABS.map((t) => (
          <button key={t.id} className={'inf-tab' + (activeTab === t.id ? ' active' : '')} onClick={() => onTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="inf-topbar-right">
        <MatNetflixFilter timeframe={timeframe} timeValue={timeValue} onChange={onFilter} />
      </div>
    </div>
  );
}
