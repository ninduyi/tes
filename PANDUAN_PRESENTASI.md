# PANDUAN PRESENTASI & SKRIP UJI COBA
## Bat Algorithm 3D: Echolocation Swarm Optimizer (Cute Edition)

> Panduan praktis (*cheat-sheet*) saat berbicara di depan dosen dan audiens kelas. Alur ini dirancang agar presentasi berjalan runut, interaktif, menarik secara visual (*cute game aesthetic*), dan memiliki bobot akademis tinggi.

---

### Bagian 1: Pembukaan (1 Menit)

**Kalimat Pembuka:**
> "Selamat pagi/siang Bapak/Ibu Dosen dan rekan-rekan sekalian. Hari ini kami mempresentasikan media pembelajaran interaktif 3D untuk **Bat Algorithm**, salah satu algoritma metaheuristik optimasi berbasis kecerdasan kawanan (*swarm intelligence*) yang dirumuskan oleh **Xin-She Yang** pada tahun 2010.
> 
> Agar materi mudah dipahami dan tidak membosankan, kami mengemas simulasi ini dengan pendekatan visual bergaya permainan 3D (*cute low-poly diorama*), di mana setiap elemen komputasi memiliki padanan visual yang hidup: mulai dari kelelawar pemburu, gelombang sonar ultrasonik, hingga target mangsa."

---

### Bagian 2: Alur Demonstrasi & Fitur (3 - 4 Menit)

#### Langkah 1: Tunjukkan Elemen Visual Kawanan (Pulau Awan Kristal)
1. Buka halaman simulasi.
2. Tunjukkan ke audiens:
   - **Kelelawar Alpha ($x^*$)**: Berukuran lebih besar, mengenakan **mahkota emas kerajaan (*golden crown*)**, dan memiliki label melayang tinggi `⭐ BATY ALPHA (x*)` yang selalu tampak jelas di posisi terdepan memimpin kawanan.
   - **Kelelawar Biasa**: Bergerak dalam formasi orbit melingkar yang rapi di sekitar mangsa, sehingga kelelawar tidak saling menumpuk atau bertabrakan (*anti-clumping separation*).
   - **Mangsa Kun-kun**: Kunang-kunang emas bercahaya yang memancarkan aura lembut.
   - **Cincin Gelombang Sonar**: Cincin 3D yang mengembang dari moncong kelelawar. Ukurannya mencerminkan variabel **Loudness ($A$)**.

#### Langkah 2: Buka "Materi & Kisah Konsep" (Tombol Kanan Atas)
1. Klik tombol **"Materi & Kisah Konsep"**.
2. Masuk ke **Bab 3 (5 Variabel Inti)**:
   - Jelaskan hubungan fisika dan komputasinya:
     - Posisi $x$ (koordinat solusi tebakan),
     - Kecepatan $v$ (vektor perpindahan),
     - Frekuensi $f$ (kekuatan tarikan ke solusi terbaik),
     - Kekerasan Suara $A$ (pengatur langkah eksplorasi luas),
     - Laju Pulsa $r$ (seberapa sering pulsa dipancarkan),
     - Solusi Terbaik $x^*$ (posisi kelelawar Alpha).
   - Tekan tombol *"Sorot Kelelawar Alpha ($x^*$)"*. Kamera akan otomatis berfokus mengikuti kelelawar Alpha.
3. Masuk ke **Bab 4 (Formulasi Gerak)**:
   - Tunjukkan ketiga rumus pergerakan:
     1. $f_i = f_{\min} + (f_{\max} - f_{\min}) \cdot \beta$
     2. $v_i^{t+1} = v_i^t + (x^* - x_i^t) \cdot f_i$
     3. $x_i^{t+1} = x_i^t + v_i^{t+1}$
   - Tekan tombol *"Demonstrasi 1 Langkah Gerak"*. Tunjukkan banner kiri bawah yang menghitung rumus secara *real-time*.

#### Langkah 3: Jelaskan Inti Dinamika Suara (Loudness vs Pulse Rate)
1. Tunjukkan panel kanan bawah: **Grafik Dinamika Suara**.
2. Jelaskan konsep penting ini:
   - **Garis Merah Muda ($A$ Meluruh)**: Mengikuti $A_{t+1} = \alpha A_t$. Awalnya kelelawar berteriak kencang untuk menjelajahi area luas (*global exploration*). Semakin dekat ke mangsa, suara diredam agar langkahnya mengecil dan teliti (*local exploitation*) sehingga tidak melompati target.
   - **Garis Hijau ($r$ Meningkat)**: Mengikuti $r = r_0 [1 - e^{-\gamma t}]$. Semakin yakin dengan posisinya, kelelawar memancarkan pulsa semakin rapat untuk mengunci mangsa.

#### Langkah 4: Tunjukkan Analogi Mencari Warung (Diorama 2)
1. Klik tombol **"Warung Kota Malam"** pada bilah atas.
2. Terangkan kepada dosen:
   - *"Ini adalah visualisasi analogi dari Slide 2 dan Slide 6 di materi kuliah: mencari gerobak warung makan terdekat di malam hari. Setiap kelelawar menebak lokasi pedagang, dan saat satu kelelawar menemukan warung terdekat, seluruh kawanan segera berbelok mendekat ke gerobak tersebut."*

#### Langkah 5: Interaksi Langsung (Klik & Geser Mangsa)
1. Klik atau geser mouse di lantai untuk memindahkan posisi mangsa.
2. Tunjukkan reaksi kawanan:
   - Kelelawar Alpha seketika memutar haluan.
   - Bunyi audio *sonar chirp* berdentang kembali.
   - Kawanan berkonvergensi ke titik baru secara anggun tanpa saling tumpuk.

---

### Bagian 3: Panduan Menjawab Pertanyaan Dosen (Q&A)

**Pertanyaan 1:** *"Kenapa kelelawar tidak saling menumpuk menjadi satu titik saat konvergen?"*
> **Jawaban:** 
> "Secara matematis koordinat pencarian memang mendekati titik optimal $x^*$. Namun pada visualisasi 3D, kami menerapkan formasi halo melingkar (*orbital spacing*) proporsional terhadap Loudness $A_i$. Hal ini memastikan setiap kelelawar tetap terlihat jelas, tidak terjadi *z-fighting* atau penumpukan poligon yang buruk, dan posisi Alpha $x^*$ selalu tampil menonjol di tengah dengan mahkota emasnya."

**Pertanyaan 2:** *"Kenapa pada rumus kecepatan menggunakan $(x^* - x_i)$?"*
> **Jawaban:**
> "Pada paper awal tahun 2010 terdapat kesalahan tipografi penulisan $(x_i - x^*)$. Jika tanpa tanda negatif, vektor tersebut akan menjauhkan kelelawar dari solusi terbaik. Oleh karena itu, seluruh implementasi standar komputasi menggunakan $(x^* - x_i)$ agar vektor percepatan menarik kelelawar menuju kelelawar terbaik $x^*$."

**Pertanyaan 3:** *"Kapan kondisi local random walk $x^* + \epsilon \bar{A}$ aktif?"*
> **Jawaban:**
> "Kondisi ini terjadi ketika bilangan acak $\text{rand} > r_i$. Pada awal iterasi di mana $r_i$ masih rendah, kondisi ini sangat sering terjadi sehingga kelelawar banyak mengeksplorasi area sekitar solusi terbaik dengan langkah acak selebar $\bar{A}$."
