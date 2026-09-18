/* ==========================================================================
   BUILDWISE AI — SITE ANALYSIS ENGINE (MVP Simulated)
   
   Architecture:
   - This module simulates AI-powered geotechnical site analysis.
   - It accepts location data and returns a foundation recommendation.
   - The internal simulation considers terrain, elevation, seismic zone,
     soil characteristics, and regional building patterns.
   
   FUTURE: Replace the simulateSiteAnalysis() body with real GIS APIs
   (Google Maps Elevation, USGS Soil Survey, Indian Geological Survey,
   GeoTech databases, etc.) without changing the public interface.
   
   Public API:
   - analyzeSite(locationData) → { recommendation, factors }
   - getFoundationRecommendation(locationData) → string (one-liner)
   ========================================================================== */

// Indian seismic zones and their characteristics
const SEISMIC_ZONES = {
  'II': { risk: 'low', description: 'Zone II - Low Damage Risk' },
  'III': { risk: 'moderate', description: 'Zone III - Moderate Damage Risk' },
  'IV': { risk: 'high', description: 'Zone IV - High Damage Risk' },
  'V': { risk: 'very-high', description: 'Zone V - Very High Damage Risk' }
};

// City-level soil and terrain profiles (simulated for MVP)
// In production, this data would come from GIS/soil databases
const CITY_SOIL_PROFILES = {
  // South India - Deccan Plateau (granite/rocky terrain)
  'hyderabad': { soilType: 'Granitic residual soil', bearingCapacity: 'high', seismicZone: 'III', terrain: 'plateau', recommendation: 'Isolated Footing Recommended' },
  'bangalore': { soilType: 'Decomposed granite & laterite', bearingCapacity: 'high', seismicZone: 'II', terrain: 'plateau', recommendation: 'Isolated Footing Recommended' },
  'mysore': { soilType: 'Decomposed granite', bearingCapacity: 'high', seismicZone: 'II', terrain: 'plateau', recommendation: 'Isolated Footing Recommended' },
  'chennai': { soilType: 'Marine clay & alluvial', bearingCapacity: 'low', seismicZone: 'II', terrain: 'coastal', recommendation: 'Raft Foundation Recommended' },
  'coimbatore': { soilType: 'Limestone & clay mix', bearingCapacity: 'moderate', seismicZone: 'III', terrain: 'plain', recommendation: 'Isolated Footing Recommended' },
  'madurai': { soilType: 'Limestone & alluvial deposits', bearingCapacity: 'moderate', seismicZone: 'III', terrain: 'plain', recommendation: 'Isolated Footing Recommended' },
  'kochi': { soilType: 'Soft marine clay & peat', bearingCapacity: 'very-low', seismicZone: 'III', terrain: 'coastal', recommendation: 'Pile Foundation Recommended' },
  'thiruvananthapuram': { soilType: 'Laterite & coastal alluvium', bearingCapacity: 'moderate', seismicZone: 'III', terrain: 'coastal', recommendation: 'Combined Footing Recommended' },

  // West India - Coastal & Industrial
  'mumbai': { soilType: 'Marine clay & basalt', bearingCapacity: 'moderate', seismicZone: 'III', terrain: 'coastal', recommendation: 'Combined Footing Recommended' },
  'pune': { soilType: 'Basalt & laterite', bearingCapacity: 'high', seismicZone: 'III', terrain: 'plateau', recommendation: 'Isolated Footing Recommended' },
  'ahmedabad': { soilType: 'Alluvial & sandy clay', bearingCapacity: 'moderate', seismicZone: 'III', terrain: 'plain', recommendation: 'Combined Footing Recommended' },
  'surat': { soilType: 'Soft alluvial clay', bearingCapacity: 'low', seismicZone: 'III', terrain: 'coastal', recommendation: 'Raft Foundation Recommended' },
  'jaipur': { soilType: 'Sandy & rocky mix', bearingCapacity: 'high', seismicZone: 'II', terrain: 'desert', recommendation: 'Isolated Footing Recommended' },
  'udaipur': { soilType: 'Sandstone & rocky', bearingCapacity: 'high', seismicZone: 'II', terrain: 'hilly', recommendation: 'Isolated Footing Recommended' },
  'goa': { soilType: 'Laterite & basalt', bearingCapacity: 'moderate', seismicZone: 'III', terrain: 'coastal', recommendation: 'Isolated Footing Recommended' },

  // North India - Gangetic Plain & Himalayan
  'delhi': { soilType: 'Alluvial clay & silt', bearingCapacity: 'moderate', seismicZone: 'IV', terrain: 'plain', recommendation: 'Combined Footing Recommended' },
  'noida': { soilType: 'Deep alluvial deposits', bearingCapacity: 'moderate', seismicZone: 'IV', terrain: 'plain', recommendation: 'Combined Footing Recommended' },
  'gurgaon': { soilType: 'Sandy alluvium', bearingCapacity: 'moderate', seismicZone: 'IV', terrain: 'plain', recommendation: 'Combined Footing Recommended' },
  'lucknow': { soilType: 'Gangetic alluvium', bearingCapacity: 'moderate', seismicZone: 'IV', terrain: 'plain', recommendation: 'Combined Footing Recommended' },
  'varanasi': { soilType: 'Dense alluvial clay', bearingCapacity: 'moderate', seismicZone: 'III', terrain: 'plain', recommendation: 'Combined Footing Recommended' },
  'agra': { soilType: 'Alluvial & clay mix', bearingCapacity: 'moderate', seismicZone: 'III', terrain: 'plain', recommendation: 'Combined Footing Recommended' },
  'chandigarh': { soilType: 'Alluvial with gravel', bearingCapacity: 'high', seismicZone: 'IV', terrain: 'plain', recommendation: 'Isolated Footing Recommended' },
  'dehradun': { soilType: 'River gravel & boulder', bearingCapacity: 'high', seismicZone: 'V', terrain: 'hilly', recommendation: 'Pile Foundation Recommended' },
  'shimla': { soilType: 'Slate & metamorphic rock', bearingCapacity: 'high', seismicZone: 'V', terrain: 'mountain', recommendation: 'Pile Foundation Recommended' },
  'jammu': { soilType: 'Boulder conglomerate & clay', bearingCapacity: 'high', seismicZone: 'V', terrain: 'hilly', recommendation: 'Pile Foundation Recommended' },
  'srinagar': { soilType: 'Alluvial lacustrine clay', bearingCapacity: 'low', seismicZone: 'V', terrain: 'valley', recommendation: 'Raft Foundation Recommended' },

  // East India
  'kolkata': { soilType: 'Soft deltaic alluvium', bearingCapacity: 'very-low', seismicZone: 'III', terrain: 'delta', recommendation: 'Pile Foundation Recommended' },
  'bhubaneswar': { soilType: 'Laterite & coastal clay', bearingCapacity: 'moderate', seismicZone: 'III', terrain: 'coastal', recommendation: 'Combined Footing Recommended' },
  'patna': { soilType: 'Gangetic floodplain alluvium', bearingCapacity: 'low', seismicZone: 'III', terrain: 'delta', recommendation: 'Raft Foundation Recommended' },
  'ranchi': { soilType: 'Chotanagpur granite & laterite', bearingCapacity: 'high', seismicZone: 'III', terrain: 'plateau', recommendation: 'Isolated Footing Recommended' },
  'guwahati': { soilType: 'River terraces & alluvium', bearingCapacity: 'low', seismicZone: 'V', terrain: 'valley', recommendation: 'Pile Foundation Recommended' },

  // Central India
  'bhopal': { soilType: 'Sandstone & limestone', bearingCapacity: 'high', seismicZone: 'III', terrain: 'plateau', recommendation: 'Isolated Footing Recommended' },
  'indore': { soilType: 'Basalt & regur soil', bearingCapacity: 'high', seismicZone: 'II', terrain: 'plateau', recommendation: 'Isolated Footing Recommended' },
  'nagpur': { soilType: 'Black cotton soil & basalt', bearingCapacity: 'moderate', seismicZone: 'II', terrain: 'plateau', recommendation: 'Combined Footing Recommended' },
  'gwalior': { soilType: 'Sandstone & alluvial', bearingCapacity: 'moderate', seismicZone: 'III', terrain: 'plain', recommendation: 'Combined Footing Recommended' },
  'raipur': { soilType: 'Limestone & alluvium', bearingCapacity: 'moderate', seismicZone: 'III', terrain: 'plain', recommendation: 'Isolated Footing Recommended' },

  // Northeast India
  'imphal': { soilType: 'Alluvial & weathered rock', bearingCapacity: 'low', seismicZone: 'V', terrain: 'valley', recommendation: 'Pile Foundation Recommended' },
  'shillong': { soilType: 'Gneiss & metamorphic', bearingCapacity: 'high', seismicZone: 'V', terrain: 'mountain', recommendation: 'Pile Foundation Recommended' },
  'agartala': { soilType: 'Clayey alluvium', bearingCapacity: 'low', seismicZone: 'V', terrain: 'plain', recommendation: 'Pile Foundation Recommended' },

  // International (non-India) profiles — generic fallbacks by region
  'seoul': { soilType: 'Weathered granite & alluvial', bearingCapacity: 'moderate', seismicZone: 'III', terrain: 'basin', recommendation: 'Combined Footing Recommended' },
  'tokyo': { soilType: 'Volcanic ash & alluvial', bearingCapacity: 'low', seismicZone: 'IV', terrain: 'coastal', recommendation: 'Raft Foundation Recommended' },
  'dubai': { soilType: 'Calcareous sand & coral', bearingCapacity: 'low', seismicZone: 'II', terrain: 'desert', recommendation: 'Pile Foundation Recommended' },
  'london': { soilType: 'London Clay', bearingCapacity: 'moderate', seismicZone: 'I', terrain: 'basin', recommendation: 'Isolated Footing Recommended' },
  'new york': { soilType: 'Manhattan schist & glacial till', bearingCapacity: 'high', seismicZone: 'II', terrain: 'coastal', recommendation: 'Isolated Footing Recommended' },
  'singapore': { soilType: 'Marine clay & weathered rock', bearingCapacity: 'low', seismicZone: 'I', terrain: 'coastal', recommendation: 'Raft Foundation Recommended' },
  'sydney': { soilType: 'Sandstone & weathered shale', bearingCapacity: 'high', seismicZone: 'I', terrain: 'coastal', recommendation: 'Isolated Footing Recommended' },
  'dublin': { soilType: 'Glacial clay & limestone', bearingCapacity: 'moderate', seismicZone: 'I', terrain: 'plain', recommendation: 'Isolated Footing Recommended' },
  'berlin': { soilType: 'Glacial sand & gravel', bearingCapacity: 'moderate', seismicZone: 'I', terrain: 'plain', recommendation: 'Isolated Footing Recommended' },
  'paris': { soilType: 'Limestone & clay', bearingCapacity: 'high', seismicZone: 'I', terrain: 'basin', recommendation: 'Isolated Footing Recommended' },
  'los angeles': { soilType: 'Sandy loam & decomposed granite', bearingCapacity: 'moderate', seismicZone: 'IV', terrain: 'coastal', recommendation: 'Combined Footing Recommended' },
  'san francisco': { soilType: 'Bay Mud & Franciscan complex', bearingCapacity: 'low', seismicZone: 'IV', terrain: 'coastal', recommendation: 'Raft Foundation Recommended' },
  'chicago': { soilType: 'Glacial clay & till', bearingCapacity: 'moderate', seismicZone: 'I', terrain: 'plain', recommendation: 'Isolated Footing Recommended' },
  'toronto': { soilType: 'Glacial till & shale', bearingCapacity: 'high', seismicZone: 'I', terrain: 'plain', recommendation: 'Isolated Footing Recommended' },
  'mexico city': { soilType: 'Volcanic clay & lake bed', bearingCapacity: 'very-low', seismicZone: 'II', terrain: 'valley', recommendation: 'Pile Foundation Recommended' },
  'sao paulo': { soilType: 'Weathered gneiss & residual', bearingCapacity: 'moderate', seismicZone: 'II', terrain: 'plateau', recommendation: 'Isolated Footing Recommended' },
  'cairo': { soilType: 'Nile alluvium & sand', bearingCapacity: 'moderate', seismicZone: 'II', terrain: 'desert', recommendation: 'Combined Footing Recommended' },
  'istanbul': { soilType: 'Marine clay & sand', bearingCapacity: 'low', seismicZone: 'IV', terrain: 'coastal', recommendation: 'Raft Foundation Recommended' },
  'bangkok': { soilType: 'Soft marine clay', bearingCapacity: 'very-low', seismicZone: 'I', terrain: 'delta', recommendation: 'Pile Foundation Recommended' },
  'manila': { soilType: 'Volcanic alluvium & clay', bearingCapacity: 'low', seismicZone: 'IV', terrain: 'coastal', recommendation: 'Raft Foundation Recommended' },
  'jakarta': { soilType: 'Soft clay & volcanic ash', bearingCapacity: 'very-low', seismicZone: 'II', terrain: 'coastal', recommendation: 'Pile Foundation Recommended' },
  'kathmandu': { soilType: 'River terrace sand & gravel', bearingCapacity: 'low', seismicZone: 'V', terrain: 'valley', recommendation: 'Pile Foundation Recommended' },
  'colombo': { soilType: 'Marine clay & coral', bearingCapacity: 'low', seismicZone: 'I', terrain: 'coastal', recommendation: 'Raft Foundation Recommended' },
};

