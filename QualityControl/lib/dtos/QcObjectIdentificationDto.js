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

import { getDateAsTimestamp } from './../../common/library/utils/dateTimeFormat.js';
import { CCDB_RESPONSE_BODY_KEYS } from '../services/ccdb/CcdbConstants.js';
const { PATH, VALID_FROM, VALID_UNTIL, CREATED, ID } = CCDB_RESPONSE_BODY_KEYS;

/**
 * Class representing the identification object type for a QC Object.
 * This is used for retrieving a specific version of an object based on its attributes
 */
export default class QcObjectIdentificationDto {
  /**
   * Constructor to initialize the object
   */
  constructor() {
    this.path = '';
    this.id = '';
    this.validFrom = undefined;
    this.validUntil = undefined;
    this.createdAt = undefined;
    this.filters = {};
  }

  /**
   * Transforms object details received from CCDB HEAD request to a QCG normalized one;
   * * known keys are mapped to camelCase format
   * * timestamps (ms) are converted from string to number
   * * etag is converted from double strings to string
   * Returned identification can be partial only if received HEAD request is not complete
   * @param {object} item - from CCDB
   * @returns {CcdbObjectIdentification} - JSON with keys in camelCase format
   */
  static fromGetFormat(item) {
    const identification = {};
    if (item[PATH]) {
      identification.path = item[PATH];
    }
    if (item[VALID_FROM]) {
      identification.validFrom = getDateAsTimestamp(item[VALID_FROM]);
    }
    if (item[ID]) {
      try {
        const id = JSON.parse(item[ID]);
        identification.id = id;
      } catch {
        identification.id = item[ID];
      }
    }
    if (item[VALID_UNTIL]) {
      identification.validUntil = getDateAsTimestamp(item[VALID_UNTIL]);
    }
    if (item[CREATED]) {
      identification.createdAt = getDateAsTimestamp(item[CREATED]);
    }
    if (item.filters) {
      identification.filters = item.filters;
    }
    return identification;
  }
}
