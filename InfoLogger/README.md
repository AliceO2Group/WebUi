# InfoLogger GUI (ILG)

[![Actions Status](https://github.com/AliceO2Group/WebUi/workflows/InfoLogger/badge.svg)](https://github.com/AliceO2Group/WebUi/actions)
[![codecov](https://codecov.io/gh/AliceO2Group/WebUi/branch/dev/graph/badge.svg?flag=infologger)](https://codecov.io/gh/AliceO2Group/WebUi)

Web user interface of [InfoLogger](https://github.com/AliceO2Group/InfoLogger) logging system. It interfaces with the system using two modes:
- **Query**: Querying historical logs from a database
- **Live**: Receiving Real-Time logs from a TCP endpoint over InfoLogger protocol (v1.3, v1.4)

![Screenshot of ILG](docs/screenshot.png)

## Requirements
- `nodejs` >= 8.9.4
- InfoLogger MySQL database for Query mode
- InfoLoggerServer endpoint for Live mode

## Installation
1. `git clone https://github.com/AliceO2Group/WebUi.git; cd WebUi/InfoLogger`
1. `npm install --prod`
1. `cp config-default.js config.js`
1. Modify `config.js` file to set InfoLogger database and endpoint details
1. Start web app: `npm start`
1. Open browser and navigate to http://localhost:8080

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
