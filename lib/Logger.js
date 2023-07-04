"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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