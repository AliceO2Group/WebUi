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

const https = require('https');

/**
 * Handles creating JIRA issues
 */
class Jira {
  /**
   * @param {object} config - JIRA configuration including URL, service account and project ID
   */
  constructor(config) {
    this.url = config.url;
    this.serviceUser = config.serviceUser;
    this.servicePass = config.servicePass;
    this.projectId = config.projectId;
    this.issueTypes = {
      bug: 1
    };
  }

  /**
   * Handles HTTP req/rep in order to create JIRA issue
   * @param {object} postData - issue details
   */
  async createIssue(postData) {
    const requestOptions = {
      method: 'POST',
      auth: this.serviceUser + ':' + this.servicePass,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    return new Promise((resolve, reject) => {
      const requestHandler = (response) => { // eslint-disable-line require-jsdoc
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

      const request = https.request(this.url, requestOptions, requestHandler);
      request.on('error', (err) => reject(err));
      request.write(postData);
      request.end();
    });
  }

  /**
   * Creates bug issue
   * @param {string} reporter - reporter of issue
   * @param {string} assignee - asignee of issue
   * @param {string} summary - title of issue
   * @param {string} description - issue description (optional)
   * @return {Promise} - resolve object contains issue ID (id) , key (key) and URL (self)
   */
  async createBugIssue(reporter, assignee, summary, description = '') {
    const issue = JSON.stringify(
      {
        fields: {
          issuetype: {
            id: this.issueTypes.bug
          },
          project: {
            id: this.projectId
          },
          summary: summary,
          description: description,
          reporter: {
            name: reporter
          },
          assignee: {
            name: reporter
          }
        }
      });
    return this.createIssue(issue);
  }
}
module.exports = Jira;
