'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Logger = require('./Logger');

var _WebsocketClient2 = require('./WebsocketClient');

var _WebsocketClient3 = _interopRequireDefault(_WebsocketClient2);

var _Message = require('./Message');

var _Message2 = _interopRequireDefault(_Message);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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