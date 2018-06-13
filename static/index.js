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

(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
(function () {
'use strict';

function h(name, attributes) {
  var arguments$1 = arguments;

  var rest = [];
  var children = [];
  var length = arguments.length;

  while (length-- > 2) {
    rest.push(arguments$1[length]);
  }

  while (rest.length) {
    var node = rest.pop();

    if (node && node.pop) {
      for (length = node.length; length--;) {
        rest.push(node[length]);
      }
    } else if (node != null && node !== true && node !== false) {
      children.push(node);
    }
  }

  return typeof name === "function" ? name(attributes || {}, children) : {
    nodeName: name,
    attributes: attributes || {},
    children: children,
    key: attributes && attributes.key
  };
}
function app(state, actions, view, container) {
  var map = [].map;
  var rootElement = container && container.children[0] || null;
  var oldNode = rootElement && recycleElement(rootElement);
  var lifecycle = [];
  var skipRender;
  var isRecycling = true;
  var globalState = clone(state);
  var wiredActions = wireStateToActions([], globalState, clone(actions));
  scheduleRender();
  return wiredActions;

  function recycleElement(element) {
    return {
      nodeName: element.nodeName.toLowerCase(),
      attributes: {},
      children: map.call(element.childNodes, function (element) {
        return element.nodeType === 3 // Node.TEXT_NODE
        ? element.nodeValue : recycleElement(element);
      })
    };
  }

  function resolveNode(node) {
    return typeof node === "function" ? resolveNode(node(globalState, wiredActions)) : node != null ? node : "";
  }

  function render() {
    skipRender = !skipRender;
    var node = resolveNode(view);

    if (container && !skipRender) {
      rootElement = patch(container, rootElement, oldNode, oldNode = node);
    }

    isRecycling = false;

    while (lifecycle.length) {
      lifecycle.pop()();
    }
  }

  function scheduleRender() {
    if (!skipRender) {
      skipRender = true;
      setTimeout(render);
    }
  }

  function clone(target, source) {
    var out = {};

    for (var i in target) {
      out[i] = target[i];
    }

    for (var i in source) {
      out[i] = source[i];
    }

    return out;
  }

  function setPartialState(path, value, source) {
    var target = {};

    if (path.length) {
      target[path[0]] = path.length > 1 ? setPartialState(path.slice(1), value, source[path[0]]) : value;
      return clone(source, target);
    }

    return value;
  }

  function getPartialState(path, source) {
    var i = 0;

    while (i < path.length) {
      source = source[path[i++]];
    }

    return source;
  }

  function wireStateToActions(path, state, actions) {
    for (var key in actions) {
      typeof actions[key] === "function" ? function (key, action) {
        actions[key] = function (data) {
          var result = action(data);

          if (typeof result === "function") {
            result = result(getPartialState(path, globalState), actions);
          }

          if (result && result !== (state = getPartialState(path, globalState)) && !result.then // !isPromise
          ) {
              scheduleRender(globalState = setPartialState(path, clone(state, result), globalState));
            }

          return result;
        };
      }(key, actions[key]) : wireStateToActions(path.concat(key), state[key] = clone(state[key]), actions[key] = clone(actions[key]));
    }

    return actions;
  }

  function getKey(node) {
    return node ? node.key : null;
  }

  function eventListener(event) {
    return event.currentTarget.events[event.type](event);
  }

  function updateAttribute(element, name, value, oldValue, isSvg) {
    if (name === "key") {} else if (name === "style") {
      for (var i in clone(oldValue, value)) {
        var style = value == null || value[i] == null ? "" : value[i];

        if (i[0] === "-") {
          element[name].setProperty(i, style);
        } else {
          element[name][i] = style;
        }
      }
    } else {
      if (name[0] === "o" && name[1] === "n") {
        name = name.slice(2);

        if (element.events) {
          if (!oldValue) { oldValue = element.events[name]; }
        } else {
          element.events = {};
        }

        element.events[name] = value;

        if (value) {
          if (!oldValue) {
            element.addEventListener(name, eventListener);
          }
        } else {
          element.removeEventListener(name, eventListener);
        }
      } else if (name in element && name !== "list" && !isSvg) {
        element[name] = value == null ? "" : value;
      } else if (value != null && value !== false) {
        element.setAttribute(name, value);
      }

      if (value == null || value === false) {
        element.removeAttribute(name);
      }
    }
  }

  function createElement(node, isSvg) {
    var element = typeof node === "string" || typeof node === "number" ? document.createTextNode(node) : (isSvg = isSvg || node.nodeName === "svg") ? document.createElementNS("http://www.w3.org/2000/svg", node.nodeName) : document.createElement(node.nodeName);
    var attributes = node.attributes;

    if (attributes) {
      if (attributes.oncreate) {
        lifecycle.push(function () {
          attributes.oncreate(element);
        });
      }

      for (var i = 0; i < node.children.length; i++) {
        element.appendChild(createElement(node.children[i] = resolveNode(node.children[i]), isSvg));
      }

      for (var name in attributes) {
        updateAttribute(element, name, attributes[name], null, isSvg);
      }
    }

    return element;
  }

  function updateElement(element, oldAttributes, attributes, isSvg) {
    for (var name in clone(oldAttributes, attributes)) {
      if (attributes[name] !== (name === "value" || name === "checked" ? element[name] : oldAttributes[name])) {
        updateAttribute(element, name, attributes[name], oldAttributes[name], isSvg);
      }
    }

    var cb = isRecycling ? attributes.oncreate : attributes.onupdate;

    if (cb) {
      lifecycle.push(function () {
        cb(element, oldAttributes);
      });
    }
  }

  function removeChildren(element, node) {
    var attributes = node.attributes;

    if (attributes) {
      for (var i = 0; i < node.children.length; i++) {
        removeChildren(element.childNodes[i], node.children[i]);
      }

      if (attributes.ondestroy) {
        attributes.ondestroy(element);
      }
    }

    return element;
  }

  function removeElement(parent, element, node) {
    function done() {
      parent.removeChild(removeChildren(element, node));
    }

    var cb = node.attributes && node.attributes.onremove;

    if (cb) {
      cb(element, done);
    } else {
      done();
    }
  }

  function patch(parent, element, oldNode, node, isSvg) {
    if (node === oldNode) {} else if (oldNode == null || oldNode.nodeName !== node.nodeName) {
      var newElement = createElement(node, isSvg);
      parent.insertBefore(newElement, element);

      if (oldNode != null) {
        removeElement(parent, element, oldNode);
      }

      element = newElement;
    } else if (oldNode.nodeName == null) {
      element.nodeValue = node;
    } else {
      updateElement(element, oldNode.attributes, node.attributes, isSvg = isSvg || node.nodeName === "svg");
      var oldKeyed = {};
      var newKeyed = {};
      var oldElements = [];
      var oldChildren = oldNode.children;
      var children = node.children;

      for (var i = 0; i < oldChildren.length; i++) {
        oldElements[i] = element.childNodes[i];
        var oldKey = getKey(oldChildren[i]);

        if (oldKey != null) {
          oldKeyed[oldKey] = [oldElements[i], oldChildren[i]];
        }
      }

      var i = 0;
      var k = 0;

      while (k < children.length) {
        var oldKey = getKey(oldChildren[i]);
        var newKey = getKey(children[k] = resolveNode(children[k]));

        if (newKeyed[oldKey]) {
          i++;
          continue;
        }

        if (newKey != null && newKey === getKey(oldChildren[i + 1])) {
          if (oldKey == null) {
            removeElement(element, oldElements[i], oldChildren[i]);
          }

          i++;
          continue;
        }

        if (newKey == null || isRecycling) {
          if (oldKey == null) {
            patch(element, oldElements[i], oldChildren[i], children[k], isSvg);
            k++;
          }

          i++;
        } else {
          var keyedNode = oldKeyed[newKey] || [];

          if (oldKey === newKey) {
            patch(element, keyedNode[0], keyedNode[1], children[k], isSvg);
            i++;
          } else if (keyedNode[0]) {
            patch(element, element.insertBefore(keyedNode[0], oldElements[i]), keyedNode[1], children[k], isSvg);
          } else {
            patch(element, oldElements[i], null, children[k], isSvg);
          }

          newKeyed[newKey] = children[k];
          k++;
        }
      }

      while (i < oldChildren.length) {
        if (getKey(oldChildren[i]) == null) {
          removeElement(element, oldElements[i], oldChildren[i]);
        }

        i++;
      }

      for (var i in oldKeyed) {
        if (!newKeyed[i]) {
          removeElement(element, oldKeyed[i][0], oldKeyed[i][1]);
        }
      }
    }

    return element;
  }
}

function getOrigin(loc) {
  return loc.protocol + "//" + loc.hostname + (loc.port ? ":" + loc.port : "");
}

function isExternal(anchorElement) {
  // Location.origin and HTMLAnchorElement.origin are not
  // supported by IE and Safari.
  return getOrigin(location) !== getOrigin(anchorElement);
}

function Link(props, children) {
  return function (state, actions) {
    var to = props.to;
    var location = state.location;
    var onclick = props.onclick;
    delete props.to;
    delete props.location;
    props.href = to;

    props.onclick = function (e) {
      if (onclick) {
        onclick(e);
      }

      if (e.defaultPrevented || e.button !== 0 || e.altKey || e.metaKey || e.ctrlKey || e.shiftKey || props.target === "_blank" || isExternal(e.currentTarget)) {} else {
        e.preventDefault();

        if (to !== location.pathname) {
          history.pushState(location.pathname, "", to);
        }
      }
    };

    return h("a", props, children);
  };
}

function createMatch(isExact, path, url, params) {
  return {
    isExact: isExact,
    path: path,
    url: url,
    params: params
  };
}

function trimTrailingSlash(url) {
  for (var len = url.length; "/" === url[--len];) {
    
  }

  return url.slice(0, len + 1);
}

function decodeParam(val) {
  try {
    return decodeURIComponent(val);
  } catch (e) {
    return val;
  }
}

function parseRoute(path, url, options) {
  if (path === url || !path) {
    return createMatch(path === url, path, url);
  }

  var exact = options && options.exact;
  var paths = trimTrailingSlash(path).split("/");
  var urls = trimTrailingSlash(url).split("/");

  if (paths.length > urls.length || exact && paths.length < urls.length) {
    return;
  }

  for (var i = 0, params = {}, len = paths.length, url = ""; i < len; i++) {
    if (":" === paths[i][0]) {
      params[paths[i].slice(1)] = urls[i] = decodeParam(urls[i]);
    } else if (paths[i] !== urls[i]) {
      return;
    }

    url += urls[i] + "/";
  }

  return createMatch(false, path, url.slice(0, -1), params);
}

function Route(props) {
  return function (state, actions) {
    var location = state.location;
    var match = parseRoute(props.path, location.pathname, {
      exact: !props.parent
    });
    return match && props.render({
      match: match,
      location: location
    });
  };
}

function wrapHistory(keys) {
  return keys.reduce(function (next, key) {
    var fn = history[key];

    history[key] = function (data, title, url) {
      fn.call(this, data, title, url);
      dispatchEvent(new CustomEvent("pushstate", {
        detail: data
      }));
    };

    return function () {
      history[key] = fn;
      next && next();
    };
  }, null);
}

var location$1 = {
  state: {
    pathname: window.location.pathname,
    previous: window.location.pathname
  },
  actions: {
    go: function go(pathname) {
      history.pushState(null, "", pathname);
    },
    set: function set(data) {
      return data;
    }
  },
  subscribe: function subscribe(actions) {
    function handleLocationChange(e) {
      actions.set({
        pathname: window.location.pathname,
        previous: e.detail ? window.location.previous = e.detail : window.location.previous
      });
    }

    var unwrap = wrapHistory(["pushState", "replaceState"]);
    addEventListener("pushstate", handleLocationChange);
    addEventListener("popstate", handleLocationChange);
    return function () {
      removeEventListener("pushstate", handleLocationChange);
      removeEventListener("popstate", handleLocationChange);
      unwrap();
    };
  }
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
  }, h(Link, {
    "class": 'header-brand',
    to: '/'
  }, header), h("div", {
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

var component$1 = function component(_ref) {
  var links = _ref.links,
      route = _ref.route;
  return h("navbar", {
    "class": 'navbar'
  }, links.map(function (link) {
    return h(Link, {
      "class": "navbar-link ".concat(link.to === route && 'is-selected'),
      to: link.to
    }, link.label);
  }));
};

var component$2 = function component(_ref) {
  var _ref$footer = _ref.footer,
      footer = _ref$footer === void 0 ? 'Copyright © 2018 yourapp' : _ref$footer;
  return h("footer", {
    "class": 'footer'
  }, footer);
};

var component$3 = function component(_ref) {
  var _ref$row = _ref.row,
      row = _ref$row === void 0 ? 1 : _ref$row;
  return h("div", {
    style: {
      height: "".concat(row * 1.25, "rem"),
      display: 'block',
      width: '100%'
    }
  });
};

var page = function page(state, actions) {
  return function (props) {
    return h("div", {
      "class": 'body'
    }, h("div", {
      "class": 'body-column'
    }, h("h1", null, "Books I read"), h(component$3, null), h("div", {
      "class": 'quote'
    }, "you can't buy happiness but you can buy books ... and that's kind of the same thing"), h(component$3, null), h("div", {
      "class": 'book-holder'
    }, state.books.map(function (book) {
      return h("div", {
        "class": 'book'
      }, book.title, " - ", h("i", null, book.author));
    })), h(component$3, {
      row: 3
    })));
  };
};

function _AwaitValue(value) {
  this.wrapped = value;
}

function _AsyncGenerator(gen) {
  var front, back;

  function send(key, arg) {
    return new Promise(function (resolve, reject) {
      var request = {
        key: key,
        arg: arg,
        resolve: resolve,
        reject: reject,
        next: null
      };

      if (back) {
        back = back.next = request;
      } else {
        front = back = request;
        resume(key, arg);
      }
    });
  }

  function resume(key, arg) {
    try {
      var result = gen[key](arg);
      var value = result.value;
      var wrappedAwait = value instanceof _AwaitValue;
      Promise.resolve(wrappedAwait ? value.wrapped : value).then(function (arg) {
        if (wrappedAwait) {
          resume("next", arg);
          return;
        }

        settle(result.done ? "return" : "normal", arg);
      }, function (err) {
        resume("throw", err);
      });
    } catch (err) {
      settle("throw", err);
    }
  }

  function settle(type, value) {
    switch (type) {
      case "return":
        front.resolve({
          value: value,
          done: true
        });
        break;

      case "throw":
        front.reject(value);
        break;

      default:
        front.resolve({
          value: value,
          done: false
        });
        break;
    }

    front = front.next;

    if (front) {
      resume(front.key, front.arg);
    } else {
      back = null;
    }
  }

  this._invoke = send;

  if (typeof gen.return !== "function") {
    this.return = undefined;
  }
}

if (typeof Symbol === "function" && Symbol.asyncIterator) {
  _AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
    return this;
  };
}

_AsyncGenerator.prototype.next = function (arg) {
  return this._invoke("next", arg);
};

_AsyncGenerator.prototype.throw = function (arg) {
  return this._invoke("throw", arg);
};

_AsyncGenerator.prototype.return = function (arg) {
  return this._invoke("return", arg);
};

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function step(key, arg) {
        try {
          var info = gen[key](arg);
          var value = info.value;
        } catch (error) {
          reject(error);
          return;
        }

        if (info.done) {
          resolve(value);
        } else {
          Promise.resolve(value).then(_next, _throw);
        }
      }

      function _next(value) {
        step("next", value);
      }

      function _throw(err) {
        step("throw", err);
      }

      _next();
    });
  };
}

function pause() {
  return _pause.apply(this, arguments);
}

