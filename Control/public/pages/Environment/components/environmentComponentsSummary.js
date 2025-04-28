
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

import { h } from '/js/src/index.js';
import { miniCard } from './../../../common/card/miniCard.js';
import { ODC_STATE_COLOR } from '../../../common/constants/stateColors.js';

const UNKNOWN = 'UNKNOWN';

/**
 * Method to create a panel with the state of critical components of the environments. 
 * * ODC state
 * @param {EnvironmentInfo} environmentInfo - object with information of the environment
 * @returns {vnode} - panel with actions allowed for the user to apply on the environment
 */
export const environmentComponentsSummary = (environmentInfo) => {
  const odcState = environmentInfo?.hardware?.epn?.info?.state ?? 'UNKNOWN';
  const odcStateStyle = ODC_STATE_COLOR[odcState] ? `.${ODC_STATE_COLOR[odcState]}` : '';
  return miniCard('', [
    h('.flex-row', [
      h(`.flex-grow${odcStateStyle}`, 'ODC state: ', odcState),
      ]),
    ]);
};
