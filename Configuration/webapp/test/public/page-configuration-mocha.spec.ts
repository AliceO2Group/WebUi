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

import assert from 'assert';
import { Page } from 'puppeteer';
import global from '../mocha-index';

describe('`pageConfiguration` test-suite', function () {
  let url: string | null = null;
  let page: Page | null = null;

  before(function () {
    ({
      test: {
        page,
        helpers: { url },
      },
    } = global);
  });

  it('should load configuration page', async function () {
    if (page === null || url === null) {
      assert.equal('Page is null', 'test suite failed');
      return;
    }
    await page.goto(url, { waitUntil: 'networkidle0' });

    const configNavigatorItems = await page.$$('.config_navigator__item--selected');
    assert.strictEqual(configNavigatorItems.length, 1);

    const classList = await configNavigatorItems[0].evaluate((el) => el.className.split(' '));
    const selectedKey = Array.from(classList)
      .find((className: string) => className.startsWith('config_key__'))
      ?.split('__')[1];

    if (!selectedKey) {
      assert.equal('No selected key found', 'test suite failed');
      return;
    }

    const location = await page.evaluate(() => window.location);
    assert.strictEqual(location.pathname.includes(selectedKey), true);
  });

  it('should display proper configuration page header', async function () {
    if (page === null || url === null) {
      assert.equal('Page is null', 'test suite failed');
      return;
    }
    await page.goto(url, { waitUntil: 'networkidle0' });

    const configNavigatorItems = await page.$$('.config_navigator__item--selected');
    assert.strictEqual(configNavigatorItems.length, 1);

    const classList = await configNavigatorItems[0].evaluate((el) => el.className.split(' '));
    const selectedKey = Array.from(classList)
      .find((className: string) => className.startsWith('config_key__'))
      ?.split('__')[1];

    if (!selectedKey) {
      assert.equal('No selected key found', 'test suite failed');
      return;
    }

    const configPageHeader = await page.$$('.config-page__header__text');
    assert.strictEqual(configPageHeader.length, 1);

    const headerText = (await page.evaluate((el) => el.textContent, configPageHeader[0])) ?? '';
    assert.strictEqual(headerText.includes(selectedKey), true);
  });
});
