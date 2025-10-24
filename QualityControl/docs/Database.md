# Database Setup and Configuration

This document explains how to set up and configure the database for development and testing purposes.

## Development Database Setup

There are two ways to set up a database for development:

### Option 1: Docker (Recommended)

The easiest way to get started is using Docker with the default configuration:

```bash
npm run docker-dev
```

This command will:
- Start the database container using Docker Compose
- Use the default configuration settings
- Set up the database ready for development

### Option 2: Local MariaDB Installation

For a local MariaDB setup, you'll need to install MariaDB on your system first.

**Installation Guide:** [MariaDB Getting Started](https://mariadb.com/get-started-with-mariadb/)

After installing MariaDB locally, configure your application to connect to your local database instance by updating the appropriate configuration files.

## Testing Database Setup

For running tests, Docker must be installed and running on your system.

To set up the test database:

```bash
npm run docker-test
```

This command will:
- Start a test database container
- Automatically seed the database with mock data prepared specifically for testing
- Ensure a clean testing environment

## Database Seeding and Configuration

### Development Seeding

For development purposes, you can seed the database with mock data by setting `forceSeed` to `true` in your configuration.

**Important Notes:**
- When `forceSeed` is enabled, seeding will execute every time the server reloads
- The `drop` property will clean all data from the database if set to `true` every time the server reloads
- Use these options carefully to avoid unintended data loss

### Migrations

Database migrations will be executed automatically if they haven't been run before.

**Clean Setup Recommendation:**
For a completely clean database setup, it's recommended to run:

```bash
docker compose down database -v
```

And delete all existing data.

**WARNING:** Only perform this clean setup the first time or when you specifically need to reset everything, as it will permanently delete all database data.

## Current Status

**Important:** The database is currently not being used by the application or tests, as the services and controllers are not yet configured to utilize the database layer. This functionality is planned for future implementation.

## Database Management Commands

- `npm run docker-dev` - Start development database
- `npm run docker-test` - Start test database with mock data
- `docker compose down database -v` - Clean database setup (removes all data)