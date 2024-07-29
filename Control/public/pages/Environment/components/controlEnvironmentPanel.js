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

import {infoLoggerButton} from './buttons.js';
import {ROLES} from '../../../workflow/constants.js';
import {isUserAllowedRole} from '../../../common/userRole.js';

/**
 * List of buttons for:
 * * controlling the currently displayed environment (in need of permissions to be operated)
 * * open ILG sessions with parameters preset
 * @param {EnvironmentModel} environmentModel - model of the environment class
 * @param {EnvironmentInfo} item - DTO representing an environment
 * @param {boolean} isAllowedToControl - value stipulating if user has enough permissions to control environment
 * @returns {vnode} - panel with actions allowed for the user to apply on the environment
 */
export const controlEnvironmentPanel = (environmentModel, item, isAllowedToControl = false) => {
  const {currentTransition, includedDetectors, state} = item;
  const {model} = environmentModel;
  const isSorAvailable =
    item.userVars?.['dcs_enabled'] === 'true' ?
      model.services.detectors.areDetectorsAvailable(includedDetectors, 'sorAvailability')
      :
      true;
  const isStable = !currentTransition;
  const isConfigured = state === 'CONFIGURED';
  return h('', [
    h('.flex-row', [
      h('', {
        style: 'flex-grow: 1;'
      }, h('.g2.flex-row',[
        infoLoggerButton(item, 'InfoLogger FLP', COG.ILG_URL),
        infoLoggerButton(item, 'InfoLogger EPN', COG.ILG_EPN_URL),
      ]),
      ),
      h('.flex-column.justify-center', {
        style: 'flex-grow: 3;'
      }, [
        h('.flex-column', [
          !isAllowedToControl &&
          h('span.warning.flex-end.flex-row.g1#missing_lock_ownership_to_control_message', [
            'You do not own the necessary ',
            h('a',{
              href: '?page=locks',
              onclick: (e) => model.router.handleLinkEvent(e),
            }, 'locks'),
            ' to control this environment.'
          ]),
          isStable && isConfigured && !isSorAvailable
          && h('.danger.flex-end.flex-row', 'SOR is unavailable for one or more of the included detectors.'),

        ]),
        isAllowedToControl && h('.flex-row.flex-end.g2', [
          controlButton(
            '.btn-success.w-25', environmentModel, item, 'START', 'START_ACTIVITY', 'CONFIGURED',
            Boolean(currentTransition)
          ),
          controlButton(
            '.btn-primary', environmentModel, item, 'CONFIGURE', 'CONFIGURE', '', Boolean(currentTransition)
          ), // button will not be displayed in any state due to OCTRL-628
          controlButton('', environmentModel, item, 'RESET', 'RESET', '', Boolean(currentTransition)), ' ',
          controlButton(
            '.btn-danger.w-25', environmentModel, item, 'STOP', 'STOP_ACTIVITY', 'RUNNING', Boolean(currentTransition)
          ),
          shutdownEnvButton(environmentModel, item, Boolean(currentTransition)),
          killEnvButton(environmentModel, item)
        ])
      ])
    ]),
    environmentModel.itemControl.match({
      NotAsked: () => null,
      Loading: () => null,
      Success: (_data) => null,
      Failure: ({message}) => h('p.danger.text-right', message),
    })
  ]);
};

/**
 * Makes a button to toggle severity
 * @param {string} buttonType
 * @param {Object} environment
 * @param {Object} item
 * @param {string} label - button's label
 * @param {string} type - action
 * @param {string} stateToHide - state in which button should not be displayed
 * @param {boolean} isInTransition - if environment is currently transitioning
 * @return {vnode}
 */
const controlButton = (buttonType, environment, item, label, type, stateToHide, isInTransition) => {
  let title = label;
  if (isInTransition) {
    title = 'Environment is currently transitioning, please wait';
  } else if (item.state !== stateToHide) {
    title = `'${label}' cannot be used in state '${item.state}'`;
  }

  return h(`button.btn${buttonType}`,
    {
      id: `buttonTo${label}`,
      class: environment.itemControl.isLoading() ? 'loading' : '',
      disabled: isInTransition || environment.itemControl.isLoading(),
      style: item.state !== stateToHide ? 'display: none;' : '',
      onclick: () => {
        confirm(`Are you sure you want to ${label} this ${item.state} environment?`)
          && environment.controlEnvironment(item.id, type, item.currentRunNumber);
      },
      title
    },
    label);
}

/**
 * Create a button to shutdown env
 * @param {Object} environment
 * @param {JSON} item
 * @param {boolean} isInTransition - if environment is currently transitioning
 * @return {vnode}
 */
const shutdownEnvButton = (environment, item, isInTransition) =>
  h(`button.btn.btn-danger`, {
    id: 'buttonToSHUTDOWN',
    class: environment.itemControl.isLoading() ? 'loading' : '',
    disabled: isInTransition || environment.itemControl.isLoading(),
    style: {display: (item.state === 'CONFIGURED' || item.state == 'DEPLOYED') ? '' : 'none'},
    onclick: () => confirm(`Are you sure you want to SHUTDOWN this ${item.state} environment?`)
      && environment.destroyEnvironment(item.id, item.currentRunNumber),
    title: isInTransition ? 'Environment is currently transitioning, please wait' : 'Shutdown environment'
  }, 'SHUTDOWN');

/**
 * Create a button to kill env
 * @param {Object} environment
 * @param {JSON} item
 * @return {vnode}
 */
const killEnvButton = (environment, item) =>
  h('.flex-column.dropdown#flp_selection_info_icon', {style: 'display: flex'}, [
    h(`button.btn.btn-danger active`, {
      id: 'buttonToFORCESHUTDOWN',
      class: environment.itemControl.isLoading() ? 'loading' : '',
      style: 'margin-left: .3em',
      disabled: environment.itemControl.isLoading() || !_isKillActionAllowed(item, environment.model),
      onclick: () => confirm(`Are you sure you want to KILL this ${item.state} environment?`)
        && environment.destroyEnvironment(item.id, item.currentRunNumber, true, true),
      title: 'Kill environment'
    }, 'KILL'),
    h('.p2.dropdown-menu-right#flp_selection_info.text-center', {style: 'width: 400px'}, [
      h('', `Environments can only be killed:`),
      h('', `- by the shifter if it is in ERROR state`),
      h('', `- by admins in any other state`)
    ])
  ]);

/**
 * Logic behind enabling the kill button of the environment. It can be used by:
 * * any user if environment is in ERROR state
 * * admins at any point
 */
function _isKillActionAllowed(item) {
  return item.state === 'ERROR' || isUserAllowedRole(ROLES.Admin);
}
