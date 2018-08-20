// This is quick start configuration
// See the Backend documentation for more details
//
module.exports = {
  jwt: {
    secret: 'supersecret',
    expiration: '10m'
  },
  http: {
    port: 8080,
    hostname: 'localhost',
    tls: false
  }
};
