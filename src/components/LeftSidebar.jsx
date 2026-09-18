import React, { useState, useMemo, useEffect } from 'react';
import { 
  MousePointer, SquareDashedBottom, Box, DoorOpen, 
  AppWindow, Navigation, Armchair, Trash2, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, Layout, Home, Building, ShoppingBag
} from 'lucide-react';

// Import room library functions
import { getRoomPalette, getRoomCategories, getBuildingTypes } from '../room-library.js';

export default function LeftSidebar({ 
  activeTool, 
  setActiveTool, 
  onDeleteSelected, 
  onDuplicateSelected, 
  onStartDoorPlacement, 
  onStartWindowPlacement,
  buildingCategory = 'Residential',
  buildingType = 'Single-Family Villa',
  commercialType = 'Office Building'
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({});

  // Get room palette for current building type
  const roomPalette = useMemo(() => {
    return getRoomPalette(buildingCategory, buildingType, commercialType);
  }, [buildingCategory, buildingType, commercialType]);

  const roomCategories = useMemo(() => {
    return getRoomCategories();
  }, []);

  // Group rooms by category
  const groupedRooms = useMemo(() => {
    const grouped = {};
    roomPalette.forEach(room => {
      const cat = room.category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(room);
    });
    return grouped;
  }, [roomPalette]);

  // Sort categories by order
  const sortedCategories = useMemo(() => {
    return Object.keys(groupedRooms).sort((a, b) => {
      const orderA = roomCategories[a]?.order || 99;
      const orderB = roomCategories[b]?.order || 99;
      return orderA - orderB;
    });
  }, [groupedRooms, roomCategories]);

  // Default expand all categories on first load
  useEffect(() => {
    if (Object.keys(expandedCategories).length === 0 && roomPalette.length > 0) {
      const initial = {};
      roomPalette.forEach(room => {
        initial[room.category || 'other'] = true;
      });
      setExpandedCategories(initial);
    }
  }, [roomPalette, expandedCategories]);

  const toolsList = [
    { id: 'pointer', label: 'Select', icon: MousePointer },
    { id: 'wall', label: 'Wall', icon: SquareDashedBottom },
    { id: 'room', label: 'Room', icon: Box },
    { id: 'door', label: 'Door', icon: DoorOpen },
    { id: 'window', label: 'Window', icon: AppWindow },
    { id: 'staircase', label: 'Staircase', icon: Navigation },
    { id: 'furniture', label: 'Furniture', icon: Armchair },
    { id: 'delete', label: 'Delete', icon: Trash2 },
  ];

  const handleToolClick = (toolId) => {
    if (toolId === 'delete') { onDeleteSelected(); return; }
    if (toolId === 'door') { onStartDoorPlacement(); return; }
    if (toolId === 'window') { onStartWindowPlacement(); return; }
    setActiveTool(toolId);
  };

  const handleDragStart = (e, toolId) => {
    e.dataTransfer.setData('text/plain', toolId);
  };

  const handlePaletteRoomDrag = (e, roomKey, roomLabel, roomIcon) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'room',
      roomKey,
      roomLabel,
      roomIcon
    }));
  };

  const toggleCategory = (categoryKey) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  // Building type badge label
  const buildingTypeLabel = buildingCategory === 'Commercial' 
    ? `${buildingCategory} - ${commercialType}`
    : `${buildingCategory} - ${buildingType}`;

  return (
    <aside className={`sidebar-left-tools ${collapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-tools-header">
        {!collapsed && <span>TOOLS</span>}
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
          title={collapsed ? 'Expand Tools' : 'Collapse Tools'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Tools List */}
      <div className="sidebar-tools-list">
        {toolsList.map(tool => {
          const IconComp = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              className={`tool-item-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleToolClick(tool.id)}
              draggable
              onDragStart={(e) => handleDragStart(e, tool.id)}
              title={tool.label}
            >
              <IconComp size={16} />
              {!collapsed && <span>{tool.label}</span>}
            </button>
          );
        })}
      </div>
    </aside>
  );
}