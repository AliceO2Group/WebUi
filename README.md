# Control GUI

[![Build Status](https://travis-ci.org/AliceO2Group/ControlGui.svg?branch=master)](https://travis-ci.org/AliceO2Group/ControlGui)
[![Dependencies Status](https://david-dm.org/AliceO2Group/ControlGui/status.svg)](https://david-dm.org/AliceO2Group/ControlGui)
[![devDependencies Status](https://david-dm.org/AliceO2Group/ControlGui/dev-status.svg)](https://david-dm.org/AliceO2Group/ControlGui?type=dev)
[![codecov](https://codecov.io/gh/AliceO2Group/ControlGui/branch/master/graph/badge.svg)](https://codecov.io/gh/AliceO2Group/ControlGui)

The goal of Control GUI Prototype is to identify library and framework sets and develop the core functionalities of common [ALICE O<sup>2</sup>](https://alice-o2.web.cern.ch) Web Applications:
- Server-side (node.js)
  - HTTPS / REST API
  - Authentication via CERN OAuth 2 and authorization via e-groups
- WebSocket (node.js)
  - WebSocket server that can communicate with C++ processes via ZeroMQ (C++ library available in another repo)
  - Custom WebSocket authentication based on JSON Web Tokens
- Front-end (JavaScript/jQuery)
  - Core modules as custom jQuery widgets

## Control specific functionality developed so far
1. Padlock module - single user that owns the lock is allowed to execute commands, other connected users act as spectators.
2. Notification module - The users can subscribe to notifications and choose the type of notifications that they want to receive.

## Installation
1. Install ZeroMQ >= 4.0 (including zeromq-devel)
2. Clone repository
     ```
     git clone https://github.com/AliceO2Group/ControlGui && cd ControlGui
     ```
3. Install dependencies
    ```
    npm install
     ```
4.  MySQL setup instructions
  Run this command in your MySQL command line-
    ```sql
    CREATE TABLE `subscriptions` (
      `sub_id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      `endpoint` varchar(300) DEFAULT NULL,
      `auth_key` varchar(200) DEFAULT NULL,
      `p256dh_key` varchar(200) DEFAULT NULL,
      `deviceToken` varchar(100) DEFAULT NULL,
      `preferences` varchar(20) NOT NULL DEFAULT '000'
    ) ENGINE=MyISAM DEFAULT CHARSET=utf8;
    ```
5. For configuring Push Notifications for macOS, you need to generate some tokens and certificates. The steps for these are [specified here](docs/APNS.md).


### ZeroMQ custom installation
If you've installed ZeroMQ under custom path, npm install will fail with : *fatal error: zmq.h: No such file or directory*
To resolve this issue you need to recompile zmq module.

1. Go to ControGui directory
2. Download zeromq modue
     ```
     curl `npm v zeromq dist.tarball` | tar xvz && mv package/ node_modules/zeromq/
     ```
3. Add ZeroMQ include directory to *node_modules/zeromq/binding.gyp* file after line 67
     ```
     '-I/<ZeroMQPath>/include/'
     ```
4. Run again 
     ```
     npm install
     ```

## Configuration file
Replace *&lt;tags&gt;* with corresponding data:

1. jwt
  * secret - JWT secret passphrase
  * issuer - name of token issuer
  * expiration - token expiration time (as time literal)
  * maxAge - token refresh expiration time (as time literal)
2. oAuth
  * secret - oAuth secret
  * id - oAuth ID
  * tokenHost - hostname that provides tokens
  * tokenPath - path to token provider
  * authorizePath - verifies access token
  * redirectUri - oAuth application callback
  * scope - oAuth scope (to fetch user details)
  * state - oAuth state (to prevent CSRF attacks)
  * resource - details of resource server
    * hostname - resource server hostname
    * path - resource server path
    * port - resource server port
3. key - private key
4. cert - certificate
5. zeromq
  * sub - details of control publisher endpoint
  * req - details of control reply endpoint
6. http
  * port - http port
  * portSecure - https port
7. log - log filter
  * console - level of logs displayed in console
  * file - level of logs saved into log file
8. websocket
  * hostname - Websocket hostname
9. pushNotifications
  * vapid
    * publicKey - Application Server VAPID Public Key
    * privateKey - Application Server VAPID Private key
    (for steps to generate these keys, go to [Generating the VAPID keys](#generating-the-vapid-keys))
    * email - Email Id for VAPID Keys
  * APN (for steps to obtain all these, go [here](docs/APNS.md))
    * keyId - ID of the APN Authentication Token (obtained while creating the token)
    * teamId - Your Apple Team ID (obtained from your [Apple Developer Account](https://developer.apple.com/account))
    * pushId - 'Identifier' used while registering with Apple
    * authenticationToken - APN Authentication Token `.p8` File
  * host - MySQL Host
  * user - MySQL User
  * password - MySQL Password
  * database - MySQL Database Name

## Generating the VAPID keys
You can generate a set of Private and Public VAPID keys using any of the two methods mentioned below-
  1. By using 'web-push' package from the terminal.
     ```bash
     ./node_modules/web-push/src/cli.js generate-vapid-keys
     ```
  2. By going to [Google CodeLab](https://web-push-codelab.appspot.com) (use Chrome or Mozilla, not Safari).

## Run
Rename *config-default.ini* to *config.ini* and run:
```
npm start
```

## Documentation

### API
The JSDoc documentation in Markdown format is available [in here](docs/API.md).

### Application architecture and data flow
The Control GUI web-application consists of multiple modules on server and client side. [This document](docs/ARCH.md) explains applications' functional architecture and data flows used for in varoius scenarios.

### Push Notification
The Control GUI web-application Push Notifications work using several components. The description of all components and the workflow of notification widget is provided [here](docs/PUSHNOTIF.md).

### For developers
* [Coding guideline](https://github.com/AliceO2Group/CodingGuidelines)
* [Development environment](docs/DEV.md)
