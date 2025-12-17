import { Page, Locator } from 'playwright';
import { randomDelay } from './humanHelper';

export async function selectGenderMale(page: Page): Promise<void> {
    console.log('-> Memilih Gender: Male');

    try {
        const maleOptions: Locator[] = [
            page.getByText(/^Male$/i),
            page.getByText(/^Laki-laki$/i),
            page.getByRole('radio', { name: /male|laki/i }),
            page.locator('div').filter({ hasText: /male|laki/i })
        ];

        for (const opt of maleOptions) {
            const el = opt.first();
            if (await el.isVisible()) {
                await el.click({ force: true });
                await randomDelay(500, 1000);
                return;
            }
        }
    } catch {}
}
