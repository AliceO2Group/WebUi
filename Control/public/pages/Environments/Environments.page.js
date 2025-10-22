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
import {buttonToAcknowledgeDeployment} from './components/buttonToAcknowledgeDeployment.js';
import {detectorHeader} from '../../common/detectorHeader.js';
import {environmentReadinessStatus} from '../../common/environment/environmentReadinessStatus.js';
import {EnvironmentState} from '../../common/enums/EnvironmentState.enum.js';
import {informationRedirectActionPanel} from '../../common/environment/informationRedirectActionPanel.js';
import {isGlobalRun} from '../../utilities/isGlobalRun.js';
import {parseObject, parseOdcStatusPerEnv} from '../../common/utils.js';
import errorPage from '../../common/errorPage.js';
import pageLoading from '../../common/pageLoading.js';

/**
 * @file Page to show a list of environments (content and header)
 */

/**
 * Header of page showing list of environments
 * With one button to create a new environment and page title
 * @return {vnode}
 */
export const EnvironmentsPageHeader = () => [
  h('.w-100 text-center', [
    h('h4', 'Environments')
  ]),
];

/**
 * Scrollable list of environments or page loading/error otherwise
 * @param {Object} model
 * @return {vnode}
 */
export const EnvironmentsPageContent = (model) => {
  const { environment: environmentModel } = model
  const { list: environmentsRemoteData } = environmentModel;

  return h('.scroll-y.absolute-fill.text-center', [
    detectorHeader(model),
    environmentsRemoteData.match({
      NotAsked: () => null,
      Loading: () => pageLoading(),
      Success: ({ environments }) => environmentsTablesVerticalComponent(environments, model),
      Failure: (error) => errorPage(error),
    }),
  ]);
};

/**
 * Component to render the environments tables as active and deployments(ongoing or failed)
 * @param {Array<EnvironmentInfo>} environments - Map of environment objects
 * @param {Model} model - Root model of the application
 * @returns {vnode} - Component with environments tables
 */
const environmentsTablesVerticalComponent = (environments, model) => {
  if (environments.length === 0) {
    return h('h3.m4', ['No environments found.']);
  }
  const [activeEnvironments, failedDeployments] = environments.reduce(
    /**
     * @param {Array} environments - List of active environments to be built
     * @param {Array} failedDeployments - List of deployments to be built
     * @param {EnvironmentInfo} environment - Environment object to be processed
     * @returns {Array} - Tuple with active environments and failed deployments
     */
    ([environments, failedDeployments], environment) => {
      if (!environment.deploymentError) {
        environments.push(environment);
      } else {
        failedDeployments.push(environment);
      }
      return [environments, failedDeployments];
    },
    [[], []]
  );
  return [
    h('.scroll-auto', environmentsTable(activeEnvironments, model)),
    failedDeployments.length > 0 && h('.scroll-auto', deploymentsTable(failedDeployments, model))
  ];
}

/**
 * Renders table of deployments based on cached backend information
 * @param {Array<EnvironmentInfo>} deployments - list of ongoing or failed deployments
 * @param {Model} model - Root model of the application
 * @return {vnode} - Component with table of deployments
 */
const deploymentsTable = (deployments, model) => {
  const tableHeaders = ['ID', 'Detectors', 'Created by', 'Created', 'Message', 'Action'];

  return h('table.table', [
    h('thead', [
      h('tr.white.bg-danger', h('th', { colspan: tableHeaders.length }, 'Failed Deployments')),
      h('tr', [tableHeaders.map((header) =>
        h('th', { style: 'text-align: center;' }, header)
      )])
    ]),
    h('tbody', [
      deployments.map((environment) => {
        const { environment: { removeEnvironmentRequest } } = model;
        const { deploymentError, id, includedDetectors, userVars, createdWhen } = environment;
        return h('tr', { style: { background: deploymentError ? 'rgba(214, 38, 49, 0.2)' : '' } }, [
          h('td', {style: 'text-align: center;'},
            h('a', {
              href: `?page=environment&id=${id}`,
              onclick: (e) => model.router.handleLinkEvent(e),
            }, id
            )
          ),
          h('td', { style: 'text-align: center;' },
            includedDetectors?.length > 0 ? includedDetectors.sort().join(' ') : '-'
          ),
          h('td', { style: 'text-align: center;' }, getUserFromUserVars(userVars)?.name || '-'),
          h('td', { style: 'text-align: center;' }, parseObject(createdWhen, 'createdWhen')),
          h('td.f6', { style: 'text-align: center;' }, deploymentError ?? '-'),
          h(
            'td',
            { style: 'text-align: center;' },
            buttonToAcknowledgeDeployment(
              id,
              getUserFromUserVars(userVars),
              removeEnvironmentRequest.bind(model.environment)
            )
          )
        ])
      })
    ])
  ]);
};

