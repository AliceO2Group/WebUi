const { AliEcsEventMessagesConsumer } = require('../index.js');
const { Kafka } = require('kafkajs');

describe('KAFKA CONSUMERS', () => {
  it('should successfully create an AliECS event message consumer', async () => {
    new AliEcsEventMessagesConsumer(new Kafka({}), 'dummy-group-id', ['dummy-topic']);
  });
});
