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

describe('token deletion unsuccessful', function() {
  let url;
  let page;

  before(async function() {
    ({ page, helpers: { url } } = test);
  });

  beforeEach(async function() {
    await page.goto(`${url}/tokens`); // no admin access
    await page.waitForSelector('table'); // wait for API to populate the table

    const _trs = await page.$$('table tbody tr');
    const trs = [];
    for (const trEl of _trs) {
      const id = await trEl.$eval('td:nth-child(1)', el => (el.textContent || '').trim());
      const deleteBtn = await trEl.$('button.btn-sm.bg-danger') || await trEl.$('button.bg-danger') || null;
      trs.push({ tr: trEl, id, deleteBtn }); // collecting relevant info
    }

    this.trs = trs;
  });

  // parametrized test for first and third row
  const rowsToTest = [
    { index: 0, description: 'first row' },
    { index: 2, description: 'third row' },
  ];

  rowsToTest.forEach(({ index, description }) => {
    it(`correct id displayed in deletion confirmation modal for ${description}`, async function() {
      const row = this.trs[index];
      await row.deleteBtn.click();

      const modalContent = await page.$eval('.modal', el => el.textContent || '');
      const modalClass = await page.$eval('.modal-overlay', el => el.className);
      assert.ok (modalClass.includes('d-block'), 'confirmation modal should be shown after clicking delete button');
      assert.ok(modalContent.includes(`id: ${row.id}?`), 'confirmation modal should mention the correct token ID');

      const closeBtn =  await page.$('button:nth-child(1)'); // close button
      await closeBtn.click();
    });
  });

  it('deletion shows auth error alert', async function() {
    const row = this.trs[0]; // first row
    await row.deleteBtn.click();

    const confirmBtn = await page.$('button.btn-danger'); // confirm deletion button
    await confirmBtn.click();

    const alert = await page.waitForSelector('.alert');
    const alertClass = await alert.evaluate(el => el.className);
    const alertContent = await alert.evaluate(el => el.textContent);
    assert.ok(alertClass.includes('bg-danger'), 'error alert should be shown after failed deletion');
    assert.ok(alertContent.includes('Authorization error'), 'error alert should mention authorization issue');
  });
});
