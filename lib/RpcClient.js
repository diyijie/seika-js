'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Kit = require('./Kit');

var _WebsocketClient = require('./WebsocketClient');

var _WebsocketClient2 = _interopRequireDefault(_WebsocketClient);

var _RpcInvoker = require('./RpcInvoker');

var _RpcInvoker2 = _interopRequireDefault(_RpcInvoker);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Browser ajax client talk to zbus
 */
var AjaxClient = function () {
    function AjaxClient() {
        _classCallCheck(this, AjaxClient);

        this.authEnabled = false;
        this.apiKey = "";
        this.secretKey = "";
        this.signFields = "url,method,body,h.*";
    }

    _createClass(AjaxClient, [{
        key: 'invoke',
        value: function invoke(msg, beforeSend) {
            if (beforeSend) {
                beforeSend(msg);
            }
            if (!msg.method) msg.method = 'POST'; //set default value 
            if (!msg.headers['Content-Type']) msg.headers['Content-Type'] = 'application/json';

            if (this.authEnabled) {
                msg.headers.signFields = this.signFields;
                (0, _Kit.signMessage)(this.apiKey, this.secretKey, msg);
            }

            var method = msg.method;
            var client = new XMLHttpRequest();
            var success;
            var failure;
            var promise = new Promise(function (resolve, reject) {
                success = resolve;
                failure = reject;
            });

            client.onload = function (e) {
                var res = client.responseText;
                if (success) {
                    var contentType = client.getResponseHeader("content-type");
                    if (!contentType) contentType = client.getResponseHeader("Content-Type");
                    if (contentType && contentType.startsWith("application/json")) {
                        try {
                            res = JSON.parse(res);
                        } catch (e) {
                            //ignore
                        }
                    }
                    success(res);
                }
            };
            client.onerror = function (e) {
                if (failure) {
                    failure(e);
                }
            };
            client.open(method, msg.url);
            for (var key in msg.headers) {
                client.setRequestHeader(key, msg.headers[key]);
            }
            client.send(JSON.stringify(msg.body));
            return promise;
        }
    }]);

    return AjaxClient;
}();

var RpcClient = function () {
    function RpcClient(address, urlPrefix) {
        _classCallCheck(this, RpcClient);

        if (address) {
            this.wsClient = new _WebsocketClient2.default(address);
            this.wsClient.heartbeatMessage = { headers: { cmd: 'ping' } };
        } else {
            this.ajaxClient = new AjaxClient();
        }
        this.urlPrefix = urlPrefix;
        if (!this.urlPrefix) this.urlPrefix = "";

        this.authEnabled = false;
        this.apiKey = "";
        this.secretKey = "";
        this.signFields = "url,method,body,h.*";

        this.defaultInvoker = this.module("");
        var client = this;
        this.proxy = new Proxy(this, {
            get: function get(target, name) {
                return name in target ? target[name] : client.module(name);
            }
        });
        return this.proxy;
    }

    _createClass(RpcClient, [{
        key: 'enableAuth',
        value: function enableAuth(apiKey, secretKey) {
            var authEnabled = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

            this.authEnabled = authEnabled;
            this.apiKey = apiKey;
            this.secretKey = secretKey;
        }
    }, {
        key: 'module',
        value: function module(moduleName) {

            if (this.authEnabled) {
                var client = this.wsClient;
                if (this.ajaxClient) {
                    client = this.ajaxClient;
                }
                client.authEnabled = this.authEnabled;
                client.apiKey = this.apiKey;
                client.secretKey = this.secretKey;
                client.signFields = this.signFields;
            }

            var urlPrefix = (0, _Kit.joinPath)(this.urlPrefix, moduleName);
            return new _RpcInvoker2.default(this, urlPrefix);
        }
    }, {
        key: 'invoke',
        value: function invoke() {
            var _defaultInvoker;

            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            args = args || [];
            return (_defaultInvoker = this.defaultInvoker).invoke.apply(_defaultInvoker, _toConsumableArray(args));
        }
    }, {
        key: '_invoke',
        value: function _invoke(req) {
            if (this.wsClient) {
                return this._wsInvoke(req);
            } else {
                return this.ajaxClient.invoke(req);
            }
        }
    }, {
        key: '_wsInvoke',
        value: function _wsInvoke(req) {
            var _this = this;

            var p;
            if (!this.wsClient.active()) {
                p = this.wsClient.connect().then(function () {
                    return _this.wsClient.invoke(req);
                });
            } else {
                p = this.wsClient.invoke(req);
            }

            return p.then(function (res) {
                if (res.status != 200) {
                    throw res.body;
                }
                return res.body;
            });
        }
    }, {
        key: 'close',
        value: function close() {
            if (this.wsClient) {
                this.wsClient.close();
                this.wsClient = null;
            }
        }
    }]);

    return RpcClient;
}();

exports.default = RpcClient;