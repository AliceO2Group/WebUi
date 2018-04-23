# Quality Control GUI (QCG)
[![Build Status](https://travis-ci.org/AliceO2Group/WebUi.svg?branch=dev)](https://travis-ci.org/AliceO2Group/WebUi)
[![Dependencies Status](https://david-dm.org/AliceO2Group/WebUi/status.svg?path=QualityControl)](https://david-dm.org/AliceO2Group/WebUi?path=QualityControl)
[![devDependencies Status](https://david-dm.org/AliceO2Group/WebUi/dev-status.svg?path=QualityControl)](https://david-dm.org/AliceO2Group/WebUi?path=QualityControl&type=dev)
[![JIRA](https://img.shields.io/badge/JIRA-issues-blue.svg)](https://alice.its.cern.ch/jira/projects/OGUI)

QCG is a web graphical user interface for [O<sup>2</sup> Quality Control](https://github.com/AliceO2Group/QualityControl).

## Requirements
- [System requirements](https://github.com/AliceO2Group/WebUi/tree/master/Framework#system-requirements)
- Compiled and configuration [QualityControl](https://github.com/AliceO2Group/QualityControl) framework (including MySQL database)
- [Supported browsers](https://github.com/AliceO2Group/WebUi/tree/dev/Framework#minimum-browser-version-support)

## Installation
```
NODE_ENV=production npm install @aliceo2/qc@1.0.4 --loglevel error --no-save --no-package-lock
```

## Minimal configuration

### HTTP
In the HTTP section of the `config.js` file set up `port` number and `hostname` of your server (`localhost` is allowed).

### MySQL database
Information regarding agents and objects are stored in the Quality Control database (a table per agent and a row per object). QCG requires additional `layout` table that contains user layout settings.

1. Add `layout` table to the existing Quality Control database:
```sql
CREATE TABLE `layout` (
  `id` varchar(24) NOT NULL DEFAULT '',
  `name` varchar(30) NOT NULL DEFAULT '',
  `owner_id` int(11) NOT NULL,
  `owner_name` varchar(200) NOT NULL DEFAULT '',
  `tabs` text NOT NULL COMMENT 'JSON payload',
  PRIMARY KEY (`id`),
  UNIQUE KEY `index_name` (`name`),
  KEY `index_owner_name` (`owner_name`),
  KEY `index_owner_id` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

2. Configure MySQL connection in `config.js` file
```js
mysql: {
  host: '<HOSTNAME>',
  user: '<USERNAME>',
  password: '<PASSWORD>',
  database: '<DATABASE_NAME>'
}
```

### TOjbect2Json
`TOjbect2Json` is part of [QualityControl](https://github.com/AliceO2Group/QualityControl/blob/master/Framework/src/TObject2JsonServer.cxx) package and is required to convert Objects into format compatible with  JSRoot.

1. Run `TOjbect2Json`:
```
tobject2json --backend mysql://<loign>:<password>@<hostname>:<port>/<database> --zeromq-server tcp://<host>:<port>
```
WHERE:
 - `backend` is a Quality Control database URL (the same as in the above section)
 - `zeromq-server` which provides communication between `TOjbect2Json` and tht GUI

2. In the QCG `config.js` set up `zeromq-server` hostname and port number:
```js
tobject2json: {
  host: '<HOSTNAME>',
  port: 7777
},
```

## Run
```
./start
```

## Advanced configuration (production)
### Configuration OAuth
- Register your application in the [CERN OAuth service](https://sso-management.web.cern.ch/OAuth/RegisterOAuthClient.aspx)
- Provide any `client_id`, eg `qc_gui`
- Set `redirect_uri` to `https://<YOUR_HOSTNAME>/callback`
- Fill these values and generated secret into `oAuth` section of `config.js` file.

### Configuration HTTPS
- Follow these [steps](https://ca.cern.ch/ca/host/HostSelection.aspx?template=ee2host&instructions=openssl) to request a new CERN Grid Host Certificate
- Set up file paths to the generated key and certificate in the `http` section of `config.js` file.
- Provide your hostname in the `hostname` filed of `http` section of `config.js` file.
