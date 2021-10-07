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
 * Shared methods used within Core Services/Controlers
 */
class CoreUtils {
  /**
   * Constructor initializing dependencies
   */
  constructor() { }

  /**
   * Given a core response with framework info, filter out
   * data which should not be displayed to the user
   * @param {JSON} info 
   */
  static parseFrameworkInfo(info) {
    delete info.detectorsInInstance;
    delete info.activeDetectors;
    delete info.availableDetectors;
    return info;
  }

  /**
   * Method to remove `/` if exists from method name
   * @param {string} method
   * @return {string}
   */
  static parseMethodNameString(method) {
    return method?.indexOf('/') === 0 ? method.substring(1, method.length) : method;
  }


  /**
   * Parse the JSON of the version and return it as a string
   * @param {JSON} versionJSON
   * @return {string}
   */
  static parseAliEcsVersion(versionJSON) {
    let version = '';
    if (versionJSON.productName) {
      version += versionJSON.productName;
    }
    if (versionJSON.versionStr) {
      version += ' ' + versionJSON.versionStr;
    }
    if (versionJSON.build) {
      version += ' (revision ' + versionJSON.build + ')';
    }
    return version;
  }
}

module.exports = CoreUtils;
