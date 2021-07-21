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
    this.setWidgetType(variable);
    this.setVarType(variable);
    this.setDefaultValue(variable);
    this.label = variable.label ? variable.label : 'Label Unknown';
    this.description = variable.description ? variable.description : 'none';
    this.panel = variable.panel ? variable.panel : 'mainPanel';
    this.allowedValues = variable.allowedValues ? variable.allowedValues : [];
    this.key = variable.key;
  }

  /**
   * Set the type of the variable UI Widget
   * @param {JSON} variable 
   */
  setWidgetType(variable) {
    switch (variable.uiWidgetHint) {
      case 0:
        this.widget = WIDGET_VAR.EDIT_BOX;
        return;
      case 1:
        this.widget = WIDGET_VAR.SLIDER;
        break;
      case 2:
        this.widget = WIDGET_VAR.LIST_BOX;
        break;
      case 3:
        this.widget = WIDGET_VAR.DROPDOWN_BOX;
        break;
      case 4:
        this.widget = WIDGET_VAR.COMBO_BOX;
        break;
      default:
        this.widget = WIDGET_VAR.EDIT_BOX;
        break;
    }
  }

  /**
   * Set the type of the variable UI Widget
   * @param {JSON} variable 
  */
  setVarType(variable) {
    switch (variable.type) {
      case 0:
        this.varType = VAR_TYPE.STRING;
        return;
      case 1:
        this.varType = VAR_TYPE.NUMBER;
        break;
      case 2:
        this.varType = VAR_TYPE.BOOL;
        break;
      case 3:
        this.varType = VAR_TYPE.ARRAY;
        break;
      case 4:
        this.varType = VAR_TYPE.JSON;
        break;
      default:
        this.varType = VAR_TYPE.STRING;
        break;
    }
  }

  /**
   * Set the default value of the variable UI Widget
   * @param {JSON} variable 
   * @returns 
   */
  setDefaultValue(variable) {
    if (variable.defaultValue) {
      this.defaultValue = variable.defaultValue;
    } else {
      switch (variable.type) {
        case 0:
          this.defaultValue = '';
          return;
        case 1:
          this.defaultValue = 0;
          break;
        case 2:
          this.defaultValue = false;
          break;
        case 3:
          this.defaultValue = [];
          break;
        case 4:
          this.defaultValue = {};
          break;
        default:
          this.defaultValue = '';
          break;
      }
    }
  }
}