# Backend - OpenID Connect module
This module supports OpenID connect flow to authenticate with CERN SSO and CERN egroup authorisation.
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
5. Set "Redirect URI": eg. `https://myapp.cern.ch/callback`
6. Submit (do not check any boxes)

### Roles and e-group authorisation

#### Access for alice-member only
1. Go to https://application-portal.web.cern.ch
2. Edit your application
3. "Add role"
4. Provide: "Role Name", "Role Identifier", "Description"
5. Check "This role is required to access my application"
6. Set Minimum Level Of Assurance to most right ("CERN") and submit
7. Edit just created role
8. Add `alice-member` group to "Linked Groups"

#### Admin role
1. Go to https://application-portal.web.cern.ch
2. Edit your application
3. "Add role"
4. Provide: "Role Name" and "Description", set ""Role Identifier" as `admin`
5. Set Minimum Level Of Assurance to most right ("CERN") and submit
6. Edit just created role
7. Add e-group which will gain admin access to "Linked Groups"


Additional details are available in here: https://auth.docs.cern.ch/user-documentation/oidc/config/
