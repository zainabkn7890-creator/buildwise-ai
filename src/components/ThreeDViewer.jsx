import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { getFloorConfig } from '../floor-config.js';

const WALL_H = 9;          // Wall height in Three.js units (ft)

/* ─── Material factory (created once per scene, shared across all meshes) ─── */
function buildMaterials(timeMode) {
  const d = timeMode === 'day';
  return {
    // Structure
    plaster:    new THREE.MeshStandardMaterial({ color: '#e8e4dc', roughness: 0.65, metalness: 0.0 }),
    plasterCtx: new THREE.MeshStandardMaterial({ color: '#c8c4bc', roughness: 0.85, transparent: true, opacity: 0.35 }),
    concrete:   new THREE.MeshStandardMaterial({ color: '#5a6068', roughness: 0.82, metalness: 0.02 }),
    structWire: new THREE.MeshStandardMaterial({ color: '#00ff88', wireframe: true }),
    roofDark:   new THREE.MeshStandardMaterial({ color: '#111c15', roughness: 0.65, metalness: 0.05 }),

    // Floors — enhanced PBR
    marbleWhite:new THREE.MeshStandardMaterial({ color: '#f5f3ef', roughness: 0.08, metalness: 0.12, envMapIntensity: 1.2 }),
    marbleBg:   new THREE.MeshStandardMaterial({ color: '#1a2a20', roughness: 0.1, metalness: 0.1, envMapIntensity: 1.0 }),
    tileGrey:   new THREE.MeshStandardMaterial({ color: '#8a9095', roughness: 0.25, metalness: 0.05, envMapIntensity: 0.6 }),
    wood:       new THREE.MeshStandardMaterial({ color: '#7c4a1b', roughness: 0.55, metalness: 0.0, envMapIntensity: 0.4 }),
    woodLight:  new THREE.MeshStandardMaterial({ color: '#c4874a', roughness: 0.5, metalness: 0.0, envMapIntensity: 0.4 }),
    woodDark:   new THREE.MeshStandardMaterial({ color: '#3b1e0a', roughness: 0.6, metalness: 0.0, envMapIntensity: 0.3 }),
    lawnGreen:  new THREE.MeshStandardMaterial({ color: d ? '#143d22' : '#0c2815', roughness: 0.92, metalness: 0.0 }),
    asphalt:    new THREE.MeshStandardMaterial({ color: '#2b3030', roughness: 0.82, metalness: 0.02 }),
    epoxy:      new THREE.MeshStandardMaterial({ color: '#3a4248', roughness: 0.55, metalness: 0.25, envMapIntensity: 0.8 }),

    // Furniture/fixtures — enhanced
    gold:       new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 0.88, roughness: 0.15, envMapIntensity: 1.5 }),
    steel:      new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.92, roughness: 0.06, envMapIntensity: 1.8 }),
    glass:      new THREE.MeshStandardMaterial({ color: '#7ec8e3', transparent: true, opacity: 0.35, roughness: 0.02, metalness: 0.9, envMapIntensity: 2.0 }),
    glassFacade:new THREE.MeshStandardMaterial({ color: '#38bdf8', transparent: true, opacity: 0.32, roughness: 0.02, metalness: 0.92, envMapIntensity: 2.0 }),
    leather:    new THREE.MeshStandardMaterial({ color: '#1c2e45', roughness: 0.55, metalness: 0.02, envMapIntensity: 0.3 }),
    leatherCream:new THREE.MeshStandardMaterial({ color: '#d6c5a0', roughness: 0.6, metalness: 0.0, envMapIntensity: 0.3 }),
    fabric:     new THREE.MeshStandardMaterial({ color: '#2d4a7a', roughness: 0.82, metalness: 0.0, envMapIntensity: 0.2 }),
    fabricLight:new THREE.MeshStandardMaterial({ color: '#f0ede6', roughness: 0.88, metalness: 0.0, envMapIntensity: 0.2 }),
    mattress:   new THREE.MeshStandardMaterial({ color: '#f8f5f0', roughness: 0.85, metalness: 0.0 }),
    tvScreen:   new THREE.MeshStandardMaterial({ color: '#080c10', roughness: 0.03, metalness: 0.55, envMapIntensity: 1.0 }),
    granite:    new THREE.MeshStandardMaterial({ color: '#16202a', roughness: 0.08, metalness: 0.18, envMapIntensity: 1.2 }),
    ceramicW:   new THREE.MeshStandardMaterial({ color: '#f9f9f9', roughness: 0.12, metalness: 0.05, envMapIntensity: 0.8 }),
    plantGreen: new THREE.MeshStandardMaterial({ color: '#1a6b35', roughness: 0.85, metalness: 0.0 }),
    rubber:     new THREE.MeshStandardMaterial({ color: '#0d0d0d', roughness: 0.92, metalness: 0.0 }),
    paintGreen: new THREE.MeshStandardMaterial({ color: '#133527', metalness: 0.85, roughness: 0.12, envMapIntensity: 1.4 }),
    carpet:     new THREE.MeshStandardMaterial({ color: '#3d3060', roughness: 0.95, metalness: 0.0 }),

    // Additional PBR materials
    copper:     new THREE.MeshStandardMaterial({ color: '#b87333', metalness: 0.82, roughness: 0.22, envMapIntensity: 1.2 }),
    chrome:     new THREE.MeshStandardMaterial({ color: '#e0e0e0', metalness: 0.95, roughness: 0.03, envMapIntensity: 2.5 }),
    matteBlack: new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.9, metalness: 0.05 }),
    concreteDark:new THREE.MeshStandardMaterial({ color: '#3a3a3a', roughness: 0.78, metalness: 0.02 }),
  };
}

/* ─── Geometry helpers ──────────────────────────────────────────────────── */
const box   = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl   = (r, h, s = 8) => new THREE.CylinderGeometry(r, r, h, s);
const sphere= (r, s = 8)    => new THREE.SphereGeometry(r, s, s);

function mesh(geo, mat, castShadow = true, receiveShadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = castShadow;
  m.receiveShadow = receiveShadow;
  return m;
}

function add(parent, child, x = 0, y = 0, z = 0, rotY = 0) {
  child.position.set(x, y, z);
  child.rotation.y = rotY;
  parent.add(child);
  return child;
}

/* ── Realistic 3D Tree & Potted Plant Generators ───────────────────────── */
function createRealistic3DTree(scaleVal = 1.0) {
  const treeGroup = new THREE.Group();

  const trunkMat = new THREE.MeshStandardMaterial({
    color: '#3d2817',
    roughness: 0.92,
    metalness: 0.05
  });

  const trunkBase = mesh(new THREE.CylinderGeometry(0.38, 0.58, 1.6, 10), trunkMat);
  trunkBase.position.y = 0.8;
  treeGroup.add(trunkBase);

  const trunkMid = mesh(new THREE.CylinderGeometry(0.24, 0.38, 2.5, 10), trunkMat);
  trunkMid.position.set(0.06, 2.5, 0.02);
  trunkMid.rotation.z = -0.05;
  treeGroup.add(trunkMid);

  const bAngles = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];
  bAngles.forEach((ang, idx) => {
    const branch = mesh(new THREE.CylinderGeometry(0.08, 0.16, 1.6, 8), trunkMat);
    branch.position.set(Math.cos(ang) * 0.25, 3.2 + idx * 0.25, Math.sin(ang) * 0.25);
    branch.rotation.x = Math.sin(ang) * 0.45;
    branch.rotation.z = Math.cos(ang) * 0.45;
    treeGroup.add(branch);
  });

  const matDark  = new THREE.MeshStandardMaterial({ color: '#133e1c', roughness: 0.88, metalness: 0.0 });
  const matMid   = new THREE.MeshStandardMaterial({ color: '#257038', roughness: 0.82, metalness: 0.0 });
  const matLight = new THREE.MeshStandardMaterial({ color: '#3ea454', roughness: 0.76, metalness: 0.0 });

  const clusters = [
    { pos: [0, 4.2, 0], scale: 1.8, mat: matMid },
    { pos: [1.1, 4.0, 0.7], scale: 1.4, mat: matLight },
    { pos: [-1.1, 4.1, -0.6], scale: 1.45, mat: matDark },
    { pos: [0.5, 4.5, -0.9], scale: 1.3, mat: matMid },
    { pos: [-0.6, 4.4, 0.9], scale: 1.35, mat: matLight },
    { pos: [0, 5.2, 0], scale: 1.5, mat: matLight },
    { pos: [0.7, 5.0, 0.5], scale: 1.25, mat: matMid },
    { pos: [-0.7, 5.1, -0.4], scale: 1.3, mat: matDark },
    { pos: [0, 5.8, 0], scale: 1.1, mat: matLight },
  ];

  clusters.forEach(c => {
    const geo = new THREE.IcosahedronGeometry(c.scale, 2);
    const foliage = mesh(geo, c.mat);
    foliage.position.set(c.pos[0], c.pos[1], c.pos[2]);
    foliage.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    treeGroup.add(foliage);
  });

  if (scaleVal !== 1.0) {
    treeGroup.scale.set(scaleVal, scaleVal, scaleVal);
  }

  return treeGroup;
}

function createRealisticPottedPlant(potColor = '#f5f3ee') {
  const plantGroup = new THREE.Group();

  const potMat = new THREE.MeshStandardMaterial({
    color: potColor,
    roughness: 0.18,
    metalness: 0.08
  });

  const potBody = mesh(new THREE.CylinderGeometry(0.55, 0.42, 1.1, 16), potMat);
  potBody.position.y = 0.55;
  plantGroup.add(potBody);

  const potRim = mesh(new THREE.TorusGeometry(0.56, 0.05, 10, 20), potMat);
  potRim.position.y = 1.08;
  potRim.rotation.x = Math.PI / 2;
  plantGroup.add(potRim);

  const soilMat = new THREE.MeshStandardMaterial({ color: '#261c14', roughness: 0.95 });
  const soil = mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.08, 16), soilMat);
  soil.position.y = 1.05;
  plantGroup.add(soil);

  const leafMatDark  = new THREE.MeshStandardMaterial({ color: '#124220', roughness: 0.7, side: THREE.DoubleSide });
  const leafMatLight = new THREE.MeshStandardMaterial({ color: '#2d8244', roughness: 0.65, side: THREE.DoubleSide });
  const stemMat = new THREE.MeshStandardMaterial({ color: '#1b5228', roughness: 0.8 });

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + (Math.random() * 0.25);
    const height = 0.7 + (i % 3) * 0.25;

    const stem = mesh(new THREE.CylinderGeometry(0.02, 0.04, height, 8), stemMat);
    stem.position.set(Math.cos(angle) * 0.15, 1.08 + height / 2, Math.sin(angle) * 0.15);
    stem.rotation.x = Math.sin(angle) * 0.32;
    stem.rotation.z = -Math.cos(angle) * 0.32;
    plantGroup.add(stem);

    const leafSize = 0.42 + (i % 2) * 0.12;
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.bezierCurveTo(leafSize * 0.5, leafSize * 0.3, leafSize * 0.6, leafSize * 0.8, 0, leafSize);
    leafShape.bezierCurveTo(-leafSize * 0.6, leafSize * 0.8, -leafSize * 0.5, leafSize * 0.3, 0, 0);

    const leafGeo = new THREE.ShapeGeometry(leafShape, 8);
    const leaf = mesh(leafGeo, i % 2 === 0 ? leafMatDark : leafMatLight);

    const tipX = Math.cos(angle) * (0.15 + height * 0.28);
    const tipZ = Math.sin(angle) * (0.15 + height * 0.28);
    leaf.position.set(tipX, 1.08 + height, tipZ);
    leaf.rotation.set(
      Math.PI / 3 + Math.random() * 0.2,
      angle + Math.PI / 2,
      (Math.random() - 0.5) * 0.4
    );
    plantGroup.add(leaf);
  }

  return plantGroup;
}

