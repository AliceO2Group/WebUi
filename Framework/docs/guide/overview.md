# Overview

This framework provides some services and the building blocks to easily create rich web applications within CERN environment.

#### Server-side features
- REST and WebSocket API
- Authentication via CERN OAuth 2.0 and authorization via CERN e-groups
- Communication integrity ensured by JSON Web Tokens
- External resource access: MySQL, ZeroMQ

#### Client side-features
- User interface CSS building blocks in accordance with ALICE standards
- Asynchronous data fetching and bi-directional socket (Ajax and WebSocket)
- Client side MVC engine to build a user interface

### To create a full functional web application
- Connect server with external resources
- Connect client with server by defining custom REST paths or WebSocket messages
- Choose building blocks to create user interface
- Define model and control of client side application

Follow the link to [start a new project](../skeleton/README.md).
