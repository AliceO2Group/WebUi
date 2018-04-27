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

    this.ws.addListener('authed', () => {
      console.log('ready, let send a message');
    });

    this.ws.addListener('command', (msg) => {
      if (msg.command === 'server-date') {
        this.date = msg.payload.date;
        this.notify();
      }
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
    this.ws.sendMessage({command: 'stream-date', payload: 'message from client'});
    this.ws.setFilter(function(message) {return message.command === 'server-date'});
  }
}
