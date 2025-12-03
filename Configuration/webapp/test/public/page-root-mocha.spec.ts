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

describe('`pageRoot` test-suite', function () {
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

  it('should load root page', async function () {
    if (page === null || url === null) {
      assert.equal('Page is null', 'test suite failed');
      return;
    }

    await page.goto(url, { waitUntil: 'networkidle0' });

    const location = await page.evaluate(() => window.location);
    assert.strictEqual(location.search, '');
  });

  it('should successfully display drawer', async function () {
    if (page === null || url === null) {
      assert.equal('Page is null', 'test suite failed');
      return;
    }

    const drawer = await page.$$('.left-drawer');
    assert.strictEqual(drawer.length, 1);
  });

  it('should successfully display drawer header', async function () {
    if (page === null || url === null) {
      assert.equal('Page is null', 'test suite failed');
      return;
    }

    const drawerHeader = await page.$$('.left-drawer__header');
    assert.strictEqual(drawerHeader.length, 1);
  });

  it('should successfully display drawer footer', async function () {
    if (page === null || url === null) {
      assert.equal('Page is null', 'test suite failed');
      return;
    }

    const drawerFooter = await page.$$('.left-drawer__footer');
    assert.strictEqual(drawerFooter.length, 1);
  });

  it('should successfully display content section', async function () {
    if (page === null || url === null) {
      assert.equal('Page is null', 'test suite failed');
      return;
    }

    const contentSection = await page.$$('.content-section');
    assert.strictEqual(contentSection.length, 1);
  });

  it('should successfully display content section header', async function () {
    if (page === null || url === null) {
      assert.equal('Page is null', 'test suite failed');
      return;
    }

    const contentSectionHeader = await page.$$('.content-section__header');
    assert.strictEqual(contentSectionHeader.length, 1);
  });

  it('should successfully display user section', async function () {
    if (page === null || url === null) {
      assert.equal('Page is null', 'test suite failed');
      return;
    }

    const userSection = await page.$$('.user-section');
    assert.strictEqual(userSection.length, 1);
  });

  it('should successfully display user section menu on clik', async function () {
    if (page === null || url === null) {
      assert.equal('Page is null', 'test suite failed');
      return;
    }

    await page.click('.user-section');
    const userSectionMenu = await page.$$('.user-section__menu');
    assert.strictEqual(userSectionMenu.length, 1);
  });

  it('should successfully display configurations list', async function () {
    if (page === null) {
      assert.equal('Page is null', 'test suite failed');
      return;
    }

    const configNavigator = await page.$$('.config_navigator');
    assert.strictEqual(configNavigator.length, 1);
  });

  it('should successfully display configurations list items', async function () {
    if (page === null || url === null) {
      assert.equal('Page is null', 'test suite failed');
      return;
    }

    const configNavigatorItems = await page.$$('.config_navigator__item');
    assert.strictEqual(configNavigatorItems.length > 0, true);
  });

  describe('File System Tests', function () {
    const SELECTORS = {
      folderIcon: 'svg[data-testid="FolderIcon"]',
      fileIcon: 'svg[data-testid="InsertDriveFileIcon"]',
      listItem: '.config_navigator__item',
      searchInput: 'input[placeholder="Filter configurations..."]',
      clearButton: '.MuiInputAdornment-positionEnd button',
    };

    beforeEach(async function () {
      if (!page || !url) {
        this.skip();
      }
      await page.goto(`${url}/configuration`, { waitUntil: 'networkidle0' });
    });

    it('should differentiate between files and folders', async function () {
      await Promise.all([
        page?.waitForSelector(SELECTORS.folderIcon),
        page?.waitForSelector(SELECTORS.fileIcon),
      ]);

      const folderCount = await page?.$$eval(SELECTORS.folderIcon, (els) => els.length) ?? 0;
      assert.ok(folderCount > 0, 'Should render at least one folder');
    });

    it('should expand folder on click', async function () {
      const initialCount = await page?.$$eval(SELECTORS.listItem, (els) => els.length) ?? 0;

      await page?.waitForSelector(SELECTORS.folderIcon);
      await page?.click(SELECTORS.folderIcon);

      await page?.waitForFunction(
        (selector, startCount) => document.querySelectorAll(selector).length > startCount,
        {},
        SELECTORS.listItem,
        initialCount,
      );

      const finalCount = await page?.$$eval(SELECTORS.listItem, (els) => els.length) ?? 0;
      assert.ok(finalCount > initialCount, 'List should have more items after expanding');
    });

    describe('Search Functionality', function () {
      it('should filter the list when typing in search input', async function () {
        await page?.waitForSelector(SELECTORS.listItem);
        const initialCount = await page?.$$eval(SELECTORS.listItem, (els) => els.length) ?? 0;

        const searchTerm = 'co';
        await page?.waitForSelector(SELECTORS.searchInput);
        await page?.type(SELECTORS.searchInput, searchTerm, { delay: 50 });

        await page?.waitForFunction(
          (selector, startCount) => {
            const currentCount = document.querySelectorAll(selector).length;
            return currentCount < startCount && currentCount > 0;
          },
          { timeout: 2000 },
          SELECTORS.listItem,
          initialCount,
        );

        const filteredCount = await page?.$$eval(SELECTORS.listItem, (els) => els.length) ?? 0;
        assert.ok(filteredCount < initialCount, 'Filtered list should have fewer items than full list');
      });

      it('should show no results message or empty list for non-matching query', async function () {
        await page?.waitForSelector(SELECTORS.searchInput);

        const randomString = 'non_existing_non_existing_non_existing_non_existing_non_existing';
        await page?.type(SELECTORS.searchInput, randomString);

        await page?.waitForFunction(
          (selector) => document.querySelectorAll(selector).length === 0,
          { timeout: 2000 },
          SELECTORS.listItem,
        );

        const count = await page?.$$eval(SELECTORS.listItem, (els) => els.length) ?? 0;
        assert.strictEqual(count, 0, 'Should display 0 items for non-matching query');
      });
    });
  });
});
