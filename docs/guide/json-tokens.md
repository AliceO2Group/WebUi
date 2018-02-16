# JSON Web Tokens

### Instance
```js
JwtToken(JWT_CONF);
```
Where
 `JWT_CONF` JSON formatted configuration object for JWT with following defined fields:
   * `secret` - JWT secret passphrase to sign and verify tokens
   * `issuer` - name of token issuer
   * `expiration` - token expiration time (as time literal)
   * `maxAge` - token refresh expiration time (as time literal)

### Public methods
* [`generateToken(PERSONID, USERNAME, ACCESS)`](API.md#JwtToken+generateToken)
* [`refreshToken(TOKEN)`](API.md#JwtToken+refreshToken)
* [`verify(TOKEN)`](https://github.com/awegrzyn/Gui/blob/docs-2/docs/API.md#JwtToken+verify)

### Example
```js
const {JwtToken} = require('@aliceo2/aliceo2-gui');
const jwtConfig = {
  "secret": "secret",
  "issuer": "alice-o2-gui",
  "expiration": "1d",
  "maxAge": "7d"
}

const jwt = new JwtToken(jwtConfig);
const token = jwt.generateToken(1, 'Adam', 1);
jwt.verify(token)
  .then(() => {
    cosole.log('verified');
  })
}
```
