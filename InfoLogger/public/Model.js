// Import frontend framework
import {Observable, WebSocketClient, fetchClient, QueryRouter, Loader, RemoteData} from '/js/src/index.js';
import Log from './log/Log.js';
import Timezone from './common/Timezone.js';
import {callThroughput} from './common/utils.js';

// The model
export default class Model extends Observable {
  /**
   * Instanciate main model containing other models and native events
   */
  constructor() {
    super();

    this.loader = new Loader(this);
    this.loader.bubbleTo(this);

    this.log = new Log(this);
    this.log.bubbleTo(this);

    this.timezone = new Timezone(this);
    this.timezone.bubbleTo(this);

    // Setup router
    this.router = new QueryRouter();
    this.router.observe(this.handleLocationChange.bind(this));
    this.router.bubbleTo(this);
    this.handleLocationChange(); // Init first page

    // Setup keyboard dispatcher
    window.addEventListener('keydown', this.handleKeyboardDown.bind(this));

    // Setup window size listener - view needs redraw for smart scrolling
    window.addEventListener('resize', this.notify.bind(this));

    // Setup WS connexion
    this.ws = new WebSocketClient();
    this.ws.addListener('command', this.handleWSCommand.bind(this));
    this.ws.addListener('authed', () => {
      console.log('WS ready');
      this.ws.setFilter(function(message) {
        return message.payload.severity === 'E';
      });
    });

    this.servicesResult = RemoteData.NotAsked(); // Success({query, live})

    this.detectServices();

    // update router on model change
    this.observe(this.updateRouteOnModelChange.bind(this));
  }

  /**
   * Ask server for services configured and ready to be used
   * Currently: query and live data sources.
   */
  async detectServices() {
    this.servicesResult = RemoteData.Loading();
    this.notify();

    const {result, ok} = await this.loader.post(`/api/services`);
    if (!ok) {
      alert(`Unable to start application, web server is not reachable`);
      return;
    }
    this.servicesResult = RemoteData.Success(result);
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
        if (e.ctrlKey) {
          this.log.firstError();
        } else {
          this.log.previousError();
        }
        break;
      case 39: // right
        if (e.ctrlKey) {
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
        e.preventDefault(); // avoid scroll
        this.log.nextItem();
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

  updateRouteOnModelChange() {
    // Model can change very often and updating router to often can throw errors
    callThroughput(() => {
      // replace current URL, we don't want one history slot per change
      // do it silently, don't notify model which is the source of this action
      this.router.go(`?q=${JSON.stringify(this.log.filter.toObject())}`, true, true);
    }, 33); // 100 calls per 30 seconds max = 30ms, round up to 30 FPS (1/30=0,33).
  }
}
