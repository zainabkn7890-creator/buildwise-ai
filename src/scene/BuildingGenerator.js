import * as THREE from 'three';
import { createMaterials, getFloorMaterial } from './Materials.js';

const PX_TO_FT = 1 / 10;
const WALL_HEIGHT = 9;
const WALL_THICKNESS = 0.5;

export function generateBuilding(rooms, materials) {
  const building = new THREE.Group();
  if (!rooms || rooms.length === 0) return building;

  const mat = materials || createMaterials();
  const bounds = getBounds(rooms);
  const cx = bounds.minX + (bounds.maxX - bounds.minX) / 2;
  const cy = bounds.minY + (bounds.maxY - bounds.minY) / 2;

  const hasStairs = rooms.some(r => r.type === 'staircase');
  const hasParking = rooms.some(r => r.type === 'parking');
  const hasBalcony = rooms.some(r => r.type === 'balcony');
  const hasGarden = rooms.some(r => r.type === 'garden');

  rooms.forEach(room => {
    const rx = room.x * PX_TO_FT;
    const rz = room.y * PX_TO_FT;
    const rw = room.width * PX_TO_FT;
    const rl = room.height * PX_TO_FT;
    const rot = (room.rotation || 0) * Math.PI / 180;

    createRoomFloor(building, rx, rz, rw, rl, rot, room, mat);
    createRoomWalls(building, rx, rz, rw, rl, rot, room, mat, WALL_HEIGHT, WALL_THICKNESS);
    createRoomCeiling(building, rx, rz, rw, rl, rot, mat, WALL_HEIGHT);
    createFurniture(building, rx, rz, rw, rl, rot, room, mat);
  });

  createRoof(building, bounds, mat, WALL_HEIGHT);
  createGround(building, bounds, mat);

  if (hasParking) createDriveway(building, bounds, mat);
  if (hasGarden) createGardenArea(building, bounds, mat);
  if (hasStairs) createStaircaseTower(building, bounds, mat);
  if (hasBalcony) createBalcony(building, rooms, mat);

  building.castShadow = true;
  building.receiveShadow = true;

  return { group: building, bounds };
}

function getBounds(rooms) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  rooms.forEach(r => {
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.width);
    maxY = Math.max(maxY, r.y + r.height);
  });
  return {
    minX: minX * PX_TO_FT,
    minY: minY * PX_TO_FT,
    maxX: maxX * PX_TO_FT,
    maxY: maxY * PX_TO_FT,
    width: (maxX - minX) * PX_TO_FT,
    height: (maxY - minY) * PX_TO_FT,
  };
}

function createRoomFloor(group, x, z, w, l, rot, room, mat) {
  const floorMat = getFloorMaterial(room.flooring, mat);
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.3, l),
    floorMat
  );
  floor.position.set(x + w / 2, 0.15, z + l / 2);
  floor.rotation.y = -rot;
  floor.receiveShadow = true;
  floor.castShadow = false;
  group.add(floor);
}

