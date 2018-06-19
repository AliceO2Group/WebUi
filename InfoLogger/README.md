# InfoLoggerGui (ILG)

Web app for querying infoLogger database and streaming logs in real-time with filtering. Compatible with all browsers, starting from IE 12 (Edge).

## Features
1. Query infologger database
1. Live stream infologger events with filter

## Current setup and use
1. git clone this repository
1. npm install
1. cp config-default.js config.js
1. edit config.js
1. start Control server
1. npm start
1. open your browser to the URL configured previously

## Development
1. fork branch dev with Jira ticket in the name of the new branch
1. npm run dev (server is reloaded when files change)
1. edit files
1. check result inside a browser
1. npm test
1. git commit
1. merge pull-request into dev
