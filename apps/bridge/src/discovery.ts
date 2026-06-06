import { createRequire } from "node:module";

// bonjour-service is CommonJS and its named exports aren't statically
// detectable by Node's ESM loader, so require it at runtime while keeping the
// real types via a type-only `import(...)`.
const require = createRequire(import.meta.url);
const { Bonjour } = require("bonjour-service") as typeof import("bonjour-service");

/** The subset of an mDNS service record Relay reads. */
interface MdnsService {
  name?: string;
  host?: string;
  addresses?: string[];
  referer?: { address?: string };
  txt?: Record<string, unknown>;
}

export interface DiscoveredTv {
  host: string;
  name: string;
}

/** First IPv4 address in a list, ignoring IPv6 entries. */
function pickIpv4(addresses: string[] | undefined): string | undefined {
  return (addresses ?? []).find((a) => a.includes(".") && !a.includes(":"));
}

/**
 * Browse the LAN for Android TVs advertising the `_androidtvremote2._tcp`
 * service and resolve with everything seen within `timeoutMs`.
 */
export function discoverTvs(timeoutMs = 4000): Promise<DiscoveredTv[]> {
  return new Promise((resolve) => {
    const bonjour = new Bonjour();
    const found = new Map<string, DiscoveredTv>();

    const browser = bonjour.find({ type: "androidtvremote2" }, (service: MdnsService) => {
      const host =
        pickIpv4(service.addresses) ??
        service.referer?.address ??
        service.host;
      if (!host) return;
      const name = service.name || (service.txt?.fn as string) || host;
      found.set(host, { host, name });
    });

    setTimeout(() => {
      try {
        browser.stop();
        bonjour.destroy();
      } catch {
        /* ignore teardown errors */
      }
      resolve([...found.values()]);
    }, timeoutMs);
  });
}
