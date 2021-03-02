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

const config = require('./configProvider.js');
const projPackage = require('./../package.json');

const ConsulService = require('@aliceo2/web-ui').ConsulService;
const CCDBConnector = require('./CCDBConnector.js');
const MySQLConnector = require('./MySQLConnector.js');
const AMOREConnector = require('./AMOREConnector.js');
const JsonFileConnector = require('./JsonFileConnector.js');
const LayoutConnector = require('./connector/LayoutConnector.js');
const StatusService = require('./StatusService.js');

const log = new (require('@aliceo2/web-ui').Log)('QualityControlModel');

// --------------------------------------------------------
// Initialization of model according to config file

const jsonDb = new JsonFileConnector(config.dbFile || __dirname + '/../db.json');
const layoutConnector = new LayoutConnector(jsonDb);
module.exports.layoutConnector = layoutConnector;
const statusService = new StatusService(config, projPackage);
module.exports.statusService = statusService;

if (config.consul) {
  const consulService = new ConsulService(config.consul);
  consulService.getConsulLeaderStatus()
    .then(() => log.info('Consul Service connection was successfully tested.'))
    .catch((error) => log.error(
      `Consul Service connection could not be established. Please try restarting the service due to: ${error}`)
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
  const ccdb = new CCDBConnector(config.ccdb);
  ccdb.testConnection();
  module.exports.listObjects = ccdb.listObjects.bind(ccdb);
  module.exports.getObjectTimestampList = ccdb.getObjectTimestampList.bind(ccdb);
  module.exports.queryPrefix = ccdb.prefix;
  statusService.setDataConnector(ccdb);

} else if (config.listingConnector === 'amore') {
  log.info('Object listing: AMORE');
  if (!config.amore) {
    throw new Error('AMORE config is mandatory');
  }
  const amore = new AMOREConnector(config.amore);
  module.exports.listObjects = amore.listObjects.bind(amore);
} else {
  const mysql = new MySQLConnector(config.mysql);
  log.info('Object listing: MySQL');
  module.exports.listObjects = mysql.listObjects.bind(mysql);
}

// --------------------------------------------------------
