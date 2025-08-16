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

const STATUS_COMPONENTS_KEYS = Object.freeze({
  CONSUL_KEY: 'CONSUL',
  GRAFANA_KEY: 'GRAFANA',
  NOTIFICATION_SYSTEM_KEY: 'NOTIFICATION_SYSTEM',
  GENERAL_SYSTEM_KEY: 'GENERAL_SYSTEM',

  ALIECS_SERVICES_KEY: 'ALIECS_SERVICES',
  ALIECS_CORE_KEY: 'ALIECS_CORE',
  APRICOT_KEY: 'APRICOT',
});

module.exports.STATUS_COMPONENTS_KEYS = STATUS_COMPONENTS_KEYS;
