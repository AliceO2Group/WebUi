# Kafka connector - Notification


#### Import the module
```js
require('@aliceo2/web-ui').KafkaConnector
```

#### Create an instance
```js
new KafkaConnector({brokers: BROKERS}));
```

Where:
 - `BROKERS` - list of broker hosts as an array

#### Public methods
 ```js
isConfigured
 ```
 ```js
sendMattermostNotification
 ```
 ```js
sendWebNotification
 ```
 ```js
sendEmailNotification
 ```
```js
proxyWebNotificationToWs
```
```js
disconnectProxy
```
