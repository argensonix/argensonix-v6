#!/usr/bin/env node
import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { spawn } from "node:child_process";

const port = Number.parseInt(process.env.WEBHOOK_PORT || process.env.PORT || "9001", 10);
const secret = process.env.GITHUB_WEBHOOK_SECRET;
const deployScript = new URL("./deploy-staging.sh", import.meta.url).pathname;

let deployRunning = false;

if (!secret) {
  console.error("GITHUB_WEBHOOK_SECRET is required");
  process.exit(1);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function verifySignature(body, signatureHeader) {
  if (!signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const expected = Buffer.from(
    `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`,
    "utf8",
  );
  const actual = Buffer.from(signatureHeader, "utf8");

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function send(response, statusCode, message) {
  response.writeHead(statusCode, { "content-type": "text/plain; charset=utf-8" });
  response.end(`${message}\n`);
}

function startDeploy() {
  deployRunning = true;

  const child = spawn(deployScript, {
    stdio: "ignore",
    detached: false,
  });

  child.on("exit", (code, signal) => {
    deployRunning = false;

    if (code === 0) {
      console.log("Staging deploy finished successfully");
      return;
    }

    console.error(`Staging deploy failed: code=${code ?? "null"} signal=${signal ?? "null"}`);
  });

  child.on("error", (error) => {
    deployRunning = false;
    console.error(`Failed to start staging deploy: ${error.message}`);
  });
}

const server = createServer(async (request, response) => {
  if (request.method !== "POST") {
    send(response, 405, "Method not allowed");
    return;
  }

  const body = await readBody(request);

  if (!verifySignature(body, request.headers["x-hub-signature-256"])) {
    send(response, 401, "Invalid signature");
    return;
  }

  if (request.headers["x-github-event"] !== "push") {
    send(response, 202, "Ignored event");
    return;
  }

  let payload;

  try {
    payload = JSON.parse(body.toString("utf8"));
  } catch {
    send(response, 400, "Invalid JSON");
    return;
  }

  if (payload.ref !== "refs/heads/main") {
    send(response, 202, "Ignored ref");
    return;
  }

  if (deployRunning) {
    send(response, 409, "Deploy already running");
    return;
  }

  startDeploy();
  send(response, 202, "Deploy started");
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Staging webhook listening on http://127.0.0.1:${port}`);
});
