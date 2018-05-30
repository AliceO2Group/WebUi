const {MySQL} = require('@aliceo2/web-ui');

/**
 * Gateway for all MySQL calls
 */
class MySQLConnector {
  /**
   * Setup MySQL connection
   * @param {Object} config
   */
  constructor(config) {
    if (!config) {
      throw new Error('Empty MySQL config');
    }
    this.config = config;
    this.connection = new MySQL(config);
  }

  /**
   * List all object without the data which are heavy
   * @return {Promise.<Array.<Layout>>}
   */
  async listObjects() {
    // first list all agents available
    const agentsQuery = `select *
                         from information_schema.tables
                         where table_schema = ? and table_name like "data_%"`;
    const agentTables = await this.connection.query(agentsQuery, [this.config.database]);

    // then list all objects form those agents
    const objectsPromises = agentTables.map((agentTable) => {
      return this.connection.query(`select object_name as name, '${agentTable.TABLE_NAME}' as agent
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
  createLayout(layout) {
    const query = 'insert into layout (id, name, owner_id, owner_name, tabs) value (?,?,?,?,?)';
    const args = [
      layout.id,
      layout.name,
      layout.owner_id,
      layout.owner_name,
      JSON.stringify(layout.tabs)
    ];
    return this.connection.query(query, args);
  }

  /**
   * List layouts, can be filtered
   * @param {Object} filter - undefined or {owner_id: XXX}
   * @return {Array<Layout>}
   */
  async listLayouts(filter = {}) {
    let request;

    if (filter.owner_id !== undefined) {
      request = this.connection.query('select * from layout where owner_id = ?', [filter.owner_id]);
    }

    request = this.connection.query('select * from layout');
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
  readLayout(layoutName) {
    return this.connection.query('select * from layout where name = ? limit 1', [layoutName])
      .then((items) => {
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
  writeLayout(layoutName, data) {
    return this.connection.query('update layout set tabs = ? where name = ?',
      [JSON.stringify(data.tabs), layoutName]);
  }

  /**
   * Delete a single layout by its name
   * @param {string} layoutName
   * @return {Object} MySQL request details
   */
  deleteLayout(layoutName) {
    return this.connection.query('delete from layout where name = ?', [layoutName]);
  }
}

module.exports = MySQLConnector;
