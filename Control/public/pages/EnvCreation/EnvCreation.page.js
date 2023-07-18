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

import { h } from '/js/src/index.js';
import {detectorHeader} from './../../common/detectorHeader.js';
import {workflowTemplateComponent} from './components/workflowTemplate.component.js';

/**
 * Header for the simplified creation environment page
 * @param {Model} model - global model of the application
 * @returns {vnode}
 */
export const EnvCreationHeader = (model) => h('h4.w-100 text-center', 'New Environment');

/**
 * Simplified environment creation page
 *
 * @param {Model} model - the global model
 * @return {vnode}
 */
export const EnvCreationPage = (model) => {
  const {envCreationModel} = model;
  return  h('', [
    detectorHeader(model),
    workflowTemplateComponent(envCreationModel.currentWorkflow)
  ]);
};
