# InfoLoggerGui (ILG)

Web app for querying infoLogger database and streaming logs in real-time with filtering. Compatible with all browsers, starting from IE 12 (Edge).

![Screenshot of ILG](docs/screenshot.png)

## Requirements
- Node LTS
- InfoLogger MySQL instance (optional if "Query" feature not used)
- InfoLoggerServer instance (optional if "Live" feature not used)

## Features
1. Query infologger database
1. Live stream infologger events with filter

## How to install
1. git clone this repository
1. npm install
1. cp config-default.js config.js
1. edit config.js
1. start MySQL server and/or InfoLoggerServer
1. npm start
1. open your browser to the URL configured previously

InfoLoggerServer can be simulated by running `npm run simul`, `localhost:6102` will be used.

## How to use
1. add some filters if needed (match and exclude work per word separated by spaces)
1. Query or go live to see result

- click on rows to see all details on the inspector at the right of the page
- Show/hide columns by clicking on labels on top of page
- use arrows keys to move quickly to errors or move through logs

## Data structures

[Stream specifications](docs/stream-specs.txt)
[Database specifications](docs/database-specs.sql)
