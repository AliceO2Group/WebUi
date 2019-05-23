## Classes

<dl>
<dt><a href="#OAuth">OAuth</a></dt>
<dd><p>Authenticates users via CERN OAuth 2.0.
Gathers user account details.</p>
</dd>
<dt><a href="#HttpServer">HttpServer</a></dt>
<dd><p>HTTPS server that handles OAuth and provides REST API.
Each request is authenticated with JWT token.</p>
</dd>
<dt><a href="#JwtToken">JwtToken</a></dt>
<dd><p>Provides JSON Web Token functionality such as token generation and verification.</p>
</dd>
<dt><a href="#WebSocketMessage">WebSocketMessage</a></dt>
<dd><p>WebSocket module that allows to create response to user request.
It&#39;s based on HTTP status codes.</p>
</dd>
<dt><a href="#WebSocket">WebSocket</a></dt>
<dd><p>It represents WebSocket server (RFC 6455).
In addition, it provides custom authentication with JWT tokens.</p>
</dd>
<dt><a href="#MySQL">MySQL</a></dt>
<dd><p>MySQL pool wrapper</p>
</dd>
<dt><a href="#InfoLoggerSender">InfoLoggerSender</a></dt>
<dd><p>Sends InfoLogger logs to InfoLoggerD over UNIX named socket</p>
</dd>
<dt><a href="#Log">Log</a></dt>
<dd><p>Handles loging, prints out in console, saves to file or sends to cerntral InfoLogger instance</p>
</dd>
<dt><a href="#Winston">Winston</a></dt>
<dd><p>Creates Winston logger
Uses two transports file and console (if properly configured)</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#https">https</a></dt>
<dd></dd>
<dt><a href="#fs">fs</a></dt>
<dd></dd>
<dt><a href="#jwt">jwt</a></dt>
<dd></dd>
<dt><a href="#WebSocketServer">WebSocketServer</a></dt>
<dd></dd>
<dt><a href="#MySQL">MySQL</a></dt>
<dd></dd>
<dt><a href="#config">config</a></dt>
<dd></dd>
<dt><a href="#assert">assert</a></dt>
<dd></dd>
<dt><a href="#assert">assert</a></dt>
<dd></dd>
<dt><a href="#config">config</a></dt>
<dd></dd>
<dt><a href="#mysql">mysql</a></dt>
<dd></dd>
<dt><a href="#net">net</a></dt>
<dd></dd>
<dt><a href="#protocols">protocols</a></dt>
<dd></dd>
<dt><a href="#Winston">Winston</a></dt>
<dd></dd>
<dt><a href="#winston">winston</a></dt>
<dd></dd>
</dl>

<a name="OAuth"></a>

## OAuth
Authenticates users via CERN OAuth 2.0.
Gathers user account details.

**Kind**: global class  
**Author**: Adam Wegrzynek <adam.wegrzynek@cern.ch>  
**Todo**

- [ ] e-group authorization


