(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

module.exports = require('./lib/index.js');

},{"./lib/index.js":12}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.RpcMethodTemplate = exports.RpcStyleTemplate = exports.RpcInfoTemplate = exports.reply = exports.joinPath = exports.signMessage = exports.signHttpRequest = exports.calcSignature = exports.uuid = undefined;

var _jssha = require('jssha');

var _jssha2 = _interopRequireDefault(_jssha);

var _jsonStableStringify = require('json-stable-stringify');

var _jsonStableStringify2 = _interopRequireDefault(_jsonStableStringify);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

String.prototype.format = function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
    }

    args = args || [];
    return this.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};

var uuid = exports.uuid = function uuid() {
    //http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : r & 0x3 | 0x8;
        return v.toString(16);
    });
};

/**
 * 
 * @param {*} apiKey 
 * @param {*} secretKey 
 * @param { json format{url: xx, method: 'POST|GET', headers:{}, body:xxx} } msg 
 * @param {*} signFields 
 */
var calcSignature = exports.calcSignature = function calcSignature(apiKey, secretKey, msg, signFields) {
    if (!signFields) signFields = "url,method,body,h.*";
    var json = { headers: {} };
    json.headers.apiKey = apiKey;
    if (signFields) json.headers.signFields = signFields;

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = signFields.split(',')[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var f = _step.value;

            if (f.startsWith('h.') && msg.headers) {
                var key = f.substr(2);
                if (key == '*') {
                    for (var hkey in msg.headers) {
                        json.headers[hkey] = msg.headers[hkey];
                    }
                } else {
                    json.headers[key] = msg.headers[key];
                }
            } else {
                if (f in msg) {
                    json[f] = msg[f];
                }
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    var data = (0, _jsonStableStringify2.default)(json);
    var shaObj = new _jssha2.default("SHA-256", "TEXT");
    shaObj.setHMACKey(secretKey, "TEXT");
    shaObj.update(data);
    var hash = shaObj.getHMAC("HEX");
    return hash;
};

var signHttpRequest = exports.signHttpRequest = function signHttpRequest(method, url, headers, body, apiKey, secretKey, signFields) {
    var msg = { url: url, headers: {}, body: body };
    if (method) msg.method = method;

    for (var key in headers) {
        msg.headers[key] = headers[key];
    }var sign = calcSignature(apiKey, secretKey, msg, signFields);

    headers.apiKey = apiKey;
    if (signFields) headers.signFields = signFields;
    headers.signature = sign;
};

var signMessage = exports.signMessage = function signMessage(apiKey, secretKey, msg) {
    signHttpRequest(msg.method, msg.url, msg.headers, msg.body, apiKey, secretKey, msg.headers.signFields);
};

var joinPath = exports.joinPath = function joinPath() {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
    }

    args = args || [];
    var path = args.join("/");
    path = path.replace(/[//]+/g, "/");
    if (path.length > 1 && path.endsWith("/")) {
        path = path.substr(0, path.length - 1);
    }
    return path;
};

var reply = exports.reply = function reply(res, status, message) {
    res.status = status;
    res.headers['Content-Type'] = "text/plain; charset=utf8";
    res.body = message;
};

var RpcInfoTemplate = exports.RpcInfoTemplate = '\n<html><head>\n<meta http-equiv="Content-type" content="text/html; charset=utf-8">\n<title>{0} JS</title>\n{1}\n\n<script>  \nvar rpc; \nfunction init(){\n\trpc = new RpcClient(null,"{0}"); \n} \n</script> \n<script async src="https://unpkg.com/zbus/zbus.min.js" onload="init()"></script>\n\n</head>\n\n<div> \n<table class="table">\n<thead>\n<tr class="table-info"> \n    <th class="urlPath">URL Path</th>\n    <th class="returnType">Return Type</th>\n    <th class="methodParams">Method and Params</th> \n</tr>\n<thead>\n<tbody>\n{2}\n</tbody>\n</table> </div> </body></html>\n';

var RpcStyleTemplate = exports.RpcStyleTemplate = '\n<style type="text/css">\nbody {\n    font-family: -apple-system,system-ui,BlinkMacSystemFont,\'Segoe UI\',Roboto,\'Helvetica Neue\',Arial,sans-serif;\n    font-size: 1rem;\n    font-weight: 400;\n    line-height: 1.5;\n    color: #292b2c;\n    background-color: #fff;\n    margin: 0px;\n    padding: 0px;\n}\ntable {  background-color: transparent;  display: table; border-collapse: separate;  border-color: grey; }\n.table { width: 100%; max-width: 100%;  margin-bottom: 1rem; }\n.table th {  height: 30px; }\n.table td, .table th {    border-bottom: 1px solid #eceeef;   text-align: left; padding-left: 16px;} \nth.urlPath {  width: 10%; }\nth.returnType {  width: 10%; }\nth.methodParams {   width: 80%; } \ntd.returnType { text-align: right; }\nthead { display: table-header-group; vertical-align: middle; border-color: inherit;}\ntbody { display: table-row-group; vertical-align: middle; border-color: inherit;}\ntr { display: table-row;  vertical-align: inherit; border-color: inherit; }\n.table-info, .table-info>td, .table-info>th { background-color: #dff0d8; }\n.url { margin: 4px 0; padding-left: 16px;}\n</style>\n';

var RpcMethodTemplate = exports.RpcMethodTemplate = '\n<tr> \n    <td class="urlPath"><a href="{0}">{0}</a></td>\n    <td class="returnType"></td>\n    <td class="methodParams">\n        <code><strong><a href="{0}">{1}</a></strong>({2})</code>\n    </td> \n</tr>\n';

},{"json-stable-stringify":14,"jssha":18}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

function _toConsumableArray(arr) {
    if (Array.isArray(arr)) {
        for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
            arr2[i] = arr[i];
        }return arr2;
    } else {
        return Array.from(arr);
    }
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

Date.prototype.format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": Math.floor((this.getMonth() + 3) / 3),
        "S": this.getMilliseconds()
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
    }return fmt;
};

var Logger = function () {
    function Logger(level) {
        _classCallCheck(this, Logger);

        this.level = level;
        if (!level) {
            this.level = Logger.DEBUG;
        }

        this.DEBUG = 0;
        this.INFO = 1;
        this.WARN = 2;
        this.ERROR = 3;
    }

    _createClass(Logger, [{
        key: "debug",
        value: function debug() {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            this._log.apply(this, [this.DEBUG].concat(args));
        }
    }, {
        key: "info",
        value: function info() {
            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                args[_key2] = arguments[_key2];
            }

            this._log.apply(this, [this.INFO].concat(args));
        }
    }, {
        key: "warn",
        value: function warn() {
            for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                args[_key3] = arguments[_key3];
            }

            this._log.apply(this, [this.WARN].concat(args));
        }
    }, {
        key: "error",
        value: function error() {
            for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
                args[_key4] = arguments[_key4];
            }

            this._log.apply(this, [this.ERROR].concat(args));
        }
    }, {
        key: "log",
        value: function log(level) {
            for (var _len5 = arguments.length, args = Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
                args[_key5 - 1] = arguments[_key5];
            }

            this._log.apply(this, [level].concat(args));
        }
    }, {
        key: "_log",
        value: function _log(level) {
            var _console;

            for (var _len6 = arguments.length, args = Array(_len6 > 1 ? _len6 - 1 : 0), _key6 = 1; _key6 < _len6; _key6++) {
                args[_key6 - 1] = arguments[_key6];
            }

            if (level < this.level) return;
            args = args || [];
            var levelString = "UNKNOWN";
            if (level == this.DEBUG) {
                levelString = "DEBUG";
            }
            if (level == this.INFO) {
                levelString = "INFO";
            }
            if (level == this.WARN) {
                levelString = "WARN";
            }
            if (level == this.ERROR) {
                levelString = "ERROR";
            }
            args.splice(0, 0, "[" + levelString + "]");
            (_console = console).log.apply(_console, [new Date().format("yyyy/MM/dd hh:mm:ss.S")].concat(_toConsumableArray(this._format(args))));
        }
    }, {
        key: "_format",
        value: function _format(args) {
            args = args || [];
            var stackInfo = this._getStackInfo(2); //info => _log => _format  back 2

            if (stackInfo) {
                var calleeStr = stackInfo.relativePath + ':' + stackInfo.line;
                if (typeof args[0] === 'string') {
                    args[0] = calleeStr + ' ' + args[0];
                } else {
                    args.unshift(calleeStr);
                }
            }
            return args;
        }
    }, {
        key: "_getStackInfo",
        value: function _getStackInfo(stackIndex) {
            // get all file, method, and line numbers
            var stacklist = new Error().stack.split('\n').slice(3);

            // stack trace format: http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
            // do not remove the regex expresses to outside of this method (due to a BUG in node.js)
            var stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi;
            var stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi;

            var s = stacklist[stackIndex] || stacklist[0];
            var sp = stackReg.exec(s) || stackReg2.exec(s);

            if (sp && sp.length === 5) {
                return {
                    method: sp[1],
                    relativePath: sp[2].replace(/^.*[\\\/]/, ''),
                    line: sp[3],
                    pos: sp[4],
                    file: sp[2],
                    stack: stacklist.join('\n')
                };
            }
        }
    }]);

    return Logger;
}();

