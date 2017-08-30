# Architecture
The functional architecture of the web-application is shown below.

![Control GUI Architecture](./images/architecture.png "Control GUI Architecture")

The web-application requires presence of three external services:

 * OAuth - [OAuth 2.0](https://oauth.net/2/) service to authorize connecting users
 * Resource - resource server that provides user details (including additional authorization data - e-group membership) based on OAuth access token
 * O<sup>2</sup> Control Agent - the O<sup>2</sup> process that manages the Control subsystem

and it consists of three modules:

 * Browser app - the application running in user's browser, easily extensible via jQuery Widgets
 * HTTP server - takes part in [OAuth 2.0](https://oauth.net/2/) flow and provides REST API
 * WebSocket server - provides bi-directional connection between browser and the server via WebSocket protocol - [RFC 6455](https://tools.ietf.org/html/rfc6455). It's also entry point to O<sup>2</sup> Control subsystem via [ZeroMQ](http://zeromq.org/intro:read-the-manual) protocol


# Authentication and authorization flow
The full authorization and authentication flow is presented below.

![Authentication and authorization flow](./images/auth.png "Authentication and authorization flow")

## OAuth
Connecting users are authenticated (authorized in OAuth terminology) by OAuth service, which in the end of the process grants the web-application with [Access Token](https://auth0.com/docs/tokens/access-token). Access Token is used to retrieve the following user details from the Resource server:

 * ID
 * NICE login
 * name and surname
 * e-group membership

## Privileges
The e-group membership translates into list of privileges that user is granted within the web-application. For the time being only three privilege levels are defined:

 * spectator - previews changes made by other users
 * master - spectator + is allowed to execute commands
 * admin - master + manage connected users, force commands

## JSON Web Tokens
[JSON Web Tokens](https://jwt.io) allow secure information transport between entities and in this web-application is used as stateless sessions mechanism.
The user details provided by the Resource server and privilege level are encoded into the token using RSA. The token is shipped to Browser application. Each request coming from the Browser application (either to HTTP or WebSocket modules) must contain the token. The token is verified (simply by decryption) and the user details are available to processing request module.

# Token refresh scenarios
Each JSON Web Token has its expiration time. When token is expired it can no longer be used and must be refreshed.

## Successful
In case the token is expired it is verified once again based on *maxAge* parameter (expiration check is suppressed). The *maxAge* parameter >> *expiration*. If the verification is successful the new token (with the same user details) is created and transfered to Browser application.

![Successful token refresh](./images/token-refresh.png "Successful token refresh")

## Unsuccessful
If the token is older than indicated by *maxAge* the user is forced to re-login.

![Unsuccessful token refresh](./images/token-refresh-fail.png "Unsuccessful token refresh")