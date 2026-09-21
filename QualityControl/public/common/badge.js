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

import { h, iconCheck, iconX } from '/js/src/index.js';

/**
 * A green success badge with the tick icon
 * @param {string} text - Text to display in the badge
 * @returns {vnode} The badge virtual node
 */
export const statusBadgeSuccess = (text) =>
  h('.badge.success.b-success.b1', h('.flex-row.g1', [text, iconCheck()]));

/**
 * A red failure badge with the X icon
 * @param {string} text - Text to display in the badge
 * @returns {vnode} The badge virtual node
 */
export const statusBadgeFail = (text) =>
  h('.badge.danger.b-danger.b1', h('.flex-row.g1', [text, iconX()]));

/**
 * A status badge with dynamic color and icon depending on success or failure.
 * @param {string} text - Text to display inside the badge
 * @param {boolean} success - Whether the badge represents success (`true`) or failure (`false`)
 * @returns {vnode} The badge virtual node
 */
export const statusBadge = (text, success) =>
  success ? statusBadgeSuccess(text) : statusBadgeFail(text);
