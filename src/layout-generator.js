/* ==========================================================================
   BUILDWISE AI — RESIDENTIAL LAYOUT GENERATION ENGINE
   ========================================================================== */

import { getFloorConfig, parseFloorCount, parseBasementOption } from './floor-config.js';

let _uid = 0;
const uid = (prefix) => `${prefix}_${++_uid}`;

const area = (w, h) => Math.round((w / 10) * (h / 10)); // px dims → sqft

function budgetTier(budget) {
  if (budget >= 10000000) return 'luxury';   // ₹1 Cr+
  if (budget >= 5000000)  return 'premium';  // ₹50L+
  return 'standard';
}

function defaultFlooring(type, tier) {
  const t = (type || '').toLowerCase();
  if (t.includes('bath') || t.includes('toilet') || t.includes('powder')) return 'Vitrified Tile';
  if (t.includes('kitchen')) return 'Vitrified Tile';
  if (t.includes('parking') || t.includes('garage')) return 'Epoxy Concrete';
  if (t.includes('garden') || t.includes('lawn') || t.includes('terrace') || t.includes('balcony')) return 'Epoxy Concrete';
  if (t.includes('living') || t.includes('foyer') || t.includes('dining')) return tier === 'luxury' ? 'Italian Marble' : 'Hardwood';
  if (tier === 'luxury') return 'Italian Marble';
  if (tier === 'premium') return 'Hardwood';
  return 'Vitrified Tile';
}

function defaultWallFinish(tier) {
  return 'Plaster';
}

function makeRoom(overrides) {
  const base = {
    id: uid('room'),
    name: '',
    type: 'living',
    x: 0, y: 0,
    width: 140, height: 140,
    areaSqFt: 196,
    flooring: 'Vitrified Tile',
    wallFinish: 'Plaster',
    rotation: 0,
    doors: [],
    windows: [],
    removedWalls: [],
    furniture: [],
  };
  const room = { ...base, ...overrides };
  room.areaSqFt = area(room.width, room.height);
  return room;
}

