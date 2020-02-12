# Consul Service
Manages Read operations for the Key-Value store and Service discovery of [Consul](https://www.consul.io/). 

#### Import the module
```js
require('@aliceo2/web-ui').ConsulService
```

#### Create an instance
```js
new ConsulService({hostname: HOST, port: PORT});
```

Where:
 - `HOST` - consul leader instance hostname
 - `PORT` - consul leader port number

### Example

```js
const ConsulService = require('@aliceo2/web-ui').ConsulService;
const consul = new ConsulService({hostname: 'localhost', port: '8080'});

/// Get Consul Leader Status
consul.getConsulLeaderStatus()
  .then(result => console.log(result))
  .catch(err => console.error(err));


/// Get Services
consul.getServices()
  .then(result => console.log(result))
  .catch(err => console.error(err));

/// Get only Keys by their prefix
consul.getKeysByPrefix('o2-keys')
  .then(result => console.log(result))
  .catch(err => console.error(err));
```
