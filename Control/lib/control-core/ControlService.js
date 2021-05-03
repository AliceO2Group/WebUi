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
        cleanChanel.on('data', (data) => this.onData(channelId, data));
        cleanChanel.on('error', (err) => this.onError(channelId, err));
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
          message: 'Request for "Cleaning Resources" was successfully sent and in progress'
        })
      } catch (error) {
        // Failed to getFLPs, ListRepos or NewAutoEnvironment
        errorLogger(error);
        res.status(502).json({
          ended: true, success: false, id: channelId,
          message: error.message || error || 'Error while attempting to clean resources ...'
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

    //get list of FLPs from Consul
    const method = 'NewAutoEnvironment';
    if (this.isLockSetUp(method, req, res) && this.isConnectionReady(res)) {
      const type = req.body.type ? ` (${req.body.type})` : '';
      log.info(`[ControlService] ${req.session.personid} => ${method} ${type}`);

      try {
        const hosts = await this.consulConnector.getFLPsList();
        const {repos: repositories} = await this.ctrlProx['ListRepos']();
        const {name: repositoryName, defaultRevision} = repositories.find((repository) => repository.default);
        const cleanChanel = this.ctrlProx.client['Subscribe']({id: channelId})
        cleanChanel.on('data', (data) => this.onData(channelId, data));
        cleanChanel.on('error', (err) => this.onError(channelId, err));
        // onEnd gets called no matter what
        // cleanChanel.on('end', () => this.onEnd(channelId));

        // Make request to clear resources
        const coreConf = {
          id: channelId,
          vars: {
            hosts: JSON.stringify(hosts),
            roc_config_uri_enabled: 'true',
          },
          workflowTemplate: path.join(repositoryName, `workflows/o2-roc-config@${defaultRevision}`),
        };
        await this.ctrlProx[method](coreConf);
        res.status(200).json({
          ended: false, success: true, id: channelId,
          message: 'Request for "Cleaning Resources" was successfully sent and in progress'
        })
      } catch (error) {
        // Failed to getFLPs, ListRepos or NewAutoEnvironment
        errorLogger(error);
        res.status(502).json({
          ended: true, success: false, id: channelId,
          message: error.message || error || 'Error while attempting to clean resources ...'
        });
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
   * @param {String} path
   * @return {Promise}
   */
  getAliECSInfo() {
    return new Promise((resolve, reject) => {
      const method = this.parseMethodNameString('GetFrameworkInfo');
      if (this.ctrlProx.connectionReady) {
        this.ctrlProx[method]()
          .then((response) => {
            response.version = this.parseAliEcsVersion(response.version);
            resolve(response);
          })
          .catch((error) => reject(new Error(error)));
      } else {
        let error = 'Could not establish connection to AliECS Core';
        if (this.ctrlProx.connectionError && this.ctrlProx.connectionError.message) {
          error = this.ctrlProx.connectionError.message;
        }
        reject(new Error(error));
      }
    });
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
   * @param {Event} data - AliECS Event (proto)
   */
  onData(channelId, data) {
    if (data.environmentEvent) {
      const msg = new WebSocketMessage();
      msg.command = 'clean-resources-action';
      if (!data.environmentEvent.error) {
        msg.payload = {
          ended: data.environmentEvent.state === 'DONE' ? true : false,
          success: true, id: channelId,
          message: data.environmentEvent.message || 'Cleaning Resources ...'
        };
      } else {
        msg.payload = {
          ended: true, success: false, id: channelId,
          message: data.environmentEvent.error || 'Failed to clean resources ...'
        };
      }
      this.webSocket.broadcast(msg);
    }
  }

  /**
   * Deal with incoming error message from AliECS Core Stream
   * @param {string} channelId - to distinguish to which client should this message be sent
   */
  onError(channelId, error) {
    const msg = new WebSocketMessage();
    msg.command = 'clean-resources-action';
    msg.payload = {
      ended: true, success: false, id: channelId,
      message: `"Clean Resources" action failed due to ${error.toString()}`,
    };
    errorLogger(error);
    this.webSocket.broadcast(msg);
  }
}

module.exports = ControlService;
