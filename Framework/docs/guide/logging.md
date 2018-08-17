# Backend - Logging module
Logging module handles log in a two ways:
 * Prints or saves log in a file using `winston` library (default mode)
 * Receives logs from `InfoLogger` server
 * Sends logs to `InfoLogger` daemon over named socket

### Configuration
Configuring logger is optional and required only when non default behaviour of logger is desired (as sending logs to InfoLogger).
The configuration is applied by calling static method:
```js
Log.configure(LOG_CONF);
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

### Logging instance
In order to easily categorie the logs each logging instance requires a label. Example:
```js
const log = new (require('@aliceo2/web-ui'))('Example');
```

### Code example
```js
// include logging module
const {Log} = require('@aliceo2/web-ui');

// enable writing to files (this is done once per app)
Log.configure({winston: {file: '/tmp/example.log'}});

// create an logger instance
const log = new Log('Example');

// send error log
log.error('An error has occurred');
```

### API

Static methods:
```js
Log.configure(<LOG_CONF>);
Log.trace(<Error>);
```

Class members:
```js
log.debug(<String>);
log.info(<String>);
log.warn(<String>);
log.error(<String>);
```
