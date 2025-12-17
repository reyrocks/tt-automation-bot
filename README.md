🚀 tiktok Registration Automation
Playwright · TypeScript · Node.js

✨ Fitur Utama
🔹 Automated tiktok Registration — mengisi semua form secara otomatis
🔹 Auto Birthday Generator — random but realistic
🔹 Mass Registration (CSV) — daftar banyak akun sekaligus
🔹 Email/OTP Handler (Manual / semi-auto)
🔹 Save Output — hasil akun tersimpan dalam JSON/Excel

📦 Teknologi
Node.js 21+
TypeScript
Playwright (Chromium automation)
CSV (Mass input processing)

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

🧾 Format Input (`data/accounts.csv`)
- Tanpa header
- 1 baris = 1 akun
- Format: `email,password`
- Juga support delimiter `;` (jadi `email;password`)

Contoh:
email1@example.com,password1
email2@example.com;password2

🔄 Alur Kerja Automasi

1. Memuat data akun dari CSV
2. Membuka halaman signup TikTok
3. Mengisi tanggal lahir (auto)
4. Memilih tab email (jika perlu), isi email & password
5. Klik "Kirim Kode"
6. Manual: selesaikan CAPTCHA dan isi OTP dari email
7. Klik "Berikutnya", lalu simpan cookies
