# ALICE O<sup>2</sup> Web UI Framework

[![Travis Status](https://travis-ci.com/AliceO2Group/WebUi.svg?branch=dev)](https://travis-ci.com/AliceO2Group/WebUi)
[![Dependencies Status](https://david-dm.org/AliceO2Group/WebUi/status.svg?path=Framework)](https://david-dm.org/AliceO2Group/WebUi?path=Framework)
[![devDependencies Status](https://david-dm.org/AliceO2Group/WebUi/dev-status.svg?path=Framework)](https://david-dm.org/AliceO2Group/WebUi?path=Framework&type=dev)
[![codecov](https://codecov.io/gh/AliceO2Group/WebUi/branch/master/graph/badge.svg)](https://codecov.io/gh/AliceO2Group/WebUi)
[![JIRA](https://img.shields.io/badge/JIRA-issues-blue.svg)](https://alice.its.cern.ch/jira/projects/OGUI)

### Overview

The goal of this UI framework is to identify library and framework sets, provide the core functionalities and building blocks to easily create rich web application for the [ALICE O<sup>2</sup>](https://alice-o2.web.cern.ch) project.

##### Server-side features
- REST and WebSocket API
- Authentication via CERN OAuth 2.0 and authorisation via CERN e-groups
- Communication integrity ensured by JSON Web Tokens
- External resource access: MySQL, gRPC

##### Client-side features
- User interface CSS building blocks in accordance with ALICE standards
- Asynchronous data fetching (Ajax) and bi-directional socket (WebSockets)
- MVC engine with a "diffing" algorithm

### System requirements
* `nodejs` >= 8.9.4

#### CentOS 7
```
sudo curl -sL https://rpm.nodesource.com/setup_10.x | bash -
sudo yum install -y nodejs
```
#### macOS
```
brew install node
```

### Minimum browser version support
- Chrome 61
- Firefox 60
- Edge 16
- Safari 10.1
- Opera 47

### Installation
```
npm install --save @aliceo2/web-ui
```

### Getting started
* [Step-by-step tutorial: Time server using Ajax and WebSockets](./docs/tutorial/time-server.md)
* [Advanced frontend demo](https://aliceo2group.github.io/WebUi/Framework/docs/demo/frontend.html)

### Backend guide
* [HTTPS server](./docs/guide/http-server.md) - Serves custom REST API, supports TLS
* [JSON Web Tokens](./docs/guide/json-tokens.md) - Secures HTTP requests and WebSocket messages with a JWT token
* [Logging](./docs/guide/logging.md) - Stores log messages in a file or pushes them to InfoLogger service
* [OAuth](./docs/guide/oauth.md) - Provides authentication via CERN oAuth and authorisation via e-groups
* [WebSockets](./docs/guide/websockets.md) - Provides bi-directional communication between browsers and server using WebSocket protocol
* [MySQL](./docs/guide/mysql.md) - MySQL client with simple CRUD queries

### Frontend guide
- [Template engine](./docs/guide/template-engine.md) - MVC using hyperscript and observable model
- [Components](./docs/guide/components.md) - Split and reuse elements
- [Scaling the application](./docs/guide/scale-app.md) - Scale the code of your application
- [Debug](./docs/guide/debug.md) - Debug the application with browser's tools
- [Ajax](./docs/guide/async-calls.md) - Asynchronously fetch data from the server
- [WebSocket client](./docs/guide/websocket-client.md) - Connect to WebSocket server
- [Routing](./docs/guide/front-router.md) - Let you manage many pages in one application
- [Charts](./docs/guide/charts.md) - Plot time-series

### API Reference
* [Backend JS](./docs/reference/backend.md)
* [Frontend JS](./docs/reference/frontend-api.md)
* [Frontend CSS](https://aliceo2group.github.io/WebUi/Framework/docs/reference/frontend-css.html)
* [Frontend classes overview](./docs/images/front-arch.dot.png)

### Documentation for developers
* [Development environment](./docs/guide/devel.md)
* [Authentication and authorization](./docs/guide/auth.md)
* [Known issues](./docs/guide/issues.md)
