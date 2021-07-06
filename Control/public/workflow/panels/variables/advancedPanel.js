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
 * Panel for adding (K;V) configurations for the environment
 * to be created
 * @param {Object} workflow
 * @return {vnode}
 */
export default (workflow) =>
  h('.w-100.ph1', [
    h('.bg-gray-light.p2.panel-title.w-100.flex-row', [
      h('h5.w-100', 'Advanced Configuration'),
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
        id: 'keyInputField',
        placeholder: 'key',
        value: keyString,
        oncreate: ({dom}) => workflow.dom.keyInput = dom,
        oninput: (e) => keyString = e.target.value
      })),
      h('.ph1', {
        style: 'width:60%;',
      }, h('input.form-control', {
        type: 'text',
        placeholder: 'value',
        value: valueString,
        oninput: (e) => valueString = e.target.value,
        onkeyup: (e) => {
          if (e.keyCode === 13) {
            workflow.addVariable(keyString, valueString);
            workflow.dom.keyInput.focus();
          }
        }
      })),
      h('.ph2.actionable-icon', {
        title: 'Add (key,value) variable',
        onclick: () => {
          workflow.addVariable(keyString, valueString);
          workflow.dom.keyInput.focus();
        }
      }, iconPlus())
    ]),
  ]);
};