exports.Logger = Logger;
var logger = exports.logger = new Logger(Logger.INFO);

},{}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var Message = function () {
    //type of HTTP message, indication
    function Message() {
        _classCallCheck(this, Message);

        this.headers = {};
    }

    _createClass(Message, [{
        key: "replace",
        value: function replace(msg) {
            for (var m in this) {
                delete this[m];
            }for (var m in msg) {
                this[m] = msg[m];
            }
        }
    }]);

    return Message;
}();

exports.default = Message;

},{}],5:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

var _Logger = require('./Logger');

var _WebsocketClient2 = require('./WebsocketClient');

var _WebsocketClient3 = _interopRequireDefault(_WebsocketClient2);

var _Message = require('./Message');

var _Message2 = _interopRequireDefault(_Message);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

function _possibleConstructorReturn(self, call) {
    if (!self) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
    }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var MqClient = function (_WebsocketClient) {
    _inherits(MqClient, _WebsocketClient);

    function MqClient(address) {
        _classCallCheck(this, MqClient);

        var _this = _possibleConstructorReturn(this, (MqClient.__proto__ || Object.getPrototypeOf(MqClient)).call(this, address));

        _this.heartbeatMessage = { headers: { cmd: "ping" } };

        _this.mqHandlerTable = {}; //mq=>{channle=>handler}
        _this.onmessage = function (msg) {
            if (!msg.headers) {
                _Logger.logger.warn("missing headers in message: " + JSON.stringify(msg));
            }
            var mq = msg.headers.mq,
                channel = msg.headers.channel;
            if (mq == null || channel == null) {
                _Logger.logger.warn("missing mq or channel in message headers: " + JSON.stringify(msg));
            }
            var mqHandlers = _this.mqHandlerTable[mq];
            if (mqHandlers == null) {
                return;
            }
            var mqHandler = mqHandlers[channel];
            if (mqHandler == null) return;

            var window = msg.headers.window;
            mqHandler.handler(msg);
            if (window <= mqHandler.window / 2) {
                var sub = new _Message2.default();
                sub.headers.cmd = 'sub';
                sub.headers.mq = mq;
                sub.headers.channel = channel;
                sub.headers.window = mqHandler.window;
                sub.headers.ack = false;

                _this.send(sub, mqHandler.beforesend);
            }
        };
        return _this;
    }

    /**
     * subscribe on channel of mq
     * 
     * @param {*} mq message queue id
     * @param {*} channel channel fo mq
     * @param {*} callback callback when message from channel of mq received
    *  @param {*} window window size if sub enabled
     * @param {*} beforsend message preprocessor before send, such as adding auth headers
     */

    _createClass(MqClient, [{
        key: 'addMqHandler',
        value: function addMqHandler(mq, channel) {
            var callback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
            var window = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
            var beforsend = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;

            var mqHandlers = this.mqHandlerTable[mq];
            if (mqHandlers == null) {
                mqHandlers = {};
                this.mqHandlerTable[mq] = mqHandlers;
            }
            mqHandlers[channel] = {
                handler: callback,
                window: window,
                beforesend: this.beforeSend
            };
        }
    }]);

    return MqClient;
}(_WebsocketClient3.default);

exports.default = MqClient;

},{"./Logger":3,"./Message":4,"./WebsocketClient":11}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var Protocol = function Protocol() {
  _classCallCheck(this, Protocol);
};

Protocol.MASK_DELETE_ON_EXIT = 1 << 0;
Protocol.MASK_EXCLUSIVE = 1 << 1;

Protocol.MEMORY = 'memory';
Protocol.DISK = 'disk';
Protocol.DB = 'db';

exports.default = Protocol;

},{}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

var _Kit = require('./Kit');

var _WebsocketClient = require('./WebsocketClient');

var _WebsocketClient2 = _interopRequireDefault(_WebsocketClient);

var _RpcInvoker = require('./RpcInvoker');

var _RpcInvoker2 = _interopRequireDefault(_RpcInvoker);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _toConsumableArray(arr) {
    if (Array.isArray(arr)) {
        for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
            arr2[i] = arr[i];
        }return arr2;
    } else {
        return Array.from(arr);
    }
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

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

},{"./Kit":2,"./RpcInvoker":8,"./WebsocketClient":11}],8:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

var _Kit = require('./Kit');

var _Message = require('./Message');

var _Message2 = _interopRequireDefault(_Message);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _toConsumableArray(arr) {
    if (Array.isArray(arr)) {
        for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
            arr2[i] = arr[i];
        }return arr2;
    } else {
        return Array.from(arr);
    }
}

function _possibleConstructorReturn(self, call) {
    if (!self) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
    }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

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

},{"./Kit":2,"./Message":4}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

var _Logger = require('./Logger');

var _Kit = require('./Kit');

var _Message = require('./Message');

var _Message2 = _interopRequireDefault(_Message);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var RpcInfo = function () {
    function RpcInfo(processor) {
        _classCallCheck(this, RpcInfo);

        this.processor = processor;
    }

    _createClass(RpcInfo, [{
        key: 'index',
        value: function index() {
            var p = this.processor;
            var res = new _Message2.default();
            res.status = 200;
            res.headers['content-type'] = 'text/html; charset=utf8';

            var info = '';
            for (var urlPath in p.urlPath2Methods) {
                var m = p.urlPath2Methods[urlPath];
                if (!m.docEnabled) continue;
                var args = m.paramsString;
                var link = (0, _Kit.joinPath)(p.rootUrl, m.urlPath);
                info += _Kit.RpcMethodTemplate.format(link, m.method, args);
            }
            res.body = _Kit.RpcInfoTemplate.format(p.rootUrl, _Kit.RpcStyleTemplate, info);
            return res;
        }
    }]);

    return RpcInfo;
}();

