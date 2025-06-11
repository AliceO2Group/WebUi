/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { deepEqual, ok, strictEqual } from 'node:assert';

const LAYOUT_LIST_PAGE_PARAM = '?page=layoutList';
const FILTER_SELECTOR = 'header #filterElement';

export const filterTests = async (url, page, timeout = 5000, testParent) => {
  await testParent.test('should successfully load filter element on layoutListPage', { timeout }, async () => {
    await page.goto(`${url}${LAYOUT_LIST_PAGE_PARAM}`, { waitUntil: 'networkidle0' });
    const element = await page.$(FILTER_SELECTOR);
    ok(element !== null, 'Filter element does not exist, or is not inside the header');

    const location = await page.evaluate(() => window.location);
    strictEqual(location.search, '?page=layoutList');
  });

  await testParent.test('filter should persist between pages', { timeout }, async () => {
    const runNumber = '0';
    await page.locator('#runNumberFilter').fill('0');
    await page.click('#filterElement button');

    let value = await page.evaluate(() => document.querySelector('#runNumberFilter').value);
    deepEqual(value, runNumber, 'RunNumber is no longer set');

    await page.click('.sidebar > a:nth-of-type(3)'); // navigate to aboutPage.

    value = await page.evaluate(() => document.querySelector('#runNumberFilter').value);
    deepEqual(value, runNumber, 'RunNumber is no longer set');

    await page.click('.sidebar > a:nth-of-type(2)'); // navigate to ObjectTreePage.

    value = await page.evaluate(() => document.querySelector('#runNumberFilter').value);
    deepEqual(value, runNumber, 'RunNumber is no longer set');
    await page.waitForSelector('tr:last-of-type td');

    await page.click('tr:last-of-type td'); // fully open the tree.
    await page.waitForFunction(() => document.querySelectorAll('tr').length > 3);

    await page.click('tr:last-of-type td');
    await page.waitForFunction(() => document.querySelectorAll('tr').length > 4);
    await page.click('tr:last-of-type td');

    await page.waitForSelector('.resize-button a');
    await page.click('.resize-button a'); // This would navigate to the objectViewPage

    value = await page.evaluate(() => document.querySelector('#runNumberFilter').value);
    deepEqual(value, runNumber, 'RunNumber is no longer set');

    await page.waitForSelector('.sidebar > div:nth-of-type(3) a:nth-child(1)');
    await page.click('.sidebar > div:nth-of-type(3) a:nth-child(1)'); // navigate to layout show

    value = await page.evaluate(() => document.querySelector('#runNumberFilter').value);
    deepEqual(value, runNumber, 'RunNumber is no longer set');
  });
};
