// ResultsPanel.jsx — the Analyst report pane shown on the right in Analyst mode:
// the report "screen" chrome (save/download/close), and its body which switches
// between the template chooser, a generating skeleton, and the rendered report.
import React from 'react';
import { Icon } from './components/Icon.jsx';
import { USER } from './mockData/user.js';
import { ANALYST_TEMPLATES, REPORT_BARS } from './mockData/analyst.js';
import './ResultsPanel.css';

// skeleton shown while a brand-new report is being generated
export function ReportSkeleton() {
  return (
    <div className="report-doc skel-doc" aria-hidden="true">
      <div className="skel skel-kicker" />
      <div className="skel skel-title" />
      <div className="skel skel-title short" />
      <div className="skel skel-meta" />
      <div className="kpi-grid">
        {[0, 1, 2].map((i) => <div key={i} className="skel skel-kpi" />)}
      </div>
      <div className="skel skel-h2" />
      <div className="skel-chart">
        {[58, 38, 72, 50, 33].map((h, i) => <span key={i} className="skel skel-bar" style={{ height: h + '%' }} />)}
      </div>
      <div className="skel skel-h2" />
      {[100, 94, 97, 90].map((w, i) => <div key={i} className="skel skel-line" style={{ width: w + '%' }} />)}
    </div>
  );
}

// brief overlay while an existing report is being updated in the background
export function ReportRefreshing() {
  return (
    <div className="report-refresh">
      <div className="rr-card">
        <span className="rr-spin"><Icon name="refresh" size={22} /></span>
        <div className="rr-text">
          <div className="rr-title">Updating the report…</div>
          <div className="rr-sub">Applying your changes in the background</div>
        </div>
      </div>
    </div>
  );
}

