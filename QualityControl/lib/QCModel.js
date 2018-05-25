const config = require('./configProvider.js');
const InformationServiceState = require('./InformationServiceState.js');
const TObject2JsonClient = require('./TObject2JsonClient.js');
const CCDBConnector = require('./CCDBConnector.js');
const MySQLConnector = require('./MySQLConnector.js');

const {log} = require('@aliceo2/web-ui');

// --------------------------------------------------------
// Initialization of model according to config file

if (!config.mysql) {
  throw new Error('MySQL config is mandatory at least for layout saving');
}
const mysql = new MySQLConnector(config.mysql);

if (!config.tobject2json) {
  throw new Error('TObject2Json config is mandatory');
}
const tObject2JsonClient = new TObject2JsonClient(config.tobject2json);

const is = new InformationServiceState();
if (config.informationService) {
  log.info('Information service: starting synchronization');
  is.startSynchronization(config.informationService);
} else {
  log.info('Information service: no configuration found');
}

if (config.listingConnector === 'ccdb') {
  log.info('Object listing: using CCDB');
  if (!config.ccdb) {
    throw new Error('CCDB config is mandatory');
  }
  const ccdb = new CCDBConnector(config.ccdb);
  module.exports.listObjects = ccdb.listObjects.bind(ccdb);
} else {
  log.info('Object listing: using MySQL');
  module.exports.listObjects = mysql.listObjects.bind(mysql);
}

// --------------------------------------------------------

module.exports.readLayout = mysql.readLayout.bind(mysql);
module.exports.writeLayout = mysql.writeLayout.bind(mysql);
module.exports.listLayouts = mysql.listLayouts.bind(mysql);
module.exports.createLayout = mysql.createLayout.bind(mysql);
module.exports.deleteLayout = mysql.deleteLayout.bind(mysql);

module.exports.informationService = is;

module.exports.readObjectData = tObject2JsonClient.retrieve.bind(tObject2JsonClient);
