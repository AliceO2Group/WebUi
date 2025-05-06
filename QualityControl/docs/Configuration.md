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
Attribute to define the `Bookkeeping` endpoint.

- `url` - URL for accessing Bookkeeping API
- `token` - Authentication token required to interact with the API securely.
- `refreshRate` - Frequency (in miliseconds) at which the bookkeeping data is refreshed or synchronized.


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
| **Field**       | **Description**                                                                             |
|-----------------|---------------------------------------------------------------------------------------------|
| `host`          | Hostname or IP address of the database server.                                              |
| `port`          | Port number used to connect to the database server.                                         |
| `username`      | Username for authenticating with the database.                                              |
| `password`      | Password for the specified database user.                                                   |
| `database`      | Name of the database to connect to.                                                         |
| `charset`       | Character encoding used for the connection.                                                 |
| `collate`       | Collation setting used for string comparison and sorting.                                   |
| `timezone`      | Time zone used for all date/time values in the database connection.                         |
| `logging`       | Enables or disables SQL query logging (useful for debugging).                               |
| `retryThrottle` | Time in milliseconds to wait before retrying a failed database connection.                  |
| `migrationSeed` | *(Optional)* Set to `true` to execute seeders that populate the database with mock data.   |
