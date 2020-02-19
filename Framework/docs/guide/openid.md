# Backend - OpenID Connect module
This module supports OpenID connect flow to authenticate with CERN SSO and CERN egroup authorization.
It protects the static content (REST API calls and WebSocket messages are protected by JWT token).

### Instance
```js
new OpenId(OPENID_CONF);
```
Where:
 `OPENID_CONF` JSON formatted configuration object with following fields:
   * `secret` - Application secret
   * `id` - Application ID
   * `redirect_uri` - Authentication callback
   * `well_known` - So-called "well-known" endpoint defining OpenID configuration

### Config example
```
OpenId: {
  secret: '<secret>',
  id: '<id>',
  redirect_uri: 'https://myapp.cern.ch/callback',
  well_known: 'https://auth.cern.ch/auth/realms/cern/.well-known/openid-configuration'
}
```

### Generating ID and secret for CERN SSO
1. Go to https://application-portal.web.cern.ch
2. Register your application
3. Add "SSO Registration"
4. Select "OpenID Connect (OIDC)"
5. Set "Redirect URI": `https://myapp.cern.ch/callback`
6. Submit (do not check any checkboxes)

Additional details are available in here: https://auth.docs.cern.ch/user-documentation/oidc/config/
