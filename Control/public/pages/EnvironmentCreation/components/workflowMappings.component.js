/**
 *  @license
 *  Copyright CERN and copyright holders of ALICE O2. This software is
 *  distributed under the terms of the GNU General Public License v3 (GPL
 *  Version 3), copied verbatim in the file "COPYING".
 *
 *  See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 *  In applying this license CERN does not waive the privileges and immunities
 *  granted to it by virtue of its status as an Intergovernmental Organization
 *  or submit itself to any jurisdiction.
 */

import {h} from '/js/src/index.js';

/**
 * Builds a component with a set of buttons to allow users to load pre-existing configurations that are ready to be deployed
 *
 * @param {RemoteData<Array<{label: String, configuration: String}>} mapping - list of KV pairs
 * @param {String} selected - name of the currently selected configuration name if any
 * @param {void} callbackSelection - action to be triggered once a user selects a configuration
 * @param {RemoteData<Object>} workflowLoaded - result of attempt to load workflow configuration
 * @param {void} setNumberOfEpns - action to update in the form the number of EPNs to use
 * @returns {vnode}
 */
export const workflowMappingsComponent = (mapping, selected = '', callbackSelection, workflowLoaded, setNumberOfEpns) =>
  h('.w-100.flex-column.pv2', [
    h('.flex-row.flex-wrap.g2.justify-center', mapping.match({
      NotAsked: () => null,
      Loading: () => 'Retrieving pre-saved configurations from AliECS...',
      Success: (list) =>
        list.length === 0
          ? errorMapping('No Configurations found, please use Advanced Configuration for environment creation')
          : h('.flex-row.flex-wrap.g1.w-100', [
            list.map(({label, configuration}) =>
              selectConfigurationButton(label, configuration === selected, configuration, callbackSelection)
            )]
          ),
      Failure: () => errorMapping('No saved configurations, use advanced creation')
    }),
    ),
    h('.flex-row.justify-center', workflowLoaded.match({
      NotAsked: () => null,
      Loading: () => `Retrieving configuration for ${selected}`,
      Success: ({variables}) => h('.flex-column.w-100.text-center', [
        h('.f6.success', `Successfully loaded: ${selected}`),
        variables['epn_enabled'] === 'true' && h('.flex-row.g2.items-center.justify-center', [
          h('', 'Number of EPNs: '),
          h('', h('input.form-control', {
            type: 'number',
            value: variables['odc_n_epns'],
            oninput: (e) => setNumberOfEpns(e.target.value)
          }))
        ]),
      ]),
      Failure: () => errorMapping(`Unable to retrieve configuration`)
    })
    )
  ]);

/**
 * Display a div element with an error message
 * @param {String} message - error message to display
 * @returns {vnode}
  */
const errorMapping = (message) => h('.danger', message);

/**
 * Button to allow the user to load one of the pre-existing configurations
 * @param {String} label - label of the button
 * @param {boolean} isSelected - if the current button was already selected by the user
 * @param {String} configuration - configuration selected to load
 * @param {void} callback - action to be triggered once button is clicked
 */
const selectConfigurationButton = (label, isSelected = true, configuration, callback) =>
  h('button.btn', {
    class: isSelected ? 'btn-primary active' : '',
    key: `${label}-configuration`,
    id: `${label}-configuration`,
    style: {width: '49%'},
    onclick: () => callback(configuration)
  }, label);
