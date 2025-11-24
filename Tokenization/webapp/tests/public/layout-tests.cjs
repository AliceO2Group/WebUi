/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

const assert = require('assert');

describe('general tests', function() {
  let url;
  let page;

  before(async function() {
    ({ helpers: { url: url }, page: page } = test);
  });

  it('header contains links to /tokens and /certs with correct names', async function() {
    await page.goto(url);
    await page.waitForSelector('header');

    // verify link to /tokens exists and its text mentions "Token"
    const tokensLinkText = await page.$eval('header a[href="/tokens"]', el => el.textContent || '');
    const tokensLinkHref = await page.$eval('header a[href="/tokens"]', el => el.getAttribute('href'));
    assert.strictEqual(tokensLinkHref, '/tokens');
    assert.ok(/Token/i.test(tokensLinkText), `tokens link text should include "Token", got "${tokensLinkText}"`);

    // verify link to /certs exists and its text mentions "Cert" (covers "Certs" or "Certificates")
    const certsLinkText = await page.$eval('header a[href="/certs"]', el => el.textContent || '');
    const certsLinkHref = await page.$eval('header a[href="/certs"]', el => el.getAttribute('href'));
    assert.strictEqual(certsLinkHref, '/certs');
    assert.ok(/Certificates/i.test(certsLinkText), `certs link text should include "Cert", got "${certsLinkText}"`);
  });
  it('/tokens route displays token table and creation form', async function() {
    await page.goto(`${url}/tokens`);

    await page.waitForSelector('#content');
    const pageContent = await page.$eval('#content', el => el.textContent || '');
    assert.ok(pageContent.includes('Create Token'), 'Token Creation form should be present');

    // wait for table rows populated by the API instead of an arbitrary timeout
    await page.waitForSelector('table thead');
    await page.waitForSelector('table tbody tr'); // ensures API filled the table
    const headers = await page.$$eval('table thead th', ths => ths.map(t => (t.textContent || '').trim()));

    const expected = ['ID', 'Service From', 'Service To', 'Expires at', 'Actions'];
    const missing = expected.filter(h => !headers.includes(h));
    assert.strictEqual(missing.length, 0, `Missing table headers: ${missing.join(', ')}`);
  });
});
