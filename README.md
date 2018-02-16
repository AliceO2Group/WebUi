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
npm install --save @aliceo2/aliceo2-gui
```

### Backend guide
* [https](docs/HTTP.md) - HTTP(S) server that serves custom REST API
* [jwt](docs/JWT.md) - secure HTTP requests and WebSocket messages with JSON Web Token (required for `https` and `websockets` modules)
* [log](docs/LOG.md) - stores log messages in a file or push them to InfoLogger service
* [oauth](docs/OAUTH.md) - provides authentication via CERN oAuth and authorization via e-grups (optional for `https` module)
* [websockets](docs/WS.md) - provides bi-directional communication between browsers and server using websocket protocol
* [zeromq](docs/ZMQ.md) - ZeroMQ client to providing `sub` or `req` socket patterns

### Frontend guide
- [Write DOM with Javascript without HTML](./docs/guide/reactive-programming.md)
- [What are hyperscript and virtual nodes](./docs/guide/vnodes.md)
- [Handle sorted list with keys](./docs/guide/keys.md)
- [Reuse parts of a view as Components](./docs/guide/components.md)
- [Debugging with the inspector](./docs/guide/debug.md)
- [Async calls (ajax)](./docs/guide/async-calls.md)
- [Scale the code of your application (architecture)](./docs/guide/scale-app.md)

### API Reference
* [Backend](docs/reference/backend.md)
* [Frontend JS](docs/reference/frontend-js.md)
* [Frontend CSS](docs/reference/frontend-css.md)

### Tutorials
- [Hello World - quick start copy/paste](./docs/tutorial/hello-world.md)
- [Pasta Timer - step by step](./docs/tutorial/pasta-timer.md)
- TODO: full application using ajax, ws, js, css

### Project skeleton
The skeleton of a project using this framework can be found in [docs/skeleton](docs/skeleton).

### Documentation for developers
* [Development environment](docs/DEV.md)
* [Functional architecture and data flow](docs/ARCH.md)
