import * as THREE from 'three';
import { createIcons, icons } from 'lucide';

// Initialize Lucide Icons & Page Components
document.addEventListener('DOMContentLoaded', () => {
  createIcons({ icons });
  initThreeJSScene();
  initMouseSpotlight();
  initCommandPalette();
  initCostEstimator();
  initDashboardEvents();
  initAuthenticationFlow();
  initSolutionsTabs();
  initScrollAnimations();
  initParallaxCard();
  syncDashboardWithSavedProject();
});

/* ==========================================================================
   1. THREE.JS ISOMETRIC 3D MODERN ARCHITECTURAL HOUSE VIEWER
   ========================================================================== */
let scene, camera, renderer, houseGroup;
let floor1Mesh, floor2Mesh, roofMesh;
let isWireframe = false;

function initThreeJSScene() {
  const container = document.getElementById('canvas-container');
  const canvas = document.getElementById('hero-3d-canvas');
  if (!container || !canvas) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  scene = new THREE.Scene();

  const aspect = width / height;
  const d = 14;
  camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
  camera.position.set(22, 22, 22);
  camera.lookAt(0, 2, 0);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const ambientLight = new THREE.AmbientLight(0x0c3123, 1.8);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xf6e27a, 2.5);
  mainLight.position.set(20, 30, 15);
  mainLight.castShadow = true;
  scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0x34d399, 1.2);
  fillLight.position.set(-20, 10, -15);
  scene.add(fillLight);

  houseGroup = new THREE.Group();
  scene.add(houseGroup);

  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x16241e, roughness: 0.4 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.8 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x6ee7b7, transmission: 0.85, transparent: true, roughness: 0.1 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x271911, roughness: 0.7 });

  // Foundation
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(16, 0.6, 14), concreteMat);
  foundation.position.y = -0.3;
  houseGroup.add(foundation);

  // Floor 1
  floor1Mesh = new THREE.Group();
  const f1Walls = new THREE.Mesh(new THREE.BoxGeometry(12, 3.5, 9), concreteMat);
  f1Walls.position.set(-1, 1.75, -1);
  floor1Mesh.add(f1Walls);

  const f1Glass = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 0.2), glassMat);
  f1Glass.position.set(-1, 1.75, 3.5);
  floor1Mesh.add(f1Glass);
  houseGroup.add(floor1Mesh);

  // Floor 2
  floor2Mesh = new THREE.Group();
  const f2Slab = new THREE.Mesh(new THREE.BoxGeometry(14, 0.5, 11), goldMat);
  f2Slab.position.set(0.5, 3.75, 0.5);
  floor2Mesh.add(f2Slab);

  const f2Main = new THREE.Mesh(new THREE.BoxGeometry(10, 3.5, 8), concreteMat);
  f2Main.position.set(1.5, 5.75, 0.5);
  floor2Mesh.add(f2Main);
  houseGroup.add(floor2Mesh);

  // Roof
  roofMesh = new THREE.Group();
  const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(15, 0.4, 12), darkWoodMat);
  roofSlab.position.set(0.5, 7.7, 0.5);
  roofMesh.add(roofSlab);
  houseGroup.add(roofMesh);

  let angle = 0;
  function animate() {
    requestAnimationFrame(animate);
    angle += 0.003;
    houseGroup.rotation.y = Math.sin(angle) * 0.15;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    const asp = w / h;
    camera.left = -d * asp;
    camera.right = d * asp;
    camera.top = d;
    camera.bottom = -d;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  document.querySelectorAll('.tool-btn[data-layer]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tool-btn[data-layer]').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const layer = e.currentTarget.getAttribute('data-layer');
      floor1Mesh.visible = layer === 'all' || layer === 'l1' || layer === 'xray';
      floor2Mesh.visible = layer === 'all' || layer === 'l2' || layer === 'xray';
      roofMesh.visible = layer === 'all' || layer === 'roof' || layer === 'xray';
    });
  });

  document.getElementById('btn-toggle-wireframe')?.addEventListener('click', () => {
    isWireframe = !isWireframe;
    houseGroup.traverse(child => {
      if (child.isMesh && child.material) child.material.wireframe = isWireframe;
    });
  });

  document.getElementById('btn-reset-view')?.addEventListener('click', () => {
    houseGroup.rotation.set(0, 0, 0);
  });
}

