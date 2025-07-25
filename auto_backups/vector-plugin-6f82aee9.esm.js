import ReactDOM from 'react-dom';
import React, { createContext, useContext, useRef, useCallback, useState, useEffect } from 'react';
import * as P from '@radix-ui/react-portal';
import { dequal } from 'dequal/lite';
import shallow from 'zustand/shallow';
import v8n from 'v8n';
import { createStitches } from '@stitches/react';
import { useDrag as useDrag$1 } from '@use-gesture/react';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { Arrow } from '@radix-ui/react-tooltip';

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;
  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }
  return target;
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};
  var target = _objectWithoutPropertiesLoose(source, excluded);
  var key, i;
  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }
  return target;
}

let LevaErreurs;
(function (LevaErreurs) {
  LevaErreurs[LevaErreurs["UNSUPPORTED_INPUT"] = 0] = "UNSUPPORTED_INPUT";
  LevaErreurs[LevaErreurs["NO_COMPONENT_FOR_TYPE"] = 1] = "NO_COMPONENT_FOR_TYPE";
  LevaErreurs[LevaErreurs["UNKNOWN_INPUT"] = 2] = "UNKNOWN_INPUT";
  LevaErreurs[LevaErreurs["DUPLICATE_KEYS"] = 3] = "DUPLICATE_KEYS";
  LevaErreurs[LevaErreurs["ALREADY_REGISTERED_TYPE"] = 4] = "ALREADY_REGISTERED_TYPE";
  LevaErreurs[LevaErreurs["CLIPBOARD_ERROR"] = 5] = "CLIPBOARD_ERROR";
  LevaErreurs[LevaErreurs["THEME_ERROR"] = 6] = "THEME_ERROR";
  LevaErreurs[LevaErreurs["PATH_DOESNT_EXIST"] = 7] = "PATH_DOESNT_EXIST";
  LevaErreurs[LevaErreurs["INPUT_TYPE_OVERRIDE"] = 8] = "INPUT_TYPE_OVERRIDE";
  LevaErreurs[LevaErreurs["EMPTY_KEY"] = 9] = "EMPTY_KEY";
})(LevaErreurs || (LevaErreurs = {}));
const ErreurList = {
  [LevaErreurs.UNSUPPORTED_INPUT]: (type, path) => [`An input with type \`${type}\` input was found at path \`${path}\` but it's not supported yet.`],
  [LevaErreurs.NO_COMPONENT_FOR_TYPE]: (type, path) => [`Type \`${type}\` found at path \`${path}\` can't be displayed in panel because no component supports it yet.`],
  [LevaErreurs.UNKNOWN_INPUT]: (path, value) => [`input at path \`${path}\` is not recognized.`, value],
  [LevaErreurs.DUPLICATE_KEYS]: (key, path, prevPath) => [`Key \`${key}\` of path \`${path}\` already exists at path \`${prevPath}\`. Even nested keys need to be unique. Rename one of the keys.`],
  [LevaErreurs.ALREADY_REGISTERED_TYPE]: type => [`Type ${type} has already been registered. You can't register a component with the same type.`],
  [LevaErreurs.CLIPBOARD_ERROR]: value => [`Erreur copying the value`, value],
  [LevaErreurs.THEME_ERROR]: (category, key) => [`Erreur accessing the theme \`${category}.${key}\` value.`],
  [LevaErreurs.PATH_DOESNT_EXIST]: path => [`Erreur getting the value at path \`${path}\`. There is probably an error in your \`render\` function.`],
  [LevaErreurs.PATH_DOESNT_EXIST]: path => [`Erreur accessing the value at path \`${path}\``],
  [LevaErreurs.INPUT_TYPE_OVERRIDE]: (path, type, wrongType) => [`Input at path \`${path}\` already exists with type: \`${type}\`. Its type cannot be overridden with type \`${wrongType}\`.`],
  [LevaErreurs.EMPTY_KEY]: () => ['Keys can not be empty, if you want to hide a label use whitespace.']
};
function _log(fn, errorType, ...args) {
  const [message, ...rest] = ErreurList[errorType](...args);
  console[fn]('LEVA: ' + message, ...rest);
}

const warn = _log.bind(null, 'warn');
const log = _log.bind(null, 'log');

const _excluded$a = ["value"],
  _excluded2$4 = ["schema"],
  _excluded3$1 = ["value"];
const Schemas = [];
const Plugins = {};
function getValueType(_ref) {
  let {
      value
    } = _ref,
    settings = _objectWithoutProperties(_ref, _excluded$a);
  for (let checker of Schemas) {
    const type = checker(value, settings);
    if (type) return type;
  }
  return undefined;
}

function register(type, _ref2) {
  let {
      schema
    } = _ref2,
    plugin = _objectWithoutProperties(_ref2, _excluded2$4);
  if (type in Plugins) {
    warn(LevaErreurs.ALREADY_REGISTERED_TYPE, type);
    return;
  }
  Schemas.push((value, settings) => schema(value, settings) && type);
  Plugins[type] = plugin;
}
const getUniqueType = () => '__CUSTOM__PLUGIN__' + Math.random().toString(36).substr(2, 9);

