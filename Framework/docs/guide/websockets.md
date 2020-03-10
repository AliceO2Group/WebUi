# Backend - WebSocket module
The purpose of WebSocket server is to communicate with the connected clients via RFC 6455 protocol. The server requires each connection and message to be singed with JWT token.
In addition, it allows to filter messages broadcast to connected clients.

#### Instance
```js
const {WebSocket, WebSocketMessage} = require('@aliceo2/web-ui');
WebSocket(HTTP_SERVER);
```
Where:
 * `HTTP_SERVER` instance of HTTP server

### WebSocketMessage class
The WebSocket messages are represented as WebSocketMessage objects.
The object consists of following fields:
 * command - message name
 * code - optional code that indicates type of message (same as HTTP status code)
 * broadcast - flag that states whether the message shoud be broadcast to all connected clients
 * payload - message payload, for users logic
 * message - message that might be set internally
 * id - CERN ID (comes from token)
 * username - CERN username (comes from token)

The message can be constructed using following constructor:
```js
WebSocketMessage(code = 200);
```

The message can be manipulated using setters:
```js
setPayload
setBroadcast
setCommand
```

...and getters:
```js
getPayload
getBroadcast
getProperty
getCode
getToken
```

In addition two methods for encoding and decoding messages to/from JSON are avaialble:
```json
json
parse
```

#### Public methods
```js
bind
```
```js
broadcast
```
```js
unfilteredBroadcast
```
```js
shutdown
```

#### Broadcast filtering

### Example
```js
// Include requred modules
const {HttpServer, WebSocket} = require('@aliceo2/web-ui');

// Prepare HTTP, JWT, and OpenId configuration
...

// Create instance HTTP server
const http = new HttpServer(httpConf, jwtConf, openIdConf);

// Create instance of WebSocket server
const ws = new WebSocket(http);

// Print all messages with topic 'custom-command-from-client'
ws.bind('custom-command-from-client', (message) => console.log(message));

// Send to all clients
const msg = new WebSocketMessage();
msg.command = 'custom-command-from-server';
msg.payload = {...};
ws.broadcast(msg);
```
