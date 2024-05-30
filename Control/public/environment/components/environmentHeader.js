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

import {h} from '/js/src/index.js';
import {ALIECS_STATE_COLOR} from './../../common/constants/stateColors.js';
import {textWithCopyClipboard} from '../../common/buttons/textWithCopyClipboard.js';
import {parseObject} from './../../common/utils.js';

/**
 * Build a component which represents a header with the environment id, state and creation time
 * @param {EnvironmentInfo} environment - DTO representing an environment
 * @returns {vnode}
 */
export const environmentHeader = (environment) => {
  const {currentRunNumber, state = 'UNKNOWN', id, createdWhen, userVars} = environment;
  let transitionTime = parseObject(createdWhen, 'createdWhen');

  let transitionLabel = 'Created At: ';
  let title = ` - ${state}`;
  if (state === 'RUNNING') {
    transitionTime = parseObject(userVars['run_start_time_ms'], 'run_start_time_ms');
    transitionLabel = 'Running since: ';
  }

  return h(`.flex-row.g2.p2.white.bg-${ALIECS_STATE_COLOR[state]}`, [
    textWithCopyClipboard(id, 'h3'),
    h('h3', title),
    state === 'RUNNING' && textWithCopyClipboard(currentRunNumber, 'h3'),
    h('.ph1.flex-grow.text-right', transitionLabel + transitionTime)
  ]);
};
