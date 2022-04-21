QCG is a web graphical user interface for [O<sup>2</sup> Quality Control](https://github.com/AliceO2Group/QualityControl).

[![Actions Status](https://github.com/AliceO2Group/WebUi/workflows/QualityControl/badge.svg)](https://github.com/AliceO2Group/WebUi/actions)
[![codecov](https://codecov.io/gh/AliceO2Group/WebUi/branch/dev/graph/badge.svg?flag=qualitycontrol)](https://codecov.io/gh/AliceO2Group/WebUi)
[![JIRA](https://img.shields.io/badge/JIRA-issues-blue.svg)](https://alice.its.cern.ch/jira/projects/OGUI)

- [Installation](#installation)
- [Local Configuration](#local-configuration)
    - [HTTP](#http)
    - [CCDB](#ccdb)
    - [Listing Connector](#listing-connector)
- [Run QCG locally](#run-qcg-locally)
- [Enable HTTPS](#enable-https)
- [Features](#features)
  - [Canvas Options via MetaData](#canvas-options-via-metadata)
  - [Display a QC non-standard ROOT object in QCG](#display-a-qc-non-standard-root-object-in-qcg)
  - [Online Mode](#online-mode)
  - [Export a layout as JSON](#export-a-layout-as-json)
  - [Import a layout from JSON](#import-a-layout-from-json)
  - [AutoTransitioning Tabs within Layouts](#autotransitioning-tabs-within-layouts)
- [Continuous Integration Workflows](#continuous-integration-workflows)
  - [qc.yml](#qcyml)
  - [release.yml](#releaseyml)

## Installation
1. Install `nodeJS` >= `16.x`
  * CC7: `yum install https://rpm.nodesource.com/pub_16.x/el/8/x86_64/nodejs-16.9.1-1nodesource.x86_64.rpm`
  * Mac: `brew install node@16 ;  echo 'export PATH="/usr/local/opt/node@16/bin:$PATH"' >> $HOME/.bash_profile`
  * Other: https://nodejs.org/en/download/package-manager
3. Clone the `WebUi` repository 
```
git clone https://github.com/AliceO2Group/WebUi.git
```
5. Install QCG
```
cd WebUi/QualityControl
npm ci
```
4. Copy configuration file and update according to your needs (see next section):
```
cp config-default.js config.js
```

## Local Configuration
In order to customise the QCG you can edit the following configuration file: `WebUi/QualityControl/config.js`

#### HTTP
Attribute to define the `http` endpoint of the application.

Edit the `http` section to define a custom:
- `hostname`
- `port`
- `prefix` - a prefix as string which will be used when querying objects from CCDB to request only objects containing the aforementioned string

#### CCDB
Attribute to define the `Computer Centre DataBase (CCDB)` endpoint.

Edit the `ccdb` section to define a custom:
- `protocol` - default 'http';
- `hostname`
- `port`
- `prefix` - (optional) prefix to use for filtering on pathName

#### Listing Connector
Specify the connector that should be used for retrieving QC objects. Default value for `listingConnector` is `ccdb`.

## Run QCG locally 

1. (Optional) Online Mode - If you need Online Mode read [this](#online-mode) section

2. Run QCG server
```
npm start
```

3. Open a browser and navigate to [http://localhost:8080](http://localhost:8080). 

    Ensure that your [browser is supported](https://github.com/AliceO2Group/WebUi/tree/dev/Framework#minimum-browser-version-support).

## Enable HTTPS
- Follow these [steps](https://ca.cern.ch/ca/host/HostSelection.aspx?template=ee2host&instructions=openssl) to request a new CERN Grid Host Certificate
- Set up file paths to the generated key and certificate in the `http` section of `config.js` file.
- Provide your hostname in the `hostname` filed of `http` section of `config.js` file.

## Features

### Canvas Options via MetaData
`QCG` is using CCDB as storage service. When storing an object, the user can also store information on how an object should be plotted via the `metadata` field in CCDB. QualityControl documentation on how this can be achieved can be found [here](https://github.com/AliceO2Group/QualityControl/blob/master/doc/Advanced.md#canvas-options)
* `drawoption`: semi-colon separated drawing options; e.g. `lcolz;colz`
* `displayHints`: semi-colon separated hints; e.g. `AP;APB`

### Display a QC non-standard ROOT object in QCG

`QCG` is able to display non-standard ROOT objects with the help of QC. More information can be found [here](https://github.com/AliceO2Group/QualityControl/blob/master/doc/Advanced.md#display-a-non-standard-root-object-in-qcg) 
### Online Mode
QCG is offering an optional `Online Mode` which allows the user to view only QC Objects that are being generated live. This will **only** see objects if an instance of [QualityControl](https://github.com/AliceO2Group/QualityControl/) is running and making use of the [ServiceDiscovery](https://github.com/AliceO2Group/QualityControl/blob/master/Framework/include/QualityControl/ServiceDiscovery.h) class. 

For this, QCG is using Service Discovery capabilities of [Consul](https://www.consul.io/).
Once `Consul` is [installed](https://learn.hashicorp.com/consul/getting-started/install) and running, update the `config.js` file of `QCG` with information regarding on what host and port Consul agent is now running.

Moreover, a refresh rate interval can be set to limit the user number of requests. If no `refreshRate` is provided, defaults as shown below will be used:
e.g.
```javascript
consul: {
  hostname: 'localhost',
  port: 8500,
  refreshRate: {
      min: 10,
      max: 120
    }
}
```
Online mode will use an optional prefix for its queries specified in [ccdb.prefix](#ccdb). This is to ensure the same results are provided in both Offline & Online mode.

As this functionality is optional, there will be no impact on QCG if a configuration for `Consul` is not provided. A simple warning message as below will be shown to the user that the configuration is missing
```
2020-02-28T10:19:26.110Z warn: [QualityControlModel] Consul Service: No Configuration Found
```

### Export a layout as JSON
In order to facilitate the transition from one environment (e.g. TST) to another (e.g. PROD) while at the same time updating it, an export feature is provided.
1. Open the layout that you wish to export
2. Click on the top right second (from left to right) button which on hover shall display: `Export layout skeleton as JSON file`
3. Following that, QCG will automatically generate a JSON file and store it in your default download location.

### Import a layout from JSON
Once a layout is exported and modified as needed or created from scratch, one can import it into QCG as such:
1. On the left sidebar, click on the small button (icon represented as cloud with arrow up) which is in line with `MY LAYOUTS` label.
2. A pop-up will open which will allow you to paste your JSON structure.
3. The pop-up will validate that the pasted value is a valid JSON.
4. Click on `Import` button.
   1. If successful, a new page will be opened with your imported layout in edit mode
   2. If there is an issue, a red line with an error message will be displayed above the Import button
5. Click `Save` Layout from the top right corner button.

### AutoTransitioning Tabs within Layouts
To easily follow the progress of a RUN, layouts can automatically transition through the displayed tabs every few seconds. To configure:
1. Open desired layout
2. Click on the `pencil icon` button to start editing the layout
3. On the left sidebar, configure the field `Tab Auto-Change(sec): 0 (OFF), 10-600 (ON)` with the desired numerical value
4. Save 
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
* Builds a `tgz` file which contains an archive of the project. This can than be used for local repositories installations