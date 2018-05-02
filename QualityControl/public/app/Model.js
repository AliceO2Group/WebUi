import sessionService from '/js/src/sessionService.js';
import {Observable, WebSocketClient} from '/js/src/index.js';

import Layout from './layout/Layout.js'
import Object_ from './object/Object.js'
import Loader from './loader/Loader.js'
import Router from './QueryRouter.class.js'

/**
 * Represents the application's state and actions as a class
 */
export default class Model extends Observable {
  /**
   * Initialize the whole model and sub-models associated
   */
  constructor() {
    super();

    this.session = sessionService.session;
    this.session.personid = parseInt(this.session.personid, 10); // cast, sessionService has only strings

    this.layout = new Layout(this);
    this.layout.bubbleTo(this);

    this.object = new Object_(this);
    this.object.bubbleTo(this);

    this.loader = new Loader(this);
    this.loader.bubbleTo(this);

    this.sidebar = true;
    this.route = null;
    this.page = null;

    // Setup router
    this.router = new Router();
    this.router.observe(this.handleLocationChange.bind(this));
    this.handleLocationChange(); // Init first page

    // Setup keyboard dispatcher
    window.addEventListener('keydown', this.handleKeyboardDown.bind(this));

    // Setup WS connexion
    this.ws = new WebSocketClient();
    this.ws.addListener('authed', () => {
      this.ws.setFilter(() => {return true;});
    });
    this.ws.addListener('command', this.handleWSCommand.bind(this));

    // Init data
    this.object.loadList();
    this.layout.loadMyList();
  }

  /**
   * Delegates sub-model actions depending on incoming keyboard event
   * @param {Event} e
   */
  handleKeyboardDown(e) {
    console.log(`e.keyCode=${e.keyCode}, e.metaKey=${e.metaKey}, e.ctrlKey=${e.ctrlKey}, e.altKey=${e.altKey}`);
    const code = e.keyCode;

    // Delete key + layout page + object select => delete this object
    if (code === 8 && this.router.params.page === 'layoutShow' && this.layout.editEnabled && this.layout.editingTabObject) {
      this.layout.deleteTabObject(this.layout.editingTabObject);
    }
  }

  /**
   * Delegates sub-model actions depending on incoming command from server
   * @param {WebSocketMessage} message
   */
  handleWSCommand(message) {
    if (message.command === 'information-service') {
      this.object.setInformationService(message.payload);
      return;
    }
  }

  /**
   * Delegates sub-model actions depending new location of the page
   */
  handleLocationChange() {
    const page = this.router.params.page
    console.log(`Page changed to ${page}`);

    switch (page) {
      case 'layoutList':
        this.layout.loadList()
          .then(() => {
            this.page = 'layoutList';
            this.notify();
          })
          .catch(() => {

          });
        break;
      case 'layoutShow':
        if (!this.router.params.layout) {
          return this.router.go('?', true);
        }
        this.layout.loadItem(this.router.params.layout)
          .then(() => {
            this.page = 'layoutShow';
            this.notify();
          })
          .catch((err) => {
            console.log(err);
            this.router.go('?page=layoutList');
          });
        break;
      case 'objectTree':
        this.page = 'objectTree';
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
}
