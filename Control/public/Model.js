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

// Import frontend framework
import {Observable, WebSocketClient, QueryRouter, Loader, sessionService} from '/js/src/index.js';
import {Notification as O2Notification} from '/js/src/index.js';
import Lock from './lock/Lock.js';
import Environment from './environment/Environment.js';
import FrameworkInfo from './frameworkinfo/FrameworkInfo.js';
import Workflow from './workflow/Workflow.js';
import Task from './task/Task.js';
import Config from './configuration/ConfigByCru.js';

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

    this.notification = new O2Notification(this);
    this.notification.bubbleTo(this);
    this.checkBrowserNotificationPermissions();

    // Setup router
    this.router = new QueryRouter();
    this.router.observe(this.handleLocationChange.bind(this));
    this.router.bubbleTo(this);
    this.handleLocationChange(); // Init first page

    // Setup WS connexion
    this.ws = new WebSocketClient();
    this.ws.addListener('command', this.handleWSCommand.bind(this));
    this.ws.addListener('close', this.handleWSClose.bind(this));

    // Load some initial data
    this.lock.synchronizeState();

    this.accountMenuEnabled = false;
    this.sideBarMenu = true;
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
      this.show(message.payload);
      return;
    } else if (message.command === 'clean-resources-action') {
      this.task.setResourcesRequest(message.payload);
    } else if (message.command === 'o2-roc-config') {
      this.configuration.setConfigurationRequest(message.payload);
    }
  }

  /**
   * Handle close event from WS when connection has been lost (server restart, etc.)
   */
  handleWSClose() {
    this.notification.show(`Connection to server has been lost, please reload the page.`, 'danger', Infinity);
  }

  /**
   * Delegates sub-model actions depending new location of the page
   */
  handleLocationChange() {
    switch (this.router.params.page) {
      case 'environments':
        this.environment.getEnvironments();
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
   * Display a browser notification(Notification - Web API)
   * @param {String} message
   */
  show(message) {
    new Notification('AliECS', {body: message});
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
