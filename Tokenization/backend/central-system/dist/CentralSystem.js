class CentralSystem {
    static async getTokens(req, res) { }
    static async createToken(req, res) { }
    static async provideTokenReceiver(client, token) { }
    static async provideToken(client, tokenEncypted) { }
}
CentralSystem.fakeTokens = new Map([
    [1, { tokenId: 1, validity: "good", payload: "payload1" }],
    [2, { tokenId: 2, validity: "bad", payload: "payload2" }],
]);
export default CentralSystem;
