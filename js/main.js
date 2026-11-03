/**
 * Main Application Coordinator (Dual Theme & Complete Interactive Mode)
 * Mengintegrasikan BatAlgorithmEngine, WorldSceneManager, Bat3DModel,
 * TelemetryChart, BatAudioSynthesizer, dan StoryGuideManager.
 */

class BatSimApp {
  constructor() {
    this.engine = null;
    this.sceneManager = null;
    this.audioSynth = null;
    this.soundChart = null;
    this.storyGuide = null;

    this.isPlaying = true;
    this.speedMultiplier = 1.0;
    this.stepProgress = 0;       // [0 .. 1] progress animasi antara fromPos dan targetPos
    this.stepDuration = 0.26;     // Durasi perpindahan langkah (detik)
    this.lastFrameTime = performance.now();

    this.bat3DMap = new Map(); // id -> Bat3DModel
    this.currentTheme = 'dark'; // 'dark' (Default) | 'light'

    this.init();
  }

  init() {
    try {
      // 1. Audio Synthesizer
      this.audioSynth = new BatAudioSynthesizer();

      // 2. Engine Algoritma Bat
      this.engine = new BatAlgorithmEngine({
        swarmSize: 18,
        alpha: 0.92,
        gamma: 0.05,
        fMin: 0.0,
        fMax: 1.5,
        separationDist: 3.5
      });

      // 3. 3D World Scene
      const viewport = document.getElementById('webglContainer');
      this.sceneManager = new WorldSceneManager(viewport, (x, y, z) => {
        this.handlePreyMoved(x, y, z);
      });

      // 4. Bangun Model Kelelawar
      this.rebuildBat3DModels();

      // 5. Grafik Dinamika Suara (Pink A vs Hijau r)
      const canvasSound = document.getElementById('chartSoundDynamics');
      if (canvasSound) {
        this.soundChart = new TelemetryChart(canvasSound, 'sound_dynamics');
      }

      // 6. Story Guide Modal (8 Bab Penjelasan Dosen)
      this.storyGuide = new StoryGuideManager({
        onChapterChange: () => {}
      });

      // 7. Binding Event UI & Sliders
      this.bindUIEvents();

      // 8. Update HUD Awal
      this.updateHUD();

      // 9. Mulai Loop Animasi
      requestAnimationFrame((t) => this.loop(t));

      console.log('Dunia Baty 3D (Dual Theme Edition) initialized successfully.');
    } catch (err) {
      console.error('Inisialisasi Dunia Baty 3D gagal:', err);
    }
  }

  rebuildBat3DModels() {
    for (let [id, bat3D] of this.bat3DMap) {
      this.sceneManager.scene.remove(bat3D.group);
      if (bat3D.shadowMesh) {
        this.sceneManager.scene.remove(bat3D.shadowMesh);
      }
    }
    this.bat3DMap.clear();

    const bestIdx = this.engine.globalBest.batIndex;

    this.engine.bats.forEach((batData) => {
      const isAlpha = (batData.id === bestIdx);
      const bat3D = new Bat3DModel(batData, isAlpha);

      this.sceneManager.scene.add(bat3D.group);
      if (bat3D.shadowMesh) {
        this.sceneManager.scene.add(bat3D.shadowMesh);
      }

      this.bat3DMap.set(batData.id, bat3D);
    });

    const alphaBat = this.bat3DMap.get(bestIdx);
    if (alphaBat) {
      this.sceneManager.alphaBatRef = alphaBat;
    }
  }

  loop(currentTime) {
    const delta = Math.min(0.05, (currentTime - this.lastFrameTime) / 1000);
    this.lastFrameTime = currentTime;

    // 1. Eksekusi Langkah Algoritma
    if (this.isPlaying) {
      this.stepProgress += (delta * this.speedMultiplier) / this.stepDuration;

      if (this.stepProgress >= 1.0) {
        this.stepProgress = 0;
        this.runAlgorithmStep();
      }
    }

    // 2. Update Model Kelelawar (Interpolasi Halus 60 FPS)
    const bestIdx = this.engine.globalBest.batIndex;
    const alphaBatModel = this.bat3DMap.get(bestIdx);
    if (alphaBatModel) {
      this.sceneManager.alphaBatRef = alphaBatModel;
    }

    const cam = this.sceneManager.camera;
    this.engine.bats.forEach((batData) => {
      const bat3D = this.bat3DMap.get(batData.id);
      if (bat3D) {
        const isAlpha = (batData.id === bestIdx);
        bat3D.updateFlight(delta, Math.min(1.0, this.stepProgress), batData, isAlpha, cam);
      }
    });

    // 3. Render Three.js
    this.sceneManager.update(delta);

    requestAnimationFrame((t) => this.loop(t));
  }

