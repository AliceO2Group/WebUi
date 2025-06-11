import request from "supertest";
import { expect } from "chai";

describe("GET /api/tokens", function () {
  this.timeout(3000);

  it("should return the tokens with status 200", async () => {
    const response = await request("http://localhost:8080").get("/api/tokens");

    expect(response.status).to.equal(200);
    expect(response.body).to.be.an("array").that.has.length(2);

    expect(response.body[0]).to.have.keys(["tokenId", "validity", "payload"]);
    expect(response.body[0].payload).to.have.length(5);
  });
});
