/**
 * Web Audio Synthesizer untuk Bat Echolocation
 * Menghasilkan pulsa sonar realistis (frekuensi chirp audio),
 * atenuasi volume sesuai Loudness (A), dan chime keberhasilan saat x* diperbarui.
 */

class BatAudioSynthesizer {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.lastPingTime = 0;
  }

  init() {
    if (this.audioCtx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(0.25, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);
    } catch (e) {
      console.warn('Web Audio API tidak didukung pada browser ini:', e);
    }
  }

  ensureContext() {
    if (!this.audioCtx) {
      this.init();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Membunyikan pulsa sonar chirp
   * Frekuensi sweep mencerminkan f_i, dan volume mencerminkan Loudness A_i
   */
  playSonarPing(frequency = 1.0, loudness = 0.8) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    // Throttle agar suara tidak bertumpuk berisik
    const now = performance.now();
    if (now - this.lastPingTime < 90) return;
    this.lastPingTime = now;

    const ctx = this.audioCtx;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Frekuensi dasar microbat (scaled to audible human range 700Hz - 2200Hz)
    const baseFreq = 800 + frequency * 650;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, t);
    // Sonar chirp downward frequency sweep
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.45, t + 0.08);

    // Volume dipengaruhi oleh Loudness A_i
    const vol = Math.min(0.35, Math.max(0.02, loudness * 0.3));
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  /**
   * Nada kord harmonik saat kawanan menemukan rekor posisi terbaik baru (x*)
   */
  playDiscoveryChime() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const t = ctx.currentTime;
    const notes = [587.33, 880.0, 1174.66]; // D5, A5, D6 arpeggio

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);

      gain.gain.setValueAtTime(0.12, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.3);
    });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  setVolume(val) {
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(val, this.audioCtx.currentTime);
    }
  }
}

// Export untuk browser dan Node.js
if (typeof window !== 'undefined') {
  window.BatAudioSynthesizer = BatAudioSynthesizer;
}
if (typeof globalThis !== 'undefined') {
  globalThis.BatAudioSynthesizer = BatAudioSynthesizer;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BatAudioSynthesizer;
}
