# ALICE O<sup>2</sup> UI

[![Build Status](https://travis-ci.org/AliceO2Group/Gui.svg?branch=master)](https://travis-ci.org/AliceO2Group/Gui)
[![Dependencies Status](https://david-dm.org/AliceO2Group/Gui/status.svg)](https://david-dm.org/AliceO2Group/Gui)
[![devDependencies Status](https://david-dm.org/AliceO2Group/Gui/dev-status.svg)](https://david-dm.org/AliceO2Group/Gui?type=dev)
[![codecov](https://codecov.io/gh/AliceO2Group/Gui/branch/master/graph/badge.svg)](https://codecov.io/gh/AliceO2Group/Gui)

The goal of ALICE O<sup>2</sup> UI framework is to identify library and framework sets and develop the core functionalities of common [ALICE O<sup>2</sup>](https://alice-o2.web.cern.ch) Web Applications.

### System requirements
* `nodejs` >= 7
* `zeromq-devel` >= 4.0 (optional, see [zeromq](docs/ZMQ.md) module docs for more details)

### User requirements
- Chrome 62 (end 2017)
- Firefox 54 (end 2017 - [must activate modules](docs/guides/firefox-modules.md))
- EDGE 16 (end 2017)
- Safari 10.1 (2017)
- iOS Safari (2017)
- Chrome Android 62
* https://caniuse.com/#feat=es6-module
* https://caniuse.com/#feat=template-literals
* https://caniuse.com/#feat=es6-class
* https://caniuse.com/#feat=arrow-functions
* https://caniuse.com/#feat=promises
* https://caniuse.com/#feat=async-functions

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
* [API JS](docs/reference/frontend-js.md)
* [Reference CSS](docs/reference/frontend-css.md)

- [Write DOM with Javascript without HTML](./docs/guides/reactive-programming.md)
- [What are hyperscript and virtual nodes](./docs/guides/vnodes.md)
- [Handle sorted list with keys](./docs/guides/keys.md)
- [Reuse parts of a view as Components](./docs/guides/components.md)
- [Debugging with the inspector](./docs/guides/debug.md)
- [Async calls (ajax)](./docs/guides/async-calls.md)
- [Scale the code of your application (architecture)](./docs/guides/scale-app.md)

### Tutorials
- TODO: Quick start with a skeleton
- [Hello World - quick start copy/paste](./docs/tutorials/hello-world.md)
- [Pasta Timer - step by step](./docs/tutorials/pasta-timer.md)
- TODO: full application using ajax, ws, js, css

### Documentation for developers
* [API](docs/API.md)
* [Development environment](docs/DEV.md)
* [Functional architecture and data flow](docs/ARCH.md)
