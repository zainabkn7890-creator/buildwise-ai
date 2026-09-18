import * as THREE from 'three';

export function createMaterials() {
  return {
    wall: new THREE.MeshStandardMaterial({
      color: 0xe8e0d4,
      roughness: 0.6,
      metalness: 0.0,
    }),
    wallInterior: new THREE.MeshStandardMaterial({
      color: 0xf5f0eb,
      roughness: 0.7,
      metalness: 0.0,
    }),
    floor: {
      'Italian Marble': new THREE.MeshStandardMaterial({
        color: 0xf0ebe3,
        roughness: 0.15,
        metalness: 0.05,
      }),
      Hardwood: new THREE.MeshStandardMaterial({
        color: 0x8b6914,
        roughness: 0.5,
        metalness: 0.0,
      }),
      'Vitrified Tile': new THREE.MeshStandardMaterial({
        color: 0xd4d0c8,
        roughness: 0.1,
        metalness: 0.1,
      }),
      'Epoxy Concrete': new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 0.8,
        metalness: 0.0,
      }),
    },
    defaultFloor: new THREE.MeshStandardMaterial({
      color: 0xc8c0b8,
      roughness: 0.6,
      metalness: 0.0,
    }),
    roof: new THREE.MeshStandardMaterial({
      color: 0x5a4a3a,
      roughness: 0.9,
      metalness: 0.0,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x88ccee,
      roughness: 0.0,
      metalness: 0.0,
      transparent: true,
      opacity: 0.35,
      ior: 1.5,
      envMapIntensity: 1.0,
    }),
    door: new THREE.MeshStandardMaterial({
      color: 0x6b4423,
      roughness: 0.7,
      metalness: 0.0,
    }),
    doorFrame: new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.6,
      metalness: 0.0,
    }),
    windowFrame: new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.4,
      metalness: 0.3,
    }),
    furniture: {
      sofa: new THREE.MeshStandardMaterial({ color: 0x4a6fa5, roughness: 0.8 }),
      bed: new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.9 }),
      table: new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.6 }),
      chair: new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 }),
      cabinet: new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.5 }),
      counter: new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.2, metalness: 0.1 }),
      fixture: new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3 }),
      toilet: new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.3 }),
    },
    staircase: new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.6,
      metalness: 0.0,
    }),
    balconyRailing: new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.4,
      metalness: 0.5,
    }),
    parking: new THREE.MeshStandardMaterial({
      color: 0x606060,
      roughness: 0.9,
      metalness: 0.0,
    }),
    garden: new THREE.MeshStandardMaterial({
      color: 0x3a7d3a,
      roughness: 1.0,
      metalness: 0.0,
    }),
    ground: new THREE.MeshStandardMaterial({
      color: 0x5a7a4a,
      roughness: 1.0,
      metalness: 0.0,
    }),
    driveway: new THREE.MeshStandardMaterial({
      color: 0x505050,
      roughness: 0.9,
      metalness: 0.0,
    }),
    path: new THREE.MeshStandardMaterial({
      color: 0x909090,
      roughness: 0.8,
      metalness: 0.0,
    }),
    sky: new THREE.Color(0x87ceeb),
  };
}

export function getFloorMaterial(flooring, materials) {
  return materials.floor[flooring] || materials.defaultFloor;
}
