import {Observable} from '/js/src/index.js';
import Layout from './layout/Layout.js'
import Object from './object/Object.js'
import Loader from './loader/Loader.js'
import Router from './QueryRouter.class.js'


export default class Model extends Observable {
  constructor() {
    super();

    this.layout = new Layout(this);
    this.layout.bubbleTo(this);

    this.object = new Object(this);
    this.object.bubbleTo(this);

    this.loader = new Loader(this);
    this.loader.bubbleTo(this);

    this.zoom = 80;
    this.sidebar = true;
    this.route = null;
    this.page = null;

    this.router = new Router();
    this.router.observe(this.handleLocationChange.bind(this));

    // Init first page
    this.handleLocationChange();

    window.addEventListener('resize', () => this.notify());

    this.object.loadList(); // TODO pas propre
  }

  handleLocationChange() {
    const url = this.router.getUrl();
    const page = url.searchParams.get('page');
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
        if (!url.searchParams.get('layout')) {
          return this.router.setSearch('?', true);
        }
        this.layout.loadItem(url.searchParams.get('layout'))
          .then(() => {
            this.page = 'layoutShow';
            this.notify();
          })
          .catch(() => {

          });
        break;
      case 'objectTree':
        this.object.loadList()
          .then(() => {
            this.page = 'objectTree';
            this.notify();
          })
          .catch(() => {

          });
        break;
      default:
        // default route, replace the current one not handled
        this.router.setSearch('?page=layoutList', true);
        break;
    }
  }

  zoomIn() {
    if (this.zoom >= 120) {
      return;
    }
    this.zoom += 10;
    this.notify();
  }

  zoomOut() {
    if (this.zoom <= 10) {
      return;
    }
    this.zoom -= 10;
    this.notify();
  }

  zoomReset() {
    this.zoom = 80; // arbitrary, it should be not too high to see at least one full scale graphic
    this.notify();
  }

  toggleSidebar() {
    this.sidebar = !this.sidebar;
    this.notify();
  }
}
