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

import {rowForCard} from '../../../common/card/rowForCard.js';
import {h} from '/js/src/index.js';

/**
 * Builds a component with information on given workflow template
 *
 * @param {RemoteData<WorkflowTemplateSource>} workflow - workflow template source information
 * @return {vnode}
 */
export const workflowTemplateComponent = (workflow) =>
  h('.w-100.flex-column', [
    h('h5.p2.panel-title.text-center', 'Workflow Template Source Information'),
    h('.panel',
      workflow.match({
        NotAsked: () => null,
        Loading: () => 'Retrieving information from AliECS...',
        Success: ({template, repository, revision}) => h('.flex-row.flex-wrap.justify-around', [
          rowForCard(h('h5', 'Template: '), template),
          rowForCard(h('h5', 'Repository: '), repository),
          rowForCard(h('h5', 'Revision: '), revision),
        ]),
        Failure: () => h('.error', 'Unable to retrieve default workflow template information from AliECS')
      })
    ),
  ]);
