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

export const QC_CHECKER_TYPE = 'qualityobject';
export const OBJECT_TYPE_KEY = '_typename';

/**
 * Given a QCObject representation, return if the type of the object is checker
 * @param {object} object - qc object representation as JSON
 * @returns {boolean} - true/false depending on type of object
 */
export function isObjectOfTypeChecker(object) {
  const objectType = object['_typename'] ?? '';
  return objectType.toLowerCase().includes(QC_CHECKER_TYPE);
}

/**
 * Method to generate drawing option list based on provided options and object type
 * @param {QcObjectDef} object - QC object to be plotted
 * @param {Array<string>} options - list of drawing options and display hints
 * @returns {string} - drawing options joined by ';'
 */
export function generateDrawingOptionList(object, options) {
  options = Array.from(new Set(options));

  const index = options.indexOf('stat');
  if (index >= 0) {
    options[index] = 'optstat=1111';
  } else {
    options.push('nostat');
  }

  if (object?._typename !== 'TGraph') {
    /*
     * Use user's defined options and add undocumented option "f" allowing color changing on redraw
     * (color is fixed without it)
     */
    options.push('f');
  }
  return options;
}
