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
const { DcsIntegratedEventAdapter } = require('../adapters/DcsIntegratedEventAdapter.js');
const { environmentEventAdapter } = require('./adapters/environmentEventAdapter.js');
const { runEventAdapter } = require('./adapters/runEventAdapter.js');
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
   */
  constructor(kafkaClient, cacheService) {
    this._cacheService = cacheService;  
    this._logger = LogManager.getLogger('cog/ali-ecs-synchronizer');

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
  _onEnvironmentMessage(eventMessage) {
    const environment = environmentEventAdapter(eventMessage);
    const { timestamp, id } = environment;
    this._logger.debugMessage(`Received at ${timestamp} environment event message for ${id}`);
  }

  /**
   * Callback for when a message is received on the run topic
   * @param {Object} eventMessage - message received on run topic
   * @return {void}
   */
  _onRunMessage(eventMessage) {
    const run = runEventAdapter(eventMessage);
    const { timestamp, runNumber } = run;
    this._logger.debugMessage(`Received at ${timestamp} run event message for ${runNumber}`);
  }
}

exports.AliEcsSynchronizer = AliEcsSynchronizer;
