# Rules for AI assistants

These rules apply to every AI tool working in this repository (Claude, Gemini, Codex, Copilot, Cursor and others) and to every new chat.

## Start with the parent folder's AGENTS.md

This repository is the preset repo that the Frida Run app downloads. It is checked out inside the Frida Run project folder, and `../AGENTS.md` there has the full instructions:
- how to ship a change (edit `scripts/bigballers_script.js`, copy it here, push, rebuild the zip);
- how to test on the headset;
- how Frida Run runs scripts;
- what we know about the game.

Read `../AGENTS.md` before changing anything. When a workflow or fact changes, update that file too.

## Layout

| Path | What it is |
|---|---|
| `manifest.json` | The list of presets Frida Run shows. |
| `bigballers/config.json` | The Big Ballers preset: target package, script path, bridge mode, sounds folder and where the sounds are copied on the headset. |
| `bigballers/script/bigballers_script.js` | The Overdose mod menu. It's a copy of the project's `scripts/bigballers_script.js`, so edit that one and copy it here. |
| `bigballers/sounds/` | Soundboard sounds that Frida Run copies to the headset. |
| `bigballers/bridge/` | Empty: the preset uses the bridge built into Frida Run. |

## No code comments

- Do not add comments to any code: no `//` line comments, no `/* */` block comments, no JSDoc, no `#` comments or docstrings, no section banners, no `TODO`/`FIXME` notes, no commented-out code.
- This applies to new code and to code you edit. When you change a function, leave it without comments.
- Do not add comments to "explain" a change. Put the explanation in your chat reply or in the git commit message instead.
- Make code readable with clear names instead of comments.
- If a file you touch already has comments, do not add more. Only remove them when asked.
