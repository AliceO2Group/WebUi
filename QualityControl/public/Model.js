import {sessionService, Observable, WebSocketClient, QueryRouter, Loader, Notification} from '/js/src/index.js';

import Layout from './layout/Layout.js';
import QCObject from './object/QCObject.js';
import LayoutService from './services/Layout.service.js';

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
    this.session.personid = parseInt(this.session.personid, 10); // cast, sessionService has only strings

    this.layout = new Layout(this);
    this.layout.bubbleTo(this);

    this.object = new QCObject(this);
    this.object.bubbleTo(this);

    this.loader = new Loader(this);
    this.loader.bubbleTo(this);

    this.layout = new Layout(this);
    this.layout.bubbleTo(this);
    this.layoutService = new LayoutService(this.loader);

    this.notification = new Notification(this);
    this.notification.bubbleTo(this);

    this.sidebar = true;
    this.accountMenuEnabled = false;
    this.page = null;

    // Setup router
    this.router = new QueryRouter();
    this.router.observe(this.handleLocationChange.bind(this));
    this.handleLocationChange(); // Init first page

    // Setup keyboard dispatcher
    window.addEventListener('keydown', this.handleKeyboardDown.bind(this));

    // Setup WS connection
    this.ws = new WebSocketClient();
    this.ws.addListener('authed', this.handleWSAuthed.bind(this));
    this.ws.addListener('close', this.handleWSClose.bind(this));

    // Init data
    this.object.loadList();
    this.object.checkOnlineStatus();
    this.layout.loadMyList();
  }

  /**
   * Delegates sub-model actions depending on incoming keyboard event
   * @param {Event} e
   */
  handleKeyboardDown(e) {
    // console.log(`e.keyCode=${e.keyCode}, e.metaKey=${e.metaKey}, e.ctrlKey=${e.ctrlKey}, e.altKey=${e.altKey}`);
    const code = e.keyCode;

    // Delete key + layout page + object select => delete this object
    if (code === 8 &&
      this.router.params.page === 'layoutShow' &&
      this.layout.editEnabled &&
      this.layout.editingTabObject) {
      this.layout.deleteTabObject(this.layout.editingTabObject);
    }
  }

  /**
   * Handle authed event from WS when connection is ready to be used,
   */
  handleWSAuthed() {
    // subscribe to all notifications from server (information service)
    this.ws.setFilter(() => {
      return true;
    });
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
      case 'layoutList':
        this.layout.loadList()
          .then(() => {
            this.page = 'layoutList';
            this.notify();
          }).catch(() => true); // error is handled inside loadList
        break;
      case 'layoutShow':
        if (!this.router.params.layoutId) {
          // TODO: notification(`Argument layoutId is URL is missing`);
          this.router.go('?', true);
          return;
        }
        this.layout.loadItem(this.router.params.layoutId)
          .then(() => {
            this.page = 'layoutShow';
            if (this.router.params.edit) {
              this.layout.edit();

              // Replace silently and immediately URL to remove 'edit' parameter after a layout creation
              // eslint-disable-next-line
              this.router.go(`?page=layoutShow&layoutId=${this.router.params.layoutId}&layoutName=${this.router.params.layoutName}`, true, true);
            }
            this.notify();
          }).catch(() => true); // error is handled inside loadItem
        break;
      case 'objectTree':
        this.page = 'objectTree';
        // data are already loaded at beginning
        this.notify();
        break;
      default:
        // default route, replace the current one not handled
        this.router.go('?page=layoutList', true);
        break;
    }
  }

  /**
   * Show or hide sidebar
   */
  toggleSidebar() {
    this.sidebar = !this.sidebar;
    this.notify();
  }

  /**
   * Toggle account menu dropdown
   */
  toggleAccountMenu() {
    this.accountMenuEnabled = !this.accountMenuEnabled;
    this.notify();
  }
}
