import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Eye, Sparkles, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * MotionVideoPlayer
 * 
 * Accessible, video-first playback component with interactive 60fps
 * Scenic Animation Fallback for 100% reliability on elderly mobile/tablet devices.
 */
export default function MotionVideoPlayer({
  challenge,
  onVideoEnded,
  replaysRemaining = 1,
  onReplayUsed,
  autoPlay = true
}) {
  const { t, language } = useLanguage();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(challenge?.durationSeconds || 8);
  const [videoError, setVideoError] = useState(false);
  const [isEnded, setIsEnded] = useState(false);

  // Total duration in seconds
  const totalDuration = challenge?.durationSeconds || duration || 8;

  // Reset states when challenge changes
  useEffect(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setVideoError(false);
    setIsEnded(false);
    setDuration(challenge?.durationSeconds || 8);

    // Auto-start video
    const timer = setTimeout(() => {
      startPlayback();
    }, 400);

    return () => {
      clearTimeout(timer);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [challenge?.id]);

  const startPlayback = () => {
    setIsEnded(false);
    if (!videoError && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Video autoplay constrained or file not present, using Scenic Motion Fallback:', err);
        setVideoError(true);
        startCanvasAnimation();
      });
    } else {
      startCanvasAnimation();
    }
  };

  const handlePauseToggle = () => {
    if (isEnded) return;
    if (isPlaying) {
      setIsPlaying(false);
      if (videoRef.current) videoRef.current.pause();
    } else {
      setIsPlaying(true);
      if (!videoError && videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const handleReplayClick = () => {
    if (replaysRemaining <= 0) return;
    if (typeof onReplayUsed === 'function') {
      onReplayUsed();
    }
    setProgress(0);
    setCurrentTime(0);
    setIsEnded(false);
    startPlayback();
  };

  // Video element events
  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      const vidDur = videoRef.current.duration;
      if (!isNaN(vidDur) && vidDur > 0) {
        setDuration(vidDur);
      }
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current && !videoError) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || totalDuration;
      setCurrentTime(cur);
      const pct = Math.min(100, (cur / dur) * 100);
      setProgress(pct);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setIsEnded(true);
    setProgress(100);
    if (typeof onVideoEnded === 'function') {
      onVideoEnded();
    }
  };

  const handleVideoError = () => {
    console.warn(`Video asset (${challenge?.videoUrl}) unavailable. Activating high-fidelity Scenic Canvas Fallback.`);
    setVideoError(true);
    startCanvasAnimation();
  };

  // ---------------------------------------------------------------------------
  // Scenic Motion Canvas Animation Engine
  // Renders beautiful, smooth 60fps motion matching the challenge's scene
  // ---------------------------------------------------------------------------
  const startCanvasAnimation = () => {
    setIsPlaying(true);
    const startTime = performance.now();
    const durMs = totalDuration * 1000;

    const renderFrame = (now) => {
      const elapsed = now - startTime;
      const progressFraction = Math.min(1.0, elapsed / durMs);
      const curSec = (progressFraction * totalDuration);

      setCurrentTime(curSec);
      setProgress(progressFraction * 100);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawScene(ctx, canvas.width, canvas.height, progressFraction, challenge?.sceneType || 'tea_pouring');
        }
      }

      if (progressFraction < 1.0) {
        animFrameRef.current = requestAnimationFrame(renderFrame);
      } else {
        setIsPlaying(false);
        setIsEnded(true);
        if (typeof onVideoEnded === 'function') {
          onVideoEnded();
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(renderFrame);
  };

  const drawScene = (ctx, w, h, t, sceneType) => {
    ctx.clearRect(0, 0, w, h);

    // Warm ambient background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#FFFBEB'); // soft amber/cream
    bgGrad.addColorStop(1, '#ECFDF5'); // soft emerald
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Floor / Table surface
    ctx.fillStyle = '#E5E7EB';
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.72);
    ctx.lineTo(w, h * 0.72);
    ctx.stroke();

    switch (sceneType) {
      case 'tea_pouring':
        drawTeaPouringScene(ctx, w, h, t);
        break;
      case 'flower_garden':
        drawFlowerGardenScene(ctx, w, h, t);
        break;
      case 'spice_box':
        drawSpiceBoxScene(ctx, w, h, t);
        break;
      case 'diya_lighting':
        drawDiyaLightingScene(ctx, w, h, t);
        break;
      case 'silk_weaving':
        drawSilkWeavingScene(ctx, w, h, t);
        break;
      case 'fruit_tray':
        drawFruitTrayScene(ctx, w, h, t);
        break;
      case 'reading_glasses':
        drawReadingGlassesScene(ctx, w, h, t);
        break;
      case 'pond_birds':
        drawPondBirdsScene(ctx, w, h, t);
        break;
      case 'paan_folding':
        drawPaanFoldingScene(ctx, w, h, t);
        break;
      case 'temple_bell':
        drawTempleBellScene(ctx, w, h, t);
        break;
      case 'market_basket':
        drawMarketBasketScene(ctx, w, h, t);
        break;
      default:
        drawTeaPouringScene(ctx, w, h, t);
    }
  };

  // 1. Tea Pouring Animation
  const drawTeaPouringScene = (ctx, w, h, t) => {
    const cupX = w * 0.55;
    const cupY = h * 0.74;

    // Ceramic cup
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#0F766E';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(cupX, cupY, 45, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cup body
    ctx.beginPath();
    ctx.moveTo(cupX - 45, cupY);
    ctx.quadraticCurveTo(cupX - 40, cupY + 60, cupX - 30, cupY + 65);
    ctx.lineTo(cupX + 30, cupY + 65);
    ctx.quadraticCurveTo(cupX + 40, cupY + 60, cupX + 45, cupY);
    ctx.fillStyle = '#F8FAFC';
    ctx.fill();
    ctx.stroke();

    // Cup handle
    ctx.beginPath();
    ctx.arc(cupX + 50, cupY + 30, 18, -Math.PI / 2, Math.PI / 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#0F766E';
    ctx.stroke();

    // Tea level in cup rising
    if (t > 0.2) {
      const fillHeight = Math.min(1.0, (t - 0.2) / 0.6);
      ctx.fillStyle = '#B45309'; // warm golden tea
      ctx.beginPath();
      ctx.ellipse(cupX, cupY + 20 - fillHeight * 15, 34, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Kettle tilting and pouring
    const tilt = t < 0.2 ? t * 2.5 : t < 0.8 ? 0.5 : Math.max(0, 0.5 - (t - 0.8) * 2.5);
    const kettleX = w * 0.35 + Math.sin(t * Math.PI) * 15;
    const kettleY = h * 0.45;

    ctx.save();
    ctx.translate(kettleX, kettleY);
    ctx.rotate(tilt * 0.6);

    // Kettle body
    ctx.fillStyle = '#94A3B8';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Kettle spout
    ctx.beginPath();
    ctx.moveTo(35, -15);
    ctx.lineTo(85, -35);
    ctx.lineTo(80, -20);
    ctx.lineTo(45, 10);
    ctx.fillStyle = '#64748B';
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // Liquid stream pouring from spout to cup
    if (t >= 0.22 && t <= 0.82) {
      ctx.fillStyle = '#D97706';
      ctx.beginPath();
      ctx.moveTo(cupX - 5, kettleY - 10);
      ctx.quadraticCurveTo(cupX, cupY - 20, cupX, cupY + 10);
      ctx.lineTo(cupX + 8, cupY + 10);
      ctx.quadraticCurveTo(cupX + 8, cupY - 20, cupX + 2, kettleY - 10);
      ctx.fill();

      // Steam rising
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const steamOffset = (t * 80) % 20;
      ctx.moveTo(cupX - 10, cupY - 15 - steamOffset);
      ctx.quadraticCurveTo(cupX - 5, cupY - 35 - steamOffset, cupX - 15, cupY - 55 - steamOffset);
      ctx.moveTo(cupX + 10, cupY - 15 - steamOffset);
      ctx.quadraticCurveTo(cupX + 15, cupY - 35 - steamOffset, cupX + 5, cupY - 55 - steamOffset);
      ctx.stroke();
    }
  };

  // 2. Flower Garden Scene
  const drawFlowerGardenScene = (ctx, w, h, t) => {
    // Flower pot
    const potX = w * 0.35;
    const potY = h * 0.72;
    ctx.fillStyle = '#B45309';
    ctx.beginPath();
    ctx.moveTo(potX - 50, potY - 40);
    ctx.lineTo(potX + 50, potY - 40);
    ctx.lineTo(potX + 35, potY + 40);
    ctx.lineTo(potX - 35, potY + 40);
    ctx.closePath();
    ctx.fill();

    // Stems & Green foliage
    ctx.strokeStyle = '#15803D';
    ctx.lineWidth = 4;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(potX + i * 15, potY - 40);
      ctx.quadraticCurveTo(potX + i * 25, potY - 90, potX + i * 35, potY - 120);
      ctx.stroke();
    }

    // Bright yellow marigolds blooming
    const flowerX = potX + 35;
    const flowerY = potY - 120;
    if (t < 0.6) {
      ctx.fillStyle = '#EAB308';
      ctx.beginPath();
      ctx.arc(flowerX, flowerY, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#CA8A04';
      ctx.beginPath();
      ctx.arc(flowerX, flowerY, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cane basket
    const basketX = w * 0.68;
    const basketY = h * 0.72;
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.ellipse(basketX, basketY, 55, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flower moving to basket
    if (t >= 0.45) {
      const fProg = Math.min(1.0, (t - 0.45) / 0.4);
      const curFx = flowerX + (basketX - flowerX) * fProg;
      const curFy = flowerY + (basketY - 10 - flowerY) * fProg - Math.sin(fProg * Math.PI) * 40;

      ctx.fillStyle = '#EAB308';
      ctx.beginPath();
      ctx.arc(curFx, curFy, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#CA8A04';
      ctx.beginPath();
      ctx.arc(curFx, curFy, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // 3. Temple Bell Resonance Scene
  const drawTempleBellScene = (ctx, w, h, t) => {
    const bellX = w * 0.5;
    const swingPhase = Math.sin(t * Math.PI * 6);
    const angle = swingPhase * 0.25 * Math.max(0, 1 - t * 0.5);

    ctx.save();
    ctx.translate(bellX, h * 0.2);
    ctx.rotate(angle);

    // Hanging chain
    ctx.strokeStyle = '#78716C';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, -60);
    ctx.lineTo(0, 0);
    ctx.stroke();

    // Heavy brass bell
    ctx.fillStyle = '#CA8A04';
    ctx.strokeStyle = '#854D0E';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.quadraticCurveTo(-45, 60, -55, 90);
    ctx.lineTo(55, 90);
    ctx.quadraticCurveTo(45, 60, 15, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Clapper inside bell
    ctx.fillStyle = '#713F12';
    ctx.beginPath();
    ctx.arc(Math.sin(angle * 2) * 15, 100, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Soundwaves pulsing 3 distinct times
    const pulseCycle = (t * 3) % 1.0;
    if (pulseCycle > 0.1 && pulseCycle < 0.9) {
      const radius = pulseCycle * 140 + 60;
      ctx.strokeStyle = `rgba(202, 138, 4, ${1.0 - pulseCycle})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(bellX, h * 0.45, radius, -Math.PI * 0.8, -Math.PI * 0.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(bellX, h * 0.45, radius, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
    }
  };

  // 4. Spice Box Selection
  const drawSpiceBoxScene = (ctx, w, h, t) => {
    const boxX = w * 0.5;
    const boxY = h * 0.6;
    // Circular brass masala box
    ctx.fillStyle = '#CA8A04';
    ctx.strokeStyle = '#854D0E';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(boxX, boxY, 90, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Center compartment (Cardamom)
    ctx.fillStyle = '#15803D';
    ctx.beginPath();
    ctx.arc(boxX, boxY, 32, 0, Math.PI * 2);
    ctx.fill();

    // 4 Outer compartments (Turmeric, Red chilli, Cumin, Mustard)
    const colors = ['#EAB308', '#DC2626', '#78350F', '#172554'];
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2 + Math.PI / 4;
      const cx = boxX + Math.cos(ang) * 55;
      const cy = boxY + Math.sin(ang) * 55;
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#854D0E';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Picking green cardamom pod lifting up
    if (t > 0.4) {
      const lift = Math.min(1.0, (t - 0.4) / 0.4);
      const podY = boxY - lift * 80;
      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.ellipse(boxX, podY, 14, 22, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#15803D';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  };

  // 5. Diya Lighting Scene
  const drawDiyaLightingScene = (ctx, w, h, t) => {
    const diyaX = w * 0.5;
    const diyaY = h * 0.7;

    // Clay diya
    ctx.fillStyle = '#9A3412';
    ctx.beginPath();
    ctx.ellipse(diyaX, diyaY, 50, 22, 0, 0, Math.PI);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#7C2D12';
    ctx.stroke();

    // Flame grows after t > 0.35
    if (t > 0.3) {
      const flameProg = Math.min(1.0, (t - 0.3) / 0.3);
      const flameHeight = flameProg * 35;
      const flicker = Math.sin(t * 30) * 4;

      // Outer golden flame
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(diyaX - 16, diyaY - 5);
      ctx.quadraticCurveTo(diyaX + flicker, diyaY - 20 - flameHeight, diyaX + 16, diyaY - 5);
      ctx.closePath();
      ctx.fill();

      // Inner white flame core
      ctx.fillStyle = '#FEF3C7';
      ctx.beginPath();
      ctx.moveTo(diyaX - 8, diyaY - 5);
      ctx.quadraticCurveTo(diyaX + flicker * 0.5, diyaY - 12 - flameHeight * 0.6, diyaX + 8, diyaY - 5);
      ctx.closePath();
      ctx.fill();
    }
  };

  // 6. Silk Weaving Scene
  const drawSilkWeavingScene = (ctx, w, h, t) => {
    const loomX = w * 0.5;
    const loomY = h * 0.5;

    // Warp threads
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    for (let x = loomX - 120; x <= loomX + 120; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x, loomY - 80);
      ctx.lineTo(x, loomY + 80);
      ctx.stroke();
    }

    // Shuttle picking golden muga silk spool
    const shuttleX = loomX - 80 + Math.sin(t * Math.PI * 2) * 90;
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.ellipse(shuttleX, loomY, 40, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FDE047'; // golden thread
    ctx.beginPath();
    ctx.ellipse(shuttleX, loomY, 22, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  // 7. Fruit Tray Scene
  const drawFruitTrayScene = (ctx, w, h, t) => {
    const xoraiX = w * 0.5;
    const xoraiY = h * 0.68;

    // Pedestal stand
    ctx.fillStyle = '#CA8A04';
    ctx.fillRect(xoraiX - 12, xoraiY - 10, 24, 40);
    ctx.beginPath();
    ctx.ellipse(xoraiX, xoraiY + 30, 45, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Xorai plate
    ctx.beginPath();
    ctx.ellipse(xoraiX, xoraiY - 10, 95, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#854D0E';
    ctx.lineWidth = 4;
    ctx.stroke();

    // 1 Red apple in center
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.arc(xoraiX, xoraiY - 26, 18, 0, Math.PI * 2);
    ctx.fill();

    // 3 yellow bananas placed sequentially
    const bananaAngles = [-0.6, 0, 0.6];
    bananaAngles.forEach((ang, idx) => {
      const appearThreshold = 0.2 + idx * 0.22;
      if (t >= appearThreshold) {
        ctx.save();
        ctx.translate(xoraiX + ang * 50, xoraiY - 22);
        ctx.rotate(ang);
        ctx.fillStyle = '#EAB308';
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
  };

  // 8. Reading Glasses Scene
  const drawReadingGlassesScene = (ctx, w, h, t) => {
    const gx = w * 0.5;
    const gy = h * 0.45;
    const isWorn = t > 0.4;
    const currentY = isWorn ? gy : gy + 80;

    // Glasses frame
    ctx.strokeStyle = '#0F766E';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(gx - 40, currentY, 28, 0, Math.PI * 2);
    ctx.arc(gx + 40, currentY, 28, 0, Math.PI * 2);
    ctx.stroke();

    // Bridge
    ctx.beginPath();
    ctx.moveTo(gx - 12, currentY);
    ctx.lineTo(gx + 12, currentY);
    ctx.stroke();

    // Newspaper unfolding
    const newsProg = Math.min(1.0, Math.max(0, (t - 0.4) / 0.5));
    const newsW = 120 + newsProg * 60;
    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 3;
    ctx.fillRect(gx - newsW / 2, h * 0.65, newsW, 60);
    ctx.strokeRect(gx - newsW / 2, h * 0.65, newsW, 60);
  };

  // 9. Pond Birds Scene
  const drawPondBirdsScene = (ctx, w, h, t) => {
    // Water
    ctx.fillStyle = '#BAE6FD';
    ctx.fillRect(0, h * 0.6, w, h * 0.4);

    // Bamboo pole
    ctx.fillStyle = '#854D0E';
    ctx.fillRect(w * 0.48, h * 0.4, 14, h * 0.4);

    // White heron landing first (t > 0.2)
    if (t > 0.2) {
      const heronY = Math.min(h * 0.38, h * 0.1 + (t - 0.2) * 200);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(w * 0.49, heronY, 18, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      // Long beak
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.49, heronY - 20);
      ctx.lineTo(w * 0.55, heronY - 20);
      ctx.stroke();
    }

    // Kingfisher landing later (t > 0.65)
    if (t > 0.65) {
      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.arc(w * 0.65, h * 0.45, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // 10. Paan Folding Scene
  const drawPaanFoldingScene = (ctx, w, h, t) => {
    const px = w * 0.5;
    const py = h * 0.6;

    // Green betel leaf
    ctx.fillStyle = '#15803D';
    ctx.beginPath();
    ctx.ellipse(px, py, 60, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    // White chuna dab (appears at t > 0.25)
    if (t > 0.25) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(px - 15, py, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sliced areca nut (appears at t > 0.55)
    if (t > 0.55) {
      ctx.fillStyle = '#78350F';
      ctx.beginPath();
      ctx.arc(px + 10, py, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // 11. Market Basket Scene
  const drawMarketBasketScene = (ctx, w, h, t) => {
    const bx = w * 0.5;
    const by = h * 0.65;

    // Woven basket
    ctx.fillStyle = '#92400E';
    ctx.beginPath();
    ctx.ellipse(bx, by, 80, 45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Purple Brinjal
    ctx.fillStyle = '#581C87';
    ctx.beginPath();
    ctx.ellipse(bx - 30, by - 10, 28, 14, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Bottle Gourd
    ctx.fillStyle = '#86EFAC';
    ctx.beginPath();
    ctx.ellipse(bx + 20, by - 10, 32, 12, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // 2 Red Tomatoes placed on top last (t > 0.6)
    if (t > 0.6) {
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(bx - 8, by - 22, 14, 0, Math.PI * 2);
      ctx.arc(bx + 14, by - 20, 14, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Formatting time mm:ss
  const formatTime = (secs) => {
    const s = Math.floor(secs);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const challengeTitle = typeof challenge?.title === 'object'
    ? (challenge.title[language] || challenge.title.en)
    : (challenge?.title || 'Daily Scene');

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto space-y-4">
      {/* Elderly Instruction Banner */}
      <div className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-teal-50/90 dark:bg-teal-950/40 border-2 border-teal-300 dark:border-teal-800/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-xs">
            <Eye className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white leading-tight">
              {t('games.memorymotion.watchPrompt') || 'Watch carefully. Remember what you see.'}
            </h3>
            <p className="text-xs md:text-sm font-semibold text-teal-800 dark:text-teal-300">
              {challengeTitle} • {totalDuration} {t('common.seconds') || 'seconds'}
            </p>
          </div>
        </div>

        {replaysRemaining > 0 && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{replaysRemaining} {t('games.memorymotion.replaysLeft') || 'replay left'}</span>
          </span>
        )}
      </div>

      {/* Video / Scenic Canvas Container */}
      <div className="relative w-full aspect-video rounded-3xl overflow-hidden border-3 border-slate-300 dark:border-[#243352] shadow-xl bg-black">
        {/* Real HTML5 Video element */}
        {!videoError && (
          <video
            ref={videoRef}
            src={challenge?.videoUrl}
            poster={challenge?.posterUrl}
            playsInline
            muted={isMuted}
            preload="metadata"
            onLoadedMetadata={handleVideoLoadedMetadata}
            onTimeUpdate={handleVideoTimeUpdate}
            onEnded={handleVideoEnded}
            onError={handleVideoError}
            className="w-full h-full object-cover"
          />
        )}

        {/* High-Fidelity Scenic Canvas Fallback */}
        {videoError && (
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            className="w-full h-full object-cover"
          />
        )}

        {/* Fallback Badge if using Canvas Stream */}
        {videoError && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-bold border border-slate-700/60 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('games.memorymotion.scenicMotion') || 'Scenic Motion Stream'}</span>
          </div>
        )}

        {/* Video Overlays (Paused / Ended) */}
        {!isPlaying && !isEnded && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center">
            <button
              type="button"
              onClick={handlePauseToggle}
              className="w-20 h-20 rounded-full bg-teal-600 hover:bg-teal-500 text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              title="Play Video"
            >
              <Play className="w-10 h-10 ml-1.5" />
            </button>
          </div>
        )}

        {isEnded && (
          <div className="absolute inset-0 bg-teal-950/75 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-3xl shadow-lg">
              ✓
            </div>
            <p className="text-lg md:text-xl font-black">
              {t('games.memorymotion.videoFinished') || 'Video Finished! Ready for question.'}
            </p>
          </div>
        )}

        {/* Bottom Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-2.5 bg-slate-800/80">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Elderly-Friendly Controls Bar */}
      <div className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white dark:bg-[#131D33] border-2 border-slate-200 dark:border-[#243352] shadow-xs">
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button
            type="button"
            onClick={handlePauseToggle}
            className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold transition-colors flex items-center gap-2 cursor-pointer"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            <span className="text-xs sm:text-sm font-bold">
              {isPlaying ? (t('common.pause') || 'Pause') : (t('common.play') || 'Play')}
            </span>
          </button>

          {/* Replay Button */}
          {challenge?.replayAllowed && (
            <button
              type="button"
              onClick={handleReplayClick}
              disabled={replaysRemaining <= 0}
              className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold transition-colors flex items-center gap-2 disabled:opacity-40 cursor-pointer"
              title={replaysRemaining > 0 ? 'Watch Again' : 'No replays remaining'}
            >
              <RotateCcw className="w-5 h-5" />
              <span className="text-xs sm:text-sm font-bold">
                {t('games.memorymotion.watchAgain') || 'Watch Again'}
              </span>
            </button>
          )}
        </div>

        {/* Time and Mute toggle */}
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm font-mono font-bold text-slate-600 dark:text-slate-300">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>

          {!videoError && (
            <button
              type="button"
              onClick={() => {
                const nextMuted = !isMuted;
                setIsMuted(nextMuted);
                if (videoRef.current) videoRef.current.muted = nextMuted;
              }}
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
