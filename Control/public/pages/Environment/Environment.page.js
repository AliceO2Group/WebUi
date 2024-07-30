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
import {environmentActionPanel} from './components/environmentActionPanel.js';
import {environmentNavigationTabs} from './components/environmentNavigationTabs.js';
import {environmentTasksSummaryTable} from './components/environmentTasksSummaryTable.js';
import {monitoringRunningPlotsPanel} from './components/monitoringRunningPlotsPanel.js';
import pageLoading from './../../common/pageLoading.js';
import errorPage from './../../common/errorPage.js';
import {environmentStateSummary} from './components/environmentStateSummary.js';
import {EnvironmentState} from './../../common/enums/EnvironmentState.enum.js';

/**
 * @file Page to show information about all information of one environment (header + content)
 */

/**
 * Header of the environment details page showing one environment
 * @return {vnode} - header of the page
 */
export const EnvironmentPageHeader = () => h('h4.flex-grow.text-center', 'Environment details');

/**
 * Content of the environment details page showing one environment based on the state of the request
 * @param {Model} model - root model of the application
 * @return {vnode} - content of the page
 */
export const EnvironmentPageContent = (model) => h('.scroll-y.absolute-fill', [
  model.environment.item.match({
    NotAsked: () => null,
    Loading: () => h('.w-100.text-center', pageLoading()),
    Success: (environmentInfo) => showEnvironmentPage(model, environmentInfo),
    Failure: (error) => errorPage(error),
  })
]);

/**
 * Show all properties of environment and action panels for its actions at bottom
 * @param {Model} model - root model of the application
 * @param {EnvironmentInfo} environmentInfo - object with information of the environment
 * @return {vnode} - content of environment info
 */
const showEnvironmentPage = (model, environmentInfo) => {
  const {state, currentTransition = undefined} = environmentInfo;
  const isRunningStable = !currentTransition && state === EnvironmentState.RUNNING;
  const { services: { detectors: { availability = {} } = {} } } = model;

  const onRowClick = async (component, state) => {
    model.router.go(`?page=environment&id=${environmentInfo.id}&panel=${component}`, true, true);
    model.environment.taskTableModel.setFilterState(state);
    
    document.getElementById('environment-tabs-navigation-header').scrollIntoView({ behavior: 'auto', block: 'center' });
    await model.environment.getEnvironment({ id: environmentInfo.id }, false, component);
  }

  return h('.w-100.p1.g2.flex-column', [
    environmentStateSummary(environmentInfo),
    environmentActionPanel(model, environmentInfo),
    isRunningStable && monitoringRunningPlotsPanel(environmentInfo),
    h('.flex-row.g2.z-index-one', [
      environmentTasksSummaryTable(environmentInfo, availability, onRowClick),
    ]),
    environmentNavigationTabs(model, environmentInfo),
  ]);
};
