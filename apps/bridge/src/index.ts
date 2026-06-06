#!/usr/bin/env node
import { startBridge } from "./server.js";

const portEnv = process.env.RELAY_BRIDGE_PORT;
const port = portEnv ? Number(portEnv) : undefined;

startBridge({ port });
