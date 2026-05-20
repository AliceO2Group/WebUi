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
const test = require('../mocha-index');
const { INFOLOGGER_LEVEL_LIST } = require('../../public/constants/infologger-level.const');
const {
  baseUrl, getShifterAuthQueryParams, getGuestAuthQueryParams, getShifterAdminAuthQueryParams,
} = require('../test-utils.js');

describe('Shifter Based Actions Test Suite', async () => {
  // eslint-disable-next-line init-declarations
  let page;
  const shifterQueryParams = getShifterAuthQueryParams();
  const guestQueryParams = getGuestAuthQueryParams();
  const shifterAdminQueryParams = getShifterAdminAuthQueryParams();

  before(() => {
    ({ page } = test);
  });

  it('should successfully load a page with shifter access token and level set to 1', async () => {
    await page.goto(`${baseUrl}?${shifterQueryParams}`, { waitUntil: 'networkidle0' });

    const location = await page.evaluate(() => window.location);
    const search = decodeURIComponent(location.search);
    assert.strictEqual(search, '?q={"severity":{"in":"I W E F"},"level":{"max":1}}');

    const criterias = await page.evaluate(() => window.model.log.filter.criterias);
    assert.strictEqual(criterias.level.max, 1);
  });

  it(
    'should successfully load page with shifter role and level 1 even if query parameter contains a higher level',
    async () => {
      await page.goto(
        `${baseUrl}?${shifterQueryParams}&q={"level":{"max":6}}`,
        { waitUntil: 'networkidle0' },
      );

      const location = await page.evaluate(() => window.location);
      const search = decodeURIComponent(location.search);
      assert.strictEqual(search, '?q={"severity":{"in":"I W E F"},"level":{"max":1}}');

      const criterias = await page.evaluate(() => window.model.log.filter.criterias);
      assert.strictEqual(criterias.level.max, 1);
    },
  );

  it('should disable buttons for level filter if user is shifter but not admin', async () => {
    const currentAccess = await page.evaluate(() => window.model.session.access);

    await page.evaluate(() => {
      window.model.session.access = ['shifter'];
      window.model.notify();
    });

    for (const { label, index } of INFOLOGGER_LEVEL_LIST) {
      const isLevelDisabled = await page.$eval(`#level-${index}`, (button) => button.classList.contains('disabled'));
      assert.strictEqual(
        isLevelDisabled,
        label === 'Ops' ? false : true,
        `Level ${label} should be ${label === 'Ops' ? 'enabled' : 'disabled'} for shifter access`,
      );
    }

    // Restore access rights for the following tests
    await page.evaluate((access) => {
      window.model.session.access = access;
      window.model.notify();
    }, currentAccess);
  });

  it('should not apply level constraint when user has neither shifter nor admin role', async () => {
    await page.goto(`${baseUrl}?${guestQueryParams}`, { waitUntil: 'networkidle0' });

    const criterias = await page.evaluate(() => window.model.log.filter.criterias);
    assert.strictEqual(criterias.level.max, null, 'Level max should be unrestricted for a guest user');

    const constraints = await page.evaluate(() => window.model.log.filter._constraints);
    assert.deepStrictEqual(constraints, {}, 'No constraints should be set for a guest user');
  });

  it('should not apply level constraint when user has both shifter and admin roles', async () => {
    await page.goto(`${baseUrl}?${shifterAdminQueryParams}`, { waitUntil: 'networkidle0' });

    const criterias = await page.evaluate(() => window.model.log.filter.criterias);
    assert.strictEqual(criterias.level.max, null, 'Level max should be unrestricted when user also has admin role');

    const constraints = await page.evaluate(() => window.model.log.filter._constraints);
    assert.deepStrictEqual(constraints, {}, 'No constraints should be set when user also has admin role');
  });
});
