// components/Modals.jsx — profile settings, consumption, notification rules,
// notifications popover, and the swipeable notification card.
import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon.jsx';
import { CONSUMPTION } from '../mockData/consumption.js';
import { getConsumption } from '../services/api.js';
import './Modals.css';

function fmt(n) { return n.toLocaleString('en-US'); }

// ---------- Profile settings modal ----------
export function ProfileModal({ onClose, user, setUser, rules, setRules, startTab }) {
  const [tab, setTab] = useState(startTab || 'profile');
  return (
    <div className="scrim" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pm-side">
          <div className="pm-title">Account</div>
          {[
            { id: 'profile', icon: 'user', label: 'Profile Settings' },
            { id: 'consumption', icon: 'gauge', label: 'Consumption' },
            { id: 'notification', icon: 'bell', label: 'Notification' },
          ].map((t) => (
            <button key={t.id} className={'pm-tab' + (tab === t.id ? ' active' : '')} onClick={() => setTab(t.id)}>
              <Icon name={t.icon} size={19} className="pm-tic" /> {t.label}
            </button>
          ))}
        </div>
        <div className="pm-main">
          <div className="pm-main-head">
            <h3>{tab === 'profile' ? 'Profile Settings' : tab === 'consumption' ? 'Consumption' : 'Notification'}</h3>
            <button className="gbtn icon-only" onClick={onClose}><Icon name="x" size={16} /></button>
          </div>
          <div className="pm-main-body">
            {tab === 'profile' && <ProfileTab user={user} setUser={setUser} />}
            {tab === 'consumption' && <ConsumptionTab />}
            {tab === 'notification' && <NotifSettingsTab rules={rules} setRules={setRules} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ user, setUser }) {
  const set = (k) => (e) => setUser({ ...user, [k]: e.target.value });
  return (
    <div>
      <div className="profile-bighead">
        <span className="avatar">{(user.first[0] || '') + (user.last[0] || '')}</span>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{user.first} {user.last}</div>
          <div style={{ fontSize: 13, color: 'var(--label-secondary)' }}>{user.role}</div>
        </div>
      </div>
      <div className="field-row">
        <div className="field"><label>First name</label><input value={user.first} onChange={set('first')} /></div>
        <div className="field"><label>Last name</label><input value={user.last} onChange={set('last')} /></div>
      </div>
      <div className="field"><label>Email address</label><input type="email" value={user.email} onChange={set('email')} /></div>
      <div className="field"><label>Role</label><input value={user.role} onChange={set('role')} /></div>
    </div>
  );
}

function ConsumptionTab() {
  // Hydrate from the services layer (falls back to bundled mock data).
  const [c, setC] = useState(CONSUMPTION);
  useEffect(() => { let alive = true; getConsumption().then((d) => alive && d && setC(d)); return () => { alive = false; }; }, []);

  const pct = Math.round((c.used / c.limit) * 100);
  const maxMonth = Math.max(...c.months.map((m) => m.v));
  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--label-secondary)', marginBottom: 4 }}>Tokens this month</div>
      <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em' }}>{fmt(c.used)} <span style={{ fontSize: 16, color: 'var(--label-tertiary)', fontWeight: 600 }}>/ {fmt(c.limit)}</span></div>
      <div className="cons-bar-wrap">
        <div className="cons-bar"><div style={{ width: pct + '%' }} /></div>
        <div className="cons-meta"><span>{pct}% of monthly allowance</span><span>{fmt(c.limit - c.used)} remaining</span></div>
      </div>

      <div className="cons-grid">
        <div className="cons-card"><div className="cc-l">Estimated cost</div><div className="cc-v">${c.cost.toFixed(2)}</div><div style={{ fontSize: 12, color: 'var(--label-secondary)' }}>of ${c.budget} budget</div></div>
        <div className="cons-card"><div className="cc-l">Avg. cost / query</div><div className="cc-v">$0.31</div><div style={{ fontSize: 12, color: 'var(--label-secondary)' }}>298 queries</div></div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--label-secondary)', margin: '4px 0 8px' }}>By tool</div>
      {c.byTool.map((t) => (
        <div key={t.name} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}><span>{t.name}</span><b>{fmt(t.tokens)}</b></div>
          <div className="cons-bar" style={{ height: 8 }}><div style={{ width: (t.tokens / c.used * 100) + '%', background: t.color }} /></div>
        </div>
      ))}

      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--label-secondary)', margin: '18px 0 4px' }}>Monthly trend</div>
      <div className="cons-months">
        {c.months.map((m, i) => (
          <div key={m.m} className="cm">
            <div className={'cm-bar' + (i === c.months.length - 1 ? ' cur' : '')} style={{ height: (m.v / maxMonth * 100) + '%' }} />
            <div className="cm-x">{m.m}</div>
          </div>
        ))}
      </div>

      <div className="cons-warn">
        <Icon name="alert" size={17} className="cw-ic" />
        <span>You’re on track to reach <b>~88%</b> of your token limit this month. Consider scheduling heavy Analyst runs for next cycle.</span>
      </div>
    </div>
  );
}

