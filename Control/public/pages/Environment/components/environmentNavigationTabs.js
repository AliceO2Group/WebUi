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
import {currentPageAndParameters} from '../../../utilities/currentPageAndParameters.js';
import {environmentConfigurationTable} from './environmentConfigurationTable.js';
import {isGlobalRun} from '../../../environment/environmentsPage.js';
import {miniCard} from '../../../common/card/miniCard.js';
import {parseObject, parseOdcStatusPerEnv} from '../../../common/utils.js';
import {rowForCard} from '../../../common/card/rowForCard.js';
import { tasksPerHostPanel } from '../../../common/task/tasksPerHostPanel.js';

/**
 * @file Builds the navigation tabs that are to be displayed on the environment details page which contains the following tabs:
 * - General - contains most used information of an environment presented in a user-friendly way
 * - Configuration - contains the configuration variables
 * - EPN - contains the tasks grouped by EPN
 * - FLP - contains the tasks grouped by FLP
 * - QC - contains the tasks grouped by QC
 * - TRG - contains the tasks grouped by TRG
 */

/**
 * Builds the navigation tabs that are to be displayed on the environment details page
 * @param {Model} model - the root model of the application
 * @param {EnvironmentInfo} environment - the environment to display
 */
export const environmentNavigationTabs = (model, item) => {
  const {hardware: {flp, qc, epn, trg}} = item;
  const panels = {
    general: {
      name: 'General',
      content: environmentGeneralInfoContent
    },
    configuration: {
      name: 'Configuration',
      content: environmentConfigurationTable,
    },
    epn: {
      name: `EPNs (${epn?.tasks?.total ?? '?'})`,
      content: tasksPerHostPanel,
    },
    flp: {
      name: `FLPs (${flp?.tasks?.total ?? '?'})`,
      content: tasksPerHostPanel,
    },
    qc: {
      name: `QC  (${qc?.tasks?.total ?? '?'})`,
      content: tasksPerHostPanel,
    },
    trg: {
      name: `TRG  (${trg?.tasks?.total ?? '?'})`,
      content: tasksPerHostPanel,
    },
  };
  const {parameters} = currentPageAndParameters();
  return [
    h('ul.nav.nav-tabs.m0', [
      Object.entries(panels)
        .map(([id, { name }]) => {
          const isActive = parameters.panel === id;
          return h(
            'li.nav-item',
            {id: `${id}-task-source`},
            h(`a.nav-link${isActive ? '.active' : ''}`, {
              onclick: () => {
                model.router.go(`?page=environment&id=${item.id}&panel=${id}`, true, true);
                model.environment.getEnvironment({id: item.id}, false, id);
                model.environment.notify();
              }
            }, name)
          );
        }),
    ]),
    h('.tab-content', Object.entries(panels)
      .filter(([id]) => parameters.panel === id)
      .map(([id, {content}]) =>  h(`.tab-panel.active`, {id: `${id}-pane`}, content(model.environment, item, id)))
    )
  ];
};

/**
 * Returns content for a mini card containing specific environment general details
 * @param {Environment} environmentModel - model of the environment
 * @param {EnvironmentInfo} environment - DTO representing an environment
 * @returns {vnode}
 */
const environmentGeneralInfoContent = (environmentModel, environment) => {
  const {currentTransition = '-', userVars = {}, createdWhen, rootRole, hardware = {epn: {}}} = environment;
  const {epn: {info}} = hardware;
  const {state: odcState, styleClass: odcStyle} = parseOdcStatusPerEnv(environment);

  return miniCard(
    '',
    [
      h('.flex-column.', [
        rowForCard('Global:', isGlobalRun(userVars) ? 'ON' : '-'),
        rowForCard('Transitioning:', currentTransition),
        rowForCard('ENV Created:', parseObject(createdWhen, 'createdWhen')),
        rowForCard('RUN Started:', parseObject(userVars['run_start_time_ms'], 'run_start_time_ms')),
        rowForCard('RUN Ended:', parseObject(userVars['run_end_time_ms'], 'run_end_time_ms')),
        rowForCard('Run Type:', userVars.run_type),
        rowForCard('Template:', rootRole),
        rowForCard('DCS:', parseObject(userVars, 'dcs_enabled')),
        rowForCard('Data Distribution (FLP):', parseObject(userVars, 'dd_enabled')),
        rowForCard('ODC:', odcState, {valueClasses: [odcStyle]}),
        rowForCard('DDS:', info.ddsSessionStatus ? info.ddsSessionStatus : '-'),
        info.ddsSessionStatus && rowForCard('DDS Session ID:', info.ddsSessionId ? info.ddsSessionId : '-'),
      ])
    ],
    isGlobalRun(environment.userVars)
      ? ['bg-global-run', 'p2', 'g2']
      : ['p2', 'g2']
  );
};
