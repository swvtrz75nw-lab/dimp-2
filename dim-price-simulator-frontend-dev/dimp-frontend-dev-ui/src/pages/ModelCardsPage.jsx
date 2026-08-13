// pages/ModelCardsPage.jsx — Model Cards · Logic Studio page
import React, { useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import './modelCards.css';

const CATEGORIES = ['Shipping Cases', 'Acetate Tow', 'Fine Paper', 'Adhesives', 'Susceptors'];

const CARD_DATA = {
  'Shipping Cases': { version: 'v3.2', owner: 'Category Expert 1 - audited', granularity: 'Supplier level', drivers: 'VAM 48% · Acetic 30% · FX 22%', inputs: 'Spec · Volumes (SAP) · Supplier files', output: 'Item price → price effect M$', validation: 'within tolerance vs Excel' },
  'Acetate Tow': { version: 'v2.1', owner: 'Category Expert 2 - audited', granularity: 'Supplier level', drivers: 'VAM 52% · FX 28% · CPI 20%', inputs: 'Spec · Volumes (SAP) · Supplier files', output: 'Item price → price effect M$', validation: 'within tolerance vs Excel' },
  'Fine Paper': { version: 'v1.8', owner: 'Category Expert 1 - audited', granularity: 'Item level', drivers: 'Pulp (BHKP) 55% · Energy 25% · FX 20%', inputs: 'Spec · Volumes (SAP) · Supplier files', output: 'Item price → price effect M$', validation: 'within tolerance vs Excel' },
  'Adhesives': { version: 'v2.0', owner: 'Category Expert 3 - audited', granularity: 'Supplier level', drivers: 'VAM · Acelic · FX', inputs: 'Spec · Volumes (SAP) · Supplier files', output: 'Item price → price effect M$', validation: 'within tolerance vs Excel' },
  'Susceptors': { version: 'draft', owner: 'Category Expert 2 - pending', granularity: 'Supplier level', drivers: 'Steel · Aluminium', inputs: 'Spec · Volumes (SAP) · Supplier files', output: 'Item price → price effect M$', validation: 'In progress' },
};

const SUGGESTIONS = [
  'Set VAM weight to 55%',
  'Add 2% added-value uplift on ACME',
  'Validate against Excel reference',
];

export default function ModelCardsPage() {
  const [selectedCat, setSelectedCat] = useState('Shipping Cases');
  const [studioInput, setStudioInput] = useState('');
  const card = CARD_DATA[selectedCat];

  return (
    <div className="mc-page">
      <div className="mc-header">
        <span className="mc-kicker">— KNOWLEDGE PRESERVATION</span>
        <h1 className="mc-title">Model Cards · Logic Studio</h1>
        <p className="mc-subtitle">Expert logic captured as versioned, business-readable, agent-executable Model Cards — created and edited in natural language, not code.</p>
      </div>

      <div className="mc-content">
        {/* Left: Model Card */}
        <div className="mc-card-panel">
          <div className="mc-card-top">
            <span className="mc-card-label">Model Card</span>
            <select className="mc-cat-select" value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="mc-card-meta">
            <span className={'mc-version-pill' + (card.version === 'draft' ? ' draft' : '')}>{card.version}{card.version !== 'draft' ? ' · governed' : ''}</span>
            <span className="mc-owner">Owner: {card.owner}</span>
          </div>

          <div className="mc-card-table">
            <div className="mc-row"><span className="mc-row-k">Granularity</span><span className="mc-row-v">{card.granularity}</span></div>
            <div className="mc-row"><span className="mc-row-k">Drivers</span><span className="mc-row-v">{card.drivers}</span></div>
            <div className="mc-row"><span className="mc-row-k">Inputs</span><span className="mc-row-v">{card.inputs}</span></div>
            <div className="mc-row"><span className="mc-row-k">Output</span><span className="mc-row-v">{card.output}</span></div>
            <div className="mc-row"><span className="mc-row-k">Validation</span><span className="mc-row-v mc-valid">✓ {card.validation}</span></div>
          </div>
        </div>

        {/* Right: Logic Studio */}
        <div className="mc-studio-panel">
          <div className="mc-studio-top">
            <span className="mc-studio-label">Edit logic in natural language</span>
            <div className="mc-studio-actions">
              <span className="mc-agent-pill">● NL Agent</span>
              <button className="mc-new-btn">+ New</button>
            </div>
          </div>

          <div className="mc-suggestions">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} className="mc-suggestion-chip" onClick={() => setStudioInput(s)}>{s}</button>
            ))}
          </div>

          <div className="mc-studio-body">
            <div className="mc-studio-icon"><Icon name="sparkles" size={28} /></div>
            <h3 className="mc-studio-title">Logic Studio</h3>
            <p className="mc-studio-desc">Describe a change to this Model Card in plain language — weights, rules, suppliers. Try a prompt above.</p>
          </div>

          <div className="mc-studio-input-wrap">
            <input
              className="mc-studio-input"
              placeholder="Describe a logic change... (try a prompt above)"
              value={studioInput}
              onChange={(e) => setStudioInput(e.target.value)}
            />
            <button className="mc-studio-send"><Icon name="arrowUp" size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
