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
 * RunSummaryAdapter - Given an object with RUN information as per Bookkeeping Database (https://github.com/AliceO2Group/Bookkeeping/blob/main/lib/domain/entities/Run.js),
 * return a minified version of it with only the summary
 */
class RunSummaryAdapter {
  /**
   * RunSummaryAdapter
   */
  constructor() { }

  /**
   * Converts the given object to an entity object.
   *
   * @param {Object} run - Run Entity as per Bookkeeping https://github.com/AliceO2Group/Bookkeeping/blob/main/lib/domain/entities/Run.js
   * @returns {RunSummary} entity of a task with needed information
   */
  static toEntity(run) {
    const {
      id,
      runNumber,
      environmentId,
      definition,
      calibrationStatus,
      runType,
      runDuration,
      startTime,
      endTime,
    } = run;

    let {detectors = []} = run;
    if (typeof detectors === 'string') {
      detectors = detectors.split(',');
    }
    detectors.sort();

    return {
      id,
      runNumber,
      environmentId,
      definition,
      calibrationStatus,
      runType: runType?.name,
      runDuration,
      startTime,
      detectors,
      endTime,
    };
  }
}

module.exports = RunSummaryAdapter;
