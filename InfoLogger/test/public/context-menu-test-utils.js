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

const { waitForNextRender } = require('../utils/utils');

const isContextMenuOpen = async (page) => await page.evaluate(() => window.model.log.contextMenu.isOpen);

const getMenuActionLabels = async (page) => page.evaluate(() =>
  Array.from(document.querySelectorAll('.cell-context-menu-item .ph2.w-100'))
    .map((el) => el.textContent.trim()));

const openContextMenu = async (page, field, value, x, y) => {
  await page.evaluate((field, value, x, y) => {
    window.model.log.contextMenu.show(field, value, x, y);
  }, field, value, x, y);
  await waitForNextRender(page);
  await page.waitForSelector('.cell-context-menu');
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
  isContextMenuOpen,
  getMenuActionLabels,
  openContextMenu,
  isMenuItemDisabled,
  clickMenuItemByLabel,
};
