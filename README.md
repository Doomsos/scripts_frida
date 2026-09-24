# Frida Scripts Repository

Script repository compatible with **FridaRun VR** on Meta Quest.

## Folder Structure

Each script has its own dedicated folder containing its script, bridge, sounds, and config:

```
scripts_frida/
├── <script_name>/
│   ├── script/
│   │   └── <script_name>.js    # Main Frida injection script
│   ├── bridge/
│   │   └── (empty or custom)   # Empty = uses FridaRun embedded Il2Cpp bridge
│   ├── sounds/
│   │   └── *.wav / *.mp3       # Optional soundboard audio files
│   └── config.json             # Target process & path configuration
├── manifest.json               # Top-level presets index
└── README.md
```

### Config File (`config.json`)

Each script folder can define its target game and sound paths:

```json
{
  "title": "Big Ballers (Overdose Menu)",
  "target": "com.dogelabs.bigballersbasketball",
  "script": "script/bigballers_script.js",
  "bridge_mode": "embedded",
  "sounds": "sounds",
  "sounds_game_target": "/sdcard/Android/data/com.dogelabs.bigballersbasketball/files/Overdose/Sounds",
  "eternalize": false
}
```

## Adding a New Script

1. Create a new folder named after your game/script (e.g. `gorillatag/`).
2. Add your script in `<name>/script/`.
3. If using custom bridge, put it in `<name>/bridge/`. Otherwise leave bridge empty.
4. Add audio files in `<name>/sounds/` if your script has a soundboard.
5. Create `<name>/config.json` with target package and paths.
