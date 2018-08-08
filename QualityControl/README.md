# Quality Control GUI (QCG)
[![Build Status](https://travis-ci.org/AliceO2Group/WebUi.svg?branch=dev)](https://travis-ci.org/AliceO2Group/WebUi)
[![Dependencies Status](https://david-dm.org/AliceO2Group/WebUi/status.svg?path=QualityControl)](https://david-dm.org/AliceO2Group/WebUi?path=QualityControl)
[![devDependencies Status](https://david-dm.org/AliceO2Group/WebUi/dev-status.svg?path=QualityControl)](https://david-dm.org/AliceO2Group/WebUi?path=QualityControl&type=dev)
[![JIRA](https://img.shields.io/badge/JIRA-issues-blue.svg)](https://alice.its.cern.ch/jira/projects/OGUI)

QCG is a web graphical user interface for [O<sup>2</sup> Quality Control](https://github.com/AliceO2Group/QualityControl).


## Installation
1. Install QualityControl using `aliBuild` and configure database with [following instructions](https://github.com/AliceO2Group/QualityControl/blob/master/README.md).
2. Install QCG
```
aliBuild build qcg --default o2-dataflow
```

## Run QCG locally
1. Load QCG modules
```
alienv enter qcg/latest-o2-dataflow
```
2. Run `TObject2Json` (it converts Objects into JSRoot readable format)
```
tobject2json --backend mysql://qc_user:qc_user@localhost/quality_control --zeromq-server tcp://127.0.0.1:7777
```

3. (Run `Information Service` if you need Online mode. For more details use [QualityControl instructions](https://github.com/AliceO2Group/QualityControl#information-service)).

4. Run QCG server
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

of Information Service publish and reponse socket.

#### TObject2Json
In order to customise hostname and port of `TObject2Json` follow these two steps:

1. Edit `tobject2json` section of configuration file to define custom:
 - `host`name
 - `port` number

2. Run `TObject2Json` with updated parameters
```
tobject2json --backend mysql://<loign>:<password>@<hostname>:<port>/<database> --zeromq-server tcp://<host>:<port>
```
WHERE:
 - `backend` is a Quality Control database URL
 - `zeromq-server` which provides communication between `TObject2Json` and the GUI; it must match with `host` and `port` that you set up in `1.`.

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
