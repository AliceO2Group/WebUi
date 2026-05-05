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

/* eslint-disable no-console */
/* eslint-disable require-jsdoc */

// Documentation:
// https://nodejs.org/api/net.html#net_net_createserver_options_connectionlistener

const net = require('net');
const fakeData = require('./fakeData.json');

const createServer = () => {
  const server = net.createServer(connectionListener);
  const port = 6102; // infoLoggerServer default port

  function connectionListener(client) {
    console.log('[InfoLogger Server] Client connected at:', new Date().toISOString());
    let timer;
    let currentLogIndex = 0;

    client.on('close', onClientDisconnect);
    client.on('end', onClientDisconnect);
    client.on('error', (error) => {
      console.error('[InfoLogger Server] Client socket error:', error.code, error.message);
      console.error('[InfoLogger Server] Error occurred at:', new Date().toISOString());
      if (error.stack) {
        console.error('[InfoLogger Server] Stack trace:', error.stack);
      }
      clearTimeout(timer);
    });
    sendNextLog();

    function sendNextLog() {
      const log = fakeData[currentLogIndex % fakeData.length];
      const timestamp = (new Date()).getTime() / 1000; // seconds
      const nextLogTimeout = 100 - (Math.random() * 100); // [0 ; 500]ms

      // switch protocol after each log sent to try both protocols
      if (currentLogIndex % 2 === 1) {
        client.write(`*1.4#` +
          `${log.severity || ''}#` +
          `${log.level || ''}#` +
          `${timestamp || ''}#` +
          `${log.hostname || ''}#` +
          `${log.rolename || ''}#` +
          `${log.pid || ''}#` +
          `${log.username || ''}#` +
          `${log.system || ''}#` +
          `${log.facility || ''}#` +
          `${log.detector || ''}#` +
          `${log.partition || ''}#` +
          `${log.run || ''}#` +
          `${log.errcode || ''}#` +
          `${log.errline || ''}#` +
          `${log.errsource || ''}#` +
          `${log.message || ''}\r\n`);
      } else {
        client.write(`*1.3#` +
          `${log.severity || ''}#` +
          `${log.level || ''}#` +
          `${timestamp || ''}#` +
          `${log.hostname || ''}#` +
          `${log.rolename || ''}#` +
          `${log.pid || ''}#` +
          `${log.username || ''}#` +
          `${log.system || ''}#` +
          `${log.facility || ''}#` +
          `${log.detector || ''}#` +
          `${log.partition || ''}#` +
          `#` + // dest field
          `${log.run || ''}#` +
          `${log.errcode || ''}#` +
          `${log.errline || ''}#` +
          `${log.errsource || ''}#` +
          `${log.message || ''}\r\n`);
      }

      currentLogIndex++;
      timer = setTimeout(sendNextLog, nextLogTimeout);
    }

    function onClientDisconnect() {
      console.log('[InfoLogger Server] Client disconnected at:', new Date().toISOString());
      clearTimeout(timer);
    }
  }

  server.on('error', (error) => {
    console.error('[InfoLogger Server] Server error occurred at:', new Date().toISOString());
    console.error('[InfoLogger Server] Error code:', error.code);
    console.error('[InfoLogger Server] Error message:', error.message);
    if (error.stack) {
      console.error('[InfoLogger Server] Stack trace:');
      console.trace(error);
    }
  });

  server.on('close', () => {
    console.log('[InfoLogger Server] Server closed at:', new Date().toISOString());
  });

  server.listen(port, () => {
    console.log(`[InfoLogger Server] InfoLoggerServer is running on port ${port}`);
  });
  return server
}

const closeServer = (server) => {
  console.log('[InfoLogger Server] Closing server at:', new Date().toISOString());
  try {
    if (server && server.listening) {
      server.close((err) => {
        if (err) {
          console.error('[InfoLogger Server] Error closing server:', err.message);
        } else {
          console.log('[InfoLogger Server] Server closed successfully');
        }
      });
    }
  } catch (err) {
    console.error('[InfoLogger Server] Exception while closing server:', err.message);
    console.error('[InfoLogger Server] Stack:', err.stack);
  }
}

module.exports = {createServer, closeServer};