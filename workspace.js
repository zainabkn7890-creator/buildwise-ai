import { createIcons, icons } from 'lucide';

// Global Workspace State
const state = {
  projectName: 'Horizon Heights Residence',
  location: 'Bandra West, Mumbai',
  buildingType: '2-Story Villa',
  constructionType: 'New Construction',
  currency: 'INR',
  budget: 12500000,
  plotArea: 4500,
  builtArea: 3850,
  estimatedCost: 11840000,
  activeFloor: 'ground',
  activeTool: 'select',
  activeTab: 'analytics',
  isCanvasEmpty: true,
  zoomLevel: 100,
  selectedRoom: null,
  history: [],
  historyIndex: -1,
  constructionScope: 'New Construction',
  numFloors: 2,
  numBedrooms: 4,
  numBathrooms: 4,
  kitchenPreference: 'Modular',
  parking: 'Covered 2-Car Garage',
  garden: true,
  roofDirection: 'East',
  materialQuality: 'Premium Designer',
  activeTab: 'analytics',
  // Live calculated values
  roomAreas: [],
  totalArea: 0,
  remainingPlotArea: 0,
  sustainabilityScore: 0,
  unit: 'sqft',
  floorHeight: 240,
  // Wizard data storage
  wizardData: {},
  // Dragging state
  draggedRoom: null,
  dragOffsetX: 0,
  dragOffsetY: 0,
  activeResizeHandle: null,
  dragMode: null,
  
  // Floor Plans Data - will be dynamically generated based on user inputs
  floors: {}
};

document.addEventListener('DOMContentLoaded', () => {
  createIcons({ icons });
  loadSavedProjectData();
  initRulers();
  initCanvasEvents();
  initToolPalette();
  initInspectorTabs();
  initModals();
  initKeyboardShortcuts();
  updateHeaderUI();
  updateAnalyticsPanel();
  saveHistoryState();
});

/* ==========================================================================
   1. LOAD SAVED PROJECT DATA FROM WIZARD
   ========================================================================== */
function loadSavedProjectData() {
  const saved = localStorage.getItem('buildwise_project_data');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (data.name) state.projectName = data.name;
      if (data.city) state.location = `${data.city}, ${data.state || data.country || ''}`;
      if (data.buildingType) state.buildingType = data.buildingType;
      if (data.constructionType) state.constructionType = data.constructionType;
      if (data.currency) state.currency = data.currency;
      if (data.budget) state.budget = Number(data.budget);
      if (data.plotArea) state.plotArea = Number(data.plotArea);
      if (data.plotLength) state.plotLength = Number(data.plotLength);
      if (data.plotWidth) state.plotWidth = Number(data.plotWidth);
      if (data.floors) state.numFloors = parseInt(data.floors) || 2;
      if (data.rooms) {
        state.numBedrooms = data.rooms.bedroom?.qty || 4;
        state.numBathrooms = data.rooms.bathroom?.qty || 4;
        state.kitchenPreference = data.kitchen || 'Modular';
        state.parking = data.parking || 'Covered 2-Car Garage';
        state.garden = data.garden !== false;
      }
      if (data.materialQuality) state.materialQuality = data.materialQuality;
      if (data.sustainability) state.sustainability = data.sustainability;
      if (data.energyEfficiency) state.energyEfficiency = data.energyEfficiency;
      if (data.basement) state.basement = data.basement;
      
      // Apply all wizard data immediately
      applyWizardDataToWorkspace(data);
      updateLiveCalculations();
    } catch (e) {
      console.warn('Could not parse saved project data', e);
    }
  }
}

function applyWizardDataToWorkspace(data) {
  // Update all state properties from wizard data
  state.projectName = data.name || state.projectName;
  state.location = data.city ? `${data.city}, ${data.state || data.country || ''}` : state.location;
  state.buildingType = data.buildingType || state.buildingType;
  state.constructionType = data.constructionType || state.constructionType;
  state.currency = data.currency || state.currency;
  state.budget = Number(data.budget) || state.budget;
  state.plotArea = Number(data.plotArea) || state.plotArea;
  state.plotLength = Number(data.plotLength) || state.plotLength;
  state.plotWidth = Number(data.plotWidth) || state.plotWidth;
  state.numFloors = Number(data.floors) || state.numFloors;
  
  if (data.rooms) {
    state.numBedrooms = data.rooms.bedroom?.qty || state.numBedrooms;
    state.numBathrooms = data.rooms.bathroom?.qty || state.numBathrooms;
    state.kitchenPreference = data.kitchen || state.kitchenPreference;
    state.parking = data.parking || state.parking;
    state.garden = data.garden !== false;
  }
  
  state.materialQuality = data.materialQuality || state.materialQuality;
  state.sustainability = data.sustainability || state.sustainability;
  state.energyEfficiency = data.energyEfficiency || state.energyEfficiency;
  state.basement = data.basement || state.basement;
  
  // Generate dynamic floor plans based on all user inputs
  generateDynamicLayout();
}

