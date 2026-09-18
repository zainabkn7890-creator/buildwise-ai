/* ==========================================================================
   BUILDWISE AI — DYNAMIC FLOOR CONFIGURATION ENGINE
   
   Generates dynamic floor tab lists, ordering, labels, and 3D height offsets
   based directly on user inputs from Phase 2 (number of floors & basement).
   ========================================================================== */

const ORDINAL_MAP = [
  { id: 'ground', label: 'Ground Floor' },
  { id: 'first', label: 'First Floor' },
  { id: 'second', label: 'Second Floor' },
  { id: 'third', label: 'Third Floor' },
  { id: 'fourth', label: 'Fourth Floor' },
  { id: 'fifth', label: 'Fifth Floor' },
  { id: 'sixth', label: 'Sixth Floor' },
  { id: 'seventh', label: 'Seventh Floor' },
  { id: 'eighth', label: 'Eighth Floor' },
  { id: 'ninth', label: 'Ninth Floor' },
  { id: 'tenth', label: 'Tenth Floor' },
  { id: 'eleventh', label: 'Eleventh Floor' },
  { id: 'twelfth', label: 'Twelfth Floor' },
  { id: 'thirteenth', label: 'Thirteenth Floor' },
  { id: 'fourteenth', label: 'Fourteenth Floor' },
  { id: 'fifteenth', label: 'Fifteenth Floor' },
  { id: 'sixteenth', label: 'Sixteenth Floor' },
  { id: 'seventeenth', label: 'Seventeenth Floor' },
  { id: 'eighteenth', label: 'Eighteenth Floor' },
  { id: 'nineteenth', label: 'Nineteenth Floor' },
  { id: 'twentieth', label: 'Twentieth Floor' },
];

export function parseFloorCount(floorsInput) {
  let numFloors = 2;
  if (typeof floorsInput === 'number') {
    numFloors = Math.max(1, Math.min(20, floorsInput));
  } else if (typeof floorsInput === 'string') {
    const match = floorsInput.match(/\d+/);
    if (match) {
      numFloors = Math.max(1, Math.min(20, parseInt(match[0], 10)));
    }
  }
  return numFloors;
}

export function parseBasementOption(basementInput) {
  if (!basementInput) return false;
  const str = String(basementInput).toLowerCase();
  return !str.includes('none') && !str.includes('no') && str.length > 0;
}

export function getFloorConfig(floorsInput, basementInput) {
  const numFloors = parseFloorCount(floorsInput);
  const hasBasement = parseBasementOption(basementInput);

  const floorsList = [];

  // 1. Basement (if enabled, appears before Ground Floor)
  if (hasBasement) {
    floorsList.push({ id: 'basement', label: 'Basement' });
  }

  // 2. Normal Floors (Ground Floor through Nth Floor)
  for (let i = 0; i < numFloors; i++) {
    if (i < ORDINAL_MAP.length) {
      floorsList.push(ORDINAL_MAP[i]);
    } else {
      floorsList.push({ id: `floor_${i}`, label: `Floor ${i}` });
    }
  }

  // 3. Terrace (ALWAYS appears after the highest floor)
  floorsList.push({ id: 'terrace', label: 'Terrace' });

  // Map of floor ID -> Label
  const floorLabels = {};
  // Map of floor ID -> 3D Y Height Offset (ft)
  const floorOffsets = {};
  let storyCount = 0;

  floorsList.forEach(f => {
    floorLabels[f.id] = f.label;
    if (f.id === 'basement') {
      floorOffsets.basement = -11;
    } else if (f.id === 'terrace') {
      floorOffsets.terrace = storyCount * 11;
    } else {
      floorOffsets[f.id] = storyCount * 11;
      storyCount++;
    }
  });

  const floorOrder = floorsList.map(f => f.id);

  return {
    numFloors,
    hasBasement,
    floorsList,
    floorOrder,
    floorLabels,
    floorOffsets
  };
}
