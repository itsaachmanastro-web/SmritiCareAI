import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * LivingNeuralCanvas
 * 
 * High-performance, soothing HTML5 Canvas animation simulating memory synapses,
 * cognitive recall pathways, and gentle neural connections in SmritiCare brand hues.
 * 
 * Functions as both an ambient technology background and a zero-dependency
 * offline fallback if video streaming is unavailable or paused.
 */
export default function LivingNeuralCanvas({ isPaused = false }) {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initNodes();
    };

    window.addEventListener('resize', handleResize);

    // Color palettes
    const tealColor = isDark ? '20, 184, 166' : '13, 148, 136';   // #14B8A6 / #0D9488
    const orangeColor = isDark ? '251, 146, 60' : '234, 88, 12'; // #FB923C / #EA580C
    const cyanColor = isDark ? '56, 189, 248' : '2, 132, 199';     // #38BDF8 / #0284C7

    // Generate floating memory synapse nodes
    const nodeCount = Math.min(42, Math.max(24, Math.floor(width / 35)));
    let nodes = [];

    const initNodes = () => {
      nodes = [];
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          radius: Math.random() * 2.2 + 1.2,
          color: i % 4 === 0 ? orangeColor : i % 3 === 0 ? cyanColor : tealColor,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.02 + Math.random() * 0.02
        });
      }
    };

    initNodes();

    // Pulse signal traveling along synapses
    let pulses = [
      { from: 0, to: 1, progress: 0, speed: 0.008, color: orangeColor },
      { from: 2, to: 3, progress: 0, speed: 0.006, color: tealColor }
    ];

    const maxDist = 135;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * (isDark ? 0.28 : 0.22);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${tealColor}, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw and update nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        if (!isPaused) {
          n.x += n.vx;
          n.y += n.vy;
          n.pulse += n.pulseSpeed;

          // Gentle wrap around screen edges
          if (n.x < -20) n.x = width + 20;
          if (n.x > width + 20) n.x = -20;
          if (n.y < -20) n.y = height + 20;
          if (n.y > height + 20) n.y = -20;
        }

        const currentRadius = n.radius + Math.sin(n.pulse) * 0.6;
        const glowAlpha = isDark ? 0.35 : 0.25;

        // Outer soft glow halo
        const gradient = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, currentRadius * 4);
        gradient.addColorStop(0, `rgba(${n.color}, ${glowAlpha})`);
        gradient.addColorStop(1, `rgba(${n.color}, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(n.x, n.y, currentRadius * 4, 0, Math.PI * 2);
        ctx.fill();

        // Core memory node
        ctx.beginPath();
        ctx.fillStyle = `rgba(${n.color}, ${isDark ? 0.9 : 0.8})`;
        ctx.arc(n.x, n.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!isPaused) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isDark, isPaused]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-80 transition-opacity duration-700"
      aria-hidden="true"
    />
  );
}