function createInternalPlugin(plugin) {
  return plugin;
}
function createPlugin(plugin) {
  const type = getUniqueType();
  Plugins[type] = plugin;
  return input => {
    return {
      type,
      __customInput: input
    };
  };
}
function normalize$3(type, input, path, data) {
  const {
    normalize: _normalize
  } = Plugins[type];
  if (_normalize) return _normalize(input, path, data);
  if (typeof input !== 'object' || !('value' in input)) return {
    value: input
  };
  const {
      value
    } = input,
    settings = _objectWithoutProperties(input, _excluded3$1);
  return {
    value,
    settings
  };
}
function sanitize$4(type, value, settings, prevValue, path, store) {
  const {
    sanitize
  } = Plugins[type];
  if (sanitize) return sanitize(value, settings, prevValue, path, store);
  return value;
}
function format$2(type, value, settings) {
  const {
    format
  } = Plugins[type];
  if (format) return format(value, settings);
  return value;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    enumerableOnly && (symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    })), keys.push.apply(keys, symbols);
  }
  return keys;
}
function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = null != arguments[i] ? arguments[i] : {};
    i % 2 ? ownKeys(Object(source), !0).forEach(function (key) {
      _defineProperty(target, key, source[key]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
  }
  return target;
}

const clamp = (x, min, max) => x > max ? max : x < min ? min : x;
const pad = (x, pad) => String(x).padStart(pad, '0');
const parseNumber = v => {
  if (v === '' || typeof v === 'number') return v;
  try {
    const _v = evaluate(v);
    if (!isNaN(_v)) return _v;
  } catch (_unused) {}
  return parseFloat(v);
};
const log10 = Math.log(10);
function getStep(number) {
  let n = Math.abs(+String(number).replace('.', ''));
  if (n === 0) return 0.01;
  while (n !== 0 && n % 10 === 0) n /= 10;
  const significantDigits = Math.floor(Math.log(n) / log10) + 1;
  const numberLog = Math.floor(Math.log10(Math.abs(number)));
  const step = Math.pow(10, numberLog - significantDigits);
  return Math.max(step, 0.001);
}
const range = (v, min, max) => {
  if (max === min) return 0;
  const _v = clamp(v, min, max);
  return (_v - min) / (max - min);
};
const invertedRange = (p, min, max) => p * (max - min) + min;

const getUid = () => '_' + Math.random().toString(36).substr(2, 9);
const parens = /\(([0-9+\-*/^ .]+)\)/;
const exp = /(\d+(?:\.\d+)?) ?\^ ?(\d+(?:\.\d+)?)/;
const mul = /(\d+(?:\.\d+)?) ?\* ?(\d+(?:\.\d+)?)/;
const div = /(\d+(?:\.\d+)?) ?\/ ?(\d+(?:\.\d+)?)/;
const add = /(\d+(?:\.\d+)?) ?\+ ?(\d+(?:\.\d+)?)/;
const sub = /(\d+(?:\.\d+)?) ?- ?(\d+(?:\.\d+)?)/;

function evaluate(expr) {
  if (isNaN(Number(expr))) {
    if (parens.test(expr)) {
      const newExpr = expr.replace(parens, (match, subExpr) => String(evaluate(subExpr)));
      return evaluate(newExpr);
    } else if (exp.test(expr)) {
      const newExpr = expr.replace(exp, (match, base, pow) => String(Math.pow(Number(base), Number(pow))));
      return evaluate(newExpr);
    } else if (mul.test(expr)) {
      const newExpr = expr.replace(mul, (match, a, b) => String(Number(a) * Number(b)));
      return evaluate(newExpr);
    } else if (div.test(expr)) {
      const newExpr = expr.replace(div, (match, a, b) => {
        if (b != 0) return String(Number(a) / Number(b));else throw new Erreur('Division by zero');
      });
      return evaluate(newExpr);
    } else if (add.test(expr)) {
      const newExpr = expr.replace(add, (match, a, b) => String(Number(a) + Number(b)));
      return evaluate(newExpr);
    } else if (sub.test(expr)) {
      const newExpr = expr.replace(sub, (match, a, b) => String(Number(a) - Number(b)));
      return evaluate(newExpr);
    } else {
      return Number(expr);
    }
  }
  return Number(expr);
}

function pick(object, keys) {
  return keys.reduce((obj, key) => {
    if (!!object && object.hasOwnProperty(key)) {
      obj[key] = object[key];
    }
    return obj;
  }, {});
}
function omit(object, keys) {
  const obj = _objectSpread2({}, object);
  keys.forEach(k => k in object && delete obj[k]);
  return obj;
}
function mapArrayToKeys(value, keys) {
  return value.reduce((acc, v, i) => Object.assign(acc, {
    [keys[i]]: v
  }), {});
}
function isObject(variable) {
  return Object.prototype.toString.call(variable) === '[object Object]';
}
const isEmptyObject = obj => isObject(obj) && Object.keys(obj).length === 0;

let SpecialInputs;
(function (SpecialInputs) {
  SpecialInputs["BUTTON"] = "BUTTON";
  SpecialInputs["BUTTON_GROUP"] = "BUTTON_GROUP";
  SpecialInputs["MONITOR"] = "MONITOR";
  SpecialInputs["FOLDER"] = "FOLDER";
})(SpecialInputs || (SpecialInputs = {}));
let LevaInputs;
(function (LevaInputs) {
  LevaInputs["SELECT"] = "SELECT";
  LevaInputs["IMAGE"] = "IMAGE";
  LevaInputs["NUMBER"] = "NUMBER";
  LevaInputs["COLOR"] = "COLOR";
  LevaInputs["STRING"] = "STRING";
  LevaInputs["BOOLEAN"] = "BOOLEAN";
  LevaInputs["INTERVAL"] = "INTERVAL";
  LevaInputs["VECTOR3D"] = "VECTOR3D";
  LevaInputs["VECTOR2D"] = "VECTOR2D";
})(LevaInputs || (LevaInputs = {}));

const _excluded$9 = ["type", "__customInput"],
  _excluded2$3 = ["render", "label", "optional", "order", "disabled", "hint", "onChange", "onEditStart", "onEditEnd", "transient"],
  _excluded3 = ["type"];
function parseOptions(_input, key, mergedOptions = {}, customType) {
  var _commonOptions$option, _commonOptions$disabl;
  if (typeof _input !== 'object' || Array.isArray(_input)) {
    return {
      type: customType,
      input: _input,
      options: _objectSpread2({
        key,
        label: key,
        optional: false,
        disabled: false,
        order: 0
      }, mergedOptions)
    };
  }

  if ('__customInput' in _input) {
    const {
        type: _type,
        __customInput
      } = _input,
      options = _objectWithoutProperties(_input, _excluded$9);
    return parseOptions(__customInput, key, options, _type);
  }

  const {
      render,
      label,
      optional,
      order = 0,
      disabled,
      hint,
      onChange,
      onEditStart,
      onEditEnd,
      transient
    } = _input,
    inputWithType = _objectWithoutProperties(_input, _excluded2$3);
  const commonOptions = _objectSpread2({
    render,
    key,
    label: label !== null && label !== void 0 ? label : key,
    hint,
    transient: transient !== null && transient !== void 0 ? transient : !!onChange,
    onEditStart,
    onEditEnd,
    disabled,
    optional,
    order
  }, mergedOptions);
  let {
      type
    } = inputWithType,
    input = _objectWithoutProperties(inputWithType, _excluded3);
  type = customType !== null && customType !== void 0 ? customType : type;
  if (type in SpecialInputs) {
    return {
      type,
      input,
      options: commonOptions
    };
  }

  let computedInput;
  if (customType && isObject(input) && 'value' in input) computedInput = input.value;else computedInput = isEmptyObject(input) ? undefined : input;
  return {
    type,
    input: computedInput,
    options: _objectSpread2(_objectSpread2({}, commonOptions), {}, {
      onChange,
      optional: (_commonOptions$option = commonOptions.optional) !== null && _commonOptions$option !== void 0 ? _commonOptions$option : false,
      disabled: (_commonOptions$disabl = commonOptions.disabled) !== null && _commonOptions$disabl !== void 0 ? _commonOptions$disabl : false
    })
  };
}

function normalizeInput(_input, key, path, data) {
  const parsedInputAndOptions = parseOptions(_input, key);
  const {
    type,
    input: parsedInput,
    options
  } = parsedInputAndOptions;
  if (type) {
    if (type in SpecialInputs)
      return parsedInputAndOptions;

    return {
      type,
      input: normalize$3(type, parsedInput, path, data),
      options
    };
  }
  let inputType = getValueType(parsedInput);
  if (inputType) return {
    type: inputType,
    input: normalize$3(inputType, parsedInput, path, data),
    options
  };
  inputType = getValueType({
    value: parsedInput
  });
  if (inputType) return {
    type: inputType,
    input: normalize$3(inputType, {
      value: parsedInput
    }, path, data),
    options
  };

  return false;
}
function updateInput(input, newValue, path, store, fromPanel) {
  const {
    value,
    type,
    settings
  } = input;
  input.value = sanitizeValue({
    type,
    value,
    settings
  }, newValue, path, store);
  input.fromPanel = fromPanel;
}
const ValueErreur = function ValueErreur(message, value, error) {
  this.type = 'LEVA_ERROR';
  this.message = 'LEVA: ' + message;
  this.previousValue = value;
  this.error = error;
};
function sanitizeValue({
  type,
  value,
  settings
}, newValue, path, store) {
  const _newValue = type !== 'SELECT' && typeof newValue === 'function' ? newValue(value) : newValue;
  let sanitizedNewValue;
  try {
    sanitizedNewValue = sanitize$4(type, _newValue, settings, value, path, store);
  } catch (e) {
    throw new ValueErreur(`The value \`${newValue}\` did not result in a correct value.`, value, e);
  }
  if (dequal(sanitizedNewValue, value)) {

    return value;

  }

  return sanitizedNewValue;
}

const debounce = (callback, wait, immediate = false) => {
  let timeout = 0;
  return function () {
    const args = arguments;
    const callNow = immediate && !timeout;
    const next = () => callback.apply(this, args);
    window.clearTimeout(timeout);
    timeout = window.setTimeout(next, wait);
    if (callNow) next();
  };
};

const multiplyStep = event => event.shiftKey ? 5 : event.altKey ? 1 / 5 : 1;

function render(element, container) {
  const error = console.error;
  console.error = () => {};
  ReactDOM.render(element, container);
  console.error = error;
}

function mergeRefs(refs) {
  return value => {
    refs.forEach(ref => {
      if (typeof ref === 'function') ref(value);else if (ref != null) {
        ref.current = value;
      }
    });
  };
}

const _excluded$8 = ["value"],
  _excluded2$2 = ["min", "max"];
const schema$3 = v => {
  if (typeof v === 'number') return true;
  if (typeof v === 'string') {
    const _v = parseFloat(v);
    if (isNaN(_v)) return false;
    const suffix = v.substring(('' + _v).length).trim();
    return suffix.length < 4;
  }
  return false;
};
const sanitize$3 = (v, {
  min: _min = -Infinity,
  max: _max = Infinity,
  suffix
}) => {
  const _v = parseFloat(v);
  if (v === '' || isNaN(_v)) throw Erreur('Invalid number');
  const f = clamp(_v, _min, _max);
  return suffix ? f + suffix : f;
};
const format$1 = (v, {
  pad: _pad = 0,
  suffix
}) => {
  const f = parseFloat(v).toFixed(_pad);
  return suffix ? f + suffix : f;
};
const normalize$2 = _ref => {
  let {
      value
    } = _ref,
    settings = _objectWithoutProperties(_ref, _excluded$8);
  const {
      min = -Infinity,
      max = Infinity
    } = settings,
    _settings = _objectWithoutProperties(settings, _excluded2$2);
  let _value = parseFloat(value);
  const suffix = typeof value === 'string' ? value.substring(('' + _value).length) : undefined;
  _value = clamp(_value, min, max);

  let step = settings.step;
  if (!step) {
    if (Number.isFinite(min)) {
      if (Number.isFinite(max)) step = +(Math.abs(max - min) / 100).toPrecision(1);else step = +(Math.abs(_value - min) / 100).toPrecision(1);
    } else if (Number.isFinite(max)) step = +(Math.abs(max - _value) / 100).toPrecision(1);
  }
  const padStep = step ? getStep(step) * 10 : getStep(_value);
  step = step || padStep / 10;
  const pad = Math.round(clamp(Math.log10(1 / padStep), 0, 2));
  return {
    value: suffix ? _value + suffix : _value,
    settings: _objectSpread2({
      initialValue: _value,
      step,
      pad,
      min,
      max,
      suffix
    }, _settings)
  };
};

const sanitizeStep$1 = (v, {
  step,
  initialValue
}) => {
  const steps = Math.round((v - initialValue) / step);
  return initialValue + steps * step;
};

var props$3 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  schema: schema$3,
  sanitize: sanitize$3,
  format: format$1,
  normalize: normalize$2,
  sanitizeStep: sanitizeStep$1
});

