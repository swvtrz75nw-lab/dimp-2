// pages/PlatformPage.jsx — PDCA / Supplier 360 platform shells.
import React from 'react';
import { PageShell } from './PageShell.jsx';
import { Icon } from '../components/Icon.jsx';
import { PLATFORM_META } from '../mockData/domains.js';

export default function PlatformPage({ id }) {
  const m = PLATFORM_META[id];
  return (
    <PageShell kicker={m.kicker} title={m.title} sub={m.sub}>
      <div className="card-grid">
        {m.phases.map((p, i) => (
          <div key={i} className="info-card">
            <div className="ic-ic" style={{ background: p[2] }}><Icon name={id === 'pdca' ? 'pdca' : id === 'admin' ? 'settings' : 'supplier'} size={22} /></div>
            <div className="ic-title">{p[0]}</div>
            <div className="ic-value" style={{ fontSize: 24 }}>{p[1]}</div>
          </div>
        ))}
      </div>
      <div className="info-card" style={{ marginTop: 16 }}>
        <div className="ic-title">About this platform</div>
        <div className="ic-desc">{m.sub} This is a working shell — the full board view connects to your live workflow data.</div>
      </div>
    </PageShell>
  );
}
