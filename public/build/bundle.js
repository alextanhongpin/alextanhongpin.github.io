
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error(`Cannot have duplicate keys in a keyed each`);
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.19.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var page = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
    	 module.exports = factory() ;
    }(commonjsGlobal, (function () {
    var isarray = Array.isArray || function (arr) {
      return Object.prototype.toString.call(arr) == '[object Array]';
    };

    /**
     * Expose `pathToRegexp`.
     */
    var pathToRegexp_1 = pathToRegexp;
    var parse_1 = parse;
    var compile_1 = compile;
    var tokensToFunction_1 = tokensToFunction;
    var tokensToRegExp_1 = tokensToRegExp;

    /**
     * The main path matching regexp utility.
     *
     * @type {RegExp}
     */
    var PATH_REGEXP = new RegExp([
      // Match escaped characters that would otherwise appear in future matches.
      // This allows the user to escape special characters that won't transform.
      '(\\\\.)',
      // Match Express-style parameters and un-named parameters with a prefix
      // and optional suffixes. Matches appear as:
      //
      // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
      // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
      // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
      '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^()])+)\\))?|\\(((?:\\\\.|[^()])+)\\))([+*?])?|(\\*))'
    ].join('|'), 'g');

    /**
     * Parse a string for the raw tokens.
     *
     * @param  {String} str
     * @return {Array}
     */
    function parse (str) {
      var tokens = [];
      var key = 0;
      var index = 0;
      var path = '';
      var res;

      while ((res = PATH_REGEXP.exec(str)) != null) {
        var m = res[0];
        var escaped = res[1];
        var offset = res.index;
        path += str.slice(index, offset);
        index = offset + m.length;

        // Ignore already escaped sequences.
        if (escaped) {
          path += escaped[1];
          continue
        }

        // Push the current path onto the tokens.
        if (path) {
          tokens.push(path);
          path = '';
        }

        var prefix = res[2];
        var name = res[3];
        var capture = res[4];
        var group = res[5];
        var suffix = res[6];
        var asterisk = res[7];

        var repeat = suffix === '+' || suffix === '*';
        var optional = suffix === '?' || suffix === '*';
        var delimiter = prefix || '/';
        var pattern = capture || group || (asterisk ? '.*' : '[^' + delimiter + ']+?');

        tokens.push({
          name: name || key++,
          prefix: prefix || '',
          delimiter: delimiter,
          optional: optional,
          repeat: repeat,
          pattern: escapeGroup(pattern)
        });
      }

      // Match any characters still remaining.
      if (index < str.length) {
        path += str.substr(index);
      }

      // If the path exists, push it onto the end.
      if (path) {
        tokens.push(path);
      }

      return tokens
    }

    /**
     * Compile a string to a template function for the path.
     *
     * @param  {String}   str
     * @return {Function}
     */
    function compile (str) {
      return tokensToFunction(parse(str))
    }

    /**
     * Expose a method for transforming tokens into the path function.
     */
    function tokensToFunction (tokens) {
      // Compile all the tokens into regexps.
      var matches = new Array(tokens.length);

      // Compile all the patterns before compilation.
      for (var i = 0; i < tokens.length; i++) {
        if (typeof tokens[i] === 'object') {
          matches[i] = new RegExp('^' + tokens[i].pattern + '$');
        }
      }

      return function (obj) {
        var path = '';
        var data = obj || {};

        for (var i = 0; i < tokens.length; i++) {
          var token = tokens[i];

          if (typeof token === 'string') {
            path += token;

            continue
          }

          var value = data[token.name];
          var segment;

          if (value == null) {
            if (token.optional) {
              continue
            } else {
              throw new TypeError('Expected "' + token.name + '" to be defined')
            }
          }

          if (isarray(value)) {
            if (!token.repeat) {
              throw new TypeError('Expected "' + token.name + '" to not repeat, but received "' + value + '"')
            }

            if (value.length === 0) {
              if (token.optional) {
                continue
              } else {
                throw new TypeError('Expected "' + token.name + '" to not be empty')
              }
            }

            for (var j = 0; j < value.length; j++) {
              segment = encodeURIComponent(value[j]);

              if (!matches[i].test(segment)) {
                throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
              }

              path += (j === 0 ? token.prefix : token.delimiter) + segment;
            }

            continue
          }

          segment = encodeURIComponent(value);

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
          }

          path += token.prefix + segment;
        }

        return path
      }
    }

    /**
     * Escape a regular expression string.
     *
     * @param  {String} str
     * @return {String}
     */
    function escapeString (str) {
      return str.replace(/([.+*?=^!:${}()[\]|\/])/g, '\\$1')
    }

    /**
     * Escape the capturing group by escaping special characters and meaning.
     *
     * @param  {String} group
     * @return {String}
     */
    function escapeGroup (group) {
      return group.replace(/([=!:$\/()])/g, '\\$1')
    }

    /**
     * Attach the keys as a property of the regexp.
     *
     * @param  {RegExp} re
     * @param  {Array}  keys
     * @return {RegExp}
     */
    function attachKeys (re, keys) {
      re.keys = keys;
      return re
    }

    /**
     * Get the flags for a regexp from the options.
     *
     * @param  {Object} options
     * @return {String}
     */
    function flags (options) {
      return options.sensitive ? '' : 'i'
    }

    /**
     * Pull out keys from a regexp.
     *
     * @param  {RegExp} path
     * @param  {Array}  keys
     * @return {RegExp}
     */
    function regexpToRegexp (path, keys) {
      // Use a negative lookahead to match only capturing groups.
      var groups = path.source.match(/\((?!\?)/g);

      if (groups) {
        for (var i = 0; i < groups.length; i++) {
          keys.push({
            name: i,
            prefix: null,
            delimiter: null,
            optional: false,
            repeat: false,
            pattern: null
          });
        }
      }

      return attachKeys(path, keys)
    }

    /**
     * Transform an array into a regexp.
     *
     * @param  {Array}  path
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function arrayToRegexp (path, keys, options) {
      var parts = [];

      for (var i = 0; i < path.length; i++) {
        parts.push(pathToRegexp(path[i], keys, options).source);
      }

      var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options));

      return attachKeys(regexp, keys)
    }

    /**
     * Create a path regexp from string input.
     *
     * @param  {String} path
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function stringToRegexp (path, keys, options) {
      var tokens = parse(path);
      var re = tokensToRegExp(tokens, options);

      // Attach keys back to the regexp.
      for (var i = 0; i < tokens.length; i++) {
        if (typeof tokens[i] !== 'string') {
          keys.push(tokens[i]);
        }
      }

      return attachKeys(re, keys)
    }

    /**
     * Expose a function for taking tokens and returning a RegExp.
     *
     * @param  {Array}  tokens
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function tokensToRegExp (tokens, options) {
      options = options || {};

      var strict = options.strict;
      var end = options.end !== false;
      var route = '';
      var lastToken = tokens[tokens.length - 1];
      var endsWithSlash = typeof lastToken === 'string' && /\/$/.test(lastToken);

      // Iterate over the tokens and create our regexp string.
      for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];

        if (typeof token === 'string') {
          route += escapeString(token);
        } else {
          var prefix = escapeString(token.prefix);
          var capture = token.pattern;

          if (token.repeat) {
            capture += '(?:' + prefix + capture + ')*';
          }

          if (token.optional) {
            if (prefix) {
              capture = '(?:' + prefix + '(' + capture + '))?';
            } else {
              capture = '(' + capture + ')?';
            }
          } else {
            capture = prefix + '(' + capture + ')';
          }

          route += capture;
        }
      }

      // In non-strict mode we allow a slash at the end of match. If the path to
      // match already ends with a slash, we remove it for consistency. The slash
      // is valid at the end of a path match, not in the middle. This is important
      // in non-ending mode, where "/test/" shouldn't match "/test//route".
      if (!strict) {
        route = (endsWithSlash ? route.slice(0, -2) : route) + '(?:\\/(?=$))?';
      }

      if (end) {
        route += '$';
      } else {
        // In non-ending mode, we need the capturing groups to match as much as
        // possible by using a positive lookahead to the end or next path segment.
        route += strict && endsWithSlash ? '' : '(?=\\/|$)';
      }

      return new RegExp('^' + route, flags(options))
    }

    /**
     * Normalize the given path string, returning a regular expression.
     *
     * An empty array can be passed in for the keys, which will hold the
     * placeholder key descriptions. For example, using `/user/:id`, `keys` will
     * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
     *
     * @param  {(String|RegExp|Array)} path
     * @param  {Array}                 [keys]
     * @param  {Object}                [options]
     * @return {RegExp}
     */
    function pathToRegexp (path, keys, options) {
      keys = keys || [];

      if (!isarray(keys)) {
        options = keys;
        keys = [];
      } else if (!options) {
        options = {};
      }

      if (path instanceof RegExp) {
        return regexpToRegexp(path, keys)
      }

      if (isarray(path)) {
        return arrayToRegexp(path, keys, options)
      }

      return stringToRegexp(path, keys, options)
    }

    pathToRegexp_1.parse = parse_1;
    pathToRegexp_1.compile = compile_1;
    pathToRegexp_1.tokensToFunction = tokensToFunction_1;
    pathToRegexp_1.tokensToRegExp = tokensToRegExp_1;

    /**
       * Module dependencies.
       */



      /**
       * Short-cuts for global-object checks
       */

      var hasDocument = ('undefined' !== typeof document);
      var hasWindow = ('undefined' !== typeof window);
      var hasHistory = ('undefined' !== typeof history);
      var hasProcess = typeof process !== 'undefined';

      /**
       * Detect click event
       */
      var clickEvent = hasDocument && document.ontouchstart ? 'touchstart' : 'click';

      /**
       * To work properly with the URL
       * history.location generated polyfill in https://github.com/devote/HTML5-History-API
       */

      var isLocation = hasWindow && !!(window.history.location || window.location);

      /**
       * The page instance
       * @api private
       */
      function Page() {
        // public things
        this.callbacks = [];
        this.exits = [];
        this.current = '';
        this.len = 0;

        // private things
        this._decodeURLComponents = true;
        this._base = '';
        this._strict = false;
        this._running = false;
        this._hashbang = false;

        // bound functions
        this.clickHandler = this.clickHandler.bind(this);
        this._onpopstate = this._onpopstate.bind(this);
      }

      /**
       * Configure the instance of page. This can be called multiple times.
       *
       * @param {Object} options
       * @api public
       */

      Page.prototype.configure = function(options) {
        var opts = options || {};

        this._window = opts.window || (hasWindow && window);
        this._decodeURLComponents = opts.decodeURLComponents !== false;
        this._popstate = opts.popstate !== false && hasWindow;
        this._click = opts.click !== false && hasDocument;
        this._hashbang = !!opts.hashbang;

        var _window = this._window;
        if(this._popstate) {
          _window.addEventListener('popstate', this._onpopstate, false);
        } else if(hasWindow) {
          _window.removeEventListener('popstate', this._onpopstate, false);
        }

        if (this._click) {
          _window.document.addEventListener(clickEvent, this.clickHandler, false);
        } else if(hasDocument) {
          _window.document.removeEventListener(clickEvent, this.clickHandler, false);
        }

        if(this._hashbang && hasWindow && !hasHistory) {
          _window.addEventListener('hashchange', this._onpopstate, false);
        } else if(hasWindow) {
          _window.removeEventListener('hashchange', this._onpopstate, false);
        }
      };

      /**
       * Get or set basepath to `path`.
       *
       * @param {string} path
       * @api public
       */

      Page.prototype.base = function(path) {
        if (0 === arguments.length) return this._base;
        this._base = path;
      };

      /**
       * Gets the `base`, which depends on whether we are using History or
       * hashbang routing.

       * @api private
       */
      Page.prototype._getBase = function() {
        var base = this._base;
        if(!!base) return base;
        var loc = hasWindow && this._window && this._window.location;

        if(hasWindow && this._hashbang && loc && loc.protocol === 'file:') {
          base = loc.pathname;
        }

        return base;
      };

      /**
       * Get or set strict path matching to `enable`
       *
       * @param {boolean} enable
       * @api public
       */

      Page.prototype.strict = function(enable) {
        if (0 === arguments.length) return this._strict;
        this._strict = enable;
      };


      /**
       * Bind with the given `options`.
       *
       * Options:
       *
       *    - `click` bind to click events [true]
       *    - `popstate` bind to popstate [true]
       *    - `dispatch` perform initial dispatch [true]
       *
       * @param {Object} options
       * @api public
       */

      Page.prototype.start = function(options) {
        var opts = options || {};
        this.configure(opts);

        if (false === opts.dispatch) return;
        this._running = true;

        var url;
        if(isLocation) {
          var window = this._window;
          var loc = window.location;

          if(this._hashbang && ~loc.hash.indexOf('#!')) {
            url = loc.hash.substr(2) + loc.search;
          } else if (this._hashbang) {
            url = loc.search + loc.hash;
          } else {
            url = loc.pathname + loc.search + loc.hash;
          }
        }

        this.replace(url, null, true, opts.dispatch);
      };

      /**
       * Unbind click and popstate event handlers.
       *
       * @api public
       */

      Page.prototype.stop = function() {
        if (!this._running) return;
        this.current = '';
        this.len = 0;
        this._running = false;

        var window = this._window;
        this._click && window.document.removeEventListener(clickEvent, this.clickHandler, false);
        hasWindow && window.removeEventListener('popstate', this._onpopstate, false);
        hasWindow && window.removeEventListener('hashchange', this._onpopstate, false);
      };

      /**
       * Show `path` with optional `state` object.
       *
       * @param {string} path
       * @param {Object=} state
       * @param {boolean=} dispatch
       * @param {boolean=} push
       * @return {!Context}
       * @api public
       */

      Page.prototype.show = function(path, state, dispatch, push) {
        var ctx = new Context(path, state, this),
          prev = this.prevContext;
        this.prevContext = ctx;
        this.current = ctx.path;
        if (false !== dispatch) this.dispatch(ctx, prev);
        if (false !== ctx.handled && false !== push) ctx.pushState();
        return ctx;
      };

      /**
       * Goes back in the history
       * Back should always let the current route push state and then go back.
       *
       * @param {string} path - fallback path to go back if no more history exists, if undefined defaults to page.base
       * @param {Object=} state
       * @api public
       */

      Page.prototype.back = function(path, state) {
        var page = this;
        if (this.len > 0) {
          var window = this._window;
          // this may need more testing to see if all browsers
          // wait for the next tick to go back in history
          hasHistory && window.history.back();
          this.len--;
        } else if (path) {
          setTimeout(function() {
            page.show(path, state);
          });
        } else {
          setTimeout(function() {
            page.show(page._getBase(), state);
          });
        }
      };

      /**
       * Register route to redirect from one path to other
       * or just redirect to another route
       *
       * @param {string} from - if param 'to' is undefined redirects to 'from'
       * @param {string=} to
       * @api public
       */
      Page.prototype.redirect = function(from, to) {
        var inst = this;

        // Define route from a path to another
        if ('string' === typeof from && 'string' === typeof to) {
          page.call(this, from, function(e) {
            setTimeout(function() {
              inst.replace(/** @type {!string} */ (to));
            }, 0);
          });
        }

        // Wait for the push state and replace it with another
        if ('string' === typeof from && 'undefined' === typeof to) {
          setTimeout(function() {
            inst.replace(from);
          }, 0);
        }
      };

      /**
       * Replace `path` with optional `state` object.
       *
       * @param {string} path
       * @param {Object=} state
       * @param {boolean=} init
       * @param {boolean=} dispatch
       * @return {!Context}
       * @api public
       */


      Page.prototype.replace = function(path, state, init, dispatch) {
        var ctx = new Context(path, state, this),
          prev = this.prevContext;
        this.prevContext = ctx;
        this.current = ctx.path;
        ctx.init = init;
        ctx.save(); // save before dispatching, which may redirect
        if (false !== dispatch) this.dispatch(ctx, prev);
        return ctx;
      };

      /**
       * Dispatch the given `ctx`.
       *
       * @param {Context} ctx
       * @api private
       */

      Page.prototype.dispatch = function(ctx, prev) {
        var i = 0, j = 0, page = this;

        function nextExit() {
          var fn = page.exits[j++];
          if (!fn) return nextEnter();
          fn(prev, nextExit);
        }

        function nextEnter() {
          var fn = page.callbacks[i++];

          if (ctx.path !== page.current) {
            ctx.handled = false;
            return;
          }
          if (!fn) return unhandled.call(page, ctx);
          fn(ctx, nextEnter);
        }

        if (prev) {
          nextExit();
        } else {
          nextEnter();
        }
      };

      /**
       * Register an exit route on `path` with
       * callback `fn()`, which will be called
       * on the previous context when a new
       * page is visited.
       */
      Page.prototype.exit = function(path, fn) {
        if (typeof path === 'function') {
          return this.exit('*', path);
        }

        var route = new Route(path, null, this);
        for (var i = 1; i < arguments.length; ++i) {
          this.exits.push(route.middleware(arguments[i]));
        }
      };

      /**
       * Handle "click" events.
       */

      /* jshint +W054 */
      Page.prototype.clickHandler = function(e) {
        if (1 !== this._which(e)) return;

        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        if (e.defaultPrevented) return;

        // ensure link
        // use shadow dom when available if not, fall back to composedPath()
        // for browsers that only have shady
        var el = e.target;
        var eventPath = e.path || (e.composedPath ? e.composedPath() : null);

        if(eventPath) {
          for (var i = 0; i < eventPath.length; i++) {
            if (!eventPath[i].nodeName) continue;
            if (eventPath[i].nodeName.toUpperCase() !== 'A') continue;
            if (!eventPath[i].href) continue;

            el = eventPath[i];
            break;
          }
        }

        // continue ensure link
        // el.nodeName for svg links are 'a' instead of 'A'
        while (el && 'A' !== el.nodeName.toUpperCase()) el = el.parentNode;
        if (!el || 'A' !== el.nodeName.toUpperCase()) return;

        // check if link is inside an svg
        // in this case, both href and target are always inside an object
        var svg = (typeof el.href === 'object') && el.href.constructor.name === 'SVGAnimatedString';

        // Ignore if tag has
        // 1. "download" attribute
        // 2. rel="external" attribute
        if (el.hasAttribute('download') || el.getAttribute('rel') === 'external') return;

        // ensure non-hash for the same path
        var link = el.getAttribute('href');
        if(!this._hashbang && this._samePath(el) && (el.hash || '#' === link)) return;

        // Check for mailto: in the href
        if (link && link.indexOf('mailto:') > -1) return;

        // check target
        // svg target is an object and its desired value is in .baseVal property
        if (svg ? el.target.baseVal : el.target) return;

        // x-origin
        // note: svg links that are not relative don't call click events (and skip page.js)
        // consequently, all svg links tested inside page.js are relative and in the same origin
        if (!svg && !this.sameOrigin(el.href)) return;

        // rebuild path
        // There aren't .pathname and .search properties in svg links, so we use href
        // Also, svg href is an object and its desired value is in .baseVal property
        var path = svg ? el.href.baseVal : (el.pathname + el.search + (el.hash || ''));

        path = path[0] !== '/' ? '/' + path : path;

        // strip leading "/[drive letter]:" on NW.js on Windows
        if (hasProcess && path.match(/^\/[a-zA-Z]:\//)) {
          path = path.replace(/^\/[a-zA-Z]:\//, '/');
        }

        // same page
        var orig = path;
        var pageBase = this._getBase();

        if (path.indexOf(pageBase) === 0) {
          path = path.substr(pageBase.length);
        }

        if (this._hashbang) path = path.replace('#!', '');

        if (pageBase && orig === path && (!isLocation || this._window.location.protocol !== 'file:')) {
          return;
        }

        e.preventDefault();
        this.show(orig);
      };

      /**
       * Handle "populate" events.
       * @api private
       */

      Page.prototype._onpopstate = (function () {
        var loaded = false;
        if ( ! hasWindow ) {
          return function () {};
        }
        if (hasDocument && document.readyState === 'complete') {
          loaded = true;
        } else {
          window.addEventListener('load', function() {
            setTimeout(function() {
              loaded = true;
            }, 0);
          });
        }
        return function onpopstate(e) {
          if (!loaded) return;
          var page = this;
          if (e.state) {
            var path = e.state.path;
            page.replace(path, e.state);
          } else if (isLocation) {
            var loc = page._window.location;
            page.show(loc.pathname + loc.search + loc.hash, undefined, undefined, false);
          }
        };
      })();

      /**
       * Event button.
       */
      Page.prototype._which = function(e) {
        e = e || (hasWindow && this._window.event);
        return null == e.which ? e.button : e.which;
      };

      /**
       * Convert to a URL object
       * @api private
       */
      Page.prototype._toURL = function(href) {
        var window = this._window;
        if(typeof URL === 'function' && isLocation) {
          return new URL(href, window.location.toString());
        } else if (hasDocument) {
          var anc = window.document.createElement('a');
          anc.href = href;
          return anc;
        }
      };

      /**
       * Check if `href` is the same origin.
       * @param {string} href
       * @api public
       */

      Page.prototype.sameOrigin = function(href) {
        if(!href || !isLocation) return false;

        var url = this._toURL(href);
        var window = this._window;

        var loc = window.location;

        /*
           when the port is the default http port 80, internet explorer 11
           returns an empty string for loc.port, so we need to compare loc.port
           with an empty string if url.port is the default port 80.
        */
        return loc.protocol === url.protocol &&
          loc.hostname === url.hostname &&
          (loc.port === url.port || loc.port === '' && url.port === 80);
      };

      /**
       * @api private
       */
      Page.prototype._samePath = function(url) {
        if(!isLocation) return false;
        var window = this._window;
        var loc = window.location;
        return url.pathname === loc.pathname &&
          url.search === loc.search;
      };

      /**
       * Remove URL encoding from the given `str`.
       * Accommodates whitespace in both x-www-form-urlencoded
       * and regular percent-encoded form.
       *
       * @param {string} val - URL component to decode
       * @api private
       */
      Page.prototype._decodeURLEncodedURIComponent = function(val) {
        if (typeof val !== 'string') { return val; }
        return this._decodeURLComponents ? decodeURIComponent(val.replace(/\+/g, ' ')) : val;
      };

      /**
       * Create a new `page` instance and function
       */
      function createPage() {
        var pageInstance = new Page();

        function pageFn(/* args */) {
          return page.apply(pageInstance, arguments);
        }

        // Copy all of the things over. In 2.0 maybe we use setPrototypeOf
        pageFn.callbacks = pageInstance.callbacks;
        pageFn.exits = pageInstance.exits;
        pageFn.base = pageInstance.base.bind(pageInstance);
        pageFn.strict = pageInstance.strict.bind(pageInstance);
        pageFn.start = pageInstance.start.bind(pageInstance);
        pageFn.stop = pageInstance.stop.bind(pageInstance);
        pageFn.show = pageInstance.show.bind(pageInstance);
        pageFn.back = pageInstance.back.bind(pageInstance);
        pageFn.redirect = pageInstance.redirect.bind(pageInstance);
        pageFn.replace = pageInstance.replace.bind(pageInstance);
        pageFn.dispatch = pageInstance.dispatch.bind(pageInstance);
        pageFn.exit = pageInstance.exit.bind(pageInstance);
        pageFn.configure = pageInstance.configure.bind(pageInstance);
        pageFn.sameOrigin = pageInstance.sameOrigin.bind(pageInstance);
        pageFn.clickHandler = pageInstance.clickHandler.bind(pageInstance);

        pageFn.create = createPage;

        Object.defineProperty(pageFn, 'len', {
          get: function(){
            return pageInstance.len;
          },
          set: function(val) {
            pageInstance.len = val;
          }
        });

        Object.defineProperty(pageFn, 'current', {
          get: function(){
            return pageInstance.current;
          },
          set: function(val) {
            pageInstance.current = val;
          }
        });

        // In 2.0 these can be named exports
        pageFn.Context = Context;
        pageFn.Route = Route;

        return pageFn;
      }

      /**
       * Register `path` with callback `fn()`,
       * or route `path`, or redirection,
       * or `page.start()`.
       *
       *   page(fn);
       *   page('*', fn);
       *   page('/user/:id', load, user);
       *   page('/user/' + user.id, { some: 'thing' });
       *   page('/user/' + user.id);
       *   page('/from', '/to')
       *   page();
       *
       * @param {string|!Function|!Object} path
       * @param {Function=} fn
       * @api public
       */

      function page(path, fn) {
        // <callback>
        if ('function' === typeof path) {
          return page.call(this, '*', path);
        }

        // route <path> to <callback ...>
        if ('function' === typeof fn) {
          var route = new Route(/** @type {string} */ (path), null, this);
          for (var i = 1; i < arguments.length; ++i) {
            this.callbacks.push(route.middleware(arguments[i]));
          }
          // show <path> with [state]
        } else if ('string' === typeof path) {
          this['string' === typeof fn ? 'redirect' : 'show'](path, fn);
          // start [options]
        } else {
          this.start(path);
        }
      }

      /**
       * Unhandled `ctx`. When it's not the initial
       * popstate then redirect. If you wish to handle
       * 404s on your own use `page('*', callback)`.
       *
       * @param {Context} ctx
       * @api private
       */
      function unhandled(ctx) {
        if (ctx.handled) return;
        var current;
        var page = this;
        var window = page._window;

        if (page._hashbang) {
          current = isLocation && this._getBase() + window.location.hash.replace('#!', '');
        } else {
          current = isLocation && window.location.pathname + window.location.search;
        }

        if (current === ctx.canonicalPath) return;
        page.stop();
        ctx.handled = false;
        isLocation && (window.location.href = ctx.canonicalPath);
      }

      /**
       * Escapes RegExp characters in the given string.
       *
       * @param {string} s
       * @api private
       */
      function escapeRegExp(s) {
        return s.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1');
      }

      /**
       * Initialize a new "request" `Context`
       * with the given `path` and optional initial `state`.
       *
       * @constructor
       * @param {string} path
       * @param {Object=} state
       * @api public
       */

      function Context(path, state, pageInstance) {
        var _page = this.page = pageInstance || page;
        var window = _page._window;
        var hashbang = _page._hashbang;

        var pageBase = _page._getBase();
        if ('/' === path[0] && 0 !== path.indexOf(pageBase)) path = pageBase + (hashbang ? '#!' : '') + path;
        var i = path.indexOf('?');

        this.canonicalPath = path;
        var re = new RegExp('^' + escapeRegExp(pageBase));
        this.path = path.replace(re, '') || '/';
        if (hashbang) this.path = this.path.replace('#!', '') || '/';

        this.title = (hasDocument && window.document.title);
        this.state = state || {};
        this.state.path = path;
        this.querystring = ~i ? _page._decodeURLEncodedURIComponent(path.slice(i + 1)) : '';
        this.pathname = _page._decodeURLEncodedURIComponent(~i ? path.slice(0, i) : path);
        this.params = {};

        // fragment
        this.hash = '';
        if (!hashbang) {
          if (!~this.path.indexOf('#')) return;
          var parts = this.path.split('#');
          this.path = this.pathname = parts[0];
          this.hash = _page._decodeURLEncodedURIComponent(parts[1]) || '';
          this.querystring = this.querystring.split('#')[0];
        }
      }

      /**
       * Push state.
       *
       * @api private
       */

      Context.prototype.pushState = function() {
        var page = this.page;
        var window = page._window;
        var hashbang = page._hashbang;

        page.len++;
        if (hasHistory) {
            window.history.pushState(this.state, this.title,
              hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
        }
      };

      /**
       * Save the context state.
       *
       * @api public
       */

      Context.prototype.save = function() {
        var page = this.page;
        if (hasHistory) {
            page._window.history.replaceState(this.state, this.title,
              page._hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
        }
      };

      /**
       * Initialize `Route` with the given HTTP `path`,
       * and an array of `callbacks` and `options`.
       *
       * Options:
       *
       *   - `sensitive`    enable case-sensitive routes
       *   - `strict`       enable strict matching for trailing slashes
       *
       * @constructor
       * @param {string} path
       * @param {Object=} options
       * @api private
       */

      function Route(path, options, page) {
        var _page = this.page = page || globalPage;
        var opts = options || {};
        opts.strict = opts.strict || page._strict;
        this.path = (path === '*') ? '(.*)' : path;
        this.method = 'GET';
        this.regexp = pathToRegexp_1(this.path, this.keys = [], opts);
      }

      /**
       * Return route middleware with
       * the given callback `fn()`.
       *
       * @param {Function} fn
       * @return {Function}
       * @api public
       */

      Route.prototype.middleware = function(fn) {
        var self = this;
        return function(ctx, next) {
          if (self.match(ctx.path, ctx.params)) return fn(ctx, next);
          next();
        };
      };

      /**
       * Check if this route matches `path`, if so
       * populate `params`.
       *
       * @param {string} path
       * @param {Object} params
       * @return {boolean}
       * @api private
       */

      Route.prototype.match = function(path, params) {
        var keys = this.keys,
          qsIndex = path.indexOf('?'),
          pathname = ~qsIndex ? path.slice(0, qsIndex) : path,
          m = this.regexp.exec(decodeURIComponent(pathname));

        if (!m) return false;
    	  
        delete params[0];

        for (var i = 1, len = m.length; i < len; ++i) {
          var key = keys[i - 1];
          var val = this.page._decodeURLEncodedURIComponent(m[i]);
          if (val !== undefined || !(hasOwnProperty.call(params, key.name))) {
            params[key.name] = val;
          }
        }

        return true;
      };


      /**
       * Module exports.
       */

      var globalPage = createPage();
      var page_js = globalPage;
      var default_1 = globalPage;

    page_js.default = default_1;

    return page_js;

    })));
    });

    /* src/atomic/atoms/Header.svelte generated by Svelte v3.19.1 */

    const file = "src/atomic/atoms/Header.svelte";

    function create_fragment(ctx) {
    	let header_1;
    	let div4;
    	let div0;
    	let t0;
    	let t1;
    	let div3;
    	let div1;
    	let t2;
    	let div2;
    	let h6;
    	let t3;

    	const block = {
    		c: function create() {
    			header_1 = element("header");
    			div4 = element("div");
    			div0 = element("div");
    			t0 = text(/*header*/ ctx[0]);
    			t1 = space();
    			div3 = element("div");
    			div1 = element("div");
    			t2 = space();
    			div2 = element("div");
    			h6 = element("h6");
    			t3 = text(/*username*/ ctx[1]);
    			attr_dev(div0, "class", "header-brand svelte-97jvs9");
    			add_location(div0, file, 9, 1, 141);
    			attr_dev(div1, "class", "header-photo svelte-97jvs9");
    			set_style(div1, "background", "url(" + /*profileImg*/ ctx[2] + ") no-repeat center center / cover");
    			add_location(div1, file, 11, 1, 218);
    			add_location(h6, file, 15, 3, 355);
    			attr_dev(div2, "class", "header-username svelte-97jvs9");
    			add_location(div2, file, 14, 1, 322);
    			attr_dev(div3, "class", "header-photo-holder svelte-97jvs9");
    			add_location(div3, file, 10, 1, 183);
    			attr_dev(div4, "class", "header-column svelte-97jvs9");
    			add_location(div4, file, 8, 1, 112);
    			attr_dev(header_1, "class", "header svelte-97jvs9");
    			add_location(header_1, file, 7, 0, 87);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header_1, anchor);
    			append_dev(header_1, div4);
    			append_dev(div4, div0);
    			append_dev(div0, t0);
    			append_dev(div4, t1);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, h6);
    			append_dev(h6, t3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*header*/ 1) set_data_dev(t0, /*header*/ ctx[0]);

    			if (dirty & /*profileImg*/ 4) {
    				set_style(div1, "background", "url(" + /*profileImg*/ ctx[2] + ") no-repeat center center / cover");
    			}

    			if (dirty & /*username*/ 2) set_data_dev(t3, /*username*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { header } = $$props;
    	let { username } = $$props;
    	let { profileImg } = $$props;
    	const writable_props = ["header", "username", "profileImg"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("header" in $$props) $$invalidate(0, header = $$props.header);
    		if ("username" in $$props) $$invalidate(1, username = $$props.username);
    		if ("profileImg" in $$props) $$invalidate(2, profileImg = $$props.profileImg);
    	};

    	$$self.$capture_state = () => ({ header, username, profileImg });

    	$$self.$inject_state = $$props => {
    		if ("header" in $$props) $$invalidate(0, header = $$props.header);
    		if ("username" in $$props) $$invalidate(1, username = $$props.username);
    		if ("profileImg" in $$props) $$invalidate(2, profileImg = $$props.profileImg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [header, username, profileImg];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { header: 0, username: 1, profileImg: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*header*/ ctx[0] === undefined && !("header" in props)) {
    			console.warn("<Header> was created without expected prop 'header'");
    		}

    		if (/*username*/ ctx[1] === undefined && !("username" in props)) {
    			console.warn("<Header> was created without expected prop 'username'");
    		}

    		if (/*profileImg*/ ctx[2] === undefined && !("profileImg" in props)) {
    			console.warn("<Header> was created without expected prop 'profileImg'");
    		}
    	}

    	get header() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set header(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get username() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set username(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get profileImg() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set profileImg(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/atomic/atoms/Navbar.svelte generated by Svelte v3.19.1 */

    const file$1 = "src/atomic/atoms/Navbar.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (9:2) {#each links as link (link.label)}
    function create_each_block(key_1, ctx) {
    	let a;
    	let t0_value = /*link*/ ctx[2].label + "";
    	let t0;
    	let t1;
    	let a_href_value;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(a, "href", a_href_value = /*link*/ ctx[2].to);
    			attr_dev(a, "class", "navbar-link svelte-1ygt8tz");
    			toggle_class(a, "is-selected", /*link*/ ctx[2].to === /*route*/ ctx[1]);
    			add_location(a, file$1, 9, 3, 199);
    			this.first = a;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t0);
    			append_dev(a, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*links*/ 1 && t0_value !== (t0_value = /*link*/ ctx[2].label + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*links*/ 1 && a_href_value !== (a_href_value = /*link*/ ctx[2].to)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*links, route*/ 3) {
    				toggle_class(a, "is-selected", /*link*/ ctx[2].to === /*route*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(9:2) {#each links as link (link.label)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let navbar;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value = /*links*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*link*/ ctx[2].label;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			navbar = element("navbar");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(navbar, "class", "navbar svelte-1ygt8tz");
    			add_location(navbar, file$1, 7, 2, 135);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, navbar, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(navbar, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*links, route*/ 3) {
    				const each_value = /*links*/ ctx[0];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, navbar, destroy_block, create_each_block, null, get_each_context);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(navbar);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { links = [] } = $$props;
    	let { route = "/" } = $$props;
    	const writable_props = ["links", "route"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("links" in $$props) $$invalidate(0, links = $$props.links);
    		if ("route" in $$props) $$invalidate(1, route = $$props.route);
    	};

    	$$self.$capture_state = () => ({ links, route });

    	$$self.$inject_state = $$props => {
    		if ("links" in $$props) $$invalidate(0, links = $$props.links);
    		if ("route" in $$props) $$invalidate(1, route = $$props.route);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [links, route];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { links: 0, route: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get links() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set links(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get route() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set route(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/atomic/atoms/Footer.svelte generated by Svelte v3.19.1 */

    const file$2 = "src/atomic/atoms/Footer.svelte";

    function create_fragment$2(ctx) {
    	let footer_1;
    	let t;

    	const block = {
    		c: function create() {
    			footer_1 = element("footer");
    			t = text(/*footer*/ ctx[0]);
    			attr_dev(footer_1, "class", "footer svelte-5hcj6j");
    			add_location(footer_1, file$2, 4, 2, 71);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer_1, anchor);
    			append_dev(footer_1, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*footer*/ 1) set_data_dev(t, /*footer*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { footer = "Copyright © 2018 yourapp" } = $$props;
    	const writable_props = ["footer"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("footer" in $$props) $$invalidate(0, footer = $$props.footer);
    	};

    	$$self.$capture_state = () => ({ footer });

    	$$self.$inject_state = $$props => {
    		if ("footer" in $$props) $$invalidate(0, footer = $$props.footer);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [footer];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { footer: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get footer() {
    		throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set footer(value) {
    		throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/atomic/pages/About.svelte generated by Svelte v3.19.1 */

    const file$3 = "src/atomic/pages/About.svelte";

    function create_fragment$3(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "About Page";
    			attr_dev(div0, "class", "body-column");
    			add_location(div0, file$3, 1, 4, 25);
    			attr_dev(div1, "class", "body");
    			add_location(div1, file$3, 0, 2, 2);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const state = {
      books: [
        { title: 'Emotional Intelligence', author: 'Daniel Goleman' },
        { title: 'The Gift of Fear', author: 'Gavin de Becker' },
        {
          title: 'Influence: The Psychology of Persuasion',
          author: 'Robert B. Cialdini'
        },
        { title: 'The 48 Laws of Powers', author: 'Robert Greene' },
        { title: 'The Art of Seduction', author: 'Robert Greene' },
        { title: 'Mastery', author: 'Robert Greene' },
        {
          title: 'The Tipping Point: How Little Things can Make a Big Difference',
          author: 'Malcolm T. Gladwell'
        },
        {
          title: 'Blink: The Power of Thinking Without Thinking',
          author: 'Malcolm T. Gladwell'
        },
        { title: 'Outliers: The Story of Success', author: 'Malcolm T. Gladwell' },
        {
          title: 'What the Dog Saw: And other Adventures',
          author: 'Malcolm T. Gladwell'
        },
        {
          title:
            'David and Goliath: Underdogs, Misfits, and the Art of Battling Giants',
          author: 'Malcolm T. Gladwell'
        },
        { title: 'Lateral Thinking', author: 'Edward de Bono' },
        { title: 'Simplicity', author: 'Edward de Bono' },
        { title: 'Six Thinking Hats', author: 'Edward de Bono' },
        { title: 'Po: Beyond Yes and No', author: 'Edward de Bono' },
        {
          title:
            'Emotional Blackmail: When the People in Your Life Use Fear, Obligation, and Guilt to Manipulate You',
          author: 'Susan Forward'
        },
        {
          title: 'Games People Play: The Psychology of Human Relationships',
          author: 'Eric Berne'
        },
        {
          title:
            '50 Psychology Classics: Who We Are, How We Think, What We Do: Insight and Inspiration from 50 Key Books',
          author: 'Tom Butler Bowdown'
        },
        { title: 'The Psychology of Self Esteem', author: 'Nathaniel Branden' },
        {
          title: 'Creativity: Flow and the Psychology of Discovery and Inventions',
          author: 'Mihaly Csikzentmihalyi'
        },
        { title: 'My Voice Will Go With You', author: 'Milton Erikson' },
        {
          title: 'How Technology is Changing our Minds for the Better.',
          author: 'Clive Thompson'
        }
      ]
    };

    /* src/atomic/pages/Book.svelte generated by Svelte v3.19.1 */
    const file$4 = "src/atomic/pages/Book.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (17:1) {#each books as book (book.title)}
    function create_each_block$1(key_1, ctx) {
    	let div;
    	let t0_value = /*book*/ ctx[1].title + "";
    	let t0;
    	let t1;
    	let i;
    	let t2_value = /*book*/ ctx[1].author + "";
    	let t2;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = text(" - ");
    			i = element("i");
    			t2 = text(t2_value);
    			attr_dev(i, "class", "svelte-13ebhzq");
    			add_location(i, file$4, 17, 43, 436);
    			attr_dev(div, "class", "book svelte-13ebhzq");
    			add_location(div, file$4, 17, 10, 403);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, i);
    			append_dev(i, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(17:1) {#each books as book (book.title)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div3;
    	let div2;
    	let h1;
    	let t1;
    	let br0;
    	let t2;
    	let div0;
    	let t4;
    	let br1;
    	let t5;
    	let div1;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t6;
    	let br2;
    	let each_value = /*books*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*book*/ ctx[1].title;
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Books I read";
    			t1 = space();
    			br0 = element("br");
    			t2 = space();
    			div0 = element("div");
    			div0.textContent = "you can't buy happiness but you can buy books ... and that's kind of the same thing";
    			t4 = space();
    			br1 = element("br");
    			t5 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			br2 = element("br");
    			add_location(h1, file$4, 7, 6, 144);
    			add_location(br0, file$4, 8, 6, 172);
    			attr_dev(div0, "class", "quote");
    			add_location(div0, file$4, 10, 6, 186);
    			add_location(br1, file$4, 13, 6, 317);
    			attr_dev(div1, "class", "book-holder svelte-13ebhzq");
    			add_location(div1, file$4, 15, 6, 331);
    			add_location(br2, file$4, 20, 6, 491);
    			attr_dev(div2, "class", "body-column");
    			add_location(div2, file$4, 6, 4, 112);
    			attr_dev(div3, "class", "body");
    			add_location(div3, file$4, 5, 2, 89);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, h1);
    			append_dev(div2, t1);
    			append_dev(div2, br0);
    			append_dev(div2, t2);
    			append_dev(div2, div0);
    			append_dev(div2, t4);
    			append_dev(div2, br1);
    			append_dev(div2, t5);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div2, t6);
    			append_dev(div2, br2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*books*/ 1) {
    				const each_value = /*books*/ ctx[0];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div1, destroy_block, create_each_block$1, null, get_each_context$1);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	const { books } = state;
    	$$self.$capture_state = () => ({ state, books });
    	return [books];
    }

    class Book extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Book",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/atomic/pages/Contact.svelte generated by Svelte v3.19.1 */

    const file$5 = "src/atomic/pages/Contact.svelte";

    function create_fragment$5(ctx) {
    	let div4;
    	let div3;
    	let h1;
    	let t1;
    	let p0;
    	let t3;
    	let p1;
    	let t5;
    	let br0;
    	let t6;
    	let div0;
    	let b0;
    	let t8;
    	let a0;
    	let t10;
    	let br1;
    	let t11;
    	let div1;
    	let b1;
    	let t13;
    	let a1;
    	let t15;
    	let br2;
    	let t16;
    	let div2;
    	let b2;
    	let t18;
    	let a2;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Contact Me";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "I am a Developer based in Malaysia. I do Frontend, Backend and DevOps related stuff. To understand more about what I am doing at present, follow me on Github.";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "Please email me to request for my resume.";
    			t5 = space();
    			br0 = element("br");
    			t6 = space();
    			div0 = element("div");
    			b0 = element("b");
    			b0.textContent = "Email:";
    			t8 = space();
    			a0 = element("a");
    			a0.textContent = "alextan220990@gmail.com";
    			t10 = space();
    			br1 = element("br");
    			t11 = space();
    			div1 = element("div");
    			b1 = element("b");
    			b1.textContent = "Behance:";
    			t13 = space();
    			a1 = element("a");
    			a1.textContent = "https://www.behance.net/alextan220e3ae";
    			t15 = space();
    			br2 = element("br");
    			t16 = space();
    			div2 = element("div");
    			b2 = element("b");
    			b2.textContent = "Github:";
    			t18 = space();
    			a2 = element("a");
    			a2.textContent = "https://github.com/alextanhongpin";
    			add_location(h1, file$5, 2, 6, 57);
    			add_location(p0, file$5, 3, 6, 83);
    			add_location(p1, file$5, 4, 6, 255);
    			add_location(br0, file$5, 5, 6, 310);
    			add_location(b0, file$5, 7, 11, 329);
    			attr_dev(a0, "href", "mailto:alextan220990@gmail.com");
    			add_location(a0, file$5, 7, 25, 343);
    			add_location(div0, file$5, 7, 6, 324);
    			add_location(br1, file$5, 8, 6, 424);
    			add_location(b1, file$5, 10, 11, 443);
    			attr_dev(a1, "href", "https://www.behance.net/alextan220e3ae");
    			attr_dev(a1, "target", "_blank");
    			add_location(a1, file$5, 10, 27, 459);
    			add_location(div1, file$5, 10, 6, 438);
    			add_location(br2, file$5, 11, 6, 579);
    			add_location(b2, file$5, 13, 11, 604);
    			attr_dev(a2, "href", "https://github.com/alextanhongpin");
    			attr_dev(a2, "target", "_blank");
    			add_location(a2, file$5, 13, 26, 619);
    			add_location(div2, file$5, 13, 6, 599);
    			attr_dev(div3, "class", "body-column");
    			add_location(div3, file$5, 1, 4, 25);
    			attr_dev(div4, "class", "body");
    			add_location(div4, file$5, 0, 2, 2);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, h1);
    			append_dev(div3, t1);
    			append_dev(div3, p0);
    			append_dev(div3, t3);
    			append_dev(div3, p1);
    			append_dev(div3, t5);
    			append_dev(div3, br0);
    			append_dev(div3, t6);
    			append_dev(div3, div0);
    			append_dev(div0, b0);
    			append_dev(div0, t8);
    			append_dev(div0, a0);
    			append_dev(div3, t10);
    			append_dev(div3, br1);
    			append_dev(div3, t11);
    			append_dev(div3, div1);
    			append_dev(div1, b1);
    			append_dev(div1, t13);
    			append_dev(div1, a1);
    			append_dev(div3, t15);
    			append_dev(div3, br2);
    			append_dev(div3, t16);
    			append_dev(div3, div2);
    			append_dev(div2, b2);
    			append_dev(div2, t18);
    			append_dev(div2, a2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Contact extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Contact",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    // A utility to mimic sleep

     async function pause (duration = Math.round(Math.random() * 15 + 25)) {
       return new Promise((resolve, reject) => {
         window.setTimeout(resolve, duration);
       })
     }

    async function type (max, counter = 0, callback) {
      if (counter < max) {
        callback && callback(counter);
        await pause();
        return type(max, counter + 1, callback)
      }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const state$1 = {
      heading: writable(''),
      headingGhost: 'Hi, I am Alex.',
      subheading: writable(''),
      subheadingGhost: 'This is my journey as a Developer.'
    };

    const { heading, subheading } = state$1;

    const actions$1 = {
      updateHeading (next) {
        heading.update(prev => prev + next);
      },
      updateSubheading (next) {
        subheading.update(prev => prev + next);
      },
      clear() {
        heading.set('');
        subheading.set('');
      }
    };

    var typewriter = {
      state: state$1,
      actions: actions$1
    };

    /* src/atomic/pages/Home.svelte generated by Svelte v3.19.1 */
    const file$6 = "src/atomic/pages/Home.svelte";

    // (31:1) {#if heading.length !== headingGhost.length}
    function create_if_block_1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "caret");
    			add_location(span, file$6, 31, 2, 797);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(31:1) {#if heading.length !== headingGhost.length}",
    		ctx
    	});

    	return block;
    }

    // (37:1) {#if subheading.length !== subheadingGhost.length}
    function create_if_block(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "caret is-active");
    			add_location(span, file$6, 37, 2, 927);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(37:1) {#if subheading.length !== subheadingGhost.length}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div1;
    	let div0;
    	let h10;
    	let t0;
    	let t1;
    	let t2;
    	let h11;
    	let t3;
    	let t4;
    	let if_block0 = /*heading*/ ctx[2].length !== /*headingGhost*/ ctx[4].length && create_if_block_1(ctx);
    	let if_block1 = /*subheading*/ ctx[3].length !== /*subheadingGhost*/ ctx[5].length && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h10 = element("h1");
    			t0 = text(/*$heading*/ ctx[0]);
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			h11 = element("h1");
    			t3 = text(/*$subheading*/ ctx[1]);
    			t4 = space();
    			if (if_block1) if_block1.c();
    			add_location(h10, file$6, 28, 6, 725);
    			add_location(h11, file$6, 34, 6, 846);
    			attr_dev(div0, "class", "body-column");
    			add_location(div0, file$6, 27, 4, 693);
    			attr_dev(div1, "class", "body");
    			add_location(div1, file$6, 26, 2, 670);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h10);
    			append_dev(h10, t0);
    			append_dev(h10, t1);
    			if (if_block0) if_block0.m(h10, null);
    			append_dev(div0, t2);
    			append_dev(div0, h11);
    			append_dev(h11, t3);
    			append_dev(h11, t4);
    			if (if_block1) if_block1.m(h11, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$heading*/ 1) set_data_dev(t0, /*$heading*/ ctx[0]);
    			if (dirty & /*$subheading*/ 2) set_data_dev(t3, /*$subheading*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function startTyping(actions, heading, subheading) {
    	await type(heading.length, 0, counter => actions.updateHeading(heading[counter]));
    	await pause(250);
    	await type(subheading.length, 0, counter => actions.updateSubheading(subheading[counter]));
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $heading;
    	let $subheading;
    	const { heading, subheading, headingGhost, subheadingGhost } = state$1;
    	validate_store(heading, "heading");
    	component_subscribe($$self, heading, value => $$invalidate(0, $heading = value));
    	validate_store(subheading, "subheading");
    	component_subscribe($$self, subheading, value => $$invalidate(1, $subheading = value));

    	if (!heading.length && !subheading.length) {
    		startTyping(actions$1, headingGhost.split(""), subheadingGhost.split(""));
    	}

    	$$self.$capture_state = () => ({
    		type,
    		pause,
    		state: state$1,
    		actions: actions$1,
    		heading,
    		subheading,
    		headingGhost,
    		subheadingGhost,
    		startTyping,
    		$heading,
    		$subheading
    	});

    	return [$heading, $subheading, heading, subheading, headingGhost, subheadingGhost];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const state$2 = {
      songs: [
        'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/157502847&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true',
        'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/153449882&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true',
        'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/150634086&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true',
        'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/150323475&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true'
      ]
    };

    /* src/atomic/pages/Guitar.svelte generated by Svelte v3.19.1 */
    const file$7 = "src/atomic/pages/Guitar.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (22:7) {#each songs as song}
    function create_each_block$2(ctx) {
    	let div;
    	let iframe;
    	let iframe_src_value;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			iframe = element("iframe");
    			t = space();
    			attr_dev(iframe, "width", "100%");
    			attr_dev(iframe, "height", "166");
    			attr_dev(iframe, "scrolling", "no");
    			attr_dev(iframe, "frameborder", "no");
    			attr_dev(iframe, "allow", "autoplay");
    			if (iframe.src !== (iframe_src_value = /*song*/ ctx[1])) attr_dev(iframe, "src", iframe_src_value);
    			add_location(iframe, file$7, 23, 6, 598);
    			attr_dev(div, "class", "guitar");
    			add_location(div, file$7, 22, 4, 571);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, iframe);
    			append_dev(div, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(22:7) {#each songs as song}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div3;
    	let div2;
    	let h1;
    	let t1;
    	let p;
    	let t2;
    	let i0;
    	let t4;
    	let t5;
    	let br0;
    	let t6;
    	let div0;
    	let t7;
    	let i1;
    	let small;
    	let t9;
    	let br1;
    	let t10;
    	let br2;
    	let t11;
    	let div1;
    	let t12;
    	let br3;
    	let t13;
    	let each_value = /*songs*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Songs I play";
    			t1 = space();
    			p = element("p");
    			t2 = text("I don't play guitar as much as I do anymore. These are some of the fingerstyle guitar solos that I recorded using ");
    			i0 = element("i");
    			i0.textContent = "Zoom H1";
    			t4 = text(". Enjoy!");
    			t5 = space();
    			br0 = element("br");
    			t6 = space();
    			div0 = element("div");
    			t7 = text("I just want to be a guy with a guitar - ");
    			i1 = element("i");
    			small = element("small");
    			small.textContent = "Jeff Buckley";
    			t9 = space();
    			br1 = element("br");
    			t10 = space();
    			br2 = element("br");
    			t11 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t12 = space();
    			br3 = element("br");
    			t13 = text("\n\nexport default page");
    			add_location(h1, file$7, 7, 6, 146);
    			add_location(i0, file$7, 10, 122, 301);
    			add_location(p, file$7, 9, 6, 175);
    			add_location(br0, file$7, 12, 6, 341);
    			add_location(small, file$7, 15, 51, 432);
    			add_location(i1, file$7, 15, 48, 429);
    			attr_dev(div0, "class", "quote");
    			add_location(div0, file$7, 14, 6, 361);
    			add_location(br1, file$7, 17, 6, 483);
    			add_location(br2, file$7, 18, 6, 496);
    			attr_dev(div1, "class", "guitar-holder svelte-og4i3o");
    			add_location(div1, file$7, 20, 6, 510);
    			add_location(br3, file$7, 28, 6, 741);
    			attr_dev(div2, "class", "body-column");
    			add_location(div2, file$7, 6, 4, 114);
    			attr_dev(div3, "class", "body");
    			add_location(div3, file$7, 5, 2, 91);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, h1);
    			append_dev(div2, t1);
    			append_dev(div2, p);
    			append_dev(p, t2);
    			append_dev(p, i0);
    			append_dev(p, t4);
    			append_dev(div2, t5);
    			append_dev(div2, br0);
    			append_dev(div2, t6);
    			append_dev(div2, div0);
    			append_dev(div0, t7);
    			append_dev(div0, i1);
    			append_dev(i1, small);
    			append_dev(div2, t9);
    			append_dev(div2, br1);
    			append_dev(div2, t10);
    			append_dev(div2, br2);
    			append_dev(div2, t11);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div2, t12);
    			append_dev(div2, br3);
    			insert_dev(target, t13, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*songs*/ 1) {
    				each_value = /*songs*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t13);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	const { songs } = state$2;
    	$$self.$capture_state = () => ({ state: state$2, songs });
    	return [songs];
    }

    class Guitar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Guitar",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/atomic/pages/Programming.svelte generated by Svelte v3.19.1 */

    const file$8 = "src/atomic/pages/Programming.svelte";

    function create_fragment$8(ctx) {
    	let div1;
    	let div0;
    	let h1;
    	let t1;
    	let p;
    	let t3;
    	let section0;
    	let h30;
    	let t5;
    	let iframe0;
    	let iframe0_src_value;
    	let t6;
    	let section1;
    	let h31;
    	let t8;
    	let iframe1;
    	let iframe1_src_value;
    	let t9;
    	let section2;
    	let h32;
    	let t11;
    	let iframe2;
    	let iframe2_src_value;
    	let t12;
    	let section3;
    	let h33;
    	let t14;
    	let iframe3;
    	let iframe3_src_value;
    	let t15;
    	let section4;
    	let h34;
    	let t17;
    	let iframe4;
    	let iframe4_src_value;
    	let t18;
    	let section5;
    	let h35;
    	let t20;
    	let iframe5;
    	let iframe5_src_value;
    	let t21;
    	let section6;
    	let h36;
    	let t23;
    	let iframe6;
    	let iframe6_src_value;
    	let t24;
    	let section7;
    	let h37;
    	let t26;
    	let iframe7;
    	let iframe7_src_value;
    	let t27;
    	let section8;
    	let h38;
    	let t29;
    	let iframe8;
    	let iframe8_src_value;
    	let t30;
    	let section9;
    	let h39;
    	let t32;
    	let iframe9;
    	let iframe9_src_value;
    	let t33;
    	let section10;
    	let h310;
    	let t35;
    	let a;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Programming";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Joy is when you write code for yourself - alextanhongpin";
    			t3 = space();
    			section0 = element("section");
    			h30 = element("h3");
    			h30.textContent = "Digital Piano";
    			t5 = space();
    			iframe0 = element("iframe");
    			t6 = space();
    			section1 = element("section");
    			h31 = element("h3");
    			h31.textContent = "Calculator";
    			t8 = space();
    			iframe1 = element("iframe");
    			t9 = space();
    			section2 = element("section");
    			h32 = element("h3");
    			h32.textContent = "Analog Clock";
    			t11 = space();
    			iframe2 = element("iframe");
    			t12 = space();
    			section3 = element("section");
    			h33 = element("h3");
    			h33.textContent = "Binary Clock";
    			t14 = space();
    			iframe3 = element("iframe");
    			t15 = space();
    			section4 = element("section");
    			h34 = element("h3");
    			h34.textContent = "Malaysia Flag";
    			t17 = space();
    			iframe4 = element("iframe");
    			t18 = space();
    			section5 = element("section");
    			h35 = element("h3");
    			h35.textContent = "Image Magnifier";
    			t20 = space();
    			iframe5 = element("iframe");
    			t21 = space();
    			section6 = element("section");
    			h36 = element("h3");
    			h36.textContent = "Brownian Movement";
    			t23 = space();
    			iframe6 = element("iframe");
    			t24 = space();
    			section7 = element("section");
    			h37 = element("h3");
    			h37.textContent = "Matrix";
    			t26 = space();
    			iframe7 = element("iframe");
    			t27 = space();
    			section8 = element("section");
    			h38 = element("h3");
    			h38.textContent = "3D Cube";
    			t29 = space();
    			iframe8 = element("iframe");
    			t30 = space();
    			section9 = element("section");
    			h39 = element("h3");
    			h39.textContent = "Unbeatable Tic Tac Toc";
    			t32 = space();
    			iframe9 = element("iframe");
    			t33 = space();
    			section10 = element("section");
    			h310 = element("h3");
    			h310.textContent = "Asteroid";
    			t35 = space();
    			a = element("a");
    			a.textContent = "Play it here";
    			add_location(h1, file$8, 2, 6, 57);
    			add_location(p, file$8, 3, 6, 84);
    			add_location(h30, file$8, 6, 8, 188);
    			attr_dev(iframe0, "class", "iframe svelte-1c6qyju");
    			if (iframe0.src !== (iframe0_src_value = "/programming/p00_piano.html")) attr_dev(iframe0, "src", iframe0_src_value);
    			add_location(iframe0, file$8, 7, 8, 219);
    			attr_dev(section0, "class", "col-10 svelte-1c6qyju");
    			add_location(section0, file$8, 5, 6, 155);
    			add_location(h31, file$8, 11, 8, 336);
    			attr_dev(iframe1, "class", "iframe svelte-1c6qyju");
    			if (iframe1.src !== (iframe1_src_value = "/programming/p01_calculator.html")) attr_dev(iframe1, "src", iframe1_src_value);
    			add_location(iframe1, file$8, 12, 8, 364);
    			attr_dev(section1, "class", "col-10 svelte-1c6qyju");
    			add_location(section1, file$8, 10, 6, 303);
    			add_location(h32, file$8, 16, 8, 486);
    			attr_dev(iframe2, "class", "iframe svelte-1c6qyju");
    			if (iframe2.src !== (iframe2_src_value = "/programming/p02_clock.html")) attr_dev(iframe2, "src", iframe2_src_value);
    			add_location(iframe2, file$8, 17, 8, 516);
    			attr_dev(section2, "class", "col-10 svelte-1c6qyju");
    			add_location(section2, file$8, 15, 6, 453);
    			add_location(h33, file$8, 21, 8, 633);
    			attr_dev(iframe3, "class", "iframe svelte-1c6qyju");
    			if (iframe3.src !== (iframe3_src_value = "/programming/p03_binary%20clock.html")) attr_dev(iframe3, "src", iframe3_src_value);
    			add_location(iframe3, file$8, 22, 8, 663);
    			attr_dev(section3, "class", "col-10 svelte-1c6qyju");
    			add_location(section3, file$8, 20, 6, 600);
    			add_location(h34, file$8, 26, 8, 789);
    			attr_dev(iframe4, "class", "iframe svelte-1c6qyju");
    			if (iframe4.src !== (iframe4_src_value = "/programming/p06_flag_of_malaysia.html")) attr_dev(iframe4, "src", iframe4_src_value);
    			add_location(iframe4, file$8, 27, 8, 820);
    			attr_dev(section4, "class", "col-10 svelte-1c6qyju");
    			add_location(section4, file$8, 25, 6, 756);
    			add_location(h35, file$8, 31, 8, 948);
    			attr_dev(iframe5, "class", "iframe svelte-1c6qyju");
    			if (iframe5.src !== (iframe5_src_value = "/programming/p05_magnifier%20macro.html")) attr_dev(iframe5, "src", iframe5_src_value);
    			add_location(iframe5, file$8, 32, 8, 981);
    			attr_dev(section5, "class", "col-10 svelte-1c6qyju");
    			add_location(section5, file$8, 30, 6, 915);
    			add_location(h36, file$8, 36, 8, 1110);
    			attr_dev(iframe6, "class", "iframe svelte-1c6qyju");
    			if (iframe6.src !== (iframe6_src_value = "/programming/p07_box2d%20bouncing%20ball.html")) attr_dev(iframe6, "src", iframe6_src_value);
    			add_location(iframe6, file$8, 37, 8, 1145);
    			attr_dev(section6, "class", "col-10 svelte-1c6qyju");
    			add_location(section6, file$8, 35, 6, 1077);
    			add_location(h37, file$8, 44, 8, 1308);
    			attr_dev(iframe7, "class", "iframe svelte-1c6qyju");
    			if (iframe7.src !== (iframe7_src_value = "/programming/p08_matrix.html")) attr_dev(iframe7, "src", iframe7_src_value);
    			add_location(iframe7, file$8, 45, 8, 1332);
    			attr_dev(section7, "class", "col-10 svelte-1c6qyju");
    			add_location(section7, file$8, 43, 6, 1275);
    			add_location(h38, file$8, 49, 8, 1450);
    			attr_dev(iframe8, "class", "iframe svelte-1c6qyju");
    			if (iframe8.src !== (iframe8_src_value = "/programming/p13_cube3d.html")) attr_dev(iframe8, "src", iframe8_src_value);
    			add_location(iframe8, file$8, 50, 8, 1475);
    			attr_dev(section8, "class", "col-10 svelte-1c6qyju");
    			add_location(section8, file$8, 48, 6, 1417);
    			add_location(h39, file$8, 54, 8, 1593);
    			attr_dev(iframe9, "class", "iframe svelte-1c6qyju");
    			if (iframe9.src !== (iframe9_src_value = "/programming/p14_tictactoe.html")) attr_dev(iframe9, "src", iframe9_src_value);
    			add_location(iframe9, file$8, 55, 8, 1633);
    			attr_dev(section9, "class", "col-10 svelte-1c6qyju");
    			add_location(section9, file$8, 53, 6, 1560);
    			add_location(h310, file$8, 59, 8, 1754);
    			attr_dev(a, "href", "/games");
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$8, 60, 8, 1780);
    			attr_dev(section10, "class", "col-10 svelte-1c6qyju");
    			add_location(section10, file$8, 58, 6, 1721);
    			attr_dev(div0, "class", "body-column");
    			add_location(div0, file$8, 1, 4, 25);
    			attr_dev(div1, "class", "body");
    			add_location(div1, file$8, 0, 2, 2);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			append_dev(div0, p);
    			append_dev(div0, t3);
    			append_dev(div0, section0);
    			append_dev(section0, h30);
    			append_dev(section0, t5);
    			append_dev(section0, iframe0);
    			append_dev(div0, t6);
    			append_dev(div0, section1);
    			append_dev(section1, h31);
    			append_dev(section1, t8);
    			append_dev(section1, iframe1);
    			append_dev(div0, t9);
    			append_dev(div0, section2);
    			append_dev(section2, h32);
    			append_dev(section2, t11);
    			append_dev(section2, iframe2);
    			append_dev(div0, t12);
    			append_dev(div0, section3);
    			append_dev(section3, h33);
    			append_dev(section3, t14);
    			append_dev(section3, iframe3);
    			append_dev(div0, t15);
    			append_dev(div0, section4);
    			append_dev(section4, h34);
    			append_dev(section4, t17);
    			append_dev(section4, iframe4);
    			append_dev(div0, t18);
    			append_dev(div0, section5);
    			append_dev(section5, h35);
    			append_dev(section5, t20);
    			append_dev(section5, iframe5);
    			append_dev(div0, t21);
    			append_dev(div0, section6);
    			append_dev(section6, h36);
    			append_dev(section6, t23);
    			append_dev(section6, iframe6);
    			append_dev(div0, t24);
    			append_dev(div0, section7);
    			append_dev(section7, h37);
    			append_dev(section7, t26);
    			append_dev(section7, iframe7);
    			append_dev(div0, t27);
    			append_dev(div0, section8);
    			append_dev(section8, h38);
    			append_dev(section8, t29);
    			append_dev(section8, iframe8);
    			append_dev(div0, t30);
    			append_dev(div0, section9);
    			append_dev(section9, h39);
    			append_dev(section9, t32);
    			append_dev(section9, iframe9);
    			append_dev(div0, t33);
    			append_dev(div0, section10);
    			append_dev(section10, h310);
    			append_dev(section10, t35);
    			append_dev(section10, a);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Programming extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Programming",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/atomic/pages/Photography/Main.svelte generated by Svelte v3.19.1 */

    const file$9 = "src/atomic/pages/Photography/Main.svelte";

    function create_fragment$9(ctx) {
    	let div;
    	let a0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let a1;
    	let img1;
    	let img1_src_value;
    	let t1;
    	let a2;
    	let img2;
    	let img2_src_value;
    	let t2;
    	let a3;
    	let img3;
    	let img3_src_value;
    	let t3;
    	let a4;
    	let img4;
    	let img4_src_value;
    	let t4;
    	let a5;
    	let img5;
    	let img5_src_value;
    	let t5;
    	let a6;
    	let img6;
    	let img6_src_value;
    	let t6;
    	let a7;
    	let img7;
    	let img7_src_value;
    	let t7;
    	let a8;
    	let img8;
    	let img8_src_value;
    	let t8;
    	let a9;
    	let img9;
    	let img9_src_value;
    	let t9;
    	let a10;
    	let img10;
    	let img10_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			a0 = element("a");
    			img0 = element("img");
    			t0 = space();
    			a1 = element("a");
    			img1 = element("img");
    			t1 = space();
    			a2 = element("a");
    			img2 = element("img");
    			t2 = space();
    			a3 = element("a");
    			img3 = element("img");
    			t3 = space();
    			a4 = element("a");
    			img4 = element("img");
    			t4 = space();
    			a5 = element("a");
    			img5 = element("img");
    			t5 = space();
    			a6 = element("a");
    			img6 = element("img");
    			t6 = space();
    			a7 = element("a");
    			img7 = element("img");
    			t7 = space();
    			a8 = element("a");
    			img8 = element("img");
    			t8 = space();
    			a9 = element("a");
    			img9 = element("img");
    			t9 = space();
    			a10 = element("a");
    			img10 = element("img");
    			attr_dev(img0, "class", "photo-album svelte-13sv805");
    			if (img0.src !== (img0_src_value = "/assets/img/photography/01-christmas_market/DSCF2052_small.jpg")) attr_dev(img0, "src", img0_src_value);
    			add_location(img0, file$9, 5, 6, 153);
    			attr_dev(a0, "href", "/photos/christmas-market");
    			attr_dev(a0, "data-title", "Christmas Market 2015");
    			attr_dev(a0, "class", "photo-album-link svelte-13sv805");
    			add_location(a0, file$9, 1, 4, 33);
    			attr_dev(img1, "class", "photo-album svelte-13sv805");
    			if (img1.src !== (img1_src_value = "/assets/img/photography/02-malaysia/DSCF2336_small.jpg")) attr_dev(img1, "src", img1_src_value);
    			add_location(img1, file$9, 12, 6, 367);
    			attr_dev(a1, "href", "/photos/malaysia");
    			attr_dev(a1, "data-title", "Kuala Lumpur");
    			attr_dev(a1, "class", "photo-album-link svelte-13sv805");
    			add_location(a1, file$9, 8, 4, 264);
    			attr_dev(img2, "class", "photo-album svelte-13sv805");
    			if (img2.src !== (img2_src_value = "/assets/img/photography/11-kl-life/DSCF3511.jpg")) attr_dev(img2, "src", img2_src_value);
    			add_location(img2, file$9, 19, 6, 567);
    			attr_dev(a2, "href", "/photos/kl-life");
    			attr_dev(a2, "data-title", "KL Life");
    			attr_dev(a2, "class", "photo-album-link svelte-13sv805");
    			add_location(a2, file$9, 15, 4, 470);
    			attr_dev(img3, "class", "photo-album svelte-13sv805");
    			if (img3.src !== (img3_src_value = "/assets/img/photography/06-danboard/IMG_4735_edited_small.jpg")) attr_dev(img3, "src", img3_src_value);
    			add_location(img3, file$9, 26, 6, 762);
    			attr_dev(a3, "href", "/photos/danboard");
    			attr_dev(a3, "data-title", "Danboard");
    			attr_dev(a3, "class", "photo-album-link svelte-13sv805");
    			add_location(a3, file$9, 22, 4, 663);
    			attr_dev(img4, "class", "photo-album svelte-13sv805");
    			if (img4.src !== (img4_src_value = "/assets/img/photography/07-preiser_figure/06_small.jpg")) attr_dev(img4, "src", img4_src_value);
    			add_location(img4, file$9, 33, 6, 983);
    			attr_dev(a4, "href", "/photos/preiser-figure");
    			attr_dev(a4, "data-title", "Preiser Figure");
    			attr_dev(a4, "class", "photo-album-link svelte-13sv805");
    			add_location(a4, file$9, 29, 4, 872);
    			attr_dev(img5, "class", "photo-album svelte-13sv805");
    			if (img5.src !== (img5_src_value = "/assets/img/photography/05-berlin_trip/DSCF2626_small.jpeg")) attr_dev(img5, "src", img5_src_value);
    			add_location(img5, file$9, 39, 6, 1175);
    			attr_dev(a5, "href", "/photos/berlin");
    			attr_dev(a5, "data-title", "Berlin");
    			attr_dev(a5, "class", "photo-album-link svelte-13sv805");
    			add_location(a5, file$9, 36, 4, 1086);
    			attr_dev(img6, "class", "photo-album svelte-13sv805");
    			if (img6.src !== (img6_src_value = "/assets/img/photography/08-ndp-singapore/DSCF3973.jpg")) attr_dev(img6, "src", img6_src_value);
    			add_location(img6, file$9, 46, 6, 1402);
    			attr_dev(a6, "href", "/photos/singapore-ndp-2018");
    			attr_dev(a6, "data-title", "NDP Singapore, 2018");
    			attr_dev(a6, "class", "photo-album-link svelte-13sv805");
    			add_location(a6, file$9, 42, 4, 1282);
    			attr_dev(img7, "class", "photo-album svelte-13sv805");
    			if (img7.src !== (img7_src_value = "/assets/img/photography/10-singapore-clarke-quay/DSCF3677.jpg")) attr_dev(img7, "src", img7_src_value);
    			add_location(img7, file$9, 53, 6, 1630);
    			attr_dev(a7, "href", "/photos/singapore-clarke-quay");
    			attr_dev(a7, "data-title", "Clarke Quay, Singapore");
    			attr_dev(a7, "class", "photo-album-link svelte-13sv805");
    			add_location(a7, file$9, 49, 4, 1504);
    			attr_dev(img8, "class", "photo-album svelte-13sv805");
    			if (img8.src !== (img8_src_value = "/assets/img/photography/09-singapore-chinatown/DSCF3734.jpg")) attr_dev(img8, "src", img8_src_value);
    			add_location(img8, file$9, 60, 6, 1858);
    			attr_dev(a8, "href", "/photos/singapore-clarke-quay");
    			attr_dev(a8, "data-title", "Singapore Life");
    			attr_dev(a8, "class", "photo-album-link svelte-13sv805");
    			add_location(a8, file$9, 56, 4, 1740);
    			attr_dev(img9, "class", "photo-album svelte-13sv805");
    			if (img9.src !== (img9_src_value = "/assets/img/photography/12-singapore-life/DSCF3993.JPG")) attr_dev(img9, "src", img9_src_value);
    			add_location(img9, file$9, 67, 6, 2077);
    			attr_dev(a9, "href", "/photos/singapore-life");
    			attr_dev(a9, "data-title", "Singapore Life");
    			attr_dev(a9, "class", "photo-album-link svelte-13sv805");
    			add_location(a9, file$9, 63, 4, 1966);
    			attr_dev(img10, "class", "photo-album svelte-13sv805");
    			if (img10.src !== (img10_src_value = "/assets/img/photography/13-bali/DSCF4233.JPG")) attr_dev(img10, "src", img10_src_value);
    			add_location(img10, file$9, 74, 6, 2282);
    			attr_dev(a10, "href", "/photos/bali");
    			attr_dev(a10, "data-title", "Bali, Indonesia");
    			attr_dev(a10, "class", "photo-album-link svelte-13sv805");
    			add_location(a10, file$9, 70, 4, 2180);
    			attr_dev(div, "class", "photo-holder svelte-13sv805");
    			add_location(div, file$9, 0, 2, 2);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a0);
    			append_dev(a0, img0);
    			append_dev(div, t0);
    			append_dev(div, a1);
    			append_dev(a1, img1);
    			append_dev(div, t1);
    			append_dev(div, a2);
    			append_dev(a2, img2);
    			append_dev(div, t2);
    			append_dev(div, a3);
    			append_dev(a3, img3);
    			append_dev(div, t3);
    			append_dev(div, a4);
    			append_dev(a4, img4);
    			append_dev(div, t4);
    			append_dev(div, a5);
    			append_dev(a5, img5);
    			append_dev(div, t5);
    			append_dev(div, a6);
    			append_dev(a6, img6);
    			append_dev(div, t6);
    			append_dev(div, a7);
    			append_dev(a7, img7);
    			append_dev(div, t7);
    			append_dev(div, a8);
    			append_dev(a8, img8);
    			append_dev(div, t8);
    			append_dev(div, a9);
    			append_dev(a9, img9);
    			append_dev(div, t9);
    			append_dev(div, a10);
    			append_dev(a10, img10);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    var singaporeNdp = [{"name":"DSCF3738.jpg","dof":"4.0","shutterSpeed":"918/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3739.jpg","dof":"4.0","shutterSpeed":"1200/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3740.jpg","dof":"4.0","shutterSpeed":"1116/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3741.jpg","dof":"4.0","shutterSpeed":"1100/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3742.jpg","dof":"4.0","shutterSpeed":"1042/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3743.jpg","dof":"4.0","shutterSpeed":"1106/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3744.jpg","dof":"4.0","shutterSpeed":"1160/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3745.jpg","dof":"4.0","shutterSpeed":"1113/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3746.jpg","dof":"4.0","shutterSpeed":"1126/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3747.jpg","dof":"4.0","shutterSpeed":"1144/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3748.jpg","dof":"4.0","shutterSpeed":"1095/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3749.jpg","dof":"4.0","shutterSpeed":"1148/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3750.jpg","dof":"4.0","shutterSpeed":"941/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3751.jpg","dof":"4.0","shutterSpeed":"1142/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3752.jpg","dof":"1.0","shutterSpeed":"1176/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3753.jpg","dof":"1.0","shutterSpeed":"1088/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3754.jpg","dof":"4.0","shutterSpeed":"1098/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3755.jpg","dof":"4.0","shutterSpeed":"992/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3756.jpg","dof":"4.0","shutterSpeed":"1080/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3757.jpg","dof":"4.0","shutterSpeed":"918/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3758.jpg","dof":"4.0","shutterSpeed":"1004/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3759.jpg","dof":"4.0","shutterSpeed":"995/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3760.jpg","dof":"4.0","shutterSpeed":"960/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3761.jpg","dof":"4.0","shutterSpeed":"985/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3762.jpg","dof":"4.0","shutterSpeed":"1158/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3763.jpg","dof":"4.0","shutterSpeed":"1154/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3764.jpg","dof":"4.0","shutterSpeed":"1127/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3765.jpg","dof":"4.0","shutterSpeed":"1147/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3766.jpg","dof":"4.0","shutterSpeed":"1149/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3767.jpg","dof":"4.0","shutterSpeed":"902/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3768.jpg","dof":"2.0","shutterSpeed":"1200/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3769.jpg","dof":"4.0","shutterSpeed":"1118/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3770.jpg","dof":"3.0","shutterSpeed":"1122/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3771.jpg","dof":"3.0","shutterSpeed":"1062/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3773.jpg","dof":"2.0","shutterSpeed":"1114/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3775.jpg","dof":"2.0","shutterSpeed":"1177/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3776.jpg","dof":"4.0","shutterSpeed":"1050/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3777.jpg","dof":"1.0","shutterSpeed":"1082/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3778.jpg","dof":"1.0","shutterSpeed":"1047/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3779.jpg","dof":"1.0","shutterSpeed":"1103/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3780.jpg","dof":"4.0","shutterSpeed":"931/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3783.jpg","dof":"4.0","shutterSpeed":"1125/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3784.jpg","dof":"4.0","shutterSpeed":"1117/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3785.jpg","dof":"4.0","shutterSpeed":"1111/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3786.jpg","dof":"4.0","shutterSpeed":"1009/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3788.jpg","dof":"4.0","shutterSpeed":"1052/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3789.jpg","dof":"4.0","shutterSpeed":"1117/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3790.jpg","dof":"4.0","shutterSpeed":"1075/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3791.jpg","dof":"4.0","shutterSpeed":"882/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3792.jpg","dof":"4.0","shutterSpeed":"969/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3793.jpg","dof":"4.0","shutterSpeed":"986/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3794.jpg","dof":"4.0","shutterSpeed":"963/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3795.jpg","dof":"4.0","shutterSpeed":"1063/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3796.jpg","dof":"6.0","shutterSpeed":"1002/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3797.jpg","dof":"6.0","shutterSpeed":"1002/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3799.jpg","dof":"4.0","shutterSpeed":"1156/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3800.jpg","dof":"4.0","shutterSpeed":"1134/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3801.jpg","dof":"4.0","shutterSpeed":"1006/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3803.jpg","dof":"4.0","shutterSpeed":"1036/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3805.jpg","dof":"4.0","shutterSpeed":"1181/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3806.jpg","dof":"4.0","shutterSpeed":"1192/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3807.jpg","dof":"4.0","shutterSpeed":"1004/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3808.jpg","dof":"4.0","shutterSpeed":"1159/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3809.jpg","dof":"4.0","shutterSpeed":"935/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3810.jpg","dof":"4.0","shutterSpeed":"1009/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3811.jpg","dof":"4.0","shutterSpeed":"937/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3812.jpg","dof":"4.0","shutterSpeed":"912/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3813.jpg","dof":"4.0","shutterSpeed":"1064/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3814.jpg","dof":"4.0","shutterSpeed":"1127/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3815.jpg","dof":"4.0","shutterSpeed":"1109/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3816.jpg","dof":"4.0","shutterSpeed":"1068/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3817.jpg","dof":"4.0","shutterSpeed":"1069/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3818.jpg","dof":"4.0","shutterSpeed":"981/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3820.jpg","dof":"4.0","shutterSpeed":"1060/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3821.jpg","dof":"4.0","shutterSpeed":"1099/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3822.jpg","dof":"4.0","shutterSpeed":"1065/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3823.jpg","dof":"3.0","shutterSpeed":"1171/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3826.jpg","dof":"3.0","shutterSpeed":"1089/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3827.jpg","dof":"1.0","shutterSpeed":"919/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3829.jpg","dof":"1.0","shutterSpeed":"1141/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3830.jpg","dof":"1.0","shutterSpeed":"926/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3831.jpg","dof":"1.0","shutterSpeed":"1182/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3833.jpg","dof":"1.0","shutterSpeed":"929/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3834.jpg","dof":"4.0","shutterSpeed":"990/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3836.jpg","dof":"1.0","shutterSpeed":"600/100","iso":640,"width":1920,"height":1082},{"name":"DSCF3840.jpg","dof":"1.0","shutterSpeed":"481/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3841.jpg","dof":"1.0","shutterSpeed":"508/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3842.jpg","dof":"1.0","shutterSpeed":"600/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3849.jpg","dof":"1.0","shutterSpeed":"442/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3864.jpg","dof":"1.0","shutterSpeed":"508/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3867.jpg","dof":"1.0","shutterSpeed":"486/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3868.jpg","dof":"1.0","shutterSpeed":"523/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3869.jpg","dof":"1.0","shutterSpeed":"528/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3870.jpg","dof":"1.0","shutterSpeed":"532/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3871.jpg","dof":"1.0","shutterSpeed":"467/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3872.jpg","dof":"1.0","shutterSpeed":"501/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3873.jpg","dof":"1.0","shutterSpeed":"458/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3874.jpg","dof":"1.0","shutterSpeed":"480/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3875.jpg","dof":"1.0","shutterSpeed":"455/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3876.jpg","dof":"1.0","shutterSpeed":"514/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3877.jpg","dof":"1.0","shutterSpeed":"496/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3878.jpg","dof":"1.0","shutterSpeed":"573/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3879.jpg","dof":"1.0","shutterSpeed":"551/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3880.jpg","dof":"1.0","shutterSpeed":"372/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3881.jpg","dof":"1.0","shutterSpeed":"533/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3882.jpg","dof":"1.0","shutterSpeed":"551/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3883.jpg","dof":"1.0","shutterSpeed":"515/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3885.jpg","dof":"1.0","shutterSpeed":"501/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3886.jpg","dof":"1.0","shutterSpeed":"571/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3887.jpg","dof":"1.0","shutterSpeed":"504/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3888.jpg","dof":"1.0","shutterSpeed":"510/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3889.jpg","dof":"1.0","shutterSpeed":"600/100","iso":250,"width":1920,"height":1082},{"name":"DSCF3894.jpg","dof":"1.0","shutterSpeed":"570/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3895.jpg","dof":"1.0","shutterSpeed":"566/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3896.jpg","dof":"1.0","shutterSpeed":"544/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3898.jpg","dof":"1.0","shutterSpeed":"523/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3899.jpg","dof":"1.0","shutterSpeed":"599/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3900.jpg","dof":"1.0","shutterSpeed":"535/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3903.jpg","dof":"1.0","shutterSpeed":"541/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3911.jpg","dof":"1.0","shutterSpeed":"359/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3912.jpg","dof":"1.0","shutterSpeed":"400/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3913.jpg","dof":"1.0","shutterSpeed":"578/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3914.jpg","dof":"1.0","shutterSpeed":"554/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3915.jpg","dof":"1.0","shutterSpeed":"486/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3917.jpg","dof":"1.0","shutterSpeed":"555/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3919.jpg","dof":"1.0","shutterSpeed":"600/100","iso":640,"width":1920,"height":1082},{"name":"DSCF3920.jpg","dof":"1.0","shutterSpeed":"600/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3921.jpg","dof":"1.0","shutterSpeed":"589/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3923.jpg","dof":"1.0","shutterSpeed":"600/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3924.jpg","dof":"1.0","shutterSpeed":"502/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3926.jpg","dof":"1.0","shutterSpeed":"524/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3927.jpg","dof":"1.0","shutterSpeed":"442/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3928.jpg","dof":"1.0","shutterSpeed":"484/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3929.jpg","dof":"1.0","shutterSpeed":"402/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3933.jpg","dof":"1.0","shutterSpeed":"562/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3934.jpg","dof":"1.0","shutterSpeed":"578/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3935.jpg","dof":"1.0","shutterSpeed":"600/100","iso":640,"width":1920,"height":1082},{"name":"DSCF3936.jpg","dof":"1.0","shutterSpeed":"553/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3937.jpg","dof":"1.0","shutterSpeed":"568/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3940.jpg","dof":"1.0","shutterSpeed":"587/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3941.jpg","dof":"1.0","shutterSpeed":"595/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3942.jpg","dof":"1.0","shutterSpeed":"568/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3943.jpg","dof":"1.0","shutterSpeed":"595/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3944.jpg","dof":"1.0","shutterSpeed":"590/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3945.jpg","dof":"1.0","shutterSpeed":"600/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3946.jpg","dof":"1.0","shutterSpeed":"600/100","iso":640,"width":1920,"height":1082},{"name":"DSCF3947.jpg","dof":"1.0","shutterSpeed":"585/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3948.jpg","dof":"1.0","shutterSpeed":"600/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3949.jpg","dof":"1.0","shutterSpeed":"584/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3950.jpg","dof":"1.0","shutterSpeed":"590/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3951.jpg","dof":"1.0","shutterSpeed":"600/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3952.jpg","dof":"1.0","shutterSpeed":"600/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3953.jpg","dof":"1.0","shutterSpeed":"600/100","iso":640,"width":1920,"height":1082},{"name":"DSCF3954.jpg","dof":"1.0","shutterSpeed":"571/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3957.jpg","dof":"1.0","shutterSpeed":"600/100","iso":500,"width":1920,"height":1082},{"name":"DSCF3958.jpg","dof":"1.0","shutterSpeed":"600/100","iso":640,"width":1920,"height":1082},{"name":"DSCF3959.jpg","dof":"1.0","shutterSpeed":"545/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3960.jpg","dof":"1.0","shutterSpeed":"574/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3961.jpg","dof":"1.0","shutterSpeed":"585/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3962.jpg","dof":"1.0","shutterSpeed":"587/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3963.jpg","dof":"1.0","shutterSpeed":"568/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3964.jpg","dof":"1.0","shutterSpeed":"582/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3965.jpg","dof":"1.0","shutterSpeed":"600/100","iso":640,"width":1920,"height":1082},{"name":"DSCF3966.jpg","dof":"1.0","shutterSpeed":"600/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3967.jpg","dof":"1.0","shutterSpeed":"597/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3968.jpg","dof":"1.0","shutterSpeed":"600/100","iso":640,"width":1920,"height":1082},{"name":"DSCF3969.jpg","dof":"1.0","shutterSpeed":"588/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3970.jpg","dof":"1.0","shutterSpeed":"600/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3972.jpg","dof":"1.0","shutterSpeed":"598/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3973.jpg","dof":"1.0","shutterSpeed":"464/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3975.jpg","dof":"1.0","shutterSpeed":"466/100","iso":800,"width":1920,"height":1082},{"name":"DSCF3976.jpg","dof":"1.0","shutterSpeed":"445/100","iso":800,"width":1920,"height":1082}];

    var singaporeRandom = [{"name":"DSCF3626.jpg","dof":"3.0","shutterSpeed":"1024/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3627.jpg","dof":"3.0","shutterSpeed":"1188/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3628.jpg","dof":"3.0","shutterSpeed":"1112/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3629.jpg","dof":"3.0","shutterSpeed":"694/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3630.jpg","dof":"3.0","shutterSpeed":"765/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3631.jpg","dof":"3.0","shutterSpeed":"815/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3633.jpg","dof":"3.0","shutterSpeed":"866/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3634.jpg","dof":"3.0","shutterSpeed":"1050/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3635.jpg","dof":"3.0","shutterSpeed":"1003/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3638.jpg","dof":"3.0","shutterSpeed":"724/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3641.jpg","dof":"3.0","shutterSpeed":"979/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3642.jpg","dof":"1.0","shutterSpeed":"1122/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3643.jpg","dof":"1.0","shutterSpeed":"945/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3722.jpg","dof":"1.0","shutterSpeed":"655/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3723.jpg","dof":"1.0","shutterSpeed":"752/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3724.jpg","dof":"1.0","shutterSpeed":"987/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3725.jpg","dof":"1.0","shutterSpeed":"986/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3726.jpg","dof":"1.0","shutterSpeed":"999/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3727.jpg","dof":"1.0","shutterSpeed":"1004/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3728.jpg","dof":"1.0","shutterSpeed":"600/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3729.jpg","dof":"1.0","shutterSpeed":"600/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3730.jpg","dof":"1.0","shutterSpeed":"891/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3731.jpg","dof":"1.0","shutterSpeed":"987/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3732.jpg","dof":"1.0","shutterSpeed":"1088/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3733.jpg","dof":"1.0","shutterSpeed":"942/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3734.jpg","dof":"1.0","shutterSpeed":"926/100","iso":200,"width":1920,"height":1082}];

    var singaporeClarkeQuay = [{"name":"DSCF3648.jpg","dof":"1.0","shutterSpeed":"1018/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3649.jpg","dof":"6.0","shutterSpeed":"669/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3651.jpg","dof":"6.0","shutterSpeed":"600/100","iso":250,"width":1920,"height":1082},{"name":"DSCF3652.jpg","dof":"6.0","shutterSpeed":"703/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3653.jpg","dof":"1.0","shutterSpeed":"1131/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3655.jpg","dof":"3.0","shutterSpeed":"1088/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3657.jpg","dof":"4.0","shutterSpeed":"994/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3661.jpg","dof":"1.0","shutterSpeed":"1167/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3663.jpg","dof":"1.0","shutterSpeed":"1094/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3665.jpg","dof":"4.0","shutterSpeed":"785/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3666.jpg","dof":"4.0","shutterSpeed":"823/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3668.jpg","dof":"1.0","shutterSpeed":"1017/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3669.jpg","dof":"4.0","shutterSpeed":"1004/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3670.jpg","dof":"4.0","shutterSpeed":"795/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3672.jpg","dof":"1.0","shutterSpeed":"1200/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3673.jpg","dof":"1.0","shutterSpeed":"1161/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3674.jpg","dof":"1.0","shutterSpeed":"1085/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3675.jpg","dof":"1.0","shutterSpeed":"846/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3676.jpg","dof":"3.0","shutterSpeed":"991/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3677.jpg","dof":"1.0","shutterSpeed":"1098/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3678.jpg","dof":"1.0","shutterSpeed":"1106/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3679.jpg","dof":"1.0","shutterSpeed":"1099/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3680.jpg","dof":"1.0","shutterSpeed":"974/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3681.jpg","dof":"1.0","shutterSpeed":"1102/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3682.jpg","dof":"1.0","shutterSpeed":"1166/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3683.jpg","dof":"1.0","shutterSpeed":"1200/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3684.jpg","dof":"3.0","shutterSpeed":"1068/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3685.jpg","dof":"1.0","shutterSpeed":"996/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3686.jpg","dof":"1.0","shutterSpeed":"1071/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3688.jpg","dof":"1.0","shutterSpeed":"1192/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3689.jpg","dof":"3.0","shutterSpeed":"1048/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3691.jpg","dof":"1.0","shutterSpeed":"1114/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3692.jpg","dof":"1.0","shutterSpeed":"908/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3693.jpg","dof":"1.0","shutterSpeed":"753/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3694.jpg","dof":"1.0","shutterSpeed":"914/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3695.jpg","dof":"1.0","shutterSpeed":"931/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3696.jpg","dof":"3.0","shutterSpeed":"1041/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3698.jpg","dof":"1.0","shutterSpeed":"1175/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3699.jpg","dof":"1.0","shutterSpeed":"1015/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3700.jpg","dof":"4.0","shutterSpeed":"882/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3702.jpg","dof":"4.0","shutterSpeed":"944/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3703.jpg","dof":"4.0","shutterSpeed":"991/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3704.jpg","dof":"4.0","shutterSpeed":"863/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3705.jpg","dof":"4.0","shutterSpeed":"797/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3706.jpg","dof":"1.0","shutterSpeed":"940/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3707.jpg","dof":"1.0","shutterSpeed":"1192/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3710.jpg","dof":"3.0","shutterSpeed":"861/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3711.jpg","dof":"3.0","shutterSpeed":"1142/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3712.jpg","dof":"3.0","shutterSpeed":"1037/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3713.jpg","dof":"3.0","shutterSpeed":"1150/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3714.jpg","dof":"3.0","shutterSpeed":"1136/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3715.jpg","dof":"3.0","shutterSpeed":"1073/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3716.jpg","dof":"3.0","shutterSpeed":"1161/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3717.jpg","dof":"1.0","shutterSpeed":"985/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3718.jpg","dof":"1.0","shutterSpeed":"836/100","iso":200,"width":1920,"height":1082},{"name":"DSCF3720.jpg","dof":"1.0","shutterSpeed":"824/100","iso":200,"width":1920,"height":1082}];

    var klLife = [{'name': 'DSCF3504.jpg', 'dof': '2.0', 'shutterSpeed': '1185/100', 'iso': 200, 'width': 1920, 'height': 1082}, {'name': 'DSCF3505.jpg', 'dof': '2.0', 'shutterSpeed': '1053/100', 'iso': 200, 'width': 1920, 'height': 1082}, {'name': 'DSCF3506.jpg', 'dof': '2.0', 'shutterSpeed': '921/100', 'iso': 200, 'width': 1920, 'height': 1082}, {'name': 'DSCF3507.jpg', 'dof': '1.0', 'shutterSpeed': '903/100', 'iso': 200, 'width': 1920, 'height': 1082}, {'name': 'DSCF3508.jpg', 'dof': '1.0', 'shutterSpeed': '600/100', 'iso': 200, 'width': 1920, 'height': 1082}, {'name': 'DSCF3509.jpg', 'dof': '1.0', 'shutterSpeed': '971/100', 'iso': 200, 'width': 1920, 'height': 1082}, {'name': 'DSCF3510.jpg', 'dof': '1.0', 'shutterSpeed': '600/100', 'iso': 400, 'width': 1920, 'height': 1082}, {'name': 'DSCF3511.jpg', 'dof': '1.0', 'shutterSpeed': '600/100', 'iso': 320, 'width': 1920, 'height': 1082}, {'name': 'DSCF3513.jpg', 'dof': '1.0', 'shutterSpeed': '791/100', 'iso': 200, 'width': 1920, 'height': 1082}, {'name': 'DSCF3514.jpg', 'dof': '1.0', 'shutterSpeed': '600/100', 'iso': 500, 'width': 1920, 'height': 1082}, {'name': 'DSCF3515.jpg', 'dof': '1.0', 'shutterSpeed': '565/100', 'iso': 800, 'width': 1920, 'height': 1082}, {'name': 'DSCF3522.jpg', 'dof': '1.0', 'shutterSpeed': '712/100', 'iso': 200, 'width': 1920, 'height': 1082}, {'name': 'DSCF3523.jpg', 'dof': '1.0', 'shutterSpeed': '629/100', 'iso': 200, 'width': 1920, 'height': 1082}, {'name': 'DSCF3524.jpg', 'dof': '1.0', 'shutterSpeed': '600/100', 'iso': 250, 'width': 1920, 'height': 1082}, {'name': 'DSCF3526.jpg', 'dof': '1.0', 'shutterSpeed': '1200/100', 'iso': 200, 'width': 1920, 'height': 1082}, {'name': 'DSCF3527.jpg', 'dof': '6.0', 'shutterSpeed': '835/100', 'iso': 200, 'width': 1920, 'height': 1082}, {'name': 'DSCF3528.jpg', 'dof': '6.0', 'shutterSpeed': '919/100', 'iso': 200, 'width': 1920, 'height': 1082}, {'name': 'DSCF3529.jpg', 'dof': '6.0', 'shutterSpeed': '913/100', 'iso': 200, 'width': 1920, 'height': 1082}, {'name': 'DSCF3540.jpg', 'dof': '1.4', 'shutterSpeed': '689/100', 'iso': 200, 'width': 1920, 'height': 1082}, {'name': 'DSCF3542.jpg', 'dof': '6.0', 'shutterSpeed': '808/100', 'iso': 200, 'width': 1920, 'height': 1082}, {'name': 'DSCF3543.jpg', 'dof': '5.0', 'shutterSpeed': '993/100', 'iso': 200, 'width': 1920, 'height': 1082}, {'name': 'DSCF3544.jpg', 'dof': '5.0', 'shutterSpeed': '1005/100', 'iso': 200, 'width': 1920, 'height': 1082}, {'name': 'DSCF3552.jpg', 'dof': '1.0', 'shutterSpeed': '569/100', 'iso': 800, 'width': 1920, 'height': 1082}, {'name': 'DSCF3553.jpg', 'dof': '1.0', 'shutterSpeed': '572/100', 'iso': 800, 'width': 1920, 'height': 1082}, {'name': 'DSCF3556.jpg', 'dof': '1.0', 'shutterSpeed': '600/100', 'iso': 400, 'width': 1920, 'height': 1082}, {'name': 'DSCF3557.jpg', 'dof': '1.0', 'shutterSpeed': '510/100', 'iso': 800, 'width': 1920, 'height': 1082}, {'name': 'DSCF3559.jpg', 'dof': '1.0', 'shutterSpeed': '600/100', 'iso': 320, 'width': 1920, 'height': 1082}, {'name': 'DSCF3560.jpg', 'dof': '1.0', 'shutterSpeed': '592/100', 'iso': 800, 'width': 1920, 'height': 1082}, {'name': 'DSCF3561.jpg', 'dof': '1.0', 'shutterSpeed': '600/100', 'iso': 400, 'width': 1920, 'height': 1082}, {'name': 'DSCF3562.jpg', 'dof': '1.0', 'shutterSpeed': '600/100', 'iso': 250, 'width': 1920, 'height': 1082}, {'name': 'DSCF3563.jpg', 'dof': '1.0', 'shutterSpeed': '600/100', 'iso': 200, 'width': 1920, 'height': 1082}, {'name': 'DSCF3576.jpg', 'dof': '4.3', 'shutterSpeed': '475/100', 'iso': 800, 'width': 1920, 'height': 1082}, {'name': 'DSCF3583.jpg', 'dof': '2.6', 'shutterSpeed': '600/100', 'iso': 800, 'width': 1920, 'height': 1082}, {'name': 'DSCF3584.jpg', 'dof': '2.6', 'shutterSpeed': '576/100', 'iso': 800, 'width': 1920, 'height': 1082}, {'name': 'DSCF3588.jpg', 'dof': '2.0', 'shutterSpeed': '990/100', 'iso': 200, 'width': 1920, 'height': 1082}, {'name': 'DSCF3604.jpg', 'dof': '5.0', 'shutterSpeed': '969/100', 'iso': 200, 'width': 1920, 'height': 1082}, {'name': 'DSCF3609.jpg', 'dof': '1.0', 'shutterSpeed': '870/100', 'iso': 200, 'width': 1920, 'height': 1082}, {'name': 'DSCF3611.jpg', 'dof': '1.0', 'shutterSpeed': '1200/100', 'iso': 200, 'width': 1920, 'height': 1082}, {'name': 'DSCF3612.jpg', 'dof': '3.0', 'shutterSpeed': '1013/100', 'iso': 200, 'width': 1920, 'height': 1082}, {'name': 'DSCF3613.jpg', 'dof': '3.0', 'shutterSpeed': '1032/100', 'iso': 200, 'width': 1920, 'height': 1082}];

    var bali = [{ 'name': 'DSCF4127.JPG', 'dof': '4.0', 'shutterSpeed': '681/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4128.JPG', 'dof': '4.0', 'shutterSpeed': '799/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4129.JPG', 'dof': '3.0', 'shutterSpeed': '957/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4130.JPG', 'dof': '3.0', 'shutterSpeed': '1140/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4131.JPG', 'dof': '3.0', 'shutterSpeed': '1082/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4132.JPG', 'dof': '3.0', 'shutterSpeed': '1128/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4133.JPG', 'dof': '3.0', 'shutterSpeed': '1172/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4134.JPG', 'dof': '3.0', 'shutterSpeed': '1183/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4135.JPG', 'dof': '3.0', 'shutterSpeed': '1151/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4136.JPG', 'dof': '3.0', 'shutterSpeed': '1175/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4137.JPG', 'dof': '3.0', 'shutterSpeed': '1144/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4138.JPG', 'dof': '3.0', 'shutterSpeed': '954/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4139.JPG', 'dof': '3.0', 'shutterSpeed': '1130/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4143.JPG', 'dof': '3.0', 'shutterSpeed': '1073/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4144.JPG', 'dof': '3.0', 'shutterSpeed': '950/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4145.JPG', 'dof': '3.0', 'shutterSpeed': '1192/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4146.JPG', 'dof': '3.0', 'shutterSpeed': '1186/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4147.JPG', 'dof': '4.0', 'shutterSpeed': '1061/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4148.JPG', 'dof': '4.0', 'shutterSpeed': '1113/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4150.JPG', 'dof': '4.0', 'shutterSpeed': '1094/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4151.JPG', 'dof': '4.0', 'shutterSpeed': '1110/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4152.JPG', 'dof': '4.0', 'shutterSpeed': '1050/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4154.JPG', 'dof': '4.0', 'shutterSpeed': '1095/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4155.JPG', 'dof': '4.0', 'shutterSpeed': '1043/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4156.JPG', 'dof': '4.0', 'shutterSpeed': '1127/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4157.JPG', 'dof': '4.0', 'shutterSpeed': '901/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4158.JPG', 'dof': '4.0', 'shutterSpeed': '988/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4159.JPG', 'dof': '4.0', 'shutterSpeed': '1098/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4160.JPG', 'dof': '4.0', 'shutterSpeed': '1017/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4162.JPG', 'dof': '4.0', 'shutterSpeed': '1050/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4163.JPG', 'dof': '4.0', 'shutterSpeed': '1053/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4165.JPG', 'dof': '2.0', 'shutterSpeed': '1098/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4167.JPG', 'dof': '2.0', 'shutterSpeed': '1199/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4168.JPG', 'dof': '2.0', 'shutterSpeed': '1200/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4169.JPG', 'dof': '2.0', 'shutterSpeed': '1147/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4170.JPG', 'dof': '4.3', 'shutterSpeed': '1014/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4171.JPG', 'dof': '4.3', 'shutterSpeed': '953/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4172.JPG', 'dof': '4.3', 'shutterSpeed': '1034/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4173.JPG', 'dof': '4.3', 'shutterSpeed': '1022/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4174.JPG', 'dof': '4.3', 'shutterSpeed': '1126/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4175.JPG', 'dof': '4.3', 'shutterSpeed': '1051/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4176.JPG', 'dof': '4.3', 'shutterSpeed': '954/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4177.JPG', 'dof': '4.3', 'shutterSpeed': '1107/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4178.JPG', 'dof': '4.3', 'shutterSpeed': '1012/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4179.JPG', 'dof': '4.3', 'shutterSpeed': '1004/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4180.JPG', 'dof': '4.3', 'shutterSpeed': '1109/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4181.JPG', 'dof': '4.3', 'shutterSpeed': '996/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4182.JPG', 'dof': '4.0', 'shutterSpeed': '899/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4183.JPG', 'dof': '4.0', 'shutterSpeed': '1073/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4184.JPG', 'dof': '4.0', 'shutterSpeed': '1101/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4185.JPG', 'dof': '4.0', 'shutterSpeed': '1064/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4188.JPG', 'dof': '4.0', 'shutterSpeed': '992/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4189.JPG', 'dof': '4.0', 'shutterSpeed': '1003/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4190.JPG', 'dof': '4.0', 'shutterSpeed': '1033/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4192.JPG', 'dof': '4.0', 'shutterSpeed': '1019/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4194.JPG', 'dof': '4.0', 'shutterSpeed': '1024/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4196.JPG', 'dof': '4.0', 'shutterSpeed': '1042/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4197.JPG', 'dof': '4.0', 'shutterSpeed': '1121/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4198.JPG', 'dof': '4.0', 'shutterSpeed': '1139/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4199.JPG', 'dof': '1.0', 'shutterSpeed': '1167/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4200.JPG', 'dof': '1.0', 'shutterSpeed': '1099/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4201.JPG', 'dof': '1.0', 'shutterSpeed': '1179/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4202.JPG', 'dof': '4.0', 'shutterSpeed': '1076/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4203.JPG', 'dof': '4.0', 'shutterSpeed': '928/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4204.JPG', 'dof': '4.0', 'shutterSpeed': '994/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4205.JPG', 'dof': '4.0', 'shutterSpeed': '1005/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4206.JPG', 'dof': '4.0', 'shutterSpeed': '985/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4207.JPG', 'dof': '4.0', 'shutterSpeed': '1109/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4208.JPG', 'dof': '1.0', 'shutterSpeed': '1102/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4209.JPG', 'dof': '4.0', 'shutterSpeed': '991/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4210.JPG', 'dof': '3.0', 'shutterSpeed': '991/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4211.JPG', 'dof': '3.0', 'shutterSpeed': '1008/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4212.JPG', 'dof': '3.0', 'shutterSpeed': '975/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4214.JPG', 'dof': '3.4', 'shutterSpeed': '1066/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4215.JPG', 'dof': '3.4', 'shutterSpeed': '959/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4216.JPG', 'dof': '3.0', 'shutterSpeed': '1019/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4217.JPG', 'dof': '3.0', 'shutterSpeed': '911/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4218.JPG', 'dof': '5.0', 'shutterSpeed': '1041/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4219.JPG', 'dof': '5.0', 'shutterSpeed': '1002/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4221.JPG', 'dof': '5.0', 'shutterSpeed': '1020/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4222.JPG', 'dof': '5.0', 'shutterSpeed': '973/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4223.JPG', 'dof': '5.0', 'shutterSpeed': '941/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4225.JPG', 'dof': '5.0', 'shutterSpeed': '981/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4226.JPG', 'dof': '5.0', 'shutterSpeed': '1031/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4230.JPG', 'dof': '5.0', 'shutterSpeed': '1028/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4231.JPG', 'dof': '5.0', 'shutterSpeed': '965/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4232.JPG', 'dof': '5.0', 'shutterSpeed': '828/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4233.JPG', 'dof': '5.0', 'shutterSpeed': '940/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4234.JPG', 'dof': '5.0', 'shutterSpeed': '929/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4235.JPG', 'dof': '5.0', 'shutterSpeed': '968/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4236.JPG', 'dof': '5.0', 'shutterSpeed': '1035/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4237.JPG', 'dof': '5.0', 'shutterSpeed': '1160/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4238.JPG', 'dof': '5.0', 'shutterSpeed': '1069/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4239.JPG', 'dof': '5.0', 'shutterSpeed': '1019/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4240.JPG', 'dof': '5.0', 'shutterSpeed': '933/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4241.JPG', 'dof': '5.0', 'shutterSpeed': '987/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4242.JPG', 'dof': '5.0', 'shutterSpeed': '1033/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4244.JPG', 'dof': '5.0', 'shutterSpeed': '1200/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4245.JPG', 'dof': '5.0', 'shutterSpeed': '1098/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4246.JPG', 'dof': '5.0', 'shutterSpeed': '956/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4247.JPG', 'dof': '5.0', 'shutterSpeed': '967/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4248.JPG', 'dof': '5.0', 'shutterSpeed': '974/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4249.JPG', 'dof': '5.0', 'shutterSpeed': '1096/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4250.JPG', 'dof': '5.0', 'shutterSpeed': '1021/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4251.JPG', 'dof': '5.0', 'shutterSpeed': '1200/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4252.JPG', 'dof': '5.0', 'shutterSpeed': '974/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4253.JPG', 'dof': '5.0', 'shutterSpeed': '1159/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4254.JPG', 'dof': '5.0', 'shutterSpeed': '1077/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4262.JPG', 'dof': '4.0', 'shutterSpeed': '1152/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4267.JPG', 'dof': '6.0', 'shutterSpeed': '1025/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4268.JPG', 'dof': '6.0', 'shutterSpeed': '1085/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4271.JPG', 'dof': '6.0', 'shutterSpeed': '812/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4272.JPG', 'dof': '6.0', 'shutterSpeed': '794/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4273.JPG', 'dof': '6.0', 'shutterSpeed': '798/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4274.JPG', 'dof': '6.0', 'shutterSpeed': '869/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4275.JPG', 'dof': '6.0', 'shutterSpeed': '600/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4276.JPG', 'dof': '2.6', 'shutterSpeed': '1118/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4277.JPG', 'dof': '2.6', 'shutterSpeed': '1200/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4278.JPG', 'dof': '3.0', 'shutterSpeed': '1169/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4279.JPG', 'dof': '3.0', 'shutterSpeed': '1184/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4280.JPG', 'dof': '3.0', 'shutterSpeed': '1200/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4281.JPG', 'dof': '4.0', 'shutterSpeed': '1107/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4282.JPG', 'dof': '4.0', 'shutterSpeed': '1080/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4283.JPG', 'dof': '3.0', 'shutterSpeed': '1028/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4284.JPG', 'dof': '3.0', 'shutterSpeed': '1100/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4285.JPG', 'dof': '3.0', 'shutterSpeed': '1094/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4286.JPG', 'dof': '3.0', 'shutterSpeed': '1145/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4287.JPG', 'dof': '3.0', 'shutterSpeed': '1190/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4288.JPG', 'dof': '3.0', 'shutterSpeed': '1153/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4289.JPG', 'dof': '3.0', 'shutterSpeed': '1139/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4290.JPG', 'dof': '3.0', 'shutterSpeed': '1055/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4291.JPG', 'dof': '3.0', 'shutterSpeed': '1100/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4292.JPG', 'dof': '3.0', 'shutterSpeed': '1100/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4293.JPG', 'dof': '4.0', 'shutterSpeed': '1120/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4294.JPG', 'dof': '4.0', 'shutterSpeed': '1128/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4295.JPG', 'dof': '4.0', 'shutterSpeed': '1023/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4296.JPG', 'dof': '4.0', 'shutterSpeed': '1082/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4297.JPG', 'dof': '4.0', 'shutterSpeed': '970/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4298.JPG', 'dof': '4.0', 'shutterSpeed': '1015/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4304.JPG', 'dof': '4.0', 'shutterSpeed': '1123/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4305.JPG', 'dof': '4.0', 'shutterSpeed': '1061/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4306.JPG', 'dof': '4.0', 'shutterSpeed': '1106/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4307.JPG', 'dof': '4.0', 'shutterSpeed': '1079/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4308.JPG', 'dof': '4.0', 'shutterSpeed': '1075/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4309.JPG', 'dof': '4.0', 'shutterSpeed': '1134/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4310.JPG', 'dof': '4.0', 'shutterSpeed': '1095/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4311.JPG', 'dof': '4.0', 'shutterSpeed': '1126/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4313.JPG', 'dof': '2.0', 'shutterSpeed': '1200/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4314.JPG', 'dof': '3.0', 'shutterSpeed': '1197/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4315.JPG', 'dof': '3.0', 'shutterSpeed': '1189/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4316.JPG', 'dof': '3.0', 'shutterSpeed': '1200/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4317.JPG', 'dof': '4.0', 'shutterSpeed': '1165/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4318.JPG', 'dof': '4.0', 'shutterSpeed': '1125/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4319.JPG', 'dof': '4.0', 'shutterSpeed': '1104/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4320.JPG', 'dof': '4.0', 'shutterSpeed': '1188/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4321.JPG', 'dof': '1.0', 'shutterSpeed': '1165/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4322.JPG', 'dof': '1.0', 'shutterSpeed': '1153/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4323.JPG', 'dof': '3.0', 'shutterSpeed': '1028/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4324.JPG', 'dof': '3.0', 'shutterSpeed': '993/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4325.JPG', 'dof': '3.0', 'shutterSpeed': '855/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4326.JPG', 'dof': '3.0', 'shutterSpeed': '1039/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4327.JPG', 'dof': '3.0', 'shutterSpeed': '1030/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4328.JPG', 'dof': '3.0', 'shutterSpeed': '880/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4329.JPG', 'dof': '3.0', 'shutterSpeed': '857/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4330.JPG', 'dof': '1.4', 'shutterSpeed': '1175/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4331.JPG', 'dof': '2.3', 'shutterSpeed': '1179/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4332.JPG', 'dof': '2.3', 'shutterSpeed': '1054/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4333.JPG', 'dof': '3.0', 'shutterSpeed': '1155/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4334.JPG', 'dof': '3.0', 'shutterSpeed': '1030/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4335.JPG', 'dof': '3.0', 'shutterSpeed': '1158/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4336.JPG', 'dof': '3.0', 'shutterSpeed': '1130/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4337.JPG', 'dof': '3.0', 'shutterSpeed': '1105/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4338.JPG', 'dof': '3.0', 'shutterSpeed': '1144/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4339.JPG', 'dof': '3.0', 'shutterSpeed': '1090/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4340.JPG', 'dof': '3.0', 'shutterSpeed': '1062/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4341.JPG', 'dof': '3.0', 'shutterSpeed': '1162/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4342.JPG', 'dof': '3.0', 'shutterSpeed': '1087/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4343.JPG', 'dof': '3.0', 'shutterSpeed': '1088/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4344.JPG', 'dof': '3.0', 'shutterSpeed': '1082/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4345.JPG', 'dof': '3.0', 'shutterSpeed': '1141/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4346.JPG', 'dof': '3.0', 'shutterSpeed': '1058/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4347.JPG', 'dof': '3.0', 'shutterSpeed': '1037/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4348.JPG', 'dof': '3.0', 'shutterSpeed': '1139/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4349.JPG', 'dof': '3.0', 'shutterSpeed': '964/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4350.JPG', 'dof': '1.0', 'shutterSpeed': '1200/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4351.JPG', 'dof': '1.0', 'shutterSpeed': '1192/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4352.JPG', 'dof': '1.0', 'shutterSpeed': '1200/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4353.JPG', 'dof': '1.0', 'shutterSpeed': '1200/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4355.JPG', 'dof': '1.0', 'shutterSpeed': '1200/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4356.JPG', 'dof': '4.0', 'shutterSpeed': '1050/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4357.JPG', 'dof': '4.0', 'shutterSpeed': '1028/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4358.JPG', 'dof': '4.0', 'shutterSpeed': '829/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4359.JPG', 'dof': '4.0', 'shutterSpeed': '827/100', 'iso': null, 'width': 1920, 'height': 1082 }, { 'name': 'DSCF4360.JPG', 'dof': '4.0', 'shutterSpeed': '892/100', 'iso': null, 'width': 1920, 'height': 1082 }];

    var singaporeLife = [{"name":"DSCF3978.JPG","dof":"1.0","shutterSpeed":"600/100","iso":null,"width":1920,"height":1082},{"name":"DSCF3979.JPG","dof":"1.0","shutterSpeed":"730/100","iso":null,"width":1920,"height":1082},{"name":"DSCF3980.JPG","dof":"1.0","shutterSpeed":"731/100","iso":null,"width":1920,"height":1082},{"name":"DSCF3981.JPG","dof":"1.0","shutterSpeed":"744/100","iso":null,"width":1920,"height":1082},{"name":"DSCF3982.JPG","dof":"1.0","shutterSpeed":"870/100","iso":null,"width":1920,"height":1082},{"name":"DSCF3983.JPG","dof":"1.0","shutterSpeed":"852/100","iso":null,"width":1920,"height":1082},{"name":"DSCF3984.JPG","dof":"1.0","shutterSpeed":"902/100","iso":null,"width":1920,"height":1082},{"name":"DSCF3985.JPG","dof":"1.0","shutterSpeed":"778/100","iso":null,"width":1920,"height":1082},{"name":"DSCF3986.JPG","dof":"1.0","shutterSpeed":"775/100","iso":null,"width":1920,"height":1082},{"name":"DSCF3987.JPG","dof":"1.0","shutterSpeed":"790/100","iso":null,"width":1920,"height":1082},{"name":"DSCF3988.JPG","dof":"1.0","shutterSpeed":"793/100","iso":null,"width":1920,"height":1082},{"name":"DSCF3989.JPG","dof":"1.0","shutterSpeed":"806/100","iso":null,"width":1920,"height":1082},{"name":"DSCF3990.JPG","dof":"1.0","shutterSpeed":"711/100","iso":null,"width":1920,"height":1082},{"name":"DSCF3991.JPG","dof":"1.0","shutterSpeed":"805/100","iso":null,"width":1920,"height":1082},{"name":"DSCF3992.JPG","dof":"1.0","shutterSpeed":"714/100","iso":null,"width":1920,"height":1082},{"name":"DSCF3993.JPG","dof":"1.0","shutterSpeed":"807/100","iso":null,"width":1920,"height":1082},{"name":"DSCF3994.JPG","dof":"1.0","shutterSpeed":"800/100","iso":null,"width":1920,"height":1082},{"name":"DSCF3995.JPG","dof":"6.0","shutterSpeed":"872/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4001.JPG","dof":"4.3","shutterSpeed":"868/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4002.JPG","dof":"4.3","shutterSpeed":"739/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4003.JPG","dof":"4.3","shutterSpeed":"787/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4004.JPG","dof":"4.3","shutterSpeed":"750/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4005.JPG","dof":"4.3","shutterSpeed":"826/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4006.JPG","dof":"4.3","shutterSpeed":"697/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4007.JPG","dof":"3.0","shutterSpeed":"699/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4008.JPG","dof":"1.0","shutterSpeed":"936/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4009.JPG","dof":"1.0","shutterSpeed":"692/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4010.JPG","dof":"1.0","shutterSpeed":"677/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4011.JPG","dof":"1.0","shutterSpeed":"600/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4012.JPG","dof":"1.0","shutterSpeed":"707/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4013.JPG","dof":"1.0","shutterSpeed":"737/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4014.JPG","dof":"1.0","shutterSpeed":"694/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4015.JPG","dof":"1.0","shutterSpeed":"1027/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4016.JPG","dof":"1.0","shutterSpeed":"1013/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4017.JPG","dof":"1.0","shutterSpeed":"1035/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4018.JPG","dof":"1.0","shutterSpeed":"1030/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4019.JPG","dof":"1.0","shutterSpeed":"921/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4020.JPG","dof":"4.0","shutterSpeed":"974/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4021.JPG","dof":"4.0","shutterSpeed":"921/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4022.JPG","dof":"1.0","shutterSpeed":"1081/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4023.JPG","dof":"1.0","shutterSpeed":"1119/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4024.JPG","dof":"4.0","shutterSpeed":"1073/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4025.JPG","dof":"4.0","shutterSpeed":"953/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4026.JPG","dof":"4.0","shutterSpeed":"807/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4027.JPG","dof":"4.0","shutterSpeed":"981/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4028.JPG","dof":"4.0","shutterSpeed":"813/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4029.JPG","dof":"4.0","shutterSpeed":"1013/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4030.JPG","dof":"3.0","shutterSpeed":"1156/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4031.JPG","dof":"3.0","shutterSpeed":"956/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4032.JPG","dof":"3.0","shutterSpeed":"1122/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4033.JPG","dof":"3.0","shutterSpeed":"1097/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4034.JPG","dof":"1.0","shutterSpeed":"1174/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4035.JPG","dof":"2.0","shutterSpeed":"1200/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4036.JPG","dof":"2.0","shutterSpeed":"1163/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4037.JPG","dof":"3.0","shutterSpeed":"1150/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4038.JPG","dof":"3.0","shutterSpeed":"1145/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4039.JPG","dof":"3.0","shutterSpeed":"1129/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4040.JPG","dof":"3.0","shutterSpeed":"1035/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4041.JPG","dof":"3.0","shutterSpeed":"930/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4042.JPG","dof":"1.0","shutterSpeed":"1001/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4043.JPG","dof":"1.0","shutterSpeed":"1118/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4044.JPG","dof":"4.0","shutterSpeed":"988/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4045.JPG","dof":"3.0","shutterSpeed":"1166/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4046.JPG","dof":"1.0","shutterSpeed":"995/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4047.JPG","dof":"1.0","shutterSpeed":"989/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4048.JPG","dof":"1.0","shutterSpeed":"1014/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4049.JPG","dof":"1.0","shutterSpeed":"1198/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4050.JPG","dof":"1.0","shutterSpeed":"1098/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4051.JPG","dof":"3.0","shutterSpeed":"988/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4052.JPG","dof":"3.0","shutterSpeed":"1145/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4053.JPG","dof":"3.0","shutterSpeed":"1181/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4054.JPG","dof":"4.0","shutterSpeed":"1097/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4055.JPG","dof":"4.0","shutterSpeed":"1099/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4056.JPG","dof":"4.0","shutterSpeed":"899/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4057.JPG","dof":"4.0","shutterSpeed":"817/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4058.JPG","dof":"4.0","shutterSpeed":"852/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4059.JPG","dof":"4.0","shutterSpeed":"884/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4060.JPG","dof":"4.0","shutterSpeed":"1089/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4061.JPG","dof":"4.0","shutterSpeed":"1102/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4062.JPG","dof":"4.0","shutterSpeed":"1114/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4063.JPG","dof":"4.0","shutterSpeed":"894/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4064.JPG","dof":"4.0","shutterSpeed":"895/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4065.JPG","dof":"4.0","shutterSpeed":"1043/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4066.JPG","dof":"4.0","shutterSpeed":"1052/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4067.JPG","dof":"4.0","shutterSpeed":"759/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4068.JPG","dof":"4.0","shutterSpeed":"976/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4069.JPG","dof":"4.0","shutterSpeed":"888/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4070.JPG","dof":"4.0","shutterSpeed":"957/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4071.JPG","dof":"1.0","shutterSpeed":"908/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4072.JPG","dof":"1.0","shutterSpeed":"862/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4073.JPG","dof":"1.0","shutterSpeed":"910/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4074.JPG","dof":"4.0","shutterSpeed":"1144/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4075.JPG","dof":"3.0","shutterSpeed":"1091/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4076.JPG","dof":"4.0","shutterSpeed":"1094/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4077.JPG","dof":"4.0","shutterSpeed":"1103/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4078.JPG","dof":"4.0","shutterSpeed":"1116/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4079.JPG","dof":"4.0","shutterSpeed":"1092/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4080.JPG","dof":"4.0","shutterSpeed":"1052/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4081.JPG","dof":"4.0","shutterSpeed":"728/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4082.JPG","dof":"1.0","shutterSpeed":"1200/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4083.JPG","dof":"3.0","shutterSpeed":"1122/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4084.JPG","dof":"3.0","shutterSpeed":"1169/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4085.JPG","dof":"3.0","shutterSpeed":"1098/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4086.JPG","dof":"1.0","shutterSpeed":"1193/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4087.JPG","dof":"2.3","shutterSpeed":"1180/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4088.JPG","dof":"2.0","shutterSpeed":"1131/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4089.JPG","dof":"2.0","shutterSpeed":"1164/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4090.JPG","dof":"2.0","shutterSpeed":"1137/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4091.JPG","dof":"2.0","shutterSpeed":"1198/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4092.JPG","dof":"2.0","shutterSpeed":"1004/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4093.JPG","dof":"2.0","shutterSpeed":"1121/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4094.JPG","dof":"2.0","shutterSpeed":"1192/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4095.JPG","dof":"2.0","shutterSpeed":"1188/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4096.JPG","dof":"2.0","shutterSpeed":"1183/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4097.JPG","dof":"2.0","shutterSpeed":"1186/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4098.JPG","dof":"2.0","shutterSpeed":"1109/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4099.JPG","dof":"2.0","shutterSpeed":"1008/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4100.JPG","dof":"2.0","shutterSpeed":"1128/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4101.JPG","dof":"2.0","shutterSpeed":"886/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4102.JPG","dof":"2.6","shutterSpeed":"1063/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4103.JPG","dof":"2.6","shutterSpeed":"998/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4104.JPG","dof":"2.6","shutterSpeed":"1019/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4105.JPG","dof":"2.6","shutterSpeed":"965/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4106.JPG","dof":"2.6","shutterSpeed":"967/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4107.JPG","dof":"1.0","shutterSpeed":"1074/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4108.JPG","dof":"2.0","shutterSpeed":"1200/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4109.JPG","dof":"2.0","shutterSpeed":"991/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4110.JPG","dof":"2.0","shutterSpeed":"1065/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4111.JPG","dof":"2.0","shutterSpeed":"969/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4112.JPG","dof":"2.0","shutterSpeed":"1191/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4113.JPG","dof":"2.0","shutterSpeed":"1160/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4114.JPG","dof":"2.0","shutterSpeed":"1118/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4115.JPG","dof":"2.0","shutterSpeed":"965/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4116.JPG","dof":"2.0","shutterSpeed":"1168/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4117.JPG","dof":"2.0","shutterSpeed":"1155/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4118.JPG","dof":"2.0","shutterSpeed":"1107/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4119.JPG","dof":"2.0","shutterSpeed":"1114/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4120.JPG","dof":"2.0","shutterSpeed":"1171/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4121.JPG","dof":"2.0","shutterSpeed":"1148/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4122.JPG","dof":"2.0","shutterSpeed":"1157/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4123.JPG","dof":"2.0","shutterSpeed":"1168/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4124.JPG","dof":"2.0","shutterSpeed":"1161/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4125.JPG","dof":"2.0","shutterSpeed":"1138/100","iso":null,"width":1920,"height":1082},{"name":"DSCF4126.JPG","dof":"2.0","shutterSpeed":"1086/100","iso":null,"width":1920,"height":1082}];

    const state$3 = {
      lightbox: {
        show: writable(false),
        src: writable('/assets/img/photography/01-christmas_market/DSCF2043.jpg')
      },
      photos: {
        'christmas-market': {
          heading: 'Christmas Market',
          subheading: 'at Mannheim, Germany.',
          folderPath: '/assets/img/photography/01-christmas_market/DSCF2',
          images: [
            {
              name: '043.jpg',
              dof: 'f/1.4',
              shutterSpeed: '1/220 sec',
              iso: '200'
            },
            {
              name: '046.jpg',
              dof: 'f/1.4',
              shutterSpeed: '1/480 sec',
              iso: '200'
            },
            {
              name: '050.jpg',
              dof: 'f/1.4',
              shutterSpeed: '1/160 sec',
              iso: '200'
            },
            {
              name: '052.jpg',
              dof: 'f/1.4',
              shutterSpeed: '1/450 sec',
              iso: '200'
            },
            {
              name: '054.jpg',
              dof: 'f/1.4',
              shutterSpeed: '1/52 sec',
              iso: '320'
            },

            {
              name: '055.jpg',
              dof: 'f/1.4',
              shutterSpeed: '1/56 sec',
              iso: '200'
            },
            {
              name: '057.jpg',
              dof: 'f/1.4',
              shutterSpeed: '1/70 sec',
              iso: '200'
            },
            {
              name: '058.jpg',
              dof: 'f/1.4',
              shutterSpeed: '1/52 sec',
              iso: '200'
            },
            {
              name: '059.jpg',
              dof: 'f/1.4',
              shutterSpeed: '1/70 sec',
              iso: '200'
            },
            {
              name: '078.jpg',
              dof: 'f/1.4',
              shutterSpeed: '1/52 sec',
              iso: '2500'
            },

            {
              name: '088.jpg',
              dof: 'f/1.4',
              shutterSpeed: '1/52 sec',
              iso: '2500'
            },
            {
              name: '095.jpg',
              dof: 'f/1.4',
              shutterSpeed: '1/52 sec',
              iso: '3200'
            },
            {
              name: '104.jpg',
              dof: 'f/1.4',
              shutterSpeed: '1/52 sec',
              iso: '2000'
            }
          ],
          cameraModel: 'Fujifilm XE-1',
          lensModel: '35 mm f/1.4'
        },
        malaysia: {
          heading: 'Malaysia',
          subheading: 'at random locations.',
          folderPath: '/assets/img/photography/02-malaysia/DSCF2',
          images: [
            {
              name: '336.jpg',
              dof: 'f/3.2',
              shutterSpeed: '1/3000 sec',
              iso: '200'
            },
            {
              name: '342.jpg',
              dof: 'f/2.8',
              shutterSpeed: '1/4000 sec',
              iso: '200'
            },
            {
              name: '346.jpg',
              dof: 'f/2.8',
              shutterSpeed: '1/300 sec',
              iso: '800'
            },
            {
              name: '348.jpg',
              dof: 'f/2.8',
              shutterSpeed: '1/90 sec',
              iso: '400'
            },
            {
              name: '351.jpg',
              dof: 'f/2.8',
              shutterSpeed: '1/160 sec',
              iso: '100'
            },

            {
              name: '353.jpg',
              dof: 'f/2.8',
              shutterSpeed: '1/56 sec',
              iso: '100'
            },
            {
              name: '363.jpg',
              dof: 'f/2.8',
              shutterSpeed: '1/1900 sec',
              iso: '800'
            },
            {
              name: '366.jpg',
              dof: 'f/1.4',
              shutterSpeed: '1/3500 sec',
              iso: '200'
            },
            {
              name: '368.jpg',
              dof: 'f/1.4',
              shutterSpeed: '1/180 sec',
              iso: '800'
            },
            {
              name: '370.jpg',
              dof: 'f/1.4',
              shutterSpeed: '1/2200 sec',
              iso: '800'
            },

            {
              name: '373.jpg',
              dof: 'f/1.4',
              shutterSpeed: '1/2400 sec',
              iso: '400'
            },
            {
              name: '379.jpg',
              dof: 'f/1.4',
              shutterSpeed: '1/1400 sec',
              iso: '200'
            },
            {
              name: '381.jpg',
              dof: 'f/1.4',
              shutterSpeed: '1/90 sec',
              iso: '800'
            },
            {
              name: '415.jpg',
              dof: 'f/13',
              shutterSpeed: '1/2400 sec',
              iso: '800'
            },
            {
              name: '423.jpg',
              dof: 'f/1.4',
              shutterSpeed: '1/550 sec',
              iso: '800'
            },

            {
              name: '424.jpg',
              dof: 'f/1.4',
              shutterSpeed: '1/1100 sec',
              iso: '200'
            },
            {
              name: '425.jpg',
              dof: 'f/1.4',
              shutterSpeed: '1/1000 sec',
              iso: '200'
            },
            {
              name: '426.jpg',
              dof: 'f/1.4',
              shutterSpeed: '1/900 sec',
              iso: '200'
            }
          ],
          cameraModel: 'Fujifilm XE-1',
          lensModel: '35 mm f/1.4'
        },
        danboard: {
          heading: 'Danboard shots',
          subheading: 'macro shots, done unprofessionally.',
          folderPath: '/assets/img/photography/06-danboard/IMG_',
          images: [
            {
              name: '4735.jpg',
              dof: 'f/2.8',
              shutterSpeed: '1/50 sec',
              iso: '1600'
            },
            {
              name: '2630.jpg',
              dof: 'f/2.8',
              shutterSpeed: '1/20 sec',
              iso: '800'
            },
            {
              name: '2641.jpg',
              dof: 'f/2.8',
              shutterSpeed: '1/20 sec',
              iso: '800'
            },
            {
              name: '3166.jpg',
              dof: 'f/5',
              shutterSpeed: '1/60 sec',
              iso: '200'
            },

            {
              name: '3171.jpg',
              dof: 'f/3.5',
              shutterSpeed: '1/125 sec',
              iso: '200'
            },
            {
              name: '3174.jpg',
              dof: 'f/5',
              shutterSpeed: '1/125 sec',
              iso: '200'
            },
            {
              name: '3175.jpg',
              dof: 'f/5',
              shutterSpeed: '1/80 sec',
              iso: '200'
            },
            {
              name: '3619.jpg',
              dof: 'f/3.5',
              shutterSpeed: '1/60 sec',
              iso: '100'
            }
          ],
          cameraModel: 'Canon EOS 600D',
          lensModel: '100mm f/2.8 Macro'
        },
        'preiser-figure': {
          heading: 'Preiser Figures',
          subheading: 'small toys, magnified.',
          folderPath: '/assets/img/photography/07-preiser_figure/',
          images: [
            { name: '01.jpg', dof: 'f/2.8', shutterSpeed: '1/5 sec', iso: '100' },
            { name: '02.jpg', dof: 'f/8', shutterSpeed: '2 sec', iso: '100' },
            { name: '03.jpg', dof: 'f/5.6', shutterSpeed: '4 sec', iso: '100' },
            { name: '04.jpg', dof: 'f/5.6', shutterSpeed: '2.5 sec', iso: '100' },
            { name: '05.jpg', dof: 'f/2.8', shutterSpeed: '4 sec', iso: '100' },

            {
              name: '06.jpg',
              dof: 'f/2.8',
              shutterSpeed: '1/30 sec',
              iso: '400'
            },
            { name: '07.jpg', dof: 'f/4', shutterSpeed: '1/30 sec', iso: '100' },
            { name: '08.jpg', dof: 'f/2.8', shutterSpeed: '1/4 sec', iso: '100' },
            { name: '09.jpg', dof: 'f/11', shutterSpeed: '2 sec', iso: '400' },
            { name: '10.jpg', dof: 'f/2.8', shutterSpeed: '1/5 sec', iso: '100' }
          ],

          cameraModel: 'Canon EOS 600D',
          lensModel: '100mm f/2.8 Macro' // 'Canon EF 100mm f/2.8 USM Macro Lens'
        },
        berlin: {
          heading: 'Berlin Trip',
          subheading: 'at Berlin, Germany.',
          folderPath: '/assets/img/photography/05-berlin_trip/',
          images: [
            { name: 'DSCF2607.jpg', iso: 200, shutterSpeed: '1/1663', dof: 1.4 },
            { name: 'DSCF2608.jpg', iso: 200, shutterSpeed: '1/739', dof: 1.4 },
            { name: 'DSCF2609.jpg', iso: 200, shutterSpeed: '1/1038', dof: 1.4 },
            { name: 'DSCF2611.jpg', iso: 200, shutterSpeed: '1/600', dof: 1.4 },
            { name: 'DSCF2616.jpg', iso: 200, shutterSpeed: '1/729', dof: 1.4 },
            { name: 'DSCF2619.jpg', iso: 320, shutterSpeed: '1/64', dof: 8.0 },
            { name: 'DSCF2626.jpg', iso: 800, shutterSpeed: '1/38', dof: 1.4 },
            { name: 'DSCF2634.jpg', iso: 800, shutterSpeed: '1/64', dof: 1.4 },
            { name: 'DSCF2637.jpg', iso: 800, shutterSpeed: '1/23', dof: 1.4 },
            { name: 'DSCF2650.jpg', iso: 800, shutterSpeed: '1/53', dof: 1.4 },
            { name: 'DSCF2656.jpg', iso: 200, shutterSpeed: '1/676', dof: 8.9 },
            { name: 'DSCF2658.jpg', iso: 200, shutterSpeed: '1/588', dof: 10.9 },
            { name: 'DSCF2659.jpg', iso: 200, shutterSpeed: '1/2091', dof: 4.0 },
            { name: 'DSCF2660.jpg', iso: 200, shutterSpeed: '1/2353', dof: 4.0 },
            { name: 'DSCF2666.jpg', iso: 200, shutterSpeed: '1/143', dof: 10.9 },
            { name: 'DSCF2667.jpg', iso: 200, shutterSpeed: '1/1859', dof: 3.2 },
            { name: 'DSCF2668.jpg', iso: 200, shutterSpeed: '1/111', dof: 10.9 },
            { name: 'DSCF2670.jpg', iso: 200, shutterSpeed: '1/3126', dof: 1.4 },
            { name: 'DSCF2671.jpg', iso: 320, shutterSpeed: '1/64', dof: 1.4 },
            { name: 'DSCF2673.jpg', iso: 200, shutterSpeed: '1/4096', dof: 1.6 },
            { name: 'DSCF2685.jpg', iso: 200, shutterSpeed: '1/1226', dof: 4.0 },
            { name: 'DSCF2690.jpg', iso: 200, shutterSpeed: '1/792', dof: 4.0 },
            { name: 'DSCF2695.jpg', iso: 200, shutterSpeed: '1/653', dof: 4.0 },
            { name: 'DSCF2696.jpg', iso: 200, shutterSpeed: '1/724', dof: 4.0 },
            { name: 'DSCF2697.jpg', iso: 200, shutterSpeed: '1/1252', dof: 4.0 },
            { name: 'DSCF2700.jpg', iso: 200, shutterSpeed: '1/105', dof: 4.0 },
            { name: 'DSCF2702.jpg', iso: 200, shutterSpeed: '1/1458', dof: 1.4 },
            { name: 'DSCF2729.jpg', iso: 800, shutterSpeed: '1/20', dof: 1.4 },
            { name: 'DSCF2730.jpg', iso: 800, shutterSpeed: '1/24', dof: 1.4 },
            { name: 'DSCF2733.jpg', iso: 200, shutterSpeed: '1/241', dof: 10.9 },
            { name: 'DSCF2738.jpg', iso: 200, shutterSpeed: '1/64', dof: 8.0 },
            { name: 'DSCF2741.jpg', iso: 200, shutterSpeed: '1/69', dof: 8.0 },
            { name: 'DSCF2743.jpg', iso: 200, shutterSpeed: '1/428', dof: 8.0 },
            { name: 'DSCF2755.jpg', iso: 200, shutterSpeed: '1/1438', dof: 1.4 },
            { name: 'DSCF2756.jpg', iso: 200, shutterSpeed: '1/152', dof: 1.6 },
            { name: 'DSCF2760.jpg', iso: 200, shutterSpeed: '1/229', dof: 1.4 },
            { name: 'DSCF2763.jpg', iso: 200, shutterSpeed: '1/1629', dof: 1.6 },
            { name: 'DSCF2767.jpg', iso: 400, shutterSpeed: '1/64', dof: 1.4 },
            { name: 'DSCF2771.jpg', iso: 200, shutterSpeed: '1/256', dof: 1.4 },
            { name: 'DSCF2775.jpg', iso: 320, shutterSpeed: '1/64', dof: 1.4 },
            { name: 'DSCF2776.jpg', iso: 320, shutterSpeed: '1/64', dof: 1.4 },
            { name: 'DSCF2777.jpg', iso: 500, shutterSpeed: '1/64', dof: 1.4 },
            { name: 'DSCF2778.jpg', iso: 400, shutterSpeed: '1/64', dof: 1.4 }
          ],
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
        bali: {
          heading: 'Bali, Indonesia',
          subheading: 'A day in paradise',
          folderPath: '/assets/img/photography/13-bali/',
          images: bali,
          cameraModel: 'Fujifilm XE-1',
          lensModel: '35 mm f/1.4'
        }
      }
    };

    var photo = {
      state: state$3,
      actions: {
        showLightbox (value) {
          state$3.lightbox.show.set(true);
          state$3.lightbox.src.set(value);
        },
        hideLightbox () {
          state$3.lightbox.show.set(false);
          state$3.lightbox.src.set('');
        }
      }
    };

    /* src/atomic/pages/Photography/Album.svelte generated by Svelte v3.19.1 */
    const file$a = "src/atomic/pages/Photography/Album.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (19:5) {#each images as it}
    function create_each_block$3(ctx) {
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let caption;
    	let span0;
    	let b;
    	let t2;
    	let i;
    	let t4;
    	let span1;

    	let t5_value = (/*it*/ ctx[11].dof.includes("f/")
    	? /*it*/ ctx[11].dof
    	: "f/" + /*it*/ ctx[11].dof) + "";

    	let t5;
    	let t6;
    	let span2;

    	let t7_value = (/*it*/ ctx[11].shutterSpeed.includes("sec")
    	? /*it*/ ctx[11].shutterSpeed
    	: /*it*/ ctx[11].shutterSpeed + " sec") + "";

    	let t7;
    	let t8;
    	let span3;
    	let t9;
    	let t10_value = /*it*/ ctx[11].iso + "";
    	let t10;
    	let t11;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[10](/*it*/ ctx[11], ...args);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			caption = element("caption");
    			span0 = element("span");
    			b = element("b");
    			b.textContent = `${/*cameraModel*/ ctx[3]}`;
    			t2 = text(" with ");
    			i = element("i");
    			i.textContent = `${/*lensModel*/ ctx[4]}`;
    			t4 = space();
    			span1 = element("span");
    			t5 = text(t5_value);
    			t6 = space();
    			span2 = element("span");
    			t7 = text(t7_value);
    			t8 = space();
    			span3 = element("span");
    			t9 = text("ISO ");
    			t10 = text(t10_value);
    			t11 = space();
    			if (img.src !== (img_src_value = /*folderPath*/ ctx[2] + /*it*/ ctx[11].name)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-l6l525");
    			add_location(img, file$a, 25, 14, 515);
    			attr_dev(div0, "class", "img-placeholder svelte-l6l525");
    			add_location(div0, file$a, 22, 4, 464);
    			add_location(b, file$a, 31, 20, 740);
    			add_location(i, file$a, 31, 46, 766);
    			add_location(span0, file$a, 31, 14, 734);
    			add_location(span1, file$a, 32, 14, 806);
    			add_location(span2, file$a, 33, 14, 882);
    			add_location(span3, file$a, 34, 14, 988);
    			attr_dev(caption, "class", "img-caption h6 svelte-l6l525");
    			add_location(caption, file$a, 30, 12, 687);
    			attr_dev(div1, "class", "img svelte-l6l525");
    			add_location(div1, file$a, 20, 6, 434);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div1, t0);
    			append_dev(div1, caption);
    			append_dev(caption, span0);
    			append_dev(span0, b);
    			append_dev(span0, t2);
    			append_dev(span0, i);
    			append_dev(caption, t4);
    			append_dev(caption, span1);
    			append_dev(span1, t5);
    			append_dev(caption, t6);
    			append_dev(caption, span2);
    			append_dev(span2, t7);
    			append_dev(caption, t8);
    			append_dev(caption, span3);
    			append_dev(span3, t9);
    			append_dev(span3, t10);
    			append_dev(div1, t11);
    			dispose = listen_dev(img, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(19:5) {#each images as it}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div2;
    	let div0;
    	let a;
    	let t1;
    	let h2;
    	let t3;
    	let p;
    	let t5;
    	let br;
    	let t6;
    	let div1;
    	let each_value = /*images*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			a = element("a");
    			a.textContent = "Back to Albums";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = `${/*heading*/ ctx[5]}`;
    			t3 = space();
    			p = element("p");
    			p.textContent = `${/*subheading*/ ctx[6]}`;
    			t5 = space();
    			br = element("br");
    			t6 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(a, "href", "/photos");
    			add_location(a, file$a, 11, 6, 265);
    			add_location(div0, file$a, 10, 4, 253);
    			add_location(h2, file$a, 14, 4, 318);
    			add_location(p, file$a, 15, 4, 341);
    			add_location(br, file$a, 16, 4, 365);
    			attr_dev(div1, "class", "img-holder svelte-l6l525");
    			add_location(div1, file$a, 17, 4, 376);
    			add_location(div2, file$a, 9, 2, 243);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, a);
    			append_dev(div2, t1);
    			append_dev(div2, h2);
    			append_dev(div2, t3);
    			append_dev(div2, p);
    			append_dev(div2, t5);
    			append_dev(div2, br);
    			append_dev(div2, t6);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*images, lensModel, cameraModel, folderPath, actions*/ 31) {
    				each_value = /*images*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { params } = $$props;
    	const { state, actions } = photo;
    	const { photos } = state;
    	let { images, folderPath, cameraModel, lensModel, heading, subheading } = photos[params.album];
    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Album> was created with unknown prop '${key}'`);
    	});

    	const click_handler = it => actions.showLightbox(folderPath + it.name);

    	$$self.$set = $$props => {
    		if ("params" in $$props) $$invalidate(7, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		photo,
    		params,
    		state,
    		actions,
    		photos,
    		images,
    		folderPath,
    		cameraModel,
    		lensModel,
    		heading,
    		subheading
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(7, params = $$props.params);
    		if ("images" in $$props) $$invalidate(1, images = $$props.images);
    		if ("folderPath" in $$props) $$invalidate(2, folderPath = $$props.folderPath);
    		if ("cameraModel" in $$props) $$invalidate(3, cameraModel = $$props.cameraModel);
    		if ("lensModel" in $$props) $$invalidate(4, lensModel = $$props.lensModel);
    		if ("heading" in $$props) $$invalidate(5, heading = $$props.heading);
    		if ("subheading" in $$props) $$invalidate(6, subheading = $$props.subheading);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		actions,
    		images,
    		folderPath,
    		cameraModel,
    		lensModel,
    		heading,
    		subheading,
    		params,
    		state,
    		photos,
    		click_handler
    	];
    }

    class Album extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$a, safe_not_equal, { params: 7 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Album",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[7] === undefined && !("params" in props)) {
    			console.warn("<Album> was created without expected prop 'params'");
    		}
    	}

    	get params() {
    		throw new Error("<Album>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Album>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/atomic/pages/Photography/Lightbox.svelte generated by Svelte v3.19.1 */
    const file$b = "src/atomic/pages/Photography/Lightbox.svelte";

    // (10:0) {#if show}
    function create_if_block$1(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "×";
    			t1 = space();
    			div1 = element("div");
    			attr_dev(div0, "class", "lightbox-close svelte-v0bk4u");
    			add_location(div0, file$b, 11, 3, 215);
    			attr_dev(div1, "class", "lightbox-preview svelte-v0bk4u");
    			attr_dev(div1, "style", /*style*/ ctx[1]);
    			add_location(div1, file$b, 14, 4, 307);
    			attr_dev(div2, "class", "lightbox svelte-v0bk4u");
    			add_location(div2, file$b, 10, 2, 189);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			dispose = listen_dev(div0, "click", /*click_handler*/ ctx[3], false, false, false);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(10:0) {#if show}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let if_block_anchor;
    	let if_block = /*show*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*show*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { src = "" } = $$props;
    	let { show = false } = $$props;
    	const style = `background: url(${src}) center center / contain`;
    	const writable_props = ["src", "show"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Lightbox> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => actions.hideLightbox();

    	$$self.$set = $$props => {
    		if ("src" in $$props) $$invalidate(2, src = $$props.src);
    		if ("show" in $$props) $$invalidate(0, show = $$props.show);
    	};

    	$$self.$capture_state = () => ({ photo, src, show, style });

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(2, src = $$props.src);
    		if ("show" in $$props) $$invalidate(0, show = $$props.show);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [show, style, src, click_handler];
    }

    class Lightbox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$b, safe_not_equal, { src: 2, show: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Lightbox",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get src() {
    		throw new Error("<Lightbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set src(value) {
    		throw new Error("<Lightbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get show() {
    		throw new Error("<Lightbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set show(value) {
    		throw new Error("<Lightbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/atomic/pages/Photography.svelte generated by Svelte v3.19.1 */
    const file$c = "src/atomic/pages/Photography.svelte";

    // (22:6) {:else}
    function create_else_block(ctx) {
    	let current;

    	const album = new Album({
    			props: { params: /*params*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(album.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(album, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const album_changes = {};
    			if (dirty & /*params*/ 1) album_changes.params = /*params*/ ctx[0];
    			album.$set(album_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(album.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(album.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(album, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(22:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (20:6) {#if isExact}
    function create_if_block$2(ctx) {
    	let current;
    	const main = new Main({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(main.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(main, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(main.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(main.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(main, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(20:6) {#if isExact}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let div1;
    	let div0;
    	let br0;
    	let t0;
    	let br1;
    	let t1;
    	let br2;
    	let t2;
    	let t3;
    	let current_block_type_index;
    	let if_block;
    	let t4;
    	let br3;
    	let t5;
    	let br4;
    	let t6;
    	let br5;
    	let current;

    	const lightbox = new Lightbox({
    			props: {
    				src: /*$src*/ ctx[1],
    				show: /*$show*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const if_block_creators = [create_if_block$2, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*isExact*/ ctx[5]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			br0 = element("br");
    			t0 = space();
    			br1 = element("br");
    			t1 = space();
    			br2 = element("br");
    			t2 = space();
    			create_component(lightbox.$$.fragment);
    			t3 = space();
    			if_block.c();
    			t4 = space();
    			br3 = element("br");
    			t5 = space();
    			br4 = element("br");
    			t6 = space();
    			br5 = element("br");
    			add_location(br0, file$c, 15, 6, 374);
    			add_location(br1, file$c, 16, 6, 387);
    			add_location(br2, file$c, 17, 6, 400);
    			add_location(br3, file$c, 24, 6, 541);
    			add_location(br4, file$c, 25, 6, 554);
    			add_location(br5, file$c, 26, 6, 567);
    			attr_dev(div0, "class", "body-column");
    			add_location(div0, file$c, 14, 4, 342);
    			attr_dev(div1, "class", "body");
    			add_location(div1, file$c, 13, 2, 319);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, br0);
    			append_dev(div0, t0);
    			append_dev(div0, br1);
    			append_dev(div0, t1);
    			append_dev(div0, br2);
    			append_dev(div0, t2);
    			mount_component(lightbox, div0, null);
    			append_dev(div0, t3);
    			if_blocks[current_block_type_index].m(div0, null);
    			append_dev(div0, t4);
    			append_dev(div0, br3);
    			append_dev(div0, t5);
    			append_dev(div0, br4);
    			append_dev(div0, t6);
    			append_dev(div0, br5);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const lightbox_changes = {};
    			if (dirty & /*$src*/ 2) lightbox_changes.src = /*$src*/ ctx[1];
    			if (dirty & /*$show*/ 4) lightbox_changes.show = /*$show*/ ctx[2];
    			lightbox.$set(lightbox_changes);
    			if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(lightbox.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(lightbox.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(lightbox);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $src;
    	let $show;
    	const { show, src } = photo.state.lightbox;
    	validate_store(show, "show");
    	component_subscribe($$self, show, value => $$invalidate(2, $show = value));
    	validate_store(src, "src");
    	component_subscribe($$self, src, value => $$invalidate(1, $src = value));
    	let { params } = $$props;
    	const isExact = params.album === undefined;
    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Photography> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		Main,
    		Album,
    		Lightbox,
    		photo,
    		show,
    		src,
    		params,
    		isExact,
    		undefined,
    		$src,
    		$show
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [params, $src, $show, show, src, isExact];
    }

    class Photography extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$c, safe_not_equal, { params: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Photography",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[0] === undefined && !("params" in props)) {
    			console.warn("<Photography> was created without expected prop 'params'");
    		}
    	}

    	get params() {
    		throw new Error("<Photography>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Photography>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const state$4 = {
      header: 'alextanhongpin',
      username: 'Alex Tan',
      footer: `Copyright © ${new Date().getFullYear()} alextanhongpin`,
      profileImg: '/assets/img/profile.jpg',
      links: [
        {
          to: '/',
          label: 'Home'
        },
        {
          to: '/contacts',
          label: 'Contact'
        },
        {
          to: '/photos',
          label: 'Photo'
        },
        {
          to: '/books',
          label: 'Book'
        },
        {
          to: '/songs',
          label: 'Guitar'
        },
        {
          to: '/codes',
          label: 'Code'
        }
      ]
    };

    var app = { state: state$4 };

    /* src/App.svelte generated by Svelte v3.19.1 */

    const file$d = "src/App.svelte";

    function create_fragment$d(ctx) {
    	let main;
    	let t0;
    	let t1;
    	let t2;
    	let current;

    	const header_1 = new Header({
    			props: {
    				header: /*header*/ ctx[5],
    				username: /*username*/ ctx[6],
    				profileImg: /*profileImg*/ ctx[7]
    			},
    			$$inline: true
    		});

    	const navbar = new Navbar({
    			props: {
    				links: /*links*/ ctx[3],
    				route: /*route*/ ctx[2]
    			},
    			$$inline: true
    		});

    	var switch_value = /*page*/ ctx[0];

    	function switch_props(ctx) {
    		return {
    			props: { params: /*params*/ ctx[1] },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	const footer_1 = new Footer({
    			props: { footer: /*footer*/ ctx[4] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(header_1.$$.fragment);
    			t0 = space();
    			create_component(navbar.$$.fragment);
    			t1 = space();
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t2 = space();
    			create_component(footer_1.$$.fragment);
    			add_location(main, file$d, 58, 0, 1333);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(header_1, main, null);
    			append_dev(main, t0);
    			mount_component(navbar, main, null);
    			append_dev(main, t1);

    			if (switch_instance) {
    				mount_component(switch_instance, main, null);
    			}

    			append_dev(main, t2);
    			mount_component(footer_1, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const navbar_changes = {};
    			if (dirty & /*route*/ 4) navbar_changes.route = /*route*/ ctx[2];
    			navbar.$set(navbar_changes);
    			const switch_instance_changes = {};
    			if (dirty & /*params*/ 2) switch_instance_changes.params = /*params*/ ctx[1];

    			if (switch_value !== (switch_value = /*page*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, main, t2);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header_1.$$.fragment, local);
    			transition_in(navbar.$$.fragment, local);
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			transition_in(footer_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header_1.$$.fragment, local);
    			transition_out(navbar.$$.fragment, local);
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			transition_out(footer_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(header_1);
    			destroy_component(navbar);
    			if (switch_instance) destroy_component(switch_instance);
    			destroy_component(footer_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	const { links, footer, header, username, profileImg } = app.state;

    	// Routing.
    	let page$1;

    	let params = {};
    	let route;

    	page("/", () => {
    		typewriter.actions.clear();
    		$$invalidate(2, route = "/");
    		$$invalidate(0, page$1 = Home);
    	});

    	page("/books", () => {
    		$$invalidate(2, route = "/books");
    		$$invalidate(0, page$1 = Book);
    	});

    	page("/contacts", () => {
    		$$invalidate(2, route = "/contacts");
    		$$invalidate(0, page$1 = Contact);
    	});

    	page("/songs", () => {
    		$$invalidate(2, route = "/songs");
    		$$invalidate(0, page$1 = Guitar);
    	});

    	page("/codes", () => {
    		$$invalidate(2, route = "/codes");
    		$$invalidate(0, page$1 = Programming);
    	});

    	page("/photos/:album?", (ctx, next) => {
    		$$invalidate(1, params = ctx.params);

    		/* next() */
    		$$invalidate(2, route = `/photos/${params.album}`);

    		$$invalidate(0, page$1 = Photography);
    	});

    	/* router('/*', () => page = Error) */
    	page.start();

    	$$self.$capture_state = () => ({
    		router: page,
    		Header,
    		Navbar,
    		Footer,
    		About,
    		Book,
    		Contact,
    		Home,
    		Guitar,
    		Programming,
    		Photography,
    		app,
    		typewriter,
    		links,
    		footer,
    		header,
    		username,
    		profileImg,
    		page: page$1,
    		params,
    		route
    	});

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(0, page$1 = $$props.page);
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    		if ("route" in $$props) $$invalidate(2, route = $$props.route);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page$1, params, route, links, footer, header, username, profileImg];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    const app$1 = new App({
      target: document.body
      // props
    });

    return app$1;

}());
//# sourceMappingURL=bundle.js.map
