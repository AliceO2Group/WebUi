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

import {Log} from '@aliceo2/web-ui';
const log = new Log(`${process.env.npm_config_log_label ?? 'qcg'}/user`);

/**
 * QC Object data type object Class
 */
export default class QCObjectDto {
  /**
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

    this.root = {}
  }

  /**
   * Checks if passed object's path is valid
   * @param {JSON} object
   * @returns {Boolean}
   */
  static isObjectPathValid(object) {
    if (!object || !object['path']) {
      log.debug(`CCDB returned an empty ROOT object path, ignoring`);
      return false;
    } else if (object['path'].indexOf('/') === -1) {
      log.debug(`CCDB returned an invalid ROOT object path "${object['path']}", ignoring`);
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
    if (item['path']) {
      item.name = item['path'];
      delete item.path;
    }
    if (item['last-modified']) {
      try {
        item.lastModified = new Date(item['last-modified']).getTime();
      } catch (error) {
        item.lastModified = item['last-modified'];
      }
    }
    if (item['drawoptions']) {
      item.drawOptions = item['drawoptions'];
      delete item['drawoptions'];
    }
    if (item['runnumber']) {
      item.runNumber = item['runnumber'];
      delete item['runnumber'];
    }
    if (item['displayhints']) {
      item.displayHints = item['displayhints'];
      delete item['displayhints'];
    }
    return item;
  }
}
