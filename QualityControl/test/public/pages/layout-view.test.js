/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file 'COPYING'.
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */
/* eslint-disable max-len */

import assert from 'assert';

export const layoutViewTestSuite = async (url, page) => {
  describe('layoutShow page test suite', () => {
    it('should load', async () => {
      // Id 5aba4a059b755d517e76ea12 is set in QCModelDemo
      await page.goto(
        `${url}?page=layoutShow&layoutId=5aba4a059b755d517e76ea10`,
        { waitUntil: 'networkidle0' }
      );
      const location = await page.evaluate(() => window.location);
      assert.strictEqual(
        location.search,
        '?page=layoutShow&layoutId=5aba4a059b755d517e76ea10'
      );
    });
    it('should have tabs in the header', async () => {
      const tabsCount = await page.evaluate(
        () => document.querySelectorAll('header .btn-tab').length
      );
      assert.ok(tabsCount > 1);
    });
    it('should have selected layout in the sidebar highlighted', async () => {
      const layoutClassList = await page.evaluate(
        () =>
          document.querySelector(
            'body > div > div > nav > div:nth-child(5) > a:nth-child(1)'
          ).classList
      );
      assert.deepStrictEqual(layoutClassList, {
        0: 'menu-item',
        1: 'w-wrapped',
        2: 'selected',
      });
    });

    /*
     * It('should have jsroot svg plots in the section', async () => {
     * TODO add back
     *   const plotsCount = await page.evaluate(() => document.querySelectorAll('section svg.jsroot').length);
     *   await page.waitForTimeout(20000);
     *   assert.ok(plotsCount > 1);
     * });
     */

    it('should have an info button with full path, last modified and metadata when clicked (plot success)', async () => {
      await page.evaluate(() =>
        document
          .querySelector(
            'body > div > div >' +
              ' section > div > div > div: nth - child(3) > div > div > div: nth - child(2) > div > div > button'
          )
          .click()
      );

      const result = await page.evaluate(() => {
        const infoButtonTitle = document.querySelector(
          'body > div > div > section > div > div > div:nth-child(3)' +
            ' > div > div > div:nth-child(2) > div > div > button'
        ).title;
        const lastModified = document.querySelector(
          'body > div > div > section > div > div > div:nth-child(3) > div' +
            '> div > div:nth-child(2) > div > div > div > div:nth-child(2)'
        ).innerText;
        const path = document.querySelector(
          'body > div > div > section > div > div > div:nth-child(3) > div > div' +
            ' > div:nth-child(2) > div > div > div > div'
        ).innerText;
        return {
          lastModified: lastModified,
          path: path,
          title: infoButtonTitle,
        };
      });

      assert.strictEqual(
        result.title,
        'View details about histogram',
        'Button title is different'
      );
      assert.ok(
        result.path.includes('PATH'),
        'Object full path label is not the same'
      );
      assert.ok(
        result.path.includes('DAQ01/EventSizeClasses/class_C0ALSR-ABC'),
        'Object full path is not the same'
      );
      assert.ok(
        result.lastModified.includes('LAST MODIFIED'),
        'Last Modified label is different'
      );
    });

    it('should have an info button with full path and last modified when clicked on a second plot(plot success)', async () => {
      const result = await page.evaluate(() => {
        const infoButtonTitle = document.querySelector(
          'body > div > div > ' +
            'section > div > div > div: nth - child(2) > div > div > div: nth - child(2) > div > div > button'
        ).title;
        const lastModified = document.querySelector(
          'body > div > div > section > div > div > div:nth-child(2) > ' +
            'div > div > div: nth - child(2) > div > div > div > div: nth - child(2)'
        ).innerText;
        const path = document.querySelector(
          'body > div > div > section > div > div > div:nth-child(2) > ' +
            'div > div > div: nth - child(2) > div > div > div > div'
        ).innerText;
        return {
          lastModified: lastModified,
          path: path,
          title: infoButtonTitle,
        };
      });

      // Click again to reset for other tests
      await page.evaluate(() =>
        document
          .querySelector(
            'body > div > div > section > div > div > div:nth-child(2) > ' +
              'div > div > div: nth - child(2) > div > div > button'
          )
          .click()
      );
      assert.strictEqual(
        result.title,
        'View details about histogram',
        'Button title is different'
      );
      assert.ok(
        result.path.includes('PATH'),
        'Object full path label is not the same'
      );
      assert.ok(
        result.path.includes('DAQ01/EventSizeClasses/class_C0AMU-AB'),
        'Object full path is not the same'
      );
      assert.ok(
        result.lastModified.includes('LAST MODIFIED'),
        'Last Modified label is different'
      );
    });

    it('should have second tab to be empty (according to demo data)', async () => {
      await page.evaluate(() =>
        document
          .querySelector(
            'header > div > div:nth-child(2) > div > button:nth-child(2)'
          )
          .click()
      );
      await page.waitForSelector('section h1', { timeout: 5000 });
      const plotsCount = await page.evaluate(
        () => document.querySelectorAll('section svg.jsroot').length
      );
      assert.strictEqual(plotsCount, 0);
    });

    it('should have a button group containing three buttons in the header', async () => {
      const buttonCount = await page.evaluate(
        () =>
          document.querySelectorAll(
            'header > div > div:nth-child(3) > div.btn-group > button'
          ).length
      );
      assert.strictEqual(buttonCount, 3);
    });

    it('should have one duplicate button in the header to create a new duplicated layout', async () => {
      await page.waitForSelector(
        'header > div > div:nth-child(3) > div.btn-group > button:nth-child(1)',
        { timeout: 5000 }
      );
      const duplicateButton = await page.evaluate(
        () =>
          document.querySelector(
            'header > div > div:nth-child(3) > div.btn-group > button:nth-child(1)'
          ).title
      );
      assert.strictEqual(duplicateButton, 'Duplicate layout');
    });

    it('should have one delete button in the header to delete layout', async () => {
      await page.waitForSelector(
        'header > div > div:nth-child(3) > div.btn-group > button:nth-child(4)',
        { timeout: 5000 }
      );
      const deleteButton = await page.evaluate(
        () =>
          document.querySelector(
            'header > div > div:nth-child(3) > div.btn-group > button:nth-child(4)'
          ).title
      );
      assert.strictEqual(deleteButton, 'Delete layout');
    });

    it('should have one link button in the header to download layout skeleton', async () => {
      await page.waitForSelector(
        'header > div > div:nth-child(3) > div.btn-group > a',
        { timeout: 5000 }
      );
      const editButton = await page.evaluate(
        () =>
          document.querySelector(
            'header > div > div:nth-child(3) > div.btn-group > a'
          ).title
      );
      assert.strictEqual(editButton, 'Export layout skeleton as JSON file');
    });

    it('should have one edit button in the header to go in edit mode', async () => {
      await page.waitForSelector(
        'header > div > div:nth-child(3) > div.btn-group > button:nth-child(3)',
        { timeout: 5000 }
      );
      const editButton = await page.evaluate(
        () =>
          document.querySelector(
            'header > div > div:nth-child(3) > div.btn-group > button:nth-child(3)'
          ).title
      );
      assert.strictEqual(editButton, 'Edit layout');
    });

    // Begin: Edit Mode;
    it('should click the edit button in the header and enter edit mode', async () => {
      await page.waitForSelector(
        'header > div > div:nth-child(3) > div > button:nth-child(3)',
        { timeout: 5000 }
      );
      await page.evaluate(() =>
        document
          .querySelector(
            'header > div > div:nth-child(3) > div > button:nth-child(3)'
          )
          .click()
      );
    });

    it('should have input field for changing layout name in edit mode', async () => {
      await page.waitForSelector('header > div > div:nth-child(3) > input', {
        timeout: 5000,
      });
      const count = await page.evaluate(
        () =>
          document.querySelectorAll('header > div > div:nth-child(3) > input')
            .length
      );
      assert.strictEqual(count, 1);
    });

    it('should have number input field fo Sr allowing users to change auto-tab value', async () => {
      await page.waitForSelector(
        'nav > div > div > div:nth-child(4) > div > label',
        { timeout: 5000 }
      );
      await page.waitForSelector(
        'nav > div > div > div:nth-child(4) > div:nth-child(2) > input',
        { timeout: 5000 }
      );
      const autoText = await page.evaluate(
        () =>
          document.querySelector(
            'nav > div > div > div:nth-child(4) > div > label'
          ).innerText
      );
      const inputNumber = await page.evaluate(
        () =>
          document.querySelector(
            'nav > div > div > div:nth-child(4) > div:nth-child(2) > input'
          ).type
      );
      assert.strictEqual(
        autoText,
        'Tab Auto-Change(sec): 0 (OFF), 10-600 (ON)'
      );
      assert.deepStrictEqual(inputNumber, 'number');
    });

    it('should have a tree sidebar in edit mode', async () => {
      await page.waitForSelector('nav table tbody tr', { timeout: 5000 });
      const rowsCount = await page.evaluate(
        () => document.querySelectorAll('nav table tbody tr').length
      );
      assert.strictEqual(rowsCount, 5); // 5 agents
    });

    it('should have filtered results on input search filled', async () => {
      await page.type(
        'nav > div > div > div:nth-child(6) > input',
        'HistoWithRandom'
      );
      await page.waitForFunction(
        'document.querySelectorAll("nav table tbody tr").length === 1',
        { timeout: 5000 },
      );
    });

    it('should show normal sidebar after Cancel click', async () => {
      await page.evaluate(() =>
        document
          .querySelector(
            'header > div > div:nth-child(3) > div > button:nth-child(2)'
          )
          .click()
      );
      await page.waitForSelector('nav .menu-title', { timeout: 5000 });
    });
  });
};
