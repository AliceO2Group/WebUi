# ALICE O<sup>2</sup> Web UI Framework

[![Build Status](https://travis-ci.org/AliceO2Group/WebUi.svg?branch=master)](https://travis-ci.org/AliceO2Group/WebUi)
[![Dependencies Status](https://david-dm.org/AliceO2Group/WebUi/status.svg?path=Framework)](https://david-dm.org/AliceO2Group/WebUi?path=Framework)
[![devDependencies Status](https://david-dm.org/AliceO2Group/WebUi/dev-status.svg?path=Framework)](https://david-dm.org/AliceO2Group/WebUi?path=Framework&type=dev)
[![codecov](https://codecov.io/gh/AliceO2Group/WebUi/branch/master/graph/badge.svg)](https://codecov.io/gh/AliceO2Group/WebUi)
[![JIRA](https://img.shields.io/badge/JIRA-issues-blue.svg)](https://alice.its.cern.ch/jira/projects/OGUI)

### Overview

The goal of this UI framework is to identify library and framework sets, provide the core functionalities and building blocks to easily create rich web application for the [ALICE O<sup>2</sup>](https://alice-o2.web.cern.ch) project.

##### Server-side features
- REST and WebSocket API
- Authentication via CERN OAuth 2.0 and authorization via CERN e-groups
- Communication integrity ensured by JSON Web Tokens
- External resource access: MySQL, ZeroMQ, gRPC

##### Client side-features
- User interface CSS building blocks in accordance with ALICE standards
- Asynchronous data fetching (Ajax) and bi-directional socket (WebSockets)
- MVC engine with a "diffing" algorithm

### System requirements
* `nodejs` >= 8.9.4
* `zeromq-devel` >= 4.0 (optional, see [zeromq](docs/ZMQ.md) module docs for more details)

#### CERN CentOS 7
Install `zeromq-devel`
```
sudo yum install zeromq-devel
```

Then, download `nodejs` from https://nodejs.org/en/download/ unarchive it and add `bin` directory your `PATH`
```
curl -O https://nodejs.org/dist/v8.11.1/node-v8.11.1-linux-x64.tar.gz
tar xvf node-v8.11.1-linux-x64.tar.gz
export PATH=`pwd`/node-v8.11.1-linux-x64/bin:$PATH
```
#### macOS
Install packages using `brew`
```
brew install zeromq node
```

### Minimum browser version support
- Chrome 62
- Firefox 54 (**!** Navigate to `about:config` set value `true` of `dom.moduleScripts.enabled` preference)
- Edge 16
- Safari 10.1

### Installation
```
npm install --save @aliceo2/web-ui
```

### Getting started
* [Hello World](./docs/tutorial/hello-world.md)
* [Tutorial: Time server using Ajax and WebSockets](./docs/tutorial/time-server.md)
* [Advanced frontend demo (JSFiddle)](http://jsfiddle.net/awegrzyn/kytn60v8/)

### Backend guide
* [HTTPS server](./docs/guide/http-server.md) - serves custom REST API, supports TLS
* [JSON Web Tokens](./docs/guide/json-tokens.md) - secures HTTP requests and WebSocket messages with a JWT token
* [Logging](./docs/guide/logging.md) - stores log messages in a file or pushes them to InfoLogger service
* [OAuth](./docs/guide/oauth.md) - provides authentication via CERN oAuth and authorization via e-grups
* [WebSockets](./docs/guide/websockets.md) - provides bi-directional communication between browsers and server using WebSocket protocol
* [ZeroMQ](./docs/guide/zeromq.md) - ZeroMQ client to providing `sub` or `req` socket patterns
* [MySQL](./docs/guide/mysql.md) - MySQL client with simple CRUD queries

### Frontend guide
- [Template engine](./docs/guide/template-engine.md) - MVC using hyperscript (no HTML) and observable model
- [Components](./docs/guide/components.md) - Split and reuse elements
- [Scaling the application](./docs/guide/scale-app.md) - Scale the code of your application
- [Debug](./docs/guide/debug.md) - Debug the application with browser's tools
- [Ajax](./docs/guide/async-calls.md) - Asynchronously fetch data from the server
- [WebSocket client](./docs/guide/websocket-client.md) - Connect to WebSocket server
- [Routing](./docs/guide/front-router.md) - Let you manage many pages in one application

### API Reference
* [Backend JS](docs/reference/backend.md)
* [Frontend JS](docs/reference/frontend-api.md)
* [Frontend CSS](https://aliceo2group.github.io/WebUi/Framework/docs/reference/frontend-css.html)
* [Frontend classes overview](./docs/images/front-arch.dot.png)

### Documentation for developers
* [Development environment](docs/guide/devel.md)
* [Functional architecture and data flow](docs/ARCH.md)
