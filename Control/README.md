# Control GUI
[![Actions Status](https://github.com/AliceO2Group/WebUi/workflows/Control/badge.svg)](https://github.com/AliceO2Group/WebUi/actions)
[![codecov](https://codecov.io/gh/AliceO2Group/WebUi/branch/dev/graph/badge.svg?flag=control)](https://codecov.io/gh/AliceO2Group/WebUi)


- [Control GUI](#control-gui)
  - [Description](#description)
  - [Requirements](#requirements)
  - [Installation](#installation)
  - [Configuration](#configuration)
    - [gRPC](#grpc)
    - [Grafana](#grafana)
    - [Consul](#consul)
    - [Kafka](#kafka)
    - [InfoLogger GUI](#infologger-gui)
  - [Features](#features)
    - [GUI](#gui)
      - [Enable/Disable CRU Links](#enabledisable-cru-links)
      - [Clean Resources/Tasks](#clean-resourcestasks)
    - [Integration with Notification Service](#integration-with-notification-service)
  - [Continuous Integration Workflows](#continuous-integration-workflows)
    - [control.yml](#controlyml)
    - [release.yml](#releaseyml)

## Description
This is a prototype of Control GUI. It aims to replace current ECS HI and provide intuitive way of controlling the O<sup>2</sup> data taking.

It communicates with [Control agent](https://github.com/AliceO2Group/Control) over gRPC.

## Requirements
- `nodejs` >= `14.16.0`

## Installation
1. `git clone https://github.com/AliceO2Group/WebUi.git`
2. `cd WebUi/Control`
3. `npm ci`
4. `cp config-default.js config.js`
5. Modify `config.js` file to set endpoint details (More information in section [Configuration](#configuration))
6. Start web app: `npm start`
7. Open browser and navigate to http://localhost:8080

## Configuration
### gRPC
* `hostname` - gRPC hostname
* `port` - gRPC port
* `timeout` -  ms, gRPC deadline for service calls

### Grafana
* `hostname` - Grafana instance hostname
* `port` - Grafana instance port

### Consul
Use of a Consul instance is optional

* `hostname` - Consul head node hostname
* `port` - Consul head node port
* `flpHardwarePath` - Prefix for KV Store for the content about the FLPs machines
* `readoutPath` - Prefix for KV Store for readout's configuration
* `readoutCardPath` - Prefix for KV Store for readout-card's configuration
* `qcPath` - Prefix for KV Store for quality-control's configuration
* `consulKVPrefix` - Name of the Consul cluster used by AliceO2
  
### Kafka
Use of a Kafka instance is optional. It is being used for prompting [Browser Notifications](#integration-with-notification-service) 

* `hostnames` - list of hostnames separated by comma
* `port` - port of the Grafana instance
* `topic` - A string to follow for messages

### InfoLogger GUI
Use of InfoLogger GUI instance is optional. Configuration details about it are being used only for building URLs to help the user navigate the logs of its actions.

* `hostname` - InfoLogger GUI hostname
* `port` - InfoLogger GUI port

## Features

### GUI
1. Lock interface - single user is allowed to execute commands, others act as spectators
2. List, create, control and shutdown environments
3. External resources access:
   * [gRPC](https://grpc.io/)
   * [Consul](https://www.consul.io/) - used for KV Store
   * [Kafka-Node](https://www.npmjs.com/package/kafka-node) - used for prompting [Browser Notifications](#integration-with-notification-service) to the user
   * [Grafana](https://grafana.com/) - used to display control environment plots
#### Enable/Disable CRU Links
1. Navigate to the `Configuration` page by clicking on the `Links` sub-menu from the left side-bar
   Here, CRUs will be grouped by host
2. Lock the interface via the top-left lock button
3. Select the hosts that should be updated by using the check-box in front of the host name
4. Update the links' state of the selected hosts accordingly
5. By pressing the top-right grey `Save` button, the links state will be saved directly in Consul for the selected hosts
6. By pressing the top-right blue `Configure` button, the CRUs of the selected hosts will be updated with the configuration previously saved in Consul.

It is important to know that the `Configure` action will also apply any other `CRU` changes that were applied directly in `Consul` and NOT only the state of the links. 

#### Clean Resources/Tasks
1. Navigate to the `Tasks` page by clicking on the `Task list` sub-menu from the left side-bar
   
Here, tasks will be grouped by host and each host has an in-line button to provide a download button for the logs of that machine

2. Lock the interface via the top-left lock button
3. Use the top-right orange text `Clean Resources` button to request AliECS Core to run the `o2-roc-cleanup` workflow
4. Use the top-right red text `Clean Tasks` button to request AliECS Core to remove all tasks that do not belong to an environment
### Integration with Notification Service
This feature requires HTTPS as it is making use of [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/notification)

Kafka configuration:
```javascript
kafka: {
  hostnames: 'test.cern.ch',
  port: 9092,
  topic: 'webui'
}
```

## Continuous Integration Workflows
Control project makes use of two workflows.
### [control.yml](./../.github/workflows/control.yml)
* Checks that tests of the project are running successfully on two virtual machines:
  * `ubuntu`
  * `macOS`
* Make sure that the proposed changes are not reducing the current code-coverage percent
* Sends a code coverage report to [CodeCov](https://codecov.io/gh/AliceO2Group/WebUi)

### [release.yml](../.github/workflows/release.yml)
* Releases a new version of the project to the [NPM Registry](npmjs.com/) under the tag [@aliceo2/control](https://www.npmjs.com/package/@aliceo2/control)
* Builds a `tgz` file which contains an archive of the project. This can than be used for local repositories installations
