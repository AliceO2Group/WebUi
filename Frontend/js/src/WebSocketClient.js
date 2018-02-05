export default class WebSocketClient extends WebSocket {
  constructor(url, protocols) {
    super(url, protocols);

    this.authed = false;
  }

  send(payload) {
    if (!this.authed) {
      throw new Error('Client not yet authenticated by the server');
    }
    const message = {token: TOKEN, payload};
    super.send(JSON.stringify(message));
  }

  sendJSON(payload) {
    this.send(JSON.stringify(payload));
  }
}


