// pages/MaterialPage.jsx — the Material Price (DIM) tab. Same shell, typography and
// colour system as the Inflation tab: flat grouped surfaces, Liquid Glass reserved for
// the Key insights accordion, rising price effect shown in red (added cost).
import React, { useState, useRef } from 'react';
import { Icon } from '../components/Icon.jsx';
import { MaterialTopBar, MatViewConfigModal } from './MaterialTopBar.jsx';
import InflationIsland from './InflationIsland.jsx';
import {
  MAT_VIEWS_SEED, MAT_KEY_INSIGHTS, MAT_OFFICIAL_ORDER, MAT_OFFICIAL_SUMMARY, MAT_HEADLINE,
  MAT_DECOMP_NOTE, MAT_FOLLOWUPS, MAT_TIME_DEFAULT, MAT_PERIOD_NOUN, MAT_CONF_COLOR,
  matCatById, matDeriveView, matRangePos, matFmtM, matFmtMShort,
} from '../mockData/materialData.js';
import './inflation.css';
import './material.css';

// rising price effect = added cost = red (matches the Inflation tab); a fall is green.
function MatPct({ v, size }) {
  const up = v >= 0;
  return (
    <span className="mat-pct" style={{ color: up ? 'var(--c-red)' : 'var(--c-green)', fontSize: size }}>
      {up ? '▲' : '▼'} {Math.abs(v).toFixed(1)}%
    </span>
  );
}

// ---- pills ----
const MAT_STATUS_CLASS = { 'Signed off': 'ok', 'Pending': 'warn', 'In progress': 'idle' };
function MatStatusPill({ status }) {
  return <span className={'mat-status ' + (MAT_STATUS_CLASS[status] || 'idle')}><span className="mat-status-dot" />{status}</span>;
}
function MatGranPill({ level }) {
  const supplier = /supplier/i.test(level);
  return <span className={'mat-gran' + (supplier ? ' sup' : '')}>{level}</span>;
}
function MatModelPill({ v }) {
  return <span className={'mat-model' + (v === 'draft' ? ' draft' : '')}>{v}</span>;
}

// rich-text part array: {t} plain · {b} bold-label · {hl} accent
function MatRich({ parts }) {
  return parts.map((p, i) => {
    if (p.b) return <b key={i} className="mat-b">{p.b}</b>;
    if (p.hl) return <span key={i} className="mat-hl">{p.hl}</span>;
    return <React.Fragment key={i}>{p.t}</React.Fragment>;
  });
}

// section header with optional deep-dive link (mirrors the Inflation tab)
function MatSectionHead({ title, tag, deepDive, onDeepDive }) {
  return (
    <div className="inf-section-head">
      <div className="inf-sh-left">
        <h2 className="inf-h2">{title}</h2>
        {tag && <span className="inf-section-tag">{tag}</span>}
      </div>
      {deepDive && (
        <button className="inf-deepdive" onClick={onDeepDive}>
          Deep dive on {deepDive}<Icon name="arrowRight" size={14} />
        </button>
      )}
    </div>
  );
}

// horizontal value bar (matches the Inflation "By category" decomposition)
function MatBar({ label, amt, max, share, color }) {
  return (
    <div className="inf-decomp-row">
      <span className="idr-label"><span className="idr-label-t">{label}</span></span>
      <div className="idr-track"><span className="idr-fill" style={{ width: Math.max(3, (amt / max) * 100) + '%', background: color }} /></div>
      <span className="idr-val">{(Math.round(amt * 10) / 10).toFixed(1)}<span className="idr-share">{Math.round(share * 100)}%</span></span>
    </div>
  );
}

