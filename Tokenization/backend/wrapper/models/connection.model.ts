export enum ConnectionStatus {
  // The connection is in the process of being established
  CONNECTING = "CONNECTING",
  // The connection has been successfully established
  CONNECTED = "CONNECTED",
  // The connection attempt failed due to authorization issues
  // or token has expired/been revoked
  UNAUTHORIZED = "UNAUTHORIZED",
  // The connection has been closed
  CLOSED = "CLOSED",
  // An error occurred with the connection
  ERROR = "ERROR",
  // The connection is attempting to re-establish after a disruption
  RECONNECTING = "RECONNECTING",
  // The connection is refreshing its authentication token
  TOKEN_REFRESH = "TOKEN_REFRESH",
}
