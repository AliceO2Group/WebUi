const MySQL = require('./../db/mysql.js');
const chai = require('chai');
const assert = chai.assert;
const config = require('./../config.json');
const log = require('./../log.js');

let db = null;

describe('Test simple selection', function() {
  before(() => {
    db = new MySQL(config.mysql);
  });
  it('Select count', function() {
    const query = "SELECT count(*) FROM ??";
    const params = ['messages'];
      db.query(query, params)
        .then(() => {
          console.log('ok');
        }, () => {
          throw new Error('Promise rejected');
        });
  });

  after(function() {
    db.close();
  });
});
