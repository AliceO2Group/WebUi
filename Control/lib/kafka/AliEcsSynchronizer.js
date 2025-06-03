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
const {
  EmitterKeys: {
    ENVIRONMENTS_TRACK,
    TASKS_TRACK,
    INTEGRATED_SERVICES_TRACK: { ODC }
  }
} = require('./../common/emitterKeys.enum.js');
const { fromEcsIntegratedServiceEventToEvent } = require('./adapters/fromEcsIntegratedServiceEventToEvent.js');
const { runEventAdapter } = require('./adapters/runEventAdapter.js');
const { taskEventAdapter } = require('./adapters/taskEventAdapter.js');
const { fromEcsEventToEnvironmentEvent } = require('./adapters/fromEcsEventToEnvironmentEvent.js');
const { adaptInt64ToNumber } = require('../common/utils/adaptInt64ToNumber.js');
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

    this._odcConsumer = new AliEcsEventMessagesConsumer(
      kafkaClient,
      ConsumerGroups.INTEGRATED_SERVICE.ODC,
      Topics.INTEGRATED_SERVICE.ODC
    );
    this._odcConsumer.onMessageReceived(this._onIntegratedServiceOdcMessage.bind(this));
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
    this._odcConsumer
      .start()
      .catch((error) =>
        this._logger.errorMessage(
          `Error when starting ECS ODC consumer: ${error.message}\n${error.stack}`
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
   * ODC messages are based on multiple operations and steps, we need to adapt the message to the operation name and step
   * * operation name is suffixed with `readout-dataflow.odc.` - that is an operation belonging to an ECS environment transition
   * * * e.g. `readout-dataflow.odc.reset`, `readout-dataflow.odc.part-term`, `readout-dataflow.odc.cleanup`
   * * operation name is suffixed with `odc.deviceStateChanged` - that is a task change that needs to be propagated to task-counters and epn-page if user has the page opened
   * * operation name is suffixed with `odc.partitionStateChanged` - that is a change of ODC in general that needs to be propagated to environment-details page
   * Depending on the operation name the message is propagated to the corresponding track
   * @param {Ev_IntegratedServiceEvent - Events.proto} eventMessage - message received on integrated service ODC topic
   * @return {void}
   */
  async _onIntegratedServiceOdcMessage(eventMessage) {
    const ODC_PARTITION_STATE_CHANGED_PREFIX = 'odc.partitionStateChanged';

    if (!eventMessage?.integratedServiceEvent) {
      this._logger.errorMessage(
        `Received odc integrated service event message without integratedServiceEvent: ${JSON.stringify(eventMessage)}`
      );
      return;
    }
    const event = fromEcsIntegratedServiceEventToEvent(eventMessage);
    const integratedServiceEvent = {
      timestamp: event.timestamp,
      ...event
    };
    if (integratedServiceEvent.name.startsWith(ODC_PARTITION_STATE_CHANGED_PREFIX)) {
      this._eventEmitter.emit(ODC.ENVIRONMENT_STATE_CHANGE, integratedServiceEvent);
    }
  }

  /**
   * Callback for when a message is received on the environment topic
   * @param {Object} eventMessage - message received on environment topic
   * @return {void}
   */
  async _onEnvironmentMessage(eventMessage) {
    if (!eventMessage?.environmentEvent) {
      this._logger.errorMessage(
        `Received environment event message without environmentEvent: ${JSON.stringify(eventMessage)}`
      );
      return;
    }
    const environmentEvent = fromEcsEventToEnvironmentEvent(eventMessage);
    environmentEvent.timestamp = adaptInt64ToNumber(eventMessage.timestamp);
    this._eventEmitter.emit(ENVIRONMENTS_TRACK, environmentEvent);
  }

  /**
   * Callback for when a message is received on the run topic
   * @param {Object} eventMessage - message received on run topic
   * @return {void}
   */
  async _onRunMessage(eventMessage) {
    runEventAdapter(eventMessage);
  }

  /**
   * Callback for when a message is received on the task topic
   * @param {Object} eventMessage - message received on task topic
   * @return {void}
   */
  async _onTaskMessage(eventMessage) {
    if (!eventMessage?.taskEvent) {
      this._logger.errorMessage(
        `Received task event message without taskEvent: ${JSON.stringify(eventMessage)}`
      );
      return;
    }
    const { timestamp: timestampInt64 } = eventMessage;
    const timestamp = adaptInt64ToNumber(timestampInt64);
    const taskEvent = taskEventAdapter(eventMessage);
    this._eventEmitter.emit(TASKS_TRACK, {timestamp, taskEvent});
  }
}

exports.AliEcsSynchronizer = AliEcsSynchronizer;
