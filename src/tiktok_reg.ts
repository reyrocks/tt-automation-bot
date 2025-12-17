import { chromium } from 'playwright-extra'; 
import { Page, Locator } from 'playwright';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { readAccountsFromCsv, type AccountRecord } from './utils/csvReader';
import { humanType, randomDelay } from './utils/humanHelper';
import fs from 'fs';
import path from 'path';

chromium.use(stealthPlugin());

// CSV tanpa header: tiap baris -> email,password (atau email;password)
const DATA_PATH = './data/accounts.csv';
const PROFILES_DIR = './profiles_tt';
const COOKIES_DIR = './cookies_tt';
const LOGS_DIR = './logs';

[PROFILES_DIR, COOKIES_DIR, LOGS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

// Helper: Isi Tanggal Lahir (REVISI V2 - Explicit Click)
async function fillBirthday(page: any) {
    console.log('   Mengisi Tanggal Lahir...');
    
    // Tunggu elemen muncul
    try {
        await Promise.race([
            page.waitForSelector('div:has-text("Bulan")', { timeout: 10000 }),
            page.waitForSelector('div:has-text("Month")', { timeout: 10000 }),
            page.waitForSelector('select', { timeout: 10000 })
        ]);
    } catch(e) {}

    // STRATEGI 1: Native Select (Jarang ada di TikTok baru, tapi tetap kita simpan)
    const selects = await page.$$('select');
    if (selects.length >= 3) {
        console.log('   -> Menggunakan Native Select...');
        await selects[0].selectOption({ index: Math.floor(Math.random() * 11) + 1 });
        await randomDelay(300, 500);
        await selects[1].selectOption({ index: Math.floor(Math.random() * 27) + 1 });
        await randomDelay(300, 500);
        await selects[2].selectOption({ index: Math.floor(Math.random() * 10) + 18 });
        return;
    }

    // STRATEGI 2: Custom Div (FIXED)
    console.log('   -> Menggunakan Custom Div...');
    
    // --- 1. ISI BULAN ---
    try {
        // Cari div yang tulisannya "Bulan" atau "Month"
        const btnMonth = page.locator('div').filter({ hasText: /^Bulan$|^Month$/ }).last();
        await btnMonth.click({ force: true });
        await randomDelay(500, 1000);

        // Pilih Nama Bulan Secara Spesifik
        const monthsID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const monthsEN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        
        // Gabungkan list biar aman untuk locale apapun
        const targetMonth = [...monthsID, ...monthsEN][Math.floor(Math.random() * 24)];
        
        // Klik Text Bulan tersebut
        console.log(`      Memilih: ${targetMonth}`);
        const optMonth = page.getByText(targetMonth, { exact: true }).first();
        if (await optMonth.isVisible()) {
            await optMonth.click({ force: true });
        } else {
            // Fallback keyboard jika text tidak ketemu
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('Enter');
        }
    } catch(e) {
        console.log('      [Retry] Gagal klik bulan spesifik, coba keyboard...');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
    }
    await randomDelay(800, 1200);

    // --- 2. ISI HARI ---
    try {
        // Cari div Hari (biasanya di sebelah bulan)
        const btnDay = page.locator('div').filter({ hasText: /^Hari$|^Day$/ }).last();
        await btnDay.click({ force: true });
        await randomDelay(500, 1000);
        
        // Pilih angka hari (misal 15)
        const randomDay = Math.floor(Math.random() * 28) + 1;
        // Kita pakai keyboard saja untuk hari karena text angka sering duplikat
        for(let i=0; i<randomDay; i++) {
            await page.keyboard.press('ArrowDown');
        }
        await page.keyboard.press('Enter');
    } catch(e) {}
    await randomDelay(800, 1200);

    // --- 3. ISI TAHUN ---
    try {
        const btnYear = page.locator('div').filter({ hasText: /^Tahun$|^Year$/ }).last();
        await btnYear.click({ force: true });
        await randomDelay(500, 1000);
        
        // Scroll ke bawah untuk umur 18+ (misal 20x arrow down)
        for(let i=0; i<20; i++) {
            await page.keyboard.press('ArrowDown');
        }
        await page.keyboard.press('Enter');
    } catch(e) {}
    await randomDelay(1000, 2000);
}

async function dismissCommonPopups(page: Page) {
    const candidates: Locator[] = [
        page.getByRole('button', { name: /accept|agree|setuju/i }),
        page.getByRole('button', { name: /tutup|close|got it|ok/i }),
        page.getByRole('button', { name: /allow|izinkan/i }),
        page.locator('[aria-label="Close"]'),
    ];

    for (const loc of candidates) {
        try {
            const el = loc.first();
            if (await el.count() === 0) continue;
            if (await el.isVisible()) {
                await el.click({ force: true, timeout: 2000 }).catch(() => {});
                await randomDelay(250, 600);
            }
        } catch {}
    }
}

async function waitForOtpFilled(page: Page, timeoutMs = 180000): Promise<boolean> {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
        await dismissCommonPopups(page);

        // Case A: single input 6 digit
        const single = page.locator('input[type="text"][maxlength="6"], input[inputmode="numeric"][maxlength="6"]');
        try {
            if (await single.count()) {
                const el = single.first();
                if (await el.isVisible()) {
                    const v = (await el.inputValue().catch(() => '')) || '';
                    if (v.replace(/\D/g, '').length === 6) return true;
                }
            }
        } catch {}

        // Case B: 6 separate boxes maxlength=1
        const boxes = page.locator('input[type="text"][maxlength="1"], input[inputmode="numeric"][maxlength="1"]');
        try {
            const n = await boxes.count();
            if (n >= 6) {
                let filled = 0;
                for (let i = 0; i < Math.min(n, 6); i++) {
                    const v = (await boxes.nth(i).inputValue().catch(() => '')) || '';
                    if (v.trim().length === 1) filled++;
                }
                if (filled === 6) return true;
            }
        } catch {}

        await randomDelay(1000, 2000);
    }
    return false;
}

