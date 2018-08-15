const log = new (require('@aliceo2/web-ui').Log)('ControlConfig');
const fs = require('fs');
const path = require('path');

/**
 * Config provider is a module exporting the configuration file.
 * It can be first argument of command line OR by default config.js
 */

// Default configuration file
let configFile = path.join(__dirname, '../config.js');

// Replace if provided by command line
if (process.argv.length >= 3 && /\.js$/.test(process.argv[2])) {
  configFile = process.argv[2];
}

try {
  configFile = fs.realpathSync(configFile);
} catch (err) {
  log.error(`Unable to read config file: ${err.message}`);
  process.exit(1);
}

const config = require(configFile);
Log.configure(config);
log.info(`Read config file "${configFile}"`);

module.exports = config;
