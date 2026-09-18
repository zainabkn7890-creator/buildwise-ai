import { createIcons, icons } from 'lucide';
import { analyzeSite } from './site-analysis.js';
import { getRoomPalette, initializeRoomsFromLibrary, getRoomCategories } from './src/room-library.js';

let currentStep = 1;
const totalSteps = 6;
const PROJECT_STORAGE_KEY = 'buildwise_project_data';
const DRAFT_STORAGE_KEY = 'buildwise_project_draft';
let isGeneratingProject = false;

// Project Data State Object
const projectData = {
  name: 'Horizon Heights Residence',
  buildingCategory: 'Residential',
  buildingType: 'Single-Family Villa',
  commercialType: 'Office Building',
  constructionType: 'New Construction',
  address: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  latitude: '',
  longitude: '',
  timezone: '',
  unit: 'sqft',
  plotLength: 75,
  plotWidth: 60,
  plotArea: 4500,
  roadDirection: 'East',
  floors: '2 Stories (Ground + 1 Floor)',
  basement: 'Single Level Basement (Storage / Utility)',
  parking: 'Covered 2-Car Garage',
  staircase: 'Dog-Legged Reinforced Staircase',
  amenities: { balcony: true, garden: true, elevator: true },
  rooms: {},
  currency: 'INR',
  budget: 12500000,
  materialQuality: 'Premium Designer',
  sustainability: 'LEED Gold Standard (Recommended)',
  energyEfficiency: 'Solar Photovoltaic + Smart HVAC Zoning',
  accessibility: { adaRamps: true, wideDoors: true, accessibleBath: false }
};

// Initialize rooms from library — MUST assign the return value to projectData.rooms
projectData.rooms = initializeRoomsFromLibrary();

document.addEventListener('DOMContentLoaded', () => {
  restoreWizardDraft();
  createIcons({ icons });
  initCardSelectors();
  initPlotCalculations();
  initGoogleMapsOrFallback();
  initDirectionButtons();
  initBudgetSlider();
  initCurrencySelector();
  renderRoomCards();
  updateStepUI();
});

function restoreWizardDraft() {
  try {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY) || localStorage.getItem(PROJECT_STORAGE_KEY);
    if (!saved) return;
    Object.assign(projectData, JSON.parse(saved));
    hydrateWizardFields();
    // If location was previously set, restore the summary and run site analysis
    if (projectData.city || projectData.latitude) {
      const locData = {
        city: projectData.city,
        state: projectData.state,
        country: projectData.country,
        lat: projectData.latitude,
        lng: projectData.longitude,
        formattedAddress: projectData.address,
        postalCode: projectData.postalCode,
        timezone: projectData.timezone,
        locality: ''
      };
      // Reconstruct summary display
      const body = document.getElementById('loc-summary-body');
      const badge = document.getElementById('loc-summary-badge');
      const status = document.getElementById('loc-summary-status');
      const title = document.getElementById('loc-summary-title');
      if (body) body.style.display = 'block';
      if (badge) badge.style.display = 'inline-flex';
      if (status) status.textContent = [locData.city, locData.state, locData.country].filter(Boolean).join(', ');
      if (title) title.textContent = 'Project Location';
      setText('sum-locality', locData.locality || locData.city);
      setText('sum-city', locData.city);
      setText('sum-state', locData.state);
      setText('sum-country', locData.country);
      setText('sum-postal', locData.postalCode);
      setText('sum-address', locData.formattedAddress);
      setText('sum-lat', locData.lat ? `${locData.lat}°` : '—');
      setText('sum-lng', locData.lng ? `${locData.lng}°` : '—');
      setText('sum-timezone', locData.timezone);
      runSiteAnalysis(locData);
    }
  } catch (error) { console.warn('Could not restore the saved project draft.', error); }
}

function hydrateWizardFields() {
  const setValue = (id, value) => { const element = document.getElementById(id); if (element && value !== undefined && value !== null) element.value = value; };
  setValue('input-proj-name', projectData.name); setValue('map-address-search', projectData.address); setValue('input-city', projectData.city); setValue('input-state', projectData.state); setValue('input-country', projectData.country); setValue('input-postal', projectData.postalCode); setValue('input-lat', projectData.latitude); setValue('input-long', projectData.longitude); setValue('input-plot-length', projectData.plotLength); setValue('input-plot-width', projectData.plotWidth); setValue('slider-budget', projectData.budget);
  [['construction-type-grid', 'constructionType'], ['material-quality-grid', 'materialQuality']].forEach(([gridId, property]) => document.querySelectorAll(`#${gridId} .option-card`).forEach(card => card.classList.toggle('active', card.querySelector('.option-title')?.textContent === projectData[property])));
  // Restore building category
  const catVal = projectData.buildingCategory === 'Commercial' ? 'commercial' : projectData.buildingCategory === 'Mixed Use' ? 'mixed' : 'residential';
  document.querySelectorAll('#building-type-grid .option-card').forEach(c => c.classList.toggle('active', c.dataset.val === catVal));
  // Restore commercial subtype
  document.querySelectorAll('#commercial-subtype-grid .option-card').forEach(c => c.classList.toggle('active', c.dataset.val === projectData.commercialType));
  // Restore residential subtype
  document.querySelectorAll('#residential-subtype-grid .option-card').forEach(c => c.classList.toggle('active', c.dataset.val === projectData.buildingType));
  // Show/hide subtype sections
  const commSection = document.getElementById('commercial-subtype-section');
  const resSection = document.getElementById('residential-subtype-section');
  if (commSection) commSection.style.display = catVal === 'commercial' ? '' : 'none';
  if (resSection) resSection.style.display = catVal === 'residential' ? '' : 'none';
  document.querySelectorAll('#direction-grid .dir-btn').forEach(button => button.classList.toggle('active', button.dataset.dir === projectData.roadDirection));
  ['floors', 'basement', 'parking', 'staircase', 'sustainability', 'energyEfficiency'].forEach(property => { const select = document.getElementById(`select-${property === 'energyEfficiency' ? 'energy' : property}`); const match = select && Array.from(select.options).find(option => option.text === projectData[property]); if (match) select.value = match.value; });
['balcony', 'garden', 'elevator'].forEach(key => { const checkbox = document.getElementById(`chk-${key}`); if (checkbox) checkbox.checked = Boolean(projectData.amenities?.[key]); });
  [['adaRamps', 'ada-ramps'], ['wideDoors', 'wide-doors'], ['accessibleBath', 'accessible-bath']].forEach(([key, id]) => { const checkbox = document.getElementById(`chk-${id}`); if (checkbox) checkbox.checked = Boolean(projectData.accessibility?.[key]); });
  
  // Re-render room cards for the current building type
  renderRoomCards();
}

