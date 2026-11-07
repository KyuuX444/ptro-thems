# Pterodactyl Suite: Clean Monochrome Theme & Autonomous AI Agent

Paket lengkap redesign tampilan **Clean Monochrome + Geometric Grid** dan modul terintegrasi **Autonomous AI Agent (Google Antigravity CLI Engine)** untuk Pterodactyl Panel.

---

## 🌟 Fitur Utama

### 1. Clean Monochrome & Geometric Grid Theme
- **Dominasi Palette**: `#090909` (Primary Dark), `#101010` (Surface / Nav), `#141414` (Cards & Editor), `#292929` (Borders), `#F5F5F5` (Headings & Primary Text), `#929292` (Secondary Text).
- **Global Geometric Grid**: Latar belakang pola grid kotak-kotak 2D minimalis yang ringan dan simetris tanpa efek 3D atau neon yang mengganggu mata.
- **Monochrome Login Redesign**:
  - Tampilan login terpusat ala SaaS enterprise modern.
  - Form email & password dengan fitur show/hide password.
  - Checkbox Remember Me & link Forgot Password.
  - Tombol login putih tegas dengan teks hitam kontras tinggi.
- **Top Bar Bersih (Clean Header)**:
  - Navigasi atas dibuat bersih dan tidak berdesakan.
  - Icon profil, akun, logout, dan dashboard dipindahkan eksklusif ke dalam **Burger Bar Drawer**.
  - Sisi kanan menyisakan tombol pencarian server (*Search / Cmd+K*).
- **Admin Control Panel (`/admin`)**:
  - Seluruh layout AdminLTE disesuaikan ke tema gelap monokrom via `admin.css`.
  - Sub-navigation tab bar pada Server, Node, Nest, dan Egg menggunakan *segmented pill buttons* dengan flex gap teratur agar tidak berdempetan.

### 2. VS Code Inspired File Manager
- **Sidebar File Explorer**: Struktur pohon folder & file dengan icon spesifik sesuai ekstensi (JS, TS, JSON, YML, PY, PHP, HTML, CSS, ZIP, gambar, dll).
- **Multi-Tab Code Editor**: Buka beberapa file sekaligus dengan tab mandiri, indikator perubahan (*dirty state*), dan penutup tab.
- **Syntax Auto-Detection**: Deteksi bahasa pemrograman otomatis berbasis ekstensi file langsung melalui CodeMirror.
- **Fitur Tambahan**: Pencarian file instan, toggle word-wrap, shortcut keyboard (<kbd>Ctrl</kbd> + <kbd>S</kbd> untuk save), serta modal pembuatan file/folder yang aman.

### 3. Autonomous AI Agent Module
- **Engine**: Menggunakan official Google Antigravity CLI (`agy`) yang berjalan langsung di dalam container server pengguna.
- **Agent Overview**: Metrik status 4-kolom responsif (Agent Status dengan animasi pulsing, CLI Engine, Google Account, Container Host).
- **Lifecycle Control**: Start, Stop (dengan konfirmasi dialog aman), Restart, Auto-restart toggle, dan Session Persistence.
- **Google Antigravity CLI OAuth**:
  - Alur otorisasi 2 langkah: Buka link otorisasi Google resmi & masukkan kode verifikasi perangkat.
  - Tanpa mengekspos raw token, secret, atau password sensitif.
  - Fitur disconnect akun Google dengan modal konfirmasi.
- **Interactive Prompt CLI**: Input prompt dengan dukungan baris baru (<kbd>Shift</kbd> + <kbd>Enter</kbd>), status loading interaktif, dan riwayat output yang dapat di-copy.
- **Monospace Terminal Log Viewer**: Terminal berlatar `#0A0A0A` dengan syntax coloring per tingkat log (`INFO`, `SUCCESS`, `WARNING`, `ERROR`), line numbers, toggle auto-scroll, refresh, dan clear terminal.

---

## 📦 Struktur Paket

```text
pterodactyl-package/
├── install.sh                  # Interactive bash installer
├── README.md                   # Dokumentasi instalasi dan penggunaan
├── theme/                      # Berkas tema monokrom & file manager
│   ├── public/
│   │   └── themes/pterodactyl/css/
│   │       └── admin.css       # Stylesheet tema area admin
│   └── resources/
│       ├── scripts/
│       │   └── components/
│       │       ├── NavigationBar.tsx
│       │       ├── auth/
│       │       │   ├── LoginContainer.tsx
│       │       │   └── LoginFormContainer.tsx
│       │       └── server/files/
│       │           ├── VsCodeFileManager.tsx
│       │           ├── FileManagerContainer.tsx
│       │           ├── FileIcons.tsx
│       │           └── FileEditContainer.tsx
│       └── views/
│           ├── admin/index.blade.php
│           ├── layouts/admin.blade.php
│           └── templates/auth/core.blade.php
└── ai-agent/                   # Berkas modul AI Agent
    ├── app/
    │   ├── Http/Controllers/Api/Client/Servers/
    │   │   └── AIAgentController.php
    │   └── Services/AIAgent/
    │       └── AIAgentService.php
    ├── resources/scripts/
    │   ├── api/server/ai-agent/index.ts
    │   ├── routers/routes.ts
    │   └── components/server/ai-agent/
    │       ├── agent.types.ts
    │       ├── useAIAgent.ts
    │       ├── AgentStatusBadge.tsx
    │       ├── AgentOverview.tsx
    │       ├── AgentControls.tsx
    │       ├── AgentAuthentication.tsx
    │       ├── AgentPromptInput.tsx
    │       ├── AgentLogViewer.tsx
    │       └── AIAgentContainer.tsx
    └── routes/
        └── api-client.php
```

