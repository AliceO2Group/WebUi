# Backend - HTTP (REST API) module

 - Protects server by defining: Content Security Policy, DNS Prefetch Control, `X-Frame-Options`, `Strict-Transport-Security`, `Referrer-Policy`, `X-XSS-Protection`
 - Serves custom static paths
 - Defines new routes (GET, POST, PUT, PATCH, DELETE)
 - Provides CERN SSO authentication and e-groups authorization using [OpenID Connect module](openid.md)
 - Secures routes with [JWT token](json-tokens.md)

#### Instance
```js
const {HttpServer} = require('@aliceo2/web-ui');
HttpServer({port: PORT, hostname: HOSTNAME, tls: TLS_ENABLED, portSecure: HTTPS_PORT, key: TLS_KEY, cert: TLS_CERT, autoListen: AUTO_LISTEN}, JWT_CONF, OPENID_CONF);
```
Where:
 * `HTTP_CONF` consists of following fields:
     * `PORT` - HTTP port number
     * [`HOSTNAME`] - server's hostname which is required by Content Security Policy (default: `localhost`)
     * [`TLS_ENABLED`] - flag that enables/disables TLS (default: `false`)
     * [`HTTPS_PORT`] - HTTPS port number, TLS must be enabled
     * [`TLS_KEY`] - private key filepath, TLS must be enabled
     * [`TLS_CERT`] - certificate filepath, TLS must be enabled
     * [`AUTO_LISTEN`] - flag that enables/disables automatic listening (default: `true`)
     * [`LIMIT`] - controls the maximum request body size. Defaults to '100kb'. 
     * [`iframeCsp`] - list of URLs allowed in the `frame-src` CSP directive (default: `[]`)
     * [`allow`] - adds `'unsafe-eval'` to `script-src` (default: `false`)
     * [`allowIframeCsp`] - adds `blob:` to `img-src` so blob-based images can be previewed/downloaded; despite the name, unrelated to iframes (default: `false`)
     * [`extraConnectSrc`] - sources appended to the default `connect-src` CSP directive (default: `[]`)
 * [`JWT_CONF`] - JWT module config, see [JWT module](json-tokens.md)
 * [`OPENID_CONF`] - OpenID config, see [OpenID Connect module](openid.md)

#### Authentication routes
Registered under `/api/auth` so a reverse proxy serving the frontend only needs to forward `/api`, and skip JWT verification:
 * `GET /api/auth/login` - always starts a fresh login, ignoring any session parameters (`token`, `personid`, `name`, `username`, `access`) in the query. With OpenID it redirects to the SSO, otherwise to `/` with a new anonymous session. The rest of the query is passed back to `/`.
 * `GET /api/auth/callback` - OpenID callback, used when the SSO "Redirect URI" points to it (see [OpenID Connect module](openid.md)). `/callback` is still available.

The frontend `sessionService.loadAndHideParameters()` redirects to `/api/auth/login` when the page has no token, so a frontend served without going through `/` logs in by itself.

#### Public methods
```js
listen
```
```js
close
```
```js
address
```
```js
addStaticPath
```
```js
get
```
```js
post
```
```js
put
```
```js
patch
```
```js
delete
```

#### Minimal server example
```js
// Include required modules
const {HttpServer} = require('@aliceo2/web-ui');

// create instance of http server
const http = new HttpServer({
  port: 8080
});

// Server `public` folder
http.addStaticPath('public');
```

#### Route example
```js
http.get('/hi', (req, res) => {
  res.status(200).json({message: 'hi'})
}, { public: true }); // turns off JWT verification
```
