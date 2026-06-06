import { homedir } from "node:os";
import { join } from "node:path";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import type { Certificate } from "androidtv-remote";

export interface SavedDevice {
  host: string;
  name: string;
  cert: Certificate;
  lastConnected?: number;
}

type StoreShape = Record<string, SavedDevice>;

const RELAY_DIR = join(homedir(), ".relay");
const STORE_PATH = join(RELAY_DIR, "devices.json");

function ensureDir(): void {
  if (!existsSync(RELAY_DIR)) mkdirSync(RELAY_DIR, { recursive: true });
}

function readStore(): StoreShape {
  try {
    if (!existsSync(STORE_PATH)) return {};
    return JSON.parse(readFileSync(STORE_PATH, "utf8")) as StoreShape;
  } catch {
    return {};
  }
}

function writeStore(store: StoreShape): void {
  ensureDir();
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export function getDevice(host: string): SavedDevice | undefined {
  return readStore()[host];
}

export function listDevices(): SavedDevice[] {
  return Object.values(readStore());
}

export function isPaired(host: string): boolean {
  return Boolean(readStore()[host]?.cert);
}

export function saveDevice(device: SavedDevice): void {
  const store = readStore();
  store[device.host] = { ...store[device.host], ...device };
  writeStore(store);
}

export function touchDevice(host: string): void {
  const store = readStore();
  if (store[host]) {
    store[host].lastConnected = Date.now();
    writeStore(store);
  }
}

export function removeDevice(host: string): void {
  const store = readStore();
  delete store[host];
  writeStore(store);
}
