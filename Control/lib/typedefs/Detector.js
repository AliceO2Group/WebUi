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
 * @typedef Detector
 *
 * Detector definition as received from ECS directly from DCS
 *
 * @property {String} [name] - optional name of the detector
 * @property {DetectorState} state - state of detector
 * @property {Number} timestamp - timestamp of the last updated state
 * @property {Array[String]} allowedRunTypes
 * @property {String} pfrAvailability - no enum provided but usually a string in the form of DetectorState
 * @property {String} sorAvailability - no enum provided but usually a string in the form of DetectorState
 */