function createRoomWalls(group, x, z, w, l, rot, room, mat, height, thickness) {
  const doors = room.doors || [];
  const windows = room.windows || [];
  const cx = x + w / 2;
  const cz = z + l / 2;

  const walls = [
    { x1: 0, z1: 0, x2: w, z2: 0, name: 'top' },
    { x1: 0, z1: l, x2: w, z2: l, name: 'bottom' },
    { x1: 0, z1: 0, x2: 0, z2: l, name: 'left' },
    { x1: w, z1: 0, x2: w, z2: l, name: 'right' },
  ];

  walls.forEach(wall => {
    const openings = [
      ...doors.filter(d => d.wall === wall.name).map(d => ({ pos: d.offset * PX_TO_FT, size: d.size * PX_TO_FT, type: 'door' })),
      ...windows.filter(w => w.wall === wall.name).map(win => ({ pos: win.offset * PX_TO_FT, size: win.size * PX_TO_FT, type: 'window' })),
    ];

    const dx = wall.x2 - wall.x1;
    const dz = wall.z2 - wall.z1;
    const length = Math.sqrt(dx * dx + dz * dz);

    if (openings.length === 0) {
      const wallGeo = new THREE.BoxGeometry(length, height, thickness);
      const wallMesh = new THREE.Mesh(wallGeo, mat.wall);
      wallMesh.position.set(
        cx + (wall.x1 + wall.x2) / 2 - cx,
        height / 2,
        cz + (wall.z1 + wall.z2) / 2 - cz
      );
      if (dx === 0) wallMesh.rotation.y = Math.PI / 2;
      wallMesh.rotation.y += rot;
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      group.add(wallMesh);
      return;
    }

    const angle = Math.atan2(dz, dx);
    const sorted = openings.sort((a, b) => a.pos - b.pos);
    let prevEnd = 0;

    sorted.forEach(op => {
      const opStart = op.pos - op.size / 2;
      const opEnd = op.pos + op.size / 2;

      if (opStart > prevEnd) {
        const segLen = opStart - prevEnd;
        const seg = new THREE.Mesh(
          new THREE.BoxGeometry(segLen, height, thickness),
          mat.wall
        );
        const mid = prevEnd + segLen / 2;
        const wx = wall.x1 + Math.cos(angle) * mid;
        const wz = wall.z1 + Math.sin(angle) * mid;
        seg.position.set(wx, height / 2, wz);
        if (dx === 0) seg.rotation.y = Math.PI / 2;
        seg.rotation.y += rot;
        seg.castShadow = true;
        seg.receiveShadow = true;
        group.add(seg);
      }

      if (op.type === 'door') {
        const doorGeo = new THREE.BoxGeometry(op.size, 7, thickness * 0.6);
        const door = new THREE.Mesh(doorGeo, mat.door);
        const mid = op.pos;
        const dx2 = wall.x1 + Math.cos(angle) * mid;
        const dz2 = wall.z1 + Math.sin(angle) * mid;
        door.position.set(dx2, 3.5, dz2);
        if (dx === 0) door.rotation.y = Math.PI / 2;
        door.rotation.y += rot;
        door.castShadow = true;
        group.add(door);

        const frameGeo = new THREE.BoxGeometry(op.size + 0.4, 0.3, thickness * 0.8);
        const frame = new THREE.Mesh(frameGeo, mat.doorFrame);
        frame.position.set(dx2, 7.15, dz2);
        if (dx === 0) frame.rotation.y = Math.PI / 2;
        frame.rotation.y += rot;
        group.add(frame);
      }

      if (op.type === 'window') {
        const glassGeo = new THREE.BoxGeometry(op.size, 4, thickness * 0.3);
        const glass = new THREE.Mesh(glassGeo, mat.glass);
        const mid = op.pos;
        const wx2 = wall.x1 + Math.cos(angle) * mid;
        const wz2 = wall.z1 + Math.sin(angle) * mid;
        glass.position.set(wx2, 5.5, wz2);
        if (dx === 0) glass.rotation.y = Math.PI / 2;
        glass.rotation.y += rot;
        group.add(glass);

        for (let i = -1; i <= 1; i += 2) {
          const sill = new THREE.Mesh(
            new THREE.BoxGeometry(thickness * 0.5, 0.3, op.size + 0.4),
            mat.windowFrame
          );
          sill.position.set(
            wx2 + Math.sin(angle) * (i * thickness * 0.35),
            3.5,
            wz2 - Math.cos(angle) * (i * thickness * 0.35)
          );
          if (dx === 0) sill.rotation.y = Math.PI / 2;
          sill.rotation.y += rot;
          group.add(sill);
        }
      }

      prevEnd = opEnd;
    });

    if (prevEnd < length) {
      const segLen = length - prevEnd;
      const seg = new THREE.Mesh(
        new THREE.BoxGeometry(segLen, height, thickness),
        mat.wall
      );
      const mid = prevEnd + segLen / 2;
      const wx = wall.x1 + Math.cos(angle) * mid;
      const wz = wall.z1 + Math.sin(angle) * mid;
      seg.position.set(wx, height / 2, wz);
      if (dx === 0) seg.rotation.y = Math.PI / 2;
      seg.rotation.y += rot;
      seg.castShadow = true;
      seg.receiveShadow = true;
      group.add(seg);
    }
  });
}

