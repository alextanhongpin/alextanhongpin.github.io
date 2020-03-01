
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

    const actions = {
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
      actions
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
    		startTyping(actions, headingGhost.split(""), subheadingGhost.split(""));
    	}

    	$$self.$capture_state = () => ({
    		type,
    		pause,
    		state: state$1,
    		actions,
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
    			attr_dev(iframe0, "class", "iframe svelte-1v1clny");
    			if (iframe0.src !== (iframe0_src_value = "/programming/p00_piano.html")) attr_dev(iframe0, "src", iframe0_src_value);
    			add_location(iframe0, file$8, 7, 8, 219);
    			attr_dev(section0, "class", "col-10 svelte-1v1clny");
    			add_location(section0, file$8, 5, 6, 155);
    			add_location(h31, file$8, 11, 8, 336);
    			attr_dev(iframe1, "class", "iframe svelte-1v1clny");
    			if (iframe1.src !== (iframe1_src_value = "/programming/p01_calculator.html")) attr_dev(iframe1, "src", iframe1_src_value);
    			add_location(iframe1, file$8, 12, 8, 364);
    			attr_dev(section1, "class", "col-10 svelte-1v1clny");
    			add_location(section1, file$8, 10, 6, 303);
    			add_location(h32, file$8, 16, 8, 486);
    			attr_dev(iframe2, "class", "iframe svelte-1v1clny");
    			if (iframe2.src !== (iframe2_src_value = "/programming/p02_clock.html")) attr_dev(iframe2, "src", iframe2_src_value);
    			add_location(iframe2, file$8, 17, 8, 516);
    			attr_dev(section2, "class", "col-10 svelte-1v1clny");
    			add_location(section2, file$8, 15, 6, 453);
    			add_location(h33, file$8, 21, 8, 633);
    			attr_dev(iframe3, "class", "iframe svelte-1v1clny");
    			if (iframe3.src !== (iframe3_src_value = "/programming/p03_binary%20clock.html")) attr_dev(iframe3, "src", iframe3_src_value);
    			add_location(iframe3, file$8, 22, 8, 663);
    			attr_dev(section3, "class", "col-10 svelte-1v1clny");
    			add_location(section3, file$8, 20, 6, 600);
    			add_location(h34, file$8, 26, 8, 789);
    			attr_dev(iframe4, "class", "iframe svelte-1v1clny");
    			if (iframe4.src !== (iframe4_src_value = "/programming/p06_flag_of_malaysia.html")) attr_dev(iframe4, "src", iframe4_src_value);
    			add_location(iframe4, file$8, 27, 8, 820);
    			attr_dev(section4, "class", "col-10 svelte-1v1clny");
    			add_location(section4, file$8, 25, 6, 756);
    			add_location(h35, file$8, 31, 8, 948);
    			attr_dev(iframe5, "class", "iframe svelte-1v1clny");
    			if (iframe5.src !== (iframe5_src_value = "/programming/p05_magnifier%20macro.html")) attr_dev(iframe5, "src", iframe5_src_value);
    			add_location(iframe5, file$8, 32, 8, 981);
    			attr_dev(section5, "class", "col-10 svelte-1v1clny");
    			add_location(section5, file$8, 30, 6, 915);
    			add_location(h36, file$8, 36, 8, 1110);
    			attr_dev(iframe6, "class", "iframe svelte-1v1clny");
    			if (iframe6.src !== (iframe6_src_value = "/programming/p07_box2d%20bouncing%20ball.html")) attr_dev(iframe6, "src", iframe6_src_value);
    			add_location(iframe6, file$8, 37, 8, 1145);
    			attr_dev(section6, "class", "col-10 svelte-1v1clny");
    			add_location(section6, file$8, 35, 6, 1077);
    			add_location(h37, file$8, 44, 8, 1308);
    			attr_dev(iframe7, "class", "iframe svelte-1v1clny");
    			if (iframe7.src !== (iframe7_src_value = "/programming/p08_matrix.html")) attr_dev(iframe7, "src", iframe7_src_value);
    			add_location(iframe7, file$8, 45, 8, 1332);
    			attr_dev(section7, "class", "col-10 svelte-1v1clny");
    			add_location(section7, file$8, 43, 6, 1275);
    			add_location(h38, file$8, 49, 8, 1450);
    			attr_dev(iframe8, "class", "iframe svelte-1v1clny");
    			if (iframe8.src !== (iframe8_src_value = "/programming/p13_cube3d.html")) attr_dev(iframe8, "src", iframe8_src_value);
    			add_location(iframe8, file$8, 50, 8, 1475);
    			attr_dev(section8, "class", "col-10 svelte-1v1clny");
    			add_location(section8, file$8, 48, 6, 1417);
    			add_location(h39, file$8, 54, 8, 1593);
    			attr_dev(iframe9, "class", "iframe svelte-1v1clny");
    			if (iframe9.src !== (iframe9_src_value = "/programming/p14_tictactoe.html")) attr_dev(iframe9, "src", iframe9_src_value);
    			add_location(iframe9, file$8, 55, 8, 1633);
    			attr_dev(section9, "class", "col-10 svelte-1v1clny");
    			add_location(section9, file$8, 53, 6, 1560);
    			add_location(h310, file$8, 59, 8, 1754);
    			attr_dev(a, "href", "/games");
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$8, 60, 8, 1780);
    			attr_dev(section10, "class", "col-10 svelte-1v1clny");
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

    const state$3 = {
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

    var app = { state: state$3 };

    /* src/App.svelte generated by Svelte v3.19.1 */

    const file$9 = "src/App.svelte";

    function create_fragment$9(ctx) {
    	let main;
    	let t0;
    	let t1;
    	let t2;
    	let current;

    	const header_1 = new Header({
    			props: {
    				header: /*header*/ ctx[4],
    				username: /*username*/ ctx[5],
    				profileImg: /*profileImg*/ ctx[6]
    			},
    			$$inline: true
    		});

    	const navbar = new Navbar({
    			props: {
    				links: /*links*/ ctx[2],
    				route: /*route*/ ctx[1]
    			},
    			$$inline: true
    		});

    	var switch_value = /*page*/ ctx[0];

    	function switch_props(ctx) {
    		return {
    			props: { params: /*params*/ ctx[7] },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	const footer_1 = new Footer({
    			props: { footer: /*footer*/ ctx[3] },
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
    			add_location(main, file$9, 50, 0, 1085);
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
    			if (dirty & /*route*/ 2) navbar_changes.route = /*route*/ ctx[1];
    			navbar.$set(navbar_changes);

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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	const { links, footer, header, username, profileImg } = app.state;

    	// Routing.
    	let page$1;

    	let params;
    	let route;

    	page("/", () => {
    		typewriter.actions.clear();
    		$$invalidate(1, route = "/");
    		$$invalidate(0, page$1 = Home);
    	});

    	page("/books", () => {
    		$$invalidate(1, route = "/books");
    		$$invalidate(0, page$1 = Book);
    	});

    	page("/contacts", () => {
    		$$invalidate(1, route = "/contacts");
    		$$invalidate(0, page$1 = Contact);
    	});

    	page("/songs", () => {
    		$$invalidate(1, route = "/songs");
    		$$invalidate(0, page$1 = Guitar);
    	});

    	page("/codes", () => {
    		$$invalidate(1, route = "/codes");
    		$$invalidate(0, page$1 = Programming);
    	});

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
    		if ("params" in $$props) $$invalidate(7, params = $$props.params);
    		if ("route" in $$props) $$invalidate(1, route = $$props.route);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page$1, route, links, footer, header, username, profileImg, params];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$9.name
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
