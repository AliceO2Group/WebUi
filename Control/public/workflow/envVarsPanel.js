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

import {h, iconTrash, iconPlus, info} from '/js/src/index.js';

/**
 * Create a panel to allow users to pass in extra variables
 * for creating a new environment
 * @param {Object} workflow
 * @return {vnode}
 */
export default (workflow) =>
  h('.w-100.flex-column', [
    togglesPanel(workflow),
    envVarsPanel(workflow),
  ]);

/**
 * Panel which allows the user to select various options
 * that will automatically fill in (K;V) panel
 * @param {Object} workflow
 * @return {vnode}
 */
const togglesPanel = (workflow) =>
  h('', [
    h('h5.bg-gray-light.p2.panel-title.w-100.flex-row', h('.w-100', 'Basic Configuration')),
    h('.p2.panel', [
      triggerPanel(workflow),
      dataDistributionPanel(workflow),
      epnPanel(workflow),
      readoutPanel(workflow),
    ])
  ]);

/**
 * Panel for displaying options for the trigger
 * @param {Object} workflow
 * @return {vnode}
 */
const triggerPanel = (workflow) =>
  h('.flex-row.text-left.w-50', [
    h('.w-50', 'Trigger:'),
    h('.w-25.form-check', [
      h('input.form-check-input', {
        type: 'radio',
        name: 'trigger',
        id: 'triggerOff',
        checked: workflow.form.basicVariables['roc_ctp_emulator_enabled'] === 'false',
        onchange: () => workflow.form.basicVariables['roc_ctp_emulator_enabled'] = 'false'
      }),
      h('label', {for: 'triggerOff'}, 'OFF')
    ]),
    h('.w-25.form-check', [
      h('input.form-check-input disabled', {
        type: 'radio',
        name: 'trigger',
        id: 'triggerEmu',
        checked: workflow.form.basicVariables['roc_ctp_emulator_enabled'] === 'true',
        onchange: () => workflow.form.basicVariables['roc_ctp_emulator_enabled'] = 'true'
      }),
      h('label', {for: 'triggerEmu'}, 'EMU')
    ]),
  ]);

/**
 * Add a radio button group to select if data distribution should be set as on or off
 * If dd_enabled is set to false than odc_enabled should be set to false
 * @param {Object} workflow
 * @return {vnode}
 */
const dataDistributionPanel = (workflow) =>
  h('.flex-row.text-left.w-50', [
    h('.w-50', 'Data Distribution:'),
    h('.w-25.form-check', [
      h('input.form-check-input', {
        type: 'radio',
        name: 'dataDistribution',
        id: 'dataDistributionOff',
        checked: workflow.form.basicVariables['dd_enabled'] === 'false',
        onchange: () => {
          workflow.updateBasicVariableByKey('odc_enabled', 'false');
          workflow.updateBasicVariableByKey('dd_enabled', 'false');
        }
      }),
      h('label', {for: 'dataDistributionOff'}, 'OFF')
    ]),
    h('.w-25.form-check', [
      h('input.form-check-input disabled', {
        type: 'radio',
        name: 'dataDistribution',
        id: 'dataDistributionOn',
        checked: workflow.form.basicVariables['dd_enabled'] === 'true',
        onchange: () => workflow.form.basicVariables['dd_enabled'] = 'true'
      }),
      h('label', {for: 'dataDistributionOn'}, 'ON')
    ]),
  ]);

/**
 * Add a radio button group to select if EPN cluster should be set as on or off
 * If odc_enabled is set as true than dd_enabled should be set to true
 * @param {Object} workflow
 * @return {vnode}
 */
