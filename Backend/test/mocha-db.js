const MySQL = require('./../db/mysql.js');
const config = require('./../config.json');

let db = null;

describe('MySQL database', () => {
  before(() => {
    db = new MySQL(config.mysql);
  });
  it('Execute SHOW TABLES query', (done) => {
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
    db.close();
  });
});
