/**
 * @description This class represents a connection to a target client and manages sending messages to it.
 */
export class Connection {
  private token: string;
  private targetAddress: string;

  constructor(token: string, targetAddress: string) {
    this.token = token;
    this.targetAddress = targetAddress;
  }

  public handleNewToken(token: string): void {
    this.token = token;
  }
}
