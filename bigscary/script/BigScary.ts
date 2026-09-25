// @ts-nocheck

declare const Il2Cpp;
declare const System: any;
declare const XRNode: any;
declare const Random: any;
declare const UnityEngine: any;

declare const console: any;
let rigidbody = null;
let hue = 0;
let lastRunTime = 0;
let buttonsList: any[] = [];
let gunchangecolor = false;
let perviousTeleportKey = false;

let buttonClickDelay = 0.0;
let previousDash = false;
let menu = null;
let reference = null;
let referenceCollider = null;
let shouldbeblack = false;
let lastTime = 0.0;
perviousTeleportKey = false,

class SoundEntry {
    name: string;
    path: string;

    pendingPlay = false;
    failed = false;

    constructor(name: string, path: string) {
        this.name = name;
        this.path = path;
    }
}

let leftPrimary = false;
let leftSecondary = false;

// FilterButton_Mod

let rightPrimary = false;
let rightSecondary = false;

let leftGrab = false;
let rightGrab = false;

let leftTrigger = false;
let rightTrigger = false;

let deltaTime = 0.0;
let time = 0.0;
let la = false;

let previousNoclipKey = false;
let perviousDestroyKey = false;

let bgColor: [number, number, number, number];
let textColor: [number, number, number, number];

let buttonColor: [number, number, number, number];
let buttonPressedColor: [number, number, number, number];

bgColor = [0.055, 0.018, 0.095, 0.98];
textColor = [1, 1, 1, 1];
buttonColor = [0.16, 0.055, 0.25, 1];
buttonPressedColor = [0.54, 0.18, 0.78, 1];

let menuName: string = "JaSC Client";
let themeIndex = 0;
class XRInputHandler {
  private InputDevices: any;
  private tryGetFeatureValue: any;
  private buttonStates: Map<string, boolean>;

  constructor() {
    this.InputDevices = Il2Cpp.domain
      .assembly("UnityEngine.XRModule")
      .image.class("UnityEngine.XR.InputDevices");

    this.tryGetFeatureValue = this.InputDevices.method("TryGetFeatureValue_bool", 3);
    this.buttonStates = new Map();
  }

  update() {
    this.updateControllerStates(1); // left controller
    this.updateControllerStates(2); // right controller
  }

  private updateControllerStates(controllerId: number) {
    const features = [
      "PrimaryButton",
      "SecondaryButton",
      "GripButton",
      "TriggerButton",
      "MenuButton"
    ];

    features.forEach(feature => {
      const key = `${controllerId}_${feature}`;
      this.buttonStates.set(key, this.getButtonState(controllerId, feature));
    });
  }

  private getButtonState(deviceId: number, featureName: string): boolean {
    try {
      const valuePtr = Il2Cpp.alloc(1);
      const feature = Il2Cpp.string(featureName);
      const success = this.tryGetFeatureValue.invoke(uint64(deviceId), feature, valuePtr);
      if (success) {
        return valuePtr.readU8() !== 0;
      }
    } catch (_) { }
    return false;
  }

  isButtonPressed(controllerId: number, feature: string): boolean {
    return this.buttonStates.get(`${controllerId}_${feature}`) || false;
  }

  get leftControllerPrimaryButton(): boolean { return this.isButtonPressed(1, "PrimaryButton"); }
  get leftControllerSecondaryButton(): boolean { return this.isButtonPressed(1, "SecondaryButton"); }
  get rightControllerPrimaryButton(): boolean { return this.isButtonPressed(2, "PrimaryButton"); }
  get rightControllerSecondaryButton(): boolean { return this.isButtonPressed(2, "SecondaryButton"); }
  get leftGrab(): boolean { return this.isButtonPressed(1, "GripButton"); }
  get rightGrab(): boolean { return this.isButtonPressed(2, "GripButton"); }
  get leftControllerTriggerButton(): boolean { return this.isButtonPressed(1, "TriggerButton"); }
  get rightControllerTriggerButton(): boolean { return this.isButtonPressed(2, "TriggerButton"); }
  get controllerMenuButton(): boolean {
    return this.isButtonPressed(1, "MenuButton") || this.isButtonPressed(2, "MenuButton");
  }
}

