module.exports = function (math) {
  var util = require('../../util/index'),

      Complex = require('../../type/Complex'),
      Unit = require('../../type/Unit'),

      isNumber = util.number.isNumber,
      isString = util.string.isString,
      isComplex = Complex.isComplex,
      isUnit = Unit.isUnit;

  /**
   * Import functions from an object or a module
   *
   * Syntax:
   *
   *    math.import(x)
   *
   * Examples:
   *
   *    var math = mathjs();
   *
   *    // define new functions and variables
   *    math.import({
   *      myvalue: 42,
   *      hello: function (name) {
   *        return 'hello, ' + name + '!';
   *      }
   *    });
   *
   *    // use the imported function and variable
   *    math.myvalue * 2;               // 84
   *    math.hello('user');             // 'hello, user!'
   *
   *    // import the npm module numbers
   *    // (must be installed first with `npm install numbers`)
   *    math.import('numbers');
   *
   *    math.fibonacci(7); // returns 13
   *
   * @param {String | Object} object  Object with functions to be imported.
   * @param {Object} [options]        Available options:
   *                                  {Boolean} override
   *                                      If true, existing functions will be
   *                                      overwritten. False by default.
   *                                  {Boolean} wrap
   *                                      If true (default), the functions will
   *                                      be wrapped in a wrapper function which
   *                                      converts data types like Matrix to
   *                                      primitive data types like Array.
   *                                      The wrapper is needed when extending
   *                                      math.js with libraries which do not
   */
  // TODO: return status information
  math['import'] = function math_import(object, options) {
    var num = arguments.length;
    if (num != 1 && num != 2) {
      throw new math.error.ArgumentsError('import', num, 1, 2);
    }

    var name;
    var opts = {
      override: false,
      wrap: true
    };
    if (options && options instanceof Object) {
      util.object.extend(opts, options);
    }

    if (isString(object)) {
      // a string with a filename

      // istanbul ignore else (we cannot unit test the else case in a node.js environment)
      if (typeof (require) !== 'undefined') {
        // load the file using require
        var _module = require(object);
        math_import(_module);
      }
      else {
        throw new Error('Cannot load module: require not available.');
      }
    }
    else if (typeof object === 'object') {
      // a map with functions
      for (name in object) {
        if (object.hasOwnProperty(name)) {
          var value = object[name];
          if (isSupportedType(value)) {
            _import(name, value, opts);
          }
          else {
            math_import(value);
          }
        }
      }
    }
    else {
      throw new TypeError('Object or module name expected');
    }
  };

  /**
   * Add a property to the math namespace and create a chain proxy for it.
   * @param {String} name
   * @param {*} value
   * @param {Object} options  See import for a description of the options
   * @private
   */
  function _import(name, value, options) {
    if (options.override || math[name] === undefined) {
      // add to math namespace
      if (options.wrap && typeof value === 'function') {
        // create a wrapper around the function
        math[name] = function () {
          var args = [];
          for (var i = 0, len = arguments.length; i < len; i++) {
            args[i] = arguments[i].valueOf();
          }
          return value.apply(math, args);
        };
      }
      else {
        // just create a link to the function or value
        math[name] = value;
      }

      // create a proxy for the Selector
      math.chaining.Selector.createProxy(name, value);
    }
  }

  /**
   * Check whether given object is a supported type
   * @param object
   * @return {Boolean}
   * @private
   */
  function isSupportedType(object) {
    return (typeof object == 'function') ||
        isNumber(object) || isString(object) ||
        isComplex(object) || isUnit(object);
    // TODO: add boolean?
  }
};