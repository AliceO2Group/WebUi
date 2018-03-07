// Import frontend framework
import {Observable, fetchClient, WebSocketClient} from '/js/src/index.js';

// The model
export default class Model extends Observable {
  constructor() {
    super();
    this.count = 0;
    this.date = null;
    this.ws = null;

    this._prepareWebSocket();
  }

  _prepareWebSocket() {
    // Real-time communication with server
    this.ws = new WebSocketClient();

    this.ws.addEventListener('authed', (message) => {
      console.log('ready, let send a message');
    });

    this.ws.addEventListener('server-date', (e) => {
      this.date = e.detail.date;
      this.notify();
    });
  }

  increment() {
    this.count++;
    this.notify();
  }

  decrement() {
    this.count--;
    this.notify();
  }

  async fetchDate() {
    const response = await fetchClient('/api/getDate', {method: 'POST'});
    const content = await response.json();
    this.date = content.date;
    this.notify();
  }

  streamDate() {
    if (!this.ws.authed) {
      return alert('WS not authed, wait and retry');
    }
    this.ws.sendMessage({command: 'stream-date', message: 'message from client'});
    this.ws.setFilter(function(e) {return true;});
  }
}
