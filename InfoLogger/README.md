# InfoLogger GUI (ILG)

[![Actions Status](https://github.com/AliceO2Group/WebUi/workflows/InfoLogger/badge.svg)](https://github.com/AliceO2Group/WebUi/actions)
[![codecov](https://codecov.io/gh/AliceO2Group/WebUi/branch/dev/graph/badge.svg?flag=infologger)](https://codecov.io/gh/AliceO2Group/WebUi)

- [InfoLogger GUI (ILG)](#infologger-gui-ilg)
  - [Requirements](#requirements)
  - [Installation](#installation)
  - [Dummy InfoLogger test server](#dummy-infologger-test-server)
  - [Interface user guide](#interface-user-guide)
  - [InfoLogger insights](#infologger-insights)
  - [Continuous Integration Workflows](#continuous-integration-workflows)
    - [infologger.yml](#infologgeryml)
    - [release.yml](#releaseyml)

Web user interface of [InfoLogger](https://github.com/AliceO2Group/InfoLogger) logging system. 

It interfaces with the system using two modes:

- **Query**: Querying historical logs from a database
- **Live**: Receiving Real-Time logs from a TCP endpoint over InfoLogger protocol (v1.3, v1.4)

![Screenshot of ILG](docs/screenshot.png)

## Requirements
- `nodejs` >= `14.16.0`
- InfoLogger MySQL database for Query mode
- InfoLoggerServer endpoint for Live mode

## Installation
1. `git clone https://github.com/AliceO2Group/WebUi.git; cd WebUi/InfoLogger`
2. `npm install --prod`
3. `cp config-default.js config.js`
4. Modify `config.js` file to set InfoLogger database and endpoint details
5. Start web app: `npm start`
6. Open browser and navigate to http://localhost:8080

## Dummy InfoLogger test server
InfoLoggerServer can be simulated by running `npm run simul`. The dummy server binds `localhost:6102` endpoint.

## Interface user guide
- Use top panel to set match and exclude filters
- Click "Query" or "Live" button to start the selected mode
- Click on log records to see more details in the inspector (Inspector can be toggled with the bottom right checkbox buttons)
- Show/hide columns by clicking on labels on top of page
- Use arrows keys to navigate quickly between logs

## InfoLogger insights
- [Message protocol](docs/il-protocol.md)
- [Database structure](docs/database-specs.sql)

## Continuous Integration Workflows
InfoLogger project makes use of two workflows.
### [infologger.yml](./../.github/workflows/infologger.yml)
* Checks that tests of the project are running successfully on two virtual machines:
  * `ubuntu`
  * `macOS`
* Make sure that the proposed changes are not reducing the current code-coverage percent
* Sends a code coverage report to [CodeCov](https://codecov.io/gh/AliceO2Group/WebUi)

### [release.yml](../.github/workflows/release.yml)
* Releases a new version of the project to the [NPM Registry](npmjs.com/) under the tag [@aliceo2/infologger](https://www.npmjs.com/package/@aliceo2/infologger)
* Builds a `tgz` file which contains an archive of the project. This can be used for local repositories installations.

