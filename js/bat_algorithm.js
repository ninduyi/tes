/**
 * Bat Algorithm Engine
 * Berdasarkan formulasi Xin-She Yang (2010) dengan Perencanaan Gerak Sinematik & Flocking Separation.
 * 
 * Parameter Inti:
 * x_i : Posisi kelelawar ke-i dalam ruang pencarian 3D
 * v_i : Kecepatan kelelawar ke-i
 * f_i : Frekuensi emisi suara kelelawar [f_min, f_max]
 * A_i : Loudness (kekerasan suara), meluruh seiring mendekati mangsa (A = alpha * A)
 * r_i : Pulse emission rate, meningkat seiring waktu (r = r0 * (1 - exp(-gamma * t)))
 * x*  : Posisi terbaik global saat ini (solusi paling optimal / paling dekat mangsa)
 */

class BatAlgorithmEngine {
  constructor(options = {}) {
    this.defaultOptions = {
      swarmSize: options.swarmSize || 18,
      dimensions: 3,
      bounds: {
        minX: -18, maxX: 18,
        minY: 1.8, maxY: 10,
        minZ: -18, maxZ: 18
      },
      fMin: 0.0,
      fMax: 1.5,
      alpha: 0.93,       // Koefisien pendinginan loudness (0 < alpha < 1)
      gamma: 0.05,       // Koefisien peningkatan pulse rate (gamma > 0)
      initialLoudness: 0.95,
      initialPulseRate: 0.15,
      separationDist: 3.5, // Jarak pengaman minimal antar kelelawar (anti-clumping)
      objectiveType: 'prey_distance',
      preyPosition: { x: 0, y: 3.5, z: 0 }
    };

    this.options = { ...this.defaultOptions, ...options };
    this.iteration = 0;
    this.bats = [];
    this.globalBest = {
      position: { x: 0, y: 3.5, z: 0 },
      fitness: Infinity,
      batIndex: 0
    };

    this.history = {
      fitness: [],
      avgLoudness: [],
      avgPulseRate: [],
      avgVelocity: []
    };

    this.subStep = 0;
    this.initSwarm();
  }

  /**
   * Inisialisasi kawanan kelelawar
   */
  initSwarm() {
    this.iteration = 0;
    this.subStep = 0;
    this.bats = [];
    this.history = {
      fitness: [],
      avgLoudness: [],
      avgPulseRate: [],
      avgVelocity: []
    };

    const b = this.options.bounds;

    for (let i = 0; i < this.options.swarmSize; i++) {
      // Sebar dalam formasi melingkar awal
      const angle = (i / this.options.swarmSize) * Math.PI * 2;
      const radius = 9 + (i % 3) * 3;
      const x = Math.cos(angle) * radius;
      const y = 3.0 + (i % 4) * 1.5;
      const z = Math.sin(angle) * radius;

      const bat = {
        id: i,
        position: { x, y, z },
        fromPos: { x, y, z },
        targetPos: { x, y, z },
        velocity: {
          x: (Math.random() - 0.5) * 0.6,
          y: (Math.random() - 0.5) * 0.2,
          z: (Math.random() - 0.5) * 0.6
        },
        frequency: 0,
        loudness: this.options.initialLoudness,
        r0: 0.2 + Math.random() * 0.3,
        pulseRate: this.options.initialPulseRate,
        fitness: Infinity,
        candidateFitness: Infinity,
        acceptedInLastStep: false,
        didLocalWalk: false,
        beta: 0
      };

      bat.fitness = this.evaluateFitness(bat.position);
      this.bats.push(bat);
    }

    this.updateGlobalBest();
    this.recordHistory();
    this.planNextStep();
  }

  evaluateFitness(pos) {
    const p = this.options.preyPosition;
    switch (this.options.objectiveType) {
      case 'warung_grid': {
        const dx = Math.abs(pos.x - p.x);
        const dz = Math.abs(pos.z - p.z);
        const dy = Math.abs(pos.y - p.y);
        return (dx + dz) + 0.3 * Math.sqrt(dx * dx + dz * dz) + dy * 0.2;
      }
      case 'prey_distance':
      default: {
        const dx = pos.x - p.x;
        const dy = pos.y - p.y;
        const dz = pos.z - p.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
      }
    }
  }

