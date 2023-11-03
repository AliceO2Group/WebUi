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
import {calibrationRunCard} from './calibrationRunCard.js';
import {calibrationActionCard} from './calibrationActionCard.js';

/**
 * @file contains grouped needed for displaying actions and information on calibration runs that are grouped
 * by detector and runType. Each such group needs to have:
 * - action panel for starting a new calibration run
 * - last calibrationRunCard information
 * - last successful calibrationRunCard information
 */

/**
 * Panel which contains all calibration runs data grouped by detector.
 * If there are not any runs for at least a detector, an informative message will be displayed.
 * @param {Object<String, Array<RunSummary>} calibrationsRunsByDetector - object with calibration runs information grouped by their detector
 * @param {CalibrationRunsModel} calibrationRunsModel - model to use for actions on calibration runs
 * @return {vnode}
 */
export const groupedCalibrationRunsPanel = (calibrationsRunsByDetector, calibrationRunsModel) => {
  const detectorsGroupPanel = [];
  for (const detector in calibrationsRunsByDetector) {
    const runsForDetector = calibrationsRunsByDetector[detector];
    if (Object.keys(runsForDetector)?.length > 0) {
      detectorsGroupPanel.push(calibrationRunsPerDetectorCard(detector, runsForDetector, calibrationRunsModel));
    }
  }
  if (detectorsGroupPanel.length === 0) {
    return h('.text-center', [
      h('p', 'No Calibration Runs were found.'),
      h('p', 'If such information should be present, please contact an administrator.')
    ]);
  }
  return detectorsGroupPanel
};

/**
 * Component for mapping each detector to its group of calibration runs
 * @param {String} detector - to which the run group belongs to
 * @param {Object<String, RunSummary|CalibrationConfiguration|RemoteData>} runGroups - list of runs for which to build the components
 * @param {CalibrationRunsModel} calibrationRunsModel - model of the component
 * @return {vnode}
 */
const calibrationRunsPerDetectorCard = (detector, runGroups, calibrationRunsModel) => {
  const {newCalibrationRun} = calibrationRunsModel;
  return [
    Object.values(runGroups).map((runGroup) => {
      const {configuration, lastCalibrationRun, lastSuccessfulCalibrationRun, ongoingCalibrationRun} = runGroup;
      return h('.p1.flex-row.g2',
        [
          calibrationActionCard(
            configuration, ongoingCalibrationRun, detector, newCalibrationRun.bind(calibrationRunsModel)
          ),
          calibrationRunCard(lastCalibrationRun),
          calibrationRunCard(lastSuccessfulCalibrationRun),
        ])
    })
  ];
};
