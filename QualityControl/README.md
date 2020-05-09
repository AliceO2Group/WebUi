# Quality Control GUI (QCG)

[![Actions Status](https://github.com/AliceO2Group/WebUi/workflows/QualityControl/badge.svg)](https://github.com/AliceO2Group/WebUi/actions)
[![codecov](https://codecov.io/gh/AliceO2Group/WebUi/branch/dev/graph/badge.svg?flag=qualitycontrol)](https://codecov.io/gh/AliceO2Group/WebUi)
[![JIRA](https://img.shields.io/badge/JIRA-issues-blue.svg)](https://alice.its.cern.ch/jira/projects/OGUI)

QCG is a web graphical user interface for [O<sup>2</sup> Quality Control](https://github.com/AliceO2Group/QualityControl).

  - [Installation](#installation)
  - [Local configuration](#local-configuration)
      - [HTTP](#http)
      - [CCDB](#ccdb)
      - [Listing Connector](#listing-connector)
  - [Run QCG locally](#run-qcg-locally)
  - [Public API](#public-api)
  - [Enable HTTPS](#enable-https)
  - [Online Mode](#online-mode)

## Installation
1. `nodeJS` >= `12.13.0` is required
2. Install QualityControl using `aliBuild` and configure database with [following instructions](https://github.com/AliceO2Group/QualityControl/blob/master/README.md).
3. Install QCG
```
aliBuild build qcg --default o2-dataflow
```

## Local Configuration
In order to customise the QCG you can edit the following configuration file: `$QCG_ROOT/node_modules/@aliceo2/qc/config.js`

#### HTTP
Attribute to define the `http` endpoint of the application.

Edit the `http` section to define a custom:
- `hostname`
- `port`
- `prefix` - a prefix as string which will be used when querying objects from CCDB

#### CCDB
Attribute to define the `Computer Centre DataBase (CCDB)` endpoint.

Edit the `ccdb` section to define a custom:
- `hostname`
- `port` 

#### Listing Connector
Specify the connector that should be used for retrieving QC objects. Default value for `listingConnector` is `ccdb`.

## Run QCG locally
1. Load QCG modules
```
alienv enter qcg/latest-o2-dataflow
```

2. (Optional) Online Mode - If you need Online Mode read [this](#online-mode) section

3. Run QCG server
```
qcg
```

5. Open a browser and navigate to [http://localhost:8080](http://localhost:8080). Ensure that your [browser is supported](https://github.com/AliceO2Group/WebUi/tree/dev/Framework#minimum-browser-version-support).


## Public API
QCG exposes two public REST API which can be read by any other application.

- Get all objects metadata\
  Request: `curl 'http://localhost:8080/api/listObjects' -X GET`\
  Result: `[{"name": "AGENT/OBJECT"}]`
- Get ROOT object data in JSON format to be used with JSROOT\
  Request: `curl 'http://localhost:8080/api/readObjectData?objectName=AGENT/OBJECT' -X GET`\
  Result: `{"_typename":"TCanvas", ...}`

## Enable HTTPS
- Follow these [steps](https://ca.cern.ch/ca/host/HostSelection.aspx?template=ee2host&instructions=openssl) to request a new CERN Grid Host Certificate
- Set up file paths to the generated key and certificate in the `http` section of `config.js` file.
- Provide your hostname in the `hostname` filed of `http` section of `config.js` file.

## Online Mode
QCG is offering an optional `Online Mode` which allows the user to view only QC Objects that are being generated live. This will **only** see objects if an instance of [QualityControl](https://github.com/AliceO2Group/QualityControl/) is running and making use of the [ServiceDiscovery](https://github.com/AliceO2Group/QualityControl/blob/master/Framework/include/QualityControl/ServiceDiscovery.h) class.

For this, QCG is using Service Discovery capabilities of [Consul](https://www.consul.io/).
Once `Consul` is [installed](https://learn.hashicorp.com/consul/getting-started/install) and running, update the `config.js` file of `QCG` with information regarding on what host and port Consul agent is now running:
```javascript
consul: {
  hostname: 'localhost',
  port: 8500
}
```

As this functionality is optional, there will be no impact on QCG if a configuration for `Consul` is not provided. A simple warning message as below will be shown to the user that the configuration is missing
```
2020-02-28T10:19:26.110Z warn: [QualityControlModel] Consul Service: No Configuration Found
```

## Continuous Integration Workflows
QualityControl project makes use of two workflows.
### [qc.yml](./../.github/workflows/qc.yml)
* Checks that tests of the project are running successfully on two virtual machines:
  * `ubuntu`
  * `macOS`
* Make sure that the proposed changes are not reducing the current code-coverage percent
* Sends a code coverage report to [CodeCov](https://codecov.io/gh/AliceO2Group/WebUi)

### [release.yml](../.github/workflows/release.yml)
* Releases a new version of the project to the [NPM Registry](npmjs.com/) under the tag [@aliceo2/qc](https://www.npmjs.com/package/@aliceo2/qc)
* Raises a new Pull-Request in [alisw/alidist](https://github.com/alisw/alidist) with changes to the recipe `qcg.sh` with the new version and new tag