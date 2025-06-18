export enum DuplexMessageEvent {
  EMPTY_EVENT = "EMPTY_EVENT",
  NEW_TOKEN = "NEW_TOKEN",
  REVOKE_TOKEN = "REVOKE_TOKEN",
}

export interface TokenMessage {
  token: string;
  targetAddress: string;
}

export interface DuplexMessageModel {
  event: DuplexMessageEvent;
  newToken?: TokenMessage;
  revokeToken?: TokenMessage;
}
