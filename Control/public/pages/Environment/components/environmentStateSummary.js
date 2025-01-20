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
import {ALIECS_STATE_COLOR} from '../../../common/constants/stateColors.js';
import {parseObject} from '../../../common/utils.js';
import {EnvironmentState} from '../../../common/enums/EnvironmentState.enum.js';
import {DropdownCopyValue} from '../../../common/buttons/DropdownCopyValue.js';
/**
 * Build a component which represents a summary of the state of the environment with the environment id, state and creation time
 * @param {EnvironmentInfo} environment - DTO representing an environment
 * @returns {vnode}
 */
export const environmentStateSummary = (environment) => {
  const {currentRunNumber, state = EnvironmentState.UNKNOWN, id, createdWhen, userVars} = environment;
  let transitionTime = parseObject(createdWhen, 'createdWhen');

  let transitionLabel = 'Created At: ';
  let title = ` - ${state}`;
  if (state === EnvironmentState.RUNNING) {
    transitionTime = parseObject(userVars['run_start_time_ms'], 'run_start_time_ms');
    transitionLabel = 'Running since: ';
  }
  
  var commaSeparated =  [currentRunNumber, id].join(',').toString();
  var SlashSeparated =  [currentRunNumber, id].join('/').toString();

  var options = [  
    {label: 'Environment Id: ' + id, value:id},
  ];

  state === EnvironmentState.RUNNING && options.push({label: 'Run Number: ' + currentRunNumber, value:currentRunNumber},
    {label: 'RunNumber, environmentId ', value:commaSeparated},
    {label: 'RunNumber / environmentId ', value:SlashSeparated},
  );

  return h(`.flex-row.g2.p2.white.bg-${ALIECS_STATE_COLOR[state]}`, [
    DropdownCopyValue('Copy', 'p', options),
    h('h3', title),
    // state === EnvironmentState.RUNNING && textWithCopyClipboard(currentRunNumber, 'h3'),
    h('.ph1.flex-grow.flex-column.flex-center.text-right', transitionLabel + transitionTime)
  ]);
};
