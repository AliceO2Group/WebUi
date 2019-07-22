module.exports = {
  http: {
    port: 8080,
    // portSecure: 8443,
    hostname: 'localhost',
    // key: './cert/key.pem',
    // cert: './cert/cert.pem',
    tls: false
  },
  mysql: {
    host: 'localhost',
    user: 'root',
    password: 'admintest',
    database: 'INFOLOGGER',
    port: 8909
  },
  infoLoggerServer: {
    host: 'localhost',
    port: 6102
  },
};
