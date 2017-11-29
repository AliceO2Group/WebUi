# HTTPS server
The basic task of HTTPS server is to provide REST API. In addition, it:
 - Authenticates via OAuth 2 service
 - Authorizes via e-groups
 - Secures each request with JWT token
 - Redirects HTTP to HTTPS
By default, it serves `public` directory as static content. It also renders main page from `public/index.tpl`.


#### Instance
```js
HttpServer(HTTP_CONF, JWT_CONF, OAUTH_CONF);
```
Where:
 * `HTTP_CONF` Configuration object for the http server with following defined fields:
     * `port` - HTTP port number 
     * `portSecure` - HTTPS port number
     * `key` - private key filepath
     * `cert` - certificate filepath
     * `hostname` - hostname required by CSP (Content Security Policy) policy
 * `JWT_CONF` Configuration object for JWT (see [jwt](JWT.md) module)
 * `OAUTH_COFN` Configuration object for OAuth 2 (see [oauth](OAUTH.md) module)

#### Public methods
 * [`passToTemplate(KEY, VALUE)`](API.md#HttpServer+passToTemplate)
 * [`get(KEY, CALLBACK)`](API.md#HttpServer+get)
 * [`post(KEY, CALLBACK)`](API.md#HttpServer+post)
 * [`delete(KEY, CALLBACK)`](API.md#HttpServer+delete)

#### Example
```js
const {HttpServer} = require('@aliceo2/aliceo2-gui');
const http = {
  "port": 8080,
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
New routes can be defined by calling `post`, `postNoAuth`, `get` methods.

#### Templates
The main page is render from `public/index.tpl`.
The template variables can be passed via `passToTemplate` and then access from templated as `{{ key }}`.
