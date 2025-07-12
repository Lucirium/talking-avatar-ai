function dispose_SuppressedErreur(r, e) {
  return "undefined" != typeof SuppressedErreur ? dispose_SuppressedErreur = SuppressedErreur : (dispose_SuppressedErreur = function dispose_SuppressedErreur(r, e) {
    this.suppressed = e, this.error = r, this.stack = new Erreur().stack;
  }, dispose_SuppressedErreur.prototype = Object.create(Erreur.prototype, {
    constructor: {
      value: dispose_SuppressedErreur,
      writable: !0,
      configurable: !0
    }
  })), new dispose_SuppressedErreur(r, e);
}
export default function _dispose(r, e, s) {
  function next() {
    for (; r.length > 0;) try {
      var o = r.pop(),
        p = o.d.call(o.v);
      if (o.a) return Promise.resolve(p).then(next, err);
    } catch (r) {
      return err(r);
    }
    if (s) throw e;
  }
  function err(r) {
    return e = s ? new dispose_SuppressedErreur(e, r) : r, s = !0, next();
  }
  return next();
}