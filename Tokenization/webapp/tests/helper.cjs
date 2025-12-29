/**
 * Shared helpers for Playwright-like test flows.
 */
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

const delay = duration => new Promise(resolve => setTimeout(resolve, duration));

const waitForFrontend = () => delay(300);
const waitForBackend = () => delay(800);

const normalizeText = text => text.trim().toLowerCase();

const findButtonByText = async (page, label) => {
  const buttons = await page.$$('button');
  const normalizedLabel = normalizeText(label);
  for (const button of buttons) {
    const text = await button.evaluate(node => node.textContent);
    if (normalizeText(text) === normalizedLabel) {
      return button;
    }
  }
  return null;
};

const confirmDialogSecondaryAction = async page => {
  const dialog = await page.waitForSelector('.MuiDialog-root .MuiStack-root');
  const confirmButton = await dialog.$('.MuiDialogActions-root > button:nth-of-type(2)');
  await confirmButton.click();
};

const readAlertMessage = async page => {
  const alert = await page.waitForSelector('.MuiAlert-message');
  return alert.evaluate(node => node.textContent);
};

module.exports = {
  waitForFrontend,
  waitForBackend,
  confirmDialogSecondaryAction,
  readAlertMessage,
  normalizeText,
  findButtonByText,
};
