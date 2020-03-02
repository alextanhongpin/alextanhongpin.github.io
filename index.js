
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

!(function(global) {
  "use strict";

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  var inModule = typeof module === "object";
  var runtime = global.regeneratorRuntime;
  if (runtime) {
    if (inModule) {
      // If regeneratorRuntime is defined globally and we're in a module,
      // make the exports object identical to regeneratorRuntime.
      module.exports = runtime;
    }
    // Don't bother evaluating the rest of this file if the runtime was
    // already defined globally.
    return;
  }

  // Define the runtime globally (as expected by generated code) as either
  // module.exports (if we're in a module) or a new, empty object.
  runtime = global.regeneratorRuntime = inModule ? module.exports : {};

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  runtime.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunctionPrototype[toStringTagSymbol] =
    GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      prototype[method] = function(arg) {
        return this._invoke(method, arg);
      };
    });
  }

  runtime.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  runtime.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  runtime.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return Promise.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return Promise.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration. If the Promise is rejected, however, the
          // result for this iteration will be rejected with the same
          // reason. Note that rejections of yielded Promises are not
          // thrown back into the generator function, as is the case
          // when an awaited Promise is rejected. This difference in
          // behavior between yield and await is important, because it
          // allows the consumer to decide what to do with the yielded
          // rejection (swallow it and continue, manually .throw it back
          // into the generator, abandon iteration, whatever). With
          // await, by contrast, there is no opportunity to examine the
          // rejection reason outside the generator function, so the
          // only option is to throw it from the await expression, and
          // let the generator function handle the exception.
          result.value = unwrapped;
          resolve(result);
        }, reject);
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new Promise(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  runtime.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  runtime.async = function(innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList)
    );

    return runtime.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        if (delegate.iterator.return) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[toStringTagSymbol] = "Generator";

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  runtime.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  runtime.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  };
})(
  // In sloppy mode, unbound `this` refers to the global object, fallback to
  // Function constructor if we're in global strict mode. That is sadly a form
  // of indirect eval which violates Content Security Policy.
  (function() { return this })() || Function("return this")()
);

