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

const { getKeyOfValueInMap } = require('../../common/getKeyOfValueInMap.js');
const { QC_NODES_NAME_REGEX } = require('./QcNodeNameRegex.js');

/**
 * Given an EnvironmentInfo proto object, return the list of tasks that are being ran on the FLP nodes
 * Each task object has a deploymentInfo object with a hostname property. Thus,
 * * if a hostname of a task is not matching a QC node name and
 * * if the detector of the task is included in the detectors list of the passed environment object
 * then the task is considered to be ran on a FLP node
 * @param {EnvironmentInfo.proto} environmentInfo - the environment info object as received from ECS via gRPC
 * @param {Map<String, Array<String>>} hostsByDetector - a map of all detectors and their associated hosts
 * @return {Array<TaskInfo>} - a list of tasks that are being ran on the FLP nodes
 */
exports.getFlpTasksFromGrpcEnvironment = (environmentInfo, hostsByDetector = new Map()) => {
  const { tasks = [], includedDetectors } = environmentInfo;

  return tasks.filter(({ deploymentInfo: { hostname = '' } = {} }) => {
    if (hostname) {
      const detectorBelongingTo = getKeyOfValueInMap(hostsByDetector, hostname);
      return !QC_NODES_NAME_REGEX.test(hostname) && includedDetectors.includes(detectorBelongingTo);
    }
    return false;
  });
};
