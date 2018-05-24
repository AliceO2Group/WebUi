const TObject2JsonClient = require('../lib/TObject2JsonClient.js');

//
// Simple TObject2Json client for testing server side
//
// Command to start server:
// ./bin/tobject2json --backend mysql://.../quality_control --zeromq-server tcp://127.0.0.1:5570 --workers 4
//

(async () => {
  let c = new TObject2JsonClient({host: '127.0.0.1', port: 5570});
  let requests = [
    c.retrieve('daqTask/IDs'),
    c.retrieve('daqTask/IDs'),
    c.retrieve('daqTask/payloadSize'),
    c.retrieve('daqTask/payloadSize'),
    c.retrieve('daqTask/payloadSize'),
    c.retrieve('daqTask/payloadSize'),
  ];
  let result = await Promise.all(requests);
  console.log('Result:', result);
  console.log('Objects loaded:', result.length);

  // Spam of requests
  // setInterval(async () => {
  //   await c.retrieve('daqTask/IDs');
  // }, 1);
})();