  updateGlobalBest() {
    let bestFit = Infinity;
    let bestIdx = -1;

    for (let i = 0; i < this.bats.length; i++) {
      if (this.bats[i].fitness < bestFit) {
        bestFit = this.bats[i].fitness;
        bestIdx = i;
      }
    }

    if (bestIdx !== -1 && bestFit < this.globalBest.fitness) {
      this.globalBest.fitness = bestFit;
      this.globalBest.batIndex = bestIdx;
      this.globalBest.position = { ...this.bats[bestIdx].position };
      return true;
    }
    return false;
  }

  getAverageLoudness() {
    const total = this.bats.reduce((sum, b) => sum + b.loudness, 0);
    return total / (this.bats.length || 1);
  }

  getAveragePulseRate() {
    const total = this.bats.reduce((sum, b) => sum + b.pulseRate, 0);
    return total / (this.bats.length || 1);
  }

  getAverageVelocityMagnitude() {
    const total = this.bats.reduce((sum, b) => {
      return sum + Math.sqrt(b.velocity.x ** 2 + b.velocity.y ** 2 + b.velocity.z ** 2);
    }, 0);
    return total / (this.bats.length || 1);
  }

  getAverageFrequency() {
    const total = this.bats.reduce((sum, b) => sum + (b.frequency || 0), 0);
    return total / (this.bats.length || 1);
  }

  clampBounds(pos) {
    const b = this.options.bounds;
    pos.x = Math.max(b.minX, Math.min(b.maxX, pos.x));
    pos.y = Math.max(b.minY, Math.min(b.maxY, pos.y));
    pos.z = Math.max(b.minZ, Math.min(b.maxZ, pos.z));
  }

