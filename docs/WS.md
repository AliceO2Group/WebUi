# WebSocket
The purpose of WebSocket server is to communicate with connected clients via protocol defined in RFC 6455. In addition, it:
- Secures each message with JWT token
- Verifies `access_token` obtained during authorization by oAuth

## Server side

#### Instance
```js
WebSocket(HTTP_SERVER);
```
Where:
 * `HTTP_SERVER` instance of HTTP server

#### Public methods
 * [`bind(NAME, CALLBACK)`](https://github.com/awegrzyn/Gui/blob/docs/docs/API.md#WebSocket+bind)

#### Example
```js
const {HttpServer, WebSocket} = require('@aliceo2/aliceo2-gui');
...
const http = new HttpServer(httpConf, jwtConf, oauthConf);
const ws = new WebSocket(http);
ws.bind('message', (body) => console.log(body));
```

## Client side widget
#### Instance
1. Include `websocket-client.js` script.
2. Create instance and pass server-side variables as parameters:
```js
const ws = new WebSocketClient(
  {{personid}},
  '{{token}}',
  '{{oauth}}'
);
```

#### Sending message
```js
ws.send(JSON)
```
Where:
 * `JSON` JSON object with at least `command` filed specified

#### Binding to incoming messages
```js
ws.bind(MESSAGE_NAME, CALLBACK);
```
Where:
 * `MESSAGE_NAME` message name
 * `CALLBACK` callable with one parameter  `data`

#### Example
```js
ws.bind('custommessage', (evt, data) => ws.send({command: data.command));
```
