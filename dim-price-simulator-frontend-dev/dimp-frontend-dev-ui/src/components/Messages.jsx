// components/Messages.jsx — chat message rendering: inline reasoning steps +
// tool traces, and the soft word-stream answer. (Styles live in Chat.css.)
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Icon } from './Icon.jsx';
import { REASONING, ANSWER_BLOCKS, ANALYST_TEMPLATES } from '../mockData/analyst.js';

/* ─── Markdown renderer with pipe-table support ───────────────── */
function MarkdownWithTables({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  const sections = [];
  let currentLines = [];
  let inTable = false;

  const flushNonTable = () => {
    if (currentLines.length > 0) {
      sections.push({ type: 'md', content: currentLines.join('\n') });
      currentLines = [];
    }
  };
  const isTableRow = (line) => {
    const trimmed = line.trim();
    return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|');
  };
  const isSeparatorRow = (line) => /^\|[\s\-:|]+\|$/.test(line.trim());

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isTableRow(line)) {
      if (!inTable) { flushNonTable(); inTable = true; currentLines = []; }
      currentLines.push(line);
    } else {
      if (inTable) { sections.push({ type: 'table', content: currentLines }); currentLines = []; inTable = false; }
      currentLines.push(line);
    }
  }
  if (inTable) sections.push({ type: 'table', content: currentLines });
  else flushNonTable();

  return sections.map((section, idx) => {
    if (section.type === 'md') {
      return <ReactMarkdown key={idx} remarkPlugins={[remarkGfm]}>{section.content}</ReactMarkdown>;
    }
    // Parse pipe table manually
    const rows = section.content
      .filter(row => !isSeparatorRow(row))
      .map(row => row.split('|').slice(1, -1).map(cell => cell.trim()));
    if (rows.length === 0) return null;
    const header = rows[0];
    const body = rows.slice(1);
    return (
      <div key={idx} className="ans-table-wrap">
        <table className="ans-table">
          <thead><tr>{header.map((cell, ci) => <th key={ci}><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({ children }) => <>{children}</> }}>{cell}</ReactMarkdown></th>)}</tr></thead>
          <tbody>{body.map((row, ri) => <tr key={ri}>{row.map((cell, ci) => <td key={ci}><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({ children }) => <>{children}</> }}>{cell}</ReactMarkdown></td>)}</tr>)}</tbody>
        </table>
      </div>
    );
  });
}

export function UserMessage({ text }) {
  return <div className="msg msg-user"><div className="bubble">{text}</div></div>;
}

export function QABlock({ pairs }) {
  return (
    <div className="msg qa-msg"><div className="qa-block">
      {pairs.map((p, i) => (
        <div key={i} className="qa-pair">
          <div className="qa-q">{p.q}</div>
          <div className="qa-a">{p.a}</div>
        </div>
      ))}
    </div></div>
  );
}

// ---- a single tool call card (expand for input/output) ----
function ToolTrace({ tool, running }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="trace-card">
      <button className="trace-card-head" onClick={() => setOpen((v) => !v)}>
        <Icon name="chevronRight" size={13} className={'chev' + (open ? ' open' : '')} />
        <Icon name="tool" size={14} className="tt-ic" />
        <span className="tt-name">{tool.name}</span>
        {running ? (
          <span className="tt-status running"><span className="run-dots-sm" /> running</span>
        ) : (
          <span className="tt-status"><Icon name="check" size={12} /> done</span>
        )}
      </button>
      {open && (
        <div className="trace-card-body">
          <div className="tc-io"><div className="lbl">Input</div><pre>{tool.input}</pre></div>
          <div className="tc-io"><div className="lbl">Output</div><pre>{tool.output}</pre></div>
        </div>
      )}
    </div>
  );
}

