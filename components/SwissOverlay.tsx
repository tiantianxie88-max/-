import React from 'react';
import { SystemMode } from '../types';
import { COLORS } from '../constants';

interface SwissOverlayProps {
  fps: number;
  particleCount: number;
  mode: SystemMode;
  windVelocity: number;
}

const SwissOverlay: React.FC<SwissOverlayProps> = ({ fps, particleCount, mode, windVelocity }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 select-none overflow-hidden">
      {/* Dynamic Background Grid */}
      <div 
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `
            linear-gradient(${COLORS.SECONDARY} 1px, transparent 1px),
            linear-gradient(90deg, ${COLORS.SECONDARY} 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
          backgroundPosition: 'center center'
        }}
      >
        {/* Sub-grid dots */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(${COLORS.SECONDARY} 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
            backgroundPosition: 'center center'
          }}
        />
      </div>

      {/* Decorative Crosshairs */}
      <div className="absolute top-8 left-8 w-4 h-4 border-l border-t border-white opacity-50"></div>
      <div className="absolute top-8 right-8 w-4 h-4 border-r border-t border-white opacity-50"></div>
      <div className="absolute bottom-8 left-8 w-4 h-4 border-l border-b border-white opacity-50"></div>
      <div className="absolute bottom-8 right-8 w-4 h-4 border-r border-b border-white opacity-50"></div>

      {/* Top Left: Title Block */}
      <div className="absolute top-8 left-12">
        <h1 className="text-4xl font-bold tracking-tight text-white leading-none">
          DESIGN BY
        </h1>
        <h2 className="text-xl font-normal text-white mt-1 opacity-90">
          ©Pang's Ai Hub
        </h2>
        <h3 className="text-xs font-bold tracking-[0.2em] text-[#F4A300] mt-4">
          GESTURE INTERACTION SYSTEM
        </h3>
      </div>

      {/* Bottom Left: Data Block */}
      <div className="absolute bottom-8 left-12 font-mono text-sm space-y-1">
        <div className="flex items-center gap-4">
          <span className="text-gray-400">FPS</span>
          <span className="text-white font-bold">{fps}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400">ACTIVE NODES</span>
          <span className="text-white font-bold">{particleCount}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400">WIND VEL</span>
          <span className="text-white font-bold">{windVelocity.toFixed(2)} m/s</span>
        </div>
      </div>

      {/* Bottom Right: Status Block */}
      <div className="absolute bottom-8 right-12 text-right">
        <div className="flex flex-col items-end">
          <span className="text-xs font-bold tracking-[0.1em] text-gray-400 mb-1">SYSTEM STATUS</span>
          <div className="flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${mode !== SystemMode.STANDBY ? 'bg-[#F4A300] animate-pulse' : 'bg-gray-600'}`}></div>
             <span className="text-2xl font-bold text-white tracking-wide">{mode}</span>
          </div>
          {mode === SystemMode.MAGNETIC && (
             <span className="text-xs text-[#F4A300] mt-1 tracking-widest uppercase">Gravitational Field Active</span>
          )}
          {mode === SystemMode.WIND && (
             <span className="text-xs text-white opacity-60 mt-1 tracking-widest uppercase">Repulsion Field Active</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SwissOverlay;