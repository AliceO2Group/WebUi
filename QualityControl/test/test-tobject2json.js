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
