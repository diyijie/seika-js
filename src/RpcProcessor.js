import { logger } from './Logger';
import { joinPath, reply, RpcInfoTemplate, RpcMethodTemplate, RpcStyleTemplate } from './Kit';
import Message from './Message';

class RpcInfo {
    constructor(processor) {
        this.processor = processor;
    }

    index() {
        var p = this.processor;
        var res = new Message();
        res.status = 200;
        res.headers['Content-Type'] = 'text/html; charset=utf8';

        var info = '';
        for (var urlPath in p.urlPath2Methods) {
            var m = p.urlPath2Methods[urlPath];
            if(!m.docEnabled) continue;
            var args = m.paramsString; 
            var link = joinPath(p.rootUrl, m.urlPath); 
            info += RpcMethodTemplate.format(link, m.method, args); 
        }
        res.body = RpcInfoTemplate.format(p.rootUrl, RpcStyleTemplate, info); 
        return res;
    }
}
 
class RpcProcessor {
    constructor() {   
        this.urlPath2Methods = {};  
        this.rootUrl = "/";
        this.docUrl = "/doc";
        this.docEnabled = true;
    } 
 
    _matchMethod(module, method){
        if(!module) module = '';   
        var methods = this.module2methods[module];
        if(methods == null){
            return null;
        }  
        return methods[method]; 
    } 

    _parseParams(s){
        var bb = s.split('?');
        var params = bb[0].split('/').filter(s=>s.length>0);
        var kvs = bb.slice(1).join('?');
        var last = {};
        var kvpairs = kvs.split('&').filter(s=>s.length>0);
        if(kvpairs.length>0){
            params.push(last);
        }
        for(var kv of kvpairs){
            var a = kv.split('=');
            if(a.length>1){
                last[a[0]] = a[1];
            }
        } 
        return params;
    }

    process(req, res) {  
        var url = req.url;
        if(!url){
            reply(res, 400, `Missing url in request`); 
            return;
        } 
        var m = null, urlPath = null, length = 0;
        for(var path in this.urlPath2Methods){
            if(url.startsWith(path)){
                if(path.length > length){
                    length = path.length;
                    urlPath = path;
                    m = this.urlPath2Methods[path];
                }
            }
        } 
        if(m == null){
            reply(res, 404, `Url=${url} Not Found`); 
            return;
        }   

        var params = [];
        if(req.body){
            if(!(req.body instanceof Array)){
                req.body = JSON.parse(req.body);
            } 
            params = req.body;
        }  else {
            var subUrl = url.substr(urlPath.length);
            params = this._parseParams(subUrl);
        }  
        
        var result = m.instance.apply(m.target, params);

        if(result instanceof Message){ 
            res.replace(result); 
        } else {
            res.status = 200;
            res.headers['Content-Type'] = 'application/json; charset=utf8;'
            res.body = result;
        }
    }

    _addMethod(urlPath, methodObject, target, docEnabled){    
        var urlPath = joinPath(urlPath);
        var methodName = methodObject.name;
        if(docEnabled === undefined) docEnabled = true;
        var m = { 
            urlPath: urlPath,
            method: methodName,
            paramsString: '',
            instance: methodObject,
            target: target,
            docEnabled: docEnabled
        };  

        if(urlPath in this.urlPath2Methods){
            logger.warn(`Url=${urlPath}, Method=${methodName} exists`);
        } 
        this.urlPath2Methods[urlPath] = m;  
        return m;
    } 

    mount(module, objectOrFunc, target, docEnabled) {   
        if (typeof (objectOrFunc) == 'function') {    //module as method name
            this._addMethod(module, objectOrFunc, target, docEnabled);
            return;
        } 

        var methods = this._getAllMethods(objectOrFunc);
        for (var methdName of methods) {
            var methodObject = objectOrFunc[methdName];   
            var urlPath = joinPath(module, methodObject.name);
            var info = this._addMethod(urlPath, methodObject, objectOrFunc, docEnabled);
            info.paramsString = this._getFnParamNames(methodObject.toString());  
        }
    }

    mountDoc() {
        if(!this.docEnabled) return;
        var info = new RpcInfo(this);
        this.mount(this.docUrl, info.index, info, false);  
    } 

    _getFnParamNames(fn) {
        var fstr = fn.toString();
        return fstr.match(/\(.*?\)/)[0].replace(/[()]/gi, '').replace(/\s/gi, '').split(',');
    } 

    _getAllMethods(obj) {
        let methods = new Set();
        for (var name in obj) {
            var func = obj[name];
            if (typeof func == 'function') {
                methods.add(name);
            }
        }
        while (obj = Reflect.getPrototypeOf(obj)) {
            if (obj.constructor == Object) break;
            let keys = Reflect.ownKeys(obj)
            keys.forEach((k) => {
                if (k == 'constructor') return false;
                methods.add(k);
            });
        }
        return methods;
    }
}

export default RpcProcessor;