/* ─────────────────────────────────────────────────────────────────────────
   FURNITURE LIBRARY
   Each function receives (group, rW, rH, M) and populates furniture into group.
   group is centered at the room's floor center.
───────────────────────────────────────────────────────────────────────────── */

function placeBedroom(g, rW, rH, M) {
  // --- Bed (platform style, centre-back)
  const bedW = Math.min(5.5, rW - 1.5);
  const bedL = Math.min(7.0, rH - 1.5);
  const base = mesh(box(bedW, 0.9, bedL), M.woodDark);
  const mattr = mesh(box(bedW - 0.3, 0.65, bedL - 0.3), M.mattress);
  add(base, mattr, 0, 0.77, 0);
  const pL = mesh(box(1.8, 0.2, 1.2), M.fabricLight);
  const pR = mesh(box(1.8, 0.2, 1.2), M.fabricLight);
  add(base, pL, -1.0, 1.05, -(bedL/2 - 1.0));
  add(base, pR,  1.0, 1.05, -(bedL/2 - 1.0));
  add(g, base, 0, 0.45, -(rH/2 - bedL/2 - 0.6));

  // Headboard
  const hb = mesh(box(bedW, 2.5, 0.3), M.woodDark);
  add(g, hb, 0, 1.7, -(rH/2 - 0.45));

  // Side tables
  const st = () => {
    const t = mesh(cyl(0.8, 1.6), M.woodLight);
    const top = mesh(cyl(0.9, 0.12), M.gold);
    add(t, top, 0, 0.86, 0);
    return t;
  };
  add(g, st(), -(bedW/2 + 1.2), 0.8, -(rH/2 - bedL/2 - 0.6));
  add(g, st(),  (bedW/2 + 1.2), 0.8, -(rH/2 - bedL/2 - 0.6));

  // Wardrobe (flush against left wall)
  const wdW = Math.min(5.0, rW * 0.45);
  const wd = mesh(box(wdW, 8.0, 1.6), M.woodDark);
  const wdDoor = mesh(box(wdW/2 - 0.05, 7.8, 0.05), M.woodLight);
  const wdH = mesh(box(wdW/2 - 0.05, 7.8, 0.05), M.woodLight);
  add(wd, wdDoor, -wdW/4, 0, 0.83);
  add(wd, wdH,     wdW/4, 0, 0.83);
  const hdL = mesh(sphere(0.12), M.gold); add(wdDoor, hdL, 0.55, 0, 0.07);
  const hdR = mesh(sphere(0.12), M.gold); add(wdH, hdR, -0.55, 0, 0.07);
  add(g, wd, -(rW/2 - wdW/2 - 0.1), 4.0, rH/4);

  // Study desk + chair
  const deskW = Math.min(3.2, rW * 0.35);
  const dk = mesh(box(deskW, 0.12, 2.2), M.woodLight);
  for (let i = 0; i < 4; i++) {
    const leg = mesh(cyl(0.1, 2.2), M.woodDark);
    add(dk, leg, i < 2 ? -deskW/2 + 0.15 : deskW/2 - 0.15, -1.1, i % 2 === 0 ? -1.0 : 1.0);
  }
  const monitor = mesh(box(1.4, 1.1, 0.08), M.tvScreen); add(dk, monitor, 0, 0.7, -0.95);
  add(g, dk, rW/2 - deskW/2 - 0.2, 2.32, rH * 0.2);

  const ch = mesh(box(1.4, 0.12, 1.4), M.leather);
  const chBack = mesh(box(1.4, 1.6, 0.12), M.leather); add(ch, chBack, 0, 0.9, -0.65);
  for (let i = 0; i < 4; i++) add(ch, mesh(cyl(0.07, 1.2), M.woodDark), i < 2 ? -0.6 : 0.6, -0.6, i % 2 === 0 ? -0.6 : 0.6);
  add(g, ch, rW/2 - deskW/2 - 0.2, 1.2, rH * 0.2 + 1.8, Math.PI);
}

function placeLiving(g, rW, rH, M) {
  // L-sofa setup
  const sofaW = Math.min(7.5, rW - 1.5);
  const sofa = mesh(box(sofaW, 0.9, 2.8), M.fabric);
  const sofaBack = mesh(box(sofaW, 2.0, 0.5), M.fabric);
  add(sofa, sofaBack, 0, 1.45, -1.15);
  add(g, sofa, 0, 0.45, -rH/4);

  // Side armchairs
  const ac = (xPos) => {
    const a = mesh(box(2.8, 0.9, 2.8), M.fabric);
    const aBack = mesh(box(2.8, 2.0, 0.5), M.fabric);
    add(a, aBack, 0, 1.45, -1.15);
    return a;
  };
  add(g, ac(), -(sofaW/2 + 1.8), 0.45, -rH/4 + 1.6, Math.PI/2);
  add(g, ac(),  (sofaW/2 + 1.8), 0.45, -rH/4 + 1.6, -Math.PI/2);

  // Coffee table
  const ct = mesh(box(4.0, 0.12, 2.4), M.woodLight);
  for (let i = 0; i < 4; i++) add(ct, mesh(cyl(0.1, 1.5), M.gold), i < 2 ? -1.8 : 1.8, -0.75, i % 2 === 0 ? -1.0 : 1.0);
  add(g, ct, 0, 1.62, -rH/4 + 2.4);

  // TV unit + screen
  const tvUnit = mesh(box(Math.min(7.0, rW - 1.0), 1.8, 1.5), M.woodDark);
  const screen = mesh(box(Math.min(6.0, rW - 2.0), 3.5, 0.12), M.tvScreen);
  add(tvUnit, screen, 0, 2.7, 0.81);
  add(g, tvUnit, 0, 0.9, rH/2 - 1.0);

  // Decorative realistic potted plant in corner
  const livingPlant = createRealisticPottedPlant('#d4af37');
  add(g, livingPlant, -(rW/2 - 1.2), 0, -(rH/2 - 1.2));
}

function placeDining(g, rW, rH, M) {
  const tableW = Math.min(3.8, rW - 2.0);
  const tableL = Math.min(7.0, rH - 2.0);
  const table = mesh(box(tableW, 0.15, tableL), M.woodDark);
  for (let i = 0; i < 4; i++) add(table, mesh(cyl(0.15, 2.4), M.gold), i < 2 ? -tableW/2 + 0.2 : tableW/2 - 0.2, -1.2, i % 2 === 0 ? -tableL/2 + 0.3 : tableL/2 - 0.3);
  add(g, table, 0, 2.55, 0);

  const addChair = (x, z, rot) => {
    const seat = mesh(box(1.4, 0.12, 1.4), M.leatherCream);
    const back = mesh(box(1.4, 1.8, 0.12), M.woodDark); add(seat, back, 0, 1.0, -0.65);
    for (let i = 0; i < 4; i++) add(seat, mesh(cyl(0.08, 1.2), M.woodDark), i < 2 ? -0.6 : 0.6, -0.6, i % 2 === 0 ? -0.6 : 0.6);
    add(g, seat, x, 1.32, z, rot);
  };
  const spacing = tableL / 3;
  for (let i = 0; i < 3; i++) addChair(-(tableW/2 + 1.1), -spacing + i * spacing, Math.PI/2);
  for (let i = 0; i < 3; i++) addChair((tableW/2 + 1.1), -spacing + i * spacing, -Math.PI/2);
  addChair(0, -(tableL/2 + 1.1), 0);
  addChair(0,  (tableL/2 + 1.1), Math.PI);
}

function placeKitchen(g, rW, rH, M) {
  const cntH = 3.0, cntD = 2.0;

  // Bottom counter along back wall
  const cntBack = mesh(box(rW - 2.0, cntH, cntD), M.woodDark);
  const topBack = mesh(box(rW - 2.0, 0.15, cntD), M.granite); add(cntBack, topBack, 0, cntH/2 + 0.07, 0);
  add(g, cntBack, 0, cntH/2, -(rH/2 - cntD/2 - 0.1));

  // Side counter (L-shape)
  const cntSide = mesh(box(cntD, cntH, rH * 0.45), M.woodDark);
  const topSide = mesh(box(cntD, 0.15, rH * 0.45), M.granite); add(cntSide, topSide, 0, cntH/2 + 0.07, 0);
  add(g, cntSide, -(rW/2 - cntD/2 - 0.1), cntH/2, -(rH * 0.45/2 - rH/2 + rH * 0.45/2 + cntD/2));

  // Stove (4 burners)
  for (let i = 0; i < 4; i++) {
    const b = mesh(cyl(0.3, 0.08, 10), M.steel);
    add(g, b, (i < 2 ? -0.7 : 0.7), cntH + 0.12, -(rH/2 - cntD/2 - 0.1) + (i % 2 === 0 ? -0.55 : 0.55));
  }

  // Sink
  const sink = mesh(box(1.8, 0.08, 1.1), M.steel);
  const sinkBowl = mesh(box(1.4, 0.3, 0.8), M.steel); add(sink, sinkBowl, 0, -0.2, 0);
  const tap = mesh(cyl(0.06, 0.6), M.gold); add(sink, tap, 0, 0.35, -0.35);
  const tapHead = mesh(box(0.5, 0.06, 0.06), M.gold); add(tap, tapHead, 0, 0.35, 0);
  add(g, sink, rW * 0.2, cntH + 0.1, -(rH/2 - cntD/2 - 0.05));

  // Refrigerator
  const fridge = mesh(box(2.5, 8.0, 2.5), M.steel);
  const fridgeDoorL = mesh(box(1.2, 7.8, 0.08), M.steel); add(fridge, fridgeDoorL, -0.6, 0.1, 1.27);
  const fridgeDoorR = mesh(box(1.2, 7.8, 0.08), M.steel); add(fridge, fridgeDoorR,  0.6, 0.1, 1.27);
  add(fridge, mesh(box(0.06, 7.6, 0.08), M.gold), -0.02, 0.1, 1.3);
  const hFr = mesh(cyl(0.07, 0.8), M.gold); hFr.rotation.x = Math.PI/2; add(fridge, hFr, -0.55, 0.5, 1.35);
  const hFl = mesh(cyl(0.07, 0.8), M.gold); hFl.rotation.x = Math.PI/2; add(fridge, hFl,  0.55, 0.5, 1.35);
  add(g, fridge, rW/2 - 1.4, 4.0, -(rH/2 - 1.4));

  // Upper wall cabinets
  const wallCab = mesh(box(rW - 2.0, 2.2, 1.4), M.woodDark);
  add(g, wallCab, 0, 7.2, -(rH/2 - 0.8));
}