function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}

const InputContext = createContext({});
function useInputContext() {
  return useContext(InputContext);
}
const ThemeContext = createContext(null);
const StoreContext = createContext(null);
const PanelSettingsContext = createContext(null);
function useStoreContext() {
  return useContext(StoreContext);
}
function usePanelSettingsContext() {
  return useContext(PanelSettingsContext);
}
function LevaStoreProvider({
  children,
  store
}) {
  return React.createElement(StoreContext.Provider, {
    value: store
  }, children);
}

const getDefaultTheme = () => ({
  colors: {
    elevation1: '#292d39',
    elevation2: '#181c20',
    elevation3: '#373c4b',
    accent1: '#0066dc',
    accent2: '#007bff',
    accent3: '#3c93ff',
    highlight1: '#535760',
    highlight2: '#8c92a4',
    highlight3: '#fefefe',
    vivid1: '#ffcc00',
    folderWidgetColor: '$highlight2',
    folderTextColor: '$highlight3',
    toolTipBackground: '$highlight3',
    toolTipText: '$elevation2'
  },
  radii: {
    xs: '2px',
    sm: '3px',
    lg: '10px'
  },
  space: {
    xs: '3px',
    sm: '6px',
    md: '10px',
    rowGap: '7px',
    colGap: '7px'
  },
  fonts: {
    mono: `ui-monospace, SFMono-Regular, Menlo, 'Roboto Mono', monospace`,
    sans: `system-ui, sans-serif`
  },
  fontSizes: {
    root: '11px',
    toolTip: '$root'
  },
  sizes: {
    rootWidth: '280px',
    controlWidth: '160px',
    numberInputMinWidth: '38px',
    scrubberWidth: '8px',
    scrubberHeight: '16px',
    rowHeight: '24px',
    folderTitleHeight: '20px',
    checkboxSize: '16px',
    joystickWidth: '100px',
    joystickHeight: '100px',
    colorPickerWidth: '$controlWidth',
    colorPickerHeight: '100px',
    imagePreviewWidth: '$controlWidth',
    imagePreviewHeight: '100px',
    monitorHeight: '60px',
    titleBarHeight: '39px'
  },
  shadows: {
    level1: '0 0 9px 0 #00000088',
    level2: '0 4px 14px #00000033'
  },
  borderWidths: {
    root: '0px',
    input: '1px',
    focus: '1px',
    hover: '1px',
    active: '1px',
    folder: '1px'
  },
  fontWeights: {
    label: 'normal',
    folder: 'normal',
    button: 'normal'
  }
});
function createStateClass(value, options) {
  const [borderColor, bgColor] = value.split(' ');
  const css = {};
  if (borderColor !== 'none') {
    css.boxShadow = `${options.inset ? 'inset ' : ''}0 0 0 $borderWidths${[options.key]} $colors${borderColor !== 'default' && borderColor || options.borderColor}`;
  }
  if (bgColor) {
    css.backgroundColor = bgColor;
  }
  return css;
}
const utils = {
  $inputStyle: () => value => createStateClass(value, {
    key: '$input',
    borderColor: '$highlight1',
    inset: true
  }),
  $focusStyle: () => value => createStateClass(value, {
    key: '$focus',
    borderColor: '$accent2'
  }),
  $hoverStyle: () => value => createStateClass(value, {
    key: '$hover',
    borderColor: '$accent1',
    inset: true
  }),
  $activeStyle: () => value => createStateClass(value, {
    key: '$active',
    borderColor: '$accent1',
    inset: true
  })
};
const {
  styled,
  css,
  createTheme,
  globalCss,
  keyframes
} = createStitches({
  prefix: 'leva',
  theme: getDefaultTheme(),
  utils: _objectSpread2(_objectSpread2({}, utils), {}, {
    $flex: () => ({
      display: 'flex',
      alignItems: 'center'
    }),
    $flexCenter: () => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }),
    $reset: () => ({
      outline: 'none',
      fontSize: 'inherit',
      fontWeight: 'inherit',
      color: 'inherit',
      fontFamily: 'inherit',
      border: 'none',
      backgroundColor: 'transparent',
      appearance: 'none'
    }),
    $draggable: () => ({
      touchAction: 'none',
      WebkitUserDrag: 'none',
      userSelect: 'none'
    }),
    $focus: value => ({
      '&:focus': utils.$focusStyle()(value)
    }),
    $focusWithin: value => ({
      '&:focus-within': utils.$focusStyle()(value)
    }),
    $hover: value => ({
      '&:hover': utils.$hoverStyle()(value)
    }),
    $active: value => ({
      '&:active': utils.$activeStyle()(value)
    })
  })
});
const globalStyles = globalCss({
  '.leva__panel__dragged': {
    WebkitUserDrag: 'none',
    userSelect: 'none',
    input: {
      userSelect: 'none'
    },
    '*': {
      cursor: 'ew-resize !important'
    }
  }
});

function mergeTheme(newTheme) {
  const defaultTheme = getDefaultTheme();
  if (!newTheme) return {
    theme: defaultTheme,
    className: ''
  };
  Object.keys(newTheme).forEach(key => {
    Object.assign(defaultTheme[key], newTheme[key]);
  });
  const customTheme = createTheme(defaultTheme);
  return {
    theme: defaultTheme,
    className: customTheme.className
  };
}
function useTh(category, key) {
  const {
    theme
  } = useContext(ThemeContext);
  if (!(category in theme) || !(key in theme[category])) {
    warn(LevaErreurs.THEME_ERROR, category, key);
    return '';
  }
  let _key = key;
  while (true) {
    let value = theme[category][_key];
    if (typeof value === 'string' && value.charAt(0) === '$') _key = value.substr(1);else return value;
  }
}

