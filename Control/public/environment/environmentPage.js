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
import {monitoringRunningPlotsPanel} from './components/monitoringRunningPlotsPanel.js';
import pageLoading from '../common/pageLoading.js';
import errorPage from '../common/errorPage.js';
import {environmentHeader} from './components/environmentHeader.js';

/**
 * @file Page to show one environment with full details (content and header)
 */

/**
 * Header of the environment details page showing one environment
 * @return {vnode}
 */
export const header = () => h('h4.flex-grow.text-center', 'Environment details');

/**
 * Content of the environment details page showing one environment based on the state of the request
 * @param {Model} model - root model of the application
 * @return {vnode}
 */
export const content = (model) => h('.scroll-y.absolute-fill', [
  model.environment.item.match({
    NotAsked: () => null,
    Loading: () => h('.w-100.text-center', pageLoading()),
    Success: (data) => showEnvironmentPage(model, data),
    Failure: (error) => errorPage(error),
  })
]);

/**
 * Show all properties of environment and buttons for its actions at bottom
 * @param {Model} model - root model of the application
 * @param {EnvironmentInfo} environmentInfo - object with information of the environment
 * @return {vnode}
 */
const showEnvironmentPage = (model, environmentInfo) => {
  const {state, currentTransition = undefined} = environmentInfo;
  const isStable = !currentTransition;
  const isRunning = state === 'RUNNING';

  return h('.w-100.m2.flex-column', [
    environmentHeader(environmentInfo),
    environmentActionPanel(model, environmentInfo),
    isRunning && isStable && monitoringRunningPlotsPanel(environmentInfo),
    environmentNavigationTabs(model, environmentInfo),
  ]);
};
