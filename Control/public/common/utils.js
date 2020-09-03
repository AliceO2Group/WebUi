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
 * Method to display specific JSON fields in a particular way
 * @param {Object} item
 * @param {string} key
 * @return {string}
 */
export default function parseObject(item, key) {
  switch (key) {
    case 'tasks':
      return item.length;
    case 'version':
      return item.productName + ' v' + item.versionStr + '(revision ' + item.build + ')';
    case 'createdWhen':
      return new Date(item).toLocaleString();
    default:
      return JSON.stringify(item);
  }
}
