module.exports = {
  demoData: true,
  http: {
    port: 8181,
    hostname: 'localhost',
    tls: false
  },
  mysql: {
    host: 'aaaa',
    user: 'aaaa',
    password: 'aaaa',
    database: 'quality_control'
  },
  tobject2json: {
    host: 'localhost',
    port: 7777
  },
  consul: {
    hostname: 'localhost',
    port: 8500
  },
  ccdb: {
    hostname: 'ccdb',
    port: 8500,
    prefix: 'test'
  },
  quality_control: {
    version: '0.19.5-1'
  }
};
