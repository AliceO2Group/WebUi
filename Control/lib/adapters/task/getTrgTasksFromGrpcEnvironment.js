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

const { QC_NODES_NAME_REGEX } = require('./QcNodeNameRegex.js');
const { getKeyOfValueInMap } = require('../../common/getKeyOfValueInMap.js');

/**
 * Given an EnvironmentInfo proto object, return the list of tasks that are being ran on the TRG nodes
 * by filtering out any known nodes of included detectors and QC nodes
 * Remaining nodes will belong to TRG
 * @param {EnvironmentInfo.proto} environmentInfo - the environment info object as received from ECS via gRPC
 * @param {Map<String, Array<String>>} allHostsByDetectors - a map of all detectors and their hosts
 * @return {Array<TaskInfo>} - a list of tasks that are being ran on the TRG nodes
 */
exports.getTrgTasksFromGrpcEnvironment = (environmentInfo, allHostsByDetectors = new Map()) => {
  const { tasks = [], includedDetectors } = environmentInfo;
  return tasks.filter(({ deploymentInfo: { hostname = '' } = {} }) => {
    if (hostname) {
      const detectorBelongingTo = getKeyOfValueInMap(allHostsByDetectors, hostname);
      return !QC_NODES_NAME_REGEX.test(hostname) && !includedDetectors.includes(detectorBelongingTo);
    }
    return false;
  });
};
