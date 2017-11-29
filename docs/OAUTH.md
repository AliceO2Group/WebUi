# CERN Open Auth 2.0

### Instace
```js
new OAuth(OAUTH_CONF);
```
Where:
 `OAUTH_COFN` JSON formatted configuration object for OAuth 2 with following defined fields:
   * `secret` - oAuth secret
   * `id` - oAuth ID
   * `tokenHost` - hostname that provides tokens
   * `tokenPath` - path to token provider
   * `authorizePath` - verifies access token
   * `redirectUri` - oAuth application callback
   * `egroup` - CERN e-group required for the authorization
   * `state` - oAuth state (to prevent CSRF attacks)
   * `resource` - details of resource server
      * `hostname` - resource server hostname
      * `userPath` - user resource path
      * `groupPath` - group resource path
      * `port` - resource server port

### Public methods
* [`getDetails(ACCESS_TOKEN, OPTIONS)`](API.md#OAuth+getDetails)