/**
 * Normalize a city name for lookup (lowercase, trimmed)
 */
function normalizeCity(city) {
  return (city || '').toLowerCase().trim();
}

/**
 * Determine seismic zone from latitude/longitude (simplified Indian model)
 */
function inferSeismicZone(lat, lng) {
  // Himalayan region (very high risk)
  if (lat > 28 && lat < 36 && lng > 73 && lng < 97) return 'V';
  // Indo-Gangetic plain & NE (high risk)
  if (lat > 22 && lat < 32 && lng > 73 && lng < 92) return 'IV';
  // Western coast, Deccan plateau edge (moderate)
  if (lat > 8 && lat < 24 && lng > 68 && lng < 80) return 'III';
  // Stable continental interior (low)
  if (lat > 8 && lat < 35 && lng > 68 && lng < 97) return 'II';
  // Default for India
  return 'III';
}

/**
 * Infer soil characteristics from terrain/region (for locations not in our database)
 */
function inferSoilFromRegion(lat, lng, country) {
  const isIndia = !country || country.toLowerCase().includes('india');
  
  if (isIndia) {
    // Coastal areas (approximate)
    if ((lng > 72 && lng < 80 && lat < 15) || (lng > 80 && lng < 88 && lat < 22)) {
      return { soilType: 'Coastal alluvium', bearingCapacity: 'low', terrain: 'coastal' };
    }
    // Deccan plateau
    if (lat > 12 && lat < 20 && lng > 73 && lng < 80) {
      return { soilType: 'Decomposed granite', bearingCapacity: 'high', terrain: 'plateau' };
    }
    // Northern plains
    if (lat > 24 && lat < 32 && lng > 75 && lng < 90) {
      return { soilType: 'Alluvial clay', bearingCapacity: 'moderate', terrain: 'plain' };
    }
    // Hills/mountains
    if (lat > 28 && lng > 73) {
      return { soilType: 'Rocky with thin soil cover', bearingCapacity: 'high', terrain: 'mountain' };
    }
    return { soilType: 'Mixed alluvial', bearingCapacity: 'moderate', terrain: 'plain' };
  }
  
  // Generic international fallback
  return { soilType: 'Unknown (local survey required)', bearingCapacity: 'moderate', terrain: 'unknown' };
}

