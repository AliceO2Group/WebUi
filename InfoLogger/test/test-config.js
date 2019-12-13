module.exports = {
  http: {
    port: 8080,
    // portSecure: 8443,
    hostname: 'localhost',
    // key: './cert/key.pem',
    // cert: './cert/cert.pem',
    tls: false
  },
  infoLoggerServer: {
    host: 'localhost',
    port: 6102
  },
  jwt: {
    secret: '<secret>',
    issuer: 'alice-o2-gui',
    expiration: '60s',
    maxAge: '2'
  },
};
