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

/* global JSROOT */

import {
  sessionService, Observable, WebSocketClient, QueryRouter, Loader, Notification,
} from '/js/src/index.js';

import Layout from './layout/Layout.js';
import QCObject from './object/QCObject.js';
import LayoutService from './services/Layout.service.js';
import QCObjectService from './services/QCObject.service.js';
import ObjectViewModel from './pages/objectView/ObjectViewModel.js';
import { setBrowserTabTitle } from './common/utils.js';
import { buildQueryParametersString } from './common/buildQueryParametersString.js';
import AboutViewModel from './pages/aboutView/AboutViewModel.js';
import LayoutListModel from './pages/layoutListView/model/LayoutListModel.js';
import { RequestFields } from './common/RequestFields.enum.js';
import FilterModel from './common/filters/model/FilterModel.js';

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

    this.loader = new Loader(this);
    this.loader.bubbleTo(this);

    this.filterModel = new FilterModel(this);
    this.filterModel.bubbleTo(this);

    this.object = new QCObject(this);
    this.object.bubbleTo(this);

    this.objectViewModel = new ObjectViewModel(this);
    this.objectViewModel.bubbleTo(this);

    this.layoutListModel = new LayoutListModel(this);
    this.layoutListModel.bubbleTo(this);

    this.layout = new Layout(this);
    this.layout.bubbleTo(this);

    this.notification = new Notification(this);
    this.notification.bubbleTo(this);

    this.aboutViewModel = new AboutViewModel(this);
    this.aboutViewModel.bubbleTo(this);

    this.refreshTimer = 0;
    this.refreshInterval = 0; // Seconds
    this.sidebar = true;
    this.accountMenuEnabled = false;
    this.page = null;
    this._isImportVisible = false; // Visibility of modal allowing user to import a layout as JSON
    this._isUpdateVisible = false; // Visibility of modal allowing user to edit JSON of an existing layout

    // Setup router
    this.router = new QueryRouter();
    this.router.observe(this.handleLocationChange.bind(this));

    //Run mode
    this._inRunMode = false; // Whether the application is in run mode or not
    this._runNumber = null; // Run number to be used in run mode
    this._runStatus = null; // Status of the run in run mode

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
    JSROOT.settings.SmallPad = {
      height: 10,
    };

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
  async handleLocationChange() {
    this.object.objects = {}; // Remove any in-memory loaded objects
    clearInterval(this.layout.tabInterval);
    await this.filterModel.filterService.initFilterService();
    this.filterModel.setFilterFromURL();
    this.filterModel.setFilterToURL();

    this.services.layout.getLayoutsByUserId(this.session.personid, RequestFields.LAYOUT_CARD);

    const { params } = this.router;

    switch (params.page) {
      case 'layoutList':
        this.page = 'layoutList';
        setBrowserTabTitle('QCG-Layouts');
        this.services.layout.getLayouts(RequestFields.LAYOUT_CARD);
        break;
      case 'layoutShow':
        setBrowserTabTitle('QCG-LayoutShow');
        if (!params.layoutId) {
          const { definition, pdpBeamType, detector, runType, runNumber } = params;
          if (!definition) {
            this.notification.show('layoutId in URL was missing. Redirecting to layouts page', 'warning', 3000);
            this.router.go('?page=layoutList', true);
            return;
          } else {
            let pdpTemp = undefined;
            delete params.pdpBeamType;
            if (definition === 'PHYSICS') {
              pdpTemp = pdpBeamType;
            }
            const layout = await this.services.layout.getLayoutByQuery(definition, pdpTemp);
            if (!layout) {
              this.notification.show(`Layout with definition ${definition} could not be found`, 'warning', 3000);
              this.router.go('?page=layoutList', true);
              return;
            }
            const paramsToAdd = { layoutId: layout.id };
            delete params.definition;

            if (detector) {
              let tab = detector;
              if (runType) {
                tab += `_${runType.toLocaleLowerCase()}`;
              }

              paramsToAdd.tab = tab;
              delete params.detector;
              delete params.runType;
            }
            if (runNumber !== null && runNumber !== undefined) {
              paramsToAdd.RunNumber = runNumber;
              delete params.runNumber;
            }
            this.router.go(buildQueryParametersString(params, paramsToAdd), true);
            return;
          }
        }

        this.layout.loadItem(this.router.params.layoutId, params?.tab ?? '')
          .then(() => {
            this.page = 'layoutShow';
            if (params.edit) {
              this.layout.edit();

              // Replace silently and immediately URL to remove 'edit' parameter after a layout creation

              this.router.go(`?page=layoutShow&layoutId=${this.router.params.layoutId}`, true, true);
            }
            this.notify();
          }).catch(() => true); // Error is handled inside loadItem
        break;
      case 'objectTree':
        this.page = 'objectTree';
        setBrowserTabTitle('QCG-Tree');
        await this.object.loadList();
        // Data is already loaded at beginning
        if (this.object.selected) {
          this.object.loadObjectByName(this.object.selected.name);
        }
        this.notify();
        break;
      case 'objectView': {
        this.page = 'objectView';
        this.sidebar = false;
        setBrowserTabTitle('QCG-View');
        const { params } = this.router;
        this.objectViewModel.init(params);
        this.notify();
        break;
      }
      case 'about':
        this.page = 'about';
        setBrowserTabTitle('QCG-About');
        this.aboutViewModel.retrieveAllServicesStatus();
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
   * Method to check if connection is secure to enable certain improvements
   * e.g navigator.clipboard, notifications, service workers
   * @returns {boolean} - whether window is in secure context
   */
  isContextSecure() {
    return window.isSecureContext;
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
   * @returns {undefined}
   */
  set isImportVisible(value) {
    this._isImportVisible = value ? true : false;
    this.notify();
  }

  /**
   * Returns the visibility of the edit JSON layout modal
   * @returns {boolean} - whether import modal is visible
   */
  get isUpdateVisible() {
    return this._isUpdateVisible;
  }

  /**
   * Sets the visibility of the edit JSON layout modal
   * @param {boolean} value - value to be set for modal visibility
   * @returns {undefined}
   */
  set isUpdateVisible(value) {
    this._isUpdateVisible = value ? true : false;
    this.notify();
  }

  /**
   * Checks if run mode is activated
   * @returns {boolean} true if activated
   */
  get inRunMode() {
    return this._inRunMode;
  }

  enterRunMode() {
    this._inRunMode = true;
    this._runNumber = this.router.params.RunNumber || null;
    this.notify();
  }

  exitRunMode() {
    this._inRunMode = false;
    this._runNumber = null;
    this._runStatus = null;
    this.notify();
  }

  /**
   * Get run number
   * @returns {null | number} Run number or null if not set
   */
  get runNumber() {
    return this._runNumber;
  }

  /**
   * Activate/Deactivate runs mode
   * @returns {null | string} Run status or null if not set
   */
  get runStatus() {
    return this._runStatus;
  }

  /**
   * Sets the current run status and triggers a notification update.
   * @param {string} value - The new run status (e.g., 'ONGOING', 'COMPLETED').
   */
  set runStatus(value) {
    this._runStatus = value;
    this.notify();
  }

  /**
   * Determines if runs mode can be activated based on the presence of a valid RunNumber in the router params.
   * @returns {boolean} True if RunNumber is present and not empty
   */
  get canActivateRunsMode() {
    return this.router.params.RunNumber && this.router.params.RunNumber.trim() !== '';
  }
}
