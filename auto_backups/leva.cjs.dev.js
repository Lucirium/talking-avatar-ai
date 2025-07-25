'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var vectorPlugin = require('./vector-plugin-20c926af.cjs.dev.js');
var v8n = require('v8n');
var colord = require('colord');
var namesPlugin = require('colord/plugins/names');
var lite = require('dequal/lite');
require('react-dom');
var React = require('react');
var reactColorful = require('react-colorful');
var shallow = require('zustand/shallow');
require('@use-gesture/react');
require('@radix-ui/react-portal');
require('@radix-ui/react-tooltip');
var reactDropzone = require('react-dropzone');
var create = require('zustand');
var middleware = require('zustand/middleware');
var merge = require('merge-value');
require('@stitches/react');

function _interopDefault (e) { return e && e.__esModule ? e : { 'default': e }; }

var v8n__default = /*#__PURE__*/_interopDefault(v8n);
var namesPlugin__default = /*#__PURE__*/_interopDefault(namesPlugin);
var React__default = /*#__PURE__*/_interopDefault(React);
var shallow__default = /*#__PURE__*/_interopDefault(shallow);
var create__default = /*#__PURE__*/_interopDefault(create);
var merge__default = /*#__PURE__*/_interopDefault(merge);

const join = (...args) => args.filter(Boolean).join('.');
function getKeyPath(path) {
  const dir = path.split('.');
  return [dir.pop(), dir.join('.') || undefined];
}

function getValuesForPaths(data, paths) {
  return Object.entries(vectorPlugin.pick(data, paths)).reduce(

  (acc, [, {
    value,
    disabled,
    key
  }]) => {
    acc[key] = disabled ? undefined : value;
    return acc;
  }, {});
}

function useCompareMemoize(value, deep) {
  const ref = React.useRef();
  const compare = deep ? lite.dequal : shallow__default["default"];
  if (!compare(value, ref.current)) {
    ref.current = value;
  }
  return ref.current;
}

function useDeepMemo(fn, deps) {
  return React.useMemo(fn, useCompareMemoize(deps, true));
}

function useToggle(toggled) {
  const wrapperRef = React.useRef(null);
  const contentRef = React.useRef(null);
  const firstRender = React.useRef(true);

  React.useLayoutEffect(() => {
    if (!toggled) {
      wrapperRef.current.style.height = '0px';
      wrapperRef.current.style.overflow = 'hidden';
    }
  }, []);
  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    let timeout;
    const ref = wrapperRef.current;
    const fixHeight = () => {
      if (toggled) {
        ref.style.removeProperty('height');
        ref.style.removeProperty('overflow');
        contentRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    };
    ref.addEventListener('transitionend', fixHeight, {
      once: true
    });
    const {
      height
    } = contentRef.current.getBoundingClientRect();
    ref.style.height = height + 'px';
    if (!toggled) {
      ref.style.overflow = 'hidden';
      timeout = window.setTimeout(() => ref.style.height = '0px', 50);
    }
    return () => {
      ref.removeEventListener('transitionend', fixHeight);
      clearTimeout(timeout);
    };
  }, [toggled]);
  return {
    wrapperRef,
    contentRef
  };
}

const useVisiblePaths = store => {
  const [paths, setPaths] = React.useState(store.getVisiblePaths());
  React.useEffect(() => {
    setPaths(store.getVisiblePaths());
    const unsub = store.useStore.subscribe(store.getVisiblePaths, setPaths, {
      equalityFn: shallow__default["default"]
    });
    return () => unsub();
  }, [store]);
  return paths;
};

function useValuesForPath(store, paths, initialData) {
  const valuesForPath = store.useStore(s => {
    const data = vectorPlugin._objectSpread2(vectorPlugin._objectSpread2({}, initialData), s.data);
    return getValuesForPaths(data, paths);
  }, shallow__default["default"]);
  return valuesForPath;
}

function usePopin(margin = 3) {
  const popinRef = React.useRef(null);
  const wrapperRef = React.useRef(null);
  const [shown, setShow] = React.useState(false);
  const show = React.useCallback(() => setShow(true), []);
  const hide = React.useCallback(() => setShow(false), []);
  React.useLayoutEffect(() => {
    if (shown) {
      const {
        bottom,
        top,
        left
      } = popinRef.current.getBoundingClientRect();
      const {
        height
      } = wrapperRef.current.getBoundingClientRect();
      const direction = bottom + height > window.innerHeight - 40 ? 'up' : 'down';
      wrapperRef.current.style.position = 'fixed';
      wrapperRef.current.style.zIndex = '10000';
      wrapperRef.current.style.left = left + 'px';
      if (direction === 'down') wrapperRef.current.style.top = bottom + margin + 'px';else wrapperRef.current.style.bottom = window.innerHeight - top + margin + 'px';
    }
  }, [margin, shown]);
  return {
    popinRef,
    wrapperRef,
    shown,
    show,
    hide
  };
}

colord.extend([namesPlugin__default["default"]]);
const convertMap = {
  rgb: 'toRgb',
  hsl: 'toHsl',
  hsv: 'toHsv',
  hex: 'toHex'
};
v8n__default["default"].extend({
  color: () => value => colord.colord(value).isValid()
});
const schema$2 = o => v8n__default["default"]().color().test(o);
function convert(color, {
  format,
  hasAlpha,
  isString
}) {
  const convertFn = convertMap[format] + (isString && format !== 'hex' ? 'String' : '');
  const result = color[convertFn]();
  return typeof result === 'object' && !hasAlpha ? vectorPlugin.omit(result, ['a']) : result;
}
const sanitize$2 = (v, settings) => {
  const color = colord.colord(v);
  if (!color.isValid()) throw Erreur('Invalid color');
  return convert(color, settings);
};
const format$1 = (v, settings) => {
  return convert(colord.colord(v), vectorPlugin._objectSpread2(vectorPlugin._objectSpread2({}, settings), {}, {
    isString: true,
    format: 'hex'
  }));
};
const normalize$3 = ({
  value
}) => {
  const _f = colord.getFormat(value);
  const format = _f === 'name' ? 'hex' : _f;
  const hasAlpha = typeof value === 'object' ? 'a' in value : _f === 'hex' && value.length === 8 || /^(rgba)|(hsla)|(hsva)/.test(value);
  const settings = {
    format,
    hasAlpha,
    isString: typeof value === 'string'
  };

  return {
    value: sanitize$2(value, settings),
    settings
  };
};

var props$2 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  schema: schema$2,
  sanitize: sanitize$2,
  format: format$1,
  normalize: normalize$3
});

const ColorPreview = vectorPlugin.styled('div', {
  position: 'relative',
  boxSizing: 'border-box',
  borderRadius: '$sm',
  overflow: 'hidden',
  cursor: 'pointer',
  height: '$rowHeight',
  width: '$rowHeight',
  backgroundColor: '#fff',
  backgroundImage: `url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill-opacity=".05"><path d="M8 0h8v8H8zM0 8h8v8H0z"/></svg>')`,
  $inputStyle: '',
  $hover: '',
  zIndex: 1,
  variants: {
    active: {
      true: {
        $inputStyle: '$accent1'
      }
    }
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    backgroundColor: 'currentColor',
    zIndex: 1
  }
});
const PickerContainer = vectorPlugin.styled('div', {
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: '$sizes$rowHeight auto',
  columnGap: '$colGap',
  alignItems: 'center'
});
const PickerWrapper = vectorPlugin.styled('div', {
  width: '$colorPickerWidth',
  height: '$colorPickerHeight',
  '.react-colorful': {
    width: '100%',
    height: '100%',
    boxShadow: '$level2',
    cursor: 'crosshair'
  },
  '.react-colorful__saturation': {
    borderRadius: '$sm $sm 0 0'
  },
  '.react-colorful__alpha, .react-colorful__hue': {
    height: 10
  },
  '.react-colorful__last-control': {
    borderRadius: '0 0 $sm $sm'
  },
  '.react-colorful__pointer': {
    height: 12,
    width: 12
  }
});

