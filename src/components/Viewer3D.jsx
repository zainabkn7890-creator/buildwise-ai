import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { generateBuilding } from '../scene/BuildingGenerator.js';
import { createMaterials } from '../scene/Materials.js';
import { ArrowLeft, Home, Building2, Layers, Sun, Moon, Camera, Download, RefreshCw } from 'lucide-react';

export default function Viewer3D({
  floorRooms,
  activeFloor,
  onFloorChange,
  onBackToEditor,
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const rendererRef = useRef(null);
  const buildingRef = useRef(null);
  const animFrameRef = useRef(null);
  const materialsRef = useRef(null);
  const dirLightRef = useRef(null);
  const ambLightRef = useRef(null);
  const hemiLightRef = useRef(null);

  const [viewMode, setViewMode] = useState('exterior');
  const [showRoof, setShowRoof] = useState(true);
  const [showFurniture, setShowFurniture] = useState(true);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [lightingMode, setLightingMode] = useState('day');
  const [isGenerating, setIsGenerating] = useState(false);

  const rooms = floorRooms[activeFloor] || [];

  const viewPositions = {
    exterior: { pos: [30, 25, 35], target: [0, 0, 0] },
    interior: { pos: [0, 6, 8], target: [0, 4, 0] },
    structure: { pos: [20, 30, 0], target: [0, 0, 0] },
  };

  const rebuildScene = useCallback(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color(0x1a2a3a);

    const mat = materialsRef.current;
    const result = generateBuilding(rooms, mat);

    result.group.position.x = -((result.bounds.minX + result.bounds.maxX) / 2);
    result.group.position.z = -((result.bounds.minY + result.bounds.maxY) / 2);
    sceneRef.current.add(result.group);
    buildingRef.current = result.group;

    hemiLightRef.current = new THREE.HemisphereLight(0x87ceeb, 0x362d1e, 0.8);
    sceneRef.current.add(hemiLightRef.current);

    dirLightRef.current = new THREE.DirectionalLight(0xffeedd, 1.8);
    dirLightRef.current.position.set(30, 40, 20);
    dirLightRef.current.castShadow = true;
    dirLightRef.current.shadow.mapSize.width = 2048;
    dirLightRef.current.shadow.mapSize.height = 2048;
    dirLightRef.current.shadow.camera.near = 0.5;
    dirLightRef.current.shadow.camera.far = 100;
    dirLightRef.current.shadow.camera.left = -50;
    dirLightRef.current.shadow.camera.right = 50;
    dirLightRef.current.shadow.camera.top = 50;
    dirLightRef.current.shadow.camera.bottom = -50;
    sceneRef.current.add(dirLightRef.current);

    ambLightRef.current = new THREE.AmbientLight(0x404060, 0.3);
    sceneRef.current.add(ambLightRef.current);

    // Tag meshes for visibility toggling
    result.group.traverse(child => {
      if (child.isMesh) {
        const pos = child.position;
        const isRoof = pos.y > 8.5;
        const isFurniture = pos.y > 0.3 && pos.y < 5;
        if (isRoof) child.userData.type = 'roof';
        else if (isFurniture) child.userData.type = 'furniture';
        else child.userData.type = 'structure';
      }
    });
  }, [rooms]);

  useEffect(() => {
    if (isGenerating || !containerRef.current) return;

    materialsRef.current = createMaterials();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a2a3a);
    scene.fog = new THREE.Fog(0x1a2a3a, 60, 100);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 200);
    camera.position.set(30, 25, 35);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3;
    controls.maxDistance = 80;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    rebuildScene();

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement.parentNode) {
          rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
        }
      }
      controlsRef.current?.dispose();
    };
  }, [activeFloor, rebuildScene, isGenerating]);

  useEffect(() => {
    if (!buildingRef.current) return;
    buildingRef.current.traverse(child => {
      if (child.isMesh) {
        if (child.userData.type === 'roof') {
          child.visible = showRoof;
        }
        if (child.userData.type === 'furniture') {
          child.visible = showFurniture;
        }
      }
    });
  }, [showRoof, showFurniture]);

  useEffect(() => {
    if (!sceneRef.current) return;
    if (lightingMode === 'night') {
      sceneRef.current.background = new THREE.Color(0x0a0a1a);
      if (dirLightRef.current) dirLightRef.current.intensity = 0.3;
      if (ambLightRef.current) ambLightRef.current.intensity = 0.05;
      if (hemiLightRef.current) hemiLightRef.current.intensity = 0.1;
    } else {
      sceneRef.current.background = new THREE.Color(0x1a2a3a);
      if (dirLightRef.current) dirLightRef.current.intensity = 1.8;
      if (ambLightRef.current) ambLightRef.current.intensity = 0.3;
      if (hemiLightRef.current) hemiLightRef.current.intensity = 0.8;
    }
  }, [lightingMode]);

  const handleViewMode = useCallback((mode) => {
    setViewMode(mode);
    const pos = viewPositions[mode];
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(pos.pos[0], pos.pos[1], pos.pos[2]);
      controlsRef.current.target.set(pos.target[0], pos.target[1], pos.target[2]);
      controlsRef.current.update();
    }
  }, []);

  const handleScreenshot = useCallback(() => {
    if (!rendererRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const link = document.createElement('a');
    link.download = `buildwise-${activeFloor}-floor.png`;
    link.href = rendererRef.current.domElement.toDataURL('image/png');
    link.click();
  }, [activeFloor]);

  const floorLabels = {
    ground: 'Ground Floor', first: 'First Floor', second: 'Second Floor',
    terrace: 'Terrace', basement: 'Basement',
  };

  const totalRooms = rooms.length;
  const bedrooms = rooms.filter(r => r.type === 'bedroom').length;
  const bathrooms = rooms.filter(r => r.type === 'bathroom').length;
  const parkingCount = rooms.filter(r => r.type === 'parking').length;
  const gardenCount = rooms.filter(r => r.type === 'garden').length;
  const builtArea = rooms.reduce((s, r) => s + (r.areaSqFt || 0), 0);

  return (
    <div className="viewer3d-root">
      {/* Top Navigation Bar */}
      <div className="viewer3d-topbar">
        <div className="viewer3d-topbar-left">
          <button className="viewer3d-back-btn" onClick={onBackToEditor}>
            <ArrowLeft size={16} />
            <span>Back to 2D Editor</span>
          </button>
          <div className="viewer3d-project-name">BuildWise AI &mdash; 3D View</div>
        </div>
        <div className="viewer3d-topbar-center">
          <button
            className={`v3d-tb-btn ${viewMode === 'exterior' ? 'active' : ''}`}
            onClick={() => handleViewMode('exterior')}
          >
            <Home size={14} /> Exterior
          </button>
          <button
            className={`v3d-tb-btn ${viewMode === 'interior' ? 'active' : ''}`}
            onClick={() => handleViewMode('interior')}
          >
            <Building2 size={14} /> Interior
          </button>
          <button
            className={`v3d-tb-btn ${viewMode === 'structure' ? 'active' : ''}`}
            onClick={() => handleViewMode('structure')}
          >
            <Layers size={14} /> Structure
          </button>
          <div className="v3d-tb-divider"></div>
          <button
            className={`v3d-tb-btn ${showRoof ? 'active' : ''}`}
            onClick={() => setShowRoof(v => !v)}
          >
            Roof {showRoof ? 'ON' : 'OFF'}
          </button>
          <button
            className={`v3d-tb-btn ${showFurniture ? 'active' : ''}`}
            onClick={() => setShowFurniture(v => !v)}
          >
            Furniture {showFurniture ? 'ON' : 'OFF'}
          </button>
          <button
            className={`v3d-tb-btn ${showMeasurements ? 'active' : ''}`}
            onClick={() => setShowMeasurements(v => !v)}
          >
            Measurements {showMeasurements ? 'ON' : 'OFF'}
          </button>
          <div className="v3d-tb-divider"></div>
          <button
            className={`v3d-tb-btn ${lightingMode === 'day' ? 'active' : ''}`}
            onClick={() => setLightingMode('day')}
          >
            <Sun size={14} /> Day
          </button>
          <button
            className={`v3d-tb-btn ${lightingMode === 'night' ? 'active' : ''}`}
            onClick={() => setLightingMode('night')}
          >
            <Moon size={14} /> Night
          </button>
        </div>
        <div className="viewer3d-topbar-right">
          <button className="v3d-action-btn" onClick={handleScreenshot}>
            <Camera size={14} /> Capture
          </button>
          <button className="v3d-action-btn" onClick={() => {}}>
            <Download size={14} /> Export
          </button>
          <button className="v3d-action-btn" onClick={() => window.open('/report', '_blank')}>
            Generate Report
          </button>
        </div>
      </div>

      {/* Main 3D Layout */}
      <div className="viewer3d-body">
        {/* 3D Viewport */}
        <div className="viewer3d-viewport" ref={containerRef} />

        {/* Floor Tabs Overlay */}
        <div className="viewer3d-floor-tabs">
          {Object.entries(floorLabels).map(([key, label]) => (
            <button
              key={key}
              className={`v3d-floor-tab ${activeFloor === key ? 'active' : ''}`}
              onClick={() => onFloorChange(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right Panel */}
        <aside className="viewer3d-right-panel">
          <div className="v3d-panel-section">
            <h3 className="v3d-panel-title">Project Summary</h3>
            <div className="v3d-summary-grid">
              <div className="v3d-summary-item">
                <span className="v3d-summary-label">Project</span>
                <span className="v3d-summary-value">Modern Villa</span>
              </div>
              <div className="v3d-summary-item">
                <span className="v3d-summary-label">Plot Area</span>
                <span className="v3d-summary-value">3,000 sq ft</span>
              </div>
              <div className="v3d-summary-item">
                <span className="v3d-summary-label">Built-up Area</span>
                <span className="v3d-summary-value">{builtArea.toLocaleString()} sq ft</span>
              </div>
              <div className="v3d-summary-item">
                <span className="v3d-summary-label">Floors</span>
                <span className="v3d-summary-value">5</span>
              </div>
              <div className="v3d-summary-item">
                <span className="v3d-summary-label">Rooms</span>
                <span className="v3d-summary-value">{totalRooms}</span>
              </div>
              <div className="v3d-summary-item">
                <span className="v3d-summary-label">Bedrooms</span>
                <span className="v3d-summary-value">{bedrooms}</span>
              </div>
              <div className="v3d-summary-item">
                <span className="v3d-summary-label">Bathrooms</span>
                <span className="v3d-summary-value">{bathrooms}</span>
              </div>
              <div className="v3d-summary-item">
                <span className="v3d-summary-label">Parking</span>
                <span className="v3d-summary-value">{parkingCount > 0 ? 'Included' : 'None'}</span>
              </div>
              <div className="v3d-summary-item">
                <span className="v3d-summary-label">Garden</span>
                <span className="v3d-summary-value">{gardenCount > 0 ? 'Included' : 'None'}</span>
              </div>
            </div>
          </div>

          <div className="v3d-panel-section">
            <h3 className="v3d-panel-title">Current Floor</h3>
            <div className="v3d-floor-status">
              <span className="v3d-floor-name">{floorLabels[activeFloor]}</span>
              <span className="v3d-floor-badge">Generated Successfully</span>
            </div>
          </div>

          <div className="v3d-panel-section">
            <h3 className="v3d-panel-title">Quick AI Summary</h3>
            <ul className="v3d-ai-summary">
              <li><span className="v3d-ai-check">✓</span> Efficient circulation</li>
              <li><span className="v3d-ai-check">✓</span> Spacious living area</li>
              <li><span className="v3d-ai-check">✓</span> Good daylight access</li>
              <li><span className="v3d-ai-check">✓</span> Parking integrated</li>
            </ul>
          </div>

          <div className="v3d-panel-section v3d-panel-actions">
            <button className="v3d-regenerate-btn" onClick={() => {}}>
              <RefreshCw size={14} /> Regenerate 3D
            </button>
          </div>

          <div className="v3d-panel-footer">
            BuildWise AI v1.0 &middot; Architectural Preview
          </div>
        </aside>
      </div>
    </div>
  );
}
