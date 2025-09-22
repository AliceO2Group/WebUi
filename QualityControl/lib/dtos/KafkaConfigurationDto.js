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

import Joi from 'joi';

/**
 * @typedef {KafkaConfiguration}
 * @param {boolean} enabled - if kafka should be used in current deployment
 * @param {string} clientId - ID to be used as client and not qc-gui
 * @param {Map<string, string>} consumerGroups - topics to be followed
 * @param {string[]} brokers - brokers to connect to
 */

/**
 * Function for validating the Kafka configuration
 * @returns {KafkaConfiguration} - validated kafka configuration to be used
 * @throws {InvalidInputError}
 */
export const KafkaConfigDto = Joi.object({
  enabled: Joi.boolean().default(false),
  clientId: Joi.string().invalid('qc-gui'),
  consumerGroups: Joi.object().custom((obj, helpers) => {
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'qcg-run' || value === 'qcg-run') {
        return helpers.error('any.invalid');
      }
    }
    return obj;
  }, 'No key or value can be qcg-run'),
  brokers: Joi.array().items(Joi.string()),
});
