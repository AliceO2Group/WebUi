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

/* eslint-disable max-len */
const assert = require('assert');
const qcg = require('./qcg-test.cjs');
const config = require('./config-provider.cjs');
const { waitForQCResponse } = require('./utils.cjs');

let page;
const objects = config.offlineObjects;
const { url } = config;
describe('`OFFLINE` test-suite', async () => {
  before(async () => {
    ({ page } = qcg);
  });

  it('should successfully load objectTree page', async () => {
    await page.goto(`${url}?page=objectTree`, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);
    const location = await page.evaluate(() => window.location);
    assert.strictEqual(location.search, '?page=objectTree', 'Could not load page objectTree');
  });

  it('should successfully receive a list of objects from CCDB', async () => {
    const offlineObjects = await page.evaluate(() => window.model.object.list);
    assert.ok(offlineObjects.length > 0, 'Did not receive any objects from CCDB');
  });

  it('should successfully receive certain objects from CCDB and be in use', async () => {
    const offlineObjects = await page.evaluate(() => window.model.object.currentList);
    const offlineNames = offlineObjects.map((object) => object.name);
    const expectedObjects = objects;
    const contains = expectedObjects.filter((object) => !offlineNames.includes(object));
    assert.strictEqual(contains.length, 0, `Could not find following objects from the expected ones: ${contains}`);
  });

  describe('Iterate over given objects and open them', () => {
    for (let i = 0; i < objects.length; ++i) {
      it(`should successfully open subtree of OBJECT  ${objects[i]} and select/open plot`, async () => {
        const path = objects[i].split('/');
        path.shift();

        await openGivenObjectPath(page, path);
        await waitForQCResponse(page, 20);

        await page.waitForTimeout(500);
        const panelWidth = await page.evaluate(() => document.querySelector('section > div > div > div:nth-child(2)').style.width);
        assert.strictEqual(panelWidth, '50%', `Panel containing object ${objects[i]} plot was not opened successfully`);
        await page.waitForTimeout(500);

        await closeGivenObjectPath(page, path);
      });
    }
  });
});

/**
 * Method to open the tree for a given path
 * @param {Page} page
 * @param {Array<String>} path
 */
async function openGivenObjectPath(page, path) {
  let tempPath = 'qc';
  for (let i = 0; i < path.length; ++i) {
    tempPath += `/${path[i]}`;
    const [row] = await page.$x(`//tr[@title="${tempPath}"]`);
    if (row) {
      await row.click();
      await page.waitForTimeout(200);
    } else {
      assert.ok(false, `${path[i]} could not be found in object tree`);
    }
  }
}

/**
 * Method to close the tree for a given path
 * @param {Page} page
 * @param {Array<String>} path
 */
async function closeGivenObjectPath(page, path) {
  const tempPath = path.slice();
  for (let i = 0; i < path.length; ++i) {
    const objectPath = `qc/${tempPath.join('/')}`;
    const [row] = await page.$x(`//tr[@title="${objectPath}"]`);
    if (row) {
      await row.click();
      await page.waitForTimeout(200);
    } else {
      assert.ok(false, `${objectPath} could not be found in object tree`);
    }
    tempPath.pop();
  }
}
