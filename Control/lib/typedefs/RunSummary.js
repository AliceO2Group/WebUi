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
 * @typedef RunSummary
 *
 * RunSummary is an object which contains just a summary of an entire run entity: https://github.com/AliceO2Group/Bookkeeping/blob/main/lib/domain/entities/Run.js
 * @property {number} runNumber
 * @property {number} id
 * @property {string} environmentId
 * @property {string} definition
 * @property {string} calibrationStatus
 * @property {string} runType
 * @property {number} runDuration
 * @property {number} startTime
 * @property {number} endTime
 * @property {Array<string>} detectors
 */