* [OAuth](#OAuth)
    * [new OAuth(config)](#new_OAuth_new)
    * [.getAuthorizationUri(state)](#OAuth+getAuthorizationUri) ⇒ <code>object</code>
    * [.createTokenAndProvideDetails(code)](#OAuth+createTokenAndProvideDetails) ⇒ <code>object</code>
    * [.getDetails(token, options)](#OAuth+getDetails) ⇒ <code>object</code>

<a name="new_OAuth_new"></a>

### new OAuth(config)
Creates OAuth object based on id and secret stored in config file.


| Param | Type | Description |
| --- | --- | --- |
| config | <code>object</code> | configuration object (see docs for details) |

<a name="OAuth+getAuthorizationUri"></a>

### oAuth.getAuthorizationUri(state) ⇒ <code>object</code>
Returns autorization URL

**Kind**: instance method of [<code>OAuth</code>](#OAuth)  
**Returns**: <code>object</code> - authorizeURL  

| Param | Type | Description |
| --- | --- | --- |
| state | <code>string</code> | Base64 encoded parameters |

<a name="OAuth+createTokenAndProvideDetails"></a>

### oAuth.createTokenAndProvideDetails(code) ⇒ <code>object</code>
Creates access_token based on code parameters.
Retrive some user's and group information from resource server using access_token.

**Kind**: instance method of [<code>OAuth</code>](#OAuth)  
**Returns**: <code>object</code> - Promise with user details and token  

| Param | Type | Description |
| --- | --- | --- |
| code | <code>number</code> | authorization code to request access token |

<a name="OAuth+getDetails"></a>

### oAuth.getDetails(token, options) ⇒ <code>object</code>
Queries details using received access token.

**Kind**: instance method of [<code>OAuth</code>](#OAuth)  
**Returns**: <code>object</code> - Promise with user details  

| Param | Type | Description |
| --- | --- | --- |
| token | <code>string</code> | OAuth access token |
| options | <code>object</code> | POST options |

<a name="HttpServer"></a>

## HttpServer
HTTPS server that handles OAuth and provides REST API.
Each request is authenticated with JWT token.

**Kind**: global class  
**Author**: Adam Wegrzynek <adam.wegrzynek@cern.ch>  

* [HttpServer](#HttpServer)
    * [new HttpServer(httpConfig, jwtConfig, oAuthConfig)](#new_HttpServer_new)
    * [.getServer](#HttpServer+getServer) ⇒ <code>object</code>
    * [.configureHelmet(hostname, port)](#HttpServer+configureHelmet)
    * [.passAsUrl(key, value)](#HttpServer+passAsUrl)
    * [.specifyRoutes()](#HttpServer+specifyRoutes)
    * [.addDefaultUserData(req, res, next)](#HttpServer+addDefaultUserData) ⇒ <code>object</code>
    * [.addStaticPath(localPath, uriPath)](#HttpServer+addStaticPath)
    * [.get(path, callback, options)](#HttpServer+get)
    * [.post(path, callback, options)](#HttpServer+post)
    * [.delete(path, callback, options)](#HttpServer+delete)
    * [.enableHttpRedirect()](#HttpServer+enableHttpRedirect)
    * [.oAuthAuthorize(req, res, next)](#HttpServer+oAuthAuthorize) ⇒ <code>object</code>
    * [.oAuthCallback(req, res)](#HttpServer+oAuthCallback) ⇒ <code>object</code>
    * [.jwtVerify(req, res, next)](#HttpServer+jwtVerify)

<a name="new_HttpServer_new"></a>

### new HttpServer(httpConfig, jwtConfig, oAuthConfig)
Sets up the server, routes and binds HTTP and HTTPS sockets.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| httpConfig | <code>object</code> |  | configuration of HTTP server |
| jwtConfig | <code>object</code> |  | configuration of JWT |
| oAuthConfig | <code>object</code> | <code></code> | configuration of oAuth |

<a name="HttpServer+getServer"></a>

### httpServer.getServer ⇒ <code>object</code>
HTTPs server getter.

**Kind**: instance property of [<code>HttpServer</code>](#HttpServer)  
**Returns**: <code>object</code> - - HTTPs server  
<a name="HttpServer+configureHelmet"></a>

### httpServer.configureHelmet(hostname, port)
Configures Helmet rules to increase web app secuirty

**Kind**: instance method of [<code>HttpServer</code>](#HttpServer)  

| Param | Type | Description |
| --- | --- | --- |
| hostname | <code>string</code> | whitelisted hostname for websocket connection |
| port | <code>number</code> | secure port number |

<a name="HttpServer+passAsUrl"></a>

### httpServer.passAsUrl(key, value)
Passes key-value parameters that are available on front-end side

**Kind**: instance method of [<code>HttpServer</code>](#HttpServer)  

| Param | Type |
| --- | --- |
| key | <code>string</code> | 
| value | <code>string</code> | 

<a name="HttpServer+specifyRoutes"></a>

### httpServer.specifyRoutes()
Specified routes and their callbacks.

**Kind**: instance method of [<code>HttpServer</code>](#HttpServer)  
<a name="HttpServer+addDefaultUserData"></a>

### httpServer.addDefaultUserData(req, res, next) ⇒ <code>object</code>
Adds default user details when skipping OAuth flow

**Kind**: instance method of [<code>HttpServer</code>](#HttpServer)  
**Returns**: <code>object</code> - redirection  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>object</code> |  |
| res | <code>object</code> |  |
| next | <code>object</code> | serves static paths |

<a name="HttpServer+addStaticPath"></a>

### httpServer.addStaticPath(localPath, uriPath)
Serves local static path under specified URI path

**Kind**: instance method of [<code>HttpServer</code>](#HttpServer)  

| Param | Type | Description |
| --- | --- | --- |
| localPath | <code>string</code> | local directory to be served |
| uriPath | <code>string</code> | URI path (optional, '/' as default) |

<a name="HttpServer+get"></a>

### httpServer.get(path, callback, options)
Adds GET route with authentification (req.query.token must be provided)

**Kind**: instance method of [<code>HttpServer</code>](#HttpServer)  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | path that the callback will be bound to |
| callback | <code>function</code> | function (that receives req and res parameters) |
| options | <code>function</code> |  |
| options.public | <code>function</code> | true to remove token verification |

<a name="HttpServer+post"></a>

### httpServer.post(path, callback, options)
Adds POST route with authentification (req.query.token must be provided)

**Kind**: instance method of [<code>HttpServer</code>](#HttpServer)  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | path that the callback will be bound to |
| callback | <code>function</code> | function (that receives req and res parameters) |
| options | <code>function</code> |  |
| options.public | <code>function</code> | true to remove token verification |

<a name="HttpServer+delete"></a>

### httpServer.delete(path, callback, options)
Adds DELETE route with authentification (req.query.token must be provided)

**Kind**: instance method of [<code>HttpServer</code>](#HttpServer)  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | path that the callback will be bound to |
| callback | <code>function</code> | function (that receives req and res parameters) |
| options | <code>function</code> |  |
| options.public | <code>function</code> | true to remove token verification |

<a name="HttpServer+enableHttpRedirect"></a>

### httpServer.enableHttpRedirect()
Redirects HTTP to HTTPS.

**Kind**: instance method of [<code>HttpServer</code>](#HttpServer)  
<a name="HttpServer+oAuthAuthorize"></a>

### httpServer.oAuthAuthorize(req, res, next) ⇒ <code>object</code>
Handles oAuth authentication flow (default path of the app: '/')
- If query.code is valid embeds the token and grants the access to the application
- Redirects to the OAuth flow if query.code is not present (origin path != /callback)
- Prints out an error when code is not valid
The query arguments are serialized and kept in the 'state' parameter through OAuth process

**Kind**: instance method of [<code>HttpServer</code>](#HttpServer)  
**Returns**: <code>object</code> - redirects to OAuth flow or displays the page if JWT token is valid  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>object</code> | HTTP request |
| res | <code>object</code> | HTTP response |
| next | <code>object</code> | serves static paths when OAuth suceeds |

<a name="HttpServer+oAuthCallback"></a>

### httpServer.oAuthCallback(req, res) ⇒ <code>object</code>
oAuth allback route - when successfully authorized (/callback)
Redirects to the application deserializes the query parameters from state variable
and injects them to the url

**Kind**: instance method of [<code>HttpServer</code>](#HttpServer)  
**Returns**: <code>object</code> - redirect to address with re-included query string  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>object</code> | HTTP request |
| res | <code>object</code> | HTTP response |

<a name="HttpServer+jwtVerify"></a>

### httpServer.jwtVerify(req, res, next)
Verifies JWT token synchronously.

**Kind**: instance method of [<code>HttpServer</code>](#HttpServer)  
**Todo**

- [ ] use promises or generators to call it asynchronously!


| Param | Type | Description |
| --- | --- | --- |
| req | <code>object</code> | HTTP request |
| res | <code>object</code> | HTTP response |
| next | <code>function</code> | passes control to next matching route |

<a name="JwtToken"></a>

## JwtToken
Provides JSON Web Token functionality such as token generation and verification.

**Kind**: global class  
**Author**: Adam Wegrzynek <adam.wegrzynek@cern.ch>  

* [JwtToken](#JwtToken)
    * [new JwtToken(config)](#new_JwtToken_new)
    * [.generateToken(personid, username, access)](#JwtToken+generateToken) ⇒ <code>object</code>
    * [.refreshToken(token)](#JwtToken+refreshToken) ⇒ <code>object</code>
    * [.verify(token)](#JwtToken+verify) ⇒ <code>object</code>

<a name="new_JwtToken_new"></a>

### new JwtToken(config)
Stores secret


| Param | Type | Description |
| --- | --- | --- |
| config | <code>object</code> | jwt cofiguration object |

<a name="JwtToken+generateToken"></a>

### jwtToken.generateToken(personid, username, access) ⇒ <code>object</code>
Generates encrypted token with user id and access level.
Sets expiration time and sings it using secret.

**Kind**: instance method of [<code>JwtToken</code>](#JwtToken)  
**Returns**: <code>object</code> - generated token  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| personid | <code>number</code> |  | CERN user id |
| username | <code>string</code> |  | CERN username |
| access | <code>number</code> | <code>0</code> | level of access |

<a name="JwtToken+refreshToken"></a>

### jwtToken.refreshToken(token) ⇒ <code>object</code>
When the token expires, this method allows to refresh it.
It skips expiration check and verifies (already expired) token based on maxAge parameter
(maxAge >> expiration).
Then it creates a new token using parameters of the old one and ships it to the user.
If maxAge timeouts, the user needs to re-login via OAuth.

**Kind**: instance method of [<code>JwtToken</code>](#JwtToken)  
**Returns**: <code>object</code> - new token or false in case of failure  

| Param | Type | Description |
| --- | --- | --- |
| token | <code>object</code> | expired token |

<a name="JwtToken+verify"></a>

### jwtToken.verify(token) ⇒ <code>object</code>
Decrypts user token to verify that is vaild.

**Kind**: instance method of [<code>JwtToken</code>](#JwtToken)  
**Returns**: <code>object</code> - whether operation was successful, if so decoded data are passed as well  

| Param | Type | Description |
| --- | --- | --- |
| token | <code>object</code> | token to be verified |

<a name="WebSocketMessage"></a>

## WebSocketMessage
WebSocket module that allows to create response to user request.
It's based on HTTP status codes.

**Kind**: global class  
**Author**: Adam Wegrzynek <adam.wegrzynek@cern.ch>  

* [WebSocketMessage](#WebSocketMessage)
    * [new WebSocketMessage(code)](#new_WebSocketMessage_new)
    * [.code](#WebSocketMessage+code) ⇒ <code>number</code>
    * [.command](#WebSocketMessage+command)
    * [.command](#WebSocketMessage+command) ⇒ <code>string</code>
    * [.payload](#WebSocketMessage+payload)
    * [.payload](#WebSocketMessage+payload) ⇒ <code>object</code>
    * [.json](#WebSocketMessage+json) ⇒ <code>object</code>
    * [.parse(json)](#WebSocketMessage+parse) ⇒ <code>object</code>
    * [.getCode()](#WebSocketMessage+getCode) ⇒ <code>number</code>
    * [.getToken()](#WebSocketMessage+getToken) ⇒ <code>string</code>
    * [.setCommand(command)](#WebSocketMessage+setCommand) ⇒ <code>object</code>
    * [.getProperty(name)](#WebSocketMessage+getProperty) ⇒ <code>string</code>
    * [.getCommand()](#WebSocketMessage+getCommand) ⇒ <code>string</code>
    * [.setBroadcast()](#WebSocketMessage+setBroadcast) ⇒ <code>object</code>
    * [.getBroadcast()](#WebSocketMessage+getBroadcast) ⇒ <code>bool</code>
    * [.setPayload(payload)](#WebSocketMessage+setPayload) ⇒ <code>object</code>
    * [.getPayload()](#WebSocketMessage+getPayload) ⇒ <code>object</code>

<a name="new_WebSocketMessage_new"></a>

### new WebSocketMessage(code)
Sets initial variables.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| code | <code>number</code> | <code>200</code> | response code (based on HTTP) |

<a name="WebSocketMessage+code"></a>

### webSocketMessage.code ⇒ <code>number</code>
**Kind**: instance property of [<code>WebSocketMessage</code>](#WebSocketMessage)  
**Returns**: <code>number</code> - code  
<a name="WebSocketMessage+command"></a>

### webSocketMessage.command
Command setter.

**Kind**: instance property of [<code>WebSocketMessage</code>](#WebSocketMessage)  

| Param | Type | Description |
| --- | --- | --- |
| command | <code>string</code> | user request command |

<a name="WebSocketMessage+command"></a>

### webSocketMessage.command ⇒ <code>string</code>
**Kind**: instance property of [<code>WebSocketMessage</code>](#WebSocketMessage)  
**Returns**: <code>string</code> - command  
<a name="WebSocketMessage+payload"></a>

### webSocketMessage.payload
Payload setter.

**Kind**: instance property of [<code>WebSocketMessage</code>](#WebSocketMessage)  

| Param | Type |
| --- | --- |
| payload | <code>object</code> | 

<a name="WebSocketMessage+payload"></a>

### webSocketMessage.payload ⇒ <code>object</code>
**Kind**: instance property of [<code>WebSocketMessage</code>](#WebSocketMessage)  
**Returns**: <code>object</code> - payload  
<a name="WebSocketMessage+json"></a>

### webSocketMessage.json ⇒ <code>object</code>
Formats the reponse to object that is ready to be formatted into JSON.

**Kind**: instance property of [<code>WebSocketMessage</code>](#WebSocketMessage)  
**Returns**: <code>object</code> - response  
<a name="WebSocketMessage+parse"></a>

### webSocketMessage.parse(json) ⇒ <code>object</code>
Parses JSON-encoded websocket string into WebSocketMessage object

**Kind**: instance method of [<code>WebSocketMessage</code>](#WebSocketMessage)  
**Returns**: <code>object</code> - promise to parsed message  

| Param | Type |
| --- | --- |
| json | <code>string</code> | 

<a name="WebSocketMessage+getCode"></a>

### webSocketMessage.getCode() ⇒ <code>number</code>
**Kind**: instance method of [<code>WebSocketMessage</code>](#WebSocketMessage)  
**Returns**: <code>number</code> - code  
<a name="WebSocketMessage+getToken"></a>

### webSocketMessage.getToken() ⇒ <code>string</code>
**Kind**: instance method of [<code>WebSocketMessage</code>](#WebSocketMessage)  
**Returns**: <code>string</code> - JWT token  
<a name="WebSocketMessage+setCommand"></a>

### webSocketMessage.setCommand(command) ⇒ <code>object</code>
Command setter.

**Kind**: instance method of [<code>WebSocketMessage</code>](#WebSocketMessage)  
**Returns**: <code>object</code> - 'this' to allow function call chaining  

| Param | Type | Description |
| --- | --- | --- |
| command | <code>string</code> | user request command |

<a name="WebSocketMessage+getProperty"></a>

### webSocketMessage.getProperty(name) ⇒ <code>string</code>
**Kind**: instance method of [<code>WebSocketMessage</code>](#WebSocketMessage)  
**Returns**: <code>string</code> - Object property  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | property name |

<a name="WebSocketMessage+getCommand"></a>

### webSocketMessage.getCommand() ⇒ <code>string</code>
**Kind**: instance method of [<code>WebSocketMessage</code>](#WebSocketMessage)  
**Returns**: <code>string</code> - command  
<a name="WebSocketMessage+setBroadcast"></a>

### webSocketMessage.setBroadcast() ⇒ <code>object</code>
Set broadcast flag to true.

**Kind**: instance method of [<code>WebSocketMessage</code>](#WebSocketMessage)  
**Returns**: <code>object</code> - 'this' to allow function call chaining  
<a name="WebSocketMessage+getBroadcast"></a>

### webSocketMessage.getBroadcast() ⇒ <code>bool</code>
**Kind**: instance method of [<code>WebSocketMessage</code>](#WebSocketMessage)  
**Returns**: <code>bool</code> - broadcast flag  
<a name="WebSocketMessage+setPayload"></a>

### webSocketMessage.setPayload(payload) ⇒ <code>object</code>
Payload setter.

**Kind**: instance method of [<code>WebSocketMessage</code>](#WebSocketMessage)  
**Returns**: <code>object</code> - 'this' to allow function call chaining  

| Param | Type |
| --- | --- |
| payload | <code>object</code> | 

<a name="WebSocketMessage+getPayload"></a>

### webSocketMessage.getPayload() ⇒ <code>object</code>
**Kind**: instance method of [<code>WebSocketMessage</code>](#WebSocketMessage)  
**Returns**: <code>object</code> - payload  
<a name="WebSocket"></a>

## WebSocket
It represents WebSocket server (RFC 6455).
In addition, it provides custom authentication with JWT tokens.

**Kind**: global class  
**Author**: Adam Wegrzynek <adam.wegrzynek@cern.ch>  

* [WebSocket](#WebSocket)
    * [new WebSocket(httpsServer, jwtConfig, hostname)](#new_WebSocket_new)
    * [.shutdown()](#WebSocket+shutdown)
    * [.bind(name, callback)](#WebSocket+bind)
    * [.processRequest(req)](#WebSocket+processRequest) ⇒ <code>object</code>
    * [.onconnection(client, request)](#WebSocket+onconnection)
    * [.onmessage(message, client)](#WebSocket+onmessage)
    * [.ping()](#WebSocket+ping)
    * [.onclose(client)](#WebSocket+onclose)
    * [.broadcast(message)](#WebSocket+broadcast)
    * [.unfilteredBroadcast(message)](#WebSocket+unfilteredBroadcast)

<a name="new_WebSocket_new"></a>

### new WebSocket(httpsServer, jwtConfig, hostname)
Starts up the server and binds event handler.


| Param | Type | Description |
| --- | --- | --- |
| httpsServer | <code>object</code> | HTTPS server |
| jwtConfig | <code>object</code> | configuration of jwt |
| hostname | <code>string</code> | hostname that clients will be conneting to |

<a name="WebSocket+shutdown"></a>

### webSocket.shutdown()
Shutdown WebSocket server cleanly

**Kind**: instance method of [<code>WebSocket</code>](#WebSocket)  
<a name="WebSocket+bind"></a>

### webSocket.bind(name, callback)
Binds callback to websocket message (depending on message name)
Message as an Object is passed to the callback

**Kind**: instance method of [<code>WebSocket</code>](#WebSocket)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | websocket message name |
| callback | <code>function</code> | callback function, that receives message object |

<a name="WebSocket+processRequest"></a>

### webSocket.processRequest(req) ⇒ <code>object</code>
Handles incoming text messages: verifies token and processes request/command.

**Kind**: instance method of [<code>WebSocket</code>](#WebSocket)  
**Returns**: <code>object</code> - message to be send back to the user  

| Param | Type |
| --- | --- |
| req | <code>object</code> | 

<a name="WebSocket+onconnection"></a>

### webSocket.onconnection(client, request)
Handles client connection and message receiving.

**Kind**: instance method of [<code>WebSocket</code>](#WebSocket)  

| Param | Type | Description |
| --- | --- | --- |
| client | <code>object</code> | connected client |
| request | <code>object</code> | connection request |

<a name="WebSocket+onmessage"></a>

### webSocket.onmessage(message, client)
Called when a new message arrivies
Handles connection with a client

**Kind**: instance method of [<code>WebSocket</code>](#WebSocket)  

| Param | Type | Description |
| --- | --- | --- |
| message | <code>object</code> | received message |
| client | <code>object</code> | TCP socket of the client |

<a name="WebSocket+ping"></a>

### webSocket.ping()
Sends ping message every 30s

**Kind**: instance method of [<code>WebSocket</code>](#WebSocket)  
<a name="WebSocket+onclose"></a>

### webSocket.onclose(client)
Handles client disconnection.

**Kind**: instance method of [<code>WebSocket</code>](#WebSocket)  

| Param | Type | Description |
| --- | --- | --- |
| client | <code>object</code> | disconnected client |

<a name="WebSocket+broadcast"></a>

### webSocket.broadcast(message)
Broadcasts the message to all connected clients.
Send messages that match the filter.

**Kind**: instance method of [<code>WebSocket</code>](#WebSocket)  

| Param | Type |
| --- | --- |
| message | <code>string</code> | 

<a name="WebSocket+unfilteredBroadcast"></a>

### webSocket.unfilteredBroadcast(message)
Broadcasts messges to all connected clients.

**Kind**: instance method of [<code>WebSocket</code>](#WebSocket)  

| Param | Type |
| --- | --- |
| message | <code>string</code> | 

<a name="MySQL"></a>

## MySQL
MySQL pool wrapper

**Kind**: global class  
**Author**: Adam Wegrzynek <adam.wegrzynek@cern.ch>  
**Author**: Vladimir Kosmala <vladimir.kosmala@cern.ch>  

* [MySQL](#MySQL)
    * [new MySQL(config)](#new_MySQL_new)
    * [.query(query, parameters)](#MySQL+query) ⇒ <code>object</code>
    * [.close()](#MySQL+close)
    * [.errorHandler(err)](#MySQL+errorHandler) ⇒ <code>string</code>

<a name="new_MySQL_new"></a>

### new MySQL(config)
Creates pool of connections


| Param | Type | Description |
| --- | --- | --- |
| config | <code>object</code> | configuration object including hostname, username, password and database name. |

<a name="MySQL+query"></a>

### mySQL.query(query, parameters) ⇒ <code>object</code>
Prepares and executes query.
Sets up 60s timeout.

**Kind**: instance method of [<code>MySQL</code>](#MySQL)  
**Returns**: <code>object</code> - promise  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> | SQL query |
| parameters | <code>array</code> | parameters to be boud to the query |

<a name="MySQL+close"></a>

### mySQL.close()
Smothly terminates connection pool

**Kind**: instance method of [<code>MySQL</code>](#MySQL)  
<a name="MySQL+errorHandler"></a>

### mySQL.errorHandler(err) ⇒ <code>string</code>
The purpose is to translate MySQL errors to more human readable format

**Kind**: instance method of [<code>MySQL</code>](#MySQL)  
**Returns**: <code>string</code> - Clear error message  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>Error</code> | the error from a catch or callback |

<a name="InfoLoggerSender"></a>

## InfoLoggerSender
Sends InfoLogger logs to InfoLoggerD over UNIX named socket

**Kind**: global class  

* [InfoLoggerSender](#InfoLoggerSender)
    * [new InfoLoggerSender(winston, path)](#new_InfoLoggerSender_new)
    * [.format(fields, version)](#InfoLoggerSender+format) ⇒ <code>string</code>
    * [.send(log)](#InfoLoggerSender+send)
    * [.close()](#InfoLoggerSender+close)

<a name="new_InfoLoggerSender_new"></a>

### new InfoLoggerSender(winston, path)

| Param | Type | Description |
| --- | --- | --- |
| winston | <code>object</code> | local loging object |
| path | <code>string</code> | path to InfoLogger client (log executable) |

<a name="InfoLoggerSender+format"></a>

### infoLoggerSender.format(fields, version) ⇒ <code>string</code>
Formats an log object into InfoLogger log frame

**Kind**: instance method of [<code>InfoLoggerSender</code>](#InfoLoggerSender)  
**Returns**: <code>string</code> - InfoLogger protocol frame  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| fields | <code>object</code> |  | log object |
| version | <code>string</code> | <code>&quot;1.4&quot;</code> | protocol version |

<a name="InfoLoggerSender+send"></a>

### infoLoggerSender.send(log)
Sends log message

**Kind**: instance method of [<code>InfoLoggerSender</code>](#InfoLoggerSender)  

| Param | Type | Description |
| --- | --- | --- |
| log | <code>object</code> | message as Object |

<a name="InfoLoggerSender+close"></a>

### infoLoggerSender.close()
Smoothly closes the connection

**Kind**: instance method of [<code>InfoLoggerSender</code>](#InfoLoggerSender)  
<a name="Log"></a>

## Log
Handles loging, prints out in console, saves to file or sends to cerntral InfoLogger instance

**Kind**: global class  
**Author**: Adam Wegrzynek <adam.wegrzynek@cern.ch>  

* [Log](#Log)
    * [new Log(label)](#new_Log_new)
    * _instance_
        * [.debug(log)](#Log+debug)
        * [.info(log)](#Log+info)
        * [.warn(log)](#Log+warn)
        * [.error(log)](#Log+error)
        * [.trace(err)](#Log+trace)
    * _static_
        * [.configure(config)](#Log.configure)

<a name="new_Log_new"></a>

### new Log(label)
Sets the label and constructs default winston instance


| Param | Type | Default |
| --- | --- | --- |
| label | <code>string</code> | <code>null</code> | 

<a name="Log+debug"></a>

### log.debug(log)
Debug severity log

**Kind**: instance method of [<code>Log</code>](#Log)  

| Param | Type |
| --- | --- |
| log | <code>string</code> | 

<a name="Log+info"></a>

### log.info(log)
Information severity log

**Kind**: instance method of [<code>Log</code>](#Log)  

| Param | Type |
| --- | --- |
| log | <code>string</code> | 

<a name="Log+warn"></a>

### log.warn(log)
Warning severity log

**Kind**: instance method of [<code>Log</code>](#Log)  

| Param | Type |
| --- | --- |
| log | <code>string</code> | 

<a name="Log+error"></a>

### log.error(log)
Error severity log

**Kind**: instance method of [<code>Log</code>](#Log)  

| Param | Type |
| --- | --- |
| log | <code>string</code> | 

<a name="Log+trace"></a>

### log.trace(err)
Prints more details, for debugging purposes

**Kind**: instance method of [<code>Log</code>](#Log)  

| Param | Type |
| --- | --- |
| err | <code>object</code> | 

<a name="Log.configure"></a>

### Log.configure(config)
Configures Winston and InfoLogger instances

**Kind**: static method of [<code>Log</code>](#Log)  

| Param | Type |
| --- | --- |
| config | <code>object</code> | 

<a name="Winston"></a>

## Winston
Creates Winston logger
Uses two transports file and console (if properly configured)

**Kind**: global class  
**Author**: Adam Wegrzynek <adam.wegrzynek@cern.ch>  
<a name="new_Winston_new"></a>

### new Winston(config)
Creates two transports and constructs a logger


| Param | Type | Description |
| --- | --- | --- |
| config | <code>object</code> | configuration for console and file transports |

<a name="https"></a>

## https
**Kind**: global constant  
**License**: Copyright CERN and copyright holders of ALICE O2. This software is
distributed under the terms of the GNU General Public License v3 (GPL
Version 3), copied verbatim in the file &quot;COPYING&quot;.

See http://alice-o2.web.cern.ch/license for full licensing information.

In applying this license CERN does not waive the privileges and immunities
granted to it by virtue of its status as an Intergovernmental Organization
or submit itself to any jurisdiction.  
<a name="fs"></a>

## fs
**Kind**: global constant  
**License**: Copyright CERN and copyright holders of ALICE O2. This software is
distributed under the terms of the GNU General Public License v3 (GPL
Version 3), copied verbatim in the file &quot;COPYING&quot;.

See http://alice-o2.web.cern.ch/license for full licensing information.

In applying this license CERN does not waive the privileges and immunities
granted to it by virtue of its status as an Intergovernmental Organization
or submit itself to any jurisdiction.  
<a name="jwt"></a>

## jwt
**Kind**: global constant  
**License**: Copyright CERN and copyright holders of ALICE O2. This software is
distributed under the terms of the GNU General Public License v3 (GPL
Version 3), copied verbatim in the file &quot;COPYING&quot;.

See http://alice-o2.web.cern.ch/license for full licensing information.

In applying this license CERN does not waive the privileges and immunities
granted to it by virtue of its status as an Intergovernmental Organization
or submit itself to any jurisdiction.  
<a name="WebSocketServer"></a>

## WebSocketServer
**Kind**: global constant  
**License**: Copyright CERN and copyright holders of ALICE O2. This software is
distributed under the terms of the GNU General Public License v3 (GPL
Version 3), copied verbatim in the file &quot;COPYING&quot;.

See http://alice-o2.web.cern.ch/license for full licensing information.

In applying this license CERN does not waive the privileges and immunities
granted to it by virtue of its status as an Intergovernmental Organization
or submit itself to any jurisdiction.  
<a name="MySQL"></a>

## MySQL
**Kind**: global constant  
**License**: Copyright CERN and copyright holders of ALICE O2. This software is
distributed under the terms of the GNU General Public License v3 (GPL
Version 3), copied verbatim in the file &quot;COPYING&quot;.

See http://alice-o2.web.cern.ch/license for full licensing information.

In applying this license CERN does not waive the privileges and immunities
granted to it by virtue of its status as an Intergovernmental Organization
or submit itself to any jurisdiction.  

* [MySQL](#MySQL)
    * [new MySQL(config)](#new_MySQL_new)
    * [.query(query, parameters)](#MySQL+query) ⇒ <code>object</code>
    * [.close()](#MySQL+close)
    * [.errorHandler(err)](#MySQL+errorHandler) ⇒ <code>string</code>

<a name="new_MySQL_new"></a>

### new MySQL(config)
Creates pool of connections


| Param | Type | Description |
| --- | --- | --- |
| config | <code>object</code> | configuration object including hostname, username, password and database name. |

<a name="MySQL+query"></a>

### mySQL.query(query, parameters) ⇒ <code>object</code>
Prepares and executes query.
Sets up 60s timeout.

**Kind**: instance method of [<code>MySQL</code>](#MySQL)  
**Returns**: <code>object</code> - promise  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> | SQL query |
| parameters | <code>array</code> | parameters to be boud to the query |

<a name="MySQL+close"></a>

### mySQL.close()
Smothly terminates connection pool

**Kind**: instance method of [<code>MySQL</code>](#MySQL)  
<a name="MySQL+errorHandler"></a>

### mySQL.errorHandler(err) ⇒ <code>string</code>
The purpose is to translate MySQL errors to more human readable format

**Kind**: instance method of [<code>MySQL</code>](#MySQL)  
**Returns**: <code>string</code> - Clear error message  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>Error</code> | the error from a catch or callback |

<a name="config"></a>

## config
**Kind**: global constant  
**License**: Copyright CERN and copyright holders of ALICE O2. This software is
distributed under the terms of the GNU General Public License v3 (GPL
Version 3), copied verbatim in the file &quot;COPYING&quot;.

See http://alice-o2.web.cern.ch/license for full licensing information.

In applying this license CERN does not waive the privileges and immunities
granted to it by virtue of its status as an Intergovernmental Organization
or submit itself to any jurisdiction.  
<a name="assert"></a>

## assert
**Kind**: global constant  
**License**: Copyright CERN and copyright holders of ALICE O2. This software is
distributed under the terms of the GNU General Public License v3 (GPL
Version 3), copied verbatim in the file &quot;COPYING&quot;.

See http://alice-o2.web.cern.ch/license for full licensing information.

In applying this license CERN does not waive the privileges and immunities
granted to it by virtue of its status as an Intergovernmental Organization
or submit itself to any jurisdiction.  
<a name="assert"></a>

## assert
**Kind**: global constant  
**License**: Copyright CERN and copyright holders of ALICE O2. This software is
distributed under the terms of the GNU General Public License v3 (GPL
Version 3), copied verbatim in the file &quot;COPYING&quot;.

See http://alice-o2.web.cern.ch/license for full licensing information.

In applying this license CERN does not waive the privileges and immunities
granted to it by virtue of its status as an Intergovernmental Organization
or submit itself to any jurisdiction.  
<a name="config"></a>

## config
**Kind**: global constant  
**License**: Copyright CERN and copyright holders of ALICE O2. This software is
distributed under the terms of the GNU General Public License v3 (GPL
Version 3), copied verbatim in the file &quot;COPYING&quot;.

See http://alice-o2.web.cern.ch/license for full licensing information.

In applying this license CERN does not waive the privileges and immunities
granted to it by virtue of its status as an Intergovernmental Organization
or submit itself to any jurisdiction.  
<a name="mysql"></a>

## mysql
**Kind**: global constant  
**License**: Copyright CERN and copyright holders of ALICE O2. This software is
distributed under the terms of the GNU General Public License v3 (GPL
Version 3), copied verbatim in the file &quot;COPYING&quot;.

See http://alice-o2.web.cern.ch/license for full licensing information.

In applying this license CERN does not waive the privileges and immunities
granted to it by virtue of its status as an Intergovernmental Organization
or submit itself to any jurisdiction.  
<a name="net"></a>

## net
**Kind**: global constant  
**License**: Copyright CERN and copyright holders of ALICE O2. This software is
distributed under the terms of the GNU General Public License v3 (GPL
Version 3), copied verbatim in the file &quot;COPYING&quot;.

See http://alice-o2.web.cern.ch/license for full licensing information.

In applying this license CERN does not waive the privileges and immunities
granted to it by virtue of its status as an Intergovernmental Organization
or submit itself to any jurisdiction.  
<a name="protocols"></a>

## protocols
**Kind**: global constant  
**License**: Copyright CERN and copyright holders of ALICE O2. This software is
distributed under the terms of the GNU General Public License v3 (GPL
Version 3), copied verbatim in the file &quot;COPYING&quot;.

See http://alice-o2.web.cern.ch/license for full licensing information.

In applying this license CERN does not waive the privileges and immunities
granted to it by virtue of its status as an Intergovernmental Organization
or submit itself to any jurisdiction.  
<a name="Winston"></a>

## Winston
**Kind**: global constant  
**License**: Copyright CERN and copyright holders of ALICE O2. This software is
distributed under the terms of the GNU General Public License v3 (GPL
Version 3), copied verbatim in the file &quot;COPYING&quot;.

See http://alice-o2.web.cern.ch/license for full licensing information.

In applying this license CERN does not waive the privileges and immunities
granted to it by virtue of its status as an Intergovernmental Organization
or submit itself to any jurisdiction.  
<a name="new_Winston_new"></a>

### new Winston(config)
Creates two transports and constructs a logger


| Param | Type | Description |
| --- | --- | --- |
| config | <code>object</code> | configuration for console and file transports |

<a name="winston"></a>

## winston
**Kind**: global constant  
**License**: Copyright CERN and copyright holders of ALICE O2. This software is
distributed under the terms of the GNU General Public License v3 (GPL
Version 3), copied verbatim in the file &quot;COPYING&quot;.

See http://alice-o2.web.cern.ch/license for full licensing information.

In applying this license CERN does not waive the privileges and immunities
granted to it by virtue of its status as an Intergovernmental Organization
or submit itself to any jurisdiction.  
