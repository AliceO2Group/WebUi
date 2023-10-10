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
  bookkeeping: {
    url: 'http://localhost:4000',
    token: 'some-token'
  },
  consul: {
    ui: 'localhost:8500',
    hostname: 'localhost',
    port: 8500,
    flpHardwarePath: 'o2/hardware/key/prefix',
    detHardwarePath: 'o2/hardware/detectors',
    readoutPath: 'o2/components/readout/key/prefix',
    readoutCardPath: 'o2/components/readoutcard/key/prefix',
    qcPath: 'o2/components/qc/key/prefix',
    kVPrefix: 'o2/cluster/key/prefix',
    coreServices: 'o2/components/aliecs/some/settings/path',
  },
  infoLoggerGui: {
    url: 'localhost:8081',
  },
  infoLoggerEpnGui: {
    url: 'localhost:8083',
  },
  qcGui: {
    url: 'qcg.cern.ch'
  },
  bookkeepingGui: {
    url: 'ali-bookkeeping.cern.ch'
  },
  utils: {
    refreshTask: 10000, // how often should task list page should refresh its content
  },
  logging: {
    infologger: false,
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