var RpcProcessor = function () {
    function RpcProcessor() {
        _classCallCheck(this, RpcProcessor);

        this.urlPath2Methods = {};
        this.rootUrl = "/";
        this.docUrl = "/doc";
        this.docEnabled = true;
    }

    _createClass(RpcProcessor, [{
        key: '_matchMethod',
        value: function _matchMethod(module, method) {
            if (!module) module = '';
            var methods = this.module2methods[module];
            if (methods == null) {
                return null;
            }
            return methods[method];
        }
    }, {
        key: '_parseParams',
        value: function _parseParams(s) {
            var bb = s.split('?');
            var params = bb[0].split('/').filter(function (s) {
                return s.length > 0;
            });
            var kvs = bb.slice(1).join('?');
            var last = {};
            var kvpairs = kvs.split('&').filter(function (s) {
                return s.length > 0;
            });
            if (kvpairs.length > 0) {
                params.push(last);
            }
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = kvpairs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var kv = _step.value;

                    var a = kv.split('=');
                    if (a.length > 1) {
                        last[a[0]] = a[1];
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return params;
        }
    }, {
        key: 'process',
        value: function process(req, res) {
            var url = req.url;
            if (!url) {
                (0, _Kit.reply)(res, 400, 'Missing url in request');
                return;
            }
            var m = null,
                urlPath = null,
                length = 0;
            for (var path in this.urlPath2Methods) {
                if (url.startsWith(path)) {
                    if (path.length > length) {
                        length = path.length;
                        urlPath = path;
                        m = this.urlPath2Methods[path];
                    }
                }
            }
            if (m == null) {
                (0, _Kit.reply)(res, 404, 'Url=' + url + ' Not Found');
                return;
            }

            var params = [];
            if (req.body) {
                if (!(req.body instanceof Array)) {
                    req.body = JSON.parse(req.body);
                }
                params = req.body;
            } else {
                var subUrl = url.substr(urlPath.length);
                params = this._parseParams(subUrl);
            }

            var result = m.instance.apply(m.target, params);

            if (result instanceof _Message2.default) {
                res.replace(result);
            } else {
                res.status = 200;
                res.headers['content-type'] = 'application/json; charset=utf8;';
                res.body = result;
            }
        }
    }, {
        key: '_addMethod',
        value: function _addMethod(urlPath, methodObject, target, docEnabled) {
            var urlPath = (0, _Kit.joinPath)(urlPath);
            var methodName = methodObject.name;
            if (docEnabled === undefined) docEnabled = true;
            var m = {
                urlPath: urlPath,
                method: methodName,
                paramsString: '',
                instance: methodObject,
                target: target,
                docEnabled: docEnabled
            };

            if (urlPath in this.urlPath2Methods) {
                _Logger.logger.warn('Url=' + urlPath + ', Method=' + methodName + ' exists');
            }
            this.urlPath2Methods[urlPath] = m;
            return m;
        }
    }, {
        key: 'mount',
        value: function mount(module, objectOrFunc, target, docEnabled) {
            if (typeof objectOrFunc == 'function') {
                //module as method name
                this._addMethod(module, objectOrFunc, target, docEnabled);
                return;
            }

            var methods = this._getAllMethods(objectOrFunc);
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = methods[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var methdName = _step2.value;

                    var methodObject = objectOrFunc[methdName];
                    var urlPath = (0, _Kit.joinPath)(module, methodObject.name);
                    var info = this._addMethod(urlPath, methodObject, objectOrFunc, docEnabled);
                    info.paramsString = this._getFnParamNames(methodObject.toString());
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }
        }
    }, {
        key: 'mountDoc',
        value: function mountDoc() {
            if (!this.docEnabled) return;
            var info = new RpcInfo(this);
            this.mount(this.docUrl, info.index, info, false);
        }
    }, {
        key: '_getFnParamNames',
        value: function _getFnParamNames(fn) {
            var fstr = fn.toString();
            return fstr.match(/\(.*?\)/)[0].replace(/[()]/gi, '').replace(/\s/gi, '').split(',');
        }
    }, {
        key: '_getAllMethods',
        value: function _getAllMethods(obj) {
            var methods = new Set();
            for (var name in obj) {
                var func = obj[name];
                if (typeof func == 'function') {
                    methods.add(name);
                }
            }
            while (obj = Reflect.getPrototypeOf(obj)) {
                if (obj.constructor == Object) break;
                var keys = Reflect.ownKeys(obj);
                keys.forEach(function (k) {
                    if (k == 'constructor') return false;
                    methods.add(k);
                });
            }
            return methods;
        }
    }]);

    return RpcProcessor;
}();

exports.default = RpcProcessor;

},{"./Kit":2,"./Logger":3,"./Message":4}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

var _Logger = require('./Logger');

var _Kit = require('./Kit');

var _MqClient = require('./MqClient');

var _MqClient2 = _interopRequireDefault(_MqClient);

var _Message = require('./Message');

var _Message2 = _interopRequireDefault(_Message);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var RpcServer = function () {
    function RpcServer(processor) {
        _classCallCheck(this, RpcServer);

        this.mqServerAddress = null;
        this.mq = null;
        this.mqType = "memory";
        this.mqMask = null;
        this.channel = null;
        this.clientCount = 1;

        this.authEnabled = false;
        this.apiKey = "";
        this.secretKey = "";

        this.clients = [];
        this.processor = processor;
    }

    _createClass(RpcServer, [{
        key: 'enableAuth',
        value: function enableAuth(apiKey, secretKey) {
            var authEnabled = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

            this.authEnabled = authEnabled;
            this.apiKey = apiKey;
            this.secretKey = secretKey;
        }
    }, {
        key: 'start',
        value: function start() {
            var _this = this;

            if (this.mqServerAddress == null) {
                throw new Error("missing mqServerAddress");
            }
            if (this.mq == null) {
                throw new Error("missing mq");
            }
            if (this.channel == null) {
                this.channel = this.mq;
            }
            this.processor.mountDoc();
            this.processor.rootUrl = (0, _Kit.joinPath)("/", this.mq);
            var processor = this.processor;

            for (var i = 0; i < this.clientCount; i++) {
                var client = new _MqClient2.default(this.mqServerAddress);
                if (this.authEnabled) {
                    client.authEnabled = this.authEnabled;
                    client.apiKey = this.apiKey;
                    client.secretKey = this.secretKey;
                }

                client.onopen = function () {
                    var msg = {};
                    msg.headers = {
                        cmd: 'create',
                        mq: _this.mq,
                        mqType: _this.mqType,
                        mqMask: _this.mqMask,
                        channel: _this.channel
                    };
                    client.invoke(msg).then(function (res) {
                        _Logger.logger.info(res);
                    });
                    msg = {};
                    msg.headers = { cmd: 'sub', mq: _this.mq, channel: _this.channel };
                    client.invoke(msg).then(function (res) {
                        _Logger.logger.info(res);
                    });
                };

                client.addMqHandler(this.mq, this.channel, function (req) {
                    var id = req.headers.id;
                    var target = req.headers.source;
                    var url = req.url;
                    var urlPrefix = processor.rootUrl;
                    if (url && url.startsWith(urlPrefix)) {
                        url = url.substr(urlPrefix.length);
                        url = (0, _Kit.joinPath)("/", url);
                        req.url = url;
                    }

                    var res = new _Message2.default();
                    try {
                        processor.process(req, res);
                    } catch (e) {
                        _Logger.logger.error(e);
                        res.headers['content-type'] = 'text/plain; charset=utf8;';
                        (0, _Kit.reply)(res, 500, e);
                    }

                    res.headers.cmd = 'route'; //route back message
                    res.headers.target = target;
                    res.headers.id = id;
                    if (res.status == null) res.status = 200;

                    client.send(res);
                });

                client.connect();
                this.clients.push(client);
            }
        }
    }, {
        key: 'close',
        value: function close() {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.clients[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var client = _step.value;

                    client.close();
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            this.clients = [];
        }
    }]);

    return RpcServer;
}();

exports.default = RpcServer;

},{"./Kit":2,"./Logger":3,"./Message":4,"./MqClient":5}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Ticket = undefined;

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

var _isomorphicWs = require('isomorphic-ws');

var _isomorphicWs2 = _interopRequireDefault(_isomorphicWs);

var _Logger = require('./Logger');

var _Kit = require('./Kit');

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var Ticket = //message matching ticket
exports.Ticket = function Ticket(msg, resolve) {
    _classCallCheck(this, Ticket);

    this.id = (0, _Kit.uuid)();
    if (!msg.headers) msg.headers = {};
    msg.headers.id = this.id;
    this.request = msg;
    this.response = null;

    this.resolve = resolve;
};

