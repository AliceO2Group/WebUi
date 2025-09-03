/**
 *  @license
 *  Copyright CERN and copyright holders of ALICE O2. This software is
 *  distributed under the terms of the GNU General Public License v3 (GPL
 *  Version 3), copied verbatim in the file "COPYING".
 *
 *  See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 *  In applying this license CERN does not waive the privileges and immunities
 *  granted to it by virtue of its status as an Intergovernmental Organization
 *  or submit itself to any jurisdiction.
 */

/**
 * Frozen object that contains the consumer groups used in the Kafka communication
 * @returns {Object} - the object containing the consumer groups
 */
exports.ConsumerGroups = Object.freeze({
  ENVIRONMENT: 'cog-environment-localo',
  INTEGRATED_SERVICE: {
    DCS: 'cog-dcs-integrated-service-local',
    ODC: 'cog-odc-integrated-service-local',
  },
  RUN: 'cog-run-local',
  TASK: 'cog-task-local',
});
