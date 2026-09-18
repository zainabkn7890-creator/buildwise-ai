import React, { useState } from 'react';
import { X, Sparkles, Wand2 } from 'lucide-react';

export default function AIGenerateModal({ isOpen, onClose, onConfirmGenerate }) {
  const [style, setStyle] = useState('luxury');
  const [priority, setPriority] = useState('balanced');
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" aria-hidden={!isOpen}>
      <div className="modal-box">
        <div className="modal-header">
          <h3 className="modal-title">
            <Sparkles size={20} style={{ color: 'var(--gold-primary)' }} />
            <span>✨ AI Layout Generator Configurator</span>
          </h3>
          <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
          Generate a custom editable floor plan draft optimized for your plot dimensions, room allocations, solar orientation, and budget targets.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
              Architectural Style
            </label>
            <select 
              className="ws-prop-input" 
              value={style} 
              onChange={(e) => setStyle(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="luxury">Modern Luxury Villa</option>
              <option value="biophilic">Eco-Biophilic (Max Daylight & Cross Airflow)</option>
              <option value="compact">Compact Space-Optimized Plan</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Bedrooms
              </label>
              <select 
                className="ws-prop-input" 
                value={bedrooms} 
                onChange={(e) => setBedrooms(Number(e.target.value))}
                style={{ width: '100%' }}
              >
                <option value={2}>2 Bedrooms</option>
                <option value={3}>3 Bedrooms</option>
                <option value={4}>4 Bedrooms</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Bathrooms
              </label>
              <select 
                className="ws-prop-input" 
                value={bathrooms} 
                onChange={(e) => setBathrooms(Number(e.target.value))}
                style={{ width: '100%' }}
              >
                <option value={2}>2 Bathrooms</option>
                <option value={3}>3 Bathrooms</option>
                <option value={4}>4 Bathrooms</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
              Optimization Priority
            </label>
            <select 
              className="ws-prop-input" 
              value={priority} 
              onChange={(e) => setPriority(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="balanced">Balanced (Cost + Daylight + Structural Comfort)</option>
              <option value="solar">Maximum Solar & Ventilation Efficiency</option>
              <option value="cost">Maximum Cost Reduction</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn-header-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-empty-primary" onClick={() => { onConfirmGenerate(); onClose(); }}>
            <Wand2 size={16} />
            <span>Generate Initial Layout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
