/**
 * Real-time Telemetry Charts
 * Menggambar kurva dinamika Loudness (A) warna pink (menurun)
 * dan kurva Pulse Rate (r) warna hijau (meningkat) sesuai spesifikasi.
 */

class TelemetryChart {
  constructor(canvasElement, type = 'sound_dynamics') {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.type = type;
    this.dataA = [];
    this.dataR = [];

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(120, Math.floor((rect.width || 260) * dpr));
    this.canvas.height = Math.max(60, Math.floor((rect.height || 68) * dpr));
    this.ctx.scale(dpr, dpr);
    this.width = rect.width || 260;
    this.height = rect.height || 68;
    this.render();
  }

  updateData(history) {
    this.dataA = history.avgLoudness || [];
    this.dataR = history.avgPulseRate || [];
    this.render();
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    if (!ctx || !w || !h) return;

    ctx.clearRect(0, 0, w, h);

    const padLeft = 24;
    const padRight = 8;
    const padTop = 10;
    const padBottom = 12;
    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    // Garis kisi latar belakang
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 2; i++) {
      const y = padTop + (plotH / 2) * i;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();
    }

    const dataA = this.dataA;
    const dataR = this.dataR;

    if (dataA.length < 2) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '10px "Fredoka", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Menunggu data iterasi...', padLeft + plotW / 2, padTop + plotH / 2 + 3);
      return;
    }

    // Label sumbu Y
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('1.0', padLeft - 4, padTop + 4);
    ctx.fillText('0.0', padLeft - 4, padTop + plotH);

    const stepX = plotW / (dataA.length - 1);

    // 1. Garis Pink: A turun (Loudness)
    ctx.beginPath();
    for (let i = 0; i < dataA.length; i++) {
      const valA = Math.max(0, Math.min(1, dataA[i]));
      const x = padLeft + i * stepX;
      const y = padTop + plotH - valA * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#ff5fa2'; // Pink
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 2. Garis Hijau: r naik (Pulse Rate)
    ctx.beginPath();
    for (let i = 0; i < dataR.length; i++) {
      const valR = Math.max(0, Math.min(1, dataR[i]));
      const x = padLeft + i * stepX;
      const y = padTop + plotH - valR * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#4ade80'; // Hijau
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
}

// Export untuk browser dan Node.js
if (typeof window !== 'undefined') {
  window.TelemetryChart = TelemetryChart;
}
if (typeof globalThis !== 'undefined') {
  globalThis.TelemetryChart = TelemetryChart;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TelemetryChart;
}
