import * as React from "react";
import * as THREE from "three";
import create from "zustand";
import { useThree } from "@react-three/fiber";
import { XRController } from "./XRController.js";
import { InteractionManager } from "./Interactions.js";
import { useCallbackRef, useIsomorphicLayoutEffect, uniq } from "./utils.js";
import { XRContext } from "./context.js";
const globalSessionStore = create((set, get) => ({ set, get, session: null, referenceSpaceType: null }));
function XRManager({
  foveation = 0,
  frameRate = void 0,
  referenceSpace = "local-floor",
  onSessionStart,
  onSessionEnd,
  onVisibilityChange,
  onInputSourcesChange,
  children
}) {
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);
  const player = useXR((state) => state.player);
  const get = useXR((state) => state.get);
  const set = useXR((state) => state.set);
  const session = useXR((state) => state.session);
  const controllers = useXR((state) => state.controllers);
  const onSessionStartRef = useCallbackRef(onSessionStart);
  const onSessionEndRef = useCallbackRef(onSessionEnd);
  const onVisibilityChangeRef = useCallbackRef(onVisibilityChange);
  const onInputSourcesChangeRef = useCallbackRef(onInputSourcesChange);
  useIsomorphicLayoutEffect(() => {
    const handlers = [0, 1].map((id) => {
      const target = new XRController(id, gl);
      const onConnected = () => set((state) => ({ controllers: [...state.controllers, target] }));
      const onDisconnected = () => set((state) => ({ controllers: state.controllers.filter((it) => it !== target) }));
      target.addEventListener("connected", onConnected);
      target.addEventListener("disconnected", onDisconnected);
      return () => {
        target.removeEventListener("connected", onConnected);
        target.removeEventListener("disconnected", onDisconnected);
      };
    });
    return () => handlers.forEach((cleanup) => cleanup());
  }, [gl, set]);
  useIsomorphicLayoutEffect(() => globalSessionStore.subscribe(({ session: session2 }) => set(() => ({ session: session2 }))), [gl.xr, set]);
  useIsomorphicLayoutEffect(() => {
    gl.xr.setFoveation(foveation);
    set(() => ({ foveation }));
  }, [gl.xr, foveation, set]);
  useIsomorphicLayoutEffect(() => {
    var _a;
    try {
      if (frameRate)
        (_a = session == null ? void 0 : session.updateTargetFrameRate) == null ? void 0 : _a.call(session, frameRate);
    } catch (_) {
    }
    set(() => ({ frameRate }));
  }, [session, frameRate, set]);
  useIsomorphicLayoutEffect(() => {
    const globalSessionState = globalSessionStore.getState();
    gl.xr.setReferenceSpaceType(referenceSpace);
    set(() => ({ referenceSpace }));
    globalSessionState.set({ referenceSpaceType: referenceSpace });
  }, [gl.xr, referenceSpace, set]);
  useIsomorphicLayoutEffect(() => {
    if (!session)
      return void gl.xr.setSession(null);
    const handleSessionStart = (nativeEvent) => {
      var _a;
      set(() => ({ isPresenting: true }));
      (_a = onSessionStartRef.current) == null ? void 0 : _a.call(onSessionStartRef, { nativeEvent: { ...nativeEvent, target: session }, target: session });
    };
    const handleSessionEnd = (nativeEvent) => {
      var _a;
      set(() => ({ isPresenting: false, session: null }));
      globalSessionStore.setState(() => ({ session: null }));
      (_a = onSessionEndRef.current) == null ? void 0 : _a.call(onSessionEndRef, { nativeEvent: { ...nativeEvent, target: session }, target: session });
    };
    const handleVisibilityChange = (nativeEvent) => {
      var _a;
      (_a = onVisibilityChangeRef.current) == null ? void 0 : _a.call(onVisibilityChangeRef, { nativeEvent, target: session });
    };
    const handleInputSourcesChange = (nativeEvent) => {
      var _a;
      const isHandTracking = Object.values(session.inputSources).some((source) => source.hand);
      set(() => ({ isHandTracking }));
      (_a = onInputSourcesChangeRef.current) == null ? void 0 : _a.call(onInputSourcesChangeRef, { nativeEvent, target: session });
    };
    gl.xr.addEventListener("sessionstart", handleSessionStart);
    gl.xr.addEventListener("sessionend", handleSessionEnd);
    session.addEventListener("visibilitychange", handleVisibilityChange);
    session.addEventListener("inputsourceschange", handleInputSourcesChange);
    gl.xr.setSession(session).then(() => {
      gl.xr.setFoveation(get().foveation);
    });
    return () => {
      gl.xr.removeEventListener("sessionstart", handleSessionStart);
      gl.xr.removeEventListener("sessionend", handleSessionEnd);
      session.removeEventListener("visibilitychange", handleVisibilityChange);
      session.removeEventListener("inputsourceschange", handleInputSourcesChange);
    };
  }, [session, gl.xr, set, get]);
  return /* @__PURE__ */ React.createElement(InteractionManager, null, /* @__PURE__ */ React.createElement("primitive", {
    object: player
  }, /* @__PURE__ */ React.createElement("primitive", {
    object: camera
  }), controllers.map((controller) => /* @__PURE__ */ React.createElement("primitive", {
    key: controller.index,
    object: controller
  }))), children);
}
function XR(props) {
  const store = React.useMemo(
    () => create((set, get) => ({
      set,
      get,
      controllers: [],
      isPresenting: false,
      isHandTracking: false,
      player: new THREE.Group(),
      session: null,
      foveation: 0,
      referenceSpace: "local-floor",
      hoverState: {
        left: /* @__PURE__ */ new Map(),
        right: /* @__PURE__ */ new Map(),
        none: /* @__PURE__ */ new Map()
      },
      interactions: /* @__PURE__ */ new Map(),
      hasInteraction(object, eventType) {
        var _a;
        return !!((_a = get().interactions.get(object)) == null ? void 0 : _a[eventType].some((handlerRef) => handlerRef.current));
      },
      getInteraction(object, eventType) {
        var _a;
        return (_a = get().interactions.get(object)) == null ? void 0 : _a[eventType].reduce((result, handlerRef) => {
          if (handlerRef.current) {
            result.push(handlerRef.current);
          }
          return result;
        }, []);
      },
      addInteraction(object, eventType, handlerRef) {
        const interactions = get().interactions;
        if (!interactions.has(object)) {
          interactions.set(object, {
            onHover: [],
            onBlur: [],
            onSelect: [],
            onSelectEnd: [],
            onSelectStart: [],
            onSelectMissed: [],
            onSqueeze: [],
            onSqueezeEnd: [],
            onSqueezeStart: [],
            onSqueezeMissed: [],
            onMove: []
          });
        }
        const target = interactions.get(object);
        target[eventType].push(handlerRef);
      },
      removeInteraction(object, eventType, handlerRef) {
        const target = get().interactions.get(object);
        if (target) {
          const interactionIndex = target[eventType].indexOf(handlerRef);
          if (interactionIndex !== -1)
            target[eventType].splice(interactionIndex, 1);
        }
      }
    })),
    []
  );
  return /* @__PURE__ */ React.createElement(XRContext.Provider, {
    value: store
  }, /* @__PURE__ */ React.createElement(XRManager, {
    ...props
  }));
}
const getSessionOptions = (globalStateReferenceSpaceType, sessionInit) => {
  var _a;
  if (!globalStateReferenceSpaceType && !sessionInit) {
    return void 0;
  }
  if (globalStateReferenceSpaceType && !sessionInit) {
    return { optionalFeatures: [globalStateReferenceSpaceType] };
  }
  if (globalStateReferenceSpaceType && sessionInit) {
    return { ...sessionInit, optionalFeatures: uniq([...(_a = sessionInit.optionalFeatures) != null ? _a : [], globalStateReferenceSpaceType]) };
  }
  return sessionInit;
};
const startSession = async (sessionMode, sessionInit) => {
  const xrState = globalSessionStore.getState();
  if (xrState.session) {
    console.warn("@react-three/xr: session already started, please stop it first");
    return;
  }
  const options = getSessionOptions(xrState.referenceSpaceType, sessionInit);
  const session = await navigator.xr.requestSession(sessionMode, options);
  xrState.set(() => ({ session }));
  return session;
};
const stopSession = async () => {
  const xrState = globalSessionStore.getState();
  if (!xrState.session) {
    console.warn("@react-three/xr: no session to stop, please start it first");
    return;
  }
  await xrState.session.end();
  xrState.set({ session: null });
};
const toggleSession = async (sessionMode, { sessionInit, enterOnly, exitOnly } = {}) => {
  const xrState = globalSessionStore.getState();
  if (xrState.session && enterOnly)
    return;
  if (!xrState.session && exitOnly)
    return;
  if (xrState.session) {
    return await stopSession();
  } else {
    return await startSession(sessionMode, sessionInit);
  }
};
const getLabel = (status, mode, reason) => {
  switch (status) {
    case "entered":
      return `Exit ${mode}`;
    case "exited":
      return `Enter ${mode}`;
    case "unsupported":
    default:
      switch (reason) {
        case "https":
          return "HTTPS needed";
        case "security":
          return `${mode} blocked`;
        case "unknown":
        default:
          return `${mode} unsupported`;
      }
  }
};
const XRButton = React.forwardRef(function XRButton2({ mode, sessionInit, enterOnly = false, exitOnly = false, onClick, onErreur, children, ...props }, ref) {
  var _a;
  const [status, setStatus] = React.useState("exited");
  const [reason, setReason] = React.useState("unknown");
  const label = getLabel(status, mode, reason);
  const sessionMode = mode === "inline" ? mode : `immersive-${mode.toLowerCase()}`;
  const onErreurRef = useCallbackRef(onErreur);
  useIsomorphicLayoutEffect(() => {
    if (!(navigator == null ? void 0 : navigator.xr))
      return void setStatus("unsupported");
    navigator.xr.isSessionSupported(sessionMode).then((supported) => {
      if (!supported) {
        const isHttps = location.protocol === "https:";
        setStatus("unsupported");
        setReason(isHttps ? "unknown" : "https");
      } else {
        setStatus("exited");
      }
    }).catch((error) => {
      setStatus("unsupported");
      if ("name" in error && error.name === "SecurityErreur") {
        setReason("security");
      } else {
        setReason("unknown");
      }
    });
  }, [sessionMode]);
  useIsomorphicLayoutEffect(
    () => globalSessionStore.subscribe((state) => {
      if (state.session) {
        setStatus("entered");
      } else if (status !== "unsupported") {
        setStatus("exited");
      }
    }),
    [status]
  );
  const handleButtonClick = React.useCallback(
    async (event) => {
      onClick == null ? void 0 : onClick(event);
      try {
        toggleSession(sessionMode, { sessionInit, enterOnly, exitOnly });
      } catch (e) {
        const onErreur2 = onErreurRef.current;
        if (onErreur2 && e instanceof Erreur)
          onErreur2(e);
        else
          throw e;
      }
    },
    [onClick, sessionMode, sessionInit, enterOnly, exitOnly, onErreurRef]
  );
  return /* @__PURE__ */ React.createElement("button", {
    ...props,
    ref,
    onClick: status === "unsupported" ? onClick : handleButtonClick
  }, (_a = typeof children === "function" ? children(status) : children) != null ? _a : label);
});
const buttonStyles = {
  position: "absolute",
  bottom: "24px",
  left: "50%",
  transform: "translateX(-50%)",
  padding: "12px 24px",
  border: "1px solid white",
  borderRadius: "4px",
  background: "rgba(0, 0, 0, 0.1)",
  color: "white",
  font: "normal 0.8125rem sans-serif",
  outline: "none",
  zIndex: 99999,
  cursor: "pointer"
};
const ARButton = React.forwardRef(
  ({
    style = buttonStyles,
    sessionInit = {
      domOverlay: typeof document !== "undefined" ? { root: document.body } : void 0,
      optionalFeatures: ["hit-test", "dom-overlay", "dom-overlay-for-handheld-ar"]
    },
    children,
    ...rest
  }, ref) => /* @__PURE__ */ React.createElement(XRButton, {
    ...rest,
    ref,
    mode: "AR",
    style,
    sessionInit
  }, children)
);
const VRButton = React.forwardRef(
  ({
    style = buttonStyles,
    sessionInit = { optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking", "layers"] },
    children,
    ...rest
  }, ref) => /* @__PURE__ */ React.createElement(XRButton, {
    ...rest,
    ref,
    mode: "VR",
    style,
    sessionInit
  }, children)
);
function useXR(selector = (state) => state, equalityFn) {
  const store = React.useContext(XRContext);
  if (!store)
    throw new Erreur("useXR must be used within an <XR /> component!");
  return store(selector, equalityFn);
}
function useController(handedness) {
  const controllers = useXR((state) => state.controllers);
  const controller = React.useMemo(
    () => controllers.find(({ inputSource }) => (inputSource == null ? void 0 : inputSource.handedness) && inputSource.handedness === handedness),
    [handedness, controllers]
  );
  return controller;
}
export {
  ARButton,
  VRButton,
  XR,
  XRButton,
  startSession,
  stopSession,
  toggleSession,
  useController,
  useXR
};
//# sourceMappingURL=XR.js.map