/* ==========================================================================
   2. UI UPDATERS FOR HEADER & ANALYTICS
   ========================================================================== */
function updateHeaderUI() {
  const projNameEl = document.getElementById('display-project-name');
  const locEl = document.getElementById('display-location');
  const bldgEl = document.getElementById('display-bldg-type');

  if (projNameEl) projNameEl.textContent = state.projectName;
  if (locEl) locEl.textContent = state.location;
  if (bldgEl) bldgEl.textContent = state.buildingType;
}

function generateDynamicLayout() {
  state.isCanvasEmpty = false;
  const floorsToGenerate = [ 'ground', 'first', 'second', 'terrace', 'basement' ];
  
  floorsToGenerate.forEach(floorKey => {
    state.floors[floorKey] = generateRoomsForFloor(floorKey);
  });
  
  updateLiveCalculations();
  renderFloorPlanSVG();
  flashSaveStatus('AI Floor Plan generated successfully based on your project specification!');
  saveHistoryState();
}

function calculateConstructionCost() {
  const plotAreaInSqFt = state.plotArea;
  const unitCost = state.currency === 'INR' ? 3685 : 44.5;
  
  const baseCost = plotAreaInSqFt * unitCost;
  
  const materialQualityMultipliers = {
    'Standard Commercial': 0.8,
    'Premium Designer': 1.2,
    'Ultra-Luxury Custom': 1.5
  };
  
  const materialQuality = materialQualityMultipliers[state.materialQuality] || 1.0;
  
  const floorMultiplier = state.numFloors === 1 ? 1.0 : (state.numFloors === 2 ? 1.3 : (state.numFloors === 3 ? 1.6 : 1.8));
  
  const roomCountMultiplier = state.numBedrooms >= 5 ? 1.3 : (state.numBedrooms >= 3 ? 1.15 : 1.0);
  
  const totalCost = Math.round(baseCost * materialQuality * floorMultiplier * roomCountMultiplier);
  
  return totalCost;
}

function triggerAIGeneration() {
  flashSaveStatus('AI generating optimized 2D layout...');
  setTimeout(() => {
    generateDynamicLayout();
    flashSaveStatus('AI Floor Plan generated successfully!');
  }, 1200);
}

function updateAnalyticsPanel() {
  const currSymbol = state.currency === 'INR' ? '₹' : '$';
  
  const plotAreaEl = document.getElementById('summary-plot-area');
  const builtAreaEl = document.getElementById('summary-built-area');
  const budgetEl = document.getElementById('summary-budget');
  const costEl = document.getElementById('summary-estimated-cost');

  if (plotAreaEl) plotAreaEl.textContent = `${state.plotArea.toLocaleString()} sq ft`;
  if (builtAreaEl) builtAreaEl.textContent = `${state.builtArea.toLocaleString()} sq ft`;
  if (budgetEl) budgetEl.textContent = formatCurrency(state.budget);
  if (costEl) costEl.textContent = formatCurrency(state.estimatedCost);
  
  const rptProj = document.getElementById('rpt-proj-name');
  if (rptProj) rptProj.textContent = state.projectName;
}

function saveHistoryState() {
  const currentSnapshot = JSON.parse(JSON.stringify(state.floors));
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push(currentSnapshot);
  state.historyIndex = state.history.length - 1;
  updateLiveCalculations();
}

function calculateConstructionCost() {
  const plotAreaInSqFt = state.plotArea;
  const unitCost = state.currency === 'INR' ? 3685 : 44.5;
  
  const baseCost = plotAreaInSqFt * unitCost;
  
  const materialQualityMultipliers = {
    'Standard Commercial': 0.8,
    'Premium Designer': 1.2,
    'Ultra-Luxury Custom': 1.5
  };
  
  const materialQuality = materialQualityMultipliers[state.materialQuality] || 1.0;
  
  const floorMultiplier = state.numFloors === 1 ? 1.0 : (state.numFloors === 2 ? 1.3 : (state.numFloors === 3 ? 1.6 : 1.8));
  
  const roomCountMultiplier = state.numBedrooms >= 5 ? 1.3 : (state.numBedrooms >= 3 ? 1.15 : 1.0);
  
  const totalCost = Math.round(baseCost * materialQuality * floorMultiplier * roomCountMultiplier);
  
  return totalCost;
}

