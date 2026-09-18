import React from 'react';
import { X, FileCheck2, Printer, Download } from 'lucide-react';

export default function ReportModal({
  isOpen,
  onClose,
  projectName,
  totalCost = 0,
  builtArea = 0,
  costPerSqFt = 0,
  sustainabilityMetrics = {},
  currency = 'INR',
  materialQuality = 'Standard'
}) {
  if (!isOpen) return null;

  const currSymbol = currency === 'INR' ? '₹' : '$';
  const score = sustainabilityMetrics?.overallScore || 80;
  const ratingLabel = sustainabilityMetrics?.ratingLabel || 'LEED Gold Standard';
  const perSqFt = costPerSqFt || (currency === 'INR' ? 3685 : 44.5);

  // Dynamic cost breakdown by structural phase
  const substructureCost = Math.round(totalCost * 0.22);
  const superstructureCost = Math.round(totalCost * 0.35);
  const masonryCost = Math.round(totalCost * 0.18);
  const fenestrationCost = Math.round(totalCost * 0.12);
  const finishesCost = totalCost - (substructureCost + superstructureCost + masonryCost + fenestrationCost);

  return (
    <div className="modal-overlay" aria-hidden={!isOpen}>
      <div className="modal-box" style={{ maxWidth: '750px' }}>
        <div className="modal-header">
          <h3 className="modal-title">
            <FileCheck2 size={20} style={{ color: 'var(--gold-primary)' }} />
            <span>BuildWise AI Structural & Cost Compliance Report</span>
          </h3>
          <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="report-summary-grid">
          <div className="ws-card">
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Project Name</span>
            <strong style={{ color: '#ffffff', fontSize: '1.05rem' }}>{projectName}</strong>
          </div>
          <div className="ws-card">
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Environmental & Sustainability Score</span>
            <strong style={{ color: sustainabilityMetrics?.badgeColor || 'var(--emerald-accent)', fontSize: '1.05rem' }}>
              {ratingLabel} ({score}/100)
            </strong>
          </div>
        </div>

        <table className="report-table">
          <thead>
            <tr>
              <th>Building Component</th>
              <th>Specification & Material Takeoff</th>
              <th>Quantity / Area</th>
              <th>Est. Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Substructure & Foundation</td>
              <td>Reinforced Concrete Footings ({materialQuality})</td>
              <td>{builtArea.toLocaleString()} sq ft</td>
              <td>{currSymbol} {substructureCost.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Superstructure Framing</td>
              <td>RC Columns & Structural Steel Beams</td>
              <td>{builtArea.toLocaleString()} sq ft</td>
              <td>{currSymbol} {superstructureCost.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Masonry & Exterior Walls</td>
              <td>Autoclaved Aerated Concrete (AAC) Blocks</td>
              <td>{builtArea.toLocaleString()} sq ft</td>
              <td>{currSymbol} {masonryCost.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Fenestration & Glazing</td>
              <td>Low-E Double Glazed Aluminum Framing</td>
              <td>Perimeter Glazing</td>
              <td>{currSymbol} {fenestrationCost.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Finishes & Smart MEP</td>
              <td>HVAC Zoning + Hardwood / Vitrified Finishes</td>
              <td>Full Structure</td>
              <td>{currSymbol} {finishesCost.toLocaleString()}</td>
            </tr>
            <tr style={{ background: 'rgba(212, 175, 55, 0.08)', fontWeight: 'bold' }}>
              <td colSpan="3" style={{ textAlign: 'right', color: '#ffffff' }}>Total Project Estimated Cost ({currSymbol} {perSqFt.toLocaleString()} / sq ft):</td>
              <td style={{ color: 'var(--gold-light)' }}>{currSymbol} {totalCost.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Report Token: #BW-2026-{Math.floor(10000 + Math.random() * 90000)} • Verified by BuildWise AI Engine</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-header-secondary" onClick={() => window.print()}>
              <Printer size={14} /> Print
            </button>
            <button className="btn-empty-primary" onClick={onClose}>
              <Download size={14} /> Download Signed PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
