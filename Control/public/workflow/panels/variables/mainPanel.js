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
 * Custom set of panels build based on the user's selection of template
 * to configure the workflow
 * @param {Object} workflow
 * @return {vnode}
 */
export default (workflow) => {
  return h('.w-100.flex-row', {
    style: 'flex-wrap: wrap'
  }, Object.keys(workflow.groupedPanels)
    .map((panelName) => h('.w-50', panel(workflow, workflow.groupedPanels[panelName], panelName))));
};

/**
 * Generate a panel based on the configuration provided in the Control Workflows
 * @param {Workflow} workflow
 * @param {Array<JSON>} variables
 * @param {String} name - of the panel
 * @returns 
 */
const panel = (workflow, variables, name) => {
  const label = name.replace(/([a-z](?=[A-Z]))/g, '$1 ');
  let sortedVars = variables.sort((varA, varB) => {
    if (!varA.index && varB.index) {
      return -1;
    } else if (varA.index && !varB.index) {
      return 1;
    } else if (varA.index && varB.index) {
      return varA.index > varB.index ? 1 : -1;
    } else {
      return varA.key > varB.key ? 1 : -1
    }
  })
  return h('.w-100', [
    h('h5.bg-gray-light.p2.panel-title.w-100.flex-row', h('.w-100', label)),
    h('.p2.panel', [
      sortedVars.map((variable) => autoBuiltBox(variable, workflow.model))
    ])
  ]);
};