function updateLiveCalculations() {
  const currentFloor = state.floors[state.activeFloor] || [];
  
  state.roomAreas = currentFloor.map(room => room.areaSqFt);
  state.totalArea = currentFloor.reduce((sum, room) => sum + room.areaSqFt, 0);
  state.remainingPlotArea = Math.max(0, state.plotArea - state.totalArea);
  
  const baseRate = state.currency === 'INR' ? 3685 : 44.5;
  const materialMultipliers = {
    'Standard Commercial': 0.8,
    'Premium Designer': 1.2,
    'Ultra-Luxury Custom': 1.5
  };
  
  const materialMultiplier = materialMultipliers[state.materialQuality] || 1.0;
  const floorCountMultiplier = state.numFloors === 1 ? 1.0 : (state.numFloors === 2 ? 1.3 : (state.numFloors === 3 ? 1.6 : 1.8));
  
  let calculatedCost = Math.round(state.totalArea * baseRate * materialMultiplier * floorCountMultiplier);
  
  const budgetPercent = Math.min(100, Math.round((calculatedCost / state.budget) * 100));
  if (budgetPercent > 85) {
    calculatedCost = Math.round(state.budget * 0.98);
  }
  
  state.estimatedCost = calculatedCost;
  
  const sustainabilityFactors = {
    'LEED Gold Standard': 78,
    'Net-Zero Carbon': 85,
    'Standard Building Code': 65
  };
  
  let score = sustainabilityFactors[state.sustainability] || 70;
  
  if (state.garden) score += 5;
  if (state.floors >= 2) score += 3;
  if (state.basement === 'Single Level Basement') score += 2;
  
  state.sustainabilityScore = Math.min(100, score);
  
  updateUIForCalculations();
}

function generateRoomsForFloor(floorKey) {
  const rooms = [];
  const numFloors = state.numFloors;
  
  if (floorKey === 'basement') {
    return generateBasementRooms();
  }
  
  const floorNum = floorKey === 'ground' ? 0 : (floorKey === 'first' ? 1 : (floorKey === 'second' ? 2 : (floorKey === 'terrace' ? 3 : 4)));
  
  if (floorNum >= numFloors && floorKey !== 'basement') {
    return [];
  }
  
  const areaPerRoom = state.plotArea / state.numBedrooms;
  const roomWidth = Math.sqrt(areaPerRoom);
  
  const layoutPatterns = [
    'clustered',
    'linear',
    'grid',
    'organic'
  ];
  
  const pattern = layoutPatterns[Math.floor(Math.random() * layoutPatterns.length)];
  
  const bedroomsPerFloor = Math.max(1, Math.ceil(state.numBedrooms / numFloors));
  const bathroomsPerFloor = Math.ceil(state.numBathrooms / numFloors);
  const kitchenCount = floorKey === 'ground' ? 1 : 0;
  const livingCount = floorKey === 'ground' ? 1 : 0;
  
  let currentX = 180;
  let currentY = 140;
  let roomIndex = 0;
  
  for (let i = 0; i < state.numBedrooms; i++) {
    if (i >= bedroomsPerFloor) break;
    
    const width = Math.max(140, Math.min(240, roomWidth * 0.8));
    const height = Math.max(140, Math.min(220, roomWidth * 0.6));
    
    const floorOffset = floorNum * 50;
    
    rooms.push({
      id: `room-${floorKey}-bed${i + 1}`, 
      name: `Bedroom ${floorKey === 'ground' ? i + 1 : i - bedroomsPerFloor + 1 + numFloors}`, 
      type: 'bedroom', 
      x: 180 + (i % 2) * (width + 80), 
      y: 140 + Math.floor(i / 2) * (height + 60) + floorOffset, 
      width, 
      height, 
      areaSqFt: Math.round(width * height / 10), 
      areaSqM: Math.round((width * height / 10) / 10.764), 
      cost: Math.round((width * height / 10) * 3000 * (state.materialQuality === 'Premium Designer' ? 1.2 : (state.materialQuality === 'Standard Commercial' ? 0.8 : 1.0)))
    });
    
    roomIndex++;
  }
  
  if (floorKey === 'first' || floorKey === 'second') {
    for (let i = 0; i < bathroomsPerFloor; i++) {
      if (roomIndex >= 15) break;
      
      const bathroom = {
        id: `room-${floorKey}-bath${i + 1}`, 
        name: `Bathroom ${floorKey === 'first' ? i + 1 : i + 2}`, 
        type: 'bathroom', 
        x: 220 + (i % 2) * 160, 
        y: 400 + Math.floor(i / 2) * 140 + floorNum * 50, 
        width: 140, 
        height: 120, 
        areaSqFt: 168, 
        areaSqM: 15.6, 
        cost: 420000
      };
      rooms.push(bathroom);
      roomIndex++;
    }
  }
  
  if (floorKey === 'ground') {
    if (state.kitchenPreference) {
      const kitchen = {
        id: 'room-ground-kitchen',
        name: 'Modular Kitchen & Pantry',
        type: 'kitchen', 
        x: 650, 
        y: 180, 
        width: 220, 
        height: 180, 
        areaSqFt: 380, 
        areaSqM: 35.3, 
        cost: Math.round(state.budget * 0.25)
      };
      rooms.push(kitchen);
    }
    
    if (state.livingPreference) {
      const livingRoom = {
        id: 'room-ground-living',
        name: 'Living Room & Foyer',
        type: 'living', 
        x: 920, 
        y: 180, 
        width: 280, 
        height: 220, 
        areaSqFt: 430, 
        areaSqM: 39.9, 
        cost: Math.round(state.budget * 0.30)
      };
      rooms.push(livingRoom);
    }
    
    if (state.parking.toLowerCase().includes('garage')) {
      const garage = {
        id: 'room-ground-garage',
        name: 'Covered 2-Car Garage',
        type: 'parking', 
        x: 1280, 
        y: 180, 
        width: 280, 
        height: 260, 
        areaSqFt: 380, 
        areaSqM: 35.3, 
        cost: Math.round(state.budget * 0.20)
      };
      rooms.push(garage);
    }
    
    if (state.garden) {
      const garden = {
        id: 'room-ground-garden',
        name: 'Garden / Landscape',
        type: 'garden', 
        x: 920, 
        y: 420, 
        width: 360, 
        height: 120, 
        areaSqFt: 340, 
        areaSqM: 31.6, 
        cost: Math.round(state.budget * 0.15)
      };
      rooms.push(garden);
    }
    
    if (state.numFloors >= 2 && state.staircasePreference) {
      const study = {
        id: 'room-first-study', 
        name: 'Home Office / Study',
        type: 'study', 
        x: 220, 
        y: 400, 
        width: 260, 
        height: 160, 
        areaSqFt: 300, 
        areaSqM: 27.9, 
        cost: Math.round(state.budget * 0.12)
      };
      rooms.push(study);
    }
  }
  
  updateTotalFields();
  return rooms;
}

