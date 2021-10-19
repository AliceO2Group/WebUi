module.exports = {
  http: {
    port: 8080,
    // portSecure: 8443,
    hostname: 'localhost',
    // key: './cert/key.pem',
    // cert: './cert/cert.pem',
    tls: false,
    limit: '1Mb'
  },
  grpc: {
    hostname: 'localhost',
    port: 9090,
    timeout: 20000, // ms, gRPC deadline for service calls
    maxMessageLength: 50, // MB, gRPC receive message limit
    label: 'Control',
    package: 'o2control'
  },
  apricot: {
    hostname: 'localhost',
    port: 9090,
    timeout: 20000, // ms, gRPC deadline for service calls
    maxMessageLength: 50, // MB, gRPC receive message limit
    label: 'Apricot',
    package: 'apricot'
  },
  grafana: {
    url: 'http://localhost:3000'
  },
  consul: {
    hostname: 'localhost',
    port: 8500,
    flpHardwarePath: 'o2/hardware/key/prefix',
    readoutPath: 'o2/components/readout/key/prefix',
    readoutCardPath: 'o2/components/readoutcard/key/prefix',
    qcPath: 'o2/components/qc/key/prefix',
    kVPrefix: 'o2/cluster/key/prefix',
    coreServices: 'o2/components/aliecs/some/settings/path',
  },
  infoLoggerGui: {
    hostname: 'localhost',
    port: 8081
  },
  qcGui: {
    hostname: 'localhost',
    port: 8081
  },
  bookkeepingGui: {
    hostname: 'localhost',
    port: 8081
  },
  utils: {
    refreshTask: 10000, // how often should task list page should refresh its content
    refreshEnvs: 10000, // how often should env list page should refresh its content
  }
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
