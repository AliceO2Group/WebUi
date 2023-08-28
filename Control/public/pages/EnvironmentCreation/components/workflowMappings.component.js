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
 * @returns {vnode}
 */
export const workflowMappingsComponent = (mapping, selected = '', callbackSelection, workflowLoaded) =>
  h('.w-100.flex-column.pv2', [
    h('.flex-row.flex-wrap.g2.justify-center', mapping.match({
      NotAsked: () => null,
      Loading: () => 'Retrieving pre-saved configurations from AliECS...',
      Success: (list) =>
        list.length === 0
          ? errorMapping('No Configurations found, please use Advanced Configuration for environment creation')
          : list.map(({label, configuration}) =>
            selectConfiguration(label, label === selected, configuration, callbackSelection)
          ),
      Failure: () => errorMapping('Unable to retrieve list of pre-saved configuration from AliECS')
    }),
    ),
    h('.flex-row.justify-center', workflowLoaded.match({
      NotAsked: () => null,
      Loading: () => `Retrieving configuration for ${selected}`,
      Success: () => h('', `Successfully loaded configuration for ${selected}`),
      Failure: (error) => errorMapping(`Unable to retrieve configuration for ${selected} due to ${error}`)
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
const selectConfiguration = (label, isSelected = true, configuration, callback) =>
  h('button.btn', {
    class: isSelected ? 'active' : '',
    key: `${label}-configuration`,
    id: `${label}-configuration`,
    onclick: () => callback(configuration)
  }, label);