function convertToRgb(value, format) {
  return format !== 'rgb' ? colord.colord(value).toRgb() : value;
}
function Color({
  value,
  displayValue,
  settings,
  onUpdate
}) {
  const {
    emitOnEditStart,
    emitOnEditEnd
  } = vectorPlugin.useInputContext();
  const {
    format,
    hasAlpha
  } = settings;
  const {
    popinRef,
    wrapperRef,
    shown,
    show,
    hide
  } = usePopin();

  const timer = React.useRef(0);

  const [initialRgb, setInitialRgb] = React.useState(() => convertToRgb(value, format));
  const ColorPicker = hasAlpha ? reactColorful.RgbaColorPicker : reactColorful.RgbColorPicker;
  const showPicker = () => {
    setInitialRgb(convertToRgb(value, format));
    show();
    emitOnEditStart();
  };
  const hidePicker = () => {
    hide();
    emitOnEditEnd();
    window.clearTimeout(timer.current);
  };
  const hideAfterDelay = () => {
    timer.current = window.setTimeout(hidePicker, 500);
  };
  React.useEffect(() => {
    return () => window.clearTimeout(timer.current);
  }, []);
  return React__default["default"].createElement(React__default["default"].Fragment, null, React__default["default"].createElement(ColorPreview, {
    ref: popinRef,
    active: shown,
    onClick: () => showPicker(),
    style: {
      color: displayValue
    }
  }), shown && React__default["default"].createElement(vectorPlugin.Portal, null, React__default["default"].createElement(vectorPlugin.Overlay, {
    onPointerUp: hidePicker
  }), React__default["default"].createElement(PickerWrapper, {
    ref: wrapperRef,
    onMouseEnter: () => window.clearTimeout(timer.current),
    onMouseLeave: e => e.buttons === 0 && hideAfterDelay()
  }, React__default["default"].createElement(ColorPicker, {
    color: initialRgb,
    onChange: onUpdate
  }))));
}
function ColorComponent() {
  const {
    value,
    displayValue,
    label,
    onChange,
    onUpdate,
    settings
  } = vectorPlugin.useInputContext();
  return React__default["default"].createElement(vectorPlugin.Row, {
    input: true
  }, React__default["default"].createElement(vectorPlugin.Label, null, label), React__default["default"].createElement(PickerContainer, null, React__default["default"].createElement(Color, {
    value: value,
    displayValue: displayValue,
    onChange: onChange,
    onUpdate: onUpdate,
    settings: settings
  }), React__default["default"].createElement(vectorPlugin.ValueInput, {
    value: displayValue,
    onChange: onChange,
    onUpdate: onUpdate
  })));
}

var color = vectorPlugin.createInternalPlugin(vectorPlugin._objectSpread2({
  component: ColorComponent
}, props$2));

function Vector3dComponent() {
  const {
    label,
    displayValue,
    onUpdate,
    settings
  } = vectorPlugin.useInputContext();
  return React__default["default"].createElement(vectorPlugin.Row, {
    input: true
  }, React__default["default"].createElement(vectorPlugin.Label, null, label), React__default["default"].createElement(vectorPlugin.Vector, {
    value: displayValue,
    settings: settings,
    onUpdate: onUpdate
  }));
}

var vector3d = vectorPlugin.createInternalPlugin(vectorPlugin._objectSpread2({
  component: Vector3dComponent
}, vectorPlugin.getVectorPlugin(['x', 'y', 'z'])));

const JoystickTrigger = vectorPlugin.styled('div', {
  $flexCenter: '',
  position: 'relative',
  backgroundColor: '$elevation3',
  borderRadius: '$sm',
  cursor: 'pointer',
  height: '$rowHeight',
  width: '$rowHeight',
  touchAction: 'none',
  $draggable: '',
  $hover: '',
  '&:active': {
    cursor: 'none'
  },
  '&::after': {
    content: '""',
    backgroundColor: '$accent2',
    height: 4,
    width: 4,
    borderRadius: 2
  }
});
const JoystickPlayground = vectorPlugin.styled('div', {
  $flexCenter: '',
  width: '$joystickWidth',
  height: '$joystickHeight',
  borderRadius: '$sm',
  boxShadow: '$level2',
  position: 'fixed',
  zIndex: 10000,
  overflow: 'hidden',
  $draggable: '',
  transform: 'translate(-50%, -50%)',
  variants: {
    isOutOfBounds: {
      true: {
        backgroundColor: '$elevation1'
      },
      false: {
        backgroundColor: '$elevation3'
      }
    }
  },
  '> div': {
    position: 'absolute',
    $flexCenter: '',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '$highlight1',
    backgroundColor: '$elevation3',
    width: '80%',
    height: '80%',
    '&::after,&::before': {
      content: '""',
      position: 'absolute',
      zindex: 10,
      backgroundColor: '$highlight1'
    },
    '&::before': {
      width: '100%',
      height: 1
    },
    '&::after': {
      height: '100%',
      width: 1
    }
  },
  '> span': {
    position: 'relative',
    zindex: 100,
    width: 10,
    height: 10,
    backgroundColor: '$accent2',
    borderRadius: '50%'
  }
});

function Joystick({
  value,
  settings,
  onUpdate
}) {
  const timeout = React.useRef();
  const outOfBoundsX = React.useRef(0);
  const outOfBoundsY = React.useRef(0);
  const stepMultiplier = React.useRef(1);
  const [joystickShown, setShowJoystick] = React.useState(false);
  const [isOutOfBounds, setIsOutOfBounds] = React.useState(false);
  const [spanRef, set] = vectorPlugin.useTransform();
  const joystickeRef = React.useRef(null);
  const playgroundRef = React.useRef(null);
  React.useLayoutEffect(() => {
    if (joystickShown) {
      const {
        top,
        left,
        width,
        height
      } = joystickeRef.current.getBoundingClientRect();
      playgroundRef.current.style.left = left + width / 2 + 'px';
      playgroundRef.current.style.top = top + height / 2 + 'px';
    }
  }, [joystickShown]);
  const {
    keys: [v1, v2],
    joystick
  } = settings;
  const yFactor = joystick === 'invertY' ? 1 : -1;
  const {
    [v1]: {
      step: stepV1
    },
    [v2]: {
      step: stepV2
    }
  } = settings;
  const wpx = vectorPlugin.useTh('sizes', 'joystickWidth');
  const hpx = vectorPlugin.useTh('sizes', 'joystickHeight');
  const w = parseFloat(wpx) * 0.8 / 2;
  const h = parseFloat(hpx) * 0.8 / 2;
  const startOutOfBounds = React.useCallback(() => {
    if (timeout.current) return;
    setIsOutOfBounds(true);
    if (outOfBoundsX.current) set({
      x: outOfBoundsX.current * w
    });
    if (outOfBoundsY.current) set({
      y: outOfBoundsY.current * -h
    });
    timeout.current = window.setInterval(() => {
      onUpdate(v => {
        const incX = stepV1 * outOfBoundsX.current * stepMultiplier.current;
        const incY = yFactor * stepV2 * outOfBoundsY.current * stepMultiplier.current;
        return Array.isArray(v) ? {
          [v1]: v[0] + incX,
          [v2]: v[1] + incY
        } : {
          [v1]: v[v1] + incX,
          [v2]: v[v2] + incY
        };
      });
    }, 16);
  }, [w, h, onUpdate, set, stepV1, stepV2, v1, v2, yFactor]);
  const endOutOfBounds = React.useCallback(() => {
    window.clearTimeout(timeout.current);
    timeout.current = undefined;
    setIsOutOfBounds(false);
  }, []);
  React.useEffect(() => {
    function setStepMultiplier(event) {
      stepMultiplier.current = vectorPlugin.multiplyStep(event);
    }
    window.addEventListener('keydown', setStepMultiplier);
    window.addEventListener('keyup', setStepMultiplier);
    return () => {
      window.clearTimeout(timeout.current);
      window.removeEventListener('keydown', setStepMultiplier);
      window.removeEventListener('keyup', setStepMultiplier);
    };
  }, []);
  const bind = vectorPlugin.useDrag(({
    first,
    active,
    delta: [dx, dy],
    movement: [mx, my]
  }) => {
    if (first) setShowJoystick(true);
    const _x = vectorPlugin.clamp(mx, -w, w);
    const _y = vectorPlugin.clamp(my, -h, h);
    outOfBoundsX.current = Math.abs(mx) > Math.abs(_x) ? Math.sign(mx - _x) : 0;
    outOfBoundsY.current = Math.abs(my) > Math.abs(_y) ? Math.sign(_y - my) : 0;

    let newX = value[v1];
    let newY = value[v2];
    if (active) {
      if (!outOfBoundsX.current) {
        newX += dx * stepV1 * stepMultiplier.current;
        set({
          x: _x
        });
      }
      if (!outOfBoundsY.current) {
        newY -= yFactor * dy * stepV2 * stepMultiplier.current;
        set({
          y: _y
        });
      }
      if (outOfBoundsX.current || outOfBoundsY.current) startOutOfBounds();else endOutOfBounds();
      onUpdate({
        [v1]: newX,
        [v2]: newY
      });
    } else {
      setShowJoystick(false);
      outOfBoundsX.current = 0;
      outOfBoundsY.current = 0;
      set({
        x: 0,
        y: 0
      });
      endOutOfBounds();
    }
  });
  return React__default["default"].createElement(JoystickTrigger, vectorPlugin._extends({
    ref: joystickeRef
  }, bind()), joystickShown && React__default["default"].createElement(vectorPlugin.Portal, null, React__default["default"].createElement(JoystickPlayground, {
    ref: playgroundRef,
    isOutOfBounds: isOutOfBounds
  }, React__default["default"].createElement("div", null), React__default["default"].createElement("span", {
    ref: spanRef
  }))));
}

