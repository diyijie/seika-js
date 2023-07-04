
import { joinPath, signMessage } from './Kit'; 
import WebsocketClient from './WebsocketClient';
import RpcInvoker from './RpcInvoker';

/**
 * Browser ajax client talk to zbus
 */
class AjaxClient { 
    constructor(){
        this.authEnabled = false;
        this.apiKey = "";
        this.secretKey = "";
        this.signFields = "url,method,body,h.*";
    }

    invoke(msg, beforeSend){
        if(beforeSend){
            beforeSend(msg);
        }
        if(!msg.method) msg.method = 'POST'; //set default value 
        if(!msg.headers['Content-Type']) msg.headers['Content-Type'] = 'application/json';
        
        if(this.authEnabled){
            msg.headers.signFields = this.signFields;
            signMessage(this.apiKey, this.secretKey, msg);
        }

        var method = msg.method; 
        const client = new XMLHttpRequest();
        var success;
        var failure;
        const promise = new Promise((resolve, reject) => {
            success = resolve;
            failure = reject;
        });
    
        client.onload = (e)=>{
            var res = client.responseText;
            if(success) {
                var contentType = client.getResponseHeader("content-type");
                if(!contentType) contentType = client.getResponseHeader("Content-Type");
                if(contentType && contentType.startsWith("application/json")){
                    try{
                        res = JSON.parse(res);
                    } catch(e){
                        //ignore
                    }
                }
                success(res);
            }
        }; 
        client.onerror = (e)=>{
            if(failure){
                failure(e);
            }
        }; 
        client.open(method, msg.url);
        for(var key in msg.headers){
            client.setRequestHeader(key, msg.headers[key]);
        } 
        client.send(JSON.stringify(msg.body));
        return promise;
    }
}

class RpcClient {
    constructor(address, urlPrefix) {
        if(address) {
            this.wsClient = new WebsocketClient(address);
            this.wsClient.heartbeatMessage = { headers: { cmd: 'ping' } }; 
        } else {
            this.ajaxClient = new AjaxClient();
        }
        this.urlPrefix = urlPrefix; 
        if(!this.urlPrefix) this.urlPrefix = "";

        this.authEnabled = false;
        this.apiKey = "";
        this.secretKey = ""; 
        this.signFields = "url,method,body,h.*";

        this.defaultInvoker = this.module("");
        const client = this;
        this.proxy = new Proxy(this, {
            get: function (target, name) {
                return name in target ? target[name] : client.module(name);
            }
        }); 
        return this.proxy;
    }  

    enableAuth(apiKey, secretKey, authEnabled=true){
        this.authEnabled = authEnabled;
        this.apiKey = apiKey;
        this.secretKey = secretKey;
    }

    module(moduleName){

        if(this.authEnabled){
            var client = this.wsClient;
            if(this.ajaxClient){
                client = this.ajaxClient;
            }
            client.authEnabled = this.authEnabled;
            client.apiKey = this.apiKey;
            client.secretKey = this.secretKey;
            client.signFields = this.signFields;
        }

        var urlPrefix = joinPath(this.urlPrefix, moduleName);
        return new RpcInvoker(this, urlPrefix);  
    }  

    invoke(...args){
        args = args || [];
        return this.defaultInvoker.invoke(...args);
    }

    _invoke(req) {
        if(this.wsClient){
            return this._wsInvoke(req);
        } else {
            return this.ajaxClient.invoke(req);
        }
    } 

    _wsInvoke(req) {
        var p;
        if (!this.wsClient.active()) {
            p = this.wsClient.connect().then(() => {
                return this.wsClient.invoke(req);
            });
        } else {
            p = this.wsClient.invoke(req);
        }

        return p.then(res => {
            if (res.status != 200) {
                throw res.body;
            }
            return res.body;
        });
    } 

    close(){
        if(this.wsClient){
            this.wsClient.close();
            this.wsClient = null;
        }
    }
}

export default RpcClient;