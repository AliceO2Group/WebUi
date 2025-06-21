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
const test = require('../mocha-index.cjs');

describe('`pageConfiguration` test-suite', async () => {
  let url;
  let page;

  before(async () => {
    url = test.helpers.url;
    page = test.page;
  });

  it('should load configuration page', async () => {
    const res = await fetch('http://localhost:8080/api/api/configurations');
    const data = await res.json();

    const firstConfigurationRelativePath = data?.[0];

    const configUrl = `${url}/configuration/${firstConfigurationRelativePath}`;

    await page.goto(configUrl, { waitUntil: 'networkidle0' });

    const location = await page.evaluate(() => window.location);
    assert.strictEqual(location.search, '');
  });

  it('should display proper configuration page header', async () => {
    const res = await fetch('http://localhost:8080/api/api/configurations');
    const data = await res.json();

    const firstConfigurationRelativePath = data?.[0];

    const configUrl = `${url}/configuration/${firstConfigurationRelativePath}`;

    await page.goto(configUrl, { waitUntil: 'networkidle0' });

    const configPageHeader = await page.$$('.config-page__header__text');
    assert.strictEqual(configPageHeader.length, 1);

    const headerText = await page.evaluate(
      (el) => el.textContent,
      configPageHeader[0]
    );
    assert.strictEqual(headerText, firstConfigurationRelativePath);
  });
});
