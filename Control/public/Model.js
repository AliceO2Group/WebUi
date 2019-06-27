// Import frontend framework
import {Observable, WebSocketClient, QueryRouter, Loader, sessionService} from '/js/src/index.js';
import {Notification as O2Notification} from '/js/src/index.js';
import Lock from './lock/Lock.js';
import Environment from './environment/Environment.js';
import Status from './status/Status.js';
import Workflow from './workflow/Workflow.js';

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

    this.workflow = new Workflow(this);
    this.workflow.bubbleTo(this);

    this.status = new Status(this);
    this.status.bubbleTo(this);

    this.notification = new O2Notification(this);
    this.notification.bubbleTo(this);
    this.checkBrowserNotificationPermissions();

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
    this.ws.addListener('close', this.handleWSClose.bind(this));

    // Load some initial data
    this.lock.synchronizeState();

    this.accountMenuEnabled = false;
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
      case 'newEnvironment':
        this.workflow.get();
        break;
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
      case 'workflows':
        this.workflow.get();
        break;
      case 'status':
        this.status.getFrameworkInfo();
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
   * Display a browser notification(Notification - Web API)
   * @param {String} message
   */
  show(message) {
    new Notification('AliECS', {body: message, icon: 'test.png'});
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
