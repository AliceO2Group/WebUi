# Quality Control GUI (QCG)

[![Actions Status](https://github.com/AliceO2Group/WebUi/workflows/QualityControl/badge.svg)](https://github.com/AliceO2Group/WebUi/actions)
[![JIRA](https://img.shields.io/badge/JIRA-issues-blue.svg)](https://alice.its.cern.ch/jira/projects/OGUI)

QCG is a web graphical user interface for [O<sup>2</sup> Quality Control](https://github.com/AliceO2Group/QualityControl).

  - [Installation](#installation)
  - [Local configuration](#local-configuration)
      - [HTTP](#http)
      - [CCDB](#ccdb)
      - [Listing Connector](#listing-connector)
      - [Service Discovery](#service-discovery)
  - [Run QCG locally](#run-qcg-locally)
  - [Public API](#public-api)
  - [Enable HTTPS](#enable-https)
  - [QCG - Online Mode](#qcg---online-mode)

## Installation
1. NodeJS >12.13.0 is required
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

#### CCDB
Attribute to define the `Computer Centre DataBase (CCDB)` endpoint.

Edit the `ccdb` section to define a custom:
- `hostname`
- `port` 

#### Listing Connector
Specify the connector that should be used for retrieving QC objects. Default value for `listingConnector` is `ccdb`.

#### Service Discovery
For the QC - online mode, service discovery from Consul is used. 
Edit the `consul` section to define a custom:
- `hostname`
- `port`
  
More on how Consul is being used under section [QCG - Online Mode](#qcg---online-mode)

## Run QCG locally
1. Load QCG modules
```
alienv enter qcg/latest-o2-dataflow
```

2. (Run `Information Service` if you need Online Mode. For more details use [QualityControl instructions](https://github.com/AliceO2Group/QualityControl#information-service)).

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

## QCG - Online Mode
QCG is offering an optional `Online Mode` which allows the user to view only QC Objects that are being generated live. This will only see objects if an instance of [QualityControl](https://github.com/AliceO2Group/QualityControl/) is running and making use of the [ServiceDiscovery](https://github.com/AliceO2Group/QualityControl/blob/master/Framework/include/QualityControl/ServiceDiscovery.h) class

For this, as a separate technology, QCG is using [Consul](https://www.consul.io/) for the Service Discovery capabilities. In order to use it, a user will have to modify the `config.js` file, field [consul](#consul---service-discovery), to specify an up and running Consul instance. 

As this functionality is optional, there will be no impact on QCG if a configuration for `Consul` is not provided. A simple warning message as below will be shown to the user that the configuration is missing
```
2020-02-28T10:19:26.110Z warn: [QualityControlModel] Consul Service: No Configuration Found
```