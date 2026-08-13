// Navbar.jsx — chat top bar: New chat (left) · centered Answer/Source/Analysis
// tabs · Data (right). Base/"classic" variant; NavbarNew layers chrome on top.
import React from 'react';
import { Icon } from './components/Icon.jsx';
import './Navbar.css';

export default function Navbar({ hasStarted, inAnalyst, onNewChat, tab, onSelectTab, srcCount, anCount, onOpenData, variant = '' }) {
  return (
    <div className={'chat-topbar' + (variant ? ' ' + variant : '')}>
      <div className="tb-side">
        {(hasStarted || inAnalyst) && (
          <button className="gbtn newchat-btn" onClick={onNewChat} title="Start a new chat">
            <Icon name="plus" size={16} /> New chat
          </button>
        )}
      </div>

      <div className="tb-center">
        {hasStarted && (
          <div className="chat-tabs">
            <button className={'chat-tab' + (tab === 'answer' && !inAnalyst ? ' active' : '')} onClick={() => onSelectTab('answer')}>Answer</button>
            <button className={'chat-tab' + (tab === 'source' && !inAnalyst ? ' active' : '')} onClick={() => onSelectTab('source')}>
              Source {srcCount > 0 && <span className="count-pill">{srcCount}</span>}
            </button>
            <button className={'chat-tab' + (tab === 'analysis' && !inAnalyst ? ' active' : '')} onClick={() => onSelectTab('analysis')}>
              Analysis {anCount > 0 && <span className="count-pill">{anCount}</span>}
            </button>
          </div>
        )}
      </div>

      <div className="tb-side end">
        <button className="gbtn" onClick={onOpenData}><Icon name="database" size={16} /> Data</button>
      </div>
    </div>
  );
}
