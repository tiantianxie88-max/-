export const COLORS = {
  BACKGROUND: '#050505',
  PRIMARY: '#F4A300', // Orange/Gold for highlights
  SECONDARY: '#AAAAAA', // Grey for grid
  SKELETON: 'rgba(0, 120, 255, 0.4)',
  CURSOR_MAIN: 'rgba(255, 50, 50, 1)',
  PARTICLE_PALETTE: [
    '#F4A300', // Gold
    '#D35400', // Pumpkin
    '#BA4A00', // Dark Orange
    '#9CA568', // Sage
    '#E59866'  // Pale copper
  ]
};

export const PHYSICS = {
  GRAVITY: 0.15,
  FRICTION: 0.96, // Air resistance
  WIND_FORCE: 2.5, // Repulsion strength
  MAGNET_FORCE: 0.8, // Attraction strength
  SPIRAL_STRENGTH: 0.4, // Tangential force for spiral
  PINCH_THRESHOLD: 0.05, // Normalized distance for pinch detection
};

export const GRID_SIZE = 100;
export const SUB_GRID_SIZE = 20;
export const MAX_PARTICLES_PC = 600;
export const MAX_PARTICLES_MOBILE = 250;