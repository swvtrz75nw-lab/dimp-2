// pages/NotificationsPage.jsx — full notifications page (sort + swipe-dismiss).
import React, { useState } from 'react';
import { PageShell } from './PageShell.jsx';
import { Icon } from '../components/Icon.jsx';
import { NotifCard } from '../components/Modals.jsx';

export default function NotificationsPage({ notifs, onDismiss, onOpenSettings }) {
  const [order, setOrder] = useState('urgency');
  const rank = { high: 0, med: 1, low: 2 };
  const sorted = order === 'urgency' ? [...notifs].sort((a, b) => rank[a.urgency] - rank[b.urgency]) : notifs;
  return (
    <PageShell kicker="System" title="Notifications" sub="Swipe a card left to dismiss, or reorder by urgency.">
      <div className="np-toolbar">
        <div className="seg">
          <button className={order === 'recent' ? 'active' : ''} onClick={() => setOrder('recent')}>Most recent</button>
          <button className={order === 'urgency' ? 'active' : ''} onClick={() => setOrder('urgency')}>By urgency</button>
        </div>
        <span style={{ flex: 1 }} />
        <button className="gbtn" onClick={onOpenSettings}><Icon name="plus" size={16} /> Add notification</button>
      </div>
      <div style={{ maxWidth: 640 }}>
        {sorted.length === 0 ? (
          <div className="empty-tab"><div className="et-ic"><Icon name="bell" size={26} /></div>You’re all caught up.</div>
        ) : sorted.map((n) => <NotifCard key={n.id} n={n} onDismiss={() => onDismiss(n.id)} />)}
      </div>
    </PageShell>
  );
}
