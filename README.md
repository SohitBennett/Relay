# Relay

A beautiful **web remote for your Android TV**, paired over your own WiFi — the
Play-Store remote experience, reimagined as a polished, installable web app.

> **Why a "bridge"?** Browsers can't open the raw TCP + TLS sockets the
> [Android TV Remote protocol v2](https://github.com/Aymkdn/assistant-freebox-cloud/wiki/Google-TV-(aka-Android-TV)-Remote-Control-(v2))
> requires, and a cloud server can't reach a TV on your home LAN. So Relay runs
> a tiny **local bridge** on your network that speaks the TV protocol and
> exposes a friendly WebSocket API. The web UI talks to the bridge; the bridge
> talks to the TV.

```
┌──────────────┐   WebSocket    ┌───────────────┐   TCP + TLS    ┌──────────┐
│  Relay Web   │ ◄──(ws)──────► │  Relay Bridge │ ◄─(6466/6467)─►│ Android  │
│  Next.js UI  │                │ Node + mDNS   │   protobuf     │   TV     │
└──────────────┘                └───────────────┘                └──────────┘
   in the browser                 on your LAN                    same WiFi
```

## Architecture

A small npm-workspaces monorepo:

| Package | What it is |
|---|---|
| [`packages/shared`](packages/shared) | The WebSocket message protocol — one shared source of truth for both sides. |
| [`apps/bridge`](apps/bridge) | Node + TypeScript. Uses [`androidtv-remote`](https://www.npmjs.com/package/androidtv-remote) for pairing/control, [`bonjour-service`](https://www.npmjs.com/package/bonjour-service) for mDNS discovery, and `ws` for the browser API. Stores paired-device certificates in `~/.relay/`. |
| [`apps/web`](apps/web) | Next.js (App Router) + Tailwind v4 + Framer Motion. The tactile dark "Signal" remote UI; installable as a PWA. |

## Quick start

```bash
npm install          # installs all workspaces
npm run dev          # builds shared, then runs bridge + web together
```

Then open **http://localhost:4000**.

- The **bridge** listens on `ws://localhost:8742` (override with `RELAY_BRIDGE_PORT`).
- The **web app** auto-discovers the bridge at `ws://<page-host>:8742`, so opening
  the site from your **phone** at `http://<your-computer-LAN-IP>:4000` works too —
  override the port with `NEXT_PUBLIC_BRIDGE_PORT` if needed.

### Run pieces individually

```bash
npm run dev:bridge   # just the bridge (tsx watch)
npm run dev:web      # just the web app (next dev)
```

### Production build

```bash
npm run build        # shared → web → bridge
npm start            # runs the built bridge
```

## Pairing a TV

1. Make sure your TV and computer are on the **same WiFi**.
2. Relay scans for TVs advertising `_androidtvremote2._tcp`.
3. Pick your TV — it shows a **6-digit code**.
4. Type the code into Relay. The certificate is saved, so next time it just
   reconnects.

## Controls (v1)

D-pad + **OK**, Back, Home, Volume up/down, Mute, Power, and a live connection
indicator. Physical keyboard works too: arrow keys, Enter, Backspace, `h`
(home), `m` (mute), `+` / `-` (volume).

## Roadmap

- **v1 (now):** local-first — bridge + web run together, fully private.
- **Next:** media transport, text input to the TV, app deep-links (YouTube,
  Netflix…), trackpad mode, multi-TV switching.
- **Go-live:** host the UI, ship the bridge as a one-click tray app, add
  accounts + saved-device sync.

## Security notes

The bridge can fully control the TV, so for a public release it must bind to
localhost or require a pairing token — anything on the LAN could otherwise drive
it. Paired-device certificates live in `~/.relay/` and are git-ignored.
