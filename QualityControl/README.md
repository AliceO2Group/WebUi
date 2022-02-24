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
  - [Display a non-standard ROOT object in QCG](#display-a-non-standard-root-object-in-qcg)
  - [Online Mode](#online-mode)

## Installation
1. Install `nodeJS` >= `14.16.0`
  * CC7: `yum install https://rpm.nodesource.com/pub_14.x/el/7/x86_64/nodejs-14.16.1-1nodesource.x86_64.rpm`
  * Mac: `brew install node@14 ;  echo 'export PATH="/usr/local/opt/node@14/bin:$PATH"' >> $HOME/.bash_profile`
  * Other: https://nodejs.org/en/download/package-manager
3. Clone the `WebUi` repository 
```
git clone https://github.com/AliceO2Group/WebUi.git
```
5. Install QCG
```
cd WebUi/QualityControl
npm install
```
4. Copy configuration file and update according to your needs (see next section):
```
cp config-default.js config.js
```

### Troubleshooting

Q: When doing `npm install` I have an error `error: no template named 'remove_cv_t' in namespace 'std'; did you mean 'remove_cv'?` or such. 

A: Make sure you are using nodeJS 14 and not nodeJS 16. 

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

3. Open a browser and navigate to [http://localhost:8080](http://lo calhost:8080). 

    Ensure that your [browser is supported](https://github.com/AliceO2Group/WebUi/tree/dev/Framework#minimum-browser-version-support).

## Enable HTTPS
- Follow these [steps](https://ca.cern.ch/ca/host/HostSelection.aspx?template=ee2host&instructions=openssl) to request a new CERN Grid Host Certificate
- Set up file paths to the generated key and certificate in the `http` section of `config.js` file.
- Provide your hostname in the `hostname` filed of `http` section of `config.js` file.

## Display a non-standard ROOT object in QCG

`QCG` is able to display non-standard ROOT objects with the help of QC. More information can be found [here](https://github.com/AliceO2Group/QualityControl/blob/master/doc/Advanced.md#display-a-non-standard-root-object-in-qcg) 
## Online Mode
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