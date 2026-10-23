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
 * Maps each log level to the set of severity codes that are NOT available at that level.
 * @type {Map<number|null, string[]>}
 */
const DISABLED_SEVERITIES_BY_LEVEL = new Map([
  [1, ['D']],
  [6, []],
  [11, []],
  [null, []],
]);

/**
 * Return the severity codes that are disabled for a given log level.
 * @param {number|null} level - the current log level (1=Ops, 6=Support, 11=Developer, null=Trace)
 * If provided a level not in the map, we enable all severities as this will be a custom event
 * @returns {string[]} severity codes that should be disabled at the given log level
 */
export const getDisabledSeverities = (level) => DISABLED_SEVERITIES_BY_LEVEL.get(level) ?? [];
