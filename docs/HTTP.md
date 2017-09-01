# HTTPS server
HTTPS server allows to 
 - In addition it provides authentication via OAuth 2 service and authorization via e-groups.
 - Secure each request with JWT token
 - Redirects HTTP to HTTPS

#### Instance
```js
HttpServer(HTTP_CONF, JWT_CONF, OAUTH_CONF);
```
Where:
 * `HTTP_CONF` configuration object for the http server
    The `HTTP_CONF` object is a JSON object that defines of following fields:
     * `port` - HTTP port number 
     * `portSecure` - HTTPS port number
     * `key` - private key filepath
     * `cert` - certificate filepath
 * `JWT_CONF` configuration for JWT
 * `OAUTH_COFN` configuration for OAuth 2

#### Public methods
 * `passToTemplate(KEY, VALUE)`
 * `post(PATH, CALLBACK)`

#### Example
```js
const AliceO2Gui = require('@aliceo2/aliceo2-gui');
const http = {
  "port": 8080,
  "portSecure": 8443,
  "key": "/path/key/private.key",
  "cert": "/path/cert/certificate.pem"
};
const jw = {
  "secret": "secret",
  "issuer": "your-issuer-name",
  "expiration": "1d",
  "maxAge": "7d"
};
const oauth = {
  "secret": "qwertyuiopasdfghjklzxcvbnm1234567890qwertyui"
  "id": "your_id",
  "tokenHost": "https://oauth.server.domain",
  "tokenPath": "/Token",
  "authorizePath": "/Authorize",
  "redirect_uri": "https://your.application.domain/callback",
  "scope": " https://resource.server.domain/api/User",
  "state": "3(#0/!~",
  "resource": {
    "hostname": "resource.server.domain",
    "path": "/User",
    "port": 443
  }
};
const http = new HttpServer(http, jwt, oauth);
```
