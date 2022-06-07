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
/* eslint-disable max-len */

const assert = require('assert');
const test = require('../index');

describe('objectTree page test suite', async () => {
  let page, url;

  before(async () => {
    page = test.page;
    url = test.url;
  });

  it('should load', async () => {
    await page.goto(url + '?page=objectTree', {waitUntil: 'networkidle0'});
    await page.waitForTimeout(500)
    const location = await page.evaluate(() => window.location);
    assert.strictEqual(location.search, '?page=objectTree');
  });

  it('should have a tree as a table', async () => {
    await page.waitForSelector('section table tbody tr', {timeout: 5000});
    const rowsCount = await page.evaluate(() => document.querySelectorAll('section table tbody tr').length);
    assert.strictEqual(rowsCount, 5); // 5 agents
  });

  it('should have a button to sort by (default "Name" ASC)', async () => {
    const sortByButtonTitle = await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div').title);
    assert.strictEqual(sortByButtonTitle, 'Sort by');
  });

  it('should have first element in tree as "BIGTREE/120KB/0"', async () => {
    const firstElement = await page.evaluate(() => window.model.object.currentList[0]);
    assert.strictEqual(firstElement.name, 'BIGTREE/120KB/0');
  });

  it('should sort list of histograms by name in descending order', async () => {
    await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div > button').click());
    await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div > div > a:nth-child(4)').click());
    const sorted = await page.evaluate(() => {
      return {
        list: window.model.object.currentList,
        sort: window.model.object.sortBy
      };
    });
    assert.strictEqual(sorted.sort.title, 'Name');
    assert.strictEqual(sorted.sort.order, -1);
    assert.strictEqual(sorted.sort.field, 'name');
    assert.strictEqual(sorted.list[0].name, 'TST01/Default/hTOFRRawTimeVsTRM3671');
  });

  it('should sort list of histograms by name in ascending order', async () => {
    await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div > button').click());
    await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div > div > a:nth-child(3)').click());
    const sorted = await page.evaluate(() => {
      return {
        list: window.model.object.currentList,
        sort: window.model.object.sortBy
      };
    });
    assert.strictEqual(sorted.sort.title, 'Name');
    assert.strictEqual(sorted.sort.order, 1);
    assert.strictEqual(sorted.sort.field, 'name');
    assert.strictEqual(sorted.list[0].name, 'BIGTREE/120KB/0');
  });

  it('should sort list of histograms by created time in descending order', async () => {
    await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div > button').click());
    await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div > div > a:nth-child(2)').click());
    const sorted = await page.evaluate(() => {
      return {
        list: window.model.object.currentList,
        sort: window.model.object.sortBy
      };
    });
    assert.strictEqual(sorted.sort.title, 'Created Time');
    assert.strictEqual(sorted.sort.order, -1);
    assert.strictEqual(sorted.sort.field, 'createTime');
    assert.strictEqual(sorted.list[0].name, 'BIGTREE/120KB/2499');
  });

  it('should sort list of histograms by created time in ascending order', async () => {
    await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div > button').click());
    await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > div > div > a:nth-child(1)').click());
    const sorted = await page.evaluate(() => {
      return {
        list: window.model.object.currentList,
        sort: window.model.object.sortBy
      };
    });
    assert.strictEqual(sorted.sort.title, 'Created Time');
    assert.strictEqual(sorted.sort.order, 1);
    assert.strictEqual(sorted.sort.field, 'createTime');
    assert.strictEqual(sorted.list[0].name, 'BIGTREE/120KB/0');
  });

  it('should have filtered results on input search filled and display only the ones visible to the user (less than 2500)', async () => {
    await page.type('header input', 'BIGTREE');
    await page.waitForTimeout(1000);
    const rowsDisplayed = await page.evaluate(() => {
      const rows = [];
      document.querySelectorAll('section table tbody tr').forEach((item) => rows.push(item.innerText));
      return rows;
    }, {timeout: 5000});
    const filteredRows = rowsDisplayed.filter((name) => name.includes('BIGTREE'));
    assert.ok(filteredRows.length === rowsDisplayed.length,
      `Not all rows contain the searched term. Identified filtered: ${filteredRows.length} and displayed: ${rowsDisplayed.length}`);
  });
});
