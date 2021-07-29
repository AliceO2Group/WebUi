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
    case WIDGET_VAR.CHECKBOX_BOX:
      return checkBox(variable, model);
  }
};

/**
 * Builds a component of type EDIT_BOX to be used within the Variables Panel
 * The type will be number / text based on the passed variable's type and will
 * allow the user to input their own values
 * @param {WorkflowVariable} variable
 * @param {Object} model
 * @returns {vnode}
 */
const editBox = (variable, model) =>
  h('.flex-row.pv1', [
    variableLabel(variable),
    h('.w-50',
      h('input.form-control', {
        type: variable.type === VAR_TYPE.NUMBER ? 'number' : 'text',
        value: model.workflow.form.basicVariables[variable.key] !== undefined ?
          model.workflow.form.basicVariables[variable.key] : variable.defaultValue,
        oninput: (e) => model.workflow.updateBasicVariableByKey(variable.key, e.target.value),
      })
    ),
  ]);

/**
 * Builds a component of type SLIDER to be used within the Variables Panel
 * The range of the slider will be defined by the first 2 values within the `allowedValues` field
 * If the 2 values are missing or they are not a number, a simple EDIT_BOX will be generated instead
 * @param {WorkflowVariable} variable
 * @param {Object} model
 * @returns {vnode}
 */