function captureFormState() {
  projectData.name = document.getElementById('input-proj-name')?.value.trim() || projectData.name;
  projectData.plotLength = Number(document.getElementById('input-plot-length')?.value) || 0; projectData.plotWidth = Number(document.getElementById('input-plot-width')?.value) || 0; projectData.plotArea = Math.round(projectData.plotLength * projectData.plotWidth);
  ['floors', 'basement', 'parking', 'staircase', 'sustainability', 'energy'].forEach(key => { const select = document.getElementById(`select-${key}`); const property = key === 'energy' ? 'energyEfficiency' : key; if (select?.selectedOptions[0]) projectData[property] = select.selectedOptions[0].text; });
  Object.keys(projectData.rooms).forEach(key => { const size = Number(document.getElementById(`size-${key}`)?.value); if (size > 0) projectData.rooms[key].size = size; });
  projectData.amenities = { balcony: Boolean(document.getElementById('chk-balcony')?.checked), garden: Boolean(document.getElementById('chk-garden')?.checked), elevator: Boolean(document.getElementById('chk-elevator')?.checked) }; projectData.accessibility = { adaRamps: Boolean(document.getElementById('chk-ada-ramps')?.checked), wideDoors: Boolean(document.getElementById('chk-wide-doors')?.checked), accessibleBath: Boolean(document.getElementById('chk-accessible-bath')?.checked) };
}
function persistDraft() { captureFormState(); localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(projectData)); }
/* ==========================================================================
   1. CURRENCY SELECTOR (INR vs USD)
   ========================================================================== */
window.setProjectCurrency = function(curr) {
  projectData.currency = curr;

  const btnINR = document.getElementById('btn-curr-inr');
  const btnUSD = document.getElementById('btn-curr-usd');

  if (curr === 'INR') {
    btnINR?.classList.add('active');
    btnUSD?.classList.remove('active');
    document.getElementById('curr-label-tag').textContent = 'INR ₹';
    
    // Adjust budget slider range for INR
    setBudgetSliderConfig(2500000, 100000000, 500000, 12500000, [
      '₹25 Lakhs', '₹1 Crore', '₹3 Crores', '₹5 Crores', '₹10 Crores+'
    ]);
  } else {
    btnUSD?.classList.add('active');
    btnINR?.classList.remove('active');
    document.getElementById('curr-label-tag').textContent = 'USD $';

    // Adjust budget slider range for USD
    setBudgetSliderConfig(300000, 10000000, 100000, 1250000, [
      '$300k', '$1M', '$3M', '$5M', '$10M+'
    ]);
  }

  updateBudgetDisplay();
};

function initCurrencySelector() {
  const restoredBudget = projectData.budget;
  setProjectCurrency(projectData.currency === 'USD' ? 'USD' : 'INR');
  if (restoredBudget) { projectData.budget = restoredBudget; const slider = document.getElementById('slider-budget'); if (slider) slider.value = restoredBudget; updateBudgetDisplay(); }
}

function formatCurrencyAmount(amount, curr) {
  if (curr === 'INR') {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Crores`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} Lakhs`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  } else {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    }
    return `$${amount.toLocaleString('en-US')}`;
  }
}

function setBudgetSliderConfig(min, max, step, val, ticks) {
  const slider = document.getElementById('slider-budget');
  if (!slider) return;

  slider.min = min;
  slider.max = max;
  slider.step = step;
  slider.value = val;
  projectData.budget = val;

  const ticksContainer = document.getElementById('slider-ticks-container');
  if (ticksContainer && ticks.length === 5) {
    ticksContainer.innerHTML = ticks.map((t, idx) => `<span id="tick-${idx+1}">${t}</span>`).join('');
  }

  // Update fill after config change
  const pct = ((val - min) / (max - min)) * 100;
  slider.style.background = `linear-gradient(to right, #d4af37 ${pct}%, rgba(255,255,255,0.1) ${pct}%)`;
}

function updateBudgetDisplay() {
  const display = document.getElementById('val-budget-display');
  if (display) display.textContent = formatCurrencyAmount(projectData.budget, projectData.currency);
}

/* ==========================================================================
   2. STEP NAVIGATION LOGIC
   ========================================================================== */
window.jumpToStep = function(stepNum) {
  if (stepNum < 1 || stepNum > totalSteps) return;
  if (stepNum > currentStep && !validateStep(currentStep)) return;
  persistDraft(); currentStep = stepNum; updateStepUI();
};
window.nextStep = function() {
  if (isGeneratingProject || !validateStep(currentStep)) return;
  persistDraft();
  if (currentStep < totalSteps) { currentStep++; updateStepUI(); } else { saveAndGenerateProject(); }
};
window.prevStep = function() { if (currentStep > 1) { persistDraft(); currentStep--; updateStepUI(); } };
function validateStep(step) {
  let message = '';
  if (step === 1 && !document.getElementById('input-proj-name')?.value.trim()) message = 'Enter a project name before continuing.';
  else if (step === 2) { const length = Number(document.getElementById('input-plot-length')?.value); const width = Number(document.getElementById('input-plot-width')?.value); if (!projectData.city || !projectData.country) message = 'Select a project location before continuing.'; else if (length < 10 || width < 10) message = 'Enter plot dimensions of at least 10 units.'; }
  else if (step === 4 && !Object.values(projectData.rooms).some(room => room.qty > 0)) message = 'Add at least one room before continuing.';
  if (!message) return true; window.alert(message); return false;
}