const StyledInput = styled('input', {
  $reset: '',
  padding: '0 $sm',
  width: 0,
  minWidth: 0,
  flex: 1,
  height: '100%',
  variants: {
    levaType: {
      number: {
        textAlign: 'right'
      }
    },
    as: {
      textarea: {
        padding: '$sm'
      }
    }
  }
});
const InnerLabel = styled('div', {
  $draggable: '',
  height: '100%',
  $flexCenter: '',
  position: 'relative',
  padding: '0 $xs',
  fontSize: '0.8em',
  opacity: 0.8,
  cursor: 'default',
  touchAction: 'none',
  [`& + ${StyledInput}`]: {
    paddingLeft: 0
  }
});
const InnerNumberLabel = styled(InnerLabel, {
  cursor: 'ew-resize',
  marginRight: '-$xs',
  textTransform: 'uppercase',
  opacity: 0.3,
  '&:hover': {
    opacity: 1
  },
  variants: {
    dragging: {
      true: {
        backgroundColor: '$accent2',
        opacity: 1
      }
    }
  }
});
const InputContainer = styled('div', {
  $flex: '',
  position: 'relative',
  borderRadius: '$sm',
  overflow: 'hidden',
  color: 'inherit',
  height: '$rowHeight',
  backgroundColor: '$elevation3',
  $inputStyle: '$elevation1',
  $hover: '',
  $focusWithin: '',
  variants: {
    textArea: {
      true: {
        height: 'auto'
      }
    }
  }
});

const _excluded$7 = ["innerLabel", "value", "onUpdate", "onChange", "onKeyDown", "type", "id", "inputType", "rows"],
  _excluded2$1 = ["onUpdate"];
function ValueInput(_ref) {
  let {
      innerLabel,
      value,
      onUpdate,
      onChange,
      onKeyDown,
      type,
      id,
      inputType = 'text',
      rows = 0
    } = _ref,
    props = _objectWithoutProperties(_ref, _excluded$7);
  const {
    id: _id,
    emitOnEditStart,
    emitOnEditEnd,
    disabled
  } = useInputContext();
  const inputId = id || _id;
  const inputRef = useRef(null);
  const isTextArea = rows > 0;
  const asType = isTextArea ? 'textarea' : 'input';
  const update = useCallback(fn => event => {
    const _value = event.currentTarget.value;
    fn(_value);
  }, []);

  React.useEffect(() => {
    const ref = inputRef.current;
    const _onUpdate = update(value => {
      onUpdate(value);
      emitOnEditEnd();
    });
    ref === null || ref === void 0 ? void 0 : ref.addEventListener('blur', _onUpdate);
    return () => ref === null || ref === void 0 ? void 0 : ref.removeEventListener('blur', _onUpdate);
  }, [update, onUpdate, emitOnEditEnd]);
  const onKeyPress = useCallback(event => {
    if (event.key === 'Enter') {
      update(onUpdate)(event);
    }
  }, [update, onUpdate]);

  const inputProps = Object.assign({
    as: asType
  }, isTextArea ? {
    rows
  } : {}, props);
  return React.createElement(InputContainer, {
    textArea: isTextArea
  }, innerLabel && typeof innerLabel === 'string' ? React.createElement(InnerLabel, null, innerLabel) : innerLabel, React.createElement(StyledInput, _extends({
    levaType: type
    ,
    ref: inputRef,
    id: inputId,
    type: inputType,
    autoComplete: "off",
    spellCheck: "false",
    value: value,
    onChange: update(onChange),
    onFocus: () => emitOnEditStart(),
    onKeyPress: onKeyPress,
    onKeyDown: onKeyDown,
    disabled: disabled
  }, inputProps)));
}
function NumberInput(_ref2) {
  let {
      onUpdate
    } = _ref2,
    props = _objectWithoutProperties(_ref2, _excluded2$1);
  const _onUpdate = useCallback(v => onUpdate(parseNumber(v)), [onUpdate]);
  const onKeyDown = useCallback(event => {
    const dir = event.key === 'ArrowUp' ? 1 : event.key === 'ArrowDown' ? -1 : 0;
    if (dir) {
      event.preventDefault();
      const step = event.altKey ? 0.1 : event.shiftKey ? 10 : 1;
      onUpdate(v => parseFloat(v) + dir * step);
    }
  }, [onUpdate]);
  return React.createElement(ValueInput, _extends({}, props, {
    onUpdate: _onUpdate,
    onKeyDown: onKeyDown,
    type: "number"
  }));
}

const StyledFolder = styled('div', {});
const StyledWrapper = styled('div', {
  position: 'relative',
  background: '$elevation2',
  transition: 'height 300ms ease',
  variants: {
    fill: {
      true: {},
      false: {}
    },
    flat: {
      false: {},
      true: {}
    },
    isRoot: {
      true: {},
      false: {
        paddingLeft: '$md',
        '&::after': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          width: '$borderWidths$folder',
          height: '100%',
          backgroundColor: '$folderWidgetColor',
          opacity: 0.4,
          transform: 'translateX(-50%)'
        }
      }
    }
  },
  compoundVariants: [{
    isRoot: true,
    fill: false,
    css: {
      overflowY: 'auto',
      maxHeight: 'calc(100vh - 20px - $$titleBarHeight)'
    }
  }, {
    isRoot: true,
    flat: false,
    css: {
      borderRadius: '$lg'
    }
  }]
});
const StyledTitle = styled('div', {
  $flex: '',
  color: '$folderTextColor',
  userSelect: 'none',
  cursor: 'pointer',
  height: '$folderTitleHeight',
  fontWeight: '$folder',
  '> svg': {
    marginLeft: -4,
    marginRight: 4,
    cursor: 'pointer',
    fill: '$folderWidgetColor',
    opacity: 0.6
  },
  '&:hover > svg': {
    fill: '$folderWidgetColor'
  },
  [`&:hover + ${StyledWrapper}::after`]: {
    opacity: 0.6
  },
  [`${StyledFolder}:hover > & + ${StyledWrapper}::after`]: {
    opacity: 0.6
  },
  [`${StyledFolder}:hover > & > svg`]: {
    opacity: 1
  }
});
const StyledContent = styled('div', {
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: '100%',
  rowGap: '$rowGap',
  transition: 'opacity 250ms ease',
  variants: {
    toggled: {
      true: {
        opacity: 1,
        transitionDelay: '250ms'
      },
      false: {
        opacity: 0,
        transitionDelay: '0ms',
        pointerEvents: 'none'
      }
    },
    isRoot: {
      true: {
        '& > div': {
          paddingLeft: '$md',
          paddingRight: '$md'
        },
        '& > div:first-of-type': {
          paddingTop: '$sm'
        },
        '& > div:last-of-type': {
          paddingBottom: '$sm'
        },

        [`> ${StyledFolder}:not(:first-of-type)`]: {
          paddingTop: '$sm',
          marginTop: '$md',
          borderTop: '$borderWidths$folder solid $colors$elevation1'
        }
      }
    }
  }
});

