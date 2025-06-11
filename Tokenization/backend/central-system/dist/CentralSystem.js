class CentralSystem {
    static async getTokens(req, res) {
        try {
            const tokens = Array.from(CentralSystem.fakeTokens.values()).map((token) => ({
                tokenId: token.tokenId,
                validity: token.validity,
                payload: token.payload.slice(-5),
            }));
            res.status(200).json(tokens);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to retrieve tokens" });
        }
    }
    static async createToken(req, res) {
    }
    static async provideTokeToClient(clientID, token) { }
    static async revokeToken(client, tokenEncypted) { }
}
CentralSystem.fakeTokens = new Map([
    [1, { tokenId: 1, validity: "good", payload: "payload1" }],
    [2, { tokenId: 2, validity: "bad", payload: "payload2" }],
]);
export default CentralSystem;
