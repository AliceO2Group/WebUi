# Development

## Requirements

Node.js: v22 (minimum)

Docker: Ensure Docker is installed and running on your system.

## Running the Application

Control backend from this repository is a dependency of this project. Make sure it is configured and set up properly, as described in its README, and to run it on address `localhost:8081`.

Follow these steps to start the Configuration application:

1. Ensure Docker is running on your machine.
2. Execute the following command to launch the application:
```shell
docker compose up
```

This will launch the following containers:

- install-webapp
    - Install the webapp dependencies then stops
- webapp
    - Runs the development server of the webapp once the `install-webapp` exited successfully
- reverse-proxy
    - Provides a single endpoint for the backend and development server

Once the application is running, access it in your browser at:

[localhost:8080](http://localhost:8080)


### Deployment

To deploy the application, run the command `npm run build` from the webapp directory. This will build the webapp sources as static files that can be served by any static file server.


### Troubleshooting

- Port Conflicts: Ensure port 8080 is not in use by other applications.
- Docker Issues: Verify Docker is installed and properly running with:

```bash
docker --version
docker-compose --version
```

- It is possible that a race condition while installing `npm` dependencies occur, when the app is started by docker before the container which downloads dependencies succeeds. In that case wait a little bit until all dependencies are downloaded, and then restart the `docker compose up` command.