function createRoomCeiling(group, x, z, w, l, rot, mat, height) {
  const ceiling = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.15, l),
    new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.9, side: THREE.BackSide })
  );
  ceiling.position.set(x + w / 2, height, z + l / 2);
  ceiling.rotation.y = -rot;
  ceiling.castShadow = false;
  ceiling.receiveShadow = false;
  group.add(ceiling);
}

function createFurniture(group, rx, rz, rw, rl, rot, room, mat) {
  const items = room.furniture || [];
  const roomCx = rx + rw / 2;
  const roomCz = rz + rl / 2;

  items.forEach(item => {
    const fx = rx + (item.x || 0) * PX_TO_FT;
    const fz = rz + (item.y || 0) * PX_TO_FT;
    const frot = (item.rotation || 0) * Math.PI / 180;
    const totalRot = rot + frot;

    let mesh = null;
    switch (item.type) {
      case 'sofa':
        mesh = new THREE.Mesh(new THREE.BoxGeometry(6, 2.5, 2.5), mat.furniture.sofa);
        mesh.position.set(fx, 1.25, fz);
        break;
      case 'bed':
        mesh = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.5, 6.5), mat.furniture.bed);
        mesh.position.set(fx, 0.75, fz);
        const pillow = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 0.5, 2),
          new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
        );
        pillow.position.set(fx, 1.0, fz - 2.2);
        pillow.rotation.y = totalRot;
        group.add(pillow);
        break;
      case 'table':
      case 'dining':
        mesh = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 3), mat.furniture.table);
        mesh.position.set(fx, 1.25, fz);
        break;
      case 'chair':
        mesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2, 1.5), mat.furniture.chair);
        mesh.position.set(fx, 1.0, fz);
        break;
      case 'cabinet':
        mesh = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 1.5), mat.furniture.cabinet);
        mesh.position.set(fx, 2.0, fz);
        break;
      default:
        mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), mat.furniture.cabinet);
        mesh.position.set(fx, 1.0, fz);
        break;
    }

    if (mesh) {
      mesh.rotation.y = totalRot;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
  });

  if (room.type === 'kitchen') {
    const counterLen = Math.min(rw, rl) * 0.5;
    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(counterLen, 2.5, 2),
      mat.furniture.counter
    );
    const cxOff = -rw / 2 + counterLen / 2 + 1;
    const czOff = -rl / 2 + 1.5;
    counter.position.set(
      rx + rw / 2 + cxOff * Math.cos(-rot) - czOff * Math.sin(-rot),
      1.25,
      rz + rl / 2 + cxOff * Math.sin(-rot) + czOff * Math.cos(-rot)
    );
    counter.rotation.y = rot;
    counter.castShadow = true;
    counter.receiveShadow = true;
    group.add(counter);
  }

  if (room.type === 'bathroom') {
    const toilet = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.5, 1.5),
      mat.furniture.toilet
    );
    toilet.position.set(
      rx + rw * 0.25,
      0.75,
      rz + rl * 0.25
    );
    toilet.castShadow = true;
    toilet.receiveShadow = true;
    group.add(toilet);

    const sink = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 2.5, 1),
      mat.furniture.fixture
    );
    sink.position.set(
      rx + rw * 0.75,
      1.25,
      rz + rl * 0.25
    );
    sink.castShadow = true;
    sink.receiveShadow = true;
    group.add(sink);
  }

  if (room.type === 'living') {
    const table = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1.5, 2),
      mat.furniture.table
    );
    table.position.set(roomCx, 0.75, roomCz);
    table.castShadow = true;
    table.receiveShadow = true;
    group.add(table);
  }
}