function NotifSettingsTab({ rules, setRules }) {
  const toggle = (id, key) => setRules(rules.map((r) => r.id === id ? { ...r, [key]: !r[key] } : r));
  const remove = (id) => setRules(rules.filter((r) => r.id !== id));
  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--label-secondary)', marginBottom: 10, lineHeight: 1.45 }}>
        Notifications are text-based rules that watch your data. Toggle email delivery per rule, or remove one entirely.
      </div>
      {rules.map((r) => (
        <div key={r.id} className="rule">
          <div className="r-main">
            <div className="r-title">{r.title}</div>
            <div className="r-desc">{r.desc}</div>
            {r.email && <span className="r-email"><Icon name="mail" size={13} /> Email delivery on</span>}
          </div>
          <div className="rule-actions">
            <button className={'toggle' + (r.on ? ' on' : '')} onClick={() => toggle(r.id, 'on')} aria-label="Toggle rule" />
            <div className="row gap-8">
              <button className="gbtn icon-only" style={{ width: 30, height: 30 }} title="Email delivery" onClick={() => toggle(r.id, 'email')}>
                <Icon name="mail" size={14} style={{ color: r.email ? 'var(--pmi-blue)' : 'var(--label-tertiary)' }} />
              </button>
              <button className="gbtn icon-only" style={{ width: 30, height: 30 }} title="Remove" onClick={() => remove(r.id)}>
                <Icon name="trash" size={14} style={{ color: 'var(--c-red)' }} />
              </button>
            </div>
          </div>
        </div>
      ))}
      <button className="gbtn" style={{ marginTop: 16 }}><Icon name="plus" size={16} /> Add notification rule</button>
    </div>
  );
}

// ---------- Notifications popover ----------
const URG_COLOR = { high: 'var(--c-red)', med: 'var(--c-orange)', low: 'var(--pmi-teal)' };
const URG_ICONBG = { high: 'var(--c-red)', med: 'var(--c-orange)', low: 'var(--pmi-teal)' };

export function NotificationsPopover({ notifs, onDismiss, onClose, onOpenSettings, onSeeAll }) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 59 }} onClick={onClose} />
      <div className="notif-pop">
        <div className="notif-head">
          <b>Notifications</b>
          <div className="row gap-8">
            <button className="gbtn icon-only" style={{ width: 32, height: 32 }} title="Settings" onClick={onOpenSettings}><Icon name="settings" size={15} /></button>
            <button className="gbtn icon-only" style={{ width: 32, height: 32 }} onClick={onClose}><Icon name="x" size={15} /></button>
          </div>
        </div>
        <div className="notif-list">
          {notifs.length === 0 ? (
            <div className="empty-tab" style={{ padding: '40px 20px' }}><div className="et-ic"><Icon name="bell" size={24} /></div>You’re all caught up.</div>
          ) : notifs.map((n) => <NotifCard key={n.id} n={n} onDismiss={() => onDismiss(n.id)} />)}
        </div>
        <div style={{ padding: 10, boxShadow: 'inset 0 0.5px 0 var(--separator)' }}>
          <button className="gbtn" style={{ width: '100%' }} onClick={onSeeAll}>See all notifications</button>
        </div>
      </div>
    </>
  );
}

// swipeable card (iOS-style)
export function NotifCard({ n, onDismiss }) {
  const [dx, setDx] = useState(0);
  const drag = useRef(null);
  const start = (e) => { drag.current = { x: (e.touches ? e.touches[0].clientX : e.clientX), dx: 0 }; };
  const move = (e) => {
    if (!drag.current) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const d = Math.min(0, x - drag.current.x); drag.current.dx = d; setDx(d);
  };
  const end = () => {
    if (!drag.current) return;
    if (drag.current.dx < -70) { setDx(-400); setTimeout(onDismiss, 180); }
    else setDx(0);
    drag.current = null;
  };
  return (
    <div className="notif-card">
      <button className="nc-del" onClick={onDismiss}><Icon name="trash" size={18} /></button>
      <div
        className="nc-inner"
        style={{ transform: `translateX(${dx}px)` }}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
      >
        <span className="urg-dot" style={{ background: URG_COLOR[n.urgency] }} />
        <span className="nc-ic" style={{ background: URG_ICONBG[n.urgency] }}><Icon name={n.icon} size={18} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="nc-title">{n.title}</div>
          <div className="nc-body">{n.body}</div>
          <div className="nc-time">{n.time}</div>
        </div>
      </div>
    </div>
  );
}