function _pause() {
  _pause = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee() {
    var duration,
        _args = arguments;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            duration = _args.length > 0 && _args[0] !== undefined ? _args[0] : Math.round(Math.random() * 15 + 25);
            return _context.abrupt("return", new Promise(function (resolve, reject) {
              window.setTimeout(resolve, duration);
            }));

          case 2:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _pause.apply(this, arguments);
}

function type(_x) {
  return _type.apply(this, arguments);
}

function _type() {
  _type = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(max) {
    var counter,
        callback,
        _args = arguments;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            counter = _args.length > 1 && _args[1] !== undefined ? _args[1] : 0;
            callback = _args.length > 2 ? _args[2] : undefined;

            if (!(counter < max)) {
              _context.next = 7;
              break;
            }

            callback && callback(counter);
            _context.next = 6;
            return pause();

          case 6:
            return _context.abrupt("return", type(max, counter + 1, callback));

          case 7:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _type.apply(this, arguments);
}

var page$1 = function page(state, actions) {
  return function (props) {
    if (!state.heading.length && !state.subheading.length) {
      startTyping(actions, state.headingGhost.split(''), state.subheadingGhost.split(''));
    }

    return h("div", {
      "class": 'body'
    }, h("div", {
      "class": 'body-column'
    }, h("h1", null, state.heading, state.heading.length !== state.headingGhost.length && h("span", {
      "class": 'caret'
    })), h("h1", null, state.subheading, state.subheading.length !== 0 && h("span", {
      "class": 'caret is-active'
    }))));
  };
}; // This functionality will be invoked only once


function startTyping(_x, _x2, _x3) {
  return _startTyping.apply(this, arguments);
}

function _startTyping() {
  _startTyping = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(actions, heading, subheading) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return type(heading.length, 0, function (counter) {
              return actions.updateHeading(heading[counter]);
            });

          case 2:
            _context.next = 4;
            return pause(250);

          case 4:
            _context.next = 6;
            return type(subheading.length, 0, function (counter) {
              return actions.updateSubheading(subheading[counter]);
            });

          case 6:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _startTyping.apply(this, arguments);
}

var page$2 = function page() {
  return h("div", {
    "class": 'body'
  }, h("div", {
    "class": 'body-column'
  }, "About Page"));
};

var page$3 = function page(state, actions) {
  return function (props) {
    return h("div", {
      "class": 'body'
    }, h("div", {
      "class": 'body-column'
    }, h("br", null), h("br", null), h("br", null), h("div", {
      "class": 'photo-holder'
    }, h("div", {
      "class": 'photo-grid photo-100'
    }, h("div", {
      "class": 'photo-caption'
    }, "Christmas Market 2015"), h("img", {
      "class": 'photo-src',
      src: './assets/img/photography/01-christmas_market/DSCF2052_small.jpg'
    })), h("div", {
      "class": 'photo-grid photo-200'
    }, h("div", {
      "class": 'photo-caption'
    }, "Kuala Lumpur"), h("img", {
      "class": 'photo-src',
      src: './assets/img/photography/02-malaysia/DSCF2336_small.jpg'
    })), h("div", {
      "class": 'photo-grid photo-300'
    }, h("div", {
      "class": 'photo-caption'
    }, "Danboard"), h("img", {
      "class": 'photo-src',
      src: './assets/img/photography/06-danboard/IMG_4735_edited_small.jpg'
    })), h("div", {
      "class": 'photo-grid photo-400'
    }, h("div", {
      "class": 'photo-caption'
    }, "Preiser Figure"), h("img", {
      "class": 'photo-src',
      src: './assets/img/photography/07-preiser_figure/06_small.jpg'
    }))), h("br", null), h("br", null), h("br", null)));
  };
};

var page$4 = function page(state, actions) {
  return function (props) {
    return h("div", {
      "class": 'body'
    }, h("div", {
      "class": 'body-column'
    }, h("h1", null, "Songs I play"), h("p", null, "I don't play guitar as much as I do anymore. These are some of the fingerstyle guitar solos that I recorded using ", h("i", null, "Zoom H1"), ". Enjoy!"), h(component$3, null), h("div", {
      "class": 'quote'
    }, "I just want to be a guy with a guitar - ", h("i", null, h("small", null, "Jeff Buckley"))), h(component$3, null), h(component$3, null), h("div", {
      "class": 'guitar-holder'
    }, state.songs.map(function (song) {
      return h("div", {
        "class": 'guitar'
      }, h("iframe", {
        width: '100%',
        height: '166',
        scrolling: 'no',
        frameborder: 'no',
        allow: 'autoplay',
        src: song
      }));
    })), h(component$3, {
      row: 3
    })));
  };
};

var page$5 = function page(state, actions) {
  return function (props) {
    return h("div", {
      "class": 'body'
    }, h("div", {
      "class": 'body-column'
    }, h("h1", null, "Contact Me"), h("p", null, "I am a Developer based in Malaysia. I do Frontend, Backend and DevOps related stuff. To understand more about what I am doing at present, follow me on Github."), h("p", null, "Please email me to request for my resume."), h(component$3, null), h("div", null, h("b", null, "Email:"), " ", h("a", {
      href: 'mailto:alextan220990@gmail.com'
    }, "alextan220990@gmail.com")), h(component$3, null), h("div", null, h("b", null, "Behance:"), " ", h("a", {
      href: 'https://www.behance.net/alextan220e3ae',
      target: '_blank'
    }, "https://www.behance.net/alextan220e3ae")), h(component$3, null), h("div", null, h("b", null, "Github:"), " ", h("a", {
      href: 'https://github.com/alextanhongpin',
      target: '_blank'
    }, "https://github.com/alextanhongpin"))));
  };
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

var photographyModule = {
  state: {
    photos: {
      'christmas-market': {
        folderPath: '01-christmas_market/DSCF2',
        images: [{
          name: '043.JPG',
          dof: 'f/1.4',
          shutterSpeed: '1/220 sec',
          iso: '200'
        }, {
          name: '046.JPG',
          dof: 'f/1.4',
          shutterSpeed: '1/480 sec',
          iso: '200'
        }, {
          name: '050.JPG',
          dof: 'f/1.4',
          shutterSpeed: '1/160 sec',
          iso: '200'
        }, {
          name: '052.JPG',
          dof: 'f/1.4',
          shutterSpeed: '1/450 sec',
          iso: '200'
        }, {
          name: '054.JPG',
          dof: 'f/1.4',
          shutterSpeed: '1/52 sec',
          iso: '320'
        }, {
          name: '055.JPG',
          dof: 'f/1.4',
          shutterSpeed: '1/56 sec',
          iso: '200'
        }, {
          name: '057.JPG',
          dof: 'f/1.4',
          shutterSpeed: '1/70 sec',
          iso: '200'
        }, {
          name: '058.JPG',
          dof: 'f/1.4',
          shutterSpeed: '1/52 sec',
          iso: '200'
        }, {
          name: '059.JPG',
          dof: 'f/1.4',
          shutterSpeed: '1/70 sec',
          iso: '200'
        }, {
          name: '078.JPG',
          dof: 'f/1.4',
          shutterSpeed: '1/52 sec',
          iso: '2500'
        }, {
          name: '088.JPG',
          dof: 'f/1.4',
          shutterSpeed: '1/52 sec',
          iso: '2500'
        }, {
          name: '095.JPG',
          dof: 'f/1.4',
          shutterSpeed: '1/52 sec',
          iso: '3200'
        }, {
          name: '104.JPG',
          dof: 'f/1.4',
          shutterSpeed: '1/52 sec',
          iso: '2000'
        }],
        camera: {
          model: 'Fujifilm XE-1',
          focalLength: '35 mm'
        }
      },
      'malaysia': {
        folderPath: '02-malaysia/DSCF2',
        images: [{
          name: '336.JPG',
          dof: 'f/3.2',
          shutterSpeed: '1/3000 sec',
          iso: '200'
        }, {
          name: '342.JPG',
          dof: 'f/2.8',
          shutterSpeed: '1/4000 sec',
          iso: '200'
        }, {
          name: '346.JPG',
          dof: 'f/2.8',
          shutterSpeed: '1/300 sec',
          iso: '800'
        }, {
          name: '348.JPG',
          dof: 'f/2.8',
          shutterSpeed: '1/90 sec',
          iso: '400'
        }, {
          name: '351.JPG',
          dof: 'f/2.8',
          shutterSpeed: '1/160 sec',
          iso: '100'
        }, {
          name: '353.JPG',
          dof: 'f/2.8',
          shutterSpeed: '1/56 sec',
          iso: '100'
        }, {
          name: '363.JPG',
          dof: 'f/2.8',
          shutterSpeed: '1/1900 sec',
          iso: '800'
        }, {
          name: '366.JPG',
          dof: 'f/1.4',
          shutterSpeed: '1/3500 sec',
          iso: '200'
        }, {
          name: '368.JPG',
          dof: 'f/1.4',
          shutterSpeed: '1/180 sec',
          iso: '800'
        }, {
          name: '370.JPG',
          dof: 'f/1.4',
          shutterSpeed: '1/2200 sec',
          iso: '800'
        }, {
          name: '373.JPG',
          dof: 'f/1.4',
          shutterSpeed: '1/2400 sec',
          iso: '400'
        }, {
          name: '379.JPG',
          dof: 'f/1.4',
          shutterSpeed: '1/1400 sec',
          iso: '200'
        }, {
          name: '381.JPG',
          dof: 'f/1.4',
          shutterSpeed: '1/90 sec',
          iso: '800'
        }, {
          name: '415.JPG',
          dof: 'f/13',
          shutterSpeed: '1/2400 sec',
          iso: '800'
        }, {
          name: '423.JPG',
          dof: 'f/1.4',
          shutterSpeed: '1/550 sec',
          iso: '800'
        }, {
          name: '424.JPG',
          dof: 'f/1.4',
          shutterSpeed: '1/1100 sec',
          iso: '200'
        }, {
          name: '425.JPG',
          dof: 'f/1.4',
          shutterSpeed: '1/1000 sec',
          iso: '200'
        }, {
          name: '426.JPG',
          dof: 'f/1.4',
          shutterSpeed: '1/900 sec',
          iso: '200'
        }],
        camera: {
          model: 'Fujifilm XE-1',
          focalLength: '35 mm'
        }
      },
      'danboard': {
        folderPath: '06-danboard/IMG_',
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
        camera: {
          model: 'Canon EOS 600D',
          focalLength: '100 mm'
        }
      },
      'preiser-figure': {
        folderPath: '07-preiser_figure/',
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
        camera: {
          model: 'Canon EOS 600D',
          focalLength: '100 mm'
        }
      },
      'berlin': {
        folderPath: '05-berlin_trip/',
        images: [{
          'name': 'DSCF2607.JPG',
          'iso': 200,
          'shutterSpeed': '1/1663',
          'dof': 1.4
        }, {
          'name': 'DSCF2608.JPG',
          'iso': 200,
          'shutterSpeed': '1/739',
          'dof': 1.4
        }, {
          'name': 'DSCF2609.JPG',
          'iso': 200,
          'shutterSpeed': '1/1038',
          'dof': 1.4
        }, {
          'name': 'DSCF2611.JPG',
          'iso': 200,
          'shutterSpeed': '1/600',
          'dof': 1.4
        }, {
          'name': 'DSCF2616.JPG',
          'iso': 200,
          'shutterSpeed': '1/729',
          'dof': 1.4
        }, {
          'name': 'DSCF2619.JPG',
          'iso': 320,
          'shutterSpeed': '1/64',
          'dof': 8.0
        }, {
          'name': 'DSCF2626.JPG',
          'iso': 800,
          'shutterSpeed': '1/38',
          'dof': 1.4
        }, {
          'name': 'DSCF2634.JPG',
          'iso': 800,
          'shutterSpeed': '1/64',
          'dof': 1.4
        }, {
          'name': 'DSCF2637.JPG',
          'iso': 800,
          'shutterSpeed': '1/23',
          'dof': 1.4
        }, {
          'name': 'DSCF2650.JPG',
          'iso': 800,
          'shutterSpeed': '1/53',
          'dof': 1.4
        }, {
          'name': 'DSCF2656.JPG',
          'iso': 200,
          'shutterSpeed': '1/676',
          'dof': 8.9
        }, {
          'name': 'DSCF2658.JPG',
          'iso': 200,
          'shutterSpeed': '1/588',
          'dof': 10.9
        }, {
          'name': 'DSCF2659.JPG',
          'iso': 200,
          'shutterSpeed': '1/2091',
          'dof': 4.0
        }, {
          'name': 'DSCF2660.JPG',
          'iso': 200,
          'shutterSpeed': '1/2353',
          'dof': 4.0
        }, {
          'name': 'DSCF2666.JPG',
          'iso': 200,
          'shutterSpeed': '1/143',
          'dof': 10.9
        }, {
          'name': 'DSCF2667.JPG',
          'iso': 200,
          'shutterSpeed': '1/1859',
          'dof': 3.2
        }, {
          'name': 'DSCF2668.JPG',
          'iso': 200,
          'shutterSpeed': '1/111',
          'dof': 10.9
        }, {
          'name': 'DSCF2670.JPG',
          'iso': 200,
          'shutterSpeed': '1/3126',
          'dof': 1.4
        }, {
          'name': 'DSCF2671.JPG',
          'iso': 320,
          'shutterSpeed': '1/64',
          'dof': 1.4
        }, {
          'name': 'DSCF2673.JPG',
          'iso': 200,
          'shutterSpeed': '1/4096',
          'dof': 1.6
        }, {
          'name': 'DSCF2685.JPG',
          'iso': 200,
          'shutterSpeed': '1/1226',
          'dof': 4.0
        }, {
          'name': 'DSCF2690.JPG',
          'iso': 200,
          'shutterSpeed': '1/792',
          'dof': 4.0
        }, {
          'name': 'DSCF2695.JPG',
          'iso': 200,
          'shutterSpeed': '1/653',
          'dof': 4.0
        }, {
          'name': 'DSCF2696.JPG',
          'iso': 200,
          'shutterSpeed': '1/724',
          'dof': 4.0
        }, {
          'name': 'DSCF2697.JPG',
          'iso': 200,
          'shutterSpeed': '1/1252',
          'dof': 4.0
        }, {
          'name': 'DSCF2700.JPG',
          'iso': 200,
          'shutterSpeed': '1/105',
          'dof': 4.0
        }, {
          'name': 'DSCF2702.JPG',
          'iso': 200,
          'shutterSpeed': '1/1458',
          'dof': 1.4
        }, {
          'name': 'DSCF2729.JPG',
          'iso': 800,
          'shutterSpeed': '1/20',
          'dof': 1.4
        }, {
          'name': 'DSCF2730.JPG',
          'iso': 800,
          'shutterSpeed': '1/24',
          'dof': 1.4
        }, {
          'name': 'DSCF2733.JPG',
          'iso': 200,
          'shutterSpeed': '1/241',
          'dof': 10.9
        }, {
          'name': 'DSCF2738.JPG',
          'iso': 200,
          'shutterSpeed': '1/64',
          'dof': 8.0
        }, {
          'name': 'DSCF2741.JPG',
          'iso': 200,
          'shutterSpeed': '1/69',
          'dof': 8.0
        }, {
          'name': 'DSCF2743.JPG',
          'iso': 200,
          'shutterSpeed': '1/428',
          'dof': 8.0
        }, {
          'name': 'DSCF2755.JPG',
          'iso': 200,
          'shutterSpeed': '1/1438',
          'dof': 1.4
        }, {
          'name': 'DSCF2756.JPG',
          'iso': 200,
          'shutterSpeed': '1/152',
          'dof': 1.6
        }, {
          'name': 'DSCF2760.JPG',
          'iso': 200,
          'shutterSpeed': '1/229',
          'dof': 1.4
        }, {
          'name': 'DSCF2763.JPG',
          'iso': 200,
          'shutterSpeed': '1/1629',
          'dof': 1.6
        }, {
          'name': 'DSCF2767.JPG',
          'iso': 400,
          'shutterSpeed': '1/64',
          'dof': 1.4
        }, {
          'name': 'DSCF2771.JPG',
          'iso': 200,
          'shutterSpeed': '1/256',
          'dof': 1.4
        }, {
          'name': 'DSCF2775.JPG',
          'iso': 320,
          'shutterSpeed': '1/64',
          'dof': 1.4
        }, {
          'name': 'DSCF2776.JPG',
          'iso': 320,
          'shutterSpeed': '1/64',
          'dof': 1.4
        }, {
          'name': 'DSCF2777.JPG',
          'iso': 500,
          'shutterSpeed': '1/64',
          'dof': 1.4
        }, {
          'name': 'DSCF2778.JPG',
          'iso': 400,
          'shutterSpeed': '1/64',
          'dof': 1.4
        }],
        camera: {
          model: 'Fujifilm XE-1',
          focalLength: '35.0mm',
          lensModel: 'XF35mmF1.4 R'
        }
      }
    }
  }
};

var guitarModule = {
  state: {
    songs: ['https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/157502847&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true', 'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/153449882&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true', 'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/150634086&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true', 'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/150323475&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true']
  }
};

// import 'babel-polyfill'
var state = Object.assign({}, {
  header: 'alextanhongpin',
  username: 'Alex Tan',
  footer: "Copyright \xA9 ".concat(new Date().getFullYear(), " alextanhongpin"),
  profileImg: './assets/img/profile.jpg',
  // Register state for @hyperapp/router
  location: location$1.state,
  links: [{
    to: '/',
    label: 'Home'
  }, // {
  //   to: '/about',
  //   label: 'About'
  // },
  {
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
  }]
}, typewriterModule.state, bookModule.state, photographyModule.state, guitarModule.state);
var actions = Object.assign({}, {
  // Register actions for @hyperapp/router
  location: location$1.actions
}, typewriterModule.actions);

var view = function view(state, actions) {
  return h("main", {
    "class": 'main'
  }, h(component, {
    header: state.header,
    username: state.username,
    profileImg: state.profileImg
  }), h(component$1, {
    links: state.links,
    route: state.location.pathname
  }), h(Route, {
    path: '/',
    render: page$1(state, actions)
  }), h(Route, {
    path: '/about',
    render: page$2
  }), h(Route, {
    path: '/photos',
    render: page$3
  }), h(Route, {
    path: '/books',
    render: page(state, actions)
  }), h(Route, {
    path: '/songs',
    render: page$4(state, actions)
  }), h(Route, {
    path: '/contacts',
    render: page$5(state, actions)
  }), h(component$2, {
    footer: state.footer
  }));
};

var main = app(state, actions, view, document.body); // Register @hyperapp/router

location$1.subscribe(main.location);

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9oeXBlcmFwcC9zcmMvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvQGh5cGVyYXBwL3JvdXRlci9zcmMvTGluay5qcyIsIi4uL25vZGVfbW9kdWxlcy9AaHlwZXJhcHAvcm91dGVyL3NyYy9wYXJzZVJvdXRlLmpzIiwiLi4vbm9kZV9tb2R1bGVzL0BoeXBlcmFwcC9yb3V0ZXIvc3JjL1JvdXRlLmpzIiwiLi4vbm9kZV9tb2R1bGVzL0BoeXBlcmFwcC9yb3V0ZXIvc3JjL2xvY2F0aW9uLmpzIiwiLi4vc3JjL2F0b21pYy9hdG9tcy9IZWFkZXIvaW5kZXguanMiLCIuLi9zcmMvYXRvbWljL2F0b21zL05hdmJhci9pbmRleC5qcyIsIi4uL3NyYy9hdG9taWMvYXRvbXMvRm9vdGVyL2luZGV4LmpzIiwiLi4vc3JjL2F0b21pYy9hdG9tcy9CcmVhay9pbmRleC5qcyIsIi4uL3NyYy9hdG9taWMvcGFnZXMvQm9vay9pbmRleC5qcyIsIi4uL3NyYy91dGlscy9wYXVzZS5qcyIsIi4uL3NyYy91dGlscy90eXBlLmpzIiwiLi4vc3JjL2F0b21pYy9wYWdlcy9Ib21lL2luZGV4LmpzIiwiLi4vc3JjL2F0b21pYy9wYWdlcy9BYm91dC9pbmRleC5qcyIsIi4uL3NyYy9hdG9taWMvcGFnZXMvUGhvdG9ncmFwaHkvaW5kZXguanMiLCIuLi9zcmMvYXRvbWljL3BhZ2VzL0d1aXRhci9pbmRleC5qcyIsIi4uL3NyYy9hdG9taWMvcGFnZXMvQ29udGFjdC9pbmRleC5qcyIsIi4uL3NyYy9zdG9yZS90eXBld3JpdGVyL2luZGV4LmpzIiwiLi4vc3JjL3N0b3JlL2Jvb2svaW5kZXguanMiLCIuLi9zcmMvc3RvcmUvcGhvdG8vaW5kZXguanMiLCIuLi9zcmMvc3RvcmUvZ3VpdGFyL2luZGV4LmpzIiwiLi4vc3JjL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBmdW5jdGlvbiBoKG5hbWUsIGF0dHJpYnV0ZXMpIHtcbiAgdmFyIHJlc3QgPSBbXVxuICB2YXIgY2hpbGRyZW4gPSBbXVxuICB2YXIgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aFxuXG4gIHdoaWxlIChsZW5ndGgtLSA+IDIpIHJlc3QucHVzaChhcmd1bWVudHNbbGVuZ3RoXSlcblxuICB3aGlsZSAocmVzdC5sZW5ndGgpIHtcbiAgICB2YXIgbm9kZSA9IHJlc3QucG9wKClcbiAgICBpZiAobm9kZSAmJiBub2RlLnBvcCkge1xuICAgICAgZm9yIChsZW5ndGggPSBub2RlLmxlbmd0aDsgbGVuZ3RoLS07ICkge1xuICAgICAgICByZXN0LnB1c2gobm9kZVtsZW5ndGhdKVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAobm9kZSAhPSBudWxsICYmIG5vZGUgIT09IHRydWUgJiYgbm9kZSAhPT0gZmFsc2UpIHtcbiAgICAgIGNoaWxkcmVuLnB1c2gobm9kZSlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHlwZW9mIG5hbWUgPT09IFwiZnVuY3Rpb25cIlxuICAgID8gbmFtZShhdHRyaWJ1dGVzIHx8IHt9LCBjaGlsZHJlbilcbiAgICA6IHtcbiAgICAgICAgbm9kZU5hbWU6IG5hbWUsXG4gICAgICAgIGF0dHJpYnV0ZXM6IGF0dHJpYnV0ZXMgfHwge30sXG4gICAgICAgIGNoaWxkcmVuOiBjaGlsZHJlbixcbiAgICAgICAga2V5OiBhdHRyaWJ1dGVzICYmIGF0dHJpYnV0ZXMua2V5XG4gICAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcHAoc3RhdGUsIGFjdGlvbnMsIHZpZXcsIGNvbnRhaW5lcikge1xuICB2YXIgbWFwID0gW10ubWFwXG4gIHZhciByb290RWxlbWVudCA9IChjb250YWluZXIgJiYgY29udGFpbmVyLmNoaWxkcmVuWzBdKSB8fCBudWxsXG4gIHZhciBvbGROb2RlID0gcm9vdEVsZW1lbnQgJiYgcmVjeWNsZUVsZW1lbnQocm9vdEVsZW1lbnQpXG4gIHZhciBsaWZlY3ljbGUgPSBbXVxuICB2YXIgc2tpcFJlbmRlclxuICB2YXIgaXNSZWN5Y2xpbmcgPSB0cnVlXG4gIHZhciBnbG9iYWxTdGF0ZSA9IGNsb25lKHN0YXRlKVxuICB2YXIgd2lyZWRBY3Rpb25zID0gd2lyZVN0YXRlVG9BY3Rpb25zKFtdLCBnbG9iYWxTdGF0ZSwgY2xvbmUoYWN0aW9ucykpXG5cbiAgc2NoZWR1bGVSZW5kZXIoKVxuXG4gIHJldHVybiB3aXJlZEFjdGlvbnNcblxuICBmdW5jdGlvbiByZWN5Y2xlRWxlbWVudChlbGVtZW50KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5vZGVOYW1lOiBlbGVtZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCksXG4gICAgICBhdHRyaWJ1dGVzOiB7fSxcbiAgICAgIGNoaWxkcmVuOiBtYXAuY2FsbChlbGVtZW50LmNoaWxkTm9kZXMsIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQubm9kZVR5cGUgPT09IDMgLy8gTm9kZS5URVhUX05PREVcbiAgICAgICAgICA/IGVsZW1lbnQubm9kZVZhbHVlXG4gICAgICAgICAgOiByZWN5Y2xlRWxlbWVudChlbGVtZW50KVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZXNvbHZlTm9kZShub2RlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBub2RlID09PSBcImZ1bmN0aW9uXCJcbiAgICAgID8gcmVzb2x2ZU5vZGUobm9kZShnbG9iYWxTdGF0ZSwgd2lyZWRBY3Rpb25zKSlcbiAgICAgIDogbm9kZSAhPSBudWxsXG4gICAgICAgID8gbm9kZVxuICAgICAgICA6IFwiXCJcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICBza2lwUmVuZGVyID0gIXNraXBSZW5kZXJcblxuICAgIHZhciBub2RlID0gcmVzb2x2ZU5vZGUodmlldylcblxuICAgIGlmIChjb250YWluZXIgJiYgIXNraXBSZW5kZXIpIHtcbiAgICAgIHJvb3RFbGVtZW50ID0gcGF0Y2goY29udGFpbmVyLCByb290RWxlbWVudCwgb2xkTm9kZSwgKG9sZE5vZGUgPSBub2RlKSlcbiAgICB9XG5cbiAgICBpc1JlY3ljbGluZyA9IGZhbHNlXG5cbiAgICB3aGlsZSAobGlmZWN5Y2xlLmxlbmd0aCkgbGlmZWN5Y2xlLnBvcCgpKClcbiAgfVxuXG4gIGZ1bmN0aW9uIHNjaGVkdWxlUmVuZGVyKCkge1xuICAgIGlmICghc2tpcFJlbmRlcikge1xuICAgICAgc2tpcFJlbmRlciA9IHRydWVcbiAgICAgIHNldFRpbWVvdXQocmVuZGVyKVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsb25lKHRhcmdldCwgc291cmNlKSB7XG4gICAgdmFyIG91dCA9IHt9XG5cbiAgICBmb3IgKHZhciBpIGluIHRhcmdldCkgb3V0W2ldID0gdGFyZ2V0W2ldXG4gICAgZm9yICh2YXIgaSBpbiBzb3VyY2UpIG91dFtpXSA9IHNvdXJjZVtpXVxuXG4gICAgcmV0dXJuIG91dFxuICB9XG5cbiAgZnVuY3Rpb24gc2V0UGFydGlhbFN0YXRlKHBhdGgsIHZhbHVlLCBzb3VyY2UpIHtcbiAgICB2YXIgdGFyZ2V0ID0ge31cbiAgICBpZiAocGF0aC5sZW5ndGgpIHtcbiAgICAgIHRhcmdldFtwYXRoWzBdXSA9XG4gICAgICAgIHBhdGgubGVuZ3RoID4gMVxuICAgICAgICAgID8gc2V0UGFydGlhbFN0YXRlKHBhdGguc2xpY2UoMSksIHZhbHVlLCBzb3VyY2VbcGF0aFswXV0pXG4gICAgICAgICAgOiB2YWx1ZVxuICAgICAgcmV0dXJuIGNsb25lKHNvdXJjZSwgdGFyZ2V0KVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWVcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFBhcnRpYWxTdGF0ZShwYXRoLCBzb3VyY2UpIHtcbiAgICB2YXIgaSA9IDBcbiAgICB3aGlsZSAoaSA8IHBhdGgubGVuZ3RoKSB7XG4gICAgICBzb3VyY2UgPSBzb3VyY2VbcGF0aFtpKytdXVxuICAgIH1cbiAgICByZXR1cm4gc291cmNlXG4gIH1cblxuICBmdW5jdGlvbiB3aXJlU3RhdGVUb0FjdGlvbnMocGF0aCwgc3RhdGUsIGFjdGlvbnMpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gYWN0aW9ucykge1xuICAgICAgdHlwZW9mIGFjdGlvbnNba2V5XSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgID8gKGZ1bmN0aW9uKGtleSwgYWN0aW9uKSB7XG4gICAgICAgICAgICBhY3Rpb25zW2tleV0gPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgIHZhciByZXN1bHQgPSBhY3Rpb24oZGF0YSlcblxuICAgICAgICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0KGdldFBhcnRpYWxTdGF0ZShwYXRoLCBnbG9iYWxTdGF0ZSksIGFjdGlvbnMpXG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgcmVzdWx0ICYmXG4gICAgICAgICAgICAgICAgcmVzdWx0ICE9PSAoc3RhdGUgPSBnZXRQYXJ0aWFsU3RhdGUocGF0aCwgZ2xvYmFsU3RhdGUpKSAmJlxuICAgICAgICAgICAgICAgICFyZXN1bHQudGhlbiAvLyAhaXNQcm9taXNlXG4gICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHNjaGVkdWxlUmVuZGVyKFxuICAgICAgICAgICAgICAgICAgKGdsb2JhbFN0YXRlID0gc2V0UGFydGlhbFN0YXRlKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICAgICBjbG9uZShzdGF0ZSwgcmVzdWx0KSxcbiAgICAgICAgICAgICAgICAgICAgZ2xvYmFsU3RhdGVcbiAgICAgICAgICAgICAgICAgICkpXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pKGtleSwgYWN0aW9uc1trZXldKVxuICAgICAgICA6IHdpcmVTdGF0ZVRvQWN0aW9ucyhcbiAgICAgICAgICAgIHBhdGguY29uY2F0KGtleSksXG4gICAgICAgICAgICAoc3RhdGVba2V5XSA9IGNsb25lKHN0YXRlW2tleV0pKSxcbiAgICAgICAgICAgIChhY3Rpb25zW2tleV0gPSBjbG9uZShhY3Rpb25zW2tleV0pKVxuICAgICAgICAgIClcbiAgICB9XG5cbiAgICByZXR1cm4gYWN0aW9uc1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0S2V5KG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZSA/IG5vZGUua2V5IDogbnVsbFxuICB9XG5cbiAgZnVuY3Rpb24gZXZlbnRMaXN0ZW5lcihldmVudCkge1xuICAgIHJldHVybiBldmVudC5jdXJyZW50VGFyZ2V0LmV2ZW50c1tldmVudC50eXBlXShldmVudClcbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZUF0dHJpYnV0ZShlbGVtZW50LCBuYW1lLCB2YWx1ZSwgb2xkVmFsdWUsIGlzU3ZnKSB7XG4gICAgaWYgKG5hbWUgPT09IFwia2V5XCIpIHtcbiAgICB9IGVsc2UgaWYgKG5hbWUgPT09IFwic3R5bGVcIikge1xuICAgICAgZm9yICh2YXIgaSBpbiBjbG9uZShvbGRWYWx1ZSwgdmFsdWUpKSB7XG4gICAgICAgIHZhciBzdHlsZSA9IHZhbHVlID09IG51bGwgfHwgdmFsdWVbaV0gPT0gbnVsbCA/IFwiXCIgOiB2YWx1ZVtpXVxuICAgICAgICBpZiAoaVswXSA9PT0gXCItXCIpIHtcbiAgICAgICAgICBlbGVtZW50W25hbWVdLnNldFByb3BlcnR5KGksIHN0eWxlKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsZW1lbnRbbmFtZV1baV0gPSBzdHlsZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChuYW1lWzBdID09PSBcIm9cIiAmJiBuYW1lWzFdID09PSBcIm5cIikge1xuICAgICAgICBuYW1lID0gbmFtZS5zbGljZSgyKVxuXG4gICAgICAgIGlmIChlbGVtZW50LmV2ZW50cykge1xuICAgICAgICAgIGlmICghb2xkVmFsdWUpIG9sZFZhbHVlID0gZWxlbWVudC5ldmVudHNbbmFtZV1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbGVtZW50LmV2ZW50cyA9IHt9XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50LmV2ZW50c1tuYW1lXSA9IHZhbHVlXG5cbiAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgaWYgKCFvbGRWYWx1ZSkge1xuICAgICAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKG5hbWUsIGV2ZW50TGlzdGVuZXIpXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihuYW1lLCBldmVudExpc3RlbmVyKVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKG5hbWUgaW4gZWxlbWVudCAmJiBuYW1lICE9PSBcImxpc3RcIiAmJiAhaXNTdmcpIHtcbiAgICAgICAgZWxlbWVudFtuYW1lXSA9IHZhbHVlID09IG51bGwgPyBcIlwiIDogdmFsdWVcbiAgICAgIH0gZWxzZSBpZiAodmFsdWUgIT0gbnVsbCAmJiB2YWx1ZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpXG4gICAgICB9XG5cbiAgICAgIGlmICh2YWx1ZSA9PSBudWxsIHx8IHZhbHVlID09PSBmYWxzZSkge1xuICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShuYW1lKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnQobm9kZSwgaXNTdmcpIHtcbiAgICB2YXIgZWxlbWVudCA9XG4gICAgICB0eXBlb2Ygbm9kZSA9PT0gXCJzdHJpbmdcIiB8fCB0eXBlb2Ygbm9kZSA9PT0gXCJudW1iZXJcIlxuICAgICAgICA/IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKG5vZGUpXG4gICAgICAgIDogKGlzU3ZnID0gaXNTdmcgfHwgbm9kZS5ub2RlTmFtZSA9PT0gXCJzdmdcIilcbiAgICAgICAgICA/IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcbiAgICAgICAgICAgICAgXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLFxuICAgICAgICAgICAgICBub2RlLm5vZGVOYW1lXG4gICAgICAgICAgICApXG4gICAgICAgICAgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5vZGUubm9kZU5hbWUpXG5cbiAgICB2YXIgYXR0cmlidXRlcyA9IG5vZGUuYXR0cmlidXRlc1xuICAgIGlmIChhdHRyaWJ1dGVzKSB7XG4gICAgICBpZiAoYXR0cmlidXRlcy5vbmNyZWF0ZSkge1xuICAgICAgICBsaWZlY3ljbGUucHVzaChmdW5jdGlvbigpIHtcbiAgICAgICAgICBhdHRyaWJ1dGVzLm9uY3JlYXRlKGVsZW1lbnQpXG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKFxuICAgICAgICAgIGNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgICAobm9kZS5jaGlsZHJlbltpXSA9IHJlc29sdmVOb2RlKG5vZGUuY2hpbGRyZW5baV0pKSxcbiAgICAgICAgICAgIGlzU3ZnXG4gICAgICAgICAgKVxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIGZvciAodmFyIG5hbWUgaW4gYXR0cmlidXRlcykge1xuICAgICAgICB1cGRhdGVBdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSwgYXR0cmlidXRlc1tuYW1lXSwgbnVsbCwgaXNTdmcpXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGVsZW1lbnRcbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZUVsZW1lbnQoZWxlbWVudCwgb2xkQXR0cmlidXRlcywgYXR0cmlidXRlcywgaXNTdmcpIHtcbiAgICBmb3IgKHZhciBuYW1lIGluIGNsb25lKG9sZEF0dHJpYnV0ZXMsIGF0dHJpYnV0ZXMpKSB7XG4gICAgICBpZiAoXG4gICAgICAgIGF0dHJpYnV0ZXNbbmFtZV0gIT09XG4gICAgICAgIChuYW1lID09PSBcInZhbHVlXCIgfHwgbmFtZSA9PT0gXCJjaGVja2VkXCJcbiAgICAgICAgICA/IGVsZW1lbnRbbmFtZV1cbiAgICAgICAgICA6IG9sZEF0dHJpYnV0ZXNbbmFtZV0pXG4gICAgICApIHtcbiAgICAgICAgdXBkYXRlQXR0cmlidXRlKFxuICAgICAgICAgIGVsZW1lbnQsXG4gICAgICAgICAgbmFtZSxcbiAgICAgICAgICBhdHRyaWJ1dGVzW25hbWVdLFxuICAgICAgICAgIG9sZEF0dHJpYnV0ZXNbbmFtZV0sXG4gICAgICAgICAgaXNTdmdcbiAgICAgICAgKVxuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBjYiA9IGlzUmVjeWNsaW5nID8gYXR0cmlidXRlcy5vbmNyZWF0ZSA6IGF0dHJpYnV0ZXMub251cGRhdGVcbiAgICBpZiAoY2IpIHtcbiAgICAgIGxpZmVjeWNsZS5wdXNoKGZ1bmN0aW9uKCkge1xuICAgICAgICBjYihlbGVtZW50LCBvbGRBdHRyaWJ1dGVzKVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmVDaGlsZHJlbihlbGVtZW50LCBub2RlKSB7XG4gICAgdmFyIGF0dHJpYnV0ZXMgPSBub2RlLmF0dHJpYnV0ZXNcbiAgICBpZiAoYXR0cmlidXRlcykge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHJlbW92ZUNoaWxkcmVuKGVsZW1lbnQuY2hpbGROb2Rlc1tpXSwgbm9kZS5jaGlsZHJlbltpXSlcbiAgICAgIH1cblxuICAgICAgaWYgKGF0dHJpYnV0ZXMub25kZXN0cm95KSB7XG4gICAgICAgIGF0dHJpYnV0ZXMub25kZXN0cm95KGVsZW1lbnQpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBlbGVtZW50XG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmVFbGVtZW50KHBhcmVudCwgZWxlbWVudCwgbm9kZSkge1xuICAgIGZ1bmN0aW9uIGRvbmUoKSB7XG4gICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQocmVtb3ZlQ2hpbGRyZW4oZWxlbWVudCwgbm9kZSkpXG4gICAgfVxuXG4gICAgdmFyIGNiID0gbm9kZS5hdHRyaWJ1dGVzICYmIG5vZGUuYXR0cmlidXRlcy5vbnJlbW92ZVxuICAgIGlmIChjYikge1xuICAgICAgY2IoZWxlbWVudCwgZG9uZSlcbiAgICB9IGVsc2Uge1xuICAgICAgZG9uZSgpXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcGF0Y2gocGFyZW50LCBlbGVtZW50LCBvbGROb2RlLCBub2RlLCBpc1N2Zykge1xuICAgIGlmIChub2RlID09PSBvbGROb2RlKSB7XG4gICAgfSBlbHNlIGlmIChvbGROb2RlID09IG51bGwgfHwgb2xkTm9kZS5ub2RlTmFtZSAhPT0gbm9kZS5ub2RlTmFtZSkge1xuICAgICAgdmFyIG5ld0VsZW1lbnQgPSBjcmVhdGVFbGVtZW50KG5vZGUsIGlzU3ZnKVxuICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShuZXdFbGVtZW50LCBlbGVtZW50KVxuXG4gICAgICBpZiAob2xkTm9kZSAhPSBudWxsKSB7XG4gICAgICAgIHJlbW92ZUVsZW1lbnQocGFyZW50LCBlbGVtZW50LCBvbGROb2RlKVxuICAgICAgfVxuXG4gICAgICBlbGVtZW50ID0gbmV3RWxlbWVudFxuICAgIH0gZWxzZSBpZiAob2xkTm9kZS5ub2RlTmFtZSA9PSBudWxsKSB7XG4gICAgICBlbGVtZW50Lm5vZGVWYWx1ZSA9IG5vZGVcbiAgICB9IGVsc2Uge1xuICAgICAgdXBkYXRlRWxlbWVudChcbiAgICAgICAgZWxlbWVudCxcbiAgICAgICAgb2xkTm9kZS5hdHRyaWJ1dGVzLFxuICAgICAgICBub2RlLmF0dHJpYnV0ZXMsXG4gICAgICAgIChpc1N2ZyA9IGlzU3ZnIHx8IG5vZGUubm9kZU5hbWUgPT09IFwic3ZnXCIpXG4gICAgICApXG5cbiAgICAgIHZhciBvbGRLZXllZCA9IHt9XG4gICAgICB2YXIgbmV3S2V5ZWQgPSB7fVxuICAgICAgdmFyIG9sZEVsZW1lbnRzID0gW11cbiAgICAgIHZhciBvbGRDaGlsZHJlbiA9IG9sZE5vZGUuY2hpbGRyZW5cbiAgICAgIHZhciBjaGlsZHJlbiA9IG5vZGUuY2hpbGRyZW5cblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvbGRDaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBvbGRFbGVtZW50c1tpXSA9IGVsZW1lbnQuY2hpbGROb2Rlc1tpXVxuXG4gICAgICAgIHZhciBvbGRLZXkgPSBnZXRLZXkob2xkQ2hpbGRyZW5baV0pXG4gICAgICAgIGlmIChvbGRLZXkgIT0gbnVsbCkge1xuICAgICAgICAgIG9sZEtleWVkW29sZEtleV0gPSBbb2xkRWxlbWVudHNbaV0sIG9sZENoaWxkcmVuW2ldXVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBpID0gMFxuICAgICAgdmFyIGsgPSAwXG5cbiAgICAgIHdoaWxlIChrIDwgY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgIHZhciBvbGRLZXkgPSBnZXRLZXkob2xkQ2hpbGRyZW5baV0pXG4gICAgICAgIHZhciBuZXdLZXkgPSBnZXRLZXkoKGNoaWxkcmVuW2tdID0gcmVzb2x2ZU5vZGUoY2hpbGRyZW5ba10pKSlcblxuICAgICAgICBpZiAobmV3S2V5ZWRbb2xkS2V5XSkge1xuICAgICAgICAgIGkrK1xuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAobmV3S2V5ICE9IG51bGwgJiYgbmV3S2V5ID09PSBnZXRLZXkob2xkQ2hpbGRyZW5baSArIDFdKSkge1xuICAgICAgICAgIGlmIChvbGRLZXkgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmVtb3ZlRWxlbWVudChlbGVtZW50LCBvbGRFbGVtZW50c1tpXSwgb2xkQ2hpbGRyZW5baV0pXG4gICAgICAgICAgfVxuICAgICAgICAgIGkrK1xuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAobmV3S2V5ID09IG51bGwgfHwgaXNSZWN5Y2xpbmcpIHtcbiAgICAgICAgICBpZiAob2xkS2V5ID09IG51bGwpIHtcbiAgICAgICAgICAgIHBhdGNoKGVsZW1lbnQsIG9sZEVsZW1lbnRzW2ldLCBvbGRDaGlsZHJlbltpXSwgY2hpbGRyZW5ba10sIGlzU3ZnKVxuICAgICAgICAgICAgaysrXG4gICAgICAgICAgfVxuICAgICAgICAgIGkrK1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBrZXllZE5vZGUgPSBvbGRLZXllZFtuZXdLZXldIHx8IFtdXG5cbiAgICAgICAgICBpZiAob2xkS2V5ID09PSBuZXdLZXkpIHtcbiAgICAgICAgICAgIHBhdGNoKGVsZW1lbnQsIGtleWVkTm9kZVswXSwga2V5ZWROb2RlWzFdLCBjaGlsZHJlbltrXSwgaXNTdmcpXG4gICAgICAgICAgICBpKytcbiAgICAgICAgICB9IGVsc2UgaWYgKGtleWVkTm9kZVswXSkge1xuICAgICAgICAgICAgcGF0Y2goXG4gICAgICAgICAgICAgIGVsZW1lbnQsXG4gICAgICAgICAgICAgIGVsZW1lbnQuaW5zZXJ0QmVmb3JlKGtleWVkTm9kZVswXSwgb2xkRWxlbWVudHNbaV0pLFxuICAgICAgICAgICAgICBrZXllZE5vZGVbMV0sXG4gICAgICAgICAgICAgIGNoaWxkcmVuW2tdLFxuICAgICAgICAgICAgICBpc1N2Z1xuICAgICAgICAgICAgKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwYXRjaChlbGVtZW50LCBvbGRFbGVtZW50c1tpXSwgbnVsbCwgY2hpbGRyZW5ba10sIGlzU3ZnKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIG5ld0tleWVkW25ld0tleV0gPSBjaGlsZHJlbltrXVxuICAgICAgICAgIGsrK1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHdoaWxlIChpIDwgb2xkQ2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgIGlmIChnZXRLZXkob2xkQ2hpbGRyZW5baV0pID09IG51bGwpIHtcbiAgICAgICAgICByZW1vdmVFbGVtZW50KGVsZW1lbnQsIG9sZEVsZW1lbnRzW2ldLCBvbGRDaGlsZHJlbltpXSlcbiAgICAgICAgfVxuICAgICAgICBpKytcbiAgICAgIH1cblxuICAgICAgZm9yICh2YXIgaSBpbiBvbGRLZXllZCkge1xuICAgICAgICBpZiAoIW5ld0tleWVkW2ldKSB7XG4gICAgICAgICAgcmVtb3ZlRWxlbWVudChlbGVtZW50LCBvbGRLZXllZFtpXVswXSwgb2xkS2V5ZWRbaV1bMV0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGVsZW1lbnRcbiAgfVxufVxuIiwiaW1wb3J0IHsgaCB9IGZyb20gXCJoeXBlcmFwcFwiXG5cbmZ1bmN0aW9uIGdldE9yaWdpbihsb2MpIHtcbiAgcmV0dXJuIGxvYy5wcm90b2NvbCArIFwiLy9cIiArIGxvYy5ob3N0bmFtZSArIChsb2MucG9ydCA/IFwiOlwiICsgbG9jLnBvcnQgOiBcIlwiKVxufVxuXG5mdW5jdGlvbiBpc0V4dGVybmFsKGFuY2hvckVsZW1lbnQpIHtcbiAgLy8gTG9jYXRpb24ub3JpZ2luIGFuZCBIVE1MQW5jaG9yRWxlbWVudC5vcmlnaW4gYXJlIG5vdFxuICAvLyBzdXBwb3J0ZWQgYnkgSUUgYW5kIFNhZmFyaS5cbiAgcmV0dXJuIGdldE9yaWdpbihsb2NhdGlvbikgIT09IGdldE9yaWdpbihhbmNob3JFbGVtZW50KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gTGluayhwcm9wcywgY2hpbGRyZW4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHN0YXRlLCBhY3Rpb25zKSB7XG4gICAgdmFyIHRvID0gcHJvcHMudG9cbiAgICB2YXIgbG9jYXRpb24gPSBzdGF0ZS5sb2NhdGlvblxuICAgIHZhciBvbmNsaWNrID0gcHJvcHMub25jbGlja1xuICAgIGRlbGV0ZSBwcm9wcy50b1xuICAgIGRlbGV0ZSBwcm9wcy5sb2NhdGlvblxuXG4gICAgcHJvcHMuaHJlZiA9IHRvXG4gICAgcHJvcHMub25jbGljayA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmIChvbmNsaWNrKSB7XG4gICAgICAgIG9uY2xpY2soZSlcbiAgICAgIH1cbiAgICAgIGlmIChcbiAgICAgICAgZS5kZWZhdWx0UHJldmVudGVkIHx8XG4gICAgICAgIGUuYnV0dG9uICE9PSAwIHx8XG4gICAgICAgIGUuYWx0S2V5IHx8XG4gICAgICAgIGUubWV0YUtleSB8fFxuICAgICAgICBlLmN0cmxLZXkgfHxcbiAgICAgICAgZS5zaGlmdEtleSB8fFxuICAgICAgICBwcm9wcy50YXJnZXQgPT09IFwiX2JsYW5rXCIgfHxcbiAgICAgICAgaXNFeHRlcm5hbChlLmN1cnJlbnRUYXJnZXQpXG4gICAgICApIHtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgICAgIGlmICh0byAhPT0gbG9jYXRpb24ucGF0aG5hbWUpIHtcbiAgICAgICAgICBoaXN0b3J5LnB1c2hTdGF0ZShsb2NhdGlvbi5wYXRobmFtZSwgXCJcIiwgdG8pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaChcImFcIiwgcHJvcHMsIGNoaWxkcmVuKVxuICB9XG59XG4iLCJmdW5jdGlvbiBjcmVhdGVNYXRjaChpc0V4YWN0LCBwYXRoLCB1cmwsIHBhcmFtcykge1xuICByZXR1cm4ge1xuICAgIGlzRXhhY3Q6IGlzRXhhY3QsXG4gICAgcGF0aDogcGF0aCxcbiAgICB1cmw6IHVybCxcbiAgICBwYXJhbXM6IHBhcmFtc1xuICB9XG59XG5cbmZ1bmN0aW9uIHRyaW1UcmFpbGluZ1NsYXNoKHVybCkge1xuICBmb3IgKHZhciBsZW4gPSB1cmwubGVuZ3RoOyBcIi9cIiA9PT0gdXJsWy0tbGVuXTsgKTtcbiAgcmV0dXJuIHVybC5zbGljZSgwLCBsZW4gKyAxKVxufVxuXG5mdW5jdGlvbiBkZWNvZGVQYXJhbSh2YWwpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHZhbClcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiB2YWxcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VSb3V0ZShwYXRoLCB1cmwsIG9wdGlvbnMpIHtcbiAgaWYgKHBhdGggPT09IHVybCB8fCAhcGF0aCkge1xuICAgIHJldHVybiBjcmVhdGVNYXRjaChwYXRoID09PSB1cmwsIHBhdGgsIHVybClcbiAgfVxuXG4gIHZhciBleGFjdCA9IG9wdGlvbnMgJiYgb3B0aW9ucy5leGFjdFxuICB2YXIgcGF0aHMgPSB0cmltVHJhaWxpbmdTbGFzaChwYXRoKS5zcGxpdChcIi9cIilcbiAgdmFyIHVybHMgPSB0cmltVHJhaWxpbmdTbGFzaCh1cmwpLnNwbGl0KFwiL1wiKVxuXG4gIGlmIChwYXRocy5sZW5ndGggPiB1cmxzLmxlbmd0aCB8fCAoZXhhY3QgJiYgcGF0aHMubGVuZ3RoIDwgdXJscy5sZW5ndGgpKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICBmb3IgKHZhciBpID0gMCwgcGFyYW1zID0ge30sIGxlbiA9IHBhdGhzLmxlbmd0aCwgdXJsID0gXCJcIjsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKFwiOlwiID09PSBwYXRoc1tpXVswXSkge1xuICAgICAgcGFyYW1zW3BhdGhzW2ldLnNsaWNlKDEpXSA9IHVybHNbaV0gPSBkZWNvZGVQYXJhbSh1cmxzW2ldKVxuICAgIH0gZWxzZSBpZiAocGF0aHNbaV0gIT09IHVybHNbaV0pIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB1cmwgKz0gdXJsc1tpXSArIFwiL1wiXG4gIH1cblxuICByZXR1cm4gY3JlYXRlTWF0Y2goZmFsc2UsIHBhdGgsIHVybC5zbGljZSgwLCAtMSksIHBhcmFtcylcbn1cbiIsImltcG9ydCB7IHBhcnNlUm91dGUgfSBmcm9tIFwiLi9wYXJzZVJvdXRlXCJcblxuZXhwb3J0IGZ1bmN0aW9uIFJvdXRlKHByb3BzKSB7XG4gIHJldHVybiBmdW5jdGlvbihzdGF0ZSwgYWN0aW9ucykge1xuICAgIHZhciBsb2NhdGlvbiA9IHN0YXRlLmxvY2F0aW9uXG4gICAgdmFyIG1hdGNoID0gcGFyc2VSb3V0ZShwcm9wcy5wYXRoLCBsb2NhdGlvbi5wYXRobmFtZSwge1xuICAgICAgZXhhY3Q6ICFwcm9wcy5wYXJlbnRcbiAgICB9KVxuXG4gICAgcmV0dXJuIChcbiAgICAgIG1hdGNoICYmXG4gICAgICBwcm9wcy5yZW5kZXIoe1xuICAgICAgICBtYXRjaDogbWF0Y2gsXG4gICAgICAgIGxvY2F0aW9uOiBsb2NhdGlvblxuICAgICAgfSlcbiAgICApXG4gIH1cbn1cbiIsImZ1bmN0aW9uIHdyYXBIaXN0b3J5KGtleXMpIHtcbiAgcmV0dXJuIGtleXMucmVkdWNlKGZ1bmN0aW9uKG5leHQsIGtleSkge1xuICAgIHZhciBmbiA9IGhpc3Rvcnlba2V5XVxuXG4gICAgaGlzdG9yeVtrZXldID0gZnVuY3Rpb24oZGF0YSwgdGl0bGUsIHVybCkge1xuICAgICAgZm4uY2FsbCh0aGlzLCBkYXRhLCB0aXRsZSwgdXJsKVxuICAgICAgZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJwdXNoc3RhdGVcIiwgeyBkZXRhaWw6IGRhdGEgfSkpXG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgaGlzdG9yeVtrZXldID0gZm5cbiAgICAgIG5leHQgJiYgbmV4dCgpXG4gICAgfVxuICB9LCBudWxsKVxufVxuXG5leHBvcnQgdmFyIGxvY2F0aW9uID0ge1xuICBzdGF0ZToge1xuICAgIHBhdGhuYW1lOiB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUsXG4gICAgcHJldmlvdXM6IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZVxuICB9LFxuICBhY3Rpb25zOiB7XG4gICAgZ286IGZ1bmN0aW9uKHBhdGhuYW1lKSB7XG4gICAgICBoaXN0b3J5LnB1c2hTdGF0ZShudWxsLCBcIlwiLCBwYXRobmFtZSlcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuIGRhdGFcbiAgICB9XG4gIH0sXG4gIHN1YnNjcmliZTogZnVuY3Rpb24oYWN0aW9ucykge1xuICAgIGZ1bmN0aW9uIGhhbmRsZUxvY2F0aW9uQ2hhbmdlKGUpIHtcbiAgICAgIGFjdGlvbnMuc2V0KHtcbiAgICAgICAgcGF0aG5hbWU6IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSxcbiAgICAgICAgcHJldmlvdXM6IGUuZGV0YWlsXG4gICAgICAgICAgPyAod2luZG93LmxvY2F0aW9uLnByZXZpb3VzID0gZS5kZXRhaWwpXG4gICAgICAgICAgOiB3aW5kb3cubG9jYXRpb24ucHJldmlvdXNcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgdmFyIHVud3JhcCA9IHdyYXBIaXN0b3J5KFtcInB1c2hTdGF0ZVwiLCBcInJlcGxhY2VTdGF0ZVwiXSlcblxuICAgIGFkZEV2ZW50TGlzdGVuZXIoXCJwdXNoc3RhdGVcIiwgaGFuZGxlTG9jYXRpb25DaGFuZ2UpXG4gICAgYWRkRXZlbnRMaXN0ZW5lcihcInBvcHN0YXRlXCIsIGhhbmRsZUxvY2F0aW9uQ2hhbmdlKVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcihcInB1c2hzdGF0ZVwiLCBoYW5kbGVMb2NhdGlvbkNoYW5nZSlcbiAgICAgIHJlbW92ZUV2ZW50TGlzdGVuZXIoXCJwb3BzdGF0ZVwiLCBoYW5kbGVMb2NhdGlvbkNoYW5nZSlcbiAgICAgIHVud3JhcCgpXG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBoIH0gZnJvbSAnaHlwZXJhcHAnXG5pbXBvcnQgeyBMaW5rIH0gZnJvbSAnQGh5cGVyYXBwL3JvdXRlcidcbmltcG9ydCAnLi9pbmRleC5jc3MnXG5cbmNvbnN0IGNvbXBvbmVudCA9ICh7IGhlYWRlciwgdXNlcm5hbWUgPSAnam9obiBkb2UnLCBwcm9maWxlSW1nIH0pID0+IChcbiAgPGhlYWRlciBjbGFzcz0naGVhZGVyJz5cbiAgICA8ZGl2IGNsYXNzPSdoZWFkZXItY29sdW1uJz5cbiAgICAgIDxMaW5rIGNsYXNzPSdoZWFkZXItYnJhbmQnIHRvPScvJz57aGVhZGVyfTwvTGluaz5cbiAgICAgIDxkaXYgY2xhc3M9J2hlYWRlci1waG90by1ob2xkZXInPlxuICAgICAgICA8ZGl2IGNsYXNzPSdoZWFkZXItcGhvdG8nIHN0eWxlPXt7XG4gICAgICAgICAgYmFja2dyb3VuZDogYHVybCgke3Byb2ZpbGVJbWd9KSBuby1yZXBlYXQgY2VudGVyIGNlbnRlciAvIGNvdmVyYFxuICAgICAgICB9fS8+XG4gICAgICAgIDxkaXYgY2xhc3M9J2hlYWRlci11c2VybmFtZSc+XG4gICAgICAgICAgPGg2Pnt1c2VybmFtZX08L2g2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICA8L2hlYWRlcj5cbilcblxuZXhwb3J0IGRlZmF1bHQgY29tcG9uZW50XG4iLCJpbXBvcnQgeyBoIH0gZnJvbSAnaHlwZXJhcHAnXG5pbXBvcnQgeyBMaW5rIH0gZnJvbSAnQGh5cGVyYXBwL3JvdXRlcidcbmltcG9ydCAnLi9pbmRleC5jc3MnXG5cbmNvbnN0IGNvbXBvbmVudCA9ICh7IGxpbmtzLCByb3V0ZSB9KSA9PiAoXG4gIDxuYXZiYXIgY2xhc3M9J25hdmJhcic+XG4gICAge1xuICAgICAgbGlua3MubWFwKGxpbmsgPT4gKFxuICAgICAgICA8TGluayBjbGFzcz17XG4gICAgICAgICAgYG5hdmJhci1saW5rICR7bGluay50byA9PT0gcm91dGUgJiYgJ2lzLXNlbGVjdGVkJ31gXG4gICAgICAgIH0gdG89e2xpbmsudG99PntsaW5rLmxhYmVsfTwvTGluaz5cbiAgICAgICkpXG4gICAgfVxuICA8L25hdmJhcj5cbilcblxuZXhwb3J0IGRlZmF1bHQgY29tcG9uZW50XG4iLCJpbXBvcnQgeyBoIH0gZnJvbSAnaHlwZXJhcHAnXG5cbmltcG9ydCAnLi9pbmRleC5jc3MnXG5cbmNvbnN0IGNvbXBvbmVudCA9ICh7IGZvb3RlciA9ICdDb3B5cmlnaHQgwqkgMjAxOCB5b3VyYXBwJyB9KSA9PiAoXG4gIDxmb290ZXIgY2xhc3M9J2Zvb3Rlcic+e2Zvb3Rlcn08L2Zvb3Rlcj5cbilcblxuZXhwb3J0IGRlZmF1bHQgY29tcG9uZW50XG4iLCJpbXBvcnQgeyBoIH0gZnJvbSAnaHlwZXJhcHAnXG5pbXBvcnQgJy4vaW5kZXguY3NzJ1xuXG5jb25zdCBjb21wb25lbnQgPSAoeyByb3cgPSAxIH0pID0+IChcbiAgPGRpdiBzdHlsZT17e1xuICAgIGhlaWdodDogYCR7cm93ICogMS4yNX1yZW1gLFxuICAgIGRpc3BsYXk6ICdibG9jaycsXG4gICAgd2lkdGg6ICcxMDAlJ1xuICB9fSAvPlxuKVxuXG5leHBvcnQgZGVmYXVsdCBjb21wb25lbnRcbiIsImltcG9ydCB7IGggfSBmcm9tICdoeXBlcmFwcCdcbmltcG9ydCBCciBmcm9tICcuLi8uLi9hdG9tcy9CcmVhaydcbmltcG9ydCAnLi9pbmRleC5jc3MnXG5cbmNvbnN0IHBhZ2UgPSAoc3RhdGUsIGFjdGlvbnMpID0+IHByb3BzID0+IChcbiAgPGRpdiBjbGFzcz0nYm9keSc+XG4gICAgPGRpdiBjbGFzcz0nYm9keS1jb2x1bW4nPlxuICAgICAgPGgxPkJvb2tzIEkgcmVhZDwvaDE+XG4gICAgICA8QnIgLz5cbiAgICAgIDxkaXYgY2xhc3M9J3F1b3RlJz5cbiAgICAgICAgeW91IGNhbid0IGJ1eSBoYXBwaW5lc3MgYnV0IHlvdSBjYW4gYnV5IGJvb2tzIC4uLiBhbmQgdGhhdCdzIGtpbmQgb2YgdGhlIHNhbWUgdGhpbmdcbiAgICAgIDwvZGl2PlxuICAgICAgPEJyIC8+XG5cbiAgICAgIDxkaXYgY2xhc3M9J2Jvb2staG9sZGVyJz5cbiAgICAgICAge1xuICAgICAgICBzdGF0ZS5ib29rcy5tYXAoYm9vayA9PiAoXG4gICAgICAgICAgPGRpdiBjbGFzcz0nYm9vayc+e2Jvb2sudGl0bGV9IC0gPGk+e2Jvb2suYXV0aG9yfTwvaT48L2Rpdj5cbiAgICAgICAgKSlcbiAgICAgIH1cbiAgICAgIDwvZGl2PlxuICAgICAgPEJyIHJvdz17M30gLz5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG4pXG5cbmV4cG9ydCBkZWZhdWx0IHBhZ2VcbiIsIi8vIEEgdXRpbGl0eSB0byBtaW1pYyBzbGVlcFxuXG4gYXN5bmMgZnVuY3Rpb24gcGF1c2UgKGR1cmF0aW9uID0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogMTUgKyAyNSkpIHtcbiAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgIHdpbmRvdy5zZXRUaW1lb3V0KHJlc29sdmUsIGR1cmF0aW9uKVxuICAgfSlcbiB9XG5cbiBleHBvcnQgZGVmYXVsdCBwYXVzZVxuIiwiaW1wb3J0IHBhdXNlIGZyb20gJy4vcGF1c2UnXG5cbmFzeW5jIGZ1bmN0aW9uIHR5cGUgKG1heCwgY291bnRlciA9IDAsIGNhbGxiYWNrKSB7XG4gIGlmIChjb3VudGVyIDwgbWF4KSB7XG4gICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soY291bnRlcilcbiAgICBhd2FpdCBwYXVzZSgpXG4gICAgcmV0dXJuIHR5cGUobWF4LCBjb3VudGVyICsgMSwgY2FsbGJhY2spXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgdHlwZVxuIiwiaW1wb3J0IHsgaCB9IGZyb20gJ2h5cGVyYXBwJ1xuaW1wb3J0ICcuL2luZGV4LmNzcydcblxuLy8gVXRpbHNcbmltcG9ydCB0eXBlIGZyb20gJy4uLy4uLy4uL3V0aWxzL3R5cGUnXG5pbXBvcnQgcGF1c2UgZnJvbSAnLi4vLi4vLi4vdXRpbHMvcGF1c2UnXG5cbmNvbnN0IHBhZ2UgPSAoc3RhdGUsIGFjdGlvbnMpID0+IHByb3BzID0+IHtcbiAgaWYgKCFzdGF0ZS5oZWFkaW5nLmxlbmd0aCAmJiAhc3RhdGUuc3ViaGVhZGluZy5sZW5ndGgpIHtcbiAgICBzdGFydFR5cGluZyhcbiAgICAgIGFjdGlvbnMsXG4gICAgICBzdGF0ZS5oZWFkaW5nR2hvc3Quc3BsaXQoJycpLFxuICAgICAgc3RhdGUuc3ViaGVhZGluZ0dob3N0LnNwbGl0KCcnKVxuICAgIClcbiAgfVxuXG4gIHJldHVybiA8ZGl2IGNsYXNzPSdib2R5Jz5cbiAgICA8ZGl2IGNsYXNzPSdib2R5LWNvbHVtbic+XG4gICAgICA8aDE+XG4gICAgICAgIHtzdGF0ZS5oZWFkaW5nfVxuICAgICAgICB7c3RhdGUuaGVhZGluZy5sZW5ndGggIT09IHN0YXRlLmhlYWRpbmdHaG9zdC5sZW5ndGggJiYgPHNwYW4gY2xhc3M9J2NhcmV0JyAvPiB9XG4gICAgICA8L2gxPlxuICAgICAgPGgxPlxuICAgICAgICB7c3RhdGUuc3ViaGVhZGluZ31cbiAgICAgICAge3N0YXRlLnN1YmhlYWRpbmcubGVuZ3RoICE9PSAwICYmIDxzcGFuIGNsYXNzPSdjYXJldCBpcy1hY3RpdmUnIC8+fVxuICAgICAgPC9oMT5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG59XG5cbi8vIFRoaXMgZnVuY3Rpb25hbGl0eSB3aWxsIGJlIGludm9rZWQgb25seSBvbmNlXG5hc3luYyBmdW5jdGlvbiBzdGFydFR5cGluZyAoYWN0aW9ucywgaGVhZGluZywgc3ViaGVhZGluZykge1xuICBhd2FpdCB0eXBlKGhlYWRpbmcubGVuZ3RoLCAwLCBjb3VudGVyID0+IGFjdGlvbnMudXBkYXRlSGVhZGluZyhoZWFkaW5nW2NvdW50ZXJdKSlcbiAgYXdhaXQgcGF1c2UoMjUwKVxuICBhd2FpdCB0eXBlKHN1YmhlYWRpbmcubGVuZ3RoLCAwLCBjb3VudGVyID0+IGFjdGlvbnMudXBkYXRlU3ViaGVhZGluZyhzdWJoZWFkaW5nW2NvdW50ZXJdKSlcbn1cblxuZXhwb3J0IGRlZmF1bHQgcGFnZVxuIiwiaW1wb3J0IHsgaCB9IGZyb20gJ2h5cGVyYXBwJ1xuaW1wb3J0ICcuL2luZGV4LmNzcydcblxuY29uc3QgcGFnZSA9ICgpID0+IChcbiAgPGRpdiBjbGFzcz0nYm9keSc+XG4gICAgPGRpdiBjbGFzcz0nYm9keS1jb2x1bW4nPkFib3V0IFBhZ2U8L2Rpdj5cbiAgPC9kaXY+XG4pXG5cbmV4cG9ydCBkZWZhdWx0IHBhZ2VcbiIsImltcG9ydCB7IGggfSBmcm9tICdoeXBlcmFwcCdcbmltcG9ydCAnLi9pbmRleC5jc3MnXG5cbmNvbnN0IHBhZ2UgPSAoc3RhdGUsIGFjdGlvbnMpID0+IHByb3BzID0+IChcbiAgPGRpdiBjbGFzcz0nYm9keSc+XG4gICAgPGRpdiBjbGFzcz0nYm9keS1jb2x1bW4nPlxuICAgICAgPGJyIC8+XG4gICAgICA8YnIgLz5cbiAgICAgIDxiciAvPlxuICAgICAgPGRpdiBjbGFzcz0ncGhvdG8taG9sZGVyJz5cbiAgICAgICAgPGRpdiBjbGFzcz0ncGhvdG8tZ3JpZCBwaG90by0xMDAnPlxuICAgICAgICAgIDxkaXYgY2xhc3M9J3Bob3RvLWNhcHRpb24nPkNocmlzdG1hcyBNYXJrZXQgMjAxNTwvZGl2PlxuICAgICAgICAgIDxpbWcgY2xhc3M9J3Bob3RvLXNyYycgc3JjPScuL2Fzc2V0cy9pbWcvcGhvdG9ncmFwaHkvMDEtY2hyaXN0bWFzX21hcmtldC9EU0NGMjA1Ml9zbWFsbC5qcGcnIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3M9J3Bob3RvLWdyaWQgcGhvdG8tMjAwJz5cbiAgICAgICAgICA8ZGl2IGNsYXNzPSdwaG90by1jYXB0aW9uJz5LdWFsYSBMdW1wdXI8L2Rpdj5cbiAgICAgICAgICA8aW1nIGNsYXNzPSdwaG90by1zcmMnIHNyYz0nLi9hc3NldHMvaW1nL3Bob3RvZ3JhcGh5LzAyLW1hbGF5c2lhL0RTQ0YyMzM2X3NtYWxsLmpwZycgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzcz0ncGhvdG8tZ3JpZCBwaG90by0zMDAnPlxuICAgICAgICAgIDxkaXYgY2xhc3M9J3Bob3RvLWNhcHRpb24nPkRhbmJvYXJkPC9kaXY+XG4gICAgICAgICAgPGltZyBjbGFzcz0ncGhvdG8tc3JjJyBzcmM9Jy4vYXNzZXRzL2ltZy9waG90b2dyYXBoeS8wNi1kYW5ib2FyZC9JTUdfNDczNV9lZGl0ZWRfc21hbGwuanBnJyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzPSdwaG90by1ncmlkIHBob3RvLTQwMCc+XG4gICAgICAgICAgPGRpdiBjbGFzcz0ncGhvdG8tY2FwdGlvbic+UHJlaXNlciBGaWd1cmU8L2Rpdj5cbiAgICAgICAgICA8aW1nIGNsYXNzPSdwaG90by1zcmMnIHNyYz0nLi9hc3NldHMvaW1nL3Bob3RvZ3JhcGh5LzA3LXByZWlzZXJfZmlndXJlLzA2X3NtYWxsLmpwZycgLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxiciAvPlxuICAgICAgPGJyIC8+XG4gICAgICA8YnIgLz5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG4pXG5cbmV4cG9ydCBkZWZhdWx0IHBhZ2VcbiIsImltcG9ydCB7IGggfSBmcm9tICdoeXBlcmFwcCdcbmltcG9ydCBCciBmcm9tICcuLi8uLi9hdG9tcy9CcmVhaydcbmltcG9ydCAnLi9pbmRleC5jc3MnXG5cbmNvbnN0IHBhZ2UgPSAoc3RhdGUsIGFjdGlvbnMpID0+IHByb3BzID0+IChcbiAgPGRpdiBjbGFzcz0nYm9keSc+XG4gICAgPGRpdiBjbGFzcz0nYm9keS1jb2x1bW4nPlxuICAgICAgPGgxPlNvbmdzIEkgcGxheTwvaDE+XG5cbiAgICAgIDxwPlxuICAgICAgICBJIGRvbid0IHBsYXkgZ3VpdGFyIGFzIG11Y2ggYXMgSSBkbyBhbnltb3JlLiBUaGVzZSBhcmUgc29tZSBvZiB0aGUgZmluZ2Vyc3R5bGUgZ3VpdGFyIHNvbG9zIHRoYXQgSSByZWNvcmRlZCB1c2luZyA8aT5ab29tIEgxPC9pPi4gRW5qb3khXG4gICAgICA8L3A+XG5cbiAgICAgIDxCciAvPlxuICAgICAgPGRpdiBjbGFzcz0ncXVvdGUnPlxuICAgICAgICBJIGp1c3Qgd2FudCB0byBiZSBhIGd1eSB3aXRoIGEgZ3VpdGFyIC0gPGk+PHNtYWxsPkplZmYgQnVja2xleTwvc21hbGw+PC9pPlxuICAgICAgPC9kaXY+XG4gICAgICA8QnIgLz5cbiAgICAgIDxCciAvPlxuICAgICAgPGRpdiBjbGFzcz0nZ3VpdGFyLWhvbGRlcic+XG4gICAgICAgIHtcbiAgICAgICAgc3RhdGUuc29uZ3MubWFwKHNvbmcgPT4gKFxuICAgICAgICAgIDxkaXYgY2xhc3M9J2d1aXRhcic+XG4gICAgICAgICAgICA8aWZyYW1lIHdpZHRoPScxMDAlJyBoZWlnaHQ9JzE2Nicgc2Nyb2xsaW5nPSdubycgZnJhbWVib3JkZXI9J25vJyBhbGxvdz0nYXV0b3BsYXknIHNyYz17c29uZ30gLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSlcbiAgICAgIH1cbiAgICAgIDwvZGl2PlxuICAgICAgPEJyIHJvdz17M30gLz5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG4pXG5cbmV4cG9ydCBkZWZhdWx0IHBhZ2VcbiIsImltcG9ydCB7IGggfSBmcm9tICdoeXBlcmFwcCdcblxuaW1wb3J0IEJyIGZyb20gJy4uLy4uL2F0b21zL0JyZWFrJ1xuaW1wb3J0ICcuL2luZGV4LmNzcydcblxuY29uc3QgcGFnZSA9IChzdGF0ZSwgYWN0aW9ucykgPT4gcHJvcHMgPT4gKFxuICA8ZGl2IGNsYXNzPSdib2R5Jz5cbiAgICA8ZGl2IGNsYXNzPSdib2R5LWNvbHVtbic+XG4gICAgICA8aDE+Q29udGFjdCBNZTwvaDE+XG4gICAgICA8cD5JIGFtIGEgRGV2ZWxvcGVyIGJhc2VkIGluIE1hbGF5c2lhLiBJIGRvIEZyb250ZW5kLCBCYWNrZW5kIGFuZCBEZXZPcHMgcmVsYXRlZCBzdHVmZi4gVG8gdW5kZXJzdGFuZCBtb3JlIGFib3V0IHdoYXQgSSBhbSBkb2luZyBhdCBwcmVzZW50LCBmb2xsb3cgbWUgb24gR2l0aHViLjwvcD5cbiAgICAgIDxwPlBsZWFzZSBlbWFpbCBtZSB0byByZXF1ZXN0IGZvciBteSByZXN1bWUuPC9wPlxuICAgICAgPEJyIC8+XG5cbiAgICAgIDxkaXY+PGI+RW1haWw6PC9iPiA8YSBocmVmPSdtYWlsdG86YWxleHRhbjIyMDk5MEBnbWFpbC5jb20nPmFsZXh0YW4yMjA5OTBAZ21haWwuY29tPC9hPjwvZGl2PlxuICAgICAgPEJyIC8+XG4gICAgICA8ZGl2PjxiPkJlaGFuY2U6PC9iPiA8YSBocmVmPSdodHRwczovL3d3dy5iZWhhbmNlLm5ldC9hbGV4dGFuMjIwZTNhZScgdGFyZ2V0PSdfYmxhbmsnPmh0dHBzOi8vd3d3LmJlaGFuY2UubmV0L2FsZXh0YW4yMjBlM2FlPC9hPjwvZGl2PlxuICAgICAgPEJyIC8+XG4gICAgICA8ZGl2PjxiPkdpdGh1Yjo8L2I+IDxhIGhyZWY9J2h0dHBzOi8vZ2l0aHViLmNvbS9hbGV4dGFuaG9uZ3BpbicgdGFyZ2V0PSdfYmxhbmsnPmh0dHBzOi8vZ2l0aHViLmNvbS9hbGV4dGFuaG9uZ3BpbjwvYT48L2Rpdj5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG4pXG5cbmV4cG9ydCBkZWZhdWx0IHBhZ2VcbiIsImV4cG9ydCBkZWZhdWx0IHtcbiAgc3RhdGU6IHtcbiAgICBoZWFkaW5nOiAnJyxcbiAgICBoZWFkaW5nR2hvc3Q6ICdIaSwgSSBhbSBBbGV4LicsXG4gICAgc3ViaGVhZGluZzogJycsXG4gICAgc3ViaGVhZGluZ0dob3N0OiAnVGhpcyBpcyBteSBqb3VybmV5IGFzIGEgRGV2ZWxvcGVyLidcbiAgfSxcbiAgYWN0aW9uczoge1xuICAgIHVwZGF0ZUhlYWRpbmc6IHZhbHVlID0+IHN0YXRlID0+ICh7XG4gICAgICBoZWFkaW5nOiBzdGF0ZS5oZWFkaW5nICsgdmFsdWVcbiAgICB9KSxcbiAgICB1cGRhdGVTdWJoZWFkaW5nOiB2YWx1ZSA9PiBzdGF0ZSA9PiAoe1xuICAgICAgc3ViaGVhZGluZzogc3RhdGUuc3ViaGVhZGluZyArIHZhbHVlXG4gICAgfSksXG4gICAgcmVzZXRIZWFkaW5nOiB2YWx1ZSA9PiBzdGF0ZSA9PiAoe1xuICAgICAgaGVhZGluZzogJydcbiAgICB9KSxcbiAgICByZXNldFN1YmhlYWRpbmc6IHZhbHVlID0+IHN0YXRlID0+ICh7XG4gICAgICBzdWJoZWFkaW5nOiAnJ1xuICAgIH0pXG4gIH1cbn1cbiIsImV4cG9ydCBkZWZhdWx0IHtcbiAgc3RhdGU6IHtcbiAgICBib29rczogW1xuICAgICAgeyB0aXRsZTogJ0Vtb3Rpb25hbCBJbnRlbGxpZ2VuY2UnLCBhdXRob3I6ICdEYW5pZWwgR29sZW1hbicgfSxcbiAgICAgIHsgdGl0bGU6ICdUaGUgR2lmdCBvZiBGZWFyJywgYXV0aG9yOiAnR2F2aW4gZGUgQmVja2VyJyB9LFxuICAgICAgeyB0aXRsZTogJ0luZmx1ZW5jZTogVGhlIFBzeWNob2xvZ3kgb2YgUGVyc3Vhc2lvbicsIGF1dGhvcjogJ1JvYmVydCBCLiBDaWFsZGluaScgfSxcbiAgICAgIHsgdGl0bGU6ICdUaGUgNDggTGF3cyBvZiBQb3dlcnMnLCBhdXRob3I6ICdSb2JlcnQgR3JlZW5lJyB9LFxuICAgICAgeyB0aXRsZTogJ1RoZSBBcnQgb2YgU2VkdWN0aW9uJywgYXV0aG9yOiAnUm9iZXJ0IEdyZWVuZScgfSxcbiAgICAgIHsgdGl0bGU6ICdNYXN0ZXJ5JywgYXV0aG9yOiAnUm9iZXJ0IEdyZWVuZScgfSxcbiAgICAgIHsgdGl0bGU6ICdUaGUgVGlwcGluZyBQb2ludDogSG93IExpdHRsZSBUaGluZ3MgY2FuIE1ha2UgYSBCaWcgRGlmZmVyZW5jZScsIGF1dGhvcjogJ01hbGNvbG0gVC4gR2xhZHdlbGwnIH0sXG4gICAgICB7IHRpdGxlOiAnQmxpbms6IFRoZSBQb3dlciBvZiBUaGlua2luZyBXaXRob3V0IFRoaW5raW5nJywgYXV0aG9yOiAnTWFsY29sbSBULiBHbGFkd2VsbCcgfSxcbiAgICAgIHsgdGl0bGU6ICdPdXRsaWVyczogVGhlIFN0b3J5IG9mIFN1Y2Nlc3MnLCBhdXRob3I6ICdNYWxjb2xtIFQuIEdsYWR3ZWxsJyB9LFxuICAgICAgeyB0aXRsZTogJ1doYXQgdGhlIERvZyBTYXc6IEFuZCBvdGhlciBBZHZlbnR1cmVzJywgYXV0aG9yOiAnTWFsY29sbSBULiBHbGFkd2VsbCcgfSxcbiAgICAgIHsgdGl0bGU6ICdEYXZpZCBhbmQgR29saWF0aDogVW5kZXJkb2dzLCBNaXNmaXRzLCBhbmQgdGhlIEFydCBvZiBCYXR0bGluZyBHaWFudHMnLCBhdXRob3I6ICdNYWxjb2xtIFQuIEdsYWR3ZWxsJyB9LFxuICAgICAgeyB0aXRsZTogJ0xhdGVyYWwgVGhpbmtpbmcnLCBhdXRob3I6ICdFZHdhcmQgZGUgQm9ubycgfSxcbiAgICAgIHsgdGl0bGU6ICdTaW1wbGljaXR5JywgYXV0aG9yOiAnRWR3YXJkIGRlIEJvbm8nIH0sXG4gICAgICB7IHRpdGxlOiAnU2l4IFRoaW5raW5nIEhhdHMnLCBhdXRob3I6ICdFZHdhcmQgZGUgQm9ubycgfSxcbiAgICAgIHsgdGl0bGU6ICdQbzogQmV5b25kIFllcyBhbmQgTm8nLCBhdXRob3I6ICdFZHdhcmQgZGUgQm9ubycgfSxcbiAgICAgIHsgdGl0bGU6ICdFbW90aW9uYWwgQmxhY2ttYWlsOiBXaGVuIHRoZSBQZW9wbGUgaW4gWW91ciBMaWZlIFVzZSBGZWFyLCBPYmxpZ2F0aW9uLCBhbmQgR3VpbHQgdG8gTWFuaXB1bGF0ZSBZb3UnLCBhdXRob3I6ICdTdXNhbiBGb3J3YXJkJyB9LFxuICAgICAgeyB0aXRsZTogJ0dhbWVzIFBlb3BsZSBQbGF5OiBUaGUgUHN5Y2hvbG9neSBvZiBIdW1hbiBSZWxhdGlvbnNoaXBzJywgYXV0aG9yOiAnRXJpYyBCZXJuZScgfSxcbiAgICAgIHsgdGl0bGU6ICc1MCBQc3ljaG9sb2d5IENsYXNzaWNzOiBXaG8gV2UgQXJlLCBIb3cgV2UgVGhpbmssIFdoYXQgV2UgRG86IEluc2lnaHQgYW5kIEluc3BpcmF0aW9uIGZyb20gNTAgS2V5IEJvb2tzJywgYXV0aG9yOiAnVG9tIEJ1dGxlciBCb3dkb3duJyB9LFxuICAgICAgeyB0aXRsZTogJ1RoZSBQc3ljaG9sb2d5IG9mIFNlbGYgRXN0ZWVtJywgYXV0aG9yOiAnTmF0aGFuaWVsIEJyYW5kZW4nIH0sXG4gICAgICB7IHRpdGxlOiAnQ3JlYXRpdml0eTogRmxvdyBhbmQgdGhlIFBzeWNob2xvZ3kgb2YgRGlzY292ZXJ5IGFuZCBJbnZlbnRpb25zJywgYXV0aG9yOiAnTWloYWx5IENzaWt6ZW50bWloYWx5aScgfSxcbiAgICAgIHsgdGl0bGU6ICdNeSBWb2ljZSBXaWxsIEdvIFdpdGggWW91JywgYXV0aG9yOiAnTWlsdG9uIEVyaWtzb24nIH0sXG4gICAgICB7IHRpdGxlOiAnSG93IFRlY2hub2xvZ3kgaXMgQ2hhbmdpbmcgb3VyIE1pbmRzIGZvciB0aGUgQmV0dGVyLicsIGF1dGhvcjogJ0NsaXZlIFRob21wc29uJyB9XG4gICAgXVxuICB9XG59XG4iLCJcbmV4cG9ydCBkZWZhdWx0IHtcbiAgc3RhdGU6IHtcbiAgICBwaG90b3M6IHtcbiAgICAgICdjaHJpc3RtYXMtbWFya2V0Jzoge1xuICAgICAgICBmb2xkZXJQYXRoOiAnMDEtY2hyaXN0bWFzX21hcmtldC9EU0NGMicsXG4gICAgICAgIGltYWdlczogW1xuICAgICAgICAgIHsgbmFtZTogJzA0My5KUEcnLCBkb2Y6ICdmLzEuNCcsIHNodXR0ZXJTcGVlZDogJzEvMjIwIHNlYycsIGlzbzogJzIwMCcgfSxcbiAgICAgICAgICB7IG5hbWU6ICcwNDYuSlBHJywgZG9mOiAnZi8xLjQnLCBzaHV0dGVyU3BlZWQ6ICcxLzQ4MCBzZWMnLCBpc286ICcyMDAnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnMDUwLkpQRycsIGRvZjogJ2YvMS40Jywgc2h1dHRlclNwZWVkOiAnMS8xNjAgc2VjJywgaXNvOiAnMjAwJyB9LFxuICAgICAgICAgIHsgbmFtZTogJzA1Mi5KUEcnLCBkb2Y6ICdmLzEuNCcsIHNodXR0ZXJTcGVlZDogJzEvNDUwIHNlYycsIGlzbzogJzIwMCcgfSxcbiAgICAgICAgICB7IG5hbWU6ICcwNTQuSlBHJywgZG9mOiAnZi8xLjQnLCBzaHV0dGVyU3BlZWQ6ICcxLzUyIHNlYycsIGlzbzogJzMyMCcgfSxcblxuICAgICAgICAgIHsgbmFtZTogJzA1NS5KUEcnLCBkb2Y6ICdmLzEuNCcsIHNodXR0ZXJTcGVlZDogJzEvNTYgc2VjJywgaXNvOiAnMjAwJyB9LFxuICAgICAgICAgIHsgbmFtZTogJzA1Ny5KUEcnLCBkb2Y6ICdmLzEuNCcsIHNodXR0ZXJTcGVlZDogJzEvNzAgc2VjJywgaXNvOiAnMjAwJyB9LFxuICAgICAgICAgIHsgbmFtZTogJzA1OC5KUEcnLCBkb2Y6ICdmLzEuNCcsIHNodXR0ZXJTcGVlZDogJzEvNTIgc2VjJywgaXNvOiAnMjAwJyB9LFxuICAgICAgICAgIHsgbmFtZTogJzA1OS5KUEcnLCBkb2Y6ICdmLzEuNCcsIHNodXR0ZXJTcGVlZDogJzEvNzAgc2VjJywgaXNvOiAnMjAwJyB9LFxuICAgICAgICAgIHsgbmFtZTogJzA3OC5KUEcnLCBkb2Y6ICdmLzEuNCcsIHNodXR0ZXJTcGVlZDogJzEvNTIgc2VjJywgaXNvOiAnMjUwMCcgfSxcblxuICAgICAgICAgIHsgbmFtZTogJzA4OC5KUEcnLCBkb2Y6ICdmLzEuNCcsIHNodXR0ZXJTcGVlZDogJzEvNTIgc2VjJywgaXNvOiAnMjUwMCcgfSxcbiAgICAgICAgICB7IG5hbWU6ICcwOTUuSlBHJywgZG9mOiAnZi8xLjQnLCBzaHV0dGVyU3BlZWQ6ICcxLzUyIHNlYycsIGlzbzogJzMyMDAnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnMTA0LkpQRycsIGRvZjogJ2YvMS40Jywgc2h1dHRlclNwZWVkOiAnMS81MiBzZWMnLCBpc286ICcyMDAwJyB9XG4gICAgICAgIF0sXG4gICAgICAgIGNhbWVyYToge1xuICAgICAgICAgIG1vZGVsOiAnRnVqaWZpbG0gWEUtMScsXG4gICAgICAgICAgZm9jYWxMZW5ndGg6ICczNSBtbSdcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgICdtYWxheXNpYSc6IHtcbiAgICAgICAgZm9sZGVyUGF0aDogJzAyLW1hbGF5c2lhL0RTQ0YyJyxcbiAgICAgICAgaW1hZ2VzOiBbXG4gICAgICAgICAgeyBuYW1lOiAnMzM2LkpQRycsIGRvZjogJ2YvMy4yJywgc2h1dHRlclNwZWVkOiAnMS8zMDAwIHNlYycsIGlzbzogJzIwMCcgfSxcbiAgICAgICAgICB7IG5hbWU6ICczNDIuSlBHJywgZG9mOiAnZi8yLjgnLCBzaHV0dGVyU3BlZWQ6ICcxLzQwMDAgc2VjJywgaXNvOiAnMjAwJyB9LFxuICAgICAgICAgIHsgbmFtZTogJzM0Ni5KUEcnLCBkb2Y6ICdmLzIuOCcsIHNodXR0ZXJTcGVlZDogJzEvMzAwIHNlYycsIGlzbzogJzgwMCcgfSxcbiAgICAgICAgICB7IG5hbWU6ICczNDguSlBHJywgZG9mOiAnZi8yLjgnLCBzaHV0dGVyU3BlZWQ6ICcxLzkwIHNlYycsIGlzbzogJzQwMCcgfSxcbiAgICAgICAgICB7IG5hbWU6ICczNTEuSlBHJywgZG9mOiAnZi8yLjgnLCBzaHV0dGVyU3BlZWQ6ICcxLzE2MCBzZWMnLCBpc286ICcxMDAnIH0sXG5cbiAgICAgICAgICB7IG5hbWU6ICczNTMuSlBHJywgZG9mOiAnZi8yLjgnLCBzaHV0dGVyU3BlZWQ6ICcxLzU2IHNlYycsIGlzbzogJzEwMCcgfSxcbiAgICAgICAgICB7IG5hbWU6ICczNjMuSlBHJywgZG9mOiAnZi8yLjgnLCBzaHV0dGVyU3BlZWQ6ICcxLzE5MDAgc2VjJywgaXNvOiAnODAwJyB9LFxuICAgICAgICAgIHsgbmFtZTogJzM2Ni5KUEcnLCBkb2Y6ICdmLzEuNCcsIHNodXR0ZXJTcGVlZDogJzEvMzUwMCBzZWMnLCBpc286ICcyMDAnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnMzY4LkpQRycsIGRvZjogJ2YvMS40Jywgc2h1dHRlclNwZWVkOiAnMS8xODAgc2VjJywgaXNvOiAnODAwJyB9LFxuICAgICAgICAgIHsgbmFtZTogJzM3MC5KUEcnLCBkb2Y6ICdmLzEuNCcsIHNodXR0ZXJTcGVlZDogJzEvMjIwMCBzZWMnLCBpc286ICc4MDAnIH0sXG5cbiAgICAgICAgICB7IG5hbWU6ICczNzMuSlBHJywgZG9mOiAnZi8xLjQnLCBzaHV0dGVyU3BlZWQ6ICcxLzI0MDAgc2VjJywgaXNvOiAnNDAwJyB9LFxuICAgICAgICAgIHsgbmFtZTogJzM3OS5KUEcnLCBkb2Y6ICdmLzEuNCcsIHNodXR0ZXJTcGVlZDogJzEvMTQwMCBzZWMnLCBpc286ICcyMDAnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnMzgxLkpQRycsIGRvZjogJ2YvMS40Jywgc2h1dHRlclNwZWVkOiAnMS85MCBzZWMnLCBpc286ICc4MDAnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnNDE1LkpQRycsIGRvZjogJ2YvMTMnLCBzaHV0dGVyU3BlZWQ6ICcxLzI0MDAgc2VjJywgaXNvOiAnODAwJyB9LFxuICAgICAgICAgIHsgbmFtZTogJzQyMy5KUEcnLCBkb2Y6ICdmLzEuNCcsIHNodXR0ZXJTcGVlZDogJzEvNTUwIHNlYycsIGlzbzogJzgwMCcgfSxcblxuICAgICAgICAgIHsgbmFtZTogJzQyNC5KUEcnLCBkb2Y6ICdmLzEuNCcsIHNodXR0ZXJTcGVlZDogJzEvMTEwMCBzZWMnLCBpc286ICcyMDAnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnNDI1LkpQRycsIGRvZjogJ2YvMS40Jywgc2h1dHRlclNwZWVkOiAnMS8xMDAwIHNlYycsIGlzbzogJzIwMCcgfSxcbiAgICAgICAgICB7IG5hbWU6ICc0MjYuSlBHJywgZG9mOiAnZi8xLjQnLCBzaHV0dGVyU3BlZWQ6ICcxLzkwMCBzZWMnLCBpc286ICcyMDAnIH1cbiAgICAgICAgXSxcbiAgICAgICAgY2FtZXJhOiB7XG4gICAgICAgICAgbW9kZWw6ICdGdWppZmlsbSBYRS0xJyxcbiAgICAgICAgICBmb2NhbExlbmd0aDogJzM1IG1tJ1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgJ2RhbmJvYXJkJzoge1xuICAgICAgICBmb2xkZXJQYXRoOiAnMDYtZGFuYm9hcmQvSU1HXycsXG4gICAgICAgIGltYWdlczogW1xuICAgICAgICAgIHsgbmFtZTogJzQ3MzUuanBnJywgZG9mOiAnZi8yLjgnLCBzaHV0dGVyU3BlZWQ6ICcxLzUwIHNlYycsIGlzbzogJzE2MDAnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnMjYzMC5qcGcnLCBkb2Y6ICdmLzIuOCcsIHNodXR0ZXJTcGVlZDogJzEvMjAgc2VjJywgaXNvOiAnODAwJyB9LFxuICAgICAgICAgIHsgbmFtZTogJzI2NDEuanBnJywgZG9mOiAnZi8yLjgnLCBzaHV0dGVyU3BlZWQ6ICcxLzIwIHNlYycsIGlzbzogJzgwMCcgfSxcbiAgICAgICAgICB7IG5hbWU6ICczMTY2LmpwZycsIGRvZjogJ2YvNScsIHNodXR0ZXJTcGVlZDogJzEvNjAgc2VjJywgaXNvOiAnMjAwJyB9LFxuXG4gICAgICAgICAgeyBuYW1lOiAnMzE3MS5qcGcnLCBkb2Y6ICdmLzMuNScsIHNodXR0ZXJTcGVlZDogJzEvMTI1IHNlYycsIGlzbzogJzIwMCcgfSxcbiAgICAgICAgICB7IG5hbWU6ICczMTc0LmpwZycsIGRvZjogJ2YvNScsIHNodXR0ZXJTcGVlZDogJzEvMTI1IHNlYycsIGlzbzogJzIwMCcgfSxcbiAgICAgICAgICB7IG5hbWU6ICczMTc1LmpwZycsIGRvZjogJ2YvNScsIHNodXR0ZXJTcGVlZDogJzEvODAgc2VjJywgaXNvOiAnMjAwJyB9LFxuICAgICAgICAgIHsgbmFtZTogJzM2MTkuanBnJywgZG9mOiAnZi8zLjUnLCBzaHV0dGVyU3BlZWQ6ICcxLzYwIHNlYycsIGlzbzogJzEwMCcgfVxuXG4gICAgICAgIF0sXG4gICAgICAgIGNhbWVyYToge1xuICAgICAgICAgIG1vZGVsOiAnQ2Fub24gRU9TIDYwMEQnLFxuICAgICAgICAgIGZvY2FsTGVuZ3RoOiAnMTAwIG1tJ1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgJ3ByZWlzZXItZmlndXJlJzoge1xuXG4gICAgICAgIGZvbGRlclBhdGg6ICcwNy1wcmVpc2VyX2ZpZ3VyZS8nLFxuICAgICAgICBpbWFnZXM6IFtcbiAgICAgICAgICB7IG5hbWU6ICcwMS5qcGcnLCBkb2Y6ICdmLzIuOCcsIHNodXR0ZXJTcGVlZDogJzEvNSBzZWMnLCBpc286ICcxMDAnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnMDIuanBnJywgZG9mOiAnZi84Jywgc2h1dHRlclNwZWVkOiAnMiBzZWMnLCBpc286ICcxMDAnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnMDMuanBnJywgZG9mOiAnZi81LjYnLCBzaHV0dGVyU3BlZWQ6ICc0IHNlYycsIGlzbzogJzEwMCcgfSxcbiAgICAgICAgICB7IG5hbWU6ICcwNC5qcGcnLCBkb2Y6ICdmLzUuNicsIHNodXR0ZXJTcGVlZDogJzIuNSBzZWMnLCBpc286ICcxMDAnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnMDUuanBnJywgZG9mOiAnZi8yLjgnLCBzaHV0dGVyU3BlZWQ6ICc0IHNlYycsIGlzbzogJzEwMCcgfSxcblxuICAgICAgICAgIHsgbmFtZTogJzA2LmpwZycsIGRvZjogJ2YvMi44Jywgc2h1dHRlclNwZWVkOiAnMS8zMCBzZWMnLCBpc286ICc0MDAnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnMDcuanBnJywgZG9mOiAnZi80Jywgc2h1dHRlclNwZWVkOiAnMS8zMCBzZWMnLCBpc286ICcxMDAnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnMDguanBnJywgZG9mOiAnZi8yLjgnLCBzaHV0dGVyU3BlZWQ6ICcxLzQgc2VjJywgaXNvOiAnMTAwJyB9LFxuICAgICAgICAgIHsgbmFtZTogJzA5LmpwZycsIGRvZjogJ2YvMTEnLCBzaHV0dGVyU3BlZWQ6ICcyIHNlYycsIGlzbzogJzQwMCcgfSxcbiAgICAgICAgICB7IG5hbWU6ICcxMC5qcGcnLCBkb2Y6ICdmLzIuOCcsIHNodXR0ZXJTcGVlZDogJzEvNSBzZWMnLCBpc286ICcxMDAnIH1cblxuICAgICAgICBdLFxuICAgICAgICBjYW1lcmE6IHtcbiAgICAgICAgICBtb2RlbDogJ0Nhbm9uIEVPUyA2MDBEJyxcbiAgICAgICAgICBmb2NhbExlbmd0aDogJzEwMCBtbSdcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgICdiZXJsaW4nOiB7XG4gICAgICAgIGZvbGRlclBhdGg6ICcwNS1iZXJsaW5fdHJpcC8nLFxuICAgICAgICBpbWFnZXM6IFtcbiAgICAgICAgICB7ICduYW1lJzogJ0RTQ0YyNjA3LkpQRycsICdpc28nOiAyMDAsICdzaHV0dGVyU3BlZWQnOiAnMS8xNjYzJywgJ2RvZic6IDEuNCB9LFxuICAgICAgICAgIHsgJ25hbWUnOiAnRFNDRjI2MDguSlBHJywgJ2lzbyc6IDIwMCwgJ3NodXR0ZXJTcGVlZCc6ICcxLzczOScsICdkb2YnOiAxLjQgfSxcbiAgICAgICAgICB7ICduYW1lJzogJ0RTQ0YyNjA5LkpQRycsICdpc28nOiAyMDAsICdzaHV0dGVyU3BlZWQnOiAnMS8xMDM4JywgJ2RvZic6IDEuNCB9LFxuICAgICAgICAgIHsgJ25hbWUnOiAnRFNDRjI2MTEuSlBHJywgJ2lzbyc6IDIwMCwgJ3NodXR0ZXJTcGVlZCc6ICcxLzYwMCcsICdkb2YnOiAxLjQgfSxcbiAgICAgICAgICB7ICduYW1lJzogJ0RTQ0YyNjE2LkpQRycsICdpc28nOiAyMDAsICdzaHV0dGVyU3BlZWQnOiAnMS83MjknLCAnZG9mJzogMS40IH0sXG4gICAgICAgICAgeyAnbmFtZSc6ICdEU0NGMjYxOS5KUEcnLCAnaXNvJzogMzIwLCAnc2h1dHRlclNwZWVkJzogJzEvNjQnLCAnZG9mJzogOC4wIH0sXG4gICAgICAgICAgeyAnbmFtZSc6ICdEU0NGMjYyNi5KUEcnLCAnaXNvJzogODAwLCAnc2h1dHRlclNwZWVkJzogJzEvMzgnLCAnZG9mJzogMS40IH0sXG4gICAgICAgICAgeyAnbmFtZSc6ICdEU0NGMjYzNC5KUEcnLCAnaXNvJzogODAwLCAnc2h1dHRlclNwZWVkJzogJzEvNjQnLCAnZG9mJzogMS40IH0sXG4gICAgICAgICAgeyAnbmFtZSc6ICdEU0NGMjYzNy5KUEcnLCAnaXNvJzogODAwLCAnc2h1dHRlclNwZWVkJzogJzEvMjMnLCAnZG9mJzogMS40IH0sXG4gICAgICAgICAgeyAnbmFtZSc6ICdEU0NGMjY1MC5KUEcnLCAnaXNvJzogODAwLCAnc2h1dHRlclNwZWVkJzogJzEvNTMnLCAnZG9mJzogMS40IH0sXG4gICAgICAgICAgeyAnbmFtZSc6ICdEU0NGMjY1Ni5KUEcnLCAnaXNvJzogMjAwLCAnc2h1dHRlclNwZWVkJzogJzEvNjc2JywgJ2RvZic6IDguOSB9LFxuICAgICAgICAgIHsgJ25hbWUnOiAnRFNDRjI2NTguSlBHJywgJ2lzbyc6IDIwMCwgJ3NodXR0ZXJTcGVlZCc6ICcxLzU4OCcsICdkb2YnOiAxMC45IH0sXG4gICAgICAgICAgeyAnbmFtZSc6ICdEU0NGMjY1OS5KUEcnLCAnaXNvJzogMjAwLCAnc2h1dHRlclNwZWVkJzogJzEvMjA5MScsICdkb2YnOiA0LjAgfSxcbiAgICAgICAgICB7ICduYW1lJzogJ0RTQ0YyNjYwLkpQRycsICdpc28nOiAyMDAsICdzaHV0dGVyU3BlZWQnOiAnMS8yMzUzJywgJ2RvZic6IDQuMCB9LFxuICAgICAgICAgIHsgJ25hbWUnOiAnRFNDRjI2NjYuSlBHJywgJ2lzbyc6IDIwMCwgJ3NodXR0ZXJTcGVlZCc6ICcxLzE0MycsICdkb2YnOiAxMC45IH0sXG4gICAgICAgICAgeyAnbmFtZSc6ICdEU0NGMjY2Ny5KUEcnLCAnaXNvJzogMjAwLCAnc2h1dHRlclNwZWVkJzogJzEvMTg1OScsICdkb2YnOiAzLjIgfSxcbiAgICAgICAgICB7ICduYW1lJzogJ0RTQ0YyNjY4LkpQRycsICdpc28nOiAyMDAsICdzaHV0dGVyU3BlZWQnOiAnMS8xMTEnLCAnZG9mJzogMTAuOSB9LFxuICAgICAgICAgIHsgJ25hbWUnOiAnRFNDRjI2NzAuSlBHJywgJ2lzbyc6IDIwMCwgJ3NodXR0ZXJTcGVlZCc6ICcxLzMxMjYnLCAnZG9mJzogMS40IH0sXG4gICAgICAgICAgeyAnbmFtZSc6ICdEU0NGMjY3MS5KUEcnLCAnaXNvJzogMzIwLCAnc2h1dHRlclNwZWVkJzogJzEvNjQnLCAnZG9mJzogMS40IH0sXG4gICAgICAgICAgeyAnbmFtZSc6ICdEU0NGMjY3My5KUEcnLCAnaXNvJzogMjAwLCAnc2h1dHRlclNwZWVkJzogJzEvNDA5NicsICdkb2YnOiAxLjYgfSxcbiAgICAgICAgICB7ICduYW1lJzogJ0RTQ0YyNjg1LkpQRycsICdpc28nOiAyMDAsICdzaHV0dGVyU3BlZWQnOiAnMS8xMjI2JywgJ2RvZic6IDQuMCB9LFxuICAgICAgICAgIHsgJ25hbWUnOiAnRFNDRjI2OTAuSlBHJywgJ2lzbyc6IDIwMCwgJ3NodXR0ZXJTcGVlZCc6ICcxLzc5MicsICdkb2YnOiA0LjAgfSxcbiAgICAgICAgICB7ICduYW1lJzogJ0RTQ0YyNjk1LkpQRycsICdpc28nOiAyMDAsICdzaHV0dGVyU3BlZWQnOiAnMS82NTMnLCAnZG9mJzogNC4wIH0sXG4gICAgICAgICAgeyAnbmFtZSc6ICdEU0NGMjY5Ni5KUEcnLCAnaXNvJzogMjAwLCAnc2h1dHRlclNwZWVkJzogJzEvNzI0JywgJ2RvZic6IDQuMCB9LFxuICAgICAgICAgIHsgJ25hbWUnOiAnRFNDRjI2OTcuSlBHJywgJ2lzbyc6IDIwMCwgJ3NodXR0ZXJTcGVlZCc6ICcxLzEyNTInLCAnZG9mJzogNC4wIH0sXG4gICAgICAgICAgeyAnbmFtZSc6ICdEU0NGMjcwMC5KUEcnLCAnaXNvJzogMjAwLCAnc2h1dHRlclNwZWVkJzogJzEvMTA1JywgJ2RvZic6IDQuMCB9LFxuICAgICAgICAgIHsgJ25hbWUnOiAnRFNDRjI3MDIuSlBHJywgJ2lzbyc6IDIwMCwgJ3NodXR0ZXJTcGVlZCc6ICcxLzE0NTgnLCAnZG9mJzogMS40IH0sXG4gICAgICAgICAgeyAnbmFtZSc6ICdEU0NGMjcyOS5KUEcnLCAnaXNvJzogODAwLCAnc2h1dHRlclNwZWVkJzogJzEvMjAnLCAnZG9mJzogMS40IH0sXG4gICAgICAgICAgeyAnbmFtZSc6ICdEU0NGMjczMC5KUEcnLCAnaXNvJzogODAwLCAnc2h1dHRlclNwZWVkJzogJzEvMjQnLCAnZG9mJzogMS40IH0sXG4gICAgICAgICAgeyAnbmFtZSc6ICdEU0NGMjczMy5KUEcnLCAnaXNvJzogMjAwLCAnc2h1dHRlclNwZWVkJzogJzEvMjQxJywgJ2RvZic6IDEwLjkgfSxcbiAgICAgICAgICB7ICduYW1lJzogJ0RTQ0YyNzM4LkpQRycsICdpc28nOiAyMDAsICdzaHV0dGVyU3BlZWQnOiAnMS82NCcsICdkb2YnOiA4LjAgfSxcbiAgICAgICAgICB7ICduYW1lJzogJ0RTQ0YyNzQxLkpQRycsICdpc28nOiAyMDAsICdzaHV0dGVyU3BlZWQnOiAnMS82OScsICdkb2YnOiA4LjAgfSxcbiAgICAgICAgICB7ICduYW1lJzogJ0RTQ0YyNzQzLkpQRycsICdpc28nOiAyMDAsICdzaHV0dGVyU3BlZWQnOiAnMS80MjgnLCAnZG9mJzogOC4wIH0sXG4gICAgICAgICAgeyAnbmFtZSc6ICdEU0NGMjc1NS5KUEcnLCAnaXNvJzogMjAwLCAnc2h1dHRlclNwZWVkJzogJzEvMTQzOCcsICdkb2YnOiAxLjQgfSxcbiAgICAgICAgICB7ICduYW1lJzogJ0RTQ0YyNzU2LkpQRycsICdpc28nOiAyMDAsICdzaHV0dGVyU3BlZWQnOiAnMS8xNTInLCAnZG9mJzogMS42IH0sXG4gICAgICAgICAgeyAnbmFtZSc6ICdEU0NGMjc2MC5KUEcnLCAnaXNvJzogMjAwLCAnc2h1dHRlclNwZWVkJzogJzEvMjI5JywgJ2RvZic6IDEuNCB9LFxuICAgICAgICAgIHsgJ25hbWUnOiAnRFNDRjI3NjMuSlBHJywgJ2lzbyc6IDIwMCwgJ3NodXR0ZXJTcGVlZCc6ICcxLzE2MjknLCAnZG9mJzogMS42IH0sXG4gICAgICAgICAgeyAnbmFtZSc6ICdEU0NGMjc2Ny5KUEcnLCAnaXNvJzogNDAwLCAnc2h1dHRlclNwZWVkJzogJzEvNjQnLCAnZG9mJzogMS40IH0sXG4gICAgICAgICAgeyAnbmFtZSc6ICdEU0NGMjc3MS5KUEcnLCAnaXNvJzogMjAwLCAnc2h1dHRlclNwZWVkJzogJzEvMjU2JywgJ2RvZic6IDEuNCB9LFxuICAgICAgICAgIHsgJ25hbWUnOiAnRFNDRjI3NzUuSlBHJywgJ2lzbyc6IDMyMCwgJ3NodXR0ZXJTcGVlZCc6ICcxLzY0JywgJ2RvZic6IDEuNCB9LFxuICAgICAgICAgIHsgJ25hbWUnOiAnRFNDRjI3NzYuSlBHJywgJ2lzbyc6IDMyMCwgJ3NodXR0ZXJTcGVlZCc6ICcxLzY0JywgJ2RvZic6IDEuNCB9LFxuICAgICAgICAgIHsgJ25hbWUnOiAnRFNDRjI3NzcuSlBHJywgJ2lzbyc6IDUwMCwgJ3NodXR0ZXJTcGVlZCc6ICcxLzY0JywgJ2RvZic6IDEuNCB9LFxuICAgICAgICAgIHsgJ25hbWUnOiAnRFNDRjI3NzguSlBHJywgJ2lzbyc6IDQwMCwgJ3NodXR0ZXJTcGVlZCc6ICcxLzY0JywgJ2RvZic6IDEuNCB9XSxcbiAgICAgICAgY2FtZXJhOiB7XG4gICAgICAgICAgbW9kZWw6ICdGdWppZmlsbSBYRS0xJyxcbiAgICAgICAgICBmb2NhbExlbmd0aDogJzM1LjBtbScsXG4gICAgICAgICAgbGVuc01vZGVsOiAnWEYzNW1tRjEuNCBSJ1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iLCJleHBvcnQgZGVmYXVsdCB7XG4gIHN0YXRlOiB7XG4gICAgc29uZ3M6IFtcbiAgICAgICdodHRwczovL3cuc291bmRjbG91ZC5jb20vcGxheWVyLz91cmw9aHR0cHMlM0EvL2FwaS5zb3VuZGNsb3VkLmNvbS90cmFja3MvMTU3NTAyODQ3JmNvbG9yPSUyM2ZmNTUwMCZhdXRvX3BsYXk9ZmFsc2UmaGlkZV9yZWxhdGVkPWZhbHNlJnNob3dfY29tbWVudHM9dHJ1ZSZzaG93X3VzZXI9dHJ1ZSZzaG93X3JlcG9zdHM9ZmFsc2Umc2hvd190ZWFzZXI9dHJ1ZScsXG4gICAgICAnaHR0cHM6Ly93LnNvdW5kY2xvdWQuY29tL3BsYXllci8/dXJsPWh0dHBzJTNBLy9hcGkuc291bmRjbG91ZC5jb20vdHJhY2tzLzE1MzQ0OTg4MiZjb2xvcj0lMjNmZjU1MDAmYXV0b19wbGF5PWZhbHNlJmhpZGVfcmVsYXRlZD1mYWxzZSZzaG93X2NvbW1lbnRzPXRydWUmc2hvd191c2VyPXRydWUmc2hvd19yZXBvc3RzPWZhbHNlJnNob3dfdGVhc2VyPXRydWUnLFxuICAgICAgJ2h0dHBzOi8vdy5zb3VuZGNsb3VkLmNvbS9wbGF5ZXIvP3VybD1odHRwcyUzQS8vYXBpLnNvdW5kY2xvdWQuY29tL3RyYWNrcy8xNTA2MzQwODYmY29sb3I9JTIzZmY1NTAwJmF1dG9fcGxheT1mYWxzZSZoaWRlX3JlbGF0ZWQ9ZmFsc2Umc2hvd19jb21tZW50cz10cnVlJnNob3dfdXNlcj10cnVlJnNob3dfcmVwb3N0cz1mYWxzZSZzaG93X3RlYXNlcj10cnVlJyxcbiAgICAgICdodHRwczovL3cuc291bmRjbG91ZC5jb20vcGxheWVyLz91cmw9aHR0cHMlM0EvL2FwaS5zb3VuZGNsb3VkLmNvbS90cmFja3MvMTUwMzIzNDc1JmNvbG9yPSUyM2ZmNTUwMCZhdXRvX3BsYXk9ZmFsc2UmaGlkZV9yZWxhdGVkPWZhbHNlJnNob3dfY29tbWVudHM9dHJ1ZSZzaG93X3VzZXI9dHJ1ZSZzaG93X3JlcG9zdHM9ZmFsc2Umc2hvd190ZWFzZXI9dHJ1ZSdcbiAgICBdXG4gIH1cbn1cbiIsIi8vIGltcG9ydCAnYmFiZWwtcG9seWZpbGwnXG5pbXBvcnQgeyBhcHAsIGggfSBmcm9tICdoeXBlcmFwcCdcbmltcG9ydCB7IFJvdXRlLCBsb2NhdGlvbiB9IGZyb20gJ0BoeXBlcmFwcC9yb3V0ZXInXG5cbmltcG9ydCAnbm9ybWFsaXplLmNzcydcbmltcG9ydCAnLi9pbmRleC5jc3MnXG5cbi8vIEF0b21zXG5pbXBvcnQgSGVhZGVyIGZyb20gJy4vYXRvbWljL2F0b21zL0hlYWRlcidcbmltcG9ydCBOYXZiYXIgZnJvbSAnLi9hdG9taWMvYXRvbXMvTmF2YmFyJ1xuaW1wb3J0IEZvb3RlciBmcm9tICcuL2F0b21pYy9hdG9tcy9Gb290ZXInXG5cbi8vIFBhZ2VzXG5pbXBvcnQgQm9va1BhZ2UgZnJvbSAnLi9hdG9taWMvcGFnZXMvQm9vaydcbmltcG9ydCBIb21lUGFnZSBmcm9tICcuL2F0b21pYy9wYWdlcy9Ib21lJ1xuaW1wb3J0IEFib3V0UGFnZSBmcm9tICcuL2F0b21pYy9wYWdlcy9BYm91dCdcbmltcG9ydCBQaG90b2dyYXBoeVBhZ2UgZnJvbSAnLi9hdG9taWMvcGFnZXMvUGhvdG9ncmFwaHknXG5pbXBvcnQgR3VpdGFyUGFnZSBmcm9tICcuL2F0b21pYy9wYWdlcy9HdWl0YXInXG5pbXBvcnQgQ29udGFjdFBhZ2UgZnJvbSAnLi9hdG9taWMvcGFnZXMvQ29udGFjdCdcblxuLy8gTW9kdWxlc1xuaW1wb3J0IHR5cGV3cml0ZXJNb2R1bGUgZnJvbSAnLi9zdG9yZS90eXBld3JpdGVyJ1xuaW1wb3J0IGJvb2tNb2R1bGUgZnJvbSAnLi9zdG9yZS9ib29rJ1xuaW1wb3J0IHBob3RvZ3JhcGh5TW9kdWxlIGZyb20gJy4vc3RvcmUvcGhvdG8nXG5pbXBvcnQgZ3VpdGFyTW9kdWxlIGZyb20gJy4vc3RvcmUvZ3VpdGFyJ1xuXG5jb25zdCBzdGF0ZSA9IE9iamVjdC5hc3NpZ24oe30sIHtcbiAgaGVhZGVyOiAnYWxleHRhbmhvbmdwaW4nLFxuICB1c2VybmFtZTogJ0FsZXggVGFuJyxcbiAgZm9vdGVyOiBgQ29weXJpZ2h0IMKpICR7bmV3IERhdGUoKS5nZXRGdWxsWWVhcigpfSBhbGV4dGFuaG9uZ3BpbmAsXG4gIHByb2ZpbGVJbWc6ICcuL2Fzc2V0cy9pbWcvcHJvZmlsZS5qcGcnLFxuICAvLyBSZWdpc3RlciBzdGF0ZSBmb3IgQGh5cGVyYXBwL3JvdXRlclxuICBsb2NhdGlvbjogbG9jYXRpb24uc3RhdGUsXG4gIGxpbmtzOiBbXG4gICAge1xuICAgICAgdG86ICcvJyxcbiAgICAgIGxhYmVsOiAnSG9tZSdcbiAgICB9LFxuICAgIC8vIHtcbiAgICAvLyAgIHRvOiAnL2Fib3V0JyxcbiAgICAvLyAgIGxhYmVsOiAnQWJvdXQnXG4gICAgLy8gfSxcbiAgICB7XG4gICAgICB0bzogJy9jb250YWN0cycsXG4gICAgICBsYWJlbDogJ0NvbnRhY3QnXG4gICAgfSxcbiAgICB7XG4gICAgICB0bzogJy9waG90b3MnLFxuICAgICAgbGFiZWw6ICdQaG90bydcbiAgICB9LFxuICAgIHtcbiAgICAgIHRvOiAnL2Jvb2tzJyxcbiAgICAgIGxhYmVsOiAnQm9vaydcbiAgICB9LFxuICAgIHtcbiAgICAgIHRvOiAnL3NvbmdzJyxcbiAgICAgIGxhYmVsOiAnR3VpdGFyJ1xuICAgIH1cbiAgXVxufSxcbnR5cGV3cml0ZXJNb2R1bGUuc3RhdGUsXG5ib29rTW9kdWxlLnN0YXRlLFxucGhvdG9ncmFwaHlNb2R1bGUuc3RhdGUsXG5ndWl0YXJNb2R1bGUuc3RhdGUpXG5cbmNvbnN0IGFjdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCB7XG4gIC8vIFJlZ2lzdGVyIGFjdGlvbnMgZm9yIEBoeXBlcmFwcC9yb3V0ZXJcbiAgbG9jYXRpb246IGxvY2F0aW9uLmFjdGlvbnNcbn0sIHR5cGV3cml0ZXJNb2R1bGUuYWN0aW9ucylcblxuY29uc3QgdmlldyA9IChzdGF0ZSwgYWN0aW9ucykgPT4gKFxuICA8bWFpbiBjbGFzcz0nbWFpbic+XG4gICAgPEhlYWRlciBoZWFkZXI9e3N0YXRlLmhlYWRlcn0gdXNlcm5hbWU9e3N0YXRlLnVzZXJuYW1lfSBwcm9maWxlSW1nPXtzdGF0ZS5wcm9maWxlSW1nfSAvPlxuICAgIDxOYXZiYXIgbGlua3M9e3N0YXRlLmxpbmtzfSByb3V0ZT17c3RhdGUubG9jYXRpb24ucGF0aG5hbWV9IC8+XG5cbiAgICA8Um91dGUgcGF0aD0nLycgcmVuZGVyPXtIb21lUGFnZShzdGF0ZSwgYWN0aW9ucyl9IC8+XG4gICAgPFJvdXRlIHBhdGg9Jy9hYm91dCcgcmVuZGVyPXtBYm91dFBhZ2V9IC8+XG4gICAgPFJvdXRlIHBhdGg9Jy9waG90b3MnIHJlbmRlcj17UGhvdG9ncmFwaHlQYWdlfSAvPlxuICAgIDxSb3V0ZSBwYXRoPScvYm9va3MnIHJlbmRlcj17Qm9va1BhZ2Uoc3RhdGUsIGFjdGlvbnMpfSAvPlxuICAgIDxSb3V0ZSBwYXRoPScvc29uZ3MnIHJlbmRlcj17R3VpdGFyUGFnZShzdGF0ZSwgYWN0aW9ucyl9IC8+XG4gICAgPFJvdXRlIHBhdGg9Jy9jb250YWN0cycgcmVuZGVyPXtDb250YWN0UGFnZShzdGF0ZSwgYWN0aW9ucyl9IC8+XG5cbiAgICA8Rm9vdGVyIGZvb3Rlcj17c3RhdGUuZm9vdGVyfSAvPlxuICA8L21haW4+XG4pXG5cbmNvbnN0IG1haW4gPSBhcHAoc3RhdGUsIGFjdGlvbnMsIHZpZXcsIGRvY3VtZW50LmJvZHkpXG5cbi8vIFJlZ2lzdGVyIEBoeXBlcmFwcC9yb3V0ZXJcbmxvY2F0aW9uLnN1YnNjcmliZShtYWluLmxvY2F0aW9uKVxuIl0sIm5hbWVzIjpbImgiLCJuYW1lIiwiYXR0cmlidXRlcyIsInJlc3QiLCJjaGlsZHJlbiIsImxlbmd0aCIsImFyZ3VtZW50cyIsInB1c2giLCJub2RlIiwicG9wIiwia2V5IiwiYXBwIiwic3RhdGUiLCJhY3Rpb25zIiwidmlldyIsImNvbnRhaW5lciIsIm1hcCIsInJvb3RFbGVtZW50Iiwib2xkTm9kZSIsInJlY3ljbGVFbGVtZW50IiwibGlmZWN5Y2xlIiwic2tpcFJlbmRlciIsImlzUmVjeWNsaW5nIiwiZ2xvYmFsU3RhdGUiLCJjbG9uZSIsIndpcmVkQWN0aW9ucyIsIndpcmVTdGF0ZVRvQWN0aW9ucyIsImVsZW1lbnQiLCJub2RlTmFtZSIsInRvTG93ZXJDYXNlIiwiY2FsbCIsImNoaWxkTm9kZXMiLCJub2RlVHlwZSIsIm5vZGVWYWx1ZSIsInJlc29sdmVOb2RlIiwicmVuZGVyIiwicGF0Y2giLCJzY2hlZHVsZVJlbmRlciIsInRhcmdldCIsInNvdXJjZSIsIm91dCIsImkiLCJzZXRQYXJ0aWFsU3RhdGUiLCJwYXRoIiwidmFsdWUiLCJzbGljZSIsImdldFBhcnRpYWxTdGF0ZSIsImFjdGlvbiIsImRhdGEiLCJyZXN1bHQiLCJ0aGVuIiwiY29uY2F0IiwiZ2V0S2V5IiwiZXZlbnRMaXN0ZW5lciIsImV2ZW50IiwiY3VycmVudFRhcmdldCIsImV2ZW50cyIsInR5cGUiLCJ1cGRhdGVBdHRyaWJ1dGUiLCJvbGRWYWx1ZSIsImlzU3ZnIiwic3R5bGUiLCJzZXRQcm9wZXJ0eSIsImFkZEV2ZW50TGlzdGVuZXIiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwic2V0QXR0cmlidXRlIiwicmVtb3ZlQXR0cmlidXRlIiwiY3JlYXRlRWxlbWVudCIsImRvY3VtZW50IiwiY3JlYXRlVGV4dE5vZGUiLCJjcmVhdGVFbGVtZW50TlMiLCJvbmNyZWF0ZSIsImFwcGVuZENoaWxkIiwidXBkYXRlRWxlbWVudCIsIm9sZEF0dHJpYnV0ZXMiLCJjYiIsIm9udXBkYXRlIiwicmVtb3ZlQ2hpbGRyZW4iLCJvbmRlc3Ryb3kiLCJyZW1vdmVFbGVtZW50IiwicGFyZW50IiwiZG9uZSIsInJlbW92ZUNoaWxkIiwib25yZW1vdmUiLCJuZXdFbGVtZW50IiwiaW5zZXJ0QmVmb3JlIiwib2xkS2V5ZWQiLCJuZXdLZXllZCIsIm9sZEVsZW1lbnRzIiwib2xkQ2hpbGRyZW4iLCJvbGRLZXkiLCJrIiwibmV3S2V5Iiwia2V5ZWROb2RlIiwiZ2V0T3JpZ2luIiwibG9jIiwicHJvdG9jb2wiLCJob3N0bmFtZSIsInBvcnQiLCJpc0V4dGVybmFsIiwiYW5jaG9yRWxlbWVudCIsImxvY2F0aW9uIiwiTGluayIsInByb3BzIiwidG8iLCJvbmNsaWNrIiwiaHJlZiIsImUiLCJkZWZhdWx0UHJldmVudGVkIiwiYnV0dG9uIiwiYWx0S2V5IiwibWV0YUtleSIsImN0cmxLZXkiLCJzaGlmdEtleSIsInByZXZlbnREZWZhdWx0IiwicGF0aG5hbWUiLCJwdXNoU3RhdGUiLCJjcmVhdGVNYXRjaCIsImlzRXhhY3QiLCJ1cmwiLCJwYXJhbXMiLCJ0cmltVHJhaWxpbmdTbGFzaCIsImxlbiIsImRlY29kZVBhcmFtIiwidmFsIiwiZGVjb2RlVVJJQ29tcG9uZW50IiwicGFyc2VSb3V0ZSIsIm9wdGlvbnMiLCJleGFjdCIsInBhdGhzIiwic3BsaXQiLCJ1cmxzIiwiUm91dGUiLCJtYXRjaCIsIndyYXBIaXN0b3J5Iiwia2V5cyIsInJlZHVjZSIsIm5leHQiLCJmbiIsImhpc3RvcnkiLCJ0aXRsZSIsIkN1c3RvbUV2ZW50Iiwid2luZG93IiwiaGFuZGxlTG9jYXRpb25DaGFuZ2UiLCJzZXQiLCJkZXRhaWwiLCJwcmV2aW91cyIsInVud3JhcCIsImNvbXBvbmVudCIsImhlYWRlciIsInVzZXJuYW1lIiwicHJvZmlsZUltZyIsImxpbmtzIiwicm91dGUiLCJsaW5rIiwibGFiZWwiLCJmb290ZXIiLCJyb3ciLCJwYWdlIiwiQnIiLCJib29rcyIsImJvb2siLCJhdXRob3IiLCJwYXVzZSIsIk1hdGgiLCJyb3VuZCIsInJhbmRvbSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0Iiwic2V0VGltZW91dCIsImR1cmF0aW9uIiwibWF4IiwiY291bnRlciIsImNhbGxiYWNrIiwiaGVhZGluZyIsInN1YmhlYWRpbmciLCJoZWFkaW5nR2hvc3QiLCJzdWJoZWFkaW5nR2hvc3QiLCJzdGFydFR5cGluZyIsInVwZGF0ZUhlYWRpbmciLCJ1cGRhdGVTdWJoZWFkaW5nIiwic29uZ3MiLCJzb25nIiwiT2JqZWN0IiwiYXNzaWduIiwiRGF0ZSIsImdldEZ1bGxZZWFyIiwidHlwZXdyaXRlck1vZHVsZSIsImJvb2tNb2R1bGUiLCJwaG90b2dyYXBoeU1vZHVsZSIsImd1aXRhck1vZHVsZSIsIkhlYWRlciIsIk5hdmJhciIsIkhvbWVQYWdlIiwiQWJvdXRQYWdlIiwiUGhvdG9ncmFwaHlQYWdlIiwiQm9va1BhZ2UiLCJHdWl0YXJQYWdlIiwiQ29udGFjdFBhZ2UiLCJGb290ZXIiLCJtYWluIiwiYm9keSIsInN1YnNjcmliZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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
