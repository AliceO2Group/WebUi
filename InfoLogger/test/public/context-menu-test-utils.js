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

const CONTEXT_MENU_RENDER_DELAY = 25; // delay to wait for context menu to render new actions after opening

const isContextMenuOpen = async (page) => await page.evaluate(() => window.model.log.contextMenu.isOpen);

const openContextMenu = async (page, field, value, x, y) => {
  await page.evaluate((field, value, x, y) => {
    window.model.log.showContextMenu(field, value, x, y);
  }, field, value, x, y);
  await page.waitForSelector('.cell-context-menu');
  await new Promise((resolve) => setTimeout(resolve, CONTEXT_MENU_RENDER_DELAY));
};

const waitForMatchExcludeButtons = async (page) => {
  // wait for function as menu sometimes will render previous labels then update
  await page.waitForFunction(() => {
    const labels = Array.from(document.querySelectorAll('.cell-context-menu-item .ph2.w-100'))
      .map((label) => label.textContent.trim());
    return labels.length === 5
      && labels[0] === 'Match'
      && labels[1] === 'Exclude'
      && labels[2] === 'Clear filter'
      && labels[3] === 'Copy'
      && labels[4] === 'Open Inspector';
  });
};

const waitForFromToButtons = async (page) => {
  await page.waitForFunction(() => {
    const labels = Array.from(document.querySelectorAll('.cell-context-menu-item .ph2.w-100'))
      .map((label) => label.textContent.trim());
    return labels.length === 5
      && labels[0] === 'From'
      && labels[1] === 'To'
      && labels[2] === 'Clear filter'
      && labels[3] === 'Copy'
      && labels[4] === 'Open Inspector';
  });
};

const waitForSeverityButtons = async (page) => {
  await page.waitForFunction(() => {
    const labels = Array.from(document.querySelectorAll('.cell-context-menu-item .ph2.w-100'))
      .map((label) => label.textContent.trim());
    return labels.length === 5
      && labels[0] === 'Show severity'
      && labels[1] === 'Hide severity'
      && labels[2] === 'Reset severity filter'
      && labels[3] === 'Copy'
      && labels[4] === 'Open Inspector';
  });
};

const waitForLevelButtons = async (page) => {
  await page.waitForFunction(() => {
    const labels = Array.from(document.querySelectorAll('.cell-context-menu-item .ph2.w-100'))
      .map((label) => label.textContent.trim());
    return labels.length === 5
      && labels[0] === 'Set level to Support'
      && labels[1] === 'Set level to Ops'
      && labels[2] === 'Clear level filter'
      && labels[3] === 'Copy'
      && labels[4] === 'Open Inspector';
  });
};

const isMenuItemDisabled = async (page, label) => await page.evaluate((label) => {
  const item = Array.from(document.querySelectorAll('.cell-context-menu-item .ph2.w-100'))
    .find((el) => el.textContent.trim() === label)
    ?.closest('.cell-context-menu-item');
  return item?.classList.contains('disabled') ?? false;
}, label);

const clickMenuItemByLabel = async (page, label) => {
  await page.waitForFunction((label) => {
    const item = Array.from(document.querySelectorAll('.cell-context-menu-item .ph2.w-100'))
      .find((el) => el.textContent.trim() === label)
      ?.closest('.cell-context-menu-item');

    return Boolean(item) && !item.classList.contains('disabled');
  }, {}, label);

  await page.evaluate((label) => {
    const item = Array.from(document.querySelectorAll('.cell-context-menu-item .ph2.w-100'))
      .find((el) => el.textContent.trim() === label)
      ?.closest('.cell-context-menu-item');
    item.click();
  }, label);
};

module.exports = {
  CONTEXT_MENU_RENDER_DELAY,
  isContextMenuOpen,
  openContextMenu,
  waitForMatchExcludeButtons,
  waitForFromToButtons,
  waitForSeverityButtons,
  waitForLevelButtons,
  isMenuItemDisabled,
  clickMenuItemByLabel,
};