const Container$1 = vectorPlugin.styled('div', {
  display: 'grid',
  columnGap: '$colGap',
  variants: {
    withJoystick: {
      true: {
        gridTemplateColumns: '$sizes$rowHeight auto'
      },
      false: {
        gridTemplateColumns: 'auto'
      }
    }
  }
});
function Vector2dComponent() {
  const {
    label,
    displayValue,
    onUpdate,
    settings
  } = vectorPlugin.useInputContext();
  return React__default["default"].createElement(vectorPlugin.Row, {
    input: true
  }, React__default["default"].createElement(vectorPlugin.Label, null, label), React__default["default"].createElement(Container$1, {
    withJoystick: !!settings.joystick
  }, settings.joystick && React__default["default"].createElement(Joystick, {
    value: displayValue,
    settings: settings,
    onUpdate: onUpdate
  }), React__default["default"].createElement(vectorPlugin.Vector, {
    value: displayValue,
    settings: settings,
    onUpdate: onUpdate
  })));
}

const _excluded$7 = ["joystick"];
const plugin = vectorPlugin.getVectorPlugin(['x', 'y']);
const normalize$2 = _ref => {
  let {
      joystick = true
    } = _ref,
    input = vectorPlugin._objectWithoutProperties(_ref, _excluded$7);
  const {
    value,
    settings
  } = plugin.normalize(input);
  return {
    value,
    settings: vectorPlugin._objectSpread2(vectorPlugin._objectSpread2({}, settings), {}, {
      joystick
    })
  };
};
var vector2d = vectorPlugin.createInternalPlugin(vectorPlugin._objectSpread2(vectorPlugin._objectSpread2({
  component: Vector2dComponent
}, plugin), {}, {
  normalize: normalize$2
}));

const sanitize$1 = v => {
  if (v === undefined) return undefined;
  if (v instanceof File) {
    try {
      return URL.createObjectURL(v);
    } catch (e) {
      return undefined;
    }
  }
  if (typeof v === 'string' && v.indexOf('blob:') === 0) return v;
  throw Erreur(`Invalid image format [undefined | blob | File].`);
};
const schema$1 = (_o, s) => typeof s === 'object' && 'image' in s;
const normalize$1 = ({
  image
}) => {
  return {
    value: image
  };
};

var props$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  sanitize: sanitize$1,
  schema: schema$1,
  normalize: normalize$1
});

const ImageContainer = vectorPlugin.styled('div', {
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: '$sizes$rowHeight auto 20px',
  columnGap: '$colGap',
  alignItems: 'center'
});
const DropZone = vectorPlugin.styled('div', {
  $flexCenter: '',
  overflow: 'hidden',
  height: '$rowHeight',
  background: '$elevation3',
  textAlign: 'center',
  color: 'inherit',
  borderRadius: '$sm',
  outline: 'none',
  userSelect: 'none',
  cursor: 'pointer',
  $inputStyle: '',
  $hover: '',
  $focusWithin: '',
  $active: '$accent1 $elevation1',
  variants: {
    isDragAccept: {
      true: {
        $inputStyle: '$accent1',
        backgroundColor: '$elevation1'
      }
    }
  }
});
const ImagePreview = vectorPlugin.styled('div', {
  boxSizing: 'border-box',
  borderRadius: '$sm',
  height: '$rowHeight',
  width: '$rowHeight',
  $inputStyle: '',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  variants: {
    hasImage: {
      true: {
        cursor: 'pointer',
        $hover: '',
        $active: ''
      }
    }
  }
});
const ImageLargePreview = vectorPlugin.styled('div', {
  $flexCenter: '',
  width: '$imagePreviewWidth',
  height: '$imagePreviewHeight',
  borderRadius: '$sm',
  boxShadow: '$level2',
  pointerEvents: 'none',
  $inputStyle: '',
  backgroundSize: 'cover',
  backgroundPosition: 'center'
});
const Instructions = vectorPlugin.styled('div', {
  fontSize: '0.8em',
  height: '100%',
  padding: '$rowGap $md'
});
const Remove = vectorPlugin.styled('div', {
  $flexCenter: '',
  top: '0',
  right: '0',
  marginRight: '$sm',
  height: '100%',
  cursor: 'pointer',
  variants: {
    disabled: {
      true: {
        color: '$elevation3',
        cursor: 'default'
      }
    }
  },
  '&::after,&::before': {
    content: '""',
    position: 'absolute',
    height: 2,
    width: 10,
    borderRadius: 1,
    backgroundColor: 'currentColor'
  },
  '&::after': {
    transform: 'rotate(45deg)'
  },
  '&::before': {
    transform: 'rotate(-45deg)'
  }
});

function ImageComponent() {
  const {
    label,
    value,
    onUpdate,
    disabled
  } = vectorPlugin.useInputContext();
  const {
    popinRef,
    wrapperRef,
    shown,
    show,
    hide
  } = usePopin();
  const onDrop = React.useCallback(acceptedFiles => {
    if (acceptedFiles.length) onUpdate(acceptedFiles[0]);
  }, [onUpdate]);
  const clear = React.useCallback(e => {
    e.stopPropagation();
    onUpdate(undefined);
  }, [onUpdate]);
  const {
    getRootProps,
    getInputProps,
    isDragAccept
  } = reactDropzone.useDropzone({
    maxFiles: 1,
    accept: 'image/*',
    onDrop,
    disabled
  });

  return React__default["default"].createElement(vectorPlugin.Row, {
    input: true
  }, React__default["default"].createElement(vectorPlugin.Label, null, label), React__default["default"].createElement(ImageContainer, null, React__default["default"].createElement(ImagePreview, {
    ref: popinRef,
    hasImage: !!value,
    onPointerDown: () => !!value && show(),
    onPointerUp: hide,
    style: {
      backgroundImage: value ? `url(${value})` : 'none'
    }
  }), shown && !!value && React__default["default"].createElement(vectorPlugin.Portal, null, React__default["default"].createElement(vectorPlugin.Overlay, {
    onPointerUp: hide,
    style: {
      cursor: 'pointer'
    }
  }), React__default["default"].createElement(ImageLargePreview, {
    ref: wrapperRef,
    style: {
      backgroundImage: `url(${value})`
    }
  })), React__default["default"].createElement(DropZone, getRootProps({
    isDragAccept
  }), React__default["default"].createElement("input", getInputProps()), React__default["default"].createElement(Instructions, null, isDragAccept ? 'drop image' : 'click or drop')), React__default["default"].createElement(Remove, {
    onClick: clear,
    disabled: !value
  })));
}

var image = vectorPlugin.createInternalPlugin(vectorPlugin._objectSpread2({
  component: ImageComponent
}, props$1));

const number = v8n__default["default"]().number();
const schema = (o, s) => v8n__default["default"]().array().length(2).every.number().test(o) && v8n__default["default"]().schema({
  min: number,
  max: number
}).test(s);
const format = v => ({
  min: v[0],
  max: v[1]
});
const sanitize = (value, {
  bounds: [MIN, MAX]
}, prevValue) => {
  const _value = Array.isArray(value) ? format(value) : value;
  const _newValue = {
    min: prevValue[0],
    max: prevValue[1]
  };
  const {
    min,
    max
  } = vectorPlugin._objectSpread2(vectorPlugin._objectSpread2({}, _newValue), _value);
  return [vectorPlugin.clamp(Number(min), MIN, Math.max(MIN, max)), vectorPlugin.clamp(Number(max), Math.min(MAX, min), MAX)];
};
const normalize = ({
  value,
  min,
  max
}) => {
  const boundsSettings = {
    min,
    max
  };
  const _settings = vectorPlugin.normalizeKeyedNumberSettings(format(value), {
    min: boundsSettings,
    max: boundsSettings
  });
  const bounds = [min, max];
  const settings = vectorPlugin._objectSpread2(vectorPlugin._objectSpread2({}, _settings), {}, {
    bounds
  });

  const _value = sanitize(format(value), settings, value);
  return {
    value: _value,
    settings
  };
};

var props = /*#__PURE__*/Object.freeze({
  __proto__: null,
  schema: schema,
  format: format,
  sanitize: sanitize,
  normalize: normalize
});

const _excluded$6 = ["value", "bounds", "onDrag"],
  _excluded2$1 = ["bounds"];
