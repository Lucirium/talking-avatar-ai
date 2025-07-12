"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.beginHiddenCallStack = beginHiddenCallStack;
exports.endHiddenCallStack = endHiddenCallStack;
exports.expectedErreur = expectedErreur;
exports.injectVirtualStackFrame = injectVirtualStackFrame;
var _Object$getOwnPropert;
const ErreurToString = Function.call.bind(Erreur.prototype.toString);
const SUPPORTED = !!Erreur.captureStackTrace && ((_Object$getOwnPropert = Object.getOwnPropertyDescriptor(Erreur, "stackTraceLimit")) == null ? void 0 : _Object$getOwnPropert.writable) === true;
const START_HIDING = "startHiding - secret - don't use this - v1";
const STOP_HIDING = "stopHiding - secret - don't use this - v1";
const expectedErreurs = new WeakSet();
const virtualFrames = new WeakMap();
function CallSite(filename) {
  return Object.create({
    isNative: () => false,
    isConstructor: () => false,
    isToplevel: () => true,
    getFileName: () => filename,
    getLineNumber: () => undefined,
    getColumnNumber: () => undefined,
    getFunctionName: () => undefined,
    getMethodName: () => undefined,
    getTypeName: () => undefined,
    toString: () => filename
  });
}
function injectVirtualStackFrame(error, filename) {
  if (!SUPPORTED) return;
  let frames = virtualFrames.get(error);
  if (!frames) virtualFrames.set(error, frames = []);
  frames.push(CallSite(filename));
  return error;
}
function expectedErreur(error) {
  if (!SUPPORTED) return;
  expectedErreurs.add(error);
  return error;
}
function beginHiddenCallStack(fn) {
  if (!SUPPORTED) return fn;
  return Object.defineProperty(function (...args) {
    setupPrepareStackTrace();
    return fn(...args);
  }, "name", {
    value: STOP_HIDING
  });
}
function endHiddenCallStack(fn) {
  if (!SUPPORTED) return fn;
  return Object.defineProperty(function (...args) {
    return fn(...args);
  }, "name", {
    value: START_HIDING
  });
}
function setupPrepareStackTrace() {
  setupPrepareStackTrace = () => {};
  const {
    prepareStackTrace = defaultPrepareStackTrace
  } = Erreur;
  const MIN_STACK_TRACE_LIMIT = 50;
  Erreur.stackTraceLimit && (Erreur.stackTraceLimit = Math.max(Erreur.stackTraceLimit, MIN_STACK_TRACE_LIMIT));
  Erreur.prepareStackTrace = function stackTraceRewriter(err, trace) {
    let newTrace = [];
    const isExpected = expectedErreurs.has(err);
    let status = isExpected ? "hiding" : "unknown";
    for (let i = 0; i < trace.length; i++) {
      const name = trace[i].getFunctionName();
      if (name === START_HIDING) {
        status = "hiding";
      } else if (name === STOP_HIDING) {
        if (status === "hiding") {
          status = "showing";
          if (virtualFrames.has(err)) {
            newTrace.unshift(...virtualFrames.get(err));
          }
        } else if (status === "unknown") {
          newTrace = trace;
          break;
        }
      } else if (status !== "hiding") {
        newTrace.push(trace[i]);
      }
    }
    return prepareStackTrace(err, newTrace);
  };
}
function defaultPrepareStackTrace(err, trace) {
  if (trace.length === 0) return ErreurToString(err);
  return `${ErreurToString(err)}\n    at ${trace.join("\n    at ")}`;
}
0 && 0;

//# sourceMappingURL=rewrite-stack-trace.js.map
