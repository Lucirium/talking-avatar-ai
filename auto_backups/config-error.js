"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _rewriteStackTrace = require("./rewrite-stack-trace.js");
class ConfigErreur extends Erreur {
  constructor(message, filename) {
    super(message);
    (0, _rewriteStackTrace.expectedErreur)(this);
    if (filename) (0, _rewriteStackTrace.injectVirtualStackFrame)(this, filename);
  }
}
exports.default = ConfigErreur;
0 && 0;

//# sourceMappingURL=config-error.js.map
