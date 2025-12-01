🚀 tiktok Registration Automation
Playwright · TypeScript · Node.js

✨ Fitur Utama
🔹 Automated tiktok Registration — mengisi semua form secara otomatis
🔹 Auto Birthday Generator — random but realistic
🔹 Mass Registration (Excel) — daftar ratusan akun sekaligus
🔹 Email/OTP Handler (Manual)
🔹 Save Output — hasil akun tersimpan dalam JSON/Excel

📦 Teknologi
Node.js 21+
TypeScript
Playwright (Chromium automation)
XLSX (Mass input processing)

📁 Struktur Direktori
src/
 ├── cookies_ig/
 ├── data/
 ├── logs/
 ├── profiles_ig/
 ├── src/
        ├── utils/
 ├── README.md/

⚙️ Instalasi
npm install

▶️ Cara Menjalankan
npx ts-node src/tiktok_reg.ts

🔄 Alur Kerja Automasi

1. Memuat data (manual/Excel)
2. Membuka halaman pendaftaran Instagram
3. Mengisi email dan password
4. Mengatur tanggal lahir otomatis
5. Men-submit formulir
6. Verifikasi email & OTP
7. Menyimpan akun berhasil ke output file
