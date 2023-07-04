import { joinPath } from './Kit';
import Message from './Message';

class _RpcInvoker {
    constructor(client, urlPrefix) {  
        this.client = client; 
        this.urlPrefix = urlPrefix; 
    } 

    invoke(...args) {
        args = args || [];
        if (args.length < 1) {
            throw "Missing request parameter";
        } 
        var msg;
        var req = args[0]; 
        if (typeof (req) == 'string') {
            var params = [];
            var len = args.length;
            for (var i = 1; i < len; i++) {
                params.push(args[i]);
            }
            msg = new Message();
            msg.url = joinPath(this.urlPrefix, req);
            msg.body = params;  
        } else if (req.constructor == Message) {
            //just what we need
            msg = req;
        } else {
            msg = new Message();
            msg.replace(req); 
        } 
        return this.client._invoke(msg);
    }  
    
    proxyMethod(method) {
        const invoker = this;
        return function (...args) {
            args = args || [];
            const len = args.length;
            const params = [];
            for (var i = 0; i < len; i++) {
                params.push(args[i]);
            }

            const msg = new Message();
            msg.url = joinPath(invoker.urlPrefix, method); 
            msg.body = params;
            return invoker.invoke(msg);
        }
    }
} 


class RpcInvoker extends Function {
    constructor(client, urlPrefix) {
        super();
        this.invoker = new _RpcInvoker(client, urlPrefix); 

        const invoker = this.invoker;
        this.proxy = new Proxy(invoker, {
            get: function (target, name) {
                return name in target ? target[name] : invoker.proxyMethod(name);
            }, 
            apply: function(target, thisArg, argumentList) {
                return invoker.proxyMethod("")(...argumentList); 
            }
        });
        return this.proxy;
    }  
} 

export default RpcInvoker;