module.exports = {
  jwt: {
    secret: "<secret>",
    issuer: "alice-o2-gui",
    expiration: "60s",
    maxAge: "2m"
  },
  openId: {
    secret: "<secret>",
    id: "<id>",
    redirect_uri: "https://redirect.uri/callback",
    well_known: "http://localhost/.well-known/openid-configuration'"
  },
  http: {
    port: 8181,
    portSecure: 8443,
    key: "test.key",
    cert: "test.pem",
    tls: false
  },
  mysql: {
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "INFOLOGGER",
    port: 3306
  },
  log: {
    winston: {
      file: {
        name: "./Backend/test/log/error.log",
        level: "error"
      },
      console: {
        level: "debug"
      }
    },
    infologger: false
  },
  consul: {
    hostname: "localhost",
    port: 8080
  },
  notification: {
    brokers: ["localhost:9092"]
  }
};
