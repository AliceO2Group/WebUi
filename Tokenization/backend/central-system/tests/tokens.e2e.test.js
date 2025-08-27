const { spawn } = require("child_process");
const net = require("net");
const request = require("supertest");

const BASE_URL = "http://localhost:8080";
const SERVER_ENTRY = require("path").resolve(__dirname, "../index.js");

let serverProc;

// Wait until a TCP port is accepting connections. 
function waitForPort(port, host = "127.0.0.1", timeoutMs = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const socket = net.createConnection(port, host);
      socket.once("connect", () => {
        socket.end();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timed out waiting for ${host}:${port}`));
        } else {
          setTimeout(tryConnect, 150);
        }
      });
    };
    tryConnect();
  });
}

beforeAll(async () => {
  // Start your server as a child process.
  // If your app respects PORT, this ensures it binds to 8080.
  serverProc = spawn(process.execPath, [SERVER_ENTRY], {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PORT: "8080", NODE_ENV: "test" },
  });

  // Optional: log server stdout/stderr to help diagnose failures
  serverProc.stdout.on("data", (d) => process.stdout.write(`[server] ${d}`));
  serverProc.stderr.on("data", (d) => process.stderr.write(`[server] ${d}`));

  // Wait until the server is accepting connections on 8080
  await waitForPort(8080, "127.0.0.1", 20000);
}, 30000);

afterAll(async () => {
  if (!serverProc) return;
  // Try graceful shutdown
  serverProc.kill();
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 3000);
    serverProc.once("close", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}, 10000);

describe("Token API E2E", () => {
  let createdToken;

  test("GET /api/tokens responds 200 and JSON", async () => {
    const res = await request(BASE_URL)
      .get("/api/tokens")
      .set("Accept", "application/json")
      .expect((r) => {
        // Accept 200..299 (some APIs use 204 with empty list)
        if (r.status < 200 || r.status >= 300) {
          throw new Error(`Unexpected status: ${r.status}`);
        }
      });

    // Content-Type should be JSON if body exists
    if (res.text && res.text.length) {
      expect(res.headers["content-type"]).toMatch(/application\/json/i);
    }
  });

  test("POST /api/tokens/create returns a token", async () => {
    // Adjust payload to match your API (if your endpoint requires fields)
    const payload = {
      userId: "e2e-user",
      scopes: ["read", "write"],
      // add any required fields here
    };

    const res = await request(BASE_URL)
      .post("/api/tokens/create")
      .send(payload)
      .set("Accept", "application/json")
      .expect((r) => {
        if (!(r.status === 200 || r.status === 201)) {
          throw new Error(`Expected 200/201, got ${r.status}`);
        }
      });

    expect(res.headers["content-type"]).toMatch(/application\/json/i);

    // Be flexible about the response shape
    createdToken =
      res.body?.token ||
      res.body?.id ||
      res.body?.data?.token ||
      res.body?.data?.id;

    expect(createdToken).toBeDefined();
  });

  test("POST /api/tokens/revoke revokes the created token", async () => {
    // If your revoke endpoint expects a different field name, adjust here
    const revokeBody = { token: createdToken };

    const res = await request(BASE_URL)
      .post("/api/tokens/revoke")
      .send(revokeBody)
      .set("Accept", "application/json")
      .expect((r) => {
        // Many APIs return 200 or 204 on revoke; accept common success codes
        if (![200, 202, 204].includes(r.status)) {
          throw new Error(`Unexpected status: ${r.status}`);
        }
      });

    // Some implementations return no body on 204
    if (res.status !== 204) {
      // If JSON is returned, ensure it's JSON
      if (res.text && res.text.length) {
        expect(res.headers["content-type"]).toMatch(/application\/json/i);
      }
    }
  });
});
