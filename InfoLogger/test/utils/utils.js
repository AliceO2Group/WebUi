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

/**
 * Shuffle an array in place using the Fisher-Yates algorithm.
 * @param {Array} array - the array to shuffle
 * @returns {Array} the shuffled array
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Helper function to inject logs into the model and trigger a re-render.
 * @param {Page} page - puppeteer page
 * @param {Array<{severity: string}>} logs - array of log objects to inject
 */
async function injectLogs(page, logs) {
  await page.evaluate((logs) => {
    window.model.log.list = logs;
    window.model.log.resetStats();
    window.model.log.list.forEach((log) => window.model.log.addStats(log));
    window.model.notify();
  }, logs);
};

/**
 * Helper to wait until an element's text includes the expected substring.
 * @param {Page} page - puppeteer page
 * @param {string} selector - CSS selector
 * @param {string} text - substring to wait for
 */
async function waitForTextInElement(page, selector, text) {
  await page.waitForFunction(
    (sel, txt) => {
      const el = document.querySelector(sel);
      return el && el.textContent.includes(txt);
    },
    { timeout: 2000 },
    selector,
    text,
  );
}

/*
 * A stale element from a previous test can already satisfy a waitForSelector check
 * before the pending redraw (reflecting the new state) has actually run.
 * Waiting for two animation frames guarantees the redraw has fired at least once
 * since the mutation.
 */
const waitForNextRender = (page) => page.evaluate(() => new Promise((resolve) => {
  requestAnimationFrame(() => requestAnimationFrame(resolve));
}));

module.exports = {
  shuffle,
  injectLogs,
  waitForTextInElement,
  waitForNextRender,
};