async function registerTikTok(account: AccountRecord) {
    if (!account.email || !account.password) {
        console.log(`[SKIP] Data tidak lengkap.`);
        return;
    }

    console.log(`\n=== MEMPROSES: ${account.email} ===`);

    const safeEmail = account.email.replace(/[^a-zA-Z0-9]/g, "_");
    const userProfilePath = path.join(PROFILES_DIR, `tt_${safeEmail}`);
    
    const context = await chromium.launchPersistentContext(userProfilePath, {
        headless: false, 
        channel: 'chrome', 
        viewport: { width: 1366, height: 768 },
        locale: 'id-ID', 
        args: ['--disable-blink-features=AutomationControlled', '--no-sandbox', '--disable-notifications', '--disable-dev-shm-usage', '--disable-gpu']
    });

    context.setDefaultTimeout(60000); 

    const page = await context.pages()[0] || await context.newPage();

    try {
        // 1. OPEN TIKTOK SIGNUP
        console.log('-> Membuka TikTok Signup...');
        await page.goto('https://www.tiktok.com/signup', { waitUntil: 'domcontentloaded' });
        await randomDelay(3000, 5000);
        await dismissCommonPopups(page);

        // 2. KLIK TOMBOL AWAL (Direct Link Fallback)
        console.log('-> Klik "Gunakan nomor telepon atau email"...');
        let formOpened = false;
        
        try {
            const btnText = page.getByText('Gunakan nomor telepon atau email').or(page.getByText('Use phone or email'));
            if (await btnText.isVisible()) {
                await btnText.click({ force: true });
                formOpened = true;
            }
        } catch(e) {}

        if (!formOpened) {
            console.log('   [INFO] Membuka Form Email secara langsung (Direct URL)...');
            await page.goto('https://www.tiktok.com/signup/phone-or-email/email', { waitUntil: 'domcontentloaded' });
        }
        
        console.log('-> Menunggu Form Muncul...');
        await page.waitForTimeout(3000);
        await dismissCommonPopups(page);

        // 3. ISI TANGGAL LAHIR (FIXED)
        await fillBirthday(page);
        await dismissCommonPopups(page);
        
        // 4. PASTIKAN DI TAB EMAIL
        console.log('-> Cek Tab Email...');
        if (!(await page.isVisible('input[name="email"]'))) {
            try {
                const emailLink = page.getByText('Mendaftar dengan email').or(page.getByText('Sign up with email'));
                await emailLink.click({ force: true });
            } catch(e) {
                await page.click('a[href*="email"]', { force: true });
            }
            await randomDelay(1000, 2000);
        }

        // 5. ISI EMAIL & PASS
        console.log(`-> Mengisi Email: ${account.email}`);
        await page.waitForSelector('input[name="email"]', { timeout: 10000 });
        await humanType(page, 'input[name="email"]', account.email);
        await randomDelay(500, 1000);

        console.log('-> Mengisi Password...');
        await humanType(page, 'input[type="password"]', account.password);
        await randomDelay(1000, 2000);
        await dismissCommonPopups(page);

        // 6. KLIK KIRIM KODE
        console.log('-> Klik tombol "Kirim Kode"...');
        const btnSend = page.getByRole('button', { name: 'Kirim kode' }).or(page.getByRole('button', { name: 'Send code' }));
        
        if (await btnSend.isVisible()) {
            await btnSend.click({ force: true });
        } else {
            console.log('   [WARNING] Tombol Kirim Kode tidak ketemu.');
        }

        // . INPUT MANUAL
        console.log('\n================================================================');
        console.log('✋ WAKTUNYA INPUT MANUAL!');
        console.log('1. Selesaikan CAPTCHA/PUZZLE (kalau muncul).');
        console.log('2. Masukkan KODE OTP dari email.');
        console.log('================================================================\n');

        const otpDetected = await waitForOtpFilled(page, 180000);
        if (otpDetected) console.log('-> Terdeteksi OTP sudah diisi!');
        else console.log('-> Waktu tunggu OTP habis. Lanjut...');

        await randomDelay(1000, 2000);

        // 9. NEXT
        console.log('-> Klik tombol "Berikutnya"...');
        const btnNext = page.getByRole('button', { name: 'Berikutnya' }).or(page.getByRole('button', { name: 'Next' }));
        if (await btnNext.isVisible() && await btnNext.isEnabled()) {
            await btnNext.click({ force: true });
        }

        // 10. SAVE
        console.log('-> Menunggu login sukses...');
        await page.waitForLoadState('networkidle');
        await randomDelay(5000, 8000);

        const cookiePath = path.join(COOKIES_DIR, `${safeEmail}.json`);
        await context.storageState({ path: cookiePath });
        console.log(`[SAVE] Cookies tersimpan di: ${cookiePath}`);

    } catch (error) {
        console.error(`[ERROR] ${(error as Error).message}`);
        try { await page.screenshot({ path: path.join(LOGS_DIR, `ERR_TT_${safeEmail}.png`) }); } catch(e){}
    } finally {
        console.log('Menutup browser dalam 10 detik...');
        await randomDelay(10000, 10000);
        try { await context.close(); } catch(e) {}
    }
}

(async () => {
    const accounts = readAccountsFromCsv(DATA_PATH);
    console.log(`Total Akun TikTok: ${accounts.length}`);

    for (const acc of accounts) {
        await registerTikTok(acc);
        console.log('\n--- Jeda 1 Menit ---\n');
        await randomDelay(60000, 60000); 
    }
})();