// Import frontend framework
import {Observable, WebSocketClient, fetchClient, QueryRouter, Loader, sessionService} from '/js/src/index.js';

import Lock from './lock/Lock.js';
import Environment from './environment/Environment.js';
import Role from './role/Role.js';
import Status from './status/Status.js';

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

    this.loader = new Loader(this);
    this.loader.bubbleTo(this);

    this.lock = new Lock(this);
    this.lock.bubbleTo(this);

    this.environment = new Environment(this);
    this.environment.bubbleTo(this);

    this.role = new Role(this);
    this.role.bubbleTo(this);

    this.status = new Status(this);
    this.status.bubbleTo(this);

    // Setup router
    this.router = new QueryRouter();
    this.router.observe(this.handleLocationChange.bind(this));
    this.router.bubbleTo(this);
    this.handleLocationChange(); // Init first page

    // Setup keyboard dispatcher
    window.addEventListener('keydown', this.handleKeyboardDown.bind(this));

    // Setup WS connexion
    this.ws = new WebSocketClient();
    this.ws.addListener('command', this.handleWSCommand.bind(this));

    // Load some initial data
    this.lock.synchronizeState();

    this.accountMenuEnabled = false;
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
    if (message.command === 'padlock-update') {
      this.lock.setPadlockState(message.payload);
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
      case 'newEnvironment':
        break;
      case 'environments':
        this.environment.getEnvironments();
        break;
      case 'environment':
        if (!this.router.params.id) {
          alert('id is missing, going to list instead');
          this.router.go('?page=environments');
          return;
        }
        this.environment.getEnvironment({id: this.router.params.id});
        break;
      case 'roles':
        this.role.getRoles();
        break;
      case 'status':
        this.status.getFrameworkInfo();
        break;
      default:
        this.router.go('?page=status');
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
}
