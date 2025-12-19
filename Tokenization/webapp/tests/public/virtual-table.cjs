const assert = require('assert');
const { waitForBackend } = require('../helper.cjs');

describe('Virtual Table Functionality', function() {
  let url;
  let page;

  before(async function() {
    ({ page, helpers: { url } } = test);
  });

  it('Check if tokens table is virtualized', async function() {
    await page.goto(`${url}/tokens/active`);
    await page.waitForSelector('table tbody tr');
    await waitForBackend();

    const initialRows = await page.$$eval('table tbody tr', rows => rows.length);
    assert.ok(initialRows < 20, `Expected less than 20 rows to be rendered initially, but found ${initialRows}`);
  })
});