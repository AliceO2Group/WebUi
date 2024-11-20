# Frontend - WebSocket client

The `WebSocketClient` class encapsulates communication with the WebSocket server (see backend guide on [WebSocket server](./websockets.md)).

WebSocketClient needs to be authenticated by the server before it can send any requests or receive notifications:

```js
import {WebSocketClient} from '/js/src/index.js';

const ws = new WebSocketClient();

ws.addListener('authed', () => {
  console.log('ready, lets send a message');
  ws.sendMessage({command: 'custom-client-event-name', payload: 123});
});
```

Client receives notifications from the server:
```js
ws.addListener('command', (message) => {
  if (message.command === 'custom-server-event-name') {
    // use message.payload
  }
});
```

Server can filter messages pushed to a client. This can be done by passing a filter via `setFilter` method. The filter should return either `true` or `false` what translates into "send" or "do not send" the message.
```js
ws.setFilter(function(message) {
  return message.command === 'custom-server-event-name';
});
```

### WebSocketMessage

WebSocketMessage encapsulate data for a websocket exchange between client and server.

```js
{
  code: 200,
  command: 'custom-command',
  payload: {
    foo: 1,
    bar: 2,
    baz: 3
  }
}
```
