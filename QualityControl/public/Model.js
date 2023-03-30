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

/* global QCG, JSROOT */

import {
  sessionService, Observable, WebSocketClient, QueryRouter, Loader, Notification, RemoteData,
} from '/js/src/index.js';

import Layout from './layout/Layout.js';
import QCObject from './object/QCObject.js';
import LayoutService from './services/Layout.service.js';
import Folder from './folder/Folder.js';
import FrameworkInfo from './frameworkInfo/FrameworkInfo.js';
import QCObjectService from './services/QCObject.service.js';

/**
 * Represents the application's state and actions as a class
 */
export default class Model extends Observable {
  /**
   * Initialize the whole model and sub-models associated
   */
  constructor() {
    super();
    this.session = sessionService.get();
    this.session.personid = parseInt(this.session.personid, 10); // Cast, sessionService has only strings

    this.object = new QCObject(this);
    this.object.bubbleTo(this);

    this.loader = new Loader(this);
    this.loader.bubbleTo(this);

    this.folder = new Folder(this);
    this.folder.addFolder({ title: 'My Layouts', isOpened: true, list: RemoteData.notAsked(), searchInput: '' });
    this.folder.addFolder({ title: 'All Layouts', isOpened: false, list: RemoteData.notAsked(), searchInput: '' });
    this.folder.bubbleTo(this);

    this.layout = new Layout(this);
    this.layout.bubbleTo(this);

    this.notification = new Notification(this);
    this.notification.bubbleTo(this);

    this.frameworkInfo = new FrameworkInfo(this);
    this.frameworkInfo.bubbleTo(this);

    this.isOnlineModeConnectionAlive = false;
    this.isOnlineModeEnabled = false; // Show only online objects or all (offline)

    this.refreshTimer = 0;
    this.refreshInterval = 0; // Seconds
    this.sidebar = true;
    this.accountMenuEnabled = false;
    this.page = null;
    this._isImportVisible = false; // Visibility of modal allowing user to import a layout as JSON

    // Setup router
    this.router = new QueryRouter();
    this.router.observe(this.handleLocationChange.bind(this));

    // Setup keyboard dispatcher
    window.addEventListener('keydown', this.handleKeyboardDown.bind(this));

    // Setup WS connection
    this.ws = new WebSocketClient();
    this.ws.addListener('authed', this.handleWSAuthed.bind(this));
    this.ws.addListener('close', this.handleWSClose.bind(this));

    this.initModel();
  }

  /**
   * Initialize steps in a certain order based on
   * mandatory information from server
   * @returns {undefined}
   */
  async initModel() {
    this.services = {
      object: new QCObjectService(this),
      layout: new LayoutService(this),
    };

    if (QCG.CONSUL_SERVICE) {
      this.checkOnlineModeAvailability();
    }

    this.loader.get('/api/checkUser');

    // JSROOT.settings.ContextMenu = true;
    JSROOT.settings.AutoStat = true;
    JSROOT.settings.CanEnlarge = false;
    JSROOT.settings.DragAndDrop = false;
    JSROOT.settings.MoveResize = false; // Div 2
    JSROOT.settings.ToolBar = false;
    JSROOT.settings.ZoomWheel = false;
    JSROOT.settings.ApproxTextSize = true;
    JSROOT.settings.fFrameLineColor = 16;
    JSROOT.settings.PreferSavedPoints = true;

    /*
     * Init first page
     */
    this.handleLocationChange();
  }

  /**
   * Delegates sub-model actions depending on incoming keyboard event
   * @param {Event} e - event for which to handle action
   * @returns {undefined}
   */
  handleKeyboardDown(e) {
    // Console.log(`e.keyCode=${e.keyCode}, e.metaKey=${e.metaKey}, e.ctrlKey=${e.ctrlKey}, e.altKey=${e.altKey}`);
    const code = e.keyCode;

    // Delete key + layout page + object select => delete this object
    if (code === 8 &&
      this.router.params.page === 'layoutShow' &&
      this.layout.editEnabled &&
      this.layout.editingTabObject) {
      this.layout.deleteTabObject(this.layout.editingTabObject);
    } else if (code === 27 && this.isImportVisible) {
      this.layout.resetImport();
    }
  }

  /**
   * Handle authed event from WS when connection is ready to be used
   * @returns {undefined}
   */
  handleWSAuthed() {
    // Subscribe to all notifications from server (information service)
    this.ws.setFilter(() => true);
  }

  /**
   * Handle close event from WS when connection has been lost (server restart, etc.)
   * @returns {undefined}
   */
  handleWSClose() {
    const self = this;
    setTimeout(() => {
      self.notification.show('Connection to server has been lost, please reload the page.', 'danger', Infinity);
    }, 3000);
  }