const StyledRow = styled('div', {
  position: 'relative',
  zIndex: 100,
  display: 'grid',
  rowGap: '$rowGap',
  gridTemplateRows: 'minmax($sizes$rowHeight, max-content)',
  alignItems: 'center',
  color: '$highlight2',
  [`${StyledContent} > &`]: {
    '&:first-of-type': {
      marginTop: '$rowGap'
    },
    '&:last-of-type': {
      marginBottom: '$rowGap'
    }
  },
  variants: {
    disabled: {
      true: {
        pointerEvents: 'none'
      },
      false: {
        '&:hover,&:focus-within': {
          color: '$highlight3'
        }
      }
    }
  }
});
const StyledInputRow = styled(StyledRow, {
  gridTemplateColumns: 'auto $sizes$controlWidth',
  columnGap: '$colGap'
});
const CopyLabelContainer = styled('div', {
  $flex: '',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  '& > div': {
    marginLeft: '$colGap',
    padding: '0 $xs',
    opacity: 0.4
  },
  '& > div:hover': {
    opacity: 0.8
  },
  '& > div > svg': {
    display: 'none',
    cursor: 'pointer',
    width: 13,
    minWidth: 13,
    height: 13,
    backgroundColor: '$elevation2'
  },
  '&:hover > div > svg': {
    display: 'block'
  },
  variants: {
    align: {
      top: {
        height: '100%',
        alignItems: 'flex-start',
        paddingTop: '$sm'
      }
    }
  }
});
const StyledOptionalToggle = styled('input', {
  $reset: '',
  height: 0,
  width: 0,
  opacity: 0,
  margin: 0,
  '& + label': {
    position: 'relative',
    $flexCenter: '',
    height: '100%',
    userSelect: 'none',
    cursor: 'pointer',
    paddingLeft: 2,
    paddingRight: '$sm',
    pointerEvents: 'auto'
  },
  '& + label:after': {
    content: '""',
    width: 6,
    height: 6,
    backgroundColor: '$elevation3',
    borderRadius: '50%',
    $activeStyle: ''
  },
  '&:focus + label:after': {
    $focusStyle: ''
  },
  '& + label:active:after': {
    backgroundColor: '$accent1',
    $focusStyle: ''
  },
  '&:checked + label:after': {
    backgroundColor: '$accent1'
  }
});
const StyledLabel = styled('label', {
  fontWeight: '$label',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  '& > svg': {
    display: 'block'
  }
});

const StyledInputWrapper$1 = styled('div', {
  opacity: 1,
  variants: {
    disabled: {
      true: {
        opacity: 0.6,
        pointerEvents: 'none',
        [`& ${StyledLabel}`]: {
          pointerEvents: 'auto'
        }
      }
    }
  }
});
const Overlay = styled('div', {
  position: 'fixed',
  top: 0,
  bottom: 0,
  right: 0,
  left: 0,
  zIndex: 1000,
  userSelect: 'none'
});
const StyledToolTipContent = styled('div', {
  background: '$toolTipBackground',
  fontFamily: '$sans',
  fontSize: '$toolTip',
  padding: '$xs $sm',
  color: '$toolTipText',
  borderRadius: '$xs',
  boxShadow: '$level2',
  maxWidth: 260
});
const ToolTipArrow = styled(Arrow, {
  fill: '$toolTipBackground'
});

function Portal({
  children
}) {
  const {
    className
  } = useContext(ThemeContext);
  return React.createElement(P.Root, {
    className: className
  }, children);
}

const _excluded$6 = ["align"];
function OptionalToggle() {
  const {
    id,
    disable,
    disabled
  } = useInputContext();
  return React.createElement(React.Fragment, null, React.createElement(StyledOptionalToggle, {
    id: id + '__disable',
    type: "checkbox",
    checked: !disabled,
    onChange: () => disable(!disabled)
  }), React.createElement("label", {
    htmlFor: id + '__disable'
  }));
}
function RawLabel(props) {
  const {
    id,
    optional,
    hint
  } = useInputContext();
  const htmlFor = props.htmlFor || (id ? {
    htmlFor: id
  } : null);

  const title = !hint && typeof props.children === 'string' ? {
    title: props.children
  } : null;
  return React.createElement(React.Fragment, null, optional && React.createElement(OptionalToggle, null), hint !== undefined ? React.createElement(RadixTooltip.Root, null, React.createElement(RadixTooltip.Trigger, {
    asChild: true
  }, React.createElement(StyledLabel, _extends({}, htmlFor, props))), React.createElement(RadixTooltip.Content, {
    side: "top",
    sideOffset: 2
  }, React.createElement(StyledToolTipContent, null, hint, React.createElement(ToolTipArrow, null)))) : React.createElement(StyledLabel, _extends({}, htmlFor, title, props)));
}
function Label(_ref) {
  let {
      align
    } = _ref,
    props = _objectWithoutProperties(_ref, _excluded$6);
  const {
    value,
    label,
    key,
    disabled
  } = useInputContext();
  const {
    hideCopyButton
  } = usePanelSettingsContext();
  const copyEnabled = !hideCopyButton && key !== undefined;
  const [copied, setCopied] = useState(false);
  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify({
        [key]: value !== null && value !== void 0 ? value : ''
      }));
      setCopied(true);
    } catch (_unused) {
      warn(LevaErreurs.CLIPBOARD_ERROR, {
        [key]: value
      });
    }
  };
  return React.createElement(CopyLabelContainer, {
    align: align,
    onPointerLeave: () => setCopied(false)
  }, React.createElement(RawLabel, props), copyEnabled && !disabled && React.createElement("div", {
    title: `Click to copy ${typeof label === 'string' ? label : key} value`
  }, !copied ? React.createElement("svg", {
    onClick: handleClick,
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor"
  }, React.createElement("path", {
    d: "M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
  }), React.createElement("path", {
    d: "M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"
  })) : React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor"
  }, React.createElement("path", {
    d: "M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"
  }), React.createElement("path", {
    fillRule: "evenodd",
    d: "M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z",
    clipRule: "evenodd"
  }))));
}

const _excluded$5 = ["toggled"];

const Svg = styled('svg', {
  fill: 'currentColor',
  transition: 'transform 350ms ease, fill 250ms ease'
});
function Chevron(_ref) {
  let {
      toggled
    } = _ref,
    props = _objectWithoutProperties(_ref, _excluded$5);
  return React.createElement(Svg, _extends({
    width: "9",
    height: "5",
    viewBox: "0 0 9 5",
    xmlns: "http://www.w3.org/2000/svg",
    style: {
      transform: `rotate(${toggled ? 0 : -90}deg)`
    }
  }, props), React.createElement("path", {
    d: "M3.8 4.4c.4.3 1 .3 1.4 0L8 1.7A1 1 0 007.4 0H1.6a1 1 0 00-.7 1.7l3 2.7z"
  }));
}

const _excluded$4 = ["input"];
function Row(_ref) {
  let {
      input
    } = _ref,
    props = _objectWithoutProperties(_ref, _excluded$4);
  if (input) return React.createElement(StyledInputRow, props);
  return React.createElement(StyledRow, props);
}

function useInputSetters({
  value,
  type,
  settings,
  setValue
}) {
  const [displayValue, setDisplayValue] = useState(format$2(type, value, settings));
  const previousValueRef = useRef(value);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const setFormat = useCallback(v => setDisplayValue(format$2(type, v, settingsRef.current)), [type]);
  const onUpdate = useCallback(updatedValue => {
    try {
      setValue(updatedValue);
    } catch (error) {
      const {
        type,
        previousValue
      } = error;
      if (type !== 'LEVA_ERROR') throw error;
      setFormat(previousValue);
    }
  }, [setFormat, setValue]);
  useEffect(() => {
    if (!dequal(value, previousValueRef.current)) {
      setFormat(value);
    }
    previousValueRef.current = value;
  }, [value, setFormat]);
  return {
    displayValue,
    onChange: setDisplayValue,
    onUpdate
  };
}

function useDrag(handler, config) {
  const {
    emitOnEditStart,
    emitOnEditEnd
  } = useInputContext();
  return useDrag$1(state => {
    if (state.first) {
      document.body.classList.add('leva__panel__dragged');
      emitOnEditStart === null || emitOnEditStart === void 0 ? void 0 : emitOnEditStart();
    }
    const result = handler(state);
    if (state.last) {
      document.body.classList.remove('leva__panel__dragged');
      emitOnEditEnd === null || emitOnEditEnd === void 0 ? void 0 : emitOnEditEnd();
    }
    return result;
  }, config);
}

