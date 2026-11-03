/**
 * Story & Concept Guide
 * Modul tutorial dan alur presentasi interaktif berdasarkan 8 Bab materi:
 * Memandu audiens memahami konsep dasar ekolokasi hingga formulasi matematis Bat Algorithm
 * dalam format dialog box game yang bersahabat dan interaktif.
 */

class StoryGuideManager {
  constructor(options = {}) {
    this.currentChapter = 0;
    this.onChapterChange = options.onChapterChange || (() => {});
    this.panelElement = document.getElementById('storyModal');
    this.contentElement = document.getElementById('storyContentText');
    this.chapterBadge = document.getElementById('storyChapterBadge');
    this.chapterTitle = document.getElementById('storyChapterTitle');
    this.btnPrev = document.getElementById('storyBtnPrev');
    this.btnNext = document.getElementById('storyBtnNext');
    this.btnAction = document.getElementById('storyBtnAction');
    this.btnClose = document.getElementById('storyBtnClose');

    this.chapters = [
      {
        slideNum: 1,
        title: 'Pengantar: Bat Algorithm & Ekolokasi',
        tag: 'Metaheuristik Bio-Inspired',
        summary: 'Belajar dari strategi kelelawar berburu di kegelapan malam untuk optimasi global.',
        body: `
          <p>Kelelawar microbat menggunakan <strong>ekolokasi (echolocation)</strong> untuk mendeteksi mangsa: memancarkan gelombang ultrasonik, mendengarkan pantulan gema, dan mengukur jarak secara presisi.</p>
          <div class="story-analogy-box">
            <strong>Korelasi Komputasi:</strong><br>
            • <strong>1 Kelelawar (Baty)</strong> = 1 kandidat solusi matematis.<br>
            • <strong>Mangsa (Kun-kun)</strong> = Solusi global optimal yang dicari.<br>
            • <strong>Fitness</strong> = Jarak ke mangsa (semakin kecil, semakin optimal!).
          </div>
        `,
        actionLabel: 'Lihat Pulau Awan',
        actionTrigger: 'view_cavern'
      },
      {
        slideNum: 2,
        title: 'Asal-Usul & Analogi Mencari Warung',
        tag: 'Xin-She Yang (2010)',
        summary: 'Kelelawar saling berbagi koordinat terbaik untuk menyusul ke target.',
        body: `
          <p>Algoritma ini dirumuskan oleh <strong>Xin-She Yang</strong> pada Universitas Cambridge (2010), menggabungkan penelusuran kawanan (PSO) dengan navigasi suara.</p>
          <div class="story-analogy-box">
            <strong>Analogi Mencari Warung Makan Terdekat:</strong><br>
            Bayangkan sekelompok orang sedang mencari warung makan enak di kota malam. Saat salah satu orang (Baty Alpha) mencium aroma paling sedap dan teriak memberi tahu posisinya, semua orang bergegas meluncur ke titik tersebut!
          </div>
        `,
        actionLabel: 'Pindah ke Warung Malam',
        actionTrigger: 'view_warung'
      },
      {
        slideNum: 3,
        title: 'Kenalan dengan 5 Variabel Inti',
        tag: 'Parameter Matematis',
        summary: 'Variabel penentu perilaku terbang dan komunikasi kawanan.',
        body: `
          <p>
            • <strong>x (Posisi)</strong>: Koordinat kelelawar di ruang 3D.<br>
            • <strong>v (Kecepatan)</strong>: Laju dan arah terbang kawanan.<br>
            • <strong>f (Frekuensi)</strong>: Kekuatan tarikan ke posisi terbaik.<br>
            • <strong>A (Loudness)</strong>: Kekerasan suara. Jauh berteriak keras; dekat mangsa mengecil.<br>
            • <strong>r (Pulse Rate)</strong>: Frekuensi pancaran suara. Mendekati mangsa semakin sering berpulsa.
          </p>
        `,
        actionLabel: 'Sorot Baty Alpha (x*)',
        actionTrigger: 'highlight_alpha'
      },
      {
        slideNum: 4,
        title: 'Formulasi Gerak Matematis',
        tag: 'Persamaan Posisi & Kecepatan',
        summary: 'Bagaimana kelelawar berpindah dipandu gravitasi solusi terbaik.',
        body: `
          <p>Setiap iterasi t, 3 rumus dieksekusi berurutan:</p>
          <p>
            1. <strong>Frekuensi:</strong> <code>f_i = f_min + (f_max - f_min) · β</code> (β acak [0, 1])<br>
            2. <strong>Kecepatan:</strong> <code>v_i^(t+1) = v_i^t + (x* - x_i^t) · f_i</code> (ditarik ke posisi terbaik x*)<br>
            3. <strong>Posisi:</strong> <code>x_i^(t+1) = x_i^t + v_i^(t+1)</code>
          </p>
        `,
        actionLabel: '1 Langkah Gerak (Step)',
        actionTrigger: 'step_once'
      },
      {
        slideNum: 5,
        title: 'Dinamika Suara: Loudness & Pulse Rate',
        tag: 'Eksplorasi vs Eksploitasi',
        summary: 'Mekanisme adaptif dari jelajah luas menuju fokus teliti.',
        body: `
          <p>
            • <strong>Loudness Meluruh:</strong> <code>A_i^(t+1) = α · A_i^t</code> (suara mengecil saat dekat mangsa).<br>
            • <strong>Pulse Rate Naik:</strong> <code>r_i^(t+1) = r_0 · [1 - exp(-γ · t)]</code>.<br>
            • <strong>Random Walk Lokal:</strong> Jika rand > r_i, lakukan pencarian mikro di sekitar x*: <code>x_baru = x* + ε · Ā</code>.
          </p>
        `,
        actionLabel: 'Buka Grafik Analitik',
        actionTrigger: 'view_graph'
      },
      {
        slideNum: 6,
        title: 'Siklus Algoritma Langkah Demi Langkah',
        tag: 'Alur Sistematis',
        summary: 'Tahapan algoritmik dari inisialisasi hingga konvergensi.',
        body: `
          <p>
            1. Sebar populasi kelelawar secara acak.<br>
            2. Evaluasi jarak ke mangsa (Fitness) dan temukan Baty Alpha x*.<br>
            3. Perbarui frekuensi f, kecepatan v, dan koordinat x.<br>
            4. Uji pulse rate untuk random walk lokal.<br>
            5. Jika posisi lebih bagus & rand < A, terima posisi baru dan redam volume A!
          </p>
        `,
        actionLabel: 'Jalankan Berburu Penuh',
        actionTrigger: 'play_simulation'
      },
      {
        slideNum: 7,
        title: 'Interaksi Diorama: Memindahkan Mangsa',
        tag: 'Fitur Interaktif',
        summary: 'Kawanan adaptif akan mengejar posisi mangsa baru kapan saja.',
        body: `
          <p>Kamu dapat <strong>klik atau geser mouse di tanah</strong> untuk memindahkan kunang-kunang Kun-kun ke mana saja!</p>
          <div class="story-analogy-box">
            Perhatikan bagaimana Baty Alpha segera berbelok dan seluruh kawanan menyesuaikan formasi sonarnya untuk melacak lokasi baru secara real-time!
          </div>
        `,
        actionLabel: 'Sorot Baty Alpha',
        actionTrigger: 'highlight_alpha'
      },
      {
        slideNum: 8,
        title: 'Kelebihan & Studi Kasus di Industri',
        tag: 'Aplikasi Nyata',
        summary: 'Penerapan Bat Algorithm pada teknologi modern.',
        body: `
          <p>
            • <strong>Cloud Task Scheduling:</strong> Menyeimbangkan beban antrean tugas pada virtual machine server cloud.<br>
            • <strong>Navigasi Drone 3D:</strong> Menemukan lintasan terpendek bebas rintangan.<br>
            • <strong>Hyperparameter Tuning:</strong> Mengoptimasi akurasi model Machine Learning.
          </p>
        `,
        actionLabel: 'Tutup & Nikmati Permainan',
        actionTrigger: 'close_and_play'
      }
    ];

    this.bindEvents();
    this.renderCurrentChapter();
  }

