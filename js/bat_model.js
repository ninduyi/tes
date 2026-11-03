/**
 * Bat Model & Chibi Character Generator (Dual Color: Pink Terbaik & Ungu Kawanan)
 * - Kelelawar pink berlabel "Terbaik" = yang paling dekat dengan mangsa (Solusi Global x*)
 * - Kelelawar ungu = kawanan pencari lainnya
 * - Cincin hijau = pulsa suara ultrasonik, ukurannya proporsional mengikuti Loudness A
 * - Interpolasi 60 FPS bebas patah-patah & formasi anti-clumping
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

class Bat3DModel {
  constructor(batData, isAlpha = false) {
    this.batData = batData;
    this.isAlpha = isAlpha;
    this.group = new THREE.Group();

    this.rotationQuat = new THREE.Quaternion();
    this.rotationQuat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 1));
    this.group.quaternion.copy(this.rotationQuat);

    this.flightSpeed = 0;
    this.wingPhase = (batData.id * 0.65) % (Math.PI * 2);
    this.leftWingPivot = null;
    this.rightWingPivot = null;

    this.shadowMesh = null;
    this.sonarRings = [];

    this.createModel();
    this.createGroundShadow();
    this.createSonarPulseSystem();
  }

  createModel() {
    // Sesuai Spesifikasi:
    // Kelelawar Terbaik (Alpha) = Pink bercahaya (0xff5fa2), sayap magenta (0xd94a8a)
    // Kelelawar Lainnya = Ungu (0x8c7fd6), sayap ungu tua (0x5f54b8)
    const bodyColor = this.isAlpha ? 0xff5fa2 : 0x8c7fd6;
    const emissiveColor = this.isAlpha ? 0x7a1f4a : 0x1c1840;
    const wingColor = this.isAlpha ? 0xd94a8a : 0x5f54b8;
    const earInnerColor = this.isAlpha ? 0xffb3d9 : 0xf472b6;

    // 1. Badan Montok Bulat
    const bodyGeo = new THREE.SphereGeometry(0.72, 16, 16);
    bodyGeo.scale(1.0, 1.12, 0.95);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      emissive: emissiveColor,
      roughness: 0.45,
      metalness: 0.1
    });
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);

    // Perut Lembut
    const bellyGeo = new THREE.SphereGeometry(0.52, 14, 14);
    bellyGeo.scale(0.85, 0.98, 0.45);
    const bellyMat = new THREE.MeshStandardMaterial({
      color: this.isAlpha ? 0xffe4f0 : 0xe0dcfc,
      roughness: 0.5
    });
    const belly = new THREE.Mesh(bellyGeo, bellyMat);
    belly.position.set(0, -0.06, 0.5);
    this.bodyMesh.add(belly);

    // 2. Kaki Kecil di Bawah
    this.createFeet(this.bodyMesh, bodyColor);

    // 3. Kepala
    const headGeo = new THREE.SphereGeometry(0.6, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      emissive: emissiveColor,
      roughness: 0.4
    });
    this.head = new THREE.Mesh(headGeo, headMat);
    this.head.position.set(0, 0.6, 0.16);
    this.head.castShadow = true;
    this.group.add(this.head);

    // Pipi Merona Pink
    const blushGeo = new THREE.SphereGeometry(0.13, 8, 8);
    blushGeo.scale(1.2, 0.7, 0.3);
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xff4081, transparent: true, opacity: 0.85 });
    
    const leftBlush = new THREE.Mesh(blushGeo, blushMat);
    leftBlush.position.set(-0.4, -0.1, 0.45);
    this.head.add(leftBlush);

    const rightBlush = new THREE.Mesh(blushGeo, blushMat);
    rightBlush.position.set(0.4, -0.1, 0.45);
    this.head.add(rightBlush);

    // 4. Telinga Kartun Besar
    this.createEars(this.head, bodyColor, earInnerColor);

    // 5. Mata Anime Besar Berkilau
    this.createEyes(this.head, this.isAlpha ? 0xffffff : 0x38bdf8);

    // 6. Gigi Taring Putih Imut
    this.createMouth(this.head);

    // 7. Sayap Kartun Berlekuk
    this.leftWingPivot = new THREE.Group();
    this.leftWingPivot.position.set(-0.45, 0.25, 0.0);
    this.createWingMesh(this.leftWingPivot, -1, wingColor);
    this.group.add(this.leftWingPivot);

    this.rightWingPivot = new THREE.Group();
    this.rightWingPivot.position.set(0.45, 0.25, 0.0);
    this.createWingMesh(this.rightWingPivot, 1, wingColor);
    this.group.add(this.rightWingPivot);

    // 8. Label Melayang Sesuai Spesifikasi: "Terbaik" vs ID Baty
    if (this.isAlpha) {
      this.badgeSprite = this.createBadgeSprite('Terbaik', true);
      this.badgeSprite.position.set(0, 2.0, 0.1);
      this.group.add(this.badgeSprite);
    } else {
      this.badgeSprite = this.createBadgeSprite(`#${this.batData.id + 1}`, false);
      this.badgeSprite.position.set(0, 1.45, 0.1);
      this.group.add(this.badgeSprite);
    }

    const scale = this.isAlpha ? 1.6 : 1.05;
    this.group.scale.set(scale, scale, scale);
  }

  createFeet(bodyParent, footColor) {
    const footGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.28, 8);
    footGeo.rotateX(Math.PI / 4);
    const footMat = new THREE.MeshStandardMaterial({ color: footColor, roughness: 0.6 });

    const leftFoot = new THREE.Mesh(footGeo, footMat);
    leftFoot.position.set(-0.25, -0.72, 0.15);
    bodyParent.add(leftFoot);

    const rightFoot = new THREE.Mesh(footGeo, footMat);
    rightFoot.position.set(0.25, -0.72, 0.15);
    bodyParent.add(rightFoot);
  }

  createEars(headParent, outerColor, innerColor) {
    const earShape = new THREE.Shape();
    earShape.moveTo(0, 0);
    earShape.quadraticCurveTo(0.1, 0.5, 0.35, 0.95);
    earShape.quadraticCurveTo(0.5, 0.4, 0.45, 0);
    earShape.closePath();

    const earGeo = new THREE.ShapeGeometry(earShape);
    const outerMat = new THREE.MeshStandardMaterial({ color: outerColor, roughness: 0.4, side: THREE.DoubleSide });
    const innerMat = new THREE.MeshStandardMaterial({ color: innerColor, roughness: 0.3, side: THREE.DoubleSide });

    const leftEar = new THREE.Group();
    leftEar.add(new THREE.Mesh(earGeo, outerMat));
    const lInner = new THREE.Mesh(earGeo, innerMat);
    lInner.scale.set(0.65, 0.65, 1);
    lInner.position.set(0.06, 0.08, 0.02);
    leftEar.add(lInner);
    leftEar.position.set(-0.46, 0.38, 0.05);
    leftEar.rotation.z = 0.35;
    leftEar.rotation.y = -0.15;
    headParent.add(leftEar);

    const rightEar = new THREE.Group();
    rightEar.add(new THREE.Mesh(earGeo, outerMat));
    const rInner = new THREE.Mesh(earGeo, innerMat);
    rInner.scale.set(0.65, 0.65, 1);
    rInner.position.set(0.06, 0.08, 0.02);
    rightEar.add(rInner);
    rightEar.position.set(0.46, 0.38, 0.05);
    rightEar.rotation.z = -0.35;
    rightEar.rotation.y = 0.15;
    rightEar.scale.set(-1, 1, 1);
    headParent.add(rightEar);
  }

  createEyes(headParent, irisColor) {
    const eyeSocketGeo = new THREE.SphereGeometry(0.18, 14, 14);
    eyeSocketGeo.scale(0.9, 1.1, 0.35);
    const socketMat = new THREE.MeshBasicMaterial({ color: 0x09090b });

    const irisGeo = new THREE.SphereGeometry(0.13, 10, 10);
    irisGeo.scale(0.85, 0.95, 0.3);
    const irisMat = new THREE.MeshBasicMaterial({ color: irisColor });

    const glintGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Mata Kiri
    const leftEye = new THREE.Mesh(eyeSocketGeo, socketMat);
    leftEye.position.set(-0.25, 0.06, 0.5);
    const leftIris = new THREE.Mesh(irisGeo, irisMat);
    leftIris.position.set(0, -0.01, 0.05);
    leftEye.add(leftIris);
    const leftG = new THREE.Mesh(glintGeo, glintMat);
    leftG.position.set(-0.04, 0.05, 0.1);
    leftEye.add(leftG);
    headParent.add(leftEye);

    // Mata Kanan
    const rightEye = new THREE.Mesh(eyeSocketGeo, socketMat);
    rightEye.position.set(0.25, 0.06, 0.5);
    const rightIris = new THREE.Mesh(irisGeo, irisMat);
    rightIris.position.set(0, -0.01, 0.05);
    rightEye.add(rightIris);
    const rightG = new THREE.Mesh(glintGeo, glintMat);
    rightG.position.set(-0.04, 0.05, 0.1);
    rightEye.add(rightG);
    headParent.add(rightEye);
  }

  createMouth(headParent) {
    const mouthGeo = new THREE.TorusGeometry(0.09, 0.02, 6, 12, Math.PI);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, -0.16, 0.54);
    mouth.rotation.x = -Math.PI / 8;
    headParent.add(mouth);

    const fangGeo = new THREE.ConeGeometry(0.035, 0.08, 5);
    fangGeo.rotateX(Math.PI);
    const fangMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const leftFang = new THREE.Mesh(fangGeo, fangMat);
    leftFang.position.set(-0.065, -0.16, 0.56);
    headParent.add(leftFang);

    const rightFang = new THREE.Mesh(fangGeo, fangMat);
    rightFang.position.set(0.065, -0.16, 0.56);
    headParent.add(rightFang);
  }

  createWingMesh(parentGroup, dir, wingColor) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(dir * 0.9, 0.85, dir * 1.8, 0.45);
    shape.quadraticCurveTo(dir * 1.55, 0.05, dir * 1.25, -0.45);
    shape.quadraticCurveTo(dir * 0.9, -0.15, dir * 0.65, -0.4);
    shape.quadraticCurveTo(dir * 0.35, -0.1, 0, -0.25);
    shape.closePath();

    const shapeGeo = new THREE.ShapeGeometry(shape);
    const shapeMat = new THREE.MeshStandardMaterial({
      color: wingColor,
      roughness: 0.35,
      side: THREE.DoubleSide
    });
    const membrane = new THREE.Mesh(shapeGeo, shapeMat);
    membrane.castShadow = true;
    parentGroup.add(membrane);

    const armGeo = new THREE.CylinderGeometry(0.055, 0.035, 1.7, 6);
    armGeo.rotateZ(dir * Math.PI / 3.0);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x221f44, roughness: 0.5 });
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(dir * 0.75, 0.35, 0.02);
    parentGroup.add(arm);
  }

  createBadgeSprite(text, isAlpha) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 70;
    const ctx = canvas.getContext('2d');

    // Label Pink untuk "Terbaik", Ungu untuk lainnya
    ctx.fillStyle = isAlpha ? 'rgba(35, 12, 28, 0.85)' : 'rgba(18, 16, 40, 0.85)';
    ctx.strokeStyle = isAlpha ? '#ff5fa2' : '#8c7fd6';
    ctx.lineWidth = 4;

    ctx.beginPath();
    safeRoundRect(ctx, 6, 6, 244, 58, 20);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 28px "Fredoka", sans-serif';
    ctx.fillStyle = isAlpha ? '#ff5fa2' : '#e8e6f5';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 36);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(isAlpha ? 2.4 : 1.6, isAlpha ? 0.65 : 0.44, 1.0);
    return sprite;
  }

  createGroundShadow() {
    const shadowGeo = new THREE.CircleGeometry(1.2, 16);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.position.y = 0.22;
  }

  /**
   * Cincin Hijau = Pulsa Suara, Ukurannya Mengikuti Loudness A
   */
  createSonarPulseSystem() {
    this.sonarGroup = new THREE.Group();
    this.group.add(this.sonarGroup);

    const ringCount = 3;
    const pulseColor = 0x4ade80; // Hijau cerah

    for (let i = 0; i < ringCount; i++) {
      const ringGeo = new THREE.RingGeometry(0.3, 0.44, 32);
      ringGeo.rotateX(Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: pulseColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0,
        depthWrite: false
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(0, 0.4, 0.7);
      ring.userData = {
        progress: (i / ringCount),
        active: false,
        maxRadius: 5.0
      };
      this.sonarRings.push(ring);
      this.sonarGroup.add(ring);
    }
  }

  triggerSonarPing(loudness) {
    for (let ring of this.sonarRings) {
      if (!ring.userData.active) {
        ring.userData.active = true;
        ring.userData.progress = 0;
        // Ukuran pulsa suara hijau membesar proporsional mengikuti Loudness A!
        ring.userData.maxRadius = Math.max(2.5, loudness * 12.0);
        break;
      }
    }
  }

  /**
   * Update Frame-by-Frame Kinematika Mulus
   */
  updateFlight(dt, progress, batData, isAlphaBest, cam) {
    this.batData = batData;

    if (isAlphaBest !== this.isAlpha) {
      this.setIsAlpha(isAlphaBest);
    }

    // 1. Interpolasi Posisi
    const from = batData.fromPos || batData.position;
    const to = batData.targetPos || batData.position;

    const posX = from.x + (to.x - from.x) * progress;
    const posY = from.y + (to.y - from.y) * progress;
    const posZ = from.z + (to.z - from.z) * progress;

    this.group.position.set(posX, posY, posZ);

    const moveDist = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2 + (to.z - from.z) ** 2);
    this.flightSpeed += (moveDist * 3.5 - this.flightSpeed) * Math.min(1.0, dt * 6.0);

    // 2. Rotasi Mulus Kuaternion
    const vx = batData.velocity.x;
    const vy = batData.velocity.y;
    const vz = batData.velocity.z;
    const vLen = Math.sqrt(vx * vx + vy * vy + vz * vz);

    if (vLen > 0.15) {
      const heading = new THREE.Vector3(vx, vy, vz).normalize();
      const lookTarget = this.group.position.clone().add(heading);

      const dummy = new THREE.Object3D();
      dummy.position.copy(this.group.position);
      dummy.lookAt(lookTarget);

      this.rotationQuat.slerp(dummy.quaternion, 1.0 - Math.exp(-dt * 4.0));
      this.group.quaternion.copy(this.rotationQuat);

      this.group.rotation.z += -vx * 0.18;
    }

    // 3. Kepakan Sayap Mulus
    this.wingPhase += dt * (8.5 + this.flightSpeed * 0.18);
    const flapAngle = Math.sin(this.wingPhase) * 0.82;

    if (this.leftWingPivot && this.rightWingPivot) {
      this.leftWingPivot.rotation.z = flapAngle;
      this.leftWingPivot.rotation.y = Math.sin(this.wingPhase) * 0.2;

      this.rightWingPivot.rotation.z = -flapAngle;
      this.rightWingPivot.rotation.y = -Math.sin(this.wingPhase) * 0.2;
    }

    this.bodyMesh.position.y = Math.sin(this.wingPhase * 0.5) * 0.22;

    // 4. Bayangan di Tanah
    if (this.shadowMesh) {
      this.shadowMesh.position.set(posX, 0.22, posZ);
      const h = Math.max(0.5, posY);
      const sc = Math.max(0.3, 1.0 - h / 16);
      this.shadowMesh.scale.set(sc, sc, sc);
      this.shadowMesh.material.opacity = Math.max(0.1, 0.45 - h * 0.025);
    }

    // 5. Cincin Hijau Pulsa Suara
    for (let ring of this.sonarRings) {
      if (ring.userData.active) {
        ring.userData.progress += dt * 1.6;
        const p = ring.userData.progress;

        if (p >= 1.0) {
          ring.userData.active = false;
          ring.material.opacity = 0;
          ring.scale.set(1, 1, 1);
        } else {
          const currentRadius = 1 + p * ring.userData.maxRadius;
          ring.scale.set(currentRadius, currentRadius, currentRadius);
          ring.material.opacity = (1 - p) * 0.85;
          if (cam) ring.quaternion.copy(cam.quaternion);
        }
      }
    }
  }

  setIsAlpha(isAlpha) {
    this.isAlpha = isAlpha;
    // Re-create mesh model dengan warna baru (Pink Terbaik vs Ungu)
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.sonarRings = [];
    this.createModel();
    this.createSonarPulseSystem();
  }
}

// Export untuk browser dan Node.js
if (typeof window !== 'undefined') {
  window.Bat3DModel = Bat3DModel;
}
if (typeof globalThis !== 'undefined') {
  globalThis.Bat3DModel = Bat3DModel;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Bat3DModel;
}
