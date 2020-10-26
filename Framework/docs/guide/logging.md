# Backend - Logging module
Logging module features:
 * Prints colored log messages
 * Saves logs in a file in JSON format
 * Sends logs to `InfoLogger` system
 * Receives logs from `InfoLogger` server endpoint

#### Import module and create default instance
```js
new (require('@aliceo2/web-ui').Log)(LOG_NAME);
```

Where `LOG_NAME` is log instance name. This name will prefix each log messsage.

#### Import module and create non-default instance

Configuring logger is optional and required only when non default behavior of logger is desired.

```js
const {Log} = require('@aliceo2/web-ui');
Log.configure({winston: {file: FILE_NAME, fileLvl: FILE_LVL, consoleLvl: CONSOLE_LVL, consoleSystemd: CONSOLE_SYSTEMD}, infologger: {enableSender: IL_SENDER_ENABLE, host: IL_RCV_HOST, port: IL_RCV_PORT}});
new Log(LOG_NAME);
```

Where:
  * [`FILE_NAME`] - path to file where logs will be written
  * [`FILE_LVL`] - log severity of logs written to file
  * [`CONSOLE_LVL`] - log severity of logs written to console
  * [`CONSOLE_SYSTEMD`] - flags, console logs will be converted to a format more conviniet for `journalctl` (where logs are stored from `systemd` services).
  * [`IL_SENDER_ENABLE` - Enables passing logs to InfoLogger server
  * [`IL_RCV_HOST`] - InfoLogger server host
  * [`IL_RCV_PORT`] - InfoLogger server port
  * `LOG_NAME` - log instance name


#### Public methods

```js
configure
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

#### Example
```js
const log = new (require('@aliceo2/web-ui').Log)('example');
log.error('this is error message');
```