/**
 * Component to create the table of active environments
 * @param {Array<EnvironmentInfo>} environments - List of environments as retrieved from backend
 * @param {Model} model - Root model of the application
 * @return {vnode}
 */
const environmentsTable = (environments, model) => {
  const tableHeaders = [
    'Run', 'State', 'ID', 'Detectors', 'Run Type', 'Created', 'Started', 'Ended', 'FLPs', 'EPNs', 'DCS', 'TRG',
    'CTP Readout', 'ODC', 'InfoLogger'
  ];

  return h('table.table', [
    h('thead', [
      h('tr.table-primary', h('th', {colspan: tableHeaders.length}, 'Active Environments')),
      h('tr', [tableHeaders.map((header) => h('th', {style: 'text-align: center;'}, header))])
    ]),
    h('tbody', [
      environments.map((item) => {
        const { state: odcState, styleClass: odcStyle } = parseOdcStatusPerEnv(item);
        const { userVars = {}, state = EnvironmentState.UNKNOWN, id, includedDetectors = []} = item;
        return h('tr', {
          class: isGlobalRun(userVars ?? {}) ? 'bg-global-run' : ''
        }, [
          runColumn(item, model),
          h('td', {
            class: (state === EnvironmentState.RUNNING ?
              'success'
              : (state === EnvironmentState.CONFIGURED
                ? 'primary'
                : (state === EnvironmentState.ERROR ? 'danger' : '')
              )
            ),
            style: 'font-weight: bold; text-align: center;'
          }, state
          ),
          h('td', {style: 'text-align: center;'},
            h('a', {
              href: `?page=environment&id=${id}`,
              onclick: (e) => model.router.handleLinkEvent(e),
            }, id
            )
          ),
          h('td', {style: 'text-align: center;'}, [
            includedDetectors.length > 0 ?
              includedDetectors.sort().map((detector) => `${detector} `)
              : '-'
          ]),
          h('td', {style: 'text-align: center;'}, userVars?.run_type ?? '-'),
          h('td', {style: 'text-align: center;'}, userVars && parseObject(item, 'createdWhen')),
          h('td', { style: 'text-align: center;' },
            userVars && parseObject(userVars, 'run_start_time_ms')
          ),
          h('td', { style: 'text-align: center;' },
            userVars && parseObject(userVars, 'run_end_time_ms')
          ),
          h('td', {style: 'text-align: center;'}, item.numberOfFlps ? item.numberOfFlps : '-'),
          h('td', {style: 'text-align: center;'}, userVars && parseObject(userVars, 'odc_n_epns')),
          h('td', {style: 'text-align: center;'}, userVars && parseObject(userVars, 'dcs_enabled')),
          h('td', {style: 'text-align: center;'}, userVars && parseObject(userVars, 'trg_enabled')),
          h('td', {style: 'text-align: center;'}, userVars && parseObject(userVars, 'ctp_readout_enabled')),
          h('td', {style: 'text-align: center;', class: odcStyle}, odcState),
          h('td', {style: 'text-align: center;'}, informationRedirectActionPanel(item, true))
        ]);
      }),
    ]),
  ]);
};

/**
 * Build a cell for displaying the state of a RUN based on conditions environment readiness
 * @param {EnvironmentDTO} item  - Environment object
 * @param {Object} model - Model object
 * @returns {vnode}
 */
const runColumn = (item, model) => {
  const {statusComponent, styleClasses} = environmentReadinessStatus(item, model);
  return h('td', {style: 'text-align: center;'},
    h('.badge.f4', { class: styleClasses }, statusComponent())
  );
}

/**
 * Extracts the user information from the userVars object
 * @param {Object} userVars - The userVars object containing user information
 */
const getUserFromUserVars = ({last_request_user} = {}) => {
  if (!last_request_user) {
    return null;
  }
  try {
    return JSON.parse(last_request_user);
  } catch (error) {
    return null;
  }
};
