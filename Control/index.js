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

const path = require('path');
const {HttpServer, WebSocket} = require('@aliceo2/web-ui');

const config = require('./lib/config/configProvider.js');
const {buildPublicConfig} = require('./lib/config/publicConfigProvider.js');
const api = require('./lib/api.js');

// -------------------------------------------------------

buildPublicConfig(config);

const http = new HttpServer(config.http, config.jwt, config.openId);
const ws = new WebSocket(http);
http.addStaticPath(path.join(__dirname, 'public'));
api.setup(http, ws);
