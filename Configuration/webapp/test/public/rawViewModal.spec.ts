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

declare global {
  interface Window {
    mockClipboard?: string;
  }
}

describe('`rawViewModal` test-suite', function () {
  let url: string | null = null;
  let page: Page | null = null;

  const SELECTORS = {
    rawDataIcon: 'svg[data-testid="DataObjectIcon"]',
    accordionSummary: '.MuiAccordionSummary-root',
    dialog: '.MuiDialog-root',
    dialogTitle: '.MuiDialogTitle-root',
    closeIcon: 'svg[data-testid="CloseIcon"]',
    monacoEditor: '.monaco-editor',
  };

  before(function () {
    ({
      test: {
        page,
        helpers: { url },
      },
    } = global);
  });

  /**
   * Helper function to open the raw view modal.
   * It locates the accordion header, clicks the raw data icon/button,
   * and waits for the dialog to become visible.
   * @returns {Promise<void>} Promise that resolves when the modal is fully opened.
   */
  async function openRawModal() {
    if (!page) {
      return;
    }
    await page.waitForSelector(SELECTORS.accordionSummary);

    const rawDataBtn = await page.$(`${SELECTORS.accordionSummary} button:has(${SELECTORS.rawDataIcon})`);

    if (rawDataBtn) {
      await rawDataBtn.click();
    } else {
      await page.click(SELECTORS.rawDataIcon);
    }

    await page.waitForSelector(SELECTORS.dialog, { visible: true });
  }

  beforeEach(async function () {
    if (!page || !url) {
      this.skip();
    }
    await page.goto(`${url}/configuration`, { waitUntil: 'networkidle0' });

    await page.waitForSelector(SELECTORS.accordionSummary);
  });

  it('should open raw view modal when clicking the raw data icon', async function () {
    if (page === null) {
      assert.equal('Page is null', 'test suite failed');
      return;
    }

    await openRawModal();

    const dialogCount = await page.$$(SELECTORS.dialog);
    assert.strictEqual(dialogCount.length, 1, 'Modal should be visible');
  });

  it('should display correct title and render Monaco editor', async function () {
    if (page === null) {
      assert.equal('Page is null', 'test suite failed');
      return;
    }

    const accordionTitle = await page.$eval(
      `${SELECTORS.accordionSummary} .MuiTypography-root`,
      (el) => el.textContent?.trim(),
    );

    await openRawModal();

    const dialogTitle = await page.$eval(
      SELECTORS.dialogTitle,
      (el) => el.textContent?.trim(),
    );

    assert.ok(dialogTitle?.includes(accordionTitle || ''), 'Dialog title should match section title');

    await page.waitForSelector(SELECTORS.monacoEditor);
    const editor = await page.$$(SELECTORS.monacoEditor);
    assert.strictEqual(editor.length, 1, 'Monaco editor should be rendered');
  });

  it('should close the modal when clicking the close icon', async function () {
    if (page === null) {
      assert.equal('Page is null', 'test suite failed');
      return;
    }

    await openRawModal();

    const dialogCloseBtn = `${SELECTORS.dialog} ${SELECTORS.closeIcon}`;
    await page.waitForSelector(dialogCloseBtn);
    await page.click(dialogCloseBtn);

    await page.waitForSelector(SELECTORS.dialog, { hidden: true });

    const dialogVisible = await page.evaluate(() => {
      const el = document.querySelector('.MuiDialog-root');
      return el && window.getComputedStyle(el).visibility !== 'hidden' && el.getAttribute('aria-hidden') !== 'true';
    });

    assert.strictEqual(dialogVisible, null, 'Modal should be closed/hidden');
  });
});