  runAlgorithmStep() {
    const res = this.engine.commitStep();

    // Bunyikan pulsa suara ultrasonik (Cincin Hijau Terpancar)
    if (Math.random() < 0.7) {
      const randBat = this.engine.bats[Math.floor(Math.random() * this.engine.bats.length)];
      if (randBat) {
        this.audioSynth.playSonarPing(randBat.frequency, randBat.loudness);
        const bat3D = this.bat3DMap.get(randBat.id);
        if (bat3D) {
          // Ukuran cincin hijau mengikuti Loudness A!
          bat3D.triggerSonarPing(randBat.loudness);
        }
      }
    }

    // Jika menemukan rekor baru yang lebih dekat
    if (res.improved) {
      this.audioSynth.playDiscoveryChime();
      const alpha3D = this.bat3DMap.get(res.bestBatIndex);
      if (alpha3D) {
        alpha3D.triggerSonarPing(1.0);
      }
    }

    this.updateHUD();
    this.updateCharts();
  }

  runAlgorithmSubStep() {
    const detail = this.engine.stepSub();
    if (!detail) return;

    this.stepProgress = 0;

    const stepTitle = document.getElementById('stepBannerTitle');
    const stepFormula = document.getElementById('stepBannerFormula');
    const stepDesc = document.getElementById('stepBannerDesc');

    if (stepTitle) stepTitle.textContent = detail.title;
    if (stepFormula) stepFormula.textContent = detail.formula;
    if (stepDesc) stepDesc.textContent = detail.explanation;

    if (detail.subStep === 1) {
      const alpha3D = this.bat3DMap.get(this.engine.globalBest.batIndex);
      if (alpha3D) alpha3D.triggerSonarPing(0.9);
      this.audioSynth.playSonarPing(1.5, 0.85);
    }

    this.updateHUD();
    this.updateCharts();
  }

  handlePreyMoved(x, y, z) {
    this.stepProgress = 0;
    // Set posisi baru & reset A dan r
    this.engine.setPreyPosition(x, y, z);
    this.audioSynth.playDiscoveryChime();

    // Bunyikan pulsa sonar dari kelelawar terbaik
    const bestIdx = this.engine.globalBest.batIndex;
    const alpha3D = this.bat3DMap.get(bestIdx);
    if (alpha3D) alpha3D.triggerSonarPing(1.0);

    this.updateHUD();
    this.updateCharts();
  }

  updateHUD() {
    const elI = document.getElementById('sI');
    const elD = document.getElementById('sD');
    const elF = document.getElementById('sF');
    const elV = document.getElementById('sV');
    const elA = document.getElementById('sA');
    const elR = document.getElementById('sR');

    const gBest = this.engine.globalBest;
    const avgA = this.engine.getAverageLoudness();
    const avgR = this.engine.getAveragePulseRate();
    const avgV = this.engine.getAverageVelocityMagnitude();
    const avgF = this.engine.getAverageFrequency();

    if (elI) elI.textContent = this.engine.iteration;
    if (elD) elD.textContent = gBest.fitness === Infinity ? '0.00' : gBest.fitness.toFixed(1);
    if (elF) elF.textContent = avgF.toFixed(2);
    if (elV) elV.textContent = avgV.toFixed(1);
    if (elA) elA.textContent = avgA.toFixed(3);
    if (elR) elR.textContent = avgR.toFixed(3);
  }

  updateCharts() {
    if (this.soundChart) {
      this.soundChart.updateData(this.engine.history);
    }
  }

  toggleTheme() {
    this.currentTheme = (this.currentTheme === 'dark') ? 'light' : 'dark';
    const isDark = (this.currentTheme === 'dark');

    document.body.classList.toggle('theme-dark', isDark);
    document.body.classList.toggle('theme-light', !isDark);

    const themeLabel = document.getElementById('themeLabel');
    const themeIcon = document.querySelector('.theme-icon');

    if (themeLabel) themeLabel.textContent = isDark ? 'Mode Gelap' : 'Mode Terang';
    if (themeIcon) themeIcon.textContent = isDark ? '🌙' : '☀️';

    this.sceneManager.setTheme(this.currentTheme);
    this.updateCharts();
  }

  resetSimulation() {
    this.stepProgress = 0;
    this.engine.initSwarm();
    this.rebuildBat3DModels();
    this.updateHUD();
    this.updateCharts();
  }

