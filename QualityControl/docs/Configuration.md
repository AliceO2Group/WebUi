# Local Configuration

To customize QCG for your environment, you need to modify the configuration file located at:  
`WebUi/QualityControl/config.js`

### HTTP Configuration

In the `http` section, you can define the HTTP endpoint settings for the application:

- **`hostname`**: Define the hostname for the application’s HTTP endpoint (e.g., `localhost` or a custom domain).
- **`port`**: Set the port number the application will listen to for HTTP requests.

Example:
```javascript
http: {
  hostname: 'localhost',
  port: 3000
}
```

### CCDB Configuration
In the `ccdb` section, you can define the endpoint settings for the **CCDB** (Condition and Calibration Data Base), used to store calibration and alignment data.

You can customize the following parameters:

- `protocol`: Defines the protocol used to query the `CCDB` via HTTP API. The default value is 'http'.
- `hostname`: The hostname of the `CCDB` instance. You can set this to 'localhost' or the hostname of a remote `CCDB` instance.
- `port`: The port number for accessing the `CCDB` API. The default is '8080'.
- `prefix` (optional): Set a prefix for filtering the path names used in API queries.
- `cachePrefix` (optional): A prefix used for building the cache of object paths from the `CCDB`.
- `cacheRefreshRate` (optional): Defines the interval (in milliseconds) at which the paths of objects from **CCDB** should be refreshed. The default is 120 * 1000 (120 seconds).

```javascript
ccdb: {
  protocol: 'http',
  hostname: 'localhost',
  port: '8080',
  prefix: '',
  cachePrefix: 'qc',
  cacheRefreshRate: 120 * 1000
}
```

### BOOKKEEPING
Attribute to define the `Bookkeeping` endpoint. If this configuration is not provided, QCG will not proceed with the setup of Bookkeeping service and it will not fetch data from it. Same behavior if the configuration provided is not valid.

- `url` - URL for accessing Bookkeeping API
- `token` - Authentication token required to interact with the API securely.
- `runTypesRefreshInterval` - Frequency (in miliseconds) at which the runtypes from bookkeeping are refreshed or synchronized.
- `runStatusRefreshInterval` - Frequency (in miliseconds) at which the the status of ongoing runs from bookkeeping are refreshed or synchronized.

```javascript
bookkeeping: {
  url: 'http://localhost:4000', 
  token: 'example-token',
  runTypesRefreshInterval: 15000,
  runStatusRefreshInterval: 30000,
},
```

### KafkaJS
QCG provides live updates with respect to the ongoing runs in the configured environment. This is achieved via Kafka and [QCG Run Mode](./Features.md#runs-mode)
The following object should be used as configuration template if use of Kafka is desired:

```js
  kafka: {
    enabled: false, // if kafka should be used in QCG startup
    clientId: 'qcg-client-local',
    consumerGroups: {
      QCG_RUN: 'qcg-run-local'
    },
    brokers: ['localhost:9092'],
  },
```

### QC Environment Configuration
In the qc section, you can define whether QCG should be started as part of a Quality Control (QC) integrated environment.

- `enabled`: Set this to true if QCG should be part of an integrated QC environment, or false to disable this feature.
```javascript
qc: {
  enabled: false
}
```

### Database Configuration

The application requires the following database configuration parameters:

| **Field**       | **Type**    | **Description**                                                                             | **Default Value**         |
|-----------------|-------------|---------------------------------------------------------------------------------------------|---------------------------|
| `host`          | `string`    | Hostname or IP address of the database server.                                              | `'database'`             |
| `port`          | `number`    | Port number used to connect to the database server.                                         | `3306`                    |
| `username`      | `string`    | Username for authenticating with the database.                                              | `'cern'`                  |
| `password`      | `string`    | Password for the specified database user.                                                   | `'cern'`                  |
| `database`      | `string`    | Name of the database to connect to.                                                         | `'qcg'`                   |
| `charset`       | `string`    | Character encoding used for the connection.                                                 | `'utf8mb4'`               |
| `collate`       | `string`    | Collation setting used for string comparison and sorting.                                   | `'utf8mb4_unicode_ci'`    |
| `timezone`      | `string`    | Time zone used for all date/time values in the database connection.                         | `'+00:00'`                |
| `logging`       | `boolean`   | Enables or disables SQL query logging (useful for debugging).                               | `false`                   |
| `retryThrottle` | `number`    | Time in milliseconds to wait before retrying a failed database connection.                  | `5000`                    |
| `forceSeed`     | `boolean`   | (for dev mode) Force seeding the database with mock data. **Warning:** Not recommended for production use. | `false`                   |
| `drop`          | `boolean`   | (for dev mode) Force deleting the data from the database when server starts. **Warning:** This will erase all data—never use in production. | `false`                   |

To know more about the database configuration, please go to: [Database Setup](./Database.md)