const epnPanel = (workflow) =>
  h('.flex-row.text-left.w-50', [
    h('.w-50', 'EPN:'),
    h('.w-25.form-check', [
      h('input.form-check-input', {
        type: 'radio',
        name: 'epn',
        id: 'epnOff',
        checked: workflow.form.basicVariables['odc_enabled'] === 'false',
        onchange: () => workflow.form.basicVariables['odc_enabled'] = 'false'
      }),
      h('label', {for: 'epnOff'}, 'OFF')
    ]),
    h('.w-25.form-check', [
      h('input.form-check-input disabled', {
        type: 'radio',
        name: 'epn',
        id: 'epnOn',
        checked: workflow.form.basicVariables['odc_enabled'] === 'true',
        onchange: () => {
          workflow.updateBasicVariableByKey('odc_enabled', 'true');
          workflow.updateBasicVariableByKey('dd_enabled', 'true');
        }
      }),
      h('label', {for: 'epnOn'}, 'ON')
    ]),
  ]);

/**
 * Add a text input field so that the user can fill in the readout_uri
 * @param {Object} workflow
 * @return {vnode}
 */
const readoutPanel = (workflow) =>
  h('.flex-row.text-left', [
    h('.w-25', {style: 'display: flex; align-items: center;'}, 'Readout URI:'),
    h('.w-75.flex-row', [
      h('', {style: 'width:30%'},
        h('select.form-control', {
          style: 'cursor: pointer',
          onchange: (e) => {
            workflow.form.basicVariables['readout_cfg_uri_pre'] = e.target.value;
          }
        }, [
          h('option', {id: 'fileOption', value: 'file://'}, 'file://'),
          h('option', {id: 'consulOption', value: 'consul://'}, 'consul://')
        ])
      ),
      h('input.form-control.mh1', {
        type: 'text',
        oninput: (e) => {
          if (!workflow.form.basicVariables['readout_cfg_uri_pre']) {
            workflow.form.basicVariables['readout_cfg_uri_pre'] = 'file://';
          }
          workflow.form.basicVariables['readout_cfg_uri'] = e.target.value;
        }
      })
    ])
  ]);

/**
 * Panel for adding (K;V) configurations for the environment
 * to be created
 * @param {Object} workflow
 * @return {vnode}
 */
const envVarsPanel = (workflow) =>
  h('', [
    h('h5.bg-gray-light.p2.panel-title.w-100.flex-row', [
      h('.w-100', 'Advanced Configuration'),
      h('a.ph1.actionable-icon', {
        href: 'https://github.com/AliceO2Group/ControlWorkflows',
        target: '_blank',
        title: 'Open Environment Variables Documentation'
      }, info())
    ]),
    addKVInputList(workflow),
    addKVInputPair(workflow)
  ]);

/**
* Method to add a list of KV pairs added by the user
* @param {Object} workflow
* @return {vnode}
*/
const addKVInputList = (workflow) =>
  h('.w-100.p2.panel', Object.keys(workflow.form.variables).map((key) =>
    h('.w-100.flex-row.pv2.border-bot', {
    }, [
      h('.w-33.ph1.text-left', key),
      h('.ph1', {
        style: 'width: 60%',
      }, h('input.form-control', {
        type: 'text',
        value: workflow.form.variables[key],
        onblur: () => workflow.trimVariableValue(key),
        oninput: (e) => workflow.updateVariableValueByKey(key, e.target.value)
      })),
      h('.ph2.danger.actionable-icon', {
        onclick: () => workflow.removeVariableByKey(key)
      }, iconTrash())
    ])
  ));
/**
* Add 2 input fields and a button for adding a new KV Pair
* @param {Object} workflow
* @return {vnode}
*/
const addKVInputPair = (workflow) => {
  let keyString = '';
  let valueString = '';
  return h('.form-group.p2.panel.w-100.flex-column', [
    h('.pv2.flex-row', [
      h('.w-33.ph1', {
      }, h('input.form-control', {
        type: 'text',
        placeholder: 'key',
        value: keyString,
        oninput: (e) => keyString = e.target.value
      })),
      h('.ph1', {
        style: 'width:60%;',
      }, h('input.form-control', {
        type: 'text',
        placeholder: 'value',
        value: valueString,
        oninput: (e) => valueString = e.target.value
      })),
      h('.ph2.actionable-icon', {
        title: 'Add (key,value) variable',
        onclick: () => workflow.addVariable(keyString, valueString)
      }, iconPlus())
    ]),
  ]);
};
