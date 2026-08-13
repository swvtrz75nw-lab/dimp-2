import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Icon } from './components/Icon.jsx';
import { DynamicIsland } from './components/Island.jsx';
import { AnswerMessage, UserMessage, QABlock } from './components/Messages.jsx';
import NavbarNew from './NavbarNew.jsx';
import ResultsPanel from './ResultsPanel.jsx';
import { sendChatMessage } from './services/api';
import {
  SUGGESTIONS, SOURCES, REASONING, ANSWER_BLOCKS, ANALYST_TEMPLATES, CLARIFY_QUESTIONS,
} from './mockData/index.js';
import { USER } from './mockData/user.js';
import './Chat.css';


export default function ChatPage({ islandVariant, motion, clarifyEnabled, onToast, seedPrefill }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(seedPrefill || '');
  const [tool, setTool] = useState('chat');
  const [template, setTemplate] = useState(null);
  const [ghost, setGhost] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  const lastExpandedRef = useRef(null); // tracks which suggestion category was last used
  const [tab, setTab] = useState('answer');
  const [clarify, setClarify] = useState(null);
  const [analyst, setAnalyst] = useState(null); // {template, loading, progress, loaded}
  const [savedAnalyses, setSaved] = useState([]);
  const [dataOpen, setDataOpen] = useState(false);
  const pendingRef = useRef('');
  const bodyRef = useRef(null);
  const askedClarifyRef = useRef(false);
  const analystTimer = useRef(null);

  const scrollDown = () => { requestAnimationFrame(() => { const b = bodyRef.current; if (b) b.scrollTop = b.scrollHeight; }); };
  useEffect(scrollDown, [messages, clarify, analyst]);

  const markDone = (id) => setMessages((m) => m.map((x) => (x.id === id ? { ...x, done: true } : x)));

  // ---------- sending ----------
  function newAiMessage() {
    return { type: 'ai', id: Date.now() + Math.random(), reasoning: REASONING, blocks: ANSWER_BLOCKS, done: false };
  }

  // Real API streaming state (used when DIM Price is selected)
  const [streamSessionId, setStreamSessionId] = useState('');
  const [streamThinking, setStreamThinking] = useState('');
  const [streamToolCalls, setStreamToolCalls] = useState([]);
  const [streamAnswer, setStreamAnswer] = useState('');
  const [isRealStreaming, setIsRealStreaming] = useState(false);
  const streamThinkingRef = useRef('');
  const streamToolCallsRef = useRef([]);
  const streamAnswerRef = useRef('');

  // Auto-scroll during streaming
  useEffect(scrollDown, [streamThinking, streamToolCalls, streamAnswer]);

  async function sendRealMessage(text) {
    setMessages((m) => [...m, { type: 'user', text }]);
    setHasStarted(true); setTab('answer'); setExpanded(null); setInput(''); setGhost('');

    // Reset streaming state
    setStreamThinking(''); setStreamToolCalls([]); setStreamAnswer('');
    streamThinkingRef.current = ''; streamToolCallsRef.current = []; streamAnswerRef.current = '';
    setIsRealStreaming(true);

    try {
      const returnedSessionId = await sendChatMessage({
        message: text,
        sessionId: streamSessionId,
        onChunk: (chunk) => {
          try {
            const parsed = JSON.parse(chunk);
            switch (parsed.type) {
              case 'reasoning': {
                const content = parsed.content || '';
                if (content) { streamThinkingRef.current += content; setStreamThinking(streamThinkingRef.current); }
                break;
              }
              case 'tool_call': {
                const newTool = { id: parsed.tool_use_id || Date.now(), name: parsed.tool || 'processing', input: parsed.input || {}, output: null, status: 'running', duration: null };
                streamToolCallsRef.current = [...streamToolCallsRef.current, newTool];
                setStreamToolCalls([...streamToolCallsRef.current]);
                break;
              }
              case 'tool_result': {
                const toolId = parsed.tool_use_id;
                streamToolCallsRef.current = streamToolCallsRef.current.map(tc => tc.id === toolId ? { ...tc, status: parsed.is_error ? 'error' : 'done', output: parsed.output, duration: parsed.duration_ms || null } : tc);
                setStreamToolCalls([...streamToolCallsRef.current]);
                break;
              }
              case 'answer': {
                const content = parsed.content || '';
                if (content) { streamAnswerRef.current += content; setStreamAnswer(streamAnswerRef.current); }
                break;
              }
              case 'done': case 'error': break;
              default: break;
            }
          } catch { /* ignore */ }
        },
      });
      if (returnedSessionId && !streamSessionId) setStreamSessionId(returnedSessionId);
    } catch (error) {
      streamAnswerRef.current = `⚠️ ${error.message}`;
      setStreamAnswer(streamAnswerRef.current);
    }

    // Convert real API response into the AnswerMessage format (reasoning + blocks)
    const realReasoning = [];
    if (streamThinkingRef.current) {
      const thinkingLines = streamThinkingRef.current.split(/(?<=\.)\s+/).filter(s => s.trim());
      thinkingLines.forEach(line => realReasoning.push({ step: line }));
    }
    // Group tool calls as reasoning steps with traces
    if (streamToolCallsRef.current.length > 0) {
      // Each tool call becomes a reasoning step with its tool trace
      const toolGroups = [];
      let currentGroup = [];
      streamToolCallsRef.current.forEach(tc => {
        currentGroup.push({
          name: tc.name,
          input: tc.input ? JSON.stringify(tc.input, null, 2) : '',
          output: tc.output ? (typeof tc.output === 'string' ? tc.output.slice(0, 300) : JSON.stringify(tc.output, null, 2).slice(0, 300)) : '',
        });
      });
      if (currentGroup.length > 0) {
        realReasoning.push({ step: '', tools: currentGroup });
      }
    }

    const realBlocks = [];
    if (streamAnswerRef.current) {
      realBlocks.push({ type: 'markdown', text: streamAnswerRef.current });
    }

    setIsRealStreaming(false);
    setMessages((m) => [...m, {
      type: 'ai',
      id: Date.now() + Math.random(),
      reasoning: realReasoning.length > 0 ? realReasoning : [{ step: 'Processing your request.' }],
      blocks: realBlocks.length > 0 ? realBlocks : [{ type: 'md', text: 'No response received.' }],
      done: true,
    }]);

    setTimeout(() => {
      setStreamThinking(''); setStreamToolCalls([]); setStreamAnswer('');
      streamThinkingRef.current = ''; streamToolCallsRef.current = []; streamAnswerRef.current = '';
    }, 0);
  }

  function startTurn(text) {
    // Use real API when:
    // 1. DIM Price suggestion was selected, OR
    // 2. User typed directly into the prompt box without selecting any suggestion category
    const usedDim = lastExpandedRef.current === 'dim' || expanded === 'dim';
    const directPrompt = !lastExpandedRef.current && !expanded;

    if (usedDim || directPrompt) {
      lastExpandedRef.current = null;
      sendRealMessage(text);
      return;
    }
    lastExpandedRef.current = null;
    // For Inflation or Equipment selections, use mock data
    setMessages((m) => [...m, { type: 'user', text }]);
    setHasStarted(true); setTab('answer'); setExpanded(null); setInput(''); setGhost('');
    const goAnalyst = tool === 'analyst';
    const tpl = template || ANALYST_TEMPLATES[0];
    if (clarifyEnabled && !askedClarifyRef.current) {
      askedClarifyRef.current = true;
      pendingRef.current = JSON.stringify({ goAnalyst, tpl });
      setClarify({ questions: CLARIFY_QUESTIONS, current: 0, answers: CLARIFY_QUESTIONS.map(() => null) });
    } else {
      afterPrep(goAnalyst, tpl);
    }
  }

  function afterPrep(goAnalyst, tpl) {
    if (goAnalyst) {
      setMessages((m) => [...m, { type: 'ai-short', text: 'Building your analysis now — the report is rendering on the right. Ask me to deep-dive or change anything.' }]);
      enterAnalyst(tpl);
    } else {
      setMessages((m) => [...m, newAiMessage()]);
    }
  }

  // ---------- clarify ----------
  function clarifyAnswer(i, opt) {
    setClarify((c) => {
      const answers = c.answers.slice(); answers[i] = opt;
      if (c.current < c.questions.length - 1) return { ...c, answers, current: c.current + 1 };
      return { ...c, answers };
    });
    setClarify((c) => {
      if (i === c.questions.length - 1) { setTimeout(finishClarify, 260); }
      return c;
    });
  }
  function clarifyNav(dir) {
    setClarify((c) => {
      if (!c) return c;
      if (dir === 'back') return { ...c, current: Math.max(0, c.current - 1) };
      if (dir === 'skip' || dir === 'next') {
        if (c.current < c.questions.length - 1) return { ...c, current: c.current + 1 };
        setTimeout(finishClarify, 60); return c;
      }
      return c;
    });
  }
  function finishClarify() {
    setClarify((c) => {
      if (!c) return null;
      const pairs = c.questions.map((q, i) => ({ q: q.q, a: c.answers[i] || 'Skipped' }))
        .filter((p, i) => c.answers[i] != null);
      if (pairs.length) setMessages((m) => [...m, { type: 'qa', pairs }]);
      const { goAnalyst, tpl } = JSON.parse(pendingRef.current || '{}');
      setTimeout(() => afterPrep(goAnalyst, tpl), 120);
      return null;
    });
  }
  // sending a free-text message while clarifying — bypass the questions and answer directly
  function clarifySend() {
    if (!input.trim()) return;
    setInput(''); setGhost('');
    const { goAnalyst, tpl } = JSON.parse(pendingRef.current || '{}');
    setClarify(null);
    setTimeout(() => afterPrep(goAnalyst, tpl), 120);
  }

  // ---------- analyst mode ----------
  // phases: 'choosing' (pick a template) · 'creating' (skeleton) · 'updating' (refresh overlay) · 'ready'
  function startCreate(tpl) {
    clearTimeout(analystTimer.current);
    setAnalyst({ template: tpl, rev: 1, phase: 'creating' });
    analystTimer.current = setTimeout(() => setAnalyst((a) => (a ? { ...a, phase: 'ready' } : a)), 2000);
  }
  function enterAnalyst(tpl) {
    // freeze any in-flight chat answers so re-rendering them in the split doesn't restart streaming
    setMessages((m) => m.map((x) => (x.type === 'ai' ? { ...x, done: true } : x)));
    startCreate(tpl);
  }
  // pick a (new) analysis type from the carousel or the island
  function chooseTemplate(tpl) { startCreate(tpl); }
  // closing the template chip brings back the analysis-type carousel
  function clearTemplate() {
    clearTimeout(analystTimer.current);
    setAnalyst((a) => (a ? { ...a, template: null, phase: 'choosing' } : a));
  }
  // update an existing analysis -> brief "refreshing" overlay over the current report
  function regenReport() {
    clearTimeout(analystTimer.current);
    setAnalyst((a) => (a ? { ...a, phase: 'updating' } : a));
    analystTimer.current = setTimeout(() => setAnalyst((a) => (a ? { ...a, phase: 'ready', rev: a.rev + 1 } : a)), 1600);
  }
  function exitAnalyst() { clearTimeout(analystTimer.current); setAnalyst(null); setTab('answer'); }

  function onRunAnalyst(tpl) { setTool('analyst'); setTemplate(tpl); enterAnalyst(tpl); }

  function analystSend() {
    if (!input.trim() || !analyst.template) return;
    setMessages((m) => [...m, { type: 'user', text: input }, { type: 'ai-short', text: 'Updating the report with that — refreshing the affected sections now.' }]);
    setInput('');
    regenReport();
  }

  function saveReport() {
    const tp = analyst.template;
    if (!tp) return;
    const title = ({ generic: 'DIM cost — EU cluster, FY26 YTD', prediction: 'DIM cost forecast — FY26 → FY27', whatif: 'What-if: +150bps inflation' })[tp.id];
    if (!savedAnalyses.some((s) => s.id === tp.id)) {
      setSaved((s) => [...s, { id: tp.id, title, template: tp.label, time: 'just now' }]);
    }
    onToast('Saved to Analysis tab');
  }
  function downloadReport() {
    const html = `<!doctype html><meta charset=utf8><title>Analyst report</title><h1>DIM cost — EU cluster</h1><p>Exported from Procurement Intel — Powered by PMI Tech.</p>`;
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'analyst-report.html'; a.click();
    onToast('Report downloaded');
  }

  // tab counts
  const srcCount = hasStarted ? SOURCES.length : 0;
  const anCount = savedAnalyses.length;

  function selectTab(tt) { if (analyst) exitAnalyst(); setTab(tt); }

  // start over — return to the chat landing page
  function resetChat() {
    setMessages([]); setHasStarted(false); setAnalyst(null); setClarify(null);
    setInput(''); setGhost(''); setExpanded(null); setTab('answer');
    setTool('chat'); setTemplate(null); setDataOpen(false);
    askedClarifyRef.current = false;
  }

  function renderTopBar() {
    return (
      <NavbarNew
        hasStarted={hasStarted} inAnalyst={!!analyst}
        onNewChat={resetChat}
        tab={tab} onSelectTab={selectTab}
        srcCount={srcCount} anCount={anCount}
        onOpenData={() => setDataOpen(true)}
      />
    );
  }

  const msgCtx = { motion, sources: SOURCES, onRunAnalyst, markDone, onTick: scrollDown, onOpenSources: () => selectTab('source') };

  // ---------- ANALYST MODE LAYOUT ----------
  if (analyst) {
    return (
      <div className="chat-page">
        {renderTopBar()}
        <div className="analyst-split">
          <div className="analyst-chatcol">
            <div className="analyst-chat-body" ref={bodyRef}>
              {messages.map((m, i) => renderMessage(m, i, { ...msgCtx, compact: true }))}
            </div>
            <div className="analyst-chat-dock">
              <DynamicIsland
                value={input} onChange={setInput} onSend={analystSend}
                tool="analyst" onToolChange={() => {}}
                template={analyst.template} onTemplate={(t) => (t ? chooseTemplate(t) : clearTemplate())}
                noTemplatePop variant={islandVariant} placeholder="Ask for an update or deep-dive…"
              />
            </div>
          </div>
          <div className="analyst-reportcol">
            <ResultsPanel
              analyst={analyst}
              onPick={chooseTemplate}
              onClose={exitAnalyst}
              onSave={saveReport}
              onDownload={downloadReport}
            />
          </div>
        </div>
        {dataOpen && <DataPopup onClose={() => setDataOpen(false)} />}
      </div>
    );
  }

  // ---------- NORMAL CHAT LAYOUT ----------
  return (
    <div className="chat-page">
      {renderTopBar()}

      {/* body */}
      <div className="chat-body" ref={bodyRef}>
        {!hasStarted ? (
          <div className="hero">
            <h1 className="hero-title">Welcome {USER.first}. Let’s deep dive.</h1>
            <p className="hero-sub">Ask anything about DIM pricing, inflation or equipment — or start from a suggestion.</p>
            <div className="hero-island">
              <DynamicIsland
                value={input} onChange={setInput} onSend={() => input.trim() && startTurn(input)}
                tool={tool} onToolChange={setTool} template={template} onTemplate={setTemplate}
                ghost={ghost} variant={islandVariant}
              />
            </div>

            {/* suggestions */}
            {!expanded ? (
              <div className="suggest-row">
                {SUGGESTIONS.map((s) => (
                  <button key={s.id} className="suggest-pill" onClick={() => setExpanded(s.id)}>
                    <Icon name={s.icon} size={17} className="sp-ic" /> {s.label}
                  </button>
                ))}
              </div>
            ) : (
              <SuggestExpanded
                s={SUGGESTIONS.find((x) => x.id === expanded)}
                onClose={() => { setExpanded(null); setGhost(''); }}
                onHover={setGhost}
                onPick={(p) => { lastExpandedRef.current = expanded; setInput(p); setGhost(''); setExpanded(null); }}
              />
            )}
          </div>
        ) : (
          <div className="chat-inner">
            {tab === 'answer' && messages.map((m, i) => renderMessage(m, i, msgCtx))}
            {tab === 'answer' && isRealStreaming && (
              <div className="msg msg-ai">
                <div className="ai-row">
                  <span className="ai-avatar"><Icon name="sparkles" size={17} /></span>
                  <div className="ai-content">
                    <StreamingThinkingBlock
                      thinking={streamThinking}
                      toolCalls={streamToolCalls}
                    />
                    {streamAnswer && (
                      <div className="answer streaming"><ReactMarkdown remarkPlugins={[remarkGfm]}>{streamAnswer}</ReactMarkdown><span className="type-caret" /></div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {tab === 'source' && <SourceTab />}
            {tab === 'analysis' && <AnalysisTab items={savedAnalyses} />}
          </div>
        )}
      </div>

      {/* docked island (after start, answer tab) */}
      {hasStarted && tab === 'answer' && (
        <div className="island-dock">
          <div className="island-dock-inner">
            <DynamicIsland
              value={input} onChange={setInput}
              onSend={() => { if (clarify) { clarifySend(); return; } input.trim() && startTurn(input); }}
              tool={tool} onToolChange={setTool} template={template} onTemplate={setTemplate}
              ghost={ghost} variant={islandVariant}
              clarify={clarify} onClarifyAnswer={clarifyAnswer} onClarifyNav={clarifyNav}
            />
          </div>
        </div>
      )}

      {dataOpen && <DataPopup onClose={() => setDataOpen(false)} />}
    </div>
  );
}

/* ─── Streaming Thinking Block — same UI as ThinkingBlock but live ─── */
function StreamingThinkingBlock({ thinking, toolCalls }) {
  const thinkingLines = thinking ? thinking.split(/(?<=\.)\s+/).filter(s => s.trim()) : [];
  const hasContent = thinkingLines.length > 0 || toolCalls.length > 0;

  if (!hasContent) {
    return (
      <div className="thinking active">
        <button className="thinking-head">
          <Icon name="chevronRight" size={14} className="chev open" />
          <span className="thinking-title">Thinking</span>
          <span className="thinking-waves" aria-hidden="true"><i /><i /><i /><i /><i /></span>
        </button>
        <div className="thinking-body">
          <div className="reason-line pending">
            <span className="reason-rail"><span className="reason-dot live" /></span>
            <span className="reason-text muted">Working through it<span className="run-dots" /></span>
          </div>
        </div>
      </div>
    );
  }

  // Build flow items from live data
  const flowItems = [];
  thinkingLines.forEach(line => flowItems.push({ step: line }));
  // Consolidate ALL tool calls into one trace group
  if (toolCalls.length > 0) {
    const allTools = toolCalls.map(tc => ({
      name: tc.name,
      input: tc.input ? JSON.stringify(tc.input, null, 2) : '',
      output: tc.output ? (typeof tc.output === 'string' ? tc.output.slice(0, 300) : JSON.stringify(tc.output, null, 2).slice(0, 300)) : '',
      status: tc.status,
    }));
    flowItems.push({ step: '', tools: allTools });
  }

  return (
    <div className="thinking active">
      <button className="thinking-head">
        <Icon name="chevronRight" size={14} className="chev open" />
        <span className="thinking-title">Thinking</span>
        <span className="thinking-waves" aria-hidden="true"><i /><i /><i /><i /><i /></span>
      </button>
      <div className="thinking-body">
        {flowItems.map((item, i) => {
          const tools = item.tools || [];
          return (
            <div key={i} className="reason-item">
              {item.step && (
                <div className="reason-line">
                  <span className="reason-rail"><span className="reason-dot" /></span>
                  <span className="reason-text">{item.step}</span>
                </div>
              )}
              {tools.length > 0 && (
                <div className="reason-trace">
                  <span className="reason-rail solid" />
                  <div className={'trace-group' + (tools.some(t => t.status === 'running') ? ' running' : '')}>
                    <button className="trace-group-head">
                      <Icon name="chevronRight" size={13} className="chev open" />
                      <Icon name="tool" size={14} className="tt-ic" />
                      <span className="tg-label">{tools.length} tool call{tools.length > 1 ? 's' : ''}</span>
                      {tools.some(t => t.status === 'running') ? (
                        <span className="tt-status running"><span className="run-dots-sm" /> running</span>
                      ) : (
                        <span className="tt-status"><Icon name="check" size={12} /> done</span>
                      )}
                    </button>
                    <div className="trace-group-body">
                      {tools.map((t, ti) => (
                        <div key={ti} className="trace-card">
                          <button className="trace-card-head">
                            <Icon name="chevronRight" size={13} className="chev" />
                            <Icon name="tool" size={14} className="tt-ic" />
                            <span className="tt-name">{t.name}</span>
                            {t.status === 'running' ? (
                              <span className="tt-status running"><span className="run-dots-sm" /> running</span>
                            ) : (
                              <span className="tt-status"><Icon name="check" size={12} /> done</span>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div className="reason-line pending">
          <span className="reason-rail"><span className="reason-dot live" /></span>
          <span className="reason-text muted">Working through it<span className="run-dots" /></span>
        </div>
      </div>
    </div>
  );
}

function renderMessage(m, i, ctx) {
  if (m.type === 'user') return <UserMessage key={m.id || i} text={m.text} />;
  if (m.type === 'qa') return <QABlock key={i} pairs={m.pairs} />;
  if (m.type === 'ai-short') return (
    <div className="msg msg-ai" key={i}><div className="ai-row">
      <span className="ai-avatar"><Icon name="sparkles" size={17} /></span>
      <div className="ai-content"><div className="answer"><p>{m.text}</p></div></div>
    </div></div>
  );
  if (m.type === 'ai') return (
    <AnswerMessage
      key={m.id}
      blocks={m.blocks} reasoning={m.reasoning} sources={ctx.sources} motion={ctx.motion}
      onRunAnalyst={ctx.onRunAnalyst} onOpenSources={ctx.onOpenSources} onTick={ctx.onTick} animate={!m.done}
      onComplete={() => { ctx.onTick && ctx.onTick(); ctx.markDone && ctx.markDone(m.id); }}
    />
  );
  return null;
}

function SuggestExpanded({ s, onClose, onHover, onPick }) {
  if (!s) return null;
  return (
    <div className="suggest-expanded">
      <div className="se-head">
        <Icon name={s.icon} size={17} className="sp-ic" /> {s.label}
        <button onClick={onClose}><Icon name="x" size={15} /></button>
      </div>
      {s.prompts.map((p, i) => (
        <button key={i} className="se-prompt" onMouseEnter={() => onHover(p)} onMouseLeave={() => onHover('')} onClick={() => onPick(p)}>
          <Icon name="search" size={15} style={{ color: 'var(--label-tertiary)' }} />
          <span>{p}</span>
          <Icon name="arrowRight" size={16} className="se-arrow" />
        </button>
      ))}
    </div>
  );
}

function SourceTab() {
  return (
    <div>
      <div className="list-head">{SOURCES.length} sources referenced in this conversation</div>
      {SOURCES.map((s) => (
        <div key={s.id} className="src-card">
          <span className="sc-ic" style={{ background: s.kind === 'pdf' ? 'var(--c-red)' : 'var(--c-green)' }}>{s.kind.toUpperCase()}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sc-name">{s.name}</div>
            <div className="sc-meta">{s.meta}</div>
          </div>
          <button className="gbtn icon-only" style={{ width: 34, height: 34 }}><Icon name="arrowRight" size={16} /></button>
        </div>
      ))}
    </div>
  );
}

function AnalysisTab({ items }) {
  if (!items.length) return (
    <div className="empty-tab">
      <div className="et-ic"><Icon name="sheet" size={26} /></div>
      No analyses saved yet. Run the Analyst and hit Save to collect reports here.
    </div>
  );
  return (
    <div>
      <div className="list-head">{items.length} saved {items.length === 1 ? 'analysis' : 'analyses'}</div>
      {items.map((s) => (
        <div key={s.id} className="src-card">
          <span className="sc-ic" style={{ background: 'var(--pmi-grad)' }}><Icon name="sparkles" size={17} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sc-name">{s.title}</div>
            <div className="sc-meta">{s.template} · saved {s.time}</div>
          </div>
          <button className="gbtn icon-only" style={{ width: 34, height: 34 }}><Icon name="arrowRight" size={16} /></button>
        </div>
      ))}
    </div>
  );
}

function DataPopup({ onClose }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className="data-pop" onClick={(e) => e.stopPropagation()}>
        <div className="dp-head">
          <span className="row gap-8"><Icon name="database" size={18} style={{ color: 'var(--pmi-blue)' }} /> <b>Connected data</b></span>
          <button className="gbtn icon-only" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <div className="dp-body">
          <div className="dp-stat"><span>Data rooms</span><b>3</b></div>
          <div className="dp-stat"><span>Tables indexed</span><b>48</b></div>
          <div className="dp-stat"><span>Last refresh</span><b>9 min ago</b></div>
          <div className="list-head" style={{ marginTop: 16 }}>Sources in scope</div>
          {SOURCES.map((s) => (
            <div key={s.id} className="src-card" style={{ marginBottom: 8 }}>
              <span className="sc-ic" style={{ background: s.kind === 'pdf' ? 'var(--c-red)' : 'var(--c-green)' }}>{s.kind.toUpperCase()}</span>
              <div style={{ flex: 1, minWidth: 0 }}><div className="sc-name">{s.name}</div><div className="sc-meta">{s.meta}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
