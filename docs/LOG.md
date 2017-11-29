# Logging

### Configuration
The log class is a singleton therefore it only requires configuration once per application.
```js
log.configure(LOG_CONF);
```
Where:
`LOG_CONF` Configuration object for logging module with following defined fields:
   * `InfoLogger` - InfoLogger cofiguration variables
     * `execPath` - path to the log executable

### Public methods
* `debug(LOG)`
* `info(LOG)`
* `warn(LOG)`
* `error(LOG)`

### Example
```js
const {Log} = require('@aliceo2/aliceo2-gui');
const logConf = {
  "infologger": {
    "execPath": "/path/InfoLogger/bin/log"
  }
}
log.configure(logConf);

log.error('An error has occured');
```
