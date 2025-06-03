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

const { LogManager } = require('@aliceo2/web-ui');
const { TaskState } = require("../common/taskState.enum");

/**
 * OdcDeviceInfoAdapter - Given an ODC device, construct an OdcDeviceInfo object for GUI purposes
 * Source: https://github.com/FairRootGroup/ODC/blob/master/odc/grpc/odc.proto#L87
 */
class OdcDeviceInfoAdapter {
  /**
   * OdcDeviceInfoAdapter
   */
  constructor() { }

  /**
   * Converts the given proto object OdcDeviceInfo (odc.proto) to an entity object.
   * @param {Device - odc.proto} device - object to convert
   * @returns {OdcDeviceInfo} entity of a device with needed information
   */
  static toEntity(device) {
    const {
      taskId,
      path,
      ignored = false,
      host,
      expendable = false,
      rmsjobid,
      className
    } = device;

    let epnState = device.state ?? TaskState.UNKNOWN;
    let ecsState = device.ecsState ?? TaskState.UNKNOWN;

    if (epnState === TaskState.ERROR && ecsState !== TaskState.ERROR) {
      // It may be that ECS did not have the change to handle the ERROR state
      // and the task is still in the previous state (e.g. CONFIGURED, UNKNOWN, etc.)
      // In this case, we set the ECS state to ERROR as well
      ecsState = TaskState.ERROR;
    }

    if (!expendable && (ecsState === TaskState.ERROR)) {
      ecsState = TaskState.ERROR_CRITICAL;
    }

    return {
      taskId,
      state: ecsState,
      epnState,
      path,
      isIgnored: ignored,
      hostname: host,
      isExpendable: expendable,
      rmsjobid,
      className
    };
  }

  /**
   * Converts the given proto object list of devices into an entity object list.
   * @param {string} odc - JSON string of ODC information as sent by ECS
   * @returns {OdcDeviceInfo[]} entity list of devices with needed information
   */
  static toEntityList(odcInfo) {
    try {
      const { devices } = JSON.parse(odcInfo);
      return Array.from(Object.values(devices).map(OdcDeviceInfoAdapter.toEntity));
    } catch (error) {
      const logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'cog'}/env-adapter`);
      logger.warnMessage(`Error parsing ODC data from integrated service: ${error}`);
    }
    return [];
  }
}

module.exports.OdcDeviceInfoAdapter = OdcDeviceInfoAdapter;
