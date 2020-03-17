# Control GUI

[![Actions Status](https://github.com/AliceO2Group/WebUi/workflows/Control/badge.svg)](https://github.com/AliceO2Group/WebUi/actions)
[![codecov](https://codecov.io/gh/AliceO2Group/WebUi/branch/dev/graph/badge.svg?flag=control)](https://codecov.io/gh/AliceO2Group/WebUi)
This is a prototype of Control GUI. It aims to replace current ECS HI and provide intuitive way of controlling the O<sup>2</sup> data taking.

It communicates with [Control agent](https://github.com/AliceO2Group/Control) over gRPC.

## Features
1. Lock interface - single user is allowed to execute commands, others act as spectators
2. List, create, control and delete environments
3. List roles

## Installation
```
npm install @aliceo2/control
```

## Integration with Notification Service

This feature requires HTTPS.

Kafka configuration:
```javascript
kafka: {
  hostnames: 'test.cern.ch',
  port: 9092,
  topic: 'webui'
}
```
