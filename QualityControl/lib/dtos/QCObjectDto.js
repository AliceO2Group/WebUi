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

/**
 * QC Object data type object Class
 */
export default class QCObjectDto {
  /**
   * Constructor to initialize QCObject fields with default values
   */
  constructor() {
    this.id = '';
    this.name = '';
    this.path = '';
    this.created = '';
    this.lastModified = '';
    this.timestamp = '';

    this.size = '';

    this.drawingOptions = undefined;
    this.displayHints = undefined;

    this.root = {};
  }

  /**
   * Checks if passed object's path is valid:
   * * contains 'path' attribute
   * * path is composed of multiple blocks separated by '/'
   * @param {JSON} object - qc object representation
   * @returns {boolean} - whether the path is valid or not
   */
  static isObjectPathValid(object) {
    if (!object || !object['path']) {
      return false;
    } else if (object['path'].indexOf('/') === -1) {
      return false;
    }
    return true;
  }

  /**
   * Transforms an object from CCDB structure to a QCG normalized one;
   * * known keys are mapped to camelCase format
   * * timestamps (ms) are converted from string to number
   * @param {Object} item - from CCDB
   * @return {Object} - JSON with keys in camelCase format
   */
  static toStandardObject(item) {
    const object = {
      id: item.id,
      path: item.path,
      name: item.path,
      validFrom: getDateAsTimestamp(item['valid-from']),
      validUntil: getDateAsTimestamp(item['valid-until']),
      createdAt: getDateAsTimestamp(item.created),
      lastModified: getDateAsTimestamp(item['last-modified']),
      fileName: item?.fileName,
      size: item?.size,
      drawOptions: item?.drawoptions?.split(' ') ?? [],
      displayHints: item?.displayhints?.split(' ') ?? [],
      etag: item?.etag,
      runNumber: item?.runnumber,
      runType: item?.runtype ?? item?.run_type,
      partName: item?.partname,
      periodName: item?.periodname,
      qcCheckName: item?.qc_check_name,
      qcQuality: item?.qc_quality,
      qcDetectorName: item?.qc_detector_name,
      qcTaskName: item?.qc_task_name,
      qcVersion: item?.qc_version,
      objectType: item?.objecttype,
    };
    return object;
  }
}
