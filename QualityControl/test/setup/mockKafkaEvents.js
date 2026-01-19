/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { EmitterKeys } from '../../common/library/enums/emitterKeys.enum.js';
import { Transition, TransitionStatus } from '../../common/library/enums/transition.enum.js';

export const ONGOING_RUN_NUMBER = 500001;

/**
 * Mock Kafka events for testing purposes
 * @param {EventEmitter} eventEmitter - Event emitter to emit mock events
 * @returns {Array<number>} - Array of mock ongoing run numbers
 */
export const setupMockKafkaEvents = (eventEmitter) => {
  // Simulate some ongoing runs being started
  const mockOngoingRuns = [ONGOING_RUN_NUMBER.toString(), '500002', '500003'];

  // Emit START_ACTIVITY events for mock runs after a short delay
  setTimeout(() => {
    mockOngoingRuns.forEach((runNumber) => {
      eventEmitter.emit(EmitterKeys.RUN_TRACK, {
        runNumber: parseInt(runNumber, 10),
        transition: Transition.START_ACTIVITY,
        transitionStatus: TransitionStatus.DONE_OK,
        timestamp: Date.now(),
      });
    });
  }, 500);

  return mockOngoingRuns;
};
