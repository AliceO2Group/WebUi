const assert = require('assert');
const pupeteer = require('puppeteer');

describe('Puppeteer test', () => {
    it('Pupeteer launch', async () => {
        const browser = await pupeteer.launch({
            executablePath: '/usr/bin/google-chrome',
            headless: true, 
            args: [
                '--no-sandbox',
            ]
        })

        const page = await browser.newPage();

        await page.goto('http://reverse-proxy:8080/')

        const headerContent = await page.$eval('header', el => el.textContent)
        assert.ok(headerContent.includes('Tokenization'))

        await browser.close()
    });
})