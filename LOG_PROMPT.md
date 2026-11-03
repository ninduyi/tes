# LOG PROMPT & DOKUMENTASI REKAYASA SISTEM
## Proyek: Simulasi Interaktif 3D Bat Algorithm (Cute Game Edition)

Dokumen ini disusun sebagai bukti otentisitas perancangan teknis (*prompt engineering & system architecture log*) sesuai arahan evaluasi dosen.

---

### I. Rekapitulasi Instruksi & Kebutuhan Desain

1. **Topik Algoritma**: Bat Algorithm (Xin-She Yang, 2010).
2. **Kebutuhan Visual & Interaktivitas**:
   - Pemodelan 3D mandiri (*no AI template*, tipografi game ramah Fredoka & Outfit, bebas emotikon alay/non-akademis).
   - Karakter kelelawar jelas dan menggemaskan (chibi bat dengan mata anime besar bercahaya, pipi merona, telinga lengkung beraksen pink, sayap bergelombang, dan mahkota emas megah untuk Alpha $x^*$).
   - **Solusi Anti-Clumping**: Mengatasi masalah kelelawar menumpuk di satu titik melalui formasi orbit melingkar (*orbital spacing*) proporsional terhadap *loudness*, sehingga kelelawar Alpha selalu tampak menonjol di tengah dengan label yang melayang tinggi.
   - Peniadaan lingkungan lembah matematika yang kaku, digantikan dengan dua diorama cantik:
     - **Pulau Awan Kristal**: Pulau terapung hijau pastel dengan pepohonan bulat imut, kristal bercahaya, dan awan melayang santai.
     - **Pasar Warung Kota Malam**: Mengilustrasikan analogi pencarian warung makan terdekat (Slide 2 & 6).
   - Dasbor analitik waktu-nyata: kurva konvergensi jarak $f(x^*)$ dan kurva dinamika suara ($A \downarrow$ vs $r \uparrow$).
   - Modul panduan terpandu interaktif (*Story & Concept Guide*) berbasis 8 slide materi presentasi.

---

### II. Log Rekayasa Arsitektur

#### 1. Formulasi Matematis Bat Algorithm (Yang, 2010)
- Frekuensi: $f_i = f_{\min} + (f_{\max} - f_{\min}) \cdot \beta$
- Kecepatan: $v_i^{t+1} = v_i^t + (x^* - x_i^t) \cdot f_i$
- Posisi: $x_i^{t+1} = x_i^t + v_i^{t+1}$
- Eksplorasi Lokal: $x_{\text{baru}} = x^* + \epsilon \cdot \bar{A}^t \quad (\text{jika } \text{rand} > r_i)$
- Adaptasi Suara: $A_i^{t+1} = \alpha \cdot A_i^t, \quad r_i^{t+1} = r_i^0 \cdot [1 - \exp(-\gamma \cdot t)]$

#### 2. Mekanisme Formasi Orbit Anti-Clumping
Ketika kawanan berkonvergensi, nilai matematis $x_i$ akan sangat dekat dengan $x^*$. Untuk mencegah *z-fighting* dan kelelawar saling bertumpukan:
- Kelelawar Alpha ($x^*$) menempati posisi pusat memimpin kawanan.
- Kelelawar pendamping diatur dalam formasi cincin dinamis:
  $$x_{\text{render}} = x_i + R(A_i) \cdot \cos(\theta_i + \omega t)$$
  $$z_{\text{render}} = z_i + R(A_i) \cdot \sin(\theta_i + \omega t)$$
- Label identitas `⭐ BATY ALPHA (x*)` ditempatkan pada ketinggian $Y = 1.95$, bebas dari halangan visual agen lain.

#### 3. Estetika Tipografi Game
- Menggantikan font standar dengan Google Fonts **Fredoka** (tebal, membulat, gaya UI game modern Nintendo/Animal Crossing) dikombinasikan dengan **Outfit** dan **JetBrains Mono** untuk angka komputasi.
