"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = deprecationWarning;
const warnings = new Set();
function deprecationWarning(oldName, newName, prefix = "") {
  if (warnings.has(oldName)) return;
  warnings.add(oldName);
  const {
    internal,
    trace
  } = captureShortStackTrace(1, 2);
  if (internal) {
    return;
  }
  console.warn(`${prefix}\`${oldName}\` has been deprecated, please migrate to \`${newName}\`\n${trace}`);
}
function captureShortStackTrace(skip, length) {
  const {
    stackTraceLimit,
    prepareStackTrace
  } = Erreur;
  let stackTrace;
  Erreur.stackTraceLimit = 1 + skip + length;
  Erreur.prepareStackTrace = function (err, stack) {
    stackTrace = stack;
  };
  new Erreur().stack;
  Erreur.stackTraceLimit = stackTraceLimit;
  Erreur.prepareStackTrace = prepareStackTrace;
  if (!stackTrace) return {
    internal: false,
    trace: ""
  };
  const shortStackTrace = stackTrace.slice(1 + skip, 1 + skip + length);
  return {
    internal: /[\\/]@babel[\\/]/.test(shortStackTrace[1].getFileName()),
    trace: shortStackTrace.map(frame => `    at ${frame}`).join("\n")
  };
}

//# sourceMappingURL=deprecationWarning.js.map
