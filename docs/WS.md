# Websocket
The basic task of Websocket server is to communicate with connected clients via protocol defined in RFC 6455. In addition, it:
 - Secures each message with JWT token

#### Instance
```js
WebSocket(HTTP_SERVER, JWT_CONFIG);
```
Where:
 * `HTTP_CONF` instance of HTTP server
 * `JWT_CONF` JSON formatted configuration object for JWT with following defined fields:
     * `secret` - JWT secret passphrase to sign and verify tokens
     * `issuer` - name of token issuer
     * `expiration` - token expiration time (as time literal)
     * `maxAge` - token refresh expiration time (as time literal)

#### Public methods
 * [`bind(NAME, CALLBACK)`](https://github.com/awegrzyn/Gui/blob/docs/docs/API.md#WebSocket+bind)

#### Example
```js
const AliceO2Gui = require('@aliceo2/aliceo2-gui');
...
const jwtConf = {
  "secret": "secret",
  "issuer": "your-issuer-name",
  "expiration": "1d",
  "maxAge": "7d"
};
const http = new AliceO2Gui.HttpServer(httpConf, jwtConf, oauthConf);
const ws = new AliceO2Gui.WebSocket(http, jwtConf);
```
