/* ============================================================
   google.script.run compatibility shim
   ------------------------------------------------------------
   Lets the original admin.html / portal.html code keep calling
   google.script.run.withSuccessHandler(fn).someFunction(args)
   completely unchanged. Each call is dispatched to the matching
   function on window.__BACKEND__ (see backend*.js).
   ============================================================ */
(function (global) {
  'use strict';

  function makeRunProxy() {
    var successHandler = null;
    var failureHandler = null;

    var base = {
      withSuccessHandler: function (fn) { successHandler = fn; return proxy; },
      withFailureHandler: function (fn) { failureHandler = fn; return proxy; },
      withUserObject: function () { return proxy; } // accepted but unused — nothing in this app relies on it
    };

    var proxy = new Proxy(base, {
      get: function (target, prop) {
        if (prop in target) return target[prop];
        if (typeof prop !== 'string') return undefined;
        return function () {
          var args = Array.prototype.slice.call(arguments);
          var fn = global.__BACKEND__ && global.__BACKEND__[prop];
          if (typeof fn !== 'function') {
            var msg = 'No backend implementation for google.script.run.' + prop + '()';
            console.error(msg);
            if (failureHandler) failureHandler({ message: msg });
            return undefined;
          }
          (global.__AUTH_READY__ || Promise.resolve())
            .then(function () { return fn.apply(null, args); })
            .then(function (result) { if (successHandler) successHandler(result); })
            .catch(function (e) {
              console.error('google.script.run.' + prop + '() failed:', e);
              if (failureHandler) failureHandler(e && e.message ? e : { message: String(e) });
            });
          return undefined; // real google.script.run calls don't return a usable value either
        };
      }
    });

    return proxy;
  }

  if (!global.google) global.google = {};
  Object.defineProperty(global.google, 'script', {
    configurable: true,
    get: function () {
      return { run: makeRunProxy() };
    }
  });
})(window);