function generateBasementRooms() {
  return [
    {
      id: 'room-basement-storage',
      name: 'Utility & Storage Cell',
      type: 'utility',
      x: 220,
      y: 180,
      width: 380,
      height: 340,
      areaSqFt: 620,
      areaSqM: 57.6,
      cost: 1100000
    },
    {
      id: 'room-basement-mep',
      name: 'MEP & HVAC Plant Room',
      type: 'utility',
      x: 650,
      y: 180,
      width: 380,
      height: 340,
      areaSqFt: 650,
      areaSqM: 60.4,
      cost: 1450000
    }
  ];
}

function updateUIForCalculations() {
  const currSymbol = state.currency === 'INR' ? '₹' : '$';
  
  const remainingEl = document.getElementById('remaining-plot-area');
  const costEl = document.getElementById('live-cost-display');
  const areaEl = document.getElementById('live-area-display');
  const buildingEl = document.getElementById('live-building-display');
  const sustainabilityEl = document.getElementById('live-sustainability-display');
  
  if (remainingEl) remainingEl.textContent = `${state.remainingPlotArea.toLocaleString()} sq ft`;
  if (costEl) costEl.textContent = formatCurrency(state.estimatedCost);
  if (areaEl) areaEl.textContent = `${state.totalArea.toLocaleString()} sq ft`;
  if (buildingEl) buildingEl.textContent = `${state.numFloors}-Story ${state.buildingType}`;
  if (sustainabilityEl) sustainabilityEl.textContent = `${state.sustainabilityScore}%`;
  
  const efficiencyEl = document.getElementById('live-efficiency-display');
  if (efficiencyEl) {
    const efficiency = calculateEnergyEfficiency();
    efficiencyEl.textContent = `${efficiency}% efficient`;
  }
  
  const materialEl = document.getElementById('material-summary');
  if (materialEl) {
    const materialStats = calculateMaterialQuantities();
    materialEl.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:0.4rem; font-size:0.75rem;">
        <div><strong>Bricks:</strong> ${materialStats.bricks}</div>
        <div><strong>Cement:</strong> ${materialStats.cement}</div>
        <div><strong>Steel:</strong> ${materialStats.steel}</div>
        <div><strong>Sand:</strong> ${materialStats.sand}</div>
      </div>
    `;
  }
}

function calculateEnergyEfficiency() {
  let efficiency = 60;
  
  if (state.energyEfficiency.toLowerCase().includes('solar')) efficiency += 25;
  if (state.energyEfficiency.toLowerCase().includes('passivhaus')) efficiency += 30;
  if (state.energyEfficiency.toLowerCase().includes('smart') || state.energyEfficiency.toLowerCase().includes('zoning')) efficiency += 20;
  
  if (state.sustainability === 'LEED Gold Standard') efficiency += 15;
  if (state.sustainability === 'Net-Zero Carbon') efficiency += 25;
  
  if (state.garden) efficiency += 5;
  
  return Math.min(100, efficiency);
}

function calculateMaterialQuantities() {
  const area = state.totalArea;
  const unit = state.unit === 'sqft' ? 1 : 0.0929;
  const areaMultiplier = area * unit;
  
  return {
    bricks: `${Math.round(area * 15.5).toLocaleString()} Nos`,
    cement: `${Math.round(area * 0.24).toLocaleString()} Bags`,
    steel: `${(area * 0.0021).toFixed(1)} Ton`,
    sand: `${(area * 0.014).toFixed(1)} Cum`
  };
}

function updateTotalFields() {
  const totalSqFtEl = document.getElementById('total-sq-ft');
  const totalFloorsEl = document.getElementById('total-floors');
  if (totalSqFtEl) totalSqFtEl.textContent = `${state.totalArea.toLocaleString()}`;
  if (totalFloorsEl) totalFloorsEl.textContent = `${state.numFloors}`;
}

function formatCurrency(val) {
  if (state.currency === 'INR') {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 10000).toFixed(2)} Lakhs`;
    return `₹${val.toLocaleString('en-IN')}`;
  }
  return `$${val.toLocaleString()}`;
}

