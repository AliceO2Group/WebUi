# Demonstration project for react-based webapp

## Directory structure

The project is composed of:

- ./backend:
    - Contains the backend based on express using WebUI framework
    - This directory should be removed if the applications uses an already existing backend or no backend at all

- ./webapp:
    - Contains a SPA frontend based on react (using react-router as framework)

- ./docker:
    - Contains the necessaries files for docker setup, especially the configuration of nginx

## Get started

To start the development, simply launch the docker compose stack:

```shell
docker compose up
```

This will launch the following containers:

- install-backend
    - Install the backend dependencies then stops
- backend
    - Runs the backend webserver once the `install-backend` exited successfully
- install-webapp
    - Install the webapp dependencies then stops
- webapp
    - Runs the development server of the webapp once the `install-webapp` exited successfully
- reverse-proxy
    - Provides a single endpoint for the backend and development server

## Deployment

To deploy the application, run the command `npm run build` from the webapp directory. This will build the webapp sources
as static files that can be served by any static file server.