Il2Cpp.perform(() => {
  const images = {
    "Assembly-CSharp": Il2Cpp.domain.assembly("Assembly-CSharp").image,
    "UnityEngine.CoreModule": Il2Cpp.domain.assembly("UnityEngine.CoreModule").image,
    "UnityEngine.PhysicsModule": Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image,
    "UnityEngine.UIModule": Il2Cpp.domain.assembly("UnityEngine.UIModule").image,
    "UnityEngine.UI": Il2Cpp.domain.assembly("UnityEngine.UI").image,
    "UnityEngine": Il2Cpp.domain.assembly("UnityEngine").image,
    "UnityEngine.TextRenderingModule": Il2Cpp.domain.assembly("UnityEngine.TextRenderingModule").image,
    "PhotonUnityNetworking": Il2Cpp.domain.assembly("PhotonUnityNetworking").image,
    "PlayFab": Il2Cpp.domain.assembly("PlayFab").image,
    "PhotonRecorder": Il2Cpp.domain.assembly("PhotonVoice").image,
    "UnityWebRequestModule": Il2Cpp.domain.assembly("UnityEngine.UnityWebRequestModule").image,
  };
  const AssemblyCSharp = images["Assembly-CSharp"];
  const PhotonRecorder = images["PhotonRecorder"];
  const UnityEngineCore = images["UnityEngine.CoreModule"];
  const UnityEnginePhysics = images["UnityEngine.PhysicsModule"];
  const UnityEngineUI = images["UnityEngine.UI"];
  const UnityEngineUIModule = images["UnityEngine.UIModule"];
  const UnityEngineTextRendering = images["UnityEngine.TextRenderingModule"];
  const PhotonUnityNetworking = images["PhotonUnityNetworking"];
  const PhotonVRManager = AssemblyCSharp.class("Photon.VR.PhotonVRManager");
  const GTPlayerClass = AssemblyCSharp.class("GorillaLocomotion.Player");
  const PhotonNetwork = PhotonUnityNetworking.class("Photon.Pun.PhotonNetwork");
  const GTPlayer = GTPlayerClass.method("get_Instance").invoke();
  const GameObject = UnityEngineCore.class("UnityEngine.GameObject");
  const Object = UnityEngineCore.class("UnityEngine.Object");
  const Component = UnityEngineCore.class("UnityEngine.Component");
  const Vector3 = UnityEngineCore.class("UnityEngine.Vector3");
  const Quaternion = UnityEngineCore.class("UnityEngine.Quaternion");
  const Time = UnityEngineCore.class("UnityEngine.Time");
  const Resources = UnityEngineCore.class("UnityEngine.Resources");
  const Renderer = UnityEngineCore.class("UnityEngine.Renderer");
  const Thread = Il2Cpp.corlib.class("System.Threading.Thread");
  const Shader = UnityEngineCore.class("UnityEngine.Shader");
  const RectTransform = UnityEngineCore.class("UnityEngine.RectTransform");
  const MeshCollider = UnityEnginePhysics.class("UnityEngine.Collider");
  const BoxCollider = UnityEnginePhysics.class("UnityEngine.BoxCollider");
  const Collider = UnityEnginePhysics.class("UnityEngine.Collider");
  const Rigidbody = UnityEnginePhysics.class("UnityEngine.Rigidbody");
  const Physics = UnityEnginePhysics.class("UnityEngine.Physics");
  const SystemObject = Il2Cpp.corlib.class("System.Object");

  const Canvas = UnityEngineUIModule.class("UnityEngine.Canvas");
  const CanvasScaler = UnityEngineUI.class("UnityEngine.UI.CanvasScaler");
  const GraphicRaycaster = UnityEngineUI.class("UnityEngine.UI.GraphicRaycaster");
  const Text = UnityEngineUI.class("UnityEngine.UI.Text");
  const Font = UnityEngineTextRendering.class("UnityEngine.Font");
  const camera = GameObject.method("Find").invoke(Il2Cpp.string("MainCamera"));
  const Voice = GameObject.method("Find").invoke(Il2Cpp.string("PhotonVRVoice"));

  const GorillaTagger = GTPlayer

  for (const field of GTPlayerClass.fields) {
    if (field.type.name == "UnityEngine.Rigidbody") {
      rigidbody = GTPlayer.field(field.name).value
    }
  }

  const MenuShader = Shader.method("Find").invoke(Il2Cpp.string("Unlit/Color"));
  const TextShader = Shader.method("Find").invoke(Il2Cpp.string("GUI/Text Shader"));

  const zeroVector = Vector3.field("zeroVector").value;
  const oneVector = Vector3.field("oneVector").value;
  const identityQuaternion = Quaternion.field("identityQuaternion").value;

  const leftHandTransform = GorillaTagger.field("leftHandTransform").value;
  const rightHandTransform = GorillaTagger.field("rightHandTransform").value;
  const headCollider = GorillaTagger.field("headCollider").value;
  let mutationName: string = "None";
  let ovrideBool: boolean;

    // ==================== SOUNDBOARD (NEBULA.LOL bwah menu) ====================
    // --- Soundboard state ---
    let soundQueue = [];
    let soundboardFiles = [];
    let soundboardDir = "";
    let micPlayEnabled = false;
    let micMixBuffer = null;
    let micFilterHookedClass = null;
    let micHookRetryCounter = 0;
    let micDumpDone = false;
    function findClass(name) {
        try {
            const assemblies = Il2Cpp.domain.assemblies;
            for (let i = 0; i < assemblies.length; i++) {
                try {
                    const c = assemblies[i].image.tryClass(name);
                    if (c != null) return c;
                } catch (_) { }
            }
        } catch (_) { }
        return null;
    }
    function findClassLike(substr) {
        try {
            const seen = new Set();
            for (let a = 0; a < Il2Cpp.domain.assemblies.length; a++) {
                let img = null;
                try { img = Il2Cpp.domain.assemblies[a].image; } catch (_) { continue; }
                if (img == null) continue;
                let classes = null;
                try { classes = img.classes; } catch (_) { continue; }
                if (classes == null) continue;
                for (let c = 0; c < classes.length; c++) {
                    try {
                        const cls = classes[c];
                        if (cls == null) continue;
                        const h = cls.handle.toString();
                        if (seen.has(h)) continue;
                        seen.add(h);
                        const full = cls.fullName;
                        if (full != null && full.indexOf(substr) >= 0) return cls;
                    } catch (_) { }
                }
            }
        } catch (_) { }
        return null;
    }
    let DirectoryClass = null;
    let ApplicationClass = null;
    let AudioSourceClass = null;
    let AudioClipClass = null;
    let audioLoaderChecked = false;
    function ensureAudioClasses() {
        if (audioLoaderChecked) return;
        audioLoaderChecked = true;
        try { if (DirectoryClass == null) DirectoryClass = findClass("System.IO.Directory"); } catch (_) { }
        try { if (ApplicationClass == null) ApplicationClass = findClass("UnityEngine.Application"); } catch (_) { }
        try { if (AudioSourceClass == null) AudioSourceClass = findClass("UnityEngine.AudioSource"); } catch (_) { }
        try { if (AudioClipClass == null) AudioClipClass = findClass("UnityEngine.AudioClip"); } catch (_) { }
    }
    ensureAudioClasses();
    function decodeClipToSamples(clip) {
        try {
            const samples = clip.method("get_samples").invoke();
            const channels = clip.method("get_channels").invoke();
            const total = samples * channels;
            if (!(total > 0) || total > 15000000) return null;
            const FloatClass = Il2Cpp.corlib.class("System.Single");
            const managed = Il2Cpp.array(FloatClass, total);
            const ok = clip.method("GetData", 2).invoke(managed, 0);
            if (!ok) return null;
            const out = new Float32Array(total);
            for (let i = 0; i < total; i++) {
                try { out[i] = managed.get(i); } catch (_) { break; }
            }
            return out;
        } catch (e) {
            console.error("[Soundboard] decodeClipToSamples failed: " + e);
            return null;
        }
    }
    function micFilterWrite(data, channels) {
        if (!micPlayEnabled) return;
        const buf = micMixBuffer;
        if (buf == null) return;
        const n = data.length;
        let i = 0;
        while (i < n && buf.offset < buf.samples.length) {
            try { data.set(i, data.get(i) + buf.samples[buf.offset]); } catch (_) { break; }
            buf.offset++;
            i++;
        }
        if (buf.offset >= buf.samples.length) {
            micMixBuffer = null;
            console.log("[Soundboard] Mic playback finished");
        }
    }
    function hookMicOnAudioFilterRead() {
        if (micFilterHookedClass != null) return true;
        try {
            const mb = findClass("UnityEngine.MonoBehaviour");
            if (mb == null) return false;
            const list = Object.method("FindObjectsOfType").inflate(mb).invoke();
            if (list == null) return false;
            const seen = new Set();
            for (let i = 0; i < list.length; i++) {
                try {
                    const inst = list.get(i);
                    const cls = inst.class;
                    if (cls == null) continue;
                    const h = cls.handle.toString();
                    if (seen.has(h)) continue;
                    seen.add(h);
                    const m = cls.tryMethod("OnAudioFilterRead", 2);
                    if (m != null) {
                        m.implementation = function (data, channels) {
                            try { micFilterWrite(data, channels); } catch (_) { }
                            return this.method("OnAudioFilterRead", 2).invoke(data, channels);
                        };
                        micFilterHookedClass = cls;
                        console.log("[Soundboard] Mic injected into " + cls.type.name);
                        return true;
                    }
                } catch (_) { }
            }
            return false;
        } catch (_) {
            return false;
        }
    }
    let sbRecorderClass = null;
    let sbLocalSrc = null;
    let sbPending = null;
    let sbPendingDh = null;
    let sbClipUntil = 0.0;
    function sbGetCtor(klass, argTypes) {
        try {
            for (const m of klass.methods) {
                if (m.name !== ".ctor") continue;
                if (m.parameterCount !== argTypes.length) continue;
                let ok = true;
                for (let i = 0; i < argTypes.length; i++) {
                    const tn = String(m.parameters[i].type.name);
                    if (!tn.includes(argTypes[i])) { ok = false; break; }
                }
                if (ok) return m;
            }
        } catch (_) { }
        return null;
    }
    function sbGetRecorders() {
        const out = [];
        try {
            if (!sbRecorderClass) {
                sbRecorderClass = findClass("Photon.Voice.Unity.Recorder") || findClass("Fusion.Voice.Recorder") || findClassLike("Recorder");
                console.log("[Soundboard] recorder class found=" + !!sbRecorderClass);
            }
            if (sbRecorderClass) {
                const found = Object.method("FindObjectsOfType").inflate(sbRecorderClass).invoke();
                for (let i = 0; i < found.length; i++) out.push(found.get(i));
            }
        } catch (e) { console.log("[Soundboard] recorders error: " + e); }
        return out;
    }
    function sbEnsureLocalSrc() {
        try {
            if (AudioSourceClass == null) return null;
            if (sbLocalSrc == null || sbLocalSrc.isNull()) {
                const CameraClass = findClass("UnityEngine.Camera");
                if (CameraClass == null) return null;
                const cams = Object.method("FindObjectsOfType").inflate(CameraClass).invoke();
                if (cams == null || cams.length < 1) return null;
                const cam = cams.get(0);
                const go = cam.method("get_gameObject").invoke();
                sbLocalSrc = go.method("AddComponent", 0).inflate(AudioSourceClass).invoke();
                console.log("[Soundboard] local audio source attached");
            }
        } catch (e) { console.log("[Soundboard] local src error: " + e); }
        return sbLocalSrc;
    }
    function sbPlayClip(clip) {
        try {
            let len = 0;
            try { len = Number(clip.method("get_length").invoke()); } catch (_) { }
            if (micPlayEnabled) {
                const recs = sbGetRecorders();
                for (const r of recs) {
                    try {
                        r.method("set_SourceType").invoke(1);
                        r.method("set_AudioClip").invoke(clip);
                        r.method("set_LoopAudioClip").invoke(false);
                        r.method("set_VoiceDetection").invoke(false);
                        r.method("set_TransmitEnabled").invoke(true);
                        r.method("set_RecordingEnabled").invoke(true);
                    } catch (_) { }
                }
                console.log("[Soundboard] clip fed to " + recs.length + " recorder(s)");
            }
            const src = sbEnsureLocalSrc();
            if (src != null && !src.isNull()) {
                try {
                    src.method("Stop", 0).invoke();
                    src.method("set_clip", 1).invoke(clip);
                    src.method("set_volume", 1).invoke(1.0);
                    src.method("set_spatialBlend", 1).invoke(0.0);
                    src.method("set_loop", 1).invoke(false);
                    src.method("set_playOnAwake", 1).invoke(false);
                    src.method("Play", 0).invoke();
                } catch (e) { console.log("[Soundboard] local play error: " + e); }
            }
            sbClipUntil = len > 0 ? time + len : 0.0;
            console.log("[Soundboard] playing clip (len " + Math.round(len * 10) / 10 + "s)");
        } catch (e) { console.log("[Soundboard] play error: " + e); }
    }
    function sbPlayMp3(fullPath) {
        try {
            const url = "file://" + fullPath;
            const ReqClass = findClass("UnityEngine.Networking.UnityWebRequest") || findClass("UnityEngine.UnityWebRequest");
            const DhClass = findClass("UnityEngine.Networking.DownloadHandlerAudioClip") || findClass("UnityEngine.DownloadHandlerAudioClip");
            const UriClass = findClass("System.Uri");
            if (ReqClass && DhClass && UriClass) {
                const uri = UriClass.alloc();
                const uriCtor = sbGetCtor(UriClass, ["System.String"]);
                if (!uriCtor) { console.log("[Soundboard] mp3: uri ctor not found"); return; }
                uriCtor.invokeRaw(uri, Il2Cpp.string(url));
                const dh = DhClass.alloc();
                const dhCtor = sbGetCtor(DhClass, ["System.Uri", "AudioType"]);
                if (!dhCtor) { console.log("[Soundboard] mp3: dh ctor not found"); return; }
                dhCtor.invokeRaw(dh, uri, 13);
                const req = ReqClass.alloc();
                const reqCtor = sbGetCtor(ReqClass, ["System.Uri", "System.String", "DownloadHandler", "UploadHandler"]);
                if (!reqCtor) { console.log("[Soundboard] mp3: req ctor not found"); return; }
                reqCtor.invokeRaw(req, uri, Il2Cpp.string("GET"), dh, ptr("0"));
                req.method("SendWebRequest").invoke();
                sbPending = req;
                sbPendingDh = dh;
                console.log("[Soundboard] mp3 loading " + fullPath);
            } else {
                console.log("[Soundboard] mp3: loader unavailable web=" + !!ReqClass + " dh=" + !!DhClass + " uri=" + !!UriClass);
            }
        } catch (e) { console.log("[Soundboard] mp3 error: " + e); }
    }
    function sbPlayWav(fullPath) {
        try {
            const FileClass = Il2Cpp.corlib.class("System.IO.File");
            const barr = FileClass.method("ReadAllBytes", 1).invoke(Il2Cpp.string(fullPath));
            const n = Number(barr.length);
            if (n < 44) { console.log("[Soundboard] wav: file too small: " + fullPath); return; }
            const raw = new Uint8Array(barr.handle.add(Il2Cpp.Array.headerSize).readByteArray(n));
            const tag = (o, l) => String.fromCharCode.apply(null, Array.from(raw.subarray(o, o + l)));
            if (tag(0, 4) !== "RIFF" || tag(8, 4) !== "WAVE") { console.log("[Soundboard] wav: not a wav: " + fullPath); return; }
            const u16 = (o) => raw[o] | (raw[o + 1] << 8);
            const u32 = (o) => (raw[o] | (raw[o + 1] << 8) | (raw[o + 2] << 16) | (raw[o + 3] << 24)) >>> 0;
            let channels = 1, sampleRate = 44100, bits = 16, dataOffset = -1, dataSize = 0;
            let pos = 12;
            while (pos + 8 <= n) {
                const id = tag(pos, 4);
                const size = u32(pos + 4);
                if (id === "fmt ") {
                    const fmt = u16(pos + 8);
                    if (fmt !== 1 && fmt !== 0xFFFE) { console.log("[Soundboard] wav: unsupported format " + fmt); return; }
                    channels = u16(pos + 10);
                    if (channels < 1) channels = 1;
                    sampleRate = u32(pos + 12);
                    bits = u16(pos + 22);
                } else if (id === "data") {
                    dataOffset = pos + 8;
                    dataSize = size;
                    break;
                }
                pos += 8 + size + (size & 1);
            }
            if (dataOffset < 0 || dataSize <= 0) { console.log("[Soundboard] wav: no data chunk: " + fullPath); return; }
            let samples;
            if (bits === 8) {
                const frames = Math.floor(dataSize / channels);
                samples = new Array(frames * channels);
                let out = 0;
                for (let i = 0; i < frames; i++) {
                    for (let c = 0; c < channels; c++) samples[out++] = (raw[dataOffset + i * channels + c] - 128) / 128.0;
                }
            } else {
                const frameBytes = channels * 2;
                const frames = Math.floor(dataSize / frameBytes);
                samples = new Array(frames * channels);
                let out = 0;
                let p = dataOffset;
                for (let i = 0; i < frames; i++) {
                    for (let c = 0; c < channels; c++) {
                        const s = ((raw[p + 1] << 8) | raw[p]) << 16 >> 16;
                        p += 2;
                        samples[out++] = s / 32768.0;
                    }
                }
            }
            if (AudioClipClass == null) { console.log("[Soundboard] wav: AudioClip class missing"); return; }
            const clip = AudioClipClass.method("Create", 5).invoke(Il2Cpp.string("sb_" + fullPath.split("/").pop()), samples.length, channels, sampleRate, false);
            const floatArray = Il2Cpp.array(Il2Cpp.corlib.class("System.Single"), samples);
            clip.method("SetData", 2).invoke(floatArray, 0);
            console.log("[Soundboard] wav: decoded " + samples.length + " samples, " + channels + "ch " + sampleRate + "hz: " + fullPath);
            sbPlayClip(clip);
        } catch (e) { console.log("[Soundboard] wav error: " + e); }
    }
    function playSoundboardFile(fullPath) {
        try {
            if (fullPath == null || fullPath.length === 0) return;
            if (fullPath.length > 2 && fullPath[0] === '"' && fullPath[fullPath.length - 1] === '"') {
                fullPath = fullPath.substring(1, fullPath.length - 1);
            }
            ensureAudioClasses();
            const lower = fullPath.toLowerCase();
            if (lower.endsWith(".mp3")) sbPlayMp3(fullPath);
            else if (lower.endsWith(".wav")) sbPlayWav(fullPath);
            else console.log("[Soundboard] unsupported type: " + fullPath);
        } catch (e) {
            console.error("playSoundboardFile failed: " + e);
        }
    }
    function sbFixMic() {
        try {
            const recs = sbGetRecorders();
            for (const r of recs) {
                try {
                    r.method("set_SourceType").invoke(0);
                    r.method("set_MicrophoneType").invoke(0);
                    r.method("set_RecordingEnabled").invoke(true);
                    r.method("set_TransmitEnabled").invoke(true);
                    r.method("set_VoiceDetection").invoke(true);
                    try { r.method("set_AudioClip", 1).invoke(ptr("0")); } catch (_) { }
                    try { r.method("RestartRecording").invoke(); } catch (_) { }
                } catch (_) { }
            }
            if (sbLocalSrc != null && !sbLocalSrc.isNull()) {
                try { sbLocalSrc.method("Stop", 0).invoke(); } catch (_) { }
                try { sbLocalSrc.method("set_clip", 1).invoke(ptr("0")); } catch (_) { }
            }
            sbClipUntil = 0.0;
            sbPending = null;
            sbPendingDh = null;
            console.log("[Soundboard] mic restored, recorders=" + recs.length);
        } catch (e) { console.log("[Soundboard] fix mic error: " + e); }
    }
    function sbStopSounds() {
        try {
            sbPending = null;
            sbPendingDh = null;
            micMixBuffer = null;
            sbClipUntil = 0.0;
            if (sbLocalSrc != null && !sbLocalSrc.isNull()) {
                try { sbLocalSrc.method("Stop", 0).invoke(); } catch (_) { }
                try { sbLocalSrc.method("set_clip", 1).invoke(ptr("0")); } catch (_) { }
            }
            try {
                if (AudioSourceClass != null) {
                    const srcs = Object.method("FindObjectsOfType").inflate(AudioSourceClass).invoke();
                    for (let i = 0; i < srcs.length; i++) {
                        try {
                            const s = srcs.get(i);
                            if (s != null && !s.isNull() && s.method("get_isPlaying").invoke()) {
                                s.method("Stop", 0).invoke();
                            }
                        } catch (_) { }
                    }
                }
            } catch (_) { }
            if (micPlayEnabled) {
                const recs = sbGetRecorders();
                for (const r of recs) {
                    try {
                        r.method("set_SourceType").invoke(0);
                        r.method("set_AudioClip", 1).invoke(ptr("0"));
                        r.method("set_RecordingEnabled").invoke(true);
                        r.method("set_TransmitEnabled").invoke(true);
                        r.method("RestartRecording").invoke();
                    } catch (_) { }
                }
                micPlayEnabled = false;
                const playOnMic = buttonMap.get("Play on Mic");
                if (playOnMic) playOnMic.enabled = false;
            }
            console.log("[Soundboard] stopped all sounds, mic restored");
        } catch (e) { console.log("[Soundboard] stop error: " + e); }
    }
    function sbPollPending() {
        try {
            if (sbPending != null) {
                try {
                    const req = sbPending;
                    if (!req.method("get_isDone").invoke()) return;
                    const resObj = req.method("get_result").invoke();
                    let result = NaN;
                    try { result = Number(resObj.field("value__").value); } catch (_) { }
                    if (result === 1) {
                        const dh = sbPendingDh;
                        const clip = dh != null ? dh.method("get_audioClip").invoke() : null;
                        sbPending = null;
                        sbPendingDh = null;
                        if (clip != null && !clip.isNull()) {
                            sbPlayClip(clip);
                        } else {
                            console.log("[Soundboard] load ok but clip null");
                        }
                    } else {
                        let err = "?";
                        try { err = String(req.method("get_error").invoke()); } catch (_) { }
                        console.log("[Soundboard] load failed result=" + result + " error=" + err);
                        sbPending = null;
                        sbPendingDh = null;
                    }
                } catch (e) {
                    sbPending = null;
                    sbPendingDh = null;
                    console.log("[Soundboard] poll error: " + e);
                }
            }
            if (micPlayEnabled && sbClipUntil > 0 && time >= sbClipUntil) {
                sbFixMic();
            }
        } catch (_) { }
    }
    function listMp3Files(dirPath) {
        const out = [];
        try {
            if (DirectoryClass != null) {
                try {
                    const exists = DirectoryClass.method("Exists", 1).invoke(Il2Cpp.string(dirPath));
                    if (!exists) return out;
                } catch (_) { }
                for (const pattern of ["*.mp3", "*.MP3", "*.wav", "*.WAV"]) {
                    try {
                        const arr = DirectoryClass.method("GetFiles", 2).invoke(Il2Cpp.string(dirPath), Il2Cpp.string(pattern));
                        if (arr == null) continue;
                        for (let i = 0; i < arr.length; i++) {
                            try {
                                const s = arr.get(i).content;
                                if (s && s.length > 0) out.push(s);
                            } catch (_) { }
                        }
                    } catch (_) { }
                }
                if (out.length === 0) {
                    try {
                        const arr = DirectoryClass.method("GetFiles", 1).invoke(Il2Cpp.string(dirPath));
                        if (arr != null) {
                            for (let i = 0; i < arr.length; i++) {
                                try {
                                    const s = arr.get(i).content;
                                    if (s && s.length > 0 && /\.(mp3|wav)$/i.test(s)) out.push(s);
                                } catch (_) { }
                            }
                        }
                    } catch (_) { }
                }
            }
        } catch (e) {
            console.error("listMp3Files (System.IO) failed: " + e);
        }
        const seen = new Set();
        const result = [];
        for (const f of out) { if (!seen.has(f)) { seen.add(f); result.push(f); } }
        return result;
    }
    function scanSoundboard() {
        try {
            const candidates = [];
            let primaryDir = "";
            try {
                const pdp = ApplicationClass.method("get_persistentDataPath").invoke().content;
                if (pdp && pdp.length > 0) {
                    primaryDir = pdp + "/soundboard";
                    candidates.push(primaryDir);
                }
            } catch (_) { }
            candidates.push("/sdcard/Android/data/com.Flixzy.Bwah/files/soundboard");
            candidates.push("/storage/emulated/0/Android/data/com.Flixzy.Bwah/files/soundboard");
            candidates.push("/sdcard/soundboard");
            candidates.push("/storage/emulated/0/soundboard");
            try {
                if (DirectoryClass != null) {
                    for (const c of candidates) {
                        try { DirectoryClass.method("CreateDirectory", 1).invoke(Il2Cpp.string(c)); } catch (_) { }
                    }
                }
            } catch (_) { }
            soundboardFiles = [];
            soundboardDir = "";
            const seenFiles = new Set();
            for (const dir of candidates) {
                let files = [];
                try { files = listMp3Files(dir); } catch (_) { files = []; }
                if (files.length > 0) {
                    if (soundboardDir.length === 0) soundboardDir = dir;
                    for (const f of files) {
                        if (!seenFiles.has(f)) { seenFiles.add(f); soundboardFiles.push(f); }
                    }
                }
            }
            soundboardFiles.sort();
            // The first four slots belong to (Exit Soundboard, Refresh Soundboard, Play on Mic, Fix Mic).
            while (buttons[13].length > 3) { buttons[13].pop(); }
            if (soundboardFiles.length === 0) {
                buttons[13].push(new ButtonInfo({
                    buttonText: "No MP3s Found",
                    method: () => { scanSoundboard(); reloadMenu(); },
                    keepOn: false,
                    toolTip: "refresh"
                }));
                console.log("[Soundboard] No mp3 files found. Drop mp3s into: " + (primaryDir || "/sdcard/Android/data/com.Flixzy.Bwah/files/soundboard"));
            } else {
                for (const full of soundboardFiles) {
                    let display = full.replace(/\\/g, "/").split("/").pop() || full;
                    display = display.replace(/\.(mp3|wav)$/i, "");
                    if (display.length > 20) display = display.substring(0, 20);
                    const f = full;
                    buttons[13].push(new ButtonInfo({
                        buttonText: display,
                        method: () => { playSoundboardFile(f); },
                        keepOn: false,
                        toolTip: "Play sound",
                    }));
                }
                console.log("[Soundboard] Found " + soundboardFiles.length + " audio file(s) in " + soundboardDir);
            }
            buttonMap = new Map();
            buttons.flat().forEach(button => {
                buttonMap.set(button.buttonText, button);
            });
        } catch (e) {
            console.error("scanSoundboard failed: " + e);
        }
    }


  const OVRInputHandler = new XRInputHandler();

  const arial = Resources
    .method("GetBuiltinResource", 1)
    .inflate(Font)
    .invoke(Il2Cpp.string("Arial.ttf"));
  function spinbot() {
      getTransform(camera).method("set_rotation").invoke(Quaternion.method("Euler").invoke(0.0, time * 800.0, 0.0));
  }

  function OpenStaff() {
    const AllBoxColliders = Object.method("FindObjectsOfType").inflate(BoxCollider).invoke();
    for (let i = 0; i < AllBoxColliders.length; i++) {
      const Colid = AllBoxColliders.get(i);
      if (Colid.method("get_name").invoke().toString().includes("Cube")) {
        Colid.method("set_enabled").invoke(false);
      }
    }

    const objectsToDestroy = [
      "miroorcolideryeee",
      "hahahahahhahahhaheheheh",
      "AFJHDSUFHSDIUHHDSIUFHSIDOOR",
      "thingcol",
      "Cube (5)", "Plane", "Cube (9)", "Plane (1)", "Cube (3)", "Cube (4)", "Cube (6)",
      "Plane (2)", "Plane (3)", "Cube (7)", "Plane (5)", "Cube (12)", "Plane (4)", "Cube (10)",
      "Plane (6)", "Plane (7)", "Plane (9)", "Plane (8)", "Plane (10)", "Cube (11)", "Plane (11)",
      "Plane (9)",
      "Cube (8)", "Plane (12)", "Plane (13)", "Plane (14)", "Plane (15)", "Plane (16)",
      "Plane (17)", "Plane (18)", "Plane (19)", "Plane (20)", "Cube (13)"
    ];

    for (let i = 0; i < objectsToDestroy.length; i++) {
      Destroy(GameObject.method("Find").invoke(Il2Cpp.string(objectsToDestroy[i])));
    }
  }


  function Destroy(object) {
    Object.method("Destroy", 1).invoke(object);
  }

  function getComponent(obj: any, type) {
    return obj.method("GetComponent", 1).inflate(type).invoke();
  }

  function addComponent(obj: any, type) {
    return obj.method("AddComponent", 1).inflate(type).invoke();
  }

  function getTransform(obj: any) {
    return obj.method("get_transform").invoke();
  }

  function sendAllOutgoing() { PhotonNetwork.method("SendAllOutgoingCommands").invoke(); }

    function hsl2Rgb(h, s, l) {
    s /= 100;
    l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [
      Math.round(255 * f(0)),
      Math.round(255 * f(8)),
      Math.round(255 * f(4))
    ];
  }

  function renderMenuText(canvasObject, text: string = "", color: [number, number, number, number] = [1, 1, 1, 1], pos = zeroVector, size = oneVector) {
    const title = addComponent(createObject(zeroVector, identityQuaternion, oneVector, 3, [0, 0, 0, 0], getTransform(canvasObject)), Text);
    getComponent(title, BoxCollider).method("set_isTrigger").invoke(true);
    title.method("set_text").invoke(Il2Cpp.string(text));
    title.method("set_font").invoke(arial);
    title.method("set_fontSize").invoke(1);
    title.method("set_color").invoke(color);
    title.method("set_fontStyle").invoke(2);
    title.method("set_alignment").invoke(4);
    title.method("set_resizeTextForBestFit").invoke(true);
    title.method("set_resizeTextMinSize").invoke(0);

    const rectTransform = getComponent(title, RectTransform);
    rectTransform.method("set_sizeDelta").invoke(size);
    rectTransform.method("set_position").invoke(pos);
    rectTransform.method("set_rotation").invoke(Quaternion.method("Euler").invoke(180.0, 90.0, 90.0))
  }

  function getSmoothColor() {
    hue = (hue + 0.5) % 360;
    const [r, g, b] = hsl2Rgb(hue, 100, 50);
    return { r: r / 255, g: g / 255, b: b / 255, a: 1.0 };
  }
  
  function createObject(
    pos = zeroVector,
    rot = identityQuaternion,
    scale = oneVector,
    primitiveType: number = 3,
    colorArr: [number, number, number, number] = [1, 1, 1, 1],
    parent = null
  ) {
    const obj = GameObject.method("CreatePrimitive").invoke(primitiveType);

    const renderer = getComponent(obj, Renderer);

    if (colorArr[3] == 0) {
      renderer.method("set_enabled").invoke(false);
    } else {
      const material = renderer.method("get_material").invoke();
      material.method("set_shader").invoke(MenuShader);
      material.method("set_color").invoke(colorArr);
    }

    const transform = getTransform(obj);
    if (parent != null) {
      transform.method("SetParent", 2).invoke(parent, false);
    }

    transform.method("set_position").invoke(pos);
    transform.method("set_rotation").invoke(rot);
    transform.method("set_localScale").invoke(scale);

    return obj;
  }

  function renderMenu() {
    buttonsList = [];

    menu = createObject(zeroVector, identityQuaternion, [0.1, 0.3, 0.3825], 3, [0, 0, 0, 0]);
    Destroy(getComponent(menu, BoxCollider))

    const menuBackground = createObject([0.1, 0, 0], identityQuaternion, [0.1, 1, 1], 3, bgColor, getTransform(menu))
        Destroy(getComponent(menuBackground, BoxCollider))


    const canvasObject = createObject(zeroVector, identityQuaternion, oneVector, 3, [0, 0, 0, 0], getTransform(menu));
    const canvas = addComponent(canvasObject, Canvas);
    Destroy(getComponent(canvasObject, BoxCollider))

    const canvasScaler = addComponent(canvasObject, CanvasScaler);
    addComponent(canvasObject, GraphicRaycaster);
    try {
        canvas.method("set_renderMode").invoke(2);
    } catch (_) {}
    canvasScaler.method("set_dynamicPixelsPerUnit").invoke(1000.0);

    const homeButton = createObject([0.1, -0.175, -0.225], identityQuaternion, [0.09, 0.09, 0.09], 3, buttonColor, getTransform(menu));
    homeButton.method("set_name").invoke(Il2Cpp.string("@Home"));
    getComponent(homeButton, BoxCollider).method("set_isTrigger").invoke(true);
    renderMenuText(canvasObject, "<", textColor, [0.11, -0.175, -0.225], [0.15, 0.15]);
    buttonsList.push({
        obj: homeButton,
        data: { buttonText: "<", keepOn: false, method: () => { currentCategory = 0; currentPage = 0; } }
    });

    const leaveButton = createObject([0.1, 0.0, 0.225], identityQuaternion, [0.09, 0.9, 0.08], 3, buttonColor, getTransform(menu));
        leaveButton.method("set_name").invoke(Il2Cpp.string("@Leave"));
    getComponent(leaveButton, BoxCollider).method("set_isTrigger").invoke(true);
    renderMenuText(canvasObject, "Disconnect", textColor, [0.11, 0, 0.225], [0.4, 0.4]);
    buttonsList.push({
        obj: leaveButton,
        data: { buttonText: "Disconnect", keepOn: false, method: () => PhotonNetwork.method("LeaveRoom", 1).invoke(true) }
    });

        renderMenuText(canvasObject, menuName + ` - Page <color=grey>[</color> ${currentPage + 1} <color=grey>]</color>`, textColor, [0.11, 0, 0.166], [0.95, .1]);

    const pagePrev = createObject([0.1, 0.2, 0], identityQuaternion, [0.09, 0.2, 0.9], 3, buttonColor, getTransform(menu));
        pagePrev.method("set_name").invoke(Il2Cpp.string("@PreviousPage"));
    getComponent(pagePrev, BoxCollider).method("set_isTrigger").invoke(true);
    renderMenuText(canvasObject, "<", textColor, [0.12, 0.2, 0], [1, 0.1]);
    buttonsList.push({
        obj: pagePrev,
        data: {
            buttonText: "PreviousPage",
            keepOn: false,
            method: () => {
                const lastPage = Math.ceil(buttons[currentCategory].length / 8) - 1;
                currentPage--;
                if (currentPage < 0) currentPage = lastPage;
            }
        }
    });

    const pageNext = createObject([0.1, -0.2, 0], identityQuaternion, [0.09, 0.2, 0.9], 3, buttonColor, getTransform(menu));
       pageNext.method("set_name").invoke(Il2Cpp.string("@NextPage"));
    getComponent(pageNext, BoxCollider).method("set_isTrigger").invoke(true);
    renderMenuText(canvasObject, ">", textColor, [0.12, -0.2, 0], [1, 0.1]);
    buttonsList.push({
        obj: pageNext,
        data: {
            buttonText: "NextPage",
            keepOn: false,
            method: () => {
                const lastPage = Math.ceil(buttons[currentCategory].length / 8) - 1;
                currentPage++;
                currentPage %= (lastPage + 1);
            }
        }
    });

    let i = 0;
    const targetMods = buttons[currentCategory].slice(currentPage * 8).slice(0, 8);

    targetMods.forEach((buttonData) => {
        const button = createObject([0.105, 0, 0.13 - (i * 0.04)], identityQuaternion, [0.09, 0.9, 0.08], 3, buttonColor, getTransform(menu));
        
        button.method("set_name").invoke(Il2Cpp.string("@" + buttonData.buttonText));
        getComponent(button, BoxCollider).method("set_isTrigger").invoke(true);
        renderMenuText(canvasObject, buttonData.buttonText, textColor, [0.11, 0, 0.134 - (i * 0.04)], [1, 0.066]);
        renderMenuText(canvasObject, "(" + buttonData.toolTip + ")", textColor, [0.11, 0, 0.1185 - (i * 0.04)], [1, 0.026]);
        updateButtonColor(button, buttonData);

        buttonsList.push({
            obj: button,
            data: buttonData
        });
        i++;
    });

    recenterMenu();
  }

  function renderReference() {
    reference = createObject(zeroVector, identityQuaternion, [0.01, 0.01, 0.01], 0, bgColor, rightHandTransform)
    referenceCollider = getComponent(reference, Collider);

    getTransform(reference).method("set_localPosition").invoke([-0.03, -0.05, 0.14]);
    reference.method("set_layer").invoke(2);
    addComponent(reference, Rigidbody).method("set_isKinematic").invoke(true);
  }

  let gunLocked = false;
  let lockTarget = null;
  let GunPointer = null;
  let GunLine = null;

  function renderGun(overrideLayerMask = null) {
    const StartPosition = rightHandTransform.method("get_position").invoke();
    const Direction = rightHandTransform.method("get_forward").invoke();
    const DirectionDivided = Vector3.method("op_Division").invoke(Direction, 4);
    const rayStartPosition = Vector3.method("op_Addition").invoke(StartPosition, DirectionDivided);
    const layerMask = overrideLayerMask || -3180559;

    const hits = Physics.method("RaycastAll", 4).invoke(rayStartPosition, Direction, 512.0, layerMask);
    let finalDistance = Infinity;
    let finalRay = null;
    for (const hit of hits) {
      const distance = Vector3.method("Distance").invoke(hit.method("get_point").invoke(), StartPosition);
      if (distance < finalDistance) {
        finalRay = hit;
        finalDistance = distance;
      }
    }

    let EndPosition;
    if (gunLocked) {
      EndPosition = getTransform(lockTarget).method("get_position").invoke();
    } else {
      EndPosition = finalRay.method("get_point").invoke();
    }

    if (Vector3.method("op_Equality").invoke(EndPosition, zeroVector)) {
      const farDirection = Vector3.method("op_Multiply").invoke(Direction, 512);
      EndPosition = Vector3.method("op_Addition").invoke(StartPosition, farDirection);
    }

    if (GunPointer == null) {
      GunPointer = createObject(EndPosition, identityQuaternion, [0.1, 0.1, 0.1], 0, [1, 1, 1, 1]);
    }

    GunPointer.method("SetActive").invoke(true);
    const pointerTransform = getTransform(GunPointer);
    pointerTransform.method("set_position").invoke(EndPosition);

    const PointerRenderer = getComponent(GunPointer, Renderer);
    const material = PointerRenderer.method("get_material").invoke();
    material.method("set_shader").invoke(TextShader);

    const pointerColor = (gunLocked || rightTrigger) ? buttonPressedColor : buttonColor;
    material.method("set_color").invoke(pointerColor);

    const collider = getComponent(GunPointer, Collider);
    if (collider != null) {
      Destroy(collider);
    }
    return { ray: finalRay, gunPointer: GunPointer };
  }

  function recenterMenu() {
    let menuPosition = leftHandTransform.method("get_position").invoke();
    let menuRotation = leftHandTransform.method("get_rotation").invoke();
    menuRotation = Quaternion.method("op_Multiply", 2).invoke(menuRotation, Quaternion.method("Euler").invoke(0, 0, 0))

    const menuTransform = getTransform(menu);
    menuTransform.method("set_position").invoke(menuPosition);
    menuTransform.method("set_rotation").invoke(menuRotation);
  }

  function reloadMenu() {
    if (menu != null) {
      Object.method("Destroy", 1).invoke(menu);
      menu = null;
      buttonsList = [];
    }
  }

  function updateButtonColor(button, buttonData) {
    const RendererClass = Il2Cpp.domain
      .assembly("UnityEngine.CoreModule")
      .image
      .class("UnityEngine.Renderer");

    const renderer = getComponent(button, RendererClass);
    if (!renderer) return;

    const material = renderer.method("get_material").invoke();
    material.method("set_color").invoke(buttonData.enabled ? buttonPressedColor : buttonColor);
  }

  interface ButtonInfoConfig {
    buttonText: string;
    toolTip: string;
    method?: () => void;
    enableMethod?: () => void;
    disableMethod?: () => void;
    keepOn?: boolean;
    enabled?: boolean;
  }

  class ButtonInfo {
    buttonText: string;
    toolTip: string;
    method?: () => void;
    enableMethod?: () => void;
    disableMethod?: () => void;
    keepOn: boolean;
    enabled: boolean;

    constructor(config: ButtonInfoConfig) {
      this.buttonText = config.buttonText;
      this.toolTip = config.toolTip;
      this.method = config.method;
      this.enableMethod = config.enableMethod;
      this.disableMethod = config.disableMethod;
      this.keepOn = config.keepOn ?? true;
      this.enabled = config.enabled ?? false;
    }
  }

  let currentCategory = 0;
  let currentPage = 0;

  //#region Mods
  let flyspeed = 8.0;
  let ghost = false;
  let spawnedRig = null;

  function UpAndDown () {
                if (rightTrigger) {
                    rigidbody.method("set_velocity").invoke([0.0, 12.0, 0.0]);
                }
                else if (rightGrab) {
                    rigidbody.method("set_velocity").invoke([0.0, -12.0, 0.0]);
                }
  }

  function Fly() {
    if (rightSecondary) {
      rigidbody.method("set_velocity").invoke(Vector3.field("zeroVector").value);
      const transform = getTransform(GorillaTagger);
      let forward = getTransform(rightHandTransform).method("get_forward").invoke();
      let position = transform.method("get_position").invoke();
      forward = Vector3.method("op_Multiply", 2).invoke(forward, flyspeed * deltaTime);
      position = Vector3.method("op_Addition", 2).invoke(position, forward);
      transform.method("set_position").invoke(position);
    }
  }

  function Velofly() {
    if (rightSecondary) {
      let forward = getTransform(rightHandTransform).method("get_forward").invoke();
      forward = Vector3.method("op_Multiply", 2).invoke(forward, flyspeed * 7.0 * deltaTime);
      rigidbody.method("AddForce", 2).invoke(forward, 2);
    }
  }

function DestroyGun() {
 if (rightGrab) {
  const gD = renderGun();
  const r = gD.ray;

  if (rightTrigger && r != null) {
   try {
    const hO = r.method("get_collider").invoke().method("get_gameObject").invoke();
    let pV = null;
    let cObj = hO;

    for (let i = 0; i < 8; i++) {
     try {
      const comps = cObj.method("GetComponents", 1).inflate(Component).invoke();
      for (let c = 0; c < comps.length; c++) {
       const cmp = comps.get(c);
       const tN = cmp.method("GetType", 0).invoke().method("get_Name").invoke().toString();
       
       if (tN.includes("PhotonView") || tN.includes("PhotonVRPlayer")) {
        pV = cmp;
        break;
       }
      }
      if (pV) break;

      cObj = getTransform(cObj).method("get_parent").invoke().method("get_gameObject").invoke();
     } catch (err) {
      break;
     }
    }

    if (pV) {
     PhotonNetwork.method("SetMasterClient").invoke(PhotonNetwork.method("get_LocalPlayer").invoke());
     const own = pV.method("get_Owner").invoke();
     if (own) {
      PhotonNetwork.method("DestroyPlayerObjects").invoke(own);
      sendAllOutgoing();
     }
    }
   } catch (err) {}
  }
 }
}

function getinfogun() {
 if (rightGrab) {
  const gD = renderGun();
  const r = gD.ray;

  if (rightTrigger && r != null) {
   try {
    const hO = r.method("get_collider").invoke().method("get_gameObject").invoke();
    let pV = null;
    let cObj = hO;

    for (let i = 0; i < 8; i++) {
     try {
      const comps = cObj.method("GetComponents", 1).inflate(Component).invoke();
      for (let c = 0; c < comps.length; c++) {
       const cmp = comps.get(c);
       const tN = cmp.method("GetType", 0).invoke().method("get_Name").invoke().toString();
       
       if (tN.includes("PhotonView") || tN.includes("PhotonVRPlayer")) {
        pV = cmp;
        break;
       }
      }
      if (pV) break;

      cObj = getTransform(cObj).method("get_parent").invoke().method("get_gameObject").invoke();
     } catch (err) {
      break;
     }
    }

    if (pV) {
     const own = pV.method("get_Owner").invoke();
     if (own) {
       let target = own;
       let nn = target.method("get_NickName").invoke();
        let userid = target.method("get_UserId").invoke();
        let mc = target.method("get_IsMasterClient").invoke();
        console.log("Nickname: " + nn.toString());
        console.log("UserID: " + userid.toString());
        console.log("Is masterclient: " + mc.toString());
      sendAllOutgoing();
     }
    }
   } catch (err) {}
  }
 }
}
  function headfly() {
    if (rightSecondary && rigidbody) {
      rigidbody.method("set_velocity").invoke(Vector3.field("zeroVector").value);
      const transform = getTransform(GorillaTagger);
      let forward = getTransform(camera).method("get_forward").invoke();
      let position = transform.method("get_position").invoke();
      forward = Vector3.method("op_Multiply", 2).invoke(forward, flyspeed * deltaTime);
      position = Vector3.method("op_Addition", 2).invoke(position, forward);
      transform.method("set_position").invoke(position);
    }
  }

  function GhostRig() {
    if (rightSecondary) {
      const now = Date.now();
      if (now - lastRunTime >= 500) {
        lastRunTime = now;
        ghost = !ghost;
        const getManagerMethod = PhotonVRManager.method("get_Manager");
        const managerInstance = getManagerMethod.invoke();
        const localPlayer = managerInstance.field("LocalPlayer").value;
        localPlayer.method("set_enabled").invoke(!ghost);
      }
    }
  }

 let ghostlag = false;

  function fakelag() {
      const now = Date.now();
      if (now - lastRunTime >= 170) {
        lastRunTime = now;
        ghostlag = !ghostlag;
        const getManagerMethod = PhotonVRManager.method("get_Manager");
        const managerInstance = getManagerMethod.invoke();
        const localPlayer = managerInstance.field("LocalPlayer").value;
        localPlayer.method("set_enabled").invoke(!ghostlag);
      }
  }

  function InvisRig() {
    if (rightSecondary) {
      const now = Date.now();
      if (now - lastRunTime >= 500) {
        lastRunTime = now;
        ghost = !ghost;

        if (ghost) {
          if (spawnedRig != null) {
            PhotonNetwork.method("Destroy").invoke(
              PhotonNetwork.method("get_LocalPlayer").invoke()
            );
            spawnedRig = null;
          }
        } else {
          if (spawnedRig == null) {
            spawnedRig = PhotonNetwork.method("Instantiate", 5).invoke(
              Il2Cpp.string("photonvr/Player"),
              getTransform(headCollider).method("get_position").invoke(),
              identityQuaternion,
              0,
              NULL
            );
            sendAllOutgoing();
          }
        }
      }
    }
  }

  let platColor: [number, number, number, number] = [0.0, 0.0, 0.0, 1.0];
  const platColors: [number, number, number, number][] = [
    [0.0, 0.0, 0.0, 1.0], [9.0, 9.0, 9.0, 1.0], [9.0, 0.0, 0.0, 1.0],
    [0.0, 9.0, 0.0, 1.0], [0.0, 0.0, 9.0, 1.0], [5.0, 5.0, 0.0, 1.0], [9.0, 0.5, 9.0, 1.0]
  ];
  let platL = null;
  let platR = null;
  let plater = 0;

  function Platforms() {
    if (leftGrab) {
      if (platL == null) {
        const handTransform = leftHandTransform;
        platL = createObject(Vector3.method("op_Addition", 2).invoke(handTransform.method("get_position").invoke(), [0.01, -0.035, 0.0]), handTransform.method("get_rotation").invoke(), [0.025, 0.25, 0.3], 3, bgColor);
      }
    } else {
      if (platL != null) { Destroy(platL); platL = null; }
    }

    if (rightGrab) {
      if (platR == null) {
        const handTransform = rightHandTransform;
        platR = createObject(Vector3.method("op_Addition", 2).invoke(handTransform.method("get_position").invoke(), [0.0, -0.035, 0.0]), handTransform.method("get_rotation").invoke(), [0.025, 0.25, 0.3], 3, bgColor);
      }
    } else {
      if (platR != null) { Destroy(platR); platR = null; }
    }
  }

  function Platformssphere() {
    if (leftGrab) {
      if (platL == null) {
        const handTransform = leftHandTransform;
        platL = createObject(Vector3.method("op_Addition", 2).invoke(handTransform.method("get_position").invoke(), [0.0, -0.035, 0.0]), handTransform.method("get_rotation").invoke(), [0.12, 0.12, 0.12], 0, platColor);
      }
    } else {
      if (platL != null) { Destroy(platL); platL = null; }
    }

    if (rightGrab) {
      if (platR == null) {
        const handTransform = rightHandTransform;
        platR = createObject(Vector3.method("op_Addition", 2).invoke(handTransform.method("get_position").invoke(), [0.0, -0.035, 0.0]), handTransform.method("get_rotation").invoke(), [0.12, 0.12, 0.12], 0, platColor);
      }
    } else {
      if (platR != null) { Destroy(platR); platR = null; }
    }
  }

  function Noclip() {
    if (rightTrigger && !previousNoclipKey) toggleColliders(false);
    if (!rightTrigger && previousNoclipKey) toggleColliders(true);
    previousNoclipKey = rightTrigger;
  }

  function toggleColliders(enabled) {
    const meshColliders = Object.method("FindObjectsOfType").inflate(MeshCollider).invoke();
    for (let i = 0; i < meshColliders.length; i++) {
      meshColliders.get(i).method("set_enabled").invoke(enabled);
    }
  }

  function dumpServerInfo(): void {
    const PlayFabSettingsClass = Il2Cpp.domain.assembly("PlayFab").image.class("PlayFabSharedSettings");
    let settingsInstance: any = null;
    try {
      const instances = Il2Cpp.gc.choose(PlayFabSettingsClass);
      if (instances.length > 0) settingsInstance = instances[0];
    } catch (_) {}

    if (!settingsInstance) {
      try {
        console.log("[PlayFab] TitleId (via getter): " + PlayFabSettingsClass.method("get_TitleId").invoke());
      } catch (_) {}
    } else {
      console.log("[PlayFab] TitleId: " + settingsInstance.field("TitleId").value);
    }
  }

  function RigSpam() {
    if (rightGrab) {
      const now = Date.now();
      if (now - lastRunTime >= 0.1) {
        lastRunTime = now;
        const clonedrig = PhotonNetwork.method("Instantiate", 5).invoke(Il2Cpp.string("PhotonVR/Player"), getTransform(headCollider).method("get_position").invoke(), identityQuaternion, 0, NULL);
        const getManagerMethod = PhotonVRManager.method("get_Manager");
        const managerInstance = getManagerMethod.invoke();
        const localPlayer = managerInstance.field("LocalPlayer").value;
        localPlayer.method("set_enabled").invoke(false);


      sendAllOutgoing()
      }
    }
  }

  function rigbs() {
    if (rightGrab) {
      const gunData = renderGun();
      if (rightTrigger) {
        const pos = getTransform(gunData.gunPointer).method("get_position").invoke()
        const clonedrig = PhotonNetwork.method("Instantiate", 5).invoke(Il2Cpp.string("PhotonVR/OnlinePlayerRig"), pos, identityQuaternion, 0, NULL);
        const getManagerMethod = PhotonVRManager.method("get_Manager");
        const managerInstance = getManagerMethod.invoke();
        const localPlayer = managerInstance.field("LocalPlayer").value;
        localPlayer.method("set_enabled").invoke(false);

        sendAllOutgoing()
      }
    }
  }

 
  function spambs() {
    if (rightGrab) {
      const now = Date.now();
      if (now - lastRunTime >= 0.1) {
        lastRunTime = now;
        const clonedrig = PhotonNetwork.method("Instantiate", 5).invoke(Il2Cpp.string("photonvr/OnlinePlayerRig"), getTransform(headCollider).method("get_position").invoke(), identityQuaternion, 0, NULL);
        const getManagerMethod = PhotonVRManager.method("get_Manager");
        const managerInstance = getManagerMethod.invoke();
        const localPlayer = managerInstance.field("LocalPlayer").value;
        localPlayer.method("set_enabled").invoke(false);


      sendAllOutgoing()
      }
    }
  }

  function lagallplr() {
    if (rightGrab) {
        Destroy(PhotonNetwork.method("Instantiate", 5).invoke(Il2Cpp.string("photonvr/OnlinePlayerRig"), [400.0, -400.0, 0.0], identityQuaternion, 0, NULL));

      sendAllOutgoing()

    }
  }

let skibidi = false;

  function spawnrig() {
    if (rightGrab && skibidi) {
      const now = Date.now();
      if (now - lastRunTime >= 0.1) {
        lastRunTime = now;
        const clonedrig = PhotonNetwork.method("Instantiate", 5).invoke(Il2Cpp.string("PhotonVR/Player"), getTransform(headCollider).method("get_position").invoke(), identityQuaternion, 0, NULL);
        const getManagerMethod = PhotonVRManager.method("get_Manager");
        const managerInstance = getManagerMethod.invoke();
        const localPlayer = managerInstance.field("LocalPlayer").value;
        localPlayer.method("set_enabled").invoke(false);


      sendAllOutgoing()
      }
    }
    skibidi = !rightGrab;
  }

  function RigGun() {
    if (rightGrab) {
      const gunData = renderGun();
      if (rightTrigger) {
        const pos = getTransform(gunData.gunPointer).method("get_position").invoke()
        const clonedrig = PhotonNetwork.method("Instantiate", 5).invoke(Il2Cpp.string("PhotonVR/Player"), pos, identityQuaternion, 0, NULL);
        const getManagerMethod = PhotonVRManager.method("get_Manager");
        const managerInstance = getManagerMethod.invoke();
        const localPlayer = managerInstance.field("LocalPlayer").value;
        localPlayer.method("set_enabled").invoke(false);

        sendAllOutgoing()
      }
    }
  }

  function PrefabGun(spawnId: string) {
    if (rightGrab) {
      const gunData = renderGun();
      if (rightTrigger) {
        const pos = getTransform(gunData.gunPointer).method("get_position").invoke()
        PhotonNetwork.method("Instantiate", 5).invoke(Il2Cpp.string(spawnId), pos, identityQuaternion, 0, NULL);
        sendAllOutgoing()
      }
    }
  }

  function ObjGun(OBJ: string) {
    if (rightGrab) {
      const gunData = renderGun();
      if (rightTrigger) {
        const obj = GameObject.method("Find").invoke(Il2Cpp.string(OBJ))
        const pos = getTransform(gunData.gunPointer).method("get_position").invoke()
        getTransform(obj).method("set_position").invoke(pos)
      }
    }
  }

  function PlrObj(OBJ: string) {
        const obj = GameObject.method("Find").invoke(Il2Cpp.string(OBJ))
        let pos = getTransform(GameObject.method("Find").invoke(Il2Cpp.string("GorillaPlayer")))
             .method("get_position")
             .invoke();

        const offset = [0, 0, -2];

        pos = Vector3.method("op_Addition", 2)
             .invoke(pos, offset);

         getTransform(obj)
             .method("set_position")
             .invoke(pos);
  }

  function CrashAll() {
    for (let i = 0; i < 1500; i++) {
      Destroy(PhotonNetwork.method("Instantiate", 5).invoke(Il2Cpp.string("Hellephant"), [400.0, -400.0, 0.0], identityQuaternion, 0, NULL));
    }
    sendAllOutgoing()
  }

  function CrashAllz() {
    for (let i = 0; i < 1500; i++) {
      Destroy(PhotonNetwork.method("Instantiate", 5).invoke(Il2Cpp.string("photonvr/zomb"), [400.0, -400.0, 0.0], identityQuaternion, 0, NULL));
      Destroy(PhotonNetwork.method("Instantiate", 5).invoke(Il2Cpp.string("photonvr/zomb2"), [400.0, -400.0, 0.0], identityQuaternion, 0, NULL));
    }
    sendAllOutgoing()
  }

  let size = 1.0;

  function scalearms() {
       const playerTransform = getTransform(GorillaTagger); 
       playerTransform.method("set_localScale").invoke([size, size, size]);
       if (rightTrigger) {
           if (size < 4.5) {
               size += 0.1;
           } else {
               size = 4.5;
           }
       }
       if (leftTrigger) {
           if (size > 0.2) {
               size -= 0.1;
           } else {
               size = 0.2;
           }
       }
  }


  function lagz() {
    if (rightTrigger) {
      for (let i = 0; i < 100; i++) {
        Destroy(PhotonNetwork.method("Instantiate", 5).invoke(Il2Cpp.string("photonvr/zomb"), [400.0, -400.0, 0.0], identityQuaternion, 0, NULL));
        Destroy(PhotonNetwork.method("Instantiate", 5).invoke(Il2Cpp.string("photonvr/zomb2"), [400.0, -400.0, 0.0], identityQuaternion, 0, NULL));
      }
    }
    sendAllOutgoing()
  }

  function nameAll() {
    const others = PhotonNetwork.method("get_PlayerListOthers").invoke();
    if (others && others.length > 0) {
      for (let i = 0; i < others.length; i++) {
        PhotonNetwork.method("SetMasterClient").invoke(PhotonNetwork.method("get_LocalPlayer").invoke());
        others.get(i).method("set_NickName").invoke(Il2Cpp.string("MODDED"));
        
      }
    }
  }

  function logAll() {
    console.log("== LOG STARTED == ");
    const others = PhotonNetwork.method("get_PlayerListOthers").invoke();
    if (others && others.length > 0) {
      for (let i = 0; i < others.length; i++) {
        let target = others.get(i);
        let nn = target.method("get_NickName").invoke();
        let userid = target.method("get_UserId").invoke();
        let mc = target.method("get_IsMasterClient").invoke();
        console.log("Nickname: " + nn.toString());
        console.log("UserID: " + userid.toString());
        console.log("Is masterclient: " + mc.toString());
        console.log("-----------------------------------")
      }
    }
  }

  function rgb() {
      const color = getSmoothColor();
      PhotonVRManager.method("SetColour").invoke([color.r, color.g, color.b, color.a]);
  }

  function strobe() {
      shouldbeblack = !shouldbeblack;
      if (shouldbeblack) {
          PhotonVRManager.method("SetColour").invoke([0.0, 0.0, 0.0, 1.0]);
      } else {
          PhotonVRManager.method("SetColour").invoke([1.0, 1.0, 1.0, 1.0]);

      }
  }

  function strobename() {
      shouldbeblack = !shouldbeblack;
      if (shouldbeblack) {
          PhotonNetwork.method("set_NickName").invoke(Il2Cpp.string("          "));
      } else {
          PhotonNetwork.method("set_NickName").invoke(Il2Cpp.string("WWWWWWWWWW"));

      }
  }

  function brightrgb() {
      const color = getSmoothColor();
      PhotonVRManager.method("SetColour").invoke([color.r * 3, color.g * 3, color.b * 3, color.a * 99999]);
  }

    function brightwhite() {
      PhotonVRManager.method("SetColour").invoke([9999, 9999, 9999, 9999]);
  }

  function OwnerSpoof() {
    PhotonNetwork.method("Update").implementation = function() {
            try {
              this.method("Update").invoke();
              const rankData = this.field("rankData").value;
              if (!rankData) return;
              rankData.field("IsOwner").value     = true;
              rankData.field("IsModerator").value = true;
            } catch(e) {}
          };

          const gameData = AssemblyCSharp.class("GameData").field("instance").value;

          const ventEntrance = gameData.field("moderatorVentEntrance").value;
          if (ventEntrance) {
            Object.method("Destroy").invoke(ventEntrance, 0);
          }

          const enableWhenMod = gameData.field("enableWhenMod").value;
          for (let i = 0; i < enableWhenMod.length; i++) {
            const obj = enableWhenMod.get(i);
            if (obj) {
              obj.method("SetActive").invoke(true);
            }
          }
  }

  function checkButtonPressesManual() {
    if (!menu || buttonsList.length === 0 || !reference) return;

    const refPos = getTransform(reference).method("get_position").invoke();
    const now = Time.method("get_time").invoke();

    const refX = refPos.field("x").value;
    const refY = refPos.field("y").value;
    const refZ = refPos.field("z").value;

    let shouldReloadLayout = false;

    for (let i = 0; i < buttonsList.length; i++) {
        const button = buttonsList[i];
        const btnPos = getTransform(button.obj).method("get_position").invoke();
        
        const btnX = btnPos.field("x").value;
        const btnY = btnPos.field("y").value;
        const btnZ = btnPos.field("z").value;

        const dx = refX - btnX;
        const dy = refY - btnY;
        const dz = refZ - btnZ;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 0.06 && now > buttonClickDelay) {
            buttonClickDelay = now + 0.3;

            const btnData = button.data;

            if (btnData.keepOn) {
                btnData.enabled = !btnData.enabled;
                updateButtonColor(button.obj, btnData);
            } else {
                btnData.method?.();
                shouldReloadLayout = true;
            }
            break;
        }
    }

    if (shouldReloadLayout) {
        reloadMenu();
        renderMenu();
    }
  }

  const buttons: ButtonInfo[][] = [
    [ // Home
      new ButtonInfo({ buttonText: "Settings", toolTip: "Opens the Settings page", method: () => currentCategory = 2, keepOn: false }),
      new ButtonInfo({ buttonText: "Movement", toolTip: "Opens the Movement page", method: () => currentCategory = 3, keepOn: false }),
      new ButtonInfo({ buttonText: "Color", toolTip: "Opens the Color page", method: () => currentCategory = 9, keepOn: false }),
      new ButtonInfo({ buttonText: "Name", toolTip: "Opens the Misc page", method: () => currentCategory = 10, keepOn: false }),
      new ButtonInfo({ buttonText: "Misc", toolTip: "Opens the Misc page", method: () => currentCategory = 4, keepOn: false }),
      new ButtonInfo({ buttonText: "Fun", toolTip: "Opens the Fun page", method: () => currentCategory = 11, keepOn: false }),
      new ButtonInfo({ buttonText: "Custom Soundboard", toolTip: "Opens the Soundboard page", method: () => { scanSoundboard(); currentCategory = 13; currentPage = 0 }, keepOn: false }),
      new ButtonInfo({ buttonText: "Rig", toolTip: "Opens the Rig page", method: () => currentCategory = 5, keepOn: false }),
      new ButtonInfo({ buttonText: "Big Scary", toolTip: "Opens the Big Scary page", method: () => currentCategory = 8, keepOn: false }),
      new ButtonInfo({ buttonText: "OP", toolTip: "Opens the OP page", method: () => currentCategory = 6, keepOn: false }),
      new ButtonInfo({ buttonText: "Prefab (NW)", toolTip: "Opens the Prefab page", method: () => currentCategory = 7, keepOn: false }),
      new ButtonInfo({ buttonText: "Testing", toolTip: "Opens the Testing page", method: () => currentCategory = 12, keepOn: false }),
    ],
    [], // Category 1 unused structural slot
    [ // Settings
      new ButtonInfo({ buttonText: "Add fly speed", toolTip: "Increases the fly speed by 1", method: () => flyspeed += 1, keepOn: false }),
      new ButtonInfo({ buttonText: "Decrease fly speed", toolTip: "Decreases the fly speed by 1", method: () => flyspeed -= 1, keepOn: false }),
      new ButtonInfo({ buttonText: "Reset fly speed", toolTip: "Sets the fly speed to 8", method: () => flyspeed = 8.0, keepOn: false }),
            new ButtonInfo({
                buttonText: "Change Menu Theme",
                method: () => {
                    themeIndex++;
                    themeIndex %= 11;

                    switch (themeIndex) {
                        case 0:
                            bgColor = [1.0, 0.5, 0.0, 1.0];
                            textColor = [1.0, 0.7450981, 0.4901961, 1.0];

                            buttonColor = [0.666, 0.333, 0.0, 1.0];
                            buttonPressedColor = [0.333, 0.150, 0.0, 1.0];

                            break;
                        case 1:
                            bgColor = [1.0, 0.0, 0.0, 1.0];
                            textColor = [1.0, 1.0, 1.0, 1.0];

                            buttonColor = [0.0, 0.0, 0.0, 1.0];
                            buttonPressedColor = [1.0, 0.0, 0.0, 1.0];

                            break;
                        case 2:
                            bgColor = [0.0, 1.0, 0.0, 1.0];
                            textColor = [1.0, 1.0, 1.0, 1.0];

                            buttonColor = [0.0, 0.0, 0.0, 1.0];
                            buttonPressedColor = [0.0, 1.0, 0.0, 1.0];

                            break;
                        case 3:
                            bgColor = [0.0, 0.0, 1.0, 1.0];
                            textColor = [1.0, 1.0, 1.0, 1.0];

                            buttonColor = [0.0, 0.0, 0.0, 1.0];
                            buttonPressedColor = [0.0, 0.0, 1.0, 1.0];

                            break;
                        case 4:
                            bgColor = [0.5, 0.0, 0.5, 1.0];
                            textColor = [1.0, 0.9, 1.0, 1.0];

                            buttonColor = [0.25, 0.0, 0.25, 1.0];
                            buttonPressedColor = [0.7, 0.0, 0.7, 1.0];

                            break;
                        case 5:
                            bgColor = [0.0, 0.7, 0.7, 1.0];
                            textColor = [1.0, 0.2, 0.8, 1.0];

                            buttonColor = [0.0, 0.3, 0.3, 1.0];
                            buttonPressedColor = [1.0, 0.0, 0.7, 1.0];

                            break;
                        case 6:
                            bgColor = [0.9, 0.7, 0.1, 1.0];
                            textColor = [0.0, 0.0, 0.0, 1.0];

                            buttonColor = [0.2, 0.2, 0.2, 1.0];
                            buttonPressedColor = [1.0, 0.84, 0.0, 1.0];

                            break;
                        case 7:
                            bgColor = [0.7, 0.9, 1.0, 1.0];
                            textColor = [0.1, 0.2, 0.4, 1.0];

                            buttonColor = [0.5, 0.7, 0.9, 1.0];
                            buttonPressedColor = [0.2, 0.4, 0.8, 1.0];

                            break;
                        case 8:
                            bgColor = [0.6, 0.0, 0.0, 1.0];
                            textColor = [1.0, 0.7, 0.2, 1.0];

                            buttonColor = [0.2, 0.0, 0.0, 1.0];
                            buttonPressedColor = [1.0, 0.3, 0.0, 1.0];

                            break;
                        case 9:
                            bgColor = [0.05, 0.05, 0.1, 1.0];
                            textColor = [0.6, 0.8, 1.0, 1.0];

                            buttonColor = [0.1, 0.1, 0.2, 1.0];
                            buttonPressedColor = [0.4, 0.6, 1.0, 1.0];

                            break;
                        case 10:
                            bgColor = [0.125, 0.125, 0.125, 1.0];
                            textColor = [1.0, 1.0, 0.9, 1.0];

                            buttonColor = [0.111, 0.111, 0.222, 1.0];
                            buttonPressedColor = [0.111, 0.111, 0.67, 1.0];

                            break;
                        case 11:
                            bgColor = [0.055, 0.018, 0.095, 0.98];
                            textColor = [1, 1, 1, 1];

                            buttonColor = [0.16, 0.055, 0.25, 1];
                            buttonPressedColor = [0.54, 0.18, 0.78, 1];

                            break;
                    }
                },
                keepOn: false,
                toolTip: "Changes the theme of the menu."
            }),
    ],
    [ // Movement Mods
      new ButtonInfo({ buttonText: "Fly [B]", toolTip: "Fly with your right hand using B", method: () => Fly() }),
      new ButtonInfo({ buttonText: "Velocity Fly [B]", toolTip: "Fly with your right hand using B", method: () => Velofly() }),
      new ButtonInfo({ buttonText: "Head Fly [B]", toolTip: "Fly with your head using B", method: () => headfly() }),
      new ButtonInfo({ buttonText: "No Tag Freeze", method: () => GTPlayer.field("disableMovement").value = false, toolTip: "Disables tag freeze on your character.", }),
      new ButtonInfo({ buttonText: "Force Tag Freeze", method: () => GTPlayer.field("disableMovement").value = true, toolTip: "Enables tag freeze on your character.", }),
      new ButtonInfo({ buttonText: "Iron Man [G]", method: () => { if (leftGrab) { const leftRightVector = leftHandTransform.method("get_right").invoke(); const leftForce = Vector3.method("op_Multiply", 2).invoke(leftRightVector, -15.0 * deltaTime); rigidbody.method("AddForce", 2).invoke(leftForce, 2); } if (rightGrab) { const leftRightVector = rightHandTransform.method("get_right").invoke(); const leftForce = Vector3.method("op_Multiply", 2).invoke(leftRightVector, 15.0 * deltaTime); rigidbody.method("AddForce", 2).invoke(leftForce, 2); } }, toolTip: "Use your grip buttons to fly like ironman"}),
      new ButtonInfo({ buttonText: "Dash", method: () => { if (rightPrimary && !previousDash) { const leftRightVector = getTransform(headCollider).method("get_forward").invoke(); const leftForce = Vector3.method("op_Multiply", 2).invoke(leftRightVector, 10.0); rigidbody.method("AddForce", 2).invoke(leftForce, 2); } previousDash = rightPrimary; }, toolTip: "Flings your character forwards when pressing A." }),
      new ButtonInfo({ buttonText: "Up And Down [T]", toolTip: "Go Up And Down Using Your Trigger Buttons", method: () => UpAndDown() }),
      new ButtonInfo({ buttonText: "Platforms [G]", toolTip: "Spawn platforms underneath your hands using Grip", method: () => Platforms() }),
      new ButtonInfo({ buttonText: "Sphere Platforms [G]", toolTip: "Spawn sphere platforms underneath your hands using Grip", method: () => Platformssphere() }),
      new ButtonInfo({ buttonText: "Toggle Zero Gravity", toolTip: "Toggles Zero Gravity", method: () => rigidbody.method("set_useGravity").invoke(!rigidbody.method("get_useGravity").invoke()), keepOn: false }),
      new ButtonInfo({ buttonText: "Low Gravity", toolTip: "Makes gravity lower on your character", method: () => { const force = Vector3.method("op_Multiply", 2).invoke(Vector3.field("upVector").value, (deltaTime * (6.66 / deltaTime))); rigidbody.method("AddForce", 2).invoke(force, 5); } }),
      new ButtonInfo({ buttonText: "High Gravity", toolTip: "Makes gravity higher on your character", method: () => { const force = Vector3.method("op_Multiply", 2).invoke(Vector3.field("upVector").value, (deltaTime * (-6.66 / deltaTime))); rigidbody.method("AddForce", 2).invoke(force, 5); } }),
new ButtonInfo({ buttonText: "Reverse Gravity", toolTip: "Reverses your gravity", method: () => { const force = Vector3.method("op_Multiply", 2).invoke(Vector3.field("upVector").value, (deltaTime * (15.6 / deltaTime))); rigidbody.method("AddForce", 2).invoke(force, 5); } }),
      new ButtonInfo({ buttonText: "No Clip [T]", toolTip: "Go through objects using right trigger", method: () => Noclip() }),
      new ButtonInfo({ buttonText: "SpeedBoost", toolTip: "Become Fast\n(Max Jump Speed)", method: () => GTPlayer.field("maxJumpSpeed").value = 9.0 }),
      new ButtonInfo({ buttonText: "Faster speedBoost", toolTip: "Become Faster\n(Max Jump Speed)", method: () => GTPlayer.field("maxJumpSpeed").value = 20.0 }),
      new ButtonInfo({ buttonText: "Very High speedBoost", toolTip: "Become even faster\n(Max Jump Speed)", method: () => GTPlayer.field("maxJumpSpeed").value = 50.0 }),

    ],
    [ // Misc Mods
new ButtonInfo({buttonText: "Dump Title ID", toolTip: "Dumps the titleID and prints it in the console", method: () => dumpServerInfo(), keepOn: false  }),
new ButtonInfo({buttonText: "Join Random", toolTip: "Joins a radom room", method: () => PhotonNetwork.method("JoinRandomRoom").invoke(), keepOn: false  }),
new ButtonInfo({buttonText: "Get Player Info Gun", toolTip: "logs userid, nickname, and if is masterclient", method: () => getinfogun(), keepOn: true  }),
new ButtonInfo({buttonText: "Log Everyones Info", toolTip: "logs userid, nickname, and if is masterclient", method: () => logAll(), keepOn: false  }),
            new ButtonInfo({
                buttonText: "72 FPS",
                method: () => {
                    const targetDelta = 1 / 72;
                    const elapsed = Time.method("get_realtimeSinceStartup").invoke() - lastTime;
                    if (elapsed < targetDelta) {
                        const sleepMs = Math.floor((targetDelta - elapsed) * 1000);
                        if (sleepMs > 0)
                            Thread.method("Sleep").invoke(sleepMs);
                    }
                    lastTime = Time.method("get_realtimeSinceStartup").invoke();
                },
                keepOn: true,
                toolTip: "Caps your FPS at 72 frames per second."
            }),

            new ButtonInfo({
                buttonText: "60 FPS",
                method: () => {
                    const targetDelta = 1 / 60;
                    const elapsed = Time.method("get_realtimeSinceStartup").invoke() - lastTime;
                    if (elapsed < targetDelta) {
                        const sleepMs = Math.floor((targetDelta - elapsed) * 1000);
                        if (sleepMs > 0)
                            Thread.method("Sleep").invoke(sleepMs);
                    }
                    lastTime = Time.method("get_realtimeSinceStartup").invoke();
                },
                keepOn: true,
                toolTip: "Caps your FPS at 60 frames per second."
            }),

            new ButtonInfo({
                buttonText: "45 FPS",
                method: () => {
                    const targetDelta = 1 / 45;
                    const elapsed = Time.method("get_realtimeSinceStartup").invoke() - lastTime;
                    if (elapsed < targetDelta) {
                        const sleepMs = Math.floor((targetDelta - elapsed) * 1000);
                        if (sleepMs > 0)
                            Thread.method("Sleep").invoke(sleepMs);
                    }
                    lastTime = Time.method("get_realtimeSinceStartup").invoke();
                },
                keepOn: true,
                toolTip: "Caps your FPS at 45 frames per second."
            }),

    ],
    [ // Rig Mods
      new ButtonInfo({ buttonText: "Ghost Rig",  toolTip: "Freezes the player rig if you press B", method: () => GhostRig() }),
      new ButtonInfo({ buttonText: "Invis Rig", toolTip: "Makes the player go invisible if you press b", method: () => InvisRig() }),
      new ButtonInfo({ buttonText: "Long Arms", toolTip: "Makes your rig big", method: () => {size = 1.3; scalearms();}, keepOn: false }),
      new ButtonInfo({ buttonText: "Scale Arms", toolTip: "Right Trigger = longer arms, Left Trigger = Shorter Arms", method: () => scalearms() }),
      new ButtonInfo({ buttonText: "Reset long arms", toolTip: "Resets size", method: () => {size = 1.0; scalearms();}, keepOn: false }),
      new ButtonInfo({ buttonText: "Spin bot", toolTip: "Spins your body on y axis", method: () => spinbot(), keepOn: true }),
      new ButtonInfo({ buttonText: "Spaz rig", toolTip: "Spins your body on all axis", method: () => {const randomX = Math.random() * 360; const randomY = Math.random() * 360; const randomZ = Math.random() * 360; const cam = GameObject.method("Find").invoke(Il2Cpp.string("MainCamera")); if (!cam) return; cam.method("get_transform").invoke().method("set_rotation").invoke(Quaternion.method("Euler").invoke(randomX, randomY, randomZ));}, keepOn: true }),
    ],
    [ // OP Mods
      new ButtonInfo({ buttonText: "Set Master", toolTip: "Sets you as the master client", method: () => PhotonNetwork.method("SetMasterClient").invoke(PhotonNetwork.method("get_LocalPlayer").invoke()), keepOn: false }),
      new ButtonInfo({ buttonText: "Spawn Rig", toolTip: "Spawns your rig", method: () => spawnrig() }),
      new ButtonInfo({ buttonText: "Rig Spam", toolTip: "Spams your rig", method: () => RigSpam() }),
      new ButtonInfo({ buttonText: "Rig Gun", toolTip: "spawns the rig at pointer pos", method: () => RigGun() }),
      new ButtonInfo({ buttonText: "Crash All", toolTip: "Crashes everyone", method: () => CrashAll(), keepOn: false }),
      new ButtonInfo({ buttonText: "Destroy All", toolTip: "Destroys all", method: () => PhotonNetwork.method("DestroyAll").invoke(), keepOn: false }),
      new ButtonInfo({ buttonText: "Destroy Player Gun", toolTip: "Destroys whoever your hand desires", method: () => DestroyGun(), keepOn: true }),
      new ButtonInfo({ buttonText: "Rename All", toolTip: "Sets everyones name to MODDED", method: () => nameAll(), keepOn: true }),
      new ButtonInfo({ buttonText: "Spoof Player ID", toolTip: "Spoofs the photon playerID", method: () => PhotonNetwork.method("set_UserId").invoke(Il2Cpp.string("MODDED BY JASC JOIN https://discord.gg/3rRHcQU2tH")), keepOn: false }),
      new ButtonInfo({ buttonText: "Auto Spoof Player ID", toolTip: "Spoofs the photon playerID", method: () => PhotonNetwork.method("set_UserId").invoke(Il2Cpp.string("MODDED BY JASC JOIN https://discord.gg/3rRHcQU2tH")), keepOn: true }),
      new ButtonInfo({
        buttonText: "Lock Server",
        method: () => {
          PhotonNetwork.method("get_CurrentRoom").invoke().method("set_Name").invoke(Il2Cpp.string("discord.gg/3rRHcQU2tH"));
          PhotonNetwork.method("get_CurrentRoom").invoke().method("set_IsOpen").invoke(false);
          PhotonNetwork.method("get_CurrentRoom").invoke().method("set_IsVisible").invoke(false);
        },
        keepOn: false,
        toolTip: "Locks the server so nobody can join.",
      }),
      new ButtonInfo({
        buttonText: "Unlock Server",
        method: () => {
          PhotonNetwork.method("get_CurrentRoom").invoke().method("set_IsOpen").invoke(true);
          PhotonNetwork.method("get_CurrentRoom").invoke().method("set_IsVisible").invoke(true);
        },
        keepOn: false,
        toolTip: "Opens the server back up.",
      }),
      new ButtonInfo({
        buttonText: "Auto Lock Server",
        method: () => {
          PhotonNetwork.method("get_CurrentRoom").invoke().method("set_Name").invoke(Il2Cpp.string("discord.gg/3rRHcQU2tH"));
          PhotonNetwork.method("get_CurrentRoom").invoke().method("set_IsOpen").invoke(false);
          PhotonNetwork.method("get_CurrentRoom").invoke().method("set_IsVisible").invoke(false);
        },
        keepOn: true,
        toolTip: "Automatically locks the server so nobody can join.",
      }),
      new ButtonInfo({
        buttonText: "Auto Unlock Server",
        method: () => {
          PhotonNetwork.method("get_CurrentRoom").invoke().method("set_IsOpen").invoke(true);
          PhotonNetwork.method("get_CurrentRoom").invoke().method("set_IsVisible").invoke(true);
        },
        keepOn: true,
        toolTip: "Automatically opens the server back up.",
      }),
      new ButtonInfo({
        buttonText: "Make room public",
        method: () => {
          PhotonNetwork.method("get_CurrentRoom").invoke().method("set_Name").invoke(Il2Cpp.string("214"));
          PhotonNetwork.method("get_CurrentRoom").invoke().method("set_IsOpen").invoke(true);
          PhotonNetwork.method("get_CurrentRoom").invoke().method("set_IsVisible").invoke(true);
        },
        keepOn: false,
        toolTip: "Automatically opens the server back up.",
      }),
    ],
    [ // Prefabs
      new ButtonInfo({ buttonText: "kyle Gun", toolTip: "Spawn the said prefab with your gun", method: () => PrefabGun("my robot kyle -done-") }),
      new ButtonInfo({ buttonText: "ZomBear Gun", toolTip: "Spawn the said prefab with your gun", method: () => PrefabGun("ZomBear") }),
      new ButtonInfo({ buttonText: "ZomBunny Gun", toolTip: "Spawn the said prefab with your gun", method: () => PrefabGun("ZomBunny") }),
      new ButtonInfo({ buttonText: "Boy Gun", toolTip: "Spawn the said prefab with your gun", method: () => PrefabGun("Boy") }),
      new ButtonInfo({ buttonText: "Hellephant Gun", toolTip: "Spawn the said prefab with your gun", method: () => PrefabGun("Hellephant") }),
      new ButtonInfo({ buttonText: "Character Gun", toolTip: "Spawn the said prefab with your gun", method: () => PrefabGun("Character") }),
      new ButtonInfo({ buttonText: "Spaceship Gun", toolTip: "Spawn the said prefab with your gun", method: () => PrefabGun("Spaceship") }),
      new ButtonInfo({ buttonText: "BigAsteroid Gun", toolTip: "Spawn the said prefab with your gun", method: () => PrefabGun("BigAsteroid") }),
      new ButtonInfo({ buttonText: "SmallAsteroid Gun", toolTip: "Spawn the said prefab with your gun", method: () => PrefabGun("SmallAsteroid") }),
    ],
    [ // Big Scary Mods
      new ButtonInfo({ buttonText: "Rig Spam [G]", toolTip: "Spams your rig", method: () => spambs() }),
      new ButtonInfo({ buttonText: "Rig Gun [G]", toolTip: "spawns the rig at pointer pos", method: () => rigbs() }),
//
      new ButtonInfo({ buttonText: "Open Staff", toolTip: "opens the staff mirror", method: () => OpenStaff(), keepOn: false }),
      new ButtonInfo({ buttonText: "Zomb 2 gun", toolTip: "spawns zomb 2 using the gun", method: () => PrefabGun("photonvr/zomb2") }),
      new ButtonInfo({ buttonText: "Zomb gun", toolTip: "spawns zomb 2 using the gun", method: () => PrefabGun("photonvr/zomb") }),
      new ButtonInfo({ buttonText: "Turret gun", toolTip: "spawns zomb 2 using the gun", method: () => PrefabGun("Turret") }),
      new ButtonInfo({ buttonText: "Extraction Zombie gun", toolTip: "spawns zomb 2 using the gun", method: () => PrefabGun("PhotonVR/Extraction_ZombieBoss") }),
      new ButtonInfo({ buttonText: "Crash All (Z)", toolTip: "Crashes everyone (Using zombies) (Broken)", method: () => CrashAllz(), keepOn: false }),
      new ButtonInfo({ buttonText: "Lag All (Z) [RG]", toolTip: "Hold right grip to lag everyone (Using zombies) (Doesnt work)", method: () => lagz(), keepOn: true }),
      new ButtonInfo({ buttonText: "Lag All (PLR) [RG]", toolTip: "Hold right grip to lag everyone (Using ur rig) (breaks game)", method: () => lagallplr(), keepOn: true }),
      new ButtonInfo({ buttonText: "lvl 1 monster gun", toolTip: "teleports lvl 1 monster to gun pointer", method: () => {PhotonNetwork.method("SetMasterClient").invoke(PhotonNetwork.method("get_LocalPlayer").invoke()); ObjGun("NAV1");}, keepOn: true }),
      new ButtonInfo({ buttonText: "lvl 2 monster gun", toolTip: "teleports lvl 2 monster to gun pointer", method: () => {PhotonNetwork.method("SetMasterClient").invoke(PhotonNetwork.method("get_LocalPlayer").invoke()); ObjGun("NAV2");}, keepOn: true }),
      new ButtonInfo({ buttonText: "lvl 3 monster gun", toolTip: "teleports lvl 3 monster to gun pointer", method: () => {PhotonNetwork.method("SetMasterClient").invoke(PhotonNetwork.method("get_LocalPlayer").invoke()); ObjGun("NAV3");}, keepOn: true }),
      new ButtonInfo({ buttonText: "lvl 4 monster gun", toolTip: "teleports lvl 4 monster to gun pointer", method: () => {PhotonNetwork.method("SetMasterClient").invoke(PhotonNetwork.method("get_LocalPlayer").invoke()); ObjGun("NAV4");}, keepOn: true }),
      new ButtonInfo({ buttonText: "lvl 5 monster gun", toolTip: "teleports lvl 5 monster to gun pointer", method: () => {PhotonNetwork.method("SetMasterClient").invoke(PhotonNetwork.method("get_LocalPlayer").invoke()); ObjGun("NAV5");}, keepOn: true }),
      new ButtonInfo({ buttonText: "lvl 6 monster gun", toolTip: "teleports lvl 6 monster to gun pointer", method: () => {PhotonNetwork.method("SetMasterClient").invoke(PhotonNetwork.method("get_LocalPlayer").invoke()); ObjGun("NAV6");}, keepOn: true }),
    ],
    [ // Color
      new ButtonInfo({buttonText: "RGB (May Crash)", toolTip: "Makes the player color rainbow", method: () => rgb() }),
      new ButtonInfo({buttonText: "Strobe B/W (May Crash)", toolTip: "Makes the player color strobe b/w", method: () => strobe() }),
      new ButtonInfo({buttonText: "White", toolTip: "Makes the player color white", method: () => brightwhite(), keepOn: false }),
      new ButtonInfo({buttonText: "Red", toolTip: "Makes the player color red", method: () => PhotonVRManager.method("SetColour").invoke([9999, 0, 0, 9999]), keepOn: false }),
      new ButtonInfo({buttonText: "Green", toolTip: "Makes the player color green", method: () => PhotonVRManager.method("SetColour").invoke([0, 9999, 0, 9999]), keepOn: false }),
      new ButtonInfo({buttonText: "Blue", toolTip: "Makes the player color blue", method: () => PhotonVRManager.method("SetColour").invoke([0, 0, 9999, 9999]), keepOn: false }),
    ],
    [ // Names
      new ButtonInfo({ buttonText: "J0kerModZ Name", toolTip: "Changes the player name", method: () => PhotonNetwork.method("set_NickName").invoke(Il2Cpp.string("J0KERMODZ")) }),
      new ButtonInfo({ buttonText: "JaSC Name", toolTip: "Changes the player name", method: () => PhotonNetwork.method("set_NickName").invoke(Il2Cpp.string("JASC")) }),
      new ButtonInfo({ buttonText: "Meme Name", toolTip: "Changes the player name", method: () => PhotonNetwork.method("set_NickName").invoke(Il2Cpp.string("67 420 1738")) }),
      new ButtonInfo({ buttonText: "Space Name", toolTip: "Changes the player name", method: () => PhotonNetwork.method("set_NickName").invoke(Il2Cpp.string("           ")) }),
      new ButtonInfo({ buttonText: "Big Scary Name", toolTip: "Changes the player name", method: () => PhotonNetwork.method("set_NickName").invoke(Il2Cpp.string("BIG SCARY")) }),
      new ButtonInfo({ buttonText: "Big Scary Name", toolTip: "Changes the player name", method: () => PhotonNetwork.method("set_NickName").invoke(Il2Cpp.string("BIG SCARY")) }),
      new ButtonInfo({ buttonText: "owner Name", toolTip: "Changes the player name", method: () => PhotonNetwork.method("set_NickName").invoke(Il2Cpp.string("OFFICIAL OWNER")) }),
      new ButtonInfo({ buttonText: "MODDED BY JASC Name", toolTip: "Changes the player name", method: () => PhotonNetwork.method("set_NickName").invoke(Il2Cpp.string("MODDED BY JASC")) }),
      new ButtonInfo({ buttonText: "Discord Invite Name", toolTip: "Changes the player name", method: () => PhotonNetwork.method("set_NickName").invoke(Il2Cpp.string("3RRHCQU2TH")) }),
      new ButtonInfo({ buttonText: "Strobe Name", toolTip: "Changes the player name", method: () => strobename() }),
      new ButtonInfo({ buttonText: "Illegal Name 1", toolTip: "bitch", method: () => PhotonNetwork.method("set_NickName").invoke(Il2Cpp.string("BITCH")) }),
      new ButtonInfo({ buttonText: "Illegal Name 2", toolTip: "fuck", method: () => PhotonNetwork.method("set_NickName").invoke(Il2Cpp.string("FUCK")) }),
      new ButtonInfo({ buttonText: "Illegal Name 3", toolTip: "shit", method: () => PhotonNetwork.method("set_NickName").invoke(Il2Cpp.string("SHIT")) }),
      new ButtonInfo({ buttonText: "Illegal Name 4", toolTip: "porn", method: () => PhotonNetwork.method("set_NickName").invoke(Il2Cpp.string("PORN")) }),
      new ButtonInfo({ buttonText: "Illegal Name 5", toolTip: "pornhub", method: () => PhotonNetwork.method("set_NickName").invoke(Il2Cpp.string("PORNHUB")) }),
      new ButtonInfo({ buttonText: "Illegal Name 6", toolTip: "cum", method: () => PhotonNetwork.method("set_NickName").invoke(Il2Cpp.string("CUM")) }),
      new ButtonInfo({ buttonText: "Illegal Name 7", toolTip: "penis", method: () => PhotonNetwork.method("set_NickName").invoke(Il2Cpp.string("PENIS")) }),
      new ButtonInfo({ buttonText: "Illegal Name 8", toolTip: "dick", method: () => PhotonNetwork.method("set_NickName").invoke(Il2Cpp.string("DICK")) }),
      new ButtonInfo({ buttonText: "Illegal Name 9", toolTip: "dick", method: () => PhotonNetwork.method("set_NickName").invoke(Il2Cpp.string("DICK")) }),
    ],
    [ // Fun
      new ButtonInfo({ buttonText: "Fake Lag",  toolTip: "Freezes and unfreezes the player as if theyre lagging", method: () => fakelag() }),
      new ButtonInfo({ buttonText: "Become J0kerModZ", toolTip: "Changes the player name and color", method: () => { PhotonNetwork.method("set_NickName").invoke(Il2Cpp.string("J0KERMODZ")); PhotonVRManager.method("SetColour").invoke([0.9, 0.5, 0.9, 1]); }, keepOn: false }),
      new ButtonInfo({ buttonText: "Become JaSC", toolTip: "Changes the player name and color", method: () => { PhotonNetwork.method("set_NickName").invoke(Il2Cpp.string("JASC")); PhotonVRManager.method("SetColour").invoke([0.0, 0.9, 0.3, 1]); }, keepOn: false }),
      new ButtonInfo({ buttonText: "Become Wireless", toolTip: "Changes the player name and color", method: () => { PhotonNetwork.method("set_NickName").invoke(Il2Cpp.string("WIRELESS")); PhotonVRManager.method("SetColour").invoke([0.5, 0.0, 0.9, 1]); }, keepOn: false }),
new ButtonInfo({ buttonText: "Fix Player", toolTip: "Fixes rotation", method: () => { const plr = GameObject.method("Find").invoke(Il2Cpp.string("GorillaPlayer")); const trans = getTransform(plr); trans.method("set_rotation").invoke([0, 0, 0, 0]);}, keepOn: false }),
new ButtonInfo({ buttonText: "Upside down player", toolTip: "Reverses your gravity and makes you upside down", method: () => { const force = Vector3.method("op_Multiply", 2).invoke(Vector3.field("upVector").value, (deltaTime * (15.6 / deltaTime))); rigidbody.method("AddForce", 2).invoke(force, 5); const plr = GameObject.method("Find").invoke(Il2Cpp.string("GorillaPlayer")); const trans = getTransform(plr); trans.method("set_rotation").invoke([0, 0, 180, 0]);} }),

    ],
    [//Testing
      new ButtonInfo({
        buttonText: "Object Info Gun",
        method: () => {
          if (rightGrab) {
            const cn = renderGun(),
              co = cn.ray,
              collider = co.method("get_collider").invoke();
            if (rightTrigger && !perviousTeleportKey) {
              console.error("==LOGGING OBJECT==");
              console.error("name: " + collider.method("get_name").invoke().toString());
              console.error("Components:")
              const getComponentsResult = collider.method("GetComponents", 0).inflate(Component).invoke();
              for (let cr = 0; cr < getComponentsResult.length; cr++) {
                const cs = getComponentsResult.get(cr),
                  ct = cs.method("GetType", 0).invoke().method("get_Name").invoke().toString();
                console.error(ct);
              }
              console.error("==END OF LOG==");
            }
            perviousTeleportKey = rightTrigger;
          }
        },
        keepOn: true,
        toolTip: "Shoot objects to see their info.",
      }),
      new ButtonInfo({
        buttonText: "Get Position Gun",
        method: () => {
          if (rightGrab) {
            const cm = renderGun(),
              cn = cm.gunPointer;
            if (rightTrigger && !perviousTeleportKey) {
              console.error("==LOGGING OBJECT POS==");
              const position = getTransform(cn).method("get_position").invoke();
              console.error("Position: " + position.toString());
              console.error("==END OF LOG==");
            }
            perviousTeleportKey = rightTrigger;
          }
        },
        keepOn: true,
        toolTip: "Shoot to get coordinates.",
      }),
    ],
        [ // Custom Soundboard (14)
            new ButtonInfo({ buttonText: "Refresh Soundboard", toolTip: "refreshes sounds", method: () => { scanSoundboard(); reloadMenu(); }, keepOn: false }),
            new ButtonInfo({
                buttonText: "Play on Mic", toolTip: "plays on microphone",
                enableMethod: () => { micPlayEnabled = true; micMixBuffer = null; },
                disableMethod: () => {
                    micPlayEnabled = false;
                    micMixBuffer = null;
                    try { sbFixMic(); } catch (_) { }
                },
            }),
            new ButtonInfo({
                buttonText: "Fix Mic", toolTip: "stops all sounds",
                method: () => {
                    sbStopSounds();
                    reloadMenu();
                },
                keepOn: false,
            }),
        ],
  ];

    let buttonMap: Map<string, ButtonInfo> = new Map();
    buttons.flat().forEach(button => {
        buttonMap.set(button.buttonText, button);
    });

let idkwhattonamets = 0;

  const LateUpdate = GTPlayer.method("Update");

  LateUpdate.implementation = function () {
    OVRInputHandler.update();

    leftPrimary = OVRInputHandler.leftControllerPrimaryButton;
    leftSecondary = OVRInputHandler.leftControllerSecondaryButton;
    rightPrimary = OVRInputHandler.rightControllerPrimaryButton;
    rightSecondary = OVRInputHandler.rightControllerSecondaryButton;
    leftGrab = OVRInputHandler.leftGrab;
    rightGrab = OVRInputHandler.rightGrab;
    leftTrigger = OVRInputHandler.leftControllerTriggerButton;
    rightTrigger = OVRInputHandler.rightControllerTriggerButton;

    deltaTime = Time.method("get_deltaTime").invoke();
    time = Time.method("get_time").invoke();

    if (leftSecondary) {
      if (menu == null) {
        renderMenu();
      } else {
        recenterMenu();
      }
    } else {
      if (menu != null) {
idkwhattonamets++;
addComponent(menu, Rigidbody);
if (idkwhattonamets > 50) {
        Destroy(menu);
        menu = null;
        buttonsList = []; // Clean tracking lists up upon exit
        idkwhattonamets  = 0;
}
      }
    }

    if (menu == null) {
      if (reference != null) { Destroy(reference); reference = null; }
    } else {
      if (reference == null) renderReference();
    }

    if (menu && reference) {
      checkButtonPressesManual();
    }

    try {
      if (GunPointer != null) {
        if (!(GunPointer.method("get_activeSelf").invoke())) { Destroy(GunPointer); GunPointer = null; }
        else GunPointer.method("SetActive").invoke(false);
      }
    } catch { }

    buttons.flat()
      .filter(button => button.enabled)
      .forEach(button => {
        if (button.method) {
          try {
            button.method();
          } catch (error) {
            console.error(`Error executing method for button '${button.buttonText || 'unnamed'}':`, error);
          }
        }
      });

    return LateUpdate.invoke();
  };

}, "main");