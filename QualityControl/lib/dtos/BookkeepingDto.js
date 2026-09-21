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

/**
 * Quality information for a single detector participating in the run.
 * @typedef {object} DetectorQuality
 * @property {number} id - Unique detector identifier.
 * @property {string} name - The name (abbreviation) of the detector.
 * @property {string} quality - Quality flag or classification for the detector.
 */

/**
 * Bookkeeping run information.
 * @typedef {object} RunInformation
 * @property {RunStatus} runStatus - Custom status for front-end consumption:
 *   - ONGOING: run is currently ongoing
 *   - ENDED: run has completed (timeO2End is present)
 *   - NOT_FOUND: run data does not exist
 *   - UNKNOWN: error occurred or data unavailable
 * @property {number} startTime - Time (epoch) at which the run started.
 * @property {number|undefined} endTime - Time (epoch) at which the run ended. If `undefined`, the run hasn't ended yet.
 * @property {number|undefined} environmentId - Partition/environment the run belongs to.
 * @property {string|undefined} definition - The definition of the run.
 * @property {string} runQuality - Overall run quality.
 * @property {string|undefined} lhcBeamMode - LHC beam mode during which the run was taken, if any.
 * @property {DetectorQuality[]} detectorsQualities - Per-detector quality information.
 */

/**
 * Wrapped Run Status object
 * @typedef {object} WrappedRunStatus
 * @property {RunStatus} runStatus - The Run Status
 */

/**
 * Wraps a given run status value into a standardized result object.
 * Use this helper when you need to return only a `runStatus` field without any
 * additional payload. This ensures that all callers receive a consistent
 * object shape, matching the structure returned by `retrieveRunInformation`.
 * @param {RunStatus} runStatus The run status to wrap. Must be a valid `RunStatus` enum value.
 * @returns {WrappedRunStatus} A simple object containing only the provided `runStatus`.
 */
export function wrapRunStatus(runStatus) {
  return { runStatus };
}
