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

'use strict';
const ConsulService = require('./services/consul.service.js');
const HttpServer = require('./http/server.js');
const InfoLoggerReceiver = require('./log/InfoLoggerReceiver.js');
const InfoLoggerSender = require('./log/InfoLoggerSender.js');
const Jira = require('./services/jira.js');
const O2TokenService = require('./services/O2TokenService.js');
const { LogLevel } = require('./log/LogLevel.js');
const { LogSeverity } = require('./log/LogSeverity.js');
const { LogManager, Log } = require('./log/LogManager.js');
const MySQL = require('./db/mysql.js');
const NotificationService = require('./services/notification.js');
const WebSocket = require('./websocket/server.js');
const WebSocketMessage = require('./websocket/message.js');

const { InvalidInputError } = require('./errors/InvalidInputError.js');
const { NotFoundError } = require('./errors/NotFoundError.js');
const { ServiceUnavailableError } = require('./errors/ServiceUnavailableError.js');
const { TimeoutError } = require('./errors/TimeoutError.js');
const { UnauthorizedAccessError } = require('./errors/UnauthorizedAccessError.js');
const { grpcErrorToNativeError } = require('./errors/grpcErrorToNativeError.js');
const {
  updateAndSendExpressResponseFromNativeError,
} = require('./errors/updateAndSendExpressResponseFromNativeError.js');
const { Logger } = require('./log/Logger');

exports.ConsulService = ConsulService;

exports.HttpServer = HttpServer;

exports.InfoLoggerReceiver = InfoLoggerReceiver;

exports.InfoLoggerSender = InfoLoggerSender;

exports.Jira = Jira;

exports.O2TokenService = O2TokenService;

exports.Log = Log;

exports.LogManager = LogManager;

// Use only as type, use LogManager to create loggers
exports.Logger = Logger;

exports.LogLevel = LogLevel;

exports.LogSeverity = LogSeverity;

exports.MySQL = MySQL;

exports.NotificationService = NotificationService;

exports.WebSocket = WebSocket;

exports.WebSocketMessage = WebSocketMessage;

exports.InvalidInputError = InvalidInputError;

exports.NotFoundError = NotFoundError;

exports.ServiceUnavailableError = ServiceUnavailableError;

exports.TimeoutError = TimeoutError;

exports.UnauthorizedAccessError = UnauthorizedAccessError;

exports.grpcErrorToNativeError = grpcErrorToNativeError;

exports.updateAndSendExpressResponseFromNativeError = updateAndSendExpressResponseFromNativeError;
