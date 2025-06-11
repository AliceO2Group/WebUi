import { ConnectionStatus } from "../../models/connection.model.ts";

/**
 * @description This class represents a connection to a target client and manages sending messages to it.
 */
export class Connection {
  private token: string;
  private targetAddress: string;
  private status: ConnectionStatus;

  constructor(token: string, targetAddress: string) {
    this.token = token;
    this.targetAddress = targetAddress;

    this.status = ConnectionStatus.CONNECTED;
  }

  /**
   * @description Replace newly generated token
   * @param token New token to be replaced
   */
  public handleNewToken(token: string): void {
    this.token = token;
  }

  public handleRevokeToken(): void {
    this.token = "";
    this.status = ConnectionStatus.UNAUTHORIZED;
  }

  /**
   * @description Returns token for this Connection object
   * @returns Connection token
   */
  public getToken(): string {
    return this.token;
  }

  /**
   * @description Returns status for specific
   * @returns Connection status
   */
  public getStatus(): string {
    return this.status;
  }
}
