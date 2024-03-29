# Backend - OpenID Connect module
This module supports OpenID connect flow to authenticate with CERN SSO and CERN egroup authorisation.
It protects the static content (REST API calls and WebSocket messages are protected by JWT token).
It defines how to handle service accounts.

### Instance
```js
new OpenId({secret: SECRET, id: ID, redirect_uri: REDIRECT_URI, well_known: WELL_KNOWN[, timeout: TIMEOUT, sa_whitelist: SA_WHITELIST, sa_role: SA_ROLE]});
```
Where:
   * `SECRET` - Application secret
   * `ID` - Application ID
   * `REDIRECT_URI` - Authentication callback
   * `WELL_KNOWN` - So-called "well-known" endpoint defining OpenID configuration
   * [`TIMEOUT`] - OpenID timeout in milliseconds
   * [`SA_WHITELIST`] - IP address range to accept service accounts from
   * [`SA_ROLE`] - OpenID role that service account needs to access

### Config example
```
openId: {
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
7. Click on green ("Add group to role") icon
8. Add `alice-member` group to "Linked Groups"

#### Admin and other roles
1. Go to https://application-portal.web.cern.ch
2. Edit your application
3. "Add role"
4. Provide: "Role Name" and "Description", set "Role Identifier" as `admin` or any other role supported by your application
5. Set Minimum Level Of Assurance to most right ("CERN") and submit
6. Click on green ("Add group to role") icon
7. Select e-group to be granted with GUI admin or special access and add it to "Linked Groups"
8. On the frontend, list of roles is available in Session service


Additional details are available in here: https://auth.docs.cern.ch/user-documentation/oidc/config/
