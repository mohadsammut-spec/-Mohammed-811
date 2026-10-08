import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CameraView, TruckConfig, WeatherType } from '../../types/game';
import { truckAudio } from '../../services/sound';

export interface DriveInputState {
  throttle: boolean;
  brake: boolean;
  steerLeft: boolean;
  steerRight: boolean;
  handbrake: boolean;
}

interface TruckCanvasProps {
  truckConfig: TruckConfig;
  cargoWeightTons: number;
  trailerType: string;
  weather: WeatherType;
  cameraView: CameraView;
  isEngineStarted: boolean;
  isWipersActive: boolean;
  isHeadlightsActive: boolean;
  isMuted: boolean;
  driveInputs?: DriveInputState;
  onSpeedUpdate: (speedKmH: number, rpm: number, gear: number | string) => void;
  onInfraction: (type: 'speeding' | 'collision', fineAmount: number) => void;
  onFuelConsume: (litersUsed: number) => void;
  onFatigueIncrease: (amount: number) => void;
  onDamageIncrease: (truckDmg: number, cargoDmg: number) => void;
  onDistanceTravelled: (kmDelta: number) => void;
  onNearGasStation: (near: boolean) => void;
  onNearRestStop: (near: boolean) => void;
}

export const TruckCanvas: React.FC<TruckCanvasProps> = ({
  truckConfig,
  cargoWeightTons,
  trailerType,
  weather,
  cameraView,
  isEngineStarted,
  isWipersActive,
  isHeadlightsActive,
  isMuted,
  driveInputs,
  onSpeedUpdate,
  onInfraction,
  onFuelConsume,
  onFatigueIncrease,
  onDamageIncrease,
  onDistanceTravelled,
  onNearGasStation,
  onNearRestStop,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Keyboard state
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Dynamic simulation variables in refs for smooth 60fps loop
  const simState = useRef({
    speed: 0, // km/h
    targetSpeed: 0,
    steeringAngle: 0,
    truckX: 0, // lateral position on road (-6 to +6)
    truckZ: 0, // longitudinal distance
    trailerAngle: 0, // angle between truck and trailer
    gear: 1,
    rpm: 800,
    radarCooldown: 0,
    crashCooldown: 0,
    lastTrafficSpawn: 0,
  });

  // Keep latest props in refs to avoid recreating the Three.js scene
  const propsRef = useRef({
    truckConfig,
    cargoWeightTons,
    trailerType,
    weather,
    cameraView,
    isEngineStarted,
    isWipersActive,
    isHeadlightsActive,
    isMuted,
    driveInputs,
  });

  useEffect(() => {
    propsRef.current = {
      truckConfig,
      cargoWeightTons,
      trailerType,
      weather,
      cameraView,
      isEngineStarted,
      isWipersActive,
      isHeadlightsActive,
      isMuted,
      driveInputs,
    };
    truckAudio.setMuted(isMuted);
  }, [truckConfig, cargoWeightTons, trailerType, weather, cameraView, isEngineStarted, isWipersActive, isHeadlightsActive, isMuted, driveInputs]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      keysRef.current[e.code] = true;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
      }
      if (e.key.toLowerCase() === 'h') {
        truckAudio.playHorn();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Set up Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animationFrameId: number;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // SCENE
    const scene = new THREE.Scene();

    // CAMERA
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 5, 14);

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // AMBIENT & SUN LIGHT
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff7e6, 1.2);
    dirLight.position.set(40, 60, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.camera.left = -40;
    dirLight.shadow.camera.right = 40;
    dirLight.shadow.camera.top = 40;
    dirLight.shadow.camera.bottom = -40;
    scene.add(dirLight);

    // SKY & FOG
    const setEnvironmentForWeather = (w: WeatherType) => {
      if (w === 'night') {
        scene.background = new THREE.Color(0x05070f);
        scene.fog = new THREE.FogExp2(0x05070f, 0.007);
        ambientLight.intensity = 0.15;
        dirLight.intensity = 0.2;
        dirLight.color.setHex(0x50658a);
      } else if (w === 'sunset') {
        scene.background = new THREE.Color(0xfd7e43);
        scene.fog = new THREE.FogExp2(0xe26034, 0.005);
        ambientLight.intensity = 0.5;
        dirLight.intensity = 1.0;
        dirLight.color.setHex(0xffaa5e);
      } else if (w === 'fog') {
        scene.background = new THREE.Color(0x94a3b8);
        scene.fog = new THREE.FogExp2(0x94a3b8, 0.022); // Dense fog
        ambientLight.intensity = 0.45;
        dirLight.intensity = 0.4;
      } else if (w === 'rain') {
        scene.background = new THREE.Color(0x28303d);
        scene.fog = new THREE.FogExp2(0x28303d, 0.012);
        ambientLight.intensity = 0.4;
        dirLight.intensity = 0.5;
      } else {
        // Clear day
        scene.background = new THREE.Color(0x70a5e9);
        scene.fog = new THREE.FogExp2(0x70a5e9, 0.0035);
        ambientLight.intensity = 0.7;
        dirLight.intensity = 1.3;
        dirLight.color.setHex(0xfff7e6);
      }
    };
    setEnvironmentForWeather(propsRef.current.weather);

    // TERRAIN & ROAD SYSTEM
    const terrainGroup = new THREE.Group();
    scene.add(terrainGroup);

    // Green Grass Ground
    const groundGeo = new THREE.PlaneGeometry(600, 600);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x2d4a22,
      roughness: 0.9,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    terrainGroup.add(groundMesh);

    // Asphalt Highway (width = 16 units, 4 lanes)
    const roadLength = 700;
    const roadGeo = new THREE.PlaneGeometry(16, roadLength);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x1f2421,
      roughness: 0.85,
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.y = 0.02;
    roadMesh.receiveShadow = true;
    terrainGroup.add(roadMesh);

    // Highway Road Markings (Dashed white lines)
    const markingGroup = new THREE.Group();
    terrainGroup.add(markingGroup);

    const dashGeo = new THREE.PlaneGeometry(0.3, 4);
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const solidYellowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    for (let z = -roadLength / 2; z < roadLength / 2; z += 10) {
      // Center dashed lane lines
      const dash1 = new THREE.Mesh(dashGeo, dashMat);
      dash1.rotation.x = -Math.PI / 2;
      dash1.position.set(-3.8, 0.03, z);
      markingGroup.add(dash1);

      const dash2 = new THREE.Mesh(dashGeo, dashMat);
      dash2.rotation.x = -Math.PI / 2;
      dash2.position.set(3.8, 0.03, z);
      markingGroup.add(dash2);
    }

    // Outer solid yellow guard lines
    const lineGeo = new THREE.PlaneGeometry(0.35, roadLength);
    const leftLine = new THREE.Mesh(lineGeo, solidYellowMat);
    leftLine.rotation.x = -Math.PI / 2;
    leftLine.position.set(-7.5, 0.03, 0);
    markingGroup.add(leftLine);

    const rightLine = new THREE.Mesh(lineGeo, solidYellowMat);
    rightLine.rotation.x = -Math.PI / 2;
    rightLine.position.set(7.5, 0.03, 0);
    markingGroup.add(rightLine);

    // Guard rails on both sides
    const guardrailMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
    const railGeo = new THREE.BoxGeometry(0.2, 0.6, roadLength);
    const leftRail = new THREE.Mesh(railGeo, guardrailMat);
    leftRail.position.set(-8.2, 0.6, 0);
    leftRail.castShadow = true;
    terrainGroup.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, guardrailMat);
    rightRail.position.set(8.2, 0.6, 0);
    rightRail.castShadow = true;
    terrainGroup.add(rightRail);

    // SCENERY: Alpine Trees, Street Lights, Distance Mountains
    const sceneryGroup = new THREE.Group();
    terrainGroup.add(sceneryGroup);

    // Simple procedural pine trees on roadside
    const treeTrunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 3, 6);
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.9 });
    const foliageGeo = new THREE.ConeGeometry(2.2, 6, 6);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x1b3b1e, roughness: 0.8 });

    for (let z = -roadLength / 2 + 20; z < roadLength / 2 - 20; z += 24) {
      // Left side trees
      const treeL = new THREE.Group();
      const trunkL = new THREE.Mesh(treeTrunkGeo, treeTrunkMat);
      trunkL.position.y = 1.5;
      const f1L = new THREE.Mesh(foliageGeo, foliageMat);
      f1L.position.y = 4.5;
      f1L.castShadow = true;
      treeL.add(trunkL);
      treeL.add(f1L);
      treeL.position.set(-14 - (Math.sin(z) * 6), 0, z);
      sceneryGroup.add(treeL);

      // Right side trees
      const treeR = new THREE.Group();
      const trunkR = new THREE.Mesh(treeTrunkGeo, treeTrunkMat);
      trunkR.position.y = 1.5;
      const f1R = new THREE.Mesh(foliageGeo, foliageMat);
      f1R.position.y = 4.5;
      f1R.castShadow = true;
      treeR.add(trunkR);
      treeR.add(f1R);
      treeR.position.set(14 + (Math.cos(z) * 6), 0, z);
      sceneryGroup.add(treeR);
    }

    // Street Lamps along highway
    const streetLights: THREE.SpotLight[] = [];
    const lampPoleGeo = new THREE.CylinderGeometry(0.12, 0.15, 9, 8);
    const lampArmGeo = new THREE.BoxGeometry(2.5, 0.15, 0.15);
    const lampHeadGeo = new THREE.BoxGeometry(0.8, 0.2, 0.4);
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 });

    for (let z = -250; z < 250; z += 65) {
      const lamp = new THREE.Group();
      const pole = new THREE.Mesh(lampPoleGeo, lampMat);
      pole.position.y = 4.5;
      const arm = new THREE.Mesh(lampArmGeo, lampMat);
      arm.position.set(1.1, 8.8, 0);
      const head = new THREE.Mesh(lampHeadGeo, lampMat);
      head.position.set(2.2, 8.7, 0);
      lamp.add(pole, arm, head);
      lamp.position.set(-9.5, 0, z);
      sceneryGroup.add(lamp);

      const spot = new THREE.SpotLight(0xfffaed, 0.8, 25, Math.PI / 4, 0.4);
      spot.position.set(-7.3, 8.7, z);
      spot.target.position.set(-3, 0, z);
      scene.add(spot.target);
      scene.add(spot);
      streetLights.push(spot);
    }

    // LANDMARKS: European Rest Stop & Gas Station & Speed Radar
    // 1. Gas Station (around z = -120)
    const gasStationGroup = new THREE.Group();
    gasStationGroup.position.set(18, 0, -120);

    const canopyGeo = new THREE.BoxGeometry(16, 1, 14);
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, metalness: 0.2 });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.y = 6;
    gasStationGroup.add(canopy);

    // Pillars
    const gasPillarGeo = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
    const gasPillarMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    [-6, 6].forEach((px) => {
      [-4, 4].forEach((pz) => {
        const pillar = new THREE.Mesh(gasPillarGeo, gasPillarMat);
        pillar.position.set(px, 3, pz);
        gasStationGroup.add(pillar);
      });
    });

    // Pumps
    const pumpGeo = new THREE.BoxGeometry(1.2, 2.4, 1.2);
    const pumpMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
    const p1 = new THREE.Mesh(pumpGeo, pumpMat);
    p1.position.set(-2, 1.2, 0);
    const p2 = new THREE.Mesh(pumpGeo, pumpMat);
    p2.position.set(2, 1.2, 0);
    gasStationGroup.add(p1, p2);

    // Gas Station Totem Sign
    const signGeo = new THREE.BoxGeometry(1.5, 8, 1);
    const signMat = new THREE.MeshStandardMaterial({ color: 0xe11d48 });
    const totem = new THREE.Mesh(signGeo, signMat);
    totem.position.set(-10, 4, 6);
    gasStationGroup.add(totem);
    sceneryGroup.add(gasStationGroup);

    // 2. Speed Camera Radar (at z = 80)
    const radarGroup = new THREE.Group();
    radarGroup.position.set(-9.2, 0, 80);
    const radarPole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 5, 8), lampMat);
    radarPole.position.y = 2.5;
    const radarBox = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.7), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
    radarBox.position.set(0, 4.8, 0);
    // Camera lens
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.2, 12), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, 4.8, -0.4);
    radarGroup.add(radarPole, radarBox, lens);
    sceneryGroup.add(radarGroup);

    // Flash light effect for speed camera
    const radarFlash = new THREE.PointLight(0xffffff, 0, 40);
    radarFlash.position.set(-9.2, 5, 80);
    scene.add(radarFlash);

    // 3. Rest Stop Hotel & Parking (at z = 220)
    const restStopGroup = new THREE.Group();
    restStopGroup.position.set(-20, 0, 220);
    const motelGeo = new THREE.BoxGeometry(20, 7, 12);
    const motelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
    const motel = new THREE.Mesh(motelGeo, motelMat);
    motel.position.y = 3.5;
    restStopGroup.add(motel);

    // Illuminated "REST / HOTEL" sign box
    const motelSign = new THREE.Mesh(new THREE.BoxGeometry(7, 1.8, 0.5), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    motelSign.position.set(0, 8, 5.8);
    restStopGroup.add(motelSign);
    sceneryGroup.add(restStopGroup);

    // -------------------------------------------------------------
    // BUILD 3D TRUCK & TRAILER (Procedural High-Fidelity European COE)
    // -------------------------------------------------------------
    const truckRoot = new THREE.Group();
    scene.add(truckRoot);

    // Primary materials
    const truckPaintMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(propsRef.current.truckConfig.color),
      metalness: 0.7,
      roughness: 0.25,
    });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95, roughness: 0.1 });
    const darkTrimMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.7 });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.7,
      transparent: true,
      opacity: 0.85,
    });
    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });

    // 1. Truck Cab Body
    const cabGroup = new THREE.Group();
    truckRoot.add(cabGroup);

    // Lower chassis frame
    const chassisLength = propsRef.current.truckConfig.chassis === '6x4' ? 7.6 : 6.2;
    const chassisFrame = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.45, chassisLength), darkTrimMat);
    chassisFrame.position.set(0, 0.7, 0.4);
    cabGroup.add(chassisFrame);

    // Fuel tanks (cylinders on sides)
    const tankGeo = new THREE.CylinderGeometry(0.42, 0.42, 2.6, 12);
    tankGeo.rotateX(Math.PI / 2);
    const leftTank = new THREE.Mesh(tankGeo, chromeMat);
    leftTank.position.set(-1.25, 0.65, 0.8);
    const rightTank = new THREE.Mesh(tankGeo, chromeMat);
    rightTank.position.set(1.25, 0.65, 0.8);
    cabGroup.add(leftTank, rightTank);

    // Cab main volume (European COE high roof)
    const cabMesh = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.1, 2.7), truckPaintMat);
    cabMesh.position.set(0, 2.45, -1.2);
    cabMesh.castShadow = true;
    cabGroup.add(cabMesh);

    // Aerodynamic roof deflector
    const deflectorGeo = new THREE.ConeGeometry(1.6, 0.8, 4);
    deflectorGeo.rotateY(Math.PI / 4);
    const roofDeflector = new THREE.Mesh(deflectorGeo, truckPaintMat);
    roofDeflector.position.set(0, 4.35, -1.2);
    roofDeflector.scale.set(1.3, 1, 1.4);
    cabGroup.add(roofDeflector);

    // Front Windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.25, 0.05), glassMat);
    windshield.position.set(0, 2.8, -2.57);
    windshield.rotation.x = -0.12;
    cabGroup.add(windshield);

    // Side windows
    const sideWinL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.9, 1.4), glassMat);
    sideWinL.position.set(-1.27, 2.8, -1.2);
    const sideWinR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.9, 1.4), glassMat);
    sideWinR.position.set(1.27, 2.8, -1.2);
    cabGroup.add(sideWinL, sideWinR);

    // Chrome Radiator Grille
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.3, 0.1), chromeMat);
    grille.position.set(0, 1.55, -2.56);
    cabGroup.add(grille);

    // Front Bumper
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.55, 0.35), darkTrimMat);
    bumper.position.set(0, 0.75, -2.55);
    cabGroup.add(bumper);

    // Headlights
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const headL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.22, 0.1), headlightMat);
    headL.position.set(-0.95, 0.75, -2.73);
    const headR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.22, 0.1), headlightMat);
    headR.position.set(0.95, 0.75, -2.73);
    cabGroup.add(headL, headR);

    // Dynamic forward spotlight beams
    const spotL = new THREE.SpotLight(0xfff8eb, 2.5, 60, Math.PI / 5, 0.35);
    spotL.position.set(-0.95, 0.8, -2.8);
    spotL.target.position.set(-0.95, 0, -35);
    scene.add(spotL.target);
    cabGroup.add(spotL);

    const spotR = new THREE.SpotLight(0xfff8eb, 2.5, 60, Math.PI / 5, 0.35);
    spotR.position.set(0.95, 0.8, -2.8);
    spotR.target.position.set(0.95, 0, -35);
    scene.add(spotR.target);
    cabGroup.add(spotR);

    // Side Mirrors
    const mirrorArmGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5);
    const mirrorHeadGeo = new THREE.BoxGeometry(0.2, 0.55, 0.15);
    const mirrorGlassMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });

    const mirrorL = new THREE.Group();
    const mHeadL = new THREE.Mesh(mirrorHeadGeo, darkTrimMat);
    const mGlassL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.02), mirrorGlassMat);
    mGlassL.position.z = 0.08;
    mirrorL.add(mHeadL, mGlassL);
    mirrorL.position.set(-1.45, 2.6, -2.2);
    cabGroup.add(mirrorL);

    const mirrorR = new THREE.Group();
    const mHeadR = new THREE.Mesh(mirrorHeadGeo, darkTrimMat);
    const mGlassR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.02), mirrorGlassMat);
    mGlassR.position.z = 0.08;
    mirrorR.add(mHeadR, mGlassR);
    mirrorR.position.set(1.45, 2.6, -2.2);
    cabGroup.add(mirrorR);

    // Windshield Wipers
    const wiperMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const wiperArmGeo = new THREE.BoxGeometry(0.04, 0.65, 0.03);
    const wiperL = new THREE.Mesh(wiperArmGeo, wiperMat);
    wiperL.position.set(-0.45, 2.4, -2.62);
    wiperL.rotation.z = 0.2;
    const wiperR = new THREE.Mesh(wiperArmGeo, wiperMat);
    wiperR.position.set(0.45, 2.4, -2.62);
    wiperR.rotation.z = 0.2;
    cabGroup.add(wiperL, wiperR);

    // Interior Steering Wheel & Dashboard (visible in cockpit)
    const steerGroup = new THREE.Group();
    steerGroup.position.set(-0.55, 2.1, -2.05);
    const steerTorus = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.035, 8, 20), darkTrimMat);
    steerTorus.rotation.x = Math.PI / 3;
    steerGroup.add(steerTorus);
    cabGroup.add(steerGroup);

    // Dashboard Glow Screen (GPS)
    const dashGPS = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.02), new THREE.MeshBasicMaterial({ color: 0x0284c7 }));
    dashGPS.position.set(0, 2.05, -2.2);
    dashGPS.rotation.x = -0.2;
    cabGroup.add(dashGPS);

    // UPGRADES: Bullbar, Roof light bar, Dual Vertical Exhausts
    const bullbarGroup = new THREE.Group();
    if (propsRef.current.truckConfig.hasBullbar) {
      const barTube = new THREE.CylinderGeometry(0.05, 0.05, 2.3);
      barTube.rotateZ(Math.PI / 2);
      const b1 = new THREE.Mesh(barTube, chromeMat);
      b1.position.set(0, 0.9, -2.78);
      const b2 = new THREE.Mesh(barTube, chromeMat);
      b2.position.set(0, 1.4, -2.78);
      bullbarGroup.add(b1, b2);
      cabGroup.add(bullbarGroup);
    }

    const roofLightsGroup = new THREE.Group();
    if (propsRef.current.truckConfig.hasRoofLightbar) {
      const roofBar = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 0.1), chromeMat);
      roofBar.position.set(0, 4.05, -2.1);
      roofLightsGroup.add(roofBar);
      [-0.7, -0.25, 0.25, 0.7].forEach((lx) => {
        const spotBulb = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.15, 8), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
        spotBulb.rotateX(Math.PI / 2);
        spotBulb.position.set(lx, 4.15, -2.1);
        roofLightsGroup.add(spotBulb);
      });
      cabGroup.add(roofLightsGroup);
    }

    const exhaustsGroup = new THREE.Group();
    if (propsRef.current.truckConfig.hasDualExhaust) {
      const pipeGeo = new THREE.CylinderGeometry(0.09, 0.09, 3.2, 10);
      const pipeL = new THREE.Mesh(pipeGeo, chromeMat);
      pipeL.position.set(-1.1, 3.2, 0.35);
      const pipeR = new THREE.Mesh(pipeGeo, chromeMat);
      pipeR.position.set(1.1, 3.2, 0.35);
      exhaustsGroup.add(pipeL, pipeR);
      cabGroup.add(exhaustsGroup);
    }

    // Wheels (Front axle + Rear tandem axles)
    const wheelMeshes: THREE.Mesh[] = [];
    const wheelGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.42, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const rimMat = chromeMat;

    const createWheel = (x: number, y: number, z: number) => {
      const wGroup = new THREE.Group();
      const tire = new THREE.Mesh(wheelGeo, rubberMat);
      tire.castShadow = true;
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.43, 12), rimMat);
      rim.rotateZ(Math.PI / 2);
      wGroup.add(tire, rim);
      wGroup.position.set(x, y, z);
      cabGroup.add(wGroup);
      wheelMeshes.push(tire);
      return wGroup;
    };

    // Front steering axle
    createWheel(-1.18, 0.52, -1.8);
    createWheel(1.18, 0.52, -1.8);

    // Rear drive axle 1
    createWheel(-1.18, 0.52, 1.4);
    createWheel(1.18, 0.52, 1.4);

    // Extra rear axle for 6x2 / 6x4
    if (propsRef.current.truckConfig.chassis !== '4x2') {
      createWheel(-1.18, 0.52, 2.7);
      createWheel(1.18, 0.52, 2.7);
    }

    // -------------------------------------------------------------
    // ARTICULATED TRAILER (Pivot Joint)
    // -------------------------------------------------------------
    const trailerRoot = new THREE.Group();
    scene.add(trailerRoot);

    // Fifth wheel hitch position behind cab
    const hitchOffsetZ = 1.6;

    // Trailer Body
    const trailerColor = 0x2563eb; // Default royal logistics blue
    const trailerMat = new THREE.MeshStandardMaterial({
      color: propsRef.current.trailerType === 'tanker' ? 0xd1d5db : trailerColor,
      metalness: propsRef.current.trailerType === 'tanker' ? 0.85 : 0.2,
      roughness: 0.35,
    });

    let trailerMesh: THREE.Object3D;
    if (propsRef.current.trailerType === 'tanker') {
      const cylGeo = new THREE.CylinderGeometry(1.35, 1.35, 11, 20);
      cylGeo.rotateX(Math.PI / 2);
      trailerMesh = new THREE.Mesh(cylGeo, trailerMat);
      trailerMesh.position.set(0, 2.3, 6);
    } else if (propsRef.current.trailerType === 'flatbed') {
      const flatGroup = new THREE.Group();
      const bed = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.4, 11), darkTrimMat);
      bed.position.set(0, 1.2, 6);
      flatGroup.add(bed);
      // Heavy machinery cargo on bed
      const turbine = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 7, 16), new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.7 }));
      turbine.rotateX(Math.PI / 2);
      turbine.position.set(0, 2.2, 6);
      flatGroup.add(turbine);
      trailerMesh = flatGroup;
    } else {
      // Standard Euro Curtain / Refrigerated Box Trailer
      const boxGeo = new THREE.BoxGeometry(2.55, 3.2, 11);
      trailerMesh = new THREE.Mesh(boxGeo, trailerMat);
      trailerMesh.position.set(0, 2.5, 6);
    }
    trailerMesh.castShadow = true;
    trailerRoot.add(trailerMesh);

    // Trailer triple rear axles
    [8.8, 10.0, 11.2].forEach((tz) => {
      const tWLeft = new THREE.Mesh(wheelGeo, rubberMat);
      tWLeft.position.set(-1.18, 0.52, tz);
      const tWRight = new THREE.Mesh(wheelGeo, rubberMat);
      tWRight.position.set(1.18, 0.52, tz);
      trailerRoot.add(tWLeft, tWRight);
      wheelMeshes.push(tWLeft, tWRight);
    });

    // Trailer Rear Brake lights
    const brakeLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const tBrakeL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.05), brakeLightMat);
    tBrakeL.position.set(-0.95, 0.9, 11.55);
    const tBrakeR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.05), brakeLightMat);
    tBrakeR.position.set(0.95, 0.9, 11.55);
    trailerRoot.add(tBrakeL, tBrakeR);

    // -------------------------------------------------------------
    // DYNAMIC TRAFFIC CARS (Cars driving on adjacent lanes)
    // -------------------------------------------------------------
    const trafficCars: { mesh: THREE.Group; speed: number; laneX: number; z: number }[] = [];
    const carColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf1f5f9, 0x111827];

    const spawnTrafficCar = (laneX: number, zPos: number, speedVal: number) => {
      const carGroup = new THREE.Group();
      const carMat = new THREE.MeshStandardMaterial({
        color: carColors[Math.floor(Math.random() * carColors.length)],
        metalness: 0.6,
        roughness: 0.3,
      });

      const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 4.0), carMat);
      body.position.y = 0.55;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 2.2), glassMat);
      cabin.position.set(0, 1.15, -0.2);
      carGroup.add(body, cabin);

      // Tail lights
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.05), brakeLightMat);
      tl.position.set(-0.65, 0.55, 2.02);
      const tr = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.05), brakeLightMat);
      tr.position.set(0.65, 0.55, 2.02);
      carGroup.add(tl, tr);

      carGroup.position.set(laneX, 0, zPos);
      scene.add(carGroup);
      trafficCars.push({ mesh: carGroup, speed: speedVal, laneX, z: zPos });
    };

    // Pre-populate some traffic
    spawnTrafficCar(-3.8, -60, 75);
    spawnTrafficCar(3.8, -130, 85);
    spawnTrafficCar(-3.8, 110, 70);

    // -------------------------------------------------------------
    // RAIN PARTICLES SYSTEM
    // -------------------------------------------------------------
    const rainCount = 1800;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount * 3; i += 3) {
      rainPositions[i] = (Math.random() - 0.5) * 80;
      rainPositions[i + 1] = Math.random() * 40;
      rainPositions[i + 2] = (Math.random() - 0.5) * 120;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.18,
      transparent: true,
      opacity: 0.7,
    });
    const rainParticles = new THREE.Points(rainGeo, rainMat);
    scene.add(rainParticles);
    rainParticles.visible = propsRef.current.weather === 'rain';

    // -------------------------------------------------------------
    // MAIN SIMULATION ANIMATION LOOP
    // -------------------------------------------------------------
    let lastTime = performance.now();
    let wiperAngle = 0;
    let wiperDirection = 1;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const deltaSec = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const p = propsRef.current;
      const sim = simState.current;
      const keys = keysRef.current;

      // Update weather visuals dynamically
      setEnvironmentForWeather(p.weather);
      rainParticles.visible = p.weather === 'rain';
      truckAudio.setRain(p.weather === 'rain');

      // Headlight beams
      spotL.intensity = p.isHeadlightsActive ? 2.8 : 0;
      spotR.intensity = p.isHeadlightsActive ? 2.8 : 0;

      // Windshield Wipers Animation
      if (p.isWipersActive) {
        wiperAngle += deltaSec * 4.5 * wiperDirection;
        if (wiperAngle > 0.85) {
          wiperAngle = 0.85;
          wiperDirection = -1;
        } else if (wiperAngle < -0.2) {
          wiperAngle = -0.2;
          wiperDirection = 1;
        }
        wiperL.rotation.z = wiperAngle;
        wiperR.rotation.z = wiperAngle;
      }

      // Driving input & physics (keyboard + touch/on-screen controls)
      const isThrottle = ((keys['w'] || keys['arrowup']) || Boolean(p.driveInputs?.throttle)) && p.isEngineStarted;
      const isBraking = keys['s'] || keys['arrowdown'] || Boolean(p.driveInputs?.brake);
      const isHandbrake = keys[' '] || keys['space'] || Boolean(p.driveInputs?.handbrake);
      const isSteerLeft = keys['a'] || keys['arrowleft'] || Boolean(p.driveInputs?.steerLeft);
      const isSteerRight = keys['d'] || keys['arrowright'] || Boolean(p.driveInputs?.steerRight);

      // Engine acceleration calculation influenced by HP and Cargo weight
      // Heavier cargo = slower acceleration
      const weightFactor = 1 / (1 + p.cargoWeightTons * 0.025);
      const engineAccel = (p.truckConfig.engineHp / 550) * 16.0 * weightFactor; // km/h per sec
      const brakePower = isHandbrake ? 45.0 : 28.0;

      if (isThrottle) {
        const topSpeed = 95; // European truck limiter ~90-95 km/h
        sim.speed = Math.min(topSpeed, sim.speed + engineAccel * deltaSec);
      } else if (isBraking) {
        if (sim.speed > 0) {
          sim.speed = Math.max(0, sim.speed - brakePower * deltaSec);
          if (sim.speed < 1) {
            truckAudio.playAirBrake();
          }
        } else {
          // Reverse gear
          sim.speed = Math.max(-20, sim.speed - 8.0 * deltaSec);
        }
      } else {
        // Natural rolling resistance and aerodynamic drag
        if (sim.speed > 0) {
          sim.speed = Math.max(0, sim.speed - 4.5 * deltaSec);
        } else if (sim.speed < 0) {
          sim.speed = Math.min(0, sim.speed + 4.5 * deltaSec);
        }
      }

      // Steering
      const steerSpeed = 2.2 * deltaSec;
      if (isSteerLeft) {
        sim.steeringAngle = Math.max(-0.55, sim.steeringAngle - steerSpeed);
      } else if (isSteerRight) {
        sim.steeringAngle = Math.min(0.55, sim.steeringAngle + steerSpeed);
      } else {
        // Self-centering
        sim.steeringAngle *= Math.exp(-6 * deltaSec);
      }

      // Lateral motion (Truck X)
      const forwardMovement = (sim.speed / 3.6) * deltaSec; // meters (ThreeJS units)
      sim.truckX += sim.steeringAngle * forwardMovement * 0.5;

      // Keep truck on highway boundaries (-7.2 to +7.2)
      if (Math.abs(sim.truckX) > 7.2) {
        sim.truckX = Math.sign(sim.truckX) * 7.2;
        // Collision with guard rail!
        if (Math.abs(sim.speed) > 15 && sim.crashCooldown <= 0) {
          truckAudio.playCrash();
          onDamageIncrease(4.5, 3.0);
          sim.speed *= 0.5;
          sim.crashCooldown = 1.5;
        }
      }

      // Animate Steering wheel in cab
      steerGroup.rotation.z = -sim.steeringAngle * 2.8;

      // Rotate wheels
      const wheelRotDelta = (sim.speed / 3.6) * deltaSec / 0.52;
      wheelMeshes.forEach((w) => {
        w.rotation.x += wheelRotDelta;
      });

      // Move world relative to truck (infinite road effect)
      // We keep the truck at Z = 0 and scroll the terrain & scenery backwards
      const roadScroll = forwardMovement;
      markingGroup.position.z += roadScroll;
      sceneryGroup.position.z += roadScroll;
      if (markingGroup.position.z > 20) {
        markingGroup.position.z -= 20;
      }

      // Accumulate real distance travelled
      const kmDelta = (Math.abs(sim.speed) * deltaSec) / 3600;
      onDistanceTravelled(kmDelta);

      // Fuel consumption: higher at high RPM / heavy load
      if (p.isEngineStarted) {
        const rpmNorm = Math.min(1, Math.max(0.1, Math.abs(sim.speed) / 90));
        const fuelLitersDelta = (0.012 + rpmNorm * 0.038) * (1 + p.cargoWeightTons * 0.015) * deltaSec;
        onFuelConsume(fuelLitersDelta);
        onFatigueIncrease(deltaSec * 0.05); // increases ~3% per minute
      }

      // Update Engine Sound & RPM
      const rpm = p.isEngineStarted ? 650 + (Math.abs(sim.speed) / 95) * 1600 : 0;
      sim.rpm = rpm;
      truckAudio.updateEngineRPM(rpm / 2300);

      // Compute Gear
      let currentGear: number | string = 1;
      if (sim.speed < -0.5) currentGear = 'R';
      else if (!p.isEngineStarted || Math.abs(sim.speed) < 0.5) currentGear = 'N';
      else {
        currentGear = Math.min(p.truckConfig.transmissionGears, Math.max(1, Math.ceil(sim.speed / (95 / p.truckConfig.transmissionGears))));
      }

      onSpeedUpdate(Math.round(sim.speed), Math.round(rpm), currentGear);

      // Articulated Trailer Physics (Trailer lags behind truck hitch)
      // Hitch is at (truckX, 0, hitchOffsetZ)
      const targetTrailerAngle = sim.steeringAngle * 0.65;
      sim.trailerAngle += (targetTrailerAngle - sim.trailerAngle) * Math.min(1, deltaSec * 3.5);

      truckRoot.position.set(sim.truckX, 0, 0);
      truckRoot.rotation.y = -sim.steeringAngle * 0.35;

      trailerRoot.position.set(
        sim.truckX + Math.sin(sim.trailerAngle) * 1.5,
        0,
        hitchOffsetZ
      );
      trailerRoot.rotation.y = sim.trailerAngle;

      // Update Traffic Cars
      trafficCars.forEach((tc) => {
        // Relative speed difference
        const relSpeed = (tc.speed - sim.speed) / 3.6;
        tc.z -= relSpeed * deltaSec;

        // Loop traffic if too far ahead or behind
        if (tc.z < -200) tc.z = 220;
        if (tc.z > 220) tc.z = -200;

        tc.mesh.position.set(tc.laneX, 0, tc.z);

        // Check collision between truck and traffic car
        const dx = Math.abs(sim.truckX - tc.laneX);
        const dz = Math.abs(tc.z); // truck is at z ~ 0
        if (dx < 2.0 && dz < 4.5 && sim.crashCooldown <= 0) {
          truckAudio.playCrash();
          onDamageIncrease(12, 10);
          onInfraction('collision', 350);
          sim.speed *= 0.4;
          sim.crashCooldown = 2.0;
        }
      });

      if (sim.crashCooldown > 0) sim.crashCooldown -= deltaSec;
      if (sim.radarCooldown > 0) sim.radarCooldown -= deltaSec;

      // Check proximity to landmarks (Gas Station at z = -120 in scenery, Rest Stop at z = 220)
      const currentSceneryZ = sceneryGroup.position.z;
      const gasWorldZ = -120 + currentSceneryZ;
      const restWorldZ = 220 + currentSceneryZ;
      const radarWorldZ = 80 + currentSceneryZ;

      onNearGasStation(Math.abs(gasWorldZ) < 25 && sim.speed < 15);
      onNearRestStop(Math.abs(restWorldZ) < 30 && sim.speed < 15);

      // Speed Radar Check
      if (Math.abs(radarWorldZ) < 8 && sim.speed > 80 && sim.radarCooldown <= 0) {
        // Speeding! European speed limit is 80 km/h for heavy trucks
        truckAudio.playRadarFine();
        radarFlash.intensity = 5;
        setTimeout(() => {
          radarFlash.intensity = 0;
        }, 150);
        onInfraction('speeding', 150);
        sim.radarCooldown = 15; // cooldown
      }

      // Rain particles falling down
      if (p.weather === 'rain') {
        const positions = rainGeo.attributes.position.array as Float32Array;
        for (let i = 1; i < rainCount * 3; i += 3) {
          positions[i] -= deltaSec * 35;
          if (positions[i] < 0) positions[i] = 40;
        }
        rainGeo.attributes.position.needsUpdate = true;
      }

      // -----------------------------------------------------------
      // CAMERA POSITIONING
      // -----------------------------------------------------------
      if (p.cameraView === 'cockpit') {
        // Position inside driver seat looking out windshield
        const eyeX = sim.truckX - 0.55;
        const eyeY = 2.75;
        const eyeZ = -1.3;
        camera.position.set(eyeX, eyeY, eyeZ);
        camera.lookAt(eyeX - sim.steeringAngle * 3, eyeY - 0.1, eyeZ - 30);
      } else if (p.cameraView === 'topdown') {
        // Tactical top-down view
        camera.position.set(sim.truckX, 32, 10);
        camera.lookAt(sim.truckX, 0, -10);
      } else if (p.cameraView === 'hood') {
        // Front bumper view
        camera.position.set(sim.truckX, 1.2, -2.8);
        camera.lookAt(sim.truckX, 1.0, -40);
      } else {
        // Chase Camera (Third Person behind the truck & trailer)
        const targetCamX = sim.truckX * 0.7;
        const targetCamY = 5.2;
        const targetCamZ = 16.5;

        // Smooth lerping
        camera.position.x += (targetCamX - camera.position.x) * 0.1;
        camera.position.y += (targetCamY - camera.position.y) * 0.1;
        camera.position.z += (targetCamZ - camera.position.z) * 0.1;
        camera.lookAt(sim.truckX, 2.2, -10);
      }

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      truckAudio.stopEngine();
      truckAudio.setRain(false);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []); // Run on mount

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full overflow-hidden select-none bg-neutral-950"
    />
  );
};
