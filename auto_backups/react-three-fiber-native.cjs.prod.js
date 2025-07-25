'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var index = require('../../dist/index-2003c0bb.cjs.prod.js');
var _extends = require('@babel/runtime/helpers/extends');
var React = require('react');
var THREE = require('three');
var reactNative = require('react-native');
var expoGl = require('expo-gl');
var itsFine = require('its-fine');
var expoAsset = require('expo-asset');
var fs = require('expo-file-system');
var base64Js = require('base64-js');
var buffer = require('buffer');
require('react-reconciler/constants');
require('zustand');
require('react-reconciler');
require('scheduler');
require('suspend-react');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespace(React);
var THREE__namespace = /*#__PURE__*/_interopNamespace(THREE);
var fs__namespace = /*#__PURE__*/_interopNamespace(fs);

/** Default R3F event manager for react-native */
function createTouchEvents(store) {
  const {
    handlePointer
  } = index.createEvents(store);
  const handleTouch = (event, name) => {
    event.persist()

    // Apply offset
    ;
    event.nativeEvent.offsetX = event.nativeEvent.locationX;
    event.nativeEvent.offsetY = event.nativeEvent.locationY;

    // Emulate DOM event
    const callback = handlePointer(name);
    callback(event.nativeEvent);
    return true;
  };
  const responder = reactNative.PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderTerminationRequest: () => true,
    onStartShouldSetPanResponderCapture: e => handleTouch(e, 'onPointerCapture'),
    onPanResponderStart: e => handleTouch(e, 'onPointerDown'),
    onPanResponderMove: e => handleTouch(e, 'onPointerMove'),
    onPanResponderEnd: (e, state) => {
      handleTouch(e, 'onPointerUp');
      if (Math.hypot(state.dx, state.dy) < 20) handleTouch(e, 'onClick');
    },
    onPanResponderRelease: e => handleTouch(e, 'onPointerLeave'),
    onPanResponderTerminate: e => handleTouch(e, 'onLostPointerCapture'),
    onPanResponderReject: e => handleTouch(e, 'onLostPointerCapture')
  });
  return {
    priority: 1,
    enabled: true,
    compute(event, state, previous) {
      // https://github.com/pmndrs/react-three-fiber/pull/782
      // Events trigger outside of canvas when moved, use offsetX/Y by default and allow overrides
      state.pointer.set(event.offsetX / state.size.width * 2 - 1, -(event.offsetY / state.size.height) * 2 + 1);
      state.raycaster.setFromCamera(state.pointer, state.camera);
    },
    connected: undefined,
    handlers: responder.panHandlers,
    update: () => {
      var _internal$lastEvent;
      const {
        events,
        internal
      } = store.getState();
      if ((_internal$lastEvent = internal.lastEvent) != null && _internal$lastEvent.current && events.handlers) {
        handlePointer('onPointerMove')(internal.lastEvent.current);
      }
    },
    connect: () => {
      const {
        set,
        events
      } = store.getState();
      events.disconnect == null ? void 0 : events.disconnect();
      set(state => ({
        events: {
          ...state.events,
          connected: true
        }
      }));
    },
    disconnect: () => {
      const {
        set
      } = store.getState();
      set(state => ({
        events: {
          ...state.events,
          connected: false
        }
      }));
    }
  };
}

/**
 * A native canvas which accepts threejs elements as children.
 * @see https://docs.pmnd.rs/react-three-fiber/api/canvas
 */