var WebsocketClient = function () {
    function WebsocketClient(address) {
        _classCallCheck(this, WebsocketClient);

        if (!address.startsWith("ws://") && !address.startsWith("wss://")) {
            address = "ws://" + address;
        }
        this.address = address;
        this.socket = null;
        this.heartbeatInterval = 30000;
        this.ticketTable = {};
        this.connectPromise = null;
        this.autoReconnect = true;
        this.reconnectInterval = 3000;

        this.authEnabled = false;
        this.apiKey = "";
        this.secretKey = "";
        this.signFields = "url,method,body,h.*";

        this.onopen = null;
        this.onclose = null;
        this.onerror = null;
        this.onmessage = null;

        this.beforeSend = null;

        this.heartbeator = null;
        this.heartbeatMessage = null;
        this.heartbeatInterval = 30 * 1000; //30 seconds
    }

    _createClass(WebsocketClient, [{
        key: 'enableAuth',
        value: function enableAuth(apiKey, secretKey) {
            var authEnabled = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

            this.authEnabled = authEnabled;
            this.apiKey = apiKey;
            this.secretKey = secretKey;
        }
    }, {
        key: 'connect',
        value: function connect() {
            if (this.socket != null && this.connectPromise != null) {
                return this.connectPromise;
            }

            _Logger.logger.debug("Trying to connect to " + this.address);

            var connectSuccess;
            var connectFailure;
            this.connectPromise = new Promise(function (resolve, reject) {
                connectSuccess = resolve;
                connectFailure = reject;
            });

            try {
                this.socket = new _isomorphicWs2.default(this.address);
            } catch (e) {
                connectFailure(e);
                return this.connectPromise;
            }

            var client = this;
            this.socket.onopen = function (event) {
                _Logger.logger.debug("Connected to " + client.address);
                if (connectSuccess) {
                    connectSuccess();
                }
                if (client.onopen) {
                    client.onopen(client);
                }
                if (client.heartbeatMessage != null) {
                    client.heartbeator = setInterval(function () {
                        try {
                            client.send(client.heartbeatMessage);
                        } catch (e) {
                            _Logger.logger.warn(e);
                        }
                    }, client.heartbeatInterval);
                }
            };

            this.socket.onclose = function (event) {
                client.connectPromise = null;
                clearInterval(client.heartbeat);
                if (client.onclose) {
                    client.onclose();
                }
                if (client.autoReconnect) {
                    client.connectTrying = setTimeout(function () {
                        try {
                            client.connect();
                        } catch (e) {} //ignore
                    }, client.reconnectInterval);
                }
            };

            this.socket.onmessage = function (event) {
                var msg = JSON.parse(event.data);
                var msgid = null;
                if (msg.headers) {
                    msgid = msg.headers.id;
                }
                var ticket = client.ticketTable[msgid];
                if (ticket) {
                    ticket.response = msg;
                    if (ticket.resolve) {
                        ticket.resolve(msg);
                        delete client.ticketTable[msgid];
                    }
                } else if (client.onmessage) {
                    client.onmessage(msg);
                }
            };

            this.socket.onerror = function (data) {
                _Logger.logger.error("Error: " + data);
            };
            return this.connectPromise;
        }
    }, {
        key: 'close',
        value: function close() {
            this.connectPromise = null;
            clearInterval(this.heartbeat);
            if (this.connectTrying) {
                clearTimeout(this.connectTrying);
            }
            this.socket.onclose = function () {};
            this.autoReconnect = false;
            this.socket.close();
            this.socket = null;
        }
    }, {
        key: 'active',
        value: function active() {
            return this.socket && this.socket.readyState == _isomorphicWs2.default.OPEN;
        }
    }, {
        key: 'send',
        value: function send(msg, beforeSend) {
            if (!beforeSend) {
                beforeSend = this.beforeSend;
            }
            if (beforeSend != null) {
                beforeSend(msg);
            }
            if (this.authEnabled) {
                msg.headers.signFields = this.signFields;
                (0, _Kit.signMessage)(this.apiKey, this.secretKey, msg);
            }
            var data = JSON.stringify(msg);
            this.socket.send(data);
        }
    }, {
        key: 'invoke',
        value: function invoke(msg, beforeSend) {
            var _this = this;

            var client = this;
            var ticket = new Ticket(msg);
            this.ticketTable[ticket.id] = ticket;

            var promise = new Promise(function (resolve, reject) {
                if (!client.active()) {
                    reject(new Error("socket is not open, invalid"));
                    return;
                }
                ticket.resolve = resolve;
                if (ticket.response) {
                    ticket.resolve(ticket.reponse);
                    delete _this.ticketTable[ticket.id];
                }
            });

            this.send(msg, beforeSend);
            return promise;
        }
    }]);

    return WebsocketClient;
}();

exports.default = WebsocketClient;

},{"./Kit":2,"./Logger":3,"isomorphic-ws":13}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.calcSignature = exports.signHttpRequest = exports.signMessage = exports.Message = exports.RpcServer = exports.RpcClient = exports.RpcProcessor = exports.MqClient = exports.WebsocketClient = exports.Logger = exports.Protocol = undefined;

var _Protocol = require('./Protocol');

var _Protocol2 = _interopRequireDefault(_Protocol);

var _Logger = require('./Logger');

var _WebsocketClient = require('./WebsocketClient');

var _WebsocketClient2 = _interopRequireDefault(_WebsocketClient);

var _MqClient = require('./MqClient');

var _MqClient2 = _interopRequireDefault(_MqClient);

var _RpcProcessor = require('./RpcProcessor');

var _RpcProcessor2 = _interopRequireDefault(_RpcProcessor);

var _RpcClient = require('./RpcClient');

var _RpcClient2 = _interopRequireDefault(_RpcClient);

var _RpcServer = require('./RpcServer');

var _RpcServer2 = _interopRequireDefault(_RpcServer);

var _Message = require('./Message');

var _Message2 = _interopRequireDefault(_Message);

var _Kit = require('./Kit');

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.Protocol = _Protocol2.default;
exports.Logger = _Logger.Logger;
exports.WebsocketClient = _WebsocketClient2.default;
exports.MqClient = _MqClient2.default;
exports.RpcProcessor = _RpcProcessor2.default;
exports.RpcClient = _RpcClient2.default;
exports.RpcServer = _RpcServer2.default;
exports.Message = _Message2.default;
exports.signMessage = _Kit.signMessage;
exports.signHttpRequest = _Kit.signHttpRequest;
exports.calcSignature = _Kit.calcSignature;