function updateStepUI() {
  const fillPct = (currentStep / totalSteps) * 100;
  const fillEl = document.getElementById('progress-bar-fill');
  if (fillEl) fillEl.style.width = `${fillPct}%`;

  for (let i = 1; i <= totalSteps; i++) {
    const node = document.getElementById(`step-node-${i}`);
    const content = document.getElementById(`wizard-step-${i}`);

    if (node) {
      node.classList.remove('active', 'completed');
      if (i === currentStep) node.classList.add('active');
      else if (i < currentStep) node.classList.add('completed');
    }

    if (content) {
      content.classList.remove('active');
      if (i === currentStep) content.classList.add('active');
    }
  }

  const btnPrev = document.getElementById('btn-wiz-prev');
  const btnNext = document.getElementById('btn-wiz-next');
  const counterText = document.getElementById('wiz-step-counter');

  if (btnPrev) btnPrev.disabled = currentStep === 1;
  if (counterText) counterText.innerHTML = `Step <span>${currentStep}</span> of ${totalSteps}`;

  if (btnNext) {
    if (currentStep === totalSteps) {
      btnNext.innerHTML = `<span>Generate Project</span> <i data-lucide="sparkles"></i>`;
      btnNext.classList.add('btn-gold-shimmer');
      compileReviewSummary();
    } else {
      btnNext.innerHTML = `<span>Next Step</span> <i data-lucide="arrow-right"></i>`;
      btnNext.classList.remove('btn-gold-shimmer');
    }
  }

  document.querySelector('.wizard-main-container')?.scrollIntoView({ behavior: 'smooth' });
  createIcons({ icons });
}

/* ==========================================================================
   3. LOCATION STEP — GOOGLE MAPS / LEAFLET FALLBACK + FULL SYNC
   ========================================================================== */

// Location state
let _map = null;          // Google Map or Leaflet map instance
let _marker = null;       // Google Marker or Leaflet Marker
let _geocoder = null;     // Google Geocoder
let _autocomplete = null; // Google Autocomplete
let _leafletMap = null;
let _leafletMarker = null;
let _isGoogleMaps = false;
let _advancedOpen = false;
let _activeChip = null;

// Toggle Advanced Details
window.toggleAdvancedDetails = function() {
  _advancedOpen = !_advancedOpen;
  const panel = document.getElementById('loc-advanced-panel');
  const btn = document.getElementById('btn-advanced-details');
  if (panel) panel.classList.toggle('open', _advancedOpen);
  if (btn) btn.classList.toggle('expanded', _advancedOpen);
  createIcons({ icons }); // re-render icons after DOM change
};

function initGoogleMapsOrFallback() {
  const apiKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY
    || window.GOOGLE_MAPS_API_KEY
    || '';

  // Init quick chips
  initLocationChips();
  // Init current location button
  initCurrentLocationBtn();
  // Init map type toggle (wires up satellite/roadmap buttons)
  initMapTypeToggle();
  // Init zoom buttons (wired after map loads)

  if (!apiKey) {
    // No API key – show professional placeholder on top of fallback map
    document.getElementById('loc-no-api-notice')?.classList.remove('hidden');
    loadLeafletFallback();
    return;
  }

  // API key present – load Google Maps
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initLiveGoogleMap`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

window.initLiveGoogleMap = function() {
  _isGoogleMaps = true;

  const defaultPos = { lat: 20.5937, lng: 78.9629 }; // center of India
  const mapContainer = document.getElementById('map-container');

  _map = new google.maps.Map(mapContainer, {
    center: defaultPos,
    zoom: 5,
    mapTypeId: 'roadmap',
    disableDefaultUI: true,
    gestureHandling: 'greedy',
    styles: buildwiseDarkMapStyle()
  });

  _geocoder = new google.maps.Geocoder();

  // Custom draggable marker
  _marker = new google.maps.Marker({
    map: _map,
    draggable: true,
    animation: google.maps.Animation.DROP,
    icon: buildwiseMarkerIcon()
  });

  // Map click → move marker
  _map.addListener('click', (e) => {
    _marker.setPosition(e.latLng);
    reverseGeocodeGoogle(e.latLng);
  });

  // Marker dragend → sync data
  _marker.addListener('dragend', (e) => {
    reverseGeocodeGoogle(e.latLng);
  });

  // Places Autocomplete on search input
  const searchInput = document.getElementById('map-address-search');
  _autocomplete = new google.maps.places.Autocomplete(searchInput, {
    fields: ['geometry', 'formatted_address', 'address_components', 'name']
  });
  _autocomplete.addListener('place_changed', () => {
    const place = _autocomplete.getPlace();
    if (!place.geometry?.location) return;

    _map.panTo(place.geometry.location);
    _map.setZoom(15);
    _marker.setPosition(place.geometry.location);
    _marker.setAnimation(google.maps.Animation.DROP);
    syncLocationFromGooglePlace(place, place.geometry.location);
    closeAutocompleteDropdown();
  });

  // Map type toggle
  document.getElementById('btn-map-roadmap')?.addEventListener('click', () => {
    _map?.setMapTypeId('roadmap');
    setActiveMapTypeBtn('roadmap');
  });
  document.getElementById('btn-map-satellite')?.addEventListener('click', () => {
    _map?.setMapTypeId('hybrid');
    setActiveMapTypeBtn('satellite');
  });

  // Zoom buttons
  document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
    _map?.setZoom((_map.getZoom() || 10) + 1);
  });
  document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
    _map?.setZoom(Math.max(1, (_map.getZoom() || 10) - 1));
  });
};

function reverseGeocodeGoogle(latLng) {
  if (!_geocoder) return;
  _geocoder.geocode({ location: latLng }, (results, status) => {
    if (status === 'OK' && results[0]) {
      syncLocationFromGooglePlace(results[0], latLng);
    }
  });
}

function syncLocationFromGooglePlace(place, location) {
  const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
  const lng = typeof location.lng === 'function' ? location.lng() : location.lng;

  const data = {
    lat: lat.toFixed(6),
    lng: lng.toFixed(6),
    formattedAddress: place.formatted_address || '',
    locality: '',
    sublocality: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    timezone: guessTimezone(lat, lng)
  };

  if (place.address_components) {
    place.address_components.forEach(comp => {
      if (comp.types.includes('sublocality_level_1') || comp.types.includes('sublocality'))
        data.sublocality = comp.long_name;
      if (comp.types.includes('locality'))
        data.city = comp.long_name;
      if (comp.types.includes('administrative_area_level_1'))
        data.state = comp.long_name;
      if (comp.types.includes('country'))
        data.country = comp.long_name;
      if (comp.types.includes('postal_code'))
        data.postalCode = comp.long_name;
    });
  }
  data.locality = data.sublocality || data.city || '';

  applyLocationSync(data);
}

/* ── Leaflet Fallback ── */
function loadLeafletFallback() {
  // Load Leaflet CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);

  // Load Leaflet JS
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.onload = initLeafletMap;
  document.head.appendChild(script);
}

function initLeafletMap() {
  const mapContainer = document.getElementById('map-container');
  if (!mapContainer) return;

  const defaultPos = [20.5937, 78.9629]; // center of India

  _leafletMap = L.map(mapContainer, {
    center: defaultPos,
    zoom: 5,
    zoomControl: false,
    attributionControl: false
  });

  // OpenStreetMap tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(_leafletMap);

  // Custom gold pin
  const pinIcon = L.divIcon({
    className: 'bw-marker-icon',
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="36" height="48">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="#d4af37" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.6))"/>
      <circle cx="12" cy="12" r="5" fill="#061610"/>
    </svg>`,
    iconSize: [36, 48],
    iconAnchor: [18, 48],
    popupAnchor: [0, -48]
  });

  _leafletMarker = L.marker(defaultPos, { draggable: true, icon: pinIcon }).addTo(_leafletMap);

  // Click on map → move marker + reverse geocode
  _leafletMap.on('click', (e) => {
    _leafletMarker.setLatLng(e.latlng);
    reverseGeocodeNominatim(e.latlng.lat, e.latlng.lng);
  });

  // Drag marker → sync
  _leafletMarker.on('dragend', (e) => {
    const pos = e.target.getLatLng();
    reverseGeocodeNominatim(pos.lat, pos.lng);
  });

  // Zoom buttons for leaflet
  document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
    _leafletMap?.setZoom((_leafletMap.getZoom() || 5) + 1);
  });
  document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
    _leafletMap?.setZoom(Math.max(2, (_leafletMap.getZoom() || 5) - 1));
  });

  // Map type toggle (for leaflet we swap tile layers)
  let _osmLayer = _leafletMap.eachLayer(l => l); // already added
  let _satLayer = null;

  document.getElementById('btn-map-satellite')?.addEventListener('click', () => {
    if (_satLayer) return; // already satellite
    // Use Esri World Imagery for satellite
    _satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19
    }).addTo(_leafletMap);
    setActiveMapTypeBtn('satellite');
  });
  document.getElementById('btn-map-roadmap')?.addEventListener('click', () => {
    if (_satLayer) {
      _leafletMap.removeLayer(_satLayer);
      _satLayer = null;
    }
    setActiveMapTypeBtn('roadmap');
  });

  // Autocomplete-like search using Nominatim
  const searchInput = document.getElementById('map-address-search');
  let debounceTimer;
  searchInput?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const val = searchInput.value.trim();
    if (val.length < 3) { closeAutocompleteDropdown(); return; }
    debounceTimer = setTimeout(() => nominatimAutocomplete(val), 350);
  });
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAutocompleteDropdown();
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.form-group')) closeAutocompleteDropdown();
  });
}

