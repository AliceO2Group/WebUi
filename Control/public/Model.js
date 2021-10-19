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

/* global COG */

// Import frontend framework
import {Observable, WebSocketClient, QueryRouter, Loader, sessionService} from '/js/src/index.js';
import {Notification as O2Notification} from '/js/src/index.js';
import Lock from './lock/Lock.js';
import Environment from './environment/Environment.js';
import FrameworkInfo from './frameworkinfo/FrameworkInfo.js';
import Workflow from './workflow/Workflow.js';
import Task from './task/Task.js';
import Config from './configuration/ConfigByCru.js';
import DetectorService from './services/DetectorService.js';

/**
 * Root of model tree
 * Handle global events: keyboard, websocket and router location change
 */
export default class Model extends Observable {
  /**
   * Load all sub-models and bind event handlers
   */
  constructor() {
    super();

    this.session = sessionService.get();
    this.session.personid = parseInt(this.session.personid, 10); // cast, sessionService has only strings
    this.session.access = parseInt(this.session.access, 10);

    this.loader = new Loader(this);
    this.loader.bubbleTo(this);

    this.lock = new Lock(this);
    this.lock.bubbleTo(this);

    this.configuration = new Config(this);
    this.configuration.bubbleTo(this);

    this.environment = new Environment(this);
    this.environment.bubbleTo(this);

    this.workflow = new Workflow(this);
    this.workflow.bubbleTo(this);

    this.task = new Task(this);
    this.task.bubbleTo(this);

    this.frameworkInfo = new FrameworkInfo(this);
    this.frameworkInfo.bubbleTo(this);

    // Setup router
    this.router = new QueryRouter();
    this.router.observe(this.handleLocationChange.bind(this));
    this.router.bubbleTo(this);

    // services
    this.detectors = new DetectorService(this);

    this.notification = new O2Notification(this);
    this.notification.bubbleTo(this);

    // Setup WS connection
    this.ws = new WebSocketClient();
    this.ws.addListener('command', this.handleWSCommand.bind(this));
    this.ws.addListener('close', this.handleWSClose.bind(this));

    // Load some initial data
    this.lock.synchronizeState();

    // General visuals
    this.accountMenuEnabled = false;
    this.sideBarMenu = true;

    this.init();
  }

  /**
   * If no detector view is selected:
   * * load a list of detectors
   * * wait for user to make their selection
   */
  async init() {
    if (!this.router.params.page) {
      // if page is loaded as host:port only, a default route has to be passed
      this.router.go('?page=environments');
    }
    await this.detectors.init();
    if (this.detectors.selected) {
      this.handleLocationChange();
    }
    this.notify();
  }

  /**
   * Delegates sub-model actions depending on incoming command from server
   * @param {WebSocketMessage} message
   */
  handleWSCommand(message) {
    if (message.command === 'padlock-update') {
      this.lock.setPadlockState(message.payload);
      return;
    } else if (message.command === 'notification') {
      this.showNativeNotification(JSON.parse(message.payload));
      return;
    } else if (message.command === 'clean-resources-action') {
      this.task.setResourcesRequest(message.payload);
    } else if (message.command === 'o2-roc-config') {
      this.configuration.setConfigurationRequest(message.payload);
    }
  }

  /**
   * Handle close event from WS when connection has been lost (server restart, etc.)
   * * Releases the lock if taken
   * * Displays informative message to the client
   * * Retries to connect to server every 10 seconds; If successful, informs de user
   */
  handleWSClose() {
    clearInterval(this.task.refreshInterval);
    clearInterval(this.environment.refreshInterval);

    this.notification.show(`Connection to server has been lost. Retrying to connect in 10 seconds...`, 'danger', 10000);

    this.frameworkInfo.setWsInfo({
      status: {ok: false, configured: true, message: 'Cannot establish connection to server'}});

    const wsReconnectInterval = setInterval(() => {
      // Setup WS connection
      try {
        this.ws = new WebSocketClient();
        this.ws.addListener('command', this.handleWSCommand.bind(this));
        this.ws.addListener('close', this.handleWSClose.bind(this));
        clearInterval(wsReconnectInterval);
        this.frameworkInfo.setWsInfo({status: {ok: true, configured: true}, message: 'WebSocket connection is alive'});
        this.notification.show(`Connection to server has been restored`, 'success', 3000);
      } catch (error) {
        console.error(error);
      }
    }, 10000);
  }

  /**
   * Delegates sub-model actions depending new location of the page
   */
  handleLocationChange() {
    clearInterval(this.task.refreshInterval);
    clearInterval(this.environment.refreshInterval);
    switch (this.router.params.page) {
      case 'environments':
        this.environment.getEnvironments();
        this.environment.refreshInterval = setInterval(() => this.environment.getEnvironments(), COG.REFRESH_ENVS);
        break;
      case 'environment':
        if (!this.router.params.id) {
          this.notification.show('The id in URL is missing, going to list instead', 'warning');
          this.router.go('?page=environments');
          return;
        }
        this.environment.getEnvironment({id: this.router.params.id});
        break;
      case 'newEnvironment':
        this.workflow.initWorkflowPage();
        break;
      case 'taskList':
        this.task.getTasks();
        break;
      case 'about':
        this.frameworkInfo.getFrameworkInfo();
        break;
      case 'configuration':
        this.configuration.init();
        this.configuration.getCRUsConfig();
        break;
      default:
        this.router.go('?page=environments');
        break;
    }
  }

  /**
   * Toggle account menu dropdown
   */
  toggleAccountMenu() {
    this.accountMenuEnabled = !this.accountMenuEnabled;
    this.notify();
  }

  /**
   * Toggles the sidebar size
   * * minimal - icons only
   * * normal - icons + text
   */
  toggleSideBarMenu() {
    this.sideBarMenu = !this.sideBarMenu;
    this.notify();
  }

  /**
   * Update detector selection view
   * @param {String} detector
   * @returns {vnode}
   */
  setDetectorView(detector) {
    this.detectors.saveSelection(detector);
    this.handleLocationChange();
    this.notify();
  }

  /**
   * Reset detector view by:
   * * removing current selection
   * * retrieving a list of detectors
   * * opening modal and allowing the user to make a new selection
   */
  async resetDetectorView() {
    this.detectors.saveSelection('');
    this.notify();
    if (!this.detectors.listRemote.isSuccess() || !this.detectors.hostsByDetectorRemote.isSuccess()) {
      await this.detectors.init();
      this.notify();
    }
  }

  /**
   * Display a browser notification(Notification - Web API)
   * @param {String} message
   */
  showNativeNotification(message) {
    const notification = new Notification(message.title, {body: message.body, icon: '/o2_icon.png'});
    notification.onclick = function(event) {
      event.preventDefault();
      window.open(message.url, '_blank');
    }
  }

  /**
   * After pages load check if the user enabled notifications
   */
  checkBrowserNotificationPermissions() {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }
}
