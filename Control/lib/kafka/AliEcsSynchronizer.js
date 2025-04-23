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

const { AliEcsEventMessagesConsumer, LogManager } = require('@aliceo2/web-ui');
const { CacheKeys } = require('../common/cacheKeys.enum.js'); 
const { ConsumerGroups } = require('./enums/consumerGroups.enum.js');
const { EmitterKeys: {ENVIRONMENTS_TRACK} } = require('./../common/emitterKeys.enum.js');
const { DcsIntegratedEventAdapter } = require('../adapters/DcsIntegratedEventAdapter.js');
const { runEventAdapter } = require('./adapters/runEventAdapter.js');
const { taskEventAdapter } = require('./adapters/taskEventAdapter.js');
const { Topics } = require('./enums/topics.enum.js');

/**
 * Utility synchronizing AliECS data into control-gui, listening to kafka
 */
class AliEcsSynchronizer {
  /**
   * Constructor
   *
   * @param {import('kafkajs').Kafka} kafkaClient - configured kafka client
   * @param {CacheService} cacheService - instance of CacheService
   * @param {EventEmitter} eventEmitter - instance of own EventEmitter 
   */
  constructor(kafkaClient, cacheService, eventEmitter) {
    this._logger = LogManager.getLogger('cog/ali-ecs-synchronizer');

    this._cacheService = cacheService;  
    this._eventEmitter = eventEmitter;

    this._ecsIntegratedServiceDcsConsumer = new AliEcsEventMessagesConsumer(
      kafkaClient,
      ConsumerGroups.INTEGRATED_SERVICE.DCS,
      Topics.INTEGRATED_SERVICE.DCS
    );
    this._ecsIntegratedServiceDcsConsumer.onMessageReceived(this._onIntegratedServiceDcsMessage.bind(this));

    this._ecsEnvironmentConsumer = new AliEcsEventMessagesConsumer(
      kafkaClient,
      ConsumerGroups.ENVIRONMENT,
      Topics.ENVIRONMENT
    );
    this._ecsEnvironmentConsumer.onMessageReceived(this._onEnvironmentMessage.bind(this));

    this._ecsRunConsumer = new AliEcsEventMessagesConsumer(
      kafkaClient,
      ConsumerGroups.RUN,
      Topics.RUN
    );
    this._ecsRunConsumer.onMessageReceived(this._onRunMessage.bind(this));

    this._ecsTaskConsumer = new AliEcsEventMessagesConsumer(
      kafkaClient,
      ConsumerGroups.TASK,
      Topics.TASK
    );
    this._ecsTaskConsumer.onMessageReceived(this._onTaskMessage.bind(this));
  }

  /**
   * Start the synchronization process and listen to events from various topics via their consumers
   * @return {void}
   */
  start() {
    this._logger.infoMessage('Starting to consume AliECS messages for topics:');
    this._ecsIntegratedServiceDcsConsumer
      .start()
      .catch((error) =>
        this._logger.errorMessage(
          `Error when starting ECS integrated services consumer: ${error.message}\n${error.stack}`
        )
      );
    this._ecsEnvironmentConsumer
      .start()
      .catch((error) =>
        this._logger.errorMessage(
          `Error when starting ECS environment consumer: ${error.message}\n${error.stack}`
        )
      );
    this._ecsRunConsumer
      .start()
      .catch((error) =>
        this._logger.errorMessage(
          `Error when starting ECS run consumer: ${error.message}\n${error.stack}`
        )
      );
    this._ecsTaskConsumer
      .start()
      .catch((error) =>
        this._logger.errorMessage(
          `Error when starting ECS task consumer: ${error.message}\n${error.stack}`
        )
      );
  }

  /**
   * Callback for when a message is received on the integrated service DCS topic
   * @param {Object} eventMessage - message received from integrated service
   * @return {void}
   */
  async _onIntegratedServiceDcsMessage(eventMessage) {
    const { timestamp, integratedServiceEvent } = eventMessage;
    const SOR_EVENT_NAME = 'readout-dataflow.dcs.sor';
    if (integratedServiceEvent.name === SOR_EVENT_NAME) {
      const dcsSorEvent = DcsIntegratedEventAdapter.buildDcsIntegratedEvent(integratedServiceEvent, timestamp);
      if (!dcsSorEvent) {
        return;
      }
      const { environmentId } = dcsSorEvent;
      let cachedDcsSteps = this._cacheService.getByKey(CacheKeys.DCS.SOR);
      if (!cachedDcsSteps) {
        cachedDcsSteps = {};
      }
      if (!cachedDcsSteps?.[environmentId]) {
        cachedDcsSteps[environmentId] = {
          displayCache: true,
          dcsOperations: [dcsSorEvent]
        };
      } else {
        cachedDcsSteps[environmentId].dcsOperations.push(dcsSorEvent);
      }
      cachedDcsSteps[environmentId].dcsOperations.sort((a, b) => a.timestamp - b.timestamp);
      this._cacheService.updateByKeyAndBroadcast(CacheKeys.DCS.SOR, cachedDcsSteps, {command: CacheKeys.DCS.SOR});
    }
  }

  /**
   * Callback for when a message is received on the environment topic
   * @param {Object} eventMessage - message received on environment topic
   * @return {void}
   */
  async _onEnvironmentMessage(eventMessage) {
    this._eventEmitter.emit(ENVIRONMENTS_TRACK, eventMessage);
  }

  /**
   * Callback for when a message is received on the run topic
   * @param {Object} eventMessage - message received on run topic
   * @return {void}
   */
  async _onRunMessage(eventMessage) {
    const run = runEventAdapter(eventMessage);
    const { timestamp, runNumber } = run;
    this._logger.debugMessage(`Received at ${timestamp} run event message for ${runNumber}`);
  }

  /**
   * Callback for when a message is received on the task topic
   * @param {Object} eventMessage - message received on task topic
   * @return {void}
   */
  async _onTaskMessage(eventMessage) {
    const task = taskEventAdapter(eventMessage);
    const { timestamp, taskId, environmentId } = task;
    this._logger.debugMessage(
      `Received at ${timestamp} task event message for ${taskId} of environment ${environmentId}`
    );
  }
}

exports.AliEcsSynchronizer = AliEcsSynchronizer;
