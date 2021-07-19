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

const assert = require('assert');
const path = require('path');
const {WebSocketMessage} = require('@aliceo2/web-ui');
const log = new (require('@aliceo2/web-ui').Log)('Control');
const {errorHandler, errorLogger} = require('./../utils.js');

/**
 * Gateway for all AliECS - Core calls
 */
class ControlService {
  /**
   * Constructor initializing dependencies
   * @param {Padlock} padLock
   * @param {ControlProxy} ctrlProx
   * @param {WebSocket} webSocket
   * @param {ConsulConnector} consulConnector
   * * @param {JSON} coreConfig
   */
  constructor(padLock, ctrlProx, consulConnector, coreConfig) {
    assert(padLock, 'Missing PadLock dependency');
    assert(ctrlProx, 'Missing ControlProxy dependency');
    this.padLock = padLock;
    this.ctrlProx = ctrlProx;
    this.consulConnector = consulConnector;
    this.coreConfig = coreConfig;
  }

  /**
   * Set websocket after server initialization
   * @param {WebSocket} webSocket 
   */
  setWS(webSocket) {
    this.webSocket = webSocket;
  }

  /**
   * Method to handle the request of cleaning O2 resources
   * * subscribes and listens to AliECS stream with channelId so that updates
   * are sent via WebSocket
   * * requests the creation of a new auto env
   * * replies to the initial request of clean
   * @param {Request} req 
   * @param {Response} res 
   */
  async cleanResources(req, res) {
    const channelId = req.body.channelId;
    const method = 'NewAutoEnvironment';
    if (this.isLockSetUp(method, req, res) && this.isConnectionReady(res)) {
      const type = req.body.type ? ` (${req.body.type})` : '';
      log.info(`[ControlService] ${req.session.personid} => ${method} ${type}`);

      try {
        const hosts = await this.consulConnector.getFLPsList();
        const {repos: repositories} = await this.ctrlProx['ListRepos']();
        const {name: repositoryName, defaultRevision} = repositories.find((repository) => repository.default);
        const cleanChanel = this.ctrlProx.client['Subscribe']({id: channelId})
        cleanChanel.on('data', (data) => this.onData(channelId, 'clean-resources-action', data));
        cleanChanel.on('error', (err) => this.onError(channelId, 'clean-resources-action', err));
        // onEnd gets called no matter what
        // cleanChanel.on('end', () => this.onEnd(channelId));

        // Make request to clear resources
        const coreConf = {
          id: channelId,
          vars: {hosts: JSON.stringify(hosts)},
          workflowTemplate: path.join(repositoryName, `workflows/resources-cleanup@${defaultRevision}`)
        };
        await this.ctrlProx[method](coreConf);
        res.status(200).json({
          ended: false, success: true, id: channelId,
          info: {message: 'Request for "Cleaning Resources" was successfully sent and in progress'}
        })
      } catch (error) {
        // Failed to getFLPs, ListRepos or NewAutoEnvironment
        errorLogger(error);
        res.status(502).json({
          ended: true, success: false, id: channelId,
          message: 'Error while attempting to clean resources ...',
          info: {message: error.message || error || 'Error while attempting to clean resources ...'}
        });
      }
    }
  }

  /**
   * Method to handle the request of creating a new Auto Environment
   * * subscribes and listens to AliECS stream with channelId so that updates
   * are sent via WebSocket
   * * requests the creation of a new auto env
   * * replies to the initial request
   * @param {Request} req
   * @param {Response} res
   */
  async createAutoEnvironment(req, res) {
    const channelId = req.body.channelId;
    const hosts = req.body.hosts;
    if (!channelId) {
      res.status(502).json({
        ended: true, success: false, id: channelId,
        message: 'Channel ID should be provided'
      });
    } else if (!hosts || hosts.length === 0) {
      res.status(502).json({
        ended: true, success: false, id: channelId,
        message: 'List of Hosts should be provided'
      });
    } else {
      const operation = 'o2-roc-config';
      const method = 'NewAutoEnvironment';
      if (this.isLockSetUp(method, req, res) && this.isConnectionReady(res)) {
        const type = req.body.type ? ` (${req.body.type})` : '';
        log.info(`[ControlService] ${req.session.personid} => ${method} ${type} o2-roc-config`);

        try {
          const {repos: repositories} = await this.ctrlProx['ListRepos']();
          const {name: repositoryName, defaultRevision} = repositories.find((repository) => repository.default);
          if (!defaultRevision) {
            throw new Error(`Unable to find a default revision for repository: ${repositoryName}`);
          }

          // Setup Stream Channel
          const cleanChanel = this.ctrlProx.client['Subscribe']({id: channelId})
          cleanChanel.on('data', (data) => this.onData(channelId, operation, data));
          cleanChanel.on('error', (err) => this.onError(channelId, operation, err));
          // onEnd gets called no matter what
          // cleanChanel.on('end', () => this.onEnd(channelId));

          // Make request to clear resources
          const coreConf = {
            id: channelId,
            vars: {hosts: JSON.stringify(hosts)},
            workflowTemplate: path.join(repositoryName, `workflows/${operation}@${defaultRevision}`),
          };
          await this.ctrlProx[method](coreConf);
          res.status(200).json({
            ended: false, success: true, id: channelId,
            info: {message: 'Request for "o2-roc-config" was successfully sent and is now in progress'}
          })
        } catch (error) {
          // Failed to getFLPs, ListRepos or NewAutoEnvironment
          errorLogger(error);
          res.status(502).json({
            ended: true, success: false, id: channelId,
            message: error.message || error || 'Error while attempting to run o2-roc-config ...',
            info: {message: error.message || error || 'Error while attempting to run o2-roc-config ...'}
          });
        }
      }
    }
  }

