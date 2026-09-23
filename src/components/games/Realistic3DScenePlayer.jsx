import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Eye,
  Sparkles,
  Maximize2,
  Minimize2,
  Subtitles,
  Activity
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { SCENE_DEFINITIONS, SCENE_TYPES } from '../../services/games/SceneEventEngine';

/**
 * Realistic3DScenePlayer
 * 
 * Hardware-accelerated 3D WebGL cognitive simulation engine.
 * Renders realistic environments (Home Kitchen, Grocery Store, Café, Living Room)
 * with cinematic camera motion, realistic lighting, and kinematic character tasks.
 */
export default function Realistic3DScenePlayer({
  sceneType = SCENE_TYPES.KITCHEN_MORNING,
  customChallenge = null,
  durationSeconds = 10,
  onSceneEnded = () => {},
  replaysRemaining = 1,
  onReplayUsed = () => {},
  autoPlay = true
}) {
  const { t, language } = useLanguage();

  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const animFrameRef = useRef(null);

  // Runtime references for dynamic 3D elements
  const sceneObjectsRef = useRef({});
  const characterRef = useRef(null);
  const steamParticlesRef = useRef([]);
  const waterStreamRef = useRef(null);

  // Playback States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [currentCaption, setCurrentCaption] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSceneReady, setIsSceneReady] = useState(false);

  // Resolve scene definition
  const activeSceneType = customChallenge?.sceneType || sceneType || SCENE_TYPES.KITCHEN_MORNING;
  const sceneDef = SCENE_DEFINITIONS[activeSceneType] || SCENE_DEFINITIONS[SCENE_TYPES.KITCHEN_MORNING];
  const totalDuration = customChallenge?.durationSeconds || sceneDef?.durationSeconds || durationSeconds || 10;

  // Track playback time
  const playbackStartTimeRef = useRef(0);
  const pausedTimeRef = useRef(0);

  // ---------------------------------------------------------------------------
  // 1. Initialize Three.js 3D World
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;

    // Create Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF1F5F9);
    scene.fog = new THREE.FogExp2(0xF1F5F9, 0.04);
    sceneRef.current = scene;

    // Create Perspective Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 1.6, 4.2);
    cameraRef.current = camera;

    // Create High-Quality WebGL Renderer
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      rendererRef.current = renderer;

      // Append canvas
      while (container.firstChild) container.removeChild(container.firstChild);
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('WebGL Initialization warning:', e);
      return;
    }

    // Build Environment & Props
    buildRealisticEnvironment(scene, activeSceneType, sceneObjectsRef);
    const character = buildKinematicCharacter(scene);
    characterRef.current = character;

    // Setup Lighting
    setupRealisticLighting(scene, activeSceneType);

    setIsSceneReady(true);

    // Auto-start playback
    const startTimer = setTimeout(() => {
      startSimulation();
    }, 300);

    // Resize Observer
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 450;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(startTimer);
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (renderer) {
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
    };
  }, [activeSceneType]);

  // ---------------------------------------------------------------------------
  // 2. Build 3D Realistic Environments
  // ---------------------------------------------------------------------------
  const buildRealisticEnvironment = (scene, type, objectsRef) => {
    // Shared Floor & Base Room
    const floorGeo = new THREE.PlaneGeometry(16, 16);
    const floorMat = new THREE.MeshStandardMaterial({
      color: type === SCENE_TYPES.CAFE_SOCIAL ? 0x8B5A2B : 0xE2E8F0,
      roughness: 0.35,
      metalness: 0.05
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Back Wall with soft warm tint
    const backWallGeo = new THREE.PlaneGeometry(16, 8);
    const backWallMat = new THREE.MeshStandardMaterial({
      color: type === SCENE_TYPES.CAFE_SOCIAL ? 0xFEF3C7 : 0xF8FAFC,
      roughness: 0.8
    });
    const backWall = new THREE.Mesh(backWallGeo, backWallMat);
    backWall.position.set(0, 4, -4);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Left Wall
    const leftWall = new THREE.Mesh(backWallGeo, backWallMat);
    leftWall.position.set(-8, 4, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Window with realistic morning sunlight frame
    const windowFrameGeo = new THREE.BoxGeometry(2.4, 1.8, 0.1);
    const windowFrameMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.4 });
    const windowFrame = new THREE.Mesh(windowFrameGeo, windowFrameMat);
    windowFrame.position.set(-2.5, 2.5, -3.95);
    scene.add(windowFrame);

    // Window glass pane (sky glow)
    const glassGeo = new THREE.PlaneGeometry(2.2, 1.6);
    const glassMat = new THREE.MeshBasicMaterial({ color: 0xBAE6FD });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(-2.5, 2.5, -3.9);
    scene.add(glass);

    // -------------------------------------------------------------------------
    // Scenario-Specific Furniture & Props
    // -------------------------------------------------------------------------
    if (type === SCENE_TYPES.KITCHEN_MORNING) {
      // 1. Kitchen Granite Countertop
      const counterGeo = new THREE.BoxGeometry(2.4, 0.9, 0.8);
      const counterMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.2, metalness: 0.1 });
      const counter = new THREE.Mesh(counterGeo, counterMat);
      counter.position.set(-1.8, 0.45, -1.0);
      counter.castShadow = true;
      counter.receiveShadow = true;
      scene.add(counter);

      // Base Cabinets under counter (Wood veneer)
      const baseCabGeo = new THREE.BoxGeometry(2.35, 0.85, 0.78);
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350F, roughness: 0.6 });
      const baseCab = new THREE.Mesh(baseCabGeo, woodMat);
      baseCab.position.set(-1.8, 0.42, -1.0);
      scene.add(baseCab);

      // Upper Wall Cabinet with rotatable door
      const cabinetBoxGeo = new THREE.BoxGeometry(1.2, 0.7, 0.4);
      const cabinetBox = new THREE.Mesh(cabinetBoxGeo, woodMat);
      cabinetBox.position.set(-1.6, 2.2, -1.2);
      scene.add(cabinetBox);

      // Cabinet Door (rotates on hinge)
      const doorGeo = new THREE.BoxGeometry(0.6, 0.68, 0.04);
      const doorMat = new THREE.MeshStandardMaterial({ color: 0x92400E, roughness: 0.5 });
      const cabinetDoor = new THREE.Mesh(doorGeo, doorMat);
      cabinetDoor.position.set(-0.3, 0, 0.2); // hinge offset
      const cabinetHinge = new THREE.Group();
      cabinetHinge.position.set(-1.9, 2.2, -1.0);
      cabinetHinge.add(cabinetDoor);
      scene.add(cabinetHinge);
      objectsRef.current.cabinetHinge = cabinetHinge;

      // Amber Medicine Bottle inside cabinet
      const bottleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.12, 16);
      const bottleMat = new THREE.MeshStandardMaterial({ color: 0xB45309, roughness: 0.2, transparent: true, opacity: 0.9 });
      const medBottle = new THREE.Mesh(bottleGeo, bottleMat);
      // White bottle cap
      const capGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.03, 16);
      const capMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.3 });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 0.07;
      medBottle.add(cap);
      medBottle.position.set(-1.6, 2.05, -1.2);
      scene.add(medBottle);
      objectsRef.current.medicineBottle = medBottle;

      // Chrome Sink and Faucet on countertop
      const faucetGeo = new THREE.TorusGeometry(0.1, 0.015, 8, 24, Math.PI);
      const chromeMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.9, roughness: 0.1 });
      const faucet = new THREE.Mesh(faucetGeo, chromeMat);
      faucet.rotation.z = Math.PI / 2;
      faucet.position.set(-2.4, 1.05, -1.0);
      scene.add(faucet);

      // Bright Red Ceramic Cup on Counter
      const cupGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.11, 20);
      const redCupMat = new THREE.MeshStandardMaterial({ color: 0xDC2626, roughness: 0.15, metalness: 0.05 });
      const redCup = new THREE.Mesh(cupGeo, redCupMat);
      // Cup handle
      const handleGeo = new THREE.TorusGeometry(0.035, 0.01, 8, 16, Math.PI);
      const handle = new THREE.Mesh(handleGeo, redCupMat);
      handle.position.set(0.06, 0, 0);
      handle.rotation.z = -Math.PI / 2;
      redCup.add(handle);
      redCup.position.set(-1.4, 0.96, -0.9);
      redCup.castShadow = true;
      scene.add(redCup);
      objectsRef.current.redCup = redCup;

      // Glass Water Pitcher on Counter
      const pitcherGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.24, 20);
      const glassPitcherMat = new THREE.MeshPhysicalMaterial({
        color: 0xFFFFFF,
        transmission: 0.9,
        opacity: 1,
        transparent: true,
        roughness: 0.05,
        ior: 1.5
      });
      const pitcher = new THREE.Mesh(pitcherGeo, glassPitcherMat);
      pitcher.position.set(-1.8, 1.02, -0.9);
      pitcher.castShadow = true;
      scene.add(pitcher);
      objectsRef.current.waterPitcher = pitcher;

      // Dining Table (Center-Right)
      const tableGeo = new THREE.BoxGeometry(1.6, 0.08, 1.1);
      const tableMat = new THREE.MeshStandardMaterial({ color: 0xA16207, roughness: 0.5 });
      const table = new THREE.Mesh(tableGeo, tableMat);
      table.position.set(0.8, 0.76, -0.6);
      table.castShadow = true;
      table.receiveShadow = true;
      scene.add(table);

      // Table Legs
      for (const [lx, lz] of [[-0.7, -0.45], [0.7, -0.45], [-0.7, 0.45], [0.7, 0.45]]) {
        const legGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.72, 12);
        const leg = new THREE.Mesh(legGeo, tableMat);
        leg.position.set(0.8 + lx, 0.36, -0.6 + lz);
        leg.castShadow = true;
        scene.add(leg);
      }

      // White Porcelain Plate on Table
      const plateGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.02, 24);
      const whitePlateMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.2 });
      const plate = new THREE.Mesh(plateGeo, whitePlateMat);
      plate.position.set(0.5, 0.81, -0.6);
      plate.castShadow = true;
      plate.receiveShadow = true;
      scene.add(plate);
      objectsRef.current.whitePlate = plate;

      // Wooden Dining Chair
      const chairGroup = new THREE.Group();
      const seatGeo = new THREE.BoxGeometry(0.45, 0.05, 0.45);
      const seat = new THREE.Mesh(seatGeo, tableMat);
      seat.position.set(0, 0.45, 0);
      chairGroup.add(seat);
      // Chair Back
      const backGeo = new THREE.BoxGeometry(0.45, 0.5, 0.04);
      const back = new THREE.Mesh(backGeo, tableMat);
      back.position.set(0, 0.72, -0.2);
      chairGroup.add(back);
      // Chair Legs
      for (const [cx, cz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) {
        const cLegGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.45, 8);
        const cLeg = new THREE.Mesh(cLegGeo, tableMat);
        cLeg.position.set(cx, 0.225, cz);
        chairGroup.add(cLeg);
      }
      chairGroup.position.set(1.4, 0, -0.6);
      chairGroup.rotation.y = -Math.PI / 2;
      scene.add(chairGroup);
      objectsRef.current.diningChair = chairGroup;
    }

    else if (type === SCENE_TYPES.GROCERY_MARKET) {
      // Grocery Produce Stand
      const standGeo = new THREE.BoxGeometry(2.6, 0.8, 1.2);
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400E, roughness: 0.7 });
      const stand = new THREE.Mesh(standGeo, woodMat);
      stand.position.set(-1.2, 0.4, -0.8);
      stand.castShadow = true;
      scene.add(stand);

      // Produce crates with fruits
      // 1. Bananas (Yellow)
      const bananaGeo = new THREE.TorusGeometry(0.1, 0.025, 8, 16, Math.PI * 0.7);
      const bananaMat = new THREE.MeshStandardMaterial({ color: 0xEAB308, roughness: 0.3 });
      const bananas = new THREE.Mesh(bananaGeo, bananaMat);
      bananas.position.set(-1.8, 0.88, -0.8);
      bananas.rotation.x = Math.PI / 2;
      scene.add(bananas);
      objectsRef.current.bananas = bananas;

      // 2. Red Apples (Red spheres)
      for (let i = 0; i < 3; i++) {
        const appleGeo = new THREE.SphereGeometry(0.06, 16, 16);
        const appleMat = new THREE.MeshStandardMaterial({ color: 0xDC2626, roughness: 0.2 });
        const apple = new THREE.Mesh(appleGeo, appleMat);
        apple.position.set(-1.2 + i * 0.12, 0.86, -0.8);
        apple.castShadow = true;
        scene.add(apple);
      }

      // Green Shopping Basket
      const basketGeo = new THREE.BoxGeometry(0.4, 0.25, 0.3);
      const basketMat = new THREE.MeshStandardMaterial({ color: 0x16A34A, roughness: 0.4 });
      const basket = new THREE.Mesh(basketGeo, basketMat);
      basket.position.set(0.5, 0.55, 0.2);
      scene.add(basket);
      objectsRef.current.shoppingBasket = basket;

      // Grocery Shelves in Background
      const shelfGeo = new THREE.BoxGeometry(2.0, 1.8, 0.4);
      const shelfMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
      const shelf = new THREE.Mesh(shelfGeo, shelfMat);
      shelf.position.set(1.4, 1.2, -1.8);
      scene.add(shelf);

      // Blue Cereal Box on top shelf
      const boxGeo = new THREE.BoxGeometry(0.18, 0.28, 0.08);
      const blueBoxMat = new THREE.MeshStandardMaterial({ color: 0x2563EB, roughness: 0.3 });
      const cerealBox = new THREE.Mesh(boxGeo, blueBoxMat);
      cerealBox.position.set(1.2, 1.6, -1.7);
      scene.add(cerealBox);
      objectsRef.current.cerealBox = cerealBox;
    }

    else if (type === SCENE_TYPES.CAFE_SOCIAL) {
      // Bistro Round Table
      const roundTableGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.05, 32);
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350F, roughness: 0.4 });
      const bistroTable = new THREE.Mesh(roundTableGeo, woodMat);
      bistroTable.position.set(0, 0.76, -0.6);
      bistroTable.castShadow = true;
      bistroTable.receiveShadow = true;
      scene.add(bistroTable);

      const tablePoleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.74, 12);
      const pole = new THREE.Mesh(tablePoleGeo, woodMat);
      pole.position.set(0, 0.37, -0.6);
      scene.add(pole);

      // Teal Coffee Mug with rising steam
      const mugGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.11, 20);
      const tealMat = new THREE.MeshStandardMaterial({ color: 0x0D9488, roughness: 0.2 });
      const mug = new THREE.Mesh(mugGeo, tealMat);
      mug.position.set(0.1, 0.84, -0.6);
      mug.castShadow = true;
      scene.add(mug);
      objectsRef.current.coffeeMug = mug;

      // Newspaper folded
      const newsGeo = new THREE.BoxGeometry(0.25, 0.02, 0.35);
      const newsMat = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.9 });
      const newspaper = new THREE.Mesh(newsGeo, newsMat);
      newspaper.position.set(-0.2, 0.8, -0.5);
      scene.add(newspaper);
      objectsRef.current.newspaper = newspaper;

      // Black Glasses Case
      const caseGeo = new THREE.BoxGeometry(0.14, 0.03, 0.06);
      const caseMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.3 });
      const glassesCase = new THREE.Mesh(caseGeo, caseMat);
      glassesCase.position.set(-0.15, 0.8, -0.75);
      scene.add(glassesCase);
      objectsRef.current.glassesCase = glassesCase;
    }

    else if (type === SCENE_TYPES.LIVING_ROOM_DIFFERENCE) {
      // Living Room Sofa
      const sofaGeo = new THREE.BoxGeometry(1.8, 0.45, 0.8);
      const sofaMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
      const sofa = new THREE.Mesh(sofaGeo, sofaMat);
      sofa.position.set(0, 0.3, -1.8);
      scene.add(sofa);

      // Sofa Cushion (Changes color dynamically!)
      const cushionGeo = new THREE.BoxGeometry(0.4, 0.35, 0.15);
      const cushionMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.7 });
      const cushion = new THREE.Mesh(cushionGeo, cushionMat);
      cushion.position.set(-0.5, 0.55, -1.75);
      scene.add(cushion);
      objectsRef.current.sofaCushion = cushion;
      objectsRef.current.cushionMat = cushionMat;

      // Coffee Table with Book
      const ctGeo = new THREE.BoxGeometry(1.2, 0.4, 0.6);
      const ctMat = new THREE.MeshStandardMaterial({ color: 0xA16207, roughness: 0.4 });
      const ct = new THREE.Mesh(ctGeo, ctMat);
      ct.position.set(0, 0.2, -0.8);
      scene.add(ct);

      const bookGeo = new THREE.BoxGeometry(0.22, 0.04, 0.16);
      const bookMat = new THREE.MeshStandardMaterial({ color: 0xDC2626, roughness: 0.5 });
      const book = new THREE.Mesh(bookGeo, bookMat);
      book.position.set(0, 0.42, -0.8);
      scene.add(book);
      objectsRef.current.tableBook = book;

      // Wall Clock on back wall
      const clockGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.04, 32);
      const clockMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.3 });
      const clock = new THREE.Mesh(clockGeo, clockMat);
      clock.position.set(0, 2.6, -3.95);
      clock.rotation.x = Math.PI / 2;
      scene.add(clock);
    }
  };

  // ---------------------------------------------------------------------------
  // 3. Build Kinematic 3D Character
  // ---------------------------------------------------------------------------
  const buildKinematicCharacter = (scene) => {
    const character = new THREE.Group();

    // Natural clothing materials
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xE8BA9B, roughness: 0.7 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, roughness: 0.9 }); // Gentle silver hair
    const kurtaMat = new THREE.MeshStandardMaterial({ color: 0x0284C7, roughness: 0.8 }); // Calming blue kurta
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.7 }); // Light pyjama/pants
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x78350F, roughness: 0.5 });

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.42, 0.65, 0.24);
    const torso = new THREE.Mesh(torsoGeo, kurtaMat);
    torso.position.set(0, 1.15, 0);
    torso.castShadow = true;
    character.add(torso);

    // 2. Head with hair
    const headGeo = new THREE.SphereGeometry(0.13, 20, 20);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 1.62, 0);
    head.castShadow = true;
    character.add(head);

    const hairGeo = new THREE.SphereGeometry(0.135, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 1.64, 0);
    character.add(hair);

    // 3. Right Arm (Shoulder + Hand)
    const rArmGroup = new THREE.Group();
    rArmGroup.position.set(0.24, 1.4, 0);
    const rArmGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.5, 12);
    const rArm = new THREE.Mesh(rArmGeo, kurtaMat);
    rArm.position.set(0, -0.25, 0);
    rArm.castShadow = true;
    rArmGroup.add(rArm);
    const rHandGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const rHand = new THREE.Mesh(rHandGeo, skinMat);
    rHand.position.set(0, -0.5, 0);
    rArmGroup.add(rHand);
    character.add(rArmGroup);

    // 4. Left Arm
    const lArmGroup = new THREE.Group();
    lArmGroup.position.set(-0.24, 1.4, 0);
    const lArm = new THREE.Mesh(rArmGeo, kurtaMat);
    lArm.position.set(0, -0.25, 0);
    lArm.castShadow = true;
    lArmGroup.add(lArm);
    const lHand = new THREE.Mesh(rHandGeo, skinMat);
    lHand.position.set(0, -0.5, 0);
    lArmGroup.add(lHand);
    character.add(lArmGroup);

    // 5. Right Leg
    const rLegGroup = new THREE.Group();
    rLegGroup.position.set(0.12, 0.85, 0);
    const legGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.75, 12);
    const rLeg = new THREE.Mesh(legGeo, pantsMat);
    rLeg.position.set(0, -0.375, 0);
    rLeg.castShadow = true;
    rLegGroup.add(rLeg);
    const shoeGeo = new THREE.BoxGeometry(0.1, 0.06, 0.18);
    const rShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rShoe.position.set(0, -0.76, 0.04);
    rLegGroup.add(rShoe);
    character.add(rLegGroup);

    // 6. Left Leg
    const lLegGroup = new THREE.Group();
    lLegGroup.position.set(-0.12, 0.85, 0);
    const lLeg = new THREE.Mesh(legGeo, pantsMat);
    lLeg.position.set(0, -0.375, 0);
    lLeg.castShadow = true;
    lLegGroup.add(lLeg);
    const lShoe = new THREE.Mesh(shoeGeo, shoeMat);
    lShoe.position.set(0, -0.76, 0.04);
    lLegGroup.add(lShoe);
    character.add(lLegGroup);

    // Position character at room entrance
    character.position.set(-3.2, 0, 0.5);
    scene.add(character);

    return {
      root: character,
      rArm: rArmGroup,
      lArm: lArmGroup,
      rLeg: rLegGroup,
      lLeg: lLegGroup,
      torso,
      head
    };
  };

  // ---------------------------------------------------------------------------
  // 4. Realistic Lighting & Camera Path
  // ---------------------------------------------------------------------------
  const setupRealisticLighting = (scene, type) => {
    // Soft ambient bounce fill
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.85);
    scene.add(ambientLight);

    // Sunbeam directional light with soft shadows
    const sunLight = new THREE.DirectionalLight(0xFFFBEB, 1.4);
    sunLight.position.set(-4, 5, 3);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 15;
    sunLight.shadow.bias = -0.001;
    scene.add(sunLight);

    // Warm indoor accent lamp
    const warmLight = new THREE.PointLight(0xFDBA74, 0.8, 8);
    warmLight.position.set(0.8, 2.8, -0.6);
    scene.add(warmLight);
  };

  // ---------------------------------------------------------------------------
  // 5. Playback Controller & Kinematic Animation Update Loop
  // ---------------------------------------------------------------------------
  const startSimulation = useCallback(() => {
    setIsEnded(false);
    setIsPlaying(true);
    playbackStartTimeRef.current = performance.now() - (progress / 100) * totalDuration * 1000;

    const renderLoop = (now) => {
      const elapsedMs = now - playbackStartTimeRef.current;
      const progressFraction = Math.min(1.0, elapsedMs / (totalDuration * 1000));
      const curSec = progressFraction * totalDuration;

      setProgress(progressFraction * 100);
      setCurrentTimeSec(curSec);

      // Update 3D kinematics, props, and camera director
      updateSceneTimeline(progressFraction, curSec);

      // Render 3D frame
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      if (progressFraction < 1.0) {
        animFrameRef.current = requestAnimationFrame(renderLoop);
      } else {
        setIsPlaying(false);
        setIsEnded(true);
        if (typeof onSceneEnded === 'function') {
          onSceneEnded();
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);
  }, [totalDuration, progress, onSceneEnded]);

  const pauseSimulation = () => {
    setIsPlaying(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  };

  const handleReplayClick = () => {
    if (replaysRemaining <= 0) return;
    if (typeof onReplayUsed === 'function') onReplayUsed();
    setProgress(0);
    setCurrentTimeSec(0);
    setIsEnded(false);
    startSimulation();
  };

  // ---------------------------------------------------------------------------
  // 6. Update 3D Character Actions & Cinematic Camera Interpolation
  // ---------------------------------------------------------------------------
  const updateSceneTimeline = (t, curSec) => {
    const char = characterRef.current;
    const camera = cameraRef.current;
    const objs = sceneObjectsRef.current;
    if (!char || !camera) return;

    // Update Live Subtitle from Scene Events
    if (sceneDef?.events) {
      const activeEvent = [...sceneDef.events].reverse().find(e => curSec >= e.time);
      if (activeEvent) {
        const desc = typeof activeEvent.description === 'object'
          ? (activeEvent.description[language] || activeEvent.description.en)
          : activeEvent.description;
        setCurrentCaption(desc || '');
      }
    }

    // -------------------------------------------------------------------------
    // Scenario 1: Kitchen Morning Timeline (10 seconds)
    // -------------------------------------------------------------------------
    if (activeSceneType === SCENE_TYPES.KITCHEN_MORNING) {
      // Phase 1 (0.0 - 0.28): Enter room & walk to countertop
      if (t < 0.28) {
        const walkProg = t / 0.28;
        char.root.position.x = -3.2 + walkProg * 1.8; // Move from -3.2 to -1.4
        char.root.position.z = 0.5 - walkProg * 0.9;
        char.root.rotation.y = 0;

        // Walking gait animation
        const gaitPhase = Math.sin(walkProg * Math.PI * 8);
        char.rLeg.rotation.x = gaitPhase * 0.45;
        char.lLeg.rotation.x = -gaitPhase * 0.45;
        char.rArm.rotation.x = -gaitPhase * 0.4;
        char.lArm.rotation.x = gaitPhase * 0.4;
        char.root.position.y = Math.abs(Math.sin(walkProg * Math.PI * 8)) * 0.04;

        // Camera: Smooth dolly in
        camera.position.set(-0.5 + walkProg * 0.3, 1.6, 4.0 - walkProg * 0.8);
        camera.lookAt(-1.2, 1.1, -0.6);
      }

      // Phase 2 (0.28 - 0.45): Pick up Red Cup
      else if (t < 0.45) {
        const reachProg = (t - 0.28) / 0.17;
        char.rLeg.rotation.x = 0;
        char.lLeg.rotation.x = 0;
        char.root.position.y = 0;

        // Right arm reaches towards cup on counter
        char.rArm.rotation.x = -Math.sin(reachProg * Math.PI) * 0.7;
        char.rArm.rotation.z = Math.sin(reachProg * Math.PI) * 0.2;

        // Attach cup to hand when grasping
        if (reachProg > 0.4 && objs.redCup) {
          objs.redCup.position.set(-1.4, 0.96 + Math.sin(reachProg * Math.PI) * 0.15, -0.9);
        }

        // Camera: Focus on countertop
        camera.position.set(-1.0, 1.5, 2.5);
        camera.lookAt(-1.4, 1.0, -0.8);
      }

      // Phase 3 (0.45 - 0.62): Pour Water from Pitcher into Cup
      else if (t < 0.62) {
        const pourProg = (t - 0.45) / 0.17;
        // Left arm tilts glass pitcher
        if (objs.waterPitcher) {
          objs.waterPitcher.rotation.z = Math.sin(pourProg * Math.PI) * 0.45;
        }

        // Camera: Close-up on liquid pouring
        camera.position.set(-1.2, 1.4, 2.2);
        camera.lookAt(-1.5, 1.0, -0.9);
      }

      // Phase 4 (0.62 - 0.78): Walk to Dining Table and Place Cup Beside Plate
      else if (t < 0.78) {
        const placeProg = (t - 0.62) / 0.16;
        char.root.position.x = -1.4 + placeProg * 1.8; // Move to table
        char.root.position.z = -0.4 + placeProg * 0.2;

        // Cup follows hand to table beside plate
        if (objs.redCup) {
          const cupTargetX = 0.5 + 0.22; // beside white plate
          objs.redCup.position.x = -1.4 + placeProg * (cupTargetX - (-1.4));
          objs.redCup.position.y = 0.83;
          objs.redCup.position.z = -0.6;
        }

        // Camera: Pan to dining table
        camera.position.set(0.2, 1.5, 2.6);
        camera.lookAt(0.7, 0.9, -0.6);
      }

      // Phase 5 (0.78 - 0.90): Open Cabinet & Take Medicine Bottle
      else if (t < 0.90) {
        const cabProg = (t - 0.78) / 0.12;
        // Cabinet door swings open
        if (objs.cabinetHinge) {
          objs.cabinetHinge.rotation.y = -Math.sin(cabProg * Math.PI * 0.5) * 1.4;
        }
        // Arm reaches and retrieves amber medicine bottle
        if (objs.medicineBottle && cabProg > 0.4) {
          objs.medicineBottle.position.y = 2.05 - (cabProg - 0.4) * 0.8;
          objs.medicineBottle.position.x = 0.4;
          objs.medicineBottle.position.z = -0.6;
        }

        camera.position.set(-0.2, 1.7, 2.8);
        camera.lookAt(-1.2, 1.8, -1.0);
      }

      // Phase 6 (0.90 - 1.0): Sit Down on Dining Chair
      else {
        const sitProg = (t - 0.90) / 0.10;
        char.root.position.set(1.4, 0 - sitProg * 0.25, -0.6);
        char.root.rotation.y = -Math.PI / 2;
        char.rLeg.rotation.x = sitProg * Math.PI * 0.45;
        char.lLeg.rotation.x = sitProg * Math.PI * 0.45;

        // Camera: Wide settling calm shot
        camera.position.set(0.5, 1.5, 3.2);
        camera.lookAt(0.9, 0.8, -0.6);
      }
    }

    // -------------------------------------------------------------------------
    // Scenario 2: Grocery Market Timeline
    // -------------------------------------------------------------------------
    else if (activeSceneType === SCENE_TYPES.GROCERY_MARKET) {
      const walkProg = Math.min(1.0, t * 1.5);
      char.root.position.x = -2.5 + walkProg * 1.6;
      camera.position.set(-0.5, 1.6, 3.6);
      camera.lookAt(-0.8, 1.0, -0.5);
    }

    // -------------------------------------------------------------------------
    // Scenario 3: Café Social Timeline
    // -------------------------------------------------------------------------
    else if (activeSceneType === SCENE_TYPES.CAFE_SOCIAL) {
      camera.position.set(0, 1.5, 2.8);
      camera.lookAt(0, 0.8, -0.6);
    }

    // -------------------------------------------------------------------------
    // Scenario 4: Living Room Difference Timeline
    // -------------------------------------------------------------------------
    else if (activeSceneType === SCENE_TYPES.LIVING_ROOM_DIFFERENCE) {
      if (t > 0.5 && objs.cushionMat) {
        objs.cushionMat.color.setHex(0xEAB308); // Changes to yellow
      }
      camera.position.set(0, 1.5, 3.2);
      camera.lookAt(0, 0.8, -1.2);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto space-y-3 select-none">
      {/* 1. Elderly Instruction Banner */}
      <div className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-teal-50/90 dark:bg-teal-950/40 border-2 border-teal-300 dark:border-teal-800/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-xs">
            <Eye className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white leading-tight">
              {t('games.memorymotion.watchPrompt') || 'Watch carefully • Remember what happens.'}
            </h3>
            <p className="text-xs md:text-sm font-semibold text-teal-800 dark:text-teal-300">
              {typeof sceneDef?.name === 'object' ? (sceneDef.name[language] || sceneDef.name.en) : sceneDef?.name} • {totalDuration}s
            </p>
          </div>
        </div>

        {replaysRemaining > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-2xs">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{replaysRemaining} {t('games.memorymotion.replaysLeft') || 'replay left'}</span>
          </span>
        )}
      </div>

      {/* 2. 3D WebGL Canvas Container */}
      <div className="relative w-full aspect-video rounded-3xl overflow-hidden border-3 border-slate-300 dark:border-[#243352] shadow-2xl bg-slate-900">
        <div ref={mountRef} className="w-full h-full" />

        {/* Top 3D Simulation Tag */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-extrabold border border-teal-500/50 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>3D Cognitive Simulation &bull; 60 FPS</span>
        </div>

        {/* Live Subtitle Bar for Elderly Accessibility */}
        {showSubtitles && currentCaption && (
          <div className="absolute bottom-14 left-4 right-4 text-center">
            <span className="inline-block px-4 py-2 rounded-2xl bg-slate-950/85 backdrop-blur-md text-white text-sm md:text-base font-bold shadow-lg border border-slate-700/60 leading-snug max-w-xl">
              {currentCaption}
            </span>
          </div>
        )}

        {/* Playback Controls Overlay (Bottom bar) */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent p-3 flex flex-col gap-2">
          {/* Progress Timeline */}
          <div className="w-full h-2 bg-slate-700/80 rounded-full overflow-hidden cursor-pointer">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-white text-xs font-bold">
            <div className="flex items-center gap-3">
              {/* Play / Pause Toggle */}
              <button
                type="button"
                onClick={isPlaying ? pauseSimulation : startSimulation}
                className="w-8 h-8 rounded-xl bg-teal-600 hover:bg-teal-500 flex items-center justify-center text-white transition-transform active:scale-95 cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
              </button>

              {/* Replay */}
              <button
                type="button"
                onClick={handleReplayClick}
                disabled={replaysRemaining <= 0}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                  replaysRemaining > 0
                    ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600 cursor-pointer'
                    : 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay</span>
              </button>

              <span>{currentTimeSec.toFixed(1)}s / {totalDuration}s</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Subtitles Toggle */}
              <button
                type="button"
                onClick={() => setShowSubtitles(s => !s)}
                className={`p-1.5 rounded-lg border ${
                  showSubtitles
                    ? 'bg-teal-600/40 text-teal-300 border-teal-400'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title="Toggle Captions"
              >
                <Subtitles className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Video Ended Transition Overlay */}
        {isEnded && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white space-y-3 animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-teal-600/90 text-white flex items-center justify-center shadow-lg">
              <Eye className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-extrabold font-display">
              {t('games.memorymotion.sceneFinished') || 'Scene Completed!'}
            </h3>
            <p className="text-slate-300 text-sm max-w-md font-medium">
              {t('games.memorymotion.readyPrompt') || 'Take a breath. Now answer questions about what you just observed.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