---

## 🚀 Panduan Instalasi Cepat (Automated)

1. Clone repositori ke VPS Anda:
   ```bash
   git clone https://github.com/KyuuX444/ptro-thems.git
   cd ptro-thems
   ```

2. Jalankan installer script dengan akses root:
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

3. Pilih opsi yang Anda inginkan:
   - **`[1]` Install Theme Only**: Mengubah tampilan Panel Client, Halaman Login, File Manager VS Code, dan Admin ke Clean Monochrome.
   - **`[2]` Install AI Agent Module Only**: Memasang backend controller, routing API, dan UI AI Agent Google Antigravity.
   - **`[3]` Install Everything**: Memasang seluruh paket secara lengkap (Tema + File Manager + AI Agent).

Script installer akan secara otomatis membuat backup berkas lama, menyalin berkas baru, membersihkan cache Laravel, mengompilasi aset Webpack produksi (`yarn build:production`), dan mengatur permission web server (`chown -R www-data:www-data`).

---

## 🛠️ Instalasi Manual

Jika Anda lebih memilih menyalin berkas secara manual:

### 1. Salin Berkas Tema
```bash
cp -rf theme/resources/* /var/www/pterodactyl/resources/
mkdir -p /var/www/pterodactyl/public/themes/pterodactyl/css/
cp -f theme/public/themes/pterodactyl/css/admin.css /var/www/pterodactyl/public/themes/pterodactyl/css/
```

### 2. Salin Berkas AI Agent
```bash
cp -rf ai-agent/app/* /var/www/pterodactyl/app/
cp -rf ai-agent/resources/* /var/www/pterodactyl/resources/
cp -f ai-agent/routes/api-client.php /var/www/pterodactyl/routes/api-client.php
```

### 3. Build & Bersihkan Cache
```bash
cd /var/www/pterodactyl
php artisan view:clear
php artisan config:clear
php artisan cache:clear

# Kompilasi assets produksi
yarn build:production

# Perbaiki permission
chown -R www-data:www-data /var/www/pterodactyl
chmod -R 755 /var/www/pterodactyl/storage /var/www/pterodactyl/bootstrap/cache
```

---

## ⚙️ Konfigurasi Egg Server untuk AI Agent

Untuk mengizinkan container server menjalankan Google Antigravity CLI Engine (`agy`), pastikan variabel berikut terdaftar pada Egg server (misal: NodeJS / Python / Generic Egg):

| Nama Variabel | Environment Variable | Default Value | Deskripsi |
| :--- | :--- | :--- | :--- |
| Enable AI Agent | `AI_AGENT_ENABLED` | `1` | Aktifkan background daemon AI Agent |
| AI Agent Mode | `AI_AGENT_MODE` | `antigravity` | Engine CLI yang digunakan (`antigravity`) |
| Login Method | `AI_LOGIN_METHOD` | `google_oauth` | Mode autentikasi (`google_oauth`) |
| Auto Restart | `AI_AUTO_RESTART` | `1` | Restart otomatis saat agent terputus |
| Session Persistence | `AI_SESSION_PERSISTENCE` | `1` | Simpan riwayat chat sesi di container |

---

## 👤 Creator & Credits

- **Developer / Creator**: **Kyzz / Kyuu**
- **GitHub**: [@KyuuX444](https://github.com/KyuuX444)
- **Web API**: [api.kyzzz.xyz](https://api.kyzzz.xyz)
- **Engine Core**: Google Antigravity CLI (`agy`) & Pterodactyl Panel Community

---

## ⚖️ Lisensi & Ketentuan (STRICTLY NO SELL)

Proyek ini dirilis di bawah ketentuan **Custom Non-Commercial License**:

> [!CAUTION]
> **DILARANG KERAS MEMPERJUALBELIKAN (STRICTLY NOT FOR SALE)**
> Tema, modul AI Agent, script installer, maupun modifikasi dari repositori ini disediakan gratis untuk komunitas dan **TIDAK BOLEH** dijual, dikomersialkan, atau dijadikan layanan berbayar dalam bentuk apapun.

### Ketentuan Penggunaan:
1. **Gratis & Non-Komersial**: Bebas digunakan untuk keperluan pribadi, homelab, maupun hosting komunitas tanpa pungutan biaya.
2. **Larangan Penjualan (No Commercial Sale)**: Tidak diizinkan menjual ulang file, paket installer, atau layanan pemasangan berbayar yang mengklaim karya ini sebagai produk komersial.
3. **Pertahankan Atribusi (Keep Credits)**: Wajib menyertakan nama dan kredit asli Creator (**Kyuu / Kyzz / KyuuX444**) jika Anda memodifikasi atau mendistribusikan ulang.
4. **Kompatibilitas**: Kompatibel penuh dengan **Pterodactyl Panel v1.10.x - v1.15.x** dengan tetap mempertahankan integritas sistem autentikasi asli, middleware CSRF, database migrations, dan Wings daemon.
