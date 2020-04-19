const assert = require('assert');
const sinon = require('sinon');
const ConsulConnector = require('../../lib/ConsulConnector.js');

describe('ConsulConnector test suite', () => {
  describe('Request CRUs tests', async () => {
    let consulService;
    beforeEach(() => consulService = {});
    it('should successfully query host of ConsulLeader', async () => {
      consulService.getConsulLeaderStatus = sinon.stub().resolves('localhost:8500');
      const connector = new ConsulConnector(consulService, 'some/path');
      await connector.testConsulStatus();
    });
    it('should successfully query host of ConsulLeader and fail gracefully', async () => {
      consulService.getConsulLeaderStatus = sinon.stub().rejects('Unable to query Consul');
      const connector = new ConsulConnector(consulService, 'some/path');
      await connector.testConsulStatus();
    });
  });

  describe('Request CRUs tests', async () => {
    let consulService;
    beforeEach(() => {
      consulService = {};
    });
    // it('should successfully query, filter, match and return a list of CRU names', async () => {
    //   const res = {
    //     status: sinon.stub().returns(),
    //     json: sinon.stub(),
    //   };
    //   consulService.getOnlyRawValuesByKeyPrefix = sinon.stub().resolves({
    //     'o2/hardware/flps/flpOne/cards': `{"0": {"type": "CRORC", "pciAddress": "d8:00.0"}}`,
    //     'o2/hardware/flps/flp1/info"': `{0: {"type": "should not be included"}}`
    //   });
    //   const connector = new ConsulConnector(consulService, 'some/path');

    //   await connector.getCRUs(null, res);
    //   const expectedCRUs = {flpOne: {0: {type: 'CRORC', pciAddress: 'd8:00.0'}}};

    //   assert.ok(res.status.calledWith(200));
    //   assert.ok(res.json.calledWith(expectedCRUs));
    // });

    it('should successfully return 404 if consul did not send back any data for specified key', async () => {
      const consulService = {
        getOnlyRawValuesByKeyPrefix: sinon.stub().rejects({message: '404 - Key not found'})
      };
      const connector = new ConsulConnector(consulService, 'some/path');
      const res2 = {
        status: sinon.stub().returns(),
        send: sinon.stub(),
      };
      await connector.getCRUs(null, res2);

      sinon.assert.calledWith(res2.status, 404);
      // sinon.assert.calledWith(res2.send, {message: 'Could not find any Readout Cards by key some/path'});
      // assert.ok(res2.status.calledWith(404));
      console.log('res2.send.getCalls()[0].args[0]')
      console.log(res2.send.getCalls()[0].args[0])
      assert.deepStrictEqual(res2.send.getCalls()[0].args[0], {message: 'Could not find any Readout Cards by key some/path'})
      // assert.ok(res2.send.calledWith({message: 'Could not find any Readout Cards by key some/path'}));
    });

    // it('should successfully return 502 if consul did not respond', async () => {
    //   consulService.getOnlyRawValuesByKeyPrefix = sinon.stub().rejects({message: '502 - Consul unresponsive'});
    //   const connector = new ConsulConnector(consulService, 'some/path');
    //   await connector.getCRUs(null, res);

    //   // sinon.assert.calledWith(res.status, 502);
    //   sinon.assert.calledWith(res.json, {message: '502 - Consul unresponsive'});
    //   // assert.ok(res.status.calledWith(502));
    //   // assert.ok(res.send.calledWith({message: '502 - Consul unresponsive'}));
    // });

    // it('should successfully return error for when ConsulService was not initialized', async () => {
    //   const connector = new ConsulConnector(undefined, 'some/path');
    //   await connector.getCRUs(null, res);

    //   // sinon.assert.calledWith(res.status, 502);
    //   sinon.assert.calledWith(res.json, {message: 'Unable to retrieve configuration of consul service'});

    //   // assert.ok(res.status.calledWith(502));
    //   // assert.ok(res.send.calledWith({message: 'Unable to retrieve configuration of consul service'}));
    // });
  });

  // describe('Request FLPs tests', async () => {
  //   let consulService;
  //   beforeEach(() => {
  //     res = {
  //       status: sinon.stub().returns(),
  //       json: sinon.stub(),
  //     };
  //     consulService = {};
  //   });
  //   it('should successfully query, filter, match and return a list of FLP names', async () => {
  //     consulService.getKeysByPrefix = sinon.stub().resolves([
  //       'o2/hardware/flps/flpOne/cards',
  //       'o2/hardware/flps/flpTwo/info',
  //       'o2/hardware/notanflp/flp2/test',
  //     ]);
  //     const connector = new ConsulConnector(consulService, 'some/path');
  //     await connector.getFLPs(null, res);

  //     assert.ok(res.status.calledWith(200));
  //     assert.ok(res.json.calledWith(['flpOne', 'flpTwo']));
  //   });

  //   it('should successfully return 404 if consul did not send back any data for specified key', async () => {
  //     consulService.getKeysByPrefix = sinon.stub().rejects({message: '404 - Key not found'});
  //     const connector = new ConsulConnector(consulService, 'some/path');
  //     await connector.getFLPs(null, res);

  //     sinon.assert.calledWith(res.status, 404);
  //     sinon.assert.calledWith(res.json, {message: 'Could not find any FLPs by key some/path'});

  //     // assert.ok(res.status.calledWith(404));
  //     // assert.ok(res.send.calledWith({message: 'Could not find any FLPs by key some/path'}));
  //   });

  //   it('should successfully return 502 if consul did not respond', async () => {
  //     consulService.getKeysByPrefix = sinon.stub().rejects({message: '502 - Consul unresponsive'});
  //     const connector = new ConsulConnector(consulService, 'some/path');
  //     await connector.getFLPs(null, res);

  //     // sinon.assert.calledWith(res.status, 502);
  //     sinon.assert.calledWith(res.json, {message: '502 - Consul unresponsive'});

  //     // assert.ok(res.status.calledWith(502));
  //     // assert.ok(res.send.calledWith({message: '502 - Consul unresponsive'}));
  //   });

  //   it('should successfully return error for when ConsulService was not initialized', async () => {
  //     const connector = new ConsulConnector(undefined, 'some/path');
  //     await connector.getFLPs(null, res);

  //     // sinon.assert.calledWith(res.status, 502);
  //     sinon.assert.calledWith(res.json, {message: 'Unable to retrieve configuration of consul service'});

  //     // assert.ok(res.status.calledWith(502));
  //     // assert.ok(res.send.calledWith({message: 'Unable to retrieve configuration of consul service'}));
  //   });
  // });
});