function placeBathroom(g, rW, rH, M) {
  // Vanity + basin
  const vanity = mesh(box(Math.min(2.8, rW - 1.0), 2.5, 1.8), M.ceramicW);
  const basin = mesh(box(1.4, 0.18, 1.0), M.ceramicW); add(vanity, basin, 0, 1.26, -0.35);
  const tap = mesh(cyl(0.055, 0.5), M.gold); tap.position.set(0, 1.55, -0.7); vanity.add(tap);
  const tapN = mesh(box(0.4, 0.055, 0.055), M.gold); add(tap, tapN, 0, 0.28, -0.2);
  add(g, vanity, -(rW/4), 1.25, -(rH/2 - 1.1));

  // WC
  const wcBase = mesh(box(1.6, 2.2, 1.8), M.ceramicW);
  const wcTank = mesh(box(1.5, 1.6, 0.7), M.ceramicW); add(wcBase, wcTank, 0, 2.0, -0.6);
  const seat = mesh(box(1.4, 0.12, 1.55), M.ceramicW); add(wcBase, seat, 0, 1.06, 0.1);
  add(g, wcBase, rW/4, 1.1, -(rH/2 - 1.2));

  // Glass shower enclosure
  const shW = Math.min(3.2, rW - 1.0);
  const shH = 8.5;
  const shFront = mesh(box(shW, shH, 0.06), M.glass);
  const shSide  = mesh(box(0.06, shH, Math.min(3.0, rH - 1.5)), M.glass);
  const shBase  = mesh(box(shW, 0.15, Math.min(3.0, rH - 1.5)), M.ceramicW);
  add(g, shFront, -(rW/2 - shW/2 - 0.1), shH/2, rH/2 - shW/2 + 0.06);
  add(g, shSide,  -(rW/2 - 0.06),         shH/2, rH/4);
  add(g, shBase,  -(rW/2 - shW/2 - 0.1), 0.08, rH/4);
  const showerHead = mesh(cyl(0.18, 0.12), M.steel); 
  showerHead.rotation.z = Math.PI/2;
  add(g, showerHead, -(rW/2 - shW/2 - 0.1), 7.6, rH/4 - 0.5);
}

function placeOffice(g, rW, rH, M) {
  // Study/Office: 1-2 desks, chair, bookshelf, optional reading chair
  const deskW = Math.min(3.5, rW * 0.4);

  // Primary desk against back wall
  const desk = mesh(box(deskW, 0.12, 2.2), M.woodLight);
  for (let i = 0; i < 4; i++) add(desk, mesh(cyl(0.08, 2.2), M.steel), i < 2 ? -deskW/2 + 0.15 : deskW/2 - 0.15, -1.1, i % 2 === 0 ? -1.0 : 1.0);
  const monitor = mesh(box(1.3, 0.9, 0.06), M.tvScreen); add(desk, monitor, 0, 0.55, -0.9);
  const monBase = mesh(box(0.5, 0.5, 0.2), M.steel); add(desk, monBase, 0, 0.25, -0.85);
  add(g, desk, 0, 2.32, -(rH/2 - 1.5));

  // Desk chair
  const ch = mesh(box(1.4, 0.12, 1.4), M.leather);
  const chBack = mesh(box(1.4, 1.6, 0.12), M.leather); add(ch, chBack, 0, 0.9, -0.65);
  for (let i = 0; i < 4; i++) add(ch, mesh(cyl(0.07, 1.2), M.woodDark), i < 2 ? -0.6 : 0.6, -0.6, i % 2 === 0 ? -0.6 : 0.6);
  add(g, ch, 0, 1.2, -(rH/2 - 3.2), Math.PI);

  // Second desk if room is large enough
  if (rW > 5 && rH > 5) {
    const desk2 = mesh(box(deskW * 0.8, 0.12, 2.0), M.woodLight);
    for (let i = 0; i < 4; i++) add(desk2, mesh(cyl(0.07, 2.0), M.steel), i < 2 ? -deskW*0.4 + 0.1 : deskW*0.4 - 0.1, -1.0, i % 2 === 0 ? -0.9 : 0.9);
    add(g, desk2, rW/2 - deskW/2 - 0.3, 2.32, -(rH/2 - 1.5));
    const ch2 = mesh(box(1.2, 0.12, 1.2), M.leather);
    const ch2Back = mesh(box(1.2, 1.4, 0.12), M.leather); add(ch2, ch2Back, 0, 0.8, -0.55);
    add(g, ch2, rW/2 - deskW/2 - 0.3, 1.2, -(rH/2 - 3.0), Math.PI);
  }

  // Bookshelf against left wall
  const bcW = Math.min(4.0, rW * 0.35);
  const bc = mesh(box(1.2, 7.5, bcW), M.woodDark);
  for (let i = 0; i < 4; i++) {
    const shelf = mesh(box(1.1, 0.08, bcW), M.woodLight); add(bc, shelf, 0, -3.0 + i * 1.8, 0);
    const books = mesh(box(0.6, 1.2, bcW - 0.3), new THREE.MeshStandardMaterial({ color: `hsl(${i * 60},45%,35%)`, roughness: 0.8 }));
    add(bc, books, 0.2, -2.3 + i * 1.8, 0);
  }
  add(g, bc, -(rW/2 - 0.8), 3.75, rH * 0.15);

  // Reading chair in corner (if space allows)
  if (rW > 5 && rH > 6) {
    const readChair = mesh(box(2.0, 0.8, 2.0), M.fabric);
    const readBack = mesh(box(2.0, 1.8, 0.4), M.fabric); add(readChair, readBack, 0, 1.3, -0.8);
    add(g, readChair, -(rW/2 - 1.5), 0.4, rH/2 - 1.5, Math.PI/4);
    const footstool = mesh(box(1.2, 0.5, 1.2), M.fabric);
    add(g, footstool, -(rW/2 - 2.5), 0.25, rH/2 - 0.5, Math.PI/4);
  }
}

function placeConference(g, rW, rH, M) {
  const tableW = Math.min(4.5, rW - 2.0);
  const tableL = Math.min(9.0, rH - 2.5);
  const table = mesh(box(tableW, 0.18, tableL), M.woodDark);
  const tableTop = mesh(box(tableW, 0.08, tableL), M.granite); add(table, tableTop, 0, 0.13, 0);
  for (let i = 0; i < 4; i++) add(table, mesh(cyl(0.18, 2.4), M.gold), i < 2 ? -tableW/2 + 0.25 : tableW/2 - 0.25, -1.2, i % 2 === 0 ? -tableL/2 + 0.35 : tableL/2 - 0.35);
  add(g, table, 0, 2.52, 0);

  // Exec chairs
  const addChair = (x, z, rot) => {
    const s = mesh(box(1.6, 0.12, 1.6), M.leather);
    const bk = mesh(box(1.6, 2.2, 0.12), M.leather); add(s, bk, 0, 1.2, -0.75);
    const st = mesh(cyl(0.3, 1.8), M.steel); add(s, st, 0, -1.0, 0);
    const base = mesh(box(1.2, 0.06, 1.2), M.steel); add(st, base, 0, -0.9, 0);
    add(g, s, x, 2.32, z, rot);
  };
  const seats = Math.floor(tableL / 2.2);
  for (let i = 0; i < seats; i++) {
    const z = -(tableL/2 - 1.2) + i * (tableL - 2.4) / (seats - 1);
    addChair(-(tableW/2 + 1.4), z, Math.PI/2);
    addChair( (tableW/2 + 1.4), z, -Math.PI/2);
  }
  addChair(0, -(tableL/2 + 1.4), 0);

  // Display screen wall
  const screenPanel = mesh(box(Math.min(6.0, rW - 1.5), 3.5, 0.1), M.tvScreen);
  add(g, screenPanel, 0, 6.5, -(rH/2 - 0.1));

  // Frame
  const frame = mesh(box(Math.min(6.2, rW - 1.3), 3.7, 0.06), M.steel);
  add(g, frame, 0, 6.5, -(rH/2 - 0.04));
}

function placeReception(g, rW, rH, M) {
  // Curved reception desk
  const deskW = Math.min(7.5, rW - 1.5);
  const desk = mesh(box(deskW, 4.0, 2.0), M.woodDark);
  const deskTop = mesh(box(deskW, 0.12, 2.0), M.granite); add(desk, deskTop, 0, 2.06, 0);
  const trim = mesh(box(deskW, 0.2, 2.05), M.gold); add(desk, trim, 0, 2.0, 0.02);
  add(g, desk, 0, 2.0, -(rH * 0.2));

  // Waiting sofa row
  const waitSofa = mesh(box(Math.min(6.0, rW - 2.0), 0.9, 2.6), M.leather);
  const wBack = mesh(box(Math.min(6.0, rW - 2.0), 2.0, 0.5), M.leather);
  add(waitSofa, wBack, 0, 1.45, -1.05);
  add(g, waitSofa, 0, 0.45, rH * 0.25);

  // Logo wall panel
  const logoPanel = mesh(box(4.0, 2.5, 0.08), M.gold);
  add(g, logoPanel, 0, 6.0, -(rH/2 - 0.08));

  // Lobby decorative realistic potted plant
  const foyerPlant = createRealisticPottedPlant('#d4af37');
  add(g, foyerPlant, rW/2 - 1.5, 0, -(rH * 0.2));
}

