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
 * Wraps a given run status value into a standardized result object.
 * Use this helper when you need to return only a `runStatus` field without any
 * additional payload. This ensures that all callers receive a consistent
 * object shape, matching the structure returned by `retrieveRunInformation`.
 * @param {RunStatus} runStatus The run status to wrap. Must be a valid `RunStatus` enum value.
 * @returns {{ runStatus: RunStatus }} A simple object containing only the provided `runStatus`.
 */
export function wrapRunStatus(runStatus) {
  return { runStatus };
}
