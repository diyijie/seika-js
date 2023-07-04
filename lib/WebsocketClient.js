'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Ticket = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _isomorphicWs = require('isomorphic-ws');

var _isomorphicWs2 = _interopRequireDefault(_isomorphicWs);

var _Logger = require('./Logger');

var _Kit = require('./Kit');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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