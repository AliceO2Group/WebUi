// Import frontend framework
import {Observable, WebSocketClient} from '/js/src/index.js';

// The model
export default class Model extends Observable {
  constructor() {
    super();
    this.locked = true;
    this.lockedId = null;
    this.ws = null;
    this.myId = 0;

    this._connectWebSocket();
  }

  _connectWebSocket() {
    // Real-time communication with server
    this.ws = new WebSocketClient();

    this.ws.addEventListener('authed', () => {
      this.ws.sendMessage({command: 'lock-check'});
    });

    this.ws.addEventListener('lock-check', (e) => {
    if (e.detail.locked) {
        this.locked = true;
      } else {
        this.locked = false;
      }
      this.notify();
    });

    this.ws.addEventListener('lock-release', (e) => {
      this.locked = false;
      this.notify();
    });

    this.ws.addEventListener('lock-get', (e) => {
      this.locked = true;
      this.notify();
    });
  }

  lock() {
    this.ws.sendMessage({command: 'lock-get'});
  }
 
  unlock() {
    this.ws.sendMessage({command: 'lock-release'});
  }
}
