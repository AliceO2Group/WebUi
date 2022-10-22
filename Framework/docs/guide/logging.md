# Backend - Logging module

The `@aliceo2/web-ui` framework offers 2 independent modules:

## `Log` module:
 Which features:
 * Colored logs printed to the console;
 * Option to save logs in a file in JSON format;
 * Option to send logs to `InfoLogger` server (if InfoLogger package is installed under `/opt/o2-InfoLogger/`)

### Import module and use default instance
The default instance will be printing logs to the console colored based on their level; Moreover, it will prefix all logs with timestamp and label provided to the constructor
```js
const {Log} = require('@aliceo2/web-ui');
const log = new Log('my-app');
log.debug('Created default instance of console logger');
```
Which will result in:
```js
1970-01-01T01:01:01.000Z [my-app] debug: Created default instance of console logger
```

### Import module and configure
Configuring logger is optional and required only when non default behavior of logger is desired such as:
- displaying to the console only logs from a certain level above;
- saving the logs to a file;
- send logs to [InfoLogger Server](https://github.com/AliceO2Group/InfoLogger/blob/master/doc/README.md)

```js
const {Log} = require('@aliceo2/web-ui');
Log.configure({
  winston: {
    file: {
      name: FILE_NAME, 
      level: FILE_LVL,
    }, 
    console: {
      level: CONSOLE_LVL,
      systemD: CONSOLE_SYSTEMD,
    }
  },
  infologger: true
});
new Log(LABEL);
```

Where:
  * [`FILE_NAME`] - path to file where logs will be written;
  * [`FILE_LVL`] - log severity of logs written to file; (default: `warn`);
  * [`CONSOLE_LVL`] - log severity of logs written to console; (default: `debug`)
  * [`CONSOLE_SYSTEMD`] - flags, console logs will be converted to a format more convenient for `journalctl` (where logs are stored from `systemd` services);
  * [`LABEL`] - label to use as prefix for all log messages (default empty);


#### Public methods

```js
static configure
```

```js
trace
```

```js
debug
```

```js
info
```

```js
warn
```

```js
error
```

## InfoLogger Receiver
Module to be used to receive logs from [InfoLogger Server](https://github.com/AliceO2Group/InfoLogger/blob/master/doc/README.md) endpoint

```js
const {InfoLoggerReceiver} = require('@aliceo2/web-ui');
const ilg = new InfoLoggerReceiver(config);
```
Where `config` is a JSON object with following fields expected:
  * `host` - InfoLogger server host
  * `port` - InfoLogger server port