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

describe('`pageRoot` test-suite', function () {
  let url;
  let page;

  before(async function () {
    url = test.helpers.url;
    page = test.page;
  });

  it('should load root page', async function () {
    await page.goto(url, { waitUntil: 'networkidle0' });

    const location = await page.evaluate(() => window.location);
    assert.strictEqual(location.search, '');
  });

  it('should successfully display drawer', async function () {
    const drawer = await page.$$('.left-drawer');
    assert.strictEqual(drawer.length, 1);
  });

  it('should successfully display drawer header', async function () {
    const drawerHeader = await page.$$('.left-drawer__header');
    assert.strictEqual(drawerHeader.length, 1);
  });

  it('should successfully display drawer footer', async function () {
    const drawerFooter = await page.$$('.left-drawer__footer');
    assert.strictEqual(drawerFooter.length, 1);
  });

  it('should successfully display content section', async function () {
    const contentSection = await page.$$('.content-section');
    assert.strictEqual(contentSection.length, 1);
  });

  it('should successfully display content section header', async function () {
    const contentSectionHeader = await page.$$('.content-section__header');
    assert.strictEqual(contentSectionHeader.length, 1);
  });

  it('should successfully display user section', async function () {
    const userSection = await page.$$('.user-section');
    assert.strictEqual(userSection.length, 1);
  });

  it('should successfully display user section menu on clik', async function () {
    await page.click('.user-section');
    const userSectionMenu = await page.$$('.user-section__menu');
    assert.strictEqual(userSectionMenu.length, 1);
  });

  it('should successfully display configurations list', async function () {
      const res = await fetch('http://localhost:8080/api/api/configurations');
      const data = await res.json();
  
      const configNavigatorItems = await page.$$('.config_navigator__item');
      assert.strictEqual(configNavigatorItems.length, data.length);
    });
});
