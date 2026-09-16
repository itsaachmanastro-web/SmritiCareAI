import React, { useEffect, useRef } from 'react';

/**
 * CinematicNeuralCanvas
 * 
 * 100% Programmatic, zero-dependency HTML5 2D Canvas recreation of the reference
 * futuristic AI neural-network environment:
 * 
 * - Dark blue-black cinematic atmosphere with subtle cyan/amber nebula haze & vignette.
 * - Horizontally stretched, organic, asymmetric neural network behind hero content.
 * - Glowing cyan/turquoise nodes with multi-tiered bloom and soft breathing.
 * - Several prominent warm white/golden accent hubs with brilliant golden corona blooms.
 * - Thin, luminous cyan and amber connections forming irregular triangular/polygonal facets.
 * - Sinuous, glowing golden energy trails that flow through the network and flare nodes.
 * - Floating futuristic geometric wireframe elements (3D rotating icosahedron, hollow triangles,
 *   outlined diamonds/squares, incomplete glowing circular arcs, angular shards).
 * - Atmospheric floating dust particles across 3 depth planes with subtle bokeh.
 * - Undulating digital neural terrain wave mesh along the bottom horizon.
 * - 60 FPS performance, devicePixelRatio scaling, visibility-based sleep, and reduced-motion support.
 */