/* ==========================================================================
   2. MOUSE SPOTLIGHT & PARALLAX
   ========================================================================== */
function initMouseSpotlight() {
  const spotlight = document.getElementById('mouse-spotlight');
  if (!spotlight) return;
  window.addEventListener('mousemove', (e) => {
    spotlight.style.left = `${e.clientX}px`;
    spotlight.style.top = `${e.clientY}px`;
  });
}

function initParallaxCard() {
  const cardWrapper = document.getElementById('hero-3d-card-wrapper');
  const card = document.getElementById('hero-3d-card');
  if (!cardWrapper || !card) return;

  cardWrapper.addEventListener('mousemove', (e) => {
    const rect = cardWrapper.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    card.style.transform = `rotateX(${(y / rect.height) * -12}deg) rotateY(${(x / rect.width) * 12}deg)`;
  });

  cardWrapper.addEventListener('mouseleave', () => {
    card.style.transform = `rotateX(0deg) rotateY(0deg)`;
  });
}

/* ==========================================================================
   3. COMMAND PALETTE
   ========================================================================== */
function initCommandPalette() {
  const palette = document.getElementById('cmd-palette');
  const input = document.getElementById('cmd-input');
  const triggerBtn = document.getElementById('btn-cmd-palette');

  if (!palette || !input) return;

  function openPalette() { palette.setAttribute('aria-hidden', 'false'); input.focus(); }
  function closePalette() { palette.setAttribute('aria-hidden', 'true'); input.value = ''; }

  triggerBtn?.addEventListener('click', openPalette);

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      palette.getAttribute('aria-hidden') === 'true' ? openPalette() : closePalette();
    }
    if (e.key === 'Escape') closePalette();
  });

  palette.addEventListener('click', (e) => { if (e.target === palette) closePalette(); });

  document.querySelectorAll('.cmd-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.getAttribute('data-action');
      if (action === 'new-project') window.location.href = '/wizard.html';
      if (action === 'view-dashboard') window.location.href = '/workspace.html';
      if (action === 'cost-estimator') document.getElementById('estimator')?.scrollIntoView({ behavior: 'smooth' });
      closePalette();
    });
  });
}

/* ==========================================================================
   4. COST ESTIMATOR WITH CURRENCY SUPPORT (INR vs USD)
   ========================================================================== */
function initCostEstimator() {
  const sliderSqft = document.getElementById('slider-sqft');
  const valSqftDisplay = document.getElementById('val-sqft');
  const tierBtns = document.querySelectorAll('.tier-btn');
  const selectMaterial = document.getElementById('select-material');

  let currentTierMult = 1.35;
  if (!sliderSqft) return;

  function updateEstimator() {
    const sqft = parseInt(sliderSqft.value);
    valSqftDisplay.textContent = `${sqft.toLocaleString()} sq ft`;

    // Check saved project currency
    let activeCurr = 'INR';
    try {
      const p = JSON.parse(localStorage.getItem('buildwise_project_data') || '{}');
      if (p.currency) activeCurr = p.currency;
    } catch (e) {}

    const baseCostUSD = 200 * currentTierMult;
    let materialMult = selectMaterial.value === 'concrete' ? 0.95 : (selectMaterial.value === 'steel' ? 1.15 : 1.05);

    let totalCost = Math.round(sqft * baseCostUSD * materialMult);
    let unitCost = Math.round(totalCost / sqft);

    let symbol = '$';
    if (activeCurr === 'INR') {
      totalCost = Math.round(totalCost * 83); // 1 USD ~ 83 INR
      unitCost = Math.round(unitCost * 83);
      symbol = '₹';
    }

    const formatFn = (amt) => {
      if (activeCurr === 'INR') {
        if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
        if (amt >= 100000) return `₹${(amt / 100000).toFixed(1)} Lakhs`;
        return `₹${amt.toLocaleString('en-IN')}`;
      }
      return `$${amt.toLocaleString('en-US')}`;
    };

    document.getElementById('res-total-cost').textContent = formatFn(totalCost);
    document.getElementById('res-unit-cost').textContent = `${symbol}${unitCost.toLocaleString()} / sq ft`;

    document.getElementById('res-mat-cost').textContent = formatFn(Math.round(totalCost * 0.4));
    document.getElementById('res-labor-cost').textContent = formatFn(Math.round(totalCost * 0.35));
    document.getElementById('res-mep-cost').textContent = formatFn(Math.round(totalCost * 0.15));
    document.getElementById('res-contingency').textContent = formatFn(Math.round(totalCost * 0.10));
  }

  sliderSqft.addEventListener('input', updateEstimator);
  selectMaterial.addEventListener('change', updateEstimator);

  tierBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      tierBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentTierMult = parseFloat(e.target.getAttribute('data-tier'));
      updateEstimator();
    });
  });

  updateEstimator();
}

