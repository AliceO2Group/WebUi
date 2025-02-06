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

const { LogManager, WebSocketMessage } = require('@aliceo2/web-ui');
const {
  InfoLoggerMessageCommands: {
    CONNECTED,
    CLOSED,
    CONNECTION_ISSUE,
  },
} = require('../utils/InfoLoggerMessageCommands.js');

class LiveService {
  /**
   * Live service that allows monitoring of operational logs and emit them to the client via WebSocket
   * @param {WebSocketServer} webSocketServer - WebSocketServer instance
   * @param {object} infoLoggerServerConfig - infoLoggerServer configuration
   * @param {InfoLoggerReceiver} infoLoggerReceiver - InfoLoggerReceiver instance
   */
  constructor(webSocketServer, infoLoggerServerConfig, infoLoggerReceiver) {
    this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'ilg'}/live`);

    this._webSocketServer = webSocketServer;
    this._configuration = infoLoggerServerConfig;
    this._infoLoggerReceiver = infoLoggerReceiver;

    this._isAvailable = false;
  }

  /**
   * Connect to the infoLogger server
   */
  initialize() {
    this._infoLoggerReceiver.connect(this._configuration);

    this._infoLoggerReceiver.on('message', this._parseMessageEvent.bind(this));
    this._infoLoggerReceiver.on('connected', this._parseConnectedEvent.bind(this));
    this._infoLoggerReceiver.on('connection-issue', this._parseConnectionIssueEvent.bind(this));
    this._infoLoggerReceiver.on('close', this._parseCloseEvent.bind(this));
  }

  /**
   * In the event of a received message, create a WebSocketMessage and broadcast it
   * @param {object} message - message of similar structure to InfoLoggerMessage
   * @private
   */
  _parseMessageEvent(message) {
    const msg = new WebSocketMessage()
      .setCommand('live-log')
      .setPayload(message);
    this._webSocketServer.broadcast(msg);
  }

  /**
   * In the event of a connected message, broadcast it to all clients
   */
  _parseConnectedEvent() {
    this._isAvailable = true;
    this._logger.infoMessage('Connected to InfoLogger server');
    this._webSocketServer.unfilteredBroadcast(new WebSocketMessage().setCommand(CONNECTED));
  }

  /**
   * In the event of a connection issue, broadcast it to all clients
   */
  _parseConnectionIssueEvent() {
    this._isAvailable = false;
    this._logger.errorMessage('Connection to InfoLogger server issue');
    this._webSocketServer.unfilteredBroadcast(new WebSocketMessage().setCommand(CONNECTION_ISSUE));
  }

  /**
   * In the event of a close message, broadcast it to all clients
   */
  _parseCloseEvent() {
    this._isAvailable = false;
    this._logger.infoMessage('Connection to InfoLogger server closed');
    this._webSocketServer.unfilteredBroadcast(new WebSocketMessage().setCommand(CLOSED));
  }

  /**
   * Getter for the availability of the service
   * @returns {boolean} - availability of the service
   */
  get isAvailable() {
    return this._isAvailable;
  }
}

module.exports.LiveService = LiveService;
