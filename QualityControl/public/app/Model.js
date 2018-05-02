import sessionService from '/js/src/sessionService.js';
import {Observable, WebSocketClient} from '/js/src/index.js';

import Layout from './layout/Layout.js'
import Object_ from './object/Object.js'
import Loader from './loader/Loader.js'
import Router from './QueryRouter.class.js'
import {timerDebouncer} from './utils.js';


export default class Model extends Observable {
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

    this.router = new Router();
    this.router.observe(this.handleLocationChange.bind(this));

    // Init first page
    this.handleLocationChange();

    // Keyboard dispatcher
    window.addEventListener('keydown', (e) => {
      console.log(`e.keyCode=${e.keyCode}, e.metaKey=${e.metaKey}, e.ctrlKey=${e.ctrlKey}, e.altKey=${e.altKey}`);
      const code = e.keyCode;

      if (code === 8 && this.router.params.page === 'layoutShow' && this.layout.editEnabled && this.layout.editingTabObject) {
        this.layout.deleteTabObject(this.layout.editingTabObject);
      }
    });

    // this.object.loadList(); // TODO pas propre
    this.layout.loadMyList();

    const ws = new WebSocketClient();
    ws.addListener('authed', () => {
      ws.setFilter(() => {return true;});
    });
    ws.addListener('command', (message) => {
      if (message.command === 'information-service') {
        this.object.setInformationService(message.payload);
        return;
      }
    });
    this.ws = ws;
  }

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

  toggleSidebar() {
    this.sidebar = !this.sidebar;
    this.notify();
  }
}
