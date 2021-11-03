# Control GUI
[![Actions Status](https://github.com/AliceO2Group/WebUi/workflows/Control/badge.svg)](https://github.com/AliceO2Group/WebUi/actions)
[![codecov](https://codecov.io/gh/AliceO2Group/WebUi/branch/dev/graph/badge.svg?flag=control)](https://codecov.io/gh/AliceO2Group/WebUi)


- [Control GUI](#control-gui)
  - [Description](#description)
  - [Requirements](#requirements)
  - [Installation](#installation)
  - [Configuration](#configuration)
    - [O2Control gRPC](#o2control-grpc)
    - [Apricot gRPC](#apricot-grpc)
    - [Grafana](#grafana)
    - [Consul](#consul)
    - [Kafka](#kafka)
    - [InfoLogger GUI](#infologger-gui)
    - [QualityControl GUI](#qualitycontrol-gui)
    - [Bookkeeping GUI](#bookkeeping-gui)
    - [Utils](#utils)
  - [Features](#features)
    - [GUI](#gui)
      - [Enable/Disable CRU Links](#enabledisable-cru-links)
      - [Clean Resources/Tasks](#clean-resourcestasks)
    - [Integration with ControlWorkflows](#integration-with-controlworkflows)
      - [List of fixed variables used by AliECS GUI for user logic](#list-of-fixed-variables-used-by-aliecs-gui-for-user-logic)
      - [Dynamically built Workflow Panels](#dynamically-built-workflow-panels)
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
### O2Control gRPC
* `hostname` - gRPC hostname
* `port` - gRPC port
* `timeout` -  ms, gRPC deadline for service calls; Default value 30000 ms
* `maxMessageLength` - MB, gRPC message size limit; Default value 50 MB
* `label` - name of the gRPC service,
* `package` - name of the gRPC package

### Apricot gRPC
* `hostname` - gRPC hostname
* `port` - gRPC port
* `timeout` -  ms, gRPC deadline for service calls; Default value 30000 ms
* `maxMessageLength` - MB, gRPC message size limit; Default value 50 MB
* `label` - name of the gRPC service
* `package` - name of the gRPC package

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
* `kVPrefix` - Name of the Consul cluster used by AliceO2

### Kafka
Use of a Kafka instance is optional. It is being used for prompting and receiving notifications, see more in [Kafka connector - Notification](../Framework/docs/guide/kafka.md) framework guide.

### InfoLogger GUI
Use of InfoLogger GUI instance is optional. Configuration details about it are being used only for building URLs to help the user navigate the logs of its actions.

* `hostname` - InfoLogger GUI hostname
* `port` - InfoLogger GUI port

### QualityControl GUI
Use of QualityControl GUI instance is optional. Configuration details about it are being used only for building URLs to help the user navigate the objects created within an environment.

* `hostname` - QualityControl GUI hostname
* `port` - QualityControl GUI port

### Bookkeeping GUI
Use of Bookkeeping GUI instance is optional. Configuration details about it are being used only for building URLs to help the user navigate to the run details of their environments.

* `hostname` - Bookkeeping GUI hostname
* `port` - Bookkeeping GUI port

### Utils
Use of utils field is optional. Here, a user can specify configuration fields for various uses of AliECS GUI:
* `refreshTask` - specifies how often (ms) the page `taskList` should refresh its content if the user has it opened; Default value is `10000`
* `refreshEnvs` - specifies how often (ms) the page `environments` should refresh its content if the user has it opened; Default value is `10000`
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
1. Navigate to the `Configuration` page by clicking on the `Links` sub-menu from the left side-bar. Here, CRUs will be grouped by detectors and host
2. Select the hosts that should be updated by using either the check-box in front of the host name or the checkbox in front of the detector
3. Update the User Logic or Links[0-12] state of the selected hosts accordingly
4. Lock the interface via the top-left lock button
5. By pressing the top-right grey `Save` button, the updates will be saved directly in Consul for the selected hosts
6. By pressing the top-right blue `Save & Configure` button:
   * the updates will be saved directly in Consul for the selected hosts;
   * the CRUs of the selected hosts will be updated with the configuration previously saved in Consul.

It is important to understand that the `Save & Configure` action will also apply any other `CRU` changes that are present in `Consul` and NOT only the state of the links which are updatable via the Interface. 

#### Clean Resources/Tasks
1. Navigate to the `Tasks` page by clicking on the `Task list` sub-menu from the left side-bar
   
Here, tasks will be grouped by host and each host has an in-line button to provide a download button for the logs of that machine

2. Lock the interface via the top-left lock button
3. Use the top-right orange text `Clean Resources` button to request AliECS Core to run the `o2-roc-cleanup` workflow
4. Use the top-right red text `Clean Tasks` button to request AliECS Core to remove all tasks that do not belong to an environment

### Integration with ControlWorkflows

#### List of fixed variables used by AliECS GUI for user logic
There is a set of variables which are fixed and used by the AliECS GUI. If there is a need for changing the name of these variables in the [ControlWorkflows](https://github.com/AliceO2Group/ControlWorkflows)  repository, then the AliECS GUI developers should be notified to update accordingly.
```json
dcs_enabled
trg_enabled
epn_enabled
odc_topology
odc_enabled
qcdd_enabled
dd_enabled
ddsched_enabled
minimal_dpl_enabled
readout_cfg_uri
qc_config_uri
```
#### Dynamically built Workflow Panels
From version `1.28.0` onwards, the AliECS GUI allows the user to define custom workflow templates. These are defined in `YAML` in the [ControlWorkflows](https://github.com/AliceO2Group/ControlWorkflows) repository.

Each variable belonging to a template will follow the definition present in the [protofile](https://github.com/AliceO2Group/WebUi/blob/dev/Control/protobuf/o2control.proto#L380) and will be dynamically built and displayed by the AliECS GUI based on the conditions provided. 
e.g
```json
  "roc_ctp_emulator_enabled": {
    "allowedValues": [],
    "defaultValue": "11",
    "type": 1,
    "label": "ROC CTP emulator",
    "description": "", // EDIT_BOX of type number with no priority on index'
    "panel": "mainPanel"
  },
  "dcs_sor_parameters": {
    "allowedValues": [],
    "defaultValue": "Some Default Value",
    "type": 0,
    "label": "DCS SOR parameters",
    "description": "", // EDIT_BOX with condition to be displayed only if component roc_ctp_emulator_enabled has a value higher or equal to 20 
    "panel": "dcsPanel",
    "visibleIf": "$$roc_ctp_emulator_enabled >= \"20\""
  },
```
In the example above, the first variable is defined as an edit box of type `1 (number)` while the second variable is defined as an edit box of type `0 (string)` which will only be displayed if the value from the first field is greater than `"20"`.

More examples can be seen in the test [file](./../test/../Control/test/utils/custom-template-variables.js)

The `visibleIf` fields accepts the following 3 conditions that can be combined using logical operators:
* `===`, `!==`, `>`, `<`, `>=`, `<=` (string comparison)
* `includes(value)`
* `key.match(value)` (TODO)

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