function placeLobby(g, rW, rH, M) {
  // Fiddle Leaf Fig — realistic indoor plant
  const plantGroup = new THREE.Group();

  // Modern ceramic planter
  const planterBody = mesh(new THREE.CylinderGeometry(1.0, 0.8, 1.8, 12), M.ceramicW);
  plantGroup.add(planterBody);
  const planterRim = mesh(new THREE.TorusGeometry(1.0, 0.08, 8, 12), M.ceramicW);
  planterRim.position.y = 0.9;
  planterRim.rotation.x = Math.PI / 2;
  plantGroup.add(planterRim);
  // Soil
  const soil = mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.15, 12),
    new THREE.MeshStandardMaterial({ color: '#2a1a0c', roughness: 0.95 }));
  soil.position.y = 0.85;
  plantGroup.add(soil);

  // Main trunk — organic curve
  const trunkPts = [
    new THREE.Vector3(0, 0.9, 0),
    new THREE.Vector3(0.15, 2.5, 0.05),
    new THREE.Vector3(-0.1, 4.2, -0.1),
    new THREE.Vector3(0.2, 5.8, 0.1),
    new THREE.Vector3(0.0, 7.0, -0.05),
  ];
  const trunkCurve = new THREE.CatmullRomCurve3(trunkPts);
  const trunkGeo = new THREE.TubeGeometry(trunkCurve, 16, 0.18, 8, false);
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#3d2b1a', roughness: 0.85, metalness: 0.0 });
  const trunk = mesh(trunkGeo, trunkMat);
  plantGroup.add(trunk);

  // Branches
  const branches = [
    { start: [0.1, 3.5, 0], end: [1.8, 5.5, 0.6], r: 0.08 },
    { start: [-0.05, 4.8, -0.05], end: [-1.6, 6.8, -0.8], r: 0.07 },
    { start: [0.15, 5.5, 0.08], end: [1.2, 7.5, -0.5], r: 0.06 },
    { start: [-0.1, 6.2, -0.08], end: [-1.0, 8.0, 0.7], r: 0.05 },
    { start: [0.05, 6.8, 0], end: [0.3, 8.5, 0.2], r: 0.05 },
  ];
  branches.forEach(b => {
    const pts = [
      new THREE.Vector3(...b.start),
      new THREE.Vector3(
        (b.start[0] + b.end[0]) / 2 + (Math.random() - 0.5) * 0.3,
        (b.start[1] + b.end[1]) / 2,
        (b.start[2] + b.end[2]) / 2 + (Math.random() - 0.5) * 0.3
      ),
      new THREE.Vector3(...b.end),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 8, b.r, 6, false);
    const branch = mesh(geo, trunkMat);
    plantGroup.add(branch);
  });

  // Fiddle Leaf Fig leaves — large, violin-shaped clusters
  const leafMat = new THREE.MeshStandardMaterial({
    color: '#1d7a3a', roughness: 0.65, metalness: 0.0, side: THREE.DoubleSide
  });
  const leafMatDark = new THREE.MeshStandardMaterial({
    color: '#145a28', roughness: 0.7, metalness: 0.0, side: THREE.DoubleSide
  });

  const leafPositions = [
    [1.8, 5.5, 0.6], [-1.6, 6.8, -0.8], [1.2, 7.5, -0.5],
    [-1.0, 8.0, 0.7], [0.3, 8.5, 0.2], [0.6, 6.0, 0.8],
    [-0.8, 5.0, -0.6], [1.5, 7.0, 0.3], [-1.2, 7.5, 0.4],
    [0.0, 8.2, -0.3], [0.8, 4.5, -0.4], [-0.5, 6.5, 0.9],
    [1.0, 8.0, -0.2], [-0.3, 7.8, 0.6], [0.4, 5.2, -0.7],
    [1.6, 6.5, -0.4], [-1.4, 6.0, 0.5], [0.2, 7.2, 0.8],
    [-0.7, 8.5, -0.5], [0.9, 7.8, 0.1],
  ];
  leafPositions.forEach((pos, i) => {
    // Each leaf: a flat oval (fiddle leaf shape approximation)
    const leafSize = 0.6 + Math.random() * 0.3;
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.bezierCurveTo(leafSize * 0.4, leafSize * 0.3, leafSize * 0.5, leafSize * 0.8, 0, leafSize);
    leafShape.bezierCurveTo(-leafSize * 0.5, leafSize * 0.8, -leafSize * 0.4, leafSize * 0.3, 0, 0);
    const leafGeo = new THREE.ShapeGeometry(leafShape, 6);
    const leaf = new THREE.Mesh(leafGeo, i % 3 === 0 ? leafMatDark : leafMat);
    leaf.position.set(pos[0], pos[1], pos[2]);
    leaf.rotation.set(
      (Math.random() - 0.5) * 0.6,
      Math.random() * Math.PI * 2,
      (Math.random() - 0.5) * 0.4
    );
    leaf.castShadow = true;
    plantGroup.add(leaf);
  });

  plantGroup.position.set(0, 0, 0);
  g.add(plantGroup);

  // Surrounding bench seating
  for (let i = 0; i < 4; i++) {
    const bench = mesh(box(4.5, 0.55, 1.0), M.woodDark);
    bench.position.set(
      i === 0 ? 5.2 : i === 1 ? -5.2 : 0,
      0.27,
      i === 2 ? 5.2 : i === 3 ? -5.2 : 0
    );
    bench.rotation.y = i < 2 ? Math.PI/2 : 0;
    bench.castShadow = true;
    g.add(bench);
  }

  // Lift indicator panel
  const liftPanel = mesh(box(1.8, 3.5, 0.1), M.steel);
  const liftScreen = mesh(box(1.4, 1.0, 0.06), M.tvScreen); add(liftPanel, liftScreen, 0, 0.8, 0.08);
  add(g, liftPanel, rW/2 - 1.2, 5.5, -(rH/2 - 0.1));
}

function placeParking(g, rW, rH, M) {
  // Luxury car model
  const carGrp = new THREE.Group();

  const carBody = mesh(box(5.8, 1.6, 12.5), M.paintGreen); carBody.position.y = 1.0;
  carGrp.add(carBody);
  const cabin = mesh(box(5.2, 1.9, 6.8), M.glass); cabin.position.set(0, 2.5, -0.6); carGrp.add(cabin);
  const hood = mesh(box(5.6, 0.5, 3.5), M.paintGreen); hood.position.set(0, 1.5, 4.0); carGrp.add(hood);
  const trunk = mesh(box(5.6, 0.5, 2.5), M.paintGreen); trunk.position.set(0, 1.5, -4.5); carGrp.add(trunk);

  // Headlights
  const addLight = (x, z) => {
    const light = mesh(box(1.0, 0.4, 0.12), new THREE.MeshStandardMaterial({ color: '#fffef0', emissive: '#ffd700', emissiveIntensity: 0.6 }));
    light.position.set(x, 1.2, z); carGrp.add(light);
  };
  addLight(-2.0, 6.15); addLight(2.0, 6.15);
  addLight(-2.0, -6.15); addLight(2.0, -6.15);

  // Tires + rims
  const addTire = (x, z) => {
    const tire = mesh(cyl(0.95, 0.85, 14), M.rubber); tire.rotation.z = Math.PI/2; tire.position.set(x, 0.95, z); carGrp.add(tire);
    const rim  = mesh(cyl(0.65, 0.86, 10), M.gold);   rim.rotation.z = Math.PI/2;  rim.position.set(x, 0.95, z); carGrp.add(rim);
  };
  addTire(-3.0, -4.0); addTire(3.0, -4.0); addTire(-3.0, 4.0); addTire(3.0, 4.0);

  carGrp.castShadow = true;
  add(g, carGrp, 0, 0, rH * 0.05);

  // Parking lines
  const line = mesh(box(0.12, 0.04, rH - 1.0), new THREE.MeshStandardMaterial({ color: '#d4af37', roughness: 0.8 }));
  add(g, line, -(rW/2 - 1.5), 0.12, 0);
  add(g, line.clone(),  (rW/2 - 1.5), 0.12, 0);
}

function placeStaircase(g, rW, rH, M, room) {
  const st = (room && room.stairType) || 'dog-legged';
  const steps = 12;
  const stepH = WALL_H / steps;

  if (st === 'straight') {
    const stepL = (rH - 1.0) / steps;
    for (let i = 0; i < steps; i++) {
      const s = mesh(box(rW - 0.8, stepH - 0.04, stepL), M.wood);
      add(g, s, 0, i * stepH + stepH/2, -(rH/2 - 0.5) + i * stepL + stepL/2);
    }
    const rail = mesh(box(0.08, WALL_H, 0.08), M.gold);
    add(g, rail, rW/2 - 0.5, WALL_H/2, 0);
    add(g, rail.clone(), -(rW/2 - 0.5), WALL_H/2, 0);
  } else if (st === 'L-shaped') {
    const halfSteps = Math.floor(steps / 2);
    const stepL1 = (rH * 0.5 - 0.5) / halfSteps;
    const stepL2 = (rH * 0.5 - 0.5) / (steps - halfSteps);
    for (let i = 0; i < halfSteps; i++) {
      const s = mesh(box(rW * 0.45 - 0.4, stepH - 0.04, stepL1), M.wood);
      add(g, s, -rW * 0.12, i * stepH + stepH/2, -(rH/2 - 0.5) + i * stepL1 + stepL1/2);
    }
    const landing = mesh(box(rW * 0.5, stepH, rH * 0.1), M.woodDark);
    add(g, landing, rW * 0.15, halfSteps * stepH + stepH/2, 0);
    for (let i = halfSteps; i < steps; i++) {
      const s = mesh(box(rW * 0.45 - 0.4, stepH - 0.04, stepL2), M.wood);
      add(g, s, rW * 0.12, i * stepH + stepH/2, (rH/2 - 0.5) - (i - halfSteps) * stepL2 - stepL2/2);
    }
  } else if (st === 'U-shaped') {
    const halfSteps = Math.floor(steps / 2);
    const stepL = (rH * 0.45 - 0.5) / halfSteps;
    for (let i = 0; i < halfSteps; i++) {
      const s = mesh(box(rW * 0.35 - 0.4, stepH - 0.04, stepL), M.wood);
      add(g, s, -rW * 0.2, i * stepH + stepH/2, -(rH/2 - 0.5) + i * stepL + stepL/2);
    }
    const landing = mesh(box(rW * 0.7, stepH, rH * 0.1), M.woodDark);
    add(g, landing, 0, halfSteps * stepH + stepH/2, 0);
    for (let i = halfSteps; i < steps; i++) {
      const s = mesh(box(rW * 0.35 - 0.4, stepH - 0.04, stepL), M.wood);
      add(g, s, rW * 0.2, i * stepH + stepH/2, (rH/2 - 0.5) - (i - halfSteps) * stepL - stepL/2);
    }
  } else if (st === 'spiral') {
    const cx = 0, cz = 0;
    const outerR = Math.min(rW, rH) / 2 - 0.5;
    const innerR = outerR * 0.25;
    const totalSteps = 24;
    const spiralAngle = Math.PI * 2.5;
    const stepH = WALL_H / totalSteps;
    const stepAngle = spiralAngle / totalSteps;

    // Central column
    const pole = mesh(cyl(innerR + 0.1, WALL_H), M.woodDark);
    add(g, pole, cx, WALL_H / 2, cz);

    // Spiral steps
    for (let i = 0; i < totalSteps; i++) {
      const angle = (i / totalSteps) * spiralAngle;
      const y = i * stepH + stepH / 2;

      // Step geometry - wedge shape
      const stepGeo = new THREE.Shape();
      const startAngle = 0;
      const endAngle = stepAngle;
      stepGeo.moveTo(innerR, 0);
      stepGeo.arc(0, 0, innerR, startAngle, endAngle, false);
      stepGeo.arc(0, 0, outerR, endAngle, startAngle, true);
      stepGeo.closePath();

      const extrudeSettings = { depth: stepH - 0.04, bevelEnabled: false };
      const stepMesh = new THREE.Mesh(
        new THREE.ExtrudeGeometry(stepGeo, extrudeSettings),
        i % 2 === 0 ? M.wood : M.woodLight
      );
      stepMesh.position.set(cx, y, cz);
      stepMesh.rotation.y = angle;
      stepMesh.rotation.x = -Math.PI / 2;
      g.add(stepMesh);
    }

    // Handrail - spiral path
    const railPoints = [];
    for (let i = 0; i <= totalSteps; i++) {
      const angle = (i / totalSteps) * spiralAngle;
      const y = i * stepH + 2.0;
      railPoints.push(new THREE.Vector3(
        cx + Math.cos(angle) * outerR,
        y,
        cz + Math.sin(angle) * outerR
      ));
    }
    const railCurve = new THREE.CatmullRomCurve3(railPoints);
    const railGeo = new THREE.TubeGeometry(railCurve, 64, 0.06, 8, false);
    const railMesh = new THREE.Mesh(railGeo, M.gold);
    g.add(railMesh);

    // Outer posts at intervals
    for (let i = 0; i <= totalSteps; i += 6) {
      const angle = (i / totalSteps) * spiralAngle;
      const y = i * stepH;
      const post = mesh(cyl(0.04, 2.0), M.gold);
      add(g, post, cx + Math.cos(angle) * outerR, y + 1.0, cz + Math.sin(angle) * outerR);
    }
  } else {
    // dog-legged (default)
    const halfSteps = Math.floor(steps / 2);
    const stepL1 = (rH * 0.45 - 0.5) / halfSteps;
    const stepL2 = (rH * 0.45 - 0.5) / (steps - halfSteps);
    const flightW = rW * 0.38;
    const gap = 0.3;
    const midZ = 0;

    // Landing platform
    const landingW = rW * 0.85;
    const landingH = stepH * 1.5;
    const landing = mesh(box(landingW, landingH, rH * 0.12), M.woodDark);
    add(g, landing, 0, halfSteps * stepH + landingH / 2, midZ);

    // Flight 1 (going up toward landing)
    for (let i = 0; i < halfSteps; i++) {
      const s = mesh(box(flightW, stepH - 0.04, stepL1), M.wood);
      add(g, s, -(flightW / 2 + gap / 2), i * stepH + stepH / 2, -(rH / 2 - 0.5) + i * stepL1 + stepL1 / 2);
    }

    // Flight 2 (going up from landing, opposite direction)
    for (let i = halfSteps; i < steps; i++) {
      const s = mesh(box(flightW, stepH - 0.04, stepL2), M.wood);
      const localIdx = i - halfSteps;
      add(g, s, (flightW / 2 + gap / 2), i * stepH + stepH / 2, (rH / 2 - 0.5) - localIdx * stepL2 - stepL2 / 2);
    }

    // Central divider wall
    const divider = mesh(box(0.15, WALL_H * 0.6, rH * 0.85), M.woodDark);
    add(g, divider, 0, WALL_H * 0.3, 0);

    // Handrails
    const handrailH = 2.8;
    const rail1 = mesh(box(0.06, handrailH, 0.06), M.gold);
    add(g, rail1, -(flightW / 2 + gap / 2 + flightW / 2), handrailH / 2 + 0.05, 0);
    const rail2 = mesh(box(0.06, handrailH, 0.06), M.gold);
    add(g, rail2, (flightW / 2 + gap / 2 + flightW / 2), handrailH / 2 + 0.05, 0);

    // Landing rail
    const landingRail = mesh(box(landingW, 0.06, 0.06), M.gold);
    add(g, landingRail, 0, handrailH + 0.05, -(rH * 0.06));
    const landingRail2 = mesh(box(landingW, 0.06, 0.06), M.gold);
    add(g, landingRail2, 0, handrailH + 0.05, (rH * 0.06));
  }
}

