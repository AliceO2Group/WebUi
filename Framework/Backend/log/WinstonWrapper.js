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

const {createLogger, format, transports: {Console, File}} = require('winston');

/**
 * Creates AliceO2 Winston Wrapper
 * It allows the usage of two transports console and file (if properly configured)
 */
class WinstonWrapper {
  /** 
   * Constructor for the ALICEO2 WinstonWrapper which allows custom formatting and transport
   * @param {JSON} config configuration for console and file transports
   */
  constructor(config = {}) {
    this._instance = createLogger({
      transports: [
        this._consoleTransport(config),
        ...(config.file ? this._fileTransport(config) : []),
      ],
      exitOnError: true,
    });
  }

  /**
   * Configures the console formatter and returns a new instance of it
   * Messages will be prefixed with a timestamp and a label
   * @example
   * // 2022-10-22T10:27:53.903Z [test/service] debug: Created default instance of console logger
   * @param {JSON} - object which may contain console transport configuration fields
   * @returns {winston.transports.ConsoleTransportInstance}
   */
  _consoleTransport({consoleSystemd = undefined, consoleLvl = 'debug'}) {
    // Mapping between winston levels and journalctl priorities
    const systemdPr = {
      debug: '<7>',
      info: '<6>',
      warn: '<4>',
      error: '<3>',
      verbose: '<2>',
    };

    const formatter = format.printf((log) => {
      const prefix = consoleSystemd ? systemdPr[log.level] : log.timestamp;
      const label = log.label ? `[${log.label}]` : '[gui/log]';
      const output = `${log.level}: ${log.message}`;
      
      return `${prefix} ${label} ${output}`;
    });

    return new Console({
      level: consoleLvl,
      format: format.combine(
        format.timestamp(),
        format.colorize(),
        formatter
      )
    });
  }

  /**
   * Configures the file transporter and returns a new instance of it
   * Messages will be prefixed with a timestamp and printed using the winston formatter
   * @param {JSON} - object which may contain file transport configuration fields
   * @returns {winston.transports.FileTransportInstance}
   */
  _fileTransport({file, fileLvl = 'info'}) {
    return new File({
      level: fileLvl,
      filename: file,
      format: format.combine(
        format.timestamp(),
        format.prettyPrint()
      )
    });
  }

  /**
   * Returns an instance of AliceO2 Winston Wrapper
   * @return {Logger}
   */
  get instance() {
    return this._instance;
  }
}

module.exports = WinstonWrapper;
