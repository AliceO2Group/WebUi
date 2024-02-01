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
import {calibrationRunsContent} from './components/calibrationRunsContent.js';
import {calibrationRefreshContentButton} from './components/calibrationRefreshContentButton.js';

/**
 * Header for the simplified creation environment page
 * @returns {vnode}
 */
export const CalibrationRunsHeader = () => h('h4.w-100 text-center', 'Calibration Runs');

/**
 * Page for displaying calibration runs and related actions
 *
 * @param {Model} model - the global model
 * @return {vnode} - main component for the creation page of an environment
 */
export const CalibrationRunsContent = (model) => {
  const {calibrationRunsModel} = model;

  return h('.absolute-fill.scroll-y', [
    calibrationRefreshContentButton(calibrationRunsModel.requestReload.bind(calibrationRunsModel)),
    calibrationRunsContent(calibrationRunsModel)
  ]
  );
};
