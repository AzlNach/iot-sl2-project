# 🌱 IoT Dashboard Monitoring Sensor - Sistem Pemantauan Real-Time

Dashboard pemantauan sensor IoT yang dibangun dengan Next.js 14, Tailwind CSS, dan Firebase Realtime Database untuk memantau kondisi lingkungan secara real-time.

---

## 📖 Penjelasan Sistem untuk Pemula

### Apa itu Sistem IoT Dashboard?

Bayangkan Anda memiliki termometer digital di rumah yang bisa mengirim data suhu ke ponsel Anda secara otomatis. Sistem IoT Dashboard ini bekerja dengan cara yang serupa, tetapi lebih canggih:

1. **Sensor** (seperti termometer digital) mengukur kondisi lingkungan
2. **Data** dikirim melalui internet ke tempat penyimpanan cloud
3. **Dashboard** (website) menampilkan data tersebut dalam bentuk visual yang mudah dibaca
4. **Anda** bisa melihat kondisi terkini kapan saja dari mana saja

---

## 🔄 Bagaimana Sistem Ini Bekerja? (Alur Kerja)

### 1️⃣ **Pengumpulan Data (Data Collection)**

```
[Sensor di Lapangan] → Mengukur Kondisi Lingkungan
         ↓
    (Suhu, Kelembaban, dll)
```

**Penjelasan Sederhana:**
- Sensor fisik (seperti sensor suhu, sensor kelembaban) dipasang di lokasi yang ingin dipantau
- Sensor ini bekerja 24/7, mengukur kondisi lingkungan setiap saat
- Contoh: Jika sensor suhu mendeteksi udara 30°C, informasi ini akan dicatat

### 2️⃣ **Pengiriman Data (Data Transmission)**

```
[Sensor] → [Mikrokontroler/ESP32] → [Internet] → [Firebase Database]
```

**Penjelasan Sederhana:**
- Sensor terhubung ke perangkat kecil (seperti Arduino/ESP32) yang bisa mengakses internet
- Perangkat ini mengirim data sensor ke "cloud" (Firebase) melalui WiFi
- Firebase adalah seperti "gudang data" di internet yang menyimpan semua informasi sensor
- Data dikirim secara berkala (misalnya setiap 1-5 detik)

### 3️⃣ **Penyimpanan Data (Data Storage)**

```
Firebase Realtime Database
     └── sensors/
           ├── temperature: 30°C
           ├── humidity: 75%
           ├── soilMoisture: 45%
           └── status: "active"
```

**Penjelasan Sederhana:**
- Firebase menyimpan data seperti buku catatan digital
- Data disusun rapi dalam format terstruktur (seperti folder dan file)
- Setiap kali data baru datang, data lama diperbarui secara otomatis

### 4️⃣ **Tampilan Dashboard (Data Visualization)**

```
[Firebase Database] → [Dashboard Website] → [Browser Anda]
         ↓
    Update Otomatis Setiap Detik
```

**Penjelasan Sederhana:**
- Website dashboard "mendengarkan" perubahan data di Firebase
- Ketika ada data baru, dashboard otomatis menampilkan informasi terbaru
- Tidak perlu refresh halaman - data muncul secara real-time
- Data ditampilkan dalam bentuk:
  - 📊 **Kartu Sensor**: Kotak berwarna dengan angka besar
  - 📈 **Grafik**: Menampilkan perubahan data dari waktu ke waktu
  - 🎨 **Kode Warna**: Memudahkan identifikasi kondisi (hijau=normal, merah=bahaya)

### 5️⃣ **Analisis Cerdas dengan AI (AI Analysis)**

```
[Data Sensor] → [Gemini AI] → [Rekomendasi & Analisis]
```

**Penjelasan Sederhana:**
- Sistem menggunakan kecerdasan buatan (AI) untuk menganalisis data
- AI membaca data sensor dan memberikan saran seperti konsultan ahli
- Contoh analisis:
  - "Kelembaban tanah rendah, disarankan untuk menyiram tanaman"
  - "Suhu terlalu tinggi, pertimbangkan ventilasi tambahan"
- Analisis bisa dijadwalkan otomatis (setiap jam, setiap hari, dll)

---

## 🎯 Fitur-Fitur Utama

### 1. **Pemantauan Real-Time** ⚡
- Data diperbarui secara langsung tanpa perlu refresh
- Melihat kondisi terkini dalam hitungan detik
- Status koneksi sensor ditampilkan (aktif/tidak aktif)

