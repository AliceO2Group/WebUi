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

const LOG_FACILITY = `${process.env.npm_config_log_label ?? 'qcg'}/ecs-synchronizer`;
const RUN_TOPICS = ['aliecs.run'];

/**
 * Service for processing events sent via Kafka from AlIECS with proto objects
 */
export class AliEcsSynchronizer {
  /**
   * Constructor
   * @param {import('kafkajs').Kafka} kafkaClient - configured kafka client
   * @param {KafkaConfiguration.consumerGroups} consumerGroups - instance of CacheService
   * @param {EventEmitter} eventEmitter - event emitter to be used to emit events when new data is available
   */
  constructor(kafkaClient, consumerGroups, eventEmitter) {
    this._logger = LogManager.getLogger(LOG_FACILITY);
    this._eventEmitter = eventEmitter;

    this._ecsRunConsumer = new AliEcsEventMessagesConsumer(
      kafkaClient,
      consumerGroups.QCG_RUN,
      RUN_TOPICS,
    );
    this._ecsRunConsumer.onMessageReceived(this._onRunMessage.bind(this));
  }

  /**
   * Start the synchronization process and listen to events from various topics via their consumers
   * @returns {void}
   */
  start() {
    this._logger.infoMessage('Starting to consume AliECS messages for topics:');
    this._ecsRunConsumer
      .start()
      .catch((error) =>
        this._logger.errorMessage(`Error when starting ECS run consumer: ${error.message}\n${error.stack}`));
  }

  /**
   * Callback for when a message is received on the run topic
   * @param {events.proto.Event} eventMessage - message received on run topic
   * @returns {void}
   */
  async _onRunMessage(eventMessage) {
    const { runEvent, timestamp } = eventMessage;
    if (!runEvent) {
      this._logger.warnMessage('Received run message on run topic without runEvent field');
      return;
    } else {
      const { runNumber, transition } = runEvent;
      this._eventEmitter.emit(EmitterKeys.RUN_TRACK, {
        runNumber,
        transition,
        timestamp: timestamp.toNumber(),
      });
    }
  }
}