function createRoof(group, bounds, mat, wallHeight) {
  const rw = bounds.width + 4;
  const rl = bounds.height + 4;
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(rw, 0.5, rl),
    mat.roof
  );
  const cx = bounds.minX + (bounds.maxX - bounds.minX) / 2;
  const cz = bounds.minY + (bounds.maxY - bounds.minY) / 2;
  roof.position.set(cx, wallHeight + 0.25, cz);
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);
}

function createGround(group, bounds, mat) {
  const margin = 40;
  const groundSize = Math.max(bounds.width, bounds.height) + margin * 2;
  const cx = bounds.minX + (bounds.maxX - bounds.minX) / 2;
  const cz = bounds.minY + (bounds.maxY - bounds.minY) / 2;

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(groundSize, groundSize),
    mat.ground
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(cx, -0.01, cz);
  ground.receiveShadow = true;
  group.add(ground);
}

function createDriveway(group, bounds, mat) {
  const cx = bounds.minX + (bounds.maxX - bounds.minX) / 2;
  const cz = bounds.maxY + 5;
  const drive = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 20),
    mat.driveway
  );
  drive.rotation.x = -Math.PI / 2;
  drive.position.set(cx, 0.01, cz);
  drive.receiveShadow = true;
  group.add(drive);
}

function createGardenArea(group, bounds, mat) {
  const garden = new THREE.Mesh(
    new THREE.PlaneGeometry(15, 15),
    mat.garden
  );
  garden.rotation.x = -Math.PI / 2;
  garden.position.set(bounds.minX - 5, 0.02, bounds.minY - 5);
  garden.receiveShadow = true;
  group.add(garden);

  for (let i = 0; i < 8; i++) {
    const tree = createTree();
    const angle = (i / 8) * Math.PI * 2;
    const dist = 8 + Math.random() * 4;
    tree.position.set(
      bounds.minX - 5 + Math.cos(angle) * dist,
      0,
      bounds.minY - 5 + Math.sin(angle) * dist
    );
    const s = 0.8 + Math.random() * 0.6;
    tree.scale.set(s, s, s);
    tree.rotation.y = Math.random() * Math.PI * 2;
    group.add(tree);
  }
}

function createStaircaseTower(group, bounds, mat) {
  const cx = bounds.minX + (bounds.maxX - bounds.minX) / 2;
  const cz = bounds.minY + (bounds.maxY - bounds.minY) / 2;

  for (let i = 0; i < 10; i++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 0.5, 1),
      mat.staircase
    );
    step.position.set(cx - 1.5 + i * 0.5, i * 0.5 + 0.25, cz);
    step.castShadow = true;
    step.receiveShadow = true;
    group.add(step);
  }
}

