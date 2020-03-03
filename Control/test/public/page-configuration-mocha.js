const assert = require('assert');
const test = require('../mocha-index');

describe('`pageConfiguration` test-suite', async () => {
  let url;
  let page;

  before(async () => {
    url = test.helpers.url;
    page = test.page;
  });

  describe('loading page with no consul connection', () => {
    it('should load', async () => {
      await page.goto(url + '?page=configuration', {waitUntil: 'networkidle0'});
      const location = await page.evaluate(() => window.location);
      assert.strictEqual(location.search, '?page=configuration');
    });
    it('should display an error icon and message due to bad connection of consul', async () => {
      const [errorIcon, errorMessage] = await page.evaluate(() => {
        const errorIcon = document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > span').classList;
        const errorMessage = document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > p').innerText;
        return [errorIcon, errorMessage];
      });
      assert.deepStrictEqual(errorIcon, {0: 'pageError'});
      assert.strictEqual(errorMessage, 'Request to server failed (502 Bad Gateway): connect ECONNREFUSED 127.0.0.1:8500');
    });
  });

  describe('loading page with consul returning 404 due to missing key', () => {
    before(async () => {
      await page.setRequestInterception(true);
      page.on('request', keyNotFound);
    });

    after(async () => {
      await page.removeListener('request', keyNotFound);
    });

    it('should load', async () => {
      await page.goto(url + '?page=configuration', {waitUntil: 'networkidle0'});
      const location = await page.evaluate(() => window.location);
      assert.strictEqual(location.search, '?page=configuration');
    });

    it('should display an error icon and message due to key not found', async () => {
      const [errorIcon, errorMessage] = await page.evaluate(() => {
        const errorIcon = document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > span').classList;
        const errorMessage = document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > p').innerText;
        return [errorIcon, errorMessage];
      });
      assert.deepStrictEqual(errorIcon, {0: 'pageError'});
      assert.strictEqual(errorMessage, 'Request to server failed (404 Not Found): Could not find any Readout Cards by key test/o2/hardware/flps');
    });
  });

  describe('loading page with consul returning 200 but no ReadoutCards', () => {
    before(async () => {
      await page.setRequestInterception(true);
      page.on('request', readoutCardsEmpty);
    });

    after(async () => {
      await page.removeListener('request', readoutCardsEmpty);
    });

    it('should load', async () => {
      await page.goto(url + '?page=configuration', {waitUntil: 'networkidle0'});
      const location = await page.evaluate(() => window.location);
      assert.strictEqual(location.search, '?page=configuration');
    });

    it('should contain an action panel', async () => {
      const tableMessage = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > h4').innerText);
      assert.strictEqual(tableMessage, 'Action:');
    });

    it('should contain a table with a single unified row due to no ReadoutCards', async () => {
      const tableMessage = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div:nth-child(3) > table > tbody > tr > td').innerText);
      assert.strictEqual(tableMessage, 'No data found');
    });
  });

  describe('loading page with consul returning 200 and a list of ReadoutCards', () => {
    before(async () => {
      await page.setRequestInterception(true);
      page.on('request', readoutCardList);
    });

    after(async () => {
      await page.removeListener('request', readoutCardList);
    });

    it('should load', async () => {
      await page.goto(url + '?page=configuration', {waitUntil: 'networkidle0'});
      const location = await page.evaluate(() => window.location);
      assert.strictEqual(location.search, '?page=configuration');
    });

    it('should contain an action panel', async () => {
      const tableMessage = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > h4').innerText);
      assert.strictEqual(tableMessage, 'Action:');
    });
  });
});

/**
 * Method intercept consul request and return 404
 * @param {Request} request
 */
function keyNotFound(request) {
  if (request.url().includes('/api/getCRUs')) {
    request.respond({status: 404, contentType: 'application/json', body: JSON.stringify({message: 'Could not find any Readout Cards by key test/o2/hardware/flps'})});
  } else {
    request.continue();
  }
}

/**
 * Method intercept consul request and return 200
 * @param {Request} request
 */
function readoutCardsEmpty(request) {
  if (request.url().includes('/api/getCRUs')) {
    request.respond({status: 200, contentType: 'application/json', body: JSON.stringify({})});
  } else {
    request.continue();
  }
}

/**
 * Method intercept consul request and return 200
 * @param {Request} request
 */
function readoutCardList(request) {
  if (request.url().includes('/api/getCRUs')) {
    request.respond({status: 200, contentType: 'application/json', body: JSON.stringify(readoutCards)});
  } else {
    request.continue();
  }
}

const readoutCards = {
  hostOne: {
    0: {
      type: 'CRORC',
      pciAddress: 'd8: 00.0',
      serial: 30176,
      endpoint: 0,
      numa: 1,
      firmware: 'alpha',
    },
    1: {
      type: 'CRORC',
      pciAddress: 'd8: 00.0',
      serial: 30176,
      endpoint: 0,
      numa: 1,
      firmware: 'alpha',
    }
  }
};
