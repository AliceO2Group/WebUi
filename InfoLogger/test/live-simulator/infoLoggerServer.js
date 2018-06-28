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

  client.on('end', onClientDisconnect);
  sendNextLog();

  function sendNextLog() {
    const log = fakeData[currentLogIndex % fakeData.length];
    const timestamp = (new Date()).getTime() / 1000; // seconds
    const nextLogTimeout = 500 + (Math.random() * -500); // [0 ; 500]ms

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

    currentLogIndex++;
    timer = setTimeout(sendNextLog, nextLogTimeout);
  }

  function onClientDisconnect() {
    console.log('Client disconnected');
    clearTimeout(timer);
  }
}