### 2. **Tampilan Visual yang Intuitif** 🎨
- **Kartu Sensor**: Menampilkan data dengan warna berbeda
  - 🔴 **Merah**: Kondisi berbahaya (suhu tinggi ≥35°C)
  - 🟡 **Kuning/Orange**: Peringatan (suhu 28-35°C)
  - 🟢 **Hijau**: Normal (suhu 20-28°C)
  - 🔵 **Biru**: Sejuk (suhu <20°C)

### 3. **Grafik Historis** 📈
- Melihat tren data dari waktu ke waktu
- Memahami pola perubahan (apakah suhu naik/turun)
- Grafik interaktif yang bisa di-zoom dan di-hover

### 4. **Heatmap Kelembaban Tanah** 🌡️
- Visualisasi kelembaban tanah dalam bentuk peta warna
- Menunjukkan area mana yang kering atau basah
- Membantu keputusan penyiraman tanaman

### 5. **Analisis AI Otomatis** 🤖
- Mendapat rekomendasi dari kecerdasan buatan
- Analisis bisa dijadwalkan (otomatis setiap periode tertentu)
- Riwayat analisis tersimpan untuk referensi

### 5.1 **Multi-Bahasa (ID/EN) untuk Analitik** 🌐
- Bagian **Analisis Data (Analytics)** mendukung Bahasa Indonesia dan Inggris
- Tersedia tombol **ID / EN** di header (di samping jam) untuk mengganti bahasa
- Pilihan bahasa tersimpan otomatis di browser (localStorage)

### 6. **Responsive Design** 📱💻
- Bisa diakses dari handphone, tablet, atau komputer
- Tampilan menyesuaikan ukuran layar
- Pengalaman pengguna yang optimal di semua perangkat

### 7. **Sistem Alert** 🚨
- Notifikasi visual ketika ada kondisi abnormal
- Indikator warna berubah sesuai tingkat bahaya
- Membantu respons cepat terhadap masalah

---

## 🏗️ Arsitektur Sistem (Gambaran Teknis Sederhana)

```
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 1: PERANGKAT FISIK                 │
│  [Sensor Suhu] [Sensor Kelembaban] [Sensor Tanah]         │
│         ↓                ↓                ↓                  │
│              [ESP32/Arduino + WiFi]                          │
└─────────────────────────────────────────────────────────────┘
                           ↓ (Internet)
┌─────────────────────────────────────────────────────────────┐
│                 LAYER 2: CLOUD STORAGE                      │
│              [Firebase Realtime Database]                   │
│         ┌──────────────────────────────────┐                │
│         │  sensors/                        │                │
│         │    ├── temperature: 30           │                │
│         │    ├── humidity: 75              │                │
│         │    ├── soilMoisture: 45          │                │
│         │    └── status: "active"          │                │
│         └──────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                           ↓ (Real-time Sync)
┌─────────────────────────────────────────────────────────────┐
│                LAYER 3: WEB APPLICATION                     │
│                    [Next.js Dashboard]                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Sensor    │  │   Grafik    │  │  Analisis   │        │
│  │   Cards     │  │  Historis   │  │     AI      │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  LAYER 4: USER INTERFACE                    │
│              [Browser: Chrome, Firefox, dll]                │
│              [Smartphone, Tablet, Desktop]                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Keamanan Data

### Bagaimana Data Dijaga Keamanannya?

1. **Firebase Rules**: Aturan akses yang mengontrol siapa yang bisa membaca/menulis data
2. **Environment Variables**: Kunci API disimpan secara aman, tidak terlihat di kode
3. **HTTPS**: Semua komunikasi dienkripsi
4. **API Key Validation**: Sistem memvalidasi kunci akses sebelum mengizinkan akses

---

## � Contoh Kasus Penggunaan

### Skenario 1: Pertanian Cerdas 🌾
**Masalah:** Petani ingin memantau kelembaban tanah tanpa harus ke ladang setiap hari.

**Solusi:**
1. Sensor kelembaban tanah dipasang di berbagai titik lahan
2. Data dikirim ke dashboard setiap 5 menit
3. Petani membuka dashboard dari rumah/smartphone
4. Melihat heatmap yang menunjukkan area mana yang membutuhkan penyiraman
5. AI memberikan rekomendasi kapan waktu terbaik untuk menyiram

**Manfaat:**
- Hemat waktu dan tenaga
- Penyiraman lebih efisien
- Tanaman mendapat air sesuai kebutuhan

### Skenario 2: Monitoring Greenhouse 🏡
**Masalah:** Pemilik greenhouse perlu memastikan suhu dan kelembaban optimal untuk tanaman.

**Solusi:**
1. Multiple sensor dipasang di dalam greenhouse
2. Dashboard menampilkan kondisi real-time
3. Alert muncul jika suhu terlalu tinggi (>35°C)
4. AI menganalisis pola dan memberikan saran penyesuaian

**Manfaat:**
- Deteksi dini masalah lingkungan
- Kontrol kondisi optimal 24/7
- Hasil panen lebih baik

---

## �️ Teknologi yang Digunakan (Dijelaskan Sederhana)

| Teknologi | Fungsi | Analogi Sederhana |
|-----------|--------|-------------------|
| **Next.js** | Framework website | Kerangka dasar untuk membangun rumah (website) |
| **React** | Library tampilan | Set komponen untuk mendesain interior rumah |
| **TypeScript** | Bahasa pemrograman | Bahasa yang digunakan untuk menulis instruksi |
| **Tailwind CSS** | Styling | Cat dan dekorasi untuk mempercantik tampilan |
| **Firebase** | Database cloud | Gudang penyimpanan di internet |
| **Recharts** | Library grafik | Alat untuk menggambar grafik dan chart |
| **Google Gemini AI** | Analisis cerdas | Konsultan AI yang memberikan saran |
| **Language Context (ID/EN)** | Multi-bahasa UI | Saklar bahasa untuk mengganti teks di aplikasi |

---

## 🚦 Mekanisme Update Data Real-Time

### Bagaimana Data Bisa Update Tanpa Refresh?

```
Traditional Website (Old Way):
User → Click Refresh → Request Data → Server → Response → Display
(Harus refresh manual setiap kali ingin lihat data baru)

