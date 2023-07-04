'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.RpcMethodTemplate = exports.RpcStyleTemplate = exports.RpcInfoTemplate = exports.reply = exports.joinPath = exports.signMessage = exports.signHttpRequest = exports.calcSignature = exports.uuid = undefined;

var _jssha = require('jssha');

var _jssha2 = _interopRequireDefault(_jssha);

var _jsonStableStringify = require('json-stable-stringify');

var _jsonStableStringify2 = _interopRequireDefault(_jsonStableStringify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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