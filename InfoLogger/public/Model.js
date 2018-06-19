// Import frontend framework
import {Observable, WebSocketClient, fetchClient, QueryRouter, Loader} from '/js/src/index.js';

// The model
export default class Model extends Observable {
  constructor() {
    super();

    this.loader = new Loader(this);
    this.loader.bubbleTo(this);

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
      case 'status':
        // this.status.getFrameworkInfo();
        break;
      default:
        this.router.go('?page=status');
        break;
    }
  }
}
