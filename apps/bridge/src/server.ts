import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import {
  DEFAULT_BRIDGE_PORT,
  RELAY_PROTOCOL_VERSION,
  parseClientMessage,
  type BridgeMessage,
  type ClientMessage,
  type TvDevice,
} from "@relay/shared";
import { TvManager } from "./tv.js";
import { discoverTvs } from "./discovery.js";
import { listDevices as listSavedDevices, removeDevice, isPaired } from "./store.js";

const BRIDGE_VERSION = "0.1.0";

export interface BridgeOptions {
  port?: number;
}

export function startBridge(opts: BridgeOptions = {}): void {
  const port = opts.port ?? DEFAULT_BRIDGE_PORT;

  const tv = new TvManager();
  const clients = new Set<WebSocket>();

  const broadcast = (msg: BridgeMessage) => {
    const data = JSON.stringify(msg);
    for (const ws of clients) {
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
    }
  };

  // Fan out every TV manager event to all connected browsers.
  tv.on("message", broadcast);

  /** Merge currently-online (discovered) devices with previously-paired ones. */
  async function buildDeviceList(): Promise<TvDevice[]> {
    const discovered = await discoverTvs();
    const byHost = new Map<string, TvDevice>();

    for (const saved of listSavedDevices()) {
      byHost.set(saved.host, {
        host: saved.host,
        name: saved.name,
        paired: true,
        online: false,
      });
    }
    for (const d of discovered) {
      const existing = byHost.get(d.host);
      byHost.set(d.host, {
        host: d.host,
        name: existing?.name ?? d.name,
        paired: existing?.paired ?? isPaired(d.host),
        online: true,
      });
    }
    return [...byHost.values()];
  }

  const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.url === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, version: BRIDGE_VERSION }));
      return;
    }
    res.writeHead(426, { "content-type": "text/plain" });
    res.end("Relay bridge — connect over WebSocket.");
  });

  const wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", (ws: WebSocket) => {
    clients.add(ws);

    const send = (msg: BridgeMessage) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
    };

    send({
      type: "welcome",
      protocolVersion: RELAY_PROTOCOL_VERSION,
      bridgeVersion: BRIDGE_VERSION,
    });

    ws.on("message", async (raw) => {
      const msg = parseClientMessage(raw.toString());
      if (!msg) {
        send({ type: "error", message: "Malformed message", code: "bad_message" });
        return;
      }
      await handleClientMessage(msg, send);
    });

    ws.on("close", () => clients.delete(ws));
    ws.on("error", () => clients.delete(ws));
  });

  async function handleClientMessage(
    msg: ClientMessage,
    send: (msg: BridgeMessage) => void,
  ): Promise<void> {
    switch (msg.type) {
      case "hello":
      case "listDevices":
      case "discover":
        send({ type: "devices", devices: await buildDeviceList() });
        return;
      case "connect":
        await tv.connect(msg.host, msg.port, msg.name);
        return;
      case "sendCode":
        tv.sendCode(msg.code);
        return;
      case "command":
        tv.command(msg.command);
        return;
      case "disconnect":
        tv.disconnect("requested by user");
        return;
      case "forget":
        if (tv.connectedHost === msg.host) tv.disconnect("device forgotten");
        removeDevice(msg.host);
        send({ type: "devices", devices: await buildDeviceList() });
        return;
      case "ping":
        send({ type: "pong" });
        return;
      default:
        send({ type: "error", message: "Unknown message type", code: "unknown_type" });
    }
  }

  httpServer.listen(port, () => {
    console.log(`\n  ▶ Relay bridge v${BRIDGE_VERSION}`);
    console.log(`  • WebSocket:  ws://localhost:${port}`);
    console.log(`  • Health:     http://localhost:${port}/health`);
    console.log(`  • Waiting for the Relay web app to connect…\n`);
  });

  const shutdown = () => {
    console.log("\n  Shutting down Relay bridge…");
    tv.disconnect("bridge shutting down");
    wss.close();
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1000);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