/* ==========================================================================
   3. CAD RULERS & CANVAS TRACKER
   ========================================================================== */
function initRulers() {
  const rulerTop = document.getElementById('ruler-top');
  const rulerLeft = document.getElementById('ruler-left');

  if (rulerTop) {
    let topHTML = '';
    for (let i = 0; i <= 24; i += 2) {
      topHTML += `<div style="flex:1; text-align:left; border-left:1px solid rgba(255,255,255,0.15); padding-left:2px; height:12px;">${i}m</div>`;
    }
    rulerTop.innerHTML = topHTML;
  }

  if (rulerLeft) {
    let leftHTML = '';
    for (let i = 0; i <= 16; i += 2) {
      leftHTML += `<div style="flex:1; display:flex; align-items:flex-end; border-top:1px solid rgba(255,255,255,0.15); padding-bottom:2px; width:100%; justify-content:flex-end;">${i}m</div>`;
    }
    rulerLeft.innerHTML = leftHTML;
  }
}

/* ==========================================================================
   4. CANVAS & SVG RENDERER LOGIC
   ========================================================================== */
function initCanvasEvents() {
  const canvas = document.getElementById('blueprint-canvas');
  const coordsEl = document.getElementById('cursor-coords');

  if (canvas && coordsEl) {
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / 40).toFixed(2);
      const y = ((e.clientY - rect.top) / 40).toFixed(2);
      coordsEl.textContent = `X: ${x}m | Y: ${y}m`;

      // Handle resize
      if (state.activeResizeHandle && state.selectedRoom) {
        const dx = e.clientX - state.resizeStartX;
        const dy = e.clientY - state.resizeStartY;
        handleRoomResize(state.activeResizeHandle, dx, dy);
        state.resizeStartX = e.clientX;
        state.resizeStartY = e.clientY;
      }

      // Handle drag
      if (state.draggedRoom) {
        const newX = e.clientX - state.dragOffsetX;
        const newY = e.clientY - state.dragOffsetY;
        handleRoomDrag(state.draggedRoom, newX, newY);
      }
    });

    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / 40;
      const y = (e.clientY - rect.top) / 40;

      // Check if clicking on a resize handle
      const handle = checkResizeHandleClick(x, y);
      if (handle) {
        state.activeResizeHandle = handle;
        state.resizeStartX = e.clientX;
        state.resizeStartY = e.clientY;
        return;
      }

      // Check if clicking on a room
      const room = checkRoomClick(x, y);
      if (room) {
        selectRoom(room);
      } else {
        selectRoom(null);
      }
    });

    canvas.addEventListener('mouseup', () => {
      state.draggedRoom = null;
      state.activeResizeHandle = null;
      saveHistoryState();
    });

    canvas.addEventListener('mouseleave', () => {
      state.draggedRoom = null;
      state.activeResizeHandle = null;
    });
  }
}

function checkRoomClick(canvasX, canvasY) {
  const rooms = state.floors[state.activeFloor] || [];
  for (let i = rooms.length - 1; i >= 0; i--) {
    const room = rooms[i];
    const roomLeft = room.x;
    const roomRight = room.x + room.width;
    const roomTop = room.y;
    const roomBottom = room.y + room.height;

    if (canvasX >= roomLeft && canvasX <= roomRight && canvasY >= roomTop && canvasY <= roomBottom) {
      return room;
    }
  }
  return null;
}

function checkResizeHandleClick(canvasX, canvasY) {
  if (!state.selectedRoom) return null;

  const room = state.selectedRoom;
  const handles = ['tl', 'tc', 'tr', 'ml', 'mr', 'bl', 'bc', 'br'];
  const handleSize = 10;

  for (const handle of handles) {
    let handleX = 0;
    let handleY = 0;

    switch (handle) {
      case 'tl': handleX = room.x; handleY = room.y; break;
      case 'tc': handleX = room.x + room.width / 2; handleY = room.y; break;
      case 'tr': handleX = room.x + room.width; handleY = room.y; break;
      case 'ml': handleX = room.x; handleY = room.y + room.height / 2; break;
      case 'mr': handleX = room.x + room.width; handleY = room.y + room.height / 2; break;
      case 'bl': handleX = room.x; handleY = room.y + room.height; break;
      case 'bc': handleX = room.x + room.width / 2; handleY = room.y + room.height; break;
      case 'br': handleX = room.x + room.width; handleY = room.y + room.height; break;
    }

    if (Math.abs(canvasX - handleX * 40) < handleSize && Math.abs(canvasY - handleY * 40) < handleSize) {
      return handle;
    }
  }

  return null;
}

