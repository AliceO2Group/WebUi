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
import {VAR_TYPE, WIDGET_VAR} from './../../constants.js';

/**
 * Build a variable component based on the information provided 
 * @param {WorkflowVariable} variable 
 * @param {Object} model 
 * @return {vnode}
 */
const autoBuiltBox = (variable, model) => {
  switch (variable.widget) {
    case WIDGET_VAR.EDIT_BOX:
      return editBox(variable, model);
    case WIDGET_VAR.SLIDER:
      return sliderBox(variable, model);
    case WIDGET_VAR.LIST_BOX:
      return listBox(variable, model);
    case WIDGET_VAR.DROPDOWN_BOX:
      return dropdownBox(variable, model);
    case WIDGET_VAR.COMBO_BOX:
      return comboBox(variable, model);
    case WIDGET_VAR.RADIO_BUTTON_BOX:
      return radioButtonBox(variable, model);
    case WIDGET_VAR.CHECKS_BOX:
      return checkBox(variable, model);
  }
};

/**
 * Builds a component of type EDIT_BOX to be used within the Variables Panel 
 * @param {WorkflowVariable} variable
 * @param {Object} model
 * @returns {vnode}
 */
const editBox = (variable, model) =>
  h('.flex-row.pv1', [
    h('label.w-50', variable.label),
    h('.w-50',
      h('input.form-control', {
        type: variable.type === VAR_TYPE.NUMBER ? 'number' : 'text',
        value: model.workflow.form.basicVariables[variable.key] ?
          model.workflow.form.basicVariables[variable.key] : variable.defaultValue,
        onchange: (e) => model.workflow.updateBasicVariableByKey(variable.key, e.target.value),
      })
    ),
  ]);


/**
 * Builds a component of type SLIDER to be used within the Variables Panel
 * The range of the slider will be defined by the first 2 values within the `allowedValues` field
 * If the 2 values are missing or they are not a number, a simple edit box will be generated instead
 * @param {WorkflowVariable} variable
 * @param {Object} model
 * @returns {vnode}
 */
const sliderBox = (variable, model) => {
  try {
    const min = parseInt(variable.allowedValues[0]);
    const max = parseInt(variable.allowedValues[1]);

    return h('.flex-row.pv1', [
      h('label.w-50', variable.label),
      h('.w-50',
        h('input.form-control', {
          type: 'range',
          min: min,
          max: max,
          value: model.workflow.form.basicVariables[variable.key] ?
            model.workflow.form.basicVariables[variable.key] : variable.defaultValue,
          onchange: (e) => model.workflow.updateBasicVariableByKey(variable.key, e.target.value),
        })
      )
    ]);
  } catch (error) {
    return editBox(variable, model);
  }

};

/**
* Builds a component of type DROPDOWN_BOX to be used within the Variables Panel
* Provides a single selection list of elements for the user to choose
* @param {WorkflowVariable} variable
* @param {Object} model
* @returns {vnode}
*/
const dropdownBox = (variable, model) =>
  h('.flex-row.pv1', [
    h('label.w-50', variable.label),
    h('.w-50',
      h('select.form-control', {
        style: 'cursor: pointer',
        onchange: (e) => model.workflow.updateBasicVariableByKey(variable.key, e.target.value),
      }, [
        variable.allowedValues.map((value) =>
          h('option', {
            style: 'cursor: pointer',
            selected: model.workflow.form.basicVariables[variable.key] === value
          }, value))
      ])
    ),
  ]);

/**
 * Builds a component of type LIST_BOX to be used within the Variables Panel
 * If AliECS specifies type:
 * * string - single selection (e.g. worfklow template panel) and returns a single value
 * * number - single selection (e.g. worfklow template panel) and returns a single value
 * * list - multiple selection and send to AliECS a JSON formatted list (e.g. FLP selection panel)
 * @param {WorkflowVariable} variable
 * @param {Object} model
 * @returns {vnode}
 */
const listBox = (variable, model) => {
  // TODO if string/number create a dropdownbox
  h('', 'I am a list box');
};

/**
* Builds a component of type COMBO_BOX to be used within the Variables Panel
* Similar to Revision input search + dropdown list
* The user will be able to input their own text and it is not mandatory to select from the list
* @param {WorkflowVariable} variable
* @param {Object} model
* @returns {vnode}
*/
const comboBox = (variable, model) =>
  h('', 'I am a combo box');

/**

*/
const radioButtonBox = (variable, model) =>
  h('.flex-row.pv1', [
    h('label.w-50', variable.label),
    h('.w-50.flex-row.flex-wrap.text-left', [
      variable.allowedValues.map((value) => {
        return h('.w-33.form-check', [
          h('input.form-check-input', {
            type: 'radio',
            name: `${value}`,
            id: `${value}id`,
            checked: model.workflow.form.basicVariables[variable.key] === value,
            onchange: () => model.workflow.updateBasicVariableByKey(variable.key, value),
          }),
          h('label.w-wrapped', {for: `${value}id`, title: value, style: 'cursor: pointer'}, value)
        ]);
      })
    ])
  ]);

/**

*/
const checkBox = (variable, model) =>
  h('', 'I am a combo box');

export {autoBuiltBox};
