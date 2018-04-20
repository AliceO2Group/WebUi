const MySQL = require('./../db/mysql.js');
const config = require('./../config-default.json');

let db = null;
let skip = false;

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
