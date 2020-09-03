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

// Documentation:
// https://nodejs.org/api/net.html#net_net_createserver_options_connectionlistener

const net = require('net');
const fakeData = require('./fakeData.json');
const server = net.createServer(connectionListener);
const port = 6102; // infoLoggerServer default port
server.listen(port);
console.log(`InfoLoggerServer is running on port ${port}`);

function connectionListener(client) {
  console.log('Client connected');
  let timer;
  let currentLogIndex = 0;

  client.on('close', onClientDisconnect);
  sendNextLog();

  function sendNextLog() {
    const log = fakeData[currentLogIndex % fakeData.length];
    const timestamp = (new Date()).getTime() / 1000; // seconds
    const nextLogTimeout = 500 + (Math.random() * -500); // [0 ; 500]ms

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
    console.log('Client disconnected');
    clearTimeout(timer);
  }
}