  /**
   * Perencanaan Langkah Berikutnya (Motion Planning dengan Separation Relaxation)
   * Menghitung targetPos untuk setiap kelelawar secara halus dan bebas tabrakan/menumpuk
   */
  planNextStep() {
    const bp = this.globalBest.position;
    const pp = this.options.preyPosition;
    const avgA = this.getAverageLoudness();
    const SEP = this.options.separationDist;
    const VMAX = 3.6;

    for (let i = 0; i < this.bats.length; i++) {
      const bat = this.bats[i];
      const isBest = (i === this.globalBest.batIndex);

      // Simpan titik awal animasi langkah ini
      bat.fromPos = { ...bat.position };

      // Rumus 1: Frekuensi
      bat.beta = Math.random();
      bat.frequency = this.options.fMin + (this.options.fMax - this.options.fMin) * bat.beta;

      // Vektor jarak ke target
      const target = isBest ? pp : bp;
      const dx = target.x - bat.position.x;
      const dy = target.y - bat.position.y;
      const dz = target.z - bat.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Jarak berhenti agar tidak menabrak titik mangsa persis
      const stopDist = isBest ? 2.5 : SEP * 0.9;
      const isNear = (dist < stopDist + 2.0);

      // Rumus 2: Pembaruan Kecepatan
      if (isNear) {
        bat.velocity.x *= 0.55;
        bat.velocity.y *= 0.55;
        bat.velocity.z *= 0.55;
      } else {
        const steerStrength = Math.min(0.45, 0.12 + bat.frequency * 0.22);
        const desiredSpeed = Math.min(isBest ? VMAX : VMAX * 0.8, (dist - stopDist) * 0.4);
        const invD = dist > 0.001 ? desiredSpeed / dist : 0;

        bat.velocity.x += (dx * invD - bat.velocity.x) * steerStrength;
        bat.velocity.y += (dy * invD - bat.velocity.y) * steerStrength;
        bat.velocity.z += (dz * invD - bat.velocity.z) * steerStrength;
      }

      // Rumus 3: Posisi Kandidat
      let nx = bat.position.x + bat.velocity.x;
      let ny = bat.position.y + bat.velocity.y;
      let nz = bat.position.z + bat.velocity.z;

      // Random Walk Lokal jika rand > r_i
      bat.didLocalWalk = false;
      if (!isBest && !isNear && Math.random() > bat.pulseRate) {
        bat.didLocalWalk = true;
        const walkScale = bat.loudness * 1.5;
        nx += (Math.random() - 0.5) * 2 * walkScale;
        ny += (Math.random() - 0.5) * 0.8 * walkScale;
        nz += (Math.random() - 0.5) * 2 * walkScale;
      }

      const candidatePos = { x: nx, y: ny, z: nz };
      this.clampBounds(candidatePos);
      bat.candidateFitness = this.evaluateFitness(candidatePos);

      // Kriteria Penerimaan: rand < A dan fitness lebih baik
      bat.acceptedInLastStep = isBest || (Math.random() < bat.loudness && bat.candidateFitness < bat.fitness + 1.5);

      if (bat.acceptedInLastStep) {
        bat.targetPos = { ...candidatePos };
      } else {
        // Jika tidak diterima, tetap bergerak sedikit
        bat.targetPos = {
          x: bat.position.x + (candidatePos.x - bat.position.x) * 0.35,
          y: bat.position.y + (candidatePos.y - bat.position.y) * 0.35,
          z: bat.position.z + (candidatePos.z - bat.position.z) * 0.35
        };
      }
    }

    // 4-PASS RELAXATION SEPARATION: Mendorong kelelawar yang terlalu dekat agar TIDAK MENUMPUK
    for (let pass = 0; pass < 4; pass++) {
      for (let i = 0; i < this.bats.length; i++) {
        for (let j = i + 1; j < this.bats.length; j++) {
          const a = this.bats[i];
          const b = this.bats[j];

          let rx = a.targetPos.x - b.targetPos.x;
          let ry = a.targetPos.y - b.targetPos.y;
          let rz = a.targetPos.z - b.targetPos.z;
          let len = Math.sqrt(rx * rx + ry * ry + rz * rz);

          if (len >= SEP) continue;

          if (len < 0.001) {
            rx = (Math.random() - 0.5);
            ry = (Math.random() - 0.5) * 0.3;
            rz = (Math.random() - 0.5);
            len = Math.sqrt(rx * rx + ry * ry + rz * rz);
          }

          const invL = 1 / len;
          const push = (SEP - len) * 0.5;

          a.targetPos.x += rx * invL * push;
          a.targetPos.y += ry * invL * push * 0.6;
          a.targetPos.z += rz * invL * push;

          b.targetPos.x -= rx * invL * push;
          b.targetPos.y -= ry * invL * push * 0.6;
          b.targetPos.z -= rz * invL * push;
        }
      }

      // Jauhkan dari titik pusat mangsa minimal 2.8 unit
      for (let i = 0; i < this.bats.length; i++) {
        const bat = this.bats[i];
        let px = bat.targetPos.x - pp.x;
        let py = bat.targetPos.y - pp.y;
        let pz = bat.targetPos.z - pp.z;
        let pLen = Math.sqrt(px * px + py * py + pz * pz);

        if (pLen < 2.8) {
          if (pLen < 0.001) { px = 1; pLen = 1; }
          const push = 2.8 - pLen;
          bat.targetPos.x += (px / pLen) * push;
          bat.targetPos.y += (py / pLen) * push * 0.5;
          bat.targetPos.z += (pz / pLen) * push;
        }
        this.clampBounds(bat.targetPos);
      }
    }
  }

  /**
   * Menyelesaikan langkah iterasi dan memperbarui parameter suara
   */
  commitStep() {
    this.iteration++;
    const prevBestFitness = this.globalBest.fitness;

    for (let i = 0; i < this.bats.length; i++) {
      const bat = this.bats[i];
      bat.position = { ...bat.targetPos };
      bat.fitness = this.evaluateFitness(bat.position);

      if (bat.acceptedInLastStep) {
        // Loudness meluruh
        bat.loudness = Math.max(0.02, bat.loudness * this.options.alpha);
        // Pulse rate meningkat
        bat.pulseRate = bat.r0 * (1 - Math.exp(-this.options.gamma * this.iteration));
      }
    }

    const improved = this.updateGlobalBest();
    this.recordHistory();

    // Rencanakan target langkah selanjutnya
    this.planNextStep();

    return {
      iteration: this.iteration,
      bestFitness: this.globalBest.fitness,
      bestPosition: this.globalBest.position,
      bestBatIndex: this.globalBest.batIndex,
      improved: improved && (this.globalBest.fitness < prevBestFitness),
      avgLoudness: this.getAverageLoudness(),
      avgPulseRate: this.getAveragePulseRate()
    };
  }