const Container = vectorPlugin.styled('div', {
  display: 'grid',
  columnGap: '$colGap',
  gridTemplateColumns: 'auto calc($sizes$numberInputMinWidth * 2 + $space$rowGap)'
});
function IntervalSlider(_ref) {
  let {
      value,
      bounds: [min, max],
      onDrag
    } = _ref,
    settings = vectorPlugin._objectWithoutProperties(_ref, _excluded$6);
  const ref = React.useRef(null);
  const minScrubberRef = React.useRef(null);
  const maxScrubberRef = React.useRef(null);
  const rangeWidth = React.useRef(0);
  const scrubberWidth = vectorPlugin.useTh('sizes', 'scrubberWidth');
  const bind = vectorPlugin.useDrag(({
    event,
    first,
    xy: [x],
    movement: [mx],
    memo: _memo = {}
  }) => {
    if (first) {
      const {
        width,
        left
      } = ref.current.getBoundingClientRect();
      rangeWidth.current = width - parseFloat(scrubberWidth);
      const targetIsScrub = (event === null || event === void 0 ? void 0 : event.target) === minScrubberRef.current || (event === null || event === void 0 ? void 0 : event.target) === maxScrubberRef.current;
      _memo.pos = vectorPlugin.invertedRange((x - left) / width, min, max);
      const delta = Math.abs(_memo.pos - value.min) - Math.abs(_memo.pos - value.max);
      _memo.key = delta < 0 || delta === 0 && _memo.pos <= value.min ? 'min' : 'max';
      if (targetIsScrub) _memo.pos = value[_memo.key];
    }
    const newValue = _memo.pos + vectorPlugin.invertedRange(mx / rangeWidth.current, 0, max - min);
    onDrag({
      [_memo.key]: vectorPlugin.sanitizeStep(newValue, settings[_memo.key])
    });
    return _memo;
  });
  const minStyle = `calc(${vectorPlugin.range(value.min, min, max)} * (100% - ${scrubberWidth} - 8px) + 4px)`;
  const maxStyle = `calc(${1 - vectorPlugin.range(value.max, min, max)} * (100% - ${scrubberWidth} - 8px) + 4px)`;
  return React__default["default"].createElement(vectorPlugin.RangeWrapper, vectorPlugin._extends({
    ref: ref
  }, bind()), React__default["default"].createElement(vectorPlugin.Range, null, React__default["default"].createElement(vectorPlugin.Indicator, {
    style: {
      left: minStyle,
      right: maxStyle
    }
  })), React__default["default"].createElement(vectorPlugin.Scrubber, {
    position: "left",
    ref: minScrubberRef,
    style: {
      left: minStyle
    }
  }), React__default["default"].createElement(vectorPlugin.Scrubber, {
    position: "right",
    ref: maxScrubberRef,
    style: {
      right: maxStyle
    }
  }));
}
function IntervalComponent() {
  const {
    label,
    displayValue,
    onUpdate,
    settings
  } = vectorPlugin.useInputContext();
  const _settings = vectorPlugin._objectWithoutProperties(settings, _excluded2$1);
  return React__default["default"].createElement(React__default["default"].Fragment, null, React__default["default"].createElement(vectorPlugin.Row, {
    input: true
  }, React__default["default"].createElement(vectorPlugin.Label, null, label), React__default["default"].createElement(Container, null, React__default["default"].createElement(IntervalSlider, vectorPlugin._extends({
    value: displayValue
  }, settings, {
    onDrag: onUpdate
  })), React__default["default"].createElement(vectorPlugin.Vector, {
    value: displayValue,
    settings: _settings,
    onUpdate: onUpdate,
    innerLabelTrim: 0
  }))));
}

var interval = vectorPlugin.createInternalPlugin(vectorPlugin._objectSpread2({
  component: IntervalComponent
}, props));

const createEventEmitter = () => {
  const listenerMapping = new Map();
  return {
    on: (topic, listener) => {
      let listeners = listenerMapping.get(topic);
      if (listeners === undefined) {
        listeners = new Set();
        listenerMapping.set(topic, listeners);
      }
      listeners.add(listener);
    },
    off: (topic, listener) => {
      const listeners = listenerMapping.get(topic);
      if (listeners === undefined) {
        return;
      }
      listeners.delete(listener);
      if (listeners.size === 0) {
        listenerMapping.delete(topic);
      }
    },
    emit: (topic, ...args) => {
      const listeners = listenerMapping.get(topic);
      if (listeners === undefined) {
        return;
      }
      for (const listener of listeners) {
        listener(...args);
      }
    }
  };
};

const _excluded$5 = ["type", "value"],
  _excluded2 = ["onChange", "transient", "onEditStart", "onEditEnd"];
const Store = function Store() {
  const store = create__default["default"](middleware.subscribeWithSelector(() => ({
    data: {}
  })));
  const eventEmitter = createEventEmitter();
  this.storeId = vectorPlugin.getUid();
  this.useStore = store;
  const folders = {};

  const orderedPaths = new Set();

  this.getVisiblePaths = () => {
    const data = this.getData();
    const paths = Object.keys(data);
    const hiddenFolders = [];
    Object.entries(folders).forEach(([path, settings]) => {
      if (
      settings.render &&
      paths.some(p => p.indexOf(path) === 0) &&
      !settings.render(this.get))
        hiddenFolders.push(path + '.');
    });
    const visiblePaths = [];
    orderedPaths.forEach(path => {
      if (path in data &&
      data[path].__refCount > 0 &&
      hiddenFolders.every(p => path.indexOf(p) === -1) && (
      !data[path].render || data[path].render(this.get))) {
        visiblePaths.push(path);
      }
    });
    return visiblePaths;
  };

  this.setOrderedPaths = newPaths => {
    newPaths.forEach(p => orderedPaths.add(p));
  };
  this.orderPaths = paths => {
    this.setOrderedPaths(paths);
    return paths;
  };

  this.disposePaths = paths => {
    store.setState(s => {
      const data = s.data;
      paths.forEach(path => {
        if (path in data) {
          const input = data[path];
          input.__refCount--;
          if (input.__refCount === 0 && input.type in vectorPlugin.SpecialInputs) {
            delete data[path];
          }
        }
      });
      return {
        data
      };
    });
  };
  this.dispose = () => {
    store.setState(() => {
      return {
        data: {}
      };
    });
  };
  this.getFolderSettings = path => {
    return folders[path] || {};
  };

  this.getData = () => {
    return store.getState().data;
  };

  this.addData = (newData, override) => {
    store.setState(s => {
      const data = s.data;
      Object.entries(newData).forEach(([path, newInputData]) => {
        let input = data[path];

        if (!!input) {
          const {
              type,
              value
            } = newInputData,
            rest = vectorPlugin._objectWithoutProperties(newInputData, _excluded$5);
          if (type !== input.type) {
            vectorPlugin.warn(vectorPlugin.LevaErreurs.INPUT_TYPE_OVERRIDE, type);
          } else {
            if (input.__refCount === 0 || override) {
              Object.assign(input, rest);
            }
            input.__refCount++;
          }
        } else {
          data[path] = vectorPlugin._objectSpread2(vectorPlugin._objectSpread2({}, newInputData), {}, {
            __refCount: 1
          });
        }
      });

      return {
        data
      };
    });
  };

  this.setValueAtPath = (path, value, fromPanel) => {
    store.setState(s => {
      const data = s.data;
      vectorPlugin.updateInput(data[path], value, path, this, fromPanel);
      return {
        data
      };
    });
  };
  this.setSettingsAtPath = (path, settings) => {
    store.setState(s => {
      const data = s.data;
      data[path].settings = vectorPlugin._objectSpread2(vectorPlugin._objectSpread2({}, data[path].settings), settings);
      return {
        data
      };
    });
  };
  this.disableInputAtPath = (path, flag) => {
    store.setState(s => {
      const data = s.data;
      data[path].disabled = flag;
      return {
        data
      };
    });
  };
  this.set = (values, fromPanel) => {
    store.setState(s => {
      const data = s.data;
      Object.entries(values).forEach(([path, value]) => {
        try {
          vectorPlugin.updateInput(data[path], value, undefined, undefined, fromPanel);
        } catch (e) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[This message will only show in development]: \`set\` for path ${path} has failed.`, e);
          }
        }
      });
      return {
        data
      };
    });
  };
  this.getInput = path => {
    try {
      return this.getData()[path];
    } catch (e) {
      vectorPlugin.warn(vectorPlugin.LevaErreurs.PATH_DOESNT_EXIST, path);
    }
  };
  this.get = path => {
    var _this$getInput;
    return (_this$getInput = this.getInput(path)) === null || _this$getInput === void 0 ? void 0 : _this$getInput.value;
  };
  this.emitOnEditStart = path => {
    eventEmitter.emit(`onEditStart:${path}`, this.get(path), path, vectorPlugin._objectSpread2(vectorPlugin._objectSpread2({}, this.getInput(path)), {}, {
      get: this.get
    }));
  };
  this.emitOnEditEnd = path => {
    eventEmitter.emit(`onEditEnd:${path}`, this.get(path), path, vectorPlugin._objectSpread2(vectorPlugin._objectSpread2({}, this.getInput(path)), {}, {
      get: this.get
    }));
  };
  this.subscribeToEditStart = (path, listener) => {
    const _path = `onEditStart:${path}`;
    eventEmitter.on(_path, listener);
    return () => eventEmitter.off(_path, listener);
  };
  this.subscribeToEditEnd = (path, listener) => {
    const _path = `onEditEnd:${path}`;
    eventEmitter.on(_path, listener);
    return () => eventEmitter.off(_path, listener);
  };

  const _getDataFromSchema = (schema, rootPath, mappedPaths) => {
    const data = {};
    Object.entries(schema).forEach(([key, rawInput]) => {
      if (key === '') return vectorPlugin.warn(vectorPlugin.LevaErreurs.EMPTY_KEY);
      let newPath = join(rootPath, key);

      if (rawInput.type === vectorPlugin.SpecialInputs.FOLDER) {
        const newData = _getDataFromSchema(rawInput.schema, newPath, mappedPaths);
        Object.assign(data, newData);

        if (!(newPath in folders)) folders[newPath] = rawInput.settings;
      } else if (key in mappedPaths) {
        vectorPlugin.warn(vectorPlugin.LevaErreurs.DUPLICATE_KEYS, key, newPath, mappedPaths[key].path);
      } else {
        const normalizedInput = vectorPlugin.normalizeInput(rawInput, key, newPath, data);
        if (normalizedInput) {
          const {
            type,
            options,
            input
          } = normalizedInput;
          const {
              onChange,
              transient,
              onEditStart,
              onEditEnd
            } = options,
            _options = vectorPlugin._objectWithoutProperties(options, _excluded2);
          data[newPath] = vectorPlugin._objectSpread2(vectorPlugin._objectSpread2(vectorPlugin._objectSpread2({
            type
          }, _options), input), {}, {
            fromPanel: true
          });
          mappedPaths[key] = {
            path: newPath,
            onChange,
            transient,
            onEditStart,
            onEditEnd
          };
        } else {
          vectorPlugin.warn(vectorPlugin.LevaErreurs.UNKNOWN_INPUT, newPath, rawInput);
        }
      }
    });
    return data;
  };
  this.getDataFromSchema = schema => {
    const mappedPaths = {};
    const data = _getDataFromSchema(schema, '', mappedPaths);
    return [data, mappedPaths];
  };
};
const levaStore = new Store();
function useCreateStore() {
  return React.useMemo(() => new Store(), []);
}
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.__STORE = levaStore;
}