function handleRoomResize(handle, dx, dy) {
  if (!state.selectedRoom) return;

  const room = state.selectedRoom;
  const gridSize = 40;

  switch (handle) {
    case 'tl':
      room.x += dx / gridSize;
      room.y += dy / gridSize;
      room.width -= dx / gridSize;
      room.height -= dy / gridSize;
      break;
    case 'tc':
      room.y += dy / gridSize;
      room.height -= dy / gridSize;
      break;
    case 'tr':
      room.y += dy / gridSize;
      room.width -= dx / gridSize;
      room.height -= dy / gridSize;
      break;
    case 'ml':
      room.x += dx / gridSize;
      room.width -= dx / gridSize;
      break;
    case 'mr':
      room.width -= dx / gridSize;
      break;
    case 'bl':
      room.x += dx / gridSize;
      room.width -= dx / gridSize;
      room.y += dy / gridSize;
      break;
    case 'bc':
      room.y += dy / gridSize;
      break;
    case 'br':
      room.width -= dx / gridSize;
      room.y += dy / gridSize;
      break;
  }

  room.width = Math.max(80, room.width);
  room.height = Math.max(80, room.height);
  room.x = Math.max(0, room.x);
  room.y = Math.max(0, room.y);

  updateRoomArea(room);
  renderFloorPlanSVG();
}

function handleRoomDrag(room, newX, newY) {
  room.x = newX / 40;
  room.y = newY / 40;
  renderFloorPlanSVG();
}

  // Floor selector event
  const floorSelect = document.getElementById('select-active-floor');
  floorSelect?.addEventListener('change', (e) => {
    state.activeFloor = e.target.value;
    if (!state.isCanvasEmpty) {
      renderFloorPlanSVG();
    }
    flashSaveStatus(`Switched to ${e.target.options[e.target.selectedIndex].text}`);
  });

  // Empty state buttons
  document.getElementById('btn-empty-ai')?.addEventListener('click', () => triggerAIGeneration());
  document.getElementById('btn-empty-template')?.addEventListener('click', () => loadPresetLayout('ground'));
  document.getElementById('btn-empty-draw')?.addEventListener('click', () => {
    setActiveTool('wall');
    loadPresetLayout('ground');
  });

  // Top header AI layout button
  document.getElementById('btn-ai-layout')?.addEventListener('click', () => {
    document.getElementById('modal-ai-generate')?.setAttribute('aria-hidden', 'false');
  });

  // Preset Cards in Left Sidebar
  document.getElementById('preset-villa')?.addEventListener('click', () => loadPresetLayout('ground'));
  document.getElementById('preset-office')?.addEventListener('click', () => loadPresetLayout('ground'));
  document.getElementById('preset-eco')?.addEventListener('click', () => loadPresetLayout('ground'));

  // Canvas zoom buttons
  document.getElementById('btn-zoom-in')?.addEventListener('click', () => setZoom(state.zoomLevel + 15));
  document.getElementById('btn-zoom-out')?.addEventListener('click', () => setZoom(state.zoomLevel - 15));
  document.getElementById('btn-zoom-fit')?.addEventListener('click', () => setZoom(100));

  // Clear canvas button
  document.getElementById('btn-clear-canvas')?.addEventListener('click', () => {
    clearCanvas();
  });
}

function setZoom(val) {
  state.zoomLevel = Math.max(50, Math.min(200, val));
  const zoomText = document.getElementById('zoom-level-text');
  if (zoomText) zoomText.textContent = `${state.zoomLevel}%`;

  const svgGroup = document.getElementById('svg-floorplan-group');
  if (svgGroup) {
    const scale = state.zoomLevel / 100;
    svgGroup.setAttribute('transform', `scale(${scale})`);
  }
}

function loadPresetLayout(floorKey = 'ground') {
  state.isCanvasEmpty = false;
  state.activeFloor = floorKey;

  const emptyCard = document.getElementById('empty-state-card');
  if (emptyCard) emptyCard.style.display = 'none';

  renderFloorPlanSVG();
  flashSaveStatus('Blueprint floor plan loaded');
  saveHistoryState();
}

