/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

/**
 * @typedef CalibrationConfiguration
 *
 * CalibrationConfiguration is an object which contains details on what a calibration run should be
 * based on and displayed to the user
 *
 * @property {String} runType 
 * @property {String} configuration - name of the configuration to be used from the existing saved ones in KV store runtime
 * @property {String} label - label to be displayed to the user for this calibration
 * @property {String} description - description to be displayed if specifics are needed for that calibration
 */
