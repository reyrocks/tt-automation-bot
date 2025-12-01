import { Page } from 'playwright';

export const randomDelay = (min: number, max: number) => 
    new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));

export const humanType = async (page: Page, selector: string, text: string) => {
    try {
        await page.click(selector);
    } catch(e) {}
    for (const char of text) {
        await page.keyboard.type(char, { delay: Math.random() * 100 + 50 });
    }
    await randomDelay(300, 700);
};