# ZeroMQ client

### Module include
```js
const ZeroMQClient = require('@aliceo2/aliceo2-gui').ZeroMQClient;
```

### API
```js
ZeroMQClient(IP, PORT, PATTERN);
```
Where:
 * `IP`
 * `PORT`
 * `PATTERN`

### Example
```js
const ZeroMQClient = require('@aliceo2/aliceo2-gui').ZeroMQClient;
const zmqReq = new ZeroMQClient('zeromq.cern.ch', '1234', 'req');
```

## ZeroMQ installation note
If you have installed ZeroMQ under custom path, npm install will fail with : `fatal error: zmq.h: No such file or directory`.
To resolve this issue you need to recompile zmq module.

1. Go to `ControGui` directory
2. Download `zeromq` modue
 ```
 curl `npm v zeromq dist.tarball` | tar xvz && mv package/ node_modules/zeromq/
 ```
3. Add ZeroMQ include directory to `node_modules/zeromq/binding.gyp` file after line 67
 ```
 '-I/<ZeroMQPath>/include/'
 ```
4. Run again 
 ```
 npm install
 ```
