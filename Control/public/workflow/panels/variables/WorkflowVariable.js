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

import {WIDGET_VAR, VAR_TYPE} from './../../constants.js';
/**
 * Model representing a WorfklowVariable following gRPC model of VarSpecMessage
 */
export default class WorkflowVariable {

  /**
   * Given a VarSpecMessage JSON object, initialize the worfklow variable 
   * based on provided information and fill in for missing fields
   * @param {JSON} variable
   */
  constructor(variable) {
    this.other = {};
    this.widget = this.getWidgetTypeFromVariable(variable);
    this.type = this.getTypeFromVariable(variable);
    this.defaultValue = this.getDefaultValueFromVariable(variable);
    this.label = variable.label ? variable.label : 'Label Unknown';
    this.description = variable.description ? variable.description : 'none';
    this.panel = variable.panel ? variable.panel : 'mainPanel';
    this.allowedValues = variable.allowedValues ? variable.allowedValues : [];
    this.key = variable.key;
    this.index = variable.index ? variable.index : 0;
    this.isVisible = this.parseIsVisibleEval(variable);
  }

  /**
   * Set the type of the variable UI Widget
   * @param {JSON} variable 
   */
  getWidgetTypeFromVariable(variable) {
    switch (variable.widget) {
      case 0:
        return WIDGET_VAR.EDIT_BOX;
      case 1:
        return WIDGET_VAR.SLIDER;
      case 2:
        return WIDGET_VAR.LIST_BOX;
      case 3:
        return WIDGET_VAR.DROPDOWN_BOX;
      case 4:
        this.other.comboBox = {visible: false};
        return WIDGET_VAR.COMBO_BOX;
      case 5:
        return WIDGET_VAR.RADIO_BUTTON_BOX;
      case 6:
        return WIDGET_VAR.CHECKBOX_BOX;
      default:
        return WIDGET_VAR.EDIT_BOX;
    }
  }

  /**
   * Set the type of the variable UI Widget
   * @param {JSON} variable 
  */
  getTypeFromVariable(variable) {
    switch (variable.type) {
      case 0:
        return VAR_TYPE.STRING;
      case 1:
        return VAR_TYPE.NUMBER;
      case 2:
        return VAR_TYPE.BOOL;
      case 3:
        return VAR_TYPE.ARRAY;
      case 4:
        return VAR_TYPE.JSON;
      default:
        return VAR_TYPE.STRING;
    }
  }

  /**
   * Set the default value of the variable UI Widget
   * @param {JSON} variable 
   * @returns 
   */
  getDefaultValueFromVariable(variable) {
    if (variable.defaultValue) {
      return variable.defaultValue;
    } else {
      switch (variable.type) {
        case 0:
          return '';
        case 1:
          return 0;
        case 2:
          return false;
        case 3:
          return [];
        case 4:
          return {};
        default:
          return '';
      }
    }
  }

  /**
   * Add the prefix to each variable within the `visibleIf` field
   * to match the form within the GUI
   * Currently prefixed with `workflow.form.basicVariables.`
   * At run time, the function will be evaluated to decide if variable
   * should be displayed or not
   * @param {JSON} variable
   * @return {String}
   */
  parseIsVisibleEval(variable) {
    if (variable.visibleIf) {
      return variable.visibleIf.split('$$').join('workflow.form.basicVariables.');
    } else {
      return true;
    }
  }
}