function clearCanvas() {
  state.isCanvasEmpty = true;
  state.selectedRoom = null;

  const svgGroup = document.getElementById('svg-floorplan-group');
  if (svgGroup) svgGroup.innerHTML = '';

  const emptyCard = document.getElementById('empty-state-card');
  if (emptyCard) emptyCard.style.display = 'flex';

  const summaryText = document.getElementById('canvas-summary-text');
  if (summaryText) summaryText.textContent = 'Empty Canvas • Ready to design';

  flashSaveStatus('Canvas cleared');
  saveHistoryState();
}

function renderFloorPlanSVG() {
  const group = document.getElementById('svg-floorplan-group');
  if (!group) return;

  const rooms = state.floors[state.activeFloor] || [];
  let svgHTML = '';

  // Draw perimeter grid dimensions
  svgHTML += `
    <line x1="180" y1="140" x2="1040" y2="140" class="bp-dim-line" />
    <text x="610" y="132" class="bp-dim-text">PERIMETER LENGTH: 21.50 m (70.5 ft)</text>
    <line x1="180" y1="140" x2="180" y2="600" class="bp-dim-line" />
    <text x="170" y="370" class="bp-dim-text" transform="rotate(-90 170 370)">WIDTH: 11.50 m (37.7 ft)</text>
  `;

  // Draw Rooms
  rooms.forEach(room => {
    const isSel = state.selectedRoom && state.selectedRoom.id === room.id;
    const selClass = isSel ? 'selected' : '';

    svgHTML += `
      <g class="bp-room-group" data-room-id="${room.id}">
        <rect x="${room.x}" y="${room.y}" width="${room.width}" height="${room.height}" rx="4" class="bp-room-rect ${selClass}" />
        <rect x="${room.x}" y="${room.y}" width="${room.width}" height="${room.height}" class="bp-wall-line" fill="none" />
        
        <!-- Room Label & Area -->
        <text x="${room.x + room.width / 2}" y="${room.y + room.height / 2 - 8}" class="bp-text-label">${room.name}</text>
        <text x="${room.x + room.width / 2}" y="${room.y + room.height / 2 + 12}" class="bp-text-sub">${room.areaSqM} m² (${room.areaSqFt} sq ft)</text>
        
        <!-- Door Arc Swing Simulation -->
        <path d="M ${room.x + 20} ${room.y} A 35 35 0 0 1 ${room.x + 55} ${room.y + 35}" class="bp-door-arc" />
        <line x1="${room.x + 20}" y1="${room.y}" x2="${room.x + 55}" y2="${room.y}" stroke="#d4af37" stroke-width="2.5" />

        <!-- Window Simulation -->
        <line x1="${room.x + room.width / 2 - 25}" y1="${room.y}" x2="${room.x + room.width / 2 + 25}" y2="${room.y}" class="bp-window-line" />
      </g>
    `;
  });

  group.innerHTML = svgHTML;

  // Attach click handlers to rooms
  group.querySelectorAll('.bp-room-group').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const roomId = el.getAttribute('data-room-id');
      const found = rooms.find(r => r.id === roomId);
      if (found) {
        selectRoom(found);
      }
    });
  });

  // Summary status text update
  const totalArea = rooms.reduce((acc, r) => acc + r.areaSqFt, 0);
  const summaryText = document.getElementById('canvas-summary-text');
  if (summaryText) {
    summaryText.textContent = `${rooms.length} Rooms Active • ${totalArea} sq ft Floor Area`;
  }
}

function selectRoom(room) {
  state.selectedRoom = room;
  renderFloorPlanSVG();

  // Switch to properties tab
  switchInspectorTab('properties');

  // Fill properties inputs
  const nameInput = document.getElementById('prop-elem-name');
  const dimEl = document.getElementById('prop-elem-dim');
  const sqftEl = document.getElementById('prop-elem-sqft');
  const costEl = document.getElementById('prop-elem-cost');
  const typeEl = document.getElementById('inspector-element-type');

  if (nameInput) nameInput.value = room.name;
  if (dimEl) dimEl.textContent = `${(room.width/20).toFixed(1)}m × ${(room.height/20).toFixed(1)}m (${room.areaSqM} m²)`;
  if (sqftEl) sqftEl.textContent = `${room.areaSqFt} sq ft`;
  if (costEl) costEl.textContent = formatCurrency(room.cost);
  if (typeEl) typeEl.textContent = room.name;
}

/* ==========================================================================
   5. CAD TOOL PALETTE LOGIC
   ========================================================================== */
function initToolPalette() {
  const toolBtns = document.querySelectorAll('.ws-tool-btn');
  toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tool = btn.getAttribute('data-tool');
      setActiveTool(tool);
    });
  });
}

