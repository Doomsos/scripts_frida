const MENU_SCALE = 1.15;
const MENU_LAYER = 31;
const REFERENCE_LAYER = 2;
let rigidbody = null;
let lastRunTime = 0;
let buttonClickDelay = 0;
let menu_local = null;
let reference = null;
let referenceCollider = null;
let leftPrimary = false;
let leftSecondary = false;
let rightPrimary = false;
let rightSecondary = false;
let leftGrab = false;
let rightGrab = false;
let leftTrigger = false;
let rightTrigger = false;
let deltaTime = 0;
let time = 0;
let previousNoclipKey = false;
let framesSinceCameraFix = 0;
const THEMES = [
  { name: "Dark", bg: [0.08, 0.08, 0.08, 0.98], text: [0.95, 0.95, 0.95, 1], button: [0.15, 0.15, 0.15, 1], buttonPressed: [0.3, 0.3, 0.3, 1], outline: [0.15, 0.15, 0.15, 1], pageOutline: [0.2, 0.2, 0.2, 1], buttonOutline: [0.2, 0.2, 0.2, 1] },
  { name: "Blue", bg: [0.05, 0.07, 0.12, 0.98], text: [0.9, 0.95, 1, 1], button: [0.1, 0.16, 0.28, 1], buttonPressed: [0.16, 0.28, 0.45, 1], outline: [0.12, 0.2, 0.35, 1], pageOutline: [0.15, 0.25, 0.4, 1], buttonOutline: [0.15, 0.25, 0.4, 1] },
  { name: "Red", bg: [0.12, 0.05, 0.05, 0.98], text: [1, 0.92, 0.92, 1], button: [0.28, 0.1, 0.1, 1], buttonPressed: [0.45, 0.15, 0.15, 1], outline: [0.35, 0.12, 0.12, 1], pageOutline: [0.4, 0.15, 0.15, 1], buttonOutline: [0.4, 0.15, 0.15, 1] },
  { name: "Green", bg: [0.05, 0.1, 0.06, 0.98], text: [0.92, 1, 0.93, 1], button: [0.1, 0.22, 0.12, 1], buttonPressed: [0.16, 0.35, 0.18, 1], outline: [0.12, 0.28, 0.15, 1], pageOutline: [0.15, 0.32, 0.18, 1], buttonOutline: [0.15, 0.32, 0.18, 1] }
];
let themeIndex = 0;
let bgColor_local = THEMES[0].bg;
let textColor_local = THEMES[0].text;
let buttonColor = THEMES[0].button;
let buttonPressedColor = THEMES[0].buttonPressed;
let menuOutlineColor = THEMES[0].outline;
let pageOutlineColor = THEMES[0].pageOutline;
let buttonOutlineColor = THEMES[0].buttonOutline;
function applyTheme() {
  const t = THEMES[themeIndex];
  bgColor_local = t.bg;
  textColor_local = t.text;
  buttonColor = t.button;
  buttonPressedColor = t.buttonPressed;
  menuOutlineColor = t.outline;
  pageOutlineColor = t.pageOutline;
  buttonOutlineColor = t.buttonOutline;
}
const menuOutlineThickness = 9e-3 * MENU_SCALE;
const controlOutlineThickness = 75e-4 * MENU_SCALE;
const rowOutlineThickness = 65e-4 * MENU_SCALE;
const outlinesEnabled = true;
const rowButtonHeight = 0.06 * MENU_SCALE;
const rowButtonWidth = 0.61 * MENU_SCALE;
const rowButtonSpacing = 0.032 * MENU_SCALE;
const disconnectButtonWidth = 0.62 * MENU_SCALE;
const pageButtonWidth = 0.135 * MENU_SCALE;
const cornerRoundness = 0.28;
const titleWidth = 0.6 * MENU_SCALE;
const titleHeight = 0.057 * MENU_SCALE;
const menuOpenSpeed = 2.5;
const menuCloseSpeed = 3;
let menuAnimation = 0;
let menuClosing = false;
let currentPage = 0;
let currentCategory = -1;
const CATEGORY_NAMES = ["Theme", "Movement", "Account", "3D Models", "Soundboard"];
let nextButtonActivationId = 0;
class ButtonInfo {
  activationId;
  buttonText;
  method;
  enableMethod;
  disableMethod;
  isTogglable;
  enabled = false;
  constructor(config) {
    this.activationId = "spector_button_" + nextButtonActivationId++;
    this.buttonText = config.buttonText;
    this.method = config.method;
    this.enableMethod = config.enableMethod;
    this.disableMethod = config.disableMethod;
    this.isTogglable = config.isTogglable || false;
  }
}
let buttons = [];
class XRInputHandler {
  ovrGet;
  buttonStates;
  static BTN_ONE = 1;
  // A (right) / X (left)
  static BTN_TWO = 2;
  // B (right) / Y (left)
  static BTN_L_INDEX_TRIGGER = 8192;
  static BTN_L_HAND_TRIGGER = 16384;
  static BTN_R_INDEX_TRIGGER = 2097152;
  static BTN_R_HAND_TRIGGER = 4194304;
  static CTRL_LTOUCH = 1;
  static CTRL_RTOUCH = 2;
  constructor() {
    const OculusVR = Il2Cpp.domain.assembly("Oculus.VR").image;
    const OVRInputClass = OculusVR.class("OVRInput");
    this.ovrGet = OVRInputClass.method("Get", 2).overload("OVRInput.Button", "OVRInput.Controller");
    this.buttonStates = /* @__PURE__ */ new Map();
  }
  ovrButton(mask, controller) {
    try {
      return this.ovrGet.invoke(mask, controller);
    } catch (_) {
      return false;
    }
  }
  update() {
    this.buttonStates.set("leftPrimary", this.ovrButton(XRInputHandler.BTN_ONE, XRInputHandler.CTRL_LTOUCH));
    this.buttonStates.set("leftSecondary", this.ovrButton(XRInputHandler.BTN_TWO, XRInputHandler.CTRL_LTOUCH));
    this.buttonStates.set("rightPrimary", this.ovrButton(XRInputHandler.BTN_ONE, XRInputHandler.CTRL_RTOUCH));
    this.buttonStates.set("rightSecondary", this.ovrButton(XRInputHandler.BTN_TWO, XRInputHandler.CTRL_RTOUCH));
    this.buttonStates.set("leftGrab", this.ovrButton(XRInputHandler.BTN_L_HAND_TRIGGER, XRInputHandler.CTRL_LTOUCH));
    this.buttonStates.set("rightGrab", this.ovrButton(XRInputHandler.BTN_R_HAND_TRIGGER, XRInputHandler.CTRL_RTOUCH));
    this.buttonStates.set("leftTrigger", this.ovrButton(XRInputHandler.BTN_L_INDEX_TRIGGER, XRInputHandler.CTRL_LTOUCH));
    this.buttonStates.set("rightTrigger", this.ovrButton(XRInputHandler.BTN_R_INDEX_TRIGGER, XRInputHandler.CTRL_RTOUCH));
  }
  get leftControllerPrimaryButton() {
    return this.buttonStates.get("leftPrimary") || false;
  }
  get leftControllerSecondaryButton() {
    return this.buttonStates.get("leftSecondary") || false;
  }
  get rightControllerPrimaryButton() {
    return this.buttonStates.get("rightPrimary") || false;
  }
  get rightControllerSecondaryButton() {
    return this.buttonStates.get("rightSecondary") || false;
  }
  get leftGrab() {
    return this.buttonStates.get("leftGrab") || false;
  }
  get rightGrab() {
    return this.buttonStates.get("rightGrab") || false;
  }
  get leftControllerTriggerButton() {
    return this.buttonStates.get("leftTrigger") || false;
  }
  get rightControllerTriggerButton() {
    return this.buttonStates.get("rightTrigger") || false;
  }
}
Il2Cpp.perform(() => {
  const AssemblyCSharp = Il2Cpp.domain.assembly("Assembly-CSharp").image;
  const UnityEngineCore = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image;
  const UnityEnginePhysics = Il2Cpp.domain.assembly("UnityEngine.PhysicsModule").image;
  const UnityEngineUI = Il2Cpp.domain.assembly("UnityEngine.UI").image;
  const UnityEngineUIModule = Il2Cpp.domain.assembly("UnityEngine.UIModule").image;
  const PlayerControllerClass = AssemblyCSharp.class("Revel.PlayerController");
  const RoomAcousticsBlockClass = AssemblyCSharp.class("Revel.RoomAcousticsBlock");
  const GameObject = UnityEngineCore.class("UnityEngine.GameObject");
  const Object = UnityEngineCore.class("UnityEngine.Object");
  const Vector3 = UnityEngineCore.class("UnityEngine.Vector3");
  const Quaternion = UnityEngineCore.class("UnityEngine.Quaternion");
  const Time = UnityEngineCore.class("UnityEngine.Time");
  const Resources = UnityEngineCore.class("UnityEngine.Resources");
  const Renderer = UnityEngineCore.class("UnityEngine.Renderer");
  const Shader = UnityEngineCore.class("UnityEngine.Shader");
  const RectTransform = UnityEngineCore.class("UnityEngine.RectTransform");
  const BoxCollider = UnityEnginePhysics.class("UnityEngine.BoxCollider");
  const Collider = UnityEnginePhysics.class("UnityEngine.Collider");
  const MeshCollider = UnityEnginePhysics.class("UnityEngine.MeshCollider");
  const Rigidbody = UnityEnginePhysics.class("UnityEngine.Rigidbody");
  const Physics = UnityEnginePhysics.class("UnityEngine.Physics");
  const SystemIOFile = Il2Cpp.corlib.class("System.IO.File");
  const SystemIODirectory = Il2Cpp.corlib.class("System.IO.Directory");
  const CameraClass = UnityEngineCore.class("UnityEngine.Camera");
  function fixCameraCullingMasks() {
    try {
      const cameras = Object.method("FindObjectsOfType").inflate(CameraClass).invoke();
      let fixedCount = 0;
      for (let i = 0; i < cameras.length; i++) {
        try {
          const cam = cameras.get(i);
          const maskBefore = cam.method("get_cullingMask").invoke();
          if ((maskBefore & 1 << MENU_LAYER) === 0) cam.method("set_cullingMask").invoke(maskBefore | 1 << MENU_LAYER);
          fixedCount++;
        } catch (_) {
        }
      }
      return fixedCount;
    } catch (e) {
      return 0;
    }
  }
  const Canvas = UnityEngineUIModule.class("UnityEngine.Canvas");
  const CanvasScaler = UnityEngineUI.class("UnityEngine.UI.CanvasScaler");
  const GraphicRaycaster = UnityEngineUI.class("UnityEngine.UI.GraphicRaycaster");
  const Mesh = UnityEngineCore.class("UnityEngine.Mesh");
  const MeshFilter = UnityEngineCore.class("UnityEngine.MeshFilter");
  const UnityTextMeshPro = Il2Cpp.domain.assembly("Unity.TextMeshPro").image;
  const TextMeshProUGUIClass = UnityTextMeshPro.class("TMPro.TextMeshProUGUI");
  const TMP_FontAsset = UnityTextMeshPro.class("TMPro.TMP_FontAsset");
  const CENTER_ALIGNMENT = 514;
  function isNativeFault(e) {
    const message = String(e && e.message ? e.message : e);
    return message.includes("breakpoint triggered") || message.includes("access violation");
  }
  function retryNative(label, fn, attempts = 4) {
    let lastError;
    for (let i = 0; i < attempts; i++) {
      try {
        return fn();
      } catch (e) {
        lastError = e;
        if (isNativeFault(e)) {
          console.log(`[retry] ${label} hit a NATIVE FAULT: ${e}`);
          throw e;
        }
        console.log(`[retry] ${label} attempt ${i + 1}/${attempts} failed: ${e}`);
      }
    }
    throw lastError;
  }
  const zeroVector = retryNative("zeroVector", () => Vector3.field("zeroVector").value);
  const oneVector = retryNative("oneVector", () => Vector3.field("oneVector").value);
  const identityQuaternion = retryNative("identityQuaternion", () => Quaternion.field("identityQuaternion").value);
  let residentShaders = null;
  function getResidentShaders() {
    if (residentShaders) return residentShaders;
    residentShaders = /* @__PURE__ */ new Map();
    try {
      const all = Resources.method("FindObjectsOfTypeAll", 1).invoke(Shader.type.object);
      for (let i = 0; i < all.length; i++) {
        try {
          const s = all.get(i);
          if (!s || s.isNull?.()) continue;
          let n = s.method("get_name").invoke().toString();
          residentShaders.set(n.substring(1, n.length - 1), s);
        } catch (_) {
        }
      }
    } catch (_) {
    }
    return residentShaders;
  }
  function findFirstShader(names) {
    const resident = getResidentShaders();
    for (const name of names) {
      const found = resident.get(name);
      if (found && !found.isNull?.()) return found;
    }
    throw new Error(`no usable shader found among: ${names.join(", ")}`);
  }
  const MenuShader = findFirstShader([
    "Universal Render Pipeline/Lit",
    "Universal Render Pipeline/Simple Lit",
    "Universal Render Pipeline/Unlit",
    "Sprites/Default",
    "UI/Default"
  ]);
  const usingURPShader = (() => {
    try {
      const n = MenuShader.method("get_name").invoke().toString();
      return n.includes("Universal Render Pipeline");
    } catch (_) {
      return false;
    }
  })();
  let lastNotReadyLog = 0;
  function logNotReady(reason) {
    const now = Date.now();
    if (now - lastNotReadyLog < 2e3) return;
    lastNotReadyLog = now;
    console.log("[blobtown_menu] not ready: " + reason);
  }
  let cachedInstance = null;
  function getPlayerController() {
    try {
      if (cachedInstance && !cachedInstance.isNull?.()) return cachedInstance;
      const inst = PlayerControllerClass.field("instance").value;
      if (!inst || inst.isNull?.()) {
        logNotReady("PlayerController.instance is null");
        return null;
      }
      cachedInstance = inst;
      return inst;
    } catch (e) {
      logNotReady("exception resolving PlayerController.instance: " + e);
      cachedInstance = null;
      return null;
    }
  }
  let leftHandTransform = null;
  let rightHandTransform = null;
  let playerRigidBody = null;
  let playerCollider = null;
  let headCollider = null;
  function refreshPlayerRefs() {
    const inst = getPlayerController();
    if (!inst) return false;
    try {
      const leftHand = inst.field("leftHandController").value;
      const rightHand = inst.field("rightHandController").value;
      if (!leftHand || leftHand.isNull?.() || !rightHand || rightHand.isNull?.()) {
        logNotReady("hand controllers not ready");
        return false;
      }
      leftHandTransform = leftHand.method("get_transform", 0).invoke();
      rightHandTransform = rightHand.method("get_transform", 0).invoke();
      playerRigidBody = inst.field("rigidBody").value;
      playerCollider = inst.field("playerCollider").value;
      headCollider = inst.field("headCollider").value;
      rigidbody = playerRigidBody;
      return true;
    } catch (e) {
      logNotReady("exception resolving hand/rigidbody refs: " + e);
      return false;
    }
  }
  const OVRInputHandler = new XRInputHandler();
  const tmpFont = (() => {
    try {
      const fonts = Resources.method("FindObjectsOfTypeAll", 1).invoke(TMP_FontAsset.type.object);
      if (fonts.length > 0) return fonts.get(0);
    } catch (_) {
    }
    return null;
  })();
  fixCameraCullingMasks();
  function Destroy(object) {
    retryNative("Destroy", () => {
      if (object) Object.method("Destroy", 1).invoke(object);
    });
  }
  function getComponent(obj, type) {
    return obj.method("GetComponent", 1).inflate(type).invoke();
  }
  function addComponent(obj, type) {
    return retryNative("AddComponent", () => obj.method("AddComponent", 1).inflate(type).invoke());
  }
  function getTransform(obj) {
    return retryNative("get_transform", () => obj.method("get_transform").invoke());
  }
  function renderMenuText(canvasObject, text = "", color = [1, 1, 1, 1], pos = zeroVector, size = oneVector, fontSizeMax = 16.8) {
    const title = addComponent(createObject(zeroVector, identityQuaternion, oneVector, 3, [0, 0, 0, 0], getTransform(canvasObject)), TextMeshProUGUIClass);
    getComponent(title, BoxCollider).method("set_isTrigger").invoke(true);
    try {
      title.method("set_layer").invoke(MENU_LAYER);
    } catch (_) {
    }
    try {
      title.method("set_richText").invoke(true);
    } catch (_) {
    }
    title.method("set_text").invoke(Il2Cpp.string(text));
    if (tmpFont != null) {
      try {
        title.method("set_font").invoke(tmpFont);
      } catch (_) {
      }
    }
    title.method("set_color").invoke(color);
    try {
      title.method("set_fontStyle").invoke(3);
    } catch (_) {
    }
    try {
      title.method("set_alignment").invoke(CENTER_ALIGNMENT);
    } catch (_) {
    }
    try {
      title.method("set_enableAutoSizing").invoke(true);
      title.method("set_fontSizeMin").invoke(0.1);
      title.method("set_fontSizeMax").invoke(fontSizeMax);
    } catch (_) {
    }
    const rectTransform = getComponent(title, RectTransform);
    rectTransform.method("set_sizeDelta").invoke(size);
    rectTransform.method("set_position").invoke(pos);
    rectTransform.method("set_rotation").invoke(Quaternion.method("Euler").invoke(180, 90, 90));
    return title;
  }
  const roundedMeshCache = /* @__PURE__ */ new Map();
  function getRoundedBoxMesh(width, height, cornerRadius) {
    const cacheKey = `${width.toFixed(4)}_${height.toFixed(4)}_${cornerRadius.toFixed(4)}`;
    const cached = roundedMeshCache.get(cacheKey);
    if (cached) return cached;
    const normalizedY = Math.max(1e-3, Math.min(0.46, cornerRadius / Math.max(width, 1e-3)));
    const normalizedZ = Math.max(1e-3, Math.min(0.46, cornerRadius / Math.max(height, 1e-3)));
    const perimeter = [];
    const cornerSegments = 4;
    const corners = [
      [0.5 - normalizedY, 0.5 - normalizedZ, 0, Math.PI * 0.5],
      [-0.5 + normalizedY, 0.5 - normalizedZ, Math.PI * 0.5, Math.PI],
      [-0.5 + normalizedY, -0.5 + normalizedZ, Math.PI, Math.PI * 1.5],
      [0.5 - normalizedY, -0.5 + normalizedZ, Math.PI * 1.5, Math.PI * 2]
    ];
    for (const [centerY, centerZ, startAngle, endAngle] of corners) {
      for (let segment = 0; segment <= cornerSegments; segment++) {
        const t = segment / cornerSegments;
        const angle = startAngle + (endAngle - startAngle) * t;
        perimeter.push([centerY + Math.cos(angle) * normalizedY, centerZ + Math.sin(angle) * normalizedZ]);
      }
    }
    const vertices = [];
    for (const [y, z] of perimeter) vertices.push([0.5, y, z]);
    for (const [y, z] of perimeter) vertices.push([-0.5, y, z]);
    const ringCount = perimeter.length;
    const frontCenter = vertices.length;
    vertices.push([0.5, 0, 0]);
    const backCenter = vertices.length;
    vertices.push([-0.5, 0, 0]);
    const triangles = [];
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
    const triangleArray = Il2Cpp.array(Il2Cpp.corlib.class("System.Int32"), triangles);
    const mesh = Mesh.alloc();
    mesh.method(".ctor", 0).invoke();
    mesh.method("set_vertices").invoke(vertexArray);
    mesh.method("set_triangles").invoke(triangleArray);
    mesh.method("RecalculateBounds", 0).invoke();
    mesh.method("RecalculateNormals", 0).invoke();
    roundedMeshCache.set(cacheKey, mesh);
    return mesh;
  }
  function createOutlinedRoundedObject(pos, scale, fillColor, outlineColor, parent, interactive = false, outlineSize = 0.025) {
    const createLayer = (center, size, color, keepCollider, cornerRadius) => {
      const layer = createObject(center, identityQuaternion, size, 3, color, parent);
      try {
        layer.method("set_layer").invoke(MENU_LAYER);
      } catch (_) {
      }
      try {
        const filter = getComponent(layer, MeshFilter);
        filter.method("set_sharedMesh").invoke(getRoundedBoxMesh(size[1], size[2], cornerRadius));
      } catch (e) {
        console.log("[-] Rounded mesh fallback: " + e);
      }
      if (!keepCollider) Destroy(getComponent(layer, Collider));
      return layer;
    };
    const fillRadius = Math.min(Math.min(scale[1], scale[2]) * cornerRoundness, 0.06 * MENU_SCALE);
    if (outlinesEnabled && outlineSize > 0) {
      createLayer([pos[0] - 1e-3, pos[1], pos[2]], [scale[0], scale[1] + outlineSize * 2, scale[2] + outlineSize * 2], outlineColor, false, fillRadius + outlineSize);
    }
    return createLayer(pos, scale, fillColor, interactive, fillRadius);
  }
  function setupURPMaterial(material, colorArr) {
    const setFloat = (name, value) => {
      try {
        material.method("SetFloat").overload("System.String", "System.Single").invoke(Il2Cpp.string(name), value);
      } catch (_) {
      }
    };
    const setColor = (name, value) => {
      try {
        material.method("SetColor").overload("System.String", "UnityEngine.Color").invoke(Il2Cpp.string(name), value);
      } catch (_) {
      }
    };
    setColor("_BaseColor", colorArr);
    setColor("_Color", colorArr);
    const emission = [colorArr[0] * 0.25, colorArr[1] * 0.25, colorArr[2] * 0.25, 1];
    setColor("_EmissionColor", emission);
    try {
      material.method("EnableKeyword").invoke(Il2Cpp.string("_EMISSION"));
    } catch (_) {
    }
    try {
      material.method("SetOverrideTag").invoke(Il2Cpp.string("RenderType"), Il2Cpp.string("Opaque"));
    } catch (_) {
    }
    setFloat("_Surface", 0);
    setFloat("_ZWrite", 1);
    setFloat("_Cull", 0);
    setFloat("_Smoothness", 0);
    setFloat("_Glossiness", 0);
    setFloat("_Metallic", 0);
    try {
      material.method("DisableKeyword").invoke(Il2Cpp.string("_SURFACE_TYPE_TRANSPARENT"));
    } catch (_) {
    }
    try {
      material.method("DisableKeyword").invoke(Il2Cpp.string("_ALPHAPREMULTIPLY_ON"));
    } catch (_) {
    }
    try {
      material.method("DisableKeyword").invoke(Il2Cpp.string("_ALPHABLEND_ON"));
    } catch (_) {
    }
    try {
      material.method("set_renderQueue").invoke(2e3);
    } catch (_) {
    }
  }
  function forceOpaque(material) {
    const setFloat = (name, value) => {
      try {
        material.method("SetFloat").overload("System.String", "System.Single").invoke(Il2Cpp.string(name), value);
      } catch (_) {
      }
    };
    const setInt = (name, value) => {
      try {
        material.method("SetInt").overload("System.String", "System.Int32").invoke(Il2Cpp.string(name), value);
      } catch (_) {
      }
    };
    setFloat("_ZWrite", 1);
    setFloat("_ZTest", 4);
    setFloat("_SrcBlend", 1);
    setFloat("_DstBlend", 0);
    setFloat("_Cull", 0);
    setInt("_Cull", 0);
    try {
      material.method("SetOverrideTag").invoke(Il2Cpp.string("RenderType"), Il2Cpp.string("Opaque"));
    } catch (_) {
    }
    try {
      material.method("DisableKeyword").invoke(Il2Cpp.string("_ALPHABLEND_ON"));
    } catch (_) {
    }
    try {
      material.method("DisableKeyword").invoke(Il2Cpp.string("_ALPHAPREMULTIPLY_ON"));
    } catch (_) {
    }
    try {
      material.method("set_renderQueue").invoke(2e3);
    } catch (_) {
    }
  }
  function createObject(pos = zeroVector, rot = identityQuaternion, scale = oneVector, primitiveType = 3, colorArr = [1, 1, 1, 1], parent = null) {
    const obj = GameObject.method("CreatePrimitive").invoke(primitiveType);
    const renderer = getComponent(obj, Renderer);
    if (colorArr[3] == 0) {
      renderer.method("set_enabled").invoke(false);
    } else {
      const material = renderer.method("get_material").invoke();
      material.method("set_shader").invoke(MenuShader);
      material.method("set_color").invoke(colorArr);
      if (usingURPShader) setupURPMaterial(material, colorArr);
      else forceOpaque(material);
    }
    const transform = getTransform(obj);
    if (parent != null) transform.method("SetParent", 2).invoke(parent, false);
    transform.method("set_position").invoke(pos);
    transform.method("set_rotation").invoke(rot);
    transform.method("set_localScale").invoke(scale);
    return obj;
  }
  const menuBaseScale = [0.1, 0.3, 0.3825];
  function renderMenu() {
    if (!leftHandTransform) return;
    const buttonsPerPage = 6;
    const categoryButtons = currentCategory === -1 ? CATEGORY_NAMES.map((name) => new ButtonInfo({ buttonText: name })) : buttons[currentCategory] || buttons[0];
    if (currentCategory === 0) {
      buttons[0].forEach((b, idx) => {
        b.enabled = idx === themeIndex;
      });
    }
    const maxCurrentPage = Math.max(Math.ceil(categoryButtons.length / buttonsPerPage) - 1, 0);
    if (currentPage > maxCurrentPage) currentPage = maxCurrentPage;
    const targetMods = categoryButtons.slice(currentPage * buttonsPerPage).slice(0, buttonsPerPage);
    const rowStartZ = 0.075 * MENU_SCALE;
    const panelCenterZ = -0.03 * MENU_SCALE;
    const panelScaleZ = 0.76 * MENU_SCALE;
    const pageCenterZ = -0.045 * MENU_SCALE;
    const pageScaleZ = 0.64 * MENU_SCALE;
    menu_local = createObject(zeroVector, identityQuaternion, menuBaseScale, 3, [0, 0, 0, 0]);
    Destroy(getComponent(menu_local, BoxCollider));
    try {
      menu_local.method("set_layer").invoke(MENU_LAYER);
    } catch (_) {
    }
    createOutlinedRoundedObject([0.1 * MENU_SCALE, 0, panelCenterZ], [0.1 * MENU_SCALE, 0.72 * MENU_SCALE, panelScaleZ], bgColor_local, menuOutlineColor, getTransform(menu_local), false, menuOutlineThickness);
    const canvasObject = createObject(zeroVector, identityQuaternion, oneVector, 3, [0, 0, 0, 0], getTransform(menu_local));
    const canvas = addComponent(canvasObject, Canvas);
    Destroy(getComponent(canvasObject, BoxCollider));
    try {
      canvasObject.method("set_layer").invoke(MENU_LAYER);
    } catch (_) {
    }
    const canvasScaler = addComponent(canvasObject, CanvasScaler);
    addComponent(canvasObject, GraphicRaycaster);
    canvas.method("set_renderMode").invoke(2);
    canvasScaler.method("set_dynamicPixelsPerUnit").invoke(1e3);
    renderMenuText(canvasObject, "Limes Client", textColor_local, [0.11 * MENU_SCALE, 0, 0.103 * MENU_SCALE], [titleWidth, titleHeight]);
    const homeButtonZ = -0.202 * MENU_SCALE;
    const homeButton = createOutlinedRoundedObject([0.1 * MENU_SCALE, 0, homeButtonZ], [0.09 * MENU_SCALE, disconnectButtonWidth, 0.065 * MENU_SCALE], buttonColor, pageOutlineColor, getTransform(menu_local), true, controlOutlineThickness);
    homeButton.method("set_name").invoke(Il2Cpp.string("@Home"));
    addComponent(homeButton, RoomAcousticsBlockClass);
    getComponent(homeButton, Collider).method("set_isTrigger").invoke(true);
    renderMenuText(canvasObject, "Home", textColor_local, [0.11 * MENU_SCALE, 0, homeButtonZ], [0.6 * MENU_SCALE, 0.065 * MENU_SCALE]);
    {
      const pageButton = createOutlinedRoundedObject([0.1 * MENU_SCALE, 0.14 * MENU_SCALE, pageCenterZ], [0.09 * MENU_SCALE, pageButtonWidth, pageScaleZ], buttonColor, pageOutlineColor, getTransform(menu_local), true, controlOutlineThickness);
      pageButton.method("set_name").invoke(Il2Cpp.string("@PreviousPage"));
      addComponent(pageButton, RoomAcousticsBlockClass);
      getComponent(pageButton, Collider).method("set_isTrigger").invoke(true);
      renderMenuText(canvasObject, "<", textColor_local, [0.11 * MENU_SCALE, 0.14 * MENU_SCALE, pageCenterZ], [0.25 * MENU_SCALE, 0.075 * MENU_SCALE]);
    }
    {
      const pageButton = createOutlinedRoundedObject([0.1 * MENU_SCALE, -0.14 * MENU_SCALE, pageCenterZ], [0.09 * MENU_SCALE, pageButtonWidth, pageScaleZ], buttonColor, pageOutlineColor, getTransform(menu_local), true, controlOutlineThickness);
      pageButton.method("set_name").invoke(Il2Cpp.string("@NextPage"));
      addComponent(pageButton, RoomAcousticsBlockClass);
      getComponent(pageButton, Collider).method("set_isTrigger").invoke(true);
      renderMenuText(canvasObject, ">", textColor_local, [0.11 * MENU_SCALE, -0.14 * MENU_SCALE, pageCenterZ], [0.25 * MENU_SCALE, 0.075 * MENU_SCALE]);
    }
    let i = 0;
    targetMods.forEach((buttonData) => {
      const rowZ = rowStartZ - i * rowButtonSpacing;
      const button = createOutlinedRoundedObject([0.105 * MENU_SCALE, 0, rowZ], [0.09 * MENU_SCALE, rowButtonWidth, rowButtonHeight], buttonColor, buttonOutlineColor, getTransform(menu_local), true, rowOutlineThickness);
      button.method("set_name").invoke(Il2Cpp.string("@" + buttonData.buttonText));
      addComponent(button, RoomAcousticsBlockClass);
      getComponent(button, Collider).method("set_isTrigger").invoke(true);
      renderMenuText(canvasObject, buttonData.buttonText, textColor_local, [0.11 * MENU_SCALE, 0, rowZ], [0.8 * MENU_SCALE, 0.048 * MENU_SCALE]);
      updateButtonColor(button, buttonData);
      i++;
    });
    menuClosing = false;
    recenterMenu();
  }
  function renderReference() {
    if (!rightHandTransform) return;
    reference = createObject(zeroVector, identityQuaternion, [0.01, 0.01, 0.01], 0, [0.12, 0.12, 0.12, 1], rightHandTransform);
    referenceCollider = getComponent(reference, Collider);
    getTransform(reference).method("set_localPosition").invoke([-0.02, 0.015, 0.13]);
    reference.method("set_layer").invoke(REFERENCE_LAYER);
    addComponent(reference, Rigidbody).method("set_isKinematic").invoke(true);
  }
  function recenterMenu() {
    if (!leftHandTransform || !menu_local) return;
    let menuPosition = leftHandTransform.method("get_position").invoke();
    let menuRotation = leftHandTransform.method("get_rotation").invoke();
    menuRotation = Quaternion.method("op_Multiply", 2).invoke(menuRotation, Quaternion.method("Euler").invoke(-45, 0, 0));
    const menuTransform = getTransform(menu_local);
    menuTransform.method("set_position").invoke(menuPosition);
    menuTransform.method("set_rotation").invoke(menuRotation);
  }
  function reloadMenu() {
    if (menu_local != null) {
      Object.method("Destroy", 1).invoke(menu_local);
      menu_local = null;
    }
  }
  function updateButtonColor(button, buttonData) {
    const renderer = getComponent(button, Renderer);
    if (!renderer) return;
    renderer.method("get_material").invoke().method("set_color").invoke(buttonData.enabled ? buttonPressedColor : buttonColor);
  }
  let flySpeed = 8.5;
  function Fly() {
    if (!rigidbody || !rightHandTransform) return;
    try {
      rigidbody.method("set_useGravity").invoke(false);
    } catch (_) {
    }
    try {
      rigidbody.method("set_velocity").invoke(zeroVector);
    } catch (_) {
    }
    try {
      rigidbody.method("set_angularVelocity").invoke(zeroVector);
    } catch (_) {
    }
    if (rightSecondary || rightPrimary) {
      const inst = getPlayerController();
      if (!inst) return;
      const transform = getTransform(inst);
      let forward = rightHandTransform.method("get_forward").invoke();
      let position = transform.method("get_position").invoke();
      forward = Vector3.method("op_Multiply", 2).invoke(forward, flySpeed * deltaTime);
      position = Vector3.method("op_Addition", 2).invoke(position, forward);
      transform.method("set_position").invoke(position);
    }
  }
  function StopFly() {
    try {
      if (rigidbody) rigidbody.method("set_useGravity").invoke(true);
    } catch (_) {
    }
  }
  let noclipActive = false;
  function toggleNoclip(enabled) {
    noclipActive = enabled;
    try {
      if (playerCollider) playerCollider.method("set_enabled").invoke(!enabled);
    } catch (_) {
    }
    try {
      if (headCollider) headCollider.method("set_enabled").invoke(!enabled);
    } catch (_) {
    }
  }
  function enableNoclip() {
    toggleNoclip(true);
  }
  function disableNoclip() {
    toggleNoclip(false);
  }
  let speedBoostEnabled = false;
  function applySpeedBoost() {
    const inst = getPlayerController();
    if (!inst) return;
    try {
      const defaultSpeed = inst.field("defaultWalkSpeed").value;
      inst.field("walkSpeed").value = speedBoostEnabled ? defaultSpeed * 3 : defaultSpeed;
    } catch (e) {
      console.log("[blobtown_menu] speed boost failed: " + e);
    }
  }
  function enableSpeedBoost() {
    speedBoostEnabled = true;
    applySpeedBoost();
  }
  function disableSpeedBoost() {
    speedBoostEnabled = false;
    applySpeedBoost();
  }
  let superJumpEnabled = false;
  function applySuperJump() {
    const inst = getPlayerController();
    if (!inst) return;
    try {
      const defaultJump = inst.field("defaultJumpForce").value;
      inst.field("jumpForce").value = superJumpEnabled ? defaultJump * 3 : defaultJump;
    } catch (e) {
      console.log("[blobtown_menu] super jump failed: " + e);
    }
  }
  function enableSuperJump() {
    superJumpEnabled = true;
    applySuperJump();
  }
  function disableSuperJump() {
    superJumpEnabled = false;
    applySuperJump();
  }
  function InfiniteDash() {
    const inst = getPlayerController();
    if (!inst) return;
    try {
      inst.field("enableDashing").value = true;
      inst.field("dashCooldown").value = 0;
    } catch (_) {
    }
  }
  function LowGravity() {
    try {
      Physics.method("set_gravity").invoke(Vector3.method("op_Multiply").invoke(Vector3.field("up").value, -3.84));
    } catch (_) {
    }
  }
  function NormalGravity() {
    try {
      Physics.method("set_gravity").invoke(Vector3.method("op_Multiply").invoke(Vector3.field("up").value, -9.81));
    } catch (_) {
    }
    try {
      if (rigidbody) rigidbody.method("set_useGravity").invoke(true);
    } catch (_) {
    }
  }
  function ZeroGravity() {
    try {
      if (rigidbody) rigidbody.method("set_useGravity").invoke(false);
    } catch (_) {
    }
  }
  let blobuimSpoofEnabled = false;
  function toggleBlobuimSpoof(enabled) {
    blobuimSpoofEnabled = enabled;
    console.log(`[blobtown_menu] 99999 Blobuim toggle set to: ${enabled}`);
    forceBlobuimUIUpdate();
  }
  function forceBlobuimUIUpdate() {
    if (!blobuimSpoofEnabled) return;
    try {
      const allText = Object.method("FindObjectsOfType").inflate(TextMeshProUGUIClass).invoke();
      for (let i = 0; i < allText.length; i++) {
        try {
          const t = allText.get(i);
          const currentText = t.method("get_text").invoke().toString();
          if (currentText.includes("Blobuim") || /^\d+$/.test(currentText.trim()) || currentText.includes("Balance")) {
            t.method("set_text").invoke(Il2Cpp.string("99999"));
          }
        } catch (_) {
        }
      }
    } catch (_) {
    }
  }
  try {
    const UserBalanceChangedAttrs = AssemblyCSharp.class("Revel.UserBalanceChangedAttrs");
    const getBalance = UserBalanceChangedAttrs.method("get_balance");
    if (getBalance) {
      getBalance.implementation = function() {
        if (blobuimSpoofEnabled) return 99999;
        return getBalance.invoke(this);
      };
      console.log("[blobtown_menu] Hooked UserBalanceChangedAttrs.get_balance successfully.");
    }
  } catch (e) {
    console.log("[blobtown_menu] Optional UserBalanceChangedAttrs hook notice: " + e);
  }
  let desiredPlayerName = "";
  function setPlayerName(name) {
    desiredPlayerName = name;
    console.log("[blobtown_menu] Setting player name to: " + name);
    setTimeout(() => applyPlayerNameSpoof(), 100);
  }
  function applyPlayerNameSpoof() {
    try {
      const nameStr = Il2Cpp.string(desiredPlayerName);
      try {
        const SettingsClass = AssemblyCSharp.class("Revel.RevelPlayerSettings");
        if (SettingsClass) {
          const inst = SettingsClass.field("instance").value;
          const target = inst && !inst.isNull() ? inst : SettingsClass;
          try {
            target.method("set_displayName", 1).invoke(nameStr);
          } catch (_) {
          }
          try {
            target.method("set_userName", 1).invoke(nameStr);
          } catch (_) {
          }
          try {
            target.method("SetName", 1).invoke(nameStr);
          } catch (_) {
          }
          try {
            target.method("setName", 1).invoke(nameStr);
          } catch (_) {
          }
        }
      } catch (_) {
      }
      try {
        const allText = Object.method("FindObjectsOfType").inflate(TextMeshProUGUIClass).invoke();
        for (let i = 0; i < allText.length; i++) {
          try {
            const t = allText.get(i);
            const go = t.method("get_gameObject").invoke();
            const goName = go.method("get_name").invoke().toString();
            if (/(Nametag|NameTag|Nameplate|player_name|PlayerName)/i.test(goName)) {
              t.method("set_text").invoke(nameStr);
            }
          } catch (_) {
          }
        }
      } catch (_) {
      }
      try {
        const AvatarModel = AssemblyCSharp.class("Revel.RealtimeAvatarModel");
        const avatarModels = Object.method("FindObjectsOfTypeAll", 1).invoke(AvatarModel.type.object);
        for (let i = 0; i < avatarModels.length; i++) {
          const m = avatarModels.get(i);
          let isLocal = false;
          try {
            isLocal = m.method("get_isLocal").invoke();
          } catch (_) {
          }
          if (isLocal) {
            try {
              m.method("set_playerName", 1).invoke(nameStr);
            } catch (_) {
            }
            try {
              m.method("PlayerName", 1).invoke(nameStr);
            } catch (_) {
            }
          }
        }
      } catch (_) {
      }
      console.log("[blobtown_menu] Named changed applied.");
    } catch (e) {
      console.log("[blobtown_menu] Name change error: " + e);
    }
  }
  const MODEL_FOLDER_PATH = "/sdcard/Android/data/app.RevelVR.blobtown/files/3DModels";
  let availableModelFiles = [];
  function ensureModelDirectoryExists() {
    try {
      const exists = SystemIODirectory.method("Exists", 1).invoke(Il2Cpp.string(MODEL_FOLDER_PATH));
      if (!exists) {
        SystemIODirectory.method("CreateDirectory", 1).invoke(Il2Cpp.string(MODEL_FOLDER_PATH));
        console.log("[blobtown_menu] Created 3D Models folder at: " + MODEL_FOLDER_PATH);
      }
    } catch (e) {
      console.log("[blobtown_menu] Directory check error: " + e);
    }
  }
  function refreshModelFileList() {
    ensureModelDirectoryExists();
    try {
      const filesArr = SystemIODirectory.method("GetFiles", 1).invoke(Il2Cpp.string(MODEL_FOLDER_PATH));
      const fileList = [];
      for (let i = 0; i < filesArr.length; i++) {
        const fullPath = filesArr.get(i).toString().replace(/"/g, "").trim();
        const fileName = fullPath.substring(fullPath.lastIndexOf("/") + 1);
        fileList.push(fileName);
      }
      availableModelFiles = fileList;
      return fileList;
    } catch (e) {
      console.log("[blobtown_menu] Error listing 3D model files: " + e);
      return [];
    }
  }
  function readGLBFile(filePath) {
    try {
      let getAccessor2 = function(idx) {
        const acc = gltf.accessors[idx];
        if (!acc) throw new Error("missing accessor " + idx);
        const bv = acc.bufferView !== void 0 ? gltf.bufferViews[acc.bufferView] : null;
        const byteOffset = (bv && bv.byteOffset || 0) + (acc.byteOffset || 0);
        return { count: acc.count, componentType: acc.componentType, type: acc.type, byteOffset, byteStride: bv && bv.byteStride || 0 };
      };
      var getAccessor = getAccessor2;
      try {
        const exists = SystemIOFile.method("Exists", 1).invoke(Il2Cpp.string(filePath));
        if (!exists) {
          console.log("[glb] File does not exist: " + filePath);
          return null;
        }
      } catch (_) {
      }
      const byteArr = SystemIOFile.method("ReadAllBytes", 1).invoke(Il2Cpp.string(filePath));
      if (byteArr == null || byteArr.isNull()) {
        console.log("[glb] ReadAllBytes returned null for " + filePath);
        return null;
      }
      const byteCount = byteArr.length;
      console.log(`[glb] Reading ${byteCount} bytes from ${filePath}`);
      if (byteCount < 12) {
        console.log("[glb] File too small");
        return null;
      }
      const getU8 = (o2) => byteArr.get(o2) & 255;
      const getU16 = (o2) => (byteArr.get(o2) | byteArr.get(o2 + 1) << 8) & 65535;
      const getU32 = (o2) => (byteArr.get(o2) | byteArr.get(o2 + 1) << 8 | byteArr.get(o2 + 2) << 16 | byteArr.get(o2 + 3) << 24) >>> 0;
      const _f32ab = new ArrayBuffer(4);
      const _u32v = new Uint32Array(_f32ab);
      const _f32v = new Float32Array(_f32ab);
      const getF32 = (o2) => {
        _u32v[0] = getU32(o2);
        return _f32v[0];
      };
      const magic = getU32(0);
      if (magic !== 1179937895) {
        console.log("[glb] Invalid magic: 0x" + magic.toString(16));
        return null;
      }
      const glbVersion = getU32(4);
      console.log(`[glb] GLB version: ${glbVersion}`);
      const jsonChunkLength = getU32(12);
      const jsonChunkType = getU32(16);
      if (jsonChunkType !== 1313821514) {
        console.log("[glb] First chunk is not JSON, got: 0x" + jsonChunkType.toString(16));
        return null;
      }
      let jsonStr = "";
      let o = 20;
      const jsonEnd = o + jsonChunkLength;
      for (; o < jsonEnd; o++) {
        const c = getU8(o);
        if (c > 0) jsonStr += String.fromCharCode(c);
      }
      console.log(`[glb] JSON chunk: ${jsonChunkLength} bytes`);
      let binChunkStart = o;
      if (binChunkStart % 4 !== 0) binChunkStart += 4 - binChunkStart % 4;
      const binChunkLength = getU32(binChunkStart);
      const binChunkType = getU32(binChunkStart + 4);
      if (binChunkType !== 5130562) {
        console.log("[glb] Missing BIN chunk (got 0x" + binChunkType.toString(16) + "), aborting");
        return null;
      }
      const binDataStart = binChunkStart + 8;
      console.log(`[glb] BIN chunk: ${binChunkLength} bytes`);
      const gltf = JSON.parse(jsonStr);
      const meshCount = gltf.meshes && gltf.meshes.length || 0;
      const accCount = gltf.accessors && gltf.accessors.length || 0;
      console.log(`[glb] Meshes: ${meshCount}, Accessors: ${accCount}`);
      if (meshCount === 0) {
        console.log("[glb] No meshes found");
        return null;
      }
      const mesh0 = gltf.meshes[0];
      const primitive = mesh0.primitives[0];
      if (!primitive) {
        console.log("[glb] No primitives in first mesh");
        return null;
      }
      const posAccessorIdx = primitive.attributes.POSITION;
      const normAccessorIdx = primitive.attributes.NORMAL;
      const colorAccessorIdx = primitive.attributes.COLOR_0;
      const idxAccessorIdx = primitive.indices;
      if (posAccessorIdx === void 0 || idxAccessorIdx === void 0) {
        console.log("[glb] Missing POSITION or indices accessor");
        return null;
      }
      const posAcc = getAccessor2(posAccessorIdx);
      if (posAcc.type !== "VEC3" || posAcc.componentType !== 5126) {
        console.log("[glb] POSITION must be VEC3 float, got " + posAcc.type + " type " + posAcc.componentType);
        return null;
      }
      const vertices = [];
      const stride = posAcc.byteStride > 0 ? posAcc.byteStride : 12;
      const posEnd = binDataStart + posAcc.byteOffset + posAcc.count * stride;
      if (posEnd > byteCount) {
        console.log("[glb] POSITION accessor overruns file");
        return null;
      }
      for (let i = 0; i < posAcc.count; i++) {
        const off = binDataStart + posAcc.byteOffset + i * stride;
        vertices.push([getF32(off), getF32(off + 4), getF32(off + 8)]);
      }
      console.log(`[glb] Parsed ${vertices.length} vertices`);
      const normals = [];
      if (normAccessorIdx !== void 0) {
        try {
          const normAcc = getAccessor2(normAccessorIdx);
          const nStride = normAcc.byteStride > 0 ? normAcc.byteStride : 12;
          for (let i = 0; i < normAcc.count; i++) {
            const off = binDataStart + normAcc.byteOffset + i * nStride;
            normals.push([getF32(off), getF32(off + 4), getF32(off + 8)]);
          }
        } catch (e) {
          console.log("[glb] Normals parse skipped: " + e);
        }
      }
      const colors = [];
      if (colorAccessorIdx !== void 0) {
        try {
          const colAcc = getAccessor2(colorAccessorIdx);
          const isFloat = colAcc.componentType === 5126;
          const comps = colAcc.type === "VEC4" ? 4 : 3;
          const cStride = colAcc.byteStride > 0 ? colAcc.byteStride : comps * 4;
          for (let i = 0; i < colAcc.count; i++) {
            const off = binDataStart + colAcc.byteOffset + i * cStride;
            if (isFloat) {
              const c = [];
              for (let k = 0; k < comps; k++) c.push(getF32(off + k * 4));
              colors.push([c[0], c[1], c[2], c.length > 3 ? c[3] : 1]);
            } else {
              const c = [];
              for (let k = 0; k < comps; k++) c.push(getU8(off + k) / 255);
              colors.push([c[0], c[1], c[2], c.length > 3 ? c[3] : 1]);
            }
          }
          console.log(`[glb] Parsed ${colors.length} vertex colors`);
        } catch (e) {
          console.log("[glb] Color parse skipped: " + e);
        }
      }
      const idxAcc = getAccessor2(idxAccessorIdx);
      const triangles = [];
      for (let i = 0; i < idxAcc.count; i++) {
        const off = binDataStart + idxAcc.byteOffset;
        if (idxAcc.componentType === 5123) {
          triangles.push(getU16(off + i * 2));
        } else if (idxAcc.componentType === 5125) {
          triangles.push(getU32(off + i * 4));
        } else {
          triangles.push(getU8(off + i));
        }
      }
      console.log(`[glb] Parsed ${triangles.length} indices (${triangles.length / 3} triangles)`);
      return { vertices, triangles, normals, colors };
    } catch (e) {
      console.log("[glb] Parse error: " + e);
      return null;
    }
  }
  function spawn3DModelAtRightHand(modelName) {
    if (!rightHandTransform) return;
    try {
      const handPos = rightHandTransform.method("get_position").invoke();
      const handRot = rightHandTransform.method("get_rotation").invoke();
      const fullPath = MODEL_FOLDER_PATH + "/" + modelName;
      const glbData = readGLBFile(fullPath);
      if (glbData && glbData.vertices.length > 0 && glbData.triangles.length > 0) {
        console.log(`[blobtown_menu] Building Unity Mesh from GLB: ${glbData.vertices.length} verts, ${glbData.triangles.length / 3} tris`);
        const obj = GameObject.method("CreatePrimitive").invoke(3);
        const transform = getTransform(obj);
        transform.method("set_position").invoke(handPos);
        transform.method("set_rotation").invoke(handRot);
        transform.method("set_localScale").invoke([0.5, 0.5, 0.5]);
        const mesh = Mesh.alloc();
        mesh.method(".ctor", 0).invoke();
        const vertexArray = Il2Cpp.array(Vector3, glbData.vertices.length);
        for (let i = 0; i < glbData.vertices.length; i++) {
          vertexArray.set(i, Il2Cpp.fromFridaValue(glbData.vertices[i], Vector3.type));
        }
        mesh.method("set_vertices").invoke(vertexArray);
        const triangleArray = Il2Cpp.array(Il2Cpp.corlib.class("System.Int32"), glbData.triangles);
        mesh.method("set_triangles").invoke(triangleArray);
        if (glbData.normals.length === glbData.vertices.length) {
          const normalArray = Il2Cpp.array(Vector3, glbData.normals.length);
          for (let i = 0; i < glbData.normals.length; i++) {
            normalArray.set(i, Il2Cpp.fromFridaValue(glbData.normals[i], Vector3.type));
          }
          mesh.method("set_normals").invoke(normalArray);
        } else {
          mesh.method("RecalculateNormals", 0).invoke();
        }
        mesh.method("RecalculateBounds", 0).invoke();
        const filter = getComponent(obj, MeshFilter);
        filter.method("set_sharedMesh").invoke(mesh);
        const renderer = getComponent(obj, Renderer);
        const material = renderer.method("get_material").invoke();
        material.method("set_shader").invoke(MenuShader);
        material.method("set_color").invoke([0.85, 0.85, 0.85, 1]);
        if (usingURPShader) setupURPMaterial(material, [0.85, 0.85, 0.85, 1]);
        else forceOpaque(material);
        addComponent(obj, Rigidbody);
        try {
          Destroy(getComponent(obj, BoxCollider));
        } catch (_) {
        }
        console.log(`[blobtown_menu] GLB model '${modelName}' spawned successfully with ${glbData.vertices.length} vertices!`);
      } else {
        console.log(`[blobtown_menu] GLB parse failed for '${modelName}', spawning primitive fallback`);
        const spawnedObj = createObject(handPos, handRot, [0.3, 0.3, 0.3], 3, [0.9, 0.4, 0.1, 1]);
        addComponent(spawnedObj, Rigidbody);
      }
    } catch (e) {
      console.log("[blobtown_menu] Spawn model error: " + e);
    }
  }
  let blobBuildEnabled = false;
  const RealtimeImage2 = Il2Cpp.domain.assembly("Normal.Realtime").image;
  const RealTimeClass2 = (() => {
    try {
      return RealtimeImage2.class("Normal.Realtime.Realtime");
    } catch (_) {
      return null;
    }
  })();
  const RealtimeViewClass3 = (() => {
    try {
      return RealtimeImage2.class("Normal.Realtime.RealtimeView");
    } catch (_) {
      return null;
    }
  })();
  function getTemplateBlobObject() {
    try {
      const temps = Object.method("FindObjectsOfType").inflate(AssemblyCSharp.class("Revel.RealtimeAvatar")).invoke();
      if (temps && temps.length > 0) return temps.get(0);
    } catch (_) {
    }
    try {
      const temps = Object.method("FindObjectsOfType").inflate(AssemblyCSharp.class("Revel.NpcController")).invoke();
      if (temps && temps.length > 0) return temps.get(0);
    } catch (_) {
    }
    return null;
  }
  function getOrCreateBlobPrefabName() {
    try {
      const tpl = getTemplateBlobObject();
      if (tpl) {
        const root = tpl.method("get_gameObject").invoke();
        const name = root.method("get_name").invoke().toString();
        const clean = name.replace(/\s*\(.*?\)/g, "").trim();
        if (clean.length > 0) return clean;
      }
    } catch (_) {
    }
    return "";
  }
  function instantiateNetworkedBlob(prefabName, pos, rot) {
    try {
      const method = RealTimeClass2.method("Instantiate", 3);
      const spawnRes = method.overload("System.String", "UnityEngine.Vector3", "UnityEngine.Quaternion").invoke(Il2Cpp.string(prefabName), pos, rot);
      if (spawnRes) return spawnRes;
      return null;
    } catch (e) {
      try {
        const method2 = RealTimeClass2.method("Instantiate", 4).overload("System.String", "UnityEngine.Vector3", "UnityEngine.Quaternion", "System.Boolean").invoke(Il2Cpp.string(prefabName), pos, rot, true);
        if (method2) return method2;
      } catch (e2) {
      }
      console.log("[blobtown_menu] Blob Realtime.Instantiate failed: " + e);
      return null;
    }
  }
  function setObjectColorBlob(obj, rgba) {
    if (!rgba) return;
    try {
      const renderer = getComponent(obj, Renderer);
      if (!renderer) return;
      const material = renderer.method("get_material").invoke();
      if (!material || material.isNull()) return;
      const c = [Math.min(1, Math.max(0, rgba[0])), Math.min(1, Math.max(0, rgba[1])), Math.min(1, Math.max(0, rgba[2])), rgba.length > 3 ? rgba[3] : 1];
      material.method("set_color").invoke(c);
      if (usingURPShader) setupURPMaterial(material, c);
      else forceOpaque(material);
    } catch (_) {
    }
  }
  function spawn3DModelAsBlobsAtRightHand(modelName) {
    if (!rightHandTransform) return;
    try {
      const handPos = rightHandTransform.method("get_position").invoke();
      const fullPath = MODEL_FOLDER_PATH + "/" + modelName;
      const glbData = readGLBFile(fullPath);
      if (!glbData || glbData.vertices.length === 0) {
        console.log("[blobtown_menu] Blob build failed - could not parse GLB");
        return;
      }
      const VERTEX_STEP = Math.max(1, Math.floor(glbData.vertices.length / 100));
      let spawnedCount = 0;
      const blobPrefab = getOrCreateBlobPrefabName();
      for (let i = 0; i < glbData.vertices.length; i += VERTEX_STEP) {
        if (spawnedCount >= 100) break;
        const v = glbData.vertices[i];
        if (!v) continue;
        const pos = [handPos[0] + v[0], handPos[1] + v[1], handPos[2] + v[2]];
        let blobObj = null;
        if (blobPrefab.length > 0) {
          blobObj = instantiateNetworkedBlob(blobPrefab, pos, identityQuaternion);
        }
        if (blobObj) {
          const color = glbData.colors && glbData.colors[i] ? glbData.colors[i] : null;
          setObjectColorBlob(blobObj, color);
          try {
            getTransform(blobObj).method("set_localScale").invoke([0.12, 0.12, 0.12]);
          } catch (_) {
          }
          spawnedCount += 1;
        }
      }
      console.log(`[blobtown_menu] Spawned ${spawnedCount} blobs to build '${modelName}'`);
    } catch (e) {
      console.log("[blobtown_menu] Blob build error: " + e);
    }
  }
  function toggleGlobalColliders(enabled) {
    const meshColliders = Object.method("FindObjectsOfType").inflate(MeshCollider).invoke();
    for (let i = 0; i < meshColliders.length; i++) {
      try {
        meshColliders.get(i).method("set_enabled").invoke(enabled);
      } catch (_) {
      }
    }
  }
  function GlobalNoclip() {
    if (rightTrigger && !previousNoclipKey) toggleGlobalColliders(false);
    if (!rightTrigger && previousNoclipKey) toggleGlobalColliders(true);
    previousNoclipKey = rightTrigger;
  }
  function getRaycastHits(origin, forward, maxDistance) {
    try {
      const hits = Physics.method("RaycastAll", 3).overload("UnityEngine.Vector3", "UnityEngine.Vector3", "System.Single").invoke(origin, forward, maxDistance);
      const result = [];
      if (hits) {
        for (let i = 0; i < hits.length; i++) {
          result.push(hits.get(i));
        }
      }
      return result;
    } catch (e) {
      console.log("[blobtown_menu] RaycastAll failed: " + e);
      return [];
    }
  }
  let teleportGunEnabled = false;
  let teleportPointer = null;
  let prevTeleportTrigger = false;
  function enableTeleportGun() {
    teleportGunEnabled = true;
  }
  function disableTeleportGun() {
    teleportGunEnabled = false;
    if (teleportPointer) {
      Destroy(teleportPointer);
      teleportPointer = null;
    }
  }
  function TeleportGun() {
    if (!rightHandTransform) return;
    try {
      const origin = rightHandTransform.method("get_position").invoke();
      const forward = rightHandTransform.method("get_forward").invoke();
      if (!teleportPointer) {
        teleportPointer = createObject(zeroVector, identityQuaternion, [0.15, 0.15, 0.15], 0, [0, 0.9, 1, 0.8]);
        try {
          Destroy(getComponent(teleportPointer, Collider));
        } catch (_) {
        }
      }
      const rayHits = getRaycastHits(origin, forward, 150);
      if (rayHits.length > 0) {
        const hitPoint = rayHits[0].method("get_point").invoke();
        getTransform(teleportPointer).method("set_position").invoke(hitPoint);
        if (rightTrigger && !prevTeleportTrigger) {
          const inst = getPlayerController();
          if (inst) {
            const transform = getTransform(inst);
            const targetPos = Vector3.method("op_Addition", 2).invoke(hitPoint, Vector3.method("op_Multiply", 2).invoke(Vector3.field("up").value, 0.5));
            transform.method("set_position").invoke(targetPos);
            try {
              if (rigidbody) rigidbody.method("set_velocity").invoke(zeroVector);
            } catch (_) {
            }
            console.log("[blobtown_menu] Teleported to raycast target!");
          }
        }
      }
      prevTeleportTrigger = rightTrigger;
    } catch (e) {
      console.log("[blobtown_menu] Teleport gun error: " + e);
    }
  }
  let forceGrabEnabled = false;
  let currentlyGrabbedObj = null;
  function enableForceGrab() {
    forceGrabEnabled = true;
  }
  function disableForceGrab() {
    forceGrabEnabled = false;
    currentlyGrabbedObj = null;
  }
  function ForceGrabBlobs() {
    if (!rightHandTransform) return;
    try {
      if (rightGrab) {
        if (!currentlyGrabbedObj) {
          const origin = rightHandTransform.method("get_position").invoke();
          const forward = rightHandTransform.method("get_forward").invoke();
          const rayHits = getRaycastHits(origin, forward, 50);
          if (rayHits.length > 0) {
            const hitCollider = rayHits[0].method("get_collider").invoke();
            if (hitCollider) {
              const hitGo = hitCollider.method("get_gameObject").invoke();
              const rb = getComponent(hitGo, Rigidbody);
              if (rb) {
                currentlyGrabbedObj = hitGo;
                try {
                  const RealtimeViewClass = Il2Cpp.domain.assembly("Normal.Realtime").image.class("Normal.Realtime.RealtimeView");
                  if (RealtimeViewClass) {
                    const view = getComponent(hitGo, RealtimeViewClass);
                    if (view) view.method("RequestOwnership", 0).invoke();
                  }
                } catch (_) {
                }
                console.log("[blobtown_menu] Force grabbed object: " + hitGo.method("get_name").invoke().toString());
              }
            }
          }
        } else {
          const handPos = rightHandTransform.method("get_position").invoke();
          const handForward = rightHandTransform.method("get_forward").invoke();
          const holdPos = Vector3.method("op_Addition", 2).invoke(handPos, Vector3.method("op_Multiply", 2).invoke(handForward, 0.8));
          const objTransform = getTransform(currentlyGrabbedObj);
          objTransform.method("set_position").invoke(holdPos);
          const rb = getComponent(currentlyGrabbedObj, Rigidbody);
          if (rb) {
            try {
              rb.method("set_velocity").invoke(zeroVector);
            } catch (_) {
            }
          }
        }
      } else if (currentlyGrabbedObj) {
        const rb = getComponent(currentlyGrabbedObj, Rigidbody);
        if (rb) {
          const handForward = rightHandTransform.method("get_forward").invoke();
          const throwVelocity = Vector3.method("op_Multiply", 2).invoke(handForward, 18);
          try {
            rb.method("set_velocity").invoke(throwVelocity);
          } catch (_) {
          }
        }
        console.log("[blobtown_menu] Released/Threw grabbed object!");
        currentlyGrabbedObj = null;
      }
    } catch (e) {
      console.log("[blobtown_menu] Force grab error: " + e);
      currentlyGrabbedObj = null;
    }
  }
  const PetClass = (() => {
    try {
      return AssemblyCSharp.class("Revel.Pet");
    } catch (_) {
      return null;
    }
  })();
  const NpcClass = (() => {
    try {
      return AssemblyCSharp.class("Revel.NpcController");
    } catch (_) {
      return null;
    }
  })();
  let blobDeleteEnabled = false;
  let blobDeletePointer = null;
  let prevBlobDeleteTrigger = false;
  function enableBlobDelete() {
    blobDeleteEnabled = true;
  }
  function disableBlobDelete() {
    blobDeleteEnabled = false;
    if (blobDeletePointer) {
      Destroy(blobDeletePointer);
      blobDeletePointer = null;
    }
  }
  function BlobDeleteGun() {
    if (!rightHandTransform) return;
    try {
      const origin = rightHandTransform.method("get_position").invoke();
      const forward = rightHandTransform.method("get_forward").invoke();
      if (!blobDeletePointer) {
        blobDeletePointer = createObject(zeroVector, identityQuaternion, [0.08, 0.08, 0.08], 0, [1, 0.15, 0.15, 0.9]);
        try {
          Destroy(getComponent(blobDeletePointer, Collider));
        } catch (_) {
        }
      }
      const rayHits = getRaycastHits(origin, forward, 30);
      if (rayHits.length > 0) {
        const hitPoint = rayHits[0].method("get_point").invoke();
        getTransform(blobDeletePointer).method("set_position").invoke(hitPoint);
        if (rightTrigger && !prevBlobDeleteTrigger) {
          const hitCollider = rayHits[0].method("get_collider").invoke();
          if (hitCollider && !hitCollider.isNull()) {
            const hitGo = hitCollider.method("get_gameObject").invoke();
            deleteBlobRoot(hitGo);
          }
        }
      }
      prevBlobDeleteTrigger = rightTrigger;
    } catch (e) {
      console.log("[blobtown_menu] Blob delete gun error: " + e);
      prevBlobDeleteTrigger = rightTrigger;
    }
  }
  function deleteBlobRoot(hitGo) {
    try {
      console.log("[blobtown_menu] Delete target: " + hitGo.method("get_name").invoke().toString());
      let root = hitGo;
      let current = hitGo;
      for (let i = 0; i < 16; i++) {
        if (!current || current.isNull()) break;
        const petComp = PetClass ? getComponent(current, PetClass) : null;
        const npcComp = NpcClass ? getComponent(current, NpcClass) : null;
        const isCreature = (petComp && petComp.isNull ? !petComp.isNull() : !!petComp) || (npcComp && npcComp.isNull ? !npcComp.isNull() : !!npcComp);
        if (isCreature) {
          root = current;
          break;
        }
        const t = getTransform(current);
        const parent = t.method("get_parent").invoke();
        if (!parent || parent.isNull()) {
          root = current;
          break;
        }
        current = parent.method("get_gameObject").invoke();
      }
      try {
        const RealtimeViewClass2 = Il2Cpp.domain.assembly("Normal.Realtime").image.class("Normal.Realtime.RealtimeView");
        const views = root.method("GetComponentsInChildren", 1).inflate(RealtimeViewClass2).invoke();
        for (let v = 0; v < views.length; v++) {
          try {
            views.get(v).method("RequestOwnership").invoke();
          } catch (_) {
          }
        }
      } catch (_) {
      }
      const rootName = root.method("get_name").invoke().toString();
      console.log("[blobtown_menu] Deleting blob root: " + rootName);
      Object.method("Destroy", 1).invoke(root);
    } catch (e) {
      console.log("[blobtown_menu] deleteBlobRoot error: " + e);
    }
  }
  let kickGunEnabled = false;
  let kickPointer = null;
  let prevKickTrigger = false;
  function enableKickGun() {
    kickGunEnabled = true;
  }
  function disableKickGun() {
    kickGunEnabled = false;
    if (kickPointer) {
      Destroy(kickPointer);
      kickPointer = null;
    }
  }
  function KickGun() {
    if (!rightHandTransform) return;
    try {
      const origin = rightHandTransform.method("get_position").invoke();
      const forward = rightHandTransform.method("get_forward").invoke();
      if (!kickPointer) {
        kickPointer = createObject(zeroVector, identityQuaternion, [0.1, 0.1, 0.1], 0, [1, 0.8, 0, 0.9]);
        try {
          Destroy(getComponent(kickPointer, Collider));
        } catch (_) {
        }
      }
      const rayHits = getRaycastHits(origin, forward, 30);
      if (rayHits.length > 0) {
        const hitPoint = rayHits[0].method("get_point").invoke();
        getTransform(kickPointer).method("set_position").invoke(hitPoint);
        if (rightTrigger && !prevKickTrigger) {
          const hitCollider = rayHits[0].method("get_collider").invoke();
          if (hitCollider && !hitCollider.isNull()) {
            const hitGo = hitCollider.method("get_gameObject").invoke();
            kickPlayer(hitGo);
          }
        }
      }
      prevKickTrigger = rightTrigger;
    } catch (e) {
      console.log("[blobtown_menu] Kick gun error: " + e);
      prevKickTrigger = rightTrigger;
    }
  }
  let kickScanDone = false;
  let gameKickMethod = null;
  let gameKickDeclaringType = null;
  function findGameKickMethod() {
    if (kickScanDone) return gameKickMethod;
    kickScanDone = true;
    const kickRe = /kick|ban|punish|moderat|evict|remove|disconnect|sanction/i;
    const goodArgRe = /Int32|Collider|GameObject|RealtimeView|PlayerController/i;
    const imagesToScan = [];
    try {
      imagesToScan.push(AssemblyCSharp);
    } catch (_) {
    }
    try {
      imagesToScan.push(Il2Cpp.domain.assembly("Normal.Realtime").image);
    } catch (_) {
    }
    const reported = [];
    for (const img of imagesToScan) {
      try {
        let classes = [];
        try {
          const c = img.classes;
          if (typeof c === "function") {
            try {
              classes = Array.from(c());
            } catch (_) {
              classes = [];
            }
          } else if (Array.isArray(c)) {
            classes = c;
          } else if (c != null && typeof c[Symbol.iterator] === "function") {
            classes = Array.from(c);
          }
        } catch (_) {
        }
        if (classes == null) continue;
        for (const cls of classes) {
          try {
            let clsName = "";
            try {
              clsName = cls.name.toString();
            } catch (_) {
              try {
                clsName = cls.toString();
              } catch (_2) {
              }
            }
            let methods = [];
            try {
              const m = cls.methods;
              if (typeof m === "function") methods = Array.from(m());
              else if (Array.isArray(m)) methods = m;
              else if (m != null && typeof m[Symbol.iterator] === "function") methods = Array.from(m);
            } catch (_) {
            }
            for (const method of methods) {
              try {
                let methodName = "";
                try {
                  methodName = method.name.toString();
                } catch (_) {
                  try {
                    methodName = method.toString();
                  } catch (_2) {
                  }
                }
                if (!methodName || !kickRe.test(methodName)) continue;
                const pc = method.parameterCount;
                let argType = "";
                if (pc === 1) {
                  try {
                    const p = method.parameters[0];
                    if (p && p.type) argType = p.type.name?.toString ? p.type.name.toString() : String(p.type.name);
                    else argType = "?";
                  } catch (_) {
                    argType = "?";
                  }
                }
                if (pc === 1 && (!argType || !goodArgRe.test(argType))) {
                  reported.push(`${clsName}.${methodName}(${argType}) [skipped arg]`);
                  continue;
                }
                reported.push(`${clsName}.${methodName}(${argType})`);
                if (pc === 1 && goodArgRe.test(argType)) {
                  gameKickMethod = method;
                  gameKickDeclaringType = cls;
                  break;
                }
              } catch (_) {
              }
            }
            if (gameKickMethod) break;
          } catch (_) {
          }
        }
      } catch (_) {
      }
      if (gameKickMethod) break;
    }
    if (gameKickMethod) {
      let dType = "";
      try {
        dType = gameKickDeclaringType.name.toString();
      } catch (_) {
      }
      let mName = "";
      try {
        mName = gameKickMethod.name.toString();
      } catch (_) {
      }
      console.log("[blobtown_menu] Found game kick API: " + dType + "." + mName);
    } else {
      console.log("[blobtown_menu] No game kick API found. Candidates:\n" + (reported.join("\n") || "(none)"));
    }
    return gameKickMethod;
  }
  function getTargetClientId(root) {
    try {
      const RealtimeViewClassK = Il2Cpp.domain.assembly("Normal.Realtime").image.class("Normal.Realtime.RealtimeView");
      const views = root.method("GetComponentsInChildren", 1).inflate(RealtimeViewClassK).invoke();
      if (views != null && !views.isNull()) {
        for (let v = 0; v < views.length; v++) {
          try {
            const owner = views.get(v).method("get_ownerIDInHierarchy").invoke();
            if (typeof owner === "number" && owner > 0) return owner;
          } catch (_) {
          }
        }
        try {
          const self = views.get(0).method("get_ownerIDSelf").invoke();
          if (typeof self === "number" && self > 0) return self;
        } catch (_) {
        }
      }
    } catch (_) {
    }
    return -1;
  }
  function invokeServerKick(clientId) {
    const method = findGameKickMethod();
    if (!method) return false;
    try {
      const isStatic = !!(method.isStatic === true);
      if (isStatic) {
        method.invoke(clientId);
        return true;
      }
      let dType = null;
      try {
        dType = gameKickDeclaringType;
      } catch (_) {
      }
      if (!dType) {
        try {
          dType = method.declaringType;
        } catch (_) {
        }
      }
      if (dType) {
        try {
          const instances = Object.method("FindObjectsOfType").inflate(dType).invoke();
          if (instances != null && !instances.isNull() && instances.length > 0) {
            method.invoke(instances.get(0), clientId);
            return true;
          }
        } catch (_) {
        }
      }
      try {
        method.invoke(clientId);
        return true;
      } catch (_) {
      }
    } catch (e) {
    }
    return false;
  }
  function kickPlayer(hitGo) {
    try {
      console.log("[blobtown_menu] Kick target: " + hitGo.method("get_name").invoke().toString());
      const localGo = (() => {
        try {
          const inst = getPlayerController();
          return inst ? inst.method("get_gameObject").invoke() : null;
        } catch (_) {
          return null;
        }
      })();
      let root = hitGo;
      let current = hitGo;
      for (let i = 0; i < 16; i++) {
        if (!current || current.isNull()) break;
        const playerComp = getComponent(current, PlayerControllerClass);
        const isPlayer = playerComp && playerComp.isNull ? !playerComp.isNull() : !!playerComp;
        if (isPlayer) {
          root = current;
          break;
        }
        const t = getTransform(current);
        const parent = t.method("get_parent").invoke();
        if (!parent || parent.isNull()) {
          root = current;
          break;
        }
        current = parent.method("get_gameObject").invoke();
      }
      if (localGo && root.handle.equals(localGo.handle)) {
        console.log("[blobtown_menu] Skipping self - cannot kick yourself.");
        return;
      }
      const clientId = getTargetClientId(root);
      console.log("[blobtown_menu] Target Normcore clientID: " + clientId);
      if (clientId > 0 && invokeServerKick(clientId)) {
        console.log("[blobtown_menu] Server kick dispatched for clientID " + clientId + " - they should be disconnected.");
        return;
      }
      console.log("[blobtown_menu] No server kick API usable - falling back to avatar removal.");
      try {
        const RealtimeViewClass32 = Il2Cpp.domain.assembly("Normal.Realtime").image.class("Normal.Realtime.RealtimeView");
        const views = root.method("GetComponentsInChildren", 1).inflate(RealtimeViewClass32).invoke();
        for (let v = 0; v < views.length; v++) {
          try {
            views.get(v).method("RequestOwnership").invoke();
          } catch (_) {
          }
        }
      } catch (_) {
      }
      const rootName = root.method("get_name").invoke().toString();
      console.log("[blobtown_menu] Removing avatar root: " + rootName);
      Object.method("Destroy", 1).invoke(root);
    } catch (e) {
      console.log("[blobtown_menu] kickPlayer error: " + e);
    }
  }
  let editModeForced = false;
  function toggleForceEditMode(enabled) {
    editModeForced = enabled;
    console.log(`[blobtown_menu] Force Edit Mode set to: ${enabled}`);
    applyForceEditMode();
  }
  function applyForceEditMode() {
    if (!editModeForced) return;
    try {
      const EditModeManagerClass = AssemblyCSharp.class("Revel.EditModeManager");
      if (EditModeManagerClass) {
        try {
          const inst = EditModeManagerClass.field("instance").value;
          if (inst && !inst.isNull?.()) {
            try {
              inst.field("isEditMode").value = true;
            } catch (_) {
            }
            try {
              inst.method("SetEditMode", 1).invoke(true);
            } catch (_) {
            }
            try {
              inst.method("EnableEditMode", 0).invoke();
            } catch (_) {
            }
          }
        } catch (_) {
        }
      }
      const PermissionControllerClass = AssemblyCSharp.class("Revel.PermissionController");
      if (PermissionControllerClass) {
        try {
          const inst = PermissionControllerClass.field("instance").value;
          if (inst && !inst.isNull?.()) {
            try {
              inst.field("canEdit").value = true;
            } catch (_) {
            }
            try {
              inst.field("hasPermission").value = true;
            } catch (_) {
            }
            try {
              inst.field("isEditor").value = true;
            } catch (_) {
            }
          }
        } catch (_) {
        }
      }
      const CreateMenuClass = AssemblyCSharp.class("Revel.CreateMenu");
      if (CreateMenuClass) {
        try {
          const menus = Object.method("FindObjectsOfType").inflate(CreateMenuClass).invoke();
          for (let i = 0; i < menus.length; i++) {
            try {
              menus.get(i).method("set_enabled").invoke(true);
            } catch (_) {
            }
          }
        } catch (_) {
        }
      }
    } catch (e) {
      console.log("[blobtown_menu] Force edit mode notice: " + e);
    }
  }
  const UnityEngineAudio = Il2Cpp.domain.assembly("UnityEngine.AudioModule").image;
  const AudioSourceClass = UnityEngineAudio.class("UnityEngine.AudioSource");
  const AudioListenerClass = UnityEngineAudio.class("UnityEngine.AudioListener");
  const AudioClipClassLocal = UnityEngineAudio.class("UnityEngine.AudioClip");
  const SingleClassLocal = Il2Cpp.corlib.class("System.Single");
  let soundboardFiles = [];
  let currentAudioSource = null;
  let currentRecorder = null;
  let isSoundboardStopping = false;
  function StopSoundboardAudio() {
    try {
      isSoundboardStopping = true;
      stopVoiceStreaming();
      if (currentAudioSource != null) {
        try {
          Object.method("Destroy", 1).invoke(currentAudioSource.method("get_gameObject").invoke());
        } catch (e) {
        }
        currentAudioSource = null;
      }
      if (currentRecorder != null) {
        try {
          currentRecorder.method("set_SourceType").invoke(0);
          currentRecorder.method("set_TransmitEnabled").invoke(true);
        } catch (e) {
        }
        currentRecorder = null;
      }
      console.log("[Soundboard] Stopped playback.");
      setTimeout(() => {
        isSoundboardStopping = false;
      }, 100);
    } catch (e) {
    }
  }
  let voiceSendTimer = null;
  let voiceNetRunning = false;
  function stopVoiceStreaming() {
    voiceNetRunning = false;
    if (voiceSendTimer != null) {
      clearTimeout(voiceSendTimer);
      voiceSendTimer = null;
    }
  }
  const RealtimeAvatarVoiceClass = (() => {
    try {
      return AssemblyCSharp.class("RealtimeAvatarVoice");
    } catch (_) {
      return null;
    }
  })();
  function getLocalVoice() {
    try {
      if (!RealtimeAvatarVoiceClass) return null;
      const voices = Object.method("FindObjectsOfType").inflate(RealtimeAvatarVoiceClass).invoke();
      if (voices == null || voices.isNull()) return null;
      let fallback = null;
      for (let i = 0; i < voices.length; i++) {
        const v = voices.get(i);
        if (v == null || v.isNull?.()) continue;
        if (!fallback) fallback = v;
        try {
          const view = getComponent(v, RealtimeViewClass3);
          if (view != null && !(view.isNull && view.isNull())) {
            const isLocal = view.method("get_isOwnedLocallyInHierarchy").invoke();
            if (isLocal) return v;
          }
        } catch (_) {
        }
      }
      return fallback;
    } catch (_) {
      return null;
    }
  }
  function getVoiceInputStream(voice) {
    try {
      if (!RealtimeAvatarVoiceClass) return null;
      try {
        voice.method("ConnectLocalAudioStream").invoke();
      } catch (_) {
      }
      for (const field of RealtimeAvatarVoiceClass.fields) {
        try {
          const ft = field.type.name;
          if (typeof ft === "string" && ft.includes("AudioInputStream")) {
            const val = voice.field(field.name).value;
            if (val != null && !(val.isNull && val.isNull())) return val;
          }
        } catch (_) {
        }
      }
      for (const field of RealtimeAvatarVoiceClass.fields) {
        try {
          const name = field.name;
          if (/input|stream/i.test(name)) {
            const val = voice.field(name).value;
            if (val != null && !(val.isNull && val.isNull())) return val;
          }
        } catch (_) {
        }
      }
    } catch (_) {
    }
    return null;
  }
  function streamClipOverVoice(clip) {
    stopVoiceStreaming();
    try {
      const voice = getLocalVoice();
      if (voice == null) {
        console.log("[Soundboard] No RealtimeAvatarVoice found - skipping network stream.");
        return;
      }
      const inStream = getVoiceInputStream(voice);
      if (inStream == null) {
        console.log("[Soundboard] No AudioInputStream found on voice - skipping network stream.");
        return;
      }
      const frameCount = clip.method("get_length").invoke();
      const channels = clip.method("get_channels").invoke();
      const sampleRate = clip.method("get_frequency").invoke();
      if (frameCount <= 0 || channels <= 0 || sampleRate <= 0) return;
      const sendMethod = inStream.method("SendRawAudioData");
      let pc = 0;
      try {
        pc = sendMethod.parameterCount;
      } catch (_) {
      }
      let paramType = "";
      if (pc >= 1) {
        try {
          const p0 = sendMethod.parameters[0];
          if (p0 && p0.type) paramType = (p0.type.name?.toString ? p0.type.name.toString() : String(p0.type.name)) || "";
        } catch (_) {
        }
      }
      console.log("[Soundboard] Voice stream: SendRawAudioData params=" + pc + " type=[" + paramType + "] ch=" + channels + " rate=" + sampleRate);
      const chunkFrames = Math.max(256, Math.round(sampleRate * 0.02));
      const slice = Il2Cpp.array(SingleClassLocal, chunkFrames * channels);
      const ByteClass = Il2Cpp.corlib.class("System.Byte");
      const ShortClass = Il2Cpp.corlib.class("System.Int16");
      let framePos = 0;
      voiceNetRunning = true;
      const tick = () => {
        if (!voiceNetRunning) return;
        if (framePos >= frameCount) {
          voiceNetRunning = false;
          try {
            inStream.method("SendQueuedMessages").invoke();
          } catch (_) {
          }
          return;
        }
        const n = Math.min(chunkFrames, frameCount - framePos);
        const count = n * channels;
        try {
          clip.method("GetData", 2).invoke(slice, framePos * channels);
          if (paramType.includes("Single") || paramType.includes("Float")) {
            const chunk = Il2Cpp.array(SingleClassLocal, count);
            for (let i = 0; i < count; i++) chunk.set(i, slice.get(i));
            sendMethod.invoke(chunk);
          } else if (paramType.includes("Int16") || paramType.includes("Short")) {
            const chunk = Il2Cpp.array(ShortClass, count);
            for (let i = 0; i < count; i++) {
              let v = slice.get(i);
              if (v > 1) v = 1;
              else if (v < -1) v = -1;
              chunk.set(i, Math.floor(v * 32767));
            }
            sendMethod.invoke(chunk);
          } else {
            const chunk = Il2Cpp.array(ByteClass, count * 2);
            let b = 0;
            for (let i = 0; i < count; i++) {
              let v = slice.get(i);
              if (v > 1) v = 1;
              else if (v < -1) v = -1;
              const s = Math.floor(v * 32767);
              chunk.set(b++, s & 255);
              chunk.set(b++, s >> 8 & 255);
            }
            sendMethod.invoke(chunk);
          }
        } catch (e) {
          console.log("[Soundboard] Voice frame error: " + e);
          voiceNetRunning = false;
          return;
        }
        framePos += n;
        voiceSendTimer = setTimeout(tick, 20);
      };
      voiceSendTimer = setTimeout(tick, 30);
    } catch (e) {
      voiceNetRunning = false;
      console.log("[Soundboard] Network voice stream error: " + e);
    }
  }
  function PlayClipOnNetwork(clip) {
    try {
      if (isSoundboardStopping) return;
      console.log("[Soundboard] Stopping previous audio...");
      StopSoundboardAudio();
      console.log("[Soundboard] Finding Recorder class...");
      let RecorderClass = null;
      try {
        RecorderClass = AssemblyCSharp.class("Photon.Voice.Unity.Recorder");
      } catch (_) {
      }
      if (!RecorderClass) try {
        RecorderClass = Il2Cpp.domain.assembly("PhotonVoice").image.class("Photon.Voice.Unity.Recorder");
      } catch (_) {
      }
      if (!RecorderClass) try {
        RecorderClass = Il2Cpp.domain.assembly("PhotonVoice.API").image.class("Photon.Voice.Unity.Recorder");
      } catch (_) {
      }
      let recorder = null;
      if (RecorderClass) {
        console.log("[Soundboard] Finding Recorder objects...");
        const recorders = Object.method("FindObjectsOfType").inflate(RecorderClass).invoke();
        if (recorders != null && !recorders.isNull() && recorders.length > 0) {
          recorder = recorders.get(0);
          console.log("[Soundboard] Found local recorder.");
        }
      }
      if (recorder != null && !recorder.isNull()) {
        console.log("[Soundboard] Modifying recorder properties...");
        recorder.method("set_SourceType").invoke(1);
        recorder.method("set_AudioClip").invoke(clip);
        recorder.method("set_LoopAudioClip").invoke(false);
        recorder.method("set_TransmitEnabled").invoke(true);
        currentRecorder = recorder;
      } else {
        console.log("[Soundboard] No Photon Voice Recorder found - playing locally only.");
      }
      console.log("[Soundboard] Creating local AudioSource...");
      const go = GameObject.alloc();
      go.method(".ctor", 0).invoke();
      const src = go.method("AddComponent", 1).invoke(AudioSourceClass.type.object);
      console.log("[Soundboard] Playing local clip...");
      src.method("set_clip").invoke(clip);
      try {
        src.method("set_spatialBlend").invoke(0);
      } catch (e) {
      }
      src.method("Play", 0).invoke();
      currentAudioSource = src;
      streamClipOverVoice(clip);
      const checkPlaying = setInterval(() => {
        try {
          if (currentAudioSource == null || isSoundboardStopping) {
            clearInterval(checkPlaying);
            return;
          }
          const isPlaying = currentAudioSource.method("get_isPlaying").invoke();
          if (!isPlaying) {
            clearInterval(checkPlaying);
            console.log("[Soundboard] Audio finished naturally.");
            StopSoundboardAudio();
          }
        } catch (e) {
          clearInterval(checkPlaying);
        }
      }, 1e3);
      console.log("[Soundboard] Playing audio locally...");
    } catch (e) {
      console.log("[Soundboard] Play error: " + e);
    }
  }
  let audioProbeDone = false;
  function probeAudioStreams() {
    if (audioProbeDone) return;
    audioProbeDone = true;
    const out = [];
    const interesting = /audio|sound|music|song|voice|stream|speaker|boombox|radio|mp3|wav|ogg|media|record|decode|codec|fmod|streamingasset|asset|url|http/i;
    try {
      const scanNames = ["Assembly-CSharp", "Normal.Realtime"];
      const images = [];
      for (const n of scanNames) {
        try {
          const img = Il2Cpp.domain.assembly(n).image;
          if (img) images.push(img);
        } catch (_) {
        }
      }
      out.push("images=" + images.length);
      let classCount = 0;
      for (const img of images) {
        try {
          let imgName = "";
          try {
            imgName = img.name.toString();
          } catch (_) {
            try {
              imgName = img.toString();
            } catch (_2) {
            }
          }
          const classes = img.classes != null && typeof img.classes === "function" ? img.classes() : img.classes;
          if (classes == null) continue;
          let list = [];
          try {
            list = Array.from(classes);
          } catch (_) {
            try {
              for (const c of classes) list.push(c);
            } catch (_2) {
            }
          }
          for (const k of list) {
            if (classCount++ > 4e3) break;
            let kN = "";
            try {
              kN = k.name.toString();
            } catch (_) {
              try {
                kN = k.toString();
              } catch (_2) {
              }
            }
            if (!kN || !interesting.test(kN)) continue;
            out.push("  [" + imgName + "] class: " + kN);
            try {
              const m = k.methods != null && typeof k.methods === "function" ? k.methods() : k.methods;
              if (m == null) continue;
              let ml = [];
              try {
                ml = Array.from(m);
              } catch (_) {
                try {
                  for (const mm of m) ml.push(mm);
                } catch (_2) {
                }
              }
              const mn = ml.map((mm) => {
                try {
                  return mm.name.toString();
                } catch (_) {
                  try {
                    return mm.toString();
                  } catch (_2) {
                    return "?";
                  }
                }
              });
              out.push("    [methods] " + (mn.slice(0, 40).join(", ") || "(none)"));
            } catch (_) {
            }
          }
        } catch (_) {
        }
      }
      if (out.length === 1) out.push("no audio-ish classes found");
    } catch (e) {
      out.push("probe error: " + e);
    }
    console.log("[Soundboard/PROBE]\n" + out.join("\n"));
  }
  let activeWebRequest = null;
  function PlaySoundboardAudio(filePath) {
    setTimeout(() => {
      try {
        playSoundboardAudioInternal(filePath);
      } catch (e) {
        console.log("[Soundboard] Soundboard play error: " + e);
      }
    }, 0);
  }
  function playSoundboardAudioInternal(filePath) {
    try {
      console.log("[Soundboard] Trying UnityWebRequest audio decode for: " + filePath);
      const uriStr = Il2Cpp.string("file://" + filePath);
      const UnityWebRequest = Il2Cpp.domain.assembly("UnityEngine.UnityWebRequestModule").image.class("UnityEngine.Networking.UnityWebRequest");
      const request = UnityWebRequest.method("Get", 1).invoke(uriStr);
      activeWebRequest = request;
      const SystemUri = Il2Cpp.domain.assembly("System").image.class("System.Uri");
      const uriObj = SystemUri.alloc();
      uriObj.method(".ctor", 1).invoke(uriStr);
      const AudioType_UNKNOWN = 0;
      const DownloadHandlerAudioClip = Il2Cpp.domain.assembly("UnityEngine.UnityWebRequestAudioModule").image.class("UnityEngine.Networking.DownloadHandlerAudioClip");
      const handler = DownloadHandlerAudioClip.alloc();
      handler.method(".ctor", 2).invoke(uriObj, AudioType_UNKNOWN);
      try {
        handler.method("set_streamAudio").invoke(false);
      } catch (e) {
      }
      request.method("set_downloadHandler").invoke(handler);
      request.method("SendWebRequest").invoke();
      let checkCount = 0;
      const checkDone = setInterval(() => {
        try {
          checkCount++;
          const isDone = request.method("get_isDone").invoke();
          if (isDone || checkCount > 50) {
            clearInterval(checkDone);
            if (isDone) {
              const clip = handler.method("get_audioClip").invoke();
              if (clip != null && !clip.isNull()) {
                PlayClipOnNetwork(clip);
              } else {
                console.log("[Soundboard] Web decode returned no clip - using local fallback.");
                decodeWavClipFromDisk(filePath, (clip2) => {
                  if (clip2) PlayClipOnNetwork(clip2);
                });
              }
            } else {
              console.log("[Soundboard] Web decode timed out - using local fallback.");
              decodeWavClipFromDisk(filePath, (clip) => {
                if (clip) PlayClipOnNetwork(clip);
              });
            }
          }
        } catch (e) {
          clearInterval(checkDone);
        }
      }, 100);
      return;
    } catch (e) {
      console.log("[Soundboard] Web decode unavailable (" + e + ") - using local WAV fallback.");
    }
    if (filePath.toLowerCase().endsWith(".wav")) {
      decodeWavClipFromDisk(filePath, (clip) => {
        if (clip) {
          PlayClipOnNetwork(clip);
        } else {
          console.log("[Soundboard] Local WAV decode failed for " + filePath);
          console.log("[Soundboard] Re-export as standard 16-bit PCM WAV (44.1kHz).");
        }
      });
      return;
    }
    decodeWithLegacyWww(filePath, (clip) => {
      if (clip) {
        PlayClipOnNetwork(clip);
      } else {
        const isWav = filePath.toLowerCase().endsWith(".wav");
        console.log("[Soundboard] Local decode failed for " + filePath);
        console.log("[Soundboard] Blob Town ships no public mp3/ogg decoder (no UnityWebRequestAudioModule / WWW).");
        if (!isWav) {
          console.log("[Soundboard] Convert the file to 16-bit PCM WAV (44.1kHz mono/stereo) and it will play.");
        } else {
          console.log("[Soundboard] The WAV header may be invalid - re-export as standard 16-bit PCM WAV.");
        }
      }
    });
  }
  function decodeWithLegacyWww(filePath, onResult) {
    try {
      const wwwAssembly = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image;
      const wwwClass = wwwAssembly.class("UnityEngine.WWW");
      if (!wwwClass) {
        console.log("[Soundboard] WWW class not found.");
        onResult(null);
        return;
      }
      console.log("[Soundboard] WWW.ctor(url)...");
      const www = wwwClass.alloc();
      www.method(".ctor", 1).invoke(Il2Cpp.string("file://" + filePath));
      let checkCount = 0;
      const checkWww = setInterval(() => {
        try {
          checkCount++;
          let done = false;
          try {
            done = www.method("get_isDone").invoke();
          } catch (_) {
            done = true;
          }
          if (done || checkCount > 25) {
            clearInterval(checkWww);
            let clip = null;
            if (done) {
              try {
                clip = www.method("get_audioClip").invoke();
              } catch (e) {
                console.log("[Soundboard] get_audioClip error: " + e);
                clip = null;
              }
              if (clip != null && !clip.isNull()) {
                console.log("[Soundboard] WWW produced an AudioClip (mp3/ogg ok).");
                onResult(clip);
                return;
              }
            }
            console.log("[Soundboard] WWW produced no clip.");
            onResult(null);
          }
        } catch (e) {
          clearInterval(checkWww);
          onResult(null);
        }
      }, 250);
      return;
    } catch (e) {
      console.log("[Soundboard] WWW decode error: " + e);
      onResult(null);
    }
  }
  let wavDecodeBusy = false;
  const MAX_WAV_DURATION_SEC = 30;
  const WAV_CHUNK_SAMPLES = 6e4;
  function decodeWavClipFromDisk(filePath, onResult) {
    if (wavDecodeBusy) {
      console.log("[Soundboard] WAV decode already running - try again in a moment.");
      onResult(null);
      return;
    }
    let cancelled = false;
    try {
      console.log("[Soundboard] Reading WAV bytes from disk...");
      const byteArr = SystemIOFile.method("ReadAllBytes", 1).invoke(Il2Cpp.string(filePath));
      if (byteArr == null || byteArr.isNull()) {
        console.log("[Soundboard] ReadAllBytes returned null.");
        onResult(null);
        return;
      }
      const len = byteArr.length;
      if (len < 44) {
        console.log("[Soundboard] File too small to be WAV (" + len + " bytes).");
        onResult(null);
        return;
      }
      const getU16 = (o) => (byteArr.get(o) | byteArr.get(o + 1) << 8) & 65535;
      const getU32 = (o) => (byteArr.get(o) | byteArr.get(o + 1) << 8 | byteArr.get(o + 2) << 16 | byteArr.get(o + 3) << 24) >>> 0;
      if (byteArr.get(0) !== 82 || byteArr.get(1) !== 73 || byteArr.get(2) !== 70 || byteArr.get(3) !== 70) {
        console.log("[Soundboard] Not a RIFF file.");
        onResult(null);
        return;
      }
      let fmtOffset = -1;
      let dataOffset = -1;
      let dataSize = 0;
      let offset = 12;
      while (offset + 8 <= len) {
        const chunkId = String.fromCharCode(byteArr.get(offset), byteArr.get(offset + 1), byteArr.get(offset + 2), byteArr.get(offset + 3));
        const chunkSize = getU32(offset + 4);
        if (chunkId === "fmt ") fmtOffset = offset + 8;
        if (chunkId === "data") {
          dataOffset = offset + 8;
          dataSize = chunkSize;
        }
        offset += 8 + chunkSize + chunkSize % 2;
        if (dataOffset !== -1 && fmtOffset !== -1) break;
      }
      if (fmtOffset === -1 || dataOffset === -1) {
        console.log("[Soundboard] Could not find fmt/data chunks.");
        onResult(null);
        return;
      }
      const audioFormat = getU16(fmtOffset);
      const channels = getU16(fmtOffset + 2);
      const sampleRate = getU32(fmtOffset + 4);
      const bitsPerSample = getU16(fmtOffset + 14);
      console.log("[Soundboard] WAV fmt=" + audioFormat + " ch=" + channels + " rate=" + sampleRate + " bits=" + bitsPerSample + " dataBytes=" + dataSize);
      if (channels < 1 || sampleRate < 1) {
        console.log("[Soundboard] Invalid WAV header.");
        onResult(null);
        return;
      }
      const sampleCount = Math.floor(dataSize / (bitsPerSample / 8)) | 0;
      const frameCount = Math.floor(sampleCount / channels) | 0;
      if (frameCount < 1) {
        console.log("[Soundboard] No audio frames.");
        onResult(null);
        return;
      }
      const maxFrames = MAX_WAV_DURATION_SEC * sampleRate;
      const cappedFrames = Math.min(frameCount, maxFrames);
      const totalSamples = cappedFrames * channels;
      if (cappedFrames < frameCount) {
        console.log("[Soundboard] Truncating " + (frameCount / sampleRate).toFixed(1) + "s audio to " + MAX_WAV_DURATION_SEC + "s (" + cappedFrames + " frames).");
      }
      const floatArr = Il2Cpp.array(SingleClassLocal, totalSamples);
      let readSample = (i) => {
        if (audioFormat === 1 && bitsPerSample === 16) {
          const s = byteArr.get(dataOffset + i * 2) | byteArr.get(dataOffset + i * 2 + 1) << 8;
          const v = s > 32767 ? s - 65536 : s;
          return v / 32768;
        }
        if (audioFormat === 3 && bitsPerSample === 32) {
          const o = dataOffset + i * 4;
          const b0 = byteArr.get(o), b1 = byteArr.get(o + 1), b2 = byteArr.get(o + 2), b3 = byteArr.get(o + 3);
          const u = (b0 | b1 << 8 | b2 << 16 | b3 << 24) >>> 0;
          const sign = u & 2147483648 ? -1 : 1;
          const exp = (u >> 23 & 255) - 127;
          const mant = u & 8388607 | 8388608;
          let v = sign * (mant / 8388608) * Math.pow(2, exp);
          if (exp === -127) v = sign * (u & 8388607) / 8388608 * Math.pow(2, -126);
          if (exp === 128) v = sign > 0 ? 34028234663852886e22 : -34028234663852886e22;
          return v;
        }
        if (audioFormat === 1 && bitsPerSample === 8) {
          return (byteArr.get(dataOffset + i) - 128) / 128;
        }
        return 0;
      };
      wavDecodeBusy = true;
      const buildClip = () => {
        wavDecodeBusy = false;
        if (cancelled) {
          onResult(null);
          return;
        }
        try {
          console.log("[Soundboard] Creating AudioClip from PCM...");
          const clip = AudioClipClassLocal.method("Create", 5).invoke(Il2Cpp.string("soundboard"), cappedFrames, channels, sampleRate, false);
          if (clip == null || clip.isNull()) {
            console.log("[Soundboard] AudioClip.Create returned null.");
            onResult(null);
            return;
          }
          clip.method("SetData", 2).invoke(floatArr, 0);
          console.log("[Soundboard] Local AudioClip ready: " + cappedFrames + " frames, " + channels + "ch @ " + sampleRate + "Hz");
          onResult(clip);
        } catch (e) {
          console.log("[Soundboard] AudioClip build error: " + e);
          onResult(null);
        }
      };
      let pos = 0;
      const step = () => {
        if (cancelled) {
          wavDecodeBusy = false;
          onResult(null);
          return;
        }
        const end = Math.min(pos + WAV_CHUNK_SAMPLES, totalSamples);
        try {
          for (let i = pos; i < end; i++) {
            floatArr.set(i, readSample(i));
          }
        } catch (e) {
          console.log("[Soundboard] Decode chunk error: " + e);
          wavDecodeBusy = false;
          onResult(null);
          return;
        }
        pos = end;
        if (pos < totalSamples) {
          setTimeout(step, 5);
        } else {
          buildClip();
        }
      };
      step();
    } catch (e) {
      wavDecodeBusy = false;
      console.log("[Soundboard] Local WAV decode error: " + e);
      if (typeof onResult === "function") onResult(null);
    }
  }
  function LoadSoundboardFiles() {
    try {
      console.log("[Soundboard] Getting Application class...");
      const ApplicationClass = Il2Cpp.domain.assembly("UnityEngine.CoreModule").image.class("UnityEngine.Application");
      console.log("[Soundboard] Calling get_persistentDataPath...");
      const persistentPathRaw = ApplicationClass.method("get_persistentDataPath").invoke().toString();
      const persistentPath = persistentPathRaw.substring(1, persistentPathRaw.length - 1);
      const targetPath = persistentPath + "/Soundboard";
      console.log("[Soundboard] Target path: " + targetPath);
      console.log("[Soundboard] Getting Directory class...");
      const pathStr = Il2Cpp.string(targetPath);
      console.log("[Soundboard] Checking Exists...");
      if (!SystemIODirectory.method("Exists", 1).invoke(pathStr)) {
        console.log("[Soundboard] Creating Directory...");
        SystemIODirectory.method("CreateDirectory", 1).invoke(pathStr);
      }
      console.log("[Soundboard] Calling GetFiles...");
      const files = SystemIODirectory.method("GetFiles", 1).invoke(pathStr);
      soundboardFiles = [];
      console.log("[Soundboard] Processing files array...");
      if (files != null && !files.isNull()) {
        const fileArray = new Il2Cpp.Array(files);
        for (let i = 0; i < fileArray.length; i++) {
          let file = fileArray.get(i).toString();
          file = file.replace(/"/g, "");
          if (file.toLowerCase().includes(".mp3") || file.toLowerCase().includes(".wav")) {
            soundboardFiles.push(file);
          }
        }
      }
      console.log("[Soundboard] Found " + soundboardFiles.length + " files.");
      buildButtonsList();
      reloadMenu();
    } catch (e) {
      console.log("[Soundboard] Error loading files: " + e);
    }
  }
  function spawnBlobForCurrentMode(modelName) {
    if (blobBuildEnabled) spawn3DModelAsBlobsAtRightHand(modelName);
    else spawn3DModelAtRightHand(modelName);
  }
  function buildButtonsList() {
    const modelFiles = refreshModelFileList();
    const modelButtons = modelFiles.length > 0 ? modelFiles.map((f) => new ButtonInfo({
      buttonText: "Spawn " + (f.length > 12 ? f.substring(0, 12) : f),
      isTogglable: false,
      method: () => spawnBlobForCurrentMode(f)
    })) : [
      new ButtonInfo({
        buttonText: "Refresh Folder",
        isTogglable: false,
        method: () => {
          buildButtonsList();
          reloadMenu();
        }
      }),
      new ButtonInfo({
        buttonText: "Spawn Cube",
        isTogglable: false,
        method: () => spawnBlobForCurrentMode("Cube.gltf")
      })
    ];
    const soundboardButtons = [
      new ButtonInfo({
        buttonText: "Refresh sounds",
        isTogglable: false,
        method: () => {
          LoadSoundboardFiles();
        }
      }),
      new ButtonInfo({
        buttonText: "Stop sounds",
        isTogglable: false,
        method: () => {
          StopSoundboardAudio();
        }
      }),
      ...soundboardFiles.map((filePath) => {
        const fileName = filePath.substring(filePath.lastIndexOf("/") + 1);
        return new ButtonInfo({
          buttonText: fileName.substring(0, Math.min(fileName.length, 14)),
          // truncate to fit
          isTogglable: false,
          method: () => PlaySoundboardAudio(filePath)
        });
      })
    ];
    buttons = [
      [
        // Theme (index 0, matches CATEGORY_NAMES[0]) - one plain button per theme
        ...THEMES.map((theme, idx) => new ButtonInfo({
          buttonText: theme.name,
          isTogglable: false,
          method: () => {
            themeIndex = idx;
            applyTheme();
          }
        }))
      ],
      [
        // Movement (index 1, matches CATEGORY_NAMES[1])
        new ButtonInfo({ buttonText: "Fly", isTogglable: true, enableMethod: () => {
        }, disableMethod: StopFly }),
        new ButtonInfo({ buttonText: "Teleport Gun", isTogglable: true, enableMethod: enableTeleportGun, disableMethod: disableTeleportGun }),
        new ButtonInfo({ buttonText: "Force Grab Blobs", isTogglable: true, enableMethod: enableForceGrab, disableMethod: disableForceGrab }),
        new ButtonInfo({ buttonText: "Delete Blob Gun", isTogglable: true, enableMethod: enableBlobDelete, disableMethod: disableBlobDelete }),
        new ButtonInfo({ buttonText: "Kick Gun", isTogglable: true, enableMethod: enableKickGun, disableMethod: disableKickGun }),
        new ButtonInfo({ buttonText: "Force Edit Mode", isTogglable: true, enableMethod: () => toggleForceEditMode(true), disableMethod: () => toggleForceEditMode(false) }),
        new ButtonInfo({ buttonText: "Noclip", isTogglable: true, enableMethod: enableNoclip, disableMethod: disableNoclip }),
        new ButtonInfo({ buttonText: "World Noclip", isTogglable: true, enableMethod: () => {
        }, disableMethod: () => {
          toggleGlobalColliders(true);
        } }),
        new ButtonInfo({ buttonText: "Speed Boost", isTogglable: true, enableMethod: enableSpeedBoost, disableMethod: disableSpeedBoost }),
        new ButtonInfo({ buttonText: "Super Jump", isTogglable: true, enableMethod: enableSuperJump, disableMethod: disableSuperJump }),
        new ButtonInfo({ buttonText: "Infinite Dash", isTogglable: false, method: InfiniteDash }),
        new ButtonInfo({ buttonText: "Low Gravity", isTogglable: false, method: LowGravity }),
        new ButtonInfo({ buttonText: "Zero Gravity", isTogglable: false, method: ZeroGravity }),
        new ButtonInfo({ buttonText: "Reset Gravity", isTogglable: false, method: NormalGravity })
      ],
      [
        // Account (index 2, matches CATEGORY_NAMES[2])
        new ButtonInfo({
          buttonText: "99999 Blobuim",
          isTogglable: true,
          enableMethod: () => toggleBlobuimSpoof(true),
          disableMethod: () => toggleBlobuimSpoof(false)
        }),
        new ButtonInfo({
          buttonText: "Name: slippery lemon",
          isTogglable: false,
          method: () => setPlayerName("slippery lemon")
        }),
        new ButtonInfo({
          buttonText: "Name: chef",
          isTogglable: false,
          method: () => setPlayerName("chef")
        }),
        new ButtonInfo({
          buttonText: "Name: Clark",
          isTogglable: false,
          method: () => setPlayerName("Clark")
        })
      ],
      [
        // 3D Models (index 3, matches CATEGORY_NAMES[3])
        new ButtonInfo({ buttonText: "Blob Build", isTogglable: true, enableMethod: () => {
          blobBuildEnabled = true;
        }, disableMethod: () => {
          blobBuildEnabled = false;
        } }),
        ...modelButtons
      ],
      [
        // Soundboard (index 4, matches CATEGORY_NAMES[4])
        ...soundboardButtons
      ]
    ];
    let flyButton = buttons[1][0];
    flyButton.enableMethod = () => {
      flyEnabled = true;
    };
    flyButton.disableMethod = () => {
      flyEnabled = false;
      StopFly();
    };
    let buttonMap = /* @__PURE__ */ new Map();
    buttons.flat().forEach((button) => buttonMap.set(button.buttonText, button));
  }
  buildButtonsList();
  LoadSoundboardFiles();
  try {
    setTimeout(probeAudioStreams, 3e3);
  } catch (_) {
  }
  let flyEnabled = false;
  function getButtonByName(buttonText) {
    for (let cat of buttons) {
      for (let b of cat) {
        if (b.buttonText === buttonText) return b;
      }
    }
    return void 0;
  }
  const ButtonActivation = RoomAcousticsBlockClass.method("OnTriggerEnter", 1);
  ButtonActivation.implementation = function(collider) {
    try {
      const rawName = this.method("get_name", 0).invoke().toString();
      if (rawName.length > 1 && rawName[1] == "@") {
        if (referenceCollider && collider.handle.equals(referenceCollider.handle)) {
          const goName = rawName.substring(2, rawName.length - 1);
          const _time = Time.method("get_time", 0).invoke();
          if (_time > buttonClickDelay) {
            buttonClickDelay = _time + 0.2;
            if (goName === "Home") {
              currentCategory = -1;
              currentPage = 0;
              reloadMenu();
              return;
            }
            if (goName === "PreviousPage") {
              currentPage = Math.max(0, currentPage - 1);
              reloadMenu();
              return;
            }
            if (goName === "NextPage") {
              currentPage += 1;
              reloadMenu();
              return;
            }
            if (currentCategory === -1) {
              const tabIndex = CATEGORY_NAMES.indexOf(goName);
              if (tabIndex !== -1) {
                currentCategory = tabIndex;
                currentPage = 0;
                reloadMenu();
              }
              return;
            }
            const button = getButtonByName(goName);
            if (button) {
              if (button.isTogglable) {
                button.enabled = !button.enabled;
                if (button.enabled) button.enableMethod?.();
                else button.disableMethod?.();
              } else {
                button.method?.();
              }
              reloadMenu();
            }
          }
        }
        return;
      }
    } catch (e) {
      console.log("[blobtown_menu] button activation handler failed: " + e);
    }
    try {
      return this.method("OnTriggerEnter", 1).invoke(collider);
    } catch (_) {
      return void 0;
    }
  };
  const PlayerControllerUpdate = PlayerControllerClass.method("Update", 0);
  PlayerControllerUpdate.implementation = function() {
    try {
      if (refreshPlayerRefs()) {
        OVRInputHandler.update();
        leftPrimary = OVRInputHandler.leftControllerPrimaryButton;
        leftSecondary = OVRInputHandler.leftControllerSecondaryButton;
        rightPrimary = OVRInputHandler.rightControllerPrimaryButton;
        rightSecondary = OVRInputHandler.rightControllerSecondaryButton;
        leftGrab = OVRInputHandler.leftGrab;
        rightGrab = OVRInputHandler.rightGrab;
        leftTrigger = OVRInputHandler.leftControllerTriggerButton;
        rightTrigger = OVRInputHandler.rightControllerTriggerButton;
        deltaTime = Time.method("get_deltaTime", 0).invoke();
        time = Time.method("get_time", 0).invoke();
        if (leftSecondary) {
          if (menu_local == null) renderMenu();
          else recenterMenu();
          menuClosing = false;
        } else if (menu_local != null) {
          menuClosing = true;
        }
        if (menu_local != null) {
          framesSinceCameraFix++;
          if (framesSinceCameraFix >= 90) {
            framesSinceCameraFix = 0;
            fixCameraCullingMasks();
          }
        }
        if (menu_local != null) {
          menuAnimation += (menuClosing ? -menuCloseSpeed : menuOpenSpeed) * deltaTime;
          menuAnimation = Math.max(0, Math.min(1, menuAnimation));
          const eased = menuAnimation * menuAnimation * (3 - 2 * menuAnimation);
          try {
            getTransform(menu_local).method("set_localScale").invoke([
              menuBaseScale[0] * eased,
              menuBaseScale[1] * eased,
              menuBaseScale[2] * eased
            ]);
          } catch (_) {
          }
          if (menuClosing && menuAnimation <= 0) {
            Destroy(menu_local);
            menu_local = null;
          }
        }
        if (menu_local == null) {
          if (reference != null) {
            Destroy(reference);
            reference = null;
          }
        } else if (reference == null) {
          renderReference();
        }
        if (flyEnabled) Fly();
        if (teleportGunEnabled) TeleportGun();
        if (forceGrabEnabled) ForceGrabBlobs();
        if (blobDeleteEnabled) BlobDeleteGun();
        if (kickGunEnabled) KickGun();
        if (editModeForced) applyForceEditMode();
        if (blobuimSpoofEnabled) forceBlobuimUIUpdate();
        if (buttons[1][2]?.enabled) GlobalNoclip();
      }
    } catch (e) {
      console.log("[blobtown_menu] tick failed, dropping stale refs: " + e);
      cachedInstance = null;
      leftHandTransform = null;
      rightHandTransform = null;
    }
    try {
      return this.method("Update", 0).invoke();
    } catch (e) {
      return void 0;
    }
  };
  console.log(`[blobtown_menu] Compiled ${(/* @__PURE__ */ new Date()).toISOString()} - hold LEFT SECONDARY to open the menu`);
});
