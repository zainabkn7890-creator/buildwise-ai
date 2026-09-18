/* ==========================================================================
   BUILDWISE AI — DYNAMIC METRICS CALCULATOR
   
   Calculates live dynamic cost estimation, sustainability scores, and
   material takeoff statistics based on user project parameters:
   - Plot Dimensions (Length x Width, Plot Area)
   - Building Category & Type (Villa, Apartment, Commercial, Hospital, etc.)
   - Orientation / Road Direction (North, East, South, West, North-East, etc.)
   - Total & Active Built-up Area & Open Green Space Ratio
   - Number of Floors / Stories
   - Material Selection Quality (Economy, Standard, Premium, Luxury)
   - Energy Efficiency & Sustainability Preferences (Solar, LEED, BREEAM, IGBC)
   - Room sizes, window counts, and amenities
   ========================================================================== */

export function calculateDynamicCost({
  totalBuiltArea = 2500,
  currency = 'INR',
  materialQuality = 'Premium Designer',
  buildingCategory = 'Residential',
  buildingType = 'Single-Family Villa',
  floors = '2',
  sustainability = 'LEED Gold Standard (Recommended)',
  energyEfficiency = 'Solar Photovoltaic + Smart HVAC Zoning',
  basement = 'None',
  amenities = {},
  budget = 0,
}) {
  const isINR = currency === 'INR';
  const baseRate = isINR ? 2500 : 35; // Baseline cost per sq ft

  // Material Quality Multiplier
  const matUpper = String(materialQuality || '').toLowerCase();
  let matMultiplier = 1.0;
  if (matUpper.includes('luxury') || matUpper.includes('executive')) {
    matMultiplier = 1.55;
  } else if (matUpper.includes('premium') || matUpper.includes('designer')) {
    matMultiplier = 1.30;
  } else if (matUpper.includes('standard')) {
    matMultiplier = 1.05;
  } else if (matUpper.includes('economy') || matUpper.includes('basic')) {
    matMultiplier = 0.88;
  }

  // Building Type Multiplier
  const bCat = String(buildingCategory || '').toLowerCase();
  const bType = String(buildingType || '').toLowerCase();
  let typeMultiplier = 1.0;
  if (bCat.includes('commercial')) {
    if (bType.includes('hospital') || bType.includes('clinic')) typeMultiplier = 1.45;
    else if (bType.includes('shopping') || bType.includes('mall')) typeMultiplier = 1.35;
    else if (bType.includes('hotel')) typeMultiplier = 1.30;
    else if (bType.includes('office') || bType.includes('co-working')) typeMultiplier = 1.22;
    else typeMultiplier = 1.20;
  } else if (bCat.includes('mixed')) {
    typeMultiplier = 1.25;
  } else {
    if (bType.includes('apartment')) typeMultiplier = 1.15;
    else if (bType.includes('multi-family')) typeMultiplier = 1.10;
    else typeMultiplier = 1.0;
  }

  // Number of Floors Multiplier
  let numFloors = 2;
  const numMatch = String(floors || '').match(/\d+/);
  if (numMatch) numFloors = parseInt(numMatch[0], 10);
  const floorMultiplier = 1.0 + Math.max(0, numFloors - 1) * 0.06;

  // Sustainability Options Multiplier
  const susUpper = String(sustainability || '').toLowerCase();
  const nrgUpper = String(energyEfficiency || '').toLowerCase();
  let ecoMultiplier = 1.0;
  if (susUpper.includes('leed') || susUpper.includes('breeam') || susUpper.includes('igbc') || susUpper.includes('passive')) {
    ecoMultiplier += 0.08;
  }
  if (nrgUpper.includes('solar') || nrgUpper.includes('hvac') || nrgUpper.includes('photovoltaic')) {
    ecoMultiplier += 0.06;
  }

  // Final Cost Per Sq Ft
  const costPerSqFt = Math.round(baseRate * matMultiplier * typeMultiplier * floorMultiplier * ecoMultiplier);

  // Total Estimated Cost
  let totalCost = Math.round(totalBuiltArea * costPerSqFt);

  // Basement & Elevator add-on costs
  const baseUpper = String(basement || '').toLowerCase();
  if (!baseUpper.includes('none') && !baseUpper.includes('no') && baseUpper.length > 0) {
    totalCost += isINR ? 450000 : 6000;
  }
  if (amenities?.elevator) {
    totalCost += isINR ? 650000 : 9000;
  }

  return {
    costPerSqFt,
    totalCost,
    numFloors,
    currency
  };
}

