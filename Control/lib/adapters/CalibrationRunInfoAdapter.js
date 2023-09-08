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

/**
 * CalibrationRunInfoAdapter - Given an object with RUN information as per Bookkeeping Database (https://github.com/AliceO2Group/Bookkeeping/blob/main/lib/domain/entities/Run.js),
 * return a minified version of it with only the information needed for calibration page
 */
class CalibrationRunInfoAdapter {
  /**
   * CalibrationRunInfoAdapter
   */
  constructor() {}

  /**
   * Converts the given object to an entity object.
   *
   * @param {Object} run - object to convert
   * @returns {CalibrationRunInfo} entity of a task with needed information
   */
  static toEntity(run) {
    const {
      runNumber,
      environmentId,
      definition,
      calibrationStatus,
      runType,
      startTime,
      endTime,
    } = run;
    return  {
      runNumber,
      environmentId,
      definition,
      calibrationStatus,
      runType: runType.name,
      startTime,
      endTime,
    };
  }
}

module.exports = CalibrationRunInfoAdapter;