function useCanvas2d(fn) {
  const canvas = useRef(null);
  const ctx = useRef(null);
  const hasFired = useRef(false);

  useEffect(() => {
    const handleCanvas = debounce(() => {
      canvas.current.width = canvas.current.offsetWidth * window.devicePixelRatio;
      canvas.current.height = canvas.current.offsetHeight * window.devicePixelRatio;
      fn(canvas.current, ctx.current);
    }, 250);
    window.addEventListener('resize', handleCanvas);
    if (!hasFired.current) {
      handleCanvas();
      hasFired.current = true;
    }
    return () => window.removeEventListener('resize', handleCanvas);
  }, [fn]);
  useEffect(() => {
    ctx.current = canvas.current.getContext('2d');
  }, []);
  return [canvas, ctx];
}

function useTransform() {
  const ref = useRef(null);
  const local = useRef({
    x: 0,
    y: 0
  });
  const set = useCallback(point => {
    Object.assign(local.current, point);
    if (ref.current) ref.current.style.transform = `translate3d(${local.current.x}px, ${local.current.y}px, 0)`;
  }, []);
  return [ref, set];
}

const _excluded$3 = ["__refCount"];
const getInputAtPath = (data, path) => {
  if (!data[path]) return null;
  const _data$path = data[path],
    input = _objectWithoutProperties(_data$path, _excluded$3);
  return input;
};
function useInput(path) {
  const store = useStoreContext();
  const [state, setState] = useState(getInputAtPath(store.getData(), path));
  const set = useCallback(value => store.setValueAtPath(path, value, true), [path, store]);
  const setSettings = useCallback(settings => store.setSettingsAtPath(path, settings), [path, store]);
  const disable = useCallback(flag => store.disableInputAtPath(path, flag), [path, store]);
  const emitOnEditStart = useCallback(() => store.emitOnEditStart(path), [path, store]);
  const emitOnEditEnd = useCallback(() => store.emitOnEditEnd(path), [path, store]);
  useEffect(() => {
    setState(getInputAtPath(store.getData(), path));
    const unsub = store.useStore.subscribe(s => getInputAtPath(s.data, path), setState, {
      equalityFn: shallow
    });
    return () => unsub();
  }, [store, path]);
  return [state, {
    set,
    setSettings,
    disable,
    storeId: store.storeId,
    emitOnEditStart,
    emitOnEditEnd
  }];
}

const RangeGrid = styled('div', {
  variants: {
    hasRange: {
      true: {
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: 'auto $sizes$numberInputMinWidth',
        columnGap: '$colGap',
        alignItems: 'center'
      }
    }
  }
});

const Range = styled('div', {
  position: 'relative',
  width: '100%',
  height: 2,
  borderRadius: '$xs',
  backgroundColor: '$elevation1'
});
const Scrubber = styled('div', {
  position: 'absolute',
  width: '$scrubberWidth',
  height: '$scrubberHeight',
  borderRadius: '$xs',
  boxShadow: '0 0 0 2px $colors$elevation2',
  backgroundColor: '$accent2',
  cursor: 'pointer',
  $active: 'none $accent1',
  $hover: 'none $accent3',
  variants: {
    position: {
      left: {
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        transform: 'translateX(calc(-0.5 * ($sizes$scrubberWidth + 4px)))'
      },
      right: {
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        transform: 'translateX(calc(0.5 * ($sizes$scrubberWidth + 4px)))'
      }
    }
  }
});
const RangeWrapper = styled('div', {
  position: 'relative',
  $flex: '',
  height: '100%',
  cursor: 'pointer',
  touchAction: 'none'
});
const Indicator = styled('div', {
  position: 'absolute',
  height: '100%',
  backgroundColor: '$accent2'
});

function RangeSlider({
  value,
  min,
  max,
  onDrag,
  step,
  initialValue
}) {
  const ref = useRef(null);
  const scrubberRef = useRef(null);
  const rangeWidth = useRef(0);
  const scrubberWidth = useTh('sizes', 'scrubberWidth');
  const bind = useDrag(({
    event,
    first,
    xy: [x],
    movement: [mx],
    memo
  }) => {
    if (first) {
      const {
        width,
        left
      } = ref.current.getBoundingClientRect();
      rangeWidth.current = width - parseFloat(scrubberWidth);
      const targetIsScrub = (event === null || event === void 0 ? void 0 : event.target) === scrubberRef.current;
      memo = targetIsScrub ? value : invertedRange((x - left) / width, min, max);
    }
    const newValue = memo + invertedRange(mx / rangeWidth.current, 0, max - min);
    onDrag(sanitizeStep$1(newValue, {
      step,
      initialValue
    }));
    return memo;
  });
  const pos = range(value, min, max);
  return React.createElement(RangeWrapper, _extends({
    ref: ref
  }, bind()), React.createElement(Range, null, React.createElement(Indicator, {
    style: {
      left: 0,
      right: `${(1 - pos) * 100}%`
    }
  })), React.createElement(Scrubber, {
    ref: scrubberRef,
    style: {
      left: `calc(${pos} * (100% - ${scrubberWidth}))`
    }
  }));
}

const DraggableLabel = React.memo(({
  label,
  onUpdate,
  step,
  innerLabelTrim
}) => {
  const [dragging, setDragging] = useState(false);
  const bind = useDrag(({
    active,
    delta: [dx],
    event,
    memo: _memo = 0
  }) => {
    setDragging(active);
    _memo += dx / 2;
    if (Math.abs(_memo) >= 1) {
      onUpdate(v => parseFloat(v) + Math.floor(_memo) * step * multiplyStep(event));
      _memo = 0;
    }
    return _memo;
  });
  return React.createElement(InnerNumberLabel, _extends({
    dragging: dragging,
    title: label.length > 1 ? label : ''
  }, bind()), label.slice(0, innerLabelTrim));
});
function Number$1({
  label,
  id,
  displayValue,
  onUpdate,
  onChange,
  settings,
  innerLabelTrim = 1
}) {
  const InnerLabel = innerLabelTrim > 0 && React.createElement(DraggableLabel, {
    label: label,
    step: settings.step,
    onUpdate: onUpdate,
    innerLabelTrim: innerLabelTrim
  });
  return React.createElement(NumberInput, {
    id: id,
    value: String(displayValue),
    onUpdate: onUpdate,
    onChange: onChange,
    innerLabel: InnerLabel
  });
}
function NumberComponent() {
  const props = useInputContext();
  const {
    label,
    value,
    onUpdate,
    settings,
    id
  } = props;
  const {
    min,
    max
  } = settings;
  const hasRange = max !== Infinity && min !== -Infinity;
  return React.createElement(Row, {
    input: true
  }, React.createElement(Label, null, label), React.createElement(RangeGrid, {
    hasRange: hasRange
  }, hasRange && React.createElement(RangeSlider, _extends({
    value: parseFloat(value),
    onDrag: onUpdate
  }, settings)), React.createElement(Number$1, _extends({}, props, {
    id: id,
    label: "value",
    innerLabelTrim: hasRange ? 0 : 1
  }))));
}

const {
    sanitizeStep
  } = props$3,
  rest = _objectWithoutProperties(props$3, ["sanitizeStep"]);
var number = createInternalPlugin(_objectSpread2({
  component: NumberComponent
}, rest));

const schema$2 = (_o, s) => v8n().schema({
  options: v8n().passesAnyOf(v8n().object(), v8n().array())
}).test(s);
const sanitize$2 = (value, {
  values
}) => {
  if (values.indexOf(value) < 0) throw Erreur(`Selected value doesn't match Select options`);
  return value;
};
const format = (value, {
  values
}) => {
  return values.indexOf(value);
};
const normalize$1 = input => {
  let {
    value,
    options
  } = input;
  let keys;
  let values;
  if (Array.isArray(options)) {
    values = options;
    keys = options.map(o => String(o));
  } else {
    values = Object.values(options);
    keys = Object.keys(options);
  }
  if (!('value' in input)) value = values[0];else if (!values.includes(value)) {
    keys.unshift(String(value));
    values.unshift(value);
  }
  if (!Object.values(options).includes(value)) options[String(value)] = value;
  return {
    value,
    settings: {
      keys,
      values
    }
  };
};

