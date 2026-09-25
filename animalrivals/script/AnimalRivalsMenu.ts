/*
 * Animal Rivals | rasp.bat
 *
 * Clean Animal Rivals menu derived from the visual/menu conventions of the
 * user's rasp.bat UNOBF project.  This is intentionally a new, reduced source:
 * it contains only the requested categories, navigation, mods, and soundboard.
 *
 * Supported target:
 *   package: com.dogelabs.deadeye
 *   build compatibility: detected and validated at runtime
 *   Unity:   6000.3.18f1 (Android ARM64)
 *
 * Load after frida-il2cpp-bridge.js and deadeye-symbols.js.
 */

declare const Il2Cpp: any;

type Color4 = [number, number, number, number];
type Vec3 = [number, number, number];
type MenuCategory = "Main" | "Movement" | "Weapons" | "Unlocks" | "Overpowered" | "Visuals" | "Spawning" | "Soundboard";
type ToggleName =
    "triggerFly" | "speedBoost" | "longArms" | "platforms" | "infiniteAmmo" | "noCooldown" | "rapidFire" |
    "noRecoil" | "grenadeLauncher" | "unlockAll" | "invincibility" | "invisibility" |
    "tracers" | "chams" | "showHp" | "vfxGun";
type ActionName = "tpAll" | "killAll" | "nuke" | "dumpThrowables";

interface SoundboardSound {
    id: string;
    label: string;
    fileName: string;
    format: "mp3" | "wav";
    size: number;
    base64Chunks: string[];
}

// Anti-cheat bypass hooks are installed from inside Il2Cpp.perform.

interface ModState {
    triggerFly: boolean;
    speedBoost: boolean;
    longArms: boolean;
    platforms: boolean;
    infiniteAmmo: boolean;
    noCooldown: boolean;
    rapidFire: boolean;
    noRecoil: boolean;
    grenadeLauncher: boolean;
    killInLobby: boolean;
    useGunsInLobby: boolean;
    unlockAll: boolean;
    invincibility: boolean;
    invisibility: boolean;
    tracers: boolean;
    chams: boolean;
    showHp: boolean;
    vfxGun: boolean;
}

interface MenuEntry {
    id: string;
    label: string;
    toggle?: ToggleName;
    action?: ActionName;
    category?: MenuCategory;
    back?: boolean;
    disabled?: boolean;
    pageDelta?: number;
    soundIndex?: number;
    vfxSelector?: boolean;
    grenadeSelector?: boolean;
}

interface RenderedButton {
    entry: MenuEntry;
    object: any;
    renderer: any;
    collider: any;
}

const MENU_NAME = "Animal Rivals | rasp.bat";
const RAPID_FIRE_INTERVAL = 0.03;
const TRIGGER_FLY_SPEED = 55.0;
const SPEED_BOOST_JUMP_MULTIPLIER_DELTA = 1.5;
const SPEED_BOOST_MAX_SPEED_DELTA = 9.0;
const SPEED_BOOST_VELOCITY_CAP = 28.0;
const LONG_ARMS_MULTIPLIER = 2.5;
const VISUAL_SCAN_INTERVAL_FRAMES = 180;
const CHAM_RENDERER_RESCAN_FRAMES = 240;
const CHAM_SCAN_INTERVAL = 1;
const HP_TEXT_REFRESH_FRAMES = 12;
const HP_POSITION_REFRESH_FRAMES = 6;
const INVISIBILITY_RESCAN_FRAMES = 180;
const MAX_VISUAL_TARGETS = 16;
const MAX_CHAM_RENDERERS_PER_TARGET = 24;
const LOCAL_CONTROLLER_RECHECK_MS = 2000;
const LOCAL_CONTROLLER_STALE_MS = 1500;
const APPLICATION_FOCUS_POLL_CALLS = 10;
const APPLICATION_FOCUS_GRACE_FRAMES = 240;
const ENABLE_EXPERIMENTAL_MIC_MIXER = false;
const OVERPOWERED_ACTION_COOLDOWN = 2.0;
const NUKE_ACTION_COOLDOWN = 8.0;
const TP_ALL_REPEATS = 20;
const TP_ALL_REPEAT_INTERVAL_FRAMES = 8;
const GRENADE_LAUNCH_SPEED = 22.0;
const GRENADE_LAUNCH_COOLDOWN = 0.075;
const GRENADE_PREFAB_RETRY_SECONDS = 10.0;
const GRENADE_TEMPLATE_RETRY_SECONDS = 6.0;
const GRENADE_VARIANTS = [
    {
        name: "Regular",
        classNames: ["Deadeye.Throwables.GrenadeProjectile", "GrenadeProjectile"],
        resourcePaths: ["GrenadeProjectile", "Weapons/GrenadeProjectile", "Projectiles/GrenadeProjectile"],
    },
    {
        name: "Frag",
        classNames: ["Deadeye.Throwables.GrenadeProjectile", "GrenadeProjectile"],
        resourcePaths: ["FragGrenadeProjectile", "Weapons/FragGrenadeProjectile", "Projectiles/FragGrenadeProjectile"],
    }
];
const NUKE_GRENADE_COUNT = 50;
const NUKE_GRENADES_PER_FRAME = 1;
const NUKE_MAX_STALLED_FRAMES = 300;
const PLATFORM_SCALE: Vec3 = [0.28, 0.04, 0.28];
const PLATFORM_HAND_OFFSET_Y = 0.16;
const VFX_ID_FALLBACK_COUNT = 64;
const VFX_ID_MAX_COUNT = 256;
const VFX_GUN_RANGE = 40.0;
const VFX_GUN_FIRE_INTERVAL = 0.15;
const VFX_GUN_POINTER_REFRESH_FRAMES = 2;
const SOUNDBOARD_PAGE_SIZE = 5;
const MENU_BUTTON_PREFIX = "AnimalRivalsMenuButton:";
const EAC_ROOT_SCALE: Vec3 = [0.1, 0.3, 0.3825];
const EAC_MENU_SCALE = 0.9;
const MENU_POINTER_SCALE: Vec3 = [0.01, 0.01, 0.01];
const MENU_POINTER_LOCAL_POSITION: Vec3 = [0.01, -0.117, 0.05];
const MENU_POINTER_TOUCH_RADIUS = 0.005;
const MENU_POINTER_DEBOUNCE_SECONDS = 0.2;

const COLORS = {
    background: [0.01, 0.01, 0.01, 0.96] as Color4,
    outline: [0.27, 0.035, 0.035, 1.0] as Color4,
    button: [0.55, 0.10, 0.10, 0.96] as Color4,
    buttonHover: [0.70, 0.12, 0.12, 1.0] as Color4,
    buttonEnabled: [0.85, 0.10, 0.10, 1.0] as Color4,
    buttonEnabledHover: [1.0, 0.16, 0.16, 1.0] as Color4,
    text: [1.0, 1.0, 1.0, 1.0] as Color4,
    subtext: [1.0, 0.30, 0.30, 1.0] as Color4,
};

const mods: ModState = {
    triggerFly: false,
    speedBoost: false,
    longArms: false,
    platforms: false,
    infiniteAmmo: false,
    noCooldown: false,
    rapidFire: false,
    noRecoil: false,
    grenadeLauncher: false,
    killInLobby: false,
    useGunsInLobby: false,
    unlockAll: false,
    invincibility: false,
    invisibility: false,
    tracers: false,
    chams: false,
    showHp: false,
    vfxGun: false,
};

const soundboardSounds: SoundboardSound[] = (() => {
    try {
        const manifest = (globalThis as any).__RASP_SOUNDBOARD;
        if (!manifest || manifest.version !== 1 || !Array.isArray(manifest.sounds)) return [];
        return manifest.sounds.filter((sound: any) =>
            sound && typeof sound.id === "string" && typeof sound.label === "string" &&
            typeof sound.fileName === "string" && (sound.format === "mp3" || sound.format === "wav") &&
            Array.isArray(sound.base64Chunks),
        );
    } catch (_) { return []; }
})();

let currentCategory: MenuCategory = "Main";
let soundboardPage = 0;
let activeSoundIndex = -1;
let soundboardBusy = false;
let soundboardOutgoingVoice: any = null;
let soundboardPcm: Float32Array | null = null;
let soundboardPcmCursor = 0.0;
let soundboardPcmRate = 24000;
let soundboardPcmChannels = 1;
let soundboardVoiceRate = 24000;
let soundboardVoiceChannels = 1;
let soundboardMixFault = false;
let soundboardMixFaultLogged = false;
let soundboardPcmFinished = false;
let soundboardPttState: any = null;
let soundboardMixerHooksInstalled = false;
let soundboardShortHookInstalled = false;
let soundboardFloatHookInstalled = false;
let menuRoot: any = null;
let menuFrontSurface: any = null;
let menuTextRenderers: any[] = [];
let menuTextFrontVisible = true;
let renderedButtons: RenderedButton[] = [];
let hoveredButtonId = "";
let menuPointer: any = null;
let menuPointerCollider: any = null;
let menuPointerTouchArmed = true;
let lastRightGrip = false;
let menuPointerCooldownUntil = 0.0;
let menuFont: any = null;
let inputOutBool: any = null;
let leftSecondary = false;
let leftTrigger = false;
let leftTriggerAmount = 0.0;
let rightTrigger = false;
let rightTriggerAmount = 0.0;
let leftGrip = false;
let rightGrip = false;
let selectedGrenadeVariant = 0;
let frameNumber = 0;
let pendingAmmoSweep = false;
let pendingCooldownReset = false;
let cooldownResetRetryFrame = 0;
let pendingUnlockRefresh = false;
let unlockRefreshFrames: number[] = [];
let pendingInvincibilityRefresh = false;
let pendingTeleportRepeats: Array<{
    player: any;
    receiver: any;
    position: Vec3;
    nextFrame: number;
    repeatsLeft: number;
}> = [];
let lastGrenadeLaunchTime = -1000.0;
let lastGrenadePrefabWarningTime = -1000.0;
let grenadePrefabRetryAt = -1000.0;
let cachedClipboardWeapon: any = null;
let cachedGrenadePrefab: any = null;
let cachedGrenadePrefabVariant = -1;
let cachedProjectileWeaponTemplate: any = null;
let projectileWeaponTemplateRetryAt = -1000.0;
let pendingNukeGrenades = 0;
let nukeStalledFrames = 0;
let leftHandPlatform: any = null;
let rightHandPlatform: any = null;
let selectedVfxCatalogIndex = 0;
let vfxCatalog: Array<{ id: number; name: string }> = Array.from(
    { length: VFX_ID_FALLBACK_COUNT },
    (_, id) => ({ id, name: "Unknown" }),
);
let vfxCatalogResolved = false;
let vfxCatalogNextResolveAt = -1000.0;
let vfxGunRoot: any = null;
let vfxGunLine: any = null;
let vfxGunTip: any = null;
let vfxGunMaterial: any = null;
let vfxGunRaycast: any = null;
let vfxGunRaycastHitBuffer: any = null;
let vfxGunRaycastHitRef: any = null;
let vfxGunBoundRpc: any = null;
let vfxGunRpcPlayer: any = null;
let vfxGunLastStartPosition: Vec3 | null = null;
let vfxGunLastEndPosition: Vec3 | null = null;
let vfxGunNextPlayerLookupAt = -1000.0;
let vfxGunVisualRetryAt = -1000.0;
let vfxGunNextShotAt = -1000.0;
let vfxGunDispatchUnavailableUntil = -1000.0;
let vfxGunFailureCount = 0;
let vfxGunNextErrorLogAt = -1000.0;
let lastTickError = "";
let tickErrorCount = 0;
let activeLocalPlayer: any = null;
let menuBuildFaulted = false;
let menuRetryFrame = 0;
let menuTextFaultLogged = false;
let menuRoundedMeshFaultLogged = false;
let visualRoot: any = null;
let visualTargets = new Map<string, any>();
let visualShader: any = null;
let visualMaterials = new Map<string, any>();
let visualHpMaterial: any = null;
let lastVisualScanFrame = -1000;
let lastMatchModeScanFrame = -1000;
let chamScanCursor = 0;
let cachedMatchModeActive = false;
let discoveredTeamGetterNames: string[] | null = null;
let discoveredTeamFieldNames: string[] | null = null;
let discoveredVisualRootFieldNames: string[] | null = null;
let discoveredMovementBoostFieldNames: string[] | null = null;
let discoveredMovementComponentFieldNames: string[] | null = null;
let cachedHealthValueAccessor: { kind: "method" | "field"; name: string } | null = null;
let invisibilityPlayer: any = null;
let invisibleRenderers = new Map<string, { renderer: any; enabled: boolean }>();
let lastInvisibilityScanFrame = -1000;
let longArmState: {
    movement: any;
    maxLengthFields: { [name: string]: number };
    unstickFields: { [name: string]: number };
} | null = null;
let speedBoostPlayer: any = null;
let speedBoostController: any = null;
let speedBoostOriginalVelocityCap: number | null = null;
let speedBoostOriginalMovementValues: Record<string, number> | null = null;
let speedBoostTouchedMovementValues: { name: string; base: number }[] = [];
let speedBoostLeftApplied = false;
let speedBoostRightApplied = false;
const unlockBypassBooleanMethods = new Set<string>();
let lastLocalControllerTickAt = 0;
let lastLocalControllerValidationAt = 0;
let localControllerFocusPoll = 0;
let cachedApplicationFocused = true;
let focusCleanupPending = false;
let focusLostFrameCount = 0;
let menuWasOpen = false;
let tickInProgress = false;
const lastOverpoweredActionAt = new Map<ActionName, number>();

