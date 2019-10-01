# Quality Control GUI (QCG)
[![Build Status](https://travis-ci.org/AliceO2Group/WebUi.svg?branch=dev)](https://travis-ci.org/AliceO2Group/WebUi)
[![JIRA](https://img.shields.io/badge/JIRA-issues-blue.svg)](https://alice.its.cern.ch/jira/projects/OGUI)

QCG is a web graphical user interface for [O<sup>2</sup> Quality Control](https://github.com/AliceO2Group/QualityControl).


## Installation
1. Make sure `python` 2.x is available (`node-gyp` does not support `python` 3 for the time-being)
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
These steps are necessary only when you don't run QCG on `localhost`.

In order to customise the QCG you can edit the following configuration file: `$QCG_ROOT/config.js`

#### HTTP
Edit `http` section to define custom:
- `port` number
- `hostname` of your server.

#### MySQL database
Edit `mysql` section to define custom:
- MySQL database `host`name
- `user`name
- `password`
- `database` name

#### Information Service
Edit `informationService` section to define custom:
- `host`name
- `port`

of Information Service publish and response socket.

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
