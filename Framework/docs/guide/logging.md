# Backend - Logging module
Logging module handles log in a two ways:
 * Prints or saves log in a file using `winston` library (default mode)
 * Sends logs to `InfoLogger` infrastructure (requires configuration)

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
     * `execPath` - path to the log executable

### Code example
```js
// Include logging module
const {Log} = require('@aliceo2/web-ui');

// This enables saving logs to file; otherwise it uses default console logging only
// Log.configure({winston: {file: 'error.log'}});

// Send an error log
Log.error('An error has occured');
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
