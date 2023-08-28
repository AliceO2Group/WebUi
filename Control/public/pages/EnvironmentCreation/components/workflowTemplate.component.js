/**
 *  @license
 *  Copyright CERN and copyright holders of ALICE O2. This software is
 *  distributed under the terms of the GNU General Public License v3 (GPL
 *  Version 3), copied verbatim in the file "COPYING".
 *
 *  See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 *  In applying this license CERN does not waive the privileges and immunities
 *  granted to it by virtue of its status as an Intergovernmental Organization
 *  or submit itself to any jurisdiction.
 */

import {h} from '/js/src/index.js';

/**
 * Builds a component with information on given workflow template
 *
 * @param {RemoteData<WorkflowTemplateSource>} workflow - workflow template source information
 * @return {vnode}
 */
export const workflowTemplateComponent = (workflow) =>
  workflow.match({
    NotAsked: () => null,
    Loading: () => 'Retrieving information from AliECS...',
    Success: ({template, repository, revision}) => h('.flex-column.p2', [
      h('.flex-row',h('h5.w-30', 'Template: '), h('.w-70', template)),
      h('.flex-row',h('h5.w-30', 'Repository: '), h('.w-70', repository)),
      h('.flex-row',h('h5.w-30', 'Revision: '), h('.w-70', revision)),
    ]),
    Failure: () => h('.error', 'Unable to retrieve default workflow template information from AliECS')
  });