Real-Time Dashboard (Our System):
Firebase → Push Update → Dashboard Auto-Update → Display
(Otomatis update ketika ada data baru, tanpa intervensi user)
```

**Penjelasan Teknis Sederhana:**

1. **WebSocket Connection**: Dashboard membuat koneksi "selalu hidup" dengan Firebase
2. **Listener**: Sistem "mendengarkan" setiap perubahan data
3. **Event-Driven**: Ketika data berubah, event dipicu dan dashboard diupdate
4. **Efficient**: Hanya data yang berubah saja yang dikirim, bukan seluruh database

---

## 📱 Flow Diagram: Dari Sensor ke Layar Anda

```
┌──────────────┐
│   SENSOR     │ ← Mengukur kondisi (suhu, kelembaban, dll)
│  (Hardware)  │
└──────┬───────┘
       │ Data mentah (analog/digital)
       ↓
┌──────────────┐
│ MIKRO-       │ ← Memproses data, mengirim via WiFi
│ KONTROLER    │
│ (ESP32)      │
└──────┬───────┘
       │ HTTP Request (JSON format)
       ↓
┌──────────────┐
│   INTERNET   │ ← Jalur komunikasi
└──────┬───────┘
       │ Upload ke cloud
       ↓
┌──────────────┐
│   FIREBASE   │ ← Menyimpan & sinkronisasi data
│   DATABASE   │
└──────┬───────┘
       │ Real-time sync
       ↓
┌──────────────┐
│  DASHBOARD   │ ← Mengambil & menampilkan data
│  (Next.js)   │
└──────┬───────┘
       │ Render HTML/CSS
       ↓
