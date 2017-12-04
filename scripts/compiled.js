(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var _assign = require('object-assign');

var emptyObject = require('fbjs/lib/emptyObject');
var _invariant = require('fbjs/lib/invariant');

if (process.env.NODE_ENV !== 'production') {
  var warning = require('fbjs/lib/warning');
}

var MIXINS_KEY = 'mixins';

// Helper function to allow the creation of anonymous functions which do not
// have .name set to the name of the variable being assigned to.
function identity(fn) {
  return fn;
}

var ReactPropTypeLocationNames;
if (process.env.NODE_ENV !== 'production') {
  ReactPropTypeLocationNames = {
    prop: 'prop',
    context: 'context',
    childContext: 'child context'
  };
} else {
  ReactPropTypeLocationNames = {};
}

function factory(ReactComponent, isValidElement, ReactNoopUpdateQueue) {
  /**
   * Policies that describe methods in `ReactClassInterface`.
   */

  var injectedMixins = [];

  /**
   * Composite components are higher-level components that compose other composite
   * or host components.
   *
   * To create a new type of `ReactClass`, pass a specification of
   * your new class to `React.createClass`. The only requirement of your class
   * specification is that you implement a `render` method.
   *
   *   var MyComponent = React.createClass({
   *     render: function() {
   *       return <div>Hello World</div>;
   *     }
   *   });
   *
   * The class specification supports a specific protocol of methods that have
   * special meaning (e.g. `render`). See `ReactClassInterface` for
   * more the comprehensive protocol. Any other properties and methods in the
   * class specification will be available on the prototype.
   *
   * @interface ReactClassInterface
   * @internal
   */
  var ReactClassInterface = {
    /**
     * An array of Mixin objects to include when defining your component.
     *
     * @type {array}
     * @optional
     */
    mixins: 'DEFINE_MANY',

    /**
     * An object containing properties and methods that should be defined on
     * the component's constructor instead of its prototype (static methods).
     *
     * @type {object}
     * @optional
     */
    statics: 'DEFINE_MANY',

    /**
     * Definition of prop types for this component.
     *
     * @type {object}
     * @optional
     */
    propTypes: 'DEFINE_MANY',

    /**
     * Definition of context types for this component.
     *
     * @type {object}
     * @optional
     */
    contextTypes: 'DEFINE_MANY',

    /**
     * Definition of context types this component sets for its children.
     *
     * @type {object}
     * @optional
     */
    childContextTypes: 'DEFINE_MANY',

    // ==== Definition methods ====

    /**
     * Invoked when the component is mounted. Values in the mapping will be set on
     * `this.props` if that prop is not specified (i.e. using an `in` check).
     *
     * This method is invoked before `getInitialState` and therefore cannot rely
     * on `this.state` or use `this.setState`.
     *
     * @return {object}
     * @optional
     */
    getDefaultProps: 'DEFINE_MANY_MERGED',

    /**
     * Invoked once before the component is mounted. The return value will be used
     * as the initial value of `this.state`.
     *
     *   getInitialState: function() {
     *     return {
     *       isOn: false,
     *       fooBaz: new BazFoo()
     *     }
     *   }
     *
     * @return {object}
     * @optional
     */
    getInitialState: 'DEFINE_MANY_MERGED',

    /**
     * @return {object}
     * @optional
     */
    getChildContext: 'DEFINE_MANY_MERGED',

    /**
     * Uses props from `this.props` and state from `this.state` to render the
     * structure of the component.
     *
     * No guarantees are made about when or how often this method is invoked, so
     * it must not have side effects.
     *
     *   render: function() {
     *     var name = this.props.name;
     *     return <div>Hello, {name}!</div>;
     *   }
     *
     * @return {ReactComponent}
     * @required
     */
    render: 'DEFINE_ONCE',

    // ==== Delegate methods ====

    /**
     * Invoked when the component is initially created and about to be mounted.
     * This may have side effects, but any external subscriptions or data created
     * by this method must be cleaned up in `componentWillUnmount`.
     *
     * @optional
     */
    componentWillMount: 'DEFINE_MANY',

    /**
     * Invoked when the component has been mounted and has a DOM representation.
     * However, there is no guarantee that the DOM node is in the document.
     *
     * Use this as an opportunity to operate on the DOM when the component has
     * been mounted (initialized and rendered) for the first time.
     *
     * @param {DOMElement} rootNode DOM element representing the component.
     * @optional
     */
    componentDidMount: 'DEFINE_MANY',

    /**
     * Invoked before the component receives new props.
     *
     * Use this as an opportunity to react to a prop transition by updating the
     * state using `this.setState`. Current props are accessed via `this.props`.
     *
     *   componentWillReceiveProps: function(nextProps, nextContext) {
     *     this.setState({
     *       likesIncreasing: nextProps.likeCount > this.props.likeCount
     *     });
     *   }
     *
     * NOTE: There is no equivalent `componentWillReceiveState`. An incoming prop
     * transition may cause a state change, but the opposite is not true. If you
     * need it, you are probably looking for `componentWillUpdate`.
     *
     * @param {object} nextProps
     * @optional
     */
    componentWillReceiveProps: 'DEFINE_MANY',

    /**
     * Invoked while deciding if the component should be updated as a result of
     * receiving new props, state and/or context.
     *
     * Use this as an opportunity to `return false` when you're certain that the
     * transition to the new props/state/context will not require a component
     * update.
     *
     *   shouldComponentUpdate: function(nextProps, nextState, nextContext) {
     *     return !equal(nextProps, this.props) ||
     *       !equal(nextState, this.state) ||
     *       !equal(nextContext, this.context);
     *   }
     *
     * @param {object} nextProps
     * @param {?object} nextState
     * @param {?object} nextContext
     * @return {boolean} True if the component should update.
     * @optional
     */
    shouldComponentUpdate: 'DEFINE_ONCE',

    /**
     * Invoked when the component is about to update due to a transition from
     * `this.props`, `this.state` and `this.context` to `nextProps`, `nextState`
     * and `nextContext`.
     *
     * Use this as an opportunity to perform preparation before an update occurs.
     *
     * NOTE: You **cannot** use `this.setState()` in this method.
     *
     * @param {object} nextProps
     * @param {?object} nextState
     * @param {?object} nextContext
     * @param {ReactReconcileTransaction} transaction
     * @optional
     */
    componentWillUpdate: 'DEFINE_MANY',

    /**
     * Invoked when the component's DOM representation has been updated.
     *
     * Use this as an opportunity to operate on the DOM when the component has
     * been updated.
     *
     * @param {object} prevProps
     * @param {?object} prevState
     * @param {?object} prevContext
     * @param {DOMElement} rootNode DOM element representing the component.
     * @optional
     */
    componentDidUpdate: 'DEFINE_MANY',

    /**
     * Invoked when the component is about to be removed from its parent and have
     * its DOM representation destroyed.
     *
     * Use this as an opportunity to deallocate any external resources.
     *
     * NOTE: There is no `componentDidUnmount` since your component will have been
     * destroyed by that point.
     *
     * @optional
     */
    componentWillUnmount: 'DEFINE_MANY',

    // ==== Advanced methods ====

    /**
     * Updates the component's currently mounted DOM representation.
     *
     * By default, this implements React's rendering and reconciliation algorithm.
     * Sophisticated clients may wish to override this.
     *
     * @param {ReactReconcileTransaction} transaction
     * @internal
     * @overridable
     */
    updateComponent: 'OVERRIDE_BASE'
  };

  /**
   * Mapping from class specification keys to special processing functions.
   *
   * Although these are declared like instance properties in the specification
   * when defining classes using `React.createClass`, they are actually static
   * and are accessible on the constructor instead of the prototype. Despite
   * being static, they must be defined outside of the "statics" key under
   * which all other static methods are defined.
   */
  var RESERVED_SPEC_KEYS = {
    displayName: function(Constructor, displayName) {
      Constructor.displayName = displayName;
    },
    mixins: function(Constructor, mixins) {
      if (mixins) {
        for (var i = 0; i < mixins.length; i++) {
          mixSpecIntoComponent(Constructor, mixins[i]);
        }
      }
    },
    childContextTypes: function(Constructor, childContextTypes) {
      if (process.env.NODE_ENV !== 'production') {
        validateTypeDef(Constructor, childContextTypes, 'childContext');
      }
      Constructor.childContextTypes = _assign(
        {},
        Constructor.childContextTypes,
        childContextTypes
      );
    },
    contextTypes: function(Constructor, contextTypes) {
      if (process.env.NODE_ENV !== 'production') {
        validateTypeDef(Constructor, contextTypes, 'context');
      }
      Constructor.contextTypes = _assign(
        {},
        Constructor.contextTypes,
        contextTypes
      );
    },
    /**
     * Special case getDefaultProps which should move into statics but requires
     * automatic merging.
     */
    getDefaultProps: function(Constructor, getDefaultProps) {
      if (Constructor.getDefaultProps) {
        Constructor.getDefaultProps = createMergedResultFunction(
          Constructor.getDefaultProps,
          getDefaultProps
        );
      } else {
        Constructor.getDefaultProps = getDefaultProps;
      }
    },
    propTypes: function(Constructor, propTypes) {
      if (process.env.NODE_ENV !== 'production') {
        validateTypeDef(Constructor, propTypes, 'prop');
      }
      Constructor.propTypes = _assign({}, Constructor.propTypes, propTypes);
    },
    statics: function(Constructor, statics) {
      mixStaticSpecIntoComponent(Constructor, statics);
    },
    autobind: function() {}
  };

  function validateTypeDef(Constructor, typeDef, location) {
    for (var propName in typeDef) {
      if (typeDef.hasOwnProperty(propName)) {
        // use a warning instead of an _invariant so components
        // don't show up in prod but only in __DEV__
        if (process.env.NODE_ENV !== 'production') {
          warning(
            typeof typeDef[propName] === 'function',
            '%s: %s type `%s` is invalid; it must be a function, usually from ' +
              'React.PropTypes.',
            Constructor.displayName || 'ReactClass',
            ReactPropTypeLocationNames[location],
            propName
          );
        }
      }
    }
  }

  function validateMethodOverride(isAlreadyDefined, name) {
    var specPolicy = ReactClassInterface.hasOwnProperty(name)
      ? ReactClassInterface[name]
      : null;

    // Disallow overriding of base class methods unless explicitly allowed.
    if (ReactClassMixin.hasOwnProperty(name)) {
      _invariant(
        specPolicy === 'OVERRIDE_BASE',
        'ReactClassInterface: You are attempting to override ' +
          '`%s` from your class specification. Ensure that your method names ' +
          'do not overlap with React methods.',
        name
      );
    }

    // Disallow defining methods more than once unless explicitly allowed.
    if (isAlreadyDefined) {
      _invariant(
        specPolicy === 'DEFINE_MANY' || specPolicy === 'DEFINE_MANY_MERGED',
        'ReactClassInterface: You are attempting to define ' +
          '`%s` on your component more than once. This conflict may be due ' +
          'to a mixin.',
        name
      );
    }
  }

  /**
   * Mixin helper which handles policy validation and reserved
   * specification keys when building React classes.
   */
  function mixSpecIntoComponent(Constructor, spec) {
    if (!spec) {
      if (process.env.NODE_ENV !== 'production') {
        var typeofSpec = typeof spec;
        var isMixinValid = typeofSpec === 'object' && spec !== null;

        if (process.env.NODE_ENV !== 'production') {
          warning(
            isMixinValid,
            "%s: You're attempting to include a mixin that is either null " +
              'or not an object. Check the mixins included by the component, ' +
              'as well as any mixins they include themselves. ' +
              'Expected object but got %s.',
            Constructor.displayName || 'ReactClass',
            spec === null ? null : typeofSpec
          );
        }
      }

      return;
    }

    _invariant(
      typeof spec !== 'function',
      "ReactClass: You're attempting to " +
        'use a component class or function as a mixin. Instead, just use a ' +
        'regular object.'
    );
    _invariant(
      !isValidElement(spec),
      "ReactClass: You're attempting to " +
        'use a component as a mixin. Instead, just use a regular object.'
    );

    var proto = Constructor.prototype;
    var autoBindPairs = proto.__reactAutoBindPairs;

    // By handling mixins before any other properties, we ensure the same
    // chaining order is applied to methods with DEFINE_MANY policy, whether
    // mixins are listed before or after these methods in the spec.
    if (spec.hasOwnProperty(MIXINS_KEY)) {
      RESERVED_SPEC_KEYS.mixins(Constructor, spec.mixins);
    }

    for (var name in spec) {
      if (!spec.hasOwnProperty(name)) {
        continue;
      }

      if (name === MIXINS_KEY) {
        // We have already handled mixins in a special case above.
        continue;
      }

      var property = spec[name];
      var isAlreadyDefined = proto.hasOwnProperty(name);
      validateMethodOverride(isAlreadyDefined, name);

      if (RESERVED_SPEC_KEYS.hasOwnProperty(name)) {
        RESERVED_SPEC_KEYS[name](Constructor, property);
      } else {
        // Setup methods on prototype:
        // The following member methods should not be automatically bound:
        // 1. Expected ReactClass methods (in the "interface").
        // 2. Overridden methods (that were mixed in).
        var isReactClassMethod = ReactClassInterface.hasOwnProperty(name);
        var isFunction = typeof property === 'function';
        var shouldAutoBind =
          isFunction &&
          !isReactClassMethod &&
          !isAlreadyDefined &&
          spec.autobind !== false;

        if (shouldAutoBind) {
          autoBindPairs.push(name, property);
          proto[name] = property;
        } else {
          if (isAlreadyDefined) {
            var specPolicy = ReactClassInterface[name];

            // These cases should already be caught by validateMethodOverride.
            _invariant(
              isReactClassMethod &&
                (specPolicy === 'DEFINE_MANY_MERGED' ||
                  specPolicy === 'DEFINE_MANY'),
              'ReactClass: Unexpected spec policy %s for key %s ' +
                'when mixing in component specs.',
              specPolicy,
              name
            );

            // For methods which are defined more than once, call the existing
            // methods before calling the new property, merging if appropriate.
            if (specPolicy === 'DEFINE_MANY_MERGED') {
              proto[name] = createMergedResultFunction(proto[name], property);
            } else if (specPolicy === 'DEFINE_MANY') {
              proto[name] = createChainedFunction(proto[name], property);
            }
          } else {
            proto[name] = property;
            if (process.env.NODE_ENV !== 'production') {
              // Add verbose displayName to the function, which helps when looking
              // at profiling tools.
              if (typeof property === 'function' && spec.displayName) {
                proto[name].displayName = spec.displayName + '_' + name;
              }
            }
          }
        }
      }
    }
  }

  function mixStaticSpecIntoComponent(Constructor, statics) {
    if (!statics) {
      return;
    }
    for (var name in statics) {
      var property = statics[name];
      if (!statics.hasOwnProperty(name)) {
        continue;
      }

      var isReserved = name in RESERVED_SPEC_KEYS;
      _invariant(
        !isReserved,
        'ReactClass: You are attempting to define a reserved ' +
          'property, `%s`, that shouldn\'t be on the "statics" key. Define it ' +
          'as an instance property instead; it will still be accessible on the ' +
          'constructor.',
        name
      );

      var isInherited = name in Constructor;
      _invariant(
        !isInherited,
        'ReactClass: You are attempting to define ' +
          '`%s` on your component more than once. This conflict may be ' +
          'due to a mixin.',
        name
      );
      Constructor[name] = property;
    }
  }

  /**
   * Merge two objects, but throw if both contain the same key.
   *
   * @param {object} one The first object, which is mutated.
   * @param {object} two The second object
   * @return {object} one after it has been mutated to contain everything in two.
   */
  function mergeIntoWithNoDuplicateKeys(one, two) {
    _invariant(
      one && two && typeof one === 'object' && typeof two === 'object',
      'mergeIntoWithNoDuplicateKeys(): Cannot merge non-objects.'
    );

    for (var key in two) {
      if (two.hasOwnProperty(key)) {
        _invariant(
          one[key] === undefined,
          'mergeIntoWithNoDuplicateKeys(): ' +
            'Tried to merge two objects with the same key: `%s`. This conflict ' +
            'may be due to a mixin; in particular, this may be caused by two ' +
            'getInitialState() or getDefaultProps() methods returning objects ' +
            'with clashing keys.',
          key
        );
        one[key] = two[key];
      }
    }
    return one;
  }

  /**
   * Creates a function that invokes two functions and merges their return values.
   *
   * @param {function} one Function to invoke first.
   * @param {function} two Function to invoke second.
   * @return {function} Function that invokes the two argument functions.
   * @private
   */
  function createMergedResultFunction(one, two) {
    return function mergedResult() {
      var a = one.apply(this, arguments);
      var b = two.apply(this, arguments);
      if (a == null) {
        return b;
      } else if (b == null) {
        return a;
      }
      var c = {};
      mergeIntoWithNoDuplicateKeys(c, a);
      mergeIntoWithNoDuplicateKeys(c, b);
      return c;
    };
  }

  /**
   * Creates a function that invokes two functions and ignores their return vales.
   *
   * @param {function} one Function to invoke first.
   * @param {function} two Function to invoke second.
   * @return {function} Function that invokes the two argument functions.
   * @private
   */
  function createChainedFunction(one, two) {
    return function chainedFunction() {
      one.apply(this, arguments);
      two.apply(this, arguments);
    };
  }

  /**
   * Binds a method to the component.
   *
   * @param {object} component Component whose method is going to be bound.
   * @param {function} method Method to be bound.
   * @return {function} The bound method.
   */
  function bindAutoBindMethod(component, method) {
    var boundMethod = method.bind(component);
    if (process.env.NODE_ENV !== 'production') {
      boundMethod.__reactBoundContext = component;
      boundMethod.__reactBoundMethod = method;
      boundMethod.__reactBoundArguments = null;
      var componentName = component.constructor.displayName;
      var _bind = boundMethod.bind;
      boundMethod.bind = function(newThis) {
        for (
          var _len = arguments.length,
            args = Array(_len > 1 ? _len - 1 : 0),
            _key = 1;
          _key < _len;
          _key++
        ) {
          args[_key - 1] = arguments[_key];
        }

        // User is trying to bind() an autobound method; we effectively will
        // ignore the value of "this" that the user is trying to use, so
        // let's warn.
        if (newThis !== component && newThis !== null) {
          if (process.env.NODE_ENV !== 'production') {
            warning(
              false,
              'bind(): React component methods may only be bound to the ' +
                'component instance. See %s',
              componentName
            );
          }
        } else if (!args.length) {
          if (process.env.NODE_ENV !== 'production') {
            warning(
              false,
              'bind(): You are binding a component method to the component. ' +
                'React does this for you automatically in a high-performance ' +
                'way, so you can safely remove this call. See %s',
              componentName
            );
          }
          return boundMethod;
        }
        var reboundMethod = _bind.apply(boundMethod, arguments);
        reboundMethod.__reactBoundContext = component;
        reboundMethod.__reactBoundMethod = method;
        reboundMethod.__reactBoundArguments = args;
        return reboundMethod;
      };
    }
    return boundMethod;
  }

  /**
   * Binds all auto-bound methods in a component.
   *
   * @param {object} component Component whose method is going to be bound.
   */
  function bindAutoBindMethods(component) {
    var pairs = component.__reactAutoBindPairs;
    for (var i = 0; i < pairs.length; i += 2) {
      var autoBindKey = pairs[i];
      var method = pairs[i + 1];
      component[autoBindKey] = bindAutoBindMethod(component, method);
    }
  }

  var IsMountedPreMixin = {
    componentDidMount: function() {
      this.__isMounted = true;
    }
  };

  var IsMountedPostMixin = {
    componentWillUnmount: function() {
      this.__isMounted = false;
    }
  };

  /**
   * Add more to the ReactClass base class. These are all legacy features and
   * therefore not already part of the modern ReactComponent.
   */
  var ReactClassMixin = {
    /**
     * TODO: This will be deprecated because state should always keep a consistent
     * type signature and the only use case for this, is to avoid that.
     */
    replaceState: function(newState, callback) {
      this.updater.enqueueReplaceState(this, newState, callback);
    },

    /**
     * Checks whether or not this composite component is mounted.
     * @return {boolean} True if mounted, false otherwise.
     * @protected
     * @final
     */
    isMounted: function() {
      if (process.env.NODE_ENV !== 'production') {
        warning(
          this.__didWarnIsMounted,
          '%s: isMounted is deprecated. Instead, make sure to clean up ' +
            'subscriptions and pending requests in componentWillUnmount to ' +
            'prevent memory leaks.',
          (this.constructor && this.constructor.displayName) ||
            this.name ||
            'Component'
        );
        this.__didWarnIsMounted = true;
      }
      return !!this.__isMounted;
    }
  };

  var ReactClassComponent = function() {};
  _assign(
    ReactClassComponent.prototype,
    ReactComponent.prototype,
    ReactClassMixin
  );

  /**
   * Creates a composite component class given a class specification.
   * See https://facebook.github.io/react/docs/top-level-api.html#react.createclass
   *
   * @param {object} spec Class specification (which must define `render`).
   * @return {function} Component constructor function.
   * @public
   */
  function createClass(spec) {
    // To keep our warnings more understandable, we'll use a little hack here to
    // ensure that Constructor.name !== 'Constructor'. This makes sure we don't
    // unnecessarily identify a class without displayName as 'Constructor'.
    var Constructor = identity(function(props, context, updater) {
      // This constructor gets overridden by mocks. The argument is used
      // by mocks to assert on what gets mounted.

      if (process.env.NODE_ENV !== 'production') {
        warning(
          this instanceof Constructor,
          'Something is calling a React component directly. Use a factory or ' +
            'JSX instead. See: https://fb.me/react-legacyfactory'
        );
      }

      // Wire up auto-binding
      if (this.__reactAutoBindPairs.length) {
        bindAutoBindMethods(this);
      }

      this.props = props;
      this.context = context;
      this.refs = emptyObject;
      this.updater = updater || ReactNoopUpdateQueue;

      this.state = null;

      // ReactClasses doesn't have constructors. Instead, they use the
      // getInitialState and componentWillMount methods for initialization.

      var initialState = this.getInitialState ? this.getInitialState() : null;
      if (process.env.NODE_ENV !== 'production') {
        // We allow auto-mocks to proceed as if they're returning null.
        if (
          initialState === undefined &&
          this.getInitialState._isMockFunction
        ) {
          // This is probably bad practice. Consider warning here and
          // deprecating this convenience.
          initialState = null;
        }
      }
      _invariant(
        typeof initialState === 'object' && !Array.isArray(initialState),
        '%s.getInitialState(): must return an object or null',
        Constructor.displayName || 'ReactCompositeComponent'
      );

      this.state = initialState;
    });
    Constructor.prototype = new ReactClassComponent();
    Constructor.prototype.constructor = Constructor;
    Constructor.prototype.__reactAutoBindPairs = [];

    injectedMixins.forEach(mixSpecIntoComponent.bind(null, Constructor));

    mixSpecIntoComponent(Constructor, IsMountedPreMixin);
    mixSpecIntoComponent(Constructor, spec);
    mixSpecIntoComponent(Constructor, IsMountedPostMixin);

    // Initialize the defaultProps property after all mixins have been merged.
    if (Constructor.getDefaultProps) {
      Constructor.defaultProps = Constructor.getDefaultProps();
    }

    if (process.env.NODE_ENV !== 'production') {
      // This is a tag to indicate that the use of these method names is ok,
      // since it's used with createClass. If it's not, then it's likely a
      // mistake so we'll warn you to use the static property, property
      // initializer or constructor respectively.
      if (Constructor.getDefaultProps) {
        Constructor.getDefaultProps.isReactClassApproved = {};
      }
      if (Constructor.prototype.getInitialState) {
        Constructor.prototype.getInitialState.isReactClassApproved = {};
      }
    }

    _invariant(
      Constructor.prototype.render,
      'createClass(...): Class specification must implement a `render` method.'
    );

    if (process.env.NODE_ENV !== 'production') {
      warning(
        !Constructor.prototype.componentShouldUpdate,
        '%s has a method called ' +
          'componentShouldUpdate(). Did you mean shouldComponentUpdate()? ' +
          'The name is phrased as a question because the function is ' +
          'expected to return a value.',
        spec.displayName || 'A component'
      );
      warning(
        !Constructor.prototype.componentWillRecieveProps,
        '%s has a method called ' +
          'componentWillRecieveProps(). Did you mean componentWillReceiveProps()?',
        spec.displayName || 'A component'
      );
    }

    // Reduce time spent doing lookups by setting these on the prototype.
    for (var methodName in ReactClassInterface) {
      if (!Constructor.prototype[methodName]) {
        Constructor.prototype[methodName] = null;
      }
    }

    return Constructor;
  }

  return createClass;
}

module.exports = factory;

}).call(this,require('_process'))
},{"_process":29,"fbjs/lib/emptyObject":6,"fbjs/lib/invariant":7,"fbjs/lib/warning":8,"object-assign":28}],2:[function(require,module,exports){
var pSlice = Array.prototype.slice;
var objectKeys = require('./lib/keys.js');
var isArguments = require('./lib/is_arguments.js');

var deepEqual = module.exports = function (actual, expected, opts) {
  if (!opts) opts = {};
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();

  // 7.3. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!actual || !expected || typeof actual != 'object' && typeof expected != 'object') {
    return opts.strict ? actual === expected : actual == expected;

  // 7.4. For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected, opts);
  }
}

function isUndefinedOrNull(value) {
  return value === null || value === undefined;
}

function isBuffer (x) {
  if (!x || typeof x !== 'object' || typeof x.length !== 'number') return false;
  if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
    return false;
  }
  if (x.length > 0 && typeof x[0] !== 'number') return false;
  return true;
}

function objEquiv(a, b, opts) {
  var i, key;
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return deepEqual(a, b, opts);
  }
  if (isBuffer(a)) {
    if (!isBuffer(b)) {
      return false;
    }
    if (a.length !== b.length) return false;
    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b);
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!deepEqual(a[key], b[key], opts)) return false;
  }
  return typeof a === typeof b;
}

},{"./lib/is_arguments.js":3,"./lib/keys.js":4}],3:[function(require,module,exports){
var supportsArgumentsClass = (function(){
  return Object.prototype.toString.call(arguments)
})() == '[object Arguments]';

exports = module.exports = supportsArgumentsClass ? supported : unsupported;

exports.supported = supported;
function supported(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
};

exports.unsupported = unsupported;
function unsupported(object){
  return object &&
    typeof object == 'object' &&
    typeof object.length == 'number' &&
    Object.prototype.hasOwnProperty.call(object, 'callee') &&
    !Object.prototype.propertyIsEnumerable.call(object, 'callee') ||
    false;
};

},{}],4:[function(require,module,exports){
exports = module.exports = typeof Object.keys === 'function'
  ? Object.keys : shim;

exports.shim = shim;
function shim (obj) {
  var keys = [];
  for (var key in obj) keys.push(key);
  return keys;
}

},{}],5:[function(require,module,exports){
"use strict";

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

function makeEmptyFunction(arg) {
  return function () {
    return arg;
  };
}

/**
 * This function accepts and discards inputs; it has no side effects. This is
 * primarily useful idiomatically for overridable function endpoints which
 * always need to be callable, since JS lacks a null-call idiom ala Cocoa.
 */
var emptyFunction = function emptyFunction() {};

emptyFunction.thatReturns = makeEmptyFunction;
emptyFunction.thatReturnsFalse = makeEmptyFunction(false);
emptyFunction.thatReturnsTrue = makeEmptyFunction(true);
emptyFunction.thatReturnsNull = makeEmptyFunction(null);
emptyFunction.thatReturnsThis = function () {
  return this;
};
emptyFunction.thatReturnsArgument = function (arg) {
  return arg;
};

module.exports = emptyFunction;
},{}],6:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var emptyObject = {};

if (process.env.NODE_ENV !== 'production') {
  Object.freeze(emptyObject);
}

module.exports = emptyObject;
}).call(this,require('_process'))
},{"_process":29}],7:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var validateFormat = function validateFormat(format) {};

if (process.env.NODE_ENV !== 'production') {
  validateFormat = function validateFormat(format) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  };
}

function invariant(condition, format, a, b, c, d, e, f) {
  validateFormat(format);

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error('Minified exception occurred; use the non-minified dev environment ' + 'for the full error message and additional helpful warnings.');
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(format.replace(/%s/g, function () {
        return args[argIndex++];
      }));
      error.name = 'Invariant Violation';
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
}

module.exports = invariant;
}).call(this,require('_process'))
},{"_process":29}],8:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var emptyFunction = require('./emptyFunction');

/**
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

var warning = emptyFunction;

if (process.env.NODE_ENV !== 'production') {
  var printWarning = function printWarning(format) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    var argIndex = 0;
    var message = 'Warning: ' + format.replace(/%s/g, function () {
      return args[argIndex++];
    });
    if (typeof console !== 'undefined') {
      console.error(message);
    }
    try {
      // --- Welcome to debugging React ---
      // This error was thrown as a convenience so that you can use this stack
      // to find the callsite that caused this warning to fire.
      throw new Error(message);
    } catch (x) {}
  };

  warning = function warning(condition, format) {
    if (format === undefined) {
      throw new Error('`warning(condition, format, ...args)` requires a warning ' + 'message argument');
    }

    if (format.indexOf('Failed Composite propType: ') === 0) {
      return; // Ignore CompositeComponent proptype check.
    }

    if (!condition) {
      for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
        args[_key2 - 2] = arguments[_key2];
      }

      printWarning.apply(undefined, [format].concat(args));
    }
  };
}

module.exports = warning;
}).call(this,require('_process'))
},{"./emptyFunction":5,"_process":29}],9:[function(require,module,exports){
/**
 * Indicates that navigation was caused by a call to history.push.
 */
'use strict';

exports.__esModule = true;
var PUSH = 'PUSH';

exports.PUSH = PUSH;
/**
 * Indicates that navigation was caused by a call to history.replace.
 */
var REPLACE = 'REPLACE';

exports.REPLACE = REPLACE;
/**
 * Indicates that navigation was caused by some other action such
 * as using a browser's back/forward buttons and/or manually manipulating
 * the URL in a browser's location bar. This is the default.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onpopstate
 * for more information.
 */
var POP = 'POP';

exports.POP = POP;
exports['default'] = {
  PUSH: PUSH,
  REPLACE: REPLACE,
  POP: POP
};
},{}],10:[function(require,module,exports){
"use strict";

exports.__esModule = true;
var _slice = Array.prototype.slice;
exports.loopAsync = loopAsync;

function loopAsync(turns, work, callback) {
  var currentTurn = 0,
      isDone = false;
  var sync = false,
      hasNext = false,
      doneArgs = undefined;

  function done() {
    isDone = true;
    if (sync) {
      // Iterate instead of recursing if possible.
      doneArgs = [].concat(_slice.call(arguments));
      return;
    }

    callback.apply(this, arguments);
  }

  function next() {
    if (isDone) {
      return;
    }

    hasNext = true;
    if (sync) {
      // Iterate instead of recursing if possible.
      return;
    }

    sync = true;

    while (!isDone && currentTurn < turns && hasNext) {
      hasNext = false;
      work.call(this, currentTurn++, next, done);
    }

    sync = false;

    if (isDone) {
      // This means the loop finished synchronously.
      callback.apply(this, doneArgs);
      return;
    }

    if (currentTurn >= turns && hasNext) {
      isDone = true;
      callback();
    }
  }

  next();
}
},{}],11:[function(require,module,exports){
(function (process){
/*eslint-disable no-empty */
'use strict';

exports.__esModule = true;
exports.saveState = saveState;
exports.readState = readState;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _warning = require('warning');

var _warning2 = _interopRequireDefault(_warning);

var KeyPrefix = '@@History/';
var QuotaExceededErrors = ['QuotaExceededError', 'QUOTA_EXCEEDED_ERR'];

var SecurityError = 'SecurityError';

function createKey(key) {
  return KeyPrefix + key;
}

function saveState(key, state) {
  try {
    if (state == null) {
      window.sessionStorage.removeItem(createKey(key));
    } else {
      window.sessionStorage.setItem(createKey(key), JSON.stringify(state));
    }
  } catch (error) {
    if (error.name === SecurityError) {
      // Blocking cookies in Chrome/Firefox/Safari throws SecurityError on any
      // attempt to access window.sessionStorage.
      process.env.NODE_ENV !== 'production' ? _warning2['default'](false, '[history] Unable to save state; sessionStorage is not available due to security settings') : undefined;

      return;
    }

    if (QuotaExceededErrors.indexOf(error.name) >= 0 && window.sessionStorage.length === 0) {
      // Safari "private mode" throws QuotaExceededError.
      process.env.NODE_ENV !== 'production' ? _warning2['default'](false, '[history] Unable to save state; sessionStorage is not available in Safari private mode') : undefined;

      return;
    }

    throw error;
  }
}

function readState(key) {
  var json = undefined;
  try {
    json = window.sessionStorage.getItem(createKey(key));
  } catch (error) {
    if (error.name === SecurityError) {
      // Blocking cookies in Chrome/Firefox/Safari throws SecurityError on any
      // attempt to access window.sessionStorage.
      process.env.NODE_ENV !== 'production' ? _warning2['default'](false, '[history] Unable to read state; sessionStorage is not available due to security settings') : undefined;

      return null;
    }
  }

  if (json) {
    try {
      return JSON.parse(json);
    } catch (error) {
      // Ignore invalid JSON.
    }
  }

  return null;
}
}).call(this,require('_process'))
},{"_process":29,"warning":25}],12:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.addEventListener = addEventListener;
exports.removeEventListener = removeEventListener;
exports.getHashPath = getHashPath;
exports.replaceHashPath = replaceHashPath;
exports.getWindowPath = getWindowPath;
exports.go = go;
exports.getUserConfirmation = getUserConfirmation;
exports.supportsHistory = supportsHistory;
exports.supportsGoWithoutReloadUsingHash = supportsGoWithoutReloadUsingHash;

function addEventListener(node, event, listener) {
  if (node.addEventListener) {
    node.addEventListener(event, listener, false);
  } else {
    node.attachEvent('on' + event, listener);
  }
}

function removeEventListener(node, event, listener) {
  if (node.removeEventListener) {
    node.removeEventListener(event, listener, false);
  } else {
    node.detachEvent('on' + event, listener);
  }
}

function getHashPath() {
  // We can't use window.location.hash here because it's not
  // consistent across browsers - Firefox will pre-decode it!
  return window.location.href.split('#')[1] || '';
}

function replaceHashPath(path) {
  window.location.replace(window.location.pathname + window.location.search + '#' + path);
}

function getWindowPath() {
  return window.location.pathname + window.location.search + window.location.hash;
}

function go(n) {
  if (n) window.history.go(n);
}

function getUserConfirmation(message, callback) {
  callback(window.confirm(message));
}

/**
 * Returns true if the HTML5 history API is supported. Taken from Modernizr.
 *
 * https://github.com/Modernizr/Modernizr/blob/master/LICENSE
 * https://github.com/Modernizr/Modernizr/blob/master/feature-detects/history.js
 * changed to avoid false negatives for Windows Phones: https://github.com/rackt/react-router/issues/586
 */

function supportsHistory() {
  var ua = navigator.userAgent;
  if ((ua.indexOf('Android 2.') !== -1 || ua.indexOf('Android 4.0') !== -1) && ua.indexOf('Mobile Safari') !== -1 && ua.indexOf('Chrome') === -1 && ua.indexOf('Windows Phone') === -1) {
    return false;
  }
  return window.history && 'pushState' in window.history;
}

/**
 * Returns false if using go(n) with hash history causes a full page reload.
 */

function supportsGoWithoutReloadUsingHash() {
  var ua = navigator.userAgent;
  return ua.indexOf('Firefox') === -1;
}
},{}],13:[function(require,module,exports){
'use strict';

exports.__esModule = true;
var canUseDOM = !!(typeof window !== 'undefined' && window.document && window.document.createElement);
exports.canUseDOM = canUseDOM;
},{}],14:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;
exports.extractPath = extractPath;
exports.parsePath = parsePath;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _warning = require('warning');

var _warning2 = _interopRequireDefault(_warning);

function extractPath(string) {
  var match = string.match(/^https?:\/\/[^\/]*/);

  if (match == null) return string;

  return string.substring(match[0].length);
}

function parsePath(path) {
  var pathname = extractPath(path);
  var search = '';
  var hash = '';

  process.env.NODE_ENV !== 'production' ? _warning2['default'](path === pathname, 'A path must be pathname + search + hash only, not a fully qualified URL like "%s"', path) : undefined;

  var hashIndex = pathname.indexOf('#');
  if (hashIndex !== -1) {
    hash = pathname.substring(hashIndex);
    pathname = pathname.substring(0, hashIndex);
  }

  var searchIndex = pathname.indexOf('?');
  if (searchIndex !== -1) {
    search = pathname.substring(searchIndex);
    pathname = pathname.substring(0, searchIndex);
  }

  if (pathname === '') pathname = '/';

  return {
    pathname: pathname,
    search: search,
    hash: hash
  };
}
}).call(this,require('_process'))
},{"_process":29,"warning":25}],15:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _Actions = require('./Actions');

var _PathUtils = require('./PathUtils');

var _ExecutionEnvironment = require('./ExecutionEnvironment');

var _DOMUtils = require('./DOMUtils');

var _DOMStateStorage = require('./DOMStateStorage');

var _createDOMHistory = require('./createDOMHistory');

var _createDOMHistory2 = _interopRequireDefault(_createDOMHistory);

/**
 * Creates and returns a history object that uses HTML5's history API
 * (pushState, replaceState, and the popstate event) to manage history.
 * This is the recommended method of managing history in browsers because
 * it provides the cleanest URLs.
 *
 * Note: In browsers that do not support the HTML5 history API full
 * page reloads will be used to preserve URLs.
 */
function createBrowserHistory() {
  var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  !_ExecutionEnvironment.canUseDOM ? process.env.NODE_ENV !== 'production' ? _invariant2['default'](false, 'Browser history needs a DOM') : _invariant2['default'](false) : undefined;

  var forceRefresh = options.forceRefresh;

  var isSupported = _DOMUtils.supportsHistory();
  var useRefresh = !isSupported || forceRefresh;

  function getCurrentLocation(historyState) {
    try {
      historyState = historyState || window.history.state || {};
    } catch (e) {
      historyState = {};
    }

    var path = _DOMUtils.getWindowPath();
    var _historyState = historyState;
    var key = _historyState.key;

    var state = undefined;
    if (key) {
      state = _DOMStateStorage.readState(key);
    } else {
      state = null;
      key = history.createKey();

      if (isSupported) window.history.replaceState(_extends({}, historyState, { key: key }), null);
    }

    var location = _PathUtils.parsePath(path);

    return history.createLocation(_extends({}, location, { state: state }), undefined, key);
  }

  function startPopStateListener(_ref) {
    var transitionTo = _ref.transitionTo;

    function popStateListener(event) {
      if (event.state === undefined) return; // Ignore extraneous popstate events in WebKit.

      transitionTo(getCurrentLocation(event.state));
    }

    _DOMUtils.addEventListener(window, 'popstate', popStateListener);

    return function () {
      _DOMUtils.removeEventListener(window, 'popstate', popStateListener);
    };
  }

  function finishTransition(location) {
    var basename = location.basename;
    var pathname = location.pathname;
    var search = location.search;
    var hash = location.hash;
    var state = location.state;
    var action = location.action;
    var key = location.key;

    if (action === _Actions.POP) return; // Nothing to do.

    _DOMStateStorage.saveState(key, state);

    var path = (basename || '') + pathname + search + hash;
    var historyState = {
      key: key
    };

    if (action === _Actions.PUSH) {
      if (useRefresh) {
        window.location.href = path;
        return false; // Prevent location update.
      } else {
          window.history.pushState(historyState, null, path);
        }
    } else {
      // REPLACE
      if (useRefresh) {
        window.location.replace(path);
        return false; // Prevent location update.
      } else {
          window.history.replaceState(historyState, null, path);
        }
    }
  }

  var history = _createDOMHistory2['default'](_extends({}, options, {
    getCurrentLocation: getCurrentLocation,
    finishTransition: finishTransition,
    saveState: _DOMStateStorage.saveState
  }));

  var listenerCount = 0,
      stopPopStateListener = undefined;

  function listenBefore(listener) {
    if (++listenerCount === 1) stopPopStateListener = startPopStateListener(history);

    var unlisten = history.listenBefore(listener);

    return function () {
      unlisten();

      if (--listenerCount === 0) stopPopStateListener();
    };
  }

  function listen(listener) {
    if (++listenerCount === 1) stopPopStateListener = startPopStateListener(history);

    var unlisten = history.listen(listener);

    return function () {
      unlisten();

      if (--listenerCount === 0) stopPopStateListener();
    };
  }

  // deprecated
  function registerTransitionHook(hook) {
    if (++listenerCount === 1) stopPopStateListener = startPopStateListener(history);

    history.registerTransitionHook(hook);
  }

  // deprecated
  function unregisterTransitionHook(hook) {
    history.unregisterTransitionHook(hook);

    if (--listenerCount === 0) stopPopStateListener();
  }

  return _extends({}, history, {
    listenBefore: listenBefore,
    listen: listen,
    registerTransitionHook: registerTransitionHook,
    unregisterTransitionHook: unregisterTransitionHook
  });
}

exports['default'] = createBrowserHistory;
module.exports = exports['default'];
}).call(this,require('_process'))
},{"./Actions":9,"./DOMStateStorage":11,"./DOMUtils":12,"./ExecutionEnvironment":13,"./PathUtils":14,"./createDOMHistory":16,"_process":29,"invariant":27}],16:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _ExecutionEnvironment = require('./ExecutionEnvironment');

var _DOMUtils = require('./DOMUtils');

var _createHistory = require('./createHistory');

var _createHistory2 = _interopRequireDefault(_createHistory);

function createDOMHistory(options) {
  var history = _createHistory2['default'](_extends({
    getUserConfirmation: _DOMUtils.getUserConfirmation
  }, options, {
    go: _DOMUtils.go
  }));

  function listen(listener) {
    !_ExecutionEnvironment.canUseDOM ? process.env.NODE_ENV !== 'production' ? _invariant2['default'](false, 'DOM history needs a DOM') : _invariant2['default'](false) : undefined;

    return history.listen(listener);
  }

  return _extends({}, history, {
    listen: listen
  });
}

exports['default'] = createDOMHistory;
module.exports = exports['default'];
}).call(this,require('_process'))
},{"./DOMUtils":12,"./ExecutionEnvironment":13,"./createHistory":18,"_process":29,"invariant":27}],17:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _warning = require('warning');

var _warning2 = _interopRequireDefault(_warning);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _Actions = require('./Actions');

var _PathUtils = require('./PathUtils');

var _ExecutionEnvironment = require('./ExecutionEnvironment');

var _DOMUtils = require('./DOMUtils');

var _DOMStateStorage = require('./DOMStateStorage');

var _createDOMHistory = require('./createDOMHistory');

var _createDOMHistory2 = _interopRequireDefault(_createDOMHistory);

function isAbsolutePath(path) {
  return typeof path === 'string' && path.charAt(0) === '/';
}

function ensureSlash() {
  var path = _DOMUtils.getHashPath();

  if (isAbsolutePath(path)) return true;

  _DOMUtils.replaceHashPath('/' + path);

  return false;
}

function addQueryStringValueToPath(path, key, value) {
  return path + (path.indexOf('?') === -1 ? '?' : '&') + (key + '=' + value);
}

function stripQueryStringValueFromPath(path, key) {
  return path.replace(new RegExp('[?&]?' + key + '=[a-zA-Z0-9]+'), '');
}

function getQueryStringValueFromPath(path, key) {
  var match = path.match(new RegExp('\\?.*?\\b' + key + '=(.+?)\\b'));
  return match && match[1];
}

var DefaultQueryKey = '_k';

function createHashHistory() {
  var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  !_ExecutionEnvironment.canUseDOM ? process.env.NODE_ENV !== 'production' ? _invariant2['default'](false, 'Hash history needs a DOM') : _invariant2['default'](false) : undefined;

  var queryKey = options.queryKey;

  if (queryKey === undefined || !!queryKey) queryKey = typeof queryKey === 'string' ? queryKey : DefaultQueryKey;

  function getCurrentLocation() {
    var path = _DOMUtils.getHashPath();

    var key = undefined,
        state = undefined;
    if (queryKey) {
      key = getQueryStringValueFromPath(path, queryKey);
      path = stripQueryStringValueFromPath(path, queryKey);

      if (key) {
        state = _DOMStateStorage.readState(key);
      } else {
        state = null;
        key = history.createKey();
        _DOMUtils.replaceHashPath(addQueryStringValueToPath(path, queryKey, key));
      }
    } else {
      key = state = null;
    }

    var location = _PathUtils.parsePath(path);

    return history.createLocation(_extends({}, location, { state: state }), undefined, key);
  }

  function startHashChangeListener(_ref) {
    var transitionTo = _ref.transitionTo;

    function hashChangeListener() {
      if (!ensureSlash()) return; // Always make sure hashes are preceeded with a /.

      transitionTo(getCurrentLocation());
    }

    ensureSlash();
    _DOMUtils.addEventListener(window, 'hashchange', hashChangeListener);

    return function () {
      _DOMUtils.removeEventListener(window, 'hashchange', hashChangeListener);
    };
  }

  function finishTransition(location) {
    var basename = location.basename;
    var pathname = location.pathname;
    var search = location.search;
    var state = location.state;
    var action = location.action;
    var key = location.key;

    if (action === _Actions.POP) return; // Nothing to do.

    var path = (basename || '') + pathname + search;

    if (queryKey) {
      path = addQueryStringValueToPath(path, queryKey, key);
      _DOMStateStorage.saveState(key, state);
    } else {
      // Drop key and state.
      location.key = location.state = null;
    }

    var currentHash = _DOMUtils.getHashPath();

    if (action === _Actions.PUSH) {
      if (currentHash !== path) {
        window.location.hash = path;
      } else {
        process.env.NODE_ENV !== 'production' ? _warning2['default'](false, 'You cannot PUSH the same path using hash history') : undefined;
      }
    } else if (currentHash !== path) {
      // REPLACE
      _DOMUtils.replaceHashPath(path);
    }
  }

  var history = _createDOMHistory2['default'](_extends({}, options, {
    getCurrentLocation: getCurrentLocation,
    finishTransition: finishTransition,
    saveState: _DOMStateStorage.saveState
  }));

  var listenerCount = 0,
      stopHashChangeListener = undefined;

  function listenBefore(listener) {
    if (++listenerCount === 1) stopHashChangeListener = startHashChangeListener(history);

    var unlisten = history.listenBefore(listener);

    return function () {
      unlisten();

      if (--listenerCount === 0) stopHashChangeListener();
    };
  }

  function listen(listener) {
    if (++listenerCount === 1) stopHashChangeListener = startHashChangeListener(history);

    var unlisten = history.listen(listener);

    return function () {
      unlisten();

      if (--listenerCount === 0) stopHashChangeListener();
    };
  }

  function push(location) {
    process.env.NODE_ENV !== 'production' ? _warning2['default'](queryKey || location.state == null, 'You cannot use state without a queryKey it will be dropped') : undefined;

    history.push(location);
  }

  function replace(location) {
    process.env.NODE_ENV !== 'production' ? _warning2['default'](queryKey || location.state == null, 'You cannot use state without a queryKey it will be dropped') : undefined;

    history.replace(location);
  }

  var goIsSupportedWithoutReload = _DOMUtils.supportsGoWithoutReloadUsingHash();

  function go(n) {
    process.env.NODE_ENV !== 'production' ? _warning2['default'](goIsSupportedWithoutReload, 'Hash history go(n) causes a full page reload in this browser') : undefined;

    history.go(n);
  }

  function createHref(path) {
    return '#' + history.createHref(path);
  }

  // deprecated
  function registerTransitionHook(hook) {
    if (++listenerCount === 1) stopHashChangeListener = startHashChangeListener(history);

    history.registerTransitionHook(hook);
  }

  // deprecated
  function unregisterTransitionHook(hook) {
    history.unregisterTransitionHook(hook);

    if (--listenerCount === 0) stopHashChangeListener();
  }

  // deprecated
  function pushState(state, path) {
    process.env.NODE_ENV !== 'production' ? _warning2['default'](queryKey || state == null, 'You cannot use state without a queryKey it will be dropped') : undefined;

    history.pushState(state, path);
  }

  // deprecated
  function replaceState(state, path) {
    process.env.NODE_ENV !== 'production' ? _warning2['default'](queryKey || state == null, 'You cannot use state without a queryKey it will be dropped') : undefined;

    history.replaceState(state, path);
  }

  return _extends({}, history, {
    listenBefore: listenBefore,
    listen: listen,
    push: push,
    replace: replace,
    go: go,
    createHref: createHref,

    registerTransitionHook: registerTransitionHook, // deprecated - warning is in createHistory
    unregisterTransitionHook: unregisterTransitionHook, // deprecated - warning is in createHistory
    pushState: pushState, // deprecated - warning is in createHistory
    replaceState: replaceState // deprecated - warning is in createHistory
  });
}

exports['default'] = createHashHistory;
module.exports = exports['default'];
}).call(this,require('_process'))
},{"./Actions":9,"./DOMStateStorage":11,"./DOMUtils":12,"./ExecutionEnvironment":13,"./PathUtils":14,"./createDOMHistory":16,"_process":29,"invariant":27,"warning":25}],18:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _warning = require('warning');

var _warning2 = _interopRequireDefault(_warning);

var _deepEqual = require('deep-equal');

var _deepEqual2 = _interopRequireDefault(_deepEqual);

var _PathUtils = require('./PathUtils');

var _AsyncUtils = require('./AsyncUtils');

var _Actions = require('./Actions');

var _createLocation2 = require('./createLocation');

var _createLocation3 = _interopRequireDefault(_createLocation2);

var _runTransitionHook = require('./runTransitionHook');

var _runTransitionHook2 = _interopRequireDefault(_runTransitionHook);

var _deprecate = require('./deprecate');

var _deprecate2 = _interopRequireDefault(_deprecate);

function createRandomKey(length) {
  return Math.random().toString(36).substr(2, length);
}

function locationsAreEqual(a, b) {
  return a.pathname === b.pathname && a.search === b.search &&
  //a.action === b.action && // Different action !== location change.
  a.key === b.key && _deepEqual2['default'](a.state, b.state);
}

var DefaultKeyLength = 6;

function createHistory() {
  var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
  var getCurrentLocation = options.getCurrentLocation;
  var finishTransition = options.finishTransition;
  var saveState = options.saveState;
  var go = options.go;
  var getUserConfirmation = options.getUserConfirmation;
  var keyLength = options.keyLength;

  if (typeof keyLength !== 'number') keyLength = DefaultKeyLength;

  var transitionHooks = [];

  function listenBefore(hook) {
    transitionHooks.push(hook);

    return function () {
      transitionHooks = transitionHooks.filter(function (item) {
        return item !== hook;
      });
    };
  }

  var allKeys = [];
  var changeListeners = [];
  var location = undefined;

  function getCurrent() {
    if (pendingLocation && pendingLocation.action === _Actions.POP) {
      return allKeys.indexOf(pendingLocation.key);
    } else if (location) {
      return allKeys.indexOf(location.key);
    } else {
      return -1;
    }
  }

  function updateLocation(newLocation) {
    var current = getCurrent();

    location = newLocation;

    if (location.action === _Actions.PUSH) {
      allKeys = [].concat(allKeys.slice(0, current + 1), [location.key]);
    } else if (location.action === _Actions.REPLACE) {
      allKeys[current] = location.key;
    }

    changeListeners.forEach(function (listener) {
      listener(location);
    });
  }

  function listen(listener) {
    changeListeners.push(listener);

    if (location) {
      listener(location);
    } else {
      var _location = getCurrentLocation();
      allKeys = [_location.key];
      updateLocation(_location);
    }

    return function () {
      changeListeners = changeListeners.filter(function (item) {
        return item !== listener;
      });
    };
  }

  function confirmTransitionTo(location, callback) {
    _AsyncUtils.loopAsync(transitionHooks.length, function (index, next, done) {
      _runTransitionHook2['default'](transitionHooks[index], location, function (result) {
        if (result != null) {
          done(result);
        } else {
          next();
        }
      });
    }, function (message) {
      if (getUserConfirmation && typeof message === 'string') {
        getUserConfirmation(message, function (ok) {
          callback(ok !== false);
        });
      } else {
        callback(message !== false);
      }
    });
  }

  var pendingLocation = undefined;

  function transitionTo(nextLocation) {
    if (location && locationsAreEqual(location, nextLocation)) return; // Nothing to do.

    pendingLocation = nextLocation;

    confirmTransitionTo(nextLocation, function (ok) {
      if (pendingLocation !== nextLocation) return; // Transition was interrupted.

      if (ok) {
        // treat PUSH to current path like REPLACE to be consistent with browsers
        if (nextLocation.action === _Actions.PUSH) {
          var prevPath = createPath(location);
          var nextPath = createPath(nextLocation);

          if (nextPath === prevPath && _deepEqual2['default'](location.state, nextLocation.state)) nextLocation.action = _Actions.REPLACE;
        }

        if (finishTransition(nextLocation) !== false) updateLocation(nextLocation);
      } else if (location && nextLocation.action === _Actions.POP) {
        var prevIndex = allKeys.indexOf(location.key);
        var nextIndex = allKeys.indexOf(nextLocation.key);

        if (prevIndex !== -1 && nextIndex !== -1) go(prevIndex - nextIndex); // Restore the URL.
      }
    });
  }

  function push(location) {
    transitionTo(createLocation(location, _Actions.PUSH, createKey()));
  }

  function replace(location) {
    transitionTo(createLocation(location, _Actions.REPLACE, createKey()));
  }

  function goBack() {
    go(-1);
  }

  function goForward() {
    go(1);
  }

  function createKey() {
    return createRandomKey(keyLength);
  }

  function createPath(location) {
    if (location == null || typeof location === 'string') return location;

    var pathname = location.pathname;
    var search = location.search;
    var hash = location.hash;

    var result = pathname;

    if (search) result += search;

    if (hash) result += hash;

    return result;
  }

  function createHref(location) {
    return createPath(location);
  }

  function createLocation(location, action) {
    var key = arguments.length <= 2 || arguments[2] === undefined ? createKey() : arguments[2];

    if (typeof action === 'object') {
      process.env.NODE_ENV !== 'production' ? _warning2['default'](false, 'The state (2nd) argument to history.createLocation is deprecated; use a ' + 'location descriptor instead') : undefined;

      if (typeof location === 'string') location = _PathUtils.parsePath(location);

      location = _extends({}, location, { state: action });

      action = key;
      key = arguments[3] || createKey();
    }

    return _createLocation3['default'](location, action, key);
  }

  // deprecated
  function setState(state) {
    if (location) {
      updateLocationState(location, state);
      updateLocation(location);
    } else {
      updateLocationState(getCurrentLocation(), state);
    }
  }

  function updateLocationState(location, state) {
    location.state = _extends({}, location.state, state);
    saveState(location.key, location.state);
  }

  // deprecated
  function registerTransitionHook(hook) {
    if (transitionHooks.indexOf(hook) === -1) transitionHooks.push(hook);
  }

  // deprecated
  function unregisterTransitionHook(hook) {
    transitionHooks = transitionHooks.filter(function (item) {
      return item !== hook;
    });
  }

  // deprecated
  function pushState(state, path) {
    if (typeof path === 'string') path = _PathUtils.parsePath(path);

    push(_extends({ state: state }, path));
  }

  // deprecated
  function replaceState(state, path) {
    if (typeof path === 'string') path = _PathUtils.parsePath(path);

    replace(_extends({ state: state }, path));
  }

  return {
    listenBefore: listenBefore,
    listen: listen,
    transitionTo: transitionTo,
    push: push,
    replace: replace,
    go: go,
    goBack: goBack,
    goForward: goForward,
    createKey: createKey,
    createPath: createPath,
    createHref: createHref,
    createLocation: createLocation,

    setState: _deprecate2['default'](setState, 'setState is deprecated; use location.key to save state instead'),
    registerTransitionHook: _deprecate2['default'](registerTransitionHook, 'registerTransitionHook is deprecated; use listenBefore instead'),
    unregisterTransitionHook: _deprecate2['default'](unregisterTransitionHook, 'unregisterTransitionHook is deprecated; use the callback returned from listenBefore instead'),
    pushState: _deprecate2['default'](pushState, 'pushState is deprecated; use push instead'),
    replaceState: _deprecate2['default'](replaceState, 'replaceState is deprecated; use replace instead')
  };
}

exports['default'] = createHistory;
module.exports = exports['default'];
}).call(this,require('_process'))
},{"./Actions":9,"./AsyncUtils":10,"./PathUtils":14,"./createLocation":19,"./deprecate":21,"./runTransitionHook":22,"_process":29,"deep-equal":2,"warning":25}],19:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _warning = require('warning');

var _warning2 = _interopRequireDefault(_warning);

var _Actions = require('./Actions');

var _PathUtils = require('./PathUtils');

function createLocation() {
  var location = arguments.length <= 0 || arguments[0] === undefined ? '/' : arguments[0];
  var action = arguments.length <= 1 || arguments[1] === undefined ? _Actions.POP : arguments[1];
  var key = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

  var _fourthArg = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];

  if (typeof location === 'string') location = _PathUtils.parsePath(location);

  if (typeof action === 'object') {
    process.env.NODE_ENV !== 'production' ? _warning2['default'](false, 'The state (2nd) argument to createLocation is deprecated; use a ' + 'location descriptor instead') : undefined;

    location = _extends({}, location, { state: action });

    action = key || _Actions.POP;
    key = _fourthArg;
  }

  var pathname = location.pathname || '/';
  var search = location.search || '';
  var hash = location.hash || '';
  var state = location.state || null;

  return {
    pathname: pathname,
    search: search,
    hash: hash,
    state: state,
    action: action,
    key: key
  };
}

exports['default'] = createLocation;
module.exports = exports['default'];
}).call(this,require('_process'))
},{"./Actions":9,"./PathUtils":14,"_process":29,"warning":25}],20:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _warning = require('warning');

var _warning2 = _interopRequireDefault(_warning);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _PathUtils = require('./PathUtils');

var _Actions = require('./Actions');

var _createHistory = require('./createHistory');

var _createHistory2 = _interopRequireDefault(_createHistory);

function createStateStorage(entries) {
  return entries.filter(function (entry) {
    return entry.state;
  }).reduce(function (memo, entry) {
    memo[entry.key] = entry.state;
    return memo;
  }, {});
}

function createMemoryHistory() {
  var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  if (Array.isArray(options)) {
    options = { entries: options };
  } else if (typeof options === 'string') {
    options = { entries: [options] };
  }

  var history = _createHistory2['default'](_extends({}, options, {
    getCurrentLocation: getCurrentLocation,
    finishTransition: finishTransition,
    saveState: saveState,
    go: go
  }));

  var _options = options;
  var entries = _options.entries;
  var current = _options.current;

  if (typeof entries === 'string') {
    entries = [entries];
  } else if (!Array.isArray(entries)) {
    entries = ['/'];
  }

  entries = entries.map(function (entry) {
    var key = history.createKey();

    if (typeof entry === 'string') return { pathname: entry, key: key };

    if (typeof entry === 'object' && entry) return _extends({}, entry, { key: key });

    !false ? process.env.NODE_ENV !== 'production' ? _invariant2['default'](false, 'Unable to create history entry from %s', entry) : _invariant2['default'](false) : undefined;
  });

  if (current == null) {
    current = entries.length - 1;
  } else {
    !(current >= 0 && current < entries.length) ? process.env.NODE_ENV !== 'production' ? _invariant2['default'](false, 'Current index must be >= 0 and < %s, was %s', entries.length, current) : _invariant2['default'](false) : undefined;
  }

  var storage = createStateStorage(entries);

  function saveState(key, state) {
    storage[key] = state;
  }

  function readState(key) {
    return storage[key];
  }

  function getCurrentLocation() {
    var entry = entries[current];
    var basename = entry.basename;
    var pathname = entry.pathname;
    var search = entry.search;

    var path = (basename || '') + pathname + (search || '');

    var key = undefined,
        state = undefined;
    if (entry.key) {
      key = entry.key;
      state = readState(key);
    } else {
      key = history.createKey();
      state = null;
      entry.key = key;
    }

    var location = _PathUtils.parsePath(path);

    return history.createLocation(_extends({}, location, { state: state }), undefined, key);
  }

  function canGo(n) {
    var index = current + n;
    return index >= 0 && index < entries.length;
  }

  function go(n) {
    if (n) {
      if (!canGo(n)) {
        process.env.NODE_ENV !== 'production' ? _warning2['default'](false, 'Cannot go(%s) there is not enough history', n) : undefined;
        return;
      }

      current += n;

      var currentLocation = getCurrentLocation();

      // change action to POP
      history.transitionTo(_extends({}, currentLocation, { action: _Actions.POP }));
    }
  }

  function finishTransition(location) {
    switch (location.action) {
      case _Actions.PUSH:
        current += 1;

        // if we are not on the top of stack
        // remove rest and push new
        if (current < entries.length) entries.splice(current);

        entries.push(location);
        saveState(location.key, location.state);
        break;
      case _Actions.REPLACE:
        entries[current] = location;
        saveState(location.key, location.state);
        break;
    }
  }

  return history;
}

exports['default'] = createMemoryHistory;
module.exports = exports['default'];
}).call(this,require('_process'))
},{"./Actions":9,"./PathUtils":14,"./createHistory":18,"_process":29,"invariant":27,"warning":25}],21:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _warning = require('warning');

var _warning2 = _interopRequireDefault(_warning);

function deprecate(fn, message) {
  return function () {
    process.env.NODE_ENV !== 'production' ? _warning2['default'](false, '[history] ' + message) : undefined;
    return fn.apply(this, arguments);
  };
}

exports['default'] = deprecate;
module.exports = exports['default'];
}).call(this,require('_process'))
},{"_process":29,"warning":25}],22:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _warning = require('warning');

var _warning2 = _interopRequireDefault(_warning);

function runTransitionHook(hook, location, callback) {
  var result = hook(location, callback);

  if (hook.length < 2) {
    // Assume the hook runs synchronously and automatically
    // call the callback with the return value.
    callback(result);
  } else {
    process.env.NODE_ENV !== 'production' ? _warning2['default'](result === undefined, 'You should not "return" in a transition hook with a callback argument; call the callback instead') : undefined;
  }
}

exports['default'] = runTransitionHook;
module.exports = exports['default'];
}).call(this,require('_process'))
},{"_process":29,"warning":25}],23:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _warning = require('warning');

var _warning2 = _interopRequireDefault(_warning);

var _ExecutionEnvironment = require('./ExecutionEnvironment');

var _PathUtils = require('./PathUtils');

var _runTransitionHook = require('./runTransitionHook');

var _runTransitionHook2 = _interopRequireDefault(_runTransitionHook);

var _deprecate = require('./deprecate');

var _deprecate2 = _interopRequireDefault(_deprecate);

function useBasename(createHistory) {
  return function () {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var history = createHistory(options);

    var basename = options.basename;

    var checkedBaseHref = false;

    function checkBaseHref() {
      if (checkedBaseHref) {
        return;
      }

      // Automatically use the value of <base href> in HTML
      // documents as basename if it's not explicitly given.
      if (basename == null && _ExecutionEnvironment.canUseDOM) {
        var base = document.getElementsByTagName('base')[0];
        var baseHref = base && base.getAttribute('href');

        if (baseHref != null) {
          basename = baseHref;

          process.env.NODE_ENV !== 'production' ? _warning2['default'](false, 'Automatically setting basename using <base href> is deprecated and will ' + 'be removed in the next major release. The semantics of <base href> are ' + 'subtly different from basename. Please pass the basename explicitly in ' + 'the options to createHistory') : undefined;
        }
      }

      checkedBaseHref = true;
    }

    function addBasename(location) {
      checkBaseHref();

      if (basename && location.basename == null) {
        if (location.pathname.indexOf(basename) === 0) {
          location.pathname = location.pathname.substring(basename.length);
          location.basename = basename;

          if (location.pathname === '') location.pathname = '/';
        } else {
          location.basename = '';
        }
      }

      return location;
    }

    function prependBasename(location) {
      checkBaseHref();

      if (!basename) return location;

      if (typeof location === 'string') location = _PathUtils.parsePath(location);

      var pname = location.pathname;
      var normalizedBasename = basename.slice(-1) === '/' ? basename : basename + '/';
      var normalizedPathname = pname.charAt(0) === '/' ? pname.slice(1) : pname;
      var pathname = normalizedBasename + normalizedPathname;

      return _extends({}, location, {
        pathname: pathname
      });
    }

    // Override all read methods with basename-aware versions.
    function listenBefore(hook) {
      return history.listenBefore(function (location, callback) {
        _runTransitionHook2['default'](hook, addBasename(location), callback);
      });
    }

    function listen(listener) {
      return history.listen(function (location) {
        listener(addBasename(location));
      });
    }

    // Override all write methods with basename-aware versions.
    function push(location) {
      history.push(prependBasename(location));
    }

    function replace(location) {
      history.replace(prependBasename(location));
    }

    function createPath(location) {
      return history.createPath(prependBasename(location));
    }

    function createHref(location) {
      return history.createHref(prependBasename(location));
    }

    function createLocation(location) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      return addBasename(history.createLocation.apply(history, [prependBasename(location)].concat(args)));
    }

    // deprecated
    function pushState(state, path) {
      if (typeof path === 'string') path = _PathUtils.parsePath(path);

      push(_extends({ state: state }, path));
    }

    // deprecated
    function replaceState(state, path) {
      if (typeof path === 'string') path = _PathUtils.parsePath(path);

      replace(_extends({ state: state }, path));
    }

    return _extends({}, history, {
      listenBefore: listenBefore,
      listen: listen,
      push: push,
      replace: replace,
      createPath: createPath,
      createHref: createHref,
      createLocation: createLocation,

      pushState: _deprecate2['default'](pushState, 'pushState is deprecated; use push instead'),
      replaceState: _deprecate2['default'](replaceState, 'replaceState is deprecated; use replace instead')
    });
  };
}

exports['default'] = useBasename;
module.exports = exports['default'];
}).call(this,require('_process'))
},{"./ExecutionEnvironment":13,"./PathUtils":14,"./deprecate":21,"./runTransitionHook":22,"_process":29,"warning":25}],24:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _warning = require('warning');

var _warning2 = _interopRequireDefault(_warning);

var _queryString = require('query-string');

var _runTransitionHook = require('./runTransitionHook');

var _runTransitionHook2 = _interopRequireDefault(_runTransitionHook);

var _PathUtils = require('./PathUtils');

var _deprecate = require('./deprecate');

var _deprecate2 = _interopRequireDefault(_deprecate);

var SEARCH_BASE_KEY = '$searchBase';

function defaultStringifyQuery(query) {
  return _queryString.stringify(query).replace(/%20/g, '+');
}

var defaultParseQueryString = _queryString.parse;

function isNestedObject(object) {
  for (var p in object) {
    if (Object.prototype.hasOwnProperty.call(object, p) && typeof object[p] === 'object' && !Array.isArray(object[p]) && object[p] !== null) return true;
  }return false;
}

/**
 * Returns a new createHistory function that may be used to create
 * history objects that know how to handle URL queries.
 */
function useQueries(createHistory) {
  return function () {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var history = createHistory(options);

    var stringifyQuery = options.stringifyQuery;
    var parseQueryString = options.parseQueryString;

    if (typeof stringifyQuery !== 'function') stringifyQuery = defaultStringifyQuery;

    if (typeof parseQueryString !== 'function') parseQueryString = defaultParseQueryString;

    function addQuery(location) {
      if (location.query == null) {
        var search = location.search;

        location.query = parseQueryString(search.substring(1));
        location[SEARCH_BASE_KEY] = { search: search, searchBase: '' };
      }

      // TODO: Instead of all the book-keeping here, this should just strip the
      // stringified query from the search.

      return location;
    }

    function appendQuery(location, query) {
      var _extends2;

      var searchBaseSpec = location[SEARCH_BASE_KEY];
      var queryString = query ? stringifyQuery(query) : '';
      if (!searchBaseSpec && !queryString) {
        return location;
      }

      process.env.NODE_ENV !== 'production' ? _warning2['default'](stringifyQuery !== defaultStringifyQuery || !isNestedObject(query), 'useQueries does not stringify nested query objects by default; ' + 'use a custom stringifyQuery function') : undefined;

      if (typeof location === 'string') location = _PathUtils.parsePath(location);

      var searchBase = undefined;
      if (searchBaseSpec && location.search === searchBaseSpec.search) {
        searchBase = searchBaseSpec.searchBase;
      } else {
        searchBase = location.search || '';
      }

      var search = searchBase;
      if (queryString) {
        search += (search ? '&' : '?') + queryString;
      }

      return _extends({}, location, (_extends2 = {
        search: search
      }, _extends2[SEARCH_BASE_KEY] = { search: search, searchBase: searchBase }, _extends2));
    }

    // Override all read methods with query-aware versions.
    function listenBefore(hook) {
      return history.listenBefore(function (location, callback) {
        _runTransitionHook2['default'](hook, addQuery(location), callback);
      });
    }

    function listen(listener) {
      return history.listen(function (location) {
        listener(addQuery(location));
      });
    }

    // Override all write methods with query-aware versions.
    function push(location) {
      history.push(appendQuery(location, location.query));
    }

    function replace(location) {
      history.replace(appendQuery(location, location.query));
    }

    function createPath(location, query) {
      process.env.NODE_ENV !== 'production' ? _warning2['default'](!query, 'the query argument to createPath is deprecated; use a location descriptor instead') : undefined;

      return history.createPath(appendQuery(location, query || location.query));
    }

    function createHref(location, query) {
      process.env.NODE_ENV !== 'production' ? _warning2['default'](!query, 'the query argument to createHref is deprecated; use a location descriptor instead') : undefined;

      return history.createHref(appendQuery(location, query || location.query));
    }

    function createLocation(location) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      var fullLocation = history.createLocation.apply(history, [appendQuery(location, location.query)].concat(args));
      if (location.query) {
        fullLocation.query = location.query;
      }
      return addQuery(fullLocation);
    }

    // deprecated
    function pushState(state, path, query) {
      if (typeof path === 'string') path = _PathUtils.parsePath(path);

      push(_extends({ state: state }, path, { query: query }));
    }

    // deprecated
    function replaceState(state, path, query) {
      if (typeof path === 'string') path = _PathUtils.parsePath(path);

      replace(_extends({ state: state }, path, { query: query }));
    }

    return _extends({}, history, {
      listenBefore: listenBefore,
      listen: listen,
      push: push,
      replace: replace,
      createPath: createPath,
      createHref: createHref,
      createLocation: createLocation,

      pushState: _deprecate2['default'](pushState, 'pushState is deprecated; use push instead'),
      replaceState: _deprecate2['default'](replaceState, 'replaceState is deprecated; use replace instead')
    });
  };
}

exports['default'] = useQueries;
module.exports = exports['default'];
}).call(this,require('_process'))
},{"./PathUtils":14,"./deprecate":21,"./runTransitionHook":22,"_process":29,"query-string":34,"warning":25}],25:[function(require,module,exports){
(function (process){
/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

/**
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

var warning = function() {};

if (process.env.NODE_ENV !== 'production') {
  warning = function(condition, format, args) {
    var len = arguments.length;
    args = new Array(len > 2 ? len - 2 : 0);
    for (var key = 2; key < len; key++) {
      args[key - 2] = arguments[key];
    }
    if (format === undefined) {
      throw new Error(
        '`warning(condition, format, ...args)` requires a warning ' +
        'message argument'
      );
    }

    if (format.length < 10 || (/^[s\W]*$/).test(format)) {
      throw new Error(
        'The warning format should be able to uniquely identify this ' +
        'warning. Please, use a more descriptive format than: ' + format
      );
    }

    if (!condition) {
      var argIndex = 0;
      var message = 'Warning: ' +
        format.replace(/%s/g, function() {
          return args[argIndex++];
        });
      if (typeof console !== 'undefined') {
        console.error(message);
      }
      try {
        // This error was thrown as a convenience so that you can use this stack
        // to find the callsite that caused this warning to fire.
        throw new Error(message);
      } catch(x) {}
    }
  };
}

module.exports = warning;

}).call(this,require('_process'))
},{"_process":29}],26:[function(require,module,exports){
/**
 * Copyright 2015, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';

var REACT_STATICS = {
    childContextTypes: true,
    contextTypes: true,
    defaultProps: true,
    displayName: true,
    getDefaultProps: true,
    mixins: true,
    propTypes: true,
    type: true
};

var KNOWN_STATICS = {
    name: true,
    length: true,
    prototype: true,
    caller: true,
    arguments: true,
    arity: true
};

var isGetOwnPropertySymbolsAvailable = typeof Object.getOwnPropertySymbols === 'function';

module.exports = function hoistNonReactStatics(targetComponent, sourceComponent, customStatics) {
    if (typeof sourceComponent !== 'string') { // don't hoist over string (html) components
        var keys = Object.getOwnPropertyNames(sourceComponent);

        /* istanbul ignore else */
        if (isGetOwnPropertySymbolsAvailable) {
            keys = keys.concat(Object.getOwnPropertySymbols(sourceComponent));
        }

        for (var i = 0; i < keys.length; ++i) {
            if (!REACT_STATICS[keys[i]] && !KNOWN_STATICS[keys[i]] && (!customStatics || !customStatics[keys[i]])) {
                try {
                    targetComponent[keys[i]] = sourceComponent[keys[i]];
                } catch (error) {

                }
            }
        }
    }

    return targetComponent;
};

},{}],27:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function(condition, format, a, b, c, d, e, f) {
  if (process.env.NODE_ENV !== 'production') {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
      error.name = 'Invariant Violation';
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

module.exports = invariant;

}).call(this,require('_process'))
},{"_process":29}],28:[function(require,module,exports){
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/

'use strict';
/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],29:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],30:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

if (process.env.NODE_ENV !== 'production') {
  var invariant = require('fbjs/lib/invariant');
  var warning = require('fbjs/lib/warning');
  var ReactPropTypesSecret = require('./lib/ReactPropTypesSecret');
  var loggedTypeFailures = {};
}

/**
 * Assert that the values match with the type specs.
 * Error messages are memorized and will only be shown once.
 *
 * @param {object} typeSpecs Map of name to a ReactPropType
 * @param {object} values Runtime values that need to be type-checked
 * @param {string} location e.g. "prop", "context", "child context"
 * @param {string} componentName Name of the component for error messages.
 * @param {?Function} getStack Returns the component stack.
 * @private
 */
function checkPropTypes(typeSpecs, values, location, componentName, getStack) {
  if (process.env.NODE_ENV !== 'production') {
    for (var typeSpecName in typeSpecs) {
      if (typeSpecs.hasOwnProperty(typeSpecName)) {
        var error;
        // Prop type validation may throw. In case they do, we don't want to
        // fail the render phase where it didn't fail before. So we log it.
        // After these have been cleaned up, we'll let them throw.
        try {
          // This is intentionally an invariant that gets caught. It's the same
          // behavior as without this statement except with a better message.
          invariant(typeof typeSpecs[typeSpecName] === 'function', '%s: %s type `%s` is invalid; it must be a function, usually from ' + 'the `prop-types` package, but received `%s`.', componentName || 'React class', location, typeSpecName, typeof typeSpecs[typeSpecName]);
          error = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, ReactPropTypesSecret);
        } catch (ex) {
          error = ex;
        }
        warning(!error || error instanceof Error, '%s: type specification of %s `%s` is invalid; the type checker ' + 'function must return `null` or an `Error` but returned a %s. ' + 'You may have forgotten to pass an argument to the type checker ' + 'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' + 'shape all require an argument).', componentName || 'React class', location, typeSpecName, typeof error);
        if (error instanceof Error && !(error.message in loggedTypeFailures)) {
          // Only monitor this failure once because there tends to be a lot of the
          // same error.
          loggedTypeFailures[error.message] = true;

          var stack = getStack ? getStack() : '';

          warning(false, 'Failed %s type: %s%s', location, error.message, stack != null ? stack : '');
        }
      }
    }
  }
}

module.exports = checkPropTypes;

}).call(this,require('_process'))
},{"./lib/ReactPropTypesSecret":33,"_process":29,"fbjs/lib/invariant":7,"fbjs/lib/warning":8}],31:[function(require,module,exports){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// React 15.5 references this module, and assumes PropTypes are still callable in production.
// Therefore we re-export development-only version with all the PropTypes checks here.
// However if one is migrating to the `prop-types` npm library, they will go through the
// `index.js` entry point, and it will branch depending on the environment.
var factory = require('./factoryWithTypeCheckers');
module.exports = function(isValidElement) {
  // It is still allowed in 15.5.
  var throwOnDirectAccess = false;
  return factory(isValidElement, throwOnDirectAccess);
};

},{"./factoryWithTypeCheckers":32}],32:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var emptyFunction = require('fbjs/lib/emptyFunction');
var invariant = require('fbjs/lib/invariant');
var warning = require('fbjs/lib/warning');
var assign = require('object-assign');

var ReactPropTypesSecret = require('./lib/ReactPropTypesSecret');
var checkPropTypes = require('./checkPropTypes');

module.exports = function(isValidElement, throwOnDirectAccess) {
  /* global Symbol */
  var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
  var FAUX_ITERATOR_SYMBOL = '@@iterator'; // Before Symbol spec.

  /**
   * Returns the iterator method function contained on the iterable object.
   *
   * Be sure to invoke the function with the iterable as context:
   *
   *     var iteratorFn = getIteratorFn(myIterable);
   *     if (iteratorFn) {
   *       var iterator = iteratorFn.call(myIterable);
   *       ...
   *     }
   *
   * @param {?object} maybeIterable
   * @return {?function}
   */
  function getIteratorFn(maybeIterable) {
    var iteratorFn = maybeIterable && (ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL]);
    if (typeof iteratorFn === 'function') {
      return iteratorFn;
    }
  }

  /**
   * Collection of methods that allow declaration and validation of props that are
   * supplied to React components. Example usage:
   *
   *   var Props = require('ReactPropTypes');
   *   var MyArticle = React.createClass({
   *     propTypes: {
   *       // An optional string prop named "description".
   *       description: Props.string,
   *
   *       // A required enum prop named "category".
   *       category: Props.oneOf(['News','Photos']).isRequired,
   *
   *       // A prop named "dialog" that requires an instance of Dialog.
   *       dialog: Props.instanceOf(Dialog).isRequired
   *     },
   *     render: function() { ... }
   *   });
   *
   * A more formal specification of how these methods are used:
   *
   *   type := array|bool|func|object|number|string|oneOf([...])|instanceOf(...)
   *   decl := ReactPropTypes.{type}(.isRequired)?
   *
   * Each and every declaration produces a function with the same signature. This
   * allows the creation of custom validation functions. For example:
   *
   *  var MyLink = React.createClass({
   *    propTypes: {
   *      // An optional string or URI prop named "href".
   *      href: function(props, propName, componentName) {
   *        var propValue = props[propName];
   *        if (propValue != null && typeof propValue !== 'string' &&
   *            !(propValue instanceof URI)) {
   *          return new Error(
   *            'Expected a string or an URI for ' + propName + ' in ' +
   *            componentName
   *          );
   *        }
   *      }
   *    },
   *    render: function() {...}
   *  });
   *
   * @internal
   */

  var ANONYMOUS = '<<anonymous>>';

  // Important!
  // Keep this list in sync with production version in `./factoryWithThrowingShims.js`.
  var ReactPropTypes = {
    array: createPrimitiveTypeChecker('array'),
    bool: createPrimitiveTypeChecker('boolean'),
    func: createPrimitiveTypeChecker('function'),
    number: createPrimitiveTypeChecker('number'),
    object: createPrimitiveTypeChecker('object'),
    string: createPrimitiveTypeChecker('string'),
    symbol: createPrimitiveTypeChecker('symbol'),

    any: createAnyTypeChecker(),
    arrayOf: createArrayOfTypeChecker,
    element: createElementTypeChecker(),
    instanceOf: createInstanceTypeChecker,
    node: createNodeChecker(),
    objectOf: createObjectOfTypeChecker,
    oneOf: createEnumTypeChecker,
    oneOfType: createUnionTypeChecker,
    shape: createShapeTypeChecker,
    exact: createStrictShapeTypeChecker,
  };

  /**
   * inlined Object.is polyfill to avoid requiring consumers ship their own
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
   */
  /*eslint-disable no-self-compare*/
  function is(x, y) {
    // SameValue algorithm
    if (x === y) {
      // Steps 1-5, 7-10
      // Steps 6.b-6.e: +0 != -0
      return x !== 0 || 1 / x === 1 / y;
    } else {
      // Step 6.a: NaN == NaN
      return x !== x && y !== y;
    }
  }
  /*eslint-enable no-self-compare*/

  /**
   * We use an Error-like object for backward compatibility as people may call
   * PropTypes directly and inspect their output. However, we don't use real
   * Errors anymore. We don't inspect their stack anyway, and creating them
   * is prohibitively expensive if they are created too often, such as what
   * happens in oneOfType() for any type before the one that matched.
   */
  function PropTypeError(message) {
    this.message = message;
    this.stack = '';
  }
  // Make `instanceof Error` still work for returned errors.
  PropTypeError.prototype = Error.prototype;

  function createChainableTypeChecker(validate) {
    if (process.env.NODE_ENV !== 'production') {
      var manualPropTypeCallCache = {};
      var manualPropTypeWarningCount = 0;
    }
    function checkType(isRequired, props, propName, componentName, location, propFullName, secret) {
      componentName = componentName || ANONYMOUS;
      propFullName = propFullName || propName;

      if (secret !== ReactPropTypesSecret) {
        if (throwOnDirectAccess) {
          // New behavior only for users of `prop-types` package
          invariant(
            false,
            'Calling PropTypes validators directly is not supported by the `prop-types` package. ' +
            'Use `PropTypes.checkPropTypes()` to call them. ' +
            'Read more at http://fb.me/use-check-prop-types'
          );
        } else if (process.env.NODE_ENV !== 'production' && typeof console !== 'undefined') {
          // Old behavior for people using React.PropTypes
          var cacheKey = componentName + ':' + propName;
          if (
            !manualPropTypeCallCache[cacheKey] &&
            // Avoid spamming the console because they are often not actionable except for lib authors
            manualPropTypeWarningCount < 3
          ) {
            warning(
              false,
              'You are manually calling a React.PropTypes validation ' +
              'function for the `%s` prop on `%s`. This is deprecated ' +
              'and will throw in the standalone `prop-types` package. ' +
              'You may be seeing this warning due to a third-party PropTypes ' +
              'library. See https://fb.me/react-warning-dont-call-proptypes ' + 'for details.',
              propFullName,
              componentName
            );
            manualPropTypeCallCache[cacheKey] = true;
            manualPropTypeWarningCount++;
          }
        }
      }
      if (props[propName] == null) {
        if (isRequired) {
          if (props[propName] === null) {
            return new PropTypeError('The ' + location + ' `' + propFullName + '` is marked as required ' + ('in `' + componentName + '`, but its value is `null`.'));
          }
          return new PropTypeError('The ' + location + ' `' + propFullName + '` is marked as required in ' + ('`' + componentName + '`, but its value is `undefined`.'));
        }
        return null;
      } else {
        return validate(props, propName, componentName, location, propFullName);
      }
    }

    var chainedCheckType = checkType.bind(null, false);
    chainedCheckType.isRequired = checkType.bind(null, true);

    return chainedCheckType;
  }

  function createPrimitiveTypeChecker(expectedType) {
    function validate(props, propName, componentName, location, propFullName, secret) {
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== expectedType) {
        // `propValue` being instance of, say, date/regexp, pass the 'object'
        // check, but we can offer a more precise error message here rather than
        // 'of type `object`'.
        var preciseType = getPreciseType(propValue);

        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + preciseType + '` supplied to `' + componentName + '`, expected ') + ('`' + expectedType + '`.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createAnyTypeChecker() {
    return createChainableTypeChecker(emptyFunction.thatReturnsNull);
  }

  function createArrayOfTypeChecker(typeChecker) {
    function validate(props, propName, componentName, location, propFullName) {
      if (typeof typeChecker !== 'function') {
        return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside arrayOf.');
      }
      var propValue = props[propName];
      if (!Array.isArray(propValue)) {
        var propType = getPropType(propValue);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an array.'));
      }
      for (var i = 0; i < propValue.length; i++) {
        var error = typeChecker(propValue, i, componentName, location, propFullName + '[' + i + ']', ReactPropTypesSecret);
        if (error instanceof Error) {
          return error;
        }
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createElementTypeChecker() {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      if (!isValidElement(propValue)) {
        var propType = getPropType(propValue);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected a single ReactElement.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createInstanceTypeChecker(expectedClass) {
    function validate(props, propName, componentName, location, propFullName) {
      if (!(props[propName] instanceof expectedClass)) {
        var expectedClassName = expectedClass.name || ANONYMOUS;
        var actualClassName = getClassName(props[propName]);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + actualClassName + '` supplied to `' + componentName + '`, expected ') + ('instance of `' + expectedClassName + '`.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createEnumTypeChecker(expectedValues) {
    if (!Array.isArray(expectedValues)) {
      process.env.NODE_ENV !== 'production' ? warning(false, 'Invalid argument supplied to oneOf, expected an instance of array.') : void 0;
      return emptyFunction.thatReturnsNull;
    }

    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      for (var i = 0; i < expectedValues.length; i++) {
        if (is(propValue, expectedValues[i])) {
          return null;
        }
      }

      var valuesString = JSON.stringify(expectedValues);
      return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of value `' + propValue + '` ' + ('supplied to `' + componentName + '`, expected one of ' + valuesString + '.'));
    }
    return createChainableTypeChecker(validate);
  }

  function createObjectOfTypeChecker(typeChecker) {
    function validate(props, propName, componentName, location, propFullName) {
      if (typeof typeChecker !== 'function') {
        return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside objectOf.');
      }
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== 'object') {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an object.'));
      }
      for (var key in propValue) {
        if (propValue.hasOwnProperty(key)) {
          var error = typeChecker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
          if (error instanceof Error) {
            return error;
          }
        }
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createUnionTypeChecker(arrayOfTypeCheckers) {
    if (!Array.isArray(arrayOfTypeCheckers)) {
      process.env.NODE_ENV !== 'production' ? warning(false, 'Invalid argument supplied to oneOfType, expected an instance of array.') : void 0;
      return emptyFunction.thatReturnsNull;
    }

    for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
      var checker = arrayOfTypeCheckers[i];
      if (typeof checker !== 'function') {
        warning(
          false,
          'Invalid argument supplied to oneOfType. Expected an array of check functions, but ' +
          'received %s at index %s.',
          getPostfixForTypeWarning(checker),
          i
        );
        return emptyFunction.thatReturnsNull;
      }
    }

    function validate(props, propName, componentName, location, propFullName) {
      for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
        var checker = arrayOfTypeCheckers[i];
        if (checker(props, propName, componentName, location, propFullName, ReactPropTypesSecret) == null) {
          return null;
        }
      }

      return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`.'));
    }
    return createChainableTypeChecker(validate);
  }

  function createNodeChecker() {
    function validate(props, propName, componentName, location, propFullName) {
      if (!isNode(props[propName])) {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`, expected a ReactNode.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createShapeTypeChecker(shapeTypes) {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== 'object') {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
      }
      for (var key in shapeTypes) {
        var checker = shapeTypes[key];
        if (!checker) {
          continue;
        }
        var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
        if (error) {
          return error;
        }
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createStrictShapeTypeChecker(shapeTypes) {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== 'object') {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
      }
      // We need to check all keys in case some are required but missing from
      // props.
      var allKeys = assign({}, props[propName], shapeTypes);
      for (var key in allKeys) {
        var checker = shapeTypes[key];
        if (!checker) {
          return new PropTypeError(
            'Invalid ' + location + ' `' + propFullName + '` key `' + key + '` supplied to `' + componentName + '`.' +
            '\nBad object: ' + JSON.stringify(props[propName], null, '  ') +
            '\nValid keys: ' +  JSON.stringify(Object.keys(shapeTypes), null, '  ')
          );
        }
        var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
        if (error) {
          return error;
        }
      }
      return null;
    }

    return createChainableTypeChecker(validate);
  }

  function isNode(propValue) {
    switch (typeof propValue) {
      case 'number':
      case 'string':
      case 'undefined':
        return true;
      case 'boolean':
        return !propValue;
      case 'object':
        if (Array.isArray(propValue)) {
          return propValue.every(isNode);
        }
        if (propValue === null || isValidElement(propValue)) {
          return true;
        }

        var iteratorFn = getIteratorFn(propValue);
        if (iteratorFn) {
          var iterator = iteratorFn.call(propValue);
          var step;
          if (iteratorFn !== propValue.entries) {
            while (!(step = iterator.next()).done) {
              if (!isNode(step.value)) {
                return false;
              }
            }
          } else {
            // Iterator will provide entry [k,v] tuples rather than values.
            while (!(step = iterator.next()).done) {
              var entry = step.value;
              if (entry) {
                if (!isNode(entry[1])) {
                  return false;
                }
              }
            }
          }
        } else {
          return false;
        }

        return true;
      default:
        return false;
    }
  }

  function isSymbol(propType, propValue) {
    // Native Symbol.
    if (propType === 'symbol') {
      return true;
    }

    // 19.4.3.5 Symbol.prototype[@@toStringTag] === 'Symbol'
    if (propValue['@@toStringTag'] === 'Symbol') {
      return true;
    }

    // Fallback for non-spec compliant Symbols which are polyfilled.
    if (typeof Symbol === 'function' && propValue instanceof Symbol) {
      return true;
    }

    return false;
  }

  // Equivalent of `typeof` but with special handling for array and regexp.
  function getPropType(propValue) {
    var propType = typeof propValue;
    if (Array.isArray(propValue)) {
      return 'array';
    }
    if (propValue instanceof RegExp) {
      // Old webkits (at least until Android 4.0) return 'function' rather than
      // 'object' for typeof a RegExp. We'll normalize this here so that /bla/
      // passes PropTypes.object.
      return 'object';
    }
    if (isSymbol(propType, propValue)) {
      return 'symbol';
    }
    return propType;
  }

  // This handles more types than `getPropType`. Only used for error messages.
  // See `createPrimitiveTypeChecker`.
  function getPreciseType(propValue) {
    if (typeof propValue === 'undefined' || propValue === null) {
      return '' + propValue;
    }
    var propType = getPropType(propValue);
    if (propType === 'object') {
      if (propValue instanceof Date) {
        return 'date';
      } else if (propValue instanceof RegExp) {
        return 'regexp';
      }
    }
    return propType;
  }

  // Returns a string that is postfixed to a warning about an invalid type.
  // For example, "undefined" or "of type array"
  function getPostfixForTypeWarning(value) {
    var type = getPreciseType(value);
    switch (type) {
      case 'array':
      case 'object':
        return 'an ' + type;
      case 'boolean':
      case 'date':
      case 'regexp':
        return 'a ' + type;
      default:
        return type;
    }
  }

  // Returns class name of the object, if any.
  function getClassName(propValue) {
    if (!propValue.constructor || !propValue.constructor.name) {
      return ANONYMOUS;
    }
    return propValue.constructor.name;
  }

  ReactPropTypes.checkPropTypes = checkPropTypes;
  ReactPropTypes.PropTypes = ReactPropTypes;

  return ReactPropTypes;
};

}).call(this,require('_process'))
},{"./checkPropTypes":30,"./lib/ReactPropTypesSecret":33,"_process":29,"fbjs/lib/emptyFunction":5,"fbjs/lib/invariant":7,"fbjs/lib/warning":8,"object-assign":28}],33:[function(require,module,exports){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var ReactPropTypesSecret = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';

module.exports = ReactPropTypesSecret;

},{}],34:[function(require,module,exports){
'use strict';
var strictUriEncode = require('strict-uri-encode');

exports.extract = function (str) {
	return str.split('?')[1] || '';
};

exports.parse = function (str) {
	if (typeof str !== 'string') {
		return {};
	}

	str = str.trim().replace(/^(\?|#|&)/, '');

	if (!str) {
		return {};
	}

	return str.split('&').reduce(function (ret, param) {
		var parts = param.replace(/\+/g, ' ').split('=');
		// Firefox (pre 40) decodes `%3D` to `=`
		// https://github.com/sindresorhus/query-string/pull/37
		var key = parts.shift();
		var val = parts.length > 0 ? parts.join('=') : undefined;

		key = decodeURIComponent(key);

		// missing `=` should be `null`:
		// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
		val = val === undefined ? null : decodeURIComponent(val);

		if (!ret.hasOwnProperty(key)) {
			ret[key] = val;
		} else if (Array.isArray(ret[key])) {
			ret[key].push(val);
		} else {
			ret[key] = [ret[key], val];
		}

		return ret;
	}, {});
};

exports.stringify = function (obj) {
	return obj ? Object.keys(obj).sort().map(function (key) {
		var val = obj[key];

		if (val === undefined) {
			return '';
		}

		if (val === null) {
			return key;
		}

		if (Array.isArray(val)) {
			return val.slice().sort().map(function (val2) {
				return strictUriEncode(key) + '=' + strictUriEncode(val2);
			}).join('&');
		}

		return strictUriEncode(key) + '=' + strictUriEncode(val);
	}).filter(function (x) {
		return x.length > 0;
	}).join('&') : '';
};

},{"strict-uri-encode":98}],35:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.loopAsync = loopAsync;
exports.mapAsync = mapAsync;
function loopAsync(turns, work, callback) {
  var currentTurn = 0,
      isDone = false;
  var sync = false,
      hasNext = false,
      doneArgs = void 0;

  function done() {
    isDone = true;
    if (sync) {
      // Iterate instead of recursing if possible.
      doneArgs = [].concat(Array.prototype.slice.call(arguments));
      return;
    }

    callback.apply(this, arguments);
  }

  function next() {
    if (isDone) {
      return;
    }

    hasNext = true;
    if (sync) {
      // Iterate instead of recursing if possible.
      return;
    }

    sync = true;

    while (!isDone && currentTurn < turns && hasNext) {
      hasNext = false;
      work.call(this, currentTurn++, next, done);
    }

    sync = false;

    if (isDone) {
      // This means the loop finished synchronously.
      callback.apply(this, doneArgs);
      return;
    }

    if (currentTurn >= turns && hasNext) {
      isDone = true;
      callback();
    }
  }

  next();
}

function mapAsync(array, work, callback) {
  var length = array.length;
  var values = [];

  if (length === 0) return callback(null, values);

  var isDone = false,
      doneCount = 0;

  function done(index, error, value) {
    if (isDone) return;

    if (error) {
      isDone = true;
      callback(error);
    } else {
      values[index] = value;

      isDone = ++doneCount === length;

      if (isDone) callback(null, values);
    }
  }

  array.forEach(function (item, index) {
    work(item, index, function (error, value) {
      done(index, error, value);
    });
  });
}
},{}],36:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _routerWarning = require('./routerWarning');

var _routerWarning2 = _interopRequireDefault(_routerWarning);

var _InternalPropTypes = require('./InternalPropTypes');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A mixin that adds the "history" instance variable to components.
 */
var History = {

  contextTypes: {
    history: _InternalPropTypes.history
  },

  componentWillMount: function componentWillMount() {
    process.env.NODE_ENV !== 'production' ? (0, _routerWarning2.default)(false, 'the `History` mixin is deprecated, please access `context.router` with your own `contextTypes`. http://tiny.cc/router-historymixin') : void 0;
    this.history = this.context.history;
  }
};

exports.default = History;
module.exports = exports['default'];
}).call(this,require('_process'))
},{"./InternalPropTypes":40,"./routerWarning":69,"_process":29}],37:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _Link = require('./Link');

var _Link2 = _interopRequireDefault(_Link);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * An <IndexLink> is used to link to an <IndexRoute>.
 */
var IndexLink = _react2.default.createClass({
  displayName: 'IndexLink',
  render: function render() {
    return _react2.default.createElement(_Link2.default, _extends({}, this.props, { onlyActiveOnIndex: true }));
  }
});

exports.default = IndexLink;
module.exports = exports['default'];
},{"./Link":42,"react":97}],38:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _routerWarning = require('./routerWarning');

var _routerWarning2 = _interopRequireDefault(_routerWarning);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _Redirect = require('./Redirect');

var _Redirect2 = _interopRequireDefault(_Redirect);

var _InternalPropTypes = require('./InternalPropTypes');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _React$PropTypes = _react2.default.PropTypes;
var string = _React$PropTypes.string;
var object = _React$PropTypes.object;

/**
 * An <IndexRedirect> is used to redirect from an indexRoute.
 */

var IndexRedirect = _react2.default.createClass({
  displayName: 'IndexRedirect',


  statics: {
    createRouteFromReactElement: function createRouteFromReactElement(element, parentRoute) {
      /* istanbul ignore else: sanity check */
      if (parentRoute) {
        parentRoute.indexRoute = _Redirect2.default.createRouteFromReactElement(element);
      } else {
        process.env.NODE_ENV !== 'production' ? (0, _routerWarning2.default)(false, 'An <IndexRedirect> does not make sense at the root of your route config') : void 0;
      }
    }
  },

  propTypes: {
    to: string.isRequired,
    query: object,
    state: object,
    onEnter: _InternalPropTypes.falsy,
    children: _InternalPropTypes.falsy
  },

  /* istanbul ignore next: sanity check */
  render: function render() {
    !false ? process.env.NODE_ENV !== 'production' ? (0, _invariant2.default)(false, '<IndexRedirect> elements are for router configuration only and should not be rendered') : (0, _invariant2.default)(false) : void 0;
  }
});

exports.default = IndexRedirect;
module.exports = exports['default'];
}).call(this,require('_process'))
},{"./InternalPropTypes":40,"./Redirect":45,"./routerWarning":69,"_process":29,"invariant":27,"react":97}],39:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _routerWarning = require('./routerWarning');

var _routerWarning2 = _interopRequireDefault(_routerWarning);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _RouteUtils = require('./RouteUtils');

var _InternalPropTypes = require('./InternalPropTypes');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var func = _react2.default.PropTypes.func;

/**
 * An <IndexRoute> is used to specify its parent's <Route indexRoute> in
 * a JSX route config.
 */

var IndexRoute = _react2.default.createClass({
  displayName: 'IndexRoute',


  statics: {
    createRouteFromReactElement: function createRouteFromReactElement(element, parentRoute) {
      /* istanbul ignore else: sanity check */
      if (parentRoute) {
        parentRoute.indexRoute = (0, _RouteUtils.createRouteFromReactElement)(element);
      } else {
        process.env.NODE_ENV !== 'production' ? (0, _routerWarning2.default)(false, 'An <IndexRoute> does not make sense at the root of your route config') : void 0;
      }
    }
  },

  propTypes: {
    path: _InternalPropTypes.falsy,
    component: _InternalPropTypes.component,
    components: _InternalPropTypes.components,
    getComponent: func,
    getComponents: func
  },

  /* istanbul ignore next: sanity check */
  render: function render() {
    !false ? process.env.NODE_ENV !== 'production' ? (0, _invariant2.default)(false, '<IndexRoute> elements are for router configuration only and should not be rendered') : (0, _invariant2.default)(false) : void 0;
  }
});

exports.default = IndexRoute;
module.exports = exports['default'];
}).call(this,require('_process'))
},{"./InternalPropTypes":40,"./RouteUtils":48,"./routerWarning":69,"_process":29,"invariant":27,"react":97}],40:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.routes = exports.route = exports.components = exports.component = exports.history = undefined;
exports.falsy = falsy;

var _react = require('react');

var func = _react.PropTypes.func;
var object = _react.PropTypes.object;
var arrayOf = _react.PropTypes.arrayOf;
var oneOfType = _react.PropTypes.oneOfType;
var element = _react.PropTypes.element;
var shape = _react.PropTypes.shape;
var string = _react.PropTypes.string;
function falsy(props, propName, componentName) {
  if (props[propName]) return new Error('<' + componentName + '> should not have a "' + propName + '" prop');
}

var history = exports.history = shape({
  listen: func.isRequired,
  push: func.isRequired,
  replace: func.isRequired,
  go: func.isRequired,
  goBack: func.isRequired,
  goForward: func.isRequired
});

var component = exports.component = oneOfType([func, string]);
var components = exports.components = oneOfType([component, object]);
var route = exports.route = oneOfType([object, element]);
var routes = exports.routes = oneOfType([route, arrayOf(route)]);
},{"react":97}],41:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _routerWarning = require('./routerWarning');

var _routerWarning2 = _interopRequireDefault(_routerWarning);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var object = _react2.default.PropTypes.object;

/**
 * The Lifecycle mixin adds the routerWillLeave lifecycle method to a
 * component that may be used to cancel a transition or prompt the user
 * for confirmation.
 *
 * On standard transitions, routerWillLeave receives a single argument: the
 * location we're transitioning to. To cancel the transition, return false.
 * To prompt the user for confirmation, return a prompt message (string).
 *
 * During the beforeunload event (assuming you're using the useBeforeUnload
 * history enhancer), routerWillLeave does not receive a location object
 * because it isn't possible for us to know the location we're transitioning
 * to. In this case routerWillLeave must return a prompt message to prevent
 * the user from closing the window/tab.
 */

var Lifecycle = {

  contextTypes: {
    history: object.isRequired,
    // Nested children receive the route as context, either
    // set by the route component using the RouteContext mixin
    // or by some other ancestor.
    route: object
  },

  propTypes: {
    // Route components receive the route object as a prop.
    route: object
  },

  componentDidMount: function componentDidMount() {
    process.env.NODE_ENV !== 'production' ? (0, _routerWarning2.default)(false, 'the `Lifecycle` mixin is deprecated, please use `context.router.setRouteLeaveHook(route, hook)`. http://tiny.cc/router-lifecyclemixin') : void 0;
    !this.routerWillLeave ? process.env.NODE_ENV !== 'production' ? (0, _invariant2.default)(false, 'The Lifecycle mixin requires you to define a routerWillLeave method') : (0, _invariant2.default)(false) : void 0;

    var route = this.props.route || this.context.route;

    !route ? process.env.NODE_ENV !== 'production' ? (0, _invariant2.default)(false, 'The Lifecycle mixin must be used on either a) a <Route component> or ' + 'b) a descendant of a <Route component> that uses the RouteContext mixin') : (0, _invariant2.default)(false) : void 0;

    this._unlistenBeforeLeavingRoute = this.context.history.listenBeforeLeavingRoute(route, this.routerWillLeave);
  },
  componentWillUnmount: function componentWillUnmount() {
    if (this._unlistenBeforeLeavingRoute) this._unlistenBeforeLeavingRoute();
  }
};

exports.default = Lifecycle;
module.exports = exports['default'];
}).call(this,require('_process'))
},{"./routerWarning":69,"_process":29,"invariant":27,"react":97}],42:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _routerWarning = require('./routerWarning');

var _routerWarning2 = _interopRequireDefault(_routerWarning);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _PropTypes = require('./PropTypes');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var _React$PropTypes = _react2.default.PropTypes;
var bool = _React$PropTypes.bool;
var object = _React$PropTypes.object;
var string = _React$PropTypes.string;
var func = _React$PropTypes.func;
var oneOfType = _React$PropTypes.oneOfType;


function isLeftClickEvent(event) {
  return event.button === 0;
}

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

// TODO: De-duplicate against hasAnyProperties in createTransitionManager.
function isEmptyObject(object) {
  for (var p in object) {
    if (Object.prototype.hasOwnProperty.call(object, p)) return false;
  }return true;
}

function createLocationDescriptor(to, _ref) {
  var query = _ref.query;
  var hash = _ref.hash;
  var state = _ref.state;

  if (query || hash || state) {
    return { pathname: to, query: query, hash: hash, state: state };
  }

  return to;
}

/**
 * A <Link> is used to create an <a> element that links to a route.
 * When that route is active, the link gets the value of its
 * activeClassName prop.
 *
 * For example, assuming you have the following route:
 *
 *   <Route path="/posts/:postID" component={Post} />
 *
 * You could use the following component to link to that route:
 *
 *   <Link to={`/posts/${post.id}`} />
 *
 * Links may pass along location state and/or query string parameters
 * in the state/query props, respectively.
 *
 *   <Link ... query={{ show: true }} state={{ the: 'state' }} />
 */
var Link = _react2.default.createClass({
  displayName: 'Link',


  contextTypes: {
    router: _PropTypes.routerShape
  },

  propTypes: {
    to: oneOfType([string, object]),
    query: object,
    hash: string,
    state: object,
    activeStyle: object,
    activeClassName: string,
    onlyActiveOnIndex: bool.isRequired,
    onClick: func,
    target: string
  },

  getDefaultProps: function getDefaultProps() {
    return {
      onlyActiveOnIndex: false,
      style: {}
    };
  },
  handleClick: function handleClick(event) {
    if (this.props.onClick) this.props.onClick(event);

    if (event.defaultPrevented) return;

    !this.context.router ? process.env.NODE_ENV !== 'production' ? (0, _invariant2.default)(false, '<Link>s rendered outside of a router context cannot navigate.') : (0, _invariant2.default)(false) : void 0;

    if (isModifiedEvent(event) || !isLeftClickEvent(event)) return;

    // If target prop is set (e.g. to "_blank"), let browser handle link.
    /* istanbul ignore if: untestable with Karma */
    if (this.props.target) return;

    event.preventDefault();

    var _props = this.props;
    var to = _props.to;
    var query = _props.query;
    var hash = _props.hash;
    var state = _props.state;

    var location = createLocationDescriptor(to, { query: query, hash: hash, state: state });

    this.context.router.push(location);
  },
  render: function render() {
    var _props2 = this.props;
    var to = _props2.to;
    var query = _props2.query;
    var hash = _props2.hash;
    var state = _props2.state;
    var activeClassName = _props2.activeClassName;
    var activeStyle = _props2.activeStyle;
    var onlyActiveOnIndex = _props2.onlyActiveOnIndex;

    var props = _objectWithoutProperties(_props2, ['to', 'query', 'hash', 'state', 'activeClassName', 'activeStyle', 'onlyActiveOnIndex']);

    process.env.NODE_ENV !== 'production' ? (0, _routerWarning2.default)(!(query || hash || state), 'the `query`, `hash`, and `state` props on `<Link>` are deprecated, use `<Link to={{ pathname, query, hash, state }}/>. http://tiny.cc/router-isActivedeprecated') : void 0;

    // Ignore if rendered outside the context of router, simplifies unit testing.
    var router = this.context.router;


    if (router) {
      // If user does not specify a `to` prop, return an empty anchor tag.
      if (to == null) {
        return _react2.default.createElement('a', props);
      }

      var location = createLocationDescriptor(to, { query: query, hash: hash, state: state });
      props.href = router.createHref(location);

      if (activeClassName || activeStyle != null && !isEmptyObject(activeStyle)) {
        if (router.isActive(location, onlyActiveOnIndex)) {
          if (activeClassName) {
            if (props.className) {
              props.className += ' ' + activeClassName;
            } else {
              props.className = activeClassName;
            }
          }

          if (activeStyle) props.style = _extends({}, props.style, activeStyle);
        }
      }
    }

    return _react2.default.createElement('a', _extends({}, props, { onClick: this.handleClick }));
  }
});

exports.default = Link;
module.exports = exports['default'];
}).call(this,require('_process'))
},{"./PropTypes":44,"./routerWarning":69,"_process":29,"invariant":27,"react":97}],43:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;
exports.compilePattern = compilePattern;
exports.matchPattern = matchPattern;
exports.getParamNames = getParamNames;
exports.getParams = getParams;
exports.formatPattern = formatPattern;

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function _compilePattern(pattern) {
  var regexpSource = '';
  var paramNames = [];
  var tokens = [];

  var match = void 0,
      lastIndex = 0,
      matcher = /:([a-zA-Z_$][a-zA-Z0-9_$]*)|\*\*|\*|\(|\)/g;
  while (match = matcher.exec(pattern)) {
    if (match.index !== lastIndex) {
      tokens.push(pattern.slice(lastIndex, match.index));
      regexpSource += escapeRegExp(pattern.slice(lastIndex, match.index));
    }

    if (match[1]) {
      regexpSource += '([^/]+)';
      paramNames.push(match[1]);
    } else if (match[0] === '**') {
      regexpSource += '(.*)';
      paramNames.push('splat');
    } else if (match[0] === '*') {
      regexpSource += '(.*?)';
      paramNames.push('splat');
    } else if (match[0] === '(') {
      regexpSource += '(?:';
    } else if (match[0] === ')') {
      regexpSource += ')?';
    }

    tokens.push(match[0]);

    lastIndex = matcher.lastIndex;
  }

  if (lastIndex !== pattern.length) {
    tokens.push(pattern.slice(lastIndex, pattern.length));
    regexpSource += escapeRegExp(pattern.slice(lastIndex, pattern.length));
  }

  return {
    pattern: pattern,
    regexpSource: regexpSource,
    paramNames: paramNames,
    tokens: tokens
  };
}

var CompiledPatternsCache = Object.create(null);

function compilePattern(pattern) {
  if (!CompiledPatternsCache[pattern]) CompiledPatternsCache[pattern] = _compilePattern(pattern);

  return CompiledPatternsCache[pattern];
}

/**
 * Attempts to match a pattern on the given pathname. Patterns may use
 * the following special characters:
 *
 * - :paramName     Matches a URL segment up to the next /, ?, or #. The
 *                  captured string is considered a "param"
 * - ()             Wraps a segment of the URL that is optional
 * - *              Consumes (non-greedy) all characters up to the next
 *                  character in the pattern, or to the end of the URL if
 *                  there is none
 * - **             Consumes (greedy) all characters up to the next character
 *                  in the pattern, or to the end of the URL if there is none
 *
 *  The function calls callback(error, matched) when finished.
 * The return value is an object with the following properties:
 *
 * - remainingPathname
 * - paramNames
 * - paramValues
 */
function matchPattern(pattern, pathname) {
  // Ensure pattern starts with leading slash for consistency with pathname.
  if (pattern.charAt(0) !== '/') {
    pattern = '/' + pattern;
  }

  var _compilePattern2 = compilePattern(pattern);

  var regexpSource = _compilePattern2.regexpSource;
  var paramNames = _compilePattern2.paramNames;
  var tokens = _compilePattern2.tokens;


  if (pattern.charAt(pattern.length - 1) !== '/') {
    regexpSource += '/?'; // Allow optional path separator at end.
  }

  // Special-case patterns like '*' for catch-all routes.
  if (tokens[tokens.length - 1] === '*') {
    regexpSource += '$';
  }

  var match = pathname.match(new RegExp('^' + regexpSource, 'i'));
  if (match == null) {
    return null;
  }

  var matchedPath = match[0];
  var remainingPathname = pathname.substr(matchedPath.length);

  if (remainingPathname) {
    // Require that the match ends at a path separator, if we didn't match
    // the full path, so any remaining pathname is a new path segment.
    if (matchedPath.charAt(matchedPath.length - 1) !== '/') {
      return null;
    }

    // If there is a remaining pathname, treat the path separator as part of
    // the remaining pathname for properly continuing the match.
    remainingPathname = '/' + remainingPathname;
  }

  return {
    remainingPathname: remainingPathname,
    paramNames: paramNames,
    paramValues: match.slice(1).map(function (v) {
      return v && decodeURIComponent(v);
    })
  };
}

function getParamNames(pattern) {
  return compilePattern(pattern).paramNames;
}

function getParams(pattern, pathname) {
  var match = matchPattern(pattern, pathname);
  if (!match) {
    return null;
  }

  var paramNames = match.paramNames;
  var paramValues = match.paramValues;

  var params = {};

  paramNames.forEach(function (paramName, index) {
    params[paramName] = paramValues[index];
  });

  return params;
}

/**
 * Returns a version of the given pattern with params interpolated. Throws
 * if there is a dynamic segment of the pattern for which there is no param.
 */
function formatPattern(pattern, params) {
  params = params || {};

  var _compilePattern3 = compilePattern(pattern);

  var tokens = _compilePattern3.tokens;

  var parenCount = 0,
      pathname = '',
      splatIndex = 0;

  var token = void 0,
      paramName = void 0,
      paramValue = void 0;
  for (var i = 0, len = tokens.length; i < len; ++i) {
    token = tokens[i];

    if (token === '*' || token === '**') {
      paramValue = Array.isArray(params.splat) ? params.splat[splatIndex++] : params.splat;

      !(paramValue != null || parenCount > 0) ? process.env.NODE_ENV !== 'production' ? (0, _invariant2.default)(false, 'Missing splat #%s for path "%s"', splatIndex, pattern) : (0, _invariant2.default)(false) : void 0;

      if (paramValue != null) pathname += encodeURI(paramValue);
    } else if (token === '(') {
      parenCount += 1;
    } else if (token === ')') {
      parenCount -= 1;
    } else if (token.charAt(0) === ':') {
      paramName = token.substring(1);
      paramValue = params[paramName];

      !(paramValue != null || parenCount > 0) ? process.env.NODE_ENV !== 'production' ? (0, _invariant2.default)(false, 'Missing "%s" parameter for path "%s"', paramName, pattern) : (0, _invariant2.default)(false) : void 0;

      if (paramValue != null) pathname += encodeURIComponent(paramValue);
    } else {
      pathname += token;
    }
  }

  return pathname.replace(/\/+/g, '/');
}
}).call(this,require('_process'))
},{"_process":29,"invariant":27}],44:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;
exports.router = exports.routes = exports.route = exports.components = exports.component = exports.location = exports.history = exports.falsy = exports.locationShape = exports.routerShape = undefined;

var _react = require('react');

var _deprecateObjectProperties = require('./deprecateObjectProperties');

var _deprecateObjectProperties2 = _interopRequireDefault(_deprecateObjectProperties);

var _InternalPropTypes = require('./InternalPropTypes');

var InternalPropTypes = _interopRequireWildcard(_InternalPropTypes);

var _routerWarning = require('./routerWarning');

var _routerWarning2 = _interopRequireDefault(_routerWarning);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var func = _react.PropTypes.func;
var object = _react.PropTypes.object;
var shape = _react.PropTypes.shape;
var string = _react.PropTypes.string;
var routerShape = exports.routerShape = shape({
  push: func.isRequired,
  replace: func.isRequired,
  go: func.isRequired,
  goBack: func.isRequired,
  goForward: func.isRequired,
  setRouteLeaveHook: func.isRequired,
  isActive: func.isRequired
});

var locationShape = exports.locationShape = shape({
  pathname: string.isRequired,
  search: string.isRequired,
  state: object,
  action: string.isRequired,
  key: string
});

// Deprecated stuff below:

var falsy = exports.falsy = InternalPropTypes.falsy;
var history = exports.history = InternalPropTypes.history;
var location = exports.location = locationShape;
var component = exports.component = InternalPropTypes.component;
var components = exports.components = InternalPropTypes.components;
var route = exports.route = InternalPropTypes.route;
var routes = exports.routes = InternalPropTypes.routes;
var router = exports.router = routerShape;

if (process.env.NODE_ENV !== 'production') {
  (function () {
    var deprecatePropType = function deprecatePropType(propType, message) {
      return function () {
        process.env.NODE_ENV !== 'production' ? (0, _routerWarning2.default)(false, message) : void 0;
        return propType.apply(undefined, arguments);
      };
    };

    var deprecateInternalPropType = function deprecateInternalPropType(propType) {
      return deprecatePropType(propType, 'This prop type is not intended for external use, and was previously exported by mistake. These internal prop types are deprecated for external use, and will be removed in a later version.');
    };

    var deprecateRenamedPropType = function deprecateRenamedPropType(propType, name) {
      return deprecatePropType(propType, 'The `' + name + '` prop type is now exported as `' + name + 'Shape` to avoid name conflicts. This export is deprecated and will be removed in a later version.');
    };

    exports.falsy = falsy = deprecateInternalPropType(falsy);
    exports.history = history = deprecateInternalPropType(history);
    exports.component = component = deprecateInternalPropType(component);
    exports.components = components = deprecateInternalPropType(components);
    exports.route = route = deprecateInternalPropType(route);
    exports.routes = routes = deprecateInternalPropType(routes);

    exports.location = location = deprecateRenamedPropType(location, 'location');
    exports.router = router = deprecateRenamedPropType(router, 'router');
  })();
}

var defaultExport = {
  falsy: falsy,
  history: history,
  location: location,
  component: component,
  components: components,
  route: route,
  // For some reason, routes was never here.
  router: router
};

if (process.env.NODE_ENV !== 'production') {
  defaultExport = (0, _deprecateObjectProperties2.default)(defaultExport, 'The default export from `react-router/lib/PropTypes` is deprecated. Please use the named exports instead.');
}

exports.default = defaultExport;
}).call(this,require('_process'))
},{"./InternalPropTypes":40,"./deprecateObjectProperties":60,"./routerWarning":69,"_process":29,"react":97}],45:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _RouteUtils = require('./RouteUtils');

var _PatternUtils = require('./PatternUtils');

var _InternalPropTypes = require('./InternalPropTypes');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _React$PropTypes = _react2.default.PropTypes;
var string = _React$PropTypes.string;
var object = _React$PropTypes.object;

/**
 * A <Redirect> is used to declare another URL path a client should
 * be sent to when they request a given URL.
 *
 * Redirects are placed alongside routes in the route configuration
 * and are traversed in the same manner.
 */

var Redirect = _react2.default.createClass({
  displayName: 'Redirect',


  statics: {
    createRouteFromReactElement: function createRouteFromReactElement(element) {
      var route = (0, _RouteUtils.createRouteFromReactElement)(element);

      if (route.from) route.path = route.from;

      route.onEnter = function (nextState, replace) {
        var location = nextState.location;
        var params = nextState.params;


        var pathname = void 0;
        if (route.to.charAt(0) === '/') {
          pathname = (0, _PatternUtils.formatPattern)(route.to, params);
        } else if (!route.to) {
          pathname = location.pathname;
        } else {
          var routeIndex = nextState.routes.indexOf(route);
          var parentPattern = Redirect.getRoutePattern(nextState.routes, routeIndex - 1);
          var pattern = parentPattern.replace(/\/*$/, '/') + route.to;
          pathname = (0, _PatternUtils.formatPattern)(pattern, params);
        }

        replace({
          pathname: pathname,
          query: route.query || location.query,
          state: route.state || location.state
        });
      };

      return route;
    },
    getRoutePattern: function getRoutePattern(routes, routeIndex) {
      var parentPattern = '';

      for (var i = routeIndex; i >= 0; i--) {
        var route = routes[i];
        var pattern = route.path || '';

        parentPattern = pattern.replace(/\/*$/, '/') + parentPattern;

        if (pattern.indexOf('/') === 0) break;
      }

      return '/' + parentPattern;
    }
  },

  propTypes: {
    path: string,
    from: string, // Alias for path
    to: string.isRequired,
    query: object,
    state: object,
    onEnter: _InternalPropTypes.falsy,
    children: _InternalPropTypes.falsy
  },

  /* istanbul ignore next: sanity check */
  render: function render() {
    !false ? process.env.NODE_ENV !== 'production' ? (0, _invariant2.default)(false, '<Redirect> elements are for router configuration only and should not be rendered') : (0, _invariant2.default)(false) : void 0;
  }
});

exports.default = Redirect;
module.exports = exports['default'];
}).call(this,require('_process'))
},{"./InternalPropTypes":40,"./PatternUtils":43,"./RouteUtils":48,"_process":29,"invariant":27,"react":97}],46:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _RouteUtils = require('./RouteUtils');

var _InternalPropTypes = require('./InternalPropTypes');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _React$PropTypes = _react2.default.PropTypes;
var string = _React$PropTypes.string;
var func = _React$PropTypes.func;

/**
 * A <Route> is used to declare which components are rendered to the
 * page when the URL matches a given pattern.
 *
 * Routes are arranged in a nested tree structure. When a new URL is
 * requested, the tree is searched depth-first to find a route whose
 * path matches the URL.  When one is found, all routes in the tree
 * that lead to it are considered "active" and their components are
 * rendered into the DOM, nested in the same order as in the tree.
 */

var Route = _react2.default.createClass({
  displayName: 'Route',


  statics: {
    createRouteFromReactElement: _RouteUtils.createRouteFromReactElement
  },

  propTypes: {
    path: string,
    component: _InternalPropTypes.component,
    components: _InternalPropTypes.components,
    getComponent: func,
    getComponents: func
  },

  /* istanbul ignore next: sanity check */
  render: function render() {
    !false ? process.env.NODE_ENV !== 'production' ? (0, _invariant2.default)(false, '<Route> elements are for router configuration only and should not be rendered') : (0, _invariant2.default)(false) : void 0;
  }
});

exports.default = Route;
module.exports = exports['default'];
}).call(this,require('_process'))
},{"./InternalPropTypes":40,"./RouteUtils":48,"_process":29,"invariant":27,"react":97}],47:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _routerWarning = require('./routerWarning');

var _routerWarning2 = _interopRequireDefault(_routerWarning);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var object = _react2.default.PropTypes.object;

/**
 * The RouteContext mixin provides a convenient way for route
 * components to set the route in context. This is needed for
 * routes that render elements that want to use the Lifecycle
 * mixin to prevent transitions.
 */

var RouteContext = {

  propTypes: {
    route: object.isRequired
  },

  childContextTypes: {
    route: object.isRequired
  },

  getChildContext: function getChildContext() {
    return {
      route: this.props.route
    };
  },
  componentWillMount: function componentWillMount() {
    process.env.NODE_ENV !== 'production' ? (0, _routerWarning2.default)(false, 'The `RouteContext` mixin is deprecated. You can provide `this.props.route` on context with your own `contextTypes`. http://tiny.cc/router-routecontextmixin') : void 0;
  }
};

exports.default = RouteContext;
module.exports = exports['default'];
}).call(this,require('_process'))
},{"./routerWarning":69,"_process":29,"react":97}],48:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.isReactChildren = isReactChildren;
exports.createRouteFromReactElement = createRouteFromReactElement;
exports.createRoutesFromReactChildren = createRoutesFromReactChildren;
exports.createRoutes = createRoutes;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isValidChild(object) {
  return object == null || _react2.default.isValidElement(object);
}

function isReactChildren(object) {
  return isValidChild(object) || Array.isArray(object) && object.every(isValidChild);
}

function createRoute(defaultProps, props) {
  return _extends({}, defaultProps, props);
}

function createRouteFromReactElement(element) {
  var type = element.type;
  var route = createRoute(type.defaultProps, element.props);

  if (route.children) {
    var childRoutes = createRoutesFromReactChildren(route.children, route);

    if (childRoutes.length) route.childRoutes = childRoutes;

    delete route.children;
  }

  return route;
}

/**
 * Creates and returns a routes object from the given ReactChildren. JSX
 * provides a convenient way to visualize how routes in the hierarchy are
 * nested.
 *
 *   import { Route, createRoutesFromReactChildren } from 'react-router'
 *
 *   const routes = createRoutesFromReactChildren(
 *     <Route component={App}>
 *       <Route path="home" component={Dashboard}/>
 *       <Route path="news" component={NewsFeed}/>
 *     </Route>
 *   )
 *
 * Note: This method is automatically used when you provide <Route> children
 * to a <Router> component.
 */
function createRoutesFromReactChildren(children, parentRoute) {
  var routes = [];

  _react2.default.Children.forEach(children, function (element) {
    if (_react2.default.isValidElement(element)) {
      // Component classes may have a static create* method.
      if (element.type.createRouteFromReactElement) {
        var route = element.type.createRouteFromReactElement(element, parentRoute);

        if (route) routes.push(route);
      } else {
        routes.push(createRouteFromReactElement(element));
      }
    }
  });

  return routes;
}

/**
 * Creates and returns an array of routes from the given object which
 * may be a JSX route, a plain object route, or an array of either.
 */
function createRoutes(routes) {
  if (isReactChildren(routes)) {
    routes = createRoutesFromReactChildren(routes);
  } else if (routes && !Array.isArray(routes)) {
    routes = [routes];
  }

  return routes;
}
},{"react":97}],49:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createHashHistory = require('history/lib/createHashHistory');

var _createHashHistory2 = _interopRequireDefault(_createHashHistory);

var _useQueries = require('history/lib/useQueries');

var _useQueries2 = _interopRequireDefault(_useQueries);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _createTransitionManager = require('./createTransitionManager');

var _createTransitionManager2 = _interopRequireDefault(_createTransitionManager);

var _InternalPropTypes = require('./InternalPropTypes');

var _RouterContext = require('./RouterContext');

var _RouterContext2 = _interopRequireDefault(_RouterContext);

var _RouteUtils = require('./RouteUtils');

var _RouterUtils = require('./RouterUtils');

var _routerWarning = require('./routerWarning');

var _routerWarning2 = _interopRequireDefault(_routerWarning);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function isDeprecatedHistory(history) {
  return !history || !history.__v2_compatible__;
}

/* istanbul ignore next: sanity check */
function isUnsupportedHistory(history) {
  // v3 histories expose getCurrentLocation, but aren't currently supported.
  return history && history.getCurrentLocation;
}

var _React$PropTypes = _react2.default.PropTypes;
var func = _React$PropTypes.func;
var object = _React$PropTypes.object;

/**
 * A <Router> is a high-level API for automatically setting up
 * a router that renders a <RouterContext> with all the props
 * it needs each time the URL changes.
 */

var Router = _react2.default.createClass({
  displayName: 'Router',


  propTypes: {
    history: object,
    children: _InternalPropTypes.routes,
    routes: _InternalPropTypes.routes, // alias for children
    render: func,
    createElement: func,
    onError: func,
    onUpdate: func,

    // Deprecated:
    parseQueryString: func,
    stringifyQuery: func,

    // PRIVATE: For client-side rehydration of server match.
    matchContext: object
  },

  getDefaultProps: function getDefaultProps() {
    return {
      render: function render(props) {
        return _react2.default.createElement(_RouterContext2.default, props);
      }
    };
  },
  getInitialState: function getInitialState() {
    return {
      location: null,
      routes: null,
      params: null,
      components: null
    };
  },
  handleError: function handleError(error) {
    if (this.props.onError) {
      this.props.onError.call(this, error);
    } else {
      // Throw errors by default so we don't silently swallow them!
      throw error; // This error probably occurred in getChildRoutes or getComponents.
    }
  },
  componentWillMount: function componentWillMount() {
    var _this = this;

    var _props = this.props;
    var parseQueryString = _props.parseQueryString;
    var stringifyQuery = _props.stringifyQuery;

    process.env.NODE_ENV !== 'production' ? (0, _routerWarning2.default)(!(parseQueryString || stringifyQuery), '`parseQueryString` and `stringifyQuery` are deprecated. Please create a custom history. http://tiny.cc/router-customquerystring') : void 0;

    var _createRouterObjects = this.createRouterObjects();

    var history = _createRouterObjects.history;
    var transitionManager = _createRouterObjects.transitionManager;
    var router = _createRouterObjects.router;


    this._unlisten = transitionManager.listen(function (error, state) {
      if (error) {
        _this.handleError(error);
      } else {
        _this.setState(state, _this.props.onUpdate);
      }
    });

    this.history = history;
    this.router = router;
  },
  createRouterObjects: function createRouterObjects() {
    var matchContext = this.props.matchContext;

    if (matchContext) {
      return matchContext;
    }

    var history = this.props.history;
    var _props2 = this.props;
    var routes = _props2.routes;
    var children = _props2.children;


    !!isUnsupportedHistory(history) ? process.env.NODE_ENV !== 'production' ? (0, _invariant2.default)(false, 'You have provided a history object created with history v3.x. ' + 'This version of React Router is not compatible with v3 history ' + 'objects. Please use history v2.x instead.') : (0, _invariant2.default)(false) : void 0;

    if (isDeprecatedHistory(history)) {
      history = this.wrapDeprecatedHistory(history);
    }

    var transitionManager = (0, _createTransitionManager2.default)(history, (0, _RouteUtils.createRoutes)(routes || children));
    var router = (0, _RouterUtils.createRouterObject)(history, transitionManager);
    var routingHistory = (0, _RouterUtils.createRoutingHistory)(history, transitionManager);

    return { history: routingHistory, transitionManager: transitionManager, router: router };
  },
  wrapDeprecatedHistory: function wrapDeprecatedHistory(history) {
    var _props3 = this.props;
    var parseQueryString = _props3.parseQueryString;
    var stringifyQuery = _props3.stringifyQuery;


    var createHistory = void 0;
    if (history) {
      process.env.NODE_ENV !== 'production' ? (0, _routerWarning2.default)(false, 'It appears you have provided a deprecated history object to `<Router/>`, please use a history provided by ' + 'React Router with `import { browserHistory } from \'react-router\'` or `import { hashHistory } from \'react-router\'`. ' + 'If you are using a custom history please create it with `useRouterHistory`, see http://tiny.cc/router-usinghistory for details.') : void 0;
      createHistory = function createHistory() {
        return history;
      };
    } else {
      process.env.NODE_ENV !== 'production' ? (0, _routerWarning2.default)(false, '`Router` no longer defaults the history prop to hash history. Please use the `hashHistory` singleton instead. http://tiny.cc/router-defaulthistory') : void 0;
      createHistory = _createHashHistory2.default;
    }

    return (0, _useQueries2.default)(createHistory)({ parseQueryString: parseQueryString, stringifyQuery: stringifyQuery });
  },


  /* istanbul ignore next: sanity check */
  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    process.env.NODE_ENV !== 'production' ? (0, _routerWarning2.default)(nextProps.history === this.props.history, 'You cannot change <Router history>; it will be ignored') : void 0;

    process.env.NODE_ENV !== 'production' ? (0, _routerWarning2.default)((nextProps.routes || nextProps.children) === (this.props.routes || this.props.children), 'You cannot change <Router routes>; it will be ignored') : void 0;
  },
  componentWillUnmount: function componentWillUnmount() {
    if (this._unlisten) this._unlisten();
  },
  render: function render() {
    var _state = this.state;
    var location = _state.location;
    var routes = _state.routes;
    var params = _state.params;
    var components = _state.components;
    var _props4 = this.props;
    var createElement = _props4.createElement;
    var render = _props4.render;

    var props = _objectWithoutProperties(_props4, ['createElement', 'render']);

    if (location == null) return null; // Async match

    // Only forward non-Router-specific props to routing context, as those are
    // the only ones that might be custom routing context props.
    Object.keys(Router.propTypes).forEach(function (propType) {
      return delete props[propType];
    });

    return render(_extends({}, props, {
      history: this.history,
      router: this.router,
      location: location,
      routes: routes,
      params: params,
      components: components,
      createElement: createElement
    }));
  }
});

exports.default = Router;
module.exports = exports['default'];
}).call(this,require('_process'))
},{"./InternalPropTypes":40,"./RouteUtils":48,"./RouterContext":50,"./RouterUtils":51,"./createTransitionManager":59,"./routerWarning":69,"_process":29,"history/lib/createHashHistory":17,"history/lib/useQueries":24,"invariant":27,"react":97}],50:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _deprecateObjectProperties = require('./deprecateObjectProperties');

var _deprecateObjectProperties2 = _interopRequireDefault(_deprecateObjectProperties);

var _getRouteParams = require('./getRouteParams');

var _getRouteParams2 = _interopRequireDefault(_getRouteParams);

var _RouteUtils = require('./RouteUtils');

var _routerWarning = require('./routerWarning');

var _routerWarning2 = _interopRequireDefault(_routerWarning);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _React$PropTypes = _react2.default.PropTypes;
var array = _React$PropTypes.array;
var func = _React$PropTypes.func;
var object = _React$PropTypes.object;

/**
 * A <RouterContext> renders the component tree for a given router state
 * and sets the history object and the current location in context.
 */

var RouterContext = _react2.default.createClass({
  displayName: 'RouterContext',


  propTypes: {
    history: object,
    router: object.isRequired,
    location: object.isRequired,
    routes: array.isRequired,
    params: object.isRequired,
    components: array.isRequired,
    createElement: func.isRequired
  },

  getDefaultProps: function getDefaultProps() {
    return {
      createElement: _react2.default.createElement
    };
  },


  childContextTypes: {
    history: object,
    location: object.isRequired,
    router: object.isRequired
  },

  getChildContext: function getChildContext() {
    var _props = this.props;
    var router = _props.router;
    var history = _props.history;
    var location = _props.location;

    if (!router) {
      process.env.NODE_ENV !== 'production' ? (0, _routerWarning2.default)(false, '`<RouterContext>` expects a `router` rather than a `history`') : void 0;

      router = _extends({}, history, {
        setRouteLeaveHook: history.listenBeforeLeavingRoute
      });
      delete router.listenBeforeLeavingRoute;
    }

    if (process.env.NODE_ENV !== 'production') {
      location = (0, _deprecateObjectProperties2.default)(location, '`context.location` is deprecated, please use a route component\'s `props.location` instead. http://tiny.cc/router-accessinglocation');
    }

    return { history: history, location: location, router: router };
  },
  createElement: function createElement(component, props) {
    return component == null ? null : this.props.createElement(component, props);
  },
  render: function render() {
    var _this = this;

    var _props2 = this.props;
    var history = _props2.history;
    var location = _props2.location;
    var routes = _props2.routes;
    var params = _props2.params;
    var components = _props2.components;

    var element = null;

    if (components) {
      element = components.reduceRight(function (element, components, index) {
        if (components == null) return element; // Don't create new children; use the grandchildren.

        var route = routes[index];
        var routeParams = (0, _getRouteParams2.default)(route, params);
        var props = {
          history: history,
          location: location,
          params: params,
          route: route,
          routeParams: routeParams,
          routes: routes
        };

        if ((0, _RouteUtils.isReactChildren)(element)) {
          props.children = element;
        } else if (element) {
          for (var prop in element) {
            if (Object.prototype.hasOwnProperty.call(element, prop)) props[prop] = element[prop];
          }
        }

        if ((typeof components === 'undefined' ? 'undefined' : _typeof(components)) === 'object') {
          var elements = {};

          for (var key in components) {
            if (Object.prototype.hasOwnProperty.call(components, key)) {
              // Pass through the key as a prop to createElement to allow
              // custom createElement functions to know which named component
              // they're rendering, for e.g. matching up to fetched data.
              elements[key] = _this.createElement(components[key], _extends({
                key: key }, props));
            }
          }

          return elements;
        }

        return _this.createElement(components, props);
      }, element);
    }

    !(element === null || element === false || _react2.default.isValidElement(element)) ? process.env.NODE_ENV !== 'production' ? (0, _invariant2.default)(false, 'The root route must render a single element') : (0, _invariant2.default)(false) : void 0;

    return element;
  }
});

exports.default = RouterContext;
module.exports = exports['default'];
}).call(this,require('_process'))
},{"./RouteUtils":48,"./deprecateObjectProperties":60,"./getRouteParams":62,"./routerWarning":69,"_process":29,"invariant":27,"react":97}],51:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.createRouterObject = createRouterObject;
exports.createRoutingHistory = createRoutingHistory;

var _deprecateObjectProperties = require('./deprecateObjectProperties');

var _deprecateObjectProperties2 = _interopRequireDefault(_deprecateObjectProperties);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createRouterObject(history, transitionManager) {
  return _extends({}, history, {
    setRouteLeaveHook: transitionManager.listenBeforeLeavingRoute,
    isActive: transitionManager.isActive
  });
}

// deprecated
function createRoutingHistory(history, transitionManager) {
  history = _extends({}, history, transitionManager);

  if (process.env.NODE_ENV !== 'production') {
    history = (0, _deprecateObjectProperties2.default)(history, '`props.history` and `context.history` are deprecated. Please use `context.router`. http://tiny.cc/router-contextchanges');
  }

  return history;
}
}).call(this,require('_process'))
},{"./deprecateObjectProperties":60,"_process":29}],52:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _RouterContext = require('./RouterContext');

var _RouterContext2 = _interopRequireDefault(_RouterContext);

var _routerWarning = require('./routerWarning');

var _routerWarning2 = _interopRequireDefault(_routerWarning);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var RoutingContext = _react2.default.createClass({
  displayName: 'RoutingContext',
  componentWillMount: function componentWillMount() {
    process.env.NODE_ENV !== 'production' ? (0, _routerWarning2.default)(false, '`RoutingContext` has been renamed to `RouterContext`. Please use `import { RouterContext } from \'react-router\'`. http://tiny.cc/router-routercontext') : void 0;
  },
  render: function render() {
    return _react2.default.createElement(_RouterContext2.default, this.props);
  }
});

exports.default = RoutingContext;
module.exports = exports['default'];
}).call(this,require('_process'))
},{"./RouterContext":50,"./routerWarning":69,"_process":29,"react":97}],53:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;
exports.runEnterHooks = runEnterHooks;
exports.runChangeHooks = runChangeHooks;
exports.runLeaveHooks = runLeaveHooks;

var _AsyncUtils = require('./AsyncUtils');

var _routerWarning = require('./routerWarning');

var _routerWarning2 = _interopRequireDefault(_routerWarning);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createTransitionHook(hook, route, asyncArity) {
  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    hook.apply(route, args);

    if (hook.length < asyncArity) {
      var callback = args[args.length - 1];
      // Assume hook executes synchronously and
      // automatically call the callback.
      callback();
    }
  };
}

function getEnterHooks(routes) {
  return routes.reduce(function (hooks, route) {
    if (route.onEnter) hooks.push(createTransitionHook(route.onEnter, route, 3));

    return hooks;
  }, []);
}

function getChangeHooks(routes) {
  return routes.reduce(function (hooks, route) {
    if (route.onChange) hooks.push(createTransitionHook(route.onChange, route, 4));
    return hooks;
  }, []);
}

function runTransitionHooks(length, iter, callback) {
  if (!length) {
    callback();
    return;
  }

  var redirectInfo = void 0;
  function replace(location, deprecatedPathname, deprecatedQuery) {
    if (deprecatedPathname) {
      process.env.NODE_ENV !== 'production' ? (0, _routerWarning2.default)(false, '`replaceState(state, pathname, query) is deprecated; use `replace(location)` with a location descriptor instead. http://tiny.cc/router-isActivedeprecated') : void 0;
      redirectInfo = {
        pathname: deprecatedPathname,
        query: deprecatedQuery,
        state: location
      };

      return;
    }

    redirectInfo = location;
  }

  (0, _AsyncUtils.loopAsync)(length, function (index, next, done) {
    iter(index, replace, function (error) {
      if (error || redirectInfo) {
        done(error, redirectInfo); // No need to continue.
      } else {
        next();
      }
    });
  }, callback);
}

/**
 * Runs all onEnter hooks in the given array of routes in order
 * with onEnter(nextState, replace, callback) and calls
 * callback(error, redirectInfo) when finished. The first hook
 * to use replace short-circuits the loop.
 *
 * If a hook needs to run asynchronously, it may use the callback
 * function. However, doing so will cause the transition to pause,
 * which could lead to a non-responsive UI if the hook is slow.
 */
function runEnterHooks(routes, nextState, callback) {
  var hooks = getEnterHooks(routes);
  return runTransitionHooks(hooks.length, function (index, replace, next) {
    hooks[index](nextState, replace, next);
  }, callback);
}

/**
 * Runs all onChange hooks in the given array of routes in order
 * with onChange(prevState, nextState, replace, callback) and calls
 * callback(error, redirectInfo) when finished. The first hook
 * to use replace short-circuits the loop.
 *
 * If a hook needs to run asynchronously, it may use the callback
 * function. However, doing so will cause the transition to pause,
 * which could lead to a non-responsive UI if the hook is slow.
 */
function runChangeHooks(routes, state, nextState, callback) {
  var hooks = getChangeHooks(routes);
  return runTransitionHooks(hooks.length, function (index, replace, next) {
    hooks[index](state, nextState, replace, next);
  }, callback);
}

/**
 * Runs all onLeave hooks in the given array of routes in order.
 */
function runLeaveHooks(routes, prevState) {
  for (var i = 0, len = routes.length; i < len; ++i) {
    if (routes[i].onLeave) routes[i].onLeave.call(routes[i], prevState);
  }
}
}).call(this,require('_process'))
},{"./AsyncUtils":35,"./routerWarning":69,"_process":29}],54:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _RouterContext = require('./RouterContext');

var _RouterContext2 = _interopRequireDefault(_RouterContext);

var _routerWarning = require('./routerWarning');

var _routerWarning2 = _interopRequireDefault(_routerWarning);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
  for (var _len = arguments.length, middlewares = Array(_len), _key = 0; _key < _len; _key++) {
    middlewares[_key] = arguments[_key];
  }

  if (process.env.NODE_ENV !== 'production') {
    middlewares.forEach(function (middleware, index) {
      process.env.NODE_ENV !== 'production' ? (0, _routerWarning2.default)(middleware.renderRouterContext || middleware.renderRouteComponent, 'The middleware specified at index ' + index + ' does not appear to be ' + 'a valid React Router middleware.') : void 0;
    });
  }

  var withContext = middlewares.map(function (middleware) {
    return middleware.renderRouterContext;
  }).filter(Boolean);
  var withComponent = middlewares.map(function (middleware) {
    return middleware.renderRouteComponent;
  }).filter(Boolean);

  var makeCreateElement = function makeCreateElement() {
    var baseCreateElement = arguments.length <= 0 || arguments[0] === undefined ? _react.createElement : arguments[0];
    return function (Component, props) {
      return withComponent.reduceRight(function (previous, renderRouteComponent) {
        return renderRouteComponent(previous, props);
      }, baseCreateElement(Component, props));
    };
  };

  return function (renderProps) {
    return withContext.reduceRight(function (previous, renderRouterContext) {
      return renderRouterContext(previous, renderProps);
    }, _react2.default.createElement(_RouterContext2.default, _extends({}, renderProps, {
      createElement: makeCreateElement(renderProps.createElement)
    })));
  };
};

module.exports = exports['default'];
}).call(this,require('_process'))
},{"./RouterContext":50,"./routerWarning":69,"_process":29,"react":97}],55:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _createBrowserHistory = require('history/lib/createBrowserHistory');

var _createBrowserHistory2 = _interopRequireDefault(_createBrowserHistory);

var _createRouterHistory = require('./createRouterHistory');

var _createRouterHistory2 = _interopRequireDefault(_createRouterHistory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (0, _createRouterHistory2.default)(_createBrowserHistory2.default);
module.exports = exports['default'];
},{"./createRouterHistory":58,"history/lib/createBrowserHistory":15}],56:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _PatternUtils = require('./PatternUtils');

function routeParamsChanged(route, prevState, nextState) {
  if (!route.path) return false;

  var paramNames = (0, _PatternUtils.getParamNames)(route.path);

  return paramNames.some(function (paramName) {
    return prevState.params[paramName] !== nextState.params[paramName];
  });
}

/**
 * Returns an object of { leaveRoutes, changeRoutes, enterRoutes } determined by
 * the change from prevState to nextState. We leave routes if either
 * 1) they are not in the next state or 2) they are in the next state
 * but their params have changed (i.e. /users/123 => /users/456).
 *
 * leaveRoutes are ordered starting at the leaf route of the tree
 * we're leaving up to the common parent route. enterRoutes are ordered
 * from the top of the tree we're entering down to the leaf route.
 *
 * changeRoutes are any routes that didn't leave or enter during
 * the transition.
 */
function computeChangedRoutes(prevState, nextState) {
  var prevRoutes = prevState && prevState.routes;
  var nextRoutes = nextState.routes;

  var leaveRoutes = void 0,
      changeRoutes = void 0,
      enterRoutes = void 0;
  if (prevRoutes) {
    (function () {
      var parentIsLeaving = false;
      leaveRoutes = prevRoutes.filter(function (route) {
        if (parentIsLeaving) {
          return true;
        } else {
          var isLeaving = nextRoutes.indexOf(route) === -1 || routeParamsChanged(route, prevState, nextState);
          if (isLeaving) parentIsLeaving = true;
          return isLeaving;
        }
      });

      // onLeave hooks start at the leaf route.
      leaveRoutes.reverse();

      enterRoutes = [];
      changeRoutes = [];

      nextRoutes.forEach(function (route) {
        var isNew = prevRoutes.indexOf(route) === -1;
        var paramsChanged = leaveRoutes.indexOf(route) !== -1;

        if (isNew || paramsChanged) enterRoutes.push(route);else changeRoutes.push(route);
      });
    })();
  } else {
    leaveRoutes = [];
    changeRoutes = [];
    enterRoutes = nextRoutes;
  }

  return {
    leaveRoutes: leaveRoutes,
    changeRoutes: changeRoutes,
    enterRoutes: enterRoutes
  };
}

exports.default = computeChangedRoutes;
module.exports = exports['default'];
},{"./PatternUtils":43}],57:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.default = createMemoryHistory;

var _useQueries = require('history/lib/useQueries');

var _useQueries2 = _interopRequireDefault(_useQueries);

var _useBasename = require('history/lib/useBasename');

var _useBasename2 = _interopRequireDefault(_useBasename);

var _createMemoryHistory = require('history/lib/createMemoryHistory');

var _createMemoryHistory2 = _interopRequireDefault(_createMemoryHistory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createMemoryHistory(options) {
  // signatures and type checking differ between `useRoutes` and
  // `createMemoryHistory`, have to create `memoryHistory` first because
  // `useQueries` doesn't understand the signature
  var memoryHistory = (0, _createMemoryHistory2.default)(options);
  var createHistory = function createHistory() {
    return memoryHistory;
  };
  var history = (0, _useQueries2.default)((0, _useBasename2.default)(createHistory))(options);
  history.__v2_compatible__ = true;
  return history;
}
module.exports = exports['default'];
},{"history/lib/createMemoryHistory":20,"history/lib/useBasename":23,"history/lib/useQueries":24}],58:[function(require,module,exports){
'use strict';

exports.__esModule = true;

exports.default = function (createHistory) {
  var history = void 0;
  if (canUseDOM) history = (0, _useRouterHistory2.default)(createHistory)();
  return history;
};

var _useRouterHistory = require('./useRouterHistory');

var _useRouterHistory2 = _interopRequireDefault(_useRouterHistory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var canUseDOM = !!(typeof window !== 'undefined' && window.document && window.document.createElement);

module.exports = exports['default'];
},{"./useRouterHistory":70}],59:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = createTransitionManager;

var _routerWarning = require('./routerWarning');

var _routerWarning2 = _interopRequireDefault(_routerWarning);

var _computeChangedRoutes2 = require('./computeChangedRoutes');

var _computeChangedRoutes3 = _interopRequireDefault(_computeChangedRoutes2);

var _TransitionUtils = require('./TransitionUtils');

var _isActive2 = require('./isActive');

var _isActive3 = _interopRequireDefault(_isActive2);

var _getComponents = require('./getComponents');

var _getComponents2 = _interopRequireDefault(_getComponents);

var _matchRoutes = require('./matchRoutes');

var _matchRoutes2 = _interopRequireDefault(_matchRoutes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function hasAnyProperties(object) {
  for (var p in object) {
    if (Object.prototype.hasOwnProperty.call(object, p)) return true;
  }return false;
}

function createTransitionManager(history, routes) {
  var state = {};

  // Signature should be (location, indexOnly), but needs to support (path,
  // query, indexOnly)
  function isActive(location) {
    var indexOnlyOrDeprecatedQuery = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
    var deprecatedIndexOnly = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

    var indexOnly = void 0;
    if (indexOnlyOrDeprecatedQuery && indexOnlyOrDeprecatedQuery !== true || deprecatedIndexOnly !== null) {
      process.env.NODE_ENV !== 'production' ? (0, _routerWarning2.default)(false, '`isActive(pathname, query, indexOnly) is deprecated; use `isActive(location, indexOnly)` with a location descriptor instead. http://tiny.cc/router-isActivedeprecated') : void 0;
      location = { pathname: location, query: indexOnlyOrDeprecatedQuery };
      indexOnly = deprecatedIndexOnly || false;
    } else {
      location = history.createLocation(location);
      indexOnly = indexOnlyOrDeprecatedQuery;
    }

    return (0, _isActive3.default)(location, indexOnly, state.location, state.routes, state.params);
  }

  var partialNextState = void 0;

  function match(location, callback) {
    if (partialNextState && partialNextState.location === location) {
      // Continue from where we left off.
      finishMatch(partialNextState, callback);
    } else {
      (0, _matchRoutes2.default)(routes, location, function (error, nextState) {
        if (error) {
          callback(error);
        } else if (nextState) {
          finishMatch(_extends({}, nextState, { location: location }), callback);
        } else {
          callback();
        }
      });
    }
  }

  function finishMatch(nextState, callback) {
    var _computeChangedRoutes = (0, _computeChangedRoutes3.default)(state, nextState);

    var leaveRoutes = _computeChangedRoutes.leaveRoutes;
    var changeRoutes = _computeChangedRoutes.changeRoutes;
    var enterRoutes = _computeChangedRoutes.enterRoutes;


    (0, _TransitionUtils.runLeaveHooks)(leaveRoutes, state);

    // Tear down confirmation hooks for left routes
    leaveRoutes.filter(function (route) {
      return enterRoutes.indexOf(route) === -1;
    }).forEach(removeListenBeforeHooksForRoute);

    // change and enter hooks are run in series
    (0, _TransitionUtils.runChangeHooks)(changeRoutes, state, nextState, function (error, redirectInfo) {
      if (error || redirectInfo) return handleErrorOrRedirect(error, redirectInfo);

      (0, _TransitionUtils.runEnterHooks)(enterRoutes, nextState, finishEnterHooks);
    });

    function finishEnterHooks(error, redirectInfo) {
      if (error || redirectInfo) return handleErrorOrRedirect(error, redirectInfo);

      // TODO: Fetch components after state is updated.
      (0, _getComponents2.default)(nextState, function (error, components) {
        if (error) {
          callback(error);
        } else {
          // TODO: Make match a pure function and have some other API
          // for "match and update state".
          callback(null, null, state = _extends({}, nextState, { components: components }));
        }
      });
    }

    function handleErrorOrRedirect(error, redirectInfo) {
      if (error) callback(error);else callback(null, redirectInfo);
    }
  }

  var RouteGuid = 1;

  function getRouteID(route) {
    var create = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

    return route.__id__ || create && (route.__id__ = RouteGuid++);
  }

  var RouteHooks = Object.create(null);

  function getRouteHooksForRoutes(routes) {
    return routes.reduce(function (hooks, route) {
      hooks.push.apply(hooks, RouteHooks[getRouteID(route)]);
      return hooks;
    }, []);
  }

  function transitionHook(location, callback) {
    (0, _matchRoutes2.default)(routes, location, function (error, nextState) {
      if (nextState == null) {
        // TODO: We didn't actually match anything, but hang
        // onto error/nextState so we don't have to matchRoutes
        // again in the listen callback.
        callback();
        return;
      }

      // Cache some state here so we don't have to
      // matchRoutes() again in the listen callback.
      partialNextState = _extends({}, nextState, { location: location });

      var hooks = getRouteHooksForRoutes((0, _computeChangedRoutes3.default)(state, partialNextState).leaveRoutes);

      var result = void 0;
      for (var i = 0, len = hooks.length; result == null && i < len; ++i) {
        // Passing the location arg here indicates to
        // the user that this is a transition hook.
        result = hooks[i](location);
      }

      callback(result);
    });
  }

  /* istanbul ignore next: untestable with Karma */
  function beforeUnloadHook() {
    // Synchronously check to see if any route hooks want
    // to prevent the current window/tab from closing.
    if (state.routes) {
      var hooks = getRouteHooksForRoutes(state.routes);

      var message = void 0;
      for (var i = 0, len = hooks.length; typeof message !== 'string' && i < len; ++i) {
        // Passing no args indicates to the user that this is a
        // beforeunload hook. We don't know the next location.
        message = hooks[i]();
      }

      return message;
    }
  }

  var unlistenBefore = void 0,
      unlistenBeforeUnload = void 0;

  function removeListenBeforeHooksForRoute(route) {
    var routeID = getRouteID(route, false);
    if (!routeID) {
      return;
    }

    delete RouteHooks[routeID];

    if (!hasAnyProperties(RouteHooks)) {
      // teardown transition & beforeunload hooks
      if (unlistenBefore) {
        unlistenBefore();
        unlistenBefore = null;
      }

      if (unlistenBeforeUnload) {
        unlistenBeforeUnload();
        unlistenBeforeUnload = null;
      }
    }
  }

  /**
   * Registers the given hook function to run before leaving the given route.
   *
   * During a normal transition, the hook function receives the next location
   * as its only argument and can return either a prompt message (string) to show the user,
   * to make sure they want to leave the page; or `false`, to prevent the transition.
   * Any other return value will have no effect.
   *
   * During the beforeunload event (in browsers) the hook receives no arguments.
   * In this case it must return a prompt message to prevent the transition.
   *
   * Returns a function that may be used to unbind the listener.
   */
  function listenBeforeLeavingRoute(route, hook) {
    // TODO: Warn if they register for a route that isn't currently
    // active. They're probably doing something wrong, like re-creating
    // route objects on every location change.
    var routeID = getRouteID(route);
    var hooks = RouteHooks[routeID];

    if (!hooks) {
      var thereWereNoRouteHooks = !hasAnyProperties(RouteHooks);

      RouteHooks[routeID] = [hook];

      if (thereWereNoRouteHooks) {
        // setup transition & beforeunload hooks
        unlistenBefore = history.listenBefore(transitionHook);

        if (history.listenBeforeUnload) unlistenBeforeUnload = history.listenBeforeUnload(beforeUnloadHook);
      }
    } else {
      if (hooks.indexOf(hook) === -1) {
        process.env.NODE_ENV !== 'production' ? (0, _routerWarning2.default)(false, 'adding multiple leave hooks for the same route is deprecated; manage multiple confirmations in your own code instead') : void 0;

        hooks.push(hook);
      }
    }

    return function () {
      var hooks = RouteHooks[routeID];

      if (hooks) {
        var newHooks = hooks.filter(function (item) {
          return item !== hook;
        });

        if (newHooks.length === 0) {
          removeListenBeforeHooksForRoute(route);
        } else {
          RouteHooks[routeID] = newHooks;
        }
      }
    };
  }

  /**
   * This is the API for stateful environments. As the location
   * changes, we update state and call the listener. We can also
   * gracefully handle errors and redirects.
   */
  function listen(listener) {
    // TODO: Only use a single history listener. Otherwise we'll
    // end up with multiple concurrent calls to match.
    return history.listen(function (location) {
      if (state.location === location) {
        listener(null, state);
      } else {
        match(location, function (error, redirectLocation, nextState) {
          if (error) {
            listener(error);
          } else if (redirectLocation) {
            history.replace(redirectLocation);
          } else if (nextState) {
            listener(null, nextState);
          } else {
            process.env.NODE_ENV !== 'production' ? (0, _routerWarning2.default)(false, 'Location "%s" did not match any routes', location.pathname + location.search + location.hash) : void 0;
          }
        });
      }
    });
  }

  return {
    isActive: isActive,
    match: match,
    listenBeforeLeavingRoute: listenBeforeLeavingRoute,
    listen: listen
  };
}

//export default useRoutes

module.exports = exports['default'];
}).call(this,require('_process'))
},{"./TransitionUtils":53,"./computeChangedRoutes":56,"./getComponents":61,"./isActive":65,"./matchRoutes":68,"./routerWarning":69,"_process":29}],60:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;
exports.canUseMembrane = undefined;

var _routerWarning = require('./routerWarning');

var _routerWarning2 = _interopRequireDefault(_routerWarning);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var canUseMembrane = exports.canUseMembrane = false;

// No-op by default.
var deprecateObjectProperties = function deprecateObjectProperties(object) {
  return object;
};

if (process.env.NODE_ENV !== 'production') {
  try {
    if (Object.defineProperty({}, 'x', {
      get: function get() {
        return true;
      }
    }).x) {
      exports.canUseMembrane = canUseMembrane = true;
    }
    /* eslint-disable no-empty */
  } catch (e) {}
  /* eslint-enable no-empty */

  if (canUseMembrane) {
    deprecateObjectProperties = function deprecateObjectProperties(object, message) {
      // Wrap the deprecated object in a membrane to warn on property access.
      var membrane = {};

      var _loop = function _loop(prop) {
        if (!Object.prototype.hasOwnProperty.call(object, prop)) {
          return 'continue';
        }

        if (typeof object[prop] === 'function') {
          // Can't use fat arrow here because of use of arguments below.
          membrane[prop] = function () {
            process.env.NODE_ENV !== 'production' ? (0, _routerWarning2.default)(false, message) : void 0;
            return object[prop].apply(object, arguments);
          };
          return 'continue';
        }

        // These properties are non-enumerable to prevent React dev tools from
        // seeing them and causing spurious warnings when accessing them. In
        // principle this could be done with a proxy, but support for the
        // ownKeys trap on proxies is not universal, even among browsers that
        // otherwise support proxies.
        Object.defineProperty(membrane, prop, {
          get: function get() {
            process.env.NODE_ENV !== 'production' ? (0, _routerWarning2.default)(false, message) : void 0;
            return object[prop];
          }
        });
      };

      for (var prop in object) {
        var _ret = _loop(prop);

        if (_ret === 'continue') continue;
      }

      return membrane;
    };
  }
}

exports.default = deprecateObjectProperties;
}).call(this,require('_process'))
},{"./routerWarning":69,"_process":29}],61:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _AsyncUtils = require('./AsyncUtils');

var _makeStateWithLocation = require('./makeStateWithLocation');

var _makeStateWithLocation2 = _interopRequireDefault(_makeStateWithLocation);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getComponentsForRoute(nextState, route, callback) {
  if (route.component || route.components) {
    callback(null, route.component || route.components);
    return;
  }

  var getComponent = route.getComponent || route.getComponents;
  if (!getComponent) {
    callback();
    return;
  }

  var location = nextState.location;

  var nextStateWithLocation = (0, _makeStateWithLocation2.default)(nextState, location);

  getComponent.call(route, nextStateWithLocation, callback);
}

/**
 * Asynchronously fetches all components needed for the given router
 * state and calls callback(error, components) when finished.
 *
 * Note: This operation may finish synchronously if no routes have an
 * asynchronous getComponents method.
 */
function getComponents(nextState, callback) {
  (0, _AsyncUtils.mapAsync)(nextState.routes, function (route, index, callback) {
    getComponentsForRoute(nextState, route, callback);
  }, callback);
}

exports.default = getComponents;
module.exports = exports['default'];
},{"./AsyncUtils":35,"./makeStateWithLocation":66}],62:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _PatternUtils = require('./PatternUtils');

/**
 * Extracts an object of params the given route cares about from
 * the given params object.
 */
function getRouteParams(route, params) {
  var routeParams = {};

  if (!route.path) return routeParams;

  (0, _PatternUtils.getParamNames)(route.path).forEach(function (p) {
    if (Object.prototype.hasOwnProperty.call(params, p)) {
      routeParams[p] = params[p];
    }
  });

  return routeParams;
}

exports.default = getRouteParams;
module.exports = exports['default'];
},{"./PatternUtils":43}],63:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _createHashHistory = require('history/lib/createHashHistory');

var _createHashHistory2 = _interopRequireDefault(_createHashHistory);

var _createRouterHistory = require('./createRouterHistory');

var _createRouterHistory2 = _interopRequireDefault(_createRouterHistory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (0, _createRouterHistory2.default)(_createHashHistory2.default);
module.exports = exports['default'];
},{"./createRouterHistory":58,"history/lib/createHashHistory":17}],64:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.createMemoryHistory = exports.hashHistory = exports.browserHistory = exports.applyRouterMiddleware = exports.formatPattern = exports.useRouterHistory = exports.match = exports.routerShape = exports.locationShape = exports.PropTypes = exports.RoutingContext = exports.RouterContext = exports.createRoutes = exports.useRoutes = exports.RouteContext = exports.Lifecycle = exports.History = exports.Route = exports.Redirect = exports.IndexRoute = exports.IndexRedirect = exports.withRouter = exports.IndexLink = exports.Link = exports.Router = undefined;

var _RouteUtils = require('./RouteUtils');

Object.defineProperty(exports, 'createRoutes', {
  enumerable: true,
  get: function get() {
    return _RouteUtils.createRoutes;
  }
});

var _PropTypes2 = require('./PropTypes');

Object.defineProperty(exports, 'locationShape', {
  enumerable: true,
  get: function get() {
    return _PropTypes2.locationShape;
  }
});
Object.defineProperty(exports, 'routerShape', {
  enumerable: true,
  get: function get() {
    return _PropTypes2.routerShape;
  }
});

var _PatternUtils = require('./PatternUtils');

Object.defineProperty(exports, 'formatPattern', {
  enumerable: true,
  get: function get() {
    return _PatternUtils.formatPattern;
  }
});

var _Router2 = require('./Router');

var _Router3 = _interopRequireDefault(_Router2);

var _Link2 = require('./Link');

var _Link3 = _interopRequireDefault(_Link2);

var _IndexLink2 = require('./IndexLink');

var _IndexLink3 = _interopRequireDefault(_IndexLink2);

var _withRouter2 = require('./withRouter');

var _withRouter3 = _interopRequireDefault(_withRouter2);

var _IndexRedirect2 = require('./IndexRedirect');

var _IndexRedirect3 = _interopRequireDefault(_IndexRedirect2);

var _IndexRoute2 = require('./IndexRoute');

var _IndexRoute3 = _interopRequireDefault(_IndexRoute2);

var _Redirect2 = require('./Redirect');

var _Redirect3 = _interopRequireDefault(_Redirect2);

var _Route2 = require('./Route');

var _Route3 = _interopRequireDefault(_Route2);

var _History2 = require('./History');

var _History3 = _interopRequireDefault(_History2);

var _Lifecycle2 = require('./Lifecycle');

var _Lifecycle3 = _interopRequireDefault(_Lifecycle2);

var _RouteContext2 = require('./RouteContext');

var _RouteContext3 = _interopRequireDefault(_RouteContext2);

var _useRoutes2 = require('./useRoutes');

var _useRoutes3 = _interopRequireDefault(_useRoutes2);

var _RouterContext2 = require('./RouterContext');

var _RouterContext3 = _interopRequireDefault(_RouterContext2);

var _RoutingContext2 = require('./RoutingContext');

var _RoutingContext3 = _interopRequireDefault(_RoutingContext2);

var _PropTypes3 = _interopRequireDefault(_PropTypes2);

var _match2 = require('./match');

var _match3 = _interopRequireDefault(_match2);

var _useRouterHistory2 = require('./useRouterHistory');

var _useRouterHistory3 = _interopRequireDefault(_useRouterHistory2);

var _applyRouterMiddleware2 = require('./applyRouterMiddleware');

var _applyRouterMiddleware3 = _interopRequireDefault(_applyRouterMiddleware2);

var _browserHistory2 = require('./browserHistory');

var _browserHistory3 = _interopRequireDefault(_browserHistory2);

var _hashHistory2 = require('./hashHistory');

var _hashHistory3 = _interopRequireDefault(_hashHistory2);

var _createMemoryHistory2 = require('./createMemoryHistory');

var _createMemoryHistory3 = _interopRequireDefault(_createMemoryHistory2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.Router = _Router3.default; /* components */

exports.Link = _Link3.default;
exports.IndexLink = _IndexLink3.default;
exports.withRouter = _withRouter3.default;

/* components (configuration) */

exports.IndexRedirect = _IndexRedirect3.default;
exports.IndexRoute = _IndexRoute3.default;
exports.Redirect = _Redirect3.default;
exports.Route = _Route3.default;

/* mixins */

exports.History = _History3.default;
exports.Lifecycle = _Lifecycle3.default;
exports.RouteContext = _RouteContext3.default;

/* utils */

exports.useRoutes = _useRoutes3.default;
exports.RouterContext = _RouterContext3.default;
exports.RoutingContext = _RoutingContext3.default;
exports.PropTypes = _PropTypes3.default;
exports.match = _match3.default;
exports.useRouterHistory = _useRouterHistory3.default;
exports.applyRouterMiddleware = _applyRouterMiddleware3.default;

/* histories */

exports.browserHistory = _browserHistory3.default;
exports.hashHistory = _hashHistory3.default;
exports.createMemoryHistory = _createMemoryHistory3.default;
},{"./History":36,"./IndexLink":37,"./IndexRedirect":38,"./IndexRoute":39,"./Lifecycle":41,"./Link":42,"./PatternUtils":43,"./PropTypes":44,"./Redirect":45,"./Route":46,"./RouteContext":47,"./RouteUtils":48,"./Router":49,"./RouterContext":50,"./RoutingContext":52,"./applyRouterMiddleware":54,"./browserHistory":55,"./createMemoryHistory":57,"./hashHistory":63,"./match":67,"./useRouterHistory":70,"./useRoutes":71,"./withRouter":72}],65:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.default = isActive;

var _PatternUtils = require('./PatternUtils');

function deepEqual(a, b) {
  if (a == b) return true;

  if (a == null || b == null) return false;

  if (Array.isArray(a)) {
    return Array.isArray(b) && a.length === b.length && a.every(function (item, index) {
      return deepEqual(item, b[index]);
    });
  }

  if ((typeof a === 'undefined' ? 'undefined' : _typeof(a)) === 'object') {
    for (var p in a) {
      if (!Object.prototype.hasOwnProperty.call(a, p)) {
        continue;
      }

      if (a[p] === undefined) {
        if (b[p] !== undefined) {
          return false;
        }
      } else if (!Object.prototype.hasOwnProperty.call(b, p)) {
        return false;
      } else if (!deepEqual(a[p], b[p])) {
        return false;
      }
    }

    return true;
  }

  return String(a) === String(b);
}

/**
 * Returns true if the current pathname matches the supplied one, net of
 * leading and trailing slash normalization. This is sufficient for an
 * indexOnly route match.
 */
function pathIsActive(pathname, currentPathname) {
  // Normalize leading slash for consistency. Leading slash on pathname has
  // already been normalized in isActive. See caveat there.
  if (currentPathname.charAt(0) !== '/') {
    currentPathname = '/' + currentPathname;
  }

  // Normalize the end of both path names too. Maybe `/foo/` shouldn't show
  // `/foo` as active, but in this case, we would already have failed the
  // match.
  if (pathname.charAt(pathname.length - 1) !== '/') {
    pathname += '/';
  }
  if (currentPathname.charAt(currentPathname.length - 1) !== '/') {
    currentPathname += '/';
  }

  return currentPathname === pathname;
}

/**
 * Returns true if the given pathname matches the active routes and params.
 */
function routeIsActive(pathname, routes, params) {
  var remainingPathname = pathname,
      paramNames = [],
      paramValues = [];

  // for...of would work here but it's probably slower post-transpilation.
  for (var i = 0, len = routes.length; i < len; ++i) {
    var route = routes[i];
    var pattern = route.path || '';

    if (pattern.charAt(0) === '/') {
      remainingPathname = pathname;
      paramNames = [];
      paramValues = [];
    }

    if (remainingPathname !== null && pattern) {
      var matched = (0, _PatternUtils.matchPattern)(pattern, remainingPathname);
      if (matched) {
        remainingPathname = matched.remainingPathname;
        paramNames = [].concat(paramNames, matched.paramNames);
        paramValues = [].concat(paramValues, matched.paramValues);
      } else {
        remainingPathname = null;
      }

      if (remainingPathname === '') {
        // We have an exact match on the route. Just check that all the params
        // match.
        // FIXME: This doesn't work on repeated params.
        return paramNames.every(function (paramName, index) {
          return String(paramValues[index]) === String(params[paramName]);
        });
      }
    }
  }

  return false;
}

/**
 * Returns true if all key/value pairs in the given query are
 * currently active.
 */
function queryIsActive(query, activeQuery) {
  if (activeQuery == null) return query == null;

  if (query == null) return true;

  return deepEqual(query, activeQuery);
}

/**
 * Returns true if a <Link> to the given pathname/query combination is
 * currently active.
 */
function isActive(_ref, indexOnly, currentLocation, routes, params) {
  var pathname = _ref.pathname;
  var query = _ref.query;

  if (currentLocation == null) return false;

  // TODO: This is a bit ugly. It keeps around support for treating pathnames
  // without preceding slashes as absolute paths, but possibly also works
  // around the same quirks with basenames as in matchRoutes.
  if (pathname.charAt(0) !== '/') {
    pathname = '/' + pathname;
  }

  if (!pathIsActive(pathname, currentLocation.pathname)) {
    // The path check is necessary and sufficient for indexOnly, but otherwise
    // we still need to check the routes.
    if (indexOnly || !routeIsActive(pathname, routes, params)) {
      return false;
    }
  }

  return queryIsActive(query, currentLocation.query);
}
module.exports = exports['default'];
},{"./PatternUtils":43}],66:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = makeStateWithLocation;

var _deprecateObjectProperties = require('./deprecateObjectProperties');

var _routerWarning = require('./routerWarning');

var _routerWarning2 = _interopRequireDefault(_routerWarning);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function makeStateWithLocation(state, location) {
  if (process.env.NODE_ENV !== 'production' && _deprecateObjectProperties.canUseMembrane) {
    var stateWithLocation = _extends({}, state);

    // I don't use deprecateObjectProperties here because I want to keep the
    // same code path between development and production, in that we just
    // assign extra properties to the copy of the state object in both cases.

    var _loop = function _loop(prop) {
      if (!Object.prototype.hasOwnProperty.call(location, prop)) {
        return 'continue';
      }

      Object.defineProperty(stateWithLocation, prop, {
        get: function get() {
          process.env.NODE_ENV !== 'production' ? (0, _routerWarning2.default)(false, 'Accessing location properties directly from the first argument to `getComponent`, `getComponents`, `getChildRoutes`, and `getIndexRoute` is deprecated. That argument is now the router state (`nextState` or `partialNextState`) rather than the location. To access the location, use `nextState.location` or `partialNextState.location`.') : void 0;
          return location[prop];
        }
      });
    };

    for (var prop in location) {
      var _ret = _loop(prop);

      if (_ret === 'continue') continue;
    }

    return stateWithLocation;
  }

  return _extends({}, state, location);
}
module.exports = exports['default'];
}).call(this,require('_process'))
},{"./deprecateObjectProperties":60,"./routerWarning":69,"_process":29}],67:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _Actions = require('history/lib/Actions');

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _createMemoryHistory = require('./createMemoryHistory');

var _createMemoryHistory2 = _interopRequireDefault(_createMemoryHistory);

var _createTransitionManager = require('./createTransitionManager');

var _createTransitionManager2 = _interopRequireDefault(_createTransitionManager);

var _RouteUtils = require('./RouteUtils');

var _RouterUtils = require('./RouterUtils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

/**
 * A high-level API to be used for server-side rendering.
 *
 * This function matches a location to a set of routes and calls
 * callback(error, redirectLocation, renderProps) when finished.
 *
 * Note: You probably don't want to use this in a browser unless you're using
 * server-side rendering with async routes.
 */
function match(_ref, callback) {
  var history = _ref.history;
  var routes = _ref.routes;
  var location = _ref.location;

  var options = _objectWithoutProperties(_ref, ['history', 'routes', 'location']);

  !(history || location) ? process.env.NODE_ENV !== 'production' ? (0, _invariant2.default)(false, 'match needs a history or a location') : (0, _invariant2.default)(false) : void 0;

  history = history ? history : (0, _createMemoryHistory2.default)(options);
  var transitionManager = (0, _createTransitionManager2.default)(history, (0, _RouteUtils.createRoutes)(routes));

  var unlisten = void 0;

  if (location) {
    // Allow match({ location: '/the/path', ... })
    location = history.createLocation(location);
  } else {
    // Pick up the location from the history via synchronous history.listen
    // call if needed.
    unlisten = history.listen(function (historyLocation) {
      location = historyLocation;
    });
  }

  var router = (0, _RouterUtils.createRouterObject)(history, transitionManager);
  history = (0, _RouterUtils.createRoutingHistory)(history, transitionManager);

  transitionManager.match(location, function (error, redirectLocation, nextState) {
    callback(error, redirectLocation && router.createLocation(redirectLocation, _Actions.REPLACE), nextState && _extends({}, nextState, {
      history: history,
      router: router,
      matchContext: { history: history, transitionManager: transitionManager, router: router }
    }));

    // Defer removing the listener to here to prevent DOM histories from having
    // to unwind DOM event listeners unnecessarily, in case callback renders a
    // <Router> and attaches another history listener.
    if (unlisten) {
      unlisten();
    }
  });
}

exports.default = match;
module.exports = exports['default'];
}).call(this,require('_process'))
},{"./RouteUtils":48,"./RouterUtils":51,"./createMemoryHistory":57,"./createTransitionManager":59,"_process":29,"history/lib/Actions":9,"invariant":27}],68:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.default = matchRoutes;

var _AsyncUtils = require('./AsyncUtils');

var _makeStateWithLocation = require('./makeStateWithLocation');

var _makeStateWithLocation2 = _interopRequireDefault(_makeStateWithLocation);

var _PatternUtils = require('./PatternUtils');

var _routerWarning = require('./routerWarning');

var _routerWarning2 = _interopRequireDefault(_routerWarning);

var _RouteUtils = require('./RouteUtils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getChildRoutes(route, location, paramNames, paramValues, callback) {
  if (route.childRoutes) {
    return [null, route.childRoutes];
  }
  if (!route.getChildRoutes) {
    return [];
  }

  var sync = true,
      result = void 0;

  var partialNextState = {
    location: location,
    params: createParams(paramNames, paramValues)
  };

  var partialNextStateWithLocation = (0, _makeStateWithLocation2.default)(partialNextState, location);

  route.getChildRoutes(partialNextStateWithLocation, function (error, childRoutes) {
    childRoutes = !error && (0, _RouteUtils.createRoutes)(childRoutes);
    if (sync) {
      result = [error, childRoutes];
      return;
    }

    callback(error, childRoutes);
  });

  sync = false;
  return result; // Might be undefined.
}

function getIndexRoute(route, location, paramNames, paramValues, callback) {
  if (route.indexRoute) {
    callback(null, route.indexRoute);
  } else if (route.getIndexRoute) {
    var partialNextState = {
      location: location,
      params: createParams(paramNames, paramValues)
    };

    var partialNextStateWithLocation = (0, _makeStateWithLocation2.default)(partialNextState, location);

    route.getIndexRoute(partialNextStateWithLocation, function (error, indexRoute) {
      callback(error, !error && (0, _RouteUtils.createRoutes)(indexRoute)[0]);
    });
  } else if (route.childRoutes) {
    (function () {
      var pathless = route.childRoutes.filter(function (childRoute) {
        return !childRoute.path;
      });

      (0, _AsyncUtils.loopAsync)(pathless.length, function (index, next, done) {
        getIndexRoute(pathless[index], location, paramNames, paramValues, function (error, indexRoute) {
          if (error || indexRoute) {
            var routes = [pathless[index]].concat(Array.isArray(indexRoute) ? indexRoute : [indexRoute]);
            done(error, routes);
          } else {
            next();
          }
        });
      }, function (err, routes) {
        callback(null, routes);
      });
    })();
  } else {
    callback();
  }
}

function assignParams(params, paramNames, paramValues) {
  return paramNames.reduce(function (params, paramName, index) {
    var paramValue = paramValues && paramValues[index];

    if (Array.isArray(params[paramName])) {
      params[paramName].push(paramValue);
    } else if (paramName in params) {
      params[paramName] = [params[paramName], paramValue];
    } else {
      params[paramName] = paramValue;
    }

    return params;
  }, params);
}

function createParams(paramNames, paramValues) {
  return assignParams({}, paramNames, paramValues);
}

function matchRouteDeep(route, location, remainingPathname, paramNames, paramValues, callback) {
  var pattern = route.path || '';

  if (pattern.charAt(0) === '/') {
    remainingPathname = location.pathname;
    paramNames = [];
    paramValues = [];
  }

  // Only try to match the path if the route actually has a pattern, and if
  // we're not just searching for potential nested absolute paths.
  if (remainingPathname !== null && pattern) {
    try {
      var matched = (0, _PatternUtils.matchPattern)(pattern, remainingPathname);
      if (matched) {
        remainingPathname = matched.remainingPathname;
        paramNames = [].concat(paramNames, matched.paramNames);
        paramValues = [].concat(paramValues, matched.paramValues);
      } else {
        remainingPathname = null;
      }
    } catch (error) {
      callback(error);
    }

    // By assumption, pattern is non-empty here, which is the prerequisite for
    // actually terminating a match.
    if (remainingPathname === '') {
      var _ret2 = function () {
        var match = {
          routes: [route],
          params: createParams(paramNames, paramValues)
        };

        getIndexRoute(route, location, paramNames, paramValues, function (error, indexRoute) {
          if (error) {
            callback(error);
          } else {
            if (Array.isArray(indexRoute)) {
              var _match$routes;

              process.env.NODE_ENV !== 'production' ? (0, _routerWarning2.default)(indexRoute.every(function (route) {
                return !route.path;
              }), 'Index routes should not have paths') : void 0;
              (_match$routes = match.routes).push.apply(_match$routes, indexRoute);
            } else if (indexRoute) {
              process.env.NODE_ENV !== 'production' ? (0, _routerWarning2.default)(!indexRoute.path, 'Index routes should not have paths') : void 0;
              match.routes.push(indexRoute);
            }

            callback(null, match);
          }
        });

        return {
          v: void 0
        };
      }();

      if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
    }
  }

  if (remainingPathname != null || route.childRoutes) {
    // Either a) this route matched at least some of the path or b)
    // we don't have to load this route's children asynchronously. In
    // either case continue checking for matches in the subtree.
    var onChildRoutes = function onChildRoutes(error, childRoutes) {
      if (error) {
        callback(error);
      } else if (childRoutes) {
        // Check the child routes to see if any of them match.
        matchRoutes(childRoutes, location, function (error, match) {
          if (error) {
            callback(error);
          } else if (match) {
            // A child route matched! Augment the match and pass it up the stack.
            match.routes.unshift(route);
            callback(null, match);
          } else {
            callback();
          }
        }, remainingPathname, paramNames, paramValues);
      } else {
        callback();
      }
    };

    var result = getChildRoutes(route, location, paramNames, paramValues, onChildRoutes);
    if (result) {
      onChildRoutes.apply(undefined, result);
    }
  } else {
    callback();
  }
}

/**
 * Asynchronously matches the given location to a set of routes and calls
 * callback(error, state) when finished. The state object will have the
 * following properties:
 *
 * - routes       An array of routes that matched, in hierarchical order
 * - params       An object of URL parameters
 *
 * Note: This operation may finish synchronously if no routes have an
 * asynchronous getChildRoutes method.
 */
function matchRoutes(routes, location, callback, remainingPathname) {
  var paramNames = arguments.length <= 4 || arguments[4] === undefined ? [] : arguments[4];
  var paramValues = arguments.length <= 5 || arguments[5] === undefined ? [] : arguments[5];

  if (remainingPathname === undefined) {
    // TODO: This is a little bit ugly, but it works around a quirk in history
    // that strips the leading slash from pathnames when using basenames with
    // trailing slashes.
    if (location.pathname.charAt(0) !== '/') {
      location = _extends({}, location, {
        pathname: '/' + location.pathname
      });
    }
    remainingPathname = location.pathname;
  }

  (0, _AsyncUtils.loopAsync)(routes.length, function (index, next, done) {
    matchRouteDeep(routes[index], location, remainingPathname, paramNames, paramValues, function (error, match) {
      if (error || match) {
        done(error, match);
      } else {
        next();
      }
    });
  }, callback);
}
module.exports = exports['default'];
}).call(this,require('_process'))
},{"./AsyncUtils":35,"./PatternUtils":43,"./RouteUtils":48,"./makeStateWithLocation":66,"./routerWarning":69,"_process":29}],69:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.default = routerWarning;
exports._resetWarned = _resetWarned;

var _warning = require('warning');

var _warning2 = _interopRequireDefault(_warning);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var warned = {};

function routerWarning(falseToWarn, message) {
  // Only issue deprecation warnings once.
  if (message.indexOf('deprecated') !== -1) {
    if (warned[message]) {
      return;
    }

    warned[message] = true;
  }

  message = '[react-router] ' + message;

  for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  _warning2.default.apply(undefined, [falseToWarn, message].concat(args));
}

function _resetWarned() {
  warned = {};
}
},{"warning":99}],70:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.default = useRouterHistory;

var _useQueries = require('history/lib/useQueries');

var _useQueries2 = _interopRequireDefault(_useQueries);

var _useBasename = require('history/lib/useBasename');

var _useBasename2 = _interopRequireDefault(_useBasename);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function useRouterHistory(createHistory) {
  return function (options) {
    var history = (0, _useQueries2.default)((0, _useBasename2.default)(createHistory))(options);
    history.__v2_compatible__ = true;
    return history;
  };
}
module.exports = exports['default'];
},{"history/lib/useBasename":23,"history/lib/useQueries":24}],71:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _useQueries = require('history/lib/useQueries');

var _useQueries2 = _interopRequireDefault(_useQueries);

var _createTransitionManager = require('./createTransitionManager');

var _createTransitionManager2 = _interopRequireDefault(_createTransitionManager);

var _routerWarning = require('./routerWarning');

var _routerWarning2 = _interopRequireDefault(_routerWarning);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

/**
 * Returns a new createHistory function that may be used to create
 * history objects that know about routing.
 *
 * Enhances history objects with the following methods:
 *
 * - listen((error, nextState) => {})
 * - listenBeforeLeavingRoute(route, (nextLocation) => {})
 * - match(location, (error, redirectLocation, nextState) => {})
 * - isActive(pathname, query, indexOnly=false)
 */
function useRoutes(createHistory) {
  process.env.NODE_ENV !== 'production' ? (0, _routerWarning2.default)(false, '`useRoutes` is deprecated. Please use `createTransitionManager` instead.') : void 0;

  return function () {
    var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var routes = _ref.routes;

    var options = _objectWithoutProperties(_ref, ['routes']);

    var history = (0, _useQueries2.default)(createHistory)(options);
    var transitionManager = (0, _createTransitionManager2.default)(history, routes);
    return _extends({}, history, transitionManager);
  };
}

exports.default = useRoutes;
module.exports = exports['default'];
}).call(this,require('_process'))
},{"./createTransitionManager":59,"./routerWarning":69,"_process":29,"history/lib/useQueries":24}],72:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = withRouter;

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _hoistNonReactStatics = require('hoist-non-react-statics');

var _hoistNonReactStatics2 = _interopRequireDefault(_hoistNonReactStatics);

var _PropTypes = require('./PropTypes');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

function withRouter(WrappedComponent, options) {
  var withRef = options && options.withRef;

  var WithRouter = _react2.default.createClass({
    displayName: 'WithRouter',

    contextTypes: { router: _PropTypes.routerShape },
    propTypes: { router: _PropTypes.routerShape },

    getWrappedInstance: function getWrappedInstance() {
      !withRef ? process.env.NODE_ENV !== 'production' ? (0, _invariant2.default)(false, 'To access the wrapped instance, you need to specify ' + '`{ withRef: true }` as the second argument of the withRouter() call.') : (0, _invariant2.default)(false) : void 0;

      return this.wrappedInstance;
    },
    render: function render() {
      var _this = this;

      var router = this.props.router || this.context.router;
      var props = _extends({}, this.props, { router: router });

      if (withRef) {
        props.ref = function (c) {
          _this.wrappedInstance = c;
        };
      }

      return _react2.default.createElement(WrappedComponent, props);
    }
  });

  WithRouter.displayName = 'withRouter(' + getDisplayName(WrappedComponent) + ')';
  WithRouter.WrappedComponent = WrappedComponent;

  return (0, _hoistNonReactStatics2.default)(WithRouter, WrappedComponent);
}
module.exports = exports['default'];
}).call(this,require('_process'))
},{"./PropTypes":44,"_process":29,"hoist-non-react-statics":26,"invariant":27,"react":97}],73:[function(require,module,exports){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

/**
 * Escape and wrap key so it is safe to use as a reactid
 *
 * @param {string} key to be escaped.
 * @return {string} the escaped key.
 */

function escape(key) {
  var escapeRegex = /[=:]/g;
  var escaperLookup = {
    '=': '=0',
    ':': '=2'
  };
  var escapedString = ('' + key).replace(escapeRegex, function (match) {
    return escaperLookup[match];
  });

  return '$' + escapedString;
}

/**
 * Unescape and unwrap key for human-readable display
 *
 * @param {string} key to unescape.
 * @return {string} the unescaped key.
 */
function unescape(key) {
  var unescapeRegex = /(=0|=2)/g;
  var unescaperLookup = {
    '=0': '=',
    '=2': ':'
  };
  var keySubstring = key[0] === '.' && key[1] === '$' ? key.substring(2) : key.substring(1);

  return ('' + keySubstring).replace(unescapeRegex, function (match) {
    return unescaperLookup[match];
  });
}

var KeyEscapeUtils = {
  escape: escape,
  unescape: unescape
};

module.exports = KeyEscapeUtils;
},{}],74:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

var _prodInvariant = require('./reactProdInvariant');

var invariant = require('fbjs/lib/invariant');

/**
 * Static poolers. Several custom versions for each potential number of
 * arguments. A completely generic pooler is easy to implement, but would
 * require accessing the `arguments` object. In each of these, `this` refers to
 * the Class itself, not an instance. If any others are needed, simply add them
 * here, or in their own files.
 */
var oneArgumentPooler = function (copyFieldsFrom) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, copyFieldsFrom);
    return instance;
  } else {
    return new Klass(copyFieldsFrom);
  }
};

var twoArgumentPooler = function (a1, a2) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2);
    return instance;
  } else {
    return new Klass(a1, a2);
  }
};

var threeArgumentPooler = function (a1, a2, a3) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2, a3);
    return instance;
  } else {
    return new Klass(a1, a2, a3);
  }
};

var fourArgumentPooler = function (a1, a2, a3, a4) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2, a3, a4);
    return instance;
  } else {
    return new Klass(a1, a2, a3, a4);
  }
};

var standardReleaser = function (instance) {
  var Klass = this;
  !(instance instanceof Klass) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Trying to release an instance into a pool of a different type.') : _prodInvariant('25') : void 0;
  instance.destructor();
  if (Klass.instancePool.length < Klass.poolSize) {
    Klass.instancePool.push(instance);
  }
};

var DEFAULT_POOL_SIZE = 10;
var DEFAULT_POOLER = oneArgumentPooler;

/**
 * Augments `CopyConstructor` to be a poolable class, augmenting only the class
 * itself (statically) not adding any prototypical fields. Any CopyConstructor
 * you give this may have a `poolSize` property, and will look for a
 * prototypical `destructor` on instances.
 *
 * @param {Function} CopyConstructor Constructor that can be used to reset.
 * @param {Function} pooler Customizable pooler.
 */
var addPoolingTo = function (CopyConstructor, pooler) {
  // Casting as any so that flow ignores the actual implementation and trusts
  // it to match the type we declared
  var NewKlass = CopyConstructor;
  NewKlass.instancePool = [];
  NewKlass.getPooled = pooler || DEFAULT_POOLER;
  if (!NewKlass.poolSize) {
    NewKlass.poolSize = DEFAULT_POOL_SIZE;
  }
  NewKlass.release = standardReleaser;
  return NewKlass;
};

var PooledClass = {
  addPoolingTo: addPoolingTo,
  oneArgumentPooler: oneArgumentPooler,
  twoArgumentPooler: twoArgumentPooler,
  threeArgumentPooler: threeArgumentPooler,
  fourArgumentPooler: fourArgumentPooler
};

module.exports = PooledClass;
}).call(this,require('_process'))
},{"./reactProdInvariant":95,"_process":29,"fbjs/lib/invariant":7}],75:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var _assign = require('object-assign');

var ReactBaseClasses = require('./ReactBaseClasses');
var ReactChildren = require('./ReactChildren');
var ReactDOMFactories = require('./ReactDOMFactories');
var ReactElement = require('./ReactElement');
var ReactPropTypes = require('./ReactPropTypes');
var ReactVersion = require('./ReactVersion');

var createReactClass = require('./createClass');
var onlyChild = require('./onlyChild');

var createElement = ReactElement.createElement;
var createFactory = ReactElement.createFactory;
var cloneElement = ReactElement.cloneElement;

if (process.env.NODE_ENV !== 'production') {
  var lowPriorityWarning = require('./lowPriorityWarning');
  var canDefineProperty = require('./canDefineProperty');
  var ReactElementValidator = require('./ReactElementValidator');
  var didWarnPropTypesDeprecated = false;
  createElement = ReactElementValidator.createElement;
  createFactory = ReactElementValidator.createFactory;
  cloneElement = ReactElementValidator.cloneElement;
}

var __spread = _assign;
var createMixin = function (mixin) {
  return mixin;
};

if (process.env.NODE_ENV !== 'production') {
  var warnedForSpread = false;
  var warnedForCreateMixin = false;
  __spread = function () {
    lowPriorityWarning(warnedForSpread, 'React.__spread is deprecated and should not be used. Use ' + 'Object.assign directly or another helper function with similar ' + 'semantics. You may be seeing this warning due to your compiler. ' + 'See https://fb.me/react-spread-deprecation for more details.');
    warnedForSpread = true;
    return _assign.apply(null, arguments);
  };

  createMixin = function (mixin) {
    lowPriorityWarning(warnedForCreateMixin, 'React.createMixin is deprecated and should not be used. ' + 'In React v16.0, it will be removed. ' + 'You can use this mixin directly instead. ' + 'See https://fb.me/createmixin-was-never-implemented for more info.');
    warnedForCreateMixin = true;
    return mixin;
  };
}

var React = {
  // Modern

  Children: {
    map: ReactChildren.map,
    forEach: ReactChildren.forEach,
    count: ReactChildren.count,
    toArray: ReactChildren.toArray,
    only: onlyChild
  },

  Component: ReactBaseClasses.Component,
  PureComponent: ReactBaseClasses.PureComponent,

  createElement: createElement,
  cloneElement: cloneElement,
  isValidElement: ReactElement.isValidElement,

  // Classic

  PropTypes: ReactPropTypes,
  createClass: createReactClass,
  createFactory: createFactory,
  createMixin: createMixin,

  // This looks DOM specific but these are actually isomorphic helpers
  // since they are just generating DOM strings.
  DOM: ReactDOMFactories,

  version: ReactVersion,

  // Deprecated hook for JSX spread, don't use this for anything.
  __spread: __spread
};

if (process.env.NODE_ENV !== 'production') {
  var warnedForCreateClass = false;
  if (canDefineProperty) {
    Object.defineProperty(React, 'PropTypes', {
      get: function () {
        lowPriorityWarning(didWarnPropTypesDeprecated, 'Accessing PropTypes via the main React package is deprecated,' + ' and will be removed in  React v16.0.' + ' Use the latest available v15.* prop-types package from npm instead.' + ' For info on usage, compatibility, migration and more, see ' + 'https://fb.me/prop-types-docs');
        didWarnPropTypesDeprecated = true;
        return ReactPropTypes;
      }
    });

    Object.defineProperty(React, 'createClass', {
      get: function () {
        lowPriorityWarning(warnedForCreateClass, 'Accessing createClass via the main React package is deprecated,' + ' and will be removed in React v16.0.' + " Use a plain JavaScript class instead. If you're not yet " + 'ready to migrate, create-react-class v15.* is available ' + 'on npm as a temporary, drop-in replacement. ' + 'For more info see https://fb.me/react-create-class');
        warnedForCreateClass = true;
        return createReactClass;
      }
    });
  }

  // React.DOM factories are deprecated. Wrap these methods so that
  // invocations of the React.DOM namespace and alert users to switch
  // to the `react-dom-factories` package.
  React.DOM = {};
  var warnedForFactories = false;
  Object.keys(ReactDOMFactories).forEach(function (factory) {
    React.DOM[factory] = function () {
      if (!warnedForFactories) {
        lowPriorityWarning(false, 'Accessing factories like React.DOM.%s has been deprecated ' + 'and will be removed in v16.0+. Use the ' + 'react-dom-factories package instead. ' + ' Version 1.0 provides a drop-in replacement.' + ' For more info, see https://fb.me/react-dom-factories', factory);
        warnedForFactories = true;
      }
      return ReactDOMFactories[factory].apply(ReactDOMFactories, arguments);
    };
  });
}

module.exports = React;
}).call(this,require('_process'))
},{"./ReactBaseClasses":76,"./ReactChildren":77,"./ReactDOMFactories":80,"./ReactElement":81,"./ReactElementValidator":83,"./ReactPropTypes":86,"./ReactVersion":88,"./canDefineProperty":89,"./createClass":91,"./lowPriorityWarning":93,"./onlyChild":94,"_process":29,"object-assign":28}],76:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var _prodInvariant = require('./reactProdInvariant'),
    _assign = require('object-assign');

var ReactNoopUpdateQueue = require('./ReactNoopUpdateQueue');

var canDefineProperty = require('./canDefineProperty');
var emptyObject = require('fbjs/lib/emptyObject');
var invariant = require('fbjs/lib/invariant');
var lowPriorityWarning = require('./lowPriorityWarning');

/**
 * Base class helpers for the updating state of a component.
 */
function ReactComponent(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  // We initialize the default updater but the real one gets injected by the
  // renderer.
  this.updater = updater || ReactNoopUpdateQueue;
}

ReactComponent.prototype.isReactComponent = {};

/**
 * Sets a subset of the state. Always use this to mutate
 * state. You should treat `this.state` as immutable.
 *
 * There is no guarantee that `this.state` will be immediately updated, so
 * accessing `this.state` after calling this method may return the old value.
 *
 * There is no guarantee that calls to `setState` will run synchronously,
 * as they may eventually be batched together.  You can provide an optional
 * callback that will be executed when the call to setState is actually
 * completed.
 *
 * When a function is provided to setState, it will be called at some point in
 * the future (not synchronously). It will be called with the up to date
 * component arguments (state, props, context). These values can be different
 * from this.* because your function may be called after receiveProps but before
 * shouldComponentUpdate, and this new state, props, and context will not yet be
 * assigned to this.
 *
 * @param {object|function} partialState Next partial state or function to
 *        produce next partial state to be merged with current state.
 * @param {?function} callback Called after state is updated.
 * @final
 * @protected
 */
ReactComponent.prototype.setState = function (partialState, callback) {
  !(typeof partialState === 'object' || typeof partialState === 'function' || partialState == null) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'setState(...): takes an object of state variables to update or a function which returns an object of state variables.') : _prodInvariant('85') : void 0;
  this.updater.enqueueSetState(this, partialState);
  if (callback) {
    this.updater.enqueueCallback(this, callback, 'setState');
  }
};

/**
 * Forces an update. This should only be invoked when it is known with
 * certainty that we are **not** in a DOM transaction.
 *
 * You may want to call this when you know that some deeper aspect of the
 * component's state has changed but `setState` was not called.
 *
 * This will not invoke `shouldComponentUpdate`, but it will invoke
 * `componentWillUpdate` and `componentDidUpdate`.
 *
 * @param {?function} callback Called after update is complete.
 * @final
 * @protected
 */
ReactComponent.prototype.forceUpdate = function (callback) {
  this.updater.enqueueForceUpdate(this);
  if (callback) {
    this.updater.enqueueCallback(this, callback, 'forceUpdate');
  }
};

/**
 * Deprecated APIs. These APIs used to exist on classic React classes but since
 * we would like to deprecate them, we're not going to move them over to this
 * modern base class. Instead, we define a getter that warns if it's accessed.
 */
if (process.env.NODE_ENV !== 'production') {
  var deprecatedAPIs = {
    isMounted: ['isMounted', 'Instead, make sure to clean up subscriptions and pending requests in ' + 'componentWillUnmount to prevent memory leaks.'],
    replaceState: ['replaceState', 'Refactor your code to use setState instead (see ' + 'https://github.com/facebook/react/issues/3236).']
  };
  var defineDeprecationWarning = function (methodName, info) {
    if (canDefineProperty) {
      Object.defineProperty(ReactComponent.prototype, methodName, {
        get: function () {
          lowPriorityWarning(false, '%s(...) is deprecated in plain JavaScript React classes. %s', info[0], info[1]);
          return undefined;
        }
      });
    }
  };
  for (var fnName in deprecatedAPIs) {
    if (deprecatedAPIs.hasOwnProperty(fnName)) {
      defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
    }
  }
}

/**
 * Base class helpers for the updating state of a component.
 */
function ReactPureComponent(props, context, updater) {
  // Duplicated from ReactComponent.
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  // We initialize the default updater but the real one gets injected by the
  // renderer.
  this.updater = updater || ReactNoopUpdateQueue;
}

function ComponentDummy() {}
ComponentDummy.prototype = ReactComponent.prototype;
ReactPureComponent.prototype = new ComponentDummy();
ReactPureComponent.prototype.constructor = ReactPureComponent;
// Avoid an extra prototype jump for these methods.
_assign(ReactPureComponent.prototype, ReactComponent.prototype);
ReactPureComponent.prototype.isPureReactComponent = true;

module.exports = {
  Component: ReactComponent,
  PureComponent: ReactPureComponent
};
}).call(this,require('_process'))
},{"./ReactNoopUpdateQueue":84,"./canDefineProperty":89,"./lowPriorityWarning":93,"./reactProdInvariant":95,"_process":29,"fbjs/lib/emptyObject":6,"fbjs/lib/invariant":7,"object-assign":28}],77:[function(require,module,exports){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var PooledClass = require('./PooledClass');
var ReactElement = require('./ReactElement');

var emptyFunction = require('fbjs/lib/emptyFunction');
var traverseAllChildren = require('./traverseAllChildren');

var twoArgumentPooler = PooledClass.twoArgumentPooler;
var fourArgumentPooler = PooledClass.fourArgumentPooler;

var userProvidedKeyEscapeRegex = /\/+/g;
function escapeUserProvidedKey(text) {
  return ('' + text).replace(userProvidedKeyEscapeRegex, '$&/');
}

/**
 * PooledClass representing the bookkeeping associated with performing a child
 * traversal. Allows avoiding binding callbacks.
 *
 * @constructor ForEachBookKeeping
 * @param {!function} forEachFunction Function to perform traversal with.
 * @param {?*} forEachContext Context to perform context with.
 */
function ForEachBookKeeping(forEachFunction, forEachContext) {
  this.func = forEachFunction;
  this.context = forEachContext;
  this.count = 0;
}
ForEachBookKeeping.prototype.destructor = function () {
  this.func = null;
  this.context = null;
  this.count = 0;
};
PooledClass.addPoolingTo(ForEachBookKeeping, twoArgumentPooler);

function forEachSingleChild(bookKeeping, child, name) {
  var func = bookKeeping.func,
      context = bookKeeping.context;

  func.call(context, child, bookKeeping.count++);
}

/**
 * Iterates through children that are typically specified as `props.children`.
 *
 * See https://facebook.github.io/react/docs/top-level-api.html#react.children.foreach
 *
 * The provided forEachFunc(child, index) will be called for each
 * leaf child.
 *
 * @param {?*} children Children tree container.
 * @param {function(*, int)} forEachFunc
 * @param {*} forEachContext Context for forEachContext.
 */
function forEachChildren(children, forEachFunc, forEachContext) {
  if (children == null) {
    return children;
  }
  var traverseContext = ForEachBookKeeping.getPooled(forEachFunc, forEachContext);
  traverseAllChildren(children, forEachSingleChild, traverseContext);
  ForEachBookKeeping.release(traverseContext);
}

/**
 * PooledClass representing the bookkeeping associated with performing a child
 * mapping. Allows avoiding binding callbacks.
 *
 * @constructor MapBookKeeping
 * @param {!*} mapResult Object containing the ordered map of results.
 * @param {!function} mapFunction Function to perform mapping with.
 * @param {?*} mapContext Context to perform mapping with.
 */
function MapBookKeeping(mapResult, keyPrefix, mapFunction, mapContext) {
  this.result = mapResult;
  this.keyPrefix = keyPrefix;
  this.func = mapFunction;
  this.context = mapContext;
  this.count = 0;
}
MapBookKeeping.prototype.destructor = function () {
  this.result = null;
  this.keyPrefix = null;
  this.func = null;
  this.context = null;
  this.count = 0;
};
PooledClass.addPoolingTo(MapBookKeeping, fourArgumentPooler);

function mapSingleChildIntoContext(bookKeeping, child, childKey) {
  var result = bookKeeping.result,
      keyPrefix = bookKeeping.keyPrefix,
      func = bookKeeping.func,
      context = bookKeeping.context;


  var mappedChild = func.call(context, child, bookKeeping.count++);
  if (Array.isArray(mappedChild)) {
    mapIntoWithKeyPrefixInternal(mappedChild, result, childKey, emptyFunction.thatReturnsArgument);
  } else if (mappedChild != null) {
    if (ReactElement.isValidElement(mappedChild)) {
      mappedChild = ReactElement.cloneAndReplaceKey(mappedChild,
      // Keep both the (mapped) and old keys if they differ, just as
      // traverseAllChildren used to do for objects as children
      keyPrefix + (mappedChild.key && (!child || child.key !== mappedChild.key) ? escapeUserProvidedKey(mappedChild.key) + '/' : '') + childKey);
    }
    result.push(mappedChild);
  }
}

function mapIntoWithKeyPrefixInternal(children, array, prefix, func, context) {
  var escapedPrefix = '';
  if (prefix != null) {
    escapedPrefix = escapeUserProvidedKey(prefix) + '/';
  }
  var traverseContext = MapBookKeeping.getPooled(array, escapedPrefix, func, context);
  traverseAllChildren(children, mapSingleChildIntoContext, traverseContext);
  MapBookKeeping.release(traverseContext);
}

/**
 * Maps children that are typically specified as `props.children`.
 *
 * See https://facebook.github.io/react/docs/top-level-api.html#react.children.map
 *
 * The provided mapFunction(child, key, index) will be called for each
 * leaf child.
 *
 * @param {?*} children Children tree container.
 * @param {function(*, int)} func The map function.
 * @param {*} context Context for mapFunction.
 * @return {object} Object containing the ordered map of results.
 */
function mapChildren(children, func, context) {
  if (children == null) {
    return children;
  }
  var result = [];
  mapIntoWithKeyPrefixInternal(children, result, null, func, context);
  return result;
}

function forEachSingleChildDummy(traverseContext, child, name) {
  return null;
}

/**
 * Count the number of children that are typically specified as
 * `props.children`.
 *
 * See https://facebook.github.io/react/docs/top-level-api.html#react.children.count
 *
 * @param {?*} children Children tree container.
 * @return {number} The number of children.
 */
function countChildren(children, context) {
  return traverseAllChildren(children, forEachSingleChildDummy, null);
}

/**
 * Flatten a children object (typically specified as `props.children`) and
 * return an array with appropriately re-keyed children.
 *
 * See https://facebook.github.io/react/docs/top-level-api.html#react.children.toarray
 */
function toArray(children) {
  var result = [];
  mapIntoWithKeyPrefixInternal(children, result, null, emptyFunction.thatReturnsArgument);
  return result;
}

var ReactChildren = {
  forEach: forEachChildren,
  map: mapChildren,
  mapIntoWithKeyPrefixInternal: mapIntoWithKeyPrefixInternal,
  count: countChildren,
  toArray: toArray
};

module.exports = ReactChildren;
},{"./PooledClass":74,"./ReactElement":81,"./traverseAllChildren":96,"fbjs/lib/emptyFunction":5}],78:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

var _prodInvariant = require('./reactProdInvariant');

var ReactCurrentOwner = require('./ReactCurrentOwner');

var invariant = require('fbjs/lib/invariant');
var warning = require('fbjs/lib/warning');

function isNative(fn) {
  // Based on isNative() from Lodash
  var funcToString = Function.prototype.toString;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var reIsNative = RegExp('^' + funcToString
  // Take an example native function source for comparison
  .call(hasOwnProperty
  // Strip regex characters so we can use it for regex
  ).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&'
  // Remove hasOwnProperty from the template to make it generic
  ).replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$');
  try {
    var source = funcToString.call(fn);
    return reIsNative.test(source);
  } catch (err) {
    return false;
  }
}

var canUseCollections =
// Array.from
typeof Array.from === 'function' &&
// Map
typeof Map === 'function' && isNative(Map) &&
// Map.prototype.keys
Map.prototype != null && typeof Map.prototype.keys === 'function' && isNative(Map.prototype.keys) &&
// Set
typeof Set === 'function' && isNative(Set) &&
// Set.prototype.keys
Set.prototype != null && typeof Set.prototype.keys === 'function' && isNative(Set.prototype.keys);

var setItem;
var getItem;
var removeItem;
var getItemIDs;
var addRoot;
var removeRoot;
var getRootIDs;

if (canUseCollections) {
  var itemMap = new Map();
  var rootIDSet = new Set();

  setItem = function (id, item) {
    itemMap.set(id, item);
  };
  getItem = function (id) {
    return itemMap.get(id);
  };
  removeItem = function (id) {
    itemMap['delete'](id);
  };
  getItemIDs = function () {
    return Array.from(itemMap.keys());
  };

  addRoot = function (id) {
    rootIDSet.add(id);
  };
  removeRoot = function (id) {
    rootIDSet['delete'](id);
  };
  getRootIDs = function () {
    return Array.from(rootIDSet.keys());
  };
} else {
  var itemByKey = {};
  var rootByKey = {};

  // Use non-numeric keys to prevent V8 performance issues:
  // https://github.com/facebook/react/pull/7232
  var getKeyFromID = function (id) {
    return '.' + id;
  };
  var getIDFromKey = function (key) {
    return parseInt(key.substr(1), 10);
  };

  setItem = function (id, item) {
    var key = getKeyFromID(id);
    itemByKey[key] = item;
  };
  getItem = function (id) {
    var key = getKeyFromID(id);
    return itemByKey[key];
  };
  removeItem = function (id) {
    var key = getKeyFromID(id);
    delete itemByKey[key];
  };
  getItemIDs = function () {
    return Object.keys(itemByKey).map(getIDFromKey);
  };

  addRoot = function (id) {
    var key = getKeyFromID(id);
    rootByKey[key] = true;
  };
  removeRoot = function (id) {
    var key = getKeyFromID(id);
    delete rootByKey[key];
  };
  getRootIDs = function () {
    return Object.keys(rootByKey).map(getIDFromKey);
  };
}

var unmountedIDs = [];

function purgeDeep(id) {
  var item = getItem(id);
  if (item) {
    var childIDs = item.childIDs;

    removeItem(id);
    childIDs.forEach(purgeDeep);
  }
}

function describeComponentFrame(name, source, ownerName) {
  return '\n    in ' + (name || 'Unknown') + (source ? ' (at ' + source.fileName.replace(/^.*[\\\/]/, '') + ':' + source.lineNumber + ')' : ownerName ? ' (created by ' + ownerName + ')' : '');
}

function getDisplayName(element) {
  if (element == null) {
    return '#empty';
  } else if (typeof element === 'string' || typeof element === 'number') {
    return '#text';
  } else if (typeof element.type === 'string') {
    return element.type;
  } else {
    return element.type.displayName || element.type.name || 'Unknown';
  }
}

function describeID(id) {
  var name = ReactComponentTreeHook.getDisplayName(id);
  var element = ReactComponentTreeHook.getElement(id);
  var ownerID = ReactComponentTreeHook.getOwnerID(id);
  var ownerName;
  if (ownerID) {
    ownerName = ReactComponentTreeHook.getDisplayName(ownerID);
  }
  process.env.NODE_ENV !== 'production' ? warning(element, 'ReactComponentTreeHook: Missing React element for debugID %s when ' + 'building stack', id) : void 0;
  return describeComponentFrame(name, element && element._source, ownerName);
}

var ReactComponentTreeHook = {
  onSetChildren: function (id, nextChildIDs) {
    var item = getItem(id);
    !item ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Item must have been set') : _prodInvariant('144') : void 0;
    item.childIDs = nextChildIDs;

    for (var i = 0; i < nextChildIDs.length; i++) {
      var nextChildID = nextChildIDs[i];
      var nextChild = getItem(nextChildID);
      !nextChild ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Expected hook events to fire for the child before its parent includes it in onSetChildren().') : _prodInvariant('140') : void 0;
      !(nextChild.childIDs != null || typeof nextChild.element !== 'object' || nextChild.element == null) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Expected onSetChildren() to fire for a container child before its parent includes it in onSetChildren().') : _prodInvariant('141') : void 0;
      !nextChild.isMounted ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Expected onMountComponent() to fire for the child before its parent includes it in onSetChildren().') : _prodInvariant('71') : void 0;
      if (nextChild.parentID == null) {
        nextChild.parentID = id;
        // TODO: This shouldn't be necessary but mounting a new root during in
        // componentWillMount currently causes not-yet-mounted components to
        // be purged from our tree data so their parent id is missing.
      }
      !(nextChild.parentID === id) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Expected onBeforeMountComponent() parent and onSetChildren() to be consistent (%s has parents %s and %s).', nextChildID, nextChild.parentID, id) : _prodInvariant('142', nextChildID, nextChild.parentID, id) : void 0;
    }
  },
  onBeforeMountComponent: function (id, element, parentID) {
    var item = {
      element: element,
      parentID: parentID,
      text: null,
      childIDs: [],
      isMounted: false,
      updateCount: 0
    };
    setItem(id, item);
  },
  onBeforeUpdateComponent: function (id, element) {
    var item = getItem(id);
    if (!item || !item.isMounted) {
      // We may end up here as a result of setState() in componentWillUnmount().
      // In this case, ignore the element.
      return;
    }
    item.element = element;
  },
  onMountComponent: function (id) {
    var item = getItem(id);
    !item ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Item must have been set') : _prodInvariant('144') : void 0;
    item.isMounted = true;
    var isRoot = item.parentID === 0;
    if (isRoot) {
      addRoot(id);
    }
  },
  onUpdateComponent: function (id) {
    var item = getItem(id);
    if (!item || !item.isMounted) {
      // We may end up here as a result of setState() in componentWillUnmount().
      // In this case, ignore the element.
      return;
    }
    item.updateCount++;
  },
  onUnmountComponent: function (id) {
    var item = getItem(id);
    if (item) {
      // We need to check if it exists.
      // `item` might not exist if it is inside an error boundary, and a sibling
      // error boundary child threw while mounting. Then this instance never
      // got a chance to mount, but it still gets an unmounting event during
      // the error boundary cleanup.
      item.isMounted = false;
      var isRoot = item.parentID === 0;
      if (isRoot) {
        removeRoot(id);
      }
    }
    unmountedIDs.push(id);
  },
  purgeUnmountedComponents: function () {
    if (ReactComponentTreeHook._preventPurging) {
      // Should only be used for testing.
      return;
    }

    for (var i = 0; i < unmountedIDs.length; i++) {
      var id = unmountedIDs[i];
      purgeDeep(id);
    }
    unmountedIDs.length = 0;
  },
  isMounted: function (id) {
    var item = getItem(id);
    return item ? item.isMounted : false;
  },
  getCurrentStackAddendum: function (topElement) {
    var info = '';
    if (topElement) {
      var name = getDisplayName(topElement);
      var owner = topElement._owner;
      info += describeComponentFrame(name, topElement._source, owner && owner.getName());
    }

    var currentOwner = ReactCurrentOwner.current;
    var id = currentOwner && currentOwner._debugID;

    info += ReactComponentTreeHook.getStackAddendumByID(id);
    return info;
  },
  getStackAddendumByID: function (id) {
    var info = '';
    while (id) {
      info += describeID(id);
      id = ReactComponentTreeHook.getParentID(id);
    }
    return info;
  },
  getChildIDs: function (id) {
    var item = getItem(id);
    return item ? item.childIDs : [];
  },
  getDisplayName: function (id) {
    var element = ReactComponentTreeHook.getElement(id);
    if (!element) {
      return null;
    }
    return getDisplayName(element);
  },
  getElement: function (id) {
    var item = getItem(id);
    return item ? item.element : null;
  },
  getOwnerID: function (id) {
    var element = ReactComponentTreeHook.getElement(id);
    if (!element || !element._owner) {
      return null;
    }
    return element._owner._debugID;
  },
  getParentID: function (id) {
    var item = getItem(id);
    return item ? item.parentID : null;
  },
  getSource: function (id) {
    var item = getItem(id);
    var element = item ? item.element : null;
    var source = element != null ? element._source : null;
    return source;
  },
  getText: function (id) {
    var element = ReactComponentTreeHook.getElement(id);
    if (typeof element === 'string') {
      return element;
    } else if (typeof element === 'number') {
      return '' + element;
    } else {
      return null;
    }
  },
  getUpdateCount: function (id) {
    var item = getItem(id);
    return item ? item.updateCount : 0;
  },


  getRootIDs: getRootIDs,
  getRegisteredIDs: getItemIDs,

  pushNonStandardWarningStack: function (isCreatingElement, currentSource) {
    if (typeof console.reactStack !== 'function') {
      return;
    }

    var stack = [];
    var currentOwner = ReactCurrentOwner.current;
    var id = currentOwner && currentOwner._debugID;

    try {
      if (isCreatingElement) {
        stack.push({
          name: id ? ReactComponentTreeHook.getDisplayName(id) : null,
          fileName: currentSource ? currentSource.fileName : null,
          lineNumber: currentSource ? currentSource.lineNumber : null
        });
      }

      while (id) {
        var element = ReactComponentTreeHook.getElement(id);
        var parentID = ReactComponentTreeHook.getParentID(id);
        var ownerID = ReactComponentTreeHook.getOwnerID(id);
        var ownerName = ownerID ? ReactComponentTreeHook.getDisplayName(ownerID) : null;
        var source = element && element._source;
        stack.push({
          name: ownerName,
          fileName: source ? source.fileName : null,
          lineNumber: source ? source.lineNumber : null
        });
        id = parentID;
      }
    } catch (err) {
      // Internal state is messed up.
      // Stop building the stack (it's just a nice to have).
    }

    console.reactStack(stack);
  },
  popNonStandardWarningStack: function () {
    if (typeof console.reactStackEnd !== 'function') {
      return;
    }
    console.reactStackEnd();
  }
};

module.exports = ReactComponentTreeHook;
}).call(this,require('_process'))
},{"./ReactCurrentOwner":79,"./reactProdInvariant":95,"_process":29,"fbjs/lib/invariant":7,"fbjs/lib/warning":8}],79:[function(require,module,exports){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

/**
 * Keeps track of the current owner.
 *
 * The current owner is the component who should own any components that are
 * currently being constructed.
 */
var ReactCurrentOwner = {
  /**
   * @internal
   * @type {ReactComponent}
   */
  current: null
};

module.exports = ReactCurrentOwner;
},{}],80:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var ReactElement = require('./ReactElement');

/**
 * Create a factory that creates HTML tag elements.
 *
 * @private
 */
var createDOMFactory = ReactElement.createFactory;
if (process.env.NODE_ENV !== 'production') {
  var ReactElementValidator = require('./ReactElementValidator');
  createDOMFactory = ReactElementValidator.createFactory;
}

/**
 * Creates a mapping from supported HTML tags to `ReactDOMComponent` classes.
 *
 * @public
 */
var ReactDOMFactories = {
  a: createDOMFactory('a'),
  abbr: createDOMFactory('abbr'),
  address: createDOMFactory('address'),
  area: createDOMFactory('area'),
  article: createDOMFactory('article'),
  aside: createDOMFactory('aside'),
  audio: createDOMFactory('audio'),
  b: createDOMFactory('b'),
  base: createDOMFactory('base'),
  bdi: createDOMFactory('bdi'),
  bdo: createDOMFactory('bdo'),
  big: createDOMFactory('big'),
  blockquote: createDOMFactory('blockquote'),
  body: createDOMFactory('body'),
  br: createDOMFactory('br'),
  button: createDOMFactory('button'),
  canvas: createDOMFactory('canvas'),
  caption: createDOMFactory('caption'),
  cite: createDOMFactory('cite'),
  code: createDOMFactory('code'),
  col: createDOMFactory('col'),
  colgroup: createDOMFactory('colgroup'),
  data: createDOMFactory('data'),
  datalist: createDOMFactory('datalist'),
  dd: createDOMFactory('dd'),
  del: createDOMFactory('del'),
  details: createDOMFactory('details'),
  dfn: createDOMFactory('dfn'),
  dialog: createDOMFactory('dialog'),
  div: createDOMFactory('div'),
  dl: createDOMFactory('dl'),
  dt: createDOMFactory('dt'),
  em: createDOMFactory('em'),
  embed: createDOMFactory('embed'),
  fieldset: createDOMFactory('fieldset'),
  figcaption: createDOMFactory('figcaption'),
  figure: createDOMFactory('figure'),
  footer: createDOMFactory('footer'),
  form: createDOMFactory('form'),
  h1: createDOMFactory('h1'),
  h2: createDOMFactory('h2'),
  h3: createDOMFactory('h3'),
  h4: createDOMFactory('h4'),
  h5: createDOMFactory('h5'),
  h6: createDOMFactory('h6'),
  head: createDOMFactory('head'),
  header: createDOMFactory('header'),
  hgroup: createDOMFactory('hgroup'),
  hr: createDOMFactory('hr'),
  html: createDOMFactory('html'),
  i: createDOMFactory('i'),
  iframe: createDOMFactory('iframe'),
  img: createDOMFactory('img'),
  input: createDOMFactory('input'),
  ins: createDOMFactory('ins'),
  kbd: createDOMFactory('kbd'),
  keygen: createDOMFactory('keygen'),
  label: createDOMFactory('label'),
  legend: createDOMFactory('legend'),
  li: createDOMFactory('li'),
  link: createDOMFactory('link'),
  main: createDOMFactory('main'),
  map: createDOMFactory('map'),
  mark: createDOMFactory('mark'),
  menu: createDOMFactory('menu'),
  menuitem: createDOMFactory('menuitem'),
  meta: createDOMFactory('meta'),
  meter: createDOMFactory('meter'),
  nav: createDOMFactory('nav'),
  noscript: createDOMFactory('noscript'),
  object: createDOMFactory('object'),
  ol: createDOMFactory('ol'),
  optgroup: createDOMFactory('optgroup'),
  option: createDOMFactory('option'),
  output: createDOMFactory('output'),
  p: createDOMFactory('p'),
  param: createDOMFactory('param'),
  picture: createDOMFactory('picture'),
  pre: createDOMFactory('pre'),
  progress: createDOMFactory('progress'),
  q: createDOMFactory('q'),
  rp: createDOMFactory('rp'),
  rt: createDOMFactory('rt'),
  ruby: createDOMFactory('ruby'),
  s: createDOMFactory('s'),
  samp: createDOMFactory('samp'),
  script: createDOMFactory('script'),
  section: createDOMFactory('section'),
  select: createDOMFactory('select'),
  small: createDOMFactory('small'),
  source: createDOMFactory('source'),
  span: createDOMFactory('span'),
  strong: createDOMFactory('strong'),
  style: createDOMFactory('style'),
  sub: createDOMFactory('sub'),
  summary: createDOMFactory('summary'),
  sup: createDOMFactory('sup'),
  table: createDOMFactory('table'),
  tbody: createDOMFactory('tbody'),
  td: createDOMFactory('td'),
  textarea: createDOMFactory('textarea'),
  tfoot: createDOMFactory('tfoot'),
  th: createDOMFactory('th'),
  thead: createDOMFactory('thead'),
  time: createDOMFactory('time'),
  title: createDOMFactory('title'),
  tr: createDOMFactory('tr'),
  track: createDOMFactory('track'),
  u: createDOMFactory('u'),
  ul: createDOMFactory('ul'),
  'var': createDOMFactory('var'),
  video: createDOMFactory('video'),
  wbr: createDOMFactory('wbr'),

  // SVG
  circle: createDOMFactory('circle'),
  clipPath: createDOMFactory('clipPath'),
  defs: createDOMFactory('defs'),
  ellipse: createDOMFactory('ellipse'),
  g: createDOMFactory('g'),
  image: createDOMFactory('image'),
  line: createDOMFactory('line'),
  linearGradient: createDOMFactory('linearGradient'),
  mask: createDOMFactory('mask'),
  path: createDOMFactory('path'),
  pattern: createDOMFactory('pattern'),
  polygon: createDOMFactory('polygon'),
  polyline: createDOMFactory('polyline'),
  radialGradient: createDOMFactory('radialGradient'),
  rect: createDOMFactory('rect'),
  stop: createDOMFactory('stop'),
  svg: createDOMFactory('svg'),
  text: createDOMFactory('text'),
  tspan: createDOMFactory('tspan')
};

module.exports = ReactDOMFactories;
}).call(this,require('_process'))
},{"./ReactElement":81,"./ReactElementValidator":83,"_process":29}],81:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var _assign = require('object-assign');

var ReactCurrentOwner = require('./ReactCurrentOwner');

var warning = require('fbjs/lib/warning');
var canDefineProperty = require('./canDefineProperty');
var hasOwnProperty = Object.prototype.hasOwnProperty;

var REACT_ELEMENT_TYPE = require('./ReactElementSymbol');

var RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true
};

var specialPropKeyWarningShown, specialPropRefWarningShown;

function hasValidRef(config) {
  if (process.env.NODE_ENV !== 'production') {
    if (hasOwnProperty.call(config, 'ref')) {
      var getter = Object.getOwnPropertyDescriptor(config, 'ref').get;
      if (getter && getter.isReactWarning) {
        return false;
      }
    }
  }
  return config.ref !== undefined;
}

function hasValidKey(config) {
  if (process.env.NODE_ENV !== 'production') {
    if (hasOwnProperty.call(config, 'key')) {
      var getter = Object.getOwnPropertyDescriptor(config, 'key').get;
      if (getter && getter.isReactWarning) {
        return false;
      }
    }
  }
  return config.key !== undefined;
}

function defineKeyPropWarningGetter(props, displayName) {
  var warnAboutAccessingKey = function () {
    if (!specialPropKeyWarningShown) {
      specialPropKeyWarningShown = true;
      process.env.NODE_ENV !== 'production' ? warning(false, '%s: `key` is not a prop. Trying to access it will result ' + 'in `undefined` being returned. If you need to access the same ' + 'value within the child component, you should pass it as a different ' + 'prop. (https://fb.me/react-special-props)', displayName) : void 0;
    }
  };
  warnAboutAccessingKey.isReactWarning = true;
  Object.defineProperty(props, 'key', {
    get: warnAboutAccessingKey,
    configurable: true
  });
}

function defineRefPropWarningGetter(props, displayName) {
  var warnAboutAccessingRef = function () {
    if (!specialPropRefWarningShown) {
      specialPropRefWarningShown = true;
      process.env.NODE_ENV !== 'production' ? warning(false, '%s: `ref` is not a prop. Trying to access it will result ' + 'in `undefined` being returned. If you need to access the same ' + 'value within the child component, you should pass it as a different ' + 'prop. (https://fb.me/react-special-props)', displayName) : void 0;
    }
  };
  warnAboutAccessingRef.isReactWarning = true;
  Object.defineProperty(props, 'ref', {
    get: warnAboutAccessingRef,
    configurable: true
  });
}

/**
 * Factory method to create a new React element. This no longer adheres to
 * the class pattern, so do not use new to call it. Also, no instanceof check
 * will work. Instead test $$typeof field against Symbol.for('react.element') to check
 * if something is a React Element.
 *
 * @param {*} type
 * @param {*} key
 * @param {string|object} ref
 * @param {*} self A *temporary* helper to detect places where `this` is
 * different from the `owner` when React.createElement is called, so that we
 * can warn. We want to get rid of owner and replace string `ref`s with arrow
 * functions, and as long as `this` and owner are the same, there will be no
 * change in behavior.
 * @param {*} source An annotation object (added by a transpiler or otherwise)
 * indicating filename, line number, and/or other information.
 * @param {*} owner
 * @param {*} props
 * @internal
 */
var ReactElement = function (type, key, ref, self, source, owner, props) {
  var element = {
    // This tag allow us to uniquely identify this as a React Element
    $$typeof: REACT_ELEMENT_TYPE,

    // Built-in properties that belong on the element
    type: type,
    key: key,
    ref: ref,
    props: props,

    // Record the component responsible for creating this element.
    _owner: owner
  };

  if (process.env.NODE_ENV !== 'production') {
    // The validation flag is currently mutative. We put it on
    // an external backing store so that we can freeze the whole object.
    // This can be replaced with a WeakMap once they are implemented in
    // commonly used development environments.
    element._store = {};

    // To make comparing ReactElements easier for testing purposes, we make
    // the validation flag non-enumerable (where possible, which should
    // include every environment we run tests in), so the test framework
    // ignores it.
    if (canDefineProperty) {
      Object.defineProperty(element._store, 'validated', {
        configurable: false,
        enumerable: false,
        writable: true,
        value: false
      });
      // self and source are DEV only properties.
      Object.defineProperty(element, '_self', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: self
      });
      // Two elements created in two different places should be considered
      // equal for testing purposes and therefore we hide it from enumeration.
      Object.defineProperty(element, '_source', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: source
      });
    } else {
      element._store.validated = false;
      element._self = self;
      element._source = source;
    }
    if (Object.freeze) {
      Object.freeze(element.props);
      Object.freeze(element);
    }
  }

  return element;
};

/**
 * Create and return a new ReactElement of the given type.
 * See https://facebook.github.io/react/docs/top-level-api.html#react.createelement
 */
ReactElement.createElement = function (type, config, children) {
  var propName;

  // Reserved names are extracted
  var props = {};

  var key = null;
  var ref = null;
  var self = null;
  var source = null;

  if (config != null) {
    if (hasValidRef(config)) {
      ref = config.ref;
    }
    if (hasValidKey(config)) {
      key = '' + config.key;
    }

    self = config.__self === undefined ? null : config.__self;
    source = config.__source === undefined ? null : config.__source;
    // Remaining properties are added to a new props object
    for (propName in config) {
      if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
        props[propName] = config[propName];
      }
    }
  }

  // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.
  var childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    var childArray = Array(childrenLength);
    for (var i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    if (process.env.NODE_ENV !== 'production') {
      if (Object.freeze) {
        Object.freeze(childArray);
      }
    }
    props.children = childArray;
  }

  // Resolve default props
  if (type && type.defaultProps) {
    var defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }
  if (process.env.NODE_ENV !== 'production') {
    if (key || ref) {
      if (typeof props.$$typeof === 'undefined' || props.$$typeof !== REACT_ELEMENT_TYPE) {
        var displayName = typeof type === 'function' ? type.displayName || type.name || 'Unknown' : type;
        if (key) {
          defineKeyPropWarningGetter(props, displayName);
        }
        if (ref) {
          defineRefPropWarningGetter(props, displayName);
        }
      }
    }
  }
  return ReactElement(type, key, ref, self, source, ReactCurrentOwner.current, props);
};

/**
 * Return a function that produces ReactElements of a given type.
 * See https://facebook.github.io/react/docs/top-level-api.html#react.createfactory
 */
ReactElement.createFactory = function (type) {
  var factory = ReactElement.createElement.bind(null, type);
  // Expose the type on the factory and the prototype so that it can be
  // easily accessed on elements. E.g. `<Foo />.type === Foo`.
  // This should not be named `constructor` since this may not be the function
  // that created the element, and it may not even be a constructor.
  // Legacy hook TODO: Warn if this is accessed
  factory.type = type;
  return factory;
};

ReactElement.cloneAndReplaceKey = function (oldElement, newKey) {
  var newElement = ReactElement(oldElement.type, newKey, oldElement.ref, oldElement._self, oldElement._source, oldElement._owner, oldElement.props);

  return newElement;
};

/**
 * Clone and return a new ReactElement using element as the starting point.
 * See https://facebook.github.io/react/docs/top-level-api.html#react.cloneelement
 */
ReactElement.cloneElement = function (element, config, children) {
  var propName;

  // Original props are copied
  var props = _assign({}, element.props);

  // Reserved names are extracted
  var key = element.key;
  var ref = element.ref;
  // Self is preserved since the owner is preserved.
  var self = element._self;
  // Source is preserved since cloneElement is unlikely to be targeted by a
  // transpiler, and the original source is probably a better indicator of the
  // true owner.
  var source = element._source;

  // Owner will be preserved, unless ref is overridden
  var owner = element._owner;

  if (config != null) {
    if (hasValidRef(config)) {
      // Silently steal the ref from the parent.
      ref = config.ref;
      owner = ReactCurrentOwner.current;
    }
    if (hasValidKey(config)) {
      key = '' + config.key;
    }

    // Remaining properties override existing props
    var defaultProps;
    if (element.type && element.type.defaultProps) {
      defaultProps = element.type.defaultProps;
    }
    for (propName in config) {
      if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
        if (config[propName] === undefined && defaultProps !== undefined) {
          // Resolve default props
          props[propName] = defaultProps[propName];
        } else {
          props[propName] = config[propName];
        }
      }
    }
  }

  // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.
  var childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    var childArray = Array(childrenLength);
    for (var i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    props.children = childArray;
  }

  return ReactElement(element.type, key, ref, self, source, owner, props);
};

/**
 * Verifies the object is a ReactElement.
 * See https://facebook.github.io/react/docs/top-level-api.html#react.isvalidelement
 * @param {?object} object
 * @return {boolean} True if `object` is a valid component.
 * @final
 */
ReactElement.isValidElement = function (object) {
  return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
};

module.exports = ReactElement;
}).call(this,require('_process'))
},{"./ReactCurrentOwner":79,"./ReactElementSymbol":82,"./canDefineProperty":89,"_process":29,"fbjs/lib/warning":8,"object-assign":28}],82:[function(require,module,exports){
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

// The Symbol used to tag the ReactElement type. If there is no native Symbol
// nor polyfill, then a plain number is used for performance.

var REACT_ELEMENT_TYPE = typeof Symbol === 'function' && Symbol['for'] && Symbol['for']('react.element') || 0xeac7;

module.exports = REACT_ELEMENT_TYPE;
},{}],83:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ReactElementValidator provides a wrapper around a element factory
 * which validates the props passed to the element. This is intended to be
 * used only in DEV and could be replaced by a static type checker for languages
 * that support it.
 */

'use strict';

var ReactCurrentOwner = require('./ReactCurrentOwner');
var ReactComponentTreeHook = require('./ReactComponentTreeHook');
var ReactElement = require('./ReactElement');

var checkReactTypeSpec = require('./checkReactTypeSpec');

var canDefineProperty = require('./canDefineProperty');
var getIteratorFn = require('./getIteratorFn');
var warning = require('fbjs/lib/warning');
var lowPriorityWarning = require('./lowPriorityWarning');

function getDeclarationErrorAddendum() {
  if (ReactCurrentOwner.current) {
    var name = ReactCurrentOwner.current.getName();
    if (name) {
      return ' Check the render method of `' + name + '`.';
    }
  }
  return '';
}

function getSourceInfoErrorAddendum(elementProps) {
  if (elementProps !== null && elementProps !== undefined && elementProps.__source !== undefined) {
    var source = elementProps.__source;
    var fileName = source.fileName.replace(/^.*[\\\/]/, '');
    var lineNumber = source.lineNumber;
    return ' Check your code at ' + fileName + ':' + lineNumber + '.';
  }
  return '';
}

/**
 * Warn if there's no key explicitly set on dynamic arrays of children or
 * object keys are not valid. This allows us to keep track of children between
 * updates.
 */
var ownerHasKeyUseWarning = {};

function getCurrentComponentErrorInfo(parentType) {
  var info = getDeclarationErrorAddendum();

  if (!info) {
    var parentName = typeof parentType === 'string' ? parentType : parentType.displayName || parentType.name;
    if (parentName) {
      info = ' Check the top-level render call using <' + parentName + '>.';
    }
  }
  return info;
}

/**
 * Warn if the element doesn't have an explicit key assigned to it.
 * This element is in an array. The array could grow and shrink or be
 * reordered. All children that haven't already been validated are required to
 * have a "key" property assigned to it. Error statuses are cached so a warning
 * will only be shown once.
 *
 * @internal
 * @param {ReactElement} element Element that requires a key.
 * @param {*} parentType element's parent's type.
 */
function validateExplicitKey(element, parentType) {
  if (!element._store || element._store.validated || element.key != null) {
    return;
  }
  element._store.validated = true;

  var memoizer = ownerHasKeyUseWarning.uniqueKey || (ownerHasKeyUseWarning.uniqueKey = {});

  var currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);
  if (memoizer[currentComponentErrorInfo]) {
    return;
  }
  memoizer[currentComponentErrorInfo] = true;

  // Usually the current owner is the offender, but if it accepts children as a
  // property, it may be the creator of the child that's responsible for
  // assigning it a key.
  var childOwner = '';
  if (element && element._owner && element._owner !== ReactCurrentOwner.current) {
    // Give the component that originally created this child.
    childOwner = ' It was passed a child from ' + element._owner.getName() + '.';
  }

  process.env.NODE_ENV !== 'production' ? warning(false, 'Each child in an array or iterator should have a unique "key" prop.' + '%s%s See https://fb.me/react-warning-keys for more information.%s', currentComponentErrorInfo, childOwner, ReactComponentTreeHook.getCurrentStackAddendum(element)) : void 0;
}

/**
 * Ensure that every element either is passed in a static location, in an
 * array with an explicit keys property defined, or in an object literal
 * with valid key property.
 *
 * @internal
 * @param {ReactNode} node Statically passed child of any type.
 * @param {*} parentType node's parent's type.
 */
function validateChildKeys(node, parentType) {
  if (typeof node !== 'object') {
    return;
  }
  if (Array.isArray(node)) {
    for (var i = 0; i < node.length; i++) {
      var child = node[i];
      if (ReactElement.isValidElement(child)) {
        validateExplicitKey(child, parentType);
      }
    }
  } else if (ReactElement.isValidElement(node)) {
    // This element was passed in a valid location.
    if (node._store) {
      node._store.validated = true;
    }
  } else if (node) {
    var iteratorFn = getIteratorFn(node);
    // Entry iterators provide implicit keys.
    if (iteratorFn) {
      if (iteratorFn !== node.entries) {
        var iterator = iteratorFn.call(node);
        var step;
        while (!(step = iterator.next()).done) {
          if (ReactElement.isValidElement(step.value)) {
            validateExplicitKey(step.value, parentType);
          }
        }
      }
    }
  }
}

/**
 * Given an element, validate that its props follow the propTypes definition,
 * provided by the type.
 *
 * @param {ReactElement} element
 */
function validatePropTypes(element) {
  var componentClass = element.type;
  if (typeof componentClass !== 'function') {
    return;
  }
  var name = componentClass.displayName || componentClass.name;
  if (componentClass.propTypes) {
    checkReactTypeSpec(componentClass.propTypes, element.props, 'prop', name, element, null);
  }
  if (typeof componentClass.getDefaultProps === 'function') {
    process.env.NODE_ENV !== 'production' ? warning(componentClass.getDefaultProps.isReactClassApproved, 'getDefaultProps is only used on classic React.createClass ' + 'definitions. Use a static property named `defaultProps` instead.') : void 0;
  }
}

var ReactElementValidator = {
  createElement: function (type, props, children) {
    var validType = typeof type === 'string' || typeof type === 'function';
    // We warn in this case but don't throw. We expect the element creation to
    // succeed and there will likely be errors in render.
    if (!validType) {
      if (typeof type !== 'function' && typeof type !== 'string') {
        var info = '';
        if (type === undefined || typeof type === 'object' && type !== null && Object.keys(type).length === 0) {
          info += ' You likely forgot to export your component from the file ' + "it's defined in.";
        }

        var sourceInfo = getSourceInfoErrorAddendum(props);
        if (sourceInfo) {
          info += sourceInfo;
        } else {
          info += getDeclarationErrorAddendum();
        }

        info += ReactComponentTreeHook.getCurrentStackAddendum();

        var currentSource = props !== null && props !== undefined && props.__source !== undefined ? props.__source : null;
        ReactComponentTreeHook.pushNonStandardWarningStack(true, currentSource);
        process.env.NODE_ENV !== 'production' ? warning(false, 'React.createElement: type is invalid -- expected a string (for ' + 'built-in components) or a class/function (for composite ' + 'components) but got: %s.%s', type == null ? type : typeof type, info) : void 0;
        ReactComponentTreeHook.popNonStandardWarningStack();
      }
    }

    var element = ReactElement.createElement.apply(this, arguments);

    // The result can be nullish if a mock or a custom function is used.
    // TODO: Drop this when these are no longer allowed as the type argument.
    if (element == null) {
      return element;
    }

    // Skip key warning if the type isn't valid since our key validation logic
    // doesn't expect a non-string/function type and can throw confusing errors.
    // We don't want exception behavior to differ between dev and prod.
    // (Rendering will throw with a helpful message and as soon as the type is
    // fixed, the key warnings will appear.)
    if (validType) {
      for (var i = 2; i < arguments.length; i++) {
        validateChildKeys(arguments[i], type);
      }
    }

    validatePropTypes(element);

    return element;
  },

  createFactory: function (type) {
    var validatedFactory = ReactElementValidator.createElement.bind(null, type);
    // Legacy hook TODO: Warn if this is accessed
    validatedFactory.type = type;

    if (process.env.NODE_ENV !== 'production') {
      if (canDefineProperty) {
        Object.defineProperty(validatedFactory, 'type', {
          enumerable: false,
          get: function () {
            lowPriorityWarning(false, 'Factory.type is deprecated. Access the class directly ' + 'before passing it to createFactory.');
            Object.defineProperty(this, 'type', {
              value: type
            });
            return type;
          }
        });
      }
    }

    return validatedFactory;
  },

  cloneElement: function (element, props, children) {
    var newElement = ReactElement.cloneElement.apply(this, arguments);
    for (var i = 2; i < arguments.length; i++) {
      validateChildKeys(arguments[i], newElement.type);
    }
    validatePropTypes(newElement);
    return newElement;
  }
};

module.exports = ReactElementValidator;
}).call(this,require('_process'))
},{"./ReactComponentTreeHook":78,"./ReactCurrentOwner":79,"./ReactElement":81,"./canDefineProperty":89,"./checkReactTypeSpec":90,"./getIteratorFn":92,"./lowPriorityWarning":93,"_process":29,"fbjs/lib/warning":8}],84:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var warning = require('fbjs/lib/warning');

function warnNoop(publicInstance, callerName) {
  if (process.env.NODE_ENV !== 'production') {
    var constructor = publicInstance.constructor;
    process.env.NODE_ENV !== 'production' ? warning(false, '%s(...): Can only update a mounted or mounting component. ' + 'This usually means you called %s() on an unmounted component. ' + 'This is a no-op. Please check the code for the %s component.', callerName, callerName, constructor && (constructor.displayName || constructor.name) || 'ReactClass') : void 0;
  }
}

/**
 * This is the abstract API for an update queue.
 */
var ReactNoopUpdateQueue = {
  /**
   * Checks whether or not this composite component is mounted.
   * @param {ReactClass} publicInstance The instance we want to test.
   * @return {boolean} True if mounted, false otherwise.
   * @protected
   * @final
   */
  isMounted: function (publicInstance) {
    return false;
  },

  /**
   * Enqueue a callback that will be executed after all the pending updates
   * have processed.
   *
   * @param {ReactClass} publicInstance The instance to use as `this` context.
   * @param {?function} callback Called after state is updated.
   * @internal
   */
  enqueueCallback: function (publicInstance, callback) {},

  /**
   * Forces an update. This should only be invoked when it is known with
   * certainty that we are **not** in a DOM transaction.
   *
   * You may want to call this when you know that some deeper aspect of the
   * component's state has changed but `setState` was not called.
   *
   * This will not invoke `shouldComponentUpdate`, but it will invoke
   * `componentWillUpdate` and `componentDidUpdate`.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @internal
   */
  enqueueForceUpdate: function (publicInstance) {
    warnNoop(publicInstance, 'forceUpdate');
  },

  /**
   * Replaces all of the state. Always use this or `setState` to mutate state.
   * You should treat `this.state` as immutable.
   *
   * There is no guarantee that `this.state` will be immediately updated, so
   * accessing `this.state` after calling this method may return the old value.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {object} completeState Next state.
   * @internal
   */
  enqueueReplaceState: function (publicInstance, completeState) {
    warnNoop(publicInstance, 'replaceState');
  },

  /**
   * Sets a subset of the state. This only exists because _pendingState is
   * internal. This provides a merging strategy that is not available to deep
   * properties which is confusing. TODO: Expose pendingState or don't use it
   * during the merge.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {object} partialState Next partial state to be merged with state.
   * @internal
   */
  enqueueSetState: function (publicInstance, partialState) {
    warnNoop(publicInstance, 'setState');
  }
};

module.exports = ReactNoopUpdateQueue;
}).call(this,require('_process'))
},{"_process":29,"fbjs/lib/warning":8}],85:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

var ReactPropTypeLocationNames = {};

if (process.env.NODE_ENV !== 'production') {
  ReactPropTypeLocationNames = {
    prop: 'prop',
    context: 'context',
    childContext: 'child context'
  };
}

module.exports = ReactPropTypeLocationNames;
}).call(this,require('_process'))
},{"_process":29}],86:[function(require,module,exports){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var _require = require('./ReactElement'),
    isValidElement = _require.isValidElement;

var factory = require('prop-types/factory');

module.exports = factory(isValidElement);
},{"./ReactElement":81,"prop-types/factory":31}],87:[function(require,module,exports){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

var ReactPropTypesSecret = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';

module.exports = ReactPropTypesSecret;
},{}],88:[function(require,module,exports){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

module.exports = '15.6.2';
},{}],89:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

var canDefineProperty = false;
if (process.env.NODE_ENV !== 'production') {
  try {
    // $FlowFixMe https://github.com/facebook/flow/issues/285
    Object.defineProperty({}, 'x', { get: function () {} });
    canDefineProperty = true;
  } catch (x) {
    // IE will fail on defineProperty
  }
}

module.exports = canDefineProperty;
}).call(this,require('_process'))
},{"_process":29}],90:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var _prodInvariant = require('./reactProdInvariant');

var ReactPropTypeLocationNames = require('./ReactPropTypeLocationNames');
var ReactPropTypesSecret = require('./ReactPropTypesSecret');

var invariant = require('fbjs/lib/invariant');
var warning = require('fbjs/lib/warning');

var ReactComponentTreeHook;

if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
  // Temporary hack.
  // Inline requires don't work well with Jest:
  // https://github.com/facebook/react/issues/7240
  // Remove the inline requires when we don't need them anymore:
  // https://github.com/facebook/react/pull/7178
  ReactComponentTreeHook = require('./ReactComponentTreeHook');
}

var loggedTypeFailures = {};

/**
 * Assert that the values match with the type specs.
 * Error messages are memorized and will only be shown once.
 *
 * @param {object} typeSpecs Map of name to a ReactPropType
 * @param {object} values Runtime values that need to be type-checked
 * @param {string} location e.g. "prop", "context", "child context"
 * @param {string} componentName Name of the component for error messages.
 * @param {?object} element The React element that is being type-checked
 * @param {?number} debugID The React component instance that is being type-checked
 * @private
 */
function checkReactTypeSpec(typeSpecs, values, location, componentName, element, debugID) {
  for (var typeSpecName in typeSpecs) {
    if (typeSpecs.hasOwnProperty(typeSpecName)) {
      var error;
      // Prop type validation may throw. In case they do, we don't want to
      // fail the render phase where it didn't fail before. So we log it.
      // After these have been cleaned up, we'll let them throw.
      try {
        // This is intentionally an invariant that gets caught. It's the same
        // behavior as without this statement except with a better message.
        !(typeof typeSpecs[typeSpecName] === 'function') ? process.env.NODE_ENV !== 'production' ? invariant(false, '%s: %s type `%s` is invalid; it must be a function, usually from React.PropTypes.', componentName || 'React class', ReactPropTypeLocationNames[location], typeSpecName) : _prodInvariant('84', componentName || 'React class', ReactPropTypeLocationNames[location], typeSpecName) : void 0;
        error = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, ReactPropTypesSecret);
      } catch (ex) {
        error = ex;
      }
      process.env.NODE_ENV !== 'production' ? warning(!error || error instanceof Error, '%s: type specification of %s `%s` is invalid; the type checker ' + 'function must return `null` or an `Error` but returned a %s. ' + 'You may have forgotten to pass an argument to the type checker ' + 'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' + 'shape all require an argument).', componentName || 'React class', ReactPropTypeLocationNames[location], typeSpecName, typeof error) : void 0;
      if (error instanceof Error && !(error.message in loggedTypeFailures)) {
        // Only monitor this failure once because there tends to be a lot of the
        // same error.
        loggedTypeFailures[error.message] = true;

        var componentStackInfo = '';

        if (process.env.NODE_ENV !== 'production') {
          if (!ReactComponentTreeHook) {
            ReactComponentTreeHook = require('./ReactComponentTreeHook');
          }
          if (debugID !== null) {
            componentStackInfo = ReactComponentTreeHook.getStackAddendumByID(debugID);
          } else if (element !== null) {
            componentStackInfo = ReactComponentTreeHook.getCurrentStackAddendum(element);
          }
        }

        process.env.NODE_ENV !== 'production' ? warning(false, 'Failed %s type: %s%s', location, error.message, componentStackInfo) : void 0;
      }
    }
  }
}

module.exports = checkReactTypeSpec;
}).call(this,require('_process'))
},{"./ReactComponentTreeHook":78,"./ReactPropTypeLocationNames":85,"./ReactPropTypesSecret":87,"./reactProdInvariant":95,"_process":29,"fbjs/lib/invariant":7,"fbjs/lib/warning":8}],91:[function(require,module,exports){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var _require = require('./ReactBaseClasses'),
    Component = _require.Component;

var _require2 = require('./ReactElement'),
    isValidElement = _require2.isValidElement;

var ReactNoopUpdateQueue = require('./ReactNoopUpdateQueue');
var factory = require('create-react-class/factory');

module.exports = factory(Component, isValidElement, ReactNoopUpdateQueue);
},{"./ReactBaseClasses":76,"./ReactElement":81,"./ReactNoopUpdateQueue":84,"create-react-class/factory":1}],92:[function(require,module,exports){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

/* global Symbol */

var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
var FAUX_ITERATOR_SYMBOL = '@@iterator'; // Before Symbol spec.

/**
 * Returns the iterator method function contained on the iterable object.
 *
 * Be sure to invoke the function with the iterable as context:
 *
 *     var iteratorFn = getIteratorFn(myIterable);
 *     if (iteratorFn) {
 *       var iterator = iteratorFn.call(myIterable);
 *       ...
 *     }
 *
 * @param {?object} maybeIterable
 * @return {?function}
 */
function getIteratorFn(maybeIterable) {
  var iteratorFn = maybeIterable && (ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL]);
  if (typeof iteratorFn === 'function') {
    return iteratorFn;
  }
}

module.exports = getIteratorFn;
},{}],93:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

/**
 * Forked from fbjs/warning:
 * https://github.com/facebook/fbjs/blob/e66ba20ad5be433eb54423f2b097d829324d9de6/packages/fbjs/src/__forks__/warning.js
 *
 * Only change is we use console.warn instead of console.error,
 * and do nothing when 'console' is not supported.
 * This really simplifies the code.
 * ---
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

var lowPriorityWarning = function () {};

if (process.env.NODE_ENV !== 'production') {
  var printWarning = function (format) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    var argIndex = 0;
    var message = 'Warning: ' + format.replace(/%s/g, function () {
      return args[argIndex++];
    });
    if (typeof console !== 'undefined') {
      console.warn(message);
    }
    try {
      // --- Welcome to debugging React ---
      // This error was thrown as a convenience so that you can use this stack
      // to find the callsite that caused this warning to fire.
      throw new Error(message);
    } catch (x) {}
  };

  lowPriorityWarning = function (condition, format) {
    if (format === undefined) {
      throw new Error('`warning(condition, format, ...args)` requires a warning ' + 'message argument');
    }
    if (!condition) {
      for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
        args[_key2 - 2] = arguments[_key2];
      }

      printWarning.apply(undefined, [format].concat(args));
    }
  };
}

module.exports = lowPriorityWarning;
}).call(this,require('_process'))
},{"_process":29}],94:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use strict';

var _prodInvariant = require('./reactProdInvariant');

var ReactElement = require('./ReactElement');

var invariant = require('fbjs/lib/invariant');

/**
 * Returns the first child in a collection of children and verifies that there
 * is only one child in the collection.
 *
 * See https://facebook.github.io/react/docs/top-level-api.html#react.children.only
 *
 * The current implementation of this function assumes that a single child gets
 * passed without a wrapper, but the purpose of this helper function is to
 * abstract away the particular structure of children.
 *
 * @param {?object} children Child collection structure.
 * @return {ReactElement} The first and only `ReactElement` contained in the
 * structure.
 */
function onlyChild(children) {
  !ReactElement.isValidElement(children) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'React.Children.only expected to receive a single React element child.') : _prodInvariant('143') : void 0;
  return children;
}

module.exports = onlyChild;
}).call(this,require('_process'))
},{"./ReactElement":81,"./reactProdInvariant":95,"_process":29,"fbjs/lib/invariant":7}],95:[function(require,module,exports){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */
'use strict';

/**
 * WARNING: DO NOT manually require this module.
 * This is a replacement for `invariant(...)` used by the error code system
 * and will _only_ be required by the corresponding babel pass.
 * It always throws.
 */

function reactProdInvariant(code) {
  var argCount = arguments.length - 1;

  var message = 'Minified React error #' + code + '; visit ' + 'http://facebook.github.io/react/docs/error-decoder.html?invariant=' + code;

  for (var argIdx = 0; argIdx < argCount; argIdx++) {
    message += '&args[]=' + encodeURIComponent(arguments[argIdx + 1]);
  }

  message += ' for the full message or use the non-minified dev environment' + ' for full errors and additional helpful warnings.';

  var error = new Error(message);
  error.name = 'Invariant Violation';
  error.framesToPop = 1; // we don't care about reactProdInvariant's own frame

  throw error;
}

module.exports = reactProdInvariant;
},{}],96:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var _prodInvariant = require('./reactProdInvariant');

var ReactCurrentOwner = require('./ReactCurrentOwner');
var REACT_ELEMENT_TYPE = require('./ReactElementSymbol');

var getIteratorFn = require('./getIteratorFn');
var invariant = require('fbjs/lib/invariant');
var KeyEscapeUtils = require('./KeyEscapeUtils');
var warning = require('fbjs/lib/warning');

var SEPARATOR = '.';
var SUBSEPARATOR = ':';

/**
 * This is inlined from ReactElement since this file is shared between
 * isomorphic and renderers. We could extract this to a
 *
 */

/**
 * TODO: Test that a single child and an array with one item have the same key
 * pattern.
 */

var didWarnAboutMaps = false;

/**
 * Generate a key string that identifies a component within a set.
 *
 * @param {*} component A component that could contain a manual key.
 * @param {number} index Index that is used if a manual key is not provided.
 * @return {string}
 */
function getComponentKey(component, index) {
  // Do some typechecking here since we call this blindly. We want to ensure
  // that we don't block potential future ES APIs.
  if (component && typeof component === 'object' && component.key != null) {
    // Explicit key
    return KeyEscapeUtils.escape(component.key);
  }
  // Implicit key determined by the index in the set
  return index.toString(36);
}

/**
 * @param {?*} children Children tree container.
 * @param {!string} nameSoFar Name of the key path so far.
 * @param {!function} callback Callback to invoke with each child found.
 * @param {?*} traverseContext Used to pass information throughout the traversal
 * process.
 * @return {!number} The number of children in this subtree.
 */
function traverseAllChildrenImpl(children, nameSoFar, callback, traverseContext) {
  var type = typeof children;

  if (type === 'undefined' || type === 'boolean') {
    // All of the above are perceived as null.
    children = null;
  }

  if (children === null || type === 'string' || type === 'number' ||
  // The following is inlined from ReactElement. This means we can optimize
  // some checks. React Fiber also inlines this logic for similar purposes.
  type === 'object' && children.$$typeof === REACT_ELEMENT_TYPE) {
    callback(traverseContext, children,
    // If it's the only child, treat the name as if it was wrapped in an array
    // so that it's consistent if the number of children grows.
    nameSoFar === '' ? SEPARATOR + getComponentKey(children, 0) : nameSoFar);
    return 1;
  }

  var child;
  var nextName;
  var subtreeCount = 0; // Count of children found in the current subtree.
  var nextNamePrefix = nameSoFar === '' ? SEPARATOR : nameSoFar + SUBSEPARATOR;

  if (Array.isArray(children)) {
    for (var i = 0; i < children.length; i++) {
      child = children[i];
      nextName = nextNamePrefix + getComponentKey(child, i);
      subtreeCount += traverseAllChildrenImpl(child, nextName, callback, traverseContext);
    }
  } else {
    var iteratorFn = getIteratorFn(children);
    if (iteratorFn) {
      var iterator = iteratorFn.call(children);
      var step;
      if (iteratorFn !== children.entries) {
        var ii = 0;
        while (!(step = iterator.next()).done) {
          child = step.value;
          nextName = nextNamePrefix + getComponentKey(child, ii++);
          subtreeCount += traverseAllChildrenImpl(child, nextName, callback, traverseContext);
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          var mapsAsChildrenAddendum = '';
          if (ReactCurrentOwner.current) {
            var mapsAsChildrenOwnerName = ReactCurrentOwner.current.getName();
            if (mapsAsChildrenOwnerName) {
              mapsAsChildrenAddendum = ' Check the render method of `' + mapsAsChildrenOwnerName + '`.';
            }
          }
          process.env.NODE_ENV !== 'production' ? warning(didWarnAboutMaps, 'Using Maps as children is not yet fully supported. It is an ' + 'experimental feature that might be removed. Convert it to a ' + 'sequence / iterable of keyed ReactElements instead.%s', mapsAsChildrenAddendum) : void 0;
          didWarnAboutMaps = true;
        }
        // Iterator will provide entry [k,v] tuples rather than values.
        while (!(step = iterator.next()).done) {
          var entry = step.value;
          if (entry) {
            child = entry[1];
            nextName = nextNamePrefix + KeyEscapeUtils.escape(entry[0]) + SUBSEPARATOR + getComponentKey(child, 0);
            subtreeCount += traverseAllChildrenImpl(child, nextName, callback, traverseContext);
          }
        }
      }
    } else if (type === 'object') {
      var addendum = '';
      if (process.env.NODE_ENV !== 'production') {
        addendum = ' If you meant to render a collection of children, use an array ' + 'instead or wrap the object using createFragment(object) from the ' + 'React add-ons.';
        if (children._isReactElement) {
          addendum = " It looks like you're using an element created by a different " + 'version of React. Make sure to use only one copy of React.';
        }
        if (ReactCurrentOwner.current) {
          var name = ReactCurrentOwner.current.getName();
          if (name) {
            addendum += ' Check the render method of `' + name + '`.';
          }
        }
      }
      var childrenString = String(children);
      !false ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Objects are not valid as a React child (found: %s).%s', childrenString === '[object Object]' ? 'object with keys {' + Object.keys(children).join(', ') + '}' : childrenString, addendum) : _prodInvariant('31', childrenString === '[object Object]' ? 'object with keys {' + Object.keys(children).join(', ') + '}' : childrenString, addendum) : void 0;
    }
  }

  return subtreeCount;
}

/**
 * Traverses children that are typically specified as `props.children`, but
 * might also be specified through attributes:
 *
 * - `traverseAllChildren(this.props.children, ...)`
 * - `traverseAllChildren(this.props.leftPanelChildren, ...)`
 *
 * The `traverseContext` is an optional argument that is passed through the
 * entire traversal. It can be used to store accumulations or anything else that
 * the callback might find relevant.
 *
 * @param {?*} children Children tree object.
 * @param {!function} callback To invoke upon traversing each child.
 * @param {?*} traverseContext Context for traversal.
 * @return {!number} The number of children in this subtree.
 */
function traverseAllChildren(children, callback, traverseContext) {
  if (children == null) {
    return 0;
  }

  return traverseAllChildrenImpl(children, '', callback, traverseContext);
}

module.exports = traverseAllChildren;
}).call(this,require('_process'))
},{"./KeyEscapeUtils":73,"./ReactCurrentOwner":79,"./ReactElementSymbol":82,"./getIteratorFn":92,"./reactProdInvariant":95,"_process":29,"fbjs/lib/invariant":7,"fbjs/lib/warning":8}],97:[function(require,module,exports){
'use strict';

module.exports = require('./lib/React');

},{"./lib/React":75}],98:[function(require,module,exports){
'use strict';
module.exports = function (str) {
	return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
		return '%' + c.charCodeAt(0).toString(16).toUpperCase();
	});
};

},{}],99:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"_process":29,"dup":25}],100:[function(require,module,exports){
'use strict';Object.defineProperty(exports,"__esModule",{value:true});var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}/**
 * Created by ruggerotrevisiol on 04/04/17.
 */var CodiceFiscaleC=function(){function CodiceFiscaleC(props){_classCallCheck(this,CodiceFiscaleC);this.props=props;this.calcola_carattere_di_controllo=this.calcola_carattere_di_controllo.bind(this);this.affronta_omocodia=this.affronta_omocodia.bind(this);this.ottieni_consonanti=this.ottieni_consonanti.bind(this);this.ottieni_vocali=this.ottieni_vocali.bind(this);this.calcola_codice_cognome=this.calcola_codice_cognome.bind(this);this.calcola_codice_nome=this.calcola_codice_nome.bind(this);this.calcola_codice_data=this.calcola_codice_data.bind(this);this.trova_comune=this.trova_comune.bind(this);this.solo_comuni=this.solo_comuni.bind(this);this.calcola_codice_comune=this.calcola_codice_comune.bind(this);this.calcola_codice=this.calcola_codice.bind(this);this.tavola_mesi=['A','B','C','D','E','H','L','M','P','R','S','T'];this.tavola_omocodie=['L','M','N','P','Q','R','S','T','U','V'];this.tavola_carattere_di_controllo_valore_caratteri_dispari={0:1,1:0,2:5,3:7,4:9,5:13,6:15,7:17,8:19,9:21,A:1,B:0,C:5,D:7,E:9,F:13,G:15,H:17,I:19,J:21,K:2,L:4,M:18,N:20,O:11,P:3,Q:6,R:8,S:12,T:14,U:16,V:10,W:22,X:25,Y:24,Z:23};this.tavola_carattere_di_controllo_valore_caratteri_pari={0:0,1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,A:0,B:1,C:2,D:3,E:4,F:5,G:6,H:7,I:8,J:9,K:10,L:11,M:12,N:13,O:14,P:15,Q:16,R:17,S:18,T:19,U:20,V:21,W:22,X:23,Y:24,Z:25};this.tavola_carattere_di_controllo="ABCDEFGHIJKLMNOPQRSTUVWXYZ";this.codici_catastali={"A001":"ABANO TERME (PD)","A004":"ABBADIA CERRETO (LO)","A005":"ABBADIA LARIANA (LC)","A006":"ABBADIA SAN SALVATORE (SI)","A007":"ABBASANTA (OR)","A008":"ABBATEGGIO (PE)","A010":"ABBIATEGRASSO (MI)","A012":"ABETONE (PT)","A013":"ABRIOLA (PZ)","A014":"ACATE (RG)","A015":"ACCADIA (FG)","A016":"ACCEGLIO (CN)","A017":"ACCETTURA (MT)","A018":"ACCIANO (AQ)","A019":"ACCUMOLI (RI)","A020":"ACERENZA (PZ)","A023":"ACERNO (SA)","A024":"ACERRA (NA)","A025":"ACI BONACCORSI (CT)","A026":"ACI CASTELLO (CT)","A027":"ACI CATENA (CT)","A029":"ACI SANT'ANTONIO (CT)","A028":"ACIREALE (CT)","A031":"ACQUACANINA (MC)","A032":"ACQUAFONDATA (FR)","A033":"ACQUAFORMOSA (CS)","A034":"ACQUAFREDDA (BS)","A035":"ACQUALAGNA (PU)","A039":"ACQUANEGRA CREMONESE (CR)","A038":"ACQUANEGRA SUL CHIESE (MN)","A040":"ACQUAPENDENTE (VT)","A041":"ACQUAPPESA (CS)","A042":"ACQUARICA DEL CAPO (LE)","A043":"ACQUARO (VV)","A044":"ACQUASANTA TERME (AP)","A045":"ACQUASPARTA (TR)","A050":"ACQUAVIVA COLLECROCE (CB)","A048":"ACQUAVIVA DELLE FONTI (BA)","A051":"ACQUAVIVA D'ISERNIA (IS)","A047":"ACQUAVIVA PICENA (AP)","A049":"ACQUAVIVA PLATANI (CL)","M211":"ACQUEDOLCI (ME)","A052":"ACQUI TERME (AL)","A053":"ACRI (CS)","A054":"ACUTO (FR)","A055":"ADELFIA (BA)","A056":"ADRANO (CT)","A057":"ADRARA SAN MARTINO (BG)","A058":"ADRARA SAN ROCCO (BG)","A059":"ADRIA (RO)","A060":"ADRO (BS)","A061":"AFFI (VR)","A062":"AFFILE (RM)","A064":"AFRAGOLA (NA)","A065":"AFRICO (RC)","A067":"AGAZZANO (PC)","A068":"AGEROLA (NA)","A069":"AGGIUS (SS)","A070":"AGIRA (EN)","A071":"AGLIANA (PT)","A072":"AGLIANO TERME (AT)","A074":"AGLIE' (TO)","H848":"AGLIENTU (SS)","A075":"AGNA (PD)","A076":"AGNADELLO (CR)","A077":"AGNANA CALABRA (RC)","A080":"AGNONE (IS)","A082":"AGNOSINE (BS)","A083":"AGORDO (BL)","A084":"AGOSTA (RM)","A085":"AGRA (VA)","A087":"AGRATE BRIANZA (MI)","A088":"AGRATE CONTURBIA (NO)","A089":"AGRIGENTO (AG)","A091":"AGROPOLI (SA)","A092":"AGUGLIANO (AN)","A093":"AGUGLIARO (VI)","A096":"AICURZIO (MI)","A097":"AIDOMAGGIORE (OR)","A098":"AIDONE (EN)","A100":"AIELLI (AQ)","A102":"AIELLO CALABRO (CS)","A103":"AIELLO DEL FRIULI (UD)","A101":"AIELLO DEL SABATO (AV)","A105":"AIETA (CS)","A106":"AILANO (CE)","A107":"AILOCHE (BI)","A109":"AIRASCA (TO)","A110":"AIROLA (BN)","A111":"AIROLE (IM)","A112":"AIRUNO (LC)","A113":"AISONE (CN)","A116":"ALA (TN)","A115":"ALA' DEI SARDI (SS)","A117":"ALA DI STURA (TO)","A118":"ALAGNA (PV)","A119":"ALAGNA VALSESIA (VC)","A120":"ALANNO (PE)","A121":"ALANO DI PIAVE (BL)","A122":"ALASSIO (SV)","A123":"ALATRI (FR)","A124":"ALBA (CN)","A125":"ALBA ADRIATICA (TE)","A126":"ALBAGIARA (OR)","A127":"ALBAIRATE (MI)","A128":"ALBANELLA (SA)","A131":"ALBANO DI LUCANIA (PZ)","A132":"ALBANO LAZIALE (RM)","A129":"ALBANO SANT'ALESSANDRO (BG)","A130":"ALBANO VERCELLESE (VC)","A134":"ALBAREDO ARNABOLDI (PV)","A137":"ALBAREDO D'ADIGE (VR)","A135":"ALBAREDO PER SAN MARCO (SO)","A138":"ALBARETO (PR)","A139":"ALBARETTO DELLA TORRE (CN)","A143":"ALBAVILLA (CO)","A145":"ALBENGA (SV)","A146":"ALBERA LIGURE (AL)","A149":"ALBEROBELLO (BA)","A150":"ALBERONA (FG)","A153":"ALBESE CON CASSANO (CO)","A154":"ALBETTONE (VI)","A155":"ALBI (CZ)","A158":"ALBIANO (TN)","A157":"ALBIANO D'IVREA (TO)","A159":"ALBIATE (MI)","A160":"ALBIDONA (CS)","A161":"ALBIGNASEGO (PD)","A162":"ALBINEA (RE)","A163":"ALBINO (BG)","A164":"ALBIOLO (CO)","A166":"ALBISOLA SUPERIORE (SV)","A165":"ALBISSOLA MARINA (SV)","A167":"ALBIZZATE (VA)","A171":"ALBONESE (PV)","A172":"ALBOSAGGIA (SO)","A173":"ALBUGNANO (AT)","A175":"ALBUZZANO (PV)","A176":"ALCAMO (TP)","A177":"ALCARA LI FUSI (ME)","A178":"ALDENO (TN)","A179":"ALDINO .ALDEIN. (BZ)","A180":"ALES (OR)","A182":"ALESSANDRIA (AL)","A183":"ALESSANDRIA DEL CARRETTO (CS)","A181":"ALESSANDRIA DELLA ROCCA (AG)","A184":"ALESSANO (LE)","A185":"ALEZIO (LE)","A186":"ALFANO (SA)","A187":"ALFEDENA (AQ)","A188":"ALFIANELLO (BS)","A189":"ALFIANO NATTA (AL)","A191":"ALFONSINE (RA)","A192":"ALGHERO (SS)","A193":"ALGUA (BG)","A194":"ALI' (ME)","A201":"ALI' TERME (ME)","A195":"ALIA (PA)","A196":"ALIANO (MT)","A197":"ALICE BEL COLLE (AL)","A198":"ALICE CASTELLO (VC)","A199":"ALICE SUPERIORE (TO)","A200":"ALIFE (CE)","A202":"ALIMENA (PA)","A203":"ALIMINUSA (PA)","A204":"ALLAI (OR)","A206":"ALLEGHE (BL)","A205":"ALLEIN (AO)","A207":"ALLERONA (TR)","A208":"ALLISTE (LE)","A210":"ALLUMIERE (RM)","A211":"ALLUVIONI CAMBIO' (AL)","A214":"ALME' (BG)","A216":"ALMENNO SAN BARTOLOMEO (BG)","A217":"ALMENNO SAN SALVATORE (BG)","A218":"ALMESE (TO)","A220":"ALONTE (VI)","A221":"ALPETTE (TO)","A222":"ALPIGNANO (TO)","A223":"ALSENO (PC)","A224":"ALSERIO (CO)","A225":"ALTAMURA (BA)","A226":"ALTARE (SV)","A228":"ALTAVILLA IRPINA (AV)","A229":"ALTAVILLA MILICIA (PA)","A227":"ALTAVILLA MONFERRATO (AL)","A230":"ALTAVILLA SILENTINA (SA)","A231":"ALTAVILLA VICENTINA (VI)","A233":"ALTIDONA (AP)","A234":"ALTILIA (CS)","A235":"ALTINO (CH)","A236":"ALTISSIMO (VI)","A237":"ALTIVOLE (TV)","A238":"ALTO (CN)","A239":"ALTOFONTE (PA)","A240":"ALTOMONTE (CS)","A241":"ALTOPASCIO (LU)","A242":"ALVIANO (TR)","A243":"ALVIGNANO (CE)","A244":"ALVITO (FR)","A246":"ALZANO LOMBARDO (BG)","A245":"ALZANO SCRIVIA (AL)","A249":"ALZATE BRIANZA (CO)","A251":"AMALFI (SA)","A252":"AMANDOLA (AP)","A253":"AMANTEA (CS)","A254":"AMARO (UD)","A255":"AMARONI (CZ)","A256":"AMASENO (FR)","A257":"AMATO (CZ)","A258":"AMATRICE (RI)","A259":"AMBIVERE (BG)","A260":"AMBLAR (TN)","A261":"AMEGLIA (SP)","A262":"AMELIA (TR)","A263":"AMENDOLARA (CS)","A264":"AMENO (NO)","A265":"AMOROSI (BN)","A267":"AMPEZZO (UD)","A268":"ANACAPRI (NA)","A269":"ANAGNI (FR)","A270":"ANCARANO (TE)","A271":"ANCONA (AN)","A272":"ANDALI (CZ)","A274":"ANDALO (TN)","A273":"ANDALO VALTELLINO (SO)","A275":"ANDEZENO (TO)","A278":"ANDORA (SV)","A280":"ANDORNO MICCA (BI)","A281":"ANDRANO (LE)","A282":"ANDRATE (TO)","A283":"ANDREIS (PN)","A284":"ANDRETTA (AV)","A285":"ANDRIA (BA)","A286":"ANDRIANO .ANDRIAN. (BZ)","A287":"ANELA (SS)","A288":"ANFO (BS)","A290":"ANGERA (VA)","A291":"ANGHIARI (AR)","A292":"ANGIARI (VR)","A293":"ANGOLO TERME (BS)","A294":"ANGRI (SA)","A295":"ANGROGNA (TO)","A297":"ANGUILLARA SABAZIA (RM)","A296":"ANGUILLARA VENETA (PD)","A299":"ANNICCO (CR)","A301":"ANNONE DI BRIANZA (LC)","A302":"ANNONE VENETO (VE)","A303":"ANOIA (RC)","A304":"ANTEGNATE (BG)","A306":"ANTERIVO .ALTREI. (BZ)","A305":"ANTEY-SAINT-ANDRE' (AO)","A309":"ANTICOLI CORRADO (RM)","A312":"ANTIGNANO (AT)","A313":"ANTILLO (ME)","A314":"ANTONIMINA (RC)","A315":"ANTRODOCO (RI)","A317":"ANTRONA SCHIERANCO (VB)","A318":"ANVERSA DEGLI ABRUZZI (AQ)","A319":"ANZANO DEL PARCO (CO)","A320":"ANZANO DI PUGLIA (FG)","A321":"ANZI (PZ)","A323":"ANZIO (RM)","A324":"ANZOLA DELL'EMILIA (BO)","A325":"ANZOLA D'OSSOLA (VB)","A326":"AOSTA (AO)","A327":"APECCHIO (PU)","A328":"APICE (BN)","A329":"APIRO (MC)","A330":"APOLLOSA (BN)","A333":"APPIANO GENTILE (CO)","A332":"APPIANO SULLA STRADA DEL VINO .EPPAN AN DER. (BZ)","A334":"APPIGNANO (MC)","A335":"APPIGNANO DEL TRONTO (AP)","A337":"APRICA (SO)","A338":"APRICALE (IM)","A339":"APRICENA (FG)","A340":"APRIGLIANO (CS)","A341":"APRILIA (LT)","A343":"AQUARA (SA)","A344":"AQUILA D'ARROSCIA (IM)","A346":"AQUILEIA (UD)","A347":"AQUILONIA (AV)","A348":"AQUINO (FR)","A350":"ARADEO (LE)","A351":"ARAGONA (AG)","A352":"ARAMENGO (AT)","A354":"ARBA (PN)","A357":"ARBOREA (OR)","A358":"ARBORIO (VC)","A359":"ARBUS (CA)","A360":"ARCADE (TV)","A363":"ARCE (FR)","A365":"ARCENE (BG)","A366":"ARCEVIA (AN)","A367":"ARCHI (CH)","A369":"ARCIDOSSO (GR)","A370":"ARCINAZZO ROMANO (RM)","A371":"ARCISATE (VA)","A372":"ARCO (TN)","A373":"ARCOLA (SP)","A374":"ARCOLE (VR)","A375":"ARCONATE (MI)","A376":"ARCORE (MI)","A377":"ARCUGNANO (VI)","A379":"ARDARA (SS)","A380":"ARDAULI (OR)","M213":"ARDEA (RM)","A382":"ARDENNO (SO)","A383":"ARDESIO (BG)","A385":"ARDORE (RC)","A386":"ARENA (VV)","A387":"ARENA PO (PV)","A388":"ARENZANO (GE)","A389":"ARESE (MI)","A390":"AREZZO (AR)","A391":"ARGEGNO (CO)","A392":"ARGELATO (BO)","A393":"ARGENTA (FE)","A394":"ARGENTERA (CN)","A396":"ARGUELLO (CN)","A397":"ARGUSTO (CZ)","A398":"ARI (CH)","A399":"ARIANO IRPINO (AV)","A400":"ARIANO NEL POLESINE (RO)","A401":"ARICCIA (RM)","A402":"ARIELLI (CH)","A403":"ARIENZO (CE)","A405":"ARIGNANO (TO)","A407":"ARITZO (NU)","A409":"ARIZZANO (VB)","A412":"ARLENA DI CASTRO (VT)","A413":"ARLUNO (MI)","A414":"ARMENO (NO)","A415":"ARMENTO (PZ)","A418":"ARMO (IM)","A419":"ARMUNGIA (CA)","A424":"ARNAD (AO)","A421":"ARNARA (FR)","A422":"ARNASCO (SV)","A425":"ARNESANO (LE)","A427":"AROLA (VB)","A429":"ARONA (NO)","A430":"AROSIO (CO)","A431":"ARPAIA (BN)","A432":"ARPAISE (BN)","A433":"ARPINO (FR)","A434":"ARQUA' PETRARCA (PD)","A435":"ARQUA' POLESINE (RO)","A437":"ARQUATA DEL TRONTO (AP)","A436":"ARQUATA SCRIVIA (AL)","A438":"ARRE (PD)","A439":"ARRONE (TR)","A441":"ARSAGO SEPRIO (VA)","A443":"ARSIE' (BL)","A444":"ARSIERO (VI)","A445":"ARSITA (TE)","A446":"ARSOLI (RM)","A447":"ARTA TERME (UD)","A448":"ARTEGNA (UD)","A449":"ARTENA (RM)","A451":"ARTOGNE (BS)","A452":"ARVIER (AO)","A453":"ARZACHENA (SS)","A440":"ARZAGO D'ADDA (BG)","A454":"ARZANA (NU)","A455":"ARZANO (NA)","A456":"ARZENE (PN)","A458":"ARZERGRANDE (PD)","A459":"ARZIGNANO (VI)","A460":"ASCEA (SA)","A461":"ASCIANO (SI)","A462":"ASCOLI PICENO (AP)","A463":"ASCOLI SATRIANO (FG)","A464":"ASCREA (RI)","A465":"ASIAGO (VI)","A467":"ASIGLIANO VENETO (VI)","A466":"ASIGLIANO VERCELLESE (VC)","A470":"ASOLA (MN)","A471":"ASOLO (TV)","A473":"ASSAGO (MI)","A474":"ASSEMINI (CA)","A475":"ASSISI (PG)","A476":"ASSO (CO)","A477":"ASSOLO (OR)","A478":"ASSORO (EN)","A479":"ASTI (AT)","A480":"ASUNI (OR)","A481":"ATELETA (AQ)","A482":"ATELLA (PZ)","A484":"ATENA LUCANA (SA)","A485":"ATESSA (CH)","A486":"ATINA (FR)","A487":"ATRANI (SA)","A488":"ATRI (TE)","A489":"ATRIPALDA (AV)","A490":"ATTIGLIANO (TR)","A491":"ATTIMIS (UD)","A492":"ATZARA (NU)","A493":"AUDITORE (PU)","A494":"AUGUSTA (SR)","A495":"AULETTA (SA)","A496":"AULLA (MS)","A497":"AURANO (VB)","A499":"AURIGO (IM)","A501":"AURONZO DI CADORE (BL)","A502":"AUSONIA (FR)","A503":"AUSTIS (NU)","A506":"AVEGNO (GE)","A507":"AVELENGO .HAFLING. (BZ)","A508":"AVELLA (AV)","A509":"AVELLINO (AV)","A511":"AVERARA (BG)","A512":"AVERSA (CE)","A514":"AVETRANA (TA)","A515":"AVEZZANO (AQ)","A516":"AVIANO (PN)","A517":"AVIATICO (BG)","A518":"AVIGLIANA (TO)","A519":"AVIGLIANO (PZ)","M258":"AVIGLIANO UMBRO (TR)","A520":"AVIO (TN)","A521":"AVISE (AO)","A522":"AVOLA (SR)","A523":"AVOLASCA (AL)","A094":"AYAS (AO)","A108":"AYMAVILLES (AO)","A525":"AZEGLIO (TO)","A526":"AZZANELLO (CR)","A527":"AZZANO D'ASTI (AT)","A530":"AZZANO DECIMO (PN)","A529":"AZZANO MELLA (BS)","A528":"AZZANO SAN PAOLO (BG)","A531":"AZZATE (VA)","A532":"AZZIO (VA)","A533":"AZZONE (BG)","A534":"BACENO (VB)","A535":"BACOLI (NA)","A536":"BADALUCCO (IM)","M214":"BADESI (SS)","A537":"BADIA .ABTEI. (BZ)","A540":"BADIA CALAVENA (VR)","A538":"BADIA PAVESE (PV)","A539":"BADIA POLESINE (RO)","A541":"BADIA TEDALDA (AR)","A542":"BADOLATO (CZ)","A544":"BAGALADI (RC)","A546":"BAGHERIA (PA)","A547":"BAGNACAVALLO (RA)","A552":"BAGNARA CALABRA (RC)","A551":"BAGNARA DI ROMAGNA (RA)","A550":"BAGNARIA (PV)","A553":"BAGNARIA ARSA (UD)","A555":"BAGNASCO (CN)","A557":"BAGNATICA (BG)","A560":"BAGNI DI LUCCA (LU)","A564":"BAGNO A RIPOLI (FI)","A565":"BAGNO DI ROMAGNA (FC)","A567":"BAGNOLI DEL TRIGNO (IS)","A568":"BAGNOLI DI SOPRA (PD)","A566":"BAGNOLI IRPINO (AV)","A570":"BAGNOLO CREMASCO (CR)","A572":"BAGNOLO DEL SALENTO (LE)","A574":"BAGNOLO DI PO (RO)","A573":"BAGNOLO IN PIANO (RE)","A569":"BAGNOLO MELLA (BS)","A571":"BAGNOLO PIEMONTE (CN)","A575":"BAGNOLO SAN VITO (MN)","A576":"BAGNONE (MS)","A577":"BAGNOREGIO (VT)","A578":"BAGOLINO (BS)","A579":"BAIA E LATINA (CE)","A580":"BAIANO (AV)","A581":"BAIARDO (IM)","A584":"BAIRO (TO)","A586":"BAISO (RE)","A587":"BALANGERO (TO)","A588":"BALDICHIERI D'ASTI (AT)","A590":"BALDISSERO CANAVESE (TO)","A589":"BALDISSERO D'ALBA (CN)","A591":"BALDISSERO TORINESE (TO)","A592":"BALESTRATE (PA)","A593":"BALESTRINO (SV)","A594":"BALLABIO (LC)","A597":"BALLAO (CA)","A599":"BALME (TO)","A600":"BALMUCCIA (VC)","A601":"BALOCCO (VC)","A603":"BALSORANO (AQ)","A604":"BALVANO (PZ)","A605":"BALZOLA (AL)","A606":"BANARI (SS)","A607":"BANCHETTE (TO)","A610":"BANNIO ANZINO (VB)","A612":"BANZI (PZ)","A613":"BAONE (PD)","A614":"BARADILI (OR)","A615":"BARAGIANO (PZ)","A616":"BARANELLO (CB)","A617":"BARANO D'ISCHIA (NA)","A618":"BARANZATE (MI)","A619":"BARASSO (VA)","A621":"BARATILI SAN PIETRO (OR)","A625":"BARBANIA (TO)","A626":"BARBARA (AN)","A628":"BARBARANO ROMANO (VT)","A627":"BARBARANO VICENTINO (VI)","A629":"BARBARESCO (CN)","A630":"BARBARIGA (BS)","A631":"BARBATA (BG)","A632":"BARBERINO DI MUGELLO (FI)","A633":"BARBERINO VAL D'ELSA (FI)","A634":"BARBIANELLO (PV)","A635":"BARBIANO .BARBIAN. (BZ)","A637":"BARBONA (PD)","A638":"BARCELLONA POZZO DI GOTTO (ME)","A639":"BARCHI (PU)","A640":"BARCIS (PN)","A643":"BARD (AO)","A645":"BARDELLO (VA)","A646":"BARDI (PR)","A647":"BARDINETO (SV)","A650":"BARDOLINO (VR)","A651":"BARDONECCHIA (TO)","A652":"BAREGGIO (MI)","A653":"BARENGO (NO)","A655":"BARESSA (OR)","A656":"BARETE (AQ)","A657":"BARGA (LU)","A658":"BARGAGLI (GE)","A660":"BARGE (CN)","A661":"BARGHE (BS)","A662":"BARI (BA)","A663":"BARI SARDO (NU)","A664":"BARIANO (BG)","A665":"BARICELLA (BO)","A666":"BARILE (PZ)","A667":"BARISCIANO (AQ)","A668":"BARLASSINA (MI)","A669":"BARLETTA (BA)","A670":"BARNI (CO)","A671":"BAROLO (CN)","A673":"BARONE CANAVESE (TO)","A674":"BARONISSI (SA)","A676":"BARRAFRANCA (EN)","A677":"BARRALI (CA)","A678":"BARREA (AQ)","A681":"BARUMINI (CA)","A683":"BARZAGO (LC)","A684":"BARZANA (BG)","A686":"BARZANO' (LC)","A687":"BARZIO (LC)","A689":"BASALUZZO (AL)","A690":"BASCAPE' (PV)","A691":"BASCHI (TR)","A692":"BASCIANO (TE)","A694":"BASELGA DI PINE' (TN)","A696":"BASELICE (BN)","A697":"BASIANO (MI)","A698":"BASICO' (ME)","A699":"BASIGLIO (MI)","A700":"BASILIANO (UD)","A702":"BASSANO BRESCIANO (BS)","A703":"BASSANO DEL GRAPPA (VI)","A706":"BASSANO IN TEVERINA (VT)","A704":"BASSANO ROMANO (VT)","A707":"BASSIANO (LT)","A708":"BASSIGNANA (AL)","A709":"BASTIA MONDOVI' (CN)","A710":"BASTIA UMBRA (PG)","A711":"BASTIDA DE' DOSSI (PV)","A712":"BASTIDA PANCARANA (PV)","A713":"BASTIGLIA (MO)","A714":"BATTAGLIA TERME (PD)","A716":"BATTIFOLLO (CN)","A717":"BATTIPAGLIA (SA)","A718":"BATTUDA (PV)","A719":"BAUCINA (PA)","A721":"BAULADU (OR)","A722":"BAUNEI (NU)","A725":"BAVENO (VB)","A726":"BAZZANO (BO)","A728":"BEDERO VALCUVIA (VA)","A729":"BEDIZZOLE (BS)","A730":"BEDOLLO (TN)","A731":"BEDONIA (PR)","A732":"BEDULITA (BG)","A733":"BEE (VB)","A734":"BEINASCO (TO)","A735":"BEINETTE (CN)","A736":"BELCASTRO (CZ)","A737":"BELFIORE (VR)","A740":"BELFORTE ALL'ISAURO (PU)","A739":"BELFORTE DEL CHIENTI (MC)","A738":"BELFORTE MONFERRATO (AL)","A741":"BELGIOIOSO (PV)","A742":"BELGIRATE (VB)","A743":"BELLA (PZ)","A744":"BELLAGIO (CO)","A745":"BELLANO (LC)","A746":"BELLANTE (TE)","A747":"BELLARIA-IGEA MARINA (RN)","A749":"BELLEGRA (RM)","A750":"BELLINO (CN)","A751":"BELLINZAGO LOMBARDO (MI)","A752":"BELLINZAGO NOVARESE (NO)","M294":"BELLIZZI (SA)","A755":"BELLONA (CE)","A756":"BELLOSGUARDO (SA)","A757":"BELLUNO (BL)","A759":"BELLUSCO (MI)","A762":"BELMONTE CALABRO (CS)","A763":"BELMONTE CASTELLO (FR)","A761":"BELMONTE DEL SANNIO (IS)","A765":"BELMONTE IN SABINA (RI)","A764":"BELMONTE MEZZAGNO (PA)","A760":"BELMONTE PICENO (AP)","A766":"BELPASSO (CT)","A768":"BELSITO (CS)","A772":"BELVEDERE DI SPINELLO (KR)","A774":"BELVEDERE LANGHE (CN)","A773":"BELVEDERE MARITTIMO (CS)","A769":"BELVEDERE OSTRENSE (AN)","A770":"BELVEGLIO (AT)","A776":"BELVI (NU)","A777":"BEMA (SO)","A778":"BENE LARIO (CO)","A779":"BENE VAGIENNA (CN)","A780":"BENESTARE (RC)","A781":"BENETUTTI (SS)","A782":"BENEVELLO (CN)","A783":"BENEVENTO (BN)","A784":"BENNA (BI)","A785":"BENTIVOGLIO (BO)","A786":"BERBENNO (BG)","A787":"BERBENNO DI VALTELLINA (SO)","A788":"BERCETO (PR)","A789":"BERCHIDDA (SS)","A791":"BEREGAZZO CON FIGLIARO (CO)","A792":"BEREGUARDO (PV)","A793":"BERGAMASCO (AL)","A794":"BERGAMO (BG)","A795":"BERGANTINO (RO)","A796":"BERGEGGI (SV)","A798":"BERGOLO (CN)","A799":"BERLINGO (BS)","A801":"BERNALDA (MT)","A802":"BERNAREGGIO (MI)","A804":"BERNATE TICINO (MI)","A805":"BERNEZZO (CN)","A806":"BERRA (FE)","A808":"BERSONE (TN)","A809":"BERTINORO (FC)","A810":"BERTIOLO (UD)","A811":"BERTONICO (LO)","A812":"BERZANO DI SAN PIETRO (AT)","A813":"BERZANO DI TORTONA (AL)","A816":"BERZO DEMO (BS)","A817":"BERZO INFERIORE (BS)","A815":"BERZO SAN FERMO (BG)","A818":"BESANA IN BRIANZA (MI)","A819":"BESANO (VA)","A820":"BESATE (MI)","A821":"BESENELLO (TN)","A823":"BESENZONE (PC)","A825":"BESNATE (VA)","A826":"BESOZZO (VA)","A827":"BESSUDE (SS)","A831":"BETTOLA (PC)","A832":"BETTONA (PG)","A834":"BEURA-CARDEZZA (VB)","A835":"BEVAGNA (PG)","A836":"BEVERINO (SP)","A837":"BEVILACQUA (VR)","A839":"BEZZECCA (TN)","A841":"BIANCAVILLA (CT)","A842":"BIANCHI (CS)","A843":"BIANCO (RC)","A844":"BIANDRATE (NO)","A845":"BIANDRONNO (VA)","A846":"BIANZANO (BG)","A847":"BIANZE' (VC)","A848":"BIANZONE (SO)","A849":"BIASSONO (MI)","A850":"BIBBIANO (RE)","A851":"BIBBIENA (AR)","A852":"BIBBONA (LI)","A853":"BIBIANA (TO)","A854":"BICCARI (FG)","A855":"BICINICCO (UD)","A856":"BIDONI' (OR)","A859":"BIELLA (BI)","A861":"BIENNO (BS)","A863":"BIENO (TN)","A864":"BIENTINA (PI)","A866":"BIGARELLO (MN)","A870":"BINAGO (CO)","A872":"BINASCO (MI)","A874":"BINETTO (BA)","A876":"BIOGLIO (BI)","A877":"BIONAZ (AO)","A878":"BIONE (BS)","A880":"BIRORI (NU)","A881":"BISACCIA (AV)","A882":"BISACQUINO (PA)","A883":"BISCEGLIE (BA)","A884":"BISEGNA (AQ)","A885":"BISENTI (TE)","A887":"BISIGNANO (CS)","A889":"BISTAGNO (AL)","A891":"BISUSCHIO (VA)","A892":"BITETTO (BA)","A893":"BITONTO (BA)","A894":"BITRITTO (BA)","A895":"BITTI (NU)","A896":"BIVONA (AG)","A897":"BIVONGI (RC)","A898":"BIZZARONE (CO)","A901":"BLEGGIO INFERIORE (TN)","A902":"BLEGGIO SUPERIORE (TN)","A903":"BLELLO (BG)","A857":"BLERA (VT)","A904":"BLESSAGNO (CO)","A905":"BLEVIO (CO)","M268":"BLUFI (PA)","A906":"BOARA PISANI (PD)","A909":"BOBBIO (PC)","A910":"BOBBIO PELLICE (TO)","A911":"BOCA (NO)","A912":"BOCCHIGLIERO (CS)","A914":"BOCCIOLETO (VC)","A916":"BOCENAGO (TN)","A918":"BODIO LOMNAGO (VA)","A919":"BOFFALORA D'ADDA (LO)","A920":"BOFFALORA SOPRA TICINO (MI)","A922":"BOGLIASCO (GE)","A925":"BOGNANCO (VB)","A929":"BOGOGNO (NO)","A930":"BOIANO (CB)","A931":"BOISSANO (SV)","A932":"BOLANO (SP)","A933":"BOLBENO (TN)","A937":"BOLGARE (BG)","A940":"BOLLATE (MI)","A941":"BOLLENGO (TO)","A944":"BOLOGNA (BO)","A945":"BOLOGNANO (PE)","A946":"BOLOGNETTA (PA)","A947":"BOLOGNOLA (MC)","A948":"BOLOTANA (NU)","A949":"BOLSENA (VT)","A950":"BOLTIERE (BG)","A952":"BOLZANO .BOZEN. (BZ)","A953":"BOLZANO NOVARESE (NO)","A954":"BOLZANO VICENTINO (VI)","A955":"BOMARZO (VT)","A956":"BOMBA (CH)","A957":"BOMPENSIERE (CL)","A958":"BOMPIETRO (PA)","A959":"BOMPORTO (MO)","A960":"BONARCADO (OR)","A961":"BONASSOLA (SP)","A963":"BONATE SOPRA (BG)","A962":"BONATE SOTTO (BG)","A964":"BONAVIGO (VR)","A965":"BONDENO (FE)","A967":"BONDO (TN)","A968":"BONDONE (TN)","A970":"BONEA (BN)","A971":"BONEFRO (CB)","A972":"BONEMERSE (CR)","A973":"BONIFATI (CS)","A975":"BONITO (AV)","A976":"BONNANARO (SS)","A977":"BONO (SS)","A978":"BONORVA (SS)","A979":"BONVICINO (CN)","A981":"BORBONA (RI)","A982":"BORCA DI CADORE (BL)","A983":"BORDANO (UD)","A984":"BORDIGHERA (IM)","A986":"BORDOLANO (CR)","A987":"BORE (PR)","A988":"BORETTO (RE)","A989":"BORGARELLO (PV)","A990":"BORGARO TORINESE (TO)","A991":"BORGETTO (PA)","A993":"BORGHETTO D'ARROSCIA (IM)","A998":"BORGHETTO DI BORBERA (AL)","A992":"BORGHETTO DI VARA (SP)","A995":"BORGHETTO LODIGIANO (LO)","A999":"BORGHETTO SANTO SPIRITO (SV)","B001":"BORGHI (FC)","B002":"BORGIA (CZ)","B003":"BORGIALLO (TO)","B005":"BORGIO VEREZZI (SV)","B007":"BORGO A MOZZANO (LU)","B009":"BORGO D'ALE (VC)","B010":"BORGO DI TERZO (BG)","B026":"BORGO PACE (PU)","B028":"BORGO PRIOLO (PV)","B033":"BORGO SAN DALMAZZO (CN)","B035":"BORGO SAN GIACOMO (BS)","B017":"BORGO SAN GIOVANNI (LO)","B036":"BORGO SAN LORENZO (FI)","B037":"BORGO SAN MARTINO (AL)","B038":"BORGO SAN SIRO (PV)","B043":"BORGO TICINO (NO)","B044":"BORGO TOSSIGNANO (BO)","B042":"BORGO VAL DI TARO (PR)","B006":"BORGO VALSUGANA (TN)","A996":"BORGO VELINO (RI)","B046":"BORGO VERCELLI (VC)","B011":"BORGOFORTE (MN)","B015":"BORGOFRANCO D'IVREA (TO)","B013":"BORGOFRANCO SUL PO (MN)","B016":"BORGOLAVEZZARO (NO)","B018":"BORGOMALE (CN)","B019":"BORGOMANERO (NO)","B020":"BORGOMARO (IM)","B021":"BORGOMASINO (TO)","B024":"BORGONE SUSA (TO)","B025":"BORGONOVO VAL TIDONE (PC)","B029":"BORGORATTO ALESSANDRINO (AL)","B030":"BORGORATTO MORMOROLO (PV)","B031":"BORGORICCO (PD)","B008":"BORGOROSE (RI)","B040":"BORGOSATOLLO (BS)","B041":"BORGOSESIA (VC)","B048":"BORMIDA (SV)","B049":"BORMIO (SO)","B051":"BORNASCO (PV)","B054":"BORNO (BS)","B055":"BORONEDDU (OR)","B056":"BORORE (NU)","B057":"BORRELLO (CH)","B058":"BORRIANA (BI)","B061":"BORSO DEL GRAPPA (TV)","B062":"BORTIGALI (NU)","B063":"BORTIGIADAS (SS)","B064":"BORUTTA (SS)","B067":"BORZONASCA (GE)","B068":"BOSA (NU)","B069":"BOSARO (RO)","B070":"BOSCHI SANT'ANNA (VR)","B073":"BOSCO CHIESANUOVA (VR)","B071":"BOSCO MARENGO (AL)","B075":"BOSCONERO (TO)","B076":"BOSCOREALE (NA)","B077":"BOSCOTRECASE (NA)","B078":"BOSENTINO (TN)","B079":"BOSIA (CN)","B080":"BOSIO (AL)","B081":"BOSISIO PARINI (LC)","B082":"BOSNASCO (PV)","B083":"BOSSICO (BG)","B084":"BOSSOLASCO (CN)","B085":"BOTRICELLO (CZ)","B086":"BOTRUGNO (LE)","B088":"BOTTANUCO (BG)","B091":"BOTTICINO (BS)","B094":"BOTTIDDA (SS)","B097":"BOVA (RC)","B099":"BOVA MARINA (RC)","B098":"BOVALINO (RC)","B100":"BOVEGNO (BS)","B101":"BOVES (CN)","B102":"BOVEZZO (BS)","A720":"BOVILLE ERNICA (FR)","B104":"BOVINO (FG)","B105":"BOVISIO-MASCIAGO (MI)","B106":"BOVOLENTA (PD)","B107":"BOVOLONE (VR)","B109":"BOZZOLE (AL)","B110":"BOZZOLO (MN)","B111":"BRA (CN)","B112":"BRACCA (BG)","B114":"BRACCIANO (RM)","B115":"BRACIGLIANO (SA)","B116":"BRAIES .PRAGS. (BZ)","B117":"BRALLO DI PREGOLA (PV)","B118":"BRANCALEONE (RC)","B120":"BRANDICO (BS)","B121":"BRANDIZZO (TO)","B123":"BRANZI (BG)","B124":"BRAONE (BS)","B126":"BREBBIA (VA)","B128":"BREDA DI PIAVE (TV)","B131":"BREGANO (VA)","B132":"BREGANZE (VI)","B134":"BREGNANO (CO)","B135":"BREGUZZO (TN)","B136":"BREIA (VC)","B137":"BREMBATE (BG)","B138":"BREMBATE DI SOPRA (BG)","B140":"BREMBILLA (BG)","B141":"BREMBIO (LO)","B142":"BREME (PV)","B143":"BRENDOLA (VI)","B144":"BRENNA (CO)","B145":"BRENNERO .BRENNER. (BZ)","B149":"BRENO (BS)","B150":"BRENTA (VA)","B152":"BRENTINO BELLUNO (VR)","B153":"BRENTONICO (TN)","B154":"BRENZONE (VR)","B156":"BRESCELLO (RE)","B157":"BRESCIA (BS)","B158":"BRESIMO (TN)","B159":"BRESSANA BOTTARONE (PV)","B160":"BRESSANONE .BRIXEN. (BZ)","B161":"BRESSANVIDO (VI)","B162":"BRESSO (MI)","B165":"BREZ (TN)","B166":"BREZZO DI BEDERO (VA)","B167":"BRIAGLIA (CN)","B169":"BRIATICO (VV)","B171":"BRICHERASIO (TO)","B172":"BRIENNO (CO)","B173":"BRIENZA (PZ)","B175":"BRIGA ALTA (CN)","B176":"BRIGA NOVARESE (NO)","B178":"BRIGNANO GERA D'ADDA (BG)","B179":"BRIGNANO-FRASCATA (AL)","B180":"BRINDISI (BR)","B181":"BRINDISI MONTAGNA (PZ)","B182":"BRINZIO (VA)","B183":"BRIONA (NO)","B184":"BRIONE (BS)","B185":"BRIONE (TN)","B187":"BRIOSCO (MI)","B188":"BRISIGHELLA (RA)","B191":"BRISSAGO-VALTRAVAGLIA (VA)","B192":"BRISSOGNE (AO)","B193":"BRITTOLI (PE)","B194":"BRIVIO (LC)","B195":"BROCCOSTELLA (FR)","B196":"BROGLIANO (VI)","B197":"BROGNATURO (VV)","B198":"BROLO (ME)","B200":"BRONDELLO (CN)","B201":"BRONI (PV)","B202":"BRONTE (CT)","B203":"BRONZOLO .BRANZOLL. (BZ)","B204":"BROSSASCO (CN)","B205":"BROSSO (TO)","B207":"BROVELLO-CARPUGNINO (VB)","B209":"BROZOLO (TO)","B212":"BRUGHERIO (MI)","B213":"BRUGINE (PD)","B214":"BRUGNATO (SP)","B215":"BRUGNERA (PN)","B216":"BRUINO (TO)","B217":"BRUMANO (BG)","B218":"BRUNATE (CO)","B219":"BRUNELLO (VA)","B220":"BRUNICO .BRUNECK. (BZ)","B221":"BRUNO (AT)","B223":"BRUSAPORTO (BG)","B225":"BRUSASCO (TO)","B227":"BRUSCIANO (NA)","B228":"BRUSIMPIANO (VA)","B229":"BRUSNENGO (BI)","B230":"BRUSSON (AO)","B232":"BRUZOLO (TO)","B234":"BRUZZANO ZEFFIRIO (RC)","B235":"BUBBIANO (MI)","B236":"BUBBIO (AT)","B237":"BUCCHERI (SR)","B238":"BUCCHIANICO (CH)","B239":"BUCCIANO (BN)","B240":"BUCCINASCO (MI)","B242":"BUCCINO (SA)","B243":"BUCINE (AR)","B246":"BUDDUSO' (SS)","B247":"BUDOIA (PN)","B248":"BUDONI (NU)","B249":"BUDRIO (BO)","B250":"BUGGERRU (CA)","B251":"BUGGIANO (PT)","B255":"BUGLIO IN MONTE (SO)","B256":"BUGNARA (AQ)","B258":"BUGUGGIATE (VA)","B259":"BUJA (UD)","B261":"BULCIAGO (LC)","B262":"BULGAROGRASSO (CO)","B264":"BULTEI (SS)","B265":"BULZI (SS)","B266":"BUONABITACOLO (SA)","B267":"BUONALBERGO (BN)","B269":"BUONCONVENTO (SI)","B270":"BUONVICINO (CS)","B272":"BURAGO DI MOLGORA (MI)","B274":"BURCEI (CA)","B275":"BURGIO (AG)","B276":"BURGOS (SS)","B278":"BURIASCO (TO)","B279":"BUROLO (TO)","B280":"BURONZO (VC)","B281":"BUSACHI (OR)","B282":"BUSALLA (GE)","B283":"BUSANA (RE)","B284":"BUSANO (TO)","B285":"BUSCA (CN)","B286":"BUSCATE (MI)","B287":"BUSCEMI (SR)","B288":"BUSETO PALIZZOLO (TP)","B289":"BUSNAGO (MI)","B292":"BUSSERO (MI)","B293":"BUSSETO (PR)","B294":"BUSSI SUL TIRINO (PE)","B295":"BUSSO (CB)","B296":"BUSSOLENGO (VR)","B297":"BUSSOLENO (TO)","B300":"BUSTO ARSIZIO (VA)","B301":"BUSTO GAROLFO (MI)","B302":"BUTERA (CL)","B303":"BUTI (PI)","B304":"BUTTAPIETRA (VR)","B305":"BUTTIGLIERA ALTA (TO)","B306":"BUTTIGLIERA D'ASTI (AT)","B309":"BUTTRIO (UD)","B320":"CA' D'ANDREA (CR)","B311":"CABELLA LIGURE (AL)","B313":"CABIATE (CO)","B314":"CABRAS (OR)","B315":"CACCAMO (PA)","B319":"CACCURI (KR)","B326":"CADEGLIANO-VICONAGO (VA)","B328":"CADELBOSCO DI SOPRA (RE)","B332":"CADEO (PC)","B335":"CADERZONE (TN)","B345":"CADONEGHE (PD)","B346":"CADORAGO (CO)","B347":"CADREZZATE (VA)","B349":"CAERANO DI SAN MARCO (TV)","B350":"CAFASSE (TO)","B351":"CAGGIANO (SA)","B352":"CAGLI (PU)","B354":"CAGLIARI (CA)","B355":"CAGLIO (CO)","B358":"CAGNANO AMITERNO (AQ)","B357":"CAGNANO VARANO (FG)","B359":"CAGNO (CO)","B360":"CAGNO' (TN)","B361":"CAIANELLO (CE)","B362":"CAIAZZO (CE)","B364":"CAINES .KUENS. (BZ)","B365":"CAINO (BS)","B366":"CAIOLO (SO)","B367":"CAIRANO (AV)","B368":"CAIRATE (VA)","B369":"CAIRO MONTENOTTE (SV)","B371":"CAIVANO (NA)","B374":"CALABRITTO (AV)","B375":"CALALZO DI CADORE (BL)","B376":"CALAMANDRANA (AT)","B377":"CALAMONACI (AG)","B378":"CALANGIANUS (SS)","B379":"CALANNA (RC)","B380":"CALASCA-CASTIGLIONE (VB)","B381":"CALASCIBETTA (EN)","B382":"CALASCIO (AQ)","B383":"CALASETTA (CA)","B384":"CALATABIANO (CT)","B385":"CALATAFIMI (TP)","B386":"CALAVINO (TN)","B388":"CALCATA (VT)","B389":"CALCERANICA AL LAGO (TN)","B390":"CALCI (PI)","B391":"CALCIANO (MT)","B392":"CALCINAIA (PI)","B393":"CALCINATE (BG)","B394":"CALCINATO (BS)","B395":"CALCIO (BG)","B396":"CALCO (LC)","B397":"CALDARO SULLA STRADA DEL VINO .KALTERN AN DE. (BZ)","B398":"CALDAROLA (MC)","B399":"CALDERARA DI RENO (BO)","B400":"CALDES (TN)","B402":"CALDIERO (VR)","B403":"CALDOGNO (VI)","B404":"CALDONAZZO (TN)","B405":"CALENDASCO (PC)","B406":"CALENZANO (FI)","B408":"CALESTANO (PR)","B410":"CALICE AL CORNOVIGLIO (SP)","B409":"CALICE LIGURE (SV)","B413":"CALIMERA (LE)","B415":"CALITRI (AV)","B416":"CALIZZANO (SV)","B417":"CALLABIANA (BI)","B418":"CALLIANO (AT)","B419":"CALLIANO (TN)","B423":"CALOLZIOCORTE (LC)","B424":"CALOPEZZATI (CS)","B425":"CALOSSO (AT)","B426":"CALOVETO (CS)","B427":"CALTABELLOTTA (AG)","B428":"CALTAGIRONE (CT)","B429":"CALTANISSETTA (CL)","B430":"CALTAVUTURO (PA)","B431":"CALTIGNAGA (NO)","B432":"CALTO (RO)","B433":"CALTRANO (VI)","B434":"CALUSCO D'ADDA (BG)","B435":"CALUSO (TO)","B436":"CALVAGESE DELLA RIVIERA (BS)","B437":"CALVANICO (SA)","B439":"CALVATONE (CR)","B440":"CALVELLO (PZ)","B441":"CALVENE (VI)","B442":"CALVENZANO (BG)","B443":"CALVERA (PZ)","B444":"CALVI (BN)","B446":"CALVI DELL'UMBRIA (TR)","B445":"CALVI RISORTA (CE)","B447":"CALVIGNANO (PV)","B448":"CALVIGNASCO (MI)","B450":"CALVISANO (BS)","B452":"CALVIZZANO (NA)","B453":"CAMAGNA MONFERRATO (AL)","B455":"CAMAIORE (LU)","B456":"CAMAIRAGO (LO)","B457":"CAMANDONA (BI)","B460":"CAMASTRA (AG)","B461":"CAMBIAGO (MI)","B462":"CAMBIANO (TO)","B463":"CAMBIASCA (VB)","B465":"CAMBURZANO (BI)","B467":"CAMERANA (CN)","B468":"CAMERANO (AN)","B469":"CAMERANO CASASCO (AT)","B471":"CAMERATA CORNELLO (BG)","B472":"CAMERATA NUOVA (RM)","B470":"CAMERATA PICENA (AN)","B473":"CAMERI (NO)","B474":"CAMERINO (MC)","B476":"CAMEROTA (SA)","B477":"CAMIGLIANO (CE)","B479":"CAMINATA (PC)","B481":"CAMINI (RC)","B482":"CAMINO (AL)","B483":"CAMINO AL TAGLIAMENTO (UD)","B484":"CAMISANO (CR)","B485":"CAMISANO VICENTINO (VI)","B486":"CAMMARATA (AG)","B489":"CAMO (CN)","B490":"CAMOGLI (GE)","B492":"CAMPAGNA (SA)","B493":"CAMPAGNA LUPIA (VE)","B496":"CAMPAGNANO DI ROMA (RM)","B497":"CAMPAGNATICO (GR)","B498":"CAMPAGNOLA CREMASCA (CR)","B499":"CAMPAGNOLA EMILIA (RE)","B500":"CAMPANA (CS)","B501":"CAMPARADA (MI)","B502":"CAMPEGINE (RE)","B504":"CAMPELLO SUL CLITUNNO (PG)","B505":"CAMPERTOGNO (VC)","B507":"CAMPI BISENZIO (FI)","B506":"CAMPI SALENTINA (LE)","B508":"CAMPIGLIA CERVO (BI)","B511":"CAMPIGLIA DEI BERICI (VI)","B509":"CAMPIGLIA MARITTIMA (LI)","B512":"CAMPIGLIONE FENILE (TO)","B513":"CAMPIONE D'ITALIA (CO)","B514":"CAMPITELLO DI FASSA (TN)","B515":"CAMPLI (TE)","B516":"CAMPO CALABRO (RC)","B526":"CAMPO DI GIOVE (AQ)","B529":"CAMPO DI TRENS .FREIENFELD. (BZ)","B538":"CAMPO LIGURE (GE)","B553":"CAMPO NELL'ELBA (LI)","B564":"CAMPO SAN MARTINO (PD)","B570":"CAMPO TURES .SAND IN TAUFERS. (BZ)","B519":"CAMPOBASSO (CB)","B520":"CAMPOBELLO DI LICATA (AG)","B521":"CAMPOBELLO DI MAZARA (TP)","B522":"CAMPOCHIARO (CB)","B524":"CAMPODARSEGO (PD)","B525":"CAMPODENNO (TN)","B527":"CAMPODIMELE (LT)","B528":"CAMPODIPIETRA (CB)","B530":"CAMPODOLCINO (SO)","B531":"CAMPODORO (PD)","B533":"CAMPOFELICE DI FITALIA (PA)","B532":"CAMPOFELICE DI ROCCELLA (PA)","B534":"CAMPOFILONE (AP)","B535":"CAMPOFIORITO (PA)","B536":"CAMPOFORMIDO (UD)","B537":"CAMPOFRANCO (CL)","B539":"CAMPOGALLIANO (MO)","B541":"CAMPOLATTARO (BN)","B543":"CAMPOLI APPENNINO (FR)","B542":"CAMPOLI DEL MONTE TABURNO (BN)","B544":"CAMPOLIETO (CB)","B545":"CAMPOLONGO AL TORRE (UD)","B546":"CAMPOLONGO MAGGIORE (VE)","B547":"CAMPOLONGO SUL BRENTA (VI)","B549":"CAMPOMAGGIORE (PZ)","B550":"CAMPOMARINO (CB)","B551":"CAMPOMORONE (GE)","B554":"CAMPONOGARA (VE)","B555":"CAMPORA (SA)","B556":"CAMPOREALE (PA)","B557":"CAMPORGIANO (LU)","B559":"CAMPOROSSO (IM)","B562":"CAMPOROTONDO DI FIASTRONE (MC)","B561":"CAMPOROTONDO ETNEO (CT)","B563":"CAMPOSAMPIERO (PD)","B565":"CAMPOSANO (NA)","B566":"CAMPOSANTO (MO)","B567":"CAMPOSPINOSO (PV)","B569":"CAMPOTOSTO (AQ)","B572":"CAMUGNANO (BO)","B577":"CANAL SAN BOVO (TN)","B573":"CANALE (CN)","B574":"CANALE D'AGORDO (BL)","B576":"CANALE MONTERANO (RM)","B578":"CANARO (RO)","B579":"CANAZEI (TN)","B580":"CANCELLARA (PZ)","B581":"CANCELLO ED ARNONE (CE)","B582":"CANDA (RO)","B584":"CANDELA (FG)","B586":"CANDELO (BI)","B588":"CANDIA CANAVESE (TO)","B587":"CANDIA LOMELLINA (PV)","B589":"CANDIANA (PD)","B590":"CANDIDA (AV)","B591":"CANDIDONI (RC)","B592":"CANDIOLO (TO)","B593":"CANEGRATE (MI)","B594":"CANELLI (AT)","B597":"CANEPINA (VT)","B598":"CANEVA (PN)","B599":"CANEVINO (PV)","B602":"CANICATTI' (AG)","B603":"CANICATTINI BAGNI (SR)","B604":"CANINO (VT)","B605":"CANISCHIO (TO)","B606":"CANISTRO (AQ)","B607":"CANNA (CS)","B608":"CANNALONGA (SA)","B609":"CANNARA (PG)","B610":"CANNERO RIVIERA (VB)","B613":"CANNETO PAVESE (PV)","B612":"CANNETO SULL'OGLIO (MN)","B615":"CANNOBIO (VB)","B616":"CANNOLE (LE)","B617":"CANOLO (RC)","B618":"CANONICA D'ADDA (BG)","B619":"CANOSA DI PUGLIA (BA)","B620":"CANOSA SANNITA (CH)","B621":"CANOSIO (CN)","C669":"CANOSSA (RE)","B624":"CANSANO (AQ)","B626":"CANTAGALLO (PO)","B627":"CANTALICE (RI)","B628":"CANTALUPA (TO)","B631":"CANTALUPO IN SABINA (RI)","B629":"CANTALUPO LIGURE (AL)","B630":"CANTALUPO NEL SANNIO (IS)","B633":"CANTARANA (AT)","B634":"CANTELLO (VA)","B635":"CANTERANO (RM)","B636":"CANTIANO (PU)","B637":"CANTOIRA (TO)","B639":"CANTU' (CO)","B640":"CANZANO (TE)","B641":"CANZO (CO)","B642":"CAORLE (VE)","B643":"CAORSO (PC)","B644":"CAPACCIO (SA)","B645":"CAPACI (PA)","B646":"CAPALBIO (GR)","B647":"CAPANNOLI (PI)","B648":"CAPANNORI (LU)","B649":"CAPENA (RM)","B650":"CAPERGNANICA (CR)","B651":"CAPESTRANO (AQ)","B653":"CAPIAGO INTIMIANO (CO)","B655":"CAPISTRANO (VV)","B656":"CAPISTRELLO (AQ)","B658":"CAPITIGNANO (AQ)","B660":"CAPIZZI (ME)","B661":"CAPIZZONE (BG)","B664":"CAPO DI PONTE (BS)","B666":"CAPO D'ORLANDO (ME)","B663":"CAPODIMONTE (VT)","B667":"CAPODRISE (CE)","B669":"CAPOLIVERI (LI)","B670":"CAPOLONA (AR)","B671":"CAPONAGO (MI)","B672":"CAPORCIANO (AQ)","B674":"CAPOSELE (AV)","B675":"CAPOTERRA (CA)","B676":"CAPOVALLE (BS)","B677":"CAPPADOCIA (AQ)","B679":"CAPPELLA CANTONE (CR)","B680":"CAPPELLA DE' PICENARDI (CR)","B678":"CAPPELLA MAGGIORE (TV)","B681":"CAPPELLE SUL TAVO (PE)","B682":"CAPRACOTTA (IS)","B684":"CAPRAIA E LIMITE (FI)","B685":"CAPRAIA ISOLA (LI)","B686":"CAPRALBA (CR)","B688":"CAPRANICA (VT)","B687":"CAPRANICA PRENESTINA (RM)","B690":"CAPRARICA DI LECCE (LE)","B691":"CAPRAROLA (VT)","B692":"CAPRAUNA (CN)","B693":"CAPRESE MICHELANGELO (AR)","B694":"CAPREZZO (VB)","B696":"CAPRI (NA)","B695":"CAPRI LEONE (ME)","B697":"CAPRIANA (TN)","B698":"CAPRIANO DEL COLLE (BS)","B701":"CAPRIATA D'ORBA (AL)","B703":"CAPRIATE SAN GERVASIO (BG)","B704":"CAPRIATI A VOLTURNO (CE)","B705":"CAPRIE (TO)","B706":"CAPRIGLIA IRPINA (AV)","B707":"CAPRIGLIO (AT)","B708":"CAPRILE (BI)","B710":"CAPRINO BERGAMASCO (BG)","B709":"CAPRINO VERONESE (VR)","B711":"CAPRIOLO (BS)","B712":"CAPRIVA DEL FRIULI (GO)","B715":"CAPUA (CE)","B716":"CAPURSO (BA)","B718":"CARAFFA DEL BIANCO (RC)","B717":"CARAFFA DI CATANZARO (CZ)","B719":"CARAGLIO (CN)","B720":"CARAMAGNA PIEMONTE (CN)","B722":"CARAMANICO TERME (PE)","B723":"CARANO (TN)","B724":"CARAPELLE (FG)","B725":"CARAPELLE CALVISIO (AQ)","B726":"CARASCO (GE)","B727":"CARASSAI (AP)","B729":"CARATE BRIANZA (MI)","B730":"CARATE URIO (CO)","B731":"CARAVAGGIO (BG)","B732":"CARAVATE (VA)","B733":"CARAVINO (TO)","B734":"CARAVONICA (IM)","B735":"CARBOGNANO (VT)","B741":"CARBONARA AL TICINO (PV)","B740":"CARBONARA DI NOLA (NA)","B739":"CARBONARA DI PO (MN)","B736":"CARBONARA SCRIVIA (AL)","B742":"CARBONATE (CO)","B743":"CARBONE (PZ)","B744":"CARBONERA (TV)","B745":"CARBONIA (CA)","B748":"CARCARE (SV)","B749":"CARCERI (PD)","B752":"CARCOFORO (VC)","B754":"CARDANO AL CAMPO (VA)","B755":"CARDE' (CN)","M285":"CARDEDU (NU)","B756":"CARDETO (RC)","B758":"CARDINALE (CZ)","B759":"CARDITO (NA)","B760":"CAREGGINE (LU)","B762":"CAREMA (TO)","B763":"CARENNO (LC)","B765":"CARENTINO (AL)","B766":"CARERI (RC)","B767":"CARESANA (VC)","B768":"CARESANABLOT (VC)","B769":"CAREZZANO (AL)","B771":"CARFIZZI (KR)","B772":"CARGEGHE (SS)","B774":"CARIATI (CS)","B776":"CARIFE (AV)","B777":"CARIGNANO (TO)","B778":"CARIMATE (CO)","B779":"CARINARO (CE)","B780":"CARINI (PA)","B781":"CARINOLA (CE)","B782":"CARISIO (VC)","B783":"CARISOLO (TN)","B784":"CARLANTINO (FG)","B785":"CARLAZZO (CO)","B787":"CARLENTINI (SR)","B788":"CARLINO (UD)","B789":"CARLOFORTE (CA)","B790":"CARLOPOLI (CZ)","B791":"CARMAGNOLA (TO)","B792":"CARMIANO (LE)","B794":"CARMIGNANO (PO)","B795":"CARMIGNANO DI BRENTA (PD)","B796":"CARNAGO (VA)","B798":"CARNATE (MI)","B801":"CAROBBIO DEGLI ANGELI (BG)","B802":"CAROLEI (CS)","B803":"CARONA (BG)","B804":"CARONIA (ME)","B805":"CARONNO PERTUSELLA (VA)","B807":"CARONNO VARESINO (VA)","B808":"CAROSINO (TA)","B809":"CAROVIGNO (BR)","B810":"CAROVILLI (IS)","B812":"CARPANETO PIACENTINO (PC)","B813":"CARPANZANO (CS)","B814":"CARPASIO (IM)","B816":"CARPEGNA (PU)","B817":"CARPENEDOLO (BS)","B818":"CARPENETO (AL)","B819":"CARPI (MO)","B820":"CARPIANO (MI)","B822":"CARPIGNANO SALENTINO (LE)","B823":"CARPIGNANO SESIA (NO)","B825":"CARPINETI (RE)","B827":"CARPINETO DELLA NORA (PE)","B828":"CARPINETO ROMANO (RM)","B826":"CARPINETO SINELLO (CH)","B829":"CARPINO (FG)","B830":"CARPINONE (IS)","B832":"CARRARA (MS)","B835":"CARRE' (VI)","B836":"CARREGA LIGURE (AL)","B838":"CARRO (SP)","B839":"CARRODANO (SP)","B840":"CARROSIO (AL)","B841":"CARRU' (CN)","B842":"CARSOLI (AQ)","B844":"CARTIGLIANO (VI)","B845":"CARTIGNANO (CN)","B846":"CARTOCETO (PU)","B847":"CARTOSIO (AL)","B848":"CARTURA (PD)","B850":"CARUGATE (MI)","B851":"CARUGO (CO)","B853":"CARUNCHIO (CH)","B854":"CARVICO (BG)","B856":"CARZANO (TN)","B857":"CASABONA (KR)","B858":"CASACALENDA (CB)","B859":"CASACANDITELLA (CH)","B860":"CASAGIOVE (CE)","B870":"CASAL CERMELLI (AL)","B872":"CASAL DI PRINCIPE (CE)","B895":"CASAL VELINO (SA)","B861":"CASALANGUIDA (CH)","B862":"CASALATTICO (FR)","B864":"CASALBELTRAME (NO)","B865":"CASALBORDINO (CH)","B866":"CASALBORE (AV)","B867":"CASALBORGONE (TO)","B868":"CASALBUONO (SA)","B869":"CASALBUTTANO ED UNITI (CR)","B871":"CASALCIPRANO (CB)","B873":"CASALDUNI (BN)","B876":"CASALE CORTE CERRO (VB)","B881":"CASALE CREMASCO-VIDOLASCO (CR)","B877":"CASALE DI SCODOSIA (PD)","B875":"CASALE LITTA (VA)","B878":"CASALE MARITTIMO (PI)","B885":"CASALE MONFERRATO (AL)","B879":"CASALE SUL SILE (TV)","B880":"CASALECCHIO DI RENO (BO)","B882":"CASALEGGIO BOIRO (AL)","B883":"CASALEGGIO NOVARA (NO)","B886":"CASALEONE (VR)","B889":"CASALETTO CEREDANO (CR)","B890":"CASALETTO DI SOPRA (CR)","B887":"CASALETTO LODIGIANO (LO)","B888":"CASALETTO SPARTANO (SA)","B891":"CASALETTO VAPRIO (CR)","B892":"CASALFIUMANESE (BO)","B893":"CASALGRANDE (RE)","B894":"CASALGRASSO (CN)","B896":"CASALINCONTRADA (CH)","B897":"CASALINO (NO)","B898":"CASALMAGGIORE (CR)","B899":"CASALMAIOCCO (LO)","B900":"CASALMORANO (CR)","B901":"CASALMORO (MN)","B902":"CASALNOCETO (AL)","B905":"CASALNUOVO DI NAPOLI (NA)","B904":"CASALNUOVO MONTEROTARO (FG)","B907":"CASALOLDO (MN)","B910":"CASALPUSTERLENGO (LO)","B911":"CASALROMANO (MN)","B912":"CASALSERUGO (PD)","B916":"CASALUCE (CE)","B917":"CASALVECCHIO DI PUGLIA (FG)","B918":"CASALVECCHIO SICULO (ME)","B919":"CASALVIERI (FR)","B920":"CASALVOLONE (NO)","B921":"CASALZUIGNO (VA)","B922":"CASAMARCIANO (NA)","B923":"CASAMASSIMA (BA)","B924":"CASAMICCIOLA TERME (NA)","B925":"CASANDRINO (NA)","B928":"CASANOVA ELVO (VC)","B927":"CASANOVA LERRONE (SV)","B929":"CASANOVA LONATI (PV)","B932":"CASAPE (RM)","M260":"CASAPESENNA (CE)","B933":"CASAPINTA (BI)","B934":"CASAPROTA (RI)","B935":"CASAPULLA (CE)","B936":"CASARANO (LE)","B937":"CASARGO (LC)","B938":"CASARILE (MI)","B940":"CASARSA DELLA DELIZIA (PN)","B939":"CASARZA LIGURE (GE)","B941":"CASASCO (AL)","B942":"CASASCO D'INTELVI (CO)","B943":"CASATENOVO (LC)","B945":"CASATISMA (PV)","B946":"CASAVATORE (NA)","B947":"CASAZZA (BG)","B948":"CASCIA (PG)","B949":"CASCIAGO (VA)","A559":"CASCIANA TERME (PI)","B950":"CASCINA (PI)","B953":"CASCINETTE D'IVREA (TO)","B954":"CASEI GEROLA (PV)","B955":"CASELETTE (TO)","B956":"CASELLA (GE)","B959":"CASELLE IN PITTARI (SA)","B961":"CASELLE LANDI (LO)","B958":"CASELLE LURANI (LO)","B960":"CASELLE TORINESE (TO)","B963":"CASERTA (CE)","B965":"CASIER (TV)","B966":"CASIGNANA (RC)","B967":"CASINA (RE)","B971":"CASIRATE D'ADDA (BG)","B974":"CASLINO D'ERBA (CO)","B977":"CASNATE CON BERNATE (CO)","B978":"CASNIGO (BG)","B980":"CASOLA DI NAPOLI (NA)","B979":"CASOLA IN LUNIGIANA (MS)","B982":"CASOLA VALSENIO (RA)","B983":"CASOLE BRUZIO (CS)","B984":"CASOLE D'ELSA (SI)","B985":"CASOLI (CH)","B988":"CASORATE PRIMO (PV)","B987":"CASORATE SEMPIONE (VA)","B989":"CASOREZZO (MI)","B990":"CASORIA (NA)","B991":"CASORZO (AT)","A472":"CASPERIA (RI)","B993":"CASPOGGIO (SO)","B994":"CASSACCO (UD)","B996":"CASSAGO BRIANZA (LC)","C002":"CASSANO ALLO IONIO (CS)","C003":"CASSANO D'ADDA (MI)","B998":"CASSANO DELLE MURGE (BA)","B997":"CASSANO IRPINO (AV)","C004":"CASSANO MAGNAGO (VA)","C005":"CASSANO SPINOLA (AL)","B999":"CASSANO VALCUVIA (VA)","C006":"CASSARO (SR)","C007":"CASSIGLIO (BG)","C014":"CASSINA DE' PECCHI (MI)","C020":"CASSINA RIZZARDI (CO)","C024":"CASSINA VALSASSINA (LC)","C022":"CASSINASCO (AT)","C027":"CASSINE (AL)","C030":"CASSINELLE (AL)","C033":"CASSINETTA DI LUGAGNANO (MI)","C034":"CASSINO (FR)","C037":"CASSOLA (VI)","C038":"CASSOLNOVO (PV)","C041":"CASTAGNARO (VR)","C044":"CASTAGNETO CARDUCCI (LI)","C045":"CASTAGNETO PO (TO)","C046":"CASTAGNITO (CN)","C049":"CASTAGNOLE DELLE LANZE (AT)","C047":"CASTAGNOLE MONFERRATO (AT)","C048":"CASTAGNOLE PIEMONTE (TO)","C050":"CASTANA (PV)","C052":"CASTANO PRIMO (MI)","C053":"CASTEGGIO (PV)","C055":"CASTEGNATO (BS)","C056":"CASTEGNERO (VI)","C058":"CASTEL BARONIA (AV)","C064":"CASTEL BOGLIONE (AT)","C065":"CASTEL BOLOGNESE (RA)","B494":"CASTEL CAMPAGNANO (CE)","C040":"CASTEL CASTAGNA (TE)","C071":"CASTEL COLONNA (AN)","C183":"CASTEL CONDINO (TN)","C075":"CASTEL D'AIANO (BO)","C076":"CASTEL D'ARIO (MN)","C078":"CASTEL D'AZZANO (VR)","C082":"CASTEL DEL GIUDICE (IS)","C083":"CASTEL DEL MONTE (AQ)","C085":"CASTEL DEL PIANO (GR)","C086":"CASTEL DEL RIO (BO)","B969":"CASTEL DI CASIO (BO)","C090":"CASTEL DI IERI (AQ)","C091":"CASTEL DI IUDICA (CT)","C093":"CASTEL DI LAMA (AP)","C094":"CASTEL DI LUCIO (ME)","C096":"CASTEL DI SANGRO (AQ)","C097":"CASTEL DI SASSO (CE)","C098":"CASTEL DI TORA (RI)","C102":"CASTEL FOCOGNANO (AR)","C114":"CASTEL FRENTANO (CH)","C115":"CASTEL GABBIANO (CR)","C116":"CASTEL GANDOLFO (RM)","C117":"CASTEL GIORGIO (TR)","C118":"CASTEL GOFFREDO (MN)","C121":"CASTEL GUELFO DI BOLOGNA (BO)","C203":"CASTEL MADAMA (RM)","C204":"CASTEL MAGGIORE (BO)","C208":"CASTEL MELLA (BS)","C211":"CASTEL MORRONE (CE)","C252":"CASTEL RITALDI (PG)","C253":"CASTEL ROCCHERO (AT)","C255":"CASTEL ROZZONE (BG)","C259":"CASTEL SAN GIORGIO (SA)","C261":"CASTEL SAN GIOVANNI (PC)","C262":"CASTEL SAN LORENZO (SA)","C263":"CASTEL SAN NICCOLO' (AR)","C266":"CASTEL SAN PIETRO ROMANO (RM)","C265":"CASTEL SAN PIETRO TERME (BO)","C270":"CASTEL SAN VINCENZO (IS)","C268":"CASTEL SANT'ANGELO (RI)","C269":"CASTEL SANT'ELIA (VT)","C289":"CASTEL VISCARDO (TR)","C110":"CASTEL VITTORIO (IM)","C291":"CASTEL VOLTURNO (CE)","C057":"CASTELBALDO (PD)","C059":"CASTELBELFORTE (MN)","C060":"CASTELBELLINO (AN)","C062":"CASTELBELLO CIARDES .KASTELBELL TSCHARS. (BZ)","C063":"CASTELBIANCO (SV)","C066":"CASTELBOTTACCIO (CB)","C067":"CASTELBUONO (PA)","C069":"CASTELCIVITA (SA)","C072":"CASTELCOVATI (BS)","C073":"CASTELCUCCO (TV)","C074":"CASTELDACCIA (PA)","C080":"CASTELDELCI (PU)","C081":"CASTELDELFINO (CN)","C089":"CASTELDIDONE (CR)","C100":"CASTELFIDARDO (AN)","C101":"CASTELFIORENTINO (FI)","C103":"CASTELFONDO (TN)","C104":"CASTELFORTE (LT)","C105":"CASTELFRANCI (AV)","C112":"CASTELFRANCO DI SOPRA (AR)","C113":"CASTELFRANCO DI SOTTO (PI)","C107":"CASTELFRANCO EMILIA (MO)","C106":"CASTELFRANCO IN MISCANO (BN)","C111":"CASTELFRANCO VENETO (TV)","C119":"CASTELGOMBERTO (VI)","C120":"CASTELGRANDE (PZ)","C122":"CASTELGUGLIELMO (RO)","C123":"CASTELGUIDONE (CH)","C125":"CASTELLABATE (SA)","C126":"CASTELLAFIUME (AQ)","C127":"CASTELL'ALFERO (AT)","C128":"CASTELLALTO (TE)","C130":"CASTELLAMMARE DEL GOLFO (TP)","C129":"CASTELLAMMARE DI STABIA (NA)","C133":"CASTELLAMONTE (TO)","C134":"CASTELLANA GROTTE (BA)","C135":"CASTELLANA SICULA (PA)","C136":"CASTELLANETA (TA)","C137":"CASTELLANIA (AL)","C139":"CASTELLANZA (VA)","C140":"CASTELLAR (CN)","C142":"CASTELLAR GUIDOBONO (AL)","C141":"CASTELLARANO (RE)","C143":"CASTELLARO (IM)","C145":"CASTELL'ARQUATO (PC)","C146":"CASTELLAVAZZO (BL)","C147":"CASTELL'AZZARA (GR)","C148":"CASTELLAZZO BORMIDA (AL)","C149":"CASTELLAZZO NOVARESE (NO)","C153":"CASTELLEONE (CR)","C152":"CASTELLEONE DI SUASA (AN)","C154":"CASTELLERO (AT)","C155":"CASTELLETTO CERVO (BI)","C156":"CASTELLETTO D'ERRO (AL)","C157":"CASTELLETTO DI BRANDUZZO (PV)","C158":"CASTELLETTO D'ORBA (AL)","C160":"CASTELLETTO MERLI (AL)","C161":"CASTELLETTO MOLINA (AT)","C162":"CASTELLETTO MONFERRATO (AL)","C166":"CASTELLETTO SOPRA TICINO (NO)","C165":"CASTELLETTO STURA (CN)","C167":"CASTELLETTO UZZONE (CN)","C169":"CASTELLI (TE)","C079":"CASTELLI CALEPIO (BG)","C172":"CASTELLINA IN CHIANTI (SI)","C174":"CASTELLINA MARITTIMA (PI)","C173":"CASTELLINALDO (CN)","C175":"CASTELLINO DEL BIFERNO (CB)","C176":"CASTELLINO TANARO (CN)","C177":"CASTELLIRI (FR)","B312":"CASTELLO CABIAGLIO (VA)","C184":"CASTELLO D'AGOGNA (PV)","C185":"CASTELLO D'ARGILE (BO)","C178":"CASTELLO DEL MATESE (CE)","C186":"CASTELLO DELL'ACQUA (SO)","A300":"CASTELLO DI ANNONE (AT)","C187":"CASTELLO DI BRIANZA (LC)","C188":"CASTELLO DI CISTERNA (NA)","C190":"CASTELLO DI GODEGO (TV)","C191":"CASTELLO DI SERRAVALLE (BO)","C194":"CASTELLO TESINO (TN)","C189":"CASTELLO-MOLINA DI FIEMME (TN)","C195":"CASTELLUCCHIO (MN)","C198":"CASTELLUCCIO DEI SAURI (FG)","C199":"CASTELLUCCIO INFERIORE (PZ)","C201":"CASTELLUCCIO SUPERIORE (PZ)","C202":"CASTELLUCCIO VALMAGGIORE (FG)","C051":"CASTELL'UMBERTO (ME)","C205":"CASTELMAGNO (CN)","C206":"CASTELMARTE (CO)","C207":"CASTELMASSA (RO)","C197":"CASTELMAURO (CB)","C209":"CASTELMEZZANO (PZ)","C210":"CASTELMOLA (ME)","C213":"CASTELNOVETTO (PV)","C215":"CASTELNOVO BARIANO (RO)","C217":"CASTELNOVO DEL FRIULI (PN)","C218":"CASTELNOVO DI SOTTO (RE)","C219":"CASTELNOVO NE' MONTI (RE)","C216":"CASTELNUOVO (TN)","C226":"CASTELNUOVO BELBO (AT)","C227":"CASTELNUOVO BERARDENGA (SI)","C228":"CASTELNUOVO BOCCA D'ADDA (LO)","C229":"CASTELNUOVO BORMIDA (AL)","C220":"CASTELNUOVO BOZZENTE (CO)","C230":"CASTELNUOVO CALCEA (AT)","C231":"CASTELNUOVO CILENTO (SA)","C225":"CASTELNUOVO DEL GARDA (VR)","C222":"CASTELNUOVO DELLA DAUNIA (FG)","C214":"CASTELNUOVO DI CEVA (CN)","C235":"CASTELNUOVO DI CONZA (SA)","C224":"CASTELNUOVO DI FARFA (RI)","C236":"CASTELNUOVO DI GARFAGNANA (LU)","C237":"CASTELNUOVO DI PORTO (RM)","C232":"CASTELNUOVO DON BOSCO (AT)","C240":"CASTELNUOVO MAGRA (SP)","C241":"CASTELNUOVO NIGRA (TO)","C223":"CASTELNUOVO PARANO (FR)","C242":"CASTELNUOVO RANGONE (MO)","C243":"CASTELNUOVO SCRIVIA (AL)","C244":"CASTELNUOVO VAL DI CECINA (PI)","C245":"CASTELPAGANO (BN)","C246":"CASTELPETROSO (IS)","C247":"CASTELPIZZUTO (IS)","C248":"CASTELPLANIO (AN)","C250":"CASTELPOTO (BN)","C251":"CASTELRAIMONDO (MC)","C254":"CASTELROTTO .KASTELRUTH. (BZ)","C267":"CASTELSANTANGELO SUL NERA (MC)","C271":"CASTELSARACENO (PZ)","C272":"CASTELSARDO (SS)","C273":"CASTELSEPRIO (VA)","B968":"CASTELSILANO (KR)","C274":"CASTELSPINA (AL)","C275":"CASTELTERMINI (AG)","C181":"CASTELVECCANA (VA)","C278":"CASTELVECCHIO CALVISIO (AQ)","C276":"CASTELVECCHIO DI ROCCA BARBENA (SV)","C279":"CASTELVECCHIO SUBEQUO (AQ)","C280":"CASTELVENERE (BN)","B129":"CASTELVERDE (CR)","C200":"CASTELVERRINO (IS)","C284":"CASTELVETERE IN VAL FORTORE (BN)","C283":"CASTELVETERE SUL CALORE (AV)","C286":"CASTELVETRANO (TP)","C287":"CASTELVETRO DI MODENA (MO)","C288":"CASTELVETRO PIACENTINO (PC)","C290":"CASTELVISCONTI (CR)","C292":"CASTENASO (BO)","C293":"CASTENEDOLO (BS)","M288":"CASTIADAS (CA)","C318":"CASTIGLION FIBOCCHI (AR)","C319":"CASTIGLION FIORENTINO (AR)","C308":"CASTIGLIONE A CASAURIA (PE)","C302":"CASTIGLIONE CHIAVARESE (GE)","C301":"CASTIGLIONE COSENTINO (CS)","C304":"CASTIGLIONE D'ADDA (LO)","C296":"CASTIGLIONE DEI PEPOLI (BO)","C306":"CASTIGLIONE DEL GENOVESI (SA)","C309":"CASTIGLIONE DEL LAGO (PG)","C310":"CASTIGLIONE DELLA PESCAIA (GR)","C312":"CASTIGLIONE DELLE STIVIERE (MN)","C303":"CASTIGLIONE DI GARFAGNANA (LU)","C297":"CASTIGLIONE DI SICILIA (CT)","C299":"CASTIGLIONE D'INTELVI (CO)","C313":"CASTIGLIONE D'ORCIA (SI)","C314":"CASTIGLIONE FALLETTO (CN)","C315":"CASTIGLIONE IN TEVERINA (VT)","C298":"CASTIGLIONE MESSER MARINO (CH)","C316":"CASTIGLIONE MESSER RAIMONDO (TE)","C300":"CASTIGLIONE OLONA (VA)","C317":"CASTIGLIONE TINELLA (CN)","C307":"CASTIGLIONE TORINESE (TO)","C321":"CASTIGNANO (AP)","C322":"CASTILENTI (TE)","C323":"CASTINO (CN)","C325":"CASTIONE ANDEVENNO (SO)","C324":"CASTIONE DELLA PRESOLANA (BG)","C327":"CASTIONS DI STRADA (UD)","C329":"CASTIRAGA VIDARDO (LO)","C330":"CASTO (BS)","C331":"CASTORANO (AP)","C332":"CASTREZZATO (BS)","C334":"CASTRI DI LECCE (LE)","C335":"CASTRIGNANO DE' GRECI (LE)","C336":"CASTRIGNANO DEL CAPO (LE)","C337":"CASTRO (BG)","M261":"CASTRO (LE)","C338":"CASTRO DEI VOLSCI (FR)","C339":"CASTROCARO TERME E TERRA DEL SOLE (FC)","C340":"CASTROCIELO (FR)","C341":"CASTROFILIPPO (AG)","C108":"CASTROLIBERO (CS)","C343":"CASTRONNO (VA)","C344":"CASTRONOVO DI SICILIA (PA)","C345":"CASTRONUOVO DI SANT'ANDREA (PZ)","C346":"CASTROPIGNANO (CB)","C347":"CASTROREALE (ME)","C348":"CASTROREGIO (CS)","C349":"CASTROVILLARI (CS)","C351":"CATANIA (CT)","C352":"CATANZARO (CZ)","C353":"CATENANUOVA (EN)","C354":"CATIGNANO (PE)","C357":"CATTOLICA (RN)","C356":"CATTOLICA ERACLEA (AG)","C285":"CAULONIA (RC)","C359":"CAUTANO (BN)","C361":"CAVA DE' TIRRENI (SA)","C360":"CAVA MANARA (PV)","C362":"CAVACURTA (LO)","C363":"CAVAGLIA' (BI)","C364":"CAVAGLIETTO (NO)","C365":"CAVAGLIO D'AGOGNA (NO)","C367":"CAVAGLIO-SPOCCIA (VB)","C369":"CAVAGNOLO (TO)","C370":"CAVAION VERONESE (VR)","C372":"CAVALESE (TN)","C374":"CAVALLASCA (CO)","C375":"CAVALLERLEONE (CN)","C376":"CAVALLERMAGGIORE (CN)","C377":"CAVALLINO (LE)","M308":"CAVALLINO-TREPORTI (VE)","C378":"CAVALLIRIO (NO)","C380":"CAVARENO (TN)","C381":"CAVARGNA (CO)","C382":"CAVARIA CON PREMEZZO (VA)","C383":"CAVARZERE (VE)","C384":"CAVASO DEL TOMBA (TV)","C385":"CAVASSO NUOVO (PN)","C387":"CAVATORE (AL)","C389":"CAVAZZO CARNICO (UD)","C390":"CAVE (RM)","C392":"CAVEDAGO (TN)","C393":"CAVEDINE (TN)","C394":"CAVENAGO D'ADDA (LO)","C395":"CAVENAGO DI BRIANZA (MI)","C396":"CAVERNAGO (BG)","C398":"CAVEZZO (MO)","C400":"CAVIZZANA (TN)","C404":"CAVOUR (TO)","C405":"CAVRIAGO (RE)","C406":"CAVRIANA (MN)","C407":"CAVRIGLIA (AR)","C409":"CAZZAGO BRABBIA (VA)","C408":"CAZZAGO SAN MARTINO (BS)","C412":"CAZZANO DI TRAMIGNA (VR)","C410":"CAZZANO SANT'ANDREA (BG)","C413":"CECCANO (FR)","C414":"CECIMA (PV)","C415":"CECINA (LI)","C417":"CEDEGOLO (BS)","C418":"CEDRASCO (SO)","C420":"CEFALA' DIANA (PA)","C421":"CEFALU' (PA)","C422":"CEGGIA (VE)","C424":"CEGLIE MESSAPICO (BR)","C426":"CELANO (AQ)","C428":"CELENZA SUL TRIGNO (CH)","C429":"CELENZA VALFORTORE (FG)","C430":"CELICO (CS)","C435":"CELLA DATI (CR)","C432":"CELLA MONTE (AL)","C436":"CELLAMARE (BA)","C437":"CELLARA (CS)","C438":"CELLARENGO (AT)","C439":"CELLATICA (BS)","C444":"CELLE DI BULGHERIA (SA)","C441":"CELLE DI MACRA (CN)","C440":"CELLE ENOMONDO (AT)","C443":"CELLE LIGURE (SV)","C442":"CELLE SAN VITO (FG)","C446":"CELLENO (VT)","C447":"CELLERE (VT)","C449":"CELLINO ATTANASIO (TE)","C448":"CELLINO SAN MARCO (BR)","C450":"CELLIO (VC)","M262":"CELLOLE (CE)","C452":"CEMBRA (TN)","C453":"CENADI (CZ)","C456":"CENATE SOPRA (BG)","C457":"CENATE SOTTO (BG)","C458":"CENCENIGHE AGORDINO (BL)","C459":"CENE (BG)","C461":"CENESELLI (RO)","C463":"CENGIO (SV)","C467":"CENTA SAN NICOLO' (TN)","C466":"CENTALLO (CN)","C469":"CENTO (FE)","C470":"CENTOLA (SA)","C472":"CENTRACHE (CZ)","C471":"CENTURIPE (EN)","C474":"CEPAGATTI (PE)","C476":"CEPPALONI (BN)","C478":"CEPPO MORELLI (VB)","C479":"CEPRANO (FR)","C480":"CERAMI (EN)","C481":"CERANESI (GE)","C483":"CERANO (NO)","C482":"CERANO D'INTELVI (CO)","C484":"CERANOVA (PV)","C485":"CERASO (SA)","C486":"CERCEMAGGIORE (CB)","C487":"CERCENASCO (TO)","C488":"CERCEPICCOLA (CB)","C489":"CERCHIARA DI CALABRIA (CS)","C492":"CERCHIO (AQ)","C493":"CERCINO (SO)","C494":"CERCIVENTO (UD)","C495":"CERCOLA (NA)","C496":"CERDA (PA)","C498":"CEREA (VR)","C500":"CEREGNANO (RO)","C501":"CERENZIA (KR)","C497":"CERES (TO)","C502":"CERESARA (MN)","C503":"CERESETO (AL)","C504":"CERESOLE ALBA (CN)","C505":"CERESOLE REALE (TO)","C506":"CERETE (BG)","C508":"CERETTO LOMELLINA (PV)","C509":"CERGNAGO (PV)","C510":"CERIALE (SV)","C511":"CERIANA (IM)","C512":"CERIANO LAGHETTO (MI)","C513":"CERIGNALE (PC)","C514":"CERIGNOLA (FG)","C515":"CERISANO (CS)","C516":"CERMENATE (CO)","A022":"CERMES .TSCHERMS. (BZ)","C517":"CERMIGNANO (TE)","C520":"CERNOBBIO (CO)","C521":"CERNUSCO LOMBARDONE (LC)","C523":"CERNUSCO SUL NAVIGLIO (MI)","C526":"CERRETO CASTELLO (BI)","C528":"CERRETO D'ASTI (AT)","C524":"CERRETO D'ESI (AN)","C527":"CERRETO DI SPOLETO (PG)","C507":"CERRETO GRUE (AL)","C529":"CERRETO GUIDI (FI)","C518":"CERRETO LAZIALE (RM)","C525":"CERRETO SANNITA (BN)","C530":"CERRETTO DELLE LANGHE (CN)","C531":"CERRINA (AL)","C532":"CERRIONE (BI)","C536":"CERRO AL LAMBRO (MI)","C534":"CERRO AL VOLTURNO (IS)","C537":"CERRO MAGGIORE (MI)","C533":"CERRO TANARO (AT)","C538":"CERRO VERONESE (VR)","C539":"CERSOSIMO (PZ)","C540":"CERTALDO (FI)","C541":"CERTOSA DI PAVIA (PV)","C542":"CERVA (CZ)","C543":"CERVARA DI ROMA (RM)","C544":"CERVARESE SANTA CROCE (PD)","C545":"CERVARO (FR)","C547":"CERVASCA (CN)","C548":"CERVATTO (VC)","C549":"CERVENO (BS)","C550":"CERVERE (CN)","C551":"CERVESINA (PV)","C552":"CERVETERI (RM)","C553":"CERVIA (RA)","C554":"CERVICATI (CS)","C555":"CERVIGNANO D'ADDA (LO)","C556":"CERVIGNANO DEL FRIULI (UD)","C557":"CERVINARA (AV)","C558":"CERVINO (CE)","C559":"CERVO (IM)","C560":"CERZETO (CS)","C561":"CESA (CE)","C563":"CESANA BRIANZA (LC)","C564":"CESANA TORINESE (TO)","C565":"CESANO BOSCONE (MI)","C566":"CESANO MADERNO (MI)","C567":"CESARA (VB)","C568":"CESARO' (ME)","C569":"CESATE (MI)","C573":"CESENA (FC)","C574":"CESENATICO (FC)","C576":"CESINALI (AV)","C578":"CESIO (IM)","C577":"CESIOMAGGIORE (BL)","C580":"CESSALTO (TV)","C581":"CESSANITI (VV)","C582":"CESSAPALOMBO (MC)","C583":"CESSOLE (AT)","C584":"CETARA (SA)","C585":"CETO (BS)","C587":"CETONA (SI)","C588":"CETRARO (CS)","C589":"CEVA (CN)","C591":"CEVO (BS)","C593":"CHALLAND-SAINT-ANSELME (AO)","C594":"CHALLAND-SAINT-VICTOR (AO)","C595":"CHAMBAVE (AO)","B491":"CHAMOIS (AO)","C596":"CHAMPDEPRAZ (AO)","B540":"CHAMPORCHER (AO)","C598":"CHARVENSOD (AO)","C294":"CHATILLON (AO)","C599":"CHERASCO (CN)","C600":"CHEREMULE (SS)","C604":"CHIALAMBERTO (TO)","C605":"CHIAMPO (VI)","C606":"CHIANCHE (AV)","C608":"CHIANCIANO TERME (SI)","C609":"CHIANNI (PI)","C610":"CHIANOCCO (TO)","C612":"CHIARAMONTE GULFI (RG)","C613":"CHIARAMONTI (SS)","C614":"CHIARANO (TV)","C615":"CHIARAVALLE (AN)","C616":"CHIARAVALLE CENTRALE (CZ)","C618":"CHIARI (BS)","C619":"CHIAROMONTE (PZ)","C620":"CHIAUCI (IS)","C621":"CHIAVARI (GE)","C623":"CHIAVENNA (SO)","C624":"CHIAVERANO (TO)","C625":"CHIENES .KIENS. (BZ)","C627":"CHIERI (TO)","C630":"CHIES D'ALPAGO (BL)","C628":"CHIESA IN VALMALENCO (SO)","C629":"CHIESANUOVA (TO)","C631":"CHIESINA UZZANESE (PT)","C632":"CHIETI (CH)","C633":"CHIEUTI (FG)","C634":"CHIEVE (CR)","C635":"CHIGNOLO D'ISOLA (BG)","C637":"CHIGNOLO PO (PV)","C638":"CHIOGGIA (VE)","C639":"CHIOMONTE (TO)","C640":"CHIONS (PN)","C641":"CHIOPRIS VISCONE (UD)","C648":"CHITIGNANO (AR)","C649":"CHIUDUNO (BG)","C650":"CHIUPPANO (VI)","C651":"CHIURO (SO)","C652":"CHIUSA .KLAUSEN. (BZ)","C653":"CHIUSA DI PESIO (CN)","C655":"CHIUSA DI SAN MICHELE (TO)","C654":"CHIUSA SCLAFANI (PA)","C656":"CHIUSAFORTE (UD)","C657":"CHIUSANICO (IM)","C658":"CHIUSANO D'ASTI (AT)","C659":"CHIUSANO DI SAN DOMENICO (AV)","C660":"CHIUSAVECCHIA (IM)","C661":"CHIUSDINO (SI)","C662":"CHIUSI (SI)","C663":"CHIUSI DELLA VERNA (AR)","C665":"CHIVASSO (TO)","M272":"CIAMPINO (RM)","C668":"CIANCIANA (AG)","C672":"CIBIANA DI CADORE (BL)","C673":"CICAGNA (GE)","C674":"CICALA (CZ)","C675":"CICCIANO (NA)","C676":"CICERALE (SA)","C677":"CICILIANO (RM)","C678":"CICOGNOLO (CR)","C679":"CICONIO (TO)","C680":"CIGLIANO (VC)","C681":"CIGLIE' (CN)","C684":"CIGOGNOLA (PV)","C685":"CIGOLE (BS)","C686":"CILAVEGNA (PV)","C689":"CIMADOLMO (TV)","C691":"CIMBERGO (BS)","C694":"CIMEGO (TN)","C695":"CIMINA' (RC)","C696":"CIMINNA (PA)","C697":"CIMITILE (NA)","C699":"CIMOLAIS (PN)","C700":"CIMONE (TN)","C701":"CINAGLIO (AT)","C702":"CINETO ROMANO (RM)","C703":"CINGIA DE' BOTTI (CR)","C704":"CINGOLI (MC)","C705":"CINIGIANO (GR)","C707":"CINISELLO BALSAMO (MI)","C708":"CINISI (PA)","C709":"CINO (SO)","C710":"CINQUEFRONDI (RC)","C711":"CINTANO (TO)","C712":"CINTE TESINO (TN)","C714":"CINTO CAOMAGGIORE (VE)","C713":"CINTO EUGANEO (PD)","C715":"CINZANO (TO)","C716":"CIORLANO (CE)","C718":"CIPRESSA (IM)","C719":"CIRCELLO (BN)","C722":"CIRIE' (TO)","C723":"CIRIGLIANO (MT)","C724":"CIRIMIDO (CO)","C725":"CIRO' (KR)","C726":"CIRO' MARINA (KR)","C727":"CIS (TN)","C728":"CISANO BERGAMASCO (BG)","C729":"CISANO SUL NEVA (SV)","C730":"CISERANO (BG)","C732":"CISLAGO (VA)","C733":"CISLIANO (MI)","C734":"CISMON DEL GRAPPA (VI)","C735":"CISON DI VALMARINO (TV)","C738":"CISSONE (CN)","C739":"CISTERNA D'ASTI (AT)","C740":"CISTERNA DI LATINA (LT)","C741":"CISTERNINO (BR)","C742":"CITERNA (PG)","C744":"CITTA' DELLA PIEVE (PG)","C745":"CITTA' DI CASTELLO (PG)","C750":"CITTA' SANT'ANGELO (PE)","C743":"CITTADELLA (PD)","C746":"CITTADUCALE (RI)","C747":"CITTANOVA (RC)","C749":"CITTAREALE (RI)","C751":"CITTIGLIO (VA)","C752":"CIVATE (LC)","C754":"CIVENNA (CO)","C755":"CIVEZZA (IM)","C756":"CIVEZZANO (TN)","C757":"CIVIASCO (VC)","C758":"CIVIDALE DEL FRIULI (UD)","C759":"CIVIDATE AL PIANO (BG)","C760":"CIVIDATE CAMUNO (BS)","C763":"CIVITA (CS)","C765":"CIVITA CASTELLANA (VT)","C766":"CIVITA D'ANTINO (AQ)","C764":"CIVITACAMPOMARANO (CB)","C768":"CIVITALUPARELLA (CH)","C769":"CIVITANOVA DEL SANNIO (IS)","C770":"CIVITANOVA MARCHE (MC)","C771":"CIVITAQUANA (PE)","C773":"CIVITAVECCHIA (RM)","C778":"CIVITELLA ALFEDENA (AQ)","C779":"CIVITELLA CASANOVA (PE)","C780":"CIVITELLA D'AGLIANO (VT)","C781":"CIVITELLA DEL TRONTO (TE)","C777":"CIVITELLA DI ROMAGNA (FC)","C774":"CIVITELLA IN VAL DI CHIANA (AR)","C776":"CIVITELLA MESSER RAIMONDO (CH)","C782":"CIVITELLA PAGANICO (GR)","C783":"CIVITELLA ROVETO (AQ)","C784":"CIVITELLA SAN PAOLO (RM)","C785":"CIVO (SO)","C787":"CLAINO CON OSTENO (CO)","C790":"CLAUT (PN)","C791":"CLAUZETTO (PN)","C792":"CLAVESANA (CN)","C793":"CLAVIERE (TO)","C794":"CLES (TN)","C795":"CLETO (CS)","C796":"CLIVIO (VA)","C797":"CLOZ (TN)","C800":"CLUSONE (BG)","C801":"COASSOLO TORINESE (TO)","C803":"COAZZE (TO)","C804":"COAZZOLO (AT)","C806":"COCCAGLIO (BS)","C807":"COCCONATO (AT)","C810":"COCQUIO-TREVISAGO (VA)","C811":"COCULLO (AQ)","C812":"CODEVIGO (PD)","C813":"CODEVILLA (PV)","C814":"CODIGORO (FE)","C815":"CODOGNE' (TV)","C816":"CODOGNO (LO)","C817":"CODROIPO (UD)","C818":"CODRONGIANOS (SS)","C819":"COGGIOLA (BI)","C820":"COGLIATE (MI)","C821":"COGNE (AO)","C823":"COGOLETO (GE)","C824":"COGOLLO DEL CENGIO (VI)","C826":"COGORNO (GE)","C829":"COLAZZA (NO)","C830":"COLBORDOLO (PU)","C835":"COLERE (BG)","C836":"COLFELICE (FR)","C838":"COLI (PC)","C839":"COLICO (LC)","C840":"COLLAGNA (RE)","C841":"COLLALTO SABINO (RI)","C844":"COLLARMELE (AQ)","C845":"COLLAZZONE (PG)","C851":"COLLE BRIANZA (LC)","C854":"COLLE D'ANCHISE (CB)","C857":"COLLE DI TORA (RI)","C847":"COLLE DI VAL D'ELSA (SI)","C870":"COLLE SAN MAGNO (FR)","C846":"COLLE SANNITA (BN)","C872":"COLLE SANTA LUCIA (BL)","C848":"COLLE UMBERTO (TV)","C850":"COLLEBEATO (BS)","C852":"COLLECCHIO (PR)","C853":"COLLECORVINO (PE)","C311":"COLLEDARA (TE)","C855":"COLLEDIMACINE (CH)","C856":"COLLEDIMEZZO (CH)","C858":"COLLEFERRO (RM)","C859":"COLLEGIOVE (RI)","C860":"COLLEGNO (TO)","C862":"COLLELONGO (AQ)","C864":"COLLEPARDO (FR)","C865":"COLLEPASSO (LE)","C866":"COLLEPIETRO (AQ)","C867":"COLLERETTO CASTELNUOVO (TO)","C868":"COLLERETTO GIACOSA (TO)","C869":"COLLESALVETTI (LI)","C871":"COLLESANO (PA)","C875":"COLLETORTO (CB)","C876":"COLLEVECCHIO (RI)","C878":"COLLI A VOLTURNO (IS)","C877":"COLLI DEL TRONTO (AP)","C880":"COLLI SUL VELINO (RI)","C879":"COLLIANO (SA)","C882":"COLLINAS (CA)","C883":"COLLIO (BS)","C884":"COLLOBIANO (VC)","C885":"COLLOREDO DI MONTE ALBANO (UD)","C886":"COLMURANO (MC)","C888":"COLOBRARO (MT)","C890":"COLOGNA VENETA (VR)","C893":"COLOGNE (BS)","C894":"COLOGNO AL SERIO (BG)","C895":"COLOGNO MONZESE (MI)","C897":"COLOGNOLA AI COLLI (VR)","C900":"COLONNA (RM)","C901":"COLONNELLA (TE)","C902":"COLONNO (CO)","C903":"COLORINA (SO)","C904":"COLORNO (PR)","C905":"COLOSIMI (CS)","C908":"COLTURANO (MI)","C910":"COLZATE (BG)","C911":"COMABBIO (VA)","C912":"COMACCHIO (FE)","C914":"COMANO (MS)","C917":"COMAZZO (LO)","C918":"COMEGLIANS (UD)","C920":"COMELICO SUPERIORE (BL)","C922":"COMERIO (VA)","C925":"COMEZZANO-CIZZAGO (BS)","C926":"COMIGNAGO (NO)","C927":"COMISO (RG)","C928":"COMITINI (AG)","C929":"COMIZIANO (NA)","C930":"COMMESSAGGIO (MN)","C931":"COMMEZZADURA (TN)","C933":"COMO (CO)","C934":"COMPIANO (PR)","C937":"COMUN NUOVO (BG)","C935":"COMUNANZA (AP)","C938":"CONA (VE)","C941":"CONCA CASALE (IS)","C940":"CONCA DEI MARINI (SA)","C939":"CONCA DELLA CAMPANIA (CE)","C943":"CONCAMARISE (VR)","C944":"CONCEI (TN)","C946":"CONCERVIANO (RI)","C948":"CONCESIO (BS)","C949":"CONCO (VI)","C950":"CONCORDIA SAGITTARIA (VE)","C951":"CONCORDIA SULLA SECCHIA (MO)","C952":"CONCOREZZO (MI)","C953":"CONDINO (TN)","C954":"CONDOFURI (RC)","C955":"CONDOVE (TO)","C956":"CONDRO' (ME)","C957":"CONEGLIANO (TV)","C958":"CONFIENZA (PV)","C959":"CONFIGNI (RI)","C960":"CONFLENTI (CZ)","C962":"CONIOLO (AL)","C963":"CONSELICE (RA)","C964":"CONSELVE (PD)","C965":"CONSIGLIO DI RUMO (CO)","C968":"CONTESSA ENTELLINA (PA)","C969":"CONTIGLIANO (RI)","C971":"CONTRADA (AV)","C972":"CONTROGUERRA (TE)","C973":"CONTRONE (SA)","C974":"CONTURSI TERME (SA)","C975":"CONVERSANO (BA)","C976":"CONZA DELLA CAMPANIA (AV)","C977":"CONZANO (AL)","C978":"COPERTINO (LE)","C979":"COPIANO (PV)","C980":"COPPARO (FE)","C982":"CORANA (PV)","C983":"CORATO (BA)","C984":"CORBARA (SA)","C986":"CORBETTA (MI)","C987":"CORBOLA (RO)","C988":"CORCHIANO (VT)","C990":"CORCIANO (PG)","C991":"CORDENONS (PN)","C992":"CORDIGNANO (TV)","C993":"CORDOVADO (PN)","C994":"COREDO (TN)","C996":"COREGLIA ANTELMINELLI (LU)","C995":"COREGLIA LIGURE (GE)","C998":"CORENO AUSONIO (FR)","C999":"CORFINIO (AQ)","D003":"CORI (LT)","D004":"CORIANO (RN)","D005":"CORIGLIANO CALABRO (CS)","D006":"CORIGLIANO D'OTRANTO (LE)","D007":"CORINALDO (AN)","D008":"CORIO (TO)","D009":"CORLEONE (PA)","D011":"CORLETO MONFORTE (SA)","D010":"CORLETO PERTICARA (PZ)","D013":"CORMANO (MI)","D014":"CORMONS (GO)","D015":"CORNA IMAGNA (BG)","D016":"CORNALBA (BG)","D017":"CORNALE (PV)","D018":"CORNAREDO (MI)","D019":"CORNATE D'ADDA (MI)","B799":"CORNEDO ALL'ISARCO .KARNEID. (BZ)","D020":"CORNEDO VICENTINO (VI)","D021":"CORNEGLIANO LAUDENSE (LO)","D022":"CORNELIANO D'ALBA (CN)","D026":"CORNIGLIO (PR)","D027":"CORNO DI ROSAZZO (UD)","D028":"CORNO GIOVINE (LO)","D029":"CORNOVECCHIO (LO)","D030":"CORNUDA (TV)","D037":"CORREGGIO (RE)","D038":"CORREZZANA (MI)","D040":"CORREZZOLA (PD)","D041":"CORRIDO (CO)","D042":"CORRIDONIA (MC)","D043":"CORROPOLI (TE)","D044":"CORSANO (LE)","D045":"CORSICO (MI)","D046":"CORSIONE (AT)","D048":"CORTACCIA SULLA STRADA DEL VINO .KURTATSCH A. (BZ)","D049":"CORTALE (CZ)","D050":"CORTANDONE (AT)","D051":"CORTANZE (AT)","D052":"CORTAZZONE (AT)","D054":"CORTE BRUGNATELLA (PC)","D056":"CORTE DE' CORTESI CON CIGNONE (CR)","D057":"CORTE DE' FRATI (CR)","D058":"CORTE FRANCA (BS)","D068":"CORTE PALASIO (LO)","D061":"CORTEMAGGIORE (PC)","D062":"CORTEMILIA (CN)","D064":"CORTENO GOLGI (BS)","D065":"CORTENOVA (LC)","D066":"CORTENUOVA (BG)","D067":"CORTEOLONA (PV)","D072":"CORTIGLIONE (AT)","A266":"CORTINA D'AMPEZZO (BL)","D075":"CORTINA SULLA STRADA DEL VINO .KURTINIG AN D. (BZ)","D076":"CORTINO (TE)","D077":"CORTONA (AR)","D078":"CORVARA (PE)","D079":"CORVARA IN BADIA .CORVARA. (BZ)","D081":"CORVINO SAN QUIRICO (PV)","D082":"CORZANO (BS)","D085":"COSEANO (UD)","D086":"COSENZA (CS)","D087":"COSIO D'ARROSCIA (IM)","D088":"COSIO VALTELLINO (SO)","D089":"COSOLETO (RC)","D093":"COSSANO BELBO (CN)","D092":"COSSANO CANAVESE (TO)","D094":"COSSATO (BI)","D095":"COSSERIA (SV)","D096":"COSSIGNANO (AP)","D099":"COSSOGNO (VB)","D100":"COSSOINE (SS)","D101":"COSSOMBRATO (AT)","D109":"COSTA DE' NOBILI (PV)","D110":"COSTA DI MEZZATE (BG)","D105":"COSTA DI ROVIGO (RO)","D111":"COSTA DI SERINA (BG)","D112":"COSTA MASNAGA (LC)","D103":"COSTA VALLE IMAGNA (BG)","D102":"COSTA VESCOVATO (AL)","D117":"COSTA VOLPINO (BG)","D107":"COSTABISSARA (VI)","D108":"COSTACCIARO (PG)","D113":"COSTANZANA (VC)","D114":"COSTARAINERA (IM)","D118":"COSTERMANO (VR)","D119":"COSTIGLIOLE D'ASTI (AT)","D120":"COSTIGLIOLE SALUZZO (CN)","D121":"COTIGNOLA (RA)","D123":"COTRONEI (KR)","D124":"COTTANELLO (RI)","D012":"COURMAYEUR (AO)","D126":"COVO (BG)","D127":"COZZO (PV)","D128":"CRACO (MT)","D131":"CRANDOLA VALSASSINA (LC)","D132":"CRAVAGLIANA (VC)","D133":"CRAVANZANA (CN)","D134":"CRAVEGGIA (VB)","D136":"CREAZZO (VI)","D137":"CRECCHIO (CH)","D139":"CREDARO (BG)","D141":"CREDERA RUBBIANO (CR)","D142":"CREMA (CR)","D143":"CREMELLA (LC)","D144":"CREMENAGA (VA)","D145":"CREMENO (LC)","D147":"CREMIA (CO)","D149":"CREMOLINO (AL)","D150":"CREMONA (CR)","D151":"CREMOSANO (CR)","D154":"CRESCENTINO (VC)","D156":"CRESPADORO (VI)","D157":"CRESPANO DEL GRAPPA (TV)","D158":"CRESPELLANO (BO)","D159":"CRESPIATICA (LO)","D160":"CRESPINA (PI)","D161":"CRESPINO (RO)","D162":"CRESSA (NO)","D165":"CREVACUORE (BI)","D166":"CREVALCORE (BO)","D168":"CREVOLADOSSOLA (VB)","D170":"CRISPANO (NA)","D171":"CRISPIANO (TA)","D172":"CRISSOLO (CN)","D175":"CROCEFIESCHI (GE)","C670":"CROCETTA DEL MONTELLO (TV)","D177":"CRODO (VB)","D179":"CROGNALETO (TE)","D180":"CROPALATI (CS)","D181":"CROPANI (CZ)","D182":"CROSA (BI)","D184":"CROSIA (CS)","D185":"CROSIO DELLA VALLE (VA)","D122":"CROTONE (KR)","D186":"CROTTA D'ADDA (CR)","D187":"CROVA (VC)","D188":"CROVIANA (TN)","D189":"CRUCOLI (KR)","D192":"CUASSO AL MONTE (VA)","D194":"CUCCARO MONFERRATO (AL)","D195":"CUCCARO VETERE (SA)","D196":"CUCCIAGO (CO)","D197":"CUCEGLIO (TO)","D198":"CUGGIONO (MI)","D199":"CUGLIATE-FABIASCO (VA)","D200":"CUGLIERI (OR)","D201":"CUGNOLI (PE)","D202":"CUMIANA (TO)","D203":"CUMIGNANO SUL NAVIGLIO (CR)","D204":"CUNARDO (VA)","D205":"CUNEO (CN)","D206":"CUNEVO (TN)","D207":"CUNICO (AT)","D208":"CUORGNE' (TO)","D209":"CUPELLO (CH)","D210":"CUPRA MARITTIMA (AP)","D211":"CUPRAMONTANA (AN)","B824":"CURA CARPIGNANO (PV)","D214":"CURCURIS (OR)","D216":"CUREGGIO (NO)","D217":"CURIGLIA CON MONTEVIASCO (VA)","D218":"CURINGA (CZ)","D219":"CURINO (BI)","D221":"CURNO (BG)","D222":"CURON VENOSTA .GRAUN IN VINSCHGAU. (BZ)","D223":"CURSI (LE)","D225":"CURSOLO-ORASSO (VB)","D226":"CURTAROLO (PD)","D227":"CURTATONE (MN)","D228":"CURTI (CE)","D229":"CUSAGO (MI)","D231":"CUSANO MILANINO (MI)","D230":"CUSANO MUTRI (BN)","D232":"CUSINO (CO)","D233":"CUSIO (BG)","D234":"CUSTONACI (TP)","D235":"CUTIGLIANO (PT)","D236":"CUTRO (KR)","D237":"CUTROFIANO (LE)","D238":"CUVEGLIO (VA)","D239":"CUVIO (VA)","D243":"DAIANO (TN)","D244":"DAIRAGO (MI)","D245":"DALMINE (BG)","D246":"DAMBEL (TN)","D247":"DANTA DI CADORE (BL)","D248":"DAONE (TN)","D250":"DARE' (TN)","D251":"DARFO BOARIO TERME (BS)","D253":"DASA' (VV)","D255":"DAVAGNA (GE)","D256":"DAVERIO (VA)","D257":"DAVOLI (CZ)","D258":"DAZIO (SO)","D259":"DECIMOMANNU (CA)","D260":"DECIMOPUTZU (CA)","D261":"DECOLLATURA (CZ)","D264":"DEGO (SV)","D265":"DEIVA MARINA (SP)","D266":"DELEBIO (SO)","D267":"DELIA (CL)","D268":"DELIANUOVA (RC)","D269":"DELICETO (FG)","D270":"DELLO (BS)","D271":"DEMONTE (CN)","D272":"DENICE (AL)","D273":"DENNO (TN)","D277":"DERNICE (AL)","D278":"DEROVERE (CR)","D279":"DERUTA (PG)","D280":"DERVIO (LC)","D281":"DESANA (VC)","D284":"DESENZANO DEL GARDA (BS)","D286":"DESIO (MI)","D287":"DESULO (NU)","D289":"DIAMANTE (CS)","D293":"DIANO ARENTINO (IM)","D296":"DIANO CASTELLO (IM)","D291":"DIANO D'ALBA (CN)","D297":"DIANO MARINA (IM)","D298":"DIANO SAN PIETRO (IM)","D299":"DICOMANO (FI)","D300":"DIGNANO (UD)","D302":"DIMARO (TN)","D303":"DINAMI (VV)","D304":"DIPIGNANO (CS)","D305":"DISO (LE)","D309":"DIVIGNANO (NO)","D310":"DIZZASCO (CO)","D311":"DOBBIACO .TOBLACH. (BZ)","D312":"DOBERDO' DEL LAGO (GO)","D314":"DOGLIANI (CN)","D315":"DOGLIOLA (CH)","D316":"DOGNA (UD)","D317":"DOLCE' (VR)","D318":"DOLCEACQUA (IM)","D319":"DOLCEDO (IM)","D321":"DOLEGNA DEL COLLIO (GO)","D323":"DOLIANOVA (CA)","D325":"DOLO (VE)","D327":"DOLZAGO (LC)","D328":"DOMANICO (CS)","D329":"DOMASO (CO)","D330":"DOMEGGE DI CADORE (BL)","D331":"DOMICELLA (AV)","D332":"DOMODOSSOLA (VB)","D333":"DOMUS DE MARIA (CA)","D334":"DOMUSNOVAS (CA)","D336":"DON (TN)","D339":"DONATO (BI)","D341":"DONGO (CO)","D338":"DONNAS (AO)","D344":"DONORI (CA)","D345":"DORGALI (NU)","D346":"DORIO (LC)","D347":"DORMELLETTO (NO)","D348":"DORNO (PV)","D349":"DORSINO (TN)","D350":"DORZANO (BI)","D351":"DOSOLO (MN)","D352":"DOSSENA (BG)","D355":"DOSSO DEL LIRO (CO)","D356":"DOUES (AO)","D357":"DOVADOLA (FC)","D358":"DOVERA (CR)","D360":"DOZZA (BO)","D361":"DRAGONI (CE)","D364":"DRAPIA (VV)","D365":"DRENA (TN)","D366":"DRENCHIA (UD)","D367":"DRESANO (MI)","D369":"DREZZO (CO)","D370":"DRIZZONA (CR)","D371":"DRO (TN)","D372":"DRONERO (CN)","D373":"DRUENTO (TO)","D374":"DRUOGNO (VB)","D376":"DUALCHI (NU)","D377":"DUBINO (SO)","M300":"DUE CARRARE (PD)","D379":"DUEVILLE (VI)","D380":"DUGENTA (BN)","D383":"DUINO-AURISINA (TS)","D384":"DUMENZA (VA)","D385":"DUNO (VA)","D386":"DURAZZANO (BN)","C772":"DURONIA (CB)","D388":"DUSINO SAN MICHELE (AT)","D390":"EBOLI (SA)","D391":"EDOLO (BS)","D392":"EGNA .NEUMARKT. (BZ)","D394":"ELICE (PE)","D395":"ELINI (NU)","D398":"ELLO (LC)","D399":"ELMAS (CA)","D401":"ELVA (CN)","D402":"EMARESE (AO)","D403":"EMPOLI (FI)","D406":"ENDINE GAIANO (BG)","D407":"ENEGO (VI)","D408":"ENEMONZO (UD)","C342":"ENNA (EN)","D410":"ENTRACQUE (CN)","D411":"ENTRATICO (BG)","D412":"ENVIE (CN)","D414":"EPISCOPIA (PZ)","D415":"ERACLEA (VE)","D416":"ERBA (CO)","D419":"ERBE' (VR)","D420":"ERBEZZO (VR)","D421":"ERBUSCO (BS)","D422":"ERCHIE (BR)","H243":"ERCOLANO (NA)","D423":"ERICE (TP)","D424":"ERLI (SV)","D426":"ERTO E CASSO (PN)","M292":"ERULA (SS)","D428":"ERVE (LC)","D429":"ESANATOGLIA (MC)","D430":"ESCALAPLANO (NU)","D431":"ESCOLCA (NU)","D434":"ESINE (BS)","D436":"ESINO LARIO (LC)","D440":"ESPERIA (FR)","D441":"ESPORLATU (SS)","D442":"ESTE (PD)","D443":"ESTERZILI (NU)","D444":"ETROUBLES (AO)","D445":"EUPILIO (CO)","D433":"EXILLES (TO)","D447":"FABBRICA CURONE (AL)","D449":"FABBRICHE DI VALLICO (LU)","D450":"FABBRICO (RE)","D451":"FABRIANO (AN)","D452":"FABRICA DI ROMA (VT)","D453":"FABRIZIA (VV)","D454":"FABRO (TR)","D455":"FAEDIS (UD)","D457":"FAEDO (TN)","D456":"FAEDO VALTELLINO (SO)","D458":"FAENZA (RA)","D459":"FAETO (FG)","D461":"FAGAGNA (UD)","D462":"FAGGETO LARIO (CO)","D463":"FAGGIANO (TA)","D465":"FAGNANO ALTO (AQ)","D464":"FAGNANO CASTELLO (CS)","D467":"FAGNANO OLONA (VA)","D468":"FAI DELLA PAGANELLA (TN)","D469":"FAICCHIO (BN)","D470":"FALCADE (BL)","D471":"FALCIANO DEL MASSICO (CE)","D473":"FALCONARA ALBANESE (CS)","D472":"FALCONARA MARITTIMA (AN)","D474":"FALCONE (ME)","D475":"FALERIA (VT)","D476":"FALERNA (CZ)","D477":"FALERONE (AP)","D480":"FALLO (CH)","D481":"FALMENTA (VB)","D482":"FALOPPIO (CO)","D483":"FALVATERRA (FR)","D484":"FALZES .PFALZEN. (BZ)","D486":"FANANO (MO)","D487":"FANNA (PN)","D488":"FANO (PU)","D489":"FANO ADRIANO (TE)","D494":"FARA FILIORUM PETRI (CH)","D490":"FARA GERA D'ADDA (BG)","D493":"FARA IN SABINA (RI)","D492":"FARA NOVARESE (NO)","D491":"FARA OLIVANA CON SOLA (BG)","D495":"FARA SAN MARTINO (CH)","D496":"FARA VICENTINO (VI)","D497":"FARDELLA (PZ)","D499":"FARIGLIANO (CN)","D501":"FARINDOLA (PE)","D502":"FARINI (PC)","D503":"FARNESE (VT)","D506":"FARRA D'ALPAGO (BL)","D505":"FARRA DI SOLIGO (TV)","D504":"FARRA D'ISONZO (GO)","D508":"FASANO (BR)","D509":"FASCIA (GE)","D510":"FAUGLIA (PI)","D511":"FAULE (CN)","D512":"FAVALE DI MALVARO (GE)","D514":"FAVARA (AG)","D516":"FAVER (TN)","D518":"FAVIGNANA (TP)","D520":"FAVRIA (TO)","D523":"FEISOGLIO (CN)","D524":"FELETTO (TO)","D526":"FELINO (PR)","D527":"FELITTO (SA)","D528":"FELIZZANO (AL)","D529":"FELONICA (MN)","D530":"FELTRE (BL)","D531":"FENEGRO' (CO)","D532":"FENESTRELLE (TO)","D537":"FENIS (AO)","D538":"FERENTILLO (TR)","D539":"FERENTINO (FR)","D540":"FERLA (SR)","D541":"FERMIGNANO (PU)","D542":"FERMO (AP)","D543":"FERNO (VA)","D544":"FEROLETO ANTICO (CZ)","D545":"FEROLETO DELLA CHIESA (RC)","D547":"FERRANDINA (MT)","D548":"FERRARA (FE)","D549":"FERRARA DI MONTE BALDO (VR)","D550":"FERRAZZANO (CB)","D551":"FERRERA DI VARESE (VA)","D552":"FERRERA ERBOGNONE (PV)","D554":"FERRERE (AT)","D555":"FERRIERE (PC)","D557":"FERRUZZANO (RC)","D560":"FIAMIGNANO (RI)","D562":"FIANO (TO)","D561":"FIANO ROMANO (RM)","D564":"FIASTRA (MC)","D565":"FIAVE' (TN)","D567":"FICARAZZI (PA)","D568":"FICAROLO (RO)","D569":"FICARRA (ME)","D570":"FICULLE (TR)","B034":"FIDENZA (PR)","D571":"FIE' ALLO SCILIAR .VOLS AM SCHLERN. (BZ)","D572":"FIERA DI PRIMIERO (TN)","D573":"FIEROZZO (TN)","D574":"FIESCO (CR)","D575":"FIESOLE (FI)","D576":"FIESSE (BS)","D578":"FIESSO D'ARTICO (VE)","D577":"FIESSO UMBERTIANO (RO)","D579":"FIGINO SERENZA (CO)","D583":"FIGLINE VALDARNO (FI)","D582":"FIGLINE VEGLIATURO (CS)","D586":"FILACCIANO (RM)","D587":"FILADELFIA (VV)","D588":"FILAGO (BG)","D589":"FILANDARI (VV)","D590":"FILATTIERA (MS)","D591":"FILETTINO (FR)","D592":"FILETTO (CH)","D593":"FILIANO (PZ)","D594":"FILIGHERA (PV)","D595":"FILIGNANO (IS)","D596":"FILOGASO (VV)","D597":"FILOTTRANO (AN)","D599":"FINALE EMILIA (MO)","D600":"FINALE LIGURE (SV)","D604":"FINO DEL MONTE (BG)","D605":"FINO MORNASCO (CO)","D606":"FIORANO AL SERIO (BG)","D608":"FIORANO CANAVESE (TO)","D607":"FIORANO MODENESE (MO)","D609":"FIORDIMONTE (MC)","D611":"FIORENZUOLA D'ARDA (PC)","D612":"FIRENZE (FI)","D613":"FIRENZUOLA (FI)","D614":"FIRMO (CS)","D615":"FISCIANO (SA)","A310":"FIUGGI (FR)","D617":"FIUMALBO (MO)","D619":"FIUMARA (RC)","D621":"FIUME VENETO (PN)","D622":"FIUMEDINISI (ME)","D624":"FIUMEFREDDO BRUZIO (CS)","D623":"FIUMEFREDDO DI SICILIA (CT)","D627":"FIUMICELLO (UD)","M297":"FIUMICINO (RM)","D628":"FIUMINATA (MC)","D629":"FIVIZZANO (MS)","D630":"FLAIBANO (UD)","D631":"FLAVON (TN)","D634":"FLERO (BS)","D635":"FLORESTA (ME)","D636":"FLORIDIA (SR)","D637":"FLORINAS (SS)","D638":"FLUMERI (AV)","D639":"FLUMINIMAGGIORE (CA)","D640":"FLUSSIO (NU)","D641":"FOBELLO (VC)","D643":"FOGGIA (FG)","D644":"FOGLIANISE (BN)","D645":"FOGLIANO REDIPUGLIA (GO)","D646":"FOGLIZZO (TO)","D649":"FOIANO DELLA CHIANA (AR)","D650":"FOIANO DI VAL FORTORE (BN)","D651":"FOLGARIA (TN)","D652":"FOLIGNANO (AP)","D653":"FOLIGNO (PG)","D654":"FOLLINA (TV)","D655":"FOLLO (SP)","D656":"FOLLONICA (GR)","D660":"FOMBIO (LO)","D661":"FONDACHELLI-FANTINA (ME)","D662":"FONDI (LT)","D663":"FONDO (TN)","D665":"FONNI (NU)","D666":"FONTAINEMORE (AO)","D667":"FONTANA LIRI (FR)","D670":"FONTANAFREDDA (PN)","D671":"FONTANAROSA (AV)","D668":"FONTANELICE (BO)","D672":"FONTANELLA (BG)","D673":"FONTANELLATO (PR)","D674":"FONTANELLE (TV)","D675":"FONTANETO D'AGOGNA (NO)","D676":"FONTANETTO PO (VC)","D677":"FONTANIGORDA (GE)","D678":"FONTANILE (AT)","D679":"FONTANIVA (PD)","D680":"FONTE (TV)","M309":"FONTE NUOVA (RM)","D681":"FONTECCHIO (AQ)","D682":"FONTECHIARI (FR)","D683":"FONTEGRECA (CE)","D684":"FONTENO (BG)","D685":"FONTEVIVO (PR)","D686":"FONZASO (BL)","D688":"FOPPOLO (BG)","D689":"FORANO (RI)","D691":"FORCE (AP)","D693":"FORCHIA (BN)","D694":"FORCOLA (SO)","D695":"FORDONGIANUS (OR)","D696":"FORENZA (PZ)","D697":"FORESTO SPARSO (BG)","D700":"FORGARIA NEL FRIULI (UD)","D701":"FORINO (AV)","D702":"FORIO (NA)","D704":"FORLI' (FC)","D703":"FORLI' DEL SANNIO (IS)","D705":"FORLIMPOPOLI (FC)","D706":"FORMAZZA (VB)","D707":"FORMELLO (RM)","D708":"FORMIA (LT)","D709":"FORMICOLA (CE)","D710":"FORMIGARA (CR)","D711":"FORMIGINE (MO)","D712":"FORMIGLIANA (VC)","D713":"FORMIGNANA (FE)","D714":"FORNACE (TN)","D715":"FORNELLI (IS)","D718":"FORNI AVOLTRI (UD)","D719":"FORNI DI SOPRA (UD)","D720":"FORNI DI SOTTO (UD)","D725":"FORNO CANAVESE (TO)","D726":"FORNO DI ZOLDO (BL)","D728":"FORNOVO DI TARO (PR)","D727":"FORNOVO SAN GIOVANNI (BG)","D730":"FORTE DEI MARMI (LU)","D731":"FORTEZZA .FRANZENSFESTEN. (BZ)","D732":"FORTUNAGO (PV)","D733":"FORZA D'AGRO' (ME)","D734":"FOSCIANDORA (LU)","D735":"FOSDINOVO (MS)","D736":"FOSSA (AQ)","D738":"FOSSACESIA (CH)","D740":"FOSSALTA DI PIAVE (VE)","D741":"FOSSALTA DI PORTOGRUARO (VE)","D737":"FOSSALTO (CB)","D742":"FOSSANO (CN)","D745":"FOSSATO DI VICO (PG)","D744":"FOSSATO SERRALTA (CZ)","D748":"FOSSO' (VE)","D749":"FOSSOMBRONE (PU)","D750":"FOZA (VI)","D751":"FRABOSA SOPRANA (CN)","D752":"FRABOSA SOTTANA (CN)","D559":"FRACONALTO (AL)","D754":"FRAGAGNANO (TA)","D755":"FRAGNETO L'ABATE (BN)","D756":"FRAGNETO MONFORTE (BN)","D757":"FRAINE (CH)","D758":"FRAMURA (SP)","D763":"FRANCAVILLA AL MARE (CH)","D762":"FRANCAVILLA ANGITOLA (VV)","D759":"FRANCAVILLA BISIO (AL)","D760":"FRANCAVILLA D'ETE (AP)","D765":"FRANCAVILLA DI SICILIA (ME)","D761":"FRANCAVILLA FONTANA (BR)","D766":"FRANCAVILLA IN SINNI (PZ)","D764":"FRANCAVILLA MARITTIMA (CS)","D767":"FRANCICA (VV)","D768":"FRANCOFONTE (SR)","D769":"FRANCOLISE (CE)","D770":"FRASCARO (AL)","D771":"FRASCAROLO (PV)","D773":"FRASCATI (RM)","D774":"FRASCINETO (CS)","D775":"FRASSILONGO (TN)","D776":"FRASSINELLE POLESINE (RO)","D777":"FRASSINELLO MONFERRATO (AL)","D780":"FRASSINETO PO (AL)","D781":"FRASSINETTO (TO)","D782":"FRASSINO (CN)","D783":"FRASSINORO (MO)","D785":"FRASSO SABINO (RI)","D784":"FRASSO TELESINO (BN)","D788":"FRATTA POLESINE (RO)","D787":"FRATTA TODINA (PG)","D789":"FRATTAMAGGIORE (NA)","D790":"FRATTAMINORE (NA)","D791":"FRATTE ROSA (PU)","D793":"FRAZZANO' (ME)","D794":"FREGONA (TV)","D796":"FRESAGRANDINARIA (CH)","D797":"FRESONARA (AL)","D798":"FRIGENTO (AV)","D799":"FRIGNANO (CE)","D802":"FRINCO (AT)","D803":"FRISA (CH)","D804":"FRISANCO (PN)","D805":"FRONT (TO)","D807":"FRONTINO (PU)","D808":"FRONTONE (PU)","D810":"FROSINONE (FR)","D811":"FROSOLONE (IS)","D812":"FROSSASCO (TO)","D813":"FRUGAROLO (AL)","D814":"FUBINE (AL)","D815":"FUCECCHIO (FI)","D817":"FUIPIANO VALLE IMAGNA (BG)","D818":"FUMANE (VR)","D819":"FUMONE (FR)","D821":"FUNES .VILLNOSS. (BZ)","D823":"FURCI (CH)","D824":"FURCI SICULO (ME)","D825":"FURNARI (ME)","D826":"FURORE (SA)","D827":"FURTEI (CA)","D828":"FUSCALDO (CS)","D829":"FUSIGNANO (RA)","D830":"FUSINE (SO)","D832":"FUTANI (SA)","D834":"GABBIONETA BINANUOVA (CR)","D835":"GABIANO (AL)","D836":"GABICCE MARE (PU)","D839":"GABY (AO)","D841":"GADESCO PIEVE DELMONA (CR)","D842":"GADONI (NU)","D843":"GAETA (LT)","D844":"GAGGI (ME)","D845":"GAGGIANO (MI)","D847":"GAGGIO MONTANO (BO)","D848":"GAGLIANICO (BI)","D850":"GAGLIANO ATERNO (AQ)","D849":"GAGLIANO CASTELFERRATO (EN)","D851":"GAGLIANO DEL CAPO (LE)","D852":"GAGLIATO (CZ)","D853":"GAGLIOLE (MC)","D854":"GAIARINE (TV)","D855":"GAIBA (RO)","D856":"GAIOLA (CN)","D858":"GAIOLE IN CHIANTI (SI)","D859":"GAIRO (NU)","D860":"GAIS .GAIS. (BZ)","D861":"GALATI MAMERTINO (ME)","D862":"GALATINA (LE)","D863":"GALATONE (LE)","D864":"GALATRO (RC)","D865":"GALBIATE (LC)","D867":"GALEATA (FC)","D868":"GALGAGNANO (LO)","D869":"GALLARATE (VA)","D870":"GALLESE (VT)","D872":"GALLIATE (NO)","D871":"GALLIATE LOMBARDO (VA)","D873":"GALLIAVOLA (PV)","D874":"GALLICANO (LU)","D875":"GALLICANO NEL LAZIO (RM)","D876":"GALLICCHIO (PZ)","D878":"GALLIERA (BO)","D879":"GALLIERA VENETA (PD)","D881":"GALLINARO (FR)","D882":"GALLIO (VI)","D883":"GALLIPOLI (LE)","D884":"GALLO MATESE (CE)","D885":"GALLODORO (ME)","D886":"GALLUCCIO (CE)","D888":"GALTELLI (NU)","D889":"GALZIGNANO TERME (PD)","D890":"GAMALERO (AL)","D891":"GAMBARA (BS)","D892":"GAMBARANA (PV)","D894":"GAMBASCA (CN)","D895":"GAMBASSI TERME (FI)","D896":"GAMBATESA (CB)","D897":"GAMBELLARA (VI)","D898":"GAMBERALE (CH)","D899":"GAMBETTOLA (FC)","D901":"GAMBOLO' (PV)","D902":"GAMBUGLIANO (VI)","D903":"GANDELLINO (BG)","D905":"GANDINO (BG)","D906":"GANDOSSO (BG)","D907":"GANGI (PA)","D909":"GARAGUSO (MT)","D910":"GARBAGNA (AL)","D911":"GARBAGNA NOVARESE (NO)","D912":"GARBAGNATE MILANESE (MI)","D913":"GARBAGNATE MONASTERO (LC)","D915":"GARDA (VR)","D917":"GARDONE RIVIERA (BS)","D918":"GARDONE VAL TROMPIA (BS)","D920":"GARESSIO (CN)","D921":"GARGALLO (NO)","D923":"GARGAZZONE .GARGAZON. (BZ)","D924":"GARGNANO (BS)","D925":"GARLASCO (PV)","D926":"GARLATE (LC)","D927":"GARLENDA (SV)","D928":"GARNIGA TERME (TN)","D930":"GARZENO (CO)","D931":"GARZIGLIANA (TO)","D932":"GASPERINA (CZ)","D933":"GASSINO TORINESE (TO)","D934":"GATTATICO (RE)","D935":"GATTEO (FC)","D937":"GATTICO (NO)","D938":"GATTINARA (VC)","D940":"GAVARDO (BS)","D941":"GAVAZZANA (AL)","D942":"GAVELLO (RO)","D943":"GAVERINA TERME (BG)","D944":"GAVI (AL)","D945":"GAVIGNANO (RM)","D946":"GAVIRATE (VA)","D947":"GAVOI (NU)","D948":"GAVORRANO (GR)","D949":"GAZOLDO DEGLI IPPOLITI (MN)","D951":"GAZZADA SCHIANNO (VA)","D952":"GAZZANIGA (BG)","D956":"GAZZO PADOVANO (PD)","D957":"GAZZO VERONESE (VR)","D958":"GAZZOLA (PC)","D959":"GAZZUOLO (MN)","D960":"GELA (CL)","D961":"GEMMANO (RN)","D962":"GEMONA DEL FRIULI (UD)","D963":"GEMONIO (VA)","D964":"GENAZZANO (RM)","D965":"GENGA (AN)","D966":"GENIVOLTA (CR)","D967":"GENOLA (CN)","D968":"GENONI (NU)","D969":"GENOVA (GE)","D970":"GENURI (CA)","D971":"GENZANO DI LUCANIA (PZ)","D972":"GENZANO DI ROMA (RM)","D973":"GENZONE (PV)","D974":"GERA LARIO (CO)","D975":"GERACE (RC)","D977":"GERACI SICULO (PA)","D978":"GERANO (RM)","D980":"GERENZAGO (PV)","D981":"GERENZANO (VA)","D982":"GERGEI (NU)","D983":"GERMAGNANO (TO)","D984":"GERMAGNO (VB)","D986":"GERMASINO (CO)","D987":"GERMIGNAGA (VA)","D988":"GEROCARNE (VV)","D990":"GEROLA ALTA (SO)","D991":"GEROSA (BG)","D993":"GERRE DE' CAPRIOLI (CR)","D994":"GESICO (CA)","D995":"GESSATE (MI)","D996":"GESSOPALENA (CH)","D997":"GESTURI (CA)","D998":"GESUALDO (AV)","D999":"GHEDI (BS)","E001":"GHEMME (NO)","E003":"GHIFFA (VB)","E004":"GHILARZA (OR)","E006":"GHISALBA (BG)","E007":"GHISLARENGO (VC)","E008":"GIACCIANO CON BARUCHELLA (RO)","E009":"GIAGLIONE (TO)","E010":"GIANICO (BS)","E012":"GIANO DELL'UMBRIA (PG)","E011":"GIANO VETUSTO (CE)","E013":"GIARDINELLO (PA)","E014":"GIARDINI-NAXOS (ME)","E015":"GIAROLE (AL)","E016":"GIARRATANA (RG)","E017":"GIARRE (CT)","E019":"GIAVE (SS)","E020":"GIAVENO (TO)","E021":"GIAVERA DEL MONTELLO (TV)","E022":"GIBA (CA)","E023":"GIBELLINA (TP)","E024":"GIFFLENGA (BI)","E025":"GIFFONE (RC)","E026":"GIFFONI SEI CASALI (SA)","E027":"GIFFONI VALLE PIANA (SA)","E028":"GIGNESE (VB)","E029":"GIGNOD (AO)","E030":"GILDONE (CB)","E031":"GIMIGLIANO (CZ)","E033":"GINESTRA (PZ)","E034":"GINESTRA DEGLI SCHIAVONI (BN)","E036":"GINOSA (TA)","E037":"GIOI (SA)","E040":"GIOIA DEI MARSI (AQ)","E038":"GIOIA DEL COLLE (BA)","E039":"GIOIA SANNITICA (CE)","E041":"GIOIA TAURO (RC)","E044":"GIOIOSA IONICA (RC)","E043":"GIOIOSA MAREA (ME)","E045":"GIOVE (TR)","E047":"GIOVINAZZO (BA)","E048":"GIOVO (TN)","E049":"GIRASOLE (NU)","E050":"GIRIFALCO (CZ)","E051":"GIRONICO (CO)","E052":"GISSI (CH)","E053":"GIUGGIANELLO (LE)","E054":"GIUGLIANO IN CAMPANIA (NA)","E055":"GIULIANA (PA)","E057":"GIULIANO DI ROMA (FR)","E056":"GIULIANO TEATINO (CH)","E058":"GIULIANOVA (TE)","E059":"GIUNCUGNANO (LU)","E060":"GIUNGANO (SA)","E061":"GIURDIGNANO (LE)","E062":"GIUSSAGO (PV)","E063":"GIUSSANO (MI)","E064":"GIUSTENICE (SV)","E065":"GIUSTINO (TN)","E066":"GIUSVALLA (SV)","E067":"GIVOLETTO (TO)","E068":"GIZZERIA (CZ)","E069":"GLORENZA .GLURNS. (BZ)","E071":"GODEGA DI SANT'URBANO (TV)","E072":"GODIASCO (PV)","E074":"GODRANO (PA)","E078":"GOITO (MN)","E079":"GOLASECCA (VA)","E081":"GOLFERENZO (PV)","M274":"GOLFO ARANCI (SS)","E082":"GOMBITO (CR)","E083":"GONARS (UD)","E084":"GONI (CA)","E086":"GONNESA (CA)","E087":"GONNOSCODINA (OR)","E085":"GONNOSFANADIGA (CA)","D585":"GONNOSNO' (OR)","E088":"GONNOSTRAMATZA (OR)","E089":"GONZAGA (MN)","E090":"GORDONA (SO)","E091":"GORGA (RM)","E092":"GORGO AL MONTICANO (TV)","E093":"GORGOGLIONE (MT)","E094":"GORGONZOLA (MI)","E096":"GORIANO SICOLI (AQ)","E098":"GORIZIA (GO)","E101":"GORLA MAGGIORE (VA)","E102":"GORLA MINORE (VA)","E100":"GORLAGO (BG)","E103":"GORLE (BG)","E104":"GORNATE-OLONA (VA)","E106":"GORNO (BG)","E107":"GORO (FE)","E109":"GORRETO (GE)","E111":"GORZEGNO (CN)","E113":"GOSALDO (BL)","E114":"GOSSOLENGO (PC)","E115":"GOTTASECCA (CN)","E116":"GOTTOLENGO (BS)","E118":"GOVONE (CN)","E120":"GOZZANO (NO)","E122":"GRADARA (PU)","E124":"GRADISCA D'ISONZO (GO)","E125":"GRADO (GO)","E126":"GRADOLI (VT)","E127":"GRAFFIGNANA (LO)","E128":"GRAFFIGNANO (VT)","E130":"GRAGLIA (BI)","E131":"GRAGNANO (NA)","E132":"GRAGNANO TREBBIENSE (PC)","E133":"GRAMMICHELE (CT)","E134":"GRANA (AT)","E135":"GRANAGLIONE (BO)","E136":"GRANAROLO DELL'EMILIA (BO)","E138":"GRANCONA (VI)","E139":"GRANDATE (CO)","E141":"GRANDOLA ED UNITI (CO)","E142":"GRANITI (ME)","E143":"GRANOZZO CON MONTICELLO (NO)","E144":"GRANTOLA (VA)","E145":"GRANTORTO (PD)","E146":"GRANZE (PD)","E147":"GRASSANO (MT)","E148":"GRASSOBBIO (BG)","E149":"GRATTERI (PA)","E150":"GRAUNO (TN)","E151":"GRAVEDONA (CO)","E152":"GRAVELLONA LOMELLINA (PV)","E153":"GRAVELLONA TOCE (VB)","E154":"GRAVERE (TO)","E156":"GRAVINA DI CATANIA (CT)","E155":"GRAVINA IN PUGLIA (BA)","E158":"GRAZZANISE (CE)","E159":"GRAZZANO BADOGLIO (AT)","E160":"GRECCIO (RI)","E161":"GRECI (AV)","E163":"GREGGIO (VC)","E164":"GREMIASCO (AL)","E165":"GRESSAN (AO)","E167":"GRESSONEY-LA-TRINITE' (AO)","E168":"GRESSONEY-SAINT-JEAN (AO)","E169":"GREVE IN CHIANTI (FI)","E170":"GREZZAGO (MI)","E171":"GREZZANA (VR)","E172":"GRIANTE (CO)","E173":"GRICIGNANO DI AVERSA (CE)","E177":"GRIGNASCO (NO)","E178":"GRIGNO (TN)","E179":"GRIMACCO (UD)","E180":"GRIMALDI (CS)","E182":"GRINZANE CAVOUR (CN)","E184":"GRISIGNANO DI ZOCCO (VI)","E185":"GRISOLIA (CS)","E187":"GRIZZANA MORANDI (BO)","E188":"GROGNARDO (AL)","E189":"GROMO (BG)","E191":"GRONDONA (AL)","E192":"GRONE (BG)","E193":"GRONTARDO (CR)","E195":"GROPELLO CAIROLI (PV)","E196":"GROPPARELLO (PC)","E199":"GROSCAVALLO (TO)","E200":"GROSIO (SO)","E201":"GROSOTTO (SO)","E202":"GROSSETO (GR)","E203":"GROSSO (TO)","E204":"GROTTAFERRATA (RM)","E205":"GROTTAGLIE (TA)","E206":"GROTTAMINARDA (AV)","E207":"GROTTAMMARE (AP)","E208":"GROTTAZZOLINA (AP)","E209":"GROTTE (AG)","E210":"GROTTE DI CASTRO (VT)","E212":"GROTTERIA (RC)","E213":"GROTTOLE (MT)","E214":"GROTTOLELLA (AV)","E215":"GRUARO (VE)","E216":"GRUGLIASCO (TO)","E217":"GRUMELLO CREMONESE ED UNITI (CR)","E219":"GRUMELLO DEL MONTE (BG)","E221":"GRUMENTO NOVA (PZ)","E222":"GRUMES (TN)","E223":"GRUMO APPULA (BA)","E224":"GRUMO NEVANO (NA)","E226":"GRUMOLO DELLE ABBADESSE (VI)","E227":"GUAGNANO (LE)","E228":"GUALDO (MC)","E229":"GUALDO CATTANEO (PG)","E230":"GUALDO TADINO (PG)","E232":"GUALTIERI (RE)","E233":"GUALTIERI SICAMINO' (ME)","E234":"GUAMAGGIORE (CA)","E235":"GUANZATE (CO)","E236":"GUARCINO (FR)","E240":"GUARDA VENETA (RO)","E237":"GUARDABOSONE (VC)","E238":"GUARDAMIGLIO (LO)","E239":"GUARDAVALLE (CZ)","E241":"GUARDEA (TR)","E245":"GUARDIA LOMBARDI (AV)","E246":"GUARDIA PERTICARA (PZ)","E242":"GUARDIA PIEMONTESE (CS)","E249":"GUARDIA SANFRAMONDI (BN)","E243":"GUARDIAGRELE (CH)","E244":"GUARDIALFIERA (CB)","E248":"GUARDIAREGIA (CB)","E250":"GUARDISTALLO (PI)","E251":"GUARENE (CN)","E252":"GUASILA (CA)","E253":"GUASTALLA (RE)","E255":"GUAZZORA (AL)","E256":"GUBBIO (PG)","E258":"GUDO VISCONTI (MI)","E259":"GUGLIONESI (CB)","E261":"GUIDIZZOLO (MN)","E263":"GUIDONIA MONTECELIO (RM)","E264":"GUIGLIA (MO)","E266":"GUILMI (CH)","E269":"GURRO (VB)","E270":"GUSPINI (CA)","E271":"GUSSAGO (BS)","E272":"GUSSOLA (CR)","E273":"HONE (AO)","E280":"IDRO (BS)","E281":"IGLESIAS (CA)","E282":"IGLIANO (CN)","E283":"ILBONO (NU)","E284":"ILLASI (VR)","E285":"ILLORAI (SS)","E287":"IMBERSAGO (LC)","E288":"IMER (TN)","E289":"IMOLA (BO)","E290":"IMPERIA (IM)","E291":"IMPRUNETA (FI)","E292":"INARZO (VA)","E296":"INCISA IN VAL D'ARNO (FI)","E295":"INCISA SCAPACCINO (AT)","E297":"INCUDINE (BS)","E299":"INDUNO OLONA (VA)","E301":"INGRIA (TO)","E304":"INTRAGNA (VB)","E305":"INTROBIO (LC)","E306":"INTROD (AO)","E307":"INTRODACQUA (AQ)","E308":"INTROZZO (LC)","E309":"INVERIGO (CO)","E310":"INVERNO E MONTELEONE (PV)","E311":"INVERSO PINASCA (TO)","E313":"INVERUNO (MI)","E314":"INVORIO (NO)","E317":"INZAGO (MI)","E321":"IONADI (VV)","E323":"IRGOLI (NU)","E325":"IRMA (BS)","E326":"IRSINA (MT)","E327":"ISASCA (CN)","E328":"ISCA SULLO IONIO (CZ)","E329":"ISCHIA (NA)","E330":"ISCHIA DI CASTRO (VT)","E332":"ISCHITELLA (FG)","E333":"ISEO (BS)","E334":"ISERA (TN)","E335":"ISERNIA (IS)","E336":"ISILI (NU)","E337":"ISNELLO (PA)","E338":"ISOLA D'ASTI (AT)","E341":"ISOLA DEL CANTONE (GE)","E348":"ISOLA DEL GIGLIO (GR)","E343":"ISOLA DEL GRAN SASSO D'ITALIA (TE)","E340":"ISOLA DEL LIRI (FR)","E351":"ISOLA DEL PIANO (PU)","E349":"ISOLA DELLA SCALA (VR)","E350":"ISOLA DELLE FEMMINE (PA)","E339":"ISOLA DI CAPO RIZZUTO (KR)","E353":"ISOLA DI FONDRA (BG)","E356":"ISOLA DOVARESE (CR)","E358":"ISOLA RIZZA (VR)","E360":"ISOLA SANT'ANTONIO (AL)","E354":"ISOLA VICENTINA (VI)","E345":"ISOLABELLA (TO)","E346":"ISOLABONA (IM)","E363":"ISOLE TREMITI (FG)","E364":"ISORELLA (BS)","E365":"ISPANI (SA)","E366":"ISPICA (RG)","E367":"ISPRA (VA)","E368":"ISSIGLIO (TO)","E369":"ISSIME (AO)","E370":"ISSO (BG)","E371":"ISSOGNE (AO)","E373":"ISTRANA (TV)","E374":"ITALA (ME)","E375":"ITRI (LT)","E376":"ITTIREDDU (SS)","E377":"ITTIRI (SS)","E378":"IVANO FRACENA (TN)","E379":"IVREA (TO)","E380":"IZANO (CR)","E274":"JACURSO (CZ)","E381":"JELSI (CB)","E382":"JENNE (RM)","E386":"JERAGO CON ORAGO (VA)","E387":"JERZU (NU)","E388":"JESI (AN)","C388":"JESOLO (VE)","E320":"JOLANDA DI SAVOIA (FE)","E389":"JOPPOLO (VV)","E390":"JOPPOLO GIANCAXIO (AG)","E391":"JOVENCAN (AO)","E394":"LA CASSA (TO)","E423":"LA LOGGIA (TO)","E425":"LA MADDALENA (SS)","A308":"LA MAGDELEINE (AO)","E430":"LA MORRA (CN)","E458":"LA SALLE (AO)","E463":"LA SPEZIA (SP)","E470":"LA THUILE (AO)","E491":"LA VALLE .WENGEN. (BZ)","E490":"LA VALLE AGORDINA (BL)","E392":"LABICO (RM)","E393":"LABRO (RI)","E395":"LACCHIARELLA (MI)","E396":"LACCO AMENO (NA)","E397":"LACEDONIA (AV)","E398":"LACES .LATSCH. (BZ)","E400":"LACONI (NU)","M212":"LADISPOLI (RM)","E401":"LAERRU (SS)","E402":"LAGANADI (RC)","E403":"LAGHI (VI)","E405":"LAGLIO (CO)","E406":"LAGNASCO (CN)","E407":"LAGO (CS)","E409":"LAGONEGRO (PZ)","E410":"LAGOSANTO (FE)","E412":"LAGUNDO .ALGUND. (BZ)","E414":"LAIGUEGLIA (SV)","E415":"LAINATE (MI)","E416":"LAINO (CO)","E417":"LAINO BORGO (CS)","E419":"LAINO CASTELLO (CS)","E420":"LAION .LAJEN. (BZ)","E421":"LAIVES .LEIFERS. (BZ)","E413":"LAJATICO (PI)","E422":"LALLIO (BG)","E424":"LAMA DEI PELIGNI (CH)","E426":"LAMA MOCOGNO (MO)","E428":"LAMBRUGO (CO)","M208":"LAMEZIA TERME (CZ)","E429":"LAMON (BL)","E431":"LAMPEDUSA E LINOSA (AG)","E432":"LAMPORECCHIO (PT)","E433":"LAMPORO (VC)","E434":"LANA .LANA. (BZ)","E435":"LANCIANO (CH)","E436":"LANDIONA (NO)","E437":"LANDRIANO (PV)","E438":"LANGHIRANO (PR)","E439":"LANGOSCO (PV)","E441":"LANUSEI (NU)","C767":"LANUVIO (RM)","E443":"LANZADA (SO)","E444":"LANZO D'INTELVI (CO)","E445":"LANZO TORINESE (TO)","E447":"LAPEDONA (AP)","E448":"LAPIO (AV)","E450":"LAPPANO (CS)","A345":"L'AQUILA (AQ)","E451":"LARCIANO (PT)","E452":"LARDARO (TN)","E454":"LARDIRAGO (PV)","E455":"LARI (PI)","M207":"LARIANO (RM)","E456":"LARINO (CB)","E464":"LAS PLASSAS (CA)","E457":"LASA .LAAS. (BZ)","E459":"LASCARI (PA)","E461":"LASINO (TN)","E462":"LASNIGO (CO)","E465":"LASTEBASSE (VI)","E466":"LASTRA A SIGNA (FI)","E467":"LATERA (VT)","E468":"LATERINA (AR)","E469":"LATERZA (TA)","E471":"LATIANO (BR)","E472":"LATINA (LT)","E473":"LATISANA (UD)","E474":"LATRONICO (PZ)","E475":"LATTARICO (CS)","E476":"LAUCO (UD)","E480":"LAUREANA CILENTO (SA)","E479":"LAUREANA DI BORRELLO (RC)","E481":"LAUREGNO .LAUREIN. (BZ)","E482":"LAURENZANA (PZ)","E483":"LAURIA (PZ)","E484":"LAURIANO (TO)","E485":"LAURINO (SA)","E486":"LAURITO (SA)","E487":"LAURO (AV)","E488":"LAVAGNA (GE)","E489":"LAVAGNO (VR)","E492":"LAVARONE (TN)","E493":"LAVELLO (PZ)","E494":"LAVENA PONTE TRESA (VA)","E496":"LAVENO-MOMBELLO (VA)","E497":"LAVENONE (BS)","E498":"LAVIANO (SA)","E500":"LAVIS (TN)","E502":"LAZISE (VR)","E504":"LAZZATE (MI)","E506":"LECCE (LE)","E505":"LECCE NEI MARSI (AQ)","E507":"LECCO (LC)","E509":"LEFFE (BG)","E510":"LEGGIUNO (VA)","E512":"LEGNAGO (VR)","E514":"LEGNANO (MI)","E515":"LEGNARO (PD)","E517":"LEI (NU)","E518":"LEINI (TO)","E519":"LEIVI (GE)","E520":"LEMIE (TO)","E522":"LENDINARA (RO)","E523":"LENI (ME)","E524":"LENNA (BG)","E525":"LENNO (CO)","E526":"LENO (BS)","E527":"LENOLA (LT)","E528":"LENTA (VC)","E530":"LENTATE SUL SEVESO (MI)","E531":"LENTELLA (CH)","C562":"LENTIAI (BL)","E532":"LENTINI (SR)","E535":"LEONESSA (RI)","E536":"LEONFORTE (EN)","E537":"LEPORANO (TA)","E538":"LEQUILE (LE)","E540":"LEQUIO BERRIA (CN)","E539":"LEQUIO TANARO (CN)","E541":"LERCARA FRIDDI (PA)","E542":"LERICI (SP)","E543":"LERMA (AL)","E544":"LESA (NO)","E546":"LESEGNO (CN)","E547":"LESIGNANO DE' BAGNI (PR)","E549":"LESINA (FG)","E550":"LESMO (MI)","E551":"LESSOLO (TO)","E552":"LESSONA (BI)","E553":"LESTIZZA (UD)","E554":"LETINO (CE)","E555":"LETOJANNI (ME)","E557":"LETTERE (NA)","E558":"LETTOMANOPPELLO (PE)","E559":"LETTOPALENA (CH)","E560":"LEVANTO (SP)","E562":"LEVATE (BG)","E563":"LEVERANO (LE)","E564":"LEVICE (CN)","E565":"LEVICO TERME (TN)","E566":"LEVONE (TO)","E569":"LEZZENO (CO)","E570":"LIBERI (CE)","E571":"LIBRIZZI (ME)","E573":"LICATA (AG)","E574":"LICCIANA NARDI (MS)","E576":"LICENZA (RM)","E578":"LICODIA EUBEA (CT)","E581":"LIERNA (LC)","E583":"LIGNANA (VC)","E584":"LIGNANO SABBIADORO (UD)","E585":"LIGONCHIO (RE)","E586":"LIGOSULLO (UD)","E587":"LILLIANES (AO)","E588":"LIMANA (BL)","E589":"LIMATOLA (BN)","E590":"LIMBADI (VV)","E591":"LIMBIATE (MI)","E592":"LIMENA (PD)","E593":"LIMIDO COMASCO (CO)","E594":"LIMINA (ME)","E597":"LIMONE PIEMONTE (CN)","E596":"LIMONE SUL GARDA (BS)","E599":"LIMOSANO (CB)","E600":"LINAROLO (PV)","E602":"LINGUAGLOSSA (CT)","E605":"LIONI (AV)","E606":"LIPARI (ME)","E607":"LIPOMO (CO)","E608":"LIRIO (PV)","E610":"LISCATE (MI)","E611":"LISCIA (CH)","E613":"LISCIANO NICCONE (PG)","E614":"LISIGNAGO (TN)","E615":"LISIO (CN)","E617":"LISSONE (MI)","E620":"LIVERI (NA)","E621":"LIVIGNO (SO)","E622":"LIVINALLONGO DEL COL DI LANA (BL)","E623":"LIVO (CO)","E624":"LIVO (TN)","E625":"LIVORNO (LI)","E626":"LIVORNO FERRARIS (VC)","E627":"LIVRAGA (LO)","E629":"LIZZANELLO (LE)","E630":"LIZZANO (TA)","A771":"LIZZANO IN BELVEDERE (BO)","E632":"LOANO (SV)","E633":"LOAZZOLO (AT)","E635":"LOCANA (TO)","E639":"LOCATE DI TRIULZI (MI)","E638":"LOCATE VARESINO (CO)","E640":"LOCATELLO (BG)","E644":"LOCERI (NU)","E645":"LOCOROTONDO (BA)","D976":"LOCRI (RC)","E646":"LOCULI (NU)","E647":"LODE' (NU)","E648":"LODI (LO)","E651":"LODI VECCHIO (LO)","E649":"LODINE (NU)","E652":"LODRINO (BS)","E654":"LOGRATO (BS)","E655":"LOIANO (BO)","M275":"LOIRI PORTO SAN PAOLO (SS)","E656":"LOMAGNA (LC)","E658":"LOMASO (TN)","E659":"LOMAZZO (CO)","E660":"LOMBARDORE (TO)","E661":"LOMBRIASCO (TO)","E662":"LOMELLO (PV)","E664":"LONA LASES (TN)","E665":"LONATE CEPPINO (VA)","E666":"LONATE POZZOLO (VA)","E667":"LONATO (BS)","E668":"LONDA (FI)","E669":"LONGANO (IS)","E671":"LONGARE (VI)","E672":"LONGARONE (BL)","E673":"LONGHENA (BS)","E674":"LONGI (ME)","E675":"LONGIANO (FC)","E677":"LONGOBARDI (CS)","E678":"LONGOBUCCO (CS)","E679":"LONGONE AL SEGRINO (CO)","E681":"LONGONE SABINO (RI)","E682":"LONIGO (VI)","E683":"LORANZE' (TO)","E684":"LOREGGIA (PD)","E685":"LOREGLIA (VB)","E687":"LORENZAGO DI CADORE (BL)","E688":"LORENZANA (PI)","E689":"LOREO (RO)","E690":"LORETO (AN)","E691":"LORETO APRUTINO (PE)","E692":"LORIA (TV)","E693":"LORO CIUFFENNA (AR)","E694":"LORO PICENO (MC)","E695":"LORSICA (GE)","E698":"LOSINE (BS)","E700":"LOTZORAI (NU)","E704":"LOVERE (BG)","E705":"LOVERO (SO)","E706":"LOZIO (BS)","E707":"LOZZA (VA)","E709":"LOZZO ATESTINO (PD)","E708":"LOZZO DI CADORE (BL)","E711":"LOZZOLO (VC)","E712":"LU (AL)","E713":"LUBRIANO (VT)","E715":"LUCCA (LU)","E714":"LUCCA SICULA (AG)","E716":"LUCERA (FG)","E718":"LUCIGNANO (AR)","E719":"LUCINASCO (IM)","E722":"LUCITO (CB)","E723":"LUCO DEI MARSI (AQ)","E724":"LUCOLI (AQ)","E726":"LUGAGNANO VAL D'ARDA (PC)","E727":"LUGNACCO (TO)","E729":"LUGNANO IN TEVERINA (TR)","E730":"LUGO (RA)","E731":"LUGO DI VICENZA (VI)","E734":"LUINO (VA)","E735":"LUISAGO (CO)","E736":"LULA (NU)","E737":"LUMARZO (GE)","E738":"LUMEZZANE (BS)","E742":"LUNAMATRONA (CA)","E743":"LUNANO (PU)","B387":"LUNGAVILLA (PV)","E745":"LUNGRO (CS)","E746":"LUOGOSANO (AV)","E747":"LUOGOSANTO (SS)","E748":"LUPARA (CB)","E749":"LURAGO D'ERBA (CO)","E750":"LURAGO MARINONE (CO)","E751":"LURANO (BG)","E752":"LURAS (SS)","E753":"LURATE CACCIVIO (CO)","E754":"LUSCIANO (CE)","E757":"LUSERNA (TN)","E758":"LUSERNA SAN GIOVANNI (TO)","E759":"LUSERNETTA (TO)","E760":"LUSEVERA (UD)","E761":"LUSIA (RO)","E762":"LUSIANA (VI)","E763":"LUSIGLIE' (TO)","E764":"LUSON .LUSEN. (BZ)","E767":"LUSTRA (SA)","E769":"LUVINATE (VA)","E770":"LUZZANA (BG)","E772":"LUZZARA (RE)","E773":"LUZZI (CS)","E775":"MACCAGNO (VA)","E777":"MACCASTORNA (LO)","E778":"MACCHIA D'ISERNIA (IS)","E780":"MACCHIA VALFORTORE (CB)","E779":"MACCHIAGODENA (IS)","E782":"MACELLO (TO)","E783":"MACERATA (MC)","E784":"MACERATA CAMPANIA (CE)","E785":"MACERATA FELTRIA (PU)","E786":"MACHERIO (MI)","E787":"MACLODIO (BS)","E788":"MACOMER (NU)","E789":"MACRA (CN)","E790":"MACUGNAGA (VB)","E791":"MADDALONI (CE)","E342":"MADESIMO (SO)","E793":"MADIGNANO (CR)","E794":"MADONE (BG)","E795":"MADONNA DEL SASSO (VB)","E798":"MAENZA (LT)","E799":"MAFALDA (CB)","E800":"MAGASA (BS)","E801":"MAGENTA (MI)","E803":"MAGGIORA (NO)","E804":"MAGHERNO (PV)","E805":"MAGIONE (PG)","E806":"MAGISANO (CZ)","E809":"MAGLIANO ALFIERI (CN)","E808":"MAGLIANO ALPI (CN)","E811":"MAGLIANO DE' MARSI (AQ)","E807":"MAGLIANO DI TENNA (AP)","E810":"MAGLIANO IN TOSCANA (GR)","E813":"MAGLIANO ROMANO (RM)","E812":"MAGLIANO SABINA (RI)","E814":"MAGLIANO VETERE (SA)","E815":"MAGLIE (LE)","E816":"MAGLIOLO (SV)","E817":"MAGLIONE (TO)","E818":"MAGNACAVALLO (MN)","E819":"MAGNAGO (MI)","E821":"MAGNANO (BI)","E820":"MAGNANO IN RIVIERA (UD)","E825":"MAGOMADAS (NU)","E829":"MAGRE' SULLA STRADA DEL VINO .MARGREID AN DE. (BZ)","E830":"MAGREGLIO (CO)","E834":"MAIDA (CZ)","E835":"MAIERA' (CS)","E836":"MAIERATO (VV)","E837":"MAIOLATI SPONTINI (AN)","E838":"MAIOLO (PU)","E839":"MAIORI (SA)","E840":"MAIRAGO (LO)","E841":"MAIRANO (BS)","E842":"MAISSANA (SP)","E833":"MAJANO (UD)","E843":"MALAGNINO (CR)","E844":"MALALBERGO (BO)","E847":"MALBORGHETTO-VALBRUNA (UD)","E848":"MALCESINE (VR)","E850":"MALE' (TN)","E851":"MALEGNO (BS)","E852":"MALEO (LO)","E853":"MALESCO (VB)","E854":"MALETTO (CT)","E855":"MALFA (ME)","E856":"MALGESSO (VA)","E858":"MALGRATE (LC)","E859":"MALITO (CS)","E860":"MALLARE (SV)","E862":"MALLES VENOSTA .MALS. (BZ)","E863":"MALNATE (VA)","E864":"MALO (VI)","E865":"MALONNO (BS)","E866":"MALOSCO (TN)","E868":"MALTIGNANO (AP)","E869":"MALVAGNA (ME)","E870":"MALVICINO (AL)","E872":"MALVITO (CS)","E873":"MAMMOLA (RC)","E874":"MAMOIADA (NU)","E875":"MANCIANO (GR)","E876":"MANDANICI (ME)","E877":"MANDAS (CA)","E878":"MANDATORICCIO (CS)","B632":"MANDELA (RM)","E879":"MANDELLO DEL LARIO (LC)","E880":"MANDELLO VITTA (NO)","E882":"MANDURIA (TA)","E883":"MANERBA DEL GARDA (BS)","E884":"MANERBIO (BS)","E885":"MANFREDONIA (FG)","E887":"MANGO (CN)","E888":"MANGONE (CS)","M283":"MANIACE (CT)","E889":"MANIAGO (PN)","E891":"MANOCALZATI (AV)","E892":"MANOPPELLO (PE)","E893":"MANSUE' (TV)","E894":"MANTA (CN)","E896":"MANTELLO (SO)","E897":"MANTOVA (MN)","E899":"MANZANO (UD)","E900":"MANZIANA (RM)","E901":"MAPELLO (BG)","E902":"MARA (SS)","E903":"MARACALAGONIS (CA)","E904":"MARANELLO (MO)","E906":"MARANO DI NAPOLI (NA)","E911":"MARANO DI VALPOLICELLA (VR)","E908":"MARANO EQUO (RM)","E910":"MARANO LAGUNARE (UD)","E914":"MARANO MARCHESATO (CS)","E915":"MARANO PRINCIPATO (CS)","E905":"MARANO SUL PANARO (MO)","E907":"MARANO TICINO (NO)","E912":"MARANO VICENTINO (VI)","E917":"MARANZANA (AT)","E919":"MARATEA (PZ)","E921":"MARCALLO CON CASONE (MI)","E922":"MARCARIA (MN)","E923":"MARCEDUSA (CZ)","E924":"MARCELLINA (RM)","E925":"MARCELLINARA (CZ)","E927":"MARCETELLI (RI)","E928":"MARCHENO (BS)","E929":"MARCHIROLO (VA)","E930":"MARCIANA (LI)","E931":"MARCIANA MARINA (LI)","E932":"MARCIANISE (CE)","E933":"MARCIANO DELLA CHIANA (AR)","E934":"MARCIGNAGO (PV)","E936":"MARCON (VE)","E938":"MAREBBE .ENNEBERG. (BZ)","E939":"MARENE (CN)","E940":"MARENO DI PIAVE (TV)","E941":"MARENTINO (TO)","E944":"MARETTO (AT)","E945":"MARGARITA (CN)","E946":"MARGHERITA DI SAVOIA (FG)","E947":"MARGNO (LC)","E949":"MARIANA MANTOVANA (MN)","E951":"MARIANO COMENSE (CO)","E952":"MARIANO DEL FRIULI (GO)","E953":"MARIANOPOLI (CL)","E954":"MARIGLIANELLA (NA)","E955":"MARIGLIANO (NA)","E956":"MARINA DI GIOIOSA IONICA (RC)","E957":"MARINEO (PA)","E958":"MARINO (RM)","E959":"MARLENGO .MARLING. (BZ)","E960":"MARLIANA (PT)","E961":"MARMENTINO (BS)","E962":"MARMIROLO (MN)","E963":"MARMORA (CN)","E965":"MARNATE (VA)","E967":"MARONE (BS)","E968":"MAROPATI (RC)","E970":"MAROSTICA (VI)","E971":"MARRADI (FI)","E972":"MARRUBIU (OR)","E973":"MARSAGLIA (CN)","E974":"MARSALA (TP)","E975":"MARSCIANO (PG)","E976":"MARSICO NUOVO (PZ)","E977":"MARSICOVETERE (PZ)","E978":"MARTA (VT)","E979":"MARTANO (LE)","E980":"MARTELLAGO (VE)","E981":"MARTELLO .MARTELL. (BZ)","E982":"MARTIGNACCO (UD)","E983":"MARTIGNANA DI PO (CR)","E984":"MARTIGNANO (LE)","E986":"MARTINA FRANCA (TA)","E987":"MARTINENGO (BG)","E988":"MARTINIANA PO (CN)","E989":"MARTINSICURO (TE)","E990":"MARTIRANO (CZ)","E991":"MARTIRANO LOMBARDO (CZ)","E992":"MARTIS (SS)","E993":"MARTONE (RC)","E994":"MARUDO (LO)","E995":"MARUGGIO (TA)","B689":"MARZABOTTO (BO)","E999":"MARZANO (PV)","E998":"MARZANO APPIO (CE)","E997":"MARZANO DI NOLA (AV)","F001":"MARZI (CS)","F002":"MARZIO (VA)","M270":"MASAINAS (CA)","F003":"MASATE (MI)","F004":"MASCALI (CT)","F005":"MASCALUCIA (CT)","F006":"MASCHITO (PZ)","F007":"MASCIAGO PRIMO (VA)","F009":"MASER (TV)","F010":"MASERA (VB)","F011":"MASERA' DI PADOVA (PD)","F012":"MASERADA SUL PIAVE (TV)","F013":"MASI (PD)","F016":"MASI TORELLO (FE)","F015":"MASIO (AL)","F017":"MASLIANICO (CO)","F019":"MASON VICENTINO (VI)","F020":"MASONE (GE)","F023":"MASSA (MS)","F022":"MASSA D'ALBE (AQ)","M289":"MASSA DI SOMMA (NA)","F025":"MASSA E COZZILE (PT)","F021":"MASSA FERMANA (AP)","F026":"MASSA FISCAGLIA (FE)","F029":"MASSA LOMBARDA (RA)","F030":"MASSA LUBRENSE (NA)","F032":"MASSA MARITTIMA (GR)","F024":"MASSA MARTANA (PG)","F027":"MASSAFRA (TA)","F028":"MASSALENGO (LO)","F033":"MASSANZAGO (PD)","F035":"MASSAROSA (LU)","F037":"MASSAZZA (BI)","F041":"MASSELLO (TO)","F042":"MASSERANO (BI)","F044":"MASSIGNANO (AP)","F045":"MASSIMENO (TN)","F046":"MASSIMINO (SV)","F047":"MASSINO VISCONTI (NO)","F048":"MASSIOLA (VB)","F050":"MASULLAS (OR)","F051":"MATELICA (MC)","F052":"MATERA (MT)","F053":"MATHI (TO)","F054":"MATINO (LE)","F055":"MATRICE (CB)","F058":"MATTIE (TO)","F059":"MATTINATA (FG)","F061":"MAZARA DEL VALLO (TP)","F063":"MAZZANO (BS)","F064":"MAZZANO ROMANO (RM)","F065":"MAZZARINO (CL)","F066":"MAZZARRA' SANT'ANDREA (ME)","M271":"MAZZARRONE (CT)","F067":"MAZZE' (TO)","F068":"MAZZIN (TN)","F070":"MAZZO DI VALTELLINA (SO)","F074":"MEANA DI SUSA (TO)","F073":"MEANA SARDO (NU)","F078":"MEDA (MI)","F080":"MEDE (PV)","F081":"MEDEA (GO)","F082":"MEDESANO (PR)","F083":"MEDICINA (BO)","F084":"MEDIGLIA (MI)","F085":"MEDOLAGO (BG)","F086":"MEDOLE (MN)","F087":"MEDOLLA (MO)","F088":"MEDUNA DI LIVENZA (TV)","F089":"MEDUNO (PN)","F091":"MEGLIADINO SAN FIDENZIO (PD)","F092":"MEGLIADINO SAN VITALE (PD)","F093":"MEINA (NO)","F094":"MEL (BL)","F095":"MELARA (RO)","F096":"MELAZZO (AL)","F097":"MELDOLA (FC)","F098":"MELE (GE)","F100":"MELEGNANO (MI)","F101":"MELENDUGNO (LE)","F102":"MELETI (LO)","F104":"MELFI (PZ)","F105":"MELICUCCA' (RC)","F106":"MELICUCCO (RC)","F107":"MELILLI (SR)","F108":"MELISSA (KR)","F109":"MELISSANO (LE)","F111":"MELITO DI NAPOLI (NA)","F112":"MELITO DI PORTO SALVO (RC)","F110":"MELITO IRPINO (AV)","F113":"MELIZZANO (BN)","F114":"MELLE (CN)","F115":"MELLO (SO)","F117":"MELPIGNANO (LE)","F118":"MELTINA .MOLTEN. (BZ)","F119":"MELZO (MI)","F120":"MENAGGIO (CO)","F121":"MENAROLA (SO)","F122":"MENCONICO (PV)","F123":"MENDATICA (IM)","F125":"MENDICINO (CS)","F126":"MENFI (AG)","F127":"MENTANA (RM)","F130":"MEOLO (VE)","F131":"MERANA (AL)","F132":"MERANO .MERAN. (BZ)","F133":"MERATE (LC)","F134":"MERCALLO (VA)","F135":"MERCATELLO SUL METAURO (PU)","F136":"MERCATINO CONCA (PU)","F138":"MERCATO SAN SEVERINO (SA)","F139":"MERCATO SARACENO (FC)","F140":"MERCENASCO (TO)","F141":"MERCOGLIANO (AV)","F144":"MERETO DI TOMBA (UD)","F145":"MERGO (AN)","F146":"MERGOZZO (VB)","F147":"MERI' (ME)","F148":"MERLARA (PD)","F149":"MERLINO (LO)","F151":"MERONE (CO)","F152":"MESAGNE (BR)","F153":"MESE (SO)","F154":"MESENZANA (VA)","F155":"MESERO (MI)","F156":"MESOLA (FE)","F157":"MESORACA (KR)","F158":"MESSINA (ME)","F161":"MESTRINO (PD)","F162":"META (NA)","F164":"MEUGLIANO (TO)","F165":"MEZZAGO (MI)","F168":"MEZZANA (TN)","F170":"MEZZANA BIGLI (PV)","F167":"MEZZANA MORTIGLIENGO (BI)","F171":"MEZZANA RABATTONE (PV)","F172":"MEZZANE DI SOTTO (VR)","F173":"MEZZANEGO (GE)","F174":"MEZZANI (PR)","F175":"MEZZANINO (PV)","F176":"MEZZANO (TN)","F181":"MEZZEGRA (CO)","F182":"MEZZENILE (TO)","F183":"MEZZOCORONA (TN)","F184":"MEZZOJUSO (PA)","F186":"MEZZOLDO (BG)","F187":"MEZZOLOMBARDO (TN)","F188":"MEZZOMERICO (NO)","F189":"MIAGLIANO (BI)","F190":"MIANE (TV)","F191":"MIASINO (NO)","F192":"MIAZZINA (VB)","F193":"MICIGLIANO (RI)","F194":"MIGGIANO (LE)","F196":"MIGLIANICO (CH)","F198":"MIGLIARINO (FE)","F199":"MIGLIARO (FE)","F200":"MIGLIERINA (CZ)","F201":"MIGLIONICO (MT)","F202":"MIGNANEGO (GE)","F203":"MIGNANO MONTE LUNGO (CE)","F205":"MILANO (MI)","F206":"MILAZZO (ME)","E618":"MILENA (CL)","F207":"MILETO (VV)","F208":"MILIS (OR)","F209":"MILITELLO IN VAL DI CATANIA (CT)","F210":"MILITELLO ROSMARINO (ME)","F213":"MILLESIMO (SV)","F214":"MILO (CT)","F216":"MILZANO (BS)","F217":"MINEO (CT)","F218":"MINERBE (VR)","F219":"MINERBIO (BO)","F221":"MINERVINO DI LECCE (LE)","F220":"MINERVINO MURGE (BA)","F223":"MINORI (SA)","F224":"MINTURNO (LT)","F225":"MINUCCIANO (LU)","F226":"MIOGLIA (SV)","F229":"MIRA (VE)","F230":"MIRABELLA ECLANO (AV)","F231":"MIRABELLA IMBACCARI (CT)","F235":"MIRABELLO (FE)","F232":"MIRABELLO MONFERRATO (AL)","F233":"MIRABELLO SANNITICO (CB)","F238":"MIRADOLO TERME (PV)","F239":"MIRANDA (IS)","F240":"MIRANDOLA (MO)","F241":"MIRANO (VE)","F242":"MIRTO (ME)","F244":"MISANO ADRIATICO (RN)","F243":"MISANO DI GERA D'ADDA (BG)","F246":"MISILMERI (PA)","F247":"MISINTO (MI)","F248":"MISSAGLIA (LC)","F249":"MISSANELLO (PZ)","F250":"MISTERBIANCO (CT)","F251":"MISTRETTA (ME)","F254":"MOASCA (AT)","F256":"MOCONESI (GE)","F257":"MODENA (MO)","F258":"MODICA (RG)","F259":"MODIGLIANA (FC)","F261":"MODOLO (NU)","F262":"MODUGNO (BA)","F263":"MOENA (TN)","F265":"MOGGIO (LC)","F266":"MOGGIO UDINESE (UD)","F267":"MOGLIA (MN)","F268":"MOGLIANO (MC)","F269":"MOGLIANO VENETO (TV)","F270":"MOGORELLA (OR)","F272":"MOGORO (OR)","F274":"MOIANO (BN)","F275":"MOIMACCO (UD)","F277":"MOIO ALCANTARA (ME)","F276":"MOIO DE' CALVI (BG)","F278":"MOIO DELLA CIVITELLA (SA)","F279":"MOIOLA (CN)","F280":"MOLA DI BARI (BA)","F281":"MOLARE (AL)","F283":"MOLAZZANA (LU)","F284":"MOLFETTA (BA)","M255":"MOLINA ATERNO (AQ)","F286":"MOLINA DI LEDRO (TN)","F287":"MOLINARA (BN)","F288":"MOLINELLA (BO)","F290":"MOLINI DI TRIORA (IM)","F293":"MOLINO DEI TORTI (AL)","F294":"MOLISE (CB)","F295":"MOLITERNO (PZ)","F297":"MOLLIA (VC)","F301":"MOLOCHIO (RC)","F304":"MOLTENO (LC)","F305":"MOLTRASIO (CO)","F306":"MOLVENA (VI)","F307":"MOLVENO (TN)","F308":"MOMBALDONE (AT)","F309":"MOMBARCARO (CN)","F310":"MOMBAROCCIO (PU)","F311":"MOMBARUZZO (AT)","F312":"MOMBASIGLIO (CN)","F315":"MOMBELLO DI TORINO (TO)","F313":"MOMBELLO MONFERRATO (AL)","F316":"MOMBERCELLI (AT)","F317":"MOMO (NO)","F318":"MOMPANTERO (TO)","F319":"MOMPEO (RI)","F320":"MOMPERONE (AL)","F322":"MONACILIONI (CB)","F323":"MONALE (AT)","F324":"MONASTERACE (RC)","F325":"MONASTERO BORMIDA (AT)","F327":"MONASTERO DI LANZO (TO)","F326":"MONASTERO DI VASCO (CN)","F329":"MONASTEROLO CASOTTO (CN)","F328":"MONASTEROLO DEL CASTELLO (BG)","F330":"MONASTEROLO DI SAVIGLIANO (CN)","F332":"MONASTIER DI TREVISO (TV)","F333":"MONASTIR (CA)","F335":"MONCALIERI (TO)","F336":"MONCALVO (AT)","D553":"MONCENISIO (TO)","F337":"MONCESTINO (AL)","F338":"MONCHIERO (CN)","F340":"MONCHIO DELLE CORTI (PR)","F341":"MONCLASSICO (TN)","F342":"MONCRIVELLO (VC)","F343":"MONCUCCO TORINESE (AT)","F346":"MONDAINO (RN)","F347":"MONDAVIO (PU)","F348":"MONDOLFO (PU)","F351":"MONDOVI' (CN)","F352":"MONDRAGONE (CE)","F354":"MONEGLIA (GE)","F355":"MONESIGLIO (CN)","F356":"MONFALCONE (GO)","F358":"MONFORTE D'ALBA (CN)","F359":"MONFORTE SAN GIORGIO (ME)","F360":"MONFUMO (TV)","F361":"MONGARDINO (AT)","F363":"MONGHIDORO (BO)","F364":"MONGIANA (VV)","F365":"MONGIARDINO LIGURE (AL)","F368":"MONGIUFFI MELIA (ME)","F369":"MONGRANDO (BI)","F370":"MONGRASSANO (CS)","F371":"MONGUELFO .WELSBERG. (BZ)","F372":"MONGUZZO (CO)","F373":"MONIGA DEL GARDA (BS)","F374":"MONLEALE (AL)","F375":"MONNO (BS)","F376":"MONOPOLI (BA)","F377":"MONREALE (PA)","F378":"MONRUPINO (TS)","F379":"MONSAMPIETRO MORICO (AP)","F380":"MONSAMPOLO DEL TRONTO (AP)","F381":"MONSANO (AN)","F382":"MONSELICE (PD)","F383":"MONSERRATO (CA)","F384":"MONSUMMANO TERME (PT)","F385":"MONTA' (CN)","F386":"MONTABONE (AT)","F387":"MONTACUTO (AL)","F390":"MONTAFIA (AT)","F391":"MONTAGANO (CB)","F392":"MONTAGNA .MONTAN. (BZ)","F393":"MONTAGNA IN VALTELLINA (SO)","F394":"MONTAGNANA (PD)","F395":"MONTAGNAREALE (ME)","F396":"MONTAGNE (TN)","F397":"MONTAGUTO (AV)","F398":"MONTAIONE (FI)","F400":"MONTALBANO ELICONA (ME)","F399":"MONTALBANO JONICO (MT)","F402":"MONTALCINO (SI)","F403":"MONTALDEO (AL)","F404":"MONTALDO BORMIDA (AL)","F405":"MONTALDO DI MONDOVI' (CN)","F408":"MONTALDO ROERO (CN)","F409":"MONTALDO SCARAMPI (AT)","F407":"MONTALDO TORINESE (TO)","F410":"MONTALE (PT)","F411":"MONTALENGHE (TO)","F414":"MONTALLEGRO (AG)","F415":"MONTALTO DELLE MARCHE (AP)","F419":"MONTALTO DI CASTRO (VT)","F420":"MONTALTO DORA (TO)","F406":"MONTALTO LIGURE (IM)","F417":"MONTALTO PAVESE (PV)","F416":"MONTALTO UFFUGO (CS)","F422":"MONTANARO (TO)","F423":"MONTANASO LOMBARDO (LO)","F424":"MONTANERA (CN)","F426":"MONTANO ANTILIA (SA)","F427":"MONTANO LUCINO (CO)","F428":"MONTAPPONE (AP)","F429":"MONTAQUILA (IS)","F430":"MONTASOLA (RI)","F432":"MONTAURO (CZ)","F433":"MONTAZZOLI (CH)","F437":"MONTE ARGENTARIO (GR)","F456":"MONTE CASTELLO DI VIBIO (PG)","F460":"MONTE CAVALLO (MC)","F467":"MONTE CERIGNONE (PU)","F476":"MONTE COLOMBO (RN)","F434":"MONTE CREMASCO (CR)","F486":"MONTE DI MALO (VI)","F488":"MONTE DI PROCIDA (NA)","F517":"MONTE GIBERTO (AP)","F524":"MONTE GRIMANO TERME (PU)","F532":"MONTE ISOLA (BS)","F561":"MONTE MARENZO (LC)","F589":"MONTE PORZIO (PU)","F590":"MONTE PORZIO CATONE (RM)","F599":"MONTE RINALDO (AP)","F600":"MONTE ROBERTO (AN)","F603":"MONTE ROMANO (VT)","F616":"MONTE SAN BIAGIO (LT)","F618":"MONTE SAN GIACOMO (SA)","F620":"MONTE SAN GIOVANNI CAMPANO (FR)","F619":"MONTE SAN GIOVANNI IN SABINA (RI)","F621":"MONTE SAN GIUSTO (MC)","F622":"MONTE SAN MARTINO (MC)","F626":"MONTE SAN PIETRANGELI (AP)","F627":"MONTE SAN PIETRO (BO)","F628":"MONTE SAN SAVINO (AR)","F634":"MONTE SAN VITO (AN)","F629":"MONTE SANTA MARIA TIBERINA (PG)","F631":"MONTE SANT'ANGELO (FG)","F653":"MONTE URANO (AP)","F664":"MONTE VIDON COMBATTE (AP)","F665":"MONTE VIDON CORRADO (AP)","F440":"MONTEBELLO DELLA BATTAGLIA (PV)","F441":"MONTEBELLO DI BERTONA (PE)","D746":"MONTEBELLO IONICO (RC)","B268":"MONTEBELLO SUL SANGRO (CH)","F442":"MONTEBELLO VICENTINO (VI)","F443":"MONTEBELLUNA (TV)","F445":"MONTEBRUNO (GE)","F446":"MONTEBUONO (RI)","F450":"MONTECALVO IN FOGLIA (PU)","F448":"MONTECALVO IRPINO (AV)","F449":"MONTECALVO VERSIGGIA (PV)","F452":"MONTECARLO (LU)","F453":"MONTECAROTTO (AN)","F454":"MONTECASSIANO (MC)","F455":"MONTECASTELLO (AL)","F457":"MONTECASTRILLI (TR)","A561":"MONTECATINI TERME (PT)","F458":"MONTECATINI VAL DI CECINA (PI)","F461":"MONTECCHIA DI CROSARA (VR)","F462":"MONTECCHIO (TR)","F463":"MONTECCHIO EMILIA (RE)","F464":"MONTECCHIO MAGGIORE (VI)","F465":"MONTECCHIO PRECALCINO (VI)","F469":"MONTECHIARO D'ACQUI (AL)","F468":"MONTECHIARO D'ASTI (AT)","F473":"MONTECHIARUGOLO (PR)","F474":"MONTECICCARDO (PU)","F475":"MONTECILFONE (CB)","F477":"MONTECOMPATRI (RM)","F478":"MONTECOPIOLO (PU)","F479":"MONTECORICE (SA)","F480":"MONTECORVINO PUGLIANO (SA)","F481":"MONTECORVINO ROVELLA (SA)","F482":"MONTECOSARO (MC)","F483":"MONTECRESTESE (VB)","F484":"MONTECRETO (MO)","F487":"MONTEDINOVE (AP)","F489":"MONTEDORO (CL)","F491":"MONTEFALCIONE (AV)","F492":"MONTEFALCO (PG)","F493":"MONTEFALCONE APPENNINO (AP)","F494":"MONTEFALCONE DI VAL FORTORE (BN)","F495":"MONTEFALCONE NEL SANNIO (CB)","F496":"MONTEFANO (MC)","F497":"MONTEFELCINO (PU)","F498":"MONTEFERRANTE (CH)","F499":"MONTEFIASCONE (VT)","F500":"MONTEFINO (TE)","F502":"MONTEFIORE CONCA (RN)","F501":"MONTEFIORE DELL'ASO (AP)","F503":"MONTEFIORINO (MO)","F504":"MONTEFLAVIO (RM)","F507":"MONTEFORTE CILENTO (SA)","F508":"MONTEFORTE D'ALPONE (VR)","F506":"MONTEFORTE IRPINO (AV)","F509":"MONTEFORTINO (AP)","F510":"MONTEFRANCO (TR)","F511":"MONTEFREDANE (AV)","F512":"MONTEFUSCO (AV)","F513":"MONTEGABBIONE (TR)","F514":"MONTEGALDA (VI)","F515":"MONTEGALDELLA (VI)","F516":"MONTEGALLO (AP)","F518":"MONTEGIOCO (AL)","F519":"MONTEGIORDANO (CS)","F520":"MONTEGIORGIO (AP)","F522":"MONTEGRANARO (AP)","F523":"MONTEGRIDOLFO (RN)","F526":"MONTEGRINO VALTRAVAGLIA (VA)","F527":"MONTEGROSSO D'ASTI (AT)","F528":"MONTEGROSSO PIAN LATTE (IM)","F529":"MONTEGROTTO TERME (PD)","F531":"MONTEIASI (TA)","F533":"MONTELABBATE (PU)","F534":"MONTELANICO (RM)","F535":"MONTELAPIANO (CH)","F536":"MONTELEONE DI FERMO (AP)","F538":"MONTELEONE DI PUGLIA (FG)","F540":"MONTELEONE DI SPOLETO (PG)","F543":"MONTELEONE D'ORVIETO (TR)","F542":"MONTELEONE ROCCA DORIA (SS)","F541":"MONTELEONE SABINO (RI)","F544":"MONTELEPRE (PA)","F545":"MONTELIBRETTI (RM)","F546":"MONTELLA (AV)","F547":"MONTELLO (BG)","F548":"MONTELONGO (CB)","F549":"MONTELPARO (AP)","F550":"MONTELUPO ALBESE (CN)","F551":"MONTELUPO FIORENTINO (FI)","F552":"MONTELUPONE (MC)","F555":"MONTEMAGGIORE AL METAURO (PU)","F553":"MONTEMAGGIORE BELSITO (PA)","F556":"MONTEMAGNO (AT)","F558":"MONTEMALE DI CUNEO (CN)","F559":"MONTEMARANO (AV)","F560":"MONTEMARCIANO (AN)","F562":"MONTEMARZINO (AL)","F563":"MONTEMESOLA (TA)","F564":"MONTEMEZZO (CO)","F565":"MONTEMIGNAIO (AR)","F566":"MONTEMILETTO (AV)","F568":"MONTEMILONE (PZ)","F569":"MONTEMITRO (CB)","F570":"MONTEMONACO (AP)","F572":"MONTEMURLO (PO)","F573":"MONTEMURRO (PZ)","F574":"MONTENARS (UD)","F576":"MONTENERO DI BISACCIA (CB)","F579":"MONTENERO SABINO (RI)","F580":"MONTENERO VAL COCCHIARA (IS)","F578":"MONTENERODOMO (CH)","F582":"MONTEODORISIO (CH)","F586":"MONTEPAONE (CZ)","F587":"MONTEPARANO (TA)","F591":"MONTEPRANDONE (AP)","F592":"MONTEPULCIANO (SI)","F593":"MONTERADO (AN)","F594":"MONTERCHI (AR)","F595":"MONTEREALE (AQ)","F596":"MONTEREALE VALCELLINA (PN)","F597":"MONTERENZIO (BO)","F598":"MONTERIGGIONI (SI)","F601":"MONTERODUNI (IS)","F605":"MONTERONI D'ARBIA (SI)","F604":"MONTERONI DI LECCE (LE)","F606":"MONTEROSI (VT)","F609":"MONTEROSSO AL MARE (SP)","F610":"MONTEROSSO ALMO (RG)","F607":"MONTEROSSO CALABRO (VV)","F608":"MONTEROSSO GRANA (CN)","F611":"MONTEROTONDO (RM)","F612":"MONTEROTONDO MARITTIMO (GR)","F614":"MONTERUBBIANO (AP)","F623":"MONTESANO SALENTINO (LE)","F625":"MONTESANO SULLA MARCELLANA (SA)","F636":"MONTESARCHIO (BN)","F637":"MONTESCAGLIOSO (MT)","F638":"MONTESCANO (PV)","F639":"MONTESCHENO (VB)","F640":"MONTESCUDAIO (PI)","F641":"MONTESCUDO (RN)","F642":"MONTESE (MO)","F644":"MONTESEGALE (PV)","F646":"MONTESILVANO (PE)","F648":"MONTESPERTOLI (FI)","F651":"MONTEU DA PO (TO)","F654":"MONTEU ROERO (CN)","F655":"MONTEVAGO (AG)","F656":"MONTEVARCHI (AR)","F657":"MONTEVECCHIA (LC)","F659":"MONTEVEGLIO (BO)","F660":"MONTEVERDE (AV)","F661":"MONTEVERDI MARITTIMO (PI)","F662":"MONTEVIALE (VI)","F666":"MONTEZEMOLO (CN)","F667":"MONTI (SS)","F668":"MONTIANO (FC)","F672":"MONTICELLI BRUSATI (BS)","F671":"MONTICELLI D'ONGINA (PC)","F670":"MONTICELLI PAVESE (PV)","F674":"MONTICELLO BRIANZA (LC)","F675":"MONTICELLO CONTE OTTO (VI)","F669":"MONTICELLO D'ALBA (CN)","F471":"MONTICHIARI (BS)","F676":"MONTICIANO (SI)","F677":"MONTIERI (GR)","M302":"MONTIGLIO MONFERRATO (AT)","F679":"MONTIGNOSO (MS)","F680":"MONTIRONE (BS)","F367":"MONTJOVET (AO)","F681":"MONTODINE (CR)","F682":"MONTOGGIO (GE)","F685":"MONTONE (PG)","F687":"MONTOPOLI DI SABINA (RI)","F686":"MONTOPOLI IN VAL D'ARNO (PI)","F688":"MONTORFANO (CO)","F690":"MONTORIO AL VOMANO (TE)","F689":"MONTORIO NEI FRENTANI (CB)","F692":"MONTORIO ROMANO (RM)","F693":"MONTORO INFERIORE (AV)","F694":"MONTORO SUPERIORE (AV)","F696":"MONTORSO VICENTINO (VI)","F697":"MONTOTTONE (AP)","F698":"MONTRESTA (NU)","F701":"MONTU' BECCARIA (PV)","F703":"MONVALLE (VA)","F704":"MONZA (MI)","F705":"MONZAMBANO (MN)","F706":"MONZUNO (BO)","F708":"MORANO CALABRO (CS)","F707":"MORANO SUL PO (AL)","F709":"MORANSENGO (AT)","F710":"MORARO (GO)","F711":"MORAZZONE (VA)","F712":"MORBEGNO (SO)","F713":"MORBELLO (AL)","F716":"MORCIANO DI LEUCA (LE)","F715":"MORCIANO DI ROMAGNA (RN)","F717":"MORCONE (BN)","F718":"MORDANO (BO)","F720":"MORENGO (BG)","F721":"MORES (SS)","F722":"MORESCO (AP)","F723":"MORETTA (CN)","F724":"MORFASSO (PC)","F725":"MORGANO (TV)","F726":"MORGEX (AO)","F727":"MORGONGIORI (OR)","F728":"MORI (TN)","F729":"MORIAGO DELLA BATTAGLIA (TV)","F730":"MORICONE (RM)","F731":"MORIGERATI (SA)","D033":"MORIMONDO (MI)","F732":"MORINO (AQ)","F733":"MORIONDO TORINESE (TO)","F734":"MORLUPO (RM)","F735":"MORMANNO (CS)","F736":"MORNAGO (VA)","F737":"MORNESE (AL)","F738":"MORNICO AL SERIO (BG)","F739":"MORNICO LOSANA (PV)","F740":"MOROLO (FR)","F743":"MOROZZO (CN)","F744":"MORRA DE SANCTIS (AV)","F745":"MORRO D'ALBA (AN)","F747":"MORRO D'ORO (TE)","F746":"MORRO REATINO (RI)","F748":"MORRONE DEL SANNIO (CB)","F749":"MORROVALLE (MC)","F750":"MORSANO AL TAGLIAMENTO (PN)","F751":"MORSASCO (AL)","F754":"MORTARA (PV)","F756":"MORTEGLIANO (UD)","F758":"MORTERONE (LC)","F760":"MORUZZO (UD)","F761":"MOSCAZZANO (CR)","F762":"MOSCHIANO (AV)","F764":"MOSCIANO SANT'ANGELO (TE)","F765":"MOSCUFO (PE)","F766":"MOSO IN PASSIRIA .MOOS IN PASSEIER. (BZ)","F767":"MOSSA (GO)","F768":"MOSSANO (VI)","M304":"MOSSO (BI)","F771":"MOTTA BALUFFI (CR)","F772":"MOTTA CAMASTRA (ME)","F773":"MOTTA D'AFFERMO (ME)","F774":"MOTTA DE' CONTI (VC)","F770":"MOTTA DI LIVENZA (TV)","F777":"MOTTA MONTECORVINO (FG)","F779":"MOTTA SAN GIOVANNI (RC)","F780":"MOTTA SANTA LUCIA (CZ)","F781":"MOTTA SANT'ANASTASIA (CT)","F783":"MOTTA VISCONTI (MI)","F775":"MOTTAFOLLONE (CS)","F776":"MOTTALCIATA (BI)","B012":"MOTTEGGIANA (MN)","F784":"MOTTOLA (TA)","F785":"MOZZAGROGNA (CH)","F786":"MOZZANICA (BG)","F788":"MOZZATE (CO)","F789":"MOZZECANE (VR)","F791":"MOZZO (BG)","F793":"MUCCIA (MC)","F795":"MUGGIA (TS)","F797":"MUGGIO' (MI)","F798":"MUGNANO DEL CARDINALE (AV)","F799":"MUGNANO DI NAPOLI (NA)","F801":"MULAZZANO (LO)","F802":"MULAZZO (MS)","F806":"MURA (BS)","F808":"MURAVERA (CA)","F809":"MURAZZANO (CN)","F811":"MURELLO (CN)","F813":"MURIALDO (SV)","F814":"MURISENGO (AL)","F815":"MURLO (SI)","F816":"MURO LECCESE (LE)","F817":"MURO LUCANO (PZ)","F818":"MUROS (SS)","F820":"MUSCOLINE (BS)","F822":"MUSEI (CA)","F826":"MUSILE DI PIAVE (VE)","F828":"MUSSO (CO)","F829":"MUSSOLENTE (VI)","F830":"MUSSOMELI (CL)","F832":"MUZZANA DEL TURGNANO (UD)","F833":"MUZZANO (BI)","F835":"NAGO-TORBOLE (TN)","F836":"NALLES .NALS. (BZ)","F837":"NANNO (TN)","F838":"NANTO (VI)","F839":"NAPOLI (NA)","F840":"NARBOLIA (OR)","F841":"NARCAO (CA)","F842":"NARDO' (LE)","F843":"NARDODIPACE (VV)","F844":"NARNI (TR)","F845":"NARO (AG)","F846":"NARZOLE (CN)","F847":"NASINO (SV)","F848":"NASO (ME)","F849":"NATURNO .NATURNS. (BZ)","F851":"NAVE (BS)","F853":"NAVE SAN ROCCO (TN)","F852":"NAVELLI (AQ)","F856":"NAZ SCIAVES .NATZ SCHABS. (BZ)","F857":"NAZZANO (RM)","F858":"NE (GE)","F859":"NEBBIUNO (NO)","F861":"NEGRAR (VR)","F862":"NEIRONE (GE)","F863":"NEIVE (CN)","F864":"NEMBRO (BG)","F865":"NEMI (RM)","F866":"NEMOLI (PZ)","F867":"NEONELI (OR)","F868":"NEPI (VT)","F870":"NERETO (TE)","F871":"NEROLA (RM)","F872":"NERVESA DELLA BATTAGLIA (TV)","F874":"NERVIANO (MI)","F876":"NESPOLO (RI)","F877":"NESSO (CO)","F878":"NETRO (BI)","F880":"NETTUNO (RM)","F881":"NEVIANO (LE)","F882":"NEVIANO DEGLI ARDUINI (PR)","F883":"NEVIGLIE (CN)","F884":"NIARDO (BS)","F885":"NIBBIANO (PC)","F886":"NIBBIOLA (NO)","F887":"NIBIONNO (LC)","F889":"NICHELINO (TO)","F890":"NICOLOSI (CT)","F891":"NICORVO (PV)","F892":"NICOSIA (EN)","F893":"NICOTERA (VV)","F894":"NIELLA BELBO (CN)","F895":"NIELLA TANARO (CN)","F898":"NIMIS (UD)","F899":"NISCEMI (CL)","F900":"NISSORIA (EN)","F901":"NIZZA DI SICILIA (ME)","F902":"NIZZA MONFERRATO (AT)","F904":"NOALE (VE)","F906":"NOASCA (TO)","F907":"NOCARA (CS)","F908":"NOCCIANO (PE)","F912":"NOCERA INFERIORE (SA)","F913":"NOCERA SUPERIORE (SA)","F910":"NOCERA TERINESE (CZ)","F911":"NOCERA UMBRA (PG)","F914":"NOCETO (PR)","F915":"NOCI (BA)","F916":"NOCIGLIA (LE)","F917":"NOEPOLI (PZ)","F918":"NOGARA (VR)","F920":"NOGAREDO (TN)","F921":"NOGAROLE ROCCA (VR)","F922":"NOGAROLE VICENTINO (VI)","F923":"NOICATTARO (BA)","F924":"NOLA (NA)","F925":"NOLE (TO)","F926":"NOLI (SV)","F927":"NOMAGLIO (TO)","F929":"NOMI (TN)","F930":"NONANTOLA (MO)","F931":"NONE (TO)","F932":"NONIO (VB)","F933":"NORAGUGUME (NU)","F934":"NORBELLO (OR)","F935":"NORCIA (PG)","F937":"NORMA (LT)","F939":"NOSATE (MI)","F942":"NOTARESCO (TE)","F943":"NOTO (SR)","F949":"NOVA LEVANTE .WELSCHNOFEN. (BZ)","F944":"NOVA MILANESE (MI)","F950":"NOVA PONENTE .DEUTSCHNOFEN. (BZ)","A942":"NOVA SIRI (MT)","F137":"NOVAFELTRIA (PU)","F947":"NOVALEDO (TN)","F948":"NOVALESA (TO)","F952":"NOVARA (NO)","F951":"NOVARA DI SICILIA (ME)","F956":"NOVATE MEZZOLA (SO)","F955":"NOVATE MILANESE (MI)","F957":"NOVE (VI)","F958":"NOVEDRATE (CO)","F960":"NOVELLARA (RE)","F961":"NOVELLO (CN)","F963":"NOVENTA DI PIAVE (VE)","F962":"NOVENTA PADOVANA (PD)","F964":"NOVENTA VICENTINA (VI)","F966":"NOVI DI MODENA (MO)","F965":"NOVI LIGURE (AL)","F967":"NOVI VELIA (SA)","F968":"NOVIGLIO (MI)","F970":"NOVOLI (LE)","F972":"NUCETTO (CN)","F975":"NUGHEDU SAN NICOLO' (SS)","F974":"NUGHEDU SANTA VITTORIA (OR)","F976":"NULE (SS)","F977":"NULVI (SS)","F978":"NUMANA (AN)","F979":"NUORO (NU)","F980":"NURACHI (OR)","F981":"NURAGUS (NU)","F982":"NURALLAO (NU)","F983":"NURAMINIS (CA)","F985":"NURECI (OR)","F986":"NURRI (NU)","F987":"NUS (AO)","F988":"NUSCO (AV)","F989":"NUVOLENTO (BS)","F990":"NUVOLERA (BS)","F991":"NUXIS (CA)","F992":"OCCHIEPPO INFERIORE (BI)","F993":"OCCHIEPPO SUPERIORE (BI)","F994":"OCCHIOBELLO (RO)","F995":"OCCIMIANO (AL)","F996":"OCRE (AQ)","F997":"ODALENGO GRANDE (AL)","F998":"ODALENGO PICCOLO (AL)","F999":"ODERZO (TV)","G001":"ODOLO (BS)","G002":"OFENA (AQ)","G003":"OFFAGNA (AN)","G004":"OFFANENGO (CR)","G005":"OFFIDA (AP)","G006":"OFFLAGA (BS)","G007":"OGGEBBIO (VB)","G008":"OGGIONA CON SANTO STEFANO (VA)","G009":"OGGIONO (LC)","G010":"OGLIANICO (TO)","G011":"OGLIASTRO CILENTO (SA)","G015":"OLBIA (SS)","G016":"OLCENENGO (VC)","G018":"OLDENICO (VC)","G019":"OLEGGIO (NO)","G020":"OLEGGIO CASTELLO (NO)","G021":"OLEVANO DI LOMELLINA (PV)","G022":"OLEVANO ROMANO (RM)","G023":"OLEVANO SUL TUSCIANO (SA)","G025":"OLGIATE COMASCO (CO)","G026":"OLGIATE MOLGORA (LC)","G028":"OLGIATE OLONA (VA)","G030":"OLGINATE (LC)","G031":"OLIENA (NU)","G032":"OLIVA GESSI (PV)","G034":"OLIVADI (CZ)","G036":"OLIVERI (ME)","G039":"OLIVETO CITRA (SA)","G040":"OLIVETO LARIO (LC)","G037":"OLIVETO LUCANO (MT)","G041":"OLIVETTA SAN MICHELE (IM)","G042":"OLIVOLA (AL)","G043":"OLLASTRA (OR)","G044":"OLLOLAI (NU)","G045":"OLLOMONT (AO)","G046":"OLMEDO (SS)","G047":"OLMENETA (CR)","G049":"OLMO AL BREMBO (BG)","G048":"OLMO GENTILE (AT)","G050":"OLTRE IL COLLE (BG)","G054":"OLTRESSENDA ALTA (BG)","G056":"OLTRONA DI SAN MAMETTE (CO)","G058":"OLZAI (NU)","G061":"OME (BS)","G062":"OMEGNA (VB)","G063":"OMIGNANO (SA)","G064":"ONANI (NU)","G065":"ONANO (VT)","G066":"ONCINO (CN)","G068":"ONETA (BG)","G070":"ONIFAI (NU)","G071":"ONIFERI (NU)","G074":"ONO SAN PIETRO (BS)","G075":"ONORE (BG)","G076":"ONZO (SV)","G078":"OPERA (MI)","G079":"OPI (AQ)","G080":"OPPEANO (VR)","G081":"OPPIDO LUCANO (PZ)","G082":"OPPIDO MAMERTINA (RC)","G083":"ORA .AUER. (BZ)","G084":"ORANI (NU)","G086":"ORATINO (CB)","G087":"ORBASSANO (TO)","G088":"ORBETELLO (GR)","G089":"ORCIANO DI PESARO (PU)","G090":"ORCIANO PISANO (PI)","D522":"ORCO FEGLINO (SV)","M266":"ORDONA (FG)","G093":"ORERO (GE)","G095":"ORGIANO (VI)","G097":"ORGOSOLO (NU)","G098":"ORIA (BR)","G102":"ORICOLA (AQ)","G103":"ORIGGIO (VA)","G105":"ORINO (VA)","G108":"ORIO AL SERIO (BG)","G109":"ORIO CANAVESE (TO)","G107":"ORIO LITTA (LO)","G110":"ORIOLO (CS)","G111":"ORIOLO ROMANO (VT)","G113":"ORISTANO (OR)","G114":"ORMEA (CN)","G115":"ORMELLE (TV)","G116":"ORNAGO (MI)","G117":"ORNAVASSO (VB)","G118":"ORNICA (BG)","G119":"OROSEI (NU)","G120":"OROTELLI (NU)","G121":"ORRIA (SA)","G122":"ORROLI (NU)","G123":"ORSAGO (TV)","G124":"ORSARA BORMIDA (AL)","G125":"ORSARA DI PUGLIA (FG)","G126":"ORSENIGO (CO)","G128":"ORSOGNA (CH)","G129":"ORSOMARSO (CS)","G130":"ORTA DI ATELLA (CE)","G131":"ORTA NOVA (FG)","G134":"ORTA SAN GIULIO (NO)","G133":"ORTACESUS (CA)","G135":"ORTE (VT)","G136":"ORTELLE (LE)","G137":"ORTEZZANO (AP)","G139":"ORTIGNANO RAGGIOLO (AR)","G140":"ORTISEI .ST ULRICH. (BZ)","G141":"ORTONA (CH)","G142":"ORTONA DEI MARSI (AQ)","G143":"ORTONOVO (SP)","G144":"ORTOVERO (SV)","G145":"ORTUCCHIO (AQ)","G146":"ORTUERI (NU)","G147":"ORUNE (NU)","G148":"ORVIETO (TR)","B595":"ORVINIO (RI)","G149":"ORZINUOVI (BS)","G150":"ORZIVECCHI (BS)","G151":"OSASCO (TO)","G152":"OSASIO (TO)","G153":"OSCHIRI (SS)","G154":"OSIDDA (NU)","G155":"OSIGLIA (SV)","G156":"OSILO (SS)","G157":"OSIMO (AN)","G158":"OSINI (NU)","G159":"OSIO SOPRA (BG)","G160":"OSIO SOTTO (BG)","E529":"OSMATE (VA)","G161":"OSNAGO (LC)","G163":"OSOPPO (UD)","G164":"OSPEDALETTI (IM)","G168":"OSPEDALETTO (TN)","G165":"OSPEDALETTO D'ALPINOLO (AV)","G167":"OSPEDALETTO EUGANEO (PD)","G166":"OSPEDALETTO LODIGIANO (LO)","G169":"OSPITALE DI CADORE (BL)","G170":"OSPITALETTO (BS)","G171":"OSSAGO LODIGIANO (LO)","G173":"OSSANA (TN)","G178":"OSSI (SS)","G179":"OSSIMO (BS)","G181":"OSSONA (MI)","G182":"OSSUCCIO (CO)","G183":"OSTANA (CN)","G184":"OSTELLATO (FE)","G185":"OSTIANO (CR)","G186":"OSTIGLIA (MN)","F401":"OSTRA (AN)","F581":"OSTRA VETERE (AN)","G187":"OSTUNI (BR)","G188":"OTRANTO (LE)","G189":"OTRICOLI (TR)","G191":"OTTANA (NU)","G192":"OTTATI (SA)","G190":"OTTAVIANO (NA)","G193":"OTTIGLIO (AL)","G194":"OTTOBIANO (PV)","G195":"OTTONE (PC)","G196":"OULX (TO)","G197":"OVADA (AL)","G198":"OVARO (UD)","G199":"OVIGLIO (AL)","G200":"OVINDOLI (AQ)","G201":"OVODDA (NU)","G012":"OYACE (AO)","G202":"OZEGNA (TO)","G203":"OZIERI (SS)","G205":"OZZANO DELL'EMILIA (BO)","G204":"OZZANO MONFERRATO (AL)","G206":"OZZERO (MI)","G207":"PABILLONIS (CA)","G209":"PACE DEL MELA (ME)","G208":"PACECO (TP)","G210":"PACENTRO (AQ)","G211":"PACHINO (SR)","G212":"PACIANO (PG)","G213":"PADENGHE SUL GARDA (BS)","G214":"PADERGNONE (TN)","G215":"PADERNA (AL)","G218":"PADERNO D'ADDA (LC)","G221":"PADERNO DEL GRAPPA (TV)","G220":"PADERNO DUGNANO (MI)","G217":"PADERNO FRANCIACORTA (BS)","G222":"PADERNO PONCHIELLI (CR)","G224":"PADOVA (PD)","G225":"PADRIA (SS)","M301":"PADRU (SS)","G226":"PADULA (SA)","G227":"PADULI (BN)","G228":"PAESANA (CN)","G229":"PAESE (TV)","G230":"PAGANI (SA)","G232":"PAGANICO SABINO (RI)","G233":"PAGAZZANO (BG)","G234":"PAGLIARA (ME)","G237":"PAGLIETA (CH)","G238":"PAGNACCO (UD)","G240":"PAGNO (CN)","G241":"PAGNONA (LC)","G242":"PAGO DEL VALLO DI LAURO (AV)","G243":"PAGO VEIANO (BN)","G247":"PAISCO LOVENO (BS)","G248":"PAITONE (BS)","G249":"PALADINA (BG)","G250":"PALAGANO (MO)","G251":"PALAGIANELLO (TA)","G252":"PALAGIANO (TA)","G253":"PALAGONIA (CT)","G254":"PALAIA (PI)","G255":"PALANZANO (PR)","G257":"PALATA (CB)","G258":"PALAU (SS)","G259":"PALAZZAGO (BG)","G263":"PALAZZO ADRIANO (PA)","G262":"PALAZZO CANAVESE (TO)","G260":"PALAZZO PIGNANO (CR)","G261":"PALAZZO SAN GERVASIO (PZ)","G267":"PALAZZOLO ACREIDE (SR)","G268":"PALAZZOLO DELLO STELLA (UD)","G264":"PALAZZOLO SULL'OGLIO (BS)","G266":"PALAZZOLO VERCELLESE (VC)","G270":"PALAZZUOLO SUL SENIO (FI)","G271":"PALENA (CH)","G272":"PALERMITI (CZ)","G273":"PALERMO (PA)","G274":"PALESTRINA (RM)","G275":"PALESTRO (PV)","G276":"PALIANO (FR)","G277":"PALIZZI (RC)","G278":"PALLAGORIO (KR)","G280":"PALLANZENO (VB)","G281":"PALLARE (SV)","G283":"PALMA CAMPANIA (NA)","G282":"PALMA DI MONTECHIARO (AG)","G284":"PALMANOVA (UD)","G285":"PALMARIGGI (LE)","G286":"PALMAS ARBOREA (OR)","G288":"PALMI (RC)","G289":"PALMIANO (AP)","G290":"PALMOLI (CH)","G291":"PALO DEL COLLE (BA)","G293":"PALOMBARA SABINA (RM)","G294":"PALOMBARO (CH)","G292":"PALOMONTE (SA)","G295":"PALOSCO (BG)","G297":"PALU' (VR)","G296":"PALU' DEL FERSINA (TN)","G298":"PALUDI (CS)","G300":"PALUZZA (UD)","G302":"PAMPARATO (CN)","G303":"PANCALIERI (TO)","G304":"PANCARANA (PV)","G305":"PANCHIA' (TN)","G306":"PANDINO (CR)","G307":"PANETTIERI (CS)","G308":"PANICALE (PG)","G311":"PANNARANO (BN)","G312":"PANNI (FG)","G315":"PANTELLERIA (TP)","G316":"PANTIGLIATE (MI)","G317":"PAOLA (CS)","G318":"PAOLISI (BN)","G320":"PAPASIDERO (CS)","G323":"PAPOZZE (RO)","G324":"PARABIAGO (MI)","G325":"PARABITA (LE)","G327":"PARATICO (BS)","G328":"PARCINES .PARTSCHINS. (BZ)","G329":"PARE' (CO)","G330":"PARELLA (TO)","G331":"PARENTI (CS)","G333":"PARETE (CE)","G334":"PARETO (AL)","G335":"PARGHELIA (VV)","G336":"PARLASCO (LC)","G337":"PARMA (PR)","G338":"PARODI LIGURE (AL)","G339":"PAROLDO (CN)","G340":"PAROLISE (AV)","G342":"PARONA (PV)","G344":"PARRANO (TR)","G346":"PARRE (BG)","G347":"PARTANNA (TP)","G348":"PARTINICO (PA)","G349":"PARUZZARO (NO)","G350":"PARZANICA (BG)","G352":"PASIAN DI PRATO (UD)","G353":"PASIANO DI PORDENONE (PN)","G354":"PASPARDO (BS)","G358":"PASSERANO MARMORITO (AT)","G359":"PASSIGNANO SUL TRASIMENO (PG)","G361":"PASSIRANO (BS)","G362":"PASTENA (FR)","G364":"PASTORANO (CE)","G365":"PASTRENGO (VR)","G367":"PASTURANA (AL)","G368":"PASTURO (LC)","M269":"PATERNO (PZ)","G371":"PATERNO' (CT)","G372":"PATERNO CALABRO (CS)","G370":"PATERNOPOLI (AV)","G374":"PATRICA (FR)","G376":"PATTADA (SS)","G377":"PATTI (ME)","G378":"PATU' (LE)","G379":"PAU (OR)","G381":"PAULARO (UD)","G382":"PAULI ARBAREI (CA)","G384":"PAULILATINO (OR)","G385":"PAULLO (MI)","G386":"PAUPISI (BN)","G387":"PAVAROLO (TO)","G388":"PAVIA (PV)","G389":"PAVIA DI UDINE (UD)","G392":"PAVONE CANAVESE (TO)","G391":"PAVONE DEL MELLA (BS)","G393":"PAVULLO NEL FRIGNANO (MO)","G394":"PAZZANO (RC)","G395":"PECCIOLI (PI)","G396":"PECCO (TO)","G397":"PECETTO DI VALENZA (AL)","G398":"PECETTO TORINESE (TO)","G399":"PECORARA (PC)","G400":"PEDACE (CS)","G402":"PEDARA (CT)","G403":"PEDASO (AP)","G404":"PEDAVENA (BL)","G406":"PEDEMONTE (VI)","G408":"PEDEROBBA (TV)","G410":"PEDESINA (SO)","G411":"PEDIVIGLIANO (CS)","G412":"PEDRENGO (BG)","G415":"PEGLIO (CO)","G416":"PEGLIO (PU)","G417":"PEGOGNAGA (MN)","G418":"PEIA (BG)","G419":"PEJO (TN)","G420":"PELAGO (FI)","G421":"PELLA (NO)","G424":"PELLEGRINO PARMENSE (PR)","G426":"PELLEZZANO (SA)","G427":"PELLIO INTELVI (CO)","G428":"PELLIZZANO (TN)","G429":"PELUGO (TN)","G430":"PENANGO (AT)","G432":"PENNA IN TEVERINA (TR)","G436":"PENNA SAN GIOVANNI (MC)","G437":"PENNA SANT'ANDREA (TE)","G433":"PENNABILLI (PU)","G434":"PENNADOMO (CH)","G435":"PENNAPIEDIMONTE (CH)","G438":"PENNE (PE)","G439":"PENTONE (CZ)","G441":"PERANO (CH)","G442":"PERAROLO DI CADORE (BL)","G443":"PERCA .PERCHA. (BZ)","G444":"PERCILE (RM)","G445":"PERDASDEFOGU (NU)","G446":"PERDAXIUS (CA)","G447":"PERDIFUMO (SA)","G448":"PEREGO (LC)","G449":"PERETO (AQ)","G450":"PERFUGAS (SS)","G451":"PERGINE VALDARNO (AR)","G452":"PERGINE VALSUGANA (TN)","G453":"PERGOLA (PU)","G454":"PERINALDO (IM)","G455":"PERITO (SA)","G456":"PERLEDO (LC)","G457":"PERLETTO (CN)","G458":"PERLO (CN)","G459":"PERLOZ (AO)","G461":"PERNUMIA (PD)","C013":"PERO (MI)","G463":"PEROSA ARGENTINA (TO)","G462":"PEROSA CANAVESE (TO)","G465":"PERRERO (TO)","G469":"PERSICO DOSIMO (CR)","G471":"PERTENGO (VC)","G474":"PERTICA ALTA (BS)","G475":"PERTICA BASSA (BS)","G476":"PERTOSA (SA)","G477":"PERTUSIO (TO)","G478":"PERUGIA (PG)","G479":"PESARO (PU)","G480":"PESCAGLIA (LU)","G481":"PESCANTINA (VR)","G482":"PESCARA (PE)","G483":"PESCAROLO ED UNITI (CR)","G484":"PESCASSEROLI (AQ)","G485":"PESCATE (LC)","G486":"PESCHE (IS)","G487":"PESCHICI (FG)","G488":"PESCHIERA BORROMEO (MI)","G489":"PESCHIERA DEL GARDA (VR)","G491":"PESCIA (PT)","G492":"PESCINA (AQ)","G494":"PESCO SANNITA (BN)","G493":"PESCOCOSTANZO (AQ)","G495":"PESCOLANCIANO (IS)","G496":"PESCOPAGANO (PZ)","G497":"PESCOPENNATARO (IS)","G498":"PESCOROCCHIANO (RI)","G499":"PESCOSANSONESCO (PE)","G500":"PESCOSOLIDO (FR)","G502":"PESSANO CON BORNAGO (MI)","G504":"PESSINA CREMONESE (CR)","G505":"PESSINETTO (TO)","G506":"PETACCIATO (CB)","G508":"PETILIA POLICASTRO (KR)","G509":"PETINA (SA)","G510":"PETRALIA SOPRANA (PA)","G511":"PETRALIA SOTTANA (PA)","G513":"PETRELLA SALTO (RI)","G512":"PETRELLA TIFERNINA (CB)","G514":"PETRIANO (PU)","G515":"PETRIOLO (MC)","G516":"PETRITOLI (AP)","G517":"PETRIZZI (CZ)","G518":"PETRONA' (CZ)","M281":"PETROSINO (TP)","G519":"PETRURO IRPINO (AV)","G520":"PETTENASCO (NO)","G521":"PETTINENGO (BI)","G522":"PETTINEO (ME)","G523":"PETTORANELLO DEL MOLISE (IS)","G524":"PETTORANO SUL GIZIO (AQ)","G525":"PETTORAZZA GRIMANI (RO)","G526":"PEVERAGNO (CN)","G528":"PEZZANA (VC)","G529":"PEZZAZE (BS)","G532":"PEZZOLO VALLE UZZONE (CN)","G535":"PIACENZA (PC)","G534":"PIACENZA D'ADIGE (PD)","G536":"PIADENA (CR)","G537":"PIAGGE (PU)","G538":"PIAGGINE (SA)","G546":"PIAN CAMUNO (BS)","G552":"PIAN DI SCO (AR)","G542":"PIANA CRIXIA (SV)","G543":"PIANA DEGLI ALBANESI (PA)","G541":"PIANA DI MONTE VERNA (CE)","G547":"PIANCASTAGNAIO (SI)","G549":"PIANCOGNO (BS)","G551":"PIANDIMELETO (PU)","G553":"PIANE CRATI (CS)","G555":"PIANELLA (PE)","G556":"PIANELLO DEL LARIO (CO)","G557":"PIANELLO VAL TIDONE (PC)","G558":"PIANENGO (CR)","G559":"PIANEZZA (TO)","G560":"PIANEZZE (VI)","G561":"PIANFEI (CN)","G564":"PIANICO (BG)","G565":"PIANIGA (VE)","G568":"PIANO DI SORRENTO (NA)","D546":"PIANOPOLI (CZ)","G570":"PIANORO (BO)","G571":"PIANSANO (VT)","G572":"PIANTEDO (SO)","G574":"PIARIO (BG)","G575":"PIASCO (CN)","G576":"PIATEDA (SO)","G577":"PIATTO (BI)","G582":"PIAZZA AL SERCHIO (LU)","G580":"PIAZZA ARMERINA (EN)","G579":"PIAZZA BREMBANA (BG)","G583":"PIAZZATORRE (BG)","G587":"PIAZZOLA SUL BRENTA (PD)","G588":"PIAZZOLO (BG)","G589":"PICCIANO (PE)","G590":"PICERNO (PZ)","G591":"PICINISCO (FR)","G592":"PICO (FR)","G593":"PIEA (AT)","G594":"PIEDICAVALLO (BI)","G597":"PIEDIMONTE ETNEO (CT)","G596":"PIEDIMONTE MATESE (CE)","G598":"PIEDIMONTE SAN GERMANO (FR)","G600":"PIEDIMULERA (VB)","G601":"PIEGARO (PG)","G602":"PIENZA (SI)","G603":"PIERANICA (CR)","G612":"PIETRA DE' GIORGI (PV)","G605":"PIETRA LIGURE (SV)","G619":"PIETRA MARAZZI (AL)","G606":"PIETRABBONDANTE (IS)","G607":"PIETRABRUNA (IM)","G608":"PIETRACAMELA (TE)","G609":"PIETRACATELLA (CB)","G610":"PIETRACUPA (CB)","G611":"PIETRADEFUSI (AV)","G613":"PIETRAFERRAZZANA (CH)","G615":"PIETRAFITTA (CS)","G616":"PIETRAGALLA (PZ)","G618":"PIETRALUNGA (PG)","G620":"PIETRAMELARA (CE)","G604":"PIETRAMONTECORVINO (FG)","G621":"PIETRANICO (PE)","G622":"PIETRAPAOLA (CS)","G623":"PIETRAPERTOSA (PZ)","G624":"PIETRAPERZIA (EN)","G625":"PIETRAPORZIO (CN)","G626":"PIETRAROJA (BN)","G627":"PIETRARUBBIA (PU)","G628":"PIETRASANTA (LU)","G629":"PIETRASTORNINA (AV)","G630":"PIETRAVAIRANO (CE)","G631":"PIETRELCINA (BN)","G636":"PIEVE A NIEVOLE (PT)","G635":"PIEVE ALBIGNOLA (PV)","G638":"PIEVE D'ALPAGO (BL)","G639":"PIEVE DEL CAIRO (PV)","G641":"PIEVE DI BONO (TN)","G642":"PIEVE DI CADORE (BL)","G643":"PIEVE DI CENTO (BO)","G633":"PIEVE DI CORIANO (MN)","G644":"PIEVE DI LEDRO (TN)","G645":"PIEVE DI SOLIGO (TV)","G632":"PIEVE DI TECO (IM)","G647":"PIEVE D'OLMI (CR)","G634":"PIEVE EMANUELE (MI)","G096":"PIEVE FISSIRAGA (LO)","G648":"PIEVE FOSCIANA (LU)","G646":"PIEVE LIGURE (GE)","G650":"PIEVE PORTO MORONE (PV)","G651":"PIEVE SAN GIACOMO (CR)","G653":"PIEVE SANTO STEFANO (AR)","G656":"PIEVE TESINO (TN)","G657":"PIEVE TORINA (MC)","G658":"PIEVE VERGONTE (VB)","G637":"PIEVEBOVIGLIANA (MC)","G649":"PIEVEPELAGO (MO)","G659":"PIGLIO (FR)","G660":"PIGNA (IM)","G662":"PIGNATARO INTERAMNA (FR)","G661":"PIGNATARO MAGGIORE (CE)","G663":"PIGNOLA (PZ)","G664":"PIGNONE (SP)","G665":"PIGRA (CO)","G666":"PILA (VC)","G669":"PIMENTEL (CA)","G670":"PIMONTE (NA)","G671":"PINAROLO PO (PV)","G672":"PINASCA (TO)","G673":"PINCARA (RO)","G674":"PINEROLO (TO)","F831":"PINETO (TE)","G676":"PINO D'ASTI (AT)","G677":"PINO SULLA SPONDA DEL LAGO MAGGIORE (VA)","G678":"PINO TORINESE (TO)","G680":"PINZANO AL TAGLIAMENTO (PN)","G681":"PINZOLO (TN)","G682":"PIOBBICO (PU)","G683":"PIOBESI D'ALBA (CN)","G684":"PIOBESI TORINESE (TO)","G685":"PIODE (VC)","G686":"PIOLTELLO (MI)","G687":"PIOMBINO (LI)","G688":"PIOMBINO DESE (PD)","G690":"PIORACO (MC)","G691":"PIOSSASCO (TO)","G692":"PIOVA' MASSAIA (AT)","G693":"PIOVE DI SACCO (PD)","G694":"PIOVENE ROCCHETTE (VI)","G695":"PIOVERA (AL)","G696":"PIOZZANO (PC)","G697":"PIOZZO (CN)","G699":"PIRAINO (ME)","G702":"PISA (PI)","G703":"PISANO (NO)","G705":"PISCINA (TO)","M291":"PISCINAS (CA)","G707":"PISCIOTTA (SA)","G710":"PISOGNE (BS)","G704":"PISONIANO (RM)","G712":"PISTICCI (MT)","G713":"PISTOIA (PT)","G715":"PITEGLIO (PT)","G716":"PITIGLIANO (GR)","G717":"PIUBEGA (MN)","G718":"PIURO (SO)","G719":"PIVERONE (TO)","G720":"PIZZALE (PV)","G721":"PIZZIGHETTONE (CR)","G722":"PIZZO (VV)","G724":"PIZZOFERRATO (CH)","G726":"PIZZOLI (AQ)","G727":"PIZZONE (IS)","G728":"PIZZONI (VV)","G729":"PLACANICA (RC)","G733":"PLATACI (CS)","G734":"PLATANIA (CZ)","G735":"PLATI' (RC)","G299":"PLAUS .PLAUS. (BZ)","G737":"PLESIO (CO)","G740":"PLOAGHE (SS)","G741":"PLODIO (SV)","G742":"POCAPAGLIA (CN)","G743":"POCENIA (UD)","G746":"PODENZANA (MS)","G747":"PODENZANO (PC)","G749":"POFI (FR)","G751":"POGGIARDO (LE)","G752":"POGGIBONSI (SI)","G754":"POGGIO A CAIANO (PO)","G755":"POGGIO BERNI (RN)","G756":"POGGIO BUSTONE (RI)","G757":"POGGIO CATINO (RI)","G761":"POGGIO IMPERIALE (FG)","G763":"POGGIO MIRTETO (RI)","G764":"POGGIO MOIANO (RI)","G765":"POGGIO NATIVO (RI)","G766":"POGGIO PICENZE (AQ)","G768":"POGGIO RENATICO (FE)","G753":"POGGIO RUSCO (MN)","G770":"POGGIO SAN LORENZO (RI)","G771":"POGGIO SAN MARCELLO (AN)","D566":"POGGIO SAN VICINO (MC)","B317":"POGGIO SANNITA (IS)","G758":"POGGIODOMO (PG)","G760":"POGGIOFIORITO (CH)","G762":"POGGIOMARINO (NA)","G767":"POGGIOREALE (TP)","G769":"POGGIORSINI (BA)","G431":"POGGIRIDENTI (SO)","G772":"POGLIANO MILANESE (MI)","G773":"POGNANA LARIO (CO)","G774":"POGNANO (BG)","G775":"POGNO (NO)","G776":"POIANA MAGGIORE (VI)","G777":"POIRINO (TO)","G779":"POLAVENO (BS)","G780":"POLCENIGO (PN)","G782":"POLESELLA (RO)","G783":"POLESINE PARMENSE (PR)","G784":"POLI (RM)","G785":"POLIA (VV)","G786":"POLICORO (MT)","G787":"POLIGNANO A MARE (BA)","G789":"POLINAGO (MO)","G790":"POLINO (TR)","G791":"POLISTENA (RC)","G792":"POLIZZI GENEROSA (PA)","G793":"POLLA (SA)","G794":"POLLEIN (AO)","G795":"POLLENA TROCCHIA (NA)","F567":"POLLENZA (MC)","G796":"POLLICA (SA)","G797":"POLLINA (PA)","G798":"POLLONE (BI)","G799":"POLLUTRI (CH)","G800":"POLONGHERA (CN)","G801":"POLPENAZZE DEL GARDA (BS)","G802":"POLVERARA (PD)","G803":"POLVERIGI (AN)","G804":"POMARANCE (PI)","G805":"POMARETTO (TO)","G806":"POMARICO (MT)","G807":"POMARO MONFERRATO (AL)","G808":"POMAROLO (TN)","G809":"POMBIA (NO)","G811":"POMEZIA (RM)","G812":"POMIGLIANO D'ARCO (NA)","G813":"POMPEI (NA)","G814":"POMPEIANA (IM)","G815":"POMPIANO (BS)","G816":"POMPONESCO (MN)","G817":"POMPU (OR)","G818":"PONCARALE (BS)","G820":"PONDERANO (BI)","G821":"PONNA (CO)","G822":"PONSACCO (PI)","G823":"PONSO (PD)","G826":"PONT CANAVESE (TO)","G825":"PONTASSIEVE (FI)","G545":"PONTBOSET (AO)","G827":"PONTE (BN)","G833":"PONTE BUGGIANESE (PT)","G842":"PONTE DELL'OLIO (PC)","G844":"PONTE DI LEGNO (BS)","G846":"PONTE DI PIAVE (TV)","G830":"PONTE GARDENA .WAIDBRUCK. (BZ)","G829":"PONTE IN VALTELLINA (SO)","G847":"PONTE LAMBRO (CO)","B662":"PONTE NELLE ALPI (BL)","G851":"PONTE NIZZA (PV)","F941":"PONTE NOSSA (BG)","G855":"PONTE SAN NICOLO' (PD)","G856":"PONTE SAN PIETRO (BG)","G831":"PONTEBBA (UD)","G834":"PONTECAGNANO FAIANO (SA)","G836":"PONTECCHIO POLESINE (RO)","G837":"PONTECHIANALE (CN)","G838":"PONTECORVO (FR)","G839":"PONTECURONE (AL)","G840":"PONTEDASSIO (IM)","G843":"PONTEDERA (PI)","G848":"PONTELANDOLFO (BN)","G849":"PONTELATONE (CE)","G850":"PONTELONGO (PD)","G852":"PONTENURE (PC)","G853":"PONTERANICA (BG)","G858":"PONTESTURA (AL)","G859":"PONTEVICO (BS)","G860":"PONTEY (AO)","G861":"PONTI (AL)","G862":"PONTI SUL MINCIO (MN)","G864":"PONTIDA (BG)","G865":"PONTINIA (LT)","G866":"PONTINVREA (SV)","G867":"PONTIROLO NUOVO (BG)","G869":"PONTOGLIO (BS)","G870":"PONTREMOLI (MS)","G854":"PONT-SAINT-MARTIN (AO)","G871":"PONZA (LT)","G873":"PONZANO DI FERMO (AP)","G872":"PONZANO MONFERRATO (AL)","G874":"PONZANO ROMANO (RM)","G875":"PONZANO VENETO (TV)","G877":"PONZONE (AL)","G878":"POPOLI (PE)","G879":"POPPI (AR)","G881":"PORANO (TR)","G882":"PORCARI (LU)","G886":"PORCIA (PN)","G888":"PORDENONE (PN)","G889":"PORLEZZA (CO)","G890":"PORNASSIO (IM)","G891":"PORPETTO (UD)","A558":"PORRETTA TERME (BO)","G894":"PORTACOMARO (AT)","G895":"PORTALBERA (PV)","G900":"PORTE (TO)","G902":"PORTICI (NA)","G903":"PORTICO DI CASERTA (CE)","G904":"PORTICO E SAN BENEDETTO (FC)","G905":"PORTIGLIOLA (RC)","E680":"PORTO AZZURRO (LI)","G906":"PORTO CERESIO (VA)","M263":"PORTO CESAREO (LE)","F299":"PORTO EMPEDOCLE (AG)","G917":"PORTO MANTOVANO (MN)","G919":"PORTO RECANATI (MC)","G920":"PORTO SAN GIORGIO (AP)","G921":"PORTO SANT'ELPIDIO (AP)","G923":"PORTO TOLLE (RO)","G924":"PORTO TORRES (SS)","G907":"PORTO VALTRAVAGLIA (VA)","G926":"PORTO VIRO (RO)","G909":"PORTOBUFFOLE' (TV)","G910":"PORTOCANNONE (CB)","G912":"PORTOFERRAIO (LI)","G913":"PORTOFINO (GE)","G914":"PORTOGRUARO (VE)","G916":"PORTOMAGGIORE (FE)","M257":"PORTOPALO DI CAPO PASSERO (SR)","G922":"PORTOSCUSO (CA)","G925":"PORTOVENERE (SP)","G927":"PORTULA (BI)","G929":"POSADA (NU)","G931":"POSINA (VI)","G932":"POSITANO (SA)","G933":"POSSAGNO (TV)","G934":"POSTA (RI)","G935":"POSTA FIBRENO (FR)","G936":"POSTAL .BURGSTALL. (BZ)","G937":"POSTALESIO (SO)","G939":"POSTIGLIONE (SA)","G940":"POSTUA (VC)","G942":"POTENZA (PZ)","F632":"POTENZA PICENA (MC)","G943":"POVE DEL GRAPPA (VI)","G944":"POVEGLIANO (TV)","G945":"POVEGLIANO VERONESE (VR)","G947":"POVIGLIO (RE)","G949":"POVOLETTO (UD)","G950":"POZZA DI FASSA (TN)","G951":"POZZAGLIA SABINA (RI)","B914":"POZZAGLIO ED UNITI (CR)","G953":"POZZALLO (RG)","G954":"POZZILLI (IS)","G955":"POZZO D'ADDA (MI)","G960":"POZZOL GROPPO (AL)","G959":"POZZOLENGO (BS)","G957":"POZZOLEONE (VI)","G961":"POZZOLO FORMIGARO (AL)","G962":"POZZOMAGGIORE (SS)","G963":"POZZONOVO (PD)","G964":"POZZUOLI (NA)","G966":"POZZUOLO DEL FRIULI (UD)","G965":"POZZUOLO MARTESANA (MI)","G968":"PRADALUNGA (BG)","G969":"PRADAMANO (UD)","G970":"PRADLEVES (CN)","G973":"PRAGELATO (TO)","G975":"PRAIA A MARE (CS)","G976":"PRAIANO (SA)","G977":"PRALBOINO (BS)","G978":"PRALI (TO)","G979":"PRALORMO (TO)","G980":"PRALUNGO (BI)","G981":"PRAMAGGIORE (VE)","G982":"PRAMOLLO (TO)","G985":"PRAROLO (VC)","G986":"PRAROSTINO (TO)","G987":"PRASCO (AL)","G988":"PRASCORSANO (TO)","G989":"PRASO (TN)","G993":"PRATA CAMPORTACCIO (SO)","G992":"PRATA D'ANSIDONIA (AQ)","G994":"PRATA DI PORDENONE (PN)","G990":"PRATA DI PRINCIPATO ULTRA (AV)","G991":"PRATA SANNITA (CE)","G995":"PRATELLA (CE)","G997":"PRATIGLIONE (TO)","G999":"PRATO (PO)","H004":"PRATO ALLO STELVIO .PRAD AM STILFSERJOCH. (BZ)","H002":"PRATO CARNICO (UD)","H001":"PRATO SESIA (NO)","H007":"PRATOLA PELIGNA (AQ)","H006":"PRATOLA SERRA (AV)","H008":"PRATOVECCHIO (AR)","H010":"PRAVISDOMINI (PN)","G974":"PRAY (BI)","H011":"PRAZZO (CN)","H014":"PRECENICCO (UD)","H015":"PRECI (PG)","H017":"PREDAPPIO (FC)","H018":"PREDAZZO (TN)","H019":"PREDOI .PRETTAU. (BZ)","H020":"PREDORE (BG)","H021":"PREDOSA (AL)","H022":"PREGANZIOL (TV)","H026":"PREGNANA MILANESE (MI)","H027":"PRELA' (IM)","H028":"PREMANA (LC)","H029":"PREMARIACCO (UD)","H030":"PREMENO (VB)","H033":"PREMIA (VB)","H034":"PREMILCUORE (FC)","H036":"PREMOLO (BG)","H037":"PREMOSELLO-CHIOVENDA (VB)","H038":"PREONE (UD)","H039":"PREORE (TN)","H040":"PREPOTTO (UD)","H042":"PRE'-SAINT-DIDIER (AO)","H043":"PRESEGLIE (BS)","H045":"PRESENZANO (CE)","H046":"PRESEZZO (BG)","H047":"PRESICCE (LE)","H048":"PRESSANA (VR)","H050":"PRESTINE (BS)","H052":"PRETORO (CH)","H055":"PREVALLE (BS)","H056":"PREZZA (AQ)","H057":"PREZZO (TN)","H059":"PRIERO (CN)","H062":"PRIGNANO CILENTO (SA)","H061":"PRIGNANO SULLA SECCHIA (MO)","H063":"PRIMALUNA (LC)","H068":"PRIOCCA (CN)","H069":"PRIOLA (CN)","M279":"PRIOLO GARGALLO (SR)","G698":"PRIVERNO (LT)","H070":"PRIZZI (PA)","H071":"PROCENO (VT)","H072":"PROCIDA (NA)","H073":"PROPATA (GE)","H074":"PROSERPIO (CO)","H076":"PROSSEDI (LT)","H078":"PROVAGLIO D'ISEO (BS)","H077":"PROVAGLIO VAL SABBIA (BS)","H081":"PROVES .PROVEIS. (BZ)","H083":"PROVVIDENTI (CB)","H085":"PRUNETTO (CN)","H086":"PUEGNAGO SUL GARDA (BS)","H087":"PUGLIANELLO (BN)","H088":"PULA (CA)","H089":"PULFERO (UD)","H090":"PULSANO (TA)","H091":"PUMENENGO (BG)","H092":"PUOS D'ALPAGO (BL)","H094":"PUSIANO (CO)","H095":"PUTIFIGARI (SS)","H096":"PUTIGNANO (BA)","H097":"QUADRELLE (AV)","H098":"QUADRI (CH)","H100":"QUAGLIUZZO (TO)","H101":"QUALIANO (NA)","H102":"QUARANTI (AT)","H103":"QUAREGNA (BI)","H104":"QUARGNENTO (AL)","H106":"QUARNA SOPRA (VB)","H107":"QUARNA SOTTO (VB)","H108":"QUARONA (VC)","H109":"QUARRATA (PT)","H110":"QUART (AO)","H114":"QUARTO (NA)","H117":"QUARTO D'ALTINO (VE)","H118":"QUARTU SANT'ELENA (CA)","H119":"QUARTUCCIU (CA)","H120":"QUASSOLO (TO)","H121":"QUATTORDIO (AL)","H122":"QUATTRO CASTELLA (RE)","H124":"QUERO (BL)","H126":"QUILIANO (SV)","H127":"QUINCINETTO (TO)","H128":"QUINDICI (AV)","H129":"QUINGENTOLE (MN)","H130":"QUINTANO (CR)","H131":"QUINTO DI TREVISO (TV)","H132":"QUINTO VERCELLESE (VC)","H134":"QUINTO VICENTINO (VI)","H140":"QUINZANO D'OGLIO (BS)","H143":"QUISTELLO (MN)","H145":"QUITTENGO (BI)","H146":"RABBI (TN)","H147":"RACALE (LE)","H148":"RACALMUTO (AG)","H150":"RACCONIGI (CN)","H151":"RACCUJA (ME)","H152":"RACINES .RATSCHINGS. (BZ)","H153":"RADDA IN CHIANTI (SI)","H154":"RADDUSA (CT)","H156":"RADICOFANI (SI)","H157":"RADICONDOLI (SI)","H159":"RAFFADALI (AG)","M287":"RAGALNA (CT)","H161":"RAGOGNA (UD)","H162":"RAGOLI (TN)","H163":"RAGUSA (RG)","H166":"RAIANO (AQ)","H168":"RAMACCA (CT)","G654":"RAMISETO (RE)","H171":"RAMPONIO VERNA (CO)","H173":"RANCIO VALCUVIA (VA)","H174":"RANCO (VA)","H175":"RANDAZZO (CT)","H176":"RANICA (BG)","H177":"RANZANICO (BG)","H180":"RANZO (IM)","H182":"RAPAGNANO (AP)","H183":"RAPALLO (GE)","H184":"RAPINO (CH)","H185":"RAPOLANO TERME (SI)","H186":"RAPOLLA (PZ)","H187":"RAPONE (PZ)","H188":"RASSA (VC)","H189":"RASUN ANTERSELVA .RASEN ANTHOLZ. (BZ)","H192":"RASURA (SO)","H194":"RAVANUSA (AG)","H195":"RAVARINO (MO)","H196":"RAVASCLETTO (UD)","H198":"RAVELLO (SA)","H199":"RAVENNA (RA)","H200":"RAVEO (UD)","H202":"RAVISCANINA (CE)","H203":"RE (VB)","H204":"REA (PV)","H205":"REALMONTE (AG)","H206":"REANA DEL ROIALE (UD)","H207":"REANO (TO)","H210":"RECALE (CE)","H211":"RECANATI (MC)","H212":"RECCO (GE)","H213":"RECETTO (NO)","H214":"RECOARO TERME (VI)","H216":"REDAVALLE (PV)","H218":"REDONDESCO (MN)","H219":"REFRANCORE (AT)","H220":"REFRONTOLO (TV)","H221":"REGALBUTO (EN)","H222":"REGGELLO (FI)","H224":"REGGIO DI CALABRIA (RC)","H223":"REGGIO NELL'EMILIA (RE)","H225":"REGGIOLO (RE)","H227":"REINO (BN)","H228":"REITANO (ME)","H229":"REMANZACCO (UD)","H230":"REMEDELLO (BS)","H233":"RENATE (MI)","H235":"RENDE (CS)","H236":"RENON .RITTEN. (BZ)","H238":"RESANA (TV)","H240":"RESCALDINA (MI)","H242":"RESIA (UD)","H244":"RESIUTTA (UD)","H245":"RESUTTANO (CL)","H246":"RETORBIDO (PV)","H247":"REVELLO (CN)","H248":"REVERE (MN)","H250":"REVIGLIASCO D'ASTI (AT)","H253":"REVINE LAGO (TV)","H254":"REVO' (TN)","H255":"REZZAGO (CO)","H256":"REZZATO (BS)","H257":"REZZO (IM)","H258":"REZZOAGLIO (GE)","H262":"RHEMES-NOTRE-DAME (AO)","H263":"RHEMES-SAINT-GEORGES (AO)","H264":"RHO (MI)","H265":"RIACE (RC)","H266":"RIALTO (SV)","H267":"RIANO (RM)","H268":"RIARDO (CE)","H269":"RIBERA (AG)","H270":"RIBORDONE (TO)","H271":"RICADI (VV)","H272":"RICALDONE (AL)","H273":"RICCIA (CB)","H274":"RICCIONE (RN)","H275":"RICCO' DEL GOLFO DI SPEZIA (SP)","H276":"RICENGO (CR)","H277":"RICIGLIANO (SA)","H280":"RIESE PIO X (TV)","H281":"RIESI (CL)","H282":"RIETI (RI)","H284":"RIFIANO .RIFFIAN. (BZ)","H285":"RIFREDDO (CN)","H288":"RIGNANO FLAMINIO (RM)","H287":"RIGNANO GARGANICO (FG)","H286":"RIGNANO SULL'ARNO (FI)","H289":"RIGOLATO (UD)","H291":"RIMA SAN GIUSEPPE (VC)","H292":"RIMASCO (VC)","H293":"RIMELLA (VC)","H294":"RIMINI (RN)","H299":"RIO DI PUSTERIA .MUHLBACH. (BZ)","H305":"RIO MARINA (LI)","H297":"RIO NELL'ELBA (LI)","H298":"RIO SALICETO (RE)","H300":"RIOFREDDO (RM)","H301":"RIOLA SARDO (OR)","H302":"RIOLO TERME (RA)","H303":"RIOLUNATO (MO)","H304":"RIOMAGGIORE (SP)","H307":"RIONERO IN VULTURE (PZ)","H308":"RIONERO SANNITICO (IS)","H320":"RIPA TEATINA (CH)","H311":"RIPABOTTONI (CB)","H312":"RIPACANDIDA (PZ)","H313":"RIPALIMOSANI (CB)","H314":"RIPALTA ARPINA (CR)","H315":"RIPALTA CREMASCA (CR)","H316":"RIPALTA GUERINA (CR)","H319":"RIPARBELLA (PI)","H321":"RIPATRANSONE (AP)","H322":"RIPE (AN)","H323":"RIPE SAN GINESIO (MC)","H324":"RIPI (FR)","H325":"RIPOSTO (CT)","H326":"RITTANA (CN)","H330":"RIVA DEL GARDA (TN)","H331":"RIVA DI SOLTO (BG)","H328":"RIVA LIGURE (IM)","H337":"RIVA PRESSO CHIERI (TO)","H329":"RIVA VALDOBBIA (VC)","H333":"RIVALBA (TO)","H334":"RIVALTA BORMIDA (AL)","H335":"RIVALTA DI TORINO (TO)","H327":"RIVAMONTE AGORDINO (BL)","H336":"RIVANAZZANO (PV)","H338":"RIVARA (TO)","H340":"RIVAROLO CANAVESE (TO)","H341":"RIVAROLO DEL RE ED UNITI (CR)","H342":"RIVAROLO MANTOVANO (MN)","H343":"RIVARONE (AL)","H344":"RIVAROSSA (TO)","H346":"RIVE (VC)","H347":"RIVE D'ARCANO (UD)","H348":"RIVELLO (PZ)","H350":"RIVERGARO (PC)","H352":"RIVIGNANO (UD)","H353":"RIVISONDOLI (AQ)","H354":"RIVODUTRI (RI)","H355":"RIVOLI (TO)","H356":"RIVOLI VERONESE (VR)","H357":"RIVOLTA D'ADDA (CR)","H359":"RIZZICONI (RC)","H360":"RO (FE)","H361":"ROANA (VI)","H362":"ROASCHIA (CN)","H363":"ROASCIO (CN)","H365":"ROASIO (VC)","H366":"ROATTO (AT)","H367":"ROBASSOMERO (TO)","G223":"ROBBIATE (LC)","H369":"ROBBIO (PV)","H371":"ROBECCHETTO CON INDUNO (MI)","H372":"ROBECCO D'OGLIO (CR)","H375":"ROBECCO PAVESE (PV)","H373":"ROBECCO SUL NAVIGLIO (MI)","H376":"ROBELLA (AT)","H377":"ROBILANTE (CN)","H378":"ROBURENT (CN)","H386":"ROCCA CANAVESE (TO)","H387":"ROCCA CANTERANO (RM)","H391":"ROCCA CIGLIE' (CN)","H392":"ROCCA D'ARAZZO (AT)","H395":"ROCCA DE' BALDI (CN)","H396":"ROCCA DE' GIORGI (PV)","H398":"ROCCA D'EVANDRO (CE)","H399":"ROCCA DI BOTTE (AQ)","H400":"ROCCA DI CAMBIO (AQ)","H401":"ROCCA DI CAVE (RM)","H402":"ROCCA DI MEZZO (AQ)","H403":"ROCCA DI NETO (KR)","H404":"ROCCA DI PAPA (RM)","H414":"ROCCA GRIMALDA (AL)","H416":"ROCCA IMPERIALE (CS)","H421":"ROCCA MASSIMA (LT)","H429":"ROCCA PIA (AQ)","H379":"ROCCA PIETORE (BL)","H432":"ROCCA PRIORA (RM)","H437":"ROCCA SAN CASCIANO (FC)","H438":"ROCCA SAN FELICE (AV)","H439":"ROCCA SAN GIOVANNI (CH)","H440":"ROCCA SANTA MARIA (TE)","H441":"ROCCA SANTO STEFANO (RM)","H446":"ROCCA SINIBALDA (RI)","H450":"ROCCA SUSELLA (PV)","H382":"ROCCABASCERANA (AV)","H383":"ROCCABERNARDA (KR)","H384":"ROCCABIANCA (PR)","H385":"ROCCABRUNA (CN)","H389":"ROCCACASALE (AQ)","H393":"ROCCADARCE (FR)","H394":"ROCCADASPIDE (SA)","H405":"ROCCAFIORITA (ME)","H390":"ROCCAFLUVIONE (AP)","H408":"ROCCAFORTE DEL GRECO (RC)","H406":"ROCCAFORTE LIGURE (AL)","H407":"ROCCAFORTE MONDOVI' (CN)","H409":"ROCCAFORZATA (TA)","H410":"ROCCAFRANCA (BS)","H411":"ROCCAGIOVINE (RM)","H412":"ROCCAGLORIOSA (SA)","H413":"ROCCAGORGA (LT)","H417":"ROCCALBEGNA (GR)","H418":"ROCCALUMERA (ME)","H420":"ROCCAMANDOLFI (IS)","H422":"ROCCAMENA (PA)","H423":"ROCCAMONFINA (CE)","H424":"ROCCAMONTEPIANO (CH)","H425":"ROCCAMORICE (PE)","H426":"ROCCANOVA (PZ)","H427":"ROCCANTICA (RI)","H428":"ROCCAPALUMBA (PA)","H431":"ROCCAPIEMONTE (SA)","H433":"ROCCARAINOLA (NA)","H434":"ROCCARASO (AQ)","H436":"ROCCAROMANA (CE)","H442":"ROCCASCALEGNA (CH)","H443":"ROCCASECCA (FR)","H444":"ROCCASECCA DEI VOLSCI (LT)","H445":"ROCCASICURA (IS)","H447":"ROCCASPARVERA (CN)","H448":"ROCCASPINALVETI (CH)","H449":"ROCCASTRADA (GR)","H380":"ROCCAVALDINA (ME)","H451":"ROCCAVERANO (AT)","H452":"ROCCAVIGNALE (SV)","H453":"ROCCAVIONE (CN)","H454":"ROCCAVIVARA (CB)","H456":"ROCCELLA IONICA (RC)","H455":"ROCCELLA VALDEMONE (ME)","H458":"ROCCHETTA A VOLTURNO (IS)","H462":"ROCCHETTA BELBO (CN)","H461":"ROCCHETTA DI VARA (SP)","H459":"ROCCHETTA E CROCE (CE)","H465":"ROCCHETTA LIGURE (AL)","H460":"ROCCHETTA NERVINA (IM)","H466":"ROCCHETTA PALAFEA (AT)","H467":"ROCCHETTA SANT'ANTONIO (FG)","H468":"ROCCHETTA TANARO (AT)","H470":"RODANO (MI)","H472":"RODDI (CN)","H473":"RODDINO (CN)","H474":"RODELLO (CN)","H475":"RODENGO .RODENECK. (BZ)","H477":"RODENGO-SAIANO (BS)","H478":"RODERO (CO)","H480":"RODI GARGANICO (FG)","H479":"RODI' MILICI (ME)","H481":"RODIGO (MN)","H484":"ROE' VOLCIANO (BS)","H485":"ROFRANO (SA)","H486":"ROGENO (LC)","H488":"ROGGIANO GRAVINA (CS)","H489":"ROGHUDI (RC)","H490":"ROGLIANO (CS)","H491":"ROGNANO (PV)","H492":"ROGNO (BG)","H493":"ROGOLO (SO)","H494":"ROIATE (RM)","H495":"ROIO DEL SANGRO (CH)","H497":"ROISAN (AO)","H498":"ROLETTO (TO)","H500":"ROLO (RE)","H501":"ROMA (RM)","H503":"ROMAGNANO AL MONTE (SA)","H502":"ROMAGNANO SESIA (NO)","H505":"ROMAGNESE (PV)","H506":"ROMALLO (TN)","H507":"ROMANA (SS)","H508":"ROMANENGO (CR)","H511":"ROMANO CANAVESE (TO)","H512":"ROMANO D'EZZELINO (VI)","H509":"ROMANO DI LOMBARDIA (BG)","H514":"ROMANS D'ISONZO (GO)","H516":"ROMBIOLO (VV)","H517":"ROMENO (TN)","H518":"ROMENTINO (NO)","H519":"ROMETTA (ME)","H521":"RONAGO (CO)","H522":"RONCA' (VR)","H523":"RONCADE (TV)","H525":"RONCADELLE (BS)","H527":"RONCARO (PV)","H528":"RONCEGNO (TN)","H529":"RONCELLO (MI)","H531":"RONCHI DEI LEGIONARI (GO)","H532":"RONCHI VALSUGANA (TN)","H533":"RONCHIS (UD)","H534":"RONCIGLIONE (VT)","H540":"RONCO ALL'ADIGE (VR)","H538":"RONCO BIELLESE (BI)","H537":"RONCO BRIANTINO (MI)","H539":"RONCO CANAVESE (TO)","H536":"RONCO SCRIVIA (GE)","H535":"RONCOBELLO (BG)","H541":"RONCOFERRARO (MN)","H542":"RONCOFREDDO (FC)","H544":"RONCOLA (BG)","H545":"RONCONE (TN)","H546":"RONDANINA (GE)","H547":"RONDISSONE (TO)","H549":"RONSECCO (VC)","M303":"RONZO-CHIENIS (TN)","H552":"RONZONE (TN)","H553":"ROPPOLO (BI)","H554":"RORA' (TO)","H556":"ROSA' (VI)","H558":"ROSARNO (RC)","H559":"ROSASCO (PV)","H560":"ROSATE (MI)","H561":"ROSAZZA (BI)","H562":"ROSCIANO (PE)","H564":"ROSCIGNO (SA)","H565":"ROSE (CS)","H566":"ROSELLO (CH)","H572":"ROSETO CAPO SPULICO (CS)","F585":"ROSETO DEGLI ABRUZZI (TE)","H568":"ROSETO VALFORTORE (FG)","H570":"ROSIGNANO MARITTIMO (LI)","H569":"ROSIGNANO MONFERRATO (AL)","H573":"ROSOLINA (RO)","H574":"ROSOLINI (SR)","H575":"ROSORA (AN)","H577":"ROSSA (VC)","H578":"ROSSANA (CN)","H579":"ROSSANO (CS)","H580":"ROSSANO VENETO (VI)","H581":"ROSSIGLIONE (GE)","H583":"ROSTA (TO)","H584":"ROTA D'IMAGNA (BG)","H585":"ROTA GRECA (CS)","H588":"ROTELLA (AP)","H589":"ROTELLO (CB)","H590":"ROTONDA (PZ)","H591":"ROTONDELLA (MT)","H592":"ROTONDI (AV)","H593":"ROTTOFRENO (PC)","H594":"ROTZO (VI)","H555":"ROURE (TO)","H596":"ROVAGNATE (LC)","H364":"ROVASENDA (VC)","H598":"ROVATO (BS)","H599":"ROVEGNO (GE)","H601":"ROVELLASCA (CO)","H602":"ROVELLO PORRO (CO)","H604":"ROVERBELLA (MN)","H606":"ROVERCHIARA (VR)","H607":"ROVERE' DELLA LUNA (TN)","H608":"ROVERE' VERONESE (VR)","H610":"ROVEREDO DI GUA' (VR)","H609":"ROVEREDO IN PIANO (PN)","H612":"ROVERETO (TN)","H614":"ROVESCALA (PV)","H615":"ROVETTA (BG)","H618":"ROVIANO (RM)","H620":"ROVIGO (RO)","H621":"ROVITO (CS)","H622":"ROVOLON (PD)","H623":"ROZZANO (MI)","H625":"RUBANO (PD)","H627":"RUBIANA (TO)","H628":"RUBIERA (RE)","H629":"RUDA (UD)","H630":"RUDIANO (BS)","H631":"RUEGLIO (TO)","H632":"RUFFANO (LE)","H633":"RUFFIA (CN)","H634":"RUFFRE' (TN)","H635":"RUFINA (FI)","F271":"RUINAS (OR)","H637":"RUINO (PV)","H639":"RUMO (TN)","H641":"RUOTI (PZ)","H642":"RUSSI (RA)","H643":"RUTIGLIANO (BA)","H644":"RUTINO (SA)","H165":"RUVIANO (CE)","H646":"RUVO DEL MONTE (PZ)","H645":"RUVO DI PUGLIA (BA)","H647":"SABAUDIA (LT)","H648":"SABBIA (VC)","H650":"SABBIO CHIESE (BS)","H652":"SABBIONETA (MN)","H654":"SACCO (SA)","H655":"SACCOLONGO (PD)","H657":"SACILE (PN)","H658":"SACROFANO (RM)","H659":"SADALI (NU)","H661":"SAGAMA (NU)","H662":"SAGLIANO MICCA (BI)","H665":"SAGRADO (GO)","H666":"SAGRON MIS (TN)","H669":"SAINT-CHRISTOPHE (AO)","H670":"SAINT-DENIS (AO)","H671":"SAINT-MARCEL (AO)","H672":"SAINT-NICOLAS (AO)","H673":"SAINT-OYEN (AO)","H674":"SAINT-PIERRE (AO)","H675":"SAINT-RHEMY-EN-BOSSES (AO)","H676":"SAINT-VINCENT (AO)","H682":"SALA BAGANZA (PR)","H681":"SALA BIELLESE (BI)","H678":"SALA BOLOGNESE (BO)","H679":"SALA COMACINA (CO)","H683":"SALA CONSILINA (SA)","H677":"SALA MONFERRATO (AL)","H687":"SALANDRA (MT)","H688":"SALAPARUTA (TP)","H689":"SALARA (RO)","H690":"SALASCO (VC)","H691":"SALASSA (TO)","H684":"SALBERTRAND (TO)","F810":"SALCEDO (VI)","H693":"SALCITO (CB)","H694":"SALE (AL)","H695":"SALE DELLE LANGHE (CN)","H699":"SALE MARASINO (BS)","H704":"SALE SAN GIOVANNI (CN)","H700":"SALEMI (TP)","H686":"SALENTO (SA)","H702":"SALERANO CANAVESE (TO)","H701":"SALERANO SUL LAMBRO (LO)","H703":"SALERNO (SA)","H705":"SALETTO (PD)","H706":"SALGAREDA (TV)","H707":"SALI VERCELLESE (VC)","H708":"SALICE SALENTINO (LE)","H710":"SALICETO (CN)","H713":"SALISANO (RI)","H714":"SALIZZOLE (VR)","H715":"SALLE (PE)","H716":"SALMOUR (CN)","H717":"SALO' (BS)","H719":"SALORNO .SALURN. (BZ)","H720":"SALSOMAGGIORE TERME (PR)","H721":"SALTARA (PU)","H723":"SALTRIO (VA)","H724":"SALUDECIO (RN)","H725":"SALUGGIA (VC)","H726":"SALUSSOLA (BI)","H727":"SALUZZO (CN)","H729":"SALVE (LE)","H731":"SALVIROLA (CR)","H732":"SALVITELLE (SA)","H734":"SALZA DI PINEROLO (TO)","H733":"SALZA IRPINA (AV)","H735":"SALZANO (VE)","H736":"SAMARATE (VA)","H738":"SAMASSI (CA)","H739":"SAMATZAI (CA)","H743":"SAMBUCA DI SICILIA (AG)","H744":"SAMBUCA PISTOIESE (PT)","H745":"SAMBUCI (RM)","H746":"SAMBUCO (CN)","H749":"SAMMICHELE DI BARI (BA)","H013":"SAMO (RC)","H752":"SAMOLACO (SO)","H753":"SAMONE (TO)","H754":"SAMONE (TN)","H755":"SAMPEYRE (CN)","H756":"SAMUGHEO (OR)","H763":"SAN BARTOLOMEO AL MARE (IM)","H764":"SAN BARTOLOMEO IN GALDO (BN)","H760":"SAN BARTOLOMEO VAL CAVARGNA (CO)","H765":"SAN BASILE (CS)","H766":"SAN BASILIO (CA)","H767":"SAN BASSANO (CR)","H768":"SAN BELLINO (RO)","H770":"SAN BENEDETTO BELBO (CN)","H772":"SAN BENEDETTO DEI MARSI (AQ)","H769":"SAN BENEDETTO DEL TRONTO (AP)","H773":"SAN BENEDETTO IN PERILLIS (AQ)","H771":"SAN BENEDETTO PO (MN)","H774":"SAN BENEDETTO ULLANO (CS)","G566":"SAN BENEDETTO VAL DI SAMBRO (BO)","H775":"SAN BENIGNO CANAVESE (TO)","H777":"SAN BERNARDINO VERBANO (VB)","H780":"SAN BIAGIO DELLA CIMA (IM)","H781":"SAN BIAGIO DI CALLALTA (TV)","H778":"SAN BIAGIO PLATANI (AG)","H779":"SAN BIAGIO SARACINISCO (FR)","H782":"SAN BIASE (CB)","H783":"SAN BONIFACIO (VR)","H784":"SAN BUONO (CH)","H785":"SAN CALOGERO (VV)","H786":"SAN CANDIDO .INNICHEN. (BZ)","H787":"SAN CANZIAN D'ISONZO (GO)","H789":"SAN CARLO CANAVESE (TO)","H790":"SAN CASCIANO DEI BAGNI (SI)","H791":"SAN CASCIANO IN VAL DI PESA (FI)","M264":"SAN CASSIANO (LE)","H792":"SAN CATALDO (CL)","M295":"SAN CESAREO (RM)","H793":"SAN CESARIO DI LECCE (LE)","H794":"SAN CESARIO SUL PANARO (MO)","H795":"SAN CHIRICO NUOVO (PZ)","H796":"SAN CHIRICO RAPARO (PZ)","H797":"SAN CIPIRELLO (PA)","H798":"SAN CIPRIANO D'AVERSA (CE)","H800":"SAN CIPRIANO PICENTINO (SA)","H799":"SAN CIPRIANO PO (PV)","H801":"SAN CLEMENTE (RN)","H803":"SAN COLOMBANO AL LAMBRO (MI)","H804":"SAN COLOMBANO BELMONTE (TO)","H802":"SAN COLOMBANO CERTENOLI (GE)","H805":"SAN CONO (CT)","H806":"SAN COSMO ALBANESE (CS)","H808":"SAN COSTANTINO ALBANESE (PZ)","H807":"SAN COSTANTINO CALABRO (VV)","H809":"SAN COSTANZO (PU)","H810":"SAN CRISTOFORO (AL)","H814":"SAN DAMIANO AL COLLE (PV)","H811":"SAN DAMIANO D'ASTI (AT)","H812":"SAN DAMIANO MACRA (CN)","H816":"SAN DANIELE DEL FRIULI (UD)","H815":"SAN DANIELE PO (CR)","H818":"SAN DEMETRIO CORONE (CS)","H819":"SAN DEMETRIO NE' VESTINI (AQ)","H820":"SAN DIDERO (TO)","H823":"SAN DONA' DI PIAVE (VE)","H822":"SAN DONACI (BR)","H826":"SAN DONATO DI LECCE (LE)","H825":"SAN DONATO DI NINEA (CS)","H827":"SAN DONATO MILANESE (MI)","H824":"SAN DONATO VAL DI COMINO (FR)","D324":"SAN DORLIGO DELLA VALLE (TS)","H830":"SAN FEDELE INTELVI (CO)","H831":"SAN FELE (PZ)","H834":"SAN FELICE A CANCELLO (CE)","H836":"SAN FELICE CIRCEO (LT)","H838":"SAN FELICE DEL BENACO (BS)","H833":"SAN FELICE DEL MOLISE (CB)","H835":"SAN FELICE SUL PANARO (MO)","M277":"SAN FERDINANDO (RC)","H839":"SAN FERDINANDO DI PUGLIA (FG)","H840":"SAN FERMO DELLA BATTAGLIA (CO)","H841":"SAN FILI (CS)","H842":"SAN FILIPPO DEL MELA (ME)","H843":"SAN FIOR (TV)","H844":"SAN FIORANO (LO)","H845":"SAN FLORIANO DEL COLLIO (GO)","H846":"SAN FLORO (CZ)","H847":"SAN FRANCESCO AL CAMPO (TO)","H850":"SAN FRATELLO (ME)","H856":"SAN GAVINO MONREALE (CA)","H857":"SAN GEMINI (TR)","H858":"SAN GENESIO ATESINO .JENESIEN. (BZ)","H859":"SAN GENESIO ED UNITI (PV)","H860":"SAN GENNARO VESUVIANO (NA)","H862":"SAN GERMANO CHISONE (TO)","H863":"SAN GERMANO DEI BERICI (VI)","H861":"SAN GERMANO VERCELLESE (VC)","H865":"SAN GERVASIO BRESCIANO (BS)","H867":"SAN GIACOMO DEGLI SCHIAVONI (CB)","H870":"SAN GIACOMO DELLE SEGNATE (MN)","H868":"SAN GIACOMO FILIPPO (SO)","B952":"SAN GIACOMO VERCELLESE (VC)","H873":"SAN GILLIO (TO)","H875":"SAN GIMIGNANO (SI)","H876":"SAN GINESIO (MC)","H892":"SAN GIORGIO A CREMANO (NA)","H880":"SAN GIORGIO A LIRI (FR)","H881":"SAN GIORGIO ALBANESE (CS)","H890":"SAN GIORGIO CANAVESE (TO)","H894":"SAN GIORGIO DEL SANNIO (BN)","H891":"SAN GIORGIO DELLA RICHINVELDA (PN)","H893":"SAN GIORGIO DELLE PERTICHE (PD)","H885":"SAN GIORGIO DI LOMELLINA (PV)","H883":"SAN GIORGIO DI MANTOVA (MN)","H895":"SAN GIORGIO DI NOGARO (UD)","H886":"SAN GIORGIO DI PESARO (PU)","H896":"SAN GIORGIO DI PIANO (BO)","H897":"SAN GIORGIO IN BOSCO (PD)","H882":"SAN GIORGIO IONICO (TA)","H898":"SAN GIORGIO LA MOLARA (BN)","H888":"SAN GIORGIO LUCANO (MT)","H878":"SAN GIORGIO MONFERRATO (AL)","H889":"SAN GIORGIO MORGETO (RC)","H887":"SAN GIORGIO PIACENTINO (PC)","H899":"SAN GIORGIO SCARAMPI (AT)","H884":"SAN GIORGIO SU LEGNANO (MI)","H900":"SAN GIORIO DI SUSA (TO)","H907":"SAN GIOVANNI A PIRO (SA)","H906":"SAN GIOVANNI AL NATISONE (UD)","H910":"SAN GIOVANNI BIANCO (BG)","H911":"SAN GIOVANNI D'ASSO (SI)","H912":"SAN GIOVANNI DEL DOSSO (MN)","H903":"SAN GIOVANNI DI GERACE (RC)","H914":"SAN GIOVANNI GEMINI (AG)","H916":"SAN GIOVANNI ILARIONE (VR)","H918":"SAN GIOVANNI IN CROCE (CR)","H919":"SAN GIOVANNI IN FIORE (CS)","H920":"SAN GIOVANNI IN GALDO (CB)","H921":"SAN GIOVANNI IN MARIGNANO (RN)","G467":"SAN GIOVANNI IN PERSICETO (BO)","H917":"SAN GIOVANNI INCARICO (FR)","H922":"SAN GIOVANNI LA PUNTA (CT)","H923":"SAN GIOVANNI LIPIONI (CH)","H924":"SAN GIOVANNI LUPATOTO (VR)","H926":"SAN GIOVANNI ROTONDO (FG)","G287":"SAN GIOVANNI SUERGIU (CA)","D690":"SAN GIOVANNI TEATINO (CH)","H901":"SAN GIOVANNI VALDARNO (AR)","H928":"SAN GIULIANO DEL SANNIO (CB)","H929":"SAN GIULIANO DI PUGLIA (CB)","H930":"SAN GIULIANO MILANESE (MI)","A562":"SAN GIULIANO TERME (PI)","H933":"SAN GIUSEPPE JATO (PA)","H931":"SAN GIUSEPPE VESUVIANO (NA)","H935":"SAN GIUSTINO (PG)","H936":"SAN GIUSTO CANAVESE (TO)","H937":"SAN GODENZO (FI)","H942":"SAN GREGORIO DA SASSOLA (RM)","H940":"SAN GREGORIO DI CATANIA (CT)","H941":"SAN GREGORIO D'IPPONA (VV)","H943":"SAN GREGORIO MAGNO (SA)","H939":"SAN GREGORIO MATESE (CE)","H938":"SAN GREGORIO NELLE ALPI (BL)","H945":"SAN LAZZARO DI SAVENA (BO)","H949":"SAN LEO (PU)","H951":"SAN LEONARDO (UD)","H952":"SAN LEONARDO IN PASSIRIA .ST LEONHARD IN PAS. (BZ)","H953":"SAN LEUCIO DEL SANNIO (BN)","H955":"SAN LORENZELLO (BN)","H959":"SAN LORENZO (RC)","H957":"SAN LORENZO AL MARE (IM)","H961":"SAN LORENZO BELLIZZI (CS)","H962":"SAN LORENZO DEL VALLO (CS)","H956":"SAN LORENZO DI SEBATO .ST LORENZEN. (BZ)","H966":"SAN LORENZO IN BANALE (TN)","H958":"SAN LORENZO IN CAMPO (PU)","H964":"SAN LORENZO ISONTINO (GO)","H967":"SAN LORENZO MAGGIORE (BN)","H969":"SAN LORENZO NUOVO (VT)","H970":"SAN LUCA (RC)","H971":"SAN LUCIDO (CS)","H973":"SAN LUPO (BN)","H976":"SAN MANGO D'AQUINO (CZ)","H977":"SAN MANGO PIEMONTE (SA)","H975":"SAN MANGO SUL CALORE (AV)","H978":"SAN MARCELLINO (CE)","H979":"SAN MARCELLO (AN)","H980":"SAN MARCELLO PISTOIESE (PT)","H981":"SAN MARCO ARGENTANO (CS)","H982":"SAN MARCO D'ALUNZIO (ME)","H984":"SAN MARCO DEI CAVOTI (BN)","F043":"SAN MARCO EVANGELISTA (CE)","H985":"SAN MARCO IN LAMIS (FG)","H986":"SAN MARCO LA CATOLA (FG)","H999":"SAN MARTINO AL TAGLIAMENTO (PN)","H987":"SAN MARTINO ALFIERI (AT)","I003":"SAN MARTINO BUON ALBERGO (VR)","H997":"SAN MARTINO CANAVESE (TO)","H994":"SAN MARTINO D'AGRI (PZ)","I005":"SAN MARTINO DALL'ARGINE (MN)","I007":"SAN MARTINO DEL LAGO (CR)","H992":"SAN MARTINO DI FINITA (CS)","I008":"SAN MARTINO DI LUPARI (PD)","H996":"SAN MARTINO DI VENEZZE (RO)","H988":"SAN MARTINO IN BADIA .ST MARTIN IN THURN. (BZ)","H989":"SAN MARTINO IN PASSIRIA .ST MARTIN IN PASSEI. (BZ)","H990":"SAN MARTINO IN PENSILIS (CB)","I011":"SAN MARTINO IN RIO (RE)","I012":"SAN MARTINO IN STRADA (LO)","I002":"SAN MARTINO SANNITA (BN)","I014":"SAN MARTINO SICCOMARIO (PV)","H991":"SAN MARTINO SULLA MARRUCINA (CH)","I016":"SAN MARTINO VALLE CAUDINA (AV)","I018":"SAN MARZANO DI SAN GIUSEPPE (TA)","I017":"SAN MARZANO OLIVETO (AT)","I019":"SAN MARZANO SUL SARNO (SA)","I023":"SAN MASSIMO (CB)","I024":"SAN MAURIZIO CANAVESE (TO)","I025":"SAN MAURIZIO D'OPAGLIO (NO)","I028":"SAN MAURO CASTELVERDE (PA)","I031":"SAN MAURO CILENTO (SA)","H712":"SAN MAURO DI SALINE (VR)","I029":"SAN MAURO FORTE (MT)","I032":"SAN MAURO LA BRUCA (SA)","I026":"SAN MAURO MARCHESATO (KR)","I027":"SAN MAURO PASCOLI (FC)","I030":"SAN MAURO TORINESE (TO)","I040":"SAN MICHELE AL TAGLIAMENTO (VE)","I042":"SAN MICHELE ALL'ADIGE (TN)","I035":"SAN MICHELE DI GANZARIA (CT)","I034":"SAN MICHELE DI SERINO (AV)","I037":"SAN MICHELE MONDOVI' (CN)","I045":"SAN MICHELE SALENTINO (BR)","I046":"SAN MINIATO (PI)","I047":"SAN NAZARIO (VI)","I049":"SAN NAZZARO (BN)","I052":"SAN NAZZARO SESIA (NO)","I051":"SAN NAZZARO VAL CAVARGNA (CO)","I060":"SAN NICOLA ARCELLA (CS)","I061":"SAN NICOLA BARONIA (AV)","I058":"SAN NICOLA DA CRISSA (VV)","I057":"SAN NICOLA DELL'ALTO (KR)","I056":"SAN NICOLA LA STRADA (CE)","I062":"SAN NICOLA MANFREDI (BN)","A368":"SAN NICOLO' D'ARCIDANO (OR)","I063":"SAN NICOLO' DI COMELICO (BL)","G383":"SAN NICOLO' GERREI (CA)","I065":"SAN PANCRAZIO .ST PANKRAZ. (BZ)","I066":"SAN PANCRAZIO SALENTINO (BR)","G407":"SAN PAOLO (BS)","B906":"SAN PAOLO ALBANESE (PZ)","I073":"SAN PAOLO BEL SITO (NA)","I074":"SAN PAOLO CERVO (BI)","B310":"SAN PAOLO D'ARGON (BG)","I072":"SAN PAOLO DI CIVITATE (FG)","I071":"SAN PAOLO DI JESI (AN)","I076":"SAN PAOLO SOLBRITO (AT)","I079":"SAN PELLEGRINO TERME (BG)","I082":"SAN PIER D'ISONZO (GO)","I084":"SAN PIER NICETO (ME)","I085":"SAN PIERO A SIEVE (FI)","I086":"SAN PIERO PATTI (ME)","I093":"SAN PIETRO A MAIDA (CZ)","I092":"SAN PIETRO AL NATISONE (UD)","I089":"SAN PIETRO AL TANAGRO (SA)","I095":"SAN PIETRO APOSTOLO (CZ)","I096":"SAN PIETRO AVELLANA (IS)","I098":"SAN PIETRO CLARENZA (CT)","I088":"SAN PIETRO DI CADORE (BL)","I102":"SAN PIETRO DI CARIDA' (RC)","I103":"SAN PIETRO DI FELETTO (TV)","I105":"SAN PIETRO DI MORUBIO (VR)","I108":"SAN PIETRO IN AMANTEA (CS)","I109":"SAN PIETRO IN CARIANO (VR)","I110":"SAN PIETRO IN CASALE (BO)","G788":"SAN PIETRO IN CERRO (PC)","I107":"SAN PIETRO IN GU (PD)","I114":"SAN PIETRO IN GUARANO (CS)","I115":"SAN PIETRO IN LAMA (LE)","I113":"SAN PIETRO INFINE (CE)","I116":"SAN PIETRO MOSEZZO (NO)","I117":"SAN PIETRO MUSSOLINO (VI)","I090":"SAN PIETRO VAL LEMINA (TO)","I119":"SAN PIETRO VERNOTICO (BR)","I120":"SAN PIETRO VIMINARIO (PD)","I121":"SAN PIO DELLE CAMERE (AQ)","I125":"SAN POLO DEI CAVALIERI (RM)","I123":"SAN POLO D'ENZA (RE)","I124":"SAN POLO DI PIAVE (TV)","I122":"SAN POLO MATESE (CB)","I126":"SAN PONSO (TO)","I128":"SAN POSSIDONIO (MO)","I130":"SAN POTITO SANNITICO (CE)","I129":"SAN POTITO ULTRA (AV)","I131":"SAN PRISCO (CE)","I132":"SAN PROCOPIO (RC)","I133":"SAN PROSPERO (MO)","I135":"SAN QUIRICO D'ORCIA (SI)","I136":"SAN QUIRINO (PN)","I137":"SAN RAFFAELE CIMENA (TO)","I138":"SAN REMO (IM)","I139":"SAN ROBERTO (RC)","I140":"SAN ROCCO AL PORTO (LO)","I142":"SAN ROMANO IN GARFAGNANA (LU)","I143":"SAN RUFO (SA)","I147":"SAN SALVATORE DI FITALIA (ME)","I144":"SAN SALVATORE MONFERRATO (AL)","I145":"SAN SALVATORE TELESINO (BN)","I148":"SAN SALVO (CH)","I151":"SAN SEBASTIANO AL VESUVIO (NA)","I150":"SAN SEBASTIANO CURONE (AL)","I152":"SAN SEBASTIANO DA PO (TO)","I154":"SAN SECONDO DI PINEROLO (TO)","I153":"SAN SECONDO PARMENSE (PR)","I157":"SAN SEVERINO LUCANO (PZ)","I156":"SAN SEVERINO MARCHE (MC)","I158":"SAN SEVERO (FG)","I162":"SAN SIRO (CO)","I163":"SAN SOSSIO BARONIA (AV)","I164":"SAN SOSTENE (CZ)","I165":"SAN SOSTI (CS)","I166":"SAN SPERATE (CA)","I261":"SAN TAMMARO (CE)","I328":"SAN TEODORO (ME)","I329":"SAN TEODORO (NU)","I347":"SAN TOMASO AGORDINO (BL)","I376":"SAN VALENTINO IN ABRUZZO CITERIORE (PE)","I377":"SAN VALENTINO TORIO (SA)","I381":"SAN VENANZO (TR)","I382":"SAN VENDEMIANO (TV)","I384":"SAN VERO MILIS (OR)","I390":"SAN VINCENZO (LI)","I388":"SAN VINCENZO LA COSTA (CS)","I389":"SAN VINCENZO VALLE ROVETO (AQ)","I391":"SAN VITALIANO (NA)","I402":"SAN VITO (CA)","I403":"SAN VITO AL TAGLIAMENTO (PN)","I404":"SAN VITO AL TORRE (UD)","I394":"SAN VITO CHIETINO (CH)","I396":"SAN VITO DEI NORMANNI (BR)","I392":"SAN VITO DI CADORE (BL)","I405":"SAN VITO DI FAGAGNA (UD)","I401":"SAN VITO DI LEGUZZANO (VI)","I407":"SAN VITO LO CAPO (TP)","I400":"SAN VITO ROMANO (RM)","I393":"SAN VITO SULLO IONIO (CZ)","I408":"SAN VITTORE DEL LAZIO (FR)","I409":"SAN VITTORE OLONA (MI)","I414":"SAN ZENO DI MONTAGNA (VR)","I412":"SAN ZENO NAVIGLIO (BS)","I415":"SAN ZENONE AL LAMBRO (MI)","I416":"SAN ZENONE AL PO (PV)","I417":"SAN ZENONE DEGLI EZZELINI (TV)","H757":"SANARICA (LE)","H821":"SANDIGLIANO (BI)","H829":"SANDRIGO (VI)","H851":"SANFRE' (CN)","H852":"SANFRONT (CN)","H855":"SANGANO (TO)","H872":"SANGIANO (VA)","H877":"SANGINETO (CS)","H944":"SANGUINETTO (VR)","H974":"SANLURI (CA)","I048":"SANNAZZARO DE' BURGONDI (PV)","I053":"SANNICANDRO DI BARI (BA)","I054":"SANNICANDRO GARGANICO (FG)","I059":"SANNICOLA (LE)","I155":"SANSEPOLCRO (AR)","I168":"SANTA BRIGIDA (BG)","I171":"SANTA CATERINA ALBANESE (CS)","I170":"SANTA CATERINA DELLO IONIO (CZ)","I169":"SANTA CATERINA VILLARMOSA (CL)","I172":"SANTA CESAREA TERME (LE)","I176":"SANTA CRISTINA D'ASPROMONTE (RC)","I175":"SANTA CRISTINA E BISSONE (PV)","I174":"SANTA CRISTINA GELA (PA)","I173":"SANTA CRISTINA VALGARDENA .ST CHRISTINA IN G. (BZ)","I178":"SANTA CROCE CAMERINA (RG)","I179":"SANTA CROCE DEL SANNIO (BN)","I181":"SANTA CROCE DI MAGLIANO (CB)","I177":"SANTA CROCE SULL'ARNO (PI)","I183":"SANTA DOMENICA TALAO (CS)","I184":"SANTA DOMENICA VITTORIA (ME)","I185":"SANTA ELISABETTA (AG)","I187":"SANTA FIORA (GR)","I188":"SANTA FLAVIA (PA)","I203":"SANTA GIULETTA (PV)","I205":"SANTA GIUSTA (OR)","I206":"SANTA GIUSTINA (BL)","I207":"SANTA GIUSTINA IN COLLE (PD)","I217":"SANTA LUCE (PI)","I220":"SANTA LUCIA DEL MELA (ME)","I221":"SANTA LUCIA DI PIAVE (TV)","I219":"SANTA LUCIA DI SERINO (AV)","I226":"SANTA MARGHERITA D'ADIGE (PD)","I224":"SANTA MARGHERITA DI BELICE (AG)","I230":"SANTA MARGHERITA DI STAFFORA (PV)","I225":"SANTA MARGHERITA LIGURE (GE)","I232":"SANTA MARIA A MONTE (PI)","I233":"SANTA MARIA A VICO (CE)","I234":"SANTA MARIA CAPUA VETERE (CE)","M284":"SANTA MARIA COGHINAS (SS)","C717":"SANTA MARIA DEL CEDRO (CS)","I238":"SANTA MARIA DEL MOLISE (IS)","I237":"SANTA MARIA DELLA VERSA (PV)","I240":"SANTA MARIA DI LICODIA (CT)","I242":"SANTA MARIA DI SALA (VE)","I243":"SANTA MARIA HOE' (LC)","I244":"SANTA MARIA IMBARO (CH)","M273":"SANTA MARIA LA CARITA' (NA)","I247":"SANTA MARIA LA FOSSA (CE)","I248":"SANTA MARIA LA LONGA (UD)","I249":"SANTA MARIA MAGGIORE (VB)","I251":"SANTA MARIA NUOVA (AN)","I253":"SANTA MARINA (SA)","I254":"SANTA MARINA SALINA (ME)","I255":"SANTA MARINELLA (RM)","I291":"SANTA NINFA (TP)","I301":"SANTA PAOLINA (AV)","I308":"SANTA SEVERINA (KR)","I310":"SANTA SOFIA (FC)","I309":"SANTA SOFIA D'EPIRO (CS)","I311":"SANTA TERESA DI RIVA (ME)","I312":"SANTA TERESA GALLURA (SS)","I314":"SANTA VENERINA (CT)","I316":"SANTA VITTORIA D'ALBA (CN)","I315":"SANTA VITTORIA IN MATENANO (AP)","I182":"SANTADI (CA)","I189":"SANT'AGAPITO (IS)","I191":"SANT'AGATA BOLOGNESE (BO)","I197":"SANT'AGATA DE' GOTI (BN)","I198":"SANT'AGATA DEL BIANCO (RC)","I192":"SANT'AGATA DI ESARO (CS)","I199":"SANT'AGATA DI MILITELLO (ME)","I193":"SANT'AGATA DI PUGLIA (FG)","I201":"SANT'AGATA FELTRIA (PU)","I190":"SANT'AGATA FOSSILI (AL)","I202":"SANT'AGATA LI BATTIATI (CT)","I196":"SANT'AGATA SUL SANTERNO (RA)","I208":"SANT'AGNELLO (NA)","I209":"SANT'AGOSTINO (FE)","I210":"SANT'ALBANO STURA (CN)","I213":"SANT'ALESSIO CON VIALONE (PV)","I214":"SANT'ALESSIO IN ASPROMONTE (RC)","I215":"SANT'ALESSIO SICULO (ME)","I216":"SANT'ALFIO (CT)","I258":"SANT'AMBROGIO DI TORINO (TO)","I259":"SANT'AMBROGIO DI VALPOLICELLA (VR)","I256":"SANT'AMBROGIO SUL GARIGLIANO (FR)","I262":"SANT'ANASTASIA (NA)","I263":"SANT'ANATOLIA DI NARCO (PG)","I266":"SANT'ANDREA APOSTOLO DELLO IONIO (CZ)","I265":"SANT'ANDREA DEL GARIGLIANO (FR)","I264":"SANT'ANDREA DI CONZA (AV)","I271":"SANT'ANDREA FRIUS (CA)","I277":"SANT'ANGELO A CUPOLO (BN)","I278":"SANT'ANGELO A FASANELLA (SA)","I280":"SANT'ANGELO A SCALA (AV)","I279":"SANT'ANGELO ALL'ESCA (AV)","I273":"SANT'ANGELO D'ALIFE (CE)","I281":"SANT'ANGELO DEI LOMBARDI (AV)","I282":"SANT'ANGELO DEL PESCO (IS)","I283":"SANT'ANGELO DI BROLO (ME)","I275":"SANT'ANGELO DI PIOVE DI SACCO (PD)","I285":"SANT'ANGELO IN LIZZOLA (PU)","I286":"SANT'ANGELO IN PONTANO (MC)","I287":"SANT'ANGELO IN VADO (PU)","I288":"SANT'ANGELO LE FRATTE (PZ)","I289":"SANT'ANGELO LIMOSANO (CB)","I274":"SANT'ANGELO LODIGIANO (LO)","I276":"SANT'ANGELO LOMELLINA (PV)","I290":"SANT'ANGELO MUXARO (AG)","I284":"SANT'ANGELO ROMANO (RM)","M209":"SANT'ANNA ARRESI (CA)","I292":"SANT'ANNA D'ALFAEDO (VR)","I293":"SANT'ANTIMO (NA)","I294":"SANT'ANTIOCO (CA)","I296":"SANT'ANTONINO DI SUSA (TO)","I300":"SANT'ANTONIO ABATE (NA)","M276":"SANT'ANTONIO DI GALLURA (SS)","I302":"SANT'APOLLINARE (FR)","I305":"SANT'ARCANGELO (PZ)","I304":"SANTARCANGELO DI ROMAGNA (RN)","F557":"SANT'ARCANGELO TRIMONTE (BN)","I306":"SANT'ARPINO (CE)","I307":"SANT'ARSENIO (SA)","I326":"SANTE MARIE (AQ)","I318":"SANT'EGIDIO ALLA VIBRATA (TE)","I317":"SANT'EGIDIO DEL MONTE ALBINO (SA)","I319":"SANT'ELENA (PD)","B466":"SANT'ELENA SANNITA (IS)","I320":"SANT'ELIA A PIANISI (CB)","I321":"SANT'ELIA FIUMERAPIDO (FR)","I324":"SANT'ELPIDIO A MARE (AP)","I327":"SANTENA (TO)","I330":"SANTERAMO IN COLLE (BA)","I332":"SANT'EUFEMIA A MAIELLA (PE)","I333":"SANT'EUFEMIA D'ASPROMONTE (RC)","I335":"SANT'EUSANIO DEL SANGRO (CH)","I336":"SANT'EUSANIO FORCONESE (AQ)","I337":"SANTHIA' (VC)","I339":"SANTI COSMA E DAMIANO (LT)","I341":"SANT'ILARIO DELLO IONIO (RC)","I342":"SANT'ILARIO D'ENZA (RE)","I344":"SANT'IPPOLITO (PU)","I365":"SANTO STEFANO AL MARE (IM)","I367":"SANTO STEFANO BELBO (CN)","I368":"SANTO STEFANO D'AVETO (GE)","I357":"SANTO STEFANO DEL SOLE (AV)","C919":"SANTO STEFANO DI CADORE (BL)","I370":"SANTO STEFANO DI CAMASTRA (ME)","I363":"SANTO STEFANO DI MAGRA (SP)","I359":"SANTO STEFANO DI ROGLIANO (CS)","I360":"SANTO STEFANO DI SESSANIO (AQ)","I371":"SANTO STEFANO IN ASPROMONTE (RC)","I362":"SANTO STEFANO LODIGIANO (LO)","I356":"SANTO STEFANO QUISQUINA (AG)","I372":"SANTO STEFANO ROERO (CN)","I361":"SANTO STEFANO TICINO (MI)","I373":"SANTO STINO DI LIVENZA (VE)","I346":"SANT'OLCESE (GE)","I260":"SANTOMENNA (SA)","I348":"SANT'OMERO (TE)","I349":"SANT'OMOBONO IMAGNA (BG)","I350":"SANT'ONOFRIO (VV)","I351":"SANTOPADRE (FR)","I352":"SANT'ORESTE (RM)","I353":"SANTORSO (VI)","I354":"SANT'ORSOLA TERME (TN)","I374":"SANTU LUSSURGIU (OR)","I375":"SANT'URBANO (PD)","I410":"SANZA (SA)","I411":"SANZENO (TN)","I418":"SAONARA (PD)","I420":"SAPONARA (ME)","I421":"SAPPADA (BL)","I422":"SAPRI (SA)","I423":"SARACENA (CS)","I424":"SARACINESCO (RM)","I425":"SARCEDO (VI)","I426":"SARCONI (PZ)","I428":"SARDARA (CA)","I429":"SARDIGLIANO (AL)","I430":"SAREGO (VI)","I431":"SARENTINO .SARNTAL. (BZ)","I432":"SAREZZANO (AL)","I433":"SAREZZO (BS)","I434":"SARMATO (PC)","I435":"SARMEDE (TV)","I436":"SARNANO (MC)","I437":"SARNICO (BG)","I438":"SARNO (SA)","I439":"SARNONICO (TN)","I441":"SARONNO (VA)","I442":"SARRE (AO)","I443":"SARROCH (CA)","I444":"SARSINA (FC)","I445":"SARTEANO (SI)","I447":"SARTIRANA LOMELLINA (PV)","I448":"SARULE (NU)","I449":"SARZANA (SP)","I451":"SASSANO (SA)","I452":"SASSARI (SS)","I453":"SASSELLO (SV)","I454":"SASSETTA (LI)","I455":"SASSINORO (BN)","I457":"SASSO DI CASTALDA (PZ)","G972":"SASSO MARCONI (BO)","I459":"SASSOCORVARO (PU)","I460":"SASSOFELTRIO (PU)","I461":"SASSOFERRATO (AN)","I462":"SASSUOLO (MO)","I463":"SATRIANO (CZ)","G614":"SATRIANO DI LUCANIA (PZ)","I464":"SAURIS (UD)","I465":"SAUZE DI CESANA (TO)","I466":"SAUZE D'OULX (TO)","I467":"SAVA (TA)","I468":"SAVELLI (KR)","I469":"SAVIANO (NA)","I470":"SAVIGLIANO (CN)","I471":"SAVIGNANO IRPINO (AV)","I473":"SAVIGNANO SUL PANARO (MO)","I472":"SAVIGNANO SUL RUBICONE (FC)","I474":"SAVIGNO (BO)","I475":"SAVIGNONE (GE)","I476":"SAVIORE DELL'ADAMELLO (BS)","I477":"SAVOCA (ME)","I478":"SAVOGNA (UD)","I479":"SAVOGNA D'ISONZO (GO)","H730":"SAVOIA DI LUCANIA (PZ)","I480":"SAVONA (SV)","I482":"SCAFA (PE)","I483":"SCAFATI (SA)","I484":"SCAGNELLO (CN)","I486":"SCALA (SA)","I485":"SCALA COELI (CS)","I487":"SCALDASOLE (PV)","I489":"SCALEA (CS)","I490":"SCALENGHE (TO)","I492":"SCALETTA ZANCLEA (ME)","I493":"SCAMPITELLA (AV)","I494":"SCANDALE (KR)","I496":"SCANDIANO (RE)","B962":"SCANDICCI (FI)","I497":"SCANDOLARA RAVARA (CR)","I498":"SCANDOLARA RIPA D'OGLIO (CR)","I499":"SCANDRIGLIA (RI)","I501":"SCANNO (AQ)","I503":"SCANO DI MONTIFERRO (OR)","I504":"SCANSANO (GR)","M256":"SCANZANO JONICO (MT)","I506":"SCANZOROSCIATE (BG)","I507":"SCAPOLI (IS)","I510":"SCARLINO (GR)","I511":"SCARMAGNO (TO)","I512":"SCARNAFIGI (CN)","I514":"SCARPERIA (FI)","I519":"SCENA .SCHONNA. (BZ)","I520":"SCERNI (CH)","I522":"SCHEGGIA E PASCELUPO (PG)","I523":"SCHEGGINO (PG)","I526":"SCHIAVI DI ABRUZZO (CH)","I527":"SCHIAVON (VI)","I529":"SCHIGNANO (CO)","I530":"SCHILPARIO (BG)","I531":"SCHIO (VI)","I532":"SCHIVENOGLIA (MN)","I533":"SCIACCA (AG)","I534":"SCIARA (PA)","I535":"SCICLI (RG)","I536":"SCIDO (RC)","D290":"SCIGLIANO (CS)","I537":"SCILLA (RC)","I538":"SCILLATO (PA)","I539":"SCIOLZE (TO)","I540":"SCISCIANO (NA)","I541":"SCLAFANI BAGNI (PA)","I543":"SCONTRONE (AQ)","I544":"SCOPA (VC)","I545":"SCOPELLO (VC)","I546":"SCOPPITO (AQ)","I548":"SCORDIA (CT)","I549":"SCORRANO (LE)","I551":"SCORZE' (VE)","I553":"SCURCOLA MARSICANA (AQ)","I554":"SCURELLE (TN)","I555":"SCURZOLENGO (AT)","I556":"SEBORGA (IM)","I558":"SECINARO (AQ)","I559":"SECLI' (LE)","I561":"SECUGNAGO (LO)","I562":"SEDEGLIANO (UD)","I563":"SEDICO (BL)","I564":"SEDILO (OR)","I565":"SEDINI (SS)","I566":"SEDRIANO (MI)","I567":"SEDRINA (BG)","I569":"SEFRO (MC)","I570":"SEGARIU (CA)","I571":"SEGGIANO (GR)","I573":"SEGNI (RM)","I576":"SEGONZANO (TN)","I577":"SEGRATE (MI)","I578":"SEGUSINO (TV)","I580":"SELARGIUS (CA)","I581":"SELCI (RI)","I582":"SELEGAS (CA)","I585":"SELLANO (PG)","I588":"SELLERO (BS)","I589":"SELLIA (CZ)","I590":"SELLIA MARINA (CZ)","I593":"SELVA DEI MOLINI .MUHLWALD. (BZ)","I592":"SELVA DI CADORE (BL)","I594":"SELVA DI PROGNO (VR)","I591":"SELVA DI VAL GARDENA .WOLKENSTEIN IN GROEDEN. (BZ)","I595":"SELVAZZANO DENTRO (PD)","I596":"SELVE MARCONE (BI)","I597":"SELVINO (BG)","I598":"SEMESTENE (SS)","I599":"SEMIANA (PV)","I600":"SEMINARA (RC)","I601":"SEMPRONIANO (GR)","I602":"SENAGO (MI)","I604":"SENALES .SCHNALS. (BZ)","I603":"SENALE-SAN FELICE .UNSERE LIEBE FRAU IM WALD. (BZ)","I605":"SENEGHE (OR)","I606":"SENERCHIA (AV)","I607":"SENIGA (BS)","I608":"SENIGALLIA (AN)","I609":"SENIS (OR)","I610":"SENISE (PZ)","I611":"SENNA COMASCO (CO)","I612":"SENNA LODIGIANA (LO)","I613":"SENNARIOLO (OR)","I614":"SENNORI (SS)","I615":"SENORBI' (CA)","I618":"SEPINO (CB)","I619":"SEPPIANA (VB)","I621":"SEQUALS (PN)","I622":"SERAVEZZA (LU)","I624":"SERDIANA (CA)","I625":"SEREGNO (MI)","I626":"SEREN DEL GRAPPA (BL)","I627":"SERGNANO (CR)","I628":"SERIATE (BG)","I629":"SERINA (BG)","I630":"SERINO (AV)","I631":"SERLE (BS)","I632":"SERMIDE (MN)","I634":"SERMONETA (LT)","I635":"SERNAGLIA DELLA BATTAGLIA (TV)","I636":"SERNIO (SO)","I637":"SEROLE (AT)","I642":"SERRA D'AIELLO (CS)","I643":"SERRA DE' CONTI (AN)","I650":"SERRA PEDACE (CS)","I640":"SERRA RICCO' (GE)","I639":"SERRA SAN BRUNO (VV)","I653":"SERRA SAN QUIRICO (AN)","I654":"SERRA SANT'ABBONDIO (PU)","I641":"SERRACAPRIOLA (FG)","I644":"SERRADIFALCO (CL)","I646":"SERRALUNGA D'ALBA (CN)","I645":"SERRALUNGA DI CREA (AL)","I647":"SERRAMANNA (CA)","F357":"SERRAMAZZONI (MO)","I648":"SERRAMEZZANA (SA)","I649":"SERRAMONACESCA (PE)","I651":"SERRAPETRONA (MC)","I652":"SERRARA FONTANA (NA)","I655":"SERRASTRETTA (CZ)","I656":"SERRATA (RC)","I662":"SERRAVALLE A PO (MN)","I661":"SERRAVALLE DI CHIENTI (MC)","I659":"SERRAVALLE LANGHE (CN)","I660":"SERRAVALLE PISTOIESE (PT)","I657":"SERRAVALLE SCRIVIA (AL)","I663":"SERRAVALLE SESIA (VC)","I666":"SERRE (SA)","I667":"SERRENTI (CA)","I668":"SERRI (NU)","I669":"SERRONE (FR)","I670":"SERRUNGARINA (PU)","I671":"SERSALE (CZ)","C070":"SERVIGLIANO (AP)","I676":"SESSA AURUNCA (CE)","I677":"SESSA CILENTO (SA)","I678":"SESSAME (AT)","I679":"SESSANO DEL MOLISE (IS)","E070":"SESTA GODANO (SP)","I681":"SESTINO (AR)","I687":"SESTO .SEXTEN. (BZ)","I686":"SESTO AL REGHENA (PN)","I688":"SESTO CALENDE (VA)","I682":"SESTO CAMPANO (IS)","I683":"SESTO ED UNITI (CR)","I684":"SESTO FIORENTINO (FI)","I690":"SESTO SAN GIOVANNI (MI)","I689":"SESTOLA (MO)","I693":"SESTRI LEVANTE (GE)","I692":"SESTRIERE (TO)","I695":"SESTU (CA)","I696":"SETTALA (MI)","I697":"SETTEFRATI (FR)","I698":"SETTIME (AT)","I700":"SETTIMO MILANESE (MI)","I701":"SETTIMO ROTTARO (TO)","I699":"SETTIMO SAN PIETRO (CA)","I703":"SETTIMO TORINESE (TO)","I702":"SETTIMO VITTONE (TO)","I704":"SETTINGIANO (CZ)","I705":"SETZU (CA)","I706":"SEUI (NU)","I707":"SEULO (NU)","I709":"SEVESO (MI)","I711":"SEZZADIO (AL)","I712":"SEZZE (LT)","I714":"SFRUZ (TN)","I715":"SGONICO (TS)","I716":"SGURGOLA (FR)","I717":"SIAMAGGIORE (OR)","I718":"SIAMANNA (OR)","I720":"SIANO (SA)","I721":"SIAPICCIA (OR)","M253":"SICIGNANO DEGLI ALBURNI (SA)","I723":"SICULIANA (AG)","I724":"SIDDI (CA)","I725":"SIDERNO (RC)","I726":"SIENA (SI)","I727":"SIGILLO (PG)","I728":"SIGNA (FI)","I729":"SILANDRO .SCHLANDERS. (BZ)","I730":"SILANUS (NU)","F116":"SILEA (TV)","I732":"SILIGO (SS)","I734":"SILIQUA (CA)","I735":"SILIUS (CA)","I737":"SILLANO (LU)","I736":"SILLAVENGO (NO)","I738":"SILVANO D'ORBA (AL)","I739":"SILVANO PIETRA (PV)","I741":"SILVI (TE)","I742":"SIMALA (OR)","I743":"SIMAXIS (OR)","I744":"SIMBARIO (VV)","I745":"SIMERI CRICHI (CZ)","I747":"SINAGRA (ME)","A468":"SINALUNGA (SI)","I748":"SINDIA (NU)","I749":"SINI (OR)","I750":"SINIO (CN)","I751":"SINISCOLA (NU)","I752":"SINNAI (CA)","I753":"SINOPOLI (RC)","I754":"SIRACUSA (SR)","I756":"SIRIGNANO (AV)","I757":"SIRIS (OR)","I633":"SIRMIONE (BS)","I758":"SIROLO (AN)","I759":"SIRONE (LC)","I760":"SIROR (TN)","I761":"SIRTORI (LC)","I763":"SISSA (PR)","I765":"SIURGUS DONIGALA (CA)","E265":"SIZIANO (PV)","I767":"SIZZANO (NO)","I771":"SLUDERNO .SCHLUDERNS. (BZ)","I772":"SMARANO (TN)","I774":"SMERILLO (AP)","I775":"SOAVE (VR)","I777":"SOCCHIEVE (UD)","I778":"SODDI' (OR)","I779":"SOGLIANO AL RUBICONE (FC)","I780":"SOGLIANO CAVOUR (LE)","I781":"SOGLIO (AT)","I782":"SOIANO DEL LAGO (BS)","I783":"SOLAGNA (VI)","I785":"SOLARINO (SR)","I786":"SOLARO (MI)","I787":"SOLAROLO (RA)","I790":"SOLAROLO RAINERIO (CR)","I791":"SOLARUSSA (OR)","I792":"SOLBIATE (CO)","I793":"SOLBIATE ARNO (VA)","I794":"SOLBIATE OLONA (VA)","I796":"SOLDANO (IM)","I797":"SOLEMINIS (CA)","I798":"SOLERO (AL)","I799":"SOLESINO (PD)","I800":"SOLETO (LE)","I801":"SOLFERINO (MN)","I802":"SOLIERA (MO)","I803":"SOLIGNANO (PR)","I805":"SOLOFRA (AV)","I808":"SOLONGHELLO (AL)","I809":"SOLOPACA (BN)","I812":"SOLTO COLLINA (BG)","I813":"SOLZA (BG)","I815":"SOMAGLIA (LO)","I817":"SOMANO (CN)","I819":"SOMMA LOMBARDO (VA)","I820":"SOMMA VESUVIANA (NA)","I821":"SOMMACAMPAGNA (VR)","I822":"SOMMARIVA DEL BOSCO (CN)","I823":"SOMMARIVA PERNO (CN)","I824":"SOMMATINO (CL)","I825":"SOMMO (PV)","I826":"SONA (VR)","I827":"SONCINO (CR)","I828":"SONDALO (SO)","I829":"SONDRIO (SO)","I830":"SONGAVAZZO (BG)","I831":"SONICO (BS)","I832":"SONNINO (LT)","I835":"SOPRANA (BI)","I838":"SORA (FR)","I839":"SORAGA (TN)","I840":"SORAGNA (PR)","I841":"SORANO (GR)","I844":"SORBO SAN BASILE (CZ)","I843":"SORBO SERPICO (AV)","I845":"SORBOLO (PR)","I847":"SORDEVOLO (BI)","I848":"SORDIO (LO)","I849":"SORESINA (CR)","I850":"SORGA' (VR)","I851":"SORGONO (NU)","I852":"SORI (GE)","I853":"SORIANELLO (VV)","I854":"SORIANO CALABRO (VV)","I855":"SORIANO NEL CIMINO (VT)","I856":"SORICO (CO)","I857":"SORISO (NO)","I858":"SORISOLE (BG)","I860":"SORMANO (CO)","I861":"SORRADILE (OR)","I862":"SORRENTO (NA)","I863":"SORSO (SS)","I864":"SORTINO (SR)","I865":"SOSPIRO (CR)","I866":"SOSPIROLO (BL)","I867":"SOSSANO (VI)","I868":"SOSTEGNO (BI)","I869":"SOTTO IL MONTE GIOVANNI XXIII (BG)","I871":"SOVER (TN)","I872":"SOVERATO (CZ)","I873":"SOVERE (BG)","I874":"SOVERIA MANNELLI (CZ)","I875":"SOVERIA SIMERI (CZ)","I876":"SOVERZENE (BL)","I877":"SOVICILLE (SI)","I878":"SOVICO (MI)","I879":"SOVIZZO (VI)","I673":"SOVRAMONTE (BL)","I880":"SOZZAGO (NO)","I881":"SPADAFORA (ME)","I884":"SPADOLA (VV)","I885":"SPARANISE (CE)","I886":"SPARONE (TO)","I887":"SPECCHIA (LE)","I888":"SPELLO (PG)","I889":"SPERA (TN)","I891":"SPERLINGA (EN)","I892":"SPERLONGA (LT)","I893":"SPERONE (AV)","I894":"SPESSA (PV)","I895":"SPEZZANO ALBANESE (CS)","I896":"SPEZZANO DELLA SILA (CS)","I898":"SPEZZANO PICCOLO (CS)","I899":"SPIAZZO (TN)","I901":"SPIGNO MONFERRATO (AL)","I902":"SPIGNO SATURNIA (LT)","I903":"SPILAMBERTO (MO)","I904":"SPILIMBERGO (PN)","I905":"SPILINGA (VV)","I906":"SPINADESCO (CR)","I907":"SPINAZZOLA (BA)","I908":"SPINEA (VE)","I909":"SPINEDA (CR)","I910":"SPINETE (CB)","I911":"SPINETO SCRIVIA (AL)","I912":"SPINETOLI (AP)","I914":"SPINO D'ADDA (CR)","I916":"SPINONE AL LAGO (BG)","I917":"SPINOSO (PZ)","I919":"SPIRANO (BG)","I921":"SPOLETO (PG)","I922":"SPOLTORE (PE)","I923":"SPONGANO (LE)","I924":"SPORMAGGIORE (TN)","I925":"SPORMINORE (TN)","I926":"SPOTORNO (SV)","I927":"SPRESIANO (TV)","I928":"SPRIANA (SO)","I929":"SQUILLACE (CZ)","I930":"SQUINZANO (LE)","I932":"STAFFOLO (AN)","I935":"STAGNO LOMBARDO (CR)","I936":"STAITI (RC)","I937":"STALETTI (CZ)","I938":"STANGHELLA (PD)","I939":"STARANZANO (GO)","M298":"STATTE (TA)","I941":"STAZZANO (AL)","I942":"STAZZEMA (LU)","I943":"STAZZONA (CO)","I945":"STEFANACONI (VV)","I946":"STELLA (SV)","G887":"STELLA CILENTO (SA)","I947":"STELLANELLO (SV)","I948":"STELVIO .STILFS. (BZ)","I949":"STENICO (TN)","I950":"STERNATIA (LE)","I951":"STEZZANO (BG)","I952":"STIA (AR)","I953":"STIENTA (RO)","I954":"STIGLIANO (MT)","I955":"STIGNANO (RC)","I956":"STILO (RC)","I959":"STIMIGLIANO (RI)","M290":"STINTINO (SS)","I960":"STIO (SA)","I962":"STORNARA (FG)","I963":"STORNARELLA (FG)","I964":"STORO (TN)","I965":"STRA (VE)","I968":"STRADELLA (PV)","I969":"STRAMBINELLO (TO)","I970":"STRAMBINO (TO)","I973":"STRANGOLAGALLI (FR)","I974":"STREGNA (UD)","I975":"STREMBO (TN)","I976":"STRESA (VB)","I977":"STREVI (AL)","I978":"STRIANO (NA)","I979":"STRIGNO (TN)","I980":"STRONA (BI)","I981":"STRONCONE (TR)","I982":"STRONGOLI (KR)","I984":"STROPPIANA (VC)","I985":"STROPPO (CN)","I986":"STROZZA (BG)","I990":"STURNO (AV)","B014":"SUARDI (PV)","I991":"SUBBIANO (AR)","I992":"SUBIACO (RM)","I993":"SUCCIVO (CE)","I994":"SUEGLIO (LC)","I995":"SUELLI (CA)","I996":"SUELLO (LC)","I997":"SUISIO (BG)","I998":"SULBIATE (MI)","I804":"SULMONA (AQ)","L002":"SULZANO (BS)","L003":"SUMIRAGO (VA)","L004":"SUMMONTE (AV)","L006":"SUNI (NU)","L007":"SUNO (NO)","L008":"SUPERSANO (LE)","L009":"SUPINO (FR)","L010":"SURANO (LE)","L011":"SURBO (LE)","L013":"SUSA (TO)","L014":"SUSEGANA (TV)","L015":"SUSTINENTE (MN)","L016":"SUTERA (CL)","L017":"SUTRI (VT)","L018":"SUTRIO (UD)","L019":"SUVERETO (LI)","L020":"SUZZARA (MN)","L022":"TACENO (LC)","L023":"TADASUNI (OR)","L024":"TAGGIA (IM)","L025":"TAGLIACOZZO (AQ)","L026":"TAGLIO DI PO (RO)","L027":"TAGLIOLO MONFERRATO (AL)","L030":"TAIBON AGORDINO (BL)","L032":"TAINO (VA)","L033":"TAIO (TN)","G736":"TAIPANA (UD)","L034":"TALAMELLO (PU)","L035":"TALAMONA (SO)","L036":"TALANA (NU)","L037":"TALEGGIO (BG)","L038":"TALLA (AR)","L039":"TALMASSONS (UD)","L040":"TAMBRE (BL)","L042":"TAORMINA (ME)","L044":"TAPOGLIANO (UD)","L046":"TARANO (RI)","L047":"TARANTA PELIGNA (CH)","L048":"TARANTASCA (CN)","L049":"TARANTO (TA)","L050":"TARCENTO (UD)","D024":"TARQUINIA (VT)","L055":"TARSIA (CS)","L056":"TARTANO (SO)","L057":"TARVISIO (UD)","L058":"TARZO (TV)","L059":"TASSAROLO (AL)","L060":"TASSULLO (TN)","L061":"TAURANO (AV)","L062":"TAURASI (AV)","L063":"TAURIANOVA (RC)","L064":"TAURISANO (LE)","L065":"TAVAGNACCO (UD)","L066":"TAVAGNASCO (TO)","L067":"TAVARNELLE VAL DI PESA (FI)","F260":"TAVAZZANO CON VILLAVESCO (LO)","L069":"TAVENNA (CB)","L070":"TAVERNA (CZ)","L071":"TAVERNERIO (CO)","L073":"TAVERNOLA BERGAMASCA (BG)","C698":"TAVERNOLE SUL MELLA (BS)","L074":"TAVIANO (LE)","L075":"TAVIGLIANO (BI)","L078":"TAVOLETO (PU)","L081":"TAVULLIA (PU)","L082":"TEANA (PZ)","L083":"TEANO (CE)","D292":"TEGGIANO (SA)","L084":"TEGLIO (SO)","L085":"TEGLIO VENETO (VE)","L086":"TELESE TERME (BN)","L087":"TELGATE (BG)","L088":"TELTI (SS)","L089":"TELVE (TN)","L090":"TELVE DI SOPRA (TN)","L093":"TEMPIO PAUSANIA (SS)","L094":"TEMU' (BS)","L096":"TENNA (TN)","L097":"TENNO (TN)","L100":"TEOLO (PD)","L101":"TEOR (UD)","L102":"TEORA (AV)","L103":"TERAMO (TE)","L104":"TERDOBBIATE (NO)","L105":"TERELLE (FR)","L106":"TERENTO .TERENTEN. (BZ)","E548":"TERENZO (PR)","M282":"TERGU (SS)","L107":"TERLAGO (TN)","L108":"TERLANO .TERLAN. (BZ)","L109":"TERLIZZI (BA)","M210":"TERME VIGLIATORE (ME)","L111":"TERMENO SULLA STRADA DEL VINO .TRAMIN AN DER. (BZ)","L112":"TERMINI IMERESE (PA)","L113":"TERMOLI (CB)","L115":"TERNATE (VA)","L116":"TERNENGO (BI)","L117":"TERNI (TR)","L118":"TERNO D'ISOLA (BG)","L120":"TERRACINA (LT)","L121":"TERRAGNOLO (TN)","L122":"TERRALBA (OR)","L124":"TERRANOVA DA SIBARI (CS)","L125":"TERRANOVA DEI PASSERINI (LO)","L126":"TERRANOVA DI POLLINO (PZ)","L127":"TERRANOVA SAPPO MINULIO (RC)","L123":"TERRANUOVA BRACCIOLINI (AR)","L131":"TERRASINI (PA)","L132":"TERRASSA PADOVANA (PD)","L134":"TERRAVECCHIA (CS)","L136":"TERRAZZO (VR)","L137":"TERRES (TN)","L138":"TERRICCIOLA (PI)","L139":"TERRUGGIA (AL)","L140":"TERTENIA (NU)","L142":"TERZIGNO (NA)","L143":"TERZO (AL)","L144":"TERZO DI AQUILEIA (UD)","L145":"TERZOLAS (TN)","L146":"TERZORIO (IM)","L147":"TESERO (TN)","L149":"TESIMO .TISENS. (BZ)","L150":"TESSENNANO (VT)","L152":"TESTICO (SV)","L153":"TETI (NU)","L154":"TEULADA (CA)","L155":"TEVEROLA (CE)","L156":"TEZZE SUL BRENTA (VI)","L157":"THIENE (VI)","L158":"THIESI (SS)","L160":"TIANA (NU)","L162":"TIARNO DI SOPRA (TN)","L163":"TIARNO DI SOTTO (TN)","L164":"TICENGO (CR)","L165":"TICINETO (AL)","L166":"TIGGIANO (LE)","L167":"TIGLIETO (GE)","L168":"TIGLIOLE (AT)","L169":"TIGNALE (BS)","L172":"TINNURA (NU)","L173":"TIONE DEGLI ABRUZZI (AQ)","L174":"TIONE DI TRENTO (TN)","L175":"TIRANO (SO)","L176":"TIRES .TIERS. (BZ)","L177":"TIRIOLO (CZ)","L178":"TIROLO .TIROL. (BZ)","L180":"TISSI (SS)","L181":"TITO (PZ)","L182":"TIVOLI (RM)","L183":"TIZZANO VAL PARMA (PR)","L184":"TOANO (RE)","L185":"TOCCO CAUDIO (BN)","L186":"TOCCO DA CASAURIA (PE)","L187":"TOCENO (VB)","L188":"TODI (PG)","L189":"TOFFIA (RI)","L190":"TOIRANO (SV)","L191":"TOLENTINO (MC)","L192":"TOLFA (RM)","L193":"TOLLEGNO (BI)","L194":"TOLLO (CH)","L195":"TOLMEZZO (UD)","L197":"TOLVE (PZ)","L199":"TOMBOLO (PD)","L200":"TON (TN)","L201":"TONADICO (TN)","L202":"TONARA (NU)","L203":"TONCO (AT)","L204":"TONENGO (AT)","D717":"TONEZZA DEL CIMONE (VI)","L205":"TORA E PICCILLI (CE)","L206":"TORANO CASTELLO (CS)","L207":"TORANO NUOVO (TE)","L210":"TORBOLE CASAGLIA (BS)","L211":"TORCEGNO (TN)","L212":"TORCHIARA (SA)","L213":"TORCHIAROLO (BR)","L214":"TORELLA DEI LOMBARDI (AV)","L215":"TORELLA DEL SANNIO (CB)","L216":"TORGIANO (PG)","L217":"TORGNON (AO)","L219":"TORINO (TO)","L218":"TORINO DI SANGRO (CH)","L220":"TORITTO (BA)","L221":"TORLINO VIMERCATI (CR)","L223":"TORNACO (NO)","L224":"TORNARECCIO (CH)","L225":"TORNATA (CR)","L227":"TORNIMPARTE (AQ)","L228":"TORNO (CO)","L229":"TORNOLO (PR)","L230":"TORO (CB)","L231":"TORPE' (NU)","L233":"TORRACA (SA)","L235":"TORRALBA (SS)","L237":"TORRAZZA COSTE (PV)","L238":"TORRAZZA PIEMONTE (TO)","L239":"TORRAZZO (BI)","L245":"TORRE ANNUNZIATA (NA)","L250":"TORRE BERETTI E CASTELLARO (PV)","L251":"TORRE BOLDONE (BG)","L252":"TORRE BORMIDA (CN)","L243":"TORRE CAJETANI (FR)","L247":"TORRE CANAVESE (TO)","L256":"TORRE D'ARESE (PV)","L257":"TORRE DE' BUSI (LC)","L262":"TORRE DE' NEGRI (PV)","L263":"TORRE DE' PASSERI (PE)","L258":"TORRE DE' PICENARDI (CR)","L265":"TORRE DE' ROVERI (BG)","L259":"TORRE DEL GRECO (NA)","L267":"TORRE DI MOSTO (VE)","L240":"TORRE DI RUGGIERO (CZ)","L244":"TORRE DI SANTA MARIA (SO)","L269":"TORRE D'ISOLA (PV)","L272":"TORRE LE NOCELLE (AV)","L241":"TORRE MONDOVI' (CN)","L274":"TORRE ORSAIA (SA)","L276":"TORRE PALLAVICINA (BG)","L277":"TORRE PELLICE (TO)","L278":"TORRE SAN GIORGIO (CN)","L279":"TORRE SAN PATRIZIO (AP)","L280":"TORRE SANTA SUSANNA (BR)","L246":"TORREANO (UD)","L248":"TORREBELVICINO (VI)","L253":"TORREBRUNA (CH)","L254":"TORRECUSO (BN)","L270":"TORREGLIA (PD)","L271":"TORREGROTTA (ME)","L273":"TORREMAGGIORE (FG)","M286":"TORRENOVA (ME)","L281":"TORRESINA (CN)","L282":"TORRETTA (PA)","L285":"TORREVECCHIA PIA (PV)","L284":"TORREVECCHIA TEATINA (CH)","L287":"TORRI DEL BENACO (VR)","L297":"TORRI DI QUARTESOLO (VI)","L286":"TORRI IN SABINA (RI)","I550":"TORRIANA (RN)","L290":"TORRICE (FR)","L294":"TORRICELLA (TA)","L296":"TORRICELLA DEL PIZZO (CR)","L293":"TORRICELLA IN SABINA (RI)","L291":"TORRICELLA PELIGNA (CH)","L295":"TORRICELLA SICURA (TE)","L292":"TORRICELLA VERZATE (PV)","L298":"TORRIGLIA (GE)","L299":"TORRILE (PR)","L301":"TORRIONI (AV)","L303":"TORRITA DI SIENA (SI)","L302":"TORRITA TIBERINA (RM)","A355":"TORTOLI' (NU)","L304":"TORTONA (AL)","L305":"TORTORA (CS)","L306":"TORTORELLA (SA)","L307":"TORTORETO (TE)","L308":"TORTORICI (ME)","L309":"TORVISCOSA (UD)","L312":"TOSCOLANO-MADERNO (BS)","L314":"TOSSICIA (TE)","L316":"TOVO DI SANT'AGATA (SO)","L315":"TOVO SAN GIACOMO (SV)","L317":"TRABIA (PA)","L319":"TRADATE (VA)","L321":"TRAMATZA (OR)","L322":"TRAMBILENO (TN)","L323":"TRAMONTI (SA)","L324":"TRAMONTI DI SOPRA (PN)","L325":"TRAMONTI DI SOTTO (PN)","L326":"TRAMUTOLA (PZ)","L327":"TRANA (TO)","L328":"TRANI (BA)","L329":"TRANSACQUA (TN)","L330":"TRAONA (SO)","L331":"TRAPANI (TP)","L332":"TRAPPETO (PA)","L333":"TRAREGO VIGGIONA (VB)","L334":"TRASACCO (AQ)","L335":"TRASAGHIS (UD)","L336":"TRASQUERA (VB)","L337":"TRATALIAS (CA)","L338":"TRAUSELLA (TO)","I236":"TRAVACO' SICCOMARIO (PV)","L339":"TRAVAGLIATO (BS)","L342":"TRAVEDONA-MONATE (VA)","L345":"TRAVERSELLA (TO)","L346":"TRAVERSETOLO (PR)","L340":"TRAVES (TO)","L347":"TRAVESIO (PN)","L348":"TRAVO (PC)","L349":"TREBASELEGHE (PD)","L353":"TREBISACCE (CS)","L354":"TRECASALI (PR)","M280":"TRECASE (NA)","L355":"TRECASTAGNI (CT)","L356":"TRECATE (NO)","L357":"TRECCHINA (PZ)","L359":"TRECENTA (RO)","L361":"TREDOZIO (FC)","L363":"TREGLIO (CH)","L364":"TREGNAGO (VR)","L366":"TREIA (MC)","L367":"TREISO (CN)","L368":"TREMENICO (LC)","L369":"TREMESTIERI ETNEO (CT)","L371":"TREMEZZO (CO)","L372":"TREMOSINE (BS)","L375":"TRENTA (CS)","L377":"TRENTINARA (SA)","L378":"TRENTO (TN)","L379":"TRENTOLA DUCENTA (CE)","L380":"TRENZANO (BS)","L381":"TREPPO CARNICO (UD)","L382":"TREPPO GRANDE (UD)","L383":"TREPUZZI (LE)","L384":"TREQUANDA (SI)","L385":"TRES (TN)","L386":"TRESANA (MS)","L388":"TRESCORE BALNEARIO (BG)","L389":"TRESCORE CREMASCO (CR)","L390":"TRESIGALLO (FE)","L392":"TRESIVIO (SO)","L393":"TRESNURAGHES (OR)","L396":"TREVENZUOLO (VR)","L397":"TREVI (PG)","L398":"TREVI NEL LAZIO (FR)","L399":"TREVICO (AV)","L400":"TREVIGLIO (BG)","L402":"TREVIGNANO (TV)","L401":"TREVIGNANO ROMANO (RM)","L403":"TREVILLE (AL)","L404":"TREVIOLO (BG)","L407":"TREVISO (TV)","L406":"TREVISO BRESCIANO (BS)","L408":"TREZZANO ROSA (MI)","L409":"TREZZANO SUL NAVIGLIO (MI)","L411":"TREZZO SULL'ADDA (MI)","L410":"TREZZO TINELLA (CN)","L413":"TREZZONE (CO)","L414":"TRIBANO (PD)","L415":"TRIBIANO (MI)","L416":"TRIBOGNA (GE)","L418":"TRICARICO (MT)","L419":"TRICASE (LE)","L420":"TRICERRO (VC)","L421":"TRICESIMO (UD)","L422":"TRICHIANA (BL)","L423":"TRIEI (NU)","L424":"TRIESTE (TS)","L425":"TRIGGIANO (BA)","L426":"TRIGOLO (CR)","L427":"TRINITA' (CN)","L428":"TRINITA' D'AGULTU E VIGNOLA (SS)","B915":"TRINITAPOLI (FG)","L429":"TRINO VERCELLESE (VC)","L430":"TRIORA (IM)","L431":"TRIPI (ME)","L432":"TRISOBBIO (AL)","L433":"TRISSINO (VI)","L434":"TRIUGGIO (MI)","L435":"TRIVENTO (CB)","L436":"TRIVERO (BI)","L437":"TRIVIGLIANO (FR)","L438":"TRIVIGNANO UDINESE (UD)","L439":"TRIVIGNO (PZ)","L440":"TRIVOLZIO (PV)","L444":"TRODENA .TRUDEN. (BZ)","L445":"TROFARELLO (TO)","L447":"TROIA (FG)","L448":"TROINA (EN)","L449":"TROMELLO (PV)","L450":"TRONTANO (VB)","A705":"TRONZANO LAGO MAGGIORE (VA)","L451":"TRONZANO VERCELLESE (VC)","L452":"TROPEA (VV)","L453":"TROVO (PV)","L454":"TRUCCAZZANO (MI)","L455":"TUBRE .TAUFERS IN MUNSTERTHAL. (BZ)","L457":"TUENNO (TN)","L458":"TUFARA (CB)","L459":"TUFILLO (CH)","L460":"TUFINO (NA)","L461":"TUFO (AV)","L462":"TUGLIE (LE)","L463":"TUILI (CA)","L464":"TULA (SS)","L466":"TUORO SUL TRASIMENO (PG)","G507":"TURANIA (RI)","L469":"TURANO LODIGIANO (LO)","L470":"TURATE (CO)","L471":"TURBIGO (MI)","L472":"TURI (BA)","L473":"TURRI (CA)","L474":"TURRIACO (GO)","L475":"TURRIVALIGNANI (PE)","L477":"TURSI (MT)","L478":"TUSA (ME)","L310":"TUSCANIA (VT)","C789":"UBIALE CLANEZZO (BG)","L480":"UBOLDO (VA)","L482":"UCRIA (ME)","L483":"UDINE (UD)","L484":"UGENTO (LE)","L485":"UGGIANO LA CHIESA (LE)","L487":"UGGIATE-TREVANO (CO)","L488":"ULA' TIRSO (OR)","L489":"ULASSAI (NU)","L490":"ULTIMO .ULTEN. (BZ)","D786":"UMBERTIDE (PG)","L492":"UMBRIATICO (KR)","L494":"URAGO D'OGLIO (BS)","L496":"URAS (OR)","L497":"URBANA (PD)","L498":"URBANIA (PU)","L499":"URBE (SV)","L500":"URBINO (PU)","L501":"URBISAGLIA (MC)","L502":"URGNANO (BG)","L503":"URI (SS)","L505":"URURI (CB)","L506":"URZULEI (NU)","L507":"USCIO (GE)","L508":"USELLUS (OR)","L509":"USINI (SS)","L511":"USMATE VELATE (MI)","L512":"USSANA (CA)","L513":"USSARAMANNA (CA)","L514":"USSASSAI (NU)","L515":"USSEAUX (TO)","L516":"USSEGLIO (TO)","L517":"USSITA (MC)","L519":"USTICA (PA)","L521":"UTA (CA)","L522":"UZZANO (PT)","L524":"VACCARIZZO ALBANESE (CS)","L525":"VACONE (RI)","L526":"VACRI (CH)","L527":"VADENA .PFATTEN. (BZ)","L528":"VADO LIGURE (SV)","L533":"VAGLI SOTTO (LU)","L529":"VAGLIA (FI)","L532":"VAGLIO BASILICATA (PZ)","L531":"VAGLIO SERRA (AT)","L537":"VAIANO (PO)","L535":"VAIANO CREMASCO (CR)","L538":"VAIE (TO)","L539":"VAILATE (CR)","L540":"VAIRANO PATENORA (CE)","M265":"VAJONT (PN)","L555":"VAL DELLA TORRE (TO)","L562":"VAL DI NIZZA (PV)","L564":"VAL DI VIZZE .PFITSCH. (BZ)","L638":"VAL MASINO (SO)","H259":"VAL REZZO (CO)","L544":"VALBONDIONE (BG)","L545":"VALBREMBO (BG)","L546":"VALBREVENNA (GE)","L547":"VALBRONA (CO)","L550":"VALDA (TN)","L551":"VALDAGNO (VI)","L552":"VALDAORA .OLANG. (BZ)","L554":"VALDASTICO (VI)","L556":"VALDENGO (BI)","G319":"VALDERICE (TP)","L557":"VALDIDENTRO (SO)","L558":"VALDIERI (CN)","L561":"VALDINA (ME)","L563":"VALDISOTTO (SO)","L565":"VALDOBBIADENE (TV)","L566":"VALDUGGIA (VC)","L568":"VALEGGIO (PV)","L567":"VALEGGIO SUL MINCIO (VR)","L569":"VALENTANO (VT)","L570":"VALENZA (AL)","L571":"VALENZANO (BA)","L572":"VALERA FRATTA (LO)","L573":"VALFABBRICA (PG)","L574":"VALFENERA (AT)","L575":"VALFLORIANA (TN)","L576":"VALFURVA (SO)","L577":"VALGANNA (VA)","L578":"VALGIOIE (TO)","L579":"VALGOGLIO (BG)","L580":"VALGRANA (CN)","L581":"VALGREGHENTINO (LC)","L582":"VALGRISENCHE (AO)","L583":"VALGUARNERA CAROPEPE (EN)","L584":"VALLADA AGORDINA (BL)","L586":"VALLANZENGO (BI)","L588":"VALLARSA (TN)","L589":"VALLATA (AV)","L594":"VALLE AGRICOLA (CE)","L595":"VALLE AURINA .AHRNTAL. (BZ)","L597":"VALLE CASTELLANA (TE)","G540":"VALLE DELL'ANGELO (SA)","L590":"VALLE DI CADORE (BL)","L601":"VALLE DI CASIES .GSIES. (BZ)","L591":"VALLE DI MADDALONI (CE)","L593":"VALLE LOMELLINA (PV)","L606":"VALLE MOSSO (BI)","L617":"VALLE SALIMBENE (PV)","L620":"VALLE SAN NICOLAO (BI)","L596":"VALLEBONA (IM)","L598":"VALLECORSA (FR)","L599":"VALLECROSIA (IM)","L603":"VALLEDOLMO (PA)","L604":"VALLEDORIA (SS)","I322":"VALLEFIORITA (CZ)","L607":"VALLELONGA (VV)","L609":"VALLELUNGA PRATAMENO (CL)","L605":"VALLEMAIO (FR)","L611":"VALLEPIETRA (RM)","L612":"VALLERANO (VT)","L613":"VALLERMOSA (CA)","L614":"VALLEROTONDA (FR)","L616":"VALLESACCARDA (AV)","L623":"VALLEVE (BG)","L624":"VALLI DEL PASUBIO (VI)","L625":"VALLINFREDA (RM)","L626":"VALLIO TERME (BS)","L628":"VALLO DELLA LUCANIA (SA)","L627":"VALLO DI NERA (PG)","L629":"VALLO TORINESE (TO)","L631":"VALLORIATE (CN)","L633":"VALMACCA (AL)","L634":"VALMADRERA (LC)","L636":"VALMALA (CN)","L639":"VALMONTONE (RM)","L640":"VALMOREA (CO)","L641":"VALMOZZOLA (PR)","L642":"VALNEGRA (BG)","L643":"VALPELLINE (AO)","L644":"VALPERGA (TO)","B510":"VALPRATO SOANA (TO)","L647":"VALSAVARENCHE (AO)","L649":"VALSECCA (BG)","D513":"VALSINNI (MT)","C936":"VALSOLDA (CO)","L650":"VALSTAGNA (VI)","L651":"VALSTRONA (VB)","L653":"VALTOPINA (PG)","L655":"VALTORTA (BG)","L654":"VALTOURNENCHE (AO)","L656":"VALVA (SA)","L657":"VALVASONE (PN)","L658":"VALVERDE (CT)","L659":"VALVERDE (PV)","L468":"VALVESTINO (BS)","L660":"VANDOIES .VINTL. (BZ)","L664":"VANZAGHELLO (MI)","L665":"VANZAGO (MI)","L666":"VANZONE CON SAN CARLO (VB)","L667":"VAPRIO D'ADDA (MI)","L668":"VAPRIO D'AGOGNA (NO)","L669":"VARALLO (VC)","L670":"VARALLO POMBIA (NO)","L671":"VARANO BORGHI (VA)","L672":"VARANO DE' MELEGARI (PR)","L673":"VARAPODIO (RC)","L675":"VARAZZE (SV)","L676":"VARCO SABINO (RI)","L677":"VAREDO (MI)","L678":"VARENA (TN)","L680":"VARENNA (LC)","L682":"VARESE (VA)","L681":"VARESE LIGURE (SP)","L685":"VARISELLA (TO)","L686":"VARMO (UD)","L687":"VARNA .VAHRN. (BZ)","L689":"VARSI (PR)","L690":"VARZI (PV)","L691":"VARZO (VB)","L692":"VAS (BL)","A701":"VASANELLO (VT)","L693":"VASIA (IM)","E372":"VASTO (CH)","L696":"VASTOGIRARDI (IS)","L697":"VATTARO (TN)","L698":"VAUDA CANAVESE (TO)","L699":"VAZZANO (VV)","L700":"VAZZOLA (TV)","L702":"VECCHIANO (PI)","L704":"VEDANO AL LAMBRO (MI)","L703":"VEDANO OLONA (VA)","L705":"VEDDASCA (VA)","L706":"VEDELAGO (TV)","L707":"VEDESETA (BG)","L709":"VEDUGGIO CON COLZANO (MI)","L710":"VEGGIANO (PD)","L711":"VEGLIE (LE)","L712":"VEGLIO (BI)","L713":"VEJANO (VT)","L715":"VELESO (CO)","L716":"VELEZZO LOMELLINA (PV)","L719":"VELLETRI (RM)","L720":"VELLEZZO BELLINI (PV)","L723":"VELO D'ASTICO (VI)","L722":"VELO VERONESE (VR)","L724":"VELTURNO .FELDTHURNS. (BZ)","L725":"VENAFRO (IS)","L727":"VENARIA REALE (TO)","L728":"VENAROTTA (AP)","L729":"VENASCA (CN)","L726":"VENAUS (TO)","L730":"VENDONE (SV)","L731":"VENDROGNO (LC)","L733":"VENEGONO INFERIORE (VA)","L734":"VENEGONO SUPERIORE (VA)","L735":"VENETICO (ME)","L736":"VENEZIA (VE)","L737":"VENIANO (CO)","L738":"VENOSA (PZ)","L739":"VENTICANO (AV)","L741":"VENTIMIGLIA (IM)","L740":"VENTIMIGLIA DI SICILIA (PA)","L742":"VENTOTENE (LT)","L743":"VENZONE (UD)","L745":"VERANO .VORAN. (BZ)","L744":"VERANO BRIANZA (MI)","L746":"VERBANIA (VB)","L747":"VERBICARO (CS)","L748":"VERCANA (CO)","L749":"VERCEIA (SO)","L750":"VERCELLI (VC)","L751":"VERCURAGO (LC)","L752":"VERDELLINO (BG)","L753":"VERDELLO (BG)","L755":"VERDERIO INFERIORE (LC)","L756":"VERDERIO SUPERIORE (LC)","L758":"VERDUNO (CN)","L762":"VERGATO (BO)","L763":"VERGEMOLI (LU)","L764":"VERGHERETO (FC)","L765":"VERGIATE (VA)","L768":"VERMEZZO (MI)","L769":"VERMIGLIO (TN)","L771":"VERNANTE (CN)","L772":"VERNASCA (PC)","L773":"VERNATE (MI)","L774":"VERNAZZA (SP)","L775":"VERNIO (PO)","L776":"VERNOLE (LE)","L777":"VEROLANUOVA (BS)","L778":"VEROLAVECCHIA (BS)","L779":"VEROLENGO (TO)","L780":"VEROLI (FR)","L781":"VERONA (VR)","D193":"VERONELLA (VR)","L783":"VERRAYES (AO)","C282":"VERRES (AO)","L784":"VERRETTO (PV)","L785":"VERRONE (BI)","L788":"VERRUA PO (PV)","L787":"VERRUA SAVOIA (TO)","L792":"VERTEMATE CON MINOPRIO (CO)","L795":"VERTOVA (BG)","L797":"VERUCCHIO (RN)","L798":"VERUNO (NO)","L799":"VERVIO (SO)","L800":"VERVO' (TN)","L801":"VERZEGNIS (UD)","L802":"VERZINO (KR)","L804":"VERZUOLO (CN)","L805":"VESCOVANA (PD)","L806":"VESCOVATO (CR)","L807":"VESIME (AT)","L808":"VESPOLATE (NO)","L809":"VESSALICO (IM)","L810":"VESTENANOVA (VR)","L811":"VESTIGNE' (TO)","L812":"VESTONE (BS)","L813":"VESTRENO (LC)","L814":"VETRALLA (VT)","L815":"VETTO (RE)","L817":"VEZZA D'ALBA (CN)","L816":"VEZZA D'OGLIO (BS)","L821":"VEZZANO (TN)","L819":"VEZZANO LIGURE (SP)","L820":"VEZZANO SUL CROSTOLO (RE)","L823":"VEZZI PORTIO (SV)","L826":"VIADANA (MN)","L827":"VIADANICA (BG)","L828":"VIAGRANDE (CT)","L829":"VIALE D'ASTI (AT)","L830":"VIALFRE' (TO)","L831":"VIANO (RE)","L833":"VIAREGGIO (LU)","L834":"VIARIGI (AT)","F537":"VIBO VALENTIA (VV)","L835":"VIBONATI (SA)","L836":"VICALVI (FR)","L837":"VICARI (PA)","L838":"VICCHIO (FI)","L840":"VICENZA (VI)","L548":"VICO CANAVESE (TO)","L842":"VICO DEL GARGANO (FG)","L845":"VICO EQUENSE (NA)","L843":"VICO NEL LAZIO (FR)","L841":"VICOFORTE (CN)","L846":"VICOLI (PE)","L847":"VICOLUNGO (NO)","L850":"VICOPISANO (PI)","L851":"VICOVARO (RM)","M259":"VIDDALBA (SS)","L854":"VIDIGULFO (PV)","L856":"VIDOR (TV)","L857":"VIDRACCO (TO)","L858":"VIESTE (FG)","L859":"VIETRI DI POTENZA (PZ)","L860":"VIETRI SUL MARE (SA)","L864":"VIGANELLA (VB)","L866":"VIGANO' (LC)","L865":"VIGANO SAN MARTINO (BG)","L868":"VIGARANO MAINARDA (FE)","L869":"VIGASIO (VR)","L872":"VIGEVANO (PV)","L873":"VIGGIANELLO (PZ)","L874":"VIGGIANO (PZ)","L876":"VIGGIU' (VA)","L878":"VIGHIZZOLO D'ESTE (PD)","L880":"VIGLIANO BIELLESE (BI)","L879":"VIGLIANO D'ASTI (AT)","L881":"VIGNALE MONFERRATO (AL)","L882":"VIGNANELLO (VT)","L883":"VIGNATE (MI)","L885":"VIGNOLA (MO)","L886":"VIGNOLA FALESINA (TN)","L887":"VIGNOLE BORBERA (AL)","L888":"VIGNOLO (CN)","L889":"VIGNONE (VB)","L890":"VIGO DI CADORE (BL)","L893":"VIGO DI FASSA (TN)","L903":"VIGO RENDENA (TN)","L892":"VIGODARZERE (PD)","L894":"VIGOLO (BG)","L896":"VIGOLO VATTARO (TN)","L897":"VIGOLZONE (PC)","L898":"VIGONE (TO)","L899":"VIGONOVO (VE)","L900":"VIGONZA (PD)","L904":"VIGUZZOLO (AL)","L910":"VILLA AGNEDO (TN)","L912":"VILLA BARTOLOMEA (VR)","L913":"VILLA BASILICA (LU)","L917":"VILLA BISCOSSI (PV)","L919":"VILLA CARCINA (BS)","L920":"VILLA CASTELLI (BR)","L922":"VILLA CELIERA (PE)","L926":"VILLA COLLEMANDINA (LU)","L928":"VILLA CORTESE (MI)","L929":"VILLA D'ADDA (BG)","A215":"VILLA D'ALME' (BG)","L933":"VILLA DEL BOSCO (BI)","L934":"VILLA DEL CONTE (PD)","D801":"VILLA DI BRIANO (CE)","L907":"VILLA DI CHIAVENNA (SO)","L936":"VILLA DI SERIO (BG)","L908":"VILLA DI TIRANO (SO)","L938":"VILLA D'OGNA (BG)","L937":"VILLA ESTENSE (PD)","L943":"VILLA FARALDI (IM)","L956":"VILLA GUARDIA (CO)","L957":"VILLA LAGARINA (TN)","A081":"VILLA LATINA (FR)","L844":"VILLA LITERNO (CE)","L969":"VILLA MINOZZO (RE)","F804":"VILLA POMA (MN)","M006":"VILLA RENDENA (TN)","M018":"VILLA SAN GIOVANNI (RC)","H913":"VILLA SAN GIOVANNI IN TUSCIA (VT)","I118":"VILLA SAN PIETRO (CA)","M019":"VILLA SAN SECONDO (AT)","L905":"VILLA SANTA LUCIA (FR)","M021":"VILLA SANTA LUCIA DEGLI ABRUZZI (AQ)","M022":"VILLA SANTA MARIA (CH)","M023":"VILLA SANT'ANGELO (AQ)","I298":"VILLA SANT'ANTONIO (OR)","L909":"VILLA SANTINA (UD)","I364":"VILLA SANTO STEFANO (FR)","A609":"VILLA VERDE (OR)","M034":"VILLA VICENTINA (UD)","L915":"VILLABASSA .NIEDERDORF. (BZ)","L916":"VILLABATE (PA)","L923":"VILLACHIARA (BS)","L924":"VILLACIDRO (CA)","L931":"VILLADEATI (AL)","L939":"VILLADOSE (RO)","L906":"VILLADOSSOLA (VB)","L942":"VILLAFALLETTO (CN)","L945":"VILLAFRANCA D'ASTI (AT)","L949":"VILLAFRANCA DI VERONA (VR)","L946":"VILLAFRANCA IN LUNIGIANA (MS)","L947":"VILLAFRANCA PADOVANA (PD)","L948":"VILLAFRANCA PIEMONTE (TO)","L944":"VILLAFRANCA SICULA (AG)","L950":"VILLAFRANCA TIRRENA (ME)","L951":"VILLAFRATI (PA)","L952":"VILLAGA (VI)","L953":"VILLAGRANDE STRISAILI (NU)","L958":"VILLALAGO (AQ)","L959":"VILLALBA (CL)","L961":"VILLALFONSINA (CH)","L963":"VILLALVERNIA (AL)","L964":"VILLAMAGNA (CH)","L965":"VILLAMAINA (AV)","L966":"VILLAMAR (CA)","L967":"VILLAMARZANA (RO)","L968":"VILLAMASSARGIA (CA)","L970":"VILLAMIROGLIO (AL)","L971":"VILLANDRO .VILLANDERS. (BZ)","L978":"VILLANOVA BIELLESE (BI)","L982":"VILLANOVA CANAVESE (TO)","L975":"VILLANOVA D'ALBENGA (SV)","L983":"VILLANOVA D'ARDENGHI (PV)","L984":"VILLANOVA D'ASTI (AT)","L973":"VILLANOVA DEL BATTISTA (AV)","L985":"VILLANOVA DEL GHEBBO (RO)","L977":"VILLANOVA DEL SILLARO (LO)","L979":"VILLANOVA DI CAMPOSAMPIERO (PD)","L988":"VILLANOVA MARCHESANA (RO)","L974":"VILLANOVA MONDOVI' (CN)","L972":"VILLANOVA MONFERRATO (AL)","L989":"VILLANOVA MONTELEONE (SS)","L990":"VILLANOVA SOLARO (CN)","L980":"VILLANOVA SULL'ARDA (PC)","L991":"VILLANOVA TRUSCHEDU (OR)","L986":"VILLANOVAFORRU (CA)","L987":"VILLANOVAFRANCA (CA)","L992":"VILLANOVATULO (NU)","L994":"VILLANTERIO (PV)","L995":"VILLANUOVA SUL CLISI (BS)","M278":"VILLAPERUCCIO (CA)","B903":"VILLAPIANA (CS)","L998":"VILLAPUTZU (CA)","L999":"VILLAR DORA (TO)","M007":"VILLAR FOCCHIARDO (TO)","M013":"VILLAR PELLICE (TO)","M014":"VILLAR PEROSA (TO)","M015":"VILLAR SAN COSTANZO (CN)","M002":"VILLARBASSE (TO)","M003":"VILLARBOIT (VC)","M004":"VILLAREGGIA (TO)","G309":"VILLARICCA (NA)","M009":"VILLAROMAGNANO (AL)","M011":"VILLAROSA (EN)","M016":"VILLASALTO (CA)","M017":"VILLASANTA (MI)","B738":"VILLASIMIUS (CA)","M025":"VILLASOR (CA)","M026":"VILLASPECIOSA (CA)","M027":"VILLASTELLONE (TO)","M028":"VILLATA (VC)","M030":"VILLAURBANA (OR)","M031":"VILLAVALLELONGA (AQ)","M032":"VILLAVERLA (VI)","L981":"VILLENEUVE (AO)","M043":"VILLESSE (GO)","M041":"VILLETTA BARREA (AQ)","M042":"VILLETTE (VB)","M044":"VILLIMPENTA (MN)","M045":"VILLONGO (BG)","M048":"VILLORBA (TV)","M050":"VILMINORE DI SCALVE (BG)","M052":"VIMERCATE (MI)","M053":"VIMODRONE (MI)","M055":"VINADIO (CN)","M057":"VINCHIATURO (CB)","M058":"VINCHIO (AT)","M059":"VINCI (FI)","M060":"VINOVO (TO)","M062":"VINZAGLIO (NO)","M063":"VIOLA (CN)","M065":"VIONE (BS)","M067":"VIPITENO .STERZING. (BZ)","H123":"VIRGILIO (MN)","M069":"VIRLE PIEMONTE (TO)","M070":"VISANO (BS)","M071":"VISCHE (TO)","M072":"VISCIANO (NA)","M073":"VISCO (UD)","M077":"VISONE (AL)","M078":"VISSO (MC)","M079":"VISTARINO (PV)","M080":"VISTRORIO (TO)","M081":"VITA (TP)","M082":"VITERBO (VT)","M083":"VITICUSO (FR)","M085":"VITO D'ASIO (PN)","M086":"VITORCHIANO (VT)","M088":"VITTORIA (RG)","M089":"VITTORIO VENETO (TV)","M090":"VITTORITO (AQ)","M091":"VITTUONE (MI)","M093":"VITULANO (BN)","M092":"VITULAZIO (CE)","M094":"VIU' (TO)","M096":"VIVARO (PN)","M095":"VIVARO ROMANO (RM)","M098":"VIVERONE (BI)","M100":"VIZZINI (CT)","M101":"VIZZOLA TICINO (VA)","M102":"VIZZOLO PREDABISSI (MI)","M103":"VO (PD)","M104":"VOBARNO (BS)","M105":"VOBBIA (GE)","M106":"VOCCA (VC)","M108":"VODO DI CADORE (BL)","M109":"VOGHERA (PV)","M110":"VOGHIERA (FE)","M111":"VOGOGNA (VB)","M113":"VOLANO (TN)","M115":"VOLLA (NA)","M116":"VOLONGO (CR)","M118":"VOLPAGO DEL MONTELLO (TV)","M119":"VOLPARA (PV)","M120":"VOLPEDO (AL)","M121":"VOLPEGLINO (AL)","M122":"VOLPIANO (TO)","M125":"VOLTA MANTOVANA (MN)","M123":"VOLTAGGIO (AL)","M124":"VOLTAGO AGORDINO (BL)","M126":"VOLTERRA (PI)","M127":"VOLTIDO (CR)","M131":"VOLTURARA APPULA (FG)","M130":"VOLTURARA IRPINA (AV)","M132":"VOLTURINO (FG)","M133":"VOLVERA (TO)","M136":"VOTTIGNASCO (CN)","M138":"ZACCANOPOLI (VV)","M139":"ZAFFERANA ETNEA (CT)","M140":"ZAGARISE (CZ)","M141":"ZAGAROLO (RM)","M142":"ZAMBANA (TN)","M143":"ZAMBRONE (VV)","M144":"ZANDOBBIO (BG)","M145":"ZANE' (VI)","M147":"ZANICA (BG)","M267":"ZAPPONETA (FG)","M150":"ZAVATTARELLO (PV)","M152":"ZECCONE (PV)","M153":"ZEDDIANI (OR)","M156":"ZELBIO (CO)","M158":"ZELO BUON PERSICO (LO)","M160":"ZELO SURRIGONE (MI)","M161":"ZEME (PV)","M162":"ZENEVREDO (PV)","M163":"ZENSON DI PIAVE (TV)","M165":"ZERBA (PC)","M166":"ZERBO (PV)","M167":"ZERBOLO' (PV)","M168":"ZERFALIU (OR)","M169":"ZERI (MS)","M170":"ZERMEGHEDO (VI)","M171":"ZERO BRANCO (TV)","M172":"ZEVIO (VR)","M173":"ZIANO DI FIEMME (TN)","L848":"ZIANO PIACENTINO (PC)","M174":"ZIBELLO (PR)","M176":"ZIBIDO SAN GIACOMO (MI)","M177":"ZIGNAGO (SP)","M178":"ZIMELLA (VR)","M179":"ZIMONE (BI)","M180":"ZINASCO (PV)","M182":"ZOAGLI (GE)","M183":"ZOCCA (MO)","M184":"ZOGNO (BG)","M185":"ZOLA PREDOSA (BO)","I345":"ZOLDO ALTO (BL)","M187":"ZOLLINO (LE)","M188":"ZONE (BS)","M189":"ZOPPE' DI CADORE (BL)","M190":"ZOPPOLA (PN)","M194":"ZOVENCEDO (VI)","M196":"ZUBIENA (BI)","M197":"ZUCCARELLO (SV)","M198":"ZUCLO (TN)","M199":"ZUGLIANO (VI)","M200":"ZUGLIO (UD)","M201":"ZUMAGLIA (BI)","M202":"ZUMPANO (CS)","M203":"ZUNGOLI (AV)","M204":"ZUNGRI (VV)","Z100":"ALBANIA","Z101":"ANDORRA","Z102":"AUSTRIA","Z103":"BELGIO","Z104":"BULGARIA","Z105":"CECOSLOVACCHIA","Z106":"CITTA DEL VATICANO","Z107":"DANIMARCA","Z108":"FAER OER","Z109":"FINLANDIA","Z110":"FRANCIA","Z111":"GERMANIA REP. DEMOCRATICA","Z112":"GERMANIA REP. FEDERALE","Z113":"GIBILTERRA","Z114":"GRAN BRETAGNA","Z115":"GRECIA","Z116":"IRLANDA","Z117":"ISLANDA","Z118":"IUGOSLAVIA","Z119":"LIECHTENSTEIN","Z120":"LUSSEMBURGO","Z121":"MALTA","Z122":"MAN","Z123":"MONACO","Z124":"NORMANNE","Z125":"NORVEGIA","Z126":"PAESI BASSI","Z127":"POLONIA","Z128":"PORTOGALLO","Z129":"ROMANIA","Z130":"SAN MARINO","Z131":"SPAGNA","Z132":"SVEZIA","Z133":"SVIZZERA","Z134":"UNGHERIA","Z135":"URSS","Z136":"GEORGIA","Z137":"ARMENIA","Z138":"UCRAINA","Z139":"BIELORUSSIA","Z140":"MOLDAVIA","Z141":"AZERBAIDJAN","Z142":"KIRGHIZISTAN","Z143":"UZBEKISTAN","Z144":"ESTONIA","Z145":"LETTONIA","Z146":"LITUANIA","Z147":"TAGIKISTAN","Z148":"MACEDONIA","Z149":"CROAZIA","Z150":"SLOVENIA","Z151":"TURKEMENISTAN","Z152":"KAZAKISTAN","Z153":"BOSNIA ED ERZEGOVINA","Z154":"RUSSIA (FEDERAZIONE RUSSA)","Z155":"REPUBBLICA SLOVACCA","Z156":"REPUBBLICA CECA","Z200":"AFGHANISTAN","Z201":"ARABIA MERIDIONALE","Z202":"PROTETTORATO DELLA ARABIA MERIDIONALE","Z203":"ARABIA SAUDITA","Z204":"BAHREIN","Z205":"BHUTAN","Z206":"BIRMANIA","Z207":"BRUNEI","Z208":"CAMBOGIA","Z209":"SRI LANKA","Z210":"CINA REPUBBLICA POPOLARE","Z211":"CIPRO","Z212":"COCOS","Z213":"REPUBBLICA DI COREA","Z214":"COREA REPUBBLICA POPOLARE","Z215":"EMIRATI ARABI UNITI","Z216":"FILIPPINE","Z217":"CINA REPUBBLICA NAZIONALE","Z218":"TERRITORIO DI GAZA","Z219":"GIAPPONE","Z220":"GIORDANIA","Z221":"HONG KONG","Z222":"INDIA","Z223":"INDONESIA","Z224":"IRAN","Z225":"IRAQ","Z226":"ISRAELE","Z227":"KUWAIT","Z228":"LAOS","Z229":"LIBANO","Z230":"MALESIA","Z231":"MACAO","Z232":"MALDIVE","Z233":"MONGOLIA REP. POPOLARE","Z234":"NEPAL","Z235":"OMAN","Z236":"PAKISTAN","Z237":"QATAR","Z238":"RYUKYU","Z239":"SIKKIM","Z240":"SIRIA","Z241":"THAILANDIA","Z242":"TIMOR","Z243":"TURCHIA","Z244":"VIETNAM DEL SUD","Z245":"VIETNAM DEL NORD","Z246":"YEMEN","Z247":"MALAYSIA","Z248":"SINGAPORE","Z249":"BANGLADESH","Z250":"YEMEN REP. DEM. POPOLARE","Z251":"VIETNAM","Z300":"NAMIBIA","Z301":"ALGERIA","Z302":"ANGOLA","Z303":"BASUTOLAND SUD AFRICA BRITANNICO","Z304":"BECIUANIA SUD AFRICA BRITANNICO","Z305":"BURUNDI","Z306":"CAMERUN","Z307":"CAPO VERDE","Z308":"IMPERO CENTROAFRICANO","Z309":"CIAD","Z310":"COMORE","Z311":"CONGO REPUBBLICA POPOLARE","Z312":"ZAIRE","Z313":"COSTA D AVORIO","Z314":"BENIN","Z315":"ETIOPIA","Z316":"GABON","Z317":"GAMBIA","Z318":"GHANA","Z319":"GUINEA","Z320":"GUINEA BISSAU","Z321":"GUINEA EQUATORIALE","Z322":"KENYA","Z323":"IFNI","Z324":"LA REUNION","Z325":"LIBERIA","Z326":"LIBIA","Z327":"MADAGASCAR","Z328":"MALAWI","Z329":"MALI","Z330":"MAROCCO","Z331":"MAURITANIA","Z332":"MAURIZIO","Z333":"MOZAMBICO","Z334":"NIGER","Z335":"NIGERIA","Z336":"EGITTO","Z337":"ZIMBABWE","Z338":"RUANDA","Z339":"SAHARA SPAGNOLO","Z340":"SANT ELENA","Z341":"PRINCIPE","Z342":"SEICELLE","Z343":"SENEGAL","Z344":"SIERRA LEONE","Z345":"SOMALIA","Z346":"SOMALIA FRANCESE","Z347":"REPUBBLICA SUDAFRICANA","Z348":"SUDAN","Z349":"SWAZILAND","Z350":"TANGANICA","Z351":"TOGO","Z352":"TUNISIA","Z353":"UGANDA","Z354":"BURKINA FASO","Z355":"ZAMBIA","Z356":"ZANZIBAR","Z357":"TANZANIA","Z358":"BOTSWANA","Z359":"LESOTHO","Z360":"MAYOTTE","Z361":"GIBUTI","Z362":"SAHARA MERIDIONALE","Z363":"SAHARA SETTENTRIONALE","Z364":"BOPHUTHATSWANA","Z365":"TRANSKEI","Z366":"VENDA","Z367":"CISKEI","Z368":"ERITREA","Z400":"BERMUDE","Z401":"CANADA","Z402":"GROENLANDIA","Z403":"SAINT PIERRE ET MIQUELON","Z404":"STATI UNITI D AMERICA","Z500":"ANTILLE BRIT.","Z501":"ANTILLE OLANDESI","Z502":"BAHAMA","Z503":"COSTA RICA","Z504":"CUBA","Z505":"REPUBBLICA DOMINICANA","Z506":"EL SALVADOR","Z507":"GIAMAICA","Z508":"GUADALUPA","Z509":"GUATEMALA","Z510":"HAITI","Z511":"HONDURAS","Z512":"BELIZE","Z513":"MARTINICA","Z514":"MESSICO","Z515":"NICARAGUA","Z516":"PANAMA","Z517":"PANAMA ZONA DEL CANALE","Z518":"PUERTO RICO","Z519":"TURKS","Z520":"ISOLE VERGINI","Z522":"BARBADOS","Z523":"ANTILLE BRITANNICHE","Z524":"GRENADA","Z525":"VERGINI BRITANNICHE (ISOLE)","Z526":"DOMINICA","Z527":"SAINT LUCIA","Z528":"SAINT VINCENT E GRENADINE","Z529":"ANGUILLA (ISOLA)","Z530":"CAYMAN (ISOLE)","Z531":"MONTSERRAT","Z532":"ANTIGUE E BARBUDA","Z533":"SAINT KITTS E NEVIS","Z600":"ARGENTINA","Z601":"BOLIVIA","Z602":"BRASILE","Z603":"CILE","Z604":"COLOMBIA","Z605":"ECUADOR","Z606":"REPUBBLICA DELLA GUAYANA","Z607":"GUAYANA FRANCESE","Z608":"SURINAME","Z609":"MALVINE","Z610":"PARAGUAY","Z611":"PERU","Z612":"TRINIDAD E TOBAGO","Z613":"URUGUAY","Z614":"VENEZUELA","Z700":"AUSTRALIA","Z701":"CAROLINE","Z702":"CHRISTMAS","Z703":"COOK","Z704":"FIGI O VITI","Z705":"ELLICE","Z706":"GUAM","Z707":"IRIAN OCCIDENTALE","Z708":"MACQUARIE","Z709":"MARCUS","Z710":"MARIANNE","Z711":"MARSHALL","Z712":"MIDWAY","Z713":"NAURU","Z714":"SAVAGE","Z715":"NORFOLK","Z716":"NUOVA CALEDONIA","Z717":"NUOVE EBRIDI","Z718":"NUOVA GUINEA","Z719":"NUOVA ZELANDA","Z720":"PAPUASIA","Z721":"PASQUA","Z722":"PITCAIRN","Z723":"POLINESIA","Z724":"SALOMONE","Z725":"SAMOA AMERICANE","Z726":"SAMOA OCCIDENTALI","Z727":"TOKELAU","Z728":"TONGA O DEGLI AMICI","Z729":"WALLIS","Z730":"PAPUA NUOVA GUINEA","Z731":"KIRIBATI","Z732":"TUVALU","Z733":"VANUATU","Z734":"PALAU REPUBBLICA","Z735":"MICRONESIA STATI FEDERALI","Z800":"DIPENDENZE CANADESI","Z801":"DIPENDENZE NORVEGESI","Z802":"DIPENDENZE SOVIETICHE","Z900":"DIPENDENZE AUSTRALIANE","Z901":"DIPENDENZE BRITANNICHE","Z902":"DIPENDENZE FRANCESI","Z903":"DIPENDENZE NEOZELANDESI","Z905":"DIPENDENZE NORVEGESI","Z906":"DIPENDENZE SUDAFRICANE"};}_createClass(CodiceFiscaleC,[{key:'calcola_carattere_di_controllo',value:function calcola_carattere_di_controllo(codice_fiscale){var i,val=0;for(i=0;i<15;i++){var c=codice_fiscale[i];if(i%2)val+=this.tavola_carattere_di_controllo_valore_caratteri_pari[c];else val+=this.tavola_carattere_di_controllo_valore_caratteri_dispari[c];}val=val%26;return this.tavola_carattere_di_controllo.charAt(val);}},{key:'affronta_omocodia',value:function affronta_omocodia(codice_fiscale,numero_omocodia){// non funziona
var cifre_disponibili=[14,13,12,10,9,7,6];var cifre_da_cambiare=[];while(numero_omocodia>0&&cifre_disponibili.length){var i=numero_omocodia%cifre_disponibili.length;numero_omocodia=Math.floor(numero_omocodia/cifre_disponibili.length);cifre_da_cambiare.push(cifre_disponibili.splice(i-1,1)[0]);}}},{key:'ottieni_consonanti',value:function ottieni_consonanti(str){return str.replace(/[^BCDFGHJKLMNPQRSTVWXYZ]/gi,'');}},{key:'ottieni_vocali',value:function ottieni_vocali(str){return str.replace(/[^AEIOU]/gi,'');}},{key:'calcola_codice_cognome',value:function calcola_codice_cognome(cognome){var codice_cognome=this.ottieni_consonanti(cognome);codice_cognome+=this.ottieni_vocali(cognome);codice_cognome+='XXX';codice_cognome=codice_cognome.substr(0,3);return codice_cognome.toUpperCase();}},{key:'calcola_codice_nome',value:function calcola_codice_nome(nome){var codice_nome=this.ottieni_consonanti(nome);if(codice_nome.length>=4){codice_nome=codice_nome.charAt(0)+codice_nome.charAt(2)+codice_nome.charAt(3);}else{codice_nome+=this.ottieni_vocali(nome);codice_nome+='XXX';codice_nome=codice_nome.substr(0,3);}return codice_nome.toUpperCase();}},{key:'calcola_codice_data',value:function calcola_codice_data(gg,mm,aa,sesso){var d=new Date();d.setYear(aa);d.setMonth(mm-1);d.setDate(gg);var anno="0"+d.getFullYear();anno=anno.substr(anno.length-2,2);var mese=this.tavola_mesi[d.getMonth()];var giorno=d.getDate();if(sesso.toUpperCase()=='F')giorno+=40;giorno="0"+giorno;giorno=giorno.substr(giorno.length-2,2);return""+anno+mese+giorno;}},{key:'trova_comune',value:function trova_comune(pattern_comune){return this.codici_catastali[pattern_comune];/* *
     var codice, comune, ret = []
     var quoted = pattern_comune.replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g, "\\$1");
     var re = new RegExp(quoted, 'i')
     for (codice in this.codici_catastali) {
     comune = this.codici_catastali[codice]
     if (comune.match(re)) ret.push([comune, codice])
     }
     return ret
     /* */}},{key:'solo_comuni',value:function solo_comuni(){var array=[],codici=this.codici_catastali;for(var i in codici){var comune=codici[i].split(" (")[0],provincia="";if(codici[i].split(" (")[1]){provincia=codici[i].split(" (")[1].split(")")[0];}var obj={"codice_catasto":i,"descrizione":provincia,"val":codici[i],"value":comune};array.push(obj);}return array;}},{key:'calcola_codice_comune',value:function calcola_codice_comune(pattern_comune){console.info("località:",pattern_comune);var i,comune,codice=[],self=this;for(i in this.codici_catastali){comune=self.codici_catastali[i];if(pattern_comune.toLowerCase()==comune.toLowerCase().slice(0,-5)){//comune.indexOf(pattern_comune) == 0
console.log("codice valido",i);codice.push(i);}}return codice[0];/*
     if (pattern_comune.match(/^[A-Z]\d\d\d$/i)) return pattern_comune;
     return this.trova_comune(pattern_comune)[0][1];
     */}},{key:'calcola_codice',value:function calcola_codice(nome,cognome,sesso,giorno,mese,anno,luogo){var codice=this.calcola_codice_cognome(cognome)+this.calcola_codice_nome(nome)+this.calcola_codice_data(giorno,mese,anno,sesso)+this.calcola_codice_comune(luogo);codice+=this.calcola_carattere_di_controllo(codice);return codice;}}]);return CodiceFiscaleC;}();var CodiceFiscale=exports.CodiceFiscale=new CodiceFiscaleC();

},{}],101:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}var FunctionsC=function(){function FunctionsC(props){_classCallCheck(this,FunctionsC);this.props=props;this.aggiornaDate=this.aggiornaDate.bind(this);}_createClass(FunctionsC,[{key:"aggiornaDate",value:function aggiornaDate(){var campoSource=arguments[0][0],campoDest=arguments[0][1],campoDifferenza=arguments[0][2];console.log("campoDifferenza");console.log(campoDifferenza);var nodo=document.getElementById(campoDest);var $el=$(nodo).closest(".form-group");var input=$el.find("input");var differenza=$(document.getElementById(campoDifferenza)).val();if($(document.getElementById(campoSource)).bootstrapDP("getDate")){if($(document.getElementById(campoSource)).length>0){var dataSource=$(document.getElementById(campoSource)).bootstrapDP("getDate").getTime();console.log(campoSource);console.log("==>"+dataSource);var dataDest=dataSource+differenza*86400000+14400000;// 86400000 è una giornata in millisecondi ;) - aggiungiamo 4 ore (14400000) per il bug del cambio ora ad ottobre - Rug
}if($(document.getElementById(campoDest)).length>0){console.log(campoDest);console.log("==>"+dataDest);$(document.getElementById(campoDest)).bootstrapDP("setDate",new Date(dataDest));}}}}]);return FunctionsC;}();var Functions=exports.Functions=new FunctionsC();

},{}],102:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.MainScope=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();/**
 * Created by ruggerotrevisiol on 15/02/17.
 *//*
 Questo modulo che ho creato serve ad avere uno scope comune a tutti i componenti, è dotato di un getter e di un setter che danno la possibilità di accedere alle funzionalità CRUD di  "bigScope" , l'oggetto polizza contiene il polizza Bean "adattato", questo contiene la copia speculare di quello che c'è in sessione su liferay - Rug
 */var _reactRouter=require("react-router");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}var MainScopeC=function(){function MainScopeC(){_classCallCheck(this,MainScopeC);/* */this.polizza={"parametri":[],"contraente":{},"oggettiAssicurati":[],"prodottoAttivo":{},"prodottoSelected":null,"consensi":[],"survey":null};this.bigScope={};/* *//* */this.naviga=this.naviga.bind(this);this.get=this.get.bind(this);this.set=this.set.bind(this);this.isError=this.isError.bind(this);this.setField=this.setField.bind(this);this.getPolizza=this.getPolizza.bind(this);this.getErrorText=this.getErrorText.bind(this);this.closeLoader=this.closeLoader.bind(this);this.getWarningText=this.getWarningText.bind(this);this.setPolizza=this.setPolizza.bind(this);this.trovaFieldSet=this.trovaFieldSet.bind(this);this.trovaField=this.trovaField.bind(this);this.setFieldContraente=this.setFieldContraente.bind(this);/*  */}_createClass(MainScopeC,[{key:"naviga",value:function naviga(obj){$(".myLoader").show();if(obj.idPagina){this.set('pagina'+obj.idPagina,obj.params);_reactRouter.hashHistory.push('/step/'+obj.idPagina);}$(".myLoader").hide();}},{key:"get",value:function get(key){return this.bigScope[key];}},{key:"set",value:function set(key,value){this.bigScope[key]=value;return true;}},{key:"isError",value:function isError(response){var errori=response.errors;var result={passed:true,response:response};if(errori&&errori.length>0){result.passed=false;}else{result.passed=true;}return result;}},{key:"trovaFieldSet",value:function trovaFieldSet(campo){var fieldSet,self=this;var arrFieldSet=self.get("contraenteLabels").fieldSet;for(var i in arrFieldSet){var campi=arrFieldSet[i].campi;for(var n in campi){if(campi[n].name==campo.name){fieldSet=arrFieldSet[i].name;}}}return fieldSet;}},{key:"trovaField",value:function trovaField(campo){var campoNew={},self=this;var arrFieldSet=self.get("contraenteLabels").fieldSet;for(var i in arrFieldSet){var campi=arrFieldSet[i].campi;for(var n in campi){if(campi[n].name==campo.name){campoNew=campi[n];}}}return campoNew;}},{key:"setFieldContraente",value:function setFieldContraente(name,value){var self=this;var campo={name:name};campo=self.trovaField(campo);campo.father="contraente";campo.value=value;self.setField(campo);}/*
   getContraenteField(name) {
   var fieldSet = MainScope.get("contraenteLabels").fieldSet;
   var father = "contraente";
   for (let i in fieldSet) {
   var gruppo = fieldSet[i];
   for (let n in gruppo) {
   var campi = gruppo.campi;
   for (let m in campi) {
   if (name === campi[m].name) {
   return campi[m];
   }
   }
   }
   }
   }
   */},{key:"setField",value:function setField(campo){console.log("cambio in corso","campo.name ==>",campo.name,"campo.value ==>",campo.value);var self=this;var father;if(campo.father){father=campo.father.split("[")[0];}var campi=self.getPolizza(father),i,i2;switch(father){case"parametri":var salvato=false;for(i in campi){if(campi[i].name==campo.name){campi[i]=campo;salvato=true;}}if(!salvato){campi.push(campo);salvato=true;}break;case"contraente":/*  */var campiContraente=self.get("contraenteLabels"),i,i3;if(!campo.fieldSet){campo.fieldSet=self.trovaFieldSet(campo);}for(i in campiContraente.fieldSet){if(campiContraente.fieldSet[i].name==campo.fieldSet){var campiVeri=campiContraente.fieldSet[i].campi;for(i3 in campiVeri){if(campiVeri[i3].name==campo.name){campo.readonly=campiVeri[i3].readonly;campiVeri[i3]=campo;salvato=true;}}campiContraente.fieldSet[i].campi=campiVeri;}}self.set("contraenteLabels",campiContraente);/*  */campi[campo.name]=campo.value;salvato=true;break;case"oggettiAssicurati":var index=parseInt(campo.father.split("[")[1].split("]")[0]);var parametri=campi[index].parametri;for(i2 in parametri){if(parametri[i2].name==campo.name){parametri[i2]=campo;salvato=true;}}campi[index].parametri=parametri;salvato=true;break;}self.setPolizza(father,campi);}},{key:"getPolizza",value:function getPolizza(key){var result;if(key){result=this.polizza[key];}else{result=this.polizza;}return result;}},{key:"getErrorText",value:function getErrorText(error){var html=[],i,n;// messaggi
for(i in error.errors){var errore=error.errors[i];html.push(React.createElement("div",{key:"err"+i,className:"errore"},errore));}return html;}},{key:"closeLoader",value:function closeLoader(){$(".myLoader").hide();}},{key:"getWarningText",value:function getWarningText(error){var html=[],i,n;for(n in error.warning){var warning=error.warning[n];html.push(React.createElement("p",{key:"warn"+n,className:"warning"},warning));if(n==error.warning.length-1){html.push(React.createElement("div",null,React.createElement("div",{key:"warn_chiudi"+n,className:"btn btn-primary",onClick:this.closeLoader},"CHIUDI")));}}return html;}},{key:"setPolizza",value:function setPolizza(key,value,http){var self=this;if(key&&value){if(key=="parametri"||key=="contraente"){var i;var newContraente=[];for(i in value){if(key=="contraente"){var thisVal=value[i];var campo={"name":i};//
if(self.trovaField(campo)){campo=self.trovaField(campo);}campo.father="contraente";campo.value=thisVal;if(http){console.info("aggiorniamo dal web",campo.name,campo.value);self.setField(campo);}newContraente.push(campo);}else{}}if(key=="contraente"){if(typeof value[0]=="string"){value=newContraente;}}}if(!(key.indexOf("[")>0)){this.polizza[key]=value;}else{var index=parseInt(key.split("[")[1].split("]")[0]);var realKey=key.split("[")[0];this.polizza[realKey][index]=value;}}else{console.error("immettere tutti i valori per il set dei dati polizza");}return true;}}]);return MainScopeC;}();var MainScope=exports.MainScope=new MainScopeC();

},{"react-router":64}],103:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}var StringUtilsC=function(){function StringUtilsC(props){_classCallCheck(this,StringUtilsC);this.props=props;this.getParams=this.getParams.bind(this);}_createClass(StringUtilsC,[{key:"getParams",value:function getParams(url,param){var vars={};var parts=url.replace(/[?&]+([^=&]+)=([^&]*)/gi,function(m,key,value){vars[key]=value;});if(param){return vars[param];}else{return vars;}}}]);return StringUtilsC;}();var StringUtils=exports.StringUtils=new StringUtilsC();

},{}],104:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.ValidationServices=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();/**
 * Created by ruggerotrevisiol on 20/03/17.
 *//*
 Questo service raccoglie tutti i metodi utili alla validazione
 */var _MainScope=require("./MainScope");var _CodiceFiscale=require("./CodiceFiscale");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}var ValidationServiceC=function(){function ValidationServiceC(props){_classCallCheck(this,ValidationServiceC);this.props=props;this.creaRegola=this.creaRegola.bind(this);}_createClass(ValidationServiceC,[{key:"creaRegola",value:function creaRegola(campo){var self=this;if(campo.visible){try{var pagina=_MainScope.MainScope.get("currentPage");if(Object.keys($("."+pagina.submitForm).validate().settings.rules).length==0){$("."+pagina.submitForm).validate();$("."+pagina.submitForm).validate().settings.onfocusout=function(element){$(element).valid();};$("."+pagina.submitForm).validate().settings.highlight=function(element,required){$(element).parent().addClass("has-error");};$("."+pagina.submitForm).validate().settings.unhighlight=function(element,errorClass,validClass){$(element).parent().removeClass("has-error");};$("."+pagina.submitForm).validate().settings.errorElement='span';$("."+pagina.submitForm).validate().settings.errorClass='control-label';$.validator.addMethod("codfiscale",function(value){// espressione migliorabile... ma sufficiente ^_^
var regex=/[A-Z]{6}[\d]{2}[A-Z][\d]{2}[A-Z][\d]{3}[A-Z]/;var realValue=value.toUpperCase();return realValue.match(regex);},"Inserire un codice fiscale valido");$.validator.addMethod("unique",function(value,element){var parentForm=$(element).closest('form');var timeRepeated=0;if(value!=''){$(parentForm.find(':text')).each(function(){if($(this).val()===value){timeRepeated++;}});}return timeRepeated===1||timeRepeated===0;},"* Duplicato");/*
           $.validator.addMethod("verificaCodfiscaleReale", function (value) {
           
           // var regex = /[A-Z]{6}[\d]{2}[A-Z][\d]{2}[A-Z][\d]{3}[A-Z]/;
           // return value.match(regex);
           
           // var sesso=form.sesso[0].checked?'M':'F'
           var sesso = $("form *[name=sesso]").val() || "";
           // var data=form.data.value
           var data = $("form *[name=dataNascita]").val() || "";
           data = data.match(/^\s*(\d+).(\d+).(\d+)/) || []
           var codice = CodiceFiscale.calcola_codice(
           $("form *[name=nome]").val() || "",
           $("form *[name=cognome]").val() || "",
           sesso,
           data[1], data[2], data[3],
           $("form *[name=luogoNascita]").val() || ""
           );
           console.info("ecco il codice fiscale", codice);
           var codiceValido = false;
           if (codice.slice(0, -1).toLowerCase() == ($("form *[name=codiceFiscale]").val().slice(0, -1)).toLowerCase()) {
           codiceValido = true;
           }
           return codiceValido;
           }, "Inserire un codice fiscale reale");
           */$.validator.addMethod("comboBox",function(value){var regex=/-1/g;return!value.match(regex);},"Inserire un codice fiscale valido");// 
$.validator.addMethod("realMail",function(value){var regex=/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/g;return value.match(regex);},"Inserire una mail corretta!");// $("*[id^=oggettiAssicurati][id$=-codiceFiscale]")
// $(document.getElementsByName("assicurato_codiceFiscale")[0]).rules("add", {
$("*[id^=oggettiAssicurati][id$=-codiceFiscale]").rules("add",{codfiscale:true,unique:true,messages:{codfiscale:"Inserire un codice fiscale valido"}});/* Commentato perchè ora il campo viene prepopolato e quindi è inutile mettere la validazione - Rug
           $(document.getElementsByName("codiceFiscale")[0]).rules("add", {
           verificaCodfiscaleReale: true,
           codfiscale:true,
           messages: {
           codfiscale: "Inserire un codice fiscale valido",
           verificaCodfiscaleReale: "Inserire un codice Fiscale Reale"
           }
           });
           *
           
           $(document.getElementsByName("email")[0]).rules("add", {
           email: true,
           minlength: 3,
           required: true,
           messages: {
           email: "Inserire una email valida"
           }
           });
           */// Commentato perchè ora il campo viene prepopolato e quindi è inutile mettere la validazione - Rug
$(document.getElementsByName("assicurato_email")).rules("add",{realMail:true,messages:{email:"Inserire una email valida"}});$(document.getElementsByName("email")).rules("add",{realMail:true,messages:{email:"Inserire una email valida"}});/* */}var combo=false;if(campo.type=="comboBox"||campo.type=="comboBoxCustom"){combo=true;}$(document.getElementsByName(campo.name)[0]).rules("add",{required:campo.required,comboBox:combo,messages:{required:"Campo obbligatorio",comboBox:"Selezionare una opzione"}});/*
        $(document.getElementsByName("email")[0]).rules("add", {
          email: true,
          minlength: 3,
          required: true,
          messages: {
            email: "Inserire una email valida"
          }
        });
        */}catch(err){console.error("campo",campo);}}}}]);return ValidationServiceC;}();var ValidationServices=exports.ValidationServices=new ValidationServiceC();

},{"./CodiceFiscale":100,"./MainScope":102}],105:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 21/03/17.
 */var Acquisto=exports.Acquisto=function(_React$Component){_inherits(Acquisto,_React$Component);function Acquisto(props){_classCallCheck(this,Acquisto);var _this=_possibleConstructorReturn(this,(Acquisto.__proto__||Object.getPrototypeOf(Acquisto)).call(this,props));_this.state={};return _this;}_createClass(Acquisto,[{key:"render",value:function render(){return React.createElement("div",null,React.createElement("h3",null,"Acquisto Polizza"),React.createElement("p",null,"Ti confermiamo che il pagamento \xE8 stato eseguito regolarmente. Ti ringraziamo e informiamo che riceverai la documentazione contrattuale all\u2019indirizzo mail indicato in fase di emissione del contratto."));}}]);return Acquisto;}(React.Component);

},{}],106:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.App=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _reactRouter=require("react-router");var _Page=require("./Page");var _MainScope=require("../js-tools/MainScope");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 14/02/17.
 */var App=exports.App=function(_React$Component){_inherits(App,_React$Component);function App(props){_classCallCheck(this,App);var _this=_possibleConstructorReturn(this,(App.__proto__||Object.getPrototypeOf(App)).call(this,props));_this.props=props;// this.onBlur = this.onBlur.bind(this);
// this.updateField = this.updateField.bind(this);
_this.componentDidMount=_this.componentDidMount.bind(_this);_this.scope={};_this.state={campo:_this.props.campo};return _this;}_createClass(App,[{key:"componentDidMount",value:function componentDidMount(){_MainScope.MainScope.set("contraenteLabels",this.props.pagine[2].sourceData.componentData);}},{key:"render",value:function render(){var self=this;var routes=[],i;var className=self.props.classContainer;_MainScope.MainScope.set('pagine',this.props.pagine);for(i in this.props.pagine){var defaultValue=this.props.pagine[i].default;if(defaultValue){self.scope.paginaDefault=this.props.pagine[i].id;var defaultRoute=React.createElement(_reactRouter.Route,{path:"/"},React.createElement(_reactRouter.IndexRedirect,{to:"/step/"+this.props.pagine[i].id}));}}return React.createElement("div",{className:"mainCont "+className},React.createElement(_reactRouter.Router,{history:_reactRouter.hashHistory},defaultRoute,React.createElement(_reactRouter.Route,{path:"/step/:idStep",component:_Page.Page,pagine:this.props.pagine}),React.createElement(_reactRouter.Route,{path:"/step/:idStep/:esito",component:_Page.Page,pagine:this.props.pagine}),React.createElement(_reactRouter.Route,{path:"/step/:idStep/:esito/:codiceEsito",component:_Page.Page,pagine:this.props.pagine})));}}]);return App;}(React.Component);

},{"../js-tools/MainScope":102,"./Page":131,"react-router":64}],107:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.CheckboxField=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _MainScope=require("../js-tools/MainScope");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 02/03/17.
 
 */var CheckboxField=exports.CheckboxField=function(_React$Component){_inherits(CheckboxField,_React$Component);// autobind: false,
function CheckboxField(props){_classCallCheck(this,CheckboxField);var _this=_possibleConstructorReturn(this,(CheckboxField.__proto__||Object.getPrototypeOf(CheckboxField)).call(this,props));_this.props=props;_this.onBlur=_this.onBlur.bind(_this);_this.change=_this.change.bind(_this);_this.componentDidMount=_this.componentDidMount.bind(_this);_this.state={campo:_this.props.campo};return _this;}_createClass(CheckboxField,[{key:"componentDidMount",value:function componentDidMount(){var campo=this.props.campo;var nodo=document.getElementById(campo.father+"-"+campo.name);var $el=$(nodo).closest(".form-group");var input=$el.find("input");}},{key:"onBlur",value:function onBlur(){return this.change();}},{key:"change",value:function change(){var self=this;var campo=this.props.campo;var $el=$("#"+campo.father+"-"+campo.name).closest(".form-group");var input=$el.find("input");var state=this.state;state.campo.value=$(input)[0].checked;var campo=state.campo;self.setState(state);_MainScope.MainScope.setField(campo);}},{key:"render",value:function render(){var self=this;var campo=this.props.campo;return React.createElement("span",null,React.createElement("input",{type:"checkbox",id:campo.father+"-"+campo.name,className:"",name:campo.name,onChange:this.change,onBlur:this.onBlur.bind(this),value:campo.value,autoComplete:"off",placeholder:""}));}}]);return CheckboxField;}(React.Component);

},{"../js-tools/MainScope":102}],108:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.ComboBoxCustomField=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _MainScope=require("../js-tools/MainScope");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 30/01/17.
 */var ComboBoxCustomField=exports.ComboBoxCustomField=function(_React$Component){_inherits(ComboBoxCustomField,_React$Component);function ComboBoxCustomField(props){_classCallCheck(this,ComboBoxCustomField);var _this=_possibleConstructorReturn(this,(ComboBoxCustomField.__proto__||Object.getPrototypeOf(ComboBoxCustomField)).call(this,props));_this.componentDidMount=_this.componentDidMount.bind(_this);_this.onBlur=_this.onBlur.bind(_this);_this.change=_this.change.bind(_this);_this.state={campo:_this.props.campo,infoValue:"",options:[]};return _this;}_createClass(ComboBoxCustomField,[{key:"componentDidMount",value:function componentDidMount(){var self=this;var campo=this.props.campo;var $el=$("#"+campo.father+"-"+campo.name).closest(".form-group");var select=$el.find("select");var url=window.configApp.getComboBoxAnagraficaUrl;var parametroIdQueryString='&comboBox='+campo.comboBox;// if (location.hostname === "localhost") {
parametroIdQueryString='_comboBox_'+campo.comboBox;// }
if(window.Liferay){var authToken='&p_auth='+Liferay.authToken;}else{var authToken="";}url=url+parametroIdQueryString+authToken;$.ajax({url:url,dataType:"json",method:"GET",async:false}).done(function(response){var state=self.state,i,selected;state.options=response;for(i in state.options){if(state.options[i].key==campo.value){if(self.props.campo.readonly){state.infoValue=state.options[i].value;selected=state.options[i].value;}else{selected==campo.value;}}}self.setState(state);// if (!self.props.campo.readonly) {
self.change(selected);// }
}).fail(function(error){console.error("è andata in errore la chiamata per i valori del combobox",error);});}},{key:"onBlur",value:function onBlur(){return this.change();}},{key:"change",value:function change(value){var self=this;var campo=this.props.campo;var $el=$("#"+campo.father+"-"+campo.name).closest(".form-group");var select=$el.find("select");var state=this.state;if(!select.val()){state.campo.value=value;}else{state.campo.value=select.val();}state.infoValue=state.campo.value;var campo=state.campo;self.setState(state);if(!this.props.campo.readonly){console.info(">>>>>>>>>>combo ok in scrittura");_MainScope.MainScope.setField(campo);}else{console.info(">>>>>>>>>>combo ok in sola lettura");}}},{key:"render",value:function render(){var self=this;var campo=this.props.campo;var options=this.state.options,i,optionsTag=[];var renderCode=React.createElement("span",null);for(i in options){optionsTag.push(React.createElement("option",{value:options[i].key,key:i},options[i].value));}if(!this.props.readonly){renderCode=React.createElement("span",null,React.createElement("div",{id:"id_"+campo.name}),React.createElement("select",{id:campo.father+"-"+campo.name,className:"form-control",name:campo.name,onChange:this.change,disabled:campo.readonly,onBlur:this.onBlur.bind(this),value:this.props.campo.value},optionsTag));}else{// renderCode = <span>{this.state.infoValue}<input name={campo.name} value={campo.value} id={campo.father + "-" + campo.name} type="hidden"/></span>;
renderCode=React.createElement("span",null,this.props.campo.value,React.createElement("div",{id:"id_"+campo.name,className:"hidden"}),React.createElement("select",{id:campo.father+"-"+campo.name,className:"form-control hidden",name:campo.name,onChange:this.change,disabled:campo.readonly,onBlur:this.onBlur.bind(this),value:this.props.campo.value},optionsTag));}return renderCode;}}]);return ComboBoxCustomField;}(React.Component);

},{"../js-tools/MainScope":102}],109:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.ComboboxField=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _MainScope=require("../js-tools/MainScope");var _Functions=require("../js-tools/Functions");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 30/01/17.
 */var ComboboxField=exports.ComboboxField=function(_React$Component){_inherits(ComboboxField,_React$Component);function ComboboxField(props){_classCallCheck(this,ComboboxField);var _this=_possibleConstructorReturn(this,(ComboboxField.__proto__||Object.getPrototypeOf(ComboboxField)).call(this,props));_this.componentDidMount=_this.componentDidMount.bind(_this);_this.onBlur=_this.onBlur.bind(_this);_this.change=_this.change.bind(_this);_this.state={campo:_this.props.campo,options:[]};return _this;}_createClass(ComboboxField,[{key:"componentDidMount",value:function componentDidMount(){var self=this;var campo=this.props.campo;var nodo=document.getElementById(campo.father+"-"+campo.name);$(nodo).on("setField",function(){return self.change();});var $el=$(nodo).closest(".form-group");var select=$el.find("select");/* */var config=this.props.campo.config;if(config){var configuration=JSON.parse(config);}if(configuration&&configuration.functions&&configuration.functions.length>0){configuration.functions.forEach(function(item,index,arr){var _loop=function _loop(i){select.on("change",function(){_Functions.Functions[i](item[i]);});};for(var i in item){_loop(i);}});}/* */var url=window.configApp.anagrafica_url_by_id;var parametroIdQueryString='?idParametro='+campo["id"];// if (location.hostname === "localhost") {
parametroIdQueryString='_idParametro_'+campo["id"];// }
if(window.Liferay){var authToken='&p_auth='+Liferay.authToken;}else{var authToken="";}url=url+parametroIdQueryString+authToken;//var options = [];
$.ajax({url:url,dataType:"json",method:"GET",async:false}).done(function(response){var state=self.state;// state.campo.valuesAngrafica = response;
state.campo.anagraficaValues=response;state.options=response;if(!state.campo.value){state.campo.value=state.options[0].val;}else{state.campo.value=state.campo.value;}var $el=$("#"+campo.father+"-"+campo.name).closest(".form-group");var select=$el.find("select");// select.attr("value",state.campo.value);
$(select).val(state.campo.value);self.setState(state);self.change();}).fail(function(error){console.error("è andata in errore la chiamata per i valori del combobox",error);});}},{key:"onBlur",value:function onBlur(){return this.change();}},{key:"change",value:function change(){var self=this;var campo=this.props.campo;var $el=$("#"+campo.father+"-"+campo.name).closest(".form-group");var select=$el.find("select");var state=this.state;if($(select).val()){state.campo.value=$(select).val();}var campo=state.campo;self.setState(state);_MainScope.MainScope.setField(campo);}},{key:"render",value:function render(){var self=this;var campo=this.props.campo;var tipo=this.props.tipo;var options=this.state.options,i,optionsTag=[],info;for(i in options){var selection="";if(options[i].val==campo.value){info=options[i].info;}optionsTag.push(React.createElement("option",{value:options[i].val,key:i},options[i].info));}/* */var value="";if(this.state.campo.value){value=this.state.campo.value;}var renderCode="";if(!this.props.readonly){renderCode=React.createElement("span",null,React.createElement("div",{id:"id_"+campo.name}),React.createElement("select",{id:campo.father+"-"+campo.name,className:"form-control",name:campo.name,onChange:this.change,disabled:campo.readonly,onBlur:this.onBlur.bind(this),value:this.state.campo.value},optionsTag));}else{renderCode=React.createElement("span",null,info,React.createElement("input",{name:campo.name,value:campo.value,id:campo.father+"-"+campo.name,type:"hidden"}));}return renderCode;}}]);return ComboboxField;}(React.Component);

},{"../js-tools/Functions":101,"../js-tools/MainScope":102}],110:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.Consenso=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _CheckboxField=require("./CheckboxField");var _MainScope=require("../js-tools/MainScope");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 02/03/17.
 */var Consenso=exports.Consenso=function(_React$Component){_inherits(Consenso,_React$Component);function Consenso(props){_classCallCheck(this,Consenso);var _this=_possibleConstructorReturn(this,(Consenso.__proto__||Object.getPrototypeOf(Consenso)).call(this,props));_this.props=props;// this.onBlur = this.onBlur.bind(this);
// this.updateField = this.updateField.bind(this);
// this.componentDidMount = this.componentDidMount.bind(this);
_this.state={campo:_this.props.campo};return _this;}_createClass(Consenso,[{key:"render",value:function render(){var self=this;var campo=this.props.campo;var link="";if(campo.link){var testoLink=campo.testoLink;if(!testoLink){testoLink=campo.link;}link=React.createElement("a",{className:"linkConsensi",target:"blank",download:campo.link,href:campo.link},testoLink);}var istituto=campo.istituto;if(istituto===document.getElementById("istituto-template-source").value||!istituto){return React.createElement("span",null,React.createElement("span",null,campo.label),link,"\xA0",React.createElement(_CheckboxField.CheckboxField,{campo:campo}));}else{return React.createElement("span",null);}}}]);return Consenso;}(React.Component);

},{"../js-tools/MainScope":102,"./CheckboxField":107}],111:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.Contraente=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _MainScope=require("../js-tools/MainScope");var _DinamicField=require("./DinamicField");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 06/03/17.
 */var Contraente=exports.Contraente=function(_React$Component){_inherits(Contraente,_React$Component);function Contraente(props){_classCallCheck(this,Contraente);var _this=_possibleConstructorReturn(this,(Contraente.__proto__||Object.getPrototypeOf(Contraente)).call(this,props));_this.props=props;_this.componentDidMount=_this.componentDidMount.bind(_this);_this.state={contraenteLabels:_MainScope.MainScope.get("contraenteLabels"),campi:[]};return _this;}_createClass(Contraente,[{key:"componentDidMount",value:function componentDidMount(){}},{key:"render",value:function render(){//var polizza = MainScope.getPolizza(), contraente = polizza.contraente, i, contraenteRow = [], self = this;
var self=this;var parametri=this.state.contraenteLabels,i,contraenteRow=[],self=this;if(parametri&&parametri.fieldSet&&parametri.fieldSet.length>0){for(i in parametri.fieldSet[0].campi){var campo=parametri.fieldSet[0].campi[i];if(campo.visible){campo.readonly=true;var campoHTML=React.createElement("span",null,React.createElement("span",{className:"grassetto"},campo.label," : "),React.createElement(_DinamicField.DinamicField,{campo:campo}));contraenteRow.push(React.createElement("div",{key:i},campoHTML));}}}return React.createElement("div",null,contraenteRow);}}]);return Contraente;}(React.Component);;

},{"../js-tools/MainScope":102,"./DinamicField":115}],112:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.CurrencyField=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _MainScope=require("../js-tools/MainScope");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 30/01/17.
 */var CurrencyField=exports.CurrencyField=function(_React$Component){_inherits(CurrencyField,_React$Component);function CurrencyField(props){_classCallCheck(this,CurrencyField);var _this=_possibleConstructorReturn(this,(CurrencyField.__proto__||Object.getPrototypeOf(CurrencyField)).call(this,props));_this.props=props;_this.componentDidMount=_this.componentDidMount.bind(_this);_this.onBlur=_this.onBlur.bind(_this);_this.change=_this.change.bind(_this);_this.state={campo:_this.props.campo};return _this;}_createClass(CurrencyField,[{key:"componentDidMount",value:function componentDidMount(){var campo=this.props.campo;var $el=$("#"+campo.father+"-"+campo.name).closest(".form-group");var input=$el.find("input");}},{key:"onBlur",value:function onBlur(){return this.change();}},{key:"change",value:function change(){var self=this;var campo=this.props.campo;var $el=$("#"+campo.father+"-"+campo.name).closest(".form-group");var input=$el.find("input");var state=this.state;if(!isNaN(input.val())){state.campo.value=input.val();}var campo=state.campo;self.setState(state);_MainScope.MainScope.setField(campo);}},{key:"render",value:function render(){var self=this;var campo=this.props.campo;return React.createElement("span",null,React.createElement("input",{type:"text",id:campo.father+"-"+campo.name,className:"form-control",name:campo.name,onChange:this.change,onBlur:this.onBlur.bind(this),autoComplete:"off",value:campo.value,placeholder:campo.label}));}}]);return CurrencyField;}(React.Component);

},{"../js-tools/MainScope":102}],113:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.DateField=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _MainScope=require("../js-tools/MainScope");var _Functions=require("../js-tools/Functions");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}var DateField=exports.DateField=function(_React$Component){_inherits(DateField,_React$Component);function DateField(props){_classCallCheck(this,DateField);var _this=_possibleConstructorReturn(this,(DateField.__proto__||Object.getPrototypeOf(DateField)).call(this,props));_this.props=props;_this.formatDate=_this.formatDate.bind(_this);_this.componentDidMount=_this.componentDidMount.bind(_this);_this.onBlur=_this.onBlur.bind(_this);_this.change=_this.change.bind(_this);_this.state={"campo":_this.props.campo,"mobile":window.isMobile};return _this;}_createClass(DateField,[{key:"formatDate",value:function formatDate(sDate){var newValue="";var d=new Date(Number(sDate));if(d){var month=''+(d.getMonth()+1),day=''+d.getDate(),year=d.getFullYear();if(month.length<2)month='0'+month;if(day.length<2)day='0'+day;console.log("day",day,"month",month,"year",year);newValue=[day,month,year].join('/');}return newValue;}},{key:"onBlur",value:function onBlur(){return this.change();}},{key:"change",value:function change(){var self=this;var campo=this.props.campo;var nodo=document.getElementById(campo.father+"-"+campo.name);var $el=$(nodo).closest(".form-group");var input=$el.find("input");var state=this.state;state.campo.value=input.val();var campo=state.campo;self.setState(state);$(nodo).trigger("change.dp");// MainScope.setField(campo);
/* */}},{key:"componentDidMount",value:function componentDidMount(){var self=this;var campo=this.props.campo;var state=this.state;var nodo=document.getElementById(campo.father+"-"+campo.name);$(nodo).on("setField",function(){return self.change();});var $el=$(nodo).closest(".form-group");$el.addClass("form-data");var input=$el.find("input");/* */// $("input").each(function () {
// var input = $(this);
/*
     if (input.hasClass("hasDatepicker")) {
     input.bootstrapDP("destroy");
     input.removeClass("hasDatepicker");
     input.removeAttr('id');
     input.attr("id", campo.father + "-" + campo.name);
     }
     */// });
if($.data(input.get(0),'datepicker')){input.bootstrapDP("remove");}/* */var config=this.props.campo.config;if(config){var configuration=JSON.parse(config);}var optionsDate={language:'it',container:"#datepicker-"+campo.father+"-"+campo.name,format:'dd/mm/yyyy',autoclose:true};if(configuration){if(!campo.readonly){var start=configuration.start;if(start){optionsDate["startDate"]=start;}var end=configuration.end;if(end){optionsDate["endDate"]=end;}}/*
       * 
       if (configuration.readonly) {
       state.campo.readonly = configuration.readonly;
       self.setState(state);
       }
       
       if(configuration.readonly){
       $( input ).prop( "disabled", true );
       }
       */}var cambioDataInCorso=function cambioDataInCorso(evt){var dateText=evt.target.value;var dateArray=dateText.split("/");var selectedDate=new Date(dateArray[2],dateArray[1]-1,dateArray[0]);var now=new Date();now.setHours(0,0,0,0);if(configuration){if(configuration&&configuration.functions&&configuration.functions.length>0){configuration.functions.forEach(function(item,index,arr){for(var i in item){//select.on("change", function () {
_Functions.Functions[i](item[i]);//});
}});}var maxDateField=campo.father+"-"+configuration.endField;var minDateField=campo.father+"-"+configuration.startField;var showTime=configuration.showTime;//         var inputMaxDateField = $("#" + maxDateField + "").closest(".form-group").find("input");
//         if (inputMaxDateField.length > 0) {
//         inputMaxDateField.bootstrapDP("setStartDate", selectedDate);
//         }
var inputMinDateField=$("#"+minDateField+"").closest(".form-group").find("input");if(inputMinDateField.length>0){inputMinDateField.bootstrapDP("setEndDate",selectedDate);}}if(showTime&&selectedDate.getTime()===now.getTime()){now=new Date();var time=now.getHours()+":"+now.getMinutes();$(input).after("<input type='text' readonly='true' class='data-ora' value='"+time+"' />");}else{$el.find(".data-ora").remove();}var campoModificato=campo;if(selectedDate&&selectedDate.getTime()){console.log("selectedDate.getTime()",selectedDate.getTime());console.log("campo.value",campo.value);campoModificato.value=selectedDate.getTime();}if(!self.props.readonly){$(input).valid();}else{$("#datepicker-"+campo.father+"-"+campo.name).hide();}self.setState({"campo":campoModificato});_MainScope.MainScope.setField(campoModificato);};input.on("keydown",cambioDataInCorso);input.bootstrapDP(optionsDate).on("changeDate",cambioDataInCorso);/*    */if(campo.value){input.bootstrapDP("setDate",new Date(parseInt(campo.value)));}var campoModificato=campo;if(input.bootstrapDP("getDate")){campoModificato.value=input.bootstrapDP("getDate").getTime();}self.setState({"campo":campoModificato});_MainScope.MainScope.setField(campoModificato);/* INIZIO MOBILE HACK */if(this.state.mobile){input.on("touchstart",function(e){e.preventDefault();input.bootstrapDP("show");input.blur();});}/* FINE MOBILE HACK */return true;}},{key:"render",value:function render(){var self=this;var campo=this.props.campo;var style={};if(this.props.readonly){style.background="none";style.border="0 none transparent";style.margin="0px";style.height="inherit";style.lineHeight="inherit";style.padding="0px";style.WebkitBoxShadow="none";style.MozBoxShadow="none";style.boxShadow="none";}return React.createElement("span",null,React.createElement("div",{className:"my-datepicker-container",id:"datepicker-"+campo.father+"-"+campo.name}),React.createElement("input",{style:style,readOnly:this.props.readonly,disabled:this.props.readonly,type:"text",id:campo.father+"-"+campo.name,className:"form-control",name:campo.name,placeholder:campo.label}));}}]);return DateField;}(React.Component);;

},{"../js-tools/Functions":101,"../js-tools/MainScope":102}],114:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.DatiPersonali=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _DinamicField=require("./DinamicField");var _Riepilogo=require("./Riepilogo");var _FooterFlow=require("./FooterFlow");var _FormDati=require("./FormDati");var _OggettiAssicurati=require("./OggettiAssicurati");var _MainScope=require("../js-tools/MainScope");var _Questionario=require("./Questionario");var _ValidationService=require("../js-tools/ValidationService");var _CodiceFiscale=require("../js-tools/CodiceFiscale");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 27/02/17.
 *//*
import {Codicefiscale} from "../js-tools/CodiceFiscale";
const CodiceFiscale = new Codicefiscale;
*/var DatiPersonali=exports.DatiPersonali=function(_React$Component){_inherits(DatiPersonali,_React$Component);function DatiPersonali(props){_classCallCheck(this,DatiPersonali);var _this=_possibleConstructorReturn(this,(DatiPersonali.__proto__||Object.getPrototypeOf(DatiPersonali)).call(this,props));_this.props=props;_this.precompilaDati=_this.precompilaDati.bind(_this);_this.scegliNazione=_this.scegliNazione.bind(_this);_this.componentDidMount=_this.componentDidMount.bind(_this);_this.compilaAssicurato=_this.compilaAssicurato.bind(_this);_this.cercaProvincia=_this.cercaProvincia.bind(_this);_this.state={survey:_MainScope.MainScope.get("surveyView")};return _this;}_createClass(DatiPersonali,[{key:"precompilaDati",value:function precompilaDati(){var state=this.state,self=this;var codiceComune=codiceComune=$("#contraente-codiceFiscale").val().substring(11,15);if(codiceComune[0]!=="Z"){var comune=_CodiceFiscale.CodiceFiscale.trova_comune(codiceComune);console.log("comune:",comune);$("#contraente-luogoNascita").val(comune.split(" (")[0]);$("#contraente-luogoNascita").parent().text(comune.split(" (")[0]);_MainScope.MainScope.setFieldContraente("luogoNascita",comune.split(" (")[0]);// $("#contraente-luogoNascita").trigger("setField");
var siglaProvincia=comune.substring(comune.lastIndexOf("(")+1,comune.lastIndexOf(")"));var provinceOpts=$("#contraente-provinciaNascita option");var sigla="";$("#contraente-provinciaNascita").parent().text(siglaProvincia);/* */console.log("provinceOpts.length",provinceOpts.length);provinceOpts.each(function(){var provincia=$(this).text();sigla=provincia.substring(provincia.lastIndexOf("(")+1,provincia.lastIndexOf(")"));if(sigla==siglaProvincia){$("#contraente-provinciaNascita").val(this.value);_MainScope.MainScope.setFieldContraente("provinciaNascita",this.value);// $("#contraente-provinciaNascita").trigger("setField");
}});/* */console.info("siglaProvincia :",siglaProvincia);self.scegliNazione("Italia");}else{$("#contraente-luogoNascita").parent().text("EE");$("#contraente-provinciaNascita").parent().text("EE");/* *
       $("#contraente-luogoNascita").val("EE");
       $("#contraente-luogoNascita").trigger("setField");
       $("#contraente-provinciaNascita").val("EE");
       $("#contraente-provinciaNascita").trigger("setField");
       /* */self.scegliNazione(_CodiceFiscale.CodiceFiscale.trova_comune(codiceComune));}}},{key:"scegliNazione",value:function scegliNazione(nazione){console.log("nazione",nazione);var options=$("#contraente-paeseNascita option");console.log("options.length",options.length);$("#contraente-paeseNascita").parent().text(nazione);// $("#contraente-paeseNascita").val(nazione);
// $("#contraente-paeseNascita").trigger("setField");
/* */options.each(function(){if($(this).text().toLowerCase().indexOf(nazione.toLowerCase())>-1){$("#contraente-paeseNascita").val(this.value);_MainScope.MainScope.setFieldContraente("paeseNascita",this.value);// $("#contraente-paeseNascita").trigger("setField");
}});/* */}},{key:"componentDidMount",value:function componentDidMount(){var state=this.state,self=this;if(!state.survey){$("#Questionario").toggle();state.survey=true;_MainScope.MainScope.set("surveyView",true);self.setState(state);}/* trova provincia */// $("#contraente-citta").parent().parent().parent().on("click", function () {
$("#contraente-citta").on("change",function(){//setInterval(function () {
var sigla=$($("#contraente-citta").parent()).find("ul>li:eq(0)>p").attr("title");console.log("sigla:",sigla);if(sigla){/*
         var citta = testo.split(" (")[0];
         console.log("citta:", citta);
         MainScope.setFieldContraente("citta:", citta);
         */// $(document.getElementById("contraente-citta")).prop('disabled', true);
self.cercaProvincia(sigla);}// }, 300);
// });
});/* *//* precompilazione di valori dal codice fiscale */setTimeout(function(){self.precompilaDati();},0);/* */}},{key:"compilaAssicurato",value:function compilaAssicurato(event){var compilaAss=event.target.checked;if(compilaAss){$(document.getElementById("oggettiAssicurati[0]-nome")).val(document.getElementsByName("nome")[0].value);$(document.getElementById("oggettiAssicurati[0]-cognome")).val(document.getElementsByName("cognome")[0].value);$(document.getElementById("oggettiAssicurati[0]-codiceFiscale")).val(document.getElementsByName("codiceFiscale")[0].value);$(document.getElementById("oggettiAssicurati[0]-email")).val(document.getElementsByName("email")[0].value);}else{$(document.getElementById("oggettiAssicurati[0]-nome")).val("");$(document.getElementById("oggettiAssicurati[0]-cognome")).val("");$(document.getElementById("oggettiAssicurati[0]-codiceFiscale")).val("");$(document.getElementById("oggettiAssicurati[0]-email")).val("");}$(document.getElementById("oggettiAssicurati[0]-nome")).trigger("setField");$(document.getElementById("oggettiAssicurati[0]-cognome")).trigger("setField");$(document.getElementById("oggettiAssicurati[0]-codiceFiscale")).trigger("setField");$(document.getElementById("oggettiAssicurati[0]-email")).trigger("setField");}},{key:"cercaProvincia",value:function cercaProvincia(siglaProvincia){var provinceOpts=$("#contraente-provincia option");var sigla="";/* */console.log("provinceOpts.length",provinceOpts.length);provinceOpts.each(function(){var provincia=$(this).text();sigla=provincia.substring(provincia.lastIndexOf("(")+1,provincia.lastIndexOf(")"));if(sigla==siglaProvincia){console.log("#contraente-provincia",this.value);$("#contraente-provincia").val(this.value);_MainScope.MainScope.setFieldContraente("provincia",this.value);$(document.getElementById("contraente-provincia")).prop('disabled',true);}});}},{key:"render",value:function render(){var pagina=this.props.pagina;var componentData=this.props.pagina.sourceData.componentData,campi=[],consensi=[],listaOggettiAssicurati=[];campi=_MainScope.MainScope.get("contraenteLabels").fieldSet;console.log("contraente labels ===>",campi);/* */var comuni=_CodiceFiscale.CodiceFiscale.solo_comuni();for(var i in campi[1].campi){if(campi[1].campi[i]&&campi[1].campi[i].name=="citta"){campi[1].campi[i].array=comuni;}}/* */consensi=componentData.consents;listaOggettiAssicurati=[];var polizza=_MainScope.MainScope.getPolizza();if(polizza){listaOggettiAssicurati=polizza.oggettiAssicurati;}return React.createElement("div",{className:"row preventivo"},React.createElement("div",{className:"col-md-6 col-md-push-6"},React.createElement(_Riepilogo.Riepilogo,null)),React.createElement("div",{className:"col-md-6 col-md-pull-6"},React.createElement("form",{className:"form-inline "+pagina.submitForm+" col-xs-12 col-sm-12 col-md-12 col-lg-12"},React.createElement(_FormDati.FormDati,{father:"contraente",campi:campi}),React.createElement("div",{className:"row"},React.createElement("div",{className:"col-xs-12 col-sm-12 col-md-12 col-lg-12"},React.createElement("input",{type:"checkbox",onClick:this.compilaAssicurato}),"\xA0 \xA0 il contraente \xE8 anche l'assicurato?")),React.createElement(_OggettiAssicurati.OggettiAssicurati,{assicurati:listaOggettiAssicurati}),React.createElement("div",{className:"row"},React.createElement("div",{className:"col-xs-12 col-sm-12 col-md-12 col-lg-12"},React.createElement(_Questionario.Questionario,null))),React.createElement("br",null),React.createElement(_FormDati.FormDati,{father:"consensi",consensi:consensi}))),React.createElement(_FooterFlow.FooterFlow,{pagina:pagina}));}}]);return DatiPersonali;}(React.Component);

},{"../js-tools/CodiceFiscale":100,"../js-tools/MainScope":102,"../js-tools/ValidationService":104,"./DinamicField":115,"./FooterFlow":119,"./FormDati":120,"./OggettiAssicurati":129,"./Questionario":135,"./Riepilogo":137}],115:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.DinamicField=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _TextField=require("./TextField");var _LookupField=require("./LookupField");var _LookupOBJField=require("./LookupOBJField");var _NumberField=require("./NumberField");var _MultiField=require("./MultiField");var _DateField=require("./DateField");var _ComboboxField=require("./ComboboxField");var _ComboBoxCustomField=require("./ComboBoxCustomField");var _Consenso=require("./Consenso");var _CurrencyField=require("./CurrencyField");var _CheckboxField=require("./CheckboxField");var _ValidationService=require("../js-tools/ValidationService");var _MainScope=require("../js-tools/MainScope");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 14/02/17.
 */var DinamicField=exports.DinamicField=function(_React$Component){_inherits(DinamicField,_React$Component);function DinamicField(props){_classCallCheck(this,DinamicField);var _this=_possibleConstructorReturn(this,(DinamicField.__proto__||Object.getPrototypeOf(DinamicField)).call(this,props));_this.props=props;_this.shouldComponentUpdate=_this.shouldComponentUpdate.bind(_this);_this.componentDidMount=_this.componentDidMount.bind(_this);// this.onBlur = this.onBlur.bind(this);
// this.updateField = this.updateField.bind(this);
// this.shouldComponentUpdate = this.shouldComponentUpdate.bind(this);
// this.trovaPagina = this.trovaPagina.bind(this);
_this.state={campo:_this.props.campo};return _this;}_createClass(DinamicField,[{key:"shouldComponentUpdate",value:function shouldComponentUpdate(){var self=this;var pagina=this.props.pagina;return true;}},{key:"componentDidMount",value:function componentDidMount(){var pagina=_MainScope.MainScope.get("currentPage");var campo=this.state.campo;var nodo=document.getElementById(campo.father+"-"+campo.name);var nodoCampo=$(nodo).closest(".control-group");var input=$(document.getElementById(campo.father+"-"+campo.name));if(nodoCampo.length==0){nodoCampo=$(nodo).closest(".form-group");}var readonly=campo.readonly;if(pagina){campo.submitForm=pagina.submitForm;}if(readonly){input.css("background","none");}if(campo.toValidate){var validationOBJ=_ValidationService.ValidationServices.creaRegola(campo);}}},{key:"render",value:function render(){var self=this;var campo=this.props.campo,htmlField=React.createElement("div",null);var tipo;if(campo){if(campo.value==null){campo.value="";}htmlField=React.createElement(_TextField.TextField,{campo:campo});}var readonly=campo.readonly,tooltip="",position="inherit",disabled="",readonlyComp=false;if(campo.config){var configuration=JSON.parse(campo.config);if(configuration.readonly){readonlyComp=true;readonly=true;/*
         var nodo = document.getElementById(campo.father + "-" + campo.name);
         var $el = $(nodo).closest(".form-group");
         $el.addClass("form-data");
         var input = $el.find("input");
         input.prop('disabled', true);
         */}}if(readonly){position="relative";// disabled = <div className='disableField'></div>;
tipo="label";campo.toValidate=false;var valoreView=campo.value;htmlField=React.createElement("span",null,valoreView,React.createElement("input",{name:campo.name,value:campo.value,id:campo.father+"-"+campo.name,type:"hidden"}));switch(campo.type){case"date":campo.readonly=true;htmlField=React.createElement(_DateField.DateField,{campo:campo,readonly:true});/*
           var data = new Date(parseInt(valoreView));
           var mese = (data.getMonth() + 1);
           var giorno = data.getDate();
           var format = function (number) {
           return ((number < 10) ? '0' + number : number)
           }
           valoreView = format(giorno) + "/" + format(mese) + "/" + data.getFullYear();
           htmlField = <span>{campo.value}<input readOnly="true" type="text" name={campo.name} id={campo.father + "-" + campo.name} /></span>;
           */break;case"lookup":if(campo.anagraficaValues&&campo.anagraficaValues.length>0){valoreView=campo.anagraficaValues[0].val;htmlField=React.createElement("span",null,valoreView);}break;case"lookupobj":if(campo.anagraficaValues&&campo.anagraficaValues.length>0){valoreView=campo.anagraficaValues[0].val;htmlField=React.createElement("span",null,valoreView);}break;case"comboBox":htmlField=React.createElement(_ComboboxField.ComboboxField,{readonly:true,campo:campo});// htmlField = <ComboLabel campo={campo}/>;
break;case"comboBoxCustom":htmlField=React.createElement(_ComboBoxCustomField.ComboBoxCustomField,{readonly:true,campo:campo});// htmlField = <ComboLabel campo={campo}/>;
break;}}else{campo.toValidate=true;switch(campo.type){case"consenso":// campo.toValidate = false;
htmlField=React.createElement(_Consenso.Consenso,{campo:campo});break;case"lookup":htmlField=React.createElement(_LookupField.LookupField,{campo:campo});break;case"lookupobj":htmlField=React.createElement(_LookupOBJField.LookupOBJField,{campo:campo});break;case"date":htmlField=React.createElement(_DateField.DateField,{campo:campo,readonly:readonlyComp});break;case"text":htmlField=React.createElement(_TextField.TextField,{campo:campo});break;case"number":htmlField=React.createElement(_NumberField.NumberField,{campo:campo});break;case"multifield":htmlField=React.createElement(_MultiField.MultiField,{campo:campo,tipo:tipo});break;case"currency":htmlField=React.createElement(_CurrencyField.CurrencyField,{campo:campo});break;case"comboBox":htmlField=React.createElement(_ComboboxField.ComboboxField,{campo:campo});break;case"comboBoxCustom":htmlField=React.createElement(_ComboBoxCustomField.ComboBoxCustomField,{campo:campo});break;case"checkbox":htmlField=React.createElement(_CheckboxField.CheckboxField,{campo:campo});break;}}var classeCampo="";if(campo.visible){classeCampo="";}else{classeCampo="hidden";}var stile={position:position};return React.createElement("div",{style:stile,className:"form-group "+classeCampo},disabled,htmlField);}}]);return DinamicField;}(React.Component);;

},{"../js-tools/MainScope":102,"../js-tools/ValidationService":104,"./CheckboxField":107,"./ComboBoxCustomField":108,"./ComboboxField":109,"./Consenso":110,"./CurrencyField":112,"./DateField":113,"./LookupField":125,"./LookupOBJField":126,"./MultiField":127,"./NumberField":128,"./TextField":140}],116:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.DinamicFieldSet=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _Tooltip=require("./Tooltip");var _DinamicField=require("./DinamicField");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 01/03/17.
 */var DinamicFieldSet=exports.DinamicFieldSet=function(_React$Component){_inherits(DinamicFieldSet,_React$Component);function DinamicFieldSet(props){_classCallCheck(this,DinamicFieldSet);var _this=_possibleConstructorReturn(this,(DinamicFieldSet.__proto__||Object.getPrototypeOf(DinamicFieldSet)).call(this,props));_this.props=props;_this.state={};return _this;}_createClass(DinamicFieldSet,[{key:"componentDidMount",value:function componentDidMount(){}},{key:"render",value:function render(){var self=this,nascondi="";var campi=this.props.campi;var fields=[],i;for(i in campi){var campo=campi[i];var columns=6,label="";if(campo){if(campo.readonly==undefined){campo.readonly=false;campo.fieldSet=this.props.fieldSet;}else if(campo.readonly==true){label=React.createElement("b",null,campo.label);}// campo.readonly = false;
if(this.props.father){campo.father=this.props.father;}if(campo.columns>0){columns=campo.columns;}if(campo.visible==false){nascondi="hidden";}else{nascondi="";}fields.push(React.createElement("div",{key:i,className:"control-group col-xs-12 col-sm-12 col-md-"+columns+" col-lg-"+columns+" larger "+nascondi},label,React.createElement(_DinamicField.DinamicField,{key:i,campo:campo})));}}return React.createElement("div",{className:"row"},fields);}}]);return DinamicFieldSet;}(React.Component);;

},{"./DinamicField":115,"./Tooltip":141}],117:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.Domanda=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _Risposta=require("./Risposta");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 11/04/17.
 */var Domanda=exports.Domanda=function(_React$Component){_inherits(Domanda,_React$Component);function Domanda(props){_classCallCheck(this,Domanda);var _this=_possibleConstructorReturn(this,(Domanda.__proto__||Object.getPrototypeOf(Domanda)).call(this,props));_this.props=props;_this.state={domanda:_this.props.domanda,sottoDomande:_this.props.domanda.subQuestions,risposte:_this.props.domanda.answers};return _this;}_createClass(Domanda,[{key:"render",value:function render(){var SubQuestComp=this.props.subQuestComp;var risposte=this.state.risposte;var sottoDomande=this.state.sottoDomande,sottoDomandeHTML=[],sub;for(var i in sottoDomande){var sottoDomanda=sottoDomande[i];sottoDomandeHTML.push(React.createElement(SubQuestComp,{key:"subQuest_"+i,domanda:sottoDomanda}));}sub=React.createElement("ul",{className:"sottoDomanda"},sottoDomandeHTML);return React.createElement("li",null,React.createElement("p",null,this.state.domanda.question),React.createElement(_Risposta.Risposta,{risposte:risposte}),sub);}}]);return Domanda;}(React.Component);

},{"./Risposta":138}],118:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.EditStep=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _MainScope=require("../js-tools/MainScope");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 06/03/17.
 */var EditStep=exports.EditStep=function(_React$Component){_inherits(EditStep,_React$Component);function EditStep(props){_classCallCheck(this,EditStep);var _this=_possibleConstructorReturn(this,(EditStep.__proto__||Object.getPrototypeOf(EditStep)).call(this,props));_this.props=props;_this.naviga=_this.naviga.bind(_this);return _this;}_createClass(EditStep,[{key:"naviga",value:function naviga(){var step=this.props.step;_MainScope.MainScope.naviga({"idPagina":step});}},{key:"render",value:function render(){var testo="Modifica";if(this.props.testo&&this.props.testo.length>0){testo=this.props.testo;}return React.createElement("div",{className:"editStep"},React.createElement("a",{href:"javascript:void(0)",onClick:this.naviga},testo));}}]);return EditStep;}(React.Component);

},{"../js-tools/MainScope":102}],119:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.FooterFlow=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _MainScope=require("../js-tools/MainScope");var _Loader=require("./Loader");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 14/02/17.
 */var FooterFlow=exports.FooterFlow=function(_React$Component){_inherits(FooterFlow,_React$Component);function FooterFlow(props){_classCallCheck(this,FooterFlow);var _this=_possibleConstructorReturn(this,(FooterFlow.__proto__||Object.getPrototypeOf(FooterFlow)).call(this,props));var testo="caricamento in corso";var tipo="loader";_this.submit=_this.submit.bind(_this);_this.errorManagement=_this.errorManagement.bind(_this);_this.componentDidMount=_this.componentDidMount.bind(_this);_this.cancel=_this.cancel.bind(_this);_this.naviga=_this.naviga.bind(_this);_this.state={pagina:props.pagina,type:tipo,warning:testo,error:[]};return _this;}_createClass(FooterFlow,[{key:"errorManagement",value:function errorManagement(responce){var self=this,state=self.state;state.warning=_MainScope.MainScope.getWarningText(responce);state.error=_MainScope.MainScope.getErrorText(responce);if(state.warning.length>0&&!responce.nascondiOverlay){state.type="warning";}else{$(".myLoader").hide();// state = self.getInitialState();
}self.setState(state);}},{key:"componentDidMount",value:function componentDidMount(){}},{key:"cancel",value:function cancel(){var self=this;var pagina=this.state.pagina;_MainScope.MainScope.naviga({"idPagina":parseInt(pagina.cancelAction)});}},{key:"naviga",value:function naviga(){var self=this;var pagina=this.state.pagina;_MainScope.MainScope.naviga({"idPagina":parseInt(pagina.submitAction)});}},{key:"submit",value:function submit(){var pagina=this.state.pagina;var valid=true;if(pagina.submitForm&&$("form."+pagina.submitForm).length>0){valid=$("."+pagina.submitForm).valid();}if(valid){var self=this;var testo="caricamento in corso";var tipo="loader";var state={type:tipo,warning:testo,error:[]};self.setState(state);var pagina=this.state.pagina;var url=window.configApp[pagina.submitAction];var datiPolizza=_MainScope.MainScope.getPolizza();var data={"datiPolizza":JSON.stringify(datiPolizza)};$(".myLoader").show();var method="POST";//if (location.hostname === "localhost") {
method="GET";//}
$.ajax({url:url,data:data,dataType:"json",method:method,success:function success(response){var err=!_MainScope.MainScope.isError(response).passed;if(err){self.errorManagement(response);}else{var i;for(i in response){var prop=response[i];if(prop){_MainScope.MainScope.setPolizza(i,prop,true);}}var step=self.props.pagina.id;var nextStep=parseInt(step)+1;_MainScope.MainScope.naviga({"idPagina":nextStep,"params":response});}},error:function error(_error){self.errorManagement(_error);/*
           var state = self.state;
           state.warning = MainScope.getWarningText(response);
           state.error = MainScope.getErrorText(response);
           self.setState(state);
           
           $(".myLoader").hide();
           console.error("ci sono errori");
           */}});}}},{key:"render",value:function render(){var self=this,messaggi=this.state.error;var submit="",cancel="";var pagina=this.props.pagina;if(typeof this.props.submit=="function"){submit=React.createElement("div",{className:"btn btn-primary right",onClick:this.props.submit},pagina.submitLabel);}if(typeof pagina.submitAction=="string"&&pagina.submitAction.length>0){submit=React.createElement("div",{className:"btn btn-primary right",onClick:this.submit},pagina.submitLabel);}if(typeof pagina.submitAction=="number"&&pagina.submitAction>0){cancel=React.createElement("div",{className:"btn btn-primary right",onClick:this.naviga},pagina.submitLabel);}if(typeof pagina.cancelAction=="number"&&pagina.cancelAction>0){cancel=React.createElement("div",{className:"btn btn-annulla left",onClick:this.cancel},pagina.cancelLabel);}if(typeof this.props.cancel=="function"){cancel=React.createElement("div",{className:"btn btn-annulla left",onClick:this.props.cancel},pagina.cancelLabel);}return React.createElement("div",{className:"row"},React.createElement("div",{className:"col-xs-12 col-sm-12 col-md-12 col-lg-12"},this.state.error),React.createElement("div",{className:"col-xs-12 col-sm-12 col-md-12 col-lg-12"},submit," ",cancel),React.createElement(_Loader.Loader,{type:this.state.type,testo:this.state.warning}));}}]);return FooterFlow;}(React.Component);

},{"../js-tools/MainScope":102,"./Loader":124}],120:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.FormDati=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _DinamicFieldSet=require("./DinamicFieldSet");var _ValidationService=require("../js-tools/ValidationService");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 01/03/17.
 */var FormDati=exports.FormDati=function(_React$Component){_inherits(FormDati,_React$Component);function FormDati(props){_classCallCheck(this,FormDati);var _this=_possibleConstructorReturn(this,(FormDati.__proto__||Object.getPrototypeOf(FormDati)).call(this,props));_this.props=props;return _this;}_createClass(FormDati,[{key:"render",value:function render(){var fieldSet=this.props.campi,i,html=[],consensi=this.props.consensi;for(i in fieldSet){var gruppo=fieldSet[i];html.push(React.createElement("fieldset",{key:"campi-"+i},React.createElement("legend",null,gruppo.name),React.createElement(_DinamicFieldSet.DinamicFieldSet,{father:this.props.father,campi:gruppo.campi})));}if(consensi){var campi=consensi.campi;html.push(React.createElement("fieldset",{key:"consensi-"+i,className:"consensiFieldSet"},React.createElement("legend",null,consensi.name),React.createElement(_DinamicFieldSet.DinamicFieldSet,{father:this.props.father,campi:campi})));}return React.createElement("div",null,html);}}]);return FormDati;}(React.Component);;

},{"../js-tools/ValidationService":104,"./DinamicFieldSet":116}],121:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.FormFromUrl=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _MainScope=require("../js-tools/MainScope");var _DinamicField=require("./DinamicField");var _Tooltip=require("./Tooltip");var _FooterFlow=require("./FooterFlow");var _ValidationService=require("../js-tools/ValidationService");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 14/02/17.
 */var FormFromUrl=exports.FormFromUrl=function(_React$Component){_inherits(FormFromUrl,_React$Component);function FormFromUrl(props){_classCallCheck(this,FormFromUrl);var _this=_possibleConstructorReturn(this,(FormFromUrl.__proto__||Object.getPrototypeOf(FormFromUrl)).call(this,props));_this.props=props;_this.componentDidMount=_this.componentDidMount.bind(_this);_this.setField=_this.setField.bind(_this);_this.state={"campi":_MainScope.MainScope.getPolizza("parametri"),"contraente":{},"oggettiAssicurati":[],"prodotto":undefined};return _this;}_createClass(FormFromUrl,[{key:"componentDidMount",value:function componentDidMount(){var self=this;if(!(self.state.campi.length>0)){$.ajax({url:this.props.url,dataType:"json",method:"GET",success:function success(campi){var state=self.state;state.campi=campi;_MainScope.MainScope.setPolizza("parametri",campi);self.setState(state);},error:function error(_error){console.error("Errori nella chiamata di composizione del form:",_error);}});}else{}var pagina=this.props.pagina;}},{key:"setField",value:function setField(campo){var self=this;var state=this.state;var campi=this.state.campi,i;for(i in campi){if(campi[i].name==campo.name){campo.readonly=false;campi[i]=campo;state.campi=campi;self.setState(state);}}_MainScope.MainScope.setPolizza("parametri",campi);}},{key:"render",value:function render(){var self=this;var pagina=this.props.pagina;var campi=this.state.campi;var fields=[],i,conto=0;/* *
     var campo1 = {
     "type": "comboBoxCustom",
     "comboBox": "province",
     "name": "provincia",
     "label": "Provincia",
     "readonly": true,
     "required": true,
     "visible": true,
     "anagrafica": true,
     "columns": 3,
     "values": "",
     "value": 8104
     };
     /* */for(i in campi){var campo=campi[i];/* */if(campi[i].visible){campo.readonly=false;conto++;/* */campo.father="parametri";fields.push(React.createElement("div",{key:i,className:"row control-group"},React.createElement("div",{className:"col-xs-2 col-sm-2 col-md-2 col-lg-2"},React.createElement(_Tooltip.Tooltip,{campo:campi[i]}),React.createElement("label",{htmlFor:campi[i].name},conto+". "+campi[i].label)),React.createElement("div",{className:"col-xs-10 col-sm-10 col-md-10 col-lg-10"},React.createElement(_DinamicField.DinamicField,{key:"campo_"+i,campo:campi[i]}))));}else{fields.push(React.createElement(_DinamicField.DinamicField,{key:"campo_"+i,campo:campi[i]}));}}/* inizio TODO: da togliere!!! *
     fields.push(<div className="row control-group">
     <div className="col-xs-2 col-sm-2 col-md-2 col-lg-2">
     <Tooltip campo={campo1}/>
     <label htmlFor={campo1.name}>{"^_^ . " + campo1.label}</label>
     </div>
     <div className="col-xs-10 col-sm-10 col-md-10 col-lg-10">
     <DinamicField key={"campo_" + 292374} campo={campo1}/>
     </div>
     </div>);
     /* fine TODO: da togliere!!!  */return React.createElement("form",{name:pagina.submitForm,className:"form-inline "+pagina.submitForm+" col-xs-12 col-sm-12 col-md-12 col-lg-12"},fields,React.createElement(_FooterFlow.FooterFlow,{pagina:pagina}));}}]);return FormFromUrl;}(React.Component);;

},{"../js-tools/MainScope":102,"../js-tools/ValidationService":104,"./DinamicField":115,"./FooterFlow":119,"./Tooltip":141}],122:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.GaranziaPrevTable=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _Tooltip=require("./Tooltip");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 15/02/17.
 */var GaranziaPrevTable=exports.GaranziaPrevTable=function(_React$Component){_inherits(GaranziaPrevTable,_React$Component);function GaranziaPrevTable(props){_classCallCheck(this,GaranziaPrevTable);var _this=_possibleConstructorReturn(this,(GaranziaPrevTable.__proto__||Object.getPrototypeOf(GaranziaPrevTable)).call(this,props));_this.props=props;return _this;}_createClass(GaranziaPrevTable,[{key:"render",value:function render(){var prodotti=this.props.prodotti,garanzia=this.props.garanzia,prodottiTd=[],i;/*
     function isPresent(element) {
     return element == 15;
     }
     [12, 5, 8, 130, 44].find(isBigEnough); // 130
     */var checkGar=function checkGar(garanzie){var i,idGar=garanzia.id;var text="-";for(i in garanzie){if(garanzie[i].idGaranzia==idGar){text=garanzie[i].massimaleSelected.valoreMassimale;}}if(text=="-"||text=="No"){text=React.createElement("div",{className:"glyphicon glyphicon-remove"});}if(text=="Si"){text=React.createElement("div",{className:"glyphicon glyphicon-ok"});}return text;};for(i in prodotti){var textGar=checkGar(prodotti[i].garanzie);prodottiTd.push(React.createElement("td",{key:"prod-"+i},textGar));}return React.createElement("tr",{className:"rowGar"},React.createElement("td",{className:"tdGar"},garanzia.nome," ",React.createElement(_Tooltip.Tooltip,{tooltip:{"title":garanzia.nome,"content":garanzia.descrizione}})),prodottiTd);}}]);return GaranziaPrevTable;}(React.Component);

},{"./Tooltip":141}],123:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 14/02/17.
 */var HeaderStep=exports.HeaderStep=function(_React$Component){_inherits(HeaderStep,_React$Component);function HeaderStep(props){_classCallCheck(this,HeaderStep);var _this=_possibleConstructorReturn(this,(HeaderStep.__proto__||Object.getPrototypeOf(HeaderStep)).call(this,props));_this.props=props;_this.attivaStep=_this.attivaStep.bind(_this);_this.shouldComponentUpdate=_this.shouldComponentUpdate.bind(_this);_this.componentDidMount=_this.componentDidMount.bind(_this);_this.state={};return _this;}_createClass(HeaderStep,[{key:"attivaStep",value:function attivaStep(step){var stepTotali=this.props.pagine.length,i,attiva=step;$(".headerStepCustom .allStep .step").each(function(index){$(this).removeClass("active");$(this).removeClass("passed");var indice=index+1,classe;if(indice==attiva){classe="active";}else if(indice>attiva){classe="";}else if(indice<attiva){classe="passed";}$(this).addClass(classe);});}},{key:"shouldComponentUpdate",value:function shouldComponentUpdate(propCh,stateCh){var self=this;self.attivaStep(propCh.active);var nomeActive=$("td.step.active > .labelStep").text();$("td.paginaAttivaResponsive").text(nomeActive);// return propCh.location.action === 'POP'; // hack bugFix
return true;}},{key:"componentDidMount",value:function componentDidMount(){var self=this;self.attivaStep(self.props.active);var nomeActive=$("td.step.active > .labelStep").text();$("td.paginaAttivaResponsive").text(nomeActive);}},{key:"render",value:function render(){var self=this;var voci=[];var i,link;for(i in this.props.pagine){if(i>0){link=React.createElement("div",{className:"link"});}if(this.props.pagine[i].visible!=false){voci.push(React.createElement("td",{className:"step",key:i},link,React.createElement("div",{className:"numberStep"},React.createElement("span",null,this.props.pagine[i].id)),React.createElement("div",{className:"labelStep"},this.props.pagine[i].nome)));}}return React.createElement("div",{className:"headerStepCustom"},React.createElement("table",{className:"allStep"},React.createElement("tbody",null,React.createElement("tr",null,voci),React.createElement("tr",null,React.createElement("td",{className:"paginaAttivaResponsive active",colSpan:"6",style:{textAlign:"center"}})))));}}]);return HeaderStep;}(React.Component);;

},{}],124:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 01/03/17.
 */var Loader=exports.Loader=function(_React$Component){_inherits(Loader,_React$Component);function Loader(props){_classCallCheck(this,Loader);var _this=_possibleConstructorReturn(this,(Loader.__proto__||Object.getPrototypeOf(Loader)).call(this,props));_this.state={"testo":_this.props.testo};return _this;}_createClass(Loader,[{key:"componentDidMount",value:function componentDidMount(){}},{key:"shouldComponentUpdate",value:function shouldComponentUpdate(propCh,stateCh){var self=this;return true;}},{key:"render",value:function render(){var className="",container="";if(this.props.type=="loader"){className="spinner";container="";}else{className="hidden";container="large";}return React.createElement("div",{className:"myLoader"},React.createElement("div",{className:"cont "+container},this.props.testo,React.createElement("br",null),React.createElement("div",{className:className},React.createElement("div",{className:"rect1"}),React.createElement("div",{className:"rect2"}),React.createElement("div",{className:"rect3"}),React.createElement("div",{className:"rect4"})),React.createElement("br",null),React.createElement("span",{id:"textLoader"})));}}]);return Loader;}(React.Component);

},{}],125:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.LookupField=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _MainScope=require("../js-tools/MainScope");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 30/01/17.
 */var LookupField=exports.LookupField=function(_React$Component){_inherits(LookupField,_React$Component);function LookupField(props){_classCallCheck(this,LookupField);var _this=_possibleConstructorReturn(this,(LookupField.__proto__||Object.getPrototypeOf(LookupField)).call(this,props));_this.props=props;_this.onBlur=_this.onBlur.bind(_this);_this.updateField=_this.updateField.bind(_this);_this.componentDidMount=_this.componentDidMount.bind(_this);_this.state={campo:_this.props.campo};return _this;}_createClass(LookupField,[{key:"onBlur",value:function onBlur(){return this.updateField();}},{key:"updateField",value:function updateField(obj){var campo=this.state.campo;var self=this;if(!campo.anagraficaValues){campo.anagraficaValues=[];}if(obj.action==="add"){campo.anagraficaValues.push(obj.item);}else if(obj.action==="remove"){var array=campo.anagraficaValues;var index=array.indexOf(obj.item);if(index>-1){array.splice(index,1);}campo.anagraficaValues=array;}self.setState({"campo":campo});_MainScope.MainScope.setField(campo);}},{key:"componentDidMount",value:function componentDidMount(){var self=this;var campo=this.props.campo;var nodo=document.getElementById(campo.father+"-"+campo.name);var $el=$(nodo).closest(".form-group");$el.addClass("form-group-destinazione");var input=$el.find("input");var url=window.configApp["anagrafica_url"]+"?";var parametroIdQueryString='idParametro='+campo["id"];if(window.Liferay){var authToken='&p_auth='+Liferay.authToken;}else{var authToken="";}url=url+parametroIdQueryString+authToken;if(!campo.anagraficaValues){campo.anagraficaValues=[];}if(campo.config&&JSON.parse(campo.config)){var hintText=JSON.parse(campo.config).descrizioneElenco;}else{var hintText="cerca dall'elenco";}$el.find("input").tokenInput(url,{theme:"facebook",propertyToSearch:"val",queryParam:"searchValue",placeholder:campo.label,tokenValue:"idAnagraficaParametro",prePopulate:campo.anagraficaValues,// hintText: "cerca dall'elenco",
hintText:hintText,onAdd:function onAdd(item){self.updateField({"id":campo.name,"item":item,"action":"add"});},onDelete:function onDelete(item){self.updateField({"id":campo.name,"item":item,"action":"remove"});},tokenLimit:1,resultsLimit:100,preventDuplicates:true,minChars:2,resultsFormatter:function resultsFormatter(item){return"<li class='myTokenize'><p>"+item.val+" <b style='color: red'>"+item.descrizione+"</b></p></li>";},tokenFormatter:function tokenFormatter(item){return"<li class='myTokenize'><p title=\""+item.descrizione+"\">"+item.val+"</p></li>";},onReady:function onReady(){$("#token-input-"+campo.father+"-"+campo.name).addClass("form-control");},classes:{tokenList:"token-input-list-facebook",token:"token-input-token-facebook",tokenDelete:"token-input-delete-token-facebook",selectedToken:"token-input-selected-token-facebook",highlightedToken:"token-input-highlighted-token-facebook",dropdown:"token-input-dropdown-facebook",dropdownItem:"token-input-dropdown-item-facebook",dropdownItem2:"token-input-dropdown-item2-facebook",selectedDropdownItem:"token-input-selected-dropdown-item-facebook",inputToken:"token-input-input-token-facebook"}});}},{key:"render",value:function render(){var self=this;var campo=this.props.campo;var classReadonly="";if(campo.readonly){classReadonly="readonly";}return React.createElement("span",{className:classReadonly},React.createElement("div",{className:"content-tags"},React.createElement("input",{onBlur:this.onBlur.bind(this),type:"text",id:campo.father+"-"+campo.name,className:"form-control",name:campo.name,placeholder:campo.label})));}}]);return LookupField;}(React.Component);

},{"../js-tools/MainScope":102}],126:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.LookupOBJField=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _MainScope=require("../js-tools/MainScope");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 30/01/17.
 * Questo componente è solo un concept per ora
 * 
 */var LookupOBJField=exports.LookupOBJField=function(_React$Component){_inherits(LookupOBJField,_React$Component);function LookupOBJField(props){_classCallCheck(this,LookupOBJField);var _this=_possibleConstructorReturn(this,(LookupOBJField.__proto__||Object.getPrototypeOf(LookupOBJField)).call(this,props));_this.props=props;_this.onBlur=_this.onBlur.bind(_this);_this.updateField=_this.updateField.bind(_this);_this.componentDidMount=_this.componentDidMount.bind(_this);_this.state={campo:_this.props.campo};return _this;}_createClass(LookupOBJField,[{key:"onBlur",value:function onBlur(){return this.updateField();}},{key:"updateField",value:function updateField(obj){var campo=this.state.campo;var self=this;if(obj.action==="add"){campo.value=obj.item.value;}else if(obj.action==="remove"){campo.value="";/*
       var destinazioni = campo.value;
       var index = value.indexOf(obj.item);
       if (index > -1) {
       destinazioni.splice(index, 1);
       }
       campo.anagraficaValues = destinazioni;
       */}self.setState({"campo":campo});_MainScope.MainScope.setField(campo);}},{key:"componentDidMount",value:function componentDidMount(){var self=this;var campo=this.props.campo;var nodo=document.getElementById(campo.father+"-"+campo.name);var $el=$(nodo).closest(".form-group");$el.addClass("form-group-destinazione");var input=$el.find("input");var prepopulate=[];if(campo.value){var obj={"id":campo.name,"value":campo.value};prepopulate.push(obj);}if(campo.config&&JSON.parse(campo.config)){var hintText=JSON.parse(campo.config).descrizioneElenco;}else{var hintText="cerca dall'elenco";}$el.find("input").tokenInput(campo.array,{theme:"facebook",propertyToSearch:"value",placeholder:campo.label,queryParam:"searchValue",// hintText: "cerca dall'elenco",
hintText:hintText,tokenValue:"idAnagraficaParametro",prePopulate:prepopulate,onAdd:function onAdd(item){self.updateField({"id":campo.name,"item":item,"action":"add"});},onDelete:function onDelete(item){self.updateField({"id":campo.name,"item":item,"action":"remove"});},tokenLimit:1,resultsLimit:100,preventDuplicates:true,minChars:2,resultsFormatter:function resultsFormatter(item){return"<li class='myTokenize'><p>"+item.value+"</p><span class=\"descr\">"+item.descrizione+"</span></li>";},tokenFormatter:function tokenFormatter(item){return"<li class='myTokenize'><p title=\""+item.descrizione+"\">"+item.value+"</p></li>";},onReady:function onReady(){$("#token-input-"+campo.father+"-"+campo.name).addClass("form-control");},classes:{tokenList:"token-input-list-facebook",token:"token-input-token-facebook",tokenDelete:"token-input-delete-token-facebook",selectedToken:"token-input-selected-token-facebook",highlightedToken:"token-input-highlighted-token-facebook",dropdown:"token-input-dropdown-facebook",dropdownItem:"token-input-dropdown-item-facebook",dropdownItem2:"token-input-dropdown-item2-facebook",selectedDropdownItem:"token-input-selected-dropdown-item-facebook",inputToken:"token-input-input-token-facebook"}});}},{key:"render",value:function render(){var self=this;var campo=this.props.campo;var classReadonly="";if(campo.readonly){classReadonly="readonly";}return React.createElement("span",{className:classReadonly},React.createElement("div",{className:"content-tags"},React.createElement("input",{onBlur:this.onBlur.bind(this),type:"text",id:campo.father+"-"+campo.name,className:"form-control",name:campo.name,placeholder:campo.label})));}}]);return LookupOBJField;}(React.Component);

},{"../js-tools/MainScope":102}],127:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.MultiField=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _MainScope=require("../js-tools/MainScope");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 30/01/17.
 */var MultiField=exports.MultiField=function(_React$Component){_inherits(MultiField,_React$Component);function MultiField(props){_classCallCheck(this,MultiField);var _this=_possibleConstructorReturn(this,(MultiField.__proto__||Object.getPrototypeOf(MultiField)).call(this,props));_this.componentDidMount=_this.componentDidMount.bind(_this);_this.onBlur=_this.onBlur.bind(_this);_this.change=_this.change.bind(_this);_this.state={campo:_this.props.campo};return _this;}_createClass(MultiField,[{key:"componentDidMount",value:function componentDidMount(){var campo=this.props.campo;var $el=$("#"+campo.father+"-"+campo.name).closest(".form-group");var input=$el.find("input");}},{key:"onBlur",value:function onBlur(){return this.change();}},{key:"change",value:function change(){var self=this;var campo=this.props.campo;var $el=$("#"+campo.father+"-"+campo.name).closest(".form-group");var input=$el.find("input");var state=this.state;state.campo.value=input.val();var campo=state.campo;self.setState({"campo":campo});_MainScope.MainScope.setField(campo);}},{key:"render",value:function render(){var self=this;var campo=this.props.campo;var tipo=this.props.tipo;var returnValue;if(tipo=="label"){returnValue=React.createElement("span",null,campo.value);}else{returnValue=React.createElement("span",null,React.createElement("input",{type:"text",id:campo.father+"-"+campo.name,className:"form-control",name:campo.name,onChange:this.change,onBlur:this.onBlur.bind(this),autoComplete:"off",value:campo.value,placeholder:campo.label}));}return returnValue;}}]);return MultiField;}(React.Component);;

},{"../js-tools/MainScope":102}],128:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.NumberField=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _MainScope=require("../js-tools/MainScope");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 30/01/17.
 */var NumberField=exports.NumberField=function(_React$Component){_inherits(NumberField,_React$Component);function NumberField(props){_classCallCheck(this,NumberField);var _this=_possibleConstructorReturn(this,(NumberField.__proto__||Object.getPrototypeOf(NumberField)).call(this,props));_this.componentDidMount=_this.componentDidMount.bind(_this);_this.onBlur=_this.onBlur.bind(_this);_this.change=_this.change.bind(_this);_this.state={campo:_this.props.campo};return _this;}_createClass(NumberField,[{key:"componentDidMount",value:function componentDidMount(){var self=this;var campo=this.props.campo;var nodo=document.getElementById(campo.father+"-"+campo.name);$(nodo).on("setField",function(){return self.change();});var $el=$(nodo).closest(".form-group");var input=$el.find("input");}},{key:"onBlur",value:function onBlur(){return this.change();}},{key:"change",value:function change(){var self=this;var campo=this.props.campo;var nodo=document.getElementById(campo.father+"-"+campo.name);var $el=$(nodo).closest(".form-group");var input=$el.find("input");var state=this.state;if(!isNaN(input.val())){state.campo.value=input.val();}var campo=state.campo;self.setState({"campo":campo});_MainScope.MainScope.setField(campo);}},{key:"render",value:function render(){var self=this;var campo=this.props.campo;if(!campo.maxLength){campo.maxLength=255;}return React.createElement("span",null,React.createElement("input",{type:"text",id:campo.father+"-"+campo.name,className:"form-control",name:campo.name,maxLength:campo.maxLength,onChange:this.change,onBlur:this.onBlur.bind(this),autoComplete:"off",value:campo.value,placeholder:campo.label}));}}]);return NumberField;}(React.Component);;

},{"../js-tools/MainScope":102}],129:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.OggettiAssicurati=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _DinamicFieldSet=require("./DinamicFieldSet");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 01/03/17.
 */var OggettiAssicurati=exports.OggettiAssicurati=function(_React$Component){_inherits(OggettiAssicurati,_React$Component);function OggettiAssicurati(props){_classCallCheck(this,OggettiAssicurati);var _this=_possibleConstructorReturn(this,(OggettiAssicurati.__proto__||Object.getPrototypeOf(OggettiAssicurati)).call(this,props));_this.props=props;_this.componentDidMount=_this.componentDidMount.bind(_this);_this.state={};return _this;}_createClass(OggettiAssicurati,[{key:"componentDidMount",value:function componentDidMount(){}},{key:"render",value:function render(){var assicurati=this.props.assicurati,parametri=[],righe=[],i;if(assicurati&&assicurati.length>0){for(i in assicurati){parametri=assicurati[i].parametri;righe.push(React.createElement(_DinamicFieldSet.DinamicFieldSet,{father:"oggettiAssicurati["+i+"]",key:i,campi:parametri}));}}return React.createElement("div",null,React.createElement("fieldset",{className:"oggettiAssicurati"},React.createElement("legend",null,"Lista Assicurati"),righe));}}]);return OggettiAssicurati;}(React.Component);

},{"./DinamicFieldSet":116}],130:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.Pagamento=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _Loader=require("./Loader");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 07/03/17.
 */var Pagamento=exports.Pagamento=function(_React$Component){_inherits(Pagamento,_React$Component);function Pagamento(props){_classCallCheck(this,Pagamento);var _this=_possibleConstructorReturn(this,(Pagamento.__proto__||Object.getPrototypeOf(Pagamento)).call(this,props));_this.props=props;_this.chiudiLoader=_this.chiudiLoader.bind(_this);// this.onBlur = this.onBlur.bind(this);
// this.updateField = this.updateField.bind(this);
// this.shouldComponentUpdate = this.shouldComponentUpdate.bind(this);
// this.trovaPagina = this.trovaPagina.bind(this);
// this.state = {};
return _this;}_createClass(Pagamento,[{key:"componentDidMount",value:function componentDidMount(){var url=window.configApp.paymentProviderUrl;var method="POST";//if (location.hostname === "localhost") {
// method = "GET";
document.getElementById('iframePagamento').contentWindow.location.href=url;/*} else {
      $.ajax({
        url: url,
        method: method,
        dataType: "json",
        success: function (data) {
          var url = data.urlPagamento + '%26p_auth%3D' + Liferay.authToken;
          console.log("url per l'iframe:", url)
          document.getElementById('iframePagamento').contentWindow.location.href = url;

          $(".myLoader").show();
        },
        error: function (error) {
          console.error("errori nel reperimento della url:", error);
        }
      });
    }*/}},{key:"chiudiLoader",value:function chiudiLoader(){$(".myLoader").hide();}},{key:"render",value:function render(){var testo="caricamento in corso";var tipo="loader";return React.createElement("div",{className:"iframeContainer"},React.createElement("div",{className:"col-xs-12 col-sm-12 col-md-12 col-lg-12"}),React.createElement("div",{className:"overlayIframe"},React.createElement("div",{className:"headOverlay"},React.createElement("h4",null,"Limitazione di pagamento"),React.createElement("p",null,"Sono accettate solo le carte intestate a persone fisiche; non \xE8 possibile pagare la polizza con una carta di credito intestata a persona giuridica seppure personalizzata.")),React.createElement("div",{className:"bodyOverlay",style:{'overflow':'auto','WebkitOverflowScrolling':'touch'}},React.createElement("iframe",{name:"iframePagamento",id:"iframePagamento",src:"",className:"iframePagamento",onLoad:this.chiudiLoader,scrolling:"yes",style:{"position":"absolute"}}),React.createElement(_Loader.Loader,{type:tipo,testo:testo}))));}}]);return Pagamento;}(React.Component);

},{"./Loader":124}],131:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.Page=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _HeaderStep=require("./HeaderStep");var _PageComposer=require("./PageComposer");var _MainScope=require("../js-tools/MainScope");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 14/02/17.
 */var Page=exports.Page=function(_React$Component){_inherits(Page,_React$Component);function Page(props){_classCallCheck(this,Page);var _this=_possibleConstructorReturn(this,(Page.__proto__||Object.getPrototypeOf(Page)).call(this,props));_this.props=props;// this.onBlur = this.onBlur.bind(this);
// this.updateField = this.updateField.bind(this);
_this.componentDidMount=_this.componentDidMount.bind(_this);_this.shouldComponentUpdate=_this.shouldComponentUpdate.bind(_this);_this.trovaPagina=_this.trovaPagina.bind(_this);_this.scope={pagina:{}};_this.state={campo:_this.props.campo};return _this;}_createClass(Page,[{key:"trovaPagina",value:function trovaPagina(idStep){var self=this;var pagine=this.props.route.pagine,i=undefined;for(i in pagine){if(pagine[i].id==parseInt(idStep)){self.scope.pagina=pagine[i];}}}},{key:"componentDidMount",value:function componentDidMount(){_MainScope.MainScope.set("currentPage",this.scope.pagina);}},{key:"shouldComponentUpdate",value:function shouldComponentUpdate(propCh,stateCh){this.trovaPagina(propCh.params.idStep);_MainScope.MainScope.set("currentPage",this.scope.pagina);return true;}},{key:"render",value:function render(){var self=this;self.trovaPagina(self.props.params.idStep);return React.createElement("div",{className:"pageReact"},React.createElement("div",{className:"row"},React.createElement(_HeaderStep.HeaderStep,{active:self.props.params.idStep,pagine:self.props.route.pagine})),React.createElement("div",{className:"row"},React.createElement(_PageComposer.PageComposer,{parametri:self.props.params,pagina:self.scope.pagina})));}}]);return Page;}(React.Component);

},{"../js-tools/MainScope":102,"./HeaderStep":123,"./PageComposer":132}],132:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.PageComposer=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _FormFromUrl=require("./FormFromUrl");var _Preventivo=require("./Preventivo");var _DatiPersonali=require("./DatiPersonali");var _Sinottico=require("./Sinottico");var _Pagamento=require("./Pagamento");var _Redirect=require("./Redirect");var _Acquisto=require("./Acquisto");var _MainScope=require("../js-tools/MainScope");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 14/02/17.
 */var myComposer={"FormFromUrl":_FormFromUrl.FormFromUrl,"Preventivo":_Preventivo.Preventivo,"Sinottico":_Sinottico.Sinottico,"DatiPersonali":_DatiPersonali.DatiPersonali,"Redirect":_Redirect.Redirect,"Pagamento":_Pagamento.Pagamento,"Acquisto":_Acquisto.Acquisto};var PageComposer=exports.PageComposer=function(_React$Component){_inherits(PageComposer,_React$Component);function PageComposer(props){_classCallCheck(this,PageComposer);var _this=_possibleConstructorReturn(this,(PageComposer.__proto__||Object.getPrototypeOf(PageComposer)).call(this,props));_this.props=props;_this.scope={"Componente":React.createElement("div",null),"campi":[]};return _this;}_createClass(PageComposer,[{key:"render",value:function render(){var self=this;var pagina=self.props.pagina;self.scope.Componente=React.createElement("div",null);if(pagina.sourceData){if(pagina.sourceData.url){self.scope.Componente=React.createElement(_FormFromUrl.FormFromUrl,{pagina:pagina,url:window.configApp[pagina.sourceData.url]});}else if(pagina.sourceData.component){var Component=myComposer[pagina.sourceData.component];var paginaCont=_MainScope.MainScope.get("pagina"+pagina.id);self.scope.Componente=React.createElement(Component,{parametriUrl:this.props.parametri,pagina:pagina,data:pagina.id,content:paginaCont});}}else{self.scope.Componente=React.createElement("div",null);}return React.createElement("div",{className:"pageComposer"},self.scope.Componente);}}]);return PageComposer;}(React.Component);

},{"../js-tools/MainScope":102,"./Acquisto":105,"./DatiPersonali":114,"./FormFromUrl":121,"./Pagamento":130,"./Preventivo":134,"./Redirect":136,"./Sinottico":139}],133:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.Parametri=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _MainScope=require("../js-tools/MainScope");var _DinamicField=require("./DinamicField");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 06/03/17.
 */var Parametri=exports.Parametri=function(_React$Component){_inherits(Parametri,_React$Component);function Parametri(props){_classCallCheck(this,Parametri);var _this=_possibleConstructorReturn(this,(Parametri.__proto__||Object.getPrototypeOf(Parametri)).call(this,props));_this.props=props;return _this;}_createClass(Parametri,[{key:"render",value:function render(){var polizza=_MainScope.MainScope.getPolizza(),parametri=polizza.parametri,i,parametriRow=[];for(i in parametri){var parametro=parametri[i];parametro.father="parametri";parametro.readonly=true;if(parametro.visible){parametriRow.push(React.createElement("div",{key:i},React.createElement("span",{className:"grassetto"},parametro.label," :")," ",React.createElement(_DinamicField.DinamicField,{campo:parametro})));}}return React.createElement("div",null,parametriRow);}}]);return Parametri;}(React.Component);;

},{"../js-tools/MainScope":102,"./DinamicField":115}],134:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.Preventivo=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _MainScope=require("../js-tools/MainScope");var _GaranziaPrevTable=require("./GaranziaPrevTable");var _DinamicField=require("./DinamicField");var _FooterFlow=require("./FooterFlow");var _Riepilogo=require("./Riepilogo");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 14/02/17.
 */var Preventivo=exports.Preventivo=function(_React$Component){_inherits(Preventivo,_React$Component);function Preventivo(props){_classCallCheck(this,Preventivo);var _this=_possibleConstructorReturn(this,(Preventivo.__proto__||Object.getPrototypeOf(Preventivo)).call(this,props));_this.props=props;return _this;}_createClass(Preventivo,[{key:"render",value:function render(){var polizza=this.props.content;var prodottiHeader=[];var ig,ip,prodotti=[],garanzie=[],garanzieRow=[],parametri,totale;if(!polizza){polizza=_MainScope.MainScope.getPolizza();}if(polizza){prodotti=polizza.prodottoList;garanzie=polizza.garanzie;parametri=polizza.parametri;_MainScope.MainScope.setPolizza("prodottoList",polizza.prodottoList);_MainScope.MainScope.setPolizza("garanzie",polizza.garanzie);_MainScope.MainScope.setPolizza("parametri",polizza.parametri);_MainScope.MainScope.setPolizza("prodottoSelected",polizza.prodottoSelected);_MainScope.MainScope.setPolizza("prodottoAttivo",polizza.prodottoAttivo);}for(ig in garanzie){garanzieRow.push(React.createElement(_GaranziaPrevTable.GaranziaPrevTable,{key:"gar-"+ig,garanzia:garanzie[ig],prodotti:prodotti}));}for(ip in prodotti){prodottiHeader.push(React.createElement("th",{key:"prodH-"+ip},prodotti[ip].nome));}if(prodottiHeader.length==1){prodottiHeader=[React.createElement("th",{key:"prodH-"+ip},"Massimali")];}return React.createElement("div",{className:"row preventivo"},React.createElement("div",{className:"col-md-6 col-md-push-6"},React.createElement(_Riepilogo.Riepilogo,null)),React.createElement("div",{className:"col-md-6 col-md-pull-6"},React.createElement("table",{className:"tabellaPreventivo"},React.createElement("thead",null,React.createElement("tr",null,React.createElement("th",null),React.createElement("th",null,polizza.prodottoAttivo.nome)),React.createElement("tr",null,React.createElement("th",null),React.createElement("th",null,React.createElement("hr",null))),React.createElement("tr",null,React.createElement("th",null,"Garanzie"),prodottiHeader)),React.createElement("tbody",null,garanzieRow),React.createElement("tfoot",null))),React.createElement(_FooterFlow.FooterFlow,{pagina:this.props.pagina}));}}]);return Preventivo;}(React.Component);

},{"../js-tools/MainScope":102,"./DinamicField":115,"./FooterFlow":119,"./GaranziaPrevTable":122,"./Riepilogo":137}],135:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.Questionario=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _Domanda=require("./Domanda");var _MainScope=require("../js-tools/MainScope");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 11/04/17.
 */var Questionario=exports.Questionario=function(_React$Component){_inherits(Questionario,_React$Component);function Questionario(props){_classCallCheck(this,Questionario);var _this=_possibleConstructorReturn(this,(Questionario.__proto__||Object.getPrototypeOf(Questionario)).call(this,props));_this.props=props;_this.componentDidMount=_this.componentDidMount.bind(_this);_this.toggleQuest=_this.toggleQuest.bind(_this);_this.validaQuestionario=_this.validaQuestionario.bind(_this);_this.state={survey:JSON.parse(_MainScope.MainScope.getPolizza("survey")),error:[]};return _this;}_createClass(Questionario,[{key:"componentDidMount",value:function componentDidMount(){var self=this;this.validaQuestionario();$(".risposta.dinamica").on("click",function(){setTimeout(function(){self.validaQuestionario();},0);});}},{key:"toggleQuest",value:function toggleQuest(){var self=this;if(self.validaQuestionario()){$("#Questionario").toggle();}window.scrollTo(0,0);}},{key:"validaQuestionario",value:function validaQuestionario(){var self=this,valid=false;var state=self.state;state.error=[];/* *
     if (($(".risposta.dinamica").find(".selected").length) === ($(".risposta.dinamica").length)) {
     valid = true;
     state.error = "";
     } else {
     state.error = "Compilare tutto il questionario";
     }
     /* */// inizio MOD v16
if($(".risposta.dinamica").find(".selected").length!==$(".risposta.dinamica").length){state.error.push("ATTENZIONE! Non è stata fornita risposta a una o più domande. Se si vuole proseguire comunque, cliccare sul tasto Avanti.");}if($($(".risposta.dinamica").find(".selected[title=No]")).length>0){state.error.push("ATTENZIONE! Il contratto in emissione non è coerente con le risposte ricevute.");}// fine MOD v16
valid=true;// state.error = "";
/* */self.setState(state);return valid;}},{key:"render",value:function render(){var survey=this.state.survey,self=this,domande=[],title="",testoErrori=[];if(survey){for(var i in survey.questions){var domanda=survey.questions[i];domande.push(React.createElement(_Domanda.Domanda,{key:"question_"+i,domanda:domanda,subQuestComp:_Domanda.Domanda}));}title=survey.title;}for(var _i in self.state.error){testoErrori.push(React.createElement("p",{key:"error_"+_i},self.state.error[_i]));}return React.createElement("div",null,React.createElement("div",{className:"editStep",style:{"position":"inherit","float":"left"}},React.createElement("a",{href:"javascript:void(0)",className:"glyphicon glyphicon-pencil",onClick:self.toggleQuest},React.createElement("span",null,"Modifica Questionario Adeguatezza"))),React.createElement("div",{id:"Questionario",className:"myOverlay"},React.createElement("div",{className:"cont large row"},React.createElement("fieldset",{className:"col-xs-12 col-sm-12 col-md-12 col-lg-12"},React.createElement("h3",null,title),React.createElement("div",{className:"questionarioReact"},React.createElement("ol",{start:"0"},React.createElement("li",null,React.createElement("span",{className:"risposta"},React.createElement("div",{className:"valore"},"S\xCC"),React.createElement("div",{className:"valore"},"NO"))),domande)),React.createElement("div",{className:"has-error"},React.createElement("span",{className:"control-label"},testoErrori)),React.createElement("div",{className:"btn btn-primary right",onClick:self.toggleQuest},"Salva il questionario")))));}}]);return Questionario;}(React.Component);

},{"../js-tools/MainScope":102,"./Domanda":117}],136:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.Redirect=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _StringUtils=require("../js-tools/StringUtils");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 07/03/17.
 */var Redirect=exports.Redirect=function(_React$Component){_inherits(Redirect,_React$Component);function Redirect(){_classCallCheck(this,Redirect);return _possibleConstructorReturn(this,(Redirect.__proto__||Object.getPrototypeOf(Redirect)).apply(this,arguments));}_createClass(Redirect,[{key:"componentDidMount",value:function componentDidMount(){$(".headerStepCustom").parent().remove();$("#iframeOverlay").css("background-color","white");$("#iframeOverlay").show();}},{key:"redirect",value:function redirect(){top.window.location.hash='#/step/4';}},{key:"render",value:function render(){var self=this;var method="POST";var esitoDEF="KO";var esito=this.props.parametriUrl.esito,visibile="";var codiceEsito=this.props.parametriUrl.codiceEsito;var messaggio="Il pagamento non è andato a buon fine. La preghiamo di riprovare.";if(location.href.split("&esito=")&&location.href.split("&esito=")[1]){esitoDEF=location.href.split("&esito=")[1].split("&")[0];}//if (location.hostname === "localhost") {
method="GET";/* */if(esito=="true"){esitoDEF="OK";}else{esitoDEF="KO";}/* *///}
if(esito=="true"&&codiceEsito!==0&&esitoDEF=="OK"){// top.window.location.hash = '#/step/6';
/* */$.ajax({url:window.configApp["finalizzaPolizza"],method:method,success:function success(){top.window.location.hash='#/step/6';},error:function error(){top.window.location.hash='#/step/4';}});/* */}else{switch(codiceEsito){case"122":messaggio="Il pagamento non è andato a buon fine. Il contratto non è stato emesso per raggiunto limite massimo di tentativi di pagamento. La preghiamo di procedere ad una nuova emissione.";break;}}if(esitoDEF!=="OK"){var html=React.createElement("div",{className:"myOverlay",id:"iframeOverlay"},React.createElement("div",{className:"cont large row"},React.createElement("fieldset",{className:"col-xs-12 col-sm-12 col-md-12 col-lg-12"},React.createElement("h3",null,"Esito del pagamento"),React.createElement("div",{className:"questionarioReact"},React.createElement("p",null,messaggio)),React.createElement("div",{className:"btn btn-primary right",onClick:this.redirect},"OK"))));}else{var html=React.createElement("span",null);}return React.createElement("div",null,html);}}]);return Redirect;}(React.Component);

},{"../js-tools/StringUtils":103}],137:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.Riepilogo=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _DinamicField=require("./DinamicField");var _MainScope=require("../js-tools/MainScope");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 01/03/17.
 */var Riepilogo=exports.Riepilogo=function(_React$Component){_inherits(Riepilogo,_React$Component);function Riepilogo(props){_classCallCheck(this,Riepilogo);var _this=_possibleConstructorReturn(this,(Riepilogo.__proto__||Object.getPrototypeOf(Riepilogo)).call(this,props));_this.props=props;_this.state={};return _this;}_createClass(Riepilogo,[{key:"render",value:function render(){var polizza=_MainScope.MainScope.getPolizza();var parametriRow=[],parametri=polizza.parametri,is,totale=polizza.prodottoAttivo.totale,totaleTasse=polizza.prodottoAttivo.tasse,totaleFixed,totaleTasseFixed;if(totale){totaleFixed=totale.toFixed(2);}if(totaleTasse){totaleTasseFixed=totaleTasse.toFixed(2);}for(is in parametri){var parametro=parametri[is];parametro.father="parametri";parametro.readonly=true;var html=React.createElement("div",{key:is,className:"row"},React.createElement("div",{className:"col-xs-12 col-sm-12 col-md-6 col-lg-6 grassetto"},parametro.label," :"),React.createElement("div",{className:"col-xs-12 col-sm-12 col-md-6 col-lg-6"},React.createElement(_DinamicField.DinamicField,{campo:parametro})));if(!parametro.visible){html="";}parametriRow.push(html);}return React.createElement("div",{className:"dettaglio"},React.createElement("h1",null,"Riepilogo Viaggio:"),parametriRow,React.createElement("div",{className:"row grassetto"},React.createElement("div",{className:"col-xs-12 col-sm-12 col-md-6 col-lg-6"},"Totale :"),React.createElement("div",{className:"col-xs-12 col-sm-12 col-md-6 col-lg-6"},totaleFixed," \u20AC"),React.createElement("div",{className:"col-xs-12 col-sm-12 col-md-6 col-lg-6"},"Di cui imposte :"),React.createElement("div",{className:"col-xs-12 col-sm-12 col-md-6 col-lg-6"},totaleTasseFixed," \u20AC")),React.createElement("div",{className:"row grassetto"},React.createElement("div",{className:"col-xs-12 col-sm-12 col-md-12 col-lg-12"},React.createElement("a",{target:"_blank",download:window.configApp.fascicoloUrl,href:window.configApp.fascicoloUrl},"Visualizza il fascicolo informativo"))));}}]);return Riepilogo;}(React.Component);

},{"../js-tools/MainScope":102,"./DinamicField":115}],138:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.Risposta=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _MainScope=require("../js-tools/MainScope");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 11/04/17.
 */var Risposta=exports.Risposta=function(_React$Component){_inherits(Risposta,_React$Component);function Risposta(props){_classCallCheck(this,Risposta);var _this=_possibleConstructorReturn(this,(Risposta.__proto__||Object.getPrototypeOf(Risposta)).call(this,props));_this.props=props;_this.setAnswer=_this.setAnswer.bind(_this);_this.toggleAnswer=_this.toggleAnswer.bind(_this);// this.onBlur = this.onBlur.bind(this);
// this.updateField = this.updateField.bind(this);
// this.shouldComponentUpdate = this.shouldComponentUpdate.bind(this);
// this.trovaPagina = this.trovaPagina.bind(this);
_this.state={risposte:_this.props.risposte};return _this;}_createClass(Risposta,[{key:"setAnswer",value:function setAnswer(index1,index2,index3,answer){/*
        console.info("domanda", index1);
        console.info("sottodomanda", index3);
        console.info("risposta", index2);
        console.info("answer", answer[index2]);
        */var questionario=JSON.parse(_MainScope.MainScope.getPolizza("survey"));if(index3!=undefined){questionario.questions[index1].subQuestions[index3].answers[index2].selected=answer[index2].selected;// questionario.questions[index1].subQuestions[index3].answers[index2] = answer[index2];
}else{questionario.questions[index1].answers[index2].selected=answer[index2].selected;// questionario.questions[index1].answers[index2] = answer[index2];
}// console.info("questionario", questionario);
_MainScope.MainScope.setPolizza("survey",JSON.stringify(questionario));window.questionario=questionario;}},{key:"toggleAnswer",value:function toggleAnswer(e,a){var self=this;var i=e.target.id.split("risposta_")[1];var classSelect="selected glyphicon glyphicon-check";var classUnSelect="glyphicon glyphicon-unchecked";var state=this.state,index1,index2,index3;for(var n in this.state.risposte){if(i!=n){state.risposte[n].selected=false;}}state.risposte[i].selected=!state.risposte[i].selected;var questionario=JSON.parse(_MainScope.MainScope.getPolizza("survey"));var answer=state.risposte[i];this.setState(state);if(questionario){questionario.questions.forEach(function(question,index1){var answers=question.answers;if(answers){// Questo è il caso delle domande di primo livello - Rug
answers.forEach(function(answer,index2){if(answer.name==$(e.target).data("name")){self.setAnswer(index1,index2,index3,self.state.risposte);}});}else{// Questo è il caso delle domande di secondo livello - Rug
var subQuestions=question.subQuestions;if(subQuestions){subQuestions.forEach(function(question,index3){var answers=question.answers;if(answers){answers.forEach(function(answer,index2){if(answer.name==$(e.target).data("name")){self.setAnswer(index1,index2,index3,self.state.risposte);}});}});}}});}}},{key:"render",value:function render(){var risposte=[];var classSelect="selected glyphicon glyphicon-check";var classUnSelect="glyphicon glyphicon-unchecked";for(var i in this.state.risposte){var risposta=this.state.risposte[i],myClass="";if(risposta.selected){myClass=classSelect;}else{myClass=classUnSelect;}risposte.push(React.createElement("div",{className:"valore "+myClass,id:"risposta_"+i,key:"risposta_"+i,onClick:this.toggleAnswer,"data-name":risposta.name,"data-selected":risposta.selected,"data-index":i,"data-value":risposta.value,title:risposta.value}));}var html=React.createElement("span",null);if(risposte.length>0){html=React.createElement("span",{className:"risposta dinamica"},risposte);}return html;}}]);return Risposta;}(React.Component);

},{"../js-tools/MainScope":102}],139:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.Sinottico=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _MainScope=require("../js-tools/MainScope");var _Riepilogo=require("./Riepilogo");var _EditStep=require("./EditStep");var _Parametri=require("./Parametri");var _Contraente=require("./Contraente");var _FooterFlow=require("./FooterFlow");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 03/03/17.
 */var Sinottico=exports.Sinottico=function(_React$Component){_inherits(Sinottico,_React$Component);function Sinottico(props){_classCallCheck(this,Sinottico);var _this=_possibleConstructorReturn(this,(Sinottico.__proto__||Object.getPrototypeOf(Sinottico)).call(this,props));_this.props=props;_this.state={};return _this;}_createClass(Sinottico,[{key:"render",value:function render(){var polizza=_MainScope.MainScope.getPolizza();var totale=polizza.prodottoAttivo.totale,totaleFixed;if(totale){totaleFixed=totale.toFixed(2);}return React.createElement("div",{className:"row"},React.createElement("div",{className:"col-xs-12 col-sm-12 col-md-12 col-lg-12"},React.createElement("p",null,"Ti preghiamo di verificare le informazioni immesse prima di procedere al pagamento.")),React.createElement("div",{className:"row"},React.createElement("div",{className:"col-xs-1 col-sm-1 col-md-1 col-lg-1"},"\xA0"),React.createElement("div",{className:"col-xs-10 col-sm-10 col-md-10 col-lg-10 dettaglio"},React.createElement("div",{className:"row"},React.createElement("div",{className:"col-xs-12 col-sm-12 col-md-6 col-lg-6"},React.createElement("div",{className:"row"},React.createElement("div",{className:"col-xs-12 col-sm-12 col-md-12 col-lg-12"},React.createElement("h4",null,"Informazioni di viaggio",React.createElement(_EditStep.EditStep,{step:1})),React.createElement(_Parametri.Parametri,null),React.createElement("span",{className:"grassetto"},"Totale : ",totaleFixed))),React.createElement("hr",null),React.createElement("div",{className:"row"},React.createElement("div",{className:"col-xs-12 col-sm-12 col-md-12 col-lg-12"},React.createElement("h4",null,"Prodotto scelto",React.createElement(_EditStep.EditStep,{testo:"Visualizza",step:2})),React.createElement("span",{className:"grassetto"},polizza.prodottoAttivo.nome),React.createElement("p",null,polizza.prodottoAttivo.descrizione)))),React.createElement("div",{className:"col-xs-12 col-sm-12 col-md-6 col-lg-6"},React.createElement("div",{className:"row"},React.createElement("div",{className:"col-xs-12 col-sm-12 col-md-12 col-lg-12"},React.createElement("h4",null,"Contraente",React.createElement(_EditStep.EditStep,{step:3}))),React.createElement("div",{className:"col-xs-12 col-sm-12 col-md-12 col-lg-12"},React.createElement(_Contraente.Contraente,null)))))),React.createElement("div",{className:"col-xs-1 col-sm-1 col-md-1 col-lg-1"},"\xA0")),React.createElement(_FooterFlow.FooterFlow,{pagina:this.props.pagina}));}}]);return Sinottico;}(React.Component);

},{"../js-tools/MainScope":102,"./Contraente":111,"./EditStep":118,"./FooterFlow":119,"./Parametri":133,"./Riepilogo":137}],140:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.TextField=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _MainScope=require("../js-tools/MainScope");function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 30/01/17.
 */var TextField=exports.TextField=function(_React$Component){_inherits(TextField,_React$Component);function TextField(props){_classCallCheck(this,TextField);var _this=_possibleConstructorReturn(this,(TextField.__proto__||Object.getPrototypeOf(TextField)).call(this,props));_this.componentDidMount=_this.componentDidMount.bind(_this);_this.onBlur=_this.onBlur.bind(_this);_this.change=_this.change.bind(_this);_this.state={campo:_this.props.campo};return _this;}_createClass(TextField,[{key:"componentDidMount",value:function componentDidMount(){var self=this;var campo=this.props.campo;var nodo=document.getElementById(campo.father+"-"+campo.name);$(nodo).on("setField",function(){return self.change();});var $el=$(nodo).closest(".form-group");var input=$el.find("input");}},{key:"onBlur",value:function onBlur(){return this.change();}},{key:"change",value:function change(){var self=this;var campo=this.props.campo;var nodo=document.getElementById(campo.father+"-"+campo.name);var $el=$(nodo).closest(".form-group");var input=$el.find("input");var state=this.state;state.campo.value=input.val();var campo=state.campo;self.setState(state);_MainScope.MainScope.setField(campo);}},{key:"render",value:function render(){var self=this;var campo=this.props.campo;if(!campo.maxLength){campo.maxLength=255;}return React.createElement("span",null,React.createElement("input",{type:"text",id:campo.father+"-"+campo.name,className:"form-control",name:campo.name,maxLength:campo.maxLength,onChange:this.change,onBlur:this.onBlur.bind(this),autoComplete:"off",value:campo.value,placeholder:campo.label}));}}]);return TextField;}(React.Component);

},{"../js-tools/MainScope":102}],141:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:true});var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}/**
 * Created by ruggerotrevisiol on 01/02/17.
 
 Questo Componente accetta un'unico parametro che è l'oggetto tooltip così costituito:
 {
 title:"inserire qui il titolo",
 content:"inserire qui il contenuto"
 }
 */var Tooltip=exports.Tooltip=function(_React$Component){_inherits(Tooltip,_React$Component);function Tooltip(props){_classCallCheck(this,Tooltip);var _this=_possibleConstructorReturn(this,(Tooltip.__proto__||Object.getPrototypeOf(Tooltip)).call(this,props));_this.props=props;_this.componentDidMount=_this.componentDidMount.bind(_this);_this.state={idTooltip:"tooltip_generic"+parseInt(Math.random()*new Date().getTime())};return _this;}_createClass(Tooltip,[{key:"componentDidMount",value:function componentDidMount(){var tooltip=this.props.tooltip;var $el=$("#"+this.state.idTooltip);if(tooltip){var tooltipContent=$('<p style="text-align:left;"><strong>'+tooltip.title+'</strong>'+tooltip.content+'</p>');if(tooltip.content.length>0){$el.tooltipster({content:tooltipContent,multiple:true});}}}},{key:"render",value:function render(){var self=this;var tooltip=this.props.tooltip;var html=React.createElement("span",null,"\xA0");if(tooltip){html=React.createElement("div",{id:this.state.idTooltip,className:"tooltipCustom"},"?");}return html;}}]);return Tooltip;}(React.Component);

},{}],142:[function(require,module,exports){
"use strict";var _App=require("./react-components/App");/**
 * Created by ruggerotrevisiol on 01/12/16.
 */window.bigFather=$("#contentReact")[0];var React=require('react');var detectmob=function detectmob(){console.log("window.innerWidth",window.innerWidth);console.log("window.innerHeight",window.innerHeight);if(window.innerWidth<=1024&&window.innerHeight<=640||navigator.userAgent.indexOf("iPad")>-1){return true;}else{return false;}};window.isMobile=detectmob();console.log("window.isMobile",window.isMobile);$(document).ready(function(){if(window.isMobile){$("#navbar-collapse-grid").addClass("collapse");$(".logo.default-logo").hide();}var datepicker=$.fn.datepicker.noConflict();// return $.fn.datepicker to previously assigned value
$.fn.bootstrapDP=datepicker;// give $().bootstrapDP the bootstrap-datepicker functionality
if(window.configApp&&window.configApp.configURL){$(".myLoader").show();$.ajax({url:window.configApp.configURL,dataType:"json",async:true,cache:false,method:"GET"}).then(function(data){$(".myLoader").hide();ReactDOM.render(React.createElement(_App.App,{classContainer:data.classContainer,pagine:data.pagine}),bigFather);/*
       $("a").on("click", function () {
       if ($(this).attr("href").indexOf("void(0)") == -1) {
       return confirm('Uscendo perderai i dati del tuo viaggio.\n Vuoi continuare?');
       } else {
       return true;
       }
       });
       */},function(error){$(".myLoader").hide();console.error("error",error);});}});

},{"./react-components/App":106,"react":97}]},{},[142]);
