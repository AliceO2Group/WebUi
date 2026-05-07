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
 * Object containing the different levels of logs that can be displayed in the application,
 * with their label and index as in the database
 * These values are as per InfoLogger defined levels:
 * {@link https://github.com/AliceO2Group/InfoLogger/blob/master/doc/README.md}
 */
export const InfoLoggerLevel = Object.freeze({
  OPS: {
    label: 'Ops',
    index: 1,
  },
  SUPPORT: {
    label: 'Support',
    index: 6,
  },
  DEVEL: {
    label: 'Devel',
    index: 11,
  },
  TRACE: {
    label: 'Trace',
    index: null,
  },
});

/**
 * Array containing the different levels of logs that can be displayed in the application,
 * with their label and index as in the database, used for iterating over the levels in the UI
 * These values are as per InfoLogger defined levels:
 */
export const INFOLOGGER_LEVEL_LIST = Object.values(InfoLoggerLevel);