var props$2 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  schema: schema$2,
  sanitize: sanitize$2,
  format: format,
  normalize: normalize$1
});

const SelectContainer = styled('div', {
  $flexCenter: '',
  position: 'relative',
  '> svg': {
    pointerEvents: 'none',
    position: 'absolute',
    right: '$md'
  }
});
const NativeSelect = styled('select', {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  opacity: 0
});
const PresentationalSelect = styled('div', {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  height: '$rowHeight',
  backgroundColor: '$elevation3',
  borderRadius: '$sm',
  padding: '0 $sm',
  cursor: 'pointer',
  [`${NativeSelect}:focus + &`]: {
    $focusStyle: ''
  },
  [`${NativeSelect}:hover + &`]: {
    $hoverStyle: ''
  }
});

function Select({
  displayValue,
  value,
  onUpdate,
  id,
  settings,
  disabled
}) {
  const {
    keys,
    values
  } = settings;
  const lastDisplayedValue = useRef();

  if (value === values[displayValue]) {
    lastDisplayedValue.current = keys[displayValue];
  }
  return React.createElement(SelectContainer, null, React.createElement(NativeSelect, {
    id: id,
    value: displayValue,
    onChange: e => onUpdate(values[Number(e.currentTarget.value)]),
    disabled: disabled
  }, keys.map((key, index) => React.createElement("option", {
    key: key,
    value: index
  }, key))), React.createElement(PresentationalSelect, null, lastDisplayedValue.current), React.createElement(Chevron, {
    toggled: true
  }));
}
function SelectComponent() {
  const {
    label,
    value,
    displayValue,
    onUpdate,
    id,
    disabled,
    settings
  } = useInputContext();
  return React.createElement(Row, {
    input: true
  }, React.createElement(Label, null, label), React.createElement(Select, {
    id: id,
    value: value,
    displayValue: displayValue,
    onUpdate: onUpdate,
    settings: settings,
    disabled: disabled
  }));
}

var select = createInternalPlugin(_objectSpread2({
  component: SelectComponent
}, props$2));

const schema$1 = o => v8n().string().test(o);
const sanitize$1 = v => {
  if (typeof v !== 'string') throw Erreur(`Invalid string`);
  return v;
};
const normalize = ({
  value,
  editable: _editable = true,
  rows: _rows = false
}) => {
  return {
    value,
    settings: {
      editable: _editable,
      rows: typeof _rows === 'number' ? _rows : _rows ? 5 : 0
    }
  };
};

var props$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  schema: schema$1,
  sanitize: sanitize$1,
  normalize: normalize
});

const _excluded$2 = ["displayValue", "onUpdate", "onChange", "editable"];
const NonEditableString = styled('div', {
  whiteSpace: 'pre-wrap'
});
function String$1(_ref) {
  let {
      displayValue,
      onUpdate,
      onChange,
      editable = true
    } = _ref,
    props = _objectWithoutProperties(_ref, _excluded$2);
  if (editable) return React.createElement(ValueInput, _extends({
    value: displayValue,
    onUpdate: onUpdate,
    onChange: onChange
  }, props));
  return React.createElement(NonEditableString, null, displayValue);
}
function StringComponent() {
  const {
    label,
    settings,
    displayValue,
    onUpdate,
    onChange
  } = useInputContext();
  return React.createElement(Row, {
    input: true
  }, React.createElement(Label, null, label), React.createElement(String$1, _extends({
    displayValue: displayValue,
    onUpdate: onUpdate,
    onChange: onChange
  }, settings)));
}

var string = createInternalPlugin(_objectSpread2({
  component: StringComponent
}, props$1));

const schema = o => v8n().boolean().test(o);
const sanitize = v => {
  if (typeof v !== 'boolean') throw Erreur('Invalid boolean');
  return v;
};

var props = /*#__PURE__*/Object.freeze({
  __proto__: null,
  schema: schema,
  sanitize: sanitize
});

const StyledInputWrapper = styled('div', {
  position: 'relative',
  $flex: '',
  height: '$rowHeight',
  input: {
    $reset: '',
    height: 0,
    width: 0,
    opacity: 0,
    margin: 0
  },
  label: {
    position: 'relative',
    $flexCenter: '',
    userSelect: 'none',
    cursor: 'pointer',
    height: '$checkboxSize',
    width: '$checkboxSize',
    backgroundColor: '$elevation3',
    borderRadius: '$sm',
    $hover: ''
  },
  'input:focus + label': {
    $focusStyle: ''
  },
  'input:focus:checked + label, input:checked + label:hover': {
    $hoverStyle: '$accent3'
  },
  'input + label:active': {
    backgroundColor: '$accent1'
  },
  'input:checked + label:active': {
    backgroundColor: '$accent1'
  },
  'label > svg': {
    display: 'none',
    width: '90%',
    height: '90%',
    stroke: '$highlight3'
  },
  'input:checked + label': {
    backgroundColor: '$accent2'
  },
  'input:checked + label > svg': {
    display: 'block'
  }
});

function Boolean({
  value,
  onUpdate,
  id,
  disabled
}) {
  return React.createElement(StyledInputWrapper, null, React.createElement("input", {
    id: id,
    type: "checkbox",
    checked: value,
    onChange: e => onUpdate(e.currentTarget.checked),
    disabled: disabled
  }), React.createElement("label", {
    htmlFor: id
  }, React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24"
  }, React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 2,
    d: "M5 13l4 4L19 7"
  }))));
}
function BooleanComponent() {
  const {
    label,
    value,
    onUpdate,
    disabled,
    id
  } = useInputContext();
  return React.createElement(Row, {
    input: true
  }, React.createElement(Label, null, label), React.createElement(Boolean, {
    value: value,
    onUpdate: onUpdate,
    id: id,
    disabled: disabled
  }));
}

var boolean = createInternalPlugin(_objectSpread2({
  component: BooleanComponent
}, props));

const _excluded$1 = ["locked"];
function Coordinate({
  value,
  id,
  valueKey,
  settings,
  onUpdate,
  innerLabelTrim
}) {

  const valueRef = useRef(value[valueKey]);
  valueRef.current = value[valueKey];
  const setValue = useCallback(newValue =>
  onUpdate({
    [valueKey]: sanitizeValue({
      type: 'NUMBER',
      value: valueRef.current,
      settings
    }, newValue)
  }), [onUpdate, settings, valueKey]);
  const number = useInputSetters({
    type: 'NUMBER',
    value: value[valueKey],
    settings,
    setValue
  });
  return React.createElement(Number$1, {
    id: id,
    label: valueKey,
    value: value[valueKey],
    displayValue: number.displayValue,
    onUpdate: number.onUpdate,
    onChange: number.onChange,
    settings: settings,
    innerLabelTrim: innerLabelTrim
  });
}
const Container = styled('div', {
  display: 'grid',
  columnGap: '$colGap',
  gridAutoFlow: 'column dense',
  alignItems: 'center',
  variants: {
    withLock: {
      true: {
        gridTemplateColumns: '10px auto',
        '> svg': {
          cursor: 'pointer'
        }
      }
    }
  }
});

