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

const {LogManager} = require('@aliceo2/web-ui');

/**
 * Adapter for integrated service event type of message received on integrated_service topic
 * Adapter's role is to attempt to parse the payload into a JSON and update the timestamp field from BigInt to a number
 * @param {Event - events.proto} eventMessage - the event message to adapt
 * @param {Ev_IntegratedServiceEvent - events.proto} eventMessage.integratedServiceEvent - the integrated service event to adapt
 * @param {BigInt} eventMessage.timestamp - the timestamp of the event message
 * @return {object} - the adapted event message
 */
exports.fromEcsIntegratedServiceEventToEvent = ({ integratedServiceEvent, timestamp }) => {
  const { payload = '{}' } = integratedServiceEvent;
  const timestamp = fromBigIntToNumber(timestamp);

  let payloadData = {};
  try {
    payloadData = JSON.parse(payload);
  } catch (error) {
    const logger = LogManager.getLogger('cog/ecs-integrated-service-event-adapter');
    logger.errorMessage('Failed to parse payload:', error);
  }
  return {
    ...integratedServiceEvent,
    timestamp,
    payload: payloadData,
  };
};

/**
 * Convert a BigInt timestamp to a number
 * @param {BigInt} bigInt - The BigInt timestamp to convert
 * @return {number} - The converted number timestamp
 */
const fromBigIntToNumber = (bigInt) => {
  const bigIntTimestamp = BigInt(bigInt.toString(10));
  return Number(bigIntTimestamp);
};