export function calculateDynamicSustainability({
  plotLength = 75,
  plotWidth = 60,
  plotArea = 4500,
  totalBuiltArea = 2500,
  activeBuiltArea = 1500,
  buildingCategory = 'Residential',
  buildingType = 'Single-Family Villa',
  orientation = 'East',
  materialQuality = 'Premium Designer',
  sustainability = 'LEED Gold Standard (Recommended)',
  energyEfficiency = 'Solar Photovoltaic + Smart HVAC Zoning',
  amenities = {},
  rooms = [],
}) {
  // Effective Plot Area & Green Space Coverage Ratio
  const effectivePlotArea = Number(plotArea) || (Number(plotLength) * Number(plotWidth)) || 4500;
  const currentBuilt = Number(activeBuiltArea) || Number(totalBuiltArea) || 1500;
  const coverageRatio = Math.min(1.0, Math.max(0.05, currentBuilt / effectivePlotArea));
  const greenSpaceRatio = Math.max(0, 1.0 - coverageRatio); // Percentage of open/green space

  // 1. Orientation & Daylight Factors
  const orientUpper = String(orientation || '').toLowerCase();
  let orientationDaylightBonus = 78;
  if (orientUpper.includes('east') || orientUpper.includes('north-east')) {
    orientationDaylightBonus = 94; // Premium natural light alignment
  } else if (orientUpper.includes('north')) {
    orientationDaylightBonus = 90;
  } else if (orientUpper.includes('south-east')) {
    orientationDaylightBonus = 84;
  } else if (orientUpper.includes('south')) {
    orientationDaylightBonus = 72;
  } else if (orientUpper.includes('west')) {
    orientationDaylightBonus = 62;
  }

  // Window Coverage & Room Daylight Analysis
  let totalWindows = 0;
  let roomsWithWindows = 0;
  if (Array.isArray(rooms) && rooms.length > 0) {
    rooms.forEach(r => {
      const wins = (r.windows || []).length;
      totalWindows += wins;
      if (wins > 0) roomsWithWindows++;
    });
  }
  const roomCount = Array.isArray(rooms) && rooms.length > 0 ? rooms.length : 6;
  const windowRatio = roomsWithWindows / roomCount;

  // Daylight Score (0 - 100)
  const daylightScore = Math.min(100, Math.max(40, Math.round(
    orientationDaylightBonus * 0.45 +
    windowRatio * 40 +
    (greenSpaceRatio > 0.3 ? 15 : greenSpaceRatio * 35)
  )));

  // Ventilation Score (0 - 100)
  const avgWins = totalWindows / roomCount;
  const ventilationScore = Math.min(100, Math.max(35, Math.round(
    (avgWins >= 1.2 ? 86 : 50 + avgWins * 30) +
    greenSpaceRatio * 20 +
    (orientUpper.includes('east') || orientUpper.includes('north') ? 8 : 0)
  )));

  // Water Efficiency Score (0 - 100)
  const susUpper = String(sustainability || '').toLowerCase();
  let waterScore = 65;
  if (amenities?.garden) waterScore += 10;
  if (greenSpaceRatio > 0.45) waterScore += 14;
  else if (greenSpaceRatio > 0.25) waterScore += 8;
  if (susUpper.includes('leed') || susUpper.includes('igbc') || susUpper.includes('breeam')) waterScore += 12;
  if (susUpper.includes('passive') || susUpper.includes('net zero')) waterScore += 16;
  waterScore = Math.min(100, Math.max(30, Math.round(waterScore)));

  // Energy Efficiency Score (0 - 100)
  const nrgUpper = String(energyEfficiency || '').toLowerCase();
  let energyScore = 62;
  if (nrgUpper.includes('solar') && nrgUpper.includes('hvac')) {
    energyScore = 95;
  } else if (nrgUpper.includes('solar')) {
    energyScore = 86;
  } else if (nrgUpper.includes('hvac') || nrgUpper.includes('smart')) {
    energyScore = 78;
  }
  if (orientUpper.includes('east') || orientUpper.includes('north-east')) energyScore += 5;
  if (susUpper.includes('passive')) energyScore += 5;
  energyScore = Math.min(100, Math.max(30, Math.round(energyScore)));

  // Overall Score (Weighted Average)
  const overallScore = Math.min(100, Math.max(35, Math.round(
    daylightScore * 0.30 +
    ventilationScore * 0.25 +
    waterScore * 0.20 +
    energyScore * 0.25
  )));

  // Environmental Rating Label
  let ratingLabel = 'Good Environmental Rating';
  let badgeColor = '#38bdf8';
  if (overallScore >= 90) {
    ratingLabel = 'Platinum Net-Zero Certified';
    badgeColor = '#34d399';
  } else if (overallScore >= 80) {
    ratingLabel = 'LEED Gold Environmental Rating';
    badgeColor = '#4ade80';
  } else if (overallScore >= 70) {
    ratingLabel = 'Good Environmental Rating';
    badgeColor = '#38bdf8';
  } else if (overallScore >= 60) {
    ratingLabel = 'Standard Code Compliance';
    badgeColor = '#facc15';
  } else {
    ratingLabel = 'Moderate Environmental Impact';
    badgeColor = '#fbbf24';
  }

  return {
    overallScore,
    daylightScore,
    ventilationScore,
    waterScore,
    energyScore,
    ratingLabel,
    badgeColor,
    greenSpacePct: Math.round(greenSpaceRatio * 100),
    coveragePct: Math.round(coverageRatio * 100)
  };
}

export function calculateDynamicMaterials(totalBuiltArea = 2500, materialQuality = 'Standard') {
  const matUpper = String(materialQuality || '').toLowerCase();
  let densityFactor = 1.0;
  if (matUpper.includes('luxury')) densityFactor = 1.25;
  else if (matUpper.includes('premium')) densityFactor = 1.12;
  else if (matUpper.includes('economy')) densityFactor = 0.90;

  const bricks = Math.round(totalBuiltArea * 15.5 * densityFactor);
  const cement = Math.round(totalBuiltArea * 0.24 * densityFactor);
  const steel = (totalBuiltArea * 0.0021 * densityFactor).toFixed(1);
  const sand = (totalBuiltArea * 0.014 * densityFactor).toFixed(1);

  return {
    bricks: `${bricks.toLocaleString()} Nos`,
    cement: `${cement.toLocaleString()} Bags`,
    steel: `${steel} Ton`,
    sand: `${sand} Cum`
  };
}
