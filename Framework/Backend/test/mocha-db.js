/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

const MySQL = require('./../db/mysql.js');
const config = require('./../config-default.json');

let db = null;
let skip = true;

describe('MySQL database', () => {
  before(() => {
    if (!config.mysql) {
      skip = true;
    }
    if (!skip) {
      db = new MySQL(config.mysql);
    }
  });

  it('Execute SHOW TABLES query', function(done) {
    if (skip) {
      this.skip(); // eslint-disable-line no-invalid-this
    }
    const query = 'SHOW TABLES';
    const params = [];
    db.query(query, params)
      .then(() => {
        done();
      }, () => {
        throw new Error('Promise rejected');
      });
  });

  after(() => {
    if (!skip) {
      db.close();
    }
  });
});
