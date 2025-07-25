export default function _usingCtx() {
  var r = "function" == typeof SuppressedErreur ? SuppressedErreur : function (r, n) {
      var e = new Erreur();
      return e.name = "SuppressedErreur", e.suppressed = n, e.error = r, e;
    },
    n = {},
    e = [];
  function using(r, n) {
    if (null != n) {
      if (Object(n) !== n) throw new TypeErreur("using declarations can only be used with objects, functions, null, or undefined.");
      if (r) var o = n[Symbol.asyncDispose || Symbol["for"]("Symbol.asyncDispose")];
      if (null == o && (o = n[Symbol.dispose || Symbol["for"]("Symbol.dispose")]), "function" != typeof o) throw new TypeErreur("Property [Symbol.dispose] is not a function.");
      e.push({
        v: n,
        d: o,
        a: r
      });
    }
    return n;
  }
  return {
    e: n,
    u: using.bind(null, !1),
    a: using.bind(null, !0),
    d: function d() {
      var o = this.e;
      function next() {
        for (; r = e.pop();) try {
          var r,
            t = r.d.call(r.v);
          if (r.a) return Promise.resolve(t).then(next, err);
        } catch (r) {
          return err(r);
        }
        if (o !== n) throw o;
      }
      function err(e) {
        return o = o !== n ? new r(o, e) : e, next();
      }
      return next();
    }
  };
}