  /**
   * Method to execute command contained by req.path and send back results
   * @param {Request} req
   * @param {Response} res
   */
  executeCommand(req, res) {
    const method = this.parseMethodNameString(req.path);
    if (this.isConnectionReady(res) && this.isLockSetUp(method, req, res)) {
      if (!method.startsWith('Get')) {
        const type = req.body.type ? ` (${req.body.type})` : '';
        log.info(`[ControlService] ${req.session.personid} => ${method} ${type}`, 6);
      }
      this.ctrlProx[method](req.body)
        .then((response) => res.json(response))
        .catch((error) => errorHandler(error, res, 504));
    }
  }

  /**
   * Method to execute specified command return results
   * @return {Promise}
   */
  async getAliECSInfo() {
    const method = this.parseMethodNameString('GetFrameworkInfo');
    if (this.ctrlProx?.connectionReady) {
      const response = await this.ctrlProx[method]();
      response.version = this.parseAliEcsVersion(response.version);
      return response;
    } else {
      let error = 'Could not establish connection to AliECS Core';
      if (this.ctrlProx.connectionError && this.ctrlProx.connectionError.message) {
        error = this.ctrlProx.connectionError.message;
      }
      throw new Error(error);
    }
  }

  /**
   * Request information about the integrated services from AliECS Core
   * @return {Promise}
   */
  async getIntegratedServicesInfo() {
    const method = this.parseMethodNameString('GetIntegratedServices');
    if (this.ctrlProx?.connectionReady) {
      const response = await this.ctrlProx[method]();
      return response;
    } else {
      let error = 'Could not establish connection to AliECS Core';
      if (this.ctrlProx.connectionError && this.ctrlProx.connectionError.message) {
        error = this.ctrlProx.connectionError.message;
      }
      throw new Error(error);
    }
  }

  /**
  * Method to check provided options for command and execute it through AliECS-Core
  * @param {Request} req
  * @param {Response} res
  */
  executeRocCommand(req, res) {
    res.status(502);
    res.send({message: 'ROC-CONFIG - not supported yet'});
  }

  /**
   * Method to check if control-core connection is up and running
   * @param {Response} res
   * @return {boolean}
   */
  isConnectionReady(res) {
    if (!this.ctrlProx.connectionReady) {
      let error = 'Could not establish connection to AliECS Core';
      if (this.ctrlProx.connectionError && this.ctrlProx.connectionError.message) {
        error = this.ctrlProx.connectionError.message;
      }
      errorHandler(error, res, 503);
      return false;
    }
    return true;
  }

  /**
   * Method to check if lock is needed and if yes acquired
   * @param {string} method
   * @param {Request} req
   * @param {Response} res
   * @return {boolean}
   */
  isLockSetUp(method, req, res) {
    // disallow 'not-Get' methods if not owning the lock
    if (!method.startsWith('Get') && method !== 'ListRepos') {
      if (this.padLock.lockedBy == null) {
        errorHandler(`Control is not locked`, res, 403);
        return false;
      }
      if (req.session.personid != this.padLock.lockedBy) {
        errorHandler(`Control is locked by ${this.padLock.lockedByName}`, res, 403);
        return false;
      }
    }
    return true;
  }

  /**
   * Helpers
   */

  /**
   * Method to remove `/` if exists from method name
   * @param {string} method
   * @return {string}
   */
  parseMethodNameString(method) {
    if (method && method.indexOf('/') === 0) {
      return method.substring(1, method.length);
    } else {
      return method;
    }
  }

  /**
   * Parse the JSON of the version and return it as a string
   * @param {JSON} versionJSON
   * @return {string}
   */
  parseAliEcsVersion(versionJSON) {
    let version = '';
    if (versionJSON.productName) {
      version += versionJSON.productName;
    }
    if (versionJSON.versionStr) {
      version += ' ' + versionJSON.versionStr;
    }
    if (versionJSON.build) {
      version += ' (revision ' + versionJSON.build + ')';
    }
    return version;
  }

  /**
   * Deal with incoming message from AliECS Core Stream
   * Method will react only to messages that contain an EnvironmentEvent
   * @param {string} channelId - to distinguish to which client should this message be sent
   * @param {string} command
   * @param {Event} data - AliECS Event (proto)
   */
  onData(channelId, command, data) {
    if (data.taskEvent && data.taskEvent.status === 'TASK_FAILED') {
      const msg = new WebSocketMessage();
      msg.command = command;
      msg.payload = {
        ended: false, success: false, id: channelId, type: 'TASK',
        info: {host: data.taskEvent.hostname, id: data.taskEvent.taskid},
      };
      this.webSocket.broadcast(msg);
    }
    if (data.environmentEvent) {
      const msg = new WebSocketMessage();
      msg.command = command;

      if (!data.environmentEvent.error) {
        msg.payload = {
          ended: data.environmentEvent.state === 'DONE' ? true : false,
          success: true, id: channelId, type: 'ENV',
          info: {message: data.environmentEvent.message || 'Executing ...'}
        };
      } else {
        msg.payload = {
          ended: true, success: false, id: channelId, type: 'ENV',
          info: {message: data.environmentEvent.error || `Failed operation: ${command} ...`}
        };
      }
      this.webSocket.broadcast(msg);
    }
  }

  /**
   * Deal with incoming error message from AliECS Core Stream
   * @param {string} channelId - to distinguish to which client should this message be sent
   */
  onError(channelId, command, error) {
    const msg = new WebSocketMessage();
    msg.command = command;
    msg.payload = {
      ended: true, success: false, id: channelId,
      info: {message: `"${command}" action failed due to ${error.toString()}`}
    };
    errorLogger(error);
    this.webSocket.broadcast(msg);
  }
}

module.exports = ControlService;
