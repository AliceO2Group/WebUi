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
 * @typedef {import('../../../services/layout/UserService.js').UserService} UserService
 */

/**
 * Helper to normalize layout data
 * @param {*} patch partial layout data
 * @param {*} layout original layout
 * @param {*} isFull if true, patch is a full layout
 * @param {*} userService user service to get username from id
 * @returns
 */
export const normalizeLayout = async (patch, layout = {}, isFull = false, userService) => {
  const source = isFull ? { ...layout, ...patch } : patch;
  const data = {};

  if ('id' in source) {
    data.id = source.id;
  }
  if ('name' in source) {
    data.name = source.name;
  }
  if ('description' in source) {
    data.description = source.description;
  }
  if ('displayTimestamp' in source) {
    data.display_timestamp = source.displayTimestamp;
  }
  if ('autoTabChange' in source) {
    data.auto_tab_change_interval = source.autoTabChange;
  }
  if ('isOfficial' in source) {
    data.is_official = source.isOfficial;
  }
  if ('owner_id' in source) {
    const username = await userService.getUsernameById(source.owner_id);
    data.owner_username = username;
  }
  return data;
};
