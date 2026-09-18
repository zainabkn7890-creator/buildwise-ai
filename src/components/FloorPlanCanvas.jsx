import React, { useRef, useState, useMemo } from 'react';
import { 
  MousePointer, RotateCw, Copy, Trash2, Plus, Minus, Maximize2, Compass,
  Move, Maximize, Lock, Unlock
} from 'lucide-react';

function renderCADFurnitureSymbol(item, isSelected) {
  const type = (item.type || '').toLowerCase();
  const strokeColor = isSelected ? '#d4af37' : '#4b5563';
  const strokeWidth = isSelected ? 1.5 : 1.0;
  const fillColor = isSelected ? 'rgba(212,175,55,0.15)' : 'rgba(243,244,246,0.3)';

  if (type === 'bed') {
    return (
      <g>
        <rect x="-16" y="-12" width="32" height="24" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} rx="2" />
        <line x1="-16" y1="-12" x2="-16" y2="12" stroke={strokeColor} strokeWidth={strokeWidth + 0.5} />
        <rect x="-14" y="-9" width="7" height="7" fill="none" stroke={strokeColor} strokeWidth="0.8" rx="1" />
        <rect x="-14" y="2" width="7" height="7" fill="none" stroke={strokeColor} strokeWidth="0.8" rx="1" />
        <line x1="-3" y1="-12" x2="-3" y2="12" stroke={strokeColor} strokeWidth="0.8" strokeDasharray="2 1" />
      </g>
    );
  }

  if (type === 'sofa') {
    return (
      <g>
        <rect x="-16" y="-9" width="32" height="18" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} rx="2" />
        <rect x="-16" y="-9" width="4" height="18" fill="none" stroke={strokeColor} strokeWidth="0.8" rx="1" />
        <rect x="12" y="-9" width="4" height="18" fill="none" stroke={strokeColor} strokeWidth="0.8" rx="1" />
        <rect x="-16" y="-9" width="32" height="4" fill="none" stroke={strokeColor} strokeWidth="0.8" />
        <line x1="0" y1="-5" x2="0" y2="9" stroke={strokeColor} strokeWidth="0.8" />
      </g>
    );
  }

  if (type === 'table' || type === 'dining') {
    return (
      <g>
        <rect x="-14" y="-9" width="28" height="18" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} rx="2" />
        <rect x="-8" y="-12" width="16" height="2" fill="none" stroke={strokeColor} strokeWidth="0.8" rx="1" />
        <rect x="-8" y="10" width="16" height="2" fill="none" stroke={strokeColor} strokeWidth="0.8" rx="1" />
      </g>
    );
  }

  if (type === 'toilet' || type === 'wc') {
    return (
      <g>
        <rect x="-8" y="-10" width="16" height="6" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} rx="1" />
        <ellipse cx="0" cy="2" rx="6" ry="8" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
      </g>
    );
  }

  if (type === 'sink' || type === 'washbasin') {
    return (
      <g>
        <rect x="-9" y="-9" width="18" height="18" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} rx="2" />
        <ellipse cx="0" cy="0" rx="6" ry="5" fill="none" stroke={strokeColor} strokeWidth="0.8" />
        <circle cx="0" cy="-3" r="1" fill={strokeColor} />
      </g>
    );
  }

  if (type === 'counter') {
    return (
      <g>
        <rect x="-20" y="-7" width="40" height="14" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} rx="1" />
        <rect x="5" y="-5" width="10" height="10" fill="none" stroke={strokeColor} strokeWidth="0.8" rx="1" />
      </g>
    );
  }

  if (type === 'cabinet' || type === 'wardrobe' || type === 'storage') {
    return (
      <g>
        <rect x="-14" y="-7" width="28" height="14" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} rx="1" />
        <line x1="0" y1="-7" x2="0" y2="7" stroke={strokeColor} strokeWidth="0.8" />
      </g>
    );
  }

  if (type === 'chair') {
    return (
      <g>
        <rect x="-7" y="-7" width="14" height="14" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} rx="2" />
        <line x1="-7" y1="-4" x2="7" y2="-4" stroke={strokeColor} strokeWidth="0.8" />
      </g>
    );
  }

  return (
    <g>
      <rect x="-10" y="-8" width="20" height="16" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} rx="1.5" />
      <line x1="-10" y1="-3" x2="10" y2="-3" stroke={strokeColor} strokeWidth="0.8" />
    </g>
  );
}

