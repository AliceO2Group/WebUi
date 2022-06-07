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

const config = require('./config/configProvider.js');
const projPackage = require('./../package.json');
const jsroot = require('jsroot');

const ConsulService = require('@aliceo2/web-ui').ConsulService;
const CcdbService = require('./services/CcdbService.js');
const JsonFileService = require('./services/JsonFileService.js');
const LayoutController = require('./controllers/LayoutController.js');
const StatusService = require('./StatusService.js');
const UserService = require('./services/UserService.js');
const ObjectController = require('./controllers/ObjectController.js');

const log = new (require('@aliceo2/web-ui').Log)(`${process.env.npm_config_log_label ?? 'qcg'}/model`);

// --------------------------------------------------------
// Initialization of model according to config file
const statusService = new StatusService(config, projPackage);
module.exports.statusService = statusService;

const jsonDb = new JsonFileService(config.dbFile || __dirname + '/../db.json');
module.exports.userService = new UserService(jsonDb);
module.exports.layoutService = new LayoutController(jsonDb);

if (config.consul) {
  const consulService = new ConsulService(config.consul);
  consulService.getConsulLeaderStatus()
    .then(() => log.info('Consul Service connection was successfully tested.'))
    .catch((error) => log.error('Consul Service connection could not be established. '
      + `Please try restarting the service due to: ${error}`)
    );
  module.exports.consulService = consulService;
  statusService.setLiveModeConnector(consulService);
} else {
  log.warn('Consul Service: No Configuration Found');
  module.exports.consulService = undefined;
}

if (config.listingConnector === 'ccdb') {
  log.info('Object listing: CCDB');
  if (!config.ccdb) {
    throw new Error('CCDB config is mandatory');
  }
  const ccdb = new CcdbService(config.ccdb);
  ccdb.testConnection();
  module.exports.listObjects = ccdb.listObjects.bind(ccdb);
  module.exports.getObjectTimestampList = ccdb.getObjectTimestampList.bind(ccdb);
  module.exports.queryPrefix = ccdb.prefix;

  module.exports.objectController = new ObjectController(ccdb, jsroot);
  module.exports.layoutService = new LayoutController(jsonDb);
  statusService.setDataConnector(ccdb);

}

// --------------------------------------------------------
