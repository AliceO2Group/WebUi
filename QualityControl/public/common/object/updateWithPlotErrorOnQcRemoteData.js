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
 * @type {QcObjectRemoteData}
 * should contain:
 * {
 *  ...objectProperties as per ObjectDTO: '' // built specifically for the page
 *  root: JSON version of the root object to plot
 *  rootError: '' // error message if root object could not be retrieved
 *  timestampList: '',
 * }
 */

import { RemoteData } from '/js/src/index.js';
import { JS_ROOT_ERROR_LABEL, JS_ROOT_FAILED_TO_PLOT_MESSAGE } from '../enums/root.enum.js';

/**
 * Update the RemoteData object to include an error message on the qcObject
 * @param {QcObjectRemoteData} qcObjectRemoteData - the RemoteData object containing the qcObject
 * @param {string} error - the failure message to display
 * @returns {QcObjectRemoteData} - updated RemoteData object with error message
 */
export const updateWithPlotErrorOnQcRemoteData = (qcObjectRemoteData, error) => {
  if (qcObjectRemoteData.isSuccess()) {
    const updatedQcObject = {
      ...qcObjectRemoteData.payload.qcObject,
      rootError: `${JS_ROOT_ERROR_LABEL}: ${error || JS_ROOT_FAILED_TO_PLOT_MESSAGE}`,
    };
    qcObjectRemoteData = RemoteData.success({ ...qcObjectRemoteData.payload, qcObject: updatedQcObject });
  } else {
    qcObjectRemoteData = RemoteData.failure('Cannot update error message on a non-successful RemoteData object');
  }
  return qcObjectRemoteData;
};
