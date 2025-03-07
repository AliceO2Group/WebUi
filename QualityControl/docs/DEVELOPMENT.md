# Development

## Requirements

Node.js: v22 (minimum)

Docker: Ensure Docker is installed and running on your system.

## Configuration

A .env configuration file is required for development. It should be placed in the root directory of the project.

Here is an example of the required environment variables:

```bash
MYSQL_DATABASE=qcg_dev_db
MYSQL_USER=qcg_dev_user
MYSQL_PASSWORD=123456
MYSQL_ROOT_PASSWORD=123456
```

Ensure these credentials match your local development setup.

## Running the Application

Follow these steps to start the QCG application:

1. Ensure Docker is running on your machine.

2. Execute the following command to launch the application:

```bash
docker-compose up
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
