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
const {HttpServer, WebSocket} = require('@aliceo2/aliceo2-gui');

// Prepare HTTP, JWT, and oAuth configuration
...

// Create instance HTTP server
const http = new HttpServer(httpConf, jwtConf, oauthConf);

// Create instance of WebSocket server
const ws = new WebSocket(http);

// Print all messages with topic 'message'
ws.bind('message', (body) => console.log(body));
```
