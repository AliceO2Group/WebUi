# Control GUI

This is a prototype of Control GUI. It aims to replace current ECS HI and provide intuitive way of controlling the O<sup>2</sup> data taking.

A [Control](https://github.com/AliceO2Group/Control) server is required.

## Features
1. Padlock module - only single user is allowed to execute commands, others act as spectators
1. Listing environements, create, control, delete
1. Listing roles

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
