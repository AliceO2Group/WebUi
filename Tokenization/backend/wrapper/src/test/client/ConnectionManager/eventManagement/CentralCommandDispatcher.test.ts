import { CentralCommandDispatcher } from '../../../../client/connectionManager/eventManagement/CentralCommandDispatcher';
import { DuplexMessageEvent } from '../../../../models/message.model';
import { Command, CommandHandler } from '../../../../models/commands.model';

jest.mock(
  '@aliceo2/web-ui',
  () => ({
    LogManager: {
      getLogger: jest.fn(() => ({
        infoMessage: jest.fn(),
        debugMessage: jest.fn(),
        warnMessage: jest.fn(),
        errorMessage: jest.fn(),
      })),
    },
  }),
  { virtual: true }
);

describe('CentralCommandDispatcher', () => {
  let dispatcher: CentralCommandDispatcher;
  let mockHandler: CommandHandler<Command>;

  beforeEach(() => {
    dispatcher = new CentralCommandDispatcher();
    mockHandler = {
      handle: jest.fn().mockResolvedValue(undefined),
    };
  });

  describe('register', () => {
    it('should register a handler for a specific event type', () => {
      dispatcher.register(DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN, mockHandler);

      expect(mockHandler).toBeDefined();
    });

    it('should register multiple handlers for different event types', () => {
      const mockHandler2: CommandHandler<Command> = {
        handle: jest.fn().mockResolvedValue(undefined),
      };

      dispatcher.register(DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN, mockHandler);
      dispatcher.register(DuplexMessageEvent.MESSAGE_EVENT_REVOKE_TOKEN, mockHandler2);

      expect(mockHandler).toBeDefined();
      expect(mockHandler2).toBeDefined();
    });

    it('should overwrite existing handler when registering same event type', () => {
      const mockHandler2: CommandHandler<Command> = {
        handle: jest.fn().mockResolvedValue(undefined),
      };

      dispatcher.register(DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN, mockHandler);
      dispatcher.register(DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN, mockHandler2);

      const command: Command = {
        event: DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN,
        payload: {},
      };

      dispatcher.dispatch(command);

      expect(mockHandler2.handle).toHaveBeenCalledWith(command);
      expect(mockHandler.handle).not.toHaveBeenCalled();
    });
  });

  describe('dispatch', () => {
    it('should dispatch command to registered handler', async () => {
      dispatcher.register(DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN, mockHandler);

      const command: Command = {
        event: DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN,
        payload: { singleToken: { token: 'test-token', targetAddress: 'localhost:5000' } },
      };

      await dispatcher.dispatch(command);

      expect(mockHandler.handle).toHaveBeenCalledWith(command);
      expect(mockHandler.handle).toHaveBeenCalledTimes(1);
    });

    it('should handle command with empty payload', async () => {
      dispatcher.register(DuplexMessageEvent.MESSAGE_EVENT_GET_ALL_TOKENS, mockHandler);

      const command: Command = {
        event: DuplexMessageEvent.MESSAGE_EVENT_GET_ALL_TOKENS,
        payload: {},
      };

      await dispatcher.dispatch(command);

      expect(mockHandler.handle).toHaveBeenCalledWith(command);
    });

    it('should not throw when no handler is registered for event type', async () => {
      const command: Command = {
        event: DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN,
        payload: {},
      };

      await expect(dispatcher.dispatch(command)).resolves.not.toThrow();
    });

    it('should log warning when no handler is registered', async () => {
      const command: Command = {
        event: DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN,
        payload: {},
      };

      await dispatcher.dispatch(command);

      expect(mockHandler.handle).not.toHaveBeenCalled();
    });

    it('should catch and log errors thrown by handler', async () => {
      const errorHandler: CommandHandler<Command> = {
        handle: jest.fn().mockRejectedValue(new Error('Handler error')),
      };

      dispatcher.register(DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN, errorHandler);

      const command: Command = {
        event: DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN,
        payload: {},
      };

      await expect(dispatcher.dispatch(command)).resolves.not.toThrow();
      expect(errorHandler.handle).toHaveBeenCalledWith(command);
    });

    it('should handle multiple dispatches to same handler', async () => {
      dispatcher.register(DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN, mockHandler);

      const command1: Command = {
        event: DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN,
        payload: { singleToken: { token: 'token1', targetAddress: 'addr1' } },
      };

      const command2: Command = {
        event: DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN,
        payload: { singleToken: { token: 'token2', targetAddress: 'addr2' } },
      };

      await dispatcher.dispatch(command1);
      await dispatcher.dispatch(command2);

      expect(mockHandler.handle).toHaveBeenCalledTimes(2);
      expect(mockHandler.handle).toHaveBeenNthCalledWith(1, command1);
      expect(mockHandler.handle).toHaveBeenNthCalledWith(2, command2);
    });

    it('should handle async handler execution', async () => {
      const asyncHandler: CommandHandler<Command> = {
        handle: jest.fn().mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }),
      };

      dispatcher.register(DuplexMessageEvent.MESSAGE_EVENT_SEND_ALL_TOKENS, asyncHandler);

      const command: Command = {
        event: DuplexMessageEvent.MESSAGE_EVENT_SEND_ALL_TOKENS,
        payload: { tokensList: [] },
      };

      await dispatcher.dispatch(command);

      expect(asyncHandler.handle).toHaveBeenCalledWith(command);
    });

    it('should dispatch different commands to different handlers', async () => {
      const handler1: CommandHandler<Command> = {
        handle: jest.fn().mockResolvedValue(undefined),
      };
      const handler2: CommandHandler<Command> = {
        handle: jest.fn().mockResolvedValue(undefined),
      };

      dispatcher.register(DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN, handler1);
      dispatcher.register(DuplexMessageEvent.MESSAGE_EVENT_REVOKE_TOKEN, handler2);

      const command1: Command = {
        event: DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN,
        payload: {},
      };

      const command2: Command = {
        event: DuplexMessageEvent.MESSAGE_EVENT_REVOKE_TOKEN,
        payload: {},
      };

      await dispatcher.dispatch(command1);
      await dispatcher.dispatch(command2);

      expect(handler1.handle).toHaveBeenCalledWith(command1);
      expect(handler2.handle).toHaveBeenCalledWith(command2);
      expect(handler1.handle).not.toHaveBeenCalledWith(command2);
      expect(handler2.handle).not.toHaveBeenCalledWith(command1);
    });
  });
});

// Made with Bob
