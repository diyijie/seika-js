'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Logger = require('./Logger');

var _Kit = require('./Kit');

var _MqClient = require('./MqClient');

var _MqClient2 = _interopRequireDefault(_MqClient);

var _Message = require('./Message');

var _Message2 = _interopRequireDefault(_Message);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
                        res.headers['Content-Type'] = 'text/plain; charset=utf8;';
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