if (typeof window != 'undefined') {
    window.Protocol = _Protocol2.default;
    window.Logger = _Logger.Logger;
    window.WebsocketClient = _WebsocketClient2.default;
    window.MqClient = _MqClient2.default;
    window.RpcProcessor = _RpcProcessor2.default;
    window.RpcClient = _RpcClient2.default;
    window.RpcServer = _RpcServer2.default;
    window.Message = _Message2.default;

    window.signMessage = _Kit.signMessage;
    window.signHttpRequest = _Kit.signHttpRequest;
    window.calcSignature = _Kit.calcSignature;
}

},{"./Kit":2,"./Logger":3,"./Message":4,"./MqClient":5,"./Protocol":6,"./RpcClient":7,"./RpcProcessor":9,"./RpcServer":10,"./WebsocketClient":11}],13:[function(require,module,exports){
(function (global){
// https://github.com/maxogden/websocket-stream/blob/48dc3ddf943e5ada668c31ccd94e9186f02fafbd/ws-fallback.js

var ws = null

if (typeof WebSocket !== 'undefined') {
  ws = WebSocket
} else if (typeof MozWebSocket !== 'undefined') {
  ws = MozWebSocket
} else if (typeof global !== 'undefined') {
  ws = global.WebSocket || global.MozWebSocket
} else if (typeof window !== 'undefined') {
  ws = window.WebSocket || window.MozWebSocket
} else if (typeof self !== 'undefined') {
  ws = self.WebSocket || self.MozWebSocket
}

module.exports = ws

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],14:[function(require,module,exports){
var json = typeof JSON !== 'undefined' ? JSON : require('jsonify');

module.exports = function (obj, opts) {
    if (!opts) opts = {};
    if (typeof opts === 'function') opts = { cmp: opts };
    var space = opts.space || '';
    if (typeof space === 'number') space = Array(space+1).join(' ');
    var cycles = (typeof opts.cycles === 'boolean') ? opts.cycles : false;
    var replacer = opts.replacer || function(key, value) { return value; };

    var cmp = opts.cmp && (function (f) {
        return function (node) {
            return function (a, b) {
                var aobj = { key: a, value: node[a] };
                var bobj = { key: b, value: node[b] };
                return f(aobj, bobj);
            };
        };
    })(opts.cmp);

    var seen = [];
    return (function stringify (parent, key, node, level) {
        var indent = space ? ('\n' + new Array(level + 1).join(space)) : '';
        var colonSeparator = space ? ': ' : ':';

        if (node && node.toJSON && typeof node.toJSON === 'function') {
            node = node.toJSON();
        }

        node = replacer.call(parent, key, node);

        if (node === undefined) {
            return;
        }
        if (typeof node !== 'object' || node === null) {
            return json.stringify(node);
        }
        if (isArray(node)) {
            var out = [];
            for (var i = 0; i < node.length; i++) {
                var item = stringify(node, i, node[i], level+1) || json.stringify(null);
                out.push(indent + space + item);
            }
            return '[' + out.join(',') + indent + ']';
        }
        else {
            if (seen.indexOf(node) !== -1) {
                if (cycles) return json.stringify('__cycle__');
                throw new TypeError('Converting circular structure to JSON');
            }
            else seen.push(node);

            var keys = objectKeys(node).sort(cmp && cmp(node));
            var out = [];
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var value = stringify(node, key, node[key], level+1);

                if(!value) continue;

                var keyValue = json.stringify(key)
                    + colonSeparator
                    + value;
                ;
                out.push(indent + space + keyValue);
            }
            seen.splice(seen.indexOf(node), 1);
            return '{' + out.join(',') + indent + '}';
        }
    })({ '': obj }, '', obj, 0);
};

var isArray = Array.isArray || function (x) {
    return {}.toString.call(x) === '[object Array]';
};

var objectKeys = Object.keys || function (obj) {
    var has = Object.prototype.hasOwnProperty || function () { return true };
    var keys = [];
    for (var key in obj) {
        if (has.call(obj, key)) keys.push(key);
    }
    return keys;
};

},{"jsonify":15}],15:[function(require,module,exports){
exports.parse = require('./lib/parse');
exports.stringify = require('./lib/stringify');

},{"./lib/parse":16,"./lib/stringify":17}],16:[function(require,module,exports){
var at, // The index of the current character
    ch, // The current character
    escapee = {
        '"':  '"',
        '\\': '\\',
        '/':  '/',
        b:    '\b',
        f:    '\f',
        n:    '\n',
        r:    '\r',
        t:    '\t'
    },
    text,

    error = function (m) {
        // Call error when something is wrong.
        throw {
            name:    'SyntaxError',
            message: m,
            at:      at,
            text:    text
        };
    },
    
    next = function (c) {
        // If a c parameter is provided, verify that it matches the current character.
        if (c && c !== ch) {
            error("Expected '" + c + "' instead of '" + ch + "'");
        }
        
        // Get the next character. When there are no more characters,
        // return the empty string.
        
        ch = text.charAt(at);
        at += 1;
        return ch;
    },
    
    number = function () {
        // Parse a number value.
        var number,
            string = '';
        
        if (ch === '-') {
            string = '-';
            next('-');
        }
        while (ch >= '0' && ch <= '9') {
            string += ch;
            next();
        }
        if (ch === '.') {
            string += '.';
            while (next() && ch >= '0' && ch <= '9') {
                string += ch;
            }
        }
        if (ch === 'e' || ch === 'E') {
            string += ch;
            next();
            if (ch === '-' || ch === '+') {
                string += ch;
                next();
            }
            while (ch >= '0' && ch <= '9') {
                string += ch;
                next();
            }
        }
        number = +string;
        if (!isFinite(number)) {
            error("Bad number");
        } else {
            return number;
        }
    },
    
    string = function () {
        // Parse a string value.
        var hex,
            i,
            string = '',
            uffff;
        
        // When parsing for string values, we must look for " and \ characters.
        if (ch === '"') {
            while (next()) {
                if (ch === '"') {
                    next();
                    return string;
                } else if (ch === '\\') {
                    next();
                    if (ch === 'u') {
                        uffff = 0;
                        for (i = 0; i < 4; i += 1) {
                            hex = parseInt(next(), 16);
                            if (!isFinite(hex)) {
                                break;
                            }
                            uffff = uffff * 16 + hex;
                        }
                        string += String.fromCharCode(uffff);
                    } else if (typeof escapee[ch] === 'string') {
                        string += escapee[ch];
                    } else {
                        break;
                    }
                } else {
                    string += ch;
                }
            }
        }
        error("Bad string");
    },

    white = function () {

// Skip whitespace.

        while (ch && ch <= ' ') {
            next();
        }
    },

    word = function () {

// true, false, or null.

        switch (ch) {
        case 't':
            next('t');
            next('r');
            next('u');
            next('e');
            return true;
        case 'f':
            next('f');
            next('a');
            next('l');
            next('s');
            next('e');
            return false;
        case 'n':
            next('n');
            next('u');
            next('l');
            next('l');
            return null;
        }
        error("Unexpected '" + ch + "'");
    },

    value,  // Place holder for the value function.

    array = function () {

// Parse an array value.

        var array = [];

        if (ch === '[') {
            next('[');
            white();
            if (ch === ']') {
                next(']');
                return array;   // empty array
            }
            while (ch) {
                array.push(value());
                white();
                if (ch === ']') {
                    next(']');
                    return array;
                }
                next(',');
                white();
            }
        }
        error("Bad array");
    },

    object = function () {

// Parse an object value.

        var key,
            object = {};

        if (ch === '{') {
            next('{');
            white();
            if (ch === '}') {
                next('}');
                return object;   // empty object
            }
            while (ch) {
                key = string();
                white();
                next(':');
                if (Object.hasOwnProperty.call(object, key)) {
                    error('Duplicate key "' + key + '"');
                }
                object[key] = value();
                white();
                if (ch === '}') {
                    next('}');
                    return object;
                }
                next(',');
                white();
            }
        }
        error("Bad object");
    };

value = function () {

// Parse a JSON value. It could be an object, an array, a string, a number,
// or a word.

    white();
    switch (ch) {
    case '{':
        return object();
    case '[':
        return array();
    case '"':
        return string();
    case '-':
        return number();
    default:
        return ch >= '0' && ch <= '9' ? number() : word();
    }
};

// Return the json_parse function. It will have access to all of the above
// functions and variables.

module.exports = function (source, reviver) {
    var result;
    
    text = source;
    at = 0;
    ch = ' ';
    result = value();
    white();
    if (ch) {
        error("Syntax error");
    }

    // If there is a reviver function, we recursively walk the new structure,
    // passing each name/value pair to the reviver function for possible
    // transformation, starting with a temporary root object that holds the result
    // in an empty key. If there is not a reviver function, we simply return the
    // result.

    return typeof reviver === 'function' ? (function walk(holder, key) {
        var k, v, value = holder[key];
        if (value && typeof value === 'object') {
            for (k in value) {
                if (Object.prototype.hasOwnProperty.call(value, k)) {
                    v = walk(value, k);
                    if (v !== undefined) {
                        value[k] = v;
                    } else {
                        delete value[k];
                    }
                }
            }
        }
        return reviver.call(holder, key, value);
    }({'': result}, '')) : result;
};

},{}],17:[function(require,module,exports){
var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    gap,
    indent,
    meta = {    // table of character substitutions
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"' : '\\"',
        '\\': '\\\\'
    },
    rep;

function quote(string) {
    // If the string contains no control characters, no quote characters, and no
    // backslash characters, then we can safely slap some quotes around it.
    // Otherwise we must also replace the offending characters with safe escape
    // sequences.
    
    escapable.lastIndex = 0;
    return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
        var c = meta[a];
        return typeof c === 'string' ? c :
            '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
    }) + '"' : '"' + string + '"';
}

function str(key, holder) {
    // Produce a string from holder[key].
    var i,          // The loop counter.
        k,          // The member key.
        v,          // The member value.
        length,
        mind = gap,
        partial,
        value = holder[key];
    
    // If the value has a toJSON method, call it to obtain a replacement value.
    if (value && typeof value === 'object' &&
            typeof value.toJSON === 'function') {
        value = value.toJSON(key);
    }
    
    // If we were called with a replacer function, then call the replacer to
    // obtain a replacement value.
    if (typeof rep === 'function') {
        value = rep.call(holder, key, value);
    }
    
    // What happens next depends on the value's type.
    switch (typeof value) {
        case 'string':
            return quote(value);
        
        case 'number':
            // JSON numbers must be finite. Encode non-finite numbers as null.
            return isFinite(value) ? String(value) : 'null';
        
        case 'boolean':
        case 'null':
            // If the value is a boolean or null, convert it to a string. Note:
            // typeof null does not produce 'null'. The case is included here in
            // the remote chance that this gets fixed someday.
            return String(value);
            
        case 'object':
            if (!value) return 'null';
            gap += indent;
            partial = [];
            
            // Array.isArray
            if (Object.prototype.toString.apply(value) === '[object Array]') {
                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }
                
                // Join all of the elements together, separated with commas, and
                // wrap them in brackets.
                v = partial.length === 0 ? '[]' : gap ?
                    '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                    '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }
            
            // If the replacer is an array, use it to select the members to be
            // stringified.
            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }
            else {
                // Otherwise, iterate through all of the keys in the object.
                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }
            
        // Join all of the member texts together, separated with commas,
        // and wrap them in braces.

        v = partial.length === 0 ? '{}' : gap ?
            '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
            '{' + partial.join(',') + '}';
        gap = mind;
        return v;
    }
}

