// pages/DomainPage.jsx — DIM / Inflation / Equipment domain shells.
import React from 'react';
import { PageShell, StatCard } from './PageShell.jsx';
import { Icon } from '../components/Icon.jsx';
import { SUGGESTIONS } from '../mockData/suggestions.js';
import { DOMAIN_META } from '../mockData/domains.js';

export default function DomainPage({ id, onNavigate }) {
  const m = DOMAIN_META[id];
  return (
    <PageShell kicker={m.kicker} title={m.title} sub={m.sub}>
      <div className="card-grid">
        {m.cards.map((c, i) => <StatCard key={i} label={c[0]} value={c[1]} delta={c[2]} deltaUp={c[3]} icon={c[4]} color={c[5]} />)}
      </div>
      <div className="section-title">Suggested questions</div>
      {(SUGGESTIONS.find((s) => s.id === (id === 'inflation' ? 'inflation' : id))?.prompts || SUGGESTIONS[0].prompts).map((p, i) => (
        <button key={i} className="history-item" onClick={() => onNavigate({ page: 'chat', prefill: p })}>
          <span className="hi-ic"><Icon name="search" size={17} /></span>
          <div style={{ flex: 1 }}><div className="hi-title">{p}</div></div>
          <Icon name="arrowRight" size={18} style={{ color: 'var(--pmi-blue)' }} />
        </button>
      ))}
    </PageShell>
  );
}