const sliderBox = (variable, model) => {
  try {
    const min = parseInt(variable.allowedValues[0]);
    const max = parseInt(variable.allowedValues[1]);
    if (isNaN(min) || isNaN(max)) {
      throw new Error('Range values not a number')
    }
    return h('.flex-row.pv1', [
      variableLabel(variable),
      h('', {class: 'w-50 flex-row'},
        h('.w-10.flex-row.items-center',
          model.workflow.form.basicVariables[variable.key] ?
            model.workflow.form.basicVariables[variable.key] : variable.defaultValue),
        h('.w-90',
          h('input.form-control', {
            type: 'range',
            min: min,
            max: max,
            value: model.workflow.form.basicVariables[variable.key] ?
              model.workflow.form.basicVariables[variable.key] : variable.defaultValue,
            oninput: (e) => model.workflow.updateBasicVariableByKey(variable.key, e.target.value),
          })
        )
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
    variableLabel(variable),
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
 * If `allowedValues` does not contain any elements, an EDIT_BOX will be built instead
 * @param {WorkflowVariable} variable
 * @param {Object} model
 * @returns {vnode}
 */
const listBox = (variable, model) => {
  if (!variable.allowedValues || variable.allowedValues.length === 0) {
    return editBox(variable, model);
  } {
    const type = variable.type;
    const list = variable.allowedValues;
    return h('.flex-row.pv1', [
      variableLabel(variable),
      h('.w-50.text-left.shadow-level1.scroll-y', {style: 'max-height: 10em;'}, [
        list.map((name) =>
          h('a.menu-item', {
            className: (type === VAR_TYPE.STRING || type === VAR_TYPE.NUMBER) ?
              (model.workflow.form.basicVariables[variable.key] === name ? 'selected' : null)
              : ((model.workflow.form.basicVariables[variable.key] &&
                model.workflow.form.basicVariables[variable.key].includes(name)) ? 'selected' : null),
            onclick: () => {
              if (type === VAR_TYPE.STRING || type === VAR_TYPE.NUMBER) {
                model.workflow.updateBasicVariableByKey(variable.key, name);
              } else if (type === VAR_TYPE.ARRAY) {
                if (!model.workflow.form.basicVariables[variable.key]) {
                  model.workflow.updateBasicVariableByKey(variable.key, [name]);
                } else {
                  const index = model.workflow.form.basicVariables[variable.key].indexOf(name);
                  if (index >= 0) {
                    model.workflow.form.basicVariables[variable.key].splice(index, 1);
                  } else {
                    model.workflow.form.basicVariables[variable.key].push(name);
                  }
                }
              }
              model.workflow.notify();
            }
          }, name)
        ),
      ])
    ]);
  }
};

/**
 * Builds a component of type COMBO_BOX to be used within the Variables Panel
 * Similar to Revision input search + dropdown list
 * The user will be able to input their own text and it is not mandatory to select from the list
 * @param {WorkflowVariable} variable
 * @param {Object} model
 * @returns {vnode}
*/
const comboBox = (variable, model) => {
  if (!variable.allowedValues || variable.allowedValues.length === 0) {
    return editBox(variable, model);
  } else {
    const workflow = model.workflow;
    return h('.flex-row.pv1', [
      variableLabel(variable),
      h('.w-50.dropdown', {
        style: 'flex-grow: 1;',
        class: variable.other.comboBox.visible ? 'dropdown-open' : ''
      }, [
        h('input.form-control', {
          type: 'text',
          style: 'z-index:100',
          value: workflow.form.basicVariables[variable.key] !== undefined
            ? workflow.form.basicVariables[variable.key] : variable.defaultValue,
          oninput: (e) => model.workflow.updateBasicVariableByKey(variable.key, e.target.value),
          onblur: () => {
            variable.other.comboBox.visible = false;
            workflow.notify();
          },
          onkeyup: (e) => {
            if (e.keyCode === 27) { // code for escape
              variable.other.comboBox.visible = false;
            } else if (e.keyCode === 13) { // code for enter
              model.workflow.updateBasicVariableByKey(variable.key, e.target.value);
              variable.other.comboBox.visible = false;
              e.target.blur()
            }
            workflow.notify();
          },
          onclick: () => {
            variable.other.comboBox.visible = true;
            workflow.notify();
          }
        }),
        // dropdown area with users-options
        h('.dropdown-menu.w-100.scroll-y', {style: 'max-height: 15em;'}, [
          // add typed text by the user to the list of options as well to suggest selection
          workflow.form.basicVariables[variable.key]
          && !variable.allowedValues.includes(workflow.form.basicVariables[variable.key])
          && h('a.menu-item.w-wrapped', {
            class: 'selected',
          }, workflow.form.basicVariables[variable.key]),
          variable.allowedValues
            .filter((value) => {
              if (workflow.form.basicVariables[variable.key] === variable.defaultValue) {
                return true;
              }
              if (workflow.form.basicVariables[variable.key]) {
                return value.match(workflow.form.basicVariables[variable.key])
              } else {
                return true;
              }
            })
            .map((value) =>
              h('a.menu-item.w-wrapped', {
                class: workflow.form.basicVariables[variable.key] === value ? 'selected' : '',
                onmousedown: () => {
                  workflow.updateBasicVariableByKey(variable.key, value);
                },
              }, value)
            ),
        ])
      ]),
    ]);
  }
}

/**
 * Build a panel containing multiple radio buttons with single selection allowed
 * @param {WorkflowVariable} variable
 * @param {Object} model
 * @returns 
 */
const radioButtonBox = (variable, model) =>
  h('.flex-row.pv1', [
    variableLabel(variable),
    h('.w-50.flex-row.flex-wrap.text-left', [
      variable.allowedValues.map((value) =>
        h('.w-33.form-check', [
          h('input.form-check-input', {
            type: 'radio',
            name: `${value}`,
            id: `${value}id`,
            checked: model.workflow.form.basicVariables[variable.key] === value,
            onchange: () => model.workflow.updateBasicVariableByKey(variable.key, value),
          }),
          h('label.w-wrapped', {for: `${value}id`, title: value, style: 'cursor: pointer'}, value)
        ])
      )
    ])
  ]);

/**
 * Build a panel containing a single checkbox
 * To be used for true/false selections
 * Clicking on the label will change the value of the checkbox as well
 * @param {WorkflowVariable} variable
 * @param {Object} model
 * @returns 
 */
const checkBox = (variable, model) => {
  const value = model.workflow.form.basicVariables[variable.key] ?
    model.workflow.form.basicVariables[variable.key] : variable.default;
  return h('.flex-row.pv1', [
    variableLabel(variable,
      () => model.workflow.updateBasicVariableByKey(variable.key, value === 'true' ? 'false' : 'true')
    ),
    h('.w-50.flex-row.flex-wrap.text-left', [
      h('.form-check', [
        h('input.form-check-input', {
          type: 'checkbox',
          name: `${variable.id}`,
          id: `${variable.id}Id`,
          checked: value === 'true',
          value: value,
          onchange: () => model.workflow.updateBasicVariableByKey(variable.key, value === 'true' ? 'false' : 'true'),
        }),
        h('label', {
          style: 'cursor: pointer',
          onclick: () => model.workflow.updateBasicVariableByKey(variable.key, value === 'true' ? 'false' : 'true'),
        }, value === 'true' ? 'ON' : 'OFF')]
      )
    ])
  ]);
}

/**
 * Builds a label block which will display the variable description (if present) on hover
 * @param {WorfklowVariable} variable 
 * @returns {vnode}
 */
const variableLabel = (variable, action = undefined) => {
  const style = {
    style: `cursor: ${action ? 'pointer' : (variable.description ? 'help' : '')}`,
    onclick: action,
  };
  return variable.description !== '' ?
    h('.w-50.flex-column.dropdown', [
      h('label#workflow-variable-info-label', style, variable.label),
      h('.p2.dropdown-menu-right.gray-darker#workflow-variable-info', variable.description)
    ])
    :
    h('label.w-50', style, variable.label);
};

export {autoBuiltBox};