  bindUIEvents() {
    // 1. Toggle Tema (Mode Gelap vs Mode Terang)
    const btnTheme = document.getElementById('btnThemeToggle');
    if (btnTheme) {
      btnTheme.addEventListener('click', () => this.toggleTheme());
    }

    // 2. Tombol Jeda / Lanjut
    const btnPlay = document.getElementById('bp');
    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        this.isPlaying = !this.isPlaying;
        btnPlay.textContent = this.isPlaying ? 'Jeda' : 'Lanjut';
        btnPlay.classList.toggle('primary', this.isPlaying);
      });
    }

    // 3. Tombol Langkah (Step by Step)
    const btnStep = document.getElementById('bs');
    if (btnStep) {
      btnStep.addEventListener('click', () => {
        this.isPlaying = false;
        if (btnPlay) {
          btnPlay.textContent = 'Lanjut';
          btnPlay.classList.remove('primary');
        }
        this.runAlgorithmSubStep();
      });
    }

    // 4. Tombol Ulang (Reset)
    const btnReset = document.getElementById('br');
    if (btnReset) {
      btnReset.addEventListener('click', () => this.resetSimulation());
    }

    // 5. Sliders Pengaturan
    const sliderN = document.getElementById('n');
    const valN = document.getElementById('nv');
    if (sliderN && valN) {
      sliderN.addEventListener('input', (e) => {
        const v = parseInt(e.target.value);
        valN.textContent = v;
        this.engine.setParameters({ swarmSize: v });
        this.rebuildBat3DModels();
        this.updateHUD();
      });
    }

    const sliderFm = document.getElementById('fm');
    const valFm = document.getElementById('fmv');
    if (sliderFm && valFm) {
      sliderFm.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        valFm.textContent = v.toFixed(1);
        this.engine.setParameters({ fMax: v });
      });
    }

    const sliderAl = document.getElementById('al');
    const valAl = document.getElementById('alv');
    if (sliderAl && valAl) {
      sliderAl.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        valAl.textContent = v.toFixed(2);
        this.engine.setParameters({ alpha: v });
      });
    }

    const sliderGa = document.getElementById('ga');
    const valGa = document.getElementById('gav');
    if (sliderGa && valGa) {
      sliderGa.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        valGa.textContent = v.toFixed(2);
        this.engine.setParameters({ gamma: v });
      });
    }

    // 6. Lingkungan Switcher
    const btnCavern = document.getElementById('btnEnvCavern');
    const btnWarung = document.getElementById('btnEnvWarung');
    if (btnCavern && btnWarung) {
      btnCavern.addEventListener('click', () => {
        btnCavern.classList.add('active');
        btnWarung.classList.remove('active');
        this.sceneManager.setEnvironment('cavern');
        this.engine.setObjectiveType('prey_distance');
        this.resetSimulation();
      });
      btnWarung.addEventListener('click', () => {
        btnWarung.classList.add('active');
        btnCavern.classList.remove('active');
        this.sceneManager.setEnvironment('warung');
        this.engine.setObjectiveType('warung_grid');
        this.resetSimulation();
      });
    }

    // 7. Kamera Switcher
    const camButtons = document.querySelectorAll('.btn-cam');
    camButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        camButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-cam');
        this.sceneManager.setCameraMode(mode);
      });
    });

    // 8. Audio Toggle
    const btnAudio = document.getElementById('btnAudioToggle');
    if (btnAudio) {
      btnAudio.addEventListener('click', () => {
        const isMuted = this.audioSynth.toggleMute();
        btnAudio.classList.toggle('active', !isMuted);
        const iconOn = btnAudio.querySelector('.icon-audio-on');
        const iconOff = btnAudio.querySelector('.icon-audio-off');
        if (iconOn && iconOff) {
          iconOn.style.display = isMuted ? 'none' : 'inline-block';
          iconOff.style.display = isMuted ? 'inline-block' : 'none';
        }
      });
    }

    // 9. Modal Materi Presentasi Dosen
    const btnStory = document.getElementById('btnOpenStory');
    const storyModal = document.getElementById('storyModal');
    const btnCloseStory = document.getElementById('storyBtnClose');

    if (btnStory && storyModal) {
      btnStory.addEventListener('click', () => this.storyGuide.show());
    }
    if (btnCloseStory && storyModal) {
      btnCloseStory.addEventListener('click', () => this.storyGuide.hide());
    }
  }

  handleStoryAction(trigger) {
    switch (trigger) {
      case 'view_cavern': {
        const btnCavern = document.getElementById('btnEnvCavern');
        if (btnCavern) btnCavern.click();
        break;
      }
      case 'view_warung': {
        const btnWarung = document.getElementById('btnEnvWarung');
        if (btnWarung) btnWarung.click();
        break;
      }
      case 'highlight_alpha': {
        this.sceneManager.setCameraMode('follow_alpha');
        const bestIdx = this.engine.globalBest.batIndex;
        const alpha3D = this.bat3DMap.get(bestIdx);
        if (alpha3D) alpha3D.triggerSonarPing(1.0);
        this.audioSynth.playDiscoveryChime();
        break;
      }
      case 'step_once':
        this.isPlaying = false;
        this.runAlgorithmSubStep();
        break;
      case 'play_simulation':
        this.isPlaying = true;
        break;
      case 'close_and_play':
        this.isPlaying = true;
        this.storyGuide.hide();
        break;
    }
  }
}

// Inisialisasi saat DOM siap
window.addEventListener('DOMContentLoaded', () => {
  window.appInstance = new BatSimApp();
});
