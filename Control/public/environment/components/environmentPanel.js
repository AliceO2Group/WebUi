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

import {h} from '/js/src/index.js';

import {parseObject} from './../../common/utils.js';
import {taskCounterContent} from './../../common/tasks/taskCounterContent.js';
import {controlEnvironmentPanel} from './controlEnvironmentPanel.js';
import {rowForCard} from './../../common/card/rowForCard.js';
import {miniCard} from './../../common/card/miniCard.js';
import {iframe} from './../../common/iframe/iframe.js';
import {copyToClipboardButton} from './../../common/buttons/copyToClipboardButton.js';

import {ROLES} from './../../workflow/constants.js';
import {STATE_COLOR} from './../../common/constants/stateColors.js';

/**
 * Builds a panel with environment information
 * @param {Model} model - root object
 * @param {EnvironmentInfo} environment - DTO representing an environment
 * @param {boolean} isMinified - value stating if the panel should display minimum information only
 * @returns {vnode}
 */
export const environmentPanel = (model, environment, isMinified = false) => {
  return h('.w-100.shadow-level1.flex-column.g1', [
    environmentHeader(environment, model),
    !isMinified && [
      environmentActionPanel(environment, model),
      environmentContent(environment),
    ]
  ]);
};

/**
 * Build a header of an environment with its ID, state and time of creation
 * @param {EnvironmentInfo} environment - DTO representing an environment
 * @param {Model} model - root object of the application
 * @returns {vnode}
 */
const environmentHeader = ({state = 'UNKNOWN', id, createdWhen}, model) =>
  h(`.flex-row.g2.p2.white.bg-${STATE_COLOR[state]}`, [
    copyToClipboardButton(id),
    h('h3.w-50', `${id} - ${state}`),
    h('.w-50.text-right', 'Created At: ' + parseObject(createdWhen, 'createdWhen'))
  ]);

/**
 * Build a panel with multiple mini cards which contain actions allowed to the user for the environment
 * @param {EnvironmentInfo} environment - DTO representing an environment
 * @param {Model} model - root object of the application
 * @returns {vnode}
 */
const environmentActionPanel = (environment, model) => {
  const hasLocks = environment.includedDetectors.every((detector) => model.lock.isLockedByMe(detector));
  const isAllowedToControl = model.isAllowed(ROLES.Detector) && hasLocks;
  return miniCard('', controlEnvironmentPanel(model.environment, environment, isAllowedToControl));
}

/**
 * Builds a component which is to contain multiple cards with environment details
 * @param {EnvironmentInfo} environment - DTO representing an environment
 * @returns {vnode}
 */
const environmentContent = (environment) => {
  const isRunning = environment.state === 'RUNNING';
  return h('.g2.flex-column.flex-wrap', {
  }, [
    isRunning && environmentRunningCards(environment),
    h('.flex-row.flex-wrap.g2', [
      miniCard('General Information', environmentGeneralInfoPanel(environment)),
      miniCard('FLP Tasks Summary', taskCounterContent(environment.tasks)),
    ])
  ]);
};

/**
 * Build a panel with cards specific for environments in RUNNING state
 * @param {EnvironmentInfo} environment - DTO representing an environment
 * @returns {vnode}
 */
const environmentRunningCards = ({currentRunNumber}) => {
  const isMonitoringConfigured = COG && COG.GRAFANA && COG.GRAFANA.status;
  let readoutMonitoringSource = '';
  let flpMonitoringSource = '';
  let epnMonitoringSource = '';
  if (isMonitoringConfigured) {
    readoutMonitoringSource = COG.GRAFANA.plots.readoutPlot + '&var-run=' + currentRunNumber;
    flpMonitoringSource = COG.GRAFANA.plots.flpStats + '&var-run=' + currentRunNumber;
    epnMonitoringSource = COG.GRAFANA.plots.epnStats + '&var-run=' + currentRunNumber;
  }
  return h('.flex-column.w-100.g2', [
    h('.flex-row.text-center.grafana-font.w-100',
      isMonitoringConfigured ? iframe(readoutMonitoringSource, 'height: 10em; border: 0; width:100%') :
        h('.w-100', 'Grafana plots were not loaded, please contact an administrator')
    ),
    h('.flex-row.flex-wrap.g2', [
      miniCard([copyToClipboardButton(currentRunNumber), ' ', 'Run Number'],
        h('.badge.bg-success.white.h-100', {
          style: 'display:flex;font-size:2.3em;align-items: center; justify-content: center'
        }, currentRunNumber)
      ),
      isMonitoringConfigured && h('', {style: 'flex-grow:1;'}, [
        iframe(flpMonitoringSource, 'height: 10em; border: 0; width:50%'),
        iframe(epnMonitoringSource, 'height: 10em; border: 0; width:50%'
        )])
    ])
  ]);
}

/**
 * Builds a panel containing multiple cards with specific environment details
 * @param {EnvironmentInfo} environment - DTO representing an environment
 * @returns {vnode}
 */
const environmentGeneralInfoPanel = (environment) => {
  const {includedDetectors = [], state, userVars = {}, createdWhen, rootRole, numberOfFlps} = environment;
  const detectorsAsString = includedDetectors.length > 0 ? includedDetectors.join(' ') : '-';
  return h('.flex-column', [
    rowForCard('State:', state, {valueClasses: [STATE_COLOR[state]]}), // TODO add color // TODO add back copy value button
    rowForCard('Run Type:', userVars.run_type),
    rowForCard('Created:', parseObject(createdWhen, 'createdWhen')),
    rowForCard('Template:', rootRole),
    rowForCard('FLPs:', numberOfFlps),
    rowForCard('Detectors:', detectorsAsString),
  ])
}
