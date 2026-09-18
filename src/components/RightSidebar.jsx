import React, { useState } from 'react';
import { 
  CheckCircle2, AlertTriangle, Sparkles, Send, Trash2, Copy, RotateCw, 
  Eye, EyeOff, Layers, Sliders, RefreshCw, ChevronDown, ChevronRight, SquareDashedBottom
} from 'lucide-react';

function CollapsibleSection({ title, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="collapsible-section">
      <button className="collapsible-section-header" onClick={() => setOpen(!open)}>
        <span>{open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</span>
        <span>{title}</span>
      </button>
      {open && <div className="collapsible-section-body">{children}</div>}
    </div>
  );
}

export default function RightSidebar({
  selectedObject,
  selectedWallId,
  plotArea,
  builtArea,
  remainingArea,
  totalCost,
  costPerSqFt,
  sustainabilityMetrics,
  numFloors,
  currency,
  materialStats,
  onUpdateSelectedObject,
  onDeleteSelected,
  onDuplicateSelected,
  onRotateSelected,
  onDeleteWall
}) {
  const [activeTab, setActiveTab] = useState('properties');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your BuildWise AI Assistant. How can I help optimize your floor plan today?' }
  ]);

  const [layerVisibility, setLayerVisibility] = useState({
    walls: true,
    doors: true,
    furniture: true,
    dimensions: true,
    text: true
  });

  const currSymbol = currency === 'INR' ? '₹' : '$';
  const displayCostPerSqFt = costPerSqFt || (builtArea > 0 ? Math.round(totalCost / builtArea) : (currency === 'INR' ? 2500 : 35));

  const generateAIResponse = (question) => {
    const q = question.toLowerCase().trim();

    if (q.includes('remove') && q.includes('wall')) {
      return 'To remove a wall: Select the Wall tool from the left toolbar (or press W). Click on the wall you want to remove to select it — it will highlight in gold. Then press the Delete key or click the Delete button in the floating toolbar. Note: Room walls are part of each room object. To remove a shared wall, you may need to resize the adjacent rooms.';
    }
    if (q.includes('move') && q.includes('wall')) {
      return 'To move a wall: Select the Wall tool (W) and click the wall to select it. Then drag it to reposition. Only standalone walls can be moved. Walls that are part of rooms are moved when you drag the room itself using the Pointer tool (V).';
    }
    if (q.includes('add') && q.includes('wall')) {
      return 'To add a new wall: Select the Wall tool (W) from the left toolbar. Click on the canvas to set the starting point, then click again to set the ending point. A new wall segment will be drawn between the two points. You can then adjust its position by dragging.';
    }
    if (q.includes('move') && q.includes('kitchen')) {
      return 'To move the kitchen: Switch to the Pointer tool (V), then click on the Kitchen room to select it. Drag it to the desired position. The room will snap to the grid if Snap mode is enabled. You can also use the arrow keys for fine positioning.';
    }
    if (q.includes('move') && q.includes('room')) {
      return 'To move a room: Select the Pointer tool (V) from the toolbar, click on the room you want to move, and drag it to the new position. The room will snap to grid if Snap mode is on. Use the property inspector on the right to set exact coordinates.';
    }
    if (q.includes('add') && q.includes('window')) {
      return 'To add a window: Select the Window tool from the left toolbar. Click on any wall of a room where you want the window. A preview will appear — you can drag along the wall to position it precisely, then click to confirm placement. You can also add windows via the Properties panel under the Windows section.';
    }
    if (q.includes('add') && q.includes('door')) {
      return 'To add a door: Select the Door tool from the left toolbar. Click on any wall of a room where you want the door. You can drag along the wall to position it before clicking to confirm. You can also manage doors in the Properties panel under the Doors section for precise offset control.';
    }
    if (q.includes('add') && q.includes('room')) {
      return 'To add a new room: Select any room type from the left sidebar (Bedroom, Kitchen, Living Room, etc.) and drag it onto the canvas. Release to place the room. You can then resize it using the 8-point handles and rename it in the Properties panel.';
    }
    if (q.includes('delete') && q.includes('room')) {
      return 'To delete a room: Select the Pointer tool (V), click on the room to select it, then press the Delete key or click the Delete button in the floating toolbar. You can also use the Delete tool from the left sidebar.';
    }
    if (q.includes('resize') || q.includes('dimension')) {
      return 'To resize a room: Select the Pointer tool (V) and click on the room. You will see 8 resize handles around the room boundary. Drag any handle to resize. You can also enter exact dimensions in the Properties panel on the right (Width and Length fields).';
    }
    if (q.includes('rotate')) {
      return 'To rotate a room: Select it with the Pointer tool (V), then click the Rotate button in the floating toolbar or use the Rotate 90° button in the Properties panel. You can also drag the rotation handle (the circle above the room) for free rotation, which snaps to 15° increments.';
    }
    if (q.includes('duplicate') || q.includes('copy')) {
      return 'To duplicate a room: Select it with the Pointer tool (V), then click the Duplicate button in the floating toolbar or press Ctrl+D. A copy will be placed slightly offset from the original. You can then drag it to the desired position.';
    }
    if (q.includes('undo')) {
      return 'To undo an action: Press Ctrl+Z or click the Undo button in the header toolbar. You can undo multiple steps. Use Ctrl+Y or the Redo button to redo.';
    }
    if (q.includes('zoom')) {
      return 'To zoom: Use the zoom controls at the bottom-right of the canvas (+ / - buttons), or use the zoom dropdown in the header. You can also use Ctrl+Scroll to zoom in and out. The Fit View button resets to 100%.';
    }
    if (q.includes('grid') || q.includes('snap')) {
      return 'Grid and Snap: Toggle the grid with the Grid button in the header. Snap mode makes rooms and walls align to the grid automatically. Both can be toggled from the header toolbar or the status bar.';
    }
    if (q.includes('furniture')) {
      return 'To add furniture: Select a furniture type from the left sidebar (Sofa, Bed, Armchair, etc.) and drag it onto a room. The furniture will be placed relative to the room. You can then drag furniture within the room to reposition it.';
    }
    if (q.includes('staircase') || q.includes('stair')) {
      return 'The Staircase tool adds a stairwell element. Select it from the left sidebar and drag onto the canvas. The staircase is rendered with step lines and an UP indicator arrow. Position it within your floor plan for vertical circulation.';
    }
    if (q.includes('cost') || q.includes('estimate') || q.includes('budget')) {
      return 'The estimated cost is calculated live based on your total built-up area, material quality, and floor count. The cost per sq ft is shown in the Properties panel. You can change the currency between INR and USD in the status bar.';
    }
    if (q.includes('export') || q.includes('pdf') || q.includes('dxf')) {
      return 'To export your floor plan: Click the Export button in the header toolbar. The floor plan can be exported to DXF, DWG, or PDF formats for printing or sharing with contractors.';
    }
    if (q.includes('3d') || q.includes('three') || q.includes('model')) {
      return 'To generate a 3D model: Click the "3D Model" button in the header. The AI will read your floor plan and generate a 3D visualization with walls, doors, windows, roof, and materials applied. You can orbit, rotate, and explore the model in the 3D viewer.';
    }
    if (q.includes('layer')) {
      return 'Layer visibility: Click the Layers tab in the right sidebar to control which elements are visible. You can toggle walls, doors, furniture, dimensions, and text layers on or off.';
    }
    if (q.includes('select') || q.includes('pointer')) {
      return 'The Pointer tool (V) is the primary selection tool. Click on any room to select it, then drag to move, use handles to resize, or use the floating toolbar for rotate/duplicate/delete. Press V to activate it quickly.';
    }
    if (q.includes('help') || q.includes('what can') || q.includes('how do')) {
      return 'I can help with: adding/removing/moving rooms, placing doors and windows on walls, using the wall tool, resizing and rotating elements, adding furniture, managing layers, generating 3D models, cost estimates, and exporting. Just ask about any specific task!';
    }
    if (q.includes('hello') || q.includes('hi ') || q.includes('hey')) {
      return 'Hello! I am your BuildWise AI Assistant. I can help you with floor plan editing, room placement, door and window positioning, wall editing, 3D generation, and more. What would you like to do?';
    }

    return `I understand you're asking about: "${question}". I can help with room management (add, move, resize, delete, rotate), door and window placement on walls, wall editing, furniture placement, layer visibility, 3D model generation, cost estimation, and exporting. Could you be more specific about what you'd like to do?`;
  };

  const handleChatSend = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    const newMsgs = [...chatMessages, { sender: 'user', text: userMsg }];
    setChatMessages(newMsgs);
    setChatInput('');
    setTimeout(() => {
      const response = generateAIResponse(userMsg);
      setChatMessages([...newMsgs, { sender: 'ai', text: response }]);
    }, 600);
  };

  const toggleLayer = (layerKey) => {
    setLayerVisibility({ ...layerVisibility, [layerKey]: !layerVisibility[layerKey] });
  };

  return (
    <aside className="sidebar-right-inspector">
      <div className="inspector-tabs-header">
        <button 
          className={`inspector-tab-btn ${activeTab === 'properties' ? 'active' : ''}`}
          onClick={() => setActiveTab('properties')}
        >
          PROPERTIES
        </button>
        <button 
          className={`inspector-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          ✨ AI ASSISTANT
        </button>
        <button 
          className={`inspector-tab-btn ${activeTab === 'layers' ? 'active' : ''}`}
          onClick={() => setActiveTab('layers')}
        >
          LAYERS
        </button>
      </div>

      {activeTab === 'properties' && (
        <div className="inspector-content-panel">
          {selectedWallId ? (
            <div className="panel-card" style={{ borderColor: 'var(--border-gold)' }}>
              <div className="panel-card-title">
                <span><SquareDashedBottom size={14} style={{ color: 'var(--gold-primary)', marginRight: '4px' }} /> Selected Wall</span>
              </div>
              <div className="prop-field">
                <label className="prop-label">Wall ID</label>
                <div className="prop-area-display" style={{ fontSize: '0.72rem' }}>{selectedWallId}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                <button onClick={onDeleteWall} className="prop-remove-btn" style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }}>
                  <Trash2 size={12} style={{ marginRight: '4px' }} /> Delete Wall
                </button>
              </div>
              <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.5rem', lineHeight: '1.4' }}>
                Press Delete key or click the button above to remove this wall.
              </p>
            </div>
          ) : selectedObject ? (
            <div className="panel-card" style={{ borderColor: 'var(--border-gold)' }}>
              {/* Object header */}
              <div className="panel-card-title">
                <span><Sliders size={14} style={{ color: 'var(--gold-primary)', marginRight: '4px' }} /> {selectedObject.name}</span>
              </div>

              {/* Room Name */}
              <div className="prop-field">
                <label className="prop-label">Room Name</label>
                <input 
                  type="text" 
                  value={selectedObject.name} 
                  onChange={(e) => onUpdateSelectedObject({ name: e.target.value })}
                  className="prop-input"
                />
              </div>

              {/* Room Type */}
              <div className="prop-field">
                <label className="prop-label">Room Type</label>
                <select 
                  value={selectedObject.type || 'bedroom'} 
                  onChange={(e) => onUpdateSelectedObject({ type: e.target.value })}
                  className="prop-input"
                >
                  <option value="bedroom">Bedroom</option>
                  <option value="bathroom">Bathroom</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="living">Living & Dining</option>
                  <option value="study">Study / Gym</option>
                  <option value="foyer">Foyer</option>
                  <option value="parking">Garage / Parking</option>
                  <option value="balcony">Balcony</option>
                  <option value="terrace">Terrace Deck</option>
                  <option value="garden">Rooftop Garden</option>
                  <option value="utility">Utility / Solar</option>
                  <option value="staircase">Staircase</option>
                </select>
              </div>

              {/* Dimensions grid: Width, Length, Area */}
              <div className="prop-dim-grid">
                <div className="prop-field">
                  <label className="prop-label">Width (ft)</label>
                  <input 
                    type="number" 
                    value={Math.round(selectedObject.width / 10)} 
                    onChange={(e) => {
                      const newW = Number(e.target.value) * 10;
                      onUpdateSelectedObject({ width: newW });
                    }}
                    className="prop-input"
                  />
                </div>
                <div className="prop-field">
                  <label className="prop-label">Length (ft)</label>
                  <input 
                    type="number" 
                    value={Math.round(selectedObject.height / 10)} 
                    onChange={(e) => {
                      const newH = Number(e.target.value) * 10;
                      onUpdateSelectedObject({ height: newH });
                    }}
                    className="prop-input"
                  />
                </div>
              </div>

              {/* Area (read-only) */}
              <div className="prop-field prop-field-area">
                <label className="prop-label">Area</label>
                <div className="prop-area-display">
                  {selectedObject.areaSqFt} sq ft
                </div>
              </div>

              {/* Rotate button (replaces number input) */}
              <button 
                onClick={onRotateSelected}
                className="prop-rotate-btn"
              >
                <RotateCw size={14} />
                Rotate 90°
              </button>

              {/* Staircase Type (only for staircase rooms) */}
              {selectedObject.type === 'staircase' && (
                <div className="prop-field">
                  <label className="prop-label">Staircase Type</label>
                  <select 
                    value={selectedObject.stairType || 'dog-legged'} 
                    onChange={(e) => onUpdateSelectedObject({ stairType: e.target.value })}
                    className="prop-input"
                  >
                    <option value="straight">Straight Run</option>
                    <option value="L-shaped">L-Shaped</option>
                    <option value="U-shaped">U-Shaped</option>
                    <option value="spiral">Spiral</option>
                    <option value="dog-legged">Dog-Legged</option>
                  </select>
                </div>
              )}

              {/* Collapsible: Floor Material */}
              <CollapsibleSection title="Floor Material">
                <select 
                  value={selectedObject.flooring || 'Hardwood'} 
                  onChange={(e) => onUpdateSelectedObject({ flooring: e.target.value })}
                  className="prop-input"
                >
                  <option value="Italian Marble">Italian Botticino Marble</option>
                  <option value="Hardwood">Engineered Hardwood Bamboo</option>
                  <option value="Vitrified Tile">Vitrified Ceramic Tile</option>
                  <option value="Epoxy Concrete">Epoxy Coated Concrete</option>
                </select>
              </CollapsibleSection>

              {/* Collapsible: Wall Finish */}
              <CollapsibleSection title="Wall Finish">
                <select 
                  value={selectedObject.wallFinish || 'Plaster'} 
                  onChange={(e) => onUpdateSelectedObject({ wallFinish: e.target.value })}
                  className="prop-input"
                >
                  <option value="Plaster">White Plaster</option>
                  <option value="Painted">Painted Matte Finish</option>
                  <option value="Ceramic Tile">Ceramic Wall Tile</option>
                  <option value="Wood Panel">Wood Panel Cladding</option>
                  <option value="Stone Veneer">Natural Stone Veneer</option>
                  <option value="Concrete">Exposed Concrete</option>
                </select>
              </CollapsibleSection>

              {/* Collapsible: Doors */}
              {selectedObject.doors && (
                <CollapsibleSection title={`Doors (${selectedObject.doors.length})`}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.4rem' }}>
                    <button 
                      onClick={() => {
                        const newDoor = { id: `door_${Date.now()}`, wall: 'bottom', offset: Math.round(selectedObject.width / 2), size: 30, type: 'door' };
                        onUpdateSelectedObject({ doors: [...(selectedObject.doors || []), newDoor] });
                      }}
                      className="prop-add-btn"
                    >
                      + Add Door
                    </button>
                  </div>
                  {selectedObject.doors.map((door) => (
                    <div key={door.id} className="prop-list-item">
                      <select 
                        value={door.wall} 
                        onChange={(e) => {
                          const updated = selectedObject.doors.map(d => d.id === door.id ? { ...d, wall: e.target.value } : d);
                          onUpdateSelectedObject({ doors: updated });
                        }}
                        className="prop-input-sm"
                      >
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                      </select>
                      <input 
                        type="number"
                        placeholder="Offset"
                        value={door.offset} 
                        onChange={(e) => {
                          const updated = selectedObject.doors.map(d => d.id === door.id ? { ...d, offset: Number(e.target.value) } : d);
                          onUpdateSelectedObject({ doors: updated });
                        }}
                        className="prop-input-xs"
                      />
                      <button 
                        onClick={() => {
                          const updated = selectedObject.doors.filter(d => d.id !== door.id);
                          onUpdateSelectedObject({ doors: updated });
                        }}
                        className="prop-remove-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </CollapsibleSection>
              )}

              {/* Collapsible: Windows */}
              {selectedObject.windows && (
                <CollapsibleSection title={`Windows (${selectedObject.windows.length})`}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.4rem' }}>
                    <button 
                      onClick={() => {
                        const newWindow = { id: `win_${Date.now()}`, wall: 'top', offset: Math.round(selectedObject.width / 2), size: 40, type: 'window' };
                        onUpdateSelectedObject({ windows: [...(selectedObject.windows || []), newWindow] });
                      }}
                      className="prop-add-btn"
                    >
                      + Add Window
                    </button>
                  </div>
                  {selectedObject.windows.map((win) => (
                    <div key={win.id} className="prop-list-item">
                      <select 
                        value={win.wall} 
                        onChange={(e) => {
                          const updated = selectedObject.windows.map(w => w.id === win.id ? { ...w, wall: e.target.value } : w);
                          onUpdateSelectedObject({ windows: updated });
                        }}
                        className="prop-input-sm"
                      >
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                      </select>
                      <input 
                        type="number"
                        placeholder="Offset"
                        value={win.offset} 
                        onChange={(e) => {
                          const updated = selectedObject.windows.map(w => w.id === win.id ? { ...w, offset: Number(e.target.value) } : w);
                          onUpdateSelectedObject({ windows: updated });
                        }}
                        className="prop-input-xs"
                      />
                      <button 
                        onClick={() => {
                          const updated = selectedObject.windows.filter(w => w.id !== win.id);
                          onUpdateSelectedObject({ windows: updated });
                        }}
                        className="prop-remove-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </CollapsibleSection>
              )}
            </div>
          ) : (
            <>
              <div className="panel-card">
                <div className="panel-card-title">Project Summary</div>
                <div className="summary-grid-2col">
                  <div>
                    <span className="summary-item-sub">Plot Area</span>
                    <div className="summary-item-val">{plotArea.toLocaleString()} sq ft</div>
                  </div>
                  <div>
                    <span className="summary-item-sub">Built-up Area</span>
                    <div className="summary-item-val">{builtArea.toLocaleString()} sq ft</div>
                  </div>
                  <div>
                    <span className="summary-item-sub">Remaining Area</span>
                    <div className="summary-item-val" style={{ color: 'var(--emerald-accent)' }}>{remainingArea.toLocaleString()} sq ft</div>
                  </div>
                  <div>
                    <span className="summary-item-sub">Floors</span>
                    <div className="summary-item-val">{numFloors || 2}</div>
                  </div>
                </div>
              </div>

              <div className="panel-card">
                <div className="panel-card-title">
                  <span>Estimated Cost</span>
                  <span style={{ color: 'var(--emerald-accent)', fontSize: '0.7rem' }}>● Live</span>
                </div>
                <div className="live-price-text">
                  {currSymbol} {totalCost.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Cost / sq ft: <strong style={{ color: '#ffffff' }}>{currSymbol} {displayCostPerSqFt.toLocaleString()}</strong>
                </div>
              </div>

              <div className="panel-card">
                <div className="panel-card-title">Sustainability Score</div>
                <div className="sustainability-gauge-row">
                  <div className="score-radial-circle" style={{ borderColor: sustainabilityMetrics?.badgeColor || '#34d399' }}>
                    <div className="score-inner-val">{sustainabilityMetrics?.overallScore || 82}<span style={{ fontSize: '0.55rem' }}>/100</span></div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.72rem' }}>
                    <div style={{ color: sustainabilityMetrics?.badgeColor || '#ffffff', fontWeight: 600 }}>{sustainabilityMetrics?.ratingLabel || 'Good Environmental Rating'}</div>
                    <div style={{ color: '#94a3b8' }}>Daylight: {sustainabilityMetrics?.daylightScore || 86}/100 • Ventilation: {sustainabilityMetrics?.ventilationScore || 80}/100</div>
                    <div style={{ color: 'var(--emerald-accent)' }}>Water Saving: {sustainabilityMetrics?.waterScore || 75}/100 • Energy: {sustainabilityMetrics?.energyScore || 90}/100</div>
                  </div>
                </div>
              </div>

              <div className="panel-card">
                <div className="panel-card-title">
                  <span>Material Recommendation</span>
                </div>
                <div className="summary-grid-2col" style={{ fontSize: '0.72rem' }}>
                  <div><span className="summary-item-sub">Bricks:</span> <strong style={{ color: '#fff' }}>{materialStats.bricks}</strong></div>
                  <div><span className="summary-item-sub">Cement:</span> <strong style={{ color: '#fff' }}>{materialStats.cement}</strong></div>
                  <div><span className="summary-item-sub">Steel:</span> <strong style={{ color: '#fff' }}>{materialStats.steel}</strong></div>
                  <div><span className="summary-item-sub">Sand:</span> <strong style={{ color: '#fff' }}>{materialStats.sand}</strong></div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="inspector-content-panel">
          <div className="panel-card" style={{ background: 'rgba(212, 175, 55, 0.04)', borderColor: 'var(--border-gold)' }}>
            <div className="panel-card-title">
              <span style={{ color: 'var(--gold-light)' }}><Sparkles size={14} style={{ marginRight: '4px' }} /> AI Recommendations</span>
              <RefreshCw size={12} style={{ color: '#94a3b8', cursor: 'pointer' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.3rem' }}>
              <div className="ai-rec-card" style={{ borderColor: 'rgba(52, 211, 153, 0.3)' }}>
                <div className="ai-rec-header" style={{ color: 'var(--emerald-accent)' }}>
                  <span><CheckCircle2 size={13} style={{ display: 'inline', marginRight: '3px' }} /> Good</span>
                </div>
                Living room has adequate natural lighting and east solar orientation.
              </div>
              <div className="ai-rec-card" style={{ borderColor: 'rgba(251, 191, 36, 0.3)' }}>
                <div className="ai-rec-header" style={{ color: 'var(--amber-accent)' }}>
                  <span><AlertTriangle size={13} style={{ display: 'inline', marginRight: '3px' }} /> Suggestion</span>
                  <button className="ai-action-btn">Optimize</button>
                </div>
                Kitchen is a bit far from dining area. Moving it 2m right improves workflow.
              </div>
              <div className="ai-rec-card" style={{ borderColor: 'rgba(248, 113, 113, 0.3)' }}>
                <div className="ai-rec-header" style={{ color: 'var(--rose-accent)' }}>
                  <span><AlertTriangle size={13} style={{ display: 'inline', marginRight: '3px' }} /> Caution</span>
                  <button className="ai-action-btn">Fix</button>
                </div>
                Staircase width should be at least 1.2m for local residential compliance.
              </div>
            </div>
          </div>

          <div className="panel-card" style={{ marginTop: 'auto' }}>
            <div className="panel-card-title">Ask BuildWise AI</div>
            <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.72rem' }}>
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  style={{
                    background: msg.sender === 'user' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.05)',
                    padding: '0.4rem 0.55rem', borderRadius: '6px',
                    color: msg.sender === 'user' ? 'var(--emerald-accent)' : '#e2e8f0',
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  {msg.text}
                </div>
              ))}
            </div>
            <form onSubmit={handleChatSend} style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem' }}>
              <input 
                type="text" 
                placeholder="Ask anything about your design..." 
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)}
                style={{
                  flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-forest)',
                  borderRadius: '4px', padding: '0.35rem 0.5rem', color: '#fff', fontSize: '0.75rem', outline: 'none'
                }}
              />
              <button 
                type="submit" 
                style={{
                  background: 'var(--gold-gradient)', border: 'none', color: '#04100b',
                  borderRadius: '4px', padding: '0.35rem 0.6rem', cursor: 'pointer'
                }}
              >
                <Send size={13} />
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'layers' && (
        <div className="inspector-content-panel">
          <div className="panel-card">
            <div className="panel-card-title">
              <span><Layers size={14} style={{ marginRight: '4px' }} /> Layer Visibility</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
              {Object.keys(layerVisibility).map(key => (
                <div 
                  key={key} 
                  onClick={() => toggleLayer(key)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px',
                    fontSize: '0.78rem', cursor: 'pointer'
                  }}
                >
                  <span style={{ textTransform: 'capitalize' }}>{key}</span>
                  {layerVisibility[key] ? <Eye size={14} style={{ color: 'var(--emerald-accent)' }} /> : <EyeOff size={14} style={{ color: '#64748b' }} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