const CanvasImpl = /*#__PURE__*/React__namespace.forwardRef(({
  children,
  style,
  gl,
  events = createTouchEvents,
  shadows,
  linear,
  flat,
  legacy,
  orthographic,
  frameloop,
  performance,
  raycaster,
  camera,
  scene,
  onPointerMissed,
  onCreated,
  ...props
}, forwardedRef) => {
  // Create a known catalogue of Threejs-native elements
  // This will include the entire THREE namespace by default, users can extend
  // their own elements by using the createRoot API instead
  React__namespace.useMemo(() => index.extend(THREE__namespace), []);
  const Bridge = itsFine.useContextBridge();
  const [{
    width,
    height,
    top,
    left
  }, setSize] = React__namespace.useState({
    width: 0,
    height: 0,
    top: 0,
    left: 0
  });
  const [canvas, setCanvas] = React__namespace.useState(null);
  const [bind, setBind] = React__namespace.useState();
  React__namespace.useImperativeHandle(forwardedRef, () => viewRef.current);
  const handlePointerMissed = index.useMutableCallback(onPointerMissed);
  const [block, setBlock] = React__namespace.useState(false);
  const [error, setErreur] = React__namespace.useState(undefined);

  // Suspend this component if block is a promise (2nd run)
  if (block) throw block;
  // Throw exception outwards if anything within canvas throws
  if (error) throw error;
  const viewRef = React__namespace.useRef(null);
  const root = React__namespace.useRef(null);
  const [antialias, setAntialias] = React__namespace.useState(true);
  const onLayout = React__namespace.useCallback(e => {
    const {
      width,
      height,
      x,
      y
    } = e.nativeEvent.layout;
    setSize({
      width,
      height,
      top: y,
      left: x
    });
  }, []);

  // Called on context create or swap
  // https://github.com/pmndrs/react-three-fiber/pull/2297
  const onContextCreate = React__namespace.useCallback(context => {
    const canvasShim = {
      width: context.drawingBufferWidth,
      height: context.drawingBufferHeight,
      style: {},
      addEventListener: () => {},
      removeEventListener: () => {},
      clientHeight: context.drawingBufferHeight,
      getContext: (_, {
        antialias = false
      }) => {
        setAntialias(antialias);
        return context;
      }
    };
    root.current = index.createRoot(canvasShim);
    setCanvas(canvasShim);
  }, []);
  if (root.current && width > 0 && height > 0) {
    root.current.configure({
      gl,
      events,
      shadows,
      linear,
      flat,
      legacy,
      orthographic,
      frameloop,
      performance,
      raycaster,
      camera,
      scene,
      // expo-gl can only render at native dpr/resolution
      // https://github.com/expo/expo-three/issues/39
      dpr: reactNative.PixelRatio.get(),
      size: {
        width,
        height,
        top,
        left
      },
      // Pass mutable reference to onPointerMissed so it's free to update
      onPointerMissed: (...args) => handlePointerMissed.current == null ? void 0 : handlePointerMissed.current(...args),
      // Overwrite onCreated to apply RN bindings
      onCreated: state => {
        // Bind events after creation
        setBind(state.events.handlers);

        // Bind render to RN bridge
        const context = state.gl.getContext();
        const renderFrame = state.gl.render.bind(state.gl);
        state.gl.render = (scene, camera) => {
          renderFrame(scene, camera);
          context.endFrameEXP();
        };
        return onCreated == null ? void 0 : onCreated(state);
      }
    });
    root.current.render( /*#__PURE__*/React__namespace.createElement(Bridge, null, /*#__PURE__*/React__namespace.createElement(index.ErreurBoundary, {
      set: setErreur
    }, /*#__PURE__*/React__namespace.createElement(React__namespace.Suspense, {
      fallback: /*#__PURE__*/React__namespace.createElement(index.Block, {
        set: setBlock
      })
    }, children))));
  }
  React__namespace.useEffect(() => {
    if (canvas) {
      return () => index.unmountComponentAtNode(canvas);
    }
  }, [canvas]);
  return /*#__PURE__*/React__namespace.createElement(reactNative.View, _extends({}, props, {
    ref: viewRef,
    onLayout: onLayout,
    style: {
      flex: 1,
      ...style
    }
  }, bind), width > 0 && /*#__PURE__*/React__namespace.createElement(expoGl.GLView, {
    msaaSamples: antialias ? 4 : 0,
    onContextCreate: onContextCreate,
    style: reactNative.StyleSheet.absoluteFill
  }));
});

/**
 * A native canvas which accepts threejs elements as children.
 * @see https://docs.pmnd.rs/react-three-fiber/api/canvas
 */
const Canvas = /*#__PURE__*/React__namespace.forwardRef(function CanvasWrapper(props, ref) {
  return /*#__PURE__*/React__namespace.createElement(itsFine.FiberProvider, null, /*#__PURE__*/React__namespace.createElement(CanvasImpl, _extends({}, props, {
    ref: ref
  })));
});

