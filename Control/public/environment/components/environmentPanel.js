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
import {miniCard, miniCardTitle} from './../../common/card/miniCard.js';
import {iframe} from './../../common/iframe/iframe.js';
import {copyToClipboardButton} from './../../common/buttons/copyToClipboardButton.js';
import {isGlobalRun} from './../environmentsPage.js';

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
      environmentContent(environment, model),
    ]
  ]);
};

/**
 * Build a header of an environment with its ID, state and time of creation
 * @param {EnvironmentInfo} environment - DTO representing an environment
 * @returns {vnode}
 */
const environmentHeader = (environment) => {
  const {currentRunNumber, state = 'UNKNOWN', id, createdWhen} = environment;
  let title = (state === 'RUNNING')
    ? `${id} - ${state} - ${currentRunNumber}`
    : `${id} - ${state}`;

  return h(`.flex-row.g2.p2.white.bg-${STATE_COLOR[state]}`, [
    copyToClipboardButton(id),
    h('h3.w-60', title),
    h('.w-40.text-right', 'Created At: ' + parseObject(createdWhen, 'createdWhen'))
  ]);
};

/**
 * Build a panel with multiple mini cards which contain actions allowed to the user for the environment
 * @param {EnvironmentInfo} environment - DTO representing an environment
 * @param {Model} model - root object of the application
 * @returns {vnode}
 */
const environmentActionPanel = (environment, model) => {
  const {includedDetectors = []} = environment;
  const hasLocks = includedDetectors.every((detector) => model.lock.isLockedByMe(detector));
  const isAllowedToControl = model.isAllowed(ROLES.Detector) && hasLocks;
  return miniCard('', controlEnvironmentPanel(model.environment, environment, isAllowedToControl));
}

/**
 * Builds a component which is to contain multiple cards with environment details
 * @param {EnvironmentInfo} environment - DTO representing an environment
 * @param {Model} model - root object of the application
 * @returns {vnode}
 */
const environmentContent = (environment, model) => {
  const isRunning = environment.state === 'RUNNING';
  const allDetectors = model.detectors.hostsByDetectorRemote;
  const {currentRunNumber} = environment;
  const {flp, qc, trg} = environment.hardware;
  const allHosts = flp.hosts.size + qc.hosts.size + trg.hosts.size;
  return h('.g2.flex-column.flex-wrap', {
  }, [
    isRunning && environmentRunningPanels(environment),
    h('.flex-column.flex-wrap.g2', [
      h('.flex-row', [
        isRunning && miniCard(
          h('.flex-row.g1', [
            copyToClipboardButton(currentRunNumber),
            h('h4', {style: 'text-decoration:underline'}, 'Run Number')
          ]),
          h('.badge.bg-success.white.h-100', {
            style: 'display:flex;font-size:2.3em;align-items: center; justify-content: center'
          }, currentRunNumber)
        ),
        miniCard(
          'General Information',
          environmentGeneralInfoPanel(environment),
          isGlobalRun(environment.userVars) ? {'background-color': '#dbedff'} : {}),
      ]),
      environment.tasks.length > 0 && h('.flex-column.flex-wrap.g2', [
        h('h4', `Tasks Summary`),
        h('.flex-row.flex-wrap.g2', [
          miniCard(
            miniCardTitle('ALL', `# hosts: ${allHosts}`),
            taskCounterContent(environment.tasks)),
          flp.tasks.length > 0 && miniCard(
            miniCardTitle('FLP', `# hosts: ${flp.hosts.size}`),
            taskCounterContent(flp.tasks)),
          qc.tasks.length > 0 && miniCard(
            miniCardTitle('QC Nodes', `# hosts: ${qc.hosts.size}`),
            taskCounterContent(qc.tasks)),
          trg.tasks.length > 0 && miniCard(
            miniCardTitle('CTP Readout', `# hosts: ${trg.hosts.size}`),
            taskCounterContent(trg.tasks)),
        ])
      ]),
    ]),
    allDetectors.isSuccess() && envTasksPerDetector(environment, allDetectors.payload),
  ]);
};

/**
 * Build a panel with cards specific for environments in RUNNING state
 * @param {EnvironmentInfo} environment - DTO representing an environment
 * @returns {vnode}
 */
const environmentRunningPanels = ({currentRunNumber}) => {
  const isMonitoringConfigured = COG && COG.GRAFANA && COG.GRAFANA.status;
  let readoutMonitoringSource = '';
  let flpMonitoringSource = '';
  let epnMonitoringSource = '';
  if (isMonitoringConfigured) {
    readoutMonitoringSource = COG.GRAFANA.plots.readoutPlot + '&var-run=' + currentRunNumber;
    flpMonitoringSource = COG.GRAFANA.plots.flpStats + '&var-run=' + currentRunNumber;
    epnMonitoringSource = COG.GRAFANA.plots.epnStats + '&var-run=' + currentRunNumber;
  }
  return isMonitoringConfigured ? h('.flex-column.w-100.g2', [
    iframe(readoutMonitoringSource, 'height: 12em; border: 0; width:100%'),
    h('.flex-row.g2', [
      iframe(flpMonitoringSource, 'height: 12em; border: 0; width:50%'),
      iframe(epnMonitoringSource, 'height: 12em; border: 0; width:50%')
    ])
  ]) : h('.w-100.text-center.grafana-font', 'Grafana plots were not loaded, please contact an administrator');
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
    rowForCard('State:', state, {valueClasses: [STATE_COLOR[state]]}),
    rowForCard('Run Type:', userVars.run_type),
    rowForCard('Created:', parseObject(createdWhen, 'createdWhen')),
    rowForCard('Template:', rootRole),
    rowForCard('FLPs:', numberOfFlps),
    rowForCard('Detectors:', detectorsAsString),
    rowForCard('Global:', isGlobalRun(userVars) ? 'ON' : '-')
  ]);
}

/**
 * Build a series of cards containing information about the tasks and hosts of each detector
 * @param {EnvironmentInfo} environment - DTO representing an environment
 * @param {Map<string, Array<string>>} allDetectors - map of all known detectors with their associated hosts
 * @returns {vnode}
 */
const envTasksPerDetector = (environment, allDetectors) => {
  const {includedDetectors = [], userVars: {hosts = '[]'} = {}} = environment;
  const hostList = JSON.parse(hosts)

  if (includedDetectors.length > 0 && hostList.length > 0) {
    return h('.flex-column.flex-wrap.g2', [
      h('h4', `FLP Tasks by Detector(s) Summary`),
      h('.flex-row.flex-wrap.g2', [
        includedDetectors.map((detector) => {
          const hostsUsed = hostList.filter((host) => allDetectors[detector].includes(host));
          const tasks = environment.tasks.filter((task) => hostsUsed.includes(task.deploymentInfo.hostname));
          return miniCard(
            miniCardTitle(detector, `# hosts: ${hostsUsed.length}`),
            taskCounterContent(tasks)
          )
        })
      ])
    ]);
  }
}