/* ==========================================================================
   5. DASHBOARD EVENTS & SYNC WITH WIZARD
   ========================================================================== */
function initDashboardEvents() {
  const projectSelect = document.getElementById('dash-project-select');
  const heroBtnDashboard = document.getElementById('hero-btn-dashboard');

  heroBtnDashboard?.addEventListener('click', () => {
    document.getElementById('dashboard-preview')?.scrollIntoView({ behavior: 'smooth' });
  });

  projectSelect?.addEventListener('change', (e) => {
    const val = e.target.value;
    const costEl = document.getElementById('dash-kpi-cost');

    let curr = 'INR';
    try {
      const p = JSON.parse(localStorage.getItem('buildwise_project_data') || '{}');
      if (p.currency) curr = p.currency;
    } catch(e) {}

    const sym = curr === 'INR' ? '₹' : '$';

    if (val === 'villa') {
      if (costEl) costEl.textContent = curr === 'INR' ? '₹1,25,00,000' : '$1,420,000';
    } else if (val === 'tower') {
      if (costEl) costEl.textContent = curr === 'INR' ? '₹120,50,00,000' : '$14,850,000';
    } else if (val === 'eco') {
      if (costEl) costEl.textContent = curr === 'INR' ? '₹32,80,00,000' : '$3,950,000';
    }
  });
}

function syncDashboardWithSavedProject() {
  const savedData = localStorage.getItem('buildwise_project_data');
  if (!savedData) return;

  try {
    const p = JSON.parse(savedData);
    const dashSelect = document.getElementById('dash-project-select');
    if (dashSelect && p.name) {
      const opt = document.createElement('option');
      opt.value = 'custom_project';
      opt.textContent = `${p.name} (${p.city || 'Custom'}) [Saved]`;
      opt.selected = true;
      dashSelect.prepend(opt);
    }

    const costEl = document.getElementById('dash-kpi-cost');
    if (costEl && p.budget) {
      if (p.currency === 'INR') {
        if (p.budget >= 10000000) costEl.textContent = `₹${(p.budget / 10000000).toFixed(2)} Cr`;
        else costEl.textContent = `₹${p.budget.toLocaleString('en-IN')}`;
      } else {
        costEl.textContent = `$${p.budget.toLocaleString('en-US')}`;
      }
    }
  } catch (e) { console.error('Error syncing saved project:', e); }
}

/* ==========================================================================
   6. SOLUTIONS TABS & SCROLL ANIMATIONS
   ========================================================================== */
function initSolutionsTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn[data-tab]');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const targetId = e.currentTarget.getAttribute('data-tab');
      document.getElementById(targetId)?.classList.add('active');
    });
  });
}

function initScrollAnimations() {
  const navbar = document.getElementById('main-navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) navbar?.classList.add('scrolled');
    else navbar?.classList.remove('scrolled');
  });
}

/* ===========================================================================
   7. AUTHENTICATION HANDOFF
   =========================================================================== */
function initAuthenticationFlow() {
  const authModal = document.getElementById('modal-auth');
  const openAuth = () => authModal?.setAttribute('aria-hidden', 'false');
  const closeAuth = () => authModal?.setAttribute('aria-hidden', 'true');
  window.closeSignInModal = closeAuth;
  document.getElementById('btn-sign-in')?.addEventListener('click', openAuth);

  const continueToWizard = (provider) => {
    sessionStorage.setItem('buildwise_authenticated', 'true');
    sessionStorage.setItem('buildwise_auth_provider', provider);
    window.location.assign(new URL('./wizard.html', window.location.href).href);
  };
  document.getElementById('auth-sign-in-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    continueToWizard('email');
  });
  document.querySelectorAll('[data-auth-provider]').forEach(button => {
    button.addEventListener('click', () => continueToWizard(button.dataset.authProvider));
  });
}