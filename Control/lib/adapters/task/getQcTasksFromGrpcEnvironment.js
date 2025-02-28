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

/**
 * Given an EnvironmentInfo proto object, return the list of tasks that are being ran on the QC nodes
 * by matching the hostname of the task to the known QC node regex
 * @param {EnvironmentInfo.proto} environmentInfo - the environment info object as received from ECS via gRPC
 * @return {Array<TaskInfo>} - a list of tasks that are being ran on the QC nodes
 */
exports.getQcTasksFromGrpcEnvironment = (environmentInfo) => {
  const { tasks = [] } = environmentInfo;
  return tasks.filter(
    ({ deploymentInfo: { hostname = '' } = {} }) => QC_NODES_NAME_REGEX.test(hostname)
  );
};
