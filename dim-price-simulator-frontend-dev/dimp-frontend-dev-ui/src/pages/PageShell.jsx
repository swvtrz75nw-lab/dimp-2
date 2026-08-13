// pages/PageShell.jsx — shared page chrome + the stat/info card used across pages.
import React from 'react';
import { Icon } from '../components/Icon.jsx';
import './pages.css';

export function PageShell({ kicker, title, sub, children }) {
  return (
    <div className="page">
      <div className="page-inner">
        <div className="page-head">
          <div className="page-kicker">{kicker}</div>
          <h1 className="page-title">{title}</h1>
          {sub && <p className="page-sub">{sub}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function StatCard({ icon, color, label, value, delta, deltaUp }) {
  return (
    <div className="info-card">
      <div className="ic-ic" style={{ background: color }}><Icon name={icon} size={22} /></div>
      <div className="ic-label">{label}</div>
      <div className="ic-value">{value}</div>
      {delta && <div className="ic-delta" style={{ color: deltaUp ? 'var(--pmi-magenta)' : 'var(--c-green)' }}>{delta}</div>}
    </div>
  );
}

export default PageShell;
