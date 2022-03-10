# Notification service


#### Import the module
```js
require('@aliceo2/web-ui').NotificationService
```

#### Create an instance
```js
new NotificationService({brokers: BROKERS, topic: TOPIC}));
```

Where:
 - `BROKERS` - list of Kafka brokers hosts as an array
 - [`TOPIC`] - Kafka topic for notifications

#### Public methods
 ```js
isConfigured
 ```
 ```js
send
 ```
```js
proxyWebNotificationToWs
```
```js
disconnectProxy
```
