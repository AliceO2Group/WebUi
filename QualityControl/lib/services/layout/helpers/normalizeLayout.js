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

import { LogManager } from '@aliceo2/web-ui';

/**
 * @typedef {import('../UserService.js').UserService} UserService
 */

const LOG_FACILITY = `${process.env.npm_config_log_label ?? 'qcg'}/layout-normalizer`;

/**
 * Helper to normalize layout data
 * @param {object} patch - Partial layout data to be normalized
 * @param {object} layout - Existing layout data (for patches)
 * @param {boolean} isFull - Whether the patch is a full layout or a partial update
 * @param {UserService} userService - Instance of the UserService to fetch user information
 * @returns {Promise<object>} - Normalized layout data
 */
export const normalizeLayout = async (patch, layout = {}, isFull = false, userService) => {
  try {
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
  } catch (error) {
    LogManager.getLogger(LOG_FACILITY).errorMessage(`Error normalizing layout: ${error.message || error}`);
    throw new Error(`Error normalizing layout: ${error.message || error}`);
  }
};
