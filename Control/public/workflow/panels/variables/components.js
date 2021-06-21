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
import {WIDGET_TYPE} from './../../constants.js';

/**
 * Build a variable component based on the information provided 
 * @param {WorkflowVariable} variable 
 * @param {Object} model 
 * @return {vnode}
 */
const autoBuiltBox = (variable, model) => {
  switch (variable.widget) {
    case WIDGET_TYPE.EDIT_BOX:
      return editBox(variable, model);
    case WIDGET_TYPE.SLIDER:
      return sliderBox(variable, model);
    case WIDGET_TYPE.LIST_BOX:
      return listBox(variable, model);
    case WIDGET_TYPE.DROPDOWN_BOX:
      return dropdownBox(variable, model);
    case WIDGET_TYPE.COMBO_BOX:
      return comboBox(variable, model);
  }
};

/**
 * Builds a component of type EDIT_BOX to be used within the Variables Panel 
 * @param {WorkflowVariable} variable
 * @param {Object} model
 * @returns {vnode}
 */
const editBox = (variable, model) =>
  h('', [
    h('label', variable.label),
    h('input', {
      type: 'text',
      // value: variable.defaultValue,
      placeholder: variable.defaultValue,
      onchange: (e) => console.log(e.target.value)
    })
  ]);

/**
 * Builds a component of type SLIDER to be used within the Variables Panel 
 * @param {WorkflowVariable} variable
 * @param {Object} model
 * @returns {vnode}
 */
const sliderBox = (variable, model) =>
  h('', [
    h('label', variable.label),
    h('input.form-control', {
      type: 'number',
      min: variable.allowedValues[0],
      max: variable.allowedValues[1],
      onchange: (e) => console.log(e.target.value),
    }, 'field_some')
  ]);

/**
 * Builds a component of type LIST_BOX to be used within the Variables Panel 
 * @param {WorkflowVariable} variable
 * @param {Object} model
 * @returns {vnode}
 */
const listBox = (variable, model) =>
  h('', 'I am an list box');

/**
* Builds a component of type DROPDOWN_BOX to be used within the Variables Panel 
* @param {WorkflowVariable} variable
* @param {Object} model
* @returns {vnode}
*/
const dropdownBox = (variable, model) =>
  h('', 'I am an dropdown box');

/**
* Builds a component of type COMBO_BOX to be used within the Variables Panel 
* @param {WorkflowVariable} variable
* @param {Object} model
* @returns {vnode}
*/
const comboBox = (variable, model) =>
  h('', 'I am an combo box');


module.exports = {autoBuiltBox, editBox, sliderBox, listBox, dropdownBox, comboBox};
