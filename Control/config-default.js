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
    maxMessageLength: 50 // MB, gRPC receive message limit
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
  },
  consul: {
    hostname: 'localhost',
    port: 8500,
    flpHardwarePath: 'o2/hardware/key/prefix',
    readoutPath: 'o2/components/readout/key/prefix',
    readoutCardPath: 'o2/components/readoutcard/key/prefix',
    qcPath: 'o2/components/qc/key/prefix',
    consulKVPrefix: 'o2/cluster/key/prefix',
  },
  // infoLoggerGui: {
  //   hostname: 'localhost',
  //   port: 8081
  // }
  // JWT manages user's session duration
  // https://github.com/AliceO2Group/WebUi/blob/dev/Framework/docs/guide/json-tokens.md
  // jwt: {
  //   secret: '<secret>',
  //   issuer: 'alice-o2-gui',
  //   expiration: '1d',
  //   maxAge: '1d'
  // },
};
