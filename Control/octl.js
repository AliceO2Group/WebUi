const grpc = require('grpc');

class Octl {
  constructor(config) {
    const octlProto = grpc.load(config.proto);
    console.log(`Connecting to OTCL: ${config.hostname}:${config.port}`);
    this.client = new octlProto.octl.Octl(`${config.hostname}:${config.port}`, 
      grpc.credentials.createInsecure());
  }

  createEnv() {
    this.client.NewEnvironment({roles: ['flp3', 'epn2']}, function(error, response) {
      if (error) {
        console.log('Error: ', error);
      }   
      else {
        return response.id;
      }   
    }); 
  }

  printEnv(envId) {
    this.client.GetEnvironment({id: envId}, function(error, response) {
      if (error) {
        console.log('Error: ', error);
      }   
      else {
        console.log(response);
      }   
    }); 
  }

  trackStatus() {
    const call = this.client.TrackStatus({});
    call.on('data', function(data) {
      console.log(data);
    }); 
    call.on('end', function() {
      console.log('END: TrackStatus');
    }); 
    call.on('status', function(status) {
      console.log('STATUS: TrackStatus');
    }); 
  }
}
module.exports = Octl;
