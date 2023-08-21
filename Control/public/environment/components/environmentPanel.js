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

import {parseObject, parseOdcStatusPerEnv} from './../../common/utils.js';
import {taskCounterContent} from './../../common/tasks/taskCounterContent.js';
import {controlEnvironmentPanel} from './controlEnvironmentPanel.js';
import {rowForCard} from './../../common/card/rowForCard.js';
import {miniCard, miniCardTitle} from './../../common/card/miniCard.js';
import {iframe} from './../../common/iframe/iframe.js';
import {copyToClipboardButton} from './../../common/buttons/copyToClipboardButton.js';
import {isGlobalRun} from './../environmentsPage.js';

import {ROLES} from './../../workflow/constants.js';
import {ALIECS_STATE_COLOR} from './../../common/constants/stateColors.js';

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
  const {currentRunNumber, state = 'UNKNOWN', id, createdWhen, userVars} = environment;
  let title = `${id} - ${state}`;
  let transitionTime = parseObject(createdWhen, 'createdWhen');
  let transitionLabel = 'Created At: ';
  if (state === 'RUNNING') {
    title = `${id} - ${state} - ${currentRunNumber}`;
    transitionTime = parseObject(userVars['run_start_time_ms'], 'run_start_time_ms');
    transitionLabel = 'Running since: ';
  }
  return h(`.flex-row.g2.p2.white.bg-${ALIECS_STATE_COLOR[state]}`, [
    copyToClipboardButton(id),
    h('h3.w-60', title),
    h('.w-40.text-right', transitionLabel + transitionTime)
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
  const {flp, qc, trg, epn} = environment.hardware;
  const allHosts = flp.hosts.size + qc.hosts.size + trg.hosts.size;
  return h('.cardGroupColumn', {
  }, [
    isRunning && environmentRunningPanels(environment),
    h('.cardGroupColumn', [
      h('.cardGroupRow', [
        isRunning && miniCard(
          h('.flex-row.g1', [
            copyToClipboardButton(currentRunNumber),
            miniCardTitle('Run Number')
          ]),
          h('.badge.runNumber', currentRunNumber)
        ),
        miniCard(
          'General Information',
          environmentGeneralInfoContent(environment),
          isGlobalRun(environment.userVars)
            ? ['bg-global-run']
            : []
        ),
        miniCard(
          'Components',
          environmentComponentsContent(environment),
        ),
      ]),
      environment.tasks.length > 0 && h('.cardGroupColumn', [
        h('h4', `Tasks Summary`),
        h('.cardGroupRow', [
          miniCard(
            miniCardTitle('ALL', `# hosts: ${allHosts}`),
            taskCounterContent(environment.tasks.concat(epn.tasks))),
          flp.tasks.length > 0 && miniCard(
            miniCardTitle('FLP', `# hosts: ${flp.hosts.size}`),
            taskCounterContent(flp.tasks)),
          qc.tasks.length > 0 && miniCard(
            miniCardTitle('QC Nodes', `# hosts: ${qc.hosts.size}`),
            taskCounterContent(qc.tasks)),
          trg.tasks.length > 0 && miniCard(
            miniCardTitle('CTP Readout', `# hosts: ${trg.hosts.size}`),
            taskCounterContent(trg.tasks)),
          epn.tasks.length > 0 && miniCard(
            miniCardTitle('EPN'),
            taskCounterContent(epn.tasks)),
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
const environmentRunningPanels = ({currentRunNumber, userVars}) => {
  const isMonitoringConfigured = COG && COG.GRAFANA && COG.GRAFANA.status;
  const {readoutPlot, flpStats, epnStats} = COG && COG.GRAFANA && COG.GRAFANA.plots;
  const runStart = Number(userVars['run_start_time_ms']);
  let readoutMonitoringSource = '';
  let flpMonitoringSource = '';
  let epnMonitoringSource = '';
  if (isMonitoringConfigured) {
    const THIRTY_MINUTES_IN_MS = 1000 * 60 * 30;
    const runStartParam = (Number.isInteger(runStart) && (Date.now() - runStart) < THIRTY_MINUTES_IN_MS)
      ? `&from=${runStart}`
      : '';
    readoutMonitoringSource = readoutPlot + '&var-run=' + currentRunNumber + runStartParam;
    flpMonitoringSource = flpStats + '&var-run=' + currentRunNumber;
    epnMonitoringSource = epnStats + '&var-run=' + currentRunNumber;
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
 * Returns content for a mini card containing specific environment general details
 * @param {EnvironmentInfo} environment - DTO representing an environment
 * @returns {vnode}
 */
const environmentGeneralInfoContent = (environment) => {
  const {state, userVars = {}, createdWhen, rootRole } = environment;
  return h('.flex-column', [
    rowForCard('ENV Created:', parseObject(createdWhen, 'createdWhen')),
    rowForCard('State:', state, {valueClasses: [ALIECS_STATE_COLOR[state]]}),
    rowForCard('Run Type:', userVars.run_type),
    rowForCard('RUN Started:', parseObject(userVars['run_start_time_ms'], 'run_start_time_ms')),
    rowForCard('RUN Ended:', parseObject(userVars['run_end_time_ms'], 'run_end_time_ms')),
    rowForCard('Template:', rootRole),
    rowForCard('Global:', isGlobalRun(userVars) ? 'ON' : '-')
  ]);
}

/**
 * Returns content for a miniCard with information on what components are used by the Environment
 * @param {EnvironmentInfo} environment - DTO representing an environment
 * @returns {vnode}
 */
const environmentComponentsContent = (environment) => {
  const {userVars, numberOfFlps, includedDetectors = [], hardware = {epn: {}}} = environment;
  const {epn: {info}} = hardware;
  const detectorsAsString = includedDetectors.length > 0 ? includedDetectors.join(' ') : '-';
  const {state: odcState, styleClass: odcStyle} = parseOdcStatusPerEnv(environment);

  return h('.flex-column', [
    rowForCard('FLPs:', numberOfFlps),
    rowForCard('Detectors:', detectorsAsString),
    rowForCard('DCS:', parseObject(userVars, 'dcs_enabled')),
    rowForCard('Data Distribution (FLP):', parseObject(userVars, 'dd_enabled')),
    rowForCard('EPNs:', parseObject(userVars, 'odc_n_epns')),
    rowForCard('TRG:', parseObject(userVars, 'trg_enabled')),
    rowForCard('CTP Readout:', parseObject(userVars, 'ctp_readout_enabled')),
    rowForCard('ODC:', odcState, {valueClasses: [odcStyle]}),
    rowForCard('DDS:', info.ddsSessionStatus ? info.ddsSessionStatus : '-'),
    info.ddsSessionStatus && rowForCard('DDS Session ID:', info.ddsSessionId ? info.ddsSessionId : '-'),
  ]);
};

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