Il2Cpp.perform(() => {
    const Core = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image;
    const PhysicsImage = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image;
    const TextImage = Il2Cpp.domain.assembly("UnityEngine.TextRenderingModule").image;
    const XRImage = Il2Cpp.domain.assembly("UnityEngine.XRModule").image;
    const AudioImage = Il2Cpp.domain.assembly("UnityEngine.AudioModule").image;
    const Game = Il2Cpp.domain.assembly("DL.Animals.Core2025").image;
    const AssemblyCSharp = (() => {
        try {
            return Il2Cpp.domain.assembly("Assembly-CSharp").image;
        } catch (_) {
            return null;
        }
    })();

    const GameObject = Core.class("UnityEngine.GameObject");
    const Mesh = Core.class("UnityEngine.Mesh");
    const MeshFilter = Core.class("UnityEngine.MeshFilter");
    const UnityObject = Core.class("UnityEngine.Object");
    const Renderer = Core.class("UnityEngine.Renderer");
    const MeshRenderer = Core.class("UnityEngine.MeshRenderer");
    const SkinnedMeshRenderer = Core.class("UnityEngine.SkinnedMeshRenderer");
    const LineRenderer = Core.class("UnityEngine.LineRenderer");
    const Material = Core.class("UnityEngine.Material");
    const Resources = Core.class("UnityEngine.Resources");
    const Camera = Core.class("UnityEngine.Camera");
    const Application = Core.class("UnityEngine.Application");
    const Time = Core.class("UnityEngine.Time");
    const Quaternion = Core.class("UnityEngine.Quaternion");
    const Shader = Core.class("UnityEngine.Shader");
    const Vector3 = Core.class("UnityEngine.Vector3");
    const Physics = PhysicsImage.class("UnityEngine.Physics");
    const Collider = PhysicsImage.class("UnityEngine.Collider");
    const Rigidbody = PhysicsImage.class("UnityEngine.Rigidbody");
    const TextMesh = TextImage.class("UnityEngine.TextMesh");
    const Font = TextImage.class("UnityEngine.Font");
    const InputDevices = XRImage.class("UnityEngine.XR.InputDevices");
    const CommonUsages = XRImage.class("UnityEngine.XR.CommonUsages");
    const AudioClip = AudioImage.class("UnityEngine.AudioClip");
    const AudioSource = AudioImage.class("UnityEngine.AudioSource");
    const SingleClass = Il2Cpp.corlib.class("System.Single");
    const ShortClass = Il2Cpp.corlib.class("System.Int16");

    let PhotonRecorder: any = null;
    let PhotonVoiceConnection: any = null;
    let PhotonVoiceImage: any = null;
    let PhotonVoiceCoreImage: any = null;
    let CustomVoiceRecorder: any = null;
    try {
        PhotonVoiceImage = Il2Cpp.domain.assembly("PhotonVoice").image;
        PhotonRecorder = PhotonVoiceImage.class("Photon.Voice.Unity.Recorder");
        PhotonVoiceConnection = PhotonVoiceImage.class("Photon.Voice.Unity.VoiceConnection");
    } catch (_) {}
    for (const assemblyName of ["PhotonVoice.API", "PhotonVoiceApi", "PhotonVoice"]) {
        try {
            const image = Il2Cpp.domain.assembly(assemblyName).image;
            image.class("Photon.Voice.LocalVoiceAudioShort");
            PhotonVoiceCoreImage = image;
            break;
        } catch (_) {}
    }
    try { CustomVoiceRecorder = Game.class("CustomVoiceRecorder"); } catch (_) {}

    const WeaponBase = Game.class("DLAR_WeaponBase");
    const HitscanWeapon = Game.class("HitscanWeapon");
    const ProjectileWeapon = Game.class("ProjectileWeapon");
    const AmmoStorage = Game.class("Weapons.WeaponAmmoStorage");
    const CooldownManager = Game.class("WeaponFireRateCooldownManager");
    const RecoilController = Game.class("DLAR_XRHandRecoilController");
    const PlayerController = Game.class("PlayerController");

    function resolveClass(className: string): any {
        if (!className) return null;
        try {
            return AssemblyCSharp ? AssemblyCSharp.class(className) : null;
        } catch (_) {}
        try {
            return Game.class(className);
        } catch (_) {}
        return null;
    }

    function hookBooleanAccessor(className: string, methodName: string): void {
        const klass = resolveClass(className);
        if (!klass) return;
        let methods: any[] = [];
        try { methods.push(klass.method(methodName, 0)); } catch (_) {}
        try {
            methods = methods.concat(
                (klass.methods || [])
                    .filter((method: any) => method.name === methodName && method.parameterCount === 0),
            );
        } catch (_) {}
        for (const method of methods) {
            try {
                if (method.returnType.name !== "System.Boolean" || method.virtualAddress.isNull()) {
                    continue;
                }
                if (method.isGeneric || method.isInflated) continue;
                installHook(method, `${className}.${methodName}`, function (): boolean {
                    return false;
                });
                break;
            } catch (_) {}
        }
    }

    function getCurrentGrenadeVariant(): typeof GRENADE_VARIANTS[number] {
        return GRENADE_VARIANTS[selectedGrenadeVariant];
    }

    function hookNoopVoid(className: string, methodName: string): void {
        const klass = resolveClass(className);
        if (!klass) return;
        let methods: any[] = [];
        try { methods.push(klass.method(methodName, 0)); } catch (_) {}
        try {
            methods = methods.concat(
                (klass.methods || [])
                    .filter((method: any) => method.name === methodName && method.parameterCount === 0),
            );
        } catch (_) {}
        for (const method of methods) {
            try {
                if (method.returnType.name !== "System.Void" || method.virtualAddress.isNull()) {
                    continue;
                }
                if (method.isGeneric || method.isInflated) continue;
                installHook(method, `${className}.${methodName}`, function (): void {
                    return;
                });
                break;
            } catch (_) {}
        }
    }

    function cycleGrenadeVariant(delta: number): void {
        const variantCount = GRENADE_VARIANTS.length;
        if (!variantCount) return;
        selectedGrenadeVariant = (selectedGrenadeVariant + delta + variantCount) % variantCount;
        cachedGrenadePrefab = null;
        cachedGrenadePrefabVariant = -1;
        grenadePrefabRetryAt = -1000.0;
        console.log("[" + MENU_NAME + "] Grenade variant: " + getCurrentGrenadeVariant().name);
    }

    function installAntiCheatBypasses(): void {
        try {
            hookBooleanAccessor("GUPS.AntiCheat.Punisher.ExitGamePunisher", "get_IsSupported");
            hookBooleanAccessor("GUPS.AntiCheat.Punisher.ExitGamePunisher", "get_IsActive");
            hookBooleanAccessor("GUPS.AntiCheat.Punisher.ExitGamePunisher", "get_PunishOnce");
            hookBooleanAccessor("GUPS.AntiCheat.Punisher.ExitGamePunisher", "get_HasPunished");
            hookBooleanAccessor("AntiCheatRuntimeGuards", "get_ShouldIgnoreTamperCheck");
            hookBooleanAccessor("AntiCheatValueDetector", "get_UseUpdateLoop");
            hookBooleanAccessor("AntiCheatValueDetector", "ShouldEvaluateThisFrame");

            hookNoopVoid("GUPS.AntiCheat.Punisher.ExitGamePunisher", "Punish");
            hookNoopVoid("GUPS.AntiCheat.Punisher.ExitGamePunisher", "OnTemperingDetected");
            hookNoopVoid("AntiCheatManager", "RegisterDetector");
            hookNoopVoid("AntiCheatManager", "HandleDetectorLifecycleTamper");
            hookNoopVoid("AntiCheatManager", "HandleDetectorValueTamper");
            hookNoopVoid("AntiCheatManager", "OnTemperingDetected");
            hookNoopVoid("AntiCheatManager", "add_TamperDetected");
            hookNoopVoid("AntiCheatManager", "TriggerTamper");
            hookNoopVoid("AntiCheatManager", "ReportTamper");
            hookNoopVoid("AntiCheatManager", "DelayedLifecycleEvaluation");
            hookNoopVoid("AntiCheatRuntimeGuards", "OnApplicationQuitting");
            hookNoopVoid("AntiCheatRuntimeGuards", "RunAfterDelay");
            hookNoopVoid("AntiCheatRuntimeGuards", "ArmSceneGuard");
            hookNoopVoid("AntiCheatRuntimeGuards", "Initialize");
            hookNoopVoid("AntiCheatValueDetector", "AttachToManager");
            hookNoopVoid("AntiCheatValueDetector", "get_DetectorName");
            hookNoopVoid("AntiCheatValueDetector", "TryReadValue");
            hookNoopVoid("AntiCheatValueDetector", "EvaluateLifecycleTamper");
            hookNoopVoid("AntiCheatValueDetector", "ReportValueTamper");
            hookNoopVoid("GUPSLibraryTamperReporter", "OnAndroidCheatingDetected");
            console.log("[" + MENU_NAME + "] Anti-cheat methods patched.");
        } catch (_) {
            console.error("[" + MENU_NAME + "] Anti-cheat patching unavailable.");
        }
    }

    installAntiCheatBypasses();

    function optionalGameClass(name: string): any {
        try { return Game.class(name); }
        catch (_) { return null; }
    }

    // These exact classes are present in the pinned build. Keep them optional
    // so a missing subsystem disables only its unlock coverage, not the menu.
    const UITechNode = optionalGameClass("UITechNode");
    const UITouchCosmeticSelection = optionalGameClass("UITouchCosmeticSelection");
    const UITouchWeaponSelection = optionalGameClass("UITouchWeaponSelection");
    const UIPanelLoadout = optionalGameClass("UIPanelLoadout");
    const UIPanelWeaponSkins = optionalGameClass("UIPanelWeaponSkins");
    const PlayerCosmeticsLockerPanel = optionalGameClass("PlayerCosmeticsLockerPanel");
    const PlayfabItem = optionalGameClass("PlayfabItem");
    const MannequinLockerManager = optionalGameClass("MannequinLockerManager");
    const WeaponSkins = optionalGameClass("WeaponSkins");
    const WeaponsManager = optionalGameClass("WeaponsManager");
    const TechNodeWeaponWrap = optionalGameClass("TechNodeWeaponWrap");
    const ClipboardWeapon = optionalGameClass("ClipboardWeapon");
    const NetworkPlayer = optionalGameClass("DLARX_NetworkPlayer");
    const PlayerGlider = optionalGameClass("PlayerGlider");
    const AdminTeleport = optionalGameClass("AdminTeleport");
    const GrenadeLauncher = optionalGameClass("GrenadeLauncher");
    const GrenadeProjectile = optionalGameClass("Deadeye.Throwables.GrenadeProjectile");
    const GorillaMovement = optionalGameClass("GorillaMovement");
    const MovementManager = optionalGameClass("MovementManager");
    const PlayerVoiceHandler = optionalGameClass("PlayerVoiceHandler");
    const MatchModeClasses = [
        "GameActivity_TeamDeathMatch",
        "Duels.GameActivity_Duels",
        "Duels.GameActivity_DuelsV2",
        "Systems.GameActivities.CTF.GameActivity_CTF",
        "Infected.GameActivity_Infected",
        "GameActivity_Extraction",
        "BattleRoyaleLiteActivity",
    ].map(optionalGameClass).filter(Boolean);

    // Unity 6's private identityQuaternion backing field can expose invalid
    // metadata through IL2CPP; the public Euler factory returns the same value.
    const identityQuaternion = Quaternion.method("Euler", 3).invoke(0, 0, 0);
    let menuSurfaceShader: any = null;
    const roundedMeshCache = new Map<string, any>();
    const menuMaterials = new Map<string, any>();
    const unlockViewFieldState = new Map<
        string,
        { object: any; fieldName: string; value: any; isEnum: boolean }
    >();
    let soundboardRecorder: any = null;
    let soundboardRecorderState: any = null;
    let soundboardMicRouted = false;
    let currentSoundClip: any = null;
    let soundboardEndTime = 0.0;
    let soundboardTransmitCheckAt = 0.0;
    let soundboardTransmitRetries = 0;
    let pendingWavDecode: any = null;
    inputOutBool = Il2Cpp.alloc(1);

    function isLive(value: any): boolean {
        if (!value) return false;
        try { return !value.isNull(); } catch (_) { return false; }
    }

    function isUnityObjectAlive(value: any): boolean {
        if (!isLive(value)) return false;
        try { return !!UnityObject.method("op_Implicit", 1).invoke(value); }
        catch (_) { return false; }
    }

    function destroy(value: any): void {
        if (!isLive(value)) return;
        try { UnityObject.method("Destroy", 1).invoke(value); } catch (_) {}
    }

    function getTransform(value: any): any {
        return value.method("get_transform", 0).invoke();
    }

    function getComponent(value: any, klass: any): any {
        try {
            return value.method("GetComponent", 1)
                .overload("System.Type")
                .invoke(klass.type.object);
        }
        catch (_) { return null; }
    }

    function addComponent(value: any, klass: any): any {
        try {
            value.method("Internal_AddComponentWithType", 1).invoke(klass.type.object);
            const component = getComponent(value, klass);
            if (isLive(component)) return component;
        } catch (_) {}
        value.method("AddComponent", 1)
            .overload("System.Type")
            .invoke(klass.type.object);
        return getComponent(value, klass);
    }

    function setName(value: any, name: string): void {
        try { value.method("set_name", 1).invoke(Il2Cpp.string(name)); } catch (_) {}
    }

    function createEmpty(name: string): any {
        const object = GameObject.alloc();
        try { object.method(".ctor", 1).invoke(Il2Cpp.string(name)); }
        catch (_) {
            object.method(".ctor", 0).invoke();
            setName(object, name);
        }
        return object;
    }

    function getMenuSurfaceShader(): any {
        if (isUnityObjectAlive(menuSurfaceShader)) return menuSurfaceShader;
        menuSurfaceShader = null;
        for (const shaderName of [
            "Universal Render Pipeline/Unlit",
            "Unlit/Color",
            "UI/Default",
        ]) {
            try {
                const candidate = Shader.method("Find", 1).invoke(Il2Cpp.string(shaderName));
                if (isLive(candidate)) {
                    menuSurfaceShader = candidate;
                    return menuSurfaceShader;
                }
            } catch (_) {}
        }
        return null;
    }

    function setRendererColor(renderer: any, color: Color4): void {
        if (!isLive(renderer)) return;
        try {
            renderer.method("set_enabled", 1).invoke(true);
            const material = renderer.method("get_material", 0).invoke();
            if (!isLive(material)) return;
            try { menuMaterials.set(String(material.handle), material); } catch (_) {}
            const shader = getMenuSurfaceShader();
            if (isLive(shader)) material.method("set_shader", 1).invoke(shader);
            material.method("set_color", 1).invoke(color);
            try {
                material.method("SetColor", 2)
                    .overload("System.String", "UnityEngine.Color")
                    .invoke(Il2Cpp.string("_BaseColor"), color);
            } catch (_) {}
        } catch (_) {}
    }

    function createCube(
        name: string,
        parent: any,
        position: Vec3,
        localScale: Vec3,
        color: Color4,
        keepTriggerCollider: boolean,
    ): { object: any; renderer: any } {
        const object = GameObject.method("CreatePrimitive", 1).invoke(3);
        setName(object, name);
        const transform = getTransform(object);
        transform.method("SetParent", 2).invoke(parent, false);
        // The UNOBF menu authors these values in world space before attaching the root.
        transform.method("set_position", 1).invoke(position);
        transform.method("set_rotation", 1).invoke(identityQuaternion);
        transform.method("set_localScale", 1).invoke(localScale);

        const renderer = getComponent(object, Renderer);
        setRendererColor(renderer, color);
        const collider = getComponent(object, Collider);
        if (isLive(collider)) {
            if (keepTriggerCollider) {
                try { collider.method("set_enabled", 1).invoke(true); } catch (_) {}
                try { collider.method("set_isTrigger", 1).invoke(true); } catch (_) {}
            } else {
                try { collider.method("set_enabled", 1).invoke(false); } catch (_) { destroy(collider); }
            }
        }
        return { object, renderer };
    }

    function getRoundedBoxMesh(width: number, height: number, cornerRadius: number): any {
        const normalizedY = Math.max(0.001, Math.min(0.46, cornerRadius / Math.max(width, 0.001)));
        const normalizedZ = Math.max(0.001, Math.min(0.46, cornerRadius / Math.max(height, 0.001)));
        const cacheKey = normalizedY.toFixed(4) + ":" + normalizedZ.toFixed(4);
        const cached = roundedMeshCache.get(cacheKey);
        if (isUnityObjectAlive(cached)) return cached;
        roundedMeshCache.delete(cacheKey);

        const perimeter: Array<[number, number]> = [];
        const cornerSegments = 10;
        const corners: Array<[number, number, number, number]> = [
            [0.5 - normalizedY, 0.5 - normalizedZ, 0, Math.PI * 0.5],
            [-0.5 + normalizedY, 0.5 - normalizedZ, Math.PI * 0.5, Math.PI],
            [-0.5 + normalizedY, -0.5 + normalizedZ, Math.PI, Math.PI * 1.5],
            [0.5 - normalizedY, -0.5 + normalizedZ, Math.PI * 1.5, Math.PI * 2],
        ];
        for (const [centerY, centerZ, startAngle, endAngle] of corners) {
            for (let segment = 0; segment <= cornerSegments; segment++) {
                const t = segment / cornerSegments;
                const angle = startAngle + (endAngle - startAngle) * t;
                perimeter.push([
                    centerY + Math.cos(angle) * normalizedY,
                    centerZ + Math.sin(angle) * normalizedZ,
                ]);
            }
        }

        const vertices: Vec3[] = [];
        for (const [y, z] of perimeter) vertices.push([0.5, y, z]);
        for (const [y, z] of perimeter) vertices.push([-0.5, y, z]);
        const ringCount = perimeter.length;
        const frontCenter = vertices.length;
        vertices.push([0.5, 0, 0]);
        const backCenter = vertices.length;
        vertices.push([-0.5, 0, 0]);

        const triangles: number[] = [];
        for (let index = 0; index < ringCount; index++) {
            const next = (index + 1) % ringCount;
            triangles.push(frontCenter, index, next);
            triangles.push(backCenter, next + ringCount, index + ringCount);
            triangles.push(index, index + ringCount, next + ringCount);
            triangles.push(index, next + ringCount, next);
        }

        const vertexArray = Il2Cpp.array(Vector3, vertices.length);
        for (let index = 0; index < vertices.length; index++) {
            vertexArray.set(index, Il2Cpp.fromFridaValue(vertices[index], Vector3.type));
        }
        const mesh = Mesh.alloc();
        mesh.method(".ctor", 0).invoke();
        mesh.method("set_vertices", 1).invoke(vertexArray);
        mesh.method("set_triangles", 1)
            .invoke(Il2Cpp.array(Il2Cpp.corlib.class("System.Int32"), triangles));
        try { mesh.method("RecalculateBounds", 0).invoke(); } catch (_) {}
        try { mesh.method("RecalculateNormals", 0).invoke(); } catch (_) {}
        const vertexCount = Number(mesh.method("get_vertexCount", 0).invoke());
        if (!Number.isFinite(vertexCount) || vertexCount <= 0) {
            throw new Error("Rounded menu mesh has no vertices");
        }
        roundedMeshCache.set(cacheKey, mesh);
        return mesh;
    }

    function clearRoundedMeshCache(): void {
        const meshes = Array.from(roundedMeshCache.values());
        roundedMeshCache.clear();
        for (const mesh of meshes) {
            if (!isUnityObjectAlive(mesh)) continue;
            try { UnityObject.method("Destroy", 1).invoke(mesh); } catch (_) {}
        }
    }

    function setRoundedMesh(surfaceObject: any, width: number, height: number, cornerRadius: number): void {
        // Runtime-generated Mesh wrappers became stale across Quest scene/menu
        // teardown and faulted inside MeshFilter setters. Rounded corners are
        // cosmetic, so retain CreatePrimitive's stable built-in cube mesh.
        void surfaceObject;
        void width;
        void height;
        void cornerRadius;
    }

    function createOutlinedObject(
        name: string,
        parent: any,
        position: Vec3,
        scale: Vec3,
        color: Color4,
        interactive: boolean,
        outlineSize: number,
    ): { object: any; renderer: any } {
        const fill = createCube(name, parent, position, scale, color, interactive);
        const fillRadius = Math.min(Math.min(scale[1], scale[2]) * 0.28, 0.06);
        setRoundedMesh(fill.object, scale[1], scale[2], fillRadius);
        if (outlineSize > 0) {
            const outlineScale: Vec3 = [
                scale[0],
                scale[1] + outlineSize * 2,
                scale[2] + outlineSize * 2,
            ];
            const outline = createCube(
                name + ":Outline",
                parent,
                [position[0] - 0.001, position[1], position[2]],
                outlineScale,
                COLORS.outline,
                false,
            );
            setRoundedMesh(
                outline.object,
                outlineScale[1],
                outlineScale[2],
                fillRadius + outlineSize,
            );
        }
        return fill;
    }

    function getFont(): any {
        if (isUnityObjectAlive(menuFont)) return menuFont;
        menuFont = null;
        for (const fileName of ["LegacyRuntime.ttf", "Arial.ttf"]) {
            try {
                const candidate = Resources.method("GetBuiltinResource", 2)
                    .overload("System.Type", "System.String")
                    .invoke(Font.type.object, Il2Cpp.string(fileName));
                if (isLive(candidate)) {
                    menuFont = candidate;
                    return menuFont;
                }
            } catch (_) {}
        }
        return null;
    }

    function setMenuTextScale(textTransform: any, baseScale: number): void {
        try {
            const rootScale = getTransform(menuRoot).method("get_localScale", 0).invoke();
            const sx = Math.abs(Number(rootScale.field("x").value)) || 1.0;
            const sy = Math.abs(Number(rootScale.field("y").value)) || 1.0;
            const sz = Math.abs(Number(rootScale.field("z").value)) || 1.0;
            const xScale = (baseScale * 0.42) / sx;
            textTransform.method("set_localScale", 1).invoke([-xScale, baseScale / sy, baseScale / sz]);
        } catch (_) {
            try {
                textTransform.method("set_localScale", 1).invoke([-(baseScale * 0.42), baseScale, baseScale]);
            } catch (_) {}
        }
    }

    function createText(
        parent: any,
        surfaceObject: any,
        name: string,
        text: string,
        surfacePosition: Vec3,
        color: Color4,
        fontSize: number,
        characterSize: number,
        baseScale: number,
    ): any {
        let object: any = null;
        try {
            object = createEmpty(name);
            const transform = getTransform(object);
            transform.method("SetParent", 2).invoke(parent, false);

            const component = addComponent(object, TextMesh);
            if (!isLive(component)) throw new Error("TextMesh was not created");
            const font = getFont();
            if (isLive(font)) {
                try { component.method("set_font", 1).invoke(font); } catch (_) {}
                try {
                    const textRenderer = getComponent(object, Renderer);
                    const fontMaterial = font.method("get_material", 0).invoke();
                    if (isLive(textRenderer) && isLive(fontMaterial)) {
                        try { textRenderer.method("set_sharedMaterial", 1).invoke(fontMaterial); }
                        catch (_) { textRenderer.method("set_material", 1).invoke(fontMaterial); }
                    }
                } catch (_) {}
            }
            component.method("set_text", 1).invoke(Il2Cpp.string(text));
            try { component.method("set_fontSize", 1).invoke(fontSize); } catch (_) {}
            try { component.method("set_characterSize", 1).invoke(characterSize); } catch (_) {}
            try { component.method("set_fontStyle", 1).invoke(1); } catch (_) {}
            try { component.method("set_anchor", 1).invoke(4); } catch (_) {}
            try { component.method("set_alignment", 1).invoke(1); } catch (_) {}
            try { component.method("set_richText", 1).invoke(true); } catch (_) {}
            try { component.method("set_color", 1).invoke(color); } catch (_) {}
            try {
                const anchorPosition: Vec3 = [surfacePosition[0] + 0.0125, surfacePosition[1], surfacePosition[2]];
                transform.method("set_position", 1).invoke(
                    getTransform(surfaceObject).method("TransformPoint", 1).invoke(anchorPosition),
                );
            } catch (_) {
                try { transform.method("set_localPosition", 1).invoke(surfacePosition); } catch (_) {}
            }
            try {
                const surfaceRotation = getTransform(surfaceObject).method("get_rotation", 0).invoke();
                const faceRotation = Quaternion.method("op_Multiply", 2).invoke(
                    surfaceRotation,
                    Quaternion.method("Euler", 3).invoke(0, 90, 90),
                );
                transform.method("set_rotation", 1).invoke(faceRotation);
            } catch (_) {
                try {
                    transform.method("set_localRotation", 1)
                        .invoke(Quaternion.method("Euler", 3).invoke(0, 90, 90));
                } catch (_) {}
            }
            setMenuTextScale(transform, baseScale);
            try {
                const textRenderer = getComponent(object, Renderer);
                if (isLive(textRenderer)) {
                    textRenderer.method("set_enabled", 1).invoke(menuTextFrontVisible);
                    try { textRenderer.method("set_sortingOrder", 1).invoke(32767); } catch (_) {}
                    menuTextRenderers.push(textRenderer);
                }
            } catch (_) {}
            return component;
        } catch (error) {
            if (isLive(object)) destroy(object);
            if (!menuTextFaultLogged) {
                menuTextFaultLogged = true;
                console.error("[" + MENU_NAME + "] Text skipped without closing the menu: " + error);
            }
            return null;
        }
    }

    function menuEntries(): MenuEntry[] {
        if (currentCategory === "Main") {
            return [
                { id: "category-movement", label: "Movement", category: "Movement" },
                { id: "category-weapons", label: "Weapons", category: "Weapons" },
                { id: "category-unlocks", label: "Unlocks", category: "Unlocks" },
                { id: "category-overpowered", label: "Overpowered", category: "Overpowered" },
                { id: "category-visuals", label: "Visuals", category: "Visuals" },
                { id: "category-spawning", label: "Spawning", category: "Spawning" },
                { id: "category-soundboard", label: "Soundboard", category: "Soundboard" },
            ];
        }
        if (currentCategory === "Movement") {
            return [
                { id: "trigger-fly", label: "Trigger Fly", toggle: "triggerFly" },
                { id: "speed-boost", label: "Speed Boost", toggle: "speedBoost" },
                { id: "long-arms", label: "Long Arms", toggle: "longArms" },
                { id: "platforms", label: "Platforms", toggle: "platforms" },
                { id: "back-movement", label: "< Back", back: true },
            ];
        }
        if (currentCategory === "Weapons") {
            return [
                { id: "infinite-ammo", label: "Infinite Ammo", toggle: "infiniteAmmo" },
                { id: "no-cooldown", label: "No Cooldown", toggle: "noCooldown" },
                { id: "rapid-fire", label: "Rapid Fire", toggle: "rapidFire" },
                { id: "no-recoil", label: "No Recoil", toggle: "noRecoil" },
                { id: "grenade-launcher", label: "Grenade Launcher", toggle: "grenadeLauncher" },
                { id: "grenade-variant", label: "Grenade: " + getCurrentGrenadeVariant().name, grenadeSelector: true },
                { id: "dump-throwables", label: "Dump Throwables", action: "dumpThrowables" },
                { id: "kill-in-lobby", label: "Kill in Lobby", toggle: "killInLobby" },
                { id: "use-guns-in-lobby", label: "Use Guns in Lobby", toggle: "useGunsInLobby" },
                { id: "back-weapons", label: "< Back", back: true },
            ];
        }
        if (currentCategory === "Unlocks") {
            return [
                { id: "unlock-all", label: "Unlock All", toggle: "unlockAll" },
                { id: "back-unlocks", label: "< Back", back: true },
            ];
        }
        if (currentCategory === "Overpowered") {
            return [
                { id: "invincibility", label: "Invincibility", toggle: "invincibility" },
                { id: "invisibility", label: "Invisibility", toggle: "invisibility" },
                { id: "tp-all", label: "TP All", action: "tpAll" },
                { id: "kill-all", label: "Kill All", action: "killAll" },
                { id: "nuke", label: "Nuke", action: "nuke" },
                { id: "back-overpowered", label: "< Back", back: true },
            ];
        }
        if (currentCategory === "Visuals") {
            return [
                { id: "tracers", label: "Tracers", toggle: "tracers" },
                { id: "chams", label: "Chams", toggle: "chams" },
                { id: "show-hp", label: "Show HP", toggle: "showHp" },
                { id: "back-visuals", label: "< Back", back: true },
            ];
        }
        if (currentCategory === "Spawning") {
            const networkPlayer = getVfxNetworkPlayer();
            if (isUnityObjectAlive(networkPlayer)) ensureVfxCatalog(networkPlayer);
            const selected = selectedVfxEntry();
            return [
                { id: "vfx-gun", label: "VFX Gun", toggle: "vfxGun" },
                {
                    id: "vfx-selector",
                    label: "VFX: " + selected.name + " [" + selected.id + "]",
                    vfxSelector: true,
                },
                { id: "back-spawning", label: "< Back", back: true },
            ];
        }

        const maxPage = Math.max(0, Math.ceil(soundboardSounds.length / SOUNDBOARD_PAGE_SIZE) - 1);
        soundboardPage = Math.max(0, Math.min(soundboardPage, maxPage));
        const first = soundboardPage * SOUNDBOARD_PAGE_SIZE;
        const entries: MenuEntry[] = soundboardSounds
            .slice(first, first + SOUNDBOARD_PAGE_SIZE)
            .map((sound, offset) => ({
                id: sound.id,
                label: sound.label.length > 26 ? sound.label.substring(0, 25) + "..." : sound.label,
                soundIndex: first + offset,
            }));
        if (entries.length === 0) {
            entries.push({ id: "soundboard-empty", label: "No sounds found", disabled: true });
        }
        if (soundboardPage > 0) entries.push({ id: "soundboard-prev", label: "< Previous", pageDelta: -1 });
        if (soundboardPage < maxPage) entries.push({ id: "soundboard-next", label: "Next >", pageDelta: 1 });
        entries.push({ id: "back-soundboard", label: "< Back", back: true });
        return entries;
    }

    function buttonIsEnabled(entry: MenuEntry): boolean {
        if (entry.toggle !== undefined) return mods[entry.toggle];
        return entry.soundIndex !== undefined && soundboardBusy && entry.soundIndex === activeSoundIndex;
    }

    function buttonColor(entry: MenuEntry, hovered: boolean): Color4 {
        if (buttonIsEnabled(entry)) return hovered ? COLORS.buttonEnabledHover : COLORS.buttonEnabled;
        return hovered ? COLORS.buttonHover : COLORS.button;
    }

    function buttonLabel(entry: MenuEntry): string {
        return entry.label;
    }

    function fittedTextScale(text: string, baseScale: number, characterBudget: number): number {
        const length = Math.max(text.trim().length, 1);
        return baseScale * Math.max(0.55, Math.min(1.0, characterBudget / length));
    }

    function buildMenu(): boolean {
        destroyMenu();
        try {
        menuRoot = createEmpty("AnimalRivalsRaspMenu");
        const rootTransform = getTransform(menuRoot);
        rootTransform.method("set_localScale", 1).invoke(EAC_ROOT_SCALE);

        const background = createOutlinedObject(
            "AnimalRivalsMenuBackground",
            rootTransform,
            [0.1, 0, 0],
            [0.1, 1, 1],
            COLORS.background,
            false,
            0.009,
        );
        menuFrontSurface = background.object;
        createText(
            rootTransform,
            background.object,
            "AnimalRivalsMenuTitle",
            MENU_NAME,
            [0.501, 0, 0.435],
            COLORS.text,
            112,
            0.027,
            fittedTextScale(MENU_NAME, 0.023 * 1.6, 20),
        );

        renderedButtons = [];
        const entries = menuEntries();
        entries.forEach((entry, index) => {
            const button = createOutlinedObject(
                MENU_BUTTON_PREFIX + entry.id,
                rootTransform,
                [0.105, 0, 0.13 - index * 0.04],
                [0.09, 0.9, 0.08],
                buttonColor(entry, false),
                true,
                0.0065,
            );
            createText(
                rootTransform,
                button.object,
                "AnimalRivalsMenuLabel:" + entry.id,
                buttonLabel(entry),
                [0.501, 0, 0],
                COLORS.text,
                136,
                0.036,
                fittedTextScale(buttonLabel(entry), 0.034, 10.5),
            );
            renderedButtons.push({
                entry,
                object: button.object,
                renderer: button.renderer,
                collider: getComponent(button.object, Collider),
            });
        });
        rootTransform.method("set_localScale", 1).invoke([
            EAC_ROOT_SCALE[0] * EAC_MENU_SCALE,
            EAC_ROOT_SCALE[1] * EAC_MENU_SCALE,
            EAC_ROOT_SCALE[2] * EAC_MENU_SCALE,
        ]);
        hoveredButtonId = "";
        if (isUnityObjectAlive(activeLocalPlayer)) recenterMenu(activeLocalPlayer);
        menuBuildFaulted = false;
        menuRetryFrame = 0;
        console.log("[" + MENU_NAME + "] Opened " + currentCategory + " menu.");
        return true;
        } catch (error) {
            console.error("[" + MENU_NAME + "] Menu build failed: " + ((error as any)?.stack || error));
            destroyMenu();
            menuBuildFaulted = true;
            menuRetryFrame = frameNumber + 30;
            return false;
        }
    }

    function destroyMenu(): void {
        destroyMenuPointer();
        if (isUnityObjectAlive(menuRoot)) destroy(menuRoot);
        const materials = Array.from(menuMaterials.values());
        menuMaterials.clear();
        for (const material of materials) {
            if (isUnityObjectAlive(material)) destroy(material);
        }
        // Runtime-created meshes do not survive every menu/scene teardown even
        // when their IL2CPP wrapper still has a non-null pointer. Reusing one
        // caused the second menu build to fault inside MeshFilter.set_mesh.
        clearRoundedMeshCache();
        menuRoot = null;
        menuFrontSurface = null;
        menuFont = null;
        menuSurfaceShader = null;
        menuTextRenderers = [];
        menuTextFrontVisible = true;
        renderedButtons = [];
        hoveredButtonId = "";
    }

    function getCameraTransform(player: any): any {
        try {
            const camera = player.field("playerCamera").value;
            if (isLive(camera)) return camera.method("get_transform", 0).invoke();
        } catch (_) {}
        try {
            const camera = Camera.method("get_main", 0).invoke();
            if (isLive(camera)) return camera.method("get_transform", 0).invoke();
        } catch (_) {}
        return null;
    }

    function updateMenuTextFrontVisibility(player: any): void {
        if (!isUnityObjectAlive(menuFrontSurface) || menuTextRenderers.length === 0) return;
        let visible: boolean;
        try {
            const cameraTransform = getCameraTransform(player);
            if (!isLive(cameraTransform)) return;
            const cameraPosition = cameraTransform.method("get_position", 0).invoke();
            const surfaceTransform = getTransform(menuFrontSurface);
            const localCameraPosition = surfaceTransform.method("InverseTransformPoint", 1)
                .invoke(cameraPosition);
            // Menu text is authored just beyond the panel's +X face (x=0.5).
            visible = Number(localCameraPosition.field("x").value) > 0.501;
        } catch (_) { return; }
        if (visible === menuTextFrontVisible) return;
        menuTextFrontVisible = visible;
        const liveRenderers: any[] = [];
        for (const renderer of menuTextRenderers) {
            if (!isLive(renderer)) continue;
            try { renderer.method("set_enabled", 1).invoke(visible); } catch (_) {}
            liveRenderers.push(renderer);
        }
        menuTextRenderers = liveRenderers;
    }

    function destroyMenuPointer(): void {
        if (isUnityObjectAlive(menuPointer)) destroy(menuPointer);
        menuPointer = null;
        menuPointerCollider = null;
    }

    function createMenuPointer(player: any): boolean {
        destroyMenuPointer();
        const hand = getRightHandTransform(player);
        if (!isLive(hand)) return false;

        let pointer: any = null;
        try {
            // Match the Animal Company UNOBF reference ball exactly: a tiny
            // background-colored sphere parented to the hand opposite the menu.
            pointer = GameObject.method("CreatePrimitive", 1).invoke(0);
            setName(pointer, "AnimalRivalsMenuPointer");
            const transform = getTransform(pointer);
            transform.method("SetParent", 2).invoke(hand, false);
            transform.method("set_localPosition", 1).invoke(MENU_POINTER_LOCAL_POSITION);
            transform.method("set_localRotation", 1).invoke(identityQuaternion);
            transform.method("set_localScale", 1).invoke(MENU_POINTER_SCALE);

            setRendererColor(getComponent(pointer, Renderer), COLORS.background);
            const collider = getComponent(pointer, Collider);
            if (isLive(collider)) {
                try { collider.method("set_enabled", 1).invoke(true); } catch (_) {}
                try { collider.method("set_isTrigger", 1).invoke(true); } catch (_) {}
            }
            try { pointer.method("set_layer", 1).invoke(2); } catch (_) {}

            menuPointer = pointer;
            menuPointerCollider = collider;
            return true;
        } catch (_) {
            if (isLive(pointer)) destroy(pointer);
            menuPointer = null;
            menuPointerCollider = null;
            return false;
        }
    }

    function ensureMenuPointer(player: any): boolean {
        if (isUnityObjectAlive(menuPointer)) return true;
        return createMenuPointer(player);
    }

    function resolveTransformFromField(player: any, fieldName: string): any {
        try {
            const value = player.field(fieldName).value;
            if (!isLive(value)) return null;
            if (value.class?.name === "UnityEngine.Transform") return value;
            try { return value.method("get_transform", 0).invoke(); } catch (_) {}
            return isUnityObjectAlive(value) ? value : null;
        } catch (_) {
            return null;
        }
    }

    function isLikelyHandTransform(transform: any): boolean {
        if (!isUnityObjectAlive(transform)) return false;
        let name = "";
        try {
            name = (objectName(componentGameObject(transform)) || "").toLowerCase();
        } catch (_) {}
        if (!name) return true;
        if (/(head|neck|chest|spine|hip|pelvis|camera|face|eye|headset|hmd|body|torso)/i.test(name)) return false;
        if (/(hand|wrist|palm|controller|grip|index|thumb|trigger|primary|secondary|offhand|secondaryhand)/i.test(name)) return true;
        return false;
    }

    function getCameraTransformFallback(player: any): any {
        try {
            const cameraTransform = player.field("playerCamera").value;
            if (isUnityObjectAlive(cameraTransform)) return cameraTransform;
        } catch (_) {}
        return null;
    }

    function getLeftHandTransform(player: any): any {
        const candidates = [
            "handLeftAnchor",
            "leftHandAnchor",
            "LeftHandAnchor",
            "leftHand",
            "handLeft",
            "leftHandTransform",
            "leftController",
            "leftControllerTransform",
            "leftControllerAnchor",
        ];
        for (const candidate of candidates) {
            const transform = resolveTransformFromField(player, candidate);
            if (isUnityObjectAlive(transform)) return transform;
        }
        // Fall back to the active hand transform if legacy fields are not
        // available on this build variant.
        try {
            const hands = getLocalHeldWeapons();
            if (hands.length > 0) {
                const hand = hands[0];
                const transform = getTransform(hand);
                if (isUnityObjectAlive(transform)) return transform;
            }
        } catch (_) {}
        return null;
    }

    function getRightHandTransform(player: any): any {
        const candidates = [
            "handRightAnchor",
            "rightHandAnchor",
            "RightHandAnchor",
            "handRight",
            "rightHand",
            "rightHandTransform",
            "rightController",
            "rightControllerTransform",
            "rightControllerAnchor",
            "offhand",
            "secondaryHand",
        ];
        let fallback: any = null;
        for (const candidate of candidates) {
            const transform = resolveTransformFromField(player, candidate);
            if (!isUnityObjectAlive(transform)) continue;
            if (isLikelyHandTransform(transform)) return transform;
            if (!fallback) fallback = transform;
        }
        if (fallback) return fallback;
        return null;
    }

    function recenterMenu(player: any): void {
        try {
            if (!isUnityObjectAlive(menuRoot)) return;
            const leftHandTransform = getLeftHandTransform(player);
            if (!isLive(leftHandTransform)) return;
            const rootTransform = getTransform(menuRoot);
            // Match the UNOBF menu: leave the root unparented and copy the raw
            // left-hand world pose so inherited hand scale cannot distort it.
            rootTransform.method("set_position", 1).invoke(
                leftHandTransform.method("get_position", 0).invoke(),
            );
            rootTransform.method("set_rotation", 1).invoke(
                leftHandTransform.method("get_rotation", 0).invoke(),
            );
            rootTransform.method("set_localScale", 1).invoke([
                EAC_ROOT_SCALE[0] * EAC_MENU_SCALE,
                EAC_ROOT_SCALE[1] * EAC_MENU_SCALE,
                EAC_ROOT_SCALE[2] * EAC_MENU_SCALE,
            ]);
        } catch (_) {}
    }

    function readBoolUsage(device: any, usage: any): boolean {
        try {
            inputOutBool.writeU8(0);
            const ok = device.method("TryGetFeatureValue", 2)
                .overload(
                    "UnityEngine.XR.InputFeatureUsage<System.Boolean>",
                    "System.Boolean&",
                )
                .invoke(usage, inputOutBool);
            return !!ok && inputOutBool.readU8() !== 0;
        } catch (_) { return false; }
    }

    function updateInput(player: any): void {
        leftSecondary = false;
        leftTrigger = false;
        leftTriggerAmount = 0.0;
        rightTrigger = false;
        rightTriggerAmount = 0.0;
        leftGrip = false;
        rightGrip = false;
        try {
            const left = InputDevices.method("GetDeviceAtXRNode", 1).invoke(4);
            const right = InputDevices.method("GetDeviceAtXRNode", 1).invoke(5);
            leftSecondary = readBoolUsage(left, CommonUsages.field("secondaryButton").value);
            leftTrigger = readBoolUsage(left, CommonUsages.field("triggerButton").value);
            rightTrigger = readBoolUsage(right, CommonUsages.field("triggerButton").value);
            leftGrip = readBoolUsage(left, CommonUsages.field("gripButton").value);
            rightGrip = readBoolUsage(right, CommonUsages.field("gripButton").value);
        } catch (_) {}
        try {
            leftTriggerAmount = Number(player.method("GetTriggerControlMagnitude", 1).invoke(0));
            if (leftTriggerAmount > 0.5) leftTrigger = true;
        } catch (_) {
            leftTriggerAmount = leftTrigger ? 1.0 : 0.0;
        }
        try {
            rightTriggerAmount = Number(player.method("GetTriggerControlMagnitude", 1).invoke(1));
            if (rightTriggerAmount > 0.5) rightTrigger = true;
        } catch (_) {
            rightTriggerAmount = rightTrigger ? 1.0 : 0.0;
        }
        try {
            if (Number(player.method("GetGripControlMagnitude", 1).invoke(0)) > 0.5) leftGrip = true;
        } catch (_) {}
        try {
            if (Number(player.method("GetGripControlMagnitude", 1).invoke(1)) > 0.5) rightGrip = true;
        } catch (_) {}
    }

    function objectName(value: any): string {
        try {
            const name = value.method("get_name", 0).invoke();
            return String(name && name.content !== undefined ? name.content : name);
        } catch (_) { return ""; }
    }

    function pointerTouchButton(player: any): string {
        if (!ensureMenuPointer(player)) return "";
        try {
            const pointerPosition = getTransform(menuPointer).method("get_position", 0).invoke();
            const px = Number(pointerPosition.field("x").value);
            const py = Number(pointerPosition.field("y").value);
            const pz = Number(pointerPosition.field("z").value);
            const pointerWorldPosition: Vec3 = [px, py, pz];

            // Only real ball-to-button contact counts. There is no camera ray,
            // virtual fingertip, nearest-button fallback, or trigger press.
            let touchedId = "";
            let touchedDistance = MENU_POINTER_TOUCH_RADIUS;
            for (const button of renderedButtons) {
                if (!isLive(button.object) || !isLive(button.collider)) continue;
                try {
                    const closest = button.collider.method("ClosestPoint", 1)
                        .invoke(pointerWorldPosition);
                    const dx = Number(closest.field("x").value) - px;
                    const dy = Number(closest.field("y").value) - py;
                    const dz = Number(closest.field("z").value) - pz;
                    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    if (distance <= touchedDistance) {
                        touchedDistance = distance;
                        touchedId = button.entry.id;
                    }
                } catch (_) {}
            }
            return touchedId;
        } catch (_) { return ""; }
    }

    function refreshButtonColors(nextHoveredId: string): void {
        if (nextHoveredId === hoveredButtonId) return;
        hoveredButtonId = nextHoveredId;
        for (const button of renderedButtons) {
            setRendererColor(button.renderer, buttonColor(button.entry, button.entry.id === hoveredButtonId));
        }
    }

    function setToggle(toggle: ToggleName, enabled: boolean): void {
        if (mods[toggle] === enabled) return;
        mods[toggle] = enabled;
        if (toggle === "infiniteAmmo" && enabled) pendingAmmoSweep = true;
        if ((toggle === "noCooldown" || toggle === "rapidFire") && enabled) {
            pendingCooldownReset = true;
            cooldownResetRetryFrame = frameNumber;
        }
        if (toggle === "unlockAll") {
            pendingUnlockRefresh = true;
            unlockRefreshFrames = [
                frameNumber + 15,
                frameNumber + 30,
                frameNumber + 60,
                frameNumber + 90,
                frameNumber + 180,
                frameNumber + 300,
            ];
            console.log(
                "[" + MENU_NAME + "] Unlock All is runtime-only; " +
                "store purchases, currency, and account entitlements are unchanged."
            );
        }
        if (toggle === "invincibility") {
            pendingInvincibilityRefresh = !setGodMode(enabled);
        }
        if (toggle === "speedBoost" && !enabled) restoreSpeedBoost();
        if (toggle === "longArms" && !enabled) restoreLongArms();
        if (toggle === "platforms" && !enabled) clearPlatforms();
        if (toggle === "invisibility" && !enabled) restoreInvisibility();
        if (toggle === "tracers" && !enabled) clearTracers();
        if (toggle === "chams" && !enabled) restoreChams();
        if (toggle === "showHp" && !enabled) clearHpLabels();
        if (toggle === "vfxGun") {
            if (enabled) {
                vfxGunNextShotAt = unityNow();
                vfxGunDispatchUnavailableUntil = -1000.0;
                vfxGunFailureCount = 0;
                vfxGunVisualRetryAt = -1000.0;
            } else {
                destroyVfxGunVisuals();
            }
        }
        console.log("[" + MENU_NAME + "] " + toggle + "=" + enabled);
    }

    function runAction(action: ActionName): void {
        const now = unityNow();
        const last = lastOverpoweredActionAt.get(action) ?? -1000.0;
        const cooldown = action === "nuke" ? NUKE_ACTION_COOLDOWN : OVERPOWERED_ACTION_COOLDOWN;
        if (now - last < cooldown) return;
        if (action === "nuke") {
            if (queueNuke()) lastOverpoweredActionAt.set(action, now);
            return;
        }
        lastOverpoweredActionAt.set(action, now);
        if (action === "tpAll") teleportAllToLocalPlayer();
        else if (action === "killAll") killAllPlayers();
    }

    function activateButton(id: string): void {
        const rendered = renderedButtons.find(button => button.entry.id === id);
        if (!rendered) return;
        const entry = rendered.entry;
        if (entry.disabled) return;
        if (entry.category) {
            currentCategory = entry.category;
            if (entry.category === "Soundboard") soundboardPage = 0;
        }
        else if (entry.back) currentCategory = "Main";
        else if (entry.pageDelta) soundboardPage += entry.pageDelta;
        else if (entry.soundIndex !== undefined) playSoundboardSound(entry.soundIndex);
        else if (entry.vfxSelector) cycleSelectedVfx(rightGrip ? -1 : 1);
        else if (entry.grenadeSelector) cycleGrenadeVariant(1);
        else if (entry.action) {
            runAction(entry.action);
            // Action labels do not change. Keeping the existing menu avoids a
            // destroy/recreate allocation burst when a button is touched fast.
            return;
        }
        else if (entry.toggle) setToggle(entry.toggle, !mods[entry.toggle]);
        buildMenu();
    }

    function updateMenu(player: any): void {
        if (!leftSecondary) {
            if (menuWasOpen) {
                destroyMenu();
                menuWasOpen = false;
            }
            menuPointerTouchArmed = true;
            menuPointerCooldownUntil = 0;
            menuBuildFaulted = false;
            menuRetryFrame = 0;
            return;
        }
        let openedThisFrame = false;
        if (!isUnityObjectAlive(menuRoot)) {
            if (menuBuildFaulted) {
                if (frameNumber < menuRetryFrame) return;
                menuBuildFaulted = false;
            }
            if (!buildMenu()) return;
            openedThisFrame = true;
            menuWasOpen = true;
            menuPointerTouchArmed = true;
        }
        recenterMenu(player);
        updateMenuTextFrontVisibility(player);
        const hitId = pointerTouchButton(player);
        refreshButtonColors(hitId);
        if (!hitId) {
            menuPointerTouchArmed = true;
        } else if (openedThisFrame) {
            // Opening while already overlapping a button should not click it.
            menuPointerTouchArmed = false;
        } else if (menuPointerTouchArmed && unityNow() >= menuPointerCooldownUntil) {
            menuPointerTouchArmed = false;
            menuPointerCooldownUntil = unityNow() + MENU_POINTER_DEBOUNCE_SECONDS;
            activateButton(hitId);
        }
    }

    function isGun(value: any): boolean {
        if (!isLive(value)) return false;
        try {
            return HitscanWeapon.isAssignableFrom(value.class) || ProjectileWeapon.isAssignableFrom(value.class);
        } catch (_) { return false; }
    }

    function sameObject(left: any, right: any): boolean {
        if (!isLive(left) || !isLive(right)) return false;
        try { return left.handle.equals(right.handle); } catch (_) { return false; }
    }

    function componentIsActiveInScene(component: any): boolean {
        if (!isUnityObjectAlive(component)) return false;
        try {
            const object = component.method("get_gameObject", 0).invoke();
            if (!isUnityObjectAlive(object) || !object.method("get_activeInHierarchy", 0).invoke()) return false;
            return !!object.method("get_scene", 0).invoke().method("IsValid", 0).invoke();
        } catch (_) { return false; }
    }

    function controllerUsesMainCamera(player: any): boolean {
        if (!componentIsActiveInScene(player)) return false;
        try {
            const candidate = player.field("playerCamera").value;
            const main = Camera.method("get_main", 0).invoke();
            if (!isUnityObjectAlive(candidate)) return false;
            if (!isUnityObjectAlive(main)) {
                try {
                    return componentIsActiveInScene(candidate) &&
                        !!candidate.method("get_enabled", 0).invoke();
                } catch (_) { return false; }
            }
            if (sameObject(candidate, main)) return true;
            return sameObject(getTransform(candidate), getTransform(main));
        } catch (_) { return false; }
    }

    function resetSceneCaches(): void {
        pendingTeleportRepeats = [];
        pendingNukeGrenades = 0;
        nukeStalledFrames = 0;
        restoreLongArms();
        restoreSpeedBoost();
        restoreInvisibility();
        clearPlatforms();
        clearVisuals();
        resetVfxGunSceneState();
        destroyMenu();
        cachedClipboardWeapon = null;
        cachedGrenadePrefab = null;
        cachedGrenadePrefabVariant = -1;
        cachedProjectileWeaponTemplate = null;
        grenadePrefabRetryAt = -1000.0;
        projectileWeaponTemplateRetryAt = -1000.0;
        lastVisualScanFrame = -1000;
        lastMatchModeScanFrame = -1000;
        cachedMatchModeActive = false;
        chamScanCursor = 0;
        focusCleanupPending = false;
        menuWasOpen = false;
    }

    function applicationAllowsMenuTick(): boolean {
        localControllerFocusPoll++;
        if (localControllerFocusPoll % APPLICATION_FOCUS_POLL_CALLS !== 0) {
            return true;
        }
        try {
            cachedApplicationFocused = !!Application.method("get_isFocused", 0).invoke();
        } catch (_) {
            // If this Unity build does not expose the property, preserve the
            // normal in-game path instead of disabling the menu.
            cachedApplicationFocused = true;
        }
        if (!cachedApplicationFocused) {
            focusLostFrameCount += APPLICATION_FOCUS_POLL_CALLS;
            if (focusLostFrameCount >= APPLICATION_FOCUS_GRACE_FRAMES && isUnityObjectAlive(activeLocalPlayer)) {
                focusCleanupPending = true;
                focusLostFrameCount = 0;
                if (menuWasOpen) destroyMenu();
                return false;
            }
            return true;
        }
        if (focusCleanupPending) {
            focusCleanupPending = false;
            resetSceneCaches();
        }
        focusLostFrameCount = 0;
        return true;
    }

    function shouldTickPlayerController(player: any): boolean {
        const now = Date.now();
        const appAllowed = applicationAllowsMenuTick();
        if (isLive(activeLocalPlayer)) {
            if (!sameObject(player, activeLocalPlayer)) {
                // Multiplayer invokes this hook for every remote controller.
                // The cached local handle makes those callbacks a pointer-only
                // fast path instead of repeating Unity scene/camera calls.
                if (now - lastLocalControllerTickAt < LOCAL_CONTROLLER_STALE_MS) return false;
            } else {
                lastLocalControllerTickAt = now;
                if (!appAllowed) {
                    focusCleanupPending = true;
                    return false;
                }
                if (now - lastLocalControllerValidationAt < LOCAL_CONTROLLER_RECHECK_MS) return true;
                if (controllerUsesMainCamera(player)) {
                    lastLocalControllerValidationAt = now;
                    return true;
                }
                resetSceneCaches();
                activeLocalPlayer = null;
            }
        }
        if (!appAllowed) {
            if (isUnityObjectAlive(activeLocalPlayer)) focusCleanupPending = true;
            return false;
        }
        if (!controllerUsesMainCamera(player)) return false;
        if (isLive(activeLocalPlayer) && !sameObject(player, activeLocalPlayer)) resetSceneCaches();
        activeLocalPlayer = player;
        lastLocalControllerTickAt = now;
        lastLocalControllerValidationAt = now;
        return true;
    }

    function getLocalHeldWeapons(): any[] {
        if (!isLive(activeLocalPlayer)) return [];
        const result: any[] = [];
        for (const methodName of ["GetPreferredHandWeapon", "GetOffHandWeapon"]) {
            try {
                const weapon = activeLocalPlayer.method(methodName, 0).invoke();
                if (!isLive(weapon)) continue;
                if (!result.some(existing => sameObject(existing, weapon))) result.push(weapon);
            } catch (_) {}
        }
        return result;
    }

    function isLocalWeapon(weapon: any): boolean {
        if (!isLive(weapon)) return false;
        return getLocalHeldWeapons().some(localWeapon => sameObject(localWeapon, weapon));
    }

    function isLocalAmmoStorage(storage: any): boolean {
        if (!isLive(storage)) return false;
        try { return isLocalWeapon(storage.field("_weapon").value); }
        catch (_) { return false; }
    }

    function weaponSettings(weapon: any): any {
        try {
            const settings = weapon.field("weaponSettings").value;
            return isLive(settings) ? settings : null;
        } catch (_) { return null; }
    }

    function topUpWeapon(weapon: any): void {
        if (!isLive(weapon)) return;
        try {
            const settings = weaponSettings(weapon);
            if (!settings) return;
            const magazine = Math.max(0, Math.trunc(Number(settings.field("MagazineCapacity").value)));
            const total = Math.max(magazine, Math.trunc(Number(settings.field("TotalAmmo").value)));
            if (magazine > 0) weapon.field("<currentAmmo>k__BackingField").value = magazine;
            if (total > 0) weapon.field("<currentTotalAmmo>k__BackingField").value = total;
        } catch (_) {}
    }

    function findObjects(klass: any): any {
        if (!klass) return null;
        try {
            return UnityObject.method("FindObjectsByType", 2)
                .overload("System.Type", "UnityEngine.FindObjectsSortMode")
                .invoke(klass.type.object, 0);
        }
        catch (_) {
            try {
                return UnityObject.method("FindObjectsOfType", 1)
                    .overload("System.Type")
                    .invoke(klass.type.object);
            }
            catch (_) { return null; }
        }
    }

    function findResourceObjects(klass: any): any {
        if (!klass) return null;
        try {
            return Resources.method("FindObjectsOfTypeAll", 1)
                .overload("System.Type")
                .invoke(klass.type.object);
        } catch (_) { return null; }
    }

    function findSceneObjectsIncludingInactive(klass: any): any {
        if (!klass) return null;
        try {
            return UnityObject.method("FindObjectsByType", 3)
                .overload(
                    "System.Type",
                    "UnityEngine.FindObjectsInactive",
                    "UnityEngine.FindObjectsSortMode",
                )
                .invoke(klass.type.object, 1, 0);
        } catch (_) { return null; }
    }

    function objectArrayValues(objects: any): any[] {
        const values: any[] = [];
        try {
            for (let index = 0; objects && index < objects.length; index++) {
                const value = objects.get(index);
                if (isLive(value)) values.push(value);
            }
        } catch (_) {}
        return values;
    }

    function objectsOfClass(
        klass: any,
        includeInactive: boolean = false,
        includeAssets: boolean = false,
    ): any[] {
        const values = objectArrayValues(findObjects(klass));
        if (includeInactive) {
            for (const value of objectArrayValues(findSceneObjectsIncludingInactive(klass))) {
                if (!values.some(existing => sameObject(existing, value))) values.push(value);
            }
        }
        if (includeAssets) {
            for (const value of objectArrayValues(findResourceObjects(klass))) {
                if (!values.some(existing => sameObject(existing, value))) values.push(value);
            }
        }
        return values;
    }

    function componentGameObject(component: any): any {
        if (!isLive(component)) return null;
        try { return component.method("get_gameObject", 0).invoke(); }
        catch (_) { return null; }
    }

    function findClipboardWeapon(): any {
        const sceneCandidates = objectsOfClass(ClipboardWeapon, true);
        if (sceneCandidates.length > 0) {
            cachedClipboardWeapon = sceneCandidates[0];
            return cachedClipboardWeapon;
        }
        if (isLive(cachedClipboardWeapon)) return cachedClipboardWeapon;
        const resourceCandidates = objectArrayValues(findResourceObjects(ClipboardWeapon));
        cachedClipboardWeapon = resourceCandidates.length > 0 ? resourceCandidates[0] : null;
        return cachedClipboardWeapon;
    }

    function setGodMode(enabled: boolean): boolean {
        const clipboard = findClipboardWeapon();
        if (!isLive(clipboard)) return false;
        try {
            const current = !!clipboard.method("IsGodModeEnabled", 0).invoke();
            if (current !== enabled) clipboard.method("ToggleGodMode", 0).invoke();
            return !!clipboard.method("IsGodModeEnabled", 0).invoke() === enabled;
        } catch (_) { return false; }
    }

    function methodBoolean(value: any, methodNames: string[]): boolean | null {
        for (const methodName of methodNames) {
            try { return !!value.method(methodName, 0).invoke(); }
            catch (_) {}
        }
        return null;
    }

    function networkObjectHasInputAuthority(player: any): boolean {
        const direct = methodBoolean(player, [
            "get_HasInputAuthority",
            "get_IsLocalPlayer",
            "get_IsLocal",
            "get_IsMine",
        ]);
        if (direct !== null) return direct;
        try {
            const networkObject = player.method("get_Object", 0).invoke();
            if (isLive(networkObject)) {
                const authority = methodBoolean(networkObject, ["get_HasInputAuthority"]);
                if (authority !== null) return authority;
            }
        } catch (_) {}
        return false;
    }

    function networkObjectHasStateAuthority(player: any): boolean {
        const direct = methodBoolean(player, [
            "get_HasStateAuthority",
            "get_IsStateAuthority",
        ]);
        if (direct !== null) return direct;
        try {
            const networkObject = player.method("get_Object", 0).invoke();
            if (isLive(networkObject)) {
                const authority = methodBoolean(networkObject, [
                    "get_HasStateAuthority",
                    "get_IsStateAuthority",
                ]);
                if (authority !== null) return authority;
            }
        } catch (_) {}
        return false;
    }

    function invokePlayerTeleportMethod(player: any, position: Vec3): boolean {
        const methodNames = [
            "Teleport",
            "Warp",
            "SetPosition",
            "SetPlayerPosition",
            "SetPlayerTransform",
            "TeleportTo",
            "RPC_TeleportToPosition",
            "RequestTeleport",
            "SetTargetPosition",
            "TeleportPlayerToPosition",
            "SetPlayerPose",
            "RPC_Teleport",
        ];
        const identityRot = identityQuaternion;
        const buildArgs = (types: string[]): any[] => types.map((typeName: string) => {
            if (/UnityEngine\.Vector3/i.test(typeName)) return position;
            if (/UnityEngine\.Quaternion/i.test(typeName)) return identityRot;
            if (/System\.Boolean/i.test(typeName)) return false;
            if (/System\.(Single|Int\d*)/i.test(typeName)) return 0;
            return 0;
        });
        const callIfVector3 = (method: any): boolean => {
            try {
                const typeNames = (method.parameterTypes || []).map((type: any) => String(type?.name || ""));
                const hasVector3 = typeNames.some((typeName: string) => /UnityEngine\.Vector3/i.test(typeName));
                if (!hasVector3 || method.parameterCount <= 0 || method.parameterCount > 4) return false;
                const args = buildArgs(typeNames);
                method.invoke(...args);
                return true;
            } catch (_) { return false; }
        };
        for (const name of methodNames) {
            try {
                const methods = player.methods || [];
                for (const method of methods) {
                    if (method.name !== name || method.virtualAddress.isNull()) continue;
                    if (callIfVector3(method)) return true;
                }
            } catch (_) {}
            try {
                const method = player.method(name, 1);
                if (callIfVector3(method)) return true;
            } catch (_) {}
        }
        return false;
    }

    function closestNetworkPlayerToLocal(players: any[]): any {
        if (!isLive(activeLocalPlayer)) return null;
        let localPosition: any = null;
        try { localPosition = getTransform(activeLocalPlayer).method("get_position", 0).invoke(); }
        catch (_) { return null; }
        const lx = Number(localPosition.field("x").value);
        const ly = Number(localPosition.field("y").value);
        const lz = Number(localPosition.field("z").value);
        let closest: any = null;
        let closestDistance = Number.POSITIVE_INFINITY;
        for (const player of players) {
            try {
                const position = getTransform(player).method("get_position", 0).invoke();
                const dx = Number(position.field("x").value) - lx;
                const dy = Number(position.field("y").value) - ly;
                const dz = Number(position.field("z").value) - lz;
                const distance = dx * dx + dy * dy + dz * dz;
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closest = player;
                }
            } catch (_) {}
        }
        return closest;
    }

    function findLocalNetworkPlayer(players: any[]): any {
        for (const glider of objectsOfClass(PlayerGlider)) {
            try {
                if (!sameObject(glider.field("player").value, activeLocalPlayer)) continue;
                const networkPlayer = glider.field("networkPlayer").value;
                if (isLive(networkPlayer)) return networkPlayer;
            } catch (_) {}
        }
        for (const player of players) {
            if (networkObjectHasInputAuthority(player)) return player;
        }
        return closestNetworkPlayerToLocal(players);
    }

    function isLocalNetworkTarget(player: any, resolvedLocalPlayer: any): boolean {
        return sameObject(player, resolvedLocalPlayer) || networkObjectHasInputAuthority(player);
    }

    function localBringPosition(): Vec3 | null {
        if (!isLive(activeLocalPlayer)) return null;
        try {
            const position = getTransform(activeLocalPlayer).method("get_position", 0).invoke();
            return [
                Number(position.field("x").value),
                Number(position.field("y").value),
                Number(position.field("z").value),
            ];
        } catch (_) { return null; }
    }

    function invokeNetworkTransformTeleport(networkTransform: any, position: Vec3): boolean {
        if (!isUnityObjectAlive(networkTransform)) return false;
        const methods = [
            ["set_RBPosition", "set_rigidbodyPosition"],
            ["set_RBState", "set_rigidbodyState"],
            ["set_Position", "set_PositionRaw"],
            ["set_RBPosition", "set_PositionAndRotation", "set_position"],
            ["Teleport", "set_TeleportPosition", "Warp"],
            ["set_SimulatedPosition", "set_simulatedPosition"],
        ];
        for (const group of methods) {
            for (const name of group) {
                try {
                    const method = networkTransform.method(name, 1);
                    method.invoke(position);
                    return true;
                } catch (_) {}
                try {
                    const method = networkTransform.method(name, 2);
                    method.invoke(position, true);
                    return true;
                } catch (_) {}
            }
        }
        return false;
    }

    function invokeAuthoritativeTeleport(player: any, receiver: any, position: Vec3): boolean {
        if (!isLive(player)) return false;
        if (AdminTeleport && isLive(receiver)) {
            try {
                const networkObject = player.method("get_Object", 0).invoke();
                if (isLive(networkObject)) {
                    const inputAuthority = networkObject.method("get_InputAuthority", 0).invoke();
                    receiver.method("RPC_TeleportPlayerToPosition", 2)
                        .overload("Fusion.PlayerRef", "UnityEngine.Vector3")
                        .invoke(inputAuthority, position);
                    return true;
                }
            } catch (_) {}
        }

        // The admin RPC component is not always present. Fallback through a
        // network-aware transform only when we own state authority;
        // setting Transform directly without authority can cause an immediate rollback.
        const hasStateAuthority = networkObjectHasStateAuthority(player);
        if (hasStateAuthority) {
            try {
                const networkTransform = NetworkPlayer.field("networkTransform").bind(player).value;
                if (isUnityObjectAlive(networkTransform) && invokeNetworkTransformTeleport(networkTransform, position)) {
                    return true;
                }
            } catch (_) {}
        }
        // Some builds expose direct player teleport methods that can still
        // apply on host/authority roles while RPC helpers vary by version.
        if (hasStateAuthority && invokePlayerTeleportMethod(player, position)) return true;
        if (!hasStateAuthority) return invokePlayerTeleportMethod(player, position);
        return false;
    }

    function updatePendingTeleportRepeats(): void {
        if (pendingTeleportRepeats.length === 0) return;
        const remaining: typeof pendingTeleportRepeats = [];
        for (const pending of pendingTeleportRepeats) {
            if (frameNumber < pending.nextFrame) {
                remaining.push(pending);
                continue;
            }
            if (invokeAuthoritativeTeleport(pending.player, pending.receiver, pending.position)) {
                pending.repeatsLeft--;
            } else {
                pending.repeatsLeft = Math.max(0, pending.repeatsLeft - 1);
            }
            if (pending.repeatsLeft > 0 && isLive(pending.player)) {
                pending.nextFrame = frameNumber + TP_ALL_REPEAT_INTERVAL_FRAMES;
                remaining.push(pending);
            }
        }
        pendingTeleportRepeats = remaining;
    }

    function teleportAllToLocalPlayer(): void {
        pendingTeleportRepeats = [];
        const players = objectsOfClass(NetworkPlayer);
        const localPlayer = findLocalNetworkPlayer(players);
        const origin = localBringPosition();
        if (!origin) {
            console.error("[" + MENU_NAME + "] TP All failed: local player position is unavailable.");
            return;
        }
        let rpc: any = null;
        try {
            rpc = AdminTeleport?.method("RPC_TeleportPlayerToPosition", 2)
                .overload("Fusion.PlayerRef", "UnityEngine.Vector3");
        } catch (_) {}
        // A spawned scene receiver is required for the instance RPC. If none is
        // live, invokeAuthoritativeTeleport can still use an owned Fusion body.
        const receiver = rpc ? (objectsOfClass(AdminTeleport, true)[0] ?? null) : null;
        let teleported = 0;
        let skippedNoAuthority = 0;
        let remoteIndex = 0;
        for (const player of players) {
            if (isLocalNetworkTarget(player, localPlayer)) continue;
            const angle = remoteIndex * 2.399963229728653;
            const radius = 1.1 + Math.floor(remoteIndex / 8) * 0.45;
            const destination: Vec3 = [
                origin[0] + Math.cos(angle) * radius,
                origin[1],
                origin[2] + Math.sin(angle) * radius,
            ];
            if (invokeAuthoritativeTeleport(player, receiver, destination)) {
                teleported++;
                // Repeat several times to survive short replication rollbacks.
                pendingTeleportRepeats.push({
                    player,
                    receiver,
                    position: destination,
                    nextFrame: frameNumber + TP_ALL_REPEAT_INTERVAL_FRAMES,
                    repeatsLeft: TP_ALL_REPEATS,
                });
            } else skippedNoAuthority++;
            remoteIndex++;
        }
        const summary = "TP All moved " + teleported + " player(s); skipped " +
            skippedNoAuthority + " without admin/state authority.";
        if (teleported > 0) console.log("[" + MENU_NAME + "] " + summary);
        else console.error("[" + MENU_NAME + "] " + summary);
    }

    function killAllPlayers(): void {
        const clipboard = findClipboardWeapon();
        if (!isLive(clipboard)) {
            console.error("[" + MENU_NAME + "] Kill All failed: the admin clipboard service is unavailable.");
            return;
        }
        const players = objectsOfClass(NetworkPlayer);
        const localPlayer = findLocalNetworkPlayer(players);
        let previousSelection: any = null;
        try { previousSelection = clipboard.method("get_SelectedPlayer", 0).invoke(); } catch (_) {}
        let killed = 0;
        try {
            for (const player of players) {
                if (isLocalNetworkTarget(player, localPlayer)) continue;
                try {
                    let valid = true;
                    try { valid = !!ClipboardWeapon.method("IsPlayerValid", 1).invoke(player); } catch (_) {}
                    if (!valid) continue;
                    clipboard.method("SetSelectedPlayer", 1).invoke(player);
                    clipboard.method("KillSelectedPlayer", 0).invoke();
                    killed++;
                } catch (_) {}
            }
        } finally {
            if (isLive(previousSelection)) {
                try { clipboard.method("SetSelectedPlayer", 1).invoke(previousSelection); } catch (_) {}
            }
        }
        console.log("[" + MENU_NAME + "] Kill All targeted " + killed + " player(s).");
    }

    function grenadeNameLooksUsable(name: string): boolean {
        const lower = name.toLowerCase();
        return lower.includes("grenade") && !lower.includes("smoke") &&
            !lower.includes("visual") && !lower.includes("vfx");
    }

    function findGrenadePrefab(): any {
        if (cachedGrenadePrefabVariant === selectedGrenadeVariant &&
            isUnityObjectAlive(cachedGrenadePrefab)) return cachedGrenadePrefab;
        cachedGrenadePrefab = null;
        const now = unityNow();
        if (now < grenadePrefabRetryAt) return null;
        const variant = getCurrentGrenadeVariant();
        for (const resourcePath of variant.resourcePaths) {
            try {
                const loaded = Resources.method("Load", 2)
                    .overload("System.String", "System.Type")
                    .invoke(Il2Cpp.string(resourcePath), GameObject.type.object);
                if (isUnityObjectAlive(loaded)) {
                    cachedGrenadePrefab = loaded;
                    cachedGrenadePrefabVariant = selectedGrenadeVariant;
                    return cachedGrenadePrefab;
                }
            } catch (_) {}
        }
        if (variant.name === "Regular") {
            for (const launcher of objectsOfClass(GrenadeLauncher, true, false)) {
                try {
                    const prefab = launcher.method("GetProjectilePrefab", 0).invoke();
                    if (isUnityObjectAlive(prefab)) {
                        cachedGrenadePrefab = prefab;
                        cachedGrenadePrefabVariant = selectedGrenadeVariant;
                        return cachedGrenadePrefab;
                    }
                } catch (_) {}
            }
        }
        for (const className of variant.classNames) {
            const projectileClass = resolveClass(className);
            if (!projectileClass) continue;
            for (const projectile of objectArrayValues(findResourceObjects(projectileClass))) {
                const object = componentGameObject(projectile);
                if (!isUnityObjectAlive(object)) continue;
                const name = objectName(object).toLowerCase();
                if (variant.name === "Regular" ? !name.includes("frag") : name.includes("frag")) {
                    cachedGrenadePrefab = object;
                    cachedGrenadePrefabVariant = selectedGrenadeVariant;
                    return cachedGrenadePrefab;
                }
            }
        }
        if (variant.name === "Frag") {
            for (const launcher of objectsOfClass(GrenadeLauncher, true, false)) {
                try {
                    const prefab = launcher.method("GetProjectilePrefab", 0).invoke();
                    if (isUnityObjectAlive(prefab) && objectName(prefab).toLowerCase().includes("frag")) {
                        cachedGrenadePrefab = prefab;
                        cachedGrenadePrefabVariant = selectedGrenadeVariant;
                        return cachedGrenadePrefab;
                    }
                } catch (_) {}
            }
        }
        grenadePrefabRetryAt = now + GRENADE_PREFAB_RETRY_SECONDS;
        return null;
    }

    function launchGrenadeThroughHeldWeapon(prefab: any, direction: Vec3): boolean {
        for (const weapon of getLocalHeldWeapons()) {
            try {
                if (!ProjectileWeapon.isAssignableFrom(weapon.class)) continue;
                const overrideField = weapon.field("overrideProjectilePrefab");
                const previousOverride = overrideField.value;
                try {
                    weapon.method("SetOverrideProjectilePrefab", 1).invoke(prefab);
                    weapon.method("LaunchProjectile", 2).invoke(direction, [0, 0, 0]);
                    return true;
                } finally {
                    try { weapon.method("SetOverrideProjectilePrefab", 1).invoke(previousOverride); }
                    catch (_) {}
                }
            } catch (_) {}
        }
        return false;
    }

    function findProjectileWeaponTemplate(): any {
        if (isUnityObjectAlive(cachedProjectileWeaponTemplate)) return cachedProjectileWeaponTemplate;
        cachedProjectileWeaponTemplate = null;
        const now = unityNow();
        if (now < projectileWeaponTemplateRetryAt) return null;
        const candidates = objectArrayValues(findResourceObjects(ProjectileWeapon));
        const preferred = candidates.find(candidate => {
            const name = objectName(componentGameObject(candidate)).toLowerCase();
            return name.includes("basketballlauncher") || name.includes("basketball launcher");
        });
        cachedProjectileWeaponTemplate = preferred ?? candidates.find(candidate =>
            isLive(componentGameObject(candidate))) ?? null;
        if (!isUnityObjectAlive(cachedProjectileWeaponTemplate)) {
            projectileWeaponTemplateRetryAt = now + GRENADE_TEMPLATE_RETRY_SECONDS;
        } else {
            projectileWeaponTemplateRetryAt = -1000.0;
        }
        return cachedProjectileWeaponTemplate;
    }

    function launchGrenadeThroughTemplate(prefab: any, hand: any, direction: Vec3): boolean {
        const template = findProjectileWeaponTemplate();
        const templateObject = componentGameObject(template);
        if (!isLive(templateObject)) return false;
        let clone: any = null;
        try {
            const position = hand.method("get_position", 0).invoke();
            const rotation = hand.method("get_rotation", 0).invoke();
            clone = UnityObject.method("Instantiate", 3)
                .overload("UnityEngine.Object", "UnityEngine.Vector3", "UnityEngine.Quaternion")
                .invoke(templateObject, position, rotation);
            if (!isLive(clone)) return false;
            try { clone.method("SetActive", 1).invoke(true); } catch (_) {}
            let weapon = getComponent(clone, ProjectileWeapon);
            if (!isLive(weapon)) {
                try {
                    weapon = clone.method("GetComponentInChildren", 2)
                        .overload("System.Type", "System.Boolean")
                        .invoke(ProjectileWeapon.type.object, true);
                } catch (_) {}
            }
            if (!isLive(weapon)) return false;
            weapon.method("SetOverrideProjectilePrefab", 1).invoke(prefab);
            weapon.method("LaunchProjectile", 2).invoke(direction, [0, 0, 0]);
            return true;
        } catch (_) { return false; }
        finally { if (isLive(clone)) destroy(clone); }
    }

    function launchGrenadeFromHand(
        player: any,
        bypassCooldown: boolean = false,
        bulkLaunch: boolean = false,
    ): boolean {
        const now = unityNow();
        if (!bypassCooldown && now - lastGrenadeLaunchTime < GRENADE_LAUNCH_COOLDOWN) return false;
        // Reserve the slot before any expensive lookup or spawn attempt so a
        // missing prefab/exception cannot retry on every LateUpdate while held.
        lastGrenadeLaunchTime = now;
        const hand = getRightHandTransform(player);
        const prefab = findGrenadePrefab();
        if (!isUnityObjectAlive(hand) || !isUnityObjectAlive(prefab)) {
            if (now - lastGrenadePrefabWarningTime >= 1.0) {
                lastGrenadePrefabWarningTime = now;
                console.error("[" + MENU_NAME + "] Grenade Launcher is waiting for the " +
                    getCurrentGrenadeVariant().name + " prefab.");
            }
            return false;
        }
        try {
            const forwardValue = hand.method("get_forward", 0).invoke();
            const direction: Vec3 = [
                Number(forwardValue.field("x").value),
                Number(forwardValue.field("y").value),
                Number(forwardValue.field("z").value),
            ];
            if (launchGrenadeThroughHeldWeapon(prefab, direction)) {
                return true;
            }
            // A temporary weapon clone is acceptable for one normal shot but
            // wasteful for a 50-projectile burst. Nuke falls through to the
            // direct prefab path when no held projectile weapon is available.
            if (!bulkLaunch && launchGrenadeThroughTemplate(prefab, hand, direction)) {
                return true;
            }
            const handPosition = hand.method("get_position", 0).invoke();
            const position: Vec3 = [
                Number(handPosition.field("x").value) + direction[0] * 0.22,
                Number(handPosition.field("y").value) + direction[1] * 0.22,
                Number(handPosition.field("z").value) + direction[2] * 0.22,
            ];
            const rotation = hand.method("get_rotation", 0).invoke();
            const grenade = UnityObject.method("Instantiate", 3)
                .overload("UnityEngine.Object", "UnityEngine.Vector3", "UnityEngine.Quaternion")
                .invoke(prefab, position, rotation);
            if (!isLive(grenade)) throw new Error("Unity returned no grenade instance");
            try { grenade.method("SetActive", 1).invoke(true); } catch (_) {}
            let rigidbody = getComponent(grenade, Rigidbody);
            if (!isLive(rigidbody)) {
                try {
                    rigidbody = grenade.method("GetComponentInChildren", 2)
                        .overload("System.Type", "System.Boolean")
                        .invoke(Rigidbody.type.object, true);
                } catch (_) {}
            }
            if (isLive(rigidbody)) {
                const velocity: Vec3 = [
                    direction[0] * GRENADE_LAUNCH_SPEED,
                    direction[1] * GRENADE_LAUNCH_SPEED,
                    direction[2] * GRENADE_LAUNCH_SPEED,
                ];
                try { rigidbody.method("set_linearVelocity", 1).invoke(velocity); }
                catch (_) {
                    try { rigidbody.method("set_velocity", 1).invoke(velocity); }
                    catch (_) { rigidbody.method("AddForce", 2).invoke(velocity, 2); }
                }
            }
            // Raw fallback projectiles do not always have the launcher's normal
            // cleanup path. Bound their lifetime so held rapid fire cannot leak
            // physics objects for the rest of the scene.
            try { UnityObject.method("Destroy", 2).invoke(grenade, bulkLaunch ? 5.0 : 8.0); } catch (_) {}
            return true;
        } catch (error) {
            console.error("[" + MENU_NAME + "] Grenade launch failed: " + error);
            return false;
        }
    }

    function queueNuke(): boolean {
        if (pendingNukeGrenades > 0) {
            console.log("[" + MENU_NAME + "] Nuke is already launching.");
            return false;
        }
        if (!isUnityObjectAlive(activeLocalPlayer) ||
            !isUnityObjectAlive(getRightHandTransform(activeLocalPlayer)) ||
            !isUnityObjectAlive(findGrenadePrefab())) {
            console.error("[" + MENU_NAME + "] Nuke failed: the right hand or " +
                getCurrentGrenadeVariant().name + " prefab is unavailable.");
            return false;
        }
        pendingNukeGrenades = NUKE_GRENADE_COUNT;
        nukeStalledFrames = 0;
        console.log("[" + MENU_NAME + "] Nuke queued: " + NUKE_GRENADE_COUNT + " grenades.");
        return true;
    }

    function updateNuke(player: any): void {
        if (pendingNukeGrenades <= 0) return;
        let launchedThisFrame = 0;
        for (let index = 0;
            index < NUKE_GRENADES_PER_FRAME && pendingNukeGrenades > 0;
            index++) {
            if (!launchGrenadeFromHand(player, true, true)) break;
            pendingNukeGrenades--;
            launchedThisFrame++;
        }
        if (launchedThisFrame > 0) nukeStalledFrames = 0;
        else nukeStalledFrames++;

        if (pendingNukeGrenades === 0) {
            console.log("[" + MENU_NAME + "] Nuke finished: exactly " + NUKE_GRENADE_COUNT + " grenades launched.");
        } else if (nukeStalledFrames >= NUKE_MAX_STALLED_FRAMES) {
            const launched = NUKE_GRENADE_COUNT - pendingNukeGrenades;
            pendingNukeGrenades = 0;
            nukeStalledFrames = 0;
            console.error(
                "[" + MENU_NAME + "] Nuke stopped safely after " + launched +
                " successful launches because grenade spawning remained unavailable."
            );
        }
    }

    interface UnlockInvokeStats {
        found: number;
        invoked: number;
        failed: number;
    }

    function invokeForObjects(
        klass: any,
        methodNames: string[],
        includeInactive: boolean = false,
    ): UnlockInvokeStats {
        const stats: UnlockInvokeStats = { found: 0, invoked: 0, failed: 0 };
        if (!klass) return stats;
        const objects = objectsOfClass(klass, includeInactive);
        stats.found = objects.length;
        for (const object of objects) {
            for (const methodName of methodNames) {
                try {
                    object.method(methodName, 0).invoke();
                    stats.invoked++;
                } catch (_) { stats.failed++; }
            }
        }
        return stats;
    }

    function unlockFieldKey(object: any, fieldName: string): string {
        try { return object.handle.toString() + ":" + fieldName; }
        catch (_) { return objectName(object) + ":" + fieldName; }
    }

    function setRememberedUnlockField(object: any, fieldName: string, value: any): void {
        if (!isLive(object)) return;
        try {
            const field = object.field(fieldName);
            const key = unlockFieldKey(object, fieldName);
            const current = field.value;
            try {
                const underlying = current.field("value__");
                if (!unlockViewFieldState.has(key)) {
                    unlockViewFieldState.set(key, {
                        object,
                        fieldName,
                        value: Number(underlying.value),
                        isEnum: true,
                    });
                }
                underlying.value = Number(value);
                return;
            } catch (_) {}
            if (!unlockViewFieldState.has(key)) {
                unlockViewFieldState.set(key, { object, fieldName, value: current, isEnum: false });
            }
            field.value = value;
        } catch (_) {}
    }

    function restoreUnlockViewFields(): void {
        for (const saved of unlockViewFieldState.values()) {
            if (!isLive(saved.object)) continue;
            try {
                const field = saved.object.field(saved.fieldName);
                if (saved.isEnum) field.value.field("value__").value = saved.value;
                else field.value = saved.value;
            } catch (_) {}
        }
        unlockViewFieldState.clear();
    }

    function setLoadoutShowAll(panel: any): void {
        if (!mods.unlockAll || !UIPanelLoadout || !isLive(panel)) return;
        const showModeFields: string[] = [];
        try {
            for (const field of UIPanelLoadout.fields) {
                const typeName = String(field.type.name);
                if (typeName.endsWith("WeaponsShowMode")) showModeFields.push(String(field.name));
            }
        } catch (_) {}
        for (const fieldName of showModeFields) {
            // WeaponsShowMode.ShowAll is the zero enum value.
            setRememberedUnlockField(panel, fieldName, 0);
        }
    }

    function setSkinPanelShowLocked(panel: any): void {
        if (!mods.unlockAll || !isLive(panel)) return;
        // Nonzero is this build's "show locked" presentation mode. The
        // individual ownership hooks then make those rows selectable.
        setRememberedUnlockField(panel, "lockedAppearanceVisibility", 1);
    }

    function setUnlockViewFilters(): void {
        if (!mods.unlockAll) {
            restoreUnlockViewFields();
            return;
        }
        for (const panel of objectsOfClass(UIPanelWeaponSkins, true)) {
            setSkinPanelShowLocked(panel);
        }
        for (const panel of objectsOfClass(UIPanelLoadout, true)) {
            setLoadoutShowAll(panel);
        }
    }

    function unlockStats(label: string, stats: UnlockInvokeStats): string {
        return label + " found=" + stats.found +
            " calls=" + stats.invoked + " failed=" + stats.failed;
    }

    function refreshUnlockViews(verbose: boolean = false): void {
        setUnlockViewFilters();
        const loadouts = invokeForObjects(UIPanelLoadout, ["LoadWeapons"], true);
        const weaponRows = invokeForObjects(UITouchWeaponSelection, ["ResetLockStatus"], true);
        const skins = invokeForObjects(UIPanelWeaponSkins, [
            "RefreshHiddenAppearanceRows",
            "RefreshUnlocks",
        ], true);
        const cosmetics = invokeForObjects(
            PlayerCosmeticsLockerPanel,
            ["RefreshActiveSlots"],
            true,
        );
        const tech = invokeForObjects(UITechNode, ["SetInitialLockState"], true);
        const techWraps = invokeForObjects(TechNodeWeaponWrap, ["RefreshSecondaryLock"], true);
        if (verbose) {
            console.log(
                "[" + MENU_NAME + "] Unlock refresh: " + [
                    unlockStats("loadouts", loadouts),
                    unlockStats("weapon rows", weaponRows),
                    unlockStats("skins", skins),
                    unlockStats("cosmetics", cosmetics),
                    unlockStats("tech", tech),
                    unlockStats("tech wraps", techWraps),
                ].join("; ")
            );
        }
    }

    function sweepAmmo(): void {
        for (const weapon of getLocalHeldWeapons()) topUpWeapon(weapon);
        try {
            const storages = findObjects(AmmoStorage);
            for (let index = 0; storages && index < storages.length; index++) {
                try {
                    const storage = storages.get(index);
                    if (isLocalAmmoStorage(storage)) storage.method("SetMaxAmmo", 0).invoke();
                } catch (_) {}
            }
        } catch (_) {}
    }

    function resetFireRateTimers(): boolean {
        try {
            const manager = CooldownManager.method("get_Instance", 0).invoke();
            if (!isLive(manager)) return false;
            manager.method("ResetAllTimers", 0).invoke();
            return true;
        } catch (_) { return false; }
    }

    function applyTriggerFly(player: any): void {
        if (!mods.triggerFly || isLive(menuRoot) || !(leftTrigger || leftTriggerAmount > 0.5)) return;
        try {
            const rigidbody = player.field("Rigidbody").value;
            if (!isLive(rigidbody)) return;
            const hand = getLeftHandTransform(player);
            const directionSource = isLive(hand) ? hand : getCameraTransform(player);
            if (!isLive(directionSource)) return;
            const forward = directionSource.method("get_forward", 0).invoke();
            const velocity: Vec3 = [
                Number(forward.field("x").value) * TRIGGER_FLY_SPEED,
                Number(forward.field("y").value) * TRIGGER_FLY_SPEED,
                Number(forward.field("z").value) * TRIGGER_FLY_SPEED,
            ];
            try { rigidbody.method("set_linearVelocity", 1).invoke(velocity); }
            catch (_) {
                try { rigidbody.method("set_velocity", 1).invoke(velocity); }
                catch (_) {
                    const current = rigidbody.method("get_linearVelocity", 0).invoke();
                    rigidbody.method("AddForce", 2).invoke([
                        velocity[0] - Number(current.field("x").value),
                        velocity[1] - Number(current.field("y").value),
                        velocity[2] - Number(current.field("z").value),
                    ], 2);
                }
            }
        } catch (_) {}
    }

    function createHandPlatform(name: string, color: Color4): any {
        let object: any = null;
        let material: any = null;
        try {
            object = GameObject.method("CreatePrimitive", 1).invoke(3);
            setName(object, name);
            const transform = getTransform(object);
            transform.method("set_localScale", 1).invoke(PLATFORM_SCALE);
            transform.method("set_rotation", 1).invoke(identityQuaternion);

            const renderer = getComponent(object, Renderer);
            if (isLive(renderer)) {
                renderer.method("set_enabled", 1).invoke(true);
                material = renderer.method("get_material", 0).invoke();
                if (isLive(material)) {
                    const shader = getMenuSurfaceShader();
                    if (isLive(shader)) material.method("set_shader", 1).invoke(shader);
                    material.method("set_color", 1).invoke(color);
                    try {
                        material.method("SetColor", 2)
                            .overload("System.String", "UnityEngine.Color")
                            .invoke(Il2Cpp.string("_BaseColor"), color);
                    } catch (_) {}
                }
            }

            const collider = getComponent(object, Collider);
            if (isLive(collider)) {
                try { collider.method("set_enabled", 1).invoke(true); } catch (_) {}
                try { collider.method("set_isTrigger", 1).invoke(false); } catch (_) {}
            }
            const body = addComponent(object, Rigidbody);
            if (isLive(body)) {
                try { body.method("set_useGravity", 1).invoke(false); } catch (_) {}
                try { body.method("set_isKinematic", 1).invoke(true); } catch (_) {}
                try { body.method("set_detectCollisions", 1).invoke(true); } catch (_) {}
            }
            object.method("SetActive", 1).invoke(false);
            return { object, material, active: false };
        } catch (_) {
            if (isUnityObjectAlive(object)) destroy(object);
            if (isUnityObjectAlive(material)) destroy(material);
            return null;
        }
    }

    function setHandPlatformVisible(state: any, visible: boolean): void {
        if (!state || !isUnityObjectAlive(state.object) || state.active === visible) return;
        try {
            state.object.method("SetActive", 1).invoke(visible);
            state.active = visible;
        } catch (_) {}
    }

    function destroyHandPlatform(state: any): void {
        if (!state) return;
        if (isUnityObjectAlive(state.object)) destroy(state.object);
        if (isUnityObjectAlive(state.material)) destroy(state.material);
    }

    function clearPlatforms(): void {
        destroyHandPlatform(leftHandPlatform);
        destroyHandPlatform(rightHandPlatform);
        leftHandPlatform = null;
        rightHandPlatform = null;
    }

    function updateHandPlatform(player: any, left: boolean, held: boolean): void {
        let state = left ? leftHandPlatform : rightHandPlatform;
        if (!held) {
            setHandPlatformVisible(state, false);
            return;
        }
        // Leave an active platform fixed where the grip was first pressed so
        // it is stable enough to stand on. Releasing the grip returns it to
        // the pool; the next press moves and re-enables the same object.
        if (state && isUnityObjectAlive(state.object) && state.active) return;
        const hand = left ? getLeftHandTransform(player) : getRightHandTransform(player);
        const position = transformPosition(hand);
        if (!position) {
            setHandPlatformVisible(state, false);
            return;
        }
        if (!state || !isUnityObjectAlive(state.object)) {
            destroyHandPlatform(state);
            state = createHandPlatform(
                left ? "AnimalRivalsLeftPlatform" : "AnimalRivalsRightPlatform",
                left ? [0.10, 0.35, 0.95, 0.92] : [0.95, 0.16, 0.12, 0.92],
            );
            if (left) leftHandPlatform = state;
            else rightHandPlatform = state;
        }
        if (!state || !isUnityObjectAlive(state.object)) return;
        try {
            const transform = getTransform(state.object);
            transform.method("set_position", 1).invoke([
                position[0],
                position[1] - PLATFORM_HAND_OFFSET_Y,
                position[2],
            ]);
            transform.method("set_rotation", 1).invoke(identityQuaternion);
            setHandPlatformVisible(state, true);
        } catch (_) {
            setHandPlatformVisible(state, false);
        }
    }

    function updatePlatforms(player: any): void {
        if (!mods.platforms) return;
        updateHandPlatform(player, true, leftGrip);
        updateHandPlatform(player, false, rightGrip);
    }

    function vector3Value(value: any): Vec3 | null {
        try {
            const result: Vec3 = [
                Number(value.field("x").value),
                Number(value.field("y").value),
                Number(value.field("z").value),
            ];
            return result.every(Number.isFinite) ? result : null;
        } catch (_) { return null; }
    }

    function transformPosition(transform: any): Vec3 | null {
        if (!isUnityObjectAlive(transform)) return null;
        try { return vector3Value(transform.method("get_position", 0).invoke()); }
        catch (_) { return null; }
    }

    function squaredDistance(left: Vec3, right: Vec3): number {
        const x = left[0] - right[0];
        const y = left[1] - right[1];
        const z = left[2] - right[2];
        return x * x + y * y + z * z;
    }

    function discoverMovementFieldNames(): string[] {
        if (discoveredMovementBoostFieldNames) return discoveredMovementBoostFieldNames;
        discoveredMovementBoostFieldNames = [];
        try {
            for (const field of GorillaMovement.fields) {
                const name = String(field.name);
                if (/(jump|speed|velocity|arm|length|threshold|movement)/i.test(name)) {
                    discoveredMovementBoostFieldNames.push(name);
                }
            }
        } catch (_) {}
        return discoveredMovementBoostFieldNames;
    }

    function discoverMovementComponentFieldNames(player: any): string[] {
        if (!player || !isLive(player) || !isUnityObjectAlive(player)) return [];
        if (discoveredMovementComponentFieldNames) return discoveredMovementComponentFieldNames;
        discoveredMovementComponentFieldNames = [];
        try {
            for (const field of player.class.fields) {
                const name = String(field.name);
                if (/(movement|gorilla|locomotion|controller)/i.test(name)) {
                    discoveredMovementComponentFieldNames.push(name);
                }
            }
        } catch (_) {}
        return discoveredMovementComponentFieldNames;
    }

    function resolveMovementField(movement: any, names: string[], required: boolean = false): string | null {
        for (const name of names) {
            try {
                const field = GorillaMovement.field(name);
                if (field) return name;
            } catch (_) {}
        }
        const discovered = discoverMovementFieldNames();
        const lowerNames = discovered.map(name => String(name).toLowerCase());
        for (const candidate of names) {
            const lowered = candidate.toLowerCase();
            for (let index = 0; index < lowerNames.length; index++) {
                if (new RegExp(lowered, "i").test(lowerNames[index])) {
                    const field = discovered[index];
                    if (boundGorillaMovementField(movement, field)) return field;
                }
            }
        }
        if (!required) return null;
        for (const discoveredName of discovered) {
            const discoveredField = boundGorillaMovementField(movement, discoveredName);
            if (!discoveredField) continue;
            try {
                const value = Number(discoveredField.value);
                if (Number.isFinite(value)) return discoveredName;
            } catch (_) {}
        }
        return null;
    }

    function setMovementField(
        movement: any,
        names: string[],
        delta: number | null,
        overwriteValue: number | null = null,
    ): boolean {
        if (!isUnityObjectAlive(movement)) return false;
        const resolved = resolveMovementField(movement, names, false);
        if (!resolved) return false;
        const field = boundGorillaMovementField(movement, resolved);
        if (!field) return false;
        const current = Number(field.value);
        if (!Number.isFinite(current)) return false;
        try {
            field.value = overwriteValue !== null ? overwriteValue : current + delta!;
            return true;
        } catch (_) { return false; }
    }

    function collectMovementCandidateFields(movement: any, expressions: RegExp[]): string[] {
        const minAbs = 0;
        return collectMovementCandidateFieldsWithRange(movement, expressions, minAbs, Number.POSITIVE_INFINITY);
    }

    function collectMovementCandidateFieldsWithRange(
        movement: any,
        expressions: RegExp[],
        minAbs: number = 0,
        maxAbs: number = Number.POSITIVE_INFINITY,
    ): string[] {
        const result: string[] = [];
        try {
            const discovered = discoverMovementFieldNames();
            for (const name of discovered) {
                const lowered = String(name).toLowerCase();
                if (!expressions.some(expression => expression.test(lowered))) continue;
                const field = boundGorillaMovementField(movement, name);
                if (!field) continue;
                try {
                    const value = Number(field.value);
                    const magnitude = Math.abs(value);
                    if (!Number.isFinite(value) || magnitude > maxAbs || magnitude < minAbs) continue;
                    if (result.includes(name)) continue;
                    result.push(name);
                } catch (_) {}
            }
        } catch (_) {}
        return result;
    }

    function collectArmLengthFields(movement: any): string[] {
        const names = collectMovementCandidateFieldsWithRange(
            movement,
            [/arm|reach|grab|stretch|length|hook|hand.?length|anchor|pivot|grip/i],
            0.001,
            30.0,
        );
        return names
            .filter((name) => !/(throw|launch|jump|speed|velocity|threshold|multiplier)/i.test(name))
            .slice(0, 12);
    }

    function collectUnstickFields(movement: any): string[] {
        const names = collectMovementCandidateFieldsWithRange(
            movement,
            [/un.?stick|release|unhold|return|detach|retract/i],
            0.001,
            20.0,
        );
        const relaxed = collectMovementCandidateFieldsWithRange(
            movement,
            [/grip|hold|grab/i],
            0.001,
            20.0,
        );
        const combined = names.concat(relaxed).filter((name, index, all) => all.indexOf(name) === index);
        return combined.filter((name) => !/(jump|speed|velocity|threshold|multiplier|throw|launch|distance)/i.test(name));
    }

    function setMovementFieldToValue(movement: any, names: string[], value: number): string | null {
        const resolved = resolveMovementField(movement, names, false);
        if (!resolved) return null;
        const field = boundGorillaMovementField(movement, resolved);
        if (!field) return null;
        try {
            const base = Number(field.value);
            if (!Number.isFinite(base)) return null;
            field.value = value;
            return resolved;
        } catch (_) {
            return null;
        }
    }

    function resolveGorillaMovementComponent(player: any): any {
        try {
            const direct = player.field("ActiveGorillaPlayer").value;
            if (isUnityObjectAlive(direct)) return direct;
        } catch (_) {}
        const fieldNames = [
            "activeGorillaPlayer",
            "gorillaMovement",
            "movement",
            "movementController",
            "activeMovement",
            "gorillaPlayerMovement",
        ];
        for (const fieldName of fieldNames) {
            try {
                const value = player.field(fieldName).value;
                if (isUnityObjectAlive(value) && GorillaMovement && GorillaMovement.isAssignableFrom(value.class)) return value;
            } catch (_) {}
        }
        for (const fieldName of discoverMovementComponentFieldNames(player)) {
            try {
                const value = player.field(fieldName).value;
                if (isUnityObjectAlive(value) && GorillaMovement && GorillaMovement.isAssignableFrom(value.class)) {
                    return value;
                }
            } catch (_) {}
        }
        return null;
    }

    function boundGorillaMovementField(movement: any, name: string): any {
        if (!GorillaMovement || !isLive(movement)) return null;
        try { return GorillaMovement.field(name).bind(movement); }
        catch (_) { return null; }
    }

    function snapshotMovementPower(movement: any): Record<string, number> | null {
        const result: Record<string, number> = {};
        const names = {
            jumpMultiplierLeft: ["jumpMultiplierLeft", "leftJumpMultiplier", "jumpMultLeft"],
            jumpMultiplierRight: ["jumpMultiplierRight", "rightJumpMultiplier", "jumpMultRight"],
            maxJumpSpeedLeft: ["maxJumpSpeedLeft", "leftMaxJumpSpeed", "maxJumpSpeedLeftHand", "leftJumpSpeed"],
            maxJumpSpeedRight: ["maxJumpSpeedRight", "rightMaxJumpSpeed", "maxJumpSpeedRightHand", "rightJumpSpeed"],
            velocityChangeThresholdLeft: [
                "velocityChangeThresholdLeft",
                "leftVelocityChangeThreshold",
            ],
            velocityChangeThresholdRight: [
                "velocityChangeThresholdRight",
                "rightVelocityChangeThreshold",
            ],
        };
        const movementFields = [
            "jumpMultiplierLeft",
            "jumpMultiplierRight",
            "maxJumpSpeedLeft",
            "maxJumpSpeedRight",
            "velocityChangeThresholdLeft",
            "velocityChangeThresholdRight",
        ];
        let captured = 0;
        for (const key of movementFields) {
            const resolved = resolveMovementField(movement, names[key as keyof typeof names], false);
            if (!resolved) continue;
            const field = boundGorillaMovementField(movement, resolved);
            if (!field) continue;
            const value = Number(field.value);
            if (!Number.isFinite(value)) continue;
            result[key] = value;
            captured++;
        }
        if (captured === 0) return null;
        return result;
    }

    function rememberSpeedBoostField(name: string, base: number): void {
        for (const entry of speedBoostTouchedMovementValues) {
            if (entry.name === name) return;
        }
        speedBoostTouchedMovementValues.push({ name, base });
    }

    function applySpeedBoostField(
        movement: any,
        names: string[],
        delta: number,
        absoluteValue?: number | null,
    ): boolean {
        const resolved = resolveMovementField(movement, names, false);
        if (!resolved) return false;
        const field = boundGorillaMovementField(movement, resolved);
        if (!field) return false;
        try {
            const base = Number(field.value);
            if (!Number.isFinite(base)) return false;
            const nextValue = absoluteValue !== null && absoluteValue !== undefined
                ? absoluteValue
                : base + delta;
            if (!Number.isFinite(nextValue)) return false;
            field.value = nextValue;
            rememberSpeedBoostField(resolved, base);
            return true;
        } catch (_) {
            return false;
        }
    }

    function applySpeedBoost(player: any): void {
        if (!mods.speedBoost) return;
        try {
            const movement = resolveGorillaMovementComponent(player);
            if (!isUnityObjectAlive(movement)) return;
            if (!sameObject(speedBoostPlayer, movement)) {
                restoreSpeedBoost();
                const originalMovementValues = snapshotMovementPower(movement);
                speedBoostPlayer = movement;
                speedBoostController = player;
                speedBoostOriginalMovementValues = originalMovementValues;
                try {
                    const rigidbody = player.field("Rigidbody").value;
                    const cap = Number(rigidbody.method("get_maxLinearVelocity", 0).invoke());
                    speedBoostOriginalVelocityCap = Number.isFinite(cap) && cap > 0 ? cap : null;
                } catch (_) { speedBoostOriginalVelocityCap = null; }
                let leftApplied = false;
                let rightApplied = false;
                let anyDirectBoostApplied = false;
                const speedPairs: Array<{ names: string[]; delta: number; absolute: number | null }> = [
                    {
                        names: ["jumpMultiplierLeft", "leftJumpMultiplier", "jumpMultLeft"],
                        delta: SPEED_BOOST_JUMP_MULTIPLIER_DELTA,
                        absolute: null,
                    },
                    {
                        names: ["jumpMultiplierRight", "rightJumpMultiplier", "jumpMultRight"],
                        delta: SPEED_BOOST_JUMP_MULTIPLIER_DELTA,
                        absolute: null,
                    },
                    {
                        names: ["maxJumpSpeedLeft", "leftMaxJumpSpeed", "maxJumpSpeedLeftHand", "leftJumpSpeed"],
                        delta: SPEED_BOOST_MAX_SPEED_DELTA,
                        absolute: null,
                    },
                    {
                        names: ["maxJumpSpeedRight", "rightMaxJumpSpeed", "maxJumpSpeedRightHand", "rightJumpSpeed"],
                        delta: SPEED_BOOST_MAX_SPEED_DELTA,
                        absolute: null,
                    },
                    {
                        names: ["velocityChangeThresholdLeft", "leftVelocityChangeThreshold"],
                        delta: 0,
                        absolute: 0,
                    },
                    {
                        names: ["velocityChangeThresholdRight", "rightVelocityChangeThreshold"],
                        delta: 0,
                        absolute: 0,
                    },
                ];
                const leftHandCandidateNames: string[][] = [
                    ["jumpMultiplierLeft", "leftJumpMultiplier", "jumpMultLeft"],
                    ["maxJumpSpeedLeft", "leftMaxJumpSpeed", "maxJumpSpeedLeftHand", "leftJumpSpeed"],
                    ["velocityChangeThresholdLeft", "leftVelocityChangeThreshold"],
                ];
                const rightHandCandidateNames: string[][] = [
                    ["jumpMultiplierRight", "rightJumpMultiplier", "jumpMultRight"],
                    ["maxJumpSpeedRight", "rightMaxJumpSpeed", "maxJumpSpeedRightHand", "rightJumpSpeed"],
                    ["velocityChangeThresholdRight", "rightVelocityChangeThreshold"],
                ];
                for (const [fieldNames, delta] of [
                    [speedPairs[0].names, speedPairs[0].delta, speedPairs[0].absolute],
                    [speedPairs[2].names, speedPairs[2].delta, speedPairs[2].absolute],
                    [speedPairs[4].names, speedPairs[4].delta, speedPairs[4].absolute],
                    [speedPairs[1].names, speedPairs[1].delta, speedPairs[1].absolute],
                    [speedPairs[3].names, speedPairs[3].delta, speedPairs[3].absolute],
                    [speedPairs[5].names, speedPairs[5].delta, speedPairs[5].absolute],
                ] as Array<[string[], number, number | null]>) {
                    const targetName = setMovementFieldToValue(movement, fieldNames, ((): number => {
                        if (fieldNames[0]?.includes("Left") || fieldNames[0] === "jumpMultiplierLeft" || /Left/i.test(fieldNames[0])) {
                            const baseName = resolveMovementField(movement, fieldNames, false);
                            const base = baseName && speedBoostOriginalMovementValues?.[baseName];
                            if (Number.isFinite(Number(base))) {
                                return Number(base) + delta;
                            }
                        }
                        const baseName = resolveMovementField(movement, fieldNames, false);
                        const base = baseName && speedBoostOriginalMovementValues?.[baseName];
                        if (Number.isFinite(Number(base))) {
                            const value = Number(base) + delta;
                            return value === 0 || Number.isFinite(delta) ? value : 0;
                        }
                        return NaN;
                    })());
                    if (targetName !== null) {
                        const baseField = resolveMovementField(movement, [targetName], false);
                        if (!baseField) continue;
                        const field = boundGorillaMovementField(movement, baseField);
                        if (field) {
                            try {
                                const base = Number(field.value);
                                if (Number.isFinite(base)) {
                                    rememberSpeedBoostField(baseField, base);
                                    anyDirectBoostApplied = true;
                                }
                            } catch (_) {}
                        }
                    }
                }
                const forceLeftApply = leftHandCandidateNames.some(names => applySpeedBoostField(movement, names, 0) && (leftApplied = true));
                if (forceLeftApply) anyDirectBoostApplied = true;
                const forceRightApply = rightHandCandidateNames.some(names => applySpeedBoostField(movement, names, 0) && (rightApplied = true));
                if (forceRightApply) anyDirectBoostApplied = true;
                const leftCandidates = [speedPairs[0], speedPairs[2], speedPairs[4]];
                const rightCandidates = [speedPairs[1], speedPairs[3], speedPairs[5]];
                if (leftCandidates.every((item) => !setMovementFieldToValue(movement, item.names, item.absolute === null ? 0 : item.absolute) ? true : false)) {
                    // keep default
                }
                if (rightCandidates.every((item) => !setMovementFieldToValue(movement, item.names, item.absolute === null ? 0 : item.absolute) ? true : false)) {
                    // keep default
                }
                // ModifyMovementPower is additive. Apply each hand exactly once
                // for this locomotion instance so the boost cannot accumulate.
                try {
                    movement.method("ModifyMovementPower", 4).invoke(
                        0.0,
                        SPEED_BOOST_JUMP_MULTIPLIER_DELTA,
                        SPEED_BOOST_MAX_SPEED_DELTA,
                        true,
                    );
                    speedBoostLeftApplied = true;
                } catch (_) {}
                try {
                    movement.method("ModifyMovementPower", 4).invoke(
                        0.0,
                        SPEED_BOOST_JUMP_MULTIPLIER_DELTA,
                        SPEED_BOOST_MAX_SPEED_DELTA,
                        false,
                    );
                    speedBoostRightApplied = true;
                } catch (_) {}
                if (!anyDirectBoostApplied && !speedBoostLeftApplied) {
                    const leftJumpSet = setMovementField(
                        movement,
                        ["jumpMultiplierLeft", "leftJumpMultiplier", "jumpMultLeft"],
                        SPEED_BOOST_JUMP_MULTIPLIER_DELTA,
                    );
                    const leftSpeedSet = setMovementField(
                        movement,
                        ["maxJumpSpeedLeft", "leftMaxJumpSpeed", "maxJumpSpeedLeftHand", "leftJumpSpeed"],
                        SPEED_BOOST_MAX_SPEED_DELTA,
                    );
                    const leftThresholdSet = setMovementField(
                        movement,
                        ["velocityChangeThresholdLeft", "leftVelocityChangeThreshold"],
                        0,
                    );
                    if (leftJumpSet && leftSpeedSet && leftThresholdSet) speedBoostLeftApplied = true;
                }
                if (!anyDirectBoostApplied && !speedBoostRightApplied) {
                    const rightJumpSet = setMovementField(
                        movement,
                        ["jumpMultiplierRight", "rightJumpMultiplier", "jumpMultRight"],
                        SPEED_BOOST_JUMP_MULTIPLIER_DELTA,
                    );
                    const rightSpeedSet = setMovementField(
                        movement,
                        ["maxJumpSpeedRight", "rightMaxJumpSpeed", "maxJumpSpeedRightHand", "rightJumpSpeed"],
                        SPEED_BOOST_MAX_SPEED_DELTA,
                    );
                    const rightThresholdSet = setMovementField(
                        movement,
                        ["velocityChangeThresholdRight", "rightVelocityChangeThreshold"],
                        0,
                    );
                    if (rightJumpSet && rightSpeedSet && rightThresholdSet) speedBoostRightApplied = true;
                }
                try { player.method("SetVelocityCap", 1).invoke(SPEED_BOOST_VELOCITY_CAP); }
                catch (_) {}
                if (!anyDirectBoostApplied) {
                    speedBoostTouchedMovementValues = [];
                    try {
                        for (const [fieldNames, delta] of [
                            [speedPairs[0].names, speedPairs[0].delta],
                            [speedPairs[2].names, speedPairs[2].delta],
                            [speedPairs[4].names, speedPairs[4].delta],
                            [speedPairs[1].names, speedPairs[1].delta],
                            [speedPairs[3].names, speedPairs[3].delta],
                            [speedPairs[5].names, speedPairs[5].delta],
                        ]) {
                            applyMovementFieldIncrements(movement, fieldNames, delta);
                        }
                    } catch (_) {}
                }
                leftApplied = leftCandidates.some((item) => applySpeedBoostField(movement, item.names, item.delta));
                rightApplied = rightCandidates.some((item) => applySpeedBoostField(movement, item.names, item.delta));
                if (leftApplied) speedBoostLeftApplied = true;
                if (rightApplied) speedBoostRightApplied = true;
            }
        } catch (_) {}
    }

    function restoreSpeedBoost(): void {
        const canRestoreExactMovement = isUnityObjectAlive(speedBoostPlayer) &&
            speedBoostOriginalMovementValues !== null;
        if (!canRestoreExactMovement && isUnityObjectAlive(speedBoostPlayer)) {
            if (speedBoostLeftApplied) {
                try {
                    speedBoostPlayer.method("ModifyMovementPower", 4).invoke(
                        0.0,
                        -SPEED_BOOST_JUMP_MULTIPLIER_DELTA,
                        -SPEED_BOOST_MAX_SPEED_DELTA,
                        true,
                    );
                } catch (_) {}
            }
            if (speedBoostRightApplied) {
                try {
                    speedBoostPlayer.method("ModifyMovementPower", 4).invoke(
                        0.0,
                        -SPEED_BOOST_JUMP_MULTIPLIER_DELTA,
                        -SPEED_BOOST_MAX_SPEED_DELTA,
                        false,
                    );
                } catch (_) {}
            }
        }
        try {
            const manager = MovementManager ? MovementManager.field("Instance").value : null;
            if (isUnityObjectAlive(manager)) {
                manager.method("ApplyActiveMovementModifiers", 0).invoke();
            }
        } catch (_) {}
        // Write the captured values after the manager refresh. That refresh can
        // rebuild active modifiers; the final state must still match the exact
        // six movement fields present when Speed Boost was enabled.
        if (canRestoreExactMovement && speedBoostOriginalMovementValues) {
            for (const [name, value] of Object.entries(speedBoostOriginalMovementValues)) {
                const field = boundGorillaMovementField(speedBoostPlayer, name);
                if (!field) continue;
                try { field.value = value; } catch (_) {}
            }
            try { speedBoostPlayer.method("InvokeIfMovePowerChanged", 0).invoke(); }
            catch (_) {}
        }
        if (isUnityObjectAlive(speedBoostController) && speedBoostOriginalVelocityCap !== null) {
            try {
                speedBoostController.method("SetVelocityCap", 1).invoke(speedBoostOriginalVelocityCap);
            } catch (_) {}
        }
        for (const entry of speedBoostTouchedMovementValues) {
            if (!isUnityObjectAlive(speedBoostPlayer)) continue;
            const field = boundGorillaMovementField(speedBoostPlayer, entry.name);
            if (!field) continue;
            try { field.value = entry.base; } catch (_) {}
        }
        speedBoostPlayer = null;
        speedBoostController = null;
        speedBoostOriginalVelocityCap = null;
        speedBoostOriginalMovementValues = null;
        speedBoostTouchedMovementValues = [];
        speedBoostLeftApplied = false;
        speedBoostRightApplied = false;
    }

    function applyLongArms(player: any): void {
        if (!mods.longArms) return;
        try {
            const movement = resolveGorillaMovementComponent(player);
            if (!isUnityObjectAlive(movement) || !GorillaMovement) return;
            if (!longArmState || !sameObject(longArmState.movement, movement)) {
                restoreLongArms();
                const maxLengthBaseline: { [name: string]: number } = {};
                for (const name of collectArmLengthFields(movement)) {
                    const field = boundGorillaMovementField(movement, name);
                    const baseline = field ? Number(field.value) : Number.NaN;
                    if (Number.isFinite(baseline) && baseline > 0) {
                        maxLengthBaseline[name] = baseline;
                    }
                }
                if (Object.keys(maxLengthBaseline).length === 0) return;
                const unstickFields: { [name: string]: number } = {};
                for (const name of collectUnstickFields(movement)) {
                    if (maxLengthBaseline[name]) continue;
                    const field = boundGorillaMovementField(movement, name);
                    const baseline = field ? Number(field.value) : Number.NaN;
                    if (Number.isFinite(baseline) && baseline > 0) {
                        unstickFields[name] = baseline;
                    }
                }
                longArmState = {
                    movement,
                    maxLengthFields: maxLengthBaseline,
                    unstickFields,
                };
            }
            for (const [name, baseline] of Object.entries(longArmState.maxLengthFields)) {
                try {
                    const field = boundGorillaMovementField(movement, name);
                    if (!field) continue;
                    const target = Math.min(8.0, baseline * LONG_ARMS_MULTIPLIER);
                    if (Math.abs(Number(field.value) - target) > 0.001) field.value = target;
                } catch (_) {}
            }
            for (const [name, baseline] of Object.entries(longArmState.unstickFields)) {
                try {
                    const field = boundGorillaMovementField(movement, name);
                    if (!field) continue;
                    const target = Math.min(7.5, baseline * LONG_ARMS_MULTIPLIER);
                    if (Math.abs(Number(field.value) - target) > 0.001) {
                        field.value = target;
                    }
                } catch (_) {}
            }
        } catch (_) {}
    }

    function restoreLongArms(): void {
        if (longArmState && isUnityObjectAlive(longArmState.movement)) {
            for (const [name, baseline] of Object.entries(longArmState.maxLengthFields)) {
                try {
                    const field = boundGorillaMovementField(longArmState.movement, name);
                    if (field) field.value = baseline;
                } catch (_) {}
            }
            for (const [name, baseline] of Object.entries(longArmState.unstickFields)) {
                try {
                    const field = boundGorillaMovementField(longArmState.movement, name);
                    if (field) field.value = baseline;
                } catch (_) {}
            }
        }
        longArmState = null;
    }

    function visualObjectKey(value: any): string {
        try { return String(value.handle); } catch (_) { return ""; }
    }

    function getVisualShader(): any {
        if (isUnityObjectAlive(visualShader)) return visualShader;
        visualShader = null;
        for (const name of [
            "UI/Default",
            "Universal Render Pipeline/Unlit",
            "Universal Render Pipeline/Unlit/Simple",
            "Universal Render Pipeline/Unlit/Simple Lit",
            "Universal Render Pipeline/Lit",
            "Unlit/Transparent",
            "Unlit/Texture",
            "Unlit/Color",
            "Particles/Standard Unlit",
            "Sprites/Default",
            "Legacy Shaders/Particles/Alpha Blended",
            "Hidden/Internal-Colored",
        ]) {
            try {
                const shader = Shader.method("Find", 1).invoke(Il2Cpp.string(name));
                if (isUnityObjectAlive(shader) &&
                    (() => { try { return !!shader.method("get_isSupported", 0).invoke(); } catch (_) { return true; } })()) {
                    visualShader = shader;
                    return shader;
                }
            } catch (_) {}
        }
        return null;
    }

    function setMaterialFloat(material: any, name: string, value: number): void {
        try {
            material.method("SetFloat", 2)
                .overload("System.String", "System.Single")
                .invoke(Il2Cpp.string(name), value);
        } catch (_) {}
        try {
            material.method("SetInt", 2)
                .overload("System.String", "System.Int32")
                .invoke(Il2Cpp.string(name), Math.trunc(value));
        } catch (_) {}
    }

    function colorVisualMaterial(material: any, color: Color4): void {
        if (!isUnityObjectAlive(material)) return;
        try { material.method("set_color", 1).invoke(color); } catch (_) {}
        for (const name of ["_Color", "_BaseColor"]) {
            try {
                material.method("SetColor", 2)
                    .overload("System.String", "UnityEngine.Color")
                    .invoke(Il2Cpp.string(name), color);
            } catch (_) {}
        }
    }

    function configureThroughWallMaterial(material: any, color: Color4): void {
        if (!isUnityObjectAlive(material)) return;
        const shader = getVisualShader();
        if (isUnityObjectAlive(shader)) {
            try { material.method("set_shader", 1).invoke(shader); } catch (_) {}
        }
        colorVisualMaterial(material, color);
        setMaterialFloat(material, "_ZTest", 8);
        setMaterialFloat(material, "unity_GUIZTestMode", 8);
        setMaterialFloat(material, "_ZWrite", 0);
        setMaterialFloat(material, "_Cull", 0);
        try { material.method("set_renderQueue", 1).invoke(5000); } catch (_) {}
    }

    function visualColorKey(color: Color4): string {
        if (color[1] > 0.8 && color[0] < 0.5) return "green";
        if (color[0] > 0.8 && color[1] < 0.5) return "red";
        return "white";
    }

    function getVisualMaterial(color: Color4): any {
        const key = visualColorKey(color);
        const cached = visualMaterials.get(key);
        if (isUnityObjectAlive(cached)) return cached;
        visualMaterials.delete(key);
        const shader = getVisualShader();
        if (!isUnityObjectAlive(shader)) return null;
        try {
            const material = Material.alloc();
            material.method(".ctor", 1)
                .overload("UnityEngine.Shader")
                .invoke(shader);
            configureThroughWallMaterial(material, color);
            visualMaterials.set(key, material);
            return material;
        } catch (_) { return null; }
    }

    function getVisualHpMaterial(): any {
        if (isUnityObjectAlive(visualHpMaterial)) return visualHpMaterial;
        visualHpMaterial = null;
        try {
            const font = getFont();
            if (!isUnityObjectAlive(font)) return null;
            const fontMaterial = font.method("get_material", 0).invoke();
            if (!isUnityObjectAlive(fontMaterial)) return null;
            const material = Material.alloc();
            material.method(".ctor", 1)
                .overload("UnityEngine.Material")
                .invoke(fontMaterial);
            // Keep the font shader/atlas, but draw the label after opaque world
            // geometry so the HP remains readable through walls.
            setMaterialFloat(material, "_ZTest", 8);
            setMaterialFloat(material, "unity_GUIZTestMode", 8);
            setMaterialFloat(material, "_ZWrite", 0);
            setMaterialFloat(material, "_Cull", 0);
            try { material.method("set_renderQueue", 1).invoke(5000); } catch (_) {}
            visualHpMaterial = material;
            return material;
        } catch (_) { return null; }
    }

    function clearTracers(): void {
        for (const target of visualTargets.values()) {
            if (isUnityObjectAlive(target.tracer)) destroy(target.tracer);
            target.tracer = null;
            target.tracerRenderer = null;
            target.tracerColorKey = "";
        }
    }

    function clearTargetHpLabel(target: any): void {
        if (isUnityObjectAlive(target.hpObject)) destroy(target.hpObject);
        target.hpObject = null;
        target.hpText = null;
        target.hpRenderer = null;
        target.hpLabel = "";
        target.hpColorKey = "";
    }

    function clearHpLabels(): void {
        for (const target of visualTargets.values()) clearTargetHpLabel(target);
    }

    function restoreTargetChams(target: any): void {
        for (const entry of target.chamRenderers || []) {
            if (!isUnityObjectAlive(entry.renderer)) continue;
            if (entry.originalMaterials) {
                try { entry.renderer.method("set_sharedMaterials", 1).invoke(entry.originalMaterials); }
                catch (_) {}
            } else if (isUnityObjectAlive(entry.originalMaterial)) {
                try { entry.renderer.method("set_sharedMaterial", 1).invoke(entry.originalMaterial); }
                catch (_) {}
            }
        }
        target.chamRenderers = [];
        target.chamColorKey = "";
        target.lastChamScanFrame = -1000;
    }

    function restoreChams(): void {
        for (const target of visualTargets.values()) restoreTargetChams(target);
    }

    function clearVisuals(): void {
        clearTracers();
        clearHpLabels();
        restoreChams();
        if (isUnityObjectAlive(visualRoot)) destroy(visualRoot);
        for (const material of visualMaterials.values()) {
            if (isUnityObjectAlive(material)) destroy(material);
        }
        if (isUnityObjectAlive(visualHpMaterial)) destroy(visualHpMaterial);
        visualRoot = null;
        visualTargets.clear();
        visualMaterials.clear();
        visualHpMaterial = null;
        visualShader = null;
        lastVisualScanFrame = -1000;
        chamScanCursor = 0;
        lastMatchModeScanFrame = -1000;
        cachedMatchModeActive = false;
        focusCleanupPending = false;
    }

    function teamKeyFromValue(value: any, depth: number = 0): string | null {
        if (value == null || depth > 2) return null;
        if (typeof value === "number" || typeof value === "bigint") {
            const number = Number(value);
            return Number.isFinite(number) && number >= 0 && number < 256
                ? "n:" + Math.trunc(number)
                : null;
        }
        if (typeof value === "string") {
            const normalized = value.trim();
            return normalized ? "s:" + normalized.toLowerCase() : null;
        }
        try {
            const enumValue = value.field("value__").value;
            const key = teamKeyFromValue(enumValue, depth + 1);
            if (key) return key;
        } catch (_) {}
        for (const name of ["get_TeamNumber", "get_TeamId", "get_TeamID", "get_Id", "get_ID", "get_Index", "get_Value"]) {
            try {
                const key = teamKeyFromValue(value.method(name, 0).invoke(), depth + 1);
                if (key) return key;
            } catch (_) {}
        }
        for (const name of ["_TeamNumber", "TeamNumber", "teamNumber", "TeamId", "teamId", "Id", "id", "Index", "index"]) {
            try {
                const key = teamKeyFromValue(value.field(name).value, depth + 1);
                if (key) return key;
            } catch (_) {}
        }
        try {
            const className = String(value.class?.fullName || value.class?.name || "");
            if (/(team|side)/i.test(className) && value.handle) return "o:" + String(value.handle);
        } catch (_) {}
        return null;
    }

    function readTeamId(player: any): string | null {
        const methods = [
            "get_TeamNumber", "get_Team", "get_TeamId", "get_TeamID", "get_TeamIndex",
            "get_PlayerTeam", "get_CurrentTeam", "get_TeamNumber", "get_Side",
        ];
        for (const name of methods) {
            try {
                const key = teamKeyFromValue(player.method(name, 0).invoke());
                if (key) return key;
            } catch (_) {}
        }
        const fields = [
            "_TeamNumber", "TeamNumber", "teamNumber", "_teamNumber",
            "Team", "team", "_team", "TeamId", "teamId", "_teamId", "TeamID", "teamID",
            "TeamIndex", "teamIndex", "PlayerTeam", "playerTeam", "CurrentTeam", "currentTeam",
            "Side", "side", "<Team>k__BackingField", "<TeamId>k__BackingField",
        ];
        for (const name of fields) {
            try {
                const key = teamKeyFromValue(player.field(name).value);
                if (key) return key;
            } catch (_) {}
        }
        if (discoveredTeamGetterNames === null || discoveredTeamFieldNames === null) {
            discoveredTeamGetterNames = [];
            discoveredTeamFieldNames = [];
            try {
                for (const method of player.class.methods) {
                    const name = String(method.name);
                    if (method.parameterCount === 0 && /^get_/.test(name) && /(team|side)/i.test(name)) {
                        discoveredTeamGetterNames.push(name);
                    }
                }
                for (const field of player.class.fields) {
                    const name = String(field.name);
                    if (/(team|side)/i.test(name)) discoveredTeamFieldNames.push(name);
                }
            } catch (_) {}
        }
        for (const name of discoveredTeamGetterNames) {
            try {
                const method = player.method(name, 0);
                const returnName = String(method.returnType?.name || "");
                if (!/(team|side|string|byte|int|enum)/i.test(returnName)) continue;
                const key = teamKeyFromValue(method.invoke());
                if (key) return key;
            } catch (_) {}
        }
        for (const name of discoveredTeamFieldNames) {
            try {
                const key = teamKeyFromValue(player.field(name).value);
                if (key) return key;
            } catch (_) {}
        }
        return null;
    }

    function visualColor(teamMatch: boolean, localTeam: string | null, targetTeam: string | null): Color4 {
        if (!teamMatch) return [1, 1, 1, 0.88];
        if (localTeam !== null && targetTeam !== null && targetTeam === localTeam) {
            return [0.10, 1.0, 0.20, 0.88];
        }
        // In match mode without team labels, treat unknown/neutral players
        // as opponents so visual feedback is still useful in combat.
        return [1.0, 0.08, 0.08, 0.88];
    }

    function concreteMatchModeIsActive(): boolean {
        if (frameNumber - lastMatchModeScanFrame < 60) return cachedMatchModeActive;
        lastMatchModeScanFrame = frameNumber;
        cachedMatchModeActive = false;
        const playersForMatchCheck = objectsOfClass(NetworkPlayer);
        if (playersForMatchCheck.length >= 2) {
            const local = findLocalNetworkPlayer(playersForMatchCheck);
            if (isUnityObjectAlive(local) && isUnityObjectAlive(local)) {
                const localTeam = readTeamId(local);
                let hasRemoteTeam = false;
                let hasKnownRival = false;
                let remoteCount = 0;
                for (const player of playersForMatchCheck) {
                    if (!isUnityObjectAlive(player) || sameObject(player, local)) continue;
                    remoteCount++;
                    const remoteTeam = readTeamId(player);
                    if (remoteTeam !== null) {
                        hasRemoteTeam = true;
                        if (localTeam !== null && remoteTeam !== localTeam) {
                            hasKnownRival = true;
                            break;
                        }
                    }
                }
                if (hasKnownRival || (remoteCount > 0 && localTeam === null && hasRemoteTeam)) {
                    cachedMatchModeActive = true;
                    return true;
                }
            }
        }
        if (!cachedMatchModeActive && playersForMatchCheck.length >= 2) {
            const active = playersForMatchCheck.filter(componentIsActiveInScene);
            if (active.length >= 2) {
                cachedMatchModeActive = true;
                return true;
            }
        }
        for (const klass of MatchModeClasses) {
            if (objectsOfClass(klass).some(componentIsActiveInScene)) {
                cachedMatchModeActive = true;
                break;
            }
        }
        return cachedMatchModeActive;
    }

    function ensureVisualRoot(): any {
        if (!isUnityObjectAlive(visualRoot)) visualRoot = createEmpty("AnimalRivalsVisuals");
        return getTransform(visualRoot);
    }

    function ensureTracer(target: any): void {
        if (isUnityObjectAlive(target.tracer) && isUnityObjectAlive(target.tracerRenderer)) return;
        try {
            const object = createEmpty("AnimalRivalsTracer:" + target.key);
            getTransform(object).method("SetParent", 2).invoke(ensureVisualRoot(), false);
            const line = addComponent(object, LineRenderer);
            line.method("set_useWorldSpace", 1).invoke(true);
            line.method("set_positionCount", 1).invoke(2);
            line.method("set_startWidth", 1).invoke(0.008);
            line.method("set_endWidth", 1).invoke(0.008);
            try { line.method("set_numCornerVertices", 1).invoke(2); } catch (_) {}
            try { line.method("set_numCapVertices", 1).invoke(2); } catch (_) {}
            target.tracer = object;
            target.tracerRenderer = line;
            target.tracerColorKey = "";
            applyTracerColor(target);
        } catch (_) {
            target.tracer = null;
            target.tracerRenderer = null;
        }
    }

    function applyTracerColor(target: any): void {
        if (!isUnityObjectAlive(target.tracerRenderer)) return;
        const colorKey = visualColorKey(target.color);
        if (target.tracerColorKey === colorKey) return;
        const material = getVisualMaterial(target.color);
        try { target.tracerRenderer.method("set_startColor", 1).invoke(target.color); } catch (_) {}
        try { target.tracerRenderer.method("set_endColor", 1).invoke(target.color); } catch (_) {}
        if (isUnityObjectAlive(material)) {
            try { target.tracerRenderer.method("set_sharedMaterial", 1).invoke(material); } catch (_) {}
        }
        target.tracerColorKey = colorKey;
    }

    function hierarchyGameObject(value: any): any {
        if (!isUnityObjectAlive(value)) return null;
        try {
            if (GameObject.isAssignableFrom(value.class)) return value;
        } catch (_) {}
        return componentGameObject(value);
    }

    function visualHierarchyRoots(player: any): any[] {
        const roots: any[] = [];
        const addRoot = (value: any): void => {
            const object = hierarchyGameObject(value);
            if (!isUnityObjectAlive(object)) return;
            if (!roots.some(existing => sameObject(existing, object))) roots.push(object);
        };
        const explicitFieldNames = [
            "networkRig",
            "playerAvatar",
            "avatar",
            "rig",
            "networkRigTransform",
            "body",
            "playerBody",
            "playerModel",
            "visualRoot",
            "characterRig",
            "xrRig",
            "viewRig",
        ];
        for (const fieldName of explicitFieldNames) {
            try { addRoot(player.field(fieldName).value); } catch (_) {}
        }
        if (discoveredVisualRootFieldNames === null) {
            discoveredVisualRootFieldNames = [];
            try {
                for (const field of player.class.fields) {
                    const name = String(field.name);
                    if (/(network.*rig|player.*rig|avatar|body|visual|character|model)/i.test(name)) {
                        discoveredVisualRootFieldNames.push(name);
                    }
                }
            } catch (_) {}
        }
        for (const fieldName of discoveredVisualRootFieldNames) {
            try { addRoot(player.field(fieldName).value); } catch (_) {}
        }
        return roots;
    }

    function rendererIsChamCandidate(renderer: any): boolean {
        if (!isUnityObjectAlive(renderer)) return false;
        try {
            const object = componentGameObject(renderer);
            const name = String(object.method("get_name", 0).invoke());
            if (/(particle|trail|muzzle|projectile|canvas|text|ui|name.?tag|selection|reticle|pointer|cursor|marker|arrow|capsule|sphere|cube|plane|quad)/i.test(name)) return false;
        } catch (_) {}
        try {
            const gameObject = componentGameObject(renderer);
            const transform = getTransform(gameObject);
            const localScale = vector3Value(transform.method("get_localScale", 0).invoke());
            if (!localScale) return false;
            if (localScale.some(value => !Number.isFinite(value) || value > 12 || value < 0.02)) return false;
        } catch (_) {}
        return true;
    }

    function childRenderers(root: any, klass: any): any[] {
        const values: any[] = [];
        const seen = new Set<string>();
        const add = (sourceClass: any) => {
            if (!isUnityObjectAlive(sourceClass))
                return;
            try {
                const components = root.method("GetComponentsInChildren", 2)
                    .overload("System.Type", "System.Boolean")
                    .invoke(sourceClass.type.object, true);
                for (const component of objectArrayValues(components)) {
                    const key = visualObjectKey(component);
                    if (key && !seen.has(key)) {
                        seen.add(key);
                        values.push(component);
                    }
                }
            } catch (_) {
                try {
                    const components = root.method("GetComponentsInChildren", 1)
                        .overload("System.Type")
                        .invoke(sourceClass.type.object);
                    for (const component of objectArrayValues(components)) {
                        const key = visualObjectKey(component);
                        if (key && !seen.has(key)) {
                            seen.add(key);
                            values.push(component);
                        }
                    }
                } catch (_) { }
            }
        };
        add(klass);
        if (klass !== MeshRenderer && isUnityObjectAlive(MeshRenderer))
            add(MeshRenderer);
        if (klass !== SkinnedMeshRenderer && isUnityObjectAlive(SkinnedMeshRenderer))
            add(SkinnedMeshRenderer);
        if (isUnityObjectAlive(Renderer))
            add(Renderer);
        return values;
    }

    function fallbackSceneRenderersForRoot(root: any): any[] {
        if (!isUnityObjectAlive(root))
            return [];
        const roots = [root];
        const results: any[] = [];
        const seen = new Set<string>();
        for (const renderer of objectsOfClass(Renderer, true)) {
            const object = componentGameObject(renderer);
            if (!isUnityObjectAlive(object))
                continue;
            if (!isUnityObjectAlive(getTransform(object)))
                continue;
            if (!objectIsWithinRoots(object, roots))
                continue;
            const key = visualObjectKey(renderer);
            if (!key || seen.has(key))
                continue;
            seen.add(key);
            results.push(renderer);
        }
        return results;
    }

    function scalarHealthValue(value: any, depth: number = 0): number {
        if (depth > 2 || value == null) return Number.NaN;
        const direct = numericValue(value);
        if (Number.isFinite(direct)) return direct;
        for (const methodName of ["get_Value", "get_CurrentValue", "get_RawValue"]) {
            try {
                const number = scalarHealthValue(value.method(methodName, 0).invoke(), depth + 1);
                if (Number.isFinite(number)) return number;
            } catch (_) {}
        }
        for (const fieldName of ["value", "_value", "Value", "CurrentValue", "_currentValue", "<Value>k__BackingField"]) {
            try {
                const number = scalarHealthValue(value.field(fieldName).value, depth + 1);
                if (Number.isFinite(number)) return number;
            } catch (_) {}
        }
        return Number.NaN;
    }

    function readNetworkPlayerHealth(player: any): number {
        let health: any = null;
        try {
            // This is the pinned build's exact network-player health accessor.
            health = player.method("get_DLAR_Player_Health", 0).invoke();
        } catch (_) { return Number.NaN; }
        if (health == null) return Number.NaN;

        const direct = scalarHealthValue(health);
        if (Number.isFinite(direct)) return direct;
        if (cachedHealthValueAccessor) {
            try {
                const value = cachedHealthValueAccessor.kind === "method"
                    ? health.method(cachedHealthValueAccessor.name, 0).invoke()
                    : health.field(cachedHealthValueAccessor.name).value;
                const number = scalarHealthValue(value);
                if (Number.isFinite(number)) return number;
            } catch (_) {}
            cachedHealthValueAccessor = null;
        }

        for (const name of [
            "get_CurrentHealth", "get_currentHealth", "get_Health", "get_health",
            "get_CurrentHP", "get_HP", "get_CurrentHitPoints", "GetCurrentHealth",
            "GetHealth", "get_HealthValue", "GetHealthValue",
        ]) {
            try {
                const number = scalarHealthValue(health.method(name, 0).invoke());
                if (!Number.isFinite(number)) continue;
                cachedHealthValueAccessor = { kind: "method", name };
                return number;
            } catch (_) {}
        }
        for (const name of [
            "currentHealth", "_currentHealth", "CurrentHealth", "health", "_health", "Health",
            "currentHP", "_currentHP", "CurrentHP", "HP",
            "<CurrentHealth>k__BackingField", "<Health>k__BackingField",
        ]) {
            try {
                const number = scalarHealthValue(health.field(name).value);
                if (!Number.isFinite(number)) continue;
                cachedHealthValueAccessor = { kind: "field", name };
                return number;
            } catch (_) {}
        }
        return Number.NaN;
    }

    function applyHpLabelColor(target: any): void {
        if (!isUnityObjectAlive(target.hpText)) return;
        const colorKey = visualColorKey(target.color);
        if (target.hpColorKey === colorKey) return;
        const color: Color4 = [target.color[0], target.color[1], target.color[2], 1.0];
        try { target.hpText.method("set_color", 1).invoke(color); } catch (_) {}
        target.hpColorKey = colorKey;
    }

    function ensureHpLabel(target: any): void {
        if (isUnityObjectAlive(target.hpObject) && isUnityObjectAlive(target.hpText)) {
            applyHpLabelColor(target);
            return;
        }
        clearTargetHpLabel(target);
        let object: any = null;
        try {
            object = createEmpty("AnimalRivalsHp:" + target.key);
            const transform = getTransform(object);
            transform.method("SetParent", 2).invoke(ensureVisualRoot(), false);
            transform.method("set_localScale", 1).invoke([1, 1, 1]);
            const text = addComponent(object, TextMesh);
            if (!isUnityObjectAlive(text)) throw new Error("TextMesh unavailable");
            const font = getFont();
            if (isUnityObjectAlive(font)) {
                try { text.method("set_font", 1).invoke(font); } catch (_) {}
            }
            text.method("set_text", 1).invoke(Il2Cpp.string("HP: ?"));
            try { text.method("set_fontSize", 1).invoke(64); } catch (_) {}
            try { text.method("set_characterSize", 1).invoke(0.075); } catch (_) {}
            try { text.method("set_fontStyle", 1).invoke(1); } catch (_) {}
            try { text.method("set_anchor", 1).invoke(7); } catch (_) {}
            try { text.method("set_alignment", 1).invoke(1); } catch (_) {}
            try { text.method("set_richText", 1).invoke(false); } catch (_) {}
            const renderer = getComponent(object, Renderer);
            if (isUnityObjectAlive(renderer)) {
                const material = getVisualHpMaterial();
                if (isUnityObjectAlive(material)) {
                    try { renderer.method("set_sharedMaterial", 1).invoke(material); } catch (_) {}
                }
                try { renderer.method("set_sortingOrder", 1).invoke(32767); } catch (_) {}
                try { renderer.method("set_enabled", 1).invoke(true); } catch (_) {}
            }
            target.hpObject = object;
            target.hpText = text;
            target.hpRenderer = renderer;
            target.hpLabel = "";
            target.hpColorKey = "";
            applyHpLabelColor(target);
        } catch (_) {
            if (isUnityObjectAlive(object)) destroy(object);
            clearTargetHpLabel(target);
        }
    }

    function formatHealth(value: number): string {
        if (!Number.isFinite(value)) return "HP: ?";
        const clamped = Math.max(0, Math.min(99999, value));
        return "HP: " + (Math.abs(clamped - Math.round(clamped)) < 0.05
            ? String(Math.round(clamped))
            : clamped.toFixed(1));
    }

    function updateHpLabels(): void {
        let cameraRotation: any = null;
        try {
            const camera = Camera.method("get_main", 0).invoke();
            if (isUnityObjectAlive(camera)) {
                const rawRotation = getTransform(camera).method("get_rotation", 0).invoke();
                cameraRotation = Quaternion.method("op_Multiply", 2).invoke(
                    rawRotation,
                    Quaternion.method("Euler", 3).invoke(0, 180, 0),
                );
            }
        } catch (_) {}

        for (const target of visualTargets.values()) {
            if (!isUnityObjectAlive(target.player)) continue;
            ensureHpLabel(target);
            if (!isUnityObjectAlive(target.hpObject) || !isUnityObjectAlive(target.hpText)) continue;
            if (frameNumber % HP_TEXT_REFRESH_FRAMES === 0 || !target.hpLabel) {
                const label = formatHealth(readNetworkPlayerHealth(target.player));
                if (label !== target.hpLabel) {
                    try { target.hpText.method("set_text", 1).invoke(Il2Cpp.string(label)); } catch (_) {}
                    target.hpLabel = label;
                }
            }
            const head = networkPlayerHeadPosition(target.player);
            if (!head) continue;
            try {
                const transform = getTransform(target.hpObject);
                transform.method("set_position", 1).invoke([head[0], head[1] + 0.26, head[2]]);
                if (cameraRotation) transform.method("set_rotation", 1).invoke(cameraRotation);
            } catch (_) {}
        }
    }

    function localAvatarRoots(player: any): any[] {
        const roots: any[] = [];
        const addRoot = (value: any): void => {
            const object = hierarchyGameObject(value);
            if (!isUnityObjectAlive(object)) return;
            if (!roots.some(existing => sameObject(existing, object))) roots.push(object);
        };
        for (const fieldName of ["networkRig", "playerAvatar", "avatar", "rig", "body", "playerBody"]) {
            try { addRoot(player.field(fieldName).value); } catch (_) {}
        }
        if (discoveredVisualRootFieldNames === null) {
            discoveredVisualRootFieldNames = [];
            try {
                for (const field of player.class.fields) {
                    const name = String(field.name);
                    if (/(rig|avatar|body|model|character)/i.test(name)) {
                        discoveredVisualRootFieldNames.push(name);
                    }
                }
            } catch (_) {}
        }
        if (discoveredVisualRootFieldNames) {
            for (const fieldName of discoveredVisualRootFieldNames) {
                try { addRoot(player.field(fieldName).value); } catch (_) {}
            }
        }
        // Only fall back to the whole network-player hierarchy when the build
        // exposes no separate body/rig reference. Held items are still filtered.
        if (roots.length === 0) addRoot(player);
        return roots;
    }

    function objectIsWithinRoots(object: any, roots: any[]): boolean {
        if (!isUnityObjectAlive(object)) return false;
        let transform: any = null;
        try { transform = getTransform(object); } catch (_) { return false; }
        for (const root of roots) {
            if (!isUnityObjectAlive(root)) continue;
            try {
                if (sameObject(object, root) ||
                    !!transform.method("IsChildOf", 1).invoke(getTransform(root))) return true;
            } catch (_) {}
        }
        return false;
    }

    function rendererHasExcludedOwner(renderer: any, heldRoots: any[]): boolean {
        const object = componentGameObject(renderer);
        if (!isUnityObjectAlive(object)) return true;
        if (objectIsWithinRoots(object, heldRoots)) return true;
        let transform: any = null;
        try { transform = getTransform(object); } catch (_) { return true; }
        for (let depth = 0; depth < 10 && isUnityObjectAlive(transform); depth++) {
            try {
                const owner = transform.method("get_gameObject", 0).invoke();
                const name = String(owner.method("get_name", 0).invoke());
                if (/(weapon|gun|item|holster|muzzle|projectile|grenade|clipboard|animalrivals(menu|visual|vfx|platform))/i.test(name)) {
                    return true;
                }
                transform = transform.method("get_parent", 0).invoke();
            } catch (_) { break; }
        }
        return false;
    }

    function restoreInvisibleRenderer(entry: any): void {
        if (!entry || !isUnityObjectAlive(entry.renderer)) return;
        try { entry.renderer.method("set_enabled", 1).invoke(!!entry.enabled); } catch (_) {}
    }

    function restoreInvisibility(): void {
        for (const entry of invisibleRenderers.values()) restoreInvisibleRenderer(entry);
        invisibleRenderers.clear();
        invisibilityPlayer = null;
        lastInvisibilityScanFrame = -1000;
    }

    function scanInvisibilityRenderers(player: any): void {
        const heldRoots = getLocalHeldWeapons()
            .map(hierarchyGameObject)
            .filter(isUnityObjectAlive);
        const previous = new Map(invisibleRenderers);
        const next = new Map<string, { renderer: any; enabled: boolean }>();
        const seen = new Set<string>();
        for (const root of localAvatarRoots(player)) {
            for (const klass of [SkinnedMeshRenderer, MeshRenderer]) {
                for (const renderer of childRenderers(root, klass)) {
                    const key = visualObjectKey(renderer);
                    if (!key || seen.has(key) || !rendererIsChamCandidate(renderer)) continue;
                    seen.add(key);
                    const oldEntry = previous.get(key);
                    previous.delete(key);
                    if (rendererHasExcludedOwner(renderer, heldRoots)) {
                        if (oldEntry) restoreInvisibleRenderer(oldEntry);
                        continue;
                    }
                    let entry = oldEntry;
                    if (!entry) {
                        let enabled = true;
                        try { enabled = !!renderer.method("get_enabled", 0).invoke(); } catch (_) {}
                        entry = { renderer, enabled };
                    }
                    try { renderer.method("set_enabled", 1).invoke(false); } catch (_) {}
                    next.set(key, entry);
                }
            }
        }
        for (const entry of previous.values()) restoreInvisibleRenderer(entry);
        invisibleRenderers = next;
        invisibilityPlayer = player;
        lastInvisibilityScanFrame = frameNumber;
    }

    function updateInvisibility(): void {
        if (!mods.invisibility) {
            if (invisibleRenderers.size > 0 || isLive(invisibilityPlayer)) restoreInvisibility();
            return;
        }
        if (isUnityObjectAlive(invisibilityPlayer) &&
            frameNumber - lastInvisibilityScanFrame < INVISIBILITY_RESCAN_FRAMES) {
            // Renderer/LOD code may turn a body part back on. Reassert only the
            // already-cached renderers; the hierarchy scan remains throttled.
            if (frameNumber % 15 === 0) {
                for (const entry of invisibleRenderers.values()) {
                    if (!isUnityObjectAlive(entry.renderer)) continue;
                    try { entry.renderer.method("set_enabled", 1).invoke(false); } catch (_) {}
                }
            }
            return;
        }
        const players = objectsOfClass(NetworkPlayer);
        const local = findLocalNetworkPlayer(players);
        if (!isUnityObjectAlive(local)) {
            restoreInvisibility();
            return;
        }
        if (isUnityObjectAlive(invisibilityPlayer) && !sameObject(invisibilityPlayer, local)) {
            restoreInvisibility();
        }
        scanInvisibilityRenderers(local);
    }

    function applyChamMaterial(target: any): void {
        const colorKey = visualColorKey(target.color);
        const material = getVisualMaterial(target.color);
        if (!isUnityObjectAlive(material)) return;
        let allApplied = true;
        for (const entry of target.chamRenderers || []) {
            if (!isUnityObjectAlive(entry.renderer) || entry.colorKey === colorKey) continue;
            let applied = false;
            const originalCount = Number(entry.originalMaterials?.length) || 1;
            try {
                const count = Math.max(1, Math.min(Math.max(originalCount, 1), 64));
                const replacement = Il2Cpp.array(Material, count);
                for (let index = 0; index < count; index++) replacement.set(index, material);
                entry.renderer.method("set_sharedMaterials", 1).invoke(replacement);
                applied = true;
            } catch (_) {}
            if (!applied) {
                try {
                    entry.renderer.method("set_sharedMaterial", 1).invoke(material);
                    applied = true;
                } catch (_) {}
            }
            if (applied) {
                entry.colorKey = colorKey;
            } else allApplied = false;
        }
        target.chamColorKey = allApplied ? colorKey : "";
    }

    function scanTargetChamRenderers(target: any): void {
        const previous = new Map<string, any>();
        for (const entry of target.chamRenderers || []) {
            previous.set(visualObjectKey(entry.renderer), entry);
        }
        const next: any[] = [];
        const seen = new Set<string>();
        const roots = visualHierarchyRoots(target.player);
        for (const root of roots) {
            for (const klass of [SkinnedMeshRenderer, MeshRenderer]) {
                for (const renderer of childRenderers(root, klass)) {
                    if (next.length >= MAX_CHAM_RENDERERS_PER_TARGET) break;
                    const key = visualObjectKey(renderer);
                    if (!key || seen.has(key) || !rendererIsChamCandidate(renderer)) continue;
                    seen.add(key);
                    const existing = previous.get(key);
                    if (existing) {
                        next.push(existing);
                        previous.delete(key);
                        continue;
                    }
                    try {
                        const originalMaterials = renderer.method("get_sharedMaterials", 0).invoke();
                        if (originalMaterials && Number(originalMaterials.length) > 0) {
                            next.push({ renderer, originalMaterials, originalMaterial: null, colorKey: "" });
                            continue;
                        }
                    } catch (_) {}
                    try {
                        const originalMaterial = renderer.method("get_sharedMaterial", 0).invoke();
                        if (isUnityObjectAlive(originalMaterial)) {
                            next.push({ renderer, originalMaterials: null, originalMaterial, colorKey: "" });
                        }
                    } catch (_) {}
                }
            }
            if (next.length >= MAX_CHAM_RENDERERS_PER_TARGET) break;
        }
        if (next.length === 0) {
            for (const root of roots) {
                for (const renderer of fallbackSceneRenderersForRoot(root)) {
                    if (next.length >= MAX_CHAM_RENDERERS_PER_TARGET) break;
                    const key = visualObjectKey(renderer);
                    if (!key || seen.has(key) || !rendererIsChamCandidate(renderer)) continue;
                    seen.add(key);
                    try {
                        const originalMaterials = renderer.method("get_sharedMaterials", 0).invoke();
                        if (originalMaterials && Number(originalMaterials.length) > 0) {
                            next.push({ renderer, originalMaterials, originalMaterial: null, colorKey: "" });
                            continue;
                        }
                    } catch (_) {}
                    try {
                        const originalMaterial = renderer.method("get_sharedMaterial", 0).invoke();
                        if (isUnityObjectAlive(originalMaterial)) {
                            next.push({ renderer, originalMaterials: null, originalMaterial, colorKey: "" });
                        }
                    } catch (_) {}
                }
            }
        }
        for (const entry of previous.values()) {
            if (!isUnityObjectAlive(entry.renderer)) continue;
            if (entry.originalMaterials) {
                try { entry.renderer.method("set_sharedMaterials", 1).invoke(entry.originalMaterials); }
                catch (_) {}
            } else if (isUnityObjectAlive(entry.originalMaterial)) {
                try { entry.renderer.method("set_sharedMaterial", 1).invoke(entry.originalMaterial); }
                catch (_) {}
            }
        }
        target.chamRenderers = next;
        target.lastChamScanFrame = frameNumber;
        applyChamMaterial(target);
    }

    function scanVisualTargets(): void {
        const players = objectsOfClass(NetworkPlayer);
        const local = findLocalNetworkPlayer(players);
        if (!isLive(local)) {
            clearVisuals();
            return;
        }
        const remotes = players
            .filter(player => !isLocalNetworkTarget(player, local) && isUnityObjectAlive(player))
            .slice(0, MAX_VISUAL_TARGETS);
        const localTeam = readTeamId(local);
        const remoteTeams = remotes.map(readTeamId);
        const teamMatch = concreteMatchModeIsActive();
        const activeKeys = new Set<string>();
        remotes.forEach((player, index) => {
            const key = visualObjectKey(player);
            if (!key || !isUnityObjectAlive(player)) return;
            activeKeys.add(key);
            const color = visualColor(teamMatch, localTeam, remoteTeams[index]);
            let target = visualTargets.get(key);
            if (!target) {
                target = {
                    key, player, color, tracer: null, tracerRenderer: null,
                    tracerColorKey: "", chamColorKey: "", chamRenderers: [],
                    hpObject: null, hpText: null, hpRenderer: null,
                    hpLabel: "", hpColorKey: "",
                    lastChamScanFrame: -1000,
                };
                visualTargets.set(key, target);
            }
            target.player = player;
            target.color = color;
            if (mods.tracers) {
                ensureTracer(target);
                applyTracerColor(target);
            }
            if (mods.chams) {
                if (frameNumber - target.lastChamScanFrame >= CHAM_RENDERER_RESCAN_FRAMES) {
                    scanTargetChamRenderers(target);
                } else if (target.chamColorKey !== visualColorKey(color)) {
                    for (const entry of target.chamRenderers || []) entry.colorKey = "";
                    applyChamMaterial(target);
                }
            }
            if (mods.showHp) {
                ensureHpLabel(target);
                applyHpLabelColor(target);
            }
        });

        for (const [key, target] of Array.from(visualTargets.entries())) {
            if (activeKeys.has(key)) continue;
            if (isUnityObjectAlive(target.tracer)) destroy(target.tracer);
            clearTargetHpLabel(target);
            restoreTargetChams(target);
            visualTargets.delete(key);
        }
    }

    function networkPlayerHeadPosition(player: any): Vec3 | null {
        if (ClipboardWeapon) {
            try {
                const value = ClipboardWeapon.method("GetPlayerBodyHeadCenter", 1)
                    .overload("DLARX_NetworkPlayer")
                    .invoke(player);
                const position = vector3Value(value);
                if (position) return position;
            } catch (_) {}
        }
        const fallback = transformPosition(getTransform(player));
        if (fallback) fallback[1] += 0.85;
        return fallback;
    }

    function tracerOriginTransform(player: any): any {
        const rightHand = getRightHandTransform(player);
        if (isUnityObjectAlive(rightHand) && isLikelyHandTransform(rightHand)) return rightHand;
        const leftHand = getLeftHandTransform(player);
        if (isUnityObjectAlive(leftHand) && isLikelyHandTransform(leftHand)) return leftHand;
        const camera = getCameraTransform(player);
        if (isUnityObjectAlive(camera)) return camera;
        return rightHand;
    }

    function updateTracerPositions(player: any): void {
        // Prefer the weapon hand anchor; fallback to left hand/camera if needed.
        const originTransform = tracerOriginTransform(player);
        const origin = transformPosition(originTransform);
        if (!origin) return;
        for (const target of visualTargets.values()) {
            if (!isUnityObjectAlive(target.player) || !isUnityObjectAlive(target.tracerRenderer)) continue;
            const destination = networkPlayerHeadPosition(target.player);
            if (!destination) continue;
            try {
                target.tracerRenderer.method("SetPosition", 2).invoke(0, origin);
                target.tracerRenderer.method("SetPosition", 2).invoke(1, destination);
            } catch (_) {}
        }
    }

    function updateVisuals(player: any): void {
        if (!mods.tracers) clearTracers();
        if (!mods.chams) restoreChams();
        if (!mods.showHp) clearHpLabels();
        if (!mods.tracers && !mods.chams && !mods.showHp) {
            if (visualTargets.size > 0 || isLive(visualRoot)) clearVisuals();
            return;
        }
        if (frameNumber - lastVisualScanFrame >= VISUAL_SCAN_INTERVAL_FRAMES) {
            lastVisualScanFrame = frameNumber;
            scanVisualTargets();
        }
        if (mods.tracers && frameNumber % 3 === 0) updateTracerPositions(player);
        if (mods.showHp && frameNumber % HP_POSITION_REFRESH_FRAMES === 0) updateHpLabels();
    }

    function selectedVfxEntry(): { id: number; name: string } {
        if (vfxCatalog.length === 0) return { id: 0, name: "Unknown" };
        selectedVfxCatalogIndex = (
            (selectedVfxCatalogIndex % vfxCatalog.length) + vfxCatalog.length
        ) % vfxCatalog.length;
        return vfxCatalog[selectedVfxCatalogIndex];
    }

    function cycleSelectedVfx(delta: number): void {
        if (vfxCatalog.length === 0) return;
        selectedVfxCatalogIndex = (
            (selectedVfxCatalogIndex + delta) % vfxCatalog.length + vfxCatalog.length
        ) % vfxCatalog.length;
        vfxGunFailureCount = 0;
        vfxGunDispatchUnavailableUntil = -1000.0;
        vfxGunNextShotAt = unityNow();
        const selected = selectedVfxEntry();
        console.log(
            "[" + MENU_NAME + "] Selected VFX: " + selected.name + " [" + selected.id + "]" +
            (rightGrip ? " (previous)" : " (next)"),
        );
    }

    function vfxCollectionCount(value: any): number {
        if (!value) return 0;
        try {
            const length = Number(value.length);
            if (Number.isFinite(length)) return Math.max(0, Math.min(VFX_ID_MAX_COUNT, Math.trunc(length)));
        } catch (_) {}
        try {
            const count = Number(value.method("get_Count", 0).invoke());
            if (Number.isFinite(count)) return Math.max(0, Math.min(VFX_ID_MAX_COUNT, Math.trunc(count)));
        } catch (_) {}
        return 0;
    }

    function vfxCollectionItem(value: any, index: number): any {
        try { return value.get(index); } catch (_) {}
        try { return value.method("get_Item", 1).invoke(index); } catch (_) {}
        return null;
    }

    function vfxPrefabName(value: any): string {
        let name = objectName(value);
        if (name) return name;
        for (const fieldName of ["prefab", "Prefab", "gameObject", "GameObject", "vfxPrefab", "VfxPrefab"]) {
            try {
                const nested = value.field(fieldName).value;
                name = objectName(nested);
                if (name) return name;
            } catch (_) {}
        }
        return "Unknown";
    }

    function ensureVfxCatalog(player: any): void {
        if (vfxCatalogResolved || !NetworkPlayer || !isUnityObjectAlive(player)) return;
        const now = unityNow();
        if (now < vfxCatalogNextResolveAt) return;
        // Retry only occasionally because some lobby player objects do not yet
        // have their serialized world-VFX array populated.
        vfxCatalogNextResolveAt = now + 10.0;
        try {
            const candidates = (Array.from(NetworkPlayer.fields as any) as any[])
                .filter((field: any) => /vfx|visual.?effect|world.?fx/i.test(String(field.name)))
                .sort((left: any, right: any) => {
                    const score = (field: any): number => {
                        const name = String(field.name);
                        const type = String(field.type?.name ?? "");
                        return (/world.*vfx|vfx.*prefab/i.test(name) ? 20 : 0) +
                            (/prefab/i.test(name) ? 10 : 0) +
                            (/\[\]|List|Array/i.test(type) ? 5 : 0);
                    };
                    return score(right) - score(left);
                });
            for (const field of candidates) {
                let collection: any = null;
                try { collection = player.field(String(field.name)).value; } catch (_) { continue; }
                const count = vfxCollectionCount(collection);
                if (count <= 0) continue;
                const discovered: Array<{ id: number; name: string }> = [];
                for (let id = 0; id < count; id++) {
                    discovered.push({ id, name: vfxPrefabName(vfxCollectionItem(collection, id)) });
                }
                const selectedId = selectedVfxEntry().id;
                vfxCatalog = discovered;
                selectedVfxCatalogIndex = Math.max(0, discovered.findIndex(entry => entry.id === selectedId));
                vfxCatalogResolved = true;
                console.log(
                    "[" + MENU_NAME + "] VFX selector mapped " + discovered.length +
                    " IDs from DLARX_NetworkPlayer." + String(field.name) + ".",
                );
                return;
            }
        } catch (error) {
            if (now >= vfxGunNextErrorLogAt) {
                vfxGunNextErrorLogAt = now + 10.0;
                console.error("[" + MENU_NAME + "] VFX catalog discovery deferred: " + error);
            }
        }
    }

    function getVfxNetworkPlayer(): any {
        if (isUnityObjectAlive(vfxGunRpcPlayer)) return vfxGunRpcPlayer;
        const now = unityNow();
        if (now < vfxGunNextPlayerLookupAt || !NetworkPlayer) return null;
        vfxGunNextPlayerLookupAt = now + 2.0;
        try {
            const local = findLocalNetworkPlayer(objectsOfClass(NetworkPlayer));
            if (isUnityObjectAlive(local)) {
                vfxGunRpcPlayer = local;
                vfxGunBoundRpc = null;
                return local;
            }
        } catch (_) {}
        return null;
    }

    function bindVfxGunRpc(player: any): any {
        if (!isUnityObjectAlive(player)) return null;
        if (vfxGunBoundRpc && sameObject(player, vfxGunRpcPlayer)) return vfxGunBoundRpc;
        vfxGunBoundRpc = null;
        vfxGunRpcPlayer = player;
        try {
            vfxGunBoundRpc = player.method("RPC_PlayWorldVFXProxy", 3).overload(
                "System.Int32",
                "UnityEngine.Vector3",
                "UnityEngine.Quaternion",
            );
        } catch (_) {
            try { vfxGunBoundRpc = player.method("RPC_PlayWorldVFXProxy", 3); } catch (_) {}
        }
        return vfxGunBoundRpc;
    }

    function destroyVfxGunVisuals(): void {
        const rootWasAlive = isUnityObjectAlive(vfxGunRoot);
        if (rootWasAlive) destroy(vfxGunRoot);
        if (!rootWasAlive && isUnityObjectAlive(vfxGunTip)) destroy(vfxGunTip);
        if (!rootWasAlive && isUnityObjectAlive(vfxGunLine)) {
            try { destroy(vfxGunLine.method("get_gameObject", 0).invoke()); } catch (_) {}
        }
        if (isUnityObjectAlive(vfxGunMaterial)) destroy(vfxGunMaterial);
        vfxGunRoot = null;
        vfxGunLine = null;
        vfxGunTip = null;
        vfxGunMaterial = null;
        vfxGunLastStartPosition = null;
        vfxGunLastEndPosition = null;
    }

    function resetVfxGunSceneState(): void {
        destroyVfxGunVisuals();
        vfxGunBoundRpc = null;
        vfxGunRpcPlayer = null;
        vfxGunNextPlayerLookupAt = -1000.0;
        vfxGunVisualRetryAt = -1000.0;
        vfxGunNextShotAt = -1000.0;
        vfxGunDispatchUnavailableUntil = -1000.0;
        vfxGunFailureCount = 0;
        vfxCatalogResolved = false;
        vfxCatalogNextResolveAt = -1000.0;
    }

    function ensureVfxGunVisuals(): boolean {
        if (isUnityObjectAlive(vfxGunRoot) && isUnityObjectAlive(vfxGunLine) &&
            isUnityObjectAlive(vfxGunTip) && isUnityObjectAlive(vfxGunMaterial)) return true;
        const now = unityNow();
        if (now < vfxGunVisualRetryAt) return false;
        destroyVfxGunVisuals();
        try {
            const shader = getVisualShader();
            if (!isUnityObjectAlive(shader)) throw new Error("no unlit shader");
            vfxGunMaterial = Material.alloc();
            vfxGunMaterial.method(".ctor", 1)
                .overload("UnityEngine.Shader")
                .invoke(shader);
            configureThroughWallMaterial(vfxGunMaterial, COLORS.buttonEnabled);

            vfxGunRoot = createEmpty("AnimalRivalsVfxGunPointer");
            const rootTransform = getTransform(vfxGunRoot);
            const lineObject = createEmpty("AnimalRivalsVfxGunBeam");
            getTransform(lineObject).method("SetParent", 2).invoke(rootTransform, false);
            vfxGunLine = addComponent(lineObject, LineRenderer);
            vfxGunLine.method("set_useWorldSpace", 1).invoke(true);
            vfxGunLine.method("set_positionCount", 1).invoke(2);
            vfxGunLine.method("set_startWidth", 1).invoke(0.012);
            vfxGunLine.method("set_endWidth", 1).invoke(0.007);
            try { vfxGunLine.method("set_numCornerVertices", 1).invoke(2); } catch (_) {}
            try { vfxGunLine.method("set_numCapVertices", 1).invoke(2); } catch (_) {}
            try { vfxGunLine.method("set_sharedMaterial", 1).invoke(vfxGunMaterial); }
            catch (_) { vfxGunLine.method("set_material", 1).invoke(vfxGunMaterial); }

            vfxGunTip = GameObject.method("CreatePrimitive", 1).invoke(0);
            setName(vfxGunTip, "AnimalRivalsVfxGunTip");
            const tipTransform = getTransform(vfxGunTip);
            tipTransform.method("SetParent", 2).invoke(rootTransform, false);
            tipTransform.method("set_localScale", 1).invoke([0.045, 0.045, 0.045]);
            try { vfxGunTip.method("set_layer", 1).invoke(2); } catch (_) {}
            const tipCollider = getComponent(vfxGunTip, Collider);
            if (isLive(tipCollider)) destroy(tipCollider);
            const tipRenderer = getComponent(vfxGunTip, Renderer);
            try { tipRenderer.method("set_sharedMaterial", 1).invoke(vfxGunMaterial); }
            catch (_) { tipRenderer.method("set_material", 1).invoke(vfxGunMaterial); }
            return true;
        } catch (error) {
            destroyVfxGunVisuals();
            vfxGunVisualRetryAt = now + 2.0;
            if (now >= vfxGunNextErrorLogAt) {
                vfxGunNextErrorLogAt = now + 10.0;
                console.error("[" + MENU_NAME + "] VFX pointer creation deferred: " + error);
            }
            return false;
        }
    }

    function vfxGunAim(player: any): { start: Vec3; end: Vec3 } | null {
        const hand = getRightHandTransform(player);
        if (!isUnityObjectAlive(hand)) return null;
        const handPosition = transformPosition(hand);
        let direction: Vec3 | null = null;
        try { direction = vector3Value(hand.method("get_forward", 0).invoke()); } catch (_) {}
        if (!handPosition || !direction) return null;
        const magnitude = Math.sqrt(
            direction[0] * direction[0] + direction[1] * direction[1] + direction[2] * direction[2],
        ) || 1.0;
        direction = [direction[0] / magnitude, direction[1] / magnitude, direction[2] / magnitude];
        const start: Vec3 = [
            handPosition[0] + direction[0] * 0.08,
            handPosition[1] + direction[1] * 0.08,
            handPosition[2] + direction[2] * 0.08,
        ];
        let end: Vec3 = [
            start[0] + direction[0] * VFX_GUN_RANGE,
            start[1] + direction[1] * VFX_GUN_RANGE,
            start[2] + direction[2] * VFX_GUN_RANGE,
        ];
        try {
            if (vfxGunRaycast === null) {
                try {
                    vfxGunRaycast = Physics.method("Raycast", 4).overload(
                        "UnityEngine.Vector3",
                        "UnityEngine.Vector3",
                        "UnityEngine.RaycastHit&",
                        "System.Single",
                    );
                    vfxGunRaycastHitBuffer = Il2Cpp.alloc(128);
                    vfxGunRaycastHitRef = Il2Cpp.reference(vfxGunRaycastHitBuffer);
                } catch (_) { vfxGunRaycast = false; }
            }
            if (vfxGunRaycast && vfxGunRaycast.invoke(start, direction, vfxGunRaycastHitBuffer, VFX_GUN_RANGE)) {
                const point = vector3Value(vfxGunRaycastHitRef.method("get_point", 0).invoke());
                if (point) end = point;
            }
        } catch (_) {}
        return { start, end };
    }

    function recordVfxGunFailure(error: any): void {
        const now = unityNow();
        vfxGunFailureCount = Math.min(6, vfxGunFailureCount + 1);
        const delay = Math.min(8.0, 0.25 * Math.pow(2, vfxGunFailureCount - 1));
        vfxGunDispatchUnavailableUntil = now + delay;
        if (now >= vfxGunNextErrorLogAt) {
            vfxGunNextErrorLogAt = now + 8.0;
            console.error(
                "[" + MENU_NAME + "] VFX Gun dispatch paused for " + delay.toFixed(2) + "s: " + error,
            );
        }
    }

    function updateVfxGun(player: any): void {
        if (!mods.vfxGun) {
            if (isLive(vfxGunRoot) || isLive(vfxGunMaterial)) destroyVfxGunVisuals();
            return;
        }

        let aim: { start: Vec3; end: Vec3 } | null = null;
        const refreshPointer = frameNumber % VFX_GUN_POINTER_REFRESH_FRAMES === 0 ||
            !vfxGunLastStartPosition || !vfxGunLastEndPosition;
        if (refreshPointer) {
            aim = vfxGunAim(player);
            if (aim) {
                vfxGunLastStartPosition = aim.start;
                vfxGunLastEndPosition = aim.end;
            }
        }
        if (!aim && vfxGunLastStartPosition && vfxGunLastEndPosition) {
            aim = { start: vfxGunLastStartPosition, end: vfxGunLastEndPosition };
        }
        if (!aim) {
            try { if (isUnityObjectAlive(vfxGunRoot)) vfxGunRoot.method("SetActive", 1).invoke(false); } catch (_) {}
            return;
        }

        if (refreshPointer && ensureVfxGunVisuals()) {
            try { vfxGunRoot.method("SetActive", 1).invoke(true); } catch (_) {}
            try { vfxGunLine.method("SetPosition", 2).invoke(0, aim.start); } catch (_) {}
            try { vfxGunLine.method("SetPosition", 2).invoke(1, aim.end); } catch (_) {}
            try { getTransform(vfxGunTip).method("set_position", 1).invoke(aim.end); } catch (_) {}
            const pointerColor: Color4 = rightTrigger
                ? [0.10, 1.0, 0.20, 1.0]
                : COLORS.buttonEnabled;
            colorVisualMaterial(vfxGunMaterial, pointerColor);
            try { vfxGunLine.method("set_startColor", 1).invoke(pointerColor); } catch (_) {}
            try { vfxGunLine.method("set_endColor", 1).invoke(pointerColor); } catch (_) {}
        }

        if (!rightTrigger || leftSecondary) return;
        const now = unityNow();
        if (now < vfxGunNextShotAt || now < vfxGunDispatchUnavailableUntil) return;
        vfxGunNextShotAt = now + VFX_GUN_FIRE_INTERVAL;
        const networkPlayer = getVfxNetworkPlayer();
        if (!isUnityObjectAlive(networkPlayer)) {
            recordVfxGunFailure("local DLARX_NetworkPlayer is not ready");
            return;
        }
        ensureVfxCatalog(networkPlayer);
        const rpc = bindVfxGunRpc(networkPlayer);
        if (!rpc) {
            recordVfxGunFailure("RPC_PlayWorldVFXProxy is unavailable");
            return;
        }
        try {
            const selected = selectedVfxEntry();
            rpc.invoke(selected.id, aim.end, identityQuaternion);
            vfxGunFailureCount = 0;
            vfxGunDispatchUnavailableUntil = -1000.0;
        } catch (error) {
            recordVfxGunFailure(error);
        }
    }

    function numericValue(value: any): number {
        try {
            let raw = value;
            for (let depth = 0; depth < 4; depth++) {
                if (typeof raw === "number") return raw;
                if (typeof raw === "bigint") return Number(raw);
                if (raw == null) return Number.NaN;
                try {
                    const enumValue = raw.field("value__").value;
                    if (enumValue !== raw) {
                        raw = enumValue;
                        continue;
                    }
                } catch (_) {}
                try {
                    if (raw.value !== undefined && raw.value !== raw) {
                        raw = raw.value;
                        continue;
                    }
                } catch (_) {}
                break;
            }
            const number = Number(raw);
            return Number.isFinite(number) ? number : Number.NaN;
        } catch (_) { return Number.NaN; }
    }

    function unityNow(): number {
        for (const name of ["get_realtimeSinceStartup", "get_unscaledTime", "get_time"]) {
            try {
                const value = Number(Time.method(name, 0).invoke());
                if (Number.isFinite(value)) return value;
            } catch (_) {}
        }
        return frameNumber / 72.0;
    }

    function tryGetRecorderValue(recorder: any, name: string): any {
        try { return recorder.method("get_" + name, 0).invoke(); } catch (_) {}
        try { return recorder.method("get_" + name).invoke(); } catch (_) {}
        try { return recorder.field(name).value; } catch (_) {}
        try { return recorder.field(name.charAt(0).toLowerCase() + name.substring(1)).value; } catch (_) {}
        try { return recorder.field("_" + name.charAt(0).toLowerCase() + name.substring(1)).value; } catch (_) {}
        return undefined;
    }

    function trySetRecorderValue(recorder: any, name: string, value: any): boolean {
        try { recorder.method("set_" + name, 1).invoke(value); return true; } catch (_) {}
        try { recorder.method("set_" + name).invoke(value); return true; } catch (_) {}
        try { recorder.field(name).value = value; return true; } catch (_) {}
        try { recorder.field(name.charAt(0).toLowerCase() + name.substring(1)).value = value; return true; } catch (_) {}
        try { recorder.field("_" + name.charAt(0).toLowerCase() + name.substring(1)).value = value; return true; } catch (_) {}
        return false;
    }

    function getRecorderAliasValue(recorder: any, names: string[]): any {
        for (const name of names) {
            const value = tryGetRecorderValue(recorder, name);
            if (value !== undefined) return value;
        }
        return undefined;
    }

    function setRecorderAliasValue(recorder: any, names: string[], value: any): boolean {
        for (const name of names) {
            if (trySetRecorderValue(recorder, name, value)) return true;
        }
        return false;
    }

    const recorderSourceNames = [
        "SourceType", "sourceType", "_sourceType",
        "InputSourceType", "inputSourceType", "_inputSourceType",
    ];
    const recorderClipNames = ["AudioClip", "audioClip", "_audioClip"];

    function getRecorderSourceType(recorder: any): any {
        return getRecorderAliasValue(recorder, recorderSourceNames);
    }

    function setRecorderSourceType(recorder: any, value: any): boolean {
        return setRecorderAliasValue(recorder, recorderSourceNames, value);
    }

    function getRecorderAudioClip(recorder: any): any {
        return getRecorderAliasValue(recorder, recorderClipNames);
    }

    function setRecorderAudioClip(recorder: any, clip: any): boolean {
        return setRecorderAliasValue(recorder, recorderClipNames, clip);
    }

    function restartVoiceRecorder(recorder: any): boolean {
        try {
            const result = recorder.method("RestartRecording", 0).invoke();
            return result === undefined ? true : !!result;
        } catch (_) {}
        return false;
    }

    function recorderIsUsable(recorder: any): boolean {
        if (!isLive(recorder)) return false;
        try {
            const object = recorder.method("get_gameObject", 0).invoke();
            if (!isLive(object) || !object.method("get_activeInHierarchy", 0).invoke()) return false;
            const scene = object.method("get_scene", 0).invoke();
            return !!scene.method("IsValid", 0).invoke();
        } catch (_) { return false; }
    }

    function recorderScore(recorder: any, gameObject: any, fromCustomVoice: boolean): number {
        let score = fromCustomVoice ? 60 : 0;
        try {
            const rawName = gameObject.method("get_name", 0).invoke();
            const name = String(rawName?.content ?? rawName?.toString?.() ?? rawName);
            if (name === "NetworkRunner") score += 50;
        } catch (_) {}
        try { if (gameObject.method("get_activeInHierarchy", 0).invoke()) score += 40; } catch (_) {}
        try {
            const scene = gameObject.method("get_scene", 0).invoke();
            if (scene.method("IsValid", 0).invoke()) score += 80;
        } catch (_) {}
        try { if (tryGetRecorderValue(recorder, "RecordingEnabled")) score += 20; } catch (_) {}
        try { if (tryGetRecorderValue(recorder, "TransmitEnabled")) score += 15; } catch (_) {}
        try { if (recorder.method("get_IsCurrentlyTransmitting", 0).invoke()) score += 35; } catch (_) {}
        return score;
    }

    function findSoundboardRecorder(): any {
        if (recorderIsUsable(soundboardRecorder)) return soundboardRecorder;
        soundboardRecorder = null;
        if (!PhotonRecorder) return null;
        const candidates: Array<{ recorder: any; score: number }> = [];
        const seen = new Set<string>();
        const addCandidate = (
            recorder: any,
            gameObject: any,
            fromCustomVoice: boolean,
            bonus: number = 0,
        ): void => {
            if (!recorderIsUsable(recorder)) return;
            let key = "";
            try { key = String(recorder.handle); } catch (_) { key = String(recorder); }
            if (!key || seen.has(key)) return;
            seen.add(key);
            candidates.push({ recorder, score: recorderScore(recorder, gameObject, fromCustomVoice) + bonus });
        };

        // The game-owned local handler keeps the Recorder in bmvx and its
        // VoiceConnection in bmvz. This preserves the game's moderation,
        // player/interest-group and push-to-talk routing.
        if (PlayerVoiceHandler) {
            for (const handler of objectsOfClass(PlayerVoiceHandler)) {
                try {
                    if (!componentIsActiveInScene(handler)) continue;
                    try { if (!handler.method("get_enabled", 0).invoke()) continue; } catch (_) {}
                    const recorder = handler.field("bmvx").value;
                    if (!recorderIsUsable(recorder)) continue;
                    try { if (!recorder.method("get_enabled", 0).invoke()) continue; } catch (_) {}
                    const connection = handler.field("bmvz").value;
                    const primary = connection.method("get_PrimaryRecorder", 0).invoke();
                    if (!sameObject(primary, recorder)) continue;
                    addCandidate(recorder, componentGameObject(handler), false, 500);
                } catch (_) {}
            }
        }

        // The VoiceConnection primary is the recorder that is actually bound to
        // the room. Prefer it before considering scene-wide Recorder components.
        if (PhotonVoiceConnection) {
            try {
                const connections = findObjects(PhotonVoiceConnection);
                for (let index = 0; connections && index < connections.length; index++) {
                    try {
                        const connection = connections.get(index);
                        const object = connection.method("get_gameObject", 0).invoke();
                        let recorder: any = null;
                        try { recorder = connection.method("get_PrimaryRecorder", 0).invoke(); } catch (_) {}
                        addCandidate(recorder, object, false);
                    } catch (_) {}
                }
            } catch (_) {}
        }
        if (candidates.length > 0) {
            candidates.sort((left, right) => right.score - left.score);
            soundboardRecorder = candidates[0].recorder;
            console.log("[" + MENU_NAME + "] Soundboard selected VoiceConnection.PrimaryRecorder.");
            return soundboardRecorder;
        }

        if (CustomVoiceRecorder) {
            try {
                const customRecorders = Resources.method("FindObjectsOfTypeAll", 1)
                    .overload("System.Type")
                    .invoke(CustomVoiceRecorder.type.object);
                for (let index = 0; customRecorders && index < customRecorders.length; index++) {
                    try {
                        const custom = customRecorders.get(index);
                        const object = custom.method("get_gameObject", 0).invoke();
                        addCandidate(getComponent(object, PhotonRecorder), object, true);
                    } catch (_) {}
                }
            } catch (_) {}
        }

        try {
            const recorders = findObjects(PhotonRecorder);
            for (let index = 0; recorders && index < recorders.length; index++) {
                try {
                    const recorder = recorders.get(index);
                    addCandidate(recorder, recorder.method("get_gameObject", 0).invoke(), false);
                } catch (_) {}
            }
        } catch (_) {}

        candidates.sort((left, right) => right.score - left.score);
        soundboardRecorder = candidates.length > 0 ? candidates[0].recorder : null;
        if (isLive(soundboardRecorder)) {
            console.log("[" + MENU_NAME + "] Soundboard selected the live Photon Voice recorder.");
        }
        return soundboardRecorder;
    }

    function captureRecorderState(recorder: any): void {
        if (soundboardRecorderState || !isLive(recorder)) return;
        const values: any = {};
        for (const name of [
            "LoopAudioClip", "VoiceDetection", "TransmitEnabled",
            "RecordWhenJoined", "RecordingEnabled",
        ]) values[name] = tryGetRecorderValue(recorder, name);
        values.SourceType = getRecorderSourceType(recorder);
        values.AudioClip = getRecorderAudioClip(recorder);
        soundboardRecorderState = { recorder, values };
    }

    function clearRecorderClip(recorder: any): void {
        setRecorderAudioClip(recorder, null);
    }

    function restoreRecorderState(): void {
        const state = soundboardRecorderState;
        soundboardRecorderState = null;
        if (!state || !isLive(state.recorder)) return;
        const recorder = state.recorder;
        trySetRecorderValue(recorder, "RecordingEnabled", false);
        try { recorder.method("StopRecording", 0).invoke(); } catch (_) {}
        if (state.values.SourceType !== undefined) {
            setRecorderSourceType(recorder, state.values.SourceType);
        }
        for (const name of ["LoopAudioClip", "VoiceDetection", "TransmitEnabled", "RecordWhenJoined"]) {
            if (state.values[name] !== undefined) trySetRecorderValue(recorder, name, state.values[name]);
        }
        if (state.values.AudioClip !== undefined && isLive(state.values.AudioClip)) {
            setRecorderAudioClip(recorder, state.values.AudioClip);
        } else {
            clearRecorderClip(recorder);
        }
        const wasRecording = state.values.RecordingEnabled === undefined
            ? true
            : !!state.values.RecordingEnabled;
        trySetRecorderValue(recorder, "RecordingEnabled", wasRecording);
        if (wasRecording) restartVoiceRecorder(recorder);
    }

    function startRecorderClip(recorder: any, clip: any): boolean {
        if (!isLive(recorder) || !isLive(clip)) return false;
        captureRecorderState(recorder);
        trySetRecorderValue(recorder, "RecordingEnabled", false);
        try { recorder.method("StopRecording", 0).invoke(); } catch (_) {}
        const sourceConfigured = setRecorderSourceType(recorder, 1);
        const clipConfigured = setRecorderAudioClip(recorder, clip);
        trySetRecorderValue(recorder, "LoopAudioClip", false);
        trySetRecorderValue(recorder, "VoiceDetection", false);
        trySetRecorderValue(recorder, "TransmitEnabled", true);
        trySetRecorderValue(recorder, "RecordWhenJoined", true);
        trySetRecorderValue(recorder, "RecordingEnabled", true);
        const restarted = restartVoiceRecorder(recorder);
        let verified = sourceConfigured && clipConfigured;
        const sourceType = numericValue(getRecorderSourceType(recorder));
        if (Number.isFinite(sourceType)) verified = verified && Math.round(sourceType) === 1;
        const assignedClip = getRecorderAudioClip(recorder);
        if (assignedClip !== undefined) verified = verified && sameObject(assignedClip, clip);
        soundboardTransmitCheckAt = unityNow() + 1.0;
        soundboardTransmitRetries = 0;
        console.log(
            "[" + MENU_NAME + "] Soundboard mic route: source=" + sourceType +
            ", clip=" + (assignedClip === undefined || sameObject(assignedClip, clip)) +
            ", restart=" + restarted + "."
        );
        return verified && restarted;
    }

    function decodeBase64Chunks(chunks: string[]): Uint8Array | null {
        try {
            const nativeAtob = (globalThis as any).atob;
            if (typeof nativeAtob === "function") {
                const decoded = nativeAtob(chunks.join(""));
                const output = new Uint8Array(decoded.length);
                for (let index = 0; index < decoded.length; index++) {
                    output[index] = decoded.charCodeAt(index) & 0xff;
                }
                return output;
            }
            let encodedLength = 0;
            for (const chunk of chunks) encodedLength += chunk.length;
            if (encodedLength === 0) return null;
            let padding = 0;
            const last = chunks.length > 0 ? chunks[chunks.length - 1] : "";
            if (last.endsWith("==")) padding = 2;
            else if (last.endsWith("=")) padding = 1;
            const output = new Uint8Array(Math.floor(encodedLength * 3 / 4) - padding);
            const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
            let accumulator = 0;
            let bitCount = 0;
            let outputIndex = 0;
            for (const chunk of chunks) {
                for (let index = 0; index < chunk.length; index++) {
                    const character = chunk.charAt(index);
                    if (character === "=") break;
                    const value = alphabet.indexOf(character);
                    if (value < 0) continue;
                    accumulator = ((accumulator << 6) | value) >>> 0;
                    bitCount += 6;
                    if (bitCount >= 8) {
                        bitCount -= 8;
                        if (outputIndex < output.length) {
                            output[outputIndex++] = (accumulator >>> bitCount) & 0xff;
                        }
                    }
                }
            }
            return outputIndex === output.length ? output : output.slice(0, outputIndex);
        } catch (error) {
            console.error("[" + MENU_NAME + "] Soundboard base64 decode failed: " + error);
            return null;
        }
    }

    function readFourCc(view: DataView, offset: number): number {
        return view.getUint32(offset, true);
    }

    function beginWavDecode(soundIndex: number, bytes: Uint8Array): boolean {
        if (bytes.length < 44) return false;
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        if (readFourCc(view, 0) !== 0x46464952 || readFourCc(view, 8) !== 0x45564157) return false;
        let offset = 12;
        let audioFormat = 0;
        let channels = 0;
        let sampleRate = 0;
        let bitsPerSample = 0;
        let dataOffset = 0;
        let dataSize = 0;
        while (offset + 8 <= bytes.length) {
            const chunkId = readFourCc(view, offset);
            const declaredSize = view.getUint32(offset + 4, true);
            const chunkOffset = offset + 8;
            const chunkSize = Math.min(declaredSize, Math.max(0, bytes.length - chunkOffset));
            if (chunkId === 0x20746d66 && chunkSize >= 16) {
                audioFormat = view.getUint16(chunkOffset, true);
                channels = view.getUint16(chunkOffset + 2, true);
                sampleRate = view.getUint32(chunkOffset + 4, true);
                bitsPerSample = view.getUint16(chunkOffset + 14, true);
                if (audioFormat === 65534 && chunkSize >= 40) {
                    audioFormat = view.getUint16(chunkOffset + 24, true);
                }
            } else if (chunkId === 0x61746164) {
                dataOffset = chunkOffset;
                dataSize = chunkSize;
            }
            offset = chunkOffset + chunkSize + (chunkSize & 1);
            if (declaredSize > chunkSize) break;
        }
        if ((audioFormat !== 1 && audioFormat !== 3) || channels <= 0 ||
            sampleRate <= 0 || dataOffset <= 0 || dataSize <= 0) return false;
        const bytesPerSample = Math.floor(bitsPerSample / 8);
        if (![1, 2, 3, 4].includes(bytesPerSample)) return false;
        const totalSamples = Math.floor(dataSize / bytesPerSample);
        const frameCount = Math.floor(totalSamples / channels);
        if (frameCount <= 0) return false;
        const sound = soundboardSounds[soundIndex];
        const clip = AudioClip.method("Create", 5).invoke(
            Il2Cpp.string(sound ? sound.label : "rasp_sound"),
            frameCount,
            channels,
            sampleRate,
            false,
        );
        if (!isLive(clip)) return false;
        pendingWavDecode = {
            soundIndex,
            bytes,
            view,
            clip,
            audioFormat,
            channels,
            sampleRate,
            bitsPerSample,
            bytesPerSample,
            dataOffset,
            totalSamples: frameCount * channels,
            sampleIndex: 0,
            pcm: new Float32Array(frameCount * channels),
        };
        return true;
    }

    function playLocalSoundPreview(clip: any): boolean {
        if (!isLive(clip)) return false;

        // PlayClipAtPoint owns and cleans up its temporary AudioSource. Placing
        // it at the headset makes the preview audible without changing a game
        // source's volume, mute, pitch, mixer, or current clip.
        try {
            const cameraTransform = getCameraTransform(activeLocalPlayer);
            if (!isLive(cameraTransform)) return false;
            const position = cameraTransform.method("get_position", 0).invoke();
            AudioSource.method("PlayClipAtPoint", 3)
                .overload("UnityEngine.AudioClip", "UnityEngine.Vector3", "System.Single")
                .invoke(clip, position, 1.0);
            console.log("[" + MENU_NAME + "] Soundboard local preview started.");
            return true;
        } catch (_) {}

        // Exact pinned-build fallback: this field is a live AudioSource on the
        // local PlayerController, and PlayOneShot preserves its normal clip.
        try {
            const source = activeLocalPlayer.field("swooshAudioSource").value;
            if (!isLive(source)) return false;
            source.method("PlayOneShot", 2)
                .overload("UnityEngine.AudioClip", "System.Single")
                .invoke(clip, 1.0);
            console.log("[" + MENU_NAME + "] Soundboard local preview fallback started.");
            return true;
        } catch (error) {
            console.error("[" + MENU_NAME + "] Soundboard local preview failed: " + error);
            return false;
        }
    }

    function failSoundboard(message: string): void {
        console.error("[" + MENU_NAME + "] Soundboard: " + message);
        stopSoundboardPlayback(false);
    }

    function refreshSoundboardButtonColors(): void {
        for (const button of renderedButtons) {
            setRendererColor(button.renderer, buttonColor(button.entry, button.entry.id === hoveredButtonId));
        }
    }

    function voiceHandlerForRecorder(recorder: any): any {
        if (!PlayerVoiceHandler || !isLive(recorder)) return null;
        for (const handler of objectsOfClass(PlayerVoiceHandler)) {
            try {
                if (!componentIsActiveInScene(handler) ||
                    !sameObject(handler.field("bmvx").value, recorder)) continue;
                return handler;
            } catch (_) {}
        }
        return null;
    }

    function armSoundboardMixer(recorder: any): boolean {
        if (!soundboardMixerHooksInstalled || !isLive(recorder)) return false;
        let voice: any = null;
        try { voice = recorder.field("voice").value; } catch (_) {}
        if (!isLive(voice)) voice = tryGetRecorderValue(recorder, "Voice");
        if (!isLive(voice)) return false;
        let voiceType = "";
        try { voiceType = String(voice.class.fullName || voice.class.name); } catch (_) {}
        const compatibleHook = (/Short|Int16/.test(voiceType) && soundboardShortHookInstalled) ||
            (/Float|Single/.test(voiceType) && soundboardFloatHookInstalled);
        if (!compatibleHook) return false;
        const handler = voiceHandlerForRecorder(recorder);
        if (!isLive(handler)) return false;
        try { if (!recorder.method("get_enabled", 0).invoke()) return false; } catch (_) { return false; }
        try { if (!handler.method("get_IsMicrophoneActivate", 0).invoke()) return false; } catch (_) {}
        try { if (handler.method("get_IsModerated", 0).invoke()) return false; } catch (_) {}
        let rate = Number.NaN;
        let channels = Number.NaN;
        try {
            const info = voice.field("info").value;
            rate = numericValue(info.field("<SamplingRate>k__BackingField").value);
            channels = numericValue(info.field("<Channels>k__BackingField").value);
        } catch (_) {}
        if (!Number.isFinite(rate) || rate < 8000) rate = numericValue(tryGetRecorderValue(recorder, "SamplingRate"));
        soundboardVoiceRate = Number.isFinite(rate) && rate >= 8000 ? rate : 24000;
        soundboardVoiceChannels = Number.isFinite(channels) && channels >= 1 && channels <= 2
            ? Math.trunc(channels)
            : 1;
        soundboardOutgoingVoice = voice;
        soundboardRecorder = recorder;
        soundboardMicRouted = true;
        try {
            const pushToTalk = !!handler.method("get_IsPushToTalkEnabled", 0).invoke();
            const wasPressed = !!handler.field("bmwe").value;
            if (pushToTalk && !wasPressed) {
                handler.method("SetPushToTalkPressed", 1).invoke(true);
                soundboardPttState = { handler, wasPressed };
            }
        } catch (_) {}
        return true;
    }

    function sourcePcmSample(frame: number): number {
        const pcm = soundboardPcm;
        if (!pcm) return 0;
        const totalFrames = Math.floor(pcm.length / soundboardPcmChannels);
        const clampedFrame = Math.max(0, Math.min(totalFrames - 1, frame));
        const base = clampedFrame * soundboardPcmChannels;
        let sample = 0;
        for (let channel = 0; channel < soundboardPcmChannels; channel++) sample += pcm[base + channel] || 0;
        return sample / soundboardPcmChannels;
    }

    function nextMixedPcmSample(): number | null {
        const pcm = soundboardPcm;
        if (!pcm) return null;
        const totalFrames = Math.floor(pcm.length / soundboardPcmChannels);
        if (soundboardPcmCursor >= totalFrames) {
            soundboardPcmFinished = true;
            return null;
        }
        const first = Math.floor(soundboardPcmCursor);
        const fraction = soundboardPcmCursor - first;
        const sample = sourcePcmSample(first) * (1 - fraction) + sourcePcmSample(first + 1) * fraction;
        soundboardPcmCursor += soundboardPcmRate / soundboardVoiceRate;
        return sample;
    }

    function mixSoundboardShort(buffer: any): void {
        const length = Number(buffer?.length ?? 0);
        if (length <= 0) return;
        const destination = new Int16Array(
            (ArrayBuffer as any).wrap(buffer.elements.handle, length * Int16Array.BYTES_PER_ELEMENT),
        );
        for (let index = 0; index < length; index += soundboardVoiceChannels) {
            const sample = nextMixedPcmSample();
            if (sample === null) break;
            for (let channel = 0; channel < soundboardVoiceChannels && index + channel < length; channel++) {
                const mixed = Math.max(-1, Math.min(1, destination[index + channel] / 32768 + sample * 0.8));
                destination[index + channel] = Math.round(mixed * 32767);
            }
        }
    }

    function mixSoundboardFloat(buffer: any): void {
        const length = Number(buffer?.length ?? 0);
        if (length <= 0) return;
        const destination = new Float32Array(
            (ArrayBuffer as any).wrap(buffer.elements.handle, length * Float32Array.BYTES_PER_ELEMENT),
        );
        for (let index = 0; index < length; index += soundboardVoiceChannels) {
            const sample = nextMixedPcmSample();
            if (sample === null) break;
            for (let channel = 0; channel < soundboardVoiceChannels && index + channel < length; channel++) {
                destination[index + channel] = Math.max(
                    -1,
                    Math.min(1, destination[index + channel] + sample * 0.8),
                );
            }
        }
    }

    function restoreSoundboardPushToTalk(): void {
        const state = soundboardPttState;
        soundboardPttState = null;
        if (!state || !isUnityObjectAlive(state.handler)) return;
        try { state.handler.method("SetPushToTalkPressed", 1).invoke(!!state.wasPressed); } catch (_) {}
    }

    function stopSoundboardPlayback(logStop: boolean = false): void {
        if (pendingWavDecode && isLive(pendingWavDecode.clip)) destroy(pendingWavDecode.clip);
        pendingWavDecode = null;
        restoreSoundboardPushToTalk();
        soundboardMicRouted = false;
        soundboardRecorder = null;
        soundboardOutgoingVoice = null;
        soundboardPcm = null;
        soundboardPcmCursor = 0;
        soundboardPcmFinished = false;
        if (isLive(currentSoundClip)) destroy(currentSoundClip);
        currentSoundClip = null;
        soundboardEndTime = 0;
        soundboardTransmitCheckAt = 0;
        soundboardTransmitRetries = 0;
        activeSoundIndex = -1;
        const wasBusy = soundboardBusy;
        soundboardBusy = false;
        if (logStop && wasBusy) console.log("[" + MENU_NAME + "] Soundboard stopped.");
        refreshSoundboardButtonColors();
    }

    function playPreparedSound(
        soundIndex: number,
        clip: any,
        duration: number,
        pcm: Float32Array,
        sampleRate: number,
        channels: number,
    ): void {
        currentSoundClip = clip;
        soundboardPcm = pcm;
        soundboardPcmCursor = 0.0;
        soundboardPcmRate = sampleRate;
        soundboardPcmChannels = Math.max(1, channels);
        soundboardPcmFinished = false;
        soundboardMixFault = false;
        soundboardMixFaultLogged = false;
        activeSoundIndex = soundIndex;
        soundboardBusy = true;
        soundboardEndTime = unityNow() + Math.max(0.25, duration) + 0.35;
        const localPlaying = playLocalSoundPreview(clip);

        let micPlaying = false;
        if (soundboardMixerHooksInstalled) {
            const recorder = findSoundboardRecorder();
            if (isLive(recorder)) {
                if (armSoundboardMixer(recorder)) {
                    micPlaying = true;
                } else {
                    soundboardRecorder = null;
                    soundboardOutgoingVoice = null;
                    console.error("[" + MENU_NAME + "] Soundboard outgoing voice is unavailable; local preview will continue.");
                }
            } else {
                console.error("[" + MENU_NAME + "] No live Photon Voice recorder; local preview will continue.");
            }
        }

        if (!localPlaying && !micPlaying) {
            failSoundboard("Local playback and Photon Voice both failed.");
            return;
        }
        const sound = soundboardSounds[soundIndex];
        const routes = localPlaying && micPlaying ? "locally and through mic" :
            (localPlaying ? "locally" : "through mic");
        console.log("[" + MENU_NAME + "] Playing " + routes + ": " + (sound?.fileName ?? "sound"));
        refreshSoundboardButtonColors();
    }

    function updatePendingWavDecode(): void {
        const pending = pendingWavDecode;
        if (!pending) return;
        try {
            const remaining = pending.totalSamples - pending.sampleIndex;
            if (remaining <= 0) {
                pendingWavDecode = null;
                playPreparedSound(
                    pending.soundIndex,
                    pending.clip,
                    pending.totalSamples / (pending.sampleRate * pending.channels),
                    pending.pcm,
                    pending.sampleRate,
                    pending.channels,
                );
                return;
            }
            // Keep PCM conversion below one Quest frame budget. Writing the
            // managed float[] in one native copy avoids thousands of bridge
            // calls and the old multi-frame hitch.
            let sampleCount = Math.min(8192, remaining);
            if (remaining > sampleCount) sampleCount -= sampleCount % pending.channels;
            const samples = new Float32Array(sampleCount);
            for (let index = 0; index < sampleCount; index++) {
                const byteOffset = pending.dataOffset + (pending.sampleIndex + index) * pending.bytesPerSample;
                if (pending.bitsPerSample === 8) {
                    samples[index] = (pending.view.getUint8(byteOffset) - 128) / 128.0;
                } else if (pending.bitsPerSample === 16) {
                    samples[index] = pending.view.getInt16(byteOffset, true) / 32768.0;
                } else if (pending.bitsPerSample === 24) {
                    const value = pending.view.getUint8(byteOffset) |
                        (pending.view.getUint8(byteOffset + 1) << 8) |
                        (pending.view.getInt8(byteOffset + 2) << 16);
                    samples[index] = value / 8388608.0;
                } else if (pending.bitsPerSample === 32 && pending.audioFormat === 3) {
                    samples[index] = pending.view.getFloat32(byteOffset, true);
                } else if (pending.bitsPerSample === 32) {
                    samples[index] = pending.view.getInt32(byteOffset, true) / 2147483648.0;
                }
            }
            pending.pcm.set(samples, pending.sampleIndex);
            const sampleArray = Il2Cpp.array(SingleClass, sampleCount);
            sampleArray.elements.handle.writeByteArray(samples.buffer as ArrayBuffer);
            const frameOffset = Math.floor(pending.sampleIndex / pending.channels);
            let wrote = false;
            try {
                wrote = !!pending.clip.method("SetData")
                    .overload("System.Single[]", "System.Int32")
                    .invoke(sampleArray, frameOffset);
            } catch (_) {
                wrote = !!pending.clip.method("SetData", 2)
                    .overload("System.Single[]", "System.Int32")
                    .invoke(sampleArray, frameOffset);
            }
            if (!wrote) {
                failSoundboard("Unity could not write the decoded WAV data.");
                return;
            }
            pending.sampleIndex += sampleCount;
        } catch (error) {
            failSoundboard("WAV decode failed: " + error);
        }
    }

    function maintainSoundboardRoute(): void {
        if (!soundboardBusy || !isLive(currentSoundClip)) return;
        const now = unityNow();
        if (soundboardEndTime > 0 && now >= soundboardEndTime) {
            stopSoundboardPlayback(false);
            return;
        }
        if (!soundboardMixerHooksInstalled) return;
        if (soundboardMixFault) {
            if (!soundboardMixFaultLogged) {
                soundboardMixFaultLogged = true;
                soundboardMicRouted = false;
                soundboardOutgoingVoice = null;
                restoreSoundboardPushToTalk();
                console.error("[" + MENU_NAME + "] Soundboard mic mixer stopped safely; local preview will continue.");
            }
            return;
        }
        if (soundboardPcmFinished) return;
        if (!soundboardMicRouted || !recorderIsUsable(soundboardRecorder) || !isLive(soundboardOutgoingVoice)) {
            const recorder = findSoundboardRecorder();
            if (isLive(recorder) && armSoundboardMixer(recorder)) return;
            soundboardMicRouted = false;
            soundboardOutgoingVoice = null;
        }
    }

    function playSoundboardSound(soundIndex: number): void {
        const sound = soundboardSounds[soundIndex];
        if (!sound) return;
        stopSoundboardPlayback(false);
        activeSoundIndex = soundIndex;
        soundboardBusy = true;
        const bytes = decodeBase64Chunks(sound.base64Chunks);
        if (!bytes || !beginWavDecode(soundIndex, bytes)) {
            failSoundboard("Unsupported or invalid WAV data for " + sound.fileName + ".");
            return;
        }
        console.log("[" + MENU_NAME + "] Preparing sound: " + sound.fileName);
    }

    function updateSoundboard(): void {
        updatePendingWavDecode();
        maintainSoundboardRoute();
    }

    function tick(player: any): void {
        frameNumber++;
        updatePendingTeleportRepeats();
        updateInput(player);
        updateSoundboard();

        if (pendingAmmoSweep) {
            sweepAmmo();
            pendingAmmoSweep = false;
        } else if (mods.infiniteAmmo && frameNumber % 120 === 0) {
            sweepAmmo();
        }

        if (pendingCooldownReset && frameNumber >= cooldownResetRetryFrame) {
            if (resetFireRateTimers()) pendingCooldownReset = false;
            else cooldownResetRetryFrame = frameNumber + 60;
        }

        const scheduledUnlockRefresh = unlockRefreshFrames.length > 0 &&
            frameNumber >= unlockRefreshFrames[0];
        if (pendingUnlockRefresh || scheduledUnlockRefresh) {
            const verbose = pendingUnlockRefresh;
            pendingUnlockRefresh = false;
            while (unlockRefreshFrames.length > 0 && frameNumber >= unlockRefreshFrames[0]) {
                unlockRefreshFrames.shift();
            }
            refreshUnlockViews(verbose);
        }

        if ((pendingInvincibilityRefresh && frameNumber % 30 === 0) ||
            (mods.invincibility && frameNumber % 60 === 0)) {
            if (setGodMode(mods.invincibility)) pendingInvincibilityRefresh = false;
        }
        if (!mods.speedBoost && isUnityObjectAlive(speedBoostPlayer)) restoreSpeedBoost();
        if (!mods.longArms && longArmState) restoreLongArms();
        updateInvisibility();

        const nukeWasActive = pendingNukeGrenades > 0;
        if (nukeWasActive) updateNuke(player);
        if (!nukeWasActive && mods.grenadeLauncher && !leftSecondary && rightTrigger) {
            launchGrenadeFromHand(player);
        }

        applyLongArms(player);
        updateMenu(player);
        applySpeedBoost(player);
        applyTriggerFly(player);
        updatePlatforms(player);
        updateVfxGun(player);
        updateVisuals(player);
    }

    function installHook(method: any, label: string, block: (...args: any[]) => any): boolean {
        try {
            // Cache the original NativeFunction before Interceptor.replace so
            // method.invokeRaw() inside the replacement reaches the trampoline.
            void method.nativeFunction;
            method.implementation = block;
            console.log("[" + MENU_NAME + "] Hooked " + label + ".");
            return true;
        } catch (error) {
            console.error("[" + MENU_NAME + "] Failed to hook " + label + ": " + error);
            return false;
        }
    }

    function installSoundboardMixerHooks(): void {
        if (!PhotonVoiceCoreImage) return;
        try {
            const variants = [
                {
                    typeName: "System.Int16[]", label: "short",
                    concrete: "Photon.Voice.LocalVoiceAudioShort", mix: mixSoundboardShort,
                },
                {
                    typeName: "System.Single[]", label: "float",
                    concrete: "Photon.Voice.LocalVoiceAudioFloat", mix: mixSoundboardFloat,
                },
            ];
            let installed = 0;
            const resolved: Array<{ variant: any; push: any; address: string }> = [];
            for (const variant of variants) {
                try {
                    let push: any = null;
                    // Resolve the already-inflated concrete hierarchy. Avoid
                    // MakeGenericType on this stripped Unity 6 build.
                    let current = PhotonVoiceCoreImage.class(variant.concrete);
                    while (current && !push) {
                        try { push = current.method("PushData", 1).overload(variant.typeName); } catch (_) {}
                        try { current = current.parent; } catch (_) { current = null; }
                    }
                    if (!push) continue;
                    if (push.returnType.name !== "System.Void" || push.parameterCount !== 1 ||
                        push.virtualAddress.isNull()) continue;
                    const address = String(push.virtualAddress);
                    resolved.push({ variant, push, address });
                } catch (_) {}
            }
            const addressCounts = new Map<string, number>();
            for (const item of resolved) {
                addressCounts.set(item.address, (addressCounts.get(item.address) || 0) + 1);
            }
            for (const item of resolved) {
                if (addressCounts.get(item.address) !== 1) continue;
                const { variant, push } = item;
                try {
                    const hooked = installHook(
                        push,
                        "Photon Voice " + variant.label + " outgoing mixer",
                        function (this: any, buffer: any): void {
                            if (soundboardBusy && soundboardPcm && !soundboardMixFault &&
                                sameObject(this, soundboardOutgoingVoice)) {
                                try { variant.mix(buffer); } catch (_) { soundboardMixFault = true; }
                            }
                            push.invokeRaw(this, buffer);
                        },
                    );
                    if (hooked) {
                        installed++;
                        if (variant.label === "short") soundboardShortHookInstalled = true;
                        else soundboardFloatHookInstalled = true;
                    }
                } catch (_) {}
            }
            soundboardMixerHooksInstalled = installed > 0;
            if (!soundboardMixerHooksInstalled) {
                console.error("[" + MENU_NAME + "] Soundboard outgoing mixer hook is unavailable.");
            }
        } catch (_) {
            soundboardMixerHooksInstalled = false;
        }
    }

    if (ENABLE_EXPERIMENTAL_MIC_MIXER) {
        installSoundboardMixerHooks();
    } else {
        console.log("[" + MENU_NAME + "] Soundboard mic mixer disabled by stability mode; local preview remains available.");
    }

    function installUnlockBooleanHook(
        klass: any,
        methodName: string,
        parameterTypes: string[],
        unlockedValue: boolean,
        expectedStatic: boolean | null = null,
    ): void {
        if (!klass) {
            console.error("[" + MENU_NAME + "] Unlock class missing for " + methodName + ".");
            return;
        }
        try {
            let method = klass.method(methodName, parameterTypes.length);
            if (parameterTypes.length > 0) method = method.overload(...parameterTypes);
            if (method.returnType.name !== "System.Boolean" ||
                method.parameterCount !== parameterTypes.length ||
                (expectedStatic !== null && method.isStatic !== expectedStatic) ||
                method.isGeneric || method.isInflated ||
                method.virtualAddress.isNull()) {
                throw new Error("signature guard failed");
            }
            const label = klass.fullName + "." + methodName;
            installHook(method, label, function (this: any, ...args: any[]): boolean {
                if (mods.unlockAll) return unlockedValue;
                return !!method.invokeRaw(this, ...args);
            });
        } catch (error) {
            console.error(
                "[" + MENU_NAME + "] Skipped unlock hook " +
                klass.fullName + "." + methodName + ": " + error
            );
        }
    }

    function installAppearanceAvailabilityHook(
        methodName: string,
        itemType: string,
    ): void {
        if (!WeaponSkins) return;
        try {
            const method = WeaponSkins.method(methodName, 3).overload(
                itemType,
                "System.Boolean&",
                "System.Boolean&",
            );
            if (method.returnType.name !== "System.Void" || method.isStatic ||
                method.isGeneric || method.isInflated || method.virtualAddress.isNull()) {
                throw new Error("signature guard failed");
            }
            installHook(
                method,
                WeaponSkins.fullName + "." + methodName,
                function (this: any, item: any, storeUnlocked: any, contractUnlocked: any): void {
                    if (mods.unlockAll) {
                        // Preserve any bookkeeping performed by the game's
                        // availability query, then override only its outputs.
                        method.invokeRaw(this, item, storeUnlocked, contractUnlocked);
                        storeUnlocked.value = true;
                        contractUnlocked.value = true;
                        return;
                    }
                    method.invokeRaw(this, item, storeUnlocked, contractUnlocked);
                },
            );
        } catch (error) {
            console.error(
                "[" + MENU_NAME + "] Skipped appearance hook " + methodName + ": " + error
            );
        }
    }

    function installUnlockOnEnableRefresh(
        klass: any,
        methodNames: string[],
        prepare?: (instance: any) => void,
    ): void {
        if (!klass) return;
        try {
            const onEnable = klass.method("OnEnable", 0);
            if (onEnable.isStatic || onEnable.returnType.name !== "System.Void" ||
                onEnable.virtualAddress.isNull()) return;
            installHook(onEnable, klass.fullName + ".OnEnable unlock refresh", function (this: any): void {
                if (mods.unlockAll && prepare) {
                    try { prepare(this); } catch (_) {}
                }
                onEnable.invokeRaw(this);
                if (!mods.unlockAll) return;
                for (const methodName of methodNames) {
                    try { this.method(methodName, 0).invoke(); } catch (_) {}
                }
            });
        } catch (_) {}
    }

    // Runtime-only presentation and selection guards for the local catalog.
    // Purchase, currency, entitlement, cached-inventory, loadout-legitimacy,
    // save, and RPC methods deliberately remain untouched.
    installUnlockBooleanHook(PlayfabItem, "IsItemUnlocked", [], true, false);
    installUnlockBooleanHook(
        PlayerCosmeticsLockerPanel,
        "IsItemOwned",
        ["System.String"],
        true,
        false,
    );
    installUnlockBooleanHook(UITouchCosmeticSelection, "get_IsOwned", [], true, false);
    installUnlockBooleanHook(
        MannequinLockerManager,
        "CheckIfCanSetNewEquippedItem",
        ["System.Int32", "System.Int32"],
        true,
        false,
    );
    installUnlockBooleanHook(
        UITouchWeaponSelection,
        "ShouldLockWeapon",
        ["DLAR_WeaponBase"],
        false,
        null,
    );
    installUnlockBooleanHook(
        WeaponsManager,
        "IsLocalAccountOwnedWeapon",
        ["System.String"],
        true,
        true,
    );
    installUnlockBooleanHook(
        UIPanelWeaponSkins,
        "get_HideUnavailableAppearanceItems",
        [],
        false,
        false,
    );
    installUnlockBooleanHook(
        UIPanelWeaponSkins,
        "ShouldShowSkinInScroller",
        ["WeaponSkin"],
        true,
        false,
    );
    installUnlockBooleanHook(
        UIPanelWeaponSkins,
        "ShouldShowWrapInScroller",
        ["WeaponWrapScriptable"],
        true,
        false,
    );
    installUnlockBooleanHook(
        UIPanelWeaponSkins,
        "IsSkinUnlockedForUI",
        ["WeaponSkin"],
        true,
        false,
    );
    installUnlockBooleanHook(
        UIPanelWeaponSkins,
        "IsWrapUnlockedForUI",
        ["WeaponWrapScriptable"],
        true,
        false,
    );
    installUnlockBooleanHook(
        UIPanelWeaponSkins,
        "IsCharmUnlockedForUI",
        ["Weapons.Charms.WeaponCharm"],
        true,
        false,
    );
    installUnlockBooleanHook(
        WeaponSkins,
        "IsStoreUnlockedContract",
        ["SkinContractScriptable"],
        true,
        true,
    );
    installAppearanceAvailabilityHook("IsSkinAvailable", "WeaponSkin");
    installAppearanceAvailabilityHook("IsWrapAvailable", "WeaponWrapScriptable");
    installUnlockBooleanHook(UITechNode, "IsLockedInBackend", [], false, false);
    installUnlockBooleanHook(UITechNode, "IsAllParentsUnlocked", [], true, false);
    installUnlockBooleanHook(TechNodeWeaponWrap, "IsContractUnlocked", [], true, false);
    installUnlockOnEnableRefresh(UITouchWeaponSelection, ["ResetLockStatus"]);
    installUnlockOnEnableRefresh(
        UIPanelWeaponSkins,
        ["RefreshHiddenAppearanceRows", "RefreshUnlocks"],
        setSkinPanelShowLocked,
    );
    installUnlockOnEnableRefresh(UIPanelLoadout, [], setLoadoutShowAll);
    installUnlockOnEnableRefresh(TechNodeWeaponWrap, ["RefreshSecondaryLock"]);

    if (UIPanelLoadout) {
        try {
            const loadWeapons = UIPanelLoadout.method("LoadWeapons", 0);
            installHook(
                loadWeapons,
                "UIPanelLoadout.LoadWeapons unlock filter",
                function (this: any): void {
                    if (mods.unlockAll) setLoadoutShowAll(this);
                    loadWeapons.invokeRaw(this);
                },
            );
        } catch (_) {}
    }

    if (WeaponsManager) {
        try {
            const legitimate = WeaponsManager.method("IsLoadoutWeaponLegitimate", 1)
                .overload("DLAR_WeaponBase");
            if (legitimate.returnType.name === "System.Boolean" &&
                !legitimate.virtualAddress.isNull()) {
                installHook(
                    legitimate,
                    "WeaponsManager.IsLoadoutWeaponLegitimate local unlock",
                    function (this: any, weapon: any): boolean {
                        const accepted = !!legitimate.invokeRaw(this, weapon);
                        if (accepted || !mods.unlockAll || !isUnityObjectAlive(weapon)) return accepted;
                        let localManager = legitimate.isStatic;
                        if (!localManager) {
                            try {
                                const instance = WeaponsManager.method("get_Instance", 0).invoke();
                                localManager = sameObject(this, instance);
                            } catch (_) {
                                localManager = componentIsActiveInScene(this);
                            }
                        }
                        if (!localManager) return false;
                        // Only accept a real catalog weapon component with game
                        // settings. This fixes the empty-ID early rejection but
                        // does not fabricate inventory instances or entitlements.
                        return WeaponBase.isAssignableFrom(weapon.class) && isLive(weaponSettings(weapon));
                    },
                );
            }
        } catch (error) {
            console.error("[" + MENU_NAME + "] Loadout validator hook unavailable: " + error);
        }
    }

    const baseShoot = WeaponBase.method("Shoot", 1);
    installHook(baseShoot, "DLAR_WeaponBase.Shoot", function (this: any, spawnNetworkFX: boolean): boolean {
        const settings = weaponSettings(this);
        const local = isLocalWeapon(this);
        const gun = local && isGun(this);
        let restoreRate = false;
        let oldRate = 0.0;

        if (mods.infiniteAmmo && local) topUpWeapon(this);
        if (settings && gun && (mods.noCooldown || mods.rapidFire)) {
            try {
                oldRate = Number(settings.field("FireRateSeconds").value);
                settings.field("FireRateSeconds").value = mods.noCooldown
                    ? 0.0
                    : Math.min(oldRate, RAPID_FIRE_INTERVAL);
                restoreRate = true;
            } catch (_) {}
        }

        try {
            return !!baseShoot.invokeRaw(this, spawnNetworkFX);
        } finally {
            if (restoreRate && settings) {
                try { settings.field("FireRateSeconds").value = oldRate; } catch (_) {}
            }
            if (mods.infiniteAmmo && local) topUpWeapon(this);
        }
    });

    const triggerStateUpdate = WeaponBase.method("UpdateOnTriggerstate", 0);
    installHook(triggerStateUpdate, "DLAR_WeaponBase.UpdateOnTriggerstate", function (this: any): void {
        const settings = weaponSettings(this);
        let restoreAutomatic = false;
        let oldAutomatic = false;
        if (mods.rapidFire && settings && isLocalWeapon(this) && isGun(this)) {
            try {
                oldAutomatic = !!settings.field("isAutomatic").value;
                settings.field("isAutomatic").value = true;
                restoreAutomatic = true;
            } catch (_) {}
        }
        try { triggerStateUpdate.invokeRaw(this); }
        finally {
            if (restoreAutomatic && settings) {
                try { settings.field("isAutomatic").value = oldAutomatic; } catch (_) {}
            }
        }
    });

    const baseConsumeAmmo = WeaponBase.method("ConsumeAmmo", 1);
    installHook(baseConsumeAmmo, "DLAR_WeaponBase.ConsumeAmmo", function (this: any, amount: number): void {
        if (mods.infiniteAmmo && isLocalWeapon(this)) return;
        baseConsumeAmmo.invokeRaw(this, amount);
    });

    const baseHasAmmo = WeaponBase.method("HasAmmo", 0);
    installHook(baseHasAmmo, "DLAR_WeaponBase.HasAmmo", function (this: any): boolean {
        if (mods.infiniteAmmo && isLocalWeapon(this)) return true;
        return !!baseHasAmmo.invokeRaw(this);
    });

    const storageConsumeAmmo = AmmoStorage.method("ConsumeAmmo", 1);
    installHook(storageConsumeAmmo, "Weapons.WeaponAmmoStorage.ConsumeAmmo", function (this: any, bulletsNeeded: number): number {
        if (mods.infiniteAmmo && isLocalAmmoStorage(this)) return Math.max(0, Math.trunc(Number(bulletsNeeded)));
        return Number(storageConsumeAmmo.invokeRaw(this, bulletsNeeded));
    });

    const storageHasAmmo = AmmoStorage.method("HasAmmo", 0);
    installHook(storageHasAmmo, "Weapons.WeaponAmmoStorage.HasAmmo", function (this: any): boolean {
        if (mods.infiniteAmmo && isLocalAmmoStorage(this)) return true;
        return !!storageHasAmmo.invokeRaw(this);
    });

    const weaponRecoil = RecoilController.method("WeaponRecoil", 0);
    installHook(weaponRecoil, "DLAR_XRHandRecoilController.WeaponRecoil", function (this: any): void {
        let localWeapon = false;
        try { localWeapon = isLocalWeapon(this.field("currentWeapon").value); } catch (_) {}
        if (mods.noRecoil && localWeapon) return;
        weaponRecoil.invokeRaw(this);
    });

    const bulletOffset = HitscanWeapon.method("GetBulletOffsetDirection", 2);
    installHook(bulletOffset, "HitscanWeapon.GetBulletOffsetDirection", function (this: any, forward: any, recoilPercent: number): any {
        if (mods.noRecoil && isLocalWeapon(this)) return bulletOffset.invokeRaw(this, forward, 0.0);
        return bulletOffset.invokeRaw(this, forward, recoilPercent);
    });

    const playerLateUpdate = PlayerController.method("LateUpdate", 0);
    installHook(playerLateUpdate, "PlayerController.LateUpdate", function (this: any): void {
        playerLateUpdate.invokeRaw(this);
        if (!shouldTickPlayerController(this)) return;
        if (tickInProgress) return;
        tickInProgress = true;
        try {
            tick(this);
            lastTickError = "";
            tickErrorCount = 0;
        } catch (error) {
            tickErrorCount++;
            const message = String((error as any)?.stack || error);
            if (message !== lastTickError || tickErrorCount % 300 === 0) {
                console.error("[" + MENU_NAME + "] Tick error: " + message);
                lastTickError = message;
            }
        } finally {
            tickInProgress = false;
        }
    });

    console.log(
        "[" + MENU_NAME + "] Ready (runtime-validated build). " +
        "Hold left Y to open; touch buttons with the right-hand ball."
    );
});


