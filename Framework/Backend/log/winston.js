/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

const winston = require('winston');

// Maping between winston levels and journalctl priorities
const systemdPr = {
  debug: '<7>',
  info: '<6>',
  warn: '<4>',
  error: '<3>'
};

/**
 * Creates Winston logger
 * Uses two transports file and console (if properly configured)
 * @author Adam Wegrzynek <adam.wegrzynek@cern.ch>
 */
class Winston {
  /** Creates two transports and constructs a logger
   * @param {object} config configuration for console and file transports
   */
  constructor(config) {
    if (!config) {
      config = {};
    }
    config.consoleLvl = config.consoleLvl || 'debug';

    const consoleFormatter = winston.format.printf((log) => {
      let output = `${log.level}: ${log.message}`;
      if (log.hasOwnProperty('label')) {
        output = `[${log.label}] ${output}`;
      }
      if (config.hasOwnProperty('systemd')) {
        output = systemdPr[log.level] + output;
      } else {
        output = `${log.timestamp}  ${output}`
      }
      return output;
    });

    const transports = [
      new (winston.transports.Console)({
        level: config.consoleLvl,
        format: winston.format.combine(
          winston.format.timestamp(),
          consoleFormatter
        )}
      )
    ];

    if (config.file) {
      config.fileLvl = config.fileLvl || 'info';
      transports.push(new winston.transports.File({
        filename: config.file,
        level: config.fileLvl,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.prettyPrint()
        )
      }));
    }

    this.instance = winston.createLogger({
      transports: transports,
      exitOnError: true
    });
  }
}
module.exports = Winston;
