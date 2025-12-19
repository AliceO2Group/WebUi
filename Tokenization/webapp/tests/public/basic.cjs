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
const { waitForFrontend } = require('../helper.cjs');

describe('Routing', function() {
  let url;
  let page;

  before(async function() {
    ({ helpers: { url: url }, page: page } = test);
  });

  it('Sidebar includes all routes', async function() {
    const expectedLinks = [
      {href: '/tokens/active', label: 'Active Tokens'},
      {href: '/tokens/archived', label: 'Archived Tokens'},
      {href: '/services/overview', label: 'Service Overview'},
      {href: '/services/new', label: 'Service Registration'},
      {href: '/routes/overview', label: 'Routes Overview'},
    ]
    
    await page.goto(url);
    await page.waitForSelector('nav');

    const links = await page.$$eval('nav a', (anchors) =>
      anchors.map((a) => {
        return { 
          href: a.getAttribute('href'), 
          label: a.textContent.trim()
        };
      })
    );

    expectedLinks.forEach(expectedLink => {
      const found = links.find(link => link.href === expectedLink.href && link.label === expectedLink.label);
      assert.ok(found, `Link with href "${expectedLink.href}" and label "${expectedLink.label}" not found in sidebar`);
    })
  });

  it('Navigates to Active Tokens page and than to token details page', async function() {
    const tokenId = '1';   

    const link1 = await page.waitForSelector('nav a[href="/tokens/active"]');
    await link1.click();
    await waitForFrontend();

    const activeTokensUrl = await page.url();
    assert.ok(activeTokensUrl.endsWith('/tokens/active'), 'Did not navigate to Active Tokens page');

    const link = await page.waitForSelector(`tr td a[href="/tokens/${tokenId}"]`);
    await link.click();
    await waitForFrontend();

    const tokenDetailsUrl = await page.url();
    assert.ok(tokenDetailsUrl.endsWith(`/tokens/${tokenId}`), 'Did not navigate to Token Details page');
  })
});
