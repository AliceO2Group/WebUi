# Control GUI

[![Build Status](https://travis-ci.org/AliceO2Group/ControlGui.svg?branch=master)](https://travis-ci.org/AliceO2Group/ControlGui)
[![Dependencies Status](https://david-dm.org/AliceO2Group/ControlGui/status.svg)](https://david-dm.org/AliceO2Group/ControlGui)
[![devDependencies Status](https://david-dm.org/AliceO2Group/ControlGui/dev-status.svg)](https://david-dm.org/AliceO2Group/ControlGui?type=dev)
[![codecov](https://codecov.io/gh/AliceO2Group/ControlGui/branch/master/graph/badge.svg)](https://codecov.io/gh/AliceO2Group/ControlGui)

This is a prototype of Control GUI. It aims to replace current ECS HI and provide intuitive way of controlling the O<sup>2</sup> data taking.

## Functionality
1. Padlock module - only single user is allowed to execute commands, others act as spectators.

## Installation
The prototype of Control GUI uses following modules of [ALICE O<sup>2</sup> UX framwork](https://github.com/AliceO2Group/Gui):
 * http
 * notifications
 * websocket
 * zeromq

Please check [requirements](https://github.com/AliceO2Group/Gui#requirements) before proceeding with installation steps.

1. Clone repository
  ```
  git clone https://github.com/AliceO2Group/ControlGui && cd ControlGui
  ```

2. Install dependencies
  ```
  npm install
  ```

## Configuration
The configuration file and other necessary data and files need to be prepared in order to properly configure the modules.

1. Rename *config-default.ini* to *config.ini*.
2. Follow instructions from each module to complete configuration.

## Run
Run command:
```
npm start
```
