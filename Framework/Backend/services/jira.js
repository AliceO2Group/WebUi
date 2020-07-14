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

const http = require('http');
const querystring = require('querystring');

/**
 * Handles creating JIRA issues
 */
class Jira {

  constructor(config) {
    this.hostname = 'alice.its.cern.ch'
    this.path = '/jira/rest/api/2/issue'
    this.auth = 'user:pass'
  }

  async createIssue() {
    const postData = querystring.stringify({
    "fields": {
      "issuetype": {
        "id": "1"
      },
      "project": {
        "id": "11400"
      },
      "description": "Order entry fails when selecting supplier.",
        "reporter": {
        "name": "awegrzyn"
      },
      "assignee": {
        "name": "awegrzyn"
      }
    }
    });

    const requestOptions = {
      hostname: this.hostname,
      port: 80,
      path: this.path,
      method: 'POST',
      auth: this.auth,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    return new Promise((resolve, reject) => {
      const requestHandler = (response) => {
        if (response.statusCode < 200 || response.statusCode > 299) {
          reject(new Error('Non-2xx status code: ' + response.statusCode));
          return;
        }
        const bodyChunks = [];
        response.on('data', (chunk) => bodyChunks.push(chunk));
        response.on('end', () => {
          try {
            const body = JSON.parse(bodyChunks.join(''));
            resolve(body);
          } catch (e) {
            reject(new Error('Unable to parse JSON'));
          }
        });
      };

      const request = http.request(requestOptions, requestHandler);
      request.on('error', (err) => reject(err));
      request.write(postData);
      request.end();
    });
  }
}
module.exports = Jira;

const jira = new Jira();
jira.createIssue();
