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
import {miniCard} from '../../../common/card/miniCard.js';
import {calibrationRunCard} from './calibrationRunCard.js';

/**
 * @file contains grouped needed for displaying actions and information on calibration runs that are grouped
 * by detector and runType. Each such group needs to have:
 * - action panel for starting a new calibration run
 * - last calibrationRunCard information
 * - last successful calibrationRunCard information
 */

/**
 * Panel which contains all calibration runs data grouped by detector
 * @param {Object<String, Array<RunSummary>} calibrationsRunsByDetector - object with calibration runs information grouped by their detector
 * @return {vnode}
 */
export const groupedCalibrationRunsPanel = (calibrationsRunsByDetector) => {
  const detectorsGroupPanel = [];
  for (const detector in calibrationsRunsByDetector) {
    const runsForDetector = calibrationsRunsByDetector[detector];
    detectorsGroupPanel.push(calibrationRunsPerDetectorCard(runsForDetector));
  }
  return detectorsGroupPanel
};

/**
 * Component for mapping each detector to its group of calibration runs
 * @param {Array<RunSummary>} runs - list of runs for which to build the components
 * @return {vnode}
 */
const calibrationRunsPerDetectorCard = (runGroups) =>
  miniCard(null, [
    runGroups.map((group) =>
      h('.p1.flex-row.g2', 
        [
          calibrationRunCard(group.lastCalibrationRun),
          calibrationRunCard(group.lastSuccessfulCalibrationRun),
        ])
    )
  ], ['m1', 'g1', 'p1']);
