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

const {
  waitForBackend,
  waitForFrontend,
  findButtonByText,
  confirmDialogSecondaryAction,
} = require('../../helper.cjs');

async function tryRevokeSingleToken(page, tokenId) {
  let tokenRow;
  await waitForBackend();

  const trs = await page.$$('table tbody tr');
  for (const tr of trs) {
    const td = await tr.$('td:first-child a');
    const text = await td.evaluate(node => node.textContent);
    if (text.trim() === tokenId) {
      tokenRow = tr;
      break;
    }
  }
  if (!tokenRow) throw new Error('Token row not found');

  const revokeButton = await tokenRow.$('button');
  await revokeButton.click();
  await confirmDialogSecondaryAction(page);
}

async function tryBulkRevokeTokens(page, issuedAfter) {
  await waitForFrontend();

  const showFiltersButton = await findButtonByText(page, 'show');
  if (!showFiltersButton) throw new Error('Show Filters button not found');
  await showFiltersButton.click();
  await waitForFrontend();

  const issueAfterInput = await page.waitForSelector('input[name="issuedAfter"]');
  await issueAfterInput.type(issuedAfter);

  const applyFiltersButton = await findButtonByText(page, 'apply');
  if (!applyFiltersButton) throw new Error('Apply Filters button not found');
  await applyFiltersButton.click();
  await waitForBackend();

  const revokeBulkButton = await findButtonByText(page, 'bulk revoke');
  if (!revokeBulkButton) throw new Error('Bulk Revoke button not found');
  await revokeBulkButton.click();

  await confirmDialogSecondaryAction(page);
}

module.exports = {
  tryRevokeSingleToken,
  tryBulkRevokeTokens,
};
