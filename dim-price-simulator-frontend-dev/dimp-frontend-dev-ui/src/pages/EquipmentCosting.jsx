import React from 'react';
import './EquipmentCosting.css';

function EquipmentCosting() {
  return (
    <div className="equip-page">
      <div className="equip-inner">
        <div className="equip-head">
          <div className="equip-kicker">FORECASTING & SIMULATION · TP</div>
          <h1 className="equip-title">Equipment Costing Simulations <span>(TP)</span></h1>
          <p className="equip-sub">Equipment cost simulation — currently in scoping with the domain owner. Will run on the same platform.</p>
        </div>
        <div className="equip-content">
          <div className="equip-card">
            <div className="equip-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2"/>
                <path d="M12 12h.01"/>
                <path d="M17 12h.01"/>
                <path d="M7 12h.01"/>
              </svg>
            </div>
            <h2>In scoping</h2>
            <p>
              Equipment-specific inputs and logic are being defined with the domain owner. Once scoped, TP onboards onto the same simulation platform — inputs × logic → impact M$.
            </p>
            <div className="equip-flow">
              <span className="equip-flow-item">Equipment inputs</span>
              <span className="equip-flow-arrow">→</span>
              <span className="equip-flow-item">Domain logic</span>
              <span className="equip-flow-arrow">→</span>
              <span className="equip-flow-item">Impact M$</span>
            </div>
            <button className="equip-notify-btn">Notify me when TP onboards</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EquipmentCosting;
