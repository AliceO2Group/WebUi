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
Connecting clients may decide which broadcast messages they receive from server. This can be done by sending "filter" command (use `setFilter` of WebSocketClient from Frontend).
The filter must be stringified JavaScript function receiving WebSocketMessage object and returning true or false.


#### Example
```js
// Prepare http server
...

// Create instance of WebSocket server
const ws = new WebSocket(http);

// Print all messages with command 'print'
// ...and send back 'print-response'
ws.bind('print', (message) => {
  console.log(message.payload);
  return new WebSocketMessage().setCommand('print-response').setPayload('hi');
});
```
