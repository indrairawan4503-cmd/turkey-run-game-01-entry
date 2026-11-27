// Thanksgiving Heist — shared constants and the autumn palette.
// One job: every number and colour the other modules agree on lives here.
export const TILE = 40;
export const COLS = 24;
export const ROWS = 16;
export const VIEW_W = COLS * TILE; // 960
export const VIEW_H = ROWS * TILE; // 640

export const PALETTE = {
  yardGrass: '#7da95c',
  yardGrassDark: '#6d9a4e',
  yardDirt: '#b98a56',
  houseFloor: '#a97e4f',
  houseFloorDark: '#966e42',
  kitchenFloor: '#e8dcc8',
  kitchenFloorDark: '#d8cbb2',
  wallWood: '#6b4423',
  wallWoodTop: '#8a5a30',
  fence: '#9c6b3c',
  hay: '#e8c33c',
  hayDark: '#c9a227',
  barrel: '#7a4a21',
  ovenBody: '#5c5c66',
  ovenGlow: '#ff7a1a',
  knifeBlade: '#dfe6ee',
  knifeHandle: '#3a2a1a',
  turkeyBody: '#8a5a2b',
  turkeyWing: '#6e4520',
  turkeyHead: '#f2ede2',
  turkeyWattle: '#d92b2b',
  turkeyBeak: '#f2a007',
  turkeyTail: '#b5762e',
  farmerShirt: '#c0392b',
  farmerOveralls: '#2e5fa3',
  farmerHat: '#e8c33c',
  farmerSkin: '#f0c08a',
  dogBody: '#a8642e',
  corn: '#ffd23e',
  cornHusk: '#4e9a3d',
  gateWood: '#7a4a21',
  hudBg: 'rgba(20, 14, 8, 0.82)',
  hudText: '#ffe9b0',
  alertYellow: 'rgba(255, 210, 62, 0.28)',
  alertRed: 'rgba(255, 60, 40, 0.35)',
  heatRed: 'rgba(255, 90, 20, 0.45)',
};

export const PLAYER = {
  radius: 14,
  walkSpeed: 132, // px per second
  runSpeed: 205,
  runNoise: 46, // noise units per second while running
  walkNoise: 9,
  noiseDecay: 30,
  noiseAlertAt: 62, // farmer investigates above this
};

export const FARMER = {
  patrolSpeed: 78,
  chaseSpeed: 168,
  searchSpeed: 105,
  visionRange: 210,
  visionHalfAngle: 0.62, // radians, ~35 degrees
  detectRate: 1.5, // detection meter per second while seen
  detectDecay: 0.55,
  catchRadius: 22,
  loseSightTime: 2.6,
};

export const DOG = {
  patrolSpeed: 118,
  chaseSpeed: 190,
  visionRange: 150,
  visionHalfAngle: 0.85,
  detectRate: 1.9,
  detectDecay: 0.7,
  catchRadius: 20,
};

export const KNIFE = {
  speed: 130,
  radius: 16,
};

export const OVEN = {
  heatRate: 55, // heat units per second standing in a heat zone
  coolRate: 34,
  burnAt: 100,
};

export const GAME = {
  lives: 3,
  keysToEscape: 3,
  keyScore: 500,
  stageScore: 250,
  winTimeBonusBase: 3000,
  winTimeBonusPerSec: 8,
  stealthBonus: 300,
  invulnerableTime: 1.6,
};
