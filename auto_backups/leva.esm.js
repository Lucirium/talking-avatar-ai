import { p as pick, _ as _objectSpread2, o as omit, s as styled, u as useInputContext, R as Row, L as Label, V as ValueInput, P as Portal, O as Overlay, c as createInternalPlugin, a as Vector, g as getVectorPlugin, b as useTransform, d as useTh, e as useDrag, f as _extends, m as multiplyStep, h as clamp, i as _objectWithoutProperties, n as normalizeKeyedNumberSettings, j as invertedRange, k as sanitizeStep, r as range, l as RangeWrapper, q as Range, I as Indicator, S as Scrubber, t as getUid, v as SpecialInputs, w as warn, x as LevaErreurs, y as updateInput, z as normalizeInput, A as useInputSetters, B as Plugins, C as InputContext, D as StyledInputWrapper, E as useStoreContext, F as useCanvas2d, G as useInput, H as log, J as StyledTitle, K as Chevron, M as StyledWrapper, N as StyledContent, Q as StyledFolder, T as StyledInputRow, U as debounce, W as globalStyles, X as PanelSettingsContext, Y as StoreContext, Z as mergeTheme, $ as ThemeContext, a0 as render, a1 as register, a2 as LevaInputs, a3 as select, a4 as number$1, a5 as string, a6 as boolean } from './vector-plugin-6f82aee9.esm.js';
export { a2 as LevaInputs, a7 as LevaStoreProvider, E as useStoreContext } from './vector-plugin-6f82aee9.esm.js';
import v8n from 'v8n';
import { extend, colord, getFormat } from 'colord';
import namesPlugin from 'colord/plugins/names';
import { dequal } from 'dequal/lite';
import 'react-dom';
import React, { useRef, useMemo, useLayoutEffect, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { RgbaColorPicker, RgbColorPicker } from 'react-colorful';
import shallow from 'zustand/shallow';
import '@use-gesture/react';
import '@radix-ui/react-portal';
import '@radix-ui/react-tooltip';
import { useDropzone } from 'react-dropzone';
import create from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import merge from 'merge-value';
import '@stitches/react';

const join = (...args) => args.filter(Boolean).join('.');
function getKeyPath(path) {
  const dir = path.split('.');
  return [dir.pop(), dir.join('.') || undefined];
}

function getValuesForPaths(data, paths) {
  return Object.entries(pick(data, paths)).reduce(

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
  const ref = useRef();
  const compare = deep ? dequal : shallow;
  if (!compare(value, ref.current)) {
    ref.current = value;
  }
  return ref.current;
}

function useDeepMemo(fn, deps) {
  return useMemo(fn, useCompareMemoize(deps, true));
}

function useToggle(toggled) {
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const firstRender = useRef(true);

  useLayoutEffect(() => {
    if (!toggled) {
      wrapperRef.current.style.height = '0px';
      wrapperRef.current.style.overflow = 'hidden';
    }
  }, []);
  useEffect(() => {
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
  const [paths, setPaths] = useState(store.getVisiblePaths());
  useEffect(() => {
    setPaths(store.getVisiblePaths());
    const unsub = store.useStore.subscribe(store.getVisiblePaths, setPaths, {
      equalityFn: shallow
    });
    return () => unsub();
  }, [store]);
  return paths;
};

function useValuesForPath(store, paths, initialData) {
  const valuesForPath = store.useStore(s => {
    const data = _objectSpread2(_objectSpread2({}, initialData), s.data);
    return getValuesForPaths(data, paths);
  }, shallow);
  return valuesForPath;
}

function usePopin(margin = 3) {
  const popinRef = useRef(null);
  const wrapperRef = useRef(null);
  const [shown, setShow] = useState(false);
  const show = useCallback(() => setShow(true), []);
  const hide = useCallback(() => setShow(false), []);
  useLayoutEffect(() => {
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

extend([namesPlugin]);
const convertMap = {
  rgb: 'toRgb',
  hsl: 'toHsl',
  hsv: 'toHsv',
  hex: 'toHex'
};
v8n.extend({
  color: () => value => colord(value).isValid()
});
const schema$2 = o => v8n().color().test(o);
function convert(color, {
  format,
  hasAlpha,
  isString
}) {
  const convertFn = convertMap[format] + (isString && format !== 'hex' ? 'String' : '');
  const result = color[convertFn]();
  return typeof result === 'object' && !hasAlpha ? omit(result, ['a']) : result;
}
const sanitize$2 = (v, settings) => {
  const color = colord(v);
  if (!color.isValid()) throw Erreur('Invalid color');
  return convert(color, settings);
};
const format$1 = (v, settings) => {
  return convert(colord(v), _objectSpread2(_objectSpread2({}, settings), {}, {
    isString: true,
    format: 'hex'
  }));
};
const normalize$3 = ({
  value
}) => {
  const _f = getFormat(value);
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

const ColorPreview = styled('div', {
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
const PickerContainer = styled('div', {
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: '$sizes$rowHeight auto',
  columnGap: '$colGap',
  alignItems: 'center'
});
const PickerWrapper = styled('div', {
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
  return format !== 'rgb' ? colord(value).toRgb() : value;
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
  } = useInputContext();
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

  const timer = useRef(0);

  const [initialRgb, setInitialRgb] = useState(() => convertToRgb(value, format));
  const ColorPicker = hasAlpha ? RgbaColorPicker : RgbColorPicker;
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
  useEffect(() => {
    return () => window.clearTimeout(timer.current);
  }, []);
  return React.createElement(React.Fragment, null, React.createElement(ColorPreview, {
    ref: popinRef,
    active: shown,
    onClick: () => showPicker(),
    style: {
      color: displayValue
    }
  }), shown && React.createElement(Portal, null, React.createElement(Overlay, {
    onPointerUp: hidePicker
  }), React.createElement(PickerWrapper, {
    ref: wrapperRef,
    onMouseEnter: () => window.clearTimeout(timer.current),
    onMouseLeave: e => e.buttons === 0 && hideAfterDelay()
  }, React.createElement(ColorPicker, {
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
  } = useInputContext();
  return React.createElement(Row, {
    input: true
  }, React.createElement(Label, null, label), React.createElement(PickerContainer, null, React.createElement(Color, {
    value: value,
    displayValue: displayValue,
    onChange: onChange,
    onUpdate: onUpdate,
    settings: settings
  }), React.createElement(ValueInput, {
    value: displayValue,
    onChange: onChange,
    onUpdate: onUpdate
  })));
}

var color = createInternalPlugin(_objectSpread2({
  component: ColorComponent
}, props$2));

function Vector3dComponent() {
  const {
    label,
    displayValue,
    onUpdate,
    settings
  } = useInputContext();
  return React.createElement(Row, {
    input: true
  }, React.createElement(Label, null, label), React.createElement(Vector, {
    value: displayValue,
    settings: settings,
    onUpdate: onUpdate
  }));
}

var vector3d = createInternalPlugin(_objectSpread2({
  component: Vector3dComponent
}, getVectorPlugin(['x', 'y', 'z'])));

const JoystickTrigger = styled('div', {
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
const JoystickPlayground = styled('div', {
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
  const timeout = useRef();
  const outOfBoundsX = useRef(0);
  const outOfBoundsY = useRef(0);
  const stepMultiplier = useRef(1);
  const [joystickShown, setShowJoystick] = useState(false);
  const [isOutOfBounds, setIsOutOfBounds] = useState(false);
  const [spanRef, set] = useTransform();
  const joystickeRef = useRef(null);
  const playgroundRef = useRef(null);
  useLayoutEffect(() => {
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
  const wpx = useTh('sizes', 'joystickWidth');
  const hpx = useTh('sizes', 'joystickHeight');
  const w = parseFloat(wpx) * 0.8 / 2;
  const h = parseFloat(hpx) * 0.8 / 2;
  const startOutOfBounds = useCallback(() => {
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
  const endOutOfBounds = useCallback(() => {
    window.clearTimeout(timeout.current);
    timeout.current = undefined;
    setIsOutOfBounds(false);
  }, []);
  useEffect(() => {
    function setStepMultiplier(event) {
      stepMultiplier.current = multiplyStep(event);
    }
    window.addEventListener('keydown', setStepMultiplier);
    window.addEventListener('keyup', setStepMultiplier);
    return () => {
      window.clearTimeout(timeout.current);
      window.removeEventListener('keydown', setStepMultiplier);
      window.removeEventListener('keyup', setStepMultiplier);
    };
  }, []);
  const bind = useDrag(({
    first,
    active,
    delta: [dx, dy],
    movement: [mx, my]
  }) => {
    if (first) setShowJoystick(true);
    const _x = clamp(mx, -w, w);
    const _y = clamp(my, -h, h);
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
  return React.createElement(JoystickTrigger, _extends({
    ref: joystickeRef
  }, bind()), joystickShown && React.createElement(Portal, null, React.createElement(JoystickPlayground, {
    ref: playgroundRef,
    isOutOfBounds: isOutOfBounds
  }, React.createElement("div", null), React.createElement("span", {
    ref: spanRef
  }))));
}

const Container$1 = styled('div', {
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
  } = useInputContext();
  return React.createElement(Row, {
    input: true
  }, React.createElement(Label, null, label), React.createElement(Container$1, {
    withJoystick: !!settings.joystick
  }, settings.joystick && React.createElement(Joystick, {
    value: displayValue,
    settings: settings,
    onUpdate: onUpdate
  }), React.createElement(Vector, {
    value: displayValue,
    settings: settings,
    onUpdate: onUpdate
  })));
}

const _excluded$7 = ["joystick"];
const plugin = getVectorPlugin(['x', 'y']);
const normalize$2 = _ref => {
  let {
      joystick = true
    } = _ref,
    input = _objectWithoutProperties(_ref, _excluded$7);
  const {
    value,
    settings
  } = plugin.normalize(input);
  return {
    value,
    settings: _objectSpread2(_objectSpread2({}, settings), {}, {
      joystick
    })
  };
};
var vector2d = createInternalPlugin(_objectSpread2(_objectSpread2({
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

const ImageContainer = styled('div', {
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: '$sizes$rowHeight auto 20px',
  columnGap: '$colGap',
  alignItems: 'center'
});
const DropZone = styled('div', {
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
const ImagePreview = styled('div', {
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
const ImageLargePreview = styled('div', {
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
const Instructions = styled('div', {
  fontSize: '0.8em',
  height: '100%',
  padding: '$rowGap $md'
});
const Remove = styled('div', {
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
  } = useInputContext();
  const {
    popinRef,
    wrapperRef,
    shown,
    show,
    hide
  } = usePopin();
  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length) onUpdate(acceptedFiles[0]);
  }, [onUpdate]);
  const clear = useCallback(e => {
    e.stopPropagation();
    onUpdate(undefined);
  }, [onUpdate]);
  const {
    getRootProps,
    getInputProps,
    isDragAccept
  } = useDropzone({
    maxFiles: 1,
    accept: 'image/*',
    onDrop,
    disabled
  });

  return React.createElement(Row, {
    input: true
  }, React.createElement(Label, null, label), React.createElement(ImageContainer, null, React.createElement(ImagePreview, {
    ref: popinRef,
    hasImage: !!value,
    onPointerDown: () => !!value && show(),
    onPointerUp: hide,
    style: {
      backgroundImage: value ? `url(${value})` : 'none'
    }
  }), shown && !!value && React.createElement(Portal, null, React.createElement(Overlay, {
    onPointerUp: hide,
    style: {
      cursor: 'pointer'
    }
  }), React.createElement(ImageLargePreview, {
    ref: wrapperRef,
    style: {
      backgroundImage: `url(${value})`
    }
  })), React.createElement(DropZone, getRootProps({
    isDragAccept
  }), React.createElement("input", getInputProps()), React.createElement(Instructions, null, isDragAccept ? 'drop image' : 'click or drop')), React.createElement(Remove, {
    onClick: clear,
    disabled: !value
  })));
}

var image = createInternalPlugin(_objectSpread2({
  component: ImageComponent
}, props$1));

const number = v8n().number();
const schema = (o, s) => v8n().array().length(2).every.number().test(o) && v8n().schema({
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
  } = _objectSpread2(_objectSpread2({}, _newValue), _value);
  return [clamp(Number(min), MIN, Math.max(MIN, max)), clamp(Number(max), Math.min(MAX, min), MAX)];
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
  const _settings = normalizeKeyedNumberSettings(format(value), {
    min: boundsSettings,
    max: boundsSettings
  });
  const bounds = [min, max];
  const settings = _objectSpread2(_objectSpread2({}, _settings), {}, {
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
const Container = styled('div', {
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
    settings = _objectWithoutProperties(_ref, _excluded$6);
  const ref = useRef(null);
  const minScrubberRef = useRef(null);
  const maxScrubberRef = useRef(null);
  const rangeWidth = useRef(0);
  const scrubberWidth = useTh('sizes', 'scrubberWidth');
  const bind = useDrag(({
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
      _memo.pos = invertedRange((x - left) / width, min, max);
      const delta = Math.abs(_memo.pos - value.min) - Math.abs(_memo.pos - value.max);
      _memo.key = delta < 0 || delta === 0 && _memo.pos <= value.min ? 'min' : 'max';
      if (targetIsScrub) _memo.pos = value[_memo.key];
    }
    const newValue = _memo.pos + invertedRange(mx / rangeWidth.current, 0, max - min);
    onDrag({
      [_memo.key]: sanitizeStep(newValue, settings[_memo.key])
    });
    return _memo;
  });
  const minStyle = `calc(${range(value.min, min, max)} * (100% - ${scrubberWidth} - 8px) + 4px)`;
  const maxStyle = `calc(${1 - range(value.max, min, max)} * (100% - ${scrubberWidth} - 8px) + 4px)`;
  return React.createElement(RangeWrapper, _extends({
    ref: ref
  }, bind()), React.createElement(Range, null, React.createElement(Indicator, {
    style: {
      left: minStyle,
      right: maxStyle
    }
  })), React.createElement(Scrubber, {
    position: "left",
    ref: minScrubberRef,
    style: {
      left: minStyle
    }
  }), React.createElement(Scrubber, {
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
  } = useInputContext();
  const _settings = _objectWithoutProperties(settings, _excluded2$1);
  return React.createElement(React.Fragment, null, React.createElement(Row, {
    input: true
  }, React.createElement(Label, null, label), React.createElement(Container, null, React.createElement(IntervalSlider, _extends({
    value: displayValue
  }, settings, {
    onDrag: onUpdate
  })), React.createElement(Vector, {
    value: displayValue,
    settings: _settings,
    onUpdate: onUpdate,
    innerLabelTrim: 0
  }))));
}

var interval = createInternalPlugin(_objectSpread2({
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
  const store = create(subscribeWithSelector(() => ({
    data: {}
  })));
  const eventEmitter = createEventEmitter();
  this.storeId = getUid();
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
          if (input.__refCount === 0 && input.type in SpecialInputs) {
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
            rest = _objectWithoutProperties(newInputData, _excluded$5);
          if (type !== input.type) {
            warn(LevaErreurs.INPUT_TYPE_OVERRIDE, type);
          } else {
            if (input.__refCount === 0 || override) {
              Object.assign(input, rest);
            }
            input.__refCount++;
          }
        } else {
          data[path] = _objectSpread2(_objectSpread2({}, newInputData), {}, {
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
      updateInput(data[path], value, path, this, fromPanel);
      return {
        data
      };
    });
  };
  this.setSettingsAtPath = (path, settings) => {
    store.setState(s => {
      const data = s.data;
      data[path].settings = _objectSpread2(_objectSpread2({}, data[path].settings), settings);
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
          updateInput(data[path], value, undefined, undefined, fromPanel);
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
      warn(LevaErreurs.PATH_DOESNT_EXIST, path);
    }
  };
  this.get = path => {
    var _this$getInput;
    return (_this$getInput = this.getInput(path)) === null || _this$getInput === void 0 ? void 0 : _this$getInput.value;
  };
  this.emitOnEditStart = path => {
    eventEmitter.emit(`onEditStart:${path}`, this.get(path), path, _objectSpread2(_objectSpread2({}, this.getInput(path)), {}, {
      get: this.get
    }));
  };
  this.emitOnEditEnd = path => {
    eventEmitter.emit(`onEditEnd:${path}`, this.get(path), path, _objectSpread2(_objectSpread2({}, this.getInput(path)), {}, {
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
      if (key === '') return warn(LevaErreurs.EMPTY_KEY);
      let newPath = join(rootPath, key);

      if (rawInput.type === SpecialInputs.FOLDER) {
        const newData = _getDataFromSchema(rawInput.schema, newPath, mappedPaths);
        Object.assign(data, newData);

        if (!(newPath in folders)) folders[newPath] = rawInput.settings;
      } else if (key in mappedPaths) {
        warn(LevaErreurs.DUPLICATE_KEYS, key, newPath, mappedPaths[key].path);
      } else {
        const normalizedInput = normalizeInput(rawInput, key, newPath, data);
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
            _options = _objectWithoutProperties(options, _excluded2);
          data[newPath] = _objectSpread2(_objectSpread2(_objectSpread2({
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
          warn(LevaErreurs.UNKNOWN_INPUT, newPath, rawInput);
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
  return useMemo(() => new Store(), []);
}
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.__STORE = levaStore;
}

const defaultSettings$2 = {
  collapsed: false
};
function folder(schema, settings) {
  return {
    type: SpecialInputs.FOLDER,
    schema,
    settings: _objectSpread2(_objectSpread2({}, defaultSettings$2), settings)
  };
}

const defaultSettings$1 = {
  disabled: false
};

function button(onClick, settings) {
  return {
    type: SpecialInputs.BUTTON,
    onClick,
    settings: _objectSpread2(_objectSpread2({}, defaultSettings$1), settings)
  };
}

function buttonGroup(opts) {
  return {
    type: SpecialInputs.BUTTON_GROUP,
    opts
  };
}

const defaultSettings = {
  graph: false,
  interval: 100
};
function monitor(objectOrFn, settings) {
  return {
    type: SpecialInputs.MONITOR,
    objectOrFn,
    settings: _objectSpread2(_objectSpread2({}, defaultSettings), settings)
  };
}

const isInput = v => '__levaInput' in v;
const buildTree = (paths, filter) => {
  const tree = {};
  const _filter = filter ? filter.toLowerCase() : null;
  paths.forEach(path => {
    const [valueKey, folderPath] = getKeyPath(path);
    if (!_filter || valueKey.toLowerCase().indexOf(_filter) > -1) {
      merge(tree, folderPath, {
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
    rest = _objectWithoutProperties(_ref, _excluded$4);
  const {
    displayValue,
    onChange,
    onUpdate
  } = useInputSetters({
    type,
    value,
    settings,
    setValue
  });
  const Input = Plugins[type].component;
  if (!Input) {
    warn(LevaErreurs.NO_COMPONENT_FOR_TYPE, type, path);
    return null;
  }
  return React.createElement(InputContext.Provider, {
    value: _objectSpread2({
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
  }, React.createElement(StyledInputWrapper, {
    disabled: disabled
  }, React.createElement(Input, null)));
}

const StyledButton = styled('button', {
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
  const store = useStoreContext();
  return React.createElement(Row, null, React.createElement(StyledButton, {
    disabled: settings.disabled,
    onClick: () => onClick(store.get)
  }, label));
}

const StyledButtonGroup = styled('div', {
  $flex: '',
  justifyContent: 'flex-end',
  gap: '$colGap'
});

const StyledButtonGroupButton = styled('button', {
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
  const store = useStoreContext();
  return React.createElement(Row, {
    input: !!label
  }, label && React.createElement(Label, null, label), React.createElement(StyledButtonGroup, null, Object.entries(opts).map(([label, onClick]) => React.createElement(StyledButtonGroupButton, {
    key: label,
    onClick: () => onClick(store.get)
  }, label))));
}

const Canvas = styled('canvas', {
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
const MonitorCanvas = forwardRef(function ({
  initialValue
}, ref) {
  const accentColor = useTh('colors', 'highlight3');
  const backgroundColor = useTh('colors', 'elevation2');
  const fillColor = useTh('colors', 'highlight1');
  const [gradientTop, gradientBottom] = useMemo(() => {
    return [colord(fillColor).alpha(0.4).toRgbString(), colord(fillColor).alpha(0.1).toRgbString()];
  }, [fillColor]);
  const points = useRef([initialValue]);
  const min = useRef(initialValue);
  const max = useRef(initialValue);
  const raf = useRef();
  const drawPlot = useCallback((_canvas, _ctx) => {
    if (!_canvas) return;
    const {
      width,
      height
    } = _canvas;

    const path = new Path2D();
    const interval = width / POINTS;
    const verticalPadding = height * 0.05;
    for (let i = 0; i < points.current.length; i++) {
      const p = range(points.current[i], min.current, max.current);
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
  const [canvas, ctx] = useCanvas2d(drawPlot);
  useImperativeHandle(ref, () => ({
    frame: val => {
      if (min.current === undefined || val < min.current) min.current = val;
      if (max.current === undefined || val > max.current) max.current = val;
      push(points.current, val);
      raf.current = requestAnimationFrame(() => drawPlot(canvas.current, ctx.current));
    }
  }), [canvas, ctx, drawPlot]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return React.createElement(Canvas, {
    ref: canvas
  });
});
const parse = val => Number.isFinite(val) ? val.toPrecision(2) : val.toString();
const MonitorLog = forwardRef(function ({
  initialValue
}, ref) {
  const [val, set] = useState(parse(initialValue));
  useImperativeHandle(ref, () => ({
    frame: v => set(parse(v))
  }), []);
  return React.createElement("div", null, val);
});
function getValue(o) {
  return typeof o === 'function' ? o() : o.current;
}
function Monitor({
  label,
  objectOrFn,
  settings
}) {
  const ref = useRef();
  const initialValue = useRef(getValue(objectOrFn));
  useEffect(() => {
    const timeout = window.setInterval(() => {
      var _ref$current;
      if (document.hidden) return;
      (_ref$current = ref.current) === null || _ref$current === void 0 ? void 0 : _ref$current.frame(getValue(objectOrFn));
    }, settings.interval);
    return () => window.clearInterval(timeout);
  }, [objectOrFn, settings.interval]);
  return React.createElement(Row, {
    input: true
  }, React.createElement(Label, {
    align: "top"
  }, label), settings.graph ? React.createElement(MonitorCanvas, {
    ref: ref,
    initialValue: initialValue.current
  }) : React.createElement(MonitorLog, {
    ref: ref,
    initialValue: initialValue.current
  }));
}

const _excluded$3 = ["type", "label", "key"];
const specialComponents = {
  [SpecialInputs.BUTTON]: Button,
  [SpecialInputs.BUTTON_GROUP]: ButtonGroup,
  [SpecialInputs.MONITOR]: Monitor
};
const Control = React.memo(({
  path
}) => {
  const [input, {
    set,
    setSettings,
    disable,
    storeId,
    emitOnEditStart,
    emitOnEditEnd
  }] = useInput(path);
  if (!input) return null;
  const {
      type,
      label,
      key
    } = input,
    inputProps = _objectWithoutProperties(input, _excluded$3);
  if (type in SpecialInputs) {
    const SpecialInputForType = specialComponents[type];
    return React.createElement(SpecialInputForType, _extends({
      label: label,
      path: path
    }, inputProps));
  }
  if (!(type in Plugins)) {
    log(LevaErreurs.UNSUPPORTED_INPUT, type, path);
    return null;
  }
  return React.createElement(ControlInput, _extends({
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
  return React.createElement(StyledTitle, {
    onClick: () => toggle()
  }, React.createElement(Chevron, {
    toggled: toggled
  }), React.createElement("div", null, name));
}

const Folder = ({
  name,
  path,
  tree
}) => {
  const store = useStoreContext();
  const newPath = join(path, name);
  const {
    collapsed,
    color
  } = store.getFolderSettings(newPath);
  const [toggled, setToggle] = useState(!collapsed);
  const folderRef = useRef(null);
  const widgetColor = useTh('colors', 'folderWidgetColor');
  const textColor = useTh('colors', 'folderTextColor');
  useLayoutEffect(() => {
    folderRef.current.style.setProperty('--leva-colors-folderWidgetColor', color || widgetColor);
    folderRef.current.style.setProperty('--leva-colors-folderTextColor', color || textColor);
  }, [color, widgetColor, textColor]);
  return React.createElement(StyledFolder, {
    ref: folderRef
  }, React.createElement(FolderTitle, {
    name: name,
    toggled: toggled,
    toggle: () => setToggle(t => !t)
  }), React.createElement(TreeWrapper, {
    parent: newPath,
    tree: tree,
    toggled: toggled
  }));
};
const TreeWrapper = React.memo(({
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
  const store = useStoreContext();
  const getOrder = ([key, o]) => {
    var _store$getInput;
    const order = isInput(o) ? (_store$getInput = store.getInput(o.path)) === null || _store$getInput === void 0 ? void 0 : _store$getInput.order : store.getFolderSettings(join(parent, key)).order;
    return order || 0;
  };
  const entries = Object.entries(tree).sort((a, b) => getOrder(a) - getOrder(b));
  return React.createElement(StyledWrapper, {
    ref: wrapperRef,
    isRoot: _isRoot,
    fill: _fill,
    flat: _flat
  }, React.createElement(StyledContent, {
    ref: contentRef,
    isRoot: _isRoot,
    toggled: toggled
  }, entries.map(([key, value]) => isInput(value) ? React.createElement(Control, {
    key: value.path,
    valueKey: value.valueKey,
    path: value.path
  }) : React.createElement(Folder, {
    key: key,
    name: key,
    path: parent,
    tree: value
  }))));
});

const StyledRoot = styled('div', {
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
        [`${StyledInputRow}`]: {
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
const Icon = styled('i', {
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
const StyledTitleWithFilter = styled('div', {
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
const FilterWrapper = styled('div', {
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
const StyledFilterInput = styled('input', {
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
const TitleContainer = styled('div', {
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

const FilterInput = React.forwardRef(({
  setFilter,
  toggle
}, ref) => {
  const [value, set] = useState('');
  const debouncedOnChange = useMemo(() => debounce(setFilter, 250), [setFilter]);
  const clear = () => {
    setFilter('');
    set('');
  };
  const _onChange = e => {
    const v = e.currentTarget.value;
    toggle(true);
    set(v);
  };
  useEffect(() => {
    debouncedOnChange(value);
  }, [value, debouncedOnChange]);
  return React.createElement(React.Fragment, null, React.createElement(StyledFilterInput, {
    ref: ref,
    value: value,
    placeholder: "[Open filter with CMD+SHIFT+L]",
    onPointerDown: e => e.stopPropagation(),
    onChange: _onChange
  }), React.createElement(Icon, {
    onClick: () => clear(),
    style: {
      visibility: value ? 'visible' : 'hidden'
    }
  }, React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    height: "14",
    width: "14",
    viewBox: "0 0 20 20",
    fill: "currentColor"
  }, React.createElement("path", {
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
  const [filterShown, setShowFilter] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => {
    var _inputRef$current, _inputRef$current2;
    if (filterShown) (_inputRef$current = inputRef.current) === null || _inputRef$current === void 0 ? void 0 : _inputRef$current.focus();else (_inputRef$current2 = inputRef.current) === null || _inputRef$current2 === void 0 ? void 0 : _inputRef$current2.blur();
  }, [filterShown]);
  const bind = useDrag(({
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
  useEffect(() => {
    const handleShortcut = event => {
      if (event.key === 'L' && event.shiftKey && event.metaKey) {
        setShowFilter(f => !f);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);
  return React.createElement(React.Fragment, null, React.createElement(StyledTitleWithFilter, {
    mode: drag ? 'drag' : undefined
  }, React.createElement(Icon, {
    active: !toggled,
    onClick: () => toggle()
  }, React.createElement(Chevron, {
    toggled: toggled,
    width: 12,
    height: 8
  })), React.createElement(TitleContainer, _extends({}, drag ? bind() : {}, {
    drag: drag,
    filterEnabled: filterEnabled
  }), title === undefined && drag ? React.createElement("svg", {
    width: "20",
    height: "10",
    viewBox: "0 0 28 14",
    xmlns: "http://www.w3.org/2000/svg"
  }, React.createElement("circle", {
    cx: "2",
    cy: "2",
    r: "2"
  }), React.createElement("circle", {
    cx: "14",
    cy: "2",
    r: "2"
  }), React.createElement("circle", {
    cx: "26",
    cy: "2",
    r: "2"
  }), React.createElement("circle", {
    cx: "2",
    cy: "12",
    r: "2"
  }), React.createElement("circle", {
    cx: "14",
    cy: "12",
    r: "2"
  }), React.createElement("circle", {
    cx: "26",
    cy: "12",
    r: "2"
  })) : title), filterEnabled && React.createElement(Icon, {
    active: filterShown,
    onClick: () => setShowFilter(f => !f)
  }, React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    height: "20",
    viewBox: "0 0 20 20"
  }, React.createElement("path", {
    d: "M9 9a2 2 0 114 0 2 2 0 01-4 0z"
  }), React.createElement("path", {
    fillRule: "evenodd",
    d: "M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z",
    clipRule: "evenodd"
  })))), React.createElement(FilterWrapper, {
    toggled: filterShown
  }, React.createElement(FilterInput, {
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
    props = _objectWithoutProperties(_ref, _excluded$2);
  const themeContext = useDeepMemo(() => mergeTheme(theme), [theme]);
  const [toggled, setToggle] = useState(!collapsed);
  const computedToggled = typeof collapsed === 'object' ? !collapsed.collapsed : toggled;
  const computedSetToggle = useMemo(() => {
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
  return React.createElement(ThemeContext.Provider, {
    value: themeContext
  }, React.createElement(LevaCore, _extends({
    store: store
  }, props, {
    toggled: computedToggled,
    setToggle: computedSetToggle,
    rootClass: themeContext.className
  })));
}
const LevaCore = React.memo(({
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
  const [filter, setFilter] = useState('');
  const tree = useMemo(() => buildTree(paths, filter), [paths, filter]);

  const [rootRef, set] = useTransform();

  const shouldShow = _neverHide || paths.length > 0;
  const title = typeof _titleBar === 'object' ? _titleBar.title || undefined : undefined;
  const drag = typeof _titleBar === 'object' ? (_titleBar$drag = _titleBar.drag) !== null && _titleBar$drag !== void 0 ? _titleBar$drag : true : true;
  const filterEnabled = typeof _titleBar === 'object' ? (_titleBar$filter = _titleBar.filter) !== null && _titleBar$filter !== void 0 ? _titleBar$filter : true : true;
  const position = typeof _titleBar === 'object' ? _titleBar.position || undefined : undefined;
  const onDrag = typeof _titleBar === 'object' ? _titleBar.onDrag || undefined : undefined;
  const onDragStart = typeof _titleBar === 'object' ? _titleBar.onDragStart || undefined : undefined;
  const onDragEnd = typeof _titleBar === 'object' ? _titleBar.onDragEnd || undefined : undefined;
  React.useEffect(() => {
    set({
      x: position === null || position === void 0 ? void 0 : position.x,
      y: position === null || position === void 0 ? void 0 : position.y
    });
  }, [position, set]);
  globalStyles();
  return React.createElement(PanelSettingsContext.Provider, {
    value: {
      hideCopyButton: _hideCopyButton
    }
  }, React.createElement(StyledRoot, {
    ref: rootRef,
    className: rootClass,
    fill: _fill,
    flat: _flat,
    oneLineLabels: _oneLineLabels,
    hideTitleBar: !_titleBar,
    style: {
      display: shouldShow ? 'block' : 'none'
    }
  }, _titleBar && React.createElement(TitleWithFilter, {
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
  }), shouldShow && React.createElement(StoreContext.Provider, {
    value: store
  }, React.createElement(TreeWrapper, {
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
    props = _objectWithoutProperties(_ref, _excluded$1);
  useEffect(() => {
    rootInitialized = true;
    if (!isRoot && rootEl) {
      rootEl.remove();
      rootEl = null;
    }
    return () => {
      if (!isRoot) rootInitialized = false;
    };
  }, [isRoot]);
  return React.createElement(LevaRoot, _extends({
    store: levaStore
  }, props));
}

function useRenderRoot(isGlobalPanel) {
  useEffect(() => {
    if (isGlobalPanel && !rootInitialized) {
      if (!rootEl) {
        rootEl = document.getElementById('leva__root') || Object.assign(document.createElement('div'), {
          id: 'leva__root'
        });
        if (document.body) {
          document.body.appendChild(rootEl);
          render(React.createElement(Leva, {
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
    props = _objectWithoutProperties(_ref, _excluded);
  const parentStore = useStoreContext();
  const _store = store === undefined ? parentStore : store;
  return React.createElement(LevaRoot, _extends({
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

  const depsChanged = useRef(false);
  const firstRender = useRef(true);

  const _schema = useDeepMemo(() => {
    depsChanged.current = true;
    const s = typeof schema === 'function' ? schema() : schema;
    return folderName ? {
      [folderName]: folder(s, folderSettings)
    } : s;
  }, deps);

  const isGlobalPanel = !(hookSettings !== null && hookSettings !== void 0 && hookSettings.store);
  useRenderRoot(isGlobalPanel);
  const [store] = useState(() => (hookSettings === null || hookSettings === void 0 ? void 0 : hookSettings.store) || levaStore);

  const [initialData, mappedPaths] = useMemo(() => store.getDataFromSchema(_schema), [store, _schema]);
  const [allPaths, renderPaths, onChangePaths, onEditStartPaths, onEditEndPaths] = useMemo(() => {
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

  const paths = useMemo(() => store.orderPaths(allPaths), [allPaths, store]);

  const values = useValuesForPath(store, renderPaths, initialData);
  const set = useCallback(values => {
    const _values = Object.entries(values).reduce((acc, [p, v]) => Object.assign(acc, {
      [mappedPaths[p].path]: v
    }), {});
    store.set(_values, false);
  }, [store, mappedPaths]);
  const get = useCallback(path => store.get(mappedPaths[path].path), [store, mappedPaths]);
  useEffect(() => {

    const shouldOverrideSettings = !firstRender.current && depsChanged.current;
    store.addData(initialData, shouldOverrideSettings);
    firstRender.current = false;
    depsChanged.current = false;
    return () => store.disposePaths(paths);
  }, [store, paths, initialData]);
  useEffect(() => {
    const unsubscriptions = [];
    Object.entries(onChangePaths).forEach(([path, onChange]) => {
      onChange(store.get(path), path, _objectSpread2({
        initial: true,
        get: store.get
      }, store.getInput(path)));
      const unsub = store.useStore.subscribe(s => {
        const input = s.data[path];
        const value = input.disabled ? undefined : input.value;
        return [value, input];
      }, ([value, input]) => onChange(value, path, _objectSpread2({
        initial: false,
        get: store.get
      }, input)), {
        equalityFn: shallow
      });
      unsubscriptions.push(unsub);
    });
    return () => unsubscriptions.forEach(unsub => unsub());
  }, [store, onChangePaths]);
  useEffect(() => {
    const unsubscriptions = [];
    Object.entries(onEditStartPaths).forEach(([path, onEditStart]) => unsubscriptions.push(store.subscribeToEditStart(path, onEditStart)));
    Object.entries(onEditEndPaths).forEach(([path, onEditEnd]) => unsubscriptions.push(store.subscribeToEditEnd(path, onEditEnd)));
    return () => unsubscriptions.forEach(unsub => unsub());
  }, [onEditStartPaths, onEditEndPaths, store]);
  if (schemaIsFunction) return [values, set, get];
  return values;
}

register(LevaInputs.SELECT, select);
register(LevaInputs.IMAGE, image);
register(LevaInputs.NUMBER, number$1);
register(LevaInputs.COLOR, color);
register(LevaInputs.STRING, string);
register(LevaInputs.BOOLEAN, boolean);
register(LevaInputs.INTERVAL, interval);
register(LevaInputs.VECTOR3D, vector3d);
register(LevaInputs.VECTOR2D, vector2d);

export { Leva, LevaPanel, button, buttonGroup, folder, levaStore, monitor, useControls, useCreateStore };
