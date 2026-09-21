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

import { AliEcsEventMessagesConsumer, LogManager } from '@aliceo2/web-ui';
import { EmitterKeys } from './../../../common/library/enums/emitterKeys.enum.js';
import { ServiceStatus } from '../../../common/library/enums/Status/serviceStatus.enum.js';

const LOG_FACILITY = `${process.env.npm_config_log_label ?? 'qcg'}/ecs-synchronizer`;
const RUN_TOPICS = ['aliecs.run'];

/**
 * @type {RunEvent}
 * @property {number} runNumber - The run number associated with the event.
 * @property {Transition} transition - The type of transition (e.g., START_ACTIVITY, END_ACTIVITY).
 * @property {TransitionStatus} transitionStatus - The status of the transition (e.g., DONE_OK, DONE_ERROR).
 */

/**
 * Service for processing events sent via Kafka from AliECS with proto objects
 */
export class AliEcsSynchronizer {
  /**
   * Constructor
   * @param {import('kafkajs').Kafka} kafkaClient - configured kafka client
   * @param {KafkaConfiguration.consumerGroups} consumerGroups - consumer groups to be used for various topics
   * @param {EventEmitter} eventEmitter - event emitter to be used to emit events when new data is available
   * @param {typeof AliEcsEventMessagesConsumer} ConsumerClass - class to be used for creating the consumer
   */
  constructor(kafkaClient, consumerGroups, eventEmitter, ConsumerClass = AliEcsEventMessagesConsumer) {
    this._logger = LogManager.getLogger(LOG_FACILITY);
    this._eventEmitter = eventEmitter;

    this._ecsRunConsumer = new ConsumerClass(
      kafkaClient,
      consumerGroups.QCG_RUN,
      RUN_TOPICS,
    );
    this._ecsRunConsumer.onMessageReceived(this._onRunMessage.bind(this));

    this._status = ServiceStatus.NOT_ASKED;
    this._extraInfo = {};
  }

  /**
   * Start the synchronization process and listen to events from various topics via their consumers
   * @returns {Promise<void>}
   */
  async start() {
    this._logger.infoMessage('Starting to consume AliECS messages for topics:');
    this._status = ServiceStatus.ERROR;
    this._extraInfo = {
      // KafkaConsumer is currently not supporting "active" status checking [OGUI-1872]
      message: 'Kafka is configured but the service has not started yet',
    };
    try {
      await this._ecsRunConsumer.start();
      this._status = ServiceStatus.SUCCESS;
    } catch (error) {
      this._logger.errorMessage(`Error when starting ECS run consumer: ${error.message}\n${error.stack}`);
      this._status = ServiceStatus.ERROR;
      this._extraInfo = {
        message: error.message,
      };
    }
  }

  /**
   * Callback for when a message is received on the run topic
   * @param {object} eventMessage - message received on run topic
   * @param {RunEvent} eventMessage.runEvent - the run event object
   * @param {object} eventMessage.timestamp - the timestamp object
   * @returns {void}
   */
  async _onRunMessage(eventMessage) {
    const { runEvent, timestamp } = eventMessage;
    if (!runEvent) {
      this._logger.warnMessage('Received run message on run topic without runEvent field');
      return;
    } if (!runEvent.runNumber) {
      this._logger.warnMessage('Received run message on run topic without runEvent.runNumber field');
    } else if (!runEvent.transition) {
      this._logger.warnMessage('Received run message on run topic without runEvent.transition field');
    } else {
      const { runNumber, transition, transitionStatus } = runEvent;
      this._eventEmitter.emit(EmitterKeys.RUN_TRACK, {
        runNumber,
        transitionStatus,
        transition,
        timestamp: timestamp.toNumber(),
      });
    }
  }

  /**
   * Returns the current kafka service status
   * @returns {ServiceStatus} - The kafka service status
   */
  get status() {
    return this._status;
  }

  /**
   * Returns extra information about the current kafka service
   * @returns {object} - The extra information of the kafka service
   */
  get extraInfo() {
    return this._extraInfo;
  }
}
