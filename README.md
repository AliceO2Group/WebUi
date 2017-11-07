# ALICE O<sup>2</sup> UX

[![Build Status](https://travis-ci.org/AliceO2Group/Gui.svg?branch=master)](https://travis-ci.org/AliceO2Group/Gui)
[![Dependencies Status](https://david-dm.org/AliceO2Group/Gui/status.svg)](https://david-dm.org/AliceO2Group/Gui)
[![devDependencies Status](https://david-dm.org/AliceO2Group/Gui/dev-status.svg)](https://david-dm.org/AliceO2Group/Gui?type=dev)
[![codecov](https://codecov.io/gh/AliceO2Group/Gui/branch/master/graph/badge.svg)](https://codecov.io/gh/AliceO2Group/Gui)

The goal of ALICE O<sup>2</sup> UX framework is to identify library and framework sets and develop the core functionalities of common [ALICE O<sup>2</sup>](https://alice-o2.web.cern.ch) Web Applications.

## Features
 - HTTPS / REST API
   - Authentication via CERN OAuth 2 and authorization via e-groups
 - WebSocket
   - Custom WebSocket authentication based on JSON Web Tokens
 - ZeroMQ client 
   - *sub* and *rep* patterns

## System requirements
 * `nodejs` >= 7
 * `zeromq-devel` >= 4.0 (see [zeromq](docs/ZMQ.md) module docs for more details)

## Installation
 ```
 npm install --save @aliceo2/aliceo2-gui
 ```

## Getting started
See documentation of available modules:
 * [http/https](docs/HTTP.md)
 * [websockets](docs/WS.md)
 * [zeromq](docs/ZMQ.md)

## Documentation for developers
 * [API](docs/API.md)
 * [Development environment](docs/DEV.md)
 * [Functional architecture and data flow](docs/ARCH.md)
