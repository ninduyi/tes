# Bat Algorithm 3D: Echolocation Swarm Optimizer (Cute Edition)

[![Three.js](https://img.shields.io/badge/Three.js-r128-06b6d4?style=flat-square&logo=three.js)](https://threejs.org/)
[![Vanilla JS](https://img.shields.io/badge/JavaScript-ES6+-f59e0b?style=flat-square&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981?style=flat-square)](LICENSE)

Simulasi interaktif 3D dan laboratorium visualisasi untuk **Bat Algorithm** (Xin-She Yang, 2010). Dikemas dengan gaya permainan 3D yang imut, indah (*cute low-poly diorama*), tipografi game ramah (**Fredoka & Outfit**), dan bebas dari masalah kelelawar bertumpuk.

---

## 🌟 Fitur Unggulan

1. **Karakter Kelelawar Chibi 3D & Mahkota Emas**:
   - Bentuk badan menggemaskan, mata anime besar bercahaya dengan kilauan pantulan, pipi merona, telinga lengkung beraksen merah muda, dan sayap kartun mengepak harmonis.
   - **Kelelawar Alpha ($x^*$)**: Berukuran 1.45x lebih besar, mengenakan mahkota emas mewah (*golden royal crown*) berpermata ruby, dan memiliki label melayang tinggi `⭐ BATY ALPHA (x*)` yang selalu tampak jelas.
2. **Formasi Orbit Anti-Clumping (Tidak Menumpuk)**:
   - Mengatasi masalah visual klasik di mana seluruh agen bertabrakan di satu titik saat konvergen. Kelelawar membentuk formasi halo melingkar yang rapi dan terorganisir di sekitar target.
3. **Cincin Gelombang Sonar 3D**:
   - Gelombang suara 3D berdenyut mengembang dari moncong kelelawar, mencerminkan nilai **Loudness ($A$)** dan **Pulse Rate ($r$)**.
4. **Dua Diorama Lingkungan yang Indah**:
   - **Pulau Awan Kristal**: Pulau terapung hijau pastel dengan pepohonan bulat imut, kristal bercahaya, dan awan lembut yang melayang di langit malam.
   - **Warung Kota Malam**: Gerobak warung makan bernuansa hangat dengan lentera menyala, mengilustrasikan analogi pencarian warung makan terdekat (Slide 2 & 6).
5. **Mangsa Imut (Kun-kun si Kunang-kunang Emas)**:
   - Target mangsa bercahaya interaktif. Klik atau geser mouse di lantai untuk memindahkan posisi mangsa kapan saja!
6. **Telemetri & Analisis Waktu-Nyata**:
   - Grafik konvergensi nilai jarak/fitness terbaik $f(x^*)$.
   - Grafik dinamika suara: Kurva penurunan *Loudness* ($A \downarrow$) berdampingan dengan kenaikan *Pulse Rate* ($r \uparrow$).
   - **Inspektur Kelelawar**: Menampilkan koordinat presisi $(x, y, z)$, kecepatan, frekuensi $f$, dan loudness $A$.
7. **Modul Panduan Terpandu (*Story & Concept Guide*)**:
   - Merangkum materi 8 slide presentasi ke dalam modal interaktif dengan tombol uji coba langsung (*Action Triggers*) ke simulasi 3D.
8. **Sintesis Audio Sonar Web Audio API**:
   - Bunyi *chirp sweep* sonar parametrik yang modulasi nadanya diatur oleh frekuensi $f$ dan volumenya diatenuasi oleh $A$.

---

## 🚀 Cara Menjalankan

### Cara 1: Menggunakan Script Otomatis (macOS)
```bash
cd /Users/macbookprosilver/Downloads/bat-algorithm-3d
./start.sh
```

### Cara 2: Buka Berkas Langsung
Klik dua kali berkas `index.html` untuk langsung membukanya di browser favorit Anda.

---

## 🌐 Publikasi ke GitHub Pages
```bash
git add .
git commit -m "refactor: cute chibi bat aesthetic, anti-clumping formation, and game UI font"
git push -u origin main
```
Di halaman repositori GitHub:
1. Buka **Settings** ➔ **Pages**.
2. Pada bagian **Branch**, pilih `main` dan folder `/ (root)`, lalu klik **Save**.
