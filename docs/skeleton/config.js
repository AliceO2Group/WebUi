// This is default configuration for quick start
// See the documentation for all fields and possibilities

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