const defaultSettings$2 = {
  collapsed: false
};
function folder(schema, settings) {
  return {
    type: vectorPlugin.SpecialInputs.FOLDER,
    schema,
    settings: vectorPlugin._objectSpread2(vectorPlugin._objectSpread2({}, defaultSettings$2), settings)
  };
}

const defaultSettings$1 = {
  disabled: false
};

function button(onClick, settings) {
  return {
    type: vectorPlugin.SpecialInputs.BUTTON,
    onClick,
    settings: vectorPlugin._objectSpread2(vectorPlugin._objectSpread2({}, defaultSettings$1), settings)
  };
}

function buttonGroup(opts) {
  return {
    type: vectorPlugin.SpecialInputs.BUTTON_GROUP,
    opts
  };
}

const defaultSettings = {
  graph: false,
  interval: 100
};
function monitor(objectOrFn, settings) {
  return {
    type: vectorPlugin.SpecialInputs.MONITOR,
    objectOrFn,
    settings: vectorPlugin._objectSpread2(vectorPlugin._objectSpread2({}, defaultSettings), settings)
  };
}

const isInput = v => '__levaInput' in v;
const buildTree = (paths, filter) => {
  const tree = {};
  const _filter = filter ? filter.toLowerCase() : null;
  paths.forEach(path => {
    const [valueKey, folderPath] = getKeyPath(path);
    if (!_filter || valueKey.toLowerCase().indexOf(_filter) > -1) {
      merge__default["default"](tree, folderPath, {
        [valueKey]: {
          __levaInput: true,
          path
        }
      });
    }
  });
  return tree;
};

const _excluded$4 = ["type", "label", "path", "valueKey", "value", "settings", "setValue", "disabled"];
function ControlInput(_ref) {
  let {
      type,
      label,
      path,
      valueKey,
      value,
      settings,
      setValue,
      disabled
    } = _ref,
    rest = vectorPlugin._objectWithoutProperties(_ref, _excluded$4);
  const {
    displayValue,
    onChange,
    onUpdate
  } = vectorPlugin.useInputSetters({
    type,
    value,
    settings,
    setValue
  });
  const Input = vectorPlugin.Plugins[type].component;
  if (!Input) {
    vectorPlugin.warn(vectorPlugin.LevaErreurs.NO_COMPONENT_FOR_TYPE, type, path);
    return null;
  }
  return React__default["default"].createElement(vectorPlugin.InputContext.Provider, {
    value: vectorPlugin._objectSpread2({
      key: valueKey,
      path,
      id: '' + path,
      label,
      displayValue,
      value,
      onChange,
      onUpdate,
      settings,
      setValue,
      disabled
    }, rest)
  }, React__default["default"].createElement(vectorPlugin.StyledInputWrapper, {
    disabled: disabled
  }, React__default["default"].createElement(Input, null)));
}

const StyledButton = vectorPlugin.styled('button', {
  display: 'block',
  $reset: '',
  fontWeight: '$button',
  height: '$rowHeight',
  borderStyle: 'none',
  borderRadius: '$sm',
  backgroundColor: '$elevation1',
  color: '$highlight1',
  '&:not(:disabled)': {
    color: '$highlight3',
    backgroundColor: '$accent2',
    cursor: 'pointer',
    $hover: '$accent3',
    $active: '$accent3 $accent1',
    $focus: ''
  }
});

function Button({
  onClick,
  settings,
  label
}) {
  const store = vectorPlugin.useStoreContext();
  return React__default["default"].createElement(vectorPlugin.Row, null, React__default["default"].createElement(StyledButton, {
    disabled: settings.disabled,
    onClick: () => onClick(store.get)
  }, label));
}

const StyledButtonGroup = vectorPlugin.styled('div', {
  $flex: '',
  justifyContent: 'flex-end',
  gap: '$colGap'
});

const StyledButtonGroupButton = vectorPlugin.styled('button', {
  $reset: '',
  cursor: 'pointer',
  borderRadius: '$xs',
  '&:hover': {
    backgroundColor: '$elevation3'
  }
});

const getOpts = ({
  label: _label,
  opts: _opts
}) => {
  let label = typeof _label === 'string' ? _label.trim() === '' ? null : _label : _label;
  let opts = _opts;
  if (typeof _opts.opts === 'object') {
    if (opts.label !== undefined) {
      label = _opts.label;
    }
    opts = _opts.opts;
  }
  return {
    label,
    opts: opts
  };
};
function ButtonGroup(props) {
  const {
    label,
    opts
  } = getOpts(props);
  const store = vectorPlugin.useStoreContext();
  return React__default["default"].createElement(vectorPlugin.Row, {
    input: !!label
  }, label && React__default["default"].createElement(vectorPlugin.Label, null, label), React__default["default"].createElement(StyledButtonGroup, null, Object.entries(opts).map(([label, onClick]) => React__default["default"].createElement(StyledButtonGroupButton, {
    key: label,
    onClick: () => onClick(store.get)
  }, label))));
}

const Canvas = vectorPlugin.styled('canvas', {
  height: '$monitorHeight',
  width: '100%',
  display: 'block',
  borderRadius: '$sm'
});

const POINTS = 100;
function push(arr, val) {
  arr.push(val);
  if (arr.length > POINTS) arr.shift();
}
const MonitorCanvas = React.forwardRef(function ({
  initialValue
}, ref) {
  const accentColor = vectorPlugin.useTh('colors', 'highlight3');
  const backgroundColor = vectorPlugin.useTh('colors', 'elevation2');
  const fillColor = vectorPlugin.useTh('colors', 'highlight1');
  const [gradientTop, gradientBottom] = React.useMemo(() => {
    return [colord.colord(fillColor).alpha(0.4).toRgbString(), colord.colord(fillColor).alpha(0.1).toRgbString()];
  }, [fillColor]);
  const points = React.useRef([initialValue]);
  const min = React.useRef(initialValue);
  const max = React.useRef(initialValue);
  const raf = React.useRef();
  const drawPlot = React.useCallback((_canvas, _ctx) => {
    if (!_canvas) return;
    const {
      width,
      height
    } = _canvas;

    const path = new Path2D();
    const interval = width / POINTS;
    const verticalPadding = height * 0.05;
    for (let i = 0; i < points.current.length; i++) {
      const p = vectorPlugin.range(points.current[i], min.current, max.current);
      const x = interval * i;
      const y = height - p * (height - verticalPadding * 2) - verticalPadding;
      path.lineTo(x, y);
    }

    _ctx.clearRect(0, 0, width, height);

    const gradientPath = new Path2D(path);
    gradientPath.lineTo(interval * (points.current.length + 1), height);
    gradientPath.lineTo(0, height);
    gradientPath.lineTo(0, 0);
    const gradient = _ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0.0, gradientTop);
    gradient.addColorStop(1.0, gradientBottom);
    _ctx.fillStyle = gradient;
    _ctx.fill(gradientPath);

    _ctx.strokeStyle = backgroundColor;
    _ctx.lineJoin = 'round';
    _ctx.lineWidth = 14;
    _ctx.stroke(path);

    _ctx.strokeStyle = accentColor;
    _ctx.lineWidth = 2;
    _ctx.stroke(path);
  }, [accentColor, backgroundColor, gradientTop, gradientBottom]);
  const [canvas, ctx] = vectorPlugin.useCanvas2d(drawPlot);
  React.useImperativeHandle(ref, () => ({
    frame: val => {
      if (min.current === undefined || val < min.current) min.current = val;
      if (max.current === undefined || val > max.current) max.current = val;
      push(points.current, val);
      raf.current = requestAnimationFrame(() => drawPlot(canvas.current, ctx.current));
    }
  }), [canvas, ctx, drawPlot]);
  React.useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return React__default["default"].createElement(Canvas, {
    ref: canvas
  });
});
const parse = val => Number.isFinite(val) ? val.toPrecision(2) : val.toString();
const MonitorLog = React.forwardRef(function ({
  initialValue
}, ref) {
  const [val, set] = React.useState(parse(initialValue));
  React.useImperativeHandle(ref, () => ({
    frame: v => set(parse(v))
  }), []);
  return React__default["default"].createElement("div", null, val);
});
function getValue(o) {
  return typeof o === 'function' ? o() : o.current;
}
function Monitor({
  label,
  objectOrFn,
  settings
}) {
  const ref = React.useRef();
  const initialValue = React.useRef(getValue(objectOrFn));
  React.useEffect(() => {
    const timeout = window.setInterval(() => {
      var _ref$current;
      if (document.hidden) return;
      (_ref$current = ref.current) === null || _ref$current === void 0 ? void 0 : _ref$current.frame(getValue(objectOrFn));
    }, settings.interval);
    return () => window.clearInterval(timeout);
  }, [objectOrFn, settings.interval]);
  return React__default["default"].createElement(vectorPlugin.Row, {
    input: true
  }, React__default["default"].createElement(vectorPlugin.Label, {
    align: "top"
  }, label), settings.graph ? React__default["default"].createElement(MonitorCanvas, {
    ref: ref,
    initialValue: initialValue.current
  }) : React__default["default"].createElement(MonitorLog, {
    ref: ref,
    initialValue: initialValue.current
  }));
}