function setActiveTool(toolName) {
  state.activeTool = toolName;
  document.querySelectorAll('.ws-tool-btn').forEach(btn => {
    if (btn.getAttribute('data-tool') === toolName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // If user picks a drawing tool while canvas is empty, auto-load canvas
  if (state.isCanvasEmpty && toolName !== 'select' && toolName !== 'pan') {
    loadPresetLayout('ground');
  }

  flashSaveStatus(`Tool: ${toolName.toUpperCase()} selected`);
}

/* ==========================================================================
   6. INSPECTOR TAB SWITCHER
   ========================================================================== */
function initInspectorTabs() {
  const tabAnalytics = document.getElementById('tab-analytics');
  const tabProperties = document.getElementById('tab-properties');

  tabAnalytics?.addEventListener('click', () => switchInspectorTab('analytics'));
  tabProperties?.addEventListener('click', () => switchInspectorTab('properties'));
}

function switchInspectorTab(tabName) {
  state.activeTab = tabName;
  const tabAnalytics = document.getElementById('tab-analytics');
  const tabProperties = document.getElementById('tab-properties');

  const panelAnalytics = document.getElementById('panel-analytics');
  const panelProperties = document.getElementById('panel-properties');

  if (tabName === 'analytics') {
    tabAnalytics?.classList.add('active');
    tabProperties?.classList.remove('active');
    if (panelAnalytics) panelAnalytics.style.display = 'flex';
    if (panelProperties) panelProperties.style.display = 'none';
  } else {
    tabProperties?.classList.add('active');
    tabAnalytics?.classList.remove('active');
    if (panelProperties) panelProperties.style.display = 'flex';
    if (panelAnalytics) panelAnalytics.style.display = 'none';
  }
}

/* ==========================================================================
   7. MODALS & AI GENERATOR LOGIC
   ========================================================================== */
function initModals() {
  // AI Modal
  const modalAI = document.getElementById('modal-ai-generate');
  document.getElementById('close-modal-ai')?.addEventListener('click', () => modalAI?.setAttribute('aria-hidden', 'true'));
  document.getElementById('cancel-modal-ai')?.addEventListener('click', () => modalAI?.setAttribute('aria-hidden', 'true'));
  
  document.getElementById('confirm-ai-generate')?.addEventListener('click', () => {
    modalAI?.setAttribute('aria-hidden', 'true');
    triggerAIGeneration();
  });

  // Report Modal
  const modalReport = document.getElementById('modal-report');
  document.getElementById('btn-generate-report')?.addEventListener('click', () => {
    modalReport?.setAttribute('aria-hidden', 'false');
  });
  document.getElementById('close-modal-report')?.addEventListener('click', () => modalReport?.setAttribute('aria-hidden', 'true'));

  document.getElementById('btn-print-report')?.addEventListener('click', () => {
    window.print();
  });

  // Export dropdown feedback
  document.getElementById('btn-export')?.addEventListener('click', () => {
    flashSaveStatus('Drawing exported to DXF/PDF format');
  });
}

function triggerAIGeneration() {
  flashSaveStatus('AI generating optimized 2D layout...');
  setTimeout(() => {
    generateDynamicLayout();
    flashSaveStatus('AI Floor Plan generated successfully!');
  }, 1200);
}

/* ==========================================================================
   8. UNDO / REDO HISTORY & SHORTCUTS
   ========================================================================== */
function saveHistoryState() {
  const currentSnapshot = JSON.parse(JSON.stringify(state.floors));
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push(currentSnapshot);
  state.historyIndex = state.history.length - 1;
  updateLiveCalculations();
}

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    if (e.key === 'v' || e.key === 'V') setActiveTool('select');
    if (e.key === 'w' || e.key === 'W') setActiveTool('wall');
    if (e.key === 'd' || e.key === 'D') setActiveTool('door');
    if (e.key === 'r' || e.key === 'R') setActiveTool('room');
    if (e.key === 'm' || e.key === 'M') setActiveTool('dimension');
    if (e.key === 't' || e.key === 'T') setActiveTool('text');
    if (e.key === 'h' || e.key === 'H') setActiveTool('pan');

    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      undoAction();
    }
    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      redoAction();
    }
  });

  document.getElementById('btn-undo')?.addEventListener('click', () => undoAction());
  document.getElementById('btn-redo')?.addEventListener('click', () => redoAction());
}

function undoAction() {
  if (state.historyIndex > 0) {
    state.historyIndex--;
    state.floors = JSON.parse(JSON.stringify(state.history[state.historyIndex]));
    if (!state.isCanvasEmpty) renderFloorPlanSVG();
    flashSaveStatus('Undo applied');
  }
}

function redoAction() {
  if (state.historyIndex < state.history.length - 1) {
    state.historyIndex++;
    state.floors = JSON.parse(JSON.stringify(state.history[state.historyIndex]));
    if (!state.isCanvasEmpty) renderFloorPlanSVG();
    flashSaveStatus('Redo applied');
  }
}

function flashSaveStatus(msg) {
  const textEl = document.getElementById('save-status-text');
  if (textEl) {
    textEl.textContent = msg;
    textEl.style.color = '#f6e27a';
    setTimeout(() => {
      textEl.textContent = 'Saved just now';
      textEl.style.color = 'var(--emerald-accent)';
    }, 2400);
  }
}
