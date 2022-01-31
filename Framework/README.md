# ALICE O<sup>2</sup> Web UI Framework


[![Actions Status](https://github.com/AliceO2Group/WebUi/workflows/Framework/badge.svg)](https://github.com/AliceO2Group/WebUi/actions)
[![codecov](https://codecov.io/gh/AliceO2Group/WebUi/branch/dev/graph/badge.svg?flag=framework)](https://codecov.io/gh/AliceO2Group/WebUi)
[![JIRA](https://img.shields.io/badge/JIRA-issues-blue.svg)](https://alice.its.cern.ch/jira/projects/OGUI)

- [ALICE O<sup>2</sup> Web UI Framework](#alice-osup2sup-web-ui-framework)
    - [Overview](#overview)
      - [Server-side features](#server-side-features)
      - [Client-side features](#client-side-features)
    - [Backend requirements](#backend-requirements)
      - [CentOS 7](#centos-7)
      - [macOS](#macos)
    - [Minimum browser version support](#minimum-browser-version-support)
    - [Installation](#installation)
    - [Getting started](#getting-started)
    - [Backend guide](#backend-guide)
    - [Frontend guide](#frontend-guide)
    - [References](#references)
    - [Documentation for developers](#documentation-for-developers)

### Overview

The goal of this UI framework is to identify library and framework sets, provide the core functionalities and building blocks to easily create rich web application for the [ALICE O<sup>2</sup>](https://alice-o2.web.cern.ch) project.

#### Server-side features
- REST and WebSocket API
- Authentication via CERN SSO (OpenID Connect), authorisation using CERN e-groups
- Communication integrity ensured by JSON Web Tokens
- External resource access: MySQL, gRPC, Consul

#### Client-side features
- User interface CSS building blocks in accordance with ALICE standards
- Asynchronous data fetching (Ajax) and bi-directional socket (WebSockets)
- MVC engine with a "diffing" algorithm

### Backend requirements
* `nodejs` >= v14.16.0

#### CentOS 7
```
yum install https://rpm.nodesource.com/pub_14.x/el/7/x86_64/nodejs-14.16.1-1nodesource.x86_64.rpm
```

#### macOS
```
brew install node
```

### Minimum browser version support
- Chrome 61
- Firefox 60
- Edge 80
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
* [REST API](./docs/guide/http-server.md) - Serves custom REST API, supports TLS
* [JSON Web Tokens](./docs/guide/json-tokens.md) - Secures HTTP requests and WebSocket messages with a JWT token
* [Logging](./docs/guide/logging.md) - Stores log messages in a file or pushes them to InfoLogger service
* [SSO - OpenID Connect](./docs/guide/openid.md) - Provides authentication using CERN SSO via OpenID Connect
* [WebSocket server](./docs/guide/websockets.md) - Provides bi-directional communication between browsers and server using WebSocket protocol
* [MySQL](./docs/guide/mysql.md) - MySQL client with simple CRUD queries
* [Consul](./docs/guide/consul.md) - Consul service with simple Read queries
* [JIRA](./docs/guide/jira.md) - Create JIRA issues
* [Notification service](./docs/guide/notification.md) - Trigger and receive notification using Kafka cluster

### Frontend guide
- [Template engine](./docs/guide/template-engine.md) - MVC using hyperscript and observable model
- [Components](./docs/guide/components.md) - Split and reuse elements
- [Scaling the application](./docs/guide/scale-app.md) - Scale the code of your application
- [Debug](./docs/guide/debug.md) - Debug the application with browser's tools
- [Ajax](./docs/guide/async-calls.md) - Asynchronously fetch data from the server
- [WebSocket client](./docs/guide/websocket-client.md) - Connect to WebSocket server
- [Routing](./docs/guide/front-router.md) - Let you manage many pages in one application
- [Charts](./docs/guide/charts.md) - Plot time-series

### References
* [Frontend CSS](https://aliceo2group.github.io/WebUi/Framework/docs/reference/frontend-css.html)
* [Frontend classes overview](./docs/images/front-arch.dot.png)

### Documentation for developers
* [Development environment](./docs/guide/devel.md)
