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
 * @typedef {import('../../../services/layout/UserService.js').UserService} UserService
 */

const LOG_FACILITY = `${process.env.npm_config_log_label ?? 'qcg'}/layout-mapper`;

/**
 * Helper to normalize layout data
 * @param {*} patch partial layout data
 * @param {*} layout original layout
 * @param {*} isFull if true, patch is a full layout
 * @param {*} userService user service to get username from id
 * @returns
 */
export const normalizeLayout = async (patch, layout = {}, isFull = false, userService) => {
  const logger = LogManager.getLogger(LOG_FACILITY);
  const source = isFull ? { ...layout, ...patch } : patch;

  const fieldMap = {
    id: 'id',
    name: 'name',
    description: 'description',
    displayTimestamp: 'display_timestamp',
    autoTabChange: 'auto_tab_change_interval',
    isOfficial: 'is_official',
  };

  const data = Object.entries(fieldMap).reduce((acc, [frontendKey, backendKey]) => {
    if (frontendKey in source) {
      acc[backendKey] = source[frontendKey];
    }
    return acc;
  }, {});

  if ('owner_id' in source && userService?.getUsernameById) {
    try {
      const username = await userService.getUsernameById(source.owner_id);
      data.owner_username = username;
    } catch (error) {
      logger.errorMessage('Failed to get username by id', error);
    }
  }

  return data;
};
