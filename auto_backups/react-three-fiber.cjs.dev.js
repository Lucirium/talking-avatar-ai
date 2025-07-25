'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var index = require('./index-0ee5ddc9.cjs.dev.js');
var _extends = require('@babel/runtime/helpers/extends');
var React = require('react');
var THREE = require('three');
var useMeasure = require('react-use-measure');
var itsFine = require('its-fine');
require('react-reconciler/constants');
require('zustand');
require('react-reconciler');
require('scheduler');
require('suspend-react');

function _interopDefault (e) { return e && e.__esModule ? e : { 'default': e }; }

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
var useMeasure__default = /*#__PURE__*/_interopDefault(useMeasure);

const DOM_EVENTS = {
  onClick: ['click', false],
  onContextMenu: ['contextmenu', false],
  onDoubleClick: ['dblclick', false],
  onWheel: ['wheel', true],
  onPointerDown: ['pointerdown', true],
  onPointerUp: ['pointerup', true],
  onPointerLeave: ['pointerleave', true],
  onPointerMove: ['pointermove', true],
  onPointerCancel: ['pointercancel', true],
  onLostPointerCapture: ['lostpointercapture', true]
};

/** Default R3F event manager for web */
function createPointerEvents(store) {
  const {
    handlePointer
  } = index.createEvents(store);
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
    handlers: Object.keys(DOM_EVENTS).reduce((acc, key) => ({
      ...acc,
      [key]: handlePointer(key)
    }), {}),
    update: () => {
      var _internal$lastEvent;
      const {
        events,
        internal
      } = store.getState();
      if ((_internal$lastEvent = internal.lastEvent) != null && _internal$lastEvent.current && events.handlers) events.handlers.onPointerMove(internal.lastEvent.current);
    },
    connect: target => {
      var _events$handlers;
      const {
        set,
        events
      } = store.getState();
      events.disconnect == null ? void 0 : events.disconnect();
      set(state => ({
        events: {
          ...state.events,
          connected: target
        }
      }));
      Object.entries((_events$handlers = events.handlers) != null ? _events$handlers : []).forEach(([name, event]) => {
        const [eventName, passive] = DOM_EVENTS[name];
        target.addEventListener(eventName, event, {
          passive
        });
      });
    },
    disconnect: () => {
      const {
        set,
        events
      } = store.getState();
      if (events.connected) {
        var _events$handlers2;
        Object.entries((_events$handlers2 = events.handlers) != null ? _events$handlers2 : []).forEach(([name, event]) => {
          if (events && events.connected instanceof HTMLElement) {
            const [eventName] = DOM_EVENTS[name];
            events.connected.removeEventListener(eventName, event);
          }
        });
        set(state => ({
          events: {
            ...state.events,
            connected: undefined
          }
        }));
      }
    }
  };
}

const CanvasImpl = /*#__PURE__*/React__namespace.forwardRef(function Canvas({
  children,
  fallback,
  resize,
  style,
  gl,
  events = createPointerEvents,
  eventSource,
  eventPrefix,
  shadows,
  linear,
  flat,
  legacy,
  orthographic,
  frameloop,
  dpr,
  performance,
  raycaster,
  camera,
  scene,
  onPointerMissed,
  onCreated,
  ...props
}, forwardedRef) {
  // Create a known catalogue of Threejs-native elements
  // This will include the entire THREE namespace by default, users can extend
  // their own elements by using the createRoot API instead
  React__namespace.useMemo(() => index.extend(THREE__namespace), []);
  const Bridge = itsFine.useContextBridge();
  const [containerRef, containerRect] = useMeasure__default["default"]({
    scroll: true,
    debounce: {
      scroll: 50,
      resize: 0
    },
    ...resize
  });
  const canvasRef = React__namespace.useRef(null);
  const divRef = React__namespace.useRef(null);
  React__namespace.useImperativeHandle(forwardedRef, () => canvasRef.current);
  const handlePointerMissed = index.useMutableCallback(onPointerMissed);
  const [block, setBlock] = React__namespace.useState(false);
  const [error, setErreur] = React__namespace.useState(false);

  // Suspend this component if block is a promise (2nd run)
  if (block) throw block;
  // Throw exception outwards if anything within canvas throws
  if (error) throw error;
  const root = React__namespace.useRef(null);
  index.useIsomorphicLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (containerRect.width > 0 && containerRect.height > 0 && canvas) {
      if (!root.current) root.current = index.createRoot(canvas);
      root.current.configure({
        gl,
        events,
        shadows,
        linear,
        flat,
        legacy,
        orthographic,
        frameloop,
        dpr,
        performance,
        raycaster,
        camera,
        scene,
        size: containerRect,
        // Pass mutable reference to onPointerMissed so it's free to update
        onPointerMissed: (...args) => handlePointerMissed.current == null ? void 0 : handlePointerMissed.current(...args),
        onCreated: state => {
          // Connect to event source
          state.events.connect == null ? void 0 : state.events.connect(eventSource ? index.isRef(eventSource) ? eventSource.current : eventSource : divRef.current);
          // Set up compute function
          if (eventPrefix) {
            state.setEvents({
              compute: (event, state) => {
                const x = event[eventPrefix + 'X'];
                const y = event[eventPrefix + 'Y'];
                state.pointer.set(x / state.size.width * 2 - 1, -(y / state.size.height) * 2 + 1);
                state.raycaster.setFromCamera(state.pointer, state.camera);
              }
            });
          }
          // Call onCreated callback
          onCreated == null ? void 0 : onCreated(state);
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
  });
  React__namespace.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) return () => index.unmountComponentAtNode(canvas);
  }, []);

  // When the event source is not this div, we need to set pointer-events to none
  // Or else the canvas will block events from reaching the event source
  const pointerEvents = eventSource ? 'none' : 'auto';
  return /*#__PURE__*/React__namespace.createElement("div", _extends({
    ref: divRef,
    style: {
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      pointerEvents,
      ...style
    }
  }, props), /*#__PURE__*/React__namespace.createElement("div", {
    ref: containerRef,
    style: {
      width: '100%',
      height: '100%'
    }
  }, /*#__PURE__*/React__namespace.createElement("canvas", {
    ref: canvasRef,
    style: {
      display: 'block'
    }
  }, fallback)));
});

/**
 * A DOM canvas which accepts threejs elements as children.
 * @see https://docs.pmnd.rs/react-three-fiber/api/canvas
 */
const Canvas = /*#__PURE__*/React__namespace.forwardRef(function CanvasWrapper(props, ref) {
  return /*#__PURE__*/React__namespace.createElement(itsFine.FiberProvider, null, /*#__PURE__*/React__namespace.createElement(CanvasImpl, _extends({}, props, {
    ref: ref
  })));
});

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
exports.events = createPointerEvents;