// ---- trace dropdown: the (possibly several) tool calls a step fired ----
function TraceGroup({ tools, running }) {
  const [open, setOpen] = useState(false);
  const names = tools.map((t) => t.name).join(', ');
  return (
    <div className={'trace-group' + (running ? ' running' : '')}>
      <button className="trace-group-head" onClick={() => setOpen((v) => !v)}>
        <Icon name="chevronRight" size={13} className={'chev' + (open ? ' open' : '')} />
        <Icon name="tool" size={14} className="tt-ic" />
        <span className="tg-label">{tools.length} tool call{tools.length > 1 ? 's' : ''}</span>
        {!open && <span className="tg-names">{names}</span>}
        {running ? (
          <span className="tt-status running"><span className="run-dots-sm" /> running</span>
        ) : (
          <span className="tt-status"><Icon name="check" size={12} /> done</span>
        )}
      </button>
      {open && (
        <div className="trace-group-body">
          {tools.map((t, i) => <ToolTrace key={i} tool={t} running={running} />)}
        </div>
      )}
    </div>
  );
}

// ---- one reasoning item: a thinking line + its trace dropdown (if any) ----
export function ReasonItem({ item, toolsRunning }) {
  const tools = item.tools || (item.tool ? [item.tool] : []);
  return (
    <div className="reason-item">
      <div className="reason-line">
        <span className="reason-rail"><span className="reason-dot" /></span>
        <span className="reason-text">{item.step}</span>
      </div>
      {tools.length > 0 && (
        <div className="reason-trace">
          <span className="reason-rail solid" />
          <TraceGroup tools={tools} running={toolsRunning} />
        </div>
      )}
    </div>
  );
}