  bindEvents() {
    if (this.btnPrev) {
      this.btnPrev.addEventListener('click', () => this.prevChapter());
    }
    if (this.btnNext) {
      this.btnNext.addEventListener('click', () => this.nextChapter());
    }
    if (this.btnClose) {
      this.btnClose.addEventListener('click', () => this.hide());
    }
    if (this.btnAction) {
      this.btnAction.addEventListener('click', () => {
        const ch = this.chapters[this.currentChapter];
        if (ch) this.triggerAction(ch.actionTrigger);
      });
    }
  }

  show() {
    if (this.panelElement) {
      this.panelElement.classList.add('active');
    }
  }

  hide() {
    if (this.panelElement) {
      this.panelElement.classList.remove('active');
    }
  }

  toggle() {
    if (this.panelElement) {
      this.panelElement.classList.toggle('active');
    }
  }

  nextChapter() {
    if (this.currentChapter < this.chapters.length - 1) {
      this.currentChapter++;
      this.renderCurrentChapter();
    } else {
      this.hide();
    }
  }

  prevChapter() {
    if (this.currentChapter > 0) {
      this.currentChapter--;
      this.renderCurrentChapter();
    }
  }

  renderCurrentChapter() {
    const ch = this.chapters[this.currentChapter];
    if (!ch) return;

    if (this.chapterBadge) {
      this.chapterBadge.textContent = `BAB ${ch.slideNum} DARI ${this.chapters.length}`;
    }
    if (this.chapterTitle) {
      this.chapterTitle.textContent = `${ch.title}`;
    }
    if (this.contentElement) {
      this.contentElement.innerHTML = `
        <div style="font-weight:600; color:#0284c7; margin-bottom:4px;">${ch.summary}</div>
        ${ch.body}
      `;
    }
    if (this.btnAction) {
      this.btnAction.textContent = ch.actionLabel;
    }

    if (this.btnPrev) {
      this.btnPrev.disabled = (this.currentChapter === 0);
    }
    if (this.btnNext) {
      this.btnNext.innerHTML = (this.currentChapter === this.chapters.length - 1) 
        ? 'Selesai &rarr;' 
        : 'Lanjut &rarr;';
    }

    if (typeof this.onChapterChange === 'function') {
      this.onChapterChange(this.currentChapter, ch);
    }
  }

  triggerAction(trigger) {
    if (window.appInstance && typeof window.appInstance.handleStoryAction === 'function') {
      window.appInstance.handleStoryAction(trigger);
    }
  }
}

// Export untuk browser dan Node.js
if (typeof window !== 'undefined') {
  window.StoryGuideManager = StoryGuideManager;
}
if (typeof globalThis !== 'undefined') {
  globalThis.StoryGuideManager = StoryGuideManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StoryGuideManager;
}
