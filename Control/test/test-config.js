
module.exports = {
  http: {
    port: 8080,
    // portSecure: 8443,
    hostname: 'localhost',
    // key: './cert/key.pem',
    // cert: './cert/cert.pem',
    tls: false,
  },
  grpc: {
    hostname: 'localhost',
    port: 9090,
    timeout: 10000,
  },
  kafka: {
    hostnames: 'localhost',
    port: 9092,
    topic: 'notifications',
    groupId: 'flp-kafka-notifications'
  },
  consul: {
    hostname: 'localhost',
    port: 8500,
    cruPath: 'test/o2/hardware/flps'
  }
};