┌──────────────┐
│   BROWSER    │ ← Yang Anda lihat di layar
│  (User View) │
└──────────────┘
```

---

## 🎓 FAQ untuk Non-Teknis

### Q1: Apakah saya perlu coding untuk menggunakan dashboard ini?
**A:** Tidak! Dashboard sudah jadi dan tinggal digunakan. Anda hanya perlu:
- Buka browser (Chrome, Firefox, dll)
- Akses website dashboard
- Lihat data yang tampil

### Q2: Bagaimana cara sensor mengirim data?
**A:** Sensor terhubung ke perangkat WiFi kecil (seperti ESP32). Perangkat ini otomatis mengirim data ke internet setiap beberapa detik. Anda tidak perlu melakukan apa-apa.

### Q3: Apakah data bisa hilang?
**A:** Tidak. Data disimpan di cloud (Firebase) yang sangat aman dan reliabel. Bahkan jika website mati, data tetap tersimpan.

### Q4: Berapa lama data bisa ditampilkan?
**A:** Real-time! Begitu sensor mendeteksi perubahan, dalam 1-2 detik data sudah muncul di dashboard Anda.

### Q5: Apakah bisa diakses dari smartphone?
**A:** Ya! Dashboard responsive, bisa dibuka dari HP, tablet, atau komputer dengan tampilan yang menyesuaikan.

### Q6: Bagaimana jika internet mati?
**A:** 
- Sensor akan menyimpan data sementara (buffering)
- Ketika internet kembali, data otomatis terupload
- Dashboard menampilkan indikator "offline" jika koneksi terputus

### Q7: Apakah bisa menampilkan data historis?
**A:** Ya! Dashboard menampilkan grafik yang menunjukkan perubahan data dari waktu ke waktu (misalnya: suhu 24 jam terakhir).

### Q8: Apa bedanya dengan aplikasi cuaca biasa?
**A:** 
- Aplikasi cuaca: Data umum dari stasiun meteorologi
- Dashboard ini: Data spesifik dari sensor ANDA di lokasi ANDA
- Lebih akurat dan relevan untuk kebutuhan Anda

---

## 🎨 Penjelasan Antarmuka (UI) Dashboard

### 1. **Sidebar Navigasi**
```
┌─────────────────┐
│  ≡ Menu         │ ← Buka/tutup menu
│                 │
│  🏠 Dashboard   │ ← Halaman utama
│  💧 Soil Moist. │ ← Kelembaban tanah
│  📊 Analytics   │ ← Analisis data
│  ⚙️  Settings   │ ← Pengaturan
└─────────────────┘
```

### 2. **Kartu Sensor**
```
┌─────────────────────┐
│  🌡️ Suhu           │
│                     │
│      30°C          │ ← Angka besar (data terkini)
│                     │
│  ⏱️ 2 menit lalu    │ ← Timestamp
└─────────────────────┘
```

### 2.1 **Tombol Bahasa (ID/EN)**
Pada halaman **Analytics**, di bagian header kanan (dekat jam & tanggal) terdapat tombol:

- **ID**: Bahasa Indonesia
- **EN**: English

Perubahan bahasa akan memengaruhi teks di panel:
- Jadwal Analisis
- Riwayat Analisis
- Hasil Analisis AI (label statistik, tombol aksi, dan empty state)

### 3. **Grafik Historis**
```
📈 Grafik Suhu 24 Jam
35°C ┤     ╱╲
30°C ┤   ╱    ╲
25°C ┤ ╱        ╲
20°C ┼────────────────→
     00:00  12:00  24:00
