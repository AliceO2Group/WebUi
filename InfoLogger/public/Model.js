// Import frontend framework
import {Observable, WebSocketClient, QueryRouter,
  Loader, RemoteData, sessionService, Notification} from '/js/src/index.js';
import Log from './log/Log.js';
import Timezone from './common/Timezone.js';
import {callRateLimiter} from './common/utils.js';

/**
 * Main model of InfoLoggerGui, contains sub-models modules
 */
export default class Model extends Observable {
  /**
   * Instanciate main model containing other models and native events
   */
  constructor() {
    super();

    this.session = sessionService.get();
    this.session.personid = parseInt(this.session.personid, 10); // cast, sessionService has only strings

    this.loader = new Loader(this);
    this.loader.bubbleTo(this);

    this.log = new Log(this);
    this.log.bubbleTo(this);

    this.timezone = new Timezone(this);
    this.timezone.bubbleTo(this);

    this.notification = new Notification(this);
    this.notification.bubbleTo(this);

    this.inspectorEnabled = false;
    this.accountMenuEnabled = false;

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
    this.ws.addListener('authed', this.handleWSAuthed.bind(this));
    this.ws.addListener('close', this.handleWSClose.bind(this));

    this.servicesResult = RemoteData.notAsked(); // Success({query, live})

    this.detectServices();

    // update router on model change
    // Model can change very often we protect router with callRateLimiter
    // Router limit: 100 calls per 30 seconds max = 30ms, 2 FPS is enough (500ms)
    this.observe(callRateLimiter(this.updateRouteOnModelChange.bind(this), 500));
  }

  /**
   * Handle websocket authentification success
   */
  handleWSAuthed() {
    // Tell server not to stream by default
    this.ws.setFilter(() => false);
  }

  /**
   * Handle websocket close event
   */
  handleWSClose() {
    this.notification.show(`Connection to server has been lost, please reload the page.`, 'danger', Infinity);
  }

  /**
   * Ask server for services configured and ready to be used
   * Currently: query and live data sources.
   */
  async detectServices() {
    this.servicesResult = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.loader.post(`/api/services`);
    if (!ok) {
      this.notification.show(`Unable to load services and start application`, 'danger', Infinity);
      return;
    }

    if (!result.query && !result.live) {
      this.notification.show(`No service configured`, 'danger', Infinity);
    }

    this.servicesResult = RemoteData.success(result);
    this.notify();

    // auto-query if service available
    if (result.query) {
      this.log.query();
    }
  }

  /**
   * Delegates sub-model actions depending on incoming keyboard event
   * @param {Event} e
   */
  handleKeyboardDown(e) {
    console.log(`e.keyCode=${e.keyCode}, e.metaKey=${e.metaKey}, e.ctrlKey=${e.ctrlKey}, e.altKey=${e.altKey}`);
    const code = e.keyCode;

    // Enter
    if (code === 13) {
      this.log.query();
    }

    // don't listen to keys when it comes from an input (they transform into letters)
    // except spacial ones which are not chars
    // http://www.foreui.com/articles/Key_Code_Table.htm
    if (e.target.tagName.toLowerCase() === 'input' && e.keyCode > 47) {
      return;
    }

    // shortcuts
    switch (e.keyCode) {
      case 37: // left
        if (e.altKey) {
          this.log.firstError();
        } else {
          this.log.previousError();
        }
        break;
      case 39: // right
        if (e.altKey) {
          this.log.lastError();
        } else {
          this.log.nextError();
        }
        break;
      case 38: // top
        e.preventDefault(); // avoid scroll
        this.log.previousItem();
        break;
      case 40: // bottom
        if (e.altKey) {
          this.log.goToLastItem();
        } else {
          this.log.nextItem();
        }
        e.preventDefault(); // avoid scroll
        break;
      case 13: // ENTER
        this.log.query();
        break;
    }
  }

  /**
   * Delegates sub-model actions depending on incoming command from server
   * @param {WebSocketMessage} message - {command, payload}
   */
  handleWSCommand(message) {
    if (message.command === 'live-log') {
      this.log.addLog(message.payload);
      return;
    }
    if (message.command === 'il-server-close') {
      this.notification.show(`Connection between backend and InfoLogger server has been lost`, 'warning');
    }
  }

  /**
   * Delegates sub-model actions depending new location of the page
   */
  handleLocationChange() {
    const q = this.router.params.q;
    if (q) {
      this.log.filter.fromObject(JSON.parse(q));
    }
  }

  /**
   * When model change (filters), update address bar with the filter
   * do it silently to avoid infinite loop
   */
  updateRouteOnModelChange() {
    this.router.go(`?q=${JSON.stringify(this.log.filter.toObject())}`, true, true);
  }

  /**
   * Toggle inspector on the right
   */
  toggleInspector() {
    this.inspectorEnabled = !this.inspectorEnabled;
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
