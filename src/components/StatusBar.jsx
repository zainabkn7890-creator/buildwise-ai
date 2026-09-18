import React from 'react';
import { Layers, Compass } from 'lucide-react';

export default function StatusBar({
  activeFloor,
  setActiveFloor,
  plotArea,
  builtArea,
  remainingArea,
  roomCount,
  totalCost,
  currency,
  setCurrency,
  gridVisible,
  gridSnap,
  zoomLevel,
  mouseCoords
}) {
  const currSymbol = currency === 'INR' ? '₹' : '$';

  return (
    <footer className="workspace-footer-status">
      {/* Left Items */}
      <div className="footer-left-items">
        {/* Active Floor Display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#fff', fontWeight: 600 }}>
          <Layers size={13} style={{ color: 'var(--gold-primary)' }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{activeFloor === 'ground' ? 'Ground Floor' : activeFloor === 'first' ? 'First Floor' : activeFloor === 'second' ? 'Second Floor' : activeFloor === 'terrace' ? 'Terrace' : 'Basement'}</span>
        </div>

        <div>
          <span>Plot Area: </span>
          <strong style={{ color: '#fff' }}>{plotArea.toLocaleString()} sq ft</strong>
        </div>

        <div>
          <span>Built-up Area: </span>
          <strong style={{ color: '#fff' }}>{builtArea.toLocaleString()} sq ft</strong>
        </div>

        <div>
          <span>Remaining Area: </span>
          <strong className="status-badge-green">{remainingArea.toLocaleString()} sq ft</strong>
        </div>

        <div>
          <span>Rooms: </span>
          <strong style={{ color: '#fff' }}>{roomCount}</strong>
        </div>

        <div>
          <span>Estimated Cost: </span>
          <strong style={{ color: 'var(--gold-light)' }}>{currSymbol} {totalCost.toLocaleString()}</strong>
        </div>

        {/* Currency Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <span>Currency: </span>
          <select 
            value={currency} 
            onChange={(e) => setCurrency(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-forest)', 
              color: 'var(--emerald-accent)', borderRadius: '3px', padding: '1px 4px', 
              fontSize: '0.68rem', outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="INR" style={{ background: '#071912' }}>INR (₹)</option>
            <option value="USD" style={{ background: '#071912' }}>USD ($)</option>
          </select>
        </div>
      </div>

      {/* Right Items */}
      <div className="footer-right-items">
        <div>
          <span>Grid: </span>
          <span className={gridVisible ? 'status-badge-green' : ''}>{gridVisible ? 'ON' : 'OFF'}</span>
        </div>

        <div>
          <span>Snap: </span>
          <span className={gridSnap ? 'status-badge-green' : ''}>{gridSnap ? 'ON' : 'OFF'}</span>
        </div>

        <div>
          <span>Zoom: </span>
          <strong style={{ color: '#fff' }}>{zoomLevel}%</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--gold-light)' }}>
          <Compass size={12} />
          <span>{mouseCoords}</span>
        </div>
      </div>
    </footer>
  );
}