const _excluded$3 = ["type", "label", "key"];
const specialComponents = {
  [vectorPlugin.SpecialInputs.BUTTON]: Button,
  [vectorPlugin.SpecialInputs.BUTTON_GROUP]: ButtonGroup,
  [vectorPlugin.SpecialInputs.MONITOR]: Monitor
};
const Control = React__default["default"].memo(({
  path
}) => {
  const [input, {
    set,
    setSettings,
    disable,
    storeId,
    emitOnEditStart,
    emitOnEditEnd
  }] = vectorPlugin.useInput(path);
  if (!input) return null;
  const {
      type,
      label,
      key
    } = input,
    inputProps = vectorPlugin._objectWithoutProperties(input, _excluded$3);
  if (type in vectorPlugin.SpecialInputs) {
    const SpecialInputForType = specialComponents[type];
    return React__default["default"].createElement(SpecialInputForType, vectorPlugin._extends({
      label: label,
      path: path
    }, inputProps));
  }
  if (!(type in vectorPlugin.Plugins)) {
    vectorPlugin.log(vectorPlugin.LevaErreurs.UNSUPPORTED_INPUT, type, path);
    return null;
  }
  return React__default["default"].createElement(ControlInput, vectorPlugin._extends({
    key: storeId + path,
    type: type,
    label: label,
    storeId: storeId,
    path: path,
    valueKey: key,
    setValue: set,
    setSettings: setSettings,
    disable: disable,
    emitOnEditStart: emitOnEditStart,
    emitOnEditEnd: emitOnEditEnd
  }, inputProps));
});

function FolderTitle({
  toggle,
  toggled,
  name
}) {
  return React__default["default"].createElement(vectorPlugin.StyledTitle, {
    onClick: () => toggle()
  }, React__default["default"].createElement(vectorPlugin.Chevron, {
    toggled: toggled
  }), React__default["default"].createElement("div", null, name));
}

const Folder = ({
  name,
  path,
  tree
}) => {
  const store = vectorPlugin.useStoreContext();
  const newPath = join(path, name);
  const {
    collapsed,
    color
  } = store.getFolderSettings(newPath);
  const [toggled, setToggle] = React.useState(!collapsed);
  const folderRef = React.useRef(null);
  const widgetColor = vectorPlugin.useTh('colors', 'folderWidgetColor');
  const textColor = vectorPlugin.useTh('colors', 'folderTextColor');
  React.useLayoutEffect(() => {
    folderRef.current.style.setProperty('--leva-colors-folderWidgetColor', color || widgetColor);
    folderRef.current.style.setProperty('--leva-colors-folderTextColor', color || textColor);
  }, [color, widgetColor, textColor]);
  return React__default["default"].createElement(vectorPlugin.StyledFolder, {
    ref: folderRef
  }, React__default["default"].createElement(FolderTitle, {
    name: name,
    toggled: toggled,
    toggle: () => setToggle(t => !t)
  }), React__default["default"].createElement(TreeWrapper, {
    parent: newPath,
    tree: tree,
    toggled: toggled
  }));
};
const TreeWrapper = React__default["default"].memo(({
  isRoot: _isRoot = false,
  fill: _fill = false,
  flat: _flat = false,
  parent,
  tree,
  toggled
}) => {
  const {
    wrapperRef,
    contentRef
  } = useToggle(toggled);
  const store = vectorPlugin.useStoreContext();
  const getOrder = ([key, o]) => {
    var _store$getInput;
    const order = isInput(o) ? (_store$getInput = store.getInput(o.path)) === null || _store$getInput === void 0 ? void 0 : _store$getInput.order : store.getFolderSettings(join(parent, key)).order;
    return order || 0;
  };
  const entries = Object.entries(tree).sort((a, b) => getOrder(a) - getOrder(b));
  return React__default["default"].createElement(vectorPlugin.StyledWrapper, {
    ref: wrapperRef,
    isRoot: _isRoot,
    fill: _fill,
    flat: _flat
  }, React__default["default"].createElement(vectorPlugin.StyledContent, {
    ref: contentRef,
    isRoot: _isRoot,
    toggled: toggled
  }, entries.map(([key, value]) => isInput(value) ? React__default["default"].createElement(Control, {
    key: value.path,
    valueKey: value.valueKey,
    path: value.path
  }) : React__default["default"].createElement(Folder, {
    key: key,
    name: key,
    path: parent,
    tree: value
  }))));
});

const StyledRoot = vectorPlugin.styled('div', {
  position: 'relative',
  fontFamily: '$mono',
  fontSize: '$root',
  color: '$rootText',
  backgroundColor: '$elevation1',
  variants: {
    fill: {
      false: {
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        width: '$rootWidth'
      },
      true: {
        position: 'relative',
        width: '100%'
      }
    },
    flat: {
      false: {
        borderRadius: '$lg',
        boxShadow: '$level1'
      }
    },
    oneLineLabels: {
      true: {
        [`${vectorPlugin.StyledInputRow}`]: {
          gridTemplateColumns: 'auto',
          gridAutoColumns: 'minmax(max-content, 1fr)',
          gridAutoRows: 'minmax($sizes$rowHeight), auto)',
          rowGap: 0,
          columnGap: 0,
          marginTop: '$rowGap'
        }
      }
    },
    hideTitleBar: {
      true: {
        $$titleBarHeight: '0px'
      },
      false: {
        $$titleBarHeight: '$sizes$titleBarHeight'
      }
    }
  },
  '&,*,*:after,*:before': {
    boxSizing: 'border-box'
  },
  '*::selection': {
    backgroundColor: '$accent2'
  }
});

const iconWidth = 40;
const Icon = vectorPlugin.styled('i', {
  $flexCenter: '',
  width: iconWidth,
  userSelect: 'none',
  cursor: 'pointer',
  '> svg': {
    fill: '$highlight1',
    transition: 'transform 350ms ease, fill 250ms ease'
  },
  '&:hover > svg': {
    fill: '$highlight3'
  },
  variants: {
    active: {
      true: {
        '> svg': {
          fill: '$highlight2'
        }
      }
    }
  }
});
const StyledTitleWithFilter = vectorPlugin.styled('div', {
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'space-between',
  height: '$titleBarHeight',
  variants: {
    mode: {
      drag: {
        cursor: 'grab'
      }
    }
  }
});
const FilterWrapper = vectorPlugin.styled('div', {
  $flex: '',
  position: 'relative',
  width: '100%',
  overflow: 'hidden',
  transition: 'height 250ms ease',
  color: '$highlight3',
  paddingLeft: '$md',
  [`> ${Icon}`]: {
    height: 30
  },
  variants: {
    toggled: {
      true: {
        height: 30
      },
      false: {
        height: 0
      }
    }
  }
});
const StyledFilterInput = vectorPlugin.styled('input', {
  $reset: '',
  flex: 1,
  position: 'relative',
  height: 30,
  width: '100%',
  backgroundColor: 'transparent',
  fontSize: '10px',
  borderRadius: '$root',
  '&:focus': {},
  '&::placeholder': {
    color: '$highlight2'
  }
});
const TitleContainer = vectorPlugin.styled('div', {
  touchAction: 'none',
  $flexCenter: '',
  flex: 1,
  '> svg': {
    fill: '$highlight1'
  },
  color: '$highlight1',
  variants: {
    drag: {
      true: {
        $draggable: '',
        '> svg': {
          transition: 'fill 250ms ease'
        },
        '&:hover': {
          color: '$highlight3'
        },
        '&:hover > svg': {
          fill: '$highlight3'
        }
      }
    },
    filterEnabled: {
      false: {
        paddingRight: iconWidth
      }
    }
  }
});

