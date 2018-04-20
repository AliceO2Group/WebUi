# Quality Control GUI (QCG)
[![Build Status](https://travis-ci.org/AliceO2Group/WebUi.svg?branch=dev)](https://travis-ci.org/AliceO2Group/WebUi)
[![Dependencies Status](https://david-dm.org/AliceO2Group/WebUi/status.svg?path=QualityControl)](https://david-dm.org/AliceO2Group/WebUi?path=QualityControl)
[![devDependencies Status](https://david-dm.org/AliceO2Group/WebUi/dev-status.svg?path=QualityControl)](https://david-dm.org/AliceO2Group/WebUi?path=QualityControl&type=dev)
[![JIRA](https://img.shields.io/badge/JIRA-issues-blue.svg)](https://alice.its.cern.ch/jira/projects/OGUI)

QCG is a web graphical user interface for [O<sup>2</sup> Quality Control](https://github.com/AliceO2Group/QualityControl).

## Requirements
- Running TObject2Json server connected a backend
- nodejs `7.x` or higher
- [Supported browser](https://github.com/AliceO2Group/WebUi/tree/dev/Framework#minimum-browser-version-support)

## Installation
```
NODE_ENV=production npm install @aliceo2/qc@1.0.0 --loglevel warn --no-save --only=production --no-package-lock
```

## Configuration

### Configuration OAuth


### Configuration HTTPS


### MySQL database

A table is required for each agent (`agent_*`) and a row per object. A sample SQL schema is available: [quality_control.sql](./docs/quality_control.sql).

The `layout` table contains user layout
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

In the `config.js` configuration file disable demo data flag:
```js
app: {
  demoData: false
},
```

Then configure your MySQL connection
```js
mysql: {
  host: '###',
  user: '###',
  password: '###',
  database: 'quality_control'
}
```

### Configuration TOjbect2Json
Run `tobject2json` binary which is part of [QualityControl](https://github.com/AliceO2Group/QualityControl/blob/master/Framework/src/TObject2JsonServer.cxx) package
```
tobject2json --backend mysql://<loign>:<password>@<hostname>:<port>/<database> --zeromq-server tcp://<host>:<port>
```

In the `config.js` set up hostname and port number
```js
tobject2json: {
  host: '###',
  port: 7777
},
```

## Run
```
./start
```
