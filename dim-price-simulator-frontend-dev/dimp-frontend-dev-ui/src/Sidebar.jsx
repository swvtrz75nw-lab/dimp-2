// Sidebar.jsx — retractable left sidebar (nav, recent, profile/bell/theme footer)
import React from 'react';
import { Icon } from './components/Icon.jsx';
import { NAV, RECENT } from './mockData/navigation.js';
import { USER } from './mockData/user.js';
import './Sidebar.css';

export default function Sidebar({ collapsed, onToggle, route, onNavigate, onOpenProfile, onOpenNotifications, notifCount, theme, onToggleTheme }) {
  return (
    <aside className={'sidebar' + (collapsed ? ' collapsed' : '')} onDoubleClick={collapsed ? onToggle : undefined}>
      {/* header / wordmark */}
      <div className="sb-header">
        <button
          className="sb-logo-toggle"
          onClick={collapsed ? onToggle : undefined}
          title={collapsed ? 'Expand sidebar' : undefined}
          aria-label={collapsed ? 'Expand sidebar' : undefined}
        >
          <span className="sb-logo-mark"><img src={theme === 'dark' ? '/assets/crest_white.png' : '/assets/crest.png'} alt="PMI Tech" /></span>
          <span className="sb-logo-expand"><Icon name="panelLeft" size={18} /></span>
        </button>
        {!collapsed && (
          <div className="sb-wordmark">
            <span className="w1">Procurement Intel</span>
            <span className="w2">Powered by PMI Tech</span>
          </div>
        )}
        {!collapsed && (
          <button className="sb-collapse-btn" onClick={onToggle} title="Collapse sidebar" aria-label="Collapse sidebar">
            <Icon name="panelLeft" size={19} />
          </button>
        )}
      </div>

      {/* scrollable nav */}
      <div className="sb-scroll">
        {NAV.map((item, i) => {
          if (item.section) {
            return <div key={'sec' + i} className="sb-section-label">{item.section}</div>;
          }
          const active = route.page === item.id;
          if (item.comingSoon) {
            return (
              <button
                key={item.id}
                className="sb-item sb-item-soon"
                disabled
                title={collapsed ? item.label + ' — coming soon' : undefined}
              >
                <span className="sb-icon"><Icon name={item.icon} size={21} /></span>
                <span className="sb-label">{item.label}</span>
                <span className="sb-soon-pill">Coming Soon</span>
              </button>
            );
          }
          return (
            <button
              key={item.id}
              className={'sb-item' + (active ? ' active' : '') + (item.id === 'chat' ? ' sb-item-procureai' : '')}
              onClick={() => onNavigate({ page: item.id })}
              title={collapsed ? item.label : undefined}
            >
              <span className="sb-icon"><Icon name={item.icon} size={21} /></span>
              <span className="sb-label">{item.label}</span>
              {item.id === 'chat' && <span className="sb-ai-badge">AI</span>}
            </button>
          );
        })}

        {/* Recent */}
        <div className="sb-section-label">Recent</div>
        {!collapsed && RECENT.map((c) => (
          <button key={c.id} className="sb-item sb-recent-item" onClick={() => onNavigate({ page: 'chat', chat: c.id })} title={c.title}>
            <span className="sb-recent-dot" />
            <span className="sb-label">{c.title}</span>
          </button>
        ))}
        {!collapsed && (
          <button className="sb-showall" onClick={() => onNavigate({ page: 'history' })}>Show all</button>
        )}
      </div>

      {/* footer: profile + bell (stacked when collapsed) */}
      <div className="sb-footer">
        <button className="sb-profile" onClick={onOpenProfile} title="Profile & settings">
          <span className="avatar">{USER.initials}</span>
          {!collapsed && (
            <span className="sb-profile-meta">
              <span className="nm">{USER.first} {USER.last}</span>
              <span className="rl">{USER.role}</span>
            </span>
          )}
        </button>
        <button className="sb-bell" onClick={onOpenNotifications} title="Notifications" aria-label="Notifications">
          <Icon name="bell" size={20} />
          {notifCount > 0 && <span className="badge" />}
        </button>
        <button className="sb-bell" onClick={onToggleTheme} title="Toggle theme" aria-label="Toggle theme">
          <Icon name={theme === 'light' ? 'moon' : 'sun'} size={19} />
        </button>
      </div>
    </aside>
  );
}