// the analysis-type carousel shown when no template is selected
export function ReportTemplateChooser({ onPick }) {
  return (
    <div className="rpt-chooser">
      <div className="rc-head">
        <span className="rc-kicker"><Icon name="sparkles" size={14} /> Analyst</span>
        <h3>Choose an analysis type</h3>
        <p>Pick a template and I’ll generate a fresh report from your connected data.</p>
      </div>
      <div className="rc-carousel">
        {ANALYST_TEMPLATES.map((t) => (
          <button key={t.id} className="rc-card" onClick={() => onPick(t)}>
            <span className="rc-ic"><Icon name={t.icon} size={22} /></span>
            <div className="rc-name">{t.label}</div>
            <div className="rc-desc">{t.desc}</div>
            <span className="rc-go"><Icon name="arrowRight" size={16} /></span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function AnalystReport({ template }) {
  const tpl = template?.id || 'generic';
  const titles = {
    generic: 'DIM cost — EU cluster, FY26 YTD',
    prediction: 'DIM cost forecast — EU cluster, FY26 → FY27',
    whatif: 'What-If Scenario Analysis',
  };
  const kickers = { generic: 'Analyst report · Generic', prediction: 'Analyst report · Prediction', whatif: 'Analyst report · What-if' };

  if (tpl === 'whatif') {
    return (
      <div className="report-doc fill">
        <div className="rpt-kicker">ANALYST REPORT · WHAT-IF</div>
        <h1 className="rpt-h1">What-If Scenario Analysis</h1>
        <p className="rpt-p" style={{ color: 'var(--label-secondary)', fontSize: 13, marginTop: 4 }}>
          Fuel &amp; FX Shock Impact on Price Effect · June 2026 Cycle
        </p>
        <div className="rpt-meta">
          <span>Generated: 12 Jun 2026</span>
          <span>·</span>
          <span>Procurement Analytics · DIM Agent</span>
        </div>

        <div className="kpi-grid">
          <div className="kpi"><div className="k-label">Baseline Price Effect</div><div className="k-value">133.0 M$</div><div className="k-delta">Current cycle · 5 categories tracked</div></div>
          <div className="kpi"><div className="k-label">Scenario A — Fuel Shock +10%</div><div className="k-value up">+4.8 M$</div><div className="k-delta up">▲ 3.6% vs baseline · New total: 137.8 M$</div></div>
          <div className="kpi"><div className="k-label">Scenario B — FX Shock (EUR/USD -5%)</div><div className="k-value up">+4.5 M$</div><div className="k-delta up">▲ 3.4% vs baseline · New total: 137.5 M$</div></div>
        </div>

        <h2 className="rpt-h2">Scenario A — Fuel Shock +10%</h2>
        <p className="rpt-p" style={{ fontSize: 13, color: 'var(--label-secondary)' }}>Fuel index +10% propagated</p>
        <table className="rpt-table">
          <thead><tr><th>Category</th><th>Baseline (M$)</th><th>Δ Effect (M$)</th><th>Shocked (M$)</th><th colSpan="2">Impact (%)</th></tr></thead>
          <tbody>
            {[
              { cat: 'Shipping Cases', base: 39.9, delta: 1.68, shocked: 41.6, pct: 4.2 },
              { cat: 'Acetate Tow', base: 30.6, delta: 0.86, shocked: 31.5, pct: 2.8 },
              { cat: 'Fine Paper', base: 23.9, delta: 0.84, shocked: 24.7, pct: 3.5 },
              { cat: 'Adhesives', base: 20.0, delta: 1.02, shocked: 21.0, pct: 5.1 },
              { cat: 'Susceptors', base: 18.6, delta: 0.35, shocked: 19.0, pct: 1.9 },
            ].map((r, i) => (
              <tr key={i}>
                <td>{r.cat}</td>
                <td>{r.base}</td>
                <td style={{color:'var(--c-green)'}}>+{r.delta}</td>
                <td>{r.shocked}</td>
                <td style={{width:80}}><div style={{height:8,borderRadius:4,background:'#38bdf8',width:(r.pct/5.1*100)+'%'}} /></td>
                <td style={{color:'var(--c-red)'}}>+{r.pct}%</td>
              </tr>
            ))}
            <tr style={{fontWeight:700}}><td>Total</td><td>133.0</td><td>+4.75</td><td>137.8</td><td></td><td>+3.6%</td></tr>
          </tbody>
        </table>

        <h2 className="rpt-h2">Scenario B — FX Shock (EUR/USD -5%)</h2>
        <p className="rpt-p" style={{ fontSize: 13, color: 'var(--label-secondary)' }}>Currency depreciation impact</p>
        <table className="rpt-table">
          <thead><tr><th>Category</th><th>Baseline (M$)</th><th>Δ Effect (M$)</th><th>Shocked (M$)</th><th colSpan="2">Impact (%)</th></tr></thead>
          <tbody>
            {[
              { cat: 'Shipping Cases', base: 39.9, delta: 0.84, shocked: 40.7, pct: 2.1 },
              { cat: 'Acetate Tow', base: 30.6, delta: 1.71, shocked: 32.3, pct: 5.6 },
              { cat: 'Fine Paper', base: 23.9, delta: 0.43, shocked: 24.3, pct: 1.8 },
              { cat: 'Adhesives', base: 20.0, delta: 0.64, shocked: 20.6, pct: 3.2 },
              { cat: 'Susceptors', base: 18.6, delta: 0.87, shocked: 19.5, pct: 4.7 },
            ].map((r, i) => (
              <tr key={i}>
                <td>{r.cat}</td>
                <td>{r.base}</td>
                <td style={{color:'var(--c-green)'}}>+{r.delta}</td>
                <td>{r.shocked}</td>
                <td style={{width:80}}><div style={{height:8,borderRadius:4,background:'#ff9f0a',width:(r.pct/5.6*100)+'%'}} /></td>
                <td style={{color:'var(--c-red)'}}>+{r.pct}%</td>
              </tr>
            ))}
            <tr style={{fontWeight:700}}><td>Total</td><td>133.0</td><td>+4.49</td><td>137.5</td><td></td><td>+3.4%</td></tr>
          </tbody>
        </table>

        <h2 className="rpt-h2">Price Effect Delta Comparison by Category</h2>
        <p className="rpt-p" style={{ fontSize: 13, color: 'var(--label-secondary)' }}>Additional price effect (Δ M$) under each shock scenario</p>
        <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 12 }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#ff6b6b', marginRight: 6 }}/>Scenario A — Fuel +10%</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#38bdf8', marginRight: 6 }}/>Scenario B — FX -5%</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { x: 'Shipping Cases', a: 1.68, b: 0.84 },
            { x: 'Acetate Tow', a: 0.86, b: 1.71 },
            { x: 'Fine Paper', a: 0.84, b: 0.43 },
            { x: 'Adhesives', a: 1.02, b: 0.64 },
            { x: 'Susceptors', a: 0.35, b: 0.87 },
          ].map((d, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--label-secondary)' }}>{d.x}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: Math.max(8, d.a / 1.71 * 100) + '%', height: 14, borderRadius: 4, background: '#ff6b6b' }} />
                <span style={{ fontSize: 11 }}>{d.a}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: Math.max(8, d.b / 1.71 * 100) + '%', height: 14, borderRadius: 4, background: '#38bdf8' }} />
                <span style={{ fontSize: 11 }}>{d.b}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="rpt-callout" style={{ marginTop: 24 }}>
          <div className="co-title"><Icon name="search" size={15} /> Key Takeaways</div>
          <div className="co-body">
            <p>⛽ Fuel shock hits Adhesives hardest (+5.1%) due to petrochemical feedstock dependency.</p>
            <p>💱 FX shock concentrates risk on Acetate Tow (+5.6%) — high import exposure from USD-denominated suppliers.</p>
            <p>⚠️ Combined worst-case: total price effect could reach ~142.3 M$ (+7.0% vs baseline) if both shocks materialize simultaneously.</p>
            <p>⚖️ Shipping Cases most resilient to FX but most exposed to fuel — a differentiated hedging mix is required.</p>
          </div>
        </div>

        <div className="rpt-callout">
          <div className="co-title"><Icon name="bulb" size={15} /> Recommendations</div>
          <div className="co-body">
            <p>1. Accelerate fuel hedging for Adhesives &amp; Shipping Cases before Q3 commitment window — 57% of fuel-shock delta.</p>
            <p>2. Review FX forward contracts for Acetate Tow — current coverage expires Aug 2026. Extending by 6 months neutralises ~1.2 M$.</p>
            <p>3. Trigger PDCA escalation for any category exceeding +4% price-effect threshold.</p>
            <p>4. Schedule scenario deep-dive with category managers before 30 Jun cycle close.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-doc fill">
      <div className="rpt-kicker">{kickers[tpl]}</div>
      <h1 className="rpt-h1">{titles[tpl]}</h1>
      <div className="rpt-meta">
        <span>Prepared for {USER.first} {USER.last}</span>
        <span>·</span>
        <span>Generated just now</span>
        <span>·</span>
        <span>4 sources</span>
      </div>

      <p className="rpt-p">
        Direct input materials are running <span className="hl">$19.2M over budget</span> in the EU cluster for FY26 to date — a 4.8% variance driven overwhelmingly by acetate tow.
        {tpl === 'prediction' && ' On current trajectory the gap widens to roughly $31M by FY27 close unless the tow position is hedged.'}
        {tpl === 'whatif' && ' Applying a uniform +150bps inflation shock pushes the over-budget position to an estimated $27.4M.'}
      </p>

      <div className="kpi-grid">
        <div className="kpi"><div className="k-label">DIM spend YTD</div><div className="k-value">$418.2M</div><div className="k-delta up">+4.8% vs budget</div></div>
        <div className="kpi"><div className="k-label">Composite index</div><div className="k-value">+6.8%</div><div className="k-delta up">24-mo trend</div></div>
        <div className="kpi"><div className="k-label">Tow contribution</div><div className="k-value">62%</div><div className="k-delta down">of the variance</div></div>
      </div>

      <h2 className="rpt-h2">Spend by material</h2>
      <div className="chart">
        {REPORT_BARS.map((b, i) => (
          <div key={i} className="chart-col">
            <div className={'chart-bar' + (b.alt ? ' alt' : '')} style={{ height: b.v * 100 + '%' }} />
            <div className="chart-x">{b.x}</div>
          </div>
        ))}
      </div>

      <h2 className="rpt-h2">{tpl === 'prediction' ? 'Forecast detail' : tpl === 'whatif' ? 'Scenario detail' : 'Movement detail'}</h2>
      <table className="rpt-table">
        <thead><tr><th>Material</th><th>Spend</th><th>YoY</th><th>{tpl === 'prediction' ? 'FY27e' : tpl === 'whatif' ? '+150bps' : 'vs budget'}</th></tr></thead>
        <tbody>
          <tr><td>Acetate tow</td><td>$146.3M</td><td>+11.4%</td><td>{tpl === 'prediction' ? '$163.1M' : tpl === 'whatif' ? '$152.0M' : '+$11.9M'}</td></tr>
          <tr><td>Tipping paper</td><td>$78.9M</td><td>+5.2%</td><td>{tpl === 'prediction' ? '$83.0M' : tpl === 'whatif' ? '$81.3M' : '+$3.9M'}</td></tr>
          <tr><td>Cigarette paper</td><td>$71.4M</td><td>+3.1%</td><td>{tpl === 'prediction' ? '$73.6M' : tpl === 'whatif' ? '$73.1M' : '+$2.1M'}</td></tr>
          <tr><td>Plug wrap</td><td>$64.0M</td><td>−0.8%</td><td>{tpl === 'prediction' ? '$63.5M' : tpl === 'whatif' ? '$65.0M' : '−$0.5M'}</td></tr>
        </tbody>
      </table>

      <div className="rpt-callout">
        <div className="co-title"><Icon name="bulb" size={15} /> Recommendation</div>
        <div className="co-body">
          Prioritise a hedge review on acetate tow before the Q4 commitment window, and re-open the tipping-paper tender. Together these address ~78% of the over-budget exposure.
        </div>
      </div>

      <p className="rpt-p" style={{ color: 'var(--label-secondary)', fontSize: 13 }}>
        Ask in the chat on the left to deep-dive any figure, change the scope, or regenerate a section.
      </p>
    </div>
  );
}

// The full report screen: chrome (title + save/download/close) and the body that
// switches between chooser / skeleton / rendered report, plus the refresh overlay.
export default function ResultsPanel({ analyst, onPick, onClose, onSave, onDownload }) {
  const choosing = !analyst.template || analyst.phase === 'choosing';
  return (
    <div className="report-screen">
      <div className="report-chrome">
        <span className="report-title"><Icon name="sheet" size={15} style={{ color: 'var(--pmi-blue)' }} /> Analyst report</span>
        <span className="spacer" />
        {!choosing && analyst.phase === 'ready' && (
          <>
            <button className="gbtn" style={{ padding: '7px 13px' }} onClick={onSave}><Icon name="save" size={15} /> Save</button>
            <button className="gbtn" style={{ padding: '7px 13px' }} onClick={onDownload}><Icon name="download" size={15} /> Download</button>
          </>
        )}
        <button className="report-close" onClick={onClose} title="Close report"><Icon name="x" size={17} /></button>
      </div>
      <div className="report-scroll">
        {choosing ? (
          <ReportTemplateChooser onPick={onPick} />
        ) : analyst.phase === 'creating' ? (
          <ReportSkeleton />
        ) : (
          <AnalystReport key={analyst.rev} template={analyst.template} rev={analyst.rev} />
        )}
      </div>
      {analyst.phase === 'updating' && <ReportRefreshing />}
      {!choosing && (
        <div className="report-disclaimer">
          <Icon name="alert" size={13} /> AI can make mistakes. Always review the report against the source data before acting on it.
        </div>
      )}
    </div>
  );
}