(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
(function () {
  'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
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
      if (enumerableOnly) symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
      keys.push.apply(keys, symbols);
    }

    return keys;
  }

  function _objectSpread2(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};

      if (i % 2) {
        ownKeys(Object(source), true).forEach(function (key) {
          _defineProperty(target, key, source[key]);
        });
      } else if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
      } else {
        ownKeys(Object(source)).forEach(function (key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
    }

    return target;
  }

  var RECYCLED_NODE = 1;
  var LAZY_NODE = 2;
  var TEXT_NODE = 3;
  var EMPTY_OBJ = {};
  var EMPTY_ARR = [];
  var map = EMPTY_ARR.map;
  var isArray = Array.isArray;
  var defer = typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : setTimeout;

  var createClass = function createClass(obj) {
    var out = "";
    if (typeof obj === "string") { return obj; }

    if (isArray(obj) && obj.length > 0) {
      for (var k = 0, tmp; k < obj.length; k++) {
        if ((tmp = createClass(obj[k])) !== "") {
          out += (out && " ") + tmp;
        }
      }
    } else {
      for (var k in obj) {
        if (obj[k]) {
          out += (out && " ") + k;
        }
      }
    }

    return out;
  };

  var merge = function merge(a, b) {
    var out = {};

    for (var k in a) {
      out[k] = a[k];
    }

    for (var k in b) {
      out[k] = b[k];
    }

    return out;
  };

  var batch = function batch(list) {
    return list.reduce(function (out, item) {
      return out.concat(!item || item === true ? 0 : typeof item[0] === "function" ? [item] : batch(item));
    }, EMPTY_ARR);
  };

  var isSameAction = function isSameAction(a, b) {
    return isArray(a) && isArray(b) && a[0] === b[0] && typeof a[0] === "function";
  };

  var shouldRestart = function shouldRestart(a, b) {
    if (a !== b) {
      for (var k in merge(a, b)) {
        if (a[k] !== b[k] && !isSameAction(a[k], b[k])) { return true; }
        b[k] = a[k];
      }
    }
  };

  var patchSubs = function patchSubs(oldSubs, newSubs, dispatch) {
    for (var i = 0, oldSub, newSub, subs = []; i < oldSubs.length || i < newSubs.length; i++) {
      oldSub = oldSubs[i];
      newSub = newSubs[i];
      subs.push(newSub ? !oldSub || newSub[0] !== oldSub[0] || shouldRestart(newSub[1], oldSub[1]) ? [newSub[0], newSub[1], newSub[0](dispatch, newSub[1]), oldSub && oldSub[2]()] : oldSub : oldSub && oldSub[2]());
    }

    return subs;
  };

  var patchProperty = function patchProperty(node, key, oldValue, newValue, listener, isSvg) {
    if (key === "key") ; else if (key === "style") {
      for (var k in merge(oldValue, newValue)) {
        oldValue = newValue == null || newValue[k] == null ? "" : newValue[k];

        if (k[0] === "-") {
          node[key].setProperty(k, oldValue);
        } else {
          node[key][k] = oldValue;
        }
      }
    } else if (key[0] === "o" && key[1] === "n") {
      if (!((node.actions || (node.actions = {}))[key = key.slice(2).toLowerCase()] = newValue)) {
        node.removeEventListener(key, listener);
      } else if (!oldValue) {
        node.addEventListener(key, listener);
      }
    } else if (!isSvg && key !== "list" && key in node) {
      node[key] = newValue == null ? "" : newValue;
    } else if (newValue == null || newValue === false || key === "class" && !(newValue = createClass(newValue))) {
      node.removeAttribute(key);
    } else {
      node.setAttribute(key, newValue);
    }
  };

  var createNode = function createNode(vdom, listener, isSvg) {
    var ns = "http://www.w3.org/2000/svg";
    var props = vdom.props;
    var node = vdom.type === TEXT_NODE ? document.createTextNode(vdom.name) : (isSvg = isSvg || vdom.name === "svg") ? document.createElementNS(ns, vdom.name, {
      is: props.is
    }) : document.createElement(vdom.name, {
      is: props.is
    });

    for (var k in props) {
      patchProperty(node, k, null, props[k], listener, isSvg);
    }

    for (var i = 0, len = vdom.children.length; i < len; i++) {
      node.appendChild(createNode(vdom.children[i] = getVNode(vdom.children[i]), listener, isSvg));
    }

    return vdom.node = node;
  };

  var getKey = function getKey(vdom) {
    return vdom == null ? null : vdom.key;
  };

  var patch = function patch(parent, node, oldVNode, newVNode, listener, isSvg) {
    if (oldVNode === newVNode) ; else if (oldVNode != null && oldVNode.type === TEXT_NODE && newVNode.type === TEXT_NODE) {
      if (oldVNode.name !== newVNode.name) { node.nodeValue = newVNode.name; }
    } else if (oldVNode == null || oldVNode.name !== newVNode.name) {
      node = parent.insertBefore(createNode(newVNode = getVNode(newVNode), listener, isSvg), node);

      if (oldVNode != null) {
        parent.removeChild(oldVNode.node);
      }
    } else {
      var tmpVKid;
      var oldVKid;
      var oldKey;
      var newKey;
      var oldVProps = oldVNode.props;
      var newVProps = newVNode.props;
      var oldVKids = oldVNode.children;
      var newVKids = newVNode.children;
      var oldHead = 0;
      var newHead = 0;
      var oldTail = oldVKids.length - 1;
      var newTail = newVKids.length - 1;
      isSvg = isSvg || newVNode.name === "svg";

      for (var i in merge(oldVProps, newVProps)) {
        if ((i === "value" || i === "selected" || i === "checked" ? node[i] : oldVProps[i]) !== newVProps[i]) {
          patchProperty(node, i, oldVProps[i], newVProps[i], listener, isSvg);
        }
      }

      while (newHead <= newTail && oldHead <= oldTail) {
        if ((oldKey = getKey(oldVKids[oldHead])) == null || oldKey !== getKey(newVKids[newHead])) {
          break;
        }

        patch(node, oldVKids[oldHead].node, oldVKids[oldHead], newVKids[newHead] = getVNode(newVKids[newHead++], oldVKids[oldHead++]), listener, isSvg);
      }

      while (newHead <= newTail && oldHead <= oldTail) {
        if ((oldKey = getKey(oldVKids[oldTail])) == null || oldKey !== getKey(newVKids[newTail])) {
          break;
        }

        patch(node, oldVKids[oldTail].node, oldVKids[oldTail], newVKids[newTail] = getVNode(newVKids[newTail--], oldVKids[oldTail--]), listener, isSvg);
      }

      if (oldHead > oldTail) {
        while (newHead <= newTail) {
          node.insertBefore(createNode(newVKids[newHead] = getVNode(newVKids[newHead++]), listener, isSvg), (oldVKid = oldVKids[oldHead]) && oldVKid.node);
        }
      } else if (newHead > newTail) {
        while (oldHead <= oldTail) {
          node.removeChild(oldVKids[oldHead++].node);
        }
      } else {
        for (var i = oldHead, keyed = {}, newKeyed = {}; i <= oldTail; i++) {
          if ((oldKey = oldVKids[i].key) != null) {
            keyed[oldKey] = oldVKids[i];
          }
        }

        while (newHead <= newTail) {
          oldKey = getKey(oldVKid = oldVKids[oldHead]);
          newKey = getKey(newVKids[newHead] = getVNode(newVKids[newHead], oldVKid));

          if (newKeyed[oldKey] || newKey != null && newKey === getKey(oldVKids[oldHead + 1])) {
            if (oldKey == null) {
              node.removeChild(oldVKid.node);
            }

            oldHead++;
            continue;
          }

          if (newKey == null || oldVNode.type === RECYCLED_NODE) {
            if (oldKey == null) {
              patch(node, oldVKid && oldVKid.node, oldVKid, newVKids[newHead], listener, isSvg);
              newHead++;
            }

            oldHead++;
          } else {
            if (oldKey === newKey) {
              patch(node, oldVKid.node, oldVKid, newVKids[newHead], listener, isSvg);
              newKeyed[newKey] = true;
              oldHead++;
            } else {
              if ((tmpVKid = keyed[newKey]) != null) {
                patch(node, node.insertBefore(tmpVKid.node, oldVKid && oldVKid.node), tmpVKid, newVKids[newHead], listener, isSvg);
                newKeyed[newKey] = true;
              } else {
                patch(node, oldVKid && oldVKid.node, null, newVKids[newHead], listener, isSvg);
              }
            }

            newHead++;
          }
        }

        while (oldHead <= oldTail) {
          if (getKey(oldVKid = oldVKids[oldHead++]) == null) {
            node.removeChild(oldVKid.node);
          }
        }

        for (var i in keyed) {
          if (newKeyed[i] == null) {
            node.removeChild(keyed[i].node);
          }
        }
      }
    }

    return newVNode.node = node;
  };

  var propsChanged = function propsChanged(a, b) {
    for (var k in a) {
      if (a[k] !== b[k]) { return true; }
    }

    for (var k in b) {
      if (a[k] !== b[k]) { return true; }
    }
  };

  var getTextVNode = function getTextVNode(node) {
    return _typeof(node) === "object" ? node : createTextVNode(node);
  };

  var getVNode = function getVNode(newVNode, oldVNode) {
    return newVNode.type === LAZY_NODE ? ((!oldVNode || !oldVNode.lazy || propsChanged(oldVNode.lazy, newVNode.lazy)) && ((oldVNode = getTextVNode(newVNode.lazy.view(newVNode.lazy))).lazy = newVNode.lazy), oldVNode) : newVNode;
  };

  var createVNode = function createVNode(name, props, children, node, key, type) {
    return {
      name: name,
      props: props,
      children: children,
      node: node,
      type: type,
      key: key
    };
  };

  var createTextVNode = function createTextVNode(value, node) {
    return createVNode(value, EMPTY_OBJ, EMPTY_ARR, node, undefined, TEXT_NODE);
  };

  var recycleNode = function recycleNode(node) {
    return node.nodeType === TEXT_NODE ? createTextVNode(node.nodeValue, node) : createVNode(node.nodeName.toLowerCase(), EMPTY_OBJ, map.call(node.childNodes, recycleNode), node, undefined, RECYCLED_NODE);
  };
  var h = function h(name, props) {
    var arguments$1 = arguments;

    for (var vdom, rest = [], children = [], i = arguments.length; i-- > 2;) {
      rest.push(arguments$1[i]);
    }

    while (rest.length > 0) {
      if (isArray(vdom = rest.pop())) {
        for (var i = vdom.length; i-- > 0;) {
          rest.push(vdom[i]);
        }
      } else if (vdom === false || vdom === true || vdom == null) ; else {
        children.push(getTextVNode(vdom));
      }
    }

    props = props || EMPTY_OBJ;
    return typeof name === "function" ? name(props, children) : createVNode(name, props, children, undefined, props.key);
  };
  var app = function app(props) {
    var state = {};
    var lock = false;
    var view = props.view;
    var node = props.node;
    var vdom = node && recycleNode(node);
    var subscriptions = props.subscriptions;
    var subs = [];

    var listener = function listener(event) {
      dispatch(this.actions[event.type], event);
    };

    var setState = function setState(newState) {
      if (state !== newState) {
        state = newState;

        if (subscriptions) {
          subs = patchSubs(subs, batch([subscriptions(state)]), dispatch);
        }

        if (view && !lock) { defer(render, lock = true); }
      }

      return state;
    };

    var dispatch = (props.middleware || function (obj) {
      return obj;
    })(function (action, props) {
      return typeof action === "function" ? dispatch(action(state, props)) : isArray(action) ? typeof action[0] === "function" || isArray(action[0]) ? dispatch(action[0], typeof action[1] === "function" ? action[1](props) : action[1]) : (batch(action.slice(1)).map(function (fx) {
        fx && fx[0](dispatch, fx[1]);
      }, setState(action[0])), state) : setState(action);
    });

    var render = function render() {
      lock = false;
      node = patch(node.parentNode, node, vdom, vdom = getTextVNode(view(state)), listener);
    };

    dispatch(props.init);
  };

  var component = function component(_ref) {
    var header = _ref.header,
        _ref$username = _ref.username,
        username = _ref$username === void 0 ? 'john doe' : _ref$username,
        profileImg = _ref.profileImg;
    return h("header", {
      "class": 'header'
    }, h("div", {
      "class": 'header-column'
    }, h("div", {
      "class": 'header-photo-holder'
    }, h("div", {
      "class": 'header-photo',
      style: {
        background: "url(".concat(profileImg, ") no-repeat center center / cover")
      }
    }), h("div", {
      "class": 'header-username'
    }, h("h6", null, username)))));
  };

  var typewriterModule = {
    state: {
      heading: '',
      headingGhost: 'Hi, I am Alex.',
      subheading: '',
      subheadingGhost: 'This is my journey as a Developer.'
    },
    actions: {
      updateHeading: function updateHeading(value) {
        return function (state) {
          return {
            heading: state.heading + value
          };
        };
      },
      updateSubheading: function updateSubheading(value) {
        return function (state) {
          return {
            subheading: state.subheading + value
          };
        };
      },
      resetHeading: function resetHeading(value) {
        return function (state) {
          return {
            heading: ''
          };
        };
      },
      resetSubheading: function resetSubheading(value) {
        return function (state) {
          return {
            subheading: ''
          };
        };
      }
    }
  };

  var bookModule = {
    state: {
      books: [{
        title: 'Emotional Intelligence',
        author: 'Daniel Goleman'
      }, {
        title: 'The Gift of Fear',
        author: 'Gavin de Becker'
      }, {
        title: 'Influence: The Psychology of Persuasion',
        author: 'Robert B. Cialdini'
      }, {
        title: 'The 48 Laws of Powers',
        author: 'Robert Greene'
      }, {
        title: 'The Art of Seduction',
        author: 'Robert Greene'
      }, {
        title: 'Mastery',
        author: 'Robert Greene'
      }, {
        title: 'The Tipping Point: How Little Things can Make a Big Difference',
        author: 'Malcolm T. Gladwell'
      }, {
        title: 'Blink: The Power of Thinking Without Thinking',
        author: 'Malcolm T. Gladwell'
      }, {
        title: 'Outliers: The Story of Success',
        author: 'Malcolm T. Gladwell'
      }, {
        title: 'What the Dog Saw: And other Adventures',
        author: 'Malcolm T. Gladwell'
      }, {
        title: 'David and Goliath: Underdogs, Misfits, and the Art of Battling Giants',
        author: 'Malcolm T. Gladwell'
      }, {
        title: 'Lateral Thinking',
        author: 'Edward de Bono'
      }, {
        title: 'Simplicity',
        author: 'Edward de Bono'
      }, {
        title: 'Six Thinking Hats',
        author: 'Edward de Bono'
      }, {
        title: 'Po: Beyond Yes and No',
        author: 'Edward de Bono'
      }, {
        title: 'Emotional Blackmail: When the People in Your Life Use Fear, Obligation, and Guilt to Manipulate You',
        author: 'Susan Forward'
      }, {
        title: 'Games People Play: The Psychology of Human Relationships',
        author: 'Eric Berne'
      }, {
        title: '50 Psychology Classics: Who We Are, How We Think, What We Do: Insight and Inspiration from 50 Key Books',
        author: 'Tom Butler Bowdown'
      }, {
        title: 'The Psychology of Self Esteem',
        author: 'Nathaniel Branden'
      }, {
        title: 'Creativity: Flow and the Psychology of Discovery and Inventions',
        author: 'Mihaly Csikzentmihalyi'
      }, {
        title: 'My Voice Will Go With You',
        author: 'Milton Erikson'
      }, {
        title: 'How Technology is Changing our Minds for the Better.',
        author: 'Clive Thompson'
      }]
    }
  };

  var singaporeNdp = [{
    "name": "DSCF3738.jpg",
    "dof": "4.0",
    "shutterSpeed": "918/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3739.jpg",
    "dof": "4.0",
    "shutterSpeed": "1200/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3740.jpg",
    "dof": "4.0",
    "shutterSpeed": "1116/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3741.jpg",
    "dof": "4.0",
    "shutterSpeed": "1100/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3742.jpg",
    "dof": "4.0",
    "shutterSpeed": "1042/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3743.jpg",
    "dof": "4.0",
    "shutterSpeed": "1106/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3744.jpg",
    "dof": "4.0",
    "shutterSpeed": "1160/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3745.jpg",
    "dof": "4.0",
    "shutterSpeed": "1113/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3746.jpg",
    "dof": "4.0",
    "shutterSpeed": "1126/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3747.jpg",
    "dof": "4.0",
    "shutterSpeed": "1144/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3748.jpg",
    "dof": "4.0",
    "shutterSpeed": "1095/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3749.jpg",
    "dof": "4.0",
    "shutterSpeed": "1148/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3750.jpg",
    "dof": "4.0",
    "shutterSpeed": "941/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3751.jpg",
    "dof": "4.0",
    "shutterSpeed": "1142/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3752.jpg",
    "dof": "1.0",
    "shutterSpeed": "1176/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3753.jpg",
    "dof": "1.0",
    "shutterSpeed": "1088/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3754.jpg",
    "dof": "4.0",
    "shutterSpeed": "1098/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3755.jpg",
    "dof": "4.0",
    "shutterSpeed": "992/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3756.jpg",
    "dof": "4.0",
    "shutterSpeed": "1080/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3757.jpg",
    "dof": "4.0",
    "shutterSpeed": "918/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3758.jpg",
    "dof": "4.0",
    "shutterSpeed": "1004/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3759.jpg",
    "dof": "4.0",
    "shutterSpeed": "995/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3760.jpg",
    "dof": "4.0",
    "shutterSpeed": "960/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3761.jpg",
    "dof": "4.0",
    "shutterSpeed": "985/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3762.jpg",
    "dof": "4.0",
    "shutterSpeed": "1158/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3763.jpg",
    "dof": "4.0",
    "shutterSpeed": "1154/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3764.jpg",
    "dof": "4.0",
    "shutterSpeed": "1127/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3765.jpg",
    "dof": "4.0",
    "shutterSpeed": "1147/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3766.jpg",
    "dof": "4.0",
    "shutterSpeed": "1149/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3767.jpg",
    "dof": "4.0",
    "shutterSpeed": "902/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3768.jpg",
    "dof": "2.0",
    "shutterSpeed": "1200/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3769.jpg",
    "dof": "4.0",
    "shutterSpeed": "1118/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3770.jpg",
    "dof": "3.0",
    "shutterSpeed": "1122/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3771.jpg",
    "dof": "3.0",
    "shutterSpeed": "1062/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3773.jpg",
    "dof": "2.0",
    "shutterSpeed": "1114/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3775.jpg",
    "dof": "2.0",
    "shutterSpeed": "1177/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3776.jpg",
    "dof": "4.0",
    "shutterSpeed": "1050/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3777.jpg",
    "dof": "1.0",
    "shutterSpeed": "1082/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3778.jpg",
    "dof": "1.0",
    "shutterSpeed": "1047/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3779.jpg",
    "dof": "1.0",
    "shutterSpeed": "1103/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3780.jpg",
    "dof": "4.0",
    "shutterSpeed": "931/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3783.jpg",
    "dof": "4.0",
    "shutterSpeed": "1125/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3784.jpg",
    "dof": "4.0",
    "shutterSpeed": "1117/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3785.jpg",
    "dof": "4.0",
    "shutterSpeed": "1111/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3786.jpg",
    "dof": "4.0",
    "shutterSpeed": "1009/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3788.jpg",
    "dof": "4.0",
    "shutterSpeed": "1052/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3789.jpg",
    "dof": "4.0",
    "shutterSpeed": "1117/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3790.jpg",
    "dof": "4.0",
    "shutterSpeed": "1075/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3791.jpg",
    "dof": "4.0",
    "shutterSpeed": "882/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3792.jpg",
    "dof": "4.0",
    "shutterSpeed": "969/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3793.jpg",
    "dof": "4.0",
    "shutterSpeed": "986/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3794.jpg",
    "dof": "4.0",
    "shutterSpeed": "963/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3795.jpg",
    "dof": "4.0",
    "shutterSpeed": "1063/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3796.jpg",
    "dof": "6.0",
    "shutterSpeed": "1002/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3797.jpg",
    "dof": "6.0",
    "shutterSpeed": "1002/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3799.jpg",
    "dof": "4.0",
    "shutterSpeed": "1156/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3800.jpg",
    "dof": "4.0",
    "shutterSpeed": "1134/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3801.jpg",
    "dof": "4.0",
    "shutterSpeed": "1006/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3803.jpg",
    "dof": "4.0",
    "shutterSpeed": "1036/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3805.jpg",
    "dof": "4.0",
    "shutterSpeed": "1181/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3806.jpg",
    "dof": "4.0",
    "shutterSpeed": "1192/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3807.jpg",
    "dof": "4.0",
    "shutterSpeed": "1004/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3808.jpg",
    "dof": "4.0",
    "shutterSpeed": "1159/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3809.jpg",
    "dof": "4.0",
    "shutterSpeed": "935/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3810.jpg",
    "dof": "4.0",
    "shutterSpeed": "1009/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3811.jpg",
    "dof": "4.0",
    "shutterSpeed": "937/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3812.jpg",
    "dof": "4.0",
    "shutterSpeed": "912/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3813.jpg",
    "dof": "4.0",
    "shutterSpeed": "1064/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3814.jpg",
    "dof": "4.0",
    "shutterSpeed": "1127/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3815.jpg",
    "dof": "4.0",
    "shutterSpeed": "1109/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3816.jpg",
    "dof": "4.0",
    "shutterSpeed": "1068/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3817.jpg",
    "dof": "4.0",
    "shutterSpeed": "1069/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3818.jpg",
    "dof": "4.0",
    "shutterSpeed": "981/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3820.jpg",
    "dof": "4.0",
    "shutterSpeed": "1060/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3821.jpg",
    "dof": "4.0",
    "shutterSpeed": "1099/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3822.jpg",
    "dof": "4.0",
    "shutterSpeed": "1065/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3823.jpg",
    "dof": "3.0",
    "shutterSpeed": "1171/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3826.jpg",
    "dof": "3.0",
    "shutterSpeed": "1089/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3827.jpg",
    "dof": "1.0",
    "shutterSpeed": "919/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3829.jpg",
    "dof": "1.0",
    "shutterSpeed": "1141/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3830.jpg",
    "dof": "1.0",
    "shutterSpeed": "926/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3831.jpg",
    "dof": "1.0",
    "shutterSpeed": "1182/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3833.jpg",
    "dof": "1.0",
    "shutterSpeed": "929/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3834.jpg",
    "dof": "4.0",
    "shutterSpeed": "990/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3836.jpg",
    "dof": "1.0",
    "shutterSpeed": "600/100",
    "iso": 640,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3840.jpg",
    "dof": "1.0",
    "shutterSpeed": "481/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3841.jpg",
    "dof": "1.0",
    "shutterSpeed": "508/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3842.jpg",
    "dof": "1.0",
    "shutterSpeed": "600/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3849.jpg",
    "dof": "1.0",
    "shutterSpeed": "442/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3864.jpg",
    "dof": "1.0",
    "shutterSpeed": "508/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3867.jpg",
    "dof": "1.0",
    "shutterSpeed": "486/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3868.jpg",
    "dof": "1.0",
    "shutterSpeed": "523/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3869.jpg",
    "dof": "1.0",
    "shutterSpeed": "528/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3870.jpg",
    "dof": "1.0",
    "shutterSpeed": "532/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3871.jpg",
    "dof": "1.0",
    "shutterSpeed": "467/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3872.jpg",
    "dof": "1.0",
    "shutterSpeed": "501/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3873.jpg",
    "dof": "1.0",
    "shutterSpeed": "458/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3874.jpg",
    "dof": "1.0",
    "shutterSpeed": "480/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3875.jpg",
    "dof": "1.0",
    "shutterSpeed": "455/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3876.jpg",
    "dof": "1.0",
    "shutterSpeed": "514/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3877.jpg",
    "dof": "1.0",
    "shutterSpeed": "496/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3878.jpg",
    "dof": "1.0",
    "shutterSpeed": "573/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3879.jpg",
    "dof": "1.0",
    "shutterSpeed": "551/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3880.jpg",
    "dof": "1.0",
    "shutterSpeed": "372/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3881.jpg",
    "dof": "1.0",
    "shutterSpeed": "533/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3882.jpg",
    "dof": "1.0",
    "shutterSpeed": "551/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3883.jpg",
    "dof": "1.0",
    "shutterSpeed": "515/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3885.jpg",
    "dof": "1.0",
    "shutterSpeed": "501/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3886.jpg",
    "dof": "1.0",
    "shutterSpeed": "571/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3887.jpg",
    "dof": "1.0",
    "shutterSpeed": "504/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3888.jpg",
    "dof": "1.0",
    "shutterSpeed": "510/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3889.jpg",
    "dof": "1.0",
    "shutterSpeed": "600/100",
    "iso": 250,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3894.jpg",
    "dof": "1.0",
    "shutterSpeed": "570/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3895.jpg",
    "dof": "1.0",
    "shutterSpeed": "566/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3896.jpg",
    "dof": "1.0",
    "shutterSpeed": "544/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3898.jpg",
    "dof": "1.0",
    "shutterSpeed": "523/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3899.jpg",
    "dof": "1.0",
    "shutterSpeed": "599/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3900.jpg",
    "dof": "1.0",
    "shutterSpeed": "535/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3903.jpg",
    "dof": "1.0",
    "shutterSpeed": "541/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3911.jpg",
    "dof": "1.0",
    "shutterSpeed": "359/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3912.jpg",
    "dof": "1.0",
    "shutterSpeed": "400/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3913.jpg",
    "dof": "1.0",
    "shutterSpeed": "578/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3914.jpg",
    "dof": "1.0",
    "shutterSpeed": "554/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3915.jpg",
    "dof": "1.0",
    "shutterSpeed": "486/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3917.jpg",
    "dof": "1.0",
    "shutterSpeed": "555/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3919.jpg",
    "dof": "1.0",
    "shutterSpeed": "600/100",
    "iso": 640,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3920.jpg",
    "dof": "1.0",
    "shutterSpeed": "600/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3921.jpg",
    "dof": "1.0",
    "shutterSpeed": "589/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3923.jpg",
    "dof": "1.0",
    "shutterSpeed": "600/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3924.jpg",
    "dof": "1.0",
    "shutterSpeed": "502/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3926.jpg",
    "dof": "1.0",
    "shutterSpeed": "524/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3927.jpg",
    "dof": "1.0",
    "shutterSpeed": "442/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3928.jpg",
    "dof": "1.0",
    "shutterSpeed": "484/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3929.jpg",
    "dof": "1.0",
    "shutterSpeed": "402/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3933.jpg",
    "dof": "1.0",
    "shutterSpeed": "562/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3934.jpg",
    "dof": "1.0",
    "shutterSpeed": "578/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3935.jpg",
    "dof": "1.0",
    "shutterSpeed": "600/100",
    "iso": 640,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3936.jpg",
    "dof": "1.0",
    "shutterSpeed": "553/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3937.jpg",
    "dof": "1.0",
    "shutterSpeed": "568/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3940.jpg",
    "dof": "1.0",
    "shutterSpeed": "587/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3941.jpg",
    "dof": "1.0",
    "shutterSpeed": "595/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3942.jpg",
    "dof": "1.0",
    "shutterSpeed": "568/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3943.jpg",
    "dof": "1.0",
    "shutterSpeed": "595/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3944.jpg",
    "dof": "1.0",
    "shutterSpeed": "590/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3945.jpg",
    "dof": "1.0",
    "shutterSpeed": "600/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3946.jpg",
    "dof": "1.0",
    "shutterSpeed": "600/100",
    "iso": 640,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3947.jpg",
    "dof": "1.0",
    "shutterSpeed": "585/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3948.jpg",
    "dof": "1.0",
    "shutterSpeed": "600/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3949.jpg",
    "dof": "1.0",
    "shutterSpeed": "584/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3950.jpg",
    "dof": "1.0",
    "shutterSpeed": "590/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3951.jpg",
    "dof": "1.0",
    "shutterSpeed": "600/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3952.jpg",
    "dof": "1.0",
    "shutterSpeed": "600/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3953.jpg",
    "dof": "1.0",
    "shutterSpeed": "600/100",
    "iso": 640,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3954.jpg",
    "dof": "1.0",
    "shutterSpeed": "571/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3957.jpg",
    "dof": "1.0",
    "shutterSpeed": "600/100",
    "iso": 500,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3958.jpg",
    "dof": "1.0",
    "shutterSpeed": "600/100",
    "iso": 640,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3959.jpg",
    "dof": "1.0",
    "shutterSpeed": "545/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3960.jpg",
    "dof": "1.0",
    "shutterSpeed": "574/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3961.jpg",
    "dof": "1.0",
    "shutterSpeed": "585/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3962.jpg",
    "dof": "1.0",
    "shutterSpeed": "587/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3963.jpg",
    "dof": "1.0",
    "shutterSpeed": "568/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3964.jpg",
    "dof": "1.0",
    "shutterSpeed": "582/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3965.jpg",
    "dof": "1.0",
    "shutterSpeed": "600/100",
    "iso": 640,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3966.jpg",
    "dof": "1.0",
    "shutterSpeed": "600/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3967.jpg",
    "dof": "1.0",
    "shutterSpeed": "597/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3968.jpg",
    "dof": "1.0",
    "shutterSpeed": "600/100",
    "iso": 640,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3969.jpg",
    "dof": "1.0",
    "shutterSpeed": "588/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3970.jpg",
    "dof": "1.0",
    "shutterSpeed": "600/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3972.jpg",
    "dof": "1.0",
    "shutterSpeed": "598/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3973.jpg",
    "dof": "1.0",
    "shutterSpeed": "464/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3975.jpg",
    "dof": "1.0",
    "shutterSpeed": "466/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3976.jpg",
    "dof": "1.0",
    "shutterSpeed": "445/100",
    "iso": 800,
    "width": 1920,
    "height": 1082
  }];

  var singaporeRandom = [{
    "name": "DSCF3626.jpg",
    "dof": "3.0",
    "shutterSpeed": "1024/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3627.jpg",
    "dof": "3.0",
    "shutterSpeed": "1188/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3628.jpg",
    "dof": "3.0",
    "shutterSpeed": "1112/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3629.jpg",
    "dof": "3.0",
    "shutterSpeed": "694/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3630.jpg",
    "dof": "3.0",
    "shutterSpeed": "765/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3631.jpg",
    "dof": "3.0",
    "shutterSpeed": "815/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3633.jpg",
    "dof": "3.0",
    "shutterSpeed": "866/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3634.jpg",
    "dof": "3.0",
    "shutterSpeed": "1050/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3635.jpg",
    "dof": "3.0",
    "shutterSpeed": "1003/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3638.jpg",
    "dof": "3.0",
    "shutterSpeed": "724/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3641.jpg",
    "dof": "3.0",
    "shutterSpeed": "979/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3642.jpg",
    "dof": "1.0",
    "shutterSpeed": "1122/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3643.jpg",
    "dof": "1.0",
    "shutterSpeed": "945/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3722.jpg",
    "dof": "1.0",
    "shutterSpeed": "655/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3723.jpg",
    "dof": "1.0",
    "shutterSpeed": "752/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3724.jpg",
    "dof": "1.0",
    "shutterSpeed": "987/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3725.jpg",
    "dof": "1.0",
    "shutterSpeed": "986/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3726.jpg",
    "dof": "1.0",
    "shutterSpeed": "999/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3727.jpg",
    "dof": "1.0",
    "shutterSpeed": "1004/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3728.jpg",
    "dof": "1.0",
    "shutterSpeed": "600/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3729.jpg",
    "dof": "1.0",
    "shutterSpeed": "600/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3730.jpg",
    "dof": "1.0",
    "shutterSpeed": "891/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3731.jpg",
    "dof": "1.0",
    "shutterSpeed": "987/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3732.jpg",
    "dof": "1.0",
    "shutterSpeed": "1088/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3733.jpg",
    "dof": "1.0",
    "shutterSpeed": "942/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3734.jpg",
    "dof": "1.0",
    "shutterSpeed": "926/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }];

  var singaporeClarkeQuay = [{
    "name": "DSCF3648.jpg",
    "dof": "1.0",
    "shutterSpeed": "1018/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3649.jpg",
    "dof": "6.0",
    "shutterSpeed": "669/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3651.jpg",
    "dof": "6.0",
    "shutterSpeed": "600/100",
    "iso": 250,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3652.jpg",
    "dof": "6.0",
    "shutterSpeed": "703/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3653.jpg",
    "dof": "1.0",
    "shutterSpeed": "1131/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3655.jpg",
    "dof": "3.0",
    "shutterSpeed": "1088/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3657.jpg",
    "dof": "4.0",
    "shutterSpeed": "994/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3661.jpg",
    "dof": "1.0",
    "shutterSpeed": "1167/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3663.jpg",
    "dof": "1.0",
    "shutterSpeed": "1094/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3665.jpg",
    "dof": "4.0",
    "shutterSpeed": "785/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3666.jpg",
    "dof": "4.0",
    "shutterSpeed": "823/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3668.jpg",
    "dof": "1.0",
    "shutterSpeed": "1017/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3669.jpg",
    "dof": "4.0",
    "shutterSpeed": "1004/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3670.jpg",
    "dof": "4.0",
    "shutterSpeed": "795/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3672.jpg",
    "dof": "1.0",
    "shutterSpeed": "1200/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3673.jpg",
    "dof": "1.0",
    "shutterSpeed": "1161/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3674.jpg",
    "dof": "1.0",
    "shutterSpeed": "1085/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3675.jpg",
    "dof": "1.0",
    "shutterSpeed": "846/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3676.jpg",
    "dof": "3.0",
    "shutterSpeed": "991/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3677.jpg",
    "dof": "1.0",
    "shutterSpeed": "1098/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3678.jpg",
    "dof": "1.0",
    "shutterSpeed": "1106/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3679.jpg",
    "dof": "1.0",
    "shutterSpeed": "1099/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3680.jpg",
    "dof": "1.0",
    "shutterSpeed": "974/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3681.jpg",
    "dof": "1.0",
    "shutterSpeed": "1102/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3682.jpg",
    "dof": "1.0",
    "shutterSpeed": "1166/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3683.jpg",
    "dof": "1.0",
    "shutterSpeed": "1200/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3684.jpg",
    "dof": "3.0",
    "shutterSpeed": "1068/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3685.jpg",
    "dof": "1.0",
    "shutterSpeed": "996/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3686.jpg",
    "dof": "1.0",
    "shutterSpeed": "1071/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3688.jpg",
    "dof": "1.0",
    "shutterSpeed": "1192/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3689.jpg",
    "dof": "3.0",
    "shutterSpeed": "1048/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3691.jpg",
    "dof": "1.0",
    "shutterSpeed": "1114/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3692.jpg",
    "dof": "1.0",
    "shutterSpeed": "908/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3693.jpg",
    "dof": "1.0",
    "shutterSpeed": "753/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3694.jpg",
    "dof": "1.0",
    "shutterSpeed": "914/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3695.jpg",
    "dof": "1.0",
    "shutterSpeed": "931/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3696.jpg",
    "dof": "3.0",
    "shutterSpeed": "1041/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3698.jpg",
    "dof": "1.0",
    "shutterSpeed": "1175/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3699.jpg",
    "dof": "1.0",
    "shutterSpeed": "1015/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3700.jpg",
    "dof": "4.0",
    "shutterSpeed": "882/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3702.jpg",
    "dof": "4.0",
    "shutterSpeed": "944/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3703.jpg",
    "dof": "4.0",
    "shutterSpeed": "991/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3704.jpg",
    "dof": "4.0",
    "shutterSpeed": "863/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3705.jpg",
    "dof": "4.0",
    "shutterSpeed": "797/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3706.jpg",
    "dof": "1.0",
    "shutterSpeed": "940/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3707.jpg",
    "dof": "1.0",
    "shutterSpeed": "1192/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3710.jpg",
    "dof": "3.0",
    "shutterSpeed": "861/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3711.jpg",
    "dof": "3.0",
    "shutterSpeed": "1142/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3712.jpg",
    "dof": "3.0",
    "shutterSpeed": "1037/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3713.jpg",
    "dof": "3.0",
    "shutterSpeed": "1150/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3714.jpg",
    "dof": "3.0",
    "shutterSpeed": "1136/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3715.jpg",
    "dof": "3.0",
    "shutterSpeed": "1073/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3716.jpg",
    "dof": "3.0",
    "shutterSpeed": "1161/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3717.jpg",
    "dof": "1.0",
    "shutterSpeed": "985/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3718.jpg",
    "dof": "1.0",
    "shutterSpeed": "836/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3720.jpg",
    "dof": "1.0",
    "shutterSpeed": "824/100",
    "iso": 200,
    "width": 1920,
    "height": 1082
  }];

  var klLife = [{
    'name': 'DSCF3504.jpg',
    'dof': '2.0',
    'shutterSpeed': '1185/100',
    'iso': 200,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3505.jpg',
    'dof': '2.0',
    'shutterSpeed': '1053/100',
    'iso': 200,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3506.jpg',
    'dof': '2.0',
    'shutterSpeed': '921/100',
    'iso': 200,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3507.jpg',
    'dof': '1.0',
    'shutterSpeed': '903/100',
    'iso': 200,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3508.jpg',
    'dof': '1.0',
    'shutterSpeed': '600/100',
    'iso': 200,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3509.jpg',
    'dof': '1.0',
    'shutterSpeed': '971/100',
    'iso': 200,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3510.jpg',
    'dof': '1.0',
    'shutterSpeed': '600/100',
    'iso': 400,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3511.jpg',
    'dof': '1.0',
    'shutterSpeed': '600/100',
    'iso': 320,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3513.jpg',
    'dof': '1.0',
    'shutterSpeed': '791/100',
    'iso': 200,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3514.jpg',
    'dof': '1.0',
    'shutterSpeed': '600/100',
    'iso': 500,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3515.jpg',
    'dof': '1.0',
    'shutterSpeed': '565/100',
    'iso': 800,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3522.jpg',
    'dof': '1.0',
    'shutterSpeed': '712/100',
    'iso': 200,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3523.jpg',
    'dof': '1.0',
    'shutterSpeed': '629/100',
    'iso': 200,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3524.jpg',
    'dof': '1.0',
    'shutterSpeed': '600/100',
    'iso': 250,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3526.jpg',
    'dof': '1.0',
    'shutterSpeed': '1200/100',
    'iso': 200,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3527.jpg',
    'dof': '6.0',
    'shutterSpeed': '835/100',
    'iso': 200,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3528.jpg',
    'dof': '6.0',
    'shutterSpeed': '919/100',
    'iso': 200,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3529.jpg',
    'dof': '6.0',
    'shutterSpeed': '913/100',
    'iso': 200,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3540.jpg',
    'dof': '1.4',
    'shutterSpeed': '689/100',
    'iso': 200,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3542.jpg',
    'dof': '6.0',
    'shutterSpeed': '808/100',
    'iso': 200,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3543.jpg',
    'dof': '5.0',
    'shutterSpeed': '993/100',
    'iso': 200,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3544.jpg',
    'dof': '5.0',
    'shutterSpeed': '1005/100',
    'iso': 200,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3552.jpg',
    'dof': '1.0',
    'shutterSpeed': '569/100',
    'iso': 800,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3553.jpg',
    'dof': '1.0',
    'shutterSpeed': '572/100',
    'iso': 800,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3556.jpg',
    'dof': '1.0',
    'shutterSpeed': '600/100',
    'iso': 400,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3557.jpg',
    'dof': '1.0',
    'shutterSpeed': '510/100',
    'iso': 800,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3559.jpg',
    'dof': '1.0',
    'shutterSpeed': '600/100',
    'iso': 320,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3560.jpg',
    'dof': '1.0',
    'shutterSpeed': '592/100',
    'iso': 800,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3561.jpg',
    'dof': '1.0',
    'shutterSpeed': '600/100',
    'iso': 400,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3562.jpg',
    'dof': '1.0',
    'shutterSpeed': '600/100',
    'iso': 250,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3563.jpg',
    'dof': '1.0',
    'shutterSpeed': '600/100',
    'iso': 200,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3576.jpg',
    'dof': '4.3',
    'shutterSpeed': '475/100',
    'iso': 800,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3583.jpg',
    'dof': '2.6',
    'shutterSpeed': '600/100',
    'iso': 800,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3584.jpg',
    'dof': '2.6',
    'shutterSpeed': '576/100',
    'iso': 800,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3588.jpg',
    'dof': '2.0',
    'shutterSpeed': '990/100',
    'iso': 200,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3604.jpg',
    'dof': '5.0',
    'shutterSpeed': '969/100',
    'iso': 200,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3609.jpg',
    'dof': '1.0',
    'shutterSpeed': '870/100',
    'iso': 200,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3611.jpg',
    'dof': '1.0',
    'shutterSpeed': '1200/100',
    'iso': 200,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3612.jpg',
    'dof': '3.0',
    'shutterSpeed': '1013/100',
    'iso': 200,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF3613.jpg',
    'dof': '3.0',
    'shutterSpeed': '1032/100',
    'iso': 200,
    'width': 1920,
    'height': 1082
  }];

  var bali = [{
    'name': 'DSCF4127.JPG',
    'dof': '4.0',
    'shutterSpeed': '681/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4128.JPG',
    'dof': '4.0',
    'shutterSpeed': '799/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4129.JPG',
    'dof': '3.0',
    'shutterSpeed': '957/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4130.JPG',
    'dof': '3.0',
    'shutterSpeed': '1140/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4131.JPG',
    'dof': '3.0',
    'shutterSpeed': '1082/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4132.JPG',
    'dof': '3.0',
    'shutterSpeed': '1128/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4133.JPG',
    'dof': '3.0',
    'shutterSpeed': '1172/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4134.JPG',
    'dof': '3.0',
    'shutterSpeed': '1183/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4135.JPG',
    'dof': '3.0',
    'shutterSpeed': '1151/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4136.JPG',
    'dof': '3.0',
    'shutterSpeed': '1175/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4137.JPG',
    'dof': '3.0',
    'shutterSpeed': '1144/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4138.JPG',
    'dof': '3.0',
    'shutterSpeed': '954/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4139.JPG',
    'dof': '3.0',
    'shutterSpeed': '1130/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4143.JPG',
    'dof': '3.0',
    'shutterSpeed': '1073/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4144.JPG',
    'dof': '3.0',
    'shutterSpeed': '950/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4145.JPG',
    'dof': '3.0',
    'shutterSpeed': '1192/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4146.JPG',
    'dof': '3.0',
    'shutterSpeed': '1186/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4147.JPG',
    'dof': '4.0',
    'shutterSpeed': '1061/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4148.JPG',
    'dof': '4.0',
    'shutterSpeed': '1113/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4150.JPG',
    'dof': '4.0',
    'shutterSpeed': '1094/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4151.JPG',
    'dof': '4.0',
    'shutterSpeed': '1110/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4152.JPG',
    'dof': '4.0',
    'shutterSpeed': '1050/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4154.JPG',
    'dof': '4.0',
    'shutterSpeed': '1095/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4155.JPG',
    'dof': '4.0',
    'shutterSpeed': '1043/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4156.JPG',
    'dof': '4.0',
    'shutterSpeed': '1127/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4157.JPG',
    'dof': '4.0',
    'shutterSpeed': '901/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4158.JPG',
    'dof': '4.0',
    'shutterSpeed': '988/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4159.JPG',
    'dof': '4.0',
    'shutterSpeed': '1098/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4160.JPG',
    'dof': '4.0',
    'shutterSpeed': '1017/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4162.JPG',
    'dof': '4.0',
    'shutterSpeed': '1050/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4163.JPG',
    'dof': '4.0',
    'shutterSpeed': '1053/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4165.JPG',
    'dof': '2.0',
    'shutterSpeed': '1098/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4167.JPG',
    'dof': '2.0',
    'shutterSpeed': '1199/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4168.JPG',
    'dof': '2.0',
    'shutterSpeed': '1200/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4169.JPG',
    'dof': '2.0',
    'shutterSpeed': '1147/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4170.JPG',
    'dof': '4.3',
    'shutterSpeed': '1014/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4171.JPG',
    'dof': '4.3',
    'shutterSpeed': '953/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4172.JPG',
    'dof': '4.3',
    'shutterSpeed': '1034/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4173.JPG',
    'dof': '4.3',
    'shutterSpeed': '1022/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4174.JPG',
    'dof': '4.3',
    'shutterSpeed': '1126/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4175.JPG',
    'dof': '4.3',
    'shutterSpeed': '1051/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4176.JPG',
    'dof': '4.3',
    'shutterSpeed': '954/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4177.JPG',
    'dof': '4.3',
    'shutterSpeed': '1107/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4178.JPG',
    'dof': '4.3',
    'shutterSpeed': '1012/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4179.JPG',
    'dof': '4.3',
    'shutterSpeed': '1004/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4180.JPG',
    'dof': '4.3',
    'shutterSpeed': '1109/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4181.JPG',
    'dof': '4.3',
    'shutterSpeed': '996/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4182.JPG',
    'dof': '4.0',
    'shutterSpeed': '899/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4183.JPG',
    'dof': '4.0',
    'shutterSpeed': '1073/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4184.JPG',
    'dof': '4.0',
    'shutterSpeed': '1101/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4185.JPG',
    'dof': '4.0',
    'shutterSpeed': '1064/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4188.JPG',
    'dof': '4.0',
    'shutterSpeed': '992/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4189.JPG',
    'dof': '4.0',
    'shutterSpeed': '1003/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4190.JPG',
    'dof': '4.0',
    'shutterSpeed': '1033/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4192.JPG',
    'dof': '4.0',
    'shutterSpeed': '1019/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4194.JPG',
    'dof': '4.0',
    'shutterSpeed': '1024/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4196.JPG',
    'dof': '4.0',
    'shutterSpeed': '1042/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4197.JPG',
    'dof': '4.0',
    'shutterSpeed': '1121/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4198.JPG',
    'dof': '4.0',
    'shutterSpeed': '1139/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4199.JPG',
    'dof': '1.0',
    'shutterSpeed': '1167/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4200.JPG',
    'dof': '1.0',
    'shutterSpeed': '1099/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4201.JPG',
    'dof': '1.0',
    'shutterSpeed': '1179/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4202.JPG',
    'dof': '4.0',
    'shutterSpeed': '1076/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4203.JPG',
    'dof': '4.0',
    'shutterSpeed': '928/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4204.JPG',
    'dof': '4.0',
    'shutterSpeed': '994/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4205.JPG',
    'dof': '4.0',
    'shutterSpeed': '1005/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4206.JPG',
    'dof': '4.0',
    'shutterSpeed': '985/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4207.JPG',
    'dof': '4.0',
    'shutterSpeed': '1109/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4208.JPG',
    'dof': '1.0',
    'shutterSpeed': '1102/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4209.JPG',
    'dof': '4.0',
    'shutterSpeed': '991/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4210.JPG',
    'dof': '3.0',
    'shutterSpeed': '991/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4211.JPG',
    'dof': '3.0',
    'shutterSpeed': '1008/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4212.JPG',
    'dof': '3.0',
    'shutterSpeed': '975/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4214.JPG',
    'dof': '3.4',
    'shutterSpeed': '1066/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4215.JPG',
    'dof': '3.4',
    'shutterSpeed': '959/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4216.JPG',
    'dof': '3.0',
    'shutterSpeed': '1019/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4217.JPG',
    'dof': '3.0',
    'shutterSpeed': '911/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4218.JPG',
    'dof': '5.0',
    'shutterSpeed': '1041/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4219.JPG',
    'dof': '5.0',
    'shutterSpeed': '1002/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4221.JPG',
    'dof': '5.0',
    'shutterSpeed': '1020/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4222.JPG',
    'dof': '5.0',
    'shutterSpeed': '973/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4223.JPG',
    'dof': '5.0',
    'shutterSpeed': '941/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4225.JPG',
    'dof': '5.0',
    'shutterSpeed': '981/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4226.JPG',
    'dof': '5.0',
    'shutterSpeed': '1031/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4230.JPG',
    'dof': '5.0',
    'shutterSpeed': '1028/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4231.JPG',
    'dof': '5.0',
    'shutterSpeed': '965/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4232.JPG',
    'dof': '5.0',
    'shutterSpeed': '828/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4233.JPG',
    'dof': '5.0',
    'shutterSpeed': '940/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4234.JPG',
    'dof': '5.0',
    'shutterSpeed': '929/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4235.JPG',
    'dof': '5.0',
    'shutterSpeed': '968/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4236.JPG',
    'dof': '5.0',
    'shutterSpeed': '1035/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4237.JPG',
    'dof': '5.0',
    'shutterSpeed': '1160/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4238.JPG',
    'dof': '5.0',
    'shutterSpeed': '1069/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4239.JPG',
    'dof': '5.0',
    'shutterSpeed': '1019/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4240.JPG',
    'dof': '5.0',
    'shutterSpeed': '933/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4241.JPG',
    'dof': '5.0',
    'shutterSpeed': '987/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4242.JPG',
    'dof': '5.0',
    'shutterSpeed': '1033/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4244.JPG',
    'dof': '5.0',
    'shutterSpeed': '1200/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4245.JPG',
    'dof': '5.0',
    'shutterSpeed': '1098/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4246.JPG',
    'dof': '5.0',
    'shutterSpeed': '956/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4247.JPG',
    'dof': '5.0',
    'shutterSpeed': '967/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4248.JPG',
    'dof': '5.0',
    'shutterSpeed': '974/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4249.JPG',
    'dof': '5.0',
    'shutterSpeed': '1096/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4250.JPG',
    'dof': '5.0',
    'shutterSpeed': '1021/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4251.JPG',
    'dof': '5.0',
    'shutterSpeed': '1200/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4252.JPG',
    'dof': '5.0',
    'shutterSpeed': '974/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4253.JPG',
    'dof': '5.0',
    'shutterSpeed': '1159/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4254.JPG',
    'dof': '5.0',
    'shutterSpeed': '1077/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4262.JPG',
    'dof': '4.0',
    'shutterSpeed': '1152/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4267.JPG',
    'dof': '6.0',
    'shutterSpeed': '1025/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4268.JPG',
    'dof': '6.0',
    'shutterSpeed': '1085/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4271.JPG',
    'dof': '6.0',
    'shutterSpeed': '812/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4272.JPG',
    'dof': '6.0',
    'shutterSpeed': '794/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4273.JPG',
    'dof': '6.0',
    'shutterSpeed': '798/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4274.JPG',
    'dof': '6.0',
    'shutterSpeed': '869/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4275.JPG',
    'dof': '6.0',
    'shutterSpeed': '600/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4276.JPG',
    'dof': '2.6',
    'shutterSpeed': '1118/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4277.JPG',
    'dof': '2.6',
    'shutterSpeed': '1200/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4278.JPG',
    'dof': '3.0',
    'shutterSpeed': '1169/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4279.JPG',
    'dof': '3.0',
    'shutterSpeed': '1184/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4280.JPG',
    'dof': '3.0',
    'shutterSpeed': '1200/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4281.JPG',
    'dof': '4.0',
    'shutterSpeed': '1107/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4282.JPG',
    'dof': '4.0',
    'shutterSpeed': '1080/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4283.JPG',
    'dof': '3.0',
    'shutterSpeed': '1028/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4284.JPG',
    'dof': '3.0',
    'shutterSpeed': '1100/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4285.JPG',
    'dof': '3.0',
    'shutterSpeed': '1094/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4286.JPG',
    'dof': '3.0',
    'shutterSpeed': '1145/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4287.JPG',
    'dof': '3.0',
    'shutterSpeed': '1190/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4288.JPG',
    'dof': '3.0',
    'shutterSpeed': '1153/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4289.JPG',
    'dof': '3.0',
    'shutterSpeed': '1139/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4290.JPG',
    'dof': '3.0',
    'shutterSpeed': '1055/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4291.JPG',
    'dof': '3.0',
    'shutterSpeed': '1100/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4292.JPG',
    'dof': '3.0',
    'shutterSpeed': '1100/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4293.JPG',
    'dof': '4.0',
    'shutterSpeed': '1120/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4294.JPG',
    'dof': '4.0',
    'shutterSpeed': '1128/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4295.JPG',
    'dof': '4.0',
    'shutterSpeed': '1023/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4296.JPG',
    'dof': '4.0',
    'shutterSpeed': '1082/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4297.JPG',
    'dof': '4.0',
    'shutterSpeed': '970/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4298.JPG',
    'dof': '4.0',
    'shutterSpeed': '1015/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4304.JPG',
    'dof': '4.0',
    'shutterSpeed': '1123/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4305.JPG',
    'dof': '4.0',
    'shutterSpeed': '1061/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4306.JPG',
    'dof': '4.0',
    'shutterSpeed': '1106/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4307.JPG',
    'dof': '4.0',
    'shutterSpeed': '1079/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4308.JPG',
    'dof': '4.0',
    'shutterSpeed': '1075/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4309.JPG',
    'dof': '4.0',
    'shutterSpeed': '1134/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4310.JPG',
    'dof': '4.0',
    'shutterSpeed': '1095/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4311.JPG',
    'dof': '4.0',
    'shutterSpeed': '1126/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4313.JPG',
    'dof': '2.0',
    'shutterSpeed': '1200/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4314.JPG',
    'dof': '3.0',
    'shutterSpeed': '1197/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4315.JPG',
    'dof': '3.0',
    'shutterSpeed': '1189/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4316.JPG',
    'dof': '3.0',
    'shutterSpeed': '1200/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4317.JPG',
    'dof': '4.0',
    'shutterSpeed': '1165/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4318.JPG',
    'dof': '4.0',
    'shutterSpeed': '1125/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4319.JPG',
    'dof': '4.0',
    'shutterSpeed': '1104/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4320.JPG',
    'dof': '4.0',
    'shutterSpeed': '1188/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4321.JPG',
    'dof': '1.0',
    'shutterSpeed': '1165/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4322.JPG',
    'dof': '1.0',
    'shutterSpeed': '1153/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4323.JPG',
    'dof': '3.0',
    'shutterSpeed': '1028/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4324.JPG',
    'dof': '3.0',
    'shutterSpeed': '993/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4325.JPG',
    'dof': '3.0',
    'shutterSpeed': '855/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4326.JPG',
    'dof': '3.0',
    'shutterSpeed': '1039/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4327.JPG',
    'dof': '3.0',
    'shutterSpeed': '1030/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4328.JPG',
    'dof': '3.0',
    'shutterSpeed': '880/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4329.JPG',
    'dof': '3.0',
    'shutterSpeed': '857/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4330.JPG',
    'dof': '1.4',
    'shutterSpeed': '1175/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4331.JPG',
    'dof': '2.3',
    'shutterSpeed': '1179/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4332.JPG',
    'dof': '2.3',
    'shutterSpeed': '1054/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4333.JPG',
    'dof': '3.0',
    'shutterSpeed': '1155/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4334.JPG',
    'dof': '3.0',
    'shutterSpeed': '1030/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4335.JPG',
    'dof': '3.0',
    'shutterSpeed': '1158/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4336.JPG',
    'dof': '3.0',
    'shutterSpeed': '1130/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4337.JPG',
    'dof': '3.0',
    'shutterSpeed': '1105/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4338.JPG',
    'dof': '3.0',
    'shutterSpeed': '1144/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4339.JPG',
    'dof': '3.0',
    'shutterSpeed': '1090/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4340.JPG',
    'dof': '3.0',
    'shutterSpeed': '1062/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4341.JPG',
    'dof': '3.0',
    'shutterSpeed': '1162/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4342.JPG',
    'dof': '3.0',
    'shutterSpeed': '1087/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4343.JPG',
    'dof': '3.0',
    'shutterSpeed': '1088/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4344.JPG',
    'dof': '3.0',
    'shutterSpeed': '1082/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4345.JPG',
    'dof': '3.0',
    'shutterSpeed': '1141/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4346.JPG',
    'dof': '3.0',
    'shutterSpeed': '1058/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4347.JPG',
    'dof': '3.0',
    'shutterSpeed': '1037/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4348.JPG',
    'dof': '3.0',
    'shutterSpeed': '1139/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4349.JPG',
    'dof': '3.0',
    'shutterSpeed': '964/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4350.JPG',
    'dof': '1.0',
    'shutterSpeed': '1200/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4351.JPG',
    'dof': '1.0',
    'shutterSpeed': '1192/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4352.JPG',
    'dof': '1.0',
    'shutterSpeed': '1200/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4353.JPG',
    'dof': '1.0',
    'shutterSpeed': '1200/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4355.JPG',
    'dof': '1.0',
    'shutterSpeed': '1200/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4356.JPG',
    'dof': '4.0',
    'shutterSpeed': '1050/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4357.JPG',
    'dof': '4.0',
    'shutterSpeed': '1028/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4358.JPG',
    'dof': '4.0',
    'shutterSpeed': '829/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4359.JPG',
    'dof': '4.0',
    'shutterSpeed': '827/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }, {
    'name': 'DSCF4360.JPG',
    'dof': '4.0',
    'shutterSpeed': '892/100',
    'iso': null,
    'width': 1920,
    'height': 1082
  }];

  var singaporeLife = [{
    "name": "DSCF3978.JPG",
    "dof": "1.0",
    "shutterSpeed": "600/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3979.JPG",
    "dof": "1.0",
    "shutterSpeed": "730/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3980.JPG",
    "dof": "1.0",
    "shutterSpeed": "731/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3981.JPG",
    "dof": "1.0",
    "shutterSpeed": "744/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3982.JPG",
    "dof": "1.0",
    "shutterSpeed": "870/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3983.JPG",
    "dof": "1.0",
    "shutterSpeed": "852/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3984.JPG",
    "dof": "1.0",
    "shutterSpeed": "902/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3985.JPG",
    "dof": "1.0",
    "shutterSpeed": "778/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3986.JPG",
    "dof": "1.0",
    "shutterSpeed": "775/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3987.JPG",
    "dof": "1.0",
    "shutterSpeed": "790/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3988.JPG",
    "dof": "1.0",
    "shutterSpeed": "793/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3989.JPG",
    "dof": "1.0",
    "shutterSpeed": "806/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3990.JPG",
    "dof": "1.0",
    "shutterSpeed": "711/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3991.JPG",
    "dof": "1.0",
    "shutterSpeed": "805/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3992.JPG",
    "dof": "1.0",
    "shutterSpeed": "714/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3993.JPG",
    "dof": "1.0",
    "shutterSpeed": "807/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3994.JPG",
    "dof": "1.0",
    "shutterSpeed": "800/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF3995.JPG",
    "dof": "6.0",
    "shutterSpeed": "872/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4001.JPG",
    "dof": "4.3",
    "shutterSpeed": "868/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4002.JPG",
    "dof": "4.3",
    "shutterSpeed": "739/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4003.JPG",
    "dof": "4.3",
    "shutterSpeed": "787/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4004.JPG",
    "dof": "4.3",
    "shutterSpeed": "750/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4005.JPG",
    "dof": "4.3",
    "shutterSpeed": "826/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4006.JPG",
    "dof": "4.3",
    "shutterSpeed": "697/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4007.JPG",
    "dof": "3.0",
    "shutterSpeed": "699/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4008.JPG",
    "dof": "1.0",
    "shutterSpeed": "936/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4009.JPG",
    "dof": "1.0",
    "shutterSpeed": "692/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4010.JPG",
    "dof": "1.0",
    "shutterSpeed": "677/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4011.JPG",
    "dof": "1.0",
    "shutterSpeed": "600/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4012.JPG",
    "dof": "1.0",
    "shutterSpeed": "707/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4013.JPG",
    "dof": "1.0",
    "shutterSpeed": "737/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4014.JPG",
    "dof": "1.0",
    "shutterSpeed": "694/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4015.JPG",
    "dof": "1.0",
    "shutterSpeed": "1027/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4016.JPG",
    "dof": "1.0",
    "shutterSpeed": "1013/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4017.JPG",
    "dof": "1.0",
    "shutterSpeed": "1035/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4018.JPG",
    "dof": "1.0",
    "shutterSpeed": "1030/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4019.JPG",
    "dof": "1.0",
    "shutterSpeed": "921/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4020.JPG",
    "dof": "4.0",
    "shutterSpeed": "974/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4021.JPG",
    "dof": "4.0",
    "shutterSpeed": "921/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4022.JPG",
    "dof": "1.0",
    "shutterSpeed": "1081/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4023.JPG",
    "dof": "1.0",
    "shutterSpeed": "1119/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4024.JPG",
    "dof": "4.0",
    "shutterSpeed": "1073/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4025.JPG",
    "dof": "4.0",
    "shutterSpeed": "953/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4026.JPG",
    "dof": "4.0",
    "shutterSpeed": "807/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4027.JPG",
    "dof": "4.0",
    "shutterSpeed": "981/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4028.JPG",
    "dof": "4.0",
    "shutterSpeed": "813/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4029.JPG",
    "dof": "4.0",
    "shutterSpeed": "1013/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4030.JPG",
    "dof": "3.0",
    "shutterSpeed": "1156/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4031.JPG",
    "dof": "3.0",
    "shutterSpeed": "956/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4032.JPG",
    "dof": "3.0",
    "shutterSpeed": "1122/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4033.JPG",
    "dof": "3.0",
    "shutterSpeed": "1097/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4034.JPG",
    "dof": "1.0",
    "shutterSpeed": "1174/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4035.JPG",
    "dof": "2.0",
    "shutterSpeed": "1200/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4036.JPG",
    "dof": "2.0",
    "shutterSpeed": "1163/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4037.JPG",
    "dof": "3.0",
    "shutterSpeed": "1150/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4038.JPG",
    "dof": "3.0",
    "shutterSpeed": "1145/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4039.JPG",
    "dof": "3.0",
    "shutterSpeed": "1129/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4040.JPG",
    "dof": "3.0",
    "shutterSpeed": "1035/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4041.JPG",
    "dof": "3.0",
    "shutterSpeed": "930/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4042.JPG",
    "dof": "1.0",
    "shutterSpeed": "1001/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4043.JPG",
    "dof": "1.0",
    "shutterSpeed": "1118/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4044.JPG",
    "dof": "4.0",
    "shutterSpeed": "988/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4045.JPG",
    "dof": "3.0",
    "shutterSpeed": "1166/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4046.JPG",
    "dof": "1.0",
    "shutterSpeed": "995/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4047.JPG",
    "dof": "1.0",
    "shutterSpeed": "989/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4048.JPG",
    "dof": "1.0",
    "shutterSpeed": "1014/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4049.JPG",
    "dof": "1.0",
    "shutterSpeed": "1198/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4050.JPG",
    "dof": "1.0",
    "shutterSpeed": "1098/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4051.JPG",
    "dof": "3.0",
    "shutterSpeed": "988/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4052.JPG",
    "dof": "3.0",
    "shutterSpeed": "1145/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4053.JPG",
    "dof": "3.0",
    "shutterSpeed": "1181/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4054.JPG",
    "dof": "4.0",
    "shutterSpeed": "1097/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4055.JPG",
    "dof": "4.0",
    "shutterSpeed": "1099/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4056.JPG",
    "dof": "4.0",
    "shutterSpeed": "899/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4057.JPG",
    "dof": "4.0",
    "shutterSpeed": "817/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4058.JPG",
    "dof": "4.0",
    "shutterSpeed": "852/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4059.JPG",
    "dof": "4.0",
    "shutterSpeed": "884/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4060.JPG",
    "dof": "4.0",
    "shutterSpeed": "1089/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4061.JPG",
    "dof": "4.0",
    "shutterSpeed": "1102/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4062.JPG",
    "dof": "4.0",
    "shutterSpeed": "1114/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4063.JPG",
    "dof": "4.0",
    "shutterSpeed": "894/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4064.JPG",
    "dof": "4.0",
    "shutterSpeed": "895/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4065.JPG",
    "dof": "4.0",
    "shutterSpeed": "1043/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4066.JPG",
    "dof": "4.0",
    "shutterSpeed": "1052/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4067.JPG",
    "dof": "4.0",
    "shutterSpeed": "759/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4068.JPG",
    "dof": "4.0",
    "shutterSpeed": "976/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4069.JPG",
    "dof": "4.0",
    "shutterSpeed": "888/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4070.JPG",
    "dof": "4.0",
    "shutterSpeed": "957/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4071.JPG",
    "dof": "1.0",
    "shutterSpeed": "908/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4072.JPG",
    "dof": "1.0",
    "shutterSpeed": "862/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4073.JPG",
    "dof": "1.0",
    "shutterSpeed": "910/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4074.JPG",
    "dof": "4.0",
    "shutterSpeed": "1144/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4075.JPG",
    "dof": "3.0",
    "shutterSpeed": "1091/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4076.JPG",
    "dof": "4.0",
    "shutterSpeed": "1094/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4077.JPG",
    "dof": "4.0",
    "shutterSpeed": "1103/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4078.JPG",
    "dof": "4.0",
    "shutterSpeed": "1116/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4079.JPG",
    "dof": "4.0",
    "shutterSpeed": "1092/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4080.JPG",
    "dof": "4.0",
    "shutterSpeed": "1052/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4081.JPG",
    "dof": "4.0",
    "shutterSpeed": "728/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4082.JPG",
    "dof": "1.0",
    "shutterSpeed": "1200/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4083.JPG",
    "dof": "3.0",
    "shutterSpeed": "1122/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4084.JPG",
    "dof": "3.0",
    "shutterSpeed": "1169/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4085.JPG",
    "dof": "3.0",
    "shutterSpeed": "1098/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4086.JPG",
    "dof": "1.0",
    "shutterSpeed": "1193/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4087.JPG",
    "dof": "2.3",
    "shutterSpeed": "1180/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4088.JPG",
    "dof": "2.0",
    "shutterSpeed": "1131/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4089.JPG",
    "dof": "2.0",
    "shutterSpeed": "1164/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4090.JPG",
    "dof": "2.0",
    "shutterSpeed": "1137/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4091.JPG",
    "dof": "2.0",
    "shutterSpeed": "1198/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4092.JPG",
    "dof": "2.0",
    "shutterSpeed": "1004/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4093.JPG",
    "dof": "2.0",
    "shutterSpeed": "1121/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4094.JPG",
    "dof": "2.0",
    "shutterSpeed": "1192/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4095.JPG",
    "dof": "2.0",
    "shutterSpeed": "1188/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4096.JPG",
    "dof": "2.0",
    "shutterSpeed": "1183/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4097.JPG",
    "dof": "2.0",
    "shutterSpeed": "1186/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4098.JPG",
    "dof": "2.0",
    "shutterSpeed": "1109/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4099.JPG",
    "dof": "2.0",
    "shutterSpeed": "1008/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4100.JPG",
    "dof": "2.0",
    "shutterSpeed": "1128/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4101.JPG",
    "dof": "2.0",
    "shutterSpeed": "886/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4102.JPG",
    "dof": "2.6",
    "shutterSpeed": "1063/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4103.JPG",
    "dof": "2.6",
    "shutterSpeed": "998/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4104.JPG",
    "dof": "2.6",
    "shutterSpeed": "1019/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4105.JPG",
    "dof": "2.6",
    "shutterSpeed": "965/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4106.JPG",
    "dof": "2.6",
    "shutterSpeed": "967/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4107.JPG",
    "dof": "1.0",
    "shutterSpeed": "1074/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4108.JPG",
    "dof": "2.0",
    "shutterSpeed": "1200/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4109.JPG",
    "dof": "2.0",
    "shutterSpeed": "991/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4110.JPG",
    "dof": "2.0",
    "shutterSpeed": "1065/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4111.JPG",
    "dof": "2.0",
    "shutterSpeed": "969/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4112.JPG",
    "dof": "2.0",
    "shutterSpeed": "1191/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4113.JPG",
    "dof": "2.0",
    "shutterSpeed": "1160/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4114.JPG",
    "dof": "2.0",
    "shutterSpeed": "1118/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4115.JPG",
    "dof": "2.0",
    "shutterSpeed": "965/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4116.JPG",
    "dof": "2.0",
    "shutterSpeed": "1168/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4117.JPG",
    "dof": "2.0",
    "shutterSpeed": "1155/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4118.JPG",
    "dof": "2.0",
    "shutterSpeed": "1107/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4119.JPG",
    "dof": "2.0",
    "shutterSpeed": "1114/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4120.JPG",
    "dof": "2.0",
    "shutterSpeed": "1171/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4121.JPG",
    "dof": "2.0",
    "shutterSpeed": "1148/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4122.JPG",
    "dof": "2.0",
    "shutterSpeed": "1157/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4123.JPG",
    "dof": "2.0",
    "shutterSpeed": "1168/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4124.JPG",
    "dof": "2.0",
    "shutterSpeed": "1161/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4125.JPG",
    "dof": "2.0",
    "shutterSpeed": "1138/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }, {
    "name": "DSCF4126.JPG",
    "dof": "2.0",
    "shutterSpeed": "1086/100",
    "iso": null,
    "width": 1920,
    "height": 1082
  }];

  var photographyModule = {
    state: {
      lightbox: {
        show: false,
        src: '/assets/img/photography/01-christmas_market/DSCF2043.jpg'
      },
      photos: {
        'christmas-market': {
          heading: 'Christmas Market',
          subheading: 'at Mannheim, Germany.',
          folderPath: '/assets/img/photography/01-christmas_market/DSCF2',
          images: [{
            name: '043.jpg',
            dof: 'f/1.4',
            shutterSpeed: '1/220 sec',
            iso: '200'
          }, {
            name: '046.jpg',
            dof: 'f/1.4',
            shutterSpeed: '1/480 sec',
            iso: '200'
          }, {
            name: '050.jpg',
            dof: 'f/1.4',
            shutterSpeed: '1/160 sec',
            iso: '200'
          }, {
            name: '052.jpg',
            dof: 'f/1.4',
            shutterSpeed: '1/450 sec',
            iso: '200'
          }, {
            name: '054.jpg',
            dof: 'f/1.4',
            shutterSpeed: '1/52 sec',
            iso: '320'
          }, {
            name: '055.jpg',
            dof: 'f/1.4',
            shutterSpeed: '1/56 sec',
            iso: '200'
          }, {
            name: '057.jpg',
            dof: 'f/1.4',
            shutterSpeed: '1/70 sec',
            iso: '200'
          }, {
            name: '058.jpg',
            dof: 'f/1.4',
            shutterSpeed: '1/52 sec',
            iso: '200'
          }, {
            name: '059.jpg',
            dof: 'f/1.4',
            shutterSpeed: '1/70 sec',
            iso: '200'
          }, {
            name: '078.jpg',
            dof: 'f/1.4',
            shutterSpeed: '1/52 sec',
            iso: '2500'
          }, {
            name: '088.jpg',
            dof: 'f/1.4',
            shutterSpeed: '1/52 sec',
            iso: '2500'
          }, {
            name: '095.jpg',
            dof: 'f/1.4',
            shutterSpeed: '1/52 sec',
            iso: '3200'
          }, {
            name: '104.jpg',
            dof: 'f/1.4',
            shutterSpeed: '1/52 sec',
            iso: '2000'
          }],
          cameraModel: 'Fujifilm XE-1',
          lensModel: '35 mm f/1.4'
        },
        'malaysia': {
          heading: 'Malaysia',
          subheading: 'at random locations.',
          folderPath: '/assets/img/photography/02-malaysia/DSCF2',
          images: [{
            name: '336.jpg',
            dof: 'f/3.2',
            shutterSpeed: '1/3000 sec',
            iso: '200'
          }, {
            name: '342.jpg',
            dof: 'f/2.8',
            shutterSpeed: '1/4000 sec',
            iso: '200'
          }, {
            name: '346.jpg',
            dof: 'f/2.8',
            shutterSpeed: '1/300 sec',
            iso: '800'
          }, {
            name: '348.jpg',
            dof: 'f/2.8',
            shutterSpeed: '1/90 sec',
            iso: '400'
          }, {
            name: '351.jpg',
            dof: 'f/2.8',
            shutterSpeed: '1/160 sec',
            iso: '100'
          }, {
            name: '353.jpg',
            dof: 'f/2.8',
            shutterSpeed: '1/56 sec',
            iso: '100'
          }, {
            name: '363.jpg',
            dof: 'f/2.8',
            shutterSpeed: '1/1900 sec',
            iso: '800'
          }, {
            name: '366.jpg',
            dof: 'f/1.4',
            shutterSpeed: '1/3500 sec',
            iso: '200'
          }, {
            name: '368.jpg',
            dof: 'f/1.4',
            shutterSpeed: '1/180 sec',
            iso: '800'
          }, {
            name: '370.jpg',
            dof: 'f/1.4',
            shutterSpeed: '1/2200 sec',
            iso: '800'
          }, {
            name: '373.jpg',
            dof: 'f/1.4',
            shutterSpeed: '1/2400 sec',
            iso: '400'
          }, {
            name: '379.jpg',
            dof: 'f/1.4',
            shutterSpeed: '1/1400 sec',
            iso: '200'
          }, {
            name: '381.jpg',
            dof: 'f/1.4',
            shutterSpeed: '1/90 sec',
            iso: '800'
          }, {
            name: '415.jpg',
            dof: 'f/13',
            shutterSpeed: '1/2400 sec',
            iso: '800'
          }, {
            name: '423.jpg',
            dof: 'f/1.4',
            shutterSpeed: '1/550 sec',
            iso: '800'
          }, {
            name: '424.jpg',
            dof: 'f/1.4',
            shutterSpeed: '1/1100 sec',
            iso: '200'
          }, {
            name: '425.jpg',
            dof: 'f/1.4',
            shutterSpeed: '1/1000 sec',
            iso: '200'
          }, {
            name: '426.jpg',
            dof: 'f/1.4',
            shutterSpeed: '1/900 sec',
            iso: '200'
          }],
          cameraModel: 'Fujifilm XE-1',
          lensModel: '35 mm f/1.4'
        },
        'danboard': {
          heading: 'Danboard shots',
          subheading: 'macro shots, done unprofessionally.',
          folderPath: '/assets/img/photography/06-danboard/IMG_',
          images: [{
            name: '4735.jpg',
            dof: 'f/2.8',
            shutterSpeed: '1/50 sec',
            iso: '1600'
          }, {
            name: '2630.jpg',
            dof: 'f/2.8',
            shutterSpeed: '1/20 sec',
            iso: '800'
          }, {
            name: '2641.jpg',
            dof: 'f/2.8',
            shutterSpeed: '1/20 sec',
            iso: '800'
          }, {
            name: '3166.jpg',
            dof: 'f/5',
            shutterSpeed: '1/60 sec',
            iso: '200'
          }, {
            name: '3171.jpg',
            dof: 'f/3.5',
            shutterSpeed: '1/125 sec',
            iso: '200'
          }, {
            name: '3174.jpg',
            dof: 'f/5',
            shutterSpeed: '1/125 sec',
            iso: '200'
          }, {
            name: '3175.jpg',
            dof: 'f/5',
            shutterSpeed: '1/80 sec',
            iso: '200'
          }, {
            name: '3619.jpg',
            dof: 'f/3.5',
            shutterSpeed: '1/60 sec',
            iso: '100'
          }],
          cameraModel: 'Canon EOS 600D',
          lensModel: '100mm f/2.8 Macro'
        },
        'preiser-figure': {
          heading: 'Preiser Figures',
          subheading: 'small toys, magnified.',
          folderPath: '/assets/img/photography/07-preiser_figure/',
          images: [{
            name: '01.jpg',
            dof: 'f/2.8',
            shutterSpeed: '1/5 sec',
            iso: '100'
          }, {
            name: '02.jpg',
            dof: 'f/8',
            shutterSpeed: '2 sec',
            iso: '100'
          }, {
            name: '03.jpg',
            dof: 'f/5.6',
            shutterSpeed: '4 sec',
            iso: '100'
          }, {
            name: '04.jpg',
            dof: 'f/5.6',
            shutterSpeed: '2.5 sec',
            iso: '100'
          }, {
            name: '05.jpg',
            dof: 'f/2.8',
            shutterSpeed: '4 sec',
            iso: '100'
          }, {
            name: '06.jpg',
            dof: 'f/2.8',
            shutterSpeed: '1/30 sec',
            iso: '400'
          }, {
            name: '07.jpg',
            dof: 'f/4',
            shutterSpeed: '1/30 sec',
            iso: '100'
          }, {
            name: '08.jpg',
            dof: 'f/2.8',
            shutterSpeed: '1/4 sec',
            iso: '100'
          }, {
            name: '09.jpg',
            dof: 'f/11',
            shutterSpeed: '2 sec',
            iso: '400'
          }, {
            name: '10.jpg',
            dof: 'f/2.8',
            shutterSpeed: '1/5 sec',
            iso: '100'
          }],
          cameraModel: 'Canon EOS 600D',
          lensModel: '100mm f/2.8 Macro' // 'Canon EF 100mm f/2.8 USM Macro Lens'

        },
        'berlin': {
          heading: 'Berlin Trip',
          subheading: 'at Berlin, Germany.',
          folderPath: '/assets/img/photography/05-berlin_trip/',
          images: [{
            name: 'DSCF2607.jpg',
            iso: 200,
            shutterSpeed: '1/1663',
            'dof': 1.4
          }, {
            name: 'DSCF2608.jpg',
            iso: 200,
            shutterSpeed: '1/739',
            'dof': 1.4
          }, {
            name: 'DSCF2609.jpg',
            iso: 200,
            shutterSpeed: '1/1038',
            'dof': 1.4
          }, {
            name: 'DSCF2611.jpg',
            iso: 200,
            shutterSpeed: '1/600',
            'dof': 1.4
          }, {
            name: 'DSCF2616.jpg',
            iso: 200,
            shutterSpeed: '1/729',
            'dof': 1.4
          }, {
            name: 'DSCF2619.jpg',
            iso: 320,
            shutterSpeed: '1/64',
            'dof': 8.0
          }, {
            name: 'DSCF2626.jpg',
            iso: 800,
            shutterSpeed: '1/38',
            'dof': 1.4
          }, {
            name: 'DSCF2634.jpg',
            iso: 800,
            shutterSpeed: '1/64',
            'dof': 1.4
          }, {
            name: 'DSCF2637.jpg',
            iso: 800,
            shutterSpeed: '1/23',
            'dof': 1.4
          }, {
            name: 'DSCF2650.jpg',
            iso: 800,
            shutterSpeed: '1/53',
            'dof': 1.4
          }, {
            name: 'DSCF2656.jpg',
            iso: 200,
            shutterSpeed: '1/676',
            'dof': 8.9
          }, {
            name: 'DSCF2658.jpg',
            iso: 200,
            shutterSpeed: '1/588',
            'dof': 10.9
          }, {
            name: 'DSCF2659.jpg',
            iso: 200,
            shutterSpeed: '1/2091',
            'dof': 4.0
          }, {
            name: 'DSCF2660.jpg',
            iso: 200,
            shutterSpeed: '1/2353',
            'dof': 4.0
          }, {
            name: 'DSCF2666.jpg',
            iso: 200,
            shutterSpeed: '1/143',
            'dof': 10.9
          }, {
            name: 'DSCF2667.jpg',
            iso: 200,
            shutterSpeed: '1/1859',
            'dof': 3.2
          }, {
            name: 'DSCF2668.jpg',
            iso: 200,
            shutterSpeed: '1/111',
            'dof': 10.9
          }, {
            name: 'DSCF2670.jpg',
            iso: 200,
            shutterSpeed: '1/3126',
            'dof': 1.4
          }, {
            name: 'DSCF2671.jpg',
            iso: 320,
            shutterSpeed: '1/64',
            'dof': 1.4
          }, {
            name: 'DSCF2673.jpg',
            iso: 200,
            shutterSpeed: '1/4096',
            'dof': 1.6
          }, {
            name: 'DSCF2685.jpg',
            iso: 200,
            shutterSpeed: '1/1226',
            'dof': 4.0
          }, {
            name: 'DSCF2690.jpg',
            iso: 200,
            shutterSpeed: '1/792',
            'dof': 4.0
          }, {
            name: 'DSCF2695.jpg',
            iso: 200,
            shutterSpeed: '1/653',
            'dof': 4.0
          }, {
            name: 'DSCF2696.jpg',
            iso: 200,
            shutterSpeed: '1/724',
            'dof': 4.0
          }, {
            name: 'DSCF2697.jpg',
            iso: 200,
            shutterSpeed: '1/1252',
            'dof': 4.0
          }, {
            name: 'DSCF2700.jpg',
            iso: 200,
            shutterSpeed: '1/105',
            'dof': 4.0
          }, {
            name: 'DSCF2702.jpg',
            iso: 200,
            shutterSpeed: '1/1458',
            'dof': 1.4
          }, {
            name: 'DSCF2729.jpg',
            iso: 800,
            shutterSpeed: '1/20',
            'dof': 1.4
          }, {
            name: 'DSCF2730.jpg',
            iso: 800,
            shutterSpeed: '1/24',
            'dof': 1.4
          }, {
            name: 'DSCF2733.jpg',
            iso: 200,
            shutterSpeed: '1/241',
            'dof': 10.9
          }, {
            name: 'DSCF2738.jpg',
            iso: 200,
            shutterSpeed: '1/64',
            'dof': 8.0
          }, {
            name: 'DSCF2741.jpg',
            iso: 200,
            shutterSpeed: '1/69',
            'dof': 8.0
          }, {
            name: 'DSCF2743.jpg',
            iso: 200,
            shutterSpeed: '1/428',
            'dof': 8.0
          }, {
            name: 'DSCF2755.jpg',
            iso: 200,
            shutterSpeed: '1/1438',
            'dof': 1.4
          }, {
            name: 'DSCF2756.jpg',
            iso: 200,
            shutterSpeed: '1/152',
            'dof': 1.6
          }, {
            name: 'DSCF2760.jpg',
            iso: 200,
            shutterSpeed: '1/229',
            'dof': 1.4
          }, {
            name: 'DSCF2763.jpg',
            iso: 200,
            shutterSpeed: '1/1629',
            'dof': 1.6
          }, {
            name: 'DSCF2767.jpg',
            iso: 400,
            shutterSpeed: '1/64',
            'dof': 1.4
          }, {
            name: 'DSCF2771.jpg',
            iso: 200,
            shutterSpeed: '1/256',
            'dof': 1.4
          }, {
            name: 'DSCF2775.jpg',
            iso: 320,
            shutterSpeed: '1/64',
            'dof': 1.4
          }, {
            name: 'DSCF2776.jpg',
            iso: 320,
            shutterSpeed: '1/64',
            'dof': 1.4
          }, {
            name: 'DSCF2777.jpg',
            iso: 500,
            shutterSpeed: '1/64',
            'dof': 1.4
          }, {
            name: 'DSCF2778.jpg',
            iso: 400,
            shutterSpeed: '1/64',
            'dof': 1.4
          }],
          cameraModel: 'Fujifilm XE-1',
          lensModel: '35 mm f/1.4'
        },
        'singapore-ndp-2018': {
          heading: 'National Day Parade Singapore',
          subheading: '9 August 2018, I was there',
          folderPath: '/assets/img/photography/08-ndp-singapore/',
          images: singaporeNdp,
          cameraModel: 'Fujifilm XE-1',
          lensModel: '35 mm f/1.4'
        },
        'kl-life': {
          heading: 'KL Tech Life',
          subheading: 'Google I/O, Magic and buffet....',
          folderPath: '/assets/img/photography/11-kl-life/',
          images: klLife,
          cameraModel: 'Fujifilm XE-1',
          lensModel: '35 mm f/1.4'
        },
        'singapore-random': {
          heading: 'Around Singapore',
          subheading: 'Chinatown, Downtown, etc',
          folderPath: '/assets/img/photography/09-singapore-chinatown/',
          images: singaporeRandom,
          cameraModel: 'Fujifilm XE-1',
          lensModel: '35 mm f/1.4'
        },
        'singapore-clarke-quay': {
          heading: 'Clarke Quay Singapore',
          subheading: 'evening walk here',
          folderPath: '/assets/img/photography/10-singapore-clarke-quay/',
          images: singaporeClarkeQuay,
          cameraModel: 'Fujifilm XE-1',
          lensModel: '35 mm f/1.4'
        },
        'singapore-life': {
          heading: 'Singapore Life',
          subheading: 'Random walk in the city',
          folderPath: '/assets/img/photography/12-singapore-life/',
          images: singaporeLife,
          cameraModel: 'Fujifilm XE-1',
          lensModel: '35 mm f/1.4'
        },
        'bali': {
          heading: 'Bali, Indonesia',
          subheading: 'A day in paradise',
          folderPath: '/assets/img/photography/13-bali/',
          images: bali,
          cameraModel: 'Fujifilm XE-1',
          lensModel: '35 mm f/1.4'
        }
      }
    },
    actions: {
      showLightbox: function showLightbox(value) {
        return function (state) {
          return _objectSpread2({}, state, {
            lightbox: {
              show: true,
              src: value
            }
          });
        };
      },
      hideLightbox: function hideLightbox(value) {
        return function (state) {
          return {
            lightbox: {
              show: false,
              src: null
            }
          };
        };
      }
    }
  };

  var guitarModule = {
    state: {
      songs: ['https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/157502847&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true', 'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/153449882&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true', 'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/150634086&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true', 'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/150323475&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true']
    }
  };

  var state = Object.assign({}, {
    header: 'alextanhongpin',
    username: 'Alex Tan',
    footer: "Copyright \xA9 ".concat(new Date().getFullYear(), " alextanhongpin"),
    profileImg: '/assets/img/profile.jpg',
    // Register state for @hyperapp/router
    // location: location.state,
    links: [{
      to: '/',
      label: 'Home'
    }, {
      to: '/contacts',
      label: 'Contact'
    }, {
      to: '/photos',
      label: 'Photo'
    }, {
      to: '/books',
      label: 'Book'
    }, {
      to: '/songs',
      label: 'Guitar'
    }, {
      to: '/codes',
      label: 'Code'
    }]
  }, typewriterModule.state, bookModule.state, photographyModule.state, guitarModule.state);
  var actions = Object.assign({}, _objectSpread2({
    // Register actions for @hyperapp/router
    location: location.actions
  }, typewriterModule.actions, {}, photographyModule.actions));

  var _view = function view(_ref) {
    var header = _ref.header,
        username = _ref.username,
        profileImg = _ref.profileImg,
        links = _ref.links,
        footer = _ref.footer;
    return h("main", {
      "class": 'main'
    }, h(component, {
      header: header,
      username: username,
      profileImg: profileImg
    }));
  }; // <Navbar links={links} />
  // <Footer footer={footer} />
  // <Route path='/' render={HomePage(state, actions)} />
  //
  // <Route path='/about' render={AboutPage} />
  // <Route parent path='/photos' render={PhotographyPage(state, actions)} />
  // <Route path='/books' render={BookPage(state, actions)} />
  // <Route path='/songs' render={GuitarPage(state, actions)} />
  // <Route path='/contacts' render={ContactPage(state, actions)} />
  // <Route path='/codes' render={ProgrammingPage(state, actions)} />


  app({
    node: document.getElementById('app'),
    view: function view(state) {
      return _view(state);
    },
    init: state
  });

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9oeXBlcmFwcC9zcmMvaW5kZXguanMiLCIuLi9zcmMvYXRvbWljL2F0b21zL0hlYWRlci9pbmRleC5qcyIsIi4uL3NyYy9zdG9yZS90eXBld3JpdGVyL2luZGV4LmpzIiwiLi4vc3JjL3N0b3JlL2Jvb2svaW5kZXguanMiLCIuLi9zcmMvc3RvcmUvcGhvdG8vc2luZ2Fwb3JlLW5hdGlvbmFsLWRheS1wYXJhZGUuanMiLCIuLi9zcmMvc3RvcmUvcGhvdG8vc2luZ2Fwb3JlLXJhbmRvbS5qcyIsIi4uL3NyYy9zdG9yZS9waG90by9zaW5nYXBvcmUtY2xhcmtlLXF1YXkuanMiLCIuLi9zcmMvc3RvcmUvcGhvdG8va2wtbGlmZS5qcyIsIi4uL3NyYy9zdG9yZS9waG90by9iYWxpLmpzIiwiLi4vc3JjL3N0b3JlL3Bob3RvL3NpbmdhcG9yZS1saWZlLmpzIiwiLi4vc3JjL3N0b3JlL3Bob3RvL2luZGV4LmpzIiwiLi4vc3JjL3N0b3JlL2d1aXRhci9pbmRleC5qcyIsIi4uL3NyYy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgUkVDWUNMRURfTk9ERSA9IDFcbnZhciBMQVpZX05PREUgPSAyXG52YXIgVEVYVF9OT0RFID0gM1xudmFyIEVNUFRZX09CSiA9IHt9XG52YXIgRU1QVFlfQVJSID0gW11cbnZhciBtYXAgPSBFTVBUWV9BUlIubWFwXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXlcbnZhciBkZWZlciA9XG4gIHR5cGVvZiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgIT09IFwidW5kZWZpbmVkXCJcbiAgICA/IHJlcXVlc3RBbmltYXRpb25GcmFtZVxuICAgIDogc2V0VGltZW91dFxuXG52YXIgY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbihvYmopIHtcbiAgdmFyIG91dCA9IFwiXCJcblxuICBpZiAodHlwZW9mIG9iaiA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIG9ialxuXG4gIGlmIChpc0FycmF5KG9iaikgJiYgb2JqLmxlbmd0aCA+IDApIHtcbiAgICBmb3IgKHZhciBrID0gMCwgdG1wOyBrIDwgb2JqLmxlbmd0aDsgaysrKSB7XG4gICAgICBpZiAoKHRtcCA9IGNyZWF0ZUNsYXNzKG9ialtrXSkpICE9PSBcIlwiKSB7XG4gICAgICAgIG91dCArPSAob3V0ICYmIFwiIFwiKSArIHRtcFxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBmb3IgKHZhciBrIGluIG9iaikge1xuICAgICAgaWYgKG9ialtrXSkge1xuICAgICAgICBvdXQgKz0gKG91dCAmJiBcIiBcIikgKyBrXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG91dFxufVxuXG52YXIgbWVyZ2UgPSBmdW5jdGlvbihhLCBiKSB7XG4gIHZhciBvdXQgPSB7fVxuXG4gIGZvciAodmFyIGsgaW4gYSkgb3V0W2tdID0gYVtrXVxuICBmb3IgKHZhciBrIGluIGIpIG91dFtrXSA9IGJba11cblxuICByZXR1cm4gb3V0XG59XG5cbnZhciBiYXRjaCA9IGZ1bmN0aW9uKGxpc3QpIHtcbiAgcmV0dXJuIGxpc3QucmVkdWNlKGZ1bmN0aW9uKG91dCwgaXRlbSkge1xuICAgIHJldHVybiBvdXQuY29uY2F0KFxuICAgICAgIWl0ZW0gfHwgaXRlbSA9PT0gdHJ1ZVxuICAgICAgICA/IDBcbiAgICAgICAgOiB0eXBlb2YgaXRlbVswXSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgID8gW2l0ZW1dXG4gICAgICAgIDogYmF0Y2goaXRlbSlcbiAgICApXG4gIH0sIEVNUFRZX0FSUilcbn1cblxudmFyIGlzU2FtZUFjdGlvbiA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgcmV0dXJuIGlzQXJyYXkoYSkgJiYgaXNBcnJheShiKSAmJiBhWzBdID09PSBiWzBdICYmIHR5cGVvZiBhWzBdID09PSBcImZ1bmN0aW9uXCJcbn1cblxudmFyIHNob3VsZFJlc3RhcnQgPSBmdW5jdGlvbihhLCBiKSB7XG4gIGlmIChhICE9PSBiKSB7XG4gICAgZm9yICh2YXIgayBpbiBtZXJnZShhLCBiKSkge1xuICAgICAgaWYgKGFba10gIT09IGJba10gJiYgIWlzU2FtZUFjdGlvbihhW2tdLCBiW2tdKSkgcmV0dXJuIHRydWVcbiAgICAgIGJba10gPSBhW2tdXG4gICAgfVxuICB9XG59XG5cbnZhciBwYXRjaFN1YnMgPSBmdW5jdGlvbihvbGRTdWJzLCBuZXdTdWJzLCBkaXNwYXRjaCkge1xuICBmb3IgKFxuICAgIHZhciBpID0gMCwgb2xkU3ViLCBuZXdTdWIsIHN1YnMgPSBbXTtcbiAgICBpIDwgb2xkU3Vicy5sZW5ndGggfHwgaSA8IG5ld1N1YnMubGVuZ3RoO1xuICAgIGkrK1xuICApIHtcbiAgICBvbGRTdWIgPSBvbGRTdWJzW2ldXG4gICAgbmV3U3ViID0gbmV3U3Vic1tpXVxuICAgIHN1YnMucHVzaChcbiAgICAgIG5ld1N1YlxuICAgICAgICA/ICFvbGRTdWIgfHxcbiAgICAgICAgICBuZXdTdWJbMF0gIT09IG9sZFN1YlswXSB8fFxuICAgICAgICAgIHNob3VsZFJlc3RhcnQobmV3U3ViWzFdLCBvbGRTdWJbMV0pXG4gICAgICAgICAgPyBbXG4gICAgICAgICAgICAgIG5ld1N1YlswXSxcbiAgICAgICAgICAgICAgbmV3U3ViWzFdLFxuICAgICAgICAgICAgICBuZXdTdWJbMF0oZGlzcGF0Y2gsIG5ld1N1YlsxXSksXG4gICAgICAgICAgICAgIG9sZFN1YiAmJiBvbGRTdWJbMl0oKVxuICAgICAgICAgICAgXVxuICAgICAgICAgIDogb2xkU3ViXG4gICAgICAgIDogb2xkU3ViICYmIG9sZFN1YlsyXSgpXG4gICAgKVxuICB9XG4gIHJldHVybiBzdWJzXG59XG5cbnZhciBwYXRjaFByb3BlcnR5ID0gZnVuY3Rpb24obm9kZSwga2V5LCBvbGRWYWx1ZSwgbmV3VmFsdWUsIGxpc3RlbmVyLCBpc1N2Zykge1xuICBpZiAoa2V5ID09PSBcImtleVwiKSB7XG4gIH0gZWxzZSBpZiAoa2V5ID09PSBcInN0eWxlXCIpIHtcbiAgICBmb3IgKHZhciBrIGluIG1lcmdlKG9sZFZhbHVlLCBuZXdWYWx1ZSkpIHtcbiAgICAgIG9sZFZhbHVlID0gbmV3VmFsdWUgPT0gbnVsbCB8fCBuZXdWYWx1ZVtrXSA9PSBudWxsID8gXCJcIiA6IG5ld1ZhbHVlW2tdXG4gICAgICBpZiAoa1swXSA9PT0gXCItXCIpIHtcbiAgICAgICAgbm9kZVtrZXldLnNldFByb3BlcnR5KGssIG9sZFZhbHVlKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbm9kZVtrZXldW2tdID0gb2xkVmFsdWVcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAoa2V5WzBdID09PSBcIm9cIiAmJiBrZXlbMV0gPT09IFwiblwiKSB7XG4gICAgaWYgKFxuICAgICAgISgobm9kZS5hY3Rpb25zIHx8IChub2RlLmFjdGlvbnMgPSB7fSkpW1xuICAgICAgICAoa2V5ID0ga2V5LnNsaWNlKDIpLnRvTG93ZXJDYXNlKCkpXG4gICAgICBdID0gbmV3VmFsdWUpXG4gICAgKSB7XG4gICAgICBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoa2V5LCBsaXN0ZW5lcilcbiAgICB9IGVsc2UgaWYgKCFvbGRWYWx1ZSkge1xuICAgICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKGtleSwgbGlzdGVuZXIpXG4gICAgfVxuICB9IGVsc2UgaWYgKCFpc1N2ZyAmJiBrZXkgIT09IFwibGlzdFwiICYmIGtleSBpbiBub2RlKSB7XG4gICAgbm9kZVtrZXldID0gbmV3VmFsdWUgPT0gbnVsbCA/IFwiXCIgOiBuZXdWYWx1ZVxuICB9IGVsc2UgaWYgKFxuICAgIG5ld1ZhbHVlID09IG51bGwgfHxcbiAgICBuZXdWYWx1ZSA9PT0gZmFsc2UgfHxcbiAgICAoa2V5ID09PSBcImNsYXNzXCIgJiYgIShuZXdWYWx1ZSA9IGNyZWF0ZUNsYXNzKG5ld1ZhbHVlKSkpXG4gICkge1xuICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKGtleSlcbiAgfSBlbHNlIHtcbiAgICBub2RlLnNldEF0dHJpYnV0ZShrZXksIG5ld1ZhbHVlKVxuICB9XG59XG5cbnZhciBjcmVhdGVOb2RlID0gZnVuY3Rpb24odmRvbSwgbGlzdGVuZXIsIGlzU3ZnKSB7XG4gIHZhciBucyA9IFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIlxuICB2YXIgcHJvcHMgPSB2ZG9tLnByb3BzXG4gIHZhciBub2RlID1cbiAgICB2ZG9tLnR5cGUgPT09IFRFWFRfTk9ERVxuICAgICAgPyBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh2ZG9tLm5hbWUpXG4gICAgICA6IChpc1N2ZyA9IGlzU3ZnIHx8IHZkb20ubmFtZSA9PT0gXCJzdmdcIilcbiAgICAgID8gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5zLCB2ZG9tLm5hbWUsIHsgaXM6IHByb3BzLmlzIH0pXG4gICAgICA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodmRvbS5uYW1lLCB7IGlzOiBwcm9wcy5pcyB9KVxuXG4gIGZvciAodmFyIGsgaW4gcHJvcHMpIHtcbiAgICBwYXRjaFByb3BlcnR5KG5vZGUsIGssIG51bGwsIHByb3BzW2tdLCBsaXN0ZW5lciwgaXNTdmcpXG4gIH1cblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gdmRvbS5jaGlsZHJlbi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIG5vZGUuYXBwZW5kQ2hpbGQoXG4gICAgICBjcmVhdGVOb2RlKFxuICAgICAgICAodmRvbS5jaGlsZHJlbltpXSA9IGdldFZOb2RlKHZkb20uY2hpbGRyZW5baV0pKSxcbiAgICAgICAgbGlzdGVuZXIsXG4gICAgICAgIGlzU3ZnXG4gICAgICApXG4gICAgKVxuICB9XG5cbiAgcmV0dXJuICh2ZG9tLm5vZGUgPSBub2RlKVxufVxuXG52YXIgZ2V0S2V5ID0gZnVuY3Rpb24odmRvbSkge1xuICByZXR1cm4gdmRvbSA9PSBudWxsID8gbnVsbCA6IHZkb20ua2V5XG59XG5cbnZhciBwYXRjaCA9IGZ1bmN0aW9uKHBhcmVudCwgbm9kZSwgb2xkVk5vZGUsIG5ld1ZOb2RlLCBsaXN0ZW5lciwgaXNTdmcpIHtcbiAgaWYgKG9sZFZOb2RlID09PSBuZXdWTm9kZSkge1xuICB9IGVsc2UgaWYgKFxuICAgIG9sZFZOb2RlICE9IG51bGwgJiZcbiAgICBvbGRWTm9kZS50eXBlID09PSBURVhUX05PREUgJiZcbiAgICBuZXdWTm9kZS50eXBlID09PSBURVhUX05PREVcbiAgKSB7XG4gICAgaWYgKG9sZFZOb2RlLm5hbWUgIT09IG5ld1ZOb2RlLm5hbWUpIG5vZGUubm9kZVZhbHVlID0gbmV3Vk5vZGUubmFtZVxuICB9IGVsc2UgaWYgKG9sZFZOb2RlID09IG51bGwgfHwgb2xkVk5vZGUubmFtZSAhPT0gbmV3Vk5vZGUubmFtZSkge1xuICAgIG5vZGUgPSBwYXJlbnQuaW5zZXJ0QmVmb3JlKFxuICAgICAgY3JlYXRlTm9kZSgobmV3Vk5vZGUgPSBnZXRWTm9kZShuZXdWTm9kZSkpLCBsaXN0ZW5lciwgaXNTdmcpLFxuICAgICAgbm9kZVxuICAgIClcbiAgICBpZiAob2xkVk5vZGUgIT0gbnVsbCkge1xuICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKG9sZFZOb2RlLm5vZGUpXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciB0bXBWS2lkXG4gICAgdmFyIG9sZFZLaWRcblxuICAgIHZhciBvbGRLZXlcbiAgICB2YXIgbmV3S2V5XG5cbiAgICB2YXIgb2xkVlByb3BzID0gb2xkVk5vZGUucHJvcHNcbiAgICB2YXIgbmV3VlByb3BzID0gbmV3Vk5vZGUucHJvcHNcblxuICAgIHZhciBvbGRWS2lkcyA9IG9sZFZOb2RlLmNoaWxkcmVuXG4gICAgdmFyIG5ld1ZLaWRzID0gbmV3Vk5vZGUuY2hpbGRyZW5cblxuICAgIHZhciBvbGRIZWFkID0gMFxuICAgIHZhciBuZXdIZWFkID0gMFxuICAgIHZhciBvbGRUYWlsID0gb2xkVktpZHMubGVuZ3RoIC0gMVxuICAgIHZhciBuZXdUYWlsID0gbmV3VktpZHMubGVuZ3RoIC0gMVxuXG4gICAgaXNTdmcgPSBpc1N2ZyB8fCBuZXdWTm9kZS5uYW1lID09PSBcInN2Z1wiXG5cbiAgICBmb3IgKHZhciBpIGluIG1lcmdlKG9sZFZQcm9wcywgbmV3VlByb3BzKSkge1xuICAgICAgaWYgKFxuICAgICAgICAoaSA9PT0gXCJ2YWx1ZVwiIHx8IGkgPT09IFwic2VsZWN0ZWRcIiB8fCBpID09PSBcImNoZWNrZWRcIlxuICAgICAgICAgID8gbm9kZVtpXVxuICAgICAgICAgIDogb2xkVlByb3BzW2ldKSAhPT0gbmV3VlByb3BzW2ldXG4gICAgICApIHtcbiAgICAgICAgcGF0Y2hQcm9wZXJ0eShub2RlLCBpLCBvbGRWUHJvcHNbaV0sIG5ld1ZQcm9wc1tpXSwgbGlzdGVuZXIsIGlzU3ZnKVxuICAgICAgfVxuICAgIH1cblxuICAgIHdoaWxlIChuZXdIZWFkIDw9IG5ld1RhaWwgJiYgb2xkSGVhZCA8PSBvbGRUYWlsKSB7XG4gICAgICBpZiAoXG4gICAgICAgIChvbGRLZXkgPSBnZXRLZXkob2xkVktpZHNbb2xkSGVhZF0pKSA9PSBudWxsIHx8XG4gICAgICAgIG9sZEtleSAhPT0gZ2V0S2V5KG5ld1ZLaWRzW25ld0hlYWRdKVxuICAgICAgKSB7XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG5cbiAgICAgIHBhdGNoKFxuICAgICAgICBub2RlLFxuICAgICAgICBvbGRWS2lkc1tvbGRIZWFkXS5ub2RlLFxuICAgICAgICBvbGRWS2lkc1tvbGRIZWFkXSxcbiAgICAgICAgKG5ld1ZLaWRzW25ld0hlYWRdID0gZ2V0Vk5vZGUoXG4gICAgICAgICAgbmV3VktpZHNbbmV3SGVhZCsrXSxcbiAgICAgICAgICBvbGRWS2lkc1tvbGRIZWFkKytdXG4gICAgICAgICkpLFxuICAgICAgICBsaXN0ZW5lcixcbiAgICAgICAgaXNTdmdcbiAgICAgIClcbiAgICB9XG5cbiAgICB3aGlsZSAobmV3SGVhZCA8PSBuZXdUYWlsICYmIG9sZEhlYWQgPD0gb2xkVGFpbCkge1xuICAgICAgaWYgKFxuICAgICAgICAob2xkS2V5ID0gZ2V0S2V5KG9sZFZLaWRzW29sZFRhaWxdKSkgPT0gbnVsbCB8fFxuICAgICAgICBvbGRLZXkgIT09IGdldEtleShuZXdWS2lkc1tuZXdUYWlsXSlcbiAgICAgICkge1xuICAgICAgICBicmVha1xuICAgICAgfVxuXG4gICAgICBwYXRjaChcbiAgICAgICAgbm9kZSxcbiAgICAgICAgb2xkVktpZHNbb2xkVGFpbF0ubm9kZSxcbiAgICAgICAgb2xkVktpZHNbb2xkVGFpbF0sXG4gICAgICAgIChuZXdWS2lkc1tuZXdUYWlsXSA9IGdldFZOb2RlKFxuICAgICAgICAgIG5ld1ZLaWRzW25ld1RhaWwtLV0sXG4gICAgICAgICAgb2xkVktpZHNbb2xkVGFpbC0tXVxuICAgICAgICApKSxcbiAgICAgICAgbGlzdGVuZXIsXG4gICAgICAgIGlzU3ZnXG4gICAgICApXG4gICAgfVxuXG4gICAgaWYgKG9sZEhlYWQgPiBvbGRUYWlsKSB7XG4gICAgICB3aGlsZSAobmV3SGVhZCA8PSBuZXdUYWlsKSB7XG4gICAgICAgIG5vZGUuaW5zZXJ0QmVmb3JlKFxuICAgICAgICAgIGNyZWF0ZU5vZGUoXG4gICAgICAgICAgICAobmV3VktpZHNbbmV3SGVhZF0gPSBnZXRWTm9kZShuZXdWS2lkc1tuZXdIZWFkKytdKSksXG4gICAgICAgICAgICBsaXN0ZW5lcixcbiAgICAgICAgICAgIGlzU3ZnXG4gICAgICAgICAgKSxcbiAgICAgICAgICAob2xkVktpZCA9IG9sZFZLaWRzW29sZEhlYWRdKSAmJiBvbGRWS2lkLm5vZGVcbiAgICAgICAgKVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAobmV3SGVhZCA+IG5ld1RhaWwpIHtcbiAgICAgIHdoaWxlIChvbGRIZWFkIDw9IG9sZFRhaWwpIHtcbiAgICAgICAgbm9kZS5yZW1vdmVDaGlsZChvbGRWS2lkc1tvbGRIZWFkKytdLm5vZGUpXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAodmFyIGkgPSBvbGRIZWFkLCBrZXllZCA9IHt9LCBuZXdLZXllZCA9IHt9OyBpIDw9IG9sZFRhaWw7IGkrKykge1xuICAgICAgICBpZiAoKG9sZEtleSA9IG9sZFZLaWRzW2ldLmtleSkgIT0gbnVsbCkge1xuICAgICAgICAgIGtleWVkW29sZEtleV0gPSBvbGRWS2lkc1tpXVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHdoaWxlIChuZXdIZWFkIDw9IG5ld1RhaWwpIHtcbiAgICAgICAgb2xkS2V5ID0gZ2V0S2V5KChvbGRWS2lkID0gb2xkVktpZHNbb2xkSGVhZF0pKVxuICAgICAgICBuZXdLZXkgPSBnZXRLZXkoXG4gICAgICAgICAgKG5ld1ZLaWRzW25ld0hlYWRdID0gZ2V0Vk5vZGUobmV3VktpZHNbbmV3SGVhZF0sIG9sZFZLaWQpKVxuICAgICAgICApXG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIG5ld0tleWVkW29sZEtleV0gfHxcbiAgICAgICAgICAobmV3S2V5ICE9IG51bGwgJiYgbmV3S2V5ID09PSBnZXRLZXkob2xkVktpZHNbb2xkSGVhZCArIDFdKSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgaWYgKG9sZEtleSA9PSBudWxsKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZUNoaWxkKG9sZFZLaWQubm9kZSlcbiAgICAgICAgICB9XG4gICAgICAgICAgb2xkSGVhZCsrXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChuZXdLZXkgPT0gbnVsbCB8fCBvbGRWTm9kZS50eXBlID09PSBSRUNZQ0xFRF9OT0RFKSB7XG4gICAgICAgICAgaWYgKG9sZEtleSA9PSBudWxsKSB7XG4gICAgICAgICAgICBwYXRjaChcbiAgICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgICAgb2xkVktpZCAmJiBvbGRWS2lkLm5vZGUsXG4gICAgICAgICAgICAgIG9sZFZLaWQsXG4gICAgICAgICAgICAgIG5ld1ZLaWRzW25ld0hlYWRdLFxuICAgICAgICAgICAgICBsaXN0ZW5lcixcbiAgICAgICAgICAgICAgaXNTdmdcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIG5ld0hlYWQrK1xuICAgICAgICAgIH1cbiAgICAgICAgICBvbGRIZWFkKytcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAob2xkS2V5ID09PSBuZXdLZXkpIHtcbiAgICAgICAgICAgIHBhdGNoKFxuICAgICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgICBvbGRWS2lkLm5vZGUsXG4gICAgICAgICAgICAgIG9sZFZLaWQsXG4gICAgICAgICAgICAgIG5ld1ZLaWRzW25ld0hlYWRdLFxuICAgICAgICAgICAgICBsaXN0ZW5lcixcbiAgICAgICAgICAgICAgaXNTdmdcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIG5ld0tleWVkW25ld0tleV0gPSB0cnVlXG4gICAgICAgICAgICBvbGRIZWFkKytcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCh0bXBWS2lkID0ga2V5ZWRbbmV3S2V5XSkgIT0gbnVsbCkge1xuICAgICAgICAgICAgICBwYXRjaChcbiAgICAgICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgICAgIG5vZGUuaW5zZXJ0QmVmb3JlKHRtcFZLaWQubm9kZSwgb2xkVktpZCAmJiBvbGRWS2lkLm5vZGUpLFxuICAgICAgICAgICAgICAgIHRtcFZLaWQsXG4gICAgICAgICAgICAgICAgbmV3VktpZHNbbmV3SGVhZF0sXG4gICAgICAgICAgICAgICAgbGlzdGVuZXIsXG4gICAgICAgICAgICAgICAgaXNTdmdcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICBuZXdLZXllZFtuZXdLZXldID0gdHJ1ZVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGF0Y2goXG4gICAgICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgICAgICBvbGRWS2lkICYmIG9sZFZLaWQubm9kZSxcbiAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgIG5ld1ZLaWRzW25ld0hlYWRdLFxuICAgICAgICAgICAgICAgIGxpc3RlbmVyLFxuICAgICAgICAgICAgICAgIGlzU3ZnXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgbmV3SGVhZCsrXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgd2hpbGUgKG9sZEhlYWQgPD0gb2xkVGFpbCkge1xuICAgICAgICBpZiAoZ2V0S2V5KChvbGRWS2lkID0gb2xkVktpZHNbb2xkSGVhZCsrXSkpID09IG51bGwpIHtcbiAgICAgICAgICBub2RlLnJlbW92ZUNoaWxkKG9sZFZLaWQubm9kZSlcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmb3IgKHZhciBpIGluIGtleWVkKSB7XG4gICAgICAgIGlmIChuZXdLZXllZFtpXSA9PSBudWxsKSB7XG4gICAgICAgICAgbm9kZS5yZW1vdmVDaGlsZChrZXllZFtpXS5ub2RlKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIChuZXdWTm9kZS5ub2RlID0gbm9kZSlcbn1cblxudmFyIHByb3BzQ2hhbmdlZCA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgZm9yICh2YXIgayBpbiBhKSBpZiAoYVtrXSAhPT0gYltrXSkgcmV0dXJuIHRydWVcbiAgZm9yICh2YXIgayBpbiBiKSBpZiAoYVtrXSAhPT0gYltrXSkgcmV0dXJuIHRydWVcbn1cblxudmFyIGdldFRleHRWTm9kZSA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgcmV0dXJuIHR5cGVvZiBub2RlID09PSBcIm9iamVjdFwiID8gbm9kZSA6IGNyZWF0ZVRleHRWTm9kZShub2RlKVxufVxuXG52YXIgZ2V0Vk5vZGUgPSBmdW5jdGlvbihuZXdWTm9kZSwgb2xkVk5vZGUpIHtcbiAgcmV0dXJuIG5ld1ZOb2RlLnR5cGUgPT09IExBWllfTk9ERVxuICAgID8gKCghb2xkVk5vZGUgfHwgIW9sZFZOb2RlLmxhenkgfHwgcHJvcHNDaGFuZ2VkKG9sZFZOb2RlLmxhenksIG5ld1ZOb2RlLmxhenkpKVxuICAgICAgICAmJiAoKG9sZFZOb2RlID0gZ2V0VGV4dFZOb2RlKG5ld1ZOb2RlLmxhenkudmlldyhuZXdWTm9kZS5sYXp5KSkpLmxhenkgPVxuICAgICAgICAgIG5ld1ZOb2RlLmxhenkpLFxuICAgICAgb2xkVk5vZGUpXG4gICAgOiBuZXdWTm9kZVxufVxuXG52YXIgY3JlYXRlVk5vZGUgPSBmdW5jdGlvbihuYW1lLCBwcm9wcywgY2hpbGRyZW4sIG5vZGUsIGtleSwgdHlwZSkge1xuICByZXR1cm4ge1xuICAgIG5hbWU6IG5hbWUsXG4gICAgcHJvcHM6IHByb3BzLFxuICAgIGNoaWxkcmVuOiBjaGlsZHJlbixcbiAgICBub2RlOiBub2RlLFxuICAgIHR5cGU6IHR5cGUsXG4gICAga2V5OiBrZXlcbiAgfVxufVxuXG52YXIgY3JlYXRlVGV4dFZOb2RlID0gZnVuY3Rpb24odmFsdWUsIG5vZGUpIHtcbiAgcmV0dXJuIGNyZWF0ZVZOb2RlKHZhbHVlLCBFTVBUWV9PQkosIEVNUFRZX0FSUiwgbm9kZSwgdW5kZWZpbmVkLCBURVhUX05PREUpXG59XG5cbnZhciByZWN5Y2xlTm9kZSA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgcmV0dXJuIG5vZGUubm9kZVR5cGUgPT09IFRFWFRfTk9ERVxuICAgID8gY3JlYXRlVGV4dFZOb2RlKG5vZGUubm9kZVZhbHVlLCBub2RlKVxuICAgIDogY3JlYXRlVk5vZGUoXG4gICAgICAgIG5vZGUubm9kZU5hbWUudG9Mb3dlckNhc2UoKSxcbiAgICAgICAgRU1QVFlfT0JKLFxuICAgICAgICBtYXAuY2FsbChub2RlLmNoaWxkTm9kZXMsIHJlY3ljbGVOb2RlKSxcbiAgICAgICAgbm9kZSxcbiAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICBSRUNZQ0xFRF9OT0RFXG4gICAgICApXG59XG5cbmV4cG9ydCB2YXIgTGF6eSA9IGZ1bmN0aW9uKHByb3BzKSB7XG4gIHJldHVybiB7XG4gICAgbGF6eTogcHJvcHMsXG4gICAgdHlwZTogTEFaWV9OT0RFXG4gIH1cbn1cblxuZXhwb3J0IHZhciBoID0gZnVuY3Rpb24obmFtZSwgcHJvcHMpIHtcbiAgZm9yICh2YXIgdmRvbSwgcmVzdCA9IFtdLCBjaGlsZHJlbiA9IFtdLCBpID0gYXJndW1lbnRzLmxlbmd0aDsgaS0tID4gMjsgKSB7XG4gICAgcmVzdC5wdXNoKGFyZ3VtZW50c1tpXSlcbiAgfVxuXG4gIHdoaWxlIChyZXN0Lmxlbmd0aCA+IDApIHtcbiAgICBpZiAoaXNBcnJheSgodmRvbSA9IHJlc3QucG9wKCkpKSkge1xuICAgICAgZm9yICh2YXIgaSA9IHZkb20ubGVuZ3RoOyBpLS0gPiAwOyApIHtcbiAgICAgICAgcmVzdC5wdXNoKHZkb21baV0pXG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh2ZG9tID09PSBmYWxzZSB8fCB2ZG9tID09PSB0cnVlIHx8IHZkb20gPT0gbnVsbCkge1xuICAgIH0gZWxzZSB7XG4gICAgICBjaGlsZHJlbi5wdXNoKGdldFRleHRWTm9kZSh2ZG9tKSlcbiAgICB9XG4gIH1cblxuICBwcm9wcyA9IHByb3BzIHx8IEVNUFRZX09CSlxuXG4gIHJldHVybiB0eXBlb2YgbmFtZSA9PT0gXCJmdW5jdGlvblwiXG4gICAgPyBuYW1lKHByb3BzLCBjaGlsZHJlbilcbiAgICA6IGNyZWF0ZVZOb2RlKG5hbWUsIHByb3BzLCBjaGlsZHJlbiwgdW5kZWZpbmVkLCBwcm9wcy5rZXkpXG59XG5cbmV4cG9ydCB2YXIgYXBwID0gZnVuY3Rpb24ocHJvcHMpIHtcbiAgdmFyIHN0YXRlID0ge31cbiAgdmFyIGxvY2sgPSBmYWxzZVxuICB2YXIgdmlldyA9IHByb3BzLnZpZXdcbiAgdmFyIG5vZGUgPSBwcm9wcy5ub2RlXG4gIHZhciB2ZG9tID0gbm9kZSAmJiByZWN5Y2xlTm9kZShub2RlKVxuICB2YXIgc3Vic2NyaXB0aW9ucyA9IHByb3BzLnN1YnNjcmlwdGlvbnNcbiAgdmFyIHN1YnMgPSBbXVxuXG4gIHZhciBsaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgZGlzcGF0Y2godGhpcy5hY3Rpb25zW2V2ZW50LnR5cGVdLCBldmVudClcbiAgfVxuXG4gIHZhciBzZXRTdGF0ZSA9IGZ1bmN0aW9uKG5ld1N0YXRlKSB7XG4gICAgaWYgKHN0YXRlICE9PSBuZXdTdGF0ZSkge1xuICAgICAgc3RhdGUgPSBuZXdTdGF0ZVxuICAgICAgaWYgKHN1YnNjcmlwdGlvbnMpIHtcbiAgICAgICAgc3VicyA9IHBhdGNoU3VicyhzdWJzLCBiYXRjaChbc3Vic2NyaXB0aW9ucyhzdGF0ZSldKSwgZGlzcGF0Y2gpXG4gICAgICB9XG4gICAgICBpZiAodmlldyAmJiAhbG9jaykgZGVmZXIocmVuZGVyLCAobG9jayA9IHRydWUpKVxuICAgIH1cbiAgICByZXR1cm4gc3RhdGVcbiAgfVxuXG4gIHZhciBkaXNwYXRjaCA9IChwcm9wcy5taWRkbGV3YXJlIHx8XG4gICAgZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gb2JqXG4gICAgfSkoZnVuY3Rpb24oYWN0aW9uLCBwcm9wcykge1xuICAgIHJldHVybiB0eXBlb2YgYWN0aW9uID09PSBcImZ1bmN0aW9uXCJcbiAgICAgID8gZGlzcGF0Y2goYWN0aW9uKHN0YXRlLCBwcm9wcykpXG4gICAgICA6IGlzQXJyYXkoYWN0aW9uKVxuICAgICAgPyB0eXBlb2YgYWN0aW9uWzBdID09PSBcImZ1bmN0aW9uXCIgfHwgaXNBcnJheShhY3Rpb25bMF0pXG4gICAgICAgID8gZGlzcGF0Y2goXG4gICAgICAgICAgICBhY3Rpb25bMF0sXG4gICAgICAgICAgICB0eXBlb2YgYWN0aW9uWzFdID09PSBcImZ1bmN0aW9uXCIgPyBhY3Rpb25bMV0ocHJvcHMpIDogYWN0aW9uWzFdXG4gICAgICAgICAgKVxuICAgICAgICA6IChiYXRjaChhY3Rpb24uc2xpY2UoMSkpLm1hcChmdW5jdGlvbihmeCkge1xuICAgICAgICAgICAgZnggJiYgZnhbMF0oZGlzcGF0Y2gsIGZ4WzFdKVxuICAgICAgICAgIH0sIHNldFN0YXRlKGFjdGlvblswXSkpLFxuICAgICAgICAgIHN0YXRlKVxuICAgICAgOiBzZXRTdGF0ZShhY3Rpb24pXG4gIH0pXG5cbiAgdmFyIHJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICAgIGxvY2sgPSBmYWxzZVxuICAgIG5vZGUgPSBwYXRjaChcbiAgICAgIG5vZGUucGFyZW50Tm9kZSxcbiAgICAgIG5vZGUsXG4gICAgICB2ZG9tLFxuICAgICAgKHZkb20gPSBnZXRUZXh0Vk5vZGUodmlldyhzdGF0ZSkpKSxcbiAgICAgIGxpc3RlbmVyXG4gICAgKVxuICB9XG5cbiAgZGlzcGF0Y2gocHJvcHMuaW5pdClcbn1cbiIsImltcG9ydCB7IGggfSBmcm9tICdoeXBlcmFwcCdcbi8vIGltcG9ydCB7IExpbmsgfSBmcm9tICdAaHlwZXJhcHAvcm91dGVyJ1xuaW1wb3J0ICcuL2luZGV4LmNzcydcbi8vIDxMaW5rIGNsYXNzPSdoZWFkZXItYnJhbmQnIHRvPScvJz57aGVhZGVyfTwvTGluaz5cblxuY29uc3QgY29tcG9uZW50ID0gKHsgaGVhZGVyLCB1c2VybmFtZSA9ICdqb2huIGRvZScsIHByb2ZpbGVJbWcgfSkgPT4gKFxuICA8aGVhZGVyIGNsYXNzPSdoZWFkZXInPlxuICAgIDxkaXYgY2xhc3M9J2hlYWRlci1jb2x1bW4nPlxuICAgICAgPGRpdiBjbGFzcz0naGVhZGVyLXBob3RvLWhvbGRlcic+XG4gICAgICAgIDxkaXZcbiAgICAgICAgICBjbGFzcz0naGVhZGVyLXBob3RvJ1xuICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiBgdXJsKCR7cHJvZmlsZUltZ30pIG5vLXJlcGVhdCBjZW50ZXIgY2VudGVyIC8gY292ZXJgXG4gICAgICAgICAgfX1cbiAgICAgICAgLz5cbiAgICAgICAgPGRpdiBjbGFzcz0naGVhZGVyLXVzZXJuYW1lJz5cbiAgICAgICAgICA8aDY+e3VzZXJuYW1lfTwvaDY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIDwvaGVhZGVyPlxuKVxuXG5leHBvcnQgZGVmYXVsdCBjb21wb25lbnRcbiIsImV4cG9ydCBkZWZhdWx0IHtcbiAgc3RhdGU6IHtcbiAgICBoZWFkaW5nOiAnJyxcbiAgICBoZWFkaW5nR2hvc3Q6ICdIaSwgSSBhbSBBbGV4LicsXG4gICAgc3ViaGVhZGluZzogJycsXG4gICAgc3ViaGVhZGluZ0dob3N0OiAnVGhpcyBpcyBteSBqb3VybmV5IGFzIGEgRGV2ZWxvcGVyLidcbiAgfSxcbiAgYWN0aW9uczoge1xuICAgIHVwZGF0ZUhlYWRpbmc6IHZhbHVlID0+IHN0YXRlID0+ICh7XG4gICAgICBoZWFkaW5nOiBzdGF0ZS5oZWFkaW5nICsgdmFsdWVcbiAgICB9KSxcbiAgICB1cGRhdGVTdWJoZWFkaW5nOiB2YWx1ZSA9PiBzdGF0ZSA9PiAoe1xuICAgICAgc3ViaGVhZGluZzogc3RhdGUuc3ViaGVhZGluZyArIHZhbHVlXG4gICAgfSksXG4gICAgcmVzZXRIZWFkaW5nOiB2YWx1ZSA9PiBzdGF0ZSA9PiAoe1xuICAgICAgaGVhZGluZzogJydcbiAgICB9KSxcbiAgICByZXNldFN1YmhlYWRpbmc6IHZhbHVlID0+IHN0YXRlID0+ICh7XG4gICAgICBzdWJoZWFkaW5nOiAnJ1xuICAgIH0pXG4gIH1cbn1cbiIsImV4cG9ydCBkZWZhdWx0IHtcbiAgc3RhdGU6IHtcbiAgICBib29rczogW1xuICAgICAgeyB0aXRsZTogJ0Vtb3Rpb25hbCBJbnRlbGxpZ2VuY2UnLCBhdXRob3I6ICdEYW5pZWwgR29sZW1hbicgfSxcbiAgICAgIHsgdGl0bGU6ICdUaGUgR2lmdCBvZiBGZWFyJywgYXV0aG9yOiAnR2F2aW4gZGUgQmVja2VyJyB9LFxuICAgICAgeyB0aXRsZTogJ0luZmx1ZW5jZTogVGhlIFBzeWNob2xvZ3kgb2YgUGVyc3Vhc2lvbicsIGF1dGhvcjogJ1JvYmVydCBCLiBDaWFsZGluaScgfSxcbiAgICAgIHsgdGl0bGU6ICdUaGUgNDggTGF3cyBvZiBQb3dlcnMnLCBhdXRob3I6ICdSb2JlcnQgR3JlZW5lJyB9LFxuICAgICAgeyB0aXRsZTogJ1RoZSBBcnQgb2YgU2VkdWN0aW9uJywgYXV0aG9yOiAnUm9iZXJ0IEdyZWVuZScgfSxcbiAgICAgIHsgdGl0bGU6ICdNYXN0ZXJ5JywgYXV0aG9yOiAnUm9iZXJ0IEdyZWVuZScgfSxcbiAgICAgIHsgdGl0bGU6ICdUaGUgVGlwcGluZyBQb2ludDogSG93IExpdHRsZSBUaGluZ3MgY2FuIE1ha2UgYSBCaWcgRGlmZmVyZW5jZScsIGF1dGhvcjogJ01hbGNvbG0gVC4gR2xhZHdlbGwnIH0sXG4gICAgICB7IHRpdGxlOiAnQmxpbms6IFRoZSBQb3dlciBvZiBUaGlua2luZyBXaXRob3V0IFRoaW5raW5nJywgYXV0aG9yOiAnTWFsY29sbSBULiBHbGFkd2VsbCcgfSxcbiAgICAgIHsgdGl0bGU6ICdPdXRsaWVyczogVGhlIFN0b3J5IG9mIFN1Y2Nlc3MnLCBhdXRob3I6ICdNYWxjb2xtIFQuIEdsYWR3ZWxsJyB9LFxuICAgICAgeyB0aXRsZTogJ1doYXQgdGhlIERvZyBTYXc6IEFuZCBvdGhlciBBZHZlbnR1cmVzJywgYXV0aG9yOiAnTWFsY29sbSBULiBHbGFkd2VsbCcgfSxcbiAgICAgIHsgdGl0bGU6ICdEYXZpZCBhbmQgR29saWF0aDogVW5kZXJkb2dzLCBNaXNmaXRzLCBhbmQgdGhlIEFydCBvZiBCYXR0bGluZyBHaWFudHMnLCBhdXRob3I6ICdNYWxjb2xtIFQuIEdsYWR3ZWxsJyB9LFxuICAgICAgeyB0aXRsZTogJ0xhdGVyYWwgVGhpbmtpbmcnLCBhdXRob3I6ICdFZHdhcmQgZGUgQm9ubycgfSxcbiAgICAgIHsgdGl0bGU6ICdTaW1wbGljaXR5JywgYXV0aG9yOiAnRWR3YXJkIGRlIEJvbm8nIH0sXG4gICAgICB7IHRpdGxlOiAnU2l4IFRoaW5raW5nIEhhdHMnLCBhdXRob3I6ICdFZHdhcmQgZGUgQm9ubycgfSxcbiAgICAgIHsgdGl0bGU6ICdQbzogQmV5b25kIFllcyBhbmQgTm8nLCBhdXRob3I6ICdFZHdhcmQgZGUgQm9ubycgfSxcbiAgICAgIHsgdGl0bGU6ICdFbW90aW9uYWwgQmxhY2ttYWlsOiBXaGVuIHRoZSBQZW9wbGUgaW4gWW91ciBMaWZlIFVzZSBGZWFyLCBPYmxpZ2F0aW9uLCBhbmQgR3VpbHQgdG8gTWFuaXB1bGF0ZSBZb3UnLCBhdXRob3I6ICdTdXNhbiBGb3J3YXJkJyB9LFxuICAgICAgeyB0aXRsZTogJ0dhbWVzIFBlb3BsZSBQbGF5OiBUaGUgUHN5Y2hvbG9neSBvZiBIdW1hbiBSZWxhdGlvbnNoaXBzJywgYXV0aG9yOiAnRXJpYyBCZXJuZScgfSxcbiAgICAgIHsgdGl0bGU6ICc1MCBQc3ljaG9sb2d5IENsYXNzaWNzOiBXaG8gV2UgQXJlLCBIb3cgV2UgVGhpbmssIFdoYXQgV2UgRG86IEluc2lnaHQgYW5kIEluc3BpcmF0aW9uIGZyb20gNTAgS2V5IEJvb2tzJywgYXV0aG9yOiAnVG9tIEJ1dGxlciBCb3dkb3duJyB9LFxuICAgICAgeyB0aXRsZTogJ1RoZSBQc3ljaG9sb2d5IG9mIFNlbGYgRXN0ZWVtJywgYXV0aG9yOiAnTmF0aGFuaWVsIEJyYW5kZW4nIH0sXG4gICAgICB7IHRpdGxlOiAnQ3JlYXRpdml0eTogRmxvdyBhbmQgdGhlIFBzeWNob2xvZ3kgb2YgRGlzY292ZXJ5IGFuZCBJbnZlbnRpb25zJywgYXV0aG9yOiAnTWloYWx5IENzaWt6ZW50bWloYWx5aScgfSxcbiAgICAgIHsgdGl0bGU6ICdNeSBWb2ljZSBXaWxsIEdvIFdpdGggWW91JywgYXV0aG9yOiAnTWlsdG9uIEVyaWtzb24nIH0sXG4gICAgICB7IHRpdGxlOiAnSG93IFRlY2hub2xvZ3kgaXMgQ2hhbmdpbmcgb3VyIE1pbmRzIGZvciB0aGUgQmV0dGVyLicsIGF1dGhvcjogJ0NsaXZlIFRob21wc29uJyB9XG4gICAgXVxuICB9XG59XG4iLCJleHBvcnQgZGVmYXVsdCBbe1wibmFtZVwiOlwiRFNDRjM3MzguanBnXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI5MTgvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzczOS5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEyMDAvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzc0MC5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExMTYvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzc0MS5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExMDAvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzc0Mi5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwNDIvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzc0My5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExMDYvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzc0NC5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExNjAvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzc0NS5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExMTMvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzc0Ni5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExMjYvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzc0Ny5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExNDQvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzc0OC5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwOTUvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzc0OS5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExNDgvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzc1MC5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjk0MS8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzUxLmpwZ1wiLFwiZG9mXCI6XCI0LjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTE0Mi8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzUyLmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTE3Ni8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzUzLmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTA4OC8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzU0LmpwZ1wiLFwiZG9mXCI6XCI0LjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTA5OC8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzU1LmpwZ1wiLFwiZG9mXCI6XCI0LjBcIixcInNodXR0ZXJTcGVlZFwiOlwiOTkyLzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM3NTYuanBnXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMDgwLzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM3NTcuanBnXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI5MTgvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzc1OC5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwMDQvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzc1OS5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjk5NS8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzYwLmpwZ1wiLFwiZG9mXCI6XCI0LjBcIixcInNodXR0ZXJTcGVlZFwiOlwiOTYwLzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM3NjEuanBnXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI5ODUvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzc2Mi5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExNTgvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzc2My5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExNTQvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzc2NC5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExMjcvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzc2NS5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExNDcvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzc2Ni5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExNDkvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzc2Ny5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjkwMi8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzY4LmpwZ1wiLFwiZG9mXCI6XCIyLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTIwMC8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzY5LmpwZ1wiLFwiZG9mXCI6XCI0LjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTExOC8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzcwLmpwZ1wiLFwiZG9mXCI6XCIzLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTEyMi8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzcxLmpwZ1wiLFwiZG9mXCI6XCIzLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTA2Mi8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzczLmpwZ1wiLFwiZG9mXCI6XCIyLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTExNC8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzc1LmpwZ1wiLFwiZG9mXCI6XCIyLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTE3Ny8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzc2LmpwZ1wiLFwiZG9mXCI6XCI0LjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTA1MC8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzc3LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTA4Mi8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzc4LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTA0Ny8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzc5LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTEwMy8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzgwLmpwZ1wiLFwiZG9mXCI6XCI0LjBcIixcInNodXR0ZXJTcGVlZFwiOlwiOTMxLzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM3ODMuanBnXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMTI1LzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM3ODQuanBnXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMTE3LzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM3ODUuanBnXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMTExLzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM3ODYuanBnXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMDA5LzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM3ODguanBnXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMDUyLzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM3ODkuanBnXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMTE3LzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM3OTAuanBnXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMDc1LzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM3OTEuanBnXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI4ODIvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzc5Mi5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjk2OS8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzkzLmpwZ1wiLFwiZG9mXCI6XCI0LjBcIixcInNodXR0ZXJTcGVlZFwiOlwiOTg2LzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM3OTQuanBnXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI5NjMvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzc5NS5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwNjMvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzc5Ni5qcGdcIixcImRvZlwiOlwiNi4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwMDIvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzc5Ny5qcGdcIixcImRvZlwiOlwiNi4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwMDIvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzc5OS5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExNTYvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzgwMC5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExMzQvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzgwMS5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwMDYvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzgwMy5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwMzYvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzgwNS5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExODEvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzgwNi5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExOTIvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzgwNy5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwMDQvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzgwOC5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExNTkvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzgwOS5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjkzNS8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzODEwLmpwZ1wiLFwiZG9mXCI6XCI0LjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTAwOS8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzODExLmpwZ1wiLFwiZG9mXCI6XCI0LjBcIixcInNodXR0ZXJTcGVlZFwiOlwiOTM3LzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM4MTIuanBnXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI5MTIvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzgxMy5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwNjQvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzgxNC5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExMjcvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzgxNS5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExMDkvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzgxNi5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwNjgvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzgxNy5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwNjkvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzgxOC5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjk4MS8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzODIwLmpwZ1wiLFwiZG9mXCI6XCI0LjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTA2MC8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzODIxLmpwZ1wiLFwiZG9mXCI6XCI0LjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTA5OS8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzODIyLmpwZ1wiLFwiZG9mXCI6XCI0LjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTA2NS8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzODIzLmpwZ1wiLFwiZG9mXCI6XCIzLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTE3MS8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzODI2LmpwZ1wiLFwiZG9mXCI6XCIzLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTA4OS8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzODI3LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiOTE5LzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM4MjkuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMTQxLzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM4MzAuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI5MjYvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzgzMS5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExODIvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzgzMy5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjkyOS8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzODM0LmpwZ1wiLFwiZG9mXCI6XCI0LjBcIixcInNodXR0ZXJTcGVlZFwiOlwiOTkwLzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM4MzYuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI2MDAvMTAwXCIsXCJpc29cIjo2NDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzg0MC5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjQ4MS8xMDBcIixcImlzb1wiOjgwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzODQxLmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNTA4LzEwMFwiLFwiaXNvXCI6ODAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM4NDIuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI2MDAvMTAwXCIsXCJpc29cIjo4MDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzg0OS5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjQ0Mi8xMDBcIixcImlzb1wiOjgwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzODY0LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNTA4LzEwMFwiLFwiaXNvXCI6ODAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM4NjcuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI0ODYvMTAwXCIsXCJpc29cIjo4MDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzg2OC5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjUyMy8xMDBcIixcImlzb1wiOjgwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzODY5LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNTI4LzEwMFwiLFwiaXNvXCI6ODAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM4NzAuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI1MzIvMTAwXCIsXCJpc29cIjo4MDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzg3MS5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjQ2Ny8xMDBcIixcImlzb1wiOjgwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzODcyLmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNTAxLzEwMFwiLFwiaXNvXCI6ODAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM4NzMuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI0NTgvMTAwXCIsXCJpc29cIjo4MDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzg3NC5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjQ4MC8xMDBcIixcImlzb1wiOjgwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzODc1LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNDU1LzEwMFwiLFwiaXNvXCI6ODAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM4NzYuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI1MTQvMTAwXCIsXCJpc29cIjo4MDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzg3Ny5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjQ5Ni8xMDBcIixcImlzb1wiOjgwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzODc4LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNTczLzEwMFwiLFwiaXNvXCI6ODAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM4NzkuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI1NTEvMTAwXCIsXCJpc29cIjo4MDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzg4MC5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjM3Mi8xMDBcIixcImlzb1wiOjgwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzODgxLmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNTMzLzEwMFwiLFwiaXNvXCI6ODAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM4ODIuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI1NTEvMTAwXCIsXCJpc29cIjo4MDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzg4My5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjUxNS8xMDBcIixcImlzb1wiOjgwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzODg1LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNTAxLzEwMFwiLFwiaXNvXCI6ODAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM4ODYuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI1NzEvMTAwXCIsXCJpc29cIjo4MDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzg4Ny5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjUwNC8xMDBcIixcImlzb1wiOjgwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzODg4LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNTEwLzEwMFwiLFwiaXNvXCI6ODAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM4ODkuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI2MDAvMTAwXCIsXCJpc29cIjoyNTAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzg5NC5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjU3MC8xMDBcIixcImlzb1wiOjgwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzODk1LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNTY2LzEwMFwiLFwiaXNvXCI6ODAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM4OTYuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI1NDQvMTAwXCIsXCJpc29cIjo4MDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzg5OC5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjUyMy8xMDBcIixcImlzb1wiOjgwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzODk5LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNTk5LzEwMFwiLFwiaXNvXCI6ODAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM5MDAuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI1MzUvMTAwXCIsXCJpc29cIjo4MDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzkwMy5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjU0MS8xMDBcIixcImlzb1wiOjgwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzOTExLmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMzU5LzEwMFwiLFwiaXNvXCI6ODAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM5MTIuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI0MDAvMTAwXCIsXCJpc29cIjo4MDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzkxMy5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjU3OC8xMDBcIixcImlzb1wiOjgwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzOTE0LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNTU0LzEwMFwiLFwiaXNvXCI6ODAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM5MTUuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI0ODYvMTAwXCIsXCJpc29cIjo4MDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzkxNy5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjU1NS8xMDBcIixcImlzb1wiOjgwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzOTE5LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNjAwLzEwMFwiLFwiaXNvXCI6NjQwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM5MjAuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI2MDAvMTAwXCIsXCJpc29cIjo4MDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzkyMS5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjU4OS8xMDBcIixcImlzb1wiOjgwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzOTIzLmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNjAwLzEwMFwiLFwiaXNvXCI6ODAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM5MjQuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI1MDIvMTAwXCIsXCJpc29cIjo4MDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzkyNi5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjUyNC8xMDBcIixcImlzb1wiOjgwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzOTI3LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNDQyLzEwMFwiLFwiaXNvXCI6ODAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM5MjguanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI0ODQvMTAwXCIsXCJpc29cIjo4MDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzkyOS5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjQwMi8xMDBcIixcImlzb1wiOjgwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzOTMzLmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNTYyLzEwMFwiLFwiaXNvXCI6ODAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM5MzQuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI1NzgvMTAwXCIsXCJpc29cIjo4MDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzkzNS5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjYwMC8xMDBcIixcImlzb1wiOjY0MCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzOTM2LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNTUzLzEwMFwiLFwiaXNvXCI6ODAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM5MzcuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI1NjgvMTAwXCIsXCJpc29cIjo4MDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk0MC5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjU4Ny8xMDBcIixcImlzb1wiOjgwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzOTQxLmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNTk1LzEwMFwiLFwiaXNvXCI6ODAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM5NDIuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI1NjgvMTAwXCIsXCJpc29cIjo4MDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk0My5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjU5NS8xMDBcIixcImlzb1wiOjgwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzOTQ0LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNTkwLzEwMFwiLFwiaXNvXCI6ODAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM5NDUuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI2MDAvMTAwXCIsXCJpc29cIjo4MDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk0Ni5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjYwMC8xMDBcIixcImlzb1wiOjY0MCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzOTQ3LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNTg1LzEwMFwiLFwiaXNvXCI6ODAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM5NDguanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI2MDAvMTAwXCIsXCJpc29cIjo4MDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk0OS5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjU4NC8xMDBcIixcImlzb1wiOjgwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzOTUwLmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNTkwLzEwMFwiLFwiaXNvXCI6ODAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM5NTEuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI2MDAvMTAwXCIsXCJpc29cIjo4MDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk1Mi5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjYwMC8xMDBcIixcImlzb1wiOjgwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzOTUzLmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNjAwLzEwMFwiLFwiaXNvXCI6NjQwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM5NTQuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI1NzEvMTAwXCIsXCJpc29cIjo4MDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk1Ny5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjYwMC8xMDBcIixcImlzb1wiOjUwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzOTU4LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNjAwLzEwMFwiLFwiaXNvXCI6NjQwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM5NTkuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI1NDUvMTAwXCIsXCJpc29cIjo4MDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk2MC5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjU3NC8xMDBcIixcImlzb1wiOjgwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzOTYxLmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNTg1LzEwMFwiLFwiaXNvXCI6ODAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM5NjIuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI1ODcvMTAwXCIsXCJpc29cIjo4MDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk2My5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjU2OC8xMDBcIixcImlzb1wiOjgwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzOTY0LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNTgyLzEwMFwiLFwiaXNvXCI6ODAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM5NjUuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI2MDAvMTAwXCIsXCJpc29cIjo2NDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk2Ni5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjYwMC8xMDBcIixcImlzb1wiOjgwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzOTY3LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNTk3LzEwMFwiLFwiaXNvXCI6ODAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM5NjguanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI2MDAvMTAwXCIsXCJpc29cIjo2NDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk2OS5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjU4OC8xMDBcIixcImlzb1wiOjgwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzOTcwLmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNjAwLzEwMFwiLFwiaXNvXCI6ODAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM5NzIuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI1OTgvMTAwXCIsXCJpc29cIjo4MDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk3My5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjQ2NC8xMDBcIixcImlzb1wiOjgwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzOTc1LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNDY2LzEwMFwiLFwiaXNvXCI6ODAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM5NzYuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI0NDUvMTAwXCIsXCJpc29cIjo4MDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfV1cbiIsImV4cG9ydCBkZWZhdWx0IFt7XCJuYW1lXCI6XCJEU0NGMzYyNi5qcGdcIixcImRvZlwiOlwiMy4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwMjQvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzYyNy5qcGdcIixcImRvZlwiOlwiMy4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExODgvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzYyOC5qcGdcIixcImRvZlwiOlwiMy4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExMTIvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzYyOS5qcGdcIixcImRvZlwiOlwiMy4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjY5NC8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNjMwLmpwZ1wiLFwiZG9mXCI6XCIzLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNzY1LzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM2MzEuanBnXCIsXCJkb2ZcIjpcIjMuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI4MTUvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzYzMy5qcGdcIixcImRvZlwiOlwiMy4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjg2Ni8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNjM0LmpwZ1wiLFwiZG9mXCI6XCIzLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTA1MC8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNjM1LmpwZ1wiLFwiZG9mXCI6XCIzLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTAwMy8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNjM4LmpwZ1wiLFwiZG9mXCI6XCIzLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNzI0LzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM2NDEuanBnXCIsXCJkb2ZcIjpcIjMuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI5NzkvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzY0Mi5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExMjIvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzY0My5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjk0NS8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzIyLmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNjU1LzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM3MjMuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI3NTIvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzcyNC5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjk4Ny8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzI1LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiOTg2LzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM3MjYuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI5OTkvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzcyNy5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwMDQvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzcyOC5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjYwMC8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzI5LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNjAwLzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM3MzAuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI4OTEvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzczMS5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjk4Ny8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzMyLmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTA4OC8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzMzLmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiOTQyLzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM3MzQuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI5MjYvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfV1cbiIsImV4cG9ydCBkZWZhdWx0IFt7XCJuYW1lXCI6XCJEU0NGMzY0OC5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwMTgvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzY0OS5qcGdcIixcImRvZlwiOlwiNi4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjY2OS8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNjUxLmpwZ1wiLFwiZG9mXCI6XCI2LjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNjAwLzEwMFwiLFwiaXNvXCI6MjUwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM2NTIuanBnXCIsXCJkb2ZcIjpcIjYuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI3MDMvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzY1My5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExMzEvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzY1NS5qcGdcIixcImRvZlwiOlwiMy4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwODgvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzY1Ny5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjk5NC8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNjYxLmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTE2Ny8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNjYzLmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTA5NC8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNjY1LmpwZ1wiLFwiZG9mXCI6XCI0LjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNzg1LzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM2NjYuanBnXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI4MjMvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzY2OC5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwMTcvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzY2OS5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwMDQvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzY3MC5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjc5NS8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNjcyLmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTIwMC8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNjczLmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTE2MS8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNjc0LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTA4NS8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNjc1LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiODQ2LzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM2NzYuanBnXCIsXCJkb2ZcIjpcIjMuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI5OTEvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzY3Ny5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwOTgvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzY3OC5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExMDYvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzY3OS5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwOTkvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzY4MC5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjk3NC8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNjgxLmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTEwMi8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNjgyLmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTE2Ni8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNjgzLmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTIwMC8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNjg0LmpwZ1wiLFwiZG9mXCI6XCIzLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTA2OC8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNjg1LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiOTk2LzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM2ODYuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMDcxLzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM2ODguanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMTkyLzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM2ODkuanBnXCIsXCJkb2ZcIjpcIjMuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMDQ4LzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM2OTEuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMTE0LzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM2OTIuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI5MDgvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzY5My5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjc1My8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNjk0LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiOTE0LzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM2OTUuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI5MzEvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzY5Ni5qcGdcIixcImRvZlwiOlwiMy4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwNDEvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzY5OC5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExNzUvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzY5OS5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwMTUvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzcwMC5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjg4Mi8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzAyLmpwZ1wiLFwiZG9mXCI6XCI0LjBcIixcInNodXR0ZXJTcGVlZFwiOlwiOTQ0LzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM3MDMuanBnXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI5OTEvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzcwNC5qcGdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjg2My8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzA1LmpwZ1wiLFwiZG9mXCI6XCI0LjBcIixcInNodXR0ZXJTcGVlZFwiOlwiNzk3LzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM3MDYuanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI5NDAvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzcwNy5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExOTIvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzcxMC5qcGdcIixcImRvZlwiOlwiMy4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjg2MS8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzExLmpwZ1wiLFwiZG9mXCI6XCIzLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTE0Mi8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzEyLmpwZ1wiLFwiZG9mXCI6XCIzLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTAzNy8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzEzLmpwZ1wiLFwiZG9mXCI6XCIzLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTE1MC8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzE0LmpwZ1wiLFwiZG9mXCI6XCIzLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTEzNi8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzE1LmpwZ1wiLFwiZG9mXCI6XCIzLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTA3My8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzE2LmpwZ1wiLFwiZG9mXCI6XCIzLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTE2MS8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0YzNzE3LmpwZ1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiOTg1LzEwMFwiLFwiaXNvXCI6MjAwLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjM3MTguanBnXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI4MzYvMTAwXCIsXCJpc29cIjoyMDAsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzcyMC5qcGdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjgyNC8xMDBcIixcImlzb1wiOjIwMCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9XVxuIiwiZXhwb3J0IGRlZmF1bHQgW3snbmFtZSc6ICdEU0NGMzUwNC5qcGcnLCAnZG9mJzogJzIuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTE4NS8xMDAnLCAnaXNvJzogMjAwLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4Mn0sIHsnbmFtZSc6ICdEU0NGMzUwNS5qcGcnLCAnZG9mJzogJzIuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTA1My8xMDAnLCAnaXNvJzogMjAwLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4Mn0sIHsnbmFtZSc6ICdEU0NGMzUwNi5qcGcnLCAnZG9mJzogJzIuMCcsICdzaHV0dGVyU3BlZWQnOiAnOTIxLzEwMCcsICdpc28nOiAyMDAsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyfSwgeyduYW1lJzogJ0RTQ0YzNTA3LmpwZycsICdkb2YnOiAnMS4wJywgJ3NodXR0ZXJTcGVlZCc6ICc5MDMvMTAwJywgJ2lzbyc6IDIwMCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODJ9LCB7J25hbWUnOiAnRFNDRjM1MDguanBnJywgJ2RvZic6ICcxLjAnLCAnc2h1dHRlclNwZWVkJzogJzYwMC8xMDAnLCAnaXNvJzogMjAwLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4Mn0sIHsnbmFtZSc6ICdEU0NGMzUwOS5qcGcnLCAnZG9mJzogJzEuMCcsICdzaHV0dGVyU3BlZWQnOiAnOTcxLzEwMCcsICdpc28nOiAyMDAsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyfSwgeyduYW1lJzogJ0RTQ0YzNTEwLmpwZycsICdkb2YnOiAnMS4wJywgJ3NodXR0ZXJTcGVlZCc6ICc2MDAvMTAwJywgJ2lzbyc6IDQwMCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODJ9LCB7J25hbWUnOiAnRFNDRjM1MTEuanBnJywgJ2RvZic6ICcxLjAnLCAnc2h1dHRlclNwZWVkJzogJzYwMC8xMDAnLCAnaXNvJzogMzIwLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4Mn0sIHsnbmFtZSc6ICdEU0NGMzUxMy5qcGcnLCAnZG9mJzogJzEuMCcsICdzaHV0dGVyU3BlZWQnOiAnNzkxLzEwMCcsICdpc28nOiAyMDAsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyfSwgeyduYW1lJzogJ0RTQ0YzNTE0LmpwZycsICdkb2YnOiAnMS4wJywgJ3NodXR0ZXJTcGVlZCc6ICc2MDAvMTAwJywgJ2lzbyc6IDUwMCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODJ9LCB7J25hbWUnOiAnRFNDRjM1MTUuanBnJywgJ2RvZic6ICcxLjAnLCAnc2h1dHRlclNwZWVkJzogJzU2NS8xMDAnLCAnaXNvJzogODAwLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4Mn0sIHsnbmFtZSc6ICdEU0NGMzUyMi5qcGcnLCAnZG9mJzogJzEuMCcsICdzaHV0dGVyU3BlZWQnOiAnNzEyLzEwMCcsICdpc28nOiAyMDAsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyfSwgeyduYW1lJzogJ0RTQ0YzNTIzLmpwZycsICdkb2YnOiAnMS4wJywgJ3NodXR0ZXJTcGVlZCc6ICc2MjkvMTAwJywgJ2lzbyc6IDIwMCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODJ9LCB7J25hbWUnOiAnRFNDRjM1MjQuanBnJywgJ2RvZic6ICcxLjAnLCAnc2h1dHRlclNwZWVkJzogJzYwMC8xMDAnLCAnaXNvJzogMjUwLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4Mn0sIHsnbmFtZSc6ICdEU0NGMzUyNi5qcGcnLCAnZG9mJzogJzEuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTIwMC8xMDAnLCAnaXNvJzogMjAwLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4Mn0sIHsnbmFtZSc6ICdEU0NGMzUyNy5qcGcnLCAnZG9mJzogJzYuMCcsICdzaHV0dGVyU3BlZWQnOiAnODM1LzEwMCcsICdpc28nOiAyMDAsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyfSwgeyduYW1lJzogJ0RTQ0YzNTI4LmpwZycsICdkb2YnOiAnNi4wJywgJ3NodXR0ZXJTcGVlZCc6ICc5MTkvMTAwJywgJ2lzbyc6IDIwMCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODJ9LCB7J25hbWUnOiAnRFNDRjM1MjkuanBnJywgJ2RvZic6ICc2LjAnLCAnc2h1dHRlclNwZWVkJzogJzkxMy8xMDAnLCAnaXNvJzogMjAwLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4Mn0sIHsnbmFtZSc6ICdEU0NGMzU0MC5qcGcnLCAnZG9mJzogJzEuNCcsICdzaHV0dGVyU3BlZWQnOiAnNjg5LzEwMCcsICdpc28nOiAyMDAsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyfSwgeyduYW1lJzogJ0RTQ0YzNTQyLmpwZycsICdkb2YnOiAnNi4wJywgJ3NodXR0ZXJTcGVlZCc6ICc4MDgvMTAwJywgJ2lzbyc6IDIwMCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODJ9LCB7J25hbWUnOiAnRFNDRjM1NDMuanBnJywgJ2RvZic6ICc1LjAnLCAnc2h1dHRlclNwZWVkJzogJzk5My8xMDAnLCAnaXNvJzogMjAwLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4Mn0sIHsnbmFtZSc6ICdEU0NGMzU0NC5qcGcnLCAnZG9mJzogJzUuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTAwNS8xMDAnLCAnaXNvJzogMjAwLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4Mn0sIHsnbmFtZSc6ICdEU0NGMzU1Mi5qcGcnLCAnZG9mJzogJzEuMCcsICdzaHV0dGVyU3BlZWQnOiAnNTY5LzEwMCcsICdpc28nOiA4MDAsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyfSwgeyduYW1lJzogJ0RTQ0YzNTUzLmpwZycsICdkb2YnOiAnMS4wJywgJ3NodXR0ZXJTcGVlZCc6ICc1NzIvMTAwJywgJ2lzbyc6IDgwMCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODJ9LCB7J25hbWUnOiAnRFNDRjM1NTYuanBnJywgJ2RvZic6ICcxLjAnLCAnc2h1dHRlclNwZWVkJzogJzYwMC8xMDAnLCAnaXNvJzogNDAwLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4Mn0sIHsnbmFtZSc6ICdEU0NGMzU1Ny5qcGcnLCAnZG9mJzogJzEuMCcsICdzaHV0dGVyU3BlZWQnOiAnNTEwLzEwMCcsICdpc28nOiA4MDAsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyfSwgeyduYW1lJzogJ0RTQ0YzNTU5LmpwZycsICdkb2YnOiAnMS4wJywgJ3NodXR0ZXJTcGVlZCc6ICc2MDAvMTAwJywgJ2lzbyc6IDMyMCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODJ9LCB7J25hbWUnOiAnRFNDRjM1NjAuanBnJywgJ2RvZic6ICcxLjAnLCAnc2h1dHRlclNwZWVkJzogJzU5Mi8xMDAnLCAnaXNvJzogODAwLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4Mn0sIHsnbmFtZSc6ICdEU0NGMzU2MS5qcGcnLCAnZG9mJzogJzEuMCcsICdzaHV0dGVyU3BlZWQnOiAnNjAwLzEwMCcsICdpc28nOiA0MDAsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyfSwgeyduYW1lJzogJ0RTQ0YzNTYyLmpwZycsICdkb2YnOiAnMS4wJywgJ3NodXR0ZXJTcGVlZCc6ICc2MDAvMTAwJywgJ2lzbyc6IDI1MCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODJ9LCB7J25hbWUnOiAnRFNDRjM1NjMuanBnJywgJ2RvZic6ICcxLjAnLCAnc2h1dHRlclNwZWVkJzogJzYwMC8xMDAnLCAnaXNvJzogMjAwLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4Mn0sIHsnbmFtZSc6ICdEU0NGMzU3Ni5qcGcnLCAnZG9mJzogJzQuMycsICdzaHV0dGVyU3BlZWQnOiAnNDc1LzEwMCcsICdpc28nOiA4MDAsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyfSwgeyduYW1lJzogJ0RTQ0YzNTgzLmpwZycsICdkb2YnOiAnMi42JywgJ3NodXR0ZXJTcGVlZCc6ICc2MDAvMTAwJywgJ2lzbyc6IDgwMCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODJ9LCB7J25hbWUnOiAnRFNDRjM1ODQuanBnJywgJ2RvZic6ICcyLjYnLCAnc2h1dHRlclNwZWVkJzogJzU3Ni8xMDAnLCAnaXNvJzogODAwLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4Mn0sIHsnbmFtZSc6ICdEU0NGMzU4OC5qcGcnLCAnZG9mJzogJzIuMCcsICdzaHV0dGVyU3BlZWQnOiAnOTkwLzEwMCcsICdpc28nOiAyMDAsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyfSwgeyduYW1lJzogJ0RTQ0YzNjA0LmpwZycsICdkb2YnOiAnNS4wJywgJ3NodXR0ZXJTcGVlZCc6ICc5NjkvMTAwJywgJ2lzbyc6IDIwMCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODJ9LCB7J25hbWUnOiAnRFNDRjM2MDkuanBnJywgJ2RvZic6ICcxLjAnLCAnc2h1dHRlclNwZWVkJzogJzg3MC8xMDAnLCAnaXNvJzogMjAwLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4Mn0sIHsnbmFtZSc6ICdEU0NGMzYxMS5qcGcnLCAnZG9mJzogJzEuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTIwMC8xMDAnLCAnaXNvJzogMjAwLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4Mn0sIHsnbmFtZSc6ICdEU0NGMzYxMi5qcGcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTAxMy8xMDAnLCAnaXNvJzogMjAwLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4Mn0sIHsnbmFtZSc6ICdEU0NGMzYxMy5qcGcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTAzMi8xMDAnLCAnaXNvJzogMjAwLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4Mn1dXG4iLCJleHBvcnQgZGVmYXVsdCBbeyAnbmFtZSc6ICdEU0NGNDEyNy5KUEcnLCAnZG9mJzogJzQuMCcsICdzaHV0dGVyU3BlZWQnOiAnNjgxLzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MTI4LkpQRycsICdkb2YnOiAnNC4wJywgJ3NodXR0ZXJTcGVlZCc6ICc3OTkvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQxMjkuSlBHJywgJ2RvZic6ICczLjAnLCAnc2h1dHRlclNwZWVkJzogJzk1Ny8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDEzMC5KUEcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTE0MC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDEzMS5KUEcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTA4Mi8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDEzMi5KUEcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTEyOC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDEzMy5KUEcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTE3Mi8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDEzNC5KUEcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTE4My8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDEzNS5KUEcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTE1MS8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDEzNi5KUEcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTE3NS8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDEzNy5KUEcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTE0NC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDEzOC5KUEcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnOTU0LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MTM5LkpQRycsICdkb2YnOiAnMy4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMTMwLzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MTQzLkpQRycsICdkb2YnOiAnMy4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMDczLzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MTQ0LkpQRycsICdkb2YnOiAnMy4wJywgJ3NodXR0ZXJTcGVlZCc6ICc5NTAvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQxNDUuSlBHJywgJ2RvZic6ICczLjAnLCAnc2h1dHRlclNwZWVkJzogJzExOTIvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQxNDYuSlBHJywgJ2RvZic6ICczLjAnLCAnc2h1dHRlclNwZWVkJzogJzExODYvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQxNDcuSlBHJywgJ2RvZic6ICc0LjAnLCAnc2h1dHRlclNwZWVkJzogJzEwNjEvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQxNDguSlBHJywgJ2RvZic6ICc0LjAnLCAnc2h1dHRlclNwZWVkJzogJzExMTMvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQxNTAuSlBHJywgJ2RvZic6ICc0LjAnLCAnc2h1dHRlclNwZWVkJzogJzEwOTQvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQxNTEuSlBHJywgJ2RvZic6ICc0LjAnLCAnc2h1dHRlclNwZWVkJzogJzExMTAvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQxNTIuSlBHJywgJ2RvZic6ICc0LjAnLCAnc2h1dHRlclNwZWVkJzogJzEwNTAvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQxNTQuSlBHJywgJ2RvZic6ICc0LjAnLCAnc2h1dHRlclNwZWVkJzogJzEwOTUvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQxNTUuSlBHJywgJ2RvZic6ICc0LjAnLCAnc2h1dHRlclNwZWVkJzogJzEwNDMvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQxNTYuSlBHJywgJ2RvZic6ICc0LjAnLCAnc2h1dHRlclNwZWVkJzogJzExMjcvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQxNTcuSlBHJywgJ2RvZic6ICc0LjAnLCAnc2h1dHRlclNwZWVkJzogJzkwMS8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDE1OC5KUEcnLCAnZG9mJzogJzQuMCcsICdzaHV0dGVyU3BlZWQnOiAnOTg4LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MTU5LkpQRycsICdkb2YnOiAnNC4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMDk4LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MTYwLkpQRycsICdkb2YnOiAnNC4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMDE3LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MTYyLkpQRycsICdkb2YnOiAnNC4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMDUwLzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MTYzLkpQRycsICdkb2YnOiAnNC4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMDUzLzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MTY1LkpQRycsICdkb2YnOiAnMi4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMDk4LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MTY3LkpQRycsICdkb2YnOiAnMi4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMTk5LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MTY4LkpQRycsICdkb2YnOiAnMi4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMjAwLzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MTY5LkpQRycsICdkb2YnOiAnMi4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMTQ3LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MTcwLkpQRycsICdkb2YnOiAnNC4zJywgJ3NodXR0ZXJTcGVlZCc6ICcxMDE0LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MTcxLkpQRycsICdkb2YnOiAnNC4zJywgJ3NodXR0ZXJTcGVlZCc6ICc5NTMvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQxNzIuSlBHJywgJ2RvZic6ICc0LjMnLCAnc2h1dHRlclNwZWVkJzogJzEwMzQvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQxNzMuSlBHJywgJ2RvZic6ICc0LjMnLCAnc2h1dHRlclNwZWVkJzogJzEwMjIvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQxNzQuSlBHJywgJ2RvZic6ICc0LjMnLCAnc2h1dHRlclNwZWVkJzogJzExMjYvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQxNzUuSlBHJywgJ2RvZic6ICc0LjMnLCAnc2h1dHRlclNwZWVkJzogJzEwNTEvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQxNzYuSlBHJywgJ2RvZic6ICc0LjMnLCAnc2h1dHRlclNwZWVkJzogJzk1NC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDE3Ny5KUEcnLCAnZG9mJzogJzQuMycsICdzaHV0dGVyU3BlZWQnOiAnMTEwNy8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDE3OC5KUEcnLCAnZG9mJzogJzQuMycsICdzaHV0dGVyU3BlZWQnOiAnMTAxMi8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDE3OS5KUEcnLCAnZG9mJzogJzQuMycsICdzaHV0dGVyU3BlZWQnOiAnMTAwNC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDE4MC5KUEcnLCAnZG9mJzogJzQuMycsICdzaHV0dGVyU3BlZWQnOiAnMTEwOS8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDE4MS5KUEcnLCAnZG9mJzogJzQuMycsICdzaHV0dGVyU3BlZWQnOiAnOTk2LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MTgyLkpQRycsICdkb2YnOiAnNC4wJywgJ3NodXR0ZXJTcGVlZCc6ICc4OTkvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQxODMuSlBHJywgJ2RvZic6ICc0LjAnLCAnc2h1dHRlclNwZWVkJzogJzEwNzMvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQxODQuSlBHJywgJ2RvZic6ICc0LjAnLCAnc2h1dHRlclNwZWVkJzogJzExMDEvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQxODUuSlBHJywgJ2RvZic6ICc0LjAnLCAnc2h1dHRlclNwZWVkJzogJzEwNjQvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQxODguSlBHJywgJ2RvZic6ICc0LjAnLCAnc2h1dHRlclNwZWVkJzogJzk5Mi8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDE4OS5KUEcnLCAnZG9mJzogJzQuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTAwMy8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDE5MC5KUEcnLCAnZG9mJzogJzQuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTAzMy8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDE5Mi5KUEcnLCAnZG9mJzogJzQuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTAxOS8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDE5NC5KUEcnLCAnZG9mJzogJzQuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTAyNC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDE5Ni5KUEcnLCAnZG9mJzogJzQuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTA0Mi8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDE5Ny5KUEcnLCAnZG9mJzogJzQuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTEyMS8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDE5OC5KUEcnLCAnZG9mJzogJzQuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTEzOS8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDE5OS5KUEcnLCAnZG9mJzogJzEuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTE2Ny8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDIwMC5KUEcnLCAnZG9mJzogJzEuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTA5OS8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDIwMS5KUEcnLCAnZG9mJzogJzEuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTE3OS8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDIwMi5KUEcnLCAnZG9mJzogJzQuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTA3Ni8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDIwMy5KUEcnLCAnZG9mJzogJzQuMCcsICdzaHV0dGVyU3BlZWQnOiAnOTI4LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MjA0LkpQRycsICdkb2YnOiAnNC4wJywgJ3NodXR0ZXJTcGVlZCc6ICc5OTQvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQyMDUuSlBHJywgJ2RvZic6ICc0LjAnLCAnc2h1dHRlclNwZWVkJzogJzEwMDUvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQyMDYuSlBHJywgJ2RvZic6ICc0LjAnLCAnc2h1dHRlclNwZWVkJzogJzk4NS8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDIwNy5KUEcnLCAnZG9mJzogJzQuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTEwOS8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDIwOC5KUEcnLCAnZG9mJzogJzEuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTEwMi8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDIwOS5KUEcnLCAnZG9mJzogJzQuMCcsICdzaHV0dGVyU3BlZWQnOiAnOTkxLzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MjEwLkpQRycsICdkb2YnOiAnMy4wJywgJ3NodXR0ZXJTcGVlZCc6ICc5OTEvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQyMTEuSlBHJywgJ2RvZic6ICczLjAnLCAnc2h1dHRlclNwZWVkJzogJzEwMDgvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQyMTIuSlBHJywgJ2RvZic6ICczLjAnLCAnc2h1dHRlclNwZWVkJzogJzk3NS8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDIxNC5KUEcnLCAnZG9mJzogJzMuNCcsICdzaHV0dGVyU3BlZWQnOiAnMTA2Ni8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDIxNS5KUEcnLCAnZG9mJzogJzMuNCcsICdzaHV0dGVyU3BlZWQnOiAnOTU5LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MjE2LkpQRycsICdkb2YnOiAnMy4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMDE5LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MjE3LkpQRycsICdkb2YnOiAnMy4wJywgJ3NodXR0ZXJTcGVlZCc6ICc5MTEvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQyMTguSlBHJywgJ2RvZic6ICc1LjAnLCAnc2h1dHRlclNwZWVkJzogJzEwNDEvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQyMTkuSlBHJywgJ2RvZic6ICc1LjAnLCAnc2h1dHRlclNwZWVkJzogJzEwMDIvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQyMjEuSlBHJywgJ2RvZic6ICc1LjAnLCAnc2h1dHRlclNwZWVkJzogJzEwMjAvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQyMjIuSlBHJywgJ2RvZic6ICc1LjAnLCAnc2h1dHRlclNwZWVkJzogJzk3My8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDIyMy5KUEcnLCAnZG9mJzogJzUuMCcsICdzaHV0dGVyU3BlZWQnOiAnOTQxLzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MjI1LkpQRycsICdkb2YnOiAnNS4wJywgJ3NodXR0ZXJTcGVlZCc6ICc5ODEvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQyMjYuSlBHJywgJ2RvZic6ICc1LjAnLCAnc2h1dHRlclNwZWVkJzogJzEwMzEvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQyMzAuSlBHJywgJ2RvZic6ICc1LjAnLCAnc2h1dHRlclNwZWVkJzogJzEwMjgvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQyMzEuSlBHJywgJ2RvZic6ICc1LjAnLCAnc2h1dHRlclNwZWVkJzogJzk2NS8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDIzMi5KUEcnLCAnZG9mJzogJzUuMCcsICdzaHV0dGVyU3BlZWQnOiAnODI4LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MjMzLkpQRycsICdkb2YnOiAnNS4wJywgJ3NodXR0ZXJTcGVlZCc6ICc5NDAvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQyMzQuSlBHJywgJ2RvZic6ICc1LjAnLCAnc2h1dHRlclNwZWVkJzogJzkyOS8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDIzNS5KUEcnLCAnZG9mJzogJzUuMCcsICdzaHV0dGVyU3BlZWQnOiAnOTY4LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MjM2LkpQRycsICdkb2YnOiAnNS4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMDM1LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MjM3LkpQRycsICdkb2YnOiAnNS4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMTYwLzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MjM4LkpQRycsICdkb2YnOiAnNS4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMDY5LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MjM5LkpQRycsICdkb2YnOiAnNS4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMDE5LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MjQwLkpQRycsICdkb2YnOiAnNS4wJywgJ3NodXR0ZXJTcGVlZCc6ICc5MzMvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQyNDEuSlBHJywgJ2RvZic6ICc1LjAnLCAnc2h1dHRlclNwZWVkJzogJzk4Ny8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI0Mi5KUEcnLCAnZG9mJzogJzUuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTAzMy8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI0NC5KUEcnLCAnZG9mJzogJzUuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTIwMC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI0NS5KUEcnLCAnZG9mJzogJzUuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTA5OC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI0Ni5KUEcnLCAnZG9mJzogJzUuMCcsICdzaHV0dGVyU3BlZWQnOiAnOTU2LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MjQ3LkpQRycsICdkb2YnOiAnNS4wJywgJ3NodXR0ZXJTcGVlZCc6ICc5NjcvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQyNDguSlBHJywgJ2RvZic6ICc1LjAnLCAnc2h1dHRlclNwZWVkJzogJzk3NC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI0OS5KUEcnLCAnZG9mJzogJzUuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTA5Ni8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI1MC5KUEcnLCAnZG9mJzogJzUuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTAyMS8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI1MS5KUEcnLCAnZG9mJzogJzUuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTIwMC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI1Mi5KUEcnLCAnZG9mJzogJzUuMCcsICdzaHV0dGVyU3BlZWQnOiAnOTc0LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MjUzLkpQRycsICdkb2YnOiAnNS4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMTU5LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MjU0LkpQRycsICdkb2YnOiAnNS4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMDc3LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MjYyLkpQRycsICdkb2YnOiAnNC4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMTUyLzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MjY3LkpQRycsICdkb2YnOiAnNi4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMDI1LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MjY4LkpQRycsICdkb2YnOiAnNi4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMDg1LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MjcxLkpQRycsICdkb2YnOiAnNi4wJywgJ3NodXR0ZXJTcGVlZCc6ICc4MTIvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQyNzIuSlBHJywgJ2RvZic6ICc2LjAnLCAnc2h1dHRlclNwZWVkJzogJzc5NC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI3My5KUEcnLCAnZG9mJzogJzYuMCcsICdzaHV0dGVyU3BlZWQnOiAnNzk4LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0Mjc0LkpQRycsICdkb2YnOiAnNi4wJywgJ3NodXR0ZXJTcGVlZCc6ICc4NjkvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQyNzUuSlBHJywgJ2RvZic6ICc2LjAnLCAnc2h1dHRlclNwZWVkJzogJzYwMC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI3Ni5KUEcnLCAnZG9mJzogJzIuNicsICdzaHV0dGVyU3BlZWQnOiAnMTExOC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI3Ny5KUEcnLCAnZG9mJzogJzIuNicsICdzaHV0dGVyU3BlZWQnOiAnMTIwMC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI3OC5KUEcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTE2OS8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI3OS5KUEcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTE4NC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI4MC5KUEcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTIwMC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI4MS5KUEcnLCAnZG9mJzogJzQuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTEwNy8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI4Mi5KUEcnLCAnZG9mJzogJzQuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTA4MC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI4My5KUEcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTAyOC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI4NC5KUEcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTEwMC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI4NS5KUEcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTA5NC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI4Ni5KUEcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTE0NS8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI4Ny5KUEcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTE5MC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI4OC5KUEcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTE1My8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI4OS5KUEcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTEzOS8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI5MC5KUEcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTA1NS8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI5MS5KUEcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTEwMC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI5Mi5KUEcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTEwMC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI5My5KUEcnLCAnZG9mJzogJzQuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTEyMC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI5NC5KUEcnLCAnZG9mJzogJzQuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTEyOC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI5NS5KUEcnLCAnZG9mJzogJzQuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTAyMy8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI5Ni5KUEcnLCAnZG9mJzogJzQuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTA4Mi8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDI5Ny5KUEcnLCAnZG9mJzogJzQuMCcsICdzaHV0dGVyU3BlZWQnOiAnOTcwLzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0Mjk4LkpQRycsICdkb2YnOiAnNC4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMDE1LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MzA0LkpQRycsICdkb2YnOiAnNC4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMTIzLzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MzA1LkpQRycsICdkb2YnOiAnNC4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMDYxLzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MzA2LkpQRycsICdkb2YnOiAnNC4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMTA2LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MzA3LkpQRycsICdkb2YnOiAnNC4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMDc5LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MzA4LkpQRycsICdkb2YnOiAnNC4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMDc1LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MzA5LkpQRycsICdkb2YnOiAnNC4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMTM0LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MzEwLkpQRycsICdkb2YnOiAnNC4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMDk1LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MzExLkpQRycsICdkb2YnOiAnNC4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMTI2LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MzEzLkpQRycsICdkb2YnOiAnMi4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMjAwLzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MzE0LkpQRycsICdkb2YnOiAnMy4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMTk3LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MzE1LkpQRycsICdkb2YnOiAnMy4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMTg5LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MzE2LkpQRycsICdkb2YnOiAnMy4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMjAwLzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MzE3LkpQRycsICdkb2YnOiAnNC4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMTY1LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MzE4LkpQRycsICdkb2YnOiAnNC4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMTI1LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MzE5LkpQRycsICdkb2YnOiAnNC4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMTA0LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MzIwLkpQRycsICdkb2YnOiAnNC4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMTg4LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MzIxLkpQRycsICdkb2YnOiAnMS4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMTY1LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MzIyLkpQRycsICdkb2YnOiAnMS4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMTUzLzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MzIzLkpQRycsICdkb2YnOiAnMy4wJywgJ3NodXR0ZXJTcGVlZCc6ICcxMDI4LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MzI0LkpQRycsICdkb2YnOiAnMy4wJywgJ3NodXR0ZXJTcGVlZCc6ICc5OTMvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQzMjUuSlBHJywgJ2RvZic6ICczLjAnLCAnc2h1dHRlclNwZWVkJzogJzg1NS8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDMyNi5KUEcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTAzOS8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDMyNy5KUEcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTAzMC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDMyOC5KUEcnLCAnZG9mJzogJzMuMCcsICdzaHV0dGVyU3BlZWQnOiAnODgwLzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MzI5LkpQRycsICdkb2YnOiAnMy4wJywgJ3NodXR0ZXJTcGVlZCc6ICc4NTcvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQzMzAuSlBHJywgJ2RvZic6ICcxLjQnLCAnc2h1dHRlclNwZWVkJzogJzExNzUvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQzMzEuSlBHJywgJ2RvZic6ICcyLjMnLCAnc2h1dHRlclNwZWVkJzogJzExNzkvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQzMzIuSlBHJywgJ2RvZic6ICcyLjMnLCAnc2h1dHRlclNwZWVkJzogJzEwNTQvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQzMzMuSlBHJywgJ2RvZic6ICczLjAnLCAnc2h1dHRlclNwZWVkJzogJzExNTUvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQzMzQuSlBHJywgJ2RvZic6ICczLjAnLCAnc2h1dHRlclNwZWVkJzogJzEwMzAvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQzMzUuSlBHJywgJ2RvZic6ICczLjAnLCAnc2h1dHRlclNwZWVkJzogJzExNTgvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQzMzYuSlBHJywgJ2RvZic6ICczLjAnLCAnc2h1dHRlclNwZWVkJzogJzExMzAvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQzMzcuSlBHJywgJ2RvZic6ICczLjAnLCAnc2h1dHRlclNwZWVkJzogJzExMDUvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQzMzguSlBHJywgJ2RvZic6ICczLjAnLCAnc2h1dHRlclNwZWVkJzogJzExNDQvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQzMzkuSlBHJywgJ2RvZic6ICczLjAnLCAnc2h1dHRlclNwZWVkJzogJzEwOTAvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQzNDAuSlBHJywgJ2RvZic6ICczLjAnLCAnc2h1dHRlclNwZWVkJzogJzEwNjIvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQzNDEuSlBHJywgJ2RvZic6ICczLjAnLCAnc2h1dHRlclNwZWVkJzogJzExNjIvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQzNDIuSlBHJywgJ2RvZic6ICczLjAnLCAnc2h1dHRlclNwZWVkJzogJzEwODcvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQzNDMuSlBHJywgJ2RvZic6ICczLjAnLCAnc2h1dHRlclNwZWVkJzogJzEwODgvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQzNDQuSlBHJywgJ2RvZic6ICczLjAnLCAnc2h1dHRlclNwZWVkJzogJzEwODIvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQzNDUuSlBHJywgJ2RvZic6ICczLjAnLCAnc2h1dHRlclNwZWVkJzogJzExNDEvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQzNDYuSlBHJywgJ2RvZic6ICczLjAnLCAnc2h1dHRlclNwZWVkJzogJzEwNTgvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQzNDcuSlBHJywgJ2RvZic6ICczLjAnLCAnc2h1dHRlclNwZWVkJzogJzEwMzcvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQzNDguSlBHJywgJ2RvZic6ICczLjAnLCAnc2h1dHRlclNwZWVkJzogJzExMzkvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQzNDkuSlBHJywgJ2RvZic6ICczLjAnLCAnc2h1dHRlclNwZWVkJzogJzk2NC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDM1MC5KUEcnLCAnZG9mJzogJzEuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTIwMC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDM1MS5KUEcnLCAnZG9mJzogJzEuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTE5Mi8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDM1Mi5KUEcnLCAnZG9mJzogJzEuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTIwMC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDM1My5KUEcnLCAnZG9mJzogJzEuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTIwMC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDM1NS5KUEcnLCAnZG9mJzogJzEuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTIwMC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDM1Ni5KUEcnLCAnZG9mJzogJzQuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTA1MC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDM1Ny5KUEcnLCAnZG9mJzogJzQuMCcsICdzaHV0dGVyU3BlZWQnOiAnMTAyOC8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfSwgeyAnbmFtZSc6ICdEU0NGNDM1OC5KUEcnLCAnZG9mJzogJzQuMCcsICdzaHV0dGVyU3BlZWQnOiAnODI5LzEwMCcsICdpc28nOiBudWxsLCAnd2lkdGgnOiAxOTIwLCAnaGVpZ2h0JzogMTA4MiB9LCB7ICduYW1lJzogJ0RTQ0Y0MzU5LkpQRycsICdkb2YnOiAnNC4wJywgJ3NodXR0ZXJTcGVlZCc6ICc4MjcvMTAwJywgJ2lzbyc6IG51bGwsICd3aWR0aCc6IDE5MjAsICdoZWlnaHQnOiAxMDgyIH0sIHsgJ25hbWUnOiAnRFNDRjQzNjAuSlBHJywgJ2RvZic6ICc0LjAnLCAnc2h1dHRlclNwZWVkJzogJzg5Mi8xMDAnLCAnaXNvJzogbnVsbCwgJ3dpZHRoJzogMTkyMCwgJ2hlaWdodCc6IDEwODIgfV1cbiIsImV4cG9ydCBkZWZhdWx0IFt7XCJuYW1lXCI6XCJEU0NGMzk3OC5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjYwMC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk3OS5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjczMC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk4MC5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjczMS8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk4MS5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjc0NC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk4Mi5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjg3MC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk4My5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjg1Mi8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk4NC5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjkwMi8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk4NS5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjc3OC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk4Ni5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjc3NS8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk4Ny5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjc5MC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk4OC5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjc5My8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk4OS5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjgwNi8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk5MC5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjcxMS8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk5MS5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjgwNS8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk5Mi5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjcxNC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk5My5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjgwNy8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk5NC5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjgwMC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGMzk5NS5KUEdcIixcImRvZlwiOlwiNi4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjg3Mi8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDAwMS5KUEdcIixcImRvZlwiOlwiNC4zXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjg2OC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDAwMi5KUEdcIixcImRvZlwiOlwiNC4zXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjczOS8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDAwMy5KUEdcIixcImRvZlwiOlwiNC4zXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjc4Ny8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDAwNC5KUEdcIixcImRvZlwiOlwiNC4zXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjc1MC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDAwNS5KUEdcIixcImRvZlwiOlwiNC4zXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjgyNi8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDAwNi5KUEdcIixcImRvZlwiOlwiNC4zXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjY5Ny8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDAwNy5KUEdcIixcImRvZlwiOlwiMy4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjY5OS8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDAwOC5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjkzNi8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDAwOS5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjY5Mi8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDAxMC5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjY3Ny8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDAxMS5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjYwMC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDAxMi5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjcwNy8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDAxMy5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjczNy8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDAxNC5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjY5NC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDAxNS5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwMjcvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwMTYuSlBHXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMDEzLzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MDE3LkpQR1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTAzNS8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDAxOC5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwMzAvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwMTkuSlBHXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI5MjEvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwMjAuSlBHXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI5NzQvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwMjEuSlBHXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI5MjEvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwMjIuSlBHXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMDgxLzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MDIzLkpQR1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTExOS8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDAyNC5KUEdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwNzMvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwMjUuSlBHXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI5NTMvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwMjYuSlBHXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI4MDcvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwMjcuSlBHXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI5ODEvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwMjguSlBHXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI4MTMvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwMjkuSlBHXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMDEzLzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MDMwLkpQR1wiLFwiZG9mXCI6XCIzLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTE1Ni8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDAzMS5KUEdcIixcImRvZlwiOlwiMy4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjk1Ni8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDAzMi5KUEdcIixcImRvZlwiOlwiMy4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExMjIvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwMzMuSlBHXCIsXCJkb2ZcIjpcIjMuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMDk3LzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MDM0LkpQR1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTE3NC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDAzNS5KUEdcIixcImRvZlwiOlwiMi4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEyMDAvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwMzYuSlBHXCIsXCJkb2ZcIjpcIjIuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMTYzLzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MDM3LkpQR1wiLFwiZG9mXCI6XCIzLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTE1MC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDAzOC5KUEdcIixcImRvZlwiOlwiMy4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExNDUvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwMzkuSlBHXCIsXCJkb2ZcIjpcIjMuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMTI5LzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MDQwLkpQR1wiLFwiZG9mXCI6XCIzLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTAzNS8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDA0MS5KUEdcIixcImRvZlwiOlwiMy4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjkzMC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDA0Mi5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwMDEvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwNDMuSlBHXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMTE4LzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MDQ0LkpQR1wiLFwiZG9mXCI6XCI0LjBcIixcInNodXR0ZXJTcGVlZFwiOlwiOTg4LzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MDQ1LkpQR1wiLFwiZG9mXCI6XCIzLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTE2Ni8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDA0Ni5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjk5NS8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDA0Ny5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjk4OS8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDA0OC5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwMTQvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwNDkuSlBHXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMTk4LzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MDUwLkpQR1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTA5OC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDA1MS5KUEdcIixcImRvZlwiOlwiMy4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjk4OC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDA1Mi5KUEdcIixcImRvZlwiOlwiMy4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExNDUvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwNTMuSlBHXCIsXCJkb2ZcIjpcIjMuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMTgxLzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MDU0LkpQR1wiLFwiZG9mXCI6XCI0LjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTA5Ny8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDA1NS5KUEdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwOTkvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwNTYuSlBHXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI4OTkvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwNTcuSlBHXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI4MTcvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwNTguSlBHXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI4NTIvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwNTkuSlBHXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI4ODQvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwNjAuSlBHXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMDg5LzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MDYxLkpQR1wiLFwiZG9mXCI6XCI0LjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTEwMi8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDA2Mi5KUEdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExMTQvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwNjMuSlBHXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI4OTQvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwNjQuSlBHXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI4OTUvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwNjUuSlBHXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMDQzLzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MDY2LkpQR1wiLFwiZG9mXCI6XCI0LjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTA1Mi8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDA2Ny5KUEdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjc1OS8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDA2OC5KUEdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjk3Ni8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDA2OS5KUEdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjg4OC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDA3MC5KUEdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjk1Ny8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDA3MS5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjkwOC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDA3Mi5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjg2Mi8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDA3My5KUEdcIixcImRvZlwiOlwiMS4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjkxMC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDA3NC5KUEdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExNDQvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwNzUuSlBHXCIsXCJkb2ZcIjpcIjMuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMDkxLzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MDc2LkpQR1wiLFwiZG9mXCI6XCI0LjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTA5NC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDA3Ny5KUEdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExMDMvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwNzguSlBHXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMTE2LzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MDc5LkpQR1wiLFwiZG9mXCI6XCI0LjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTA5Mi8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDA4MC5KUEdcIixcImRvZlwiOlwiNC4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwNTIvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwODEuSlBHXCIsXCJkb2ZcIjpcIjQuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI3MjgvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwODIuSlBHXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMjAwLzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MDgzLkpQR1wiLFwiZG9mXCI6XCIzLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTEyMi8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDA4NC5KUEdcIixcImRvZlwiOlwiMy4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExNjkvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwODUuSlBHXCIsXCJkb2ZcIjpcIjMuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMDk4LzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MDg2LkpQR1wiLFwiZG9mXCI6XCIxLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTE5My8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDA4Ny5KUEdcIixcImRvZlwiOlwiMi4zXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExODAvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwODguSlBHXCIsXCJkb2ZcIjpcIjIuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMTMxLzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MDg5LkpQR1wiLFwiZG9mXCI6XCIyLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTE2NC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDA5MC5KUEdcIixcImRvZlwiOlwiMi4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExMzcvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwOTEuSlBHXCIsXCJkb2ZcIjpcIjIuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMTk4LzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MDkyLkpQR1wiLFwiZG9mXCI6XCIyLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTAwNC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDA5My5KUEdcIixcImRvZlwiOlwiMi4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExMjEvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwOTQuSlBHXCIsXCJkb2ZcIjpcIjIuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMTkyLzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MDk1LkpQR1wiLFwiZG9mXCI6XCIyLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTE4OC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDA5Ni5KUEdcIixcImRvZlwiOlwiMi4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExODMvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQwOTcuSlBHXCIsXCJkb2ZcIjpcIjIuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMTg2LzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MDk4LkpQR1wiLFwiZG9mXCI6XCIyLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTEwOS8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDA5OS5KUEdcIixcImRvZlwiOlwiMi4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwMDgvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQxMDAuSlBHXCIsXCJkb2ZcIjpcIjIuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMTI4LzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MTAxLkpQR1wiLFwiZG9mXCI6XCIyLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiODg2LzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MTAyLkpQR1wiLFwiZG9mXCI6XCIyLjZcIixcInNodXR0ZXJTcGVlZFwiOlwiMTA2My8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDEwMy5KUEdcIixcImRvZlwiOlwiMi42XCIsXCJzaHV0dGVyU3BlZWRcIjpcIjk5OC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDEwNC5KUEdcIixcImRvZlwiOlwiMi42XCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwMTkvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQxMDUuSlBHXCIsXCJkb2ZcIjpcIjIuNlwiLFwic2h1dHRlclNwZWVkXCI6XCI5NjUvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQxMDYuSlBHXCIsXCJkb2ZcIjpcIjIuNlwiLFwic2h1dHRlclNwZWVkXCI6XCI5NjcvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQxMDcuSlBHXCIsXCJkb2ZcIjpcIjEuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMDc0LzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MTA4LkpQR1wiLFwiZG9mXCI6XCIyLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTIwMC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDEwOS5KUEdcIixcImRvZlwiOlwiMi4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjk5MS8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDExMC5KUEdcIixcImRvZlwiOlwiMi4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjEwNjUvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQxMTEuSlBHXCIsXCJkb2ZcIjpcIjIuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI5NjkvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQxMTIuSlBHXCIsXCJkb2ZcIjpcIjIuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMTkxLzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MTEzLkpQR1wiLFwiZG9mXCI6XCIyLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTE2MC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDExNC5KUEdcIixcImRvZlwiOlwiMi4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExMTgvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQxMTUuSlBHXCIsXCJkb2ZcIjpcIjIuMFwiLFwic2h1dHRlclNwZWVkXCI6XCI5NjUvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQxMTYuSlBHXCIsXCJkb2ZcIjpcIjIuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMTY4LzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MTE3LkpQR1wiLFwiZG9mXCI6XCIyLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTE1NS8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDExOC5KUEdcIixcImRvZlwiOlwiMi4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExMDcvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQxMTkuSlBHXCIsXCJkb2ZcIjpcIjIuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMTE0LzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MTIwLkpQR1wiLFwiZG9mXCI6XCIyLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTE3MS8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDEyMS5KUEdcIixcImRvZlwiOlwiMi4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExNDgvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQxMjIuSlBHXCIsXCJkb2ZcIjpcIjIuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMTU3LzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MTIzLkpQR1wiLFwiZG9mXCI6XCIyLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTE2OC8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfSx7XCJuYW1lXCI6XCJEU0NGNDEyNC5KUEdcIixcImRvZlwiOlwiMi4wXCIsXCJzaHV0dGVyU3BlZWRcIjpcIjExNjEvMTAwXCIsXCJpc29cIjpudWxsLFwid2lkdGhcIjoxOTIwLFwiaGVpZ2h0XCI6MTA4Mn0se1wibmFtZVwiOlwiRFNDRjQxMjUuSlBHXCIsXCJkb2ZcIjpcIjIuMFwiLFwic2h1dHRlclNwZWVkXCI6XCIxMTM4LzEwMFwiLFwiaXNvXCI6bnVsbCxcIndpZHRoXCI6MTkyMCxcImhlaWdodFwiOjEwODJ9LHtcIm5hbWVcIjpcIkRTQ0Y0MTI2LkpQR1wiLFwiZG9mXCI6XCIyLjBcIixcInNodXR0ZXJTcGVlZFwiOlwiMTA4Ni8xMDBcIixcImlzb1wiOm51bGwsXCJ3aWR0aFwiOjE5MjAsXCJoZWlnaHRcIjoxMDgyfV1cbiIsImltcG9ydCBzaW5nYXBvcmVOZHAgZnJvbSAnLi9zaW5nYXBvcmUtbmF0aW9uYWwtZGF5LXBhcmFkZSdcbmltcG9ydCBzaW5nYXBvcmVSYW5kb20gZnJvbSAnLi9zaW5nYXBvcmUtcmFuZG9tJ1xuaW1wb3J0IHNpbmdhcG9yZUNsYXJrZVF1YXkgZnJvbSAnLi9zaW5nYXBvcmUtY2xhcmtlLXF1YXknXG5pbXBvcnQga2xMaWZlIGZyb20gJy4va2wtbGlmZSdcbmltcG9ydCBiYWxpIGZyb20gJy4vYmFsaSdcbmltcG9ydCBzaW5nYXBvcmVMaWZlIGZyb20gJy4vc2luZ2Fwb3JlLWxpZmUnXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgc3RhdGU6IHtcbiAgICBsaWdodGJveDoge1xuICAgICAgc2hvdzogZmFsc2UsXG4gICAgICBzcmM6ICcvYXNzZXRzL2ltZy9waG90b2dyYXBoeS8wMS1jaHJpc3RtYXNfbWFya2V0L0RTQ0YyMDQzLmpwZydcbiAgICB9LFxuICAgIHBob3Rvczoge1xuICAgICAgJ2NocmlzdG1hcy1tYXJrZXQnOiB7XG4gICAgICAgIGhlYWRpbmc6ICdDaHJpc3RtYXMgTWFya2V0JyxcbiAgICAgICAgc3ViaGVhZGluZzogJ2F0IE1hbm5oZWltLCBHZXJtYW55LicsXG4gICAgICAgIGZvbGRlclBhdGg6ICcvYXNzZXRzL2ltZy9waG90b2dyYXBoeS8wMS1jaHJpc3RtYXNfbWFya2V0L0RTQ0YyJyxcbiAgICAgICAgaW1hZ2VzOiBbXG4gICAgICAgICAgeyBuYW1lOiAnMDQzLmpwZycsIGRvZjogJ2YvMS40Jywgc2h1dHRlclNwZWVkOiAnMS8yMjAgc2VjJywgaXNvOiAnMjAwJyB9LFxuICAgICAgICAgIHsgbmFtZTogJzA0Ni5qcGcnLCBkb2Y6ICdmLzEuNCcsIHNodXR0ZXJTcGVlZDogJzEvNDgwIHNlYycsIGlzbzogJzIwMCcgfSxcbiAgICAgICAgICB7IG5hbWU6ICcwNTAuanBnJywgZG9mOiAnZi8xLjQnLCBzaHV0dGVyU3BlZWQ6ICcxLzE2MCBzZWMnLCBpc286ICcyMDAnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnMDUyLmpwZycsIGRvZjogJ2YvMS40Jywgc2h1dHRlclNwZWVkOiAnMS80NTAgc2VjJywgaXNvOiAnMjAwJyB9LFxuICAgICAgICAgIHsgbmFtZTogJzA1NC5qcGcnLCBkb2Y6ICdmLzEuNCcsIHNodXR0ZXJTcGVlZDogJzEvNTIgc2VjJywgaXNvOiAnMzIwJyB9LFxuXG4gICAgICAgICAgeyBuYW1lOiAnMDU1LmpwZycsIGRvZjogJ2YvMS40Jywgc2h1dHRlclNwZWVkOiAnMS81NiBzZWMnLCBpc286ICcyMDAnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnMDU3LmpwZycsIGRvZjogJ2YvMS40Jywgc2h1dHRlclNwZWVkOiAnMS83MCBzZWMnLCBpc286ICcyMDAnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnMDU4LmpwZycsIGRvZjogJ2YvMS40Jywgc2h1dHRlclNwZWVkOiAnMS81MiBzZWMnLCBpc286ICcyMDAnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnMDU5LmpwZycsIGRvZjogJ2YvMS40Jywgc2h1dHRlclNwZWVkOiAnMS83MCBzZWMnLCBpc286ICcyMDAnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnMDc4LmpwZycsIGRvZjogJ2YvMS40Jywgc2h1dHRlclNwZWVkOiAnMS81MiBzZWMnLCBpc286ICcyNTAwJyB9LFxuXG4gICAgICAgICAgeyBuYW1lOiAnMDg4LmpwZycsIGRvZjogJ2YvMS40Jywgc2h1dHRlclNwZWVkOiAnMS81MiBzZWMnLCBpc286ICcyNTAwJyB9LFxuICAgICAgICAgIHsgbmFtZTogJzA5NS5qcGcnLCBkb2Y6ICdmLzEuNCcsIHNodXR0ZXJTcGVlZDogJzEvNTIgc2VjJywgaXNvOiAnMzIwMCcgfSxcbiAgICAgICAgICB7IG5hbWU6ICcxMDQuanBnJywgZG9mOiAnZi8xLjQnLCBzaHV0dGVyU3BlZWQ6ICcxLzUyIHNlYycsIGlzbzogJzIwMDAnIH1cbiAgICAgICAgXSxcbiAgICAgICAgY2FtZXJhTW9kZWw6ICdGdWppZmlsbSBYRS0xJyxcbiAgICAgICAgbGVuc01vZGVsOiAnMzUgbW0gZi8xLjQnXG4gICAgICB9LFxuICAgICAgJ21hbGF5c2lhJzoge1xuICAgICAgICBoZWFkaW5nOiAnTWFsYXlzaWEnLFxuICAgICAgICBzdWJoZWFkaW5nOiAnYXQgcmFuZG9tIGxvY2F0aW9ucy4nLFxuICAgICAgICBmb2xkZXJQYXRoOiAnL2Fzc2V0cy9pbWcvcGhvdG9ncmFwaHkvMDItbWFsYXlzaWEvRFNDRjInLFxuICAgICAgICBpbWFnZXM6IFtcbiAgICAgICAgICB7IG5hbWU6ICczMzYuanBnJywgZG9mOiAnZi8zLjInLCBzaHV0dGVyU3BlZWQ6ICcxLzMwMDAgc2VjJywgaXNvOiAnMjAwJyB9LFxuICAgICAgICAgIHsgbmFtZTogJzM0Mi5qcGcnLCBkb2Y6ICdmLzIuOCcsIHNodXR0ZXJTcGVlZDogJzEvNDAwMCBzZWMnLCBpc286ICcyMDAnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnMzQ2LmpwZycsIGRvZjogJ2YvMi44Jywgc2h1dHRlclNwZWVkOiAnMS8zMDAgc2VjJywgaXNvOiAnODAwJyB9LFxuICAgICAgICAgIHsgbmFtZTogJzM0OC5qcGcnLCBkb2Y6ICdmLzIuOCcsIHNodXR0ZXJTcGVlZDogJzEvOTAgc2VjJywgaXNvOiAnNDAwJyB9LFxuICAgICAgICAgIHsgbmFtZTogJzM1MS5qcGcnLCBkb2Y6ICdmLzIuOCcsIHNodXR0ZXJTcGVlZDogJzEvMTYwIHNlYycsIGlzbzogJzEwMCcgfSxcblxuICAgICAgICAgIHsgbmFtZTogJzM1My5qcGcnLCBkb2Y6ICdmLzIuOCcsIHNodXR0ZXJTcGVlZDogJzEvNTYgc2VjJywgaXNvOiAnMTAwJyB9LFxuICAgICAgICAgIHsgbmFtZTogJzM2My5qcGcnLCBkb2Y6ICdmLzIuOCcsIHNodXR0ZXJTcGVlZDogJzEvMTkwMCBzZWMnLCBpc286ICc4MDAnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnMzY2LmpwZycsIGRvZjogJ2YvMS40Jywgc2h1dHRlclNwZWVkOiAnMS8zNTAwIHNlYycsIGlzbzogJzIwMCcgfSxcbiAgICAgICAgICB7IG5hbWU6ICczNjguanBnJywgZG9mOiAnZi8xLjQnLCBzaHV0dGVyU3BlZWQ6ICcxLzE4MCBzZWMnLCBpc286ICc4MDAnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnMzcwLmpwZycsIGRvZjogJ2YvMS40Jywgc2h1dHRlclNwZWVkOiAnMS8yMjAwIHNlYycsIGlzbzogJzgwMCcgfSxcblxuICAgICAgICAgIHsgbmFtZTogJzM3My5qcGcnLCBkb2Y6ICdmLzEuNCcsIHNodXR0ZXJTcGVlZDogJzEvMjQwMCBzZWMnLCBpc286ICc0MDAnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnMzc5LmpwZycsIGRvZjogJ2YvMS40Jywgc2h1dHRlclNwZWVkOiAnMS8xNDAwIHNlYycsIGlzbzogJzIwMCcgfSxcbiAgICAgICAgICB7IG5hbWU6ICczODEuanBnJywgZG9mOiAnZi8xLjQnLCBzaHV0dGVyU3BlZWQ6ICcxLzkwIHNlYycsIGlzbzogJzgwMCcgfSxcbiAgICAgICAgICB7IG5hbWU6ICc0MTUuanBnJywgZG9mOiAnZi8xMycsIHNodXR0ZXJTcGVlZDogJzEvMjQwMCBzZWMnLCBpc286ICc4MDAnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnNDIzLmpwZycsIGRvZjogJ2YvMS40Jywgc2h1dHRlclNwZWVkOiAnMS81NTAgc2VjJywgaXNvOiAnODAwJyB9LFxuXG4gICAgICAgICAgeyBuYW1lOiAnNDI0LmpwZycsIGRvZjogJ2YvMS40Jywgc2h1dHRlclNwZWVkOiAnMS8xMTAwIHNlYycsIGlzbzogJzIwMCcgfSxcbiAgICAgICAgICB7IG5hbWU6ICc0MjUuanBnJywgZG9mOiAnZi8xLjQnLCBzaHV0dGVyU3BlZWQ6ICcxLzEwMDAgc2VjJywgaXNvOiAnMjAwJyB9LFxuICAgICAgICAgIHsgbmFtZTogJzQyNi5qcGcnLCBkb2Y6ICdmLzEuNCcsIHNodXR0ZXJTcGVlZDogJzEvOTAwIHNlYycsIGlzbzogJzIwMCcgfVxuICAgICAgICBdLFxuICAgICAgICBjYW1lcmFNb2RlbDogJ0Z1amlmaWxtIFhFLTEnLFxuICAgICAgICBsZW5zTW9kZWw6ICczNSBtbSBmLzEuNCdcbiAgICAgIH0sXG4gICAgICAnZGFuYm9hcmQnOiB7XG4gICAgICAgIGhlYWRpbmc6ICdEYW5ib2FyZCBzaG90cycsXG4gICAgICAgIHN1YmhlYWRpbmc6ICdtYWNybyBzaG90cywgZG9uZSB1bnByb2Zlc3Npb25hbGx5LicsXG4gICAgICAgIGZvbGRlclBhdGg6ICcvYXNzZXRzL2ltZy9waG90b2dyYXBoeS8wNi1kYW5ib2FyZC9JTUdfJyxcbiAgICAgICAgaW1hZ2VzOiBbXG4gICAgICAgICAgeyBuYW1lOiAnNDczNS5qcGcnLCBkb2Y6ICdmLzIuOCcsIHNodXR0ZXJTcGVlZDogJzEvNTAgc2VjJywgaXNvOiAnMTYwMCcgfSxcbiAgICAgICAgICB7IG5hbWU6ICcyNjMwLmpwZycsIGRvZjogJ2YvMi44Jywgc2h1dHRlclNwZWVkOiAnMS8yMCBzZWMnLCBpc286ICc4MDAnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnMjY0MS5qcGcnLCBkb2Y6ICdmLzIuOCcsIHNodXR0ZXJTcGVlZDogJzEvMjAgc2VjJywgaXNvOiAnODAwJyB9LFxuICAgICAgICAgIHsgbmFtZTogJzMxNjYuanBnJywgZG9mOiAnZi81Jywgc2h1dHRlclNwZWVkOiAnMS82MCBzZWMnLCBpc286ICcyMDAnIH0sXG5cbiAgICAgICAgICB7IG5hbWU6ICczMTcxLmpwZycsIGRvZjogJ2YvMy41Jywgc2h1dHRlclNwZWVkOiAnMS8xMjUgc2VjJywgaXNvOiAnMjAwJyB9LFxuICAgICAgICAgIHsgbmFtZTogJzMxNzQuanBnJywgZG9mOiAnZi81Jywgc2h1dHRlclNwZWVkOiAnMS8xMjUgc2VjJywgaXNvOiAnMjAwJyB9LFxuICAgICAgICAgIHsgbmFtZTogJzMxNzUuanBnJywgZG9mOiAnZi81Jywgc2h1dHRlclNwZWVkOiAnMS84MCBzZWMnLCBpc286ICcyMDAnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnMzYxOS5qcGcnLCBkb2Y6ICdmLzMuNScsIHNodXR0ZXJTcGVlZDogJzEvNjAgc2VjJywgaXNvOiAnMTAwJyB9XG5cbiAgICAgICAgXSxcbiAgICAgICAgY2FtZXJhTW9kZWw6ICdDYW5vbiBFT1MgNjAwRCcsXG4gICAgICAgIGxlbnNNb2RlbDogJzEwMG1tIGYvMi44IE1hY3JvJ1xuICAgICAgfSxcbiAgICAgICdwcmVpc2VyLWZpZ3VyZSc6IHtcbiAgICAgICAgaGVhZGluZzogJ1ByZWlzZXIgRmlndXJlcycsXG4gICAgICAgIHN1YmhlYWRpbmc6ICdzbWFsbCB0b3lzLCBtYWduaWZpZWQuJyxcbiAgICAgICAgZm9sZGVyUGF0aDogJy9hc3NldHMvaW1nL3Bob3RvZ3JhcGh5LzA3LXByZWlzZXJfZmlndXJlLycsXG4gICAgICAgIGltYWdlczogW1xuICAgICAgICAgIHsgbmFtZTogJzAxLmpwZycsIGRvZjogJ2YvMi44Jywgc2h1dHRlclNwZWVkOiAnMS81IHNlYycsIGlzbzogJzEwMCcgfSxcbiAgICAgICAgICB7IG5hbWU6ICcwMi5qcGcnLCBkb2Y6ICdmLzgnLCBzaHV0dGVyU3BlZWQ6ICcyIHNlYycsIGlzbzogJzEwMCcgfSxcbiAgICAgICAgICB7IG5hbWU6ICcwMy5qcGcnLCBkb2Y6ICdmLzUuNicsIHNodXR0ZXJTcGVlZDogJzQgc2VjJywgaXNvOiAnMTAwJyB9LFxuICAgICAgICAgIHsgbmFtZTogJzA0LmpwZycsIGRvZjogJ2YvNS42Jywgc2h1dHRlclNwZWVkOiAnMi41IHNlYycsIGlzbzogJzEwMCcgfSxcbiAgICAgICAgICB7IG5hbWU6ICcwNS5qcGcnLCBkb2Y6ICdmLzIuOCcsIHNodXR0ZXJTcGVlZDogJzQgc2VjJywgaXNvOiAnMTAwJyB9LFxuXG4gICAgICAgICAgeyBuYW1lOiAnMDYuanBnJywgZG9mOiAnZi8yLjgnLCBzaHV0dGVyU3BlZWQ6ICcxLzMwIHNlYycsIGlzbzogJzQwMCcgfSxcbiAgICAgICAgICB7IG5hbWU6ICcwNy5qcGcnLCBkb2Y6ICdmLzQnLCBzaHV0dGVyU3BlZWQ6ICcxLzMwIHNlYycsIGlzbzogJzEwMCcgfSxcbiAgICAgICAgICB7IG5hbWU6ICcwOC5qcGcnLCBkb2Y6ICdmLzIuOCcsIHNodXR0ZXJTcGVlZDogJzEvNCBzZWMnLCBpc286ICcxMDAnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnMDkuanBnJywgZG9mOiAnZi8xMScsIHNodXR0ZXJTcGVlZDogJzIgc2VjJywgaXNvOiAnNDAwJyB9LFxuICAgICAgICAgIHsgbmFtZTogJzEwLmpwZycsIGRvZjogJ2YvMi44Jywgc2h1dHRlclNwZWVkOiAnMS81IHNlYycsIGlzbzogJzEwMCcgfVxuXG4gICAgICAgIF0sXG5cbiAgICAgICAgY2FtZXJhTW9kZWw6ICdDYW5vbiBFT1MgNjAwRCcsXG4gICAgICAgIGxlbnNNb2RlbDogJzEwMG1tIGYvMi44IE1hY3JvJy8vICdDYW5vbiBFRiAxMDBtbSBmLzIuOCBVU00gTWFjcm8gTGVucydcbiAgICAgIH0sXG4gICAgICAnYmVybGluJzoge1xuICAgICAgICBoZWFkaW5nOiAnQmVybGluIFRyaXAnLFxuICAgICAgICBzdWJoZWFkaW5nOiAnYXQgQmVybGluLCBHZXJtYW55LicsXG4gICAgICAgIGZvbGRlclBhdGg6ICcvYXNzZXRzL2ltZy9waG90b2dyYXBoeS8wNS1iZXJsaW5fdHJpcC8nLFxuICAgICAgICBpbWFnZXM6IFtcbiAgICAgICAgICB7IG5hbWU6ICdEU0NGMjYwNy5qcGcnLCBpc286IDIwMCwgc2h1dHRlclNwZWVkOiAnMS8xNjYzJywgJ2RvZic6IDEuNCB9LFxuICAgICAgICAgIHsgbmFtZTogJ0RTQ0YyNjA4LmpwZycsIGlzbzogMjAwLCBzaHV0dGVyU3BlZWQ6ICcxLzczOScsICdkb2YnOiAxLjQgfSxcbiAgICAgICAgICB7IG5hbWU6ICdEU0NGMjYwOS5qcGcnLCBpc286IDIwMCwgc2h1dHRlclNwZWVkOiAnMS8xMDM4JywgJ2RvZic6IDEuNCB9LFxuICAgICAgICAgIHsgbmFtZTogJ0RTQ0YyNjExLmpwZycsIGlzbzogMjAwLCBzaHV0dGVyU3BlZWQ6ICcxLzYwMCcsICdkb2YnOiAxLjQgfSxcbiAgICAgICAgICB7IG5hbWU6ICdEU0NGMjYxNi5qcGcnLCBpc286IDIwMCwgc2h1dHRlclNwZWVkOiAnMS83MjknLCAnZG9mJzogMS40IH0sXG4gICAgICAgICAgeyBuYW1lOiAnRFNDRjI2MTkuanBnJywgaXNvOiAzMjAsIHNodXR0ZXJTcGVlZDogJzEvNjQnLCAnZG9mJzogOC4wIH0sXG4gICAgICAgICAgeyBuYW1lOiAnRFNDRjI2MjYuanBnJywgaXNvOiA4MDAsIHNodXR0ZXJTcGVlZDogJzEvMzgnLCAnZG9mJzogMS40IH0sXG4gICAgICAgICAgeyBuYW1lOiAnRFNDRjI2MzQuanBnJywgaXNvOiA4MDAsIHNodXR0ZXJTcGVlZDogJzEvNjQnLCAnZG9mJzogMS40IH0sXG4gICAgICAgICAgeyBuYW1lOiAnRFNDRjI2MzcuanBnJywgaXNvOiA4MDAsIHNodXR0ZXJTcGVlZDogJzEvMjMnLCAnZG9mJzogMS40IH0sXG4gICAgICAgICAgeyBuYW1lOiAnRFNDRjI2NTAuanBnJywgaXNvOiA4MDAsIHNodXR0ZXJTcGVlZDogJzEvNTMnLCAnZG9mJzogMS40IH0sXG4gICAgICAgICAgeyBuYW1lOiAnRFNDRjI2NTYuanBnJywgaXNvOiAyMDAsIHNodXR0ZXJTcGVlZDogJzEvNjc2JywgJ2RvZic6IDguOSB9LFxuICAgICAgICAgIHsgbmFtZTogJ0RTQ0YyNjU4LmpwZycsIGlzbzogMjAwLCBzaHV0dGVyU3BlZWQ6ICcxLzU4OCcsICdkb2YnOiAxMC45IH0sXG4gICAgICAgICAgeyBuYW1lOiAnRFNDRjI2NTkuanBnJywgaXNvOiAyMDAsIHNodXR0ZXJTcGVlZDogJzEvMjA5MScsICdkb2YnOiA0LjAgfSxcbiAgICAgICAgICB7IG5hbWU6ICdEU0NGMjY2MC5qcGcnLCBpc286IDIwMCwgc2h1dHRlclNwZWVkOiAnMS8yMzUzJywgJ2RvZic6IDQuMCB9LFxuICAgICAgICAgIHsgbmFtZTogJ0RTQ0YyNjY2LmpwZycsIGlzbzogMjAwLCBzaHV0dGVyU3BlZWQ6ICcxLzE0MycsICdkb2YnOiAxMC45IH0sXG4gICAgICAgICAgeyBuYW1lOiAnRFNDRjI2NjcuanBnJywgaXNvOiAyMDAsIHNodXR0ZXJTcGVlZDogJzEvMTg1OScsICdkb2YnOiAzLjIgfSxcbiAgICAgICAgICB7IG5hbWU6ICdEU0NGMjY2OC5qcGcnLCBpc286IDIwMCwgc2h1dHRlclNwZWVkOiAnMS8xMTEnLCAnZG9mJzogMTAuOSB9LFxuICAgICAgICAgIHsgbmFtZTogJ0RTQ0YyNjcwLmpwZycsIGlzbzogMjAwLCBzaHV0dGVyU3BlZWQ6ICcxLzMxMjYnLCAnZG9mJzogMS40IH0sXG4gICAgICAgICAgeyBuYW1lOiAnRFNDRjI2NzEuanBnJywgaXNvOiAzMjAsIHNodXR0ZXJTcGVlZDogJzEvNjQnLCAnZG9mJzogMS40IH0sXG4gICAgICAgICAgeyBuYW1lOiAnRFNDRjI2NzMuanBnJywgaXNvOiAyMDAsIHNodXR0ZXJTcGVlZDogJzEvNDA5NicsICdkb2YnOiAxLjYgfSxcbiAgICAgICAgICB7IG5hbWU6ICdEU0NGMjY4NS5qcGcnLCBpc286IDIwMCwgc2h1dHRlclNwZWVkOiAnMS8xMjI2JywgJ2RvZic6IDQuMCB9LFxuICAgICAgICAgIHsgbmFtZTogJ0RTQ0YyNjkwLmpwZycsIGlzbzogMjAwLCBzaHV0dGVyU3BlZWQ6ICcxLzc5MicsICdkb2YnOiA0LjAgfSxcbiAgICAgICAgICB7IG5hbWU6ICdEU0NGMjY5NS5qcGcnLCBpc286IDIwMCwgc2h1dHRlclNwZWVkOiAnMS82NTMnLCAnZG9mJzogNC4wIH0sXG4gICAgICAgICAgeyBuYW1lOiAnRFNDRjI2OTYuanBnJywgaXNvOiAyMDAsIHNodXR0ZXJTcGVlZDogJzEvNzI0JywgJ2RvZic6IDQuMCB9LFxuICAgICAgICAgIHsgbmFtZTogJ0RTQ0YyNjk3LmpwZycsIGlzbzogMjAwLCBzaHV0dGVyU3BlZWQ6ICcxLzEyNTInLCAnZG9mJzogNC4wIH0sXG4gICAgICAgICAgeyBuYW1lOiAnRFNDRjI3MDAuanBnJywgaXNvOiAyMDAsIHNodXR0ZXJTcGVlZDogJzEvMTA1JywgJ2RvZic6IDQuMCB9LFxuICAgICAgICAgIHsgbmFtZTogJ0RTQ0YyNzAyLmpwZycsIGlzbzogMjAwLCBzaHV0dGVyU3BlZWQ6ICcxLzE0NTgnLCAnZG9mJzogMS40IH0sXG4gICAgICAgICAgeyBuYW1lOiAnRFNDRjI3MjkuanBnJywgaXNvOiA4MDAsIHNodXR0ZXJTcGVlZDogJzEvMjAnLCAnZG9mJzogMS40IH0sXG4gICAgICAgICAgeyBuYW1lOiAnRFNDRjI3MzAuanBnJywgaXNvOiA4MDAsIHNodXR0ZXJTcGVlZDogJzEvMjQnLCAnZG9mJzogMS40IH0sXG4gICAgICAgICAgeyBuYW1lOiAnRFNDRjI3MzMuanBnJywgaXNvOiAyMDAsIHNodXR0ZXJTcGVlZDogJzEvMjQxJywgJ2RvZic6IDEwLjkgfSxcbiAgICAgICAgICB7IG5hbWU6ICdEU0NGMjczOC5qcGcnLCBpc286IDIwMCwgc2h1dHRlclNwZWVkOiAnMS82NCcsICdkb2YnOiA4LjAgfSxcbiAgICAgICAgICB7IG5hbWU6ICdEU0NGMjc0MS5qcGcnLCBpc286IDIwMCwgc2h1dHRlclNwZWVkOiAnMS82OScsICdkb2YnOiA4LjAgfSxcbiAgICAgICAgICB7IG5hbWU6ICdEU0NGMjc0My5qcGcnLCBpc286IDIwMCwgc2h1dHRlclNwZWVkOiAnMS80MjgnLCAnZG9mJzogOC4wIH0sXG4gICAgICAgICAgeyBuYW1lOiAnRFNDRjI3NTUuanBnJywgaXNvOiAyMDAsIHNodXR0ZXJTcGVlZDogJzEvMTQzOCcsICdkb2YnOiAxLjQgfSxcbiAgICAgICAgICB7IG5hbWU6ICdEU0NGMjc1Ni5qcGcnLCBpc286IDIwMCwgc2h1dHRlclNwZWVkOiAnMS8xNTInLCAnZG9mJzogMS42IH0sXG4gICAgICAgICAgeyBuYW1lOiAnRFNDRjI3NjAuanBnJywgaXNvOiAyMDAsIHNodXR0ZXJTcGVlZDogJzEvMjI5JywgJ2RvZic6IDEuNCB9LFxuICAgICAgICAgIHsgbmFtZTogJ0RTQ0YyNzYzLmpwZycsIGlzbzogMjAwLCBzaHV0dGVyU3BlZWQ6ICcxLzE2MjknLCAnZG9mJzogMS42IH0sXG4gICAgICAgICAgeyBuYW1lOiAnRFNDRjI3NjcuanBnJywgaXNvOiA0MDAsIHNodXR0ZXJTcGVlZDogJzEvNjQnLCAnZG9mJzogMS40IH0sXG4gICAgICAgICAgeyBuYW1lOiAnRFNDRjI3NzEuanBnJywgaXNvOiAyMDAsIHNodXR0ZXJTcGVlZDogJzEvMjU2JywgJ2RvZic6IDEuNCB9LFxuICAgICAgICAgIHsgbmFtZTogJ0RTQ0YyNzc1LmpwZycsIGlzbzogMzIwLCBzaHV0dGVyU3BlZWQ6ICcxLzY0JywgJ2RvZic6IDEuNCB9LFxuICAgICAgICAgIHsgbmFtZTogJ0RTQ0YyNzc2LmpwZycsIGlzbzogMzIwLCBzaHV0dGVyU3BlZWQ6ICcxLzY0JywgJ2RvZic6IDEuNCB9LFxuICAgICAgICAgIHsgbmFtZTogJ0RTQ0YyNzc3LmpwZycsIGlzbzogNTAwLCBzaHV0dGVyU3BlZWQ6ICcxLzY0JywgJ2RvZic6IDEuNCB9LFxuICAgICAgICAgIHsgbmFtZTogJ0RTQ0YyNzc4LmpwZycsIGlzbzogNDAwLCBzaHV0dGVyU3BlZWQ6ICcxLzY0JywgJ2RvZic6IDEuNCB9XSxcbiAgICAgICAgY2FtZXJhTW9kZWw6ICdGdWppZmlsbSBYRS0xJyxcbiAgICAgICAgbGVuc01vZGVsOiAnMzUgbW0gZi8xLjQnXG4gICAgICB9LFxuICAgICAgJ3NpbmdhcG9yZS1uZHAtMjAxOCc6IHtcbiAgICAgICAgaGVhZGluZzogJ05hdGlvbmFsIERheSBQYXJhZGUgU2luZ2Fwb3JlJyxcbiAgICAgICAgc3ViaGVhZGluZzogJzkgQXVndXN0IDIwMTgsIEkgd2FzIHRoZXJlJyxcbiAgICAgICAgZm9sZGVyUGF0aDogJy9hc3NldHMvaW1nL3Bob3RvZ3JhcGh5LzA4LW5kcC1zaW5nYXBvcmUvJyxcbiAgICAgICAgaW1hZ2VzOiBzaW5nYXBvcmVOZHAsXG4gICAgICAgIGNhbWVyYU1vZGVsOiAnRnVqaWZpbG0gWEUtMScsXG4gICAgICAgIGxlbnNNb2RlbDogJzM1IG1tIGYvMS40J1xuICAgICAgfSxcbiAgICAgICdrbC1saWZlJzoge1xuICAgICAgICBoZWFkaW5nOiAnS0wgVGVjaCBMaWZlJyxcbiAgICAgICAgc3ViaGVhZGluZzogJ0dvb2dsZSBJL08sIE1hZ2ljIGFuZCBidWZmZXQuLi4uJyxcbiAgICAgICAgZm9sZGVyUGF0aDogJy9hc3NldHMvaW1nL3Bob3RvZ3JhcGh5LzExLWtsLWxpZmUvJyxcbiAgICAgICAgaW1hZ2VzOiBrbExpZmUsXG4gICAgICAgIGNhbWVyYU1vZGVsOiAnRnVqaWZpbG0gWEUtMScsXG4gICAgICAgIGxlbnNNb2RlbDogJzM1IG1tIGYvMS40J1xuICAgICAgfSxcbiAgICAgICdzaW5nYXBvcmUtcmFuZG9tJzoge1xuICAgICAgICBoZWFkaW5nOiAnQXJvdW5kIFNpbmdhcG9yZScsXG4gICAgICAgIHN1YmhlYWRpbmc6ICdDaGluYXRvd24sIERvd250b3duLCBldGMnLFxuICAgICAgICBmb2xkZXJQYXRoOiAnL2Fzc2V0cy9pbWcvcGhvdG9ncmFwaHkvMDktc2luZ2Fwb3JlLWNoaW5hdG93bi8nLFxuICAgICAgICBpbWFnZXM6IHNpbmdhcG9yZVJhbmRvbSxcbiAgICAgICAgY2FtZXJhTW9kZWw6ICdGdWppZmlsbSBYRS0xJyxcbiAgICAgICAgbGVuc01vZGVsOiAnMzUgbW0gZi8xLjQnXG4gICAgICB9LFxuICAgICAgJ3NpbmdhcG9yZS1jbGFya2UtcXVheSc6IHtcbiAgICAgICAgaGVhZGluZzogJ0NsYXJrZSBRdWF5IFNpbmdhcG9yZScsXG4gICAgICAgIHN1YmhlYWRpbmc6ICdldmVuaW5nIHdhbGsgaGVyZScsXG4gICAgICAgIGZvbGRlclBhdGg6ICcvYXNzZXRzL2ltZy9waG90b2dyYXBoeS8xMC1zaW5nYXBvcmUtY2xhcmtlLXF1YXkvJyxcbiAgICAgICAgaW1hZ2VzOiBzaW5nYXBvcmVDbGFya2VRdWF5LFxuICAgICAgICBjYW1lcmFNb2RlbDogJ0Z1amlmaWxtIFhFLTEnLFxuICAgICAgICBsZW5zTW9kZWw6ICczNSBtbSBmLzEuNCdcbiAgICAgIH0sXG4gICAgICAnc2luZ2Fwb3JlLWxpZmUnOiB7XG4gICAgICAgIGhlYWRpbmc6ICdTaW5nYXBvcmUgTGlmZScsXG4gICAgICAgIHN1YmhlYWRpbmc6ICdSYW5kb20gd2FsayBpbiB0aGUgY2l0eScsXG4gICAgICAgIGZvbGRlclBhdGg6ICcvYXNzZXRzL2ltZy9waG90b2dyYXBoeS8xMi1zaW5nYXBvcmUtbGlmZS8nLFxuICAgICAgICBpbWFnZXM6IHNpbmdhcG9yZUxpZmUsXG4gICAgICAgIGNhbWVyYU1vZGVsOiAnRnVqaWZpbG0gWEUtMScsXG4gICAgICAgIGxlbnNNb2RlbDogJzM1IG1tIGYvMS40J1xuICAgICAgfSxcbiAgICAgICdiYWxpJzoge1xuICAgICAgICBoZWFkaW5nOiAnQmFsaSwgSW5kb25lc2lhJyxcbiAgICAgICAgc3ViaGVhZGluZzogJ0EgZGF5IGluIHBhcmFkaXNlJyxcbiAgICAgICAgZm9sZGVyUGF0aDogJy9hc3NldHMvaW1nL3Bob3RvZ3JhcGh5LzEzLWJhbGkvJyxcbiAgICAgICAgaW1hZ2VzOiBiYWxpLFxuICAgICAgICBjYW1lcmFNb2RlbDogJ0Z1amlmaWxtIFhFLTEnLFxuICAgICAgICBsZW5zTW9kZWw6ICczNSBtbSBmLzEuNCdcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIGFjdGlvbnM6IHtcbiAgICBzaG93TGlnaHRib3g6IHZhbHVlID0+IHN0YXRlID0+ICh7XG4gICAgICAuLi5zdGF0ZSxcbiAgICAgIGxpZ2h0Ym94OiB7XG4gICAgICAgIHNob3c6IHRydWUsXG4gICAgICAgIHNyYzogdmFsdWVcbiAgICAgIH1cbiAgICB9KSxcbiAgICBoaWRlTGlnaHRib3g6IHZhbHVlID0+IHN0YXRlID0+ICh7XG4gICAgICBsaWdodGJveDoge1xuICAgICAgICBzaG93OiBmYWxzZSxcbiAgICAgICAgc3JjOiBudWxsXG4gICAgICB9XG4gICAgfSlcbiAgfVxufVxuIiwiZXhwb3J0IGRlZmF1bHQge1xuICBzdGF0ZToge1xuICAgIHNvbmdzOiBbXG4gICAgICAnaHR0cHM6Ly93LnNvdW5kY2xvdWQuY29tL3BsYXllci8/dXJsPWh0dHBzJTNBLy9hcGkuc291bmRjbG91ZC5jb20vdHJhY2tzLzE1NzUwMjg0NyZjb2xvcj0lMjNmZjU1MDAmYXV0b19wbGF5PWZhbHNlJmhpZGVfcmVsYXRlZD1mYWxzZSZzaG93X2NvbW1lbnRzPXRydWUmc2hvd191c2VyPXRydWUmc2hvd19yZXBvc3RzPWZhbHNlJnNob3dfdGVhc2VyPXRydWUnLFxuICAgICAgJ2h0dHBzOi8vdy5zb3VuZGNsb3VkLmNvbS9wbGF5ZXIvP3VybD1odHRwcyUzQS8vYXBpLnNvdW5kY2xvdWQuY29tL3RyYWNrcy8xNTM0NDk4ODImY29sb3I9JTIzZmY1NTAwJmF1dG9fcGxheT1mYWxzZSZoaWRlX3JlbGF0ZWQ9ZmFsc2Umc2hvd19jb21tZW50cz10cnVlJnNob3dfdXNlcj10cnVlJnNob3dfcmVwb3N0cz1mYWxzZSZzaG93X3RlYXNlcj10cnVlJyxcbiAgICAgICdodHRwczovL3cuc291bmRjbG91ZC5jb20vcGxheWVyLz91cmw9aHR0cHMlM0EvL2FwaS5zb3VuZGNsb3VkLmNvbS90cmFja3MvMTUwNjM0MDg2JmNvbG9yPSUyM2ZmNTUwMCZhdXRvX3BsYXk9ZmFsc2UmaGlkZV9yZWxhdGVkPWZhbHNlJnNob3dfY29tbWVudHM9dHJ1ZSZzaG93X3VzZXI9dHJ1ZSZzaG93X3JlcG9zdHM9ZmFsc2Umc2hvd190ZWFzZXI9dHJ1ZScsXG4gICAgICAnaHR0cHM6Ly93LnNvdW5kY2xvdWQuY29tL3BsYXllci8/dXJsPWh0dHBzJTNBLy9hcGkuc291bmRjbG91ZC5jb20vdHJhY2tzLzE1MDMyMzQ3NSZjb2xvcj0lMjNmZjU1MDAmYXV0b19wbGF5PWZhbHNlJmhpZGVfcmVsYXRlZD1mYWxzZSZzaG93X2NvbW1lbnRzPXRydWUmc2hvd191c2VyPXRydWUmc2hvd19yZXBvc3RzPWZhbHNlJnNob3dfdGVhc2VyPXRydWUnXG4gICAgXVxuICB9XG59XG4iLCJpbXBvcnQgeyBhcHAsIGggfSBmcm9tICdoeXBlcmFwcCdcblxuaW1wb3J0ICdub3JtYWxpemUuY3NzJ1xuaW1wb3J0ICcuL2luZGV4LmNzcydcblxuLy8gQXRvbXNcbmltcG9ydCBIZWFkZXIgZnJvbSAnLi9hdG9taWMvYXRvbXMvSGVhZGVyJ1xuaW1wb3J0IE5hdmJhciBmcm9tICcuL2F0b21pYy9hdG9tcy9OYXZiYXInXG5pbXBvcnQgRm9vdGVyIGZyb20gJy4vYXRvbWljL2F0b21zL0Zvb3RlcidcblxuLy8gUGFnZXNcbmltcG9ydCBCb29rUGFnZSBmcm9tICcuL2F0b21pYy9wYWdlcy9Cb29rJ1xuaW1wb3J0IEhvbWVQYWdlIGZyb20gJy4vYXRvbWljL3BhZ2VzL0hvbWUnXG5pbXBvcnQgQWJvdXRQYWdlIGZyb20gJy4vYXRvbWljL3BhZ2VzL0Fib3V0J1xuaW1wb3J0IFBob3RvZ3JhcGh5UGFnZSBmcm9tICcuL2F0b21pYy9wYWdlcy9QaG90b2dyYXBoeSdcbmltcG9ydCBHdWl0YXJQYWdlIGZyb20gJy4vYXRvbWljL3BhZ2VzL0d1aXRhcidcbmltcG9ydCBDb250YWN0UGFnZSBmcm9tICcuL2F0b21pYy9wYWdlcy9Db250YWN0J1xuaW1wb3J0IFByb2dyYW1taW5nUGFnZSBmcm9tICcuL2F0b21pYy9wYWdlcy9Qcm9ncmFtbWluZydcblxuLy8gTW9kdWxlc1xuaW1wb3J0IHR5cGV3cml0ZXJNb2R1bGUgZnJvbSAnLi9zdG9yZS90eXBld3JpdGVyJ1xuaW1wb3J0IGJvb2tNb2R1bGUgZnJvbSAnLi9zdG9yZS9ib29rJ1xuaW1wb3J0IHBob3RvZ3JhcGh5TW9kdWxlIGZyb20gJy4vc3RvcmUvcGhvdG8nXG5pbXBvcnQgZ3VpdGFyTW9kdWxlIGZyb20gJy4vc3RvcmUvZ3VpdGFyJ1xuXG5jb25zdCBzdGF0ZSA9IE9iamVjdC5hc3NpZ24oXG4gIHt9LFxuICB7XG4gICAgaGVhZGVyOiAnYWxleHRhbmhvbmdwaW4nLFxuICAgIHVzZXJuYW1lOiAnQWxleCBUYW4nLFxuICAgIGZvb3RlcjogYENvcHlyaWdodCDCqSAke25ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKX0gYWxleHRhbmhvbmdwaW5gLFxuICAgIHByb2ZpbGVJbWc6ICcvYXNzZXRzL2ltZy9wcm9maWxlLmpwZycsXG4gICAgLy8gUmVnaXN0ZXIgc3RhdGUgZm9yIEBoeXBlcmFwcC9yb3V0ZXJcbiAgICAvLyBsb2NhdGlvbjogbG9jYXRpb24uc3RhdGUsXG4gICAgbGlua3M6IFtcbiAgICAgIHtcbiAgICAgICAgdG86ICcvJyxcbiAgICAgICAgbGFiZWw6ICdIb21lJ1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdG86ICcvY29udGFjdHMnLFxuICAgICAgICBsYWJlbDogJ0NvbnRhY3QnXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB0bzogJy9waG90b3MnLFxuICAgICAgICBsYWJlbDogJ1Bob3RvJ1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdG86ICcvYm9va3MnLFxuICAgICAgICBsYWJlbDogJ0Jvb2snXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB0bzogJy9zb25ncycsXG4gICAgICAgIGxhYmVsOiAnR3VpdGFyJ1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdG86ICcvY29kZXMnLFxuICAgICAgICBsYWJlbDogJ0NvZGUnXG4gICAgICB9XG4gICAgXVxuICB9LFxuICB0eXBld3JpdGVyTW9kdWxlLnN0YXRlLFxuICBib29rTW9kdWxlLnN0YXRlLFxuICBwaG90b2dyYXBoeU1vZHVsZS5zdGF0ZSxcbiAgZ3VpdGFyTW9kdWxlLnN0YXRlXG4pXG5cbmNvbnN0IGFjdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICB7fSxcbiAge1xuICAgIC8vIFJlZ2lzdGVyIGFjdGlvbnMgZm9yIEBoeXBlcmFwcC9yb3V0ZXJcbiAgICBsb2NhdGlvbjogbG9jYXRpb24uYWN0aW9ucyxcbiAgICAuLi50eXBld3JpdGVyTW9kdWxlLmFjdGlvbnMsXG4gICAgLi4ucGhvdG9ncmFwaHlNb2R1bGUuYWN0aW9uc1xuICB9XG4pXG5cbmNvbnN0IHZpZXcgPSAoeyBoZWFkZXIsIHVzZXJuYW1lLCBwcm9maWxlSW1nLCBsaW5rcywgZm9vdGVyIH0pID0+IChcbiAgPG1haW4gY2xhc3M9J21haW4nPlxuICAgIDxIZWFkZXIgaGVhZGVyPXtoZWFkZXJ9IHVzZXJuYW1lPXt1c2VybmFtZX0gcHJvZmlsZUltZz17cHJvZmlsZUltZ30gLz5cbiAgPC9tYWluPlxuKVxuXG4vLyA8TmF2YmFyIGxpbmtzPXtsaW5rc30gLz5cbi8vIDxGb290ZXIgZm9vdGVyPXtmb290ZXJ9IC8+XG4vLyA8Um91dGUgcGF0aD0nLycgcmVuZGVyPXtIb21lUGFnZShzdGF0ZSwgYWN0aW9ucyl9IC8+XG4vL1xuLy8gPFJvdXRlIHBhdGg9Jy9hYm91dCcgcmVuZGVyPXtBYm91dFBhZ2V9IC8+XG4vLyA8Um91dGUgcGFyZW50IHBhdGg9Jy9waG90b3MnIHJlbmRlcj17UGhvdG9ncmFwaHlQYWdlKHN0YXRlLCBhY3Rpb25zKX0gLz5cbi8vIDxSb3V0ZSBwYXRoPScvYm9va3MnIHJlbmRlcj17Qm9va1BhZ2Uoc3RhdGUsIGFjdGlvbnMpfSAvPlxuLy8gPFJvdXRlIHBhdGg9Jy9zb25ncycgcmVuZGVyPXtHdWl0YXJQYWdlKHN0YXRlLCBhY3Rpb25zKX0gLz5cbi8vIDxSb3V0ZSBwYXRoPScvY29udGFjdHMnIHJlbmRlcj17Q29udGFjdFBhZ2Uoc3RhdGUsIGFjdGlvbnMpfSAvPlxuLy8gPFJvdXRlIHBhdGg9Jy9jb2RlcycgcmVuZGVyPXtQcm9ncmFtbWluZ1BhZ2Uoc3RhdGUsIGFjdGlvbnMpfSAvPlxuXG5hcHAoe1xuICBub2RlOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXBwJyksXG4gIHZpZXc6IHN0YXRlID0+IHZpZXcoc3RhdGUpLFxuICBpbml0OiBzdGF0ZVxufSlcbiJdLCJuYW1lcyI6WyJSRUNZQ0xFRF9OT0RFIiwiTEFaWV9OT0RFIiwiVEVYVF9OT0RFIiwiRU1QVFlfT0JKIiwiRU1QVFlfQVJSIiwibWFwIiwiaXNBcnJheSIsIkFycmF5IiwiZGVmZXIiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJzZXRUaW1lb3V0IiwiY3JlYXRlQ2xhc3MiLCJvYmoiLCJvdXQiLCJsZW5ndGgiLCJrIiwidG1wIiwibWVyZ2UiLCJhIiwiYiIsImJhdGNoIiwibGlzdCIsInJlZHVjZSIsIml0ZW0iLCJjb25jYXQiLCJpc1NhbWVBY3Rpb24iLCJzaG91bGRSZXN0YXJ0IiwicGF0Y2hTdWJzIiwib2xkU3VicyIsIm5ld1N1YnMiLCJkaXNwYXRjaCIsImkiLCJvbGRTdWIiLCJuZXdTdWIiLCJzdWJzIiwicHVzaCIsInBhdGNoUHJvcGVydHkiLCJub2RlIiwia2V5Iiwib2xkVmFsdWUiLCJuZXdWYWx1ZSIsImxpc3RlbmVyIiwiaXNTdmciLCJzZXRQcm9wZXJ0eSIsImFjdGlvbnMiLCJzbGljZSIsInRvTG93ZXJDYXNlIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImFkZEV2ZW50TGlzdGVuZXIiLCJyZW1vdmVBdHRyaWJ1dGUiLCJzZXRBdHRyaWJ1dGUiLCJjcmVhdGVOb2RlIiwidmRvbSIsIm5zIiwicHJvcHMiLCJ0eXBlIiwiZG9jdW1lbnQiLCJjcmVhdGVUZXh0Tm9kZSIsIm5hbWUiLCJjcmVhdGVFbGVtZW50TlMiLCJpcyIsImNyZWF0ZUVsZW1lbnQiLCJsZW4iLCJjaGlsZHJlbiIsImFwcGVuZENoaWxkIiwiZ2V0Vk5vZGUiLCJnZXRLZXkiLCJwYXRjaCIsInBhcmVudCIsIm9sZFZOb2RlIiwibmV3Vk5vZGUiLCJub2RlVmFsdWUiLCJpbnNlcnRCZWZvcmUiLCJyZW1vdmVDaGlsZCIsInRtcFZLaWQiLCJvbGRWS2lkIiwib2xkS2V5IiwibmV3S2V5Iiwib2xkVlByb3BzIiwibmV3VlByb3BzIiwib2xkVktpZHMiLCJuZXdWS2lkcyIsIm9sZEhlYWQiLCJuZXdIZWFkIiwib2xkVGFpbCIsIm5ld1RhaWwiLCJrZXllZCIsIm5ld0tleWVkIiwicHJvcHNDaGFuZ2VkIiwiZ2V0VGV4dFZOb2RlIiwiY3JlYXRlVGV4dFZOb2RlIiwibGF6eSIsInZpZXciLCJjcmVhdGVWTm9kZSIsInZhbHVlIiwidW5kZWZpbmVkIiwicmVjeWNsZU5vZGUiLCJub2RlVHlwZSIsIm5vZGVOYW1lIiwiY2FsbCIsImNoaWxkTm9kZXMiLCJoIiwicmVzdCIsImFyZ3VtZW50cyIsInBvcCIsImFwcCIsInN0YXRlIiwibG9jayIsInN1YnNjcmlwdGlvbnMiLCJldmVudCIsInNldFN0YXRlIiwibmV3U3RhdGUiLCJyZW5kZXIiLCJtaWRkbGV3YXJlIiwiYWN0aW9uIiwiZngiLCJwYXJlbnROb2RlIiwiaW5pdCIsImNvbXBvbmVudCIsImhlYWRlciIsInVzZXJuYW1lIiwicHJvZmlsZUltZyIsImJhY2tncm91bmQiLCJoZWFkaW5nIiwiaGVhZGluZ0dob3N0Iiwic3ViaGVhZGluZyIsInN1YmhlYWRpbmdHaG9zdCIsInVwZGF0ZUhlYWRpbmciLCJ1cGRhdGVTdWJoZWFkaW5nIiwicmVzZXRIZWFkaW5nIiwicmVzZXRTdWJoZWFkaW5nIiwiYm9va3MiLCJ0aXRsZSIsImF1dGhvciIsImxpZ2h0Ym94Iiwic2hvdyIsInNyYyIsInBob3RvcyIsImZvbGRlclBhdGgiLCJpbWFnZXMiLCJkb2YiLCJzaHV0dGVyU3BlZWQiLCJpc28iLCJjYW1lcmFNb2RlbCIsImxlbnNNb2RlbCIsInNpbmdhcG9yZU5kcCIsImtsTGlmZSIsInNpbmdhcG9yZVJhbmRvbSIsInNpbmdhcG9yZUNsYXJrZVF1YXkiLCJzaW5nYXBvcmVMaWZlIiwiYmFsaSIsInNob3dMaWdodGJveCIsImhpZGVMaWdodGJveCIsInNvbmdzIiwiT2JqZWN0IiwiYXNzaWduIiwiZm9vdGVyIiwiRGF0ZSIsImdldEZ1bGxZZWFyIiwibGlua3MiLCJ0byIsImxhYmVsIiwidHlwZXdyaXRlck1vZHVsZSIsImJvb2tNb2R1bGUiLCJwaG90b2dyYXBoeU1vZHVsZSIsImd1aXRhck1vZHVsZSIsImxvY2F0aW9uIiwiSGVhZGVyIiwiZ2V0RWxlbWVudEJ5SWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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
