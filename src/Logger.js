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
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}  

class Logger {
    constructor(level) {
        this.level = level;
        if (!level) {
            this.level = Logger.DEBUG;
        }

        this.DEBUG = 0;
        this.INFO = 1;
        this.WARN = 2;
        this.ERROR = 3;
    }

    debug(...args) { this._log(this.DEBUG, ...args); }
    info(...args) { this._log(this.INFO, ...args); }
    warn(...args) { this._log(this.WARN, ...args); }
    error(...args) { this._log(this.ERROR, ...args); }

    log(level, ...args) { this._log(level, ...args); }

    _log(level, ...args) {
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
        console.log(new Date().format("yyyy/MM/dd hh:mm:ss.S"), ...this._format(args));
    }

    _format(args) {
        args = args || [];
        var stackInfo = this._getStackInfo(2) //info => _log => _format  back 2

        if (stackInfo) {
            var calleeStr = stackInfo.relativePath + ':' + stackInfo.line;
            if (typeof (args[0]) === 'string') {
                args[0] = calleeStr + ' ' + args[0]
            } else {
                args.unshift(calleeStr)
            }
        }
        return args
    }

    _getStackInfo(stackIndex) {
        // get all file, method, and line numbers
        var stacklist = (new Error()).stack.split('\n').slice(3)

        // stack trace format: http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
        // do not remove the regex expresses to outside of this method (due to a BUG in node.js)
        var stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi
        var stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi

        var s = stacklist[stackIndex] || stacklist[0]
        var sp = stackReg.exec(s) || stackReg2.exec(s)

        if (sp && sp.length === 5) {
            return {
                method: sp[1],
                relativePath: sp[2].replace(/^.*[\\\/]/, ''),
                line: sp[3],
                pos: sp[4],
                file: sp[2],
                stack: stacklist.join('\n')
            }
        }
    }
}  
export { Logger };

export const logger = new Logger(Logger.INFO);