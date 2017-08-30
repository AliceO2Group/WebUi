const assert = require('assert');
const zmq = require('zeromq');
const config = require('./../config.json');
const ZeroMQClient = require('./../zeromq/client');

// start zeromq server
const socket = zmq.socket('pub');
socket.bindSync('tcp://' + config.zeromq.sub.ip + ':' + config.zeromq.sub.port);

// lauch the application
const zmqSub = new ZeroMQClient(config.zeromq.sub.ip, config.zeromq.sub.port, 'sub');

zmqSub.on('message', function(message) {
  assert.equal(message.command, 'notification', 'Notification not received');
});
describe('ws-notifications', () => {
  it('should receive notification', (done) => {
    let response = {
      command: 'notification',
      title: 'testTitle',
      message: 'testMessage'
    };
    socket.send(JSON.stringify(response));
    done();
  });
});
