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
 * DcsIntegratedEventAdapter - Given an AliECS Integrated Service Event for DCS.SOR, build a DCS Integrated Event
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
   * Build a DCS Integrated Event from an AliECS Integrated Service Event. If it is a DCSevent, the detector will replace detectors array
   * @param {object} event - AliECS Integrated Service Event
   * @param {number} timestamp - timestamp of the event (int64 as per proto file definition)
   * @return {object} DCS Integrated Event
   */
  static buildDcsIntegratedEvent(event, timestamp) {
    const { name, error, environmentId, payload } = event;
    const { operationName, operationStatus, operationStep, operationStepStatus } = event;

    const payloadJSON = JSON.parse(payload);
    const { runNumber, detector = null } = payloadJSON;
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
      operationName,
      operationStatus,
      operationStep,
      operationStepStatus,
      detectors
    };
  }
}

exports.DcsIntegratedEventAdapter = DcsIntegratedEventAdapter;