  /**
   * Delegates sub-model actions depending new location of the page
   * @returns {undefined}
   */
  handleLocationChange() {
    this.object.objects = {}; // Remove any in-memory loaded objects
    clearInterval(this.layout.tabInterval);

    this.services.layout.getLayoutsByUserId(this.session.personid);

    switch (this.router.params.page) {
      case 'layoutList':
        this.page = 'layoutList';
        this.services.layout.getLayouts();
        break;
      case 'layoutShow':
        if (!this.router.params.layoutId) {
          this.notification.show('layoutId in URL was missing. Redirecting to layout page', 'warning', 3000);
          this.router.go('?page=layoutList', true);
          return;
        }
        this.layout.loadItem(this.router.params.layoutId)
          .then(() => {
            this.page = 'layoutShow';
            if (this.router.params.edit) {
              this.layout.edit();

              // Replace silently and immediately URL to remove 'edit' parameter after a layout creation
              // eslint-disable-next-line
              this.router.go(`?page=layoutShow&layoutId=${this.router.params.layoutId}`, true, true);
            }
            this.notify();
          }).catch(() => true); // Error is handled inside loadItem
        break;
      case 'objectTree':
        this.page = 'objectTree';
        this.object.loadList();
        // Data is already loaded at beginning
        if (this.object.selected) {
          this.object.loadObjectByName(this.object.selected.name);
        }
        this.notify();
        break;
      case 'objectView': {
        this.page = 'objectView';
        const { layoutId } = this.router.params;
        if (layoutId) {
          this.layout.getLayoutById(layoutId);
        }
        this.notify();
        break;
      }
      case 'about':
        this.page = 'about';
        this.frameworkInfo.getFrameworkInfo();
        this.notify();
        break;
      default:
        // Default route, replace the current one not handled
        this.router.go('?page=layoutList', true);
        break;
    }
  }

  /**
   * Show or hide sidebar
   * @returns {undefined}
   */
  toggleSidebar() {
    this.sidebar = !this.sidebar;
    this.notify();
  }

  /**
   * Toggle account menu dropdown
   * @returns {undefined}
   */
  toggleAccountMenu() {
    this.accountMenuEnabled = !this.accountMenuEnabled;
    this.notify();
  }

  /**
   * Toggle mode (Online/Offline)
   * @returns {undefined}
   */
  toggleMode() {
    this.isOnlineModeEnabled = !this.isOnlineModeEnabled;
    if (this.isOnlineModeEnabled) {
      this.setRefreshInterval(60);
    } else {
      this.object.loadList();
      clearTimeout(this.refreshTimer);
    }
    this.object.selected = null;
    this.object.searchInput = '';
    this.notify();
  }

  /**
   * Method to check if connection is secure to enable certain improvements
   * e.g navigator.clipboard, notifications, service workers
   * @returns {boolean} - whether window is in secure context
   */
  isContextSecure() {
    return window.isSecureContext;
  }

  /**
   * Method to check if Online Mode is available
   * @returns {undefined}
   */
  async checkOnlineModeAvailability() {
    const result = await this.services.object.isOnlineModeConnectionAlive();
    if (result.isSuccess()) {
      this.isOnlineModeConnectionAlive = true;
    } else {
      this.isOnlineModeConnectionAlive = false;
    }
  }

  /**
   * Set the interval to update objects currently loaded and shown to user.
   * This will reload only data associated to them
   * @param {number} intervalSeconds - in seconds
   * @returns {undefined}
   */
  setRefreshInterval(intervalSeconds) {
    // Stop any other timer
    clearTimeout(this.refreshTimer);

    // Validate user input
    let parsedValue = parseInt(intervalSeconds, 10);
    if (isNaN(parsedValue) || parsedValue < 1) {
      parsedValue = 2;
    }

    // Start new timer
    this.refreshInterval = parsedValue;
    this.refreshTimer = setTimeout(() => {
      this.setRefreshInterval(this.refreshInterval);
    }, this.refreshInterval * 1000);
    this.notify();

    this.object.refreshObjects();
  }

  /**
   * Getters / Setters
   */

  /**
   * Returns the visibility of the import layout modal
   * @returns {boolean} - whether import modal is visible
   */
  get isImportVisible() {
    return this._isImportVisible;
  }

  /**
   * Sets the visibility of the import layout modal
   * @param {boolean} value - value to be set for modal visibility
   * @returns {boolean} - new value of modal visibility
   */
  set isImportVisible(value) {
    this._isImportVisible = value ? true : false;
    this.notify();
  }
}
