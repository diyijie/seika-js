
import { logger } from './Logger';
import WebsocketClient from './WebsocketClient';
import Message from './Message';

class MqClient extends WebsocketClient {
    constructor(address) {
        super(address);
        this.heartbeatMessage = {headers: { cmd: "ping" } }; 

        this.mqHandlerTable = {}; //mq=>{channle=>handler}
        this.onmessage = msg => {
            if(!msg.headers){
                logger.warn("missing headers in message: " + JSON.stringify(msg));
            }
            var mq = msg.headers.mq, channel = msg.headers.channel;
            if (mq == null || channel == null) {
                logger.warn("missing mq or channel in message headers: " + JSON.stringify(msg));
            }
            var mqHandlers = this.mqHandlerTable[mq];
            if (mqHandlers == null) {
                return;
            }
            var mqHandler = mqHandlers[channel];
            if (mqHandler == null) return;

            const window = msg.headers.window;
            mqHandler.handler(msg)
            if(window<=mqHandler.window/2){
                const sub = new Message();
                sub.headers.cmd = 'sub';
                sub.headers.mq = mq;
                sub.headers.channel = channel;
                sub.headers.window = mqHandler.window;
                sub.headers.ack = false;

                this.send(sub, mqHandler.beforesend);
            }
        };
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
    addMqHandler(mq, channel, callback=null, window=1, beforsend=null) {
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
}

export default MqClient;