// Nominatim reverse geocode (no API key needed)
function reverseGeocodeNominatim(lat, lng) {
  fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`)
    .then(r => r.json())
    .then(data => {
      const addr = data.address || {};
      const syncData = {
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
        formattedAddress: data.display_name || '',
        locality: addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || '',
        city: addr.city || addr.town || addr.village || addr.municipality || '',
        state: addr.state || '',
        country: addr.country || '',
        postalCode: addr.postcode || '',
        timezone: guessTimezone(lat, lng)
      };
      applyLocationSync(syncData);
    })
    .catch(() => {
      // silently fail
    });
}

// Nominatim forward search for autocomplete suggestions
function nominatimAutocomplete(query) {
  fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`)
    .then(r => r.json())
    .then(results => {
      showAutocompleteResults(results.map(r => ({
        main: r.name || r.display_name.split(',')[0],
        sub: r.display_name,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        rawData: r
      })));
    })
    .catch(() => closeAutocompleteDropdown());
}

function showAutocompleteResults(items) {
  const dropdown = document.getElementById('loc-autocomplete-dropdown');
  if (!dropdown) return;
  if (!items || items.length === 0) { closeAutocompleteDropdown(); return; }

  dropdown.innerHTML = items.map((item, i) => `
    <div class="loc-autocomplete-item" data-idx="${i}">
      <div class="ac-icon"><i data-lucide="map-pin"></i></div>
      <div class="ac-text">
        <div class="ac-main">${escapeHtml(item.main)}</div>
        <div class="ac-sub">${escapeHtml(item.sub)}</div>
      </div>
    </div>
  `).join('');

  dropdown.classList.add('visible');
  createIcons({ icons });

  dropdown.querySelectorAll('.loc-autocomplete-item').forEach((el, i) => {
    el.addEventListener('click', () => {
      const item = items[i];
      selectLocationFromAutocomplete(item);
    });
  });
}

function selectLocationFromAutocomplete(item) {
  const searchInput = document.getElementById('map-address-search');
  if (searchInput) searchInput.value = item.main;
  closeAutocompleteDropdown();

  if (_leafletMap && _leafletMarker) {
    const latlng = L.latLng(item.lat, item.lng);
    _leafletMap.setView(latlng, 15, { animate: true });
    _leafletMarker.setLatLng(latlng);
    reverseGeocodeNominatim(item.lat, item.lng);
  }
  if (_isGoogleMaps && _map && _marker) {
    const pos = new google.maps.LatLng(item.lat, item.lng);
    _map.panTo(pos);
    _map.setZoom(15);
    _marker.setPosition(pos);
    reverseGeocodeGoogle(pos);
  }
}

function closeAutocompleteDropdown() {
  const dropdown = document.getElementById('loc-autocomplete-dropdown');
  if (dropdown) dropdown.classList.remove('visible');
}

