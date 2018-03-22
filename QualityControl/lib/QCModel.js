const zmq = require('zeromq');
const config = require('../config.js');
// const mysql = require('@aliceo2/aliceo2-gui/db/mysql.js');

module.exports.retrieve = retrieve;

/**
 * Retrieve a monitoring object (TObject)
 * @param {string} agentName
 * @param {string} objectName
 * @return {object} javascript representation of monitoring object
 */

function retrieve(agentName, objectName) {
  return new Promise((resolve, reject) => {
    // events and close method are buggy, we just watch message and timeout to know if it succeded
    // new official version is coming here from the same author https://github.com/rolftimmermans/zeromq-ng
    const req = zmq.socket('req');
    const timer = setTimeout(() => {
      req.close();
      reject('timeout');
    }, 2000);

    try {
      console.time('retrieve');
      req.connect(config.tobject2json.endpoint);
      req.send([agentName, objectName].join(' '));
    } catch (e) {
      clearTimeout(timer);
      reject('zmq: ' + e.message);
    }
    req.on('message', (msg) => {
      console.timeEnd('retrieve');
      clearTimeout(timer);
      console.log('received message', msg.toString().length);
      req.close();
      resolve(msg.toString());
    });
  });
}
