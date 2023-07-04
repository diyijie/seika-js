'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Logger = require('./Logger');

var _Kit = require('./Kit');

var _Message = require('./Message');

var _Message2 = _interopRequireDefault(_Message);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
            res.headers['Content-Type'] = 'text/html; charset=utf8';

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
                res.headers['Content-Type'] = 'application/json; charset=utf8;';
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