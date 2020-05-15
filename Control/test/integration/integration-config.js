module.exports = {
  http: {
    port: 8080,
    hostname: 'localhost',
    tls: false,
  },
  grpc: {
    hostname: 'localhost',
    port: 47102,
    timeout: 10000, // ms, gRPC deadline for service calls
  },
  consul: {
    hostname: 'localhost',
    port: 8500,
    flpHardwarePath: 'o2/hardware/flps2'
  }
};