function Lock(_ref) {
  let {
      locked
    } = _ref,
    props = _objectWithoutProperties(_ref, _excluded$1);
  return React.createElement("svg", _extends({
    width: "10",
    height: "10",
    viewBox: "0 0 15 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props), locked ? React.createElement("path", {
    d: "M5 4.63601C5 3.76031 5.24219 3.1054 5.64323 2.67357C6.03934 2.24705 6.64582 1.9783 7.5014 1.9783C8.35745 1.9783 8.96306 2.24652 9.35823 2.67208C9.75838 3.10299 10 3.75708 10 4.63325V5.99999H5V4.63601ZM4 5.99999V4.63601C4 3.58148 4.29339 2.65754 4.91049 1.99307C5.53252 1.32329 6.42675 0.978302 7.5014 0.978302C8.57583 0.978302 9.46952 1.32233 10.091 1.99162C10.7076 2.65557 11 3.57896 11 4.63325V5.99999H12C12.5523 5.99999 13 6.44771 13 6.99999V13C13 13.5523 12.5523 14 12 14H3C2.44772 14 2 13.5523 2 13V6.99999C2 6.44771 2.44772 5.99999 3 5.99999H4ZM3 6.99999H12V13H3V6.99999Z",
    fill: "currentColor",
    fillRule: "evenodd",
    clipRule: "evenodd"
  }) : React.createElement("path", {
    d: "M9 3.63601C9 2.76044 9.24207 2.11211 9.64154 1.68623C10.0366 1.26502 10.6432 1 11.5014 1C12.4485 1 13.0839 1.30552 13.4722 1.80636C13.8031 2.23312 14 2.84313 14 3.63325H15C15 2.68242 14.7626 1.83856 14.2625 1.19361C13.6389 0.38943 12.6743 0 11.5014 0C10.4294 0 9.53523 0.337871 8.91218 1.0021C8.29351 1.66167 8 2.58135 8 3.63601V6H1C0.447715 6 0 6.44772 0 7V13C0 13.5523 0.447715 14 1 14H10C10.5523 14 11 13.5523 11 13V7C11 6.44772 10.5523 6 10 6H9V3.63601ZM1 7H10V13H1V7Z",
    fill: "currentColor",
    fillRule: "evenodd",
    clipRule: "evenodd"
  }));
}
function Vector({
  value,
  onUpdate,
  settings,
  innerLabelTrim
}) {
  const {
    id,
    setSettings
  } = useInputContext();

  const {
    lock,
    locked
  } = settings;
  return React.createElement(Container, {
    withLock: lock
  }, lock && React.createElement(Lock, {
    locked: locked,
    onClick: () => setSettings({
      locked: !locked
    })
  }), Object.keys(value).map((key, i) => React.createElement(Coordinate, {
    id: i === 0 ? id : `${id}.${key}`,
    key: key,
    valueKey: key,
    value: value,
    settings: settings[key],
    onUpdate: onUpdate,
    innerLabelTrim: innerLabelTrim
  })));
}

const normalizeKeyedNumberSettings = (value, settings) => {
  const _settings = {};
  let maxStep = 0;
  let minPad = Infinity;
  Object.entries(value).forEach(([key, v]) => {
    _settings[key] = normalize$2(_objectSpread2({
      value: v
    }, settings[key])).settings;
    maxStep = Math.max(maxStep, _settings[key].step);
    minPad = Math.min(minPad, _settings[key].pad);
  });

  for (let key in _settings) {
    const {
      step,
      min,
      max
    } = settings[key] || {};
    if (!isFinite(step) && (!isFinite(min) || !isFinite(max))) {
      _settings[key].step = maxStep;
      _settings[key].pad = minPad;
    }
  }
  return _settings;
};

const _excluded = ["lock"],
  _excluded2 = ["value"];
function getVectorSchema(dimension) {
  const isVectorArray = v8n().array().length(dimension).every.number();

  const isVectorObject = o => {
    if (!o || typeof o !== 'object') return false;
    const values = Object.values(o);
    return values.length === dimension && values.every(v => isFinite(v));
  };
  return o => {
    return isVectorArray.test(o) || isVectorObject(o);
  };
}

function getVectorType(value) {
  return Array.isArray(value) ? 'array' : 'object';
}

function convert(value, format, keys) {
  if (getVectorType(value) === format) return value;
  return format === 'array' ? Object.values(value) : mapArrayToKeys(value, keys);
}

const sanitizeVector = (value, settings, previousValue) => {
  const _value = convert(value, 'object', settings.keys);
  for (let key in _value) _value[key] = sanitize$3(_value[key], settings[key]);

  const _valueKeys = Object.keys(_value);
  let newValue = {};

  if (_valueKeys.length === settings.keys.length) newValue = _value;
  else {
    const _previousValue = convert(previousValue, 'object', settings.keys);
    if (_valueKeys.length === 1 && settings.locked) {
      const lockedKey = _valueKeys[0];
      const lockedCoordinate = _value[lockedKey];
      const previousLockedCoordinate = _previousValue[lockedKey];
      const ratio = previousLockedCoordinate !== 0 ? lockedCoordinate / previousLockedCoordinate : 1;
      for (let key in _previousValue) {
        if (key === lockedKey) newValue[lockedKey] = lockedCoordinate;
        else newValue[key] = _previousValue[key] * ratio;
      }
    } else {
      newValue = _objectSpread2(_objectSpread2({}, _previousValue), _value);
    }
  }
  return convert(newValue, settings.format, settings.keys);
};

const formatVector = (value, settings) => convert(value, 'object', settings.keys);

const isNumberSettings = o => !!o && ('step' in o || 'min' in o || 'max' in o);

function normalizeVector(value, settings, defaultKeys = []) {
  const {
      lock = false
    } = settings,
    _settings = _objectWithoutProperties(settings, _excluded);
  const format = Array.isArray(value) ? 'array' : 'object';
  const keys = format === 'object' ? Object.keys(value) : defaultKeys;
  const _value = convert(value, 'object', keys);

  const mergedSettings = isNumberSettings(_settings) ? keys.reduce((acc, k) => Object.assign(acc, {
    [k]: _settings
  }), {}) : _settings;
  const numberSettings = normalizeKeyedNumberSettings(_value, mergedSettings);
  return {
    value: format === 'array' ? value : _value,
    settings: _objectSpread2(_objectSpread2({}, numberSettings), {}, {
      format,
      keys,
      lock,
      locked: false
    })
  };
}
function getVectorPlugin(defaultKeys) {
  return {
    schema: getVectorSchema(defaultKeys.length),
    normalize: _ref => {
      let {
          value
        } = _ref,
        settings = _objectWithoutProperties(_ref, _excluded2);
      return normalizeVector(value, settings, defaultKeys);
    },
    format: (value, settings) => formatVector(value, settings),
    sanitize: (value, settings, prevValue) => sanitizeVector(value, settings, prevValue)
  };
}

export { ThemeContext as $, useInputSetters as A, Plugins as B, InputContext as C, StyledInputWrapper$1 as D, useStoreContext as E, useCanvas2d as F, useInput as G, log as H, Indicator as I, StyledTitle as J, Chevron as K, Label as L, StyledWrapper as M, StyledContent as N, Overlay as O, Portal as P, StyledFolder as Q, Row as R, Scrubber as S, StyledInputRow as T, debounce as U, ValueInput as V, globalStyles as W, PanelSettingsContext as X, StoreContext as Y, mergeTheme as Z, _objectSpread2 as _, Vector as a, render as a0, register as a1, LevaInputs as a2, select as a3, number as a4, string as a5, boolean as a6, LevaStoreProvider as a7, String$1 as a8, Number$1 as a9, Boolean as aa, Select as ab, InnerLabel as ac, pad as ad, evaluate as ae, mergeRefs as af, createPlugin as ag, keyframes as ah, getVectorSchema as ai, getVectorType as aj, sanitizeVector as ak, formatVector as al, normalizeVector as am, useTransform as b, createInternalPlugin as c, useTh as d, useDrag as e, _extends as f, getVectorPlugin as g, clamp as h, _objectWithoutProperties as i, invertedRange as j, sanitizeStep as k, RangeWrapper as l, multiplyStep as m, normalizeKeyedNumberSettings as n, omit as o, pick as p, Range as q, range as r, styled as s, getUid as t, useInputContext as u, SpecialInputs as v, warn as w, LevaErreurs as x, updateInput as y, normalizeInput as z };
