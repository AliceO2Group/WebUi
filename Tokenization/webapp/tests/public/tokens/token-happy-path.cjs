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
const { fillAllFormFields } = require('./helpers.cjs');

describe('token creation successful', function() {
  let url;
  let page;

  before(async function() {
    ({ page, helpers: { url } } = test);
  });

  it('happy path: token creation successful', async function() {
    await page.goto(`${url}/tokens/new?access=admin`); // admin access added
    setTimeout(() => {}, 1000);
    const { dialogHandle } = await fillAllFormFields(
      page,
      await page.waitForSelector('#first-service-select'),
      await page.waitForSelector('#second-service-select'),
      await page.waitForSelector('#http-select-methods'),
      await page.waitForSelector('.my-input > input[type="number"]'),
      await page.waitForSelector('button[type="submit"]'),
    );
    const btn = await dialogHandle.$('.btn-success'); // accept button

    // TODO: mock/fake the API and verify the request payload here
    await btn.click();
    const className = await page.$eval('.alert', el => el.className);
    const content = await page.$eval('.alert', el => el.textContent);
    assert.ok(className.includes('d-block') && className.includes('bg-success'), 'success alert should be shown after creating token');
  });

  it('happy path: token deletion successful', async function() {
    await page.goto(`${url}/tokens?access=admin`); // admin access added
    await page.waitForSelector('table tbody tr');

    const _trs = await page.$$('table tbody tr');

    const trs = [];
    for (const trEl of _trs) {
      const id = await trEl.$eval('td:nth-child(1)', el => (el.textContent || '').trim());
      const deleteBtn = await trEl.$('button.btn-sm.bg-danger') || await trEl.$('button.bg-danger') || null;
      trs.push({ tr: trEl, id, deleteBtn }); // collecting relevant info
    }

    const row = trs[1]; // second row
    assert.ok(row, 'expected at least two table rows');
    assert.ok(row.deleteBtn, `delete button not found in row with id ${row.id}`);

    await row.deleteBtn.click();

    const modal = await page.waitForSelector('.modal-overlay');
    const className = await page.$eval('.modal-overlay', el => el.className);
    const content = await page.$eval('.modal-overlay', el => el.textContent || '');
    assert.ok(className.includes('d-block'), 'confirmation modal should be shown after clicking delete button');
    assert.ok(content.includes(`id: ${row.id}?`), 'confirmation modal should mention the correct token ID');

    const confirmBtn = await modal.$('button.btn-danger');
    assert.ok(confirmBtn, 'confirm button not found in modal');
    await confirmBtn.click();

    // TODO: mock/fake the API and verify the deletion request here
    const alertClass = await page.$eval('.alert', el => el.className);
    assert.ok(alertClass.includes('d-block') && alertClass.includes('bg-success'), 'success alert should be shown after deleting token');

  });
});
