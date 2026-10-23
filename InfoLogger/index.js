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

const fs = require('fs');
const path = require('path');
const { HttpServer, WebSocket, LogManager } = require('@aliceo2/web-ui');

const config = require('./lib/configProvider.js');
const api = require('./lib/api.js');

// -------------------------------------------------------

const isDev = process.env.NODE_ENV === 'development';
const VITE_HMR_PORT = 5173;

// Start server HTTP and bind WebSocket to it; the HMR port is only allowed in CSP during development
const http = new HttpServer({
  ...config.http,
  ...isDev && { extraConnectSrc: [`ws://${config.http.hostname ?? 'localhost'}:${VITE_HMR_PORT}`] },
}, config.jwt, config.openId);
const ws = new WebSocket(http);

const logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'ilg'}/index`);

// Expose application to /
const start = async () => {
  if (isDev) {
    logger.infoMessage(`Serving frontend files through Vite middleware, HMR on port ${VITE_HMR_PORT}`);
    const { createServer } = require('vite');

    const vite = await createServer({
      server: { middlewareMode: true, hmr: { port: VITE_HMR_PORT } },
      appType: 'mpa',
    });

    // Vite ends unmatched requests with 404, so API calls must skip it
    http.routerStatics.use((req, res, next) =>
      req.path.startsWith('/api/') ? next() : vite.middlewares(req, res, next));
  } else {
    const distPath = path.join(__dirname, 'dist');
    if (!fs.existsSync(distPath)) {
      logger.errorMessage(`Frontend build not found at ${distPath}, run "npm run build" first`);
    } else {
      logger.infoMessage(`Serving frontend files from ${distPath}`);
    }
    http.addStaticPath(distPath);
  }

  // Attach services to web server
  api.attachTo(http, ws);
};

start().catch((error) => {
  logger.errorMessage(`Failed to start InfoLogger GUI: ${error.message}`);
  process.exit(1);
});
