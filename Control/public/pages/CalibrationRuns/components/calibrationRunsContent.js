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
import errorPage from './../../../common/errorPage.js';
import pageLoading from './../../../common/pageLoading.js';
import {groupedCalibrationRunsPanel} from './calibrationRunGroups.js';

/**
 * @file component which builds a panel for displaying actions and information on calibration runs
 */

/**
 * Main content panel of CalibrationRunPage containing multiple widgets grouped by their detector
 * @param {CalibrationRunsModel} calibrationRunsModel - model for the calibration runs page
 * @return {vnode}
 */
export const calibrationRunsContent = (calibrationRunsModel) => {
  const {calibrationRuns} = calibrationRunsModel;
  return calibrationRuns.match({
    NotAsked: () => h('.f7.flex-column', 'Calibration Runs data not asked'),
    Loading: () => pageLoading(2),
    Success: (runsGroupedByDetector) => groupedCalibrationRunsPanel(runsGroupedByDetector, calibrationRunsModel),
    Failure: (error) => errorPage(error),
  });
};