function addDoor(room, wall, offset, size = 30) {
  room.doors.push({ id: uid('d'), wall, offset, size });
}
function addWindow(room, wall, offset, size = 40) {
  room.windows.push({ id: uid('w'), wall, offset, size });
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONNECTED RESIDENTIAL VILLA GENERATOR
   ═══════════════════════════════════════════════════════════════════════════ */
export function generateLayout(config = {}) {
  const {
    floors = '2',
    basementOption = 'none',
    staircase = 'dog-legged',
    budget = 5000000,
    amenities = {}
  } = config;

  const numFloors = parseFloorCount(floors);
  const basement = parseBasementOption(basementOption);
  const tier = budgetTier(budget);

  const fl = tier === 'luxury' ? 'Italian Marble' : tier === 'premium' ? 'Hardwood' : 'Vitrified Tile';
  const wf = defaultWallFinish(tier);

  const result = {};

  // ── GROUND FLOOR ──────────────────────────────────────────────────────
  const groundRooms = [];

  // Room 1: Master/Guest Bedroom 1 (Top Left)
  const bed1 = makeRoom({
    id: 'g_bed1', name: 'Master Bedroom', type: 'bedroom',
    x: 90, y: 70, width: 140, height: 150,
    flooring: tier === 'standard' ? 'Vitrified Tile' : 'Hardwood', wallFinish: wf,
    furniture: [
      { id: 'f_gbed1_bed', type: 'bed', x: 70, y: 50, rotation: 0 },
      { id: 'f_gbed1_st1', type: 'cabinet', x: 25, y: 40, rotation: 0 },
      { id: 'f_gbed1_st2', type: 'cabinet', x: 115, y: 40, rotation: 0 },
      { id: 'f_gbed1_ward', type: 'cabinet', x: 30, y: 120, rotation: 90 }
    ]
  });
  addDoor(bed1, 'right', 60, 30);
  addWindow(bed1, 'top', 70, 40);
  addWindow(bed1, 'left', 75, 40);
  groundRooms.push(bed1);

  // Room 2: Bathroom 1 (Top Center)
  const bath1 = makeRoom({
    id: 'g_bath1', name: 'Bathroom 1', type: 'bathroom',
    x: 230, y: 70, width: 150, height: 150,
    flooring: 'Vitrified Tile', wallFinish: 'Ceramic Tile',
    furniture: [
      { id: 'f_gbath1_wc', type: 'toilet', x: 40, y: 40, rotation: 0 },
      { id: 'f_gbath1_sink', type: 'sink', x: 110, y: 40, rotation: 0 }
    ]
  });
  addDoor(bath1, 'bottom', 75, 30);
  addWindow(bath1, 'top', 75, 30);
  groundRooms.push(bath1);

  // Room 3: Kitchen & Pantry (Top Right)
  const kitchen = makeRoom({
    id: 'g_kitchen', name: 'Kitchen & Pantry', type: 'kitchen',
    x: 380, y: 70, width: 210, height: 150,
    flooring: 'Vitrified Tile', wallFinish: 'Ceramic Tile',
    furniture: [
      { id: 'f_gkit_counter', type: 'counter', x: 105, y: 40, rotation: 0 }
    ]
  });
  addDoor(kitchen, 'bottom', 105, 30);
  addWindow(kitchen, 'top', 105, 50);
  addWindow(kitchen, 'right', 75, 40);
  groundRooms.push(kitchen);

  // Room 4: Prayer Room / Study (Middle Left)
  const study = makeRoom({
    id: 'g_study', name: 'Prayer & Study Room', type: 'study',
    x: 90, y: 220, width: 140, height: 120,
    flooring: tier === 'standard' ? 'Vitrified Tile' : 'Hardwood', wallFinish: wf,
    furniture: [
      { id: 'f_gstudy_desk', type: 'table', x: 70, y: 40, rotation: 0 },
      { id: 'f_gstudy_chair', type: 'chair', x: 70, y: 75, rotation: 0 }
    ]
  });
  addDoor(study, 'right', 60, 30);
  addWindow(study, 'left', 60, 40);
  groundRooms.push(study);

  // Room 5: Staircase (Middle Center)
  const stair = makeRoom({
    id: 'g_stair', name: 'Staircase', type: 'staircase',
    stairType: staircase,
    x: 230, y: 220, width: 150, height: 120,
    flooring: 'Hardwood', wallFinish: wf
  });
  groundRooms.push(stair);

  // Room 6: Living Room (Middle Right)
  const living = makeRoom({
    id: 'g_living', name: 'Living Room', type: 'living',
    x: 380, y: 220, width: 210, height: 120,
    flooring: fl, wallFinish: wf,
    furniture: [
      { id: 'f_gliv_sofa', type: 'sofa', x: 105, y: 40, rotation: 0 },
      { id: 'f_gliv_table', type: 'table', x: 105, y: 80, rotation: 0 }
    ]
  });
  addDoor(living, 'left', 60, 30);
  addDoor(living, 'top', 105, 30);
  addWindow(living, 'right', 60, 50);
  groundRooms.push(living);

  // Room 7: Bedroom 2 / Guest Room (Bottom Left)
  const bed2 = makeRoom({
    id: 'g_bed2', name: 'Guest Bedroom', type: 'bedroom',
    x: 90, y: 340, width: 140, height: 130,
    flooring: tier === 'standard' ? 'Vitrified Tile' : 'Hardwood', wallFinish: wf,
    furniture: [
      { id: 'f_gbed2_bed', type: 'bed', x: 70, y: 65, rotation: 0 }
    ]
  });
  addDoor(bed2, 'right', 65, 30);
  addWindow(bed2, 'bottom', 70, 40);
  addWindow(bed2, 'left', 65, 40);
  groundRooms.push(bed2);

  // Room 8: Foyer (Bottom Center)
  const foyer = makeRoom({
    id: 'g_foyer', name: 'Foyer', type: 'foyer',
    x: 230, y: 340, width: 150, height: 130,
    flooring: fl, wallFinish: wf,
    furniture: [
      { id: 'f_gfoy_table', type: 'table', x: 75, y: 40, rotation: 0 }
    ]
  });
  addDoor(foyer, 'bottom', 75, 40); // Main entrance door
  addDoor(foyer, 'top', 75, 30);
  addDoor(foyer, 'right', 65, 30);
  groundRooms.push(foyer);

  // Room 9: Garage (Bottom Right)
  const garage = makeRoom({
    id: 'g_garage', name: 'Integrated Garage', type: 'parking',
    x: 380, y: 340, width: 210, height: 130,
    flooring: 'Epoxy Concrete', wallFinish: 'Plaster'
  });
  addDoor(garage, 'bottom', 105, 80);
  groundRooms.push(garage);

  result.ground = groundRooms;

  // ── FIRST FLOOR ───────────────────────────────────────────────────────
  if (numFloors >= 2) {
    const firstRooms = [];

    const fMaster = makeRoom({
      id: 'f_master', name: 'Master Suite', type: 'bedroom',
      x: 90, y: 70, width: 140, height: 150,
      flooring: tier === 'luxury' ? 'Italian Marble' : 'Hardwood', wallFinish: wf,
      furniture: [{ id: 'f_fmaster_bed', type: 'bed', x: 70, y: 50, rotation: 0 }]
    });
    addDoor(fMaster, 'right', 60, 30);
    addWindow(fMaster, 'top', 70, 50);
    addWindow(fMaster, 'left', 75, 40);
    firstRooms.push(fMaster);

    const fMbath = makeRoom({
      id: 'f_mbath', name: 'Master Bath', type: 'bathroom',
      x: 230, y: 70, width: 150, height: 150,
      flooring: tier === 'luxury' ? 'Italian Marble' : 'Vitrified Tile', wallFinish: 'Ceramic Tile',
      furniture: [{ id: 'f_fmbath_wc', type: 'toilet', x: 40, y: 40, rotation: 0 }]
    });
    addDoor(fMbath, 'left', 75, 30);
    addWindow(fMbath, 'top', 75, 30);
    firstRooms.push(fMbath);

    const fBed2 = makeRoom({
      id: 'f_bed2', name: 'Bedroom 2', type: 'bedroom',
      x: 380, y: 70, width: 210, height: 150,
      flooring: tier === 'standard' ? 'Vitrified Tile' : 'Hardwood', wallFinish: wf,
      furniture: [{ id: 'f_fbed2_bed', type: 'bed', x: 105, y: 50, rotation: 0 }]
    });
    addDoor(fBed2, 'bottom', 105, 30);
    addWindow(fBed2, 'top', 105, 50);
    firstRooms.push(fBed2);

    const fStudy = makeRoom({
      id: 'f_study', name: 'Study & Library', type: 'study',
      x: 90, y: 220, width: 140, height: 120,
      flooring: tier === 'standard' ? 'Vitrified Tile' : 'Hardwood', wallFinish: wf,
      furniture: [{ id: 'f_fstudy_desk', type: 'table', x: 70, y: 40, rotation: 0 }]
    });
    addDoor(fStudy, 'right', 60, 30);
    addWindow(fStudy, 'left', 60, 40);
    firstRooms.push(fStudy);

    const fStair = makeRoom({
      id: 'f_stair', name: 'Staircase', type: 'staircase',
      stairType: staircase,
      x: 230, y: 220, width: 150, height: 120,
      flooring: 'Hardwood', wallFinish: wf
    });
    firstRooms.push(fStair);

    const fLounge = makeRoom({
      id: 'f_lounge', name: 'Family Lounge', type: 'living',
      x: 380, y: 220, width: 210, height: 120,
      flooring: fl, wallFinish: wf,
      furniture: [{ id: 'f_flounge_sofa', type: 'sofa', x: 105, y: 40, rotation: 0 }]
    });
    addDoor(fLounge, 'left', 60, 30);
    addWindow(fLounge, 'right', 60, 50);
    firstRooms.push(fLounge);

    const fBalc = makeRoom({
      id: 'f_balcony', name: 'Master Balcony', type: 'balcony',
      x: 90, y: 340, width: 140, height: 130,
      flooring: 'Epoxy Concrete', wallFinish: 'Plaster'
    });
    addDoor(fBalc, 'top', 70, 30);
    firstRooms.push(fBalc);

    const fBath2 = makeRoom({
      id: 'f_bath2', name: 'Bathroom 2', type: 'bathroom',
      x: 230, y: 340, width: 150, height: 130,
      flooring: 'Vitrified Tile', wallFinish: 'Ceramic Tile'
    });
    addDoor(fBath2, 'top', 75, 30);
    firstRooms.push(fBath2);

    const fLaundry = makeRoom({
      id: 'f_laundry', name: 'Laundry & Store', type: 'laundry',
      x: 380, y: 340, width: 210, height: 130,
      flooring: 'Vitrified Tile', wallFinish: 'Plaster'
    });
    addDoor(fLaundry, 'top', 105, 30);
    firstRooms.push(fLaundry);

    result.first = firstRooms;
  }

  // ── SECOND FLOOR ──────────────────────────────────────────────────────
  if (numFloors >= 3) {
    const secondRooms = [];

    const sBed3 = makeRoom({
      id: 's_bed3', name: 'Bedroom 3', type: 'bedroom',
      x: 90, y: 70, width: 140, height: 150,
      flooring: tier === 'standard' ? 'Vitrified Tile' : 'Hardwood', wallFinish: wf,
      furniture: [{ id: 'f_sbed3_bed', type: 'bed', x: 70, y: 50, rotation: 0 }]
    });
    addDoor(sBed3, 'right', 60, 30);
    addWindow(sBed3, 'top', 70, 40);
    secondRooms.push(sBed3);

    const sSbath = makeRoom({
      id: 's_sbath', name: 'Bathroom 3', type: 'bathroom',
      x: 230, y: 70, width: 150, height: 150,
      flooring: 'Vitrified Tile', wallFinish: 'Ceramic Tile'
    });
    addDoor(sSbath, 'left', 75, 30);
    secondRooms.push(sSbath);

    const sTheater = makeRoom({
      id: 's_theater', name: 'Home Theater', type: 'living',
      x: 380, y: 70, width: 210, height: 150,
      flooring: 'Hardwood', wallFinish: wf,
      furniture: [{ id: 'f_stheater_sofa', type: 'sofa', x: 105, y: 50, rotation: 0 }]
    });
    addDoor(sTheater, 'bottom', 105, 30);
    secondRooms.push(sTheater);

    const sGuest = makeRoom({
      id: 's_guest', name: 'Guest Room', type: 'bedroom',
      x: 90, y: 220, width: 140, height: 120,
      flooring: tier === 'standard' ? 'Vitrified Tile' : 'Hardwood', wallFinish: wf
    });
    addDoor(sGuest, 'right', 60, 30);
    secondRooms.push(sGuest);

    const sStair = makeRoom({
      id: 's_stair', name: 'Staircase', type: 'staircase',
      stairType: staircase,
      x: 230, y: 220, width: 150, height: 120,
      flooring: 'Hardwood', wallFinish: wf
    });
    secondRooms.push(sStair);

    const sTerrace = makeRoom({
      id: 's_terrace', name: 'Open Terrace', type: 'terrace',
      x: 380, y: 220, width: 210, height: 120,
      flooring: 'Epoxy Concrete', wallFinish: 'Plaster'
    });
    addDoor(sTerrace, 'left', 60, 30);
    secondRooms.push(sTerrace);

    result.second = secondRooms;
  }

  // ── DYNAMIC UPPER FLOORS (3rd, 4th, 5th, 6th, etc.) ───────────────────
  const floorConfig = getFloorConfig(numFloors, basementOption);
  floorConfig.floorsList.forEach((floorMeta) => {
    const fid = floorMeta.id;
    if (result[fid]) return; // Ground, First, Second already created

    if (fid === 'terrace') {
      result.terrace = [
        makeRoom({
          id: 't_lounge', name: 'Sky Lounge', type: 'terrace',
          x: 230, y: 70, width: 150, height: 150,
          flooring: tier === 'luxury' ? 'Italian Marble' : 'Vitrified Tile', wallFinish: wf
        }),
        makeRoom({
          id: 't_garden', name: 'Roof Garden', type: 'garden',
          x: 380, y: 70, width: 210, height: 150,
          flooring: 'Epoxy Concrete', wallFinish: 'Plaster'
        }),
        makeRoom({
          id: 't_stair', name: 'Staircase Headroom', type: 'staircase',
          stairType: staircase,
          x: 230, y: 220, width: 150, height: 120,
          flooring: 'Hardwood', wallFinish: wf
        })
      ];
    } else if (fid === 'basement') {
      result.basement = [
        makeRoom({
          id: 'b_cinema', name: 'Media Room', type: 'living',
          x: 90, y: 70, width: 140, height: 150,
          flooring: 'Hardwood', wallFinish: 'Plaster'
        }),
        makeRoom({
          id: 'b_storage', name: 'Storage Room', type: 'store',
          x: 230, y: 70, width: 150, height: 150,
          flooring: 'Vitrified Tile', wallFinish: 'Plaster'
        }),
        makeRoom({
          id: 'b_gym', name: 'Gym / Rec Room', type: 'study',
          x: 380, y: 70, width: 210, height: 150,
          flooring: 'Hardwood', wallFinish: 'Plaster'
        }),
        makeRoom({
          id: 'b_utility', name: 'Utility Room', type: 'utility',
          x: 90, y: 220, width: 140, height: 120,
          flooring: 'Epoxy Concrete', wallFinish: 'Plaster'
        }),
        makeRoom({
          id: 'b_parking', name: 'Basement Parking', type: 'parking',
          x: 230, y: 220, width: 360, height: 250,
          flooring: 'Epoxy Concrete', wallFinish: 'Plaster'
        })
      ];
    } else {
      // Dynamic upper floor (e.g. Third Floor, Fourth Floor, etc.)
      const upperRooms = [];
      const labelName = floorMeta.label;

      const suite = makeRoom({
        id: `${fid}_suite`, name: `${labelName} Suite`, type: 'bedroom',
        x: 90, y: 70, width: 140, height: 150,
        flooring: tier === 'luxury' ? 'Italian Marble' : 'Hardwood', wallFinish: wf,
        furniture: [{ id: `f_${fid}_bed`, type: 'bed', x: 70, y: 50, rotation: 0 }]
      });
      addDoor(suite, 'right', 60, 30);
      addWindow(suite, 'top', 70, 40);
      upperRooms.push(suite);

      const bath = makeRoom({
        id: `${fid}_bath`, name: `${labelName} Bath`, type: 'bathroom',
        x: 230, y: 70, width: 150, height: 150,
        flooring: 'Vitrified Tile', wallFinish: 'Ceramic Tile',
        furniture: [{ id: `f_${fid}_wc`, type: 'toilet', x: 40, y: 40, rotation: 0 }]
      });
      addDoor(bath, 'left', 75, 30);
      addWindow(bath, 'top', 75, 30);
      upperRooms.push(bath);

      const lounge = makeRoom({
        id: `${fid}_lounge`, name: `${labelName} Lounge`, type: 'living',
        x: 380, y: 70, width: 210, height: 150,
        flooring: 'Hardwood', wallFinish: wf,
        furniture: [{ id: `f_${fid}_sofa`, type: 'sofa', x: 105, y: 50, rotation: 0 }]
      });
      addDoor(lounge, 'bottom', 105, 30);
      addWindow(lounge, 'right', 75, 40);
      upperRooms.push(lounge);

      const study = makeRoom({
        id: `${fid}_office`, name: `${labelName} Office`, type: 'study',
        x: 90, y: 220, width: 140, height: 120,
        flooring: tier === 'standard' ? 'Vitrified Tile' : 'Hardwood', wallFinish: wf,
        furniture: [{ id: `f_${fid}_desk`, type: 'table', x: 70, y: 40, rotation: 0 }]
      });
      addDoor(study, 'right', 60, 30);
      upperRooms.push(study);

      const stair = makeRoom({
        id: `${fid}_stair`, name: 'Staircase', type: 'staircase',
        stairType: staircase,
        x: 230, y: 220, width: 150, height: 120,
        flooring: 'Hardwood', wallFinish: wf
      });
      upperRooms.push(stair);

      const balc = makeRoom({
        id: `${fid}_balc`, name: `${labelName} Balcony`, type: 'balcony',
        x: 380, y: 220, width: 210, height: 120,
        flooring: 'Epoxy Concrete', wallFinish: 'Plaster'
      });
      addDoor(balc, 'left', 60, 30);
      upperRooms.push(balc);

      result[fid] = upperRooms;
    }
  });

  return result;
}
