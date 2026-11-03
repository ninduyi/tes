/**
 * World Scene & Environment Manager (Dual Theme: Dark Default & Light Mode)
 * Menampilkan dunia 3D interaktif:
 * - Mode Gelap (Default): Latar angkasa malam magis (0x07060f), pencahayaan kristal lembut, grid indigo
 * - Mode Terang: Latar langit biru cerah (0x82d4f8), matahari hangat, awan melayang
 * - Titik kuning bercahaya = mangsa dengan pendaran cahaya radial dan label "Mangsa"
 * - Klik di area 3D manapun untuk memindahkan mangsa secara presisi
 */

function safeRoundRect(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  }
}

class WorldSceneManager {
  constructor(containerElement, onPreyMovedCallback) {
    this.container = containerElement;
    this.onPreyMoved = onPreyMovedCallback;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    this.currentTheme = 'dark'; // 'dark' (Default) | 'light'
    this.currentEnv = 'cavern';  // 'cavern' (Pulau Kristal) | 'warung' (Warung Kota)

    this.envGroups = {
      cavern: new THREE.Group(),
      warung: new THREE.Group()
    };

    this.preyGroup = null;
    this.preyPosition = new THREE.Vector3(0, 3.5, 0);
    this.preyWingPhase = 0;
    this.preyLight = null;
    this.preyGlowSprite = null;

    this.cameraMode = 'free';
    this.alphaBatRef = null;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.groundPlanes = [];

    this.floatingClouds = [];
    this.dustParticles = null;
    this.stars = null;

    this.lights = {
      ambient: null,
      directional: null,
      hemi: null
    };

    this.initThree();
    this.setupLighting();
    this.buildEnvironments();
    this.createGlowingPreyModel();
    this.createAtmosphericElements();
    this.setupRaycasting();

    this.setTheme('dark'); // Default Mode Gelap
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07060f);
    this.scene.fog = new THREE.FogExp2(0x07060f, 0.012);

    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.5, 250);
    this.camera.position.set(0, 22, 38);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.04;
      this.controls.minDistance = 6;
      this.controls.maxDistance = 90;
      this.controls.target.set(0, 3.0, 0);
    }

    window.addEventListener('resize', () => this.onWindowResize());
  }

  setupLighting() {
    // 1. Ambient Light
    this.lights.ambient = new THREE.AmbientLight(0x35316f, 1.2);
    this.scene.add(this.lights.ambient);

    // 2. Directional Light (Moonbeam / Sun)
    this.lights.directional = new THREE.DirectionalLight(0xd0cbff, 1.1);
    this.lights.directional.position.set(24, 45, 20);
    this.lights.directional.castShadow = true;
    this.lights.directional.shadow.mapSize.width = 2048;
    this.lights.directional.shadow.mapSize.height = 2048;
    this.lights.directional.shadow.camera.near = 0.5;
    this.lights.directional.shadow.camera.far = 100;
    const shadowDist = 28;
    this.lights.directional.shadow.camera.left = -shadowDist;
    this.lights.directional.shadow.camera.right = shadowDist;
    this.lights.directional.shadow.camera.top = shadowDist;
    this.lights.directional.shadow.camera.bottom = -shadowDist;
    this.lights.directional.shadow.bias = -0.0004;
    this.scene.add(this.lights.directional);

    // 3. Hemisphere Light (untuk mode terang)
    this.lights.hemi = new THREE.HemisphereLight(0xdff4fc, 0x93c572, 0.0);
    this.lights.hemi.position.set(0, 50, 0);
    this.scene.add(this.lights.hemi);
  }

  setTheme(themeName) {
    this.currentTheme = themeName;

    if (themeName === 'dark') {
      // Mode Gelap (Default)
      this.scene.background.setHex(0x07060f);
      this.scene.fog.color.setHex(0x07060f);
      this.scene.fog.density = 0.012;

      this.lights.ambient.color.setHex(0x35316f);
      this.lights.ambient.intensity = 1.2;

      this.lights.directional.color.setHex(0xd0cbff);
      this.lights.directional.intensity = 1.1;

      this.lights.hemi.intensity = 0.0;

      if (this.stars) this.stars.visible = true;
      this.floatingClouds.forEach(c => c.visible = false);
    } else {
      // Mode Terang
      this.scene.background.setHex(0x82d4f8);
      this.scene.fog.color.setHex(0xa7e6fc);
      this.scene.fog.density = 0.010;

      this.lights.ambient.color.setHex(0xffffff);
      this.lights.ambient.intensity = 0.45;

      this.lights.directional.color.setHex(0xfffaed);
      this.lights.directional.intensity = 1.35;

      this.lights.hemi.intensity = 1.0;

      if (this.stars) this.stars.visible = false;
      this.floatingClouds.forEach(c => c.visible = true);
    }
  }

  buildEnvironments() {
    this.scene.add(this.envGroups.cavern);
    this.scene.add(this.envGroups.warung);

    this.buildCuteIslandsEnvironment();
    this.buildWarungEnvironment();

    this.setEnvironment(this.currentEnv);
  }

  buildCuteIslandsEnvironment() {
    const group = this.envGroups.cavern;

    // Pulau Utama
    const mainIsland = this.createFloatingIslandMesh(22, 16, 4.2, 0x22c55e, 0x1e1b4b);
    mainIsland.position.y = -2.1;
    group.add(mainIsland);
    this.groundPlanes.push(mainIsland);

    // Grid Radar Ekolokasi
    this.gridCavern = new THREE.GridHelper(38, 18, 0x4ade80, 0x302c63);
    this.gridCavern.position.y = 0.08;
    group.add(this.gridCavern);

    // Cincin Batas Bercahaya
    const ringGeo = new THREE.RingGeometry(20.5, 21.0, 48);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    });
    const boundaryRing = new THREE.Mesh(ringGeo, ringMat);
    boundaryRing.position.y = 0.12;
    group.add(boundaryRing);

    // Pulau Satelit
    const satelliteOffsets = [
      { x: -22, y: -4, z: -12, r: 6.5 },
      { x: 23, y: -3, z: -8, r: 7.0 },
      { x: -8, y: -5, z: 24, r: 6.0 }
    ];

    satelliteOffsets.forEach(cfg => {
      const satIsland = this.createFloatingIslandMesh(cfg.r, cfg.r * 0.7, 3.2, 0x4ade80, 0x1e1b4b);
      satIsland.position.set(cfg.x, cfg.y, cfg.z);
      group.add(satIsland);

      const tree = this.createCuteTree();
      tree.position.set(cfg.x, cfg.y + 1.6, cfg.z);
      group.add(tree);
    });

    // Pohon Kartun di Pulau Utama
    const treePositions = [
      [-14, -12], [-15, 6], [-12, 14],
      [14, -12], [15, 4], [11, 14],
      [-5, -16], [6, -16]
    ];
    treePositions.forEach(([tx, tz]) => {
      const tree = this.createCuteTree();
      tree.position.set(tx, 0.05, tz);
      group.add(tree);
    });

    // Kristal Berpendar
    const crystalColors = [0x06b6d4, 0xa855f7, 0xff5fa2, 0xf59e0b];
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + 0.3;
      const radius = 15.5 + (i % 3) * 1.5;
      const cx = Math.cos(angle) * radius;
      const cz = Math.sin(angle) * radius;

      const cGroup = new THREE.Group();
      cGroup.position.set(cx, 0.05, cz);

      for (let s = 0; s < 3; s++) {
        const height = 1.4 + (s * 0.6);
        const cGeo = new THREE.ConeGeometry(0.35, height, 5);
        const cMat = new THREE.MeshStandardMaterial({
          color: crystalColors[(i + s) % crystalColors.length],
          emissive: crystalColors[(i + s) % crystalColors.length],
          emissiveIntensity: 0.6,
          roughness: 0.2,
          metalness: 0.8
        });
        const cMesh = new THREE.Mesh(cGeo, cMat);
        cMesh.position.set((s - 1) * 0.4, height / 2, (s % 2) * 0.3);
        cMesh.rotation.x = (s - 1) * 0.2;
        cGroup.add(cMesh);
      }
      group.add(cGroup);
    }
  }

  createFloatingIslandMesh(topR, botR, height, topColor, rockColor) {
    const islandGroup = new THREE.Group();

    const rockGeo = new THREE.CylinderGeometry(topR, botR * 0.3, height, 24);
    const rockMat = new THREE.MeshStandardMaterial({ color: rockColor, roughness: 0.85, flatShading: true });
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.position.y = -height / 2;
    rock.castShadow = true;
    rock.receiveShadow = true;
    islandGroup.add(rock);

    const turfGeo = new THREE.CylinderGeometry(topR + 0.1, topR, 0.35, 24);
    const turfMat = new THREE.MeshStandardMaterial({ color: topColor, roughness: 0.6 });
    const turf = new THREE.Mesh(turfGeo, turfMat);
    turf.position.y = 0.18;
    turf.receiveShadow = true;
    islandGroup.add(turf);

    return islandGroup;
  }

  createCuteTree() {
    const tree = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.24, 0.34, 1.8, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.9;
    trunk.castShadow = true;
    tree.add(trunk);

    const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5, flatShading: true });
    const ball1 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 10), leafMat);
    ball1.position.set(0, 2.2, 0);
    ball1.castShadow = true;
    tree.add(ball1);

    const ball2 = new THREE.Mesh(new THREE.SphereGeometry(0.85, 8, 8), leafMat);
    ball2.position.set(0.4, 2.7, 0.2);
    ball2.castShadow = true;
    tree.add(ball2);

    const scale = 0.85 + Math.random() * 0.4;
    tree.scale.set(scale, scale, scale);
    return tree;
  }

  buildWarungEnvironment() {
    const group = this.envGroups.warung;

    const streetGeo = new THREE.BoxGeometry(42, 0.4, 42);
    const streetMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const street = new THREE.Mesh(streetGeo, streetMat);
    street.position.y = -0.2;
    street.receiveShadow = true;
    group.add(street);
    this.groundPlanes.push(street);

    const grid = new THREE.GridHelper(40, 10, 0xffd84a, 0x475569);
    grid.position.y = 0.05;
    group.add(grid);

    // Gerobak Warung
    const cartGroup = new THREE.Group();
    cartGroup.position.set(0, 0.05, 0);

    const cartBody = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.8, 2.2), new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 }));
    cartBody.position.y = 1.3;
    cartBody.castShadow = true;
    cartGroup.add(cartBody);

    const roofGeo = new THREE.ConeGeometry(2.6, 1.0, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeo, new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 }));
    roof.position.y = 3.2;
    cartGroup.add(roof);

    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffd84a }));
    lantern.position.set(0, 2.5, 1.3);
    cartGroup.add(lantern);

    const warmLight = new THREE.PointLight(0xffd84a, 1.8, 16);
    warmLight.position.set(0, 2.5, 1.3);
    cartGroup.add(warmLight);

    group.add(cartGroup);
  }

  setEnvironment(envType) {
    this.currentEnv = envType;
    this.envGroups.cavern.visible = (envType === 'cavern');
    this.envGroups.warung.visible = (envType === 'warung');
  }

  /**
   * Titik Kuning Bercahaya = Mangsa (Target Solution)
   */
  createGlowingPreyModel() {
    this.preyGroup = new THREE.Group();

    // 1. Bola Inti Kuning Terang (Yellow Core)
    const coreGeo = new THREE.SphereGeometry(0.85, 20, 20);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xfff099 });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.preyGroup.add(coreMesh);

    // 2. Texture Pendaran Radial (Glowing Halo)
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 240, 150, 1)');
    grad.addColorStop(0.3, 'rgba(255, 216, 74, 0.75)');
    grad.addColorStop(1, 'rgba(255, 216, 74, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const glowTex = new THREE.CanvasTexture(canvas);
    const glowMat = new THREE.SpriteMaterial({
      map: glowTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.preyGlowSprite = new THREE.Sprite(glowMat);
    this.preyGlowSprite.scale.set(6.5, 6.5, 1.0);
    this.preyGroup.add(this.preyGlowSprite);

    // 3. Cahaya Titik Kuning Terang
    this.preyLight = new THREE.PointLight(0xffd84a, 2.2, 35);
    this.preyGroup.add(this.preyLight);

    // 4. Label Sprite Melayang: "Mangsa"
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 256;
    labelCanvas.height = 70;
    const lCtx = labelCanvas.getContext('2d');

    lCtx.fillStyle = 'rgba(20, 16, 40, 0.85)';
    lCtx.strokeStyle = '#ffd84a';
    lCtx.lineWidth = 4;
    lCtx.beginPath();
    safeRoundRect(lCtx, 6, 6, 244, 58, 20);
    lCtx.fill();
    lCtx.stroke();

    lCtx.font = 'bold 28px "Fredoka", sans-serif';
    lCtx.fillStyle = '#ffd84a';
    lCtx.textAlign = 'center';
    lCtx.textBaseline = 'middle';
    lCtx.fillText('Mangsa', 128, 36);

    const lTex = new THREE.CanvasTexture(labelCanvas);
    const lSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: lTex, depthTest: false, transparent: true }));
    lSprite.scale.set(3.2, 0.88, 1.0);
    lSprite.position.set(0, 1.6, 0);
    this.preyGroup.add(lSprite);

    this.preyGroup.position.copy(this.preyPosition);
    this.scene.add(this.preyGroup);
  }

  createAtmosphericElements() {
    // Bintang Luar Angkasa (Mode Gelap)
    const starCount = 350;
    const starPos = [];
    for (let i = 0; i < starCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const b = Math.acos(2 * Math.random() - 1);
      const dist = 120 + Math.random() * 60;
      starPos.push(
        dist * Math.sin(b) * Math.cos(a),
        dist * Math.cos(b),
        dist * Math.sin(b) * Math.sin(a)
      );
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    this.stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xaaaaff, size: 1.8, sizeAttenuation: false }));
    this.scene.add(this.stars);

    // Awan Kartun Melayang (Mode Terang)
    const cloudCount = 8;
    for (let i = 0; i < cloudCount; i++) {
      const cloud = new THREE.Group();
      const puffCount = 5;
      const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, flatShading: true });

      for (let p = 0; p < puffCount; p++) {
        const radius = 1.3 + Math.random() * 1.5;
        const puff = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 8), cloudMat);
        puff.position.set((p - 2) * 1.6, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.7);
        cloud.add(puff);
      }

      const angle = (i / cloudCount) * Math.PI * 2;
      const dist = 32 + Math.random() * 16;
      cloud.position.set(Math.cos(angle) * dist, 12 + Math.random() * 8, Math.sin(angle) * dist);
      cloud.userData = { speed: 0.04 + Math.random() * 0.03, dist, angle };
      cloud.visible = false;
      this.floatingClouds.push(cloud);
      this.scene.add(cloud);
    }
  }

  setupRaycasting() {
    const canvas = this.renderer.domElement;
    let downPos = { x: 0, y: 0 };

    canvas.addEventListener('pointerdown', (e) => {
      downPos = { x: e.clientX, y: e.clientY };
    });

    canvas.addEventListener('pointerup', (e) => {
      // Jika diseret (bukan sekadar klik), jangan pindahkan mangsa
      const dist = Math.abs(e.clientX - downPos.x) + Math.abs(e.clientY - downPos.y);
      if (dist > 6) return;

      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);

      // 1. Uji tabrakan dengan tanah pulau
      const groundList = this.groundPlanes.filter(p => p.parent && p.parent.visible);
      const hitGround = this.raycaster.intersectObjects(groundList, true);

      if (hitGround.length > 0) {
        const pt = hitGround[0].point;
        this.setPreyPosition(pt.x, Math.max(2.0, pt.y + 2.5), pt.z);
        return;
      }

      // 2. Jika klik di area gelap (background/void):
      // Proyeksikan ke bidang coplanar menghadap kamera pada ketinggian mangsa saat ini
      const camDir = this.camera.getWorldDirection(new THREE.Vector3());
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(camDir, this.preyPosition);
      const hitVoid = new THREE.Vector3();

      if (this.raycaster.ray.intersectPlane(plane, hitVoid)) {
        // Batasi koordinat dalam ruang pencarian yang wajar
        hitVoid.x = Math.max(-18, Math.min(18, hitVoid.x));
        hitVoid.y = Math.max(2.0, Math.min(10.0, hitVoid.y));
        hitVoid.z = Math.max(-18, Math.min(18, hitVoid.z));
        this.setPreyPosition(hitVoid.x, hitVoid.y, hitVoid.z);
      }
    });
  }

  setPreyPosition(x, y, z) {
    this.preyPosition.set(x, y, z);
    if (this.preyGroup) {
      this.preyGroup.position.set(x, y, z);
    }
    if (typeof this.onPreyMoved === 'function') {
      this.onPreyMoved(x, y, z);
    }
  }

  setCameraMode(mode) {
    this.cameraMode = mode;
    if (mode === 'free') {
      if (this.controls) this.controls.enabled = true;
    }
  }

  update(delta) {
    // 1. Animasi Pendaran Mangsa (Pulse Glow)
    if (this.preyGlowSprite) {
      this.preyWingPhase += delta * 4.0;
      const s = 6.0 + Math.sin(this.preyWingPhase) * 1.0;
      this.preyGlowSprite.scale.set(s, s, 1.0);
    }

    // 2. Animasi Awan Mengapung (jika terlihat)
    this.floatingClouds.forEach(cloud => {
      if (cloud.visible) {
        cloud.userData.angle += delta * cloud.userData.speed * 0.15;
        const a = cloud.userData.angle;
        const d = cloud.userData.dist;
        cloud.position.x = Math.cos(a) * d;
        cloud.position.z = Math.sin(a) * d;
      }
    });

    // 3. Kamera Controller
    if (this.cameraMode === 'follow_alpha' && this.alphaBatRef) {
      const alphaPos = this.alphaBatRef.group.position;
      const targetCamPos = alphaPos.clone().add(new THREE.Vector3(0, 7, 13));
      this.camera.position.lerp(targetCamPos, delta * 3.5);
      if (this.controls) {
        this.controls.target.lerp(alphaPos, delta * 4.5);
      }
    }

    if (this.controls && this.cameraMode !== 'follow_alpha') {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    if (!this.container || !this.camera || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

// Export untuk browser dan Node.js
if (typeof window !== 'undefined') {
  window.WorldSceneManager = WorldSceneManager;
}
if (typeof globalThis !== 'undefined') {
  globalThis.WorldSceneManager = WorldSceneManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WorldSceneManager;
}
