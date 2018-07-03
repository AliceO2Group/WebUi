module.exports = {
  // mandatory
  http: {
    port: 8080,
    // portSecure: 8443,
    hostname: 'localhost',
    // key: './cert/key.pem',
    // cert: './cert/cert.pem',
    tls: false
  },

  // optional data source, comment object if not used
  // all options: https://github.com/mysqljs/mysql#connection-options
  mysql: {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'INFOLOGGER',
    port: 3306
  },

  // optional data source, comment object if not used
  // all options: https://nodejs.org/api/net.html#net_socket_connect_options_connectlistener
  infoLoggerServer: {
    host: 'localhost',
    port: 6102
  },
};
