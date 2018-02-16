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
   * [`infologger`] - InfoLogger cofiguration variables
     * `execPath` - path to the log executable

### Code example
```js
// Include logging module
const {Log} = require('@aliceo2/aliceo2-gui');

// This enables saving logs to file; otherwise it uses default console logging only
// Log.configure({winston: {file: 'error.log'}});

// Send an error log
Log.error('An error has occured');
```
