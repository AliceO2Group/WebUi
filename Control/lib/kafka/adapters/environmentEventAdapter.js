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
 * Adapter for event messages received on environment topic
 * @param {Event.proto} eventMessage - the event message to adapt
 * @param {int64.proto} eventMessage.timestamp - the timestamp of the event
 * @param {Ev_EnvironmentEvent.proto} eventMessage.environmentEvent - the environment event to adapt
 * @return {EnvironmentEvent} - the adapted event message without the timestampNano field
 */
exports.environmentEventAdapter = ({ timestamp, environmentEvent }) => {
  const {
    environmentId: id,
    state, runNumber, error, message, transition, transitionStep, transitionStatus, vars, lastRequestUser
  } = environmentEvent;
  return {
    id,
    state,
    runNumber,
    error,
    message,
    transition,
    transitionStep,
    transitionStatus,
    vars,
    lastRequestUser,
    timestamp: timestamp.toNumber(),
  };
};
