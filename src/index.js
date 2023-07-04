import Protocol from './Protocol';
import { Logger } from './Logger'; 
import WebsocketClient from './WebsocketClient';
import MqClient from './MqClient';
import RpcProcessor from './RpcProcessor';
import RpcClient from './RpcClient';
import RpcServer from './RpcServer';
import Message from './Message'; 

import { signMessage, signHttpRequest, calcSignature } from './Kit'; 

export { Protocol }; 
export { Logger };
export { WebsocketClient };
export { MqClient };
export { RpcProcessor };
export { RpcClient }; 
export { RpcServer };
export { Message };
export { signMessage, signHttpRequest, calcSignature};

if (typeof window != 'undefined') {
    window.Protocol = Protocol;
    window.Logger = Logger;
    window.WebsocketClient = WebsocketClient;
    window.MqClient = MqClient;
    window.RpcProcessor = RpcProcessor;
    window.RpcClient = RpcClient;
    window.RpcServer = RpcServer;
    window.Message = Message;
    
    window.signMessage = signMessage;
    window.signHttpRequest = signHttpRequest;
    window.calcSignature = calcSignature;
}