/**
 * Select foundation recommendation based on combined factors
 */
function determineFoundation(bearingCapacity, seismicZone, plotArea) {
  const seismicRisk = SEISMIC_ZONES[seismicZone]?.risk || 'moderate';
  
  // Very low bearing capacity → Pile
  if (bearingCapacity === 'very-low') return 'Pile Foundation Recommended';
  
  // Low bearing capacity
  if (bearingCapacity === 'low') {
    if (seismicRisk === 'high' || seismicRisk === 'very-high') return 'Pile Foundation Recommended';
    return 'Raft Foundation Recommended';
  }
  
  // Moderate bearing capacity
  if (bearingCapacity === 'moderate') {
    if (seismicRisk === 'very-high') return 'Pile Foundation Recommended';
    if (seismicRisk === 'high') return 'Combined Footing Recommended';
    // Large plot → raft for uniformity
    if (plotArea > 5000) return 'Raft Foundation Recommended';
    return 'Combined Footing Recommended';
  }
  
  // High bearing capacity
  if (bearingCapacity === 'high') {
    if (seismicRisk === 'very-high') return 'Combined Footing Recommended';
    if (seismicRisk === 'high') return 'Combined Footing Recommended';
    if (plotArea > 8000) return 'Combined Footing Recommended';
    return 'Isolated Footing Recommended';
  }
  
  return 'Isolated Footing Recommended';
}