```

### 4. **Panel AI Analysis**
```
┌─────────────────────────────┐
│ 🤖 AI Analysis              │
│                             │
│ 📋 Rekomendasi:             │
│ • Kelembaban tanah 45%      │
│ • Suhu optimal              │
│ • Disarankan penyiraman     │
│   dalam 4 jam               │
│                             │
│ [🔄 Analisis Ulang]         │
└─────────────────────────────┘
```

---

## 🌟 Keuntungan Menggunakan Sistem Ini


### ✅ Untuk Pengguna:
- ⚡ **Akses Real-Time**: Lihat kondisi terkini kapan saja, di mana saja
- 📱 **Mobile-Friendly**: Pantau dari smartphone di perjalanan
- 🎯 **Mudah Dipahami**: Interface intuitif dengan kode warna
- 🤖 **AI Assistant**: Dapat rekomendasi dari kecerdasan buatan
- 📊 **Data Historis**: Analisis tren dan pola dari waktu ke waktu
- 🚨 **Alert System**: Notifikasi jika ada kondisi abnormal

### ✅ Untuk Bisnis:
- 💰 **Efisiensi Operasional**: Mengurangi kunjungan lapangan
- 📈 **Data-Driven Decision**: Keputusan berdasarkan data akurat
- ⏰ **Hemat Waktu**: Monitoring otomatis 24/7
- 🔍 **Transparansi**: Semua stakeholder bisa lihat data yang sama
- 📉 **Kurangi Risiko**: Deteksi masalah sebelum jadi besar

---

## 📋 Prerequisites (Yang Dibutuhkan untuk Instalasi)

**Untuk Non-Teknis:** Bagian ini untuk tim IT Anda. Beritahu mereka bahwa sistem memerlukan:
- Node.js versi 18 atau lebih baru (software untuk menjalankan aplikasi)
- Akun Firebase (tempat penyimpanan data di cloud - gratis untuk pemula)
- Koneksi internet

**Untuk Teknis:**
- Node.js 18.x or higher
- npm or yarn
- Firebase account with Realtime Database enabled

---

## 🛠️ Panduan Instalasi (Untuk Tim IT)

### Langkah 1: Persiapan Project
```bash
cd iot-dashboard
```

### Langkah 2: Install Dependencies
```bash
npm install
```

### Langkah 3: Setup Environment Variables
Copy file konfigurasi:
```bash
cp .env.example .env.local
```

### Langkah 4: Konfigurasi Firebase

**Penjelasan Non-Teknis:** Ini seperti memberikan "kunci" kepada aplikasi untuk mengakses gudang data Firebase Anda.

Edit file `.env.local` dengan kredensial Firebase Anda:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Langkah 5: Konfigurasi OpenWeather API (Untuk Prakiraan Cuaca)

**Penjelasan Non-Teknis:** API ini memberi akses ke data prakiraan cuaca 7 hari untuk berbagai lokasi di dunia.

1. **Daftar Akun OpenWeather:**
   - Kunjungi: [https://openweathermap.org/api](https://openweathermap.org/api)
   - Klik "Sign Up" untuk membuat akun gratis
   - Konfirmasi email Anda

2. **Dapatkan API Key:**
   - Login ke akun OpenWeather Anda
   - Pergi ke bagian "API Keys"
   - Copy API key yang tersedia (atau generate baru)

3. **Tambahkan ke `.env.local`:**
   ```bash
   NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key_here
   ```

4. **Fitur yang Didapat (Free Tier):**
   - ✅ 1,000 API calls per hari
   - ✅ Prakiraan cuaca 7 hari
   - ✅ Data cuaca terkini
   - ✅ Update setiap 10 menit
   - ✅ 15+ kota besar Indonesia sudah tercantum

**Note:** Setelah menambahkan API key, restart development server (`npm run dev`)

### Langkah 6: Jalankan Development Server
```bash
npm run dev
```

### Langkah 7: Akses Dashboard
Buka browser dan kunjungi: [http://localhost:3000](http://localhost:3000)

---

## 📊 Struktur Data Firebase

**Penjelasan Non-Teknis:** Ini adalah cara data disusun di "gudang" Firebase, seperti rak-rak di perpustakaan.

Dashboard mengharapkan data di path `sensors/` dengan struktur:

```json
{
  "sensors": {
    "temperature": 30,        // Suhu dalam Celsius
    "humidity": 80,          // Kelembaban dalam persen
    "soilMoisture": 45,      // Kelembaban tanah dalam persen
    "status": "active",      // Status sensor (aktif/tidak)
    "timestamp": 1704934800  // Waktu pengukuran
  }
}
```

### Contoh Data Real-World:
```json
{
  "sensors": {
    "temperature": 28.5,
    "humidity": 65,
    "soilMoisture": 42,
    "status": "active",
    "lastUpdate": "2026-01-10T10:30:00Z"
  }
}
```

### Aturan Firebase untuk Development

**Untuk Development/Testing** (⚠️ TIDAK untuk production):
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

**Untuk Production** (Lebih aman):
```json
{
  "rules": {
    "sensors": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

---

## 📁 Struktur Project (Penjelasan Folder)

```
iot-dashboard/
├── src/                          # Source code utama
│   ├── app/                      # Halaman-halaman dashboard
│   │   ├── page.tsx              # 🏠 Halaman utama (Dashboard)
│   │   ├── layout.tsx            # Template dasar semua halaman
│   │   ├── globals.css           # Style global
│   │   ├── api/                  # API endpoints
│   │   │   ├── analyze-soil/     # Endpoint analisis tanah
│   │   │   ├── sensor-data-local/ # Endpoint data sensor lokal
│   │   │   └── validate-api-key/ # Validasi kunci API
│   │   └── soil-moisture/        # 💧 Halaman kelembaban tanah
│   │       └── page.tsx
│   │
│   ├── components/               # Komponen UI reusable
│   │   ├── DashboardLayout.tsx   # Layout dashboard
│   │   ├── Sidebar.tsx           # Menu samping
│   │   ├── AIAnalysisPanel.tsx   # Panel analisis AI
│   │   ├── HeatmapCanvas.tsx     # Visualisasi heatmap
│   │   └── ...                   # Komponen lainnya
│   │
│   ├── firebase/                 # Konfigurasi Firebase
│   │   └── config.ts             # Setup koneksi ke Firebase
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useSensorData.ts      # Hook untuk data sensor real-time
│   │   ├── useAIAnalysis.ts      # Hook untuk analisis AI
│   │   └── useSoilMoistureData.ts # Hook untuk data kelembaban tanah
│   │
│   └── utils/                    # Utility functions
│       └── historyManager.ts     # Manajemen riwayat data
│
├── public/                       # File publik (gambar, data statis)
│   └── data/
│       └── sensor-data.json      # Data sensor sample
│
├── .env.local                    # Environment variables (RAHASIA!)
├── .env.example                  # Template environment variables
├── package.json                  # Daftar dependencies
├── tailwind.config.ts            # Konfigurasi styling
├── tsconfig.json                 # Konfigurasi TypeScript
└── README.md                     # File yang sedang Anda baca ini!
```

**Penjelasan Sederhana Setiap Bagian:**

| Folder/File | Fungsi | Analogi |
|-------------|--------|---------|
| `src/app/` | Halaman-halaman website | Kamar-kamar dalam rumah |
| `src/components/` | Komponen UI yang bisa dipakai berulang | Furniture yang bisa dipindah-pindah |
| `src/firebase/` | Koneksi ke database | Jalur telepon ke gudang data |
| `src/hooks/` | Logic untuk ambil & kelola data | Remote control untuk berbagai fungsi |
| `src/utils/` | Fungsi pembantu | Toolbox dengan berbagai alat |
| `public/` | File yang bisa diakses publik | Etalase toko yang terlihat semua orang |
| `.env.local` | Kunci rahasia aplikasi | Brankas dengan password |

---

## 🚀 Deploy ke Internet (Production)

**Penjelasan Non-Teknis:** Setelah development selesai, aplikasi perlu "dipublikasikan" agar bisa diakses dari internet. Vercel adalah platform hosting yang memudahkan proses ini.

### Opsi 1: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login ke Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Tambahkan Environment Variables di Vercel**
   - Masuk ke dashboard Vercel
   - Pilih project Anda
   - Settings → Environment Variables
   - Tambahkan semua variable `NEXT_PUBLIC_FIREBASE_*`

### Opsi 2: Deploy via GitHub (Recommended)

**Penjelasan:** Cara ini otomatis deploy setiap kali Anda update kode.

1. **Push code ke GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/username/iot-dashboard.git
   git push -u origin main
   ```

2. **Import ke Vercel**
   - Kunjungi [vercel.com/new](https://vercel.com/new)
   - Pilih repository GitHub Anda
   - Tambahkan environment variables
   - Klik Deploy

3. **Hasil**
   - Anda akan dapat URL publik (contoh: `your-app.vercel.app`)
   - Setiap update di GitHub otomatis ter-deploy

### Environment Variables di Vercel

**Penting!** Jangan lupa tambahkan semua variable ini:

| Variable | Deskripsi |
|----------|-----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Kunci API Firebase |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Domain autentikasi |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | URL database |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID project Firebase |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Bucket penyimpanan |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ID sender messaging |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ID aplikasi |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | ID measurement (opsional) |

---

## 🔧 Kustomisasi

### Menambah Sensor Baru

**Skenario:** Anda ingin menambah sensor tekanan udara

**Langkah untuk Developer:**

1. Update interface `SensorData` di `src/hooks/useSensorData.ts`:
   ```typescript
   export interface SensorData {
     temperature: number;
     humidity: number;
     soilMoisture: number;
     pressure?: number;  // ← Sensor baru
     status: string;
   }
   ```

2. Tambah sensor card di `src/app/page.tsx`:
   ```typescript
   <div className="sensor-card">
     <h3>🌪️ Tekanan Udara</h3>
     <p>{data.pressure} hPa</p>
   </div>
   ```

3. Update Firebase data structure untuk include `pressure`

### Mengubah Threshold Alert

Edit di file komponen terkait untuk mengubah kapan alert muncul:

```typescript
// Contoh: Ubah threshold suhu dari 35°C ke 32°C
const TEMP_DANGER_THRESHOLD = 32;  // Sebelumnya 35
```

### Mengubah Firebase Path

Jika data Anda di path berbeda, ubah di hook:

```typescript
const { data, loading, error } = useSensorData("custom/path/sensors");
```

---

## 🎓 Tutorial Video & Dokumentasi Tambahan

### Untuk User Non-Teknis:
1. **Tutorial Akses Dashboard** - Cara buka dan baca dashboard
2. **Memahami Grafik** - Cara interpretasi data visual
3. **Setup Alert** - Cara atur notifikasi

### Untuk Developer:
1. **Setup Development Environment** - Environment setup lengkap
2. **Firebase Integration** - Cara integrasikan Firebase
3. **Custom Sensor Integration** - Tambah sensor baru
4. **Deploy & Maintenance** - Best practices deployment

---

## 🐛 Troubleshooting (Mengatasi Masalah)

### Masalah Umum untuk User:

#### 1. Dashboard tidak menampilkan data
**Penyebab Mungkin:**
- Sensor offline / tidak mengirim data
- Koneksi internet bermasalah
- Firebase database kosong

**Solusi:**
- Cek koneksi internet Anda
- Refresh browser (F5)
- Hubungi administrator jika masih bermasalah

#### 2. Data tidak update real-time
**Penyebab:**
- Browser tab tidak aktif
- Connection timeout

**Solusi:**
- Aktifkan tab dashboard
- Refresh halaman
- Cek indikator koneksi di dashboard

#### 3. Grafik tidak muncul
**Penyebab:**
- Belum ada data historis
- Browser tidak support

**Solusi:**
- Tunggu beberapa menit agar data terkumpul
- Gunakan browser modern (Chrome, Firefox, Edge)

### Masalah Teknis untuk Developer:

#### 1. Firebase Connection Error
```bash
Error: Permission denied
```
**Solusi:**
- Cek Firebase rules
- Pastikan `.env.local` sudah benar
- Verifikasi kredensial Firebase

#### 2. Build Error
```bash
Error: Module not found
```
**Solusi:**
```bash
rm -rf node_modules
npm install
```

#### 3. TypeScript Errors
**Solusi:**
- Cek type definitions
- Update `@types` packages
- Restart TypeScript server

---

## 📞 Support & Kontak

### Butuh Bantuan?

**Untuk User Non-Teknis:**
- 📧 Email: support@yourdomain.com
- 💬 Live Chat: Available 9AM - 5PM
- 📱 WhatsApp: +62-XXX-XXXX-XXXX

**Untuk Developer:**
- 🐛 Report Bug: GitHub Issues
- 💡 Feature Request: GitHub Discussions
- 📚 Documentation: Wiki

---

## 📚 Glossary (Kamus Istilah)

Untuk memudahkan pemahaman, berikut penjelasan istilah teknis:

| Istilah | Penjelasan Sederhana |
|---------|---------------------|
| **Dashboard** | Halaman utama yang menampilkan semua informasi penting |
| **Real-time** | Data yang diperbarui secara langsung, tanpa delay |
| **Sensor** | Alat yang mengukur kondisi lingkungan (suhu, kelembaban, dll) |
| **Cloud** | Penyimpanan data di internet, bukan di komputer lokal |
| **API** | Jembatan komunikasi antara aplikasi yang berbeda |
| **Firebase** | Platform Google untuk penyimpanan data real-time |
| **IoT** | Internet of Things - perangkat yang terhubung internet |
| **Deployment** | Proses mempublikasikan aplikasi ke internet |
| **Frontend** | Bagian aplikasi yang terlihat user (tampilan) |
| **Backend** | Bagian aplikasi yang tidak terlihat (logic & database) |
| **Responsive** | Tampilan yang menyesuaikan ukuran layar |
| **Environment Variables** | Konfigurasi rahasia aplikasi (password, API key) |

---

## 🎯 Roadmap & Fitur Mendatang

### Phase 1: Current ✅
- [x] Real-time sensor monitoring
- [x] Visual dashboard with charts
- [x] AI-powered analysis
- [x] Responsive design
- [x] Heatmap visualization

### Phase 2: In Progress 🚧
- [ ] Multi-user authentication
- [ ] Custom alert rules
- [ ] Email/SMS notifications
- [ ] Data export (CSV, PDF)
- [ ] Advanced filtering

### Phase 3: Planned 📅
- [ ] Mobile app (iOS/Android)
- [ ] Voice commands (Alexa, Google Home)
- [ ] Predictive analytics
- [ ] Machine learning models
- [ ] Integration dengan smart devices lain

---

## 📝 Changelog (Riwayat Perubahan)

### Version 2.0.0 (Current)
- ✨ Tambah AI Analysis dengan Gemini
- ✨ Soil moisture heatmap visualization
- ✨ Analysis scheduling
- ✨ Multi-bahasa (ID/EN) untuk halaman Analytics + tombol language switcher di header
- 🐛 Fix real-time data sync issues
- 📝 Comprehensive documentation

### Version 1.0.0
- 🎉 Initial release
- ✨ Basic sensor monitoring
- ✨ Real-time updates
- ✨ Responsive design

---

## 📖 Best Practices

### Untuk User:
1. **Rutin Cek Dashboard**: Setidaknya 2-3 kali sehari
2. **Perhatikan Alert**: Jangan abaikan notifikasi merah
3. **Gunakan AI Analysis**: Manfaatkan rekomendasi AI
4. **Monitor Tren**: Lihat grafik historis untuk pola

### Untuk Administrator:
1. **Backup Data**: Lakukan backup database secara berkala
2. **Monitor Sensor Health**: Pastikan semua sensor aktif
3. **Update System**: Keep dependencies up-to-date
4. **Security**: Regularly review Firebase rules

### Untuk Developer:
1. **Code Quality**: Follow TypeScript best practices
2. **Testing**: Test before deploy
3. **Documentation**: Document setiap perubahan
4. **Version Control**: Commit dengan pesan yang jelas

---

## 🌍 Use Cases di Berbagai Industri

### 1. Agriculture (Pertanian) 🌾
- Monitor kelembaban tanah multi-area
- Optimasi jadwal penyiraman
- Deteksi dini penyakit tanaman

### 2. Greenhouse Management 🏡
- Kontrol suhu & kelembaban optimal
- Automation sistem ventilasi
- Maximize hasil panen

### 3. Smart Home 🏠
- Monitor kualitas udara dalam ruangan
- Efisiensi penggunaan AC
- Kenyamanan penghuni

### 4. Warehouse Storage 📦
- Kondisi penyimpanan optimal
- Prevent product damage
- Compliance monitoring

### 5. Research & Development 🔬
- Data collection untuk penelitian
- Environmental studies
- Climate monitoring

---

## 🎓 Learning Resources

### Untuk Pemula:
- **IoT Basics**: Pengenalan IoT dan sensor
- **Dashboard Navigation**: Cara menggunakan dashboard
- **Understanding Data**: Interpretasi data sensor

### Untuk Intermediate:
- **Firebase Basics**: Pengenalan Firebase
- **React Fundamentals**: Dasar-dasar React
- **API Integration**: Cara kerja API

### Untuk Advanced:
- **Next.js Deep Dive**: Advanced Next.js features
- **Real-time Database**: Firebase real-time sync
- **AI Integration**: Implementing AI analysis

---

## 📄 License (Lisensi)

MIT License - Bebas digunakan untuk personal maupun komersial

---

## 🤝 Contributing (Berkontribusi)

Kami menerima kontribusi dari siapa saja!

### Cara Berkontribusi:
1. Fork repository ini
2. Buat branch baru (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

### Panduan Kontribusi:
- Follow coding standards
- Write clear commit messages
- Add tests jika memungkinkan
- Update documentation

---

## 🙏 Acknowledgments (Ucapan Terima Kasih)

- **Next.js Team** - Framework yang luar biasa
- **Firebase Team** - Real-time database yang powerful
- **Vercel** - Hosting yang mudah dan cepat
- **Community Contributors** - Terima kasih atas semua kontribusinya

---

## 📞 Emergency Contacts

### Jika Sistem Down:
1. Cek [Status Page](https://status.yourdomain.com)
2. Hubungi tim teknis: emergency@yourdomain.com
3. Emergency hotline: +62-XXX-XXXX-XXXX (24/7)

---

## 💡 Tips & Tricks

### Untuk Efficiency:
- Gunakan keyboard shortcuts (jika ada)
- Bookmark halaman penting
- Set up custom alerts
- Review AI analysis secara rutin

### Untuk Better Analysis:
- Compare data day-over-day
- Look for patterns
- Act on AI recommendations
- Keep historical records

---

## 🎉 Kesimpulan

Dashboard IoT ini dirancang untuk memudahkan monitoring sensor secara real-time dengan antarmuka yang user-friendly. Baik Anda pengguna non-teknis yang hanya ingin melihat data, maupun developer yang ingin kustomisasi sistem, dokumentasi ini memberikan panduan lengkap untuk setiap level.

**Key Takeaways:**
- ✅ System bekerja otomatis 24/7
- ✅ Data real-time tanpa delay
- ✅ AI memberikan rekomendasi cerdas
- ✅ Accessible dari mana saja
- ✅ Mudah dipahami oleh siapa saja

---

**Dibuat dengan ❤️ untuk memudahkan monitoring IoT**

*Last Updated: March 21, 2026*
