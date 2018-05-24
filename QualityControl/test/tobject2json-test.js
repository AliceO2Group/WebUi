const ZeroMQClient = require('@aliceo2/web-ui').ZeroMQClient;

//
// Simple TObject2Json client for testing server side
//
// Command to start server:
// ./bin/tobject2json --backend mysql://.../quality_control --zeromq-server tcp://127.0.0.1:5570 --workers 4
//

const zmqDealer = new ZeroMQClient(
  '127.0.0.1',
  5570,
  'dealer'
);
zmqDealer.on('message', (m) => {
  console.log('client received:', m);
});
setInterval(() => {
  zmqDealer.send('daqTask/IDs');
}, 1000);
