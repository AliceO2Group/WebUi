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

import {switchCase} from '/js/src/index.js';

/**
 * Returns background CSS class corresponding to a severity char
 * @param {string} severity
 * @return {string} CSS class
 */
export const severityClass = (severity) => switchCase(severity, {
  I: 'severity-i',
  W: 'severity-w-bg',
  E: 'severity-e-bg',
  F: 'severity-f-bg',
  D: 'severity-d'
});

/**
 * Returns font color CSS class corresponding to a severity char
 * @param {string} severity
 * @return {string} CSS class
 */
export const severityLabel = (severity) => switchCase(severity, {
  I: 'info',
  W: 'warning',
  E: 'error',
  F: 'fatal',
  D: 'debug'
});