/* ─── Hospital Ward furniture ────────────────────────────────────────── */
function placeWard(g, rW, rH, M) {
  // Hospital beds arranged along walls
  const bedCount = Math.max(2, Math.floor(rW / 4));
  const bedW = Math.min(2.8, rW / bedCount - 0.8);
  const bedL = Math.min(6.0, rH * 0.5);
  for (let i = 0; i < bedCount; i++) {
    const bx = -rW / 2 + 1.5 + i * (rW / bedCount);
    // Bed frame
    const frame = mesh(box(bedW, 0.6, bedL), M.steel);
    add(g, frame, bx, 0.3, -(rH / 2 - bedL / 2 - 0.4));
    // Mattress
    const mattr = mesh(box(bedW - 0.2, 0.3, bedL - 0.2), M.mattress);
    add(g, mattr, bx, 0.75, -(rH / 2 - bedL / 2 - 0.4));
    // Pillow
    const pill = mesh(box(bedW - 0.5, 0.18, 1.0), M.fabricLight);
    add(g, pill, bx, 0.95, -(rH / 2 - 0.9));
    // IV stand (pole)
    const ivPole = mesh(cyl(0.05, 5.5, 8), M.steel);
    add(g, ivPole, bx + bedW / 2 + 0.3, 2.75, -(rH / 2 - bedL / 2 - 0.4));
    const ivBag = mesh(box(0.3, 0.6, 0.15), new THREE.MeshStandardMaterial({ color: '#bde0ff', transparent: true, opacity: 0.8 }));
    add(g, ivBag, bx + bedW / 2 + 0.3, 5.0, -(rH / 2 - bedL / 2 - 0.4));
    // Bedside table
    const bst = mesh(box(0.7, 1.8, 0.7), M.steel);
    add(g, bst, bx - bedW / 2 - 0.5, 0.9, -(rH / 2 - bedL / 2 - 0.4));
  }
  // Nurse station counter in center back
  const counter = mesh(box(Math.min(4.0, rW - 2.0), 3.0, 1.5), M.plaster);
  const counterTop = mesh(box(Math.min(4.0, rW - 2.0), 0.1, 1.5), M.steel); add(counter, counterTop, 0, 1.55, 0);
  add(g, counter, 0, 1.5, rH / 2 - 1.0);
}

/* ─── Classroom furniture ────────────────────────────────────────────── */
function placeClassroom(g, rW, rH, M) {
  // Teacher desk at front
  const tDesk = mesh(box(Math.min(4.5, rW * 0.45), 0.1, 2.0), M.woodDark);
  for (let i = 0; i < 4; i++) add(tDesk, mesh(cyl(0.08, 2.2), M.woodDark), i < 2 ? -2.0 : 2.0, -1.1, i % 2 === 0 ? -0.9 : 0.9);
  add(g, tDesk, 0, 2.32, -(rH / 2 - 1.5));
  // Teacher chair
  const tCh = mesh(box(1.2, 0.1, 1.2), M.leather);
  const tBack = mesh(box(1.2, 1.4, 0.1), M.leather); add(tCh, tBack, 0, 0.8, -0.55);
  add(g, tCh, 0, 1.2, -(rH / 2 - 3.2), Math.PI);
  // Blackboard
  const bb = mesh(box(Math.min(7.0, rW - 1.5), 2.8, 0.08), new THREE.MeshStandardMaterial({ color: '#1a4a2e', roughness: 0.9 }));
  add(g, bb, 0, 5.5, -(rH / 2 - 0.06));
  const bbTrim = mesh(box(Math.min(7.2, rW - 1.3), 2.95, 0.04), M.woodDark);
  add(g, bbTrim, 0, 5.5, -(rH / 2));
  // Chalk ledge
  const ledge = mesh(box(Math.min(7.0, rW - 1.5), 0.1, 0.3), M.woodDark);
  add(g, ledge, 0, 4.1, -(rH / 2 - 0.2));
  // Student desks in rows
  const cols = Math.max(2, Math.floor((rW - 2.0) / 3.5));
  const rowCount = Math.max(2, Math.floor((rH - 5.0) / 3.2));
  const startX = -(cols - 1) * 1.75;
  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < cols; col++) {
      const dx = startX + col * 3.5;
      const dz = -(rH / 2 - 5.5) + row * 3.2;
      if (Math.abs(dz) > rH / 2 - 0.8) continue;
      const sDsk = mesh(box(1.6, 0.08, 1.0), M.woodLight);
      for (let i = 0; i < 2; i++) add(sDsk, mesh(cyl(0.06, 1.6), M.woodDark), i === 0 ? -0.65 : 0.65, -0.8, 0);
      add(g, sDsk, dx, 1.96, dz);
      const sCh = mesh(box(1.0, 0.08, 1.0), M.leatherCream);
      const sBk = mesh(box(1.0, 1.2, 0.08), M.leatherCream); add(sCh, sBk, 0, 0.7, -0.45);
      add(g, sCh, dx, 1.24, dz + 1.2);
    }
  }
}

/* ─── Retail Shop furniture ──────────────────────────────────────────── */
function placeRetailShop(g, rW, rH, M) {
  // Display shelves along walls
  const shelfCount = Math.max(2, Math.floor(rH / 4.5));
  const shelfW = Math.min(rW - 2.0, 3.0);
  for (let i = 0; i < shelfCount; i++) {
    const sz = -(rH / 2 - 1.5) + i * (rH / shelfCount);
    if (Math.abs(sz) > rH / 2 - 0.8) continue;
    // Left wall shelves
    const shelfL = mesh(box(1.4, 5.0, 0.4), M.woodDark);
    for (let s = 0; s < 4; s++) {
      const sl = mesh(box(1.35, 0.06, 0.38), M.woodLight); add(shelfL, sl, 0, -2.0 + s * 1.3, 0);
      const prod = mesh(box(1.1, 0.8, 0.3), new THREE.MeshStandardMaterial({ color: `hsl(${i * 40 + s * 80},55%,50%)`, roughness: 0.8 })); add(shelfL, prod, 0, -1.5 + s * 1.3, 0);
    }
    add(g, shelfL, -(rW / 2 - 0.8), 2.5, sz);
    // Right wall shelves
    const shelfR = shelfL.clone();
    add(g, shelfR, rW / 2 - 0.8, 2.5, sz);
  }
  // Central display table
  const dt = mesh(box(Math.min(rW - 3.0, 4.0), 0.8, Math.min(rH * 0.35, 4.0)), M.woodDark);
  add(g, dt, 0, 0.4, 0);
  // Checkout counter at entrance
  const checkout = mesh(box(Math.min(3.5, rW * 0.35), 3.0, 1.5), M.woodDark);
  const ctTop = mesh(box(Math.min(3.5, rW * 0.35), 0.1, 1.5), M.granite); add(checkout, ctTop, 0, 1.55, 0);
  add(g, checkout, 0, 1.5, rH / 2 - 1.0);
}

/* ─── Restaurant Dining Room ─────────────────────────────────────────── */
function placeRestaurantDining(g, rW, rH, M) {
  // Multiple dining table groups
  const colCount = Math.max(2, Math.floor(rW / 5.0));
  const rowCount = Math.max(2, Math.floor(rH / 5.5));
  const startX = -(colCount - 1) * 2.5;
  const startZ = -(rowCount - 1) * 2.75 + 1.0;
  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < colCount; col++) {
      const tx = startX + col * 5.0;
      const tz = startZ + row * 5.5;
      if (Math.abs(tx) > rW / 2 - 1.5 || Math.abs(tz) > rH / 2 - 1.5) continue;
      const tbl = mesh(box(2.0, 0.08, 1.2), M.woodDark);
      add(tbl, mesh(cyl(0.1, 2.0), M.woodDark), 0, -1.0, 0);
      add(g, tbl, tx, 2.08, tz);
      // 4 chairs around table
      const addDC = (dx, dz, rot) => {
        const s = mesh(box(0.8, 0.08, 0.8), M.leather);
        const bk = mesh(box(0.8, 1.0, 0.08), M.leather); add(s, bk, 0, 0.6, -0.35);
        for (let i = 0; i < 4; i++) add(s, mesh(cyl(0.05, 1.0), M.woodDark), i < 2 ? -0.35 : 0.35, -0.5, i % 2 === 0 ? -0.35 : 0.35);
        add(g, s, tx + dx, 1.24, tz + dz, rot);
      };
      addDC(-1.3, 0, Math.PI / 2);
      addDC(1.3, 0, -Math.PI / 2);
      addDC(0, -1.0, 0);
      addDC(0, 1.0, Math.PI);
    }
  }
}