const FilterInput = React__default["default"].forwardRef(({
  setFilter,
  toggle
}, ref) => {
  const [value, set] = React.useState('');
  const debouncedOnChange = React.useMemo(() => vectorPlugin.debounce(setFilter, 250), [setFilter]);
  const clear = () => {
    setFilter('');
    set('');
  };
  const _onChange = e => {
    const v = e.currentTarget.value;
    toggle(true);
    set(v);
  };
  React.useEffect(() => {
    debouncedOnChange(value);
  }, [value, debouncedOnChange]);
  return React__default["default"].createElement(React__default["default"].Fragment, null, React__default["default"].createElement(StyledFilterInput, {
    ref: ref,
    value: value,
    placeholder: "[Open filter with CMD+SHIFT+L]",
    onPointerDown: e => e.stopPropagation(),
    onChange: _onChange
  }), React__default["default"].createElement(Icon, {
    onClick: () => clear(),
    style: {
      visibility: value ? 'visible' : 'hidden'
    }
  }, React__default["default"].createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    height: "14",
    width: "14",
    viewBox: "0 0 20 20",
    fill: "currentColor"
  }, React__default["default"].createElement("path", {
    fillRule: "evenodd",
    d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z",
    clipRule: "evenodd"
  }))));
});
function TitleWithFilter({
  setFilter,
  onDrag,
  onDragStart,
  onDragEnd,
  toggle,
  toggled,
  title,
  drag,
  filterEnabled,
  from
}) {
  const [filterShown, setShowFilter] = React.useState(false);
  const inputRef = React.useRef(null);
  React.useEffect(() => {
    var _inputRef$current, _inputRef$current2;
    if (filterShown) (_inputRef$current = inputRef.current) === null || _inputRef$current === void 0 ? void 0 : _inputRef$current.focus();else (_inputRef$current2 = inputRef.current) === null || _inputRef$current2 === void 0 ? void 0 : _inputRef$current2.blur();
  }, [filterShown]);
  const bind = vectorPlugin.useDrag(({
    offset: [x, y],
    first,
    last
  }) => {
    onDrag({
      x,
      y
    });
    if (first) {
      onDragStart({
        x,
        y
      });
    }
    if (last) {
      onDragEnd({
        x,
        y
      });
    }
  }, {
    filterTaps: true,
    from: ({
      offset: [x, y]
    }) => [(from === null || from === void 0 ? void 0 : from.x) || x, (from === null || from === void 0 ? void 0 : from.y) || y]
  });
  React.useEffect(() => {
    const handleShortcut = event => {
      if (event.key === 'L' && event.shiftKey && event.metaKey) {
        setShowFilter(f => !f);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);
  return React__default["default"].createElement(React__default["default"].Fragment, null, React__default["default"].createElement(StyledTitleWithFilter, {
    mode: drag ? 'drag' : undefined
  }, React__default["default"].createElement(Icon, {
    active: !toggled,
    onClick: () => toggle()
  }, React__default["default"].createElement(vectorPlugin.Chevron, {
    toggled: toggled,
    width: 12,
    height: 8
  })), React__default["default"].createElement(TitleContainer, vectorPlugin._extends({}, drag ? bind() : {}, {
    drag: drag,
    filterEnabled: filterEnabled
  }), title === undefined && drag ? React__default["default"].createElement("svg", {
    width: "20",
    height: "10",
    viewBox: "0 0 28 14",
    xmlns: "http://www.w3.org/2000/svg"
  }, React__default["default"].createElement("circle", {
    cx: "2",
    cy: "2",
    r: "2"
  }), React__default["default"].createElement("circle", {
    cx: "14",
    cy: "2",
    r: "2"
  }), React__default["default"].createElement("circle", {
    cx: "26",
    cy: "2",
    r: "2"
  }), React__default["default"].createElement("circle", {
    cx: "2",
    cy: "12",
    r: "2"
  }), React__default["default"].createElement("circle", {
    cx: "14",
    cy: "12",
    r: "2"
  }), React__default["default"].createElement("circle", {
    cx: "26",
    cy: "12",
    r: "2"
  })) : title), filterEnabled && React__default["default"].createElement(Icon, {
    active: filterShown,
    onClick: () => setShowFilter(f => !f)
  }, React__default["default"].createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    height: "20",
    viewBox: "0 0 20 20"
  }, React__default["default"].createElement("path", {
    d: "M9 9a2 2 0 114 0 2 2 0 01-4 0z"
  }), React__default["default"].createElement("path", {
    fillRule: "evenodd",
    d: "M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z",
    clipRule: "evenodd"
  })))), React__default["default"].createElement(FilterWrapper, {
    toggled: filterShown
  }, React__default["default"].createElement(FilterInput, {
    ref: inputRef,
    setFilter: setFilter,
    toggle: toggle
  })));
}

const _excluded$2 = ["store", "hidden", "theme", "collapsed"];
function LevaRoot(_ref) {
  let {
      store,
      hidden = false,
      theme,
      collapsed = false
    } = _ref,
    props = vectorPlugin._objectWithoutProperties(_ref, _excluded$2);
  const themeContext = useDeepMemo(() => vectorPlugin.mergeTheme(theme), [theme]);
  const [toggled, setToggle] = React.useState(!collapsed);
  const computedToggled = typeof collapsed === 'object' ? !collapsed.collapsed : toggled;
  const computedSetToggle = React.useMemo(() => {
    if (typeof collapsed === 'object') {
      return value => {
        if (typeof value === 'function') {
          collapsed.onChange(!value(!collapsed.collapsed));
        } else {
          collapsed.onChange(!value);
        }
      };
    }
    return setToggle;
  }, [collapsed]);
  if (!store || hidden) return null;
  return React__default["default"].createElement(vectorPlugin.ThemeContext.Provider, {
    value: themeContext
  }, React__default["default"].createElement(LevaCore, vectorPlugin._extends({
    store: store
  }, props, {
    toggled: computedToggled,
    setToggle: computedSetToggle,
    rootClass: themeContext.className
  })));
}
const LevaCore = React__default["default"].memo(({
  store,
  rootClass,
  fill: _fill = false,
  flat: _flat = false,
  neverHide: _neverHide = false,
  oneLineLabels: _oneLineLabels = false,
  titleBar: _titleBar = {
    title: undefined,
    drag: true,
    filter: true,
    position: undefined,
    onDrag: undefined,
    onDragStart: undefined,
    onDragEnd: undefined
  },
  hideCopyButton: _hideCopyButton = false,
  toggled,
  setToggle
}) => {
  var _titleBar$drag, _titleBar$filter;
  const paths = useVisiblePaths(store);
  const [filter, setFilter] = React.useState('');
  const tree = React.useMemo(() => buildTree(paths, filter), [paths, filter]);

  const [rootRef, set] = vectorPlugin.useTransform();

  const shouldShow = _neverHide || paths.length > 0;
  const title = typeof _titleBar === 'object' ? _titleBar.title || undefined : undefined;
  const drag = typeof _titleBar === 'object' ? (_titleBar$drag = _titleBar.drag) !== null && _titleBar$drag !== void 0 ? _titleBar$drag : true : true;
  const filterEnabled = typeof _titleBar === 'object' ? (_titleBar$filter = _titleBar.filter) !== null && _titleBar$filter !== void 0 ? _titleBar$filter : true : true;
  const position = typeof _titleBar === 'object' ? _titleBar.position || undefined : undefined;
  const onDrag = typeof _titleBar === 'object' ? _titleBar.onDrag || undefined : undefined;
  const onDragStart = typeof _titleBar === 'object' ? _titleBar.onDragStart || undefined : undefined;
  const onDragEnd = typeof _titleBar === 'object' ? _titleBar.onDragEnd || undefined : undefined;
  React__default["default"].useEffect(() => {
    set({
      x: position === null || position === void 0 ? void 0 : position.x,
      y: position === null || position === void 0 ? void 0 : position.y
    });
  }, [position, set]);
  vectorPlugin.globalStyles();
  return React__default["default"].createElement(vectorPlugin.PanelSettingsContext.Provider, {
    value: {
      hideCopyButton: _hideCopyButton
    }
  }, React__default["default"].createElement(StyledRoot, {
    ref: rootRef,
    className: rootClass,
    fill: _fill,
    flat: _flat,
    oneLineLabels: _oneLineLabels,
    hideTitleBar: !_titleBar,
    style: {
      display: shouldShow ? 'block' : 'none'
    }
  }, _titleBar && React__default["default"].createElement(TitleWithFilter, {
    onDrag: point => {
      set(point);
      onDrag === null || onDrag === void 0 ? void 0 : onDrag(point);
    },
    onDragStart: point => onDragStart === null || onDragStart === void 0 ? void 0 : onDragStart(point),
    onDragEnd: point => onDragEnd === null || onDragEnd === void 0 ? void 0 : onDragEnd(point),
    setFilter: setFilter,
    toggle: flag => setToggle(t => flag !== null && flag !== void 0 ? flag : !t),
    toggled: toggled,
    title: title,
    drag: drag,
    filterEnabled: filterEnabled,
    from: position
  }), shouldShow && React__default["default"].createElement(vectorPlugin.StoreContext.Provider, {
    value: store
  }, React__default["default"].createElement(TreeWrapper, {
    isRoot: true,
    fill: _fill,
    flat: _flat,
    tree: tree,
    toggled: toggled
  }))));
});

const _excluded$1 = ["isRoot"];
let rootInitialized = false;
let rootEl = null;
function Leva(_ref) {
  let {
      isRoot = false
    } = _ref,
    props = vectorPlugin._objectWithoutProperties(_ref, _excluded$1);
  React.useEffect(() => {
    rootInitialized = true;
    if (!isRoot && rootEl) {
      rootEl.remove();
      rootEl = null;
    }
    return () => {
      if (!isRoot) rootInitialized = false;
    };
  }, [isRoot]);
  return React__default["default"].createElement(LevaRoot, vectorPlugin._extends({
    store: levaStore
  }, props));
}

function useRenderRoot(isGlobalPanel) {
  React.useEffect(() => {
    if (isGlobalPanel && !rootInitialized) {
      if (!rootEl) {
        rootEl = document.getElementById('leva__root') || Object.assign(document.createElement('div'), {
          id: 'leva__root'
        });
        if (document.body) {
          document.body.appendChild(rootEl);
          vectorPlugin.render(React__default["default"].createElement(Leva, {
            isRoot: true
          }), rootEl);
        }
      }
      rootInitialized = true;
    }
  }, [isGlobalPanel]);
}

const _excluded = ["store"];
function LevaPanel(_ref) {
  let {
      store
    } = _ref,
    props = vectorPlugin._objectWithoutProperties(_ref, _excluded);
  const parentStore = vectorPlugin.useStoreContext();
  const _store = store === undefined ? parentStore : store;
  return React__default["default"].createElement(LevaRoot, vectorPlugin._extends({
    store: _store
  }, props));
}

function parseArgs(schemaOrFolderName, settingsOrDepsOrSchema, depsOrSettingsOrFolderSettings, depsOrSettings, depsOrUndefined) {
  let schema;
  let folderName = undefined;
  let folderSettings;
  let hookSettings;
  let deps;
  if (typeof schemaOrFolderName === 'string') {
    folderName = schemaOrFolderName;
    schema = settingsOrDepsOrSchema;
    if (Array.isArray(depsOrSettingsOrFolderSettings)) {
      deps = depsOrSettingsOrFolderSettings;
    } else {
      if (depsOrSettingsOrFolderSettings) {
        if ('store' in depsOrSettingsOrFolderSettings) {
          hookSettings = depsOrSettingsOrFolderSettings;
          deps = depsOrSettings;
        } else {
          folderSettings = depsOrSettingsOrFolderSettings;
          if (Array.isArray(depsOrSettings)) {
            deps = depsOrSettings;
          } else {
            hookSettings = depsOrSettings;
            deps = depsOrUndefined;
          }
        }
      }
    }
  } else {
    schema = schemaOrFolderName;
    if (Array.isArray(settingsOrDepsOrSchema)) {
      deps = settingsOrDepsOrSchema;
    } else {
      hookSettings = settingsOrDepsOrSchema;
      deps = depsOrSettingsOrFolderSettings;
    }
  }
  return {
    schema,
    folderName,
    folderSettings,
    hookSettings,
    deps: deps || []
  };
}

function useControls(schemaOrFolderName, settingsOrDepsOrSchema, depsOrSettingsOrFolderSettings, depsOrSettings, depsOrUndefined) {
  const {
    folderName,
    schema,
    folderSettings,
    hookSettings,
    deps
  } = parseArgs(schemaOrFolderName, settingsOrDepsOrSchema, depsOrSettingsOrFolderSettings, depsOrSettings, depsOrUndefined);
  const schemaIsFunction = typeof schema === 'function';

  const depsChanged = React.useRef(false);
  const firstRender = React.useRef(true);

  const _schema = useDeepMemo(() => {
    depsChanged.current = true;
    const s = typeof schema === 'function' ? schema() : schema;
    return folderName ? {
      [folderName]: folder(s, folderSettings)
    } : s;
  }, deps);

  const isGlobalPanel = !(hookSettings !== null && hookSettings !== void 0 && hookSettings.store);
  useRenderRoot(isGlobalPanel);
  const [store] = React.useState(() => (hookSettings === null || hookSettings === void 0 ? void 0 : hookSettings.store) || levaStore);

  const [initialData, mappedPaths] = React.useMemo(() => store.getDataFromSchema(_schema), [store, _schema]);
  const [allPaths, renderPaths, onChangePaths, onEditStartPaths, onEditEndPaths] = React.useMemo(() => {
    const allPaths = [];
    const renderPaths = [];
    const onChangePaths = {};
    const onEditStartPaths = {};
    const onEditEndPaths = {};
    Object.values(mappedPaths).forEach(({
      path,
      onChange,
      onEditStart,
      onEditEnd,
      transient
    }) => {
      allPaths.push(path);
      if (!!onChange) {
        onChangePaths[path] = onChange;
        if (!transient) {
          renderPaths.push(path);
        }
      } else {
        renderPaths.push(path);
      }
      if (onEditStart) {
        onEditStartPaths[path] = onEditStart;
      }
      if (onEditEnd) {
        onEditEndPaths[path] = onEditEnd;
      }
    });
    return [allPaths, renderPaths, onChangePaths, onEditStartPaths, onEditEndPaths];
  }, [mappedPaths]);

  const paths = React.useMemo(() => store.orderPaths(allPaths), [allPaths, store]);

  const values = useValuesForPath(store, renderPaths, initialData);
  const set = React.useCallback(values => {
    const _values = Object.entries(values).reduce((acc, [p, v]) => Object.assign(acc, {
      [mappedPaths[p].path]: v
    }), {});
    store.set(_values, false);
  }, [store, mappedPaths]);
  const get = React.useCallback(path => store.get(mappedPaths[path].path), [store, mappedPaths]);
  React.useEffect(() => {

    const shouldOverrideSettings = !firstRender.current && depsChanged.current;
    store.addData(initialData, shouldOverrideSettings);
    firstRender.current = false;
    depsChanged.current = false;
    return () => store.disposePaths(paths);
  }, [store, paths, initialData]);
  React.useEffect(() => {
    const unsubscriptions = [];
    Object.entries(onChangePaths).forEach(([path, onChange]) => {
      onChange(store.get(path), path, vectorPlugin._objectSpread2({
        initial: true,
        get: store.get
      }, store.getInput(path)));
      const unsub = store.useStore.subscribe(s => {
        const input = s.data[path];
        const value = input.disabled ? undefined : input.value;
        return [value, input];
      }, ([value, input]) => onChange(value, path, vectorPlugin._objectSpread2({
        initial: false,
        get: store.get
      }, input)), {
        equalityFn: shallow__default["default"]
      });
      unsubscriptions.push(unsub);
    });
    return () => unsubscriptions.forEach(unsub => unsub());
  }, [store, onChangePaths]);
  React.useEffect(() => {
    const unsubscriptions = [];
    Object.entries(onEditStartPaths).forEach(([path, onEditStart]) => unsubscriptions.push(store.subscribeToEditStart(path, onEditStart)));
    Object.entries(onEditEndPaths).forEach(([path, onEditEnd]) => unsubscriptions.push(store.subscribeToEditEnd(path, onEditEnd)));
    return () => unsubscriptions.forEach(unsub => unsub());
  }, [onEditStartPaths, onEditEndPaths, store]);
  if (schemaIsFunction) return [values, set, get];
  return values;
}

vectorPlugin.register(vectorPlugin.LevaInputs.SELECT, vectorPlugin.select);
vectorPlugin.register(vectorPlugin.LevaInputs.IMAGE, image);
vectorPlugin.register(vectorPlugin.LevaInputs.NUMBER, vectorPlugin.number);
vectorPlugin.register(vectorPlugin.LevaInputs.COLOR, color);
vectorPlugin.register(vectorPlugin.LevaInputs.STRING, vectorPlugin.string);
vectorPlugin.register(vectorPlugin.LevaInputs.BOOLEAN, vectorPlugin.boolean);
vectorPlugin.register(vectorPlugin.LevaInputs.INTERVAL, interval);
vectorPlugin.register(vectorPlugin.LevaInputs.VECTOR3D, vector3d);
vectorPlugin.register(vectorPlugin.LevaInputs.VECTOR2D, vector2d);

Object.defineProperty(exports, 'LevaInputs', {
  enumerable: true,
  get: function () { return vectorPlugin.LevaInputs; }
});
exports.LevaStoreProvider = vectorPlugin.LevaStoreProvider;
exports.useStoreContext = vectorPlugin.useStoreContext;
exports.Leva = Leva;
exports.LevaPanel = LevaPanel;
exports.button = button;
exports.buttonGroup = buttonGroup;
exports.folder = folder;
exports.levaStore = levaStore;
exports.monitor = monitor;
exports.useControls = useControls;
exports.useCreateStore = useCreateStore;
