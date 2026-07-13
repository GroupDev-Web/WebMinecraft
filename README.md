# LowFrame Client: Browser Edition

Eaglercraft in your browser, themed to match the LowFrame Launcher desktop app.

## Structure

- `index.html`, `css/`, `js/` — the custom launcher (title screen, saved servers, direct connect, and a bottom dock with the client version switcher and Launch button). This is the actual UI you see and where the theming lives.
- `assets/icon.png` — the LowFrame brand icon, shared with the desktop launcher.
- `engine/1.12/`, `engine/1.8/` — vendored [EaglercraftX](https://github.com/eaglercraftx1-8/eaglercraftx1-8.github.io) WASM-GC client builds (`bootstrap.js` + `assets.epw`, self-contained packages embedding the WASM runtime, game assets, and loader). These are the real, functioning Minecraft-in-browser engines — pick 1.12.2 or 1.8.9 from the dock and it can join any Eaglercraft-compatible (`ws://`/`wss://`) server. The launcher hands off to the selected engine once you hit Play/Launch/Connect.
- `Eaglercraft-1.12-Source/`, `eaglercraft-1_8/` — the Java desktop source trees for both versions, kept for reference only (not compiled or used at runtime).

Once you connect, gameplay itself (world rendering, in-game menus, options) is the stock Eaglercraft engine — only the outer launcher is restyled, since the in-game screens are rendered by the compiled client rather than HTML.

## Running locally

The client must be served over HTTP (not opened as a `file://` URL):

```sh
python3 -m http.server 8080
```

Then open `http://localhost:8080/`.

## Notes

- The dock's **CLIENT** dropdown picks which Eaglercraft version (1.12.2 or 1.8.9) gets loaded on Launch/Connect.
- Servers you add in the launcher are stored in `localStorage` and also passed into the engine's own multiplayer list.
- Eaglercraft only supports `ws://`/`wss://` addresses, not raw Minecraft TCP servers — the launcher auto-prefixes `wss://` if you omit a scheme.
- Username/profile setup happens inside the engine itself on first launch, same as stock Eaglercraft.
