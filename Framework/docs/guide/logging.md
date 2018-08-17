# Backend - Logging module
Logging module handles log in a two ways:
 * Prints or saves log in a file using `winston` library (default mode)
 * Receives logs from `InfoLogger` server
 * Sends logs to `InfoLogger` daemon over named socket

### Configuration
Configuring logger is optional and required only when non default behavior of logger is desired.
```js
log.configure(LOG_CONF);
```

Where:
`LOG_CONF` that consists of following fields:
   * [`winston`] - logging to console or file
     * [`file`] - log filepath
     * [`fileLvl`] - file log level
     * [`consoleLvl`] - console log level
   * [`infologger`] - InfoLogger configuration variables
     * `sender` - UNIX name socket of InfoLoggerD
     * [`port`] - InfoLogger server port
     * [`host`] - InfoLogger server host

### Code example
```js
// Include logging module
const {log} = require('@aliceo2/web-ui');

// This enables saving logs to file; otherwise it uses default console logging only
// log.configure({winston: {file: 'error.log'}});

// Send an error log
log.error('An error has occured');
```

### API

```js
log.configure(<LOG_CONF>);
log.debug(<String>);
log.info(<String>);
log.warn(<String>);
log.error(<String>);
log.trace(<Error>);
```
