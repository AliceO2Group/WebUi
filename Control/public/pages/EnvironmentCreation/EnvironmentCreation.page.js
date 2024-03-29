/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import {h} from '/js/src/index.js';
import {detectorHeader} from './../../common/detectorHeader.js';
import {workflowTemplateComponent} from './components/workflowTemplate.component.js';
import {panel} from '../../common/panel/panel.js';
import {workflowMappingsComponent} from './components/workflowMappings.component.js';
import {deployEnvironmentButton} from '../../common/deployEnvironmentButton.component.js';
import detectorsPanel from '../../workflow/panels/flps/detectorsPanel.js';
import flpSelectionPanel from '../../workflow/panels/flps/flpSelectionPanel.js';

/**
 * Header for the simplified creation environment page
 * @param {Model} model - global model of the application
 * @returns {vnode}
 */
export const EnvironmentCreationHeader = (model) => h('h4.w-100 text-center', 'New Environment');

/**
 * Simplified environment creation page
 *
 * @param {Model} model - the global model
 * @return {vnode} - main component for the creation page of an environment
 */
export const EnvironmentCreationPage = (model) => {
  const {envCreationModel} = model;
  const {
    workflowLoaded, selectedConfigurationLabel, workflowMappings, setCreationModelConfiguration
  } = envCreationModel;
  const {deployEnvironment, defaultWorkflow, isReady, setOdcNumberOfEpns} = envCreationModel;
  return h('.absolute-fill.scroll-y', [
    detectorHeader(model),
    h('.g2.flex-column.p2', [
      h('.w-100.flex-row.g3', [
        h('.w-50.flex-column', [
          panel(
            'Choose configuration',
            h('.flex-column', [
              workflowMappingsComponent(
                workflowMappings, selectedConfigurationLabel, setCreationModelConfiguration.bind(envCreationModel),
                workflowLoaded, setOdcNumberOfEpns.bind(envCreationModel)
              ),
            ])
          ),
          h('.w-100.text-center', detectorsPanel(model, true)),
          panel(
            'Workflow Template',
            workflowTemplateComponent(defaultWorkflow),
          ),
        ]),
        h('.flex-row.text-center.w-50', [
          flpSelectionPanel(model.workflow, 43.3)
        ]),
      ]),
      !envCreationModel.isPfrAvailable() && h('.w-100.text-center.danger.flex-column', [
        h('', 'Due DCS being enabled and PFR not being available for one or more of the selected detectors -'),
        h('', 'deployment cannot start')
      ]),
      deployEnvironmentButton(false, isReady, deployEnvironment.bind(envCreationModel))
    ])
  ]);
};
