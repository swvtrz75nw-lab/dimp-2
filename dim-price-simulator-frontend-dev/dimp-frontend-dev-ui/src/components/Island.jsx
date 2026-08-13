// components/Island.jsx — the morphing "dynamic island" chat input
// (two-row: prompt on top, controls below) + the clarify panel.
import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon.jsx';
import { ANALYST_TEMPLATES } from '../mockData/analyst.js';
import './Island.css';

export function DynamicIsland(props) {
  const {
    value, onChange, onSend, placeholder = 'Ask anything about your procurement data…',
    tool, onToolChange, template, onTemplate, ghost,
    variant = 'spring', clarify, onClarifyAnswer, onClarifyNav, disabled, noTemplatePop,
    staticLabel, staticIcon, hideToolSelector,
  } = props;

  const [toolPop, setToolPop] = useState(false);
  const [tmplOpen, setTmplOpen] = useState(false);
  const taRef = useRef(null);

  // auto-open the template chooser when entering analyst with no template chosen
  useEffect(() => {
    if (tool === 'analyst' && !template && !clarify && !noTemplatePop) setTmplOpen(true);
    if (tool === 'chat') setTmplOpen(false);
  }, [tool, template, clarify, noTemplatePop]);

  // autosize textarea
  useEffect(() => {
    const ta = taRef.current; if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [value]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (value.trim()) onSend(); }
  };

  const expandOpen = !!clarify || (tmplOpen && tool === 'analyst' && !template && !noTemplatePop);

  // ---- the content that lives in the expanding region ----
  const expandInner = clarify ? (
    <ClarifyPanel clarify={clarify} onAnswer={onClarifyAnswer} onNav={onClarifyNav} />
  ) : (
    <div>
      <div className="tmpl-head">Choose an analysis template</div>
      <div className="tmpl-grid">
        {ANALYST_TEMPLATES.map((t) => (
          <button key={t.id} className="tmpl-card" onClick={() => { onTemplate(t); setTmplOpen(false); }}>
            <span className="tc-ic"><Icon name={t.icon} size={17} /></span>
            <div className="tc-name">{t.label}</div>
            <div className="tc-desc">{t.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );

  const usePanel = variant === 'panel';

  return (
    <div className="island-wrap">
      <div className={'island variant-' + variant + (expandOpen ? ' expanded' : '')}>

        {/* expand region — inline (spring/sheet) */}
        {!usePanel && expandOpen && (
          <div className="island-expand open">
            <div className="inner">{expandInner}</div>
          </div>
        )}
        {/* expand region — floating panel (panel variant) */}
        {usePanel && expandOpen && (
          <div className="island-expand-panel">{expandInner}</div>
        )}

        {/* main: prompt on top, controls (tool selector + send) below */}
        <div className="island-main">
          <div className="island-inputrow">
            {ghost && !value && <div className="island-ghost">{ghost}</div>}
            <textarea
              ref={taRef}
              className="island-input"
              rows={1}
              placeholder={ghost ? '' : (clarify ? 'Or just type your question…' : (tool === 'analyst' ? 'Describe the analysis you need…' : placeholder))}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKey}
            />
          </div>

          <div className="island-controls">
            <div className="island-controls-left">
              {!hideToolSelector && (
              <div style={{ position: 'relative' }}>
                <button
                  className={'island-tool' + (tool === 'analyst' ? ' is-analyst' : '')}
                  onClick={() => setToolPop((v) => !v)}
                >
                  <Icon name={tool === 'analyst' ? 'sparkles' : 'chat'} size={15} />
                  {tool === 'analyst' ? 'Analyst' : 'Chat'}
                  <Icon name="chevronDown" size={14} />
                </button>
                {toolPop && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 29 }} onClick={() => setToolPop(false)} />
                    <div className="tool-pop">
                      <button className="tool-opt" onClick={() => { onToolChange('chat'); setToolPop(false); }}>
                        <span className="ti" style={{ background: 'var(--pmi-blue)' }}><Icon name="chat" size={18} /></span>
                        <span>
                          <div className="t-name">Chat</div>
                          <div className="t-desc">Standard conversational answers.</div>
                        </span>
                        {tool === 'chat' && <span className="t-check"><Icon name="check" size={18} /></span>}
                      </button>
                      <button className="tool-opt" onClick={() => { onToolChange('analyst'); setToolPop(false); }}>
                        <span className="ti" style={{ background: 'var(--pmi-magenta)' }}><Icon name="sparkles" size={18} /></span>
                        <span>
                          <div className="t-name">Analyst</div>
                          <div className="t-desc">Builds an exportable HTML report.</div>
                        </span>
                        {tool === 'analyst' && <span className="t-check"><Icon name="check" size={18} /></span>}
                      </button>
                    </div>
                  </>
                )}
              </div>
              )}

              {/* template pill in analyst mode */}
              {!hideToolSelector && tool === 'analyst' && template && (
                <span className="island-templatepill">
                  <Icon name={template.icon} size={14} />
                  {template.label}
                  <button onClick={() => onTemplate(null)} aria-label="Remove template"><Icon name="x" size={13} /></button>
                </span>
              )}

              {/* analyst "choose template" affordance if none yet */}
              {!hideToolSelector && tool === 'analyst' && !template && !tmplOpen && !noTemplatePop && (
                <button className="island-tool ghost" onClick={() => setTmplOpen(true)}>
                  <Icon name="plus" size={15} /> Template
                </button>
              )}
            </div>

            <button className="island-send" onClick={onSend} disabled={!value.trim() || disabled} aria-label="Send">
              <Icon name="arrowUp" size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClarifyPanel({ clarify, onAnswer, onNav }) {
  const { questions, current, answers } = clarify;
  const q = questions[current];
  return (
    <div className="clarify">
      <div className="clarify-top">
        <span className="clarify-step">Quick clarification · {current + 1} of {questions.length}</span>
        <div className="clarify-progress">
          {questions.map((_, i) => (
            <span key={i} className={'clarify-dot' + (answers[i] != null ? ' done' : i === current ? ' cur' : '')} />
          ))}
        </div>
      </div>
      <div className="clarify-q">{q.q}</div>
      <div className="clarify-opts">
        {q.options.map((opt, i) => (
          <button key={i} className={'clarify-opt' + (answers[current] === opt ? ' selected' : '')} onClick={() => onAnswer(current, opt)}>
            {opt}
          </button>
        ))}
      </div>
      <div className="clarify-nav">
        <button className="clarify-navbtn" disabled={current === 0} onClick={() => onNav('back')}>
          <Icon name="chevronLeft" size={15} /> Back
        </button>
        <button className="clarify-navbtn" onClick={() => onNav('skip')}>
          Skip <Icon name="skip" size={13} />
        </button>
        <button className="clarify-navbtn" onClick={() => onNav('next')}>
          {current === questions.length - 1 ? 'Done' : 'Next'} <Icon name="chevronRight" size={15} />
        </button>
      </div>
    </div>
  );
}

export default DynamicIsland;
