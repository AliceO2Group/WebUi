# Quality Control GUI (QCG)

[![Actions Status](https://github.com/AliceO2Group/WebUi/workflows/QualityControl/badge.svg)](https://github.com/AliceO2Group/WebUi/actions)
[![JIRA](https://img.shields.io/badge/JIRA-issues-blue.svg)](https://alice.its.cern.ch/jira/projects/OGUI)

QCG is a web graphical user interface for [O<sup>2</sup> Quality Control](https://github.com/AliceO2Group/QualityControl).


## Installation
1. NodeJS >12.13.0 is required
2. Install QualityControl using `aliBuild` and configure database with [following instructions](https://github.com/AliceO2Group/QualityControl/blob/master/README.md).
3. Install QCG
```
aliBuild build qcg --default o2-dataflow
```

## Run QCG locally
1. Load QCG modules
```
alienv enter qcg/latest-o2-dataflow
```

2. (Run `Information Service` if you need Online mode. For more details use [QualityControl instructions](https://github.com/AliceO2Group/QualityControl#information-service)).

3. Run QCG server
```
qcg
```

5. Open a browser and navigate to [http://localhost:8080](http://localhost:8080). Ensure that your [browser is supported](https://github.com/AliceO2Group/WebUi/tree/dev/Framework#minimum-browser-version-support).


## Custom configuration
These steps are necessary only when you don't run the QCG or the CCDB on `localhost`.

In order to customise the QCG you can edit the following configuration file: `$QCG_ROOT/node_modules/@aliceo2/qc/config.js`

#### HTTP
Edit the `http` section to define a custom:
- `port` number and
- `hostname`.

#### Information Service
Edit the `informationService` section to define a custom:
- `host`name and
- `port`

of Information Service publish and response socket.

#### CCDB database
Edit the `ccdb` section to define a custom:
- `host`name and
- `port`. 

#### MySQL database
Edit the `mysql` section to define a custom:
- MySQL database `host`name,
- `user`name,
- `password` and
- `database` name.
Edit the `listingConnector` to switch it to `mysql`. 

#### CERN OAuth
- Register your application in the [CERN OAuth service](https://sso-management.web.cern.ch/OAuth/RegisterOAuthClient.aspx)
- Provide any `client_id`, eg `qc_gui`
- Set `redirect_uri` to `https://<YOUR_HOSTNAME>/callback`
- Fill these values and generated secret into `oAuth` section of `config.js` file.

Note: Enabling or disabling OAuth may impacts layout ownership model. When OAuth is disabled all users share the same `id` (`0`), otherwise `id` equals to CERN Person ID. The layout ownership `id` can be changed directly in the database -  `layout.owner_id`.

#### Enable HTTPS
- Follow these [steps](https://ca.cern.ch/ca/host/HostSelection.aspx?template=ee2host&instructions=openssl) to request a new CERN Grid Host Certificate
- Set up file paths to the generated key and certificate in the `http` section of `config.js` file.
- Provide your hostname in the `hostname` filed of `http` section of `config.js` file.

## Public API

QCG exposes two public REST API which can be read by any other application.

- Get all objects metadata\
  Request: `curl 'http://localhost:8080/api/listObjects' -X GET`\
  Result: `[{"name": "AGENT/OBJECT"}]`
- Get ROOT object data in JSON format to be used with JSROOT\
  Request: `curl 'http://localhost:8080/api/readObjectData?objectName=AGENT/OBJECT' -X GET`\
  Result: `{"_typename":"TCanvas", ...}`
