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

/**
 * List of buttons, each one is an action to do on the current environment `item`
 * @param {Object} environment
 * @param {Environment} item - environment to show on this page
 * @return {vnode}
 */
export const controlEnvironmentPanel = (environment, item) => h('.mv2.pv3.ph2', [
  h('.flex-row', [
    h('.w-75',
      [
        controlButton('.btn-success', environment, item, 'START', 'START_ACTIVITY', 'CONFIGURED'), ' ',
        controlButton('.btn-danger', environment, item, 'STOP', 'STOP_ACTIVITY', 'RUNNING'), ' ',
        controlButton('.btn-warning', environment, item, 'CONFIGURE', 'CONFIGURE', 'STANDBY'), ' ',
        controlButton('', environment, item, 'RESET', 'RESET', 'CONFIGURED'), ' '
      ]
    ),
    h('.w-25', {
      style: 'display: flex; justify-content: flex-end;'
    }, [
      destroyEnvButton(environment, item),
      destroyEnvButton(environment, item, true)
    ])
  ]),
  environment.itemControl.match({
    NotAsked: () => null,
    Loading: () => null,
    Success: (_data) => null,
    Failure: (error) => h('p.danger', error),
  })
]);

/**
 * Makes a button to toggle severity
 * @param {string} buttonType
 * @param {Object} environment
 * @param {Object} item
 * @param {string} label - button's label
 * @param {string} type - action
 * @param {string} stateToHide - state in which button should not be displayed
 * @return {vnode}
 */
const controlButton = (buttonType, environment, item, label, type, stateToHide) =>
  h(`button.btn${buttonType}`,
    {
      class: environment.itemControl.isLoading() ? 'loading' : '',
      disabled: environment.itemControl.isLoading(),
      style: item.state !== stateToHide ? 'display: none;' : '',
      onclick: () => {
        environment.controlEnvironment({id: item.id, type: type});
      },
      title: item.state !== stateToHide ? `'${label}' cannot be used in state '${item.state}'` : label
    },
    label
  );

/**
 * Create a button which will call the ShutDown&DestroyEnv GRPC Method
 * @param {Object} environment
 * @param {JSON} item
 * @param {bool} forceDestroy
 * @return {vnode}
 */
const destroyEnvButton = (environment, item, forceDestroy = false) =>
  h(`button.btn.btn-danger`, {
    id: forceDestroy ? 'buttonForceShutdown' : 'buttonShutdown',
    class: environment.itemControl.isLoading() ? 'loading' : '',
    disabled: environment.itemControl.isLoading(),
    style: {display: !forceDestroy ? 'none' : ''},
    onclick: () => confirm(`Are you sure you want to to shutdown this ${item.state} environment?`)
      && environment.destroyEnvironment({id: item.id, allowInRunningState: true, force: forceDestroy}),
    title: forceDestroy ? 'Force the shutdown of the environment' : 'Shutdown environment'
  }, forceDestroy ? 'Force Shutdown' : 'Shutdown');
