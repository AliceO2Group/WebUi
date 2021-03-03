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

/* eslint-disable max-len */

const Jira = require('./../services/jira.js');
const assert = require('assert');
const nock = require('nock');

describe('JIRA service test suite', function() {
  before(nock.activate);
  describe('Check Initialization of JIRA Service', function() {
    it('should throw error due to no config being passed', function() {
      assert.throws(() => {
        new Jira();
      }, new Error('[JIRA] Configuration object cannot be empty'));
    });

    it('should throw error due to empty JIRA URL', function() {
      assert.throws(() => {
        new Jira({});
      }, new Error('[JIRA] URL must be defined'));
    });

    it('should throw error due to empty service account', function() {
      assert.throws(() => {
        new Jira({url: 'https://localhost', serviceAccount: {}});
      }, new Error('[JIRA] Service account must be defined'));
    });

    it('should throw error due to missing password of service account', function() {
      assert.throws(() => {
        new Jira({url: 'https://localhost', serviceAccount: {user: 'test'}});
      }, new Error('[JIRA] Service account must be defined'));
    });

    it('should throw error due to missing project ID', function() {
      assert.throws(() => {
        new Jira({url: 'https://localhost', serviceAccount: {user: 'test', pass: 'test'}});
      }, new Error('[JIRA] Project ID must be defined'));
    });

    it('should successfully create a JIRA service', function() {
      const jira = new Jira({url: 'https://localhost:8443', serviceAccount: {user: 'test', pass: 'test'}, projectId: 1});
      assert.strictEqual(jira.url, 'https://localhost:8443');
      assert.deepStrictEqual(jira.projectId, 1);
    });
  });

  describe('Check creating bug issue', function() {
    const jira = new Jira({url: 'https://localhost:8443/jira/rest/api/2/issue', serviceAccount: {user: 'test', pass: 'test'}, projectId: 1});

    it('should successfully create a ticket', () => {
      nock('https://localhost:8443')
        .post('/jira/rest/api/2/issue')
        .basicAuth({user: 'test', pass: 'test'})
        .reply(200, '{"key":"OPRO-123", "self":"https://localhost:8443/jira/OPRO-123", "id":1234}');
      return jira.createBugIssue('alice', 'bob', 'Run fails').then((res) => {
        assert.deepStrictEqual(res.key, 'OPRO-123');
      });
    });

    it('should reject with error if is unable to parse response', async () => {
      nock('https://localhost:8443')
        .post('/jira/rest/api/2/issue')
        .reply(200, 'Not a JSON response');
      return assert.rejects(async () => {
        await jira.createBugIssue('alice', 'bob', 'Run fails');
      }, new Error('Unable to parse JSON'));
    });

    it('should reject with error if server replies with 401', async () => {
      nock('https://localhost:8443')
        .post('/jira/rest/api/2/issue')
        .reply(401, 'Unauthorised');
      return assert.rejects(async () => {
        await jira.createBugIssue('alice', 'bob', 'Run fails');
      }, new Error('Non-2xx status code: 401'));
    });

    it('should reject with error if missing arguments', (done) => {
      jira.createBugIssue('alice', 'bob')
        .catch(() => done());
    });
  });
});
