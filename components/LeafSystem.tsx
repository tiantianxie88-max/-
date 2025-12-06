import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Particle, SystemMode, HandResults, HandLandmark } from '../types';
import { COLORS, PHYSICS, MAX_PARTICLES_PC, MAX_PARTICLES_MOBILE } from '../constants';
import SwissOverlay from './SwissOverlay';

const LeafSystem: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const handRef = useRef<HandResults | null>(null);
  const smoothCursorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [fps, setFps] = useState(0);
  const [mode, setMode] = useState<SystemMode>(SystemMode.STANDBY);
  const [particleCount, setParticleCount] = useState(0);

  // Initialize Particles
  const initParticles = useCallback((width: number, height: number) => {
    const isMobile = window.innerWidth < 768;
    const max = isMobile ? MAX_PARTICLES_MOBILE : MAX_PARTICLES_PC;
    const particles: Particle[] = [];
    
    for (let i = 0; i < max; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 2 + 1,
        size: Math.random() * 6 + 4,
        color: COLORS.PARTICLE_PALETTE[Math.floor(Math.random() * COLORS.PARTICLE_PALETTE.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        life: 1.0
      });
    }
    particlesRef.current = particles;
    setParticleCount(max);
  }, []);

  // Setup MediaPipe and Camera
  useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    if (!videoElement || !canvasElement) return;

    const onResults = (results: HandResults) => {
      handRef.current = results;
    };

    const hands = new window.Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(onResults);

    const camera = new window.Camera(videoElement, {
      onFrame: async () => {
        if (videoElement && hands) {
           await hands.send({ image: videoElement });
        }
      },
      width: 1280,
      height: 720,
    });

    camera.start();

    // Resize handler
    const handleResize = () => {
        if (canvasElement) {
            canvasElement.width = window.innerWidth;
            canvasElement.height = window.innerHeight;
            initParticles(window.innerWidth, window.innerHeight);
        }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial resize

    return () => {
      // Cleanup
      window.removeEventListener('resize', handleResize);
      // Note: MediaPipe camera stop isn't always clean in React strict mode re-renders,
      // but essential to try.
      try { camera.stop(); } catch(e) {}
    };
  }, [initParticles]);

  // Main Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    
    const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no alpha in background
    if (!ctx) return;

    let lastTime = performance.now();
    let frameCount = 0;
    let accumulatedTime = 0;

    const render = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      // FPS Calculation (update every 500ms)
      frameCount++;
      accumulatedTime += deltaTime;
      if (accumulatedTime > 500) {
        setFps(Math.round((frameCount * 1000) / accumulatedTime));
        frameCount = 0;
        accumulatedTime = 0;
      }

      // Clear Canvas
      ctx.fillStyle = COLORS.BACKGROUND;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;
      const particles = particlesRef.current;
      const handData = handRef.current;

      let currentMode = SystemMode.STANDBY;
      let targetX = -1000;
      let targetY = -1000;
      let pinchStrength = 0; // 0 to 1
      let repulsionPoints: {x: number, y: number}[] = [];

      // 1. Process Hand Data & Coordinate Mapping
      if (handData && handData.multiHandLandmarks && handData.multiHandLandmarks.length > 0) {
        const landmarks = handData.multiHandLandmarks[0];
        
        // Custom Mapping: MediaPipe (0-1) -> Video Ratio -> Object-Fit Cover -> Screen Pixels
        const videoRatio = 1280 / 720;
        const screenRatio = w / h;
        let scale, offsetX, offsetY;

        if (screenRatio > videoRatio) {
           scale = w; // Width matches
           const scaledHeight = w / videoRatio;
           offsetX = 0;
           offsetY = (h - scaledHeight) / 2;
           // Wait, actually object-fit cover means the SMALLER dimension is scaled up
           // Correct logic:
           // If screen is wider than video, video width = screen width. Video height < screen height? No.
           // Object fit cover: The image keeps its aspect ratio and fills the given dimension.
           // If screenRatio > videoRatio: Screen is "panoramic". Video must map width to screen width.
           // Height will be cropped.
           // Scale = w / videoWidth.
           // Actually, let's look at it simply: 
           // We map 0..1 to the rendered video rect.
        }
        
        // Robust "Object-Fit: Cover" mapping logic
        const scaleX = w;
        const scaleY = h;
        // The camera stream is usually 16:9 or 4:3. Let's assume input is normalized 0-1.
        // We mirror X because webcam is mirrored.
        
        const mapCoord = (lm: HandLandmark) => {
            // Horizontal flip for mirror effect
            const xNorm = 1 - lm.x; 
            const yNorm = lm.y;
            
            // Calculate rendering dimensions of video element to match object-fit: cover
            const videoAspect = 1280 / 720;
            const screenAspect = w / h;
            
            let drawW, drawH, startX, startY;
            
            if (screenAspect > videoAspect) {
                // Screen is wider. Video width fits screen width, height is cropped.
                drawW = w;
                drawH = w / videoAspect;
                startX = 0;
                startY = (h - drawH) / 2;
            } else {
                // Screen is taller. Video height fits screen height, width is cropped.
                drawH = h;
                drawW = h * videoAspect;
                startX = (w - drawW) / 2;
                startY = 0;
            }
            
            return {
                x: startX + xNorm * drawW,
                y: startY + yNorm * drawH
            };
        };

        // Get key points
        const indexTip = mapCoord(landmarks[8]);
        const thumbTip = mapCoord(landmarks[4]);
        const wrist = mapCoord(landmarks[0]);
        
        // Calculate Pinch (Index to Thumb)
        // We use normalized coords for distance check to be resolution independent
        const distNormSq = Math.pow((landmarks[8].x - landmarks[4].x), 2) + Math.pow((landmarks[8].y - landmarks[4].y), 2);
        
        // Determine Mode
        if (distNormSq < Math.pow(PHYSICS.PINCH_THRESHOLD, 2)) {
            currentMode = SystemMode.MAGNETIC;
            pinchStrength = 1;
        } else {
            currentMode = SystemMode.WIND;
        }
        setMode(currentMode);

        // Smooth Cursor (Lerp)
        smoothCursorRef.current.x += (indexTip.x - smoothCursorRef.current.x) * 0.2;
        smoothCursorRef.current.y += (indexTip.y - smoothCursorRef.current.y) * 0.2;
        
        targetX = smoothCursorRef.current.x;
        targetY = smoothCursorRef.current.y;

        // Collect Repulsion Points (Fingertips) for Wind Mode
        if (currentMode === SystemMode.WIND) {
             [4, 8, 12, 16, 20].forEach(idx => {
                 repulsionPoints.push(mapCoord(landmarks[idx]));
             });
        }

        // --- Render Skeleton & Hand ---
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Draw Skeleton Lines
        ctx.strokeStyle = COLORS.SKELETON;
        ctx.lineWidth = 2;
        // Helper to draw lines
        const drawLine = (startIdx: number, endIdx: number) => {
            const s = mapCoord(landmarks[startIdx]);
            const e = mapCoord(landmarks[endIdx]);
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(e.x, e.y);
            ctx.stroke();
        };

        // MediaPipe connections
        const connections = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],[0,17],[17,18],[18,19],[19,20],[5,9],[9,13],[13,17]];
        ctx.beginPath();
        connections.forEach(([s, e]) => {
             const start = mapCoord(landmarks[s]);
             const end = mapCoord(landmarks[e]);
             ctx.moveTo(start.x, start.y);
             ctx.lineTo(end.x, end.y);
        });
        ctx.stroke();

        // Draw Fingertips (small dots)
        ctx.fillStyle = COLORS.CURSOR_MAIN;
        [4, 12, 16, 20].forEach(idx => {
            const p = mapCoord(landmarks[idx]);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw Main Cursor (Index Finger) - Hollow Circle
        ctx.strokeStyle = COLORS.PRIMARY;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(targetX, targetY, 25, 0, Math.PI * 2);
        ctx.stroke();
        
        // Center dot for precision
        ctx.fillStyle = COLORS.PRIMARY;
        ctx.beginPath();
        ctx.arc(targetX, targetY, 4, 0, Math.PI * 2);
        ctx.fill();

      } else {
        setMode(SystemMode.STANDBY);
        // Reset cursor to center slowly or offscreen
      }

      // 2. Physics Engine Update & Render
      // Optimization: Batch drawing by color would be faster, but per-particle transforms (rotation) 
      // make batching strictly by color hard without WebGL. We Stick to good 2D Canvas practices.
      
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Basic Movement
        p.vy += PHYSICS.GRAVITY;
        p.vx *= PHYSICS.FRICTION;
        p.vy *= PHYSICS.FRICTION;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Boundaries - Wrap around
        if (p.y > h + 50) p.y = -50;
        if (p.x > w + 50) p.x = -50;
        if (p.x < -50) p.x = w + 50;

        // Interaction
        if (currentMode === SystemMode.WIND) {
            // Repel from all fingertips
            for (const rp of repulsionPoints) {
                const dx = p.x - rp.x;
                const dy = p.y - rp.y;
                const distSq = dx * dx + dy * dy;
                const range = 150; // Interaction radius
                
                if (distSq < range * range) {
                    const dist = Math.sqrt(distSq);
                    const force = (range - dist) / range; // 0 to 1
                    const angle = Math.atan2(dy, dx);
                    
                    p.vx += Math.cos(angle) * force * PHYSICS.WIND_FORCE;
                    p.vy += Math.sin(angle) * force * PHYSICS.WIND_FORCE;
                }
            }
        } else if (currentMode === SystemMode.MAGNETIC) {
            // Attract to index finger with spiral
            const dx = targetX - p.x;
            const dy = targetY - p.y;
            const distSq = dx * dx + dy * dy;
            const range = 400; 

            if (distSq < range * range) {
                const angle = Math.atan2(dy, dx);
                const dist = Math.sqrt(distSq);
                
                // Attraction force
                const attrForce = PHYSICS.MAGNET_FORCE; 
                p.vx += Math.cos(angle) * attrForce;
                p.vy += Math.sin(angle) * attrForce;

                // Spiral (Tangential) force
                // Perpendicular to angle
                p.vx -= Math.sin(angle) * PHYSICS.SPIRAL_STRENGTH * (range/dist);
                p.vy += Math.cos(angle) * PHYSICS.SPIRAL_STRENGTH * (range/dist);
            }
        }

        // Render Particle
        // Frustum culling: only draw if on screen
        if (p.x > -20 && p.x < w + 20 && p.y > -20 && p.y < h + 20) {
            ctx.save();
            ctx.translate(p.x | 0, p.y | 0); // Bitwise floor for performance
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            // Draw a leaf shape (simple rotated square or ellipse)
            // A diamond shape looks like a simple leaf
            ctx.beginPath();
            ctx.moveTo(0, -p.size);
            ctx.lineTo(p.size/2, 0);
            ctx.lineTo(0, p.size);
            ctx.lineTo(-p.size/2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
      }

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [initParticles]); // Deps intentionally minimal to avoid loop restarts

  return (
    <div className="relative w-full h-screen bg-[#050505]">
      {/* Hidden Video for MediaPipe */}
      <video
        ref={videoRef}
        className="absolute top-0 left-0 opacity-0 pointer-events-none"
        playsInline
        muted
        style={{ width: 0, height: 0 }} // Hidden but active
      />
      
      {/* Main Rendering Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full object-cover"
      />
      
      {/* Swiss UI Overlay */}
      <SwissOverlay 
        fps={fps} 
        particleCount={particleCount} 
        mode={mode}
        windVelocity={mode === SystemMode.WIND ? (Math.random() * 5 + 10) : (Math.random() * 2)} // Mock wind data based on mode
      />
    </div>
  );
};

export default LeafSystem;