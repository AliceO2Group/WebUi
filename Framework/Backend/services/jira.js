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

const https = require('https');
const Log = require('./../log/Log.js');

/**
 * Handles creating JIRA issues
 */
class Jira {
  /**
   * @param {object} config - JIRA configuration including URL, service account and project ID
   */
  constructor(config) {
    if (!config) {
      throw new Error('Configuration object cannot be empty');
    }
    if (!config.url) {
      throw new Error('URL must be defined');
    }
    if (!config.serviceAccount || !config.serviceAccount.user || !config.serviceAccount.pass) {
      throw new Error('Service account must be defined');
    }
    if (!config.projectId) {
      throw new Error('Project ID must be defined');
    }

    this.url = config.url;
    this.accountUser = config.serviceAccount.user;
    this.accountPass = config.serviceAccount.pass;
    this.projectId = config.projectId;
    this.issueTypes = {
      bug: 1
    };

    this.log = new Log(`${process.env.npm_config_log_label ?? 'framework'}/jira`);
  }

  /**
   * Handles HTTP req/res in order to create JIRA issue
   * @param {string} postData - issue details
   */
  async createIssue(postData) {
    const requestOptions = {
      method: 'POST',
      auth: this.accountUser + ':' + this.accountPass,
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
   * @param {string} reporter - reporter of issue as NICE login
   * @param {string} assignee - asignee of issue as NICE login
   * @param {string} summary - title of issue
   * @param {string} description - issue description (optional)
   * @return {Promise} - resolve object contains issue ID (id) , key (key) and URL (self)
   */
  async createBugIssue(reporter, assignee, summary, description = '') {
    if (!reporter || !assignee || !summary) {
      this.log.warn('Creating bug issue failed: undefined arguments');
      return Promise.reject(new Error('Invalid parameters passed'));
    }
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
            name: assignee
          }
        }
      });
    return this.createIssue(issue);
  }
}
module.exports = Jira;
