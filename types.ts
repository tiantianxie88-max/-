export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  life: number;
}

export enum SystemMode {
  STANDBY = 'STANDBY',
  WIND = 'WIND', // Open palm
  MAGNETIC = 'MAGNETIC', // Pinch
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandResults {
  multiHandLandmarks: HandLandmark[][];
  multiHandedness: any[];
}

// Declare global types for MediaPipe libraries loaded via CDN
declare global {
  interface Window {
    Camera: any;
    Hands: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}