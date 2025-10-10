import { Agent } from "https";
import fetch from "node-fetch";

export class VaultAuthService {
  public async login(
    url: string,
    name: string,
    agent: Agent,
    body: { name: string }
  ): Promise<string> {
    const result = await fetch(url, {
      method: "POST",
      body,
      headers: { "content-type": "application/json" },
      agent,
    });
    if (!result.ok) throw new Error(await result.text());
    return (await result.json()).auth.client_token;
  }
  public async renew(
    url: string,
    token: string,
    agent: Agent,
    body: { token: string }
  ): Promise<string> {
    const result = await fetch(url, {
      method: "POST",
      body,
      headers: {
        "content-type": "application/json",
        "X-Vault-Token": token,
      },
      agent,
    });
    if (!result.ok) throw new Error(await result.text());
    return (await result.json()).auth.client_token;
  }
}
