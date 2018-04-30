const ZeroMQClient = require('@aliceo2/web-ui').ZeroMQClient;

const EventEmitter = require('events');

/**
 * Keep a synchronized representation of IS over ZMQ
 * @fires InformationServiceState#updated
 */
class InformationServiceState extends EventEmitter {
  constructor() {
    super();

    // Map<agentName:string, Map<objectName:string, data:Any>>
    // Map<objectPath:string, informationServiceData:object>
    this.tasks = {};
    this.reqConnexion = null;
    this.subConnexion = null;
  }

  clear() {
    this.tasks = {};
  }

  upsert(agentName, objectsNames) {
    this.tasks[agentName] = objectsNames;
  }

  getState() {
    return this.tasks;
  }

  startSynchronization(config) {
    this.reqConnexion = new ZeroMQClient(
      config.server.host,
      config.server.port,
      'req'
    );

    this.subConnexion = new ZeroMQClient(
      config.publisher.host,
      config.publisher.port,
      'sub'
    );

    this.reqConnexion.send('all');
    this.reqConnexion.on('message', (json) => {
      const parsed = JSON.parse(json);
      this.clear();
      for (let task of parsed.tasks) {
        const agentName = task.name;
        const objectsNames = task.objects.map((object) => object.id);
        this.upsert(agentName, objectsNames);
      }
      this.emit('updated', this.tasks);
    });


    this.subConnexion.on('message', (json) => {
      const parsed = JSON.parse(json);
      const agentName = parsed.name;
      const objectsNames = parsed.objects.map((object) => object.id);
      this.upsert(agentName, objectsNames);
      this.emit('updated', this.tasks);
    });
  }
}

module.exports = InformationServiceState;
