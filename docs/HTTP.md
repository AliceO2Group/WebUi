# HTTPS server
HTTPS server provided an easy way of createing REST API. In addition, it supports:
 - CERN OAuth 2 authentication
 - E-groups authorization
 - JWT token secured requests
 - HTTP to HTTPS redirection

By default, it serves `public` directory as static content.


#### Instance
```js
HttpServer(HTTP_CONF, JWT_CONF, OAUTH_CONF);
```
Where:
 * `HTTP_CONF` Configuration object for the http server with following defined fields:
     * `port` - HTTP port number 
     * `tls` - flag that enables/disables TLS
     * `portSecure` - HTTPS port number
     * `key` - private key filepath
     * `cert` - certificate filepath
     * `hostname` - hostname required by CSP (Content Security Policy) policy
 * `JWT_CONF` Configuration object for JWT (see [jwt](JWT.md) module)
 * `OAUTH_COFN` Configuration object for OAuth 2 (see [oauth](OAUTH.md) module)

#### Public methods
 * [`passAsUrl(KEY, VALUE)`](API.md#httpserverpassasurlkey-value)
 * [`get(KEY, CALLBACK)`](API.md#HttpServer+get)
 * [`post(KEY, CALLBACK)`](API.md#HttpServer+post)
 * [`delete(KEY, CALLBACK)`](API.md#HttpServer+delete)

#### Example
```js
const {HttpServer} = require('@aliceo2/aliceo2-gui');
const http = {
  "port": 8080,
  "tls": true,
  "portSecure": 8443,
  "key": "/path/key/private.key",
  "cert": "/path/cert/certificate.pem"
};
const jwt = {...};
const oauth = {...};
const http = new HttpServer(http, jwt, oauth);
```

#### Routes
By default, the server publishes `public` directory as static content.
New routes can be defined by calling `post`, `get` methods.

#### Passing values to frontend
Values can be passed to frontend in URL via `passAsUrl` method.
