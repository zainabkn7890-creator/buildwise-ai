import React from 'react';
import { 
  Undo2, Redo2, Grid, Magnet, Download, FileText, Bell, 
  ChevronDown, CheckCircle2 
} from 'lucide-react';

export default function Header({ 
  projectName, 
  setProjectName, 
  activeFloor, 
  setActiveFloor, 
  gridVisible, 
  setGridVisible, 
  gridSnap, 
  setGridSnap, 
  zoomLevel, 
  setZoomLevel, 
  onUndo, 
  onRedo, 
  onExport, 
  onOpenReport, 
  onGenerate3D 
}) {
  return (
    <header className="workspace-header">
      {/* Left Group */}
      <div className="header-left-group">
        <a href="/index.html" className="brand-logo-box" title="BuildWise AI Homepage">
          <div className="brand-icon-mark">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="28" height="28" rx="6" fill="#04100b" stroke="#D4AF37" stroke-width="2"/>
              <path d="M8 22L16 10L24 22H8Z" stroke="#D4AF37" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M16 10V22" stroke="#34D399" stroke-width="2" stroke-dasharray="2 2"/>
              <circle cx="16" cy="10" r="2.5" fill="#F3D375"/>
            </svg>
          </div>
          <div className="brand-title-stack">
            <span className="brand-title-main">BuildWise <span style={{ color: '#d4af37' }}>AI</span></span>
            <span className="brand-title-sub">Plan Smart. Build Better.</span>
          </div>
        </a>

        {/* Project Selector */}
        <div className="header-selector-pill">
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Project:</span>
          <select value={projectName} onChange={(e) => setProjectName(e.target.value)}>
            <option value="Modern Villa">Modern Villa</option>
            <option value="Horizon Heights Residence">Horizon Heights Residence</option>
            <option value="Zero-Carbon Eco Cottage">Zero-Carbon Eco Cottage</option>
            <option value="Commercial Suite Plan">Commercial Suite Plan</option>
          </select>
        </div>


      </div>

      {/* Center Group */}
      <div className="header-center-group">
        {/* Auto Save Badge */}
        <div className="auto-save-badge">
          <div className="auto-save-dot"></div>
          <span>Auto Save <strong style={{ color: '#ffffff' }}>Saved 2m ago</strong></span>
        </div>

        {/* Undo & Redo */}
        <button className="hdr-icon-btn" onClick={onUndo} title="Undo (Ctrl+Z)">
          <Undo2 size={15} />
        </button>
        <button className="hdr-icon-btn" onClick={onRedo} title="Redo (Ctrl+Y)">
          <Redo2 size={15} />
        </button>

        {/* Zoom Selector */}
        <div className="header-selector-pill">
          <select value={zoomLevel} onChange={(e) => setZoomLevel(Number(e.target.value))}>
            <option value={50}>50%</option>
            <option value={75}>75%</option>
            <option value={100}>100%</option>
            <option value={125}>125%</option>
            <option value={150}>150%</option>
            <option value={200}>200%</option>
          </select>
        </div>

        {/* Grid Toggle */}
        <button 
          className={`hdr-icon-btn ${gridVisible ? 'active' : ''}`} 
          onClick={() => setGridVisible(!gridVisible)}
          title="Toggle Grid Lines"
        >
          <Grid size={15} style={{ marginRight: '0.25rem' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Grid</span>
        </button>

        {/* Snap Toggle */}
        <button 
          className={`hdr-icon-btn ${gridSnap ? 'active' : ''}`} 
          onClick={() => setGridSnap(!gridSnap)}
          title="Toggle Snap to Grid"
        >
          <Magnet size={15} style={{ marginRight: '0.25rem' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Snap</span>
        </button>

        {/* Generate 3D Button */}
        <button className="hdr-icon-btn" onClick={onGenerate3D} title="Generate 3D Model" style={{ background: 'rgba(212, 175, 55, 0.08)', borderColor: 'var(--gold-border)', color: 'var(--gold-light)', fontWeight: 600, fontSize: '0.75rem', padding: '0.35rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
          <span>3D Model</span>
        </button>
      </div>

      {/* Right Group */}
      <div className="header-left-group">
        <button className="hdr-icon-btn" onClick={onExport} title="Export Floor Plan">
          <Download size={15} style={{ marginRight: '0.25rem' }} />
          <span style={{ fontSize: '0.75rem' }}>Export</span>
          <ChevronDown size={12} style={{ marginLeft: '0.2rem' }} />
        </button>

        <button className="hdr-icon-btn" onClick={onOpenReport} title="View Structural & Cost Report">
          <FileText size={15} style={{ marginRight: '0.25rem' }} />
          <span style={{ fontSize: '0.75rem' }}>Reports</span>
        </button>

        <button className="hdr-icon-btn" style={{ position: 'relative' }} title="Notifications">
          <Bell size={15} />
          <span style={{ 
            position: 'absolute', top: '-2px', right: '-2px', width: '14px', height: '14px', 
            background: '#f87171', color: '#fff', fontSize: '0.6rem', fontWeight: 'bold', 
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>1</span>
        </button>

        <div className="user-avatar-badge" title="User Profile: Architect Khan">
          AK
        </div>
      </div>
    </header>
  );
}
