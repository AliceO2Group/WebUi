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

const { getEpnTasksFromGrpcEnvironment } = require('./getEpnTasksFromGrpcEnvironment.js');
const { getFlpTasksFromGrpcEnvironment } = require('./getFlpTasksFromGrpcEnvironment.js');
const { getQcTasksFromGrpcEnvironment } = require('./getQcTasksFromGrpcEnvironment.js');
const { getTrgTasksFromGrpcEnvironment } = require('./getTrgTasksFromGrpcEnvironment.js');
const { TaskSource } = require('../../enum/task/TaskSource.js');

/**
 * Given an environment proto object, return the list of tasks based on given source
 * @param {EnvironmentInfo.proto} environmentInfo - the environment info object as received from ECS via gRPC
 * @param {TaskSource} source - the source of the tasks to be returned
 * @param {Map<String, Array<String>>} allHostsByDetectors - a map of all detectors and their hosts
 * @return {Array<TaskInfo>} - a list of tasks based on the given source
 */
exports.getTasksFromGrpcEnvironment = (
  environmentInfo,
  source = TaskSource.ALL,
  allHostsByDetectors = {}
) => {
  console.log(source);
  source = source.toLocaleUpperCase();
  let tasks = [];
  switch (source) {
    case TaskSource.ALL:
      tasks = [...environmentInfo.tasks, getEpnTasksFromGrpcEnvironment(environmentInfo, allHostsByDetectors)];
      break;
    case TaskSource.EPN:
      tasks = getEpnTasksFromGrpcEnvironment(environmentInfo, allHostsByDetectors);
      break;
    case TaskSource.FLP:
      tasks = getFlpTasksFromGrpcEnvironment(environmentInfo, allHostsByDetectors);
      break;
    case TaskSource.QC:
      tasks = getQcTasksFromGrpcEnvironment(environmentInfo);
      break;
    case TaskSource.TRG:
      tasks = getTrgTasksFromGrpcEnvironment(environmentInfo, allHostsByDetectors);
      break;
    default:
      tasks = environmentInfo.tasks;
  }
  return tasks;
};
