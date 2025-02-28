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

/**
 * Given an EnvironmentInfo proto object, return the list of tasks that are being ran on the EPN nodes
 * As compared to the FLP, QC, TRG nodes, the EPN tasks information resides within the integratedServicesData object
 * @param {EnvironmentInfo.proto} environmentInfo - the environment info object as received from ECS via gRPC
 * @return {Array<TaskInfo>} - a list of tasks that are being ran on the EPN nodes
 */
exports.getEpnTasksFromGrpcEnvironment = (environmentInfo) => {
  const { integratedServicesData: { odc = '{}' } = {} } = environmentInfo;
  try {
    const { devices = [] } = JSON.parse(odc);
    return Object.values(devices)
      .map(({ ecsState, state, ...rest }) => ({
        ...rest,
        epnState: state,
        state: ecsState,
      }))
  } catch (error) {
    return [];
  }
};
