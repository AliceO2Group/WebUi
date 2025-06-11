import type { Request, Response } from "express";

class CentralSystem {
  private static fakeTokens = new Map([
    [1, { tokenId: 1, validity: "good", payload: "payload1" }],
    [2, { tokenId: 2, validity: "bad", payload: "payload2" }],
  ]);

  public static async getTokens(req: Request, res: Response): Promise<void> {}

  public static async createToken(req: Request, res: Response): Promise<void> {}

  public static async provideTokenReceiver(
    client: string,
    token: string
  ): Promise<void> {}

  public static async provideToken(
    client: string,
    tokenEncypted: string
  ): Promise<void> {}
}

export default CentralSystem;
