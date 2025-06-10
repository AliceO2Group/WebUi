/**
 * @description Enum for duplex message events.
 * EMPTY_EVENT: No event, used for initialization or no response.
 * NEW_TOKEN: Event for replacing with newly generated token.
 * REVOKE_TOKEN: Event for revoking an existing token.
 */
enum DuplexMessageEvent {
  EMPTY_EVENT,
  NEW_TOKEN,
  REVOKE_TOKEN,
}

/**
 * @description Model for token generation and revocation messages.
 * @property {string} token - The token to be replaced or revoked.
 * @property {string} targetAddress - The address of connection binded to this token.
 */
interface TokenMessage {
  token: string;
  targetAddress: string;
}

/**
 * @description Model for duplex stream messages between client and central system.
 * @property {DuplexMessageEvent} event - The event type of the message.
 * @property {TokenMessage} [data] - The data associated with the event, it may be undefined for some events.
 */
interface DuplexMessageModel {
  event: DuplexMessageEvent;
  data?: TokenMessage;
}
