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

const {
  EcsOperationAndStepStatus: {
    DONE_ERROR,
    DONE_TIMEOUT
  }
} = require('../common/ecsOperationAndStepStatus.enum.js');

/**
 * @class DcsIntegratedEventAdapter - Given an AliECS Integrated Service Event for DCS.SOR, build a DCS Integrated Event
 * 
 * The DCS SOR event is a special event that comes from either:
 * * the DCS service itself (when containing the payload "dcsEvent") and it is for one detector only
 * * the ECS service which describes steps being executed for all detectors involved
 */
class DcsIntegratedEventAdapter {
  /**
   * DcsIntegratedEventAdapter
   */
  constructor() {
  }

  /**
   * Build a DCS Integrated Event from an AliECS Integrated Service Event - SOR. If it is a DCSevent, the detector will replace detectors array
   * 
   * // IntegratedService event, related to SOR but with a failure on ECS side (such as timeout)
   * @example 
   * {
   *  "timestamp": 1733497646607,
   *  "integratedServiceEvent": {
   *    "name": "readout-dataflow.dcs.sor",
   *    "error": "DCS SOR timed out after 1s: rpc error: code = DeadlineExceeded desc = Deadline Exceeded",
   *    "operationName": "dcs.StartOfRun()",
   *    "operationStatus": "ONGOING",
   *    "operationStep": "perform DCS call: StartOfRun",
   *    "operationStepStatus": "DONE_TIMEOUT",
   *    "environmentId": "2rRm96N9k7E", 
   *    "payload": "{\"detectors\":[\"EMC\"],\"detectorsReadiness\":{\"EMC\":\"SOR_AVAILABLE\"},\"runNumber\":1601}"
   * }
   * // IntegratedService event with final state DONE_ERROR following the DONE_TIMEOUT from above
   * @example 
   * {
   *  "timestamp": 1734004912438,  
   *  "integratedServiceEvent": {
   *    "name": "readout-dataflow.dcs.sor",
   *    "error": "DCS SOR timed out after 100ms: rpc error: code = DeadlineExceeded desc = context deadline exceeded : SOR failed for EMC, FDD, DCS EOR will run anyway for this run",
   *    "operationName": "dcs.StartOfRun()",
   *    "operationStatus": "DONE_ERROR",
   *    "operationStep": "perform DCS call: StartOfRun",
   *    "operationStepStatus": "DONE_ERROR",
   *    "environmentId": "2rYQabnjWy2",
   *    "payload": "{\"detectors\":[\"EMC\",\"FDD\"],\"detectorsReadiness\":{\"EMC\":\"SOR_AVAILABLE\",\"FDD\":\"SOR_AVAILABLE\"},\"failedDetectors\":[\"EMC\",\"FDD\"],\"runNumber\":1622}"
   * }
   * 
   * // IntegratedService event, related to SOR_PROGRESSING with payload from DCS
   * @example 
   * {
   *  "timestamp": 1734004912360,
   *  "timestampNano": 1734004912360675322,
   *  "environmentEvent": null,
   *  "taskEvent": null,
   *  "roleEvent": null,
   *  "callEvent": null,
   *  "integratedServiceEvent": {
   *    "name": "readout-dataflow.dcs.sor",
   *    "error": null,
   *    "operationName": "dcs.StartOfRun()",
   *    "operationStatus": "ONGOING",
   *    "operationStep": "perform DCS call: StartOfRun",
   *    "operationStepStatus": "ONGOING",
   *    "environmentId": "2rYQabnjWy2",
   *    "payload": \"{
   *      \"dcsEvent\": { 
   *      \"eventtype\":20,
   *      \"detector\":2,
   *      \"state\":5,\"
   *      extraParameters\":{
   *        \"run_no\":\"1622\"
   *      },
   *      \"timestamp\":\"2024-12-12 13:01:52.358\",
   *      \"message\":\"run_type\"
   *    },
   *    \"detector\":\"EMC\",
   *    \"detectors\":[\"EMC\",\"FDD\"],
   *    \"detectorsReadiness\":{
   *      \"EMC\":\"SOR_AVAILABLE\",
   *      \"FDD\":\"SOR_AVAILABLE\"
   *    },
   *    \"runNumber\":1622,
   *    \"state\":\"SOR_PROGRESSING\"
   *  }"
   * }
   *
   * Final OperationStates: DONE_TIMEOUT/DONE_ERROR/DONE_OK
   * @param {object} event - AliECS Integrated Service Event
   * @param {number} timestamp - timestamp of the event (int64 as per proto file definition)
   * @return {object} DCS Integrated Event
   */
  static buildDcsIntegratedEvent(event, timestamp) {
    const { name, error, environmentId, payload } = event;
    const { operationName, operationStatus, operationStep, operationStepStatus } = event;

    const payloadJSON = JSON.parse(payload);
    const { dcsEvent, runNumber, detector = null, state } = payloadJSON;

    if (!dcsEvent
        && operationStatus !== DONE_ERROR && operationStatus !== DONE_TIMEOUT
        && operationStepStatus !== DONE_ERROR && operationStepStatus !== DONE_TIMEOUT
    ) {
      // if there is no DCS event and status is not final error or timeout, we ignore the event as we expect to have `RUN_OK` from DCS as final state
      // or DONE_TIMEOUT or DONE_ERROR from ECS. We are not interested in DONE_OK from ECS as this means all detectors in RUN_OK which we already look for
      return null;
    }
    let { detectors } = payloadJSON;
    
    if (detector) {
      // event comes with information also from DCS and it comes per detector for SOR so we override detectors
      detectors = [detector];
    }

    return {
      name,
      timestamp: Number(timestamp),
      error,
      environmentId,
      runNumber,
      state,
      operationName,
      operationStatus,
      operationStep,
      operationStepStatus,
      detectors
    };
  }
}

exports.DcsIntegratedEventAdapter = DcsIntegratedEventAdapter;
