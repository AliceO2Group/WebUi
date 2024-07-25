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

import { h } from '/js/src/index.js';

/**
 * Builds a component with information on given workflow template
 * @param {RemoteData<WorkflowTemplateSource>} workflow - workflow template source information
 * @returns {vnode}
 */
export const workflowTemplateComponent = (workflow) =>
  workflow.match({
    NotAsked: () => null,
    Loading: () => 'Retrieving information from AliECS...',
    Success: ({ template, repository, revision }) => h('.flex-column.p2.f6', [
      h('.flex-row', h('h5.w-30.f6', 'Template: '), h('.w-70', template)),
      h('.flex-row', h('h5.w-30.f6', 'Repository: '), h('.w-70', repository)),
      h('.flex-row', h('h5.w-30.f6', 'Revision: '), h('.w-70', revision)),
    ]),
    Failure: () => h('.danger.text-center', [
      h('p', 'Missing workflow template information from AliECS.'),
      h('p', 'Please contact an administrator.'),
    ]),
  });