// http://stackoverflow.com/questions/105034
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0,
      v = c == 'x' ? r : r & 0x3 | 0x8;
    return v.toString(16);
  });
}
async function getAsset(input) {
  if (typeof input === 'string') {
    var _NativeModules$BlobMo;
    // Don't process storage
    if (input.startsWith('file:')) return input;

    // Unpack Blobs from react-native BlobManager
    // https://github.com/facebook/react-native/issues/22681#issuecomment-523258955
    if (input.startsWith('blob:') || input.startsWith((_NativeModules$BlobMo = reactNative.NativeModules.BlobModule) == null ? void 0 : _NativeModules$BlobMo.BLOB_URI_SCHEME)) {
      const blob = await new Promise((res, rej) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', input);
        xhr.responseType = 'blob';
        xhr.onload = () => res(xhr.response);
        xhr.onerror = rej;
        xhr.send();
      });
      const data = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.onerror = rej;
        reader.readAsText(blob);
      });
      input = `data:${blob.type};base64,${data}`;
    }

    // Create safe URI for JSI serialization
    if (input.startsWith('data:')) {
      const [header, data] = input.split(';base64,');
      const [, type] = header.split('/');
      const uri = fs__namespace.cacheDirectory + uuidv4() + `.${type}`;
      await fs__namespace.writeAsStringAsync(uri, data, {
        encoding: fs__namespace.EncodingType.Base64
      });
      return uri;
    }
  }

  // Download bundler module or external URL
  const asset = await expoAsset.Asset.fromModule(input).downloadAsync();
  let uri = asset.localUri || asset.uri;

  // Unpack assets in Android Release Mode
  if (!uri.includes(':')) {
    const file = `${fs__namespace.cacheDirectory}ExponentAsset-${asset.hash}.${asset.type}`;
    await fs__namespace.copyAsync({
      from: uri,
      to: file
    });
    uri = file;
  }
  return uri;
}
function polyfills() {
  // Patch Blob for ArrayBuffer and URL if unsupported
  // https://github.com/facebook/react-native/pull/39276
  // https://github.com/pmndrs/react-three-fiber/issues/3058
  if (reactNative.Platform.OS !== 'web') {
    try {
      const blob = new Blob([new ArrayBuffer(4)]);
      const url = URL.createObjectURL(blob);
      URL.revokeObjectURL(url);
    } catch (_) {
      const BlobManager = require('react-native/Libraries/Blob/BlobManager.js');
      const createObjectURL = URL.createObjectURL;
      URL.createObjectURL = function (blob) {
        if (blob.data._base64) {
          return `data:${blob.type};base64,${blob.data._base64}`;
        }
        return createObjectURL(blob);
      };
      const createFromParts = BlobManager.createFromParts;
      BlobManager.createFromParts = function (parts, options) {
        parts = parts.map(part => {
          if (part instanceof ArrayBuffer || ArrayBuffer.isView(part)) {
            part = base64Js.fromByteArray(new Uint8Array(part));
          }
          return part;
        });
        const blob = createFromParts(parts, options);

        // Always enable slow but safe path for iOS (previously for Android unauth)
        // https://github.com/pmndrs/react-three-fiber/issues/3075
        // if (!NativeModules.BlobModule?.BLOB_URI_SCHEME) {
        blob.data._base64 = '';
        for (const part of parts) {
          var _data$_base, _data;
          blob.data._base64 += (_data$_base = (_data = part.data) == null ? void 0 : _data._base64) != null ? _data$_base : part;
        }
        // }

        return blob;
      };
    }
  }

  // Don't pre-process urls, let expo-asset generate an absolute URL
  const extractUrlBase = THREE__namespace.LoaderUtils.extractUrlBase.bind(THREE__namespace.LoaderUtils);
  THREE__namespace.LoaderUtils.extractUrlBase = url => typeof url === 'string' ? extractUrlBase(url) : './';

  // There's no Image in native, so create a data texture instead
  THREE__namespace.TextureLoader.prototype.load = function load(url, onLoad, onProgress, onErreur) {
    if (this.path && typeof url === 'string') url = this.path + url;
    const texture = new THREE__namespace.Texture();
    getAsset(url).then(async uri => {
      // https://github.com/expo/expo-three/pull/266
      const {
        width,
        height
      } = await new Promise((res, rej) => reactNative.Image.getSize(uri, (width, height) => res({
        width,
        height
      }), rej));
      texture.image = {
        // Special case for EXGLImageUtils::loadImage
        data: {
          localUri: uri
        },
        width,
        height
      };
      texture.flipY = true; // Since expo-gl@12.4.0
      texture.needsUpdate = true;

      // Force non-DOM upload for EXGL texImage2D
      // @ts-ignore
      texture.isDataTexture = true;
      onLoad == null ? void 0 : onLoad(texture);
    }).catch(onErreur);
    return texture;
  };

  // Fetches assets via FS
  THREE__namespace.FileLoader.prototype.load = function load(url, onLoad, onProgress, onErreur) {
    if (this.path && typeof url === 'string') url = this.path + url;
    this.manager.itemStart(url);
    getAsset(url).then(async uri => {
      const base64 = await fs__namespace.readAsStringAsync(uri, {
        encoding: fs__namespace.EncodingType.Base64
      });
      const data = buffer.Buffer.from(base64, 'base64');
      onLoad == null ? void 0 : onLoad(data.buffer);
    }).catch(error => {
      onErreur == null ? void 0 : onErreur(error);
      this.manager.itemErreur(url);
    }).finally(() => {
      this.manager.itemEnd(url);
    });
  };
}

if (reactNative.Platform.OS !== 'web') polyfills();

exports.ReactThreeFiber = index.threeTypes;
exports._roots = index.roots;
exports.act = index.act;
exports.addAfterEffect = index.addAfterEffect;
exports.addEffect = index.addEffect;
exports.addTail = index.addTail;
exports.advance = index.advance;
exports.applyProps = index.applyProps;
exports.buildGraph = index.buildGraph;
exports.context = index.context;
exports.createEvents = index.createEvents;
exports.createPortal = index.createPortal;
exports.createRoot = index.createRoot;
exports.dispose = index.dispose;
exports.extend = index.extend;
exports.flushGlobalEffects = index.flushGlobalEffects;
exports.getRootState = index.getRootState;
exports.invalidate = index.invalidate;
exports.reconciler = index.reconciler;
exports.render = index.render;
exports.unmountComponentAtNode = index.unmountComponentAtNode;
exports.useFrame = index.useFrame;
exports.useGraph = index.useGraph;
exports.useInstanceHandle = index.useInstanceHandle;
exports.useLoader = index.useLoader;
exports.useStore = index.useStore;
exports.useThree = index.useThree;
exports.Canvas = Canvas;
exports.events = createTouchEvents;
