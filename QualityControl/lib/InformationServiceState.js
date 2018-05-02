const ZeroMQClient = require('@aliceo2/web-ui').ZeroMQClient;

const EventEmitter = require('events');

/**
 * Keep a synchronized representation of IS over ZMQ
 * @fires InformationServiceState#updated
 */
class InformationServiceState extends EventEmitter {
  constructor() {
    super();

    // Map<objectPath:string, informationServiceData:object>
    this.tasks = {};
    this.reqConnexion = null;
    this.subConnexion = null;
  }

  /**
   * Remove all data about tasks
   */
  clear() {
    this.tasks = {};
  }

  /**
   * Insert or update an agent and its objects properties
   * @param {string} objectPath - result of `${agentName}/${objectName}`
   * @param {object} objectInformation - any information from IS
   */
  upsert(objectPath, objectInformation) {
    if (!objectPath.includes('/')) {
      throw new Error(`objectPath "${objectPath}" should contain "/"`);
    }
    this.tasks[objectPath] = objectInformation;
  }

  /**
   * Get the current state of IS
   * @return {Map<objectPath:string, informationServiceData:object>}
   */
  getState() {
    return this.tasks;
  }

  /**
   * Connect to ZMQ servers and start synchronization of IS state
   *
   * QQQQ
   *
   * @return {string} config
   */
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
