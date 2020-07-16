/* eslint-disable max-len */
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

const Jira = require('./../services/jira.js');
const config = require('./test-config.js');
const assert = require('assert');
const nock = require('nock');


describe('JIRA service test suite', function() {
  describe('Check Initialization of ConsulService', function() {
    it('should throw error due to no config being passed', function() {
      assert.throws(() => {
        new Jira();
      }, new Error('Configuration object cannot be empty'));
    });

    it('should throw error due to empty JIRA URL', function() {
      assert.throws(() => {
        new Jira({});
      }, new Error('JIRA URL must be defined'));
    });

    it('should throw error due to empty service account', function() {
      assert.throws(() => {
        new Jira({url: 'localhost', serviceAccount: {}});
      }, new Error('Service account for JIRA must be defined'));
    });

    it('should throw error due to missing password of service account', function() {
      assert.throws(() => {
        new Jira({url: 'localhost', serviceAccount: {user: 'test'}});
      }, new Error('Service account for JIRA must be defined'));
    });

    it('should successfully create a JIRA service', function() {
      const jira = new Jira({url: 'localhost', serviceAccount: {user: 'test', pass: 'test'}, projectId: 0});
      assert.deepStrictEqual(jira.url, 'localhost');
      assert.deepStrictEqual(jira.projectId, 0);
    });
  });

  describe('Check creating bug issue', function() {
    const jira = new Jira({url: 'http://localhost/jira/rest/api/2/issue', serviceAccount: {user: 'test', pass: 'test'}, projectId: 0});

    it('should successfully create a ticket', () => {
      nock('https://localhost')
        .post('/jira/rest/api/2/issue')
        .reply(200, '{"key":"OPRO-123", "self":"https://localhost/jira/OPRO-123", "id":1234}');
      return jira.createBugIssue('alice', 'bob', 'Run fails').then((res) => {assert.deepStrictEqual(res.key, 'OPRO-123')});
    });

    it('should reject with error if is unable to parse response', async () => {
      nock('https://localhost')
        .post('/jira/rest/api/2/issue')
        .reply(200, 'Not a JSON resposne');
      return assert.rejects(async () => {
        await jira.createBugIssue('alice', 'bob', 'Run fails');
      }, new Error('Unable to parse JSON'));
    });

    it('should reject with error if server replies with 401', async () => {
      nock('https://localhost')
        .post('/jira/rest/api/2/issue')
        .reply(401, 'Unauthorised');
      return assert.rejects(async () => {
        await jira.createBugIssue('alice', 'bob', 'Run fails');
      }, new Error('Non-2xx status code: 401'));
    });

    it('should reject with error if missing arguments', (done) => {
        jira.createBugIssue('alice', 'bob')
         .then((resp) => console.log(resp))
         .catch((err) => done());
    });
  });
});
