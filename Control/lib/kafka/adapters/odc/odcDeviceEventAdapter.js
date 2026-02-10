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

const { OdcDeviceInfoAdapter } = require('../../../adapters/OdcDeviceInfoAdapter.js');
const { SourceEventTypes } = require('../../enums/sourceEventsTypes.enum.js');

/**
 * @typedef {OdcDeviceInfo} deviceStateChanged
 * 
 * 
 * @example of RUNNING as received in the payload of the `odc.deviceStateChanged` event on integrated_service.odc topic
 * {
 *  "partitionId": "2uvML7dXYm7",
 *  "ddsSessionId": "64a39ff4-ee70-4a03-b2c4-3ed41c1bd5a2",
 *  "ddsSessionStatus": "RUNNING",
 *  "state": "RUNNING",
 *  "ecsState": "RUNNING",
 *  "taskId": "9600131917864694778",
 *  "path": "main/RecoGroupMi100/RecoCollectionMi100_33/TRDTRACKLETTRANSFORMER_reco1_0",
 *  "ignored": false,
 *  "host": "epn308.internal",
 *  "expendable": false,
 *  "rmsjobid": "6606"
 * }
 * 
 * @xample of ERROR as received in the payload of the `odc.deviceStateChanged` event on integrated_service.odc topic
 * {
 *  "partitionId": "2zqJdVsaHwL",
 *  "ddsSessionId": "2ab25eb0-2de1-49cc-852c-8b0342096229",
 *  "ddsSessionStatus": "RUNNING",
 *  "state": "ERROR",
 *  "ecsState": "ERROR",
 *  "taskId": "807896542787881827",
 *  "path": "main/RecoGroupMi100/RecoCollectionMi100_0/pvertex-track-matching_t1_reco1_0",
 *  "ignored": true,
 *  "host": "epn323.internal",
 *  "expendable": false,
 *  "rmsjobid": "unknown"
 * }
 */

/**
 * Adapter for event messages received on integrated_service.odc topic with name `odc.deviceStateChanged`
 * 
 * @param {Ev_IntegratedServiceEvent - events.proto} generalIntegratedServiceEvent - the event is already generally parsed so that payload is a JSON
 * @return {OdcDeviceInfoEvent} - the adapted event message without the timestampNano field
 */
exports.odcDeviceEventAdapter = (generalIntegratedServiceEvent) => {
  // Payload contains the ODC device info  object
  const { payload } = generalIntegratedServiceEvent;
  const {timestamp, error, environmentId} = generalIntegratedServiceEvent;
  const odcDevice = OdcDeviceInfoAdapter.toEntity(payload);

  return {
    source: SourceEventTypes.ODC,
    environmentId,
    error,
    timestamp,
    ...odcDevice
  }
};