/* ─── Hospital/Clinic Office ─────────────────────────────────────────── */
function placeClinicOffice(g, rW, rH, M) {
  // Doctor's desk
  const deskW = Math.min(3.5, rW * 0.55);
  const desk = mesh(box(deskW, 0.1, 2.0), M.woodLight);
  for (let i = 0; i < 4; i++) add(desk, mesh(cyl(0.07, 2.2), M.steel), i < 2 ? -deskW / 2 + 0.15 : deskW / 2 - 0.15, -1.1, i % 2 === 0 ? -0.9 : 0.9);
  const mon = mesh(box(1.2, 0.8, 0.06), M.tvScreen); add(desk, mon, 0, 0.5, -0.85);
  add(g, desk, 0, 2.32, -(rH / 2 - 1.5));
  // Doctor chair
  const dc = mesh(box(1.2, 0.1, 1.2), M.leather);
  const dcBk = mesh(box(1.2, 1.4, 0.1), M.leather); add(dc, dcBk, 0, 0.8, -0.55);
  add(g, dc, 0, 1.2, -(rH / 2 - 3.2), Math.PI);
  // Patient chair (across)
  const pc = mesh(box(1.2, 0.1, 1.2), M.leatherCream);
  const pcBk = mesh(box(1.2, 1.2, 0.1), M.leatherCream); add(pc, pcBk, 0, 0.7, -0.5);
  add(g, pc, 0, 1.1, -(rH / 2 - 5.5));
  // Examination table
  const exam = mesh(box(Math.min(2.2, rW * 0.35), 0.6, Math.min(4.5, rH * 0.45)), M.steel);
  const examTop = mesh(box(Math.min(2.2, rW * 0.35), 0.1, Math.min(4.5, rH * 0.45)), M.mattress); add(exam, examTop, 0, 0.35, 0);
  add(g, exam, rW / 2 - 1.5, 0.7, 0);
}

function placeGarden(g, rW, rH, M) {
  // Grass bed
  const grass = mesh(box(rW - 0.6, 0.12, rH - 0.6), new THREE.MeshStandardMaterial({ color: '#196b38', roughness: 0.97 }));
  add(g, grass, 0, 0.06, 0);

  // Garden trees with realistic multi-toned organic foliage & branched trunks
  const addGardenTree = (x, z) => {
    const tree = createRealistic3DTree(0.9 + Math.random() * 0.25);
    add(g, tree, x, 0, z, Math.random() * Math.PI * 2);
  };
  addGardenTree(-rW/2 + 2.0, -rH/2 + 2.0);
  addGardenTree( rW/2 - 2.0, -rH/2 + 2.0);
  addGardenTree(-rW/2 + 2.0,  rH/2 - 2.0);
  if (rW > 6 && rH > 6) addGardenTree(rW/2 - 2.0, rH/2 - 2.0);

  // Planter boxes along perimeter
  const planterBox = mesh(box(rW - 2.0, 1.0, 1.4), M.wood);
  const soilTop = mesh(box(rW - 2.4, 0.18, 1.0), M.plantGreen); add(planterBox, soilTop, 0, 0.52, 0);
  add(g, planterBox, 0, 0.5, rH/2 - 1.0);
}

function placeBalcony(g, rW, rH, M) {
  // Low glass railing
  const railH = 3.2;
  const railGlassF = mesh(box(rW, railH, 0.06), M.glass);
  add(g, railGlassF, 0, railH/2, -rH/2 + 0.06);
  const railGlassL = mesh(box(0.06, railH, rH), M.glass);
  add(g, railGlassL, -(rW/2 - 0.06), railH/2, 0);
  const railGlassR = mesh(box(0.06, railH, rH), M.glass);
  add(g, railGlassR,  (rW/2 - 0.06), railH/2, 0);

  // Gold cap rails
  add(g, mesh(box(rW + 0.1, 0.12, 0.12), M.gold), 0, railH + 0.06, -rH/2 + 0.06);
  add(g, mesh(box(0.12, 0.12, rH + 0.1), M.gold), -(rW/2), railH + 0.06, 0);
  add(g, mesh(box(0.12, 0.12, rH + 0.1), M.gold),  (rW/2), railH + 0.06, 0);

  // Outdoor chair + side table
  const outChair = mesh(box(1.6, 0.9, 1.6), M.woodLight);
  add(g, outChair, -(rW/4), 0.45, 0);
  add(g, outChair.clone(), rW/4, 0.45, 0);
  const outTable = mesh(cyl(0.7, 1.5, 10), M.gold); add(g, outTable, 0, 0.75, 0);
}

function placeTerrace(g, rW, rH, M) {
  // Terrace outdoor lounge
  const tile = mesh(box(rW - 0.2, 0.08, rH - 0.2), new THREE.MeshStandardMaterial({ color: '#7a8b80', roughness: 0.55 }));
  add(g, tile, 0, 0.04, 0);

  // Pergola columns
  const pergH = 7.5;
  const addCol = (x, z) => add(g, mesh(cyl(0.25, pergH, 8), M.woodDark), x, pergH/2, z);
  addCol(-(rW/2 - 1.0), -(rH/2 - 1.0));
  addCol( (rW/2 - 1.0), -(rH/2 - 1.0));
  addCol(-(rW/2 - 1.0),  (rH/2 - 1.0));
  addCol( (rW/2 - 1.0),  (rH/2 - 1.0));

  // Pergola beams
  const beamMat = M.woodDark;
  add(g, mesh(box(rW - 1.5, 0.3, 0.3), beamMat), 0, pergH, -(rH/2 - 1.0));
  add(g, mesh(box(rW - 1.5, 0.3, 0.3), beamMat), 0, pergH,  (rH/2 - 1.0));
  add(g, mesh(box(0.3, 0.3, rH - 1.5), beamMat), -(rW/2 - 1.0), pergH, 0);
  add(g, mesh(box(0.3, 0.3, rH - 1.5), beamMat),  (rW/2 - 1.0), pergH, 0);

  // Lounge furniture
  const lounge = mesh(box(5.5, 0.9, 2.5), M.leatherCream);
  add(g, lounge, 0, 0.45, 0);
}

/* ─── Router: pick furniture function by room type & name ───────────────── */
function placeFurniture(roomType, group, rW, rH, M, room) {
  const t = (roomType || '').toLowerCase();
  const n = (room?.name || '').toLowerCase();

  // Name-based overrides (checked first for building-type accuracy)
  if (n.includes('ward') || n.includes('icu') || n.includes('inpatient')) return placeWard(group, rW, rH, M);
  if (n.includes('classroom') || n.includes('lecture')) return placeClassroom(group, rW, rH, M);
  if (n.includes('consultation') || n.includes('opd') || n.includes('examination') || n.includes('clinic room')) return placeClinicOffice(group, rW, rH, M);
  if (n.includes('retail') || n.includes('shop unit') || n.includes('display area') || n.includes('display hall')) return placeRetailShop(group, rW, rH, M);
  if (n.includes('main dining') || n.includes('dining area') || n.includes('restaurant')) return placeRestaurantDining(group, rW, rH, M);
  if (n.includes('hotel restaurant') || n.includes('hotel dining')) return placeDining(group, rW, rH, M);
  if (n.includes('food court')) return placeRestaurantDining(group, rW, rH, M);

  // Type-based fallbacks
  if (t.includes('bed') || t === 'bedroom')                        return placeBedroom(group, rW, rH, M);
  if (t.includes('living') || t.includes('lounge') || t === 'hall') return placeLiving(group, rW, rH, M);
  if (t.includes('dining'))                                         return placeDining(group, rW, rH, M);
  if (t.includes('kitchen') || t.includes('pantry'))               return placeKitchen(group, rW, rH, M);
  if (t.includes('bath') || t === 'wc' || t.includes('toilet') || t.includes('washroom')) return placeBathroom(group, rW, rH, M);
  if (t.includes('office') || t.includes('study') || t.includes('workstation')) return placeOffice(group, rW, rH, M);
  if (t.includes('conference') || t.includes('meeting') || t.includes('boardroom')) return placeConference(group, rW, rH, M);
  if (t.includes('reception') || t.includes('waiting') || t.includes('entrance')) return placeReception(group, rW, rH, M);
  if (t.includes('lobby') || t.includes('foyer') || t.includes('atrium')) return placeLobby(group, rW, rH, M);
  if (t.includes('park') || t.includes('garage') || t.includes('car')) return placeParking(group, rW, rH, M);
  if (t.includes('stair'))                                          return placeStaircase(group, rW, rH, M, room);
  if (t.includes('garden') || t.includes('lawn') || t.includes('yard')) return placeGarden(group, rW, rH, M);
  if (t.includes('balcony') || t.includes('verandah'))             return placeBalcony(group, rW, rH, M);
  if (t.includes('terrace') || t.includes('rooftop'))              return placeTerrace(group, rW, rH, M);
}

/* ─── Floor material selection based on room's flooring property ────────────── */
function getFloorMat(room, M, floorMaterials = {}) {
  // Check if there's a synced material override from the 2D editor
  const roomMatKey = `${room.id}_floor`;
  if (floorMaterials[roomMatKey]) return floorMaterials[roomMatKey];

  const flooring = (room.flooring || '').toLowerCase();
  if (flooring.includes('marble') || flooring.includes('botticino')) return M.marbleWhite;
  if (flooring.includes('hardwood') || flooring.includes('bamboo') || flooring.includes('wood')) return M.wood;
  if (flooring.includes('tile') || flooring.includes('ceramic') || flooring.includes('vitrified')) return M.tileGrey;
  if (flooring.includes('epoxy') || flooring.includes('concrete')) return M.epoxy;
  // Fallback: infer from room type
  const t = (room.type || '').toLowerCase();
  if (t.includes('bath') || t.includes('wc') || t.includes('toilet') || t.includes('washroom')) return M.tileGrey;
  if (t.includes('kitchen'))   return M.tileGrey;
  if (t.includes('parking') || t.includes('garage')) return M.epoxy;
  if (t.includes('garden') || t.includes('lawn'))    return M.lawnGreen;
  if (t.includes('terrace'))   return new THREE.MeshStandardMaterial({ color: '#6b7b70', roughness: 0.6 });
  if (t.includes('balcony'))   return new THREE.MeshStandardMaterial({ color: '#8a9690', roughness: 0.6 });
  if (t.includes('living') || t.includes('lobby') || t.includes('reception') || t.includes('lounge')) return M.marbleWhite;
  if (t.includes('office') || t.includes('conference') || t.includes('meeting')) return M.carpet;
  return M.wood;
}

