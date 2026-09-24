// Overdose — mod menu for Big Ballers (Overdose default-style layout, Red theme).
//
// Loaded after the embedded frida-il2cpp-bridge. Everything lives inside Il2Cpp.perform, so nothing
// here collides with the globals a bridge bundle defines. Boot only resolves metadata and installs
// hooks; every Unity call happens on the game's main thread inside the HeightController.Update tick.
//
// Hot paths call IL2CPP through cached native functions and raw field offsets. The bridge's
// obj.method()/obj.field() re-resolve the member and build a new NativeFunction on every call,
// which is what used to drag the frame rate down.
Il2Cpp.perform(() => {
    "use strict";

    // ───────────────────────────────────── Config ─────────────────────────────────────

    const MENU_TITLE = "Overdose Menu";
    // Names of the objects this script adds to the scene; a reload removes any left over by the
    // previous copy.
    const SCENE_OBJECT_NAMES = ["OverdoseMenu", "OverdosePointer", "OverdoseBallMarker", "OverdoseBallTracer", "OverdosePlayerTracer", "OverdoseSoundboard"];
    const LOCKER_DEBUG = false;

    // Menu placement: the Overdose layout, tilted and pushed off the left hand the way the
    // previous menu was, so it shows up where it used to.
    const MENU_LAYER = 31;
    const MENU_SIZE = 1.0;
    const MENU_HAND_TILT = [-45, 0, 0];
    const MENU_HAND_OFFSET = [0.067, 0, -0.033];
    const POINTER_OFFSET = [-0.02, -0.03, 0.16];
    const POINTER_SCALE = 0.01;
    const BUTTONS_PER_PAGE = 6;
    const PRESS_COOLDOWN_SECONDS = 0.22;
    const PRESS_DEPTH_FRONT = 0.012;
    const PRESS_DEPTH_BEHIND = 0.01;
    const PRESS_MARGIN = 0.002;
    const MENU_OPEN_GRACE_SECONDS = 0.15;
    const CLICK_ANIMATION_SECONDS = 0.1;
    const CLICK_ANIMATION_SCALE = 0.95;

    // Tick pacing
    const TICK_DEDUP_SECONDS = 0.002;
    const REFERENCE_REFRESH_SECONDS = 0.5;
    const LOCAL_MODEL_REFRESH_SECONDS = 1.0;
    const SCENE_CHECK_SECONDS = 0.5;
    const CAMERA_FIX_SECONDS = 3.0;
    const LOCKER_UI_CHECK_SECONDS = 0.25;
    const BALL_LIST_REFRESH_SECONDS = 0.25;

    // Movement
    const FLY_SPEED = 8.0;
    const SPEED_BOOST_MULTIPLIER = 2.25;
    const JUMP_BOOST_MULTIPLIER = 2.5;
    const MOVEMENT_REFRESH_SECONDS = 1.0;

    // Player size
    const SCALE_PRESETS = [
        { label: "Normal (1.0x)", multiplier: 1.0 },
        { label: "Tall (1.4x)", multiplier: 1.4 },
        { label: "Big Boy (2.0x)", multiplier: 2.0 },
        { label: "Giant (2.8x)", multiplier: 2.8 },
        { label: "Titan (4.0x)", multiplier: 4.0 },
        { label: "Mini (0.5x)", multiplier: 0.5 },
    ];
    const BIG_BOY_PRESET = 2;
    const DEFAULT_PLAYER_HEIGHT = 1.82;
    const PLAYER_SCALE_REFRESH_SECONDS = 0.25;

    // Shooting
    const SHOOT_BOOST_DEFAULT = 200;
    const SHOOT_BOOST_MIN = 50;
    const SHOOT_BOOST_MAX = 500;
    const SHOOT_BOOST_STEP = 50;
    const AUTO_AIM_TRIGGER_THRESHOLD = 0.55;
    const AUTO_AIM_MIN_FLIGHT_TIME = 0.90;
    const AUTO_AIM_MAX_FLIGHT_TIME = 2.40;
    const AUTO_AIM_TIME_BASE = 0.72;
    const AUTO_AIM_METERS_PER_SECOND = 24.0;
    const AUTO_AIM_GATE_HEIGHT = 0.55;
    const AUTO_AIM_GATE_DROP_SPEED = 3.25;
    const AUTO_AIM_OWNERSHIP_ATTEMPTS = 4;
    const HOOP_CACHE_SECONDS = 5.0;
    const POINTS_PER_SHOT_CHOICES = [1, 2, 4, 6, 8, 10, 12];

    // Ball orbit. Balls are steered with rigidbody velocity so Normcore keeps interpolating them for
    // everyone; ownership is requested at most once per second per ball and never for held balls.
    const ORBIT_RADIUS = 1.75;
    const ORBIT_ANGULAR_SPEED = 2.8;
    const ORBIT_HEIGHT = -0.15;
    const ORBIT_BOB = 0.25;
    const ORBIT_BOB_SPEED = 3.5;
    const ORBIT_GAIN = 8.0;
    const ORBIT_MAX_SPEED = 25.0;
    const ORBIT_MAX_BALLS = 16;
    const ORBIT_RESCAN_SECONDS = 0.5;
    const ORBIT_OWNERSHIP_CHECK_SECONDS = 0.2;
    const ORBIT_OWNERSHIP_RETRY_SECONDS = 1.0;
    const ORBIT_RELEASE_GRACE_SECONDS = 3.0;

    // Ball stack: balls held in spinning rings above your head, fired at the hoop while RT is held.
    const BALL_STACK_HEIGHT = 0.75;
    const BALL_STACK_RADIUS = 0.42;
    const BALL_STACK_LAYER_SPACING = 0.34;
    const BALL_STACK_PER_RING = 6;
    const BALL_STACK_SPIN = 1.2;
    const BALL_STACK_TRIGGER_THRESHOLD = 0.55;
    const BALL_STACK_FIRE_INTERVAL_SECONDS = 0.15;
    // The stack only fires at a hoop within this angle of where you're looking.
    const BALL_STACK_AIM_CONE_DEGREES = 40;

    // Grip spawn: a grip that hasn't picked anything up after this long spawns a ball into the hand.
    const GRIP_SPAWN_DELAY_SECONDS = 0.12;
    const GRIP_SPAWN_GRAB_DISTANCE = 0.6;
    const GRIP_SPAWN_DEFAULT_THRESHOLD = 0.6;

    // Score effects
    const RAINBOW_VFX_UPDATE_SECONDS = 0.04;
    const RAINBOW_VFX_HUE_CYCLES_PER_SECOND = 1.8;
    const GOLD_EXPLOSION_SKU = 100281;
    const GOLD_EXPLOSION_REFRESH_SECONDS = 0.75;
    // Room clients instantiate their own full score-effect prefabs, so sender-side particle caps
    // cannot protect other headsets. The catalog goes out through the game's normal synchronized
    // VFX path at a steady cadence, which also keeps Normcore from coalescing the updates.
    const ALL_SCORE_EFFECT_SKUS = [
        100278, 100279, 100280, 100281, 100282, 100298, 100311, 100312, 100314, 100320,
        100326, 100327, 100328, 100329, 100337, 100344, 100357, 100389, 100396, 100399,
        100494, 100505, 100552, 100569, 100774, 100842, 100955, 101034, 101035,
    ];
    const ALL_SCORE_EFFECTS_SYNC_INITIAL_DELAY_SECONDS = 0.75;
    const ALL_SCORE_EFFECTS_SYNC_INTERVAL_SECONDS = 1.0;
    const ALL_SCORE_EFFECTS_SYNC_SEQUENCE_COOLDOWN_SECONDS = 40.0;
    const ALL_SCORE_EFFECTS_SYNC_ECHO_WINDOW_SECONDS = 5.0;
    const ALL_SCORE_EFFECTS_SYNC_READY_TIMEOUT_SECONDS = 3.0;
    const ALL_SCORE_EFFECTS_SYNC_LOCK_RETRY_SECONDS = 0.10;
    const ALL_SCORE_EFFECTS_SYNC_POSITION_TOLERANCE_SQ = 0.0625;
    const ALL_SCORE_EFFECTS_MAX_ECHO_TOKENS = 32;
    const ALL_SCORE_EFFECTS_MAX_PARTICLES_PER_ROOT = 192;
    const ALL_SCORE_EFFECTS_ACTIVE_SECONDS = 3.5;
    const ALL_SCORE_EFFECTS_STOP_GRACE_SECONDS = 1.0;
    const ALL_SCORE_EFFECTS_CLEANUP_INTERVAL_SECONDS = 0.10;

    // Visuals
    const VISUAL_RESCAN_SECONDS = 0.50;
    const VISUAL_UPDATE_SECONDS = 1 / 30;
    const VISUAL_MAX_PLAYERS = 24;
    const VISUAL_MAX_BALLS = 32;

    // Exploits
    const HOOP_HITBOX_RESCAN_SECONDS = 1.0;
    // Steal ball: RT takes the ball your right hand points at (within the cone, any distance), or the
    // nearest one right next to the hand.
    const STEAL_BALL_TRIGGER_THRESHOLD = 0.55;
    const STEAL_BALL_CONE_DEGREES = 25;
    const STEAL_BALL_NEAR_DISTANCE = 1.5;
    const STEAL_BALL_MAX_DISTANCE = 40;
    const STEAL_BALL_TIMEOUT_SECONDS = 2.0;
    const STEAL_BALL_RETRY_SECONDS = 0.25;
    const STEAL_BALL_SLAP_RETRY_SECONDS = 0.6;

    // Progression, titles and unlock-all
    const LEVEL_INCREASE_CHOICES = [10, 20, 50, 100, 150, 200, 500];
    const LEVEL_ACTION_COOLDOWN_SECONDS = 1.0;
    const SESSION_LEVEL_REFRESH_SECONDS = 0.75;
    const TITLE_REFRESH_SECONDS = 0.5;
    const TITLE_MAX_ATTEMPTS = 3;
    const DEVELOPER_TITLE_SKU = 100269;
    const TITLE_ITEM_TYPE = 24;
    const SCORE_VFX_ITEM_TYPE = 27;
    // After a spawn the game loads your outfit itself; the saved one is checked once that's done.
    const OUTFIT_SETTLE_SECONDS = 2.0;
    const OUTFIT_REAPPLY_SECONDS = 0.5;
    const OUTFIT_REAPPLY_BURST = 6;
    const OUTFIT_MAX_ATTEMPTS = 3;

    // Config file: <game storage>/Overdose/config.json
    const CONFIG_DIRECTORY = "Overdose";
    const CONFIG_FILE = "config.json";
    const CONFIG_VERSION = 1;
    const CONFIG_SAVE_DELAY_SECONDS = 0.5;
    const LOG_FILE = "log.txt";
    // Soundboard: .wav files go in Overdose/Sounds; their voice-chat copies live in the cache.
    const SOUNDS_DIRECTORY = "Sounds";
    // Soundboard loudness: sounds are brought to full scale, then pushed this much louder with a
    // soft limiter. Vivox sends injected audio as-is, so quiet files come out much quieter than voice;
    // the top settings sound louder still but more distorted.
    const SOUND_BOOST_CHOICES = [1, 2, 3, 4, 6, 8, 10];
    const SOUND_BOOST_DEFAULT = 3;
    const SOUND_CACHE_DIRECTORY = ".soundcache";
    const PREVIOUS_LOG_FILE = "log.prev.txt";
    // PlayerPrefs keys from earlier versions, newest first; read once to seed the config file.
    const LEGACY_PREF_KEYS = {
        outfit: ["Overdose.UnlockAll.LockerItems.v1", "BigBallersMenu.UnlockAll.LockerItems.v1"],
        unlockAll: ["Overdose.UnlockAll.Enabled.v1", "Overdose.UnlockDevItems.Enabled.v1"],
        aimMode: ["Overdose.AutoAimMode.v1", "BigBallersMenu.AutoAimMode.v1"],
        aimGuide: ["Overdose.AutoAimLegit.v1", "BigBallersMenu.AutoAimLegit.v1"],
    };

    // ──────────────────────────────── Theme (Overdose "Red") ────────────────────────────────

    const rgb = (r, g, b) => [r / 255, g / 255, b / 255, 1];
    const shade = (color, factor) => [color[0] * factor, color[1] * factor, color[2] * factor, color[3]];

    // Overdose Menu.ColorTable[0] ("Red"): menu, disabled and enabled colors; the pointer uses the
    // menu color like Overdose's reference sphere.
    const THEME = {
        panel: rgb(235, 140, 140),
        button: rgb(210, 115, 115),
        buttonOn: rgb(195, 95, 95),
        text: [1, 1, 1, 1],
        pointer: rgb(235, 140, 140),
        outlineShade: 0.8,
        cornerRadius: 0.0035,
        outlineWidth: 0.0015,
    };

    // Overdose DefaultStyle geometry in menu-local meters. X points toward the viewer, Y runs to
    // the viewer's left and Z is up.
    const LAYOUT = {
        panel: { center: [0.04774, 0, -0.0016], size: [0.0054792, 0.27, 0.36] },
        title: { center: [0.0508, 0, 0.161], size: [0.2, 0.03] },
        topBar: {
            center: [0.04774, 0, 0.1991],
            size: [0.0054792, 0.24, 0.02736],
            text: [0.0508, 0, 0.1991],
            textSize: [0.21, 0.018],
        },
        rail: { center: [0.0542, -0.1607, -0.0016], size: [0.0054792, 0.045, 0.36], tilt: 15 },
        railButton: { x: 0.05565, y: -0.16031, size: [0.0070047, 0.035, 0.035], icon: 0.017 },
        railSlots: { home: 0.156, back: -0.117, settings: -0.1592 },
        row: {
            x: 0.051,
            z0: 0.1132,
            step: 0.0456,
            size: [0.009, 0.255, 0.032],
            narrowWidth: 0.18,
            textX: 0.0557,
            textSize: [0.2, 0.024],
            narrowTextSize: [0.16, 0.024],
        },
        increment: { y: 0.11101, size: [0.009, 0.033, 0.032], textSize: [0.03, 0.024] },
        page: { y: 0.0676, z: -0.1602, size: [0.009, 0.12, 0.032], textSize: [0.1, 0.022] },
    };

    // ─────────────────────────────────────── Math ───────────────────────────────────────

    const DEG = Math.PI / 180;
    const IDENTITY = [0, 0, 0, 1];
    const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
    const distanceSquared = (a, b) => {
        const dx = a[0] - b[0];
        const dy = a[1] - b[1];
        const dz = a[2] - b[2];
        return dx * dx + dy * dy + dz * dz;
    };

    function quatMul(a, b) {
        return [
            a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
            a[3] * b[1] + a[1] * b[3] + a[2] * b[0] - a[0] * b[2],
            a[3] * b[2] + a[2] * b[3] + a[0] * b[1] - a[1] * b[0],
            a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
        ];
    }

    // Matches UnityEngine.Quaternion.Euler: z, then x, then y.
    function quatFromEuler(x, y, z) {
        const qx = [Math.sin(x * DEG / 2), 0, 0, Math.cos(x * DEG / 2)];
        const qy = [0, Math.sin(y * DEG / 2), 0, Math.cos(y * DEG / 2)];
        const qz = [0, 0, Math.sin(z * DEG / 2), Math.cos(z * DEG / 2)];
        return quatMul(quatMul(qy, qx), qz);
    }

    function hsvToRgb(hue, saturation, value) {
        const h = ((hue % 1) + 1) % 1 * 6;
        const sector = Math.floor(h);
        const f = h - sector;
        const p = value * (1 - saturation);
        const q = value * (1 - saturation * f);
        const t = value * (1 - saturation * (1 - f));
        switch (sector) {
            case 0: return [value, t, p, 1];
            case 1: return [q, value, p, 1];
            case 2: return [p, value, t, 1];
            case 3: return [p, q, value, 1];
            case 4: return [t, p, value, 1];
            default: return [value, p, q, 1];
        }
    }

    const TEXT_ROTATION = quatFromEuler(180, 90, 90);
    const MENU_TILT_ROTATION = quatFromEuler(MENU_HAND_TILT[0], MENU_HAND_TILT[1], MENU_HAND_TILT[2]);
    const RAIL_ROTATION = quatFromEuler(0, 0, LAYOUT.rail.tilt);

    // ──────────────────────────────────── Runtime core ────────────────────────────────────

    const clock = () => Date.now() / 1000;

    // Also written to Overdose/log.txt once the config folder is known (see openLogFile), so the
    // lines before a crash can be read afterwards.
    const logSink = { file: null };

    function log(message) {
        console.log(message);
        if (logSink.file === null)
            return;
        try {
            logSink.file.write(`${message}\n`);
            logSink.file.flush();
        }
        catch (_) {
            logSink.file = null;
        }
    }

    const throttledLogTimes = new Map();
    function logThrottled(key, intervalSeconds, message) {
        const now = clock();
        if ((throttledLogTimes.get(key) ?? 0) > now)
            return;
        throttledLogTimes.set(key, now + intervalSeconds);
        log(message);
    }

    const loggedOnce = new Set();
    function logOnce(key, message) {
        if (loggedOnce.has(key))
            return;
        loggedOnce.add(key);
        log(message);
    }

    // The locker hooks are chatty; their step-by-step trace only prints with LOCKER_DEBUG.
    function lockerLog(message) {
        if (LOCKER_DEBUG)
            log(message);
    }

    function openImage(name) {
        try {
            return Il2Cpp.domain.assembly(name).image;
        }
        catch (_) {
            return null;
        }
    }

    function findClass(image, name) {
        if (!image)
            return null;
        try {
            return image.class(name);
        }
        catch (_) {
            return null;
        }
    }

    function requireClass(image, name) {
        const klass = findClass(image, name);
        if (!klass)
            throw new Error(`class ${name} is missing`);
        return klass;
    }

    function findMethod(klass, name, argc, types) {
        if (!klass)
            return null;
        try {
            let method = argc === undefined ? klass.method(name) : klass.method(name, argc);
            if (types)
                method = method.overload(...types);
            return method;
        }
        catch (_) {
            return null;
        }
    }

    // Binds a method to its memoized NativeFunction. Callers pass raw values: pointers (or anything
    // with a .handle), numbers, 0/1 for bools and [x, y, z] arrays for structs. Struct returns come
    // back as arrays and object returns as NativePointers.
    function bind(klass, name, argc, types) {
        const method = findMethod(klass, name, argc, types);
        const label = `${klass ? klass.name : "?"}.${name}`;
        if (!method) {
            const missing = () => {
                throw new Error(`${label} is unavailable`);
            };
            missing.available = false;
            return missing;
        }
        const native = method.nativeFunction;
        // Methods of generic classes (e.g. RealtimeComponent<T>) take their MethodInfo* as a
        // trailing hidden argument.
        const hidden = method.isInflated ? [method.handle] : [];
        const call = method.isStatic
            ? (...args) => native(...args, ...hidden)
            : (self, ...args) => native(self, ...args, ...hidden);
        call.available = true;
        return call;
    }

    // Replaces a method through the bridge. makeImplementation receives the original as
    // (self, ...args) for instance methods or (...args) for static ones.
    function hookMethod(klass, name, argc, types, makeImplementation) {
        const method = findMethod(klass, name, argc, types);
        if (!method) {
            log(`hook skipped: ${klass ? klass.name : "?"}.${name} not found`);
            return false;
        }
        const original = method.isStatic
            ? (...args) => method.invoke(...args)
            : (self, ...args) => method.invokeRaw(self, ...args);
        method.implementation = makeImplementation(original);
        return true;
    }

    function toPointer(value) {
        if (value === null || value === undefined)
            return NULL;
        if (value instanceof NativePointer)
            return value;
        const handle = value.handle;
        return handle instanceof NativePointer ? handle : NULL;
    }

    const isLive = (value) => !toPointer(value).isNull();
    const keyOf = (value) => toPointer(value).toString();

    function sameObject(left, right) {
        const a = toPointer(left);
        return !a.isNull() && a.equals(toPointer(right));
    }

    // UnityEngine.Object wrappers outlive their native objects across map unloads; m_CachedPtr is
    // what Object.op_Implicit checks.
    let cachedPtrOffset = 0x10;
    function unityAlive(value) {
        const pointer = toPointer(value);
        if (pointer.isNull())
            return false;
        try {
            return !pointer.add(cachedPtrOffset).readPointer().isNull();
        }
        catch (_) {
            return false;
        }
    }

    function fieldOffset(klass, name) {
        if (!klass)
            return -1;
        try {
            const field = klass.field(name);
            return field.isStatic ? -1 : field.offset;
        }
        catch (_) {
            return -1;
        }
    }

    // Offsets for fields of whatever class the object really is, cached per class.
    const runtimeOffsets = new Map();
    function runtimeFieldOffset(objectPointer, name) {
        const klass = new Il2Cpp.Object(toPointer(objectPointer)).class;
        const key = `${klass.handle}:${name}`;
        let offset = runtimeOffsets.get(key);
        if (offset === undefined) {
            offset = fieldOffset(klass, name);
            runtimeOffsets.set(key, offset);
        }
        return offset;
    }

    const readPointerAt = (base, offset) => offset < 0 ? NULL : toPointer(base).add(offset).readPointer();
    const readFloatAt = (base, offset) => toPointer(base).add(offset).readFloat();
    const readIntAt = (base, offset) => toPointer(base).add(offset).readS32();
    const readBoolAt = (base, offset) => toPointer(base).add(offset).readU8() !== 0;
    const writeFloatAt = (base, offset, value) => toPointer(base).add(offset).writeFloat(value);
    const writeBoolAt = (base, offset, value) => toPointer(base).add(offset).writeU8(value ? 1 : 0);
    const readVector3At = (base, offset) => {
        const pointer = toPointer(base).add(offset);
        return [pointer.readFloat(), pointer.add(4).readFloat(), pointer.add(8).readFloat()];
    };

    function staticReader(klass, name) {
        let field = null;
        try {
            field = klass ? klass.field(name) : null;
        }
        catch (_) { }
        if (!field)
            return () => NULL;
        const buffer = Memory.alloc(Process.pointerSize);
        return () => {
            try {
                buffer.writePointer(NULL);
                Il2Cpp.exports.fieldGetStaticValue(field, buffer);
                return buffer.readPointer();
            }
            catch (_) {
                return NULL;
            }
        };
    }

    // Constant strings (labels, keys, property names) are allocated once and pinned, so no call
    // allocates a managed string per frame and none can be collected mid-call.
    const managedStrings = new Map();
    function managed(text) {
        const value = String(text);
        const cached = managedStrings.get(value);
        if (cached)
            return cached.pointer;
        const string = Il2Cpp.string(value);
        if (managedStrings.size < 4096) {
            managedStrings.set(value, { pointer: string.handle, handle: string.object.ref(true) });
        }
        return string.handle;
    }

    function readString(value) {
        const pointer = toPointer(value);
        if (pointer.isNull())
            return "";
        try {
            return new Il2Cpp.String(pointer).content ?? "";
        }
        catch (_) {
            return "";
        }
    }

    const pinObject = (value) => new Il2Cpp.Object(toPointer(value)).ref(true);
    const describeError = (error) => (error && error.stack) ? error.stack : String(error);

    // Unity only holds the managed wrappers of engine objects weakly, and nothing managed points at
    // the objects this script creates, so a garbage collection can reclaim a wrapper we still hold;
    // the next call through it then touches freed memory (an access violation at a garbage address).
    // Wrappers held across frames are pinned in a scope, a plain array of GC handles that is released
    // together when its owner goes away.
    function keep(scope, value) {
        const pointer = toPointer(value);
        if (!pointer.isNull())
            scope.push(new Il2Cpp.Object(pointer).ref(true));
        return pointer;
    }

    function releaseScope(scope) {
        for (const handle of scope.splice(0)) {
            try {
                handle.free();
            }
            catch (_) { }
        }
    }

    let arrayHeaderSize = Process.pointerSize * 4;
    function arrayLength(arrayPointer) {
        const pointer = toPointer(arrayPointer);
        return pointer.isNull() ? 0 : pointer.add(arrayHeaderSize - Process.pointerSize).readU32();
    }

    // Result arrays (FindObjectsOfType, GetComponentsInChildren, ...) are referenced by nothing else,
    // so they stay pinned while their elements are read.
    function arrayItems(arrayPointer, limit = Infinity) {
        const pointer = toPointer(arrayPointer);
        const items = [];
        if (pointer.isNull())
            return items;
        const handle = pinObject(pointer);
        try {
            const length = Math.min(arrayLength(pointer), limit);
            const base = pointer.add(arrayHeaderSize);
            for (let index = 0; index < length; index++)
                items.push(base.add(index * Process.pointerSize).readPointer());
        }
        finally {
            try {
                handle.free();
            }
            catch (_) { }
        }
        return items;
    }

    const listLayouts = new Map();
    function listItems(listPointer, limit = Infinity) {
        const pointer = toPointer(listPointer);
        if (pointer.isNull())
            return [];
        const klass = new Il2Cpp.Object(pointer).class;
        const key = klass.handle.toString();
        let layout = listLayouts.get(key);
        if (!layout) {
            layout = { items: fieldOffset(klass, "_items"), size: fieldOffset(klass, "_size") };
            listLayouts.set(key, layout);
        }
        if (layout.items < 0 || layout.size < 0)
            return [];
        const size = pointer.add(layout.size).readS32();
        return arrayItems(pointer.add(layout.items).readPointer(), Math.min(size, limit));
    }

    const typeObjects = new Map();
    function typeOf(klass) {
        const key = klass.handle.toString();
        let pointer = typeObjects.get(key);
        if (!pointer) {
            pointer = klass.type.object.handle;
            typeObjects.set(key, pointer);
        }
        return pointer;
    }

    // ──────────────────────────────────── Unity bindings ────────────────────────────────────

    const images = {
        core: openImage("UnityEngine.CoreModule"),
        physics: openImage("UnityEngine.PhysicsModule"),
        ui: openImage("UnityEngine.UI"),
        uiModule: openImage("UnityEngine.UIModule"),
        textRendering: openImage("UnityEngine.TextRenderingModule"),
        xr: openImage("UnityEngine.XRModule"),
        particles: openImage("UnityEngine.ParticleSystemModule"),
        audio: openImage("UnityEngine.AudioModule"),
        vivox: openImage("Unity.Services.Vivox"),
        game: openImage("DLAssembly"),
        extra: openImage("BBBAssembly"),
    };

    const Unity = {
        Object: requireClass(images.core, "UnityEngine.Object"),
        GameObject: requireClass(images.core, "UnityEngine.GameObject"),
        Component: requireClass(images.core, "UnityEngine.Component"),
        Behaviour: requireClass(images.core, "UnityEngine.Behaviour"),
        Transform: requireClass(images.core, "UnityEngine.Transform"),
        RectTransform: requireClass(images.core, "UnityEngine.RectTransform"),
        Renderer: requireClass(images.core, "UnityEngine.Renderer"),
        MeshRenderer: requireClass(images.core, "UnityEngine.MeshRenderer"),
        MeshFilter: requireClass(images.core, "UnityEngine.MeshFilter"),
        Mesh: requireClass(images.core, "UnityEngine.Mesh"),
        Material: requireClass(images.core, "UnityEngine.Material"),
        Shader: requireClass(images.core, "UnityEngine.Shader"),
        Camera: requireClass(images.core, "UnityEngine.Camera"),
        Resources: requireClass(images.core, "UnityEngine.Resources"),
        SceneManager: requireClass(images.core, "UnityEngine.SceneManagement.SceneManager"),
        Scene: requireClass(images.core, "UnityEngine.SceneManagement.Scene"),
        Vector3: requireClass(images.core, "UnityEngine.Vector3"),
        Color: requireClass(images.core, "UnityEngine.Color"),
        MaterialPropertyBlock: requireClass(images.core, "UnityEngine.MaterialPropertyBlock"),
        PlayerPrefs: requireClass(images.core, "UnityEngine.PlayerPrefs"),
        LineRenderer: requireClass(images.core, "UnityEngine.LineRenderer"),
        Rigidbody: requireClass(images.physics, "UnityEngine.Rigidbody"),
        Collider: requireClass(images.physics, "UnityEngine.Collider"),
        BoxCollider: requireClass(images.physics, "UnityEngine.BoxCollider"),
        SphereCollider: requireClass(images.physics, "UnityEngine.SphereCollider"),
        CapsuleCollider: requireClass(images.physics, "UnityEngine.CapsuleCollider"),
        Physics: requireClass(images.physics, "UnityEngine.Physics"),
        Canvas: requireClass(images.uiModule, "UnityEngine.Canvas"),
        CanvasScaler: requireClass(images.ui, "UnityEngine.UI.CanvasScaler"),
        Graphic: requireClass(images.ui, "UnityEngine.UI.Graphic"),
        Text: requireClass(images.ui, "UnityEngine.UI.Text"),
        Font: requireClass(images.textRendering, "UnityEngine.Font"),
        InputDevices: findClass(images.xr, "UnityEngine.XR.InputDevices"),
        ParticleSystem: findClass(images.particles, "UnityEngine.ParticleSystem"),
        ParticleSystemRenderer: findClass(images.particles, "UnityEngine.ParticleSystemRenderer"),
        Int32: Il2Cpp.corlib.class("System.Int32"),
    };

    const U = {
        destroy: bind(Unity.Object, "Destroy", 1, ["UnityEngine.Object"]),
        dontDestroyOnLoad: bind(Unity.Object, "DontDestroyOnLoad", 1),
        findObjectsOfType: bind(Unity.Object, "FindObjectsOfType", 1, ["System.Type"]),
        objectName: bind(Unity.Object, "get_name", 0),
        setObjectName: bind(Unity.Object, "set_name", 1),
        setHideFlags: bind(Unity.Object, "set_hideFlags", 1),
        newGameObject: bind(Unity.GameObject, ".ctor", 1, ["System.String"]),
        createPrimitive: bind(Unity.GameObject, "CreatePrimitive", 1),
        addComponent: bind(Unity.GameObject, "AddComponent", 1, ["System.Type"]),
        getComponent: bind(Unity.GameObject, "GetComponent", 1, ["System.Type"]),
        getComponentInChildren: bind(Unity.GameObject, "GetComponentInChildren", 2, ["System.Type", "System.Boolean"]),
        getComponentsInChildren: bind(Unity.GameObject, "GetComponentsInChildren", 2, ["System.Type", "System.Boolean"]),
        setActive: bind(Unity.GameObject, "SetActive", 1),
        findGameObject: bind(Unity.GameObject, "Find", 1),
        setLayer: bind(Unity.GameObject, "set_layer", 1),
        gameObjectTransform: bind(Unity.GameObject, "get_transform", 0),
        activeInHierarchy: bind(Unity.GameObject, "get_activeInHierarchy", 0),
        componentTransform: bind(Unity.Component, "get_transform", 0),
        componentGameObject: bind(Unity.Component, "get_gameObject", 0),
        componentGetComponent: bind(Unity.Component, "GetComponent", 1, ["System.Type"]),
        activeAndEnabled: bind(Unity.Behaviour, "get_isActiveAndEnabled", 0),
        position: bind(Unity.Transform, "get_position", 0),
        setPosition: bind(Unity.Transform, "set_position", 1),
        rotation: bind(Unity.Transform, "get_rotation", 0),
        setLocalPosition: bind(Unity.Transform, "set_localPosition", 1),
        setLocalRotation: bind(Unity.Transform, "set_localRotation", 1),
        setLocalScale: bind(Unity.Transform, "set_localScale", 1),
        lossyScale: bind(Unity.Transform, "get_lossyScale", 0),
        setParent: bind(Unity.Transform, "SetParent", 2, ["UnityEngine.Transform", "System.Boolean"]),
        parent: bind(Unity.Transform, "get_parent", 0),
        forward: bind(Unity.Transform, "get_forward", 0),
        right: bind(Unity.Transform, "get_right", 0),
        transformPoint: bind(Unity.Transform, "TransformPoint", 3, ["System.Single", "System.Single", "System.Single"]),
        inverseTransformPoint: bind(Unity.Transform, "InverseTransformPoint", 3, ["System.Single", "System.Single", "System.Single"]),
        setPositionAndRotation: bind(Unity.Transform, "SetPositionAndRotation", 2),
        childCount: bind(Unity.Transform, "get_childCount", 0),
        child: bind(Unity.Transform, "GetChild", 1),
        setSizeDelta: bind(Unity.RectTransform, "set_sizeDelta", 1),
        setSharedMaterial: bind(Unity.Renderer, "set_sharedMaterial", 1),
        setShadowCasting: bind(Unity.Renderer, "set_shadowCastingMode", 1),
        setReceiveShadows: bind(Unity.Renderer, "set_receiveShadows", 1),
        setAllowOcclusion: bind(Unity.Renderer, "set_allowOcclusionWhenDynamic", 1),
        setPropertyBlock: bind(Unity.Renderer, "SetPropertyBlock", 1),
        getPropertyBlock: bind(Unity.Renderer, "GetPropertyBlock", 1),
        setSharedMesh: bind(Unity.MeshFilter, "set_sharedMesh", 1),
        newMesh: bind(Unity.Mesh, ".ctor", 0),
        meshSetVertices: bind(Unity.Mesh, "set_vertices", 1),
        meshSetColors: bind(Unity.Mesh, "set_colors", 1),
        meshSetTriangles: bind(Unity.Mesh, "set_triangles", 1),
        meshRecalculateBounds: bind(Unity.Mesh, "RecalculateBounds", 0),
        meshRecalculateNormals: bind(Unity.Mesh, "RecalculateNormals", 0),
        newMaterialFromShader: bind(Unity.Material, ".ctor", 1, ["UnityEngine.Shader"]),
        newMaterialCopy: bind(Unity.Material, ".ctor", 1, ["UnityEngine.Material"]),
        defaultLineMaterial: bind(Unity.Material, "GetDefaultLineMaterial", 0),
        materialSetColor: bind(Unity.Material, "SetColor", 2, ["System.String", "UnityEngine.Color"]),
        materialSetFloat: bind(Unity.Material, "SetFloat", 2, ["System.String", "System.Single"]),
        materialSetInt: bind(Unity.Material, "SetInt", 2, ["System.String", "System.Int32"]),
        materialColor: bind(Unity.Material, "set_color", 1),
        materialHasProperty: bind(Unity.Material, "HasProperty", 1, ["System.String"]),
        materialEnableKeyword: bind(Unity.Material, "EnableKeyword", 1, ["System.String"]),
        materialDisableKeyword: bind(Unity.Material, "DisableKeyword", 1, ["System.String"]),
        materialRenderQueue: bind(Unity.Material, "set_renderQueue", 1),
        materialOverrideTag: bind(Unity.Material, "SetOverrideTag", 2),
        shaderFind: bind(Unity.Shader, "Find", 1),
        propertyToId: bind(Unity.Shader, "PropertyToID", 1, ["System.String"]),
        findObjectsOfTypeAll: bind(Unity.Resources, "FindObjectsOfTypeAll", 1, ["System.Type"]),
        builtinResource: bind(Unity.Resources, "GetBuiltinResource", 2, ["System.Type", "System.String"]),
        cullingMask: bind(Unity.Camera, "get_cullingMask", 0),
        setCullingMask: bind(Unity.Camera, "set_cullingMask", 1),
        rbPosition: bind(Unity.Rigidbody, "get_position", 0),
        rbSetPosition: bind(Unity.Rigidbody, "set_position", 1),
        rbVelocity: bind(Unity.Rigidbody, "get_linearVelocity", 0),
        rbSetVelocity: bind(Unity.Rigidbody, "set_linearVelocity", 1),
        rbAngularVelocity: bind(Unity.Rigidbody, "get_angularVelocity", 0),
        rbUseGravity: bind(Unity.Rigidbody, "get_useGravity", 0),
        rbSetUseGravity: bind(Unity.Rigidbody, "set_useGravity", 1),
        rbIsKinematic: bind(Unity.Rigidbody, "get_isKinematic", 0),
        rbSetIsKinematic: bind(Unity.Rigidbody, "set_isKinematic", 1),
        rbWakeUp: bind(Unity.Rigidbody, "WakeUp", 0),
        rbDamping: bind(Unity.Rigidbody, "get_linearDamping", 0),
        rbMovePosition: bind(Unity.Rigidbody, "MovePosition", 1),
        gravity: bind(Unity.Physics, "get_gravity", 0),
        syncTransforms: bind(Unity.Physics, "SyncTransforms", 0),
        ignoreCollision: bind(Unity.Physics, "IgnoreCollision", 3),
        boxSize: bind(Unity.BoxCollider, "get_size", 0),
        setBoxSize: bind(Unity.BoxCollider, "set_size", 1),
        sphereRadius: bind(Unity.SphereCollider, "get_radius", 0),
        setSphereRadius: bind(Unity.SphereCollider, "set_radius", 1),
        capsuleRadius: bind(Unity.CapsuleCollider, "get_radius", 0),
        setCapsuleRadius: bind(Unity.CapsuleCollider, "set_radius", 1),
        capsuleHeight: bind(Unity.CapsuleCollider, "get_height", 0),
        setCapsuleHeight: bind(Unity.CapsuleCollider, "set_height", 1),
        canvasRenderMode: bind(Unity.Canvas, "set_renderMode", 1),
        scalerPixelsPerUnit: bind(Unity.CanvasScaler, "set_dynamicPixelsPerUnit", 1),
        textSet: bind(Unity.Text, "set_text", 1),
        textFont: bind(Unity.Text, "set_font", 1),
        textFontSize: bind(Unity.Text, "set_fontSize", 1),
        textFontStyle: bind(Unity.Text, "set_fontStyle", 1),
        textAlignment: bind(Unity.Text, "set_alignment", 1),
        textBestFit: bind(Unity.Text, "set_resizeTextForBestFit", 1),
        textMinSize: bind(Unity.Text, "set_resizeTextMinSize", 1),
        textRichText: bind(Unity.Text, "set_supportRichText", 1),
        graphicColor: bind(Unity.Graphic, "set_color", 1),
        graphicRaycastTarget: bind(Unity.Graphic, "set_raycastTarget", 1),
        linePositionCount: bind(Unity.LineRenderer, "set_positionCount", 1),
        lineSetPosition: bind(Unity.LineRenderer, "SetPosition", 2),
        lineStartWidth: bind(Unity.LineRenderer, "set_startWidth", 1),
        lineEndWidth: bind(Unity.LineRenderer, "set_endWidth", 1),
        lineStartColor: bind(Unity.LineRenderer, "set_startColor", 1),
        lineEndColor: bind(Unity.LineRenderer, "set_endColor", 1),
        lineWorldSpace: bind(Unity.LineRenderer, "set_useWorldSpace", 1),
        lineCapVertices: bind(Unity.LineRenderer, "set_numCapVertices", 1),
        lineAlignment: bind(Unity.LineRenderer, "set_alignment", 1),
        particleIsAlive: bind(Unity.ParticleSystem, "IsAlive", 1, ["System.Boolean"]),
        particleStop: bind(Unity.ParticleSystem, "Stop", 2),
        particleClear: bind(Unity.ParticleSystem, "Clear", 1, ["System.Boolean"]),
        particleMax: bind(Unity.ParticleSystem, "get_maxParticles", 0),
        particleSetMax: bind(Unity.ParticleSystem, "set_maxParticles", 1),
        newPropertyBlock: bind(Unity.MaterialPropertyBlock, ".ctor", 0),
        blockSetColor: bind(Unity.MaterialPropertyBlock, "SetColor", 2, ["System.Int32", "UnityEngine.Color"]),
        blockDispose: bind(Unity.MaterialPropertyBlock, "Dispose", 0),
        prefsGetInt: bind(Unity.PlayerPrefs, "GetInt", 2),
        prefsGetString: bind(Unity.PlayerPrefs, "GetString", 2),
        xrFeatureBool: bind(Unity.InputDevices, "TryGetFeatureValue_bool", 3),
    };

    const sceneMethods = {
        active: findMethod(Unity.SceneManager, "GetActiveScene", 0),
        name: findMethod(Unity.Scene, "get_name", 0),
        hash: findMethod(Unity.Scene, "GetHashCode", 0),
    };

    // ─────────────────────────────────── Unity helpers ───────────────────────────────────

    const HIDE_DONT_UNLOAD = 32;
    const PRIMITIVE_SPHERE = 0;

    function destroyObject(value) {
        if (!unityAlive(value))
            return;
        try {
            U.destroy(toPointer(value));
        }
        catch (_) { }
    }

    function gameObjectOf(component) {
        try {
            const gameObject = U.componentGameObject(toPointer(component));
            return unityAlive(gameObject) ? gameObject : NULL;
        }
        catch (_) {
            return NULL;
        }
    }

    function componentsInChildren(gameObject, klass, limit = Infinity) {
        if (!klass || !unityAlive(gameObject))
            return [];
        try {
            return arrayItems(U.getComponentsInChildren(toPointer(gameObject), typeOf(klass), 1), limit);
        }
        catch (_) {
            return [];
        }
    }

    function objectsOfType(klass, limit = Infinity) {
        if (!klass)
            return [];
        try {
            return arrayItems(U.findObjectsOfType(typeOf(klass)), limit);
        }
        catch (_) {
            return [];
        }
    }

    function createGameObject(scope, name, parentTransform = NULL) {
        const gameObject = keep(scope, Unity.GameObject.alloc());
        U.newGameObject(gameObject, managed(name));
        U.setLayer(gameObject, MENU_LAYER);
        const transform = keep(scope, U.gameObjectTransform(gameObject));
        if (!parentTransform.isNull())
            U.setParent(transform, parentTransform, 0);
        return { gameObject, transform };
    }

    function placeLocal(transform, position, rotation, scale) {
        U.setLocalPosition(transform, position);
        U.setLocalRotation(transform, rotation);
        U.setLocalScale(transform, scale);
    }

    function prepareRenderer(renderer, material) {
        U.setSharedMaterial(renderer, material);
        try {
            U.setShadowCasting(renderer, 0);
            U.setReceiveShadows(renderer, 0);
            U.setAllowOcclusion(renderer, 0);
        }
        catch (_) { }
    }

    function createMeshObject(scope, name, parentTransform, position, rotation, scale, mesh, material) {
        const object = createGameObject(scope, name, parentTransform);
        placeLocal(object.transform, position, rotation, scale);
        U.setSharedMesh(U.addComponent(object.gameObject, typeOf(Unity.MeshFilter)), mesh);
        const renderer = U.addComponent(object.gameObject, typeOf(Unity.MeshRenderer));
        prepareRenderer(renderer, material);
        return { ...object, renderer };
    }

    // ──────────────────────────────────── Materials ────────────────────────────────────

    // Flat colors need an unlit shader. URP/Unlit is preferred; Internal-Colored (the default line
    // material's shader) and the old lit/sprite paths are fallbacks.
    const FLAT_SHADER_CANDIDATES = [
        ["Universal Render Pipeline/Unlit", "unlit"],
        ["Hidden/Internal-Colored", "colored"],
        ["Universal Render Pipeline/Simple Lit", "lit"],
        ["Universal Render Pipeline/Lit", "lit"],
        ["Sprites/Default", "sprite"],
        ["UI/Default", "sprite"],
    ];
    let flatShader = null;

    function residentShaders() {
        const shaders = new Map();
        try {
            for (const shader of arrayItems(U.findObjectsOfTypeAll(typeOf(Unity.Shader)))) {
                if (!unityAlive(shader))
                    continue;
                const name = readString(U.objectName(shader));
                if (name && !shaders.has(name))
                    shaders.set(name, shader);
            }
        }
        catch (error) {
            log(`shader scan failed: ${error}`);
        }
        return shaders;
    }

    function resolveFlatShader() {
        if (flatShader && unityAlive(flatShader.pointer))
            return flatShader;
        flatShader = null;
        const resident = residentShaders();
        for (const [name, kind] of FLAT_SHADER_CANDIDATES) {
            let shader = resident.get(name) ?? NULL;
            if (!unityAlive(shader)) {
                try {
                    shader = U.shaderFind(managed(name));
                }
                catch (_) {
                    shader = NULL;
                }
            }
            if (unityAlive(shader)) {
                flatShader = { pointer: shader, kind, handle: pinObject(shader) };
                log(`menu shader: ${name}`);
                return flatShader;
            }
        }
        throw new Error("no usable menu shader found");
    }

    function trySetColor(material, name, color) {
        try {
            U.materialSetColor(material, managed(name), color);
        }
        catch (_) { }
    }

    function trySetFloat(material, name, value) {
        try {
            U.materialSetFloat(material, managed(name), value);
        }
        catch (_) { }
    }

    function tryKeyword(material, keyword, enabled) {
        try {
            (enabled ? U.materialEnableKeyword : U.materialDisableKeyword)(material, managed(keyword));
        }
        catch (_) { }
    }

    function configureOpaque(material) {
        trySetFloat(material, "_ZWrite", 1);
        trySetFloat(material, "_ZTest", 4);
        trySetFloat(material, "_SrcBlend", 1);
        trySetFloat(material, "_DstBlend", 0);
        trySetFloat(material, "_Cull", 0);
        tryKeyword(material, "_ALPHABLEND_ON", false);
        tryKeyword(material, "_ALPHAPREMULTIPLY_ON", false);
        try {
            U.materialOverrideTag(material, managed("RenderType"), managed("Opaque"));
        }
        catch (_) { }
    }

    const flatMaterials = new Map();
    function flatMaterial(color) {
        const key = color.map((component) => component.toFixed(4)).join(",");
        const cached = flatMaterials.get(key);
        if (cached && unityAlive(cached.pointer))
            return cached.pointer;
        if (cached) {
            try {
                cached.handle.free();
            }
            catch (_) { }
        }
        const shader = resolveFlatShader();
        const material = Unity.Material.alloc().handle;
        const handle = pinObject(material);
        U.newMaterialFromShader(material, shader.pointer);
        switch (shader.kind) {
            case "unlit":
                trySetColor(material, "_BaseColor", color);
                trySetColor(material, "_Color", color);
                trySetFloat(material, "_Surface", 0);
                trySetFloat(material, "_Cull", 0);
                break;
            case "colored":
                trySetColor(material, "_Color", color);
                configureOpaque(material);
                break;
            case "lit":
                trySetColor(material, "_BaseColor", color);
                trySetColor(material, "_Color", color);
                trySetColor(material, "_EmissionColor", [color[0] * 0.85, color[1] * 0.85, color[2] * 0.85, 1]);
                tryKeyword(material, "_EMISSION", true);
                trySetFloat(material, "_Smoothness", 0);
                trySetFloat(material, "_Metallic", 0);
                trySetFloat(material, "_Surface", 0);
                tryKeyword(material, "_SURFACE_TYPE_TRANSPARENT", false);
                configureOpaque(material);
                break;
            default:
                try {
                    U.materialColor(material, color);
                }
                catch (_) { }
                configureOpaque(material);
                break;
        }
        try {
            U.materialRenderQueue(material, 2000);
        }
        catch (_) { }
        try {
            U.setHideFlags(material, HIDE_DONT_UNLOAD);
        }
        catch (_) { }
        flatMaterials.set(key, { pointer: material, handle });
        return material;
    }

    // ───────────────────────────────────── Meshes ─────────────────────────────────────

    function newValueArray(klass, count, stride, write) {
        const array = Il2Cpp.array(klass, count);
        let cursor = array.handle.add(arrayHeaderSize);
        for (let index = 0; index < count; index++) {
            write(cursor, index);
            cursor = cursor.add(stride);
        }
        return { pointer: array.handle };
    }

    function buildMesh(vertices, triangles) {
        const mesh = Unity.Mesh.alloc().handle;
        const handle = pinObject(mesh);
        try {
            U.newMesh(mesh);
            const vertexArray = newValueArray(Unity.Vector3, vertices.length, 12, (cursor, index) => {
                cursor.writeFloat(vertices[index][0]);
                cursor.add(4).writeFloat(vertices[index][1]);
                cursor.add(8).writeFloat(vertices[index][2]);
            });
            U.meshSetVertices(mesh, vertexArray.pointer);
            // White vertex colors: vertex-colored fallback shaders multiply by them.
            const colorArray = newValueArray(Unity.Color, vertices.length, 16, (cursor) => {
                cursor.writeFloat(1);
                cursor.add(4).writeFloat(1);
                cursor.add(8).writeFloat(1);
                cursor.add(12).writeFloat(1);
            });
            U.meshSetColors(mesh, colorArray.pointer);
            const triangleArray = newValueArray(Unity.Int32, triangles.length, 4, (cursor, index) => {
                cursor.writeS32(triangles[index]);
            });
            U.meshSetTriangles(mesh, triangleArray.pointer);
            U.meshRecalculateBounds(mesh);
            U.meshRecalculateNormals(mesh);
            try {
                U.setHideFlags(mesh, HIDE_DONT_UNLOAD);
            }
            catch (_) { }
        }
        catch (error) {
            try {
                handle.free();
            }
            catch (_) { }
            throw error;
        }
        return { pointer: mesh, handle };
    }

    // Convex outlines in the Y/Z plane, extruded along X from -0.5 to 0.5.
    function extrudeOutlines(outlines) {
        const vertices = [];
        const triangles = [];
        for (const outline of outlines) {
            const count = outline.length;
            const base = vertices.length;
            let centerY = 0;
            let centerZ = 0;
            for (const [y, z] of outline) {
                vertices.push([0.5, y, z]);
                centerY += y / count;
                centerZ += z / count;
            }
            for (const [y, z] of outline)
                vertices.push([-0.5, y, z]);
            const front = vertices.length;
            vertices.push([0.5, centerY, centerZ]);
            const back = vertices.length;
            vertices.push([-0.5, centerY, centerZ]);
            for (let index = 0; index < count; index++) {
                const next = (index + 1) % count;
                triangles.push(front, base + index, base + next);
                triangles.push(back, base + count + next, base + count + index);
                triangles.push(base + index, base + count + index, base + count + next);
                triangles.push(base + index, base + count + next, base + next);
            }
        }
        return buildMesh(vertices, triangles);
    }

    const meshCache = new Map();
    function cachedMesh(key, build) {
        const cached = meshCache.get(key);
        if (cached && unityAlive(cached.pointer))
            return cached.pointer;
        if (cached) {
            try {
                cached.handle.free();
            }
            catch (_) { }
        }
        const mesh = build();
        meshCache.set(key, mesh);
        return mesh.pointer;
    }

    function roundedBoxMesh(width, height, radius) {
        const key = `rounded:${width.toFixed(5)}:${height.toFixed(5)}:${radius.toFixed(5)}`;
        return cachedMesh(key, () => {
            const ny = clamp(radius / Math.max(width, 0.001), 0.001, 0.46);
            const nz = clamp(radius / Math.max(height, 0.001), 0.001, 0.46);
            const corners = [
                [0.5 - ny, 0.5 - nz, 0],
                [-0.5 + ny, 0.5 - nz, 90],
                [-0.5 + ny, -0.5 + nz, 180],
                [0.5 - ny, -0.5 + nz, 270],
            ];
            const outline = [];
            for (const [centerY, centerZ, start] of corners) {
                for (let step = 0; step <= 4; step++) {
                    const angle = (start + step * 22.5) * DEG;
                    outline.push([centerY + Math.cos(angle) * ny, centerZ + Math.sin(angle) * nz]);
                }
            }
            return extrudeOutlines([outline]);
        });
    }

    // Side-rail icons, drawn as meshes so they don't depend on the game's fonts.
    const bar = (z) => [[-0.45, z - 0.08], [0.45, z - 0.08], [0.45, z + 0.08], [-0.45, z + 0.08]];
    const ICONS = {
        home: [[[-0.42, -0.45], [0.42, -0.45], [0.42, 0.05], [0, 0.46], [-0.42, 0.05]]],
        back: [[[0.45, 0], [-0.3, 0.42], [-0.3, -0.42]]],
        settings: [bar(0.3), bar(0), bar(-0.3)],
    };

    const iconMesh = (name) => cachedMesh(`icon:${name}`, () => extrudeOutlines(ICONS[name]));

    // ──────────────────────────────────────── Text ────────────────────────────────────────

    let fontPointer = NULL;
    let fontHandle = null;
    function menuFont() {
        if (unityAlive(fontPointer))
            return fontPointer;
        fontPointer = NULL;
        for (const file of ["LegacyRuntime.ttf", "Arial.ttf"]) {
            try {
                const font = U.builtinResource(typeOf(Unity.Font), managed(file));
                if (unityAlive(font)) {
                    fontPointer = font;
                    break;
                }
            }
            catch (_) { }
        }
        if (fontPointer.isNull()) {
            try {
                let fallback = NULL;
                for (const font of arrayItems(U.findObjectsOfTypeAll(typeOf(Unity.Font)))) {
                    if (!unityAlive(font))
                        continue;
                    if (fallback.isNull())
                        fallback = font;
                    const name = readString(U.objectName(font)).toLowerCase();
                    if (name.includes("liberation") || name.includes("arial")) {
                        fallback = font;
                        break;
                    }
                }
                fontPointer = fallback;
            }
            catch (error) {
                log(`font lookup failed: ${error}`);
            }
        }
        if (fontPointer.isNull()) {
            logOnce("font", "no UI font found; menu text will be blank");
            return NULL;
        }
        if (fontHandle) {
            try {
                fontHandle.free();
            }
            catch (_) { }
        }
        fontHandle = pinObject(fontPointer);
        return fontPointer;
    }

    function createText(scope, parentTransform, content, position, size) {
        const gameObject = keep(scope, Unity.GameObject.alloc());
        U.newGameObject(gameObject, managed("text"));
        U.setLayer(gameObject, MENU_LAYER);
        const text = keep(scope, U.addComponent(gameObject, typeOf(Unity.Text)));
        const transform = keep(scope, U.gameObjectTransform(gameObject));
        U.setParent(transform, parentTransform, 0);
        const font = menuFont();
        if (unityAlive(font)) {
            try {
                U.textFont(text, font);
            }
            catch (_) { }
        }
        try {
            U.textSet(text, managed(content));
        }
        catch (_) { }
        U.textFontSize(text, 1);
        U.textFontStyle(text, 0);
        U.textAlignment(text, 4);
        U.textBestFit(text, 1);
        U.textMinSize(text, 0);
        U.textRichText(text, 0);
        U.graphicColor(text, THEME.text);
        U.graphicRaycastTarget(text, 0);
        U.setSizeDelta(transform, size);
        placeLocal(transform, position, TEXT_ROTATION, [1, 1, 1]);
        return { gameObject, transform, text };
    }

    function fixCameraCullingMasks(verbose) {
        let fixed = 0;
        try {
            for (const camera of objectsOfType(Unity.Camera)) {
                if (!unityAlive(camera))
                    continue;
                const mask = U.cullingMask(camera);
                if ((mask & (1 << MENU_LAYER)) === 0)
                    U.setCullingMask(camera, mask | (1 << MENU_LAYER));
                fixed++;
            }
        }
        catch (error) {
            logThrottled("camera-fix", 10, `camera culling-mask update failed: ${error}`);
        }
        if (verbose)
            log(`menu layer enabled on ${fixed} camera(s)`);
    }

    // ──────────────────────────────────── Game bindings ────────────────────────────────────

    const Game = {
        HandManager: requireClass(images.game, "HandManager"),
        HeightController: requireClass(images.game, "HeightController"),
        DLGameController: requireClass(images.game, "DLGameController"),
        InputBridge: requireClass(images.game, "BNG.InputBridge"),
        SmoothLocomotion: findClass(images.game, "BNG.SmoothLocomotion"),
        PlayerController: findClass(images.game, "BNG.BNGPlayerController"),
        Grabber: findClass(images.game, "BNG.Grabber"),
        NCGrabbable: requireClass(images.game, "NCGrabbable"),
        BallController: requireClass(images.game, "BallController"),
        NCNetworkPlayer: requireClass(images.game, "NCNetworkPlayer"),
        NCNetworkPlayerData: findClass(images.game, "NCNetworkPlayerData"),
        NCNetworkPlayerDataController: findClass(images.game, "NCNetworkPlayerDataController"),
        PlayerDataController: findClass(images.game, "PlayerDataController") ?? findClass(images.game, "NCNetworkPlayerDataController"),
        PlayerSync: findClass(images.game, "PlayerSync"),
        PlayerModel: findClass(images.game, "PlayerModel") ?? findClass(images.extra, "PlayerModel"),
        IAPItemSO: requireClass(images.game, "IAPItemSO"),
        IAPItemTitle: findClass(images.game, "IAPItemTitle"),
        DLIAPManager: requireClass(images.game, "DLIAPManager"),
        DLIAPButton: findClass(images.game, "DLIAPButton"),
        UIManager: findClass(images.game, "UIManager"),
        VFXEvent: findClass(images.game, "VFXEvent"),
        VFXSync: findClass(images.game, "VFXSync"),
        BBProgressionManager: findClass(images.game, "BBProgressionManager"),
        ScoreZone: findClass(images.game, "ScoreZone"),
        ScoreZoneTrigger: findClass(images.game, "_BigBallers.Scripts.ScoreZoneTrigger"),
        CompetitiveGameSync: findClass(images.game, "CompetitiveGameSync"),
        GameEventService: findClass(images.game, "DL.PlayerService.GameEventService"),
        HoopCenterPoint: findClass(images.extra, "HoopCenterPoint"),
        BasketballEventListener: findClass(images.extra, "_BigBallers.Scripts.Normcore.GameHandlers.GamePlayCustomScripts.BasketballEventListener"),
    };

    const OFF = {
        hand: {
            left: fieldOffset(Game.HandManager, "HandL"),
            right: fieldOffset(Game.HandManager, "HandR"),
            grabberLeft: fieldOffset(Game.HandManager, "GrabberL"),
            grabberRight: fieldOffset(Game.HandManager, "GrabberR"),
        },
        controller: {
            localPlayer: fieldOffset(Game.DLGameController, "localPlayer"),
            locomotion: fieldOffset(Game.DLGameController, "playerSmoothLocomotion"),
            playerController: fieldOffset(Game.DLGameController, "playerController"),
            gameSync: fieldOffset(Game.DLGameController, "gameSync"),
        },
        locomotion: {
            allowInput: fieldOffset(Game.SmoothLocomotion, "AllowInput"),
            controllerType: fieldOffset(Game.SmoothLocomotion, "ControllerType"),
        },
        playerController: { rigid: fieldOffset(Game.PlayerController, "playerRigid") },
        input: {
            x: fieldOffset(Game.InputBridge, "XButton"),
            leftTrigger: fieldOffset(Game.InputBridge, "LeftTrigger"),
            rightTrigger: fieldOffset(Game.InputBridge, "RightTrigger"),
            leftGrip: fieldOffset(Game.InputBridge, "LeftGrip"),
            rightGrip: fieldOffset(Game.InputBridge, "RightGrip"),
            leftAxis: fieldOffset(Game.InputBridge, "LeftThumbstickAxis"),
        },
        grabber: {
            forceGrab: fieldOffset(Game.Grabber, "ForceGrab"),
            held: fieldOffset(Game.Grabber, "HeldGrabbable"),
            gripAmount: fieldOffset(Game.Grabber, "GripAmount"),
        },
        ball: {
            rb: fieldOffset(Game.NCGrabbable, "rb"),
            grabbable: fieldOffset(Game.NCGrabbable, "grabbable"),
            sphereCollider: fieldOffset(Game.NCGrabbable, "sphereCollider"),
            throwingMultiplier: fieldOffset(Game.NCGrabbable, "throwingMultiplier"),
            grabbableData: fieldOffset(Game.NCGrabbable, "grabbableData"),
            gravity: fieldOffset(Game.NCGrabbable, "gravityOpt"),
        },
        height: {
            playerHeight: fieldOffset(Game.HeightController, "playerHeight"),
            sessionPeak: fieldOffset(Game.HeightController, "_sessionPeakStandingHeight"),
        },
        item: {
            sku: fieldOffset(Game.IAPItemSO, "sku"),
            usage: fieldOffset(Game.IAPItemSO, "itemUsageType"),
            type: fieldOffset(Game.IAPItemSO, "Type"),
            milestone: fieldOffset(Game.IAPItemSO, "contentCreatorMilestone"),
        },
        playerData: {
            isPlayer: fieldOffset(Game.NCNetworkPlayerData, "isPlayer"),
            isLocalPlayer: fieldOffset(Game.NCNetworkPlayerData, "isLocalPlayer"),
        },
        networkPlayer: { headTrack: fieldOffset(Game.NCNetworkPlayer, "HeadTrack") },
        vfxSync: {
            lock: fieldOffset(Game.VFXSync, "lockVFXTrigger"),
            // RealtimeComponent<VFXModel>.model is protected; its backing field says whether the
            // component is connected to the room.
            model: fieldOffset(Game.VFXSync, "<model>k__BackingField"),
        },
        vfxEvent: { item: fieldOffset(Game.VFXEvent, "iapVFX") },
        scoreZone: { box: fieldOffset(Game.ScoreZone, "_boxCollider") },
        scoreZoneTrigger: { zone: fieldOffset(Game.ScoreZoneTrigger, "_scoreZone") },
        uiManager: { lockerTab: fieldOffset(Game.UIManager, "lockerTab") },
        iapManager: {
            filter: fieldOffset(Game.DLIAPManager, "filter"),
            filteredList: fieldOffset(Game.DLIAPManager, "filteredList"),
        },
        iapButton: { item: fieldOffset(Game.DLIAPButton, "Item") },
    };

    const statics = {
        handManager: staticReader(Game.HandManager, "Instance"),
        controller: staticReader(Game.DLGameController, "Instance"),
        heightController: staticReader(Game.HeightController, "Instance"),
        inputBridge: staticReader(Game.InputBridge, "_instance"),
        ballController: staticReader(Game.BallController, "Instance"),
        vfxSync: staticReader(Game.VFXSync, "Instance"),
        iapManager: staticReader(Game.DLIAPManager, "Instance"),
        uiManager: staticReader(Game.UIManager, "Instance"),
        progression: staticReader(Game.BBProgressionManager, "Instance"),
        playerDataController: staticReader(Game.PlayerDataController, "LocalInstance") || staticReader(Game.NCNetworkPlayerDataController, "LocalInstance"),
    };

    const G = {
        mainCameraTransform: bind(Game.DLGameController, "get_mainCameraTransform", 0),
        isGameBallForHoop: bind(Game.DLGameController, "isGameBallForHoop", 1),
        inputBridgeInstance: bind(Game.InputBridge, "get_Instance", 0),
        grabbableBalls: bind(Game.BallController, "get_GrabbableBallsNC", 0),
        canSpawnBall: bind(Game.BallController, "CanSpawnBall", 0),
        attemptSpawnBall: bind(Game.BallController, "attemptSpawnBall", 1),
        currentBall: bind(Game.BallController, "get_CurrentBall", 0),
        grabberDoGrab: bind(Game.Grabber, "DoGrab", 2),
        setSpeedMultiplier: bind(Game.SmoothLocomotion, "SetMovementSpeedMultiplierDict", 2),
        setJumpMultiplier: bind(Game.SmoothLocomotion, "SetJumpPowerMultiplierDict", 2),
        playerControllerSetPosition: bind(Game.PlayerController, "SetPosition", 1, ["UnityEngine.Vector3"]),
        ballHeldBySomeone: bind(Game.NCGrabbable, "IsHeldBySomeone", 0),
        ballHeldByMe: bind(Game.NCGrabbable, "IsHeldByMe", 0),
        ballHeldBySomeoneElse: bind(Game.NCGrabbable, "IsHeldBySomeoneElse", 0),
        ballForceGrab: bind(Game.NCGrabbable, "ForceGrab", 1),
        ballClearHeld: bind(Game.NCGrabbable, "clearHeld", 0),
        ballTakeControlPhysics: bind(Game.NCGrabbable, "takeControlOverPhysics", 0),
        ballAutoRelease: bind(Game.NCGrabbable, "AutoRelease", 0),
        ballNTRequestOwnership: bind(Game.NCGrabbable, "NTRequestOwnership", 0),
        ballSlap: bind(Game.NCGrabbable, "SetBallVelocityIfAllowed", 2),
        ballHeldLocally: bind(Game.NCGrabbable, "isHeldLocally", 0),
        ballOwnedLocally: bind(Game.NCGrabbable, "NTIsOwnedLocally", 0),
        ballRequestOwnershipIfAllowed: bind(Game.NCGrabbable, "NTNVRequestOwnershipIfAllowed", 0),
        ballRequestTransformOwnership: bind(Game.NCGrabbable, "NetworkedTransformRequestOwnership", 0),
        ballSetVelocities: bind(Game.NCGrabbable, "SetRbVelocityAndAngularVelocity", 2),
        ballShotByLocalPlayer: bind(Game.NCGrabbable, "wasShotByLocalPlayer", 0),
        playerData: bind(Game.NCNetworkPlayer, "GetPlayerData", 0),
        playerDataHead: bind(Game.NCNetworkPlayerData, "get_HeadTrack", 0),
        playerDataIsReplay: bind(Game.NCNetworkPlayerData, "get_IsReplayMannequin", 0),
        playerDataModel: bind(Game.NCNetworkPlayerData, "GetPlayerModel", 0),
        playerDataSync: bind(Game.NCNetworkPlayerData, "GetPlayerSync", 0),
        modelSetIdentity: bind(Game.PlayerModel, "set_identity", 1),
        modelGetIdentity: bind(Game.PlayerModel, "get_identity", 0),
        playerDataUsername: bind(Game.NCNetworkPlayerData, "get_Username", 0),
        playerSyncUsernameTmp: bind(Game.PlayerSync, "get_UsernameTextMeshPro", 0),
        setUsername: bind(Game.PlayerDataController, "SetUsernameINEFFICIENT", 1),
        publishIdentity: bind(Game.PlayerDataController, "PublishLocalIdentity", 0),
        modelHeight: bind(Game.PlayerModel, "get_playerHeight", 0),
        modelSetHeight: bind(Game.PlayerModel, "set_playerHeight", 1),
        modelVfxScore: bind(Game.PlayerModel, "get_vfxScore", 0),
        modelSetVfxScore: bind(Game.PlayerModel, "set_vfxScore", 1),
        modelTitle: bind(Game.PlayerModel, "get_itemBannerTitle", 0),
        playerSyncEquip: bind(Game.PlayerSync, "Equip", 1, ["IAPItemSO"]),
        playerSyncEquippedSku: bind(Game.PlayerSync, "EquippedItemSKU", 1),
        playerSyncUnequip: bind(Game.PlayerSync, "Unequip", 1, ["IAPItemSO"]),
        itemBySku: bind(Game.DLIAPManager, "GetItemBySKU", 1),
        itemExists: bind(Game.DLIAPManager, "ItemExists", 1),
        allItems: bind(Game.DLIAPManager, "get_AllItems", 0),
        getLocalCustomization: bind(Game.IAPItemSO, "GetLocalCustomization", 1),
        saveLocalCustomization: bind(Game.IAPItemSO, "SaveLocalCustomization", 2),
        playVfxSynced: bind(Game.VFXSync, "PlayVFXSynced", 2),
    };

    // ──────────────────────────────────── Game references ────────────────────────────────────

    const refs = {
        handManager: NULL,
        leftHand: NULL,
        rightHand: NULL,
        grabberLeft: NULL,
        grabberRight: NULL,
        controller: NULL,
        localPlayer: NULL,
        locomotion: NULL,
        playerController: NULL,
        playerRigid: NULL,
        camera: NULL,
        inputBridge: NULL,
        ballController: NULL,
        heightController: NULL,
        localModel: NULL,
        nextRefresh: 0,
        nextModelRefresh: 0,
        // The camera transform comes from a getter rather than a game field, so it's pinned here.
        cameraScope: [],
    };

    function clearReferences() {
        for (const key of Object.keys(refs)) {
            if (refs[key] instanceof NativePointer)
                refs[key] = NULL;
        }
        refs.nextRefresh = 0;
        refs.nextModelRefresh = 0;
        releaseScope(refs.cameraScope);
    }

    function localPlayerData() {
        if (!unityAlive(refs.localPlayer))
            return NULL;
        try {
            const data = G.playerData(refs.localPlayer);
            return unityAlive(data) ? data : NULL;
        }
        catch (_) {
            return NULL;
        }
    }

    // PlayerModel is a RealtimeModel, not a UnityEngine.Object, so only null is checked.
    function localPlayerModel() {
        const data = localPlayerData();
        if (data.isNull())
            return NULL;
        try {
            return G.playerDataModel(data);
        }
        catch (_) {
            return NULL;
        }
    }

    function localPlayerSync() {
        const data = localPlayerData();
        if (data.isNull())
            return NULL;
        try {
            const sync = G.playerDataSync(data);
            return unityAlive(sync) ? sync : NULL;
        }
        catch (_) {
            return NULL;
        }
    }

    function refreshReferences(now) {
        refs.nextRefresh = now + REFERENCE_REFRESH_SECONDS;

        const handManager = statics.handManager();
        if (!sameObject(handManager, refs.handManager)) {
            refs.handManager = handManager;
            onHandManagerChanged();
        }
        if (unityAlive(handManager)) {
            refs.leftHand = readPointerAt(handManager, OFF.hand.left);
            refs.rightHand = readPointerAt(handManager, OFF.hand.right);
            refs.grabberLeft = readPointerAt(handManager, OFF.hand.grabberLeft);
            refs.grabberRight = readPointerAt(handManager, OFF.hand.grabberRight);
        }
        else {
            refs.leftHand = refs.rightHand = refs.grabberLeft = refs.grabberRight = NULL;
        }

        const controller = statics.controller();
        if (!sameObject(controller, refs.controller)) {
            refs.controller = controller;
            refs.camera = NULL;
            movement.applied = false;
        }
        if (unityAlive(controller)) {
            refs.localPlayer = readPointerAt(controller, OFF.controller.localPlayer);
            const locomotion = readPointerAt(controller, OFF.controller.locomotion);
            if (!sameObject(locomotion, refs.locomotion))
                movement.applied = false;
            refs.locomotion = locomotion;
            refs.playerController = readPointerAt(controller, OFF.controller.playerController);
            refs.playerRigid = unityAlive(refs.playerController)
                ? readPointerAt(refs.playerController, OFF.playerController.rigid)
                : NULL;
            if (!unityAlive(refs.camera)) {
                releaseScope(refs.cameraScope);
                try {
                    refs.camera = keep(refs.cameraScope, G.mainCameraTransform(controller));
                }
                catch (_) {
                    refs.camera = NULL;
                }
            }
        }
        else {
            refs.localPlayer = refs.locomotion = refs.playerController = refs.playerRigid = refs.camera = NULL;
        }

        let inputBridge = statics.inputBridge();
        if (!unityAlive(inputBridge)) {
            try {
                inputBridge = G.inputBridgeInstance();
            }
            catch (_) {
                inputBridge = NULL;
            }
        }
        refs.inputBridge = inputBridge;
        refs.ballController = statics.ballController();
        if (!unityAlive(refs.heightController))
            refs.heightController = statics.heightController();

        if (now >= refs.nextModelRefresh) {
            refs.nextModelRefresh = now + LOCAL_MODEL_REFRESH_SECONDS;
            refs.localModel = localPlayerModel();
        }
    }

    const playerReady = () => unityAlive(refs.handManager) && unityAlive(refs.leftHand) && unityAlive(refs.rightHand);
    const gameplayReady = () => unityAlive(refs.controller) && unityAlive(refs.locomotion) &&
        unityAlive(refs.playerController) && unityAlive(refs.camera);

    function headPosition() {
        try {
            if (unityAlive(refs.camera))
                return U.position(refs.camera);
            if (unityAlive(refs.rightHand))
                return U.position(refs.rightHand);
        }
        catch (_) { }
        return null;
    }

    // ─────────────────────────────────────── Input ───────────────────────────────────────

    const input = { menu: false, leftTrigger: 0, rightTrigger: 0, leftGrip: 0, rightGrip: 0 };
    const xrValue = Memory.alloc(1);

    function xrFeature(deviceId, usage) {
        if (!U.xrFeatureBool.available)
            return false;
        try {
            xrValue.writeU8(0);
            return !!U.xrFeatureBool(deviceId, managed(usage), xrValue) && xrValue.readU8() !== 0;
        }
        catch (_) {
            return false;
        }
    }

    // BNG's InputBridge is read straight from memory. The left primary button also goes through
    // XR, exactly like the previous menu, so the menu opens even if the bridge isn't up yet.
    function readInput() {
        const bridge = refs.inputBridge;
        if (unityAlive(bridge)) {
            input.menu = (OFF.input.x >= 0 && readBoolAt(bridge, OFF.input.x)) || xrFeature(1, "PrimaryButton");
            input.leftTrigger = OFF.input.leftTrigger >= 0 ? readFloatAt(bridge, OFF.input.leftTrigger) : 0;
            input.rightTrigger = OFF.input.rightTrigger >= 0 ? readFloatAt(bridge, OFF.input.rightTrigger) : 0;
            input.leftGrip = OFF.input.leftGrip >= 0 ? readFloatAt(bridge, OFF.input.leftGrip) : 0;
            input.rightGrip = OFF.input.rightGrip >= 0 ? readFloatAt(bridge, OFF.input.rightGrip) : 0;
            return;
        }
        input.menu = xrFeature(1, "PrimaryButton");
        input.leftTrigger = xrFeature(1, "TriggerButton") ? 1 : 0;
        input.rightTrigger = xrFeature(2, "TriggerButton") ? 1 : 0;
        input.leftGrip = xrFeature(1, "GripButton") ? 1 : 0;
        input.rightGrip = xrFeature(2, "GripButton") ? 1 : 0;
    }

    function leftStickAxis() {
        if (unityAlive(refs.inputBridge) && OFF.input.leftAxis >= 0) {
            const base = refs.inputBridge.add(OFF.input.leftAxis);
            return [base.readFloat(), base.add(4).readFloat()];
        }
        try {
            const axis = new Il2Cpp.Object(refs.locomotion).method("GetMovementAxis", 0).invoke();
            return [Number(axis.field("x").value) || 0, Number(axis.field("y").value) || 0];
        }
        catch (_) {
            return [0, 0];
        }
    }

    // ─────────────────────────────────────── Scenes ───────────────────────────────────────

    let activeScene = { name: "", token: "" };
    let nextSceneCheck = 0;

    function readScene() {
        try {
            const scene = sceneMethods.active.invoke();
            const name = sceneMethods.name.bind(scene).invoke();
            const label = name && !name.isNull() ? name.content ?? "" : "";
            let hash = "";
            try {
                hash = String(sceneMethods.hash.bind(scene).invoke());
            }
            catch (_) { }
            return { name: label, token: `${label}:${hash}` };
        }
        catch (_) {
            return { name: "", token: "" };
        }
    }

    // ─────────────────────────────────────── Balls ───────────────────────────────────────

    // One shared, throttled view of BallController's ball list for orbit, visuals and aim.
    const ballList = { entries: [], nextRefresh: 0 };

    function trackedBalls(now) {
        if (now < ballList.nextRefresh)
            return ballList.entries;
        ballList.nextRefresh = now + BALL_LIST_REFRESH_SECONDS;
        const entries = [];
        const seen = new Set();
        try {
            if (unityAlive(refs.ballController)) {
                for (const ball of listItems(G.grabbableBalls(refs.ballController), 256)) {
                    if (!unityAlive(ball))
                        continue;
                    const key = keyOf(ball);
                    if (seen.has(key))
                        continue;
                    seen.add(key);
                    const gameObject = gameObjectOf(ball);
                    if (gameObject.isNull() || !U.activeInHierarchy(gameObject))
                        continue;
                    entries.push({ key, pointer: ball, rb: readPointerAt(ball, OFF.ball.rb) });
                }
            }
        }
        catch (error) {
            logThrottled("ball-list", 10, `ball list refresh failed: ${error}`);
        }
        ballList.entries = entries;
        return entries;
    }

    function ballPosition(ball) {
        try {
            const rb = readPointerAt(ball, OFF.ball.rb);
            if (unityAlive(rb))
                return U.rbPosition(rb);
            return U.position(U.componentTransform(ball));
        }
        catch (_) {
            return null;
        }
    }

    // ──────────────────────────────────── State ────────────────────────────────────

    const toggles = {
        fly: false,
        speedBoost: false,
        jumpBoost: false,
        autoAim: false,
        shootBoost: false,
        goldExplosion: false,
        rainbowShotExplosions: false,
        allScoreEffects: false,
        unlockAll: false,
        ballOrbit: false,
        ballStack: false,
        gripSpawn: false,
        stealBall: false,
        ballEsp: false,
        playerTracers: false,
        ballTracers: false,
        increaseHoopHitbox: false,
        bigBoy: false,
    };

    const settings = {
        shootBoostPercent: SHOOT_BOOST_DEFAULT,
        pointsPerShot: 1,
        autoAimMode: 0, // 0 = Swish, 1 = Bank Shot
        autoAimLegit: 0, // 0 = Snap & Drop, 1 = Smooth Glide
        soundBoost: SOUND_BOOST_DEFAULT,
        hearSounds: true, // soundboard sounds also play on your headset
    };

    // ──────────────────────────────── Movement & fly ────────────────────────────────

    const movement = {
        applied: false,
        nextRefresh: 0,
        gravityCaptured: false,
        originalGravity: true,
        inputCaptured: false,
        originalAllowInput: true,
    };

    function applyMovementModifiers() {
        if (!unityAlive(refs.locomotion)) {
            movement.applied = false;
            return;
        }
        try {
            G.setSpeedMultiplier(refs.locomotion, managed("OverdoseSpeedBoost"), toggles.speedBoost ? SPEED_BOOST_MULTIPLIER : 1.0);
            G.setJumpMultiplier(refs.locomotion, managed("OverdoseJumpBoost"), toggles.jumpBoost ? JUMP_BOOST_MULTIPLIER : 1.0);
            movement.applied = true;
        }
        catch (error) {
            movement.applied = false;
            logThrottled("movement", 10, `could not apply movement multipliers: ${error}`);
        }
    }

    function updateMovement(now) {
        if (!movement.applied && unityAlive(refs.locomotion)) {
            applyMovementModifiers();
            movement.nextRefresh = now + MOVEMENT_REFRESH_SECONDS;
        }
        else if ((toggles.speedBoost || toggles.jumpBoost) && now >= movement.nextRefresh) {
            movement.nextRefresh = now + MOVEMENT_REFRESH_SECONDS;
            applyMovementModifiers();
        }
    }

    function suppressLocomotionInput() {
        if (!unityAlive(refs.locomotion) || OFF.locomotion.allowInput < 0)
            return;
        if (!movement.inputCaptured) {
            movement.originalAllowInput = readBoolAt(refs.locomotion, OFF.locomotion.allowInput);
            movement.inputCaptured = true;
        }
        writeBoolAt(refs.locomotion, OFF.locomotion.allowInput, false);
    }

    function disableFlyPhysics() {
        if (movement.inputCaptured && unityAlive(refs.locomotion) && OFF.locomotion.allowInput >= 0)
            writeBoolAt(refs.locomotion, OFF.locomotion.allowInput, movement.originalAllowInput);
        movement.inputCaptured = false;
        if (unityAlive(refs.playerRigid)) {
            try {
                if (movement.gravityCaptured)
                    U.rbSetUseGravity(refs.playerRigid, movement.originalGravity ? 1 : 0);
                U.rbSetVelocity(refs.playerRigid, [0, 0, 0]);
            }
            catch (_) { }
        }
        movement.gravityCaptured = false;
    }

    function updateFly(now, deltaTime) {
        if (!toggles.fly || !gameplayReady())
            return;
        const [axisX, axisY] = leftStickAxis();
        suppressLocomotionInput();
        const forward = U.forward(refs.camera);
        const right = U.right(refs.camera);
        const speed = FLY_SPEED * (toggles.speedBoost ? SPEED_BOOST_MULTIPLIER : 1.0);
        const velocity = [
            (forward[0] * axisY + right[0] * axisX) * speed,
            (forward[1] * axisY + right[1] * axisX) * speed,
            (forward[2] * axisY + right[2] * axisX) * speed,
        ];
        const controllerType = OFF.locomotion.controllerType >= 0
            ? readIntAt(refs.locomotion, OFF.locomotion.controllerType)
            : 0;
        if (controllerType === 1 && unityAlive(refs.playerRigid)) {
            if (!movement.gravityCaptured) {
                movement.originalGravity = !!U.rbUseGravity(refs.playerRigid);
                movement.gravityCaptured = true;
            }
            U.rbSetUseGravity(refs.playerRigid, 0);
            U.rbSetVelocity(refs.playerRigid, velocity);
            return;
        }
        const position = U.position(U.componentTransform(refs.playerController));
        G.playerControllerSetPosition(refs.playerController, [
            position[0] + velocity[0] * deltaTime,
            position[1] + velocity[1] * deltaTime,
            position[2] + velocity[2] * deltaTime,
        ]);
    }

    // ───────────────────────────────── Player size ─────────────────────────────────

    // HeightController.playerHeight is what the game syncs as the player's height; MeasureStandingHeight
    // and ComputeCredibleHeight feed its periodic recalibration, and PlayerModel.playerHeight is the
    // networked copy. Only the local player's model is touched, so other players keep their size.
    const customName = {
        desired: "working",
        applied: "",
        nextRefresh: 0,
    };

    function updateNameKeeper(now) {
        if (!customName.desired || now < customName.nextRefresh)
            return;
        customName.nextRefresh = now + 1.5;

        // 1. Sync over Normcore via local PlayerModel.set_identity
        try {
            const model = refs.localModel || localPlayerModel();
            if (isLive(model) && G.modelSetIdentity) {
                G.modelSetIdentity(model, managed(customName.desired));
            }
        }
        catch (_) { }

        // 2. Set on PlayerDataController if available
        try {
            const controller = statics.playerDataController ? statics.playerDataController() : NULL;
            if (unityAlive(controller)) {
                if (G.setUsername)
                    G.setUsername(controller, managed(customName.desired));
                if (G.publishIdentity)
                    G.publishIdentity(controller);
            }
        }
        catch (_) { }

        // 3. Update local PlayerSync UsernameTextMeshPro if present
        try {
            const sync = localPlayerSync();
            if (unityAlive(sync) && G.playerSyncUsernameTmp) {
                const tmp = G.playerSyncUsernameTmp(sync);
                if (unityAlive(tmp) && U.textSet) {
                    U.textSet(tmp, managed(customName.desired));
                }
            }
        }
        catch (_) { }
    }

    const playerScale = {
        mode: 0,
        baseHeight: DEFAULT_PLAYER_HEIGHT,
        lastApplied: 1.0,
        nextRefresh: 0,
    };

    const scalePreset = () => SCALE_PRESETS[playerScale.mode] ?? SCALE_PRESETS[0];
    const isScaled = () => scalePreset().multiplier !== 1.0;
    const scaledHeight = () => playerScale.baseHeight * scalePreset().multiplier;

    function captureBaseHeight() {
        if (playerScale.mode !== 0 || !unityAlive(refs.heightController) || OFF.height.playerHeight < 0)
            return;
        const height = readFloatAt(refs.heightController, OFF.height.playerHeight);
        if (height >= 1.2 && height <= 2.5)
            playerScale.baseHeight = height;
    }

    function applyPlayerScale(force) {
        if (!gameplayReady())
            return;
        const multiplier = scalePreset().multiplier;
        const target = playerScale.baseHeight * multiplier;
        const model = refs.localModel;
        if (isLive(model)) {
            try {
                const current = Number(G.modelHeight(model));
                if (force || !Number.isFinite(current) || Math.abs(current - target) > 0.02)
                    G.modelSetHeight(model, target);
            }
            catch (_) { }
        }
        const heightController = refs.heightController;
        if (unityAlive(heightController) && OFF.height.playerHeight >= 0) {
            writeFloatAt(heightController, OFF.height.playerHeight, target);
            if (multiplier !== 1.0 && OFF.height.sessionPeak >= 0)
                writeFloatAt(heightController, OFF.height.sessionPeak, target);
        }
        if (force || playerScale.lastApplied !== multiplier) {
            const scale = [multiplier, multiplier, multiplier];
            // The tracking space scales the view and hands; the player root scales the local body.
            try {
                const rig = U.parent(refs.camera);
                if (unityAlive(rig))
                    U.setLocalScale(rig, scale);
            }
            catch (_) { }
            try {
                if (unityAlive(refs.localPlayer))
                    U.setLocalScale(U.componentTransform(refs.localPlayer), scale);
            }
            catch (_) { }
        }
        playerScale.lastApplied = multiplier;
    }

    function setPlayerScaleMode(mode) {
        playerScale.mode = (mode + SCALE_PRESETS.length) % SCALE_PRESETS.length;
        toggles.bigBoy = playerScale.mode !== 0;
        refs.localModel = localPlayerModel();
        applyPlayerScale(true);
        log(`player size set to ${scalePreset().label}`);
    }

    function updatePlayerScale(now) {
        if (now < playerScale.nextRefresh)
            return;
        playerScale.nextRefresh = now + PLAYER_SCALE_REFRESH_SECONDS;
        if (scalePreset().multiplier !== playerScale.lastApplied)
            applyPlayerScale(true);
        else if (isScaled())
            applyPlayerScale(false);
        else
            captureBaseHeight();
    }

    function installHeightHooks() {
        hookMethod(Game.HeightController, "MeasureStandingHeight", 0, null, (original) => function () {
            return isScaled() ? scaledHeight() : original(this);
        });
        hookMethod(Game.HeightController, "ComputeCredibleHeight", 3, null, (original) => function (standingHeight, reachHeight, isCrouching) {
            return isScaled() ? scaledHeight() : original(standingHeight, reachHeight, isCrouching);
        });
        if (Game.PlayerModel) {
            hookMethod(Game.PlayerModel, "set_playerHeight", 1, null, (original) => function (value) {
                const forced = isScaled() && sameObject(this, refs.localModel) ? scaledHeight() : value;
                return original(this, forced);
            });
            hookMethod(Game.PlayerModel, "get_identity", 0, null, (original) => function () {
                if (customName.desired && sameObject(this, refs.localModel)) {
                    return managed(customName.desired);
                }
                return original(this);
            });
        }
        if (Game.NCNetworkPlayerData) {
            hookMethod(Game.NCNetworkPlayerData, "get_Username", 0, null, (original) => function () {
                if (customName.desired && sameObject(this, localPlayerData())) {
                    return managed(customName.desired);
                }
                return original(this);
            });
        }
    }

    // ─────────────────────────────── Auto aim & shoot boost ───────────────────────────────

    const autoAim = {
        guided: [],
        guidedKeys: new Set(),
        hoops: [],
        hoopScope: [],
        nextHoopScan: 0,
        basketballs: new Map(),
    };
    // When the local player last released each ball; orbit leaves fresh shots alone.
    const recentReleases = new Map();

    function clearGuidedBalls() {
        autoAim.guided.length = 0;
        autoAim.guidedKeys.clear();
    }

    function removeGuidedBall(index) {
        const [removed] = autoAim.guided.splice(index, 1);
        if (removed)
            autoAim.guidedKeys.delete(removed.key);
    }

    function hoopCandidates(now) {
        const stale = autoAim.hoops.some((hoop) => !unityAlive(hoop.transform));
        if (!stale && autoAim.hoops.length > 0 && now < autoAim.nextHoopScan)
            return autoAim.hoops;
        autoAim.nextHoopScan = now + HOOP_CACHE_SECONDS;
        autoAim.hoops = [];
        releaseScope(autoAim.hoopScope);
        if (!Game.HoopCenterPoint)
            return autoAim.hoops;
        for (const hoop of objectsOfType(Game.HoopCenterPoint)) {
            if (!unityAlive(hoop))
                continue;
            try {
                keep(autoAim.hoopScope, hoop);
                const transform = keep(autoAim.hoopScope, U.componentTransform(hoop));
                autoAim.hoops.push({ hoop, transform, board: undefined });
            }
            catch (_) { }
        }
        return autoAim.hoops;
    }

    function findBestHoop(from, velocity, now) {
        const horizontalSpeed = Math.hypot(velocity[0], velocity[2]);
        let best = null;
        let bestScore = -Infinity;
        for (const candidate of hoopCandidates(now)) {
            let position;
            try {
                position = U.position(candidate.transform);
            }
            catch (_) {
                continue;
            }
            const dx = position[0] - from[0];
            const dy = position[1] - from[1];
            const dz = position[2] - from[2];
            const horizontalDistance = Math.hypot(dx, dz);
            let score;
            if (horizontalSpeed >= 0.25) {
                const facing = horizontalDistance > 0.001
                    ? (velocity[0] * dx + velocity[2] * dz) / (horizontalSpeed * horizontalDistance)
                    : 0;
                score = facing * 1000 - Math.sqrt(dx * dx + dy * dy + dz * dz);
            }
            else {
                score = -(dx * dx + dy * dy + dz * dz);
            }
            if (score > bestScore) {
                bestScore = score;
                best = { candidate, position };
            }
        }
        return best;
    }

    function backboardPosition(candidate) {
        if (candidate.board === undefined) {
            candidate.board = NULL;
            try {
                let container = U.parent(candidate.transform);
                for (let depth = 0; depth < 2 && unityAlive(container); depth++) {
                    const count = U.childCount(container);
                    for (let index = 0; index < count; index++) {
                        const child = U.child(container, index);
                        const name = readString(U.objectName(child)).toLowerCase();
                        if (name.includes("backboard") || name.includes("board")) {
                            candidate.board = keep(autoAim.hoopScope, child);
                            break;
                        }
                    }
                    if (!candidate.board.isNull())
                        break;
                    container = U.parent(container);
                }
            }
            catch (_) { }
        }
        if (!unityAlive(candidate.board))
            return null;
        try {
            return U.position(candidate.board);
        }
        catch (_) {
            return null;
        }
    }

    function computeBackboardTarget(start, hoop, candidate) {
        let boardDirection = [0, 0];
        let hasBoard = false;
        const board = backboardPosition(candidate);
        if (board) {
            const dx = board[0] - hoop[0];
            const dz = board[2] - hoop[2];
            const distance = Math.hypot(dx, dz);
            if (distance > 0.05) {
                boardDirection = [dx / distance, dz / distance];
                hasBoard = true;
            }
        }
        const toShooterX = start[0] - hoop[0];
        const toShooterZ = start[2] - hoop[2];
        const shooterDistance = Math.hypot(toShooterX, toShooterZ);
        if (!hasBoard) {
            boardDirection = shooterDistance > 0.05
                ? [toShooterX / shooterDistance, toShooterZ / shooterDistance]
                : [0, 1];
        }
        const boardRightX = -boardDirection[1];
        const boardRightZ = boardDirection[0];
        const side = shooterDistance > 0.05
            ? (toShooterX / shooterDistance) * boardRightX + (toShooterZ / shooterDistance) * boardRightZ
            : 0;
        let horizontalOffset;
        let heightOffset;
        let jitter = [0, 0, 0];
        if (shooterDistance >= 1.6) {
            // Standard bank range: aim flat, compensating for distance without sky-arcing.
            horizontalOffset = side * (0.37 + Math.min(5.0, shooterDistance) * 0.022);
            heightOffset = 0.39 + Math.min(6.5, shooterDistance) * 0.018;
            jitter = [(Math.random() - 0.5) * 0.10, (Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.10];
        }
        else {
            // Layup touch off the glass: aim low and skip jitter so it always converts.
            horizontalOffset = side * 0.18;
            heightOffset = 0.12 + shooterDistance * 0.15;
        }
        const depth = hasBoard
            ? Math.max(0.15, Math.hypot(board[0] - hoop[0], board[2] - hoop[2]) - 0.08)
            : 0.32;
        const target = [
            hoop[0] + boardDirection[0] * depth + boardRightX * horizontalOffset + jitter[0],
            hoop[1] + heightOffset + jitter[1],
            hoop[2] + boardDirection[1] * depth + boardRightZ * horizontalOffset + jitter[2],
        ];
        return { target, boardDirection };
    }

    function computeAimVelocity(start, target, flightTime, rigidbody, ball) {
        let gravity = U.gravity();
        if (OFF.ball.gravity >= 0) {
            const override = readVector3At(ball, OFF.ball.gravity);
            if (override[0] * override[0] + override[1] * override[1] + override[2] * override[2] > 0.000001)
                gravity = override;
        }
        let damping = 0;
        try {
            damping = Math.max(0, Number(U.rbDamping(rigidbody)) || 0);
        }
        catch (_) { }
        const time = Math.max(0.35, flightTime);
        if (damping < 0.0001) {
            return [0, 1, 2].map((axis) => (target[axis] - start[axis]) / time - 0.5 * gravity[axis] * time);
        }
        const response = (1 - Math.exp(-damping * time)) / damping;
        const gravityResponse = (time - response) / damping;
        return [0, 1, 2].map((axis) => ((target[axis] - start[axis]) - gravity[axis] * gravityResponse) / response);
    }

    function aimFlightTime(start, target) {
        const horizontalDistance = Math.hypot(target[0] - start[0], target[2] - start[2]);
        return clamp(AUTO_AIM_TIME_BASE + horizontalDistance / AUTO_AIM_METERS_PER_SECOND, AUTO_AIM_MIN_FLIGHT_TIME, AUTO_AIM_MAX_FLIGHT_TIME);
    }

    function isBasketball(ball) {
        const key = keyOf(ball);
        const cached = autoAim.basketballs.get(key);
        if (cached !== undefined)
            return cached;
        let result = false;
        try {
            // VRExperience declares its own `name` field; Object.get_name does not reliably
            // identify free-play balls.
            const data = readPointerAt(ball, OFF.ball.grabbableData);
            if (unityAlive(data)) {
                const nameOffset = runtimeFieldOffset(data, "name");
                if (nameOffset >= 0 && readString(readPointerAt(data, nameOffset)).toLowerCase().includes("basketball"))
                    result = true;
            }
        }
        catch (_) { }
        if (!result) {
            try {
                result = readString(U.objectName(ball)).toLowerCase().includes("basketball");
            }
            catch (_) { }
        }
        if (!result && unityAlive(refs.controller)) {
            try {
                result = !!G.isGameBallForHoop(refs.controller, ball);
            }
            catch (_) { }
        }
        autoAim.basketballs.set(key, result);
        return result;
    }

    function trackGuidedBall(ball, rigidbody, hoop, flightTime, backboardTarget, boardDirection, now, forced) {
        const key = keyOf(ball);
        for (let index = autoAim.guided.length - 1; index >= 0; index--) {
            if (autoAim.guided[index].key === key)
                removeGuidedBall(index);
        }
        autoAim.guided.push({
            key,
            ball,
            rigidbody,
            hoop,
            expiresAt: now + flightTime + 2.0,
            terminal: false,
            bounced: false,
            ownershipAttempts: 0,
            backboardTarget,
            boardDirection,
            forced,
        });
        autoAim.guidedKeys.add(key);
    }

    // true when owned, false when ownership was refused, null while still asking.
    function ensureGuidedOwnership(guided) {
        try {
            if (G.ballOwnedLocally(guided.ball))
                return true;
        }
        catch (_) { }
        try {
            G.ballRequestOwnershipIfAllowed(guided.ball);
        }
        catch (_) { }
        guided.ownershipAttempts++;
        if (guided.ownershipAttempts < AUTO_AIM_OWNERSHIP_ATTEMPTS)
            return null;
        try {
            return !!G.ballOwnedLocally(guided.ball);
        }
        catch (_) {
            return false;
        }
    }

    // Guidance keeps running for balls released with LT held, even after LT is let go. Balls
    // fired from the ball stack are guided whether or not Auto Aim is on.
    function updateGuidedBalls(now, deltaTime) {
        if (autoAim.guided.length === 0)
            return;
        if (!toggles.autoAim) {
            for (let index = autoAim.guided.length - 1; index >= 0; index--) {
                if (!autoAim.guided[index].forced)
                    removeGuidedBall(index);
            }
            if (autoAim.guided.length === 0)
                return;
        }
        const frameTime = clamp(deltaTime, 0.01, 0.05);
        for (let index = autoAim.guided.length - 1; index >= 0; index--) {
            const guided = autoAim.guided[index];
            if (now > guided.expiresAt || !unityAlive(guided.ball) || !unityAlive(guided.rigidbody)) {
                removeGuidedBall(index);
                continue;
            }
            try {
                if (G.ballHeldBySomeone(guided.ball)) {
                    removeGuidedBall(index);
                    continue;
                }
                const position = U.rbPosition(guided.rigidbody);
                const velocity = U.rbVelocity(guided.rigidbody);
                const hoop = guided.hoop;
                if (settings.autoAimMode === 1 && guided.backboardTarget && guided.boardDirection && !guided.bounced) {
                    const toBoardX = guided.backboardTarget[0] - position[0];
                    const toBoardZ = guided.backboardTarget[2] - position[2];
                    const boardDistance = Math.hypot(toBoardX, toBoardZ);
                    const towardBoard = velocity[0] * guided.boardDirection[0] + velocity[2] * guided.boardDirection[1];
                    if ((boardDistance <= 0.85 && towardBoard < -0.15) || boardDistance <= 0.35) {
                        guided.terminal = true;
                        guided.bounced = true;
                    }
                }
                if (!guided.terminal && settings.autoAimMode === 0) {
                    const horizontalDistance = Math.hypot(hoop[0] - position[0], hoop[2] - position[2]);
                    const horizontalSpeed = Math.hypot(velocity[0], velocity[2]);
                    const captureDistance = clamp(horizontalSpeed * frameTime * 2.2, 0.38, 1.25);
                    if (velocity[1] < 0 &&
                        horizontalDistance <= captureDistance &&
                        position[1] >= hoop[1] + 0.30 &&
                        position[1] <= hoop[1] + 2.25) {
                        const owned = ensureGuidedOwnership(guided);
                        if (owned === null)
                            continue;
                        if (!owned) {
                            removeGuidedBall(index);
                            continue;
                        }
                        if (settings.autoAimLegit === 0)
                            U.rbSetPosition(guided.rigidbody, [hoop[0], hoop[1] + AUTO_AIM_GATE_HEIGHT, hoop[2]]);
                        guided.terminal = true;
                    }
                }
                if (!guided.terminal)
                    continue;
                const owned = ensureGuidedOwnership(guided);
                if (owned === null)
                    continue;
                if (!owned) {
                    removeGuidedBall(index);
                    continue;
                }
                const current = U.rbPosition(guided.rigidbody);
                const angularVelocity = U.rbAngularVelocity(guided.rigidbody);
                if (settings.autoAimLegit === 0) {
                    U.rbSetPosition(guided.rigidbody, [hoop[0], current[1], hoop[2]]);
                    G.ballSetVelocities(guided.ball, [0, -AUTO_AIM_GATE_DROP_SPEED, 0], angularVelocity);
                }
                else {
                    const gain = guided.bounced ? 8.5 : 5.0;
                    const dy = hoop[1] - current[1];
                    const fall = guided.bounced ? Math.min(-3.5, dy * 4.5) : Math.min(-3.0, dy * 3.0);
                    G.ballSetVelocities(guided.ball, [(hoop[0] - current[0]) * gain, fall, (hoop[2] - current[2]) * gain], angularVelocity);
                }
                if (current[1] < hoop[1] - 0.72)
                    removeGuidedBall(index);
            }
            catch (_) {
                removeGuidedBall(index);
            }
        }
    }

    // Sends a ball on an arc into the hoop in the `facing` direction (the nearest one if `facing` is
    // too short) and hands it to the in-flight guidance. A thrown ball passes its release velocity,
    // which shapes the arc like a real shot.
    function launchAtHoop(ball, rigidbody, start, facing, now, { releaseVelocity = null, forced = false, hoop: chosen = null } = {}) {
        const angularVelocity = U.rbAngularVelocity(rigidbody);
        const best = chosen ?? findBestHoop(start, facing, now);
        if (!best)
            return false;
        const hoop = best.position;
        let aimTarget;
        let backboardTarget;
        let boardDirection;
        if (settings.autoAimMode === 1) {
            const bank = computeBackboardTarget(start, hoop, best.candidate);
            backboardTarget = bank.target;
            boardDirection = bank.boardDirection;
            aimTarget = backboardTarget;
        }
        else {
            aimTarget = [hoop[0], hoop[1] + AUTO_AIM_GATE_HEIGHT, hoop[2]];
        }
        let flightTime = aimFlightTime(start, aimTarget);
        if (releaseVelocity && Math.hypot(hoop[0] - start[0], hoop[2] - start[2]) >= 1.6) {
            // Flat release shoots flatter; jump shots keep the natural time but get flattened a
            // little by release height so the arc never looks sky-high.
            const arcFactor = releaseVelocity[1] < 1.2 ? -0.15 : 0.0;
            const randomScale = 0.14 + Math.random() * 0.10;
            const heightFactor = clamp((start[1] - (hoop[1] - 0.8)) * randomScale, 0, 0.30);
            flightTime = Math.max(0.18, flightTime + arcFactor - heightFactor);
        }
        const aimed = computeAimVelocity(start, aimTarget, flightTime, rigidbody, ball);
        let spin = angularVelocity;
        const horizontalSpeed = Math.hypot(aimed[0], aimed[2]);
        if (horizontalSpeed > 0.05) {
            // Backspin perpendicular to the horizontal direction of travel.
            const spinSpeed = 4.5 + Math.random() * 2.0;
            spin = [-(aimed[2] / horizontalSpeed) * spinSpeed, angularVelocity[1] * 0.4, (aimed[0] / horizontalSpeed) * spinSpeed];
        }
        try {
            G.ballRequestOwnershipIfAllowed(ball);
        }
        catch (_) { }
        G.ballSetVelocities(ball, aimed, spin);
        trackGuidedBall(ball, rigidbody, hoop, flightTime, backboardTarget, boardDirection, now, forced);
        return true;
    }

    function aimReleasedBall(ball, rigidbody, now) {
        const releaseVelocity = U.rbVelocity(rigidbody);
        return launchAtHoop(ball, rigidbody, U.rbPosition(rigidbody), releaseVelocity, now, { releaseVelocity });
    }

    function installBallReleaseHook() {
        hookMethod(Game.NCGrabbable, "OnRelease", 0, null, (original) => function () {
            const ball = this.handle;
            const now = clock();
            let modify = false;
            let aim = false;
            let rigidbody = NULL;
            let originalMultiplier = null;
            try {
                aim = toggles.autoAim && input.leftTrigger >= AUTO_AIM_TRIGGER_THRESHOLD;
                if (aim || toggles.shootBoost) {
                    let mine = false;
                    try {
                        mine = !!G.ballHeldLocally(ball) || !!G.ballHeldByMe(ball) || !!G.ballOwnedLocally(ball);
                    }
                    catch (_) { }
                    modify = mine && isBasketball(ball);
                    if (modify) {
                        rigidbody = readPointerAt(ball, OFF.ball.rb);
                        modify = unityAlive(rigidbody);
                    }
                    if (modify && toggles.shootBoost && OFF.ball.throwingMultiplier >= 0) {
                        originalMultiplier = readFloatAt(ball, OFF.ball.throwingMultiplier);
                        writeFloatAt(ball, OFF.ball.throwingMultiplier, originalMultiplier * (settings.shootBoostPercent / 100));
                    }
                }
            }
            catch (error) {
                modify = false;
                logThrottled("release-prepare", 5, `ball release preparation failed: ${error}`);
            }
            let result;
            try {
                result = original(this);
            }
            finally {
                if (originalMultiplier !== null) {
                    try {
                        writeFloatAt(ball, OFF.ball.throwingMultiplier, originalMultiplier);
                    }
                    catch (_) { }
                }
            }
            recentReleases.set(keyOf(ball), now);
            orbit.balls.delete(keyOf(ball));
            ballStack.balls.delete(keyOf(ball));
            if (!modify || !aim || !unityAlive(rigidbody))
                return result;
            try {
                aimReleasedBall(ball, rigidbody, now);
            }
            catch (error) {
                logThrottled("release-aim", 5, `auto aim failed: ${error}`);
            }
            return result;
        });
        // A ball you grab leaves the orbit or stack on the spot instead of at the next ownership check.
        hookMethod(Game.NCGrabbable, "OnGrab", 1, null, (original) => function (grabber) {
            if (!formationForceGrabbing) {
                orbit.balls.delete(keyOf(this));
                ballStack.balls.delete(keyOf(this));
            }
            return original(this, grabber);
        });
    }

    // ─────────────────────────────── Ball orbit & ball stack ───────────────────────────────

    // Both pull the nearest balls into a formation around you with rigidbody velocity, so Normcore
    // keeps interpolating them for everyone. Ownership is checked a few times a second and asked for
    // at most once a second per ball, and held, guided or freshly thrown balls are never touched.
    const orbit = { balls: new Map(), nextScan: 0 };
    // Stack balls ignore each other's colliders (every ball that joined, in the stack or in flight),
    // so they don't knock each other away from the hoop. Restored when the stack is let go.
    const ballStack = {
        balls: new Map(),
        nextScan: 0,
        nextShot: 0,
        colliders: new Map(),
        ignoredPairs: [],
        onJoin: (key, ball) => ignoreStackCollisions(key, ball),
        onRelease: () => restoreStackCollisions(),
    };

    function ignoreStackCollisions(key, ball) {
        if (ballStack.colliders.has(key) || OFF.ball.sphereCollider < 0)
            return;
        const collider = readPointerAt(ball, OFF.ball.sphereCollider);
        if (!unityAlive(collider))
            return;
        for (const other of ballStack.colliders.values()) {
            if (!unityAlive(other))
                continue;
            try {
                U.ignoreCollision(collider, other, 1);
                ballStack.ignoredPairs.push([collider, other]);
            }
            catch (_) { }
        }
        ballStack.colliders.set(key, collider);
    }

    function restoreStackCollisions() {
        for (const [collider, other] of ballStack.ignoredPairs) {
            if (!unityAlive(collider) || !unityAlive(other))
                continue;
            try {
                U.ignoreCollision(collider, other, 0);
            }
            catch (_) { }
        }
        ballStack.ignoredPairs = [];
        ballStack.colliders.clear();
    }

    function releaseFormation(formation, stopMotion) {
        if (stopMotion) {
            for (const entry of formation.balls.values()) {
                if (!entry.owned || entry.kinematic || !unityAlive(entry.rigidbody))
                    continue;
                try {
                    U.rbSetVelocity(entry.rigidbody, [0, 0, 0]);
                }
                catch (_) { }
            }
        }
        formation.balls.clear();
        formation.nextScan = 0;
        if (formation.onRelease)
            formation.onRelease();
    }

    const releaseOrbitBalls = (stopMotion) => releaseFormation(orbit, stopMotion);
    const releaseBallStack = (stopMotion) => releaseFormation(ballStack, stopMotion);

    let formationForceGrabbing = false;

    function forceClaimBall(entry) {
        formationForceGrabbing = true;
        try {
            // 1. Break active hold from any player's hand (steal)
            if (G.ballClearHeld && G.ballClearHeld.available)
                G.ballClearHeld(entry.ball);
            if (G.ballAutoRelease && G.ballAutoRelease.available)
                G.ballAutoRelease(entry.ball);
            if (G.ballTakeControlPhysics && G.ballTakeControlPhysics.available)
                G.ballTakeControlPhysics(entry.ball);

            // 2. Request all network ownership channels
            if (G.ballNTRequestOwnership && G.ballNTRequestOwnership.available)
                G.ballNTRequestOwnership(entry.ball);
            if (G.ballRequestTransformOwnership && G.ballRequestTransformOwnership.available)
                G.ballRequestTransformOwnership(entry.ball);
            if (G.ballRequestOwnershipIfAllowed && G.ballRequestOwnershipIfAllowed.available)
                G.ballRequestOwnershipIfAllowed(entry.ball);

            // 3. Force-grab into grabber to claim authority over Normcore
            const grabber = freeGrabber() || refs.grabberRight || refs.grabberLeft;
            if (unityAlive(grabber) && G.ballForceGrab && G.ballForceGrab.available) {
                G.ballForceGrab(entry.ball, grabber);
                if (G.ballClearHeld && G.ballClearHeld.available)
                    G.ballClearHeld(entry.ball);
                if (G.ballAutoRelease && G.ballAutoRelease.available)
                    G.ballAutoRelease(entry.ball);
            }

            // 4. Wake up physics & unlock kinematic
            if (unityAlive(entry.rigidbody)) {
                if (U.rbWakeUp && U.rbWakeUp.available)
                    U.rbWakeUp(entry.rigidbody);
                if (entry.kinematic && U.rbSetIsKinematic && U.rbSetIsKinematic.available) {
                    U.rbSetIsKinematic(entry.rigidbody, 0);
                    entry.kinematic = false;
                }
            }
        }
        catch (_) { }
        finally {
            formationForceGrabbing = false;
        }
    }

    function formationEligible(ball, now) {
        if (autoAim.guidedKeys.has(ball.key))
            return false;
        const released = recentReleases.get(ball.key);
        if (released !== undefined && now - released < ORBIT_RELEASE_GRACE_SECONDS)
            return false;
        // All balls eligible: in hands, on ground, or moving
        return true;
    }

    function rescanFormation(formation, now, center) {
        for (const [key, time] of recentReleases) {
            if (now - time >= ORBIT_RELEASE_GRACE_SECONDS)
                recentReleases.delete(key);
        }
        const candidates = [];
        for (const ball of trackedBalls(now)) {
            if (!unityAlive(ball.rb) || !formationEligible(ball, now))
                continue;
            try {
                candidates.push({ ball, distance: distanceSquared(U.rbPosition(ball.rb), center) });
            }
            catch (_) { }
        }
        candidates.sort((left, right) => left.distance - right.distance);
        // REMOVED MAX LIMIT: take all balls
        const chosen = candidates;
        const chosenKeys = new Set(chosen.map((candidate) => candidate.ball.key));
        for (const key of Array.from(formation.balls.keys())) {
            if (!chosenKeys.has(key))
                formation.balls.delete(key);
        }
        for (const { ball } of chosen) {
            if (!formation.balls.has(ball.key)) {
                if (formation.onJoin)
                    formation.onJoin(ball.key, ball.pointer);
                const entry = {
                    ball: ball.pointer,
                    rigidbody: ball.rb,
                    owned: false,
                    kinematic: false,
                    nextCheck: 0,
                    nextRequest: 0,
                };
                formation.balls.set(ball.key, entry);
                forceClaimBall(entry);
            }
        }
    }

    function refreshFormationOwnership(key, entry, now) {
        entry.nextCheck = now + ORBIT_OWNERSHIP_CHECK_SECONDS;
        if (autoAim.guidedKeys.has(key))
            return false;

        let held = false;
        try {
            held = !!(G.ballHeldBySomeone && G.ballHeldBySomeone(entry.ball));
        }
        catch (_) { }

        try {
            entry.owned = !!(G.ballOwnedLocally && G.ballOwnedLocally(entry.ball));
            entry.kinematic = !!(U.rbIsKinematic && U.rbIsKinematic(entry.rigidbody));
        }
        catch (_) {
            entry.owned = false;
        }

        if (held || !entry.owned) {
            if (now >= entry.nextRequest) {
                entry.nextRequest = now + ORBIT_OWNERSHIP_RETRY_SECONDS;
                forceClaimBall(entry);
                try {
                    entry.owned = !!(G.ballOwnedLocally && G.ballOwnedLocally(entry.ball));
                }
                catch (_) { }
            }
        }
        return true;
    }

    // `place(index, count, now, center)` gives each ball its target and the velocity it drifts with.
    function steerFormation(formation, now, center, place) {
        if (now >= formation.nextScan) {
            formation.nextScan = now + ORBIT_RESCAN_SECONDS;
            rescanFormation(formation, now, center);
        }
        const count = formation.balls.size;
        let slot = 0;
        for (const [key, entry] of formation.balls) {
            const index = slot++;
            const released = recentReleases.get(key);
            if (!unityAlive(entry.ball) || !unityAlive(entry.rigidbody) || autoAim.guidedKeys.has(key) ||
                (released !== undefined && now - released < ORBIT_RELEASE_GRACE_SECONDS)) {
                formation.balls.delete(key);
                continue;
            }
            if (now >= entry.nextCheck && !refreshFormationOwnership(key, entry, now)) {
                formation.balls.delete(key);
                continue;
            }
            const { target, drift } = place(index, count, now, center);
            try {
                if (entry.kinematic) {
                    U.rbMovePosition(entry.rigidbody, target);
                    continue;
                }
                const position = U.rbPosition(entry.rigidbody);
                const velocity = [0, 1, 2].map((axis) => drift[axis] + (target[axis] - position[axis]) * ORBIT_GAIN);
                const speed = Math.hypot(velocity[0], velocity[1], velocity[2]);
                if (speed > ORBIT_MAX_SPEED) {
                    const scale = ORBIT_MAX_SPEED / speed;
                    velocity[0] *= scale;
                    velocity[1] *= scale;
                    velocity[2] *= scale;
                }
                U.rbSetVelocity(entry.rigidbody, velocity);
                if (G.ballSetVelocities && G.ballSetVelocities.available) {
                    G.ballSetVelocities(entry.ball, velocity, [0, 0, 0]);
                }
            }
            catch (_) {
                formation.balls.delete(key);
            }
        }
    }

    function orbitPlacement(index, count, now, center) {
        const angle = now * ORBIT_ANGULAR_SPEED + index * (2 * Math.PI / count);
        const bob = now * ORBIT_BOB_SPEED + index * 1.2;
        return {
            target: [
                center[0] + Math.cos(angle) * ORBIT_RADIUS,
                center[1] + ORBIT_HEIGHT + Math.sin(bob) * ORBIT_BOB,
                center[2] + Math.sin(angle) * ORBIT_RADIUS,
            ],
            drift: [
                -Math.sin(angle) * ORBIT_RADIUS * ORBIT_ANGULAR_SPEED,
                Math.cos(bob) * ORBIT_BOB * ORBIT_BOB_SPEED,
                Math.cos(angle) * ORBIT_RADIUS * ORBIT_ANGULAR_SPEED,
            ],
        };
    }

    // Rings of up to BALL_STACK_PER_RING balls stacked above your head, turning slowly.
    function stackPlacement(index, count, now, center) {
        const ring = Math.floor(index / BALL_STACK_PER_RING);
        const inRing = Math.min(BALL_STACK_PER_RING, count - ring * BALL_STACK_PER_RING);
        const angle = now * BALL_STACK_SPIN + (index % BALL_STACK_PER_RING) * (2 * Math.PI / inRing) + ring * 0.5;
        return {
            target: [
                center[0] + Math.cos(angle) * BALL_STACK_RADIUS,
                center[1] + BALL_STACK_HEIGHT + ring * BALL_STACK_LAYER_SPACING,
                center[2] + Math.sin(angle) * BALL_STACK_RADIUS,
            ],
            drift: [-Math.sin(angle) * BALL_STACK_RADIUS * BALL_STACK_SPIN, 0, Math.cos(angle) * BALL_STACK_RADIUS * BALL_STACK_SPIN],
        };
    }

    function updateBallOrbit(now) {
        if (!toggles.ballOrbit)
            return;
        const center = headPosition();
        if (center)
            steerFormation(orbit, now, center, orbitPlacement);
    }

    // Where you're looking, for picking the hoop to fire at.
    function headForward() {
        try {
            if (unityAlive(refs.camera))
                return U.forward(refs.camera);
        }
        catch (_) { }
        return [0, 0, 0];
    }

    // The hoop you're looking at: the one closest to your view direction, within
    // BALL_STACK_AIM_CONE_DEGREES. Nothing in view means nothing fires.
    function hoopInView(from, facing, now) {
        const horizontal = Math.hypot(facing[0], facing[2]);
        if (horizontal < 0.2)
            return null;
        let best = null;
        let bestCosine = Math.cos(BALL_STACK_AIM_CONE_DEGREES * DEG);
        for (const candidate of hoopCandidates(now)) {
            let position;
            try {
                position = U.position(candidate.transform);
            }
            catch (_) {
                continue;
            }
            const dx = position[0] - from[0];
            const dz = position[2] - from[2];
            const distance = Math.hypot(dx, dz);
            if (distance < 0.5)
                continue;
            const cosine = (dx * facing[0] + dz * facing[2]) / (distance * horizontal);
            if (cosine > bestCosine) {
                bestCosine = cosine;
                best = { candidate, position };
            }
        }
        return best;
    }

    // Fires the next owned ball in the stack at the hoop in front of you; false when nothing went.
    function fireStackBall(now) {
        const head = headPosition();
        const hoop = head ? hoopInView(head, headForward(), now) : null;
        if (!hoop)
            return false;
        for (const [key, entry] of ballStack.balls) {
            if (!entry.owned || entry.kinematic || !unityAlive(entry.rigidbody))
                continue;
            let launched = false;
            try {
                launched = launchAtHoop(entry.ball, entry.rigidbody, U.rbPosition(entry.rigidbody), null, now, { forced: true, hoop });
            }
            catch (_) {
                continue;
            }
            if (!launched)
                return false;
            ballStack.balls.delete(key);
            recentReleases.set(key, now);
            return true;
        }
        return false;
    }

    // Balls fired into the hoop come back to the stack once they're done, so holding RT keeps going.
    function updateBallStack(now) {
        if (!toggles.ballStack)
            return;
        const center = headPosition();
        if (!center)
            return;
        steerFormation(ballStack, now, center, stackPlacement);
        if (input.rightTrigger < BALL_STACK_TRIGGER_THRESHOLD || now < ballStack.nextShot)
            return;
        ballStack.nextShot = now + BALL_STACK_FIRE_INTERVAL_SECONDS;
        fireStackBall(now);
    }

    // ───────────────────────────────────── Steal ball ─────────────────────────────────────

    // RT takes the ball you point at with your right hand, at any distance, without touching it. A
    // ball someone is holding is knocked out of their hand through the game's own slap (its steal
    // rules and cooldown apply, and it's what makes their game let go); once nobody holds it, the
    // game's forced grab puts it in your hand and takes ownership the normal way.
    const stealBall = { triggerHeld: false, attempt: null };

    const handHolding = (grabber) => OFF.grabber.held >= 0 && unityAlive(readPointerAt(grabber, OFF.grabber.held));

    function resetStealBall() {
        stealBall.triggerHeld = false;
        stealBall.attempt = null;
    }

    function freeGrabber() {
        for (const grabber of [refs.grabberRight, refs.grabberLeft]) {
            if (unityAlive(grabber) && !handHolding(grabber))
                return grabber;
        }
        return NULL;
    }

    function stealTarget(now) {
        const hand = unityAlive(refs.rightHand) ? U.position(refs.rightHand) : null;
        if (!hand)
            return null;
        const pointing = U.forward(refs.rightHand);
        const pointingLength = Math.hypot(pointing[0], pointing[1], pointing[2]) || 1;
        const coneCosine = Math.cos(STEAL_BALL_CONE_DEGREES * DEG);
        let best = null;
        for (const ball of trackedBalls(now)) {
            try {
                if (!unityAlive(ball.rb) || G.ballHeldByMe(ball.pointer))
                    continue;
                const position = U.rbPosition(ball.rb);
                const offset = [position[0] - hand[0], position[1] - hand[1], position[2] - hand[2]];
                const distance = Math.hypot(offset[0], offset[1], offset[2]);
                if (distance > STEAL_BALL_MAX_DISTANCE)
                    continue;
                // Right next to the hand wins outright; otherwise the ball closest to the pointing ray.
                const score = distance <= STEAL_BALL_NEAR_DISTANCE
                    ? 2 + (STEAL_BALL_NEAR_DISTANCE - distance)
                    : (offset[0] * pointing[0] + offset[1] * pointing[1] + offset[2] * pointing[2]) / (distance * pointingLength);
                if (score >= coneCosine && (!best || score > best.score))
                    best = { ball, position, score };
            }
            catch (_) { }
        }
        return best;
    }

    function startSteal(now) {
        const target = stealTarget(now);
        if (!target) {
            log("steal ball: point your right hand at a ball");
            return;
        }
        stealBall.attempt = { ball: target.ball.pointer, key: target.ball.key, until: now + STEAL_BALL_TIMEOUT_SECONDS, nextGrab: 0, nextSlap: 0 };
    }

    function slapTowardHand(attempt, now) {
        attempt.nextSlap = now + STEAL_BALL_SLAP_RETRY_SECONDS;
        const hand = U.position(refs.rightHand);
        const ball = ballPosition(attempt.ball);
        const toHand = ball ? [hand[0] - ball[0], hand[1] - ball[1], hand[2] - ball[2]] : [0, 0, 0];
        const length = Math.hypot(toHand[0], toHand[1], toHand[2]) || 1;
        const speed = Math.min(12, length * 3);
        G.ballSlap(attempt.ball, toHand.map((value) => value / length * speed), 1);
    }

    function updateStealBall(now) {
        const held = toggles.stealBall && input.rightTrigger >= STEAL_BALL_TRIGGER_THRESHOLD;
        if (held && !stealBall.triggerHeld && !stealBall.attempt)
            startSteal(now);
        stealBall.triggerHeld = held;
        const attempt = stealBall.attempt;
        if (!attempt)
            return;
        try {
            if (!unityAlive(attempt.ball) || now > attempt.until) {
                if (unityAlive(attempt.ball))
                    log("steal ball: couldn't get that ball (the game didn't allow the steal)");
                stealBall.attempt = null;
                return;
            }
            if (G.ballHeldByMe(attempt.ball)) {
                log("steal ball: got it");
                stealBall.attempt = null;
                return;
            }
            if (G.ballHeldBySomeoneElse(attempt.ball)) {
                if (now >= attempt.nextSlap)
                    slapTowardHand(attempt, now);
                return;
            }
            if (now < attempt.nextGrab)
                return;
            attempt.nextGrab = now + STEAL_BALL_RETRY_SECONDS;
            const grabber = freeGrabber();
            if (grabber.isNull()) {
                log("steal ball: both hands are full");
                stealBall.attempt = null;
                return;
            }
            G.ballForceGrab(attempt.ball, grabber);
        }
        catch (error) {
            logThrottled("steal-ball", 5, `steal ball failed: ${error}`);
            stealBall.attempt = null;
        }
    }

    // ──────────────────────────────────── Grip spawn ────────────────────────────────────

    // Gripping with an empty hand spawns a ball into it: the same ball the game hands you on B, with
    // the same spawn cooldown. A grip that picks something up by itself first is left alone, so
    // grabbing real balls still works.
    const gripSpawn = {
        hands: [
            { side: 0, grip: () => input.leftGrip, grabber: () => refs.grabberLeft, down: false, checkAt: 0 },
            { side: 1, grip: () => input.rightGrip, grabber: () => refs.grabberRight, down: false, checkAt: 0 },
        ],
    };

    function resetGripSpawn() {
        for (const hand of gripSpawn.hands) {
            hand.down = false;
            hand.checkAt = 0;
        }
    }

    // The grabber's own grip threshold, so a "grip" here is exactly what the game treats as one.
    function gripThreshold(grabber) {
        if (OFF.grabber.gripAmount >= 0) {
            const amount = readFloatAt(grabber, OFF.grabber.gripAmount);
            if (amount > 0.05 && amount <= 1)
                return amount;
        }
        return GRIP_SPAWN_DEFAULT_THRESHOLD;
    }

    function spawnBallInHand(hand, grabber) {
        const controller = refs.ballController;
        if (!unityAlive(controller) || !G.canSpawnBall(controller) || !G.attemptSpawnBall(controller, hand.side))
            return;
        const ball = G.currentBall(controller);
        if (!unityAlive(ball) || OFF.ball.grabbable < 0 || handHolding(grabber))
            return;
        const grabbable = readPointerAt(ball, OFF.ball.grabbable);
        const ballAt = ballPosition(ball);
        // Only grab it when it really is the ball that just appeared at this hand.
        if (!unityAlive(grabbable) || !ballAt ||
            distanceSquared(ballAt, U.position(U.componentTransform(grabber))) > GRIP_SPAWN_GRAB_DISTANCE * GRIP_SPAWN_GRAB_DISTANCE)
            return;
        G.grabberDoGrab(grabber, grabbable, 1);
    }

    function updateGripSpawn(now) {
        if (!toggles.gripSpawn)
            return;
        for (const hand of gripSpawn.hands) {
            const grabber = hand.grabber();
            if (!unityAlive(grabber)) {
                hand.down = false;
                hand.checkAt = 0;
                continue;
            }
            const down = hand.grip() >= gripThreshold(grabber);
            if (down && !hand.down)
                hand.checkAt = now + GRIP_SPAWN_DELAY_SECONDS;
            hand.down = down;
            if (!down || hand.checkAt === 0 || now < hand.checkAt)
                continue;
            hand.checkAt = 0;
            if (!handHolding(grabber))
                spawnBallInHand(hand, grabber);
        }
    }

    // ─────────────────────────────────────── Visuals ───────────────────────────────────────

    const visuals = {
        players: new Map(),
        ballLines: new Map(),
        ballMarkers: new Map(),
        lineMaterial: null,
        markerMaterial: null,
        unavailable: false,
        suspended: false,
        nextRescan: 0,
        nextUpdate: 0,
    };

    const anyVisualEnabled = () => toggles.ballEsp || toggles.playerTracers || toggles.ballTracers;

    // Proxy materials with ZTest Always, so tracers and markers render through walls without
    // touching the targets' own materials.
    function throughWallMaterial(color) {
        let material = NULL;
        let handle = null;
        const hasDepth = (candidate) => {
            try {
                return unityAlive(candidate) && !!U.materialHasProperty(candidate, managed("_ZTest"));
            }
            catch (_) {
                return false;
            }
        };
        const release = () => {
            destroyObject(material);
            if (handle) {
                try {
                    handle.free();
                }
                catch (_) { }
            }
            material = NULL;
            handle = null;
        };
        try {
            const source = U.defaultLineMaterial();
            if (unityAlive(source)) {
                material = Unity.Material.alloc().handle;
                handle = pinObject(material);
                U.newMaterialCopy(material, source);
            }
        }
        catch (_) { }
        if (!hasDepth(material)) {
            release();
            try {
                const shader = U.shaderFind(managed("Hidden/Internal-Colored"));
                if (unityAlive(shader)) {
                    material = Unity.Material.alloc().handle;
                    handle = pinObject(material);
                    U.newMaterialFromShader(material, shader);
                }
            }
            catch (_) { }
        }
        if (!hasDepth(material)) {
            release();
            throw new Error("no shader with a controllable _ZTest property is available");
        }
        try {
            U.materialColor(material, color);
        }
        catch (_) { }
        trySetColor(material, "_Color", color);
        trySetColor(material, "_BaseColor", color);
        trySetFloat(material, "_ZTest", 8);
        trySetFloat(material, "_ZWrite", 0);
        trySetFloat(material, "_Cull", 0);
        trySetFloat(material, "_SrcBlend", 5);
        trySetFloat(material, "_DstBlend", 10);
        try {
            U.materialOverrideTag(material, managed("RenderType"), managed("Transparent"));
        }
        catch (_) { }
        tryKeyword(material, "_ALPHABLEND_ON", true);
        try {
            U.materialRenderQueue(material, 4000);
        }
        catch (_) { }
        try {
            U.setHideFlags(material, HIDE_DONT_UNLOAD);
        }
        catch (_) { }
        return { pointer: material, handle };
    }

    function releaseVisualMaterials() {
        for (const key of ["lineMaterial", "markerMaterial"]) {
            const material = visuals[key];
            if (material) {
                destroyObject(material.pointer);
                try {
                    material.handle.free();
                }
                catch (_) { }
            }
            visuals[key] = null;
        }
    }

    function ensureVisualMaterials() {
        if (visuals.lineMaterial && unityAlive(visuals.lineMaterial.pointer) &&
            visuals.markerMaterial && unityAlive(visuals.markerMaterial.pointer))
            return true;
        if (visuals.unavailable)
            return false;
        releaseVisualMaterials();
        try {
            visuals.lineMaterial = throughWallMaterial([1, 1, 1, 1]);
            visuals.markerMaterial = throughWallMaterial([0.08, 1.0, 0.22, 0.30]);
            return true;
        }
        catch (error) {
            releaseVisualMaterials();
            visuals.unavailable = true;
            log(`through-wall visuals unavailable: ${error}`);
            return false;
        }
    }

    function createTracer(name, target, color, width) {
        const scope = [];
        if (target.head)
            keep(scope, target.head);
        const object = createGameObject(scope, name);
        try {
            const line = keep(scope, U.addComponent(object.gameObject, typeOf(Unity.LineRenderer)));
            U.setSharedMaterial(line, visuals.lineMaterial.pointer);
            U.lineWorldSpace(line, 1);
            U.linePositionCount(line, 2);
            U.lineStartWidth(line, width);
            U.lineEndWidth(line, width);
            U.lineStartColor(line, color);
            U.lineEndColor(line, color);
            try {
                U.lineCapVertices(line, 2);
                U.lineAlignment(line, 0);
                U.setAllowOcclusion(line, 0);
            }
            catch (_) { }
            return { gameObject: object.gameObject, line, target, scope };
        }
        catch (error) {
            destroyObject(object.gameObject);
            releaseScope(scope);
            throw error;
        }
    }

    function createBallMarker(target) {
        const scope = [];
        const gameObject = keep(scope, U.createPrimitive(PRIMITIVE_SPHERE));
        try {
            U.setObjectName(gameObject, managed("OverdoseBallMarker"));
            U.setLayer(gameObject, MENU_LAYER);
            destroyObject(U.getComponent(gameObject, typeOf(Unity.Collider)));
            const renderer = U.getComponent(gameObject, typeOf(Unity.Renderer));
            U.setSharedMaterial(renderer, visuals.markerMaterial.pointer);
            try {
                U.setAllowOcclusion(renderer, 0);
            }
            catch (_) { }
            const transform = keep(scope, U.gameObjectTransform(gameObject));
            U.setLocalScale(transform, [0.32, 0.32, 0.32]);
            return { gameObject, transform, target, scope };
        }
        catch (error) {
            destroyObject(gameObject);
            releaseScope(scope);
            throw error;
        }
    }

    function disposeVisual(entry) {
        destroyObject(entry.gameObject);
        releaseScope(entry.scope);
    }

    function destroyVisualMap(map) {
        for (const entry of map.values())
            disposeVisual(entry);
        map.clear();
    }

    function clearVisuals(releaseMaterials) {
        destroyVisualMap(visuals.players);
        destroyVisualMap(visuals.ballLines);
        destroyVisualMap(visuals.ballMarkers);
        visuals.nextRescan = 0;
        visuals.nextUpdate = 0;
        visuals.suspended = false;
        if (releaseMaterials) {
            releaseVisualMaterials();
            visuals.unavailable = false;
        }
    }

    function setVisualsActive(active) {
        if (active === !visuals.suspended)
            return;
        for (const map of [visuals.players, visuals.ballLines, visuals.ballMarkers]) {
            for (const entry of map.values()) {
                if (unityAlive(entry.gameObject)) {
                    try {
                        U.setActive(entry.gameObject, active ? 1 : 0);
                    }
                    catch (_) { }
                }
            }
        }
        visuals.suspended = !active;
    }

    function visualPlayers() {
        const results = [];
        for (const player of objectsOfType(Game.NCNetworkPlayer)) {
            if (results.length >= VISUAL_MAX_PLAYERS)
                break;
            try {
                if (!unityAlive(player) || sameObject(player, refs.localPlayer))
                    continue;
                const gameObject = gameObjectOf(player);
                if (gameObject.isNull() || !U.activeInHierarchy(gameObject))
                    continue;
                const data = G.playerData(player);
                if (!unityAlive(data))
                    continue;
                if (OFF.playerData.isPlayer >= 0 && !readBoolAt(data, OFF.playerData.isPlayer))
                    continue;
                if (OFF.playerData.isLocalPlayer >= 0 && readBoolAt(data, OFF.playerData.isLocalPlayer))
                    continue;
                try {
                    if (G.playerDataIsReplay(data))
                        continue;
                }
                catch (_) { }
                let head = NULL;
                try {
                    head = G.playerDataHead(data);
                }
                catch (_) { }
                if (!unityAlive(head))
                    head = readPointerAt(player, OFF.networkPlayer.headTrack);
                if (!unityAlive(head))
                    head = U.componentTransform(player);
                results.push({ key: keyOf(player), target: player, head });
            }
            catch (_) { }
        }
        return results;
    }

    function reconcile(map, targets, create) {
        const wanted = new Set();
        for (const target of targets) {
            wanted.add(target.key);
            if (map.has(target.key))
                continue;
            try {
                map.set(target.key, create(target));
            }
            catch (error) {
                logThrottled("visual-create", 10, `visual creation failed: ${error}`);
            }
        }
        for (const [key, entry] of map) {
            if (wanted.has(key) && unityAlive(entry.gameObject))
                continue;
            disposeVisual(entry);
            map.delete(key);
        }
    }

    function updateVisuals(now) {
        if (!anyVisualEnabled())
            return;
        if (!ensureVisualMaterials())
            return;
        if (visuals.suspended)
            setVisualsActive(true);
        if (now >= visuals.nextRescan) {
            visuals.nextRescan = now + VISUAL_RESCAN_SECONDS;
            const balls = toggles.ballEsp || toggles.ballTracers
                ? trackedBalls(now).slice(0, VISUAL_MAX_BALLS).filter((ball) => unityAlive(ball.rb))
                : [];
            if (toggles.ballEsp)
                reconcile(visuals.ballMarkers, balls, (ball) => createBallMarker(ball));
            else
                destroyVisualMap(visuals.ballMarkers);
            if (toggles.ballTracers)
                reconcile(visuals.ballLines, balls, (ball) => createTracer("OverdoseBallTracer", ball, [0.05, 0.85, 1.0, 1.0], 0.012));
            else
                destroyVisualMap(visuals.ballLines);
            if (toggles.playerTracers)
                reconcile(visuals.players, visualPlayers(), (player) => createTracer("OverdosePlayerTracer", player, [1.0, 0.08, 0.08, 1.0], 0.009));
            else
                destroyVisualMap(visuals.players);
        }
        if (now < visuals.nextUpdate)
            return;
        visuals.nextUpdate = now + VISUAL_UPDATE_SECONDS;
        const hand = unityAlive(refs.rightHand) ? refs.rightHand : refs.leftHand;
        let origin = null;
        try {
            origin = unityAlive(hand) ? U.position(hand) : null;
        }
        catch (_) { }
        const updateLines = (map, endpoint) => {
            for (const [key, entry] of map) {
                try {
                    const end = endpoint(entry.target);
                    if (!origin || !end || !unityAlive(entry.line))
                        throw new Error("target unavailable");
                    U.lineSetPosition(entry.line, 0, origin);
                    U.lineSetPosition(entry.line, 1, end);
                }
                catch (_) {
                    disposeVisual(entry);
                    map.delete(key);
                }
            }
        };
        updateLines(visuals.players, (player) => unityAlive(player.head) ? U.position(player.head) : null);
        updateLines(visuals.ballLines, (ball) => unityAlive(ball.rb) ? U.rbPosition(ball.rb) : null);
        for (const [key, entry] of visuals.ballMarkers) {
            try {
                if (!unityAlive(entry.target.rb) || !unityAlive(entry.transform))
                    throw new Error("target unavailable");
                U.setPosition(entry.transform, U.rbPosition(entry.target.rb));
            }
            catch (_) {
                disposeVisual(entry);
                visuals.ballMarkers.delete(key);
            }
        }
    }

    // ───────────────────────────────────── Hoop hitbox ─────────────────────────────────────

    const hoopHitbox = { colliders: new Map(), nextRescan: 0, scope: [] };

    function expandHoopCollider(collider) {
        if (!unityAlive(collider))
            return false;
        const key = keyOf(collider);
        let tracked = hoopHitbox.colliders.get(key);
        if (!tracked) {
            try {
                tracked = { collider: keep(hoopHitbox.scope, collider), originalSize: U.boxSize(collider) };
                hoopHitbox.colliders.set(key, tracked);
            }
            catch (_) {
                return false;
            }
        }
        const original = tracked.originalSize;
        const expanded = [Math.max(0.25, original[0] * 4.0), Math.max(0.25, original[1] * 1.5), Math.max(0.25, original[2] * 4.0)];
        try {
            const current = U.boxSize(collider);
            if (current.every((value, axis) => Math.abs(value - expanded[axis]) < 0.0001))
                return false;
            U.setBoxSize(collider, expanded);
            return true;
        }
        catch (_) {
            return false;
        }
    }

    function refreshHoopHitboxes() {
        let changed = false;
        if (OFF.scoreZone.box >= 0) {
            for (const zone of objectsOfType(Game.ScoreZone)) {
                if (unityAlive(zone))
                    changed = expandHoopCollider(readPointerAt(zone, OFF.scoreZone.box)) || changed;
            }
        }
        // Some maps route the same ScoreZone through a small forwarding trigger. Only that trigger's
        // BoxCollider is widened; rim, backboard, net and shield colliders stay untouched.
        if (OFF.scoreZoneTrigger.zone >= 0) {
            for (const trigger of objectsOfType(Game.ScoreZoneTrigger)) {
                try {
                    if (!unityAlive(trigger) || !unityAlive(readPointerAt(trigger, OFF.scoreZoneTrigger.zone)))
                        continue;
                    changed = expandHoopCollider(U.componentGetComponent(trigger, typeOf(Unity.BoxCollider))) || changed;
                }
                catch (_) { }
            }
        }
        if (changed) {
            try {
                U.syncTransforms();
            }
            catch (_) { }
        }
    }

    function restoreHoopHitboxes() {
        let changed = false;
        for (const [key, tracked] of hoopHitbox.colliders) {
            try {
                if (unityAlive(tracked.collider)) {
                    U.setBoxSize(tracked.collider, tracked.originalSize);
                    changed = true;
                }
            }
            catch (_) { }
            hoopHitbox.colliders.delete(key);
        }
        releaseScope(hoopHitbox.scope);
        hoopHitbox.nextRescan = 0;
        if (changed) {
            try {
                U.syncTransforms();
            }
            catch (_) { }
        }
    }

    function updateHoopHitboxes(now) {
        if (now < hoopHitbox.nextRescan)
            return;
        hoopHitbox.nextRescan = now + HOOP_HITBOX_RESCAN_SECONDS;
        if (toggles.increaseHoopHitbox)
            refreshHoopHitboxes();
        else if (hoopHitbox.colliders.size > 0)
            restoreHoopHitboxes();
    }

    // ─────────────────────────────────── Points per shot ───────────────────────────────────

    const scoreAward = { hooksReady: false, depth: 0, consumed: false };

    // Scoped to a real score event from a ball the local player shot: the game's own reliable
    // IncrementScore write is changed once, and no extra score event or network call is sent.
    function installScoreAwardHooks() {
        if (!Game.GameEventService || !Game.CompetitiveGameSync) {
            log("points-per-shot hooks unavailable: score classes missing");
            return;
        }
        const getLocalPlayerId = bind(Game.CompetitiveGameSync, "GetLocalPlayerId", 0);
        const handled = hookMethod(Game.GameEventService, "HandleScoreEvent", 2, null, (original) => function (zone, ball) {
            let localShot = false;
            try {
                localShot = settings.pointsPerShot > 1 && unityAlive(ball) && !!G.ballShotByLocalPlayer(ball.handle);
            }
            catch (_) { }
            const previousConsumed = scoreAward.consumed;
            if (localShot) {
                scoreAward.depth++;
                scoreAward.consumed = false;
            }
            try {
                return original(this, zone, ball);
            }
            finally {
                if (localShot) {
                    scoreAward.depth = Math.max(0, scoreAward.depth - 1);
                    scoreAward.consumed = previousConsumed;
                }
            }
        });
        const incremented = hookMethod(Game.CompetitiveGameSync, "IncrementScore", 2, null, (original) => function (playerId, add) {
            let award = Number(add);
            if (scoreAward.depth > 0 && !scoreAward.consumed && settings.pointsPerShot > 1 && Number.isFinite(award) && award > 0) {
                try {
                    if (Number(playerId) === Number(getLocalPlayerId(this.handle))) {
                        award = settings.pointsPerShot;
                        scoreAward.consumed = true;
                        log(`local score awarded ${award} points`);
                    }
                }
                catch (_) { }
            }
            return original(this, playerId, award);
        });
        scoreAward.hooksReady = handled && incremented;
        log(scoreAward.hooksReady ? "points-per-shot hooks installed" : "points-per-shot hooks unavailable");
    }

    // ──────────────────────────────── Gold score explosion ────────────────────────────────

    const goldExplosion = { model: NULL, originalSku: null, nextRefresh: 0 };

    function restoreGoldExplosion() {
        if (isLive(goldExplosion.model) && goldExplosion.originalSku !== null) {
            try {
                if (Number(G.modelVfxScore(goldExplosion.model)) === GOLD_EXPLOSION_SKU)
                    G.modelSetVfxScore(goldExplosion.model, goldExplosion.originalSku);
            }
            catch (_) { }
        }
        goldExplosion.model = NULL;
        goldExplosion.originalSku = null;
    }

    function applyGoldExplosion() {
        if (!toggles.goldExplosion) {
            restoreGoldExplosion();
            return;
        }
        const model = refs.localModel;
        if (!isLive(model))
            return;
        try {
            if (!sameObject(model, goldExplosion.model)) {
                restoreGoldExplosion();
                goldExplosion.model = model;
                goldExplosion.originalSku = Number(G.modelVfxScore(model));
            }
            if (Number(G.modelVfxScore(model)) !== GOLD_EXPLOSION_SKU) {
                G.modelSetVfxScore(model, GOLD_EXPLOSION_SKU);
                log(`equipped unreleased gold score explosion (SKU ${GOLD_EXPLOSION_SKU})`);
            }
        }
        catch (error) {
            logThrottled("gold", 10, `gold explosion apply failed: ${error}`);
        }
    }

    function updateGoldExplosion(now) {
        if (!toggles.goldExplosion || now < goldExplosion.nextRefresh)
            return;
        goldExplosion.nextRefresh = now + GOLD_EXPLOSION_REFRESH_SECONDS;
        applyGoldExplosion();
    }

    // ───────────────────────────── Rainbow & all score effects ─────────────────────────────

    const scoreEffects = {
        hooksReady: false,
        rainbow: new Map(),
        rainbowDepth: 0,
        nextRainbowUpdate: 0,
        colorIds: null,
        localCandidateDepth: 0,
        localConfirmed: false,
        localPosition: null,
        localOriginalSku: null,
        syncedDispatchDepth: 0,
        syntheticPlaybackDepth: 0,
        playbackDepth: 0,
        playbackStartedAt: 0,
        active: new Map(),
        pending: [],
        echoes: [],
        burst: null,
        nextSequenceTime: 0,
        nextDispatchTime: 0,
        unavailableSince: 0,
        nextCleanupTime: 0,
    };

    function rainbowColorIds() {
        if (!scoreEffects.colorIds) {
            scoreEffects.colorIds = ["_Color", "_BaseColor", "_TintColor", "_EmissionColor"]
                .map((name) => Number(U.propertyToId(managed(name))));
        }
        return scoreEffects.colorIds;
    }

    function disposePropertyBlock(block) {
        if (!block)
            return;
        try {
            U.blockDispose(block.pointer);
        }
        catch (_) { }
        try {
            block.handle.free();
        }
        catch (_) { }
    }

    function newPropertyBlock() {
        const block = Unity.MaterialPropertyBlock.alloc().handle;
        const handle = new Il2Cpp.Object(block).ref(true);
        U.newPropertyBlock(block);
        return { pointer: block, handle };
    }

    function restoreRainbowInstance(instance) {
        for (const state of instance.renderers) {
            try {
                if (unityAlive(state.renderer))
                    U.setPropertyBlock(state.renderer, state.original.pointer);
            }
            catch (_) { }
            disposePropertyBlock(state.original);
            disposePropertyBlock(state.rainbow);
        }
        instance.renderers.length = 0;
        releaseScope(instance.scope);
    }

    function removeRainbowVfx(root) {
        const key = keyOf(root);
        const instance = scoreEffects.rainbow.get(key);
        if (!instance)
            return;
        scoreEffects.rainbow.delete(key);
        restoreRainbowInstance(instance);
    }

    function clearRainbowVfx() {
        for (const instance of scoreEffects.rainbow.values())
            restoreRainbowInstance(instance);
        scoreEffects.rainbow.clear();
        scoreEffects.nextRainbowUpdate = 0;
    }

    function registerRainbowVfx(root) {
        if (scoreEffects.syntheticPlaybackDepth > 0 || !toggles.rainbowShotExplosions || !unityAlive(root))
            return;
        removeRainbowVfx(root);
        const states = [];
        const scope = [];
        keep(scope, root);
        try {
            const renderers = componentsInChildren(gameObjectOf(root), Unity.ParticleSystemRenderer);
            renderers.forEach((renderer, index) => {
                if (!unityAlive(renderer))
                    return;
                keep(scope, renderer);
                let original = null;
                let rainbow = null;
                try {
                    original = newPropertyBlock();
                    rainbow = newPropertyBlock();
                    U.getPropertyBlock(renderer, original.pointer);
                    U.getPropertyBlock(renderer, rainbow.pointer);
                    states.push({ renderer, original, rainbow, hueOffset: renderers.length > 1 ? index / renderers.length : 0 });
                }
                catch (_) {
                    disposePropertyBlock(original);
                    disposePropertyBlock(rainbow);
                }
            });
        }
        catch (error) {
            log(`rainbow score-effect capture failed: ${error}`);
        }
        if (states.length > 0) {
            scoreEffects.rainbow.set(keyOf(root), { root, renderers: states, scope });
            scoreEffects.nextRainbowUpdate = 0;
        }
        else {
            releaseScope(scope);
        }
    }

    function updateRainbowVfx(now) {
        if (!toggles.rainbowShotExplosions) {
            if (scoreEffects.rainbow.size > 0)
                clearRainbowVfx();
            return;
        }
        if (scoreEffects.rainbow.size === 0 || now < scoreEffects.nextRainbowUpdate)
            return;
        scoreEffects.nextRainbowUpdate = now + RAINBOW_VFX_UPDATE_SECONDS;
        const colorIds = rainbowColorIds();
        for (const [key, instance] of scoreEffects.rainbow) {
            let playing = unityAlive(instance.root);
            if (playing) {
                try {
                    playing = !!U.particleIsAlive(instance.root, 1);
                }
                catch (_) {
                    playing = false;
                }
            }
            if (!playing) {
                scoreEffects.rainbow.delete(key);
                restoreRainbowInstance(instance);
                continue;
            }
            for (const state of instance.renderers) {
                if (!unityAlive(state.renderer))
                    continue;
                try {
                    const color = hsvToRgb(now * RAINBOW_VFX_HUE_CYCLES_PER_SECOND + state.hueOffset, 1.0, 1.0);
                    for (const id of colorIds)
                        U.blockSetColor(state.rainbow.pointer, id, color);
                    U.setPropertyBlock(state.renderer, state.rainbow.pointer);
                }
                catch (_) { }
            }
        }
    }

    function restoreParticleLimits(entry) {
        if (entry.limitsRestored)
            return;
        entry.limitsRestored = true;
        for (const limited of entry.limited) {
            try {
                if (unityAlive(limited.system))
                    U.particleSetMax(limited.system, limited.originalMax);
            }
            catch (_) { }
        }
    }

    // Caps a synthetic score effect's particle budget. Small systems are allocated first so unused
    // capacity is redistributed; every system keeps Unity's minimum of one particle.
    function forgetScoreEffect(key) {
        const entry = scoreEffects.active.get(key);
        if (!entry)
            return;
        scoreEffects.active.delete(key);
        releaseScope(entry.scope);
    }

    function trackAndLimitScoreEffect(root, startedAt) {
        if (!unityAlive(root))
            return;
        const key = keyOf(root);
        const previous = scoreEffects.active.get(key);
        if (previous) {
            restoreParticleLimits(previous);
            forgetScoreEffect(key);
        }
        const scope = [];
        keep(scope, root);
        const systems = [];
        for (const system of componentsInChildren(gameObjectOf(root), Unity.ParticleSystem)) {
            try {
                if (!unityAlive(system))
                    continue;
                keep(scope, system);
                const originalMax = Number(U.particleMax(system));
                if (Number.isFinite(originalMax) && originalMax > 0)
                    systems.push({ system, originalMax });
            }
            catch (_) { }
        }
        systems.sort((left, right) => left.originalMax - right.originalMax);
        let budget = Math.max(ALL_SCORE_EFFECTS_MAX_PARTICLES_PER_ROOT, systems.length);
        let remaining = systems.length;
        const limited = [];
        for (const particle of systems) {
            const share = Math.max(1, Math.floor(budget / Math.max(1, remaining)));
            const cap = Math.max(1, Math.min(particle.originalMax, share));
            try {
                if (cap < particle.originalMax) {
                    U.particleSetMax(particle.system, cap);
                    limited.push(particle);
                }
                budget = Math.max(0, budget - cap);
            }
            catch (_) { }
            remaining--;
        }
        scoreEffects.active.set(key, { root, startedAt, stopRequestedAt: null, limited, limitsRestored: false, scope });
    }

    function stopScoreEffect(entry, now, retry = false) {
        if (entry.stopRequestedAt !== null && !retry)
            return;
        entry.stopRequestedAt = now;
        removeRainbowVfx(entry.root);
        // StopEmittingAndClear = 0. The game's coroutine stays responsible for the single
        // ReturnToPool call.
        if (unityAlive(entry.root)) {
            try {
                U.particleStop(entry.root, 1, 0);
            }
            catch (_) { }
            try {
                U.particleClear(entry.root, 1);
            }
            catch (_) { }
        }
    }

    function updateActiveScoreEffects(now) {
        if (now < scoreEffects.nextCleanupTime)
            return;
        scoreEffects.nextCleanupTime = now + ALL_SCORE_EFFECTS_CLEANUP_INTERVAL_SECONDS;
        for (const [key, entry] of scoreEffects.active) {
            if (!unityAlive(entry.root)) {
                forgetScoreEffect(key);
                continue;
            }
            let playing = true;
            try {
                playing = !!U.particleIsAlive(entry.root, 1);
            }
            catch (_) { }
            if (entry.stopRequestedAt !== null) {
                if (!playing) {
                    restoreParticleLimits(entry);
                    forgetScoreEffect(key);
                }
                else if (now - entry.stopRequestedAt >= ALL_SCORE_EFFECTS_STOP_GRACE_SECONDS) {
                    // Stay capped and retry instead of restoring a live effect to its huge limit.
                    stopScoreEffect(entry, now, true);
                }
                continue;
            }
            if (now - entry.startedAt >= ALL_SCORE_EFFECTS_ACTIVE_SECONDS)
                stopScoreEffect(entry, now);
        }
    }

    function pruneScoreEchoes(now) {
        for (let index = scoreEffects.echoes.length - 1; index >= 0; index--) {
            if (scoreEffects.echoes[index].expiresAt <= now)
                scoreEffects.echoes.splice(index, 1);
        }
    }

    function consumeScoreEcho(sku, point, now) {
        pruneScoreEchoes(now);
        for (let index = 0; index < scoreEffects.echoes.length; index++) {
            const expected = scoreEffects.echoes[index];
            if (expected.sku === sku && distanceSquared(expected.position, point) <= ALL_SCORE_EFFECTS_SYNC_POSITION_TOLERANCE_SQ) {
                scoreEffects.echoes.splice(index, 1);
                return expected;
            }
        }
        return null;
    }

    function cancelScoreEffectsPlayback() {
        scoreEffects.pending.length = 0;
        scoreEffects.echoes.length = 0;
        const now = clock();
        for (const entry of scoreEffects.active.values())
            stopScoreEffect(entry, now);
        scoreEffects.burst = null;
        scoreEffects.playbackStartedAt = 0;
        scoreEffects.nextDispatchTime = 0;
        scoreEffects.unavailableSince = 0;
        scoreEffects.nextCleanupTime = 0;
    }

    // Already-sent room events cannot be recalled, so echo tokens and live roots stay protected
    // until they expire or return to the pool.
    function cancelUnsentScoreEffects() {
        scoreEffects.pending.length = 0;
        scoreEffects.burst = null;
        scoreEffects.nextDispatchTime = 0;
        scoreEffects.unavailableSince = 0;
    }

    function resolveOriginalScoreSku(listener) {
        const sku = scoreEffects.localOriginalSku;
        if (sku !== null && Number.isFinite(sku))
            return sku;
        try {
            const forced = listener.method("get_ForceScoreVFX", 0).invoke();
            if (unityAlive(forced)) {
                const forcedSku = Number(forced.method("GetSKU", 0).invoke());
                if (Number.isFinite(forcedSku) && forcedSku > 0)
                    return forcedSku;
            }
        }
        catch (_) { }
        try {
            if (isLive(refs.localModel)) {
                const modelSku = Number(G.modelVfxScore(refs.localModel));
                if (Number.isFinite(modelSku) && modelSku > 0)
                    return modelSku;
            }
        }
        catch (_) { }
        return null;
    }

    function queueAllScoreEffects(point, alreadyPlayedSku) {
        if (!toggles.allScoreEffects || !scoreEffects.hooksReady)
            return;
        const now = clock();
        if (scoreEffects.pending.length > 0 || now < scoreEffects.nextSequenceTime)
            return;
        // A new basket replaces lingering visuals from the previous one; stopped roots stay capped
        // and tracked until the pool takes them back.
        for (const entry of scoreEffects.active.values())
            stopScoreEffect(entry, now);
        scoreEffects.nextCleanupTime = 0;
        const skus = Array.from(new Set(ALL_SCORE_EFFECT_SKUS));
        const originalPlayed = alreadyPlayedSku !== null && skus.includes(alreadyPlayedSku);
        scoreEffects.nextSequenceTime = now + ALL_SCORE_EFFECTS_SYNC_SEQUENCE_COOLDOWN_SECONDS;
        scoreEffects.nextDispatchTime = now + ALL_SCORE_EFFECTS_SYNC_INITIAL_DELAY_SECONDS;
        scoreEffects.unavailableSince = 0;
        for (const sku of skus) {
            if (!(originalPlayed && sku === alreadyPlayedSku))
                scoreEffects.pending.push({ sku, position: point });
        }
        scoreEffects.burst = { queued: scoreEffects.pending.length, originalPlayed, sent: 0, failed: 0 };
        log(`queued ${scoreEffects.pending.length} room-synced score effects` + (originalPlayed ? " plus the game's original effect" : ""));
    }

    function scoreSyncBlocked(now, reason) {
        if (scoreEffects.unavailableSince <= 0) {
            scoreEffects.unavailableSince = now;
            return false;
        }
        if (now - scoreEffects.unavailableSince >= ALL_SCORE_EFFECTS_SYNC_READY_TIMEOUT_SECONDS) {
            log(`canceled unsent score effects: ${reason}`);
            cancelScoreEffectsPlayback();
            return true;
        }
        return false;
    }

    function updatePendingScoreEffects(now) {
        updateActiveScoreEffects(now);
        pruneScoreEchoes(now);
        if (!toggles.allScoreEffects) {
            if (scoreEffects.pending.length > 0)
                cancelUnsentScoreEffects();
            return;
        }
        if (scoreEffects.pending.length === 0 || now < scoreEffects.nextDispatchTime)
            return;
        const vfxSync = statics.vfxSync();
        let syncReady = false;
        if (unityAlive(vfxSync) && OFF.vfxSync.model >= 0) {
            try {
                syncReady = isLive(readPointerAt(vfxSync, OFF.vfxSync.model));
            }
            catch (_) { }
        }
        if (!syncReady) {
            scoreSyncBlocked(now, "room VFX sync unavailable");
            return;
        }
        if (OFF.vfxSync.lock >= 0 && readBoolAt(vfxSync, OFF.vfxSync.lock)) {
            if (!scoreSyncBlocked(now, "room VFX sync stayed locked"))
                scoreEffects.nextDispatchTime = now + ALL_SCORE_EFFECTS_SYNC_LOCK_RETRY_SECONDS;
            return;
        }
        scoreEffects.unavailableSince = 0;
        // Network sends are at-most-once: PlayVFXSynced can commit a reliable model update before
        // throwing, so retrying could duplicate it.
        const pending = scoreEffects.pending.shift();
        const echo = { sku: pending.sku, position: pending.position, expiresAt: now + ALL_SCORE_EFFECTS_SYNC_ECHO_WINDOW_SECONDS };
        while (scoreEffects.echoes.length >= ALL_SCORE_EFFECTS_MAX_ECHO_TOKENS)
            scoreEffects.echoes.shift();
        scoreEffects.echoes.push(echo);
        try {
            scoreEffects.syncedDispatchDepth++;
            G.playVfxSynced(vfxSync, pending.sku, pending.position);
            if (scoreEffects.burst)
                scoreEffects.burst.sent++;
        }
        catch (error) {
            const index = scoreEffects.echoes.indexOf(echo);
            if (index >= 0)
                scoreEffects.echoes.splice(index, 1);
            if (scoreEffects.burst)
                scoreEffects.burst.failed++;
            log(`synced score effect ${pending.sku} failed: ${error}`);
        }
        finally {
            scoreEffects.syncedDispatchDepth = Math.max(0, scoreEffects.syncedDispatchDepth - 1);
        }
        scoreEffects.nextDispatchTime = now + ALL_SCORE_EFFECTS_SYNC_INTERVAL_SECONDS;
        if (scoreEffects.pending.length === 0 && scoreEffects.burst) {
            const burst = scoreEffects.burst;
            const extra = burst.originalPlayed ? 1 : 0;
            log(`all-score-effects sequence sent ${burst.sent + extra}/${burst.queued + extra}` + (burst.failed > 0 ? ` (${burst.failed} failed)` : ""));
            scoreEffects.burst = null;
        }
    }

    function resetScoreEffectsState() {
        clearRainbowVfx();
        cancelScoreEffectsPlayback();
        scoreEffects.rainbowDepth = 0;
        scoreEffects.localCandidateDepth = 0;
        scoreEffects.localConfirmed = false;
        scoreEffects.localPosition = null;
        scoreEffects.localOriginalSku = null;
        scoreEffects.syncedDispatchDepth = 0;
        scoreEffects.syntheticPlaybackDepth = 0;
        scoreEffects.playbackDepth = 0;
        scoreEffects.nextSequenceTime = 0;
    }

    function installScoreEffectHooks() {
        if (!Game.BasketballEventListener || !Game.VFXSync || !Game.VFXEvent) {
            log("rainbow score hooks unavailable: BasketballEventListener/VFX classes missing");
            return;
        }
        const scoreVfxSku = (vfxEvent) => {
            const item = readPointerAt(vfxEvent, OFF.vfxEvent.item);
            if (!unityAlive(item) || OFF.item.type < 0 || readIntAt(item, OFF.item.type) !== SCORE_VFX_ITEM_TYPE)
                return null;
            return OFF.item.sku >= 0 ? readIntAt(item, OFF.item.sku) : 0;
        };
        const installed = [
            // The game's own score send confirms the basket and tells us which effect is equipped,
            // so that one is left out of the sequence.
            hookMethod(Game.VFXSync, "PlayVFXSynced", 2, null, (original) => function (vfxSku, position) {
                const sku = Number(vfxSku);
                if (scoreEffects.localCandidateDepth > 0 && scoreEffects.syncedDispatchDepth === 0 && Number.isFinite(sku) && sku > 0) {
                    scoreEffects.localOriginalSku = sku;
                    scoreEffects.localConfirmed = true;
                }
                return original(this, vfxSku, position);
            }),
            // PlayVFXSynced echoes back through PlayVFXLocally on the sender. Only effects from the
            // sequence (ours or another modded player's) get the short lifetime and particle cap.
            hookMethod(Game.VFXSync, "PlayVFXLocally", 2, null, (original) => function (vfxSku, position) {
                const now = clock();
                const sku = Number(vfxSku);
                let point = [0, 0, 0];
                try {
                    point = [Number(position.field("x").value), Number(position.field("y").value), Number(position.field("z").value)];
                }
                catch (_) { }
                const expected = consumeScoreEcho(sku, point, now);
                const cap = expected !== null || ALL_SCORE_EFFECT_SKUS.includes(sku);
                if (cap) {
                    scoreEffects.playbackDepth++;
                    scoreEffects.playbackStartedAt = now;
                }
                if (expected)
                    scoreEffects.syntheticPlaybackDepth++;
                try {
                    return original(this, vfxSku, position);
                }
                finally {
                    if (expected)
                        scoreEffects.syntheticPlaybackDepth = Math.max(0, scoreEffects.syntheticPlaybackDepth - 1);
                    if (cap) {
                        scoreEffects.playbackDepth = Math.max(0, scoreEffects.playbackDepth - 1);
                        if (scoreEffects.playbackDepth === 0)
                            scoreEffects.playbackStartedAt = 0;
                    }
                }
            }),
            hookMethod(Game.BasketballEventListener, "potentialScoreEvent", 3, null, (original) => function (scoreZone, ball, netCollision) {
                let candidate = false;
                try {
                    candidate = (toggles.rainbowShotExplosions || toggles.allScoreEffects) &&
                        unityAlive(ball) && !!G.ballShotByLocalPlayer(ball.handle);
                }
                catch (_) { }
                if (candidate) {
                    scoreEffects.localCandidateDepth++;
                    scoreEffects.localConfirmed = false;
                    scoreEffects.localOriginalSku = null;
                    scoreEffects.localPosition = ballPosition(ball.handle);
                    if (toggles.rainbowShotExplosions)
                        scoreEffects.rainbowDepth++;
                }
                try {
                    const result = original(this, scoreZone, ball, netCollision);
                    if (candidate && scoreEffects.localConfirmed && toggles.allScoreEffects && scoreEffects.localPosition)
                        queueAllScoreEffects(scoreEffects.localPosition, resolveOriginalScoreSku(this));
                    return result;
                }
                finally {
                    if (candidate) {
                        if (toggles.rainbowShotExplosions)
                            scoreEffects.rainbowDepth = Math.max(0, scoreEffects.rainbowDepth - 1);
                        scoreEffects.localCandidateDepth = Math.max(0, scoreEffects.localCandidateDepth - 1);
                        if (scoreEffects.localCandidateDepth === 0) {
                            scoreEffects.localConfirmed = false;
                            scoreEffects.localPosition = null;
                            scoreEffects.localOriginalSku = null;
                        }
                    }
                }
            }),
            hookMethod(Game.VFXEvent, "GetFromPool", 0, null, (original) => function () {
                const root = original(this);
                const sku = scoreVfxSku(this.handle);
                if (sku === null)
                    return root;
                const rootPointer = toPointer(root);
                if (scoreEffects.localCandidateDepth > 0)
                    scoreEffects.localConfirmed = true;
                if (scoreEffects.playbackDepth > 0 && unityAlive(rootPointer))
                    trackAndLimitScoreEffect(rootPointer, scoreEffects.playbackStartedAt || clock());
                if (scoreEffects.localCandidateDepth > 0 && scoreEffects.syntheticPlaybackDepth === 0)
                    scoreEffects.localOriginalSku = sku;
                if (scoreEffects.syntheticPlaybackDepth === 0 && scoreEffects.rainbowDepth > 0 && toggles.rainbowShotExplosions)
                    registerRainbowVfx(rootPointer);
                return root;
            }),
            hookMethod(Game.VFXEvent, "ReturnToPool", 1, null, (original) => function (root) {
                const key = keyOf(root);
                const tracked = scoreEffects.active.get(key);
                if (tracked)
                    restoreParticleLimits(tracked);
                forgetScoreEffect(key);
                removeRainbowVfx(root);
                return original(this, root);
            }),
        ];
        scoreEffects.hooksReady = installed.every(Boolean);
        log(scoreEffects.hooksReady ? "rainbow and synchronized score-effect hooks installed" : "some score-effect hooks are unavailable");
    }

    // ───────────────────────────── PlayerPrefs (migration only) ─────────────────────────────

    // Earlier versions kept the outfit and aim settings in PlayerPrefs. They're read once to seed the
    // config file and never written again.
    function prefsGetInt(key, fallback) {
        try {
            return Number(U.prefsGetInt(managed(key), Math.trunc(fallback)));
        }
        catch (error) {
            lockerLog(`PlayerPrefs.GetInt failed key=${key}: ${error}`);
            return fallback;
        }
    }

    function prefsGetString(key) {
        try {
            return readString(U.prefsGetString(managed(key), managed("")));
        }
        catch (error) {
            lockerLog(`PlayerPrefs.GetString failed key=${key}: ${error}`);
            return "";
        }
    }

    function migrateLegacyPrefs() {
        const firstString = (keys) => keys.map(prefsGetString).find((value) => value) ?? "";
        const firstFlag = (keys) => keys.map((key) => prefsGetInt(key, -1)).find((value) => value === 0 || value === 1) ?? -1;
        for (const record of firstString(LEGACY_PREF_KEYS.outfit).trim().split("|")) {
            const [itemType, sku] = record.split(":").map((part) => Math.trunc(Number(part)));
            if (itemType === TITLE_ITEM_TYPE && sku > 0)
                setDesiredTitle(sku, titleLabel(sku));
            else if (itemType > 0 && sku > 0)
                locker.saved.set(itemType, { itemType, sku });
        }
        toggles.unlockAll = LEGACY_PREF_KEYS.unlockAll.some((key) => prefsGetInt(key, 0) === 1);
        const aimMode = firstFlag(LEGACY_PREF_KEYS.aimMode);
        if (aimMode >= 0)
            settings.autoAimMode = aimMode;
        const aimGuide = firstFlag(LEGACY_PREF_KEYS.aimGuide);
        if (aimGuide >= 0)
            settings.autoAimLegit = aimGuide;
    }

    // ─────────────────────────────────── Locker items ───────────────────────────────────

    // Called thousands of times while the locker rebuilds, so it reads fields straight from memory.
    function inspectLockerItem(item) {
        const pointer = toPointer(item);
        if (pointer.isNull() || OFF.item.sku < 0 || OFF.item.type < 0)
            return null;
        try {
            const sku = pointer.add(OFF.item.sku).readS32();
            if (!(sku > 0))
                return null;
            const usageType = OFF.item.usage >= 0 ? pointer.add(OFF.item.usage).readS32() : 0;
            const itemType = pointer.add(OFF.item.type).readS32();
            // Only equippable locker content; currency, boosts and consumables stay untouched.
            const equippable = (itemType >= 1 && itemType <= 14) ||
                itemType === 16 ||
                itemType === 17 ||
                (itemType >= 24 && itemType <= 28) ||
                itemType === 30 ||
                itemType === 31 ||
                (itemType >= 33 && itemType <= 45) ||
                (itemType >= 47 && itemType <= 68);
            if (usageType === 2 || !equippable)
                return null;
            const milestone = OFF.item.milestone >= 0 ? pointer.add(OFF.item.milestone).readS32() : 0;
            // Dev items: the milestone-tagged mod avatar and the Developer title (no milestone marker).
            return { sku, itemType, dev: milestone >= 100 || sku === DEVELOPER_TITLE_SKU };
        }
        catch (_) {
            return null;
        }
    }

    const locker = {
        // The outfit Unlock All keeps on you: item type -> { itemType, sku }. Stored in the config file.
        saved: new Map(),
        // SKUs that count as owned for the rest of the session: items put on while Unlock All was on,
        // titles from the menu, and the saved outfit once Unlock All is on.
        unlockedSkus: new Set(),
        // SKUs shown as owned in the current locker view.
        exposedSkus: new Set(),
        // Per-thread depth counters for the game calls being hooked.
        automaticDepthByThread: new Map(),
        outfitDepthByThread: new Map(),
        strictDepthByThread: new Map(),
        equipDepthByThread: new Map(),
        equipSkuByThread: new Map(),
        cardDepthByThread: new Map(),
        cardSkuByThread: new Map(),
        filterTypeStackByThread: new Map(),
        filterSkuStackByThread: new Map(),
        refreshPending: false,
        uiActive: false,
        nextUiCheck: 0,
        applyDepth: 0,
        modelKey: "",
        settleUntil: 0,
        nextReapply: 0,
        attempts: new Map(),
        gaveUp: new Set(),
    };

    const wantsLockerItem = (info) => info !== null && toggles.unlockAll;
    const markLockerItem = (info) => locker.unlockedSkus.add(info.sku);

    function topOfStack(map, threadId) {
        const stack = map.get(threadId);
        return stack && stack.length > 0 ? stack[stack.length - 1] : null;
    }

    function pushStack(map, threadId, value) {
        const stack = map.get(threadId) ?? [];
        stack.push(value);
        map.set(threadId, stack);
        return stack.length;
    }

    function popStack(map, threadId) {
        const stack = map.get(threadId);
        if (!stack)
            return 0;
        stack.pop();
        if (stack.length === 0)
            map.delete(threadId);
        return stack.length;
    }

    function incrementDepth(map, threadId) {
        map.set(threadId, (map.get(threadId) ?? 0) + 1);
    }

    function decrementDepth(map, threadId) {
        const next = (map.get(threadId) ?? 1) - 1;
        if (next > 0)
            map.set(threadId, next);
        else
            map.delete(threadId);
        return Math.max(0, next);
    }

    function allowsLockerOwnership(info, threadId) {
        if (!info)
            return false;
        // What you're wearing stays owned, so the game's ownership checks after an equip or a
        // lobby change don't strip it again.
        if (locker.unlockedSkus.has(info.sku))
            return true;
        if (!toggles.unlockAll || threadId === null)
            return false;
        if ((locker.equipDepthByThread.get(threadId) ?? 0) > 0 && locker.equipSkuByThread.get(threadId) === info.sku)
            return true;
        if ((locker.cardDepthByThread.get(threadId) ?? 0) > 0 && locker.cardSkuByThread.get(threadId) === info.sku)
            return true;
        const filterType = topOfStack(locker.filterTypeStackByThread, threadId);
        if (filterType !== null) {
            // Owned (15) stays bounded to items the user actually picked (checked above): treating
            // the whole 859-item catalog as owned pushed the Quest past 4.4 GB and hung the locker.
            if (filterType === 15)
                return false;
            // Only the item FilterItem is currently evaluating is admitted.
            const filterSku = topOfStack(locker.filterSkuStackByThread, threadId);
            if (filterSku !== null && filterSku >= 0 && filterSku === info.sku) {
                locker.exposedSkus.add(info.sku);
                return true;
            }
            return false;
        }
        // Loading one of the game's saved outfits equips each of its items.
        if ((locker.outfitDepthByThread.get(threadId) ?? 0) > 0) {
            markLockerItem(info);
            return true;
        }
        if (!lockerUiProbe())
            return false;
        return locker.exposedSkus.has(info.sku);
    }

    // Ownership predicates run in bursts while cards rebuild; one UI probe covers each burst.
    const lockerUiProbeState = { value: false, at: 0 };
    function lockerUiProbe() {
        const now = clock();
        if (now - lockerUiProbeState.at > 0.05) {
            lockerUiProbeState.value = isLockerUiActive();
            lockerUiProbeState.at = now;
        }
        return lockerUiProbeState.value;
    }

    function isLockerUiActive() {
        try {
            const uiManager = statics.uiManager();
            if (!unityAlive(uiManager) || OFF.uiManager.lockerTab < 0)
                return false;
            const tab = readPointerAt(uiManager, OFF.uiManager.lockerTab);
            return unityAlive(tab) && !!U.activeAndEnabled(tab);
        }
        catch (_) {
            return false;
        }
    }

    function refreshLockerItems() {
        // Consume the request before entering native UI code: a failing FilterItems must not
        // retry every frame and cause an allocation/rebuild storm.
        locker.refreshPending = false;
        try {
            const manager = statics.iapManager();
            if (!unityAlive(manager))
                return;
            const managerObject = new Il2Cpp.Object(manager);
            // Refresh only repaints existing cards; re-applying the active filter rebuilds the
            // Owned list so newly exposed items show up immediately.
            const filter = readPointerAt(manager, OFF.iapManager.filter);
            if (unityAlive(filter))
                managerObject.method("FilterItems", 1).overload("VRItemFilter").invoke(new Il2Cpp.Object(filter));
            else
                managerObject.method("Refresh", 0).invoke();
        }
        catch (error) {
            log(`locker refresh failed (will not retry): ${error}`);
        }
    }

    function syncExposedSkusFromFilteredList() {
        try {
            const manager = statics.iapManager();
            if (!unityAlive(manager))
                return;
            const skus = new Set();
            for (const item of listItems(readPointerAt(manager, OFF.iapManager.filteredList))) {
                const info = inspectLockerItem(item);
                if (wantsLockerItem(info))
                    skus.add(info.sku);
            }
            locker.exposedSkus.clear();
            for (const sku of skus)
                locker.exposedSkus.add(sku);
        }
        catch (_) { }
    }

    // GetItemBySKU hands back a brand-new blank item for a SKU the game doesn't have, so the SKU is
    // checked against the catalog first.
    function catalogHas(manager, sku) {
        return !!G.itemExists(manager, managed(String(Math.trunc(sku))));
    }

    function catalogItem(sku) {
        try {
            const manager = statics.iapManager();
            if (!unityAlive(manager) || !catalogHas(manager, sku))
                return NULL;
            const item = G.itemBySku(manager, Math.trunc(sku));
            return unityAlive(item) ? item : NULL;
        }
        catch (_) {
            return NULL;
        }
    }

    // ────────────────────────────────── Saved outfit ──────────────────────────────────

    function persistLockerItem(info, reason) {
        const itemType = Math.trunc(info.itemType);
        const sku = Math.trunc(info.sku);
        locker.unlockedSkus.add(sku);
        const previous = locker.saved.get(itemType);
        if (previous && previous.sku === sku)
            return;
        locker.saved.set(itemType, { itemType, sku });
        locker.attempts.delete(itemType);
        locker.gaveUp.delete(itemType);
        markConfigDirty();
        log(`outfit saved: slot ${itemType} -> item ${sku} (${reason})`);
    }

    function forgetLockerItem(itemType, reason) {
        if (!locker.saved.delete(itemType))
            return;
        markConfigDirty();
        log(`outfit slot ${itemType} cleared (${reason})`);
    }

    function onUnlockAllChanged(enabled) {
        locker.exposedSkus.clear();
        if (enabled) {
            for (const entry of locker.saved.values())
                locker.unlockedSkus.add(entry.sku);
            // Switching it on puts the saved outfit back on right away; only a new lobby waits.
            locker.modelKey = keyOf(refs.localModel);
            locker.settleUntil = 0;
            locker.nextReapply = 0;
            locker.attempts.clear();
            locker.gaveUp.clear();
        }
        // The native list rebuild runs on the next tick, outside this button press.
        locker.refreshPending = true;
        locker.nextUiCheck = 0;
    }

    // PlayerSync.Equip is the public, replicated path; the item's own virtual Equip handles the
    // few items whose requirements make the wrapper refuse them.
    function equipCatalogItem(playerSync, item) {
        let equipped = false;
        try {
            equipped = !!G.playerSyncEquip(playerSync, item);
        }
        catch (_) { }
        if (!equipped) {
            try {
                new Il2Cpp.Object(item).method("Equip", 1).overload("PlayerSync").invoke(new Il2Cpp.Object(playerSync));
                equipped = true;
            }
            catch (_) { }
        }
        return equipped;
    }

    function applyOutfitSlot(playerSync, entry) {
        const item = catalogItem(entry.sku);
        const info = inspectLockerItem(item);
        if (!info || info.itemType !== entry.itemType)
            return false;
        locker.applyDepth++;
        try {
            markLockerItem(info);
            if (!equipCatalogItem(playerSync, item))
                return false;
            // Also store it as the game's own saved customization, so the game's spawn loader puts
            // it back on you in the next lobby before this script has to.
            try {
                if (Number(G.getLocalCustomization(info.itemType)) !== info.sku)
                    G.saveLocalCustomization(info.itemType, info.sku);
            }
            catch (_) { }
            return true;
        }
        finally {
            locker.applyDepth--;
        }
    }

    // Keeps the saved outfit on you. After a spawn (new lobby or map) it waits for the game's own
    // loader, then re-equips only the slots that don't match. Each slot gets OUTFIT_MAX_ATTEMPTS
    // tries per lobby, so an item the game keeps refusing can't cause an equip loop.
    function updateOutfit(now) {
        if (!toggles.unlockAll || locker.saved.size === 0 || now < locker.nextReapply)
            return;
        locker.nextReapply = now + OUTFIT_REAPPLY_SECONDS;
        const playerSync = localPlayerSync();
        const modelKey = keyOf(refs.localModel);
        if (playerSync.isNull() || modelKey === "0x0")
            return;
        if (modelKey !== locker.modelKey) {
            locker.modelKey = modelKey;
            locker.attempts.clear();
            locker.gaveUp.clear();
            locker.settleUntil = now + OUTFIT_SETTLE_SECONDS;
            return;
        }
        if (now < locker.settleUntil)
            return;
        let equipped = 0;
        for (const entry of locker.saved.values()) {
            if (equipped >= OUTFIT_REAPPLY_BURST)
                break;
            // Titles have their own keeper.
            if (locker.gaveUp.has(entry.itemType) || entry.itemType === TITLE_ITEM_TYPE)
                continue;
            let current = Number.NaN;
            try {
                current = Number(G.playerSyncEquippedSku(playerSync, entry.itemType));
            }
            catch (_) { }
            if (current === entry.sku)
                continue;
            const attempts = (locker.attempts.get(entry.itemType) ?? 0) + 1;
            locker.attempts.set(entry.itemType, attempts);
            if (attempts > OUTFIT_MAX_ATTEMPTS) {
                locker.gaveUp.add(entry.itemType);
                log(`outfit slot ${entry.itemType}: the game won't keep item ${entry.sku} on; leaving it for this lobby`);
                continue;
            }
            if (applyOutfitSlot(playerSync, entry))
                equipped++;
        }
        if (equipped > 0)
            log(`re-equipped ${equipped} saved outfit item(s)`);
    }

    // A map change keeps Unlock All on and the outfit owned; only per-lobby bookkeeping resets.
    function onLockerSceneChange() {
        for (const collection of [locker.exposedSkus, locker.automaticDepthByThread, locker.outfitDepthByThread,
            locker.strictDepthByThread, locker.equipDepthByThread, locker.equipSkuByThread, locker.cardDepthByThread,
            locker.cardSkuByThread, locker.filterTypeStackByThread, locker.filterSkuStackByThread, locker.attempts, locker.gaveUp])
            collection.clear();
        locker.applyDepth = 0;
        locker.modelKey = "";
        locker.settleUntil = 0;
        locker.nextReapply = 0;
        locker.uiActive = false;
        locker.refreshPending = false;
    }

    function updateLockerUi(now) {
        if (now < locker.nextUiCheck)
            return;
        locker.nextUiCheck = now + LOCKER_UI_CHECK_SECONDS;
        const active = isLockerUiActive();
        if (locker.uiActive && !active)
            locker.exposedSkus.clear();
        locker.uiActive = active;
        if (locker.refreshPending && active)
            refreshLockerItems();
    }

    function installLockerHooks() {
        const attach = (klass, name, argc, types, callbacks) => {
            const method = findMethod(klass, name, argc, types);
            if (!method)
                throw new Error(`${klass ? klass.name : "?"}.${name} not found`);
            Interceptor.attach(method.virtualAddress, callbacks);
        };
        const flipToOwned = (returnValue) => returnValue.replace(ptr(1));
        const nativeTrue = (value) => {
            try {
                return (value.toInt32() & 0xff) !== 0;
            }
            catch (_) {
                return false;
            }
        };
        const markIfClicked = (info, threadId) => {
            if ((locker.equipDepthByThread.get(threadId) ?? 0) > 0 && locker.equipSkuByThread.get(threadId) === info.sku)
                markLockerItem(info);
        };
        // Counts a game call as in progress on its thread for as long as it runs.
        const depthScope = (map) => ({
            onEnter() {
                this.lockerThread = this.threadId;
                incrementDepth(map, this.threadId);
            },
            onLeave() {
                if (this.lockerThread !== undefined)
                    decrementDepth(map, this.lockerThread);
            },
        });
        // The game saves your outfit slots on its own in two places: its spawn loader re-saves each
        // slot it loads, and its ownership check clears slots holding items you don't own. Neither is
        // you changing your outfit. If these can't be hooked, those saves would count as yours, so
        // that's logged; everything else still installs.
        try {
            attach(Game.NCNetworkPlayerDataController, "LoadSavedCustomization", 0, null, depthScope(locker.automaticDepthByThread));
            attach(Game.NCNetworkPlayerData, "UpdateAvatarCustomizations", 1, null, depthScope(locker.automaticDepthByThread));
        }
        catch (error) {
            log(`outfit keeper can't tell the game's own outfit saves from yours: ${error}`);
        }
        try {
            attach(Game.DLIAPManager, "FilterItems", 1, ["NCNetworkPlayer.BallerItem"], {
                onEnter(args) {
                    const threadId = this.threadId;
                    if (!locker.filterTypeStackByThread.has(threadId))
                        locker.exposedSkus.clear();
                    pushStack(locker.filterTypeStackByThread, threadId, args[1].toInt32());
                    this.lockerThread = threadId;
                },
                onLeave() {
                    if (this.lockerThread === undefined)
                        return;
                    if (popStack(locker.filterTypeStackByThread, this.lockerThread) === 0) {
                        syncExposedSkusFromFilteredList();
                        locker.refreshPending = false;
                    }
                },
            });
            attach(Game.DLIAPManager, "FilterItem", 1, null, {
                onEnter(args) {
                    const info = inspectLockerItem(args[1]);
                    pushStack(locker.filterSkuStackByThread, this.threadId, info ? info.sku : -1);
                    this.lockerThread = this.threadId;
                },
                onLeave() {
                    if (this.lockerThread !== undefined)
                        popStack(locker.filterSkuStackByThread, this.lockerThread);
                },
            });
            // With Unlock All on, the locker item being pressed is admitted as owned so its equip
            // goes through.
            const equipScope = (klass, name, argc, itemOf) => attach(klass, name, argc, null, {
                onEnter(args) {
                    const threadId = this.threadId;
                    this.lockerThread = threadId;
                    if ((locker.equipDepthByThread.get(threadId) ?? 0) <= 0) {
                        const info = inspectLockerItem(itemOf(args));
                        if (wantsLockerItem(info) && (locker.exposedSkus.has(info.sku) || locker.unlockedSkus.has(info.sku))) {
                            locker.equipSkuByThread.set(threadId, info.sku);
                            markLockerItem(info);
                        }
                    }
                    incrementDepth(locker.equipDepthByThread, threadId);
                },
                onLeave() {
                    const threadId = this.lockerThread;
                    if (threadId !== undefined && decrementDepth(locker.equipDepthByThread, threadId) === 0)
                        locker.equipSkuByThread.delete(threadId);
                },
            });
            const buttonItem = (args) => OFF.iapButton.item >= 0 ? readPointerAt(args[0], OFF.iapButton.item) : NULL;
            // UpdateDisplay runs its ownership checks after FilterItem returns; scope them to the one
            // card being drawn so it shows Equip/Owned without exposing unrelated catalog entries.
            attach(Game.DLIAPButton, "UpdateDisplay", 0, null, {
                onEnter(args) {
                    const info = inspectLockerItem(buttonItem(args));
                    if (!wantsLockerItem(info) || (!locker.exposedSkus.has(info.sku) && !locker.unlockedSkus.has(info.sku)))
                        return;
                    const threadId = this.threadId;
                    if ((locker.cardDepthByThread.get(threadId) ?? 0) <= 0)
                        locker.cardSkuByThread.set(threadId, info.sku);
                    incrementDepth(locker.cardDepthByThread, threadId);
                    this.lockerThread = threadId;
                },
                onLeave() {
                    const threadId = this.lockerThread;
                    if (threadId !== undefined && decrementDepth(locker.cardDepthByThread, threadId) === 0)
                        locker.cardSkuByThread.delete(threadId);
                },
            });
            equipScope(Game.DLIAPButton, "ButtonPressed", 0, buttonItem);
            equipScope(Game.DLIAPManager, "ItemButtonPressed", 1, (args) => args[1]);
            if (Game.UIManager)
                attach(Game.UIManager, "MenuOutfitLoad", 1, null, depthScope(locker.outfitDepthByThread));
            // Apart from the game's automatic saves (hooked above) and this script's re-apply, a slot
            // save is you changing your outfit: locker items and collections, Unequip All, Random
            // Outfit, loading an outfit slot, or a purchase the game puts straight on.
            attach(Game.IAPItemSO, "SaveLocalCustomization", 2, null, {
                onEnter(args) {
                    if (locker.applyDepth > 0 || (locker.automaticDepthByThread.get(this.threadId) ?? 0) > 0)
                        return;
                    const itemType = args[0].toInt32();
                    const sku = args[1].toInt32();
                    lockerLog(`you saved slot ${itemType} -> ${sku}`);
                    // Your title is kept by the title keeper (and saved) whether or not Unlock All is on.
                    if (itemType === TITLE_ITEM_TYPE) {
                        if (sku > 0)
                            setDesiredTitle(sku, titleLabel(sku));
                        else
                            clearDesiredTitle();
                        return;
                    }
                    const info = sku > 0 ? inspectLockerItem(catalogItem(sku)) : null;
                    if (toggles.unlockAll && info && info.itemType === itemType)
                        persistLockerItem(info, "equipped");
                    else
                        forgetLockerItem(itemType, sku > 0 ? "replaced" : "unequipped");
                },
            });
            attach(Game.IAPItemSO, "IsOwnedOrAchieved", 0, null, {
                onEnter(args) {
                    this.lockerItem = args[0];
                    this.lockerThread = this.threadId;
                    incrementDepth(locker.strictDepthByThread, this.threadId);
                },
                onLeave(returnValue) {
                    try {
                        if (nativeTrue(returnValue))
                            return;
                        const info = inspectLockerItem(this.lockerItem);
                        if (!info || !allowsLockerOwnership(info, this.lockerThread))
                            return;
                        markIfClicked(info, this.lockerThread);
                        flipToOwned(returnValue);
                    }
                    finally {
                        decrementDepth(locker.strictDepthByThread, this.lockerThread);
                    }
                },
            });
            for (const predicate of ["IsOwnedOrAchievedOrAchieveable", "IsRequiredItemOwned"]) {
                attach(Game.IAPItemSO, predicate, 0, null, {
                    onEnter(args) {
                        this.lockerItem = args[0];
                    },
                    onLeave(returnValue) {
                        if (nativeTrue(returnValue))
                            return;
                        const info = inspectLockerItem(this.lockerItem);
                        if (!info || !allowsLockerOwnership(info, this.threadId))
                            return;
                        markIfClicked(info, this.threadId);
                        flipToOwned(returnValue);
                    },
                });
            }
            attach(Game.IAPItemSO, "isModItemAchieved", 1, null, {
                onEnter(args) {
                    this.lockerItem = args[1];
                },
                onLeave(returnValue) {
                    if (nativeTrue(returnValue))
                        return;
                    // IsOwnedOrAchieved calls this for staff/mod items; the strict outer probe sees the
                    // real result so it can mark the SKU before replacing the final answer.
                    if ((locker.strictDepthByThread.get(this.threadId) ?? 0) > 0)
                        return;
                    const info = inspectLockerItem(this.lockerItem);
                    if (!info || !info.dev || !allowsLockerOwnership(info, this.threadId))
                        return;
                    markIfClicked(info, this.threadId);
                    flipToOwned(returnValue);
                },
            });
            log("unlock-all hooks installed");
        }
        catch (error) {
            log(`unlock-all hooks unavailable: ${error}`);
        }
    }

    // ─────────────────────────────────────── Titles ───────────────────────────────────────

    // The title you pick here or in the game's locker is kept on you and saved in the config, so it
    // comes back after respawns, lobby changes and restarts.
    const titles = {
        catalog: [],
        desiredSku: null,
        desiredLabel: "",
        modelKey: "",
        attempts: 0,
        nextRefresh: 0,
    };

    function itemDisplayName(item) {
        try {
            const label = String(new Il2Cpp.Object(item).method("GetBaseDisplayName", 0).invoke().content ?? "").trim();
            if (label)
                return label;
        }
        catch (_) { }
        try {
            return readString(U.objectName(item)).trim();
        }
        catch (_) {
            return "";
        }
    }

    function titleLabel(sku) {
        const known = titles.catalog.find((title) => title.sku === sku);
        if (known)
            return known.label;
        const item = catalogItem(sku);
        return (item.isNull() ? "" : itemDisplayName(item)) || `Title ${sku}`;
    }

    function setDesiredTitle(sku, label) {
        if (titles.desiredSku === sku && titles.desiredLabel === label)
            return;
        titles.desiredSku = sku;
        titles.desiredLabel = label;
        titles.attempts = 0;
        markConfigDirty();
    }

    function clearDesiredTitle() {
        if (titles.desiredSku === null)
            return;
        titles.desiredSku = null;
        titles.desiredLabel = "";
        markConfigDirty();
    }

    // Every title in the game's own item catalog: exactly the titles that can be equipped and that
    // other players' games can show.
    function refreshTitleCatalog() {
        const bySku = new Map();
        try {
            const manager = statics.iapManager();
            if (unityAlive(manager) && OFF.item.sku >= 0 && OFF.item.type >= 0) {
                for (const item of listItems(G.allItems(manager))) {
                    if (!unityAlive(item) || readIntAt(item, OFF.item.type) !== TITLE_ITEM_TYPE)
                        continue;
                    const sku = readIntAt(item, OFF.item.sku);
                    if (sku >= 0 && !bySku.has(sku))
                        bySku.set(sku, { sku, label: itemDisplayName(item) || `Title ${sku}` });
                }
            }
        }
        catch (error) {
            log(`title catalog read failed: ${error}`);
        }
        const sorted = Array.from(bySku.values()).sort((a, b) => a.label.localeCompare(b.label) || a.sku - b.sku);
        const counts = new Map();
        for (const title of sorted)
            counts.set(title.label.toLowerCase(), (counts.get(title.label.toLowerCase()) ?? 0) + 1);
        titles.catalog = sorted.map((title) => ({
            sku: title.sku,
            label: counts.get(title.label.toLowerCase()) > 1 ? `${title.label} [${title.sku}]` : title.label,
        }));
        return titles.catalog.length;
    }

    // Takes your current title off, puts the chosen one on and remembers it. Returns "ok",
    // "failed", or "missing" when the game no longer has that title.
    function equipTitle(sku, label) {
        try {
            const manager = statics.iapManager();
            if (!unityAlive(manager))
                throw new Error("the item catalog isn't loaded yet");
            if (!catalogHas(manager, sku))
                return "missing";
            const item = catalogItem(sku);
            if (item.isNull())
                throw new Error(`title SKU ${sku} is unavailable`);
            if (OFF.item.type < 0 || readIntAt(item, OFF.item.type) !== TITLE_ITEM_TYPE)
                throw new Error(`SKU ${sku} is not a title`);
            const info = inspectLockerItem(item);
            if (info)
                markLockerItem(info);
            const playerSync = localPlayerSync();
            const model = localPlayerModel();
            if (playerSync.isNull() || model.isNull())
                throw new Error("local replicated player is unavailable");
            const current = Number(G.modelTitle(model));
            if (current !== sku) {
                locker.applyDepth++;
                try {
                    const previous = current > 0 ? catalogItem(current) : NULL;
                    if (!previous.isNull())
                        G.playerSyncUnequip(playerSync, previous);
                    // A few catalog titles carry an item requirement that makes the public PlayerSync
                    // wrapper reject them; the item's own Equip performs the same replicated update.
                    equipCatalogItem(playerSync, item);
                    const actual = Number(G.modelTitle(model));
                    if (actual !== sku)
                        throw new Error(`title equip did not stick; current SKU is ${actual}`);
                    // Also the game's own saved title, so its spawn loader puts it back on.
                    G.saveLocalCustomization(TITLE_ITEM_TYPE, sku);
                }
                finally {
                    locker.applyDepth--;
                }
            }
            setDesiredTitle(sku, label);
            titles.modelKey = keyOf(model);
            log(`equipped title ${label} (${sku})`);
            return "ok";
        }
        catch (error) {
            log(`title equip failed for ${label} (${sku}): ${error}`);
            return "failed";
        }
    }

    function pickTitle(sku, label) {
        if (equipTitle(sku, label) === "missing")
            log(`title ${label} (${sku}) isn't in the game anymore`);
    }

    // Puts the saved title back on after respawns and lobby changes. A few tries per lobby, so a
    // title the game won't take can't cause an equip loop.
    function updateTitleKeeper(now) {
        if (titles.desiredSku === null || now < titles.nextRefresh)
            return;
        titles.nextRefresh = now + TITLE_REFRESH_SECONDS;
        const model = refs.localModel;
        if (!isLive(model))
            return;
        const modelKey = keyOf(model);
        if (modelKey !== titles.modelKey) {
            titles.modelKey = modelKey;
            titles.attempts = 0;
        }
        let active = Number.NaN;
        try {
            active = Number(G.modelTitle(model));
        }
        catch (_) { }
        if (active === titles.desiredSku || titles.attempts >= TITLE_MAX_ATTEMPTS)
            return;
        titles.attempts++;
        const label = titles.desiredLabel || titleLabel(titles.desiredSku);
        const result = equipTitle(titles.desiredSku, label);
        if (result === "missing") {
            log(`saved title ${label} (${titles.desiredSku}) isn't in the game anymore; cleared it`);
            clearDesiredTitle();
        }
        else if (result === "failed" && titles.attempts >= TITLE_MAX_ATTEMPTS) {
            log(`title ${label} won't stay on; trying again next lobby`);
        }
    }

    // ─────────────────────────────────────── Levels ───────────────────────────────────────

    // The level you set is saved in the config and re-applied every session.
    const levels = { desiredXp: null, desiredLevel: null, nextRefresh: 0, nextAction: 0 };

    function roomSessionModel() {
        try {
            if (!unityAlive(refs.controller))
                return null;
            const sync = readPointerAt(refs.controller, OFF.controller.gameSync);
            if (!unityAlive(sync))
                return null;
            const model = new Il2Cpp.Object(sync).method("GetLocalPlayerModel", 0).invoke();
            return isLive(model) ? model : null;
        }
        catch (_) {
            return null;
        }
    }

    function setCachedSessionXp(progression, targetXp) {
        try {
            let cached = progression.method("GetCurrentContractsCached", 0).invoke();
            if (!isLive(cached))
                cached = progression.field("currentProgress").value;
            if (!isLive(cached))
                return false;
            let updated = cached;
            try {
                const clone = cached.method("<Clone>$", 0).invoke();
                if (isLive(clone))
                    updated = clone;
            }
            catch (_) { }
            updated.field("XP").value = Math.trunc(targetXp);
            progression.method("SetCurrentProgress", 1).invoke(updated);
            return Number(progression.method("GetXP", 0).invoke()) === Math.trunc(targetXp);
        }
        catch (_) {
            return false;
        }
    }

    function progressionManager() {
        const pointer = statics.progression();
        return unityAlive(pointer) ? new Il2Cpp.Object(pointer) : null;
    }

    function refreshSessionLevel(now) {
        if (levels.desiredXp === null || now < levels.nextRefresh)
            return;
        levels.nextRefresh = now + SESSION_LEVEL_REFRESH_SECONDS;
        const desired = levels.desiredXp;
        try {
            const progression = progressionManager();
            if (progression) {
                const current = Number(progression.method("GetXP", 0).invoke());
                // Never erase XP legitimately earned after the button was used.
                if (Number.isFinite(current) && Math.trunc(current) > desired)
                    levels.desiredXp = Math.trunc(current);
                else if (!Number.isFinite(current) || Math.trunc(current) < desired)
                    setCachedSessionXp(progression, desired);
            }
        }
        catch (_) { }
        try {
            const model = roomSessionModel();
            if (model) {
                const current = Number(model.method("get_reputation", 0).invoke());
                if (Number.isFinite(current) && Math.trunc(current) > levels.desiredXp)
                    levels.desiredXp = Math.trunc(current);
                else if (!Number.isFinite(current) || Math.trunc(current) < levels.desiredXp)
                    model.method("set_reputation", 1).invoke(levels.desiredXp);
            }
        }
        catch (_) { }
    }

    function increaseLevelBy(amount) {
        const delta = Math.max(0, Math.trunc(Number(amount)));
        if (delta <= 0)
            return;
        const now = clock();
        if (now < levels.nextAction) {
            log("level button cooling down");
            return;
        }
        try {
            const progression = progressionManager();
            if (!progression) {
                log("level increase unavailable: progression manager is not ready");
                return;
            }
            levels.nextAction = now + LEVEL_ACTION_COOLDOWN_SECONDS;
            const maxInt32 = 2147483647;
            const candidates = [];
            if (levels.desiredXp !== null)
                candidates.push(levels.desiredXp);
            try {
                candidates.push(Number(progression.method("GetXP", 0).invoke()));
            }
            catch (_) { }
            const room = roomSessionModel();
            if (room) {
                try {
                    candidates.push(Number(room.method("get_reputation", 0).invoke()));
                }
                catch (_) { }
            }
            const finite = candidates.filter(Number.isFinite).map(Math.trunc);
            if (finite.length === 0)
                throw new Error("current XP is not ready");
            const currentXp = Math.min(maxInt32, Math.max(0, ...finite));
            const getLevel = progression.method("GetLevel", 1);
            const levelAt = (xp) => {
                const value = Number(getLevel.invoke(Math.trunc(xp)));
                if (!Number.isFinite(value))
                    throw new Error(`GetLevel(${xp}) returned ${value}`);
                return Math.max(0, Math.trunc(value));
            };
            const currentLevel = levelAt(currentXp);
            const maximumLevel = levelAt(maxInt32);
            const requestedLevel = Math.min(maxInt32, currentLevel + delta);
            const targetLevel = Math.min(requestedLevel, maximumLevel);
            if (targetLevel <= currentLevel || currentXp >= maxInt32) {
                log(`level is already at the supported maximum (${currentLevel})`);
                return;
            }
            if (targetLevel < requestedLevel)
                log(`requested level ${requestedLevel} exceeds the session model; capping at ${targetLevel}`);
            let lower = currentXp;
            let upper = Math.min(maxInt32, currentXp + 1);
            try {
                const hint = Number(progression.method("GetXpRequirement", 1).invoke(targetLevel));
                if (Number.isFinite(hint))
                    upper = Math.min(maxInt32, Math.max(upper, Math.trunc(hint)));
            }
            catch (_) { }
            let upperLevel = levelAt(upper);
            let step = Math.max(1, upper - lower);
            while (upperLevel < targetLevel && upper < maxInt32) {
                lower = upper;
                step = Math.min(maxInt32 - upper, step * 2);
                upper += Math.max(1, step);
                upperLevel = levelAt(upper);
            }
            if (upperLevel < targetLevel)
                throw new Error(`level ${targetLevel} is unreachable`);
            let left = lower + 1;
            let right = upper;
            while (left < right) {
                const middle = left + Math.floor((right - left) / 2);
                if (levelAt(middle) >= targetLevel)
                    right = middle;
                else
                    left = middle + 1;
            }
            const targetXp = left;
            if (!setCachedSessionXp(progression, targetXp))
                throw new Error("local progression cache rejected the XP update");
            levels.desiredXp = targetXp;
            levels.desiredLevel = targetLevel;
            levels.nextRefresh = 0;
            markConfigDirty();
            let roomUpdated = false;
            if (room) {
                try {
                    // The generated setter dirties the model's ReliableProperty directly.
                    room.method("set_reputation", 1).invoke(Math.trunc(targetXp));
                    roomUpdated = Number(room.method("get_reputation", 0).invoke()) === Math.trunc(targetXp);
                }
                catch (_) { }
            }
            log(`session level ${currentLevel} -> ${targetLevel} (XP ${currentXp} -> ${targetXp}; room ${roomUpdated ? "updated" : "pending"})`);
        }
        catch (error) {
            log(`level increase by ${delta} failed: ${error}`);
        }
    }

    // ─────────────────────────────────────── Config file ───────────────────────────────────────

    // Every toggle, setting and the saved outfit live in a JSON file in the game's own storage. It's
    // read at boot, before any hook can fire, and rewritten shortly after anything changes.
    const configFile = {
        directories: [],
        path: "",
        loaded: false,
        dirty: false,
        saveAt: 0,
    };

    function libcFunction(name, returnType, argumentTypes) {
        try {
            const address = Module.findGlobalExportByName(name);
            return address === null ? null : new NativeFunction(address, returnType, argumentTypes);
        }
        catch (_) {
            return null;
        }
    }

    const libc = {
        mkdir: libcFunction("mkdir", "int", ["pointer", "uint"]),
        rename: libcFunction("rename", "int", ["pointer", "pointer"]),
    };

    const ioDirectory = {
        createDirectory: null,
        exists: null,
        getFiles: null,
    };
    try {
        const dirClass = Il2Cpp.corlib.class("System.IO.Directory");
        if (dirClass) {
            const createMethod = findMethod(dirClass, "CreateDirectory", 1);
            if (createMethod)
                ioDirectory.createDirectory = (path) => createMethod.invoke(managed(path));
            const existsMethod = findMethod(dirClass, "Exists", 1);
            if (existsMethod)
                ioDirectory.exists = (path) => !!existsMethod.invoke(managed(path));
            const getFilesMethod = findMethod(dirClass, "GetFiles", 1);
            if (getFilesMethod) {
                ioDirectory.getFiles = (path) => {
                    try {
                        const arr = getFilesMethod.invoke(managed(path));
                        if (!arr || toPointer(arr).isNull())
                            return [];
                        return arrayItems(arr).map((p) => readString(p)).filter(Boolean);
                    }
                    catch (_) {
                        return [];
                    }
                };
            }
        }
    }
    catch (_) { }

    function gamePackageName() {
        try {
            // The process name, up to the NUL (or a ":service" suffix). Read as bytes: the text
            // reader rejects the NULs in cmdline.
            let name = "";
            for (const byte of new Uint8Array(File.readAllBytes("/proc/self/cmdline"))) {
                if (byte === 0 || byte === 0x3a)
                    break;
                name += String.fromCharCode(byte);
            }
            if (/^[\w.]+$/.test(name))
                return name;
        }
        catch (_) { }
        try {
            // /data/app/~~<hash>/<package>-<hash>/lib/arm64/libil2cpp.so
            const match = /\/([A-Za-z]\w*(?:\.\w+)+)-[^/]+\//.exec(Process.getModuleByName("libil2cpp.so").path);
            if (match)
                return match[1];
        }
        catch (_) { }
        return "";
    }

    function makeDirectories(path) {
        if (!path)
            return;
        try {
            if (ioDirectory.createDirectory) {
                ioDirectory.createDirectory(path);
                return;
            }
        }
        catch (_) { }
        if (!libc.mkdir)
            return;
        let current = "";
        for (const part of path.split("/").filter(Boolean)) {
            current += `/${part}`;
            try {
                libc.mkdir(Memory.allocUtf8String(current), 0o771);
            }
            catch (_) { }
        }
    }

    // Written next to the target and renamed over it, so quitting mid-save can't leave half a file.
    function writeTextFile(path, text) {
        const temporary = `${path}.tmp`;
        File.writeAllText(temporary, text);
        if (libc.rename && libc.rename(Memory.allocUtf8String(temporary), Memory.allocUtf8String(path)) === 0)
            return;
        File.writeAllText(path, text);
    }

    // This session's log goes to log.txt next to the config; the previous session's is kept as
    // log.prev.txt, so what happened before a crash survives the restart.
    function openLogFile(directory) {
        try {
            makeDirectories(directory);
            const path = `${directory}/${LOG_FILE}`;
            if (libc.rename)
                libc.rename(Memory.allocUtf8String(path), Memory.allocUtf8String(`${directory}/${PREVIOUS_LOG_FILE}`));
            const file = new File(path, "w");
            file.write(`Overdose log ${new Date().toISOString()}\n`);
            file.flush();
            logSink.file = file;
            return true;
        }
        catch (_) {
            return false;
        }
    }

    const savedToggleKeys = () => Object.keys(toggles).filter((key) => key !== "bigBoy");

    function serializeConfig() {
        return JSON.stringify({
            version: CONFIG_VERSION,
            username: customName.desired,
            toggles: Object.fromEntries(savedToggleKeys().map((key) => [key, toggles[key]])),
            settings: {
                username: customName.desired,
                shootBoostPercent: settings.shootBoostPercent,
                pointsPerShot: settings.pointsPerShot,
                autoAimMode: settings.autoAimMode,
                autoAimLegit: settings.autoAimLegit,
                playerSize: scalePreset().multiplier,
                soundVolume: settings.soundBoost,
                hearSounds: settings.hearSounds,
            },
            outfit: Array.from(locker.saved.values())
                .sort((a, b) => a.itemType - b.itemType)
                .map((entry) => ({ type: entry.itemType, sku: entry.sku })),
            title: titles.desiredSku === null ? null : { sku: titles.desiredSku, label: titles.desiredLabel },
            level: levels.desiredXp === null ? null : { level: levels.desiredLevel, xp: levels.desiredXp },
        }, null, 2);
    }

    // Anything missing or out of range keeps its default, so a hand-edited file can't break the menu.
    function applyConfig(data) {
        if (!data || typeof data !== "object")
            throw new Error("not a JSON object");
        const section = (name) => (data[name] && typeof data[name] === "object") ? data[name] : {};
        const savedToggles = section("toggles");
        for (const key of savedToggleKeys()) {
            if (typeof savedToggles[key] === "boolean")
                toggles[key] = savedToggles[key];
        }
        const saved = section("settings");
        if (typeof data.username === "string" && data.username.trim().length > 0)
            customName.desired = data.username.trim();
        else if (typeof saved.username === "string" && saved.username.trim().length > 0)
            customName.desired = saved.username.trim();
        else
            customName.desired = "working";
        if (Number.isFinite(saved.shootBoostPercent))
            settings.shootBoostPercent = clamp(Math.round(saved.shootBoostPercent / SHOOT_BOOST_STEP) * SHOOT_BOOST_STEP, SHOOT_BOOST_MIN, SHOOT_BOOST_MAX);
        if (POINTS_PER_SHOT_CHOICES.includes(saved.pointsPerShot))
            settings.pointsPerShot = saved.pointsPerShot;
        if (saved.autoAimMode === 0 || saved.autoAimMode === 1)
            settings.autoAimMode = saved.autoAimMode;
        if (saved.autoAimLegit === 0 || saved.autoAimLegit === 1)
            settings.autoAimLegit = saved.autoAimLegit;
        if (SOUND_BOOST_CHOICES.includes(saved.soundVolume))
            settings.soundBoost = saved.soundVolume;
        if (typeof saved.hearSounds === "boolean")
            settings.hearSounds = saved.hearSounds;
        playerScale.mode = Math.max(0, SCALE_PRESETS.findIndex((preset) => preset.multiplier === saved.playerSize));
        toggles.bigBoy = playerScale.mode !== 0;
        locker.saved.clear();
        for (const entry of Array.isArray(data.outfit) ? data.outfit : []) {
            const itemType = Math.trunc(Number(entry && entry.type));
            const sku = Math.trunc(Number(entry && entry.sku));
            if (itemType > 0 && sku > 0)
                locker.saved.set(itemType, { itemType, sku });
        }
        const title = section("title");
        if (Number.isInteger(title.sku) && title.sku >= 0) {
            titles.desiredSku = title.sku;
            titles.desiredLabel = typeof title.label === "string" && title.label ? title.label : titleLabel(title.sku);
        }
        // Earlier builds kept the title in the outfit list.
        const outfitTitle = locker.saved.get(TITLE_ITEM_TYPE);
        if (outfitTitle) {
            locker.saved.delete(TITLE_ITEM_TYPE);
            if (titles.desiredSku === null) {
                titles.desiredSku = outfitTitle.sku;
                titles.desiredLabel = titleLabel(outfitTitle.sku);
            }
            markConfigDirty();
        }
        const level = section("level");
        if (Number.isFinite(level.xp) && level.xp > 0) {
            levels.desiredXp = Math.min(2147483647, Math.trunc(level.xp));
            levels.desiredLevel = Number.isFinite(level.level) ? Math.trunc(level.level) : null;
        }
    }

    function loadConfig() {
        const packageName = gamePackageName();
        if (!packageName) {
            log("config disabled: couldn't work out the game's package name");
            return;
        }
        configFile.directories = [
            `/storage/emulated/0/Android/data/${packageName}/files/${CONFIG_DIRECTORY}`,
            `/data/data/${packageName}/files/${CONFIG_DIRECTORY}`,
        ];

        // Ensure all required menu directories exist immediately at boot to prevent access violations
        for (const dir of configFile.directories) {
            try {
                makeDirectories(dir);
                makeDirectories(`${dir}/${SOUNDS_DIRECTORY}`);
                makeDirectories(`${dir}/${SOUND_CACHE_DIRECTORY}`);
            }
            catch (_) { }
        }

        configFile.directories.some(openLogFile);
        for (const directory of configFile.directories) {
            const path = `${directory}/${CONFIG_FILE}`;
            let text;
            try {
                text = File.readAllText(path);
            }
            catch (_) {
                continue;
            }
            configFile.path = path;
            try {
                applyConfig(JSON.parse(text));
                configFile.loaded = true;
                // Admitted before the hooks go in, so the game's first ownership checks keep the outfit
                // and the title.
                if (toggles.unlockAll) {
                    for (const entry of locker.saved.values())
                        locker.unlockedSkus.add(entry.sku);
                }
                if (titles.desiredSku > 0)
                    locker.unlockedSkus.add(titles.desiredSku);
                log(`config loaded from ${path}`);
            }
            catch (error) {
                log(`config ${path} is unreadable (${error.message}); starting from defaults, old copy kept as ${CONFIG_FILE}.bad`);
                try {
                    File.writeAllText(`${path}.bad`, text);
                }
                catch (_) { }
            }
            return;
        }

        // If no config file was present, set default path and save current defaults immediately
        if (!configFile.path && configFile.directories.length > 0) {
            configFile.path = `${configFile.directories[0]}/${CONFIG_FILE}`;
            try {
                saveConfig();
            }
            catch (_) { }
        }
    }

    function saveConfig() {
        configFile.dirty = false;
        const text = serializeConfig();
        const paths = configFile.directories.map((directory) => `${directory}/${CONFIG_FILE}`);
        if (configFile.path)
            paths.unshift(configFile.path);
        for (const path of new Set(paths)) {
            try {
                try {
                    writeTextFile(path, text);
                }
                catch (_) {
                    makeDirectories(path.slice(0, path.lastIndexOf("/")));
                    writeTextFile(path, text);
                }
                if (path !== configFile.path) {
                    configFile.path = path;
                    log(`config saved to ${path}`);
                }
                return;
            }
            catch (_) { }
        }
        logThrottled("config-save", 30, "config save failed: no writable location");
    }

    function markConfigDirty() {
        configFile.dirty = true;
        configFile.saveAt = clock() + CONFIG_SAVE_DELAY_SECONDS;
    }

    function updateConfigSave(now) {
        if (configFile.dirty && now >= configFile.saveAt && configFile.directories.length > 0)
            saveConfig();
    }

    // First tick, on the main thread: settings from older PlayerPrefs-based versions are carried
    // over once, then whatever the config left on is switched on.
    function restoreConfig() {
        if (!configFile.loaded) {
            migrateLegacyPrefs();
            markConfigDirty();
        }
        const restored = [];
        for (const key of savedToggleKeys()) {
            if (!toggles[key])
                continue;
            try {
                onToggleChanged(key, true);
            }
            catch (error) {
                log(`couldn't restore ${key}: ${describeError(error)}`);
            }
            if (toggles[key])
                restored.push(key);
        }
        if (playerScale.mode !== 0)
            restored.push(`player size ${scalePreset().label}`);
        if (titles.desiredSku !== null)
            restored.push(`title ${titles.desiredLabel}`);
        if (levels.desiredXp !== null)
            restored.push(levels.desiredLevel !== null ? `level ${levels.desiredLevel}` : `XP ${levels.desiredXp}`);
        if (restored.length > 0)
            log(`restored: ${restored.join(", ")}`);
        if (locker.saved.size > 0)
            log(`saved outfit: ${locker.saved.size} item(s)${toggles.unlockAll ? "" : " (applies when Unlock All is on)"}`);
    }

    // ────────────────────────────────────── Soundboard ──────────────────────────────────────

    // Plays .wav files from Overdose/Sounds into voice chat, like the Overdose GTag soundboard.
    // Big Ballers talks over Vivox, whose native SDK can "inject" a WAV file into your voice session
    // as if it came from the mic; the Unity-side call for it is stripped, so the request is built
    // with the SDK wrapper's own exports. Vivox takes mono 16-bit WAVs, so every sound is converted
    // once to 48 kHz mono, and the same audio plays locally so you hear it too.
    const VOICE_SAMPLE_RATE = 48000;
    const SOUND_MAX_SECONDS = 30;
    const SOUND_LABEL_LENGTH = 28;
    // Vivox audio-injection controls. Restart stops whatever is playing and starts the new file;
    // it works when nothing is playing, and stop is harmless when idle.
    const INJECTION_STOP = 0;
    const INJECTION_RESTART = 2;

    const Audio = {
        Source: findClass(images.audio, "UnityEngine.AudioSource"),
        Clip: findClass(images.audio, "UnityEngine.AudioClip"),
    };

    const Vivox = {
        Service: findClass(images.vivox, "Unity.Services.Vivox.VivoxService"),
        ServiceInternal: findClass(images.vivox, "Unity.Services.Vivox.VivoxServiceInternal"),
        LoginSession: findClass(images.vivox, "Unity.Services.Vivox.LoginSession"),
    };

    const A = {
        createClip: bind(Audio.Clip, "Create", 5, ["System.String", "System.Int32", "System.Int32", "System.Int32", "System.Boolean"]),
        setClipData: bind(Audio.Clip, "SetData", 2, ["System.Single[]", "System.Int32"]),
        playOneShot: bind(Audio.Source, "PlayOneShot", 1),
        stop: bind(Audio.Source, "Stop", 0),
        setSpatialBlend: bind(Audio.Source, "set_spatialBlend", 1),
        setVolume: bind(Audio.Source, "set_volume", 1),
        setPlayOnAwake: bind(Audio.Source, "set_playOnAwake", 1),
    };

    const voiceSession = {
        service: staticReader(Vivox.Service, "<Instance>k__BackingField"),
        loginSession: fieldOffset(Vivox.ServiceInternal, "m_LoginSession"),
        groupHandle: fieldOffset(Vivox.LoginSession, "_groupHandle"),
    };

    const soundboard = {
        sounds: [],
        listed: false,
        prepared: new Map(),
        source: NULL,
        sourceScope: [],
        clipScope: [],
        vivox: undefined,
    };

    const libcDirectory = {
        open: libcFunction("opendir", "pointer", ["pointer"]),
        read: libcFunction("readdir", "pointer", ["pointer"]),
        close: libcFunction("closedir", "int", ["pointer"]),
    };

    const overdoseDirectory = () => configFile.path ? configFile.path.slice(0, configFile.path.lastIndexOf("/")) : (configFile.directories[0] ?? "");
    const soundsDirectory = () => `${overdoseDirectory()}/${SOUNDS_DIRECTORY}`;

    // Directory listing with managed fallback to prevent access violations
    function listDirectory(path) {
        const names = [];
        try {
            if (ioDirectory.getFiles) {
                const fullPaths = ioDirectory.getFiles(path);
                if (fullPaths && fullPaths.length > 0) {
                    for (const fp of fullPaths) {
                        const idx = Math.max(fp.lastIndexOf("/"), fp.lastIndexOf("\\"));
                        names.push(idx >= 0 ? fp.slice(idx + 1) : fp);
                    }
                    return names;
                }
            }
        }
        catch (_) { }

        if (!libcDirectory.open || !libcDirectory.read || !libcDirectory.close)
            return names;
        try {
            const directory = libcDirectory.open(Memory.allocUtf8String(path));
            if (directory.isNull())
                return names;
            try {
                for (let entry = libcDirectory.read(directory); !entry.isNull(); entry = libcDirectory.read(directory)) {
                    try {
                        if (entry.add(18).readU8() !== 4)
                            names.push(entry.add(19).readUtf8String());
                    }
                    catch (_) { }
                }
            }
            finally {
                libcDirectory.close(directory);
            }
        }
        catch (_) { }
        return names;
    }

    function refreshSounds() {
        const directory = soundsDirectory();
        makeDirectories(directory);
        makeDirectories(`${overdoseDirectory()}/${SOUND_CACHE_DIRECTORY}`);
        soundboard.sounds = listDirectory(directory)
            .filter((name) => /\.wav$/i.test(name))
            .sort((a, b) => a.localeCompare(b))
            .map((name) => {
                const stem = name.replace(/\.wav$/i, "");
                return {
                    name,
                    path: `${directory}/${name}`,
                    label: stem.length > SOUND_LABEL_LENGTH ? `${stem.slice(0, SOUND_LABEL_LENGTH - 3)}...` : stem,
                };
            });
        soundboard.listed = true;
        return soundboard.sounds.length;
    }

    // Converted sounds are made again on their next press (after a reload or a volume change).
    function forgetPreparedSounds() {
        for (const prepared of soundboard.prepared.values())
            destroyObject(prepared.clip);
        soundboard.prepared.clear();
        releaseScope(soundboard.clipScope);
    }

    function reloadSounds() {
        stopSounds(true);
        forgetPreparedSounds();
        const count = refreshSounds();
        log(count > 0 ? `loaded ${count} sound(s)` : `no sounds found; put .wav files in ${soundsDirectory()}`);
    }

    // ─── WAV decoding ───

    function decodeWav(buffer) {
        const view = new DataView(buffer);
        const tag = (offset) => String.fromCharCode(...new Uint8Array(buffer, offset, 4));
        if (buffer.byteLength < 12 || tag(0) !== "RIFF" || tag(8) !== "WAVE")
            throw new Error("not a WAV file");
        let format = null;
        let dataOffset = -1;
        let dataLength = 0;
        for (let offset = 12; offset + 8 <= buffer.byteLength;) {
            const id = tag(offset);
            const size = view.getUint32(offset + 4, true);
            const body = offset + 8;
            if (id === "fmt ") {
                let encoding = view.getUint16(body, true);
                // WAVE_FORMAT_EXTENSIBLE keeps the real encoding at the start of its sub-format GUID.
                if (encoding === 0xfffe && size >= 26)
                    encoding = view.getUint16(body + 24, true);
                format = { encoding, channels: view.getUint16(body + 2, true), rate: view.getUint32(body + 4, true), bits: view.getUint16(body + 14, true) };
            }
            else if (id === "data") {
                dataOffset = body;
                dataLength = Math.min(size, buffer.byteLength - body);
                break;
            }
            offset = body + size + (size & 1);
        }
        if (!format || dataOffset < 0 || format.channels < 1 || format.rate < 1000)
            throw new Error("broken WAV header");
        const bytes = format.bits / 8;
        const read = {
            "1:8": (at) => (view.getUint8(at) - 128) / 128,
            "1:16": (at) => view.getInt16(at, true) / 32768,
            "1:24": (at) => ((view.getUint8(at) | (view.getUint8(at + 1) << 8) | (view.getInt8(at + 2) << 16))) / 8388608,
            "1:32": (at) => view.getInt32(at, true) / 2147483648,
            "3:32": (at) => view.getFloat32(at, true),
            "3:64": (at) => view.getFloat64(at, true),
        }[`${format.encoding}:${format.bits}`];
        if (!read)
            throw new Error(`unsupported WAV encoding ${format.encoding}/${format.bits}-bit (convert it with push_sounds.py)`);
        const frameBytes = bytes * format.channels;
        const frames = Math.min(Math.floor(dataLength / frameBytes), format.rate * SOUND_MAX_SECONDS);
        const mono = new Float32Array(frames);
        for (let frame = 0; frame < frames; frame++) {
            let sum = 0;
            const at = dataOffset + frame * frameBytes;
            for (let channel = 0; channel < format.channels; channel++)
                sum += read(at + channel * bytes);
            mono[frame] = sum / format.channels;
        }
        return { samples: mono, rate: format.rate, truncated: Math.floor(dataLength / frameBytes) > frames };
    }

    // Linear interpolation to the voice rate.
    function resample(samples, fromRate, toRate) {
        if (fromRate === toRate)
            return samples;
        const length = Math.max(1, Math.round(samples.length * toRate / fromRate));
        const output = new Float32Array(length);
        const step = fromRate / toRate;
        const last = samples.length - 1;
        for (let index = 0; index < length; index++) {
            const position = index * step;
            const base = Math.min(Math.floor(position), last);
            const next = Math.min(base + 1, last);
            output[index] = samples[base] + (samples[next] - samples[base]) * (position - base);
        }
        return output;
    }

    function encodeWav(samples, rate) {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);
        const writeTag = (offset, text) => {
            for (let index = 0; index < 4; index++)
                view.setUint8(offset + index, text.charCodeAt(index));
        };
        writeTag(0, "RIFF");
        view.setUint32(4, 36 + samples.length * 2, true);
        writeTag(8, "WAVE");
        writeTag(12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, rate, true);
        view.setUint32(28, rate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeTag(36, "data");
        view.setUint32(40, samples.length * 2, true);
        for (let index = 0; index < samples.length; index++)
            view.setInt16(44 + index * 2, Math.round(clamp(samples[index], -1, 1) * 32767), true);
        return buffer;
    }

    // Brings the loudest point to full scale, then pushes quieter parts up by `boost` through a
    // tanh soft limiter: louder without hard clipping. At 1x it's just normalized.
    function makeLoud(samples, boost) {
        let peak = 0;
        for (const value of samples)
            peak = Math.max(peak, Math.abs(value));
        if (peak < 1e-4)
            return samples;
        const gain = boost / peak;
        const scale = 0.98 / Math.tanh(boost);
        const output = new Float32Array(samples.length);
        for (let index = 0; index < samples.length; index++)
            output[index] = Math.tanh(samples[index] * gain) * scale;
        return output;
    }

    // ─── Playback ───

    // Converted once per session: a boosted 48 kHz mono WAV for Vivox, and an AudioClip at the
    // file's own level for playing it on your headset (the Sound Volume boost is only for others).
    function prepareSound(sound) {
        const cached = soundboard.prepared.get(sound.path);
        if (cached)
            return cached;
        const decoded = decodeWav(File.readAllBytes(sound.path));
        const samples = resample(decoded.samples, decoded.rate, VOICE_SAMPLE_RATE);
        const cacheDirectory = `${overdoseDirectory()}/${SOUND_CACHE_DIRECTORY}`;
        makeDirectories(cacheDirectory);
        const voicePath = `${cacheDirectory}/${sound.name.replace(/\.wav$/i, "")}.wav`;
        File.writeAllBytes(voicePath, encodeWav(makeLoud(samples, settings.soundBoost), VOICE_SAMPLE_RATE));
        let clip = NULL;
        const scope = [];
        try {
            const data = keep(scope, Il2Cpp.array(Il2Cpp.corlib.class("System.Single"), samples.length).handle);
            data.add(arrayHeaderSize).writeByteArray(samples.buffer);
            clip = keep(soundboard.clipScope, A.createClip(managed(`Overdose ${sound.name}`), samples.length, 1, VOICE_SAMPLE_RATE, 0));
            A.setClipData(clip, data, 0);
        }
        catch (error) {
            clip = NULL;
            log(`${sound.label} will play without local echo: ${error}`);
        }
        finally {
            releaseScope(scope);
        }
        const prepared = { voicePath, clip, seconds: samples.length / VOICE_SAMPLE_RATE };
        soundboard.prepared.set(sound.path, prepared);
        if (decoded.truncated)
            log(`${sound.label} is longer than ${SOUND_MAX_SECONDS} s; only the start plays`);
        return prepared;
    }

    function voiceNatives() {
        if (soundboard.vivox !== undefined)
            return soundboard.vivox;
        soundboard.vivox = null;
        try {
            const module = Process.findModuleByName("libVivoxNative.so");
            if (!module)
                throw new Error("libVivoxNative.so isn't loaded");
            const fn = (name, returnType, argumentTypes) =>
                new NativeFunction(module.getExportByName(`CSharp_UnityfServicesfVivox_${name}`), returnType, argumentTypes);
            const prefix = "vx_req_sessiongroup_control_audio_injection_t";
            soundboard.vivox = {
                newRequest: fn("new_vx_req_sessiongroup_control_audio_injection_t___", "pointer", []),
                setHandle: fn(`${prefix}_sessiongroup_handle_set___`, "void", ["pointer", "pointer"]),
                setFile: fn(`${prefix}_filename_set___`, "void", ["pointer", "pointer"]),
                setControl: fn(`${prefix}_audio_injection_control_type_set___`, "void", ["pointer", "int"]),
                issue: fn("vx_issue_request3___", "int", ["pointer", "pointer"]),
            };
        }
        catch (error) {
            log(`soundboard voice chat unavailable: ${error}`);
        }
        return soundboard.vivox;
    }

    // Your Vivox session group: the voice session every lobby channel you're in belongs to.
    function voiceGroupHandle() {
        const service = voiceSession.service();
        if (service.isNull() || voiceSession.loginSession < 0 || voiceSession.groupHandle < 0)
            return "";
        const login = readPointerAt(service, voiceSession.loginSession);
        return login.isNull() ? "" : readString(readPointerAt(login, voiceSession.groupHandle));
    }

    function injectVoice(control, path) {
        const natives = voiceNatives();
        const handle = voiceGroupHandle();
        if (!natives || !handle)
            return false;
        // The SDK owns the request once it's issued; the setters copy the strings.
        const request = natives.newRequest();
        natives.setHandle(request, Memory.allocUtf8String(handle));
        if (path)
            natives.setFile(request, Memory.allocUtf8String(path));
        natives.setControl(request, control);
        const result = natives.issue(request, Memory.alloc(4));
        if (result !== 0)
            log(`voice chat refused the sound (Vivox error ${result})`);
        return result === 0;
    }

    function localSource() {
        if (unityAlive(soundboard.source))
            return soundboard.source;
        releaseScope(soundboard.sourceScope);
        const { gameObject } = createGameObject(soundboard.sourceScope, "OverdoseSoundboard");
        const source = keep(soundboard.sourceScope, U.addComponent(gameObject, typeOf(Audio.Source)));
        A.setPlayOnAwake(source, 0);
        A.setSpatialBlend(source, 0);
        A.setVolume(source, 1);
        soundboard.source = source;
        return source;
    }

    function playSound(sound) {
        try {
            const prepared = prepareSound(sound);
            const sent = injectVoice(INJECTION_RESTART, prepared.voicePath);
            if (unityAlive(soundboard.source))
                A.stop(soundboard.source);
            if (settings.hearSounds && !prepared.clip.isNull())
                A.playOneShot(localSource(), prepared.clip);
            log(sent ? `playing ${sound.label}` : `playing ${sound.label} only for you: voice chat isn't connected`);
        }
        catch (error) {
            log(`couldn't play ${sound.label}: ${describeError(error)}`);
        }
    }

    function stopSounds(quiet = false) {
        try {
            injectVoice(INJECTION_STOP, null);
            if (unityAlive(soundboard.source))
                A.stop(soundboard.source);
        }
        catch (error) {
            log(`stopping sounds failed: ${error}`);
        }
        if (!quiet)
            log("stopped all sounds");
    }

    function stepSoundBoost(delta) {
        const index = Math.max(0, SOUND_BOOST_CHOICES.indexOf(settings.soundBoost));
        settings.soundBoost = SOUND_BOOST_CHOICES[clamp(index + delta, 0, SOUND_BOOST_CHOICES.length - 1)];
        forgetPreparedSounds();
        log(`sound volume set to ${settings.soundBoost}x`);
    }

    function soundEntries() {
        if (!soundboard.listed)
            refreshSounds();
        const entries = [
            actionEntry("sounds-reload", "Reload Sounds", reloadSounds),
            actionEntry("sounds-stop", "Stop All Sounds", () => stopSounds()),
            incrementEntry("sound-volume", "Sound Volume", () => `${settings.soundBoost}x`, stepSoundBoost),
            incrementEntry("sound-hear", "Hear Myself", () => settings.hearSounds ? "On" : "Off", () => {
                settings.hearSounds = !settings.hearSounds;
                if (!settings.hearSounds && unityAlive(soundboard.source))
                    A.stop(soundboard.source);
                log(`hear sounds myself: ${settings.hearSounds ? "on" : "off"}`);
            }),
        ];
        if (soundboard.sounds.length === 0)
            entries.push(actionEntry("sounds-none", "No Sounds Found", () => log(`put .wav files in ${soundsDirectory()}`)));
        for (const sound of soundboard.sounds)
            entries.push(actionEntry(`sound-${sound.name}`, sound.label, () => playSound(sound)));
        return entries;
    }

    // ─────────────────────────────── Menu (Overdose default style) ───────────────────────────────

    const HOME = "Home";
    const CATEGORY_PARENT = { Levels: "Spawning", Titles: "Spawning" };
    const RAIL_NORMAL = [Math.cos(LAYOUT.rail.tilt * DEG), Math.sin(LAYOUT.rail.tilt * DEG), 0];

    const menu = {
        root: NULL,
        rootTransform: NULL,
        layout: NULL,
        canvas: NULL,
        rowShapes: NULL,
        rowText: NULL,
        hand: NULL,
        parented: false,
        visible: false,
        shownAt: 0,
        retryAt: 0,
        category: HOME,
        page: 0,
        chromeRegions: [],
        regions: [],
        lastHit: null,
        nextPress: 0,
        animations: [],
        pointer: NULL,
        pointerTransform: NULL,
        pointerHand: NULL,
        nextCameraFix: 0,
        // Pinned wrappers: the chrome (root, panel, rail, pages), the rows, and the pointer.
        scope: [],
        rowScope: [],
        pointerScope: [],
    };

    const toggleEntry = (id, label, key) => ({ kind: "toggle", id, label, key });
    const categoryEntry = (id, label, target) => ({ kind: "category", id, label, target });
    const actionEntry = (id, label, run) => ({ kind: "action", id, label, run });
    const incrementEntry = (id, label, value, step) => ({
        kind: "increment", id, label, value,
        step: (delta) => {
            step(delta);
            markConfigDirty();
        },
    });
    const playerSizeEntry = (id) => incrementEntry(id, "Player Size", () => scalePreset().label,
        (delta) => setPlayerScaleMode(playerScale.mode + delta));

    function stepShootBoost(delta) {
        settings.shootBoostPercent = clamp(settings.shootBoostPercent + delta * SHOOT_BOOST_STEP, SHOOT_BOOST_MIN, SHOOT_BOOST_MAX);
        log(`shoot boost set to ${settings.shootBoostPercent}%`);
    }

    function stepAimMode(delta) {
        settings.autoAimMode = (settings.autoAimMode + delta + 2) % 2;
        log(`auto aim target set to ${settings.autoAimMode === 0 ? "Swish" : "Bank Shot"}`);
    }

    function stepAimGuide(delta) {
        settings.autoAimLegit = (settings.autoAimLegit + delta + 2) % 2;
        log(`auto aim guide set to ${settings.autoAimLegit === 0 ? "Snap & Drop" : "Smooth Glide"}`);
    }

    function stepPointsPerShot(delta) {
        if (!scoreAward.hooksReady) {
            log("points-per-shot unavailable: score hooks did not install");
            return;
        }
        const index = Math.max(0, POINTS_PER_SHOT_CHOICES.indexOf(settings.pointsPerShot));
        settings.pointsPerShot = POINTS_PER_SHOT_CHOICES[clamp(index + delta, 0, POINTS_PER_SHOT_CHOICES.length - 1)];
        log(settings.pointsPerShot > 1 ? `points per local shot set to ${settings.pointsPerShot}` : "points per local shot restored to default");
    }

    function categoryEntries(category) {
        switch (category) {
            case "Settings":
                return [
                    actionEntry("custom-name", () => `Name: ${customName.desired}`, () => {
                        log(`current name: ${customName.desired} (change in config.json)`);
                    }),
                    incrementEntry("shoot-boost-amount", "Shoot Boost", () => `${settings.shootBoostPercent}%`, stepShootBoost),
                    incrementEntry("auto-aim-target", "Auto Aim Target", () => settings.autoAimMode === 0 ? "Swish" : "Bank Shot", stepAimMode),
                    incrementEntry("auto-aim-guide", "Auto Aim Guide", () => settings.autoAimLegit === 0 ? "Snap & Drop" : "Smooth Glide", stepAimGuide),
                    playerSizeEntry("player-size"),
                ];
            case "Movement":
                return [
                    toggleEntry("fly", "Fly", "fly"),
                    toggleEntry("speed-boost", "Speed Boost", "speedBoost"),
                    toggleEntry("jump-boost", "Jump Boost", "jumpBoost"),
                    playerSizeEntry("player-size-movement"),
                    toggleEntry("big-boy", "Big Boy", "bigBoy"),
                    toggleEntry("auto-aim", "Auto Aim [LT]", "autoAim"),
                    toggleEntry("shoot-boost", "Shoot Boost", "shootBoost"),
                ];
            case "Visuals":
                return [
                    toggleEntry("ball-esp", "Ball ESP", "ballEsp"),
                    toggleEntry("player-tracers", "Tracers", "playerTracers"),
                    toggleEntry("ball-tracers", "Ball Tracers", "ballTracers"),
                ];
            case "Exploits":
                return [
                    toggleEntry("steal-ball", "Steal Ball [RT]", "stealBall"),
                    toggleEntry("hoop-hitbox", "Increase Hoop Hitbox", "increaseHoopHitbox"),
                    incrementEntry("points-per-shot", "Points Per Shot",
                        () => settings.pointsPerShot === 1 ? "1 (Default)" : String(settings.pointsPerShot), stepPointsPerShot),
                ];
            case "Spawning":
                return [
                    toggleEntry("gold-explosion", "Give Unreleased Gold Explosion", "goldExplosion"),
                    toggleEntry("rainbow-explosions", "Rainbow Shot Explosions", "rainbowShotExplosions"),
                    toggleEntry("all-score-effects", "Enable All Score Effects", "allScoreEffects"),
                    toggleEntry("unlock-all", "Unlock All", "unlockAll"),
                    toggleEntry("ball-orbit", "Ball Orbit", "ballOrbit"),
                    toggleEntry("ball-stack", "Ball Stack [RT]", "ballStack"),
                    toggleEntry("grip-spawn", "Grip Spawn Ball", "gripSpawn"),
                    categoryEntry("open-levels", "Levels", "Levels"),
                    categoryEntry("open-titles", "Titles", "Titles"),
                ];
            case "Levels":
                return LEVEL_INCREASE_CHOICES.map((amount) => actionEntry(`level-${amount}`, `Increase Level By ${amount}`, () => increaseLevelBy(amount)));
            case "Sounds":
                return soundEntries();
            case "Titles":
                if (titles.catalog.length === 0)
                    refreshTitleCatalog();
                return titles.catalog.map((title) => actionEntry(`title-${title.sku}`, title.label, () => pickTitle(title.sku, title.label)));
            default:
                return [
                    categoryEntry("open-settings", "Settings", "Settings"),
                    categoryEntry("open-movement", "Movement", "Movement"),
                    categoryEntry("open-visuals", "Visuals", "Visuals"),
                    categoryEntry("open-exploits", "Exploits", "Exploits"),
                    categoryEntry("open-spawning", "Spawning", "Spawning"),
                    categoryEntry("open-sounds", "Sounds", "Sounds"),
                ];
        }
    }

    function isEntryOn(entry) {
        return entry.kind === "toggle" && Boolean(toggles[entry.key]);
    }

    const entryLabel = (entry) => entry.kind === "increment" ? `${entry.label} : ${entry.value()}` : entry.label;

    function openCategory(category) {
        menu.category = category;
        menu.page = 0;
        if (category === "Titles")
            log(`loaded ${refreshTitleCatalog()} title buttons`);
        else if (category === "Sounds")
            refreshSounds();
    }

    function goBack() {
        openCategory(menu.category === HOME ? HOME : CATEGORY_PARENT[menu.category] ?? HOME);
    }

    function pageCount() {
        return Math.max(1, Math.ceil(categoryEntries(menu.category).length / BUTTONS_PER_PAGE));
    }

    function turnPage(delta) {
        const pages = pageCount();
        menu.page = (menu.page + delta + pages) % pages;
    }

    function activateEntry(entry) {
        switch (entry.kind) {
            case "category":
                openCategory(entry.target);
                break;
            case "toggle":
                toggles[entry.key] = !toggles[entry.key];
                onToggleChanged(entry.key);
                markConfigDirty();
                break;
            case "action":
                entry.run();
                break;
            case "increment":
                entry.step(1);
                break;
        }
    }

    // ─────────────────────────────────── Menu drawing ───────────────────────────────────

    // A rounded body plus a slightly larger, darker outline behind it, parented so both scale
    // together during the click animation.
    function drawPanel(scope, name, parentTransform, center, rotation, size, color) {
        const body = createMeshObject(scope, name, parentTransform, center, rotation, size,
            roundedBoxMesh(size[1], size[2], THEME.cornerRadius), flatMaterial(color));
        const border = THEME.outlineWidth;
        const outline = [size[0] - 0.001, size[1] + border * 2, size[2] + border * 2];
        createMeshObject(scope, `${name}-outline`, body.transform, [0, 0, 0], IDENTITY,
            [outline[0] / size[0], outline[1] / size[1], outline[2] / size[2]],
            roundedBoxMesh(outline[1], outline[2], THEME.cornerRadius + border),
            flatMaterial(shade(color, THEME.outlineShade)));
        return body;
    }

    function clickRegion(id, center, size, run, options = {}) {
        const tilt = (options.tilt ?? 0) * DEG;
        return {
            id,
            center,
            half: [size[0] / 2, size[1] / 2, size[2] / 2],
            run,
            tilted: tilt !== 0,
            cos: Math.cos(tilt),
            sin: Math.sin(tilt),
            body: options.body ?? NULL,
            bodyScale: size,
            text: options.text ?? NULL,
        };
    }

    function drawChrome() {
        const regions = [];
        const scope = menu.scope;
        drawPanel(scope, "panel", menu.layout, LAYOUT.panel.center, IDENTITY, LAYOUT.panel.size, THEME.panel);
        createText(scope, menu.canvas, MENU_TITLE, LAYOUT.title.center, LAYOUT.title.size);

        // Overdose's Disconnect bar; here it shows where you are and steps back.
        const topBar = drawPanel(scope, "top-bar", menu.layout, LAYOUT.topBar.center, IDENTITY, LAYOUT.topBar.size, THEME.button);
        regions.push(clickRegion("nav-top", LAYOUT.topBar.center, LAYOUT.topBar.size, goBack, { body: topBar.transform }));

        drawPanel(scope, "rail", menu.layout, LAYOUT.rail.center, RAIL_ROTATION, LAYOUT.rail.size, THEME.panel);
        const railActions = [
            ["home", LAYOUT.railSlots.home, () => openCategory(HOME)],
            ["back", LAYOUT.railSlots.back, goBack],
            ["settings", LAYOUT.railSlots.settings, () => openCategory("Settings")],
        ];
        const iconDepth = LAYOUT.railButton.size[0] / 2 + 0.001;
        for (const [name, z, action] of railActions) {
            const center = [LAYOUT.railButton.x, LAYOUT.railButton.y, z];
            const button = drawPanel(scope, `rail-${name}`, menu.layout, center, RAIL_ROTATION, LAYOUT.railButton.size, THEME.button);
            const iconCenter = [center[0] + RAIL_NORMAL[0] * iconDepth, center[1] + RAIL_NORMAL[1] * iconDepth, z];
            createMeshObject(scope, `rail-${name}-icon`, menu.layout, iconCenter, RAIL_ROTATION,
                [0.0015, LAYOUT.railButton.icon, LAYOUT.railButton.icon], iconMesh(name), flatMaterial(THEME.text));
            regions.push(clickRegion(`nav-${name}`, center, LAYOUT.railButton.size, action, { tilt: LAYOUT.rail.tilt, body: button.transform }));
        }

        for (const [id, side, label, delta] of [["page-previous", 1, "<<<<", -1], ["page-next", -1, ">>>>", 1]]) {
            const center = [LAYOUT.row.x, side * LAYOUT.page.y, LAYOUT.page.z];
            const button = drawPanel(scope, id, menu.layout, center, IDENTITY, LAYOUT.page.size, THEME.button);
            const text = createText(scope, menu.canvas, label, [LAYOUT.row.textX, side * LAYOUT.page.y, LAYOUT.page.z], LAYOUT.page.textSize);
            regions.push(clickRegion(id, center, LAYOUT.page.size, () => turnPage(delta), { body: button.transform, text: text.transform }));
        }
        menu.chromeRegions = regions;
    }

    function drawRow(entry, z, shapes, texts, regions) {
        const row = LAYOUT.row;
        const increment = entry.kind === "increment";
        const size = [row.size[0], increment ? row.narrowWidth : row.size[1], row.size[2]];
        const center = [row.x, 0, z];
        const body = drawPanel(menu.rowScope, entry.id, shapes, center, IDENTITY, size, isEntryOn(entry) ? THEME.buttonOn : THEME.button);
        const text = createText(menu.rowScope, texts, entryLabel(entry), [row.textX, 0, z], increment ? row.narrowTextSize : row.textSize);
        regions.push(clickRegion(entry.id, center, size, () => activateEntry(entry), { body: body.transform, text: text.transform }));
        if (!increment)
            return;
        for (const [suffix, side, label, delta] of [["decrease", 1, "-", -1], ["increase", -1, "+", 1]]) {
            const id = `${entry.id}-${suffix}`;
            const sideCenter = [row.x, side * LAYOUT.increment.y, z];
            const sideBody = drawPanel(menu.rowScope, id, shapes, sideCenter, IDENTITY, LAYOUT.increment.size, THEME.button);
            const sideText = createText(menu.rowScope, texts, label, [row.textX, side * LAYOUT.increment.y, z], LAYOUT.increment.textSize);
            regions.push(clickRegion(id, sideCenter, LAYOUT.increment.size, () => entry.step(delta), { body: sideBody.transform, text: sideText.transform }));
        }
    }

    function renderRows() {
        destroyObject(menu.rowShapes);
        destroyObject(menu.rowText);
        // Only chrome animations survive: the old rows are gone once their handles are released.
        menu.animations = menu.animations.filter((animation) => menu.chromeRegions.includes(animation.region));
        releaseScope(menu.rowScope);
        const shapes = createGameObject(menu.rowScope, "rows", menu.layout);
        placeLocal(shapes.transform, [0, 0, 0], IDENTITY, [1, 1, 1]);
        const textGroup = createGameObject(menu.rowScope, "rows-text");
        U.addComponent(textGroup.gameObject, typeOf(Unity.RectTransform));
        const texts = keep(menu.rowScope, U.gameObjectTransform(textGroup.gameObject));
        U.setParent(texts, menu.canvas, 0);
        placeLocal(texts, [0, 0, 0], IDENTITY, [1, 1, 1]);
        menu.rowShapes = shapes.gameObject;
        menu.rowText = textGroup.gameObject;

        const regions = menu.chromeRegions.slice();
        const entries = categoryEntries(menu.category);
        const pages = Math.max(1, Math.ceil(entries.length / BUTTONS_PER_PAGE));
        menu.page = clamp(menu.page, 0, pages - 1);
        entries.slice(menu.page * BUTTONS_PER_PAGE, (menu.page + 1) * BUTTONS_PER_PAGE).forEach((entry, index) => {
            drawRow(entry, LAYOUT.row.z0 - index * LAYOUT.row.step, shapes.transform, texts, regions);
        });

        const parent = CATEGORY_PARENT[menu.category];
        const crumb = parent ? `${parent} / ${menu.category}` : menu.category;
        createText(menu.rowScope, texts, pages > 1 ? `${crumb}   ${menu.page + 1}/${pages}` : crumb, LAYOUT.topBar.text, LAYOUT.topBar.textSize);
        menu.regions = regions;
    }

    // Parenting to the hand keeps the menu glued to it without a per-frame reposition (and without
    // a frame of lag). A hand with a mirrored or skewed scale falls back to following it manually.
    function attachMenuToHand() {
        let lossy = null;
        try {
            lossy = U.lossyScale(menu.hand);
        }
        catch (_) { }
        const uniform = lossy && lossy.every((value) => value > 0.05 && value < 20) &&
            Math.max(...lossy) / Math.min(...lossy) < 1.02;
        if (uniform) {
            U.setParent(menu.rootTransform, menu.hand, 0);
            placeLocal(menu.rootTransform, [0, 0, 0], MENU_TILT_ROTATION, [MENU_SIZE, MENU_SIZE, MENU_SIZE]);
            return true;
        }
        U.setLocalScale(menu.rootTransform, [MENU_SIZE, MENU_SIZE, MENU_SIZE]);
        try {
            U.dontDestroyOnLoad(menu.root);
        }
        catch (_) { }
        return false;
    }

    function placeMenuRoot() {
        if (!unityAlive(menu.hand) || !unityAlive(menu.rootTransform))
            return;
        try {
            U.setPositionAndRotation(menu.rootTransform, U.position(menu.hand), quatMul(U.rotation(menu.hand), MENU_TILT_ROTATION));
        }
        catch (_) { }
    }

    // World size follows the player-size preset so the menu stays proportional to your hands.
    function refreshMenuScale() {
        if (!unityAlive(menu.rootTransform))
            return;
        const size = MENU_SIZE * scalePreset().multiplier;
        if (!menu.parented) {
            try {
                U.setLocalScale(menu.rootTransform, [size, size, size]);
            }
            catch (_) { }
            return;
        }
        try {
            if (!unityAlive(menu.hand))
                return;
            const lossy = U.lossyScale(menu.hand);
            if (lossy) {
                const handScale = (lossy[0] + lossy[1] + lossy[2]) / 3;
                if (handScale > 0.0001) {
                    const local = size / handScale;
                    U.setLocalScale(menu.rootTransform, [local, local, local]);
                }
            }
        }
        catch (_) { }
    }

    function buildMenu() {
        destroyMenu();
        menu.hand = refs.leftHand;
        const root = createGameObject(menu.scope, "OverdoseMenu");
        menu.root = root.gameObject;
        menu.rootTransform = root.transform;
        menu.parented = attachMenuToHand();
        const layout = createGameObject(menu.scope, "layout", menu.rootTransform);
        placeLocal(layout.transform, MENU_HAND_OFFSET, IDENTITY, [1, 1, 1]);
        menu.layout = layout.transform;
        const canvasObject = createGameObject(menu.scope, "canvas", menu.layout);
        U.canvasRenderMode(keep(menu.scope, U.addComponent(canvasObject.gameObject, typeOf(Unity.Canvas))), 2);
        U.scalerPixelsPerUnit(keep(menu.scope, U.addComponent(canvasObject.gameObject, typeOf(Unity.CanvasScaler))), 2500);
        // Adding the Canvas swapped the Transform for a RectTransform; keep the new wrapper.
        menu.canvas = keep(menu.scope, U.gameObjectTransform(canvasObject.gameObject));
        placeLocal(menu.canvas, [0, 0, 0], IDENTITY, [1, 1, 1]);
        drawChrome();
        renderRows();
    }

    function destroyMenu() {
        destroyObject(menu.root);
        releaseScope(menu.rowScope);
        releaseScope(menu.scope);
        menu.root = menu.rootTransform = menu.layout = menu.canvas = menu.rowShapes = menu.rowText = menu.hand = NULL;
        menu.parented = false;
        menu.visible = false;
        menu.chromeRegions = [];
        menu.regions = [];
        menu.animations.length = 0;
        menu.lastHit = null;
    }

    function ensurePointer() {
        if (unityAlive(menu.pointer) && sameObject(menu.pointerHand, refs.rightHand))
            return;
        destroyPointer();
        if (!unityAlive(refs.rightHand))
            return;
        const pointer = createMeshObject(menu.pointerScope, "OverdosePointer", refs.rightHand, POINTER_OFFSET, IDENTITY,
            [POINTER_SCALE, POINTER_SCALE, POINTER_SCALE], sphereMesh(), flatMaterial(THEME.pointer));
        menu.pointer = pointer.gameObject;
        menu.pointerTransform = pointer.transform;
        menu.pointerHand = refs.rightHand;
    }

    function destroyPointer() {
        destroyObject(menu.pointer);
        releaseScope(menu.pointerScope);
        menu.pointer = menu.pointerTransform = menu.pointerHand = NULL;
    }

    function sphereMesh() {
        return cachedMesh("sphere", () => {
            const rings = 8;
            const segments = 12;
            const vertices = [];
            const triangles = [];
            for (let ring = 0; ring <= rings; ring++) {
                const phi = Math.PI * ring / rings;
                for (let segment = 0; segment <= segments; segment++) {
                    const theta = 2 * Math.PI * segment / segments;
                    vertices.push([0.5 * Math.sin(phi) * Math.cos(theta), 0.5 * Math.cos(phi), 0.5 * Math.sin(phi) * Math.sin(theta)]);
                }
            }
            for (let ring = 0; ring < rings; ring++) {
                for (let segment = 0; segment < segments; segment++) {
                    const a = ring * (segments + 1) + segment;
                    const b = a + segments + 1;
                    triangles.push(a, b, a + 1, a + 1, b, b + 1);
                }
            }
            return buildMesh(vertices, triangles);
        });
    }

    // ─────────────────────────────────── Menu interaction ───────────────────────────────────

    function hitTest(point) {
        for (const region of menu.regions) {
            let dx = point[0] - region.center[0];
            let dy = point[1] - region.center[1];
            const dz = point[2] - region.center[2];
            if (region.tilted) {
                const x = dx * region.cos + dy * region.sin;
                dy = -dx * region.sin + dy * region.cos;
                dx = x;
            }
            if (dx < -region.half[0] - PRESS_DEPTH_BEHIND || dx > region.half[0] + PRESS_DEPTH_FRONT)
                continue;
            if (Math.abs(dy) > region.half[1] + PRESS_MARGIN || Math.abs(dz) > region.half[2] + PRESS_MARGIN)
                continue;
            return region;
        }
        return null;
    }

    function setClickScale(region, factor) {
        try {
            if (unityAlive(region.body))
                U.setLocalScale(region.body, region.bodyScale.map((value) => value * factor));
            if (unityAlive(region.text))
                U.setLocalScale(region.text, [factor, factor, factor]);
        }
        catch (_) { }
    }

    function updateClickAnimations(now) {
        for (let index = menu.animations.length - 1; index >= 0; index--) {
            const { region, start } = menu.animations[index];
            const t = (now - start) / CLICK_ANIMATION_SECONDS;
            const dip = 1 - CLICK_ANIMATION_SCALE;
            const factor = t >= 1 ? 1 : t < 0.5 ? 1 - dip * (t / 0.5) : CLICK_ANIMATION_SCALE + dip * ((t - 0.5) / 0.5);
            setClickScale(region, factor);
            if (t >= 1)
                menu.animations.splice(index, 1);
        }
    }

    function finishClickAnimations() {
        for (const { region } of menu.animations)
            setClickScale(region, 1);
        menu.animations.length = 0;
    }

    // Rows are redrawn after every press; the pressed button's replacement (same id) plays the
    // Overdose click animation.
    function press(region, now) {
        try {
            region.run();
        }
        catch (error) {
            log(`menu action ${region.id} failed: ${describeError(error)}`);
        }
        try {
            renderRows();
        }
        catch (error) {
            log(`menu redraw failed: ${describeError(error)}`);
        }
        const target = menu.regions.find((candidate) => candidate.id === region.id);
        if (target && unityAlive(target.body)) {
            menu.animations = menu.animations.filter((animation) => animation.region.id !== target.id);
            menu.animations.push({ region: target, start: now });
        }
    }

    function processPointer(now) {
        let tip;
        try {
            tip = unityAlive(menu.pointerTransform)
                ? U.position(menu.pointerTransform)
                : U.transformPoint(refs.rightHand, POINTER_OFFSET[0], POINTER_OFFSET[1], POINTER_OFFSET[2]);
        }
        catch (_) {
            return;
        }
        const hit = hitTest(U.inverseTransformPoint(menu.layout, tip[0], tip[1], tip[2]));
        const id = hit ? hit.id : null;
        if (id === menu.lastHit)
            return;
        menu.lastHit = id;
        if (hit && now >= menu.nextPress) {
            menu.nextPress = now + PRESS_COOLDOWN_SECONDS;
            press(hit, now);
        }
    }

    const menuAlive = () => unityAlive(menu.root) && unityAlive(menu.layout) &&
        sameObject(menu.hand, refs.leftHand) && unityAlive(menu.hand);

    function openMenu(now) {
        try {
            if (!menuAlive()) {
                buildMenu();
            }
            else {
                renderRows();
                if (unityAlive(menu.root))
                    U.setActive(menu.root, 1);
            }
            refreshMenuScale();
            ensurePointer();
            if (unityAlive(menu.pointer))
                U.setActive(menu.pointer, 1);
            menu.visible = true;
            menu.shownAt = now;
            menu.lastHit = null;
            menu.nextCameraFix = now + CAMERA_FIX_SECONDS;
            fixCameraCullingMasks(false);
        }
        catch (err) {
            log(`openMenu failed: ${describeError(err)}`);
            try {
                destroyMenu();
            }
            catch (_) { }
        }
    }

    function closeMenu() {
        finishClickAnimations();
        menu.visible = false;
        menu.lastHit = null;
        if (unityAlive(menu.root)) {
            try {
                U.setActive(menu.root, 0);
            }
            catch (_) { }
        }
        if (unityAlive(menu.pointer)) {
            try {
                U.setActive(menu.pointer, 0);
            }
            catch (_) { }
        }
    }

    function updateMenu(now) {
        const wantOpen = input.menu;
        if (wantOpen && !menu.visible && now >= menu.retryAt) {
            try {
                openMenu(now);
            }
            catch (error) {
                log(`menu render failed: ${describeError(error)}`);
                destroyMenu();
                menu.retryAt = now + 2;
            }
        }
        else if (!wantOpen && menu.visible) {
            closeMenu();
        }
        if (!menu.visible)
            return;
        if (!menuAlive()) {
            closeMenu();
            return;
        }
        if (!menu.parented)
            placeMenuRoot();
        if (now >= menu.nextCameraFix) {
            menu.nextCameraFix = now + CAMERA_FIX_SECONDS;
            fixCameraCullingMasks(false);
        }
        updateClickAnimations(now);
        if (now - menu.shownAt >= MENU_OPEN_GRACE_SECONDS)
            processPointer(now);
    }

    // ──────────────────────────────────── Toggle effects ────────────────────────────────────

    function onToggleChanged(key, quiet = false) {
        const enabled = toggles[key];
        switch (key) {
            case "bigBoy":
                setPlayerScaleMode(enabled ? (playerScale.mode === 0 ? BIG_BOY_PRESET : playerScale.mode) : 0);
                break;
            case "speedBoost":
            case "jumpBoost":
                applyMovementModifiers();
                break;
            case "fly":
                if (!enabled)
                    disableFlyPhysics();
                break;
            case "autoAim":
                if (!enabled)
                    clearGuidedBalls();
                break;
            case "goldExplosion":
                if (enabled)
                    applyGoldExplosion();
                else
                    restoreGoldExplosion();
                break;
            case "rainbowShotExplosions":
                scoreEffects.nextRainbowUpdate = 0;
                if (!enabled)
                    clearRainbowVfx();
                break;
            case "allScoreEffects":
                if (enabled && !scoreEffects.hooksReady) {
                    toggles.allScoreEffects = false;
                    log("all score effects unavailable: safety hooks did not install");
                }
                else if (!enabled) {
                    cancelUnsentScoreEffects();
                }
                break;
            case "unlockAll":
                onUnlockAllChanged(enabled);
                break;
            // Orbit and the stack would fight over the same balls, so one switches the other off.
            case "ballOrbit":
                if (enabled) {
                    orbit.nextScan = 0;
                    if (toggles.ballStack) {
                        toggles.ballStack = false;
                        releaseBallStack(false);
                    }
                }
                else {
                    releaseOrbitBalls(true);
                }
                break;
            case "ballStack":
                if (enabled) {
                    ballStack.nextScan = 0;
                    if (toggles.ballOrbit) {
                        toggles.ballOrbit = false;
                        releaseOrbitBalls(false);
                    }
                }
                else {
                    releaseBallStack(true);
                }
                break;
            case "gripSpawn":
                resetGripSpawn();
                break;
            case "stealBall":
                resetStealBall();
                break;
            case "ballEsp":
            case "playerTracers":
            case "ballTracers":
                visuals.unavailable = false;
                visuals.nextRescan = 0;
                visuals.nextUpdate = 0;
                if (enabled && !ensureVisualMaterials())
                    toggles[key] = false;
                if (!toggles.ballEsp)
                    destroyVisualMap(visuals.ballMarkers);
                if (!toggles.playerTracers)
                    destroyVisualMap(visuals.players);
                if (!toggles.ballTracers)
                    destroyVisualMap(visuals.ballLines);
                if (!anyVisualEnabled())
                    clearVisuals(true);
                break;
            case "increaseHoopHitbox":
                if (enabled) {
                    hoopHitbox.nextRescan = 0;
                    refreshHoopHitboxes();
                }
                else {
                    restoreHoopHitboxes();
                }
                break;
        }
        if (!quiet)
            log(`${key}=${toggles[key]}`);
    }

    // ───────────────────────────────────── Lifecycle ─────────────────────────────────────

    function onHandManagerChanged() {
        destroyPointer();
        destroyMenu();
        resetStealBall();
    }

    // A map change destroys every scene object we reference; put the game back the way it was
    // and start over from fresh references.
    function resetForSceneChange() {
        resetStealBall();
        try {
            disableFlyPhysics();
        }
        catch (_) { }
        try {
            restoreHoopHitboxes();
        }
        catch (_) { }
        clearVisuals(true);
        resetScoreEffectsState();
        releaseOrbitBalls(false);
        releaseBallStack(false);
        resetGripSpawn();
        clearGuidedBalls();
        autoAim.hoops = [];
        releaseScope(autoAim.hoopScope);
        autoAim.nextHoopScan = 0;
        autoAim.basketballs.clear();
        recentReleases.clear();
        destroyMenu();
        destroyPointer();
        clearReferences();
        ballList.entries = [];
        ballList.nextRefresh = 0;
        movement.applied = false;
        movement.gravityCaptured = false;
        movement.inputCaptured = false;
        playerScale.lastApplied = isScaled() ? -1 : 1.0;
        titles.modelKey = "";
        onLockerSceneChange();
        levels.nextRefresh = 0;
    }

    function checkScene() {
        const scene = readScene();
        if (!scene.token)
            return;
        if (activeScene.token && scene.token !== activeScene.token) {
            log(`map changed: ${activeScene.name} -> ${scene.name}`);
            activeScene = scene;
            resetForSceneChange();
            fixCameraCullingMasks(true);
            return;
        }
        activeScene = scene;
    }

    // ───────────────────────────────────── Main tick ─────────────────────────────────────

    // Everything here runs on the game's main thread. Each feature is isolated so one failing
    // module can't take the others (or the menu) down with it.
    const FEATURE_UPDATES = [
        ["movement", updateMovement],
        ["steal ball", updateStealBall],
        ["locker", (now) => {
            updateLockerUi(now);
            updateOutfit(now);
        }],
        ["auto aim", updateGuidedBalls],
        ["rainbow explosions", updateRainbowVfx],
        ["levels", refreshSessionLevel],
        ["visuals", updateVisuals],
        ["hoop hitbox", updateHoopHitboxes],
        ["gold explosion", updateGoldExplosion],
        ["titles", updateTitleKeeper],
        ["custom name", updateNameKeeper],
        ["ball orbit", updateBallOrbit],
        ["ball stack", updateBallStack],
        ["grip spawn", updateGripSpawn],
        ["fly", updateFly],
        ["player size", updatePlayerScale],
    ];

    function runFeature(name, update, now, deltaTime) {
        try {
            update(now, deltaTime);
        }
        catch (error) {
            logThrottled(`feature:${name}`, 5, `${name} update failed: ${describeError(error)}`);
        }
    }

    let lastTick = 0;
    let started = false;

    // Reloading the script without restarting the game leaves the previous copy's objects in the
    // scene. Any that are still showing (an open menu, its pointer, ESP) are removed; hidden ones
    // stay hidden.
    function removeLeftoverObjects() {
        let removed = 0;
        for (const name of SCENE_OBJECT_NAMES) {
            for (let guard = 0; guard < 256; guard++) {
                let found = NULL;
                try {
                    found = U.findGameObject(managed(name));
                }
                catch (_) { }
                if (!unityAlive(found))
                    break;
                // Hidden first so Find skips it: Destroy only takes effect at the end of the frame.
                U.setActive(found, 0);
                destroyObject(found);
                removed++;
            }
        }
        if (removed > 0)
            log(`removed ${removed} leftover object(s) from a previous load`);
    }

    function firstTick() {
        removeLeftoverObjects();
        restoreConfig();
        activeScene = readScene();
        fixCameraCullingMasks(true);
        log("ready - hold X (left primary) to open the menu");
    }

    function tick(heightController) {
        const now = clock();
        if (now - lastTick < TICK_DEDUP_SECONDS)
            return;
        const deltaTime = lastTick > 0 ? Math.min(0.1, now - lastTick) : 1 / 72;
        lastTick = now;
        if (!started) {
            started = true;
            firstTick();
        }
        if (unityAlive(heightController))
            refs.heightController = heightController;
        if (now >= nextSceneCheck) {
            nextSceneCheck = now + SCENE_CHECK_SECONDS;
            checkScene();
        }
        if (now >= refs.nextRefresh)
            refreshReferences(now);
        readInput();
        // Network pacing and pool cleanup keep running through brief reference loss, so a
        // sequence can't catch up later or a looping effect outlive its lifetime.
        runFeature("score effects", updatePendingScoreEffects, now, deltaTime);
        runFeature("config", updateConfigSave, now, deltaTime);
        if (!playerReady()) {
            setVisualsActive(false);
            if (menu.visible)
                closeMenu();
            return;
        }
        runFeature("menu", updateMenu, now, deltaTime);
        for (const [name, update] of FEATURE_UPDATES)
            runFeature(name, update, now, deltaTime);
    }

    // ──────────────────────────────────────── Boot ────────────────────────────────────────

    try {
        const cachedPtr = fieldOffset(Unity.Object, "m_CachedPtr");
        if (cachedPtr >= 0)
            cachedPtrOffset = cachedPtr;
        arrayHeaderSize = Il2Cpp.Array.headerSize;
        loadConfig();
        installLockerHooks();
        installBallReleaseHook();
        installScoreAwardHooks();
        installScoreEffectHooks();
        installHeightHooks();
        const update = findMethod(Game.HeightController, "Update", 0);
        if (!update)
            throw new Error("HeightController.Update not found");
        Interceptor.attach(update.virtualAddress, {
            onEnter(args) {
                try {
                    tick(args[0]);
                }
                catch (error) {
                    logThrottled("tick", 5, `tick failed: ${describeError(error)}`);
                }
            },
        });
        log(`loaded ${new Date().toISOString()}`);
    }
    catch (error) {
        log(`boot failed: ${error && error.stack ? error.stack : error}`);
    }
});