// ---- the whole reasoning flow, collapsible under a "Thinking" header ----
export function ThinkingBlock({ flow, revealedItems, doneTools, active, animate }) {
  const [open, setOpen] = useState(animate);
  const wasActive = useRef(active);
  // auto-collapse once thinking finishes
  useEffect(() => {
    if (wasActive.current && !active) { const t = setTimeout(() => setOpen(false), 360); return () => clearTimeout(t); }
    wasActive.current = active;
  }, [active]);

  return (
    <div className={'thinking' + (active ? ' active' : '')}>
      <button className="thinking-head" onClick={() => setOpen((v) => !v)}>
        <Icon name="chevronRight" size={14} className={'chev' + (open ? ' open' : '')} />
        <span className="thinking-title">{active ? 'Thinking' : 'Thought for a few seconds'}</span>
        {active
          ? <span className="thinking-waves" aria-hidden="true"><i /><i /><i /><i /><i /></span>
          : <span className="thinking-count">{flow.length} steps</span>}
      </button>
      {open && (
        <div className="thinking-body">
          {flow.slice(0, revealedItems).map((item, i) => (
            <ReasonItem key={i} item={item} toolsRunning={animate && doneTools <= i} />
          ))}
          {active && (
            <div className="reason-line pending">
              <span className="reason-rail"><span className="reason-dot live" /></span>
              <span className="reason-text muted">Working through it<span className="run-dots" /></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- answer body with soft word-stream reveal ----
export function AnswerBody({ blocks, revealed, streaming }) {
  let counter = 0;
  const out = [];
  for (let bi = 0; bi < blocks.length; bi++) {
    const b = blocks[bi];
    // Full markdown rendering with table support (from real API responses)
    if (b.type === 'markdown') {
      if (streaming && counter >= revealed) { counter++; continue; }
      out.push(<div key={'mk' + bi} className="stream-word"><MarkdownWithTables text={b.text} /></div>);
      counter += (b.text.split(' ').length);
      continue;
    }
    if (b.type === 'table') {
      const tableStart = counter;
      if (revealed > tableStart || !streaming) {
        out.push(
          <table key={'t' + bi} className="ans-table stream-word">
            <thead><tr>{b.head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>{b.rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci}>{c}</td>)}</tr>)}</tbody>
          </table>
        );
      }
      counter += 6;
      continue;
    }
    const words = b.text.split(' ');
    const shown = [];
    for (let wi = 0; wi < words.length; wi++) {
      if (streaming && counter >= revealed) break;
      shown.push(<span key={wi} className="stream-word">{words[wi]}{wi < words.length - 1 ? ' ' : ''}</span>);
      counter++;
    }
    if (shown.length === 0) continue;
    if (b.type === 'h') out.push(<h4 key={'h' + bi}>{shown}</h4>);
    else out.push(<p key={'p' + bi}>{shown}</p>);
  }
  return <div className={'answer' + (streaming ? ' streaming' : '')}>{out}{streaming && <span className="type-caret" />}</div>;
}

function tokenCount(blocks) {
  return blocks.reduce((n, b) => n + (b.type === 'table' ? 6 : b.text.split(' ').length), 0);
}

// ---- full AI answer message: inline reasoning flow, then streamed answer ----
export function AnswerMessage({ blocks, reasoning, sources, onRunAnalyst, onOpenSources, motion = 7, onComplete, onTick, animate = true }) {
  const flow = reasoning || REASONING;
  const ans = blocks || ANSWER_BLOCKS;
  const total = tokenCount(ans);
  const speed = Math.max(14, 60 - motion * 5);

  // phase: reasoning -> streaming -> done.  static when animate === false.
  const [phase, setPhase] = useState(animate ? 'reasoning' : 'done');
  const [revealedItems, setRevealedItems] = useState(animate ? 0 : flow.length); // reasoning lines shown
  const [doneTools, setDoneTools] = useState(animate ? 0 : flow.length);          // index up to which tools finished
  const [revealed, setRevealed] = useState(animate ? 0 : total);                  // answer words streamed
  const [runPop, setRunPop] = useState(false);
  const [copied, setCopied] = useState(false);

  // reasoning phase: reveal each item, then settle its tool, then advance
  useEffect(() => {
    if (!animate) return;
    const timers = [];
    let t = 220;
    flow.forEach((item, i) => {
      timers.push(setTimeout(() => { setRevealedItems(i + 1); onTick && onTick(); }, t));
      t += 520; // line read time
      if (item.tool) {
        timers.push(setTimeout(() => { setDoneTools(i + 1); onTick && onTick(); }, t));
        t += 560; // tool run time
      }
    });
    timers.push(setTimeout(() => setPhase('streaming'), t + 120));
    return () => timers.forEach(clearTimeout);
  }, []);

  // streaming phase
  useEffect(() => {
    if (phase !== 'streaming') return;
    if (revealed >= total) { setPhase('done'); onComplete && onComplete(); return; }
    const tm = setTimeout(() => { setRevealed((r) => r + 1); onTick && onTick(); }, speed);
    return () => clearTimeout(tm);
  }, [phase, revealed]);

  return (
    <div className="msg msg-ai">
      <div className="ai-row">
        <span className="ai-avatar"><Icon name="sparkles" size={17} /></span>
        <div className="ai-content">
          {/* collapsible reasoning ("Thinking") with inline traces */}
          <ThinkingBlock
            flow={flow}
            revealedItems={revealedItems}
            doneTools={doneTools}
            active={phase === 'reasoning'}
            animate={animate}
          />

          {/* final answer */}
          {phase !== 'reasoning' && (
            <AnswerBody blocks={ans} revealed={revealed} streaming={phase === 'streaming'} />
          )}

          {phase === 'done' && (
            <div className="ans-footer">
              <button className="ans-action" onClick={() => { navigator.clipboard?.writeText(ans.filter((b) => b.text).map((b) => b.text).join('\n\n')); setCopied(true); setTimeout(() => setCopied(false), 1400); }}>
                <Icon name={copied ? 'check' : 'copy'} size={15} /> {copied ? 'Copied' : 'Copy'}
              </button>
              <div style={{ position: 'relative' }}>
                <button className="ans-action analyst" onClick={() => setRunPop((v) => !v)}>
                  <Icon name="sparkles" size={15} /> Run Analyst <Icon name="chevronDown" size={13} />
                </button>
                {runPop && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 19 }} onClick={() => setRunPop(false)} />
                    <div className="run-pop">
                      {ANALYST_TEMPLATES.map((t) => (
                        <button key={t.id} className="tool-opt" onClick={() => { setRunPop(false); onRunAnalyst(t); }}>
                          <span className="ti" style={{ background: 'var(--pmi-grad)' }}><Icon name={t.icon} size={17} /></span>
                          <span><div className="t-name">{t.label}</div><div className="t-desc">{t.desc}</div></span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button className="sources-pill" onClick={onOpenSources} title="Open sources">
                <span className="src-icons">
                  {sources.slice(0, 3).map((s) => (
                    <span key={s.id} className="src-chip" style={{ background: s.kind === 'pdf' ? 'var(--c-red)' : 'var(--c-green)' }}>{s.kind === 'pdf' ? 'P' : 'X'}</span>
                  ))}
                </span>
                {sources.length} sources
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnswerMessage;
