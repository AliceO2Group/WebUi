/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

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
}

module.exports = MySQLConnector;