/* ─── Wall material selection based on room's wallFinish property ───────────── */
function getWallMat(room, M) {
  const finish = (room.wallFinish || '').toLowerCase();
  if (finish.includes('ceramic') || finish.includes('tile')) return M.ceramicW;
  if (finish.includes('paint') || finish.includes('matte')) return new THREE.MeshStandardMaterial({ color: '#f0ede6', roughness: 0.75 });
  if (finish.includes('wood') || finish.includes('panel')) return M.woodLight;
  if (finish.includes('stone') || finish.includes('veneer')) return M.granite;
  if (finish.includes('concrete') || finish.includes('exposed')) return M.concrete;
  // Default plaster
  return M.plaster;
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export default function ThreeDViewer({
  rooms = [],
  floorRooms = {},
  projectName = 'Modern Villa',
  buildingType = 'Single-Family Villa',
  activeFloor = 'ground',
  numFloors = 2,
  onBackTo2D,
  onOpenReport,
  currency = 'INR',
  plotArea = 3000,
  floorMaterials = {},
}) {
  const mountRef = useRef(null);
  const [viewMode,      setViewMode]      = useState('interior');
  const [roofOn,        setRoofOn]        = useState(false);
  const [furnitureOn,   setFurnitureOn]   = useState(true);
  const [measurementsOn,setMeasurementsOn]= useState(true);
  const [timeMode,      setTimeMode]      = useState('day');

  // Independent floor navigation — does NOT affect the 2D editor
  const [viewerFloor, setViewerFloor] = useState(activeFloor);

  // Sync viewerFloor when activeFloor prop changes (e.g. when reopening 3D from 2D)
  const prevActiveFloorRef = useRef(activeFloor);
  useEffect(() => {
    if (activeFloor !== prevActiveFloorRef.current) {
      prevActiveFloorRef.current = activeFloor;
      setViewerFloor(activeFloor);
    }
  }, [activeFloor]);

  const sceneRef        = useRef(null);
  const cameraRef       = useRef(null);
  const rendererRef     = useRef(null);
  const controlsRef     = useRef(null);
  const buildingGroupRef= useRef(null);   // Group that holds all room geometry
  const materialsRef    = useRef(null);   // Shared material cache

  // Derive dynamic floor config from numFloors & floorRooms
  const floorConfig = useMemo(() => {
    return getFloorConfig(
      numFloors || Object.keys(floorRooms).length || 2,
      Boolean(floorRooms.basement)
    );
  }, [numFloors, floorRooms]);

  const FLOOR_ORDER = floorConfig.floorOrder;
  const FLOOR_LABELS = floorConfig.floorLabels;
  const FLOOR_OFFSETS = floorConfig.floorOffsets;

  // Rooms for the floor currently displayed in the 3D viewer
  const viewerRooms = floorRooms[viewerFloor] || (viewerFloor === activeFloor ? rooms : []);
  const activeBuiltArea = viewerRooms.reduce((acc, r) => acc + (r.areaSqFt || 0), 0);

  /* ── Rebuild only the room geometry (no scene re-creation) ─────────────── */
  const rebuildGeometry = useCallback(() => {
    const group = buildingGroupRef.current;
    const M     = materialsRef.current;
    if (!group || !M) return;

    // Clear previous geometry
    while (group.children.length) group.remove(group.children[0]);

    const activeIdx = FLOOR_ORDER.indexOf(viewerFloor);
    const floorsToRender = Object.keys(floorRooms).length > 0
      ? Object.keys(floorRooms)
      : [viewerFloor];

    floorsToRender.forEach(floorId => {
      const floorIdx  = FLOOR_ORDER.indexOf(floorId);
      const isCurrent = floorId === viewerFloor;

      // Interior mode: skip floors above active (cutaway view)
      if (viewMode === 'interior' && floorIdx > activeIdx) return;

      const roomList = floorRooms[floorId] || (isCurrent ? viewerRooms : []);
      const heightOffset = (FLOOR_OFFSETS[floorId] || 0) - (FLOOR_OFFSETS[viewerFloor] || 0);

      roomList.forEach(room => {
        const rW = room.width  / 10;
        const rH = room.height / 10;
        const rx  = (room.x - 340) / 10 + rW / 2;
        const rz  = (room.y - 270) / 10 + rH / 2;

        const roomGroup = new THREE.Group();
        roomGroup.position.set(rx, heightOffset, rz);
        if (room.rotation) roomGroup.rotation.y = -(room.rotation * Math.PI / 180);
        group.add(roomGroup);

        // 1 – Floor slab
        const floorMat = isCurrent ? getFloorMat(room, M, floorMaterials) : M.plasterCtx;
        const floorMesh = mesh(new THREE.BoxGeometry(rW, 0.2, rH), floorMat, false, true);
        floorMesh.position.y = 0.1;
        roomGroup.add(floorMesh);

        // 2 – Walls (4 sides, with openings cut for doors/windows)
        const wallMat = viewMode === 'structure'
          ? M.structWire
          : isCurrent ? getWallMat(room, M) : M.plasterCtx;

        const drawWall = (length, isVertical, wallName, openings = []) => {
          const thickness = 0.5;
          const height = (room.type || '').toLowerCase().includes('balcony') ? 3.5 : WALL_H;

          const filtered = openings.filter(op => op.wall === wallName)
                                   .sort((a, b) => a.offset - b.offset);

          const buildSeg = (start, end) => {
            if (end - start < 0.05) return;
            const len = end - start;
            const seg = mesh(
              new THREE.BoxGeometry(
                isVertical ? thickness : len,
                height,
                isVertical ? len : thickness,
              ),
              wallMat
            );
            const mid = start + len / 2;
            seg.position.set(
              isVertical ? (wallName === 'left' ? -rW/2 : rW/2) : -length/2 + mid,
              height / 2,
              isVertical ? -length/2 + mid : (wallName === 'top' ? -rH/2 : rH/2),
            );
            roomGroup.add(seg);
          };

          if (!filtered.length) { buildSeg(0, length); return; }

          let cur = 0;
          filtered.forEach(op => {
            const size = (op.size || 30) / 10;
            const offset = op.offset / 10;
            const s = offset - size / 2;
            const e = offset + size / 2;
            buildSeg(cur, s);

            const posX = isVertical ? (wallName === 'left' ? -rW/2 : rW/2) : -length/2 + offset;
            const posZ = isVertical ? -length/2 + offset : (wallName === 'top' ? -rH/2 : rH/2);

            if (op.type === 'door') {
              // Header above door (7ft opening)
              const hdrH = height - 7.0;
              if (hdrH > 0) {
                const hdr = mesh(new THREE.BoxGeometry(isVertical ? thickness : size, hdrH, isVertical ? size : thickness), wallMat);
                hdr.position.set(posX, height - hdrH/2, posZ);
                roomGroup.add(hdr);
              }
              // Wooden door panel
              if (viewMode !== 'structure' && isCurrent) {
                const dp = mesh(new THREE.BoxGeometry(0.1, 7.0, size - 0.1), M.wood);
                dp.position.set(posX - (isVertical ? 0.1 : size*0.25), 3.5, posZ - (isVertical ? size*0.25 : 0.1));
                dp.rotation.y = isVertical ? Math.PI/5 : -Math.PI/5;
                roomGroup.add(dp);
                const handle = mesh(sphere(0.1), M.gold);
                handle.position.set(0, 0, isVertical ? -size*0.35 : size*0.35);
                dp.add(handle);
              }
            } else if (op.type === 'window') {
              const sillH = 3.0;
              const topH  = height - 7.5;
              // Sill
              const sill = mesh(new THREE.BoxGeometry(isVertical ? thickness : size, sillH, isVertical ? size : thickness), wallMat);
              sill.position.set(posX, sillH/2, posZ);
              roomGroup.add(sill);
              // Header
              if (topH > 0) {
                const topSeg = mesh(new THREE.BoxGeometry(isVertical ? thickness : size, topH, isVertical ? size : thickness), wallMat);
                topSeg.position.set(posX, height - topH/2, posZ);
                roomGroup.add(topSeg);
              }
              // Glass pane
              if (viewMode !== 'structure' && isCurrent) {
                const gp = mesh(new THREE.BoxGeometry(isVertical ? 0.07 : size - 0.15, 4.5, isVertical ? size - 0.15 : 0.07), M.glass);
                gp.position.set(posX, 5.25, posZ);
                roomGroup.add(gp);
              }
            }
            cur = e;
          });
          buildSeg(cur, length);
        };

        const doors   = room.doors   || [];
        const windows = room.windows || [];
        const removedWalls = room.removedWalls || [];
        if (!removedWalls.includes('top'))    drawWall(rW, false, 'top',    [...doors, ...windows]);
        if (!removedWalls.includes('bottom')) drawWall(rW, false, 'bottom', [...doors, ...windows]);
        if (!removedWalls.includes('left'))   drawWall(rH, true,  'left',   [...doors, ...windows]);
        if (!removedWalls.includes('right'))  drawWall(rH, true,  'right',  [...doors, ...windows]);

        // 3 – Roof slab (when enabled)
        if (roofOn && isCurrent) {
          const roofM = mesh(new THREE.BoxGeometry(rW + 0.5, 0.4, rH + 0.5), M.roofDark);
          roofM.position.y = WALL_H + 0.2;
          roomGroup.add(roofM);
        }

        // 4 – Furniture
        if (furnitureOn && isCurrent && viewMode !== 'structure') {
          try {
            placeFurniture(room.type, roomGroup, rW, rH, M, room);
          } catch (e) {
            console.warn(`[3D] Furniture error for room "${room.type}":`, e);
          }
        }

        // 5 – Bounding box helper (measurements)
        if (measurementsOn && isCurrent) {
          const bh = new THREE.BoxHelper(floorMesh, '#d4af37');
          bh.material.opacity = 0.4;
          bh.material.transparent = true;
          roomGroup.add(bh);
        }
      });
    });

    // No floating exterior context blocks — building is rendered from actual room data only
  }, [viewerRooms, floorRooms, viewerFloor, viewMode, roofOn, furnitureOn, measurementsOn, buildingType, floorMaterials]);

  /* ── Scene initialisation (runs once, or when timeMode changes) ─────────── */
  useEffect(() => {
    if (!mountRef.current) return;

    const M = buildMaterials(timeMode);
    materialsRef.current = M;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(timeMode === 'day' ? '#04100b' : '#010604');
    scene.fog = new THREE.Fog(timeMode === 'day' ? '#04100b' : '#010604', 80, 200);

    const aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(38, aspect, 0.5, 800);
    cameraRef.current = camera;
    camera.position.set(65, 50, 65);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = timeMode === 'day' ? 1.15 : 0.85;
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.minDistance = 12;
    controls.maxDistance = 220;

    // Lights — enhanced photorealistic lighting
    const ambient = new THREE.AmbientLight(timeMode === 'day' ? '#f0f4f0' : '#0a1810', timeMode === 'day' ? 0.65 : 0.28);
    scene.add(ambient);

    // Hemisphere light for sky/ground color blending
    const hemi = new THREE.HemisphereLight(
      timeMode === 'day' ? '#90d0f5' : '#0a1810',
      timeMode === 'day' ? '#3a3224' : '#050a08',
      timeMode === 'day' ? 0.6 : 0.18
    );
    scene.add(hemi);

    // Sun key light with 4K Soft Shadows
    const sun = new THREE.DirectionalLight(timeMode === 'day' ? '#fffcf0' : '#1a2e22', timeMode === 'day' ? 1.6 : 0.4);
    sun.position.set(55, 85, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    sun.shadow.bias = -0.0001;
    sun.shadow.normalBias = 0.03;
    sun.shadow.camera.left = -70;
    sun.shadow.camera.right = 70;
    sun.shadow.camera.top = 70;
    sun.shadow.camera.bottom = -70;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 220;
    sun.shadow.radius = 2.5;
    scene.add(sun);

    // Sky Fill Light (Secondary bounce light from opposite direction)
    const skyFill = new THREE.DirectionalLight(timeMode === 'day' ? '#8bbce8' : '#081410', timeMode === 'day' ? 0.4 : 0.15);
    skyFill.position.set(-45, 60, -35);
    scene.add(skyFill);

    if (timeMode === 'night') {
      const spot = new THREE.SpotLight('#d4af37', 5, 60, Math.PI / 4.5, 0.5, 1);
      spot.position.set(0, 22, 0);
      spot.castShadow = true;
      spot.shadow.mapSize.set(1024, 1024);
      scene.add(spot);
      // Interior warm fill
      const warmFill = new THREE.PointLight('#ff9944', 1.5, 40, 2);
      warmFill.position.set(0, 8, 0);
      scene.add(warmFill);
    }

    // Ground plane
    const land = mesh(new THREE.BoxGeometry(120, 0.6, 120), M.lawnGreen, false, true);
    land.position.y = -0.3;
    scene.add(land);

    // Grid helper (subtle)
    const grid = new THREE.GridHelper(100, 100, '#d4af37', '#1a3028');
    grid.position.y = 0.05;
    grid.material.opacity = 0.08;
    grid.material.transparent = true;
    scene.add(grid);

    // Boundary perimeter walls
    const bwMat = new THREE.MeshStandardMaterial({ color: '#0f1c16', roughness: 0.9 });
    const addBW = (w, d, x, z) => {
      const bw = mesh(new THREE.BoxGeometry(w, 2.8, d), bwMat);
      bw.position.set(x, 1.4, z);
      scene.add(bw);
    };
    addBW(100, 0.4, 0, -50); addBW(100, 0.4, 0, 50);
    addBW(0.4, 100, -50, 0); addBW(0.4, 100, 50, 0);

    // Building objects group
    const buildingGroup = new THREE.Group();
    buildingGroupRef.current = buildingGroup;
    scene.add(buildingGroup);

    // Resize handler
    const onResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animate
    let afId;
    const animate = () => {
      afId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(afId);
      window.removeEventListener('resize', onResize);
    };
  }, [timeMode]); // Re-init scene only when lighting mode changes

  /* ── Rebuild geometry whenever data or display options change ──────────── */
  useEffect(() => {
    rebuildGeometry();
  }, [rebuildGeometry]);

  const captureScreenshot = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const link = document.createElement('a');
    link.download = `${projectName}_3D_${activeFloor}.png`;
    link.href = rendererRef.current.domElement.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="workspace-body-layout" style={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

      {/* ── 3D Viewport (75%) ────────────────────────────────────────────── */}
      <div style={{ flex: '0 0 75%', position: 'relative', height: '100%', background: '#030a08' }}>

        {/* Sub-toolbar */}
        <div style={{
          position: 'absolute', top: 16, left: 24, zIndex: 10,
          background: 'rgba(6,22,16,0.92)', border: '1px solid var(--gold-border)',
          borderRadius: 12, padding: '0.45rem 1rem',
          display: 'flex', gap: '1rem', alignItems: 'center',
          backdropFilter: 'blur(10px)', boxShadow: '0 4px 24px rgba(0,0,0,0.6)'
        }}>
          {/* View mode */}
          {[['interior','Interior'],['exterior','Exterior'],['structure','Structure']].map(([v,label]) => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`hdr-icon-btn ${viewMode === v ? 'active' : ''}`}
              style={{ fontSize: '0.72rem', padding: '0.35rem 0.65rem', borderRadius: 6 }}
            >{label}</button>
          ))}

          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />

          {/* Toggles */}
          {[['roofOn', roofOn, setRoofOn, 'Roof'],['furnitureOn', furnitureOn, setFurnitureOn, 'Furniture'],['measurementsOn', measurementsOn, setMeasurementsOn, 'Dimensions']].map(([key, val, setter, label]) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: '#9db3a7', cursor: 'pointer' }}>
              <input type="checkbox" checked={val} onChange={e => setter(e.target.checked)} style={{ accentColor: 'var(--gold-primary)' }} />
              {label}
            </label>
          ))}

          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />

          {/* Day / Night */}
          {[['day','Day'],['night','Night']].map(([m,label]) => (
            <button key={m} onClick={() => setTimeMode(m)} style={{
              background: timeMode === m ? 'var(--gold-gradient)' : 'rgba(255,255,255,0.05)',
              color: timeMode === m ? '#04100b' : '#9db3a7',
              border: 'none', borderRadius: 4, fontSize: '0.7rem',
              padding: '0.25rem 0.5rem', cursor: 'pointer', fontWeight: 600
            }}>{label}</button>
          ))}
        </div>

        {/* Floor Navigation Tabs — independent from 2D editor */}
        <div style={{
          position: 'absolute', top: 70, left: 24, zIndex: 10,
          background: 'rgba(6,22,16,0.92)', border: '1px solid var(--gold-border)',
          borderRadius: 10, padding: '0.3rem',
          display: 'flex', gap: '0.25rem', alignItems: 'center',
          backdropFilter: 'blur(10px)', boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
        }}>
          {FLOOR_ORDER.map(fId => {
            const hasRooms = (floorRooms[fId] && floorRooms[fId].length > 0) || (fId === activeFloor && rooms.length > 0);
            return (
              <button key={fId} onClick={() => setViewerFloor(fId)} style={{
                background: viewerFloor === fId ? 'var(--gold-gradient)' : 'transparent',
                color: viewerFloor === fId ? '#04100b' : hasRooms ? '#9db3a7' : '#4a5a52',
                border: 'none', borderRadius: 6,
                fontSize: '0.68rem', fontWeight: viewerFloor === fId ? 700 : 500,
                padding: '0.3rem 0.6rem', cursor: 'pointer',
                transition: 'all 0.15s ease',
                opacity: hasRooms ? 1 : 0.5,
              }}>
                {FLOOR_LABELS[fId]}
              </button>
            );
          })}
        </div>

        {/* WebGL Canvas */}
        <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

        {/* HUD bottom bar */}
        <div style={{
          position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(6,22,16,0.92)', border: '1px solid var(--gold-border)',
          borderRadius: 16, padding: '0.6rem 1.4rem',
          display: 'flex', gap: '1rem', zIndex: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.65)'
        }}>
          <button onClick={onBackTo2D} className="btn-wizard-secondary"
            style={{ height: 36, fontSize: '0.8rem', padding: '0 1rem' }}>
            ← Back to 2D Editor
          </button>
          <button onClick={captureScreenshot} className="btn-wizard-primary"
            style={{ height: 36, fontSize: '0.8rem', padding: '0 1.2rem', gap: '0.4rem' }}>
            📸 Capture Concept
          </button>
        </div>
      </div>

      {/* ── Summary Sidebar (25%) ─────────────────────────────────────────── */}
      <aside className="sidebar-right-inspector" style={{ flex: '0 0 25%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="inspector-content-panel" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          <div className="panel-card" style={{ borderColor: 'var(--border-gold)', background: 'rgba(212,175,55,0.02)' }}>
            <div className="panel-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--gold-light)' }}>✨ 3D Model Generated</span>
              <span style={{ fontSize: '0.65rem', background: '#059669', color: '#fff', padding: '0.15rem 0.4rem', borderRadius: 4 }}>SUCCESS</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: '0.3rem' }}>
              BuildWise AI has translated your 2D blueprint into a fully furnished, building-aware 3D architectural visualization.
            </p>
          </div>

          <div className="panel-card">
            <div className="panel-card-title">Project Summary</div>
            <div className="summary-grid-2col">
              {[
                ['Project',     projectName,                          '#fff'],
                ['Building',    buildingType,                         'var(--gold-light)'],
                ['Plot Area',   `${plotArea.toLocaleString()} sq ft`, null],
                ['Built Area',  `${activeBuiltArea.toLocaleString()} sq ft`, null],
                ['Viewing Floor', FLOOR_LABELS[viewerFloor] || viewerFloor, 'var(--gold-light)'],
                ['Rooms',       viewerRooms.length,                  null],
              ].map(([label, val, clr]) => (
                <div key={label}>
                  <span className="summary-item-sub">{label}</span>
                  <div className="summary-item-val" style={clr ? { color: clr, textTransform: 'capitalize' } : { textTransform: 'capitalize' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Room type breakdown */}
          <div className="panel-card" style={{ flexGrow: 1, overflow: 'hidden' }}>
            <div className="panel-card-title">Rooms on {FLOOR_LABELS[viewerFloor] || viewerFloor}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.4rem', overflowY: 'auto', maxHeight: 180 }}>
              {viewerRooms.length === 0 && (
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', padding: '0.5rem' }}>
                  No design available for this floor.
                </p>
              )}
              {viewerRooms.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  <span style={{ textTransform: 'capitalize' }}>
                    {['bedroom','living','kitchen','dining','bathroom','parking','staircase','balcony','terrace','garden','office','conference','reception','lobby','foyer'].some(t => (r.type||'').toLowerCase().includes(t)) ? '✓' : '○'} {r.name || r.type}
                  </span>
                  <span style={{ color: '#6b8f7a' }}>{(r.areaSqFt || 0).toFixed(0)} sqft</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-card">
            <div className="panel-card-title">✨ Quick AI Analysis</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              {[
                ['Building Aware', `Styled for ${buildingType}.`],
                ['Smart Furniture', 'Beds, sofas, kitchen counters, desks auto-placed by room type.'],
                ['Floor Navigator', 'Independent floor tabs — switch floors without leaving 3D view.'],
                ['Material Sync', 'Flooring and wall materials from 2D editor appear in 3D.'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--emerald-accent)', flexShrink: 0 }}>✓</span>
                  <span><strong>{k}:</strong> {v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-card" style={{ marginTop: 'auto' }}>
            <button onClick={onOpenReport} className="btn-wizard-primary"
              style={{ width: '100%', height: 40, fontSize: '0.82rem', fontWeight: 700 }}>
              Generate Bill of Quantities & Report
            </button>
          </div>

        </div>
      </aside>

    </div>
  );
}
