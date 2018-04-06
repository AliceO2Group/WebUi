const config = require('../config.js');

const MySQL = require('@aliceo2/aliceo2-gui').MySQL;
const mySQL = new MySQL(config.mysql);

const ZeroMQClient = require('@aliceo2/aliceo2-gui').ZeroMQClient;

// CRUD
module.exports.readObjectData = readObjectData;
module.exports.listObjects = listObjects;

module.exports.readLayout = readLayout;
module.exports.writeLayout = writeLayout;
module.exports.listLayouts = listLayouts;
module.exports.createLayout = createLayout;
module.exports.deleteLayout = deleteLayout;

/**
 * Retrieve a monitoring object (TObject)
 * @param {string} agentName
 * @param {string} objectName
 * @return {object} javascript representation of monitoring object
 */

function PromiseResolveWithLatency(data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, 250);
  });
}

function readObjectData(path) {
  const [agentName, ...rest] = path.split('/');
  const objectName = rest.join('/');

  return new Promise((resolve, fail) => {
    // TODO: configure and handle timeout error
    const zeroMQClient = new ZeroMQClient(config.tobject2json.host, config.tobject2json.port, 'req');
    zeroMQClient.on('message', (m) => {
      try {
        resolve(JSON.parse(m));
      } catch(e) {
        // failed to parse
        fail(null);
      }
    });
    zeroMQClient.send(`${agentName} ${objectName}`);
  });
}

// List all object without the data which are heavy
async function listObjects() {
  // first list all agents available
  const agentsQuery = 'select * from information_schema.tables where table_schema = ? and table_name like "data_%"';
  const agentTables = await mySQL.query(agentsQuery, [config.mysql.database]);

  // then list all objects form those agents
  const objectsPromises = agentTables.map((agentTable) => {
    return mySQL.query(`select object_name as name, '${agentTable.TABLE_NAME}' as agent from ${agentTable.TABLE_NAME}`);
  });
  const objectListListRaw = await Promise.all(objectsPromises);

  // Flatten the array of array of raw objects from the database to array of objects
  const objects = objectListListRaw.reduce((result, objectListRaw) => {
    const objectList = objectListRaw.map((objectRaw) => {
      return {name: `${objectRaw.agent.substr(5)}/${objectRaw.name}`, quality: 'good'};
    })
    return result.concat(objectList);
  }, []);

  return objects;
}

function createLayout(layout) {
  return mySQL.query('insert into layout (id, name, owner_id, owner_name, tabs) value (?,?,?,?,?)', [
    layout.id,
    layout.name,
    layout.owner_id,
    layout.owner_name,
    JSON.stringify(layout.tabs)
  ]);
}

async function listLayouts(filter = {}) {
  let request;

  if (filter.owner_id) {
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
 * @return {Layout|null} blabla
 */
function readLayout(layoutName) {
  return mySQL.query('select * from layout where name = ? limit 1', [layoutName]).then((items) => {
    if (items.length === 0) {
      return null;
    }
    const item = items[0]
    item.tabs = JSON.parse(item.tabs);
    return item;
  });
}

function writeLayout(layoutName, data) {
  return mySQL.query('update layout set tabs = ? where name = ?', [JSON.stringify(data.tabs), layoutName]);
}

function deleteLayout(layoutName) {
  return mySQL.query('delete from layout where name = ?', [layoutName]);
}
