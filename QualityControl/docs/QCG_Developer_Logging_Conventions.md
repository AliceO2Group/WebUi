# QCG Developer Logging Conventions

## Introduction

QCG (Quality Control GUI) is deployed in multiple production instances, each serving a separate QCDB database. To ensure clear separation of logs and traceability across deployments, developers must follow specific logging conventions.

## Logging with LogManager and LOG_FACILITY

Logging in QCG should use the O2 Logging application from the `@aliceo2/web-ui` framework. This wraps the Winston library and O2's InfoLogger project, providing a unified logging interface.

### Why Use LOG_FACILITY?

Each QCG deployment (e.g., `qcg`, `qcg-mc`, `qcg-async`) should have its own log label. This allows logs to be easily attributed to the correct deployment and QCDB instance.
The standard for the log_facility is: `<application_name>/<file>`

### Setting the Log Facility

The log facility string should be built using the `process.env.npm_config_log_label` environment variable. If not set, a sensible default (e.g., `qcg`) should be used.

### Example: Setting Up Logging in BookkeepingService

```js
import { LogManager } from '@aliceo2/web-ui';

// Use the environment variable or a default value
const LOG_FACILITY = `${process.env.npm_config_log_label ?? 'qcg'}/bkp-service`;

// Initialize the logger for this service
this._logger = LogManager.getLogger(LOG_FACILITY);

// Usage example
this._logger.infoMessage('BookkeepingService started');
```

### Best Practices

- **Always use the provided logger:** Do not use `console.log` or other logging libraries directly.
- **Set the log label via environment variable:** This ensures logs are correctly attributed in multi-instance deployments.
- **Log meaningful events:** Include context in log messages to aid debugging and monitoring.
