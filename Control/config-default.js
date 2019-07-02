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
    timeout: 20000, // ms, gRPC deadline for service calls
  },
  grafana: {
    hostname: 'localhost',
    port: 3000
  },
  kafka: {
    hostnames: 'localhost', // can be a string with multiple hostnames delimited by comma
    port: 9092,
    topic: 'notifications',
    groupId: 'flp-kafka-notifications'
  }

  // JWT manages user's session duration
  // https://github.com/AliceO2Group/WebUi/blob/dev/Framework/docs/guide/json-tokens.md
  // jwt: {
  //   secret: '<secret>',
  //   issuer: 'alice-o2-gui',
  //   expiration: '1d',
  //   maxAge: '1d'
  // },
};
