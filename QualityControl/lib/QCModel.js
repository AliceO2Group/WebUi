const config = require('./configProvider.js');

const MySQL = require('@aliceo2/web-ui').MySQL;
const mySQL = new MySQL(config.mysql);

const ZeroMQClient = require('@aliceo2/web-ui').ZeroMQClient;

// CRUD
module.exports.readObjectData = readObjectData;
module.exports.listObjects = listObjects;

module.exports.readLayout = readLayout;
module.exports.writeLayout = writeLayout;
module.exports.listLayouts = listLayouts;
module.exports.createLayout = createLayout;
module.exports.deleteLayout = deleteLayout;

const ZMQ_TIMEOUT = 1000; // ms

/**
 * Read object's data or null if it fails
 * @param {string} path - Object's path like agentName/objectName/objectNameSub
 * @return {Object|null}
 */
function readObjectData(path) {
  const [agentName, ...rest] = path.split('/');
  const objectName = rest.join('/');

  return new Promise((resolve, fail) => {
    const timer = setTimeout(() => {
      zeroMQClient.socket.close();
      fail('Timeout loading object from TObject2Json');
    }, ZMQ_TIMEOUT);

    const zeroMQClient = new ZeroMQClient(
      config.tobject2json.host,
      config.tobject2json.port,
      'req'
    );

    zeroMQClient.on('message', (m) => {
      zeroMQClient.socket.close();
      clearTimeout(timer);
      try {
        resolve(JSON.parse(m));
      } catch (e) {
        // failed to parse
        fail('Failed to parse object from TObject2Json');
      }
    });
    zeroMQClient.send(`${agentName} ${objectName}`);
  });
}

/**
 * List all object without the data which are heavy
 * @return {Array<Layout>}
 */
async function listObjects() {
  // first list all agents available
  const agentsQuery = `select *
                       from information_schema.tables
                       where table_schema = ? and table_name like "data_%"`;
  const agentTables = await mySQL.query(agentsQuery, [config.mysql.database]);

  // then list all objects form those agents
  const objectsPromises = agentTables.map((agentTable) => {
    return mySQL.query(`select object_name as name, '${agentTable.TABLE_NAME}' as agent
                        from ${agentTable.TABLE_NAME}`);
  });
  const objectListListRaw = await Promise.all(objectsPromises);

  // Flatten the array of array of raw objects from the database to array of objects
  const objects = objectListListRaw.reduce((result, objectListRaw) => {
    const objectList = objectListRaw.map((objectRaw) => {
      return {name: `${objectRaw.agent.substr(5)}/${objectRaw.name}`, quality: 'good'};
    });
    return result.concat(objectList);
  }, []);

  return objects;
}

/**
 * Create a layout
 * @param {Layout} layout
 * @return {Object} MySQL request details
 */
function createLayout(layout) {
  return mySQL.query('insert into layout (id, name, owner_id, owner_name, tabs) value (?,?,?,?,?)',
    [
      layout.id,
      layout.name,
      layout.owner_id,
      layout.owner_name,
      JSON.stringify(layout.tabs)
    ]
  );
}

/**
 * List layouts, can be filtered
 * @param {Object} filter - undefined or {owner_id: XXX}
 * @return {Array<Layout>}
 */
async function listLayouts(filter = {}) {
  let request;

  if (filter.owner_id !== undefined) {
    request = mySQL.query('select * from layout where owner_id = ?', [filter.owner_id]);
  }

  request = mySQL.query('select * from layout');
  request.then((items) => {
    return items.forEach((item) => {
      item.tabs = JSON.parse(item.tabs);
    });
  });
  return request;
}

/**
 * Retrieve a layout or null
 * @param {string} layoutName - layout name
 * @return {Layout|null}
 */
function readLayout(layoutName) {
  return mySQL.query('select * from layout where name = ? limit 1', [layoutName]).then((items) => {
    if (items.length === 0) {
      return null;
    }
    const item = items[0];
    item.tabs = JSON.parse(item.tabs);
    return item;
  });
}

/**
 * Update a single layout by its name
 * @param {string} layoutName
 * @param {Layout} data
 * @return {Object} MySQL request details
 */
function writeLayout(layoutName, data) {
  return mySQL.query('update layout set tabs = ? where name = ?',
    [JSON.stringify(data.tabs), layoutName]);
}

/**
 * Delete a single layout by its name
 * @param {string} layoutName
 * @return {Object} MySQL request details
 */
function deleteLayout(layoutName) {
  return mySQL.query('delete from layout where name = ?', [layoutName]);
}


// Information service
// Map<agentName:string, Map<objectName:string, data:Any>>
const util = require('util');

/**
 * Keep a synchronized representation of IS over ZMQ
 */
class InformationServiceState {
  constructor() {
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
      console.log('all', util.inspect(this.tasks, {depth: 3}));
    });


    this.subConnexion.on('message', (json) => {
      const parsed = JSON.parse(json);
      const agentName = parsed.name;
      const objectsNames = parsed.objects.map((object) => object.id);
      this.upsert(agentName, objectsNames);
      console.log('all', util.inspect(this.tasks, {depth: 3}));
    });
  }
}

let is = new InformationServiceState();
is.startSynchronization({
  server: {
    host: 'aidrefflp01.cern.ch',
    port: 5562,
  },
  publisher: {
    host: 'aidrefflp01.cern.ch',
    port: 5561,
  }
});


