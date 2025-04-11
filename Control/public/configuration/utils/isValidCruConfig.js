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
 * Check if the configuration given host has a valid configuration for each of its CRUs
 * Validation is done by checking if the configuration contains at least one link
 * @param {object<string, <string, {config: object, info: object}>} cruDataOfHost - Map of CRUs by host
 */
export const isValidCruConfig = (cruDataOfHost) => 
  Object.keys(cruDataOfHost)
    .map((cruId) => Object.keys(cruDataOfHost[cruId].config))
    .every((configKeys) => configKeys.some((key) => key.match(/link[0-9]{1,2}/)));