  /**
   * Kompatibilitas dengan stepFull lama
   */
  stepFull() {
    return this.commitStep();
  }

  /**
   * Sub-step untuk tutorial edukasi
   */
  stepSub() {
    this.subStep = (this.subStep % 3) + 1;
    let detail = null;

    if (this.subStep === 1) {
      detail = {
        subStep: 1,
        title: 'Langkah 1: Pancaran Sonar (Frekuensi & Kecepatan)',
        formula: 'f_i = f_min + (f_max - f_min)·β  |  v_i = v_i + (x* - x_i)·f_i',
        explanation: 'Setiap kelelawar memancarkan pulsa sonar dan menyesuaikan vektor kecepatan terbangnya menuju posisi terbaik.'
      };
    } else if (this.subStep === 2) {
      detail = {
        subStep: 2,
        title: 'Langkah 2: Pemeriksaan Pulse Rate & Random Walk',
        formula: 'Jika rand > r_i  =>  x_baru = x* + ε · Ā',
        explanation: 'Kelelawar melakukan manuver eksplorasi lokal di sekitar target dengan skala langkah proporsional Loudness rata-rata.'
      };
    } else if (this.subStep === 3) {
      const res = this.commitStep();
      detail = {
        subStep: 3,
        title: 'Langkah 3: Kriteria Penerimaan & Adaptasi Suara',
        formula: 'A_i = α · A_i  |  r_i = r_0 · [1 - exp(-γ · t)]',
        explanation: 'Posisi baru diterima. Volume suara Loudness mengecil untuk eksploitasi presisi dan frekuensi pulsa r meningkat.'
      };
    }

    return detail;
  }

  recordHistory() {
    this.history.fitness.push(this.globalBest.fitness);
    this.history.avgLoudness.push(this.getAverageLoudness());
    this.history.avgPulseRate.push(this.getAveragePulseRate());
    this.history.avgVelocity.push(this.getAverageVelocityMagnitude());

    if (this.history.fitness.length > 140) {
      this.history.fitness.shift();
      this.history.avgLoudness.shift();
      this.history.avgPulseRate.shift();
      this.history.avgVelocity.shift();
    }
  }

  setPreyPosition(x, y, z) {
    this.options.preyPosition = { x, y, z };
    for (let bat of this.bats) {
      bat.fitness = this.evaluateFitness(bat.position);
      bat.loudness = Math.min(1.0, bat.loudness + 0.4);
    }
    this.globalBest.fitness = Infinity;
    this.updateGlobalBest();
    this.planNextStep();
  }

  setObjectiveType(type) {
    this.options.objectiveType = type;
    for (let bat of this.bats) {
      bat.fitness = this.evaluateFitness(bat.position);
    }
    this.globalBest.fitness = Infinity;
    this.updateGlobalBest();
    this.planNextStep();
  }

  setParameters(params) {
    if (params.swarmSize && params.swarmSize !== this.options.swarmSize) {
      this.options.swarmSize = params.swarmSize;
      this.initSwarm();
      return;
    }
    if (params.alpha !== undefined) this.options.alpha = params.alpha;
    if (params.gamma !== undefined) this.options.gamma = params.gamma;
    if (params.fMin !== undefined) this.options.fMin = params.fMin;
    if (params.fMax !== undefined) this.options.fMax = params.fMax;
  }
}

// Export untuk browser dan Node.js
if (typeof window !== 'undefined') {
  window.BatAlgorithmEngine = BatAlgorithmEngine;
}
if (typeof globalThis !== 'undefined') {
  globalThis.BatAlgorithmEngine = BatAlgorithmEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BatAlgorithmEngine;
}
