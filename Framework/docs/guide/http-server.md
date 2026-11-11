# Backend - HTTP (REST API) module

 - Protects server by defining: Content Security Policy, DNS Prefetch Control, `X-Frame-Options`, `Strict-Transport-Security`, `Referrer-Policy`, `X-XSS-Protection`
 - Serves custom static paths
 - Defines new routes (GET, POST, PUT, PATCH, DELETE)
 - Provides CERN SSO authentication and e-groups authorization using [OpenID Connect module](openid.md)
 - Secures routes with [JWT token](json-tokens.md)

#### Instance
```js
const {HttpServer} = require('@aliceo2/web-ui');
HttpServer({port: PORT, hostname: HOSTNAME, tls: TLS_ENABLED, portSecure: HTTPS_PORT, key: TLS_KEY, cert: TLS_CERT, autoListen: AUTO_LISTEN, apiAuthRoutes: API_AUTH_ROUTES}, JWT_CONF, OPENID_CONF);
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
     * [`API_AUTH_ROUTES`] - registers the authentication routes under `/api` (see below) (default: `false`)
 * [`JWT_CONF`] - JWT module config, see [JWT module](json-tokens.md)
 * [`OPENID_CONF`] - OpenID config, see [OpenID Connect module](openid.md)

#### Authentication routes
Registered only when `apiAuthRoutes` is `true`, so a reverse proxy can forward a single `/api` rule:
 * `GET /api/login` - always starts a fresh login, ignoring any `token` in the query. With OpenID it redirects to the SSO, otherwise to `/` with a new anonymous session. The rest of the query is passed back to `/`.
 * `GET /api/callback` - OpenID callback under `/api`, used when the SSO "Redirect URI" points to it (see [OpenID Connect module](openid.md))


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
