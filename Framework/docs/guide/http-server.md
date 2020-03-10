# Backend - HTTP module
HTTP module provided a simple way of creating REST API. In addition, it supports:
 - Protects server by defining: Content Security Policy, DNS Prefetch Control, `X-Frame-Options`, `Strict-Transport-Security`, `Referrer-Policy`, `X-XSS-Protection`
 - Serving custom static paths
 - Defining new routes (GET, POST)
 - CERN SSO authentication and e-groups authorization using [OpenID Connect module](openid.md)
 - JWT token secured requests using [JWT module](json-tokens.md)

#### Instance
```js
HttpServer(HTTP_CONF, [JWT_CONF], [OPENID_CONF]);
```
Where:
 * `HTTP_CONF` consists of following fields:
     * `port` - HTTP port number
     * [`tls`] - flag that enables/disables TLS (default: `false`)
     * [`hostname`] - server's hostname which is required by Content Security Policy (default: `localhost`)
     * [`portSecure`] - HTTPS port number
     * [`key`] - private key filepath
     * [`cert`] - certificate filepath
 * [`JWT_CONF`] JSON Web token configuration is explained in the [jwt](json-tokens.md) module
 * [`OPENID_CONF`] OpenID configuration is explained in the [OpenID](openid.md)


#### Public methods
- `addStaticPath`
- `get`
- `post`
- `delete`


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
