// Import frontend framework
import {
  Observable, WebSocketClient, QueryRouter,
  Loader, RemoteData, sessionService, Notification
} from '/js/src/index.js';
import Log from './log/Log.js';
import Timezone from './common/Timezone.js';
import {callRateLimiter} from './common/utils.js';
import Table from './table/Table.js';
import {MODE} from './constants/mode.const.js';

/**
 * Main model of InfoLoggerGui, contains sub-models modules
 */
export default class Model extends Observable {
  /**
   * Instantiate main model containing other models and native events
   */
  constructor() {
    super();

    this.session = sessionService.get();
    this.session.personid = parseInt(this.session.personid, 10); // cast, sessionService has only strings

    this.loader = new Loader(this);
    this.loader.bubbleTo(this);

    this.log = new Log(this);
    this.log.bubbleTo(this);

    this.table = new Table(this);
    this.table.bubbleTo(this);
    this.getUserProfile();

    this.timezone = new Timezone();
    this.timezone.bubbleTo(this);

    this.notification = new Notification(this);
    this.notification.bubbleTo(this);

    this.frameworkInfoEnabled = false;
    this.frameworkInfo = RemoteData.notAsked();
    this.getFrameworkInfo();

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
      this.notification.show(`No QUERY / LIVE services configured`, 'danger', Infinity);
    } else if (!result.query) {
      this.notification.show(`No QUERY service configured`, 'danger', Infinity);
    } else if (!result.live) {
      this.notification.show(`No LIVE service configured`, 'danger', Infinity);
    }

    this.servicesResult = RemoteData.success(result);
    this.notify();
  }

  /**
   * Request data about the framework
   */
  async getFrameworkInfo() {
    this.servicesResult = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.loader.get(`/api/getFrameworkInfo`);
    if (!ok) {
      this.frameworkInfo = RemoteData.failure(result.message);
    } else {
      this.frameworkInfo = RemoteData.success(result);
    }
    this.notify();
    return;
  }

  /**
   * Request data about the user's profile
   */
  async getUserProfile() {
    if (this.session.personid !== 0) {
      this.userProfile = RemoteData.loading();
      this.notify();
      const {result, ok} = await this.loader.get(`/api/getUserProfile?user=${this.session.personid}`);
      if (!ok) {
        this.userProfile = RemoteData.failure(result.message);
        this.notification.show('Unable to load your profile. Default profile will be used instead', 'danger', 2000);
      } else {
        this.userProfile = RemoteData.success(result);
        if (this.userProfile.payload.content.colsHeader) {
          this.table.colsHeader = this.userProfile.payload.content.colsHeader;
          this.notification.show('Your profile was loaded successfully', 'success', 2000);
        }
      }
      this.notify();
    }
    return;
  }

  /**
   * Request to save the current configuration of the user
   */
  async saveUserProfile() {
    const body = {
      user: this.session.personid,
      content: {colsHeader: this.table.colsHeader}
    };
    const {result, ok} = await this.loader.post(`/api/saveUserProfile`, body);
    if (!ok) {
      this.notification.show('Profile could not be saved', 'danger', 2000);
    } else {
      this.notification.show(result.message, 'success', 2000);
    }
    this.accountMenuEnabled = false;
    this.notify();
    return;
  }


  /**
   * Delegates sub-model actions depending on incoming keyboard event
   * @param {Event} e
   */
  handleKeyboardDown(e) {
    // console.log(`e.code=${e.code}, e.key=${e.key},e.keyCode=${e.keyCode}, e.metaKey=${e.metaKey}, e.ctrlKey=${e.ctrlKey}, e.altKey=${e.altKey}`);
    const code = e.keyCode;

    // Enter
    if (code === 13 && !this.log.isLiveModeEnabled()) {
      this.log.query();
    }

    // don't listen to keys when it comes from an input (they transform into letters)
    // except spacial ones which are not chars
    // http://www.foreui.com/articles/Key_Code_Table.htm
    if (e.target.tagName.toLowerCase() === 'input') {
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
      case 67:
        if ((e.metaKey || e.ctrlKey) && window.getSelection().toString() === '' && this.isSecureContext()) {
          navigator.clipboard.writeText(this.log.displayedItemFieldsToString());
          this.notification.show('Message has been successfully copied to clipboard', 'success', 1500);
        }
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
    } else if (message.command === 'il-server-connection-issue'
      && this.log.activeMode !== MODE.QUERY) {
      this.notification.show(`Connection to InfoLogger server is unavailable. Retrying in 5 seconds`, 'warning', 2000);
    } else if (message.command === 'il-server-close') {
      this.notification.show(`Connection between backend and InfoLogger server has been lost`, 'warning', 2000);
    }
    return;
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
   * Toggle framework info on the left
   */
  toggleFrameworkInfo() {
    this.frameworkInfoEnabled = !this.frameworkInfoEnabled;
    this.accountMenuEnabled = false;
    this.notify();
  }

  /**
   * Toggle account menu dropdown
   */
  toggleAccountMenu() {
    this.accountMenuEnabled = !this.accountMenuEnabled;
    this.notify();
  }

  /**
   * Method to check if connection is secure to enable certain improvements
   * e.g navigator.clipboard, notifications, service workers
   * @return {boolean}
   */
  isSecureContext() {
    return window.isSecureContext;
  }
}
