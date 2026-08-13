// pages/HomePage.jsx — the procurement cockpit landing page.
import React from 'react';
import { PageShell } from './PageShell.jsx';
import { Icon } from '../components/Icon.jsx';
import { USER } from '../mockData/user.js';
import { RECENT } from '../mockData/navigation.js';

export default function HomePage({ onNavigate }) {
  return (
    <PageShell kicker={`Welcome back, ${USER.first}`} title="Your procurement cockpit" sub="A live view across direct input materials, inflation and equipment — start a conversation or jump into a domain.">
      <button className="info-card clickable" onClick={() => onNavigate({ page: 'chat' })} style={{ background: 'var(--pmi-grad-full)', color: '#fff', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 18 }}>
        <span style={{ width: 52, height: 52, borderRadius: 15, background: 'rgba(255,255,255,0.2)', display: 'grid', placeItems: 'center', flex: 'none' }}><Icon name="star4" size={24} /></span>
        <span style={{ flex: 1 }}>
          <div style={{ fontSize: 19, fontWeight: 700 }}>Ask the procurement assistant</div>
          <div style={{ fontSize: 13.5, opacity: 0.9, marginTop: 2 }}>Chat, run an Analyst report, or deep-dive any figure with full source transparency.</div>
        </span>
        <Icon name="arrowRight" size={22} />
      </button>

      <div className="card-grid">
        <div className="info-card" style={{ background: 'linear-gradient(135deg, #0d1b2a 0%, #1a2744 100%)', border: '1px solid rgba(56,189,248,0.15)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div className="ic-ic" style={{ background: 'var(--pmi-blue)' }}><Icon name="trending" size={22} /></div>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#22c55e', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.04) 100%)', border: '1px solid rgba(34,197,94,0.2)' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }}/>Active</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--label-primary)', marginTop: 8 }}>Material Price Forecasting <span style={{ fontWeight: 400, color: 'var(--label-secondary)' }}>(DIM)</span></div>
          <div style={{ fontSize: 12, color: 'var(--label-secondary)', lineHeight: 1.5, marginTop: 4 }}>Simulates how index, and volume moves flow into item prices and category cost — the price effect in M$.</div>
          <div style={{ fontSize: 11, color: 'var(--label-tertiary)', fontFamily: 'monospace', marginTop: 6 }}>inputs × indexes × volumes × logic → impact M$</div>
          <div style={{ display: 'flex', gap: 20, marginTop: 'auto', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div><div style={{ fontSize: 20, fontWeight: 700, color: 'var(--pmi-blue)' }}>133 <span style={{ fontSize: 12, fontWeight: 500 }}>M$</span></div><div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--label-tertiary)', textTransform: 'uppercase' }}>Price effect</div></div>
            <div><div style={{ fontSize: 20, fontWeight: 700, color: 'var(--label-primary)' }}>5 <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--label-secondary)' }}>/ 50+</span></div><div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--label-tertiary)', textTransform: 'uppercase' }}>Categories</div></div>
          </div>
        </div>
        <div className="info-card" style={{ background: 'linear-gradient(135deg, #0d1b2a 0%, #1e1a2e 100%)', border: '1px solid rgba(168,24,141,0.15)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div className="ic-ic" style={{ background: 'var(--pmi-magenta)' }}><Icon name="inflation" size={22} /></div>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.04) 100%)', border: '1px solid rgba(245,158,11,0.2)' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }}/>In progress</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--label-primary)', marginTop: 8 }}>Inflation Forecasting <span style={{ fontWeight: 400, color: 'var(--label-secondary)' }}>(IM&S)</span></div>
          <div style={{ fontSize: 12, color: 'var(--label-secondary)', lineHeight: 1.5, marginTop: 4 }}>Projects how macro indicators inflate spend across the portfolio, and how much procurement offsets.</div>
          <div style={{ fontSize: 11, color: 'var(--label-tertiary)', fontFamily: 'monospace', marginTop: 6 }}>spend × macro indicators × logic → impact M$</div>
          <div style={{ display: 'flex', gap: 20, marginTop: 'auto', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div><div style={{ fontSize: 20, fontWeight: 700, color: 'var(--pmi-blue)' }}>67 <span style={{ fontSize: 12, fontWeight: 500 }}>M$</span></div><div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--label-tertiary)', textTransform: 'uppercase' }}>Net inflation</div></div>
            <div><div style={{ fontSize: 20, fontWeight: 700, color: 'var(--label-primary)' }}>0 <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--label-secondary)' }}>/ 78</span></div><div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--label-tertiary)', textTransform: 'uppercase' }}>Categories L4</div></div>
            <div><div style={{ fontSize: 20, fontWeight: 700, color: 'var(--label-primary)' }}>55<span style={{ fontSize: 12 }}>%</span></div><div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--label-tertiary)', textTransform: 'uppercase' }}>Offset</div></div>
          </div>
        </div>
        <div className="info-card" style={{ background: 'linear-gradient(135deg, #0d1b2a 0%, #1a1e2e 100%)', border: '1px solid rgba(148,163,184,0.12)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div className="ic-ic" style={{ background: 'var(--pmi-teal, #06b6d4)' }}><Icon name="equipment" size={22} /></div>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'linear-gradient(135deg, rgba(148,163,184,0.12) 0%, rgba(148,163,184,0.04) 100%)', border: '1px solid rgba(148,163,184,0.2)' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8' }}/>Scoping</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--label-primary)', marginTop: 8 }}>Equipment Costing Simulations <span style={{ fontWeight: 400, color: 'var(--label-secondary)' }}>(TP)</span></div>
          <div style={{ fontSize: 12, color: 'var(--label-secondary)', lineHeight: 1.5, marginTop: 4 }}>Equipment cost simulation — currently being scoped with the domain owner. Will run on the same platform.</div>
          <div style={{ fontSize: 11, color: 'var(--label-tertiary)', fontFamily: 'monospace', marginTop: 6 }}>equipment inputs × logic → impact M$</div>
          <div style={{ display: 'flex', gap: 20, marginTop: 'auto', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div><div style={{ fontSize: 20, fontWeight: 700, color: 'var(--label-primary)' }}>Phase 2</div><div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--label-tertiary)', textTransform: 'uppercase' }}>Onboarding</div></div>
            <div><div style={{ fontSize: 20, fontWeight: 700, color: 'var(--label-primary)' }}>Q3</div><div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--label-tertiary)', textTransform: 'uppercase' }}>Target</div></div>
          </div>
        </div>
      </div>

      <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
        Recent activity
      </div>
      <div className="ra-list">
        {[
          { icon: 'check', iconBg: '#22c55e', text: <><b>Acetate Tow</b> results signed off for June</>, meta: 'Marta Zielinska · 2h ago' },
          { icon: 'alert', iconBg: '#f87171', text: <>Risk alert — <b>Gas · Germany</b> · potential impact 4.7 M$</>, meta: 'Alerting Agent · 5h ago' },
          { icon: 'cube', iconBg: 'var(--pmi-blue)', text: <>Model Card (logic) for <b>Shipping Cases</b> updated via Logic Studio</>, meta: 'Tomasz Wisniewski · yesterday' },
          { icon: 'file', iconBg: '#a78bfa', text: <>Cross-category PDCA summary generated for <b>DIM</b></>, meta: 'PDCA Agent · 1d ago' },
          { icon: 'database', iconBg: '#c084fc', text: <><b>Index Library</b> — CPI inflation updated from S&P Global</>, meta: 'Data layer · 1 week ago' },
        ].map((item, i) => (
          <div key={i} className="ra-item">
            <span className="ra-icon" style={{ background: item.iconBg }}><Icon name={item.icon} size={16} /></span>
            <div className="ra-content">
              <div className="ra-text">{item.text}</div>
              <div className="ra-meta">{item.meta}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="section-title">Jump back in</div>
      {RECENT.map((c) => (
        <button key={c.id} className="history-item" onClick={() => onNavigate({ page: 'chat', chat: c.id })}>
          <span className="hi-ic"><Icon name="chat" size={18} /></span>
          <div style={{ flex: 1 }}><div className="hi-title">{c.title}</div><div className="hi-meta">Conversation · resume</div></div>
          <Icon name="chevronRight" size={18} style={{ color: 'var(--label-tertiary)' }} />
        </button>
      ))}
    </PageShell>
  );
}
