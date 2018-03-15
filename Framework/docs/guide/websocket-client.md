# Guide - WebSocket client

The `WebSocketClient` class on the client side encapsulate communication with the `WebSocket` class on the server side though HTTP(S) and allows a bi-directional stream.

WebSocketClient needs to be instanciated and authentificated before usage:


```js
import {WebSocketClient} from '/js/src/index.js';

const ws = new WebSocketClient();

ws.addEventListener('authed', (message) => {
  console.log('ready, let send a message');
  ws.sendMessage({command: 'custom-client-event-name', customAttribute: 123});
});
```

Client can listen to events.

```js
ws.addEventListener('custom-server-event-name', (e) => {
  const dataFromServer = e.detail;
  // work with dataFromServer
});
```

Filtered broadcast is handled by providing a filter function to the server.

```js
ws.setFilter(function(message) {
  return message.customAttribute === 42;
});
```

[WebSocket on the backend side](./websockets.md)
