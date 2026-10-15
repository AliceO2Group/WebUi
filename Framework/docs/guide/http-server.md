# Backend - HTTP (REST API) module

 - Protects server by defining: Content Security Policy, DNS Prefetch Control, `X-Frame-Options`, `Strict-Transport-Security`, `Referrer-Policy`, `X-XSS-Protection`
 - Serves custom static paths
 - Defines new routes (GET, POST, PUT, PATCH, DELETE)
 - Provides CERN SSO authentication and e-groups authorization using [OpenID Connect module](openid.md)
 - Secures routes with [JWT token](json-tokens.md)

#### Instance
```js
const {HttpServer} = require('@aliceo2/web-ui');
HttpServer({port: PORT, hostname: HOSTNAME, tls: TLS_ENABLED, portSecure: HTTPS_PORT, key: TLS_KEY, cert: TLS_CERT, autoListen: AUTO_LISTEN, limit: LIMIT, queryParser: QUERY_PARSER}, JWT_CONF, OPENID_CONF);
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
     * [`QUERY_PARSER`] - how the URL query string is parsed into `req.query`: `'simple'` or `'extended'` (default: `'simple'`)
         * `'simple'` - flat key/value pairs, repeated keys become arrays: `?a=1&a=2` -> `{ a: ['1', '2'] }`; bracket keys stay as they are: `?filter[name]=x` -> `{ 'filter[name]': 'x' }`
         * `'extended'` - additionally parses nested objects and arrays: `?filter[name]=x&fields[]=a` -> `{ filter: { name: 'x' }, fields: ['a'] }`. Use it only if your API relies on such parameters
 * [`JWT_CONF`] - JWT module config, see [JWT module](json-tokens.md)
 * [`OPENID_CONF`] - OpenID config, see [OpenID Connect module](openid.md)


The server is built on top of [Express v5](https://expressjs.com/en/guide/migrating-5.html). If you are upgrading from `@aliceo2/web-ui` v2, see the [migration guide to v3](migration-v3.md).

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