/* ── Location Chips ── */
function initLocationChips() {
  document.querySelectorAll('.loc-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const query = chip.getAttribute('data-query');
      if (!query) return;

      // Mark chip active
      document.querySelectorAll('.loc-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const searchInput = document.getElementById('map-address-search');
      if (searchInput) searchInput.value = query;

      if (_isGoogleMaps && _geocoder) {
        _geocoder.geocode({ address: query }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const loc = results[0].geometry.location;
            _map.panTo(loc);
            _map.setZoom(13);
            _marker.setPosition(loc);
            _marker.setAnimation(google.maps.Animation.DROP);
            syncLocationFromGooglePlace(results[0], loc);
          }
        });
      } else {
        // Nominatim geocode
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`)
          .then(r => r.json())
          .then(results => {
            if (results && results[0]) {
              const lat = parseFloat(results[0].lat);
              const lng = parseFloat(results[0].lon);
              if (_leafletMap && _leafletMarker) {
                _leafletMap.setView([lat, lng], 13, { animate: true });
                _leafletMarker.setLatLng([lat, lng]);
              }
              reverseGeocodeNominatim(lat, lng);
            }
          })
          .catch(() => {});
      }
    });
  });
}

/* ── Current Location Button ── */
function initCurrentLocationBtn() {
  document.getElementById('btn-current-location')?.addEventListener('click', () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (_isGoogleMaps && _map && _marker) {
          const loc = new google.maps.LatLng(lat, lng);
          _map.panTo(loc);
          _map.setZoom(15);
          _marker.setPosition(loc);
          reverseGeocodeGoogle(loc);
        } else if (_leafletMap && _leafletMarker) {
          _leafletMap.setView([lat, lng], 15, { animate: true });
          _leafletMarker.setLatLng([lat, lng]);
          reverseGeocodeNominatim(lat, lng);
        }
      },
      () => {} // silently ignore denied
    );
  });
}

/* ── Map Type Toggle ── */
function initMapTypeToggle() {
  setActiveMapTypeBtn('roadmap');
}
function setActiveMapTypeBtn(type) {
  document.getElementById('btn-map-roadmap')?.classList.toggle('active', type === 'roadmap');
  document.getElementById('btn-map-satellite')?.classList.toggle('active', type === 'satellite');
}

/* ── Sync Location Data ── */
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val || '—';
}

function applyLocationSync(data) {
  // Update projectData
  projectData.address = data.formattedAddress;
  projectData.city = data.city;
  projectData.state = data.state;
  projectData.country = data.country;
  projectData.postalCode = data.postalCode;
  projectData.latitude = data.lat;
  projectData.longitude = data.lng;
  projectData.timezone = data.timezone;

  // Update hidden fields (for compileReviewSummary compatibility)
  const setHidden = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  };
  setHidden('input-city', data.city);
  setHidden('input-state', data.state);
  setHidden('input-country', data.country);
  setHidden('input-postal', data.postalCode);
  setHidden('input-lat', data.lat);
  setHidden('input-long', data.lng);

  // Update Summary Card DOM
  setText('sum-locality', data.locality || data.city);
  setText('sum-city', data.city);
  setText('sum-state', data.state);
  setText('sum-country', data.country);
  setText('sum-postal', data.postalCode);
  setText('sum-address', data.formattedAddress);
  setText('sum-lat', `${data.lat}°`);
  setText('sum-lng', `${data.lng}°`);
  setText('sum-timezone', data.timezone);

  // Show summary body + badge
  const body = document.getElementById('loc-summary-body');
  const badge = document.getElementById('loc-summary-badge');
  const status = document.getElementById('loc-summary-status');
  const title = document.getElementById('loc-summary-title');

  if (body) body.style.display = 'block';
  if (badge) badge.style.display = 'inline-flex';
  if (status) status.textContent = data.city + (data.state ? `, ${data.state}` : '') + (data.country ? `, ${data.country}` : '');
  if (title) title.textContent = 'Project Location';

  // Run site analysis and update foundation recommendation
  runSiteAnalysis(data);

  // Re-render any new lucide icons in the card
  createIcons({ icons });
}

/* ── Site Analysis & Foundation Recommendation ── */
function runSiteAnalysis(locationData) {
  const card = document.getElementById('loc-foundation-card');
  const textEl = document.getElementById('foundation-text');
  const subtitleEl = document.getElementById('foundation-subtitle');
  if (!card || !textEl) return;

  const analysis = analyzeSite({
    city: locationData.city,
    state: locationData.state,
    country: locationData.country,
    latitude: locationData.lat,
    longitude: locationData.lng,
    plotArea: projectData.plotArea || 4500
  });

  textEl.textContent = analysis.recommendation;
  if (subtitleEl) subtitleEl.textContent = `Site analysis for ${locationData.city || 'selected location'}`;

  // Store in projectData for later use
  projectData.siteAnalysis = analysis;

  card.style.display = 'block';
  createIcons({ icons });
}

/* ── Google Maps Dark Theme Style ── */
function buildwiseDarkMapStyle() {
  return [
    { elementType: 'geometry', stylers: [{ color: '#0d1f18' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#7b9a8e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0b1a13' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#163624' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0b1a13' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9db3a7' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1e4b34' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#0d2a1f' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#d4af37' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#071812' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3a6655' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1e4b34' }] },
    { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9db3a7' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#eef3f0' }] }
  ];
}

/* ── Google Maps Custom Marker Icon ── */
function buildwiseMarkerIcon() {
  return {
    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    fillColor: '#d4af37',
    fillOpacity: 1,
    strokeColor: '#f6e27a',
    strokeWeight: 1.5,
    scale: 1.8,
    anchor: new google.maps.Point(12, 22)
  };
}

/* ── Timezone guesser (rough, based on longitude) ── */
function guessTimezone(lat, lng) {
  const offset = Math.round(lng / 15);
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const pad = absOffset < 10 ? '0' : '';

  // Some known cities for accuracy
  if (lng > 67 && lng < 97.5 && lat > 8 && lat < 36) return 'Asia/Kolkata (UTC+5:30)';
  if (lng > 97.5 && lng < 135 && lat > 20 && lat < 40) return 'Asia/Seoul / Asia/Tokyo (UTC+9)';
  if (lng > 97.5 && lng < 125 && lat > 20 && lat < 35) return 'Asia/Shanghai (UTC+8)';
  if (lng > 24 && lng < 37 && lat > 36 && lat < 42) return 'Europe/Istanbul (UTC+3)';
  if (lng > -10 && lng < 25 && lat > 35 && lat < 60) return 'Europe/London / Berlin (UTC+1)';
  if (lng > -80 && lng < -65 && lat > 25 && lat < 50) return 'America/New_York (UTC-5)';
  if (lng > -125 && lng < -100 && lat > 25 && lat < 50) return 'America/Los_Angeles (UTC-8)';

  return `UTC${sign}${pad}${absOffset}:00`;
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}


/* ==========================================================================
   4. OPTION CARDS & SELECTORS
   ========================================================================== */
function initCardSelectors() {
  // Building Category (Residential / Commercial / Mixed Use)
  document.querySelectorAll('#building-type-grid .option-card').forEach(card => {
    card.addEventListener('click', (e) => {
      document.querySelectorAll('#building-type-grid .option-card').forEach(c => c.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const val = e.currentTarget.dataset.val;
      projectData.buildingCategory = e.currentTarget.querySelector('.option-title').textContent;

      const commSection = document.getElementById('commercial-subtype-section');
      const resSection = document.getElementById('residential-subtype-section');
      if (val === 'commercial') {
        if (commSection) commSection.style.display = '';
        if (resSection) resSection.style.display = 'none';
        const activeCard = document.querySelector('#commercial-subtype-grid .option-card.active');
        projectData.commercialType = activeCard?.dataset.val || 'Office Building';
        projectData.buildingType = projectData.commercialType;
      } else if (val === 'residential') {
        if (commSection) commSection.style.display = 'none';
        if (resSection) resSection.style.display = '';
        const activeCard = document.querySelector('#residential-subtype-grid .option-card.active');
        projectData.buildingType = activeCard?.dataset.val || 'Single-Family Villa';
      } else {
        if (commSection) commSection.style.display = 'none';
        if (resSection) resSection.style.display = 'none';
        projectData.buildingType = 'Mixed-Use Complex';
      }
      
      // Re-initialize rooms and re-render room cards when building type changes
      initializeRoomsFromLibrary(projectData, projectData.buildingCategory, projectData.buildingType, projectData.commercialType);
      renderRoomCards();
    });
  });

  // Commercial Subtype
  document.querySelectorAll('#commercial-subtype-grid .option-card').forEach(card => {
    card.addEventListener('click', (e) => {
      document.querySelectorAll('#commercial-subtype-grid .option-card').forEach(c => c.classList.remove('active'));
      e.currentTarget.classList.add('active');
      projectData.commercialType = e.currentTarget.dataset.val;
      projectData.buildingType = projectData.commercialType;
      
      // Re-initialize rooms and re-render room cards
      initializeRoomsFromLibrary(projectData, projectData.buildingCategory, projectData.buildingType, projectData.commercialType);
      renderRoomCards();
    });
  });

  // Residential Subtype
  document.querySelectorAll('#residential-subtype-grid .option-card').forEach(card => {
    card.addEventListener('click', (e) => {
      document.querySelectorAll('#residential-subtype-grid .option-card').forEach(c => c.classList.remove('active'));
      e.currentTarget.classList.add('active');
      projectData.buildingType = e.currentTarget.dataset.val;
      
      // Re-initialize rooms and re-render room cards
      initializeRoomsFromLibrary(projectData, projectData.buildingCategory, projectData.buildingType, projectData.commercialType);
      renderRoomCards();
    });
  });

  // Set initial category state
  const initialCat = document.querySelector('#building-type-grid .option-card.active')?.dataset.val;
  const commSection = document.getElementById('commercial-subtype-section');
  const resSection = document.getElementById('residential-subtype-section');
  if (initialCat === 'commercial') {
    if (commSection) commSection.style.display = '';
    if (resSection) resSection.style.display = 'none';
  } else if (initialCat === 'residential') {
    if (commSection) commSection.style.display = 'none';
    if (resSection) resSection.style.display = '';
  } else {
    if (commSection) commSection.style.display = 'none';
    if (resSection) resSection.style.display = 'none';
  }

  document.querySelectorAll('#construction-type-grid .option-card').forEach(card => {
    card.addEventListener('click', (e) => {
      document.querySelectorAll('#construction-type-grid .option-card').forEach(c => c.classList.remove('active'));
      e.currentTarget.classList.add('active');
      projectData.constructionType = e.currentTarget.querySelector('.option-title').textContent;
    });
  });

  document.querySelectorAll('#material-quality-grid .option-card').forEach(card => {
    card.addEventListener('click', (e) => {
      document.querySelectorAll('#material-quality-grid .option-card').forEach(c => c.classList.remove('active'));
      e.currentTarget.classList.add('active');
      projectData.materialQuality = e.currentTarget.querySelector('.option-title').textContent;
    });
  });
}

/* ==========================================================================
   5. PLOT CALCULATIONS
   ========================================================================== */
function initPlotCalculations() {
  const inputLength = document.getElementById('input-plot-length');
  const inputWidth = document.getElementById('input-plot-width');
  const outputArea = document.getElementById('output-plot-area');

  function calculateArea() {
    const l = parseFloat(inputLength.value) || 0;
    const w = parseFloat(inputWidth.value) || 0;
    const area = Math.round(l * w);

    projectData.plotLength = l;
    projectData.plotWidth = w;
    projectData.plotArea = area;

    const unitLabel = projectData.unit === 'sqft' ? 'sq ft' : 'sq m';
    if (outputArea) outputArea.textContent = `${area.toLocaleString()} ${unitLabel}`;

    // Re-run site analysis with updated plot area if location is set
    if (projectData.city || projectData.latitude) {
      runSiteAnalysis({
        city: projectData.city,
        state: projectData.state,
        country: projectData.country,
        lat: projectData.latitude,
        lng: projectData.longitude
      });
    }
  }

  inputLength?.addEventListener('input', calculateArea);
  inputWidth?.addEventListener('input', calculateArea);

  window.setPlotUnit = function(unit) {
    projectData.unit = unit;
    document.getElementById('unit-sqft')?.classList.toggle('active', unit === 'sqft');
    document.getElementById('unit-sqm')?.classList.toggle('active', unit === 'sqm');

    const tagLength = document.getElementById('tag-length-unit');
    const tagWidth = document.getElementById('tag-width-unit');

    if (tagLength) tagLength.textContent = unit === 'sqft' ? 'ft' : 'm';
    if (tagWidth) tagWidth.textContent = unit === 'sqft' ? 'ft' : 'm';

    calculateArea();
  };
}

function initDirectionButtons() {
  document.querySelectorAll('#direction-grid .dir-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('#direction-grid .dir-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      projectData.roadDirection = e.currentTarget.getAttribute('data-dir');
    });
  });
}

/* ==========================================================================
    6. ROOM COUNTERS
    ========================================================================== */
window.changeRoomQty = function(roomType, delta) {
  // Auto-initialize if the room key doesn't exist yet
  if (!projectData.rooms[roomType]) {
    projectData.rooms[roomType] = { qty: 0, size: 100 };
  }

  let currentQty = projectData.rooms[roomType].qty || 0;
  currentQty = Math.max(0, currentQty + delta);
  projectData.rooms[roomType].qty = currentQty;

  // Update quantity display
  const qtyEl = document.getElementById(`qty-${roomType}`);
  if (qtyEl) qtyEl.textContent = currentQty;

  // Update the minus button disabled state
  const card = qtyEl ? qtyEl.closest('.room-row-card') : null;
  if (card) {
    const minusBtn = card.querySelector('.counter-btn');
    if (minusBtn) minusBtn.disabled = currentQty <= 0;
  }

  // Also update the area when qty changes
  const sizeEl = document.getElementById(`size-${roomType}`);
  if (sizeEl) {
    const baseSize = projectData.rooms[roomType].size || 100;
/* ==========================================================================
    6. ROOM COUNTERS
    ========================================================================== */

    projectData.rooms[roomType].size = baseSize;
  }
};

/* ==========================================================================
   ROOM CARD RENDERING - Dynamic based on building type
   ========================================================================== */
window.updateRoomSize = function(roomKey, value) {
  if (projectData.rooms[roomKey]) {
    projectData.rooms[roomKey].size = Number(value) || 0;
  }
};

function renderRoomCards() {
  const container = document.getElementById('rooms-list');
  if (!container) return;

  const palette = getRoomPalette(projectData.buildingCategory, projectData.buildingType, projectData.commercialType);
  const categories = getRoomCategories();

  // Ensure all palette rooms exist in projectData.rooms state with defaults
  palette.forEach((room) => {
    if (!projectData.rooms[room.key]) {
      projectData.rooms[room.key] = { qty: room.defaultQty || 0, size: room.defaultSize || 100 };
    }
  });

  // Group rooms by category
  const grouped = {};
  palette.forEach((room) => {
    const cat = room.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(room);
  });

  // Sort categories by order
  const sortedCats = Object.keys(grouped).sort((a, b) => {
    const orderA = categories[a] ? categories[a].order : 99;
    const orderB = categories[b] ? categories[b].order : 99;
    return orderA - orderB;
  });

  let html = '';

  sortedCats.forEach((catKey) => {
    const catInfo = categories[catKey] || { label: catKey, icon: 'square' };
    const rooms = grouped[catKey];

    html += `<div class="room-category-section">`;
    html += `<div class="room-category-header">`;
    html += `<i data-lucide="${catInfo.icon}" class="cat-icon"></i>`;
    html += `<span class="cat-label">${catInfo.label}</span>`;
    html += `</div>`;
    html += `<div class="room-category-rooms">`;

    rooms.forEach((room) => {
      const roomData = projectData.rooms[room.key];
      const qty = roomData ? roomData.qty : (room.defaultQty || 0);
      const size = roomData ? roomData.size : (room.defaultSize || 100);
      const minusDisabled = qty <= 0 ? ' disabled' : '';

      html += `<div class="room-row-card" data-room-key="${room.key}">`;
      html += `<div class="room-info">`;
      html += `<i data-lucide="${room.icon}" class="room-icon"></i>`;
      html += `<div><strong>${room.label}</strong>`;
      html += `<span>${room.category === 'unit' ? 'Per unit' : ''}</span></div>`;
      html += `</div>`;
      html += `<div class="room-controls">`;
      html += `<div class="counter-box">`;
      html += `<button class="counter-btn" onclick="changeRoomQty('${room.key}', -1)"${minusDisabled}>-</button>`;
      html += `<span class="counter-val" id="qty-${room.key}">${qty}</span>`;
      html += `<button class="counter-btn" onclick="changeRoomQty('${room.key}', 1)">+</button>`;
      html += `</div>`;
      html += `<div class="room-size-input">`;
      html += `<input type="number" id="size-${room.key}" class="input-text-unified input-sm" value="${size}" min="0" onchange="updateRoomSize('${room.key}', this.value)">`;
      html += `<span class="size-unit">${projectData.unit === 'sqft' ? 'sq ft' : 'sq m'}</span>`;
      html += `</div>`;
      html += `</div>`;
      html += `</div>`;
    });

    html += `</div></div>`;
  });

  container.innerHTML = html;
  createIcons({ icons });
}

/* ==========================================================================
   7. BUDGET SLIDER
   ========================================================================== */
function initBudgetSlider() {
  const slider = document.getElementById('slider-budget');

  function updateSliderFill() {
    if (!slider) return;
    const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.setProperty('--slider-pct', `${pct}%`);
    // Update the inline background so all browsers see the fill
    slider.style.background = `linear-gradient(to right, var(--wiz-gold-accent, #d4af37) ${pct}%, rgba(255,255,255,0.1) ${pct}%)`;
  }

  slider?.addEventListener('input', () => {
    projectData.budget = parseInt(slider.value);
    updateBudgetDisplay();
    updateSliderFill();
  });

  // Also call once on init to set initial fill position
  if (slider) updateSliderFill();
}

/* ==========================================================================
   8. COMPILE REVIEW SUMMARY (STEP 6)
   ========================================================================== */
function compileReviewSummary() {
  const projNameInput = document.getElementById('input-proj-name')?.value;
  if (projNameInput) projectData.name = projNameInput;

  document.getElementById('rev-proj-name').textContent = projectData.name;
  const revBT = document.getElementById('rev-building-type');
  if (revBT) {
    const cat = projectData.buildingCategory || 'Residential';
    const typ = projectData.buildingType || '';
    revBT.textContent = cat === 'Commercial' ? `${cat} — ${typ}` : typ;
  }
  document.getElementById('rev-construction-type').textContent = projectData.constructionType;

  // Location data is already synchronized into projectData by applyLocationSync().
  // Hidden inputs act as a secondary source; we read from projectData first.
  const city    = projectData.city    || document.getElementById('input-city')?.value    || '';
  const state   = projectData.state   || document.getElementById('input-state')?.value   || '';
  const country = projectData.country || document.getElementById('input-country')?.value || '';
  const postal  = projectData.postalCode || document.getElementById('input-postal')?.value || '';

  const unitLabel = projectData.unit === 'sqft' ? 'ft' : 'm';
  const areaLabel = projectData.unit === 'sqft' ? 'sq ft' : 'sq m';

  // Location line: "City, State, Country (PIN)"
  const locationLine = [city, state, country].filter(Boolean).join(', ') + (postal ? ` — PIN ${postal}` : '');
  const revLocation = document.getElementById('rev-location');
  if (revLocation) revLocation.textContent = locationLine;

  // Full address line (if available from geocoding)
  const revAddress = document.getElementById('rev-address');
  if (revAddress) {
    revAddress.textContent = projectData.address || locationLine;
    revAddress.closest('.rev-item')?.classList.toggle('hidden', !projectData.address);
  }

  document.getElementById('rev-dimensions').textContent = `${projectData.plotLength} ${unitLabel} × ${projectData.plotWidth} ${unitLabel}`;
  document.getElementById('rev-area').textContent = `${projectData.plotArea.toLocaleString()} ${areaLabel}`;
  document.getElementById('rev-direction').textContent = projectData.roadDirection;

  // Foundation recommendation from site analysis
  const foundationEl = document.getElementById('rev-foundation');
  if (foundationEl) {
    foundationEl.textContent = projectData.siteAnalysis?.recommendation || '—';
  }

  const floorsSelect = document.getElementById('select-floors');
  if (floorsSelect) projectData.floors = floorsSelect.options[floorsSelect.selectedIndex].text;

  const basementSelect = document.getElementById('select-basement');
  if (basementSelect) projectData.basement = basementSelect.options[basementSelect.selectedIndex].text;

  const parkingSelect = document.getElementById('select-parking');
  if (parkingSelect) projectData.parking = parkingSelect.options[parkingSelect.selectedIndex].text;

  const amenitiesList = [];
  if (document.getElementById('chk-balcony')?.checked) amenitiesList.push('Balcony');
  if (document.getElementById('chk-garden')?.checked) amenitiesList.push('Garden');
  if (document.getElementById('chk-elevator')?.checked) amenitiesList.push('Elevator');

  document.getElementById('rev-floors').textContent = projectData.floors;
  document.getElementById('rev-basement').textContent = projectData.basement;
  document.getElementById('rev-parking').textContent = projectData.parking;
  document.getElementById('rev-amenities').textContent = amenitiesList.join(', ') || 'Standard Amenities';

  const roomSummaryContainer = document.getElementById('rev-rooms-summary');
  if (roomSummaryContainer) {
    let roomRowsHTML = '';
    let totalRoomCount = 0;

    Object.keys(projectData.rooms).forEach(key => {
      const room = projectData.rooms[key];
      const sizeInput = document.getElementById(`size-${key}`)?.value || room.size;
      room.size = sizeInput;

      if (room.qty > 0) {
        totalRoomCount += room.qty;
        const formattedName = key.charAt(0).toUpperCase() + key.slice(1);
        roomRowsHTML += `
          <div class="rev-item">
            <span>${formattedName} (${room.qty}x):</span>
            <strong>${room.size} ${areaLabel} each</strong>
          </div>
        `;
      }
    });

    roomSummaryContainer.innerHTML = roomRowsHTML + `
      <div class="rev-item" style="border-top:1px dashed var(--border-light); padding-top:0.4rem; margin-top:0.4rem;">
        <span>Total Configured Rooms:</span>
        <strong class="text-gold">${totalRoomCount} Rooms Total</strong>
      </div>
    `;
  }

  document.getElementById('rev-budget').textContent = `${formatCurrencyAmount(projectData.budget, projectData.currency)} (${projectData.currency})`;
  document.getElementById('rev-quality').textContent = projectData.materialQuality;

  const susSelect = document.getElementById('select-sustainability');
  if (susSelect) projectData.sustainability = susSelect.options[susSelect.selectedIndex].text;

  const nrgSelect = document.getElementById('select-energy');
  if (nrgSelect) projectData.energyEfficiency = nrgSelect.options[nrgSelect.selectedIndex].text;

  document.getElementById('rev-sustainability').textContent = projectData.sustainability;
  document.getElementById('rev-energy').textContent = projectData.energyEfficiency;
}

/* ==========================================================================
   9. SAVE & REDIRECT
   ========================================================================== */
function saveAndGenerateProject() {
  if (isGeneratingProject) return;
  isGeneratingProject = true;
  const nextButton = document.getElementById('btn-wiz-next');
  const modal = document.getElementById('modal-workspace-saving');
  try {
    compileReviewSummary();
    captureFormState();
    projectData.id = projectData.id || `project_${Date.now()}`;
    projectData.createdAt = projectData.createdAt || new Date().toISOString();
    projectData.updatedAt = new Date().toISOString();
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(projectData));
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    const projNameEl = document.getElementById('saving-proj-name');
    if (projNameEl) projNameEl.textContent = projectData.name;
    if (nextButton) nextButton.disabled = true;
    if (modal) modal.setAttribute('aria-hidden', 'false');
    const workspaceUrl = new URL('./workspace.html', window.location.href).href;
    window.setTimeout(() => window.location.assign(workspaceUrl), 450);
  } catch (error) {
    console.error('Project creation failed.', error);
    isGeneratingProject = false;
    if (nextButton) nextButton.disabled = false;
    showProjectCreationError(error);
  }
}

function showProjectCreationError(error) {
  const modal = document.getElementById('modal-workspace-saving');
  if (!modal) { window.alert('We could not create your project. Please retry.'); return; }
  modal.setAttribute('aria-hidden', 'false');
  const dialog = modal.querySelector('.modal-dialog');
  if (!dialog) return;
  dialog.innerHTML = `
    <div class="loc-summary-pin-icon" style="margin:0 auto 1rem;"><i data-lucide="triangle-alert"></i></div>
    <h3 class="gold-text">Project creation needs your attention</h3>
    <p style="margin-top:.8rem; color:var(--text-muted);">Your wizard inputs are still available. We could not open the workspace: ${escapeHtml(error?.message || 'Unknown error')}.</p>
    <button class="btn btn-wizard-primary" id="btn-retry-project" style="margin-top:1.25rem;">Retry opening workspace</button>`;
  createIcons({ icons });
  document.getElementById('btn-retry-project')?.addEventListener('click', () => {
    dialog.innerHTML = '<div class="ai-loader-spinner"></div><h3 class="gold-text">Retrying project creation…</h3>';
    saveAndGenerateProject();
  });
}