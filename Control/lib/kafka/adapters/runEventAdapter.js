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
 * Adapter for event messages received on run topic
 * @param {Event.proto} eventMessage - the event message to adapt
 * @param {int64.proto} eventMessage.timestamp - the timestamp of the event
 * @param {Ev_RunEvent.proto} eventMessage.runEvent - the timestamp of the event
 * @return {RunEvent} - the adapted event message without the timestampNano field
 */
exports.runEventAdapter = ({ timestamp, runEvent }) => {
  const { 
    environmentId,
    runNumber,
    state,
    error,
    transition,
    transitionStatus,
    vars,
    lastRequestUser
  } = runEvent;
  return {
    timestamp: timestamp.toNumber(),
    environmentId,
    runNumber,
    state,
    error,
    transition,
    transitionStatus,
    vars,
    lastRequestUser,
  }
};
