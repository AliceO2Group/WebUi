# Backend - WebSocket module
WebSocket server communicates with the connected clients via RFC 6455 protocol. The server requires each new connection and message to be singed with JWT token.
In addition, it allows filtering messages broadcast to connected clients.

#### Instance
```js
const {WebSocket, WebSocketMessage} = require('@aliceo2/web-ui');
WebSocket(HTTP_SERVER);
```
Where:
 * `HTTP_SERVER` - instance of HTTP server

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

#### WebSocketMessage class
The WebSocket messages are represented as WebSocketMessage objects.
The object consists of following fields:
 * command - message name
 * code - optional code that indicates type of message (same as HTTP status code)
 * broadcast - flag that states whether the message shoud be broadcast to all connected clients
 * payload - message payload, for users logic
 * message - message that might be set internally
 * id - CERN ID (comes from token)
 * username - CERN username (comes from token)

A message can be constructed in following way:
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
```js
json
parse
```

#### Broadcast filtering
Connecting clients may decide which broadcast messages they receive from server. This can be done by sending "filter" command (use `setFilter` of frontends' WebSocketClient).
The filter must be passed as stringified JavaScript function receiving WebSocketMessage object and returning true or false.


#### Example
```js
// Prepare http server
...

// Create instance of WebSocket server
const ws = new WebSocket(http);

// Print all messages with command 'print'
ws.bind('print', (message) => {
  console.log(message.payload);
  // ...and send back 'print-response'
  return new WebSocketMessage().setCommand('print-response').setPayload('hi');
});
```
