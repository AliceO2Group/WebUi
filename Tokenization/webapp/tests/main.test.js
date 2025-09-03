import assert from 'assert'
import puppeteer from 'puppeteer' 

describe('Puppeteer test', () => {
    it('Pupeteer launch', async () => {
        const browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
            args: ['--no-sandbox']
        })


        const page = await browser.newPage();

        await page.goto('http://prod-container:80/')

        await page.waitForSelector('header')
        const headerContent = await page.$eval('header', el => el.textContent)
        assert.ok(headerContent.includes('Tokenization'))

        await browser.close()
    });
})