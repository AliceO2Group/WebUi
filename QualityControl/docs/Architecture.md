# Project Architecture
This document explains the architecture of the project, detailing the main components and their interactions.

## Overview
The project is a web-based graphical user interface (GUI) for O<sup>2</sup> Quality Control. It consists of a frontend built with Mithril.js and a backend built with Node.js and Express.js. The backend interacts with the Calibration and Conditions Database (CCDB) to retrieve and manage quality control data.

## Components
### 1. Frontend
The frontend follows a structured approach with models and services to manage the application's state and interactions. `Models` represent the application state and actions. `Services` contain the business logic and interact with the backend to fetch and manage data. They make API calls and process the responses.

- Framework: [Mithrill.js](https://mithril.js.org/)
- Entry point: [public/index.js](../public/index.js)

### 2. Backend
The backend follows a Controller-Service architecture pattern. Controllers handle HTTP requests and responses, acting as an intermediary between the web server and the business layer. Services contain business logic and interacts with the data sources.

- Framework: [Node.js](https://nodejs.org) with [Express.js](https://expressjs.com)
- API: [api.js](../lib/api.js)
- Entry Point: [index.js](../index.js)
- Configuration: [config](../config.js)

### 3. Testing
- Setup [setup](../test/setup/)
- Frontend tests [public](../test/public/)
- Backend tests: [lib](../test/lib/)
- Utilities tests: [common](../test/common/)