# ALICE O<sup>2</sup> UI

[![Build Status](https://travis-ci.org/AliceO2Group/Gui.svg?branch=master)](https://travis-ci.org/AliceO2Group/Gui)
[![Dependencies Status](https://david-dm.org/AliceO2Group/Gui/status.svg)](https://david-dm.org/AliceO2Group/Gui)
[![devDependencies Status](https://david-dm.org/AliceO2Group/Gui/dev-status.svg)](https://david-dm.org/AliceO2Group/Gui?type=dev)
[![codecov](https://codecov.io/gh/AliceO2Group/Gui/branch/master/graph/badge.svg)](https://codecov.io/gh/AliceO2Group/Gui)

The goal of ALICE O<sup>2</sup> UI framework is to identify library and framework sets and develop the core functionalities of common [ALICE O<sup>2</sup>](https://alice-o2.web.cern.ch) Web Applications.

### System requirements
* `nodejs` >= 7
* `zeromq-devel` >= 4.0 (optional, see [zeromq](docs/ZMQ.md) module docs for more details)

### Minimum browser version support
- Chrome 62
- Firefox 54 (__!__Navigate to <a href="about:config" target="_blank">about:config</a> set value `true` of `dom.moduleScripts.enabled` preference)
- EDGE 16
- Safari 10.1
- iOS Safari
- Chrome Android 62

### Installation
```
npm install --save @aliceo2/aliceo2-gui
```

### Backend
Modules documentation:
* [https](docs/HTTP.md) - HTTP server and REST API
* [jwt](docs/JWT.md) - secure requests with JSON Web Token (for `https` and `websockets` modules)
* [log](docs/LOG.md) - save log messages into a file or push them to InfoLogger service
* [oauth](docs/OAUTH.md) - CERN oAuth (for `https` module)
* [websockets](docs/WS.md) - communicate with server using websocket protocol
* [zeromq](docs/ZMQ.md) - create `sub` or `req` zeromq sockets easily

### Frontend
* [API Reference JS](docs/reference/frontend-js.md)
* [API Reference CSS](docs/reference/frontend-css.md)

- [Write DOM with Javascript without HTML](./docs/guide/reactive-programming.md)
- [What are hyperscript and virtual nodes](./docs/guide/vnodes.md)
- [Handle sorted list with keys](./docs/guide/keys.md)
- [Reuse parts of a view as Components](./docs/guide/components.md)
- [Debugging with the inspector](./docs/guide/debug.md)
- [Async calls (ajax)](./docs/guide/async-calls.md)
- [Scale the code of your application (architecture)](./docs/guide/scale-app.md)

### Tutorials
- TODO: Quick start with a skeleton
- [Hello World - quick start copy/paste](./docs/tutorial/hello-world.md)
- [Pasta Timer - step by step](./docs/tutorial/pasta-timer.md)
- TODO: full application using ajax, ws, js, css

### Documentation for developers
* [API](docs/API.md)
* [Development environment](docs/DEV.md)
* [Functional architecture and data flow](docs/ARCH.md)
