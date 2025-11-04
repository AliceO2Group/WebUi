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
 * Helper to normalize layout data
 * @param {object} patch partial layout data
 * @param {object} layout original layout
 * @param {boolean} isFull if true, patch is a full layout
 * @param {UserService} userService user service to get username from id
 * @returns {Promise<object>} normalized layout data
 */
export const normalizeLayout = async (patch, layout = {}, isFull = false) => {
  const source = isFull ? { ...layout, ...patch } : patch;

  const fieldMap = {
    name: 'name',
    description: 'description',
    displayTimestamp: 'display_timestamp',
    autoTabChange: 'auto_tab_change_interval',
    isOfficial: 'is_official',
    ownerUsername: 'owner_username',
  };

  const data = Object.entries(fieldMap).reduce((acc, [frontendKey, backendKey]) => {
    if (frontendKey in source) {
      acc[backendKey] = source[frontendKey];
    }
    return acc;
  }, {});

  return data;
};
