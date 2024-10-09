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

const { AliEcsEventMessagesConsumer } = require('./AliEcsEventMessagesConsumer.js');
const { DcsIntegratedEventAdapter } = require('../adapters/DcsIntegratedEventAdapter.js');
const { CacheKeys } = require('../common/cacheKeys.enum.js'); 
const { LogManager } = require('@aliceo2/web-ui');

const INTEGRATED_SERVICES_CONSUMER_GROUP = 'cog-integrated-services';
const INTEGRATED_SERVICES_TOPICS = ['aliecs.integrated_service.dcs'];
const SOR_EVENT_NAME = 'readout-dataflow.dcs.sor';

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

    this._ecsIntegratedServiceConsumer = new AliEcsEventMessagesConsumer(kafkaClient, INTEGRATED_SERVICES_CONSUMER_GROUP, INTEGRATED_SERVICES_TOPICS);
    this._ecsIntegratedServiceConsumer.onMessageReceived(async (eventMessage) => {
      const { timestamp, integratedServiceEvent } = eventMessage;
      try {
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
      } catch (error) {
        this._logger.errorMessage(`Error when parsing event message: ${error.message}\n${error.trace}`);
      }
    });
  }

  /**
   * Start the synchronization process
   *
   * @return {void}
   */
  start() {
    this._logger.infoMessage('Starting to consume AliECS messages for integrated services');
    this._ecsIntegratedServiceConsumer
      .start()
      .catch((error) => this._logger.errorMessage(`Error when starting ECS integrated services consumer: ${error.message}\n${error.trace}`));
  }
}

exports.AliEcsSynchronizer = AliEcsSynchronizer;