export default function CinematicNeuralCanvas({ isPaused = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = null;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let isTabVisible = true;
    let lastTime = performance.now();

    // Respect system prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Responsive element counts based on viewport
    let isMobile = false;

    // Simulation Data Structures
    let primaryNodes = [];
    let secondaryNodes = [];
    let allNodes = [];
    let connections = [];
    let energyTrails = [];
    let geometricElements = [];
    let particles = [];
    let bottomWavePoints = [];

    // -------------------------------------------------------------
    // 3D Polyhedron Math (Wireframe Icosahedron for futuristic vibe)
    // -------------------------------------------------------------
    const phi = (1 + Math.sqrt(5)) / 2;
    const baseIcoVerts = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ].map(([x, y, z]) => {
      const len = Math.hypot(x, y, z);
      return [x / len, y / len, z / len];
    });

    const icoEdges = [
      [0, 11], [0, 5], [0, 1], [0, 7], [0, 10],
      [1, 5], [1, 9], [1, 8], [1, 7],
      [2, 11], [2, 4], [2, 3], [2, 6], [2, 10],
      [3, 4], [3, 9], [3, 8], [3, 6],
      [4, 5], [4, 9], [4, 11],
      [5, 9], [5, 11],
      [6, 7], [6, 8], [6, 10],
      [7, 8], [7, 10],
      [8, 9], [10, 11]
    ];

    // -------------------------------------------------------------
    // Initialize Simulation
    // -------------------------------------------------------------
    function initScene() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      isMobile = width < 768;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const centerX = width * 0.5;
      const centerY = height * (isMobile ? 0.38 : 0.44);
      const spanX = width * (isMobile ? 0.42 : 0.36);
      const spanY = height * (isMobile ? 0.20 : 0.22);

      // 1. NEURAL NODES
      // Two standout major golden hubs as seen in the reference image
      const goldenHubs = [
        {
          id: 'hub-1',
          bx: centerX - spanX * 0.48,
          by: centerY - spanY * 0.08,
          radius: isMobile ? 6 : 8.5,
          type: 'gold-hub',
          glowRadius: isMobile ? 32 : 54
        },
        {
          id: 'hub-2',
          bx: centerX + spanX * 0.45,
          by: centerY + spanY * 0.12,
          radius: isMobile ? 6 : 8.5,
          type: 'gold-hub',
          glowRadius: isMobile ? 32 : 54
        }
      ];

      // 2 Satellite golden nodes nearby
      const goldenSatellites = [
        {
          id: 'gold-sat-1',
          bx: centerX - spanX * 0.28,
          by: centerY + spanY * 0.45,
          radius: 4.5,
          type: 'gold-sat',
          glowRadius: 24
        },
        {
          id: 'gold-sat-2',
          bx: centerX + spanX * 0.22,
          by: centerY - spanY * 0.40,
          radius: 4.5,
          type: 'gold-sat',
          glowRadius: 24
        }
      ];

      // Primary Cyan Nodes
      const primaryCount = isMobile ? 12 : 24;
      const primaryCyanNodes = [];
      for (let i = 0; i < primaryCount; i++) {
        // Asymmetric organic distribution across central horizontal band
        const angle = (i / primaryCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const distNorm = Math.pow(Math.random(), 0.7);
        const px = centerX + Math.cos(angle) * spanX * distNorm + (Math.random() - 0.5) * 60;
        const py = centerY + Math.sin(angle) * spanY * distNorm * 0.85 + (Math.random() - 0.5) * 40;

        primaryCyanNodes.push({
          id: `prim-${i}`,
          bx: px,
          by: py,
          radius: Math.random() * 2.5 + 3.5,
          type: 'cyan-primary',
          glowRadius: Math.random() * 10 + 16
        });
      }

      // Secondary Small Junction Nodes
      const secondaryCount = isMobile ? 18 : 38;
      const secondaryCyanNodes = [];
      for (let i = 0; i < secondaryCount; i++) {
        const px = centerX + (Math.random() - 0.5) * spanX * 2.1;
        const py = centerY + (Math.random() - 0.5) * spanY * 2.2;
        secondaryCyanNodes.push({
          id: `sec-${i}`,
          bx: px,
          by: py,
          radius: Math.random() * 1.5 + 1.8,
          type: 'cyan-sec',
          glowRadius: Math.random() * 6 + 8
        });
      }

      allNodes = [...goldenHubs, ...goldenSatellites, ...primaryCyanNodes, ...secondaryCyanNodes].map((node, idx) => ({
        ...node,
        x: node.bx,
        y: node.by,
        vxPhase: Math.random() * Math.PI * 2,
        vyPhase: Math.random() * Math.PI * 2,
        vAmpX: (Math.random() * 8 + 5) * (isMobile ? 0.6 : 1),
        vAmpY: (Math.random() * 7 + 4) * (isMobile ? 0.6 : 1),
        vSpeed: Math.random() * 0.4 + 0.3,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 1.5 + 1.0,
        flare: 1.0
      }));

      // 2. NETWORK CONNECTIONS (Organic Triangles / Polygons)
      connections = [];
      const maxConnectDist = isMobile ? 115 : 155;
      for (let i = 0; i < allNodes.length; i++) {
        let connectsForNode = 0;
        for (let j = i + 1; j < allNodes.length; j++) {
          const dx = allNodes[i].bx - allNodes[j].bx;
          const dy = allNodes[i].by - allNodes[j].by;
          const dist = Math.hypot(dx, dy);

          if (dist < maxConnectDist && connectsForNode < 4) {
            connectsForNode++;
            const hasGold = allNodes[i].type.startsWith('gold') || allNodes[j].type.startsWith('gold');
            connections.push({
              from: i,
              to: j,
              distMax: maxConnectDist,
              isGold: hasGold,
              weight: hasGold ? 1.4 : Math.random() * 0.6 + 0.8
            });
          }
        }
      }

      // 3. FLOWING GOLDEN ENERGY TRAILS (2 to 4 sinuous paths threading the network)
      const hub1 = allNodes[0];
      const hub2 = allNodes[1];
      energyTrails = [
        {
          // Trail A: Sweeping primary ribbon through both golden hubs
          points: [
            { x: -width * 0.05, y: centerY - spanY * 0.4 },
            { x: width * 0.15, y: centerY - spanY * 0.2 },
            { x: hub1.bx - 40, y: hub1.by - 25 },
            { x: hub1.bx, y: hub1.by },
            { x: centerX - spanX * 0.15, y: centerY + spanY * 0.15 },
            { x: centerX + spanX * 0.1, y: centerY - spanY * 0.05 },
            { x: hub2.bx, y: hub2.by },
            { x: hub2.bx + 55, y: hub2.by + 30 },
            { x: width * 0.88, y: centerY - spanY * 0.15 },
            { x: width * 1.08, y: centerY + spanY * 0.25 }
          ],
          speed: 0.11,
          progress: 0.0,
          tailLength: 0.38,
          coreColor: 'rgba(255, 255, 250, 0.95)',
          glowColor: 'rgba(251, 191, 36, 0.45)',
          width: 2.2
        },
        {
          // Trail B: Secondary graceful wave curving across lower network
          points: [
            { x: -width * 0.08, y: centerY + spanY * 0.6 },
            { x: width * 0.22, y: centerY + spanY * 0.4 },
            { x: centerX - spanX * 0.2, y: centerY + spanY * 0.3 },
            { x: centerX + spanX * 0.15, y: centerY + spanY * 0.45 },
            { x: hub2.bx - 10, y: hub2.by + 40 },
            { x: width * 0.85, y: centerY + spanY * 0.2 },
            { x: width * 1.06, y: centerY + spanY * 0.05 }
          ],
          speed: 0.08,
          progress: 0.5,
          tailLength: 0.32,
          coreColor: 'rgba(255, 250, 235, 0.9)',
          glowColor: 'rgba(245, 158, 11, 0.35)',
          width: 1.8
        }
      ];

      // Pre-sample spline points for buttery smooth 60fps evaluation
      energyTrails.forEach(trail => {
        trail.samples = generateSplineSamples(trail.points, 180);
      });

      // 4. FLOATING FUTURISTIC GEOMETRIC ELEMENTS (Wireframes)
      const geoCount = isMobile ? 14 : 32;
      geometricElements = [];

      // A few specifically composed elements matching the reference image layout:
      // (1) Large hollow triangle in top-left
      geometricElements.push({
        type: 'triangle-3d',
        x: width * 0.16,
        y: height * 0.15,
        size: isMobile ? 32 : 56,
        rot: 0.2,
        rotSpeed: 0.003,
        driftSpeedX: 0.1,
        driftSpeedY: 0.05,
        color: 'rgba(34, 211, 238, 0.65)'
      });

      // (2) 3D Wireframe Icosahedron in top-right
      geometricElements.push({
        type: 'ico-3d',
        x: width * (isMobile ? 0.78 : 0.72),
        y: height * 0.16,
        size: isMobile ? 22 : 36,
        rx: 0.2,
        ry: 0.4,
        rxSpeed: 0.005,
        rySpeed: 0.008,
        driftSpeedX: -0.08,
        driftSpeedY: 0.04,
        color: 'rgba(56, 189, 248, 0.7)'
      });

      // (3) Incomplete Glowing Circular Arc in upper-right
      geometricElements.push({
        type: 'arc-ring',
        x: width * 0.90,
        y: height * 0.24,
        size: isMobile ? 28 : 46,
        rot: -0.5,
        rotSpeed: 0.004,
        color: 'rgba(251, 191, 36, 0.7)'
      });

      // (4) Outlined Square / Diamond in upper-right
      geometricElements.push({
        type: 'diamond',
        x: width * 0.80,
        y: height * 0.20,
        size: isMobile ? 14 : 22,
        rot: 0.3,
        rotSpeed: -0.004,
        color: 'rgba(34, 211, 238, 0.55)'
      });

      // (5) Large inverted wireframe triangle in lower right
      geometricElements.push({
        type: 'triangle-3d',
        x: width * 0.92,
        y: height * 0.66,
        size: isMobile ? 26 : 44,
        rot: 3.1,
        rotSpeed: 0.002,
        color: 'rgba(34, 211, 238, 0.6)'
      });

      // (6) Small wireframe icosahedron in lower left
      geometricElements.push({
        type: 'ico-3d',
        x: width * 0.19,
        y: height * 0.70,
        size: isMobile ? 15 : 22,
        rx: 0.5,
        ry: 0.2,
        rxSpeed: -0.006,
        rySpeed: 0.007,
        color: 'rgba(56, 189, 248, 0.55)'
      });

      // Fill remaining with scattered asymmetrical geometric fragments
      const shapeTypes = ['triangle', 'diamond', 'square', 'shard', 'arc-ring'];
      for (let i = geometricElements.length; i < geoCount; i++) {
        const type = shapeTypes[i % shapeTypes.length];
        const isGold = i % 6 === 0;
        const edgeX = Math.random() > 0.5 ? Math.random() * width * 0.35 : width * 0.65 + Math.random() * width * 0.35;
        const edgeY = Math.random() * height;

        geometricElements.push({
          type,
          x: edgeX,
          y: edgeY,
          size: Math.random() * 16 + 10,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.008,
          driftSpeedX: (Math.random() - 0.5) * 0.15,
          driftSpeedY: (Math.random() - 0.5) * 0.15,
          color: isGold ? 'rgba(251, 191, 36, 0.5)' : 'rgba(34, 211, 238, 0.45)'
        });
      }

      // 5. ATMOSPHERIC FLOATING PARTICLES (Bokeh & Multi-depth Dust)
      const partCount = isMobile ? 45 : 120;
      particles = [];
      for (let i = 0; i < partCount; i++) {
        const depth = Math.random(); // 0 (far/dim) to 1 (near/bright)
        const isGold = Math.random() < 0.15;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * (0.2 + depth * 0.3),
          vy: -(Math.random() * 0.35 + 0.1) * (0.3 + depth * 0.7),
          r: (Math.random() * 1.8 + 0.6) * (0.6 + depth * 0.8),
          baseAlpha: Math.random() * 0.4 + (depth * 0.4),
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 1.5 + 0.5,
          color: isGold ? '251, 191, 36' : '34, 211, 238',
          depth
        });
      }

      // 6. BOTTOM UNDULATING NEURAL TERRAIN MESH
      const waveCols = isMobile ? 36 : 64;
      bottomWavePoints = [];
      const waveRows = 3;
      for (let row = 0; row < waveRows; row++) {
        const rowPoints = [];
        const baseRowY = height * (0.80 + row * 0.07);
        for (let col = 0; col <= waveCols; col++) {
          rowPoints.push({
            x: (col / waveCols) * (width + 40) - 20,
            baseY: baseRowY,
            phase: col * 0.22 + row * 0.8,
            amp: (14 + row * 6) * (isMobile ? 0.6 : 1.0),
            radius: Math.random() * 0.6 + 0.7
          });
        }
        bottomWavePoints.push(rowPoints);
      }
    }

    // -------------------------------------------------------------
    // Parametric Catmull-Rom Spline Sampling for Energy Trails
    // -------------------------------------------------------------
    function generateSplineSamples(pts, numSamples) {
      const samples = [];
      for (let i = 0; i < numSamples; i++) {
        const t = i / (numSamples - 1);
        const p = getCatmullRomPoint(pts, t);
        samples.push(p);
      }
      return samples;
    }

    function getCatmullRomPoint(pts, t) {
      const pCount = pts.length - 1;
      const f = t * pCount;
      const i0 = Math.floor(f);
      const u = f - i0;

      const p1 = pts[Math.min(i0, pCount)];
      const p2 = pts[Math.min(i0 + 1, pCount)];
      const p0 = pts[Math.max(i0 - 1, 0)];
      const p3 = pts[Math.min(i0 + 2, pCount)];

      const u2 = u * u;
      const u3 = u2 * u;

      return {
        x: 0.5 * ((2 * p1.x) +
          (-p0.x + p2.x) * u +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3),
        y: 0.5 * ((2 * p1.y) +
          (-p0.y + p2.y) * u +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3)
      };
    }

    // -------------------------------------------------------------
    // Main Render Loop (Target: 60 FPS)
    // -------------------------------------------------------------
    function render(currentTime) {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;
      const tSec = currentTime * 0.001;

      // 1. CLEAR & CINEMATIC BASE BACKGROUND
      ctx.clearRect(0, 0, width, height);

      // Deep dark navy / obsidian radial base gradient
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.46,
        width * 0.05,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75
      );
      bgGrad.addColorStop(0, '#040f22');    // Deep midnight sapphire core
      bgGrad.addColorStop(0.45, '#020914'); // Dark blue-black
      bgGrad.addColorStop(1, '#010307');    // Rich obsidian edge
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Atmospheric Cyan & Amber Nebula Glow Patches
      // Nebula Patch 1: Cyan mid-left
      const neb1 = ctx.createRadialGradient(
        width * 0.32, height * 0.42, 0,
        width * 0.32, height * 0.42, width * (isMobile ? 0.35 : 0.28)
      );
      neb1.addColorStop(0, 'rgba(6, 182, 212, 0.10)');
      neb1.addColorStop(0.5, 'rgba(14, 165, 233, 0.04)');
      neb1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = neb1;
      ctx.fillRect(0, 0, width, height);

      // Nebula Patch 2: Soft warm amber behind right golden hub
      const neb2 = ctx.createRadialGradient(
        width * 0.68, height * 0.48, 0,
        width * 0.68, height * 0.48, width * (isMobile ? 0.28 : 0.22)
      );
      neb2.addColorStop(0, 'rgba(245, 158, 11, 0.07)');
      neb2.addColorStop(0.6, 'rgba(217, 119, 6, 0.02)');
      neb2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = neb2;
      ctx.fillRect(0, 0, width, height);

      // 2. BOTTOM UNDULATING PARTICULATE TERRAIN
      ctx.save();
      for (let r = 0; r < bottomWavePoints.length; r++) {
        const pts = bottomWavePoints[r];
        const rowAlpha = (0.25 - r * 0.05);

        ctx.beginPath();
        for (let c = 0; c < pts.length; c++) {
          const pt = pts[c];
          const y = pt.baseY + Math.sin(pt.phase + tSec * 0.6) * pt.amp + Math.cos(c * 0.15 - tSec * 0.3) * 6;
          pt.curY = y;

          if (c === 0) ctx.moveTo(pt.x, y);
          else ctx.lineTo(pt.x, y);
        }
        ctx.strokeStyle = `rgba(34, 211, 238, ${rowAlpha * 0.6})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Draw particulate points along wave
        for (let c = 0; c < pts.length; c++) {
          if (c % 2 === 0) {
            const pt = pts[c];
            ctx.beginPath();
            ctx.fillStyle = `rgba(56, 189, 248, ${rowAlpha * 1.5})`;
            ctx.arc(pt.x, pt.curY, pt.radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();

      // 3. ATMOSPHERIC FLOATING PARTICLES (Deep Bokeh)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!prefersReducedMotion && !isPaused) {
          p.x += p.vx * dt * 30;
          p.y += p.vy * dt * 30;
          p.pulsePhase += p.pulseSpeed * dt;

          if (p.y < -10) p.y = height + 10;
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
        }

        const alpha = p.baseAlpha * (0.6 + 0.4 * Math.sin(p.pulsePhase));
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.color}, ${alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. UPDATE NEURAL NODE POSITIONS & FLARING
      for (let i = 0; i < allNodes.length; i++) {
        const n = allNodes[i];
        if (!prefersReducedMotion && !isPaused) {
          n.x = n.bx + Math.sin(tSec * n.vSpeed + n.vxPhase) * n.vAmpX;
          n.y = n.by + Math.cos(tSec * n.vSpeed + n.vyPhase) * n.vAmpY;
          n.pulsePhase += n.pulseSpeed * dt;
        } else {
          n.x = n.bx;
          n.y = n.by;
        }
        // Decay flaring smoothly back to 1.0
        n.flare = Math.max(1.0, n.flare - dt * 1.2);
      }

      // 5. UPDATE & DRAW FLOWING ENERGY TRAILS
      for (let eIdx = 0; eIdx < energyTrails.length; eIdx++) {
        const trail = energyTrails[eIdx];
        if (!prefersReducedMotion && !isPaused) {
          trail.progress = (trail.progress + trail.speed * dt) % 1.0;
        }

        const samples = trail.samples;
        if (!samples || samples.length < 2) continue;

        const totalSamples = samples.length;
        const headIdx = Math.floor(trail.progress * (totalSamples - 1));
        const headPt = samples[headIdx];

        // Flare nearby neural nodes when the energy head passes
        for (let ni = 0; ni < allNodes.length; ni++) {
          const n = allNodes[ni];
          const distToHead = Math.hypot(n.x - headPt.x, n.y - headPt.y);
          if (distToHead < 65) {
            const boost = (1 - distToHead / 65) * 0.85;
            n.flare = Math.max(n.flare, 1.0 + boost);
          }
        }

        // Draw sinuous fading luminous ribbon
        const tailSteps = Math.floor(trail.tailLength * totalSamples);
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Outer ambient glow ribbon
        ctx.beginPath();
        for (let s = 0; s < tailSteps; s++) {
          let sIdx = headIdx - s;
          if (sIdx < 0) sIdx += totalSamples;
          const pt = samples[sIdx];
          if (s === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = trail.glowColor;
        ctx.lineWidth = isMobile ? 6 : 10;
        ctx.stroke();

        // Inner radiant core ribbon
        ctx.beginPath();
        for (let s = 0; s < tailSteps; s++) {
          let sIdx = headIdx - s;
          if (sIdx < 0) sIdx += totalSamples;
          const pt = samples[sIdx];
          if (s === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = trail.coreColor;
        ctx.lineWidth = trail.width;
        ctx.stroke();

        // Glowing energy head particle
        const headGlow = ctx.createRadialGradient(headPt.x, headPt.y, 0, headPt.x, headPt.y, isMobile ? 14 : 24);
        headGlow.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        headGlow.addColorStop(0.3, 'rgba(251, 191, 36, 0.85)');
        headGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = headGlow;
        ctx.beginPath();
        ctx.arc(headPt.x, headPt.y, isMobile ? 14 : 24, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 6. DRAW NEURAL NETWORK CONNECTIONS
      ctx.save();
      for (let c = 0; c < connections.length; c++) {
        const conn = connections[c];
        const nA = allNodes[conn.from];
        const nB = allNodes[conn.to];
        const dx = nA.x - nB.x;
        const dy = nA.y - nB.y;
        const dist = Math.hypot(dx, dy);

        if (dist < conn.distMax) {
          const proximityAlpha = Math.pow(1 - dist / conn.distMax, 1.2);
          const flareFactor = Math.max(nA.flare, nB.flare);

          if (conn.isGold) {
            // Luminous golden connection line
            const alpha = Math.min(1.0, proximityAlpha * 0.75 * flareFactor);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(251, 191, 36, ${alpha})`;
            ctx.lineWidth = conn.weight * 1.2;
            ctx.moveTo(nA.x, nA.y);
            ctx.lineTo(nB.x, nB.y);
            ctx.stroke();
          } else {
            // Luminous cyan connection line
            const alpha = Math.min(1.0, proximityAlpha * 0.45 * flareFactor);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
            ctx.lineWidth = conn.weight;
            ctx.moveTo(nA.x, nA.y);
            ctx.lineTo(nB.x, nB.y);
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // 7. DRAW NEURAL NODES
      for (let i = 0; i < allNodes.length; i++) {
        const n = allNodes[i];
        const breath = 0.85 + 0.15 * Math.sin(n.pulsePhase);
        const curR = n.radius * breath * n.flare;

        if (n.type === 'gold-hub') {
          // STANDOUT MAJOR GOLDEN ACCENT HUB (Blinding warm white center + rich amber bloom)
          const bloomR = n.glowRadius * breath * n.flare;
          const bloom = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, bloomR);
          bloom.addColorStop(0, 'rgba(255, 255, 250, 1.0)');
          bloom.addColorStop(0.2, 'rgba(254, 240, 138, 0.85)');
          bloom.addColorStop(0.45, 'rgba(251, 191, 36, 0.45)');
          bloom.addColorStop(0.8, 'rgba(245, 158, 11, 0.15)');
          bloom.addColorStop(1, 'rgba(217, 119, 6, 0)');

          ctx.fillStyle = bloom;
          ctx.beginPath();
          ctx.arc(n.x, n.y, bloomR, 0, Math.PI * 2);
          ctx.fill();

          // Warm white center core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(n.x, n.y, curR * 0.95, 0, Math.PI * 2);
          ctx.fill();

        } else if (n.type === 'gold-sat') {
          // SATELLITE GOLDEN ACCENT NODE
          const bloomR = n.glowRadius * breath * n.flare;
          const bloom = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, bloomR);
          bloom.addColorStop(0, 'rgba(255, 250, 200, 0.95)');
          bloom.addColorStop(0.4, 'rgba(251, 191, 36, 0.55)');
          bloom.addColorStop(1, 'rgba(245, 158, 11, 0)');

          ctx.fillStyle = bloom;
          ctx.beginPath();
          ctx.arc(n.x, n.y, bloomR, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fffdf0';
          ctx.beginPath();
          ctx.arc(n.x, n.y, curR, 0, Math.PI * 2);
          ctx.fill();

        } else {
          // CYAN / TURQUOISE NODE
          const bloomR = n.glowRadius * breath * n.flare;
          const bloom = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, bloomR);
          bloom.addColorStop(0, 'rgba(224, 247, 250, 0.95)');
          bloom.addColorStop(0.35, 'rgba(34, 211, 238, 0.55)');
          bloom.addColorStop(0.7, 'rgba(6, 182, 212, 0.2)');
          bloom.addColorStop(1, 'rgba(2, 132, 199, 0)');

          ctx.fillStyle = bloom;
          ctx.beginPath();
          ctx.arc(n.x, n.y, bloomR, 0, Math.PI * 2);
          ctx.fill();

          // Crisp cyan-white core
          ctx.fillStyle = '#ecfeff';
          ctx.beginPath();
          ctx.arc(n.x, n.y, curR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 8. DRAW FLOATING FUTURISTIC GEOMETRIC ELEMENTS
      ctx.save();
      for (let g = 0; g < geometricElements.length; g++) {
        const el = geometricElements[g];
        if (!prefersReducedMotion && !isPaused) {
          el.rot += el.rotSpeed || 0;
          el.x += (el.driftSpeedX || 0) * dt * 30;
          el.y += (el.driftSpeedY || 0) * dt * 30;

          if (el.x < -el.size) el.x = width + el.size;
          if (el.x > width + el.size) el.x = -el.size;
          if (el.y < -el.size) el.y = height + el.size;
          if (el.y > height + el.size) el.y = -el.size;
        }

        ctx.save();
        ctx.translate(el.x, el.y);
        ctx.rotate(el.rot || 0);
        ctx.strokeStyle = el.color;
        ctx.lineWidth = 1.0;

        if (el.type === 'triangle-3d') {
          // Hollow 3D Triangle with centroid inner facet
          const r = el.size;
          const p1 = [0, -r];
          const p2 = [r * 0.866, r * 0.5];
          const p3 = [-r * 0.866, r * 0.5];
          const c = [0, r * 0.1];

          ctx.beginPath();
          ctx.moveTo(p1[0], p1[1]);
          ctx.lineTo(p2[0], p2[1]);
          ctx.lineTo(p3[0], p3[1]);
          ctx.closePath();
          ctx.stroke();

          // Inner centroid wireframe
          ctx.beginPath();
          ctx.moveTo(p1[0], p1[1]);
          ctx.lineTo(c[0], c[1]);
          ctx.lineTo(p2[0], p2[1]);
          ctx.moveTo(c[0], c[1]);
          ctx.lineTo(p3[0], p3[1]);
          ctx.strokeStyle = el.color.replace('0.6', '0.25');
          ctx.stroke();

        } else if (el.type === 'ico-3d') {
          // 3D Wireframe Icosahedron Projection
          if (!prefersReducedMotion && !isPaused) {
            el.rx += el.rxSpeed;
            el.ry += el.rySpeed;
          }
          const scale = el.size;
          const sinX = Math.sin(el.rx), cosX = Math.cos(el.rx);
          const sinY = Math.sin(el.ry), cosY = Math.cos(el.ry);

          const proj = baseIcoVerts.map(([vx, vy, vz]) => {
            // Rotate around Y then X
            const x1 = vx * cosY + vz * sinY;
            const z1 = -vx * sinY + vz * cosY;
            const y2 = vy * cosX - z1 * sinX;
            return [x1 * scale, y2 * scale];
          });

          ctx.beginPath();
          for (let e = 0; e < icoEdges.length; e++) {
            const [i1, i2] = icoEdges[e];
            ctx.moveTo(proj[i1][0], proj[i1][1]);
            ctx.lineTo(proj[i2][0], proj[i2][1]);
          }
          ctx.stroke();

        } else if (el.type === 'arc-ring') {
          // Incomplete Glowing Arc & Inner Arc
          const r = el.size;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0.25 * Math.PI, 1.75 * Math.PI);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(0, 0, r * 0.75, 0.4 * Math.PI, 1.6 * Math.PI);
          ctx.strokeStyle = el.color.replace('0.7', '0.35');
          ctx.stroke();

        } else if (el.type === 'diamond' || el.type === 'square') {
          // Outlined Diamond / Square
          const s = el.size;
          ctx.beginPath();
          ctx.rect(-s * 0.5, -s * 0.5, s, s);
          ctx.stroke();

        } else if (el.type === 'shard' || el.type === 'triangle') {
          // Geometric Shard
          const s = el.size;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(s * 0.7, s * 0.6);
          ctx.lineTo(-s * 0.5, s * 0.8);
          ctx.closePath();
          ctx.stroke();
        }

        ctx.restore();
      }
      ctx.restore();

      // 9. CINEMATIC VIGNETTE (Framing UI softly)
      const vigGrad = ctx.createRadialGradient(
        width * 0.5, height * 0.5, Math.min(width, height) * 0.4,
        width * 0.5, height * 0.5, Math.max(width, height) * 0.75
      );
      vigGrad.addColorStop(0, 'rgba(1, 3, 7, 0)');
      vigGrad.addColorStop(1, 'rgba(1, 3, 7, 0.65)');
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, width, height);

      // Loop request
      if (!isPaused && isTabVisible) {
        animId = requestAnimationFrame(render);
      }
    }

    // Initialize and start
    initScene();
    animId = requestAnimationFrame(render);

    // Event Listeners
    const handleResize = () => {
      initScene();
    };

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible && !isPaused) {
        lastTime = performance.now();
        animId = requestAnimationFrame(render);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPaused]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
