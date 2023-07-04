'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Kit = require('./Kit');

var _Message = require('./Message');

var _Message2 = _interopRequireDefault(_Message);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _RpcInvoker = function () {
    function _RpcInvoker(client, urlPrefix) {
        _classCallCheck(this, _RpcInvoker);

        this.client = client;
        this.urlPrefix = urlPrefix;
    }

    _createClass(_RpcInvoker, [{
        key: 'invoke',
        value: function invoke() {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            args = args || [];
            if (args.length < 1) {
                throw "Missing request parameter";
            }
            var msg;
            var req = args[0];
            if (typeof req == 'string') {
                var params = [];
                var len = args.length;
                for (var i = 1; i < len; i++) {
                    params.push(args[i]);
                }
                msg = new _Message2.default();
                msg.url = (0, _Kit.joinPath)(this.urlPrefix, req);
                msg.body = params;
            } else if (req.constructor == _Message2.default) {
                //just what we need
                msg = req;
            } else {
                msg = new _Message2.default();
                msg.replace(req);
            }
            return this.client._invoke(msg);
        }
    }, {
        key: 'proxyMethod',
        value: function proxyMethod(method) {
            var invoker = this;
            return function () {
                for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                    args[_key2] = arguments[_key2];
                }

                args = args || [];
                var len = args.length;
                var params = [];
                for (var i = 0; i < len; i++) {
                    params.push(args[i]);
                }

                var msg = new _Message2.default();
                msg.url = (0, _Kit.joinPath)(invoker.urlPrefix, method);
                msg.body = params;
                return invoker.invoke(msg);
            };
        }
    }]);

    return _RpcInvoker;
}();

var RpcInvoker = function (_Function) {
    _inherits(RpcInvoker, _Function);

    function RpcInvoker(client, urlPrefix) {
        var _ret;

        _classCallCheck(this, RpcInvoker);

        var _this = _possibleConstructorReturn(this, (RpcInvoker.__proto__ || Object.getPrototypeOf(RpcInvoker)).call(this));

        _this.invoker = new _RpcInvoker(client, urlPrefix);

        var invoker = _this.invoker;
        _this.proxy = new Proxy(invoker, {
            get: function get(target, name) {
                return name in target ? target[name] : invoker.proxyMethod(name);
            },
            apply: function apply(target, thisArg, argumentList) {
                return invoker.proxyMethod("").apply(undefined, _toConsumableArray(argumentList));
            }
        });
        return _ret = _this.proxy, _possibleConstructorReturn(_this, _ret);
    }

    return RpcInvoker;
}(Function);

exports.default = RpcInvoker;