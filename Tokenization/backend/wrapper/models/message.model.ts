enum DuplexMessageEvent {
  EMPTY_EVENT,
  NEW_TOKEN,
  REVOKE_TOKEN,
}

interface TokenMessage {
  token: string;
  targetAddress: string;
}

interface DuplexMessageModel {
  event: DuplexMessageEvent;
  data?: TokenMessage;
}
