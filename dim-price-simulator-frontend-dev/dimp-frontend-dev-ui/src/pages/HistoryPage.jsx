// pages/HistoryPage.jsx — full chat history list.
import React from 'react';
import { PageShell } from './PageShell.jsx';
import { Icon } from '../components/Icon.jsx';
import { ALL_HISTORY } from '../mockData/navigation.js';

export default function HistoryPage({ onNavigate }) {
  return (
    <PageShell kicker="Recent" title="Chat history" sub="Every conversation with the procurement assistant.">
      {ALL_HISTORY.map((c) => (
        <button key={c.id} className="history-item" onClick={() => onNavigate({ page: 'chat', chat: c.id })}>
          <span className="hi-ic"><Icon name="chat" size={18} /></span>
          <div style={{ flex: 1 }}><div className="hi-title">{c.title}</div><div className="hi-meta">{c.when}</div></div>
          <Icon name="chevronRight" size={18} style={{ color: 'var(--label-tertiary)' }} />
        </button>
      ))}
    </PageShell>
  );
}
