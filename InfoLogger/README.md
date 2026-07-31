# InfoLogger GUI (ILG)

[![Actions Status](https://github.com/AliceO2Group/WebUi/workflows/InfoLogger/badge.svg)](https://github.com/AliceO2Group/WebUi/actions)
[![codecov](https://codecov.io/gh/AliceO2Group/WebUi/branch/dev/graph/badge.svg?flag=infologger)](https://codecov.io/gh/AliceO2Group/WebUi)

## Contents

- [InfoLogger GUI (ILG)](#infologger-gui-ilg)
  - [Contents](#contents)
  - [Introduction](#introduction)
  - [Interface User Guide](#interface-user-guide)
  - [Requirements](#requirements)
  - [Project Layout](#project-layout)
  - [Scripts](#scripts)
  - [Backend](#backend)
  - [Frontend](#frontend)
  - [Local Development](#local-development)
    - [First-time setup](#first-time-setup)
    - [Query \& Live mode Against a remote backend (e.g. a staging instance)](#query--live-mode-against-a-remote-backend-eg-a-staging-instance)
    - [Live mode against synthetic logs (thoroughly test Live mode)](#live-mode-against-synthetic-logs-thoroughly-test-live-mode)
    - [Query against a local DB](#query-against-a-local-db)
  - [Testing](#testing)
    - [Integration tests (live elsewhere)](#integration-tests-live-elsewhere)
  - [CI](#ci)
    - [infologger.yml](#infologgeryml)
    - [release.yml](#releaseyml)
    - [system-configuration pipeline](#system-configuration-pipeline)
  - [Docker development](#docker-development)
    - [Development database installation](#development-database-installation)
  - [InfoLogger Insights](#infologger-insights)

## Introduction

The Web User Interface for [**ALICE O2 InfoLogger**](https://github.com/AliceO2Group/InfoLogger). The application operates in two distinct modes:

- **Query** - historical logs from a database.
- **Live** - real-time logs from a TCP endpoint over the InfoLogger protocol.

Screenshot of the current interface, running locally against a fake InfoLoggerServer emitting synthetic logs:

![Screenshot of ILG](docs/screenshot.png)

## Interface User Guide

- Use upper panel to:
  - match and/or exclude filters (Supports SQL Wildcard `%`, empty value toggling)
  - control the zoom level of the log table
  - limit the number of logs displayed
  - match severity and level
  - reset the filters
- Show/hide columns by clicking on labels on top of page
- Click "Query" or "Live" button to start the respective mode
- Double click on a log or toggle the inspector view from the bottom right corner to see all fields of the log
- Right-click a log to open a context menu with copy / use-as-filter / open inspector actions
- Use arrow keys to navigate quickly between logs
- Download the logs in a file via the top left download icon

## Requirements

- `nodejs` >= `22.x`
- InfoLogger MariaDB database for Query mode
- InfoLoggerServer endpoint for Live mode

## Project Layout

ILG is a Node.js API Gateway and Single-Page Application built on top of the `@aliceo2/web-ui` framework. It serves as a unified interface to two separate operational backends: a **MariaDB database** for historical queries and an **InfoLoggerServer TCP endpoint** for live log streaming.
## Scripts
| Script | Description |
| --- | --- |
| `npm start` | Run the app (`node index.js`). |
| `npm run lint` | Lint the project with ESLint. |
| `npm run lint:fix` | Lint and automatically fix fixable problems. |
| `npm test` | Run the linter, then the Mocha test suite. |
| `npm run coverage` | Run the test suite under `nyc` and generate the coverage report. |
| `npm run coverage:report` | Generate HTML + JSON coverage reports under `coverage/` from the last run. |

Docker commands (`docker:run`, `docker:test`, `docker:simul`, `docker:cleanup`) are documented under [Docker development](#docker-development).

## Backend

- **Entry point** - [index.js](index.js) starts the `HttpServer` from `@aliceo2/web-ui` and attaches a `WebSocket`. [lib/api.js](lib/api.js) instantiates the services, wires them to the DB and InfoLoggerServer, and registers HTTP routes. Config is loaded by [configProvider.js](lib/configProvider.js).
- **Query** - `POST /query` and `GET /query/stats` → [QueryController](lib/controller/QueryController.js) → [QueryService](lib/services/QueryService.js). Both routes are gated by [serviceAvailabilityCheck](lib/middleware/serviceAvailabilityCheck.middleware.js).
- **Live** - [LiveService](lib/services/LiveService.js) wraps `InfoLoggerReceiver`, parses each TCP line per the [InfoLogger protocol](docs/il-protocol.md), and broadcasts to connected clients over WebSocket.
- **Status / Config** - [StatusController](lib/controller/StatusController.js) reports DB / Server / GUI health; [ConfigController](lib/controller/ConfigController.js) exposes the runtime config to the frontend.
- **Profiles** - [ProfileService](lib/ProfileService.js) persists per-user column visibility/width to a JSON file ([JSONFileConnector](lib/JSONFileConnector.js)) via `getUserProfile` / `saveUserProfile`. The named-profile endpoint (`getProfile`) is a stub - it returns the hard-coded defaults regardless of the profile requested.
- **Utilities** - [utils/](lib/utils/) contains the InfoLogger message-command parser, SQL to native error mapping, prepared-statement parsing, and query cancellation.

## Frontend

Static files served from [public/](public/); no build step. A lightweight MVC app on top of `@aliceo2/web-ui`.

- **App shell** - [index.html](public/index.html) bootstraps [index.js](public/index.js), which mounts the top-level [Model](public/Model.js) and renders [view.js](public/view.js).
- **Sub-models** - [log/Log.js](public/log/Log.js) drives the log table (rendering in `tableLogs*.js`, inspector, status bar, context menu, zoom, etc.). [logFilter/LogFilter.js](public/logFilter/LogFilter.js) owns the filter inputs. [table/Table.js](public/table/Table.js) holds shared table state.
- **Supporting code** - [services/](public/services/), [constants/](public/constants/), [common/](public/common/), [about/](public/about/) (about component).
- **Styles** - [app.css](public/app.css), layered on the framework's [bootstrap.css](../Framework/Frontend/css/src/bootstrap.css).

## Local Development

### First-time setup

```bash
git clone https://github.com/AliceO2Group/WebUi.git
cd WebUi/InfoLogger
npm ci
cp config-default.js config.js
```

Edit `config.js` for the setup you're using below.

`npm run dev` runs the backend under nodemon. The frontend has no hot reload - refresh the browser to pick up changes.

### Query & Live mode Against a remote backend (e.g. a staging instance)

1. Point `mysql` and `infoLoggerServer` in `config.js` at the remote host and port.
2. `npm start`, then open [http://localhost:8080](http://localhost:8080).

### Live mode against synthetic logs (thoroughly test Live mode)

The bundled [fake InfoLoggerServer](test/live-simulator/) emits a log every 0-100 ms, shuffling through [test/live-simulator/fakeData.json](test/live-simulator/fakeData.json).

1. Set `infoLoggerServer` in `config.js` to `localhost:6102`.
2. Terminal 1: `npm run simul`.
3. Terminal 2: `npm run dev`.
4. Open [http://localhost:8080](http://localhost:8080) and click **Live**.

### Query against a local DB

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

1. In a working dir, create `compose.yaml`:

   ```yaml
   services:
     mariadb:
       image: mariadb
       restart: unless-stopped
       ports: ['3306:3306']
       environment:
         MARIADB_ROOT_PASSWORD: root # this is just an example, not intended to be a production configuration
     phpmyadmin:
       image: phpmyadmin
       restart: unless-stopped
       ports: ['9090:80']
       environment:
         - PMA_HOST=mariadb
   ```

   Gives you a MariaDB server with phpMyAdmin on the latest image. Pin a specific version (e.g. `mariadb:11.5`) by changing the `image:` tag.

2. `docker compose up -d`.
3. Open [http://localhost:9090/](http://localhost:9090/) → log in `root` / `root` → **New** → create database `INFOLOGGER`.
4. Open the **SQL** tab, paste [docs/database-specs.sql](docs/database-specs.sql), click **Go**.
5. In `config.js`:

   ```js
   mysql: {
     host: '127.0.0.1', 
     user: 'root',
     password: 'root',
     database: 'INFOLOGGER',
     port: 3306,
     timeout: 60000,
     retryMs: 5000,
   },
   ```

6. `npm run dev` - startup should log `Connection to DB successfully established: 127.0.0.1:3306`.

## Testing

- `npm test` - eslint + mocha. `npm run mocha` runs the suite alone.
  - Backend tests: [test/lib/](test/lib).
  - Frontend tests: [test/public/](test/public).
  - Add or update the matching test when fixing a bug.
- `npm run eslint` - config in [eslint.config.js](eslint.config.js). Lint failures block CI.

### Integration tests (live elsewhere)

ILG integration tests live in the **system-configuration** repo and run in its pipeline against a pipeline ILG. They are **not** executed by this repo's CI. To run them locally, clone system-configuration and run `npx mocha ilg-main.js`.

> ⚠️ If you change behaviour covered by integration tests, update the system-configuration suite during the next ILG release.

## CI

### [infologger.yml](../.github/workflows/infologger.yml)

Runs on every PR touching `InfoLogger/**`. Must pass to merge:

- `npm test` (eslint + mocha) on `ubuntu-latest`.
- `npm run coverage` with a CodeCov report; **coverage cannot decrease**.

### [release.yml](../.github/workflows/release.yml)

- Publishes a new version to the [NPM Registry](https://www.npmjs.com/) under [@aliceo2/infologger](https://www.npmjs.com/package/@aliceo2/infologger).
- Builds a `tgz` archive of the project for local-repository installations.

### [system-configuration pipeline](https://gitlab.cern.ch/AliceO2Group/system-configuration)

Runs the integration suite against a pipeline instance. Runs separately from this repo's CI, so run the suite locally before merging and flag any required changes to the team at release time.

## Docker development

The development, test and simul docker image will take up about 1.35 GB, about 50% of that is due to puppeteer's chromium requirement, the same reason why Electron apps are so big.

Should you want to run the ILG with the status quo (your changes applied) you can use the following commands:

1. npm run docker:dev  (will run the ILG with Nodemon, a development database, the ILG simulator and phpMyAdmin).
2. npm run docker:test (will run the ILG npm run test command inside a Docker container and print the live log output).
3. npm run docker:simul (will run an ILG simulator with the port open so that whenever you run the ILG it will have live mode available).
4. npm run docker:cleanup (REMOVES all containers created with the above commands and their data).

### Development database installation
In order to run queries in the InfoLogger a MariaDB server is required. To run a local MariaDB server that can easily be updated/wiped/configured you will need Docker installed.
1. Follow the instructions specific for you platform: [docker desktop install](https://www.docker.com/products/docker-desktop/)
2. Create a `compose.yaml` file somewhere on your pc with the following content: 
```
services:
  mariadb:
    image: mariadb
    restart: unless-stopped
    ports:
     - 3306:3306
    environment:
      MARIADB_ROOT_PASSWORD: root
    # (this is just an example, not intended to be a production configuration)
  phpmyadmin:
    image: phpmyadmin
    restart: unless-stopped
    ports:
      - 9090:80
    environment:
      - PMA_HOST=mariadb
```
This will get you a MariaDB server with phpmyadmin.
Should you ever feel the need to test a specific version of MariaDB then change the image to `mariadb:11.5` where 11.5 is the version. By default the compose.yaml will get you the latest MariaDB image.

## InfoLogger Insights

- [InfoLogger message protocol](docs/il-protocol.md)
- [Database schema](docs/database-specs.sql)