// ============================================================
// PRICE EFFECT — single card, modelled on the Inflation impact card
// ============================================================
function MatPriceImpact({ view, d, timeValue, onCategories }) {
  const decompMax = Math.max(...d.decomp.map((b) => b.amt), 1);
  const catMax = Math.max(...d.cats.map((c) => c.effect), 1);
  const idx = d.decomp[0];
  const topCat = [...d.cats].sort((a, b) => b.effect - a.effect)[0];
  const steepest = [...d.cats].sort((a, b) => b.vsMonth - a.vsMonth)[0];
  return (
    <section className="inf-section">
      <MatSectionHead title="Price effect" tag={`${view.name} · ${timeValue}`} deepDive="Categories Details" onDeepDive={onCategories} />
      <div className="inf-impact-card">
        <div className="iic-headrow">
          <div className="iic-lead">
            <div className="iic-label">Total DIM price effect this {MAT_PERIOD_NOUN.Monthly}</div>
            <div className="iic-value">{Math.round(d.total)} M$</div>
            <div className="iic-sub">
              <MatPct v={d.vsMonth} /> vs prior month · <MatPct v={d.vsYear} /> vs prior year
            </div>
          </div>
          <div className="iic-compare mat-glance">
            <div className="iic-cmp-title">This cycle at a glance</div>
            <div className="mat-glance-table">
              <div className="mat-glance-row mat-glance-header">
                <span>Categories live</span>
                <span>Signed off</span>
                <span>Cycle closes on</span>
              </div>
              <div className="mat-glance-row mat-glance-values">
                <span>{d.cats.length} / 50+</span>
                <span>{d.signedOff} of {d.cats.length}</span>
                <span>30th Jun</span>
              </div>
            </div>

            {/* Spend & Price Effect Over Time */}
            <div className="mat-spend-time">
              <div className="mat-spend-time-title">PRICE EFFECT OVER TIME</div>
              <div className="mat-spend-row">
                <div className="mat-spend-period"><strong>June 2026</strong><span>this month</span></div>
                <div className="mat-spend-bar"><div className="mat-spend-bar-fill" style={{ width: '100%', background: '#ef4444' }} /></div>
                <span className="mat-spend-val">$48.9M</span>
                <span className="mat-spend-eff"><strong>+3.0M</strong></span>
                <span className="mat-spend-pct" style={{ color: '#ef4444' }}>+6.5%</span>
              </div>
              <div className="mat-spend-row">
                <div className="mat-spend-period"><strong>May 2026</strong><span>last month</span></div>
                <div className="mat-spend-bar"><div className="mat-spend-bar-fill" style={{ width: '72%', background: '#b91c1c' }} /></div>
                <span className="mat-spend-val">$48.1M</span>
                <span className="mat-spend-eff"><strong>+2.2M</strong></span>
                <span className="mat-spend-pct">+4.8%</span>
              </div>
              <div className="mat-spend-row">
                <div className="mat-spend-period"><strong>April 2026</strong><span>two months ago</span></div>
                <div className="mat-spend-bar"><div className="mat-spend-bar-fill" style={{ width: '48%', background: '#b91c1c' }} /></div>
                <span className="mat-spend-val">$47.4M</span>
                <span className="mat-spend-eff"><strong>+1.5M</strong></span>
                <span className="mat-spend-pct">+3.3%</span>
              </div>
              <div className="mat-spend-footer">Price effect is <span style={{ color: '#ef4444', fontWeight: 600 }}>+35.9%</span> vs last month · <b>$1.5M</b> higher than a year ago</div>
            </div>
          </div>
        </div>

        <div className="iic-stats">
          <div className="iic-stat">
            <span className="iic-stat-k">Top driver</span>
            <span className="iic-stat-v">{idx.label}</span>
            <span className="iic-stat-x">{idx.amt} M$ · {d.total ? Math.round(idx.amt / d.total * 100) : 0}% of the effect</span>
          </div>
          <div className="iic-stat">
            <span className="iic-stat-k">Largest category</span>
            <span className="iic-stat-v">{topCat.name}</span>
            <span className="iic-stat-x">{matFmtM(topCat.effect)} contributed</span>
          </div>
          <div className="iic-stat">
            <span className="iic-stat-k">Steepest move</span>
            <span className="iic-stat-v">{steepest.name}</span>
            <span className="iic-stat-x"><MatPct v={steepest.vsMonth} /> month-on-month</span>
          </div>
        </div>

        <div className="inf-decomp-grid">
          <div className="inf-decomp-card">
            <div className="idc-head"><Icon name="barChart" size={14} /> Price effect decomposition</div>
            {d.decomp.map((b) => (
              <MatBar key={b.id} label={b.label} amt={b.amt} max={decompMax} share={d.total ? b.amt / d.total : 0} color={b.color} />
            ))}
          </div>
          <div className="inf-decomp-card">
            <div className="idc-head"><Icon name="layers" size={14} /> Price effect by category</div>
            {[...d.cats].sort((a, b) => b.effect - a.effect).map((c) => (
              <MatBar key={c.id} label={c.name} amt={c.effect} max={catMax} share={d.total ? c.effect / d.total : 0} color={c.color} />
            ))}
          </div>
        </div>
        <p className="mat-decomp-note">{MAT_DECOMP_NOTE}</p>
      </div>
    </section>
  );
}

