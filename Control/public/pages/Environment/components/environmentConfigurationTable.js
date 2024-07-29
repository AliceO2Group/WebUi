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

import { h } from '/js/src/index.js';
import { expandableObjectRow } from './expandableObjectRow.js';

/**
 * Builds a table with the userVars, vars and defaults of the environment
 * @param {EnvironmentModel} envModel - environment model
 * @param {EnvironmentInfo} environmentInfo - environment information DTO object
 * @return {vnode} - html table with the environment configuration
 */
export const environmentConfigurationTable = (envModel, environmentInfo) => {
  return h('.m2', [
    h('table.table', [
      h('tbody', [
        ['userVars', 'vars', 'defaults'].map((varType) =>
          expandableObjectRow(
            environmentInfo[varType],
            varType,
            envModel.isExpanded[varType],
            () => {
              envModel.isExpanded[varType] = !envModel.isExpanded[varType];
              envModel.notify();
            }
          )
        ),
      ])
    ])
  ]);
};
