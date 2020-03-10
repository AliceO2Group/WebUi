# Backend - JSON Web Token module

**!!** Note: This module is not intended to be used independently but as extension to either [REST API](http-server.md) or [WebSockets](websockets.md) module.

JSON Web Tokens module secures requests or claims send between client and server.
The generated tokens includes following encrypted information:
 * CERN ID
 * CERN username
 * Auth level (currently always set to `0`)

If OpenID Connect is not used CERN ID is set to `0` and CERN username to `Anonymous`.

### Instance
```js
const {JwtToken} = require('@aliceo2/web-ui');
JwtToken([JWT_CONF]);
```
Where
 `JWT_CONF` might include following fields:
   * [`secret`] - secret passphrase to sign and verify tokens (default: random string)
   * [`expiration`] - token expiration time as time literal (default: `1d`)
   * [`issuer`] - name of token issuer (default: `o2-ui`)
   * [`maxAge`] - token refresh expiration time as time literal (default: `7d`)

#### JWT token handling by client
Even though JWT does not require explicit configuration, the token verification mechanism is always turned on.
The token and user data is supplied to the client when accessing entry page, usually defined using `addStaticPath` (in production the entry page must be protected by OpenID).
This token needs to be stored in secured place and used for each HTTP request or opening new WebSocket connection.
If token is not present or is invalid the server will return error 403 with relevant message.
When using WebUI Frontend all above is handled transparently.

#### Token expiration and refresh
Token expires after `expiration` time passes. Expired token cannot be used to sign any request, the server will return error message: `TokenExpiredError`.
It needs to be exchanged to a new one:
1. By calling `verify` method and providing expired token, but no longer than defined in `maxAge` (this refresh flow is obsolete)
2. By redirecting to a main page. This is done automatically when using OpenID.