function createBalcony(group, rooms, mat) {
  rooms.filter(r => r.type === 'balcony').forEach(room => {
    const bx = room.x * PX_TO_FT;
    const bz = room.y * PX_TO_FT;
    const bw = room.width * PX_TO_FT;
    const bl = room.height * PX_TO_FT;
    const rot = (room.rotation || 0) * Math.PI / 180;

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(bw, 0.3, bl),
      mat.parking
    );
    const cx = bx + bw / 2;
    const cz = bz + bl / 2;
    floor.position.set(cx, 0.15, cz);
    floor.rotation.y = -rot;
    floor.receiveShadow = true;
    group.add(floor);

    for (let i = 0; i < 12; i++) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 3, 0.15),
        mat.balconyRailing
      );
      const t = i / 11;
      const px = bx + t * bw;
      post.position.set(px, 1.65, bz);
      post.castShadow = true;
      group.add(post);

      const post2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 3, 0.15),
        mat.balconyRailing
      );
      post2.position.set(px, 1.65, bz + bl);
      post2.castShadow = true;
      group.add(post2);
    }

    for (let i = 0; i < 8; i++) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 3, 0.15),
        mat.balconyRailing
      );
      const t = i / 7;
      const pz = bz + t * bl;
      post.position.set(bx, 1.65, pz);
      post.castShadow = true;
      group.add(post);

      const post2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 3, 0.15),
        mat.balconyRailing
      );
      post2.position.set(bx + bw, 1.65, pz);
      post2.castShadow = true;
      group.add(post2);
    }

    const railMat = mat.balconyRailing;
    for (let h = 0.5; h < 3; h += 1.0) {
      const rail1 = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.1, 0.1), railMat);
      rail1.position.set(cx, h, bz);
      group.add(rail1);

      const rail2 = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.1, 0.1), railMat);
      rail2.position.set(cx, h, bz + bl);
      group.add(rail2);

      const rail3 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, bl), railMat);
      rail3.position.set(bx, h, cz);
      group.add(rail3);

      const rail4 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, bl), railMat);
      rail4.position.set(bx + bw, h, cz);
      group.add(rail4);
    }
  });
}

function createTree() {
  const tree = new THREE.Group();

  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x3d2817,
    roughness: 0.92,
    metalness: 0.05
  });

  // Tapered flared trunk base
  const trunkBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.55, 1.4, 10),
    trunkMat
  );
  trunkBase.position.y = 0.7;
  trunkBase.castShadow = true;
  trunkBase.receiveShadow = true;
  tree.add(trunkBase);

  const trunkMid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.35, 2.2, 10),
    trunkMat
  );
  trunkMid.position.set(0.05, 2.2, 0.02);
  trunkMid.rotation.z = -0.05;
  trunkMid.castShadow = true;
  trunkMid.receiveShadow = true;
  tree.add(trunkMid);

  // Secondary structural branches
  const bAngles = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];
  bAngles.forEach((ang, idx) => {
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.16, 1.4, 8),
      trunkMat
    );
    branch.position.set(Math.cos(ang) * 0.25, 2.8 + idx * 0.2, Math.sin(ang) * 0.25);
    branch.rotation.x = Math.sin(ang) * 0.45;
    branch.rotation.z = Math.cos(ang) * 0.45;
    branch.castShadow = true;
    tree.add(branch);
  });

  // Multi-layered organic foliage clusters with 3 realistic green tones
  const matDark  = new THREE.MeshStandardMaterial({ color: 0x133e1c, roughness: 0.88, metalness: 0.0 });
  const matMid   = new THREE.MeshStandardMaterial({ color: 0x257038, roughness: 0.82, metalness: 0.0 });
  const matLight = new THREE.MeshStandardMaterial({ color: 0x3ea454, roughness: 0.76, metalness: 0.0 });

  const clusters = [
    { pos: [0, 3.8, 0], scale: 1.6, mat: matMid },
    { pos: [0.9, 3.6, 0.6], scale: 1.25, mat: matLight },
    { pos: [-0.9, 3.7, -0.5], scale: 1.3, mat: matDark },
    { pos: [0.4, 4.0, -0.8], scale: 1.2, mat: matMid },
    { pos: [-0.5, 3.9, 0.8], scale: 1.25, mat: matLight },
    { pos: [0, 4.6, 0], scale: 1.35, mat: matLight },
    { pos: [0.6, 4.4, 0.4], scale: 1.1, mat: matMid },
    { pos: [-0.6, 4.5, -0.3], scale: 1.15, mat: matDark },
  ];

  clusters.forEach(c => {
    const geo = new THREE.IcosahedronGeometry(c.scale, 2);
    const foliage = new THREE.Mesh(geo, c.mat);
    foliage.position.set(c.pos[0], c.pos[1], c.pos[2]);
    foliage.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    tree.add(foliage);
  });

  return tree;
}
