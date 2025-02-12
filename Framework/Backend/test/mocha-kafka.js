const { AliEcsEventMessagesConsumer, EventMessage } = require('../kafka/AliEcsEventMessagesConsumer.js');
const assert = require('node:assert');
const { fromInt } = require('long');

const dummyKafkaClient = {
  eachMessage: null,

  /**
   * Dummy kafka client
   */
  consumer() {
    const client = this;
    return {

      /**
       * Dummy connect implementation
       */
      connect() {
      },

      /**
       * Dummy subscription implementation
       */
      subscribe() {
      },

      /**
       * Dummy run implementation
       * @param configuration
       */
      run(configuration) {
        client.eachMessage = configuration.eachMessage;
      },
    };
  },

  /**
   * Send a dummy message
   * @param message
   */
  sendDummyMessage(message) {
    this.eachMessage({ message: { value: message }, topic: 'dummy-topic' });
  },
};

describe('KAFKA CONSUMERS', () => {
  it('should successfully create an AliECS event message consumer', async () => {
    const messagesConsumer = new AliEcsEventMessagesConsumer(
      dummyKafkaClient,
      'dummy-group-id',
      ['dummy-topic'],
    );
    let receviedMessages = null;
    messagesConsumer.onMessageReceived((message) => {
      receviedMessages = message;
    });

    await messagesConsumer.start();
    const dummyMessage = { timestamp: 123, timestampNano: 456, mesosHeartbeatEvent: {} };
    const message = EventMessage.encode(EventMessage.create(dummyMessage)).finish();
    dummyKafkaClient.sendDummyMessage(message);

    assert.deepStrictEqual({
      timestamp: fromInt(123, false),
      timestampNano: fromInt(456, false),
      mesosHeartbeatEvent: {},
    }, receviedMessages);
  });
});
