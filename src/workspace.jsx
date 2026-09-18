import React, { Component, useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import Header from './components/Header.jsx';
import LeftSidebar from './components/LeftSidebar.jsx';
import FloorPlanCanvas from './components/FloorPlanCanvas.jsx';
import RightSidebar from './components/RightSidebar.jsx';
import StatusBar from './components/StatusBar.jsx';
import ReportModal from './components/ReportModal.jsx';
import ThreeDViewer from './components/ThreeDViewer.jsx';
import { generateLayout } from './layout-generator.js';
import { calculateDynamicCost, calculateDynamicSustainability, calculateDynamicMaterials } from './metrics-calculator.js';
import { getFloorConfig } from './floor-config.js';

function getCreatedProject() {
  try { return JSON.parse(localStorage.getItem('buildwise_project_data') || 'null'); }
  catch { return null; }
}

// Generate layout from wizard configuration
function generateInitialLayout(project) {
  if (!project) return null;
  try {
    return generateLayout({
      buildingCategory: project.buildingCategory || 'Residential',
      buildingType: project.buildingType || 'Single-Family Villa',
      commercialType: project.commercialType || 'Office Building',
      plotLength: project.plotLength || 75,
      plotWidth: project.plotWidth || 60,
      floors: project.floors || '2',
      basementOption: project.basement || 'none',
      parkingOption: project.parking || 'garage-2',
      staircase: project.staircase || 'dog-legged',
      rooms: project.rooms || {},
      amenities: project.amenities || { balcony: true, garden: true, elevator: true },
      budget: project.budget || 5000000,
      sustainability: project.sustainability || {},
      materialQuality: project.materialQuality || 'Premium Designer',
    });
  } catch (e) {
    console.warn('Layout generation failed, using defaults:', e);
    return null;
  }
}



class WorkspaceErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { 
    console.error('BuildWise workspace render failed detailed diagnostic:', error, info); 
  }
  render() {
    if (this.state.error) {
      return (
        <main className="workspace-recovery" role="alert" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#04100b', color: '#fff', fontFamily: 'sans-serif' }}>
          <div className="workspace-recovery-card" style={{ background: '#0c2218', border: '1px solid var(--gold-border)', borderRadius: '12px', padding: '2rem', maxWidth: '600px', width: '90%', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <p className="workspace-recovery-kicker" style={{ color: 'var(--gold-light)', fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 0.5rem 0' }}>BUILDWISE AI DIAGNOSTICS</p>
            <h1 style={{ fontSize: '1.5rem', color: '#fff', margin: '0 0 1rem 0' }}>Canvas Rendering Error Caught</h1>
            <p style={{ fontSize: '0.9rem', color: '#9db3a7', lineHeight: '1.5', margin: '0 0 1rem 0' }}>
              The workspace canvas failed to load due to a runtime error. Details have been logged to the browser console.
            </p>
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '6px', margin: '0 0 1.5rem 0', overflowX: 'auto' }}>
              <code style={{ fontSize: '0.8rem', color: '#f87171', whiteSpace: 'pre-wrap' }}>
                {this.state.error ? this.state.error.toString() : 'Unknown Error'}<br/>
                {this.state.error && this.state.error.stack ? this.state.error.stack : ''}
              </code>
            </div>
            <div className="workspace-recovery-actions" style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" onClick={() => window.location.reload()} style={{ background: 'var(--gold-gradient)', border: 'none', color: '#04100b', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                Retry Workspace
              </button>
              <button type="button" className="secondary" onClick={() => window.location.assign(new URL('./wizard.html', window.location.href))} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9db3a7', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
                Return to Wizard
              </button>
            </div>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}


export function BuildWiseWorkspaceApp() {
  const [createdProject] = useState(getCreatedProject);
  const [projectName, setProjectName] = useState(() => createdProject?.name || 'Modern Villa');
  const [activeFloor, setActiveFloor] = useState('ground');
  const [activeTool, setActiveTool] = useState('pointer');
  const [gridVisible, setGridVisible] = useState(true);
  const [gridSnap, setGridSnap] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currency, setCurrency] = useState(() => createdProject?.currency || 'INR');
  const [mouseCoords, setMouseCoords] = useState("X: 23'-6\" | Y: 18'-9\"");

  // Building type data from wizard
  const buildingCategory = createdProject?.buildingCategory || 'Residential';
  const buildingType = createdProject?.buildingType || 'Single-Family Villa';
  const commercialType = createdProject?.commercialType || 'Office Building';

  // 3D Rendering states
  const [show3DViewer, setShow3DViewer] = useState(false);
  const [isGenerating3D, setIsGenerating3D] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Room locking state
  const [lockedRoomIds, setLockedRoomIds] = useState(new Set());

  // Standalone walls (independent of rooms)
  const [walls, setWalls] = useState([]);
  const [selectedWallId, setSelectedWallId] = useState(null);
  const [wallDrawStart, setWallDrawStart] = useState(null);
  const [wallDrawEnd, setWallDrawEnd] = useState(null);
  const [draggingWall, setDraggingWall] = useState(null);

  // Door/Window placement state
  const [placementMode, setPlacementMode] = useState(null); // 'door' or 'window'
  const [placementPreview, setPlacementPreview] = useState(null);
  const [draggingPlacement, setDraggingPlacement] = useState(null);

  // Door/Window selection and drag state
  const [selectedDoorWindow, setSelectedDoorWindow] = useState(null); // { roomId, type: 'door'|'window', itemId }
  const [draggingDoorWindow, setDraggingDoorWindow] = useState(null); // { roomId, type, itemId, wallName, initialOffset, startClientX, startClientY }

  // Clipboard state
  const [clipboard, setClipboard] = useState(null); // { type, data } where type is 'room'|'furniture'|'wall'|'door'|'window'


  // Dynamic floor config derived from wizard input (Phase 2)
  const floorConfig = useMemo(() => {
    return getFloorConfig(
      createdProject?.floors || '2',
      createdProject?.basement || createdProject?.basementOption
    );
  }, [createdProject]);

  const floorsList = floorConfig.floorsList;
  const numFloors = floorConfig.numFloors;

  // Generate layout from wizard config on mount
  const generatedLayout = useMemo(() => {
    const generated = generateInitialLayout(createdProject);
    if (generated && Object.keys(generated).length > 0) {
      return generated;
    }
    const emptyStore = {};
    floorsList.forEach(f => { emptyStore[f.id] = []; });
    return emptyStore;
  }, [createdProject, floorsList]);

  // Multi-floor isolated collections of rooms — generated from wizard config
  const [floorRooms, setFloorRooms] = useState(generatedLayout);

  // Current active floor's rooms list — seeded from generated layout
  const initialFloorId = floorsList.find(f => f.id === 'ground')?.id || floorsList[0]?.id || 'ground';
  const [rooms, setRooms] = useState(generatedLayout[initialFloorId] || []);
  
  // Sync the active floor's rooms when floorRooms changes or activeFloor changes
  useEffect(() => {
    setRooms(floorRooms[activeFloor] || []);
  }, [activeFloor]);

  // Sync state changes back to floorRooms
  const updateRoomsState = (newRooms) => {
    setRooms(newRooms);
    setFloorRooms(prev => ({
      ...prev,
      [activeFloor]: newRooms
    }));
  };

  const handleFloorChange = (newFloor) => {
    // 1. Commit active rooms state to current floor data store
    setFloorRooms(prev => {
      const nextStore = { ...prev, [activeFloor]: rooms };
      saveHistory(nextStore);
      return nextStore;
    });
    setActiveFloor(newFloor);
  };

  const [selectedObjectId, setSelectedObjectId] = useState(() => generatedLayout.ground?.[0]?.id || '');
  const [selectedObjectType, setSelectedObjectType] = useState('room');
  
  const [draggingRoom, setDraggingRoom] = useState(null);
  const [activeResizeHandle, setActiveResizeHandle] = useState(null);
  const [rotatingRoom, setRotatingRoom] = useState(null);
  
  const [history, setHistory] = useState(() => {
    return [{ floorRooms: generatedLayout }];
  });
  const [historyIdx, setHistoryIdx] = useState(0);

  // Modals state
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Selected Item Inspector (Supports Room or Furniture)
  const selectedObject = selectedObjectType === 'room' 
    ? rooms.find(r => r.id === selectedObjectId) 
    : (selectedObjectType === 'furniture' 
        ? rooms.flatMap(r => r.furniture || []).find(f => f.id === selectedObjectId) 
        : null
      );

  // Real-Time Calculations
  const plotArea = Number(createdProject?.plotArea) || 3000;
  
  // Calculated built area across the current active floor
  const activeBuiltArea = rooms.reduce((acc, r) => acc + (r.areaSqFt || 0), 0);
  
  // Calculated built area across ALL isolated floors
  const totalBuiltArea = Object.values(floorRooms).reduce(
    (sum, roomsList) => sum + roomsList.reduce((fSum, r) => fSum + (r.areaSqFt || 0), 0),
    0
  );

  const remainingArea = Math.max(0, plotArea - activeBuiltArea);

  const dynamicCostMetrics = calculateDynamicCost({
    totalBuiltArea,
    currency,
    materialQuality: createdProject?.materialQuality || 'Premium Designer',
    buildingCategory,
    buildingType,
    floors: createdProject?.floors || '2',
    sustainability: createdProject?.sustainability || 'LEED Gold Standard (Recommended)',
    energyEfficiency: createdProject?.energyEfficiency || 'Solar Photovoltaic + Smart HVAC Zoning',
    basement: createdProject?.basement || 'None',
    amenities: createdProject?.amenities || { balcony: true, garden: true, elevator: true },
    budget: createdProject?.budget || 0,
  });

  const costPerSqFt = dynamicCostMetrics.costPerSqFt;
  const totalCost = dynamicCostMetrics.totalCost;

  const sustainabilityMetrics = calculateDynamicSustainability({
    plotLength: createdProject?.plotLength || 75,
    plotWidth: createdProject?.plotWidth || 60,
    plotArea,
    totalBuiltArea,
    activeBuiltArea,
    buildingCategory,
    buildingType,
    orientation: createdProject?.roadDirection || 'East',
    materialQuality: createdProject?.materialQuality || 'Premium Designer',
    sustainability: createdProject?.sustainability || 'LEED Gold Standard (Recommended)',
    energyEfficiency: createdProject?.energyEfficiency || 'Solar Photovoltaic + Smart HVAC Zoning',
    amenities: createdProject?.amenities || { balcony: true, garden: true, elevator: true },
    rooms,
  });

  const materialStats = calculateDynamicMaterials(
    totalBuiltArea,
    createdProject?.materialQuality || 'Premium Designer'
  );

  const clampToGrid = (val) => Math.round(val / 10) * 10;

  // Helper to maintain history stack
  const saveHistory = (nextFloorRooms) => {
    const nextHist = history.slice(0, historyIdx + 1);
    setHistory([...nextHist, { floorRooms: nextFloorRooms }]);
    setHistoryIdx(nextHist.length);
  };

  // Independent Room Dragging
  const startRoomDrag = (room, clientX, clientY) => {
    if (activeTool !== 'pointer') return;
    const svgElement = document.getElementById('blueprint-canvas');
    if (!svgElement) return;
    const rect = svgElement.getBoundingClientRect();
    const scale = zoomLevel / 100;
    
    setDraggingRoom({
      id: room.id,
      startX: clientX - rect.left,
      startY: clientY - rect.top,
      initialX: room.x,
      initialY: room.y
    });
  };

  const handleRoomDrag = (clientX, clientY) => {
    if (!draggingRoom) return;
    const svgElement = document.getElementById('blueprint-canvas');
    if (!svgElement) return;
    const rect = svgElement.getBoundingClientRect();
    const scale = zoomLevel / 100;
    
    let dx = ((clientX - rect.left) - draggingRoom.startX) / scale;
    let dy = ((clientY - rect.top) - draggingRoom.startY) / scale;
    
    let newX = draggingRoom.initialX + dx;
    let newY = draggingRoom.initialY + dy;
    
    if (gridSnap) {
      newX = clampToGrid(newX);
      newY = clampToGrid(newY);
    }
    
    // Bounds constraints matching site boundaries (40px - 640px horizontal, 30px - 520px vertical)
    const room = rooms.find(r => r.id === draggingRoom.id);
    if (!room) return;
    
    newX = Math.max(40, Math.min(640 - room.width, newX));
    newY = Math.max(30, Math.min(520 - room.height, newY));
    
    const updatedRooms = rooms.map(r => r.id === draggingRoom.id ? { ...r, x: newX, y: newY } : r);
    updateRoomsState(updatedRooms);
  };

  // 8-Point Bounding Box Resize
  const startRoomResize = (handle, room, clientX, clientY) => {
    if (activeTool !== 'pointer') return;
    setActiveResizeHandle({
      handle,
      roomId: room.id,
      startClientX: clientX,
      startClientY: clientY,
      initialWidth: room.width,
      initialHeight: room.height,
      initialX: room.x,
      initialY: room.y
    });
  };

  const handleRoomResize = (clientX, clientY) => {
    if (!activeResizeHandle) return;
    const scale = zoomLevel / 100;
    const handle = activeResizeHandle;
    const room = rooms.find(r => r.id === handle.roomId);
    if (!room) return;

    let dx = (clientX - handle.startClientX) / scale;
    let dy = (clientY - handle.startClientY) / scale;

    // Project mouse vector to the room's local axes to handle rotated resizing correctly
    const rad = -(room.rotation || 0) * Math.PI / 180;
    let localDx = dx * Math.cos(rad) - dy * Math.sin(rad);
    let localDy = dx * Math.sin(rad) + dy * Math.cos(rad);

    let newWidth = handle.initialWidth;
    let newHeight = handle.initialHeight;
    let newX = handle.initialX;
    let newY = handle.initialY;

    switch (handle.handle) {
      case 'mr':
        newWidth = handle.initialWidth + localDx;
        break;
      case 'ml':
        newWidth = handle.initialWidth - localDx;
        break;
      case 'bc':
        newHeight = handle.initialHeight + localDy;
        break;
      case 'tc':
        newHeight = handle.initialHeight - localDy;
        break;
      case 'br':
        newWidth = handle.initialWidth + localDx;
        newHeight = handle.initialHeight + localDy;
        break;
      case 'tl':
        newWidth = handle.initialWidth - localDx;
        newHeight = handle.initialHeight - localDy;
        break;
      case 'tr':
        newWidth = handle.initialWidth + localDx;
        newHeight = handle.initialHeight - localDy;
        break;
      case 'bl':
        newWidth = handle.initialWidth - localDx;
        newHeight = handle.initialHeight + localDy;
        break;
    }

    if (gridSnap) {
      newWidth = clampToGrid(newWidth);
      newHeight = clampToGrid(newHeight);
    }

    newWidth = Math.max(50, Math.min(450, newWidth));
    newHeight = Math.max(50, Math.min(450, newHeight));

    // Corner offset adjustments during resize
    const theta = (room.rotation || 0) * Math.PI / 180;
    if (handle.handle === 'ml' || handle.handle === 'tl' || handle.handle === 'bl') {
      const deltaW = newWidth - handle.initialWidth;
      newX = handle.initialX - deltaW * Math.cos(theta);
      newY = handle.initialY - deltaW * Math.sin(theta);
    }
    if (handle.handle === 'tc' || handle.handle === 'tl' || handle.handle === 'tr') {
      const deltaH = newHeight - handle.initialHeight;
      newX = newX + deltaH * Math.sin(theta);
      newY = newY - deltaH * Math.cos(theta);
    }

    // Keep within reasonable drawing canvas limits
    newX = Math.max(40, Math.min(600, newX));
    newY = Math.max(30, Math.min(480, newY));

    const updatedRooms = rooms.map(r => 
      r.id === room.id 
        ? { ...r, x: newX, y: newY, width: newWidth, height: newHeight, areaSqFt: Math.round((newWidth/10)*(newHeight/10)) } 
        : r
    );
    updateRoomsState(updatedRooms);
  };

  // Rotation Handle Mouse Event Listeners
  const startRoomRotate = (room, clientX, clientY) => {
    if (activeTool !== 'pointer') return;
    // Calculate current room center in SVG coordinate space
    const cx = room.x + room.width / 2;
    const cy = room.y + room.height / 2;
    setRotatingRoom({
      id: room.id,
      centerX: cx,
      centerY: cy,
      initialRotation: room.rotation || 0
    });
  };

  const handleRoomRotate = (clientX, clientY) => {
    if (!rotatingRoom) return;
    const svgElement = document.getElementById('blueprint-canvas');
    if (!svgElement) return;
    const rect = svgElement.getBoundingClientRect();
    const scale = zoomLevel / 100;

    const mx = (clientX - rect.left) / scale;
    const my = (clientY - rect.top) / scale;

    const dx = mx - rotatingRoom.centerX;
    const dy = my - rotatingRoom.centerY;

    // Angle of mouse drag relative to center of the room
    let angle = Math.atan2(dy, dx) * 180 / Math.PI;

    // The rotation control handle is at the top (i.e. -90 degrees)
    let newRotation = angle + 90;

    // Snap rotation to 15-degree steps for grid accuracy
    newRotation = Math.round(newRotation / 15) * 15;
    if (newRotation < 0) newRotation += 360;
    newRotation = newRotation % 360;

    const updated = rooms.map(r => r.id === rotatingRoom.id ? { ...r, rotation: newRotation } : r);
    updateRoomsState(updated);
  };

  // Update selected room/furniture properties in Inspector
  const handleUpdateSelectedObject = (updates) => {
    if (selectedObjectType === 'room') {
      const room = rooms.find(r => r.id === selectedObjectId);
      if (room) {
        const nextWidth = updates.width !== undefined ? updates.width : room.width;
        const nextHeight = updates.height !== undefined ? updates.height : room.height;
        const nextArea = Math.round((nextWidth / 10) * (nextHeight / 10));

        const updated = rooms.map(r => 
          r.id === selectedObjectId 
            ? { ...r, ...updates, areaSqFt: nextArea } 
            : r
        );
        updateRoomsState(updated);
      }
    } 
    else if (selectedObjectType === 'furniture') {
      const updatedRooms = rooms.map(r => {
        if (r.furniture) {
          const updatedFurniture = r.furniture.map(f => 
            f.id === selectedObjectId ? { ...f, ...updates } : f
          );
          return { ...r, furniture: updatedFurniture };
        }
        return r;
      });
      updateRoomsState(updatedRooms);
    }
  };

  const handleUpdateFurniture = (furnitureId, coords) => {
    const updatedRooms = rooms.map(r => {
      if (r.furniture) {
        const item = r.furniture.find(f => f.id === furnitureId);
        if (item) {
          const updatedFurniture = r.furniture.map(f => 
            f.id === furnitureId ? { ...f, ...coords } : f
          );
          return { ...r, furniture: updatedFurniture };
        }
      }
      return r;
    });
    updateRoomsState(updatedRooms);
  };

  // Delete Selected Element (room, furniture, wall, or door/window)
  const handleDeleteSelected = () => {
    if (selectedDoorWindow) {
      deleteDoorWindow();
      return;
    }
    if (selectedWallId) {
      deleteSelectedWall();
      return;
    }
    if (!selectedObjectId) return;
    if (selectedObjectType === 'room') {
      const updated = rooms.filter(r => r.id !== selectedObjectId);
      updateRoomsState(updated);
      setSelectedObjectId(null);
      setSelectedObjectType(null);
    } 
    else if (selectedObjectType === 'furniture') {
      const updatedRooms = rooms.map(r => {
        if (r.furniture) {
          return { ...r, furniture: r.furniture.filter(f => f.id !== selectedObjectId) };
        }
        return r;
      });
      updateRoomsState(updatedRooms);
      setSelectedObjectId(null);
      setSelectedObjectType(null);
    }
  };

  // Duplicate Selected Element
  const handleDuplicateSelected = () => {
    if (!selectedObject) return;
    if (selectedObjectType === 'room') {
      const newId = `room_${Date.now()}`;
      const copyRoom = {
        ...selectedObject,
        id: newId,
        name: `${selectedObject.name} (Copy)`,
        x: Math.min(480, selectedObject.x + 30),
        y: Math.min(380, selectedObject.y + 30),
        doors: (selectedObject.doors || []).map((d, i) => ({ ...d, id: `d_copy_${i}_${Date.now()}` })),
        windows: (selectedObject.windows || []).map((w, i) => ({ ...w, id: `w_copy_${i}_${Date.now()}` })),
        furniture: (selectedObject.furniture || []).map((f, i) => ({ ...f, id: `f_copy_${i}_${Date.now()}` }))
      };
      const updated = [...rooms, copyRoom];
      updateRoomsState(updated);
      setSelectedObjectId(newId);
    } 
    else if (selectedObjectType === 'furniture') {
      const newId = `furniture_${Date.now()}`;
      const copyFurniture = {
        ...selectedObject,
        id: newId,
        name: `${selectedObject.name} (Copy)`,
        x: selectedObject.x + 20,
        y: selectedObject.y + 20
      };
      
      const updatedRooms = rooms.map(r => {
        if (r.furniture && r.furniture.some(f => f.id === selectedObjectId)) {
          return { ...r, furniture: [...r.furniture, copyFurniture] };
        }
        return r;
      });
      updateRoomsState(updatedRooms);
      setSelectedObjectId(newId);
    }
  };

  // Rotate Selected Element (90 degrees button shortcut)
  const handleRotateSelected = () => {
    if (!selectedObject) return;
    const newRot = ((selectedObject.rotation || 0) + 90) % 360;
    handleUpdateSelectedObject({ rotation: newRot });
  };

  // Copy Selected Element
  const handleCopySelected = () => {
    if (selectedDoorWindow) {
      const room = rooms.find(r => r.id === selectedDoorWindow.roomId);
      if (!room) return;
      const items = selectedDoorWindow.type === 'door' ? (room.doors || []) : (room.windows || []);
      const item = items.find(i => i.id === selectedDoorWindow.itemId);
      if (item) setClipboard({ type: selectedDoorWindow.type, data: { ...item, id: undefined } });
      return;
    }
    if (selectedWallId) {
      const wall = walls.find(w => w.id === selectedWallId);
      if (wall) setClipboard({ type: 'wall', data: { ...wall, id: undefined } });
      return;
    }
    if (!selectedObject) return;
    if (selectedObjectType === 'room') {
      setClipboard({ type: 'room', data: { ...selectedObject, id: undefined } });
    } else if (selectedObjectType === 'furniture') {
      setClipboard({ type: 'furniture', data: { ...selectedObject, id: undefined } });
    }
  };

  // Cut Selected Element
  const handleCutSelected = () => {
    handleCopySelected();
    handleDeleteSelected();
  };

  // Paste
  const handlePaste = () => {
    if (!clipboard) return;
    const { type, data } = clipboard;

    if (type === 'room') {
      const newId = `room_${Date.now()}`;
      const newRoom = {
        ...data,
        id: newId,
        name: `${data.name} (Copy)`,
        x: (data.x || 0) + 30,
        y: (data.y || 0) + 30,
        doors: (data.doors || []).map((d, i) => ({ ...d, id: `d_paste_${i}_${Date.now()}` })),
        windows: (data.windows || []).map((w, i) => ({ ...w, id: `w_paste_${i}_${Date.now()}` })),
        furniture: (data.furniture || []).map((f, i) => ({ ...f, id: `f_paste_${i}_${Date.now()}` }))
      };
      updateRoomsState([...rooms, newRoom]);
      setSelectedObjectId(newId);
      setSelectedObjectType('room');
    } else if (type === 'furniture') {
      const newId = `furniture_${Date.now()}`;
      const newFurniture = { ...data, id: newId };
      const updatedRooms = rooms.map(r => {
        if (r.id === data.roomId) {
          return { ...r, furniture: [...(r.furniture || []), newFurniture] };
        }
        return r;
      });
      updateRoomsState(updatedRooms);
      setSelectedObjectId(newId);
      setSelectedObjectType('furniture');
    } else if (type === 'wall') {
      const newId = `wall_${Date.now()}`;
      const newWall = { ...data, id: newId, x1: data.x1 + 20, y1: data.y1 + 20, x2: data.x2 + 20, y2: data.y2 + 20 };
      setWalls(prev => [...prev, newWall]);
      setSelectedWallId(newId);
    } else if (type === 'door' || type === 'window') {
      if (!selectedObjectId || selectedObjectType !== 'room') return;
      const updatedRooms = rooms.map(r => {
        if (r.id === selectedObjectId) {
          const newItem = { ...data, id: `${type}_paste_${Date.now()}` };
          if (type === 'door') return { ...r, doors: [...(r.doors || []), newItem] };
          return { ...r, windows: [...(r.windows || []), newItem] };
        }
        return r;
      });
      updateRoomsState(updatedRooms);
    }
  };

  // Drop element from Left Sidebar
  const handleDropNewItem = (toolId, x, y) => {
    if (toolId === 'room') {
      const newId = `room_${Date.now()}`;
      const newRoom = {
        id: newId,
        name: 'New Room',
        type: 'bedroom',
        x: Math.max(90, Math.min(500, x)),
        y: Math.max(70, Math.min(400, y)),
        width: 120,
        height: 100,
        areaSqFt: 120,
        flooring: 'Italian Marble',
        wallFinish: 'Plaster',
        rotation: 0,
        doors: [{ id: `d_${newId}`, wall: 'bottom', offset: 60, size: 30 }],
        windows: [{ id: `w_${newId}`, wall: 'top', offset: 60, size: 40 }],
        furniture: []
      };
      const updated = [...rooms, newRoom];
      updateRoomsState(updated);
      setSelectedObjectId(newId);
      setSelectedObjectType('room');
    } else {
      // Find room container containing target coordinates
      const targetRoom = rooms.find(r => 
        x >= r.x && x <= r.x + r.width &&
        y >= r.y && y <= r.y + r.height
      );

      if (!targetRoom) return;

      const newId = `${toolId}_${Date.now()}`;
      const formattedName = toolId.charAt(0).toUpperCase() + toolId.slice(1);
      
      const symbolsMap = {
        sofa: '🛋️',
        bed: '🛏️',
        furniture: '🪑',
        door: '🚪',
        window: '🪟',
        plants: '🌿',
        garden: '🌿',
        electrical: '⚡',
        plumbing: '🚰',
        staircase: '🪜',
        text: '🔤',
        dimension: '📏',
        measurement: '🧭'
      };

      const newFurniture = {
        id: newId,
        name: formattedName,
        type: toolId,
        symbol: symbolsMap[toolId] || '🪑',
        x: x - targetRoom.x, // Store coordinates RELATIVE to target room's top-left corner
        y: y - targetRoom.y,
        rotation: 0
      };

      const updatedRooms = rooms.map(r => {
        if (r.id === targetRoom.id) {
          return { ...r, furniture: [...(r.furniture || []), newFurniture] };
        }
        return r;
      });

      updateRoomsState(updatedRooms);
      setSelectedObjectId(newId);
      setSelectedObjectType('furniture');
    }
  };

  // Start 3D generation with animated loading states
  const start3DGeneration = () => {
    setIsGenerating3D(true);
    setLoadingStep(0);
  };

  useEffect(() => {
    if (!isGenerating3D) return;
    const interval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev >= 7) {
          clearInterval(interval);
          setTimeout(() => {
            setIsGenerating3D(false);
            setShow3DViewer(true);
          }, 400);
          return 7;
        }
        return prev + 1;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [isGenerating3D]);

  // Keyboard Shortcuts (including wall/door/window tools)
  React.useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        if (placementMode) { cancelPlacement(); return; }
        if (wallDrawStart) { setWallDrawStart(null); setWallDrawEnd(null); return; }
        if (selectedDoorWindow) { clearDoorWindowSelection(); return; }
        setSelectedObjectId(null);
        setSelectedObjectType(null);
        setSelectedWallId(null);
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
        return;
      }

      switch(e.key.toLowerCase()) {
        case 'v': setActiveTool('pointer'); break;
        case 'w': setActiveTool('wall'); break;
        case 'd': startDoorWindowPlacement('door'); break;
        case 'r': setActiveTool('room'); break;
        case 'm': setActiveTool('dimension'); break;
        case 't': setActiveTool('text'); break;
        case 'h': setActiveTool('pan'); break;
        case 'n': startDoorWindowPlacement('window'); break;
      }

      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); handleUndo(); return; }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); handleRedo(); return; }
      if (e.ctrlKey && e.key === 'c') { e.preventDefault(); handleCopySelected(); return; }
      if (e.ctrlKey && e.key === 'x') { e.preventDefault(); handleCutSelected(); return; }
      if (e.ctrlKey && e.key === 'v') { e.preventDefault(); handlePaste(); return; }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [placementMode, wallDrawStart, selectedObjectId, selectedObjectType, selectedWallId, selectedDoorWindow, handleDeleteSelected, clipboard]);

  // Undo / Redo Actions
  const handleUndo = () => {
    if (historyIdx > 0) {
      const nextIdx = historyIdx - 1;
      setHistoryIdx(nextIdx);
      const histData = history[nextIdx].floorRooms;
      setFloorRooms(histData);
      setRooms(histData[activeFloor] || []);
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      const nextIdx = historyIdx + 1;
      setHistoryIdx(nextIdx);
      const histData = history[nextIdx].floorRooms;
      setFloorRooms(histData);
      setRooms(histData[activeFloor] || []);
    }
  };

  // Construct wall segments for canvas rendering out of room boundaries
  const computedWalls = rooms.flatMap(room => [
    { id: `${room.id}_w_top`, x1: room.x, y1: room.y, x2: room.x + room.width, y2: room.y, isExterior: true, thickness: 8, isRoomWall: true, roomId: room.id },
    { id: `${room.id}_w_bottom`, x1: room.x, y1: room.y + room.height, x2: room.x + room.width, y2: room.y + room.height, isExterior: true, thickness: 8, isRoomWall: true, roomId: room.id },
    { id: `${room.id}_w_left`, x1: room.x, y1: room.y, x2: room.x, y2: room.y + room.height, isExterior: true, thickness: 8, isRoomWall: true, roomId: room.id },
    { id: `${room.id}_w_right`, x1: room.x + room.width, y1: room.y, x2: room.x + room.width, y2: room.y + room.height, isExterior: true, thickness: 8, isRoomWall: true, roomId: room.id }
  ]);

  // All renderable walls = computed room walls + standalone walls
  const allWalls = [...computedWalls, ...walls];

  // Wall tool: start drawing a new wall
  const startWallDraw = (x, y) => {
    if (gridSnap) { x = clampToGrid(x); y = clampToGrid(y); }
    setWallDrawStart({ x, y });
    setWallDrawEnd({ x, y });
  };

  const updateWallDraw = (x, y) => {
    if (!wallDrawStart) return;
    if (gridSnap) { x = clampToGrid(x); y = clampToGrid(y); }
    setWallDrawEnd({ x, y });
  };

  const finishWallDraw = (x, y) => {
    if (!wallDrawStart) return;
    if (gridSnap) { x = clampToGrid(x); y = clampToGrid(y); }
    const dx = x - wallDrawStart.x;
    const dy = y - wallDrawStart.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length < 10) {
      setWallDrawStart(null);
      setWallDrawEnd(null);
      return;
    }
    const newWall = {
      id: `wall_${Date.now()}`,
      x1: wallDrawStart.x,
      y1: wallDrawStart.y,
      x2: x,
      y2: y,
      thickness: 8,
      isStandalone: true
    };
    setWalls(prev => [...prev, newWall]);
    setWallDrawStart(null);
    setWallDrawEnd(null);
  };

  const selectWall = (wallId) => {
    setSelectedWallId(wallId);
    setSelectedObjectId(null);
    setSelectedObjectType(null);
  };

  // Detect which room wall was clicked (for wall tool selection)
  const findClickedRoomWall = (x, y, threshold = 12) => {
    for (const room of rooms) {
      const walls = [
        { name: 'top', x1: room.x, y1: room.y, x2: room.x + room.width, y2: room.y },
        { name: 'bottom', x1: room.x, y1: room.y + room.height, x2: room.x + room.width, y2: room.y + room.height },
        { name: 'left', x1: room.x, y1: room.y, x2: room.x, y2: room.y + room.height },
        { name: 'right', x1: room.x + room.width, y1: room.y, x2: room.x + room.width, y2: room.y + room.height }
      ];
      for (const w of walls) {
        const dist = pointToSegmentDistance(x, y, w.x1, w.y1, w.x2, w.y2);
        if (dist < threshold) {
          return { roomId: room.id, wallName: w.name, room, wall: w };
        }
      }
    }
    return null;
  };

  const validateWallDeletion = (wallId) => {
    const wall = walls.find(w => w.id === wallId);
    if (!wall) return { valid: true, warning: null };

    const otherWalls = walls.filter(w => w.id !== wallId);
    if (otherWalls.length === 0) {
      return { valid: true, warning: 'This is the last wall. Deleting it will leave no walls in the plan.' };
    }

    return { valid: true, warning: null };
  };

  const deleteSelectedWall = () => {
    if (!selectedWallId) return;

    // Check if this is a room wall (format: roomId_w_wallName)
    const roomWallMatch = selectedWallId.match(/^(.+)_w_(.+)$/);
    if (roomWallMatch) {
      const [, roomId, wallName] = roomWallMatch;
      const updatedRooms = rooms.map(r => {
        if (r.id !== roomId) return r;
        const updatedDoors = (r.doors || []).filter(d => d.wall !== wallName);
        const updatedWindows = (r.windows || []).filter(w => w.wall !== wallName);
        const removedWalls = [...(r.removedWalls || [])];
        if (!removedWalls.includes(wallName)) removedWalls.push(wallName);
        return { ...r, doors: updatedDoors, windows: updatedWindows, removedWalls };
      });
      updateRoomsState(updatedRooms);
    } else {
      // Standalone wall
      setWalls(prev => prev.filter(w => w.id !== selectedWallId));
    }
    setSelectedWallId(null);
  };

  const startWallDrag = (wallId, clientX, clientY) => {
    if (activeTool !== 'wall') return;
    const wall = walls.find(w => w.id === wallId);
    if (!wall) return;
    const svgElement = document.getElementById('blueprint-canvas');
    if (!svgElement) return;
    const rect = svgElement.getBoundingClientRect();
    const scale = zoomLevel / 100;
    setDraggingWall({
      id: wallId,
      startClientX: clientX,
      startClientY: clientY,
      initialX1: wall.x1,
      initialY1: wall.y1,
      initialX2: wall.x2,
      initialY2: wall.y2
    });
  };

  const handleWallDrag = (clientX, clientY) => {
    if (!draggingWall) return;
    const scale = zoomLevel / 100;
    let dx = (clientX - draggingWall.startClientX) / scale;
    let dy = (clientY - draggingWall.startClientY) / scale;
    if (gridSnap) { dx = clampToGrid(dx); dy = clampToGrid(dy); }
    const newX1 = draggingWall.initialX1 + dx;
    const newY1 = draggingWall.initialY1 + dy;
    const newX2 = draggingWall.initialX2 + dx;
    const newY2 = draggingWall.initialY2 + dy;
    setWalls(prev => prev.map(w =>
      w.id === draggingWall.id ? { ...w, x1: newX1, y1: newY1, x2: newX2, y2: newY2 } : w
    ));
  };

  const finishWallDrag = () => {
    if (draggingWall) {
      setDraggingWall(null);
    }
  };

  // Door/Window placement on walls
  const findNearestWall = (x, y, threshold = 25) => {
    let closest = null;
    let closestDist = threshold;
    allWalls.forEach(wall => {
      const dist = pointToSegmentDistance(x, y, wall.x1, wall.y1, wall.x2, wall.y2);
      if (dist < closestDist) {
        closestDist = dist;
        closest = wall;
      }
    });
    return closest;
  };

  const pointToSegmentDistance = (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
  };

  const projectPointOnWall = (px, py, wall) => {
    const dx = wall.x2 - wall.x1;
    const dy = wall.y2 - wall.y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return { x: wall.x1, y: wall.y1, t: 0 };
    let t = ((px - wall.x1) * dx + (py - wall.y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return { x: wall.x1 + t * dx, y: wall.y1 + t * dy, t };
  };

  const startDoorWindowPlacement = (type) => {
    setPlacementMode(type);
    setPlacementPreview(null);
    setSelectedObjectId(null);
    setSelectedObjectType(null);
    setActiveTool(type);
  };

  const handlePlacementMouseMove = (x, y) => {
    if (!placementMode) return;
    const wall = findNearestWall(x, y);
    if (wall) {
      const proj = projectPointOnWall(x, y, wall);
      setPlacementPreview({ wall, x: proj.x, y: proj.y, t: proj.t });
    } else {
      setPlacementPreview(null);
    }
  };

  const confirmPlacement = (x, y) => {
    if (!placementMode) return;

    // If no placementPreview (clicked without moving), detect wall at click position
    let preview = placementPreview;
    if (!preview) {
      const wall = findNearestWall(x, y);
      if (wall) {
        const proj = projectPointOnWall(x, y, wall);
        preview = { wall, x: proj.x, y: proj.y, t: proj.t };
      }
    }
    if (!preview) return;

    const { wall, t } = preview;
    const size = placementMode === 'door' ? 30 : 40;

    if (wall.isRoomWall && wall.roomId) {
      const room = rooms.find(r => r.id === wall.roomId);
      if (!room) return;

      let wallName = 'bottom';
      if (Math.abs(wall.y1 - wall.y2) < 1) {
        wallName = Math.abs(wall.y1 - room.y) < 2 ? 'top' : 'bottom';
      } else {
        wallName = Math.abs(wall.x1 - room.x) < 2 ? 'left' : 'right';
      }

      let offset;
      if (wallName === 'top' || wallName === 'bottom') {
        offset = t * room.width;
      } else {
        offset = t * room.height;
      }
      offset = Math.round(offset);

      const item = { id: `${placementMode}_${Date.now()}`, wall: wallName, offset, size, type: placementMode };

      if (placementMode === 'door') {
        handleUpdateSelectedObject({ doors: [...(room.doors || []), item] });
      } else {
        handleUpdateSelectedObject({ windows: [...(room.windows || []), item] });
      }
    }

    // Stay in placement mode so user can place multiple doors/windows
    setPlacementPreview(null);
  };

  const cancelPlacement = () => {
    setPlacementMode(null);
    setPlacementPreview(null);
  };

  // Door/Window Selection
  const selectDoorWindow = (roomId, type, itemId) => {
    setSelectedDoorWindow({ roomId, type, itemId });
    setSelectedObjectId(null);
    setSelectedObjectType(null);
    setSelectedWallId(null);
    setPlacementMode(null);
  };

  const clearDoorWindowSelection = () => {
    setSelectedDoorWindow(null);
    setDraggingDoorWindow(null);
  };

  // Door/Window Drag along wall
  const startDoorWindowDrag = (roomId, type, itemId, wallName, initialOffset, clientX, clientY) => {
    setDraggingDoorWindow({ roomId, type, itemId, wallName, initialOffset, startClientX: clientX, startClientY: clientY });
  };

  const handleDoorWindowDrag = (clientX, clientY) => {
    if (!draggingDoorWindow) return;
    const room = rooms.find(r => r.id === draggingDoorWindow.roomId);
    if (!room) return;
    const svgElement = document.getElementById('blueprint-canvas');
    if (!svgElement) return;
    const rect = svgElement.getBoundingClientRect();
    const scale = zoomLevel / 100;
    const mx = (clientX - rect.left) / scale;
    const my = (clientY - rect.top) / scale;

    const isHorizontal = draggingDoorWindow.wallName === 'top' || draggingDoorWindow.wallName === 'bottom';
    const wallLength = isHorizontal ? room.width : room.height;

    let newOffset;
    if (isHorizontal) {
      newOffset = mx - room.x;
    } else {
      newOffset = my - room.y;
    }

    const items = draggingDoorWindow.type === 'door' ? (room.doors || []) : (room.windows || []);
    const item = items.find(i => i.id === draggingDoorWindow.itemId);
    if (!item) return;
    const halfSize = (item.size || 30) / 2;
    newOffset = Math.max(halfSize + 5, Math.min(wallLength - halfSize - 5, newOffset));
    if (gridSnap) newOffset = clampToGrid(newOffset);

    const collectionKey = draggingDoorWindow.type === 'door' ? 'doors' : 'windows';
    const updatedRooms = rooms.map(r => {
      if (r.id === draggingDoorWindow.roomId) {
        const updatedItems = (r[collectionKey] || []).map(i =>
          i.id === draggingDoorWindow.itemId ? { ...i, offset: newOffset } : i
        );
        return { ...r, [collectionKey]: updatedItems };
      }
      return r;
    });
    updateRoomsState(updatedRooms);
  };

  const finishDoorWindowDrag = () => {
    if (draggingDoorWindow) {
      setDraggingDoorWindow(null);
    }
  };

  // Delete selected door/window
  const deleteDoorWindow = () => {
    if (!selectedDoorWindow) return;
    const { roomId, type, itemId } = selectedDoorWindow;
    const collectionKey = type === 'door' ? 'doors' : 'windows';
    const updatedRooms = rooms.map(r => {
      if (r.id === roomId) {
        return { ...r, [collectionKey]: (r[collectionKey] || []).filter(i => i.id !== itemId) };
      }
      return r;
    });
    updateRoomsState(updatedRooms);
    setSelectedDoorWindow(null);
  };

  // Duplicate selected door/window
  const duplicateDoorWindow = () => {
    if (!selectedDoorWindow) return;
    const { roomId, type, itemId } = selectedDoorWindow;
    const collectionKey = type === 'door' ? 'doors' : 'windows';
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const item = (room[collectionKey] || []).find(i => i.id === itemId);
    if (!item) return;

    const newItem = { ...item, id: `${type}_${Date.now()}`, offset: item.offset + 20 };
    const updatedRooms = rooms.map(r => {
      if (r.id === roomId) {
        return { ...r, [collectionKey]: [...(r[collectionKey] || []), newItem] };
      }
      return r;
    });
    updateRoomsState(updatedRooms);
    setSelectedDoorWindow({ roomId, type, itemId: newItem.id });
  };

  // Rotate selected door/window (cycle through walls)
  const rotateDoorWindow = () => {
    if (!selectedDoorWindow) return;
    const { roomId, type, itemId } = selectedDoorWindow;
    const collectionKey = type === 'door' ? 'doors' : 'windows';
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const item = (room[collectionKey] || []).find(i => i.id === itemId);
    if (!item) return;

    const wallOrder = ['top', 'right', 'bottom', 'left'];
    const currentIdx = wallOrder.indexOf(item.wall);
    const nextWall = wallOrder[(currentIdx + 1) % 4];
    const newOffset = nextWall === 'top' || nextWall === 'bottom'
      ? Math.min(item.offset, room.width - 10)
      : Math.min(item.offset, room.height - 10);

    const updatedRooms = rooms.map(r => {
      if (r.id === roomId) {
        const updatedItems = (r[collectionKey] || []).map(i =>
          i.id === itemId ? { ...i, wall: nextWall, offset: newOffset } : i
        );
        return { ...r, [collectionKey]: updatedItems };
      }
      return r;
    });
    updateRoomsState(updatedRooms);
  };

  if (isGenerating3D) {
    const steps = [
      'Reading final floor plan',
      'Creating walls',
      'Adding doors & windows',
      'Placing staircase',
      'Creating roof',
      'Applying materials',
      'Rendering interior',
      'Rendering exterior'
    ];

    return (
      <div className="workspace-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#04100b' }}>
        <div style={{
          width: '450px',
          background: '#0c2218',
          border: '1px solid var(--gold-border)',
          borderRadius: '16px',
          padding: '2.5rem',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.7), 0 0 30px rgba(13, 50, 36, 0.4)',
          backdropFilter: 'blur(16px)'
        }}>
          <span style={{ fontSize: '2.2rem', display: 'block', marginBottom: '0.8rem' }}>🏗️</span>
          <h2 style={{ color: '#ffffff', fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.2rem' }}>BuildWise AI</h2>
          <p style={{ color: 'var(--gold-light)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '2rem' }}>Generating your 3D home...</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', textAlign: 'left', margin: '0 auto', maxWidth: '280px' }}>
            {steps.map((step, idx) => {
              const isDone = loadingStep > idx;
              const isActive = loadingStep === idx;
              return (
                <div key={idx} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.65rem', 
                  fontSize: '0.82rem',
                  opacity: isDone ? 1 : (isActive ? 1 : 0.25),
                  transition: 'opacity 0.3s ease',
                  color: isDone ? '#34d399' : (isActive ? 'var(--gold-light)' : '#9db3a7'),
                  fontWeight: isActive ? '700' : '500'
                }}>
                  <span style={{ 
                    width: '14px', 
                    height: '14px', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderRadius: '50%',
                    border: isDone ? 'none' : '1px solid var(--gold-border)',
                    background: isDone ? '#10b981' : 'transparent',
                    color: isDone ? '#fff' : 'transparent',
                    fontSize: '0.6rem',
                    fontWeight: 'bold'
                  }}>
                    {isDone ? '✓' : ''}
                  </span>
                  <span>{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (show3DViewer) {
    return (
      <div className="workspace-container">
        {/* Top Fixed Toolbar Header */}
        <Header 
          projectName={projectName}
          setProjectName={setProjectName}
          activeFloor={activeFloor}
          setActiveFloor={handleFloorChange}
          gridVisible={gridVisible}
          setGridVisible={setGridVisible}
          gridSnap={gridSnap}
          setGridSnap={setGridSnap}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onExport={() => alert('Exporting connected floor plan to DXF/DWG/PDF format...')}
          onOpenReport={() => setIsReportOpen(true)}
          onGenerate3D={start3DGeneration}
        />
        
        <ThreeDViewer 
          rooms={rooms}
          floorRooms={floorRooms}
          projectName={projectName}
          buildingType={createdProject?.buildingType || 'Single-Family Villa'}
          activeFloor={activeFloor}
          numFloors={numFloors}
          onBackTo2D={() => setShow3DViewer(false)}
          onOpenReport={() => setIsReportOpen(true)}
          currency={currency}
          plotArea={plotArea}
          floorMaterials={{}}
        />

      </div>
    );
  }

  return (
    <div className="workspace-container">
      {/* Top Fixed Toolbar Header */}
      <Header 
        projectName={projectName}
        setProjectName={setProjectName}
        activeFloor={activeFloor}
        setActiveFloor={handleFloorChange}
        gridVisible={gridVisible}
        setGridVisible={setGridVisible}
        gridSnap={gridSnap}
        setGridSnap={setGridSnap}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExport={() => alert('Exporting connected floor plan to DXF/DWG/PDF format...')}
        onOpenReport={() => setIsReportOpen(true)}
        onGenerate3D={start3DGeneration}
      />

      {/* Middle Workspace Body Layout */}
      <div className="workspace-body-layout">
        {/* Left Sidebar Toolbox */}
        <LeftSidebar 
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          onDeleteSelected={handleDeleteSelected}
          onDuplicateSelected={handleDuplicateSelected}
          onStartDoorPlacement={() => startDoorWindowPlacement('door')}
          onStartWindowPlacement={() => startDoorWindowPlacement('window')}
          buildingCategory={buildingCategory}
          buildingType={buildingType}
          commercialType={commercialType}
        />

        {/* Center Connected Architectural 2D Canvas */}
        <FloorPlanCanvas 
          activeFloor={activeFloor}
          setActiveFloor={handleFloorChange}
          floorsList={floorsList}
          gridVisible={gridVisible}
          gridSnap={gridSnap}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          connectedRooms={rooms}
          connectedWalls={allWalls}
          plotLength={createdProject?.plotLength || 75}
          plotWidth={createdProject?.plotWidth || 60}
          selectedObjectId={selectedObjectId}
          setSelectedObjectId={setSelectedObjectId}
          selectedObjectType={selectedObjectType}
          setSelectedObjectType={setSelectedObjectType}
          onUpdateWallPosition={() => {}} 
          onUpdateFurniture={handleUpdateFurniture}
          onDeleteSelected={handleDeleteSelected}
          onDuplicateSelected={handleDuplicateSelected}
          onRotateSelected={handleRotateSelected}
          onDropNewItem={handleDropNewItem}
          setMouseCoords={setMouseCoords}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          rooms={rooms}
          setRooms={updateRoomsState}
          draggingRoom={draggingRoom}
          setDraggingRoom={setDraggingRoom}
          activeResizeHandle={activeResizeHandle}
          setActiveResizeHandle={setActiveResizeHandle}
          handleRoomDrag={handleRoomDrag}
          handleRoomResize={handleRoomResize}
          rotatingRoom={rotatingRoom}
          setRotatingRoom={setRotatingRoom}
          startRoomDrag={startRoomDrag}
          startRoomResize={startRoomResize}
          startRoomRotate={startRoomRotate}
          handleRoomRotate={handleRoomRotate}
          onUpdateSelectedObject={handleUpdateSelectedObject}
          lockedRoomIds={lockedRoomIds}
          setLockedRoomIds={setLockedRoomIds}
          walls={walls}
          selectedWallId={selectedWallId}
          setSelectedWallId={setSelectedWallId}
          wallDrawStart={wallDrawStart}
          wallDrawEnd={wallDrawEnd}
          startWallDraw={startWallDraw}
          updateWallDraw={updateWallDraw}
          finishWallDraw={finishWallDraw}
          startWallDrag={startWallDrag}
          handleWallDrag={handleWallDrag}
          finishWallDrag={finishWallDrag}
          draggingWall={draggingWall}
          placementMode={placementMode}
          placementPreview={placementPreview}
          handlePlacementMouseMove={handlePlacementMouseMove}
          confirmPlacement={confirmPlacement}
          cancelPlacement={cancelPlacement}
          startDoorWindowPlacement={startDoorWindowPlacement}
          allWalls={allWalls}
          findClickedRoomWall={findClickedRoomWall}
          findNearestWall={findNearestWall}
          projectPointOnWallFn={projectPointOnWall}
          setRoomsFn={updateRoomsState}
          selectedDoorWindow={selectedDoorWindow}
          setSelectedDoorWindow={setSelectedDoorWindow}
          selectDoorWindow={selectDoorWindow}
          clearDoorWindowSelection={clearDoorWindowSelection}
          draggingDoorWindow={draggingDoorWindow}
          startDoorWindowDrag={startDoorWindowDrag}
          handleDoorWindowDrag={handleDoorWindowDrag}
          finishDoorWindowDrag={finishDoorWindowDrag}
          duplicateDoorWindow={duplicateDoorWindow}
          rotateDoorWindow={rotateDoorWindow}
        />


        {/* Right Sidebar Property Inspector */}
        <RightSidebar 
          selectedObject={selectedObject}
          selectedWallId={selectedWallId}
          plotArea={plotArea}
          builtArea={totalBuiltArea} 
          remainingArea={remainingArea}
          totalCost={totalCost} 
          costPerSqFt={costPerSqFt}
          sustainabilityMetrics={sustainabilityMetrics}
          numFloors={numFloors}
          currency={currency}
          materialStats={materialStats}
          onUpdateSelectedObject={handleUpdateSelectedObject}
          onDeleteSelected={handleDeleteSelected}
          onDuplicateSelected={handleDuplicateSelected}
          onRotateSelected={handleRotateSelected}
          onDeleteWall={deleteSelectedWall}
        />
      </div>

      {/* Fixed Bottom Status Bar */}
      <StatusBar 
        activeFloor={activeFloor}
        setActiveFloor={handleFloorChange}
        plotArea={plotArea}
        builtArea={activeBuiltArea}
        remainingArea={remainingArea}
        roomCount={rooms.length}
        totalCost={totalCost}
        currency={currency}
        setCurrency={setCurrency}
        gridVisible={gridVisible}
        gridSnap={gridSnap}
        zoomLevel={zoomLevel}
        mouseCoords={mouseCoords}
      />

      {/* Modals */}
      <ReportModal 
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        projectName={projectName}
        totalCost={totalCost}
        builtArea={totalBuiltArea}
        costPerSqFt={costPerSqFt}
        sustainabilityMetrics={sustainabilityMetrics}
        currency={currency}
        materialQuality={createdProject?.materialQuality || 'Standard'}
      />
    </div>
  );
}

// Mount React Application
const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <WorkspaceErrorBoundary>
      <BuildWiseWorkspaceApp />
    </WorkspaceErrorBoundary>
  );
}
