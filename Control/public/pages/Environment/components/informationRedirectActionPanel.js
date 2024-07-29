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

/* global COG */

import { h } from '/js/src/index.js';
import { infoLoggerButton } from './buttons.js';

/**
 * Panel with buttons that redirect the user to other GUIs based on the environment information provided
 * @param {EnvironmentInfo} environmentInfo - DTO representing an environment
 * @returns {vnode} - panel with buttons that redirect the user to other GUIs
 */
export const informationRedirectActionPanel = (environmentInfo) => {
  return h('.flex-row.flex-grow-1.g2', [
    infoLoggerButton(environmentInfo, 'InfoLogger FLP', COG.ILG_URL),
    infoLoggerButton(environmentInfo, 'InfoLogger EPN', COG.ILG_EPN_URL),
  ]);
};
