const config = require('../config.js');
const TObject2JsonClient = require('../lib/TObject2JsonClient.js');
const CCDBConnector = require('../lib/CCDBConnector.js');

const tobject2json = new TObject2JsonClient(config.listingConnector, config.ccdb);
const ccdb = new CCDBConnector(config.ccdb);

let objects = [];

describe('QC CXX module and CCDB test suite', function () {
  it('gets all objects', (done) => {
    ccdb.listObjects().then((result) => {
      objects = result.slice(1, 20);
      done();
    });
  });


  it('treats 1 object', (done) => {
    tobject2json.retrieve(objects[1].name).then(() => {
      done();
    });
  });

  it('treats 20 objects (ASYNC)', (done) => {
    let counter = 1;
    for (const object of objects) {
      tobject2json.retrieve(object.name).then(() => {
        counter++;
        if (counter == objects.length) {
          done();
        }
      });
    }
  }).timeout(30000);

  it('treats 20 objects (SYNC)', async () => {
    for (const object of objects) {
      await tobject2json.retrieve(object.name);
    }
  }).timeout(30000);
});
