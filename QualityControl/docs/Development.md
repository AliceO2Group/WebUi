# Development

## Requirements

Node.js: v22 (minimum)

Docker: Ensure Docker is installed and running on your system.

## Running the Application

Follow these steps to start the QCG application:

1. Ensure Docker is running on your machine.
2. Execute the following command to launch the application:
```bash
npm run docker-dev
```

Once the application is running, access it in your browser at:

[localhost:8080](http://localhost:8080)

### Troubleshooting

- Port Conflicts: Ensure port 8080 is not in use by other applications.
- Docker Issues: Verify Docker is installed and properly running with:

```bash
docker --version
docker-compose --version
```

- You may occasionally encounter error messages indicating that the application is unable to connect to the database (e.g., `SequelizeConnectionRefusedError`). This can happen if the application tries to establish a connection before the database service is fully initialized. In such cases, these messages are expected during startup and should stop appearing once the database is ready. Simply wait a few moments and the application should recover automatically.