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

import { h, iconCheck, iconX } from '/js/src/index.js';
import { DetectorState } from './../enums/DetectorState.enum.js';

/**
 * Construct a visual element under the form of a row that displays the state of properties of a detector as per DCS
 * - PFR - Prepare For Run
 * - SOR - Start Of Run
 * @param {Detector} detector - information of a detector from DCS
 * @returns {vnode}
 */
export const dcsPropertiesRow = (detector = {}) => {
  const { pfrAvailability, sorAvailability } = detector;
  return h('.flex-row.g2', [
    pfrAvailability && dcsProperty(pfrAvailability, 'PFR'),
    sorAvailability && dcsProperty(sorAvailability, 'SOR'),
  ]);
};

/**
 * Construct a visual element that it will help the user in understanding the property of DCS and what actions can be taken
 * @param {DetectorState} state - state of the DCS property that we wish to display
 * @param {String['PFR', 'SOR']} name - dcs component that we display availability for
 * @returns {vnode}
 */
export const dcsProperty = (state = '', name) => {
  let stateClass = '';
  let icon = '';

  if (state.toLocaleUpperCase().endsWith('_AVAILABLE')) {
    stateClass = 'success';
    icon = iconCheck();
  } else if (state.toLocaleUpperCase().endsWith('_UNAVAILABLE')) {
    stateClass = 'danger';
    icon = iconX();
  }
  if (state !== DetectorState.UNDEFINED) {
    return h('.flex-row.g1', [
      h('', { class: stateClass }, icon),
      name,
    ]);
  }
  return '';
};
