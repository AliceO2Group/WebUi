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
 * @param {Event - events.proto} eventMessage - the event message to adapt
 * @param {Ev_EnvironmentEvent - events.proto} eventMessage.environmentEvent - the environment event to adapt
 * @return {EnvironmentEvent} - the adapted event message without the timestampNano field
 */
exports.fromEcsEventToEnvironmentEvent = ({ environmentEvent }) => {
  const {
    environmentId: id,
    error, message, transition, transitionStep, transitionStatus,
  } = environmentEvent;
  return {
    id,
    error,
    message,
    transition: {
      name: transition,
      step: transitionStep,
      status: transitionStatus,
    }
  };
};
