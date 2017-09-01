# HTTPS server
The basic task of HTTPS server is to provide REST API. In addition, it:
 - Authenticates via OAuth 2 service
 - Authorizes via e-groups
 - Secures each request with JWT token
 - Redirects HTTP to HTTPS
By default, it serves `public` directory as static content. It also renders main page from `public/index.tpl`. Tem


#### Instance
```js
HttpServer(HTTP_CONF, JWT_CONF, OAUTH_CONF);
```
Where:
 * `HTTP_CONF` JSON formatted configuration object for the http server with following defined fields:
     * `port` - HTTP port number 
     * `portSecure` - HTTPS port number
     * `key` - private key filepath
     * `cert` - certificate filepath
 * `JWT_CONF` JSON formatted configuration object for JWT with following defined fields:
     * `secret` - JWT secret passphrase to sign and verify tokens
     * `issuer` - name of token issuer
     * `expiration` - token expiration time (as time literal)
     * `maxAge` - token refresh expiration time (as time literal)
 * `OAUTH_COFN` JSON formatted configuration object for OAuth 2 with following defined fields:
     * `secret` - oAuth secret
     * `id` - oAuth ID
     * `tokenHost` - hostname that provides tokens
     * `tokenPath` - path to token provider
     * `authorizePath` - verifies access token
     * `redirectUri` - oAuth application callback
     * `scope` - oAuth scope (to fetch user details)
     * `state` - oAuth state (to prevent CSRF attacks)
     * `resource` - details of resource server
        * `hostname` - resource server hostname
        * `path` - resource server path
        * `port` - resource server port

#### Public methods
 * [`passToTemplate(KEY, VALUE)`](API.md#HttpServer+passToTemplate)
 * [`post(KEY, VALUE)`](API.md#httpserverpostpath-callback)
 * [`postNoAuth(KEY, VALUE)`](API.md#httpserverpostnoauthpath-callback)

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

#### Routes
By default, the server publishes `public` directory as static content.
New routes can be defined by calling `post`, `postNoAuth`, `get` methods.

#### Templates
The main page is render from `public/index.tpl`.
The template variables can be passed via `passToTemplate` and then access from templated as `{{ key }}`.
