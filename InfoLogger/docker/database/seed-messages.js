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

const mariadb = require('mariadb');
const rawFakeData = require('../../test/fake-data/fakeData.json');
const { shuffle } = require('../../test/utils/utils.js');

const fakeData = shuffle([...rawFakeData]);

const COLUMNS = [
  'severity',
  'level',
  'timestamp',
  'hostname',
  'rolename',
  'pid',
  'username',
  'system',
  'facility',
  'detector',
  'partition',
  'dest',
  'run',
  'errcode',
  'errline',
  'errsource',
  'message',
];

const INSERT_QUERY = `INSERT INTO messages (${COLUMNS.map((column) => `\`${column}\``).join(', ')}) `
  + `VALUES (${COLUMNS.map(() => '?').join(', ')})`;

// Slides the whole batch forward so it ends at the current time
const REDATE_QUERY = 'UPDATE messages SET `timestamp` = `timestamp` + ?';

const CONNECTION_ATTEMPTS = 10;
const CONNECTION_RETRY_MS = 2000;

const config = {
  host: process.env.MYSQL_HOST ?? 'localhost',
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER ?? 'root',
  password: process.env.MYSQL_PASSWORD ?? 'root',
  database: process.env.MYSQL_DATABASE ?? 'INFOLOGGER',
  connectionLimit: 1,
};

/**
 * Grab a connection from the pool, retrying while the database is still starting up.
 * @param {object} pool - the mariadb pool to take the connection from
 * @returns {Promise<object>} an open connection
 */
async function connectWithRetry(pool) {
  for (let attempt = 1; attempt <= CONNECTION_ATTEMPTS; attempt++) {
    try {
      return await pool.getConnection();
    } catch (error) {
      if (attempt === CONNECTION_ATTEMPTS) {
        throw error;
      }
      console.log(`${new Date().toISOString()} [InfoLogger Seeder] Database not ready (attempt ${attempt}/${CONNECTION_ATTEMPTS}), retrying...`);
      await new Promise((resolve) => setTimeout(resolve, CONNECTION_RETRY_MS));
    }
  }
}

/**
 * Build the rows to insert, evenly spread over the faked time span, oldest first.
 * @returns {Array<Array>} one array of column values per message
 */
function buildRows() {
  const messagesPerSecond = 1;
  const numberOfSecondsToSpan = 2 * 24 * 3600; // 2 days
  const start = Date.now() / 1000 - numberOfSecondsToSpan;
  const totalMessages = messagesPerSecond * numberOfSecondsToSpan;

  return Array.from({ length: totalMessages }, (_, i) => {
    const timestamp = start + i / messagesPerSecond;
    const data = fakeData[i % fakeData.length];

    return COLUMNS.map((column) => column === 'timestamp' ? timestamp : data[column] ?? null);
  });
}

/**
 * Insert the batch of fake messages, or just re-date it when a previous run already inserted it
 * @returns {Promise<void>} resolved once the database has been seeded
 */
async function seed() {
  const pool = mariadb.createPool(config);
  let connection;
  try {
    connection = await connectWithRetry(pool);

    const [{ newest }] = await connection.query('SELECT MAX(`timestamp`) AS newest FROM messages;');

    if (newest === null || newest === undefined) {
      const rows = buildRows();
      console.log(`${new Date().toISOString()} [InfoLogger Seeder] Inserting ${rows.length} messages.`);
      await connection.batch(INSERT_QUERY, rows);
    } else {
      console.log(`${new Date().toISOString()} [InfoLogger Seeder] Re-dating the existing messages.`);
      await connection.query(REDATE_QUERY, [Date.now() / 1000 - newest]);
    }

    console.log(`${new Date().toISOString()} [InfoLogger Seeder] Seeding completed successfully!`);
  } finally {
    connection?.release();
    await pool.end();
  }
}

seed().catch((error) => {
  console.error(`${new Date().toISOString()} [InfoLogger Seeder] Error seeding database:`, error);
  process.exit(1);
});
