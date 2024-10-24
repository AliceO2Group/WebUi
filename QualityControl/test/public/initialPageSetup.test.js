/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file 'COPYING'.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import assert from 'node:assert';

/**
 * Initial page setup tests
 * @param {string} url - URL needed to open page for testing
 * @param {object} page - Puppeteer page object
 * @param {timeout} timeout - Timeout PER test; default 100
 * @param {object} testParent - Node.js test object which ensures sub-tests are being awaited
 */
export const initialPageSetupTests = async (url, page, timeout = 1000, testParent) => {
  await testParent.test('should successfully load first page "/"', { timeout }, async () => {
    // Try multiple times until the backend server is ready
    for (let i = 0; i < 10; i++) {
      try {
        await page.goto(url, { waitUntil: 'networkidle0' }); // Wait for network to be idle
        break; // Connection successful, this test passes
      } catch (e) {
        if (e.message.includes('net::ERR_CONNECTION_REFUSED')) {
          // If the connection is refused, wait half a second before retrying
          await new Promise((done) => setTimeout(done, 500));
          continue; // Try again
        }
        throw e; // If it's another error, rethrow it
      }
    }
  });

  await testParent.test('should successfully have redirected to default page "/?page=layoutList"', async () => {
    const location = await page.evaluate(() => window.location);
    assert.strictEqual(location.search, '?page=layoutList');
  });

  await testParent.test('should successfully have correctly load QCG configuration', async () => {
    const qcg = await page.evaluate(() => window.QCG);
    const expectedConf = {
      REFRESH_MIN_INTERVAL: 10,
      REFRESH_MAX_INTERVAL: 120,
      CONSUL_SERVICE: false,
    };
    assert.deepStrictEqual(
      qcg,
      expectedConf,
      'Public configuration was not loaded successfully',
    );
  });

  await testParent.test('should have a layout with header, sidebar and section', async () => {
    const headerContent = await page.evaluate(() => document.querySelector('header').innerHTML);
    const sidebarContent = await page.evaluate(() => document.querySelector('nav').innerHTML);

    assert.ok(headerContent.includes('Quality Control'));
    assert.ok(sidebarContent.includes('Explore'));
  });
};
