# Backend - WebSocket module
The purpose of WebSocket server is to communicate with connected clients via RFC 6455 protocol. By default it uses JWT tokens to secure each message.

### Instance
```js
WebSocket(HTTP_SERVER);
```
Where:
 * `HTTP_SERVER` instance of HTTP server

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