module.exports = function (value, replacer, space) {
    var i;
    gap = '';
    indent = '';
    
    // If the space parameter is a number, make an indent string containing that
    // many spaces.
    if (typeof space === 'number') {
        for (i = 0; i < space; i += 1) {
            indent += ' ';
        }
    }
    // If the space parameter is a string, it will be used as the indent string.
    else if (typeof space === 'string') {
        indent = space;
    }

    // If there is a replacer, it must be a function or an array.
    // Otherwise, throw an error.
    rep = replacer;
    if (replacer && typeof replacer !== 'function'
    && (typeof replacer !== 'object' || typeof replacer.length !== 'number')) {
        throw new Error('JSON.stringify');
    }
    
    // Make a fake root object containing our value under the key of ''.
    // Return the result of stringifying the value.
    return str('', {'': value});
};

},{}],18:[function(require,module,exports){
/*
 A JavaScript implementation of the SHA family of hashes, as
 defined in FIPS PUB 180-4 and FIPS PUB 202, as well as the corresponding
 HMAC implementation as defined in FIPS PUB 198a

 Copyright Brian Turek 2008-2017
 Distributed under the BSD License
 See http://caligatio.github.com/jsSHA/ for more information

 Several functions taken from Paul Johnston
*/
'use strict';(function(Y){function C(c,a,b){var e=0,h=[],n=0,g,l,d,f,m,q,u,r,I=!1,v=[],w=[],t,y=!1,z=!1,x=-1;b=b||{};g=b.encoding||"UTF8";t=b.numRounds||1;if(t!==parseInt(t,10)||1>t)throw Error("numRounds must a integer >= 1");if("SHA-1"===c)m=512,q=K,u=Z,f=160,r=function(a){return a.slice()};else if(0===c.lastIndexOf("SHA-",0))if(q=function(a,b){return L(a,b,c)},u=function(a,b,h,e){var k,f;if("SHA-224"===c||"SHA-256"===c)k=(b+65>>>9<<4)+15,f=16;else if("SHA-384"===c||"SHA-512"===c)k=(b+129>>>10<<
5)+31,f=32;else throw Error("Unexpected error in SHA-2 implementation");for(;a.length<=k;)a.push(0);a[b>>>5]|=128<<24-b%32;b=b+h;a[k]=b&4294967295;a[k-1]=b/4294967296|0;h=a.length;for(b=0;b<h;b+=f)e=L(a.slice(b,b+f),e,c);if("SHA-224"===c)a=[e[0],e[1],e[2],e[3],e[4],e[5],e[6]];else if("SHA-256"===c)a=e;else if("SHA-384"===c)a=[e[0].a,e[0].b,e[1].a,e[1].b,e[2].a,e[2].b,e[3].a,e[3].b,e[4].a,e[4].b,e[5].a,e[5].b];else if("SHA-512"===c)a=[e[0].a,e[0].b,e[1].a,e[1].b,e[2].a,e[2].b,e[3].a,e[3].b,e[4].a,
e[4].b,e[5].a,e[5].b,e[6].a,e[6].b,e[7].a,e[7].b];else throw Error("Unexpected error in SHA-2 implementation");return a},r=function(a){return a.slice()},"SHA-224"===c)m=512,f=224;else if("SHA-256"===c)m=512,f=256;else if("SHA-384"===c)m=1024,f=384;else if("SHA-512"===c)m=1024,f=512;else throw Error("Chosen SHA variant is not supported");else if(0===c.lastIndexOf("SHA3-",0)||0===c.lastIndexOf("SHAKE",0)){var F=6;q=D;r=function(a){var c=[],e;for(e=0;5>e;e+=1)c[e]=a[e].slice();return c};x=1;if("SHA3-224"===
c)m=1152,f=224;else if("SHA3-256"===c)m=1088,f=256;else if("SHA3-384"===c)m=832,f=384;else if("SHA3-512"===c)m=576,f=512;else if("SHAKE128"===c)m=1344,f=-1,F=31,z=!0;else if("SHAKE256"===c)m=1088,f=-1,F=31,z=!0;else throw Error("Chosen SHA variant is not supported");u=function(a,c,e,b,h){e=m;var k=F,f,g=[],n=e>>>5,l=0,d=c>>>5;for(f=0;f<d&&c>=e;f+=n)b=D(a.slice(f,f+n),b),c-=e;a=a.slice(f);for(c%=e;a.length<n;)a.push(0);f=c>>>3;a[f>>2]^=k<<f%4*8;a[n-1]^=2147483648;for(b=D(a,b);32*g.length<h;){a=b[l%
5][l/5|0];g.push(a.b);if(32*g.length>=h)break;g.push(a.a);l+=1;0===64*l%e&&D(null,b)}return g}}else throw Error("Chosen SHA variant is not supported");d=M(a,g,x);l=A(c);this.setHMACKey=function(a,b,h){var k;if(!0===I)throw Error("HMAC key already set");if(!0===y)throw Error("Cannot set HMAC key after calling update");if(!0===z)throw Error("SHAKE is not supported for HMAC");g=(h||{}).encoding||"UTF8";b=M(b,g,x)(a);a=b.binLen;b=b.value;k=m>>>3;h=k/4-1;if(k<a/8){for(b=u(b,a,0,A(c),f);b.length<=h;)b.push(0);
b[h]&=4294967040}else if(k>a/8){for(;b.length<=h;)b.push(0);b[h]&=4294967040}for(a=0;a<=h;a+=1)v[a]=b[a]^909522486,w[a]=b[a]^1549556828;l=q(v,l);e=m;I=!0};this.update=function(a){var c,b,k,f=0,g=m>>>5;c=d(a,h,n);a=c.binLen;b=c.value;c=a>>>5;for(k=0;k<c;k+=g)f+m<=a&&(l=q(b.slice(k,k+g),l),f+=m);e+=f;h=b.slice(f>>>5);n=a%m;y=!0};this.getHash=function(a,b){var k,g,d,m;if(!0===I)throw Error("Cannot call getHash after setting HMAC key");d=N(b);if(!0===z){if(-1===d.shakeLen)throw Error("shakeLen must be specified in options");
f=d.shakeLen}switch(a){case "HEX":k=function(a){return O(a,f,x,d)};break;case "B64":k=function(a){return P(a,f,x,d)};break;case "BYTES":k=function(a){return Q(a,f,x)};break;case "ARRAYBUFFER":try{g=new ArrayBuffer(0)}catch(p){throw Error("ARRAYBUFFER not supported by this environment");}k=function(a){return R(a,f,x)};break;default:throw Error("format must be HEX, B64, BYTES, or ARRAYBUFFER");}m=u(h.slice(),n,e,r(l),f);for(g=1;g<t;g+=1)!0===z&&0!==f%32&&(m[m.length-1]&=16777215>>>24-f%32),m=u(m,f,
0,A(c),f);return k(m)};this.getHMAC=function(a,b){var k,g,d,p;if(!1===I)throw Error("Cannot call getHMAC without first setting HMAC key");d=N(b);switch(a){case "HEX":k=function(a){return O(a,f,x,d)};break;case "B64":k=function(a){return P(a,f,x,d)};break;case "BYTES":k=function(a){return Q(a,f,x)};break;case "ARRAYBUFFER":try{k=new ArrayBuffer(0)}catch(v){throw Error("ARRAYBUFFER not supported by this environment");}k=function(a){return R(a,f,x)};break;default:throw Error("outputFormat must be HEX, B64, BYTES, or ARRAYBUFFER");
}g=u(h.slice(),n,e,r(l),f);p=q(w,A(c));p=u(g,f,m,p,f);return k(p)}}function b(c,a){this.a=c;this.b=a}function O(c,a,b,e){var h="";a/=8;var n,g,d;d=-1===b?3:0;for(n=0;n<a;n+=1)g=c[n>>>2]>>>8*(d+n%4*b),h+="0123456789abcdef".charAt(g>>>4&15)+"0123456789abcdef".charAt(g&15);return e.outputUpper?h.toUpperCase():h}function P(c,a,b,e){var h="",n=a/8,g,d,p,f;f=-1===b?3:0;for(g=0;g<n;g+=3)for(d=g+1<n?c[g+1>>>2]:0,p=g+2<n?c[g+2>>>2]:0,p=(c[g>>>2]>>>8*(f+g%4*b)&255)<<16|(d>>>8*(f+(g+1)%4*b)&255)<<8|p>>>8*(f+
(g+2)%4*b)&255,d=0;4>d;d+=1)8*g+6*d<=a?h+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(p>>>6*(3-d)&63):h+=e.b64Pad;return h}function Q(c,a,b){var e="";a/=8;var h,d,g;g=-1===b?3:0;for(h=0;h<a;h+=1)d=c[h>>>2]>>>8*(g+h%4*b)&255,e+=String.fromCharCode(d);return e}function R(c,a,b){a/=8;var e,h=new ArrayBuffer(a),d,g;g=new Uint8Array(h);d=-1===b?3:0;for(e=0;e<a;e+=1)g[e]=c[e>>>2]>>>8*(d+e%4*b)&255;return h}function N(c){var a={outputUpper:!1,b64Pad:"=",shakeLen:-1};c=c||{};
a.outputUpper=c.outputUpper||!1;!0===c.hasOwnProperty("b64Pad")&&(a.b64Pad=c.b64Pad);if(!0===c.hasOwnProperty("shakeLen")){if(0!==c.shakeLen%8)throw Error("shakeLen must be a multiple of 8");a.shakeLen=c.shakeLen}if("boolean"!==typeof a.outputUpper)throw Error("Invalid outputUpper formatting option");if("string"!==typeof a.b64Pad)throw Error("Invalid b64Pad formatting option");return a}function M(c,a,b){switch(a){case "UTF8":case "UTF16BE":case "UTF16LE":break;default:throw Error("encoding must be UTF8, UTF16BE, or UTF16LE");
}switch(c){case "HEX":c=function(a,c,d){var g=a.length,l,p,f,m,q,u;if(0!==g%2)throw Error("String of HEX type must be in byte increments");c=c||[0];d=d||0;q=d>>>3;u=-1===b?3:0;for(l=0;l<g;l+=2){p=parseInt(a.substr(l,2),16);if(isNaN(p))throw Error("String of HEX type contains invalid characters");m=(l>>>1)+q;for(f=m>>>2;c.length<=f;)c.push(0);c[f]|=p<<8*(u+m%4*b)}return{value:c,binLen:4*g+d}};break;case "TEXT":c=function(c,h,d){var g,l,p=0,f,m,q,u,r,t;h=h||[0];d=d||0;q=d>>>3;if("UTF8"===a)for(t=-1===
b?3:0,f=0;f<c.length;f+=1)for(g=c.charCodeAt(f),l=[],128>g?l.push(g):2048>g?(l.push(192|g>>>6),l.push(128|g&63)):55296>g||57344<=g?l.push(224|g>>>12,128|g>>>6&63,128|g&63):(f+=1,g=65536+((g&1023)<<10|c.charCodeAt(f)&1023),l.push(240|g>>>18,128|g>>>12&63,128|g>>>6&63,128|g&63)),m=0;m<l.length;m+=1){r=p+q;for(u=r>>>2;h.length<=u;)h.push(0);h[u]|=l[m]<<8*(t+r%4*b);p+=1}else if("UTF16BE"===a||"UTF16LE"===a)for(t=-1===b?2:0,l="UTF16LE"===a&&1!==b||"UTF16LE"!==a&&1===b,f=0;f<c.length;f+=1){g=c.charCodeAt(f);
!0===l&&(m=g&255,g=m<<8|g>>>8);r=p+q;for(u=r>>>2;h.length<=u;)h.push(0);h[u]|=g<<8*(t+r%4*b);p+=2}return{value:h,binLen:8*p+d}};break;case "B64":c=function(a,c,d){var g=0,l,p,f,m,q,u,r,t;if(-1===a.search(/^[a-zA-Z0-9=+\/]+$/))throw Error("Invalid character in base-64 string");p=a.indexOf("=");a=a.replace(/\=/g,"");if(-1!==p&&p<a.length)throw Error("Invalid '=' found in base-64 string");c=c||[0];d=d||0;u=d>>>3;t=-1===b?3:0;for(p=0;p<a.length;p+=4){q=a.substr(p,4);for(f=m=0;f<q.length;f+=1)l="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(q[f]),
m|=l<<18-6*f;for(f=0;f<q.length-1;f+=1){r=g+u;for(l=r>>>2;c.length<=l;)c.push(0);c[l]|=(m>>>16-8*f&255)<<8*(t+r%4*b);g+=1}}return{value:c,binLen:8*g+d}};break;case "BYTES":c=function(a,c,d){var g,l,p,f,m,q;c=c||[0];d=d||0;p=d>>>3;q=-1===b?3:0;for(l=0;l<a.length;l+=1)g=a.charCodeAt(l),m=l+p,f=m>>>2,c.length<=f&&c.push(0),c[f]|=g<<8*(q+m%4*b);return{value:c,binLen:8*a.length+d}};break;case "ARRAYBUFFER":try{c=new ArrayBuffer(0)}catch(e){throw Error("ARRAYBUFFER not supported by this environment");}c=
function(a,c,d){var g,l,p,f,m,q;c=c||[0];d=d||0;l=d>>>3;m=-1===b?3:0;q=new Uint8Array(a);for(g=0;g<a.byteLength;g+=1)f=g+l,p=f>>>2,c.length<=p&&c.push(0),c[p]|=q[g]<<8*(m+f%4*b);return{value:c,binLen:8*a.byteLength+d}};break;default:throw Error("format must be HEX, TEXT, B64, BYTES, or ARRAYBUFFER");}return c}function y(c,a){return c<<a|c>>>32-a}function S(c,a){return 32<a?(a-=32,new b(c.b<<a|c.a>>>32-a,c.a<<a|c.b>>>32-a)):0!==a?new b(c.a<<a|c.b>>>32-a,c.b<<a|c.a>>>32-a):c}function w(c,a){return c>>>
a|c<<32-a}function t(c,a){var k=null,k=new b(c.a,c.b);return k=32>=a?new b(k.a>>>a|k.b<<32-a&4294967295,k.b>>>a|k.a<<32-a&4294967295):new b(k.b>>>a-32|k.a<<64-a&4294967295,k.a>>>a-32|k.b<<64-a&4294967295)}function T(c,a){var k=null;return k=32>=a?new b(c.a>>>a,c.b>>>a|c.a<<32-a&4294967295):new b(0,c.a>>>a-32)}function aa(c,a,b){return c&a^~c&b}function ba(c,a,k){return new b(c.a&a.a^~c.a&k.a,c.b&a.b^~c.b&k.b)}function U(c,a,b){return c&a^c&b^a&b}function ca(c,a,k){return new b(c.a&a.a^c.a&k.a^a.a&
k.a,c.b&a.b^c.b&k.b^a.b&k.b)}function da(c){return w(c,2)^w(c,13)^w(c,22)}function ea(c){var a=t(c,28),k=t(c,34);c=t(c,39);return new b(a.a^k.a^c.a,a.b^k.b^c.b)}function fa(c){return w(c,6)^w(c,11)^w(c,25)}function ga(c){var a=t(c,14),k=t(c,18);c=t(c,41);return new b(a.a^k.a^c.a,a.b^k.b^c.b)}function ha(c){return w(c,7)^w(c,18)^c>>>3}function ia(c){var a=t(c,1),k=t(c,8);c=T(c,7);return new b(a.a^k.a^c.a,a.b^k.b^c.b)}function ja(c){return w(c,17)^w(c,19)^c>>>10}function ka(c){var a=t(c,19),k=t(c,61);
c=T(c,6);return new b(a.a^k.a^c.a,a.b^k.b^c.b)}function G(c,a){var b=(c&65535)+(a&65535);return((c>>>16)+(a>>>16)+(b>>>16)&65535)<<16|b&65535}function la(c,a,b,e){var h=(c&65535)+(a&65535)+(b&65535)+(e&65535);return((c>>>16)+(a>>>16)+(b>>>16)+(e>>>16)+(h>>>16)&65535)<<16|h&65535}function H(c,a,b,e,h){var d=(c&65535)+(a&65535)+(b&65535)+(e&65535)+(h&65535);return((c>>>16)+(a>>>16)+(b>>>16)+(e>>>16)+(h>>>16)+(d>>>16)&65535)<<16|d&65535}function ma(c,a){var d,e,h;d=(c.b&65535)+(a.b&65535);e=(c.b>>>16)+
(a.b>>>16)+(d>>>16);h=(e&65535)<<16|d&65535;d=(c.a&65535)+(a.a&65535)+(e>>>16);e=(c.a>>>16)+(a.a>>>16)+(d>>>16);return new b((e&65535)<<16|d&65535,h)}function na(c,a,d,e){var h,n,g;h=(c.b&65535)+(a.b&65535)+(d.b&65535)+(e.b&65535);n=(c.b>>>16)+(a.b>>>16)+(d.b>>>16)+(e.b>>>16)+(h>>>16);g=(n&65535)<<16|h&65535;h=(c.a&65535)+(a.a&65535)+(d.a&65535)+(e.a&65535)+(n>>>16);n=(c.a>>>16)+(a.a>>>16)+(d.a>>>16)+(e.a>>>16)+(h>>>16);return new b((n&65535)<<16|h&65535,g)}function oa(c,a,d,e,h){var n,g,l;n=(c.b&
65535)+(a.b&65535)+(d.b&65535)+(e.b&65535)+(h.b&65535);g=(c.b>>>16)+(a.b>>>16)+(d.b>>>16)+(e.b>>>16)+(h.b>>>16)+(n>>>16);l=(g&65535)<<16|n&65535;n=(c.a&65535)+(a.a&65535)+(d.a&65535)+(e.a&65535)+(h.a&65535)+(g>>>16);g=(c.a>>>16)+(a.a>>>16)+(d.a>>>16)+(e.a>>>16)+(h.a>>>16)+(n>>>16);return new b((g&65535)<<16|n&65535,l)}function B(c,a){return new b(c.a^a.a,c.b^a.b)}function A(c){var a=[],d;if("SHA-1"===c)a=[1732584193,4023233417,2562383102,271733878,3285377520];else if(0===c.lastIndexOf("SHA-",0))switch(a=
[3238371032,914150663,812702999,4144912697,4290775857,1750603025,1694076839,3204075428],d=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225],c){case "SHA-224":break;case "SHA-256":a=d;break;case "SHA-384":a=[new b(3418070365,a[0]),new b(1654270250,a[1]),new b(2438529370,a[2]),new b(355462360,a[3]),new b(1731405415,a[4]),new b(41048885895,a[5]),new b(3675008525,a[6]),new b(1203062813,a[7])];break;case "SHA-512":a=[new b(d[0],4089235720),new b(d[1],2227873595),
new b(d[2],4271175723),new b(d[3],1595750129),new b(d[4],2917565137),new b(d[5],725511199),new b(d[6],4215389547),new b(d[7],327033209)];break;default:throw Error("Unknown SHA variant");}else if(0===c.lastIndexOf("SHA3-",0)||0===c.lastIndexOf("SHAKE",0))for(c=0;5>c;c+=1)a[c]=[new b(0,0),new b(0,0),new b(0,0),new b(0,0),new b(0,0)];else throw Error("No SHA variants supported");return a}function K(c,a){var b=[],e,d,n,g,l,p,f;e=a[0];d=a[1];n=a[2];g=a[3];l=a[4];for(f=0;80>f;f+=1)b[f]=16>f?c[f]:y(b[f-
3]^b[f-8]^b[f-14]^b[f-16],1),p=20>f?H(y(e,5),d&n^~d&g,l,1518500249,b[f]):40>f?H(y(e,5),d^n^g,l,1859775393,b[f]):60>f?H(y(e,5),U(d,n,g),l,2400959708,b[f]):H(y(e,5),d^n^g,l,3395469782,b[f]),l=g,g=n,n=y(d,30),d=e,e=p;a[0]=G(e,a[0]);a[1]=G(d,a[1]);a[2]=G(n,a[2]);a[3]=G(g,a[3]);a[4]=G(l,a[4]);return a}function Z(c,a,b,e){var d;for(d=(a+65>>>9<<4)+15;c.length<=d;)c.push(0);c[a>>>5]|=128<<24-a%32;a+=b;c[d]=a&4294967295;c[d-1]=a/4294967296|0;a=c.length;for(d=0;d<a;d+=16)e=K(c.slice(d,d+16),e);return e}function L(c,
a,k){var e,h,n,g,l,p,f,m,q,u,r,t,v,w,y,A,z,x,F,B,C,D,E=[],J;if("SHA-224"===k||"SHA-256"===k)u=64,t=1,D=Number,v=G,w=la,y=H,A=ha,z=ja,x=da,F=fa,C=U,B=aa,J=d;else if("SHA-384"===k||"SHA-512"===k)u=80,t=2,D=b,v=ma,w=na,y=oa,A=ia,z=ka,x=ea,F=ga,C=ca,B=ba,J=V;else throw Error("Unexpected error in SHA-2 implementation");k=a[0];e=a[1];h=a[2];n=a[3];g=a[4];l=a[5];p=a[6];f=a[7];for(r=0;r<u;r+=1)16>r?(q=r*t,m=c.length<=q?0:c[q],q=c.length<=q+1?0:c[q+1],E[r]=new D(m,q)):E[r]=w(z(E[r-2]),E[r-7],A(E[r-15]),E[r-
16]),m=y(f,F(g),B(g,l,p),J[r],E[r]),q=v(x(k),C(k,e,h)),f=p,p=l,l=g,g=v(n,m),n=h,h=e,e=k,k=v(m,q);a[0]=v(k,a[0]);a[1]=v(e,a[1]);a[2]=v(h,a[2]);a[3]=v(n,a[3]);a[4]=v(g,a[4]);a[5]=v(l,a[5]);a[6]=v(p,a[6]);a[7]=v(f,a[7]);return a}function D(c,a){var d,e,h,n,g=[],l=[];if(null!==c)for(e=0;e<c.length;e+=2)a[(e>>>1)%5][(e>>>1)/5|0]=B(a[(e>>>1)%5][(e>>>1)/5|0],new b(c[e+1],c[e]));for(d=0;24>d;d+=1){n=A("SHA3-");for(e=0;5>e;e+=1){h=a[e][0];var p=a[e][1],f=a[e][2],m=a[e][3],q=a[e][4];g[e]=new b(h.a^p.a^f.a^
m.a^q.a,h.b^p.b^f.b^m.b^q.b)}for(e=0;5>e;e+=1)l[e]=B(g[(e+4)%5],S(g[(e+1)%5],1));for(e=0;5>e;e+=1)for(h=0;5>h;h+=1)a[e][h]=B(a[e][h],l[e]);for(e=0;5>e;e+=1)for(h=0;5>h;h+=1)n[h][(2*e+3*h)%5]=S(a[e][h],W[e][h]);for(e=0;5>e;e+=1)for(h=0;5>h;h+=1)a[e][h]=B(n[e][h],new b(~n[(e+1)%5][h].a&n[(e+2)%5][h].a,~n[(e+1)%5][h].b&n[(e+2)%5][h].b));a[0][0]=B(a[0][0],X[d])}return a}var d,V,W,X;d=[1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,
1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,
2227730452,2361852424,2428436474,2756734187,3204031479,3329325298];V=[new b(d[0],3609767458),new b(d[1],602891725),new b(d[2],3964484399),new b(d[3],2173295548),new b(d[4],4081628472),new b(d[5],3053834265),new b(d[6],2937671579),new b(d[7],3664609560),new b(d[8],2734883394),new b(d[9],1164996542),new b(d[10],1323610764),new b(d[11],3590304994),new b(d[12],4068182383),new b(d[13],991336113),new b(d[14],633803317),new b(d[15],3479774868),new b(d[16],2666613458),new b(d[17],944711139),new b(d[18],2341262773),
new b(d[19],2007800933),new b(d[20],1495990901),new b(d[21],1856431235),new b(d[22],3175218132),new b(d[23],2198950837),new b(d[24],3999719339),new b(d[25],766784016),new b(d[26],2566594879),new b(d[27],3203337956),new b(d[28],1034457026),new b(d[29],2466948901),new b(d[30],3758326383),new b(d[31],168717936),new b(d[32],1188179964),new b(d[33],1546045734),new b(d[34],1522805485),new b(d[35],2643833823),new b(d[36],2343527390),new b(d[37],1014477480),new b(d[38],1206759142),new b(d[39],344077627),
new b(d[40],1290863460),new b(d[41],3158454273),new b(d[42],3505952657),new b(d[43],106217008),new b(d[44],3606008344),new b(d[45],1432725776),new b(d[46],1467031594),new b(d[47],851169720),new b(d[48],3100823752),new b(d[49],1363258195),new b(d[50],3750685593),new b(d[51],3785050280),new b(d[52],3318307427),new b(d[53],3812723403),new b(d[54],2003034995),new b(d[55],3602036899),new b(d[56],1575990012),new b(d[57],1125592928),new b(d[58],2716904306),new b(d[59],442776044),new b(d[60],593698344),new b(d[61],
3733110249),new b(d[62],2999351573),new b(d[63],3815920427),new b(3391569614,3928383900),new b(3515267271,566280711),new b(3940187606,3454069534),new b(4118630271,4000239992),new b(116418474,1914138554),new b(174292421,2731055270),new b(289380356,3203993006),new b(460393269,320620315),new b(685471733,587496836),new b(852142971,1086792851),new b(1017036298,365543100),new b(1126000580,2618297676),new b(1288033470,3409855158),new b(1501505948,4234509866),new b(1607167915,987167468),new b(1816402316,
1246189591)];X=[new b(0,1),new b(0,32898),new b(2147483648,32906),new b(2147483648,2147516416),new b(0,32907),new b(0,2147483649),new b(2147483648,2147516545),new b(2147483648,32777),new b(0,138),new b(0,136),new b(0,2147516425),new b(0,2147483658),new b(0,2147516555),new b(2147483648,139),new b(2147483648,32905),new b(2147483648,32771),new b(2147483648,32770),new b(2147483648,128),new b(0,32778),new b(2147483648,2147483658),new b(2147483648,2147516545),new b(2147483648,32896),new b(0,2147483649),
new b(2147483648,2147516424)];W=[[0,36,3,41,18],[1,44,10,45,2],[62,6,43,15,61],[28,55,25,21,56],[27,20,39,8,14]];"function"===typeof define&&define.amd?define(function(){return C}):"undefined"!==typeof exports?("undefined"!==typeof module&&module.exports&&(module.exports=C),exports=C):Y.jsSHA=C})(this);

},{}]},{},[1]);
