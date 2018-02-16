# Overview

This framework is a client/server user-interface using Javascript on both sides to build rich web applications. It is made for O2 project at CERN/ALICE.

There are two main part:
- the server which contains the core business and can access the data you want to provide to users
- the client which is a simple browser that will connect to the server to start the web application, this app will then ask server for updates

Every generic or common part of your needs are included in this framework so you only need to write few lines of code.

### What is provided by the framework

- a JS server with OAuth authentification
- common tools to define REST and WebSocket API
- a JS client engine to make a powerful interface
- a CSS framework to build great looking interface

### What you need to provide

- define a REST API according to your specifications
- connect this API to your data-sources
- write client models to use it
- create a great user experience
- package and ship your application on server

Follow the next link to [start a new project](start-project.md).
