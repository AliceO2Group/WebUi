import { CentralConnection } from '../../../client/connectionManager/CentralConnection';
import { DuplexMessageEvent } from '../../../models/message.model';

const mockLogger = {
  infoMessage: jest.fn(),
  debugMessage: jest.fn(),
  warnMessage: jest.fn(),
  errorMessage: jest.fn(),
};

jest.mock(
  '@aliceo2/web-ui',
  () => ({
    LogManager: {
      getLogger: jest.fn(() => mockLogger),
    },
  }),
  { virtual: true }
);

jest.mock('../../../utils/connection/reconnectionScheduler', () => ({
  ReconnectionScheduler: jest.fn().mockImplementation((callback) => ({
    reset: jest.fn(),
    schedule: jest.fn(),
    _callback: callback,
  })),
}));

describe('CentralConnection', () => {
  let centralConnection: CentralConnection;
  let mockClient: any;
  let mockDispatcher: any;
  let mockStream: any;
  const CENTRAL_ADDRESS = 'localhost:50051';

  beforeEach(() => {
    jest.clearAllMocks();

    mockStream = {
      on: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    };

    mockClient = {
      ClientStream: jest.fn(() => mockStream),
    };

    mockDispatcher = {
      dispatch: jest.fn(),
    };

    centralConnection = new CentralConnection(mockClient, mockDispatcher, CENTRAL_ADDRESS);
  });

  describe('constructor', () => {
    it('should initialize with correct central address', () => {
      expect(centralConnection.centralAddress).toBe(CENTRAL_ADDRESS);
    });

    it('should create reconnection scheduler', () => {
      const { ReconnectionScheduler } = require('../../../utils/connection/reconnectionScheduler');
      expect(ReconnectionScheduler).toHaveBeenCalled();
    });
  });

  describe('connect', () => {
    it('should create stream and set up event listeners', () => {
      centralConnection.connect();

      expect(mockClient.ClientStream).toHaveBeenCalled();
      expect(mockStream.on).toHaveBeenCalledWith('data', expect.any(Function));
      expect(mockStream.on).toHaveBeenCalledWith('end', expect.any(Function));
      expect(mockStream.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should not create new stream if already connected', () => {
      centralConnection.connect();
      centralConnection.connect();

      expect(mockClient.ClientStream).toHaveBeenCalledTimes(1);
    });

    it('should dispatch received data to dispatcher', () => {
      centralConnection.connect();

      const onDataHandler = mockStream.on.mock.calls.find(([event]: any[]) => event === 'data')?.[1];
      const testPayload = {
        event: DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN,
        payload: { singleToken: { token: 'test-token', targetAddress: 'addr' } },
      };

      onDataHandler(testPayload);

      expect(mockDispatcher.dispatch).toHaveBeenCalledWith(testPayload);
    });

    it('should reset reconnection scheduler on data received', () => {
      centralConnection.connect();

      const onDataHandler = mockStream.on.mock.calls.find(([event]: any[]) => event === 'data')?.[1];
      const testPayload = {
        event: DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN,
        payload: {},
      };

      onDataHandler(testPayload);

      const { ReconnectionScheduler } = require('../../../utils/connection/reconnectionScheduler');
      const schedulerInstance = ReconnectionScheduler.mock.results[0].value;
      expect(schedulerInstance.reset).toHaveBeenCalled();
    });

    it('should schedule reconnection on stream end', () => {
      centralConnection.connect();

      const onEndHandler = mockStream.on.mock.calls.find(([event]: any[]) => event === 'end')?.[1];
      onEndHandler();

      const { ReconnectionScheduler } = require('../../../utils/connection/reconnectionScheduler');
      const schedulerInstance = ReconnectionScheduler.mock.results[0].value;
      expect(schedulerInstance.schedule).toHaveBeenCalled();
    });

    it('should clear stream reference on end', () => {
      centralConnection.connect();

      const onEndHandler = mockStream.on.mock.calls.find(([event]: any[]) => event === 'end')?.[1];
      onEndHandler();

      centralConnection.connect();
      expect(mockClient.ClientStream).toHaveBeenCalledTimes(2);
    });

    it('should schedule reconnection on stream error', () => {
      centralConnection.connect();

      const onErrorHandler = mockStream.on.mock.calls.find(([event]: any[]) => event === 'error')?.[1];
      const testError = new Error('Connection error');
      onErrorHandler(testError);

      const { ReconnectionScheduler } = require('../../../utils/connection/reconnectionScheduler');
      const schedulerInstance = ReconnectionScheduler.mock.results[0].value;
      expect(schedulerInstance.schedule).toHaveBeenCalled();
    });

    it('should clear stream reference on error', () => {
      centralConnection.connect();

      const onErrorHandler = mockStream.on.mock.calls.find(([event]: any[]) => event === 'error')?.[1];
      onErrorHandler(new Error('Test error'));

      centralConnection.connect();
      expect(mockClient.ClientStream).toHaveBeenCalledTimes(2);
    });
  });

  describe('sendEvent', () => {
    it('should send event when stream is connected', () => {
      centralConnection.connect();

      const testData = {
        event: DuplexMessageEvent.MESSAGE_EVENT_GET_ALL_TOKENS,
      };

      const result = centralConnection.sendEvent(testData);

      expect(mockStream.write).toHaveBeenCalledWith(testData);
      expect(result).toBe(true);
    });

    it('should return false when stream is not connected', () => {
      const testData = {
        event: DuplexMessageEvent.MESSAGE_EVENT_GET_ALL_TOKENS,
      };

      const result = centralConnection.sendEvent(testData);

      expect(result).toBe(false);
      expect(mockLogger.warnMessage).toHaveBeenCalledWith(expect.stringContaining('Stream is not defined'));
    });

    it('should handle write errors gracefully', () => {
      centralConnection.connect();

      mockStream.write.mockImplementation(() => {
        throw new Error('Write error');
      });

      const testData = {
        event: DuplexMessageEvent.MESSAGE_EVENT_GET_ALL_TOKENS,
      };

      const result = centralConnection.sendEvent(testData);

      expect(result).toBe(false);
      expect(mockLogger.errorMessage).toHaveBeenCalledWith(expect.stringContaining('Error sending'), expect.any(Error));
    });

    it('should send multiple events successfully', () => {
      centralConnection.connect();

      const event1 = {
        event: DuplexMessageEvent.MESSAGE_EVENT_GET_ALL_TOKENS,
      };

      const event2 = {
        event: DuplexMessageEvent.MESSAGE_EVENT_RENEW_TOKEN,
        payload: { singleToken: { token: 'token', targetAddress: 'addr' } },
      };

      centralConnection.sendEvent(event1);
      centralConnection.sendEvent(event2);

      expect(mockStream.write).toHaveBeenCalledTimes(2);
      expect(mockStream.write).toHaveBeenNthCalledWith(1, event1);
      expect(mockStream.write).toHaveBeenNthCalledWith(2, event2);
    });
  });

  describe('start', () => {
    it('should connect and log connection message', () => {
      centralConnection.start();

      expect(mockClient.ClientStream).toHaveBeenCalled();
      expect(mockLogger.infoMessage).toHaveBeenCalledWith(expect.stringContaining(`Connected to CentralSystem on ${CENTRAL_ADDRESS}`));
    });

    it('should not create duplicate stream if already connected', () => {
      centralConnection.connect();
      centralConnection.start();

      expect(mockClient.ClientStream).toHaveBeenCalledTimes(1);
    });
  });

  describe('disconnect', () => {
    it('should end stream when connected', () => {
      centralConnection.connect();
      centralConnection.disconnect();

      expect(mockStream.end).toHaveBeenCalled();
      expect(mockLogger.infoMessage).toHaveBeenCalledWith(expect.stringContaining('Disconnected from CentralSystem'));
    });

    it('should handle disconnect when not connected', () => {
      centralConnection.disconnect();

      expect(mockStream.end).not.toHaveBeenCalled();
      expect(mockLogger.infoMessage).toHaveBeenCalledWith(expect.stringContaining('Disconnected from CentralSystem'));
    });

    it('should allow reconnection after disconnect', () => {
      centralConnection.connect();
      centralConnection.disconnect();
      centralConnection.connect();

      expect(mockClient.ClientStream).toHaveBeenCalledTimes(2);
    });
  });

  describe('reconnection flow', () => {
    it('should reconnect after stream end event', () => {
      jest.useFakeTimers();
      centralConnection.connect();

      const onEndHandler = mockStream.on.mock.calls.find(([event]: any[]) => event === 'end')?.[1];
      onEndHandler();

      const { ReconnectionScheduler } = require('../../../utils/connection/reconnectionScheduler');
      const schedulerInstance = ReconnectionScheduler.mock.results[0].value;
      const reconnectCallback = schedulerInstance._callback;

      reconnectCallback();

      expect(mockClient.ClientStream).toHaveBeenCalledTimes(2);
      jest.useRealTimers();
    });

    it('should reconnect after stream error event', () => {
      jest.useFakeTimers();
      centralConnection.connect();

      const onErrorHandler = mockStream.on.mock.calls.find(([event]: any[]) => event === 'error')?.[1];
      onErrorHandler(new Error('Network error'));

      const { ReconnectionScheduler } = require('../../../utils/connection/reconnectionScheduler');
      const schedulerInstance = ReconnectionScheduler.mock.results[0].value;
      const reconnectCallback = schedulerInstance._callback;

      reconnectCallback();

      expect(mockClient.ClientStream).toHaveBeenCalledTimes(2);
      jest.useRealTimers();
    });
  });
});

// Made with Bob
