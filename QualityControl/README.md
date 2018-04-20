# Quality Control GUI (QCG)
[![Build Status](https://travis-ci.org/AliceO2Group/WebUi.svg?branch=dev)](https://travis-ci.org/AliceO2Group/WebUi)
[![Dependencies Status](https://david-dm.org/AliceO2Group/WebUi/status.svg?path=QualityControl)](https://david-dm.org/AliceO2Group/WebUi?path=QualityControl)
[![devDependencies Status](https://david-dm.org/AliceO2Group/WebUi/dev-status.svg?path=QualityControl)](https://david-dm.org/AliceO2Group/WebUi?path=QualityControl&type=dev)
[![JIRA](https://img.shields.io/badge/JIRA-issues-blue.svg)](https://alice.its.cern.ch/jira/projects/OGUI)

QCG is a web graphical user interface for [O<sup>2</sup> Quality Control](https://github.com/AliceO2Group/QualityControl).

## Requirements
- A [TObject2Json](https://github.com/AliceO2Group/QualityControl/blob/master/Framework/src/TObject2JsonServer.cxx) server connected a backend
- nodejs `7.x` or higher
- [Supported browser](https://github.com/AliceO2Group/WebUi/tree/dev/Framework#minimum-browser-version-support).

## Installation
```
NODE_ENV=production npm install @aliceo2/qc@1.0.0 --loglevel warn --no-save --only=production --no-package-lock
```

## Configuration

### Configuration file
- Open `config.js`
- Fill up missing sections
  - OAuth
  - HTTP
  - TObject2Json

### MySQL database

The MySQL database must contain a table for each agent like `agent_*` and a row per object. A sample of agents is available in [quality_control.sql](./docs/quality_control.sql) file.

Another table called `layout` will contain user's layouts in the same database.

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

On the server side, first disable demo data in the configuration file `config.js`.

```js
app: {
  demoData: false
},
```

Then configure your MySQL access:

```js
mysql: {
  host: '###',
  user: '###',
  password: '###',
  database: 'quality_control'
}
```

To parse TObject data contained inside objects, you need to run a TObject2Json instance connected to this same database and add it into the configuration file.

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
