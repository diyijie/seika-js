import { logger } from './Logger';
import { joinPath, reply } from './Kit';
import MqClient from './MqClient';
import Message from './Message';
 
class RpcServer {
    constructor(processor) {
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

    enableAuth(apiKey, secretKey, authEnabled=true){
        this.authEnabled = authEnabled;
        this.apiKey = apiKey;
        this.secretKey = secretKey;
    }

    start() {
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
        this.processor.rootUrl = joinPath("/", this.mq);
        var processor = this.processor;  

        for (var i = 0; i < this.clientCount; i++) {
            var client = new MqClient(this.mqServerAddress);
            if(this.authEnabled){
                client.authEnabled = this.authEnabled;
                client.apiKey = this.apiKey;
                client.secretKey = this.secretKey;
            }

            client.onopen = () => {
                var msg = {};
                msg.headers = {
                    cmd: 'create',
                    mq: this.mq,
                    mqType: this.mqType,
                    mqMask: this.mqMask,
                    channel: this.channel
                };
                client.invoke(msg).then(res => {
                    logger.info(res);
                });
                msg = {};
                msg.headers = { cmd: 'sub', mq: this.mq, channel: this.channel };
                client.invoke(msg).then(res => {
                    logger.info(res);
                }); 
            };

            client.addMqHandler(this.mq, this.channel, (req) => {
                var id = req.headers.id;
                var target = req.headers.source;  
                var url = req.url;
                var urlPrefix = processor.rootUrl;
                if(url && url.startsWith(urlPrefix)){
                    url = url.substr(urlPrefix.length);
                    url = joinPath("/", url);
                    req.url = url;
                }

                var res = new Message();
                try {
                    processor.process(req, res);
                } catch(e) {
                    logger.error(e);
                    res.headers['Content-Type'] = 'text/plain; charset=utf8;'
                    reply(res, 500, e); 
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

    close() {
        for (var client of this.clients) {
            client.close();
        }
        this.clients = [];
    } 
}

export default RpcServer;