export default function FloorPlanCanvas({
  activeFloor,
  setActiveFloor,
  floorsList: propFloorsList,
  gridVisible,
  gridSnap,
  zoomLevel,
  setZoomLevel,
  connectedRooms,
  connectedWalls,
  selectedObjectId,
  setSelectedObjectId,
  selectedObjectType,
  setSelectedObjectType,
  onUpdateFurniture,
  onDeleteSelected,
  onDuplicateSelected,
  onRotateSelected,
  onDropNewItem,
  setMouseCoords,
  activeTool,
  setActiveTool,
  rooms,
  draggingRoom,
  setDraggingRoom,
  activeResizeHandle,
  setActiveResizeHandle,
  handleRoomDrag,
  handleRoomResize,
  rotatingRoom,
  setRotatingRoom,
  startRoomDrag,
  startRoomResize,
  startRoomRotate,
  handleRoomRotate,
  onUpdateSelectedObject,
  selectedObject,
  lockedRoomIds,
  setLockedRoomIds,
  plotLength = 75,
  plotWidth = 60,
  // Wall tool props
  walls,
  selectedWallId,
  setSelectedWallId,
  wallDrawStart,
  wallDrawEnd,
  startWallDraw,
  updateWallDraw,
  finishWallDraw,
  startWallDrag,
  handleWallDrag,
  finishWallDrag,
  draggingWall,
  // Door/Window placement props
  placementMode,
  placementPreview,
  handlePlacementMouseMove,
  confirmPlacement,
  cancelPlacement,
  startDoorWindowPlacement,
  allWalls,
  findClickedRoomWall,
  // Door/Window direct placement props
  findNearestWall,
  projectPointOnWallFn,
  setRoomsFn,
  // Door/Window selection and editing props
  selectedDoorWindow,
  selectDoorWindow,
  clearDoorWindowSelection,
  draggingDoorWindow,
  startDoorWindowDrag,
  handleDoorWindowDrag,
  finishDoorWindowDrag,
  duplicateDoorWindow,
  rotateDoorWindow,
}) {
  const svgRef = useRef(null);
  const canvasRef = useRef(null);
  const draggingFurnitureRef = useRef(null);
  const [toolbarPos, setToolbarPos] = useState(null);
  const [hoveredWallId, setHoveredWallId] = useState(null);

  const floorsList = propFloorsList || [
    { id: 'ground', label: 'Ground Floor' },
    { id: 'first', label: 'First Floor' },
    { id: 'second', label: 'Second Floor' },
    { id: 'terrace', label: 'Terrace' },
    { id: 'basement', label: 'Basement' },
  ];

  const selectedRoom = useMemo(() => {
    if (selectedObjectType === 'room' && selectedObjectId) {
      return rooms.find(r => r.id === selectedObjectId) || null;
    }
    return null;
  }, [selectedObjectType, selectedObjectId, rooms]);

  const isLocked = selectedRoom ? lockedRoomIds.has(selectedRoom.id) : false;

  const updateToolbarPosition = () => {
    if (!selectedRoom || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const scale = zoomLevel / 100;
    const roomCenterX = (selectedRoom.x + selectedRoom.width / 2) * scale + 30;
    const roomTopY = selectedRoom.y * scale + 22;

    setToolbarPos({
      left: canvasRect.left + roomCenterX,
      top: canvasRect.top + Math.max(roomTopY - 48, 8)
    });
  };

  React.useEffect(() => {
    if (selectedRoom) {
      updateToolbarPosition();
    } else {
      setToolbarPos(null);
    }
  }, [selectedRoom, selectedRoom?.x, selectedRoom?.y, selectedRoom?.width, selectedRoom?.height, zoomLevel]);

  React.useEffect(() => {
    const handleResize = () => { if (selectedRoom) updateToolbarPosition(); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedRoom, zoomLevel]);

  const handleToggleLock = () => {
    if (!selectedRoom) return;
    const newLocked = new Set(lockedRoomIds);
    if (newLocked.has(selectedRoom.id)) {
      newLocked.delete(selectedRoom.id);
    } else {
      newLocked.add(selectedRoom.id);
    }
    setLockedRoomIds(newLocked);
  };

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const xPx = (e.clientX - rect.left) / (zoomLevel / 100);
    const yPx = (e.clientY - rect.top) / (zoomLevel / 100);

    const xFt = Math.floor(xPx / 10);
    const xIn = Math.round(((xPx / 10) % 1) * 12);
    const yFt = Math.floor(yPx / 10);
    const yIn = Math.round(((yPx / 10) % 1) * 12);

    setMouseCoords(`X: ${xFt}'-${xIn}" | Y: ${yFt}'-${yIn}"`);

    // Wall hover detection for Wall tool
    if (activeTool === 'wall' && findClickedRoomWall) {
      const hit = findClickedRoomWall(xPx, yPx, 14);
      setHoveredWallId(hit ? `${hit.roomId}_w_${hit.wallName}` : null);
    } else {
      setHoveredWallId(null);
    }

    if (draggingRoom) { handleRoomDrag(e.clientX, e.clientY); return; }
    if (activeResizeHandle) { handleRoomResize(e.clientX, e.clientY); return; }
    if (rotatingRoom) { handleRoomRotate(e.clientX, e.clientY); return; }
    if (draggingWall) { handleWallDrag(e.clientX, e.clientY); return; }
    if (draggingDoorWindow) { handleDoorWindowDrag(e.clientX, e.clientY); return; }
    if (wallDrawStart) { updateWallDraw(xPx, yPx); return; }
    if (placementMode) { handlePlacementMouseMove(xPx, yPx); return; }
    if (draggingFurnitureRef.current) {
      const { id, offsetX, offsetY } = draggingFurnitureRef.current;
      let newX = xPx - offsetX;
      let newY = yPx - offsetY;
      if (gridSnap) { newX = Math.round(newX / 10) * 10; newY = Math.round(newY / 10) * 10; }
      onUpdateFurniture(id, { x: newX, y: newY });
    }
  };

  const handleMouseUp = (e) => {
    if (draggingWall) { finishWallDrag(); return; }
    if (draggingDoorWindow) { finishDoorWindowDrag(); return; }
    draggingFurnitureRef.current = null;
    setDraggingRoom(null);
    setActiveResizeHandle(null);
    setRotatingRoom(null);
  };

  const handleCanvasClick = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const xPx = (e.clientX - rect.left) / (zoomLevel / 100);
    const yPx = (e.clientY - rect.top) / (zoomLevel / 100);

    // Door/Window tool: place on nearest wall (works on rooms and empty space)
    if (activeTool === 'door' || activeTool === 'window') {
      const type = activeTool;
      const wall = findNearestWall ? findNearestWall(xPx, yPx) : null;
      if (wall) {
        const proj = projectPointOnWallFn ? projectPointOnWallFn(xPx, yPx, wall) : { t: 0.5 };
        if (wall.isRoomWall && wall.roomId) {
          const room = rooms.find(r => r.id === wall.roomId);
          if (room) {
            let wallName = 'bottom';
            if (Math.abs(wall.y1 - wall.y2) < 1) {
              wallName = Math.abs(wall.y1 - room.y) < 2 ? 'top' : 'bottom';
            } else {
              wallName = Math.abs(wall.x1 - room.x) < 2 ? 'left' : 'right';
            }
            const wallLength = (wallName === 'top' || wallName === 'bottom') ? room.width : room.height;
            let offset = Math.round(proj.t * wallLength);
            const size = type === 'door' ? 30 : 40;
            offset = Math.max(size / 2 + 5, Math.min(wallLength - size / 2 - 5, offset));
            const item = { id: `${type}_${Date.now()}`, wall: wallName, offset, size, type };
            const collectionKey = type === 'door' ? 'doors' : 'windows';
            const updatedRooms = rooms.map(r => {
              if (r.id === room.id) {
                return { ...r, [collectionKey]: [...(r[collectionKey] || []), item] };
              }
              return r;
            });
            setRoomsFn(updatedRooms);
          }
        }
      }
      return;
    }

    if (placementMode) {
      confirmPlacement(xPx, yPx);
      return;
    }

    if (activeTool === 'wall') {
      // First check if clicking on an existing room wall
      if (findClickedRoomWall) {
        const hit = findClickedRoomWall(xPx, yPx, 14);
        if (hit) {
          setSelectedWallId(`${hit.roomId}_w_${hit.wallName}`);
          setSelectedObjectId(hit.roomId);
          setSelectedObjectType('room');
          return;
        }
      }
      // Then check standalone walls - they have click handlers on their lines
      // If no wall was clicked, start drawing a new wall
      if (!wallDrawStart) {
        startWallDraw(xPx, yPx);
      } else {
        finishWallDraw(xPx, yPx);
      }
      return;
    }

    setSelectedObjectId(null);
    setSelectedObjectType(null);
    setSelectedWallId(null);
    clearDoorWindowSelection();
  };

  const handleRoomClick = (e, room) => {
    if (activeTool === 'wall') {
      // Don't stop propagation - let it reach the SVG handler which has findClickedRoomWall
      return;
    }
    e.stopPropagation();
    if (placementMode && activeTool !== 'door' && activeTool !== 'window') return;
    setSelectedObjectId(room.id);
    setSelectedObjectType('room');
  };

  const handleDragOver = (e) => { e.preventDefault(); };

  const handleDrop = (e) => {
    e.preventDefault();
    const toolId = e.dataTransfer.getData('text/plain');
    if (!toolId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    let x = (e.clientX - rect.left) / (zoomLevel / 100);
    let y = (e.clientY - rect.top) / (zoomLevel / 100);
    if (gridSnap) { x = Math.round(x / 10) * 10; y = Math.round(y / 10) * 10; }
    onDropNewItem(toolId, x, y);
  };

  const scale = zoomLevel / 100;

  const renderWallSegments = (length, openings, isVertical, wallName, roomWidth, roomHeight, roomId, openingType) => {
    const wallOpenings = (openings || [])
      .filter(op => op.wall === wallName)
      .sort((a, b) => a.offset - b.offset);

    if (wallOpenings.length === 0) {
      return (
        <line
          x1={isVertical ? (wallName === 'left' ? 0 : roomWidth) : 0}
          y1={isVertical ? 0 : (wallName === 'top' ? 0 : roomHeight)}
          x2={isVertical ? (wallName === 'left' ? 0 : roomWidth) : roomWidth}
          y2={isVertical ? roomHeight : (wallName === 'top' ? 0 : roomHeight)}
          stroke="#374151"
          strokeWidth="8"
          strokeLinecap="square"
        />
      );
    }

    const segments = [];
    let currentPos = 0;

    wallOpenings.forEach((op, idx) => {
      const size = op.size || 30;
      const startCut = op.offset - size / 2;
      const endCut = op.offset + size / 2;

      if (startCut > currentPos) {
        segments.push(
          <line
            key={`wall-${wallName}-seg-${idx}`}
            x1={isVertical ? (wallName === 'left' ? 0 : roomWidth) : currentPos}
            y1={isVertical ? currentPos : (wallName === 'top' ? 0 : roomHeight)}
            x2={isVertical ? (wallName === 'left' ? 0 : roomWidth) : startCut}
            y2={isVertical ? startCut : (wallName === 'top' ? 0 : roomHeight)}
            stroke="#374151"
            strokeWidth="8"
            strokeLinecap="square"
          />
        );
      }

      const isSelected = selectedDoorWindow && selectedDoorWindow.roomId === roomId && selectedDoorWindow.itemId === op.id;
      const transformStr = isVertical
        ? `translate(${wallName === 'left' ? 0 : roomWidth}, ${op.offset})`
        : `translate(${op.offset}, ${wallName === 'top' ? 0 : roomHeight})`;

      segments.push(
        <g
          key={`op-${wallName}-${idx}`}
          transform={transformStr}
          onClick={(e) => { e.stopPropagation(); selectDoorWindow(roomId, openingType, op.id); }}
          onMouseDown={(e) => {
            e.stopPropagation();
            selectDoorWindow(roomId, openingType, op.id);
            startDoorWindowDrag(roomId, openingType, op.id, wallName, op.offset, e.clientX, e.clientY);
          }}
          style={{ cursor: 'pointer' }}
        >
          {isSelected && (
            <rect x={-size/2 - 4} y={isVertical ? -4 : -size/2 - 4} width={isVertical ? 8 : size + 8} height={isVertical ? size + 8 : 8}
              fill="rgba(212,175,55,0.3)" stroke="#d4af37" strokeWidth="1.5" rx="2" />
          )}
          {op.type === 'door' ? (
            <g transform={isVertical ? 'rotate(90)' : ''}>
              <path d={`M ${-size/2} 0 A ${size} ${size} 0 0 1 ${size/2} 0`} fill="none" stroke={isSelected ? '#d4af37' : '#b45309'} strokeWidth="1.2" strokeDasharray="2 2" />
              <line x1={-size/2} y1="0" x2={-size/2} y2={-size} stroke={isSelected ? '#d4af37' : '#b45309'} strokeWidth="2" />
              <circle cx={-size/2} cy="0" r="2" fill={isSelected ? '#d4af37' : '#b45309'} />
              <circle cx={size/2} cy="0" r="2" fill={isSelected ? '#d4af37' : '#b45309'} />
            </g>
          ) : (
            <g transform={isVertical ? 'rotate(90)' : ''}>
              <rect x={-size/2} y="-3" width={size} height="6" fill="#F7F8FA" stroke={isSelected ? '#d4af37' : '#2563eb'} strokeWidth="1.2" />
              <line x1={-size/2} y1="-1" x2={size/2} y2="-1" stroke={isSelected ? '#d4af37' : '#2563eb'} strokeWidth="0.8" />
              <line x1={-size/2} y1="1" x2={size/2} y2="1" stroke={isSelected ? '#d4af37' : '#2563eb'} strokeWidth="0.8" />
            </g>
          )}
        </g>
      );
      currentPos = endCut;
    });

    if (currentPos < length) {
      segments.push(
        <line
          key={`wall-${wallName}-seg-last`}
          x1={isVertical ? (wallName === 'left' ? 0 : roomWidth) : currentPos}
          y1={isVertical ? currentPos : (wallName === 'top' ? 0 : roomHeight)}
          x2={isVertical ? (wallName === 'left' ? 0 : roomWidth) : length}
          y2={isVertical ? length : (wallName === 'top' ? 0 : roomHeight)}
          stroke="#374151"
          strokeWidth="8"
          strokeLinecap="square"
        />
      );
    }

    return segments;
  };

  return (
    <section className="center-canvas-workspace" ref={canvasRef} style={{ position: 'relative' }}>
      {/* Top Floor Tabs */}
      <div className="canvas-floor-tabs">
        {floorsList.map(fl => (
          <button
            key={fl.id}
            className={`floor-tab-btn ${activeFloor === fl.id ? 'active' : ''}`}
            onClick={() => setActiveFloor(fl.id)}
          >
            {fl.label}
          </button>
        ))}
        <button className="floor-tab-btn" style={{ padding: '0.4rem 0.5rem' }} title="Add New Floor">+</button>
      </div>

      {/* Selected Room Header Banner */}
      {selectedRoom && (
        <div className="selected-room-header" style={{ background: 'rgba(255,255,255,0.95)', borderBottom: '1px solid #e5e7eb' }}>
          <div className="selected-room-header-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span className="selected-room-header-label" style={{ color: '#6b7280' }}>Selected Room:</span>
          <span className="selected-room-header-name" style={{ color: '#1f2937' }}>{selectedRoom.name}</span>
          <span className="selected-room-header-type" style={{ color: '#059669', background: 'rgba(5,150,105,0.08)' }}>{selectedRoom.type}</span>
          <span className="selected-room-header-area" style={{ color: '#2563eb', background: 'rgba(37,99,235,0.06)' }}>{selectedRoom.areaSqFt} sq ft</span>
        </div>
      )}

      {/* Relocated North Compass Symbol */}
      <div 
        className="canvas-compass-overlay" 
        style={{
          position: 'absolute',
          top: '64px',
          right: '24px',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.92)',
          border: '1px solid #d1d5db',
          borderRadius: '12px',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="#f9fafb" stroke="#d1d5db" strokeWidth="1.5" />
          <path d="M 16 4 L 20 18 L 16 15 L 12 18 Z" fill="#dc2626" />
          <path d="M 16 28 L 19 18 L 16 15 L 13 18 Z" fill="#9ca3af" />
          <text x="16" y="11" fill="#dc2626" fontSize="9" fontWeight="bold" textAnchor="middle">N</text>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontFamily: 'var(--font-mono)' }}>ORIENTATION</span>
          <strong style={{ fontSize: '0.8rem', color: '#374151' }}>NORTH-EAST (45°)</strong>
        </div>
      </div>

      {/* Main Drawing Canvas */}
      <div 
        id="blueprint-canvas"
        className="drawing-canvas-area"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{ cursor: activeTool === 'wall' ? 'crosshair' : (placementMode ? 'copy' : 'default') }}
      >
        {gridVisible && <div className="grid-blueprint-pattern"></div>}

        <div className="canvas-ruler-top">
          {Array.from({ length: 13 }).map((_, i) => (
            <div key={i} style={{ flex: 1, position: 'relative', height: '100%' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '1px', background: '#d1d5db' }} />
              {i % 2 === 0 && (
                <span style={{ position: 'absolute', left: '2px', bottom: '1px', fontSize: '0.55rem', color: '#9ca3af', fontFamily: 'monospace', lineHeight: 1 }}>{i * 5}'</span>
              )}
            </div>
          ))}
        </div>

        <div className="canvas-ruler-left">
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} style={{ flex: 1, position: 'relative', width: '100%' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: '#d1d5db' }} />
              {i % 2 === 0 && (
                <span style={{ position: 'absolute', top: '1px', right: '2px', fontSize: '0.55rem', color: '#9ca3af', fontFamily: 'monospace', lineHeight: 1 }}>{i * 5}'</span>
              )}
            </div>
          ))}
        </div>

        <svg 
          ref={svgRef} 
          className="floorplan-svg" 
          style={{ transform: `scale(${scale})`, transformOrigin: 'top left', cursor: activeTool === 'wall' ? 'crosshair' : (placementMode ? 'copy' : 'default') }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleCanvasClick}
        >
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#d4af37" />
            </marker>
          </defs>

          <g id="site-context-group">
            <rect x="40" y="30" width="600" height="490" fill="none" stroke="#cbd5e1" strokeWidth="0.75" strokeDasharray="8 4" opacity="0.5" />
            <rect x="40" y="30" width="600" height="40" fill="rgba(52,211,153,0.02)" />
            <text x="340" y="52" fill="#94a3b8" fontSize="7" fontWeight="500" textAnchor="middle" opacity="0.4" fontFamily="monospace">REAR SETBACK</text>
            <rect x="40" y="470" width="600" height="50" fill="rgba(52,211,153,0.02)" />
            <text x="340" y="500" fill="#94a3b8" fontSize="7" fontWeight="500" textAnchor="middle" opacity="0.4" fontFamily="monospace">FRONT SETBACK</text>
            <rect x="40" y="70" width="50" height="400" fill="rgba(52,211,153,0.01)" />
            <text x="65" y="270" fill="#94a3b8" fontSize="6" fontWeight="500" textAnchor="middle" transform="rotate(-90 65 270)" opacity="0.35" fontFamily="monospace">SIDE SETBACK</text>
            <g transform="translate(50, 510)" opacity="0.4">
              <rect x="0" y="0" width="80" height="2" fill="#94a3b8" />
              <rect x="0" y="0" width="40" height="2" fill="#6b7280" />
              <text x="0" y="-3" fill="#94a3b8" fontSize="6" fontFamily="monospace">0</text>
              <text x="40" y="-3" fill="#94a3b8" fontSize="6" fontFamily="monospace">4'</text>
              <text x="80" y="-4" fill="#6b7280" fontSize="8" fontFamily="monospace">8'</text>
              <text x="90" y="5" fill="#6b7280" fontSize="8" fontWeight="bold">Scale: 1/4" = 1'-0"</text>
            </g>
          </g>

          <g id="overall-dimensions-group">
            <line x1="90" y1="52" x2="590" y2="52" stroke="#9ca3af" strokeWidth="0.8" />
            <line x1="90" y1="45" x2="90" y2="60" stroke="#9ca3af" strokeWidth="1" />
            <line x1="590" y1="45" x2="590" y2="60" stroke="#9ca3af" strokeWidth="1" />
            <line x1="86" y1="56" x2="94" y2="48" stroke="#6b7280" strokeWidth="1.5" />
            <line x1="586" y1="56" x2="594" y2="48" stroke="#6b7280" strokeWidth="1.5" />
            <rect x="300" y="43" width="90" height="16" fill="#F7F8FA" rx="2" />
            <text x="345" y="55" fill="#374151" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{`PROPERTY BOUNDARY: ${plotWidth || 60}'-0" × ${plotLength || 75}'-0"`}</text>
            <line x1="72" y1="70" x2="72" y2="470" stroke="#9ca3af" strokeWidth="0.8" />
            <line x1="65" y1="70" x2="80" y2="70" stroke="#9ca3af" strokeWidth="1" />
            <line x1="65" y1="470" x2="80" y2="470" stroke="#9ca3af" strokeWidth="1" />
            <line x1="68" y1="74" x2="76" y2="66" stroke="#6b7280" strokeWidth="1.5" />
            <line x1="68" y1="474" x2="76" y2="466" stroke="#6b7280" strokeWidth="1.5" />
            <rect x="63" y="258" width="18" height="24" fill="#F7F8FA" rx="2" />
            <text x="72" y="274" fill="#374151" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace" transform="rotate(-90 72 274)">{`${plotLength || 75}'-0"`}</text>
          </g>

          <g id="connected-rooms-group">
            {connectedRooms.map(room => {
              const isSelected = selectedObjectType === 'room' && selectedObjectId === room.id;
              const isLockedRoom = lockedRoomIds.has(room.id);
              const wFeet = Math.round(room.width / 10);
              const hFeet = Math.round(room.height / 10);

              return (
                <g 
                  key={room.id}
                  transform={`translate(${room.x}, ${room.y}) rotate(${room.rotation || 0}, ${room.width/2}, ${room.height/2})`}
                  onClick={(e) => handleRoomClick(e, room)}
                  onMouseDown={(e) => {
                    if (isLockedRoom) return;
                    if (activeTool === 'wall' || placementMode) return;
                    if (e.target.tagName === 'rect' && e.target.style.cursor.includes('resize')) return;
                    if (e.target.tagName === 'circle' && e.target.style.cursor === 'alias') return;
                    e.stopPropagation();
                    setSelectedObjectId(room.id);
                    setSelectedObjectType('room');
                    startRoomDrag(room, e.clientX, e.clientY);
                  }}
                  style={{ cursor: (activeTool === 'wall' || placementMode) ? 'default' : (isLockedRoom ? 'not-allowed' : (activeTool === 'pointer' ? 'move' : 'default')) }}
                >
                  <rect 
                    x="0" 
                    y="0" 
                    width={room.width} 
                    height={room.height} 
                    fill={isSelected ? 'rgba(212, 175, 55, 0.08)' : (room.type === 'bathroom' ? 'rgba(56,189,248,0.03)' : '#ffffff')}
                    stroke="none"
                    strokeWidth="0"
                  />
                  {/* Individual wall lines - skip removed walls */}
                  {!(room.removedWalls || []).includes('top') && (
                    <line x1="0" y1="0" x2={room.width} y2="0" stroke={isSelected ? '#d4af37' : '#1f2937'} strokeWidth={isSelected ? '2.5' : '2'} />
                  )}
                  {!(room.removedWalls || []).includes('bottom') && (
                    <line x1="0" y1={room.height} x2={room.width} y2={room.height} stroke={isSelected ? '#d4af37' : '#1f2937'} strokeWidth={isSelected ? '2.5' : '2'} />
                  )}
                  {!(room.removedWalls || []).includes('left') && (
                    <line x1="0" y1="0" x2="0" y2={room.height} stroke={isSelected ? '#d4af37' : '#1f2937'} strokeWidth={isSelected ? '2.5' : '2'} />
                  )}
                  {!(room.removedWalls || []).includes('right') && (
                    <line x1={room.width} y1="0" x2={room.width} y2={room.height} stroke={isSelected ? '#d4af37' : '#1f2937'} strokeWidth={isSelected ? '2.5' : '2'} />
                  )}

                  {isLockedRoom && (
                    <rect x="0" y="0" width={room.width} height={room.height} fill="rgba(0,0,0,0.02)" stroke="none" />
                  )}

                  {!(room.removedWalls || []).includes('top') && renderWallSegments(room.width, room.doors, false, 'top', room.width, room.height, room.id, 'door')}
                  {!(room.removedWalls || []).includes('bottom') && renderWallSegments(room.width, room.doors, false, 'bottom', room.width, room.height, room.id, 'door')}
                  {!(room.removedWalls || []).includes('left') && renderWallSegments(room.height, room.doors, true, 'left', room.width, room.height, room.id, 'door')}
                  {!(room.removedWalls || []).includes('right') && renderWallSegments(room.height, room.doors, true, 'right', room.width, room.height, room.id, 'door')}

                  {!(room.removedWalls || []).includes('top') && renderWallSegments(room.width, room.windows, false, 'top', room.width, room.height, room.id, 'window')}
                  {!(room.removedWalls || []).includes('bottom') && renderWallSegments(room.width, room.windows, false, 'bottom', room.width, room.height, room.id, 'window')}
                  {!(room.removedWalls || []).includes('left') && renderWallSegments(room.height, room.windows, true, 'left', room.width, room.height, room.id, 'window')}
                  {!(room.removedWalls || []).includes('right') && renderWallSegments(room.height, room.windows, true, 'right', room.width, room.height, room.id, 'window')}

                  <text 
                    x={room.width / 2} 
                    y={room.height / 2 - 10} 
                    fill={isSelected ? '#92400e' : '#111827'} 
                    fontSize="10" 
                    fontWeight="800" 
                    textAnchor="middle" 
                    fontFamily="'Inter', sans-serif"
                    letterSpacing="0.03em"
                  >
                    {room.name.toUpperCase()}
                  </text>
                  <text 
                    x={room.width / 2} 
                    y={room.height / 2 + 4} 
                    fill="#9ca3af" 
                    fontSize="8" 
                    fontWeight="500" 
                    textAnchor="middle" 
                    fontFamily="monospace"
                  >
                    {`${wFeet}'-0" × ${hFeet}'-0"`}
                  </text>
                  <text 
                    x={room.width / 2} 
                    y={room.height / 2 + 15} 
                    fill="#059669" 
                    fontSize="8.5" 
                    fontWeight="bold" 
                    textAnchor="middle" 
                    fontFamily="monospace"
                  >
                    {`${room.areaSqFt} SQ FT`}
                  </text>


                  {room.type === 'staircase' && (() => {
                    const st = room.stairType || 'straight';
                    const w = room.width - 20;
                    const h = room.height - 20;
                    if (st === 'straight') {
                      const steps = 10;
                      const stepH = h / steps;
                      return (
                        <g transform="translate(10, 10)" opacity="0.6">
                          {Array.from({ length: steps + 1 }).map((_, i) => (
                            <line key={i} x1="0" y1={i * stepH} x2={w} y2={i * stepH} stroke="#374151" strokeWidth="0.8" />
                          ))}
                          <line x1={w/2} y1="5" x2={w/2} y2={h - 5} stroke="#b45309" strokeWidth="1.5" markerEnd="url(#arrow)" />
                          <text x={w/2 + 5} y={h/2} fill="#b45309" fontSize="9" fontWeight="bold">UP</text>
                        </g>
                      );
                    }
                    if (st === 'L-shaped') {
                      const midX = w * 0.5;
                      const midY = h * 0.5;
                      const steps1 = 5, steps2 = 5;
                      const stepH1 = midY / steps1;
                      const stepH2 = (h - midY) / steps2;
                      return (
                        <g transform="translate(10, 10)" opacity="0.6">
                          {Array.from({ length: steps1 + 1 }).map((_, i) => (
                            <line key={`a${i}`} x1="0" y1={i * stepH1} x2={midX} y2={i * stepH1} stroke="#374151" strokeWidth="0.8" />
                          ))}
                          {Array.from({ length: steps2 + 1 }).map((_, i) => (
                            <line key={`b${i}`} x1={midX} y1={midY + i * stepH2} x2={w} y2={midY + i * stepH2} stroke="#374151" strokeWidth="0.8" />
                          ))}
                          <line x1={midX} y1="0" x2={midX} y2={midY} stroke="#374151" strokeWidth="1.5" />
                          <line x1={midX} y1={midY} x2={w} y2={midY} stroke="#374151" strokeWidth="1.5" />
                          <text x={midX/2} y={midY/2} fill="#b45309" fontSize="8" fontWeight="bold" textAnchor="middle">UP</text>
                          <text x={(midX + w)/2} y={midY + (h - midY)/2} fill="#b45309" fontSize="8" fontWeight="bold" textAnchor="middle">DN</text>
                          <rect x={midX - 3} y={midY - 3} width="6" height="6" fill="#b45309" />
                        </g>
                      );
                    }
                    if (st === 'U-shaped') {
                      const midY = h * 0.5;
                      const gap = w * 0.15;
                      const steps = 5;
                      const stepH = midY / steps;
                      return (
                        <g transform="translate(10, 10)" opacity="0.6">
                          {Array.from({ length: steps + 1 }).map((_, i) => (
                            <line key={`l${i}`} x1="0" y1={i * stepH} x2={w/2 - gap/2} y2={i * stepH} stroke="#374151" strokeWidth="0.8" />
                          ))}
                          {Array.from({ length: steps + 1 }).map((_, i) => (
                            <line key={`r${i}`} x1={w/2 + gap/2} y1={midY + i * stepH} x2={w} y2={midY + i * stepH} stroke="#374151" strokeWidth="0.8" />
                          ))}
                          <line x1={w/2 - gap/2} y1="0" x2={w/2 - gap/2} y2={midY} stroke="#374151" strokeWidth="1.5" />
                          <line x1={w/2 - gap/2} y1={midY} x2={w/2 + gap/2} y2={midY} stroke="#374151" strokeWidth="1.5" />
                          <line x1={w/2 + gap/2} y1={midY} x2={w/2 + gap/2} y2={h} stroke="#374151" strokeWidth="1.5" />
                          <text x={w/4} y={midY/2} fill="#b45309" fontSize="8" fontWeight="bold" textAnchor="middle">UP</text>
                          <text x={3*w/4} y={midY + midY/2} fill="#b45309" fontSize="8" fontWeight="bold" textAnchor="middle">DN</text>
                        </g>
                      );
                    }
                    if (st === 'spiral') {
                      const cx = w / 2, cy = h / 2;
                      const r = Math.min(w, h) / 2 - 5;
                      return (
                        <g transform="translate(10, 10)" opacity="0.6">
                          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#374151" strokeWidth="1" />
                          <circle cx={cx} cy={cy} r={r * 0.3} fill="none" stroke="#374151" strokeWidth="1" />
                          {Array.from({ length: 16 }).map((_, i) => {
                            const angle = (i / 16) * Math.PI * 2;
                            const x1 = cx + Math.cos(angle) * r * 0.3;
                            const y1 = cy + Math.sin(angle) * r * 0.3;
                            const x2 = cx + Math.cos(angle) * r;
                            const y2 = cy + Math.sin(angle) * r;
                            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#374151" strokeWidth="0.6" />;
                          })}
                          <circle cx={cx} cy={cy} r="2" fill="#b45309" />
                          <text x={cx + 4} y={cy - 4} fill="#b45309" fontSize="8" fontWeight="bold">UP</text>
                        </g>
                      );
                    }
                    // dog-legged (default)
                    const midX = w * 0.5;
                    const steps = 5;
                    const stepH = h / steps;
                    return (
                      <g transform="translate(10, 10)" opacity="0.6">
                        {Array.from({ length: steps + 1 }).map((_, i) => (
                          <line key={`l${i}`} x1="0" y1={i * stepH} x2={midX - 4} y2={i * stepH} stroke="#374151" strokeWidth="0.8" />
                        ))}
                        {Array.from({ length: steps + 1 }).map((_, i) => (
                          <line key={`r${i}`} x1={midX + 4} y1={i * stepH} x2={w} y2={i * stepH} stroke="#374151" strokeWidth="0.8" />
                        ))}
                        <line x1={midX} y1="0" x2={midX} y2={h} stroke="#374151" strokeWidth="1.5" strokeDasharray="3 2" />
                        <text x={midX/2} y={h/2} fill="#b45309" fontSize="8" fontWeight="bold" textAnchor="middle">UP</text>
                        <text x={midX + (w - midX)/2} y={h/2} fill="#b45309" fontSize="8" fontWeight="bold" textAnchor="middle">DN</text>
                      </g>
                    );
                  })()}

                  {(room.furniture || []).map(item => {
                    const isFurnitureSelected = selectedObjectType === 'furniture' && selectedObjectId === item.id;
                    return (
                      <g 
                        key={item.id}
                        transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation || 0})`}
                        style={{ cursor: 'grab' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedObjectId(item.id);
                          setSelectedObjectType('furniture');
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setSelectedObjectId(item.id);
                          setSelectedObjectType('furniture');
                          const svgRect = svgRef.current?.getBoundingClientRect();
                          if (svgRect) {
                            const mx = (e.clientX - svgRect.left) / (zoomLevel / 100);
                            const my = (e.clientY - svgRect.top) / (zoomLevel / 100);
                            draggingFurnitureRef.current = {
                              id: item.id,
                              offsetX: mx - (room.x + item.x),
                              offsetY: my - (room.y + item.y)
                            };
                          }
                        }}
                      >
                        {renderCADFurnitureSymbol(item, isFurnitureSelected)}
                      </g>
                    );
                  })}

                  {isSelected && (
                    <g transform={`rotate(0)`} style={{ pointerEvents: 'auto' }}>
                      <rect x="-3" y="-3" width={room.width + 6} height={room.height + 6} fill="none" stroke="#d4af37" strokeWidth="1.5" strokeDasharray="3 3" />
                      <line x1={room.width/2} y1="0" x2={room.width/2} y2="-20" stroke="#d4af37" strokeWidth="1.5" />
                      <circle 
                        cx={room.width/2} 
                        cy="-20" 
                        r="5" 
                        fill="#ffffff" 
                        stroke="#d4af37" 
                        strokeWidth="1.5" 
                        style={{ cursor: 'alias' }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          startRoomRotate(room, e.clientX, e.clientY);
                        }}
                      />
                      {[
                        { id: 'tl', x: 0, y: 0, cursor: 'nwse-resize' },
                        { id: 'tc', x: room.width/2, y: 0, cursor: 'ns-resize' },
                        { id: 'tr', x: room.width, y: 0, cursor: 'nesw-resize' },
                        { id: 'ml', x: 0, y: room.height/2, cursor: 'ew-resize' },
                        { id: 'mr', x: room.width, y: room.height/2, cursor: 'ew-resize' },
                        { id: 'bl', x: 0, y: room.height, cursor: 'nesw-resize' },
                        { id: 'bc', x: room.width/2, y: room.height, cursor: 'ns-resize' },
                        { id: 'br', x: room.width, y: room.height, cursor: 'nwse-resize' },
                      ].map(h => (
                        <rect
                          key={h.id}
                          x={h.x - 4}
                          y={h.y - 4}
                          width="8"
                          height="8"
                          fill="#ffffff"
                          stroke="#d4af37"
                          strokeWidth="1.5"
                          style={{ cursor: h.cursor }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            startRoomResize(h.id, room, e.clientX, e.clientY);
                          }}
                        />
                      ))}
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* Wall Interaction Layer - clickable/hoverable walls for Wall tool */}
          {activeTool === 'wall' && connectedRooms.map(room => {
            const removedWalls = room.removedWalls || [];
            const wallDefs = [
              { name: 'top', x1: room.x, y1: room.y, x2: room.x + room.width, y2: room.y },
              { name: 'bottom', x1: room.x, y1: room.y + room.height, x2: room.x + room.width, y2: room.y + room.height },
              { name: 'left', x1: room.x, y1: room.y, x2: room.x, y2: room.y + room.height },
              { name: 'right', x1: room.x + room.width, y1: room.y, x2: room.x + room.width, y2: room.y + room.height }
            ].filter(w => !removedWalls.includes(w.name));
            return wallDefs.map(w => {
              const wallId = `${room.id}_w_${w.name}`;
              const isSelected = selectedWallId === wallId;
              const isHovered = hoveredWallId === wallId;
              return (
                <g key={wallId}>
                  {/* Wide invisible hit area for easy clicking */}
                  <line
                    x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2}
                    stroke="transparent"
                    strokeWidth="18"
                    strokeLinecap="round"
                    style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWallId(wallId);
                      setSelectedObjectId(room.id);
                      setSelectedObjectType('room');
                    }}
                  />
                  {/* Visual highlight on hover */}
                  {isHovered && !isSelected && (
                    <line
                      x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2}
                      stroke="#d4af37"
                      strokeWidth="6"
                      strokeLinecap="round"
                      opacity="0.45"
                      style={{ pointerEvents: 'none' }}
                    />
                  )}
                  {/* Selected wall highlight */}
                  {isSelected && (
                    <>
                      <line
                        x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2}
                        stroke="#d4af37"
                        strokeWidth="6"
                        strokeLinecap="round"
                        opacity="0.7"
                        style={{ pointerEvents: 'none' }}
                      />
                      <circle cx={w.x1} cy={w.y1} r="5" fill="#ffffff" stroke="#d4af37" strokeWidth="2" />
                      <circle cx={w.x2} cy={w.y2} r="5" fill="#ffffff" stroke="#d4af37" strokeWidth="2" />
                      <line x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2}
                        stroke="#d4af37" strokeWidth="2" strokeDasharray="6 4" />
                      {/* Wall label */}
                      <text x={(w.x1 + w.x2) / 2} y={(w.y1 + w.y2) / 2 - 8}
                        fill="#92400e" fontSize="9" fontWeight="bold" textAnchor="middle"
                        fontFamily="monospace" style={{ pointerEvents: 'none' }}>
                        {w.name.toUpperCase()} WALL — {room.name}
                      </text>
                    </>
                  )}
                </g>
              );
            });
          })}

          {/* Standalone Walls */}
          {walls && walls.map(wall => {
            const isSelected = selectedWallId === wall.id;
            const dx = wall.x2 - wall.x1;
            const dy = wall.y2 - wall.y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            if (length < 1) return null;
            return (
              <g key={wall.id}>
                <line
                  x1={wall.x1} y1={wall.y1} x2={wall.x2} y2={wall.y2}
                  stroke={isSelected ? '#d4af37' : '#4b5563'}
                  strokeWidth={isSelected ? 10 : 8}
                  strokeLinecap="round"
                  style={{ cursor: activeTool === 'wall' ? 'pointer' : 'default' }}
                  onClick={(e) => { e.stopPropagation(); setSelectedWallId(wall.id); }}
                  onMouseDown={(e) => { e.stopPropagation(); startWallDrag(wall.id, e.clientX, e.clientY); }}
                />
                {isSelected && (
                  <>
                    <circle cx={wall.x1} cy={wall.y1} r="4" fill="#ffffff" stroke="#d4af37" strokeWidth="2" />
                    <circle cx={wall.x2} cy={wall.y2} r="4" fill="#ffffff" stroke="#d4af37" strokeWidth="2" />
                    <line x1={wall.x1} y1={wall.y1} x2={wall.x2} y2={wall.y2}
                      stroke="#d4af37" strokeWidth="1.5" strokeDasharray="4 3" />
                  </>
                )}
              </g>
            );
          })}

          {/* Wall Drawing Preview */}
          {wallDrawStart && wallDrawEnd && (
            <line
              x1={wallDrawStart.x} y1={wallDrawStart.y}
              x2={wallDrawEnd.x} y2={wallDrawEnd.y}
              stroke="#b45309" strokeWidth="8" strokeLinecap="round"
              strokeDasharray="6 4" opacity="0.6"
            />
          )}

          {/* Door/Window Placement Preview */}
          {placementMode && placementPreview && (
            <g>
              <circle cx={placementPreview.x} cy={placementPreview.y} r="6"
                fill={placementMode === 'door' ? '#b45309' : '#2563eb'}
                stroke="#fff" strokeWidth="2" opacity="0.9" />
              <line
                x1={placementPreview.wall.x1} y1={placementPreview.wall.y1}
                x2={placementPreview.wall.x2} y2={placementPreview.wall.y2}
                stroke={placementMode === 'door' ? '#b45309' : '#2563eb'}
                strokeWidth="3" strokeDasharray="4 3" opacity="0.5"
              />
            </g>
          )}

          {/* Placement Mode Indicator */}
          {placementMode && (
            <text x="340" y="30" fill={placementMode === 'door' ? '#92400e' : '#1e40af'}
              fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace" opacity="0.8">
              Click on a wall to place {placementMode} — Press Esc to cancel
            </text>
          )}

          {/* Wall Draw Mode Indicator */}
          {activeTool === 'wall' && !wallDrawStart && (
            <text x="340" y="30" fill="#1a1a2e" fontSize="11" fontWeight="bold"
              textAnchor="middle" fontFamily="monospace" opacity="0.7">
              Click a wall to select it, or click empty space to draw — Esc to cancel
            </text>
          )}
          {activeTool === 'wall' && wallDrawStart && (
            <text x="340" y="30" fill="#c05621" fontSize="11" fontWeight="bold"
              textAnchor="middle" fontFamily="monospace" opacity="0.8">
              Click to finish wall — Esc to cancel
            </text>
          )}
        </svg>

        {/* Floating Toolbar near selected room */}
        {selectedRoom && toolbarPos && (
          <div 
            className="floating-room-toolbar"
            style={{
              left: '50%',
              bottom: 'auto',
              top: '8px',
              transform: 'translateX(-50%)',
              position: 'absolute'
            }}
          >
            <button className={`fl-tb-btn ${activeTool === 'pointer' ? 'active' : ''}`} onClick={() => setActiveTool('pointer')} title="Move">
              <Move size={14} />
              <span>Move</span>
            </button>
            <div className="fl-tb-divider"></div>
            <button className="fl-tb-btn" onClick={() => setActiveTool('pointer')} title="Resize">
              <Maximize size={14} />
              <span>Resize</span>
            </button>
            <div className="fl-tb-divider"></div>
            <button className="fl-tb-btn" onClick={onRotateSelected} title="Rotate 90°">
              <RotateCw size={14} />
              <span>Rotate</span>
            </button>
            <div className="fl-tb-divider"></div>
            <button className="fl-tb-btn" onClick={onDuplicateSelected} title="Duplicate">
              <Copy size={14} />
              <span>Duplicate</span>
            </button>
            <div className="fl-tb-divider"></div>
            <button className={`fl-tb-btn ${isLocked ? 'locked' : ''}`} onClick={handleToggleLock} title={isLocked ? 'Unlock' : 'Lock'}>
              {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
              <span>{isLocked ? 'Locked' : 'Lock'}</span>
            </button>
            <div className="fl-tb-divider"></div>
            <button className="fl-tb-btn fl-tb-delete" onClick={onDeleteSelected} title="Delete">
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        )}

        {/* Floating Toolbar for selected Door/Window */}
        {selectedDoorWindow && !draggingDoorWindow && (() => {
          const room = rooms.find(r => r.id === selectedDoorWindow.roomId);
          if (!room) return null;
          const items = selectedDoorWindow.type === 'door' ? (room.doors || []) : (room.windows || []);
          const item = items.find(i => i.id === selectedDoorWindow.itemId);
          if (!item) return null;
          const isHorizontal = item.wall === 'top' || item.wall === 'bottom';
          let itemX, itemY;
          if (isHorizontal) {
            itemX = room.x + item.offset;
            itemY = item.wall === 'top' ? room.y : room.y + room.height;
          } else {
            itemX = item.wall === 'left' ? room.x : room.x + room.width;
            itemY = room.y + item.offset;
          }
          const screenX = itemX * scale;
          const screenY = itemY * scale - 48;
          return (
            <div
              className="floating-room-toolbar"
              style={{
                left: `${screenX}px`,
                top: `${Math.max(screenY, 8)}px`,
                transform: 'translateX(-50%)',
                position: 'absolute',
                zIndex: 20
              }}
            >
              <button className="fl-tb-btn" onClick={rotateDoorWindow} title="Rotate to next wall">
                <RotateCw size={14} />
                <span>Rotate</span>
              </button>
              <div className="fl-tb-divider"></div>
              <button className="fl-tb-btn" onClick={duplicateDoorWindow} title="Duplicate">
                <Copy size={14} />
                <span>Duplicate</span>
              </button>
              <div className="fl-tb-divider"></div>
              <button className="fl-tb-btn fl-tb-delete" onClick={onDeleteSelected} title="Delete">
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </div>
          );
        })()}

        {/* Bottom Selection Bar (simplified) */}
        <div className="canvas-selection-toolbar">
          <button className="sel-tb-btn" onClick={onRotateSelected} title="Rotate Selected 90°">
            <RotateCw size={14} />
            <span>Rotate</span>
          </button>
          <button className="sel-tb-btn" onClick={onDuplicateSelected} title="Duplicate Selected">
            <Copy size={14} />
            <span>Duplicate</span>
          </button>
          <button className="sel-tb-btn" onClick={onDeleteSelected} style={{ color: '#f87171' }} title="Delete Selected">
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>

        {/* Mini-Map */}
        <div className="canvas-minimap-box" title="Live Scaled Blueprint Overview Mini-Map">
          <div className="minimap-preview-inner" style={{ background: '#F7F8FA', border: '1px solid #d1d5db' }}>
            <svg width="100%" height="100%" viewBox="0 0 700 550">
              {connectedRooms.map(room => (
                <rect 
                  key={room.id}
                  x={room.x} 
                  y={room.y} 
                  width={room.width} 
                  height={room.height} 
                  fill="rgba(59,130,246,0.06)" 
                  stroke="#9ca3af" 
                  strokeWidth="2" 
                />
              ))}
              {connectedWalls.map(wall => (
                <line 
                  key={wall.id}
                  x1={wall.x1} 
                  y1={wall.y1} 
                  x2={wall.x2} 
                  y2={wall.y2} 
                  stroke="#374151" 
                  strokeWidth={4} 
                />
              ))}
            </svg>
            <div className="minimap-viewport-rect" style={{ border: '1px solid #d4af37', background: 'rgba(212,175,55,0.08)' }}></div>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="canvas-zoom-controls">
          <button className="hdr-icon-btn" title="Pan Canvas"><Compass size={14} /></button>
          <button className="hdr-icon-btn" onClick={() => setZoomLevel(Math.min(200, zoomLevel + 15))} title="Zoom In"><Plus size={14} /></button>
          <button className="hdr-icon-btn" onClick={() => setZoomLevel(Math.max(50, zoomLevel - 15))} title="Zoom Out"><Minus size={14} /></button>
          <button className="hdr-icon-btn" onClick={() => setZoomLevel(100)} title="Fit View"><Maximize2 size={14} /></button>
        </div>
      </div>
    </section>
  );
}
