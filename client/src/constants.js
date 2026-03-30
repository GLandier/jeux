export const TILE_SIZE = 48;
export const MAP_COLS = 20;
export const MAP_ROWS = 14;
export const GAME_WIDTH  = TILE_SIZE * MAP_COLS; // 960
export const GAME_HEIGHT = TILE_SIZE * MAP_ROWS; // 672
export const UI_HEIGHT   = 88;
export const SCREEN_HEIGHT = GAME_HEIGHT + UI_HEIGHT; // 760

export const MOVE_DURATION = 130; // ms

export const TILE = {
  FLOOR:    0,
  WALL:     1,
  ARCH:     2,   // passage étroit – feuille seulement
  EXIT:     3,
  WIND_R:   4,
  WIND_L:   5,
  WIND_U:   6,
  WIND_D:   7,
  PLATE:    8,   // dalle de pression
  DOOR:     9,   // porte liée à une dalle
  FIRE:    10,   // feu
  WATER_CH:11,   // canal d'eau
  SPAWN:   12,
};

export const TRANSFORM = {
  NORMAL: 'normal',
  LEAF:   'leaf',
  STONE:  'stone',
  WATER:  'water',
  BIRD:   'bird',
};

// canPass: tiles this form can walk onto
export const TRANSFORM_INFO = {
  normal: {
    name: 'Normal', color: 0x4488FF, darkColor: 0x224488,
    desc: 'Se déplace normalement',
    canPass: new Set([0, 3, 4, 5, 6, 7, 8, 12]),
    windAffected: true, activatesPlate: false, extinguishesFire: false, flies: false,
  },
  leaf: {
    name: 'Feuille', color: 0x44CC44, darkColor: 0x227722,
    desc: 'Passe sous les passages étroits',
    canPass: new Set([0, 2, 3, 4, 5, 6, 7, 8, 12]),
    windAffected: true, activatesPlate: false, extinguishesFire: false, flies: false,
  },
  stone: {
    name: 'Pierre', color: 0x999999, darkColor: 0x555555,
    desc: 'Active les dalles, immunisé au vent',
    canPass: new Set([0, 3, 8, 12]),
    windAffected: false, activatesPlate: true, extinguishesFire: false, flies: false,
  },
  water: {
    name: 'Eau', color: 0x2266EE, darkColor: 0x113388,
    desc: 'Traverse canaux et feu',
    canPass: new Set([0, 3, 4, 5, 6, 7, 8, 10, 11, 12]),
    windAffected: true, activatesPlate: false, extinguishesFire: true, flies: false,
  },
  bird: {
    name: 'Oiseau', color: 0xFFDD00, darkColor: 0xAA8800,
    desc: 'Vole par-dessus les obstacles',
    canPass: new Set([0, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12]),
    windAffected: false, activatesPlate: false, extinguishesFire: false, flies: true,
  },
};

export const COLORS = {
  BG:          0x1A1A2E,
  FLOOR:       0xD4C5A0,
  FLOOR_LINE:  0xBBAA88,
  WALL:        0x2C2C3E,
  WALL_FACE:   0x3D3D55,
  ARCH:        0xFFD700,
  ARCH_BG:     0x997700,
  EXIT:        0x00FF88,
  EXIT_GLOW:   0x009944,
  WIND_BG:     0xAADDFF,
  WIND_ARROW:  0x5599FF,
  PLATE:       0xFF8C00,
  PLATE_ACT:   0xFF4400,
  DOOR:        0x8B3A3A,
  DOOR_OPEN:   0x3A8B3A,
  FIRE:        0xFF4500,
  FIRE2:       0xFFAA00,
  WATER_CH:    0x1E5FA0,
  WATER_CH2:   0x3A9AFF,
  SPAWN_MARK:  0xFFFFAA,
  UI_BG:       0x0D0D1A,
  UI_BORDER:   0x334466,
  TEXT:        0xFFFFFF,
  TEXT_DIM:    0x8899AA,
};
