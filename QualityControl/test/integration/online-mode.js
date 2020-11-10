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
const qcg = require('./qcg-test');
const config = require('./config-provider');
const waitForQCResponse = require('./utils').waitForQCResponse;

let page;
const objects = config.onlineObjects;

describe('`ONLINE` test-suite', async () => {
  before(() => {
    page = qcg.page;
  });

  it('should have a button for ONLINE mode', async () => {
    await page.waitForSelector('header > div > div > button', {timeout: 5000});
    const onlineButton = await page.evaluate(() => document.querySelector('header > div > div > button').innerText);
    assert.strictEqual(onlineButton, 'Online ', 'Could not find button ONLINE');
  });

  it('should successfully press the button and enable ONLINE mode', async () => {
    await page.evaluate(() => document.querySelector('header > div > div > button').click());
    await page.waitForTimeout(3000);
    const isOnline = await page.evaluate(() => window.model.isOnlineModeEnabled);
    assert.ok(isOnline, 'Online Mode was not Enabled');
  });

  it('should successfully receive a list of objects from Consul', async () => {
    const onlineObjects = await page.evaluate(() => window.model.object.listOnline);
    assert.ok(onlineObjects.length > 0, `Did not receive any objects from Consul`);
  });

  it('should successfully receive certain objects from Consul and be in use', async () => {
    const offlineObjects = await page.evaluate(() => window.model.object.currentList);
    const offlineNames = offlineObjects.map((object) => object.name);
    const expectedObjects = objects;
    const contains = expectedObjects.filter((object) => !offlineNames.includes(object));
    assert.strictEqual(contains.length, 0, `Could not find following objects from the expected ones: ${contains}`);
  });


  describe('Iterate over given objects and open them', function() {
    for (let i = 0; i < objects.length; ++i) {
      it(`should successfully open subtree of OBJECT  ${objects[i]} and select/open plot`, async () => {
        const path = objects[i].split('/');
        path.shift();

        await toggleGivenObjectPath(page, path);
        await waitForQCResponse(page, 20);
        await page.waitForTimeout(500);
        const panelWidth = await page.evaluate(() => document.querySelector('section > div > div > div:nth-child(2)').style.width);
        await page.waitForTimeout(500);
        assert.strictEqual(panelWidth, '50%', `Panel containing object ${objects[i]} plot was not opened successfully`);

        await toggleGivenObjectPath(page, path.reverse());
      });
    }
  });
});

/**
 * Method to open/close the tree for a given path
 * @param {Page} page
 * @param {Array<String>} path
 */
async function toggleGivenObjectPath(page, path) {
  for (let i = 0; i < path.length; ++i) {
    const [row] = await page.$x(`//tr[td[text()="${path[i]}"]]`);
    if (row) {
      await row.click();
      await page.waitForTimeout(200);
    } else {
      assert.ok(false, `${path[i]} could not be found in object tree`);
    }
  }
}
