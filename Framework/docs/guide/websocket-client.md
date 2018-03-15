# Frontend - WebSocket client

The `WebSocketClient` class encapsulates communication with the WebSocket server (see backend guide on [WebSocket server](./websockets.md)).

WebSocketClient needs to be authentificated by the server before it can send any requests or receive notifications:

```js
import {WebSocketClient} from '/js/src/index.js';

const ws = new WebSocketClient();

ws.addEventListener('authed', (message) => {
  console.log('ready, lets send a message');
  ws.sendMessage({command: 'custom-client-event-name', customAttribute: 123});
});
```

Client receives notifications from the server:
```js
ws.addEventListener('custom-server-event-name', (e) => {
  const dataFromServer = e.detail;
  // work with dataFromServer
});
```

Server can filter messages pushed to a client. This can be done by passing a filter via `setFilter` method. The filter should return either `true` or `false` what translates into "send" or "do not send" the message.
```js
ws.setFilter(function(message) {
  return message.customAttribute === 42;
});
```
