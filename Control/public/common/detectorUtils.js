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
export const TST_DETECTOR_NAME = 'TST';

/**
 * Method to return a detector list with TST detector at the end if it exists
 * @param {String[]} detectorList - list of detector names
 * @return {String[]} reordered list of detector names
 */
export const getDetectorListWithTstAtEnd = (detectorList) => {
  let hasTstDetector = false;
  const detectorsWithoutTst = detectorList.filter((detector) => {
    if (detector === TST_DETECTOR_NAME) {
      hasTstDetector = true;
      return false;
    }
    return true;
  });
  const detectorsWithTst = detectorList.filter(detector => detector.toLocaleUpperCase().includes(TST_DETECTOR_NAME));
  return [
    ...detectorsWithoutTst,
    ...(hasTstDetector ? detectorsWithTst : [])
  ];
}
