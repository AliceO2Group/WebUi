const { Kafka } = require('kafkajs');
const { AliEcsEventMessagesConsumer } = require('../kafka/AliEcsEventMessagesConsumer.js');

describe('KAFKA CONSUMERS', () => {
  it('should successfully create an AliECS event message consumer', async () => {
    new AliEcsEventMessagesConsumer(new Kafka({}), 'dummy-group-id', ['dummy-topic']);
  });
});