/**
 * PUBLIC API: Analyze site and return full analysis object
 * 
 * @param {Object} locationData - { city, state, country, latitude, longitude, plotArea }
 * @returns {Object} { recommendation, soilType, seismicZone, terrain, bearingCapacity, analysisNote }
 */
export function analyzeSite(locationData) {
  const { city, state, country, latitude, longitude, plotArea } = locationData;
  
  const normalizedCity = normalizeCity(city);
  const lat = parseFloat(latitude) || 20.5937;
  const lng = parseFloat(longitude) || 78.9629;
  const area = plotArea || 4500;
  
  // 1. Look up city profile (simulated database)
  let profile = CITY_SOIL_PROFILES[normalizedCity];
  
  // 2. If not in database, infer from region
  if (!profile) {
    const inferred = inferSoilFromRegion(lat, lng, country);
    const seismicZone = inferSeismicZone(lat, lng);
    const recommendation = determineFoundation(inferred.bearingCapacity, seismicZone, area);
    
    profile = {
      ...inferred,
      seismicZone,
      recommendation
    };
  }
  
  // 3. Re-evaluate foundation if plot area is significantly different from default
  // (allows the analysis to adapt to user-specified plot dimensions)
  const recommendation = determineFoundation(
    profile.bearingCapacity,
    profile.seismicZone,
    area
  );
  
  // 4. Build result object
  // NOTE: Technical details are computed but NOT displayed in UI (MVP requirement)
  // They are available for future use when real GIS is integrated
  return {
    recommendation: profile.recommendation,
    soilType: profile.soilType,
    seismicZone: profile.seismicZone,
    terrain: profile.terrain,
    bearingCapacity: profile.bearingCapacity,
    analysisNote: `Simulated analysis based on regional geotechnical data for ${city || 'selected location'}.`
  };
}

/**
 * PUBLIC API: Get one-line foundation recommendation string
 * 
 * @param {Object} locationData - { city, state, country, latitude, longitude, plotArea }
 * @returns {string} e.g. "Isolated Footing Recommended"
 */
export function getFoundationRecommendation(locationData) {
  return analyzeSite(locationData).recommendation;
}