// ============================================================
// KEY INSIGHTS — the only Liquid Glass surface (recommendation folded in)
// ============================================================
function MatInsightRow({ insight, viewCatSet, open, onToggle }) {
  const cats = insight.catIds.map(matCatById).filter((c) => c && viewCatSet.has(c.id));
  if (!cats.length) return null;
  const total = cats.reduce((s, c) => s + c.effect, 0);
  return (
    <div className={'inf-acc-row' + (open ? ' open' : '')}>
      <button className="inf-acc-head" onClick={onToggle}>
        <span className="acc-headline">{insight.headline}</span>
        <span className="acc-cats">
          {cats.slice(0, 2).map((c) => (
            <span key={c.id} className="acc-cat">
              {c.name}
              <b style={{ color: c.vsMonth >= 0 ? 'var(--c-red)' : 'var(--c-green)' }}>{c.vsMonth >= 0 ? '▲' : '▼'} {Math.abs(c.vsMonth).toFixed(1)}%</b>
            </span>
          ))}
          {cats.length > 2 && <span className="acc-cat more">+{cats.length - 2}</span>}
        </span>
        <span className="acc-pill">{matFmtMShort(total)}</span>
        <Icon name="chevronDown" size={15} className={'acc-chev' + (open ? ' open' : '')} />
      </button>
      {open && (
        <div className="inf-acc-body">
          <p className="acc-body-text">{insight.body}</p>
          <div className="acc-catlist">
            {cats.map((c) => (
              <div key={c.id} className="acc-catrow">
                <span className="acc-cr-name">{c.name}</span>
                <span className="acc-cr-range">{c.impactors}</span>
                <span className="acc-cr-impact" style={{ color: c.vsMonth >= 0 ? 'var(--c-red)' : 'var(--c-green)' }}>{c.vsMonth >= 0 ? '▲' : '▼'} {Math.abs(c.vsMonth).toFixed(1)}%</span>
                <span className="acc-cr-added">{matFmtMShort(c.effect)}</span>
              </div>
            ))}
          </div>
          <div className="mat-rec">
            <div className="mat-rec-title"><Icon name="bulb" size={14} /> Recommendation</div>
            <div className="mat-rec-body">{insight.rec}</div>
          </div>
          <div className="acc-metrics">
            <div className="acc-metric"><span className="acc-m-k">Price effect</span><span className="acc-m-v">{matFmtMShort(total)}</span></div>
            <div className="acc-metric"><span className="acc-m-k">Categories</span><span className="acc-m-v">{cats.length}</span></div>
            <div className="acc-metric"><span className="acc-m-k">{insight.metricLabel}</span><span className="acc-m-v">{insight.metricVal}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

function MatKeyInsights({ view }) {
  const catSet = new Set(view.cats);
  const cards = MAT_KEY_INSIGHTS.filter((i) => i.catIds.some((c) => catSet.has(c)));
  const [openId, setOpenId] = useState(cards.length ? cards[0].id : null);
  if (!cards.length) return null;
  return (
    <section className="inf-section">
      <div className="inf-glass-card">
        <div className="inf-glass-head">
          <div className="igh-title"><Icon name="sparkles" size={15} className="igh-spark" /> Key insights &amp; recommendations</div>
          <span className="igh-sub">Tailored to “{view.name}” · ProcureAI</span>
        </div>
        <div className="inf-acc-list">
          {cards.map((c) => (
            <MatInsightRow key={c.id} insight={c} viewCatSet={catSet}
              open={openId === c.id} onToggle={() => setOpenId((id) => (id === c.id ? null : c.id))} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// CATEGORIES tab — the full category breakdown table
// ============================================================
function MatCategories({ view, onOpenStudio, onBack }) {
  const cats = view.cats.map(matCatById).filter(Boolean);
  return (
    <section className="inf-section">
      <div className="inf-section-head">
        <div className="inf-sh-left">
          {onBack && <button className="mat-back-btn" onClick={onBack}><Icon name="chevronLeft" size={14} /> Back</button>}
          <h2 className="inf-h2">Category breakdown</h2><span className="inf-section-tag">{cats.length} categories · {view.name}</span>
        </div>
        <button className="inf-deepdive" onClick={onOpenStudio}>Open Logic Studio<Icon name="arrowRight" size={14} /></button>
      </div>
      <div className="mat-bt">
        <div className="mat-bt-head">
          <span>Category</span><span>Granularity</span><span>Price effect</span>
          <span>Impactors</span><span>Model card</span><span>Status</span><span>Next PDCA</span>
        </div>
        <div className="mat-bt-body">
          {cats.map((c) => (
            <div key={c.id} className="mat-bt-row">
              <span className="mat-bt-cat">{c.name}</span>
              <span><MatGranPill level={c.granularity} /></span>
              <span className="mat-bt-eff">{matFmtM(c.effect)}</span>
              <span className="mat-bt-imp">{c.impactors}</span>
              <span><MatModelPill v={c.model} /></span>
              <span><MatStatusPill status={c.status} /></span>
              <span className="mat-bt-pdca">{c.nextPdca}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// suggested follow-ups (mirrors the Inflation tab)
function MatFollowUps({ view, onPick }) {
  const qs = MAT_FOLLOWUPS(view);
  return (
    <section className="inf-section">
      <MatSectionHead title="Suggested follow-ups" tag="Tap to load into the assistant" />
      <div className="inf-followups">
        {qs.map((q, i) => (
          <button key={i} className="inf-followup" onClick={() => onPick(q)}>
            <Icon name="search" size={15} className="ifu-ic" />
            <span>{q}</span>
            <Icon name="arrowUp" size={15} className="ifu-go" />
          </button>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// RIGHT RAIL — categories tracked (Inflation-style) + key statistics
// ============================================================
function MatCategoryRail({ d, onDeepDive }) {
  return (
    <div className="inf-railsec">
      <div className="inf-railsec-head">
        <span>Categories tracked</span>
        <button className="inf-railsec-dd" onClick={onDeepDive}>Deep dive<Icon name="arrowRight" size={12} /></button>
      </div>
      <div className="inf-catrail-list">
        {d.cats.map((c) => (
          <div key={c.id} className="inf-catrail-row">
            <div className="icr-line">
              <span className="icr-name">{c.name}</span>
              <span className="icr-impact" style={{ color: c.vsMonth >= 0 ? 'var(--c-red)' : 'var(--c-green)' }}>{c.vsMonth >= 0 ? '▲' : '▼'} {Math.abs(c.vsMonth).toFixed(1)}%</span>
            </div>
            <div className="icr-rangebar">
              <span className="icr-range-fill" style={{ left: matRangePos(c.rangeLo) + '%', width: Math.max(4, matRangePos(c.rangeHi) - matRangePos(c.rangeLo)) + '%' }} />
            </div>
            {/* <div className="icr-foot">
              <span className="icr-rangetext">{c.rangeLo.toFixed(1)}% to {c.rangeHi >= 0 ? '+' : ''}{c.rangeHi.toFixed(1)}%</span>
              <span className="icr-conf" style={{ color: MAT_CONF_COLOR[c.conf] }}>
                <span className="icr-conf-dot" style={{ background: MAT_CONF_COLOR[c.conf] }} />{c.conf}
              </span>
            </div> */}
          </div>
        ))}
      </div>
    </div>
  );
}

function MatKeyStats({ d }) {
  const topCat = [...d.cats].sort((a, b) => b.effect - a.effect)[0];
  const idx = d.decomp[0];
  const stats = [
    { k: 'Total price effect', v: matFmtMShort(d.total), sub: 'this period' },
    { k: 'Largest driver', v: idx.label + ' · ' + idx.amt + ' M$', sub: d.total ? Math.round(idx.amt / d.total * 100) + '% of the effect' : '—' },
    { k: 'Top category', v: topCat ? topCat.name : '—', sub: topCat ? matFmtM(topCat.effect) + ' contributed' : '' },
    // { k: 'Cost avoided', v: MAT_HEADLINE.costAvoided + ' M$', sub: 'via procurement actions' },
    { k: 'Sign-off', v: d.signedOff + ' of ' + d.cats.length, sub: (d.cats.length - d.signedOff) + ' pending close' },
  ];
  return (
    <div className="inf-railsec">
      <div className="inf-railsec-head"><span>Key statistics</span><span className="mat-rail-tag">Price effect</span></div>
      <div className="mat-keystats">
        {stats.map((s, i) => (
          <div key={i} className="mat-keystat">
            <span className="mks-k">{s.k}</span>
            <span className="mks-v">{s.v}</span>
            <span className="mks-sub">{s.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// OFFICIAL RESULT tab
// ============================================================
function MatOfficial({ view, timeValue, onAssumptions }) {
  const catSet = new Set(view.cats);
  const rows = MAT_OFFICIAL_ORDER.map(matCatById).filter((c) => c && catSet.has(c.id));
  return (
    <section className="inf-section">
      <div className="inf-section-head">
        <div className="inf-sh-left"><h2 className="inf-h2">Monthly official results · {timeValue}</h2></div>
        <button className="inf-deepdive" onClick={onAssumptions}><Icon name="bulb" size={13} /> Assumptions &amp; takeaways</button>
      </div>
      <div className="mat-ot">
        <div className="mat-ot-head">
          <span>Category</span><span>Price effect</span><span>vs prior month</span>
          <span>vs prior year</span><span>Key impactor</span><span>Status</span>
        </div>
        <div className="mat-ot-body">
          {rows.map((c) => (
            <div key={c.id} className="mat-ot-row">
              <span className="mat-ot-cat">{c.name}</span>
              <span className="mat-ot-eff">{matFmtM(c.effect)}</span>
              <span><MatPct v={c.vsMonth} /></span>
              <span><MatPct v={c.vsYear} /></span>
              <span className="mat-ot-imp">{c.keyImpactor}</span>
              <span><MatStatusPill status={c.status} /></span>
            </div>
          ))}
        </div>
      </div>
      <div className="mat-summary">
        <span className="mat-summary-tag"><Icon name="sparkles" size={13} /> Auto-generated · cross-category summary</span>
        <p className="mat-summary-text"><MatRich parts={MAT_OFFICIAL_SUMMARY} /></p>
      </div>
    </section>
  );
}

// ============================================================
// SPEND ANALYSIS tab (stub)
// ============================================================
function MatSpendStub() {
  return (
    <div className="inf-stub">
      <div className="inf-stub-ic"><Icon name="barChart" size={26} /></div>
      <div className="inf-stub-title">Spend Analysis</div>
      <div className="inf-stub-desc">Supplier- and item-level breakdown of where the price effect lands across the DIM portfolio — coming next.</div>
      <div className="inf-stub-note">The right-hand category &amp; statistics panel stays live across every tab.</div>
    </div>
  );
}

// ============================================================
// PAGE
// ============================================================
export default function MaterialPage({ onNavigate, islandVariant = 'spring' }) {
  const [views, setViews] = useState(MAT_VIEWS_SEED);
  const [activeViewId, setActiveViewId] = useState('all');
  const [activeTab, setActiveTab] = useState('view');
  const [timeframe, setTimeframe] = useState('Monthly');
  const [timeValue, setTimeValue] = useState(MAT_TIME_DEFAULT.Monthly);
  const [islandValue, setIslandValue] = useState('');
  const [cfg, setCfg] = useState(null);
  const scrollRef = useRef(null);

  const view = views.find((v) => v.id === activeViewId) || views[0];
  const d = matDeriveView(view);
  const period = MAT_PERIOD_NOUN[timeframe];
  const noSelection = !timeframe || timeValue === null || timeValue === undefined || timeValue === '';

  function onFilter({ timeframe: tf, timeValue: tv }) {
    setTimeframe(tf);
    if (tf && tv === null && timeframe !== tf) setTimeValue(null);
    else setTimeValue(tv);
  }
  function saveView(v) {
    setViews((list) => (list.some((x) => x.id === v.id) ? list.map((x) => (x.id === v.id ? v : x)) : [...list, v]));
    setActiveViewId(v.id); setActiveTab('view'); setCfg(null);
  }
  function deleteView(id) {
    setViews((list) => {
      const next = list.filter((x) => x.id !== id);
      if (id === activeViewId) setActiveViewId(next[0] ? next[0].id : '');
      return next;
    });
  }
  const goTab = (t) => { setActiveTab(t); if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' }); };
  function sendIsland(q) { onNavigate && onNavigate({ page: 'chat', prefill: q }); }
  const openStudio = () => sendIsland('Open Logic Studio for the DIM price-effect model cards.');

  return (
    <div className={'inf-page mat-scope' + (noSelection ? ' is-locked' : '')}>
      <MaterialTopBar
        views={views} activeViewId={activeViewId} activeTab={activeTab}
        onTab={setActiveTab}
        onPickView={setActiveViewId}
        onEditView={(v) => setCfg({ initial: v })}
        onDeleteView={deleteView}
        onAddView={() => setCfg({ initial: null })}
        timeframe={timeframe} timeValue={timeValue} onFilter={onFilter}
      />

      <div className="inf-scroll" ref={scrollRef}>
        <div className="inf-layout">
          <div className="inf-main">
            {activeTab === 'view' && (
              <>
                <MatPriceImpact view={view} d={d} timeValue={timeValue} onCategories={() => goTab('categories')} />
                <MatKeyInsights view={view} />
                <MatFollowUps view={view} onPick={(q) => setIslandValue(q)} />
              </>
            )}
            {activeTab === 'categories' && <MatCategories view={view} onOpenStudio={openStudio} onBack={() => goTab('view')} />}
            {activeTab === 'spend' && <MatSpendStub />}
          </div>
          <aside className="inf-rail">
            <MatCategoryRail d={d} onDeepDive={() => goTab('categories')} />
            <MatKeyStats d={d} />
          </aside>
        </div>
      </div>

      <InflationIsland
        value={islandValue} onChange={setIslandValue} onSend={sendIsland}
        islandVariant={islandVariant}
        placeholder={`Ask about ${view.name.toLowerCase()} this ${period}…`}
      />

      {cfg && <MatViewConfigModal initial={cfg.initial} onClose={() => setCfg(null)} onSave={saveView} />}

      {noSelection && (
        <div className="inf-lock-overlay">
          <div className="inf-lock-card">
            <span className="inf-lock-ic"><Icon name="calendar" size={22} /></span>
            <div className="inf-lock-title">Select a timeframe</div>
            <div className="inf-lock-sub">Choose a timeframe and period above to load the DIM price-effect view.</div>
          </div>
        </div>
      )}
    </div>
  );
}
