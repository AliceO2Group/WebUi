# ALICE O<sup>2</sup> UI

[![Build Status](https://travis-ci.org/AliceO2Group/Gui.svg?branch=master)](https://travis-ci.org/AliceO2Group/Gui)
[![Dependencies Status](https://david-dm.org/AliceO2Group/Gui/status.svg)](https://david-dm.org/AliceO2Group/Gui)
[![devDependencies Status](https://david-dm.org/AliceO2Group/Gui/dev-status.svg)](https://david-dm.org/AliceO2Group/Gui?type=dev)
[![codecov](https://codecov.io/gh/AliceO2Group/Gui/branch/master/graph/badge.svg)](https://codecov.io/gh/AliceO2Group/Gui)

The goal of ALICE O<sup>2</sup> UI framework is to identify library and framework sets and develop the core functionalities of common [ALICE O<sup>2</sup>](https://alice-o2.web.cern.ch) Web Applications.

### System requirements
* `nodejs` >= 8.9.4
* `zeromq-devel` >= 4.0 (optional, see [zeromq](docs/ZMQ.md) module docs for more details)

### Minimum browser version support
- Chrome 62
- Firefox 54 (**!** Navigate to `about:config` set value `true` of `dom.moduleScripts.enabled` preference)
- Edge 16
- Safari 10.1
- iOS Safari
- Chrome Android 62

### Installation
```
npm install @aliceo2/aliceo2-gui
```

### Getting started
- [Overview](docs/guide/overview.md)
- [Starting a new project](docs/skeleton/README.md)

### Tutorials
* [Time server using Ajax and WebSockets](./docs/tutorial/time-server.md)

### Backend guide
* [HTTPS server](./docs/guide/http-server.md) - serves custom REST API, supports TLS
* [JSON Web Tokens](./docs/guide/json-tokens.md) - secures HTTP requests and WebSocket messages with a token
* [Logging](./docs/guide/logging.md) - stores log messages in a file or push them to InfoLogger service
* [OAuth](./docs/guide/oauth.md) - provides authentication via CERN oAuth and authorization via e-grups
* [WebSockets](./docs/guide/websockets.md) - provides bi-directional communication between browsers and server using websocket protocol
* [ZeroMQ](./docs/guide/zeromq.md) - ZeroMQ client to providing `sub` or `req` socket patterns

### Frontend guide
- [Hyperscript and vnode](./docs/guide/hyperscript-vnode.md) - Manipulate the HTML view with Javascript
- [Components](./docs/guide/components.md) - Split and reuse views
- [Architecture](./docs/guide/scale-app.md) - Scale the code of your application with convensions
- [Keys](./docs/guide/keys.md) - Handle sorted list in hyperscript with keys
- [Debug](./docs/guide/debug.md) - Use the inspector
- [Ajax](./docs/guide/async-calls.md) - Fetch data from the server

### API Reference
* [Backend](docs/reference/backend.md)
* [Frontend JS](docs/reference/frontend-js.md)
* [Frontend CSS](docs/reference/frontend-css.md)

### Documentation for developers
* [Development environment](docs/DEV.md)
* [Functional architecture and data flow](docs/ARCH.md)
