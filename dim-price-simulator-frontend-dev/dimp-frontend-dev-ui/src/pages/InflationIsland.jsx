// pages/InflationIsland.jsx — the liquid-glass bar docked at the bottom of the
// Inflation / Material tabs. Collapsed: a small pill showing an invite + send
// arrow. On hover/focus/typed-text it expands into the full dynamic-island bar.
import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../components/Icon.jsx';

export default function InflationIsland({ value, onChange, onSend, placeholder = 'Ask the inflation assistant…', islandVariant }) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const taRef = useRef(null);
  const expanded = focused || hovered || (value && value.trim().length > 0);

  // autosize
  useEffect(() => {
    const ta = taRef.current; if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [value, expanded]);

  const send = () => { if (value && value.trim()) onSend(value.trim()); };
  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
  const focusInput = () => { setFocused(true); requestAnimationFrame(() => taRef.current && taRef.current.focus()); };

  return (
    <div className="inf-island-dock">
      <div
        className={'inf-island' + (expanded ? ' expanded' : ' collapsed')}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => { if (!expanded) focusInput(); }}
      >
        {/* collapsed face */}
        {!expanded && (
          <div className="inf-island-collapsed">
            <span className="iic-spark"><Icon name="sparkles" size={16} /></span>
            <span className="iic-text">{placeholder}</span>
            <span className="iic-send"><Icon name="arrowUp" size={16} /></span>
          </div>
        )}

        {/* expanded face */}
        <div className="inf-island-expanded" style={{ display: expanded ? 'flex' : 'none' }}>
          <div className="iie-inputrow">
            <textarea
              ref={taRef}
              className="island-input iie-input"
              rows={1}
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={onKey}
            />
          </div>
          <div className="iie-controls">
            <span className="iie-hint"><Icon name="sparkles" size={13} /> Inflation assistant</span>
            <span className="iie-spacer" />
            <button className="island-send" onClick={send} disabled={!value || !value.trim()} aria-label="Send">
              <Icon name="arrowUp" size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
