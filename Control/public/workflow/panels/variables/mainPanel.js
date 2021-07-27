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
import {autoBuiltBox} from './components.js';

/**
 * Builds a custom set of panels build based on the user's selection of template
 * to configure the workflow
 * The panels are build based on the AliECS Core information sent via varSpecMap
 * @param {Object} workflow
 * @return {vnode}
 */
export default (workflow) =>
  h('.w-100.flex-row', {style: 'flex-wrap: wrap'},
    Object.keys(workflow.groupedPanels)
      .map((panelName) =>
        h('.w-50', autoBuiltPanel(workflow, workflow.groupedPanels[panelName], panelName))
      )
  );

/**
 * Generate a panel based on the configuration provided in the Control Workflows
 * Each panel contains a set of variables which are to be displayed or not based on the
 * `visibleIf` JS condition. 
 * If the panel contains no visible variables, than it will not be displayed
 * @param {Workflow} workflow
 * @param {Array<JSON>} variables - that should be part of the panel
 * @param {String} name - of the panel
 * @returns 
 */
const autoBuiltPanel = (workflow, variables, name) => {
  const isPanelVisible = variables.some((variable) => {
    try {
      return eval(variable.isVisible);
    } catch (error) {
      return false;
    }
  });
  return isPanelVisible &&
    h('.w-100', [
      h('h5.bg-gray-light.p2.panel-title.w-100.flex-row',
        h('.w-100', name.replace(/([a-z](?=[A-Z]))/g, '$1 '))
      ),
      h('.p2.panel', [
        variables.filter((variable) => {
          try {
            return eval(variable.isVisible);
          } catch (error) {
            console.error(error);
            return false;
          }
        }).map((variable) => autoBuiltBox(variable, workflow.model))
      ])
    ]);
};
